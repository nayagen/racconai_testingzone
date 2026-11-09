// RaccoonAI page script: Client App prototype (clientapp.html #screens).
// One feature per file, so an error here cannot stop the others; js/core.js loads first and shares window.Raccoon.

(function (R) {
  "use strict";
  if (!R) { return; }
  var reduceMotion = R.reduceMotion, observeWhenShown = R.observeWhenShown;

  /* ---------- Client App prototype (clientapp.html #screens) ----------
     One story clock, as on the DriverApp page: keyframes set data-* states on .ca-proto (CSS draws them) and the truck is
     placed from the clock each frame, so pausing, seeking from the tab list and resuming all land on a coherent picture.
     Taps are transient and skipped when seeking. Tab 1 is the request (start, auto-fill, who meets, the date, confirm),
     tab 2 the status (Запланирована → Назначено → Машина в пути → Машина прибыла → Выполнено, 3s each, the truck driving
     the streets to the pin and away), tab 3 the photo report; tab 4 (WhatsApp) is a static placeholder. It runs only while
     the stage is 35% visible and the page is shown; the text button pauses it (WCAG 2.2.2) and keyboard focus in the list
     pauses too. Reduced motion: no autoplay; the tabs jump to still frames. */
  var caProto = document.getElementById("ca-p1");
  var caTabs = Array.prototype.slice.call(document.querySelectorAll('.ca-tabs [role="tab"]'));
  var caToggle = document.getElementById("ca-toggle");
  if (caProto && caToggle && caTabs.length === 4 && caProto.querySelector(".ca-truck")) {
    var caTabList = document.querySelector(".ca-tabs");
    var caStatic = document.getElementById("ca-p4");
    var cTap = caProto.querySelector(".hp-tap"), cDs = caProto.querySelector(".ds"), cTruck = caProto.querySelector(".ca-truck");
    var cS = function (k, v) { if (v == null) { caProto.removeAttribute("data-" + k); } else { caProto.setAttribute("data-" + k, v); } };
    var cC = function (k, on) { caProto.classList.toggle(k, !!on); };

    /* Two columns: the stage is 80% of the viewport tall (CSS) and the phone takes the room the caption row leaves */
    var caStage = caProto.closest(".drv-stage");
    if (caStage && window.ResizeObserver) {
      var caWide = window.matchMedia("(min-width: 861px)");
      var caOuter = function (el) { var c = getComputedStyle(el); return el.offsetHeight + (parseFloat(c.marginTop) || 0) + (parseFloat(c.marginBottom) || 0); };
      var caFit = function () {
        if (!caWide.matches) { caProto.style.removeProperty("--s"); return; }
        var cs = getComputedStyle(caStage), row = 0;
        Array.prototype.forEach.call(caStage.children, function (c) {
          if (c === caProto || c === caStatic || c.offsetParent === null) { return; }
          row = Math.max(row, caOuter(c));
        });
        var h = caStage.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom) - row;
        var w = caStage.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
        caProto.style.setProperty("--s", Math.max(.2, Math.min((h - 18) / 947, (w - 18) / 412)).toFixed(4));
      };
      new ResizeObserver(function () { caFit(); }).observe(caStage);
      caWide.addEventListener("change", caFit);
    }

    /* The truck's drives on the street raster, map px (412 x 916): down the street west of the site and into its yard;
       then, turned round, back out, down to Шевченко and south on Чайковского until it leaves the map under the sheet.
       Corners are rounded; the truck eases off into each turn. */
    var cProbeSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    cProbeSvg.setAttribute("width", "0"); cProbeSvg.setAttribute("height", "0");
    cProbeSvg.style.position = "absolute";
    caProto.appendChild(cProbeSvg);
    var caRoute = function (pts, r) {
      var d = "M" + pts[0][0] + " " + pts[0][1];
      for (var i = 1; i < pts.length - 1; i++) {
        var p = pts[i], a = pts[i - 1], b = pts[i + 1];
        var la = Math.hypot(p[0] - a[0], p[1] - a[1]), lb = Math.hypot(b[0] - p[0], b[1] - p[1]), k = Math.min(r, la / 2, lb / 2);
        d += " L" + (p[0] - (p[0] - a[0]) / la * k).toFixed(1) + " " + (p[1] - (p[1] - a[1]) / la * k).toFixed(1) +
          " Q" + p[0] + " " + p[1] + " " + (p[0] + (b[0] - p[0]) / lb * k).toFixed(1) + " " + (p[1] + (b[1] - p[1]) / lb * k).toFixed(1);
      }
      d += " L" + pts[pts.length - 1][0] + " " + pts[pts.length - 1][1];
      var probe = document.createElementNS("http://www.w3.org/2000/svg", "path");
      probe.setAttribute("d", d);
      cProbeSvg.appendChild(probe);
      var L = probe.getTotalLength(), N = Math.ceil(L / 2), xs = [], ys = [], ts = [0], turnS = [], acc = 0;
      for (var j = 0; j <= N; j++) { var q = probe.getPointAtLength(L * j / N); xs.push(q.x); ys.push(q.y); }
      for (var c = 1; c < pts.length - 1; c++) {
        var best = 0, bd = 1e9;
        for (var m = 0; m <= N; m++) { var dd = Math.hypot(xs[m] - pts[c][0], ys[m] - pts[c][1]); if (dd < bd) { bd = dd; best = m; } }
        turnS.push(L * best / N);
      }
      for (var n = 1; n <= N; n++) {
        var s = L * n / N, v = Math.min(1, .25 + s / 50, .25 + (L - s) / 60);
        turnS.forEach(function (t0) { v = Math.min(v, .4 + Math.abs(s - t0) / 45); });
        acc += (L / N) / v; ts.push(acc);
      }
      probe.remove();
      return { L: L, N: N, xs: xs, ys: ys, ts: ts, total: acc };
    };
    var caAt = function (R, p) {
      var want = p * R.total, lo = 0, hi = R.N;
      while (lo < hi) { var mid = (lo + hi) >> 1; if (R.ts[mid] < want) { lo = mid + 1; } else { hi = mid; } }
      var i = Math.max(1, Math.min(R.N - 1, lo));
      return { x: R.xs[lo], y: R.ys[lo], a: Math.atan2(R.ys[i + 1] - R.ys[i - 1], R.xs[i + 1] - R.xs[i - 1]) * 180 / Math.PI };
    };
    var C_IN = caRoute([[113.3, 46.5], [121, 186], [127, 277], [178.2, 274.4]], 16);
    var C_OUT = caRoute([[178.2, 274.4], [131, 277], [137, 366], [146, 366], [149.3, 408.5], [161, 700], [165, 990]], 14);

    // The press: a ring on the element's centre (design px in the 412 x 947 screen), and the element dips
    var cPress = function (sel) {
      var el = caProto.querySelector(sel);
      var s = cDs.getBoundingClientRect(), r = el.getBoundingClientRect(), k = s.width / cDs.offsetWidth || 1;
      cTap.style.setProperty("--tx", ((r.left - s.left + r.width / 2) / k).toFixed(1) + "px");
      cTap.style.setProperty("--ty", ((r.top - s.top + r.height / 2) / k).toFixed(1) + "px");
      cTap.classList.remove("is-pressing");
      void cTap.offsetWidth;
      cTap.classList.add("is-pressing");
      el.classList.add("is-press");
      window.setTimeout(function () { el.classList.remove("is-press"); }, 220);
    };
    var tapF = function (sel) { return function () { cPress(sel); }; };
    var C_INIT = function () {
      cS("scr", "list"); cS("list", "empty");
      ["sheet", "fill", "toast", "pg", "who", "add", "day", "date", "alert", "st", "rep"].forEach(function (k) { cS(k, null); });
      cC("is-boot", false);
    };
    /* The story: [ms, state setter, transient?] */
    var C_DRIVE_IN = [32100, 35100], C_TURN = [38100, 38800], C_DRIVE_OUT = [38800, 41800];
    var CA_STORY = [
      // 1. the app starts on an empty list; «Новая заявка» opens the order sheet over the map
      [0, function () { C_INIT(); cC("is-boot", true); }],
      [250, function () { cC("is-boot", false); }],
      [1900, tapF(".ca-btn-new"), 1],
      [2200, function () { cS("scr", "create"); cS("sheet", "main"); }],
      // the client has one container site: the message, then the form fills itself and the site appears on the map
      [3300, function () { cS("toast", "1"); }],
      [3900, function () { cS("fill", "new"); }],
      [5000, function () { cS("fill", "1"); }],
      [6300, function () { cS("toast", null); }],
      [6900, tapF(".ca-btn-next"), 1],
      [7200, function () { cS("sheet", "extra"); }],
      // who meets the truck: a new person, typed in, added and chosen
      [8400, tapF(".ca-row-who"), 1],
      [8700, function () { cS("pg", "who"); }],
      [9900, tapF(".ca-btn-addnew"), 1],
      [10200, function () { cS("pg", "add"); }],
      [10500, function () { cS("add", "1"); }],
      [14700, tapF(".ca-btn-addp"), 1],
      [15000, function () { cS("pg", "who"); cS("who", "1"); }],
      [16300, tapF(".ca-btn-done"), 1],
      [16600, function () { cS("pg", null); }],
      // the date: 23 April
      [17700, tapF(".ca-row-date"), 1],
      [18000, function () { cS("pg", "date"); }],
      [19200, tapF(".ca-d23"), 1],
      [19300, function () { cS("day", "1"); }],
      [20400, tapF(".ca-btn-plan"), 1],
      [20700, function () { cS("pg", null); cS("date", "1"); }],
      // «Создать заявку», the check, «Подтвердить заявку»: the order lands in the list
      [21900, tapF(".ca-btn-create"), 1],
      [22200, function () { cS("alert", "1"); }],
      [23700, tapF(".ca-btn-confirm"), 1],
      [24000, function () { cS("alert", null); cS("scr", "list"); cS("list", "card"); }],
      // 2. the order on the map, one status every 3 seconds
      [25800, tapF(".ca-card"), 1],
      [26100, function () { cS("scr", "detail"); cS("st", "planned"); cS("list", "seen"); }],
      [29100, function () { cS("st", "assigned"); }],
      [C_DRIVE_IN[0], function () { cS("st", "enroute"); }],
      [C_DRIVE_IN[1], function () { cS("st", "onsite"); }],
      [C_TURN[0], function () { cS("st", "done"); }],
      // 3. the photo report
      [40800, tapF(".ca-btn-report"), 1],
      [41100, function () { cS("rep", "order"); }],
      [43900, tapF(".ca-seg-2"), 1],
      [44050, function () { cS("rep", "photo"); }],
      [47200, tapF(".ca-seg-3"), 1],
      [47350, function () { cS("rep", "gps"); }]
    ];
    var CA_SEG = [[0, 0], [25800, 1], [40800, 2]], CA_END = 51500;
    var CA_STILL = [21000, 35800, 45000]; // reduced motion: the filled order sheet, the truck on site, the photos
    var caSegAt = function (t) { var k = 0; CA_SEG.forEach(function (s, i) { if (t >= s[0]) { k = i; } }); return k; };

    var caPlace = function (t) {
      var q;
      if (t < C_DRIVE_IN[0]) { q = caAt(C_IN, 0); }
      else if (t < C_TURN[0]) { q = caAt(C_IN, Math.min(1, (t - C_DRIVE_IN[0]) / (C_DRIVE_IN[1] - C_DRIVE_IN[0]))); }
      else if (t < C_DRIVE_OUT[0]) { // turning round in the yard: from facing east to facing west, swinging left
        q = caAt(C_IN, 1);
        var a1 = caAt(C_OUT, 0).a, k = (t - C_TURN[0]) / (C_TURN[1] - C_TURN[0]), e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
        var da = ((a1 - q.a) % 360 + 540) % 360 - 180;
        if (da > 0) { da -= 360; }
        q.a += da * e;
      } else { q = caAt(C_OUT, Math.min(1, (t - C_DRIVE_OUT[0]) / (C_DRIVE_OUT[1] - C_DRIVE_OUT[0]))); }
      cTruck.style.transform = "translate(" + (q.x - 24).toFixed(1) + "px," + (q.y - 24).toFixed(1) + "px) rotate(" + q.a.toFixed(1) + "deg)";
    };
    var caShowSeg = function (k) {
      var tab = CA_SEG[k][1];
      caTabs.forEach(function (t, n) { t.setAttribute("aria-selected", String(n === tab)); t.tabIndex = n === tab ? 0 : -1; });
      caProto.setAttribute("aria-labelledby", caTabs[tab].id);
      caProto.hidden = false; caStatic.hidden = true;
    };

    var ca = { t: 0, seg: -1, raf: 0, last: 0, visible: false, paused: false, focus: false, running: false, fresh: true, tab: 0 };
    var caBar = function (running) {
      var k = ca.seg, a = CA_SEG[k][0], b = k + 1 < CA_SEG.length ? CA_SEG[k + 1][0] : CA_END, tab = CA_SEG[k][1];
      caTabs.forEach(function (t, n) {
        t.classList.toggle("is-auto", n === tab && !ca.paused && caProto.hidden === false);
        t.classList.remove("is-running");
        if (n !== tab) { return; }
        t.style.setProperty("--auto-from", String((ca.t - a) / (b - a)));
        t.style.setProperty("--auto-left", Math.max(0, b - ca.t) + "ms");
        void t.offsetWidth;
        if (running) { t.classList.add("is-running"); }
      });
    };
    // Rebuild the picture at time t without transitions: replay every state keyframe up to t, skip the taps
    var caSeek = function (t) {
      cC("is-reset", true);
      CA_STORY.forEach(function (e) { if (e[0] <= t && !e[2]) { e[1](); } });
      cTap.classList.remove("is-pressing");
      ca.t = t; ca.seg = caSegAt(t);
      caShowSeg(ca.seg); caPlace(t);
      void caProto.offsetWidth;
      cC("is-reset", false);
    };
    var caTick = function (now) {
      var dt = Math.min(100, now - ca.last), t0 = ca.t, t1 = t0 + dt;
      ca.last = now;
      if (t1 >= CA_END) { caSeek(0); caBar(true); ca.raf = requestAnimationFrame(caTick); return; }
      CA_STORY.forEach(function (e) { if (e[0] > t0 && e[0] <= t1) { e[1](); } });
      ca.t = t1;
      var k = caSegAt(t1);
      if (k !== ca.seg) { ca.seg = k; caShowSeg(k); caBar(true); }
      if (t1 >= C_DRIVE_IN[0] - 50 && t0 <= C_DRIVE_OUT[1] + 50) { caPlace(t1); }
      ca.raf = requestAnimationFrame(caTick);
    };
    var caSync = function () {
      var go = ca.visible && !ca.paused && !ca.focus && !document.hidden;
      if (go === ca.running) { return; }
      ca.running = go;
      cC("is-held", !go);
      if (go) {
        if (ca.fresh) { ca.fresh = false; caSeek(0); }
        else if (caProto.hidden) { caShowSeg(ca.seg); }
        caBar(true);
        ca.last = performance.now();
        ca.raf = requestAnimationFrame(caTick);
      } else {
        cancelAnimationFrame(ca.raf);
        caBar(false);
      }
    };
    var caSetPaused = function (p) {
      ca.paused = p;
      caToggle.setAttribute("aria-pressed", String(p));
      caToggle.querySelector("span").textContent = p ? "Запустить анимацию" : "Остановить анимацию";
      caToggle.classList.toggle("is-paused", p);
    };
    var caMotion = !reduceMotion && "IntersectionObserver" in window;
    // The WhatsApp tab has no story yet: its placeholder takes the stage and the story holds where it was
    var caShowStatic = function () {
      caTabs.forEach(function (t, n) { t.setAttribute("aria-selected", String(n === 3)); t.tabIndex = n === 3 ? 0 : -1; });
      caProto.hidden = true; caStatic.hidden = false;
    };
    var caPick = function (tab) {
      if (tab === 3) {
        cancelAnimationFrame(ca.raf); ca.running = false;
        if (caMotion) { caSetPaused(true); }
        caShowStatic(); caBar(false);
        return;
      }
      if (!caMotion) { caSeek(CA_STILL[tab]); return; }
      cancelAnimationFrame(ca.raf);
      ca.running = false; ca.fresh = false;
      caSeek(Math.max(0, CA_SEG[tab][0] - 200));
      caSetPaused(false);
      caBar(false);
      caSync();
    };
    caTabs.forEach(function (tab, i) {
      tab.addEventListener("click", function () { caPick(i); });
      tab.addEventListener("keydown", function (e) {
        var k = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
        var n = e.key === "Home" ? 0 : e.key === "End" ? caTabs.length - 1 : k ? (i + k + caTabs.length) % caTabs.length : -1;
        if (n < 0) { return; }
        e.preventDefault();
        caPick(n);
        caTabs[n].focus();
      });
    });

    caPlace(0);
    if (caMotion) {
      caToggle.hidden = false;
      caToggle.addEventListener("click", function () {
        caSetPaused(!ca.paused);
        if (!ca.paused && caProto.hidden) { ca.focus = false; caShowSeg(ca.seg); } // play from the WhatsApp tab: back to the story
        caBar(false); caSync();
      });
      observeWhenShown(new IntersectionObserver(function (entries) {
        ca.visible = entries[0].isIntersecting;
        if (!ca.visible && !ca.paused) { ca.fresh = true; }
        caSync();
      }, { threshold: 0.35 }), caStage || caProto);
      document.addEventListener("visibilitychange", caSync);
      // Only keyboard focus in the list pauses; a resting mouse cursor must not freeze the autoplay.
      caTabList.addEventListener("focusin", function (e) { if (e.target.matches(":focus-visible")) { ca.focus = true; caSync(); } });
      caTabList.addEventListener("focusout", function (e) { if (!caTabList.contains(e.relatedTarget)) { ca.focus = false; caSync(); } });
    } else {
      caSeek(CA_STILL[0]);
    }
  }
})(window.Raccoon);
