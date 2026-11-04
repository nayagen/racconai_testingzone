// RaccoonAI landing page behavior.
// Everything here is an enhancement: without JavaScript the page shows the final state and the form posts normally.

(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Header border once the page scrolls ---------- */
  var header = document.querySelector(".site-header");
  function onScroll() { header.classList.toggle("is-scrolled", window.scrollY > 8); }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Signature sequence (about 9 s): request → AI proposes → assigned → driver gets the point ---------- */
  var stage = document.getElementById("stage");
  var requestStatus = document.querySelector("#card-request .status");
  var aiBadge = document.getElementById("ai-badge");
  var aiSub = document.getElementById("ai-sub");
  var phoneTotal = document.getElementById("phone-total");
  var stepItems = Array.prototype.slice.call(document.querySelectorAll(".seq-steps li"));
  var replayBtn = document.getElementById("seq-replay");

  var finalText = {
    badge: aiBadge.textContent,
    sub: aiSub.innerHTML,
    request: requestStatus.textContent,
    total: phoneTotal.textContent
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

  // Step indicator under the map: one item active at a time, a bar fills for its duration.
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
    stage.classList.remove("is-step-1", "is-proposing", "hide-ai", "hide-phone", "is-done");
    stage.classList.add("is-step-0");
    stage.removeAttribute("data-focus");
    setRequest(true);
    aiBadge.textContent = "AI предлагает";
    aiBadge.classList.add("is-proposed");
    aiSub.textContent = "Подбирает ближайшую подходящую машину…";
    phoneTotal.textContent = "10";
    hideProposal();
    markStep(0, 0);
    replayBtn.hidden = true;
  }

  function playSequence() {
    resetToStart();

    // 1. A new WhatsApp request lands on the map.
    at(500, function () {
      stage.classList.remove("is-step-0");
      stage.classList.add("is-step-1", "hide-ai", "hide-phone");
      stage.setAttribute("data-focus", "request");
      markStep(1, 2100);
    });

    // 2. The AI proposes a truck: the dashed violet route draws slowly.
    at(2600, function () {
      stage.classList.remove("hide-ai");
      stage.classList.add("is-proposing");
      stage.setAttribute("data-focus", "ai");
      markStep(2, 3000);
      drawProposal(2600);
    });
    at(4100, function () {
      aiSub.textContent = "Ближайшая подходящая машина · ТБО · 1.8 км";
    });

    // 3. Assigned: the route turns solid, both cards change status.
    at(5600, function () {
      stage.classList.remove("is-proposing", "is-step-1");
      aiBadge.textContent = finalText.badge;
      aiBadge.classList.remove("is-proposed");
      aiSub.innerHTML = finalText.sub;
      setRequest(false);
      markStep(3, 1800);
    });

    // 4. The driver's app receives the new point.
    at(7400, function () {
      stage.classList.remove("hide-phone");
      stage.setAttribute("data-focus", "driver");
      phoneTotal.textContent = finalText.total;
      markStep(4, 1800);
    });

    // Rest on the full picture, offer a replay.
    at(9400, function () {
      stage.removeAttribute("data-focus");
      stage.classList.add("is-done");
      finishSteps();
      replayBtn.hidden = false;
    });
  }

  replayBtn.addEventListener("click", function () {
    playSequence();
  });

  if (reduceMotion) {
    finishSteps();
  } else if ("IntersectionObserver" in window) {
    var played = false;
    var io = new IntersectionObserver(function (entries) {
      if (!played && entries[0].isIntersecting) {
        played = true;
        io.disconnect();
        playSequence();
      }
    }, { threshold: 0.35 });
    io.observe(stage);
  } else {
    finishSteps();
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

  /* ---------- Demo request form ---------- */
  var form = document.getElementById("demo-form");
  var submit = document.getElementById("f-submit");
  var status = document.getElementById("form-status");
  var FORM_NOT_CONNECTED = /FORM_ID$/.test(form.action);

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
      showStatus("error", "Форма ещё не подключена к сервису отправки. Позвоните нам: [ТЕЛЕФОН].");
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
        showStatus("error", "Не удалось отправить заявку. Проверьте подключение и попробуйте ещё раз или позвоните нам: [ТЕЛЕФОН].");
      })
      .then(function () {
        submit.disabled = false;
        submit.textContent = "Запросить демо";
      });
  });

  /* ---------- Platform screen: scale the 1600px design to the frame; pan on narrow screens ---------- */
  var pfView = document.getElementById("pf-viewport");
  if (pfView) {
    var PF_W = 1600, PF_MIN = 0.5;
    var fitPlatform = function () {
      var w = pfView.clientWidth;
      if (!w) { return; }
      var s = Math.min(1, w / PF_W);
      var pan = s < PF_MIN;
      pfView.style.setProperty("--pf-s", String(pan ? PF_MIN : s));
      pfView.classList.toggle("is-pan", pan);
    };
    fitPlatform();
    if ("ResizeObserver" in window) { new ResizeObserver(fitPlatform).observe(pfView); }
    else { window.addEventListener("resize", fitPlatform); }

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
        Array.prototype.forEach.call(root.querySelectorAll("button:not([data-pf-close]):not([data-pf-photo])"), function (b) { b.tabIndex = -1; b.setAttribute("aria-hidden", "true"); });
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
    }
  }
})();
