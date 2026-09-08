/* ============================================================================
 * app/core/num.js - Number formatting.
 * ---------------------------------------------------------------------------
 * EN: One place for every number that reaches the screen, so the whole app is
 *     consistent and so switching language switches thousands separators too.
 * RU: Единственное место форматирования чисел - поэтому всё приложение
 *     выглядит одинаково, а смена языка меняет и разделители разрядов.
 * ==========================================================================*/
(function (V3) {
  'use strict';

  var N = V3.num = {};

  function locale() {
    return V3.i18n.current() === 'ru' ? 'ru-RU' : 'en-GB';
  }

  /** 1234.5 -> "1 234.5"  (max 2 decimals, trailing zeros trimmed) */
  N.fmt = function (n, maxDec) {
    if (n == null || !isFinite(n)) return '—';
    var d = maxDec === undefined ? 2 : maxDec;
    return Number(n).toLocaleString(locale(), {
      minimumFractionDigits: 0,
      maximumFractionDigits: d
    });
  };

  /** Whole numbers only: 4523.7 -> "4 524" */
  N.int = function (n) {
    if (n == null || !isFinite(n)) return '—';
    return Math.round(n).toLocaleString(locale());
  };

  /** Building counts: we always round UP, because 2.1 factories means build 3. */
  N.buildings = function (n) {
    if (n == null || !isFinite(n)) return '—';
    return String(Math.ceil(n - 1e-9));
  };

  /** Money, in the game's £ (pounds). */
  N.money = function (n) {
    if (n == null || !isFinite(n)) return '—';
    var abs = Math.abs(n);
    var s;
    if (abs >= 1e6) s = N.fmt(n / 1e6, 2) + 'M';
    else if (abs >= 1e4) s = N.fmt(n / 1e3, 1) + 'K';
    else s = N.fmt(n, abs < 10 ? 2 : 0);
    return '£' + s;
  };

  /** Signed money, for profit lines: "+£1.2K" / "−£340" */
  N.moneySigned = function (n) {
    if (n == null || !isFinite(n)) return '—';
    if (n < 0) return '−' + N.money(-n);
    return '+' + N.money(n);
  };

  /** 0.155 -> "+15.5%" */
  N.pct = function (frac, signed) {
    if (frac == null || !isFinite(frac)) return '—';
    var v = frac * 100;
    var s = N.fmt(v, 1) + '%';
    if (signed && v > 0) s = '+' + s;
    if (v < 0) s = s.replace('-', '−');
    return s;
  };

  /** 152 (weeks) -> "2 y 12 w" using translated units. */
  N.weeks = function (w) {
    if (w == null || !isFinite(w)) return '—';
    if (w === Infinity) return '∞';
    var total = Math.ceil(w);
    var years = Math.floor(total / 52);
    var rem = total % 52;
    if (years <= 0) return total + ' ' + V3.t('unit.weeksShort');
    if (rem === 0) return years + ' ' + V3.t('unit.yearsShort');
    return years + ' ' + V3.t('unit.yearsShort') + ' ' + rem + ' ' + V3.t('unit.weeksShort');
  };

  /** Population: 45230 -> "45.2K", 1230000 -> "1.23M" */
  N.pop = function (n) {
    if (n == null || !isFinite(n)) return '—';
    var abs = Math.abs(n);
    if (abs >= 1e6) return N.fmt(n / 1e6, 2) + 'M';
    if (abs >= 1e4) return N.fmt(n / 1e3, 1) + 'K';
    return N.int(n);
  };

  /** Rounds to `step` decimals, avoiding 0.1+0.2 artefacts in stored data. */
  N.round = function (n, step) {
    var p = Math.pow(10, step === undefined ? 4 : step);
    return Math.round(n * p) / p;
  };

})(window.V3);
