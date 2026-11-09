// RaccoonAI page script: Platform screen magnet (index.html).
// One feature per file, so an error here cannot stop the others; js/core.js loads first and shares window.Raccoon.

(function (R) {
  "use strict";
  if (!R) { return; }
  var reduceMotion = R.reduceMotion, lenis = R.lenis;

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
})(window.Raccoon);
