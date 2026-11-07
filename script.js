// RaccoonAI landing page behavior.
// Everything here is an enhancement: without JavaScript the page shows the final state and the form posts normally.

(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Smooth scroll ----------
     Lenis (vendor/lenis.min.js, MIT, darkroom.engineering) eases mouse-wheel and trackpad scrolling; touch keeps the
     platform's own scrolling, and so does the page under reduced motion. Boxes that scroll by themselves (the Platform
     replica's tables and Gantt rows, sheets) keep native wheel scrolling. In-page links glide to their target at the
     page's scroll-padding; the skip link keeps its native jump so keyboard focus moves with it. */
  var lenis = null;
  if (!reduceMotion && window.Lenis) {
    var nestedScroll = function (node) {
      if (!node || node.nodeType !== 1 || node === document.body || node === document.documentElement) { return false; }
      if (node.hasAttribute("data-lenis-prevent")) { return true; }
      var oy = getComputedStyle(node).overflowY;
      return (oy === "auto" || oy === "scroll") && node.scrollHeight > node.clientHeight + 1;
    };
    lenis = new window.Lenis({ lerp: 0.085, wheelMultiplier: 1.4, prevent: nestedScroll });
    var lenisRaf = function (t) { lenis.raf(t); requestAnimationFrame(lenisRaf); };
    requestAnimationFrame(lenisRaf);
    document.addEventListener("click", function (e) {
      if (e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) { return; }
      var a = e.target.closest && e.target.closest('a[href^="#"]');
      if (!a || a.classList.contains("skip") || a.hash.length < 2) { return; }
      var el = document.getElementById(decodeURIComponent(a.hash.slice(1)));
      if (!el) { return; }
      e.preventDefault();
      var pad = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
      lenis.scrollTo(el, { offset: -pad, duration: 1.1, easing: function (x) { return 1 - Math.pow(1 - x, 4); } });
      if (history.pushState) { history.pushState(null, "", a.hash); }
    });
  }

  /* ---------- Light / dark theme ----------
     The inline head script sets html[data-theme] before paint (stored choice, else the OS preference). The dock and header
     buttons flip it and remember the pick. Every image has a "-dark" twin: photos switch through their <picture> source
     (its media query serves dark-OS visitors on first load), maps, proof photos and the truck illustration by src, including
     those script.js renders later. */
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
    Array.prototype.forEach.call(document.querySelectorAll("source[data-theme-dark]"), function (s) { s.media = dark ? "all" : "not all"; });
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

  /* ---------- Desktop dock: section scroll spy, hover follow and the wide/compact switch ----------
     The marker, the rail fill and the hover pill share one position on a critically damped spring: it retargets
     from the live value and keeps its velocity, so sweeping the pointer down the list never snaps. */
  var tree = document.querySelector("[data-tree]");
  if (tree) {
    var tLinks = Array.prototype.slice.call(tree.querySelectorAll(".tree-list a"));
    var tRows = tLinks.map(function (a) { return a.parentNode; });
    var tSections = tLinks.map(function (a) { return document.querySelector(a.hash); });
    var tPill = tree.querySelector(".tree-pill");
    var tFill = tree.querySelector(".tree-fill");
    var tMarker = tree.querySelector(".tree-marker");
    var tWideMq = window.matchMedia("(min-width: 1280px)"); // the page column always leaves room for the labels
    var tShowMq = window.matchMedia("(min-width: 1280px)");
    // Blocks wider than the page column; while one is behind the open card the dock stays a strip.
    var tAvoid = Array.prototype.slice.call(document.querySelectorAll(".pf-frame"));
    var tCenters = [], tFirst = 0, tLast = 0;
    var tActive = -1, tHover = null;
    var tPos = 0, tVel = 0, tTarget = 0, tRaf = 0, tPrev = 0;
    var OMEGA = 24; // ≈0.25 s to settle, no overshoot

    var tRender = function () {
      tPill.style.transform = "translateY(" + (tPos - 16) + "px)";
      tMarker.style.transform = "translateY(" + (tPos - 3.5) + "px) rotate(45deg)";
      var span = tLast - tFirst;
      tFill.style.transform = "scaleY(" + (span > 0 ? Math.max(0, Math.min(1, (tPos - tFirst) / span)) : 0) + ")";
      for (var i = 0; i < tRows.length; i++) { tRows[i].classList.toggle("is-past", tCenters[i] <= tPos + .5); }
    };
    var tStep = function () {
      var now = performance.now();
      var dt = Math.min(.032, (now - tPrev) / 1000); tPrev = now;
      tVel += (OMEGA * OMEGA * (tTarget - tPos) - 2 * OMEGA * tVel) * dt;
      tPos += tVel * dt;
      if (Math.abs(tTarget - tPos) < .2 && Math.abs(tVel) < 2) { tPos = tTarget; tVel = 0; tRaf = 0; tRender(); return; }
      tRender();
      tRaf = requestAnimationFrame(tStep);
    };
    var tMoveTo = function (i, immediate) {
      if (i == null || i < 0 || i >= tCenters.length) { tree.classList.remove("has-mark"); return; }
      tTarget = tCenters[i];
      // Appearing from hidden lands on the row instead of travelling from where it was parked.
      if (immediate || reduceMotion || !tree.classList.contains("has-mark")) {
        if (tRaf) { cancelAnimationFrame(tRaf); tRaf = 0; }
        tPos = tTarget; tVel = 0; tRender();
      } else if (!tRaf) { tPrev = performance.now(); tRaf = requestAnimationFrame(tStep); }
      tree.classList.add("has-mark");
    };
    var tMeasure = function () {
      tCenters = tRows.map(function (li) { return li.offsetTop + li.offsetHeight / 2; });
      tFirst = tCenters[0] || 0; tLast = tCenters[tCenters.length - 1] || 0;
      tree.style.setProperty("--rail-top", tFirst + "px");
      tree.style.setProperty("--rail-len", (tLast - tFirst) + "px");
      if (tCenters.length) { tMoveTo(tHover != null ? tHover : tActive, true); }
    };
    var tSetActive = function (i) {
      if (i === tActive) { return; }
      if (tActive >= 0) { tLinks[tActive].removeAttribute("aria-current"); }
      tActive = i;
      if (i >= 0) { tLinks[i].setAttribute("aria-current", "location"); }
      if (tHover == null) { tMoveTo(i); }
    };
    var tUpdate = function () {
      if (!tShowMq.matches) { return; }
      // Active: the last section whose top has passed 40% of the window.
      var line = window.innerHeight * .4, idx = -1;
      for (var i = 0; i < tSections.length; i++) { if (tSections[i] && tSections[i].getBoundingClientRect().top <= line) { idx = i; } }
      tSetActive(idx < 0 ? 0 : idx);
      var wide = tWideMq.matches;
      if (wide) {
        var r = tree.getBoundingClientRect();
        for (var k = 0; k < tAvoid.length; k++) {
          var a = tAvoid[k].getBoundingClientRect();
          if (a.bottom > r.top && a.top < r.bottom && a.left < r.right) { wide = false; break; }
        }
      }
      tree.classList.toggle("is-wide", wide);
    };
    var tQueued = false;
    var tSchedule = function () { if (!tQueued) { tQueued = true; requestAnimationFrame(function () { tQueued = false; tUpdate(); }); } };
    var tRowAt = function (y) {
      var best = null, bestD = Infinity;
      for (var i = 0; i < tRows.length; i++) {
        var b = tRows[i].getBoundingClientRect(), d = Math.abs(y - (b.top + b.height / 2));
        if (d < bestD) { bestD = d; best = i; }
      }
      return best;
    };

    tree.addEventListener("pointermove", function (e) {
      var i = tRowAt(e.clientY);
      if (i !== tHover) { tHover = i; tMoveTo(i); }
    });
    tree.addEventListener("pointerleave", function () { tHover = null; tMoveTo(tActive); });
    tree.addEventListener("focusin", function (e) { var i = tLinks.indexOf(e.target); if (i >= 0) { tHover = i; tMoveTo(i); } });
    tree.addEventListener("focusout", function (e) { if (!tree.contains(e.relatedTarget)) { tHover = null; tMoveTo(tActive); } });
    // A pick moves the marker at once; the smooth scroll then confirms it.
    tree.addEventListener("click", function (e) {
      var i = tLinks.indexOf(e.target.closest("a"));
      if (i >= 0) { tSetActive(i); if (e.detail) { e.target.closest("a").blur(); } }
    });

    window.addEventListener("scroll", tSchedule, { passive: true });
    window.addEventListener("resize", tSchedule);
    if ("ResizeObserver" in window) { new ResizeObserver(tMeasure).observe(tree.querySelector(".tree-list")); }
    tMeasure();
    tUpdate();
  }

  /* ---------- Signature sequence (loops, about 11 s): the truck drives to its next stop while a request lands,
     the AI checks each truck and assigns it; then the truck drives on to the new stop. ---------- */
  var stage = document.getElementById("stage");
  if (stage) { // only on the main page
    var requestStatus = document.querySelector("#card-request .status");
    var aiBadge = document.getElementById("ai-badge");
    var aiSub = document.getElementById("ai-sub");
    var cands = Array.prototype.slice.call(stage.querySelectorAll("[data-cand]"));
    var stepItems = Array.prototype.slice.call(document.querySelectorAll(".seq-steps li"));
    var truck = stage.querySelector(".truck");
    var pinNext = stage.querySelector(".pin-next");
    var pinNew = document.getElementById("pin-new");
    var legLive = stage.querySelector(".route-live");
    var legAi = document.getElementById("route-ai");

    var finalText = {
      badge: aiBadge.textContent,
      sub: aiSub.innerHTML,
      request: requestStatus.textContent
    };

    function setRequest(created) {
      requestStatus.textContent = created ? "Неназначено" : finalText.request;
      requestStatus.classList.toggle("status-created", created);
      requestStatus.classList.toggle("status-progress", !created);
    }

    // The AI's proposal draws itself along the route through a mask path.
    var aiMask = document.getElementById("ai-mask");
    var maskLen = aiMask.getTotalLength();
    function hideProposal() {
      aiMask.style.transition = "none";
      aiMask.style.strokeDasharray = maskLen;
      aiMask.style.strokeDashoffset = maskLen;
    }
    function drawProposal(ms) {
      aiMask.getBoundingClientRect(); // commit the hidden state before animating
      aiMask.style.transition = "stroke-dashoffset " + ms + "ms cubic-bezier(.45, 0, .2, 1)";
      aiMask.style.strokeDashoffset = "0";
    }

    // The truck follows a route leg: position and heading come from the path itself.
    var drive = null;
    function placeTruck(path, t) {
      var len = path.getTotalLength();
      var p = path.getPointAtLength(len * t);
      var q = path.getPointAtLength(Math.min(len, len * t + 2));
      var r = t >= 1 ? path.getPointAtLength(len - 2) : p;
      var a = Math.atan2(q.y - r.y, q.x - r.x) * 180 / Math.PI;
      truck.setAttribute("transform", "translate(" + p.x.toFixed(1) + " " + p.y.toFixed(1) + ") rotate(" + a.toFixed(1) + ")");
    }
    function driveAlong(path, ms, done) {
      var start = null;
      if (drive) { window.cancelAnimationFrame(drive); }
      function frame(now) {
        if (start === null) { start = now; }
        var k = Math.min(1, (now - start) / ms);
        var e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2; // ease in-out: pull away, then brake at the stop
        placeTruck(path, e);
        if (k < 1) { drive = window.requestAnimationFrame(frame); } else { drive = null; if (done) { done(); } }
      }
      drive = window.requestAnimationFrame(frame);
    }
    function stopDriving() {
      if (drive) { window.cancelAnimationFrame(drive); drive = null; }
    }
    // A stop the truck has reached turns into a done pin.
    function setReached(pin, on) {
      pin.classList.toggle("is-reached", on);
    }

    // Candidate rows: pending (no verdict) → checking → verdict shown.
    function setCand(i, state) {
      var row = cands[i];
      row.classList.toggle("is-pending", state === "pending" || state === "checking");
      row.classList.toggle("is-checking", state === "checking");
    }

    // Step indicator under the stage: one item active at a time, a bar fills for its duration.
    function markStep(n, ms) {
      stepItems.forEach(function (li, i) {
        var k = i + 1;
        li.classList.toggle("is-done", k < n);
        li.classList.toggle("is-active", k === n);
        if (k === n) { li.style.setProperty("--dur", ms + "ms"); }
      });
    }
    function finishSteps() {
      stepItems.forEach(function (li) { li.classList.remove("is-active"); li.classList.add("is-done"); });
    }

    var timers = [];
    function at(ms, fn) { timers.push(window.setTimeout(fn, ms)); }

    function resetToStart() {
      timers.forEach(window.clearTimeout);
      timers = [];
      stopDriving();
      stage.classList.remove("is-step-1", "is-proposing", "hide-ai", "is-done");
      stage.classList.add("is-step-0");
      stage.removeAttribute("data-focus");
      setRequest(true);
      aiBadge.textContent = "AI подбирает";
      aiBadge.classList.add("is-proposed");
      aiSub.textContent = "Ждёт решения AI";
      cands.forEach(function (row, i) { setCand(i, "pending"); });
      hideProposal();
      setReached(pinNext, false);
      setReached(pinNew, false);
      legLive.classList.remove("is-passed");
      placeTruck(legLive, 0);
      markStep(0, 0);
    }

    var LOOP = 11400;
    function playSequence() {
      resetToStart();

      // 1. A new WhatsApp request lands on the map; the truck carries on to its next stop.
      at(500, function () {
        stage.classList.remove("is-step-0");
        stage.classList.add("is-step-1", "hide-ai");
        stage.setAttribute("data-focus", "request");
        markStep(1, 1900);
        driveAlong(legLive, 4600, function () { setReached(pinNext, true); legLive.classList.add("is-passed"); });
      });

      // 2. The AI checks each truck in turn; the chosen one gets a dashed proposal to the new stop.
      at(2400, function () {
        stage.classList.remove("hide-ai");
        stage.classList.add("is-proposing");
        stage.setAttribute("data-focus", "ai");
        markStep(2, 3400);
        setCand(0, "checking");
      });
      at(3200, function () { setCand(0, "done"); setCand(1, "checking"); drawProposal(2400); });
      at(4000, function () { setCand(1, "done"); setCand(2, "checking"); });
      at(4800, function () { setCand(2, "done"); aiBadge.textContent = "AI предлагает"; });

      // 3. Assigned: the route turns solid and the truck drives on to the new stop.
      at(5800, function () {
        stage.classList.remove("is-proposing", "is-step-1");
        stage.removeAttribute("data-focus");
        aiBadge.textContent = finalText.badge;
        aiBadge.classList.remove("is-proposed");
        aiSub.innerHTML = finalText.sub;
        setRequest(false);
        markStep(3, 3400);
      });
      at(6100, function () {
        driveAlong(legAi, 3100, function () { setReached(pinNew, true); });
      });

      // Rest on the full picture, then start over.
      at(9200, function () {
        stage.classList.add("is-done");
        finishSteps();
      });
      at(LOOP, playSequence);
    }

    // The assigned end state, as in the markup: what reduced motion and the pause button show.
    function showEnd() {
      timers.forEach(window.clearTimeout);
      timers = [];
      stopDriving();
      stage.classList.remove("is-step-0", "is-step-1", "is-proposing", "hide-ai", "is-done");
      stage.removeAttribute("data-focus");
      setRequest(false);
      aiBadge.textContent = finalText.badge;
      aiBadge.classList.remove("is-proposed");
      aiSub.innerHTML = finalText.sub;
      cands.forEach(function (row, i) { setCand(i, "done"); });
      aiMask.style.transition = "none";
      aiMask.style.strokeDashoffset = "0";
      setReached(pinNext, false);
      setReached(pinNew, false);
      legLive.classList.remove("is-passed");
      placeTruck(legLive, 0);
      finishSteps();
    }

    // Loop only while the stage is on screen and not paused; the markup (and reduced motion) shows the assigned end state.
    var seqToggle = document.getElementById("seq-toggle");
    if (reduceMotion || !("IntersectionObserver" in window)) {
      finishSteps();
      if (seqToggle) { seqToggle.hidden = true; }
    } else {
      var playing = false, paused = false, stageVisible = false;
      var setToggle = function () {
        seqToggle.setAttribute("aria-pressed", String(paused));
        seqToggle.querySelector("span").textContent = paused ? "Запустить анимацию" : "Остановить анимацию";
        seqToggle.classList.toggle("is-paused", paused);
      };
      var io = new IntersectionObserver(function (entries) {
        stageVisible = entries[0].isIntersecting;
        if (stageVisible && !playing && !paused) {
          playing = true;
          playSequence();
        } else if (!stageVisible && playing) {
          playing = false;
          timers.forEach(window.clearTimeout);
          timers = [];
          stopDriving();
        }
      }, { threshold: 0.35 });
      io.observe(stage);
      if (seqToggle) {
        seqToggle.addEventListener("click", function () {
          paused = !paused;
          setToggle();
          if (paused) { playing = false; showEnd(); }
          else if (stageVisible) { playing = true; playSequence(); }
        });
      }
    }
  }


  /* ---------- AI dispatcher switches (fleet-wide and per truck) ---------- */
  var fleetSwitch = document.querySelector('[data-switch="fleet"]');
  var truckRows = Array.prototype.slice.call(document.querySelectorAll("[data-truck]"));

  function setTruck(row, on) {
    var sw = row.querySelector(".switch");
    var mode = row.querySelector(".fleet-mode");
    sw.setAttribute("aria-checked", String(on));
    mode.textContent = on ? mode.getAttribute("data-on") : mode.getAttribute("data-off");
    row.classList.toggle("is-manual", !on);
  }

  truckRows.forEach(function (row) {
    var sw = row.querySelector(".switch");
    sw.addEventListener("click", function () {
      setTruck(row, sw.getAttribute("aria-checked") !== "true");
    });
  });

  if (fleetSwitch) fleetSwitch.addEventListener("click", function () {
    var on = fleetSwitch.getAttribute("aria-checked") !== "true";
    fleetSwitch.setAttribute("aria-checked", String(on));
    truckRows.forEach(function (row) {
      var sw = row.querySelector(".switch");
      if (!on) { setTruck(row, false); }
      sw.disabled = !on;
    });
  });

  /* ---------- Route group: approve tomorrow's route sheets ---------- */
  var approveBtn = document.getElementById("rg-approve");
  if (approveBtn) {
    var sheets = Array.prototype.slice.call(document.querySelectorAll("[data-sheet]"));
    var rgFoot = document.getElementById("rg-foot");
    approveBtn.addEventListener("click", function () {
      approveBtn.disabled = true;
      approveBtn.textContent = "Утверждено";
      sheets.forEach(function (chip, i) {
        window.setTimeout(function () {
          chip.textContent = "Назначено";
          chip.classList.remove("status-wait");
          chip.classList.add("status-progress");
          if (i === sheets.length - 1) {
            rgFoot.textContent = "Отправлено в DriverApp: " + sheets.length + " экипажа получили маршрутные листы";
            rgFoot.classList.add("is-sent");
          }
        }, reduceMotion ? 0 : 160 * i);
      });
    });
  }

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
      new IntersectionObserver(function (entries) {
        drv.visible = entries[0].isIntersecting;
        if (!drv.visible && !drv.paused) { drv.fresh = true; }
        drvSync();
      }, { threshold: 0.35 }).observe(dhProto);
      document.addEventListener("visibilitychange", drvSync);
      // Only keyboard focus in the list pauses; a resting mouse cursor must not freeze the autoplay.
      drvTabList.addEventListener("focusin", function (e) { if (e.target.matches(":focus-visible")) { drv.focus = true; drvSync(); } });
      drvTabList.addEventListener("focusout", function (e) { if (!drvTabList.contains(e.relatedTarget)) { drv.focus = false; drvSync(); } });
    } else {
      seek(DRV_STILL[0]);
    }
  }

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
      new IntersectionObserver(function (entries) {
        ca.visible = entries[0].isIntersecting;
        if (!ca.visible && !ca.paused) { ca.fresh = true; }
        caSync();
      }, { threshold: 0.35 }).observe(caStage || caProto);
      document.addEventListener("visibilitychange", caSync);
      // Only keyboard focus in the list pauses; a resting mouse cursor must not freeze the autoplay.
      caTabList.addEventListener("focusin", function (e) { if (e.target.matches(":focus-visible")) { ca.focus = true; caSync(); } });
      caTabList.addEventListener("focusout", function (e) { if (!caTabList.contains(e.relatedTarget)) { ca.focus = false; caSync(); } });
    } else {
      caSeek(CA_STILL[0]);
    }
  }

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

    /* Fit: two columns share the stage (80% of the viewport tall); the phone scale and the page width come from its room.
       Phone: 412 x 947 design px + 9px bezel; the page bar is 38px over a 1361 x 1926 page. */
    var crWide = window.matchMedia("(min-width: 861px)");
    var crFit = function () {
      if (crWide.matches && crStage) {
        var cs = getComputedStyle(crStage), row = 0;
        Array.prototype.forEach.call(crStage.children, function (c) {
          if (c === crProto || c.offsetParent === null) { return; }
          var m = getComputedStyle(c);
          row = Math.max(row, c.offsetHeight + (parseFloat(m.marginTop) || 0) + (parseFloat(m.marginBottom) || 0));
        });
        // the copy's 5/7 columns: the phone fits the left one, the page the right one, both the stage height
        var h = crStage.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom) - row - 18;
        var w = crProto.clientWidth, gap = parseFloat(getComputedStyle(crProto).columnGap) || 48;
        var c1 = (w - gap) * 5 / 12, c2 = (w - gap) * 7 / 12, r = 1361 / 1926;
        var s = Math.max(.2, Math.min((h - 18) / 947, (c1 - 18) / 412, (c2 / r + 20) / 947));
        var dw = Math.max(160, (947 * s + 18 - 38) * r), pw = 412 * s + 18;
        crProto.style.setProperty("--s", s.toFixed(4));
        crProto.style.setProperty("--cr-dw", dw.toFixed(1) + "px");
        crProto.style.setProperty("--cr-shift", (w / 2 - c1 + pw / 2).toFixed(1) + "px"); // centred on the stage before the PDF
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

    var cr = { t: 0, raf: 0, last: 0, visible: false, paused: false, running: false, fresh: true };
    var crSeek = function (t) {
      crProto.classList.add("is-reset");
      CR_STORY.forEach(function (e) { if (e[0] <= t && !e[2]) { e[1](); } });
      crTap.classList.remove("is-pressing");
      cr.t = t; crCount(t);
      void crProto.offsetWidth;
      crProto.classList.remove("is-reset");
    };
    var crTick = function (now) {
      var dt = Math.min(100, now - cr.last), t0 = cr.t, t1 = t0 + dt;
      cr.last = now;
      if (t1 >= CR_END) { crSeek(0); cr.raf = requestAnimationFrame(crTick); return; }
      CR_STORY.forEach(function (e) { if (e[0] > t0 && e[0] <= t1) { e[1](); } });
      cr.t = t1;
      if (t1 >= CR_CALC[0] - 50 && t0 <= CR_CALC[1] + 50) { crCount(t1); }
      cr.raf = requestAnimationFrame(crTick);
    };
    var crSync = function () {
      var go = cr.visible && !cr.paused && !document.hidden;
      if (go === cr.running) { return; }
      cr.running = go;
      crProto.classList.toggle("is-held", !go);
      if (go) {
        if (cr.fresh) { cr.fresh = false; crSeek(0); }
        cr.last = performance.now();
        cr.raf = requestAnimationFrame(crTick);
      } else {
        cancelAnimationFrame(cr.raf);
      }
    };
    if (!reduceMotion && "IntersectionObserver" in window) {
      crToggle.hidden = false;
      crToggle.addEventListener("click", function () {
        cr.paused = !cr.paused;
        crToggle.setAttribute("aria-pressed", String(cr.paused));
        crToggle.querySelector("span").textContent = cr.paused ? "Запустить анимацию" : "Остановить анимацию";
        crToggle.classList.toggle("is-paused", cr.paused);
        crSync();
      });
      new IntersectionObserver(function (entries) {
        cr.visible = entries[0].isIntersecting;
        if (!cr.visible && !cr.paused) { cr.fresh = true; }
        crSync();
      }, { threshold: 0.35 }).observe(crStage || crProto);
      document.addEventListener("visibilitychange", crSync);
    } else {
      crSeek(CR_STILL);
    }
  }

  /* ---------- DriverApp, one stop: the steps cascade in once, then stay; only the highlight moves from step to step ---------- */
  var flow = document.getElementById("flow");
  /* Its phones are DriverApp screens (412 x 947 design px) scaled to the column */
  var fpList = Array.prototype.slice.call(document.querySelectorAll(".fphone-da"));
  if (fpList.length && "ResizeObserver" in window) {
    var fpRO = new ResizeObserver(function (es) {
      es.forEach(function (e) { var w = e.target.clientWidth; if (w) { e.target.style.setProperty("--s", ((w - 14) / 412).toFixed(4)); } });
    });
    fpList.forEach(function (ph) { fpRO.observe(ph); });
  }
  /* What the phone does when its step comes up, quicker than the animation above, which already showed it at length:
     step 1 presses 2ГИС; step 3 takes ДО and ПОСЛЕ, camera straight to the shot, and lands on the Figma frame, job done. */
  var fpAt = function (ph, ms, fn) { ph.fpT = ph.fpT || []; ph.fpT.push(window.setTimeout(fn, ms)); };
  var fpClear = function (ph) { (ph.fpT || []).forEach(window.clearTimeout); ph.fpT = []; };
  var fpSnap = function (ph, fn) { ph.classList.add("is-reset"); fn(); void ph.offsetWidth; ph.classList.remove("is-reset"); };
  var fpTap = function (ph, el) {
    var ds = ph.querySelector(".ds"), t = ph.querySelector(".hp-tap"), s = ds.getBoundingClientRect(), r = el.getBoundingClientRect(), k = s.width / ds.offsetWidth;
    t.style.setProperty("--tx", (r.left - s.left + r.width / 2) / k + "px");
    t.style.setProperty("--ty", (r.top - s.top + r.height / 2) / k + "px");
    t.classList.remove("is-pressing");
    void t.offsetWidth;
    t.classList.add("is-pressing");
  };
  var fpPress = function (ph, sel, cls) { fpTap(ph, ph.querySelector(sel)); ph.classList.add(cls); fpAt(ph, 180, function () { ph.classList.remove(cls); }); };
  var fpCam = function (ph, side) { if (side) { ph.dataset.cam = side; } else { ph.removeAttribute("data-cam"); ph.classList.remove("is-shot"); } };
  var fpShot = function (ph) { ph.classList.remove("is-shot"); void ph.offsetWidth; ph.classList.add("is-shot"); fpTap(ph, ph.querySelector(".da-shutter")); };
  var fpRest = function (ph) { fpClear(ph); fpSnap(ph, function () { fpCam(ph, null); if (ph.dataset.play === "photos") { ph.dataset.task = "done"; } }); };
  var fpPlay = function (ph) {
    fpClear(ph);
    if (ph.dataset.play === "2gis") { fpAt(ph, 700, function () { fpPress(ph, ".da-btn-2gis", "is-press-2gis"); }); return; }
    fpSnap(ph, function () { fpCam(ph, null); ph.dataset.task = "start"; });
    fpAt(ph, 400, function () { fpPress(ph, ".da-btn-before", "is-press-before"); });
    fpAt(ph, 700, function () { fpCam(ph, "b"); });
    fpAt(ph, 1150, function () { fpShot(ph); });
    fpAt(ph, 1550, function () { fpCam(ph, null); ph.dataset.task = "do"; });
    fpAt(ph, 2000, function () { fpPress(ph, ".da-btn-after", "is-press-after"); });
    fpAt(ph, 2300, function () { fpCam(ph, "a"); });
    fpAt(ph, 2750, function () { fpShot(ph); });
    fpAt(ph, 3150, function () { fpCam(ph, null); ph.dataset.task = "done"; });
  };
  if (flow && !reduceMotion && "IntersectionObserver" in window) {
    var flowSteps = Array.prototype.slice.call(flow.querySelectorAll(".flow-step"));
    var FLOW_STEP = 2200, FLOW_DWELL = 3200;
    // a step whose phone plays a longer scene holds the highlight until the scene is over
    var flowExtra = function (i) { return flowSteps[i].querySelector('.fphone-da[data-play="photos"]') ? 1600 : 0; };
    var flowTimers = [], flowPlayed = false, flowCur = 0;
    var flowAt = function (ms, fn) { flowTimers.push(window.setTimeout(fn, ms)); };
    var flowStop = function () { flowTimers.forEach(window.clearTimeout); flowTimers = []; };
    var flowShow = function (n) { flowSteps.forEach(function (li, i) { li.classList.toggle("is-shown", i < n); }); };
    var flowMark = function (c) {
      flowCur = c;
      flowSteps.forEach(function (li, i) { li.classList.toggle("is-current", i === c); });
      var ph = c >= 0 && flowSteps[c].querySelector(".fphone-da");
      if (ph) { fpPlay(ph); }
    };
    var flowLoop = function () {
      flowStop();
      flow.classList.add("is-looping");
      (function next() {
        flowAt(FLOW_DWELL + flowExtra(flowCur), function () {
          if (flowCur >= flowSteps.length - 1) { flow.classList.remove("is-looping"); flowMark(-1); return; }
          flowMark(flowCur + 1); next();
        });
      })();
    };
    var flowIntro = function () {
      flowStop();
      flowShow(0);
      flowMark(-1);
      var at = 300;
      flowSteps.forEach(function (_, i) { flowAt(at, function () { flowShow(i + 1); flowMark(i); }); if (i < flowSteps.length - 1) { at += FLOW_STEP + flowExtra(i); } });
      flowAt(at, function () { flowPlayed = true; flowMark(0); flowLoop(); });
    };
    flow.classList.add("is-anim");
    flowShow(flowSteps.length); // fully visible until it scrolls into view
    new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) { if (!flowPlayed) { flowIntro(); } }
      else { flowStop(); fpList.forEach(fpRest); flowShow(flowSteps.length); }
    }, { threshold: 0.3 }).observe(flow);
  }

  /* ---------- Customer registry: a BIN is typed, looked up, and the matching customer and contract appear ---------- */
  var reg = document.getElementById("reg");
  if (reg && !reduceMotion && "IntersectionObserver" in window) {
    var regCards = Array.prototype.slice.call(reg.querySelectorAll(".reg-card[data-bin]"));
    var regQ = reg.querySelector(".reg-q-text");
    var regField = reg.querySelector(".reg-search");
    var REG_DWELL = 4200, REG_FIRST = 1800;
    var regCur = 0, regTimers = [], regRunning = false, regInView = false;
    var regAt = function (ms, fn) { regTimers.push(window.setTimeout(fn, ms)); };
    var regShow = function (n) {
      regCur = n;
      regCards.forEach(function (c, i) {
        c.classList.toggle("is-on", i === n);
        c.classList.remove("is-stale");
        c.setAttribute("aria-hidden", String(i !== n));
      });
    };
    var regStop = function () {
      regTimers.forEach(window.clearTimeout); regTimers = []; regRunning = false;
      // Leave a coherent picture: the query and the card always match when the loop is not running.
      regField.classList.remove("is-typing", "is-searching");
      regQ.classList.remove("is-selected");
      regQ.textContent = regCards[regCur].getAttribute("data-bin");
      regShow(regCur);
    };
    var regType = function (bin, done) {
      // Digits arrive in the rhythm people read a BIN: a short beat after each group of four.
      var t = 0;
      for (var k = 1; k <= bin.length; k++) {
        t += 62 + (k > 1 && (k - 1) % 4 === 0 ? 120 : 0);
        regAt(t, (function (s) { return function () { regQ.textContent = s; }; })(bin.slice(0, k)));
      }
      regAt(t + 240, done);
    };
    var regNext = function (delay) {
      regAt(delay, function () {
        var next = (regCur + 1) % regCards.length;
        regQ.classList.add("is-selected"); // select-all before the new query replaces it
        regAt(420, function () {
          regQ.classList.remove("is-selected");
          regQ.textContent = "";
          regCards[regCur].classList.add("is-stale");
          regField.classList.add("is-typing");
          regType(regCards[next].getAttribute("data-bin"), function () {
            regField.classList.remove("is-typing");
            regField.classList.add("is-searching");
            regAt(440, function () {
              regField.classList.remove("is-searching");
              regShow(next);
              regNext(REG_DWELL);
            });
          });
        });
      });
    };
    var regStart = function (first) { if (regRunning) { return; } regRunning = true; regNext(first ? REG_FIRST : REG_DWELL); };
    var regPlayed = false;

    reg.classList.add("is-anim");
    new IntersectionObserver(function (entries) {
      regInView = entries[0].isIntersecting;
      if (regInView && !document.hidden) { regStart(!regPlayed); regPlayed = true; } else if (regRunning) { regStop(); }
    }, { threshold: 0.4 }).observe(reg);
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) { if (regRunning) { regStop(); } } else if (regInView) { regStart(false); }
    });
  }

  /* ---------- Intake: three channels feed the Platform queue ----------
     Each channel card is wired to the Platform port with a dashed line. A signal runs down one wire at a time;
     when it reaches the port, that request lands at the top of the queue and the rows below move on a status
     (Неназначено → Назначено AI → Машина в пути). Two requests per channel rotate, so the loop has no seam. */
  var intake = document.getElementById("intake-stage");
  if (intake) {
    var feeds = [].slice.call(intake.querySelectorAll(".feed"));
    var wires = intake.querySelector(".wires");
    var wBase = wires.querySelector(".wires-base");
    var wSig = wires.querySelector(".wires-sig");
    var port = intake.querySelector(".inbox-port");
    var iList = document.getElementById("inbox-list");
    var iClip = intake.querySelector(".inbox-clip");
    var iCount = document.getElementById("inbox-n");
    var iToggle = document.getElementById("intake-toggle");
    var SVGNS = "http://www.w3.org/2000/svg";
    var ROWS = 4;
    var srcIcon = feeds.map(function (f) { return f.querySelector(".src-ic").innerHTML; });
    var srcName = ["Client App", "WhatsApp", "Звонок"];
    // [feed index, client, task · address, card fields]
    var POOL = [
      [1, "ИП Сапарова А.", "Вывоз ТБО · Абая, 52", { msg: "Нужен вывоз на Абая, 52, два контейнера" }],
      [0, "ТОО «Медеу Фуд»", "Дезинфекция · Достык, 9", { task: "Дезинфекция", addr: "Достык, 9" }],
      [2, "ТОО «Алатау Сервис Групп»", "Вывоз ТБО · Самал-2, 58", { num: "+7 727 345 12 08" }],
      [1, "ТОО «Тау Маркет»", "Вывоз ТБО · Сейфуллина, 404", { msg: "Контейнер переполнен, заберите сегодня" }],
      [0, "КСК «Орбита»", "Вывоз КГМ · Орбита-3, 21", { task: "Вывоз КГМ", addr: "Орбита-3, 21" }],
      [2, "ТОО «Береке Трейд»", "Вывоз ТБО · Жибек Жолы, 115", { num: "+7 701 228 40 17" }]
    ];
    var paths = [];

    var fill = function (feed, fields) {
      Object.keys(fields).forEach(function (k) { feed.querySelector("[data-f=" + k + "]").textContent = fields[k]; });
    };

    var drawWires = function () {
      var box = wires.getBoundingClientRect();
      var pr = port.getBoundingClientRect();
      var tx = pr.left + pr.width / 2 - box.left, ty = pr.top - box.top;
      wires.setAttribute("viewBox", "0 0 " + box.width + " " + box.height);
      wBase.textContent = "";
      paths = feeds.map(function (f) {
        var r = f.getBoundingClientRect();
        var x = r.left + r.width / 2 - box.left, y = r.bottom - box.top;
        var k = (ty - y) * 0.55;
        var p = document.createElementNS(SVGNS, "path");
        p.setAttribute("d", "M" + x + " " + y + " C" + x + " " + (y + k) + " " + tx + " " + (ty - k) + " " + tx + " " + ty);
        wBase.appendChild(p);
        return p;
      });
    };

    var clipRows = function () {
      var items = iList.children, h = 0;
      for (var i = 0; i < Math.min(ROWS, items.length); i++) { h += items[i].offsetHeight; }
      iClip.style.height = (h - 1) + "px"; // the last visible row's hairline would sit on the card edge
    };
    var layout = function () { drawWires(); clipRows(); };
    layout();
    if ("ResizeObserver" in window) { new ResizeObserver(layout).observe(intake); } else { window.addEventListener("resize", layout); }

    var setStatus = function (li, cls, text) {
      var s = li.querySelector(".status");
      s.className = "status " + cls;
      s.textContent = text;
    };

    var land = function (item) {
      var rows = iList.children;
      var row = rows[0].cloneNode(true);
      row.querySelector(".src").innerHTML = srcIcon[item[0]] + srcName[item[0]];
      row.querySelector(".inbox-main b").textContent = item[1];
      row.querySelector(".inbox-main small").textContent = item[2];
      setStatus(row, "status-created", "Неназначено");
      [].forEach.call(rows, function (li) { li.classList.remove("is-new"); });
      if (rows[0]) { setStatus(rows[0], "status-ai", "Назначено AI"); }
      if (rows[1]) { setStatus(rows[1], "status-progress", "Машина в пути"); }
      row.classList.add("is-new");
      iList.insertBefore(row, rows[0]);
      // FLIP: the list starts one row higher and settles; the oldest row slides out under the clip
      iList.classList.remove("is-shifting");
      iList.style.transform = "translateY(" + -row.offsetHeight + "px)";
      void iList.offsetHeight;
      iList.classList.add("is-shifting");
      iList.style.transform = "";
      clipRows();
      while (iList.children.length > ROWS + 1) { iList.removeChild(iList.lastElementChild); }
      iCount.textContent = String(+iCount.textContent + 1);
      port.classList.remove("is-hit");
      void port.offsetWidth;
      port.classList.add("is-hit");
    };

    var step = 0, timers = [], sigAnim = null;
    var later = function (fn, ms) { timers.push(setTimeout(fn, ms)); };
    var SIG = 1100, TICK = 2800;

    var fire = function () {
      var item = POOL[step % POOL.length];
      var next = POOL[(step + 3) % POOL.length];
      var feed = feeds[item[0]], base = paths[item[0]];
      step++;
      feed.classList.add("is-sending");
      base.classList.add("is-live");
      later(function () {
        var len = base.getTotalLength(), SEG = 22;
        var sig = document.createElementNS(SVGNS, "path");
        sig.setAttribute("d", base.getAttribute("d"));
        sig.setAttribute("stroke-dasharray", SEG + " " + (len + SEG));
        wSig.appendChild(sig);
        sigAnim = sig.animate([{ strokeDashoffset: SEG }, { strokeDashoffset: -len }], { duration: SIG, easing: "cubic-bezier(.45, 0, .2, 1)", fill: "forwards" });
        sigAnim.onfinish = function () { sig.remove(); sigAnim = null; };
        later(function () {
          land(item);
          feed.classList.remove("is-sending");
          base.classList.remove("is-live");
          // The idle card takes its channel's next request
          later(function () {
            feed.classList.add("is-swapping");
            later(function () { fill(feed, next[3]); feed.classList.remove("is-swapping"); }, 320);
          }, 400);
        }, SIG * 0.94);
      }, 320);
      later(fire, TICK);
    };

    var stopLoop = function () {
      timers.forEach(clearTimeout);
      timers = [];
      if (sigAnim) { sigAnim.cancel(); sigAnim = null; }
      wSig.textContent = "";
      feeds.forEach(function (f) { f.classList.remove("is-sending", "is-swapping"); });
      paths.forEach(function (p) { p.classList.remove("is-live"); });
    };

    if (!reduceMotion && "IntersectionObserver" in window && Element.prototype.animate) {
      var iRunning = false, iPaused = false, iVisible = false;
      var sync = function () {
        var run = iVisible && !iPaused && !document.hidden;
        if (run && !iRunning) { iRunning = true; later(fire, 600); }
        else if (!run && iRunning) { iRunning = false; stopLoop(); }
      };
      iToggle.hidden = false;
      iToggle.addEventListener("click", function () {
        iPaused = !iPaused;
        iToggle.setAttribute("aria-pressed", String(iPaused));
        iToggle.querySelector("span").textContent = iPaused ? "Запустить анимацию" : "Остановить анимацию";
        iToggle.classList.toggle("is-paused", iPaused);
        sync();
      });
      new IntersectionObserver(function (entries) { iVisible = entries[0].isIntersecting; sync(); }, { threshold: 0.35 }).observe(intake);
      document.addEventListener("visibilitychange", sync);
    }
  }

  /* ---------- Weighbridge: a landfill weighing lands in its trip ----------
     The record is weighed (gross, tare, net), a signal runs down the wire to the Platform port, and the trip matched by plate
     receives the net weight and its split by site. Two records alternate; the markup is the first one, landed. */
  var wb = document.getElementById("wb-stage");
  if (wb) {
    var WB = [
      { rec: "48213", plate: "123 ABC 02", time: "11:42", gross: "18 420 кг", tare: "11 580 кг", net: "6 840 кг", trip: "2",
        crew: "Сериков Данияр · ТБО · 17 площадок", more: "и ещё 14 площадок",
        sites: [["Кабанбай батыра, 45", "ТОО «Алатау Сервис Групп»", "5", "0,72 т"], ["Жибек Жолы, 115", "ТОО «Береке Трейд»", "4", "0,58 т"],
          ["Радостовца, 34", "ИП Сапарова А.", "2", "0,29 т"]], rest: "5,25 т" },
      { rec: "48217", plate: "482 KMT 02", time: "11:58", gross: "17 960 кг", tare: "11 240 кг", net: "6 720 кг", trip: "1",
        crew: "Омаров Ерлан · ТБО · 18 площадок", more: "и ещё 15 площадок",
        sites: [["Абая, 52", "ТОО «Тау Маркет»", "4", "0,64 т"], ["Самал-2, 58", "ТОО «Алатау Сервис Групп»", "3", "0,41 т"],
          ["Сейфуллина, 404", "ТОО «Тау Маркет»", "4", "0,53 т"]], rest: "5,14 т" }
    ];
    var wf = function (k) { return wb.querySelector('[data-w="' + k + '"]'); };
    var wbUnload = wb.querySelector(".wb-unload");
    var wbPort = wb.querySelector(".wb-port");
    var wbChip = wf("chip");
    var wbToggle = document.getElementById("wb-toggle");
    var wTimers = [], wIx = 0;
    var wLater = function (fn, ms) { wTimers.push(setTimeout(fn, ms)); };
    var setTxt = function (k, v) { var el = wf(k); if (el) { el.textContent = v; } };
    var pend = function (keys, on) { keys.forEach(function (k) { wf(k).classList.toggle("is-pending", on); }); };
    var WEIGHTS = ["gross", "tare", "net", "rec"];
    var TRIPW = ["w0", "w1", "w2", "w3", "unet", "urec"];

    // Show a record before it is weighed: plate and time only, the trip still waiting for it
    var load = function (d) {
      ["rec", "plate", "time", "gross", "tare", "net", "trip", "crew", "more"].forEach(function (k) { setTxt(k, d[k]); });
      setTxt("plate2", d.plate);
      d.sites.forEach(function (s, i) { setTxt("s" + i, s[0]); setTxt("c" + i, s[1]); setTxt("k" + i, s[2]); setTxt("w" + i, s[3]); });
      setTxt("w3", d.rest);
      setTxt("unet", d.net);
      setTxt("urec", "Запись № " + d.rec + " · " + d.time);
      pend(WEIGHTS.concat(TRIPW), true);
      wbChip.className = "status status-wait";
      wbChip.textContent = "Ждём заезд на весовую";
      wbUnload.classList.remove("is-landed");
    };
    var landed = function () {
      pend(WEIGHTS.concat(TRIPW), false);
      wbChip.className = "status status-done";
      wbChip.textContent = "Вес получен";
      wbUnload.classList.remove("is-landed");
      wb.classList.remove("is-sending");
    };

    var cycle = function () {
      wIx = (wIx + 1) % WB.length;
      load(WB[wIx]);
      wLater(function () { pend(["gross"], false); }, 900);
      wLater(function () { pend(["tare"], false); }, 1700);
      wLater(function () { pend(["net", "rec"], false); }, 2400);
      wLater(function () { wb.classList.remove("is-sending"); void wb.offsetWidth; wb.classList.add("is-sending"); }, 3000);
      wLater(function () {
        wbPort.classList.remove("is-hit"); void wbPort.offsetWidth; wbPort.classList.add("is-hit");
        pend(["unet", "urec"], false);
        wbUnload.classList.add("is-landed");
        wbChip.className = "status status-done";
        wbChip.textContent = "Вес получен";
      }, 3850);
      ["w0", "w1", "w2", "w3"].forEach(function (k, i) { wLater(function () { pend([k], false); }, 4300 + i * 140); });
      wLater(function () { wbUnload.classList.remove("is-landed"); wb.classList.remove("is-sending"); }, 6200);
      wLater(cycle, 9000);
    };
    var wStop = function () { wTimers.forEach(clearTimeout); wTimers = []; landed(); };

    if (!reduceMotion && "IntersectionObserver" in window) {
      var wRunning = false, wPaused = false, wVisible = false;
      var wSync = function () {
        var run = wVisible && !wPaused && !document.hidden;
        if (run && !wRunning) { wRunning = true; wLater(cycle, 600); }
        else if (!run && wRunning) { wRunning = false; wStop(); }
      };
      wbToggle.hidden = false;
      wbToggle.addEventListener("click", function () {
        wPaused = !wPaused;
        wbToggle.setAttribute("aria-pressed", String(wPaused));
        wbToggle.querySelector("span").textContent = wPaused ? "Запустить анимацию" : "Остановить анимацию";
        wbToggle.classList.toggle("is-paused", wPaused);
        wSync();
      });
      new IntersectionObserver(function (entries) { wVisible = entries[0].isIntersecting; wSync(); }, { threshold: 0.35 }).observe(wb);
      document.addEventListener("visibilitychange", wSync);
    }
  }

  // Tonnage split: Заказчики / Площадки tabs (click, arrow keys, Home / End)
  var wbShare = document.getElementById("wb-share");
  if (wbShare) {
    var wTabs = [].slice.call(wbShare.querySelectorAll('[role="tab"]'));
    var pickTab = function (t, focus) {
      wTabs.forEach(function (o) {
        var on = o === t;
        o.setAttribute("aria-selected", String(on));
        o.tabIndex = on ? 0 : -1;
        document.getElementById(o.getAttribute("aria-controls")).hidden = !on;
      });
      if (focus) { t.focus(); }
    };
    wTabs.forEach(function (t, i) {
      t.addEventListener("click", function () { pickTab(t); });
      t.addEventListener("keydown", function (e) {
        var n = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: wTabs.length - 1 }[e.key];
        if (n === undefined) { return; }
        e.preventDefault();
        pickTab(wTabs[(n + wTabs.length) % wTabs.length], true);
      });
    });
  }

  /* ---------- Platform screen magnet ----------
     A manual scroll that comes to rest near the Platform screen glides on to the spot the «Посмотреть интерфейс» anchor lands on
     (the screen's top at the page's scroll-padding), so the whole screen is in view and its tour can start.
     One pull per approach: after a pull, or a stop inside the zone that needed none, it stays off until the screen has left the
     zone, so the reader can still nudge the page. It waits for a lifted finger, skips anchor jumps, and is off under reduced motion. */
  var magView = document.getElementById("pf-viewport");
  if (magView && !reduceMotion) {
    var magArmed = true, magSelf = false, magSkip = false, magTouch = false, magTimer = 0;
    // Lenis scrolls frame by frame, and each frame would end a native scroll: with it, settle after a quiet spell instead
    var magEnd = !lenis && "onscrollend" in window;
    var magOffset = function () { // > 0: the screen sits below its spot
      var pad = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
      return magView.getBoundingClientRect().top - pad;
    };
    var magZone = function () { return Math.min(260, window.innerHeight * 0.3); };
    var magSettle = function () {
      if (magTimer) { clearTimeout(magTimer); magTimer = 0; }
      if (magTouch) { return; }
      var d = magOffset(), inZone = Math.abs(d) <= magZone();
      if (magSelf || magSkip) { magSelf = magSkip = false; magArmed = !inZone; return; }
      if (!inZone) { magArmed = true; return; }
      if (!magArmed) { return; }
      magArmed = false;
      if (Math.abs(d) < 2) { return; }
      magSelf = true;
      if (lenis) { lenis.scrollTo(window.scrollY + d, { duration: .9, easing: function (x) { return 1 - Math.pow(1 - x, 3); } }); }
      else { window.scrollTo({ top: window.scrollY + d, behavior: "smooth" }); }
    };
    window.addEventListener("scroll", function () {
      if (!magArmed && Math.abs(magOffset()) > magZone()) { magArmed = true; }
      if (!magEnd) { // no scrollend: settle after a short quiet spell
        if (magTimer) { clearTimeout(magTimer); }
        magTimer = setTimeout(magSettle, 180);
      }
    }, { passive: true });
    if (magEnd) { window.addEventListener("scrollend", magSettle); }
    window.addEventListener("touchstart", function () { magTouch = true; }, { passive: true });
    window.addEventListener("touchend", function () { magTouch = false; if (!magEnd) { magTimer = setTimeout(magSettle, 180); } }, { passive: true });
    window.addEventListener("touchcancel", function () { magTouch = false; }, { passive: true });
    // An in-page link already lands where it means to; the scroll it starts is left alone.
    document.addEventListener("click", function (e) {
      var a = e.target.closest && e.target.closest('a[href^="#"]');
      if (a && a.hash.length > 1) { magSkip = true; }
    });
  }

  /* ---------- Demo request form ---------- */
  var form = document.getElementById("demo-form");
  if (form) {
    var submit = document.getElementById("f-submit");
    var status = document.getElementById("form-status");
    var FORM_NOT_CONNECTED = /FORM_ID$/.test(form.action);

    /* Contact details. Leave a value empty until it is real: empty values stay hidden on the page and out of messages.
       When an email is set, a request that cannot be sent is offered as a prefilled letter instead. */
    var CONTACT = { phone: "", email: "" };

    var contactList = document.querySelector(".contacts");
    if (contactList) {
      var shown = 0;
      [["phone", "tel:" + CONTACT.phone.replace(/[^\d+]/g, "")], ["email", "mailto:" + CONTACT.email]].forEach(function (c) {
        var row = contactList.querySelector('[data-contact="' + c[0] + '"]');
        if (!row || !CONTACT[c[0]]) { return; }
        var a = row.querySelector("a");
        a.href = c[1];
        a.textContent = CONTACT[c[0]];
        row.hidden = false;
        shown++;
      });
      contactList.hidden = shown === 0;
    }

    function escHtml(s) { return String(s).replace(/[&<>"]/g, function (ch) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch]; }); }

    // What the visitor can do when the request does not go through; never cites a contact that does not exist yet.
    function fallbackHtml() {
      var ways = [];
      if (CONTACT.email) {
        var f = form.elements;
        var body = ["Имя: " + f.name.value, "Компания: " + f.company.value, "Телефон: " + f.phone.value, f.email.value ? "Почта: " + f.email.value : ""].filter(Boolean).join("\n");
        ways.push('<a href="mailto:' + escHtml(CONTACT.email) + "?subject=" + encodeURIComponent("Запрос демо RaccoonAI") + "&body=" + encodeURIComponent(body) + '">отправьте заявку письмом</a>');
      }
      if (CONTACT.phone) { ways.push('позвоните: <a href="tel:' + escHtml(CONTACT.phone.replace(/[^\d+]/g, "")) + '">' + escHtml(CONTACT.phone) + "</a>"); }
      return ways.length ? " Или " + ways.join(", или ") + "." : "";
    }

    var rules = {
      name: function (v) { return v.trim().length > 0; },
      company: function (v) { return v.trim().length > 0; },
      phone: function (v) { return v.replace(/\D/g, "").length >= 10; },
      email: function (v) { return v.trim() === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()); }
    };

    function validateField(input) {
      var rule = rules[input.name];
      if (!rule) { return true; }
      var ok = rule(input.value);
      var field = input.closest(".field");
      field.classList.toggle("is-invalid", !ok);
      input.setAttribute("aria-invalid", String(!ok));
      var err = field.querySelector(".field-error");
      if (err) {
        if (ok) { input.removeAttribute("aria-describedby"); }
        else { input.setAttribute("aria-describedby", err.id); }
      }
      return ok;
    }

    Object.keys(rules).forEach(function (name) {
      var input = form.elements[name];
      input.addEventListener("blur", function () { if (input.value) { validateField(input); } });
      input.addEventListener("input", function () {
        if (input.closest(".field").classList.contains("is-invalid")) { validateField(input); }
      });
    });

    function showStatus(kind, html) {
      status.className = "form-status is-" + kind;
      status.innerHTML = html;
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var firstBad = null;
      Object.keys(rules).forEach(function (name) {
        var input = form.elements[name];
        if (!validateField(input) && !firstBad) { firstBad = input; }
      });
      if (firstBad) { firstBad.focus(); return; }

      if (FORM_NOT_CONNECTED) {
        showStatus("error", "Заявку не удалось отправить: форма ещё не подключена. Введённые данные сохранены." + fallbackHtml());
        return;
      }

      submit.disabled = true;
      submit.textContent = "Отправляем…";
      status.className = "form-status";
      status.textContent = "";

      fetch(form.action, { method: "POST", body: new FormData(form), headers: { Accept: "application/json" } })
        .then(function (res) {
          if (!res.ok) { throw new Error("HTTP " + res.status); }
          form.reset();
          showStatus("success", "<strong>Заявка отправлена.</strong> Мы свяжемся с вами, чтобы договориться о демо.");
        })
        .catch(function () {
          showStatus("error", "Не удалось отправить заявку. Проверьте подключение и попробуйте ещё раз, введённые данные сохранены." + fallbackHtml());
        })
        .then(function () {
          submit.disabled = false;
          submit.textContent = "Запросить демо";
        });
    });
  }

  /* ---------- Platform screen: scale the 1600px design to the frame; pan on narrow screens ---------- */
  var pfView = document.getElementById("pf-viewport");
  if (pfView) {
    /* The screen is always laid out at its full 1600 x 980 design size and scaled as a whole, like browser zoom, so text,
       spacing and icons shrink together. The scale fits the frame width and caps the screen at 90% of the window height
       (PF_VH; never below PF_MIN to fit the height). The frame narrows to the scaled width (--pf-fit) and stays centred. */
    var PF_W = 1600, PF_MIN = 0.5, PF_PAN = 0.72, PF_H = 980, PF_VH = 0.9, pfPanned = false;
    var pfFrame = pfView.closest(".pf-frame");
    var fitPlatform = function () {
      var w = pfFrame.clientWidth;
      if (!w) { return; }
      var sW = w / PF_W;
      var sH = Math.max(PF_MIN, window.innerHeight * PF_VH / PF_H);
      var s = Math.min(sW, sH);
      var pan = s < PF_MIN;
      if (pan) { s = PF_PAN; }
      pfView.style.setProperty("--pf-s", String(s));
      pfView.style.setProperty("--pf-h", PF_H + "px");
      pfFrame.style.setProperty("--pf-fit", pan ? "none" : Math.ceil(PF_W * s) + "px");
      pfView.classList.toggle("is-pan", pan);
      // first time it pans: start on the right, where the map meets the truck card
      if (pan && !pfPanned) { pfPanned = true; requestAnimationFrame(function () { pfView.scrollLeft = pfView.scrollWidth; }); } // next frame: the tour wrapper re-parents the viewport, which resets its scroll
      if (!pan) { pfPanned = false; }
    };
    fitPlatform();
    if ("ResizeObserver" in window) { new ResizeObserver(fitPlatform).observe(pfFrame); }
    window.addEventListener("resize", fitPlatform);

    /* Dashboard tabs: «Статус вывоза» / «Расписание маршрутов» (WAI-ARIA tabs, manual activation) */
    var pfTabs = Array.prototype.slice.call(pfView.querySelectorAll("[data-pf-tab]"));
    var selectPfTab = function (tab, focus) {
      pfTabs.forEach(function (t) {
        var on = t === tab;
        var id = t.getAttribute("data-pf-tab");
        t.classList.toggle("is-selected", on);
        t.setAttribute("aria-selected", on ? "true" : "false");
        t.tabIndex = on ? 0 : -1;
        document.getElementById("pf-panel-" + id).hidden = !on;
        var tools = pfView.querySelector('[data-pf-tools="' + id + '"]');
        if (tools) { tools.hidden = !on; }
      });
      pfView.dispatchEvent(new CustomEvent("pf:tabchange", { detail: tab.getAttribute("data-pf-tab") }));
      if (focus) { tab.focus({ preventScroll: true }); }
    };
    pfTabs.forEach(function (tab, i) {
      tab.addEventListener("click", function () { selectPfTab(tab, false); });
      tab.addEventListener("keydown", function (e) {
        var next = null;
        if (e.key === "ArrowRight") { next = pfTabs[(i + 1) % pfTabs.length]; }
        else if (e.key === "ArrowLeft") { next = pfTabs[(i - 1 + pfTabs.length) % pfTabs.length]; }
        else if (e.key === "Home") { next = pfTabs[0]; }
        else if (e.key === "End") { next = pfTabs[pfTabs.length - 1]; }
        if (next) { e.preventDefault(); selectPfTab(next, true); }
      });
    });

    /* Click-to-inspect: a map pin, the truck on the map or a Gantt trip swaps the card in the upper-right panel */
    var pfDataEl = document.getElementById("pf-data");
    var pfSide = pfView.querySelector(".pf-side");
    if (pfDataEl && pfSide) {
      var PF = JSON.parse(pfDataEl.textContent);
      var slots = {};
      var pfTop = pfSide.parentElement;
      Array.prototype.forEach.call(pfSide.querySelectorAll("[data-pf-card]"), function (el) { slots[el.getAttribute("data-pf-card")] = el; });
      var esc = function (v) { return String(v).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
      var uid = 0;
      var uniqIds = function (html) {
        var p = "u" + (++uid) + "-";
        return html.replace(/id="([^"]+)"/g, 'id="' + p + '$1"').replace(/url\(#([^)]+)\)/g, "url(#" + p + "$1)").replace(/href="#([^"]+)"/g, 'href="#' + p + '$1"');
      };
      var muteControls = function (root) {
        Array.prototype.forEach.call(root.querySelectorAll("button:not([data-pf-close]):not([data-pf-photo]):not([data-pf-rmodal])"), function (b) { b.tabIndex = -1; b.setAttribute("aria-hidden", "true"); });
      };
      var SEP = '<div role="separator" aria-orientation="horizontal" class="rc-sep rc-sep--horizontal"></div>';
      var JOB = { created: ["created", "Неназначено"], assigned: ["assigned", "Назначено"], enroute: ["in-progress", "Машина в пути"],
        on_service: ["on-service", "Исполняется"], completed: ["completed", "Выполнено"], not_completed: ["failed", "Невывоз"] };
      var badge = function (cls, label, progress) {
        return '<span class="rc-status rc-status--' + cls + '">' + label + (progress ? '<span class="rc-status__progress">' + progress + "</span>" : "") + "</span>";
      };
      var action = function (label) { return PF.ui.btn.replace("__L__", esc(label)); };
      var person = function (name, role) { return '<div class="pf-c-person"><p class="body-m-medium">' + esc(name) + '</p><p class="caption-m-regular pf-muted">' + esc(role) + "</p></div>"; };
      var plural = function (n, one, few, many) { var m10 = n % 10, m100 = n % 100; return m10 === 1 && m100 !== 11 ? one : m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14) ? few : many; };

      /* The whole depot on the map (platform-fleet.js, generated by tools/platform-block/fleet.mjs): the trucks the build left
         off, each with its route of the day, the job pins along those routes, and a truck card per truck. Pins, trucks and
         cards are cloned from the build's own markup, so they look and behave the same; this runs before anything reads
         the map (live map, search, filter, roving focus, cards). */
      /* Truck card photo per model (images/platform/trucks/photo, generated with Higgsfield GPT Image 2.5), painted in the
         colour of its type's map icon. Transparent, so one file serves both themes. */
      var TRUCK_PHOTO = {
        "Iveco EuroCargo SB-800": "iveco-eurocargo-sb-800", "КамАЗ 53605 МК-4546": "kamaz-53605-mk-4546", "МАЗ 5340 КО-427": "maz-5340-ko-427",
        "КамАЗ 43253 МКС-4505": "kamaz-43253-mks-4505", "МАЗ 5550 бункеровоз": "maz-5550-bunker",
        "КамАЗ 65115 мультилифт": "kamaz-65115-multilift", "Volvo FM мультилифт": "volvo-fm-multilift",
        "КамАЗ 6520 самосвал": "kamaz-6520-samosval", "Shacman X3000 самосвал": "shacman-x3000-samosval",
        "ГАЗон Next ассенизатор": "gazon-next-assenizator", "КамАЗ 43253 КО-505": "kamaz-43253-ko-505"
      };
      var truckPhoto = function (card, model) {
        var img = card.querySelector(".pf-truck__img"), f = TRUCK_PHOTO[model];
        if (img && f) { img.src = "images/platform/trucks/photo/" + f + ".webp"; img.width = 96; img.height = 80; }
      };
      Array.prototype.forEach.call(pfSide.querySelectorAll('[data-pf-card^="truck-"]'), function (c) {
        var m = c.querySelector(".pf-truck__model .body-m-medium");
        if (m) { truckPhoto(c, m.textContent.trim()); }
      });
      if (window.PF_FLEET) {
        (function (FL) {
          var mapEl = pfView.querySelector(".pf-map"), pinBox = mapEl && mapEl.querySelector(".pf-map__pins");
          var tTpl = mapEl && mapEl.querySelector(".pf-map__truck:not(.is-active)");
          var cardTpl = pfSide.querySelector('[data-pf-card^="truck-"]');
          if (!pinBox || !tTpl || !cardTpl) { return; }
          var WORD = { created: "неназначено", assigned: "назначено", "in-progress": "машина в пути", completed: "выполнено", failed: "невывоз" };

          /* job pins */
          var pinTpl = {};
          Array.prototype.forEach.call(pinBox.querySelectorAll("[data-pf-site]"), function (b) {
            var st = PF.sites[+b.getAttribute("data-pf-site")].pin;
            if (!pinTpl[st]) { pinTpl[st] = b; }
          });
          var base = PF.sites.length, pins = document.createDocumentFragment();
          FL.sites.forEach(function (s, i) {
            PF.sites.push(s);
            var b = pinTpl[s.pin] && pinTpl[s.pin].cloneNode(true);
            if (!b) { return; }
            b.setAttribute("data-pf-site", String(base + i));
            b.tabIndex = -1;
            b.classList.remove("is-active");
            b.removeAttribute("aria-pressed");
            b.setAttribute("aria-label", s.name + ", " + s.addr + ", " + WORD[s.pin]);
            b.style.left = (s.x - 14) + "px";
            b.style.top = (s.y - 28) + "px";
            pins.appendChild(b);
          });
          pinBox.appendChild(pins);

          /* trips and route lines */
          Object.keys(FL.routes).forEach(function (k) { PF.routes[k] = FL.routes[k]; });
          PF.trucks = PF.trucks || {};
          Object.keys(FL.lines).forEach(function (p) { PF.trucks[p] = FL.lines[p]; });

          /* trucks on the map: recoloured per vehicle type, parked ones face the depot gate */
          var trucks = mapEl.querySelectorAll(".pf-map__truck"), after = trucks[trucks.length - 1];
          var tripTpl = cardTpl.querySelector(".pf-trip");
          FL.trucks.forEach(function (t) {
            var b = tTpl.cloneNode(true);
            b.classList.add("pf-map__truck--" + t.type);
            b.classList.toggle("is-parked", !!t.depot);
            b.setAttribute("data-pf-truck", t.plate);
            b.setAttribute("data-pf-driver", t.driver);
            b.setAttribute("data-pf-vtype", t.vtype);
            b.setAttribute("aria-label", "Машина " + t.plate + ", водитель " + t.driver + ", " + t.vtype.charAt(0).toLowerCase() + t.vtype.slice(1) + ", " + (t.depot ? "в депо" : "в пути"));
            b.style.left = (t.x - 32) + "px";
            b.style.top = (t.y - 32) + "px";
            Array.prototype.forEach.call(b.querySelectorAll(".rc-truck"), function (r) {
              r.style.transform = "rotate(" + t.rot + "deg)";
              r.setAttribute("title", t.plate);
            });
            after.parentNode.insertBefore(b, after.nextSibling);
            after = b;

            /* its card, from the build's truck card */
            var slot = cardTpl.cloneNode(true);
            slot.setAttribute("data-pf-card", "truck-" + t.plate);
            slot.hidden = true;
            var card = slot.querySelector(".pf-truck");
            card.classList.add("pf-truck--" + t.type);
            var txt = function (sel, v) { var el = slot.querySelector(sel); if (el) { el.textContent = v; } };
            txt(".rc-plate", t.plate);
            txt(".pf-truck__model .body-m-medium", t.model);
            txt(".pf-truck__model .caption-m-regular", t.vtype);
            truckPhoto(slot, t.model);
            slot.querySelector(".pf-crewrow").innerHTML = t.crew.map(function (c) {
              return '<div class="pf-crew"><span class="rc-avatar rc-avatar--' + c[3] + ' rc-avatar--sm" style="width:24px;height:24px">' + esc(c[0]) + "</span>" +
                '<div class="pf-crew__who"><p class="caption-m-medium pf-ellipsis">' + esc(c[1]) + '</p><p class="caption-m-regular pf-muted">' + esc(c[2]) + "</p></div></div>";
            }).join("");
            txt('[data-pf-metric="km"] .heading-h4-semibold', t.km);
            txt('[data-pf-metric="km"] .pf-chip', t.odo);
            txt('[data-pf-metric="fuel"] .heading-h4-semibold', t.fuel);
            txt('[data-pf-metric="fuel"] .pf-chip', t.left);
            txt(".pf-shift > p", t.depot ? "Следующий рейс в " + (PF.routes[t.keys[t.keys.length - 1]].f) : "На линии с " + t.since);
            var shiftBadge = slot.querySelector(".pf-shift .rc-status");
            if (t.depot && shiftBadge) { shiftBadge.className = "rc-status rc-status--assigned"; shiftBadge.textContent = "В депо"; }
            txt(".pf-gps p", t.gps);
            var tripsBox = slot.querySelector(".pf-truck__trips");
            Array.prototype.forEach.call(tripsBox.querySelectorAll(".pf-trip"), function (x) { x.remove(); });
            t.keys.forEach(function (k) {
              var r = PF.routes[k], tb = tripTpl.cloneNode(true);
              tb.setAttribute("data-pf-rmodal", k);
              tb.setAttribute("aria-label", "Рейс " + r.trip + " " + r.id + ": открыть карточку маршрута");
              var ps = tb.querySelectorAll(".pf-trip__main p");
              if (ps[0]) { ps[0].textContent = "Рейс " + r.trip; }
              if (ps[1]) { ps[1].textContent = r.id; }
              var old = tb.children[1], tmp = document.createElement("span");
              tmp.innerHTML = r.k === "completed" ? badge("completed", "Выполнено") : r.k === "in-progress" ? badge("in-progress", "В процессе", r.done + "/" + r.total) : badge("assigned", "Назначено", String(r.total));
              if (old && !old.classList.contains("pf-trip__chev")) { tb.replaceChild(tmp.firstChild, old); }
              tripsBox.appendChild(tb);
            });
            cardTpl.parentNode.appendChild(slot);
            slots["truck-" + t.plate] = slot;
          });
        })(window.PF_FLEET);
      }

      /* Every truck on the map, the build's ТБО ones included, wears its type's 56px top-down icon, plain and selected
         (images/platform/trucks/map, made by tools/platform-block/truck-icons.mjs). The 64px box keeps its centre. */
      Array.prototype.forEach.call(pfView.querySelectorAll(".pf-map .pf-map__truck"), function (b) {
        var m = /pf-map__truck--(\w+)/.exec(b.className), type = m ? m[1] : "tbo";
        Array.prototype.forEach.call(b.querySelectorAll(".rc-truck"), function (r) {
          var on = r.parentNode.classList.contains("pf-map__truckart--on");
          r.style.width = r.style.height = "64px";
          r.innerHTML = '<img src="images/platform/trucks/map/' + type + (on ? "-on" : "") + '.png" width="56" height="56" alt="" decoding="async">';
        });
      });

      var siteCard = function (s, si) {
        var groups = s.groups.map(function (g) {
          return '<div class="pf-c-grp"><div class="pf-c-grp__cont"><p class="pf-c-strong">' + esc(g.cont) + "<span>" + g.n + "шт</span></p>" +
            '<p class="caption-m-regular pf-muted">' + (g.sched ? "Есть график" : "Нет графика") + "</p></div>" +
            '<div class="pf-c-grp__who"><p class="pf-c-strong">' + esc(g.client) + '</p><p class="caption-m-regular pf-muted">' + esc(g.role) + "</p></div></div>";
        }).join("");
        var extra = s.extra ? '<p class="pf-c-note">Ещё ' + s.extra + " " + plural(s.extra, "заказчик", "заказчика", "заказчиков") + " по норме " +
          plural(s.extra, "прикреплён", "прикреплено", "прикреплено") + " к площадке</p>" : "";
        var jobs = s.jobs.map(function (j, k) {
          var st = JOB[j.status];
          return '<div class="pf-c-job"><p class="pf-c-job__name"><span>Задание ' + (k + 1) + '</span><span class="pf-link">' + j.id + "</span></p>" +
            badge(st[0], st[1]) + (j.proof ? '<button type="button" class="pf-c-photo" data-pf-photo="' + si + ":" + k + '" aria-haspopup="dialog" aria-label="Фото-отчёт задания ' +
            j.id + '">' + PF.ui.photoOk + "</button>" : PF.ui.photoNo) + "</div>";
        }).join("");
        return '<div class="pf-truck pf-card">' +
          '<div class="pf-c-head"><div class="pf-c-title">' + PF.ui.sitePin[s.pin] + '<div class="pf-c-title__txt"><p class="pf-c-h">' + esc(s.name) + "</p>" +
          '<p class="pf-c-sub"><span>' + esc(s.kind) + "</span><span>·</span><span>" + esc(s.hours) + "</span></p></div></div>" + PF.ui.close + "</div>" + SEP +
          '<div class="pf-c-body"><div class="pf-c-label"><p class="caption-caps-bold">Контейнерные группы</p><span class="rc-counter rc-counter--default">' + s.groups.length + "</span></div>" +
          groups + extra + "</div>" + SEP + '<div class="pf-c-list">' + jobs + "</div>" + SEP +
          '<div class="pf-c-foot">' + person(s.manager, "Менеджер") + action("Карточка площадки") + "</div></div>";
      };

      var ROUTE_ST = { "in-progress": "В процессе", completed: "Выполнен", assigned: "Назначен", ai: "Предложено AI" };
      var routeCard = function (r) {
        var head = r.id ? "Рейс " + r.trip + ' <span class="pf-link">' + esc(r.id) + "</span>" : "Рейс " + r.trip + ' <span class="pf-c-st--ai">· AI-предложение</span>';
        var hm = function (v) { return v.length === 4 ? "0" + v : v; };
        var time = r.k === "in-progress" ? hm(r.f) : hm(r.f) + " – " + hm(r.t);
        var crew = r.crew.map(function (c) {
          return '<div class="pf-crew"><span class="rc-avatar rc-avatar--' + c[3] + ' rc-avatar--sm" style="width:24px;height:24px">' + esc(c[0]) + "</span>" +
            '<div class="pf-crew__who"><p class="caption-m-medium pf-ellipsis">' + esc(c[1]) + '</p><p class="caption-m-regular pf-muted">' + esc(c[2]) + "</p></div></div>";
        }).join("");
        var status = r.k === "in-progress" ? badge("in-progress", "В процессе", r.done + "/" + r.total)
          : r.k === "completed" ? badge("completed", "Выполнено") : r.k === "assigned" ? badge("assigned", "Назначено", String(r.total))
          : '<span class="pf-c-aichip">Предложено AI</span>';
        var pts = r.points.map(function (pt, k) {
          return '<div class="pf-c-pt"><span class="pf-numpin pf-numpin--' + pt.st + '">' + PF.ui.numPin[pt.st] + "<b>" + (k + 1) + "</b></span>" +
            '<div class="pf-c-pt__txt"><p class="pf-c-strong">' + esc(pt.addr) + '</p><p class="caption-m-regular pf-muted">' + esc(pt.cont) + "</p></div>" +
            (pt.st === "completed" ? PF.ui.photoOk : PF.ui.photoNo) + "</div>";
        }).join("");
        return '<div class="pf-truck pf-card">' +
          '<div class="pf-c-head"><div class="pf-c-title">' + PF.ui.journey36 + '<div class="pf-c-title__txt"><p class="pf-c-h">' + head + "</p>" +
          '<p class="pf-c-sub"><span>' + esc(r.rtype) + "</span><span>·</span><span>" + time + '</span><span class="pf-c-st--' + r.k + '">' + ROUTE_ST[r.k] + "</span></p></div></div>" +
          PF.ui.close + "</div>" + SEP +
          '<div class="pf-c-body"><div class="pf-c-veh"><span class="rc-plate rc-plate--large">' + esc(r.plate) + "</span>" +
          '<div class="pf-c-veh__model"><p class="body-m-medium">' + esc(r.model) + '</p><p class="caption-m-regular pf-muted">' + esc(r.vtype) + "</p></div>" +
          '<div class="pf-depot">' + PF.ui.garage + '<p class="caption-m-medium pf-muted">' + esc(r.depot) + "</p></div></div>" +
          '<div class="pf-crewrow">' + crew + "</div></div>" + SEP +
          '<div class="pf-c-tasks"><div class="pf-c-taskhead"><p class="caption-caps-bold">Маршрутные задания</p>' + status + "</div>" +
          '<div class="pf-c-pts">' + pts + "</div></div>" + SEP +
          '<div class="pf-c-foot">' + person(r.author[0], r.author[1]) + action("Маршрутный лист") + "</div></div>";
      };

      /* Selected truck's routes on the map: past (completed stops of the in-progress trip, solid ink) and planned
         (remaining stops, blue dashed with a white casing). The build traces each stretch along the streets of the backdrop
         (tools/platform-block/trace-routes.js) and ships simplified polylines in PF.trucks; corners are rounded here. */
      var drawRoute = function () {};
      /* backdrop px -> current map px; identity until the live map (below) takes over */
      var mapPoint = function (p) { return p; }, routeRepaint = function () {}, routeSvg = null;
      /* bring a map item into view, then call done (the live map flies there; the static backdrop has nothing to move) */
      var mapFocus = function (el, done) { done(); };
      /* a truck was picked: make sure its whole route of the day is in view (the live map flies out to it) */
      var mapFitRoute = function () {};
      /* the set of pins on the map changed (filter): regroup the clusters of the live map */
      var mapCluster = function () {};
      var routeMap = pfView.querySelector(".pf-map");
      if (routeMap && PF.trucks) {
        var NS = "http://www.w3.org/2000/svg";
        /* Polyline with each corner rounded by up to 6px (never more than half of either adjoining run) */
        var rounded = function (pts) {
          var f = function (v) { return (+v).toFixed(1); };
          var d = "M" + f(pts[0][0]) + " " + f(pts[0][1]);
          for (var i = 1; i < pts.length - 1; i++) {
            var a = pts[i - 1], b = pts[i], c = pts[i + 1];
            var l1 = Math.hypot(b[0] - a[0], b[1] - a[1]), l2 = Math.hypot(c[0] - b[0], c[1] - b[1]), r = Math.min(6, l1 / 2, l2 / 2);
            if (r < 0.5) { d += " L" + f(b[0]) + " " + f(b[1]); continue; }
            d += " L" + f(b[0] + (a[0] - b[0]) * r / l1) + " " + f(b[1] + (a[1] - b[1]) * r / l1) +
              " Q" + f(b[0]) + " " + f(b[1]) + " " + f(b[0] + (c[0] - b[0]) * r / l2) + " " + f(b[1] + (c[1] - b[1]) * r / l2);
          }
          var z = pts[pts.length - 1];
          return d + " L" + f(z[0]) + " " + f(z[1]);
        };
        /* backdrop-pixel paths, used as they are by the route modal; the live map below redraws the main map's copy in its own pixels */
        var ROUTE_PATHS = {};
        Object.keys(PF.trucks).forEach(function (plate) { var r = PF.trucks[plate]; ROUTE_PATHS[plate] = { past: rounded(r.past), plan: rounded(r.plan) }; });
        var svg = document.createElementNS(NS, "svg");
        svg.setAttribute("class", "pf-route");
        svg.setAttribute("aria-hidden", "true");
        svg.setAttribute("width", "1600");
        svg.setAttribute("height", "900");
        var mk = function (cls) { var p = document.createElementNS(NS, "path"); p.setAttribute("class", cls); svg.appendChild(p); return p; };
        var pPast = mk("pf-route__past"), pCase = mk("pf-route__case"), pPlan = mk("pf-route__plan");
        routeMap.insertBefore(svg, routeMap.querySelector(".pf-map__pins"));
        var routePlate = null;
        var paintRoute = function () {
          var r = routePlate && PF.trucks[routePlate];
          svg.classList.toggle("is-on", !!r);
          if (!r) { return; }
          var past = rounded(r.past.map(mapPoint)), plan = rounded(r.plan.map(mapPoint));
          pPast.setAttribute("d", past);
          pCase.setAttribute("d", plan);
          pPlan.setAttribute("d", plan);
        };
        drawRoute = function (el) {
          routePlate = el && el.hasAttribute("data-pf-truck") && PF.trucks[el.getAttribute("data-pf-truck")] ? el.getAttribute("data-pf-truck") : null;
          paintRoute();
          if (routePlate) { mapFitRoute(routePlate); }
        };
        routeRepaint = paintRoute;
        routeSvg = svg;
      }

      /* Live map: Leaflet with 2GIS raster tiles under the pins, trucks, depot and routes. The build placed those in pixels of the
         1600 x 900 backdrop (images/platform/map-almaty.webp); GEO ties backdrop pixels to Web Mercator (a * mercator + b, fitted
         to the 2GIS tiles), so each overlay keeps its backdrop position as home and follows the map through the CSS translate
         property. At night each tile is recoloured on a canvas with the curve of the dark backdrop. The backdrop stays as the
         placeholder until tiles arrive, and as the fallback when Leaflet or the tiles fail. */
      if (routeMap && window.L && L.GridLayer) {
        (function () {
          var GEO = { a: 3497284.9656436485, bx: -2495094.399519851, by: -1281326.2418159847 };
          var Z0 = Math.log(GEO.a / 256) / Math.LN2;
          var backdrop = routeMap.querySelector(".pf-map__bg");
          var live = document.createElement("div");
          live.className = "pf-map__live";
          live.setAttribute("aria-hidden", "true");
          routeMap.insertBefore(live, backdrop ? backdrop.nextSibling : routeMap.firstChild);

          var touchOnly = L.Browser.mobile;
          var map = L.map(live, {
            zoomSnap: 0, zoomDelta: 1, minZoom: 11, maxZoom: 18, maxBounds: [[43.05, 76.6], [43.45, 77.25]], maxBoundsViscosity: 1,
            attributionControl: false, zoomControl: false, keyboard: false, boxZoom: false, scrollWheelZoom: false,
            dragging: !touchOnly, touchZoom: !touchOnly, doubleClickZoom: true, inertia: true,
            zoomAnimation: !window.matchMedia("(prefers-reduced-motion: reduce)").matches
          });
          var geoOf = function (p) { return map.unproject(L.point(p[0] - GEO.bx, p[1] - GEO.by), Z0); };
          /* home: the backdrop's own view, its top-left corner on the map's top-left corner */
          var home = function () {
            var s = map.getSize();
            map.setView(geoOf([s.x / 2, s.y / 2]), Z0, { animate: false });
          };
          map.setView(geoOf([routeMap.clientWidth / 2, routeMap.clientHeight / 2]), Z0, { animate: false });
          var moved = false, dead = false, booted = false;
          setTimeout(function () { booted = true; }, 0);

          /* ---- tiles: 2GIS raster, always the 512px HD set drawn into 256px slots. The map sits between tile levels (fractional
             zoom, up to ~1.4x stretch) inside a screen that is itself scaled to fit the window and zoomed by the tour camera;
             the standard 256px tiles lose their small labels to that double resampling, the 2x tiles keep them crisp. ---- */
          var HD = true;
          var root = document.documentElement;
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
          var paintTile = function (cv) {
            var img = cv._src, ctx = cv.getContext("2d");
            if (!img) { return; }
            ctx.drawImage(img, 0, 0, cv.width, cv.height);
            if (!night()) { return; }
            var data;
            try { data = ctx.getImageData(0, 0, cv.width, cv.height); } catch (e) { return; }
            var d = data.data;
            for (var i = 0; i < d.length; i += 4) { var c = nightRGB(d[i], d[i + 1], d[i + 2]); d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; }
            ctx.putImageData(data, 0, 0);
          };
          var Tiles = L.GridLayer.extend({
            createTile: function (c, done) {
              var cv = document.createElement("canvas"), img = new Image();
              cv.width = cv.height = HD ? 512 : 256;
              img.crossOrigin = "anonymous";
              img.onload = function () { cv._src = img; paintTile(cv); done(null, cv); };
              img.onerror = function () { done(new Error("tile"), cv); };
              img.src = "https://tile" + ((c.x + c.y) & 3) + ".maps.2gis.com/tiles?x=" + c.x + "&y=" + c.y + "&z=" + c.z + "&v=1.1" + (HD ? "&ts=online_hd" : "");
              return cv;
            }
          });
          var tiles = new Tiles({ maxZoom: 18, keepBuffer: 2, updateWhenZooming: false }).addTo(map);
          var shown = false;
          tiles.on("tileload", function () { if (!shown) { shown = true; routeMap.classList.add("is-live"); mapCluster(); } });
          /* no tile within 12 s (offline, blocked): drop the live map and keep the backdrop */
          setTimeout(function () {
            if (shown) { return; }
            dead = true; map.off(); map.remove(); live.remove(); ctl.remove(); routeMap.removeAttribute("data-lenis-prevent");
            mapPoint = function (p) { return p; };
            items.forEach(function (it) { it.el.style.translate = ""; });
            routeRepaint();
          }, 12000);
          new MutationObserver(function () {
            Object.keys(tiles._tiles).forEach(function (k) { paintTile(tiles._tiles[k].el); });
          }).observe(root, { attributes: true, attributeFilter: ["data-theme"] });

          /* ---- overlays: pins (anchored at the tip), trucks and the depot (anchored at the centre) ---- */
          var items = Array.prototype.map.call(routeMap.querySelectorAll(".pf-mpin, .pf-map__truck, .pf-map__depot"), function (el) {
            var tip = el.classList.contains("pf-mpin");
            return { el: el, p: [el.offsetLeft + el.offsetWidth / 2, el.offsetTop + (tip ? el.offsetHeight : el.offsetHeight / 2)] };
          });
          items.forEach(function (it) { it.g = geoOf(it.p); });
          var toPx = function (g, zoom, center) {
            if (zoom === undefined) { return map.latLngToContainerPoint(g); }
            var s = map.getSize();
            return map.project(g, zoom).subtract(map.project(center, zoom)).add(s.divideBy(2));
          };
          mapPoint = function (p) { var q = map.latLngToContainerPoint(geoOf(p)); return [q.x, q.y]; };
          var place = function (zoom, center) {
            items.forEach(function (it) {
              var q = toPx(it.g, zoom, center);
              it.el.style.translate = (q.x - it.p[0]).toFixed(1) + "px " + (q.y - it.p[1]).toFixed(1) + "px";
            });
          };
          var sync = function () { place(); routeRepaint(); };
          map.on("move zoom viewreset resize", sync);
          /* zoom animation: Leaflet scales the tiles over 250 ms; overlays glide to their end positions with it, and the
             route scales as a picture (its strokes keep their width) until it is redrawn at the end */
          map.on("zoomanim", function (e) {
            routeMap.classList.add("is-zooming");
            place(e.zoom, e.center);
            if (routeSvg) {
              var k = map.getZoomScale(e.zoom), s = map.getSize();
              var o = map.project(map.getCenter(), e.zoom).subtract(map.project(e.center, e.zoom)).add(s.divideBy(2));
              var c0 = s.divideBy(2), t = o.subtract(c0.multiplyBy(k));
              routeSvg.style.transform = "translate(" + t.x.toFixed(1) + "px," + t.y.toFixed(1) + "px) scale(" + k + ")";
            }
          });
          map.on("zoomend", function () {
            routeMap.classList.remove("is-zooming");
            if (routeSvg) { routeSvg.style.transform = ""; }
            sync();
          });
          map.on("dragstart zoomstart", function () { moved = true; routeMap.classList.toggle("is-moved", true); });

          /* ---- zoom buttons ---- */
          var ctl = document.createElement("div");
          ctl.className = "pf-map__zoom";
          ctl.innerHTML = '<button type="button" class="pf-map__zbtn" data-z="in" aria-label="Приблизить карту"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 4v12M4 10h12"/></svg></button>' +
            '<button type="button" class="pf-map__zbtn" data-z="out" aria-label="Отдалить карту"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 10h12"/></svg></button>' +
            '<button type="button" class="pf-map__zbtn pf-map__zhome" data-z="home" aria-label="Вернуть исходный вид карты"><svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="5.5"/><path d="M10 1.5v3M10 15.5v3M1.5 10h3M15.5 10h3"/></svg></button>';
          routeMap.appendChild(ctl);
          ctl.addEventListener("click", function (e) {
            var b = e.target.closest("[data-z]");
            if (!b) { return; }
            var z = b.getAttribute("data-z");
            stopWheel();
            if (z === "in") { map.zoomIn(1); } else if (z === "out") { map.zoomOut(1); } else { goHome(); }
          });
          var goHome = function () { stopWheel(); moved = false; routeMap.classList.remove("is-moved"); home(); };

          /* ---- wheel / trackpad over the map (pins and trucks included) zooms around the cursor instead of scrolling the
             page; data-lenis-prevent keeps the smooth scroll from taking the event first. Each input moves a target zoom
             (a mouse notch is half a level); every frame the map eases a share of the way there, keeping the place under
             the cursor still, so notches blend into one glide like the page's own smooth scroll. Reduced motion: no easing.
             Frames go through Leaflet's own flyTo path (_moveStart / _move / _moveEnd): the tiles on screen are rescaled and
             kept, and the next tile level loads behind them. setZoomAround(..., {animate: false}) would reset the view each
             frame, which drops every tile and makes the map flash. ---- */
          routeMap.setAttribute("data-lenis-prevent", "");
          var WHEEL_EASE = 0.2;
          var wheelTarget = null, wheelAt = null, wheelRaf = 0, wheeling = false;
          var wheelEnd = function () { if (wheeling) { wheeling = false; map._moveEnd(true); } };
          var stopWheel = function () { wheelTarget = null; if (wheelRaf) { cancelAnimationFrame(wheelRaf); wheelRaf = 0; } wheelEnd(); };
          /* the centre that keeps container point p still when zooming from the current zoom to z (as setZoomAround) */
          var centerAround = function (p, z) {
            var half = map.getSize().divideBy(2), k = map.getZoomScale(z);
            return map.containerPointToLatLng(half.add(p.subtract(half).multiplyBy(1 - 1 / k)));
          };
          var wheelStep = function () {
            wheelRaf = 0;
            if (dead || wheelTarget === null) { wheelEnd(); return; }
            var z = map.getZoom(), dz = wheelTarget - z;
            var next = reduceMotion || Math.abs(dz) < 0.004 ? wheelTarget : z + dz * WHEEL_EASE;
            if (!wheeling) { wheeling = true; map.stop(); map._moveStart(true, false); }
            map._move(centerAround(wheelAt, next), next, { flyTo: true }); // flyTo flag: GridLayer keeps and rescales its tiles
            if (next === wheelTarget) { wheelTarget = null; wheelEnd(); return; }
            wheelRaf = requestAnimationFrame(wheelStep);
          };
          routeMap.addEventListener("wheel", function (e) {
            if (dead || !shown || e.target.closest(".pf-map__zoom, .pf-mf, .pf-ms")) { return; } // the filter and result lists scroll themselves
            e.preventDefault();
            if (map._animatingZoom) { return; } // a button zoom is gliding; let it land first
            var px = e.deltaMode === 1 ? 40 : e.deltaMode === 2 ? 800 : 1; // lines / pages to pixels
            var base = wheelTarget === null ? map.getZoom() : wheelTarget;
            wheelTarget = Math.max(map.getMinZoom(), Math.min(map.getMaxZoom(), base - Math.max(-1, Math.min(1, (e.deltaY * px) / 200))));
            wheelAt = map.mouseEventToContainerPoint(e);
            moved = true; routeMap.classList.add("is-moved");
            if (!wheelRaf) { wheelRaf = requestAnimationFrame(wheelStep); }
          }, { passive: false });

          /* the map keeps its home while untouched, even when its box changes size (the card column closes) */
          if ("ResizeObserver" in window) {
            new ResizeObserver(function () { if (dead) { return; } map.invalidateSize({ pan: false }); if (!moved) { home(); } sync(); }).observe(routeMap);
          }
          mapFitRoute = function (plate) {
            var r = PF.trucks && PF.trucks[plate];
            if (!r || dead || !booted) { return; } // the card chosen while the page sets up keeps the home view
            var b = L.latLngBounds(r.past.concat(r.plan).map(geoOf));
            if (map.getBounds().pad(-0.06).contains(b)) { return; }
            stopWheel();
            moved = true; routeMap.classList.add("is-moved");
            var opts = { padding: [56, 56], maxZoom: Math.max(map.getZoom(), 14) };
            if (reduceMotion) { map.fitBounds(b, opts); } else { map.flyToBounds(b, Object.assign({ duration: 0.7 }, opts)); }
          };
          /* search result picked: fly so the item sits in view at street level (zoom 15 or closer), then hand back */
          mapFocus = function (el, done) {
            var it = null;
            items.forEach(function (x) { if (x.el === el) { it = x; } });
            if (!it || dead) { done(); return; }
            stopWheel();
            moved = true; routeMap.classList.add("is-moved");
            var z = Math.max(map.getZoom(), 15);
            if (reduceMotion) { map.setView(it.g, z, { animate: false }); done(); return; }
            map.once("moveend", function () { done(); });
            map.flyTo(it.g, z, { duration: 0.7 });
          };
          /* the tour aims at pins by where they sit, so it starts from home */
          pfView.addEventListener("pf:tour", function (e) { if (e.detail && !dead) { goHome(); } });

          /* ---- pin clusters: pins closer than CL_R px on screen merge into one round marker with their count, its ring split
             by the statuses inside (as the fleet bar of «Статус вывоза»). Grouped again when a zoom lands, when the zoom has
             drifted CL_STEP levels during a wheel glide, and when the filter changes; from zoom CL_OFF up every pin stands
             alone. The selected pin never hides in a cluster; the tour turns clustering off. A click flies into the group. ---- */
          var CL_R = 16, CL_GAP = 4, CL_STEP = 0.35, CL_OFF = 16.5, CL_LIFT = 12, CL_ORDER = ["completed", "in-progress", "assigned", "created", "failed"];
          var pinItems = items.filter(function (it) { return it.el.classList.contains("pf-mpin"); });
          var pinBox = routeMap.querySelector(".pf-map__pins");
          var clBox = document.createElement("div");
          clBox.className = "pf-map__clusters";
          pinBox.parentNode.insertBefore(clBox, pinBox.nextSibling);
          /* each status's pin colour, read from the pins themselves so a cluster ring matches what it stands for */
          var CL_COLOR = {};
          pinItems.forEach(function (it) {
            var st = PF.sites[+it.el.getAttribute("data-pf-site")].pin, u = it.el.querySelector("[fill]:not([fill='none']):not([fill='white'])");
            if (!CL_COLOR[st] && u) { CL_COLOR[st] = u.getAttribute("fill"); }
          });
          var clusters = [], clZoom = null, clOn = true;
          var placeClusters = function (zoom, center) {
            clusters.forEach(function (c) {
              var q = toPx(c.g, zoom, center);
              c.el.style.translate = q.x.toFixed(1) + "px " + (q.y - CL_LIFT).toFixed(1) + "px"; // where the pin heads were, not their tips
            });
          };
          var ring = function (n) {
            var at = 0, total = 0, stops = [];
            CL_ORDER.forEach(function (st) { total += n[st] || 0; });
            CL_ORDER.forEach(function (st) {
              if (!n[st]) { return; }
              var to = at + n[st] / total * 360;
              stops.push((CL_COLOR[st] || "#98A2B3") + " " + at.toFixed(1) + "deg " + to.toFixed(1) + "deg");
              at = to;
            });
            return "conic-gradient(" + stops.join(",") + ")";
          };
          mapCluster = function () {
            if (dead || !shown) { return; }
            var z = map.getZoom();
            clZoom = z;
            var groups = [];
            if (clOn && z < CL_OFF) {
              pinItems.forEach(function (it) {
                var el = it.el;
                if (el.classList.contains("is-filtered") || el.classList.contains("is-active")) { return; }
                var q = map.project(it.g, z), best = null, bd = CL_R;
                groups.forEach(function (gr) { var d = Math.hypot(gr.x - q.x, gr.y - q.y); if (d < bd) { bd = d; best = gr; } });
                if (!best) { groups.push({ x: q.x, y: q.y, m: [it] }); return; }
                best.m.push(it);
                best.x += (q.x - best.x) / best.m.length; best.y += (q.y - best.y) / best.m.length; // the group sits at its mean
              });
              /* pins merge only when closer than CL_R, but a cluster marker is wider than that: any marker that would cover
                 another marker or a pin takes it in, so nothing on the map overlaps (CL_GAP px kept between them) */
              var size = function (k) { return k >= 20 ? 46 : k >= 8 ? 40 : k >= 2 ? 34 : 28; };
              for (var again = true; again;) {
                again = false;
                for (var i = 0; i < groups.length && !again; i++) {
                  for (var j = i + 1; j < groups.length; j++) {
                    var A = groups[i], B = groups[j], na = A.m.length, nb = B.m.length;
                    var near = na < 2 && nb < 2 ? CL_R : (size(na) + size(nb)) / 2 + CL_GAP;
                    if (Math.hypot(A.x - B.x, A.y - B.y) >= near) { continue; }
                    A.x = (A.x * na + B.x * nb) / (na + nb); A.y = (A.y * na + B.y * nb) / (na + nb);
                    A.m = A.m.concat(B.m);
                    groups.splice(j, 1);
                    again = true;
                    break;
                  }
                }
              }
            }
            pinItems.forEach(function (it) { it.el.classList.remove("is-clustered"); });
            clusters.forEach(function (c) { c.el.remove(); });
            clusters = [];
            groups.forEach(function (gr) {
              if (gr.m.length < 2) { return; }
              var n = {};
              gr.m.forEach(function (it) {
                it.el.classList.add("is-clustered");
                var st = PF.sites[+it.el.getAttribute("data-pf-site")].pin;
                n[st] = (n[st] || 0) + 1;
              });
              var b = document.createElement("button"), k = gr.m.length;
              b.type = "button";
              b.className = "pf-mcl" + (k >= 20 ? " pf-mcl--l" : k >= 8 ? " pf-mcl--m" : "");
              b.tabIndex = -1;
              b.setAttribute("aria-label", "Группа площадок, " + k + " — приблизить");
              b.style.setProperty("--ring", ring(n));
              b.innerHTML = '<span class="pf-mcl__n">' + k + "</span>";
              clBox.appendChild(b);
              clusters.push({ el: b, m: gr.m, g: map.unproject(L.point(gr.x, gr.y), z) });
            });
            placeClusters();
          };
          clBox.addEventListener("click", function (e) {
            var b = e.target.closest(".pf-mcl"), c = null;
            clusters.forEach(function (x) { if (x.el === b) { c = x; } });
            if (!c) { return; }
            e.stopPropagation();
            stopWheel();
            moved = true; routeMap.classList.add("is-moved");
            var bounds = L.latLngBounds(c.m.map(function (it) { return it.g; }));
            /* far enough in to split the group (pins at one address stop at CL_OFF, where clustering is off) */
            var opts = { padding: [64, 64], maxZoom: Math.max(Math.min(map.getBoundsZoom(bounds, false, L.point(128, 128)), CL_OFF), map.getZoom() + 1) };
            if (reduceMotion) { map.fitBounds(bounds, opts); } else { map.flyToBounds(bounds, Object.assign({ duration: 0.6 }, opts)); }
          });
          map.on("zoomanim", function (e) { placeClusters(e.zoom, e.center); });
          map.on("move zoom viewreset resize", function () {
            placeClusters();
            if (clZoom !== null && !map._animatingZoom && Math.abs(map.getZoom() - clZoom) > CL_STEP) { mapCluster(); }
          });
          map.on("zoomend viewreset", mapCluster);
          /* a pin picked on the map or from the search comes out of its cluster */
          routeMap.addEventListener("click", function (e) { if (e.target.closest(".pf-mpin, .pf-ms")) { setTimeout(mapCluster, 0); } });
          pfView.addEventListener("pf:tour", function (e) { clOn = !e.detail; mapCluster(); });
          sync();
        })();
      }

      /* Photo proof modal (Figma 19635:35376): opened from the blue photo icon of a completed job in the site card.
         Lives inside the scaled .pf-screen (a <dialog> top layer would escape the scaling), so focus is trapped by hand. */
      var openProof = function () {};
      var pfScr = pfView.querySelector(".pf-screen"), pfMainEl = pfView.querySelector(".pf-main"), pfNavEl = pfView.querySelector(".rc-sidenav");
      if (pfScr && PF.ui.proof) {
        var U = PF.ui.proof, IMG = "images/platform/proof/";
        var PROOFS = [];
        PF.sites.forEach(function (s, si) { s.jobs.forEach(function (jb, ji) { if (jb.proof) { PROOFS.push([si, ji]); } }); });
        var CHECK = { none: "Не проверено", ok: "Подтверждено", sus: "Подозрительно", bad: "Некорректно" };
        var checks = {};
        var DOT = { completed: "success", not_completed: "failed", enroute: "progress", on_service: "progress", assigned: "assigned", created: "created" };
        var VIEWS = [{ z: 1, o: "50% 50%" }, { z: 1.7, o: "22% 62%" }, { z: 1.7, o: "78% 58%" }];
        var fmt = function (v) { return String(Math.round(v * 100) / 100); };
        var fillCls = function (f) { return f === 0 ? "0" : f === 0.5 ? "50" : f === 0.75 ? "75" : f === 1.25 ? "125" : "100"; };
        var fillTxt = function (f) { return f === 0 ? "0" : f === 1 ? "1.0" : String(f); };
        var row = function (k, v) { return '<div class="pf-pm__row"><span class="pf-muted">' + k + "</span><span>" + v + "</span></div>"; };
        var photoCol = function (side, label, file, time, id) {
          var thumbs = VIEWS.map(function (v, n) {
            return '<button type="button" class="pf-ph__thumb' + (n ? "" : " is-on") + '" data-pf-view="' + n + '" aria-label="' + label + ", снимок " + (n + 1) +
              '" aria-pressed="' + (n ? "false" : "true") + '"><img src="' + file + '" alt="" style="transform:scale(' + v.z + ");transform-origin:" + v.o + '"></button>';
          }).join("");
          return '<div class="pf-ph" data-pf-side="' + side + '"><div class="pf-ph__main">' +
            '<img class="pf-ph__img" src="' + file + '" alt="' + label + " вывоза, " + time + '">' +
            '<div class="pf-ph__tag"><span class="caption-caps-bold">' + label + '</span><span class="pf-ph__tagsep"></span><span class="caption-m-medium">' + time +
            '</span><span class="caption-m-medium">6 Янв 2026</span></div>' +
            '<div class="pf-ph__bar"><button type="button" class="rc-ibtn pf-ph__btn" data-pf-rotate aria-label="Повернуть фото">' + U.rotate + "</button>" +
            '<span class="pf-ph__dots" aria-hidden="true"><i class="is-on"></i><i></i><i></i></span>' +
            '<a class="rc-ibtn pf-ph__btn" href="' + file + '" download="' + id + "-" + side + '.webp" aria-label="Скачать фото">' + U.download + "</a></div></div>" +
            '<div class="pf-ph__thumbs">' + thumbs + "</div></div>";
        };
        var proofHtml = function (si, ji) {
          var s = PF.sites[si], jb = s.jobs[ji], p = jb.proof, ck = checks[jb.id] || p.check;
          var jobs = s.jobs.map(function (x, k) {
            var on = k === ji;
            return '<button type="button" role="tab" class="rc-seg__item' + (on ? " is-selected" : "") + '" aria-selected="' + on + '"' +
              (x.proof ? ' data-pf-pjob="' + k + '"' : ' disabled title="Фото-отчёта ещё нет"') + '><span class="pf-pm__dot pf-pm__dot--' + DOT[x.status] + '"></span>' + x.id + "</button>";
          }).join("");
          var conts = p.fills.map(function (f) { return '<span class="pf-pm__cont pf-pm__cont--' + fillCls(f) + '">' + U.cont + "<b>" + fillTxt(f) + "</b></span>"; }).join("");
          var crew = p.crew.map(function (c, k) { return '<p class="body-m-' + (k ? "regular" : "medium") + '">' + esc(c) + "</p>"; }).join("");
          return '<div class="pf-pm__head">' +
            '<div class="pf-pm__nav">' + U.prev + U.next + "</div>" +
            '<div class="pf-pm__title"><p class="pf-pm__h" id="pf-pm-title">' + esc(s.name) + '</p><p class="caption-caps-bold pf-muted">Отчёт о выполнении задания</p></div>' +
            '<span class="pf-pm__check pf-pm__check--' + ck + ' caption-m-medium" role="status">' + CHECK[ck] + "</span>" +
            '<div class="pf-pm__meta"><span class="body-m-medium">' + esc(s.addr) + '</span><span class="body-m-medium pf-ellipsis">' + esc(p.client) + '</span><span class="body-m-medium">' + p.order +
            '</span><span class="body-m-regular">' + p.type + '</span><span class="body-m-regular">' + esc(p.cont) + " (" + p.n + ")</span></div>" +
            '<img class="pf-pm__msg" src="' + IMG + 'message-state.svg" width="24" height="24" alt="Есть сообщение от водителя">' + U.close + "</div>" + SEP +
            '<div class="pf-pm__jobs"><div class="rc-seg" role="tablist" aria-label="Задания площадки">' + jobs + "</div></div>" +
            '<div class="pf-pm__main"><div class="pf-pm__info">' +
            '<div class="pf-pm__sec"><p class="caption-caps-bold">Экипаж</p><div class="pf-pm__crew">' + crew + "</div>" +
            '<span class="rc-plate rc-plate--large">' + esc(p.plate) + '</span><div class="pf-pm__veh body-m-regular pf-muted"><p>' + esc(p.model) + "</p><p>" + esc(p.vtype) + "</p><p>" + esc(p.depot) + "</p></div></div>" +
            '<div class="pf-pm__sec"><p class="caption-caps-bold">Детали задания</p>' + badge("completed", "Выполнено") +
            '<div class="pf-pm__rows caption-m-medium">' + row("ID маршрута:", '<span class="pf-link">' + p.route + "</span>") + row("ID задания:", '<span class="pf-link">' + jb.id + "</span>") +
            row("Выполнено:", "6 Янв 2026&nbsp;&nbsp;" + p.at) + row("Тип задания:", p.type) + row("Конт. группа:", esc(p.cont) + " (" + p.n + ")") + row("Ном. объем:", fmt(p.nominal) + " м³") + "</div></div></div>" +
            '<div class="pf-pm__body"><div class="pf-pm__bar"><div class="rc-seg" role="tablist" aria-label="Вид отчёта">' +
            '<button type="button" role="tab" class="rc-seg__item is-selected" aria-selected="true" data-pf-pane="photo">Фото-отчёт</button>' +
            '<button type="button" role="tab" class="rc-seg__item" aria-selected="false" data-pf-pane="gps">GPS</button></div>' +
            (p.repeat ? '<span class="pf-pm__issue body-m-medium">Повторный вывоз</span>' : "") + "</div>" +
            '<div class="pf-pm__pane" data-pf-panel="photo"><div class="pf-pm__fill">' +
            '<div class="pf-pm__fl"><span class="pf-pm__sel body-m-regular">' + esc(p.cont) + U.chev16 + "</span>" +
            '<span class="pf-pm__qty" aria-label="Контейнеров: ' + p.n + '">' + U.minus + '<span class="body-m-regular">' + p.n + "</span>" + U.plus + "</span>" +
            '<span class="pf-pm__conts" aria-label="Заполненность контейнеров: ' + p.fills.map(fillTxt).join(", ") + '">' + conts + "</span></div>" +
            '<span class="pf-pm__vol body-m-regular"><b class="body-m-medium">' + fmt(p.vol) + "</b> из " + fmt(p.nominal) + ' <span class="pf-muted">м³</span></span></div>' +
            '<div class="pf-pm__photos">' + photoCol("before", "До", IMG + "b" + p.scene + ".webp", p.before, jb.id) + photoCol("after", "После", IMG + "a" + p.scene + ".webp", p.at, jb.id) + "</div></div>" +
            '<div class="pf-pm__pane" data-pf-panel="gps" hidden><div class="pf-pm__gps"><div class="pf-pm__map"></div><span class="pf-pm__gpin">' + PF.ui.sitePin.completed + "</span>" +
            '<div class="pf-pm__gcard"><p class="body-m-semibold">' + esc(p.plate) + ' у площадки</p><p class="body-m-regular">' + p.before + " – " + p.at + " · " + p.stay + " мин</p>" +
            '<p class="caption-m-medium pf-muted">GPS-трекер · ' + esc(s.addr) + "</p></div></div></div></div></div>" + SEP +
            '<div class="pf-pm__foot">' + U.share + '<div class="pf-pm__acts">' + U.ok + U.sus + U.bad + "</div></div>";
        };
        var pm = document.createElement("div");
        pm.className = "pf-pm";
        pm.hidden = true;
        pm.innerHTML = '<div class="pf-pm__scrim"></div><div class="pf-pm__card" role="dialog" aria-modal="true" aria-labelledby="pf-pm-title"></div>';
        pfScr.appendChild(pm);
        var pmCard = pm.querySelector(".pf-pm__card"), cur = null, opener = null;
        var stepIndex = function () { return PROOFS.findIndex(function (x) { return x[0] === cur[0] && x[1] === cur[1]; }); };
        var render = function (si, ji, focusSel) {
          cur = [si, ji];
          pmCard.innerHTML = uniqIds(proofHtml(si, ji)).replace(/id="u\d+-pf-pm-title"/, 'id="pf-pm-title"');
          var k = stepIndex();
          pmCard.querySelector('[data-pf-pstep="-1"]').disabled = k <= 0;
          pmCard.querySelector('[data-pf-pstep="1"]').disabled = k >= PROOFS.length - 1;
          var f = focusSel && pmCard.querySelector(focusSel);
          (f && !f.disabled ? f : pmCard.querySelector("[data-pf-pclose]")).focus({ preventScroll: true });
        };
        var closeProof = function () {
          pm.hidden = true; pfMainEl.inert = false; if (pfNavEl) { pfNavEl.inert = false; } cur = null;
          if (opener && document.contains(opener)) { opener.focus({ preventScroll: true }); }
        };
        openProof = function (si, ji, from) {
          opener = from; pm.hidden = false; pfMainEl.inert = true; if (pfNavEl) { pfNavEl.inert = true; } render(si, ji);
        };
        var placeGps = function () {
          var s = PF.sites[cur[0]], box = pmCard.querySelector(".pf-pm__gps");
          var W = box.offsetWidth, H = box.offsetHeight;
          var bx = Math.round(Math.max(Math.min(W / 2 - s.x, 0), W - 1600)), by = Math.round(Math.max(Math.min(H / 2 - s.y, 0), H - 900));
          box.querySelector(".pf-pm__map").style.backgroundPosition = bx + "px " + by + "px";
          var pin = box.querySelector(".pf-pm__gpin");
          pin.style.left = (s.x + bx) + "px"; pin.style.top = (s.y + by) + "px";
        };
        var each = function (root, sel, fn) { Array.prototype.forEach.call(root.querySelectorAll(sel), fn); };
        pmCard.addEventListener("click", function (e) {
          var b = e.target.closest("button, a");
          if (!b || b.disabled) { return; }
          if (b.hasAttribute("data-pf-pclose")) { closeProof(); return; }
          if (b.hasAttribute("data-pf-pstep")) {
            var nx = PROOFS[stepIndex() + (+b.getAttribute("data-pf-pstep"))];
            if (nx) { render(nx[0], nx[1], '[data-pf-pstep="' + b.getAttribute("data-pf-pstep") + '"]'); }
            return;
          }
          if (b.hasAttribute("data-pf-pjob")) { render(cur[0], +b.getAttribute("data-pf-pjob"), '[data-pf-pjob="' + b.getAttribute("data-pf-pjob") + '"]'); return; }
          if (b.hasAttribute("data-pf-pane")) {
            var pane = b.getAttribute("data-pf-pane");
            each(pmCard, "[data-pf-pane]", function (x) { var on = x === b; x.classList.toggle("is-selected", on); x.setAttribute("aria-selected", String(on)); });
            each(pmCard, "[data-pf-panel]", function (x) { x.hidden = x.getAttribute("data-pf-panel") !== pane; });
            if (pane === "gps") { placeGps(); }
            return;
          }
          var ph = b.closest(".pf-ph");
          if (ph && b.hasAttribute("data-pf-view")) {
            var n = +b.getAttribute("data-pf-view"), v = VIEWS[n], img = ph.querySelector(".pf-ph__img");
            img.style.setProperty("--z", v.z); img.style.transformOrigin = v.o;
            each(ph, "[data-pf-view]", function (x, i) { x.classList.toggle("is-on", i === n); x.setAttribute("aria-pressed", String(i === n)); });
            each(ph, ".pf-ph__dots i", function (x, i) { x.classList.toggle("is-on", i === n); });
            return;
          }
          if (ph && b.hasAttribute("data-pf-rotate")) {
            var im = ph.querySelector(".pf-ph__img"), r = ((+im.getAttribute("data-rot") || 0) + 90) % 360;
            im.setAttribute("data-rot", r); im.style.setProperty("--rot", r + "deg");
            return;
          }
          if (b.hasAttribute("data-pf-pcheck")) {
            var c = b.getAttribute("data-pf-pcheck"), chip = pmCard.querySelector(".pf-pm__check");
            checks[PF.sites[cur[0]].jobs[cur[1]].id] = c;
            chip.className = "pf-pm__check pf-pm__check--" + c + " caption-m-medium"; chip.textContent = CHECK[c];
            return;
          }
          if (b.hasAttribute("data-pf-pshare")) {
            var s = PF.sites[cur[0]], j2 = s.jobs[cur[1]], lab = b.querySelector("span") || b;
            var txt = "Отчёт о выполнении задания " + j2.id + ": " + s.name + ", " + s.addr + ", 6 Янв 2026 " + j2.proof.at + ", " + j2.proof.plate;
            var done = function () { lab.textContent = "Скопировано"; setTimeout(function () { lab.textContent = "Поделиться"; }, 1600); };
            if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(txt).then(done, function () {}); }
          }
        });
        pm.addEventListener("click", function (e) { if (e.target.classList.contains("pf-pm__scrim")) { closeProof(); } });
        pm.addEventListener("keydown", function (e) {
          if (e.key === "Escape") { e.stopPropagation(); closeProof(); return; }
          if (e.key !== "Tab") { return; }
          var f = Array.prototype.filter.call(pmCard.querySelectorAll("button, a[href]"), function (x) { return !x.disabled && x.offsetParent !== null; });
          if (!f.length) { return; }
          if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
          else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
        });
      }

      /* Route card modal (Figma 19601:36533): opened from a trip row in the truck card. Same scaled-screen dialog pattern as the photo proof.
         Live: close, step between the truck's trips, job checkboxes (enable «Перенести выбранные задания»), «Сохранить» closes.
         The rest mirrors the platform UI and is decorative here. */
      var openRoute = function () {};
      if (pfScr && PF.ui.route) {
        var RU = PF.ui.route;
        var RST = { completed: ["completed", "Выполнено"], enroute: ["in-progress", "Машина в пути"], assigned: ["assigned", "Назначено"] };
        var SHIFT_ST = { active: ["completed", "Смена активна"], done: ["created", "Смена завершена"], plan: ["assigned", "Смена запланирована"] };
        var rm = document.createElement("div");
        rm.className = "pf-pm pf-rm";
        rm.hidden = true;
        rm.innerHTML = '<div class="pf-pm__scrim"></div><div class="pf-pm__card pf-rm__card" role="dialog" aria-modal="true" aria-labelledby="pf-rm-title"></div>';
        pfScr.appendChild(rm);
        var rmCard = rm.querySelector(".pf-rm__card"), rKey = null, rOpener = null, rKeys = [];
        var hm2 = function (v) { return v.length === 4 ? "0" + v : v; };
        var mins = function (v) { var a = v.split(":"); return +a[0] * 60 + +a[1]; };
        var dur = function (a, b) { var d = mins(b) - mins(a); return Math.floor(d / 60) + "ч " + (d % 60) + "м"; };
        var r1 = function (v) { return String(Math.round(v * 10) / 10); };
        var sel = function (v, w) { return RU.select.replace("__V__", esc(v)).replace(/width:__W__(px)?/, "width:" + w + "px"); };
        var deco = function (html) { return html.replace(/<button type="button"/g, '<button type="button" tabindex="-1" aria-hidden="true"'); };
        var truckBtn = function (plate) { return pfView.querySelector('.pf-map__truck[data-pf-truck="' + plate + '"]'); };
        var routeMapHtml = function (r) {
          var live = r.k === "in-progress" && typeof ROUTE_PATHS !== "undefined" && ROUTE_PATHS[r.plate];
          var pinsHtml = live ? r.points.map(function (pt, k) {
            return pt.pin ? '<span class="pf-numpin pf-numpin--' + pt.st + ' pf-rm__pin" style="left:' + pt.pin[0] + "px;top:" + pt.pin[1] + 'px">' + PF.ui.numPin[pt.st] + "<b>" + (k + 1) + "</b></span>" : "";
          }).join("") : "";
          var tb = truckBtn(r.plate), art = tb && tb.querySelector(".pf-map__truckart--off");
          var tHtml = art ? '<span class="pf-rm__truck" style="left:' + tb.style.left + ";top:" + tb.style.top + '">' + art.innerHTML + "</span>" : "";
          var paths = live ? '<svg class="pf-route is-on" width="1600" height="900" aria-hidden="true"><path class="pf-route__past" d="' + live.past + '"/>' +
            '<path class="pf-route__case" d="' + live.plan + '"/><path class="pf-route__plan" d="' + live.plan + '"/></svg>' : "";
          var pos = r.k === "completed" ? 100 : r.k === "assigned" ? 0 : 58;
          return '<div class="pf-rm__map" role="img" aria-label="Карта рейса ' + esc(r.id) + '"><div class="pf-rm__world"><img src="images/platform/map-almaty.webp" width="1600" height="900" alt="">' + paths + pinsHtml + tHtml + "</div>" +
            '<div class="pf-rm__mtools" aria-hidden="true"><span>' + RU.expand + "</span><span>" + RU.eye + "</span><span>" + RU.filter + "</span></div>" +
            (live ? "" : '<p class="pf-rm__mnote caption-m-medium">GPS-трек показан для текущего рейса</p>') +
            '<div class="pf-rm__player" aria-hidden="true"><div class="pf-rm__ptimes"><span class="caption-m-medium">00:00</span><span class="caption-m-medium">Поездка ' + esc(r.id) + '</span><span class="caption-m-medium">23:59:59</span></div>' +
            '<div class="pf-rm__pbar"><span class="pf-rm__play"></span><span class="caption-m-medium">' + hm2(r.k === "completed" ? r.t : r.k === "assigned" ? r.f : "13:32") +
            '</span><span class="pf-rm__track"><i style="width:' + pos + '%"></i></span><b class="caption-m-medium">2X</b></div></div></div>';
        };
        var routeHtml = function (r) {
          var head = r.k === "in-progress" ? badge("in-progress", "В процессе", r.done + "/" + r.total) : r.k === "completed" ? badge("completed", "Выполнен") : badge("assigned", "Назначен", String(r.total));
          var sh = SHIFT_ST[r.shift] || SHIFT_ST.active;
          var vol = r.points.reduce(function (a, pt) { return a + pt.vol; }, 0);
          var jobs = r.points.map(function (pt, k) {
            var st = RST[pt.st], ph = pt.st === "completed";
            return '<div class="pf-rm__job"><span class="pf-rm__idx"><span class="pf-numpin pf-numpin--' + pt.st + '">' + PF.ui.numPin[pt.st] + "<b>" + (k + 1) + "</b></span></span>" +
              RU.check.replace("<input ", '<input data-pf-rcheck aria-label="Выбрать задание ' + pt.id + ", " + esc(pt.addr) + '" ') +
              '<div class="pf-rm__jaddr"><p class="body-m-medium pf-ellipsis">' + esc(pt.addr) + '</p><p class="caption-m-regular pf-muted">' + pt.id + "</p></div>" +
              '<div class="pf-rm__jinfo caption-m-regular pf-muted"><p><span>' + esc(pt.cont.replace(/ · .*/, "")) + "</span><span>" + r1(pt.vol) + " м³</span><span>" + pt.type + '</span></p><p class="pf-ellipsis">' + esc(pt.client) + "</p></div>" +
              '<span class="pf-rm__jst">' + badge(st[0], st[1]) + "</span>" +
              '<span class="pf-rm__jph" role="img" aria-label="' + (ph ? "Фото-отчёт загружен" : "Фото-отчёта ещё нет") + '">' + (ph ? PF.ui.photoOk : PF.ui.photoNo) + "</span>" +
              '<span class="pf-rm__jact" aria-hidden="true">' + RU.del + RU.drag + RU.more + "</span></div>";
          }).join("");
          var done = r.k === "completed";
          var rec = "0232" + String(100 + (mins(r.f) * 7 + r.trip * 131) % 900);
          var val = function (k, v) { return '<span class="pf-rm__wbi"><b class="body-m-medium">' + k + "</b>" + v + "</span>"; };
          var wb = '<div class="pf-rm__wb body-m-regular">' + deco(sel("МСК", 88)) +
            val("Запись №", done ? rec : "—") + (done ? '<span class="pf-rm__wbph" role="img" aria-label="Фото с весовой">' + RU.picture + "</span>" : "") +
            val("Дата и время", done ? "6 Янв 2026 " + hm2(r.t) : "—") + val("Вес нетто", done ? Math.round(vol * 118) + " кг" : "—") +
            val("Объем", done ? r1(vol) + " м³" : "—") + val("Тип отходов", r.vtype === "Мусоровоз ТБО" ? "ТБО" : r.vtype === "Бункеровоз" ? "КГО" : "СО") +
            (done ? "" : '<span class="pf-rm__wbnote pf-muted">Заезд на весовую появится после разгрузки</span>') + "</div>";
          return '<div class="pf-rm__head"><div class="pf-rm__nav">' + RU.prev + RU.next + "</div>" +
            '<div class="pf-rm__title"><p class="pf-pm__h" id="pf-rm-title">' + esc(r.id) + ' <span class="pf-muted">Рейс ' + r.trip + '</span></p><p class="caption-caps-bold pf-muted">Карточка маршрута</p></div>' + head +
            '<div class="pf-rm__times body-m-regular"><span><b class="body-m-medium">Начато</b><i>' + hm2(r.f) + "</i><i>6 Янв 2026</i></span>" +
            '<span><b class="body-m-medium">Закончено</b>' + (done ? "<i>" + hm2(r.t) + "</i><i>6 Янв 2026</i>" : '<i class="pf-muted">--:--</i><i class="pf-muted">--.--.----</i>') + "</span></div>" + RU.close + "</div>" + SEP +
            '<div class="pf-rm__main"><div class="pf-rm__left">' +
            '<div class="pf-rm__veh"><span class="rc-plate rc-plate--large">' + esc(r.plate) + '</span><p class="pf-rm__crew body-m-regular">' +
            r.crew.map(function (c) { return "<span>" + esc(c[1]) + "</span>"; }).join("") + "</p>" + badge(sh[0], sh[1]) + "</div>" +
            '<p class="pf-rm__vsub body-m-regular pf-muted"><span>' + esc(r.model) + "</span><span>" + esc(r.vtype) + "</span><span>" + esc(r.depot) + "</span></p>" +
            '<div class="pf-rm__list"><div class="pf-rm__jobs">' + jobs + '<div class="pf-rm__add">' + deco(RU.add) + "</div></div>" +
            '<div class="pf-rm__unload"><span class="pf-rm__ulabel body-m-medium">Разгрузка</span>' + deco(sel("Полигон Айтей", 260)) +
            '<p class="pf-rm__sum body-m-medium"><span>' + r.total + " " + plural(r.total, "задание", "задания", "заданий") + "</span><span>" + r1(vol) + " м³</span><span>" + dur(r.f, r.t) + " (" + hm2(r.t) + ")</span></p></div></div></div>" +
            routeMapHtml(r) + "</div>" + '<div class="pf-rm__wbwrap">' + wb + "</div>" + SEP +
            '<div class="pf-rm__foot">' + RU.moveBtn + '<div class="pf-rm__acts">' + deco(RU.cancelBtn) + deco(RU.finishBtn) + RU.saveBtn + "</div></div>";
        };
        var placeWorld = function (r) {
          var box = rmCard.querySelector(".pf-rm__map"), world = box.querySelector(".pf-rm__world");
          var W = box.offsetWidth, H = box.offsetHeight, pts = [];
          if (r.k === "in-progress") { r.points.forEach(function (p) { if (p.pin) { pts.push(p.pin); } }); }
          var tb = truckBtn(r.plate);
          if (tb) { pts.push([parseFloat(tb.style.left) + 32, parseFloat(tb.style.top) + 32]); }
          var xs = pts.map(function (p) { return p[0]; }), ys = pts.map(function (p) { return p[1]; });
          var cx = pts.length ? (Math.min.apply(0, xs) + Math.max.apply(0, xs)) / 2 : 800, cy = pts.length ? (Math.min.apply(0, ys) + Math.max.apply(0, ys)) / 2 : 450;
          /* a route wider than the window: keep the truck inside it */
          if (tb) {
            var tx = parseFloat(tb.style.left) + 32, ty = parseFloat(tb.style.top) + 32;
            cx = Math.max(tx - W / 2 + 72, Math.min(tx + W / 2 - 72, cx)); cy = Math.max(ty - H / 2 + 96, Math.min(ty + H / 2 - 96, cy));
          }
          var bx = Math.round(Math.max(Math.min(W / 2 - cx, 0), W - 1600)), by = Math.round(Math.max(Math.min(H / 2 - cy, 0), H - 900));
          world.style.transform = "translate(" + bx + "px," + by + "px)";
        };
        var syncMove = function () {
          var n = rmCard.querySelectorAll("[data-pf-rcheck]:checked").length, b = rmCard.querySelector("[data-pf-rmove]");
          b.disabled = !n;
          var l = b.querySelector("span:not(.rc-icon)") || b;
          l.textContent = "Перенести выбранные задания" + (n ? " (" + n + ")" : "");
        };
        var renderRoute = function (key, focusSel) {
          rKey = key;
          var r = PF.routes[key];
          rmCard.innerHTML = uniqIds(routeHtml(r)).replace(/id="u\d+-pf-rm-title"/, 'id="pf-rm-title"');
          var k = rKeys.indexOf(key);
          rmCard.querySelector('[data-pf-rstep="-1"]').disabled = k <= 0;
          rmCard.querySelector('[data-pf-rstep="1"]').disabled = k >= rKeys.length - 1;
          syncMove();
          placeWorld(r);
          var f = focusSel && rmCard.querySelector(focusSel);
          (f && !f.disabled ? f : rmCard.querySelector("[data-pf-rclose]")).focus({ preventScroll: true });
        };
        var closeRoute = function () {
          rm.hidden = true; pfMainEl.inert = false; if (pfNavEl) { pfNavEl.inert = false; } rKey = null;
          if (rOpener && document.contains(rOpener)) { rOpener.focus({ preventScroll: true }); }
        };
        openRoute = function (key, from) {
          var plate = PF.routes[key].plate;
          rKeys = Object.keys(PF.routes).filter(function (k) { return PF.routes[k].plate === plate && PF.routes[k].k !== "ai"; });
          rOpener = from; rm.hidden = false; pfMainEl.inert = true; if (pfNavEl) { pfNavEl.inert = true; } renderRoute(key);
        };
        rmCard.addEventListener("change", function (e) {
          if (e.target.hasAttribute("data-pf-rcheck")) { e.target.closest(".pf-rm__job").classList.toggle("is-checked", e.target.checked); syncMove(); }
        });
        rmCard.addEventListener("click", function (e) {
          var b = e.target.closest("button");
          if (!b || b.disabled) { return; }
          if (b.hasAttribute("data-pf-rclose") || b.hasAttribute("data-pf-rsave")) { closeRoute(); return; }
          if (b.hasAttribute("data-pf-rstep")) {
            var nk = rKeys[rKeys.indexOf(rKey) + (+b.getAttribute("data-pf-rstep"))];
            if (nk) { renderRoute(nk, '[data-pf-rstep="' + b.getAttribute("data-pf-rstep") + '"]'); }
          }
        });
        rm.addEventListener("click", function (e) { if (e.target.classList.contains("pf-pm__scrim")) { closeRoute(); } });
        rm.addEventListener("keydown", function (e) {
          if (e.key === "Escape") { e.stopPropagation(); closeRoute(); return; }
          if (e.key !== "Tab") { return; }
          var f = Array.prototype.filter.call(rmCard.querySelectorAll("button, input"), function (x) { return !x.disabled && x.tabIndex !== -1 && x.offsetParent !== null; });
          if (!f.length) { return; }
          if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
          else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
        });
      }

      /* Side-nav page cards: hovering or keyboard-focusing an item shows what that page of the platform does.
         One card, placed to the right of the item in unscaled .pf-screen pixels; the item's accessible description points at it. */
      var navGroups = pfView.querySelector(".rc-sidenav__groups");
      if (navGroups && PF.nav && pfScr) {
        var navItems = Array.prototype.slice.call(navGroups.querySelectorAll("[data-pf-nav]"));
        var navCard = document.createElement("div");
        navCard.className = "pf-navcard";
        navCard.id = "pf-navcard";
        navCard.setAttribute("role", "tooltip");
        navCard.hidden = true;
        pfScr.appendChild(navCard);
        navItems.forEach(function (b) { b.tabIndex = b.classList.contains("is-selected") ? 0 : -1; });
        var navFor = null;
        var showNav = function (b) {
          if (navFor === b) { return; }
          navFor = b;
          var label = b.getAttribute("data-pf-nav"), icon = b.querySelector(".rc-icon");
          navCard.innerHTML = '<div class="pf-navcard__head">' + (icon ? icon.outerHTML : "") + '<p class="body-m-semibold">' + esc(label) + "</p>" +
            (b.classList.contains("is-selected") ? '<span class="pf-navcard__here caption-m-medium">Вы здесь</span>' : "") + "</div>" +
            '<p class="body-m-regular pf-navcard__text">' + esc(PF.nav[label] || "") + "</p>";
          navCard.hidden = false;
          var sr = pfScr.getBoundingClientRect(), k = sr.width / pfScr.offsetWidth || 1, br = b.getBoundingClientRect();
          var nav = b.closest(".rc-sidenav").getBoundingClientRect();
          var cy = (br.top + br.height / 2 - sr.top) / k, h = navCard.offsetHeight;
          var top = Math.max(16, Math.min(cy - 22, pfScr.offsetHeight - h - 16));
          navCard.style.left = ((nav.right - sr.left) / k + 12) + "px";
          navCard.style.top = top + "px";
          navCard.style.setProperty("--ay", (cy - top) + "px");
          navItems.forEach(function (x) { x.removeAttribute("aria-describedby"); });
          b.setAttribute("aria-describedby", "pf-navcard");
          navCard.classList.add("is-on");
        };
        var hideNav = function () { navFor = null; navCard.classList.remove("is-on"); navCard.hidden = true; };
        navGroups.addEventListener("pointerover", function (e) { var b = e.target.closest("[data-pf-nav]"); if (b) { showNav(b); } });
        navGroups.addEventListener("pointerleave", hideNav);
        navGroups.addEventListener("focusin", function (e) { var b = e.target.closest("[data-pf-nav]"); if (b && b.matches(":focus-visible")) { showNav(b); } });
        navGroups.addEventListener("focusout", function (e) { if (!navGroups.contains(e.relatedTarget)) { hideNav(); } });
        navGroups.addEventListener("keydown", function (e) { if (e.key === "Escape") { hideNav(); } });
      }

      /* Gantt job counter: hovering the count next to a plate explains what it counts */
      var gBodies = Array.prototype.slice.call(pfView.querySelectorAll(".pf-gbody"));
      if (gBodies.length && pfScr) {
        var cTip = document.createElement("div");
        cTip.className = "pf-ctip";
        cTip.setAttribute("aria-hidden", "true");
        cTip.hidden = true;
        pfScr.appendChild(cTip);
        var cFor = null;
        var onCount = function (e) {
          var c = e.target.closest("[data-pf-jobs]");
          if (!c || c === cFor) { return; }
          cFor = c;
          var n = +c.getAttribute("data-pf-jobs");
          var byDriver = c.getAttribute("data-pf-who") === "driver";
          cTip.innerHTML = '<p class="body-m-semibold">' + n + " " + plural(n, "задание", "задания", "заданий") + " на день</p>" +
            '<p class="body-m-regular pf-ctip__text">' + (byDriver
              ? "Все задания водителя за день: площадки во всех рейсах его смены — выполненные, текущие и назначенные. "
              : "Все задания машины за день: площадки во всех рейсах смены — выполненные, текущие и назначенные. ") +
            "Предложения AI-диспетчера не входят, пока их не утвердят.</p>" +
            '<p class="caption-m-medium pf-muted">' + esc(c.getAttribute("data-pf-plate")) + " · 6 Янв 2026</p>";
          cTip.hidden = false;
          var sr = pfScr.getBoundingClientRect(), k = sr.width / pfScr.offsetWidth || 1, cr = c.getBoundingClientRect();
          var cx = (cr.left + cr.width / 2 - sr.left) / k, top = (cr.top - sr.top) / k, w = cTip.offsetWidth, h = cTip.offsetHeight;
          var below = top - h - 10 < 16, x = Math.max(16, Math.min(cx - 24, pfScr.offsetWidth - w - 16));
          cTip.classList.toggle("is-below", below);
          cTip.style.left = x + "px";
          cTip.style.top = (below ? (cr.bottom - sr.top) / k + 10 : top - h - 10) + "px";
          cTip.style.setProperty("--ax", (cx - x) + "px");
          cTip.classList.add("is-on");
        };
        var offCount = function (e) {
          var c = e.target.closest("[data-pf-jobs]");
          if (c && !(e.relatedTarget && c.contains(e.relatedTarget))) { cFor = null; cTip.classList.remove("is-on"); cTip.hidden = true; }
        };
        gBodies.forEach(function (gb) {
          gb.addEventListener("pointerover", onCount);
          gb.addEventListener("pointerout", offCount);
          gb.addEventListener("scroll", function () { cFor = null; cTip.hidden = true; }, { passive: true });
        });

        /* Row toggle: «По машинам» shows a row per truck (hover a shift: its driver), «По водителям» a row per driver (hover: its truck) */
        var vBtns = Array.prototype.slice.call(pfView.querySelectorAll("[data-pf-gview]"));
        vBtns.forEach(function (b) {
          b.addEventListener("click", function () {
            var view = b.getAttribute("data-pf-gview"), from = gBodies.filter(function (g) { return !g.hidden; })[0];
            vBtns.forEach(function (x) { var on = x === b; x.classList.toggle("is-selected", on); x.setAttribute("aria-pressed", on ? "true" : "false"); });
            gBodies.forEach(function (g) {
              g.hidden = g.getAttribute("data-pf-gbody") !== view;
              if (!g.hidden && from && from !== g) { g.scrollTop = from.scrollTop; }
            });
            /* keep the selected trip selected in the other view */
            if (activeEl && activeEl.hasAttribute("data-pf-route")) {
              var twin = pfView.querySelector('[data-pf-gbody="' + view + '"] [data-pf-route="' + activeEl.getAttribute("data-pf-route") + '"]');
              if (twin) { activeEl.classList.remove("is-active"); activeEl.removeAttribute("aria-pressed"); activeEl = twin; twin.classList.add("is-active"); twin.setAttribute("aria-pressed", "true"); }
            }
            cFor = null; cTip.hidden = true;
          });
        });
      }

      /* Truck card metrics: hovering «Пробег за смену» / «Расход топлива» explains where the numbers come from */
      var M_TIPS = {
        km: ["Пробег за смену", "Считается по GPS-данным из Wialon: путь машины с начала смены по трекам. Рядом — общий пробег по одометру."],
        fuel: ["Расход топлива", "Расход и остаток топлива в баке считаются по ДУТ (датчику уровня топлива), установленному на машине."]
      };
      if (pfScr) {
        var mTip = document.createElement("div");
        mTip.className = "pf-ctip";
        mTip.setAttribute("aria-hidden", "true");
        mTip.hidden = true;
        pfScr.appendChild(mTip);
        var mFor = null;
        var hideM = function () { mFor = null; mTip.classList.remove("is-on"); mTip.hidden = true; };
        pfView.addEventListener("pointerover", function (e) {
          var c = e.target.closest("[data-pf-metric]");
          if (!c || c === mFor) { return; }
          var t = M_TIPS[c.getAttribute("data-pf-metric")];
          if (!t) { return; }
          mFor = c;
          mTip.innerHTML = '<p class="body-m-semibold">' + t[0] + '</p><p class="body-m-regular pf-ctip__text">' + t[1] + "</p>";
          mTip.hidden = false;
          var sr = pfScr.getBoundingClientRect(), k = sr.width / pfScr.offsetWidth || 1, cr = c.getBoundingClientRect();
          var cx = (cr.left + cr.width / 2 - sr.left) / k, top = (cr.top - sr.top) / k, w = mTip.offsetWidth, h = mTip.offsetHeight;
          var below = top - h - 10 < 16, x = Math.max(16, Math.min(cx - w / 2, pfScr.offsetWidth - w - 16));
          mTip.classList.toggle("is-below", below);
          mTip.style.left = x + "px";
          mTip.style.top = (below ? (cr.bottom - sr.top) / k + 10 : top - h - 10) + "px";
          mTip.style.setProperty("--ax", (cx - x) + "px");
          mTip.classList.add("is-on");
        });
        pfView.addEventListener("pointerout", function (e) {
          var c = e.target.closest("[data-pf-metric]");
          if (c && !(e.relatedTarget && c.contains(e.relatedTarget))) { hideM(); }
        });
        pfView.addEventListener("click", hideM);
      }

      var activeEl = pfView.querySelector(".pf-map__truck.is-active");
      drawRoute(activeEl);
      var showCard = function (which, html, el) {
        pfTop.classList.toggle("is-collapsed", !which);
        if (which) { Object.keys(slots).forEach(function (k) { slots[k].hidden = k !== which; }); }
        if (html) { slots.dyn.innerHTML = uniqIds(html); muteControls(slots.dyn); }
        if (activeEl) { activeEl.classList.remove("is-active"); activeEl.removeAttribute("aria-pressed"); }
        activeEl = el || null;
        if (activeEl) { activeEl.classList.add("is-active"); activeEl.setAttribute("aria-pressed", "true"); }
        drawRoute(activeEl);
      };
      Object.keys(slots).forEach(function (k) { if (k !== "dyn") { muteControls(slots[k]); } });

      /* Schedule tab «Развернуть»: the bottom block grows to 80% of the screen height and the map row shrinks to the rest.
         Expanding closes the upper-right card; going back to the Status tab or starting the tour collapses it again. */
      var xBtn = pfView.querySelector('[data-pf-tools="schedule"] .pf-status__tools--schedule > .pf-contents:last-child > .rc-ibtn');
      if (xBtn && pfMainEl) {
        var xWrap = xBtn.parentElement, xSvg = xBtn.querySelector("svg"), xOpenIcon = xSvg ? xSvg.innerHTML : "";
        var X_PATH = ' stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" stroke="#155DFC"/>';
        var xCloseIcon = ["M21 21L15 15M15 19.8V15H19.8", "M3 21L9 15M4.2 15H9V19.8", "M21 3L15 9M15 4.2V9H19.8", "M3 3L9 9M9 4.2V9H4.2"]
          .map(function (d) { return '<path d="' + d + '"' + X_PATH; }).join("");
        if (xWrap && xWrap.hasAttribute("inert")) { xWrap.removeAttribute("inert"); xWrap.removeAttribute("aria-hidden"); }
        var setExpanded = function (on) {
          if (pfMainEl.classList.contains("is-expanded") === on) { return; }
          pfMainEl.classList.toggle("is-expanded", on);
          xBtn.setAttribute("aria-label", on ? "Свернуть" : "Развернуть");
          xBtn.setAttribute("aria-pressed", on ? "true" : "false");
          if (xSvg) { xSvg.innerHTML = on ? xCloseIcon : xOpenIcon; }
          if (on && !pfTop.classList.contains("is-collapsed")) { showCard(null, null, null); }
        };
        xBtn.setAttribute("aria-pressed", "false");
        xBtn.addEventListener("click", function () { setExpanded(!pfMainEl.classList.contains("is-expanded")); });
        pfView.addEventListener("pf:tabchange", function (e) { if (e.detail !== "schedule") { setExpanded(false); } });
        pfView.addEventListener("pf:tour", function (e) { if (e.detail) { setExpanded(false); } });
        pfView.addEventListener("pf:collapse", function () { setExpanded(false); });
        /* a click on the map (not a drag to pan it) brings the block back to its normal size */
        var xMap = pfTop.querySelector(".pf-map"), xDown = null;
        if (xMap) {
          xMap.addEventListener("pointerdown", function (e) { xDown = [e.clientX, e.clientY]; });
          xMap.addEventListener("click", function (e) {
            if (e.detail && xDown && Math.abs(e.clientX - xDown[0]) + Math.abs(e.clientY - xDown[1]) > 6) { return; }
            if (pfScr && pfScr.classList.contains("is-mapfull")) { return; } // the full-screen map covers the block; leave it as it was
            setExpanded(false);
          });
        }
      }

      pfView.addEventListener("click", function (e) {
        var ph = e.target.closest("[data-pf-photo]");
        if (ph) { var ij = ph.getAttribute("data-pf-photo").split(":"); openProof(+ij[0], +ij[1], ph); return; }
        var rmb = e.target.closest("[data-pf-rmodal]");
        if (rmb) { openRoute(rmb.getAttribute("data-pf-rmodal"), rmb); return; }
        if (e.target.closest(".pf-pm")) { return; }
        var t = e.target.closest("[data-pf-site], [data-pf-route], [data-pf-truck], [data-pf-close]");
        if (!t || !pfView.contains(t)) { return; }
        if (t.hasAttribute("data-pf-close")) {
          var back = activeEl;
          showCard(null, null, null);
          if (back) { back.focus({ preventScroll: true }); }
          return;
        }
        if (t.hasAttribute("data-pf-truck")) {
          showCard("truck-" + t.getAttribute("data-pf-truck"), null, t);
          return;
        }
        if (t.hasAttribute("data-pf-site")) { var si = +t.getAttribute("data-pf-site"); showCard("dyn", siteCard(PF.sites[si], si), t); return; }
        var r = PF.routes[t.getAttribute("data-pf-route")];
        if (r) { showCard("dyn", routeCard(r), t); }
      });

      /* Map tooltip on hover or keyboard focus. Decorative: each button's accessible name already carries the same text */
      var pfMap = pfView.querySelector(".pf-map");
      if (pfMap && PF.tips) {
        var tip = document.createElement("div");
        tip.className = "pf-maptip";
        tip.setAttribute("aria-hidden", "true");
        tip.hidden = true;
        pfMap.appendChild(tip);
        var tipFor = null;
        var tipHtml = function (el) {
          var line = function (t, s) { return '<span class="pf-maptip__t">' + esc(t) + "</span>" + (s ? '<span class="pf-maptip__s">' + esc(s) + "</span>" : ""); };
          if (el.hasAttribute("data-pf-truck")) { return line(el.getAttribute("data-pf-truck"), el.getAttribute("data-pf-driver")); }
          if (el.hasAttribute("data-pf-depot")) { return line(PF.tips.depot.name, PF.tips.depot.sub); }
          var s = PF.sites[+el.getAttribute("data-pf-site")];
          var n = s.jobs.length;
          return line(s.addr, (s.addr !== s.name ? s.name + " · " : "") + n + " " + plural(n, "задание", "задания", "заданий"));
        };
        var showTip = function (el) {
          if (tipFor === el) { return; }
          tipFor = el;
          tip.innerHTML = tipHtml(el);
          tip.hidden = false;
          var mr = pfMap.getBoundingClientRect(), er = el.getBoundingClientRect();
          var k = mr.width / pfMap.offsetWidth || 1;
          var cx = (er.left + er.width / 2 - mr.left) / k, top = (er.top - mr.top) / k, bottom = (er.bottom - mr.top) / k;
          var w = tip.offsetWidth, h = tip.offsetHeight, pad = 8;
          var x = Math.min(Math.max(cx, w / 2 + pad), pfMap.offsetWidth - w / 2 - pad);
          var below = top - h - 8 < pad;
          tip.classList.toggle("is-below", below);
          tip.style.left = x + "px";
          tip.style.top = (below ? bottom : top) + "px";
          tip.style.setProperty("--ax", (w / 2 + cx - x) + "px");
          tip.classList.add("is-on");
        };
        var hideTip = function () { tipFor = null; tip.classList.remove("is-on"); tip.hidden = true; };
        var TIP_SEL = "[data-pf-site], [data-pf-truck], [data-pf-depot]";
        pfMap.addEventListener("pointerover", function (e) { var el = e.target.closest(TIP_SEL); if (el) { showTip(el); } });
        pfMap.addEventListener("pointerout", function (e) {
          var el = e.target.closest(TIP_SEL);
          if (el && !(e.relatedTarget && el.contains(e.relatedTarget))) { hideTip(); }
        });
        pfMap.addEventListener("focusin", function (e) { var el = e.target.closest(TIP_SEL); if (el && el.matches(":focus-visible")) { showTip(el); } });
        pfMap.addEventListener("focusout", hideTip);
        pfMap.addEventListener("keydown", function (e) { if (e.key === "Escape") { hideTip(); } });
      }

      /* Map search and filter (the build ships them as decorative DS controls; they come alive here).
         Search: a combobox over sites (name, address, type, clients, job numbers) and trucks (plate, driver). Picking a result
         flies the map to it and opens its card, the same as clicking it. Filter: a popover of site statuses, site types and
         a trucks switch, with live counts; the button shows how many groups narrow the map. A site that the filter hides
         and the search picks brings the filter back to everything. The tour starts from a clear search and filter. */
      var mapTop = pfMap && pfMap.querySelector(".pf-map__top");
      if (mapTop && PF.sites) {
        (function () {
          var searchLbl = mapTop.querySelector(".rc-search"), input = mapTop.querySelector(".rc-search__input");
          var fBtn = mapTop.querySelector(".rc-filterbtn");
          if (!searchLbl || !input || !fBtn) { return; }
          /* search, filter and the expand button (full-screen map, below) become real controls */
          mapTop.removeAttribute("inert"); mapTop.removeAttribute("aria-hidden");
          mapTop.classList.add("is-on");

          var STATUS = [["created", "Неназначено"], ["assigned", "Назначено"], ["in-progress", "Машина в пути"], ["completed", "Выполнено"], ["failed", "Невывоз"]];
          var STATUS_WORD = {}; STATUS.forEach(function (s) { STATUS_WORD[s[0]] = s[1]; });
          var KINDS = [];
          PF.sites.forEach(function (s) { if (KINDS.indexOf(s.kind) < 0) { KINDS.push(s.kind); } });
          var pinEls = Array.prototype.slice.call(pfMap.querySelectorAll("[data-pf-site]"));
          var truckEls = Array.prototype.slice.call(pfMap.querySelectorAll(".pf-map__truck"));
          var pinOf = function (si) { return pfMap.querySelector('[data-pf-site="' + si + '"]'); };
          var miniPin = function (st) { return '<span class="pf-mf__pin" aria-hidden="true">' + PF.ui.sitePin[st] + "</span>"; };
          var norm = function (t) { return String(t || "").toLowerCase().replace(/ё/g, "е").replace(/[«»"]/g, ""); };

          /* ---------- filter ---------- */
          var F = { st: {}, kind: {}, trucks: true };
          var resetF = function () { STATUS.forEach(function (s) { F.st[s[0]] = true; }); KINDS.forEach(function (k) { F.kind[k] = true; }); F.trucks = true; };
          resetF();
          var siteOn = function (s) { return F.st[s.pin] && F.kind[s.kind]; };
          var activeGroups = function () {
            var n = 0;
            if (STATUS.some(function (s) { return !F.st[s[0]]; })) { n++; }
            if (KINDS.some(function (k) { return !F.kind[k]; })) { n++; }
            if (!F.trucks) { n++; }
            return n;
          };
          var fCount = document.createElement("b");
          fCount.className = "pf-mf__count";
          fCount.hidden = true;
          fBtn.appendChild(fCount);
          fBtn.setAttribute("aria-haspopup", "dialog");
          fBtn.setAttribute("aria-expanded", "false");
          fBtn.setAttribute("aria-controls", "pf-mfilter");

          var pop = document.createElement("div");
          pop.className = "pf-mf";
          pop.id = "pf-mfilter";
          pop.setAttribute("role", "dialog");
          pop.setAttribute("aria-label", "Фильтр карты");
          pop.hidden = true;
          var row = function (group, key, label, mark) {
            return '<label class="pf-mf__row"><input type="checkbox" data-mf="' + group + '" value="' + esc(key) + '" checked>' +
              '<span class="pf-mf__box" aria-hidden="true"></span>' + (mark || "") + '<span class="pf-mf__lbl">' + esc(label) + '</span><span class="pf-mf__n" data-mf-n="' + group + ":" + esc(key) + '"></span></label>';
          };
          pop.innerHTML =
            '<fieldset class="pf-mf__set"><legend class="caption-caps-bold pf-muted">Статус площадки</legend>' + STATUS.map(function (s) { return row("st", s[0], s[1], miniPin(s[0])); }).join("") + "</fieldset>" +
            '<fieldset class="pf-mf__set"><legend class="caption-caps-bold pf-muted">Тип площадки</legend>' + KINDS.map(function (k) { return row("kind", k, k); }).join("") + "</fieldset>" +
            '<fieldset class="pf-mf__set"><legend class="caption-caps-bold pf-muted">На карте</legend>' + row("trucks", "1", "Машины") + "</fieldset>" +
            '<div class="pf-mf__foot"><span class="pf-mf__total caption-m-medium pf-muted" aria-live="polite"></span><button type="button" class="pf-mf__reset" data-mf-reset>Сбросить</button></div>';
          mapTop.querySelector(".pf-map__tools").appendChild(pop);

          var applyF = function () {
            var shown = 0;
            pinEls.forEach(function (b) {
              var on = siteOn(PF.sites[+b.getAttribute("data-pf-site")]);
              b.classList.toggle("is-filtered", !on);
              if (on) { shown++; }
            });
            pfMap.classList.toggle("is-notrucks", !F.trucks);
            mapCluster();
            /* keep one reachable tab stop in the pin group */
            var stop = pinEls.filter(function (b) { return b.tabIndex === 0; })[0];
            if (stop && stop.classList.contains("is-filtered")) {
              var next = pinEls.filter(function (b) { return !b.classList.contains("is-filtered"); })[0];
              stop.tabIndex = -1;
              if (next) { next.tabIndex = 0; }
            }
            /* counts: sites of each status / type among those the other group lets through */
            STATUS.forEach(function (s) {
              var n = PF.sites.filter(function (x) { return x.pin === s[0] && F.kind[x.kind]; }).length;
              pop.querySelector('[data-mf-n="st:' + s[0] + '"]').textContent = n;
            });
            KINDS.forEach(function (k) {
              var n = PF.sites.filter(function (x) { return x.kind === k && F.st[x.pin]; }).length;
              pop.querySelector('[data-mf-n="kind:' + k + '"]').textContent = n;
            });
            pop.querySelector('[data-mf-n="trucks:1"]').textContent = truckEls.length;
            Array.prototype.forEach.call(pop.querySelectorAll("[data-mf]"), function (c) {
              var g = c.getAttribute("data-mf");
              c.checked = g === "trucks" ? F.trucks : !!F[g][c.value];
            });
            pop.querySelector(".pf-mf__total").textContent = "Площадок на карте: " + shown + " из " + PF.sites.length;
            var n = activeGroups();
            fBtn.classList.toggle("is-selected", n > 0);
            fCount.hidden = !n;
            fCount.textContent = n;
            fBtn.setAttribute("aria-label", n ? "Фильтр, применено: " + n : "Фильтр");
          };
          pop.addEventListener("change", function (e) {
            var c = e.target.closest("[data-mf]");
            if (!c) { return; }
            var g = c.getAttribute("data-mf");
            if (g === "trucks") { F.trucks = c.checked; } else { F[g][c.value] = c.checked; }
            applyF();
          });
          var openF = function (on) {
            pop.hidden = !on;
            fBtn.setAttribute("aria-expanded", on ? "true" : "false");
            if (on) { closeList(); var first = pop.querySelector("input"); if (first) { first.focus({ preventScroll: true }); } }
          };
          fBtn.addEventListener("click", function (e) { e.stopPropagation(); openF(pop.hidden); });
          pop.addEventListener("click", function (e) {
            e.stopPropagation();
            if (e.target.closest("[data-mf-reset]")) { resetF(); applyF(); }
          });
          pop.addEventListener("keydown", function (e) { if (e.key === "Escape") { e.stopPropagation(); openF(false); fBtn.focus({ preventScroll: true }); } });
          applyF();

          /* ---------- search ---------- */
          var INDEX = PF.sites.map(function (s, si) {
            var hay = [s.name, s.addr, s.kind, STATUS_WORD[s.pin]];
            (s.groups || []).forEach(function (g) { hay.push(g.client); });
            (s.jobs || []).forEach(function (j) { hay.push(j.id); });
            return { kind: "site", si: si, title: s.addr, sub: (s.name !== s.addr ? s.name + " · " : "") + s.kind, st: s.pin, hay: norm(hay.join(" | ")) };
          });
          truckEls.forEach(function (t) {
            var plate = t.getAttribute("data-pf-truck"), driver = t.getAttribute("data-pf-driver") || "";
            var vt = t.getAttribute("data-pf-vtype") || "Мусоровоз ТБО", park = t.classList.contains("is-parked") ? " · в депо" : "";
            INDEX.push({ kind: "truck", el: t, title: plate, sub: driver + " · " + vt + park, hay: norm(plate + " | " + driver + " | машина " + vt + park) });
          });
          var list = document.createElement("ul");
          list.className = "pf-ms";
          list.id = "pf-msearch";
          list.setAttribute("role", "listbox");
          list.setAttribute("aria-label", "Результаты поиска");
          list.hidden = true;
          mapTop.appendChild(list);
          input.setAttribute("role", "combobox");
          input.setAttribute("aria-autocomplete", "list");
          input.setAttribute("aria-expanded", "false");
          input.setAttribute("aria-controls", "pf-msearch");
          input.setAttribute("aria-label", "Поиск по площадкам, адресам и машинам");
          input.setAttribute("autocomplete", "off");
          input.setAttribute("spellcheck", "false");
          input.placeholder = "Адрес, площадка, госномер";
          var hits = [], cur = -1;
          var truckArt = function (t) { var a = t.querySelector(".pf-map__truckart--off"); return a ? a.innerHTML : ""; };
          var mark = function (text, q) {
            var i = norm(text).indexOf(q);
            if (!q || i < 0) { return esc(text); }
            return esc(text.slice(0, i)) + "<mark>" + esc(text.slice(i, i + q.length)) + "</mark>" + esc(text.slice(i + q.length));
          };
          var closeList = function () { list.hidden = true; input.setAttribute("aria-expanded", "false"); input.removeAttribute("aria-activedescendant"); cur = -1; };
          var setCur = function (i) {
            cur = i;
            Array.prototype.forEach.call(list.children, function (li, k) { li.setAttribute("aria-selected", k === i ? "true" : "false"); });
            if (i >= 0 && list.children[i]) { input.setAttribute("aria-activedescendant", list.children[i].id); list.children[i].scrollIntoView({ block: "nearest" }); }
            else { input.removeAttribute("aria-activedescendant"); }
          };
          var render = function () {
            var q = norm(input.value.trim());
            if (!q) { closeList(); return; }
            var words = q.split(/\s+/);
            hits = INDEX.filter(function (x) { return words.every(function (w) { return x.hay.indexOf(w) >= 0; }); })
              .sort(function (a, b) { return (b.hay.indexOf(q) === 0) - (a.hay.indexOf(q) === 0) || (a.kind === "truck" ? -1 : 0) - (b.kind === "truck" ? -1 : 0); })
              .slice(0, 8);
            openF(false);
            list.hidden = false;
            input.setAttribute("aria-expanded", "true");
            if (!hits.length) { list.innerHTML = '<li class="pf-ms__empty" role="presentation">Ничего не найдено</li>'; cur = -1; return; }
            list.innerHTML = hits.map(function (x, i) {
              var ico = x.kind === "truck" ? '<span class="pf-ms__truck" aria-hidden="true">' + truckArt(x.el) + "</span>" : miniPin(x.st);
              var off = x.kind === "site" && !siteOn(PF.sites[x.si]) ? '<span class="pf-ms__off caption-m-medium">скрыта фильтром</span>' : "";
              return '<li class="pf-ms__opt" role="option" id="pf-ms-' + i + '" aria-selected="false" data-ms="' + i + '">' + ico +
                '<span class="pf-ms__txt"><span class="pf-ms__t body-m-medium">' + mark(x.title, words[0]) + '</span><span class="pf-ms__s caption-m-regular pf-muted">' + mark(x.sub, words[0]) + "</span></span>" + off + "</li>";
            }).join("");
            setCur(0);
          };
          var pick = function (x) {
            if (!x) { return; }
            closeList();
            var el = x.kind === "truck" ? x.el : pinOf(x.si);
            if (!el) { return; }
            if (x.kind === "site" && el.classList.contains("is-filtered")) { resetF(); applyF(); }
            if (x.kind === "truck" && !F.trucks) { F.trucks = true; applyF(); }
            input.value = x.title;
            mapFocus(el, function () { el.click(); el.focus({ preventScroll: true }); });
          };
          /* a plate in the schedule (pf:findtruck): fly to that truck and open its card, as a picked search result does */
          pfView.addEventListener("pf:findtruck", function (e) {
            var el = null;
            truckEls.forEach(function (t) { if (t.getAttribute("data-pf-truck") === e.detail) { el = t; } });
            if (!el) { return; }
            if (!F.trucks) { F.trucks = true; applyF(); }
            mapFocus(el, function () { el.click(); });
          });
          input.addEventListener("input", render);
          input.addEventListener("focus", function () { if (input.value.trim()) { render(); } });
          input.addEventListener("keydown", function (e) {
            if (e.key === "ArrowDown" || e.key === "ArrowUp") {
              if (list.hidden) { render(); }
              if (!hits.length) { return; }
              e.preventDefault();
              setCur((cur + (e.key === "ArrowDown" ? 1 : -1) + hits.length) % hits.length);
            } else if (e.key === "Enter") {
              if (!list.hidden && cur >= 0) { e.preventDefault(); pick(hits[cur]); }
            } else if (e.key === "Escape") {
              e.stopPropagation();
              if (!list.hidden) { closeList(); } else { input.value = ""; }
            }
          });
          list.addEventListener("mousedown", function (e) { e.preventDefault(); }); // keep focus in the input while clicking
          list.addEventListener("click", function (e) { var li = e.target.closest("[data-ms]"); if (li) { pick(hits[+li.getAttribute("data-ms")]); } });
          list.addEventListener("pointermove", function (e) { var li = e.target.closest("[data-ms]"); if (li && +li.getAttribute("data-ms") !== cur) { setCur(+li.getAttribute("data-ms")); } });
          input.addEventListener("blur", function () { setTimeout(function () { if (document.activeElement !== input) { closeList(); } }, 0); });

          /* outside clicks close both; the tour starts from a clear map */
          document.addEventListener("click", function (e) {
            if (!pop.hidden && !pop.contains(e.target) && e.target !== fBtn) { openF(false); }
          });
          pfView.addEventListener("pf:tour", function (e) {
            if (!e.detail) { return; }
            openF(false); closeList(); input.value = ""; resetF(); applyF();
          });
        })();
      }

      /* Full-screen map: the map's expand button clears the dashboard instead of going browser-fullscreen. The side nav
         slides out left, the Gantt block down and the upper-right card right (CSS, .is-mapfull), while the map is lifted
         out of its grid cell (a .pf-map-slot keeps the cell, so nothing else reflows) and grows over the whole screen.
         A big × at the bottom of the map, the expand button again, or Escape plays it all backwards into the slot. */
      var fsBtn = mapTop && mapTop.querySelector(".pf-map__tools > .rc-ibtn");
      if (fsBtn && pfMap && pfScr && pfMainEl) {
        (function () {
          var fsStatus = pfMainEl.querySelector(".pf-status");
          var away = [pfNavEl, pfSide, fsStatus].filter(Boolean);
          var slot = null, fsOn = false, fsTimer = 0;
          var fsX = document.createElement("button");
          fsX.type = "button";
          fsX.className = "pf-mapx";
          fsX.setAttribute("aria-label", "Свернуть карту");
          fsX.title = "Свернуть карту";
          fsX.tabIndex = -1;
          fsX.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';
          pfMap.appendChild(fsX);
          fsBtn.removeAttribute("inert"); fsBtn.removeAttribute("aria-hidden"); fsBtn.tabIndex = 0;
          fsBtn.setAttribute("aria-pressed", "false");
          var box = function (r) { pfMap.style.left = r[0] + "px"; pfMap.style.top = r[1] + "px"; pfMap.style.width = r[2] + "px"; pfMap.style.height = r[3] + "px"; };
          var rectOf = function (el) { return [el.offsetLeft, el.offsetTop, el.offsetWidth, el.offsetHeight]; }; // .pf-screen px, unscaled
          var settle = function (ms, fn) { clearTimeout(fsTimer); fsTimer = setTimeout(fn, reduceMotion ? 0 : ms); };
          var setAway = function (on) { away.forEach(function (el) { el.inert = on; }); };
          var open = function () {
            if (fsOn) { return; }
            fsOn = true;
            pfView.dispatchEvent(new CustomEvent("pf:mapfull", { detail: true }));
            if (!slot) {
              /* lift the map out at the exact box it had in the grid */
              var r0 = rectOf(pfMap);
              slot = document.createElement("div");
              slot.className = "pf-map-slot";
              slot.setAttribute("aria-hidden", "true");
              pfMap.parentNode.insertBefore(slot, pfMap);
              pfMap.style.position = "absolute";
              box(r0);
            }
            pfScr.classList.add("is-mapanim");
            void pfMap.offsetWidth; // commit the start box before the transition target
            pfScr.classList.add("is-mapfull");
            var cs = getComputedStyle(pfScr);
            var pl = parseFloat(cs.paddingLeft) || 16, pt = parseFloat(cs.paddingTop) || 16;
            box([pl, pt, pfScr.clientWidth - pl - (parseFloat(cs.paddingRight) || 16), pfScr.clientHeight - pt - (parseFloat(cs.paddingBottom) || 16)]);
            setAway(true);
            fsX.tabIndex = 0;
            fsBtn.setAttribute("aria-label", "Свернуть карту");
            fsBtn.setAttribute("aria-pressed", "true");
            clearTimeout(fsTimer); // a close still settling stays lifted and simply grows again
          };
          var finishClose = function () {
            pfScr.classList.remove("is-mapanim");
            pfMap.style.position = pfMap.style.left = pfMap.style.top = pfMap.style.width = pfMap.style.height = "";
            if (slot) { slot.remove(); slot = null; }
          };
          var close = function (instant) {
            if (!fsOn) { return; }
            fsOn = false;
            var back = pfMap.contains(document.activeElement);
            pfScr.classList.remove("is-mapfull");
            if (slot) { box(rectOf(slot)); } // the slot follows the dashboard (card column, Schedule «Развернуть») while the map is out
            setAway(false);
            fsX.tabIndex = -1;
            fsBtn.setAttribute("aria-label", "Развернуть карту");
            fsBtn.setAttribute("aria-pressed", "false");
            if (back) { fsBtn.focus({ preventScroll: true }); }
            pfView.dispatchEvent(new CustomEvent("pf:mapfull", { detail: false }));
            if (instant) { clearTimeout(fsTimer); finishClose(); } else { settle(720, finishClose); }
          };
          fsBtn.addEventListener("click", function (e) { e.stopPropagation(); if (fsOn) { close(); } else { open(); } });
          fsX.addEventListener("click", function (e) { e.stopPropagation(); close(); });
          fsX.addEventListener("pointerdown", function (e) { e.stopPropagation(); }); // not a drag on the map underneath
          pfView.addEventListener("keydown", function (e) { if (e.key === "Escape" && fsOn && !e.defaultPrevented) { close(); } });
          pfView.addEventListener("pf:tour", function (e) { if (e.detail) { close(true); } });
        })();
      }

      /* Crew alert cards: place each card above its icon, in unscaled .pf-screen pixels (below if it would leave the screen) */
      var pfScreen = pfView.querySelector(".pf-screen");
      Array.prototype.forEach.call(pfView.querySelectorAll(".pf-galert"), function (al) {
        var btn = al.querySelector(".pf-galert__btn"), card = al.querySelector(".pf-gcard");
        var place = function () {
          var sr = pfScreen.getBoundingClientRect(), k = sr.width / pfScreen.offsetWidth || 1, ir = btn.getBoundingClientRect();
          var x = (ir.left - sr.left) / k - 12, top = (ir.top - sr.top) / k, below = card.offsetHeight + 8 > top;
          x = Math.max(8, Math.min(x, pfScreen.offsetWidth - card.offsetWidth - 8));
          card.style.setProperty("--x", x + "px");
          card.style.setProperty("--y", (below ? (ir.bottom - sr.top) / k + 8 : top - 8) + "px");
          card.classList.toggle("is-below", below);
        };
        al.addEventListener("pointerenter", place);
        al.addEventListener("focusin", place);
      });

      /* Schedule plates find their truck on the map. Each plate with a truck on the map becomes a button (before the roving
         focus below collects the Gantt's buttons); an expanded block collapses first so the map has its full height. */
      Array.prototype.forEach.call(pfView.querySelectorAll(".pf-gtruck__plate"), function (sp) {
        var plate = sp.textContent.trim();
        if (!pfView.querySelector('.pf-map__truck[data-pf-truck="' + plate + '"]')) { return; }
        var b = document.createElement("button");
        b.type = "button";
        b.className = sp.className + " pf-gtruck__find";
        b.tabIndex = -1;
        b.textContent = plate;
        b.setAttribute("aria-label", "Найти машину " + plate + " на карте");
        b.title = "Показать на карте";
        sp.parentNode.replaceChild(b, sp);
        b.addEventListener("click", function () {
          var wait = pfMainEl && pfMainEl.classList.contains("is-expanded") ? 340 : 0;
          pfView.dispatchEvent(new CustomEvent("pf:collapse"));
          setTimeout(function () { pfView.dispatchEvent(new CustomEvent("pf:findtruck", { detail: plate })); }, wait);
        });
      });

      /* Roving focus inside the pin group and the Gantt: one tab stop each, arrows move */
      Array.prototype.forEach.call(pfView.querySelectorAll("[data-pf-roving]"), function (group) {
        var all = Array.prototype.filter.call(group.querySelectorAll("button"), function (x) { return !x.closest(".pf-gcard"); });
        group.addEventListener("keydown", function (e) {
          var items = all.filter(function (x) { return !x.classList.contains("is-filtered") && !x.classList.contains("is-clustered"); }); // the map filter and clusters hide pins
          var i = items.indexOf(document.activeElement);
          if (i < 0) { return; }
          var n = { ArrowRight: i + 1, ArrowDown: i + 1, ArrowLeft: i - 1, ArrowUp: i - 1, Home: 0, End: items.length - 1 }[e.key];
          if (n === undefined) { return; }
          e.preventDefault();
          n = (n + items.length) % items.length;
          items[i].tabIndex = -1; items[n].tabIndex = 0; items[n].focus({ preventScroll: false });
        });
        group.addEventListener("click", function (e) {
          /* Alert card CTA: open the row's in-progress trip in the side card */
          var cta = e.target.closest(".pf-gcard .rc-btn");
          if (cta) {
            var trip = group.querySelector('[data-pf-route="' + cta.closest(".pf-gcard").getAttribute("data-pf-open") + '"]');
            cta.blur();
            if (trip) { trip.click(); trip.focus({ preventScroll: true }); }
            return;
          }
          var b = e.target.closest("button");
          if (!b || all.indexOf(b) < 0) { return; }
          all.forEach(function (x) { x.tabIndex = x === b ? 0 : -1; });
        });
      });


      /* ---------- Auto tour: the default way the dashboard presents itself ----------
         A drawn cursor walks the real interface (the same clicks and hover cards a visitor gets) with a narration callout per step.
         A camera zooms in (up to 1.3x) on each feature the first time it appears, and a spotlight dims everything else.
         Cursor, callout, spotlight and prompts live on the unzoomed stage, so they keep their size while the screen zooms.
         A click on the screen pauses and asks: explore yourself or resume. «Попробовать интерфейс самому», Tab into the screen
         or Escape hand over control at once. Starts once when the screen is 35% visible; pauses offscreen and in a hidden tab;
         ends on an invite, not a loop. Reduced motion or a panning (narrow) frame: no autoplay; the replay link starts it. */
      var tourFrame = pfView.closest(".pf-frame"), tourStage = pfView.querySelector(".pf-stage");
      if (pfScr && tourFrame && tourStage && window.Promise && window.requestAnimationFrame) {
        var STOP = { stop: true };
        var T = { on: false, paused: false, held: false, token: 0, anim: null, acting: false, seen: false, hovered: [] };
        var reduceTour = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
        var CAM_MS = 720;

        /* chrome */
        var tWrap = document.createElement("div");
        tWrap.className = "pf-tourwrap";
        pfView.parentNode.insertBefore(tWrap, pfView);
        tWrap.appendChild(pfView);
        var mk = function (cls, html, parent) { var e = document.createElement("div"); e.className = cls; if (html) { e.innerHTML = html; } e.hidden = true; parent.appendChild(e); return e; };
        var tSpot = mk("pf-tour-spot", "", tourStage);
        tSpot.setAttribute("aria-hidden", "true");
        var tShield = mk("pf-tour-shield", "", tourStage);
        var tVeil = mk("pf-tour-veil", "", tourStage);
        var tCur = mk("pf-tour-cursor", '<span class="pf-tour-cursor__ring"></span><svg width="26" height="26" viewBox="0 0 30 30"><path d="M6 3.5v20.2l5.1-4.9 3.6 8.2 3.6-1.6-3.6-8.1 7.1-.4z"/></svg>', tourStage);
        tCur.setAttribute("aria-hidden", "true");
        var tCall = mk("pf-tour-call", "", tourStage);
        tCall.setAttribute("role", "status");
        var tAsk = mk("pf-tour-call pf-tour-ask", '<p class="pf-tour-call__title" id="pf-tour-ask-t">Обзор на паузе</p>' +
          '<p class="pf-tour-call__text">Хотите изучить интерфейс сами или досмотреть обзор?</p>' +
          '<div class="pf-tour-call__acts"><button type="button" class="btn btn-primary btn-sm" data-tour-take>Изучить самому</button>' +
          '<button type="button" class="btn btn-quiet btn-sm" data-tour-resume>Продолжить обзор</button></div>', tourStage);
        tAsk.setAttribute("role", "dialog");
        tAsk.setAttribute("aria-labelledby", "pf-tour-ask-t");
        var tBar = document.createElement("div");
        tBar.className = "pf-tour-bar";
        tBar.hidden = true;
        tBar.innerHTML = '<div class="pf-tour-bar__nav" role="group" aria-label="Шаги обзора">' +
          '<button type="button" class="pf-tour-step" data-tour-step="-1" title="Предыдущий шаг обзора"><svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6l-6 6 6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg><span>Назад</span></button>' +
          '<p class="pf-tour-bar__state"><span>Обзор интерфейса</span><span class="pf-tour-bar__count" aria-live="polite"></span></p>' +
          '<button type="button" class="pf-tour-step" data-tour-step="1" title="Следующий шаг обзора"><span>Далее</span><svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button></div>' +
          '<button type="button" class="btn btn-primary btn-sm" data-tour-take>Попробовать интерфейс самому</button>';
        var tPrevBtn = tBar.querySelector('[data-tour-step="-1"]'), tNext = tBar.querySelector('[data-tour-step="1"]');
        var tCount = tBar.querySelector(".pf-tour-bar__count");
        var capEl = tourFrame.querySelector(".pf-caption");
        var tReplay = document.createElement("button");
        tReplay.type = "button";
        tReplay.className = "pf-tour-replay";
        tReplay.textContent = "Смотреть обзор интерфейса";
        /* explore strip: whenever the tour is not running, the caption says plainly that the screen is live */
        var tExplore = document.createElement("p");
        tExplore.className = "pf-explore";
        tExplore.innerHTML = '<span class="pf-explore__badge"><svg width="16" height="16" viewBox="0 0 30 30" aria-hidden="true"><path d="M6 3.5v20.2l5.1-4.9 3.6 8.2 3.6-1.6-3.6-8.1 7.1-.4z"/></svg>Интерфейс кликабельный</span>' +
          '<span class="pf-explore__text">Нажимайте на&nbsp;машины и&nbsp;точки на&nbsp;карте, рейсы и&nbsp;вкладки.</span>';
        if (capEl) { capEl.appendChild(tExplore); capEl.appendChild(tReplay); capEl.appendChild(tBar); capEl.classList.add("has-explore"); } else { tWrap.appendChild(tBar); }

        /* hand-over hints: labelled rings on a few things worth clicking, gone after the first click or a few seconds */
        var tHints = mk("pf-hints", "", tourStage);
        tHints.setAttribute("aria-hidden", "true");
        var hintTimer = 0;
        var hideHints = function () {
          clearTimeout(hintTimer);
          if (tHints.hidden) { return; }
          tHints.classList.remove("is-on");
          setTimeout(function () { if (!tHints.classList.contains("is-on")) { tHints.hidden = true; tHints.innerHTML = ""; } }, 260);
        };
        var showHints = function () {
          var vr = pfView.getBoundingClientRect();
          var picks = [
            ["Машина", '.pf-map [data-pf-truck="714SH02"]'],
            ["Площадка", ".pf-mpin:not([hidden])"],
            ["Рейс", ".pf-trip"],
            ["Вкладка", '[data-pf-tab="schedule"]']
          ];
          var html = "", n = 0;
          picks.forEach(function (pk) {
            var el = pfView.querySelector(pk[1]);
            if (!el) { return; }
            var r = el.getBoundingClientRect();
            var cx = r.left + r.width / 2, cy = r.top + r.height / 2;
            if (!r.width || cx < vr.left + 8 || cx > vr.right - 8 || cy < vr.top + 8 || cy > vr.bottom - 8) { return; }
            var b = stageBox(el);
            var x = Math.round(b.x + b.w / 2), y = Math.round(b.y + b.h / 2);
            var left = false;
            html += '<span class="pf-hint-dot' + (left ? ' is-left' : '') + '" style="left:' + x + 'px;top:' + y + 'px;--i:' + (n++) + '"><span class="pf-hint-dot__ring"></span><span class="pf-hint-dot__label">' + pk[0] + '</span></span>';
          });
          if (!n) { return; }
          tHints.innerHTML = html;
          tHints.hidden = false;
          requestAnimationFrame(function () { tHints.classList.add("is-on"); });
          clearTimeout(hintTimer);
          hintTimer = setTimeout(hideHints, 7000);
        };
        pfView.addEventListener("pointerdown", function () { if (!T.on) { hideHints(); } });
        pfView.addEventListener("keydown", function () { if (!T.on) { hideHints(); } });
        window.addEventListener("resize", hideHints);

        /* geometry: stage px for the overlay, design px for the camera */
        var stageBox = function (el) {
          var s = tourStage.getBoundingClientRect(), r = el.getBoundingClientRect();
          return { x: r.left - s.left, y: r.top - s.top, w: r.width, h: r.height };
        };
        var designBox = function (el) {
          var sr = pfScr.getBoundingClientRect(), k = sr.width / pfScr.offsetWidth || 1, r = el.getBoundingClientRect();
          return { x: (r.left - sr.left) / k, y: (r.top - sr.top) / k, w: r.width / k, h: r.height / k };
        };
        var union = function (bs) {
          var x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
          bs.forEach(function (b) { x0 = Math.min(x0, b.x); y0 = Math.min(y0, b.y); x1 = Math.max(x1, b.x + b.w); y1 = Math.max(y1, b.y + b.h); });
          return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
        };
        var els = function (list) { return list.filter(function (e) { return e && e.getClientRects().length; }); };
        var vis = function (sel, root) {
          var all = (root || pfView).querySelectorAll(sel);
          for (var i = 0; i < all.length; i++) { if (all[i].offsetParent !== null && all[i].getClientRects().length && getComputedStyle(all[i]).visibility !== "hidden") { return all[i]; } }
          return null;
        };

        /* timing that honours pause and cancellation */
        var guard = function (tk) { if (tk !== T.token) { throw STOP; } };
        var sleep = function (ms, tk) {
          return new Promise(function (res, rej) {
            var left = ms, last = performance.now();
            var tick = function (now) {
              if (tk !== T.token) { rej(STOP); return; }
              if (!T.paused) { left -= now - last; }
              last = now;
              if (left <= 0) { res(); } else { requestAnimationFrame(tick); }
            };
            requestAnimationFrame(tick);
          });
        };
        var syncPause = function () {
          T.paused = !onScreen || document.hidden || T.held;
          if (T.anim) { if (T.paused) { T.anim.pause(); } else { T.anim.play(); } }
        };

        /* camera: zoom the scaled screen onto a design-px region, up to CAM_MAX, keeping the screen edge-to-edge */
        var CAM_MAX = 1.3, cam = { z: 1, cx: 800, cy: 490 };
        var applyCam = function () {
          var s = parseFloat(getComputedStyle(pfView).getPropertyValue("--pf-s")) || 1, W = pfScr.offsetWidth, H = pfScr.offsetHeight, z = cam.z;
          var ox = Math.max(0, Math.min(W - W / z, cam.cx - W / (2 * z))), oy = Math.max(0, Math.min(H - H / z, cam.cy - H / (2 * z)));
          pfScr.style.setProperty("--cam-z", String(z));
          pfScr.style.setProperty("--cam-tx", (-ox * s * z).toFixed(2) + "px");
          pfScr.style.setProperty("--cam-ty", (-oy * s * z).toFixed(2) + "px");
        };
        var camTo = function (targets, tk, zmax) {
          guard(tk);
          var W = pfScr.offsetWidth, H = pfScr.offsetHeight, z = 1, cx = W / 2, cy = H / 2;
          var list = targets ? els(targets) : [];
          if (list.length) {
            /* measure at the current camera, then convert to unzoomed design px */
            var b = union(list.map(designBox)), pad = 56;
            z = Math.max(1, Math.min(zmax || CAM_MAX, CAM_MAX, W / (b.w + pad * 2), H / (b.h + pad * 2)));
            cx = b.x + b.w / 2; cy = b.y + b.h / 2;
            /* designBox is relative to the zoomed screen's own (unscaled) box, so it is already in design px */
          }
          var moved = Math.abs(z - cam.z) > 0.01 || Math.hypot(cx - cam.cx, cy - cam.cy) > 4;
          cam.z = z; cam.cx = cx; cam.cy = cy;
          pfScr.classList.toggle("is-cam", !reduceTour);
          applyCam();
          return sleep(moved && !reduceTour ? CAM_MS : 0, tk);
        };
        var camReset = function (instant) {
          cam.z = 1; cam.cx = pfScr.offsetWidth / 2; cam.cy = pfScr.offsetHeight / 2;
          if (instant) { pfScr.classList.remove("is-cam"); }
          applyCam();
        };
        window.addEventListener("resize", function () { if (cam.z > 1) { applyCam(); } });

        /* spotlight: a rounded window over the stage, everything else dimmed */
        var spotOn = function (targets) {
          var list = els(targets || []);
          if (!list.length) { tSpot.classList.remove("is-on"); return; }
          var b = union(list.map(stageBox)), p = 8;
          tSpot.style.left = Math.round(b.x - p) + "px"; tSpot.style.top = Math.round(b.y - p) + "px";
          tSpot.style.width = Math.round(b.w + p * 2) + "px"; tSpot.style.height = Math.round(b.h + p * 2) + "px";
          tSpot.hidden = false;
          tSpot.classList.add("is-on");
        };
        var spotOff = function () { tSpot.classList.remove("is-on"); };

        /* acting on the real UI without stealing the visitor's focus or tripping the focus hand-over */
        var act = function (fn) {
          var before = document.activeElement;
          T.acting = true;
          try { fn(); } finally {
            var now = document.activeElement;
            if (now !== before && pfView.contains(now)) {
              if (before && before !== document.body && before.focus && !pfView.contains(before)) { before.focus({ preventScroll: true }); } else if (now.blur) { now.blur(); }
            }
            T.acting = false;
          }
        };
        var pos = { x: 600, y: 300 };
        var setCur = function (x, y) { pos.x = x; pos.y = y; tCur.style.transform = "translate(" + x + "px," + y + "px)"; };
        var moveTo = function (el, tk, ax, ay) {
          guard(tk);
          var b = stageBox(el), x = b.x + b.w * (ax === undefined ? 0.5 : ax), y = b.y + b.h * (ay === undefined ? 0.5 : ay);
          var d = Math.hypot(x - pos.x, y - pos.y);
          if (reduceTour || d < 2 || !tCur.animate) { setCur(x, y); return sleep(reduceTour ? 200 : 0, tk); }
          var a = tCur.animate([{ transform: "translate(" + pos.x + "px," + pos.y + "px)" }, { transform: "translate(" + x + "px," + y + "px)" }],
            { duration: Math.max(360, Math.min(900, 300 + d * 0.6)), easing: "cubic-bezier(.45, 0, .2, 1)", fill: "forwards" });
          T.anim = a;
          if (T.paused) { a.pause(); }
          return a.finished.then(function () { setCur(x, y); a.cancel(); T.anim = null; guard(tk); }, function () { throw STOP; });
        };
        var ring = function () { if (reduceTour) { return; } tCur.classList.remove("is-click"); void tCur.offsetWidth; tCur.classList.add("is-click"); };
        var click = function (el, tk) { guard(tk); ring(); act(function () { el.click(); }); return sleep(320, tk); };
        var ptr = function (el, type, bubbles) {
          var ev;
          try { ev = new PointerEvent(type, { bubbles: bubbles, cancelable: true, pointerType: "mouse", relatedTarget: null }); }
          catch (e) { ev = new MouseEvent(type.replace("pointer", "mouse"), { bubbles: bubbles }); }
          el.dispatchEvent(ev);
        };
        var hover = function (el, tk) {
          guard(tk);
          act(function () { el.classList.add("is-th"); T.hovered.push(el); ptr(el, "pointerover", true); ptr(el, "pointerenter", false); });
          return sleep(150, tk);
        };
        var unhover = function (el) {
          if (!el) { return; }
          el.classList.remove("is-th");
          T.hovered = T.hovered.filter(function (x) { return x !== el; });
          ptr(el, "pointerout", true); ptr(el, "pointerleave", false);
        };
        var clearHovers = function () {
          T.hovered.slice().forEach(unhover);
          var ng = pfView.querySelector(".rc-sidenav__groups");
          if (ng) { ptr(ng, "pointerleave", false); }
        };

        /* narration callout: beside its anchor (stage px) where there is room, else above / below; centred without one */
        var place = function (box, w, h, side) {
          var W = tourStage.offsetWidth, H = tourStage.offsetHeight, g = 22, x, y;
          if (!box) { return { x: (W - w) / 2, y: (H - h) / 2 }; }
          var cy = box.y + box.h / 2;
          var fits = { right: box.x + box.w + g + w <= W - 12, left: box.x - g - w >= 12, below: box.y + box.h + g + h <= H - 12, above: box.y - g - h >= 12 };
          var order = (side ? [side] : []).concat(["right", "left", "below", "above"]);
          var pick = order.filter(function (s) { return fits[s]; })[0];
          if (!pick) { return { x: W - w - 16, y: H - h - 16 }; }
          if (pick === "right" || pick === "left") { x = pick === "right" ? box.x + box.w + g : box.x - g - w; y = cy - h / 2; }
          else { x = box.x + box.w / 2 - w / 2; y = pick === "below" ? box.y + box.h + g : box.y - g - h; }
          return { x: Math.max(12, Math.min(W - w - 12, x)), y: Math.max(12, Math.min(H - h - 12, y)) };
        };
        var say = function (n, title, text, anchor, side) {
          tCall.className = "pf-tour-call" + (anchor === null ? " is-final" : "");
          tCall.innerHTML = (n ? '<p class="pf-tour-call__step">' + n + " из " + STEPS.length + "</p>" : "") +
            '<p class="pf-tour-call__title">' + title + '</p><p class="pf-tour-call__text">' + text + "</p>" +
            (anchor === null ? '<div class="pf-tour-call__acts"><button type="button" class="btn btn-primary btn-sm" data-tour-take>Попробовать интерфейс самому</button>' +
              '<button type="button" class="btn btn-quiet btn-sm" data-tour-replay>Посмотреть ещё раз</button></div>' : "");
          tCall.hidden = false;
          tCall.classList.remove("is-on");
          var box = anchor ? (anchor.nodeType ? stageBox(anchor) : anchor) : null;
          var at = place(box, tCall.offsetWidth, tCall.offsetHeight, side);
          tCall.style.left = Math.round(at.x) + "px"; tCall.style.top = Math.round(at.y) + "px";
          void tCall.offsetWidth;
          tCall.classList.add("is-on");
          if (n) { tCount.textContent = n + " / " + STEPS.length; }
        };
        var hush = function () { tCall.classList.remove("is-on"); tCall.hidden = true; };
        var readFor = function (text) { return Math.max(2400, Math.min(4800, 1100 + text.length * 26)); };
        /* spotlight + callout over the same set of elements */
        var show = function (s, targets, side, tk, extra) {
          spotOn(targets);
          say(s.n, s.t, s.d, union(els(targets).map(stageBox)), side);
          return sleep(readFor(s.d) + (extra || 0), tk);
        };

        var siteWithProof = function () {
          var map = vis(".pf-map"), mb = map && map.getBoundingClientRect(), best = null;
          Array.prototype.forEach.call(pfView.querySelectorAll("[data-pf-site]"), function (b) {
            if (best) { return; }
            var s = PF.sites[+b.getAttribute("data-pf-site")], r = b.getBoundingClientRect();
            var inside = mb && r.left > mb.left + mb.width * 0.2 && r.right < mb.right - mb.width * 0.12 && r.top > mb.top + mb.height * 0.2 && r.bottom < mb.bottom - mb.height * 0.12;
            if (inside && s.jobs.some(function (j) { return j.proof; })) { best = b; }
          });
          return best || vis("[data-pf-site]");
        };
        var splitShift = function () {
          var row = vis("[data-pf-gbody='truck'] [data-pf-jobs][data-pf-plate='382BHR02']");
          var g = row && row.closest(".pf-grow");
          return (g && g.querySelector(".pf-gshift")) || vis("[data-pf-gbody='truck'] .pf-gshift");
        };
        /* bring a Gantt row into its scroll box before the camera aims at it */
        var reveal = function (el) {
          var box = el && el.closest(".pf-gbody");
          if (!box) { return; }
          var br = box.getBoundingClientRect(), er = el.getBoundingClientRect(), k = br.height / box.clientHeight || 1;
          if (er.top < br.top + 8 || er.bottom > br.bottom - 8) { box.scrollTop += (er.top - br.top) / k - box.clientHeight / 2 + (er.height / k) / 2; }
        };
        var thenAll = function (tk, fns) { return fns.reduce(function (c, f) { return c.then(function () { guard(tk); return f(); }); }, Promise.resolve()); };

        /* the step script */
        var STEPS = [
          { t: "Вся работа МВО в одной системе", d: "14 разделов Платформы: от заданий и маршрутов до весовой, колл-центра и аналитики. Пройдёмся по каждому.",
            go: function (tk, s) {
              var items = Array.prototype.filter.call(pfView.querySelectorAll("[data-pf-nav]"), function (x) { return x.offsetParent !== null; });
              var nav = vis(".rc-sidenav"), prev = null;
              var steps = [
                function () { return camTo(items.slice(0, 5), tk, 1.9); },
                function () { return moveTo(items[0], tk, 0.35, 0.5); },
              ];
              items.forEach(function (it, i) {
                steps.push(function () {
                  /* camera follows down the list: the item, its card and a little context */
                  var b = stageBox(it), H = tourStage.offsetHeight;
                  var inView = b.y > 40 && b.y + b.h < H - 40;
                  var near = items.slice(Math.max(0, i - 1), i + 5);
                  return (inView ? Promise.resolve() : camTo(near, tk, 1.9)).then(function () { return moveTo(it, tk, 0.35, 0.5); });
                });
                steps.push(function () { if (prev) { unhover(prev); } prev = it; return hover(it, tk); });
                steps.push(function () {
                  var card = vis("#pf-navcard");
                  spotOn([it, card]);
                  if (!i) { say(s.n, s.t, s.d, union(els([it, card]).map(stageBox)), "right"); return sleep(readFor(s.d), tk); }
                  if (i === 1) { hush(); }
                  var txt = PF.nav[it.getAttribute("data-pf-nav")] || "";
                  return sleep(Math.max(1300, Math.min(2100, 600 + txt.length * 13)), tk);
                });
              });
              steps.push(function () { clearHovers(); spotOff(); hush(); return sleep(200, tk); });
              return thenAll(tk, steps);
            } },
          { t: "Карта заданий за день", d: "Каждая площадка — пин со статусом: неназначено, назначено, машина в пути, выполнено, невывоз. Весь город на одном экране.",
            go: function (tk, s) {
              var map = vis(".pf-map"), pin = siteWithProof();
              return thenAll(tk, [
                function () { return camTo([map], tk, 1.5); },
                function () { return moveTo(pin, tk); },
                function () { return hover(pin, tk); },
                function () { return show(s, [map], "below", tk); },
                function () { unhover(pin); },
              ]);
            } },
          { t: "Карточка площадки", d: "Контейнерные группы, заказчики и все задания площадки на сегодня — с фото-отчётом по каждому вывозу.",
            go: function (tk, s) {
              var pin = siteWithProof();
              return thenAll(tk, [
                function () { spotOff(); hush(); return click(pin, tk); },
                function () { return camTo([vis(".pf-side")], tk, 2); },
                function () { return show(s, [vis(".pf-side")], "left", tk); },
              ]);
            } },
          { t: "Фото до и после вывоза", d: "Водитель снимает площадку в DriverApp до и после вывоза. Диспетчер видит заполненность каждого контейнера и подтверждает работу.",
            go: function (tk, s) {
              var ph = vis("[data-pf-photo]");
              return thenAll(tk, [
                function () { spotOff(); hush(); return moveTo(ph, tk); },
                function () { return click(ph, tk); },
                function () { return camTo(null, tk); },
                function () { return camTo([vis(".pf-pm__fill"), vis(".pf-pm__photos")], tk, 2); },
                function () { return show(s, [vis(".pf-pm__fill"), vis(".pf-pm__photos")], "below", tk); },
                function () { spotOff(); hush(); return camTo(null, tk); },
                function () { var ok = vis("[data-pf-pcheck='ok']"); return moveTo(ok, tk).then(function () { return click(ok, tk); }); },
                function () { spotOn([vis(".pf-pm__check")]); return sleep(1100, tk); },
                function () { spotOff(); var c = vis("[data-pf-pclose]"); return moveTo(c, tk).then(function () { return click(c, tk); }); },
              ]);
            } },
          { t: "Машина на линии", d: "Экипаж, рейсы смены и маршрут на карте: пройденный путь по GPS и оставшиеся точки.",
            go: function (tk, s) {
              var tr = vis('[data-pf-truck="714SH02"]');
              return thenAll(tk, [
                function () { return moveTo(tr, tk); },
                function () { return click(tr, tk); },
                function () { return show(s, [vis(".pf-side"), vis(".pf-route.is-on") ? routeBox() : tr], "below", tk); },
              ]);
            } },
          { t: "Пробег и топливо", d: "Пробег считается по GPS-данным из Wialon, расход и остаток топлива — по датчику уровня топлива (ДУТ).",
            go: function (tk, s) {
              var m = vis('[data-pf-metric="fuel"]');
              return thenAll(tk, [
                function () { spotOff(); hush(); return camTo([vis(".pf-metrics")], tk, 2); },
                function () { return moveTo(m, tk, 0.4, 0.5); },
                function () { return hover(m, tk); },
                function () { return show(s, [vis(".pf-metrics"), ctipEl()], "left", tk); },
                function () { unhover(m); spotOff(); },
              ]);
            } },
          { t: "Карточка маршрута", d: "Точки рейса по порядку, статус и фото каждого задания, трек машины и данные весовой — в одном окне.",
            go: function (tk, s) {
              var trip = vis("[data-pf-rmodal]");
              return thenAll(tk, [
                function () { hush(); return camTo([trip], tk, 2); },
                function () { return moveTo(trip, tk, 0.3, 0.5); },
                function () { return click(trip, tk); },
                function () { return camTo(null, tk); },
                function () { return show(s, [vis(".pf-rm__card")], "right", tk, -600); },
                function () { hush(); return camTo([vis(".pf-rm__jobs")], tk, 2); },
                function () { var job = vis(".pf-rm__job"); return moveTo(job, tk, 0.35, 0.5).then(function () { return hover(job, tk); }); },
                function () { spotOn([vis(".pf-rm__jobs")]); return sleep(2200, tk); },
                function () { clearHovers(); spotOff(); return camTo([vis(".pf-rm__map")], tk, 2); },
                function () { spotOn([vis(".pf-rm__map")]); return sleep(1800, tk); },
                function () { spotOff(); return camTo(null, tk); },
                function () { var nx = vis('[data-pf-rstep="1"]'); return moveTo(nx, tk).then(function () { return click(nx, tk); }); },
                function () { return sleep(1100, tk); },
                function () { var c = vis("[data-pf-rclose]"); return moveTo(c, tk).then(function () { return click(c, tk); }); },
              ]);
            } },
          { t: "Расписание маршрутов", d: "Рейсы всех машин на шкале дня: выполненные, текущие и назначенные. Цвет — статус рейса.",
            go: function (tk, s) {
              var tab = vis('[data-pf-tab="schedule"]');
              return thenAll(tk, [
                function () { return moveTo(tab, tk); },
                function () { return click(tab, tk); },
                function () { return show(s, [vis(".pf-status")], "above", tk); },
              ]);
            } },
          { t: "Смены и экипажи", d: "Рейсы одной смены объединены: наведите — увидите номер смены и водителя. Если машина сменила экипаж, смен будет две.",
            go: function (tk, s) {
              var sh = splitShift(), bar = sh.querySelector("[data-pf-route]"), row = sh.closest(".pf-grow");
              return thenAll(tk, [
                function () { spotOff(); hush(); reveal(row); return camTo([row], tk, 2); },
                function () { return moveTo(bar, tk, 0.35, 0.5); },
                function () { return hover(sh, tk); },
                function () { return show(s, [row, sh.querySelector(".pf-gtip")], "below", tk); },
                function () { unhover(sh); },
              ]);
            } },
          { t: "Сигнал от экипажа", d: "Водитель сообщил о ДТП. Проблема появляется прямо на графике, а реакция — в одно нажатие: связаться с экипажем.",
            go: function (tk, s) {
              var al = vis("[data-pf-gbody='truck'] .pf-galert"), btn = al.querySelector(".pf-galert__btn"), row = al.closest(".pf-grow");
              return thenAll(tk, [
                function () { spotOff(); hush(); reveal(row); return camTo(null, tk); },
                function () { return moveTo(btn, tk); },
                function () { return hover(al, tk); },
                function () { return sleep(200, tk); },
                function () { return camTo([al.querySelector(".pf-gcard"), al.closest(".pf-gtruck")], tk, 2); },
                function () { return show(s, [al.querySelector(".pf-gcard"), al.closest(".pf-gtruck")], "right", tk); },
                function () { hush(); var cta = al.querySelector(".pf-gcard .rc-btn"); return moveTo(cta, tk).then(function () { return click(cta, tk); }); },
                function () { unhover(al); spotOff(); return camTo(null, tk); },
                function () { spotOn([vis(".pf-side")]); return sleep(1300, tk); },
                function () { spotOff(); },
              ]);
            } },
          { t: "Предложение AI-диспетчера", d: "AI предлагает следующий рейс с учётом площадок, типа отходов и подходящей машины. Решение остаётся за диспетчером.",
            go: function (tk, s) {
              var ai = vis("[data-pf-gbody='truck'] .pf-gbar--ai");
              return thenAll(tk, [
                function () { reveal(ai); return camTo([ai], tk, 2); },
                function () { return moveTo(ai, tk, 0.3, 0.5); },
                function () { return click(ai, tk); },
                function () { spotOn([ai]); return sleep(700, tk); },
                function () { return camTo(null, tk); },
                function () { return show(s, [ai, vis(".pf-side")], "left", tk); },
              ]);
            } },
          { t: "По машинам или по водителям", d: "Один переключатель — и график строится по водителям: видно, кто и на какой машине работает смену.",
            go: function (tk, s) {
              var tg = vis("[data-pf-gview='driver']");
              return thenAll(tk, [
                function () { spotOff(); hush(); return camTo([vis(".pf-status__tools--schedule .pf-iseg")], tk, 2); },
                function () { return moveTo(tg, tk); },
                function () { return click(tg, tk); },
                function () { return camTo(null, tk); },
                function () {
                  var dc = vis("[data-pf-gbody='driver'] [data-pf-plate='Ахметжанов Нурбол']"), sh = (dc && dc.closest(".pf-grow").querySelector(".pf-gshift")) || vis("[data-pf-gbody='driver'] .pf-gshift");
                  reveal(sh);
                  return moveTo(sh.querySelector("[data-pf-route]"), tk, 0.3, 0.5).then(function () { return hover(sh, tk); });
                },
                function () { return show(s, [vis(".pf-status")], "above", tk); },
                function () { clearHovers(); spotOff(); },
              ]);
            } },
        ];
        STEPS.forEach(function (s, i) { s.n = i + 1; });
        var routeBox = function () { var svg = vis(".pf-route.is-on"); return svg ? svg.querySelector(".pf-route__plan") : null; };
        var ctipEl = function () { var c = pfScr.querySelectorAll(".pf-ctip"); for (var i = 0; i < c.length; i++) { if (!c[i].hidden) { return c[i]; } } return null; };

        /* default state the tour starts and replays from */
        var closeModals = function () {
          Array.prototype.forEach.call(pfScr.querySelectorAll(".pf-pm:not([hidden])"), function (m) {
            var c = m.querySelector("[data-pf-pclose], [data-pf-rclose]"); if (c) { c.click(); }
          });
        };
        var resetUI = function () {
          act(function () {
            clearHovers(); closeModals();
            var st = pfView.querySelector('[data-pf-tab="status"]'); if (st && st.getAttribute("aria-selected") !== "true") { st.click(); }
            var tv = pfView.querySelector("[data-pf-gview='truck']"); if (tv && tv.getAttribute("aria-pressed") !== "true") { tv.click(); }
            var tr = pfView.querySelector('[data-pf-truck="714SH02"]'); if (tr) { tr.click(); }
            Array.prototype.forEach.call(pfView.querySelectorAll(".pf-gbody"), function (g) { g.scrollTop = 0; });
          });
        };
        var chrome = function (on) {
          T.on = on;
          tBar.hidden = !on; tShield.hidden = !on; tCur.hidden = !on; tSpot.hidden = !on;
          tReplay.hidden = on; tExplore.hidden = on;
          if (on) { hideHints(); }
          tWrap.classList.toggle("is-touring", on);
          if (capEl) { capEl.classList.toggle("is-touring", on); }
          if (on) { pfScr.setAttribute("aria-hidden", "true"); } else { pfScr.removeAttribute("aria-hidden"); }
          pfView.dispatchEvent(new CustomEvent("pf:tour", { detail: on }));
        };
        var finish = function () {
          chrome(false);
          camReset(false);
          tVeil.hidden = false;
          say(0, "Это лишь часть Платформы", "Теперь попробуйте сами: кликайте по карте, машинам, рейсам и значкам — каждое действие сопровождается подсказкой.", null);
          var take = tCall.querySelector("[data-tour-take]");
          if (take) { take.focus({ preventScroll: true }); }
        };
        /* what the interface must show before step k (0-based) when the tour jumps there */
        var prep = function (k) {
          act(function () {
            if (k === 3) { var pin = siteWithProof(); if (pin) { pin.click(); } }
            if (k >= 8) { var tab = pfView.querySelector('[data-pf-tab="schedule"]'); if (tab) { tab.click(); } }
          });
        };
        var tourMark = function (k) {
          T.idx = k;
          tCount.textContent = (k + 1) + " / " + STEPS.length;
          tPrevBtn.disabled = k <= 0;
          tNext.disabled = false;
        };
        var start = function (from) {
          var k0 = Math.max(0, Math.min(STEPS.length - 1, from || 0)), jump = !!from;
          var tk = ++T.token;
          if (T.anim) { try { T.anim.cancel(); } catch (e) { /* done */ } T.anim = null; }
          T.seen = true; T.held = false; tAsk.hidden = true; tVeil.hidden = true; tCall.classList.remove("is-dim");
          act(function () { clearHovers(); });
          hush(); spotOff(); camReset(!jump); resetUI(); prep(k0); chrome(true); syncPause();
          if (!jump) { setCur(Math.round(tourStage.offsetWidth * 0.55), Math.round(tourStage.offsetHeight * 0.55)); }
          tourMark(k0);
          var chain = sleep(jump ? 250 : 400, tk);
          STEPS.slice(k0).forEach(function (s, i) {
            chain = chain.then(function () { guard(tk); tourMark(k0 + i); return s.go(tk, s); }).then(function () { guard(tk); return sleep(300, tk); });
          });
          chain.then(function () { clearHovers(); hush(); spotOff(); return sleep(250, tk); })
            .then(function () { finish(); }, function (e) { if (e !== STOP && window.console) { console.error(e); } });
        };
        var stop = function () {
          T.token++;
          if (T.anim) { try { T.anim.cancel(); } catch (e) { /* done */ } T.anim = null; }
          T.held = false; tAsk.hidden = true; tVeil.hidden = true;
          act(function () { clearHovers(); closeModals(); });
          hush(); spotOff(); camReset(false); chrome(false); syncPause();
        };
        var takeControl = function () {
          stop();
          setTimeout(showHints, 760);
          var first = pfView.querySelector('[data-pf-tab][aria-selected="true"]');
          if (first) { first.focus({ preventScroll: true }); }
        };
        /* a click on the screen pauses and asks */
        var hold = function () {
          if (!T.on || T.held) { return; }
          T.held = true; syncPause();
          tCall.classList.add("is-dim");
          tVeil.hidden = false;
          tAsk.hidden = false;
          var w = tAsk.offsetWidth, h = tAsk.offsetHeight;
          tAsk.style.left = Math.round((tourStage.offsetWidth - w) / 2) + "px"; tAsk.style.top = Math.round((tourStage.offsetHeight - h) / 2) + "px";
          tAsk.classList.add("is-on");
          tAsk.querySelector("[data-tour-resume]").focus({ preventScroll: true });
        };
        var resume = function () {
          T.held = false; tAsk.hidden = true; tVeil.hidden = true; tAsk.classList.remove("is-on"); tCall.classList.remove("is-dim"); syncPause();
          var b = tBar.querySelector("[data-tour-take]"); if (b) { b.focus({ preventScroll: true }); }
        };

        tourFrame.addEventListener("click", function (e) {
          if (e.target.closest("[data-tour-take]")) { takeControl(); return; }
          if (e.target.closest("[data-tour-resume]")) { resume(); return; }
          if (e.target.closest("[data-tour-replay]")) { hush(); start(); }
        });
        tReplay.addEventListener("click", function () { start(); });
        /* step back / forward: restart the script at the neighbouring step; past the last one comes the invite */
        tBar.addEventListener("click", function (e) {
          var b = e.target.closest("[data-tour-step]");
          if (!b || b.disabled || !T.on) { return; }
          var k = (T.idx || 0) + (+b.getAttribute("data-tour-step"));
          if (k >= STEPS.length) { stopToInvite(); return; }
          start(Math.max(0, k));
          b.focus({ preventScroll: true });
        });
        var stopToInvite = function () {
          T.token++;
          if (T.anim) { try { T.anim.cancel(); } catch (e) { /* done */ } T.anim = null; }
          T.held = false; tAsk.hidden = true;
          act(function () { clearHovers(); closeModals(); });
          hush(); spotOff(); finish();
        };
        tShield.addEventListener("pointerdown", function (e) { e.preventDefault(); hold(); });
        tVeil.addEventListener("click", function () { if (T.held) { resume(); } else { takeControl(); } });
        pfScr.addEventListener("focusin", function (e) { if (T.on && !T.acting) { stop(); } });
        document.addEventListener("keydown", function (e) {
          if (e.key !== "Escape") { return; }
          if (T.held) { resume(); return; }
          if (T.on) { takeControl(); }
        });

        /* pause offscreen and in a hidden tab; start once on first view */
        var onScreen = false;
        document.addEventListener("visibilitychange", syncPause);
        var autoOK = function () { return !reduceTour && !pfView.classList.contains("is-pan"); };
        if ("IntersectionObserver" in window) {
          new IntersectionObserver(function (es) {
            var e0 = es[0];
            onScreen = e0.isIntersecting && e0.intersectionRatio >= 0.35;
            /* "on the interface": most of the screen visible, or it fills most of the window */
            var onIt = e0.isIntersecting && (e0.intersectionRatio >= 0.8 || e0.intersectionRect.height >= window.innerHeight * 0.7);
            syncPause();
            if (onIt && !T.seen && autoOK()) {
              T.seen = true;
              setTimeout(function () { if (onScreen && !T.on) { start(); } }, 500);
            }
          }, { threshold: [0, 0.35, 0.5, 0.6, 0.7, 0.8, 0.9, 1] }).observe(pfView);
        } else { onScreen = true; }
      }
    }
  }
})();
