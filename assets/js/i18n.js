/* Locale resolution + DOM text swap.
   Priority: ?lang= query param  >  localStorage  >  navigator.language  >  'ro'. */
(function (w, d) {
  'use strict';

  var SUPPORTED = ['ro', 'ru'];
  var FALLBACK  = 'ro';
  var STORE_KEY = 'slot.lang';

  function supported(tag) {
    if (!tag) return null;
    var base = String(tag).toLowerCase().split('-')[0];
    return SUPPORTED.indexOf(base) > -1 ? base : null;
  }

  /* localStorage throws in some privacy modes — never let that break the page. */
  function readStore() {
    try { return w.localStorage.getItem(STORE_KEY); } catch (e) { return null; }
  }
  function writeStore(v) {
    try { w.localStorage.setItem(STORE_KEY, v); } catch (e) { /* ignore */ }
  }

  function resolve() {
    var q = new URLSearchParams(w.location.search).get('lang');
    var fromQuery = supported(q);
    if (fromQuery) { writeStore(fromQuery); return fromQuery; }

    var fromStore = supported(readStore());
    if (fromStore) return fromStore;

    var navLangs = w.navigator.languages || [w.navigator.language];
    for (var i = 0; i < navLangs.length; i++) {
      var hit = supported(navLangs[i]);
      if (hit) return hit;
    }
    return FALLBACK;
  }

  function apply(lang) {
    var dict = (w.LOCALES || {})[lang];
    if (!dict) return;

    d.documentElement.lang = dict['html.lang'] || lang;
    if (dict['html.title']) d.title = dict['html.title'];

    var nodes = d.querySelectorAll('[data-i18n]');
    for (var i = 0; i < nodes.length; i++) {
      var key = nodes[i].getAttribute('data-i18n');
      if (Object.prototype.hasOwnProperty.call(dict, key)) nodes[i].textContent = dict[key];
    }

    w.I18N.lang = lang;
    d.dispatchEvent(new CustomEvent('i18n:applied', { detail: { lang: lang } }));
  }

  w.I18N = {
    lang: FALLBACK,
    supported: SUPPORTED,
    /** Look up a single string in the active locale. */
    t: function (key) {
      var dict = (w.LOCALES || {})[w.I18N.lang] || {};
      return Object.prototype.hasOwnProperty.call(dict, key) ? dict[key] : key;
    },
    /** Switch locale at runtime and re-render all [data-i18n] nodes. */
    set: function (lang) {
      var next = supported(lang);
      if (!next) return;
      writeStore(next);
      apply(next);
    },
    init: function () { apply(resolve()); }
  };

  w.I18N.init();

})(window, document);
