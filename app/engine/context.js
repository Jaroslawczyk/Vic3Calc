/* ============================================================================
 * app/engine/context.js - The assumptions a calculation runs under.
 * ---------------------------------------------------------------------------
 * EN: Every engine function takes a `ctx` as its first argument and reads
 *     nothing else global. That is what makes the engine testable and what
 *     lets two chains with different tech levels be open at once.
 *
 *     A context answers:
 *       - which technologies do I have?          ctx.hasTech(id)
 *       - what does a good cost?                 ctx.price(id)
 *       - are we counting infrastructure?        ctx.opt.countInfrastructure
 *       - which method should a building use?    ctx.bestPM(groupId)
 *
 * RU: Каждая функция движка принимает `ctx` первым аргументом и не читает
 *     ничего глобального. Именно поэтому движок можно тестировать и держать
 *     открытыми две цепочки с разным уровнем технологий одновременно.
 * ==========================================================================*/
(function (V3) {
  'use strict';

  var Ctx = V3.Context = {};

  /**
   * Build a context from the saved settings plus per-chain overrides.
   * @param {Object} over  { techs: {id:true}, era: 3, opt: {...}, prices: {...} }
   */
  Ctx.create = function (over) {
    over = over || {};
    var S = V3.userdata.settings();
    var opt = V3.util.deepMerge({
      economyOfScale: S.economyOfScale,
      economyOfScalePerLevel: 0.01,
      economyOfScaleCapLevels: 25,
      countInfrastructure: S.countInfrastructure,
      countPollution: S.countPollution,
      countConstructionSector: S.countConstructionSector,
      buildOrderMode: S.buildOrderMode,
      wageMultiplier: S.wageMultiplier,
      baseWagePerWorker: 0.08,   // £ per weighted worker per week; tune in Settings
      warMultiplierDefault: 2.0,
      maxSolverIterations: 200,
      convergence: 1e-6
    }, over.opt || {});

    var techs = over.techs || {};
    var era = over.era == null ? 5 : over.era;

    var ctx = {
      opt: opt,
      techs: techs,
      era: era,
      country: V3.util.deepMerge(S.country, over.country || {}),

      /**
       * A technology counts as available if you ticked it explicitly, OR if it
       * belongs to an era at or below the era slider. The slider is the fast
       * path ("I'm in 1880, give me era 3"); the tick boxes are the precise one.
       */
      hasTech: function (id) {
        if (!id) return true;                       // no requirement
        if (techs[id] === true) return true;
        if (techs[id] === false) return false;      // explicitly excluded
        var t = V3.db.tech(id);
        if (!t) return true;                        // unknown tech: don't block
        return t.era <= era;
      },

      /** Market price of a good, honouring the custom price table. */
      price: function (goodId) {
        var g = V3.db.good(goodId);
        if (!g) return 0;
        if (g.abstract) return 0;
        if (S.priceMode === 'custom' && S.customPrices && S.customPrices[goodId] != null) {
          return V3.util.parseNum(S.customPrices[goodId], g.basePrice);
        }
        return g.basePrice || 0;
      },

      /**
       * Most advanced unlocked method in a group.
       * Relies on the table order in app/data/pm_*.js being worst -> best.
       */
      bestPM: function (groupId) {
        var list = V3.db.pmsOfGroup(groupId);
        var best = null;
        for (var i = 0; i < list.length; i++) {
          if (ctx.hasTech(list[i].unlockTech)) best = list[i];
        }
        return best || list[0] || null;
      },

      /** First (most primitive) method - the safe default for a new node. */
      firstPM: function (groupId) {
        var list = V3.db.pmsOfGroup(groupId);
        return list[0] || null;
      },

      /** Is a method usable right now? Drives the greyed-out state in the UI. */
      pmAvailable: function (pmId) {
        var p = V3.db.pm(pmId);
        return !p || ctx.hasTech(p.unlockTech);
      }
    };

    return ctx;
  };

  /**
   * Default method selection for a building.
   *
   * EN: NOT simply "the best method in every row", and the difference matters
   *     enormously. SECONDARY rows are optional extra products, and in the game
   *     you leave them off unless you want that product. Turning them all on by
   *     default made every engine carry the input cost of a car, a tank and an
   *     aeroplane at once - which inflated the whole chain until it became
   *     mathematically unsolvable. So:
   *
   *       base / automation / ownership rows -> best unlocked method
   *       secondary rows                     -> OFF, unless the chain actually
   *                                             wants what they produce
   *
   * RU: НЕ просто "лучший метод в каждой строке", и разница огромна.
   *     ПОБОЧНЫЕ строки - это необязательные дополнительные продукты, и в игре
   *     их не включают, пока продукт не нужен. Если включить все сразу, каждый
   *     двигатель начинает нести стоимость входов автомобиля, танка и самолёта
   *     одновременно - цепочка раздувается до математической нерешаемости.
   *
   * @param wantedGoods  goods this building is in the chain to supply; a
   *                     secondary row is switched on only if it makes one.
   */
  Ctx.defaultPMs = function (ctx, buildingId, wantedGoods) {
    var b = V3.db.building(buildingId);
    var out = {};
    if (!b) return out;
    var wanted = wantedGoods || [];

    (b.pmGroups || []).forEach(function (gid) {
      var grp = V3.db.pmGroup(gid);
      var rowKind = grp && grp.rowKind;

      // OWNERSHIP rows are alternatives, not a progression. "Most advanced"
      // would land on Government Run for every building in the game, which is
      // both wrong as a default and quietly wrong in the numbers: it staffs
      // your farms with bureaucrats instead of aristocrats. Take the first
      // entry, which is the game's own starting state.
      if (rowKind === 'ownership') {
        var own = ctx.firstPM(gid);
        if (own) out[gid] = own.id;
        return;
      }

      if (rowKind !== 'secondary') {
        var best = ctx.bestPM(gid);
        if (best) out[gid] = best.id;
        return;
      }

      // Secondary: the best unlocked method in this row that makes something
      // we were asked for. Otherwise the first row, which is the "no X" option.
      var chosen = null;
      V3.db.pmsOfGroup(gid).forEach(function (p) {
        if (!ctx.hasTech(p.unlockTech)) return;
        var makesWanted = Object.keys(p.outputs || {}).some(function (g) {
          var real = g === '__primary' ? (b.produces || [])[0] : g;
          return wanted.indexOf(real) >= 0;
        });
        if (makesWanted) chosen = p;      // later entries are better
      });
      var fallback = ctx.firstPM(gid);
      if (chosen) out[gid] = chosen.id;
      else if (fallback) out[gid] = fallback.id;
    });

    return out;
  };

  /** True if this building, with the right rows switched on, could make `goodId`. */
  Ctx.canProduce = function (ctx, buildingId, goodId) {
    var pms = Ctx.defaultPMs(ctx, buildingId, [goodId]);
    return V3.BuildingCalc.outputsOf(ctx, buildingId, pms).indexOf(goodId) >= 0;
  };

})(window.V3);
