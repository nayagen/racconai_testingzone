// Табель — моковые данные и логика периода.
// Перенесено из handoff/screens/Main.dc.html (renderVals). Когда появится API (см. handoff/SPEC.md, «Эндпоинты»),
// заменить buildTimesheet() на загрузку данных; форма объектов ниже — то, что ждёт интерфейс.
(function () {
  var TODAY = '2026-10-28';
  var MAX_DAYS = 62;
  var MON = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
  var MONF = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
  var WK = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];

  // ---------- даты ----------
  function pd(isoS) { var a = String(isoS).split('-'); return new Date(Date.UTC(+a[0], +a[1] - 1, +a[2])); }
  function iso(d) { return d.toISOString().slice(0, 10); }
  function addD(isoS, n) { var d = pd(isoS); d.setUTCDate(d.getUTCDate() + n); return iso(d); }
  function diffD(a, b) { return Math.round((pd(b) - pd(a)) / 86400000); }
  function ym(y, m) { var d = new Date(Date.UTC(y, m, 1)); return { y: d.getUTCFullYear(), m: d.getUTCMonth() }; }
  function shortD(isoS, withY) { var d = pd(isoS); return d.getUTCDate() + ' ' + MON[d.getUTCMonth()] + (withY ? ' ' + d.getUTCFullYear() : ''); }

  // ---------- период ----------
  var PRESETS = [
    { value: 'month', label: 'Календарный месяц', hint: '1–31 число' },
    { value: 'p26', label: 'С 26-го по 25-е', hint: 'расчётный месяц' },
    { value: 'p21', label: 'С 21-го по 20-е', hint: 'расчётный месяц' },
    { value: 'custom', label: 'Свои даты', hint: 'до ' + MAX_DAYS + ' дней' }
  ];

  function rangeFor(preset, y, m) {
    var a = ym(y, m), b = ym(y, m + 1), p = ym(y, m - 1);
    function mk(yy, mm, dd) { return iso(new Date(Date.UTC(yy, mm, dd))); }
    if (preset === 'p26') return { from: mk(p.y, p.m, 26), to: mk(a.y, a.m, 25) };
    if (preset === 'p21') return { from: mk(p.y, p.m, 21), to: mk(a.y, a.m, 20) };
    return { from: mk(a.y, a.m, 1), to: iso(new Date(Date.UTC(b.y, b.m, 0))) };
  }

  function presetPeriod(preset, y, m) {
    var r = rangeFor(preset, y, m);
    return { preset: preset, y: y, m: m, from: r.from, to: r.to };
  }

  var DEFAULT_PERIOD = presetPeriod('month', 2026, 9);

  function periodLabel(p) {
    if (p.preset === 'month') return MONF[p.m] + ' ' + p.y;
    var sameY = p.from.slice(0, 4) === p.to.slice(0, 4);
    return shortD(p.from, !sameY) + ' – ' + shortD(p.to, true);
  }

  function shiftPeriod(p, dir) {
    if (p.preset === 'custom') {
      var len = diffD(p.from, p.to) + 1;
      return { preset: 'custom', from: addD(p.from, dir * len), to: addD(p.to, dir * len) };
    }
    var t = ym(p.y, p.m + dir);
    return presetPeriod(p.preset, t.y, t.m);
  }

  // Ошибка черновика периода или '' если всё хорошо.
  function validatePeriod(d) {
    if (!d.from || !d.to) return 'Укажите обе даты';
    var len = diffD(d.from, d.to) + 1;
    if (len < 1) return 'Дата «по» раньше даты «с»';
    if (len > MAX_DAYS) return 'Слишком длинный период: ' + len + ' дн., максимум ' + MAX_DAYS;
    if (d.from > TODAY) return 'Период ещё не начался';
    return '';
  }

  function periodLength(p) { return diffD(p.from, p.to) + 1; }

  function daysOf(period) {
    var out = [];
    var n = periodLength(period);
    for (var i = 0; i < n; i++) {
      var d = pd(addD(period.from, i));
      var w = WK[d.getUTCDay()];
      var mStart = d.getUTCDate() === 1;
      out.push({
        key: 'd' + i,
        index: i,
        date: iso(d),
        n: String(d.getUTCDate()),
        w: (i === 0 || mStart) ? MON[d.getUTCMonth()] + ', ' + w : w,
        weekday: w,
        weekend: w === 'сб' || w === 'вс',
        monthStart: mStart && i !== 0
      });
    }
    return out;
  }

  // ---------- сотрудники и дни ----------
  // Код дня в «сырой» строке: число часов; «!» — исключение; «~КОД» — нерабочий день; «—» — нет данных.
  var TEAMS = [
    { id: 'rear', name: 'Мусоровозы — задняя загрузка', size: 16 },
    { id: 'side', name: 'Мусоровозы — боковая загрузка', size: 10 },
    { id: 'front', name: 'Мусоровозы — фронтальная загрузка', size: 6 },
    { id: 'bunker', name: 'Бункеровозы', size: 12 },
    { id: 'hook', name: 'Мультилифты (крюковые)', size: 9 },
    { id: 'dump', name: 'Самосвалы (СО)', size: 7 },
    { id: 'loaders', name: 'Грузчики', size: 4 }
  ];

  var NAMED = {
    rear: [
      ['Ахметов Бауыржан', '0412', '12.3,12.0,~В,~В,11.8,12.5,!12.9,12.1,11.9,~В,~В,12.2,12.0,12.4'],
      ['Сериков Данияр', '0417', '11.5,!11.9,~В,~В,12.0,11.7,12.2,12.0,12.3,~В,~В,11.9,12.1,12.0']
    ],
    bunker: [
      ['Нурланов Ерлан', '0433', '~ОТ,~ОТ,~ОТ,~ОТ,~ОТ,~ОТ,~ОТ,12.1,12.0,~В,~В,11.8,12.2,12.0'],
      ['Ким Виктор', '0451', '12.0,12.1,~В,~В,~Б,~Б,~Б,12.0,!13.6,~В,~В,12.2,11.8,12.0']
    ],
    loaders: [
      ['Касымов Арман', '1102', '10.2,10.5,~В,~В,!9.8,10.1,10.4,10.0,10.6,~В,~В,10.3,!10.9,10.1'],
      ['Абдрахманов Марат', '1108', '10.0,10.4,~В,~В,10.2,10.1,~НН,10.5,10.3,~В,~В,10.0,10.2,10.4'],
      ['Жумабаев Нурсултан', '1115', '!10.1,10.3,~В,~В,10.0,10.2,10.4,10.1,10.0,~В,~В,10.2,10.3,10.0'],
      ['Исаев Тимур', '1121', '10.4,!10.2,~В,~В,10.0,10.8,10.1,10.3,10.2,~В,~В,10.5,10.0,!—']
    ]
  };

  var SUR = ['Абенов', 'Байжанов', 'Бекмуратов', 'Габдуллин', 'Досанов', 'Ергалиев', 'Жакупов', 'Жунусов', 'Исмаилов', 'Кайратов', 'Калиев', 'Кенжебаев', 'Ковалёв', 'Кузнецов', 'Мамырбеков', 'Мукашев', 'Нургалиев', 'Оспанов', 'Петренко', 'Рахимов', 'Сагындыков', 'Сарсенов', 'Смагулов', 'Тлеубаев', 'Токтаров', 'Уразбаев', 'Хамитов', 'Шайхин', 'Шевченко', 'Юсупов'];
  var FST = ['Айдос', 'Бекзат', 'Владимир', 'Галым', 'Дамир', 'Ержан', 'Жандос', 'Ильяс', 'Канат', 'Мейрам', 'Нурлан', 'Олжас', 'Павел', 'Руслан', 'Самат', 'Талгат', 'Улан', 'Фархат', 'Шерхан', 'Эльдар'];

  // Растягивает короткий шаблон именованного сотрудника на весь период.
  function extend(str, role, days) {
    var base = str.split(',');
    var norm = role === 'Водитель' ? '12.0' : '10.0';
    return days.map(function (day, d) {
      var s = base[d % base.length];
      if (d >= base.length && s.charAt(0) === '!') s = s.slice(1);
      if (day.weekend) return (s.charAt(0) === '~' && s !== '~В') ? s : '~В';
      if (s === '~В' || (d >= base.length && (s === '—' || s.charAt(0) === '~'))) s = norm;
      return s;
    });
  }

  function genDays(k, days) {
    var sched = k % 3;
    return days.map(function (day, d) {
      var off = sched === 0 ? day.weekend : (sched === 1 ? day.weekday === 'вс' : Math.floor((d + k) / 2) % 2 === 1);
      if (off) return '~В';
      if (k % 11 === 3 && d >= 9 && d <= 22) return '~ОТ';
      if (k % 17 === 6 && d >= 5 && d <= 7) return '~Б';
      if (k % 29 === 10 && d === 15) return '~НН';
      var h = (11 + ((k * 13 + d * 7) % 23) / 10).toFixed(1);
      return ((k * 31 + d * 17) % 97 === 0 && d < days.length - 5 ? '!' : '') + h;
    });
  }

  function staffOf(days) {
    var out = [];
    var k = 0;
    TEAMS.forEach(function (t) {
      var role = t.id === 'loaders' ? 'Грузчик' : 'Водитель';
      var fixed = NAMED[t.id] || [];
      fixed.forEach(function (p) { out.push({ name: p[0], id: p[1], role: role, team: t.id, raw: extend(p[2], role, days) }); });
      if (t.id === 'loaders') return;
      for (var n = fixed.length; n < t.size; n++) {
        var id = String(500 + k);
        while (id.length < 4) id = '0' + id;
        out.push({ name: SUR[k % 30] + ' ' + FST[(k + Math.floor(k / 30) * 3) % 20], id: id, role: role, team: t.id, raw: genDays(k, days) });
        k++;
      }
    });
    return out;
  }

  // Расчёт одной строки табеля. Метрики дня (пробег, ГСМ, опоздание) — детерминированный мок.
  function computeRow(person, ri) {
    var isDriver = person.role === 'Водитель';
    var heavy = person.team === 'bunker' || person.team === 'hook';
    var normH = isDriver ? 12 : 10;
    var total = 0, over = 0, workDays = 0, flags = 0, km = 0, fuel = 0, lateDays = 0;

    var cells = person.raw.map(function (s, di) {
      if (s.charAt(0) === '~') return { kind: 'off', code: s.slice(1) };
      var flag = s.charAt(0) === '!';
      var v = flag ? s.slice(1) : s;
      if (flag) flags++;
      var cell = { kind: 'work', flag: flag, hours: null, km: 0, fuel: 0, late: 0, twoShifts: false };
      if (v === '—') return cell;
      var h = parseFloat(v);
      cell.hours = h;
      total += Math.min(h, normH); over += Math.max(0, h - normH); workDays++;
      if (isDriver) {
        cell.km = Math.round(h * (heavy ? 11 : 7.5) + ((ri * 7 + di * 3) % 11));
        cell.fuel = Math.round(cell.km * (heavy ? 0.36 : 0.52));
        km += cell.km; fuel += cell.fuel;
        var lv = (ri * 37 + di * 11) % 53;
        cell.late = lv > 46 ? (lv - 46) * 8 : (lv > 40 ? lv - 40 : 0);
        cell.twoShifts = (ri * 13 + di * 5) % 17 === 0;
        if (cell.twoShifts) {
          var lv2 = (ri * 29 + di * 7) % 61;
          cell.late = Math.max(cell.late, lv2 > 50 ? (lv2 - 45) * 3 : 3);
        }
        if (cell.late > LATE_TOLERANCE) lateDays++;
      }
      return cell;
    });

    return {
      name: person.name, id: person.id, role: person.role, team: person.team, isDriver: isDriver, norm: normH,
      cells: cells, total: total, over: over, workDays: workDays, flags: flags, km: km, fuel: fuel, lateDays: lateDays
    };
  }

  var LATE_TOLERANCE = 10; // мин, допуск опоздания выхода на линию (SPEC, п. 4)

  function buildTimesheet(period) {
    var days = daysOf(period);
    var rows = staffOf(days).map(computeRow);
    return { days: days, rows: rows, teams: TEAMS };
  }

  window.TabelData = {
    TODAY: TODAY, MAX_DAYS: MAX_DAYS, PRESETS: PRESETS, DEFAULT_PERIOD: DEFAULT_PERIOD, LATE_TOLERANCE: LATE_TOLERANCE,
    rangeFor: rangeFor, presetPeriod: presetPeriod, periodLabel: periodLabel, shiftPeriod: shiftPeriod,
    validatePeriod: validatePeriod, periodLength: periodLength, shortD: shortD, pd: pd,
    buildTimesheet: buildTimesheet
  };
})();
