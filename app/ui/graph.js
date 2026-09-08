/* ============================================================================
 * app/ui/graph.js - The zoomable production-chain diagram.
 * ---------------------------------------------------------------------------
 * EN: Two layers stacked inside one transformed container:
 *
 *       <svg>   the arrows        - curves are far easier in SVG
 *       <div>   the building cards - images and text are far easier in HTML
 *
 *     Both get the SAME `translate(...) scale(...)`, so one wheel event zooms
 *     the picture as a whole and the arrows never drift off their boxes.
 *     Cards are measured after they are in the DOM, then the arrows are drawn
 *     to the measured edges - no guessing at heights.
 *
 *     LAYOUT: columns are dependency depth. Raw materials on the left, the
 *     thing you asked for on the right; that is the same left-to-right reading
 *     order as the game's own production tooltips.
 *
 *     Loops in the chain (steel -> tools -> steel) get a dashed "back edge" so
 *     you can see the loop instead of the layout pretending it is a tree.
 *
 * RU: Два слоя в одном преобразуемом контейнере:
 *
 *       <svg>   стрелки          - кривые проще рисовать в SVG
 *       <div>   карточки зданий  - картинки и текст проще в HTML
 *
 *     Оба получают ОДИН И ТОТ ЖЕ `translate(...) scale(...)`, поэтому одно
 *     движение колеса масштабирует картинку целиком, и стрелки не съезжают.
 *     Карточки измеряются после вставки в DOM, и только потом рисуются стрелки.
 *
 *     РАСКЛАДКА: колонки - это глубина зависимости. Сырьё слева, то, что вы
 *     заказали - справа. Тот же порядок чтения, что и во всплывающих
 *     подсказках производства в самой игре.
 *
 *     Циклы (сталь -> инструменты -> сталь) рисуются пунктирной "обратной
 *     стрелкой", чтобы цикл было видно.
 * ==========================================================================*/
