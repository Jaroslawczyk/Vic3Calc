/* ============================================================================
 * app/core/icons.js - Resolving a data record to a picture.
 * ---------------------------------------------------------------------------
 * EN: A record's `icon` field can be one of three things:
 *
 *       "Goods_coal"                 a key from img/icons (see icon_manifest.js)
 *       "data:image/png;base64,..."  an image you pasted in the Data editor
 *       null / missing               we fall back to a generated letter tile
 *
 *     Mods therefore need no file copying: the user picks a shipped icon from
 *     the picker, or drops their own PNG in and it is stored (as a data URL)
 *     inside the same .v3pack.json that carries the rest of their content.
 *
 * RU: Поле `icon` у записи может быть трёх видов:
 *
 *       "Goods_coal"                 ключ из img/icons (см. icon_manifest.js)
 *       "data:image/png;base64,..."  картинка, вставленная в редакторе данных
 *       null / нет поля              рисуем плитку с буквой
 *
 *     Поэтому для мода не нужно копировать файлы: пользователь либо выбирает
 *     готовую иконку, либо перетаскивает свою PNG - она сохранится (как data
 *     URL) в том же .v3pack.json вместе с остальным содержимым.
 * ==========================================================================*/
(function (V3) {
  'use strict';

  var Icons = V3.icons = {};

  var byKey = null;      // "Goods_coal" -> "goods/png/120px-Goods_coal.png"
  var byCat = null;      // "goods" -> [ {key, path} ]

  function index() {
    if (byKey) return;
    byKey = {};
    byCat = {};
    var man = V3.iconManifest || { base: '', files: [] };
    man.files.forEach(function (row) {
      var cat = row[0], rel = row[1], key = row[2];
      // First one wins: duplicates like "foo (1).png" never shadow "foo.png".
      if (!byKey[key]) byKey[key] = rel;
      (byCat[cat] || (byCat[cat] = [])).push({ key: key, path: man.base + rel, cat: cat });
    });
  }

  /** Categories available in the picker, e.g. ['goods','buildings','population',...] */
  Icons.categories = function () { index(); return Object.keys(byCat); };

  /** All icons in a category (for the picker grid). */
  Icons.inCategory = function (cat) { index(); return (byCat[cat] || []).slice(); };

  /** Every shipped icon, for search. */
  Icons.all = function () {
    index();
    return Object.keys(byCat).reduce(function (acc, c) { return acc.concat(byCat[c]); }, []);
  };

  /**
   * Resolve to a URL, or null when there is no image.
   * `icon` is the raw field value from a data record.
   */
  Icons.url = function (icon) {
    if (!icon) return null;
    if (typeof icon !== 'string') return null;
    if (icon.indexOf('data:') === 0) return icon;                 // user-pasted image
    if (icon.indexOf('../') === 0 || icon.indexOf('http') === 0) return icon; // explicit path
    index();
    var rel = byKey[icon];
    return rel ? (V3.iconManifest.base + rel) : null;
  };

  /** True if the key points at something we can actually draw. */
  Icons.exists = function (icon) { return !!Icons.url(icon); };

  /**
   * Deterministic pastel colour for the fallback letter tile, so the same
   * record always gets the same colour and stays recognisable in a list.
   */
  Icons.fallbackColor = function (seed) {
    var h = 0, s = String(seed || '');
    for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360;
    return 'hsl(' + h + ', 28%, 34%)';
  };

  Icons.fallbackLetter = function (label) {
    return String(label || '?').trim().charAt(0).toUpperCase() || '?';
  };

})(window.V3);
