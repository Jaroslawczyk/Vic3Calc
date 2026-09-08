/* ============================================================================
 * app/engine/military.js - Armies, navies, and the bill for them.
 * ---------------------------------------------------------------------------
 * EN: The point of this module is to make one thing obvious:
 *
 *         AN ARMY IS A FACTORY ORDER.
 *
 *     100 battalions of Line Infantry do not cost you "some military budget".
 *     They cost 1 000 Small Arms and 500 Ammunition every single week, which
 *     is a fixed number of Arms Industry and Munition Plant levels, which is a
 *     fixed number of Iron Mines and Steel Mills behind those, which is a
 *     fixed number of people. This module produces the goods bill; the ordinary
 *     chain solver then turns it into buildings and workers, exactly as it
 *     would for any other demand.
 *
 *     And it does it TWICE - peacetime and mobilised - because the gap between
 *     those two numbers is what actually decides whether you can fight a war.
 *     An economy that comfortably feeds its peacetime army and cannot feed its
 *     wartime army loses, and it loses in about six months.
 *
 * RU: Смысл этого модуля - сделать очевидной одну вещь:
 *
 *         АРМИЯ - ЭТО ЗАКАЗ ЗАВОДАМ.
 *
 *     100 батальонов линейной пехоты стоят не "какого-то военного бюджета".
 *     Они стоят 1 000 стрелкового оружия и 500 боеприпасов каждую неделю - а
 *     это фиксированное число уровней оружейных заводов и патронных фабрик, за
 *     ними фиксированное число железных рудников и сталелитейных, а за ними
 *     фиксированное число людей. Модуль выдаёт счёт в товарах; обычный
 *     решатель цепочек превращает его в здания и рабочих.
 *
 *     И делает это ДВАЖДЫ - для мира и для мобилизации, потому что именно
 *     разрыв между этими двумя числами решает, можете ли вы вести войну.
 *     Экономика, которая спокойно кормит мирную армию и не тянет военную,
 *     проигрывает - примерно за полгода.
 * ==========================================================================*/
