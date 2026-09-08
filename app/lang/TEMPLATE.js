/* ============================================================================
 * app/lang/TEMPLATE.js - Start here to add a language.
 * ---------------------------------------------------------------------------
 * EN — THREE STEPS:
 *
 *   1. Copy this file to app/lang/<code>.js  (e.g. de.js, pl.js, es.js)
 *   2. Fill in `code`, `name`, `flag`, then translate.
 *      The easiest way: open app/lang/en.js next to it and translate the text
 *      to the RIGHT of each colon. Never change the text on the LEFT - those
 *      are the keys the program looks things up by.
 *      Keep {placeholders} in braces exactly as they are; the app substitutes
 *      real values into them.
 *   3. Add one line to app/index.html, next to the other language files:
 *          <script src="lang/<code>.js"></script>
 *
 *   You do NOT have to translate everything. Anything you leave out falls back
 *   to English, so a half-finished translation is still useful. Settings ->
 *   Language shows how complete each file is and the self-check lists exactly
 *   which keys are still missing.
 *
 * RU — ТРИ ШАГА:
 *
 *   1. Скопируйте файл в app/lang/<код>.js  (например de.js, pl.js, es.js)
 *   2. Заполните `code`, `name`, `flag` и переводите.
 *      Проще всего: откройте рядом app/lang/en.js и переводите текст СПРАВА от
 *      двоеточия. Текст СЛЕВА менять нельзя - это ключи, по которым программа
 *      ищет строки.
 *      {Подстановки} в фигурных скобках оставляйте как есть - программа
 *      подставляет в них настоящие значения.
 *   3. Добавьте одну строку в app/index.html рядом с другими языками:
 *          <script src="lang/<код>.js"></script>
 *
 *   Переводить всё необязательно. Непереведённое покажется по-английски,
 *   поэтому даже наполовину готовый перевод уже полезен. Настройки -> Язык
 *   показывает процент готовности каждого файла.
 * ==========================================================================*/
(function (V3) {
  'use strict';

  V3.i18n.register({
    code: 'xx',                 // ISO code: de, fr, pl, es, zh...
    name: 'Language name',      // shown in the language menu, in its own language
    flag: '🏳',                  // optional emoji
    credit: '',                 // optional: your name as translator

    ui: {
      // Copy the whole `ui` block from app/lang/en.js here and translate the
      // right-hand side. A few examples to show the shape:
      'app.title': 'Victoria 3 Calculator',
      'tab.chain': 'Calculator',
      'action.save': 'Save',
      'sum.workers': 'people employed',
      // {n} and {name} are substituted at run time - keep them.
      'order.levels': '{n} levels'
    },

    entities: {
      // Names of goods, buildings, professions, methods and technologies.
      // Key format is 'kind.id'. Look up any id in the Data tab, or in
      // app/data/*.js. Anything omitted shows its English name.
      'good.coal': 'Coal',
      'building.steel_mills': 'Steel Mills',
      'pop.machinists': 'Machinists'
    }
  });

})(window.V3);
