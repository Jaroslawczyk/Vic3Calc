/* ============================================================================
 * app/data/almanac.js - The Almanac: structure only, no prose.
 * ---------------------------------------------------------------------------
 * EN: Every sentence of the Almanac lives in app/lang/*.js, referenced from
 *     here by key. That is deliberate: translating the whole guide means
 *     translating ONE file, and nobody has to touch this structure to do it.
 *
 *     BLOCK TYPES the renderer understands:
 *
 *       {t:'p',       k}                a paragraph
 *       {t:'tip',     k}                a green "do this" note
 *       {t:'warn',    k}                a red "this will hurt" note
 *       {t:'steps',   k, n}             numbered list; keys are k.1 .. k.n
 *       {t:'goods',   items:[{good,n}]} an icon row, no words needed
 *       {t:'chain',   good, amount}     a LIVE worked example - the app runs
 *                                       the real solver and draws the real
 *                                       answer, so the guide can never drift
 *                                       out of step with the data tables
 *       {t:'formula', id}               pulls the formula from engine/formulas
 *       {t:'compare', k, rows}          two-column "this vs that"
 *       {t:'table',   k, head, rows}    a small reference table
 *
 * RU: Каждое предложение альманаха лежит в app/lang/*.js и вызывается отсюда
 *     по ключу. Это сделано намеренно: перевести всё руководство = перевести
 *     ОДИН файл, и структуру трогать не нужно.
 *
 *     Блок {t:'chain'} - живой пример: программа реально прогоняет решатель и
 *     рисует настоящий ответ. Поэтому руководство физически не может разойтись
 *     с таблицами данных.
 * ==========================================================================*/
