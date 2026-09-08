/* ============================================================================
 * app/data/buildings.js - The buildings table.
 * ---------------------------------------------------------------------------
 * EN: A building on its own produces nothing. What it produces is decided by
 *     the PRODUCTION METHODS you switch on (app/data/production_methods.js).
 *     This file only says which building exists, what it costs to build, which
 *     PM groups it offers, and what it can end up producing.
 *
 *       id               internal key + translation key (`building.steel_mills`)
 *       group            see building_groups.js; supplies defaults
 *       constructionCost total construction points for ONE level
 *       produces         every good it CAN make, across all its PMs. Used to
 *                        answer "who can make steel?" when expanding a chain.
 *       pmGroups         the switch-groups shown in the game's building panel,
 *                        in the same order the game shows them
 *       infraUsage       infrastructure per level; omit to inherit the group
 *       providesInfra    infrastructure ADDED per level (ports, railways)
 *       unlockTech       tech id required before it can be built at all
 *       maxPerState      1 for one-per-state buildings (govt admin, urban ctr)
 *       autoBuilt        true when the game builds it for you (subsistence)
 *
 *     CONSTRUCTION COSTS ARE 'approx'. The wiki states the overall range is
 *     100-800 for regular buildings, 2500 for monuments and 5000 for canals;
 *     the per-building split below is a best-effort fit inside that range.
 *     Correct any of them in the Data tab and your value wins forever.
 *
 * RU: Само по себе здание не производит ничего. Что оно производит, решают
 *     МЕТОДЫ ПРОИЗВОДСТВА (app/data/production_methods.js). Этот файл говорит
 *     только: какое здание существует, сколько стоит постройка, какие группы
 *     методов оно предлагает и что в принципе может выпускать.
 *
 *     СТОИМОСТЬ СТРОИТЕЛЬСТВА - оценка ('approx'). Вики говорит, что общий
 *     диапазон 100-800 для обычных зданий, 2500 для памятников и 5000 для
 *     каналов; разбивка ниже - подгонка внутри этого диапазона. Исправьте
 *     любое значение во вкладке "Данные" - ваша правка победит навсегда.
 * ==========================================================================*/
