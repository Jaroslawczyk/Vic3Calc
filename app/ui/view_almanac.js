/* ============================================================================
 * app/ui/view_almanac.js - The Almanac screen.
 * ---------------------------------------------------------------------------
 * EN: A guide that cannot go stale. The worked examples are not screenshots or
 *     typed-in numbers - each {t:'chain'} block runs the real solver against
 *     the real tables when you open the page. Edit a production method in the
 *     Data tab and the Almanac's example updates with it.
 *
 * RU: Руководство, которое не может устареть. Разобранные примеры - не
 *     скриншоты и не вписанные руками числа: каждый блок {t:'chain'} при
 *     открытии страницы прогоняет настоящий решатель по настоящим таблицам.
 *     Измените метод производства во вкладке "Данные" - пример в альманахе
 *     обновится вместе с ним.
 * ==========================================================================*/
(function (V3) {
  'use strict';

  var h = V3.h;
  var C = V3.ui;
  var View = V3.views.almanac = {};

  var CATEGORIES = ['basics', 'mechanics', 'strategy', 'war', 'about'];
  var current = null;

  View.render = function () {
    var articles = V3.db.almanacs();
    if (!current || !articles.some(function (a) { return a.id === current; })) {
      current = articles.length ? articles[0].id : null;
    }

    return h('div.v3-almanac', [
      h('aside.v3-alm-nav', CATEGORIES.map(function (cat) {
        var list = articles.filter(function (a) { return a.category === cat; });
        if (!list.length) return null;
        return h('div.v3-alm-cat', [
          C.rule(V3.t('alm.cat.' + cat)),
          h('ul', list.map(function (a) {
            return h('li', h('button.v3-alm-link' + (a.id === current ? '.is-active' : ''), {
              type: 'button',
              onclick: function () { current = a.id; V3.app.render(); }
            }, [
              C.icon(a, 24),
              h('span', V3.t('alm.' + a.id + '.title'))
            ]));
          }))
        ]);
      })),
      h('article.v3-alm-body', current ? renderArticle(V3.db.almanac(current)) : C.empty('—'))
    ]);
  };

  function renderArticle(a) {
    if (!a) return C.empty('—');
    return [
      h('header.v3-alm-head', [
        C.icon(a, 56),
        h('div', [
          h('h1', V3.t('alm.' + a.id + '.title')),
          h('p.v3-alm-lede', V3.t('alm.' + a.id + '.lede'))
        ])
      ]),
      h('div.v3-alm-content', (a.blocks || []).map(function (b) { return block(b, a); }))
    ];
  }

  function block(b, article) {
    switch (b.t) {
      case 'p':
        return h('p.v3-alm-p', V3.t(b.k));

      case 'tip':
        return h('div.v3-note.is-tip', [h('span.v3-note-mark', '✔'), h('p', V3.t(b.k))]);

      case 'warn':
        return h('div.v3-note.is-warn', [h('span.v3-note-mark', '!'), h('p', V3.t(b.k))]);

      case 'steps':
        return h('ol.v3-alm-steps', range(b.n).map(function (i) {
          return h('li', V3.t(b.k + '.' + (i + 1)));
        }));

      case 'goods':
        return h('div.v3-qty-row', (b.items || []).map(function (it) {
          return C.goodAmount(it.good, it.n, { size: 28, showName: true });
        }));

      case 'formula':
        return formulaCard(b.id);

      case 'allFormulas':
        return h('div.v3-formula-list', V3.formulas.all().map(function (f) {
          return formulaCard(f.id);
        }));

      case 'compare':
        return h('div.v3-compare', range(b.rows).map(function (i) {
          return h('div.v3-compare-row', [
            h('div.v3-compare-a', V3.t(b.k + '.' + (i + 1) + '.a')),
            h('div.v3-compare-b', V3.t(b.k + '.' + (i + 1) + '.b'))
          ]);
        }));

      case 'table':
        return h('table.v3-alm-table', [
          h('thead', h('tr', range(b.head).map(function (c) {
            return h('th', V3.t(b.k + '.h' + (c + 1)));
          }))),
          h('tbody', range(b.rows).map(function (r) {
            return h('tr', range(b.head).map(function (c) {
              return h('td', V3.t(b.k + '.r' + (r + 1) + 'c' + (c + 1)));
            }));
          }))
        ]);

      case 'chain':
        return liveExample(b);

      default:
        return null;
    }
  }

  function formulaCard(id) {
    var f = V3.formulas.get(id);
    if (!f) return null;
    return h('div.v3-formula-card', [
      h('code.v3-formula-expr', f.expr),
      h('p.v3-formula-note', V3.formulas.explain(id)),
      h('span.v3-formula-file', f.file)
    ]);
  }

  /**
   * A worked example, computed live. This is the block that makes the guide
   * trustworthy: it uses the same solver as the Calculator, so if the numbers
   * here look wrong, the app IS wrong - and you can go fix the table.
   */
  function liveExample(b) {
    var ctx = V3.app.ctx();
    var good = V3.db.safe('good', b.good);
    var plan, sol;
    try {
      plan = V3.Solver.autoPlan(ctx, b.good, b.amount, {});
      sol = V3.Solver.solve(ctx, plan);
    } catch (e) {
      return h('div.v3-alert.v3-alert-warn', V3.t('alm.exampleFailed'));
    }

    var order = V3.Construction.order(ctx, sol, 'fastest');
    var econ = V3.Economy.solution(ctx, sol);

    return h('figure.v3-example', [
      h('figcaption.v3-example-cap', [
        C.icon(good, 30),
        h('strong', V3.t('alm.exampleTitle', {
          n: V3.num.fmt(b.amount, 0), good: V3.i18n.name(good)
        })),
        h('span.v3-example-era', V3.t('era.' + ctx.era))
      ]),

      h('div.v3-example-stats', [
        exStat(V3.num.int(sol.totals.levels), V3.t('sum.levels')),
        exStat(V3.num.pop(sol.totals.workers), V3.t('sum.workers')),
        exStat(V3.num.int(sol.totals.constructionCost), V3.t('sum.buildCost')),
        exStat(V3.num.moneySigned(econ.netProfit), V3.t('sum.profit'))
      ]),

      h('ol.v3-example-order', order.map(function (row) {
        var n = row.node;
        var bl = n.building || V3.db.safe('building', n.buildingId);
        return h('li.v3-example-step', [
          h('span.v3-example-num', row.step),
          C.icon(bl, 28),
          h('span.v3-example-name', V3.i18n.name(bl)),
          h('span.v3-example-count', '×' + V3.num.buildings(n.levelsExact))
        ]);
      })),

      h('div.v3-example-actions', [
        C.button(V3.t('alm.openInCalc'), function () {
          V3.app.addTarget(b.good, b.amount);
          V3.app.go('chain');
        }, { kind: 'primary' })
      ]),

      h('p.v3-example-note', V3.t('alm.exampleNote'))
    ]);
  }

  function exStat(value, label) {
    return h('div.v3-example-stat', [
      h('span.v3-example-stat-n', value),
      h('span.v3-example-stat-l', label)
    ]);
  }

  function range(n) {
    var out = [];
    for (var i = 0; i < (n || 0); i++) out.push(i);
    return out;
  }

})(window.V3);
