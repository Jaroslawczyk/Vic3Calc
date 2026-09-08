/* ============================================================================
 * app/data/pops.js - Professions (pop types).
 * ---------------------------------------------------------------------------
 * EN: Buildings do not hire "people", they hire specific professions, and each
 *     profession has to actually exist in the state. This table is what lets
 *     the calculator answer "what LEVEL of people do you need" and not just
 *     "how many".
 *
 *       strata        poor | middle | upper       (who they are socially)
 *       wageWeight    share of the building's wage pool one pop of this type
 *                     takes, relative to a Laborer (= 1). A building splits its
 *                     wages by  count x wageWeight, so 500 shopkeepers at
 *                     weight 5 cost the same as 2500 laborers.
 *       qualification what the pop needs before it can take the job:
 *                       'none'     - anyone
 *                       'basic'    - needs some literacy
 *                       'educated' - needs real education (university output)
 *       owner         true for pops paid out of profit (dividends), not wages.
 *
 *     wageWeight and qualification are marked 'approx': the shape is right and
 *     it is what drives the "you cannot staff this yet" warnings, but check the
 *     exact weights against your patch before planning a 200-level build.
 *
 * RU: Здания нанимают не "людей", а конкретные профессии, и профессия должна
 *     реально существовать в штате. Эта таблица позволяет калькулятору
 *     отвечать не только "сколько людей", но и "какого УРОВНЯ".
 *
 *       strata        poor | middle | upper       (социальный слой)
 *       wageWeight    доля фонда зарплаты на одного попа этого типа
 *                     относительно рабочего (Laborer = 1). Здание делит фонд
 *                     как  количество x wageWeight, поэтому 500 лавочников с
 *                     весом 5 стоят столько же, сколько 2500 рабочих.
 *       qualification что нужно попу, чтобы занять место:
 *                       'none'     - любой
 *                       'basic'    - нужна грамотность
 *                       'educated' - нужно образование (выпуск университетов)
 *       owner         true для тех, кому платят из прибыли, а не зарплатой.
 * ==========================================================================*/
(function (V3) {
  'use strict';

  var APPROX = V3.APPROX;

  V3.define.pop([
    // ---- Lower strata -------------------------------------------------------
    { id: 'peasants',    name: 'Peasants',    strata: 'poor',   wageWeight: 1, qualification: 'none',     icon: 'Pop_peasants',    confidence: APPROX, order: 1 },
    { id: 'laborers',    name: 'Laborers',    strata: 'poor',   wageWeight: 1, qualification: 'none',     icon: 'Pop_laborers',    confidence: APPROX, order: 2 },
    { id: 'machinists',  name: 'Machinists',  strata: 'poor',   wageWeight: 2, qualification: 'basic',    icon: 'Pop_machinists',  confidence: APPROX, order: 3 },
    { id: 'soldiers',    name: 'Servicemen',  strata: 'poor',   wageWeight: 1, qualification: 'none',     icon: 'Pop_soldiers',    confidence: APPROX, order: 4 },
    { id: 'slaves',      name: 'Slaves',      strata: 'poor',   wageWeight: 0, qualification: 'none',     icon: 'Pop_slaves',      confidence: APPROX, order: 5, unpaid: true },

    // ---- Middle strata ------------------------------------------------------
    { id: 'farmers',     name: 'Farmers',     strata: 'middle', wageWeight: 2, qualification: 'basic',    icon: 'Pop_farmers',     confidence: APPROX, order: 10 },
    { id: 'clerks',      name: 'Clerks',      strata: 'middle', wageWeight: 2, qualification: 'basic',    icon: 'Pop_clerks',      confidence: APPROX, order: 11 },
    { id: 'shopkeepers', name: 'Shopkeepers', strata: 'middle', wageWeight: 5, qualification: 'basic',    icon: 'Pop_shopkeepers', confidence: APPROX, order: 12 },
    { id: 'engineers',   name: 'Engineers',   strata: 'middle', wageWeight: 5, qualification: 'educated', icon: 'Pop_engineers',   confidence: APPROX, order: 13 },
    { id: 'bureaucrats', name: 'Bureaucrats', strata: 'middle', wageWeight: 3, qualification: 'educated', icon: 'Pop_bureaucrats', confidence: APPROX, order: 14 },
    { id: 'clergymen',   name: 'Clergymen',   strata: 'middle', wageWeight: 3, qualification: 'educated', icon: 'Pop_clergymen',   confidence: APPROX, order: 15 },
    { id: 'academics',   name: 'Academics',   strata: 'middle', wageWeight: 5, qualification: 'educated', icon: 'Pop_academics',   confidence: APPROX, order: 16 },
    { id: 'officers',    name: 'Officers',    strata: 'middle', wageWeight: 5, qualification: 'educated', icon: 'Pop_officers',    confidence: APPROX, order: 17 },

    // ---- Upper strata (paid from profit, not from the wage pool) -------------
    { id: 'capitalists', name: 'Capitalists', strata: 'upper',  wageWeight: 0, qualification: 'none',     icon: 'Pop_capitalists', confidence: APPROX, order: 20, owner: true },
    { id: 'aristocrats', name: 'Aristocrats', strata: 'upper',  wageWeight: 0, qualification: 'none',     icon: 'Pop_aristocrats', confidence: APPROX, order: 21, owner: true }
  ]);

})(window.V3);
