// RaccoonAI page language: Russian (source, in the HTML), Kazakh and English.
// Loaded in <head>: picks the language before the page paints, then translates the DOM in place.
// Dictionaries (i18n/en.js, i18n/kk.js) map the Russian source text to the target text. They are keyed by
// whole text nodes first and, as a fallback, by Cyrillic runs, so text that scripts build later
// (statuses, counters, the Platform replica) is translated the same way through a MutationObserver.
(function () {
  "use strict";

  var LANGS = ["ru", "kk", "en"];
  var KEY = "raccoon-lang";
  var html = document.documentElement;

  // Time zones of CIS member and associate states (Russian is the shared business language there).
  var CIS_TZ = /^(Asia\/(Almaty|Qostanay|Qyzylorda|Aqtobe|Aqtau|Atyrau|Oral|Bishkek|Tashkent|Samarkand|Dushanbe|Ashgabat|Baku|Yerevan|Yekaterinburg|Omsk|Novosibirsk|Barnaul|Tomsk|Novokuznetsk|Krasnoyarsk|Irkutsk|Chita|Yakutsk|Khandyga|Vladivostok|Ust-Nera|Magadan|Sakhalin|Srednekolymsk|Kamchatka|Anadyr)|Europe\/(Moscow|Kaliningrad|Samara|Volgograd|Saratov|Ulyanovsk|Astrakhan|Kirov|Minsk|Chisinau|Simferopol))$/;

  function stored() { try { return window.localStorage.getItem(KEY); } catch (e) { return null; } }
  function remember(l) { try { window.localStorage.setItem(KEY, l); } catch (e) { /* private mode: the choice lasts for this page only */ } }

  // Explicit choice (?lang= or a previous pick) wins; otherwise the browser's time zone decides: CIS → Russian, elsewhere → English.
  function detect() {
    var q = /[?&]lang=(ru|kk|en)\b/.exec(window.location.search);
    if (q) { return q[1]; }
    var s = stored();
    if (LANGS.indexOf(s) >= 0) { return s; }
    var tz = "";
    try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ""; } catch (e) { tz = ""; }
    if (tz) { return CIS_TZ.test(tz) ? "ru" : "en"; }
    var nav = (navigator.languages && navigator.languages[0]) || navigator.language || "";
    return /^(ru|kk|be|ky|uz|tg|hy|az)\b/i.test(nav) ? "ru" : "en";
  }

  var lang = detect();
  var dicts = (window.RACCOON_I18N = window.RACCOON_I18N || {});
  html.lang = lang;
  if (lang !== "ru") {
    html.classList.add("i18n-pending");
    window.setTimeout(function () { html.classList.remove("i18n-pending"); }, 2500); // never keep the page hidden
  }

  /* ---------- Translation ---------- */
  var CY = /[Ѐ-ӿ]/;
  var RUN = /[Ѐ-ӿ][Ѐ-ӿ  ,.:;!?«»()\-–—\/№%+]*/g;
  var TAIL = /[\s ,;:(\-–—«\/№+]+$/;
  var ATTRS = ["aria-label", "alt", "placeholder", "title", "data-tip"];
  function norm(s) { return s.replace(/[  ]/g, " ").replace(/‑/g, "-").replace(/\s+/g, " ").trim(); }

  function tr(src, D) {
    if (!D || !CY.test(src)) { return src; }
    var k = norm(src);
    var hit = D[k];
    if (typeof hit === "string") { return src.match(/^\s*/)[0] + hit + src.match(/\s*$/)[0]; }
    return src.replace(RUN, function (m) {
      var tail = (m.match(TAIL) || [""])[0];
      var v = D[norm(m.slice(0, m.length - tail.length))];
      return typeof v === "string" ? v + tail : m;
    });
  }

  var textSrc = new WeakMap(), textOut = new WeakMap();
  var attrSrc = new WeakMap(), attrOut = new WeakMap();

  function doText(n) {
    var cur = n.data, s = textSrc.get(n);
    if (s === undefined || cur !== textOut.get(n)) { s = cur; textSrc.set(n, s); } // first visit, or the page script rewrote it
    var out = lang === "ru" ? s : tr(s, dicts[lang]);
    if (cur !== out) { n.data = out; }
    textOut.set(n, out);
  }
  function doAttr(el, a) {
    if (!el.hasAttribute(a)) { return; }
    var cur = el.getAttribute(a);
    var src = attrSrc.get(el) || {}, out = attrOut.get(el) || {};
    if (src[a] === undefined || cur !== out[a]) { src[a] = cur; }
    var v = lang === "ru" ? src[a] : tr(src[a], dicts[lang]);
    if (cur !== v) { el.setAttribute(a, v); }
    out[a] = v; attrSrc.set(el, src); attrOut.set(el, out);
  }
  function skip(el) { return el.nodeName === "SCRIPT" || el.nodeName === "STYLE" || el.hasAttribute("data-i18n-skip"); }
  function walk(root) {
    if (root.nodeType === 3) { if (root.parentNode && !root.parentNode.closest("[data-i18n-skip], script, style")) { doText(root); } return; }
    if (root.nodeType !== 1 || skip(root) || root.closest("[data-i18n-skip]")) { return; }
    var w = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
      acceptNode: function (n) { return n.nodeType === 1 && skip(n) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT; }
    });
    var n = root;
    do {
      if (n.nodeType === 3) { doText(n); }
      else { for (var i = 0; i < ATTRS.length; i++) { if (n.hasAttribute(ATTRS[i])) { doAttr(n, ATTRS[i]); } } }
    } while ((n = w.nextNode()));
  }

  var head = { title: null, desc: null };
  function doHead() {
    var md = document.querySelector('meta[name="description"]');
    if (head.title === null) { head.title = document.title; head.desc = md ? md.content : ""; }
    document.title = lang === "ru" ? head.title : tr(head.title, dicts[lang]);
    if (md) { md.content = lang === "ru" ? head.desc : tr(head.desc, dicts[lang]); }
  }

  var observer = new MutationObserver(function (list) {
    for (var i = 0; i < list.length; i++) {
      var m = list[i];
      if (m.type === "characterData") { if (m.target.parentNode && !m.target.parentNode.closest("[data-i18n-skip], script, style")) { doText(m.target); } }
      else if (m.type === "attributes") { if (!m.target.closest("[data-i18n-skip]")) { doAttr(m.target, m.attributeName); } }
      else { for (var j = 0; j < m.addedNodes.length; j++) { walk(m.addedNodes[j]); } }
    }
  });

  var ready = false;
  function apply() {
    if (!ready || (lang !== "ru" && !dicts[lang])) { return; }
    observer.disconnect();
    html.lang = lang;
    doHead();
    walk(document.body);
    if (lang !== "ru") {
      observer.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTRS });
    }
    syncSwitchers();
    html.classList.remove("i18n-pending");
    document.dispatchEvent(new CustomEvent("raccoon:lang", { detail: { lang: lang } }));
  }

  function load(l, done) {
    if (l === "ru" || dicts[l]) { done(); return; }
    var s = document.createElement("script");
    s.src = "i18n/" + l + ".js";
    s.onload = done;
    s.onerror = function () { html.classList.remove("i18n-pending"); };
    document.head.appendChild(s);
  }

  /* ---------- The switch, animated ----------
     When the visitor picks a language, the new text writes itself over the old one sign by sign, left to right (new
     head + the rest of the old text), top rows a beat earlier than the bottom ones. Only text nodes in the viewport take
     part (not the aria-hidden device screens, whose stories rewrite their own text); the rest of the page is translated
     at once. Blocks hold the taller of their two heights while it runs, so nothing below jumps. The observer is off while
     it runs (the mixed text must not be taken for new source text), and a final walk catches whatever page scripts changed
     meanwhile. Reduced motion: instant. */
  var motionOk = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: no-preference)") : { matches: false };
  var DUR_MAX = 900, WAVE = 200;
  var running = null;

  function onScreen() {
    var out = [], vh = window.innerHeight, range = document.createRange();
    var w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode: function (n) {
        if (!/[^\s ]/.test(n.data)) { return NodeFilter.FILTER_REJECT; }
        var p = n.parentElement;
        if (!p || p.closest('[data-i18n-skip], script, style, [aria-hidden="true"], [hidden]')) { return NodeFilter.FILTER_REJECT; }
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    var n;
    while ((n = w.nextNode()) && out.length < 220) {
      range.selectNodeContents(n);
      var r = range.getBoundingClientRect();
      if (r.width && r.bottom > 0 && r.top < vh) { out.push({ n: n, top: r.top / vh }); }
    }
    return out;
  }
  // the nearest box that is not inline: its height is held while the text is away
  function holdBox(n) {
    var el = n.parentElement;
    while (el && el !== document.body && /^inline/.test(getComputedStyle(el).display)) { el = el.parentElement; }
    return el;
  }

  function switchAnimated(next) {
    if (running) { running.finish(); }
    var items = onScreen();
    if (!items.length) { next(); return; }
    var holds = [];
    items.forEach(function (it) {
      it.from = it.n.data;
      var b = holdBox(it.n);
      if (b && holds.indexOf(b) < 0) { holds.push(b); b.__minH = b.style.minHeight; b.style.minHeight = b.offsetHeight + "px"; }
    });
    // translate at once, read the new text, then put the old text back and overwrite it sign by sign
    next();
    observer.disconnect();
    holds.forEach(function (b) { b.style.minHeight = Math.max(parseFloat(b.style.minHeight) || 0, b.offsetHeight) + "px"; });
    items.forEach(function (it) {
      it.to = it.n.data;
      it.len = Math.max(it.from.length, it.to.length);
      it.dur = Math.min(DUR_MAX, 220 + it.len * 11);
      it.delay = it.top * WAVE;
      it.n.data = it.from;
    });
    var t0 = performance.now(), raf = 0, done = false;
    function finish() {
      if (done) { return; }
      done = true; cancelAnimationFrame(raf); running = null;
      items.forEach(function (it) { if (it.n.data !== it.to) { it.n.data = it.to; } });
      holds.forEach(function (b) { b.style.minHeight = b.__minH || ""; delete b.__minH; });
      // catch up with text the page scripts rewrote meanwhile, then listen again
      walk(document.body);
      if (lang !== "ru") { observer.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTRS }); }
    }
    function frame(now) {
      var t = now - t0, end = true;
      items.forEach(function (it) {
        var p = Math.min(1, Math.max(0, (t - it.delay) / it.dur));
        if (p < 1) { end = false; }
        var k = Math.round(it.len * p);
        var s = it.to.slice(0, k) + it.from.slice(k);
        if (it.n.data !== s) { it.n.data = s; }
      });
      if (end) { finish(); return; }
      raf = requestAnimationFrame(frame);
    }
    running = { finish: finish };
    raf = requestAnimationFrame(frame);
  }

  function setLang(l, persist) {
    if (LANGS.indexOf(l) < 0) { return; }
    if (persist) { remember(l); }
    var changed = l !== lang;
    lang = l;
    load(l, function () {
      if (persist && changed && ready && motionOk.matches) { switchAnimated(apply); } else { apply(); }
    });
  }

  /* ---------- Switchers (header menu and the mobile menu row) ---------- */
  var FLAG = { ru: "#flag-ru", kk: "#flag-kz", en: "#flag-gb" };
  function syncSwitchers() {
    Array.prototype.forEach.call(document.querySelectorAll("[data-lang-current]"), function (el) {
      var use = el.querySelector("use"); if (use) { use.setAttribute("href", FLAG[lang]); }
      var code = el.querySelector(".lang-code"); if (code) { code.textContent = lang.toUpperCase(); }
    });
    Array.prototype.forEach.call(document.querySelectorAll("[data-lang]"), function (b) {
      var on = b.getAttribute("data-lang") === lang;
      b.setAttribute("aria-pressed", String(on));
    });
  }
  document.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest("[data-lang]");
    if (!b) { return; }
    setLang(b.getAttribute("data-lang"), true);
    var d = b.closest("details"); if (d) { d.open = false; }
  });
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") { return; }
    var d = document.querySelector("details.lang[open]");
    if (d) { d.open = false; d.querySelector("summary").focus(); }
  });
  document.addEventListener("click", function (e) {
    var d = document.querySelector("details.lang[open]");
    if (d && !d.contains(e.target)) { d.open = false; }
  });

  window.RaccoonLang = { get: function () { return lang; }, set: function (l) { setLang(l, true); } };

  load(lang, function () { apply(); });
  document.addEventListener("DOMContentLoaded", function () { ready = true; apply(); syncSwitchers(); });
})();
