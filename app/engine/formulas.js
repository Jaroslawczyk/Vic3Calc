/* ============================================================================
 * app/engine/formulas.js - Every formula the app uses, written down once.
 * ---------------------------------------------------------------------------
 * EN: The rule in this project: no number appears on screen without the app
 *     being able to say where it came from. This file is that answer.
 *
 *     Each entry has an id, the formula as a readable string, a plain-language
 *     explanation, and the engine file that implements it. The UI shows them
 *     under every result panel (Settings -> "Show formulas"), and the Almanac
 *     links to them.
 *
 *     If you change how something is computed in engine/*.js, change the text
 *     here in the same commit. A stale explanation is worse than none.
 *
 * RU: Правило проекта: ни одно число не появляется на экране без возможности
 *     объяснить, откуда оно взялось. Этот файл и есть объяснение.
 *
 *     У каждой записи есть id, формула читаемой строкой, объяснение простым
 *     языком и файл движка, который её реализует. Интерфейс показывает их под
 *     каждой панелью результата (Настройки -> "Показывать формулы"), и на них
 *     ссылается альманах.
 *
 *     Если меняете расчёт в engine/*.js - меняйте текст здесь тем же коммитом.
 *     Устаревшее объяснение хуже, чем никакого.
 * ==========================================================================*/
(function (V3) {
  'use strict';

  var F = V3.formulas = {};

  var TABLE = {

    buildingOutput: {
      expr: 'output = Σ(method outputs) × levels × throughput',
      file: 'engine/building_calc.js',
      key: 'formula.buildingOutput'
    },

    throughput: {
      expr: 'throughput = 1 + economyOfScale + bonuses,   economyOfScale = min(levels, cap) × 1%',
      file: 'engine/building_calc.js',
      key: 'formula.throughput'
    },

    employment: {
      expr: 'workers(profession) = max(0, Σ(method jobs)) × levels',
      file: 'engine/building_calc.js',
      key: 'formula.employment'
    },

    levelsNeeded: {
      expr: 'levels = ⌈ demand ÷ (output per level × throughput) ⌉',
      file: 'engine/solver.js',
      key: 'formula.levelsNeeded'
    },

    chainFixedPoint: {
      expr: 'x = finalDemand + A · x     (repeat until it stops changing)',
      file: 'engine/solver.js',
      key: 'formula.chainFixedPoint'
    },

    surplus: {
      expr: 'surplus = produced + imported + stock − consumed',
      file: 'engine/solver.js',
      key: 'formula.surplus'
    },

    wages: {
      expr: 'wage bill = Σ(workers × wageWeight) × baseWage × wageMultiplier',
      file: 'engine/economy.js',
      key: 'formula.wages'
    },

    profit: {
      expr: 'profit = revenue − inputCost − wages',
      file: 'engine/economy.js',
      key: 'formula.profit'
    },

    infrastructure: {
      expr: 'infrastructure used = Σ(levels × usage per level);  available = state base + ports + railways',
      file: 'engine/building_calc.js',
      key: 'formula.infrastructure'
    },

    pollution: {
      expr: 'pollution = Σ(levels × method pollution)',
      file: 'engine/building_calc.js',
      key: 'formula.pollution'
    },

    constructionCost: {
      expr: 'cost = Σ(levels × building cost) × (1 + government cost modifier)',
      file: 'engine/construction.js',
      key: 'formula.constructionCost'
    },

    constructionTimeFlat: {
      expr: 'weeks = totalCost ÷ weeklyConstructionPoints',
      file: 'engine/construction.js',
      key: 'formula.constructionTimeFlat'
    },

    constructionTimeRamp: {
      expr: 'each week: spend min(pool, capPerBuilding) per queued building; ' +
            'a finished Construction Sector level adds its output to pool',
      file: 'engine/construction.js',
      key: 'formula.constructionTimeRamp'
    },

    militaryGoods: {
      expr: 'weekly goods = Σ over battalions of (peacetime input × warMultiplier if mobilised) + mobilisation options',
      file: 'engine/military.js',
      key: 'formula.militaryGoods'
    },

    militaryStrength: {
      expr: 'offence = Σ(battalions × method offence);  same for defence',
      file: 'engine/military.js',
      key: 'formula.militaryStrength'
    },

    researchRate: {
      expr: 'innovation = Σ(university levels × method output), capped by literacy',
      file: 'engine/research.js',
      key: 'formula.researchRate'
    }
  };

  /** Look up one formula record. */
  F.get = function (id) { return TABLE[id]; };

  /** All of them, for the Almanac's reference page. */
  F.all = function () {
    return Object.keys(TABLE).map(function (id) {
      var t = TABLE[id];
      return { id: id, expr: t.expr, file: t.file, key: t.key };
    });
  };

  /** Translated explanation, falling back to the raw expression. */
  F.explain = function (id) {
    var t = TABLE[id];
    if (!t) return '';
    var s = V3.t(t.key);
    return s === t.key ? t.expr : s;
  };

})(window.V3);
