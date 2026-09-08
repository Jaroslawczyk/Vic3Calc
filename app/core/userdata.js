/* ============================================================================
 * app/core/userdata.js - Everything the user owns, and the shareable pack.
 * ---------------------------------------------------------------------------
 * EN: Three things belong to the user and none of them ever touch the shipped
 *     files in app/data/:
 *
 *       1. DATA EDITS  - new / changed / hidden goods, buildings, PMs, units.
 *       2. CHAINS      - saved production-chain setups, by name.
 *       3. SETTINGS    - language, formulas on/off, price table, and so on.
 *
 *     All three serialise into ONE file:  something.v3pack.json
 *     Hand that file to another player, they press "Load pack", and they see
 *     exactly what you see. That is the whole sharing story - no installer,
 *     no folders to copy.
 *
 *     PACK FORMAT (v1) - documented in docs/DATA-FORMAT.md:
 *       {
 *         "format": "vic3calc.pack",
 *         "formatVersion": 1,
 *         "appVersion": "1.0.0",
 *         "title": "Anbennar goods pack",
 *         "author": "someone",
 *         "createdAt": "2026-09-08T10:00:00.000Z",
 *         "data":     { "good": { "mithril": {...} }, "building": {...} },
 *         "chains":   [ { "id": "...", "name": "Steel 200", "nodes": [...] } ],
 *         "settings": { ... }        // optional, omitted by default
 *       }
 *
 * RU: Пользователю принадлежат три вещи, и ни одна из них не трогает файлы
 *     из app/data/:
 *
 *       1. ПРАВКИ ДАННЫХ - новые / изменённые / скрытые товары, здания, методы.
 *       2. ЦЕПОЧКИ       - сохранённые схемы производства, по именам.
 *       3. НАСТРОЙКИ     - язык, показ формул, таблица цен и т.д.
 *
 *     Всё это выгружается в ОДИН файл: что-нибудь.v3pack.json
 *     Отдайте его другому игроку, он нажмёт "Загрузить набор" - и увидит
 *     ровно то же, что вы. Никаких установщиков и копирования папок.
 * ==========================================================================*/
