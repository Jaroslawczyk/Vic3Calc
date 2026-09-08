/* ============================================================================
 * app/ui/components.js - The shared vocabulary of the interface.
 * ---------------------------------------------------------------------------
 * EN: Every screen is assembled from these pieces, which is why the app looks
 *     like one thing rather than six.
 *
 *     A DESIGN RULE WORTH KNOWING, because it shaped most of this file:
 *     every quantity is shown as ICON + NUMBER, never as a bare word. A player
 *     who cannot read the interface language can still follow
 *     "[iron icon] 40 -> [steel icon] 45", because those are the same pictures
 *     they see in the game. Text labels are the annotation, not the content.
 *
 * RU: Каждый экран собран из этих кусочков - поэтому программа выглядит как
 *     одно целое, а не как шесть разных.
 *
 *     ПРАВИЛО ОФОРМЛЕНИЯ, определившее почти весь этот файл: любая величина
 *     показывается как ИКОНКА + ЧИСЛО, а не голым словом. Игрок, не знающий
 *     языка интерфейса, всё равно прочитает "[железо] 40 -> [сталь] 45",
 *     потому что это те же картинки, что и в игре. Подписи - это пояснение,
 *     а не содержание.
 * ==========================================================================*/
(function (V3) {
  'use strict';

  var h = V3.h;
  var C = V3.ui = V3.ui || {};

  // ---------------------------------------------------------------------------
  // ICONS
  // ---------------------------------------------------------------------------

  /**
   * Draw a data record's icon. Falls back to a coloured letter tile so a modded
   * record with no picture is still identifiable at a glance.
   * @param record  any data record (good/building/pop/pm/...)
   * @param size    px, default 32
   */
  C.icon = function (record, size, extraClass) {
    size = size || 32;
    var url = record && V3.icons.url(record.icon);
    var label = V3.i18n.name(record);
    var cls = 'v3-icon' + (extraClass ? ' ' + extraClass : '');

    if (url) {
      return h('img.' + cls.replace(/ /g, '.'), {
        src: url, alt: label, title: label, width: size, height: size,
        loading: 'lazy', draggable: 'false'
      });
    }
    return h('span.' + cls.replace(/ /g, '.') + '.v3-icon-fallback', {
      title: label,
      style: {
        width: size + 'px', height: size + 'px',
        lineHeight: size + 'px', fontSize: Math.round(size * 0.5) + 'px',
        background: V3.icons.fallbackColor(record && record.id)
      }
    }, V3.icons.fallbackLetter(label));
  };

  /** Icon + amount, the fundamental unit of this interface. */
  C.goodAmount = function (goodId, amount, opts) {
    opts = opts || {};
    var g = V3.db.safe('good', goodId);
    var cls = 'v3-qty';
    if (opts.negative || amount < 0) cls += ' is-out';
    if (opts.positive) cls += ' is-in';
    return h('span.' + cls.replace(/ /g, '.'), { title: V3.i18n.name(g) }, [
      C.icon(g, opts.size || 22),
      h('span.v3-qty-n', V3.num.fmt(Math.abs(amount), opts.dec === undefined ? 1 : opts.dec)),
      opts.showName ? h('span.v3-qty-label', V3.i18n.name(g)) : null
    ]);
  };

  /** Icon + count for a profession. */
  C.popAmount = function (popId, count, opts) {
    opts = opts || {};
    var p = V3.db.safe('pop', popId);
    return h('span.v3-qty.v3-qty-pop', {
      title: V3.i18n.name(p) + (p.qualification ? ' - ' + V3.t('pop.qual.' + p.qualification) : '')
    }, [
      C.icon(p, opts.size || 22),
      h('span.v3-qty-n', V3.num.pop(count)),
      opts.showName ? h('span.v3-qty-label', V3.i18n.name(p)) : null
    ]);
  };

  // ---------------------------------------------------------------------------
  // BADGES
  // ---------------------------------------------------------------------------

  /**
   * The "?" that marks a number we are not certain about. This is deliberate:
   * silence about uncertainty is what makes calculators untrustworthy.
   */
  C.confidence = function (record) {
    if (!V3.userdata.get('showConfidence', true)) return null;
    if (!record || record.confidence !== V3.APPROX) return null;
    return h('span.v3-badge.v3-badge-approx', {
      title: V3.t('badge.approx.tip')
    }, '?');
  };

  /** Marks content that came from the user's own data layer or a loaded pack. */
  C.userBadge = function (record) {
    if (!record || !record.__user) return null;
    return h('span.v3-badge.v3-badge-user', {
      title: V3.t(record.__isNew ? 'badge.custom.tip' : 'badge.edited.tip')
    }, record.__isNew ? '+' : '✎');
  };

  C.lockBadge = function (techId) {
    if (!techId) return null;
    var t = V3.db.safe('tech', techId);
    return h('span.v3-badge.v3-badge-lock', {
      title: V3.t('badge.locked.tip', { tech: V3.i18n.name(t) })
    }, '🔒');
  };

  C.pill = function (text, kind, title) {
    return h('span.v3-pill' + (kind ? '.v3-pill-' + kind : ''), { title: title || null }, text);
  };

  // ---------------------------------------------------------------------------
  // STRUCTURE
  // ---------------------------------------------------------------------------

  /** A framed panel with an ornamented header - the app's basic container. */
  C.panel = function (title, body, opts) {
    opts = opts || {};
    return h('section.v3-panel' + (opts.className ? '.' + opts.className.replace(/ /g, '.') : ''), [
      title ? h('header.v3-panel-head', [
        opts.icon ? C.icon(opts.icon, 24) : null,
        h('h2.v3-panel-title', title),
        opts.actions ? h('div.v3-panel-actions', opts.actions) : null
      ]) : null,
      h('div.v3-panel-body', body)
    ]);
  };

  /** Section heading with the double-rule the whole app uses. */
  C.rule = function (text) {
    return h('div.v3-rule', [h('span', text)]);
  };

  C.empty = function (text, icon) {
    return h('div.v3-empty', [
      icon ? h('div.v3-empty-icon', icon) : null,
      h('p', text)
    ]);
  };

  // ---------------------------------------------------------------------------
  // INPUTS
  // ---------------------------------------------------------------------------

  C.number = function (opts) {
    var input = h('input.v3-input.v3-input-num', {
      type: 'number',
      value: opts.value == null ? '' : opts.value,
      min: opts.min == null ? 0 : opts.min,
      max: opts.max == null ? null : opts.max,
      step: opts.step || 1,
      placeholder: opts.placeholder || '',
      oninput: function () {
        if (opts.oninput) opts.oninput(V3.util.parseNum(input.value, 0), input);
      },
      onchange: function () {
        if (opts.onchange) opts.onchange(V3.util.parseNum(input.value, 0), input);
      }
    });
    if (!opts.label) return input;
    return h('label.v3-field', [h('span.v3-field-label', opts.label), input]);
  };

  C.text = function (opts) {
    var input = h('input.v3-input', {
      type: 'text',
      value: opts.value == null ? '' : opts.value,
      placeholder: opts.placeholder || '',
      oninput: function () { if (opts.oninput) opts.oninput(input.value, input); },
      onchange: function () { if (opts.onchange) opts.onchange(input.value, input); }
    });
    if (!opts.label) return input;
    return h('label.v3-field', [h('span.v3-field-label', opts.label), input]);
  };

  /**
   * Select built from data records, so the option text is always translated
   * and always matches what the icon next to it shows.
   */
  C.select = function (opts) {
    var sel = h('select.v3-select', {
      onchange: function () { if (opts.onchange) opts.onchange(sel.value, sel); }
    }, (opts.options || []).map(function (o) {
      return h('option', {
        value: o.value,
        selected: String(o.value) === String(opts.value),
        disabled: !!o.disabled
      }, o.label + (o.suffix || ''));
    }));
    if (!opts.label) return sel;
    return h('label.v3-field', [h('span.v3-field-label', opts.label), sel]);
  };

  C.checkbox = function (opts) {
    var box = h('input', {
      type: 'checkbox', checked: !!opts.checked,
      onchange: function () { if (opts.onchange) opts.onchange(box.checked, box); }
    });
    return h('label.v3-check', [box, h('span', opts.label)]);
  };

  C.button = function (label, onclick, opts) {
    opts = opts || {};
    return h('button.v3-btn' + (opts.kind ? '.v3-btn-' + opts.kind : ''), {
      onclick: onclick, title: opts.title || null, disabled: !!opts.disabled,
      type: 'button'
    }, [opts.icon ? h('span.v3-btn-icon', opts.icon) : null, label]);
  };

  // ---------------------------------------------------------------------------
  // FEEDBACK
  // ---------------------------------------------------------------------------

  /**
   * Horizontal proportion bar. Used for workforce composition, goods balance,
   * strata split - anywhere a ratio reads faster than two numbers.
   */
  C.bar = function (segments, opts) {
    opts = opts || {};
    var total = V3.util.sum(segments, function (s) { return Math.max(0, s.value); }) || 1;
    return h('div.v3-bar' + (opts.tall ? '.is-tall' : ''), segments.map(function (s) {
      var pct = Math.max(0, s.value) / total * 100;
      if (pct <= 0) return null;
      return h('span.v3-bar-seg', {
        style: { width: pct.toFixed(3) + '%', background: s.color },
        title: s.label + ': ' + V3.num.fmt(s.value) + ' (' + pct.toFixed(1) + '%)'
      });
    }));
  };

  /** Warning / error strip. `code` keys into the translations. */
  C.warning = function (w) {
    var level = w.level === 'error' ? 'error' : 'warn';
    return h('div.v3-alert.v3-alert-' + level, [
      h('span.v3-alert-mark', level === 'error' ? '!' : '△'),
      h('span.v3-alert-text', C.warningText(w))
    ]);
  };

  C.warningText = function (w) {
    var vars = {};
    if (w.good) vars.good = V3.i18n.name(V3.db.safe('good', w.good));
    if (w.pop) vars.pop = V3.i18n.name(V3.db.safe('pop', w.pop));
    if (w.buildingId) vars.building = V3.i18n.name(V3.db.safe('building', w.buildingId));
    if (w.pm) vars.pm = V3.i18n.name(V3.db.safe('pm', w.pm));
    if (w.tech) vars.tech = V3.i18n.name(V3.db.safe('tech', w.tech));
    if (w.amount != null) vars.amount = V3.num.fmt(w.amount, 1);
    if (w.needed != null) vars.needed = V3.num.pop(w.needed);
    if (w.available != null) vars.available = V3.num.pop(w.available);
    return V3.t('warn.' + w.code, vars);
  };

  /**
   * The strip that says how a number was computed. Shown under result panels
   * when Settings -> "Show formulas" is on.
   */
  C.formula = function (formulaId) {
    if (!V3.userdata.get('showFormulas', true)) return null;
    var f = V3.formulas.get(formulaId);
    if (!f) return null;
    return h('div.v3-formula', [
      h('span.v3-formula-mark', 'ƒ'),
      h('code.v3-formula-expr', f.expr),
      h('span.v3-formula-note', V3.formulas.explain(formulaId))
    ]);
  };

  // ---------------------------------------------------------------------------
  // MODAL
  // ---------------------------------------------------------------------------

  var openModal = null;

  C.modal = function (title, body, opts) {
    opts = opts || {};
    C.closeModal();

    var box = h('div.v3-modal', [
      h('header.v3-modal-head', [
        h('h2', title),
        h('button.v3-modal-x', { onclick: C.closeModal, type: 'button', title: V3.t('action.close') }, '×')
      ]),
      h('div.v3-modal-body', body),
      opts.footer ? h('footer.v3-modal-foot', opts.footer) : null
    ]);

    var back = h('div.v3-modal-back', {
      onclick: function (e) { if (e.target === back && opts.dismissable !== false) C.closeModal(); }
    }, box);

    document.body.appendChild(back);
    openModal = back;

    function esc(e) { if (e.key === 'Escape') C.closeModal(); }
    document.addEventListener('keydown', esc);
    back.__esc = esc;

    return { el: box, close: C.closeModal };
  };

  C.closeModal = function () {
    if (!openModal) return;
    if (openModal.__esc) document.removeEventListener('keydown', openModal.__esc);
    if (openModal.parentNode) openModal.parentNode.removeChild(openModal);
    openModal = null;
  };

  C.confirm = function (title, message, onYes) {
    C.modal(title, h('p', message), {
      footer: [
        C.button(V3.t('action.cancel'), C.closeModal),
        C.button(V3.t('action.confirm'), function () { C.closeModal(); onYes(); }, { kind: 'danger' })
      ]
    });
  };

  // ---------------------------------------------------------------------------
  // TOAST
  // ---------------------------------------------------------------------------

  C.toast = function (message, kind) {
    var host = h.$('#v3-toasts') || (function () {
      var t = h('div#v3-toasts');
      document.body.appendChild(t);
      return t;
    })();
    var el = h('div.v3-toast' + (kind ? '.v3-toast-' + kind : ''), message);
    host.appendChild(el);
    setTimeout(function () { el.classList.add('is-out'); }, 2600);
    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 3200);
  };

  // ---------------------------------------------------------------------------
  // ICON PICKER - used by the Data editor so a mod can pick any shipped icon
  // or supply its own image.
  // ---------------------------------------------------------------------------

  C.iconPicker = function (current, onPick) {
    var chosen = current;
    var grid = h('div.v3-icon-grid');
    var search = C.text({
      placeholder: V3.t('data.searchIcons'),
      oninput: function (v) { render(v); }
    });

    function render(filter) {
      var all = V3.icons.all();
      if (filter) {
        var f = filter.toLowerCase();
        all = all.filter(function (i) { return i.key.toLowerCase().indexOf(f) >= 0; });
      }
      h.fill(grid, all.slice(0, 400).map(function (i) {
        return h('button.v3-icon-cell' + (i.key === chosen ? '.is-active' : ''), {
          type: 'button', title: i.key,
          onclick: function () { chosen = i.key; onPick(i.key); C.closeModal(); }
        }, h('img', { src: i.path, alt: i.key, width: 34, height: 34, loading: 'lazy' }));
      }));
    }
    render('');

    C.modal(V3.t('data.pickIcon'), [
      h('div.v3-icon-picker-top', [
        search,
        C.button(V3.t('data.uploadIcon'), function () {
          V3.storage.pickImage(function (dataUrl) {
            onPick(dataUrl);
            C.closeModal();
          }, function (err) {
            C.toast(V3.t(err && err.message === 'IMAGE_TOO_BIG'
              ? 'data.iconTooBig' : 'data.iconFailed'), 'error');
          });
        }, { kind: 'ghost' })
      ]),
      grid
    ]);
  };

})(window.V3);
