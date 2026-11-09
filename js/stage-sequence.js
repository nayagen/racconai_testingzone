// RaccoonAI page script: AI-dispatcher stage: the signature sequence (index.html).
// One feature per file, so an error here cannot stop the others; js/core.js loads first and shares window.Raccoon.

(function (R) {
  "use strict";
  if (!R) { return; }
  var reduceMotion = R.reduceMotion, observeWhenShown = R.observeWhenShown;

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
    /* Each leg is sampled once (1 point per px of length) and cached; SVG geometry queries inside the frame loop would
       force a layout on every frame. */
    var legPts = new WeakMap();
    function legSamples(path) {
      var pts = legPts.get(path);
      if (!pts) {
        var len = path.getTotalLength(), n = Math.max(2, Math.ceil(len));
        pts = [];
        for (var i = 0; i <= n; i++) { var q = path.getPointAtLength(len * i / n); pts.push([q.x, q.y]); }
        legPts.set(path, pts);
      }
      return pts;
    }
    function placeTruck(path, t) {
      var pts = legSamples(path), n = pts.length - 1;
      var f = t * n, i = Math.min(n - 1, Math.floor(f)), u = f - i;
      var x = pts[i][0] + (pts[i + 1][0] - pts[i][0]) * u, y = pts[i][1] + (pts[i + 1][1] - pts[i][1]) * u;
      var a0 = pts[Math.min(i, n - 2)], a1 = pts[Math.min(i + 2, n)]; // heading over ~2px, as before
      var a = Math.atan2(a1[1] - a0[1], a1[0] - a0[0]) * 180 / Math.PI;
      truck.setAttribute("transform", "translate(" + x.toFixed(1) + " " + y.toFixed(1) + ") rotate(" + a.toFixed(1) + ")");
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
      /* Runs only while the stage is on screen and the tab is shown: in a background tab the timers are throttled while
         requestAnimationFrame stops, so the truck and the steps would come back out of step with each other. */
      var seqSync = function () {
        var run = stageVisible && !paused && !document.hidden;
        if (run && !playing) {
          playing = true;
          playSequence();
        } else if (!run && playing) {
          playing = false;
          timers.forEach(window.clearTimeout);
          timers = [];
          stopDriving();
        }
      };
      observeWhenShown(new IntersectionObserver(function (entries) {
        stageVisible = entries[0].isIntersecting;
        seqSync();
      }, { threshold: 0.35 }), stage);
      document.addEventListener("visibilitychange", seqSync);
      if (seqToggle) {
        seqToggle.addEventListener("click", function () {
          paused = !paused;
          setToggle();
          if (paused) { playing = false; showEnd(); }
          else { seqSync(); }
        });
      }
    }
  }
})(window.Raccoon);
