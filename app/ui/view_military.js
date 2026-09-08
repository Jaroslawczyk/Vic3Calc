/* ============================================================================
 * app/ui/view_military.js - The Military screen.
 * ---------------------------------------------------------------------------
 * EN: Build the army you want on the left. The right side answers the two
 *     questions that actually decide wars:
 *
 *       "what does this cost me every week, at peace and at war?"
 *       "how many factories and how many people is that?"
 *
 *     The peace/war toggle is the centrepiece. Flip it and watch the factory
 *     count jump - that jump is the war you cannot afford, shown before you
 *     declare it rather than six months after.
 *
 * RU: Слева собираете армию. Справа - ответы на два вопроса, которые реально
 *     решают исход войн:
 *
 *       "сколько это стоит каждую неделю - в мире и на войне?"
 *       "сколько это заводов и сколько людей?"
 *
 *     Переключатель мир/война - главное здесь. Переключите и посмотрите, как
 *     подскочит число заводов: этот скачок и есть война, которую вы не
 *     потянете, показанная ДО объявления, а не через полгода после.
 * ==========================================================================*/
(function (V3) {
  'use strict';

  var h = V3.h;
  var C = V3.ui;
  var View = V3.views.military = {};

  View.render = function () {
    var ctx = V3.app.ctx();
    var force = V3.app.state.military;
    var result = V3.Military.evaluate(ctx, force);

    return h('div.v3-military', [
      h('aside.v3-col-left', [forcePanel(ctx, force), mobPanel(ctx, force)]),
      h('div.v3-col-mid', [
        warToggle(force, result),
        billPanel(ctx, result, force.wartime),
        strengthPanel(result)
      ]),
      h('aside.v3-col-right', [industryPanel(ctx, result, force.wartime)])
    ]);
  };

  function refresh() { V3.app.render(); }

  // ===========================================================================
  // LEFT: the force
  // ===========================================================================

  function forcePanel(ctx, force) {
    var militaryBuildings = V3.db.buildings().filter(function (b) { return b.militaryKind; });

    return C.panel(V3.t('mil.force'), [
      force.units.length ? h('div.v3-unit-list', force.units.map(function (u, idx) {
        var b = V3.db.safe('building', u.buildingId);
        var pms = u.pms || V3.Context.defaultPMs(ctx, u.buildingId);
        return h('div.v3-unit', [
          h('header.v3-unit-head', [
            C.icon(b, 36),
            h('span.v3-unit-name', V3.i18n.name(b)),
            C.number({
              value: u.levels, min: 0, step: 1,
              onchange: function (v) { u.levels = v; refresh(); }
            }),
            h('span.v3-unit-unit', V3.t(b.militaryKind === 'navy' ? 'mil.flotillas' : 'mil.battalions')),
            h('button.v3-x', {
              type: 'button', title: V3.t('action.remove'),
              onclick: function () { force.units.splice(idx, 1); refresh(); }
            }, '×')
          ]),
          h('div.v3-unit-pms', (b.pmGroups || []).map(function (gid) {
            var grp = V3.db.safe('pmGroup', gid);
            var list = V3.db.pmsOfGroup(gid);
            return C.select({
              label: V3.i18n.name(grp),
              value: pms[gid],
              options: list.map(function (p) {
                return {
                  value: p.id,
                  label: V3.i18n.name(p),
                  suffix: ctx.pmAvailable(p.id) ? '' : '  🔒',
                  disabled: false
                };
              }),
              onchange: function (v) {
                u.pms = u.pms || V3.Context.defaultPMs(ctx, u.buildingId);
                u.pms[gid] = v;
                refresh();
              }
            });
          }))
        ]);
      })) : C.empty(V3.t('mil.noUnits')),

      h('div.v3-btn-row', militaryBuildings.map(function (b) {
        return C.button(V3.i18n.name(b), function () {
          force.units.push({
            buildingId: b.id, levels: 20,
            pms: V3.Context.defaultPMs(ctx, b.id)
          });
          refresh();
        }, { kind: 'ghost' });
      }))
    ]);
  }

  // ===========================================================================
  // LEFT: mobilisation options
  // ===========================================================================

  function mobPanel(ctx, force) {
    var opts = V3.db.pmsOfGroup('pmg_mobilization');

    return C.panel(V3.t('mil.mobilization'), [
      h('p.v3-hint', V3.t('mil.mobHint')),
      h('div.v3-mob-grid', opts.map(function (p) {
        var on = force.mobilization.indexOf(p.id) >= 0;
        var locked = !ctx.pmAvailable(p.id);
        return h('button.v3-mob' + (on ? '.is-on' : '') + (locked ? '.is-locked' : ''), {
          type: 'button',
          title: Object.keys(p.inputs || {}).map(function (g) {
            return V3.i18n.name(V3.db.safe('good', g)) + ' ' + p.inputs[g];
          }).join(', '),
          onclick: function () {
            if (on) force.mobilization = force.mobilization.filter(function (x) { return x !== p.id; });
            else force.mobilization.push(p.id);
            refresh();
          }
        }, [
          C.icon(p, 30),
          h('span', V3.i18n.name(p)),
          locked ? C.lockBadge(p.unlockTech) : null
        ]);
      }))
    ]);
  }

  // ===========================================================================
  // MIDDLE
  // ===========================================================================

  function warToggle(force, result) {
    return h('div.v3-wartoggle', [
      h('button.v3-wt' + (!force.wartime ? '.is-active' : ''), {
        type: 'button', onclick: function () { force.wartime = false; refresh(); }
      }, [h('span.v3-wt-label', V3.t('mil.peace')),
          h('span.v3-wt-cost', V3.num.money(result.upkeepPeace) + ' / ' + V3.t('unit.week'))]),
      h('button.v3-wt' + (force.wartime ? '.is-active' : '') + '.is-war', {
        type: 'button', onclick: function () { force.wartime = true; refresh(); }
      }, [h('span.v3-wt-label', V3.t('mil.war')),
          h('span.v3-wt-cost', V3.num.money(result.upkeepWar) + ' / ' + V3.t('unit.week'))]),
      h('div.v3-wt-delta', [
        h('span.v3-wt-delta-n', '+' + V3.num.money(result.warSurcharge)),
        h('span.v3-wt-delta-l', V3.t('mil.warSurcharge'))
      ])
    ]);
  }

  function billPanel(ctx, result, wartime) {
    var goods = wartime ? result.goodsWar : result.goodsPeace;
    var keys = V3.util.sortBy(Object.keys(goods), function (g) { return -goods[g] * ctx.price(g); });

    return C.panel(V3.t(wartime ? 'mil.billWar' : 'mil.billPeace'), [
      keys.length ? h('table.v3-bill', [
        h('thead', h('tr', [
          h('th', ''), h('th', V3.t('ledger.good')),
          h('th', V3.t('mil.perWeek')), h('th', V3.t('mil.cost')),
          h('th', V3.t('mil.warDelta'))
        ])),
        h('tbody', keys.map(function (g) {
          var good = V3.db.safe('good', g);
          // Always war minus peace, whichever view you are in. Showing the
          // signed difference "the other way round" in the peacetime view made
          // the extra wartime demand read as a saving, in green.
          var extra = (result.goodsWar[g] || 0) - (result.goodsPeace[g] || 0);
          return h('tr', [
            h('td', C.icon(good, 24)),
            h('td', V3.i18n.name(good)),
            h('td.v3-num', V3.num.fmt(goods[g], 0)),
            h('td.v3-num', V3.num.money(goods[g] * ctx.price(g))),
            h('td.v3-num' + (extra > 0 ? '.is-bad' : ''),
              extra <= 0 ? '—' : '+' + V3.num.fmt(extra, 0))
          ]);
        }))
      ]) : C.empty(V3.t('mil.noUnits')),

      h('div.v3-bill-total', [
        line(V3.t('mil.goodsCost'), V3.num.money(wartime ? result.goodsCostWar : result.goodsCostPeace)),
        line(V3.t('mil.wages'), V3.num.money(result.wages)),
        line(V3.t('mil.upkeepTotal'),
          V3.num.money(wartime ? result.upkeepWar : result.upkeepPeace), true),
        line(V3.t('mil.buildCost'), V3.num.int(result.constructionCost) + ' ⚒')
      ]),

      result.mobilization.length ? h('div.v3-mob-summary', [
        C.rule(V3.t('mil.mobExtra')),
        h('div.v3-qty-row', result.mobilization.map(function (m) {
          return h('span.v3-mob-chip', [
            C.icon(m.pm, 20), V3.i18n.name(m.pm),
            h('span.v3-mob-chip-cost',
              V3.num.money(V3.util.sum(Object.keys(m.total), function (g) {
                return m.total[g] * ctx.price(g);
              })))
          ]);
        }))
      ]) : null,

      C.formula('militaryGoods')
    ]);
  }

  function line(label, value, strong) {
    return h('div.v3-bill-line' + (strong ? '.is-strong' : ''), [
      h('span', label), h('span', value)
    ]);
  }

  function strengthPanel(result) {
    var jobs = result.jobs;
    return C.panel(V3.t('mil.strength'), [
      h('div.v3-strength', [
        big(V3.num.int(result.battalions), V3.t('mil.battalions')),
        big(V3.num.int(result.flotillas), V3.t('mil.flotillas')),
        big(V3.num.int(result.offenseTotal), V3.t('mil.offense')),
        big(V3.num.int(result.defenseTotal), V3.t('mil.defense'))
      ]),
      Object.keys(jobs).length ? h('div.v3-qty-row', Object.keys(jobs).map(function (j) {
        return C.popAmount(j, jobs[j], { size: 24, showName: true });
      })) : null,
      h('p.v3-hint', V3.t('mil.strengthHint')),
      C.formula('militaryStrength')
    ]);
  }

  function big(value, label) {
    return h('div.v3-big', [h('span.v3-big-n', value), h('span.v3-big-l', label)]);
  }

  // ===========================================================================
  // RIGHT: what industry does this army require?
  // ===========================================================================

  function industryPanel(ctx, result, wartime) {
    var targets = V3.Military.toChainTargets(result, wartime);
    if (!targets.length) {
      return C.panel(V3.t('mil.industry'), C.empty(V3.t('mil.noUnits')));
    }

    // Reuse the ordinary solver: an army is just another set of goods targets.
    var producers = {};
    targets.forEach(function (t) {
      var p = V3.Solver.autoPlan(ctx, t.good, t.amount, {});
      Object.keys(p.producers).forEach(function (g) {
        if (!producers[g]) producers[g] = p.producers[g];
      });
    });
    var sol = V3.Solver.solve(ctx, { targets: targets, producers: producers });

    var nodes = V3.util.sortBy(sol.nodes, function (n) { return -n.levels; });

    return C.panel(V3.t('mil.industry'), [
      h('div.v3-mil-summary', [
        big(V3.num.int(sol.totals.levels), V3.t('sum.levels', { n: sol.totals.levels })),
        big(V3.num.pop(sol.totals.workers), V3.t('sum.workers')),
        big(V3.num.int(sol.totals.constructionCost), V3.t('sum.buildCost'))
      ]),

      h('ul.v3-mil-buildings', nodes.map(function (n) {
        var b = n.building || V3.db.safe('building', n.buildingId);
        return h('li.v3-mil-building', [
          C.icon(b, 30),
          h('span.v3-mil-building-name', V3.i18n.name(b)),
          h('span.v3-mil-building-n', V3.num.buildings(n.levelsExact))
        ]);
      })),

      sol.warnings.length ? h('div.v3-warnings',
        sol.warnings.slice(0, 4).map(C.warning)) : null,

      C.button(V3.t('mil.sendToChain'), function () {
        targets.forEach(function (t) { V3.app.addTarget(t.good, t.amount); });
        V3.app.go('chain');
        C.toast(V3.t('mil.sentToChain'));
      }, { kind: 'primary' }),

      h('p.v3-hint', V3.t('mil.industryHint'))
    ]);
  }

})(window.V3);
