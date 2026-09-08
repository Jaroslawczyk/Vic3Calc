/* ============================================================================
 * app/ui/view_data.js - The Data editor. This is where mods happen.
 * ---------------------------------------------------------------------------
 * EN: Everything the calculator knows can be changed here, and nothing you do
 *     here touches the files that shipped with the app. Your edits live in a
 *     separate layer that you can export as one .v3pack.json and hand to
 *     someone else.
 *
 *     WHAT YOU CAN DO
 *       - add a good that does not exist in vanilla (a mod's new resource)
 *       - add a building, say what it employs and what it makes
 *       - add or edit a production method: inputs, outputs, jobs, pollution
 *       - correct any number that this app got wrong
 *       - give any of it an icon: pick one of the 400+ shipped game icons, or
 *         drop in your own PNG
 *       - revert a single edit, or wipe everything back to vanilla
 *
 *     A record you edited shows a ✎ badge everywhere in the app; a record you
 *     created shows a +. That way you always know what is vanilla and what is
 *     yours - which matters when someone else's pack is loaded on top.
 *
 * RU: Здесь можно изменить всё, что знает калькулятор, и ничто из этого не
 *     трогает файлы, поставляемые с программой. Ваши правки живут отдельным
 *     слоем, который выгружается одним файлом .v3pack.json и передаётся другому.
 *
 *     ЧТО МОЖНО
 *       - добавить товар, которого нет в ванили (новый ресурс из мода)
 *       - добавить здание: кого нанимает и что производит
 *       - добавить или изменить метод производства: вход, выход, рабочие места
 *       - исправить любое число, в котором программа ошиблась
 *       - назначить иконку: выбрать из 400+ игровых или загрузить свою PNG
 *       - откатить одну правку или сбросить всё до ванили
 *
 *     Изменённая запись помечается ✎ по всему приложению, созданная - знаком +.
 *     Так всегда видно, где ваниль, а где ваше.
 * ==========================================================================*/
