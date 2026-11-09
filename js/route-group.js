// RaccoonAI page script: Route group: approve tomorrow's route sheets (index.html).
// One feature per file, so an error here cannot stop the others; js/core.js loads first and shares window.Raccoon.

(function (R) {
  "use strict";
  if (!R) { return; }
  var reduceMotion = R.reduceMotion;

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
})(window.Raccoon);