(function (V3) {
  'use strict';

  var M = V3.Military = {};
  var BC = V3.BuildingCalc;

  /**
   * @param {Object} force {
   *    units: [ { buildingId, levels, pms: {group:pm} } ],   // barracks / naval bases
   *    mobilization: [ pmId ],       // options switched on while at war
   *    warMultiplier: 2.0            // override the global default
   * }
   */
  M.evaluate = function (ctx, force) {
    force = force || {};
    var units = force.units || [];
    var mobIds = force.mobilization || [];
    var globalWarMult = force.warMultiplier != null
      ? force.warMultiplier : ctx.opt.warMultiplierDefault;

    var out = {
      formations: [],
      battalions: 0,
      flotillas: 0,
      goodsPeace: {}, goodsWar: {},
      jobs: {},
      offense: 0, defense: 0,
      mobilization: [],
      warnings: []
    };

    units.forEach(function (u) {
      var b = V3.db.building(u.buildingId);
      if (!b) { out.warnings.push({ code: 'NO_BUILDING', id: u.buildingId }); return; }

      var levels = Math.max(0, u.levels || 0);
      var pms = u.pms || V3.Context.defaultPMs(ctx, u.buildingId);
      var per = BC.perLevel(ctx, u.buildingId, pms);

      // Formations do not benefit from economy of scale - a battalion is a
      // battalion. So we use the raw per-level numbers times the level count.
      var peace = {}, war = {};
      per.methods.forEach(function (p) {
        var mult = p.warMult != null ? p.warMult : globalWarMult;
        Object.keys(p.inputs || {}).forEach(function (g) {
          var amount = p.inputs[g] * levels;
          peace[g] = (peace[g] || 0) + amount;
          war[g] = (war[g] || 0) + amount * mult;
        });
      });

      var jobs = {};
      Object.keys(per.jobs).forEach(function (j) { jobs[j] = per.jobs[j] * levels; });

      var formation = {
        buildingId: u.buildingId,
        building: b,
        kind: b.militaryKind || 'army',
        levels: levels,
        count: levels * (b.battalionsPerLevel || 1),
        pms: pms,
        methods: per.methods,
        goodsPeace: peace,
        goodsWar: war,
        jobs: jobs,
        offense: per.offense * levels,
        defense: per.defense * levels,
        constructionCost: levels * (b.constructionCost || 0)
      };
      out.formations.push(formation);

      if (formation.kind === 'navy') out.flotillas += formation.count;
      else out.battalions += formation.count;

      merge(out.goodsPeace, peace);
      merge(out.goodsWar, war);
      merge(out.jobs, jobs);
      out.offense += formation.offense;
      out.defense += formation.defense;
    });

    // -------------------------------------------------------------------------
    // Mobilisation options are billed PER BATTALION, on top of the wartime bill.
    // This is the line that surprises people.
    // -------------------------------------------------------------------------
    mobIds.forEach(function (id) {
      var p = V3.db.pm(id);
      if (!p) return;
      var per = {};
      Object.keys(p.inputs || {}).forEach(function (g) {
        per[g] = p.inputs[g] * out.battalions;
      });
      out.mobilization.push({
        pm: p, perBattalion: p.inputs || {}, total: per,
        offense: (p.unit && p.unit.offense || 0) * out.battalions,
        defense: (p.unit && p.unit.defense || 0) * out.battalions
      });
      merge(out.goodsWar, per);
      if (p.unit) {
        out.offenseMobilized = (out.offenseMobilized || 0) + (p.unit.offense || 0) * out.battalions;
        out.defenseMobilized = (out.defenseMobilized || 0) + (p.unit.defense || 0) * out.battalions;
      }
    });

    // -------------------------------------------------------------------------
    // Costs
    // -------------------------------------------------------------------------
    out.wages = V3.Economy.weightedWorkers(out.jobs)
              * ctx.opt.baseWagePerWorker * (ctx.opt.wageMultiplier || 1);

    out.goodsCostPeace = costOf(ctx, out.goodsPeace);
    out.goodsCostWar = costOf(ctx, out.goodsWar);
    out.upkeepPeace = out.goodsCostPeace + out.wages;
    out.upkeepWar = out.goodsCostWar + out.wages;
    out.warSurcharge = out.upkeepWar - out.upkeepPeace;

    out.constructionCost = V3.util.sum(out.formations, function (f) { return f.constructionCost; });

    out.offenseTotal = out.offense + (out.offenseMobilized || 0);
    out.defenseTotal = out.defense + (out.defenseMobilized || 0);
    /** A single comparable number. Relative only - see the file header. */
    out.strength = out.offenseTotal + out.defenseTotal;

    return out;
  };

  function merge(target, src) {
    Object.keys(src || {}).forEach(function (k) {
      target[k] = (target[k] || 0) + src[k];
    });
  }

  function costOf(ctx, goods) {
    return V3.util.sum(Object.keys(goods), function (g) {
      return goods[g] * ctx.price(g);
    });
  }

  /**
   * Turn a military bill into solver targets, so the ordinary chain machinery
   * can answer "and how many factories and people is that?".
   * @param wartime  true to size your industry for war, false for peace
   */
  M.toChainTargets = function (result, wartime) {
    var goods = wartime ? result.goodsWar : result.goodsPeace;
    return Object.keys(goods)
      .filter(function (g) {
        var good = V3.db.good(g);
        return good && !good.abstract && goods[g] > 0;
      })
      .map(function (g) { return { good: g, amount: goods[g] }; });
  };

  /**
   * The comparison that matters: what does going to war do to your industry?
   * Returns the two solved chains plus the delta in buildings and workers.
   */
  M.industryComparison = function (ctx, result, planOpts) {
    function solveFor(wartime) {
      var targets = M.toChainTargets(result, wartime);
      var producers = {};
      targets.forEach(function (t) {
        var p = V3.Solver.autoPlan(ctx, t.good, t.amount, planOpts || {});
        Object.keys(p.producers).forEach(function (g) {
          if (!producers[g]) producers[g] = p.producers[g];
        });
      });
      return V3.Solver.solve(ctx, {
        targets: targets,
        producers: producers,
        imported: (planOpts && planOpts.imported) || {}
      });
    }

    var peace = solveFor(false);
    var war = solveFor(true);

    return {
      peace: peace,
      war: war,
      extraLevels: war.totals.levels - peace.totals.levels,
      extraWorkers: war.totals.workers - peace.totals.workers,
      extraCost: war.totals.constructionCost - peace.totals.constructionCost
    };
  };

})(window.V3);
