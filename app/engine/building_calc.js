/* ============================================================================
 * app/engine/building_calc.js - What ONE building actually does.
 * ---------------------------------------------------------------------------
 * EN: Everything else in the engine is built on this function. Give it a
 *     building, the methods you picked and a number of levels, and it returns
 *     goods in, goods out, jobs by profession, infrastructure and pollution.
 *
 *     THE THREE RULES (they explain almost every surprise):
 *
 *     1. Methods ADD UP. Pick one row per group; the building's numbers are the
 *        sum. Automation rows carry negative employment on purpose.
 *
 *     2. Throughput scales GOODS but NOT JOBS. A level-20 factory with +20%
 *        throughput consumes and produces 20% more with exactly the same
 *        workforce. That is why stacking levels in one state beats spreading
 *        them thin, and why the app asks how many levels sit on one site.
 *
 *     3. Employment is per LEVEL and is a ceiling, not a promise. If the state
 *        has no Machinists, the building runs under capacity. The app flags
 *        that instead of silently assuming full staffing.
 *
 * RU: Всё остальное в движке построено на этой функции. Даёте здание,
 *     выбранные методы и число уровней - получаете товары на входе и выходе,
 *     рабочие места по профессиям, инфраструктуру и загрязнение.
 *
 *     ТРИ ПРАВИЛА (они объясняют почти все неожиданности):
 *
 *     1. Методы СКЛАДЫВАЮТСЯ. По одной строке из каждой группы; числа здания -
 *        это сумма. У строк автоматизации занятость отрицательная намеренно.
 *
 *     2. Пропускная способность масштабирует ТОВАРЫ, но НЕ РАБОЧИЕ МЕСТА.
 *        Завод 20-го уровня с +20% производит на 20% больше тем же составом.
 *        Поэтому выгоднее складывать уровни в одном штате, а не размазывать.
 *
 *     3. Занятость - это на УРОВЕНЬ и это потолок, а не обещание. Если в штате
 *        нет машинистов, здание работает не на полную. Программа предупредит,
 *        а не сделает вид, что всё укомплектовано.
 * ==========================================================================*/
