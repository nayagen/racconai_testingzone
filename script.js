// RaccoonAI landing page behavior.
// Everything here is an enhancement: without JavaScript the page shows the final state and the form posts normally.

(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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
  themeToggles.forEach(function (b) {
    b.addEventListener("click", function () {
      var next = isDark() ? "light" : "dark";
      root.classList.add("theme-anim");
      root.setAttribute("data-theme", next);
      try { window.localStorage.setItem(THEME_KEY, next); } catch (e) { /* private mode: the pick lasts for this page */ }
      applyTheme();
      window.setTimeout(function () { root.classList.remove("theme-anim"); }, 400);
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

  fleetSwitch.addEventListener("click", function () {
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

  /* ---------- DriverApp: the capability list switches the phone screen ---------- */
  var drvTabs = Array.prototype.slice.call(document.querySelectorAll('.drv-tabs [role="tab"]'));
  function selectDrvTab(tab, focus) {
    drvTabs.forEach(function (t) {
      var on = t === tab;
      t.setAttribute("aria-selected", String(on));
      t.tabIndex = on ? 0 : -1;
      document.getElementById(t.getAttribute("aria-controls")).hidden = !on;
    });
    if (drvPhoto) { drvPhoto.classList.remove("is-after"); }
    if (focus) { tab.focus(); }
  }
  var drvPhoto = document.getElementById("drv-p2");

  // Autoplay: every screen holds 5 s, in order. The photo tab has two screens ("Фотографии ДО", then the
  // finished task once the after photo is uploaded), so it holds 10 s. Starts from the first screen each time
  // the block scrolls into view; pauses only while the keyboard is in the list; off when reduced motion is on.
  var DRV_HOLD = 5000;
  var drvStage = document.querySelector(".drv-stage");
  var drvTabList = document.querySelector(".drv-tabs");
  var drvAuto = { on: false, i: 0, sub: 0, timer: null, left: 0, since: 0, paused: false };
  function drvScreens(i) { return drvTabs[i].getAttribute("aria-controls") === "drv-p2" ? 2 : 1; }
  function drvProgress(i, ms, total) {
    drvTabs.forEach(function (t, k) {
      t.classList.toggle("is-auto", drvAuto.on && k === i);
      if (k === i) {
        t.style.setProperty("--auto-total", total + "ms");
        t.style.setProperty("--auto-left", ms + "ms");
        t.style.setProperty("--auto-from", String(1 - ms / total));
        t.classList.remove("is-running");
        void t.offsetWidth; // restart the bar's transition
        if (!drvAuto.paused) { t.classList.add("is-running"); }
      }
    });
  }
  function drvArm(ms) {
    window.clearTimeout(drvAuto.timer);
    drvAuto.left = ms;
    drvAuto.since = Date.now();
    if (!drvAuto.paused) { drvAuto.timer = window.setTimeout(drvNext, ms); }
  }
  function drvShow(i, sub) {
    drvAuto.i = i;
    drvAuto.sub = sub;
    if (sub === 0) { selectDrvTab(drvTabs[i]); }
    if (drvPhoto) { drvPhoto.classList.toggle("is-after", sub === 1); }
    var total = drvScreens(i) * DRV_HOLD;
    var left = total - sub * DRV_HOLD;
    drvProgress(i, left, total);
    drvArm(DRV_HOLD);
  }
  function drvNext() {
    if (drvAuto.sub + 1 < drvScreens(drvAuto.i)) { drvShow(drvAuto.i, drvAuto.sub + 1); }
    else { drvShow((drvAuto.i + 1) % drvTabs.length, 0); }
  }
  function drvStart() { drvAuto.on = true; drvAuto.paused = false; drvShow(0, 0); }
  function drvStop() {
    drvAuto.on = false;
    window.clearTimeout(drvAuto.timer);
    drvTabs.forEach(function (t) { t.classList.remove("is-auto", "is-running"); });
  }
  function drvPause(p) {
    if (!drvAuto.on || drvAuto.paused === p) { return; }
    drvAuto.paused = p;
    var t = drvTabs[drvAuto.i];
    if (p) {
      window.clearTimeout(drvAuto.timer);
      drvAuto.left = Math.max(0, drvAuto.left - (Date.now() - drvAuto.since));
      var total = drvScreens(drvAuto.i) * DRV_HOLD;
      var shown = total - ((drvScreens(drvAuto.i) - 1 - drvAuto.sub) * DRV_HOLD + drvAuto.left);
      t.style.setProperty("--auto-from", String(shown / total));
      t.classList.remove("is-running");
    } else {
      var totalR = drvScreens(drvAuto.i) * DRV_HOLD;
      var leftAll = (drvScreens(drvAuto.i) - 1 - drvAuto.sub) * DRV_HOLD + drvAuto.left;
      t.style.setProperty("--auto-left", leftAll + "ms");
      t.style.setProperty("--auto-from", String(1 - leftAll / totalR));
      void t.offsetWidth;
      t.classList.add("is-running");
      drvArm(drvAuto.left);
    }
  }

  drvTabs.forEach(function (tab, i) {
    tab.addEventListener("click", function () {
      if (drvAuto.on) { drvShow(i, 0); } else { selectDrvTab(tab); }
    });
    tab.addEventListener("keydown", function (e) {
      var k = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
      var n = e.key === "Home" ? 0 : e.key === "End" ? drvTabs.length - 1 : k ? (i + k + drvTabs.length) % drvTabs.length : -1;
      if (n < 0) { return; }
      e.preventDefault();
      if (drvAuto.on) { drvShow(n, 0); drvPause(true); }
      selectDrvTab(drvTabs[n], true);
    });
  });

  if (drvStage && drvTabs.length && !reduceMotion && "IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) { if (!drvAuto.on) { drvStart(); } } else if (drvAuto.on) { drvStop(); }
    }, { threshold: 0.35 }).observe(drvStage);
    // Only keyboard focus in the list pauses; a resting mouse cursor must not freeze the autoplay.
    drvTabList.addEventListener("focusin", function (e) { if (e.target.matches(":focus-visible")) { drvPause(true); } });
    drvTabList.addEventListener("focusout", function (e) { if (!drvTabList.contains(e.relatedTarget)) { drvPause(false); } });
  }

  /* ---------- DriverApp, one stop: the steps cascade in once, then stay; only the highlight moves from step to step ---------- */
  var flow = document.getElementById("flow");
  if (flow && !reduceMotion && "IntersectionObserver" in window) {
    var flowSteps = Array.prototype.slice.call(flow.querySelectorAll(".flow-step"));
    var FLOW_STEP = 2200, FLOW_DWELL = 3200;
    var flowTimers = [], flowPlayed = false, flowCur = 0;
    var flowAt = function (ms, fn) { flowTimers.push(window.setTimeout(fn, ms)); };
    var flowStop = function () { flowTimers.forEach(window.clearTimeout); flowTimers = []; };
    var flowShow = function (n) { flowSteps.forEach(function (li, i) { li.classList.toggle("is-shown", i < n); }); };
    var flowMark = function (c) { flowCur = c; flowSteps.forEach(function (li, i) { li.classList.toggle("is-current", i === c); }); };
    var flowLoop = function () {
      flowStop();
      flow.classList.add("is-looping");
      (function next() {
        flowAt(FLOW_DWELL, function () {
          if (flowCur >= flowSteps.length - 1) { flow.classList.remove("is-looping"); flowMark(-1); return; }
          flowMark(flowCur + 1); next();
        });
      })();
    };
    var flowIntro = function () {
      flowStop();
      flowShow(0);
      flowMark(-1);
      flowSteps.forEach(function (_, i) { flowAt(300 + i * FLOW_STEP, function () { flowShow(i + 1); flowMark(i); }); });
      flowAt(300 + (flowSteps.length - 1) * FLOW_STEP, function () { flowPlayed = true; flowMark(0); flowLoop(); });
    };
    flow.classList.add("is-anim");
    flowShow(flowSteps.length); // fully visible until it scrolls into view
    new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) { if (!flowPlayed) { flowIntro(); } }
      else { flowStop(); flowShow(flowSteps.length); }
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

  /* ---------- Platform screen magnet ----------
     A manual scroll that comes to rest near the Platform screen glides on to the spot the «Посмотреть интерфейс» anchor lands on
     (the screen's top at the page's scroll-padding), so the whole screen is in view and its tour can start.
     One pull per approach: after a pull, or a stop inside the zone that needed none, it stays off until the screen has left the
     zone, so the reader can still nudge the page. It waits for a lifted finger, skips anchor jumps, and is off under reduced motion. */
  var magView = document.getElementById("pf-viewport");
  if (magView && !reduceMotion) {
    var magArmed = true, magSelf = false, magSkip = false, magTouch = false, magTimer = 0;
    var magEnd = "onscrollend" in window;
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
      window.scrollTo({ top: window.scrollY + d, behavior: "smooth" });
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

  /* ---------- Platform screen: scale the 1600px design to the frame; pan on narrow screens ---------- */
  var pfView = document.getElementById("pf-viewport");
  if (pfView) {
    /* The screen is always laid out at its full 1600 x 980 design size and scaled as a whole, like browser zoom, so text,
       spacing and icons shrink together. The scale fits the frame width and the window height below the sticky header
       (the caption row takes 62px), but never drops below 0.8 to fit the height: below that the screen runs past the
       fold and the page scrolls. The frame narrows to the scaled width (--pf-fit) and stays centred. */
    var PF_W = 1600, PF_MIN = 0.5, PF_PAN = 0.72, PF_H = 980, PF_HFLOOR = 0.8, pfPanned = false;
    var pfHeader = document.querySelector(".site-header");
    var pfFrame = pfView.closest(".pf-frame");
    var fitPlatform = function () {
      var w = pfFrame.clientWidth;
      if (!w) { return; }
      var sW = w / PF_W;
      var avail = window.innerHeight - (pfHeader ? pfHeader.offsetHeight : 0) - 32 - 62;
      var sH = Math.max(PF_HFLOOR, avail / PF_H);
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
        drawRoute = function (el) {
          var r = el && el.hasAttribute("data-pf-truck") ? ROUTE_PATHS[el.getAttribute("data-pf-truck")] : null;
          svg.classList.toggle("is-on", !!r);
          if (!r) { return; }
          pPast.setAttribute("d", r.past);
          pCase.setAttribute("d", r.plan);
          pPlan.setAttribute("d", r.plan);
        };
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

      /* Roving focus inside the pin group and the Gantt: one tab stop each, arrows move */
      Array.prototype.forEach.call(pfView.querySelectorAll("[data-pf-roving]"), function (group) {
        var items = Array.prototype.filter.call(group.querySelectorAll("button"), function (x) { return !x.closest(".pf-gcard"); });
        group.addEventListener("keydown", function (e) {
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
          if (!b || items.indexOf(b) < 0) { return; }
          items.forEach(function (x) { x.tabIndex = x === b ? 0 : -1; });
        });
      });


      /* ---------- Auto tour: the default way the dashboard presents itself ----------
         A drawn cursor walks the real interface (the same clicks and hover cards a visitor gets) with a narration callout per step.
         A camera zooms in (up to 2x) on each feature the first time it appears, and a spotlight dims everything else.
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
          for (var i = 0; i < all.length; i++) { if (all[i].offsetParent !== null && all[i].getClientRects().length) { return all[i]; } }
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

        /* camera: zoom the scaled screen onto a design-px region, up to 2x, keeping the screen edge-to-edge */
        var cam = { z: 1, cx: 800, cy: 490 };
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
            z = Math.max(1, Math.min(zmax || 2, W / (b.w + pad * 2), H / (b.h + pad * 2)));
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
