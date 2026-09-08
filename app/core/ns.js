/* ============================================================================
 * app/core/ns.js — Root namespace, tiny helpers, event bus.
 * ---------------------------------------------------------------------------
 * EN: This is the FIRST script loaded. Everything else hangs off the global
 *     `V3` object. We deliberately use classic <script> tags instead of ES
 *     modules, because the app must run from a plain file:// URL (double-click,
 *     no web server, no console). Browsers block `import` over file://.
 *
 * RU: Это ПЕРВЫЙ загружаемый скрипт. Всё остальное вешается на глобальный
 *     объект `V3`. Мы намеренно используем обычные <script>, а не ES-модули,
 *     потому что приложение должно работать с file:// (двойной клик, без
 *     сервера и консоли). Браузеры блокируют `import` для file://.
 * ==========================================================================*/
(function (global) {
  'use strict';

  var V3 = global.V3 || (global.V3 = {});

  V3.APP_VERSION = '1.0.0';

  /**
   * Screens register themselves here as `V3.views.<tabId> = { render(){} }`.
   * It has to exist before ANY ui/view_*.js runs, and those load before
   * ui/app.js - so it is declared here, in the very first file, rather than
   * where it is used.
   */
  V3.views = V3.views || {};

  // ---------------------------------------------------------------------------
  // Small helpers used everywhere. Kept deliberately tiny and dependency-free.
  // ---------------------------------------------------------------------------
  V3.util = {
    /** Shallow-clone a plain object. */
    clone: function (o) { return Object.assign({}, o); },

    /** Deep clone via JSON. Our data is plain JSON-safe objects, so this is fine. */
    deepClone: function (o) { return o == null ? o : JSON.parse(JSON.stringify(o)); },

    /**
     * Deep-merge `patch` into `base`, returning a NEW object.
     * Arrays are replaced wholesale (not merged element-wise) — this is what you
     * want for things like a production method's input list.
     */
    deepMerge: function deepMerge(base, patch) {
      if (patch === null || patch === undefined) return V3.util.deepClone(base);
      if (Array.isArray(patch) || typeof patch !== 'object') return V3.util.deepClone(patch);
      var out = V3.util.deepClone(base) || {};
      Object.keys(patch).forEach(function (k) {
        var pv = patch[k];
        if (pv && typeof pv === 'object' && !Array.isArray(pv) &&
            out[k] && typeof out[k] === 'object' && !Array.isArray(out[k])) {
          out[k] = deepMerge(out[k], pv);
        } else {
          out[k] = V3.util.deepClone(pv);
        }
      });
      return out;
    },

    /** Clamp n into [lo, hi]. */
    clamp: function (n, lo, hi) { return n < lo ? lo : (n > hi ? hi : n); },

    /** Sum of an array, optionally via an accessor. */
    sum: function (arr, fn) {
      var t = 0;
      for (var i = 0; i < arr.length; i++) t += fn ? (fn(arr[i], i) || 0) : (arr[i] || 0);
      return t;
    },

    /** Group array items by a key function -> { key: [items] }. */
    groupBy: function (arr, fn) {
      var out = {};
      arr.forEach(function (x) {
        var k = fn(x);
        (out[k] || (out[k] = [])).push(x);
      });
      return out;
    },

    /** Stable sort helper: sort by a numeric/string key. */
    sortBy: function (arr, fn, desc) {
      return arr.slice().sort(function (a, b) {
        var av = fn(a), bv = fn(b);
        if (av < bv) return desc ? 1 : -1;
        if (av > bv) return desc ? -1 : 1;
        return 0;
      });
    },

    /** `slugify('Steel Mills')` -> `'steel_mills'`. Used for new user content ids. */
    slug: function (s) {
      return String(s || '').toLowerCase().trim()
        .replace(/[^a-z0-9а-яё]+/gi, '_')
        .replace(/^_+|_+$/g, '') || 'item';
    },

    /** Unique id with a prefix, e.g. `uid('custom')` -> `'custom_l3k9x2'`. */
    uid: function (prefix) {
      return (prefix || 'id') + '_' + Math.random().toString(36).slice(2, 8);
    },

    /** Debounce — used for live-recalculating inputs without thrashing. */
    debounce: function (fn, ms) {
      var t = null;
      return function () {
        var args = arguments, self = this;
        clearTimeout(t);
        t = setTimeout(function () { fn.apply(self, args); }, ms || 150);
      };
    },

    /** Parse a user-entered number tolerantly ("1 234,5" -> 1234.5). */
    parseNum: function (v, fallback) {
      if (typeof v === 'number') return isFinite(v) ? v : (fallback || 0);
      var s = String(v == null ? '' : v).replace(/\s|\u00a0/g, '').replace(',', '.');
      var n = parseFloat(s);
      return isFinite(n) ? n : (fallback === undefined ? 0 : fallback);
    }
  };

  // ---------------------------------------------------------------------------
  // Event bus. Views subscribe; engine/state publishes. Keeps UI decoupled.
  //   V3.bus.on('state:changed', fn); V3.bus.emit('state:changed', payload);
  // ---------------------------------------------------------------------------
  V3.bus = (function () {
    var map = {};
    return {
      on: function (evt, fn) {
        (map[evt] || (map[evt] = [])).push(fn);
        return function off() { V3.bus.off(evt, fn); };
      },
      off: function (evt, fn) {
        if (!map[evt]) return;
        map[evt] = map[evt].filter(function (f) { return f !== fn; });
      },
      emit: function (evt, payload) {
        (map[evt] || []).forEach(function (fn) {
          try { fn(payload); } catch (e) { console.error('[V3.bus] handler failed for ' + evt, e); }
        });
      }
    };
  })();

  // ---------------------------------------------------------------------------
  // Boot-time problem log. Data files push here instead of throwing, so one bad
  // record never blanks the whole app. Surfaced in Settings -> Diagnostics.
  // ---------------------------------------------------------------------------
  V3.problems = [];
  V3.warn = function (where, message, detail) {
    V3.problems.push({ where: where, message: message, detail: detail });
    console.warn('[V3:' + where + '] ' + message, detail || '');
  };

})(window);
