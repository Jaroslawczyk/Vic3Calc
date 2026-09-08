/* ============================================================================
 * app/ui/view_settings.js - Settings, language, and diagnostics.
 * ---------------------------------------------------------------------------
 * EN: The Language section is worth a word: it lists every language file the
 *     app found and shows how complete each translation is. If you are adding
 *     a language, this page tells you exactly which keys you still owe.
 *
 * RU: Про раздел "Язык" стоит сказать отдельно: он перечисляет все найденные
 *     языковые файлы и показывает, насколько полон каждый перевод. Если вы
 *     добавляете язык, эта страница прямо говорит, каких ключей не хватает.
 * ==========================================================================*/
(function (V3) {
  'use strict';

  var h = V3.h;
  var C = V3.ui;
  var View = V3.views.settings = {};

  View.render = function () {
    return h('div.v3-settings', [
      h('div.v3-settings-col', [languagePanel(), appearancePanel(), assumptionsPanel()]),
      h('div.v3-settings-col', [dataSourcePanel(), storagePanel(), diagnosticsPanel(), aboutPanel()])
    ]);
  };

  // ---------------------------------------------------------------------------

  function languagePanel() {
    var cur = V3.i18n.current();
    return C.panel(V3.t('set.language'), [
      h('div.v3-lang-list', V3.i18n.available().map(function (l) {
        var cov = V3.i18n.coverage(l.code);
        return h('button.v3-lang-row' + (l.code === cur ? '.is-active' : ''), {
          type: 'button',
          onclick: function () {
            V3.userdata.set('lang', l.code);
            V3.i18n.set(l.code);
          }
        }, [
          h('span.v3-lang-flag', l.flag || '🌐'),
          h('div.v3-lang-body', [
            h('span.v3-lang-name', l.name),
            h('span.v3-lang-cov', V3.t('set.coverage', { ui: cov.ui, ent: cov.entities })),
            l.credit ? h('span.v3-lang-credit', l.credit) : null
          ]),
          C.bar([
            { value: cov.ui, label: 'UI', color: 'var(--ok)' },
            { value: 100 - cov.ui, label: '—', color: 'var(--rule)' }
          ])
        ]);
      })),
      h('p.v3-hint', V3.t('set.langHint'))
    ]);
  }

  function appearancePanel() {
    var theme = V3.userdata.get('theme', 'parchment');
    return C.panel(V3.t('set.appearance'), [
      h('div.v3-theme-row', ['parchment', 'night'].map(function (t) {
        return h('button.v3-theme' + (theme === t ? '.is-active' : '') + '.is-' + t, {
          type: 'button',
          onclick: function () {
            V3.userdata.set('theme', t);
            document.body.dataset.theme = t;
            V3.app.render();
          }
        }, [h('span.v3-theme-swatch'), h('span', V3.t('set.theme.' + t))]);
      })),
      C.checkbox({
        label: V3.t('set.showFormulas'), checked: V3.userdata.get('showFormulas'),
        onchange: function (v) { V3.userdata.set('showFormulas', v); V3.app.render(); }
      }),
      C.checkbox({
        label: V3.t('set.showConfidence'), checked: V3.userdata.get('showConfidence'),
        onchange: function (v) { V3.userdata.set('showConfidence', v); V3.app.render(); }
      })
    ]);
  }

  function assumptionsPanel() {
    return C.panel(V3.t('set.assumptions'), [
      h('p.v3-hint', V3.t('set.assumptionsHint')),
      C.number({
        label: V3.t('set.wageMultiplier'), value: V3.userdata.get('wageMultiplier'), step: 0.1,
        onchange: function (v) { V3.userdata.set('wageMultiplier', v); }
      }),
      C.number({
        label: V3.t('set.govCostMult'),
        value: Math.round((V3.userdata.get('country.govBuildingCostMult') || 0) * 100), step: 5,
        onchange: function (v) { V3.userdata.set('country.govBuildingCostMult', v / 100); }
      }),
      C.number({
        label: V3.t('set.baseWeeklyConstruction'),
        value: V3.userdata.get('country.baseWeeklyConstruction'), step: 5,
        onchange: function (v) { V3.userdata.set('country.baseWeeklyConstruction', v); }
      }),
      C.button(V3.t('set.resetDefaults'), function () {
        C.confirm(V3.t('set.resetDefaults'), V3.t('set.confirmReset'), function () {
          V3.userdata.resetSettings();
          V3.app.render();
        });
      }, { kind: 'ghost' })
    ]);
  }

  function dataSourcePanel() {
    var m = V3.dataMeta;
    var counts = {};
    ['good', 'building', 'pm', 'pop', 'tech'].forEach(function (k) {
      var p = k === 'pm' ? 'pms' : k + 's';
      counts[k] = V3.db[p]().length;
    });

    var approx = V3.db.pms().filter(function (p) { return p.confidence === V3.APPROX; }).length;

    return C.panel(V3.t('set.dataSource'), [
      h('dl.v3-kv', [
        h('dt', V3.t('set.gameVersion')), h('dd', m.gameVersion),
        h('dt', V3.t('set.dataRevision')), h('dd', m.revision),
        h('dt', V3.t('set.source')), h('dd', h('code', m.source))
      ]),
      h('div.v3-counts', Object.keys(counts).map(function (k) {
        return h('span.v3-chip', [h('strong', counts[k]), ' ', V3.t('kind.' + k)]);
      })),
      h('div.v3-alert.v3-alert-warn', [
        h('span.v3-alert-mark', '△'),
        h('span.v3-alert-text', m.notes[V3.i18n.current()] || m.notes.en)
      ]),
      h('p.v3-hint', V3.t('set.approxCount', { n: approx }))
    ]);
  }

  function storagePanel() {
    var bytes = V3.storage.usedBytes();
    return C.panel(V3.t('set.storage'), [
      h('dl.v3-kv', [
        h('dt', V3.t('set.persistent')),
        h('dd', V3.storage.persistent ? V3.t('set.yes') : V3.t('set.noMemoryOnly')),
        h('dt', V3.t('set.used')),
        h('dd', (bytes / 1024).toFixed(1) + ' KB')
      ]),
      !V3.storage.persistent
        ? h('div.v3-alert.v3-alert-error', [
            h('span.v3-alert-mark', '!'),
            h('span.v3-alert-text', V3.t('set.noStorageWarning'))
          ])
        : null
    ]);
  }

  function diagnosticsPanel() {
    var problems = V3.problems;
    return C.panel(V3.t('set.diagnostics'), [
      problems.length
        ? h('ul.v3-problems', problems.slice(0, 40).map(function (p) {
            return h('li', [h('code', p.where), ' ', p.message]);
          }))
        : h('p.v3-ok', V3.t('set.noProblems')),
      C.button(V3.t('set.selfTest'), runSelfTest, { kind: 'ghost' })
    ]);
  }

  /**
   * A quick integrity pass over the merged data: dangling references, methods
   * that produce nothing, buildings nobody can staff. Mods break exactly here,
   * so it is worth one button.
   */
  function runSelfTest() {
    var issues = [];

    V3.db.buildings().forEach(function (b) {
      (b.pmGroups || []).forEach(function (g) {
        if (!V3.db.has('pmGroup', g)) {
          issues.push({ where: b.id, message: 'missing pmGroup: ' + g });
        }
      });
      (b.produces || []).forEach(function (g) {
        if (!V3.db.has('good', g)) {
          issues.push({ where: b.id, message: 'missing good: ' + g });
        }
      });
      if (b.unlockTech && !V3.db.has('tech', b.unlockTech)) {
        issues.push({ where: b.id, message: 'missing tech: ' + b.unlockTech });
      }
    });

    V3.db.pms().forEach(function (p) {
      if (!V3.db.has('pmGroup', p.group)) {
        issues.push({ where: p.id, message: 'missing pmGroup: ' + p.group });
      }
      Object.keys(p.inputs || {}).concat(Object.keys(p.outputs || {})).forEach(function (g) {
        if (g === '__primary') return;
        if (!V3.db.has('good', g)) issues.push({ where: p.id, message: 'missing good: ' + g });
      });
      Object.keys(p.jobs || {}).forEach(function (j) {
        if (!V3.db.has('pop', j)) issues.push({ where: p.id, message: 'missing pop: ' + j });
      });
      if (p.unlockTech && !V3.db.has('tech', p.unlockTech)) {
        issues.push({ where: p.id, message: 'missing tech: ' + p.unlockTech });
      }
    });

    // Every non-abstract good should be makeable by someone, or the solver can
    // only ever report it as a deficit.
    V3.db.goods().forEach(function (g) {
      if (g.abstract) return;
      if (!V3.db.producersOf(g.id).length) {
        issues.push({ where: g.id, message: 'no building produces this good' });
      }
    });

    C.modal(V3.t('set.selfTest'), issues.length
      ? h('div', [
          h('p', V3.t('set.issuesFound', { n: issues.length })),
          h('ul.v3-problems', issues.slice(0, 200).map(function (i) {
            return h('li', [h('code', i.where), ' — ', i.message]);
          }))
        ])
      : h('p.v3-ok', V3.t('set.allGood')));
  }

  function aboutPanel() {
    return C.panel(V3.t('set.about'), [
      h('p', V3.t('app.subtitle')),
      h('dl.v3-kv', [
        h('dt', V3.t('set.appVersion')), h('dd', V3.APP_VERSION),
        h('dt', V3.t('set.icons')), h('dd', V3.icons.all().length)
      ]),
      h('p.v3-hint', V3.t('set.aboutLicence'))
    ]);
  }

})(window.V3);
