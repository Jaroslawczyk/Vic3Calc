/* ============================================================================
 * app/ui/view_chain.js - The Calculator screen.
 * ---------------------------------------------------------------------------
 * EN: Three columns, deliberately:
 *
 *       LEFT    what you want and under what conditions   (the question)
 *       MIDDLE  the chain, zoomable                       (the answer, drawn)
 *       RIGHT   the order to build it in                  (the answer, as a plan)
 *
 *     The right column is the part people actually use while playing: it is a
 *     numbered list you work down inside the game, and it already accounts for
 *     construction sectors making everything after them faster.
 *
 * RU: Три колонки, и это намеренно:
 *
 *       СЛЕВА    что вы хотите и при каких условиях   (вопрос)
 *       ПОСЕРЕДИНЕ цепочка с зумом                   (ответ картинкой)
 *       СПРАВА   в каком порядке это строить          (ответ планом)
 *
 *     Правая колонка - то, чем реально пользуются во время игры: нумерованный
 *     список, по которому идёшь сверху вниз прямо в игре, и он уже учитывает,
 *     что строительные секторы ускоряют всё, что идёт после них.
 * ==========================================================================*/
(function (V3) {
  'use strict';

  var h = V3.h;
  var C = V3.ui;
  var View = V3.views.chain = {};

  var graphHost = null;

  View.render = function () {
    var sol = V3.app.state.solution;

    graphHost = V3.graph.create();
    // Draw after layout so card heights measure correctly.
    V3.app.schedule(function () {
      V3.graph.setSolution(V3.app.state.solution);
      V3.graph.fit();
    });

    return h('div.v3-chain', [
      h('aside.v3-col-left', [
        goalsPanel(),
        conditionsPanel(),
        importsPanel(),
        chainFilePanel()
      ]),
      h('div.v3-col-mid', [
        summaryStrip(sol),
        graphHost,
        warningsStrip(sol)
      ]),
      h('aside.v3-col-right', [
        buildOrderPanel(),
        workforcePanel(),
        ledgerPanel()
      ])
    ]);
  };

  View.onSolved = function () {
    // Redraw only what depends on the solution, so panning is not reset.
    V3.graph.setSolution(V3.app.state.solution);
    replace('.v3-summary', summaryStrip(V3.app.state.solution));
    replace('.v3-warnings', warningsStrip(V3.app.state.solution));
    replace('.v3-order-panel', buildOrderPanel());
    replace('.v3-workforce-panel', workforcePanel());
    replace('.v3-ledger-panel', ledgerPanel());
    replace('.v3-goals-panel', goalsPanel());
    replace('.v3-imports-panel', importsPanel());
  };

  function replace(sel, node) {
    var old = h.$(sel);
    if (old && old.parentNode) old.parentNode.replaceChild(node, old);
  }

  // ===========================================================================
  // LEFT: what do you want?
  // ===========================================================================

  function goalsPanel() {
    var c = V3.app.chainState ? V3.app.chainState() : V3.app.state.chain;

    var addGood = '';
    var addAmount = 100;

    var goodSelect = C.select({
      value: '',
      options: [{ value: '', label: V3.t('chain.pickGood') }].concat(
        V3.db.goods().filter(function (g) { return !g.abstract; }).map(function (g) {
          return { value: g.id, label: V3.i18n.name(g) };
        })),
      onchange: function (v) { addGood = v; }
    });

    var amountInput = C.number({
      value: addAmount, min: 1, step: 10,
      oninput: function (v) { addAmount = v; }
    });

    return C.panel(V3.t('chain.goals'), [
      c.targets.length ? h('ul.v3-goal-list', c.targets.map(function (t) {
        var g = V3.db.safe('good', t.good);
        return h('li.v3-goal', [
          C.icon(g, 30),
          h('span.v3-goal-name', V3.i18n.name(g)),
          C.number({
            value: t.amount, min: 0, step: 10,
            onchange: function (v) {
              V3.app.patch(function (cc) {
                var row = cc.targets.filter(function (x) { return x.good === t.good; })[0];
                if (row) row.amount = v;
              });
            }
          }),
          h('span.v3-goal-unit', V3.t('unit.perWeek')),
          h('button.v3-x', {
            type: 'button', title: V3.t('action.remove'),
            onclick: function () { V3.app.removeTarget(t.good); }
          }, '×')
        ]);
      })) : C.empty(V3.t('chain.noGoals')),

      h('div.v3-goal-add', [
        goodSelect, amountInput,
        C.button(V3.t('action.add'), function () {
          if (!addGood) { C.toast(V3.t('chain.pickGoodFirst'), 'warn'); return; }
          V3.app.addTarget(addGood, addAmount || 1);
        }, { kind: 'primary' })
      ]),

      C.formula('levelsNeeded')
    ], { className: 'v3-goals-panel' });
  }

  // ===========================================================================
  // LEFT: conditions - tech era, options
  // ===========================================================================

  function conditionsPanel() {
    var c = V3.app.state.chain;

    var eraRow = h('div.v3-era', [1, 2, 3, 4, 5].map(function (e) {
      return h('button.v3-era-btn' + (c.era === e ? '.is-active' : ''), {
        type: 'button', title: V3.t('era.' + e),
        onclick: function () { V3.app.patch(function (cc) { cc.era = e; }); V3.app.render(); }
      }, String(e));
    }));

    return C.panel(V3.t('chain.conditions'), [
      h('div.v3-field-row', [
        h('span.v3-field-label', V3.t('chain.era')),
        eraRow
      ]),
      h('p.v3-hint', V3.t('chain.eraHint')),

      C.button(V3.t('chain.pickTechs'), openTechPicker, { kind: 'ghost' }),
      C.button(V3.t('chain.upgradeAll'), V3.app.upgradeAllPMs, { kind: 'ghost' }),

      C.rule(V3.t('chain.simulation')),

      C.checkbox({
        label: V3.t('opt.economyOfScale'), checked: V3.userdata.get('economyOfScale'),
        onchange: function (v) { V3.userdata.set('economyOfScale', v); }
      }),
      C.checkbox({
        label: V3.t('opt.infrastructure'), checked: V3.userdata.get('countInfrastructure'),
        onchange: function (v) { V3.userdata.set('countInfrastructure', v); }
      }),
      C.checkbox({
        label: V3.t('opt.pollution'), checked: V3.userdata.get('countPollution'),
        onchange: function (v) { V3.userdata.set('countPollution', v); }
      }),
      C.checkbox({
        label: V3.t('opt.constructionRamp'), checked: V3.userdata.get('countConstructionSector'),
        onchange: function (v) { V3.userdata.set('countConstructionSector', v); }
      }),

      C.rule(V3.t('chain.country')),

      C.number({
        label: V3.t('country.population'), value: V3.userdata.get('country.population'),
        step: 100000,
        onchange: function (v) { V3.userdata.set('country.population', v); }
      }),
      C.number({
        label: V3.t('country.construction'), value: V3.userdata.get('country.constructionPoints'),
        step: 10,
        onchange: function (v) { V3.userdata.set('country.constructionPoints', v); }
      }),
      C.number({
        label: V3.t('country.literacy'), value: V3.userdata.get('country.literacyPct'),
        min: 0, max: 100,
        onchange: function (v) { V3.userdata.set('country.literacyPct', v); }
      })
    ]);
  }

  function openTechPicker() {
    var c = V3.app.state.chain;
    var byEra = V3.util.groupBy(V3.db.techs(), function (t) { return t.era; });

    C.modal(V3.t('chain.pickTechs'), h('div.v3-tech-picker',
      Object.keys(byEra).sort().map(function (era) {
        return h('div.v3-tech-era', [
          C.rule(V3.t('era.' + era)),
          h('div.v3-tech-grid', byEra[era].map(function (t) {
            var ctx = V3.app.ctx();
            var on = ctx.hasTech(t.id);
            return h('label.v3-tech' + (on ? '.is-on' : '') + '.is-' + t.category, [
              h('input', {
                type: 'checkbox', checked: on,
                onchange: function (e) {
                  V3.app.patch(function (cc) { cc.techs[t.id] = e.target.checked; });
                }
              }),
              h('span', V3.i18n.name(t))
            ]);
          }))
        ]);
      })
    ), {
      footer: [
        C.button(V3.t('action.clear'), function () {
          V3.app.patch(function (cc) { cc.techs = {}; });
          C.closeModal();
        }),
        C.button(V3.t('action.close'), C.closeModal, { kind: 'primary' })
      ]
    });
  }

  // ===========================================================================
  // LEFT: goods you buy instead of making
  // ===========================================================================

  function importsPanel() {
    var c = V3.app.state.chain;
    var sol = V3.app.state.solution;
    var keys = Object.keys(c.imported);

    var pickGood = '';
    var pickAmount = 50;

    /** How much of a good the chain currently wants, for pre-filling. */
    function needOf(g) {
      var row = sol && sol.goods[g];
      return row ? (row.consumed + row.finalDemand) : 0;
    }

    var amountInput = C.number({
      value: pickAmount, min: 0, step: 10,
      oninput: function (v) { pickAmount = v; }
    });

    var goodSelect = C.select({
      value: '',
      options: [{ value: '', label: V3.t('chain.pickGood') }].concat(
        V3.db.goods().filter(function (g) {
          return !g.abstract && c.imported[g.id] == null;
        }).map(function (g) {
          var need = needOf(g.id);
          return {
            value: g.id,
            label: V3.i18n.name(g) + (need > 0.5 ? '  (' + V3.num.fmt(need, 0) + ')' : '')
          };
        })),
      onchange: function (v) {
        pickGood = v;
        // Pre-fill with the whole requirement - buying all of it is the
        // common case, and it saves you looking the number up.
        var need = needOf(v);
        if (need > 0) { pickAmount = Math.ceil(need); amountInput.value = pickAmount; }
      }
    });

    return C.panel(V3.t('chain.imports'), [
      h('p.v3-hint', V3.t('chain.importsHint')),

      keys.length ? h('ul.v3-import-list', keys.map(function (g) {
        var good = V3.db.safe('good', g);
        var need = needOf(g);
        var bought = c.imported[g];
        var covers = need > 0 ? Math.min(1, bought / need) : 1;
        return h('li.v3-goal', [
          C.icon(good, 26),
          h('span.v3-goal-name', [
            V3.i18n.name(good),
            need > 0.5 ? h('span.v3-goal-unit', ' / ' + V3.num.fmt(need, 0)) : null
          ]),
          C.number({
            value: bought, min: 0, step: 10,
            onchange: function (v) { V3.app.setImported(g, v); }
          }),
          h('span.v3-goal-unit' + (covers >= 0.999 ? '.is-good' : ''), {
            title: V3.t(covers >= 0.999 ? 'chain.importCoversAll' : 'chain.importCoversPart')
          }, covers >= 0.999 ? '✔' : Math.round(covers * 100) + '%'),
          h('button.v3-x', {
            type: 'button', title: V3.t('action.remove'),
            onclick: function () { V3.app.setImported(g, null); }
          }, '×')
        ]);
      })) : C.empty(V3.t('chain.noImports')),

      h('div.v3-goal-add', [
        goodSelect, amountInput,
        C.button(V3.t('action.add'), function () {
          if (!pickGood) { C.toast(V3.t('chain.pickGoodFirst'), 'warn'); return; }
          V3.app.setImported(pickGood, pickAmount);
        }, { kind: 'primary' })
      ]),

      h('p.v3-hint', V3.t('chain.importsPartialHint'))
    ], { className: 'v3-imports-panel' });
  }

  // ===========================================================================
  // LEFT: save / load / share
  // ===========================================================================

  function chainFilePanel() {
    var nameInput = C.text({
      label: V3.t('chain.name'),
      value: V3.app.state.chain.name,
      placeholder: V3.t('chain.untitled'),
      onchange: function (v) { V3.app.state.chain.name = v; }
    });

    var saved = V3.userdata.chains();

    return C.panel(V3.t('chain.file'), [
      nameInput,
      h('div.v3-btn-row', [
        C.button(V3.t('action.save'), function () {
          V3.app.saveChain(V3.app.state.chain.name);
          V3.app.render();
        }, { kind: 'primary' }),
        C.button(V3.t('action.new'), function () {
          C.confirm(V3.t('action.new'), V3.t('chain.confirmNew'), function () {
            V3.app.clearChain(); V3.app.render();
          });
        })
      ]),
      saved.length ? h('ul.v3-saved-list', saved.map(function (s) {
        return h('li.v3-saved', [
          h('button.v3-saved-name', {
            type: 'button',
            onclick: function () { V3.app.loadChain(s.id); V3.app.render(); }
          }, s.name || V3.t('chain.untitled')),
          h('button.v3-x', {
            type: 'button', title: V3.t('action.delete'),
            onclick: function () {
              V3.userdata.deleteChain(s.id); V3.app.render();
            }
          }, '×')
        ]);
      })) : null,
      h('div.v3-btn-row', [
        C.button(V3.t('chain.exportOne'), function () {
          V3.storage.downloadJSON(
            (V3.util.slug(V3.app.state.chain.name) || 'chain') + '.v3chain.json',
            V3.userdata.buildPack({
              title: V3.app.state.chain.name || 'chain',
              includeData: true, includeChains: true,
              chainIds: V3.app.state.chain.id ? [V3.app.state.chain.id] : []
            }));
        }, { kind: 'ghost' }),
        C.button(V3.t('chain.importOne'), function () {
          V3.storage.pickJSON(function (obj) {
            var rep = V3.userdata.importPack(obj, 'merge');
            if (!rep.ok) { C.toast(V3.t('pack.badFile'), 'error'); return; }
            C.toast(V3.t('pack.imported', { n: rep.chains }));
            V3.app.render();
          }, function () { C.toast(V3.t('pack.badFile'), 'error'); });
        }, { kind: 'ghost' })
      ])
    ]);
  }

  // ===========================================================================
  // MIDDLE: the headline numbers
  // ===========================================================================

  function summaryStrip(sol) {
    if (!sol) return h('div.v3-summary', C.empty(V3.t('chain.emptyHint')));

    var econ = V3.app.state.economy;
    var sim = V3.app.state.sim;
    var jobs = sol.totals.jobs;
    var strata = sol.totals.jobsByStrata;

    return h('div.v3-summary', [
      stat('Panel_pops', V3.num.pop(sol.totals.workers), V3.t('sum.workers', { n: sol.totals.workers }),
        C.bar([
          { value: strata.poor, label: V3.t('strata.poor'), color: 'var(--strata-poor)' },
          { value: strata.middle, label: V3.t('strata.middle'), color: 'var(--strata-middle)' },
          { value: strata.upper, label: V3.t('strata.upper'), color: 'var(--strata-upper)' }
        ])),
      stat('Building_urban_center', V3.num.int(sol.totals.levels), V3.t('sum.levels', { n: sol.totals.levels }),
        sol.totals.levelsToBuild !== sol.totals.levels
          ? h('span.v3-stat-sub', V3.t('sum.toBuild', { n: sol.totals.levelsToBuild })) : null),
      stat('State_status_construction', V3.num.int(sol.totals.constructionCost), V3.t('sum.buildCost')),
      stat('Panel_technology', sim ? V3.num.weeks(sim.weeks) : '—', V3.t('sum.buildTime'),
        sim && sim.rampGain > 0
          ? h('span.v3-stat-sub.is-good', V3.t('sum.rampSaved', {
              flat: V3.num.weeks(sim.flatWeeks) })) : null),
      stat('Goods_services', econ ? V3.num.moneySigned(econ.netProfit) : '—', V3.t('sum.profit'),
        econ && econ.paybackWeeks !== Infinity
          ? h('span.v3-stat-sub', V3.t('sum.payback', { t: V3.num.weeks(econ.paybackWeeks) })) : null),
      V3.userdata.get('countInfrastructure')
        ? stat('State_status_infrastructure',
            V3.num.int(sol.totals.infraUsed), V3.t('sum.infra'),
            h('span.v3-stat-sub' + (sol.totals.infraBalance < 0 ? '.is-bad' : '.is-good'),
              V3.t('sum.infraBalance', { n: V3.num.fmt(sol.totals.infraBalance, 0) })))
        : null,
      V3.userdata.get('countPollution')
        ? stat('Event_industry', V3.num.int(sol.totals.pollution), V3.t('sum.pollution'))
        : null
    ]);
  }

  function stat(iconKey, value, label, extra) {
    return h('div.v3-stat', [
      C.icon({ id: iconKey, icon: iconKey, name: label }, 30),
      h('div.v3-stat-body', [
        h('span.v3-stat-value', value),
        h('span.v3-stat-label', label),
        extra
      ])
    ]);
  }

  function warningsStrip(sol) {
    if (!sol || !sol.warnings.length) return h('div.v3-warnings');
    // Deduplicate: the same missing good can be reported by several nodes.
    var seen = {};
    var list = sol.warnings.filter(function (w) {
      var k = w.code + '|' + (w.good || w.pop || w.buildingId || '');
      if (seen[k]) return false;
      seen[k] = true; return true;
    });
    return h('div.v3-warnings', list.slice(0, 8).map(function (w) {
      var alert = C.warning(w);
      if (w.code === 'NO_SOURCE' || w.code === 'DEFICIT') {
        alert.appendChild(C.button(V3.t('chain.buyInstead'), function () {
          V3.app.setImported(w.good, Math.ceil(w.amount || 0));
        }, { kind: 'tiny' }));
      }
      return alert;
    }));
  }

  // ===========================================================================
  // RIGHT: the plan
  // ===========================================================================

  function buildOrderPanel() {
    var order = V3.app.state.order;
    var sim = V3.app.state.sim;
    var mode = V3.userdata.get('buildOrderMode', 'fastest');

    var modeSel = h('div.v3-mode', ['fastest', 'cheapest', 'selfSufficient'].map(function (m) {
      return h('button.v3-mode-btn' + (mode === m ? '.is-active' : ''), {
        type: 'button', title: V3.t('mode.' + m + '.tip'),
        onclick: function () {
          V3.userdata.set('buildOrderMode', m);
          V3.app.recalc();
        }
      }, V3.t('mode.' + m));
    }));

    if (!order || !order.length) {
      return C.panel(V3.t('order.title'), [modeSel, C.empty(V3.t('order.empty'))],
        { className: 'v3-order-panel' });
    }

    var cum = 0;
    return C.panel(V3.t('order.title'), [
      modeSel,
      h('p.v3-hint', V3.t('mode.' + mode + '.tip')),

      constructionSectorBlock(),
      pruneBlock(),

      h('ol.v3-order-list', order.map(function (row) {
        var n = row.node;
        var b = n.building || V3.db.safe('building', n.buildingId);
        var count = n.levelsToBuild || n.levels;
        cum += n.constructionCost;
        var done = sim && sim.perItem.filter(function (i) {
          return i.buildingId === n.buildingId;
        }).reduce(function (mx, i) { return Math.max(mx, i.endWeek || 0); }, 0);

        return h('li.v3-order-item' + (row.reason === 'CONSTRUCTION_FIRST' ? '.is-priority' : ''), [
          h('span.v3-order-step', row.step),
          C.icon(b, 34),
          h('div.v3-order-body', [
            h('span.v3-order-name', V3.i18n.name(b)),
            h('span.v3-order-meta', [
              h('strong', V3.t('order.levels', { n: count })),
              n.constructionCost ? ' · ' + V3.num.int(n.constructionCost) + ' ⚒' : '',
              done ? ' · ' + V3.t('order.doneBy', { t: V3.num.weeks(done) }) : ''
            ]),
            row.reason !== 'DEPENDENCY'
              ? h('span.v3-order-why', V3.t('order.why.' + row.reason)) : null
          ])
        ]);
      })),

      order.brokeCycle && order.brokeCycle.length
        ? C.warning({ code: 'CYCLE', level: 'warn',
            buildingId: order.brokeCycle[0] }) : null,

      sim ? h('div.v3-order-total', [
        h('div', [h('strong', V3.num.weeks(sim.weeks)), ' ', V3.t('order.totalTime')]),
        h('div', [h('strong', V3.num.int(sim.totalCost)), ' ', V3.t('order.totalCost')]),
        sim.rampGain > 0 ? h('div.is-good', V3.t('order.ramp', {
          from: V3.num.int(sim.startingPoints), to: V3.num.int(sim.finalPoints)
        })) : null,
        sim.hitLimit ? C.warning({ code: 'BUILD_TOO_LONG', level: 'error' }) : null
      ]) : null,

      C.formula('constructionTimeRamp')
    ], { className: 'v3-order-panel' });
  }

  /**
   * The construction sector control.
   *
   * Pressing the button re-solves the whole plan once per candidate count and
   * keeps the one that finishes soonest - sectors are not free, they have to be
   * built themselves and they drag wood, iron, tools and steel in behind them.
   * The alternatives are shown afterwards so the choice is visible rather than
   * taken on trust.
   */
  function constructionSectorBlock() {
    var c = V3.app.state.chain;
    var current = c.fixed.construction_sector || 0;
    var advice = V3.app.state.constructionAdvice;

    return h('div.v3-cs', [
      h('div.v3-cs-head', [
        C.icon(V3.db.safe('building', 'construction_sector'), 26),
        h('strong', V3.t('cs.title'))
      ]),

      h('div.v3-cs-row', [
        C.button(V3.t('cs.suggest'), function () {
          var res = V3.app.suggestConstructionSectors();
          if (!res.best) { C.toast(V3.t('cs.failed'), 'error'); return; }
          C.toast(V3.t('cs.applied', {
            n: res.best.levels, saved: V3.num.weeks(res.saved)
          }));
          V3.app.render();
        }, { kind: 'primary' }),
        C.number({
          value: current, min: 0, step: 1,
          onchange: function (v) { V3.app.setConstructionSectors(v); V3.app.render(); }
        }),
        h('span.v3-goal-unit', V3.t('unit.levels', { n: current }))
      ]),

      advice && advice.best ? h('div.v3-cs-verdict', [
        V3.t('cs.verdict', {
          n: advice.best.levels,
          weeks: V3.num.weeks(advice.best.weeks),
          none: V3.num.weeks(advice.baseline ? advice.baseline.weeks : 0)
        }),
        advice.saved > 0 ? h('strong', ' ' + V3.t('cs.saved', {
          saved: V3.num.weeks(advice.saved)
        })) : null
      ]) : h('div.v3-cs-verdict', V3.t('cs.hint')),

      // Show the neighbouring options: the bottom of this curve is often flat,
      // and a cheaper plan one step away is worth seeing.
      advice && advice.curve.length > 1 ? h('div.v3-cs-alts',
        advice.curve
          .filter(function (row) {
            return Math.abs(row.levels - advice.best.levels) <= 3 || row.levels === 0;
          })
          .map(function (row) {
            return h('button.v3-cs-alt' + (row.levels === advice.best.levels ? '.is-best' : ''), {
              type: 'button',
              title: V3.t('cs.altTip', {
                cost: V3.num.int(row.cost), workers: V3.num.pop(row.workers)
              }),
              onclick: function () { V3.app.setConstructionSectors(row.levels); V3.app.render(); }
            }, row.levels + ' → ' + V3.num.weeks(row.weeks));
          })
      ) : null
    ]);
  }

  /** Offer to drop producers the solver found no work for. */
  function pruneBlock() {
    var sol = V3.app.state.solution;
    if (!sol || !sol.unused || !sol.unused.length) return null;
    return h('div.v3-alert.v3-alert-warn', [
      h('span.v3-alert-mark', '△'),
      h('span.v3-alert-text', V3.t('chain.unusedBuildings', { n: sol.unused.length })),
      C.button(V3.t('chain.cleanUp'), function () {
        var n = V3.app.pruneUnused();
        C.toast(V3.t('chain.cleanedUp', { n: n }));
      }, { kind: 'tiny' })
    ]);
  }

  // ===========================================================================
  // RIGHT: the goods ledger
  // ===========================================================================

  function ledgerPanel() {
    var sol = V3.app.state.solution;
    if (!sol) return h('div.v3-ledger-panel');

    var rows = Object.keys(sol.goods)
      .map(function (g) { return sol.goods[g]; })
      .filter(function (r) { return r.produced || r.consumed || r.imported || r.finalDemand; });

    // Problems first, then the biggest flows. A balanced row is the boring case.
    rows = V3.util.sortBy(rows, function (r) {
      var rank = r.deficit > 0.05 ? 0 : (r.surplus > 0.05 ? 1 : 2);
      return rank * 1e9 - (r.produced + r.imported);
    });

    /** Never print "-0". Below the solver's own tolerance it IS zero. */
    function amount(v) {
      return Math.abs(v) < 0.05 ? '—' : V3.num.fmt(v, 0);
    }

    return C.panel(V3.t('ledger.title'), [
      h('table.v3-ledger', [
        h('colgroup', [
          h('col.c-icon'), h('col.c-name'),
          h('col.c-num'), h('col.c-num'), h('col.c-num')
        ]),
        h('thead', h('tr', [
          h('th', { colspan: 2 }, V3.t('ledger.good')),
          h('th.v3-num', { title: V3.t('ledger.madeTip') }, V3.t('ledger.made')),
          h('th.v3-num', { title: V3.t('ledger.usedTip') }, V3.t('ledger.used')),
          h('th.v3-num', { title: V3.t('ledger.balanceTip') }, V3.t('ledger.balance'))
        ])),
        h('tbody', rows.map(function (r) {
          var cls = r.deficit > 0.05 ? '.is-deficit' : (r.surplus > 0.05 ? '.is-surplus' : '');
          var incoming = r.produced + r.imported;
          var outgoing = r.consumed + r.finalDemand;
          return h('tr' + cls, [
            h('td', C.icon(r.good, 22)),
            h('td', h('span.v3-ledger-name', {
              title: V3.i18n.name(r.good)
            }, [
              V3.i18n.name(r.good),
              r.imported > 0.05
                ? C.pill(V3.num.fmt(r.imported, 0), 'import', V3.t('ledger.boughtTip'))
                : null
            ])),
            h('td.v3-num', { title: V3.t('ledger.madeTip') }, amount(incoming)),
            h('td.v3-num', { title: V3.t('ledger.usedTip') }, amount(outgoing)),
            h('td.v3-num.v3-balance', amount(r.balance))
          ]);
        }))
      ]),
      h('div.v3-ledger-legend', [
        h('span.lg-deficit', V3.t('ledger.legendDeficit')),
        h('span.lg-surplus', V3.t('ledger.legendSurplus')),
        h('span.lg-balanced', V3.t('ledger.legendBalanced'))
      ]),
      C.formula('surplus')
    ], { className: 'v3-ledger-panel' });
  }

  // ===========================================================================
  // RIGHT: who is going to work in all this?
  // ===========================================================================

  /**
   * "How many people" is only half the question. Victoria 3 hires PROFESSIONS,
   * and the ones that need education are the ones you will actually run out of.
   * So this panel splits the whole chain by social class, names every
   * profession, and marks the ones your literacy has to cover.
   */
  function workforcePanel() {
    var sol = V3.app.state.solution;
    if (!sol) return h('div.v3-workforce-panel');

    var jobs = sol.totals.jobs;
    var jobIds = Object.keys(jobs);
    var total = sol.totals.workers || 0;

    if (!jobIds.length) {
      return C.panel(V3.t('workforce.title'), C.empty(V3.t('chain.noGoals')),
        { className: 'v3-workforce-panel' });
    }

    var STRATA = ['poor', 'middle', 'upper'];
    var byStrata = V3.util.groupBy(jobIds, function (p) {
      var pop = V3.db.pop(p);
      return (pop && pop.strata) || 'poor';
    });

    var educated = V3.util.sum(jobIds, function (p) {
      var pop = V3.db.pop(p);
      return (pop && pop.qualification === 'educated') ? jobs[p] : 0;
    });

    var country = V3.userdata.get('country', {});
    var workforceAvailable = (country.population || 0) * 0.33;
    var literateAvailable = workforceAvailable * ((country.literacyPct || 0) / 100);

    return C.panel(V3.t('workforce.title'), [
      h('div.v3-wf-total', [
        C.icon({ id: 'Panel_pops', icon: 'Panel_pops', name: V3.t('sum.workers') }, 30),
        h('span.v3-wf-total-n', V3.num.pop(total)),
        h('span.v3-wf-total-l', V3.t('workforce.totalLabel'))
      ]),

      C.bar(STRATA.map(function (s) {
        return {
          value: sol.totals.jobsByStrata[s] || 0,
          label: V3.t('strata.' + s),
          color: 'var(--strata-' + s + ')'
        };
      }), { tall: true }),

      STRATA.map(function (s) {
        var list = byStrata[s];
        if (!list || !list.length) return null;
        var sum = V3.util.sum(list, function (p) { return jobs[p]; });
        return h('div.v3-wf-strata.is-' + s, [
          h('div.v3-wf-strata-head', [
            h('span', V3.t('strata.' + s)),
            h('em', total ? Math.round(sum / total * 100) + '%' : ''),
            h('strong', V3.num.pop(sum))
          ]),
          h('ul.v3-wf-jobs', V3.util.sortBy(list, function (p) { return -jobs[p]; })
            .map(function (p) {
              var pop = V3.db.safe('pop', p);
              var isEdu = pop.qualification === 'educated';
              return h('li.v3-wf-job' + (isEdu ? '.is-educated' : ''), [
                C.icon(pop, 20),
                h('span.v3-wf-job-name', V3.i18n.name(pop)),
                pop.qualification && pop.qualification !== 'none'
                  ? h('span.v3-wf-job-qual', V3.t('pop.qual.' + pop.qualification))
                  : null,
                h('span.v3-wf-job-n', V3.num.pop(jobs[p]))
              ]);
            }))
        ]);
      }),

      // The check people actually need: can your country staff this at all?
      country.population > 0 ? h('div.v3-wf-check', [
        C.rule(V3.t('workforce.canYouStaffIt')),
        checkLine(V3.t('workforce.anyWorkers'), total, workforceAvailable),
        checkLine(V3.t('workforce.educatedWorkers'), educated, literateAvailable)
      ]) : h('p.v3-hint', V3.t('workforce.enterPopulation')),

      C.formula('employment')
    ], { className: 'v3-workforce-panel' });
  }

  function checkLine(label, need, have) {
    var ok = need <= have;
    return h('div.v3-bill-line' + (ok ? '' : '.is-strong'), [
      h('span', label),
      h('span' + (ok ? '.is-good' : '.is-bad'),
        V3.num.pop(need) + ' / ' + V3.num.pop(have))
    ]);
  }

})(window.V3);
