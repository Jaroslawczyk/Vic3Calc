/* ============================================================================
 * app/ui/app.js - The shell: state, tabs, and the recalculate loop.
 * ---------------------------------------------------------------------------
 * EN: One mutable state object, one `recalc()`, one `render()`. Views never
 *     talk to each other; they read `V3.app.state` and listen on the bus.
 *
 *     THE LOOP
 *       user changes something  ->  V3.app.patch(...)  ->  recalc()
 *         -> solver runs -> state.solution replaced
 *         -> bus 'solved' -> every open view redraws itself
 *
 *     Keeping it this dumb means a new view is ~100 lines and cannot break the
 *     others, which matters because this app is meant to be edited by whoever
 *     downloads it.
 *
 * RU: Один изменяемый объект состояния, один `recalc()`, один `render()`.
 *     Виды не общаются друг с другом: они читают `V3.app.state` и слушают шину.
 *
 *     ЦИКЛ
 *       пользователь что-то меняет -> V3.app.patch(...) -> recalc()
 *         -> отработал решатель -> state.solution заменён
 *         -> шина 'solved' -> каждый открытый вид перерисовывается
 *
 *     Такая простота означает, что новый вид - это ~100 строк, и он не может
 *     сломать остальные. Это важно: программу должен уметь править тот, кто её
 *     скачал.
 * ==========================================================================*/