(function (V3) {
  'use strict';

  V3.define.almanac([

    // =========================================================================
    // GETTING STARTED
    // =========================================================================
    {
      id: 'reading_a_chain', category: 'basics', icon: 'Lens_button_production', order: 1,
      blocks: [
        { t: 'p', k: 'alm.reading.p1' },
        { t: 'chain', good: 'clothes', amount: 100 },
        { t: 'p', k: 'alm.reading.p2' },
        { t: 'tip', k: 'alm.reading.tip' },
        { t: 'formula', id: 'levelsNeeded' }
      ]
    },
    {
      id: 'first_ten_years', category: 'basics', icon: 'State_status_construction', order: 2,
      blocks: [
        { t: 'p', k: 'alm.first10.p1' },
        { t: 'steps', k: 'alm.first10.step', n: 6 },
        { t: 'warn', k: 'alm.first10.warn' }
      ]
    },
    {
      id: 'common_mistakes', category: 'basics', icon: 'Event_industry', order: 3,
      blocks: [
        { t: 'steps', k: 'alm.mistakes.item', n: 7 },
        { t: 'tip', k: 'alm.mistakes.tip' }
      ]
    },

    // =========================================================================
    // MECHANICS
    // =========================================================================
    {
      id: 'throughput', category: 'mechanics', icon: 'Method_assembly_lines', order: 10,
      blocks: [
        { t: 'p', k: 'alm.throughput.p1' },
        { t: 'formula', id: 'throughput' },
        { t: 'p', k: 'alm.throughput.p2' },
        { t: 'tip', k: 'alm.throughput.tip' }
      ]
    },
    {
      id: 'why_tools', category: 'mechanics', icon: 'Building_tooling_workshops', order: 11,
      blocks: [
        { t: 'p', k: 'alm.tools.p1' },
        { t: 'chain', good: 'tools', amount: 100 },
        { t: 'p', k: 'alm.tools.p2' },
        { t: 'tip', k: 'alm.tools.tip' }
      ]
    },
    {
      id: 'construction_first', category: 'mechanics', icon: 'Building_construction_camp', order: 12,
      blocks: [
        { t: 'p', k: 'alm.construction.p1' },
        { t: 'formula', id: 'constructionTimeRamp' },
        { t: 'p', k: 'alm.construction.p2' },
        { t: 'warn', k: 'alm.construction.warn' }
      ]
    },
    {
      id: 'workforce', category: 'mechanics', icon: 'Panel_pops', order: 13,
      blocks: [
        { t: 'p', k: 'alm.workforce.p1' },
        { t: 'table', k: 'alm.workforce.table', head: 3, rows: 3 },
        { t: 'p', k: 'alm.workforce.p2' },
        { t: 'formula', id: 'employment' },
        { t: 'warn', k: 'alm.workforce.warn' }
      ]
    },
    {
      id: 'infrastructure', category: 'mechanics', icon: 'State_status_infrastructure', order: 14,
      blocks: [
        { t: 'p', k: 'alm.infra.p1' },
        { t: 'formula', id: 'infrastructure' },
        { t: 'tip', k: 'alm.infra.tip' }
      ]
    },
    {
      id: 'pollution', category: 'mechanics', icon: 'Building_power_plant', order: 15,
      blocks: [
        { t: 'p', k: 'alm.pollution.p1' },
        { t: 'formula', id: 'pollution' },
        { t: 'tip', k: 'alm.pollution.tip' }
      ]
    },
    {
      id: 'prices', category: 'mechanics', icon: 'Market_industrial_goods', order: 16,
      blocks: [
        { t: 'p', k: 'alm.prices.p1' },
        { t: 'warn', k: 'alm.prices.warn' },
        { t: 'formula', id: 'profit' },
        { t: 'tip', k: 'alm.prices.tip' }
      ]
    },

    // =========================================================================
    // STRATEGY
    // =========================================================================
    {
      id: 'self_sufficiency', category: 'strategy', icon: 'Building_port', order: 20,
      blocks: [
        { t: 'p', k: 'alm.selfsuf.p1' },
        { t: 'compare', k: 'alm.selfsuf.cmp', rows: 4 },
        { t: 'tip', k: 'alm.selfsuf.tip' }
      ]
    },
    {
      id: 'export_leader', category: 'strategy', icon: 'Goods_merchant_marine', order: 21,
      blocks: [
        { t: 'p', k: 'alm.export.p1' },
        { t: 'steps', k: 'alm.export.step', n: 4 },
        { t: 'chain', good: 'steel', amount: 500 },
        { t: 'warn', k: 'alm.export.warn' }
      ]
    },
    {
      id: 'private_sector', category: 'strategy', icon: 'Building_financial_district', order: 22,
      blocks: [
        { t: 'p', k: 'alm.private.p1' },
        { t: 'tip', k: 'alm.private.tip' },
        { t: 'warn', k: 'alm.private.warn' }
      ]
    },
    {
      id: 'where_to_build', category: 'strategy', icon: 'Building_railway', order: 23,
      blocks: [
        { t: 'p', k: 'alm.where.p1' },
        { t: 'steps', k: 'alm.where.step', n: 5 },
        { t: 'tip', k: 'alm.where.tip' }
      ]
    },

    // =========================================================================
    // WAR
    // =========================================================================
    {
      id: 'war_economy', category: 'war', icon: 'Lens_button_military', order: 30,
      blocks: [
        { t: 'p', k: 'alm.war.p1' },
        { t: 'formula', id: 'militaryGoods' },
        { t: 'p', k: 'alm.war.p2' },
        { t: 'warn', k: 'alm.war.warn' },
        { t: 'tip', k: 'alm.war.tip' }
      ]
    },
    {
      id: 'navy', category: 'war', icon: 'Building_military_shipyards', order: 31,
      blocks: [
        { t: 'p', k: 'alm.navy.p1' },
        { t: 'chain', good: 'ironclads', amount: 100 },
        { t: 'tip', k: 'alm.navy.tip' }
      ]
    },
    {
      id: 'research', category: 'war', icon: 'Building_university', order: 32,
      blocks: [
        { t: 'p', k: 'alm.research.p1' },
        { t: 'formula', id: 'researchRate' },
        { t: 'warn', k: 'alm.research.warn' }
      ]
    },

    // =========================================================================
    // ABOUT THIS APP
    // =========================================================================
    {
      id: 'trusting_numbers', category: 'about', icon: 'Panel_technology', order: 40,
      blocks: [
        { t: 'p', k: 'alm.trust.p1' },
        { t: 'warn', k: 'alm.trust.warn' },
        { t: 'steps', k: 'alm.trust.step', n: 3 },
        { t: 'tip', k: 'alm.trust.tip' }
      ]
    },
    {
      id: 'modding', category: 'about', icon: 'DLC_Victoria_3', order: 41,
      blocks: [
        { t: 'p', k: 'alm.mod.p1' },
        { t: 'steps', k: 'alm.mod.step', n: 5 },
        { t: 'tip', k: 'alm.mod.tip' }
      ]
    },
    {
      id: 'formula_reference', category: 'about', icon: 'Method_professional_bureaucrats', order: 42,
      blocks: [
        { t: 'p', k: 'alm.formulas.p1' },
        { t: 'allFormulas' }
      ]
    }
  ]);

})(window.V3);
