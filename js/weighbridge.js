// RaccoonAI page script: Weighbridge weighing and its share tabs (index.html).
// One feature per file, so an error here cannot stop the others; js/core.js loads first and shares window.Raccoon.

(function (R) {
  "use strict";
  if (!R) { return; }
  var reduceMotion = R.reduceMotion, observeWhenShown = R.observeWhenShown;

  /* ---------- Weighbridge: a landfill weighing lands in its trip ----------
     Four phases, each mirrored by a lit step in the list on the left and by the phase bar above the cards:
     1. the scale reads gross, then tare, and the net follows; 2. the record leaves as a packet (plate + net) down the wire;
     3. the Platform matches the plate, both plates light up and the net lands in the trip's unloading row;
     4. the net splits across the trip's sites in proportion to the volume actually collected from each. Two records alternate; the markup is the first one, landed. */
  var wb = document.getElementById("wb-stage");
  if (wb) {
    var WB = [
      { rec: "48213", plate: "123 ABC 02", time: "11:42", gross: 18420, tare: 11580, trip: "2",
        crew: "Сериков Данияр · ТБО · 17 площадок", more: "и ещё 14 площадок",
        sites: [["Кабанбай батыра, 45", "ТОО «Алатау Сервис Групп»", 5.5], ["Жибек Жолы, 115", "ТОО «Береке Трейд»", 4.4],
          ["Радостовца, 34", "ИП Сапарова А.", 2.2]], rest: 40.0 },
      { rec: "48217", plate: "482 KMT 02", time: "11:58", gross: 17960, tare: 11240, trip: "1",
        crew: "Омаров Ерлан · ТБО · 18 площадок", more: "и ещё 15 площадок",
        sites: [["Абая, 52", "ТОО «Тау Маркет»", 4.4], ["Самал-2, 58", "ТОО «Алатау Сервис Групп»", 3.3],
          ["Сейфуллина, 404", "ТОО «Тау Маркет»", 4.4]], rest: 41.9 }
    ];
    // Each site's share of the net follows the volume actually collected from it: net ÷ trip volume = weight of 1 m³,
    // times the site's volume. Volumes are per site (m³); the shares are worked out here, so they always add up to the net.
    var dec = function (n, f) { return n.toFixed(f).replace(".", ","); };
    var m3 = function (n) { return dec(n, 1) + "\u00a0м³"; };
    var kg = function (n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " кг"; };
    var wf = function (k) { return wb.querySelector('[data-w="' + k + '"]'); };
    var cell = function (k) { return wf(k).parentNode; }; // the gross / tare / net tile around its value
    var wbUnload = wb.querySelector(".wb-unload");
    var wbPort = wb.querySelector(".wb-port");
    var wbPhase = wb.querySelector(".wb-phase");
    var wbBars = [].slice.call(wb.querySelectorAll(".wb-steps li"));
    var wbRows = [].slice.call(wb.querySelectorAll(".wb-tr"));
    var wbPlates = [wf("plate"), wf("plate2")];
    var wbChip = wf("chip");
    var wbToggle = document.getElementById("wb-toggle");
    var wbList = document.querySelector("#weighing .cycle");
    var wbSteps = wbList ? [].slice.call(wbList.children) : [];
    var wTimers = [], wRaf = 0, wIx = WB.length - 1;
    var wLater = function (fn, ms) { wTimers.push(setTimeout(fn, ms)); };
    var setTxt = function (k, v) { var el = wf(k); if (el) { el.textContent = v; } };
    var pend = function (keys, on) {
      keys.forEach(function (k) {
        var el = wf(k);
        el.classList.toggle("is-pending", on);
        if (!on) { el.classList.remove("is-in"); void el.offsetWidth; el.classList.add("is-in"); }
      });
    };
    var WEIGHTS = ["gross", "tare", "net", "rec"];
    var TRIPW = ["w0", "w1", "w2", "w3", "unet", "urec", "fnet", "fden"];
    var wbRatio = wb.querySelector(".wb-ratio");

    // Which step is running; -1 = at rest (all four done, the list undimmed). The step's title is read from the list,
    // so it is already in the page language.
    var phase = function (i) {
      var live = i >= 0, at = live ? i : wbSteps.length - 1;
      wbSteps.forEach(function (li, j) { li.classList.toggle("is-now", live && j === i); });
      if (wbList) { wbList.classList.toggle("is-live", live); }
      wbBars.forEach(function (b, j) { b.classList.toggle("is-now", live && j === i); b.classList.toggle("is-done", live ? j < i : true); });
      if (wbSteps[at]) {
        setTxt("pn", String(at + 1));
        setTxt("pl", wbSteps[at].querySelector("strong").textContent);
      }
    };
    // A scale reading: the value climbs to its weight, settling in 20 kg steps like a real display
    var count = function (k, to, ms) {
      var el = wf(k), t0 = 0;
      var step = function (t) {
        t0 = t0 || t;
        var p = Math.min(1, (t - t0) / ms), e = 1 - Math.pow(1 - p, 3);
        el.textContent = kg(p < 1 ? Math.round(to * e / 20) * 20 : to);
        wRaf = p < 1 ? requestAnimationFrame(step) : 0;
      };
      cancelAnimationFrame(wRaf);
      el.textContent = kg(0);
      wRaf = requestAnimationFrame(step);
    };
    var clearMarks = function () {
      ["gross", "tare", "net"].forEach(function (k) { cell(k).classList.remove("is-reading"); });
      wbPlates.forEach(function (p) { p.classList.remove("is-match"); });
      wbRows.forEach(function (r) { r.classList.remove("is-hit"); });
      wbRatio.classList.remove("is-hit");
      wbUnload.classList.remove("is-landed");
      wb.classList.remove("is-sending");
    };

    // Fill in a record: every text in place, then the weights hidden until the scale reads them
    var load = function (d, pending) {
      var net = kg(d.gross - d.tare);
      ["rec", "plate", "time", "trip", "crew", "more"].forEach(function (k) { setTxt(k, d[k]); });
      setTxt("gross", kg(d.gross)); setTxt("tare", kg(d.tare)); setTxt("net", net);
      setTxt("plate2", d.plate); setTxt("pplate", d.plate); setTxt("pnet", net);
      var vols = d.sites.map(function (s) { return s[2]; }).concat(d.rest);
      var vol = vols.reduce(function (a, v) { return a + v; }, 0), den = (d.gross - d.tare) / vol;
      d.sites.forEach(function (s, i) { setTxt("s" + i, s[0]); setTxt("c" + i, s[1]); });
      vols.forEach(function (v, i) { setTxt("k" + i, m3(v)); setTxt("w" + i, dec(v * den / 1000, 2) + "\u00a0т"); });
      setTxt("fnet", net); setTxt("fvol", m3(vol)); setTxt("fden", Math.round(den) + "\u00a0кг/м³");
      setTxt("unet", net);
      setTxt("urec", "Запись № " + d.rec + " · " + d.time);
      WEIGHTS.concat(TRIPW).forEach(function (k) { wf(k).classList.toggle("is-pending", pending); wf(k).classList.remove("is-in"); });
      wbChip.className = pending ? "status status-wait" : "status status-done";
      wbChip.textContent = pending ? "Ждём заезд на весовую" : "Вес получен";
    };

    var cycle = function () {
      wIx = (wIx + 1) % WB.length;
      var d = WB[wIx];
      clearMarks();
      load(d, true);
      phase(0);
      // 1 · Weighing: gross, then tare, then the net
      wLater(function () { pend(["gross"], false); cell("gross").classList.add("is-reading"); count("gross", d.gross, 1100); }, 400);
      wLater(function () { cell("gross").classList.remove("is-reading"); pend(["tare"], false); cell("tare").classList.add("is-reading"); count("tare", d.tare, 800); }, 1700);
      wLater(function () { cell("tare").classList.remove("is-reading"); pend(["net", "rec"], false); cell("net").classList.add("is-reading"); }, 2700);
      // 2 · The record leaves for the Platform
      wLater(function () { cell("net").classList.remove("is-reading"); phase(1); void wb.offsetWidth; wb.classList.add("is-sending"); }, 3500);
      // 3 · Matched by plate: the net lands in the trip
      wLater(function () {
        wb.classList.remove("is-sending");
        wbPort.classList.remove("is-hit"); void wbPort.offsetWidth; wbPort.classList.add("is-hit");
        phase(2);
        wbPlates.forEach(function (p) { p.classList.add("is-match"); });
      }, 4600);
      wLater(function () {
        pend(["unet", "urec", "fnet"], false);
        wbUnload.classList.add("is-landed");
        wbChip.className = "status status-done";
        wbChip.textContent = "Вес получен";
      }, 5200);
      // 4 · The net splits across the sites by the volume collected from each: first the weight of 1 m³, then each site's share
      wLater(function () {
        wbPlates.forEach(function (p) { p.classList.remove("is-match"); }); wbUnload.classList.remove("is-landed");
        phase(3); wbRatio.classList.add("is-hit"); pend(["fden"], false);
      }, 6400);
      ["w0", "w1", "w2", "w3"].forEach(function (k, i) {
        wLater(function () { wbRows[i].classList.add("is-hit"); pend([k], false); }, 7300 + i * 380);
        wLater(function () { wbRows[i].classList.remove("is-hit"); }, 8000 + i * 380);
      });
      wLater(function () { wbRatio.classList.remove("is-hit"); }, 9200);
      wLater(cycle, 11800);
    };
    var wStop = function () {
      wTimers.forEach(clearTimeout); wTimers = [];
      cancelAnimationFrame(wRaf); wRaf = 0;
      clearMarks();
      load(WB[wIx], false);
      phase(-1);
    };

    if (!reduceMotion && "IntersectionObserver" in window) {
      var wRunning = false, wPaused = false, wVisible = false;
      var wSync = function () {
        var run = wVisible && !wPaused && !document.hidden;
        if (run && !wRunning) { wRunning = true; wLater(cycle, 500); }
        else if (!run && wRunning) { wRunning = false; wStop(); }
      };
      wbToggle.hidden = false;
      wbPhase.hidden = false;
      phase(-1);
      wbToggle.addEventListener("click", function () {
        wPaused = !wPaused;
        wbToggle.setAttribute("aria-pressed", String(wPaused));
        wbToggle.querySelector("span").textContent = wPaused ? "Запустить анимацию" : "Остановить анимацию";
        wbToggle.classList.toggle("is-paused", wPaused);
        wSync();
      });
      observeWhenShown(new IntersectionObserver(function (entries) { wVisible = entries[0].isIntersecting; wSync(); }, { threshold: 0.35 }), wb);
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
})(window.Raccoon);
