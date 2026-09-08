/* ============================================================================
 * app/core/registry.js - The data layer.
 * ---------------------------------------------------------------------------
 * EN: Two stacked layers of data:
 *
 *       BASE   (app/data/*.js)  - shipped with the app, never written to.
 *       USER   (localStorage)   - your additions / edits / deletions. Exportable
 *                                 as a single .v3pack.json you can send to a
 *                                 friend, who loads it and gets the same setup.
 *
 *     V3.db.goods() etc. always return the MERGED view. Nothing in the app
 *     reads the base tables directly, so a mod is indistinguishable from
 *     vanilla content once loaded.
 *
 * RU: Два слоя данных, наложенных друг на друга:
 *
 *       BASE  (app/data/*.js)  - поставляется с программой, не изменяется.
 *       USER  (localStorage)   - ваши добавления / правки / удаления.
 *                                Экспортируются в один файл .v3pack.json,
 *                                который можно отправить другу - он загрузит
 *                                и получит точно такую же настройку.
 *
 *     V3.db.goods() и т.п. всегда возвращают ОБЪЕДИНЁННЫЙ результат. Никто
 *     в приложении не читает базовые таблицы напрямую, поэтому мод после
 *     загрузки неотличим от ванильного содержимого.
 * ==========================================================================*/
