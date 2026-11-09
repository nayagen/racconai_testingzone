// RaccoonAI page script: AI dispatcher switches, fleet-wide and per truck (index.html).
// One feature per file, so an error here cannot stop the others; js/core.js loads first and shares window.Raccoon.

(function (R) {
  "use strict";
  if (!R) { return; }

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
})(window.Raccoon);
