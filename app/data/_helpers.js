/* ============================================================================
 * app/data/_helpers.js - Sugar for writing production-method tables by hand.
 * ---------------------------------------------------------------------------
 * EN: Without this, every method would repeat `group`, `confidence`, `order`
 *     and an empty `inputs`/`outputs`/`jobs`. `V3.pmList()` lets a table read
 *     like the game's building panel:
 *
 *       V3.pmList('pmg_steel_base', [
 *         ['pm_blister_steel', 'Blister Steel Process', {
 *            in: {iron: 30, coal: 15}, out: {steel: 25},
 *            jobs: {laborers: 4500, machinists: 500}, icon: 'Method_...' }],
 *         ...
 *       ]);
 *
 *     Order inside the array is the order shown in the UI, and is also the
 *     upgrade order - the app assumes later entries are strictly better, which
 *     is what "pick the most advanced method I have unlocked" relies on.
 *
 * RU: Без этого каждый метод повторял бы `group`, `confidence`, `order` и
 *     пустые `inputs`/`outputs`/`jobs`. `V3.pmList()` позволяет писать таблицу
 *     так же, как выглядит панель здания в игре.
 *
 *     Порядок в массиве = порядок в интерфейсе и порядок улучшения: программа
 *     считает, что каждый следующий метод лучше предыдущего - на этом основан
 *     режим "выбрать самый продвинутый из открытых".
 * ==========================================================================*/
(function (V3) {
  'use strict';

  /**
   * @param {string} groupId  PM group these belong to
   * @param {Array}  rows     [id, name, opts] triples
   *        opts: {
   *          in:        {goodId: amount}   consumed per level per week
   *          out:       {goodId: amount}   produced per level per week
   *          jobs:      {popId: count}     employment delta per level
   *          icon:      'Method_xxx'
   *          tech:      'tech_xxx'         required technology
   *          pollution: number             per level
   *          infra:     number             extra infrastructure per level
   *          confidence 'verified' | 'approx' (default 'approx')
   *        }
   */
  V3.pmList = function (groupId, rows) {
    var out = rows.map(function (row, i) {
      var id = row[0], name = row[1], o = row[2] || {};
      return {
        id: id,
        name: name,
        group: groupId,
        icon: o.icon || null,
        unlockTech: o.tech || null,
        inputs: o.in || {},
        outputs: o.out || {},
        jobs: o.jobs || {},
        pollution: o.pollution || 0,
        infra: o.infra || 0,
        note: o.note || null,
        // Military rows only: combat stats and the extra goods a unit eats
        // while it is actually mobilised. Ignored for civilian methods.
        unit: o.unit || null,
        warMult: o.warMult || null,
        confidence: o.confidence || V3.APPROX,
        order: i + 1,
        tier: i          // 0 = most primitive; used by "auto-pick best unlocked"
      };
    });
    V3.define.pm(out);
  };

})(window.V3);
