/* ============================================================================
 * app/core/i18n.js - Translation.
 * ---------------------------------------------------------------------------
 * EN: To add a language you copy ONE file (app/lang/TEMPLATE.js), translate the
 *     strings on the right of the colon, and add one <script> line to
 *     index.html. Nothing else in the app needs to change.
 *
 *     Lookup order for any key:  current language -> English -> the key itself.
 *     A missing translation therefore degrades to English, never to a blank.
 *
 *     Two namespaces live in a language file:
 *       ui:       { 'tab.chain': 'Production chain', ... }   - interface text
 *       entities: { 'good.coal': 'Coal', ... }               - game content
 *
 *     Entity names fall back to the `name` field on the data record, so custom
 *     / modded content works untranslated without any extra effort.
 *
 * RU: Чтобы добавить язык, скопируйте ОДИН файл (app/lang/TEMPLATE.js),
 *     переведите строки справа от двоеточия и добавьте одну строку <script>
 *     в index.html. Больше ничего менять не нужно.
 *
 *     Порядок поиска ключа: текущий язык -> английский -> сам ключ.
 *     Отсутствующий перевод показывается по-английски, а не пустотой.
 * ==========================================================================*/
(function (V3) {
  'use strict';

  var langs = {};          // code -> { code, name, flag, ui:{}, entities:{} }
  var current = 'en';

  var I18n = V3.i18n = {};

  /** Called from app/lang/*.js at load time. */
  I18n.register = function (def) {
    if (!def || !def.code) { V3.warn('i18n', 'language without code', def); return; }
    langs[def.code] = {
      code: def.code,
      name: def.name || def.code,
      flag: def.flag || '',
      credit: def.credit || '',
      ui: def.ui || {},
      entities: def.entities || {}
    };
  };

  I18n.available = function () {
    return Object.keys(langs).map(function (c) { return langs[c]; });
  };

  I18n.current = function () { return current; };

  I18n.set = function (code) {
    if (!langs[code]) { V3.warn('i18n', 'no such language: ' + code); return; }
    current = code;
    document.documentElement.setAttribute('lang', code);
    V3.bus.emit('lang:changed', code);
  };

  // ---------------------------------------------------------------------------
  // PLURALS
  // ---------------------------------------------------------------------------
  /**
   * EN: English needs two forms, Russian needs three, and "1 уровней" reads as
   *     obviously machine-made. So a translation value may be an OBJECT of
   *     forms instead of a string:
   *
   *       'order.levels': { one: '{n} уровень', few: '{n} уровня', many: '{n} уровней' }
   *
   *     The form is chosen from `vars.n`. A language with no rule registered
   *     falls back to English's one/many split, and a plain string still works
   *     exactly as before - so this costs nothing to ignore.
   *
   * RU: Английскому нужно две формы, русскому - три, а "1 уровней" сразу выдаёт
   *     машинный перевод. Поэтому значением перевода может быть ОБЪЕКТ форм,
   *     а не строка. Форма выбирается по `vars.n`. Обычная строка работает
   *     по-прежнему.
   */
  var PLURAL_RULES = {
    en: function (n) { return n === 1 ? 'one' : 'many'; },
    ru: function (n) {
      var mod10 = Math.abs(n) % 10, mod100 = Math.abs(n) % 100;
      if (mod10 === 1 && mod100 !== 11) return 'one';
      if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'few';
      return 'many';
    }
  };

  /** Languages may register their own rule; see app/lang/TEMPLATE.js. */
  I18n.setPluralRule = function (code, fn) { PLURAL_RULES[code] = fn; };

  function pickForm(value, vars) {
    if (typeof value === 'string') return value;
    if (!value || typeof value !== 'object') return null;
    var n = vars && vars.n;
    var rule = PLURAL_RULES[current] || PLURAL_RULES.en;
    var form = (typeof n === 'number') ? rule(n) : 'many';
    return value[form] != null ? value[form]
      : (value.many != null ? value.many
      : (value.one != null ? value.one : null));
  }

  /**
   * t('tab.chain')                   -> 'Calculator'
   * t('order.levels', {n: 3})        -> '3 levels'   ({n} placeholders, plurals)
   */
  I18n.t = function (key, vars) {
    var cur = langs[current], en = langs.en;
    var raw = (cur && cur.ui[key]);
    var s = pickForm(raw, vars);
    if (s == null && en) s = pickForm(en.ui[key], vars);
    if (s == null) s = key;
    if (vars) {
      s = s.replace(/\{(\w+)\}/g, function (m, name) {
        return vars[name] === undefined ? m : String(vars[name]);
      });
    }
    return s;
  };

  /** True when the current language actually has this key (used by the audit view). */
  I18n.has = function (key) {
    var cur = langs[current];
    return !!(cur && cur.ui[key] != null);
  };

  /**
   * Translated display name of a data record.
   * Order: entities['good.coal'] in current lang -> in English -> record.name -> id.
   */
  I18n.name = function (record) {
    if (!record) return '';
    var key = record.kind + '.' + record.id;
    var cur = langs[current], en = langs.en;
    var s = (cur && cur.entities[key]);
    if (s == null && en) s = en.entities[key];
    if (s == null) s = record.name;
    if (s == null) s = record.id;
    return s;
  };

  /** Same, but for a description field (optional everywhere). */
  I18n.desc = function (record) {
    if (!record) return '';
    var key = record.kind + '.' + record.id + '.desc';
    var cur = langs[current], en = langs.en;
    var s = (cur && cur.entities[key]);
    if (s == null && en) s = en.entities[key];
    if (s == null) s = record.desc;
    return s || '';
  };

  /**
   * Coverage report for the Settings > Language screen.
   *
   * EN: Interface coverage is measured against English, which is the reference.
   *     CONTENT coverage is measured against the DATA REGISTRY, not against
   *     en.entities - English deliberately leaves that map empty and falls back
   *     to the `name` field, so comparing to it would report 100% for every
   *     language including one that translates nothing. Ask the registry what
   *     records exist, and count how many of them this language names.
   *
   * RU: Полнота интерфейса меряется относительно английского - он эталон.
   *     Полнота СОДЕРЖИМОГО меряется относительно РЕЕСТРА ДАННЫХ, а не
   *     en.entities: у английского эта карта намеренно пуста (он берёт `name`
   *     из данных), и сравнение с ней показывало бы 100% даже для языка, где не
   *     переведено ничего.
   */
  I18n.coverage = function (code) {
    var en = langs.en, l = langs[code];
    if (!en || !l) return { ui: 0, entities: 0, missing: [] };

    var missing = [];

    var uiKeys = Object.keys(en.ui);
    var uiHit = uiKeys.filter(function (k) {
      if (l.ui[k] != null) return true;
      missing.push('ui:' + k); return false;
    }).length;

    // English is complete by definition: it is the fallback.
    if (code === 'en') {
      return { ui: 100, entities: 100, missing: [] };
    }

    var entTotal = 0, entHit = 0;
    (V3.db ? V3.db.KINDS : []).forEach(function (kind) {
      var plural = kind === 'pm' ? 'pms'
        : kind === 'pmGroup' ? 'pmGroups'
        : kind === 'buildingGroup' ? 'buildingGroups'
        : kind + 's';
      if (!V3.db[plural]) return;
      V3.db[plural]().forEach(function (r) {
        if (kind === 'almanac') return;          // prose lives in `ui` instead
        if (r.__user) return;                    // user content needs no translation
        entTotal++;
        if (l.entities[kind + '.' + r.id] != null) entHit++;
        else missing.push('entities:' + kind + '.' + r.id);
      });
    });

    return {
      ui: uiKeys.length ? Math.round(uiHit / uiKeys.length * 100) : 100,
      entities: entTotal ? Math.round(entHit / entTotal * 100) : 100,
      missing: missing
    };
  };

  /** Shorthand used absolutely everywhere in the UI code. */
  V3.t = function (k, v) { return I18n.t(k, v); };

})(window.V3);
