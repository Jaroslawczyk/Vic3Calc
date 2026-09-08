/* ============================================================================
 * app/data/pm_groups.js - Production method GROUPS.
 * ---------------------------------------------------------------------------
 * EN: In Victoria 3 a building's panel is a set of rows, and in each row you
 *     pick exactly one method. Those rows are "PM groups".
 *
 *     A building's totals are the SUM of the one method chosen in every group:
 *
 *         building total = Σ (chosen method in group 1..n)
 *
 *     That is why automation methods can carry NEGATIVE employment: they are a
 *     delta applied on top of whatever the base method already hired.
 *
 *       id       key, also the translation key (`pmGroup.pmg_steel_base`)
 *       kind     'base'       - the row that does the real work
 *                'secondary'  - optional extra output from the same building
 *                'automation' - shifts labour, usually costs machines/power
 *                'ownership'  - who owns it, i.e. who takes the profit
 *       order    row order inside the building panel
 *
 * RU: В Victoria 3 панель здания - это набор строк, и в каждой строке
 *     выбирается ровно один метод. Эти строки и есть "группы методов".
 *
 *     Итог здания - СУММА выбранных методов по всем группам:
 *
 *         итог здания = Σ (выбранный метод в группе 1..n)
 *
 *     Поэтому у методов автоматизации занятость может быть ОТРИЦАТЕЛЬНОЙ: это
 *     поправка поверх того, что уже нанял базовый метод.
 * ==========================================================================*/
(function (V3) {
  'use strict';

  // NOTE: the semantic field is called `rowKind`, not `kind`. The registry uses
  // `kind` for the record type ('pmGroup'), so a data field of that name would be
  // silently overwritten - which it once was, and it cost an afternoon.
  function g(id, name, rowKind, order) {
    return { id: id, name: name, rowKind: rowKind, order: order };
  }

  V3.define.pmGroup([
    // ---- Agriculture --------------------------------------------------------
    g('pmg_farm_base',        'Base Production',      'base',       1),
    g('pmg_farm_secondary',   'Secondary Production', 'secondary',  2),
    g('pmg_farm_fert',        'Fertilization',        'automation', 3),
    g('pmg_ranch_base',       'Base Production',      'base',       1),
    g('pmg_ranch_secondary',  'Secondary Production', 'secondary',  2),
    g('pmg_plantation_base',  'Base Production',      'base',       1),

    // ---- Extraction ---------------------------------------------------------
    g('pmg_logging_base',     'Base Production',      'base',       1),
    g('pmg_logging_hardwood', 'Hardwood Selection',   'secondary',  2),
    g('pmg_rubber_base',      'Base Production',      'base',       1),
    g('pmg_mine_base_coal',   'Base Production',      'base',       1),
    g('pmg_mine_base_iron',   'Base Production',      'base',       1),
    g('pmg_mine_base_lead',   'Base Production',      'base',       1),
    g('pmg_mine_base_sulfur', 'Base Production',      'base',       1),
    g('pmg_mine_base_gold',   'Base Production',      'base',       1),
    g('pmg_mine_pumps',       'Water Pumps',          'automation', 2),
    g('pmg_oil_base',         'Base Production',      'base',       1),
    g('pmg_fishing_base',     'Base Production',      'base',       1),
    g('pmg_whaling_base',     'Base Production',      'base',       1),

    // ---- Manufacturing ------------------------------------------------------
    g('pmg_food_base',        'Base Production',      'base',       1),
    g('pmg_food_distillery',  'Distillery',           'secondary',  2),
    g('pmg_textile_base',     'Base Production',      'base',       1),
    g('pmg_textile_luxury',   'Luxury Clothes',       'secondary',  2),
    g('pmg_textile_silk',     'Artificial Silk',      'secondary',  3),
    g('pmg_furniture_base',   'Base Production',      'base',       1),
    g('pmg_furniture_luxury', 'Luxury Furniture',     'secondary',  2),
    g('pmg_glass_base',       'Base Production',      'base',       1),
    g('pmg_glass_ceramics',   'Ceramics',             'secondary',  2),
    g('pmg_paper_base',       'Base Production',      'base',       1),
    g('pmg_tools_base',       'Base Production',      'base',       1),
    g('pmg_steel_base',       'Base Production',      'base',       1),
    g('pmg_fertilizer_base',  'Base Production',      'base',       1),
    g('pmg_explosives_base',  'Base Production',      'base',       1),
    g('pmg_synthetics_base',  'Base Production',      'base',       1),
    g('pmg_motor_base',       'Base Production',      'base',       1),
    g('pmg_motor_auto',       'Automobiles',          'secondary',  2),
    g('pmg_motor_tanks',      'Tanks',                'secondary',  3),
    g('pmg_motor_aero',       'Aeroplanes',           'secondary',  4),
    g('pmg_electrics_base',   'Base Production',      'base',       1),
    g('pmg_electrics_radio',  'Radios',               'secondary',  2),
    g('pmg_shipyard_base',    'Base Production',      'base',       1),
    g('pmg_art_base',         'Base Production',      'base',       1),

    // ---- Military industry --------------------------------------------------
    g('pmg_arms_base',        'Base Production',      'base',       1),
    g('pmg_artillery_base',   'Base Production',      'base',       1),
    g('pmg_munitions_base',   'Base Production',      'base',       1),
    g('pmg_milship_base',     'Base Production',      'base',       1),

    // ---- Urban / infrastructure --------------------------------------------
    g('pmg_urban_base',       'Base Production',      'base',       1),
    g('pmg_urban_street',     'Street Lighting',      'secondary',  2),
    g('pmg_urban_transit',    'Public Transport',     'secondary',  3),
    g('pmg_port_base',        'Base Production',      'base',       1),
    g('pmg_rail_base',        'Base Production',      'base',       1),
    g('pmg_rail_passenger',   'Passenger Trains',     'secondary',  2),
    g('pmg_power_base',       'Base Production',      'base',       1),
    g('pmg_trade_base',       'Base Production',      'base',       1),

    // ---- Government / construction -----------------------------------------
    g('pmg_gov_base',         'Base Production',      'base',       1),
    g('pmg_uni_base',         'Base Production',      'base',       1),
    g('pmg_construction_base','Base Production',      'base',       1),

    // ---- Military -----------------------------------------------------------
    g('pmg_army_infantry',    'Infantry',             'base',       1),
    g('pmg_army_artillery',   'Artillery',            'base',       2),
    g('pmg_army_support',     'Support',              'secondary',  3),
    g('pmg_navy_capital',     'Capital Ships',        'base',       1),
    g('pmg_navy_light',       'Light Ships',          'base',       2),
    g('pmg_navy_doctrine',    'Naval Doctrine',       'secondary',  3),

    // ---- Private ------------------------------------------------------------
    g('pmg_finance_base',     'Base Production',      'base',       1),
    g('pmg_manor_base',       'Base Production',      'base',       1),
    g('pmg_subsistence_base', 'Base Production',      'base',       1),

    // ---- Shared rows offered by many buildings ------------------------------
    g('pmg_automation_light', 'Automation',           'automation', 8),
    g('pmg_automation_heavy', 'Automation',           'automation', 8),
    g('pmg_ownership_industry','Ownership',           'ownership',  9),
    g('pmg_ownership_rural',  'Ownership',            'ownership',  9)
  ]);

})(window.V3);
