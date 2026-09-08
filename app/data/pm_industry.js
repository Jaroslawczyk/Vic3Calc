/* ============================================================================
 * app/data/pm_industry.js - Production methods: factories.
 * ---------------------------------------------------------------------------
 * EN: Same conventions as pm_primary.js. All values 'approx'.
 *     Reading tip: the input:output RATIO is the number that actually decides
 *     how many upstream buildings you need. If you only fix one thing in this
 *     file, fix the ratios, not the absolute sizes.
 *
 * RU: Соглашения те же, что и в pm_primary.js. Все значения - оценка.
 *     Подсказка: количество зданий выше по цепочке определяет ОТНОШЕНИЕ входа
 *     к выходу. Если правите одно - правьте отношения, а не абсолютные числа.
 * ==========================================================================*/
(function (V3) {
  'use strict';

  var pm = V3.pmList;

  // ===========================================================================
  // FOOD INDUSTRY
  // ===========================================================================
  pm('pmg_food_base', [
    ['pm_bakeries', 'Bakeries', {
      icon: 'Method_bakeries', in: { grain: 30 }, out: { groceries: 40 },
      jobs: { laborers: 4500, machinists: 500 }
    }],
    ['pm_baking_powder', 'Baking Powder', {
      icon: 'Method_baking_powder', tech: 'tech_chemistry',
      in: { grain: 40, fertilizer: 10 }, out: { groceries: 60 },
      jobs: { laborers: 4500, machinists: 500 }
    }],
    ['pm_automated_bakery', 'Automated Bakeries', {
      icon: 'Method_automated_bakery', tech: 'tech_electricity',
      in: { grain: 50, fertilizer: 15, electricity: 10 }, out: { groceries: 85 },
      jobs: { laborers: 4000, machinists: 1000 }, pollution: 4
    }]
  ]);

  pm('pmg_food_distillery', [
    ['pm_no_distillery', 'No Distillery', { icon: 'Method_no_distillery' }],
    ['pm_pot_stills', 'Pot Stills', {
      icon: 'Method_pot_stills', in: { grain: 15 }, out: { liquor: 15 }
    }],
    ['pm_patent_stills', 'Patent Stills', {
      icon: 'Method_patent_stills', tech: 'tech_chemistry',
      in: { grain: 25 }, out: { liquor: 30 }
    }]
  ]);

  // ===========================================================================
  // TEXTILE MILLS
  // ===========================================================================
  pm('pmg_textile_base', [
    ['pm_craftsman_sewing', 'Craftsman Sewing', {
      icon: 'Method_craftsman_sewing', in: { fabric: 25 }, out: { clothes: 30 },
      jobs: { laborers: 4500, machinists: 500 }
    }],
    ['pm_sewing_machines', 'Sewing Machines', {
      icon: 'Method_sewing_machines', tech: 'tech_manufacturies',
      in: { fabric: 40, tools: 10 }, out: { clothes: 55 },
      jobs: { laborers: 4500, machinists: 500 }
    }],
    ['pm_electric_sewing_machines', 'Electric Sewing Machines', {
      icon: 'Method_electric_sewing_machines', tech: 'tech_electricity',
      in: { fabric: 60, tools: 15, electricity: 10 }, out: { clothes: 85 },
      jobs: { laborers: 4000, machinists: 1000 }, pollution: 4
    }],
    ['pm_automatic_power_looms', 'Automatic Power Looms', {
      icon: 'Method_automatic_power_looms', tech: 'tech_assembly_lines',
      in: { fabric: 80, tools: 20, electricity: 20 }, out: { clothes: 120 },
      jobs: { laborers: 3500, machinists: 1500 }, pollution: 6
    }]
  ]);

  pm('pmg_textile_luxury', [
    ['pm_no_luxury_clothes', 'No Luxury Clothes', { icon: 'Method_no_luxury_clothes' }],
    ['pm_handsewn_clothes', 'Hand-Sewn Luxury Clothes', {
      icon: 'Method_handsewn_clothes', in: { silk: 15 }, out: { luxury_clothes: 15 }
    }],
    ['pm_luxury_sewing_machines', 'Machine-Sewn Luxury Clothes', {
      icon: 'Method_sewing_machines', tech: 'tech_manufacturies',
      in: { silk: 25, dye: 10 }, out: { luxury_clothes: 30 }
    }]
  ]);

  pm('pmg_textile_silk', [
    ['pm_no_artificial_silk', 'No Artificial Silk', { icon: 'Method_no_artificial_silk' }],
    ['pm_rayon', 'Rayon', {
      icon: 'Method_rayon', tech: 'tech_synthetics',
      in: { wood: 20, sulfur: 10 }, out: { silk: 25 }
    }]
  ]);

  // ===========================================================================
  // FURNITURE
  // ===========================================================================
  pm('pmg_furniture_base', [
    ['pm_furniture_handicraft', 'Furniture Handicraft', {
      icon: 'Method_furniture_handicraft', in: { wood: 25 }, out: { furniture: 30 },
      jobs: { laborers: 4500, machinists: 500 }
    }],
    ['pm_lathes', 'Lathes', {
      icon: 'Method_lathes', tech: 'tech_manufacturies',
      in: { wood: 40, tools: 10 }, out: { furniture: 55 },
      jobs: { laborers: 4500, machinists: 500 }
    }],
    ['pm_mechanized_workshops', 'Mechanized Workshops', {
      icon: 'Method_mechanized_workshops', tech: 'tech_electricity',
      in: { wood: 60, tools: 15, electricity: 10 }, out: { furniture: 85 },
      jobs: { laborers: 4000, machinists: 1000 }, pollution: 4
    }],
    ['pm_houseware_plastics', 'Houseware Plastics', {
      icon: 'Method_houseware_plastics', tech: 'tech_synthetics',
      in: { wood: 60, tools: 20, oil: 20, electricity: 15 }, out: { furniture: 120 },
      jobs: { laborers: 3500, machinists: 1500 }, pollution: 8
    }]
  ]);

  pm('pmg_furniture_luxury', [
    ['pm_no_luxury_furniture', 'No Luxury Furniture', { icon: 'Method_no_luxury_furniture' }],
    ['pm_luxury_furniture', 'Luxury Furniture', {
      icon: 'Method_luxury_furniture', in: { hardwood: 15 }, out: { luxury_furniture: 15 }
    }],
    ['pm_horizontal_drawer_cabinets', 'Fine Cabinetry', {
      icon: 'Method_horizontal_drawer_cabinets', tech: 'tech_manufacturies',
      in: { hardwood: 25, glass: 10 }, out: { luxury_furniture: 30 }
    }]
  ]);

  // ===========================================================================
  // GLASSWORKS
  // ===========================================================================
  pm('pmg_glass_base', [
    ['pm_glassworks_handicraft', 'Glassblowing', {
      icon: 'Method_glassworks_handicraft', in: { wood: 20 }, out: { glass: 25 },
      jobs: { laborers: 4500, machinists: 500 }, pollution: 3
    }],
    ['pm_leaded_glass', 'Leaded Glass', {
      icon: 'Method_leaded_glass', tech: 'tech_manufacturies',
      in: { wood: 25, lead: 15 }, out: { glass: 45 },
      jobs: { laborers: 4500, machinists: 500 }, pollution: 5
    }],
    ['pm_automated_bottle_blowers', 'Automated Bottle Blowers', {
      icon: 'Method_automated_bottle_blowers', tech: 'tech_electricity',
      in: { coal: 25, lead: 20, electricity: 10 }, out: { glass: 70 },
      jobs: { laborers: 4000, machinists: 1000 }, pollution: 8
    }]
  ]);

  pm('pmg_glass_ceramics', [
    ['pm_no_ceramics', 'No Ceramics', { icon: 'Method_no_ceramics' }],
    ['pm_ceramics', 'Ceramics', {
      icon: 'Method_ceramics', in: { coal: 10 }, out: { porcelain: 10 }
    }],
    ['pm_bone_china', 'Bone China', {
      icon: 'Method_bone_china', tech: 'tech_chemistry',
      in: { coal: 15, lead: 10 }, out: { porcelain: 20 }
    }]
  ]);

  // ===========================================================================
  // PAPER MILLS
  // ===========================================================================
  pm('pmg_paper_base', [
    ['pm_crude_paper', 'Crude Paper Milling', {
      icon: 'Method_crude_paper', in: { wood: 25 }, out: { paper: 30 },
      jobs: { laborers: 4500, machinists: 500 }, pollution: 3
    }],
    ['pm_pulp_pressing', 'Pulp Mills', {
      icon: 'Method_pulp_pressing', tech: 'tech_manufacturies',
      in: { wood: 40, tools: 10 }, out: { paper: 55 },
      jobs: { laborers: 4500, machinists: 500 }, pollution: 5
    }],
    ['pm_bleached_paper', 'Bleached Paper', {
      icon: 'Method_bleached_paper', tech: 'tech_chemistry',
      in: { wood: 55, sulfur: 15, electricity: 10 }, out: { paper: 85 },
      jobs: { laborers: 4000, machinists: 1000 }, pollution: 10
    }]
  ]);

  // ===========================================================================
  // TOOLING WORKSHOPS - the single most important building in the game: almost
  // every advanced method upstream and downstream wants Tools.
  // ===========================================================================
  pm('pmg_tools_base', [
    ['pm_crude_tools', 'Crude Tools', {
      icon: 'Method_crude_tools', in: { iron: 25 }, out: { tools: 30 },
      jobs: { laborers: 4500, machinists: 500 }, pollution: 3
    }],
    ['pm_pig_iron_tools', 'Pig Iron Tools', {
      icon: 'Method_pig_iron_tools', tech: 'tech_pig_iron',
      in: { iron: 40, coal: 15 }, out: { tools: 55 },
      jobs: { laborers: 4500, machinists: 500 }, pollution: 6
    }],
    ['pm_precision_tools', 'Precision Tools', {
      icon: 'Method_precision_tools', tech: 'tech_steel',
      in: { steel: 40, coal: 15 }, out: { tools: 85 },
      jobs: { laborers: 4000, machinists: 1000 }, pollution: 8
    }],
    ['pm_electric_precision_tools', 'Electric Precision Tools', {
      icon: 'Method_electric_arc_process', tech: 'tech_assembly_lines',
      in: { steel: 55, electricity: 20 }, out: { tools: 120 },
      jobs: { laborers: 3500, machinists: 1500 }, pollution: 6
    }]
  ]);

  // ===========================================================================
  // STEEL MILLS
  // ===========================================================================
  pm('pmg_steel_base', [
    ['pm_blister_steel_process', 'Blister Steel Process', {
      icon: 'Method_blister_steel_process', tech: 'tech_pig_iron',
      in: { iron: 30, coal: 20 }, out: { steel: 25 },
      jobs: { laborers: 4500, machinists: 500 }, pollution: 10
    }],
    ['pm_bessemer_process', 'Bessemer Process', {
      icon: 'Method_bessemer_process', tech: 'tech_steel',
      in: { iron: 45, coal: 30 }, out: { steel: 45 },
      jobs: { laborers: 4000, machinists: 1000 }, pollution: 16
    }],
    ['pm_open_hearth_process', 'Open Hearth Process', {
      icon: 'Method_open_hearth_process', tech: 'tech_open_hearth',
      in: { iron: 60, coal: 40, tools: 10 }, out: { steel: 70 },
      jobs: { laborers: 3500, machinists: 1500 }, pollution: 22
    }],
    ['pm_electric_arc_process', 'Electric Arc Process', {
      icon: 'Method_electric_arc_process', tech: 'tech_electricity',
      in: { iron: 75, coal: 20, electricity: 30 }, out: { steel: 100 },
      jobs: { laborers: 3000, machinists: 2000 }, pollution: 12
    }]
  ]);

  // ===========================================================================
  // CHEMICALS / EXPLOSIVES / SYNTHETICS
  // ===========================================================================
  pm('pmg_fertilizer_base', [
    ['pm_leblanc_process', 'Leblanc Process', {
      icon: 'Method_leblanc_process', tech: 'tech_fertilizer',
      in: { sulfur: 20, coal: 15 }, out: { fertilizer: 35 },
      jobs: { laborers: 4000, machinists: 1000 }, pollution: 14
    }],
    ['pm_ammonia_soda_process', 'Ammonia-Soda Process', {
      icon: 'Method_ammonia-soda_process', tech: 'tech_chemistry',
      in: { sulfur: 30, coal: 25 }, out: { fertilizer: 60 },
      jobs: { laborers: 3500, machinists: 1500 }, pollution: 18
    }],
    ['pm_nitrogen_fixation', 'Nitrogen Fixation', {
      icon: 'Method_nitrogen_fixation', tech: 'tech_nitrogen_fixation',
      in: { sulfur: 30, electricity: 30 }, out: { fertilizer: 100 },
      jobs: { laborers: 3000, machinists: 2000 }, pollution: 10
    }]
  ]);

  pm('pmg_explosives_base', [
    ['pm_nitroglycerin', 'Nitroglycerin', {
      icon: 'Method_nitroglycerin', tech: 'tech_nitroglycerin',
      in: { sulfur: 25, fertilizer: 15 }, out: { explosives: 35 },
      jobs: { laborers: 4000, machinists: 1000 }, pollution: 12
    }],
    ['pm_dynamite', 'Dynamite', {
      icon: 'Method_dynamite', tech: 'tech_dynamite',
      in: { sulfur: 35, fertilizer: 25, paper: 10 }, out: { explosives: 60 },
      jobs: { laborers: 3500, machinists: 1500 }, pollution: 16
    }]
  ]);

  pm('pmg_synthetics_base', [
    ['pm_synthetic_dye', 'Aniline Dye', {
      icon: 'Method_dye_workshops', tech: 'tech_synthetics',
      in: { coal: 30, sulfur: 15 }, out: { dye: 50 },
      jobs: { laborers: 3500, machinists: 1500 }, pollution: 18
    }],
    ['pm_synthetic_rubber', 'Synthetic Rubber', {
      icon: 'Method_elastics', tech: 'tech_synthetics',
      in: { oil: 30, sulfur: 20, electricity: 20 }, out: { rubber: 60 },
      jobs: { laborers: 3000, machinists: 2000 }, pollution: 22
    }],
    ['pm_synthetic_oil', 'Coal Liquefaction', {
      icon: 'Method_dry_process', tech: 'tech_oil_refining',
      in: { coal: 60, electricity: 25 }, out: { oil: 60 },
      jobs: { laborers: 3000, machinists: 2000 }, pollution: 28
    }]
  ]);

  // ===========================================================================
  // MOTOR & ELECTRICS
  // ===========================================================================
  pm('pmg_motor_base', [
    ['pm_experimental_trains', 'Experimental Engines', {
      icon: 'Method_experimental_trains', tech: 'tech_engines',
      in: { steel: 30, coal: 15, tools: 15 }, out: { engines: 30 },
      jobs: { laborers: 4000, machinists: 1000 }, pollution: 12
    }],
    ['pm_electric_engines', 'Electric Engines', {
      icon: 'Method_electric_engines', tech: 'tech_electricity',
      in: { steel: 45, tools: 25, electricity: 20 }, out: { engines: 55 },
      jobs: { laborers: 3500, machinists: 1500 }, pollution: 10
    }],
    ['pm_diesel_engines', 'Diesel Engines', {
      icon: 'Method_diesel_engines', tech: 'tech_combustion_engine',
      in: { steel: 60, tools: 35, oil: 20, electricity: 20 }, out: { engines: 85 },
      jobs: { laborers: 3000, machinists: 2000 }, pollution: 16
    }]
  ]);

  pm('pmg_motor_auto', [
    ['pm_no_automobiles', 'No Automobiles', { icon: 'Method_no_automobiles' }],
    ['pm_automobiles', 'Automobiles', {
      icon: 'Method_automobiles', tech: 'tech_combustion_engine',
      in: { steel: 25, rubber: 15, engines: 10 }, out: { automobiles: 25 }
    }],
    ['pm_assembly_lines', 'Assembly Lines', {
      icon: 'Method_assembly_lines', tech: 'tech_assembly_lines',
      in: { steel: 40, rubber: 25, engines: 20, electricity: 15 }, out: { automobiles: 50 }
    }]
  ]);

  // Tanks and aeroplanes come out of the same factory as cars - which is why a
  // country with no motor industry simply cannot field them, no matter how much
  // it spends on barracks.
  pm('pmg_motor_tanks', [
    ['pm_no_tanks', 'No Tanks', { icon: 'Method_no_tanks' }],
    ['pm_tanks', 'Tanks', {
      icon: 'Method_assembly_lines', tech: 'tech_assembly_lines',
      in: { steel: 40, engines: 20, explosives: 10 }, out: { tanks: 30 }
    }]
  ]);

  pm('pmg_motor_aero', [
    ['pm_no_aeroplanes', 'No Aeroplanes', { icon: 'Method_no_aeroplanes' }],
    ['pm_aeroplanes', 'Aeroplanes', {
      icon: 'Method_aeroplanes', tech: 'tech_aeroplanes',
      in: { steel: 25, rubber: 20, engines: 25, fabric: 15 }, out: { aeroplanes: 30 }
    }]
  ]);

  pm('pmg_electrics_base', [
    ['pm_telephones', 'Telephones', {
      icon: 'Method_factory_radios', tech: 'tech_telephone',
      in: { glass: 25, lead: 20, electricity: 15 }, out: { telephones: 40 },
      jobs: { laborers: 3500, machinists: 1500 }, pollution: 6
    }],
    ['pm_electric_telephones', 'Automatic Exchanges', {
      icon: 'Method_electric_engines', tech: 'tech_assembly_lines',
      in: { glass: 35, lead: 30, steel: 15, electricity: 25 }, out: { telephones: 70 },
      jobs: { laborers: 3000, machinists: 2000 }, pollution: 8
    }]
  ]);

  pm('pmg_electrics_radio', [
    ['pm_no_radios', 'No Radios', { icon: 'Method_no_radios' }],
    ['pm_radios', 'Radios', {
      icon: 'Method_radios', tech: 'tech_radio',
      in: { glass: 20, lead: 15, electricity: 15 }, out: { radios: 30 }
    }],
    ['pm_factory_radios', 'Factory Radios', {
      icon: 'Method_factory_radios', tech: 'tech_assembly_lines',
      in: { glass: 30, lead: 25, steel: 15, electricity: 25 }, out: { radios: 55 }
    }]
  ]);

  // ===========================================================================
  // SHIPYARDS
  // ===========================================================================
  pm('pmg_shipyard_base', [
    ['pm_basic_shipbuilding', 'Basic Shipbuilding', {
      icon: 'Method_reinforced_wooden_ships',
      in: { wood: 30, fabric: 15 }, out: { clippers: 25 },
      jobs: { laborers: 4500, machinists: 500 }
    }],
    ['pm_clipper_shipbuilding', 'Clipper Shipbuilding', {
      icon: 'Method_reinforced_wooden_ships', tech: 'tech_shipbuilding',
      in: { hardwood: 25, fabric: 25 }, out: { clippers: 45 },
      jobs: { laborers: 4500, machinists: 500 }
    }],
    ['pm_steamer_shipbuilding', 'Steamer Shipbuilding', {
      icon: 'Method_reinforced_steam_ships', tech: 'tech_steam_ships',
      in: { steel: 35, engines: 20, coal: 10 }, out: { steamers: 45 },
      jobs: { laborers: 4000, machinists: 1000 }, pollution: 8
    }],
    ['pm_arc_welded_steam_ships', 'Arc-Welded Steamers', {
      icon: 'Method_arc_welded_steam_ships', tech: 'tech_electricity',
      in: { steel: 50, engines: 30, electricity: 20 }, out: { steamers: 75 },
      jobs: { laborers: 3500, machinists: 1500 }, pollution: 8
    }]
  ]);

  pm('pmg_art_base', [
    ['pm_independent_artists', 'Independent Artists', {
      icon: 'Method_independent_artists', in: { paper: 10 }, out: { fine_art: 10 },
      jobs: { laborers: 2000, clerks: 1000, academics: 500 }
    }],
    ['pm_realist_art', 'Realist Art', {
      icon: 'Method_realist_art', tech: 'tech_realism',
      in: { paper: 15, dye: 10 }, out: { fine_art: 20 },
      jobs: { laborers: 2000, clerks: 1500, academics: 1000 }
    }],
    ['pm_photographic_art', 'Photographic Art', {
      icon: 'Method_photographic_art', tech: 'tech_photography',
      in: { paper: 20, glass: 15, dye: 10 }, out: { fine_art: 30 },
      jobs: { laborers: 2000, clerks: 2000, academics: 1000 }
    }]
  ]);

  // ===========================================================================
  // MILITARY INDUSTRY
  // ===========================================================================
  pm('pmg_arms_base', [
    ['pm_muskets', 'Muskets', {
      icon: 'Method_muskets', in: { iron: 25, wood: 15 }, out: { small_arms: 30 },
      jobs: { laborers: 4500, machinists: 500 }, pollution: 5
    }],
    ['pm_rifles', 'Rifles', {
      icon: 'Method_rifles', tech: 'tech_rifling',
      in: { iron: 35, wood: 20, tools: 10 }, out: { small_arms: 50 },
      jobs: { laborers: 4000, machinists: 1000 }, pollution: 8
    }],
    ['pm_repeaters', 'Repeaters', {
      icon: 'Method_repeaters', tech: 'tech_repeaters',
      in: { steel: 40, wood: 20, tools: 20 }, out: { small_arms: 75 },
      jobs: { laborers: 3500, machinists: 1500 }, pollution: 10
    }],
    ['pm_bolt_action_rifles', 'Bolt-Action Rifles', {
      icon: 'Method_bolt_action_rifles', tech: 'tech_bolt_action',
      in: { steel: 55, tools: 30, electricity: 15 }, out: { small_arms: 105 },
      jobs: { laborers: 3000, machinists: 2000 }, pollution: 10
    }]
  ]);

  pm('pmg_artillery_base', [
    ['pm_cannon_production', 'Cannon Production', {
      icon: 'Method_artillery_production', in: { iron: 30, wood: 15 }, out: { artillery: 25 },
      jobs: { laborers: 4500, machinists: 500 }, pollution: 6
    }],
    ['pm_breech_loading_artillery_production', 'Breech-Loading Artillery', {
      icon: 'Method_breech_loading_artillery_production', tech: 'tech_breech_loading',
      in: { steel: 40, tools: 15 }, out: { artillery: 45 },
      jobs: { laborers: 4000, machinists: 1000 }, pollution: 10
    }],
    ['pm_recoil_mechanism_artillery_production', 'Recoil Mechanisms', {
      icon: 'Method_recoil_mechanism_artillery_production', tech: 'tech_recoil_mechanism',
      in: { steel: 60, tools: 30, electricity: 15 }, out: { artillery: 75 },
      jobs: { laborers: 3500, machinists: 1500 }, pollution: 12
    }]
  ]);

  pm('pmg_munitions_base', [
    ['pm_percussion_caps', 'Percussion Caps', {
      icon: 'Method_percussion_caps', in: { lead: 25, sulfur: 15 }, out: { ammunition: 35 },
      jobs: { laborers: 4500, machinists: 500 }, pollution: 8
    }],
    ['pm_explosive_shells', 'Explosive Shells', {
      icon: 'Method_explosive_shells', tech: 'tech_nitroglycerin',
      in: { lead: 35, explosives: 20 }, out: { ammunition: 60 },
      jobs: { laborers: 4000, machinists: 1000 }, pollution: 12
    }],
    ['pm_machined_munitions', 'Machined Munitions', {
      icon: 'Method_electric_rollers', tech: 'tech_assembly_lines',
      in: { lead: 45, explosives: 30, electricity: 20 }, out: { ammunition: 95 },
      jobs: { laborers: 3500, machinists: 1500 }, pollution: 14
    }]
  ]);

  pm('pmg_milship_base', [
    ['pm_military_shipbuilding_wooden', 'Wooden Men-of-War', {
      icon: 'Method_military_shipbuilding_wooden',
      in: { wood: 30, fabric: 20, small_arms: 10 }, out: { manowars: 25 },
      jobs: { laborers: 4500, machinists: 500 }
    }],
    ['pm_military_shipbuilding_wooden_2', 'Reinforced Men-of-War', {
      icon: 'Method_military_shipbuilding_wooden_2', tech: 'tech_shipbuilding',
      in: { hardwood: 30, fabric: 25, artillery: 15 }, out: { manowars: 45 },
      jobs: { laborers: 4500, machinists: 500 }
    }],
    ['pm_military_shipbuilding_steam', 'Ironclad Shipbuilding', {
      icon: 'Method_military_shipbuilding_steam', tech: 'tech_ironclads',
      in: { steel: 40, engines: 25, artillery: 20, coal: 10 }, out: { ironclads: 40 },
      jobs: { laborers: 4000, machinists: 1000 }, pollution: 10
    }],
    ['pm_military_shipbuilding_steam_2', 'Dreadnought Shipbuilding', {
      icon: 'Method_military_shipbuilding_steam_2', tech: 'tech_dreadnoughts',
      in: { steel: 60, engines: 40, artillery: 30, oil: 20, electricity: 20 }, out: { ironclads: 70 },
      jobs: { laborers: 3500, machinists: 1500 }, pollution: 12
    }]
  ]);

})(window.V3);
