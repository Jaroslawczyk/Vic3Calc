/* ============================================================================
 * app/data/pm_military.js - Army, navy, and mobilisation.
 * ---------------------------------------------------------------------------
 * EN: In Victoria 3 you do not "buy units". You build Barracks and Naval Bases,
 *     and the production method you pick decides WHAT KIND of battalion or
 *     flotilla each level is, what it eats every week, and how hard it hits.
 *
 *     So the military tab of this app is really just the chain solver again:
 *
 *         battalions you want
 *           -> goods they eat per week
 *             -> factories that make those goods
 *               -> workers those factories need
 *
 *     `in`      goods eaten per level per week IN PEACETIME
 *     `warMult` multiplier applied to `in` while mobilised (default 2.0, and
 *               you can change the default in Settings). Peacetime armies are
 *               cheap; a war doubles the bill overnight and that is exactly the
 *               moment people run out of ammunition.
 *     `unit`    { offense, defense, kind } - used for the strength estimate.
 *
 *     Combat values are 'approx' and are RELATIVE numbers: use them to compare
 *     line infantry to trench infantry, not to predict a battle.
 *
 * RU: В Victoria 3 юниты не покупаются. Вы строите казармы и военные порты, а
 *     выбранный метод производства решает, КАКОГО ТИПА будет батальон или
 *     флотилия на каждом уровне, что он ест каждую неделю и как сильно бьёт.
 *
 *     Поэтому военная вкладка - это тот же решатель цепочек:
 *
 *         нужные батальоны
 *           -> товары, которые они едят в неделю
 *             -> заводы, производящие эти товары
 *               -> рабочие для этих заводов
 *
 *     `warMult` - множитель расхода во время войны (по умолчанию 2.0,
 *     меняется в настройках). Мирная армия дешёвая; война удваивает счёт за
 *     одну ночь - именно тогда у всех и заканчиваются патроны.
 * ==========================================================================*/
