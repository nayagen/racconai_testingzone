// Табель HR page (tabel.html): the month timesheet screen and the one-exception card.
// The data and its rules follow the handoff's Main.dc.html prototype (teams, generated schedules, norms 12 h for drivers
// and 10 h for loaders, mileage and fuel for drivers only). The screen is drawn here into [data-tb-main]; the side nav
// beside it is server-rendered (tools/tabel-block). Saving the exception card closes the same day in the grid.

(function () {
  "use strict";

  /* RaccoonDS icon SVGs, server-rendered by tools/tabel-block/build-tabel.js and put here by splice.js. */
  var ICON = /* tb:icons */{"chevron-left":"<svg width=\"20\" height=\"20\" viewBox=\"0 0 24 24\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\"><path d=\"M15 18L9 12L15 6\" stroke=\"currentColor\" stroke-width=\"1.25\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill=\"none\"/></svg>","chevron-right":"<svg width=\"20\" height=\"20\" viewBox=\"0 0 24 24\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\"><path d=\"M9 18L15 12L9 6\" stroke=\"currentColor\" stroke-width=\"1.25\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill=\"none\"/></svg>","chevron-down":"<svg width=\"20\" height=\"20\" viewBox=\"0 0 24 24\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\"><path d=\"M6 9L12 15L18 9\" stroke=\"currentColor\" stroke-width=\"1.25\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill=\"none\"/></svg>","tear-off-calendar":"<svg width=\"20\" height=\"20\" viewBox=\"0 0 24 24\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\"><path d=\"M6.91 2C6.49 2 6.13 2.36 6.13 2.79V3.58H3.78C3.33 3.58 3 3.92 3 4.38V7.15H21V4.38C21 3.92 20.67 3.58 20.22 3.58H17.87V2.79C17.87 2.36 17.51 2 17.09 2H16.3C15.88 2 15.52 2.36 15.52 2.79V3.58H8.48V2.79C8.48 2.36 8.12 2 7.7 2H6.91ZM6.91 2.79H7.7V5.17H6.91V2.79ZM16.3 2.79H17.09V5.17H16.3V2.79ZM3 7.94V20.21C3 20.65 3.35 21 3.78 21H20.22C20.65 21 21 20.65 21 20.21V7.94H3ZM6.91 10.31H8.87V12.29H6.91V10.31ZM9.65 10.31H11.61V12.29H9.65V10.31ZM12.39 10.31H14.35V12.29H12.39V10.31ZM15.13 10.31H17.09V12.29H15.13V10.31ZM6.91 13.08H8.87V15.06H6.91V13.08ZM9.65 13.08H11.61V15.06H9.65V13.08ZM15.13 13.08H17.09V15.06H15.13V13.08ZM6.91 15.85H8.87V17.83H6.91V15.85ZM9.65 15.85H11.61V17.83H9.65V15.85ZM12.39 15.85H14.35V17.83H12.39V15.85ZM15.13 15.85H17.09V17.83H15.13V15.85Z\" fill=\"currentColor\"/></svg>","search":"<svg width=\"20\" height=\"20\" viewBox=\"0 0 24 24\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\"><path d=\"M10.4 2.4C5.99 2.4 2.4 5.99 2.4 10.4C2.4 14.81 5.99 18.4 10.4 18.4C12.32 18.4 14.08 17.72 15.46 16.59L20.23 21.37C20.31 21.44 20.4 21.5 20.49 21.55C20.59 21.59 20.7 21.61 20.8 21.61C20.91 21.61 21.02 21.59 21.11 21.55C21.21 21.51 21.3 21.45 21.38 21.38C21.45 21.3 21.51 21.21 21.55 21.11C21.59 21.02 21.61 20.91 21.61 20.8C21.61 20.7 21.59 20.59 21.55 20.49C21.5 20.4 21.44 20.31 21.37 20.23L16.59 15.46C17.72 14.08 18.4 12.32 18.4 10.4C18.4 5.99 14.81 2.4 10.4 2.4ZM10.4 4C13.94 4 16.8 6.86 16.8 10.4C16.8 13.94 13.94 16.8 10.4 16.8C6.86 16.8 4 13.94 4 10.4C4 6.86 6.86 4 10.4 4Z\" fill=\"currentColor\"/></svg>","settings":"<svg width=\"20\" height=\"20\" viewBox=\"0 0 24 24\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\"><path d=\"M12 1.6C11.56 1.6 11.2 1.96 11.2 2.4V2.54C11.2 2.92 10.93 3.26 10.55 3.32C10.37 3.35 10.19 3.39 10.01 3.43C9.64 3.51 9.26 3.3 9.12 2.95L9.06 2.83C8.9 2.42 8.43 2.22 8.02 2.39C7.61 2.56 7.42 3.03 7.59 3.44L7.64 3.57C7.79 3.92 7.67 4.33 7.34 4.54C7.19 4.63 7.03 4.74 6.88 4.84C6.57 5.06 6.14 5.01 5.88 4.74L5.78 4.65C5.47 4.33 4.96 4.33 4.65 4.65C4.33 4.96 4.33 5.47 4.65 5.78L4.74 5.88C5.01 6.14 5.06 6.57 4.84 6.88C4.74 7.03 4.63 7.19 4.54 7.34C4.33 7.67 3.92 7.79 3.56 7.64L3.44 7.59C3.03 7.42 2.56 7.61 2.39 8.02C2.22 8.43 2.42 8.9 2.82 9.07L2.95 9.12C3.3 9.26 3.51 9.64 3.43 10.01C3.39 10.19 3.35 10.37 3.32 10.55C3.26 10.93 2.92 11.2 2.54 11.2H2.4C1.96 11.2 1.6 11.56 1.6 12C1.6 12.44 1.96 12.8 2.4 12.8H2.54C2.92 12.8 3.26 13.07 3.32 13.45C3.35 13.63 3.39 13.81 3.43 13.99C3.51 14.36 3.3 14.74 2.95 14.88L2.83 14.94C2.42 15.1 2.22 15.57 2.39 15.98C2.56 16.39 3.03 16.58 3.44 16.41L3.57 16.36C3.92 16.21 4.34 16.33 4.54 16.66C4.64 16.81 4.74 16.97 4.84 17.12C5.07 17.43 5.02 17.86 4.75 18.13L4.65 18.22C4.33 18.54 4.33 19.04 4.65 19.35C4.96 19.67 5.47 19.67 5.78 19.35L5.88 19.26C6.15 18.99 6.57 18.94 6.88 19.16C7.03 19.27 7.19 19.37 7.35 19.47C7.67 19.67 7.79 20.08 7.64 20.44L7.59 20.56C7.42 20.97 7.61 21.44 8.02 21.61C8.43 21.78 8.9 21.59 9.07 21.18L9.12 21.05C9.26 20.7 9.64 20.49 10.01 20.58C10.19 20.62 10.37 20.65 10.55 20.68C10.93 20.74 11.2 21.08 11.2 21.46V21.6C11.2 22.04 11.56 22.4 12 22.4C12.44 22.4 12.8 22.04 12.8 21.6V21.46C12.8 21.08 13.07 20.74 13.45 20.68C13.63 20.65 13.81 20.61 13.99 20.57C14.36 20.49 14.74 20.7 14.88 21.05L14.94 21.18C15.1 21.58 15.57 21.78 15.98 21.61C16.39 21.44 16.58 20.97 16.41 20.56L16.36 20.43C16.21 20.08 16.33 19.66 16.66 19.46C16.81 19.36 16.97 19.26 17.12 19.16C17.43 18.93 17.86 18.99 18.13 19.25L18.22 19.35C18.54 19.67 19.04 19.67 19.35 19.35C19.67 19.04 19.67 18.53 19.35 18.22L19.26 18.12C18.99 17.85 18.94 17.43 19.16 17.12C19.27 16.97 19.37 16.81 19.47 16.65C19.67 16.33 20.08 16.21 20.44 16.36L20.56 16.41C20.97 16.58 21.44 16.39 21.61 15.98C21.78 15.57 21.59 15.1 21.18 14.93L21.05 14.88C20.7 14.74 20.49 14.36 20.58 13.99C20.62 13.81 20.65 13.63 20.68 13.45C20.74 13.07 21.08 12.8 21.46 12.8H21.6C22.04 12.8 22.4 12.44 22.4 12C22.4 11.56 22.04 11.2 21.6 11.2H21.46C21.08 11.2 20.74 10.93 20.68 10.55C20.65 10.37 20.61 10.19 20.57 10.01C20.49 9.64 20.7 9.26 21.05 9.12L21.18 9.06C21.58 8.9 21.78 8.43 21.61 8.02C21.44 7.61 20.97 7.42 20.56 7.59L20.43 7.64C20.08 7.79 19.66 7.67 19.46 7.34C19.36 7.19 19.26 7.03 19.16 6.88C18.93 6.57 18.99 6.14 19.25 5.87L19.35 5.78C19.67 5.46 19.67 4.96 19.35 4.65C19.04 4.33 18.53 4.33 18.22 4.65L18.13 4.74C17.86 5.01 17.43 5.07 17.12 4.84C16.97 4.74 16.81 4.63 16.65 4.54C16.33 4.33 16.21 3.92 16.36 3.56L16.41 3.44C16.58 3.03 16.39 2.56 15.98 2.39C15.57 2.22 15.1 2.42 14.93 2.82L14.88 2.95C14.74 3.3 14.36 3.51 13.99 3.43C13.81 3.39 13.63 3.35 13.45 3.32C13.07 3.26 12.8 2.92 12.8 2.54V2.4C12.8 1.96 12.44 1.6 12 1.6ZM12 5.6C15.26 5.6 17.95 8.04 18.35 11.2H13.38C13.24 10.96 13.04 10.76 12.8 10.62C12.56 10.47 12.28 10.4 12 10.4C12 10.4 12 10.4 12 10.4L9.52 6.1C10.28 5.78 11.12 5.6 12 5.6ZM8.14 6.91L10.62 11.2C10.47 11.44 10.4 11.72 10.4 12C10.4 12.28 10.48 12.55 10.62 12.8L8.13 17.09C6.6 15.92 5.6 14.08 5.6 12C5.6 9.92 6.6 8.08 8.14 6.91ZM13.38 12.8H18.35C17.95 15.96 15.26 18.4 12 18.4C11.12 18.4 10.28 18.22 9.52 17.9L12 13.6C12 13.6 12 13.6 12 13.6C12.28 13.6 12.56 13.53 12.8 13.39C13.04 13.24 13.24 13.04 13.38 12.8Z\" fill=\"currentColor\"/></svg>","cancel":"<svg width=\"20\" height=\"20\" viewBox=\"0 0 24 24\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\"><circle cx=\"12\" cy=\"12\" r=\"6\" fill=\"white\"/><path d=\"M12 3C7.03 3 3 7.03 3 12C3 16.97 7.03 21 12 21C16.97 21 21 16.97 21 12C21 7.03 16.97 3 12 3ZM13.06 12C13.06 12 15.41 14.35 15.53 14.47C15.82 14.76 15.82 15.24 15.53 15.53C15.24 15.82 14.76 15.82 14.47 15.53C14.35 15.42 12 13.06 12 13.06C12 13.06 9.65 15.41 9.53 15.53C9.24 15.82 8.76 15.82 8.47 15.53C8.18 15.24 8.18 14.76 8.47 14.47C8.58 14.35 10.94 12 10.94 12C10.94 12 8.59 9.65 8.47 9.53C8.18 9.24 8.18 8.76 8.47 8.47C8.76 8.18 9.24 8.18 9.53 8.47C9.65 8.58 12 10.94 12 10.94C12 10.94 14.35 8.59 14.47 8.47C14.76 8.18 15.24 8.18 15.53 8.47C15.82 8.76 15.82 9.24 15.53 9.53C15.42 9.65 13.06 12 13.06 12Z\" fill=\"currentColor\"/></svg>","check":"<svg width=\"20\" height=\"20\" viewBox=\"0 0 24 24\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\"><path d=\"M20 6L9 17L4 12\" stroke-width=\"2.25\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke=\"currentColor\"/></svg>","download":"<svg width=\"20\" height=\"20\" viewBox=\"0 0 24 24\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\"><circle cx=\"12\" cy=\"12\" r=\"9\" fill=\"white\"/><path d=\"M12 21.6C17.3 21.6 21.6 17.3 21.6 12C21.6 6.7 17.3 2.4 12 2.4C6.7 2.4 2.4 6.7 2.4 12C2.4 17.3 6.7 21.6 12 21.6ZM8.23 13.03C8.55 12.72 9.05 12.72 9.37 13.03L11.2 14.87V7.2C11.2 6.76 11.56 6.4 12 6.4C12.44 6.4 12.8 6.76 12.8 7.2V14.87L14.63 13.03C14.95 12.72 15.45 12.72 15.77 13.03C16.08 13.35 16.08 13.85 15.77 14.17L12.57 17.37C12.41 17.52 12.2 17.6 12 17.6C11.8 17.6 11.59 17.52 11.43 17.37L8.23 14.17C7.92 13.85 7.92 13.35 8.23 13.03Z\" fill=\"currentColor\"/></svg>"}/* /tb:icons */;
  function ic(name, size) {
    size = size || 20;
    var svg = (ICON[name] || "").replace(/width="20" height="20"/, 'width="' + size + '" height="' + size + '"');
    return '<span class="rc-icon" style="width:' + size + "px;height:" + size + 'px" aria-hidden="true">' + svg + "</span>";
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Opener: the day assembles once, on first view ---------- */
  var dayCard = document.querySelector("[data-day-card]");
  if (dayCard && !reduceMotion && "IntersectionObserver" in window) {
    var dio = new IntersectionObserver(function (ents) {
      if (!ents[0].isIntersecting) { return; }
      dio.disconnect();
      dayCard.classList.add("tb-play");
    }, { threshold: 0.5 });
    dio.observe(dayCard);
  }

  var main = document.querySelector("[data-tb-main]");
  var screen = document.querySelector("[data-tb-screen]");
  var frame = document.querySelector("[data-tb-frame]");
  if (!main || !screen || !frame) { return; }

  /* ---------- Data (as in the handoff prototype) ---------- */
  var TODAY = "2026-10-28";
  var MON = ["Янв", "Фев", "Мар", "Апр", "Май", "Июн", "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек"];
  var MONF = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];
  var WK = ["вс", "пн", "вт", "ср", "чт", "пт", "сб"];

  var TEAMS = [
    ["rear", "Мусоровозы — задняя загрузка", 16],
    ["side", "Мусоровозы — боковая загрузка", 10],
    ["front", "Мусоровозы — фронтальная загрузка", 6],
    ["bunker", "Бункеровозы", 12],
    ["hook", "Мультилифты (крюковые)", 9],
    ["dump", "Самосвалы (СО)", 7],
    ["loaders", "Грузчики", 4]
  ];
  var NAMED = {
    rear: [["Ахметов Бауыржан", "0412", "12.3,12.0,~В,~В,11.8,12.5,!12.9,12.1,11.9,~В,~В,12.2,12.0,12.4"],
           ["Сериков Данияр", "0417", "11.5,!11.9,~В,~В,12.0,11.7,12.2,12.0,12.3,~В,~В,11.9,12.1,12.0"]],
    bunker: [["Нурланов Ерлан", "0433", "~ОТ,~ОТ,~ОТ,~ОТ,~ОТ,~ОТ,~ОТ,12.1,12.0,~В,~В,11.8,12.2,12.0"],
             ["Ким Виктор", "0451", "12.0,12.1,~В,~В,~Б,~Б,~Б,12.0,!13.6,~В,~В,12.2,11.8,12.0"]]
  };
  var LOADERS = [
    ["Касымов Арман", "1102", "10.2,10.5,~В,~В,!9.8,10.1,10.4,10.0,10.6,~В,~В,10.3,!10.9,10.1"],
    ["Абдрахманов Марат", "1108", "10.0,10.4,~В,~В,10.2,10.1,~НН,10.5,10.3,~В,~В,10.0,10.2,10.4"],
    ["Жумабаев Нурсултан", "1115", "!10.1,10.3,~В,~В,10.0,10.2,10.4,10.1,10.0,~В,~В,10.2,10.3,10.0"],
    ["Исаев Тимур", "1121", "10.4,!10.2,~В,~В,10.0,10.8,10.1,10.3,10.2,~В,~В,10.5,10.0,!—"]
  ];
  var SUR = ["Абенов", "Байжанов", "Бекмуратов", "Габдуллин", "Досанов", "Ергалиев", "Жакупов", "Жунусов", "Исмаилов", "Кайратов", "Калиев", "Кенжебаев", "Ковалёв", "Кузнецов", "Мамырбеков", "Мукашев", "Нургалиев", "Оспанов", "Петренко", "Рахимов", "Сагындыков", "Сарсенов", "Смагулов", "Тлеубаев", "Токтаров", "Уразбаев", "Хамитов", "Шайхин", "Шевченко", "Юсупов"];
  var FST = ["Айдос", "Бекзат", "Владимир", "Галым", "Дамир", "Ержан", "Жандос", "Ильяс", "Канат", "Мейрам", "Нурлан", "Олжас", "Павел", "Руслан", "Самат", "Талгат", "Улан", "Фархат", "Шерхан", "Эльдар"];

  function pd(iso) { var a = iso.split("-"); return new Date(Date.UTC(+a[0], +a[1] - 1, +a[2])); }
  function iso(d) { return d.toISOString().slice(0, 10); }

  var state = { y: 2026, m: 9, metric: "h", role: "all", onlyFlags: false, q: "", closed: {}, resolved: {} };

  function periodDays() {
    var out = [], d = new Date(Date.UTC(state.y, state.m, 1));
    while (d.getUTCMonth() === state.m) {
      var w = WK[d.getUTCDay()], n = d.getUTCDate();
      out.push({ n: n, w: w, we: w === "сб" || w === "вс", iso: iso(d) });
      d.setUTCDate(n + 1);
    }
    return out;
  }
  function isOpenPeriod() { return state.y === 2026 && state.m === 9; }

  function extend(str, role, days) {
    var base = str.split(","), out = [], norm = role === "Водитель" ? "12.0" : "10.0";
    for (var d = 0; d < days.length; d++) {
      var s = base[d % base.length];
      if (d >= base.length && s.charAt(0) === "!") { s = s.slice(1); }
      if (days[d].we) { out.push(s.charAt(0) === "~" && s !== "~В" ? s : "~В"); continue; }
      if (s === "~В" || (d >= base.length && (s === "—" || s.charAt(0) === "~"))) { s = norm; }
      out.push(s);
    }
    return out;
  }
  function genDays(k, days) {
    var out = [], sched = k % 3;
    for (var d = 0; d < days.length; d++) {
      var off = sched === 0 ? days[d].we : (sched === 1 ? days[d].w === "вс" : Math.floor((d + k) / 2) % 2 === 1);
      if (off) { out.push("~В"); continue; }
      if (k % 11 === 3 && d >= 9 && d <= 22) { out.push("~ОТ"); continue; }
      if (k % 17 === 6 && d >= 5 && d <= 7) { out.push("~Б"); continue; }
      if (k % 29 === 10 && d === 15) { out.push("~НН"); continue; }
      var h = (11 + ((k * 13 + d * 7) % 23) / 10).toFixed(1);
      out.push(((k * 31 + d * 17) % 97 === 0 && d < days.length - 5 ? "!" : "") + h);
    }
    return out.join(",");
  }

  function people(days) {
    var raw = [], k = 0;
    TEAMS.forEach(function (t) {
      if (t[0] === "loaders") { LOADERS.forEach(function (p) { raw.push({ name: p[0], id: p[1], role: "Грузчик", src: p[2], team: "loaders" }); }); return; }
      var fixed = NAMED[t[0]] || [];
      fixed.forEach(function (p) { raw.push({ name: p[0], id: p[1], role: "Водитель", src: p[2], team: t[0] }); });
      for (var n = fixed.length; n < t[2]; n++) {
        var id = String(500 + k); while (id.length < 4) { id = "0" + id; }
        raw.push({ name: SUR[k % 30] + " " + FST[(k + Math.floor(k / 30) * 3) % 20], id: id, role: "Водитель", src: genDays(k, days), team: t[0] });
        k++;
      }
    });
    return raw;
  }

  function fmt1(n) { return n.toFixed(1).replace(".", ","); }

  function buildRows(days) {
    var closedPeriod = !isOpenPeriod();
    return people(days).map(function (p, ri) {
      var total = 0, over = 0, cnt = 0, flags = 0, kmSum = 0, fuelSum = 0, lateDays = 0;
      var isDriver = p.role === "Водитель", heavy = p.team === "bunker" || p.team === "hook";
      var cells = extend(p.src, p.role, days).map(function (s, di) {
        var key = p.id + ":" + di;
        if (state.resolved[key] && s.charAt(0) === "!") { s = state.resolved[key]; }
        if (closedPeriod && s.charAt(0) === "!") { s = s.slice(1); }
        if (s.charAt(0) === "~") { return { code: s.slice(1) }; }
        var isFlag = s.charAt(0) === "!", v = isFlag ? s.slice(1) : s;
        if (isFlag) { flags++; }
        var km = 0, fuel = 0, late = 0, two = false;
        if (v !== "—") {
          var h = parseFloat(v), normH = isDriver ? 12 : 10;
          total += Math.min(h, normH); over += Math.max(0, h - normH); cnt++;
          if (isDriver) {
            km = Math.round(h * (heavy ? 11 : 7.5) + ((ri * 7 + di * 3) % 11));
            fuel = Math.round(km * (heavy ? 0.36 : 0.52));
            kmSum += km; fuelSum += fuel;
            var lv = (ri * 37 + di * 11) % 53;
            late = lv > 46 ? (lv - 46) * 8 : (lv > 40 ? lv - 40 : 0);
            two = (ri * 13 + di * 5) % 17 === 0;
            if (two) { var lv2 = (ri * 29 + di * 7) % 61; late = Math.max(late, lv2 > 50 ? (lv2 - 45) * 3 : 3); }
            if (late > 10) { lateDays++; }
          }
        }
        return { v: v, flag: isFlag, km: km, fuel: fuel, late: late, two: two, fresh: state.fresh === key && !isFlag, h: v !== "—" ? parseFloat(v) : null };
      });
      return {
        p: p, isDriver: isDriver, cells: cells, flags: flags, totalNum: total, overNum: over, kmNum: kmSum, fuelNum: fuelSum, lateNum: lateDays,
        sums: [fmt1(total), over > 0.05 ? fmt1(over) : "—", isDriver ? String(kmSum) : "—", isDriver ? String(fuelSum) : "—",
               isDriver && kmSum ? fmt1(fuelSum / kmSum * 100) : "—", isDriver ? String(lateDays) : "—", String(cnt), flags ? String(flags) : ""]
      };
    });
  }

  /* ---------- Rendering ---------- */
  var SUMS = ["По норме, ч", "Сверх, ч", "Пробег, км", "ГСМ, л", "л/100 км", "Опозд., дн", "Дни"];
  var METRICS = [["h", "Часы"], ["km", "Пробег, км"], ["fuel", "ГСМ, л"], ["late", "Опоздание выхода, мин"]];
  var flagTotal = 0;

  function cellHtml(r, c, di, day) {
    var cls = "tb-c tb-dc" + (day.we ? " is-we" : "");
    var inner;
    if (c.code) {
      inner = '<span class="tb-d is-code code-' + c.code + '">' + c.code + "</span>";
    } else {
      var t = c.v.replace(".", ","), m = state.metric, mod = "";
      if (m !== "h") {
        if (!r.isDriver) { t = "—"; mod = " is-quiet"; }
        else if (c.v !== "—") {
          if (m === "late") { t = c.late > 10 ? "+" + c.late : "0"; mod = c.late > 10 ? " is-hot" : " is-quiet"; }
          else { t = String(m === "km" ? c.km : c.fuel); }
        }
      } else if (c.h !== null && c.h > (r.isDriver ? 12 : 10)) { mod = " is-over"; }
      var two = m === "late" && c.two && r.isDriver ? '<span class="tb-2s">2см</span>' : "";
      if (c.flag) {
        inner = '<a class="tb-d is-flag" href="#razbor" data-flag="' + r.p.id + ":" + di + '" aria-label="' + esc(r.p.name) + ", " + day.n + " " + MON[state.m] + ": требует проверки" + '">' + t + two + "</a>";
      } else {
        inner = '<span class="tb-d' + mod + (c.fresh ? " is-fresh" : "") + '">' + t + two + "</span>";
      }
    }
    return '<div class="' + cls + '" data-col="' + di + '">' + inner + "</div>";
  }

  function render() {
    var days = periodDays(), rows = buildRows(days), open = isOpenPeriod();
    flagTotal = 0; rows.forEach(function (r) { flagTotal += r.flags; });
    var q = state.q.trim().toLowerCase();

    var html = '<div class="tb-top">' +
      '<div role="tablist" aria-label="Разделы табеля" class="rc-tabs rc-tabs--medium">' +
        '<button type="button" role="tab" aria-selected="true" class="rc-tab is-selected"><span class="rc-tab__label">Табель</span></button>' +
        '<button type="button" role="tab" aria-selected="false" class="rc-tab" tabindex="-1" data-go="razbor"><span class="rc-tab__label">Исключения</span>' + (flagTotal ? '<span class="rc-navcount" data-flag-count>' + flagTotal + "</span>" : "") + "</button>" +
        '<button type="button" role="tab" aria-selected="false" class="rc-tab" tabindex="-1" disabled><span class="rc-tab__label">Лента отметок</span></button>' +
        '<button type="button" role="tab" aria-selected="false" class="rc-tab" tabindex="-1" disabled>' + ic("settings", 16) + '<span class="rc-tab__label">Настройки</span></button>' +
      "</div>" +
      '<div class="tb-top-actions">' +
        '<button type="button" class="rc-btn rc-btn--secondary rc-btn--default" data-export>' + ic("download", 16) + "<span>Выгрузить в 1С / Excel</span></button>" +
        '<button type="button" class="rc-btn rc-btn--primary rc-btn--default" disabled title="' + (open ? (flagTotal ? "Сначала разберите исключения: " + flagTotal : "") : "Период уже закрыт") + '"><span>' + (open ? "Закрыть период" : "Период закрыт") + "</span></button>" +
      "</div></div>";

    html += '<div class="tb-panel"><div class="tb-filters">' +
      '<div class="tb-f"><span id="tb-period-lbl">Период</span><span class="tb-period">' +
        '<button type="button" class="rc-ibtn" data-period="-1" aria-label="Предыдущий период">' + ic("chevron-left") + "</button>" +
        '<span class="tb-period-val" aria-labelledby="tb-period-lbl" role="status">' + ic("tear-off-calendar") + MONF[state.m] + " " + state.y + "</span>" +
        '<button type="button" class="rc-ibtn" data-period="1" aria-label="' + (open ? "Следующий период ещё не начался" : "Следующий период") + '"' + (open ? " disabled" : "") + ">" + ic("chevron-right") + "</button>" +
      "</span></div>" +
      '<label class="tb-f">Депо<span class="tb-ctl"><select><option>Депо №1</option><option>Депо №2</option></select>' + ic("chevron-down") + "</span></label>" +
      '<label class="tb-f">Роль<span class="tb-ctl"><select data-role>' +
        [["all", "Все"], ["Водитель", "Водители"], ["Грузчик", "Грузчики"]].map(function (o) { return '<option value="' + o[0] + '"' + (state.role === o[0] ? " selected" : "") + ">" + o[1] + "</option>"; }).join("") +
      "</select>" + ic("chevron-down") + "</span></label>" +
      '<label class="tb-f">Группировка<span class="tb-ctl"><select><option>По командам</option></select>' + ic("chevron-down") + "</span></label>" +
      '<label class="tb-f">Поиск<span class="tb-ctl tb-ctl-search">' + ic("search") + '<input type="search" data-q placeholder="ФИО или табельный №" value="' + esc(state.q) + '"></span></label>' +
      '<button type="button" class="tb-check" data-only aria-pressed="' + state.onlyFlags + '"><span class="rc-check__box">' + ic("check", 14) + "</span>Только с исключениями</button>" +
    "</div>";

    html += '<div class="tb-status' + (open ? "" : " is-closed") + '"><span class="tb-status-tag">' + (open ? "Период открыт" : "Период закрыт · только просмотр") + "</span><span>" + rows.length + " сотрудников" +
      (open ? " · исключений к разбору до закрытия периода: <b data-flag-count>" + flagTotal + "</b>" : " · выгружен в 1С") + "</span>" +
      (open && flagTotal ? '<a href="#razbor">Перейти к исключениям →</a>' : "") + "</div>";

    html += '<div class="tb-metric-row"><div role="tablist" class="rc-seg" aria-label="Что показывать в ячейках">' +
      METRICS.map(function (m) { return '<button type="button" role="tab" aria-selected="' + (state.metric === m[0]) + '" class="rc-seg__item' + (state.metric === m[0] ? " is-selected" : "") + '" data-metric="' + m[0] + '"' + (state.metric === m[0] ? "" : ' tabindex="-1"') + ">" + m[1] + "</button>"; }).join("") +
      '</div><div class="tb-top-actions">' +
      '<button type="button" class="rc-btn rc-btn--secondary rc-btn--small" data-all="open"><span>Развернуть все</span></button>' +
      '<button type="button" class="rc-btn rc-btn--secondary rc-btn--small" data-all="close"><span>Свернуть все</span></button>' +
    "</div></div>";

    // grid
    var g = '<div class="tb-grid" style="--nd:' + days.length + '" role="table" aria-label="Табель, ' + MONF[state.m] + " " + state.y + '">';
    g += '<div class="tb-h" role="row"><div class="tb-c tb-nm" role="columnheader"><span>Сотрудник</span><span>Роль</span></div>' +
      days.map(function (d, i) { return '<div class="tb-c' + (d.we ? " is-we" : "") + '" role="columnheader" data-col="' + i + '"><b>' + d.n + "</b>" + d.w + "</div>"; }).join("") +
      SUMS.map(function (s, i) { return '<div class="tb-c tb-sum tb-s' + (i + 1) + '" role="columnheader">' + s + "</div>"; }).join("") +
      '<div class="tb-c tb-sum tb-s8" role="columnheader"><b role="img" aria-label="Исключения" title="Исключения">!</b></div></div>';

    TEAMS.forEach(function (t) {
      var all = rows.filter(function (r) { return r.p.team === t[0]; });
      if (state.role !== "all") { all = all.filter(function (r) { return r.p.role === state.role; }); }
      if (q) { all = all.filter(function (r) { return r.p.name.toLowerCase().indexOf(q) >= 0 || r.p.id.indexOf(q) >= 0; }); }
      var members = state.onlyFlags ? all.filter(function (r) { return r.flags > 0; }) : all;
      if (!members.length) { return; }
      var isOpen = !state.closed[t[0]];
      var s = { t: 0, o: 0, k: 0, f: 0, l: 0, fl: 0 };
      members.forEach(function (m) { s.t += m.totalNum; s.o += m.overNum; s.k += m.kmNum; s.f += m.fuelNum; s.l += m.lateNum; s.fl += m.flags; });
      var gs = [fmt1(s.t), s.o > 0.05 ? fmt1(s.o) : "—", s.k ? String(s.k) : "—", s.f ? String(s.f) : "—", s.k ? fmt1(s.f / s.k * 100) : "—", s.k ? String(s.l) : "—", "—", s.fl ? String(s.fl) : ""];
      g += '<div class="tb-g" role="row"><div class="tb-c tb-nm" role="rowheader"><button type="button" class="tb-g-btn" data-group="' + t[0] + '" aria-expanded="' + isOpen + '">' + ic("chevron-down") + "<span>" + t[1] + '</span><span class="rc-counter rc-counter--neutral">' + (state.onlyFlags ? members.length + "/" + all.length : members.length) + "</span></button></div>" +
        days.map(function (d, i) { return '<div class="tb-c' + (d.we ? " is-we" : "") + '" data-col="' + i + '" role="cell"></div>'; }).join("") +
        gs.map(function (v, i) { return '<div class="tb-c tb-sum tb-s' + (i + 1) + '" role="cell">' + v + "</div>"; }).join("") + "</div>";
      if (!isOpen) { return; }
      members.forEach(function (r) {
        g += '<div class="tb-r" role="row"><div class="tb-c tb-nm" role="rowheader"><span class="tb-nm-who"><strong>' + r.p.name + "</strong><span>таб. № " + r.p.id + '</span></span><span class="tb-nm-role">' + r.p.role + "</span></div>" +
          r.cells.map(function (c, di) { return cellHtml(r, c, di, days[di]); }).join("") +
          r.sums.map(function (v, i) { return '<div class="tb-c tb-sum tb-s' + (i + 1) + '" role="cell">' + v + "</div>"; }).join("") + "</div>";
      });
    });
    g += "</div>";

    var tableScroll = main.querySelector(".tb-table");
    var scroll = tableScroll ? [tableScroll.scrollLeft, tableScroll.scrollTop] : null;
    var focusKey = document.activeElement && main.contains(document.activeElement) ? focusId(document.activeElement) : null;

    html += '<div class="tb-table" tabindex="0" aria-label="Таблица табеля, прокручивается">' + g + "</div>";
    html += '<div class="tb-legend"><span><b>12,0</b> часы · <b>12,9</b> сверх нормы</span><span><i></i>требует проверки, клик ведёт к разбору</span><span><b>В</b> выходной · <b>Б</b> больничный · <b>ОТ</b> отпуск · <b>НН</b> неявка</span><span>Пробег по Wialon за смены дня, ГСМ из мониторинга ГСМ; у грузчиков не считается</span></div>';
    html += "</div>";

    main.innerHTML = html;
    var tb = main.querySelector(".tb-table");
    if (scroll) { tb.scrollLeft = scroll[0]; tb.scrollTop = scroll[1]; }
    else { tb.scrollLeft = 0; }
    if (focusKey) { var el = main.querySelector(focusKey); if (el) { el.focus({ preventScroll: true }); if (el.matches("[data-q]")) { el.setSelectionRange(el.value.length, el.value.length); } } }
  }
  function focusId(el) {
    if (el.matches("[data-q]")) { return "[data-q]"; }
    if (el.matches("[data-role]")) { return "[data-role]"; }
    if (el.matches("[data-only]")) { return "[data-only]"; }
    if (el.dataset.metric) { return '[data-metric="' + el.dataset.metric + '"]'; }
    if (el.dataset.group) { return '[data-group="' + el.dataset.group + '"]'; }
    if (el.dataset.period) { return '[data-period="' + el.dataset.period + '"]'; }
    if (el.dataset.all) { return '[data-all="' + el.dataset.all + '"]'; }
    return null;
  }

  /* ---------- Interaction ---------- */
  main.addEventListener("click", function (e) {
    var t = e.target.closest("button, a");
    if (!t || !main.contains(t)) { return; }
    if (t.dataset.metric) { state.metric = t.dataset.metric; render(); }
    else if (t.dataset.group) { state.closed[t.dataset.group] = !state.closed[t.dataset.group]; render(); }
    else if (t.dataset.all) { state.closed = {}; if (t.dataset.all === "close") { TEAMS.forEach(function (x) { state.closed[x[0]] = true; }); } render(); }
    else if (t.hasAttribute("data-only")) { state.onlyFlags = !state.onlyFlags; render(); }
    else if (t.dataset.period) {
      var m = state.m + (+t.dataset.period);
      if (m > 9 && state.y === 2026) { return; }
      state.y += Math.floor(m / 12); state.m = (m + 12) % 12; render();
    }
    else if (t.hasAttribute("data-export")) { openExport(t); }
    else if (t.dataset.go === "razbor" || t.dataset.flag) {
      // In the product a flagged day opens its day card; here the page's exception card plays that part.
      var card = document.getElementById("razbor");
      if (t.dataset.flag && t.dataset.flag !== "1102:4") { flashNote(t.dataset.flag); }
      if (card && t.tagName === "BUTTON") { e.preventDefault(); scrollTo(card); }
    }
  });
  main.addEventListener("change", function (e) { if (e.target.matches("[data-role]")) { state.role = e.target.value; render(); } });
  main.addEventListener("input", function (e) { if (e.target.matches("[data-q]")) { state.q = e.target.value; render(); } });
  main.addEventListener("keydown", function (e) {
    var t = e.target;
    if (!t.dataset || !t.dataset.metric) { return; }
    var i = METRICS.findIndex(function (m) { return m[0] === t.dataset.metric; }), n = i;
    if (e.key === "ArrowRight") { n = (i + 1) % METRICS.length; } else if (e.key === "ArrowLeft") { n = (i + METRICS.length - 1) % METRICS.length; }
    else if (e.key === "Home") { n = 0; } else if (e.key === "End") { n = METRICS.length - 1; } else { return; }
    e.preventDefault(); state.metric = METRICS[n][0]; render();
  });

  // Crosshair: the column under the pointer lights up with its header (the row does via CSS :hover).
  var lastCol = null;
  main.addEventListener("mouseover", function (e) {
    var c = e.target.closest("[data-col]");
    var col = c ? c.getAttribute("data-col") : null;
    if (col === lastCol) { return; }
    Array.prototype.forEach.call(main.querySelectorAll(".is-col"), function (x) { x.classList.remove("is-col"); });
    lastCol = col;
    if (col !== null) { Array.prototype.forEach.call(main.querySelectorAll('[data-col="' + col + '"]'), function (x) { x.classList.add("is-col"); }); }
  });
  main.addEventListener("mouseleave", function () { lastCol = null; Array.prototype.forEach.call(main.querySelectorAll(".is-col"), function (x) { x.classList.remove("is-col"); }); });

  function scrollTo(el) {
    var R = window.Raccoon;
    if (R && R.lenis) { R.lenis.scrollTo(el, { offset: -24, duration: 1.1 }); } else { el.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" }); }
  }

  /* ---------- Export dialog (inside the screen) ---------- */
  var scrim = document.createElement("div");
  scrim.className = "tb-scrim"; scrim.hidden = true;
  screen.style.position = "relative";
  screen.appendChild(scrim);
  var toast = document.createElement("div");
  toast.className = "tb-toast"; toast.setAttribute("role", "status");
  screen.appendChild(toast);
  var exp = { fmt: "xlsx", teams: {}, layout: 0 }, opener = null;

  function exportHtml() {
    var all = buildRows(periodDays()), nT = 0, nP = 0;
    var teams = TEAMS.map(function (t) {
      var n = all.filter(function (r) { return r.p.team === t[0]; }).length, on = exp.teams[t[0]] !== false;
      if (on) { nT++; nP += n; }
      return '<button type="button" class="tb-opt" aria-pressed="' + on + '" data-team="' + t[0] + '"><span>' + t[1] + "</span><small>" + n + " чел.</small></button>";
    }).join("");
    var open = isOpenPeriod();
    return '<section class="tb-modal" role="dialog" aria-modal="true" aria-labelledby="tb-exp-title">' +
      '<header class="tb-modal-head"><div><h3 id="tb-exp-title">Выгрузка табеля</h3><p>' + MONF[state.m] + " " + state.y + ' · Депо №1</p></div><button type="button" class="rc-ibtn" data-x aria-label="Закрыть">' + ic("cancel", 24) + "</button></header>" +
      '<div class="tb-modal-body">' +
        '<fieldset class="tb-fs"><legend>Формат</legend><div class="tb-opts" role="radiogroup" aria-label="Формат">' +
          [["xlsx", "Excel (.xlsx)"], ["1c", "1С (файл обмена)"]].map(function (f) { return '<button type="button" role="radio" class="tb-opt" aria-checked="' + (exp.fmt === f[0]) + '" data-fmt="' + f[0] + '">' + f[1] + "</button>"; }).join("") +
        "</div></fieldset>" +
        '<fieldset class="tb-fs"><legend>Команды</legend><div class="tb-teams">' + teams + "</div></fieldset>" +
        '<fieldset class="tb-fs"><legend>Как разложить</legend><div class="tb-opts" role="radiogroup" aria-label="Как разложить">' +
          ["Отдельный лист на каждую команду", "Один лист, команды блоками с итогами", "Отдельный файл на команду (ZIP)"].map(function (l, i) { return '<button type="button" role="radio" class="tb-opt" aria-checked="' + (exp.layout === i) + '" data-layout="' + i + '">' + l + "</button>"; }).join("") +
        "</div></fieldset>" +
        (open && flagTotal ? '<p class="tb-draft">Период ещё не закрыт: в файле будет пометка «Черновик». Неразобранных исключений: ' + flagTotal + ".</p>" : "") +
      "</div>" +
      '<footer class="tb-modal-foot"><span>Будет выгружено: команд — ' + nT + ", сотрудников — " + nP + "</span><div>" +
        '<button type="button" class="rc-btn rc-btn--tertiary rc-btn--default" data-x><span>Отмена</span></button>' +
        '<button type="button" class="rc-btn rc-btn--primary rc-btn--default" data-dl' + (nT ? "" : " disabled") + "><span>Скачать</span></button>" +
      "</div></footer></section>";
  }
  function openExport(btn) {
    opener = btn; scrim.innerHTML = exportHtml(); scrim.hidden = false;
    scrim.querySelector("[data-fmt]").focus({ preventScroll: true });
  }
  function closeExport() { scrim.hidden = true; scrim.innerHTML = ""; if (opener) { var o = main.querySelector("[data-export]"); if (o) { o.focus({ preventScroll: true }); } } }
  function refreshExport(sel) { scrim.innerHTML = exportHtml(); var el = scrim.querySelector(sel); if (el) { el.focus({ preventScroll: true }); } }
  scrim.addEventListener("click", function (e) {
    if (e.target === scrim) { closeExport(); return; }
    var t = e.target.closest("button"); if (!t) { return; }
    if (t.hasAttribute("data-x")) { closeExport(); }
    else if (t.dataset.fmt) { exp.fmt = t.dataset.fmt; refreshExport('[data-fmt="' + exp.fmt + '"]'); }
    else if (t.dataset.layout) { exp.layout = +t.dataset.layout; refreshExport('[data-layout="' + exp.layout + '"]'); }
    else if (t.dataset.team) { exp.teams[t.dataset.team] = exp.teams[t.dataset.team] === false; refreshExport('[data-team="' + t.dataset.team + '"]'); }
    else if (t.hasAttribute("data-dl")) {
      var name = "Табель_" + MON[state.m] + "_" + state.y + (isOpenPeriod() && flagTotal ? "_черновик" : "") + (exp.fmt === "xlsx" ? ".xlsx" : ".xml");
      closeExport();
      showToast("Файл сформирован · <b>" + name + "</b>");
    }
  });
  scrim.addEventListener("keydown", function (e) {
    if (e.key === "Escape") { e.preventDefault(); closeExport(); return; }
    if (e.key !== "Tab") { return; }
    var f = scrim.querySelectorAll("button:not([disabled])"); if (!f.length) { return; }
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });
  var toastT;
  function showToast(h) { toast.innerHTML = h; toast.classList.add("is-on"); clearTimeout(toastT); toastT = setTimeout(function () { toast.classList.remove("is-on"); }, 3200); }
  function flashNote() { showToast("В продукте откроется карточка этого дня. Здесь для примера разобран один день ниже"); }

  /* ---------- Scale: the 1600 × 960 screen zooms as a whole to the frame; too narrow, it pans at a readable size ---------- */
  function fit() {
    var w = frame.clientWidth, s = w / 1600, pan = s < 0.5;
    if (pan) { s = 0.62; }
    frame.classList.toggle("is-pan", pan);
    screen.style.setProperty("--s", s.toFixed(4));
    // On phones the screen pans; it opens past the side nav, on the grid, and the note says it scrolls sideways.
    if (pan && !panned) { panned = true; frame.scrollLeft = Math.round(248 * s); }
    if (!pan) { panned = false; }
    var hint = document.querySelector("[data-tb-pan]");
    if (hint) { hint.hidden = !pan; }
  }
  var panned = false;
  fit();
  if ("ResizeObserver" in window) { new ResizeObserver(fit).observe(frame); } else { window.addEventListener("resize", fit); }

  render();

  /* ---------- One exception: Касымов Арман, 5 Oct ---------- */
  var card = document.querySelector("[data-case]");
  if (!card) { return; }
  var q = function (s) { return card.querySelector(s); };
  var leave = q("[data-case-leave]"), saveBtn = q("[data-case-save]"), hint = q("[data-case-hint]");
  var c = { applied: false, reason: null };

  function minutes(hhmm) { var a = hhmm.split(":"); return +a[0] * 60 + +a[1]; }
  function caseUi() {
    var out = c.applied ? "16:45" : "16:38", w = minutes(out) - minutes("06:48");
    var hours = (Math.round(w / 6) / 10).toFixed(1).replace(".", ",");
    q("[data-case-leave-time]").textContent = out;
    q("[data-case-leave-note]").textContent = c.applied ? "по ответу сотрудника" : "черновик по задаче";
    leave.classList.toggle("is-draft", !c.applied);
    leave.classList.toggle("is-set", c.applied);
    q("[data-case-hours]").innerHTML = hours + "&nbsp;ч";
    q("[data-case-worked]").innerHTML = Math.floor(w / 60) + "&nbsp;ч " + (w % 60) + "&nbsp;мин";
    q("[data-case-sug]").classList.toggle("is-used", c.applied);
    q("[data-case-save-txt]").textContent = c.applied ? "Сохранить с исправлением · 16:45" : "Принять черновик 16:38";
    saveBtn.disabled = !c.reason;
    hint.textContent = c.reason ? "Попадёт в журнал дня, сотрудник получит уведомление в боте" : "Выберите причину";
    Array.prototype.forEach.call(card.querySelectorAll("[data-reason]"), function (b) { b.setAttribute("aria-checked", String(b.textContent === c.reason)); });
    return hours;
  }
  leave.classList.add("is-draft");
  q("[data-case-apply]").addEventListener("click", function () {
    c.applied = true;
    if (!c.reason) { c.reason = "Сотрудник забыл отметиться"; }
    caseUi();
    saveBtn.focus();
  });
  card.querySelector(".tb-reasons").addEventListener("click", function (e) {
    var b = e.target.closest("[data-reason]"); if (!b) { return; }
    c.reason = b.textContent; caseUi();
  });
  card.querySelector(".tb-reasons").addEventListener("keydown", function (e) {
    var bs = Array.prototype.slice.call(card.querySelectorAll("[data-reason]")), i = bs.indexOf(e.target);
    if (i < 0) { return; }
    var n = e.key === "ArrowRight" || e.key === "ArrowDown" ? (i + 1) % bs.length : e.key === "ArrowLeft" || e.key === "ArrowUp" ? (i + bs.length - 1) % bs.length : -1;
    if (n < 0) { return; }
    e.preventDefault(); c.reason = bs[n].textContent; caseUi(); bs[n].focus();
  });
  saveBtn.addEventListener("click", function () {
    if (!c.reason) { return; }
    var hours = caseUi(), out = c.applied ? "16:45" : "16:38";
    card.classList.add("is-closed");
    q("[data-case-chip]").className = "tb-chip tb-chip-ok";
    q("[data-case-chip-txt]").textContent = "Закрыт HR";
    q("[data-case-done-txt]").innerHTML = "Пришёл 06:48 · Ушёл " + out + " · Я · " + hours + "&nbsp;ч в&nbsp;табель. Причина: «" + esc(c.reason) + "». Сотрудник получил уведомление в&nbsp;боте.";
    q("[data-case-done]").hidden = false;
    state.resolved["1102:4"] = hours.replace(",", ".");
    if (state.y !== 2026 || state.m !== 9) { state.y = 2026; state.m = 9; }
    state.fresh = "1102:4"; render(); state.fresh = null;
    q("[data-case-goto]").focus({ preventScroll: true });
  });
  q("[data-case-undo]").addEventListener("click", function () {
    card.classList.remove("is-closed");
    q("[data-case-chip]").className = "tb-chip tb-chip-err";
    q("[data-case-chip-txt]").textContent = "Нет «Ушёл»";
    q("[data-case-done]").hidden = true;
    delete state.resolved["1102:4"];
    render();
    saveBtn.focus();
  });
  q("[data-case-goto]").addEventListener("click", function (e) {
    e.preventDefault();
    // show Касымов's row: open the loaders group, clear filters that could hide it, scroll the grid to day 5
    state.closed.loaders = false; state.q = ""; if (state.role === "Водитель") { state.role = "all"; }
    state.fresh = "1102:4"; render(); state.fresh = null;
    scrollTo(document.getElementById("tabel"));
    var tbl = main.querySelector(".tb-table"), cell = main.querySelector(".tb-d.is-fresh");
    if (tbl && cell) {
      tbl.scrollTop = Math.max(0, cell.closest(".tb-c").offsetTop - tbl.clientHeight / 2);
      tbl.scrollLeft = 0;
    }
  });
})();