(function (V3) {
  'use strict';

  /** The kinds of records the app knows about. Adding a kind = one line here. */
  var KINDS = ['good', 'pop', 'buildingGroup', 'building', 'pm', 'pmGroup', 'tech', 'unit', 'almanac'];

  var base = {};   // kind -> { id -> record }
  var user = {};   // kind -> { id -> patch | {__deleted:true} }
  KINDS.forEach(function (k) { base[k] = {}; user[k] = {}; });

  // Two caches, both thrown away together whenever the data changes.
  //   mergedCache  the base+user overlay, per kind
  //   listCache    sorted arrays, because the solver asks for the same list
  //                thousands of times per recalculation and re-sorting 200+
  //                production methods each time made typing in a number field
  //                take seconds. Measured, not guessed.
  var mergedCache = null;
  var listCache = null;

  function invalidate() { mergedCache = null; listCache = null; }

  // ---------------------------------------------------------------------------
  // BASE registration - called by app/data/*.js at load time.
  // ---------------------------------------------------------------------------
  function define(kind, records) {
    if (KINDS.indexOf(kind) < 0) { V3.warn('registry', 'unknown kind: ' + kind); return; }
    (records || []).forEach(function (r) {
      if (!r || !r.id) { V3.warn('registry', 'record without id in ' + kind, r); return; }
      if (base[kind][r.id]) V3.warn('registry', 'duplicate ' + kind + ' id: ' + r.id);
      // `kind` is reserved: it names the record type and is half of every
      // translation key. A data file that sets its own `kind` would have it
      // silently overwritten here, so say so loudly instead.
      if (r.kind !== undefined && r.kind !== kind) {
        V3.warn('registry', '"' + r.id + '" sets a reserved field `kind` ("' + r.kind +
          '") - it will be overwritten. Rename the field.');
      }
      r.kind = kind;
      base[kind][r.id] = r;
    });
    invalidate();
  }

  V3.define = {};
  KINDS.forEach(function (k) {
    // e.g. V3.define.good([...]) / V3.define.building([...])
    V3.define[k] = function (records) { define(k, records); };
  });

  // ---------------------------------------------------------------------------
  // MERGED view
  // ---------------------------------------------------------------------------
  function buildMerged() {
    var out = {};
    KINDS.forEach(function (kind) {
      var m = {};
      Object.keys(base[kind]).forEach(function (id) { m[id] = base[kind][id]; });
      Object.keys(user[kind]).forEach(function (id) {
        var patch = user[kind][id];
        if (patch && patch.__deleted) { delete m[id]; return; }
        var mg = m[id] ? V3.util.deepMerge(m[id], patch) : V3.util.deepClone(patch);
        mg.id = id;
        mg.kind = kind;
        mg.__user = true;                       // badge it in the UI
        mg.__isNew = !base[kind][id];           // fully custom vs. edited vanilla
        m[id] = mg;
      });
      out[kind] = m;
    });
    return out;
  }

  function merged() { return mergedCache || (mergedCache = buildMerged()); }

  /** Memoised sorted list, keyed by an arbitrary string. */
  function cachedList(key, build) {
    if (!listCache) listCache = {};
    if (!listCache[key]) listCache[key] = build();
    return listCache[key];
  }

  // ---------------------------------------------------------------------------
  // Public read API - V3.db
  // ---------------------------------------------------------------------------
  var db = V3.db = {};

  KINDS.forEach(function (kind) {
    var plural = kind + 's';
    if (kind === 'pm') plural = 'pms';
    if (kind === 'buildingGroup') plural = 'buildingGroups';
    if (kind === 'pmGroup') plural = 'pmGroups';

    /** All records of a kind, as an array, sorted by `order` then id. */
    db[plural] = function () {
      return cachedList('all:' + kind, function () {
        var m = merged()[kind];
        return V3.util.sortBy(Object.keys(m).map(function (id) { return m[id]; }),
          function (r) { return String(1000 + (r.order == null ? 999 : r.order)) + '_' + r.id; });
      });
    };

    /** One record by id, or undefined. */
    db[kind] = function (id) { return merged()[kind][id]; };
  });

  /** Map form, when you need O(1) lookups in a hot loop. */
  db.map = function (kind) { return merged()[kind]; };

  /** Does a record exist (after user deletions)? */
  db.has = function (kind, id) { return !!merged()[kind][id]; };

  /**
   * Resolve a record or return a loud placeholder instead of crashing.
   * Missing references happen constantly while modding - we degrade gracefully.
   */
  db.safe = function (kind, id) {
    var r = merged()[kind][id];
    if (r) return r;
    return { id: id, kind: kind, __missing: true, name: '?' + id, icon: null };
  };

  // ---------------------------------------------------------------------------
  // USER layer writes. All of these persist immediately.
  // ---------------------------------------------------------------------------
  db.setUserPatch = function (kind, id, patch) {
    if (KINDS.indexOf(kind) < 0) return;
    user[kind][id] = patch;
    invalidate();
    V3.bus.emit('data:changed', { kind: kind, id: id });
    if (V3.userdata) V3.userdata.persist();
  };

  db.mergeUserPatch = function (kind, id, patch) {
    var cur = user[kind][id] || {};
    db.setUserPatch(kind, id, V3.util.deepMerge(cur, patch));
  };

  /** Remove a user edit, reverting to the shipped value. */
  db.clearUserPatch = function (kind, id) {
    delete user[kind][id];
    invalidate();
    V3.bus.emit('data:changed', { kind: kind, id: id });
    if (V3.userdata) V3.userdata.persist();
  };

  /** Hide a shipped record (or drop a custom one entirely). */
  db.deleteRecord = function (kind, id) {
    if (base[kind][id]) user[kind][id] = { __deleted: true };
    else delete user[kind][id];
    invalidate();
    V3.bus.emit('data:changed', { kind: kind, id: id });
    if (V3.userdata) V3.userdata.persist();
  };

  db.isUserModified = function (kind, id) { return !!user[kind][id]; };
  db.isShipped = function (kind, id) { return !!base[kind][id]; };

  // ---------------------------------------------------------------------------
  // Serialisation of the user layer (used by export / import / autosave).
  // ---------------------------------------------------------------------------
  db.exportUserLayer = function () { return V3.util.deepClone(user); };

  db.importUserLayer = function (obj, mode) {
    // mode: 'replace' (default) | 'merge'
    if (mode !== 'merge') KINDS.forEach(function (k) { user[k] = {}; });
    Object.keys(obj || {}).forEach(function (kind) {
      if (KINDS.indexOf(kind) < 0) return;
      Object.keys(obj[kind] || {}).forEach(function (id) {
        user[kind][id] = obj[kind][id];
      });
    });
    invalidate();
    V3.bus.emit('data:changed', { kind: '*', id: '*' });
  };

  db.userLayerCount = function () {
    return V3.util.sum(KINDS, function (k) { return Object.keys(user[k]).length; });
  };

  db.KINDS = KINDS;

  // ---------------------------------------------------------------------------
  // Convenience joins used by many views.
  // ---------------------------------------------------------------------------

  /** Production methods belonging to a PM group, in display order. */
  db.pmsOfGroup = function (groupId) {
    return cachedList('pmsOf:' + groupId, function () {
      return db.pms().filter(function (p) { return p.group === groupId; });
    });
  };

  /** PM groups a building offers, resolved to records. */
  db.pmGroupsOfBuilding = function (buildingId) {
    var b = db.building(buildingId);
    if (!b) return [];
    return (b.pmGroups || []).map(function (g) { return db.safe('pmGroup', g); });
  };

  /** Every building that can output a given good (used for chain expansion). */
  db.producersOf = function (goodId) {
    return cachedList('producersOf:' + goodId, function () {
      return db.buildings().filter(function (b) {
        return (b.produces || []).indexOf(goodId) >= 0;
      });
    });
  };

})(window.V3);
