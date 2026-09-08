/* ============================================================================
 * app/data/building_groups.js - Building categories.
 * ---------------------------------------------------------------------------
 * EN: Groups do three jobs:
 *       1. they organise the building list in the UI (tabs and colours),
 *       2. they carry DEFAULTS a building can inherit instead of repeating
 *          (infrastructure usage, whether the state caps how many you can build),
 *       3. they let the chain solver reason about a building without knowing it
 *          specifically - e.g. "rural buildings are capped by arable land".
 *
 *     A building may override any default with its own field of the same name.
 *
 * RU: Группы делают три вещи:
 *       1. организуют список зданий в интерфейсе (вкладки и цвета),
 *       2. хранят ЗНАЧЕНИЯ ПО УМОЛЧАНИЮ, чтобы не повторять их у каждого
 *          здания (расход инфраструктуры, ограничение по штату),
 *       3. позволяют решателю рассуждать о здании, ничего не зная о нём
 *          конкретно - например "сельские здания ограничены пашней".
 *
 *     Любое здание может переопределить значение своим полем с тем же именем.
 * ==========================================================================*/
(function (V3) {
  'use strict';

  var APPROX = V3.APPROX;

  V3.define.buildingGroup([
    {
      id: 'agriculture', name: 'Agriculture', icon: 'Building_wheat_farm',
      color: '#7d8c4e', infraUsage: 2, stateCapped: true, capKind: 'arable',
      confidence: APPROX, order: 1
    },
    {
      id: 'ranching', name: 'Ranching & Plantations', icon: 'Building_cattle_ranch',
      color: '#94824a', infraUsage: 2, stateCapped: true, capKind: 'arable',
      confidence: APPROX, order: 2
    },
    {
      id: 'extraction', name: 'Extraction', icon: 'Building_coal_mine',
      color: '#6b6558', infraUsage: 2, stateCapped: true, capKind: 'deposit',
      confidence: APPROX, order: 3
    },
    {
      id: 'manufacturing', name: 'Manufacturing', icon: 'Building_steel_mills',
      color: '#8a5a3b', infraUsage: 3, stateCapped: false,
      confidence: APPROX, order: 4
    },
    {
      id: 'military_industry', name: 'Military Industry', icon: 'Building_arms_industry',
      color: '#7a4141', infraUsage: 3, stateCapped: false,
      confidence: APPROX, order: 5
    },
    {
      id: 'urban', name: 'Urban & Infrastructure', icon: 'Building_urban_center',
      color: '#5d6b7a', infraUsage: 0, stateCapped: false,
      confidence: APPROX, order: 6
    },
    {
      id: 'government', name: 'Government', icon: 'Building_government_administration',
      color: '#6a5a7a', infraUsage: 0, stateCapped: false,
      confidence: APPROX, order: 7
    },
    {
      id: 'development', name: 'Construction & Development', icon: 'Building_construction_camp',
      color: '#8a7440', infraUsage: 3, stateCapped: false,
      confidence: APPROX, order: 8
    },
    {
      id: 'military', name: 'Military', icon: 'Building_barrack',
      color: '#6d4a3a', infraUsage: 0, stateCapped: false,
      confidence: APPROX, order: 9
    },
    {
      id: 'private', name: 'Private & Subsistence', icon: 'Building_manor_houses',
      color: '#5a6b5a', infraUsage: 0, stateCapped: false, autoBuilt: true,
      confidence: APPROX, order: 10
    },
    {
      id: 'monument', name: 'Monuments', icon: 'Building_big_ben',
      color: '#8a7a4a', infraUsage: 0, stateCapped: false, unique: true,
      confidence: APPROX, order: 11
    }
  ]);

})(window.V3);
