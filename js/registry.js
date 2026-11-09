// RaccoonAI page script: Customer registry: BIN lookup loop (index.html).
// One feature per file, so an error here cannot stop the others; js/core.js loads first and shares window.Raccoon.

(function (R) {
  "use strict";
  if (!R) { return; }
  var reduceMotion = R.reduceMotion, observeWhenShown = R.observeWhenShown;

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
    observeWhenShown(new IntersectionObserver(function (entries) {
      regInView = entries[0].isIntersecting;
      if (regInView && !document.hidden) { regStart(!regPlayed); regPlayed = true; } else if (regRunning) { regStop(); }
    }, { threshold: 0.4 }), reg);
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) { if (regRunning) { regStop(); } } else if (regInView) { regStart(false); }
    });
  }
})(window.Raccoon);
