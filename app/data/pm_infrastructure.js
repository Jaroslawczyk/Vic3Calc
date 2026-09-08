/* ============================================================================
 * app/data/pm_infrastructure.js - Urban, government, construction, and the two
 * shared rows (automation, ownership) that most buildings offer.
 * ---------------------------------------------------------------------------
 * EN: Three abstract "goods" live here and are not tradeable on the market:
 *
 *       construction   what a Construction Sector makes. Spending it is how
 *                      anything gets built, which is why the chain solver
 *                      treats it as a special case (see engine/construction.js).
 *       bureaucracy    Government Administration output.
 *       innovation     University output, i.e. research speed.
 *
 *     Modelling them as goods means the same solver, the same workforce maths
 *     and the same UI work for them for free.
 *
 * RU: Здесь живут три абстрактных "товара", которых нет на рынке:
 *
 *       construction   то, что производит строительный сектор. Именно за счёт
 *                      него строится всё остальное, поэтому решатель цепочки
 *                      обрабатывает его особо (см. engine/construction.js).
 *       bureaucracy    выпуск государственной администрации.
 *       innovation     выпуск университетов, то есть скорость исследований.
 *
 *     Раз это "товары" - для них бесплатно работают тот же решатель, та же
 *     математика рабочих мест и тот же интерфейс.
 * ==========================================================================*/