(function (V3) {
  'use strict';

  var h = V3.h;
  var G = V3.graph = {};

  var NODE_W = 250;
  var COL_GAP = 120;
  var ROW_GAP = 28;

  var viewport, canvas, svg, nodesLayer;
  var state = { zoom: 1, x: 40, y: 40, dragging: false, lastX: 0, lastY: 0 };
  var lastSolution = null;
  var lastInfo = null;

  /**
   * Cards you have dragged, by building id. The automatic layout is only a
   * starting point - once you move a card we remember where you put it and
   * stop second-guessing you, until you press "reset view".
   */
  var customPos = {};
  var cardDrag = null;   // { id, el, startX, startY, originX, originY }

  // ---------------------------------------------------------------------------
  // PUBLIC
  // ---------------------------------------------------------------------------

  G.create = function () {
    svg = h('svg.v3-graph-edges', { xmlns: 'http://www.w3.org/2000/svg' });
    nodesLayer = h('div.v3-graph-nodes');
    canvas = h('div.v3-graph-canvas', [svg, nodesLayer]);
    viewport = h('div.v3-graph-viewport', [canvas, controls()]);

    viewport.addEventListener('wheel', onWheel, { passive: false });
    viewport.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);

    applyTransform();
    return viewport;
  };

  G.setSolution = function (solution) {
    lastSolution = solution;
    G.draw();
  };

  G.zoomBy = function (factor, cx, cy) {
    var old = state.zoom;
    var next = V3.util.clamp(old * factor, 0.25, 2.5);
    if (next === old) return;
    // Keep the point under the cursor fixed while zooming.
    if (cx != null) {
      state.x = cx - (cx - state.x) * (next / old);
      state.y = cy - (cy - state.y) * (next / old);
    }
    state.zoom = next;
    applyTransform();
  };

  G.reset = function () {
    state.zoom = 1; state.x = 40; state.y = 40;
    customPos = {};              // also forget hand-placed cards
    applyTransform();
    G.draw();
  };

  /** Zoom so the whole chain is visible. */
  G.fit = function () {
    if (!viewport) return;
    var b = contentBounds();
    if (!b.w || !b.h) return;
    var pad = 60;
    var zx = (viewport.clientWidth - pad * 2) / b.w;
    var zy = (viewport.clientHeight - pad * 2) / b.h;
    state.zoom = V3.util.clamp(Math.min(zx, zy), 0.25, 1.4);
    state.x = pad - b.x * state.zoom + (viewport.clientWidth - pad * 2 - b.w * state.zoom) / 2;
    state.y = pad - b.y * state.zoom;
    applyTransform();
  };

  // ---------------------------------------------------------------------------
  // INTERACTION
  // ---------------------------------------------------------------------------

  function controls() {
    return h('div.v3-graph-controls', [
      btn('+', V3.t('graph.zoomIn'), function () { G.zoomBy(1.2); }),
      btn('−', V3.t('graph.zoomOut'), function () { G.zoomBy(1 / 1.2); }),
      btn('⤢', V3.t('graph.fit'), G.fit),
      btn('⟲', V3.t('graph.reset'), G.reset)
    ]);
  }

  function btn(label, title, fn) {
    return h('button.v3-graph-btn', { type: 'button', title: title, onclick: fn }, label);
  }

  function onWheel(e) {
    e.preventDefault();
    var r = viewport.getBoundingClientRect();
    G.zoomBy(e.deltaY < 0 ? 1.12 : 1 / 1.12, e.clientX - r.left, e.clientY - r.top);
  }

  function onDown(e) {
    // Anything interactive keeps its normal behaviour.
    if (e.target.closest && e.target.closest('.v3-graph-controls, button, select, input, a')) return;

    // Grabbing a card moves that card; grabbing the background pans the view.
    var card = e.target.closest && e.target.closest('.v3-gnode');
    if (card) {
      cardDrag = {
        id: card.dataset.building,
        el: card,
        startX: e.clientX,
        startY: e.clientY,
        originX: card.offsetLeft,
        originY: card.offsetTop
      };
      card.classList.add('is-grabbed');
      return;
    }

    state.dragging = true;
    state.lastX = e.clientX; state.lastY = e.clientY;
    viewport.classList.add('is-dragging');
  }

  var edgeFrame = null;

  function onMove(e) {
    if (cardDrag) {
      // Divide by the zoom: at 50% the pointer travels twice as far as the card.
      var dx = (e.clientX - cardDrag.startX) / state.zoom;
      var dy = (e.clientY - cardDrag.startY) / state.zoom;
      var nx = Math.max(0, cardDrag.originX + dx);
      var ny = Math.max(0, cardDrag.originY + dy);
      cardDrag.el.style.left = nx + 'px';
      cardDrag.el.style.top = ny + 'px';
      customPos[cardDrag.id] = { x: nx, y: ny };

      // Redraw the arrows against measured card positions, once per frame, so
      // the lines follow the card instead of snapping back afterwards.
      if (!edgeFrame) {
        edgeFrame = true;
        V3.app.schedule(function () {
          edgeFrame = null;
          if (lastSolution && lastInfo) drawEdges(lastSolution, lastInfo, measurePositions());
        });
      }
      return;
    }

    if (!state.dragging) return;
    state.x += e.clientX - state.lastX;
    state.y += e.clientY - state.lastY;
    state.lastX = e.clientX; state.lastY = e.clientY;
    applyTransform();
  }

  function onUp() {
    if (cardDrag) {
      cardDrag.el.classList.remove('is-grabbed');
      cardDrag = null;
      if (lastSolution && lastInfo) drawEdges(lastSolution, lastInfo, measurePositions());
    }
    state.dragging = false;
    if (viewport) viewport.classList.remove('is-dragging');
  }

  /** Read every card's real box out of the DOM. Measured, never assumed. */
  function measurePositions() {
    var pos = {};
    V3.h.$$('.v3-gnode', nodesLayer).forEach(function (el) {
      pos[el.dataset.building] = {
        x: el.offsetLeft, y: el.offsetTop,
        w: el.offsetWidth, h: el.offsetHeight
      };
    });
    return pos;
  }

  function applyTransform() {
    if (!canvas) return;
    canvas.style.transform = 'translate(' + state.x + 'px,' + state.y + 'px) scale(' + state.zoom + ')';
    V3.app.state.graph = { zoom: state.zoom, panX: state.x, panY: state.y };
  }

  function contentBounds() {
    var maxX = 0, maxY = 0;
    V3.h.$$('.v3-gnode', nodesLayer).forEach(function (el) {
      maxX = Math.max(maxX, el.offsetLeft + el.offsetWidth);
      maxY = Math.max(maxY, el.offsetTop + el.offsetHeight);
    });
    return { x: 0, y: 0, w: maxX, h: maxY };
  }

  // ---------------------------------------------------------------------------
  // LAYOUT
  // ---------------------------------------------------------------------------

  /**
   * Depth = how far a building is from raw materials.
   * Computed with a bounded walk so a cyclic chain cannot hang the UI.
   */
  function computeDepths(solution) {
    var nodes = solution.nodes;
    var producerOf = {};
    nodes.forEach(function (n) {
      Object.keys(n.outputs).forEach(function (g) {
        if (n.outputs[g] > 0 && !producerOf[g]) producerOf[g] = n.buildingId;
      });
    });

    var depth = {};
    nodes.forEach(function (n) { depth[n.buildingId] = 0; });

    for (var pass = 0; pass < nodes.length + 2; pass++) {
      var moved = false;
      nodes.forEach(function (n) {
        var d = 0;
        Object.keys(n.inputs).forEach(function (g) {
          var p = producerOf[g];
          if (p && p !== n.buildingId) d = Math.max(d, depth[p] + 1);
        });
        if (d > depth[n.buildingId]) { depth[n.buildingId] = d; moved = true; }
      });
      if (!moved) break;
    }
    return { depth: depth, producerOf: producerOf };
  }

  // ---------------------------------------------------------------------------
  // DRAW
  // ---------------------------------------------------------------------------

  G.draw = function () {
    if (!nodesLayer) return;
    h.fill(nodesLayer, null);
    h.fill(svg, null);

    var solution = lastSolution;
    if (!solution || !solution.nodes.length) {
      h.fill(nodesLayer, h('div.v3-graph-empty', V3.t('chain.emptyHint')));
      return;
    }

    var info = computeDepths(solution);
    lastInfo = info;

    var byDepth = V3.util.groupBy(solution.nodes, function (n) { return info.depth[n.buildingId]; });
    var cols = Object.keys(byDepth).map(Number).sort(function (a, b) { return a - b; });

    var colX = 0;
    cols.forEach(function (d) {
      var colNodes = byDepth[d];
      var y = 0;
      colNodes.forEach(function (n) {
        var card = nodeCard(n, solution);
        var moved = customPos[n.buildingId];
        card.style.left = (moved ? moved.x : colX) + 'px';
        card.style.top = (moved ? moved.y : y) + 'px';
        nodesLayer.appendChild(card);
        // Cards vary a lot in height with how many inputs a building has, so
        // the automatic column advances by the MEASURED height. A card you
        // moved yourself no longer takes part in that stacking.
        if (!moved) y += card.offsetHeight + ROW_GAP;
      });
      colX += NODE_W + COL_GAP;
    });

    drawEdges(solution, info, measurePositions());
  };

  function drawEdges(solution, info, pos) {
    var maxX = 0, maxY = 0;
    Object.keys(pos).forEach(function (k) {
      maxX = Math.max(maxX, pos[k].x + pos[k].w);
      maxY = Math.max(maxY, pos[k].y + pos[k].h);
    });
    svg.setAttribute('width', maxX + 40);
    svg.setAttribute('height', maxY + 40);

    var defs = h('defs', [
      h('marker', {
        id: 'v3-arrow', viewBox: '0 0 10 10', refX: 9, refY: 5,
        markerWidth: 7, markerHeight: 7, orient: 'auto-start-reverse'
      }, h('path', { d: 'M 0 0 L 10 5 L 0 10 z', fill: 'var(--edge)' })),
      h('marker', {
        id: 'v3-arrow-back', viewBox: '0 0 10 10', refX: 9, refY: 5,
        markerWidth: 7, markerHeight: 7, orient: 'auto-start-reverse'
      }, h('path', { d: 'M 0 0 L 10 5 L 0 10 z', fill: 'var(--edge-back)' }))
    ]);
    svg.appendChild(defs);

    solution.nodes.forEach(function (n) {
      var to = pos[n.buildingId];
      if (!to) return;
      Object.keys(n.inputs).forEach(function (g) {
        if (n.inputs[g] <= 0) return;
        var srcId = info.producerOf[g];
        if (!srcId || srcId === n.buildingId) return;
        var from = pos[srcId];
        if (!from) return;

        var isBack = from.x >= to.x;               // a loop in the chain
        var x1 = from.x + from.w, y1 = from.y + from.h / 2;
        var x2 = to.x,            y2 = to.y + to.h / 2;

        var d;
        if (isBack) {
          // Route a back edge under the cards so it is readable.
          var dip = Math.max(from.y + from.h, to.y + to.h) + 34;
          d = 'M ' + (from.x + from.w / 2) + ' ' + (from.y + from.h) +
              ' C ' + (from.x + from.w / 2) + ' ' + dip + ', ' +
                      (to.x + to.w / 2) + ' ' + dip + ', ' +
                      (to.x + to.w / 2) + ' ' + (to.y + to.h);
        } else {
          var mid = (x1 + x2) / 2;
          d = 'M ' + x1 + ' ' + y1 + ' C ' + mid + ' ' + y1 + ', ' + mid + ' ' + y2 + ', ' + x2 + ' ' + y2;
        }

        svg.appendChild(h('path.v3-edge' + (isBack ? '.is-back' : ''), {
          d: d,
          'marker-end': isBack ? 'url(#v3-arrow-back)' : 'url(#v3-arrow)'
        }));

        // Label the arrow with the good and how much flows along it.
        var lx = isBack ? (from.x + to.x + to.w) / 2 : (x1 + x2) / 2;
        var ly = isBack ? Math.max(from.y + from.h, to.y + to.h) + 34 : (y1 + y2) / 2;
        var good = V3.db.safe('good', g);
        var iconUrl = V3.icons.url(good.icon);
        var grp = h('g.v3-edge-label', { transform: 'translate(' + lx + ',' + ly + ')' }, [
          h('rect', { x: -34, y: -13, width: 68, height: 26, rx: 4 }),
          iconUrl ? h('image', { href: iconUrl, x: -30, y: -10, width: 20, height: 20 }) : null,
          h('text', { x: -6, y: 5 }, V3.num.fmt(n.inputs[g], 0))
        ]);
        svg.appendChild(grp);
      });
    });
  }

  // ---------------------------------------------------------------------------
  // ONE BUILDING CARD
  // ---------------------------------------------------------------------------

  function nodeCard(n, solution) {
    var b = n.building || V3.db.safe('building', n.buildingId);
    var group = V3.db.buildingGroup(b.group);
    var economy = V3.app.state.economy && V3.app.state.economy.perNode[n.buildingId];

    var jobs = Object.keys(n.jobs);
    var strataColors = { poor: 'var(--strata-poor)', middle: 'var(--strata-middle)', upper: 'var(--strata-upper)' };

    return h('article.v3-gnode', {
      style: { width: NODE_W + 'px', borderTopColor: (group && group.color) || 'var(--rule)' },
      dataset: { building: n.buildingId }
    }, [
      // ---- header: icon, name, how many ------------------------------------
      h('header.v3-gnode-head', [
        V3.ui.icon(b, 40),
        h('div.v3-gnode-title', [
          h('span.v3-gnode-name', [V3.i18n.name(b), V3.ui.confidence(b), V3.ui.userBadge(b)]),
          h('span.v3-gnode-group', V3.i18n.name(group || { name: '' }))
        ]),
        h('div.v3-gnode-count', {
          title: V3.t('graph.levelsTip', { exact: V3.num.fmt(n.levelsExact, 2) })
        }, [
          h('span.v3-gnode-count-n', V3.num.buildings(n.levelsExact)),
          h('span.v3-gnode-count-l', V3.t('unit.levels', { n: Math.ceil(n.levelsExact - 1e-9) }))
        ])
      ]),

      // ---- already-built / to-build ----------------------------------------
      n.existing > 0 ? h('div.v3-gnode-have', [
        V3.t('graph.have', { n: n.existing }), ' → ',
        h('strong', V3.t('graph.build', { n: n.levelsToBuild }))
      ]) : null,

      // ---- production methods ----------------------------------------------
      h('div.v3-gnode-pms', n.methods.map(function (p) {
        var grp = V3.db.safe('pmGroup', p.group);
        var locked = !V3.app.ctx().pmAvailable(p.id);
        return h('button.v3-pm' + (locked ? '.is-locked' : ''), {
          type: 'button',
          title: V3.i18n.name(grp) + ': ' + V3.i18n.name(p),
          onclick: function (e) { e.stopPropagation(); openPmPicker(n.buildingId, p.group, p.id); }
        }, [
          V3.ui.icon(p, 20),
          h('span.v3-pm-name', V3.i18n.name(p)),
          locked ? V3.ui.lockBadge(p.unlockTech) : null
        ]);
      })),

      // ---- goods in / out ---------------------------------------------------
      Object.keys(n.inputs).length ? h('div.v3-gnode-row.is-in', [
        h('span.v3-gnode-row-label', V3.t('label.consumes')),
        h('div.v3-gnode-goods', Object.keys(n.inputs).map(function (g) {
          return V3.ui.goodAmount(g, n.inputs[g], { size: 20 });
        }))
      ]) : null,

      Object.keys(n.outputs).length ? h('div.v3-gnode-row.is-out', [
        h('span.v3-gnode-row-label', V3.t('label.produces')),
        h('div.v3-gnode-goods', Object.keys(n.outputs).map(function (g) {
          return V3.ui.goodAmount(g, n.outputs[g], { size: 20 });
        }))
      ]) : null,

      // ---- workforce --------------------------------------------------------
      jobs.length ? h('div.v3-gnode-row.is-jobs', [
        h('span.v3-gnode-row-label', [
          V3.t('label.workers'), ' ',
          h('strong', V3.num.pop(V3.util.sum(jobs, function (j) { return n.jobs[j]; })))
        ]),
        h('div.v3-gnode-goods', jobs.map(function (j) {
          return V3.ui.popAmount(j, n.jobs[j], { size: 20 });
        })),
        V3.ui.bar(jobs.map(function (j) {
          var pop = V3.db.safe('pop', j);
          return { value: n.jobs[j], label: V3.i18n.name(pop), color: strataColors[pop.strata] || '#888' };
        }))
      ]) : null,

      // ---- the small print: infra, pollution, money -------------------------
      h('footer.v3-gnode-foot', [
        n.infraUsed ? chip('State_status_infrastructure', V3.num.fmt(n.infraUsed, 0), V3.t('label.infraUsed')) : null,
        n.infraProvided ? chip('State_status_infrastructure', '+' + V3.num.fmt(n.infraProvided, 0), V3.t('label.infraProvided'), 'is-good') : null,
        n.pollution ? chip('Event_industry', V3.num.fmt(n.pollution, 0), V3.t('label.pollution'), 'is-bad') : null,
        n.constructionCost ? chip('State_status_construction', V3.num.fmt(n.constructionCost, 0), V3.t('label.buildCost')) : null,
        economy ? h('span.v3-chip' + (economy.profit >= 0 ? '.is-good' : '.is-bad'), {
          title: V3.t('label.weeklyProfit')
        }, V3.num.moneySigned(economy.profit)) : null
      ])
    ]);
  }

  function chip(iconKey, text, title, cls) {
    return h('span.v3-chip' + (cls ? '.' + cls : ''), { title: title }, [
      V3.ui.icon({ icon: iconKey, id: iconKey, name: title }, 16),
      h('span', text)
    ]);
  }

  /** Clicking a method on a card opens the picker for that row. */
  function openPmPicker(buildingId, groupId, currentPmId) {
    var ctx = V3.app.ctx();
    var grp = V3.db.safe('pmGroup', groupId);
    var list = V3.db.pmsOfGroup(groupId);

    V3.ui.modal(V3.i18n.name(grp), h('div.v3-pm-list', list.map(function (p) {
      var locked = !ctx.pmAvailable(p.id);
      return h('button.v3-pm-option' +
        (p.id === currentPmId ? '.is-active' : '') + (locked ? '.is-locked' : ''), {
        type: 'button',
        onclick: function () {
          V3.app.setPM(buildingId, groupId, p.id);
          V3.ui.closeModal();
        }
      }, [
        V3.ui.icon(p, 34),
        h('div.v3-pm-option-body', [
          h('span.v3-pm-option-name', [V3.i18n.name(p), V3.ui.confidence(p)]),
          h('div.v3-pm-option-io', [
            Object.keys(p.inputs || {}).map(function (g) {
              return V3.ui.goodAmount(g, p.inputs[g], { size: 18 });
            }),
            Object.keys(p.inputs || {}).length && Object.keys(p.outputs || {}).length
              ? h('span.v3-arrow', '→') : null,
            Object.keys(p.outputs || {}).map(function (g) {
              return V3.ui.goodAmount(g, p.outputs[g], { size: 18, positive: true });
            })
          ]),
          Object.keys(p.jobs || {}).length ? h('div.v3-pm-option-jobs',
            Object.keys(p.jobs).map(function (j) {
              return V3.ui.popAmount(j, p.jobs[j], { size: 16 });
            })) : null,
          locked ? h('div.v3-pm-option-lock', V3.t('pm.needsTech', {
            tech: V3.i18n.name(V3.db.safe('tech', p.unlockTech))
          })) : null,
          p.note ? h('div.v3-pm-option-note', p.note) : null
        ])
      ]);
    })));
  }

})(window.V3);
