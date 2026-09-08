/* ============================================================================
 * app/engine/construction.js - What to build first, and how long it takes.
 * ---------------------------------------------------------------------------
 * EN: Two questions, and the second one is the interesting one.
 *
 *     (1) ORDER. If you build the Steel Mill before the Iron Mine, the mill
 *         sits idle and loses you money for a decade. So we sort the chain so
 *         that whatever feeds something else is built first. The chain can
 *         contain loops (steel -> tools -> steel); we break those at the
 *         cheapest node and say which one we broke, rather than hanging.
 *
 *     (2) TIME, AND WHY IT IS NOT DIVISION. The naive answer is
 *         totalCost ÷ pointsPerWeek. That is wrong whenever the plan contains
 *         Construction Sectors, because each one you finish makes every
 *         remaining building arrive sooner. The curve bends. Building 10
 *         construction sectors first and then your industry is routinely
 *         faster than building the industry directly, even though it is more
 *         total work - and no amount of dividing will show you that.
 *
 *         So we simulate week by week:
 *
 *           every week:
 *             available = weekly construction points
 *             walk the queue front to back:
 *                give each site up to `maxWeeklyPerBuilding`, while points last
 *             any Construction Sector level that finishes this week
 *                raises `weekly construction points` from next week on
 *
 *         That is the "exponential" behaviour, and you can switch it off
 *         (Settings -> count construction sectors) to see the flat estimate
 *         next to it.
 *
 * RU: Два вопроса, и интересен именно второй.
 *
 *     (1) ПОРЯДОК. Если построить сталелитейный до железного рудника, завод
 *         простоит без дела десять лет. Поэтому мы сортируем цепочку так,
 *         чтобы то, что питает других, строилось раньше. В цепочке бывают
 *         циклы (сталь -> инструменты -> сталь); мы разрываем их на самом
 *         дешёвом узле и сообщаем, где разорвали, а не зависаем.
 *
 *     (2) ВРЕМЯ, И ПОЧЕМУ ЭТО НЕ ДЕЛЕНИЕ. Наивный ответ - общая стоимость
 *         ÷ очки в неделю. Он неверен всегда, когда в плане есть строительные
 *         секторы: каждый достроенный ускоряет все оставшиеся здания. Кривая
 *         гнётся. Построить сначала 10 строительных секторов, а потом
 *         промышленность, обычно БЫСТРЕЕ, чем строить промышленность сразу -
 *         хотя работы больше. Никаким делением это не увидеть.
 *
 *         Поэтому мы моделируем по неделям, и это можно отключить в настройках,
 *         чтобы увидеть рядом плоскую оценку.
 * ==========================================================================*/
