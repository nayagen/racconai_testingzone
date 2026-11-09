// RaccoonAI page script: Platform screen replica, its live map and the auto tour (index.html).
// One feature per file, so an error here cannot stop the others; js/core.js loads first and shares window.Raccoon.

(function (R) {
  "use strict";
  if (!R) { return; }
  var twoGisTiles = R.twoGisTiles, reduceMotion = R.reduceMotion, observeWhenShown = R.observeWhenShown;

  /* ---------- Platform screen: scale the 1600px design to the frame; a camera window on narrow screens ---------- */
  var pfView = document.getElementById("pf-viewport");
  if (pfView) {
    /* The screen is always laid out at its full 1600 x 980 design size and scaled as a whole, like browser zoom, so text,
       spacing and icons shrink together. The scale fits the frame width and caps the screen at 90% of the window height
       (PF_VH; never below PF_MIN to fit the height). The frame narrows to the scaled width (--pf-fit) and stays centred.
       Below PF_MIN (phones, small tablets) the frame turns compact: a fixed portrait window (CSS) that only the auto tour's
       camera moves through. The screen is not explorable by hand there; it fires "pf:fit" so the camera can re-aim. */
    var PF_W = 1600, PF_MIN = 0.5, PF_H = 980, PF_VH = 0.9;
    var pfFrame = pfView.closest(".pf-frame");
    var fitPlatform = function () {
      var w = pfFrame.clientWidth;
      if (!w) { return; }
      var sW = w / PF_W;
      var sH = Math.max(PF_MIN, window.innerHeight * PF_VH / PF_H);
      var compact = sW < PF_MIN;
      var s = compact ? sW : Math.min(sW, sH);
      pfView.style.setProperty("--pf-s", String(s));
      pfView.style.setProperty("--pf-h", PF_H + "px");
      pfFrame.style.setProperty("--pf-fit", compact ? "none" : Math.ceil(PF_W * s) + "px");
      pfView.classList.toggle("is-compact", compact);
      pfFrame.classList.toggle("is-compact", compact);
      pfView.dispatchEvent(new CustomEvent("pf:fit", { detail: compact }));
    };
    fitPlatform();
    if ("ResizeObserver" in window) { new ResizeObserver(fitPlatform).observe(pfFrame); }
    window.addEventListener("resize", fitPlatform);

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
      pfView.dispatchEvent(new CustomEvent("pf:tabchange", { detail: tab.getAttribute("data-pf-tab") }));
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
        Array.prototype.forEach.call(root.querySelectorAll("button:not([data-pf-close]):not([data-pf-photo]):not([data-pf-rmodal])"), function (b) { b.tabIndex = -1; b.setAttribute("aria-hidden", "true"); });
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

      /* The whole depot on the map (platform-fleet.js, generated by tools/platform-block/fleet.mjs): the trucks the build left
         off, each with its route of the day, the job pins along those routes, and a truck card per truck. Pins, trucks and
         cards are cloned from the build's own markup, so they look and behave the same; this runs before anything reads
         the map (live map, search, filter, roving focus, cards). */
      /* Truck card photo per model (images/platform/trucks/photo, generated with Higgsfield GPT Image 2.5), painted in the
         colour of its type's map icon. Transparent, so one file serves both themes. */
      var TRUCK_PHOTO = {
        "Iveco EuroCargo SB-800": "iveco-eurocargo-sb-800", "КамАЗ 53605 МК-4546": "kamaz-53605-mk-4546", "МАЗ 5340 КО-427": "maz-5340-ko-427",
        "КамАЗ 43253 МКС-4505": "kamaz-43253-mks-4505", "МАЗ 5550 бункеровоз": "maz-5550-bunker",
        "КамАЗ 65115 мультилифт": "kamaz-65115-multilift", "Volvo FM мультилифт": "volvo-fm-multilift",
        "КамАЗ 6520 самосвал": "kamaz-6520-samosval", "Shacman X3000 самосвал": "shacman-x3000-samosval",
        "ГАЗон Next ассенизатор": "gazon-next-assenizator", "КамАЗ 43253 КО-505": "kamaz-43253-ko-505"
      };
      var truckPhoto = function (card, model) {
        var img = card.querySelector(".pf-truck__img"), f = TRUCK_PHOTO[model];
        if (img && f) { img.src = "images/platform/trucks/photo/" + f + ".webp"; img.width = 96; img.height = 80; }
      };
      Array.prototype.forEach.call(pfSide.querySelectorAll('[data-pf-card^="truck-"]'), function (c) {
        var m = c.querySelector(".pf-truck__model .body-m-medium");
        if (m) { truckPhoto(c, m.textContent.trim()); }
      });
      if (window.PF_FLEET) {
        (function (FL) {
          var mapEl = pfView.querySelector(".pf-map"), pinBox = mapEl && mapEl.querySelector(".pf-map__pins");
          var tTpl = mapEl && mapEl.querySelector(".pf-map__truck:not(.is-active)");
          var cardTpl = pfSide.querySelector('[data-pf-card^="truck-"]');
          if (!pinBox || !tTpl || !cardTpl) { return; }
          var WORD = { created: "неназначено", assigned: "назначено", "in-progress": "машина в пути", completed: "выполнено", failed: "невывоз" };

          /* job pins */
          var pinTpl = {};
          Array.prototype.forEach.call(pinBox.querySelectorAll("[data-pf-site]"), function (b) {
            var st = PF.sites[+b.getAttribute("data-pf-site")].pin;
            if (!pinTpl[st]) { pinTpl[st] = b; }
          });
          var base = PF.sites.length, pins = document.createDocumentFragment();
          FL.sites.forEach(function (s, i) {
            PF.sites.push(s);
            var b = pinTpl[s.pin] && pinTpl[s.pin].cloneNode(true);
            if (!b) { return; }
            b.setAttribute("data-pf-site", String(base + i));
            b.tabIndex = -1;
            b.classList.remove("is-active");
            b.removeAttribute("aria-pressed");
            b.setAttribute("aria-label", s.name + ", " + s.addr + ", " + WORD[s.pin]);
            b.style.left = (s.x - 14) + "px";
            b.style.top = (s.y - 28) + "px";
            pins.appendChild(b);
          });
          pinBox.appendChild(pins);

          /* trips and route lines */
          Object.keys(FL.routes).forEach(function (k) { PF.routes[k] = FL.routes[k]; });
          PF.trucks = PF.trucks || {};
          Object.keys(FL.lines).forEach(function (p) { PF.trucks[p] = FL.lines[p]; });

          /* trucks on the map: recoloured per vehicle type, parked ones face the depot gate */
          var trucks = mapEl.querySelectorAll(".pf-map__truck"), after = trucks[trucks.length - 1];
          var tripTpl = cardTpl.querySelector(".pf-trip");
          FL.trucks.forEach(function (t) {
            var b = tTpl.cloneNode(true);
            b.classList.add("pf-map__truck--" + t.type);
            b.classList.toggle("is-parked", !!t.depot);
            b.setAttribute("data-pf-truck", t.plate);
            b.setAttribute("data-pf-driver", t.driver);
            b.setAttribute("data-pf-vtype", t.vtype);
            b.setAttribute("aria-label", "Машина " + t.plate + ", водитель " + t.driver + ", " + t.vtype.charAt(0).toLowerCase() + t.vtype.slice(1) + ", " + (t.depot ? "в депо" : "в пути"));
            b.style.left = (t.x - 32) + "px";
            b.style.top = (t.y - 32) + "px";
            Array.prototype.forEach.call(b.querySelectorAll(".rc-truck"), function (r) {
              r.style.transform = "rotate(" + t.rot + "deg)";
              r.setAttribute("title", t.plate);
            });
            after.parentNode.insertBefore(b, after.nextSibling);
            after = b;

            /* its card, from the build's truck card */
            var slot = cardTpl.cloneNode(true);
            slot.setAttribute("data-pf-card", "truck-" + t.plate);
            slot.hidden = true;
            var card = slot.querySelector(".pf-truck");
            card.classList.add("pf-truck--" + t.type);
            var txt = function (sel, v) { var el = slot.querySelector(sel); if (el) { el.textContent = v; } };
            txt(".rc-plate", t.plate);
            txt(".pf-truck__model .body-m-medium", t.model);
            txt(".pf-truck__model .caption-m-regular", t.vtype);
            truckPhoto(slot, t.model);
            slot.querySelector(".pf-crewrow").innerHTML = t.crew.map(function (c) {
              return '<div class="pf-crew"><span class="rc-avatar rc-avatar--' + c[3] + ' rc-avatar--sm" style="width:24px;height:24px">' + esc(c[0]) + "</span>" +
                '<div class="pf-crew__who"><p class="caption-m-medium pf-ellipsis">' + esc(c[1]) + '</p><p class="caption-m-regular pf-muted">' + esc(c[2]) + "</p></div></div>";
            }).join("");
            txt('[data-pf-metric="km"] .heading-h4-semibold', t.km);
            txt('[data-pf-metric="km"] .pf-chip', t.odo);
            txt('[data-pf-metric="fuel"] .heading-h4-semibold', t.fuel);
            txt('[data-pf-metric="fuel"] .pf-chip', t.left);
            txt(".pf-shift > p", t.depot ? "Следующий рейс в " + (PF.routes[t.keys[t.keys.length - 1]].f) : "На линии с " + t.since);
            var shiftBadge = slot.querySelector(".pf-shift .rc-status");
            if (t.depot && shiftBadge) { shiftBadge.className = "rc-status rc-status--assigned"; shiftBadge.textContent = "В депо"; }
            txt(".pf-gps p", t.gps);
            var tripsBox = slot.querySelector(".pf-truck__trips");
            Array.prototype.forEach.call(tripsBox.querySelectorAll(".pf-trip"), function (x) { x.remove(); });
            t.keys.forEach(function (k) {
              var r = PF.routes[k], tb = tripTpl.cloneNode(true);
              tb.setAttribute("data-pf-rmodal", k);
              tb.setAttribute("aria-label", "Рейс " + r.trip + " " + r.id + ": открыть карточку маршрута");
              var ps = tb.querySelectorAll(".pf-trip__main p");
              if (ps[0]) { ps[0].textContent = "Рейс " + r.trip; }
              if (ps[1]) { ps[1].textContent = r.id; }
              var old = tb.children[1], tmp = document.createElement("span");
              tmp.innerHTML = r.k === "completed" ? badge("completed", "Выполнено") : r.k === "in-progress" ? badge("in-progress", "В процессе", r.done + "/" + r.total) : badge("assigned", "Назначено", String(r.total));
              if (old && !old.classList.contains("pf-trip__chev")) { tb.replaceChild(tmp.firstChild, old); }
              tripsBox.appendChild(tb);
            });
            cardTpl.parentNode.appendChild(slot);
            slots["truck-" + t.plate] = slot;
          });
        })(window.PF_FLEET);
      }

      /* Every truck on the map, the build's ТБО ones included, wears its type's 56px top-down icon, plain and selected
         (images/platform/trucks/map, made by tools/platform-block/truck-icons.mjs). The 64px box keeps its centre. */
      Array.prototype.forEach.call(pfView.querySelectorAll(".pf-map .pf-map__truck"), function (b) {
        var m = /pf-map__truck--(\w+)/.exec(b.className), type = m ? m[1] : "tbo";
        Array.prototype.forEach.call(b.querySelectorAll(".rc-truck"), function (r) {
          var on = r.parentNode.classList.contains("pf-map__truckart--on");
          r.style.width = r.style.height = "64px";
          r.innerHTML = '<img src="images/platform/trucks/map/' + type + (on ? "-on" : "") + '.png" width="56" height="56" alt="" decoding="async">';
        });
      });

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
      /* backdrop px -> current map px; identity until the live map (below) takes over */
      var mapPoint = function (p) { return p; }, routeRepaint = function () {}, routeSvg = null;
      /* bring a map item into view, then call done (the live map flies there; the static backdrop has nothing to move) */
      var mapFocus = function (el, done) { done(); };
      /* a truck was picked: make sure its whole route of the day is in view (the live map flies out to it) */
      var mapFitRoute = function () {};
      /* the set of pins on the map changed (filter): regroup the clusters of the live map */
      var mapCluster = function () {};
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
        /* backdrop-pixel paths, used as they are by the route modal; the live map below redraws the main map's copy in its own pixels */
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
        var routePlate = null;
        var paintRoute = function () {
          var r = routePlate && PF.trucks[routePlate];
          svg.classList.toggle("is-on", !!r);
          if (!r) { return; }
          var past = rounded(r.past.map(mapPoint)), plan = rounded(r.plan.map(mapPoint));
          pPast.setAttribute("d", past);
          pCase.setAttribute("d", plan);
          pPlan.setAttribute("d", plan);
        };
        drawRoute = function (el) {
          routePlate = el && el.hasAttribute("data-pf-truck") && PF.trucks[el.getAttribute("data-pf-truck")] ? el.getAttribute("data-pf-truck") : null;
          paintRoute();
          if (routePlate) { mapFitRoute(routePlate); }
        };
        routeRepaint = paintRoute;
        routeSvg = svg;
      }

      /* Live map: Leaflet with 2GIS raster tiles under the pins, trucks, depot and routes. The build placed those in pixels of the
         1600 x 900 backdrop (images/platform/map-almaty.webp); GEO ties backdrop pixels to Web Mercator (a * mercator + b, fitted
         to the 2GIS tiles), so each overlay keeps its backdrop position as home and follows the map through the CSS translate
         property. At night each tile is recoloured on a canvas with the curve of the dark backdrop. The backdrop stays as the
         placeholder until tiles arrive, and as the fallback when Leaflet or the tiles fail. */
      if (routeMap && window.L && L.GridLayer) {
        (function () {
          var GEO = { a: 3497284.9656436485, bx: -2495094.399519851, by: -1281326.2418159847 };
          var Z0 = Math.log(GEO.a / 256) / Math.LN2;
          var backdrop = routeMap.querySelector(".pf-map__bg");
          var live = document.createElement("div");
          live.className = "pf-map__live";
          live.setAttribute("aria-hidden", "true");
          routeMap.insertBefore(live, backdrop ? backdrop.nextSibling : routeMap.firstChild);

          var touchOnly = L.Browser.mobile;
          var map = L.map(live, {
            zoomSnap: 0, zoomDelta: 1, minZoom: 11, maxZoom: 18, maxBounds: [[43.05, 76.6], [43.45, 77.25]], maxBoundsViscosity: 1,
            attributionControl: false, zoomControl: false, keyboard: false, boxZoom: false, scrollWheelZoom: false,
            dragging: !touchOnly, touchZoom: !touchOnly, doubleClickZoom: true, inertia: true,
            zoomAnimation: !window.matchMedia("(prefers-reduced-motion: reduce)").matches
          });
          var geoOf = function (p) { return map.unproject(L.point(p[0] - GEO.bx, p[1] - GEO.by), Z0); };
          /* home: the backdrop's own view, its top-left corner on the map's top-left corner */
          var home = function () {
            var s = map.getSize();
            map.setView(geoOf([s.x / 2, s.y / 2]), Z0, { animate: false });
          };
          map.setView(geoOf([routeMap.clientWidth / 2, routeMap.clientHeight / 2]), Z0, { animate: false });
          var moved = false, dead = false, booted = false;
          setTimeout(function () { booted = true; }, 0);

          var gis = twoGisTiles(), Tiles = gis.Tiles;
          var tiles = new Tiles({ maxZoom: 18, keepBuffer: 2, updateWhenZooming: false }).addTo(map);
          var shown = false;
          tiles.on("tileload", function () { if (!shown) { shown = true; routeMap.classList.add("is-live"); mapCluster(); } });
          /* no tile within 12 s (offline, blocked): drop the live map and keep the backdrop */
          setTimeout(function () {
            if (shown) { return; }
            dead = true; map.off(); map.remove(); live.remove(); ctl.remove(); routeMap.removeAttribute("data-lenis-prevent");
            mapPoint = function (p) { return p; };
            items.forEach(function (it) { it.el.style.translate = ""; });
            routeRepaint();
          }, 12000);
          gis.watchTheme(tiles);

          /* ---- overlays: pins (anchored at the tip), trucks and the depot (anchored at the centre) ---- */
          var items = Array.prototype.map.call(routeMap.querySelectorAll(".pf-mpin, .pf-map__truck, .pf-map__depot"), function (el) {
            var tip = el.classList.contains("pf-mpin");
            return { el: el, p: [el.offsetLeft + el.offsetWidth / 2, el.offsetTop + (tip ? el.offsetHeight : el.offsetHeight / 2)] };
          });
          items.forEach(function (it) { it.g = geoOf(it.p); });
          var toPx = function (g, zoom, center) {
            if (zoom === undefined) { return map.latLngToContainerPoint(g); }
            var s = map.getSize();
            return map.project(g, zoom).subtract(map.project(center, zoom)).add(s.divideBy(2));
          };
          mapPoint = function (p) { var q = map.latLngToContainerPoint(geoOf(p)); return [q.x, q.y]; };
          var place = function (zoom, center) {
            items.forEach(function (it) {
              var q = toPx(it.g, zoom, center);
              it.el.style.translate = (q.x - it.p[0]).toFixed(1) + "px " + (q.y - it.p[1]).toFixed(1) + "px";
            });
          };
          var sync = function () { place(); routeRepaint(); };
          map.on("move zoom viewreset resize", sync);
          /* zoom animation: Leaflet scales the tiles over 250 ms; overlays glide to their end positions with it, and the
             route scales as a picture (its strokes keep their width) until it is redrawn at the end */
          map.on("zoomanim", function (e) {
            routeMap.classList.add("is-zooming");
            place(e.zoom, e.center);
            if (routeSvg) {
              var k = map.getZoomScale(e.zoom), s = map.getSize();
              var o = map.project(map.getCenter(), e.zoom).subtract(map.project(e.center, e.zoom)).add(s.divideBy(2));
              var c0 = s.divideBy(2), t = o.subtract(c0.multiplyBy(k));
              routeSvg.style.transform = "translate(" + t.x.toFixed(1) + "px," + t.y.toFixed(1) + "px) scale(" + k + ")";
            }
          });
          map.on("zoomend", function () {
            routeMap.classList.remove("is-zooming");
            if (routeSvg) { routeSvg.style.transform = ""; }
            sync();
          });
          map.on("dragstart zoomstart", function () { moved = true; routeMap.classList.toggle("is-moved", true); });

          /* ---- zoom buttons ---- */
          var ctl = document.createElement("div");
          ctl.className = "pf-map__zoom";
          ctl.innerHTML = '<button type="button" class="pf-map__zbtn" data-z="in" aria-label="Приблизить карту"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 4v12M4 10h12"/></svg></button>' +
            '<button type="button" class="pf-map__zbtn" data-z="out" aria-label="Отдалить карту"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 10h12"/></svg></button>' +
            '<button type="button" class="pf-map__zbtn pf-map__zhome" data-z="home" aria-label="Вернуть исходный вид карты"><svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="5.5"/><path d="M10 1.5v3M10 15.5v3M1.5 10h3M15.5 10h3"/></svg></button>';
          routeMap.appendChild(ctl);
          ctl.addEventListener("click", function (e) {
            var b = e.target.closest("[data-z]");
            if (!b) { return; }
            var z = b.getAttribute("data-z");
            stopWheel();
            if (z === "in") { map.zoomIn(1); } else if (z === "out") { map.zoomOut(1); } else { goHome(); }
          });
          var goHome = function () { stopWheel(); moved = false; routeMap.classList.remove("is-moved"); home(); };

          /* ---- wheel / trackpad over the map (pins and trucks included) zooms around the cursor instead of scrolling the
             page; data-lenis-prevent keeps the smooth scroll from taking the event first. Each input moves a target zoom
             (a mouse notch is half a level); every frame the map eases a share of the way there, keeping the place under
             the cursor still, so notches blend into one glide like the page's own smooth scroll. Reduced motion: no easing.
             Frames go through Leaflet's own flyTo path (_moveStart / _move / _moveEnd): the tiles on screen are rescaled and
             kept, and the next tile level loads behind them. setZoomAround(..., {animate: false}) would reset the view each
             frame, which drops every tile and makes the map flash. ---- */
          routeMap.setAttribute("data-lenis-prevent", "");
          var WHEEL_EASE = 0.2;
          var wheelTarget = null, wheelAt = null, wheelRaf = 0, wheeling = false;
          var wheelEnd = function () { if (wheeling) { wheeling = false; map._moveEnd(true); } };
          var stopWheel = function () { wheelTarget = null; if (wheelRaf) { cancelAnimationFrame(wheelRaf); wheelRaf = 0; } wheelEnd(); };
          /* the centre that keeps container point p still when zooming from the current zoom to z (as setZoomAround) */
          var centerAround = function (p, z) {
            var half = map.getSize().divideBy(2), k = map.getZoomScale(z);
            return map.containerPointToLatLng(half.add(p.subtract(half).multiplyBy(1 - 1 / k)));
          };
          var wheelStep = function () {
            wheelRaf = 0;
            if (dead || wheelTarget === null) { wheelEnd(); return; }
            var z = map.getZoom(), dz = wheelTarget - z;
            var next = reduceMotion || Math.abs(dz) < 0.004 ? wheelTarget : z + dz * WHEEL_EASE;
            if (!wheeling) { wheeling = true; map.stop(); map._moveStart(true, false); }
            map._move(centerAround(wheelAt, next), next, { flyTo: true }); // flyTo flag: GridLayer keeps and rescales its tiles
            if (next === wheelTarget) { wheelTarget = null; wheelEnd(); return; }
            wheelRaf = requestAnimationFrame(wheelStep);
          };
          routeMap.addEventListener("wheel", function (e) {
            if (dead || !shown || e.target.closest(".pf-map__zoom, .pf-mf, .pf-ms")) { return; } // the filter and result lists scroll themselves
            e.preventDefault();
            if (map._animatingZoom) { return; } // a button zoom is gliding; let it land first
            var px = e.deltaMode === 1 ? 40 : e.deltaMode === 2 ? 800 : 1; // lines / pages to pixels
            var base = wheelTarget === null ? map.getZoom() : wheelTarget;
            wheelTarget = Math.max(map.getMinZoom(), Math.min(map.getMaxZoom(), base - Math.max(-1, Math.min(1, (e.deltaY * px) / 200))));
            wheelAt = map.mouseEventToContainerPoint(e);
            moved = true; routeMap.classList.add("is-moved");
            if (!wheelRaf) { wheelRaf = requestAnimationFrame(wheelStep); }
          }, { passive: false });

          /* the map keeps its home while untouched, even when its box changes size (the card column closes) */
          if ("ResizeObserver" in window) {
            new ResizeObserver(function () { if (dead) { return; } map.invalidateSize({ pan: false }); if (!moved) { home(); } sync(); }).observe(routeMap);
          }
          mapFitRoute = function (plate) {
            var r = PF.trucks && PF.trucks[plate];
            if (!r || dead || !booted) { return; } // the card chosen while the page sets up keeps the home view
            var b = L.latLngBounds(r.past.concat(r.plan).map(geoOf));
            if (map.getBounds().pad(-0.06).contains(b)) { return; }
            stopWheel();
            moved = true; routeMap.classList.add("is-moved");
            var opts = { padding: [56, 56], maxZoom: Math.max(map.getZoom(), 14) };
            if (reduceMotion) { map.fitBounds(b, opts); } else { map.flyToBounds(b, Object.assign({ duration: 0.7 }, opts)); }
          };
          /* search result picked: fly so the item sits in view at street level (zoom 15 or closer), then hand back */
          mapFocus = function (el, done) {
            var it = null;
            items.forEach(function (x) { if (x.el === el) { it = x; } });
            if (!it || dead) { done(); return; }
            stopWheel();
            moved = true; routeMap.classList.add("is-moved");
            var z = Math.max(map.getZoom(), 15);
            if (reduceMotion) { map.setView(it.g, z, { animate: false }); done(); return; }
            map.once("moveend", function () { done(); });
            map.flyTo(it.g, z, { duration: 0.7 });
          };
          /* the tour aims at pins by where they sit, so it starts from home */
          pfView.addEventListener("pf:tour", function (e) { if (e.detail && !dead) { goHome(); } });

          /* ---- pin clusters: pins closer than CL_R px on screen merge into one round marker with their count, its ring split
             by the statuses inside (as the fleet bar of «Статус вывоза»). Grouped again when a zoom lands, when the zoom has
             drifted CL_STEP levels during a wheel glide, and when the filter changes; from zoom CL_OFF up every pin stands
             alone. The selected pin never hides in a cluster; the tour turns clustering off. A click flies into the group. ---- */
          var CL_R = 16, CL_GAP = 4, CL_STEP = 0.35, CL_OFF = 16.5, CL_LIFT = 12, CL_ORDER = ["completed", "in-progress", "assigned", "created", "failed"];
          var pinItems = items.filter(function (it) { return it.el.classList.contains("pf-mpin"); });
          var pinBox = routeMap.querySelector(".pf-map__pins");
          var clBox = document.createElement("div");
          clBox.className = "pf-map__clusters";
          pinBox.parentNode.insertBefore(clBox, pinBox.nextSibling);
          /* each status's pin colour, read from the pins themselves so a cluster ring matches what it stands for */
          var CL_COLOR = {};
          pinItems.forEach(function (it) {
            var st = PF.sites[+it.el.getAttribute("data-pf-site")].pin, u = it.el.querySelector("[fill]:not([fill='none']):not([fill='white'])");
            if (!CL_COLOR[st] && u) { CL_COLOR[st] = u.getAttribute("fill"); }
          });
          var clusters = [], clZoom = null, clOn = true;
          var placeClusters = function (zoom, center) {
            clusters.forEach(function (c) {
              var q = toPx(c.g, zoom, center);
              c.el.style.translate = q.x.toFixed(1) + "px " + (q.y - CL_LIFT).toFixed(1) + "px"; // where the pin heads were, not their tips
            });
          };
          var ring = function (n) {
            var at = 0, total = 0, stops = [];
            CL_ORDER.forEach(function (st) { total += n[st] || 0; });
            CL_ORDER.forEach(function (st) {
              if (!n[st]) { return; }
              var to = at + n[st] / total * 360;
              stops.push((CL_COLOR[st] || "#98A2B3") + " " + at.toFixed(1) + "deg " + to.toFixed(1) + "deg");
              at = to;
            });
            return "conic-gradient(" + stops.join(",") + ")";
          };
          mapCluster = function () {
            if (dead || !shown) { return; }
            var z = map.getZoom();
            clZoom = z;
            var groups = [];
            if (clOn && z < CL_OFF) {
              pinItems.forEach(function (it) {
                var el = it.el;
                if (el.classList.contains("is-filtered") || el.classList.contains("is-active")) { return; }
                var q = map.project(it.g, z), best = null, bd = CL_R;
                groups.forEach(function (gr) { var d = Math.hypot(gr.x - q.x, gr.y - q.y); if (d < bd) { bd = d; best = gr; } });
                if (!best) { groups.push({ x: q.x, y: q.y, m: [it] }); return; }
                best.m.push(it);
                best.x += (q.x - best.x) / best.m.length; best.y += (q.y - best.y) / best.m.length; // the group sits at its mean
              });
              /* pins merge only when closer than CL_R, but a cluster marker is wider than that: any marker that would cover
                 another marker or a pin takes it in, so nothing on the map overlaps (CL_GAP px kept between them) */
              var size = function (k) { return k >= 20 ? 46 : k >= 8 ? 40 : k >= 2 ? 34 : 28; };
              for (var again = true; again;) {
                again = false;
                for (var i = 0; i < groups.length && !again; i++) {
                  for (var j = i + 1; j < groups.length; j++) {
                    var A = groups[i], B = groups[j], na = A.m.length, nb = B.m.length;
                    var near = na < 2 && nb < 2 ? CL_R : (size(na) + size(nb)) / 2 + CL_GAP;
                    if (Math.hypot(A.x - B.x, A.y - B.y) >= near) { continue; }
                    A.x = (A.x * na + B.x * nb) / (na + nb); A.y = (A.y * na + B.y * nb) / (na + nb);
                    A.m = A.m.concat(B.m);
                    groups.splice(j, 1);
                    again = true;
                    break;
                  }
                }
              }
            }
            pinItems.forEach(function (it) { it.el.classList.remove("is-clustered"); });
            clusters.forEach(function (c) { c.el.remove(); });
            clusters = [];
            groups.forEach(function (gr) {
              if (gr.m.length < 2) { return; }
              var n = {};
              gr.m.forEach(function (it) {
                it.el.classList.add("is-clustered");
                var st = PF.sites[+it.el.getAttribute("data-pf-site")].pin;
                n[st] = (n[st] || 0) + 1;
              });
              var b = document.createElement("button"), k = gr.m.length;
              b.type = "button";
              b.className = "pf-mcl" + (k >= 20 ? " pf-mcl--l" : k >= 8 ? " pf-mcl--m" : "");
              b.tabIndex = -1;
              b.setAttribute("aria-label", "Группа площадок, " + k + " — приблизить");
              b.style.setProperty("--ring", ring(n));
              b.innerHTML = '<span class="pf-mcl__n">' + k + "</span>";
              clBox.appendChild(b);
              clusters.push({ el: b, m: gr.m, g: map.unproject(L.point(gr.x, gr.y), z) });
            });
            placeClusters();
          };
          clBox.addEventListener("click", function (e) {
            var b = e.target.closest(".pf-mcl"), c = null;
            clusters.forEach(function (x) { if (x.el === b) { c = x; } });
            if (!c) { return; }
            e.stopPropagation();
            stopWheel();
            moved = true; routeMap.classList.add("is-moved");
            var bounds = L.latLngBounds(c.m.map(function (it) { return it.g; }));
            /* far enough in to split the group (pins at one address stop at CL_OFF, where clustering is off) */
            var opts = { padding: [64, 64], maxZoom: Math.max(Math.min(map.getBoundsZoom(bounds, false, L.point(128, 128)), CL_OFF), map.getZoom() + 1) };
            if (reduceMotion) { map.fitBounds(bounds, opts); } else { map.flyToBounds(bounds, Object.assign({ duration: 0.6 }, opts)); }
          });
          map.on("zoomanim", function (e) { placeClusters(e.zoom, e.center); });
          map.on("move zoom viewreset resize", function () {
            placeClusters();
            if (clZoom !== null && !map._animatingZoom && Math.abs(map.getZoom() - clZoom) > CL_STEP) { mapCluster(); }
          });
          map.on("zoomend viewreset", mapCluster);
          /* a pin picked on the map or from the search comes out of its cluster */
          routeMap.addEventListener("click", function (e) { if (e.target.closest(".pf-mpin, .pf-ms")) { setTimeout(mapCluster, 0); } });
          pfView.addEventListener("pf:tour", function (e) { clOn = !e.detail; mapCluster(); });
          sync();
        })();
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

      /* Route card modal (Figma 19601:36533): opened from a trip row in the truck card. Same scaled-screen dialog pattern as the photo proof.
         Live: close, step between the truck's trips, job checkboxes (enable «Перенести выбранные задания»), «Сохранить» closes.
         The rest mirrors the platform UI and is decorative here. */
      var openRoute = function () {};
      if (pfScr && PF.ui.route) {
        var RU = PF.ui.route;
        var RST = { completed: ["completed", "Выполнено"], enroute: ["in-progress", "Машина в пути"], assigned: ["assigned", "Назначено"] };
        var SHIFT_ST = { active: ["completed", "Смена активна"], done: ["created", "Смена завершена"], plan: ["assigned", "Смена запланирована"] };
        var rm = document.createElement("div");
        rm.className = "pf-pm pf-rm";
        rm.hidden = true;
        rm.innerHTML = '<div class="pf-pm__scrim"></div><div class="pf-pm__card pf-rm__card" role="dialog" aria-modal="true" aria-labelledby="pf-rm-title"></div>';
        pfScr.appendChild(rm);
        var rmCard = rm.querySelector(".pf-rm__card"), rKey = null, rOpener = null, rKeys = [];
        var hm2 = function (v) { return v.length === 4 ? "0" + v : v; };
        var mins = function (v) { var a = v.split(":"); return +a[0] * 60 + +a[1]; };
        var dur = function (a, b) { var d = mins(b) - mins(a); return Math.floor(d / 60) + "ч " + (d % 60) + "м"; };
        var r1 = function (v) { return String(Math.round(v * 10) / 10); };
        var sel = function (v, w) { return RU.select.replace("__V__", esc(v)).replace(/width:__W__(px)?/, "width:" + w + "px"); };
        var deco = function (html) { return html.replace(/<button type="button"/g, '<button type="button" tabindex="-1" aria-hidden="true"'); };
        var truckBtn = function (plate) { return pfView.querySelector('.pf-map__truck[data-pf-truck="' + plate + '"]'); };
        var routeMapHtml = function (r) {
          var live = r.k === "in-progress" && typeof ROUTE_PATHS !== "undefined" && ROUTE_PATHS[r.plate];
          var pinsHtml = live ? r.points.map(function (pt, k) {
            return pt.pin ? '<span class="pf-numpin pf-numpin--' + pt.st + ' pf-rm__pin" style="left:' + pt.pin[0] + "px;top:" + pt.pin[1] + 'px">' + PF.ui.numPin[pt.st] + "<b>" + (k + 1) + "</b></span>" : "";
          }).join("") : "";
          var tb = truckBtn(r.plate), art = tb && tb.querySelector(".pf-map__truckart--off");
          var tHtml = art ? '<span class="pf-rm__truck" style="left:' + tb.style.left + ";top:" + tb.style.top + '">' + art.innerHTML + "</span>" : "";
          var paths = live ? '<svg class="pf-route is-on" width="1600" height="900" aria-hidden="true"><path class="pf-route__past" d="' + live.past + '"/>' +
            '<path class="pf-route__case" d="' + live.plan + '"/><path class="pf-route__plan" d="' + live.plan + '"/></svg>' : "";
          var pos = r.k === "completed" ? 100 : r.k === "assigned" ? 0 : 58;
          return '<div class="pf-rm__map" role="img" aria-label="Карта рейса ' + esc(r.id) + '"><div class="pf-rm__world"><img src="images/platform/map-almaty.webp" width="1600" height="900" alt="">' + paths + pinsHtml + tHtml + "</div>" +
            '<div class="pf-rm__mtools" aria-hidden="true"><span>' + RU.expand + "</span><span>" + RU.eye + "</span><span>" + RU.filter + "</span></div>" +
            (live ? "" : '<p class="pf-rm__mnote caption-m-medium">GPS-трек показан для текущего рейса</p>') +
            '<div class="pf-rm__player" aria-hidden="true"><div class="pf-rm__ptimes"><span class="caption-m-medium">00:00</span><span class="caption-m-medium">Поездка ' + esc(r.id) + '</span><span class="caption-m-medium">23:59:59</span></div>' +
            '<div class="pf-rm__pbar"><span class="pf-rm__play"></span><span class="caption-m-medium">' + hm2(r.k === "completed" ? r.t : r.k === "assigned" ? r.f : "13:32") +
            '</span><span class="pf-rm__track"><i style="width:' + pos + '%"></i></span><b class="caption-m-medium">2X</b></div></div></div>';
        };
        var routeHtml = function (r) {
          var head = r.k === "in-progress" ? badge("in-progress", "В процессе", r.done + "/" + r.total) : r.k === "completed" ? badge("completed", "Выполнен") : badge("assigned", "Назначен", String(r.total));
          var sh = SHIFT_ST[r.shift] || SHIFT_ST.active;
          var vol = r.points.reduce(function (a, pt) { return a + pt.vol; }, 0);
          var jobs = r.points.map(function (pt, k) {
            var st = RST[pt.st], ph = pt.st === "completed";
            return '<div class="pf-rm__job"><span class="pf-rm__idx"><span class="pf-numpin pf-numpin--' + pt.st + '">' + PF.ui.numPin[pt.st] + "<b>" + (k + 1) + "</b></span></span>" +
              RU.check.replace("<input ", '<input data-pf-rcheck aria-label="Выбрать задание ' + pt.id + ", " + esc(pt.addr) + '" ') +
              '<div class="pf-rm__jaddr"><p class="body-m-medium pf-ellipsis">' + esc(pt.addr) + '</p><p class="caption-m-regular pf-muted">' + pt.id + "</p></div>" +
              '<div class="pf-rm__jinfo caption-m-regular pf-muted"><p><span>' + esc(pt.cont.replace(/ · .*/, "")) + "</span><span>" + r1(pt.vol) + " м³</span><span>" + pt.type + '</span></p><p class="pf-ellipsis">' + esc(pt.client) + "</p></div>" +
              '<span class="pf-rm__jst">' + badge(st[0], st[1]) + "</span>" +
              '<span class="pf-rm__jph" role="img" aria-label="' + (ph ? "Фото-отчёт загружен" : "Фото-отчёта ещё нет") + '">' + (ph ? PF.ui.photoOk : PF.ui.photoNo) + "</span>" +
              '<span class="pf-rm__jact" aria-hidden="true">' + RU.del + RU.drag + RU.more + "</span></div>";
          }).join("");
          var done = r.k === "completed";
          var rec = "0232" + String(100 + (mins(r.f) * 7 + r.trip * 131) % 900);
          var val = function (k, v) { return '<span class="pf-rm__wbi"><b class="body-m-medium">' + k + "</b>" + v + "</span>"; };
          var wb = '<div class="pf-rm__wb body-m-regular">' + deco(sel("МСК", 88)) +
            val("Запись №", done ? rec : "—") + (done ? '<span class="pf-rm__wbph" role="img" aria-label="Фото с весовой">' + RU.picture + "</span>" : "") +
            val("Дата и время", done ? "6 Янв 2026 " + hm2(r.t) : "—") + val("Вес нетто", done ? Math.round(vol * 118) + " кг" : "—") +
            val("Объем", done ? r1(vol) + " м³" : "—") + val("Тип отходов", r.vtype === "Мусоровоз ТБО" ? "ТБО" : r.vtype === "Бункеровоз" ? "КГО" : "СО") +
            (done ? "" : '<span class="pf-rm__wbnote pf-muted">Заезд на весовую появится после разгрузки</span>') + "</div>";
          return '<div class="pf-rm__head"><div class="pf-rm__nav">' + RU.prev + RU.next + "</div>" +
            '<div class="pf-rm__title"><p class="pf-pm__h" id="pf-rm-title">' + esc(r.id) + ' <span class="pf-muted">Рейс ' + r.trip + '</span></p><p class="caption-caps-bold pf-muted">Карточка маршрута</p></div>' + head +
            '<div class="pf-rm__times body-m-regular"><span><b class="body-m-medium">Начато</b><i>' + hm2(r.f) + "</i><i>6 Янв 2026</i></span>" +
            '<span><b class="body-m-medium">Закончено</b>' + (done ? "<i>" + hm2(r.t) + "</i><i>6 Янв 2026</i>" : '<i class="pf-muted">--:--</i><i class="pf-muted">--.--.----</i>') + "</span></div>" + RU.close + "</div>" + SEP +
            '<div class="pf-rm__main"><div class="pf-rm__left">' +
            '<div class="pf-rm__veh"><span class="rc-plate rc-plate--large">' + esc(r.plate) + '</span><p class="pf-rm__crew body-m-regular">' +
            r.crew.map(function (c) { return "<span>" + esc(c[1]) + "</span>"; }).join("") + "</p>" + badge(sh[0], sh[1]) + "</div>" +
            '<p class="pf-rm__vsub body-m-regular pf-muted"><span>' + esc(r.model) + "</span><span>" + esc(r.vtype) + "</span><span>" + esc(r.depot) + "</span></p>" +
            '<div class="pf-rm__list"><div class="pf-rm__jobs">' + jobs + '<div class="pf-rm__add">' + deco(RU.add) + "</div></div>" +
            '<div class="pf-rm__unload"><span class="pf-rm__ulabel body-m-medium">Разгрузка</span>' + deco(sel("Полигон Айтей", 260)) +
            '<p class="pf-rm__sum body-m-medium"><span>' + r.total + " " + plural(r.total, "задание", "задания", "заданий") + "</span><span>" + r1(vol) + " м³</span><span>" + dur(r.f, r.t) + " (" + hm2(r.t) + ")</span></p></div></div></div>" +
            routeMapHtml(r) + "</div>" + '<div class="pf-rm__wbwrap">' + wb + "</div>" + SEP +
            '<div class="pf-rm__foot">' + RU.moveBtn + '<div class="pf-rm__acts">' + deco(RU.cancelBtn) + deco(RU.finishBtn) + RU.saveBtn + "</div></div>";
        };
        var placeWorld = function (r) {
          var box = rmCard.querySelector(".pf-rm__map"), world = box.querySelector(".pf-rm__world");
          var W = box.offsetWidth, H = box.offsetHeight, pts = [];
          if (r.k === "in-progress") { r.points.forEach(function (p) { if (p.pin) { pts.push(p.pin); } }); }
          var tb = truckBtn(r.plate);
          if (tb) { pts.push([parseFloat(tb.style.left) + 32, parseFloat(tb.style.top) + 32]); }
          var xs = pts.map(function (p) { return p[0]; }), ys = pts.map(function (p) { return p[1]; });
          var cx = pts.length ? (Math.min.apply(0, xs) + Math.max.apply(0, xs)) / 2 : 800, cy = pts.length ? (Math.min.apply(0, ys) + Math.max.apply(0, ys)) / 2 : 450;
          /* a route wider than the window: keep the truck inside it */
          if (tb) {
            var tx = parseFloat(tb.style.left) + 32, ty = parseFloat(tb.style.top) + 32;
            cx = Math.max(tx - W / 2 + 72, Math.min(tx + W / 2 - 72, cx)); cy = Math.max(ty - H / 2 + 96, Math.min(ty + H / 2 - 96, cy));
          }
          var bx = Math.round(Math.max(Math.min(W / 2 - cx, 0), W - 1600)), by = Math.round(Math.max(Math.min(H / 2 - cy, 0), H - 900));
          world.style.transform = "translate(" + bx + "px," + by + "px)";
        };
        var syncMove = function () {
          var n = rmCard.querySelectorAll("[data-pf-rcheck]:checked").length, b = rmCard.querySelector("[data-pf-rmove]");
          b.disabled = !n;
          var l = b.querySelector("span:not(.rc-icon)") || b;
          l.textContent = "Перенести выбранные задания" + (n ? " (" + n + ")" : "");
        };
        var renderRoute = function (key, focusSel) {
          rKey = key;
          var r = PF.routes[key];
          rmCard.innerHTML = uniqIds(routeHtml(r)).replace(/id="u\d+-pf-rm-title"/, 'id="pf-rm-title"');
          var k = rKeys.indexOf(key);
          rmCard.querySelector('[data-pf-rstep="-1"]').disabled = k <= 0;
          rmCard.querySelector('[data-pf-rstep="1"]').disabled = k >= rKeys.length - 1;
          syncMove();
          placeWorld(r);
          var f = focusSel && rmCard.querySelector(focusSel);
          (f && !f.disabled ? f : rmCard.querySelector("[data-pf-rclose]")).focus({ preventScroll: true });
        };
        var closeRoute = function () {
          rm.hidden = true; pfMainEl.inert = false; if (pfNavEl) { pfNavEl.inert = false; } rKey = null;
          if (rOpener && document.contains(rOpener)) { rOpener.focus({ preventScroll: true }); }
        };
        openRoute = function (key, from) {
          var plate = PF.routes[key].plate;
          rKeys = Object.keys(PF.routes).filter(function (k) { return PF.routes[k].plate === plate && PF.routes[k].k !== "ai"; });
          rOpener = from; rm.hidden = false; pfMainEl.inert = true; if (pfNavEl) { pfNavEl.inert = true; } renderRoute(key);
        };
        rmCard.addEventListener("change", function (e) {
          if (e.target.hasAttribute("data-pf-rcheck")) { e.target.closest(".pf-rm__job").classList.toggle("is-checked", e.target.checked); syncMove(); }
        });
        rmCard.addEventListener("click", function (e) {
          var b = e.target.closest("button");
          if (!b || b.disabled) { return; }
          if (b.hasAttribute("data-pf-rclose") || b.hasAttribute("data-pf-rsave")) { closeRoute(); return; }
          if (b.hasAttribute("data-pf-rstep")) {
            var nk = rKeys[rKeys.indexOf(rKey) + (+b.getAttribute("data-pf-rstep"))];
            if (nk) { renderRoute(nk, '[data-pf-rstep="' + b.getAttribute("data-pf-rstep") + '"]'); }
          }
        });
        rm.addEventListener("click", function (e) { if (e.target.classList.contains("pf-pm__scrim")) { closeRoute(); } });
        rm.addEventListener("keydown", function (e) {
          if (e.key === "Escape") { e.stopPropagation(); closeRoute(); return; }
          if (e.key !== "Tab") { return; }
          var f = Array.prototype.filter.call(rmCard.querySelectorAll("button, input"), function (x) { return !x.disabled && x.tabIndex !== -1 && x.offsetParent !== null; });
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

      /* Gantt job counter: hovering the count next to a plate explains what it counts */
      var gBodies = Array.prototype.slice.call(pfView.querySelectorAll(".pf-gbody"));
      if (gBodies.length && pfScr) {
        var cTip = document.createElement("div");
        cTip.className = "pf-ctip";
        cTip.setAttribute("aria-hidden", "true");
        cTip.hidden = true;
        pfScr.appendChild(cTip);
        var cFor = null;
        var onCount = function (e) {
          var c = e.target.closest("[data-pf-jobs]");
          if (!c || c === cFor) { return; }
          cFor = c;
          var n = +c.getAttribute("data-pf-jobs");
          var byDriver = c.getAttribute("data-pf-who") === "driver";
          cTip.innerHTML = '<p class="body-m-semibold">' + n + " " + plural(n, "задание", "задания", "заданий") + " на день</p>" +
            '<p class="body-m-regular pf-ctip__text">' + (byDriver
              ? "Все задания водителя за день: площадки во всех рейсах его смены — выполненные, текущие и назначенные. "
              : "Все задания машины за день: площадки во всех рейсах смены — выполненные, текущие и назначенные. ") +
            "Предложения AI-диспетчера не входят, пока их не утвердят.</p>" +
            '<p class="caption-m-medium pf-muted">' + esc(c.getAttribute("data-pf-plate")) + " · 6 Янв 2026</p>";
          cTip.hidden = false;
          var sr = pfScr.getBoundingClientRect(), k = sr.width / pfScr.offsetWidth || 1, cr = c.getBoundingClientRect();
          var cx = (cr.left + cr.width / 2 - sr.left) / k, top = (cr.top - sr.top) / k, w = cTip.offsetWidth, h = cTip.offsetHeight;
          var below = top - h - 10 < 16, x = Math.max(16, Math.min(cx - 24, pfScr.offsetWidth - w - 16));
          cTip.classList.toggle("is-below", below);
          cTip.style.left = x + "px";
          cTip.style.top = (below ? (cr.bottom - sr.top) / k + 10 : top - h - 10) + "px";
          cTip.style.setProperty("--ax", (cx - x) + "px");
          cTip.classList.add("is-on");
        };
        var offCount = function (e) {
          var c = e.target.closest("[data-pf-jobs]");
          if (c && !(e.relatedTarget && c.contains(e.relatedTarget))) { cFor = null; cTip.classList.remove("is-on"); cTip.hidden = true; }
        };
        gBodies.forEach(function (gb) {
          gb.addEventListener("pointerover", onCount);
          gb.addEventListener("pointerout", offCount);
          gb.addEventListener("scroll", function () { cFor = null; cTip.hidden = true; }, { passive: true });
        });

        /* Row toggle: «По машинам» shows a row per truck (hover a shift: its driver), «По водителям» a row per driver (hover: its truck) */
        var vBtns = Array.prototype.slice.call(pfView.querySelectorAll("[data-pf-gview]"));
        vBtns.forEach(function (b) {
          b.addEventListener("click", function () {
            var view = b.getAttribute("data-pf-gview"), from = gBodies.filter(function (g) { return !g.hidden; })[0];
            vBtns.forEach(function (x) { var on = x === b; x.classList.toggle("is-selected", on); x.setAttribute("aria-pressed", on ? "true" : "false"); });
            gBodies.forEach(function (g) {
              g.hidden = g.getAttribute("data-pf-gbody") !== view;
              if (!g.hidden && from && from !== g) { g.scrollTop = from.scrollTop; }
            });
            /* keep the selected trip selected in the other view */
            if (activeEl && activeEl.hasAttribute("data-pf-route")) {
              var twin = pfView.querySelector('[data-pf-gbody="' + view + '"] [data-pf-route="' + activeEl.getAttribute("data-pf-route") + '"]');
              if (twin) { activeEl.classList.remove("is-active"); activeEl.removeAttribute("aria-pressed"); activeEl = twin; twin.classList.add("is-active"); twin.setAttribute("aria-pressed", "true"); }
            }
            cFor = null; cTip.hidden = true;
          });
        });
      }

      /* Truck card metrics: hovering «Пробег за смену» / «Расход топлива» explains where the numbers come from */
      var M_TIPS = {
        km: ["Пробег за смену", "Считается по GPS-данным из Wialon: путь машины с начала смены по трекам. Рядом — общий пробег по одометру."],
        fuel: ["Расход топлива", "Расход и остаток топлива в баке считаются по ДУТ (датчику уровня топлива), установленному на машине."]
      };
      if (pfScr) {
        var mTip = document.createElement("div");
        mTip.className = "pf-ctip";
        mTip.setAttribute("aria-hidden", "true");
        mTip.hidden = true;
        pfScr.appendChild(mTip);
        var mFor = null;
        var hideM = function () { mFor = null; mTip.classList.remove("is-on"); mTip.hidden = true; };
        pfView.addEventListener("pointerover", function (e) {
          var c = e.target.closest("[data-pf-metric]");
          if (!c || c === mFor) { return; }
          var t = M_TIPS[c.getAttribute("data-pf-metric")];
          if (!t) { return; }
          mFor = c;
          mTip.innerHTML = '<p class="body-m-semibold">' + t[0] + '</p><p class="body-m-regular pf-ctip__text">' + t[1] + "</p>";
          mTip.hidden = false;
          var sr = pfScr.getBoundingClientRect(), k = sr.width / pfScr.offsetWidth || 1, cr = c.getBoundingClientRect();
          var cx = (cr.left + cr.width / 2 - sr.left) / k, top = (cr.top - sr.top) / k, w = mTip.offsetWidth, h = mTip.offsetHeight;
          var below = top - h - 10 < 16, x = Math.max(16, Math.min(cx - w / 2, pfScr.offsetWidth - w - 16));
          mTip.classList.toggle("is-below", below);
          mTip.style.left = x + "px";
          mTip.style.top = (below ? (cr.bottom - sr.top) / k + 10 : top - h - 10) + "px";
          mTip.style.setProperty("--ax", (cx - x) + "px");
          mTip.classList.add("is-on");
        });
        pfView.addEventListener("pointerout", function (e) {
          var c = e.target.closest("[data-pf-metric]");
          if (c && !(e.relatedTarget && c.contains(e.relatedTarget))) { hideM(); }
        });
        pfView.addEventListener("click", hideM);
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

      /* Schedule tab «Развернуть»: the bottom block grows to 80% of the screen height and the map row shrinks to the rest.
         Expanding closes the upper-right card; going back to the Status tab or starting the tour collapses it again. */
      var xBtn = pfView.querySelector('[data-pf-tools="schedule"] .pf-status__tools--schedule > .pf-contents:last-child > .rc-ibtn');
      if (xBtn && pfMainEl) {
        var xWrap = xBtn.parentElement, xSvg = xBtn.querySelector("svg"), xOpenIcon = xSvg ? xSvg.innerHTML : "";
        var X_PATH = ' stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" stroke="#155DFC"/>';
        var xCloseIcon = ["M21 21L15 15M15 19.8V15H19.8", "M3 21L9 15M4.2 15H9V19.8", "M21 3L15 9M15 4.2V9H19.8", "M3 3L9 9M9 4.2V9H4.2"]
          .map(function (d) { return '<path d="' + d + '"' + X_PATH; }).join("");
        if (xWrap && xWrap.hasAttribute("inert")) { xWrap.removeAttribute("inert"); xWrap.removeAttribute("aria-hidden"); }
        var setExpanded = function (on) {
          if (pfMainEl.classList.contains("is-expanded") === on) { return; }
          pfMainEl.classList.toggle("is-expanded", on);
          xBtn.setAttribute("aria-label", on ? "Свернуть" : "Развернуть");
          xBtn.setAttribute("aria-pressed", on ? "true" : "false");
          if (xSvg) { xSvg.innerHTML = on ? xCloseIcon : xOpenIcon; }
          if (on && !pfTop.classList.contains("is-collapsed")) { showCard(null, null, null); }
        };
        xBtn.setAttribute("aria-pressed", "false");
        xBtn.addEventListener("click", function () { setExpanded(!pfMainEl.classList.contains("is-expanded")); });
        pfView.addEventListener("pf:tabchange", function (e) { if (e.detail !== "schedule") { setExpanded(false); } });
        pfView.addEventListener("pf:tour", function (e) { if (e.detail) { setExpanded(false); } });
        pfView.addEventListener("pf:collapse", function () { setExpanded(false); });
        /* a click on the map (not a drag to pan it) brings the block back to its normal size */
        var xMap = pfTop.querySelector(".pf-map"), xDown = null;
        if (xMap) {
          xMap.addEventListener("pointerdown", function (e) { xDown = [e.clientX, e.clientY]; });
          xMap.addEventListener("click", function (e) {
            if (e.detail && xDown && Math.abs(e.clientX - xDown[0]) + Math.abs(e.clientY - xDown[1]) > 6) { return; }
            if (pfScr && pfScr.classList.contains("is-mapfull")) { return; } // the full-screen map covers the block; leave it as it was
            setExpanded(false);
          });
        }
      }

      pfView.addEventListener("click", function (e) {
        var ph = e.target.closest("[data-pf-photo]");
        if (ph) { var ij = ph.getAttribute("data-pf-photo").split(":"); openProof(+ij[0], +ij[1], ph); return; }
        var rmb = e.target.closest("[data-pf-rmodal]");
        if (rmb) { openRoute(rmb.getAttribute("data-pf-rmodal"), rmb); return; }
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

      /* Map search and filter (the build ships them as decorative DS controls; they come alive here).
         Search: a combobox over sites (name, address, type, clients, job numbers) and trucks (plate, driver). Picking a result
         flies the map to it and opens its card, the same as clicking it. Filter: a popover of site statuses, site types and
         a trucks switch, with live counts; the button shows how many groups narrow the map. A site that the filter hides
         and the search picks brings the filter back to everything. The tour starts from a clear search and filter. */
      var mapTop = pfMap && pfMap.querySelector(".pf-map__top");
      if (mapTop && PF.sites) {
        (function () {
          var searchLbl = mapTop.querySelector(".rc-search"), input = mapTop.querySelector(".rc-search__input");
          var fBtn = mapTop.querySelector(".rc-filterbtn");
          if (!searchLbl || !input || !fBtn) { return; }
          /* search, filter and the expand button (full-screen map, below) become real controls */
          mapTop.removeAttribute("inert"); mapTop.removeAttribute("aria-hidden");
          mapTop.classList.add("is-on");

          var STATUS = [["created", "Неназначено"], ["assigned", "Назначено"], ["in-progress", "Машина в пути"], ["completed", "Выполнено"], ["failed", "Невывоз"]];
          var STATUS_WORD = {}; STATUS.forEach(function (s) { STATUS_WORD[s[0]] = s[1]; });
          var KINDS = [];
          PF.sites.forEach(function (s) { if (KINDS.indexOf(s.kind) < 0) { KINDS.push(s.kind); } });
          var pinEls = Array.prototype.slice.call(pfMap.querySelectorAll("[data-pf-site]"));
          var truckEls = Array.prototype.slice.call(pfMap.querySelectorAll(".pf-map__truck"));
          var pinOf = function (si) { return pfMap.querySelector('[data-pf-site="' + si + '"]'); };
          var miniPin = function (st) { return '<span class="pf-mf__pin" aria-hidden="true">' + PF.ui.sitePin[st] + "</span>"; };
          var norm = function (t) { return String(t || "").toLowerCase().replace(/ё/g, "е").replace(/[«»"]/g, ""); };

          /* ---------- filter ---------- */
          var F = { st: {}, kind: {}, trucks: true };
          var resetF = function () { STATUS.forEach(function (s) { F.st[s[0]] = true; }); KINDS.forEach(function (k) { F.kind[k] = true; }); F.trucks = true; };
          resetF();
          var siteOn = function (s) { return F.st[s.pin] && F.kind[s.kind]; };
          var activeGroups = function () {
            var n = 0;
            if (STATUS.some(function (s) { return !F.st[s[0]]; })) { n++; }
            if (KINDS.some(function (k) { return !F.kind[k]; })) { n++; }
            if (!F.trucks) { n++; }
            return n;
          };
          var fCount = document.createElement("b");
          fCount.className = "pf-mf__count";
          fCount.hidden = true;
          fBtn.appendChild(fCount);
          fBtn.setAttribute("aria-haspopup", "dialog");
          fBtn.setAttribute("aria-expanded", "false");
          fBtn.setAttribute("aria-controls", "pf-mfilter");

          var pop = document.createElement("div");
          pop.className = "pf-mf";
          pop.id = "pf-mfilter";
          pop.setAttribute("role", "dialog");
          pop.setAttribute("aria-label", "Фильтр карты");
          pop.hidden = true;
          var row = function (group, key, label, mark) {
            return '<label class="pf-mf__row"><input type="checkbox" data-mf="' + group + '" value="' + esc(key) + '" checked>' +
              '<span class="pf-mf__box" aria-hidden="true"></span>' + (mark || "") + '<span class="pf-mf__lbl">' + esc(label) + '</span><span class="pf-mf__n" data-mf-n="' + group + ":" + esc(key) + '"></span></label>';
          };
          pop.innerHTML =
            '<fieldset class="pf-mf__set"><legend class="caption-caps-bold pf-muted">Статус площадки</legend>' + STATUS.map(function (s) { return row("st", s[0], s[1], miniPin(s[0])); }).join("") + "</fieldset>" +
            '<fieldset class="pf-mf__set"><legend class="caption-caps-bold pf-muted">Тип площадки</legend>' + KINDS.map(function (k) { return row("kind", k, k); }).join("") + "</fieldset>" +
            '<fieldset class="pf-mf__set"><legend class="caption-caps-bold pf-muted">На карте</legend>' + row("trucks", "1", "Машины") + "</fieldset>" +
            '<div class="pf-mf__foot"><span class="pf-mf__total caption-m-medium pf-muted" aria-live="polite"></span><button type="button" class="pf-mf__reset" data-mf-reset>Сбросить</button></div>';
          mapTop.querySelector(".pf-map__tools").appendChild(pop);

          var applyF = function () {
            var shown = 0;
            pinEls.forEach(function (b) {
              var on = siteOn(PF.sites[+b.getAttribute("data-pf-site")]);
              b.classList.toggle("is-filtered", !on);
              if (on) { shown++; }
            });
            pfMap.classList.toggle("is-notrucks", !F.trucks);
            mapCluster();
            /* keep one reachable tab stop in the pin group */
            var stop = pinEls.filter(function (b) { return b.tabIndex === 0; })[0];
            if (stop && stop.classList.contains("is-filtered")) {
              var next = pinEls.filter(function (b) { return !b.classList.contains("is-filtered"); })[0];
              stop.tabIndex = -1;
              if (next) { next.tabIndex = 0; }
            }
            /* counts: sites of each status / type among those the other group lets through */
            STATUS.forEach(function (s) {
              var n = PF.sites.filter(function (x) { return x.pin === s[0] && F.kind[x.kind]; }).length;
              pop.querySelector('[data-mf-n="st:' + s[0] + '"]').textContent = n;
            });
            KINDS.forEach(function (k) {
              var n = PF.sites.filter(function (x) { return x.kind === k && F.st[x.pin]; }).length;
              pop.querySelector('[data-mf-n="kind:' + k + '"]').textContent = n;
            });
            pop.querySelector('[data-mf-n="trucks:1"]').textContent = truckEls.length;
            Array.prototype.forEach.call(pop.querySelectorAll("[data-mf]"), function (c) {
              var g = c.getAttribute("data-mf");
              c.checked = g === "trucks" ? F.trucks : !!F[g][c.value];
            });
            pop.querySelector(".pf-mf__total").textContent = "Площадок на карте: " + shown + " из " + PF.sites.length;
            var n = activeGroups();
            fBtn.classList.toggle("is-selected", n > 0);
            fCount.hidden = !n;
            fCount.textContent = n;
            fBtn.setAttribute("aria-label", n ? "Фильтр, применено: " + n : "Фильтр");
          };
          pop.addEventListener("change", function (e) {
            var c = e.target.closest("[data-mf]");
            if (!c) { return; }
            var g = c.getAttribute("data-mf");
            if (g === "trucks") { F.trucks = c.checked; } else { F[g][c.value] = c.checked; }
            applyF();
          });
          var openF = function (on) {
            pop.hidden = !on;
            fBtn.setAttribute("aria-expanded", on ? "true" : "false");
            if (on) { closeList(); var first = pop.querySelector("input"); if (first) { first.focus({ preventScroll: true }); } }
          };
          fBtn.addEventListener("click", function (e) { e.stopPropagation(); openF(pop.hidden); });
          pop.addEventListener("click", function (e) {
            e.stopPropagation();
            if (e.target.closest("[data-mf-reset]")) { resetF(); applyF(); }
          });
          pop.addEventListener("keydown", function (e) { if (e.key === "Escape") { e.stopPropagation(); openF(false); fBtn.focus({ preventScroll: true }); } });
          applyF();

          /* ---------- search ---------- */
          var INDEX = PF.sites.map(function (s, si) {
            var hay = [s.name, s.addr, s.kind, STATUS_WORD[s.pin]];
            (s.groups || []).forEach(function (g) { hay.push(g.client); });
            (s.jobs || []).forEach(function (j) { hay.push(j.id); });
            return { kind: "site", si: si, title: s.addr, sub: (s.name !== s.addr ? s.name + " · " : "") + s.kind, st: s.pin, hay: norm(hay.join(" | ")) };
          });
          truckEls.forEach(function (t) {
            var plate = t.getAttribute("data-pf-truck"), driver = t.getAttribute("data-pf-driver") || "";
            var vt = t.getAttribute("data-pf-vtype") || "Мусоровоз ТБО", park = t.classList.contains("is-parked") ? " · в депо" : "";
            INDEX.push({ kind: "truck", el: t, title: plate, sub: driver + " · " + vt + park, hay: norm(plate + " | " + driver + " | машина " + vt + park) });
          });
          var list = document.createElement("ul");
          list.className = "pf-ms";
          list.id = "pf-msearch";
          list.setAttribute("role", "listbox");
          list.setAttribute("aria-label", "Результаты поиска");
          list.hidden = true;
          mapTop.appendChild(list);
          input.setAttribute("role", "combobox");
          input.setAttribute("aria-autocomplete", "list");
          input.setAttribute("aria-expanded", "false");
          input.setAttribute("aria-controls", "pf-msearch");
          input.setAttribute("aria-label", "Поиск по площадкам, адресам и машинам");
          input.setAttribute("autocomplete", "off");
          input.setAttribute("spellcheck", "false");
          input.placeholder = "Адрес, площадка, госномер";
          var hits = [], cur = -1;
          var truckArt = function (t) { var a = t.querySelector(".pf-map__truckart--off"); return a ? a.innerHTML : ""; };
          var mark = function (text, q) {
            var i = norm(text).indexOf(q);
            if (!q || i < 0) { return esc(text); }
            return esc(text.slice(0, i)) + "<mark>" + esc(text.slice(i, i + q.length)) + "</mark>" + esc(text.slice(i + q.length));
          };
          var closeList = function () { list.hidden = true; input.setAttribute("aria-expanded", "false"); input.removeAttribute("aria-activedescendant"); cur = -1; };
          var setCur = function (i) {
            cur = i;
            Array.prototype.forEach.call(list.children, function (li, k) { li.setAttribute("aria-selected", k === i ? "true" : "false"); });
            if (i >= 0 && list.children[i]) { input.setAttribute("aria-activedescendant", list.children[i].id); list.children[i].scrollIntoView({ block: "nearest" }); }
            else { input.removeAttribute("aria-activedescendant"); }
          };
          var render = function () {
            var q = norm(input.value.trim());
            if (!q) { closeList(); return; }
            var words = q.split(/\s+/);
            hits = INDEX.filter(function (x) { return words.every(function (w) { return x.hay.indexOf(w) >= 0; }); })
              .sort(function (a, b) { return (b.hay.indexOf(q) === 0) - (a.hay.indexOf(q) === 0) || (a.kind === "truck" ? -1 : 0) - (b.kind === "truck" ? -1 : 0); })
              .slice(0, 8);
            openF(false);
            list.hidden = false;
            input.setAttribute("aria-expanded", "true");
            if (!hits.length) { list.innerHTML = '<li class="pf-ms__empty" role="presentation">Ничего не найдено</li>'; cur = -1; return; }
            list.innerHTML = hits.map(function (x, i) {
              var ico = x.kind === "truck" ? '<span class="pf-ms__truck" aria-hidden="true">' + truckArt(x.el) + "</span>" : miniPin(x.st);
              var off = x.kind === "site" && !siteOn(PF.sites[x.si]) ? '<span class="pf-ms__off caption-m-medium">скрыта фильтром</span>' : "";
              return '<li class="pf-ms__opt" role="option" id="pf-ms-' + i + '" aria-selected="false" data-ms="' + i + '">' + ico +
                '<span class="pf-ms__txt"><span class="pf-ms__t body-m-medium">' + mark(x.title, words[0]) + '</span><span class="pf-ms__s caption-m-regular pf-muted">' + mark(x.sub, words[0]) + "</span></span>" + off + "</li>";
            }).join("");
            setCur(0);
          };
          var pick = function (x) {
            if (!x) { return; }
            closeList();
            var el = x.kind === "truck" ? x.el : pinOf(x.si);
            if (!el) { return; }
            if (x.kind === "site" && el.classList.contains("is-filtered")) { resetF(); applyF(); }
            if (x.kind === "truck" && !F.trucks) { F.trucks = true; applyF(); }
            input.value = x.title;
            mapFocus(el, function () { el.click(); el.focus({ preventScroll: true }); });
          };
          /* a plate in the schedule (pf:findtruck): fly to that truck and open its card, as a picked search result does */
          pfView.addEventListener("pf:findtruck", function (e) {
            var el = null;
            truckEls.forEach(function (t) { if (t.getAttribute("data-pf-truck") === e.detail) { el = t; } });
            if (!el) { return; }
            if (!F.trucks) { F.trucks = true; applyF(); }
            mapFocus(el, function () { el.click(); });
          });
          input.addEventListener("input", render);
          input.addEventListener("focus", function () { if (input.value.trim()) { render(); } });
          input.addEventListener("keydown", function (e) {
            if (e.key === "ArrowDown" || e.key === "ArrowUp") {
              if (list.hidden) { render(); }
              if (!hits.length) { return; }
              e.preventDefault();
              setCur((cur + (e.key === "ArrowDown" ? 1 : -1) + hits.length) % hits.length);
            } else if (e.key === "Enter") {
              if (!list.hidden && cur >= 0) { e.preventDefault(); pick(hits[cur]); }
            } else if (e.key === "Escape") {
              e.stopPropagation();
              if (!list.hidden) { closeList(); } else { input.value = ""; }
            }
          });
          list.addEventListener("mousedown", function (e) { e.preventDefault(); }); // keep focus in the input while clicking
          list.addEventListener("click", function (e) { var li = e.target.closest("[data-ms]"); if (li) { pick(hits[+li.getAttribute("data-ms")]); } });
          list.addEventListener("pointermove", function (e) { var li = e.target.closest("[data-ms]"); if (li && +li.getAttribute("data-ms") !== cur) { setCur(+li.getAttribute("data-ms")); } });
          input.addEventListener("blur", function () { setTimeout(function () { if (document.activeElement !== input) { closeList(); } }, 0); });

          /* outside clicks close both; the tour starts from a clear map */
          document.addEventListener("click", function (e) {
            if (!pop.hidden && !pop.contains(e.target) && e.target !== fBtn) { openF(false); }
          });
          pfView.addEventListener("pf:tour", function (e) {
            if (!e.detail) { return; }
            openF(false); closeList(); input.value = ""; resetF(); applyF();
          });
        })();
      }

      /* Full-screen map: the map's expand button clears the dashboard instead of going browser-fullscreen. The side nav
         slides out left, the Gantt block down and the upper-right card right (CSS, .is-mapfull), while the map is lifted
         out of its grid cell (a .pf-map-slot keeps the cell, so nothing else reflows) and grows over the whole screen.
         A big × at the bottom of the map, the expand button again, or Escape plays it all backwards into the slot. */
      var fsBtn = mapTop && mapTop.querySelector(".pf-map__tools > .rc-ibtn");
      if (fsBtn && pfMap && pfScr && pfMainEl) {
        (function () {
          var fsStatus = pfMainEl.querySelector(".pf-status");
          var away = [pfNavEl, pfSide, fsStatus].filter(Boolean);
          var slot = null, fsOn = false, fsTimer = 0;
          var fsX = document.createElement("button");
          fsX.type = "button";
          fsX.className = "pf-mapx";
          fsX.setAttribute("aria-label", "Свернуть карту");
          fsX.title = "Свернуть карту";
          fsX.tabIndex = -1;
          fsX.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';
          pfMap.appendChild(fsX);
          fsBtn.removeAttribute("inert"); fsBtn.removeAttribute("aria-hidden"); fsBtn.tabIndex = 0;
          fsBtn.setAttribute("aria-pressed", "false");
          var box = function (r) { pfMap.style.left = r[0] + "px"; pfMap.style.top = r[1] + "px"; pfMap.style.width = r[2] + "px"; pfMap.style.height = r[3] + "px"; };
          var rectOf = function (el) { return [el.offsetLeft, el.offsetTop, el.offsetWidth, el.offsetHeight]; }; // .pf-screen px, unscaled
          var settle = function (ms, fn) { clearTimeout(fsTimer); fsTimer = setTimeout(fn, reduceMotion ? 0 : ms); };
          var setAway = function (on) { away.forEach(function (el) { el.inert = on; }); };
          var open = function () {
            if (fsOn) { return; }
            fsOn = true;
            pfView.dispatchEvent(new CustomEvent("pf:mapfull", { detail: true }));
            if (!slot) {
              /* lift the map out at the exact box it had in the grid */
              var r0 = rectOf(pfMap);
              slot = document.createElement("div");
              slot.className = "pf-map-slot";
              slot.setAttribute("aria-hidden", "true");
              pfMap.parentNode.insertBefore(slot, pfMap);
              pfMap.style.position = "absolute";
              box(r0);
            }
            pfScr.classList.add("is-mapanim");
            void pfMap.offsetWidth; // commit the start box before the transition target
            pfScr.classList.add("is-mapfull");
            var cs = getComputedStyle(pfScr);
            var pl = parseFloat(cs.paddingLeft) || 16, pt = parseFloat(cs.paddingTop) || 16;
            box([pl, pt, pfScr.clientWidth - pl - (parseFloat(cs.paddingRight) || 16), pfScr.clientHeight - pt - (parseFloat(cs.paddingBottom) || 16)]);
            setAway(true);
            fsX.tabIndex = 0;
            fsBtn.setAttribute("aria-label", "Свернуть карту");
            fsBtn.setAttribute("aria-pressed", "true");
            clearTimeout(fsTimer); // a close still settling stays lifted and simply grows again
          };
          var finishClose = function () {
            pfScr.classList.remove("is-mapanim");
            pfMap.style.position = pfMap.style.left = pfMap.style.top = pfMap.style.width = pfMap.style.height = "";
            if (slot) { slot.remove(); slot = null; }
          };
          var close = function (instant) {
            if (!fsOn) { return; }
            fsOn = false;
            var back = pfMap.contains(document.activeElement);
            pfScr.classList.remove("is-mapfull");
            if (slot) { box(rectOf(slot)); } // the slot follows the dashboard (card column, Schedule «Развернуть») while the map is out
            setAway(false);
            fsX.tabIndex = -1;
            fsBtn.setAttribute("aria-label", "Развернуть карту");
            fsBtn.setAttribute("aria-pressed", "false");
            if (back) { fsBtn.focus({ preventScroll: true }); }
            pfView.dispatchEvent(new CustomEvent("pf:mapfull", { detail: false }));
            if (instant) { clearTimeout(fsTimer); finishClose(); } else { settle(720, finishClose); }
          };
          fsBtn.addEventListener("click", function (e) { e.stopPropagation(); if (fsOn) { close(); } else { open(); } });
          fsX.addEventListener("click", function (e) { e.stopPropagation(); close(); });
          fsX.addEventListener("pointerdown", function (e) { e.stopPropagation(); }); // not a drag on the map underneath
          pfView.addEventListener("keydown", function (e) { if (e.key === "Escape" && fsOn && !e.defaultPrevented) { close(); } });
          pfView.addEventListener("pf:tour", function (e) { if (e.detail) { close(true); } });
        })();
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

      /* Schedule plates find their truck on the map. Each plate with a truck on the map becomes a button (before the roving
         focus below collects the Gantt's buttons); an expanded block collapses first so the map has its full height. */
      Array.prototype.forEach.call(pfView.querySelectorAll(".pf-gtruck__plate"), function (sp) {
        var plate = sp.textContent.trim();
        if (!pfView.querySelector('.pf-map__truck[data-pf-truck="' + plate + '"]')) { return; }
        var b = document.createElement("button");
        b.type = "button";
        b.className = sp.className + " pf-gtruck__find";
        b.tabIndex = -1;
        b.textContent = plate;
        b.setAttribute("aria-label", "Найти машину " + plate + " на карте");
        b.title = "Показать на карте";
        sp.parentNode.replaceChild(b, sp);
        b.addEventListener("click", function () {
          var wait = pfMainEl && pfMainEl.classList.contains("is-expanded") ? 340 : 0;
          pfView.dispatchEvent(new CustomEvent("pf:collapse"));
          setTimeout(function () { pfView.dispatchEvent(new CustomEvent("pf:findtruck", { detail: plate })); }, wait);
        });
      });

      /* Roving focus inside the pin group and the Gantt: one tab stop each, arrows move */
      Array.prototype.forEach.call(pfView.querySelectorAll("[data-pf-roving]"), function (group) {
        var all = Array.prototype.filter.call(group.querySelectorAll("button"), function (x) { return !x.closest(".pf-gcard"); });
        group.addEventListener("keydown", function (e) {
          var items = all.filter(function (x) { return !x.classList.contains("is-filtered") && !x.classList.contains("is-clustered"); }); // the map filter and clusters hide pins
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
          if (!b || all.indexOf(b) < 0) { return; }
          all.forEach(function (x) { x.tabIndex = x === b ? 0 : -1; });
        });
      });


      /* ---------- Auto tour: the default way the dashboard presents itself ----------
         A drawn cursor walks the real interface (the same clicks and hover cards a visitor gets) with a narration callout per step.
         A camera zooms in (up to 1.3x) on each feature the first time it appears, and a spotlight dims everything else.
         Cursor, callout, spotlight and prompts live on the unzoomed stage, so they keep their size while the screen zooms.
         A click on the screen pauses and asks: explore yourself or resume. «Попробовать интерфейс самому», Tab into the screen
         or Escape hand over control at once. Starts once when the screen is 35% visible; pauses offscreen and in a hidden tab;
         ends on an invite, not a loop. Reduced motion: no autoplay; the replay link starts it.
         Compact frame (narrow screens, see fitPlatform): the tour is the only way in. The window is a portrait crop the camera
         moves through, the narration sits in a slot under it, and every «explore yourself» exit becomes «close the tour»;
         outside the tour the screen is inert, so a swipe over it scrolls the page. */
      var tourFrame = pfView.closest(".pf-frame"), tourStage = pfView.querySelector(".pf-stage");
      if (pfScr && tourFrame && tourStage && window.Promise && window.requestAnimationFrame) {
        var STOP = { stop: true };
        var T = { on: false, paused: false, held: false, token: 0, anim: null, acting: false, seen: false, hovered: [] };
        var reduceTour = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
        var CAM_MS = 720;

        /* chrome */
        var tWrap = document.createElement("div");
        tWrap.className = "pf-tourwrap";
        pfView.parentNode.insertBefore(tWrap, pfView);
        tWrap.appendChild(pfView);
        /* compact: the narration lives in a slot under the window (it would cover the crop), with a reserved height */
        var tNarr = document.createElement("div");
        tNarr.className = "pf-tour-narr";
        tWrap.appendChild(tNarr);
        var mk = function (cls, html, parent) { var e = document.createElement("div"); e.className = cls; if (html) { e.innerHTML = html; } e.hidden = true; parent.appendChild(e); return e; };
        var tSpot = mk("pf-tour-spot", "", tourStage);
        tSpot.setAttribute("aria-hidden", "true");
        var tShield = mk("pf-tour-shield", "", tourStage);
        var tVeil = mk("pf-tour-veil", "", tourStage);
        var tCur = mk("pf-tour-cursor", '<span class="pf-tour-cursor__ring"></span><svg width="26" height="26" viewBox="0 0 30 30"><path d="M6 3.5v20.2l5.1-4.9 3.6 8.2 3.6-1.6-3.6-8.1 7.1-.4z"/></svg>', tourStage);
        tCur.setAttribute("aria-hidden", "true");
        var tCall = mk("pf-tour-call", "", tourStage);
        tCall.setAttribute("role", "status");
        var tAsk = mk("pf-tour-call pf-tour-ask", '<p class="pf-tour-call__title" id="pf-tour-ask-t">Обзор на паузе</p>' +
          '<p class="pf-tour-call__text pf-no-compact">Хотите изучить интерфейс сами или досмотреть обзор?</p>' +
          '<div class="pf-tour-call__acts"><button type="button" class="btn btn-primary btn-sm pf-no-compact" data-tour-take>Изучить самому</button>' +
          '<button type="button" class="btn btn-quiet btn-sm" data-tour-resume>Продолжить обзор</button>' +
          '<button type="button" class="btn btn-quiet btn-sm pf-only-compact" data-tour-take>Закрыть обзор</button></div>', tourStage);
        tAsk.setAttribute("role", "dialog");
        tAsk.setAttribute("aria-labelledby", "pf-tour-ask-t");
        /* intro gate: before anything moves, the visitor picks — watch the mini-tour or take the wheel.
           The tour is drawn as a route: one stop per step, the same line the dispatcher sees on the map. */
        var GATE_N = 12;
        var gStops = "";
        for (var gi = 0; gi < GATE_N; gi++) { gStops += '<span class="pf-gate__stop" style="--i:' + gi + '"></span>'; }
        var tGate = mk("pf-gate", '<div class="pf-gate__card">' +
          '<p class="pf-gate__title" id="pf-gate-t">Покажем Платформу за 12 шагов</p>' +
          '<p class="pf-gate__text pf-no-compact">Мы подготовили мини-обзор: курсор сам пройдёт по карте, машинам и рейсам и расскажет, что где. А можно сразу кликать самому — интерфейс живой.</p>' +
          '<div class="pf-gate__route" aria-hidden="true"><i class="pf-gate__line"></i>' + gStops + '</div>' +
          '<p class="pf-gate__ends" aria-hidden="true"><span>Карта заданий</span><span>AI-диспетчер</span></p>' +
          '<div class="pf-gate__acts">' +
          '<button type="button" class="pf-gate__btn pf-gate__btn--go" data-gate-watch><svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.6-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z"/></svg><span>Смотреть обзор</span></button>' +
          '<button type="button" class="pf-gate__btn pf-gate__btn--own pf-no-compact" data-tour-take><svg width="18" height="18" viewBox="0 0 30 30" aria-hidden="true"><path d="M6 3.5v20.2l5.1-4.9 3.6 8.2 3.6-1.6-3.6-8.1 7.1-.4z"/></svg><span>Изучу сам</span></button></div>' +
          '<p class="pf-gate__note pf-no-compact">Остановить обзор можно в любой момент — кликом по экрану или клавишей <kbd>Esc</kbd></p></div>', tourStage);
        tGate.setAttribute("role", "dialog");
        tGate.setAttribute("aria-labelledby", "pf-gate-t");
        var tBar = document.createElement("div");
        tBar.className = "pf-tour-bar";
        tBar.hidden = true;
        tBar.innerHTML = '<div class="pf-tour-bar__nav" role="group" aria-label="Шаги обзора">' +
          '<button type="button" class="pf-tour-step" data-tour-step="-1" title="Предыдущий шаг обзора"><svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6l-6 6 6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg><span class="pf-no-compact">Назад</span></button>' +
          '<p class="pf-tour-bar__state"><span>Обзор интерфейса</span><span class="pf-tour-bar__count" aria-live="polite"></span></p>' +
          '<button type="button" class="pf-tour-step" data-tour-step="1" title="Следующий шаг обзора"><span>Далее</span><svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button></div>' +
          '<button type="button" class="btn btn-primary btn-sm pf-no-compact" data-tour-take>Попробовать интерфейс самому</button>' +
          '<button type="button" class="btn btn-quiet btn-sm pf-only-compact" data-tour-take>Закрыть</button>';
        var tPrevBtn = tBar.querySelector('[data-tour-step="-1"]'), tNext = tBar.querySelector('[data-tour-step="1"]');
        var tCount = tBar.querySelector(".pf-tour-bar__count");
        var capEl = tourFrame.querySelector(".pf-caption");
        var tReplay = document.createElement("button");
        tReplay.type = "button";
        tReplay.className = "pf-tour-replay";
        tReplay.textContent = "Смотреть обзор интерфейса";
        /* explore strip: whenever the tour is not running, the caption says plainly that the screen is live */
        var tExplore = document.createElement("p");
        tExplore.className = "pf-explore";
        tExplore.innerHTML = '<span class="pf-explore__badge"><svg width="16" height="16" viewBox="0 0 30 30" aria-hidden="true"><path d="M6 3.5v20.2l5.1-4.9 3.6 8.2 3.6-1.6-3.6-8.1 7.1-.4z"/></svg>Интерфейс кликабельный</span>' +
          '<span class="pf-explore__text">Нажимайте на&nbsp;машины и&nbsp;точки на&nbsp;карте, рейсы и&nbsp;вкладки.</span>';
        if (capEl) { capEl.appendChild(tExplore); capEl.appendChild(tReplay); capEl.appendChild(tBar); capEl.classList.add("has-explore"); } else { tWrap.appendChild(tBar); }

        /* hand-over hints: labelled rings on a few things worth clicking, gone after the first click or a few seconds */
        var tHints = mk("pf-hints", "", tourStage);
        tHints.setAttribute("aria-hidden", "true");
        var hintTimer = 0;
        var hideHints = function () {
          clearTimeout(hintTimer);
          if (tHints.hidden) { return; }
          tHints.classList.remove("is-on");
          setTimeout(function () { if (!tHints.classList.contains("is-on")) { tHints.hidden = true; tHints.innerHTML = ""; } }, 260);
        };
        var showHints = function () {
          var vr = pfView.getBoundingClientRect();
          var picks = [
            ["Машина", '.pf-map [data-pf-truck="714SH02"]'],
            ["Площадка", ".pf-mpin:not([hidden])"],
            ["Рейс", ".pf-trip"],
            ["Вкладка", '[data-pf-tab="schedule"]']
          ];
          var html = "", n = 0;
          picks.forEach(function (pk) {
            var el = pfView.querySelector(pk[1]);
            if (!el) { return; }
            var r = el.getBoundingClientRect();
            var cx = r.left + r.width / 2, cy = r.top + r.height / 2;
            if (!r.width || cx < vr.left + 8 || cx > vr.right - 8 || cy < vr.top + 8 || cy > vr.bottom - 8) { return; }
            var b = stageBox(el);
            var x = Math.round(b.x + b.w / 2), y = Math.round(b.y + b.h / 2);
            var left = false;
            html += '<span class="pf-hint-dot' + (left ? ' is-left' : '') + '" style="left:' + x + 'px;top:' + y + 'px;--i:' + (n++) + '"><span class="pf-hint-dot__ring"></span><span class="pf-hint-dot__label">' + pk[0] + '</span></span>';
          });
          if (!n) { return; }
          tHints.innerHTML = html;
          tHints.hidden = false;
          requestAnimationFrame(function () { tHints.classList.add("is-on"); });
          clearTimeout(hintTimer);
          hintTimer = setTimeout(hideHints, 7000);
        };
        pfView.addEventListener("pointerdown", function () { if (!T.on) { hideHints(); } });
        pfView.addEventListener("keydown", function () { if (!T.on) { hideHints(); } });
        window.addEventListener("resize", hideHints);

        /* geometry: stage px for the overlay, design px for the camera */
        var stageBox = function (el) {
          var s = tourStage.getBoundingClientRect(), r = el.getBoundingClientRect();
          return { x: r.left - s.left, y: r.top - s.top, w: r.width, h: r.height };
        };
        var designBox = function (el) {
          var sr = pfScr.getBoundingClientRect(), k = sr.width / pfScr.offsetWidth || 1, r = el.getBoundingClientRect();
          return { x: (r.left - sr.left) / k, y: (r.top - sr.top) / k, w: r.width / k, h: r.height / k };
        };
        var union = function (bs) {
          var x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
          bs.forEach(function (b) { x0 = Math.min(x0, b.x); y0 = Math.min(y0, b.y); x1 = Math.max(x1, b.x + b.w); y1 = Math.max(y1, b.y + b.h); });
          return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
        };
        var els = function (list) { return list.filter(function (e) { return e && e.getClientRects().length; }); };
        var vis = function (sel, root) {
          var all = (root || pfView).querySelectorAll(sel);
          for (var i = 0; i < all.length; i++) { if (all[i].offsetParent !== null && all[i].getClientRects().length && getComputedStyle(all[i]).visibility !== "hidden") { return all[i]; } }
          return null;
        };

        /* timing that honours pause and cancellation */
        var guard = function (tk) { if (tk !== T.token) { throw STOP; } };
        var sleep = function (ms, tk) {
          return new Promise(function (res, rej) {
            var left = ms, last = performance.now();
            var tick = function (now) {
              if (tk !== T.token) { rej(STOP); return; }
              if (!T.paused) { left -= now - last; }
              last = now;
              if (left <= 0) { res(); } else { requestAnimationFrame(tick); }
            };
            requestAnimationFrame(tick);
          });
        };
        var syncPause = function () {
          T.paused = !onScreen || document.hidden || T.held;
          if (T.anim) { if (T.paused) { T.anim.pause(); } else { T.anim.play(); } }
        };

        /* camera: zoom the scaled screen onto a design-px region, up to CAM_MAX, keeping the screen edge-to-edge.
           The window is the stage: the whole screen on wide frames, a portrait crop on compact ones. There the zoom never
           drops below covering the window (zMin) and tops out at CAM_EFF, the effective scale the old sideways pan used. */
        var CAM_MAX = 1.3, CAM_EFF = 0.72, cam = { z: 1, cx: 800, cy: 490 };
        var compact = function () { return pfView.classList.contains("is-compact"); };
        var pfScale = function () { return parseFloat(getComputedStyle(pfView).getPropertyValue("--pf-s")) || 1; };
        var view = function () { return { w: tourStage.offsetWidth, h: tourStage.offsetHeight }; };
        var zMin = function () {
          var v = view(), s = pfScale();
          return Math.max(1, v.w / (pfScr.offsetWidth * s), v.h / (pfScr.offsetHeight * s));
        };
        var applyCam = function () {
          var s = pfScale(), W = pfScr.offsetWidth, H = pfScr.offsetHeight, z = cam.z, v = view();
          var vw = v.w / (s * z), vh = v.h / (s * z);
          var ox = Math.max(0, Math.min(W - vw, cam.cx - vw / 2)), oy = Math.max(0, Math.min(H - vh, cam.cy - vh / 2));
          pfScr.style.setProperty("--cam-z", String(z));
          pfScr.style.setProperty("--cam-tx", (-ox * s * z).toFixed(2) + "px");
          pfScr.style.setProperty("--cam-ty", (-oy * s * z).toFixed(2) + "px");
        };
        var camTo = function (targets, tk, zmax) {
          guard(tk);
          var W = pfScr.offsetWidth, H = pfScr.offsetHeight, z0 = zMin(), z = z0, cx = W / 2, cy = H / 2;
          var list = targets ? els(targets) : [];
          if (list.length) {
            /* measure at the current camera, then convert to unzoomed design px */
            var b = union(list.map(designBox)), v = view(), s = pfScale();
            var pad = compact() ? 24 : 56, cap = compact() ? Math.max(z0, CAM_EFF / s) : Math.min(zmax || CAM_MAX, CAM_MAX);
            z = Math.max(z0, Math.min(cap, v.w / (s * (b.w + pad * 2)), v.h / (s * (b.h + pad * 2))));
            cx = b.x + b.w / 2; cy = b.y + b.h / 2;
            /* designBox is relative to the zoomed screen's own (unscaled) box, so it is already in design px */
          }
          var moved = Math.abs(z - cam.z) > 0.01 || Math.hypot(cx - cam.cx, cy - cam.cy) > 4;
          cam.z = z; cam.cx = cx; cam.cy = cy;
          pfScr.classList.toggle("is-cam", !reduceTour);
          applyCam();
          return sleep(moved && !reduceTour ? CAM_MS : 0, tk);
        };
        var camReset = function (instant) {
          cam.z = zMin(); cam.cx = pfScr.offsetWidth / 2; cam.cy = pfScr.offsetHeight / 2;
          if (instant) { pfScr.classList.remove("is-cam"); }
          applyCam();
        };
        window.addEventListener("resize", function () { cam.z = Math.max(cam.z, zMin()); applyCam(); });
        /* compact: pan (keeping the zoom) until an element is inside the window, so the cursor never walks off the crop */
        var inView = function (el) {
          var b = stageBox(el), v = view();
          return b.x >= 6 && b.y >= 6 && b.x + b.w <= v.w - 6 && b.y + b.h <= v.h - 6;
        };
        var panTo = function (el, tk) {
          guard(tk);
          if (!compact() || !el || inView(el)) { return Promise.resolve(); }
          var d = designBox(el);
          cam.z = Math.max(cam.z, zMin()); cam.cx = d.x + d.w / 2; cam.cy = d.y + d.h / 2;
          pfScr.classList.toggle("is-cam", !reduceTour);
          applyCam();
          return sleep(reduceTour ? 0 : CAM_MS, tk);
        };

        /* spotlight: a rounded window over the stage, everything else dimmed */
        var spotOn = function (targets) {
          var list = els(targets || []);
          if (!list.length) { tSpot.classList.remove("is-on"); return; }
          var b = union(list.map(stageBox)), p = 8;
          tSpot.style.left = Math.round(b.x - p) + "px"; tSpot.style.top = Math.round(b.y - p) + "px";
          tSpot.style.width = Math.round(b.w + p * 2) + "px"; tSpot.style.height = Math.round(b.h + p * 2) + "px";
          tSpot.hidden = false;
          tSpot.classList.add("is-on");
        };
        var spotOff = function () { tSpot.classList.remove("is-on"); };

        /* acting on the real UI without stealing the visitor's focus or tripping the focus hand-over */
        var act = function (fn) {
          var before = document.activeElement;
          T.acting = true;
          try { fn(); } finally {
            var now = document.activeElement;
            if (now !== before && pfView.contains(now)) {
              if (before && before !== document.body && before.focus && !pfView.contains(before)) { before.focus({ preventScroll: true }); } else if (now.blur) { now.blur(); }
            }
            T.acting = false;
          }
        };
        var pos = { x: 600, y: 300 };
        var setCur = function (x, y) { pos.x = x; pos.y = y; tCur.style.transform = "translate(" + x + "px," + y + "px)"; };
        var moveTo = function (el, tk, ax, ay) {
          guard(tk);
          if (compact() && !inView(el)) { return panTo(el, tk).then(function () { return moveTo(el, tk, ax, ay); }); }
          var b = stageBox(el), x = b.x + b.w * (ax === undefined ? 0.5 : ax), y = b.y + b.h * (ay === undefined ? 0.5 : ay);
          var d = Math.hypot(x - pos.x, y - pos.y);
          if (reduceTour || d < 2 || !tCur.animate) { setCur(x, y); return sleep(reduceTour ? 200 : 0, tk); }
          var a = tCur.animate([{ transform: "translate(" + pos.x + "px," + pos.y + "px)" }, { transform: "translate(" + x + "px," + y + "px)" }],
            { duration: Math.max(360, Math.min(900, 300 + d * 0.6)), easing: "cubic-bezier(.45, 0, .2, 1)", fill: "forwards" });
          T.anim = a;
          if (T.paused) { a.pause(); }
          return a.finished.then(function () { setCur(x, y); a.cancel(); T.anim = null; guard(tk); }, function () { throw STOP; });
        };
        var ring = function () { if (reduceTour) { return; } tCur.classList.remove("is-click"); void tCur.offsetWidth; tCur.classList.add("is-click"); };
        var click = function (el, tk) { guard(tk); ring(); act(function () { el.click(); }); return sleep(320, tk); };
        var ptr = function (el, type, bubbles) {
          var ev;
          try { ev = new PointerEvent(type, { bubbles: bubbles, cancelable: true, pointerType: "mouse", relatedTarget: null }); }
          catch (e) { ev = new MouseEvent(type.replace("pointer", "mouse"), { bubbles: bubbles }); }
          el.dispatchEvent(ev);
        };
        var hover = function (el, tk) {
          guard(tk);
          act(function () { el.classList.add("is-th"); T.hovered.push(el); ptr(el, "pointerover", true); ptr(el, "pointerenter", false); });
          return sleep(150, tk);
        };
        var unhover = function (el) {
          if (!el) { return; }
          el.classList.remove("is-th");
          T.hovered = T.hovered.filter(function (x) { return x !== el; });
          ptr(el, "pointerout", true); ptr(el, "pointerleave", false);
        };
        var clearHovers = function () {
          T.hovered.slice().forEach(unhover);
          var ng = pfView.querySelector(".rc-sidenav__groups");
          if (ng) { ptr(ng, "pointerleave", false); }
        };

        /* narration callout: beside its anchor (stage px) where there is room, else above / below; centred without one */
        var place = function (box, w, h, side) {
          var W = tourStage.offsetWidth, H = tourStage.offsetHeight, g = 22, x, y;
          if (!box) { return { x: (W - w) / 2, y: (H - h) / 2 }; }
          var cy = box.y + box.h / 2;
          var fits = { right: box.x + box.w + g + w <= W - 12, left: box.x - g - w >= 12, below: box.y + box.h + g + h <= H - 12, above: box.y - g - h >= 12 };
          var order = (side ? [side] : []).concat(["right", "left", "below", "above"]);
          var pick = order.filter(function (s) { return fits[s]; })[0];
          if (!pick) { return { x: W - w - 16, y: H - h - 16 }; }
          if (pick === "right" || pick === "left") { x = pick === "right" ? box.x + box.w + g : box.x - g - w; y = cy - h / 2; }
          else { x = box.x + box.w / 2 - w / 2; y = pick === "below" ? box.y + box.h + g : box.y - g - h; }
          return { x: Math.max(12, Math.min(W - w - 12, x)), y: Math.max(12, Math.min(H - h - 12, y)) };
        };
        var say = function (n, title, text, anchor, side) {
          tCall.className = "pf-tour-call" + (anchor === null ? " is-final" : "");
          tCall.innerHTML = (n ? '<p class="pf-tour-call__step">' + n + " из " + STEPS.length + "</p>" : "") +
            '<p class="pf-tour-call__title">' + title + '</p><p class="pf-tour-call__text">' + text + "</p>" +
            (anchor === null ? '<div class="pf-tour-call__acts">' + (compact() ? '<a class="btn btn-primary btn-sm" href="#demo">Запросить демо</a>'
              : '<button type="button" class="btn btn-primary btn-sm" data-tour-take>Попробовать интерфейс самому</button>') +
              '<button type="button" class="btn btn-quiet btn-sm" data-tour-replay>Посмотреть ещё раз</button></div>' : "");
          tCall.hidden = false;
          tCall.classList.remove("is-on");
          if (compact()) {
            tCall.style.left = ""; tCall.style.top = "";
            void tCall.offsetWidth;
            tCall.classList.add("is-on");
            if (n) { tCount.textContent = n + " / " + STEPS.length; }
            return;
          }
          var box = anchor ? (anchor.nodeType ? stageBox(anchor) : anchor) : null;
          var at = place(box, tCall.offsetWidth, tCall.offsetHeight, side);
          tCall.style.left = Math.round(at.x) + "px"; tCall.style.top = Math.round(at.y) + "px";
          void tCall.offsetWidth;
          tCall.classList.add("is-on");
          if (n) { tCount.textContent = n + " / " + STEPS.length; }
        };
        /* compact keeps the last narration in its slot between steps (an empty slot reads as a glitch); force clears it */
        var hush = function (force) { if (!force && T.on && compact()) { return; } tCall.classList.remove("is-on"); tCall.hidden = true; };
        var readFor = function (text) { return Math.max(2400, Math.min(4800, 1100 + text.length * 26)); };
        /* spotlight + callout over the same set of elements */
        var show = function (s, targets, side, tk, extra) {
          if (compact()) {
            return camTo(targets, tk).then(function () {
              spotOn(targets);
              say(s.n, s.t, s.d, undefined, side);
              return sleep(readFor(s.d) + (extra || 0), tk);
            });
          }
          spotOn(targets);
          say(s.n, s.t, s.d, union(els(targets).map(stageBox)), side);
          return sleep(readFor(s.d) + (extra || 0), tk);
        };

        var siteWithProof = function () {
          var map = vis(".pf-map"), mb = map && map.getBoundingClientRect(), best = null;
          Array.prototype.forEach.call(pfView.querySelectorAll("[data-pf-site]"), function (b) {
            if (best) { return; }
            var s = PF.sites[+b.getAttribute("data-pf-site")], r = b.getBoundingClientRect();
            var inside = mb && r.left > mb.left + mb.width * 0.2 && r.right < mb.right - mb.width * 0.12 && r.top > mb.top + mb.height * 0.2 && r.bottom < mb.bottom - mb.height * 0.12;
            if (inside && s.jobs.some(function (j) { return j.proof; })) { best = b; }
          });
          return best || vis("[data-pf-site]");
        };
        var splitShift = function () {
          var row = vis("[data-pf-gbody='truck'] [data-pf-jobs][data-pf-plate='382BHR02']");
          var g = row && row.closest(".pf-grow");
          return (g && g.querySelector(".pf-gshift")) || vis("[data-pf-gbody='truck'] .pf-gshift");
        };
        /* bring a Gantt row into its scroll box before the camera aims at it */
        var reveal = function (el) {
          var box = el && el.closest(".pf-gbody");
          if (!box) { return; }
          var br = box.getBoundingClientRect(), er = el.getBoundingClientRect(), k = br.height / box.clientHeight || 1;
          if (er.top < br.top + 8 || er.bottom > br.bottom - 8) { box.scrollTop += (er.top - br.top) / k - box.clientHeight / 2 + (er.height / k) / 2; }
        };
        var thenAll = function (tk, fns) { return fns.reduce(function (c, f) { return c.then(function () { guard(tk); return f(); }); }, Promise.resolve()); };

        /* the step script */
        var STEPS = [
          { t: "Вся работа МВО в одной системе", d: "14 разделов Платформы: от заданий и маршрутов до весовой, колл-центра и аналитики. Пройдёмся по каждому.",
            go: function (tk, s) {
              var items = Array.prototype.filter.call(pfView.querySelectorAll("[data-pf-nav]"), function (x) { return x.offsetParent !== null; });
              var nav = vis(".rc-sidenav"), prev = null;
              var steps = [
                function () { return camTo(items.slice(0, 5), tk, 1.9); },
                function () { return moveTo(items[0], tk, 0.35, 0.5); },
              ];
              items.forEach(function (it, i) {
                steps.push(function () {
                  /* camera follows down the list: the item, its card and a little context */
                  var b = stageBox(it), H = tourStage.offsetHeight;
                  var inView = b.y > 40 && b.y + b.h < H - 40;
                  var near = items.slice(Math.max(0, i - 1), i + 5);
                  return (inView ? Promise.resolve() : camTo(near, tk, 1.9)).then(function () { return moveTo(it, tk, 0.35, 0.5); });
                });
                steps.push(function () { if (prev) { unhover(prev); } prev = it; return hover(it, tk); });
                steps.push(function () {
                  var card = vis("#pf-navcard");
                  if (compact()) {
                    return camTo([it, card], tk).then(function () {
                      spotOn([it, card]);
                      if (!i) { say(s.n, s.t, s.d); return sleep(readFor(s.d), tk); }
                      var txt = PF.nav[it.getAttribute("data-pf-nav")] || "";
                      return sleep(Math.max(1300, Math.min(2100, 600 + txt.length * 13)), tk);
                    });
                  }
                  spotOn([it, card]);
                  if (!i) { say(s.n, s.t, s.d, union(els([it, card]).map(stageBox)), "right"); return sleep(readFor(s.d), tk); }
                  if (i === 1) { hush(); }
                  var txt = PF.nav[it.getAttribute("data-pf-nav")] || "";
                  return sleep(Math.max(1300, Math.min(2100, 600 + txt.length * 13)), tk);
                });
              });
              steps.push(function () { clearHovers(); spotOff(); hush(); return sleep(200, tk); });
              return thenAll(tk, steps);
            } },
          { t: "Карта заданий за день", d: "Каждая площадка — пин со статусом: неназначено, назначено, машина в пути, выполнено, невывоз. Весь город на одном экране.",
            go: function (tk, s) {
              var map = vis(".pf-map"), pin = siteWithProof();
              return thenAll(tk, [
                function () { return camTo([map], tk, 1.5); },
                function () { return moveTo(pin, tk); },
                function () { return hover(pin, tk); },
                function () { return show(s, [map], "below", tk); },
                function () { unhover(pin); },
              ]);
            } },
          { t: "Карточка площадки", d: "Контейнерные группы, заказчики и все задания площадки на сегодня — с фото-отчётом по каждому вывозу.",
            go: function (tk, s) {
              var pin = siteWithProof();
              return thenAll(tk, [
                function () { spotOff(); hush(); return click(pin, tk); },
                function () { return camTo([vis(".pf-side")], tk, 2); },
                function () { return show(s, [vis(".pf-side")], "left", tk); },
              ]);
            } },
          { t: "Фото до и после вывоза", d: "Водитель снимает площадку в DriverApp до и после вывоза. Диспетчер видит заполненность каждого контейнера и подтверждает работу.",
            go: function (tk, s) {
              var ph = vis("[data-pf-photo]");
              return thenAll(tk, [
                function () { spotOff(); hush(); return moveTo(ph, tk); },
                function () { return click(ph, tk); },
                function () { return camTo(null, tk); },
                function () { return camTo([vis(".pf-pm__fill"), vis(".pf-pm__photos")], tk, 2); },
                function () { return show(s, [vis(".pf-pm__fill"), vis(".pf-pm__photos")], "below", tk); },
                function () { spotOff(); hush(); return camTo(null, tk); },
                function () { var ok = vis("[data-pf-pcheck='ok']"); return moveTo(ok, tk).then(function () { return click(ok, tk); }); },
                function () { spotOn([vis(".pf-pm__check")]); return sleep(1100, tk); },
                function () { spotOff(); var c = vis("[data-pf-pclose]"); return moveTo(c, tk).then(function () { return click(c, tk); }); },
              ]);
            } },
          { t: "Машина на линии", d: "Экипаж, рейсы смены и маршрут на карте: пройденный путь по GPS и оставшиеся точки.",
            go: function (tk, s) {
              var tr = vis('[data-pf-truck="714SH02"]');
              return thenAll(tk, [
                function () { return moveTo(tr, tk); },
                function () { return click(tr, tk); },
                function () { return show(s, [vis(".pf-side"), vis(".pf-route.is-on") ? routeBox() : tr], "below", tk); },
              ]);
            } },
          { t: "Пробег и топливо", d: "Пробег считается по GPS-данным из Wialon, расход и остаток топлива — по датчику уровня топлива (ДУТ).",
            go: function (tk, s) {
              var m = vis('[data-pf-metric="fuel"]');
              return thenAll(tk, [
                function () { spotOff(); hush(); return camTo([vis(".pf-metrics")], tk, 2); },
                function () { return moveTo(m, tk, 0.4, 0.5); },
                function () { return hover(m, tk); },
                function () { return show(s, [vis(".pf-metrics"), ctipEl()], "left", tk); },
                function () { unhover(m); spotOff(); },
              ]);
            } },
          { t: "Карточка маршрута", d: "Точки рейса по порядку, статус и фото каждого задания, трек машины и данные весовой — в одном окне.",
            go: function (tk, s) {
              var trip = vis("[data-pf-rmodal]");
              return thenAll(tk, [
                function () { hush(); return camTo([trip], tk, 2); },
                function () { return moveTo(trip, tk, 0.3, 0.5); },
                function () { return click(trip, tk); },
                function () { return camTo(null, tk); },
                function () { return show(s, [vis(".pf-rm__card")], "right", tk, -600); },
                function () { hush(); return camTo([vis(".pf-rm__jobs")], tk, 2); },
                function () { var job = vis(".pf-rm__job"); return moveTo(job, tk, 0.35, 0.5).then(function () { return hover(job, tk); }); },
                function () { spotOn([vis(".pf-rm__jobs")]); return sleep(2200, tk); },
                function () { clearHovers(); spotOff(); return camTo([vis(".pf-rm__map")], tk, 2); },
                function () { spotOn([vis(".pf-rm__map")]); return sleep(1800, tk); },
                function () { spotOff(); return camTo(null, tk); },
                function () { var nx = vis('[data-pf-rstep="1"]'); return moveTo(nx, tk).then(function () { return click(nx, tk); }); },
                function () { return sleep(1100, tk); },
                function () { var c = vis("[data-pf-rclose]"); return moveTo(c, tk).then(function () { return click(c, tk); }); },
              ]);
            } },
          { t: "Расписание маршрутов", d: "Рейсы всех машин на шкале дня: выполненные, текущие и назначенные. Цвет — статус рейса.",
            go: function (tk, s) {
              var tab = vis('[data-pf-tab="schedule"]');
              return thenAll(tk, [
                function () { return moveTo(tab, tk); },
                function () { return click(tab, tk); },
                function () { return show(s, [vis(".pf-status")], "above", tk); },
              ]);
            } },
          { t: "Смены и экипажи", d: "Рейсы одной смены объединены: наведите — увидите номер смены и водителя. Если машина сменила экипаж, смен будет две.",
            go: function (tk, s) {
              var sh = splitShift(), bar = sh.querySelector("[data-pf-route]"), row = sh.closest(".pf-grow");
              return thenAll(tk, [
                function () { spotOff(); hush(); reveal(row); return camTo([row], tk, 2); },
                function () { return moveTo(bar, tk, 0.35, 0.5); },
                function () { return hover(sh, tk); },
                function () { return show(s, [row, sh.querySelector(".pf-gtip")], "below", tk); },
                function () { unhover(sh); },
              ]);
            } },
          { t: "Сигнал от экипажа", d: "Водитель сообщил о ДТП. Проблема появляется прямо на графике, а реакция — в одно нажатие: связаться с экипажем.",
            go: function (tk, s) {
              var al = vis("[data-pf-gbody='truck'] .pf-galert"), btn = al.querySelector(".pf-galert__btn"), row = al.closest(".pf-grow");
              return thenAll(tk, [
                function () { spotOff(); hush(); reveal(row); return camTo(null, tk); },
                function () { return moveTo(btn, tk); },
                function () { return hover(al, tk); },
                function () { return sleep(200, tk); },
                function () { return camTo([al.querySelector(".pf-gcard"), al.closest(".pf-gtruck")], tk, 2); },
                function () { return show(s, [al.querySelector(".pf-gcard"), al.closest(".pf-gtruck")], "right", tk); },
                function () { hush(); var cta = al.querySelector(".pf-gcard .rc-btn"); return moveTo(cta, tk).then(function () { return click(cta, tk); }); },
                function () { unhover(al); spotOff(); return camTo(null, tk); },
                function () { spotOn([vis(".pf-side")]); return sleep(1300, tk); },
                function () { spotOff(); },
              ]);
            } },
          { t: "Предложение AI-диспетчера", d: "AI предлагает следующий рейс с учётом площадок, типа отходов и подходящей машины. Решение остаётся за диспетчером.",
            go: function (tk, s) {
              var ai = vis("[data-pf-gbody='truck'] .pf-gbar--ai");
              return thenAll(tk, [
                function () { reveal(ai); return camTo([ai], tk, 2); },
                function () { return moveTo(ai, tk, 0.3, 0.5); },
                function () { return click(ai, tk); },
                function () { spotOn([ai]); return sleep(700, tk); },
                function () { return camTo(null, tk); },
                function () { return show(s, [ai, vis(".pf-side")], "left", tk); },
              ]);
            } },
          { t: "По машинам или по водителям", d: "Один переключатель — и график строится по водителям: видно, кто и на какой машине работает смену.",
            go: function (tk, s) {
              var tg = vis("[data-pf-gview='driver']");
              return thenAll(tk, [
                function () { spotOff(); hush(); return camTo([vis(".pf-status__tools--schedule .pf-iseg")], tk, 2); },
                function () { return moveTo(tg, tk); },
                function () { return click(tg, tk); },
                function () { return camTo(null, tk); },
                function () {
                  var dc = vis("[data-pf-gbody='driver'] [data-pf-plate='Ахметжанов Нурбол']"), sh = (dc && dc.closest(".pf-grow").querySelector(".pf-gshift")) || vis("[data-pf-gbody='driver'] .pf-gshift");
                  reveal(sh);
                  return moveTo(sh.querySelector("[data-pf-route]"), tk, 0.3, 0.5).then(function () { return hover(sh, tk); });
                },
                function () { return show(s, [vis(".pf-status")], "above", tk); },
                function () { clearHovers(); spotOff(); },
              ]);
            } },
        ];
        STEPS.forEach(function (s, i) { s.n = i + 1; });
        var routeBox = function () { var svg = vis(".pf-route.is-on"); return svg ? svg.querySelector(".pf-route__plan") : null; };
        var ctipEl = function () { var c = pfScr.querySelectorAll(".pf-ctip"); for (var i = 0; i < c.length; i++) { if (!c[i].hidden) { return c[i]; } } return null; };

        /* default state the tour starts and replays from */
        var closeModals = function () {
          Array.prototype.forEach.call(pfScr.querySelectorAll(".pf-pm:not([hidden])"), function (m) {
            var c = m.querySelector("[data-pf-pclose], [data-pf-rclose]"); if (c) { c.click(); }
          });
        };
        var resetUI = function () {
          act(function () {
            clearHovers(); closeModals();
            var st = pfView.querySelector('[data-pf-tab="status"]'); if (st && st.getAttribute("aria-selected") !== "true") { st.click(); }
            var tv = pfView.querySelector("[data-pf-gview='truck']"); if (tv && tv.getAttribute("aria-pressed") !== "true") { tv.click(); }
            var tr = pfView.querySelector('[data-pf-truck="714SH02"]'); if (tr) { tr.click(); }
            Array.prototype.forEach.call(pfView.querySelectorAll(".pf-gbody"), function (g) { g.scrollTop = 0; });
          });
        };
        var chrome = function (on) {
          T.on = on;
          tBar.hidden = !on; tShield.hidden = !on; tCur.hidden = !on; tSpot.hidden = !on;
          tReplay.hidden = on; tExplore.hidden = on;
          if (on) { hideHints(); }
          tWrap.classList.toggle("is-touring", on);
          if (capEl) { capEl.classList.toggle("is-touring", on); }
          if (on) { pfScr.setAttribute("aria-hidden", "true"); } else { pfScr.removeAttribute("aria-hidden"); }
          pfScr.inert = !on && compact();
          pfView.dispatchEvent(new CustomEvent("pf:tour", { detail: on }));
        };
        var finish = function () {
          chrome(false);
          camReset(false);
          tVeil.hidden = false;
          if (compact()) {
            say(0, "Это лишь часть Платформы", "Остальные разделы покажем на демо. Изучить интерфейс самому можно с компьютера.", null);
          } else {
            say(0, "Это лишь часть Платформы", "Теперь попробуйте сами: кликайте по карте, машинам, рейсам и значкам — каждое действие сопровождается подсказкой.", null);
          }
          var take = tCall.querySelector("[data-tour-take]");
          if (take) { take.focus({ preventScroll: true }); }
        };
        /* what the interface must show before step k (0-based) when the tour jumps there */
        var prep = function (k) {
          act(function () {
            if (k === 3) { var pin = siteWithProof(); if (pin) { pin.click(); } }
            if (k >= 8) { var tab = pfView.querySelector('[data-pf-tab="schedule"]'); if (tab) { tab.click(); } }
          });
        };
        var tourMark = function (k) {
          T.idx = k;
          tCount.textContent = (k + 1) + " / " + STEPS.length;
          tPrevBtn.disabled = k <= 0;
          tNext.disabled = false;
        };
        var gateOff = function () {
          if (tGate.hidden) { return; }
          tGate.classList.remove("is-on"); tVeil.classList.remove("is-gate");
          tGate.hidden = true;
        };
        var gateOn = function () {
          tVeil.hidden = false; tVeil.classList.add("is-gate");
          tGate.hidden = false;
          requestAnimationFrame(function () { requestAnimationFrame(function () { tGate.classList.add("is-on"); }); });
          var w = tGate.querySelector("[data-gate-watch]"); if (w) { w.focus({ preventScroll: true }); }
        };
        var start = function (from) {
          var k0 = Math.max(0, Math.min(STEPS.length - 1, from || 0)), jump = !!from;
          var tk = ++T.token;
          gateOff();
          if (T.anim) { try { T.anim.cancel(); } catch (e) { /* done */ } T.anim = null; }
          T.seen = true; T.held = false; tAsk.hidden = true; tVeil.hidden = true; tCall.classList.remove("is-dim");
          act(function () { clearHovers(); });
          hush(true); spotOff(); camReset(!jump); resetUI(); prep(k0); chrome(true); syncPause();
          if (!jump) { setCur(Math.round(tourStage.offsetWidth * 0.55), Math.round(tourStage.offsetHeight * 0.55)); }
          tourMark(k0);
          var chain = sleep(jump ? 250 : 400, tk);
          STEPS.slice(k0).forEach(function (s, i) {
            chain = chain.then(function () { guard(tk); tourMark(k0 + i); return s.go(tk, s); }).then(function () { guard(tk); return sleep(300, tk); });
          });
          chain.then(function () { clearHovers(); hush(); spotOff(); return sleep(250, tk); })
            .then(function () { finish(); }, function (e) { if (e !== STOP && window.console) { console.error(e); } });
        };
        var stop = function () {
          T.token++;
          gateOff();
          if (T.anim) { try { T.anim.cancel(); } catch (e) { /* done */ } T.anim = null; }
          T.held = false; tAsk.hidden = true; tVeil.hidden = true;
          act(function () { clearHovers(); closeModals(); });
          hush(true); spotOff(); camReset(false); chrome(false); syncPause();
        };
        var takeControl = function () {
          stop();
          if (compact()) { return; }
          setTimeout(showHints, 760);
          var first = pfView.querySelector('[data-pf-tab][aria-selected="true"]');
          if (first) { first.focus({ preventScroll: true }); }
        };
        /* a click on the screen pauses and asks */
        var hold = function () {
          if (!T.on || T.held) { return; }
          T.held = true; syncPause();
          tCall.classList.add("is-dim");
          tVeil.hidden = false;
          tAsk.hidden = false;
          var w = tAsk.offsetWidth, h = tAsk.offsetHeight;
          tAsk.style.left = Math.round((tourStage.offsetWidth - w) / 2) + "px"; tAsk.style.top = Math.round((tourStage.offsetHeight - h) / 2) + "px";
          tAsk.classList.add("is-on");
          tAsk.querySelector("[data-tour-resume]").focus({ preventScroll: true });
        };
        var resume = function () {
          T.held = false; tAsk.hidden = true; tVeil.hidden = true; tAsk.classList.remove("is-on"); tCall.classList.remove("is-dim"); syncPause();
          var b = tBar.querySelector("[data-tour-take]"); if (b) { b.focus({ preventScroll: true }); }
        };

        tourFrame.addEventListener("click", function (e) {
          if (e.target.closest("[data-tour-take]")) { takeControl(); return; }
          if (e.target.closest("[data-gate-watch]")) { start(); return; }
          if (e.target.closest("[data-tour-resume]")) { resume(); return; }
          if (e.target.closest("[data-tour-replay]")) { hush(true); start(); }
        });
        tReplay.addEventListener("click", function () { start(); });
        /* step back / forward: restart the script at the neighbouring step; past the last one comes the invite */
        tBar.addEventListener("click", function (e) {
          var b = e.target.closest("[data-tour-step]");
          if (!b || b.disabled || !T.on) { return; }
          var k = (T.idx || 0) + (+b.getAttribute("data-tour-step"));
          if (k >= STEPS.length) { stopToInvite(); return; }
          start(Math.max(0, k));
          b.focus({ preventScroll: true });
        });
        var stopToInvite = function () {
          T.token++;
          if (T.anim) { try { T.anim.cancel(); } catch (e) { /* done */ } T.anim = null; }
          T.held = false; tAsk.hidden = true;
          act(function () { clearHovers(); closeModals(); });
          hush(true); spotOff(); finish();
        };
        /* a press pauses on wide frames; compact waits for a tap (click), so a swipe over the window just scrolls the page */
        tShield.addEventListener("pointerdown", function (e) { if (compact()) { return; } e.preventDefault(); hold(); });
        tShield.addEventListener("click", function () { if (compact()) { hold(); } });
        tVeil.addEventListener("click", function () { if (T.held) { resume(); } else { takeControl(); } });
        pfScr.addEventListener("focusin", function (e) { if (T.on && !T.acting) { stop(); } });
        document.addEventListener("keydown", function (e) {
          if (e.key !== "Escape") { return; }
          if (!tGate.hidden) { takeControl(); return; }
          if (T.held) { resume(); return; }
          if (T.on) { takeControl(); }
        });

        /* frame mode: the narration moves between the stage (wide) and the slot under the window (compact); a switch mid-tour
           ends the tour, and at rest the camera sits at its overview for the current window */
        var syncCompact = function () {
          var c = compact(), host = c ? tNarr : tourStage;
          if (tCall.parentNode !== host) {
            if (T.on || !tCall.hidden) { stop(); }
            host.appendChild(tCall);
          }
          if (!T.on) { pfScr.inert = c; camReset(true); }
        };
        pfView.addEventListener("pf:fit", syncCompact);
        syncCompact();

        /* pause offscreen and in a hidden tab; start once on first view */
        var onScreen = false, gateWait = 0;
        document.addEventListener("visibilitychange", syncPause);
        if ("IntersectionObserver" in window) {
          observeWhenShown(new IntersectionObserver(function (es) {
            var e0 = es[0];
            onScreen = e0.isIntersecting && e0.intersectionRatio >= 0.35;
            /* "on the interface": most of the screen visible, or it fills most of the window */
            var onIt = e0.isIntersecting && (e0.intersectionRatio >= 0.8 || e0.intersectionRect.height >= window.innerHeight * 0.7);
            syncPause();
            /* first arrival: ask first, never autoplay; the gate is a choice, so reduced motion gets it too */
            /* seen only once the gate has really opened: scrolling past within the 400 ms must not use up the offer */
            if (onIt && !T.seen && !gateWait) {
              gateWait = setTimeout(function () {
                gateWait = 0;
                if (onScreen && !T.on && !T.seen && !document.hidden) { T.seen = true; gateOn(); }
              }, 400);
            }
          }, { threshold: [0, 0.35, 0.5, 0.6, 0.7, 0.8, 0.9, 1] }), pfView);
        } else { onScreen = true; }
      }
    }
  }
})(window.Raccoon);