(function (V3) {
  'use strict';

  var KEY_DATA = 'userLayer';
  var KEY_CHAINS = 'chains';
  var KEY_SETTINGS = 'settings';

  var U = V3.userdata = {};

  var chains = [];
  var settings = {};

  // ---------------------------------------------------------------------------
  // Defaults for every setting the app understands. Adding a setting here makes
  // it exportable and resettable for free.
  // ---------------------------------------------------------------------------
  U.DEFAULT_SETTINGS = {
    lang: 'ru',
    theme: 'parchment',            // 'parchment' | 'night'
    showFormulas: true,            // show the "how was this computed" strips
    showConfidence: true,          // badge numbers that still need wiki checking
    // --- economy assumptions -------------------------------------------------
    priceMode: 'base',             // 'base' = wiki base prices, 'custom' = your table
    customPrices: {},              // goodId -> price, used when priceMode==='custom'
    wageMultiplier: 1.0,           // your country's wage level vs. the default
    // --- simulation switches -------------------------------------------------
    economyOfScale: true,          // +throughput per building level
    countInfrastructure: true,
    countPollution: true,
    countConstructionSector: true, // chain contains construction sectors -> ramp-up
    buildOrderMode: 'fastest',     // 'fastest' | 'cheapest' | 'selfSufficient'
    // --- country context -----------------------------------------------------
    country: {
      population: 0,               // total pops; 0 = "don't check against population"
      constructionPoints: 0,       // your current national construction, per week
      baseWeeklyConstruction: 10,  // Vic3 base, before technologies
      literacyPct: 40,
      govBuildingCostMult: 0       // e.g. -15% from laws -> -0.15
    }
  };

  // ---------------------------------------------------------------------------
  // Load at boot
  // ---------------------------------------------------------------------------
  U.load = function () {
    var layer = V3.storage.get(KEY_DATA, null);
    if (layer) V3.db.importUserLayer(layer, 'replace');

    chains = V3.storage.get(KEY_CHAINS, []) || [];

    settings = V3.util.deepMerge(U.DEFAULT_SETTINGS, V3.storage.get(KEY_SETTINGS, {}) || {});
  };

  /** Called by the registry after every data edit. Debounced to spare the disk. */
  U.persist = V3.util.debounce(function () {
    V3.storage.set(KEY_DATA, V3.db.exportUserLayer());
  }, 250);

  // ---------------------------------------------------------------------------
  // Settings
  // ---------------------------------------------------------------------------
  U.settings = function () { return settings; };

  U.get = function (path, fallback) {
    var parts = String(path).split('.');
    var cur = settings;
    for (var i = 0; i < parts.length; i++) {
      if (cur == null || typeof cur !== 'object') return fallback;
      cur = cur[parts[i]];
    }
    return cur === undefined ? fallback : cur;
  };

  U.set = function (path, value) {
    var parts = String(path).split('.');
    var cur = settings;
    for (var i = 0; i < parts.length - 1; i++) {
      if (typeof cur[parts[i]] !== 'object' || cur[parts[i]] === null) cur[parts[i]] = {};
      cur = cur[parts[i]];
    }
    cur[parts[parts.length - 1]] = value;
    V3.storage.set(KEY_SETTINGS, settings);
    V3.bus.emit('settings:changed', { path: path, value: value });
  };

  U.resetSettings = function () {
    settings = V3.util.deepClone(U.DEFAULT_SETTINGS);
    V3.storage.set(KEY_SETTINGS, settings);
    V3.bus.emit('settings:changed', { path: '*' });
  };

  // ---------------------------------------------------------------------------
  // Saved chains
  // ---------------------------------------------------------------------------
  U.chains = function () { return chains.slice(); };

  U.chain = function (id) {
    return chains.filter(function (c) { return c.id === id; })[0];
  };

  U.saveChain = function (chain) {
    if (!chain.id) chain.id = V3.util.uid('chain');
    chain.savedAt = new Date().toISOString();
    var i = chains.findIndex(function (c) { return c.id === chain.id; });
    if (i >= 0) chains[i] = chain; else chains.push(chain);
    V3.storage.set(KEY_CHAINS, chains);
    V3.bus.emit('chains:changed', chain);
    return chain;
  };

  U.deleteChain = function (id) {
    chains = chains.filter(function (c) { return c.id !== id; });
    V3.storage.set(KEY_CHAINS, chains);
    V3.bus.emit('chains:changed', null);
  };

  // ---------------------------------------------------------------------------
  // The shareable pack
  // ---------------------------------------------------------------------------
  U.PACK_FORMAT = 'vic3calc.pack';
  U.PACK_VERSION = 1;

  /**
   * Build a pack object.
   * opts: { title, author, includeData, includeChains, includeSettings, chainIds }
   */
  U.buildPack = function (opts) {
    opts = opts || {};
    var pack = {
      format: U.PACK_FORMAT,
      formatVersion: U.PACK_VERSION,
      appVersion: V3.APP_VERSION,
      gameDataRevision: (V3.dataMeta && V3.dataMeta.revision) || null,
      title: opts.title || 'Vic3 Calculator pack',
      author: opts.author || '',
      createdAt: new Date().toISOString()
    };
    if (opts.includeData !== false) pack.data = V3.db.exportUserLayer();
    if (opts.includeChains !== false) {
      pack.chains = opts.chainIds
        ? chains.filter(function (c) { return opts.chainIds.indexOf(c.id) >= 0; })
        : chains;
    }
    if (opts.includeSettings) pack.settings = settings;
    return pack;
  };

  U.exportPack = function (opts) {
    var pack = U.buildPack(opts);
    var safe = V3.util.slug(pack.title) || 'pack';
    V3.storage.downloadJSON(safe + '.v3pack.json', pack);
    return pack;
  };

  /**
   * Validate + apply a pack.
   * mode: 'merge' (default, keeps your stuff) | 'replace'
   * Returns a report you can show in a dialog.
   */
  U.importPack = function (pack, mode) {
    var report = { ok: false, errors: [], added: {}, chains: 0, settings: false };

    if (!pack || typeof pack !== 'object') {
      report.errors.push('NOT_AN_OBJECT'); return report;
    }
    if (pack.format !== U.PACK_FORMAT) {
      report.errors.push('WRONG_FORMAT'); return report;
    }
    if (pack.formatVersion > U.PACK_VERSION) {
      report.errors.push('NEWER_FORMAT'); return report;
    }

    if (pack.data) {
      Object.keys(pack.data).forEach(function (kind) {
        report.added[kind] = Object.keys(pack.data[kind] || {}).length;
      });
      V3.db.importUserLayer(pack.data, mode === 'replace' ? 'replace' : 'merge');
      V3.storage.set(KEY_DATA, V3.db.exportUserLayer());
    }

    if (pack.chains && pack.chains.length) {
      if (mode === 'replace') chains = [];
      pack.chains.forEach(function (c) {
        // Never silently overwrite a chain the user already has under that id.
        if (chains.some(function (x) { return x.id === c.id; })) c.id = V3.util.uid('chain');
        chains.push(c);
      });
      report.chains = pack.chains.length;
      V3.storage.set(KEY_CHAINS, chains);
      V3.bus.emit('chains:changed', null);
    }

    if (pack.settings && mode === 'replace') {
      settings = V3.util.deepMerge(U.DEFAULT_SETTINGS, pack.settings);
      V3.storage.set(KEY_SETTINGS, settings);
      report.settings = true;
      V3.bus.emit('settings:changed', { path: '*' });
    }

    report.ok = true;
    V3.bus.emit('data:changed', { kind: '*', id: '*' });
    return report;
  };

  /** Nuke every user-owned thing. The Settings screen confirms before calling. */
  U.wipeAll = function () {
    V3.db.importUserLayer({}, 'replace');
    chains = [];
    settings = V3.util.deepClone(U.DEFAULT_SETTINGS);
    V3.storage.remove(KEY_DATA);
    V3.storage.remove(KEY_CHAINS);
    V3.storage.remove(KEY_SETTINGS);
    V3.bus.emit('data:changed', { kind: '*', id: '*' });
    V3.bus.emit('chains:changed', null);
    V3.bus.emit('settings:changed', { path: '*' });
  };

})(window.V3);
