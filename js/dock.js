// RaccoonAI page script: Desktop dock: section scroll spy and marker (all pages).
// One feature per file, so an error here cannot stop the others; js/core.js loads first and shares window.Raccoon.

(function (R) {
  "use strict";
  if (!R) { return; }
  var reduceMotion = R.reduceMotion, onTextReflow = R.onTextReflow;

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
    onTextReflow(function () { tMeasure(); tSchedule(); });
  }
})(window.Raccoon);