(function (V3) {
  'use strict';

  var C = V3.Construction = {};

  /** Buildings whose output IS construction points. */
  function isConstructionSector(buildingId) {
    var b = V3.db.building(buildingId);
    return !!(b && b.abstractOutput === 'construction');
  }

  /**
   * Tarjan's strongly-connected-components algorithm, iterative so a very deep
   * chain cannot blow the stack.
   *
   * @param ids   node ids
   * @param deps  { id: { dependencyId: true } }  - edges point at what must exist first
   * @param byId  only ids present here are followed
   * @returns array of components (arrays of ids), each emitted only after every
   *          component it depends on - i.e. already in build order.
   */
  function tarjanSCC(ids, deps, byId) {
    var index = 0;
    var indices = {}, low = {}, onStack = {}, stack = [];
    var out = [];

    ids.forEach(function (start) {
      if (indices[start] !== undefined) return;

      // Explicit work stack: [nodeId, iterator position into its edges]
      var work = [[start, 0]];
      while (work.length) {
        var frame = work[work.length - 1];
        var v = frame[0];

        if (frame[1] === 0) {
          indices[v] = low[v] = index++;
          stack.push(v);
          onStack[v] = true;
        }

        var edges = Object.keys(deps[v] || {}).filter(function (d) { return byId[d]; });
        var recursed = false;

        while (frame[1] < edges.length) {
          var w = edges[frame[1]];
          frame[1]++;
          if (indices[w] === undefined) {
            work.push([w, 0]);
            recursed = true;
            break;
          } else if (onStack[w]) {
            low[v] = Math.min(low[v], indices[w]);
          }
        }
        if (recursed) continue;

        // Done with v: fold its finished children's low-links in.
        if (low[v] === indices[v]) {
          var comp = [];
          var w2;
          do {
            w2 = stack.pop();
            onStack[w2] = false;
            comp.push(w2);
          } while (w2 !== v);
          out.push(comp);
        }
        work.pop();
        if (work.length) {
          var parent = work[work.length - 1][0];
          low[parent] = Math.min(low[parent], low[v]);
        }
      }
    });

    return out;
  }

  // ===========================================================================
  // (1) BUILD ORDER
  // ===========================================================================

  /**
   * Order the nodes of a solution.
   * @param mode 'fastest' | 'cheapest' | 'selfSufficient'
   * @returns [{ node, step, reason, brokeCycle }]
   */
  C.order = function (ctx, solution, mode) {
    mode = mode || ctx.opt.buildOrderMode || 'fastest';

    var nodes = solution.nodes.filter(function (n) { return n.levelsToBuild > 0 || n.levels > 0; });
    var byId = {};
    nodes.forEach(function (n) { byId[n.buildingId] = n; });

    // Who produces each good, among the nodes we actually have.
    var producerOf = {};
    nodes.forEach(function (n) {
      Object.keys(n.outputs).forEach(function (g) {
        if (n.outputs[g] > 0 && !producerOf[g]) producerOf[g] = n.buildingId;
      });
    });

    // Edges: dependency[a] = set of building ids that must come before a.
    var deps = {};
    nodes.forEach(function (n) {
      deps[n.buildingId] = {};
      Object.keys(n.inputs).forEach(function (g) {
        if (n.inputs[g] <= 0) return;
        var p = producerOf[g];
        if (p && p !== n.buildingId) deps[n.buildingId][p] = true;
      });
    });

    // -------------------------------------------------------------------------
    // ORDERING A GRAPH THAT CONTAINS LOOPS
    //
    // A plain topological sort is the textbook answer and it does not apply:
    // a real Victoria 3 chain is one big loop. Tools need steel, steel needs
    // coal, coal mines need tools. There is no "first" building, and naive
    // algorithms respond by either hanging or producing an arbitrary order -
    // one earlier attempt here confidently told you to build the textile mill
    // before the cotton.
    //
    // The correct tool is CONDENSATION. Find the strongly connected components
    // (Tarjan), which are exactly the sets of buildings that mutually depend on
    // each other. Collapse each into a single vertex. What remains is
    // guaranteed to be acyclic, so it CAN be ordered properly - and Tarjan
    // happens to emit components in exactly the order we want: a component only
    // after everything it depends on.
    //
    // Inside a loop, someone has to go first and idle for a while. We pick the
    // member that depends least on the rest of its own loop, and label only
    // that one "cycle broken" - which is honest and actionable, instead of
    // shrugging at every building on the list.
    // -------------------------------------------------------------------------
    var components = tarjanSCC(nodes.map(function (n) { return n.buildingId; }), deps, byId);

    var sorted = [];
    components.forEach(function (comp) {
      var members = comp.map(function (id) { return byId[id]; }).filter(Boolean);
      if (members.length > 1) {
        // Inside a loop: start with whoever needs the fewest of its own
        // loop-mates, then apply the mode's preference.
        members = V3.util.sortBy(members, function (n) {
          var internal = Object.keys(deps[n.buildingId])
            .filter(function (d) { return comp.indexOf(d) >= 0; }).length;
          var tie = mode === 'cheapest'
            ? n.constructionCost
            : -(n.levelsToBuild || n.levels);
          return internal * 1e9 + tie;
        });
      }
      sorted = sorted.concat(members);
    });

    // Construction sectors jump the queue in 'fastest': every week they exist
    // earlier is a week shaved off everything behind them.
    if (mode === 'fastest') {
      var cs = sorted.filter(function (n) { return isConstructionSector(n.buildingId); });
      var rest = sorted.filter(function (n) { return !isConstructionSector(n.buildingId); });
      sorted = cs.concat(rest);
    }

    var ordered = [];
    var placed = {};
    var brokeCycle = [];

    sorted.forEach(function (n) {
      var reason;
      if (mode === 'fastest' && isConstructionSector(n.buildingId)) {
        reason = 'CONSTRUCTION_FIRST';
      } else {
        // Is anything this building needs still unbuilt at this point?
        var waiting = Object.keys(deps[n.buildingId]).filter(function (p) {
          return byId[p] && !placed[p];
        });
        if (waiting.length) {
          reason = 'CYCLE_BROKEN';
          brokeCycle.push(n.buildingId);
        } else {
          reason = mode === 'selfSufficient' ? 'NO_IMPORTS' : 'DEPENDENCY';
        }
      }
      ordered.push({ node: n, reason: reason });
      placed[n.buildingId] = true;
    });

    ordered.forEach(function (row, i) { row.step = i + 1; });
    ordered.brokeCycle = brokeCycle;
    return ordered;
  };

  // ===========================================================================
  // (2) TIME
  // ===========================================================================

  /**
   * Flat estimate: no ramp-up, just division. Shown next to the simulation so
   * you can see how much the construction sectors are buying you.
   */
  C.flatWeeks = function (ctx, totalCost, weeklyPoints) {
    var wp = weeklyPoints || C.startingPoints(ctx);
    if (wp <= 0) return Infinity;
    return totalCost / wp;
  };

  /** Construction points per week before this plan adds anything. */
  C.startingPoints = function (ctx) {
    var c = ctx.country || {};
    return V3.util.parseNum(c.constructionPoints, 0) ||
           V3.util.parseNum(c.baseWeeklyConstruction, 10);
  };

  /**
   * Week-by-week simulation.
   * @param order    output of C.order()
   * @param opts     { maxWeeklyPerBuilding, startingPoints, countRamp, maxWeeks }
   * @returns {
   *   weeks, timeline:[{week, points, finished:[]}],
   *   perItem:[{buildingId, level, startWeek, endWeek}],
   *   finalPoints, rampGain
   * }
   */
  C.simulate = function (ctx, order, opts) {
    opts = opts || {};
    var cap = opts.maxWeeklyPerBuilding || ctx.country.maxWeeklyPerBuilding || 20;
    var points = opts.startingPoints != null ? opts.startingPoints : C.startingPoints(ctx);
    var countRamp = opts.countRamp !== undefined ? opts.countRamp : ctx.opt.countConstructionSector;
    var maxWeeks = opts.maxWeeks || 52 * 120;   // the whole game is ~90 years
    var costMult = 1 + (ctx.country.govBuildingCostMult || 0);

    // Expand the order into individual LEVELS - that is the unit the game's
    // construction queue actually works in.
    var queue = [];
    order.forEach(function (row) {
      var n = row.node;
      var b = V3.db.building(n.buildingId);
      var each = ((b && b.constructionCost) || 0) * costMult;
      var count = n.levelsToBuild || 0;
      for (var i = 0; i < count; i++) {
        queue.push({
          buildingId: n.buildingId,
          levelIndex: i + 1,
          cost: each,
          remaining: each,
          startWeek: null,
          endWeek: null,
          isConstruction: isConstructionSector(n.buildingId),
          // What one finished level adds to weekly points.
          pointsWhenDone: 0
        });
      }
    });

    // Precompute what a construction sector level contributes.
    queue.forEach(function (item) {
      if (!item.isConstruction) return;
      var node = order.filter(function (r) { return r.node.buildingId === item.buildingId; })[0];
      if (!node) return;
      var per = V3.BuildingCalc.perLevel(ctx, item.buildingId, node.node.pms);
      var tp = V3.BuildingCalc.throughput(ctx, 1, 0);
      item.pointsWhenDone = (per.outputs.construction || 0) * tp;
    });

    var timeline = [];
    var week = 0;
    var startPoints = points;
    var head = 0;

    while (head < queue.length && week < maxWeeks) {
      week++;
      var budget = points;
      var finishedThisWeek = [];

      for (var i = head; i < queue.length && budget > 0; i++) {
        var item = queue[i];
        if (item.remaining <= 0) continue;
        if (item.startWeek == null) item.startWeek = week;

        var spend = Math.min(budget, cap, item.remaining);
        item.remaining -= spend;
        budget -= spend;

        if (item.remaining <= 1e-9) {
          item.endWeek = week;
          finishedThisWeek.push(item);
        }
      }

      // Advance the head past everything finished, so the queue stays cheap.
      while (head < queue.length && queue[head].remaining <= 1e-9) head++;

      // A construction sector finished this week starts paying from next week.
      var gained = 0;
      if (countRamp) {
        finishedThisWeek.forEach(function (f) { gained += f.pointsWhenDone || 0; });
      }
      points += gained;

      timeline.push({
        week: week,
        points: points,
        spent: (opts.trackSpend ? (budget) : undefined),
        finished: finishedThisWeek.map(function (f) {
          return { buildingId: f.buildingId, level: f.levelIndex };
        }),
        gained: gained
      });
    }

    var totalCost = V3.util.sum(queue, function (q) { return q.cost; });

    return {
      weeks: week,
      hitLimit: head < queue.length,
      timeline: timeline,
      perItem: queue,
      totalCost: totalCost,
      startingPoints: startPoints,
      finalPoints: points,
      rampGain: points - startPoints,
      flatWeeks: C.flatWeeks(ctx, totalCost, startPoints),
      capPerBuilding: cap
    };
  };

  // ===========================================================================
  // (3) HOW MANY CONSTRUCTION SECTORS IS IT WORTH BUILDING?
  // ===========================================================================
  /**
   * EN: There is a real optimum here, and it is not obvious.
   *
   *     Each construction sector level you add makes everything after it
   *     arrive sooner - but it also has to be built itself, and it drags in
   *     wood, iron, tools and steel, which are more buildings, which is more
   *     construction work. Too few and you crawl; too many and the last ones
   *     finish after the job they were meant to speed up.
   *
   *     So we do not guess. For each candidate count we build the whole plan
   *     again - sectors, their suppliers, everything - order it, simulate the
   *     queue week by week, and keep the count that finishes soonest.
   *
   *     The scan stops early once the time has been getting worse for a while,
   *     because the curve is U-shaped: it drops steeply, flattens, then climbs.
   *
   * RU: Здесь есть настоящий оптимум, и он неочевиден.
   *
   *     Каждый добавленный уровень стройсектора приближает всё, что идёт после
   *     него, - но его самого тоже надо построить, и он тянет за собой дерево,
   *     железо, инструменты и сталь, то есть ещё здания и ещё стройку. Слишком
   *     мало - ползёте; слишком много - последние достроятся уже после того,
   *     что должны были ускорить.
   *
   *     Поэтому мы не гадаем. Для каждого варианта план собирается заново -
   *     секторы, их поставщики, всё, - упорядочивается и моделируется по
   *     неделям; побеждает то количество, которое финиширует раньше всех.
   *
   * @returns { best, curve, baseline, saved }
   */
  C.suggestConstructionSectors = function (ctx, basePlan, opts) {
    opts = opts || {};
    var maxLevels = opts.max || 40;
    var patience = opts.patience || 6;      // stop after this many worse in a row
    var curve = [];
    var best = null, baseline = null, worseRun = 0;

    for (var n = 0; n <= maxLevels; n++) {
      var plan = V3.util.deepClone(basePlan);
      plan.fixed = plan.fixed || {};
      plan.producers = plan.producers || {};

      if (n > 0) {
        plan.fixed.construction_sector = n;
        plan.producers.construction = 'construction_sector';
        V3.Solver.expandInputs(ctx, plan, 'construction_sector', ['construction']);
      } else {
        delete plan.fixed.construction_sector;
        delete plan.producers.construction;
      }

      var sol = V3.Solver.solve(ctx, plan);
      if (!sol.converged) continue;

      var sim = C.simulate(ctx, C.order(ctx, sol, 'fastest'));

      var row = {
        levels: n,
        weeks: sim.weeks,
        cost: sim.totalCost,
        workers: sol.totals.workers,
        buildingLevels: sol.totals.levels
      };
      curve.push(row);
      if (n === 0) baseline = row;

      if (!best || row.weeks < best.weeks) {
        best = row;
        worseRun = 0;
      } else {
        worseRun++;
        if (worseRun >= patience) break;
      }
    }

    return {
      best: best,
      baseline: baseline,
      curve: curve,
      /** Weeks saved compared with building none at all. */
      saved: (baseline && best) ? baseline.weeks - best.weeks : 0
    };
  };

  /**
   * Compare the three build-order modes so the UI can say
   * "fastest saves you 14 years over cheapest".
   */
  C.compareModes = function (ctx, solution) {
    return ['fastest', 'cheapest', 'selfSufficient'].map(function (m) {
      var ord = C.order(ctx, solution, m);
      var sim = C.simulate(ctx, ord);
      return { mode: m, weeks: sim.weeks, totalCost: sim.totalCost, order: ord, sim: sim };
    });
  };

})(window.V3);
