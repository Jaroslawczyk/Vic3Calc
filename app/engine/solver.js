/* ============================================================================
 * app/engine/solver.js - Sizing a whole production chain.
 * ---------------------------------------------------------------------------
 * EN: THE PROBLEM. You say "I want 200 Steel a week". Steel needs Iron and
 *     Coal. Iron mines need Tools. Tool workshops need Steel. So the answer to
 *     "how much steel do I need" depends on the answer to "how much steel do I
 *     need". Walking the tree top-down loops forever.
 *
 *     THE FIX. Treat it as what it is - an input-output economy - and solve it
 *     the way economists do, by iteration:
 *
 *         x  =  finalDemand  +  A · x
 *
 *     where x is "how much of everything must be produced" and A says how much
 *     of each good one unit of another good consumes. Start from nothing and
 *     apply the equation over and over. Each pass adds the next ring of
 *     upstream demand; the additions shrink every time, and after a few dozen
 *     passes the numbers stop moving. That fixed point IS the answer, and it
 *     handles loops (steel -> tools -> steel) without any special case.
 *
 *     If the numbers DON'T stop moving, the chain is not viable - it consumes
 *     more of something than it can make. The solver stops and says so rather
 *     than returning nonsense.
 *
 * RU: ЗАДАЧА. Вы говорите "хочу 200 стали в неделю". Стали нужны железо и
 *     уголь. Железным шахтам нужны инструменты. Мастерским инструментов нужна
 *     сталь. То есть ответ на "сколько нужно стали" зависит от ответа на
 *     "сколько нужно стали". Обход дерева сверху вниз зациклится навсегда.
 *
 *     РЕШЕНИЕ. Признать, что это межотраслевой баланс, и решать как экономисты
 *     - итерациями:
 *
 *         x  =  конечный спрос  +  A · x
 *
 *     где x - "сколько чего надо произвести", а A - сколько одного товара
 *     съедает единица другого. Начинаем с нуля и применяем уравнение снова и
 *     снова. Каждый проход добавляет следующее кольцо спроса сверху; добавки
 *     всё меньше, и через несколько десятков проходов числа перестают меняться.
 *     Эта неподвижная точка И ЕСТЬ ответ, и циклы (сталь -> инструменты ->
 *     сталь) обрабатываются без единого особого случая.
 *
 *     Если числа НЕ перестают меняться - цепочка нежизнеспособна: она
 *     потребляет чего-то больше, чем производит. Решатель останавливается и
 *     говорит об этом, а не выдаёт бессмыслицу.
 * ==========================================================================*/
