/* ============================================================================
 * app/engine/research.js - Universities, innovation, and time-to-tech.
 * ---------------------------------------------------------------------------
 * EN: Research is the one chain where the bottleneck is usually NOT buildings.
 *     You can build twenty universities and get almost nothing extra, because
 *     innovation is capped by how many literate people you have. This module
 *     shows both numbers side by side so the answer to "why is my research
 *     slow" is visible in one glance:
 *
 *         produced   = Σ(university levels × method output)
 *         cap        = literacy-driven ceiling
 *         effective  = min(produced, cap)
 *
 *     Weeks to a technology = cost ÷ effective innovation.
 *
 *     The tech costs and the literacy ceiling are 'approx' - the SHAPE is
 *     right (more literacy raises the ceiling, era raises the cost) and the
 *     constants are tunable in Settings.
 *
 * RU: Исследования - единственная цепочка, где узкое место обычно НЕ здания.
 *     Можно построить двадцать университетов и почти ничего не получить,
 *     потому что инновации ограничены числом грамотных. Модуль показывает оба
 *     числа рядом, чтобы ответ на "почему медленно исследуется" был виден
 *     сразу.
 *
 *     Стоимость технологий и потолок грамотности - оценка: ФОРМА верна
 *     (грамотность поднимает потолок, эра поднимает цену), а константы
 *     настраиваются.
 * ==========================================================================*/
(function (V3) {
  'use strict';

  var R = V3.Research = {};

  /**
   * Approximate research cost of one technology, by era.
   * Marked approx: verify against your patch, then edit here or in Settings.
   */
  R.TECH_COST_BY_ERA = { 1: 3600, 2: 7200, 3: 12000, 4: 18000, 5: 25000 };

  /**
   * Innovation ceiling from literacy.
   * Modelled as: every literate percentage point supports 1 innovation.
   */
  R.capFromLiteracy = function (ctx) {
    var lit = V3.util.parseNum(ctx.country.literacyPct, 0);
    return V3.util.clamp(lit, 0, 100);
  };

  /**
   * @param {Object} setup { universityLevels, pms, extraInnovation }
   */
  R.evaluate = function (ctx, setup) {
    setup = setup || {};
    var levels = Math.max(0, setup.universityLevels || 0);
    var pms = setup.pms || V3.Context.defaultPMs(ctx, 'university');

    var ev = V3.BuildingCalc.evaluate(ctx, {
      buildingId: 'university', pms: pms, levels: levels
    });

    var produced = (ev.outputs.innovation || 0) + (setup.extraInnovation || 0);
    var cap = R.capFromLiteracy(ctx);
    var effective = Math.min(produced, cap);

    return {
      levels: levels,
      produced: produced,
      cap: cap,
      effective: effective,
      wasted: Math.max(0, produced - cap),
      capped: produced > cap,
      jobs: ev.jobs,
      inputs: ev.inputs,
      /** Weeks to finish one technology of each era. */
      weeksPerTech: Object.keys(R.TECH_COST_BY_ERA).reduce(function (acc, era) {
        acc[era] = effective > 0 ? R.TECH_COST_BY_ERA[era] / effective : Infinity;
        return acc;
      }, {}),
      /** How many university levels would be pure waste at this literacy. */
      excessLevels: produced > cap && produced > 0
        ? Math.floor(levels * (produced - cap) / produced) : 0
    };
  };

  /** Inverse: how many universities to hit a target innovation rate? */
  R.levelsForTarget = function (ctx, targetInnovation, pms) {
    pms = pms || V3.Context.defaultPMs(ctx, 'university');
    var per = V3.BuildingCalc.perLevel(ctx, 'university', pms);
    var out = per.outputs.innovation || 0;
    if (out <= 0) return Infinity;
    return Math.ceil(targetInnovation / out);
  };

})(window.V3);
