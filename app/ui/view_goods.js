/* ============================================================================
 * app/ui/view_goods.js - The goods reference.
 * ---------------------------------------------------------------------------
 * EN: Every good, its price, who makes it and who eats it. The "who eats it"
 *     column is the one worth reading before you commit to a chain: a good
 *     with many consumers is a good you can always sell, and a good with one
 *     consumer is a trap if that consumer is not yours.
 *
 * RU: Все товары: цена, кто производит и кто потребляет. Колонка "кто
 *     потребляет" - самая полезная перед началом цепочки: товар с многими
 *     потребителями всегда можно продать, а товар с единственным потребителем -
 *     ловушка, если этот потребитель не ваш.
 * ==========================================================================*/
(function (V3) {
  'use strict';

  var h = V3.h;
  var C = V3.ui;
  var View = V3.views.goods = {};

  var cat = '';

  View.render = function () {
    var cats = ['', 'staple', 'industrial', 'luxury', 'military', 'abstract'];

    return h('div.v3-browse', [
      h('div.v3-browse-bar', [
        h('div.v3-chipbar', cats.map(function (c) {
          return h('button.v3-groupchip' + (cat === c ? '.is-active' : ''), {
            type: 'button',
            onclick: function () { cat = c; V3.app.render(); }
          }, c ? V3.t('goods.cat.' + c) : V3.t('browse.all'));
        })),
        C.button(V3.t('goods.editPrices'), openPriceEditor, { kind: 'ghost' })
      ]),
      h('div.v3-goods-grid', goodCards())
    ]);
  };

  function goodCards() {
    var ctx = V3.app.ctx();

    // Precompute who produces and who consumes each good, once.
    var producers = {}, consumers = {};
    V3.db.buildings().forEach(function (b) {
      (b.pmGroups || []).forEach(function (gid) {
        V3.db.pmsOfGroup(gid).forEach(function (p) {
          Object.keys(p.outputs || {}).forEach(function (g) {
            var real = g === '__primary' ? (b.produces || [])[0] : g;
            if (!real) return;
            (producers[real] || (producers[real] = {}))[b.id] = true;
          });
          Object.keys(p.inputs || {}).forEach(function (g) {
            (consumers[g] || (consumers[g] = {}))[b.id] = true;
          });
        });
      });
    });

    return V3.db.goods()
      .filter(function (g) { return !cat || g.category === cat; })
      .map(function (g) {
        var made = Object.keys(producers[g.id] || {});
        var used = Object.keys(consumers[g.id] || {});

        return h('article.v3-gcard.is-' + g.category, [
          h('header.v3-gcard-head', [
            C.icon(g, 42),
            h('div', [
              h('h3', [V3.i18n.name(g), C.confidence(g), C.userBadge(g)]),
              h('span.v3-gcard-cat', V3.t('goods.cat.' + g.category)),
              g.aka ? h('span.v3-gcard-aka', V3.t('goods.aka', { name: g.aka })) : null
            ]),
            g.abstract ? null : h('div.v3-gcard-price', [
              h('span.v3-gcard-price-n', V3.num.money(ctx.price(g.id))),
              h('span.v3-gcard-price-l', V3.t('goods.basePrice'))
            ])
          ]),

          h('div.v3-gcard-rel', [
            h('div.v3-gcard-rel-col', [
              h('h4', V3.t('goods.madeBy', { n: made.length })),
              h('div.v3-icon-row', made.map(function (b) {
                var rec = V3.db.safe('building', b);
                return h('button.v3-icon-btn', {
                  type: 'button', title: V3.i18n.name(rec),
                  onclick: function () { V3.app.setProducer(g.id, b); C.toast(V3.t('browse.added', { name: V3.i18n.name(rec) })); }
                }, C.icon(rec, 30));
              }))
            ]),
            h('div.v3-gcard-rel-col', [
              h('h4', V3.t('goods.usedBy', { n: used.length })),
              h('div.v3-icon-row', used.map(function (b) {
                var rec = V3.db.safe('building', b);
                return h('span.v3-icon-btn', { title: V3.i18n.name(rec) }, C.icon(rec, 30));
              }))
            ])
          ]),

          h('footer.v3-gcard-foot', [
            g.abstract ? null : C.button(V3.t('goods.planThis'), function () {
              V3.app.addTarget(g.id, 100);
              V3.app.go('chain');
            }, { kind: 'primary' }),
            C.button(V3.t('browse.edit'), function () {
              V3.views.data.editRecord('good', g.id);
            }, { kind: 'ghost' })
          ])
        ]);
      });
  }

  /**
   * The price table. Typing your market's real prices in here is the single
   * highest-value thing a player can do to make the money numbers honest.
   */
  function openPriceEditor() {
    var mode = V3.userdata.get('priceMode', 'base');
    var custom = V3.util.deepClone(V3.userdata.get('customPrices', {}));

    var body = h('div.v3-price-editor', [
      h('p.v3-hint', V3.t('goods.priceHint')),
      C.select({
        label: V3.t('goods.priceMode'),
        value: mode,
        options: [
          { value: 'base', label: V3.t('goods.priceBase') },
          { value: 'custom', label: V3.t('goods.priceCustom') }
        ],
        onchange: function (v) { mode = v; }
      }),
      h('div.v3-price-grid', V3.db.goods()
        .filter(function (g) { return !g.abstract; })
        .map(function (g) {
          return h('label.v3-price-row', [
            C.icon(g, 24),
            h('span', V3.i18n.name(g)),
            h('input.v3-input.v3-input-num', {
              type: 'number', step: 1,
              value: custom[g.id] != null ? custom[g.id] : g.basePrice,
              oninput: function (e) { custom[g.id] = V3.util.parseNum(e.target.value, g.basePrice); }
            })
          ]);
        }))
    ]);

    C.modal(V3.t('goods.editPrices'), body, {
      footer: [
        C.button(V3.t('action.reset'), function () {
          V3.userdata.set('customPrices', {});
          V3.userdata.set('priceMode', 'base');
          C.closeModal(); V3.app.render();
        }),
        C.button(V3.t('action.save'), function () {
          V3.userdata.set('customPrices', custom);
          V3.userdata.set('priceMode', mode);
          C.closeModal(); V3.app.render();
        }, { kind: 'primary' })
      ]
    });
  }

})(window.V3);
