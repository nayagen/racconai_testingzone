// RaccoonAI page scripts, shared core: smooth scroll, theme, 2GIS tiles, header and mobile menu, and the helpers the
// feature files (js/*.js, one per animation or widget) take from window.Raccoon. Load it before them.
// Everything here is an enhancement: without JavaScript the page shows the final state and the form posts normally.

(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Start animations only once the page is shown ----------
     For Kazakh and English, i18n.js keeps the body hidden (html.i18n-pending, 2.5 s at most) until the dictionary has
     loaded and the text is translated. Intersection observers still fire under visibility: hidden, so a loop on screen at
     load (a reload mid-page, a #hash link) would start, and a one-shot intro would play out, while nobody can see it, then
     show up half-way through. Animation observers are therefore attached through whenShown. */
  var shownQueue = null;
  function whenShown(fn) {
    var html = document.documentElement;
    if (!html.classList.contains("i18n-pending")) { fn(); return; }
    if (!shownQueue) {
      shownQueue = [];
      var flush = function () {
        if (!shownQueue || html.classList.contains("i18n-pending")) { return; }
        mo.disconnect(); window.clearTimeout(safety);
        var q = shownQueue; shownQueue = null;
        q.forEach(function (f) { f(); });
      };
      var mo = new MutationObserver(flush);
      mo.observe(html, { attributes: true, attributeFilter: ["class"] });
      var safety = window.setTimeout(function () { html.classList.remove("i18n-pending"); flush(); }, 3000); // as in i18n.js
    }
    shownQueue.push(fn);
  }
  function observeWhenShown(io, el) { whenShown(function () { io.observe(el); }); return io; }

  /* Layout read once at start goes stale when the web fonts swap in (font-display: swap) or the text is translated
     (i18n.js, also after the start for kk/en, and animated over ~1 s on a switch). Size observers miss these when the box
     keeps its size but its contents move, so measured drawings are redone on both. */
  function onTextReflow(fn) {
    if (document.fonts && document.fonts.ready) { document.fonts.ready.then(fn); }
    document.addEventListener("raccoon:lang", function () { fn(); window.setTimeout(fn, 1200); });
  }

  /* Shared with the feature files. Set before anything below can fail, so they still start if, say, Lenis does not. */
  var R = window.Raccoon = {
    reduceMotion: reduceMotion, whenShown: whenShown, observeWhenShown: observeWhenShown, onTextReflow: onTextReflow,
    root: document.documentElement, isDark: isDark, twoGisTiles: twoGisTiles, lenis: null
  };

  /* ---------- Smooth scroll ----------
     Lenis (vendor/lenis.min.js, MIT, darkroom.engineering) eases mouse-wheel and trackpad scrolling; touch keeps the
     platform's own scrolling, and so does the page under reduced motion. Boxes that scroll by themselves (the Platform
     replica's tables and Gantt rows, sheets) keep native wheel scrolling. In-page links glide to their target at the
     page's scroll-padding; the skip link keeps its native jump so keyboard focus moves with it. */
  var lenis = null;
  if (!reduceMotion && window.Lenis) try {
    var nestedScroll = function (node) {
      if (!node || node.nodeType !== 1 || node === document.body || node === document.documentElement) { return false; }
      if (node.hasAttribute("data-lenis-prevent")) { return true; }
      var oy = getComputedStyle(node).overflowY;
      return (oy === "auto" || oy === "scroll") && node.scrollHeight > node.clientHeight + 1;
    };
    lenis = new window.Lenis({ lerp: 0.085, wheelMultiplier: 1.4, prevent: nestedScroll });
    /* The loop runs only while there is scrolling to animate: input (or a scripted scrollTo) wakes it, and it sleeps
       300 ms after Lenis settles, so an idle page does no per-frame work. */
    var lenisOn = false, lenisLast = 0;
    var lenisRaf = function (t) {
      if (!lenis) { lenisOn = false; return; } // set-up failed part-way (see the catch below)
      lenis.raf(t);
      if (lenis.isScrolling) { lenisLast = t; }
      if (t - lenisLast < 300) { requestAnimationFrame(lenisRaf); } else { lenisOn = false; }
    };
    var lenisWake = function () {
      lenisLast = performance.now();
      if (!lenisOn) { lenisOn = true; requestAnimationFrame(lenisRaf); }
    };
    ["wheel", "keydown", "pointerdown", "touchstart"].forEach(function (ev) { window.addEventListener(ev, lenisWake, { passive: true, capture: true }); });
    var lenisScrollTo = lenis.scrollTo.bind(lenis);
    lenis.scrollTo = function (target, opts) { lenisWake(); return lenisScrollTo(target, opts); };
    lenisWake();
    document.addEventListener("click", function (e) {
      if (!lenis || e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) { return; }
      var a = e.target.closest && e.target.closest('a[href^="#"]');
      if (!a || a.classList.contains("skip") || a.hash.length < 2) { return; }
      var el = document.getElementById(decodeURIComponent(a.hash.slice(1)));
      if (!el) { return; }
      e.preventDefault();
      var pad = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
      lenis.scrollTo(el, { offset: -pad, duration: 1.1, easing: function (x) { return 1 - Math.pow(1 - x, 4); } });
      if (history.pushState) { history.pushState(null, "", a.hash); }
    });
    R.lenis = lenis;
  } catch (e) {
    try { if (lenis) { lenis.destroy(); } } catch (e2) { /* already broken */ }
    lenis = null; if (window.console) { console.error(e); }
  }

  /* ---------- Light / dark theme ----------
     The inline head script sets html[data-theme] before paint (stored choice, else the OS preference). The dock and header
     buttons flip it and remember the pick. Every image has a "-dark" twin: photos switch through their <picture> source
     (its media query serves dark-OS visitors on first load), maps, proof photos and the truck illustration by src, including
     those the feature scripts render later. */
  var root = document.documentElement, THEME_KEY = "raccoon-theme";
  var DARK_IMG = /(images\/(?:dispatch-map-\d+|platform\/map-almaty|platform\/garbage-truck-green|platform\/proof\/[ab]\d))(?:-dark)?\.webp/g;
  var themeToggles = Array.prototype.slice.call(document.querySelectorAll("[data-theme-toggle]"));
  function isDark() { return root.getAttribute("data-theme") === "dark"; }
  function themeSrc(s) { return s.replace(DARK_IMG, function (m, base) { return base + (isDark() ? "-dark" : "") + ".webp"; }); }
  function themeImages(scope) {
    var imgs = scope.tagName === "IMG" ? [scope] : scope.querySelectorAll("img, a[download]");
    Array.prototype.forEach.call(imgs, function (el) {
      ["src", "srcset", "href"].forEach(function (a) {
        var v = el.getAttribute(a), t = v && themeSrc(v);
        if (t && t !== v) { el.setAttribute(a, t); }
      });
    });
  }
  function applyTheme() {
    var dark = isDark();
    Array.prototype.forEach.call(document.querySelectorAll("source[data-theme-dark]"), function (s) { s.media = dark ? (s.getAttribute("data-theme-dark") || "all") : "not all"; });
    themeImages(document);
    themeToggles.forEach(function (b) { b.setAttribute("aria-pressed", dark ? "true" : "false"); });
  }
  applyTheme();
  new MutationObserver(function (list) {
    list.forEach(function (m) { Array.prototype.forEach.call(m.addedNodes, function (n) { if (n.nodeType === 1) { themeImages(n); } }); });
  }).observe(document.body, { childList: true, subtree: true });
  /* The switch is a one-second cross-fade of the whole page (View Transitions), so photos, maps, shadows and the device
     screens change together with the colours and running animations keep their own transitions. Browsers without it
     ease the colours over the same second; reduced motion switches at once. */
  var themeMotion = window.matchMedia("(prefers-reduced-motion: no-preference)");
  themeToggles.forEach(function (b) {
    b.addEventListener("click", function () {
      var next = isDark() ? "light" : "dark";
      var flip = function () {
        root.setAttribute("data-theme", next);
        try { window.localStorage.setItem(THEME_KEY, next); } catch (e) { /* private mode: the pick lasts for this page */ }
        applyTheme();
      };
      if (!themeMotion.matches) { flip(); return; }
      if (document.startViewTransition) { document.startViewTransition(flip); return; }
      root.classList.add("theme-anim");
      flip();
      window.setTimeout(function () { root.classList.remove("theme-anim"); }, 1000);
    });
  });
  // With no stored pick, follow the OS when it switches (e.g. at sunset)
  var osDark = window.matchMedia("(prefers-color-scheme: dark)");
  var onOs = function (e) {
    var s = null;
    try { s = window.localStorage.getItem(THEME_KEY); } catch (err) { s = null; }
    if (s !== "light" && s !== "dark") { root.setAttribute("data-theme", e.matches ? "dark" : "light"); applyTheme(); }
  };
  if (osDark.addEventListener) { osDark.addEventListener("change", onOs); } else if (osDark.addListener) { osDark.addListener(onOs); }

  /* ---------- 2GIS map tiles (shared) ----------
     The Leaflet tile layer behind the Platform screen's live map and the AI-dispatcher stage: 2GIS raster tiles, drawn into
     canvases so that at night each tile is recoloured with the curve of the dark backdrop. Returns the layer class and a
     repaint for theme switches. */
  var gisShared = null;
  function twoGisTiles() {
    if (gisShared) { return gisShared; }
    /* ---- tiles: 2GIS raster, by default the 512px HD set drawn into 256px slots (option hd: false for the 256px set). The map sits between tile levels (fractional
       zoom, up to ~1.4x stretch) inside a screen that is itself scaled to fit the window and zoomed by the tour camera;
       the standard 256px tiles lose their small labels to that double resampling, the 2x tiles keep them crisp. ---- */
    var night = function () { return root.getAttribute("data-theme") === "dark"; };
    var ss = function (a, b, x) { x = Math.min(1, Math.max(0, (x - a) / (b - a))); return x * x * (3 - 2 * x); };
    var CURVE = [[0, .88], [.35, .70], [.65, .42], [.86, .17], [.90, .135], [.94, .115], [.975, .17], [1, .24]];
    var curve = function (y) { for (var i = 1; i < CURVE.length; i++) { if (y <= CURVE[i][0]) { var a = CURVE[i - 1], b = CURVE[i]; return a[1] + (b[1] - a[1]) * (y - a[0]) / (b[0] - a[0]); } } return .24; };
    var hsl = function (h, s, l) { var a = s * Math.min(l, 1 - l), f = function (n) { var k = (n + h / 30) % 12; return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)); }; return [f(0), f(8), f(4)]; };
    var NIGHT = {}; // tiles use small palettes, so each colour is worked out once
    var nightRGB = function (R, G, B) {
      var key = (R << 16) | (G << 8) | B, hit = NIGHT[key];
      if (hit) { return hit; }
      var r = R / 255, g = G / 255, b = B / 255, mx = Math.max(r, g, b), mn = Math.min(r, g, b), C = mx - mn;
      var Y = .2126 * r + .7152 * g + .0722 * b, ln = curve(Y), N = hsl(222, .30 - .22 * ss(.4, .85, ln), ln);
      var w = ss(.14, .30, C), out = N;
      if (w > 0) {
        var h = !C ? 0 : mx === r ? ((g - b) / C + 6) % 6 : mx === g ? (b - r) / C + 2 : (r - g) / C + 4, l = (mx + mn) / 2, s = C / (1 - Math.abs(2 * l - 1));
        h *= 60;
        var K = hsl(h > 60 && h < 160 ? h + 30 : h, Math.min(1, s * (.42 + .43 * ss(.35, .7, C))), Math.max(.13 + .40 * ss(.35, .75, C), curve(Y)));
        out = [N[0] * (1 - w) + K[0] * w, N[1] * (1 - w) + K[1] * w, N[2] * (1 - w) + K[2] * w];
      }
      hit = NIGHT[key] = [Math.round(out[0] * 255), Math.round(out[1] * 255), Math.round(out[2] * 255)];
      return hit;
    };
    var LITTLE = new Uint8Array(new Uint32Array([1]).buffer)[0] === 1; // byte order of the packed pixel loop
    var paintTile = function (cv) {
      // night tiles are read back and rewritten, so they live on the CPU (no GPU readback); the first call fixes the mode
      var img = cv._src, ctx = cv.getContext("2d", { willReadFrequently: true });
      if (!img) { return; }
      ctx.drawImage(img, 0, 0, cv.width, cv.height);
      if (!night()) { return; }
      var data;
      try { data = ctx.getImageData(0, 0, cv.width, cv.height); } catch (e) { return; }
      var d = data.data, i, c;
      if (LITTLE) {
        /* Packed pixels (ABGR in memory order): map tiles are long runs of one colour, so the previous pixel's answer is
           reused and the colour lookup only runs where the colour changes. Same colours out as the per-channel loop below. */
        var px = new Uint32Array(d.buffer, d.byteOffset, d.length >> 2), n = px.length, last = -1, out = 0, v, rgb;
        for (i = 0; i < n; i++) {
          v = px[i]; rgb = v & 0xffffff;
          if (rgb !== last) { last = rgb; c = nightRGB(rgb & 255, (rgb >> 8) & 255, rgb >> 16); out = c[0] | (c[1] << 8) | (c[2] << 16); }
          px[i] = (v & 0xff000000) | out;
        }
      } else {
        for (i = 0; i < d.length; i += 4) { c = nightRGB(d[i], d[i + 1], d[i + 2]); d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; }
      }
      ctx.putImageData(data, 0, 0);
    };
    var Tiles = L.GridLayer.extend({
      createTile: function (c, done) {
        var cv = document.createElement("canvas"), img = new Image();
        var hd = this.options.hd !== false;
        cv.width = cv.height = hd ? 512 : 256;
        img.crossOrigin = "anonymous";
        img.onload = function () { cv._src = img; paintTile(cv); done(null, cv); };
        img.onerror = function () { done(new Error("tile"), cv); };
        img.src = "https://tile" + ((c.x + c.y) & 3) + ".maps.2gis.com/tiles?x=" + c.x + "&y=" + c.y + "&z=" + c.z + "&v=1.1" + (hd ? "&ts=online_hd" : "");
        return cv;
      }
    });
    gisShared = {
      Tiles: Tiles,
      watchTheme: function (layer) {
        new MutationObserver(function () {
          Object.keys(layer._tiles).forEach(function (k) { paintTile(layer._tiles[k].el); });
        }).observe(root, { attributes: true, attributeFilter: ["data-theme"] });
      }
    };
    return gisShared;
  }

  /* ---------- Header border once the page scrolls ---------- */
  var header = document.querySelector(".site-header");
  function onScroll() { header.classList.toggle("is-scrolled", window.scrollY > 8); }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile section menu: closes on a pick, on Escape and on a tap outside ---------- */
  var mNav = document.querySelector(".m-nav");
  if (mNav) {
    var mClose = function (focus) { if (mNav.open) { mNav.open = false; if (focus) { mNav.querySelector("summary").focus(); } } };
    mNav.querySelector(".m-nav-panel").addEventListener("click", function (e) { if (e.target.closest("a")) { mClose(false); } });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") { mClose(true); } });
    document.addEventListener("click", function (e) { if (!mNav.contains(e.target)) { mClose(false); } });
  }
})();
