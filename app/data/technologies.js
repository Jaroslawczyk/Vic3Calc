/* ============================================================================
 * app/data/technologies.js - Technologies, only as gates.
 * ---------------------------------------------------------------------------
 * EN: This app does not simulate the tech tree. It only needs to answer one
 *     question: "is this production method available to me yet?" So a tech here
 *     is just an id, a name, an era and a category.
 *
 *     In the Calculator you tick the techs you have (or set an era and take
 *     everything up to it). Locked methods are then greyed out, and the
 *     "use the best method I have" button respects your choices - which is the
 *     whole point: a plan you cannot actually build yet is not a plan.
 *
 *       era       1..5, matching the game's technology eras
 *       category  production | military | society
 *
 * RU: Программа не моделирует дерево технологий. Ей нужно ответить только на
 *     один вопрос: "доступен ли мне этот метод производства?" Поэтому
 *     технология здесь - это id, название, эра и категория.
 *
 *     В калькуляторе вы отмечаете изученное (или выбираете эру и берёте всё до
 *     неё). Недоступные методы гаснут, а кнопка "взять лучший доступный метод"
 *     учитывает ваш выбор - в этом и смысл: план, который нельзя построить, не
 *     является планом.
 * ==========================================================================*/
(function (V3) {
  'use strict';

  var rows = [
    // id                        name                          era category
    ['tech_tools',               'Tooling',                     1, 'production'],
    ['tech_distillation',        'Distillation',                1, 'production'],
    ['tech_manufacturies',       'Manufacturies',               1, 'production'],
    ['tech_atmospheric_engine',  'Atmospheric Engine',          1, 'production'],
    ['tech_pig_iron',            'Pig Iron',                    1, 'production'],
    ['tech_shipbuilding',        'Shipbuilding',                1, 'production'],
    ['tech_urbanization',        'Urbanization',                1, 'society'],
    ['tech_bureaucracy',         'Centralization'          , 1, 'society'],
    ['tech_academia',            'Academia',                    1, 'society'],
    ['tech_line_infantry',       'Line Infantry',               1, 'military'],
    ['tech_whaling',             'Whaling',                     1, 'production'],
    ['tech_naval_theory',        'Naval Theory',                1, 'military'],

    ['tech_railways',            'Railways',                    2, 'production'],
    ['tech_steam_ships',         'Steam Ships',                 2, 'production'],
    ['tech_steel',               'Steelworks',                  2, 'production'],
    ['tech_chemistry',           'Chemistry',                   2, 'production'],
    ['tech_fertilizer',          'Fertilizer',                  2, 'production'],
    ['tech_gas_lighting',        'Gas Lighting',                2, 'production'],
    ['tech_central_banking',     'Central Banking',             2, 'society'],
    ['tech_arts_and_crafts',     'Arts and Crafts',             2, 'society'],
    ['tech_realism',             'Realism',                     2, 'society'],
    ['tech_homesteading',        'Homesteading',                2, 'society'],
    ['tech_rifling',             'Rifling',                     2, 'military'],
    ['tech_breech_loading',      'Breech-Loading Artillery',    2, 'military'],
    ['tech_general_staff',       'General Staff',               2, 'military'],
    ['tech_ironclads',           'Ironclads',                   2, 'military'],

    ['tech_open_hearth',         'Open Hearth Process',         3, 'production'],
    ['tech_nitroglycerin',       'Nitroglycerin',               3, 'production'],
    ['tech_dynamite',            'Dynamite',                    3, 'production'],
    ['tech_electricity',         'Electricity',                 3, 'production'],
    ['tech_engines',             'Engines',                     3, 'production'],
    ['tech_oil_rig',             'Oil Rig',                     3, 'production'],
    ['tech_telephone',           'Telephone',                   3, 'production'],
    ['tech_photography',         'Photography',                 3, 'society'],
    ['tech_empiricism',          'Empiricism',                  3, 'society'],
    ['tech_mass_communication',  'Mass Communication',          3, 'society'],
    ['tech_socialism',           'Socialism',                   3, 'society'],
    ['tech_medicine',            'Modern Medicine',             3, 'society'],
    ['tech_repeaters',           'Repeaters',                   3, 'military'],
    ['tech_recoil_mechanism',    'Recoil Mechanism',            3, 'military'],
    ['tech_torpedoes',           'Torpedoes',                   3, 'military'],
    ['tech_machine_guns',        'Machine Guns',                3, 'military'],

    ['tech_synthetics',          'Synthetics',                  4, 'production'],
    ['tech_oil_refining',        'Oil Refining',                4, 'production'],
    ['tech_combustion_engine',   'Combustion Engine',           4, 'production'],
    ['tech_hydroelectric',       'Hydroelectric Power',         4, 'production'],
    ['tech_radio',               'Radio',                       4, 'production'],
    ['tech_nitrogen_fixation',   'Nitrogen Fixation',           4, 'production'],
    ['tech_bolt_action',         'Bolt-Action Rifles',          4, 'military'],
    ['tech_dreadnoughts',        'Dreadnoughts',                4, 'military'],
    ['tech_destroyers',          'Destroyers',                  4, 'military'],
    ['tech_battlefleet',         'Battlefleet Doctrine',        4, 'military'],
    ['tech_flamethrowers',       'Flamethrowers',               4, 'military'],
    ['tech_chemical_warfare',    'Chemical Warfare',            4, 'military'],

    ['tech_assembly_lines',      'Assembly Lines',              5, 'production'],
    ['tech_aeroplanes',          'Aeroplanes',                  5, 'military']
  ];

  V3.define.tech(rows.map(function (r, i) {
    return {
      id: r[0], name: r[1], era: r[2], category: r[3],
      icon: 'Panel_technology',
      confidence: V3.APPROX,
      order: r[2] * 100 + i
    };
  }));

})(window.V3);
