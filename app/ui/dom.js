/* ============================================================================
 * app/ui/dom.js - A 60-line replacement for a UI framework.
 * ---------------------------------------------------------------------------
 * EN: The whole interface is built with one function, `h()`. No React, no
 *     build step, no node_modules - which is the only way this app can be a
 *     folder you double-click.
 *
 *       h('div.card', {onclick: f}, [ h('h2', 'Title'), 'text' ])
 *
 *     The tag string carries classes and an id the way CSS selectors do:
 *       'div'  'div.card'  'div.card.wide'  'div#main.card'
 *
 * RU: Весь интерфейс собран одной функцией `h()`. Ни React, ни сборки, ни
 *     node_modules - только так приложение может быть папкой, которую
 *     запускают двойным щелчком.
 *
 *     Строка тега несёт классы и id как в CSS-селекторе:
 *       'div'  'div.card'  'div.card.wide'  'div#main.card'
 * ==========================================================================*/
(function (V3) {
  'use strict';

  var SVG_NS = 'http://www.w3.org/2000/svg';
  var SVG_TAGS = {
    svg: 1, g: 1, path: 1, rect: 1, circle: 1, line: 1, text: 1, tspan: 1,
    polygon: 1, polyline: 1, defs: 1, marker: 1, ellipse: 1, image: 1,
    linearGradient: 1, radialGradient: 1, stop: 1, filter: 1, feGaussianBlur: 1,
    clipPath: 1, use: 1, pattern: 1, foreignObject: 1
  };

  /**
   * @param {String} tagSpec  'div', 'span.pill', 'button#save.primary'
   * @param {Object} [attrs]  DOM attributes; `on*` become listeners,
   *                          `style` may be an object, `dataset` an object.
   * @param {*} [children]    string | Node | array | null (nested arrays fine)
   */
  function h(tagSpec, attrs, children) {
    // Allow h('div', [children]) and h('div', 'text')
    if (attrs && (Array.isArray(attrs) || typeof attrs === 'string' ||
        typeof attrs === 'number' || attrs instanceof Node)) {
      children = attrs; attrs = null;
    }

    var m = /^([a-zA-Z][\w-]*)?(#[\w-]+)?((?:\.[\w-]+)*)$/.exec(tagSpec || 'div');
    var tag = (m && m[1]) || 'div';
    var el = SVG_TAGS[tag]
      ? document.createElementNS(SVG_NS, tag)
      : document.createElement(tag);

    if (m && m[2]) el.id = m[2].slice(1);
    if (m && m[3]) {
      var cls = m[3].split('.').filter(Boolean).join(' ');
      if (SVG_TAGS[tag]) el.setAttribute('class', cls); else el.className = cls;
    }

    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        var v = attrs[k];
        if (v === null || v === undefined || v === false) return;

        if (k.indexOf('on') === 0 && typeof v === 'function') {
          el.addEventListener(k.slice(2).toLowerCase(), v);
        } else if (k === 'style' && typeof v === 'object') {
          Object.keys(v).forEach(function (p) { el.style[p] = v[p]; });
        } else if (k === 'dataset') {
          Object.keys(v).forEach(function (p) { el.dataset[p] = v[p]; });
        } else if (k === 'class' || k === 'className') {
          if (SVG_TAGS[tag]) el.setAttribute('class', (el.getAttribute('class') || '') + ' ' + v);
          else el.className = (el.className ? el.className + ' ' : '') + v;
        } else if (k === 'html') {
          el.innerHTML = v;
        } else if (k === 'value' && 'value' in el) {
          el.value = v;
        } else if (k === 'checked' || k === 'disabled' || k === 'selected') {
          el[k] = !!v;
          if (v === true) el.setAttribute(k, '');
        } else {
          el.setAttribute(k, v === true ? '' : v);
        }
      });
    }

    append(el, children);
    return el;
  }

  function append(el, child) {
    if (child === null || child === undefined || child === false) return;
    if (Array.isArray(child)) { child.forEach(function (c) { append(el, c); }); return; }
    if (child instanceof Node) { el.appendChild(child); return; }
    el.appendChild(document.createTextNode(String(child)));
  }

  /** Replace everything inside `el` with `children`. */
  h.fill = function (el, children) {
    while (el.firstChild) el.removeChild(el.firstChild);
    append(el, children);
    return el;
  };

  /** `$('#id')` / `$('.cls', parent)` */
  h.$ = function (sel, root) { return (root || document).querySelector(sel); };
  h.$$ = function (sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  };

  h.append = append;

  V3.h = h;

})(window.V3);