(function (V3) {
  'use strict';

  var BC = V3.BuildingCalc = {};

  function addTo(target, key, value) {
    if (!value) return;
    target[key] = (target[key] || 0) + value;
  }

  /**
   * Resolve the `__primary` placeholder used by shared plantation methods.
   * A Coffee Plantation and a Tea Plantation use the same method rows; the
   * good actually produced is the first entry in the building's `produces`.
   */
  function resolveGood(goodId, building) {
    if (goodId !== '__primary') return goodId;
    return (building && building.produces && building.produces[0]) || null;
  }

  /**
   * Per-level totals from the selected methods.
   * @param {Object} ctx
   * @param {String} buildingId
   * @param {Object} pms      { groupId: pmId }
   * @returns {{inputs, outputs, jobs, pollution, infra, methods, warnings}}
   */
  BC.perLevel = function (ctx, buildingId, pms) {
    var b = V3.db.building(buildingId);
    var out = {
      inputs: {}, outputs: {}, jobs: {},
      pollution: 0, infra: 0,
      offense: 0, defense: 0,
      methods: [], warnings: []
    };
    if (!b) { out.warnings.push({ code: 'NO_BUILDING', id: buildingId }); return out; }

    var group = V3.db.buildingGroup(b.group);

    // Base infrastructure comes from the building, else from its group.
    out.infra = (b.infraUsage != null ? b.infraUsage
              : (group && group.infraUsage != null ? group.infraUsage : 0));

    (b.pmGroups || []).forEach(function (gid) {
      var pmId = pms && pms[gid];
      var p = pmId ? V3.db.pm(pmId) : null;

      // Nothing chosen, or the chosen one was deleted by a mod: fall back.
      if (!p) { p = ctx.firstPM(gid); }
      if (!p) return;

      if (!ctx.pmAvailable(p.id)) {
        out.warnings.push({ code: 'PM_LOCKED', pm: p.id, tech: p.unlockTech });
      }

      out.methods.push(p);

      Object.keys(p.inputs || {}).forEach(function (g) {
        var real = resolveGood(g, b);
        if (real) addTo(out.inputs, real, p.inputs[g]);
      });
      Object.keys(p.outputs || {}).forEach(function (g) {
        var real = resolveGood(g, b);
        if (real) addTo(out.outputs, real, p.outputs[g]);
      });
      Object.keys(p.jobs || {}).forEach(function (j) {
        addTo(out.jobs, j, p.jobs[j]);
      });

      out.pollution += p.pollution || 0;
      out.infra += p.infra || 0;

      if (p.unit) {
        out.offense += p.unit.offense || 0;
        out.defense += p.unit.defense || 0;
      }
    });

    // Rule 1 fallout: automation can push a profession below zero. Clamp, and
    // remember that we did, so the UI can say "automation saturated here".
    Object.keys(out.jobs).forEach(function (j) {
      if (out.jobs[j] < 0) {
        out.warnings.push({ code: 'JOBS_CLAMPED', pop: j, value: out.jobs[j] });
        out.jobs[j] = 0;
      }
      if (out.jobs[j] === 0) delete out.jobs[j];
    });

    return out;
  };

  /**
   * Throughput multiplier for a stack of `levels` levels on one site.
   *   1 + economy of scale + any flat bonus the caller passes in.
   */
  BC.throughput = function (ctx, levels, bonus) {
    var mult = 1 + (bonus || 0);
    if (ctx.opt.economyOfScale) {
      var eff = Math.min(levels || 0, ctx.opt.economyOfScaleCapLevels);
      mult += eff * ctx.opt.economyOfScalePerLevel;
    }
    return mult;
  };

  /**
   * Full evaluation of a stack of levels.
   * @param {Object} node { buildingId, pms, levels, throughputBonus, levelsPerSite }
   */
  BC.evaluate = function (ctx, node) {
    var levels = Math.max(0, node.levels || 0);
    var per = BC.perLevel(ctx, node.buildingId, node.pms);
    var b = V3.db.building(node.buildingId);

    // Economy of scale is a property of ONE building, not of your whole empire.
    // If the user says the levels are split over several sites we use the size
    // of a single site; otherwise we assume it is one big stack.
    var siteLevels = node.levelsPerSite ? Math.min(levels, node.levelsPerSite) : levels;
    var tp = BC.throughput(ctx, siteLevels, node.throughputBonus);

    var res = {
      buildingId: node.buildingId,
      levels: levels,
      throughput: tp,
      perLevel: per,
      inputs: {}, outputs: {}, jobs: {},
      pollution: 0,
      infraUsed: 0, infraProvided: 0,
      offense: 0, defense: 0,
      warnings: per.warnings.slice()
    };

    Object.keys(per.inputs).forEach(function (g) {
      res.inputs[g] = per.inputs[g] * levels * tp;
    });
    Object.keys(per.outputs).forEach(function (g) {
      res.outputs[g] = per.outputs[g] * levels * tp;
    });
    // Rule 2: jobs do NOT get the throughput multiplier.
    Object.keys(per.jobs).forEach(function (j) {
      res.jobs[j] = per.jobs[j] * levels;
    });

    if (ctx.opt.countPollution) res.pollution = per.pollution * levels;
    if (ctx.opt.countInfrastructure) {
      res.infraUsed = per.infra * levels;
      res.infraProvided = (b && b.providesInfra ? b.providesInfra : 0) * levels;
    }

    res.offense = per.offense * levels;
    res.defense = per.defense * levels;

    return res;
  };

  /**
   * How much of `goodId` one level makes, at the throughput a stack of
   * `levels` would have. Used by the solver to size a node.
   */
  BC.outputPerLevel = function (ctx, buildingId, pms, goodId, levels) {
    var per = BC.perLevel(ctx, buildingId, pms);
    var base = per.outputs[goodId] || 0;
    if (!base) return 0;
    return base * BC.throughput(ctx, levels || 0, 0);
  };

  /** Every good a set of methods actually produces (after `__primary` resolution). */
  BC.outputsOf = function (ctx, buildingId, pms) {
    return Object.keys(BC.perLevel(ctx, buildingId, pms).outputs);
  };

})(window.V3);
