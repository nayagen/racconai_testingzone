// RaccoonAI page script: DriverApp, one stop: the step cascade and phone scenes (driverapp.html).
// One feature per file, so an error here cannot stop the others; js/core.js loads first and shares window.Raccoon.

(function (R) {
  "use strict";
  if (!R) { return; }
  var reduceMotion = R.reduceMotion, observeWhenShown = R.observeWhenShown;

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
  if (flow) {
    var flowSteps = Array.prototype.slice.call(flow.querySelectorAll(".flow-step"));
    var FLOW_STEP = 2200, FLOW_DWELL = 3200;
    // a step whose phone plays a longer scene holds the highlight until the scene is over
    var flowExtra = function (i) { return flowSteps[i].querySelector('.fphone-da[data-play="photos"]') ? 1600 : 0; };
    // flowPlayed: the intro has run to its end, or the visitor took over; until then it plays again on the next arrival
    var flowTimers = [], flowPlayed = false, flowRunning = false, flowCur = -1;
    var flowAnim = !reduceMotion && "IntersectionObserver" in window;
    var flowAt = function (ms, fn) { flowTimers.push(window.setTimeout(fn, ms)); };
    var flowStop = function () { flowTimers.forEach(window.clearTimeout); flowTimers = []; };
    var flowShow = function (n) { flowSteps.forEach(function (li, i) { li.classList.toggle("is-shown", i < n); }); };

    /* Phones (one column): a stepper. One step at a time in a fixed frame, under a row of tabs whose underline repeats each
       step's signal: solid where there is connection (1, 4), dashed where there is none (2, 3), so the drop and the return
       read at a glance. It plays through once on arrival and stops on the last step; a tab press takes over. */
    var flowNarrow = window.matchMedia("(max-width: 680px)");
    var flowTabs = document.createElement("div");
    flowTabs.className = "flow-tabs";
    flowTabs.setAttribute("role", "group");
    flowTabs.setAttribute("aria-label", "Шаги на точке");
    var flowTabBtns = flowSteps.map(function (li, i) {
      var net = li.querySelector(".flow-net"), ttl = li.querySelector(".flow-title"), svg = net && net.querySelector("svg");
      var b = document.createElement("button");
      b.type = "button";
      b.className = "flow-tab" + (net && net.classList.contains("is-on") ? " is-net" : "");
      b.innerHTML = '<span class="flow-tab-ix">' + (i + 1) + "</span>" + (svg ? svg.outerHTML : "");
      b.setAttribute("aria-label", (i + 1) + ". " + (ttl ? ttl.textContent.replace(/^\s*\d+/, "").trim() : ""));
      b.setAttribute("aria-pressed", "false");
      b.addEventListener("click", function () { flowGo(i); });
      flowTabs.appendChild(b);
      return b;
    });
    flow.insertBefore(flowTabs, flow.querySelector(".flow-steps"));

    var flowMark = function (c) {
      flowCur = c;
      flowSteps.forEach(function (li, i) { li.classList.toggle("is-current", i === c); });
      flowTabBtns.forEach(function (b, i) { b.classList.toggle("is-current", i === c); b.setAttribute("aria-pressed", i === c ? "true" : "false"); });
      var ph = c >= 0 && flowSteps[c].querySelector(".fphone-da");
      if (ph && flowAnim) { fpPlay(ph); }
    };
    var flowGo = function (i) {
      flowStop();
      flowPlayed = true; flowRunning = false;
      flow.classList.remove("is-looping");
      flowShow(flowSteps.length);
      flowMark(i);
    };
    var flowMode = function () {
      var on = flowNarrow.matches;
      flow.classList.toggle("is-stepper", on);
      flowTabs.hidden = !on;
      if (on && flowCur < 0) { flowStop(); flowShow(flowSteps.length); flowMark(0); }
    };
    if (flowNarrow.addEventListener) { flowNarrow.addEventListener("change", flowMode); } else if (flowNarrow.addListener) { flowNarrow.addListener(flowMode); }
    /* The first switch happens at load: snap it. Fading the other steps out there is never seen, but Chrome counts those
       steps as moving (a layout shift of ~0.15 on phones); later switches, e.g. on rotation, keep their fade. */
    flowSteps.forEach(function (li) { li.style.transition = "none"; });
    flowMode();
    void flow.offsetWidth;
    flowSteps.forEach(function (li) { li.style.transition = ""; });

    if (flowAnim) {
      var flowLoop = function () {
        flowStop();
        flow.classList.add("is-looping");
        (function next() {
          flowAt(FLOW_DWELL + flowExtra(flowCur), function () {
            if (flowCur >= flowSteps.length - 1) {
              flowRunning = false; flowPlayed = true;
              flow.classList.remove("is-looping");
              if (!flowNarrow.matches) { flowMark(-1); } // the stepper keeps its last step in view
              return;
            }
            flowMark(flowCur + 1); next();
          });
        })();
      };
      var flowIntro = function () {
        flowStop();
        flowRunning = true;
        if (flowNarrow.matches) { flowShow(flowSteps.length); flowMark(0); flowLoop(); return; }
        flowShow(0);
        flowMark(-1);
        var at = 300;
        flowSteps.forEach(function (_, i) { flowAt(at, function () { flowShow(i + 1); flowMark(i); }); if (i < flowSteps.length - 1) { at += FLOW_STEP + flowExtra(i); } });
        flowAt(at, function () { flowMark(0); flowLoop(); });
      };
      flow.classList.add("is-anim");
      flowShow(flowSteps.length); // fully visible until it scrolls into view
      /* Leaving the view (or the tab) mid-intro resets it, and it plays again on the next arrival: a quick scroll past
         the section must not use up the only run. */
      var flowInView = false;
      var flowSync = function () {
        if (flowInView && !document.hidden) { if (!flowPlayed && !flowRunning) { flowIntro(); } return; }
        flowStop(); flowRunning = false;
        flow.classList.remove("is-looping"); fpList.forEach(fpRest); flowShow(flowSteps.length);
      };
      observeWhenShown(new IntersectionObserver(function (entries) {
        flowInView = entries[0].isIntersecting;
        flowSync();
      }, { threshold: 0.3 }), flow);
      document.addEventListener("visibilitychange", flowSync);
    }
  }
})(window.Raccoon);