(function (V3) {
  'use strict';

  var pm = V3.pmList;

  // ===========================================================================
  // ARMY - INFANTRY ROW
  // One barracks level = one battalion. Employment is the garrison itself.
  // ===========================================================================
  pm('pmg_army_infantry', [
    ['pm_irregular_infantry', 'Irregular Infantry', {
      icon: 'Method_no_specialists',
      in: { small_arms: 5 }, warMult: 2,
      jobs: { soldiers: 1000, officers: 50 },
      unit: { offense: 10, defense: 10, kind: 'infantry' }
    }],
    ['pm_line_infantry', 'Line Infantry', {
      icon: 'Method_muskets', tech: 'tech_line_infantry',
      in: { small_arms: 10, ammunition: 5 }, warMult: 2,
      jobs: { soldiers: 1000, officers: 100 },
      unit: { offense: 20, defense: 20, kind: 'infantry' }
    }],
    ['pm_skirmish_infantry', 'Skirmish Infantry', {
      icon: 'Method_skirmish_infantry', tech: 'tech_rifling',
      in: { small_arms: 15, ammunition: 10 }, warMult: 2,
      jobs: { soldiers: 1000, officers: 100 },
      unit: { offense: 25, defense: 30, kind: 'infantry' }
    }],
    ['pm_trench_infantry', 'Trench Infantry', {
      icon: 'Method_bolt_action_rifles', tech: 'tech_bolt_action',
      in: { small_arms: 20, ammunition: 15 }, warMult: 2.5,
      jobs: { soldiers: 1000, officers: 150 },
      unit: { offense: 30, defense: 40, kind: 'infantry' }
    }],
    ['pm_squad_infantry', 'Squad Infantry', {
      icon: 'Method_machinegunners', tech: 'tech_machine_guns',
      in: { small_arms: 25, ammunition: 20, engines: 5 }, warMult: 2.5,
      jobs: { soldiers: 1000, officers: 200 },
      unit: { offense: 40, defense: 45, kind: 'infantry' }
    }]
  ]);

  // ===========================================================================
  // ARMY - ARTILLERY ROW
  // ===========================================================================
  pm('pmg_army_artillery', [
    ['pm_no_artillery', 'No Artillery', { icon: 'Method_no_specialists' }],
    ['pm_cannon_artillery', 'Cannon Artillery', {
      icon: 'Method_artillery_production',
      in: { artillery: 10, ammunition: 5 }, warMult: 2,
      unit: { offense: 25, defense: 10, kind: 'artillery' }
    }],
    ['pm_shrapnel_artillery', 'Shrapnel Artillery', {
      icon: 'Method_explosive_shells', tech: 'tech_breech_loading',
      in: { artillery: 15, ammunition: 10, explosives: 5 }, warMult: 2.5,
      unit: { offense: 35, defense: 15, kind: 'artillery' }
    }],
    ['pm_siege_artillery', 'Siege Artillery', {
      icon: 'Method_artillery_production', tech: 'tech_recoil_mechanism',
      in: { artillery: 20, ammunition: 15, explosives: 10 }, warMult: 2.5,
      unit: { offense: 45, defense: 20, kind: 'artillery' }
    }],
    ['pm_mobile_artillery', 'Mobile Artillery', {
      icon: 'Method_motorised_logistics', tech: 'tech_assembly_lines',
      in: { artillery: 25, ammunition: 20, explosives: 15, engines: 10 }, warMult: 3,
      unit: { offense: 55, defense: 25, kind: 'artillery' }
    }]
  ]);

  // ===========================================================================
  // ARMY - SUPPORT ROW
  // ===========================================================================
  pm('pmg_army_support', [
    ['pm_no_support', 'No Support', { icon: 'Method_no_specialists' }],
    ['pm_cavalry_scouts', 'Cavalry Scouts', {
      icon: 'Method_cavalry', in: { grain: 10 }, warMult: 2,
      unit: { offense: 5, defense: 5, kind: 'support' }
    }],
    ['pm_nco_incorporation', 'NCO Incorporation', {
      icon: 'Method_nco_incorporation', tech: 'tech_general_staff',
      in: { paper: 5 }, jobs: { officers: 100 },
      unit: { offense: 5, defense: 10, kind: 'support' }
    }],
    ['pm_motorised_transport', 'Motorised Transport', {
      icon: 'Method_truck_transport', tech: 'tech_combustion_engine',
      in: { engines: 10, oil: 10 }, warMult: 3,
      unit: { offense: 10, defense: 10, kind: 'support' }
    }]
  ]);

  // ===========================================================================
  // NAVY - CAPITAL SHIPS
  // One naval base level = one flotilla.
  // ===========================================================================
  pm('pmg_navy_capital', [
    ['pm_no_capital_ships', 'No Capital Ships', { icon: 'Method_no_naval_theory' }],
    ['pm_manowar_flotilla', 'Man-o-War Flotilla', {
      icon: 'Method_military_shipbuilding_wooden',
      in: { manowars: 10 }, warMult: 1.5,
      jobs: { soldiers: 1000, officers: 100 },
      unit: { offense: 20, defense: 20, kind: 'capital' }
    }],
    ['pm_ironclad_flotilla', 'Ironclad Flotilla', {
      icon: 'Method_military_shipbuilding_steam', tech: 'tech_ironclads',
      in: { ironclads: 10, coal: 10 }, warMult: 1.5,
      jobs: { soldiers: 1000, officers: 150 },
      unit: { offense: 40, defense: 40, kind: 'capital' }
    }],
    ['pm_dreadnought_flotilla', 'Dreadnought Flotilla', {
      icon: 'Method_military_shipbuilding_steam_2', tech: 'tech_dreadnoughts',
      in: { ironclads: 20, oil: 15 }, warMult: 2,
      jobs: { soldiers: 1000, officers: 200 },
      unit: { offense: 70, defense: 70, kind: 'capital' }
    }]
  ]);

  pm('pmg_navy_light', [
    ['pm_no_light_ships', 'No Light Ships', { icon: 'Method_no_naval_theory' }],
    ['pm_frigate_squadron', 'Frigate Squadron', {
      icon: 'Method_military_shipbuilding_wooden_2',
      in: { manowars: 5 }, warMult: 1.5,
      unit: { offense: 10, defense: 15, kind: 'light' }
    }],
    ['pm_torpedo_boats', 'Torpedo Boats', {
      icon: 'Method_jeune_ecole', tech: 'tech_torpedoes',
      in: { ironclads: 5, explosives: 10 }, warMult: 2,
      unit: { offense: 25, defense: 10, kind: 'light' }
    }],
    ['pm_destroyer_squadron', 'Destroyer Squadron', {
      icon: 'Method_battlefleet_tactics', tech: 'tech_destroyers',
      in: { ironclads: 10, oil: 10 }, warMult: 2,
      unit: { offense: 30, defense: 25, kind: 'light' }
    }]
  ]);

  pm('pmg_navy_doctrine', [
    ['pm_no_naval_theory', 'No Naval Doctrine', { icon: 'Method_no_naval_theory' }],
    ['pm_jeune_ecole', 'Jeune École', {
      icon: 'Method_jeune_ecole', tech: 'tech_naval_theory',
      in: { paper: 5 }, unit: { offense: 10, defense: 0, kind: 'doctrine' }
    }],
    ['pm_mahanian_thought', 'Mahanian Thought', {
      icon: 'Method_mahanian_thought', tech: 'tech_naval_theory',
      in: { paper: 5 }, unit: { offense: 0, defense: 15, kind: 'doctrine' }
    }],
    ['pm_battlefleet_tactics', 'Battlefleet Tactics', {
      icon: 'Method_battlefleet_tactics', tech: 'tech_battlefleet',
      in: { paper: 10 }, unit: { offense: 15, defense: 15, kind: 'doctrine' }
    }]
  ]);

  // ===========================================================================
  // MOBILISATION OPTIONS
  // ---------------------------------------------------------------------------
  // EN: Switched on per-army only while a war is running. Each one adds goods
  //     consumption PER BATTALION on top of the normal wartime bill. This is
  //     the row that quietly bankrupts people - the calculator shows it plainly.
  // RU: Включаются только на время войны. Каждая добавляет расход товаров НА
  //     БАТАЛЬОН сверх обычного военного счёта. Именно эта строка тихо
  //     разоряет игроков - калькулятор показывает её прямо.
  // ===========================================================================
  V3.define.pmGroup([
    { id: 'pmg_mobilization', name: 'Mobilization Options', rowKind: 'mobilization', order: 20 }
  ]);

  pm('pmg_mobilization', [
    ['mob_basic_supplies', 'Basic Supplies', {
      icon: 'Mobilization_basic_supplies', in: { grain: 10 },
      note: 'Cheapest way to keep morale from collapsing.'
    }],
    ['mob_extra_supplies', 'Extra Supplies', {
      icon: 'Mobilization_extra_supplies', in: { grain: 15, groceries: 10 }
    }],
    ['mob_luxurious_supplies', 'Luxurious Supplies', {
      icon: 'Mobilization_luxurious_supplies', in: { groceries: 15, meat: 10, wine: 5 }
    }],
    ['mob_basic_medical_aid', 'Basic Medical Aid', {
      icon: 'Mobilization_basic_medical_aid', in: { fabric: 10 }
    }],
    ['mob_field_hospitals', 'Field Hospitals', {
      icon: 'Mobilization_field_hospitals', tech: 'tech_medicine',
      in: { fabric: 15, groceries: 10, services: 10 }
    }],
    ['mob_tobacco', 'Tobacco Ration', { icon: 'Mobilization_tobacco', in: { tobacco: 10 } }],
    ['mob_liquor', 'Liquor Ration', { icon: 'Mobilization_liquor', in: { liquor: 10 } }],
    ['mob_opium', 'Opium Ration', { icon: 'Mobilization_opium', in: { opium: 10 } }],
    ['mob_chocolate', 'Chocolate Ration', { icon: 'Mobilization_chocolate', in: { groceries: 10, sugar: 5 } }],
    ['mob_machinegunners', 'Machine Gunners', {
      icon: 'Mobilization_machinegunners', tech: 'tech_machine_guns',
      in: { small_arms: 15, ammunition: 15 }, unit: { offense: 10, defense: 10, kind: 'mobilization' }
    }],
    ['mob_flamethrowers', 'Flamethrowers', {
      icon: 'Mobilization_flamethrowers', tech: 'tech_flamethrowers',
      in: { oil: 10, explosives: 10 }, unit: { offense: 15, defense: 0, kind: 'mobilization' }
    }],
    ['mob_chemical_weapons', 'Chemical Weapons', {
      icon: 'Mobilization_chemical_weapons', tech: 'tech_chemical_warfare',
      in: { sulfur: 15, explosives: 10 }, unit: { offense: 20, defense: 0, kind: 'mobilization' }
    }],
    ['mob_rail_transport', 'Rail Transport', {
      icon: 'Mobilization_rail_transport', tech: 'tech_railways',
      in: { transportation: 15 }
    }],
    ['mob_truck_transport', 'Truck Transport', {
      icon: 'Mobilization_truck_transport', tech: 'tech_combustion_engine',
      in: { engines: 10, oil: 15 }
    }],
    ['mob_balloon_recon', 'Balloon Reconnaissance', {
      icon: 'Mobilization_balloon_recon', in: { fabric: 10 },
      unit: { offense: 5, defense: 5, kind: 'mobilization' }
    }],
    ['mob_aerial_reconaissance', 'Aerial Reconnaissance', {
      icon: 'Mobilization_aerial_reconaissance', tech: 'tech_aeroplanes',
      in: { aeroplanes: 10, oil: 10 }, unit: { offense: 10, defense: 10, kind: 'mobilization' }
    }]
  ]);

})(window.V3);
