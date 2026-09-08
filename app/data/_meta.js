/* ============================================================================
 * app/data/_meta.js - Where the numbers come from, and how sure we are.
 * ---------------------------------------------------------------------------
 * EN: PLEASE READ THIS BEFORE TRUSTING A NUMBER.
 *
 *     Every record in app/data/ carries a `confidence` field:
 *
 *       'verified' - transcribed from the Victoria 3 Wiki and cross-checked.
 *       'approx'   - a best-effort value. The shape of the formula is right,
 *                    the exact number may not be. The app puts a small "?"
 *                    badge next to anything derived from an 'approx' value so
 *                    you always know which results to double-check.
 *
 *     This is deliberate: the calculator is only as good as its table, and
 *     Paradox changes the table every patch. Rather than pretend, the app
 *     shows you exactly where it is guessing and lets you fix it in two clicks
 *     (Data tab -> pick the record -> edit -> it is yours forever and travels
 *     in your .v3pack.json).
 *
 *     If you correct a number, please also flip its confidence to 'verified'
 *     and note the patch you checked against.
 *
 * RU: ПОЖАЛУЙСТА, ПРОЧТИТЕ ДО ТОГО, КАК ДОВЕРИТЬСЯ ЦИФРЕ.
 *
 *     У каждой записи в app/data/ есть поле `confidence`:
 *
 *       'verified' - взято с Victoria 3 Wiki и перепроверено.
 *       'approx'   - оценка. Форма формулы верна, точное число может быть не
 *                    таким. Рядом со всем, что посчитано из 'approx', в
 *                    интерфейсе стоит маленький значок "?" - чтобы вы всегда
 *                    знали, какие результаты стоит перепроверить.
 *
 *     Это сделано намеренно: калькулятор не лучше своей таблицы, а Paradox
 *     меняет таблицу каждым патчем. Вместо того чтобы делать вид, программа
 *     честно показывает, где она догадывается, и даёт исправить в два клика
 *     (вкладка "Данные" -> выбрать запись -> изменить -> правка ваша навсегда
 *     и уезжает вместе с вашим .v3pack.json).
 *
 *     Если вы исправили число - поменяйте confidence на 'verified' и укажите
 *     патч, по которому сверялись.
 * ==========================================================================*/
(function (V3) {
  'use strict';

  V3.dataMeta = {
    revision: '2026-09-08',
    /** The game patch this table is aimed at. Shown in Settings. */
    gameVersion: '1.9.x',
    source: 'https://vic3.paradoxwikis.com/',
    /**
     * Goods base prices were read off the wiki Goods table and are 'verified'.
     * Production-method inputs/outputs, employment splits and construction
     * costs are 'approx' unless individually marked otherwise - the wiki keeps
     * those on per-building pages that are hard to transcribe exhaustively.
     */
    notes: {
      en: 'Base prices verified against the wiki Goods table. Production method ' +
          'numbers are best-effort and marked accordingly - check the "?" badges.',
      ru: 'Базовые цены сверены с таблицей Goods на вики. Числа методов ' +
          'производства - оценка, помечены значком "?" - проверяйте их.'
    }
  };

  /** Helper used by the data files so every record does not repeat the string. */
  V3.OK = 'verified';
  V3.APPROX = 'approx';

})(window.V3);
