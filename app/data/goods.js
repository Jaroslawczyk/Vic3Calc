/* ============================================================================
 * app/data/goods.js - The goods table.
 * ---------------------------------------------------------------------------
 * EN: One row per tradeable good.
 *
 *       id          internal key. Also the translation key (`good.coal`).
 *       name        English fallback name.
 *       category    staple | industrial | luxury | military
 *       basePrice   the game's base price in £. Market price swings ±75% of it.
 *       icon        key from img/icons (see app/data/icon_manifest.js)
 *       confidence  see app/data/_meta.js
 *
 *     Base prices below were read from the wiki Goods table.
 *
 * RU: Одна строка на товар.
 *
 *       id          внутренний ключ. Он же ключ перевода (`good.coal`).
 *       name        английское название по умолчанию.
 *       category    staple | industrial | luxury | military
 *       basePrice   базовая цена в £. Рыночная гуляет в пределах ±75% от неё.
 *       icon        ключ из img/icons (см. app/data/icon_manifest.js)
 *       confidence  см. app/data/_meta.js
 *
 *     ЧТОБЫ ДОБАВИТЬ СВОЙ ТОВАР: проще всего через вкладку "Данные" в самой
 *     программе - тогда он сохранится в ваш .v3pack.json. Править этот файл
 *     нужно только если вы хотите изменить поставку по умолчанию для всех.
 * ==========================================================================*/
