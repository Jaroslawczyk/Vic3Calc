/* ============================================================================
 * app/core/storage.js - Persistence primitives.
 * ---------------------------------------------------------------------------
 * EN: Thin, forgiving wrapper over localStorage plus browser file download /
 *     upload. Everything is namespaced under "vic3calc:" so the app never
 *     collides with anything else stored for the file:// origin.
 *
 *     If localStorage is unavailable (private window, locked-down policy) we
 *     silently fall back to an in-memory store: the app keeps working for the
 *     session and the user can still export their work to a file.
 *
 * RU: Тонкая и терпимая к ошибкам обёртка над localStorage плюс скачивание и
 *     загрузка файлов. Всё хранится с префиксом "vic3calc:".
 *
 *     Если localStorage недоступен (приватное окно, политика безопасности),
 *     мы молча переходим на хранение в памяти: программа продолжает работать
 *     в рамках сеанса, а результат всегда можно выгрузить в файл.
 * ==========================================================================*/
(function (V3) {
  'use strict';

  var PREFIX = 'vic3calc:';
  var memory = {};
  var usable = (function () {
    try {
      var k = PREFIX + '__probe';
      window.localStorage.setItem(k, '1');
      window.localStorage.removeItem(k);
      return true;
    } catch (e) {
      return false;
    }
  })();

  var S = V3.storage = {};

  S.persistent = usable;

  S.get = function (key, fallback) {
    var raw;
    try {
      raw = usable ? window.localStorage.getItem(PREFIX + key) : memory[key];
    } catch (e) { raw = memory[key]; }
    if (raw == null) return fallback;
    try { return JSON.parse(raw); }
    catch (e) { V3.warn('storage', 'corrupt value for ' + key); return fallback; }
  };

  S.set = function (key, value) {
    var raw = JSON.stringify(value);
    memory[key] = raw;
    if (!usable) return true;
    try {
      window.localStorage.setItem(PREFIX + key, raw);
      return true;
    } catch (e) {
      // Most likely the 5 MB quota, usually from pasted base64 icons.
      V3.warn('storage', 'could not save "' + key + '" - quota exceeded?', e);
      V3.bus.emit('storage:full', { key: key });
      return false;
    }
  };

  S.remove = function (key) {
    delete memory[key];
    if (usable) { try { window.localStorage.removeItem(PREFIX + key); } catch (e) {} }
  };

  /** Approximate bytes used, for the Settings > Storage readout. */
  S.usedBytes = function () {
    var total = 0;
    if (!usable) {
      Object.keys(memory).forEach(function (k) { total += memory[k].length; });
      return total;
    }
    try {
      for (var i = 0; i < window.localStorage.length; i++) {
        var k = window.localStorage.key(i);
        if (k && k.indexOf(PREFIX) === 0) total += (window.localStorage.getItem(k) || '').length + k.length;
      }
    } catch (e) {}
    return total * 2; // UTF-16 code units
  };

  // ---------------------------------------------------------------------------
  // File download / upload. This is how a pack travels between two people.
  // ---------------------------------------------------------------------------

  /** Trigger a "Save as..." for a JSON object. */
  S.downloadJSON = function (filename, obj) {
    var text = JSON.stringify(obj, null, 2);
    S.downloadText(filename, text, 'application/json');
  };

  S.downloadText = function (filename, text, mime) {
    var blob = new Blob([text], { type: (mime || 'text/plain') + ';charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 0);
  };

  /**
   * Ask the user for a file and hand back its parsed contents.
   *   V3.storage.pickJSON(function (obj, file) { ... }, function (err) { ... });
   */
  S.pickJSON = function (onOk, onErr, accept) {
    var input = document.createElement('input');
    input.type = 'file';
    input.accept = accept || '.json,application/json';
    input.style.display = 'none';
    input.addEventListener('change', function () {
      var file = input.files && input.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function () {
        try { onOk(JSON.parse(String(reader.result)), file); }
        catch (e) { (onErr || function () {})(e); }
        document.body.removeChild(input);
      };
      reader.onerror = function () {
        (onErr || function () {})(reader.error);
        document.body.removeChild(input);
      };
      reader.readAsText(file, 'utf-8');
    });
    document.body.appendChild(input);
    input.click();
  };

  /** Read a picked image file as a data URL (used for custom mod icons). */
  S.pickImage = function (onOk, onErr) {
    var input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/png,image/jpeg,image/gif,image/webp,image/svg+xml';
    input.style.display = 'none';
    input.addEventListener('change', function () {
      var file = input.files && input.files[0];
      if (!file) return;
      if (file.size > 512 * 1024) {
        (onErr || function () {})(new Error('IMAGE_TOO_BIG'));
        document.body.removeChild(input);
        return;
      }
      var reader = new FileReader();
      reader.onload = function () { onOk(String(reader.result), file); document.body.removeChild(input); };
      reader.onerror = function () { (onErr || function () {})(reader.error); document.body.removeChild(input); };
      reader.readAsDataURL(file);
    });
    document.body.appendChild(input);
    input.click();
  };

})(window.V3);
