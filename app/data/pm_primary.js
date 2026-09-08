/* ============================================================================
 * app/data/pm_primary.js - Production methods: farms, plantations, mines.
 * ---------------------------------------------------------------------------
 * EN: Units are "per building level, per week", i.e. exactly the numbers the
 *     game shows you in the building panel. Employment is per level too.
 *
 *     Convention used throughout: a BASE method hires the whole 5 000 workers
 *     of a level; automation and ownership rows only add or subtract.
 *
 *     All numbers on this page are 'approx' - see app/data/_meta.js.
 *
 * RU: Единицы - "на уровень здания в неделю", то есть ровно те числа, которые
 *     игра показывает в панели здания. Занятость тоже на уровень.
 *
 *     Общее правило: БАЗОВЫЙ метод нанимает все 5 000 рабочих уровня, а строки
 *     автоматизации и владения только добавляют или вычитают.
 *
 *     Все числа на этой странице - оценка ('approx'), см. app/data/_meta.js.
 * ==========================================================================*/
(function (V3) {
  'use strict';

  var pm = V3.pmList;

  // ===========================================================================
  // GRAIN FARMS
  // ===========================================================================
  pm('pmg_farm_base', [
    ['pm_simple_farming', 'Simple Farming', {
      icon: 'Method_simple_farming',
      out: { grain: 30 },
      jobs: { laborers: 4000, farmers: 1000 }
    }],
    ['pm_harvesting_tools', 'Harvesting Tools', {
      icon: 'Method_harvesting_tools', tech: 'tech_tools',
      in: { tools: 10 }, out: { grain: 45 },
      jobs: { laborers: 4000, farmers: 1000 }
    }],
    ['pm_electric_rollers', 'Electric Threshers', {
      icon: 'Method_electric_rollers', tech: 'tech_electricity',
      in: { tools: 15, electricity: 10 }, out: { grain: 65 },
      jobs: { laborers: 3500, farmers: 1000, machinists: 500 }
    }],
    ['pm_compression_ignition_tractors', 'Tractors', {
      icon: 'Method_compression_ignition_tractors', tech: 'tech_combustion_engine',
      in: { tools: 20, engines: 10, oil: 10 }, out: { grain: 90 },
      jobs: { laborers: 3000, farmers: 1000, machinists: 1000 }, pollution: 4
    }]
  ]);

  pm('pmg_farm_secondary', [
    ['pm_no_secondary', 'No Secondary Production', { icon: 'Method_no_specialists' }],
    ['pm_rye_for_livestock', 'Livestock Feed', {
      icon: 'Method_open_air_stockyards', out: { meat: 10 }, in: { grain: 5 }
    }],
    ['pm_cotton_intercrop', 'Cotton Intercropping', {
      icon: 'Method_plantation_production', out: { fabric: 10 }
    }],
    ['pm_grain_distilling', 'Grain Distilling', {
      icon: 'Method_pot_stills', tech: 'tech_distillation', in: { grain: 10 }, out: { liquor: 10 }
    }]
  ]);

  // Fertilization is offered by farms AND plantations, so its output must be
  // `__primary` - the building's own first product - not `grain`. Getting this
  // wrong makes cotton plantations grow wheat, which is exactly the sort of
  // thing tools/selftest.js exists to catch.
  pm('pmg_farm_fert', [
    ['pm_no_fertilizer', 'No Fertilization', { icon: 'Method_no_automation' }],
    ['pm_fertilization', 'Manure Fertilization', {
      icon: 'Method_fertilization', out: { __primary: 10 }
    }],
    ['pm_chemical_fertilizers', 'Chemical Fertilizers', {
      icon: 'Method_chemical_fertilizers', tech: 'tech_fertilizer',
      in: { fertilizer: 15 }, out: { __primary: 30 }
    }],
    ['pm_automatic_irrigation', 'Automatic Irrigation', {
      icon: 'Method_automatic_irrigation', tech: 'tech_electricity',
      in: { fertilizer: 20, electricity: 10 }, out: { __primary: 45 }
    }]
  ]);

  // ===========================================================================
  // LIVESTOCK RANCHES
  // ===========================================================================
  pm('pmg_ranch_base', [
    ['pm_open_air_stockyards', 'Open-Air Stockyards', {
      icon: 'Method_open_air_stockyards',
      out: { meat: 30 }, jobs: { laborers: 4000, farmers: 1000 }
    }],
    ['pm_barbed_wire_fencing', 'Barbed Wire Fencing', {
      icon: 'Method_barbed_wire_fencing', tech: 'tech_steel',
      in: { steel: 10 }, out: { meat: 45 }, jobs: { laborers: 4000, farmers: 1000 }
    }],
    ['pm_electric_fencing', 'Electric Fencing', {
      icon: 'Method_electric_fencing', tech: 'tech_electricity',
      in: { steel: 15, electricity: 10 }, out: { meat: 65 },
      jobs: { laborers: 3500, farmers: 1000, machinists: 500 }
    }]
  ]);

  pm('pmg_ranch_secondary', [
    ['pm_no_ranch_secondary', 'No Secondary Production', { icon: 'Method_no_specialists' }],
    ['pm_sheep_farms', 'Sheep Farming', { icon: 'Method_sheep_farms', out: { fabric: 15 } }],
    ['pm_large_sheep_ranch', 'Large Sheep Ranch', {
      icon: 'Method_large_sheep_ranch', tech: 'tech_steel', out: { fabric: 25 }
    }],
    ['pm_manure_collection', 'Manure Collection', {
      icon: 'Method_fertilization', out: { fertilizer: 10 }
    }]
  ]);

  // ===========================================================================
  // PLANTATIONS - one shared row; the OUTPUT good is taken from the building's
  // `produces` list, so a Coffee Plantation makes coffee and a Tea Plantation
  // makes tea from the very same method rows. The `out` key `__primary` is a
  // placeholder the engine substitutes at run time.
  // ===========================================================================
  pm('pmg_plantation_base', [
    ['pm_plantation_simple', 'Unrefined Production', {
      icon: 'Method_plantation_production',
      out: { __primary: 30 }, jobs: { laborers: 4000, farmers: 1000 }
    }],
    ['pm_plantation_tools', 'Harvesting Tools', {
      icon: 'Method_harvesting_tools', tech: 'tech_tools',
      in: { tools: 10 }, out: { __primary: 45 }, jobs: { laborers: 4000, farmers: 1000 }
    }],
    ['pm_plantation_rollers', 'Electric Machinery', {
      icon: 'Method_electric_rollers', tech: 'tech_electricity',
      in: { tools: 15, electricity: 10 }, out: { __primary: 65 },
      jobs: { laborers: 3500, farmers: 1000, machinists: 500 }
    }]
  ]);

  // ===========================================================================
  // LOGGING
  // ===========================================================================
  pm('pmg_logging_base', [
    ['pm_simple_forestry', 'Simple Forestry', {
      icon: 'Method_simple_forestry',
      out: { wood: 30 }, jobs: { laborers: 4500, machinists: 500 }
    }],
    ['pm_saw_mills', 'Saw Mills', {
      icon: 'Method_saw_mills', tech: 'tech_tools',
      in: { tools: 10 }, out: { wood: 50 }, jobs: { laborers: 4500, machinists: 500 }
    }],
    ['pm_electric_saw_mills', 'Electric Saw Mills', {
      icon: 'Method_electric_saw_mills', tech: 'tech_electricity',
      in: { tools: 15, electricity: 10 }, out: { wood: 70 },
      jobs: { laborers: 4000, machinists: 1000 }
    }],
    ['pm_chainsaws', 'Chainsaws', {
      icon: 'Method_chainsaws', tech: 'tech_combustion_engine',
      in: { tools: 20, engines: 10 }, out: { wood: 95 },
      jobs: { laborers: 3500, machinists: 1500 }, pollution: 4
    }]
  ]);

  pm('pmg_logging_hardwood', [
    ['pm_no_hardwood_selection', 'No Hardwood Selection', { icon: 'Method_no_hardwood_selection' }],
    ['pm_hardwood_selection', 'Hardwood Selection', {
      icon: 'Method_hardwood_selection', out: { hardwood: 10 }, in: { wood: 10 }
    }],
    ['pm_increased_hardwood', 'Increased Hardwood Selection', {
      icon: 'Method_increased_hardwood', tech: 'tech_tools',
      out: { hardwood: 20 }, in: { wood: 20 }
    }]
  ]);

  pm('pmg_rubber_base', [
    ['pm_simple_rubber', 'Wild Rubber Tapping', {
      icon: 'Method_simple_forestry',
      out: { rubber: 25 }, jobs: { laborers: 4500, machinists: 500 }
    }],
    ['pm_rubber_tools', 'Tapping Tools', {
      icon: 'Method_harvesting_tools', tech: 'tech_tools',
      in: { tools: 10 }, out: { rubber: 40 }, jobs: { laborers: 4500, machinists: 500 }
    }]
  ]);

  // ===========================================================================
  // MINES - the base row differs only in which ore comes out, so each mine has
  // its own group but the shape is identical. Water pumps are shared.
  // ===========================================================================
  function mineRows(good, baseOut) {
    return [
      ['pm_picks_and_shovels_' + good, 'Picks and Shovels', {
        icon: 'Method_picks_and_shovels',
        out: mk(good, baseOut), jobs: { laborers: 4500, machinists: 500 }
      }],
      ['pm_condensing_engine_pump_' + good, 'Atmospheric Engine Pump', {
        icon: 'Method_condensing_engine_pump', tech: 'tech_atmospheric_engine',
        in: { tools: 10, coal: 10 }, out: mk(good, Math.round(baseOut * 1.6)),
        jobs: { laborers: 4000, machinists: 1000 }, pollution: 6
      }],
      ['pm_diesel_pump_' + good, 'Diesel Pumps', {
        icon: 'Method_diesel_pump', tech: 'tech_combustion_engine',
        in: { tools: 20, engines: 10, oil: 10 }, out: mk(good, Math.round(baseOut * 2.3)),
        jobs: { laborers: 3500, machinists: 1500 }, pollution: 10
      }]
    ];
  }
  function mk(k, v) { var o = {}; o[k] = v; return o; }

  pm('pmg_mine_base_coal',   mineRows('coal', 40));
  pm('pmg_mine_base_iron',   mineRows('iron', 35));
  pm('pmg_mine_base_lead',   mineRows('lead', 35));
  pm('pmg_mine_base_sulfur', mineRows('sulfur', 30));
  pm('pmg_mine_base_gold',   mineRows('gold', 15));

  pm('pmg_mine_pumps', [
    ['pm_no_mine_automation', 'Manual Haulage', { icon: 'Method_no_automation' }],
    ['pm_pumps', 'Steam Haulage', {
      icon: 'Method_pumps', tech: 'tech_atmospheric_engine',
      in: { coal: 10 }, jobs: { laborers: -500, machinists: 500 }, pollution: 4,
      note: 'Same output, fewer unskilled hands - useful when labour is short.'
    }],
    ['pm_electric_haulage', 'Electric Haulage', {
      icon: 'Method_electric_rollers', tech: 'tech_electricity',
      in: { electricity: 10 }, jobs: { laborers: -1000, machinists: 1000 }
    }]
  ]);

  // ===========================================================================
  // OIL / FISHING / WHALING
  // ===========================================================================
  pm('pmg_oil_base', [
    ['pm_simple_oil_extraction', 'Cable Tool Drilling', {
      icon: 'Method_simple_oil_extraction', tech: 'tech_oil_rig',
      in: { tools: 10 }, out: { oil: 40 }, jobs: { laborers: 4000, machinists: 1000 }, pollution: 8
    }],
    ['pm_combustion_derricks', 'Combustion Derricks', {
      icon: 'Method_combustion_derricks', tech: 'tech_combustion_engine',
      in: { tools: 20, engines: 10 }, out: { oil: 70 },
      jobs: { laborers: 3500, machinists: 1500 }, pollution: 14
    }],
    ['pm_rotary_valve_engine', 'Rotary Drilling', {
      icon: 'Method_rotary_valve_engine', tech: 'tech_oil_refining',
      in: { tools: 25, engines: 20, electricity: 10 }, out: { oil: 100 },
      jobs: { laborers: 3000, machinists: 2000 }, pollution: 18
    }]
  ]);

  pm('pmg_fishing_base', [
    ['pm_simple_fishing', 'Fishing Boats', {
      icon: 'Method_simple_fishing',
      out: { fish: 25 }, jobs: { laborers: 4500, machinists: 500 }
    }],
    ['pm_steam_trawlers', 'Steam Trawlers', {
      icon: 'Method_reinforced_steam_ships', tech: 'tech_steam_ships',
      in: { coal: 10, steamers: 5 }, out: { fish: 45 },
      jobs: { laborers: 4000, machinists: 1000 }, pollution: 4
    }]
  ]);

  pm('pmg_whaling_base', [
    ['pm_simple_whaling', 'Hand Harpoons', {
      icon: 'Method_simple_whaling', tech: 'tech_whaling',
      out: { oil: 20 }, jobs: { laborers: 4500, machinists: 500 }
    }],
    ['pm_steam_whaling', 'Steam Whalers', {
      icon: 'Method_reinforced_steam_ships', tech: 'tech_steam_ships',
      in: { coal: 10, steamers: 5 }, out: { oil: 35 },
      jobs: { laborers: 4000, machinists: 1000 }, pollution: 5
    }]
  ]);

  // ===========================================================================
  // SUBSISTENCE - not built by you, but it is where unemployed peasants sit,
  // so the population maths needs it.
  // ===========================================================================
  pm('pmg_subsistence_base', [
    ['pm_subsistence_farming', 'Subsistence Farming', {
      icon: 'Building_subsistence_farm', out: { grain: 10 }, jobs: { peasants: 5000 }
    }]
  ]);

})(window.V3);