(function (V3) {
  'use strict';

  var S = V3.Solver = {};

  var BC = V3.BuildingCalc;

  /**
   * How big a shortfall has to be before it is worth telling the user about.
   *
   * The fixed-point iteration stops when levels stop moving, which leaves a
   * residue of a few parts per million in the goods balance. Reporting that as
   * "short of tools by 0 a week" is noise that trains people to ignore the
   * warning strip - so the threshold is relative to the flow, with a small
   * absolute floor for tiny chains.
   */
  function deficitTolerance(flow) {
    return Math.max(0.05, Math.abs(flow) * 1e-4);
  }

  /**
   * @param {Object} ctx   from V3.Context.create()
   * @param {Object} plan  {
   *     targets:      [{good, amount}]        what you want, per week
   *     producers:    {goodId: buildingId}    who makes what
   *     pmChoices:    {buildingId: {group: pm}}
   *     fixed:        {buildingId: levels}    pin a building instead of solving it
   *     existing:     {buildingId: levels}    already standing; not built again
   *     imported:     {goodId: amount}        bought in / treaty / already flowing
   *     levelsPerSite:{buildingId: levels}    for economy-of-scale realism
   *  }
   * @returns solution
   */
  S.solve = function (ctx, plan) {
    plan = plan || {};
    var targets   = plan.targets || [];
    var producers = plan.producers || {};
    var pmChoices = plan.pmChoices || {};
    var fixed     = plan.fixed || {};
    var existing  = plan.existing || {};
    var imported  = plan.imported || {};
    var perSite   = plan.levelsPerSite || {};

    // -------------------------------------------------------------------------
    // Which buildings take part, and what does each one make?
    // -------------------------------------------------------------------------
    var buildingIds = {};
    Object.keys(producers).forEach(function (g) { if (producers[g]) buildingIds[producers[g]] = true; });
    Object.keys(fixed).forEach(function (b) { buildingIds[b] = true; });
    var nodes = Object.keys(buildingIds);

    // Goods each building is RESPONSIBLE for (it was chosen as their producer).
    // This has to come first: it decides which optional production rows get
    // switched on, which decides everything else.
    var responsibleFor = {};
    nodes.forEach(function (b) { responsibleFor[b] = []; });
    Object.keys(producers).forEach(function (g) {
      var b = producers[g];
      if (b && responsibleFor[b]) responsibleFor[b].push(g);
    });

    // Resolve the methods and the per-level numbers ONCE. Neither changes
    // during the iteration, and recomputing them inside the loop was the
    // difference between an instant answer and a visible freeze.
    var pmsCache = {}, perLevelCache = {};
    nodes.forEach(function (b) {
      pmsCache[b] = pmChoices[b] || V3.Context.defaultPMs(ctx, b, responsibleFor[b]);
      perLevelCache[b] = BC.perLevel(ctx, b, pmsCache[b]);
    });
    function pmsFor(bId) { return pmsCache[bId]; }

    // -------------------------------------------------------------------------
    // Fixed-point iteration.
    // -------------------------------------------------------------------------
    var levels = {};
    nodes.forEach(function (b) { levels[b] = 0; });

    var maxIter = ctx.opt.maxSolverIterations;
    var eps = ctx.opt.convergence;
    var converged = false;
    var iterations = 0;
    var demand = {};

    for (var it = 0; it < maxIter; it++) {
      iterations = it + 1;

      // 1. Total demand for every good at the current guess.
      demand = {};
      targets.forEach(function (t) {
        if (!t || !t.good) return;
        demand[t.good] = (demand[t.good] || 0) + (t.amount || 0);
      });

      nodes.forEach(function (b) {
        var lv = fixed[b] != null ? fixed[b] : levels[b];
        if (lv <= 0) return;
        var per = perLevelCache[b];
        var site = perSite[b] ? Math.min(lv, perSite[b]) : lv;
        var tp = BC.throughput(ctx, site, 0);
        Object.keys(per.inputs).forEach(function (g) {
          demand[g] = (demand[g] || 0) + per.inputs[g] * lv * tp;
        });
      });

      // 2. Resize every non-pinned building to cover what it is responsible for.
      var maxDelta = 0;
      nodes.forEach(function (b) {
        if (fixed[b] != null) { levels[b] = fixed[b]; return; }

        var goods = responsibleFor[b];
        if (!goods.length) return;

        var needLevels = 0;
        var per = perLevelCache[b];
        var current = levels[b];
        // Throughput depends on the level count, which is what we are solving
        // for - so it is recomputed each pass from the current guess.
        var tp = BC.throughput(ctx, perSite[b] ? Math.min(current, perSite[b]) : current, 0);

        goods.forEach(function (g) {
          var need = (demand[g] || 0) - (imported[g] || 0);
          if (need <= 0) return;
          var outPerLevel = (per.outputs[g] || 0) * tp;
          if (outPerLevel <= 0) return;
          needLevels = Math.max(needLevels, need / outPerLevel);
        });

        var delta = Math.abs(needLevels - current);
        if (delta > maxDelta) maxDelta = delta;
        levels[b] = needLevels;
      });

      if (maxDelta < eps) { converged = true; break; }
    }

    // -------------------------------------------------------------------------
    // Final pass: evaluate everything at the solved level counts.
    // -------------------------------------------------------------------------
    var result = {
      converged: converged,
      iterations: iterations,
      nodes: [],
      goods: {},
      totals: {
        jobs: {}, jobsByStrata: { poor: 0, middle: 0, upper: 0 },
        infraUsed: 0, infraProvided: 0,
        pollution: 0,
        levels: 0, levelsExact: 0, levelsToBuild: 0,
        constructionCost: 0
      },
      warnings: []
    };

    if (!converged) {
      // Name the runaway. In a divergent chain one building grows fastest, and
      // that building is almost always where the bad ratio is - far more useful
      // than "it did not converge".
      var worst = null;
      nodes.forEach(function (b) {
        if (!worst || levels[b] > levels[worst]) worst = b;
      });
      result.warnings.push({
        code: 'NO_CONVERGENCE', level: 'error',
        iterations: iterations, buildingId: worst
      });
    }

    result.unused = [];

    nodes.forEach(function (b) {
      var lv = fixed[b] != null ? fixed[b] : levels[b];

      // A building nobody needs contributes nothing but clutter. This happens
      // constantly while editing: you remove a target, and the producers that
      // only existed to feed it are left behind at zero levels. Drop them from
      // the result - but keep a list, so the UI can offer to tidy the plan.
      var keep = lv > 1e-6 || fixed[b] != null || (existing[b] || 0) > 0;
      if (!keep) { result.unused.push(b); return; }

      var building = V3.db.building(b);
      var pms = pmsFor(b);
      var ev = BC.evaluate(ctx, {
        buildingId: b, pms: pms, levels: lv, levelsPerSite: perSite[b]
      });

      var have = existing[b] || 0;
      var toBuild = Math.max(0, Math.ceil(lv - 1e-9) - have);

      var node = {
        buildingId: b,
        building: building,
        pms: pms,
        methods: ev.perLevel.methods,
        levelsExact: lv,
        levels: Math.ceil(lv - 1e-9),
        existing: have,
        levelsToBuild: toBuild,
        throughput: ev.throughput,
        inputs: ev.inputs,
        outputs: ev.outputs,
        jobs: ev.jobs,
        pollution: ev.pollution,
        infraUsed: ev.infraUsed,
        infraProvided: ev.infraProvided,
        produces: responsibleFor[b] || [],
        warnings: ev.warnings,
        constructionCost: toBuild * ((building && building.constructionCost) || 0)
      };
      result.nodes.push(node);

      result.totals.levels += node.levels;
      result.totals.levelsExact += lv;
      result.totals.levelsToBuild += toBuild;
      result.totals.infraUsed += node.infraUsed;
      result.totals.infraProvided += node.infraProvided;
      result.totals.pollution += node.pollution;
      result.totals.constructionCost += node.constructionCost;

      Object.keys(node.jobs).forEach(function (p) {
        result.totals.jobs[p] = (result.totals.jobs[p] || 0) + node.jobs[p];
      });

      node.warnings.forEach(function (w) {
        result.warnings.push(V3.util.deepMerge(w, { level: 'warn', buildingId: b }));
      });
    });

    // -------------------------------------------------------------------------
    // Goods ledger: who wanted what, who made it, what is left over.
    // -------------------------------------------------------------------------
    var allGoods = {};
    Object.keys(demand).forEach(function (g) { allGoods[g] = true; });
    result.nodes.forEach(function (n) {
      Object.keys(n.outputs).forEach(function (g) { allGoods[g] = true; });
      Object.keys(n.inputs).forEach(function (g) { allGoods[g] = true; });
    });
    Object.keys(imported).forEach(function (g) { allGoods[g] = true; });

    Object.keys(allGoods).forEach(function (g) {
      var produced = 0, consumed = 0;
      result.nodes.forEach(function (n) {
        produced += n.outputs[g] || 0;
        consumed += n.inputs[g] || 0;
      });
      var finalWanted = 0;
      targets.forEach(function (t) { if (t.good === g) finalWanted += (t.amount || 0); });

      var imp = imported[g] || 0;
      var balance = produced + imp - consumed - finalWanted;

      result.goods[g] = {
        good: V3.db.safe('good', g),
        produced: produced,
        consumed: consumed,
        imported: imp,
        finalDemand: finalWanted,
        balance: balance,
        surplus: Math.max(0, balance),
        deficit: Math.max(0, -balance),
        producer: producers[g] || null
      };

      var wanted = consumed + finalWanted;

      // A good that is consumed, has no producer and is not imported is the
      // single most common reason a plan is wrong. Say so loudly.
      if (wanted > 1e-9 && !producers[g] && imp <= 0) {
        result.warnings.push({
          code: 'NO_SOURCE', level: 'error', good: g,
          amount: wanted
        });
      } else if (wanted > 1e-9 && producers[g] && produced <= 1e-9 && imp <= 0) {
        // Subtler and much more confusing: the building IS in the chain, but at
        // this technology level none of its methods actually make the good.
        // Ask for automobiles in 1850 and this is what you get.
        result.warnings.push({
          code: 'PRODUCER_CANNOT_MAKE', level: 'error', good: g,
          buildingId: producers[g], amount: wanted
        });
      } else if (balance < -deficitTolerance(wanted)) {
        result.warnings.push({
          code: 'DEFICIT', level: 'warn', good: g, amount: -balance
        });
      }
    });

    // -------------------------------------------------------------------------
    // Workforce roll-up and the population sanity check.
    // -------------------------------------------------------------------------
    Object.keys(result.totals.jobs).forEach(function (p) {
      var pop = V3.db.pop(p);
      var strata = (pop && pop.strata) || 'poor';
      result.totals.jobsByStrata[strata] =
        (result.totals.jobsByStrata[strata] || 0) + result.totals.jobs[p];
    });
    result.totals.workers = V3.util.sum(Object.keys(result.totals.jobs),
      function (p) { return result.totals.jobs[p]; });

    var population = ctx.country && ctx.country.population;
    if (population > 0) {
      // Roughly a third of a population is of working age and available.
      var workforce = population * 0.33;
      if (result.totals.workers > workforce) {
        result.warnings.push({
          code: 'NOT_ENOUGH_PEOPLE', level: 'error',
          needed: result.totals.workers, available: workforce
        });
      }
      var educated = V3.util.sum(Object.keys(result.totals.jobs), function (p) {
        var pop = V3.db.pop(p);
        return (pop && pop.qualification === 'educated') ? result.totals.jobs[p] : 0;
      });
      var literate = workforce * ((ctx.country.literacyPct || 0) / 100);
      if (educated > literate) {
        result.warnings.push({
          code: 'NOT_ENOUGH_EDUCATED', level: 'warn',
          needed: educated, available: literate
        });
      }
    }

    // -------------------------------------------------------------------------
    // Infrastructure
    // -------------------------------------------------------------------------
    if (ctx.opt.countInfrastructure) {
      var net = result.totals.infraProvided - result.totals.infraUsed;
      result.totals.infraBalance = net;
      if (net < 0) {
        result.warnings.push({
          code: 'INFRA_DEFICIT', level: 'warn', amount: -net,
          hint: 'railway'
        });
      }
    }

    return result;
  };

  /**
   * Make sure a plan can actually feed a building: walk everything it consumes
   * and fill in a producer for anything not already produced or bought.
   * Mutates and returns the plan.
   *
   * Needed whenever a building is added to a chain by something other than a
   * goods target - a pinned construction sector, say, which quietly needs wood,
   * iron, tools and steel behind it.
   */
  S.expandInputs = function (ctx, plan, buildingId, wantedGoods) {
    plan.producers = plan.producers || {};
    plan.imported = plan.imported || {};

    var pms = plan.pmChoices && plan.pmChoices[buildingId];
    if (!pms) pms = V3.Context.defaultPMs(ctx, buildingId, wantedGoods || []);
    var per = V3.BuildingCalc.perLevel(ctx, buildingId, pms);

    Object.keys(per.inputs).forEach(function (g) {
      if (plan.producers[g] || plan.imported[g] != null) return;
      var sub = S.autoPlan(ctx, g, 0, { imported: plan.imported });
      Object.keys(sub.producers).forEach(function (gg) {
        if (!plan.producers[gg] && plan.imported[gg] == null) {
          plan.producers[gg] = sub.producers[gg];
        }
      });
    });
    return plan;
  };

  /**
   * Convenience: build a plan that makes a target good from scratch, choosing
   * the default producer for every input recursively. This is what the
   * "+ add good" button uses so the user gets a complete chain in one click.
   */
  S.autoPlan = function (ctx, targetGood, amount, opts) {
    opts = opts || {};
    var producers = {};
    var seen = {};
    var queue = [targetGood];
    var maxDepth = opts.maxDepth || 12;
    var depth = 0;

    while (queue.length && depth < maxDepth * 50) {
      depth++;
      var g = queue.shift();
      if (seen[g]) continue;
      seen[g] = true;

      var good = V3.db.good(g);
      if (!good) continue;
      // Goods the user marked as bought-in stop the recursion.
      if (opts.imported && opts.imported[g] != null) continue;

      var candidates = V3.db.producersOf(g);
      if (!candidates.length) continue;

      // Pick a producer that can actually output this good at the player's tech
      // level, and among those the one with the cheapest INPUTS per unit made.
      //
      // "Cheapest to build" is the obvious heuristic and it is wrong: a whaling
      // station is cheaper to build than an oil rig, but it makes oil out of
      // steamers, which are made of steel and engines, which are made of oil.
      // Picking by input cost keeps the chain shallow and, more importantly,
      // keeps it solvable.
      var pick = null, pickScore = Infinity;
      candidates.forEach(function (b) {
        if (!V3.Context.canProduce(ctx, b.id, g)) return;
        var pms = V3.Context.defaultPMs(ctx, b.id, [g]);
        var per = V3.BuildingCalc.perLevel(ctx, b.id, pms);
        var out = per.outputs[g] || 0;
        if (out <= 0) return;
        var inCost = V3.util.sum(Object.keys(per.inputs), function (ing) {
          return per.inputs[ing] * (ctx.price(ing) || 1);
        });
        // Construction cost is the tie-break, scaled to be a small nudge only.
        var score = inCost / out + (b.constructionCost || 0) / (out * 1000);
        if (score < pickScore) { pickScore = score; pick = b; }
      });
      if (!pick) pick = candidates[0];

      producers[g] = pick.id;

      // Follow only the inputs this building needs FOR THIS GOOD. Asking it for
      // engines must not drag the whole aeroplane supply chain in behind it.
      var pms2 = V3.Context.defaultPMs(ctx, pick.id, [g]);
      var per = V3.BuildingCalc.perLevel(ctx, pick.id, pms2);
      Object.keys(per.inputs).forEach(function (ing) {
        if (!seen[ing]) queue.push(ing);
      });
    }

    return {
      targets: [{ good: targetGood, amount: amount }],
      producers: producers,
      pmChoices: {},
      fixed: {},
      existing: {},
      imported: opts.imported || {},
      levelsPerSite: {}
    };
  };

})(window.V3);