(function (V3) {
  'use strict';

  var h = V3.h;
  var App = V3.app = {};

  // ---------------------------------------------------------------------------
  // STATE
  // ---------------------------------------------------------------------------
  App.state = {
    tab: 'chain',

    /** The chain being edited. Everything here is saved/exported verbatim. */
    chain: {
      id: null,
      name: '',
      era: 3,
      techs: {},                 // techId -> true/false; unset = follow era
      targets: [],               // [{good, amount}]
      producers: {},             // goodId -> buildingId
      pmChoices: {},             // buildingId -> {groupId: pmId}
      fixed: {},                 // buildingId -> pinned levels
      existing: {},              // buildingId -> already built
      imported: {},              // goodId -> weekly amount from trade
      levelsPerSite: {}          // buildingId -> levels on one site
    },

    military: {
      units: [],                 // [{buildingId, levels, pms}]
      mobilization: [],          // [pmId]
      wartime: false
    },

    research: { universityLevels: 0 },

    graph: { zoom: 1, panX: 0, panY: 0 },

    solution: null,
    economy: null,
    order: null,
    sim: null,

    /** Result of the last "how many construction sectors?" search. */
    constructionAdvice: null
  };

  var TABS = [
    { id: 'chain',     icon: 'Lens_button_production',  key: 'tab.chain' },
    { id: 'buildings', icon: 'Building_urban_center',   key: 'tab.buildings' },
    { id: 'goods',     icon: 'Market_industrial_goods', key: 'tab.goods' },
    { id: 'military',  icon: 'Lens_button_military',    key: 'tab.military' },
    { id: 'almanac',   icon: 'Panel_technology',        key: 'tab.almanac' },
    { id: 'data',      icon: 'Panel_pops',              key: 'tab.data' },
    { id: 'settings',  icon: 'Building_government_administration', key: 'tab.settings' }
  ];

  // ---------------------------------------------------------------------------
  // CONTEXT + RECALC
  // ---------------------------------------------------------------------------

  App.ctx = function () {
    return V3.Context.create({
      era: App.state.chain.era,
      techs: App.state.chain.techs
    });
  };

  var recalcPending = false;

  /**
   * Defer the heavy work until after the current input event, so typing in a
   * number field never feels sticky.
   *
   * `requestAnimationFrame` is the right tool while the window is on screen -
   * and completely the wrong one when it is not, because browsers stop firing
   * frames for a hidden or minimised window. The recalculation would then sit
   * pending indefinitely and the app would look frozen on return. So we fall
   * back to a timer whenever the document is hidden.
   */
  function schedule(fn) {
    if (typeof requestAnimationFrame === 'function' && !document.hidden) requestAnimationFrame(fn);
    else setTimeout(fn, 0);
  }

  /** Shared by views that need to draw after layout. */
  App.schedule = schedule;

  App.recalc = function () {
    if (recalcPending) return;
    recalcPending = true;
    schedule(function () {
      recalcPending = false;
      doRecalc();
    });
  };

  function doRecalc() {
    var ctx = App.ctx();
    var c = App.state.chain;

    try {
      var solution = V3.Solver.solve(ctx, {
        targets: c.targets,
        producers: c.producers,
        pmChoices: c.pmChoices,
        fixed: c.fixed,
        existing: c.existing,
        imported: c.imported,
        levelsPerSite: c.levelsPerSite
      });

      App.state.solution = solution;
      App.state.economy = V3.Economy.solution(ctx, solution);
      App.state.order = V3.Construction.order(ctx, solution, V3.userdata.get('buildOrderMode'));
      App.state.sim = V3.Construction.simulate(ctx, App.state.order);
    } catch (e) {
      console.error('[V3] solver failed', e);
      V3.ui.toast(V3.t('error.solverFailed'), 'error');
      App.state.solution = null;
    }

    V3.bus.emit('solved', App.state.solution);
  }

  /** Mutate the chain and recompute. Every edit in the UI goes through here. */
  App.patch = function (fn) {
    fn(App.state.chain);
    App.recalc();
    V3.bus.emit('chain:changed', App.state.chain);
  };

  // ---------------------------------------------------------------------------
  // CHAIN OPERATIONS shared by several views
  // ---------------------------------------------------------------------------

  /** Add a target good and auto-fill every producer behind it. */
  App.addTarget = function (goodId, amount) {
    var ctx = App.ctx();
    var plan = V3.Solver.autoPlan(ctx, goodId, amount, {
      imported: App.state.chain.imported
    });
    App.patch(function (c) {
      var existingTarget = c.targets.filter(function (t) { return t.good === goodId; })[0];
      if (existingTarget) existingTarget.amount = amount;
      else c.targets.push({ good: goodId, amount: amount });
      // Fill in only the producers not already decided, so the user's own
      // choices survive adding a second target.
      Object.keys(plan.producers).forEach(function (g) {
        if (!c.producers[g]) c.producers[g] = plan.producers[g];
      });
    });
  };

  App.removeTarget = function (goodId) {
    App.patch(function (c) {
      c.targets = c.targets.filter(function (t) { return t.good !== goodId; });
    });
  };

  /**
   * Say how much of a good you buy in per week rather than make.
   *
   * The producer is deliberately LEFT IN PLACE. Buying 40 of the 100 coal you
   * need is a normal thing to want, and the solver already subtracts imports
   * from demand before sizing the mine - so a partial purchase simply shrinks
   * the mine. Buy enough to cover everything and the mine drops to zero levels
   * and disappears from the plan on its own.
   */
  App.setImported = function (goodId, amount) {
    App.patch(function (c) {
      if (amount == null) delete c.imported[goodId];
      else c.imported[goodId] = Math.max(0, amount);
    });
  };

  /** Buy this good instead of making it at all: drop the producer too. */
  App.buyInsteadOfMaking = function (goodId, amount) {
    App.patch(function (c) {
      c.imported[goodId] = Math.max(0, amount || 0);
      delete c.producers[goodId];
    });
  };

  /**
   * Remove producers that the solver found nothing for. These accumulate as
   * you edit: drop a target and the buildings that only existed to feed it are
   * left behind at zero levels.
   */
  App.pruneUnused = function () {
    var sol = App.state.solution;
    if (!sol || !sol.unused || !sol.unused.length) return 0;
    var dropped = sol.unused.slice();
    App.patch(function (c) {
      dropped.forEach(function (b) {
        Object.keys(c.producers).forEach(function (g) {
          if (c.producers[g] === b) delete c.producers[g];
        });
        delete c.pmChoices[b];
        delete c.levelsPerSite[b];
      });
    });
    return dropped.length;
  };

  /**
   * Work out how many construction sector levels are actually worth building
   * and pin that many. See engine/construction.js for why this needs a full
   * re-solve per candidate rather than a formula.
   */
  App.suggestConstructionSectors = function () {
    var ctx = App.ctx();
    var c = App.state.chain;

    var base = {
      targets: c.targets,
      producers: V3.util.deepClone(c.producers),
      pmChoices: c.pmChoices,
      fixed: V3.util.deepClone(c.fixed),
      existing: c.existing,
      imported: c.imported,
      levelsPerSite: c.levelsPerSite
    };
    delete base.fixed.construction_sector;
    delete base.producers.construction;

    var res = V3.Construction.suggestConstructionSectors(ctx, base);
    App.state.constructionAdvice = res;
    if (res.best) App.setConstructionSectors(res.best.levels);
    return res;
  };

  /** Pin a number of construction sector levels (0 removes them). */
  App.setConstructionSectors = function (n) {
    var ctx = App.ctx();
    App.patch(function (c) {
      if (!n) {
        delete c.fixed.construction_sector;
        delete c.producers.construction;
        return;
      }
      c.fixed.construction_sector = n;
      c.producers.construction = 'construction_sector';
      V3.Solver.expandInputs(ctx, c, 'construction_sector', ['construction']);
    });
  };

  App.setProducer = function (goodId, buildingId) {
    App.patch(function (c) {
      if (!buildingId) { delete c.producers[goodId]; return; }
      c.producers[goodId] = buildingId;
      delete c.imported[goodId];
      // A newly added building brings its own input needs; fill those too.
      var ctx = App.ctx();
      var per = V3.BuildingCalc.perLevel(ctx, buildingId, c.pmChoices[buildingId]);
      Object.keys(per.inputs).forEach(function (g) {
        if (c.producers[g] || c.imported[g] != null) return;
        var plan = V3.Solver.autoPlan(ctx, g, 0, { imported: c.imported });
        Object.keys(plan.producers).forEach(function (gg) {
          if (!c.producers[gg] && c.imported[gg] == null) c.producers[gg] = plan.producers[gg];
        });
      });
    });
  };

  App.setPM = function (buildingId, groupId, pmId) {
    App.patch(function (c) {
      if (!c.pmChoices[buildingId]) c.pmChoices[buildingId] = {};
      c.pmChoices[buildingId][groupId] = pmId;
    });
  };

  /** Re-pick the best unlocked method everywhere. */
  App.upgradeAllPMs = function () {
    var ctx = App.ctx();
    App.patch(function (c) {
      Object.keys(c.producers).forEach(function (g) {
        var b = c.producers[g];
        c.pmChoices[b] = V3.Context.defaultPMs(ctx, b);
      });
      Object.keys(c.fixed).forEach(function (b) {
        c.pmChoices[b] = V3.Context.defaultPMs(ctx, b);
      });
    });
    V3.ui.toast(V3.t('chain.upgraded'));
  };

  App.clearChain = function () {
    App.patch(function (c) {
      c.id = null; c.name = '';
      c.targets = []; c.producers = {}; c.pmChoices = {};
      c.fixed = {}; c.existing = {}; c.imported = {}; c.levelsPerSite = {};
    });
  };

  // ---------------------------------------------------------------------------
  // SAVE / LOAD CHAINS
  // ---------------------------------------------------------------------------

  App.saveChain = function (name) {
    var c = V3.util.deepClone(App.state.chain);
    c.name = name || c.name || V3.t('chain.untitled');
    var saved = V3.userdata.saveChain(c);
    App.state.chain.id = saved.id;
    App.state.chain.name = saved.name;
    V3.ui.toast(V3.t('chain.saved', { name: saved.name }));
  };

  App.loadChain = function (id) {
    var c = V3.userdata.chain(id);
    if (!c) return;
    App.state.chain = V3.util.deepMerge(App.state.chain, V3.util.deepClone(c));
    App.recalc();
    V3.bus.emit('chain:changed', App.state.chain);
    V3.ui.toast(V3.t('chain.loaded', { name: c.name }));
  };

  // ---------------------------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------------------------

  App.go = function (tab) {
    App.state.tab = tab;
    App.render();
  };

  var views = V3.views = V3.views || {};

  App.render = function () {
    var root = h.$('#app');
    if (!root) return;

    h.fill(root, [
      renderHeader(),
      h('main#v3-main.v3-main', renderTab())
    ]);
  };

  function renderHeader() {
    return h('header.v3-topbar', [
      h('div.v3-brand', [
        h('span.v3-brand-mark', '⚙'),
        h('div.v3-brand-text', [
          h('span.v3-brand-title', V3.t('app.title')),
          h('span.v3-brand-sub', V3.t('app.subtitle'))
        ])
      ]),
      h('nav.v3-tabs', TABS.map(function (t) {
        var rec = { id: t.id, kind: 'tab', icon: t.icon, name: V3.t(t.key) };
        return h('button.v3-tab' + (App.state.tab === t.id ? '.is-active' : ''), {
          type: 'button', onclick: function () { App.go(t.id); }, title: V3.t(t.key)
        }, [V3.ui.icon(rec, 26), h('span', V3.t(t.key))]);
      })),
      h('div.v3-topbar-right', [
        h('select.v3-select.v3-lang', {
          onchange: function (e) {
            V3.userdata.set('lang', e.target.value);
            V3.i18n.set(e.target.value);
          }
        }, V3.i18n.available().map(function (l) {
          return h('option', { value: l.code, selected: l.code === V3.i18n.current() },
            (l.flag ? l.flag + ' ' : '') + l.name);
        }))
      ])
    ]);
  }

  function renderTab() {
    var v = views[App.state.tab];
    if (!v) return V3.ui.empty(V3.t('error.noView'));
    try {
      return v.render();
    } catch (e) {
      console.error('[V3] view "' + App.state.tab + '" failed', e);
      return h('div.v3-alert.v3-alert-error', [
        h('strong', V3.t('error.viewFailed')),
        h('pre', String(e && e.stack || e))
      ]);
    }
  }

  // ---------------------------------------------------------------------------
  // BOOT
  // ---------------------------------------------------------------------------

  App.start = function () {
    V3.userdata.load();
    V3.i18n.set(V3.userdata.get('lang', 'ru'));
    document.body.dataset.theme = V3.userdata.get('theme', 'parchment');

    // A first-run chain so the app is never an empty grey box.
    if (!App.state.chain.targets.length) {
      App.state.chain.era = 3;
      App.addTarget('clothes', 100);
    }

    V3.bus.on('lang:changed', function () { App.render(); });
    V3.bus.on('settings:changed', function () { App.recalc(); App.render(); });
    V3.bus.on('data:changed', function () { App.recalc(); });
    V3.bus.on('solved', function () {
      // Views that are cheap to update in place listen for this themselves.
      if (App.state.tab === 'chain' && views.chain && views.chain.onSolved) {
        views.chain.onSolved();
      }
    });

    App.recalc();
    App.render();
  };

})(window.V3);
