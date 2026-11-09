// RaccoonAI page script: Intake: three channels feed the Platform queue (index.html).
// One feature per file, so an error here cannot stop the others; js/core.js loads first and shares window.Raccoon.

(function (R) {
  "use strict";
  if (!R) { return; }
  var onTextReflow = R.onTextReflow, reduceMotion = R.reduceMotion, observeWhenShown = R.observeWhenShown;

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
    onTextReflow(layout);

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
      observeWhenShown(new IntersectionObserver(function (entries) { iVisible = entries[0].isIntersecting; sync(); }, { threshold: 0.35 }), intake);
      document.addEventListener("visibilitychange", sync);
    }
  }
})(window.Raccoon);