(function (V3) {
  'use strict';

  var h = V3.h;
  var C = V3.ui;
  var View = V3.views.data = {};

  var kind = 'good';
  var search = '';

  // ---------------------------------------------------------------------------
  // FIELD SCHEMAS - one place that says what a record of each kind looks like.
  // Adding a field to a kind = one line here; the form builds itself.
  // ---------------------------------------------------------------------------
  var SCHEMA = {
    good: [
      { f: 'name', type: 'text', req: true },
      { f: 'category', type: 'select', opts: ['staple', 'industrial', 'luxury', 'military'] },
      { f: 'basePrice', type: 'number', step: 1 },
      { f: 'icon', type: 'icon' },
      { f: 'confidence', type: 'select', opts: ['verified', 'approx'] }
    ],
    building: [
      { f: 'name', type: 'text', req: true },
      { f: 'group', type: 'ref', refKind: 'buildingGroup' },
      { f: 'constructionCost', type: 'number', step: 10 },
      { f: 'produces', type: 'refList', refKind: 'good' },
      { f: 'pmGroups', type: 'refList', refKind: 'pmGroup' },
      { f: 'infraUsage', type: 'number', step: 1 },
      { f: 'providesInfra', type: 'number', step: 1 },
      { f: 'unlockTech', type: 'ref', refKind: 'tech', allowEmpty: true },
      { f: 'icon', type: 'icon' },
      { f: 'confidence', type: 'select', opts: ['verified', 'approx'] }
    ],
    pm: [
      { f: 'name', type: 'text', req: true },
      { f: 'group', type: 'ref', refKind: 'pmGroup' },
      { f: 'inputs', type: 'goodMap' },
      { f: 'outputs', type: 'goodMap' },
      { f: 'jobs', type: 'popMap' },
      { f: 'pollution', type: 'number', step: 1 },
      { f: 'infra', type: 'number', step: 1 },
      { f: 'unlockTech', type: 'ref', refKind: 'tech', allowEmpty: true },
      { f: 'icon', type: 'icon' },
      { f: 'confidence', type: 'select', opts: ['verified', 'approx'] }
    ],
    pmGroup: [
      { f: 'name', type: 'text', req: true },
      { f: 'rowKind', type: 'select', opts: ['base', 'secondary', 'automation', 'ownership', 'mobilization'] },
      { f: 'order', type: 'number', step: 1 }
    ],
    buildingGroup: [
      { f: 'name', type: 'text', req: true },
      { f: 'color', type: 'text' },
      { f: 'infraUsage', type: 'number', step: 1 },
      { f: 'icon', type: 'icon' }
    ],
    pop: [
      { f: 'name', type: 'text', req: true },
      { f: 'strata', type: 'select', opts: ['poor', 'middle', 'upper'] },
      { f: 'wageWeight', type: 'number', step: 0.5 },
      { f: 'qualification', type: 'select', opts: ['none', 'basic', 'educated'] },
      { f: 'icon', type: 'icon' }
    ],
    tech: [
      { f: 'name', type: 'text', req: true },
      { f: 'era', type: 'number', step: 1 },
      { f: 'category', type: 'select', opts: ['production', 'military', 'society'] }
    ]
  };

  var KINDS = Object.keys(SCHEMA);

  // ---------------------------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------------------------

  View.render = function () {
    return h('div.v3-data', [
      h('aside.v3-col-left', [packPanel(), kindPanel()]),
      h('div.v3-data-main', [
        h('div.v3-browse-bar', [
          C.text({
            placeholder: V3.t('browse.search'), value: search,
            oninput: function (v) { search = v; refreshList(); }
          }),
          C.button(V3.t('data.addNew', { kind: V3.t('kind.' + kind) }), function () {
            openEditor(kind, null);
          }, { kind: 'primary' })
        ]),
        h('div#v3-data-list.v3-data-list', recordList())
      ])
    ]);
  };

  /** Called from other views: "edit this record". */
  View.editRecord = function (k, id) {
    kind = k;
    V3.app.go('data');
    openEditor(k, id);
  };

  function refreshList() {
    var host = h.$('#v3-data-list');
    if (host) h.fill(host, recordList());
  }

  function kindPanel() {
    return C.panel(V3.t('data.kinds'), h('div.v3-kind-list', KINDS.map(function (k) {
      var count = V3.db[plural(k)]().length;
      return h('button.v3-kind' + (kind === k ? '.is-active' : ''), {
        type: 'button',
        onclick: function () { kind = k; search = ''; V3.app.render(); }
      }, [h('span', V3.t('kind.' + k)), h('span.v3-kind-n', count)]);
    })));
  }

  function plural(k) {
    if (k === 'pm') return 'pms';
    if (k === 'pmGroup') return 'pmGroups';
    if (k === 'buildingGroup') return 'buildingGroups';
    return k + 's';
  }

  function recordList() {
    var list = V3.db[plural(kind)]();
    if (search) {
      var s = search.toLowerCase();
      list = list.filter(function (r) {
        return (V3.i18n.name(r) + ' ' + r.id).toLowerCase().indexOf(s) >= 0;
      });
    }
    if (!list.length) return C.empty(V3.t('browse.nothing'));

    return h('table.v3-data-table', [
      h('thead', h('tr', [
        h('th', ''), h('th', V3.t('data.name')), h('th', 'id'),
        h('th', V3.t('data.summary')), h('th', '')
      ])),
      h('tbody', list.map(function (r) {
        return h('tr' + (r.__user ? '.is-user' : ''), [
          h('td', C.icon(r, 26)),
          h('td', [V3.i18n.name(r), C.confidence(r), C.userBadge(r)]),
          h('td.v3-mono', r.id),
          h('td.v3-data-summary', summarise(r)),
          h('td.v3-data-actions', [
            C.button(V3.t('action.edit'), function () { openEditor(kind, r.id); }, { kind: 'tiny' }),
            V3.db.isUserModified(kind, r.id)
              ? C.button(V3.t('action.revert'), function () {
                  V3.db.clearUserPatch(kind, r.id); refreshList();
                  C.toast(V3.t('data.reverted'));
                }, { kind: 'tiny' })
              : null,
            C.button('×', function () {
              C.confirm(V3.t('action.delete'), V3.t('data.confirmDelete', {
                name: V3.i18n.name(r)
              }), function () {
                V3.db.deleteRecord(kind, r.id); refreshList();
              });
            }, { kind: 'tiny' })
          ])
        ]);
      }))
    ]);
  }

  function summarise(r) {
    if (r.kind === 'good') return V3.num.money(r.basePrice) + ' · ' + V3.t('goods.cat.' + r.category);
    if (r.kind === 'building') {
      return [
        V3.num.int(r.constructionCost) + ' ⚒',
        h('span.v3-qty-row', (r.produces || []).slice(0, 4).map(function (g) {
          return C.icon(V3.db.safe('good', g), 18);
        }))
      ];
    }
    if (r.kind === 'pm') {
      return h('span.v3-qty-row', [
        Object.keys(r.inputs || {}).map(function (g) { return C.goodAmount(g, r.inputs[g], { size: 16 }); }),
        Object.keys(r.outputs || {}).length ? h('span.v3-arrow', '→') : null,
        Object.keys(r.outputs || {}).map(function (g) { return C.goodAmount(g, r.outputs[g], { size: 16, positive: true }); })
      ]);
    }
    if (r.kind === 'pop') return V3.t('strata.' + r.strata) + ' · ×' + r.wageWeight;
    if (r.kind === 'tech') return V3.t('era.' + r.era);
    return '';
  }

  // ---------------------------------------------------------------------------
  // THE EDITOR
  // ---------------------------------------------------------------------------

  function openEditor(k, id) {
    var isNew = !id;
    var original = id ? V3.db[k](id) : null;
    var draft = original ? V3.util.deepClone(original) : blankRecord(k);
    var recordId = id || '';

    var idField = C.text({
      label: 'id',
      value: recordId,
      placeholder: V3.t('data.idPlaceholder'),
      onchange: function (v) { recordId = V3.util.slug(v); }
    });

    var fields = SCHEMA[k].map(function (spec) { return field(k, spec, draft); });

    C.modal(
      isNew ? V3.t('data.addNew', { kind: V3.t('kind.' + k) })
            : V3.t('data.editing', { name: V3.i18n.name(original) }),
      h('div.v3-editor', [
        isNew ? idField : h('div.v3-field'
          , [h('span.v3-field-label', 'id'), h('code.v3-mono', recordId)]),
        !isNew && V3.db.isShipped(k, recordId)
          ? h('p.v3-hint', V3.t('data.editingShipped')) : null,
        fields
      ]),
      {
        footer: [
          C.button(V3.t('action.cancel'), C.closeModal),
          C.button(V3.t('action.save'), function () {
            if (!recordId) { C.toast(V3.t('data.needId'), 'error'); return; }
            if (isNew && V3.db.has(k, recordId)) {
              C.toast(V3.t('data.idTaken'), 'error'); return;
            }
            // Store only what differs from the shipped record, so a future
            // update to app/data/ still reaches the fields you did not touch.
            var patch = original ? diff(original, draft) : draft;
            V3.db.setUserPatch(k, recordId, patch);
            C.closeModal();
            V3.app.render();
            C.toast(V3.t('data.saved'));
          }, { kind: 'primary' })
        ]
      }
    );
  }

  function blankRecord(k) {
    var r = { name: '', confidence: 'approx' };
    if (k === 'good') { r.category = 'industrial'; r.basePrice = 40; }
    if (k === 'building') { r.group = 'manufacturing'; r.constructionCost = 300; r.produces = []; r.pmGroups = []; }
    if (k === 'pm') { r.inputs = {}; r.outputs = {}; r.jobs = {}; r.pollution = 0; }
    if (k === 'pop') { r.strata = 'poor'; r.wageWeight = 1; r.qualification = 'none'; }
    if (k === 'tech') { r.era = 1; r.category = 'production'; }
    if (k === 'pmGroup') { r.kind = 'base'; r.order = 1; }
    return r;
  }

  /** Keep only keys whose value actually changed. */
  function diff(base, next) {
    var out = {};
    Object.keys(next).forEach(function (kk) {
      if (kk.indexOf('__') === 0 || kk === 'kind' || kk === 'id') return;
      if (JSON.stringify(base[kk]) !== JSON.stringify(next[kk])) out[kk] = next[kk];
    });
    return out;
  }

  // ---------------------------------------------------------------------------
  // FIELD RENDERERS
  // ---------------------------------------------------------------------------

  function field(k, spec, draft) {
    var label = V3.t('field.' + spec.f);

    switch (spec.type) {
      case 'text':
        return C.text({
          label: label, value: draft[spec.f] || '',
          onchange: function (v) { draft[spec.f] = v; }
        });

      case 'number':
        return C.number({
          label: label, value: draft[spec.f] == null ? '' : draft[spec.f], step: spec.step || 1,
          onchange: function (v) { draft[spec.f] = v; }
        });

      case 'select':
        return C.select({
          label: label, value: draft[spec.f],
          options: spec.opts.map(function (o) {
            return { value: o, label: V3.t('opt.' + spec.f + '.' + o) };
          }),
          onchange: function (v) { draft[spec.f] = v; }
        });

      case 'ref':
        var refs = V3.db[plural(spec.refKind)]();
        return C.select({
          label: label, value: draft[spec.f] || '',
          options: (spec.allowEmpty ? [{ value: '', label: '—' }] : []).concat(
            refs.map(function (r) { return { value: r.id, label: V3.i18n.name(r) }; })),
          onchange: function (v) { draft[spec.f] = v || null; }
        });

      case 'refList':
        return refListField(label, spec, draft);

      case 'goodMap':
        return mapField(label, spec.f, draft, 'good');

      case 'popMap':
        return mapField(label, spec.f, draft, 'pop');

      case 'icon':
        return iconField(label, draft);

      default:
        return null;
    }
  }

  function refListField(label, spec, draft) {
    var list = draft[spec.f] || (draft[spec.f] = []);
    var host = h('div.v3-reflist');

    function draw() {
      h.fill(host, [
        h('div.v3-reflist-items', list.map(function (id, i) {
          var r = V3.db.safe(spec.refKind, id);
          return h('span.v3-reflist-item', [
            C.icon(r, 20), V3.i18n.name(r),
            h('button.v3-x', {
              type: 'button', onclick: function () { list.splice(i, 1); draw(); }
            }, '×')
          ]);
        })),
        C.select({
          value: '',
          options: [{ value: '', label: V3.t('data.addRef') }].concat(
            V3.db[plural(spec.refKind)]()
              .filter(function (r) { return list.indexOf(r.id) < 0; })
              .map(function (r) { return { value: r.id, label: V3.i18n.name(r) }; })),
          onchange: function (v) { if (v) { list.push(v); draw(); } }
        })
      ]);
    }
    draw();

    return h('div.v3-field', [h('span.v3-field-label', label), host]);
  }

  /** Editor for {goodId: amount} / {popId: count} objects. */
  function mapField(label, fieldName, draft, refKind) {
    var map = draft[fieldName] || (draft[fieldName] = {});
    var host = h('div.v3-mapfield');

    function draw() {
      h.fill(host, [
        h('div.v3-mapfield-rows', Object.keys(map).map(function (id) {
          var r = V3.db.safe(refKind, id);
          return h('div.v3-mapfield-row', [
            C.icon(r, 22),
            h('span.v3-mapfield-name', V3.i18n.name(r)),
            h('input.v3-input.v3-input-num', {
              type: 'number', value: map[id], step: refKind === 'pop' ? 100 : 1,
              oninput: function (e) { map[id] = V3.util.parseNum(e.target.value, 0); }
            }),
            h('button.v3-x', {
              type: 'button', onclick: function () { delete map[id]; draw(); }
            }, '×')
          ]);
        })),
        C.select({
          value: '',
          options: [{ value: '', label: V3.t('data.addEntry') }].concat(
            V3.db[plural(refKind)]()
              .filter(function (r) { return map[r.id] == null; })
              .map(function (r) { return { value: r.id, label: V3.i18n.name(r) }; })),
          onchange: function (v) { if (v) { map[v] = 0; draw(); } }
        })
      ]);
    }
    draw();

    return h('div.v3-field', [h('span.v3-field-label', label), host]);
  }

  function iconField(label, draft) {
    var preview = h('div.v3-icon-preview');

    function draw() {
      h.fill(preview, [
        C.icon(draft, 48),
        C.button(V3.t('data.pickIcon'), function () {
          C.iconPicker(draft.icon, function (val) { draft.icon = val; draw(); });
        }, { kind: 'ghost' }),
        draft.icon ? C.button(V3.t('action.clear'), function () {
          draft.icon = null; draw();
        }, { kind: 'tiny' }) : null
      ]);
    }
    draw();

    return h('div.v3-field', [h('span.v3-field-label', label), preview]);
  }

  // ---------------------------------------------------------------------------
  // THE PACK: export / import / reset
  // ---------------------------------------------------------------------------

  function packPanel() {
    var count = V3.db.userLayerCount();
    var chains = V3.userdata.chains().length;

    return C.panel(V3.t('data.pack'), [
      h('p.v3-hint', V3.t('data.packHint')),
      h('div.v3-pack-stats', [
        h('div', [h('strong', count), ' ', V3.t('data.editedRecords')]),
        h('div', [h('strong', chains), ' ', V3.t('data.savedChains')])
      ]),
      C.button(V3.t('data.exportPack'), openExport, { kind: 'primary' }),
      C.button(V3.t('data.importPack'), openImport, { kind: 'ghost' }),
      C.button(V3.t('data.resetAll'), function () {
        C.confirm(V3.t('data.resetAll'), V3.t('data.confirmReset'), function () {
          V3.userdata.wipeAll();
          V3.app.render();
          C.toast(V3.t('data.resetDone'));
        });
      }, { kind: 'danger' })
    ]);
  }

  function openExport() {
    var title = V3.t('data.myPack');
    var author = '';
    var includeSettings = false;

    C.modal(V3.t('data.exportPack'), h('div', [
      C.text({ label: V3.t('data.packTitle'), value: title, onchange: function (v) { title = v; } }),
      C.text({ label: V3.t('data.packAuthor'), value: author, onchange: function (v) { author = v; } }),
      C.checkbox({
        label: V3.t('data.includeSettings'), checked: includeSettings,
        onchange: function (v) { includeSettings = v; }
      }),
      h('p.v3-hint', V3.t('data.exportHint'))
    ]), {
      footer: [
        C.button(V3.t('action.cancel'), C.closeModal),
        C.button(V3.t('data.download'), function () {
          V3.userdata.exportPack({
            title: title, author: author, includeSettings: includeSettings
          });
          C.closeModal();
          C.toast(V3.t('data.exported'));
        }, { kind: 'primary' })
      ]
    });
  }

  function openImport() {
    V3.storage.pickJSON(function (obj) {
      var mode = 'merge';
      C.modal(V3.t('data.importPack'), h('div', [
        h('p', [h('strong', obj.title || '—'), obj.author ? ' — ' + obj.author : '']),
        h('p.v3-hint', V3.t('data.importSummary', {
          records: obj.data ? Object.keys(obj.data).reduce(function (a, k2) {
            return a + Object.keys(obj.data[k2] || {}).length;
          }, 0) : 0,
          chains: (obj.chains || []).length
        })),
        C.select({
          label: V3.t('data.importMode'), value: mode,
          options: [
            { value: 'merge', label: V3.t('data.importMerge') },
            { value: 'replace', label: V3.t('data.importReplace') }
          ],
          onchange: function (v) { mode = v; }
        })
      ]), {
        footer: [
          C.button(V3.t('action.cancel'), C.closeModal),
          C.button(V3.t('data.load'), function () {
            var rep = V3.userdata.importPack(obj, mode);
            C.closeModal();
            if (!rep.ok) { C.toast(V3.t('pack.error.' + rep.errors[0]), 'error'); return; }
            V3.app.render();
            C.toast(V3.t('data.imported'));
          }, { kind: 'primary' })
        ]
      });
    }, function () { C.toast(V3.t('pack.badFile'), 'error'); });
  }

})(window.V3);
