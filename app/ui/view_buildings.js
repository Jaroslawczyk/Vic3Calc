/* ============================================================================
 * app/ui/view_buildings.js - The buildings reference.
 * ---------------------------------------------------------------------------
 * EN: A browsable version of the game's build menu: every building, every
 *     method row, every number, with the icons you already recognise.
 *     Clicking "use in chain" drops it into the Calculator as the chosen
 *     producer for whatever it makes.
 *
 * RU: Просматриваемая версия игрового меню строительства: все здания, все
 *     строки методов, все числа - с иконками, которые вы и так узнаёте.
 *     Кнопка "в цепочку" ставит здание в калькулятор как производителя того,
 *     что оно выпускает.
 * ==========================================================================*/
(function (V3) {
  'use strict';

  var h = V3.h;
  var C = V3.ui;
  var View = V3.views.buildings = {};

  var filter = { group: '', text: '' };

  View.render = function () {
    return h('div.v3-browse', [
      h('div.v3-browse-bar', [
        C.text({
          placeholder: V3.t('browse.search'), value: filter.text,
          oninput: function (v) { filter.text = v; refresh(); }
        }),
        h('div.v3-chipbar', [{ id: '', name: V3.t('browse.all'), icon: null }]
          .concat(V3.db.buildingGroups()).map(function (g) {
            return h('button.v3-groupchip' + (filter.group === g.id ? '.is-active' : ''), {
              type: 'button',
              style: g.color ? { borderColor: g.color } : null,
              onclick: function () { filter.group = g.id; refresh(); }
            }, [g.icon ? C.icon(g, 20) : null, V3.i18n.name(g)]);
          }))
      ]),
      h('div#v3-building-list.v3-card-grid', cards())
    ]);
  };

  function refresh() {
    var host = h.$('#v3-building-list');
    if (host) h.fill(host, cards());
    h.$$('.v3-groupchip').forEach(function (el, i) {
      var groups = [''].concat(V3.db.buildingGroups().map(function (g) { return g.id; }));
      el.classList.toggle('is-active', groups[i] === filter.group);
    });
  }

  function cards() {
    var ctx = V3.app.ctx();
    var text = filter.text.toLowerCase();

    var list = V3.db.buildings().filter(function (b) {
      if (filter.group && b.group !== filter.group) return false;
      if (!text) return true;
      var hay = (V3.i18n.name(b) + ' ' + b.id + ' ' +
        (b.produces || []).map(function (g) {
          return V3.i18n.name(V3.db.safe('good', g));
        }).join(' ')).toLowerCase();
      return hay.indexOf(text) >= 0;
    });

    if (!list.length) return C.empty(V3.t('browse.nothing'));

    return list.map(function (b) {
      var group = V3.db.buildingGroup(b.group);
      var pms = V3.Context.defaultPMs(ctx, b.id);
      var per = V3.BuildingCalc.perLevel(ctx, b.id, pms);
      var jobsTotal = V3.util.sum(Object.keys(per.jobs), function (j) { return per.jobs[j]; });

      return h('article.v3-bcard', {
        style: { borderTopColor: (group && group.color) || 'var(--rule)' }
      }, [
        h('header.v3-bcard-head', [
          C.icon(b, 44),
          h('div', [
            h('h3', [V3.i18n.name(b), C.confidence(b), C.userBadge(b)]),
            h('span.v3-bcard-group', V3.i18n.name(group || { name: '' }))
          ]),
          b.unlockTech && !ctx.hasTech(b.unlockTech) ? C.lockBadge(b.unlockTech) : null
        ]),

        h('div.v3-bcard-stats', [
          statChip('State_status_construction', V3.num.int(b.constructionCost), V3.t('label.buildCost')),
          statChip('Panel_pops', V3.num.pop(jobsTotal), V3.t('label.workersPerLevel')),
          per.infra ? statChip('State_status_infrastructure', V3.num.int(per.infra), V3.t('label.infraUsed')) : null,
          per.pollution ? statChip('Event_industry', V3.num.int(per.pollution), V3.t('label.pollution')) : null
        ]),

        // The per-level input -> output line, which is the whole point.
        h('div.v3-bcard-io', [
          h('div.v3-bcard-io-side', Object.keys(per.inputs).map(function (g) {
            return C.goodAmount(g, per.inputs[g], { size: 24 });
          })),
          h('span.v3-arrow', '→'),
          h('div.v3-bcard-io-side', Object.keys(per.outputs).map(function (g) {
            return C.goodAmount(g, per.outputs[g], { size: 24, positive: true });
          }))
        ]),

        h('div.v3-bcard-jobs', Object.keys(per.jobs).map(function (j) {
          return C.popAmount(j, per.jobs[j], { size: 22, showName: true });
        })),

        h('details.v3-bcard-pms', [
          h('summary', V3.t('browse.methods', { n: (b.pmGroups || []).length })),
          (b.pmGroups || []).map(function (gid) {
            var grp = V3.db.safe('pmGroup', gid);
            return h('div.v3-pmgroup', [
              h('h4', V3.i18n.name(grp)),
              h('div.v3-pmgroup-list', V3.db.pmsOfGroup(gid).map(function (p) {
                var locked = !ctx.pmAvailable(p.id);
                var chosen = pms[gid] === p.id;
                return h('div.v3-pmrow' + (chosen ? '.is-active' : '') + (locked ? '.is-locked' : ''), [
                  C.icon(p, 24),
                  h('span.v3-pmrow-name', [V3.i18n.name(p), C.confidence(p)]),
                  h('span.v3-pmrow-io', [
                    Object.keys(p.inputs || {}).map(function (g) {
                      return C.goodAmount(g, p.inputs[g], { size: 16 });
                    }),
                    Object.keys(p.outputs || {}).map(function (g) {
                      return C.goodAmount(g, p.outputs[g], { size: 16, positive: true });
                    })
                  ]),
                  locked ? C.lockBadge(p.unlockTech) : null
                ]);
              }))
            ]);
          })
        ]),

        h('footer.v3-bcard-foot', [
          C.button(V3.t('browse.useInChain'), function () {
            var outs = V3.BuildingCalc.outputsOf(ctx, b.id, pms);
            if (!outs.length) { C.toast(V3.t('browse.makesNothing'), 'warn'); return; }
            outs.forEach(function (g) { V3.app.setProducer(g, b.id); });
            C.toast(V3.t('browse.added', { name: V3.i18n.name(b) }));
          }, { kind: 'primary' }),
          C.button(V3.t('browse.edit'), function () {
            V3.views.data.editRecord('building', b.id);
          }, { kind: 'ghost' })
        ])
      ]);
    });
  }

  function statChip(iconKey, value, label) {
    return h('span.v3-chip', { title: label }, [
      C.icon({ id: iconKey, icon: iconKey, name: label }, 16), h('span', value)
    ]);
  }

})(window.V3);