(function (V3) {
  'use strict';

  var pm = V3.pmList;

  // Register the three abstract goods so the UI can name and draw them.
  V3.define.good([
    { id: 'construction', name: 'Construction', category: 'abstract', basePrice: 0,
      icon: 'State_status_construction', abstract: true, confidence: V3.OK, order: 200 },
    { id: 'bureaucracy',  name: 'Bureaucracy',  category: 'abstract', basePrice: 0,
      icon: 'Building_government_administration', abstract: true, confidence: V3.OK, order: 201 },
    { id: 'innovation',   name: 'Innovation',   category: 'abstract', basePrice: 0,
      icon: 'Panel_technology', abstract: true, confidence: V3.OK, order: 202 }
  ]);

  // ===========================================================================
  // CONSTRUCTION SECTOR
  // Output is construction points per week per level. Everything about build
  // times in this app traces back to these four numbers, so if you verify one
  // thing against your game, make it this group.
  // ===========================================================================
  pm('pmg_construction_base', [
    ['pm_wooden_buildings', 'Wooden Buildings', {
      icon: 'Method_simple_organization',
      in: { wood: 30 }, out: { construction: 20 },
      jobs: { laborers: 4500, machinists: 500 }
    }],
    ['pm_iron_frame_buildings', 'Iron Frame Buildings', {
      icon: 'Method_iron_frame_buildings', tech: 'tech_pig_iron',
      in: { wood: 30, iron: 20, tools: 10 }, out: { construction: 35 },
      jobs: { laborers: 4000, machinists: 1000 }, pollution: 4
    }],
    ['pm_steel_frame_buildings', 'Steel Frame Buildings', {
      icon: 'Method_iron_frame_buildings', tech: 'tech_steel',
      in: { wood: 20, steel: 30, tools: 20 }, out: { construction: 55 },
      jobs: { laborers: 3500, machinists: 1500 }, pollution: 6
    }],
    ['pm_arc_welded_buildings', 'Arc-Welded Buildings', {
      icon: 'Method_arc_welded_buildings', tech: 'tech_electricity',
      in: { steel: 45, tools: 30, electricity: 20 }, out: { construction: 80 },
      jobs: { laborers: 3000, machinists: 2000 }, pollution: 6
    }]
  ]);

  // ===========================================================================
  // URBAN CENTER
  // The wiki-confirmed split "Shopkeepers +500, Laborers +4500" is the one
  // employment number on this page that is not a guess.
  // ===========================================================================
  pm('pmg_urban_base', [
    ['pm_market_stalls', 'Market Stalls', {
      icon: 'Method_market_stalls', out: { services: 30 },
      jobs: { laborers: 4500, shopkeepers: 500 }, confidence: V3.OK
    }],
    ['pm_market_squares', 'Market Squares', {
      icon: 'Method_market_squares', tech: 'tech_urbanization',
      in: { paper: 10 }, out: { services: 50 }, jobs: { laborers: 4000, shopkeepers: 1000 }
    }],
    ['pm_covered_markets', 'Covered Markets', {
      icon: 'Method_covered_markets', tech: 'tech_arts_and_crafts',
      in: { paper: 15, glass: 10 }, out: { services: 75 },
      jobs: { laborers: 3500, shopkeepers: 1500 }
    }],
    ['pm_arcades', 'Arcades', {
      icon: 'Method_arcades', tech: 'tech_electricity',
      in: { paper: 20, glass: 20, electricity: 15 }, out: { services: 105 },
      jobs: { laborers: 3000, shopkeepers: 2000 }
    }]
  ]);

  pm('pmg_urban_street', [
    ['pm_no_streetlights', 'No Street Lighting', { icon: 'Method_no_automation' }],
    ['pm_gas_streetlights', 'Gas Streetlights', {
      icon: 'Method_gas_streetlights', tech: 'tech_gas_lighting',
      in: { coal: 15 }, out: { services: 15 }, pollution: 4
    }],
    ['pm_electric_streetlights', 'Electric Streetlights', {
      icon: 'Method_electric_streetlights', tech: 'tech_electricity',
      in: { electricity: 15 }, out: { services: 30 }
    }]
  ]);

  pm('pmg_urban_transit', [
    ['pm_no_public_transport', 'No Public Transport', { icon: 'Method_no_public_transport' }],
    ['pm_public_motor_carriages', 'Horse-Drawn Omnibuses', {
      icon: 'Method_passenger_carriages', in: { transportation: 15 }, out: { services: 20 }
    }],
    ['pm_public_trams', 'Electric Trams', {
      icon: 'Method_public_trams', tech: 'tech_electricity',
      in: { transportation: 20, electricity: 15 }, out: { services: 40 }
    }]
  ]);

  // ===========================================================================
  // PORT / RAILWAY / POWER
  // ===========================================================================
  pm('pmg_port_base', [
    ['pm_basic_port', 'Basic Port', {
      icon: 'Method_basic_port', in: { clippers: 15 }, out: { merchant_marine: 30 },
      jobs: { laborers: 4500, machinists: 500 }
    }],
    ['pm_industrial_port', 'Industrial Port', {
      icon: 'Method_industrial_port', tech: 'tech_steam_ships',
      in: { steamers: 20, coal: 10 }, out: { merchant_marine: 60 },
      jobs: { laborers: 4000, machinists: 1000 }, pollution: 5
    }],
    ['pm_modern_port', 'Modern Port', {
      icon: 'Method_modern_port', tech: 'tech_electricity',
      in: { steamers: 30, electricity: 15 }, out: { merchant_marine: 100 },
      jobs: { laborers: 3500, machinists: 1500 }, pollution: 5
    }]
  ]);

  pm('pmg_rail_base', [
    ['pm_rail_transport', 'Steam Locomotives', {
      icon: 'Method_rail_transport', tech: 'tech_railways',
      in: { engines: 20, coal: 25 }, out: { transportation: 60 },
      jobs: { laborers: 4000, machinists: 1000 }, pollution: 12
    }],
    ['pm_electric_rail', 'Electric Railways', {
      icon: 'Method_electric_engines', tech: 'tech_electricity',
      in: { engines: 25, electricity: 30 }, out: { transportation: 95 },
      jobs: { laborers: 3500, machinists: 1500 }, pollution: 4
    }],
    ['pm_motorised_logistics', 'Motorised Logistics', {
      icon: 'Method_motorised_logistics', tech: 'tech_combustion_engine',
      in: { engines: 30, oil: 25, electricity: 20 }, out: { transportation: 130 },
      jobs: { laborers: 3000, machinists: 2000 }, pollution: 14
    }]
  ]);

  pm('pmg_rail_passenger', [
    ['pm_no_passenger_trains', 'No Passenger Service', { icon: 'Method_no_passenger_trains' }],
    ['pm_passenger_trains', 'Passenger Trains', {
      icon: 'Method_passenger_trains', tech: 'tech_railways',
      in: { coal: 10 }, out: { services: 25 }
    }]
  ]);

  pm('pmg_power_base', [
    ['pm_coal_fired_plant', 'Coal-Fired Power Plant', {
      icon: 'Method_coal_fired_plant', tech: 'tech_electricity',
      in: { coal: 40 }, out: { electricity: 80 },
      jobs: { laborers: 4000, machinists: 1000 }, pollution: 30
    }],
    ['pm_oil_fired_plant', 'Oil-Fired Power Plant', {
      icon: 'Method_oil_fired_plant', tech: 'tech_oil_refining',
      in: { oil: 35 }, out: { electricity: 110 },
      jobs: { laborers: 3500, machinists: 1500 }, pollution: 24
    }],
    ['pm_hydroelectric_plant', 'Hydroelectric Plant', {
      icon: 'Method_hydroelectric_plant', tech: 'tech_hydroelectric',
      in: { steel: 15 }, out: { electricity: 130 },
      jobs: { laborers: 3000, machinists: 2000 }, pollution: 0,
      note: 'Needs a suitable state. No pollution - the reason to grab mountains.'
    }]
  ]);

  pm('pmg_trade_base', [
    ['pm_merchant_guilds', 'Merchant Guilds', {
      icon: 'Method_merchant_guilds', jobs: { clerks: 1000, shopkeepers: 500 }
    }]
  ]);

  // ===========================================================================
  // GOVERNMENT
  // ===========================================================================
  pm('pmg_gov_base', [
    ['pm_corvee_labor', 'Corvée Administration', {
      icon: 'Method_corvee_labor', out: { bureaucracy: 50 },
      jobs: { bureaucrats: 1000, clerks: 500 }
    }],
    ['pm_professional_bureaucrats', 'Appointed Bureaucrats', {
      icon: 'Method_professional_bureaucrats', tech: 'tech_bureaucracy',
      in: { paper: 15 }, out: { bureaucracy: 100 },
      jobs: { bureaucrats: 1500, clerks: 1000 }
    }],
    ['pm_horizontal_drawer_cabinets_gov', 'Filing Cabinets', {
      icon: 'Method_horizontal_drawer_cabinets', tech: 'tech_mass_communication',
      in: { paper: 30, furniture: 10 }, out: { bureaucracy: 175 },
      jobs: { bureaucrats: 2000, clerks: 1500 }
    }]
  ]);

  pm('pmg_uni_base', [
    ['pm_scholastic_education', 'Scholastic Education', {
      icon: 'Method_scholastic_education', in: { paper: 10 }, out: { innovation: 10 },
      jobs: { clergymen: 1000, academics: 500, clerks: 500 }
    }],
    ['pm_philosophy_dept', 'Philosophy Department', {
      icon: 'Method_philosophy_dept', tech: 'tech_academia',
      in: { paper: 20 }, out: { innovation: 20 },
      jobs: { clergymen: 500, academics: 1500, clerks: 1000 }
    }],
    ['pm_analytical_philosophy_department', 'Analytical Philosophy', {
      icon: 'Method_analytical_philosophy_department', tech: 'tech_empiricism',
      in: { paper: 35, glass: 10 }, out: { innovation: 35 },
      jobs: { academics: 2500, clerks: 1500 }
    }]
  ]);

  // ===========================================================================
  // PRIVATE
  // ===========================================================================
  pm('pmg_finance_base', [
    ['pm_power_of_the_purse', 'Private Banking', {
      icon: 'Method_power_of_the_purse', tech: 'tech_central_banking',
      in: { paper: 20 }, out: { services: 40 },
      jobs: { clerks: 2000, shopkeepers: 500, capitalists: 500 }
    }]
  ]);

  pm('pmg_manor_base', [
    ['pm_manor_estates', 'Landed Estates', {
      icon: 'Method_privately_owned', in: { services: 10 },
      jobs: { laborers: 2000, aristocrats: 500 }
    }]
  ]);

  // ===========================================================================
  // SHARED ROW: AUTOMATION
  // These are DELTAS on top of the base method: they trade unskilled labour for
  // machines. Use them when you are short of Laborers, not to save money.
  // ===========================================================================
  pm('pmg_automation_light', [
    ['pm_no_automation_light', 'No Automation', { icon: 'Method_no_automation' }],
    ['pm_mechanized_workshops_auto', 'Mechanized Workshops', {
      icon: 'Method_mechanized_workshops', tech: 'tech_manufacturies',
      in: { tools: 10 }, jobs: { laborers: -1000, machinists: 500 }
    }],
    ['pm_automation_light_electric', 'Electric Automation', {
      icon: 'Method_electric_rollers', tech: 'tech_electricity',
      in: { tools: 15, electricity: 10 }, jobs: { laborers: -1500, machinists: 750, engineers: 250 }
    }]
  ]);

  pm('pmg_automation_heavy', [
    ['pm_no_automation_heavy', 'No Automation', { icon: 'Method_no_automation' }],
    ['pm_mechanized_workshops_heavy', 'Mechanized Workshops', {
      icon: 'Method_mechanized_workshops', tech: 'tech_manufacturies',
      in: { tools: 15 }, jobs: { laborers: -1000, machinists: 500 }
    }],
    ['pm_assembly_lines_auto', 'Assembly Lines', {
      icon: 'Method_assembly_lines', tech: 'tech_assembly_lines',
      in: { tools: 25, electricity: 15 }, jobs: { laborers: -2000, machinists: 1000, engineers: 500 }
    }]
  ]);

  // ===========================================================================
  // SHARED ROW: OWNERSHIP
  // Owners are paid out of PROFIT, not out of the wage pool, which is why they
  // carry wageWeight 0 in pops.js. Changing this row moves money between social
  // classes; it does not change how much the building makes.
  // ===========================================================================
  pm('pmg_ownership_industry', [
    ['pm_privately_owned', 'Privately Owned', {
      icon: 'Method_privately_owned', jobs: { capitalists: 500 }
    }],
    ['pm_publicly_traded', 'Publicly Traded', {
      icon: 'Method_publicly_traded', tech: 'tech_central_banking',
      jobs: { capitalists: 250, clerks: 750 }
    }],
    ['pm_government_run', 'Government Run', {
      icon: 'Method_government_run', jobs: { bureaucrats: 500 }
    }],
    ['pm_worker_cooperative', 'Worker Cooperative', {
      icon: 'Method_ownership_academics', tech: 'tech_socialism', jobs: {}
    }]
  ]);

  pm('pmg_ownership_rural', [
    ['pm_ownership_aristocrats', 'Aristocratic Estates', {
      icon: 'Method_ownership_aristocrats', jobs: { aristocrats: 500 }
    }],
    ['pm_ownership_capitalists', 'Capitalist Estates', {
      icon: 'Method_privately_owned', tech: 'tech_central_banking', jobs: { capitalists: 500 }
    }],
    ['pm_ownership_homesteading', 'Homesteading', {
      icon: 'Method_homesteading', tech: 'tech_homesteading', jobs: { farmers: 500 }
    }],
    ['pm_ownership_gov_rural', 'Government Run', {
      icon: 'Method_government_run', jobs: { bureaucrats: 500 }
    }]
  ]);

})(window.V3);