(function (V3) {
  'use strict';

  var APPROX = V3.APPROX;
  var OWN_IND = 'pmg_ownership_industry';
  var OWN_RUR = 'pmg_ownership_rural';

  V3.define.building([

    // =========================================================================
    // AGRICULTURE - grain farms. Which farm you get depends on the terrain,
    // but mechanically they are the same building with a different look.
    // =========================================================================
    { id: 'wheat_farm',   name: 'Wheat Farm',   group: 'agriculture', icon: 'Building_wheat_farm',
      constructionCost: 150, produces: ['grain', 'fabric', 'meat', 'liquor'],
      pmGroups: ['pmg_farm_base', 'pmg_farm_secondary', 'pmg_farm_fert', OWN_RUR], confidence: APPROX, order: 1 },
    { id: 'rye_farm',     name: 'Rye Farm',     group: 'agriculture', icon: 'Building_rye_farm',
      constructionCost: 150, produces: ['grain', 'fabric', 'meat', 'liquor'],
      pmGroups: ['pmg_farm_base', 'pmg_farm_secondary', 'pmg_farm_fert', OWN_RUR], confidence: APPROX, order: 2 },
    { id: 'rice_farm',    name: 'Rice Farm',    group: 'agriculture', icon: 'Building_rice_farm',
      constructionCost: 150, produces: ['grain', 'fabric', 'meat', 'liquor'],
      pmGroups: ['pmg_farm_base', 'pmg_farm_secondary', 'pmg_farm_fert', OWN_RUR], confidence: APPROX, order: 3 },
    { id: 'maize_farm',   name: 'Maize Farm',   group: 'agriculture', icon: 'Building_maize_farm',
      constructionCost: 150, produces: ['grain', 'fabric', 'meat', 'liquor'],
      pmGroups: ['pmg_farm_base', 'pmg_farm_secondary', 'pmg_farm_fert', OWN_RUR], confidence: APPROX, order: 4 },
    { id: 'millet_farm',  name: 'Millet Farm',  group: 'agriculture', icon: 'Building_millet_farm',
      constructionCost: 150, produces: ['grain', 'fabric', 'meat', 'liquor'],
      pmGroups: ['pmg_farm_base', 'pmg_farm_secondary', 'pmg_farm_fert', OWN_RUR], confidence: APPROX, order: 5 },

    // ---- Ranching & plantations --------------------------------------------
    { id: 'livestock_ranch', name: 'Livestock Ranch', group: 'ranching', icon: 'Building_cattle_ranch',
      constructionCost: 150, produces: ['meat', 'fabric', 'fertilizer'],
      pmGroups: ['pmg_ranch_base', 'pmg_ranch_secondary', OWN_RUR], confidence: APPROX, order: 10 },
    { id: 'cotton_plantation', name: 'Cotton Plantation', group: 'ranching', icon: 'Building_cotton_plantation',
      constructionCost: 150, produces: ['fabric'],
      pmGroups: ['pmg_plantation_base', 'pmg_farm_fert', OWN_RUR], confidence: APPROX, order: 11 },
    { id: 'silk_plantation', name: 'Silk Plantation', group: 'ranching', icon: 'Building_silk_plantation',
      constructionCost: 150, produces: ['silk'],
      pmGroups: ['pmg_plantation_base', 'pmg_farm_fert', OWN_RUR], confidence: APPROX, order: 12 },
    { id: 'dye_plantation', name: 'Dye Plantation', group: 'ranching', icon: 'Building_dye_plantation',
      constructionCost: 150, produces: ['dye'],
      pmGroups: ['pmg_plantation_base', 'pmg_farm_fert', OWN_RUR], confidence: APPROX, order: 13 },
    { id: 'sugar_plantation', name: 'Sugar Plantation', group: 'ranching', icon: 'Building_sugar_plantation',
      constructionCost: 150, produces: ['sugar'],
      pmGroups: ['pmg_plantation_base', 'pmg_farm_fert', OWN_RUR], confidence: APPROX, order: 14 },
    { id: 'coffee_plantation', name: 'Coffee Plantation', group: 'ranching', icon: 'Building_coffee_plantation',
      constructionCost: 150, produces: ['coffee'],
      pmGroups: ['pmg_plantation_base', 'pmg_farm_fert', OWN_RUR], confidence: APPROX, order: 15 },
    { id: 'tea_plantation', name: 'Tea Plantation', group: 'ranching', icon: 'Building_tea_plantation',
      constructionCost: 150, produces: ['tea'],
      pmGroups: ['pmg_plantation_base', 'pmg_farm_fert', OWN_RUR], confidence: APPROX, order: 16 },
    { id: 'tobacco_plantation', name: 'Tobacco Plantation', group: 'ranching', icon: 'Building_tobacco_plantation',
      constructionCost: 150, produces: ['tobacco'],
      pmGroups: ['pmg_plantation_base', 'pmg_farm_fert', OWN_RUR], confidence: APPROX, order: 17 },
    { id: 'opium_plantation', name: 'Opium Plantation', group: 'ranching', icon: 'Building_opium_plantation',
      constructionCost: 150, produces: ['opium'],
      pmGroups: ['pmg_plantation_base', 'pmg_farm_fert', OWN_RUR], confidence: APPROX, order: 18 },
    { id: 'banana_plantation', name: 'Banana Plantation', group: 'ranching', icon: 'Building_banana_plantation',
      constructionCost: 150, produces: ['fruit'],
      pmGroups: ['pmg_plantation_base', 'pmg_farm_fert', OWN_RUR], confidence: APPROX, order: 19 },
    { id: 'vineyards', name: 'Vineyards', group: 'ranching', icon: 'Building_vineyards',
      constructionCost: 150, produces: ['wine', 'fruit'],
      pmGroups: ['pmg_plantation_base', 'pmg_farm_fert', OWN_RUR], confidence: APPROX, order: 20 },

    // =========================================================================
    // EXTRACTION - capped by the state's deposits, not by arable land.
    // =========================================================================
    { id: 'logging_camp', name: 'Logging Camp', group: 'extraction', icon: 'Building_logging_camp',
      constructionCost: 200, produces: ['wood', 'hardwood'],
      pmGroups: ['pmg_logging_base', 'pmg_logging_hardwood', OWN_RUR], confidence: APPROX, order: 30 },
    { id: 'rubber_lodge', name: 'Rubber Lodge', group: 'extraction', icon: 'Building_rubber_lodge',
      constructionCost: 200, produces: ['rubber'],
      pmGroups: ['pmg_rubber_base', OWN_RUR], confidence: APPROX, order: 31 },
    { id: 'coal_mine', name: 'Coal Mine', group: 'extraction', icon: 'Building_coal_mine',
      constructionCost: 250, produces: ['coal'],
      pmGroups: ['pmg_mine_base_coal', 'pmg_mine_pumps', OWN_RUR], confidence: APPROX, order: 32 },
    { id: 'iron_mine', name: 'Iron Mine', group: 'extraction', icon: 'Building_iron_mine',
      constructionCost: 250, produces: ['iron'],
      pmGroups: ['pmg_mine_base_iron', 'pmg_mine_pumps', OWN_RUR], confidence: APPROX, order: 33 },
    { id: 'lead_mine', name: 'Lead Mine', group: 'extraction', icon: 'Building_lead_mine',
      constructionCost: 250, produces: ['lead'],
      pmGroups: ['pmg_mine_base_lead', 'pmg_mine_pumps', OWN_RUR], confidence: APPROX, order: 34 },
    { id: 'sulfur_mine', name: 'Sulfur Mine', group: 'extraction', icon: 'Building_sulfur_mine',
      constructionCost: 250, produces: ['sulfur'],
      pmGroups: ['pmg_mine_base_sulfur', 'pmg_mine_pumps', OWN_RUR], confidence: APPROX, order: 35 },
    { id: 'gold_mine', name: 'Gold Mine', group: 'extraction', icon: 'Building_gold_mine',
      constructionCost: 300, produces: ['gold'],
      pmGroups: ['pmg_mine_base_gold', 'pmg_mine_pumps', OWN_RUR], confidence: APPROX, order: 36 },
    { id: 'oil_rig', name: 'Oil Rig', group: 'extraction', icon: 'Building_oil_rig',
      constructionCost: 300, produces: ['oil'], unlockTech: 'tech_oil_rig',
      pmGroups: ['pmg_oil_base', OWN_RUR], confidence: APPROX, order: 37 },
    { id: 'fishing_wharf', name: 'Fishing Wharf', group: 'extraction', icon: 'Building_fishing_wharf',
      constructionCost: 150, produces: ['fish'],
      pmGroups: ['pmg_fishing_base', OWN_RUR], confidence: APPROX, order: 38 },
    { id: 'whaling_station', name: 'Whaling Station', group: 'extraction', icon: 'Building_whaling_station',
      constructionCost: 200, produces: ['oil'], unlockTech: 'tech_whaling',
      pmGroups: ['pmg_whaling_base', OWN_RUR], confidence: APPROX, order: 39 },

    // =========================================================================
    // MANUFACTURING
    // =========================================================================
    { id: 'food_industry', name: 'Food Industry', group: 'manufacturing', icon: 'Building_food_industry',
      constructionCost: 300, produces: ['groceries', 'liquor'],
      pmGroups: ['pmg_food_base', 'pmg_food_distillery', 'pmg_automation_light', OWN_IND], confidence: APPROX, order: 50 },
    { id: 'textile_industry', name: 'Textile Mills', group: 'manufacturing', icon: 'Building_textile_industry',
      constructionCost: 300, produces: ['clothes', 'luxury_clothes', 'fabric'],
      pmGroups: ['pmg_textile_base', 'pmg_textile_luxury', 'pmg_textile_silk', 'pmg_automation_light', OWN_IND], confidence: APPROX, order: 51 },
    { id: 'furniture_manufacturies', name: 'Furniture Manufacturies', group: 'manufacturing', icon: 'Building_furniture_manufacturies',
      constructionCost: 300, produces: ['furniture', 'luxury_furniture'],
      pmGroups: ['pmg_furniture_base', 'pmg_furniture_luxury', 'pmg_automation_light', OWN_IND], confidence: APPROX, order: 52 },
    { id: 'glassworks', name: 'Glassworks', group: 'manufacturing', icon: 'Building_glassworks',
      constructionCost: 300, produces: ['glass', 'porcelain'],
      pmGroups: ['pmg_glass_base', 'pmg_glass_ceramics', 'pmg_automation_light', OWN_IND], confidence: APPROX, order: 53 },
    { id: 'paper_mills', name: 'Paper Mills', group: 'manufacturing', icon: 'Building_paper_mill',
      constructionCost: 300, produces: ['paper'],
      pmGroups: ['pmg_paper_base', 'pmg_automation_light', OWN_IND], confidence: APPROX, order: 54 },
    { id: 'tooling_workshops', name: 'Tooling Workshops', group: 'manufacturing', icon: 'Building_tooling_workshops',
      constructionCost: 350, produces: ['tools'],
      pmGroups: ['pmg_tools_base', 'pmg_automation_heavy', OWN_IND], confidence: APPROX, order: 55 },
    { id: 'steel_mills', name: 'Steel Mills', group: 'manufacturing', icon: 'Building_steel_mills',
      constructionCost: 400, produces: ['steel'], unlockTech: 'tech_pig_iron',
      pmGroups: ['pmg_steel_base', 'pmg_automation_heavy', OWN_IND], confidence: APPROX, order: 56 },
    { id: 'chemical_plants', name: 'Chemical Plants', group: 'manufacturing', icon: 'Building_chemicals_industry',
      constructionCost: 400, produces: ['fertilizer'], unlockTech: 'tech_fertilizer',
      pmGroups: ['pmg_fertilizer_base', 'pmg_automation_heavy', OWN_IND], confidence: APPROX, order: 57 },
    { id: 'explosives_factory', name: 'Explosives Factory', group: 'manufacturing', icon: 'Building_explosives_factory',
      constructionCost: 400, produces: ['explosives'], unlockTech: 'tech_nitroglycerin',
      pmGroups: ['pmg_explosives_base', 'pmg_automation_heavy', OWN_IND], confidence: APPROX, order: 58 },
    { id: 'synthetics_plants', name: 'Synthetics Plants', group: 'manufacturing', icon: 'Building_synthetics_plants',
      constructionCost: 600, produces: ['rubber', 'dye', 'oil'], unlockTech: 'tech_synthetics',
      pmGroups: ['pmg_synthetics_base', 'pmg_automation_heavy', OWN_IND], confidence: APPROX, order: 59 },
    { id: 'motor_industry', name: 'Motor Industry', group: 'manufacturing', icon: 'Building_motor_industry',
      constructionCost: 600, produces: ['engines', 'automobiles', 'tanks', 'aeroplanes'], unlockTech: 'tech_engines',
      pmGroups: ['pmg_motor_base', 'pmg_motor_auto', 'pmg_motor_tanks', 'pmg_motor_aero',
                 'pmg_automation_heavy', OWN_IND], confidence: APPROX, order: 60 },
    { id: 'electrics_industry', name: 'Electrics Industry', group: 'manufacturing', icon: 'Building_electrics_industry',
      constructionCost: 600, produces: ['telephones', 'radios'], unlockTech: 'tech_telephone',
      pmGroups: ['pmg_electrics_base', 'pmg_electrics_radio', 'pmg_automation_heavy', OWN_IND], confidence: APPROX, order: 61 },
    { id: 'shipyards', name: 'Shipyards', group: 'manufacturing', icon: 'Building_shipyards',
      constructionCost: 400, produces: ['clippers', 'steamers'],
      pmGroups: ['pmg_shipyard_base', OWN_IND], confidence: APPROX, order: 62 },
    { id: 'arts_academy', name: 'Arts Academy', group: 'manufacturing', icon: 'Building_art_academy',
      constructionCost: 300, produces: ['fine_art'],
      pmGroups: ['pmg_art_base', OWN_IND], confidence: APPROX, order: 63 },

    // =========================================================================
    // MILITARY INDUSTRY
    // =========================================================================
    { id: 'arms_industry', name: 'Arms Industry', group: 'military_industry', icon: 'Building_arms_industry',
      constructionCost: 400, produces: ['small_arms'],
      pmGroups: ['pmg_arms_base', 'pmg_automation_heavy', OWN_IND], confidence: APPROX, order: 70 },
    { id: 'artillery_foundries', name: 'Artillery Foundries', group: 'military_industry', icon: 'Building_artillery_foundry',
      constructionCost: 400, produces: ['artillery'],
      pmGroups: ['pmg_artillery_base', 'pmg_automation_heavy', OWN_IND], confidence: APPROX, order: 71 },
    { id: 'munition_plants', name: 'Munition Plants', group: 'military_industry', icon: 'Building_munition_plants',
      constructionCost: 400, produces: ['ammunition'],
      pmGroups: ['pmg_munitions_base', 'pmg_automation_heavy', OWN_IND], confidence: APPROX, order: 72 },
    { id: 'military_shipyards', name: 'Military Shipyards', group: 'military_industry', icon: 'Building_military_shipyards',
      constructionCost: 500, produces: ['manowars', 'ironclads'],
      pmGroups: ['pmg_milship_base', OWN_IND], confidence: APPROX, order: 73 },

    // =========================================================================
    // URBAN & INFRASTRUCTURE
    // =========================================================================
    { id: 'urban_center', name: 'Urban Center', group: 'urban', icon: 'Building_urban_center',
      constructionCost: 100, produces: ['services'], maxPerState: 1, autoBuilt: true,
      pmGroups: ['pmg_urban_base', 'pmg_urban_street', 'pmg_urban_transit'], confidence: APPROX, order: 80 },
    { id: 'port', name: 'Port', group: 'urban', icon: 'Building_port',
      constructionCost: 250, produces: ['merchant_marine'], providesInfra: 10,
      pmGroups: ['pmg_port_base', OWN_IND], confidence: APPROX, order: 81 },
    { id: 'railway', name: 'Railway', group: 'urban', icon: 'Building_railway',
      constructionCost: 300, produces: ['transportation'], providesInfra: 20, unlockTech: 'tech_railways',
      pmGroups: ['pmg_rail_base', 'pmg_rail_passenger', OWN_IND], confidence: APPROX, order: 82 },
    { id: 'power_plant', name: 'Power Plant', group: 'urban', icon: 'Building_power_plant',
      constructionCost: 300, produces: ['electricity'], unlockTech: 'tech_electricity',
      pmGroups: ['pmg_power_base', OWN_IND], confidence: APPROX, order: 83 },
    { id: 'trade_center', name: 'Trade Center', group: 'urban', icon: 'Building_trade_center',
      constructionCost: 150, produces: [], autoBuilt: true,
      pmGroups: ['pmg_trade_base'], confidence: APPROX, order: 84 },

    // =========================================================================
    // GOVERNMENT - these produce abstract "goods" the game tracks separately
    // (bureaucracy, innovation). We model them as goods so the same solver and
    // the same workforce maths apply, and flag them `abstract` so they never
    // show up in the market/trade views.
    // =========================================================================
    { id: 'government_administration', name: 'Government Administration', group: 'government', icon: 'Building_government_administration',
      constructionCost: 200, produces: [], abstractOutput: 'bureaucracy',
      pmGroups: ['pmg_gov_base'], confidence: APPROX, order: 90 },
    { id: 'university', name: 'University', group: 'government', icon: 'Building_university',
      constructionCost: 300, produces: [], abstractOutput: 'innovation',
      pmGroups: ['pmg_uni_base'], confidence: APPROX, order: 91 },

    // =========================================================================
    // CONSTRUCTION - the engine of everything. Its output IS construction
    // points, which is why the chain solver treats it specially: build these
    // first and every later building in the queue finishes sooner.
    // =========================================================================
    { id: 'construction_sector', name: 'Construction Sector', group: 'development', icon: 'Building_construction_camp',
      constructionCost: 300, produces: [], abstractOutput: 'construction',
      pmGroups: ['pmg_construction_base', OWN_IND], confidence: APPROX, order: 100 },

    // =========================================================================
    // MILITARY
    // =========================================================================
    { id: 'barracks', name: 'Barracks', group: 'military', icon: 'Building_barrack',
      constructionCost: 200, produces: [], militaryKind: 'army', battalionsPerLevel: 1,
      pmGroups: ['pmg_army_infantry', 'pmg_army_artillery', 'pmg_army_support'], confidence: APPROX, order: 110 },
    { id: 'conscription_center', name: 'Conscription Center', group: 'military', icon: 'Building_conscription_center',
      constructionCost: 100, produces: [], militaryKind: 'army', battalionsPerLevel: 1, conscript: true,
      pmGroups: ['pmg_army_infantry', 'pmg_army_artillery', 'pmg_army_support'], confidence: APPROX, order: 111 },
    { id: 'naval_base', name: 'Naval Base', group: 'military', icon: 'Building_naval_base',
      constructionCost: 200, produces: [], militaryKind: 'navy', battalionsPerLevel: 1,
      pmGroups: ['pmg_navy_capital', 'pmg_navy_light', 'pmg_navy_doctrine'], confidence: APPROX, order: 112 },

    // =========================================================================
    // PRIVATE - not built by the state, but they employ pops and eat goods, so
    // the calculator still needs to know about them.
    // =========================================================================
    { id: 'financial_district', name: 'Financial District', group: 'private', icon: 'Building_financial_district',
      constructionCost: 400, produces: [], unlockTech: 'tech_central_banking',
      pmGroups: ['pmg_finance_base'], confidence: APPROX, order: 120 },
    { id: 'manor_houses', name: 'Manor Houses', group: 'private', icon: 'Building_manor_houses',
      constructionCost: 150, produces: [], autoBuilt: true,
      pmGroups: ['pmg_manor_base'], confidence: APPROX, order: 121 },
    { id: 'subsistence_farms', name: 'Subsistence Farms', group: 'private', icon: 'Building_subsistence_farm',
      constructionCost: 0, produces: ['grain'], autoBuilt: true,
      pmGroups: ['pmg_subsistence_base'], confidence: APPROX, order: 122 }
  ]);

})(window.V3);