(function (V3) {
  'use strict';

  var OK = V3.OK, APPROX = V3.APPROX;

  V3.define.good([
    // ---- Staple goods -------------------------------------------------------
    { id: 'grain',           name: 'Grain',            category: 'staple',     basePrice: 20,  icon: 'Goods_grain',           confidence: OK, order: 1 },
    { id: 'fish',            name: 'Fish',             category: 'staple',     basePrice: 20,  icon: 'Goods_fish',            confidence: OK, order: 2 },
    { id: 'fabric',          name: 'Fabric',           category: 'staple',     basePrice: 20,  icon: 'Goods_fabric',          confidence: OK, order: 3 },
    { id: 'wood',            name: 'Wood',             category: 'staple',     basePrice: 20,  icon: 'Goods_wood',            confidence: OK, order: 4 },
    { id: 'groceries',       name: 'Groceries',        category: 'staple',     basePrice: 30,  icon: 'Goods_groceries',       confidence: OK, order: 5 },
    { id: 'clothes',         name: 'Clothes',          category: 'staple',     basePrice: 30,  icon: 'Goods_clothes',         confidence: OK, order: 6 },
    { id: 'furniture',       name: 'Furniture',        category: 'staple',     basePrice: 30,  icon: 'Goods_furniture',       confidence: OK, order: 7 },
    { id: 'paper',           name: 'Paper',            category: 'staple',     basePrice: 30,  icon: 'Goods_paper',           confidence: OK, order: 8 },
    { id: 'services',        name: 'Services',         category: 'staple',     basePrice: 30,  icon: 'Goods_services',        confidence: OK, order: 9,  local: true },
    { id: 'transportation',  name: 'Transportation',   category: 'staple',     basePrice: 30,  icon: 'Goods_transportation',  confidence: OK, order: 10, local: true },
    { id: 'electricity',     name: 'Electricity',      category: 'staple',     basePrice: 30,  icon: 'Goods_electricity',     confidence: OK, order: 11, local: true },
    { id: 'merchant_marine', name: 'Merchant Marine',  category: 'staple',     basePrice: 50,  icon: 'Goods_merchant_marine', confidence: OK, order: 12 },

    // ---- Industrial goods ---------------------------------------------------
    { id: 'fertilizer',      name: 'Fertilizer',       category: 'industrial', basePrice: 30,  icon: 'Goods_fertilizer',      confidence: OK, order: 20 },
    { id: 'coal',            name: 'Coal',             category: 'industrial', basePrice: 30,  icon: 'Goods_coal',            confidence: OK, order: 21 },
    { id: 'iron',            name: 'Iron',             category: 'industrial', basePrice: 40,  icon: 'Goods_iron',            confidence: OK, order: 22 },
    { id: 'lead',            name: 'Lead',             category: 'industrial', basePrice: 40,  icon: 'Goods_lead',            confidence: OK, order: 23 },
    { id: 'hardwood',        name: 'Hardwood',         category: 'industrial', basePrice: 40,  icon: 'Goods_hardwood',        confidence: OK, order: 24 },
    { id: 'oil',             name: 'Oil',              category: 'industrial', basePrice: 40,  icon: 'Goods_oil',             confidence: OK, order: 25 },
    { id: 'rubber',          name: 'Rubber',           category: 'industrial', basePrice: 40,  icon: 'Goods_rubber',          confidence: OK, order: 26 },
    { id: 'dye',             name: 'Dye',              category: 'industrial', basePrice: 40,  icon: 'Goods_dye',             confidence: OK, order: 27 },
    { id: 'silk',            name: 'Silk',             category: 'industrial', basePrice: 40,  icon: 'Goods_silk',            confidence: OK, order: 28 },
    { id: 'glass',           name: 'Glass',            category: 'industrial', basePrice: 40,  icon: 'Goods_glass',           confidence: OK, order: 29 },
    { id: 'tools',           name: 'Tools',            category: 'industrial', basePrice: 40,  icon: 'Goods_tools',           confidence: OK, order: 30 },
    { id: 'steel',           name: 'Steel',            category: 'industrial', basePrice: 50,  icon: 'Goods_steel',           confidence: OK, order: 31 },
    { id: 'sulfur',          name: 'Sulfur',           category: 'industrial', basePrice: 50,  icon: 'Goods_sulfur',          confidence: OK, order: 32 },
    { id: 'explosives',      name: 'Explosives',       category: 'industrial', basePrice: 50,  icon: 'Goods_explosives',      confidence: OK, order: 33 },
    { id: 'clippers',        name: 'Clippers',         category: 'industrial', basePrice: 60,  icon: 'Goods_clippers',        confidence: OK, order: 34 },
    // NOTE: this good was called "Locomotives" before patch 1.5; the icon file
    // still carries the old name. Same good, same slot.
    { id: 'engines',         name: 'Engines',          category: 'industrial', basePrice: 60,  icon: 'Goods_locomotives',     confidence: OK, order: 35, aka: 'Locomotives' },
    { id: 'steamers',        name: 'Steamers',         category: 'industrial', basePrice: 70,  icon: 'Goods_steamers',        confidence: OK, order: 36 },

    // ---- Luxury goods -------------------------------------------------------
    { id: 'fruit',           name: 'Fruit',            category: 'luxury',     basePrice: 30,  icon: 'Goods_fruit',           confidence: OK, order: 40 },
    { id: 'meat',            name: 'Meat',             category: 'luxury',     basePrice: 30,  icon: 'Goods_meat',            confidence: OK, order: 41 },
    { id: 'sugar',           name: 'Sugar',            category: 'luxury',     basePrice: 30,  icon: 'Goods_sugar',           confidence: OK, order: 42 },
    { id: 'liquor',          name: 'Liquor',           category: 'luxury',     basePrice: 30,  icon: 'Goods_liquor',          confidence: OK, order: 43 },
    { id: 'tobacco',         name: 'Tobacco',          category: 'luxury',     basePrice: 40,  icon: 'Goods_tobacco',         confidence: OK, order: 44 },
    { id: 'coffee',          name: 'Coffee',           category: 'luxury',     basePrice: 50,  icon: 'Goods_coffee',          confidence: OK, order: 45 },
    { id: 'tea',             name: 'Tea',              category: 'luxury',     basePrice: 50,  icon: 'Goods_tea',             confidence: OK, order: 46 },
    { id: 'wine',            name: 'Wine',             category: 'luxury',     basePrice: 50,  icon: 'Goods_wine',            confidence: OK, order: 47 },
    { id: 'opium',           name: 'Opium',            category: 'luxury',     basePrice: 50,  icon: 'Goods_opium',           confidence: OK, order: 48 },
    { id: 'luxury_clothes',  name: 'Luxury Clothes',   category: 'luxury',     basePrice: 60,  icon: 'Goods_luxury_clothes',  confidence: OK, order: 49 },
    { id: 'luxury_furniture',name: 'Luxury Furniture', category: 'luxury',     basePrice: 60,  icon: 'Goods_luxury_furniture',confidence: OK, order: 50 },
    { id: 'porcelain',       name: 'Porcelain',        category: 'luxury',     basePrice: 70,  icon: 'Goods_porcelain',       confidence: OK, order: 51 },
    { id: 'telephones',      name: 'Telephones',       category: 'luxury',     basePrice: 70,  icon: 'Goods_telephones',      confidence: OK, order: 52 },
    { id: 'radios',          name: 'Radios',           category: 'luxury',     basePrice: 80,  icon: 'Goods_radios',          confidence: OK, order: 53 },
    { id: 'automobiles',     name: 'Automobiles',      category: 'luxury',     basePrice: 100, icon: 'Goods_automobiles',     confidence: OK, order: 54 },
    { id: 'gold',            name: 'Gold',             category: 'luxury',     basePrice: 100, icon: 'Goods_gold',            confidence: OK, order: 55 },
    { id: 'fine_art',        name: 'Fine Art',         category: 'luxury',     basePrice: 200, icon: 'Goods_fine_art',        confidence: OK, order: 56 },

    // ---- Military goods -----------------------------------------------------
    { id: 'ammunition',      name: 'Ammunition',       category: 'military',   basePrice: 50,  icon: 'Goods_ammunition',      confidence: OK,     order: 60 },
    { id: 'small_arms',      name: 'Small Arms',       category: 'military',   basePrice: 60,  icon: 'Goods_small_arms',      confidence: OK,     order: 61 },
    { id: 'artillery',       name: 'Artillery',        category: 'military',   basePrice: 70,  icon: 'Goods_artillery',       confidence: OK,     order: 62 },
    { id: 'tanks',           name: 'Tanks',            category: 'military',   basePrice: 80,  icon: 'Goods_tanks',           confidence: OK,     order: 63 },
    { id: 'aeroplanes',      name: 'Aeroplanes',       category: 'military',   basePrice: 80,  icon: 'Goods_aeroplanes',      confidence: OK,     order: 64 },
    // The wiki Goods table does not list the two naval goods, so these two
    // prices are the only ones on this page that are NOT wiki-verified.
    { id: 'manowars',        name: 'Man-o-Wars',       category: 'military',   basePrice: 60,  icon: 'Goods_man_o_wars',      confidence: APPROX, order: 65 },
    { id: 'ironclads',       name: 'Ironclads',        category: 'military',   basePrice: 90,  icon: 'Goods_ironclads',       confidence: APPROX, order: 66 }
  ]);

})(window.V3);
