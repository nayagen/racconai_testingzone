// RaccoonAI page script: Client App period report (clientapp.html #report).
// One feature per file, so an error here cannot stop the others; js/core.js loads first and shares window.Raccoon.

(function (R) {
  "use strict";
  if (!R) { return; }
  var reduceMotion = R.reduceMotion, observeWhenShown = R.observeWhenShown;

  /* ---------- Client App period report (clientapp.html #report) ----------
     The same kind of story clock as #screens: keyframes set data-* states on .cr-proto, CSS draws them, taps are transient
     and skipped when seeking. «История» from the request list, the history scrolls under its fixed summary, the calendar sheet
     takes 1–31 March, the totals recount and the cards filter, the green button downloads the PDF, and the PDF opens beside the
     phone and zooms to its columns, its rows and its totals. Runs only while 35% visible and the page is shown; the text
     button pauses it (WCAG 2.2.2). Reduced motion: one still frame, the March history with the PDF beside it. */
  var crProto = document.getElementById("cr-p");
  var crToggle = document.getElementById("cr-toggle");
  if (crProto && crToggle) {
    var crStage = crProto.closest(".drv-stage");
    var crTap = crProto.querySelector(".hp-tap"), crDs = crProto.querySelector(".ds");
    var crView = crProto.querySelector(".cr-dview"), crPaper = crProto.querySelector(".cr-paper");
    var crNums = Array.prototype.slice.call(crProto.querySelectorAll(".cr-n"));
    var rS = function (k, v) { if (v == null) { crProto.removeAttribute("data-" + k); } else { crProto.setAttribute("data-" + k, v); } };

    /* Fit: the stage is 80% of the viewport tall (CSS); phone and page share its one cell. The phone takes the height the
       caption row leaves and at most ~62% of the width; the page, its 38px bar and 10px gap fit the same height and 80% of
       the width. Phone: 412 x 947 design px + 9px bezel; page 1361 x 1926. */
    var crWide = window.matchMedia("(min-width: 861px)");
    var crFit = function () {
      if (crWide.matches && crStage) {
        var cs = getComputedStyle(crStage), row = 0;
        Array.prototype.forEach.call(crStage.children, function (c) {
          if (c === crProto || c.offsetParent === null) { return; }
          var m = getComputedStyle(c);
          row = Math.max(row, c.offsetHeight + (parseFloat(m.marginTop) || 0) + (parseFloat(m.marginBottom) || 0));
        });
        var h = crStage.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom) - row;
        var w = crProto.clientWidth, r = 1361 / 1926;
        var s = Math.max(.2, Math.min((h - 18) / 947, (w * .62 - 18) / 412));
        var dw = Math.max(160, Math.min(w * .8, (h - 66) * r)), pw = 412 * s + 18;
        crProto.style.setProperty("--s", s.toFixed(4));
        crProto.style.setProperty("--cr-dw", dw.toFixed(1) + "px");
        crProto.style.setProperty("--cr-shift", ((w - pw) / 2).toFixed(1) + "px"); // centred on the stage before the PDF
      } else {
        crProto.style.removeProperty("--s"); crProto.style.removeProperty("--cr-dw"); crProto.style.removeProperty("--cr-shift");
      }
      if (crView.clientWidth) { crPaper.style.setProperty("--ps", (crView.clientWidth / 1361).toFixed(5)); }
    };
    if (window.ResizeObserver) {
      new ResizeObserver(crFit).observe(crStage || crProto);
      new ResizeObserver(function () { if (crView.clientWidth) { crPaper.style.setProperty("--ps", (crView.clientWidth / 1361).toFixed(5)); } }).observe(crView);
    }
    crWide.addEventListener("change", crFit);
    crFit();

    /* The zoom: page px of the region to bring to the top-left corner, and the magnification over the fitted page */
    var crZoom = function (k) {
      var tbl = crPaper.querySelector(".cr-p-tbl"), meta = crPaper.querySelector(".cr-p-meta"), tot = crPaper.querySelector(".cr-p-total");
      var z = 1, x = 0, y = 0;
      if (k === "z1") { z = 2.3; x = tbl.offsetLeft - 20; y = meta.offsetTop - 24; }
      else if (k === "z2") { z = 2.3; x = 1361 - 1361 / z; y = meta.offsetTop - 24; }
      else if (k === "z3") { z = 1.5; x = tot.offsetLeft - 24; y = tot.offsetTop + tot.offsetHeight + 120 - 1926 / z; }
      crPaper.style.setProperty("--z", z);
      crPaper.style.setProperty("--zx", Math.max(0, x).toFixed(1));
      crPaper.style.setProperty("--zy", Math.max(0, y).toFixed(1));
      rS("doc", k);
    };

    var crPress = function (sel) {
      var el = crProto.querySelector(sel);
      var s = crDs.getBoundingClientRect(), r = el.getBoundingClientRect(), k = s.width / crDs.offsetWidth || 1;
      crTap.style.setProperty("--tx", ((r.left - s.left + r.width / 2) / k).toFixed(1) + "px");
      crTap.style.setProperty("--ty", ((r.top - s.top + r.height / 2) / k).toFixed(1) + "px");
      crTap.classList.remove("is-pressing");
      void crTap.offsetWidth;
      crTap.classList.add("is-pressing");
      el.classList.add("is-press");
      window.setTimeout(function () { el.classList.remove("is-press"); }, 220);
    };
    var crTapF = function (sel) { return function () { crPress(sel); }; };

    /* The totals: April (12, 151.4 m³, 484 480 тг) recount to March (11, 124.3 m³, 399 760 тг) on the clock */
    var CR_CALC = [10500, 11500];
    var CR_FROM = { c: 12, v: 151.4, m: 484480 }, CR_TO = { c: 11, v: 124.3, m: 399760 };
    var crFmt = function (k, n) {
      if (k === "c") { return String(Math.round(n)); }
      if (k === "v") { return n.toFixed(1); }
      return String(Math.round(n / 10) * 10).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    };
    var crCount = function (t) {
      var p = t <= CR_CALC[0] ? 0 : t >= CR_CALC[1] ? 1 : (t - CR_CALC[0]) / (CR_CALC[1] - CR_CALC[0]);
      var e = 1 - Math.pow(1 - p, 3);
      crNums.forEach(function (el) {
        var k = el.getAttribute("data-k"), v = crFmt(k, CR_FROM[k] + (CR_TO[k] - CR_FROM[k]) * e);
        if (el.textContent !== v) { el.textContent = v; }
      });
    };

    var CR_INIT = function () {
      rS("scr", "list"); rS("per", "apr"); rS("sel", "apr");
      ["scroll", "pg", "calc", "dl"].forEach(function (k) { rS(k, null); });
      crZoom(null); rS("doc", null);
    };
    var CR_STORY = [
      [0, CR_INIT],
      // «История» on the tab bar; the history slides in and scrolls under its summary
      [1300, crTapF(".ca-list .cr-tab-hist"), 1],
      [1600, function () { rS("scr", "hist"); }],
      [2900, function () { rS("scroll", "1"); }],
      // the period: the calendar sheet, 1 March, 31 March, apply
      [6200, crTapF(".cr-per"), 1],
      [6500, function () { rS("pg", "cal"); }],
      [7800, crTapF(".cr-m1"), 1],
      [7900, function () { rS("sel", "m1"); }],
      [8800, crTapF(".cr-m31"), 1],
      [8900, function () { rS("sel", "mar"); }],
      [10000, crTapF(".cr-btn-apply"), 1],
      [10300, function () { rS("pg", null); rS("per", "mar"); rS("calc", "1"); }],
      [CR_CALC[1] + 300, function () { rS("calc", null); }],
      // the PDF: download, then it opens beside the phone and zooms to the columns, across them, and to the totals
      [12700, crTapF(".cr-dl"), 1],
      [12900, function () { rS("dl", "1"); }],
      [14800, function () { rS("dl", "2"); }],
      [15400, function () { crZoom("in"); }],
      [17200, function () { rS("dl", null); }],
      [17600, function () { crZoom("z1"); }],
      [21200, function () { crZoom("z2"); }],
      [24600, function () { crZoom("z3"); }],
      [28000, function () { crZoom("in"); }],
      // back to the request list, and round again
      [30400, crTapF(".cr-hist .cr-tab-orders"), 1],
      [30700, function () { rS("scr", "list"); crZoom(null); }]
    ];
    var CR_END = 32200, CR_STILL = 16000;

    /* The step list: each row is a stretch of the clock (history, period, download, the PDF); the selected row fills its
       hairline over that stretch, a click seeks to its start. Reduced motion: a click shows that step's still frame. */
    var crTabs = Array.prototype.slice.call(document.querySelectorAll('.cr-tabs [role="tab"]'));
    var crTabList = document.querySelector(".cr-tabs");
    var CR_SEG = [0, 6000, 12500, 15300], CR_STILLS = [5000, 11800, 14900, 22000];
    var crSegAt = function (t) { var k = 0; CR_SEG.forEach(function (a, i) { if (t >= a) { k = i; } }); return k; };
    var crShowSeg = function (k) {
      crTabs.forEach(function (t, n) { t.setAttribute("aria-selected", String(n === k)); t.tabIndex = n === k ? 0 : -1; });
      if (crTabs[k]) { crProto.setAttribute("aria-labelledby", crTabs[k].id); }
    };

    var cr = { t: 0, seg: -1, raf: 0, last: 0, visible: false, paused: false, focus: false, running: false, fresh: true };
    var crBar = function (running) {
      var k = cr.seg, a = CR_SEG[k], b = k + 1 < CR_SEG.length ? CR_SEG[k + 1] : CR_END;
      crTabs.forEach(function (t, n) {
        t.classList.toggle("is-auto", n === k && !cr.paused);
        t.classList.remove("is-running");
        if (n !== k) { return; }
        t.style.setProperty("--auto-from", String((cr.t - a) / (b - a)));
        t.style.setProperty("--auto-left", Math.max(0, b - cr.t) + "ms");
        void t.offsetWidth;
        if (running) { t.classList.add("is-running"); }
      });
    };
    var crSeek = function (t) {
      crProto.classList.add("is-reset");
      CR_STORY.forEach(function (e) { if (e[0] <= t && !e[2]) { e[1](); } });
      crTap.classList.remove("is-pressing");
      cr.t = t; crCount(t);
      cr.seg = crSegAt(t); crShowSeg(cr.seg);
      void crProto.offsetWidth;
      crProto.classList.remove("is-reset");
    };
    var crTick = function (now) {
      var dt = Math.min(100, now - cr.last), t0 = cr.t, t1 = t0 + dt;
      cr.last = now;
      if (t1 >= CR_END) { crSeek(0); crBar(true); cr.raf = requestAnimationFrame(crTick); return; }
      CR_STORY.forEach(function (e) { if (e[0] > t0 && e[0] <= t1) { e[1](); } });
      cr.t = t1;
      var k = crSegAt(t1);
      if (k !== cr.seg) { cr.seg = k; crShowSeg(k); crBar(true); }
      if (t1 >= CR_CALC[0] - 50 && t0 <= CR_CALC[1] + 50) { crCount(t1); }
      cr.raf = requestAnimationFrame(crTick);
    };
    var crSync = function () {
      var go = cr.visible && !cr.paused && !cr.focus && !document.hidden;
      if (go === cr.running) { return; }
      cr.running = go;
      crProto.classList.toggle("is-held", !go);
      if (go) {
        if (cr.fresh) { cr.fresh = false; crSeek(0); }
        crBar(true);
        cr.last = performance.now();
        cr.raf = requestAnimationFrame(crTick);
      } else {
        cancelAnimationFrame(cr.raf);
        crBar(false);
      }
    };
    var crSetPaused = function (p) {
      cr.paused = p;
      crToggle.setAttribute("aria-pressed", String(p));
      crToggle.querySelector("span").textContent = p ? "Запустить анимацию" : "Остановить анимацию";
      crToggle.classList.toggle("is-paused", p);
    };
    var crMotion = !reduceMotion && "IntersectionObserver" in window;
    var crPick = function (k) {
      if (!crMotion) { crSeek(CR_STILLS[k]); return; }
      cancelAnimationFrame(cr.raf);
      cr.running = false; cr.fresh = false;
      crSeek(CR_SEG[k]);
      crSetPaused(false);
      crBar(false);
      crSync();
    };
    crTabs.forEach(function (tab, i) {
      tab.addEventListener("click", function () { crPick(i); });
      tab.addEventListener("keydown", function (e) {
        var d = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
        var n = e.key === "Home" ? 0 : e.key === "End" ? crTabs.length - 1 : d ? (i + d + crTabs.length) % crTabs.length : -1;
        if (n < 0) { return; }
        e.preventDefault();
        crPick(n);
        crTabs[n].focus();
      });
    });
    if (crMotion) {
      crToggle.hidden = false;
      crToggle.addEventListener("click", function () {
        crSetPaused(!cr.paused);
        crBar(false); crSync();
      });
      // Only keyboard focus in the list pauses; a resting mouse cursor must not freeze the autoplay.
      if (crTabList) {
        crTabList.addEventListener("focusin", function (e) { if (e.target.matches(":focus-visible")) { cr.focus = true; crSync(); } });
        crTabList.addEventListener("focusout", function (e) { if (!crTabList.contains(e.relatedTarget)) { cr.focus = false; crSync(); } });
      }
      observeWhenShown(new IntersectionObserver(function (entries) {
        cr.visible = entries[0].isIntersecting;
        if (!cr.visible && !cr.paused) { cr.fresh = true; }
        crSync();
      }, { threshold: 0.35 }), crStage || crProto);
      document.addEventListener("visibilitychange", crSync);
    } else {
      crSeek(CR_STILL);
    }
  }
})(window.Raccoon);
