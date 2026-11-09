// RaccoonAI page script: DriverApp screens: one shift in the phone (driverapp.html).
// One feature per file, so an error here cannot stop the others; js/core.js loads first and shares window.Raccoon.

(function (R) {
  "use strict";
  if (!R) { return; }
  var reduceMotion = R.reduceMotion, observeWhenShown = R.observeWhenShown;

  /* ---------- DriverApp screens: one shift plays in the phone, the Platform card follows, the list keeps pace ----------
     The story (≈74 s) follows the DriverApp Figma frames: the route list scrolls and returns, job 1 is picked, 2ГИС, the truck
     drives the streets to the site, «Начать задание» is swiped, the before photo (count +1, the phone turns for the camera,
     the shot, «Готово»), ten minutes pass, the after photo, the closed task. Then job 2 is picked from the route list, the
     truck drives on, and the site is blocked by parked cars: the error button pulses, «Сообщить о проблеме на задаче» opens,
     «КП запаркована машинами» is tapped and the trip shows the problem banner. Three hours pass, «Поехать на Разгрузку», the
     drive to the unload point, «Завершить маршрут». Last, Профиль: the profile slides in, the month of shifts lands day by
     day, and one day of each colour is tapped to open its tooltip. Then it loops.
     One story clock drives everything: keyframes set data-* states on .dh-proto (CSS draws them), and the truck is placed from
     the clock each frame, so pausing, seeking from the tab list and resuming all land on a coherent picture. Taps and drags are
     transient and skipped when seeking. It runs only while the stage is 35% visible and the page is shown; the text button pauses
     it (WCAG 2.2.2) and keyboard focus in the list pauses too. Reduced motion: no autoplay; the tabs jump to still frames. */
  var dhProto = document.getElementById("dh-proto");
  var dhToggle = document.getElementById("dh-toggle");
  /* Two columns: the stage is 80% of the viewport tall (CSS) and the device takes all of it the switch and caption rows leave,
     within the stage width. --s scales the screen (412 x 947 phone, 1280 x 800 tablet); one column: the phone keeps its CSS
     size, the tablet fills the width. */
  var drvStage = dhProto && dhProto.closest(".drv-stage");
  var drvSwitch = drvStage && drvStage.querySelector(".dh-device");
  var drvFit = function () {};
  if (drvStage && window.ResizeObserver) {
    var drvWide = window.matchMedia("(min-width: 861px)");
    var outerH = function (el) { var c = getComputedStyle(el); return el.offsetHeight + (parseFloat(c.marginTop) || 0) + (parseFloat(c.marginBottom) || 0); };
    drvFit = function () {
      var tablet = dhProto.getAttribute("data-device") === "tablet";
      if (!drvWide.matches && !tablet) { dhProto.style.removeProperty("--s"); return; }
      var cs = getComputedStyle(drvStage), top = 0, row = 0;
      Array.prototype.forEach.call(drvStage.children, function (c) {
        if (c === dhProto || c.offsetParent === null) { return; }
        if (c === drvSwitch) { top = outerH(c); } else { row = Math.max(row, outerH(c)); }
      });
      var h = drvStage.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom) - top - row;
      var w = drvStage.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      var W = tablet ? 1280 : 412, H = tablet ? 800 : 947, B = tablet ? 24 : 18;
      var s = drvWide.matches ? Math.min((h - B) / H, (w - B) / W) : (w - B) / W;
      dhProto.style.setProperty("--s", Math.max(.2, s).toFixed(4));
    };
    new ResizeObserver(function () { drvFit(); }).observe(drvStage);
    drvWide.addEventListener("change", function () { drvFit(); });
  }
  var drvTabs = Array.prototype.slice.call(document.querySelectorAll('.drv-tabs [role="tab"]'));
  var drvTabList = document.querySelector(".drv-tabs");
  if (dhProto && dhToggle && drvTabs.length === 6 && dhProto.querySelector(".da-truck-run")) {
    var dhTap = dhProto.querySelector(".hp-tap");
    var dTruck = dhProto.querySelector(".da-truck-run");
    var dCase = dhProto.querySelector(".da-route-case"), dLine = dhProto.querySelector(".da-route-line");
    var drvPanels = drvTabs.map(function (t) { return document.getElementById(t.getAttribute("aria-controls")); });
    var dS = function (k, v) { if (v == null) { dhProto.removeAttribute("data-" + k); } else { dhProto.setAttribute("data-" + k, v); } };
    var dC = function (k, on) { dhProto.classList.toggle(k, !!on); };

    /* Truck routes on the street raster, Figma frame px (412 x 917): street centrelines, a turn at each crossing, like a real
       trip through the grid. To the site: up Чайковского, east on Шевченко, up to Жамбыла, east to the site. To the unload
       point: the same streets back and down, then west on Курмангазы. */
    var mkRoute = function (pts, r) {
      var d = "M" + pts[0][0] + " " + pts[0][1];
      for (var i = 1; i < pts.length - 1; i++) {
        var p = pts[i], a = pts[i - 1], b = pts[i + 1];
        var la = Math.hypot(p[0] - a[0], p[1] - a[1]), lb = Math.hypot(b[0] - p[0], b[1] - p[1]), k = Math.min(r, la / 2, lb / 2);
        d += " L" + (p[0] - (p[0] - a[0]) / la * k).toFixed(1) + " " + (p[1] - (p[1] - a[1]) / la * k).toFixed(1) +
          " Q" + p[0] + " " + p[1] + " " + (p[0] + (b[0] - p[0]) / lb * k).toFixed(1) + " " + (p[1] + (b[1] - p[1]) / lb * k).toFixed(1);
      }
      var z = pts[pts.length - 1];
      d += " L" + z[0] + " " + z[1];
      // sample the path once: position, heading, and a time table where the truck eases off before each turn
      var probe = document.createElementNS("http://www.w3.org/2000/svg", "path");
      probe.setAttribute("d", d);
      dLine.parentNode.appendChild(probe);
      var L = probe.getTotalLength(), N = Math.ceil(L / 2), xs = [], ys = [], ts = [0], turnS = [], acc = 0;
      for (var j = 0; j <= N; j++) { var q = probe.getPointAtLength(L * j / N); xs.push(q.x); ys.push(q.y); }
      for (var c = 1; c < pts.length - 1; c++) { // arc length at each crossing
        var best = 0, bd = 1e9;
        for (var m = 0; m <= N; m++) { var dd = Math.hypot(xs[m] - pts[c][0], ys[m] - pts[c][1]); if (dd < bd) { bd = dd; best = m; } }
        turnS.push(L * best / N);
      }
      for (var n = 1; n <= N; n++) {
        var s = L * n / N, v = Math.min(1, .25 + s / 60, .25 + (L - s) / 70);
        turnS.forEach(function (ts0) { v = Math.min(v, .38 + Math.abs(s - ts0) / 55); });
        acc += (L / N) / v; ts.push(acc);
      }
      probe.remove();
      return { d: d, L: L, N: N, xs: xs, ys: ys, ts: ts, total: acc };
    };
    var R_SITE = mkRoute([[158, 652], [158, 558], [144.5, 366], [281.3, 358], [274.5, 177.6], [312, 176.1]], 14);
    var R_SITE2 = mkRoute([[312, 176.1], [120, 184]], 14); // job 2: west along Жамбыла
    var R_DUMP = mkRoute([[312, 176.1], [274.5, 177.6], [281.3, 358], [144.5, 366], [158, 558], [124, 559.6]], 14);
    var routeAt = function (R, p) { // p: 0..1 of the drive's time -> point and heading
      var want = p * R.total, lo = 0, hi = R.N;
      while (lo < hi) { var mid = (lo + hi) >> 1; if (R.ts[mid] < want) { lo = mid + 1; } else { hi = mid; } }
      var i = Math.max(1, Math.min(R.N - 1, lo));
      return { x: R.xs[lo], y: R.ys[lo], s: R.L * lo / R.N, a: Math.atan2(R.ys[i + 1] - R.ys[i - 1], R.xs[i + 1] - R.xs[i - 1]) * 180 / Math.PI };
    };

    /* The story: [ms, state setter, transient?]. Tap coordinates are Figma frame px (phone); the tablet taps the element. */
    var D_SITE = [8500, 13700], D_SITE2 = [41700, 45200], D_DUMP = [62600, 67800];
    var SKIP2 = 57600; // «3 часа спустя»: under the card the truck is back on its way, at the start of the unload drive
    var TURN = 700; // job 2 starts with the truck turning round on the spot
    var tapAt = function (x, y, drag) {
      dhTap.style.setProperty("--tx", x + "px");
      dhTap.style.setProperty("--ty", (y + 30) + "px"); // + the status bar
      dhTap.classList.remove("is-pressing", "is-dragging");
      void dhTap.offsetWidth;
      dhTap.classList.add(drag ? "is-dragging" : "is-pressing");
    };
    // A tap on an element of the screen, wherever the layout put it (frame px, as tapAt takes them)
    var dsBox = dhProto.querySelector(".ds");
    var tapEl = function (el, drag) {
      var s = dsBox.getBoundingClientRect(), r = el.getBoundingClientRect(), k = s.width / dsBox.offsetWidth;
      tapAt((r.left - s.left + (drag ? 24 * k : r.width / 2)) / k, (r.top - s.top + r.height / 2) / k - 30, drag);
    };
    /* A story tap: on the phone at its Figma frame point (the camera taps land in a turned phone, where element boxes would
       lie); on the tablet on the element itself, wherever the wider layout put it */
    var tap = function (sel, x, y, drag) {
      if (dhProto.getAttribute("data-device") === "tablet") { tapEl(dhProto.querySelector(sel), drag); } else { tapAt(x, y, drag); }
    };
    // Profile: the days land in order; a tapped day gets the ring and its tooltip opens above it, kept inside the calendar card
    var pDays = Array.prototype.slice.call(dhProto.querySelectorAll(".da-day"));
    pDays.forEach(function (d, i) { d.style.setProperty("--i", i); });
    var pTip = dhProto.querySelector(".da-tip"), pCal = dhProto.querySelector(".da-cal");
    var dayEl = function (n) { return pDays[n - 1]; };
    var showTip = function (t, n) {
      dS("tip", t);
      pDays.forEach(function (d, i) { d.classList.toggle("is-sel", !!t && i === n - 1); });
      if (!t) { return; }
      var c = dayEl(n), w = pTip.offsetWidth, h = pTip.offsetHeight;
      var x = Math.max(8, Math.min(pCal.offsetWidth - w - 8, c.offsetLeft + c.offsetWidth / 2 - w / 2));
      pTip.style.left = x + "px"; pTip.style.top = (c.offsetTop - h - 10) + "px";
      pTip.classList.remove("is-pop"); void pTip.offsetWidth; pTip.classList.add("is-pop");
    };
    var press = function (k) { dC("is-press-" + k, true); window.setTimeout(function () { dC("is-press-" + k, false); }, 240); };
    var INIT = function () {
      dS("scr", "map"); dS("sheet", "route"); dS("zoom", "city"); dS("scroll", "0"); dS("task", "start"); dS("pg", "b0");
      dS("swipe", null); dS("cam", null); dS("skip", null); dS("route", null); dS("job", null); dS("block", null); dS("geo", null); showTip(null);
      ["is-pick", "is-arrived", "is-here", "is-six", "is-shot", "is-alert", "is-boot"].forEach(function (k) { dC(k, false); });
      dS("shift", null); dS("pre", null); dS("pick", null); dS("depot", null); dS("med", null);
    };
    /* Chapter 0, before the route: the app starts (its parts slide in from the screen edges), the medical check is passed and
       the waybill issued, «Выйти на линию», the shift of the day, «Вы не в ДЕПО» on the first swipe, on the line on the second,
       «Готов к новому маршруту» and the wait. At T0 the route arrives and the shift story above plays on, shifted by T0. */
    var T0 = 18000;
    var PRE = [
      [0, function () { INIT(); dS("sheet", "out"); dS("shift", "plan"); dS("pre", "1"); dC("is-boot", true); }],
      [250, function () { dC("is-boot", false); }],
      [2000, function () { dS("med", "1"); }],
      [4900, function () { dS("med", null); }],
      [5600, function () { tap(".da-btn-out", 206, 813); press("out"); }, 1],
      [5900, function () { dS("sheet", "pick"); }],
      [7300, function () { tap(".da-shift-1", 206, 655); press("shift"); }, 1], [7450, function () { dS("pick", "1"); }],
      [8700, function () { tap('.da-swipe[data-swipe="shift"] .da-swipe-knob', 40, 805, true); }, 1], [8750, function () { dS("swipe", "shift"); }],
      [9800, function () { dS("swipe", null); dS("depot", "1"); }],
      [11900, function () { tap('.da-swipe[data-swipe="shift"] .da-swipe-knob', 40, 805, true); }, 1], [11950, function () { dS("swipe", "shift"); }],
      [13050, function () { dS("depot", null); dS("shift", null); dS("sheet", "go"); }],
      [13600, function () { dS("swipe", null); }],
      [14900, function () { tap('.da-swipe[data-swipe="ready"] .da-swipe-knob', 40, 805, true); }, 1], [14950, function () { dS("swipe", "ready"); }],
      [16050, function () { dS("sheet", "wait"); }],
      [16600, function () { dS("swipe", null); }]
    ];
    var STORY_SHIFT = [
      [0, INIT],
      [700, function () { dS("scroll", "1"); }], [1900, function () { dS("scroll", "2"); }], [3100, function () { dS("scroll", "3"); }],
      [4500, function () { dS("scroll", "0"); }],
      [5800, function () { tap(".da-sh-route .da-job-first .da-card", 220, 692); }, 1], [6000, function () { dC("is-pick", true); }],
      [6400, function () { dS("sheet", "job"); dS("zoom", "near"); dC("is-pick", false); }],
      [7900, function () { tap(".da-sh-job .da-btn-2gis", 105, 741); press("2gis"); }, 1],
      [8200, function () { dS("route", "site"); }],
      [D_SITE[1], function () { dC("is-arrived", true); dS("geo", "1"); }],
      [14500, function () { tap('.da-swipe[data-swipe="start"] .da-swipe-knob', 40, 805, true); }, 1], [14550, function () { dS("swipe", "start"); }],
      [15700, function () { dS("sheet", "task"); dS("task", "start"); dS("route", null); dC("is-arrived", false); }],
      [16400, function () { dS("swipe", null); }],
      [16900, function () { tap(".da-btn-before", 105, 813); press("before"); }, 1],
      [17200, function () { dS("scr", "page"); dS("pg", "b0"); }],
      [18400, function () { tap(".da-plus", 370, 175); press("plus"); }, 1], [18550, function () { dC("is-six", true); }],
      [19500, function () { tap(".da-take", 206, 311); press("take"); }, 1],
      [19900, function () { dS("cam", "b"); }],
      [21300, function () { tap(".da-shutter", 206, 810); }, 1], [21450, function () { dC("is-shot", true); }, 1], [22100, function () { dC("is-shot", false); }],
      [22300, function () { dS("cam", null); dS("pg", "b1"); }],
      [23900, function () { tap(".da-ready", 206, 813); press("ready"); }, 1],
      [24200, function () { dS("scr", "map"); dS("task", "do"); }],
      [25500, function () { dS("skip", "1"); }], [28100, function () { dS("skip", null); }],
      [28800, function () { tap(".da-btn-after", 308, 813); press("after"); }, 1],
      [29100, function () { dS("scr", "page"); dS("pg", "a0"); }],
      [30300, function () { tap(".da-take", 206, 218); press("take"); }, 1],
      [30700, function () { dS("cam", "a"); }],
      [32100, function () { tap(".da-shutter", 206, 810); }, 1], [32250, function () { dC("is-shot", true); }, 1], [32900, function () { dC("is-shot", false); }],
      [33100, function () { dS("cam", null); dS("pg", "a1"); }],
      [34600, function () { tap(".da-ready", 206, 813); press("ready"); }, 1],
      [34900, function () { dS("scr", "map"); dS("task", "done"); }],
      // job 2: back to the route list (site 1 done), pick the next site, 2ГИС, drive on
      [36900, function () { tap(".da-btn-next", 206, 813); press("next"); }, 1],
      [37200, function () { dS("sheet", "route"); dS("job", "2"); dS("scroll", "0"); }],
      [38300, function () { dS("scroll", "j2"); }],
      [39500, function () { tap(".da-sh-route .da-job-second .da-card", 220, 692); }, 1], [39700, function () { dC("is-pick", true); }],
      [40100, function () { dS("sheet", "job"); dC("is-pick", false); }],
      [41400, function () { tap(".da-sh-job .da-btn-2gis", 105, 741); press("2gis"); }, 1],
      [41700, function () { dS("route", "site"); dS("geo", null); }],
      // the site is blocked: the scene, then the pulsing error button, the reasons, «КП запаркована машинами»
      [D_SITE2[1], function () { dC("is-arrived", true); dS("geo", "2"); }],
      [45800, function () { dS("block", "1"); }],
      [50000, function () { dS("block", null); }],
      [50700, function () { dC("is-alert", true); }],
      [52400, function () { tap(".da-sh-job .da-fab-err", 380, 296); }, 1],
      [52700, function () { dS("scr", "issue"); dC("is-alert", false); }],
      [54400, function () { tap(".da-reason-1", 206, 169); press("reason"); }, 1],
      [54700, function () { dS("scr", "map"); dS("sheet", "issue"); dS("route", null); dC("is-arrived", false); }],
      // three hours later: the rest of the trip and the unload point
      [SKIP2, function () { dS("skip", "2"); dS("geo", null); }],
      [57900, function () { dS("sheet", "list"); }],
      [60200, function () { dS("skip", null); }],
      [61000, function () { tap('.da-swipe[data-swipe="unload"] .da-swipe-knob', 40, 805, true); }, 1], [61050, function () { dS("swipe", "unload"); }],
      [62200, function () { dS("sheet", "unload"); }],
      [62400, function () { dS("route", "dump"); }],
      [62900, function () { dS("swipe", null); }],
      [D_DUMP[1], function () { dC("is-here", true); dS("route", null); dS("geo", "dump"); }],
      [69000, function () { tap('.da-swipe[data-swipe="finish"] .da-swipe-knob', 40, 805, true); }, 1], [69050, function () { dS("swipe", "finish"); }],
      [70200, function () { dS("sheet", "fin"); }],
      [70900, function () { dS("swipe", null); }],
      // Профиль: the tab, the profile, then one tooltip per day colour
      [74200, function () { tap(".da-tab-prof i", 333, 878); press("profile"); }, 1],
      [74500, function () { dS("scr", "profile"); }],
      [76800, function () { tapEl(dayEl(6)); }, 1], [76950, function () { showTip("m", 6); press("day"); }],
      [78800, function () { tapEl(dayEl(9)); }, 1], [78950, function () { showTip("d", 9); press("day"); }],
      [80800, function () { tapEl(dayEl(11)); }, 1], [80950, function () { showTip("o", 11); press("day"); }],
      [82800, function () { tapEl(dayEl(14)); }, 1], [82950, function () { showTip("a", 14); press("day"); }],
      [84800, function () { tapEl(dayEl(15)); }, 1], [84950, function () { showTip("mo", 15); press("day"); }],
      [86800, function () { tapEl(dayEl(17)); }, 1], [86950, function () { showTip("p", 17); press("day"); }],
      [88800, function () { tapEl(dayEl(21)); }, 1], [88950, function () { showTip("n", 21); press("day"); }]
    ];
    var STORY = PRE.concat(STORY_SHIFT.map(function (e) { return [e[0] + T0, e[1], e[2]]; }));
    // the list follows the story in order, one tab per chapter: [start ms, tab]. The release from the depot, the route and
    // job 1, the photo report, job 2 and the problem report, the drive to the unload point, the shift schedule.
    var DRV_SEG = [[0, 0], [T0, 1], [T0 + 16900, 2], [T0 + 36900, 3], [T0 + SKIP2, 4], [T0 + 74200, 5]], DRV_END = T0 + 91800;
    // reduced motion: the shift picked, route, the closed task, the reasons, the closed route, a tooltip
    var DRV_STILL = [7600, T0, T0 + 35000, T0 + 53200, T0 + 70500, T0 + 77500];
    var DRV_STATIC = -1; // no static screen: every tab is part of the story
    var segAt = function (t) { var k = 0; DRV_SEG.forEach(function (s, i) { if (t >= s[0]) { k = i; } }); return k; };

    var tHalf = 33; // half the truck marker: 66px on the phone, 99px on the tablet
    var placeTruck = function (t) {
      t -= T0; // the drives are timed on the shift story's clock
      var R = t < D_SITE2[0] ? R_SITE : t < SKIP2 ? R_SITE2 : R_DUMP;
      var D = R === R_SITE ? D_SITE : R === R_SITE2 ? [D_SITE2[0] + TURN, D_SITE2[1]] : D_DUMP;
      var p = Math.max(0, Math.min(1, (t - D[0]) / (D[1] - D[0])));
      var q = routeAt(R, p);
      if (R === R_SITE2 && t < D[0]) { // turning round at site 1: from the heading it arrived with to the new one
        var a0 = routeAt(R_SITE, 1).a, k = Math.max(0, (t - D_SITE2[0]) / TURN), e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
        var da = ((q.a - a0) % 360 + 540) % 360 - 180;
        if (Math.abs(da) > 179) { da = -180; } // a U-turn swings left, as on a right-hand road
        q.a = a0 + da * e;
      }
      dTruck.style.transform = "translate(" + (q.x - tHalf).toFixed(1) + "px," + (q.y - tHalf).toFixed(1) + "px) rotate(" + q.a.toFixed(1) + "deg)";
      if (dCase.getAttribute("d") !== R.d) { dCase.setAttribute("d", R.d); dLine.setAttribute("d", R.d); }
      var dash = "0 " + q.s.toFixed(1) + " " + (R.L + 2).toFixed(1);
      dCase.style.strokeDasharray = dash; dLine.style.strokeDasharray = dash;
    };
    var showSeg = function (k) {
      var tab = DRV_SEG[k][1], story = tab !== DRV_STATIC;
      drvTabs.forEach(function (t, n) { t.setAttribute("aria-selected", String(n === tab)); t.tabIndex = n === tab ? 0 : -1; });
      drvPanels.forEach(function (p, n) { p.hidden = n === DRV_STATIC ? story : !story; });
    };

    var drv = { t: 0, seg: -1, raf: 0, last: 0, visible: false, paused: false, focus: false, running: false, fresh: true };
    var drvBar = function (running) {
      var k = drv.seg, a = DRV_SEG[k][0], b = k + 1 < DRV_SEG.length ? DRV_SEG[k + 1][0] : DRV_END, tab = DRV_SEG[k][1];
      drvTabs.forEach(function (t, n) {
        t.classList.toggle("is-auto", n === tab && !drv.paused);
        t.classList.remove("is-running");
        if (n !== tab) { return; }
        t.style.setProperty("--auto-from", String((drv.t - a) / (b - a)));
        t.style.setProperty("--auto-left", Math.max(0, b - drv.t) + "ms");
        void t.offsetWidth; // restart the bar's transition
        if (running) { t.classList.add("is-running"); }
      });
    };
    // Rebuild the picture at time t without transitions: replay every state keyframe up to t, skip the taps
    var seek = function (t) {
      dhProto.classList.add("is-reset");
      STORY.forEach(function (e) { if (e[0] <= t && !e[2]) { e[1](); } });
      dhTap.classList.remove("is-pressing", "is-dragging");
      drv.t = t; drv.seg = segAt(t);
      showSeg(drv.seg); placeTruck(t);
      void dhProto.offsetWidth;
      dhProto.classList.remove("is-reset");
    };
    var tick = function (now) {
      var dt = Math.min(100, now - drv.last), t0 = drv.t;
      drv.last = now;
      var t1 = t0 + dt;
      if (t1 >= DRV_END) { seek(0); drvBar(true); drv.raf = requestAnimationFrame(tick); return; }
      STORY.forEach(function (e) { if (e[0] > t0 && e[0] <= t1) { e[1](); } });
      drv.t = t1;
      var k = segAt(t1);
      if (k !== drv.seg) { drv.seg = k; showSeg(k); drvBar(true); }
      var l0 = t0 - T0, l1 = t1 - T0;
      if ([D_SITE, D_SITE2, D_DUMP].some(function (D) { return l1 >= D[0] - 50 && l0 <= D[1] + 50; }) || (l0 < SKIP2 && l1 >= SKIP2)) { placeTruck(t1); }
      drv.raf = requestAnimationFrame(tick);
    };
    var drvSync = function () {
      var go = drv.visible && !drv.paused && !drv.focus && !document.hidden;
      if (go === drv.running) { return; }
      drv.running = go;
      dC("is-held", !go);
      if (go) {
        if (drv.fresh) { drv.fresh = false; seek(0); }
        drvBar(true);
        drv.last = performance.now();
        drv.raf = requestAnimationFrame(tick);
      } else {
        cancelAnimationFrame(drv.raf);
        drvBar(false);
      }
    };
    var drvSetPaused = function (p) {
      drv.paused = p;
      dhToggle.setAttribute("aria-pressed", String(p));
      dhToggle.querySelector("span").textContent = p ? "Запустить анимацию" : "Остановить анимацию";
      dhToggle.classList.toggle("is-paused", p);
    };
    var drvMotion = !reduceMotion && "IntersectionObserver" in window;
    // A tab picked by the visitor: the story's tabs jump to their start and play on, a static tab holds its screen
    var drvPick = function (tab) {
      if (!drvMotion) { seek(DRV_STILL[tab]); return; }
      cancelAnimationFrame(drv.raf);
      drv.running = false; drv.fresh = false;
      var first = DRV_SEG.filter(function (s) { return s[1] === tab; })[0][0];
      seek(tab === DRV_STATIC ? DRV_STILL[tab] : Math.max(0, first - 200));
      drvSetPaused(tab === DRV_STATIC);
      drvBar(false);
      drvSync();
    };

    drvTabs.forEach(function (tab, i) {
      tab.addEventListener("click", function () { drvPick(i); });
      tab.addEventListener("keydown", function (e) {
        var k = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
        var n = e.key === "Home" ? 0 : e.key === "End" ? drvTabs.length - 1 : k ? (i + k + drvTabs.length) % drvTabs.length : -1;
        if (n < 0) { return; }
        e.preventDefault();
        drvPick(n);
        drvTabs[n].focus();
      });
    });

    /* Device switch: the same moment of the story, redrawn on the other device, in the same column. Under 600px only the phone
       fits. */
    if (drvSwitch) {
      var devBtns = Array.prototype.slice.call(drvSwitch.querySelectorAll("button"));
      var setDevice = function (dev) {
        if ((dhProto.getAttribute("data-device") || "phone") === dev) { return; }
        var y0 = drvSwitch.getBoundingClientRect().top;
        devBtns.forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-device") === dev)); });
        if (dev === "tablet") { dhProto.setAttribute("data-device", dev); } else { dhProto.removeAttribute("data-device"); }
        tHalf = dev === "tablet" ? 49.5 : 33;
        drvFit();
        seek(drv.fresh ? 0 : drv.t);
        if (drvMotion) { drvBar(drv.running); }
        var dy = drvSwitch.getBoundingClientRect().top - y0;
        if (dy && drvSwitch.offsetParent) { window.scrollBy(0, dy); }
        if (!reduceMotion) { dC("is-swap", false); void dhProto.offsetWidth; dC("is-swap", true); }
      };
      devBtns.forEach(function (b) { b.addEventListener("click", function () { setDevice(b.getAttribute("data-device")); }); });
      dhProto.addEventListener("animationend", function (e) { if (e.animationName === "dh-swap") { dC("is-swap", false); } });
      var drvRoomy = window.matchMedia("(min-width: 600px)");
      drvRoomy.addEventListener("change", function () { if (!drvRoomy.matches) { setDevice("phone"); } });
      drvSwitch.hidden = false;
      drvFit();
    }

    placeTruck(0);
    if (drvMotion) {
      dhToggle.hidden = false;
      dhToggle.addEventListener("click", function () { drvSetPaused(!drv.paused); drvBar(false); drvSync(); });
      observeWhenShown(new IntersectionObserver(function (entries) {
        drv.visible = entries[0].isIntersecting;
        if (!drv.visible && !drv.paused) { drv.fresh = true; }
        drvSync();
      }, { threshold: 0.35 }), dhProto);
      document.addEventListener("visibilitychange", drvSync);
      // Only keyboard focus in the list pauses; a resting mouse cursor must not freeze the autoplay.
      drvTabList.addEventListener("focusin", function (e) { if (e.target.matches(":focus-visible")) { drv.focus = true; drvSync(); } });
      drvTabList.addEventListener("focusout", function (e) { if (!drvTabList.contains(e.relatedTarget)) { drv.focus = false; drvSync(); } });
    } else {
      seek(DRV_STILL[0]);
    }
  }
})(window.Raccoon);
