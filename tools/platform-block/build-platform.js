// Builds the static "Platform" dashboard block from the RaccoonDS bundle (server-rendered, no runtime React).
// Source of layout and data: Figma RaccoonAI Desktop, node 4296:5593 "Dashboard_Truck selected".
const fs = require('fs');
const path = require('path');
const { React, DS, h } = require('./ds.js');
const { renderToStaticMarkup } = require('react-dom/server');
const F = React.Fragment;
const OUT = process.argv[2];
const DSDIR = process.env.DSDIR;

const { Icon, IconButton, Button, StatusBadge, PlateNumber, PercentBadge, Avatar, SideNav, SearchField,
  FilterButton, DateButton, Select, MapPin, TruckMarker, Separator } = DS;

const div = (cls, ...kids) => h('div', { className: cls }, ...kids);
const span = (cls, ...kids) => h('span', { className: cls }, ...kids);
const p = (cls, ...kids) => h('p', { className: cls }, ...kids);

/* ---------- Side navigation (Figma counts: Задания 18, Маршруты 18) ---------- */
const NAV = [
  [{ icon: 'dashboard-icon', label: 'Дэшборд', value: 'dashboard' }, { icon: 'task', label: 'Задания', value: 'jobs', count: 43 },
   { icon: 'journey', label: 'Маршруты', value: 'routes', count: 6 },
   { icon: 'navigation', label: 'Контроль движения', value: 'gps' }],
  [{ icon: 'location', label: 'Площадки', value: 'locations' }, { icon: 'group-of-locations', label: 'Маршрутные группы', value: 'route-groups' },
   { icon: 'admin-icon', label: 'Реестр контейнеров', value: 'containers' }, { icon: 'budget', label: 'Заказчики', value: 'clients' }],
  [{ icon: 'garage', label: 'Автопарк', value: 'fleet' }, { icon: 'tear-off-calendar', label: 'График смен', value: 'shifts' }],
  [{ icon: 'phone-calling', label: 'Колл-центр', value: 'call-center' }, { icon: 'analytics', label: 'Аналитика', value: 'analytics' },
   { icon: 'users', label: 'Сотрудники', value: 'staff' }, { icon: 'weight-station', label: 'Весовая', value: 'weighing' }],
];

/* What each page of the platform does: shown in a card on hover or keyboard focus of the side-nav item */
const NAV_TIPS = {
  'Дэшборд': 'Оперативные данные в интерактивном интерфейсе: карта, маршруты, задания, машины и смены. Быстрый доступ к данным системы.',
  'Задания': 'Реестр маршрутных заданий и карта заявок в табличном виде.',
  'Маршруты': 'Маршрутные листы экипажей и состояние вывоза по дням. Реестр всех маршрутов в табличном виде.',
  'Контроль движения': 'Интерактивный плеер передвижений машин за выбранные даты с подсказками об аномальных действиях водителя.',
  'Площадки': 'Реестр площадок, с которых производится вывоз мусора.',
  'Маршрутные группы': 'Группы площадок, закреплённые за машинами, для автоматического создания маршрутов по графику вывоза.',
  'Реестр контейнеров': 'Номера контейнеров и бункеров, обслуженных в заданиях по вывозу строительных отходов, и последняя площадка, на которой стоял каждый из них.',
  'Заказчики': 'Реестр заказчиков, которых обслуживает МВО. На заказчиках хранятся договоры по объёму вывоза или по нормативу, сами заказчики прикрепляются к площадкам.',
  'Автопарк': 'Страница производственного отдела МВО: планирование смен, выпуск техники на линию и печать путевых листов.',
  'График смен': 'Интерактивный график смен водителей на месяц вперёд и контроль его выполнения.',
  'Колл-центр': 'Встроенная SIP-телефония: абонентский отдел принимает звонки и ведёт чаты с заказчиками прямо в платформе.',
  'Аналитика': 'Аналитика и графики по ключевым показателям МВО. Выгрузка операционных отчётов для финансового отдела.',
  'Сотрудники': 'Реестр сотрудников МВО и их учётных записей для доступа к платформе.',
  'Весовая': 'Реестр заездов на мусорные полигоны и данные по тоннажу, которые платформа автоматически выгружает для вашего МВО.',
};

/* ---------- Map: Figma pin positions (map frame 1142x507) scaled 0.8 onto the 2GIS backdrop at native size ---------- */
const FIGMA_PINS = [[828,200],[615,342],[914,170],[815,128],[996,102],[868,32],[980,362],[828,301],[696,166],[594,78],[431,99],[328,287],
  [184,267],[183,130],[61,104],[85,281],[1123,208],[967,258],[486,400],[815,384],[1110,362],[633,427],[376,381],[762,259],[1012,176],
  [738,39],[895,359],[735,381],[894,249],[570,205],[1060,78],[884,298],[871,118],[755,130],[516,50],[588,6],[407,32],[277,65],[151,74],
  [74,170],[156,214],[76,387],[719,441],[588,268],[736,190],[980,209],[925,430],[813,255],[465,457],[344,444],[715,267],[955,170],
  [931,104],[1019,379],[821,440],[675,339],[377,183],[492,244],[151,363]];
const STATUS_CYCLE = ['completed', 'assigned', 'completed', 'in-progress', 'completed', 'created', 'assigned', 'completed', 'failed', 'completed', 'assigned', 'in-progress'];
const MAP_W = 844, MAP_H = 512, K = 0.8;
const pins = FIGMA_PINS.map(([x, y], i) => ({ x: Math.round(x * K) + 16, y: Math.round(y * K) + 34, s: STATUS_CYCLE[i % STATUS_CYCLE.length] }))
  .filter(pn => pn.x < MAP_W - 20 && pn.y < MAP_H - 16 && !(pn.x < 340 && pn.y < 56) && !(pn.x > 700 && pn.y < 56));
const PIN_STATUSES = ['created', 'assigned', 'in-progress', 'completed', 'failed'];

/* Garbage trucks on the map: the selected one (truck card) plus two more on their in-progress trips; each opens its own truck card */
const MAP_TRUCKS = [
  { plate: '714SH02', driver: 'Асаубаев Ерлан', x: 564, y: 242, rot: -22, active: true, past: [53, 45, 44, 17, 19, 1, 50], plan: [40, 29, 3] },
  { plate: '402BCK02', driver: 'Жунусов Бауыржан', x: 378, y: 158, rot: 159, past: [30, 9, 26, 52], plan: [51, 11, 12, 36, 35] },
  { plate: '417AHT02', driver: 'Абенов Руслан', x: 752, y: 190, rot: -14, past: [21, 43, 25], plan: [41, 16, 6, 42, 49] },
];
/* Route stops on the map (pin indices, in visiting order): past = completed stops of the in-progress trip, plan = its remaining
   stops. Counts match the trip progress (7/10, 4/9, 3/8); the pins on a route take the matching status */
for (const t of MAP_TRUCKS) { t.past.forEach(i => { pins[i].s = 'completed'; }); t.plan.forEach(i => { pins[i].s = 'assigned'; }); }
function mapTruck(t) {
  const m = sel => h('span', { className: 'pf-map__truckart pf-map__truckart--' + (sel ? 'on' : 'off') }, h(TruckMarker, { type: 'musorovoz', state: 'enroute', selected: sel, size: 64, rotate: t.rot, title: t.plate }));
  return h('button', { type: 'button', className: 'pf-map__truck' + (t.active ? ' is-active' : ''), 'data-pf-truck': t.plate, 'data-pf-driver': t.driver,
    'aria-label': 'Машина ' + t.plate + ', водитель ' + t.driver + ', мусоровоз ТБО, в пути', style: { left: t.x - 32 + 'px', top: t.y - 32 + 'px' } }, m(false), m(true));
}
function mapFrame() {
  return div('pf-map',
    h('img', { className: 'pf-map__bg', src: 'images/platform/map-almaty.webp', width: 1600, height: 900, alt: '' }),
    h('div', { className: 'pf-map__pins', role: 'group', 'aria-label': 'Площадки на карте', 'data-pf-roving': '', dangerouslySetInnerHTML: { __html: pins.map((pn, i) =>
      `<button type="button" class="pf-mpin" data-pf-site="${i}" tabindex="${i ? -1 : 0}" aria-label="${SITES[i].name}, ${SITES[i].addr}, ${JOB_WORD[SITES[i].pin]}" style="left:${pn.x - 14}px;top:${pn.y - 28}px">${pinMarkup(pn.s, 28, '')}</button>`).join('') } }),
    h('span', { className: 'pf-map__depot', 'data-pf-depot': '', 'aria-hidden': 'true' }, h(Icon, { name: 'garage-filled', size: 22, color: 'var(--icons-success)' })),
    ...MAP_TRUCKS.map(mapTruck),
    h('div', { className: 'pf-map__top', 'aria-hidden': 'true', inert: '' },
      h(SearchField, { placeholder: 'Поиск', width: 360 }),
      div('pf-map__tools', h(FilterButton, null, 'Фильтр'), h(IconButton, { icon: 'maximize-window', label: 'Развернуть карту' }))),
    h('span', { className: 'pf-map__attr', 'aria-hidden': 'true' }, '© 2GIS'));
}

/* ---------- Truck selected on map (Figma 23644:69979) ---------- */
function crew(initials, name, role, kind) {
  return div('pf-crew', h(Avatar, { initials, size: 24, role: kind }),
    div('pf-crew__who', p('caption-m-medium pf-ellipsis', name), p('caption-m-regular pf-muted', role)));
}
function metric(label, icon, value, chip) {
  return div('pf-metric', p('caption-caps-bold pf-muted', label),
    div('pf-metric__row', div('pf-metric__val', h(Icon, { name: icon, size: 24, color: 'var(--icons-information)' }), p('heading-h4-semibold pf-ink', value)),
      span('pf-chip caption-m-medium', chip)));
}
function trip(n, id, statusEl) {
  return div('pf-trip', div('pf-trip__main', span('pf-trip__ico', h(Icon, { name: 'journey', size: 20, color: 'var(--icons-information)' })),
    p('body-m-semibold', 'Рейс ' + n), p('body-m-semibold pf-link', id)),
    statusEl, h(IconButton, { icon: 'chevron-right', label: 'Открыть рейс', size: 'small' }));
}
/* Truck card (Figma 23644:69859, truck selected). Vehicle, crew and today's trips come from the truck's Gantt row; mileage, fuel and GPS are per-truck demo values */
const TRUCK_EXTRA = {
  '714SH02': { km: '45 км', odo: '126232 км', fuel: '89 л', left: 'Осталось 123 л', gps: '1 мин назад (13:32)' },
  '402BCK02': { km: '38 км', odo: '211480 км', fuel: '71 л', left: 'Осталось 96 л', gps: '2 мин назад (13:31)' },
  '417AHT02': { km: '41 км', odo: '187305 км', fuel: '77 л', left: 'Осталось 108 л', gps: '1 мин назад (13:32)' },
};
const pad = v => (v.length === 4 ? '0' + v : v);
function truckPanel(plate) {
  const trips = Object.values(ROUTES).filter(r => r.plate === plate && r.k !== 'ai');
  const r0 = trips[0], x = TRUCK_EXTRA[plate];
  const badge = r => r.k === 'completed' ? h(StatusBadge, { entity: 'route', status: 'completed' })
    : r.k === 'in-progress' ? h(StatusBadge, { entity: 'route', status: 'enroute', progress: r.done + '/' + r.total })
    : h(StatusBadge, { entity: 'route', status: 'assigned', progress: String(r.total) });
  return div('pf-truck',
    div('pf-truck__head',
      h('img', { className: 'pf-truck__img', src: 'images/platform/garbage-truck-green.webp', width: 96, height: 96, alt: '' }),
      div('pf-truck__info',
        h(PlateNumber, { size: 'large' }, plate),
        div('pf-truck__model', div('', p('body-m-medium', r0.model), p('caption-m-regular pf-muted', r0.vtype)),
          div('pf-depot', h(Icon, { name: 'garage', size: 24, color: 'var(--icons-success)' }), p('caption-m-medium pf-muted', r0.depot)))),
      h(IconButton, { icon: 'cancel', label: 'Закрыть карточку' })),
    h(Separator),
    div('pf-truck__body',
      div('pf-crewrow', ...r0.crew.map(c => crew(...c))),
      div('pf-metrics', metric('Пробег за смену', 'journey', x.km, x.odo), metric('Расход топлива', 'petrol', x.fuel, x.left))),
    h(Separator),
    div('pf-truck__trips',
      div('pf-shift', h(StatusBadge, { entity: 'shift', status: 'ttn_approved' }, 'Смена активна'), p('caption-m-medium pf-muted', 'На линии с ' + pad(r0.f))),
      ...trips.map(r => trip(r.trip, r.id, badge(r)))),
    h(Separator),
    div('pf-truck__foot',
      div('pf-gps', h(Icon, { name: 'navigation', size: 16, color: 'var(--icons-secondary)' }), p('caption-m-regular pf-muted', x.gps)),
      h(Button, { variant: 'secondary', icon: 'phone-calling' }, 'Связаться с экипажем')));
}

/* ---------- Route Gantt Chart Component, tab «Статус вывоза» (Figma 4439:1612) ---------- */
function bar(label, segs) {
  return div('pf-bar', p('caption-caps-bold', label),
    div('pf-bar__track', ...segs.map(([st, v, grow]) => h('span', { className: 'pf-seg pf-seg--' + st + ' caption-m-medium', style: { flexGrow: grow } }, v))));
}
const KPI = [
  { st: 'created', label: 'Неназначено', cols: [['Площадки', '2.2%', '43'], ['Объем', '4.2%', '128 м³']] },
  { st: 'assigned', label: 'Запланировано', cols: [['Площадки', '34.5%', '689'], ['Объем', '20.8%', '628 м³']] },
  { st: 'failed', label: 'Невывоз', cols: [['Площадки', '1.4%', '28'], ['Объем', '1.2%', '37 м³']] },
  { st: 'completed', label: 'Выполнено', cols: [['Площадки', '61.9%', '1238'], ['Объем', '73.8%', '2228 м³'], ['Вес', null, '278.5 т']] },
];
function kpi(k) {
  return div('pf-kpi',
    div('pf-kpi__head', h('span', { dangerouslySetInnerHTML: { __html: pinMarkup(k.st, 20) } }), p('caption-caps-bold', k.label)),
    div('pf-kpi__cols', ...k.cols.map(([l, pct, v]) => div('pf-kpi__col', p('caption-m-medium pf-muted', l),
      pct ? span('pf-kpi__pct pf-kpi__pct--' + k.st, pct) : span('pf-kpi__pct pf-kpi__pct--none', ' '), p('pf-kpi__num', v)))));
}
const FLEET = [
  { label: 'Мусоровозы ТБО', type: 'musorovoz', line: '30 из 32', pct: '93.8', lvl: 'green', vol: '1312.6 м³', vp: '91.2', wt: '164.3 т', wp: '90.4' },
  { label: 'Бункеровозы', type: 'truck', line: '5 из 6', pct: '83.3', lvl: 'yellow', vol: '418.0 м³', vp: '76.5', wt: '52.7 т', wp: '74.8' },
  { label: 'Мультилифты', type: 'dump', line: '3 из 6', pct: '50.0', lvl: 'orange', vol: '264.0 м³', vp: '58.3', wt: '33.1 т', wp: '55.9' },
  { label: 'Самосвалы', type: 'samosval', line: '2 из 5', pct: '40.0', lvl: 'red', vol: '126.0 м³', vp: '44.2', wt: '21.6 т', wp: '41.7' },
  { label: 'Ассенизаторы', type: 'desinfection', line: '2 из 2', pct: '100', lvl: 'green', vol: '107.8 м³', vp: '96.3', wt: '6.8 т', wp: '97.1' },
];
function fleetRow(left, badge) { return div('pf-frow', p('body-m-medium', left), badge); }
function fleet(f) {
  return div('pf-fleet',
    div('pf-fleet__head', p('caption-caps-bold', f.label), span('pf-fleet__ico', h(TruckMarker, { type: f.type, state: 'enroute', size: 40 }))),
    fleetRow(f.line, h(PercentBadge, { level: f.lvl, value: f.pct })),
    fleetRow(f.vol, h(PercentBadge, { level: 'disabled', value: f.vp })),
    fleetRow(f.wt, h(PercentBadge, { level: 'disabled', value: f.wp })));
}
/* ---------- Tab «Расписание маршрутов» (Figma 4439:1609, State=Route schedule) ---------- */
const HOURS = ['6:00', '7:00', '8:00', '9:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'];
/* One shift day at 13:32 (the GPS time on the truck card): trips before it are done, one is in progress,
   later ones are assigned or proposed by the AI dispatcher. Bars are placed by clock time. */
const T = t => { const [hh, mm] = t.split(':').map(Number); return hh + mm / 60 - 6; };
const gtrip = (k, id, sites, count, from, to) => ({ k, id, sites, count, f: from, t: to, from: T(from), to: T(to) });
const D = (...x) => gtrip('completed', ...x), P = (...x) => gtrip('in-progress', ...x), A = (...x) => gtrip('assigned', ...x);
const AI = (site, from, to) => ({ k: 'ai', sites: [site], f: from, t: to, from: T(from), to: T(to) });
const GANTT = [
  { title: 'Внимание', alert: true, rows: [
    { plate: '381BCJ02', jobs: 14, warn: true, trips: [D('M101', ['Школа Шыгула', 'Элиф Гарден'], '2/2', '6:00', '10:40'), P('M107', ['СПА'], '0/1', '10:45', '14:10'), AI('Самал-2', '14:15', '17:40')] },
    { plate: '265AOK02', jobs: 9, warn: true, trips: [D('M102', ['Орбита-1'], '3/3', '6:30', '11:10'), P('M115', ['Аксай-4', 'Мамыр-7'], '1/2', '11:15', '14:30'), A('M131', ['Ривьера'], '2', '14:35', '17:20')] },
    { plate: '211KTA02', jobs: 11, warn: true, selected: { shift: 'S234', driver: 'Айбол Санаев' },
      trips: [D('M103', ['Тастак', 'Жетысу-2'], '2/2', '6:00', '9:50'), P('M118', ['Коктем-3'], '0/1', '9:55', '13:45'), AI('Нурлы Тау', '13:50', '16:50')] }] },
  { title: 'Бункеровозы', count: '5/6', rows: [
    { plate: '382BHR02', jobs: 6, split: { at: 2, driver: 'Ахметжанов Нурбол' }, trips: [D('M201', ['Алатау Сити'], '1/1', '6:00', '8:40'), D('M204', ['Казахфильм', 'Самал-2'], '2/2', '8:45', '12:20'), P('M209', ['Ривьера'], '0/1', '12:25', '14:40'), A('M215', ['Орбита-1'], '1', '14:45', '16:30')] },
    { plate: '917ACX02', jobs: 4, split: { at: 2, driver: 'Искаков Дамир' }, trips: [D('M202', ['Элиф Гарден'], '1/1', '7:00', '10:10'), P('M207', ['Школа Шыгула', 'СПА'], '1/2', '10:15', '14:00'), A('M216', ['Мамыр-7'], '1', '14:05', '15:50')] },
    { plate: '044BMN02', jobs: 5, trips: [D('M203', ['Аксай-4'], '1/1', '6:30', '9:30'), P('M208', ['Тастак'], '0/1', '9:35', '13:50'), AI('Коктем-3', '13:55', '17:10')] }] },
  { title: 'Мусоровозы ТБО', count: '30/32', rows: [
    { plate: '714SH02', jobs: 22, trips: [P('M235', ['Самал-2', 'Коктем-3'], '7/10', '6:32', '14:20'), A('M241', ['Орбита-1'], '12', '14:30', '17:30')] },
    { plate: '402BCK02', jobs: 18, trips: [D('M231', ['Мамыр-7'], '9/9', '6:00', '10:30'), P('M238', ['Аксай-4'], '4/9', '10:35', '15:10')] },
    { plate: '417AHT02', jobs: 16, trips: [D('M232', ['Жетысу-2'], '8/8', '6:00', '11:00'), P('M239', ['Тастак'], '3/8', '11:05', '15:30'), AI('Нурлы Тау', '15:35', '17:50')] }] },
  { title: 'Мультилифты', count: '3/6', rows: [
    { plate: '521BCM02', jobs: 3, trips: [D('M301', ['Казахфильм'], '1/1', '7:30', '10:00'), P('M305', ['Алатау Сити'], '0/1', '10:05', '13:40'), A('M309', ['Ривьера'], '1', '13:45', '15:20')] },
    { plate: '533ARE02', jobs: 2, trips: [D('M302', ['Нурлы Тау'], '1/1', '8:00', '11:30'), A('M306', ['СПА'], '1', '13:00', '15:00')] },
    { plate: '608BTK02', jobs: 2, trips: [P('M303', ['Самал-2'], '0/1', '12:00', '14:30'), A('M307', ['Орбита-1'], '1', '14:40', '16:20')] }] },
];
const place = (from, to) => ({ '--t0': from.toFixed(3), '--dt': (to - from).toFixed(3) });
const TRIP_WORD = { completed: 'выполнен', 'in-progress': 'в процессе', assigned: 'назначен', ai: 'предложение AI-диспетчера' };
function tripBar(t) {
  const btn = { type: 'button', 'data-pf-route': t.key, tabIndex: t.key === '0-0' ? 0 : -1, style: place(t.from, t.to),
    'aria-label': (t.id ? 'Рейс ' + t.id + ', ' : '') + t.sites.join(', ') + ', ' + TRIP_WORD[t.k] + ', ' + t.f + '–' + t.t };
  if (t.k === 'ai') return h('button', { ...btn, className: 'pf-gbar pf-gbar--ai' },
    span('pf-gbar__lead', h(Icon, { name: 'ai', size: 16, color: 'var(--icons-ai)' }), span('caption-m-medium pf-gbar__sites', t.sites[0])), span('caption-m-medium', 'Оптимально'));
  return h('button', { ...btn, className: 'pf-gbar pf-gbar--' + t.k },
    span('pf-gbar__id caption-m-medium', t.id), span('pf-gbar__sites caption-m-medium', t.sites.join('  |  ')), span('pf-gbar__count', t.count));
}
const SHIFT_WORD = { active: 'Активная смена', done: 'Смена завершена', plan: 'Плановая смена' };
/* One container per shift: its trips plus a hover-only outline with the shift id and driver. AI proposals belong to no shift. */
function shiftBox(sh) {
  const a = sh.trips[0], z = sh.trips[sh.trips.length - 1];
  return div('pf-gshift',
    h('div', { className: 'pf-gsel', 'aria-hidden': 'true', style: place(a.from, z.to) },
      div('pf-gtip caption-m-medium', span('pf-gtip__on pf-gtip__on--' + sh.state, SHIFT_WORD[sh.state]), span('', sh.id), span('', sh.driver))),
    ...sh.trips.map(tripBar));
}
/* Crew alerts on the «Внимание» rows: hovering (or focusing) the red icon opens a card with the problem and one action.
   The action opens the row's in-progress trip in the side card (crew contacts, job list). */
const ALERTS = {
  '381BCJ02': { title: 'Произошло ДТП', src: 'Сообщение водителя', at: '13:12', cta: ['Связаться с экипажем', 'phone-calling'],
    text: (r, t) => r.shifts[0].driver + ' сообщает, что попал в ДТП на рейсе ' + t.id + '. Машина не может ехать дальше, нужна буксировка.' },
  '265AOK02': { title: 'КП запаркована', src: 'Сообщение водителя', at: '13:24', cta: ['Переназначить задание', 'redo'],
    text: (r, t) => r.shifts[0].driver + ' сообщает, что на задании по адресу ' + ROUTES[t.key].points.find(x => x.st === 'enroute').addr
      + ' контейнерную площадку перекрыли припаркованные машины. Вывоз невозможен.' },
  '211KTA02': { title: 'Обнаружен простой техники', src: 'GPS-трекер', at: '13:08', cta: ['Связаться с экипажем', 'phone-calling'],
    text: (r, t) => r.shifts[0].driver + ' больше 20 минут стоит на одной точке и не движется. Рейс ' + t.id + ' может сорваться.' },
};
const ALERT_PLATES = Object.keys(ALERTS);
function alertIcon(r) {
  const a = ALERTS[r.plate], t = r.trips.find(x => x.k === 'in-progress'), id = 'pf-galert-' + r.plate;
  if (!a) return h(Icon, { name: 'error', size: 20, color: 'var(--icons-error)' });
  return span('pf-galert',
    h('button', { type: 'button', className: 'pf-galert__btn', tabIndex: -1, 'aria-label': 'Проблема: ' + a.title, 'aria-describedby': id },
      h(Icon, { name: 'error', size: 20, color: 'var(--icons-error)' })),
    h('div', { className: 'pf-gcard', id, role: 'note', 'data-pf-open': t.key },
      div('pf-gcard__head', h(Icon, { name: 'error', size: 20, color: 'var(--icons-error)' }), p('body-m-semibold pf-gcard__title', a.title)),
      p('caption-m-medium pf-muted', a.src + ' · ' + a.at + ' · ' + r.plate),
      p('body-m-regular pf-gcard__text', a.text(r, t)),
      h(Button, { variant: 'primary', size: 'small', icon: a.cta[1] }, a.cta[0])));
}
function ganttRow(r) {
  return div('pf-grow',
    h('div', { className: 'pf-gtruck' },
      h('span', { className: 'pf-gtruck__ai', 'aria-hidden': 'true' }, h(Icon, { name: 'ai', size: 16, color: 'var(--icons-secondary)' })),
      span('pf-gtruck__plate caption-m-medium', r.plate),
      r.warn ? alertIcon(r) : null,
      h('span', { className: 'pf-gtruck__count', 'aria-label': r.jobs + ' заданий' }, String(r.jobs))),
    div('pf-gbars', ...r.shifts.map(shiftBox), ...r.trips.filter(t => t.k === 'ai').map(tripBar)));
}
/* ---------- Click-to-inspect (Figma 23644:69859: truck / pin on map / route item selected) ---------- */
let seed = 20260106;
const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const pick = a => a[Math.floor(rnd() * a.length)];
const initials = nm => nm.split(' ').map(w => w[0]).join('');
const SITE_NAMES = ['Школа Шыгула', 'ЖК Элиф Гарден', 'ЖК Ривьера', 'СПА-центр «Тау»', 'Гимназия №159', 'Детский сад «Балапан»', 'Поликлиника №5',
  'ЖК Нурлы Тау', 'Рынок «Тастак»', 'ТЦ «Орбита»', 'ул. Толе би, 112', 'пр. Абая, 48', 'ул. Жандосова, 7', 'мкр. Орбита-1, 12', 'мкр. Аксай-4, 31',
  'мкр. Мамыр-7, 8', 'мкр. Жетысу-2, 15', 'мкр. Коктем-3, 21', 'ул. Розыбакиева, 247', 'ул. Сатпаева, 90', 'ул. Тимирязева, 42', 'ул. Байзакова, 280',
  'ул. Муканова, 223', 'ул. Гагарина, 135', 'ул. Ауэзова, 60', 'ул. Шевченко, 165', 'ул. Кабанбай батыра, 86', 'ул. Фурманова, 174', 'ул. Утепова, 19',
  'ул. Жамакаева, 344', 'ул. Карасай батыра, 363', 'ул. Светлозаводская, 453', 'ул. Абая, 56', 'Школа №153', 'Лицей №165', 'Колледж связи',
  'Кафе «Достар»', 'Ресторан «Алаша»', 'БЦ «Нурлы Тау»', 'Автосервис «Барыс»', 'ЖК «Алатау Сити»', 'Студгородок КазНУ', 'Городская больница №7',
  'ЖК «Хан Тенгри»', 'мкр. Самал-1, 9', 'мкр. Тастак-2, 4', 'ул. Навои, 208', 'ул. Бухар жырау, 33', 'ул. Шарипова, 90', 'ул. Курмангазы, 145',
  'ул. Айтеке би, 77', 'ул. Гоголя, 201', 'ул. Райымбека, 348', 'Киностудия «Казахфильм»'];
const JOB_WORD = { created: 'неназначено', assigned: 'назначено', 'in-progress': 'машина в пути', completed: 'выполнено', failed: 'невывоз' };
const CLIENTS = [['ТОО «Достар Фуд»', 'Ресторан'], ['ИП Смагулова А.', 'Магазин'], ['ТОО «Алатау Сервис»', 'Офис'], ['КГУ «Гимназия №159»', 'Школа'],
  ['ИП Нурланов Б.', 'Кафе'], ['ОСИ «Ривьера»', 'Жилой дом'], ['ТОО «Тау Строй»', 'Стройка'], ['ИП Жумабекова Г.', 'Аптека'], ['ТОО «Арман Маркет»', 'Супермаркет'],
  ['КСК «Самал»', 'Жилой дом'], ['ТОО «Береке Трейд»', 'Склад'], ['ИП Ахметов Р.', 'Автомойка'], ['ТОО «Медсервис Алматы»', 'Клиника'], ['ИП Ким Е.', 'Пекарня']];
/* Street address for sites named after a facility (ЖК, школа, рынок…); street-named sites are their own address */
const FACILITY_ADDRS = ['ул. Шугыла, 340/4', 'пр. Райымбека, 514а', 'ул. Ауэзова, 175', 'ул. Кунаева, 21б', 'мкр. Аксай-3а, 62', 'ул. Жандосова, 98',
  'ул. Тлендиева, 133', 'пр. Аль-Фараби, 77/8', 'ул. Райымбека, 239', 'мкр. Орбита-2, 30', 'ул. Сейфуллина, 404', 'пр. Абая, 150/230', 'ул. Толе би, 286/4', 'ул. Шевченко, 118'];
const MANAGERS = ['Исаханов Максат', 'Ермекова Дана', 'Сапаров Нурлан', 'Ким Анастасия', 'Тулегенов Арман'];
const SITES = pins.map((pn, i) => {
  const name = SITE_NAMES[i % SITE_NAMES.length];
  const kind = i % 9 === 4 ? 'Площадка КГО' : i % 11 === 7 ? 'Бункерная площадка СО' : 'Точка вывоза ТБО';
  const hours = pick(['08:00 - 23:00', '06:00 - 22:00', 'Круглосуточно', '09:00 - 20:00', '07:00 - 21:00']);
  const groups = Array.from({ length: 1 + (rnd() < 0.55 ? 1 : 0) }, () => {
    const c = pick(CLIENTS);
    return { cont: kind === 'Бункерная площадка СО' ? 'Бункер 8 м³' : pick(['1.1 евро', '1.1 евро', '0.75']), n: 1 + Math.floor(rnd() * 6), sched: rnd() < 0.7, client: c[0], role: c[1] };
  });
  const extra = rnd() < 0.6 ? 2 + Math.floor(rnd() * 18) : 0;
  const n = 1 + Math.floor(rnd() * 3);
  const st = pn.s;
  const jobs = Array.from({ length: n }, (_, k) => {
    const last = k === n - 1;
    const status = st === 'completed' ? 'completed' : st === 'failed' ? (last ? 'not_completed' : 'completed')
      : st === 'in-progress' ? (last ? pick(['enroute', 'on_service']) : 'completed') : st === 'assigned' ? 'assigned' : 'created';
    return { id: 'Z' + (2222310 + i * 7 + k), status };
  });
  const addr = /^(ул.|пр.|мкр.)/.test(name) ? name : FACILITY_ADDRS[i % FACILITY_ADDRS.length];
  return { name, addr, kind, hours, pin: st, groups, extra, jobs, manager: MANAGERS[i % MANAGERS.length] };
});

const VEH = {
  musorovoz: { label: 'Мусоровоз ТБО', route: 'Маршрут ТБО', models: ['Iveco EuroCargo SB-800', 'КамАЗ 53605 МК-4546', 'МАЗ 5340 КО-427'], loaders: 2 },
  bunker: { label: 'Бункеровоз', route: 'Маршрут КГО', models: ['КамАЗ 43253 МКС-4505', 'МАЗ 5550 бункеровоз'], loaders: 0 },
  multilift: { label: 'Мультилифт', route: 'Маршрут СО', models: ['Volvo FM мультилифт', 'КамАЗ 65115 мультилифт'], loaders: 0 },
};
const ROW_TYPE = { '381BCJ02': 'bunker', '265AOK02': 'bunker', '211KTA02': 'musorovoz' };
const GROUP_TYPE = { 'Бункеровозы': 'bunker', 'Мусоровозы ТБО': 'musorovoz', 'Мультилифты': 'multilift' };
const DRIVERS = ['Нуржанов Данияр', 'Ким Сергей', 'Бекмуханов Алибек', 'Оспанов Ержан', 'Тлеуов Мирас', 'Сейткали Асет', 'Жунусов Бауыржан', 'Абенов Руслан',
  'Мухтаров Самат', 'Есенов Талгат', 'Касымов Олжас'];
const LOADERS = ['Сарсенов Ильяс', 'Каримов Тимур', 'Жакупов Адиль', 'Омаров Азамат', 'Бакытжанов Ерасыл', 'Ли Максим', 'Серикбаев Нурсултан', 'Дюсенов Арман'];
const ADDRS = ['ул. Абая, 56', 'ул. Жамакаева, 344', 'ул. Светлозаводская, 453', 'ул. Карасай батыра, 363', 'ул. Толе би, 112', 'пр. Абая, 48', 'ул. Жандосова, 7',
  'мкр. Орбита-1, 12', 'ул. Розыбакиева, 247', 'ул. Сатпаева, 90', 'ул. Тимирязева, 42', 'ул. Байзакова, 280', 'ул. Муканова, 223', 'ул. Гагарина, 135',
  'ул. Ауэзова, 60', 'ул. Шевченко, 165', 'ул. Кабанбай батыра, 86', 'ул. Фурманова, 174', 'мкр. Аксай-4, 31', 'мкр. Мамыр-7, 8', 'мкр. Жетысу-2, 15',
  'мкр. Коктем-3, 21', 'ул. Утепова, 19', 'ул. Навои, 208', 'ул. Шарипова, 90', 'ул. Курмангазы, 145', 'ул. Айтеке би, 77', 'ул. Гоголя, 201'];
const AUTHORS = ['Бибинур Байдарова', 'Арайлым Бекова', 'Жанар Сулейменова'];
const ROUTES = {};
let rowIdx = 0, addrSeq = 0, drvSeq = 0, ldSeq = 0;
for (const g of GANTT) for (const r of g.rows) {
  const ri = rowIdx++;
  const type = ROW_TYPE[r.plate] || GROUP_TYPE[g.title];
  const v = VEH[type];
  const own = r.plate === '714SH02';
  const driver = r.selected ? r.selected.driver : DRIVERS[drvSeq++ % DRIVERS.length];
  const crewOf = drv => own
    ? [['АЕ', 'Асаубаев Ерлан', 'Водитель', 'driver'], ['ОО', 'Орманбай Орнатаев', 'Грузчик', 'loader'], ['ЖЕ', 'Жетибай Ермуханов', 'Грузчик', 'loader']]
    : [[initials(drv), drv, 'Водитель', 'driver']].concat(Array.from({ length: v.loaders }, () => {
      const nm = LOADERS[ldSeq++ % LOADERS.length]; return [initials(nm), nm, 'Грузчик', 'loader'];
    }));
  /* Shifts: consecutive non-AI trips; a split row hands over to a second driver at trip `split.at` */
  const real = r.trips.filter(t => t.k !== 'ai'), cut = r.split ? r.split.at : real.length;
  r.shifts = [real.slice(0, cut), real.slice(cut)].filter(x => x.length).map((trips, si) => {
    const drv = si ? r.split.driver : own ? 'Асаубаев Ерлан' : driver;
    const ks = trips.map(t => t.k);
    const state = ks.includes('in-progress') ? 'active' : ks.every(k => k === 'completed') ? 'done' : ks.every(k => k === 'assigned') ? 'plan' : 'active';
    const sh = { id: si ? 'S' + (260 + ri) : r.selected ? r.selected.shift : 'S' + (240 + ri), driver: drv, state, trips, crew: crewOf(drv) };
    trips.forEach(t => { t.shift = sh; });
    return sh;
  });
  const crew = r.shifts[0].crew;
  const model = own ? 'Iveco EuroCargo SB-800' : v.models[ri % v.models.length];
  const depot = own ? 'ПрУ МЕД' : ['ПрУ АЛМ', 'ПрУ МЕД', 'ПрУ АУЭ'][ri % 3];
  r.trips.forEach((t, ti) => {
    t.key = ri + '-' + ti;
    const [done, total] = t.k === 'ai' ? [0, 3] : t.count.includes('/') ? t.count.split('/').map(Number) : [0, Number(t.count)];
    const points = Array.from({ length: total }, (_, k) => ({
      addr: ADDRS[addrSeq++ % ADDRS.length],
      cont: (type === 'musorovoz' ? pick(['1.1 евро', '1.1 евро', '0.75']) + ' (' + (1 + Math.floor(rnd() * 6)) + ')' : 'Бункер 8 м³ (1)') + (rnd() < 0.35 ? ' · РСО (1)' : ''),
      st: t.k === 'completed' || k < done ? 'completed' : t.k === 'in-progress' && k === done ? 'enroute' : 'assigned',
    }));
    ROUTES[t.key] = {
      trip: ti + 1, id: t.id || null, k: t.k, f: t.f, t: t.t, done, total, plate: r.plate, model, vtype: v.label, rtype: v.route, depot, crew: t.shift ? t.shift.crew : crew, points,
      author: t.k === 'ai' ? ['AI-диспетчер', 'Предложение'] : [AUTHORS[ri % AUTHORS.length], 'Автор'],
    };
  });
}

/* ---------- Photo proof per completed job (Figma 19635:35376 «Отчёт о выполнении задания») ----------
   Own seeded generator so the site/route data above stays unchanged. The crew is the map truck whose finished stops
   include the site, otherwise a Gantt truck by turn. Photos: images/platform/proof/{b,a}{1-4}.webp (Higgsfield, see PROVENANCE.md). */
let pseed = 4242;
const prnd = () => (pseed = (pseed * 16807) % 2147483647) / 2147483647;
const ppick = a => a[Math.floor(prnd() * a.length)];
const hhmm = m => String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
const FIRST_TRIP = {};
for (const r of Object.values(ROUTES)) if (!FIRST_TRIP[r.plate] && r.id) FIRST_TRIP[r.plate] = r;
const PROOF_PLATES = Object.keys(FIRST_TRIP).filter(pl => !ALERT_PLATES.includes(pl));
/* The truck type follows the site: TBO points get a rear-loader, KGO and skip sites a skip loader or multilift */
const platesFor = kind => PROOF_PLATES.filter(pl => kind === 'Точка вывоза ТБО' ? FIRST_TRIP[pl].vtype === 'Мусоровоз ТБО' : FIRST_TRIP[pl].vtype !== 'Мусоровоз ТБО');
const CAP = { '1.1 евро': 1.1, '0.75': 0.75, 'Бункер 8 м³': 8 };
const JOB_TYPE = { 'Точка вывоза ТБО': 'Вывоз ТБО', 'Площадка КГО': 'Вывоз КГО', 'Бункерная площадка СО': 'Замена бункера' };
const sceneOf = s => s.kind !== 'Точка вывоза ТБО' ? 2 : /Школа|Гимназия|Лицей|сад|Колледж|КазНУ/.test(s.name) ? 3 : /^(ул.|пр.)/.test(s.name) ? 4 : 1;
let orderSeq = 0, doneAt = 0;
SITES.forEach((st, i) => {
  const mt = st.kind === 'Точка вывоза ТБО' && MAP_TRUCKS.find(t => t.past.includes(i)), pool = platesFor(st.kind);
  const plate = mt ? mt.plate : pool[i % pool.length];
  const r = FIRST_TRIP[plate];
  const g = st.groups[0], cap = CAP[g.cont] || 1.1, scene = sceneOf(st);
  st.x = pins[i].x; st.y = pins[i].y;
  st.jobs.forEach((j, k) => {
    if (j.status !== 'completed') return;
    doneAt = 6 * 60 + 34 + Math.floor(prnd() * 400);
    const fills = Array.from({ length: g.n }, () => ppick([1, 1, 1, 1.25, 0.75, 0.5, 1, 0]));
    const vol = fills.reduce((a, f) => a + f * cap, 0);
    j.proof = {
      scene, at: hhmm(doneAt), before: hhmm(doneAt - 3 - Math.floor(prnd() * 4)), plate, model: r.model, vtype: r.vtype, depot: r.depot,
      crew: r.crew.map(c => c[1]), route: r.id, client: g.client, order: 'O' + (124310 + i * 13 + k + orderSeq++),
      type: JOB_TYPE[st.kind], cont: g.cont === 'Бункер 8 м³' ? '8-кубовый' : g.cont, n: g.n, nominal: +(cap * g.n).toFixed(2), vol: +vol.toFixed(2), fills,
      repeat: prnd() < 0.25, check: prnd() < 0.7 ? 'none' : 'ok', stay: 2 + Math.floor(prnd() * 5),
    };
  });
});

function sidePanel() {
  return h('div', { className: 'pf-side', role: 'region', 'aria-label': 'Карточка выбранного объекта', 'aria-live': 'polite' },
    ...MAP_TRUCKS.map(t => h('div', { className: 'pf-slot', 'data-pf-card': 'truck-' + t.plate, hidden: !t.active }, truckPanel(t.plate))),
    h('div', { className: 'pf-slot', 'data-pf-card': 'dyn', hidden: true }));
}

function scheduleTools() {
  const seg = (a, b) => div('pf-iseg', span('pf-iseg__item is-selected', h(Icon, { name: a, size: 20, color: 'var(--icons-action)' })),
    span('pf-iseg__item', h(Icon, { name: b, size: 20 })));
  return div('pf-status__tools pf-status__tools--schedule',
    h(DateButton, { value: '6 Янв 2026', arrows: true }),
    div('pf-tools__group', seg('garbage-truck', 'user-contact'), seg('source-driverapp', 'navigation'),
      h(Select, { value: 'Все', width: 160 }), h(Select, { value: 'ПрУ АЛМ', width: 160 })),
    h(IconButton, { icon: 'expand', label: 'Развернуть' }));
}
function schedulePanel() {
  return div('pf-gantt',
    h('div', { className: 'pf-ghours', 'aria-hidden': 'true' }, ...HOURS.map((t, i) => h('span', { className: 'pf-ghour caption-m-medium', style: { '--t0': i } }, t))),
    h('div', { className: 'pf-gbody', tabIndex: -1, role: 'group', 'aria-label': 'Рейсы по машинам', 'data-pf-roving': '' },
      ...GANTT.map(g => div('pf-ggroup',
        div('pf-ggroup__head' + (g.alert ? ' is-alert' : ''),
          g.alert ? h(Icon, { name: 'error', size: 16, color: 'var(--icons-error)' }) : null,
          span('caption-caps-bold', g.title), g.count ? h(DS.CounterBadge, { count: g.count, tone: 'neutral' }) : null),
        ...g.rows.map(ganttRow)))));
}

const hide = { 'aria-hidden': 'true', inert: '' };
function statusBlock() {
  const tab = (id, label, on) => h('button', { type: 'button', role: 'tab', id: 'pf-tab-' + id, 'aria-selected': on ? 'true' : 'false',
    'aria-controls': 'pf-panel-' + id, tabIndex: on ? 0 : -1, className: 'pf-ftab caption-caps-bold' + (on ? ' is-selected' : ''), 'data-pf-tab': id }, label);
  return div('pf-status',
    div('pf-status__bar',
      h('div', { className: 'pf-ftabs', role: 'tablist', 'aria-label': 'Вкладки дэшборда' },
        tab('status', 'Статус вывоза', true), tab('schedule', 'Расписание маршрутов', false)),
      h('div', { className: 'pf-tools', ...hide },
        h('div', { 'data-pf-tools': 'status', className: 'pf-status__tools' }, h(DateButton, { value: '6 Янв 2026', arrows: true }), h(Select, { value: 'Депо №1', width: 160 })),
        h('div', { 'data-pf-tools': 'schedule', hidden: true }, scheduleTools()))),
    h('div', { className: 'pf-panel', role: 'tabpanel', id: 'pf-panel-schedule', 'aria-labelledby': 'pf-tab-schedule', hidden: true },
      h('p', { className: 'pf-sr' }, 'Расписание маршрутов: рейсы машин по часам с 6:00 до 18:00, сгруппированные по типам техники; выполненные, текущие, назначенные и предложенные AI-диспетчером рейсы.'),
      h('div', null, schedulePanel())),
    h('div', { className: 'pf-panel', role: 'tabpanel', id: 'pf-panel-status', 'aria-labelledby': 'pf-tab-status' },
    h('p', { className: 'pf-sr' }, 'Статус вывоза: план и факт по площадкам и объёму, сводка по статусам и технике на линии.'),
    h('div', { className: 'pf-panel__body', ...hide },
    div('pf-status__kpis',
      div('pf-bars',
        bar('Вывоз по площадкам', [['created', '43', 0], ['assigned', '689', 0.56], ['completed', '1238', 1], ['failed', '28', 0]]),
        bar('Вывоз по объёму', [['created', '128 м³', 0], ['assigned', '628 м³', 0.28], ['completed', '2228 м³', 1], ['failed', '37 м³', 0]])),
      ...KPI.map(kpi)),
    div('pf-status__fleet',
      div('pf-fleet pf-fleet--total',
        div('pf-fleet__head', p('caption-caps-bold', 'Техника на линии'), span('pf-bigpct', '82.4%')),
        fleetRow('На линии', p('body-m-medium', '42 из 51')), fleetRow('Объём', p('body-m-medium', '2228.4 м³')), fleetRow('Вес', p('body-m-medium', '278.5 т'))),
      ...FLEET.map(fleet)))));
}

/* ---------- DS MapPin markup per status; every placed copy gets its own SVG ids ---------- */
const PIN_HTML = {};
for (const st of PIN_STATUSES) for (const size of [28, 20]) PIN_HTML[st + size] = renderToStaticMarkup(h(MapPin, { status: st, size }));
let pinSeq = 0;
function pinMarkup(st, size, style) {
  const n = ++pinSeq;
  const svg = PIN_HTML[st + size].replace(/(id="|#)(r[0-9a-z]+)/g, (m, a, id) => a + 'pf' + n + id);
  return svg.replace('<span class="rc-pin" style="', '<span class="rc-pin" style="' + (style || ''));
}

const screen = h('div', { className: 'pf-screen' },
  h('div', { className: 'pf-contents' }, h(SideNav, { value: 'dashboard', groups: NAV, aiSwitch: true, aiOn: true, quickActions: true, user: { initials: 'АБ', name: 'Арайлым Б.', role: 'Диспетчер' } })),
  div('pf-main', h('div', { className: 'pf-top' }, mapFrame(), sidePanel()), statusBlock()));

let html = renderToStaticMarkup(screen, { identifierPrefix: 'pf' });
let svgSeq = 0;
html = html.replace(/<svg[\s\S]*?<\/svg>/g, svg => {
  const n = 's' + (++svgSeq) + '-';
  return svg.replace(/id="([^"]+)"/g, (m, id) => `id="${n}${id}"`).replace(/url\(#([^)]+)\)/g, (m, id) => `url(#${n}${id})`)
    .replace(/(xlink:href|href)="#([^"]+)"/g, (m, a, id) => `${a}="#${n}${id}"`);
});
/* Side nav: page items become buttons (hover/focus shows what the page does, script.js); logo, quick actions and user block stay inert */
html = html.replace(/ href="#"/g, '').replace(/<a class="rc-sidenav__item([^"]*)"([^>]*)>([\s\S]*?)<span class="rc-sidenav__label">([^<]+)<\/span>/g,
  (m, cls, attrs, pre, label) => '<button type="button" class="rc-sidenav__item' + cls + '"' + attrs + ' data-pf-nav="' + label + '">' + pre + '<span class="rc-sidenav__label">' + label + '</span>')
  .replace(/<\/a>/g, '</button>')
  .replace(/<nav class="rc-sidenav">/, '<nav class="rc-sidenav" aria-label="Разделы платформы">')
  .replace(/<div class="rc-sidenav__(logo|quick|utils|user)"/g, '<div aria-hidden="true" inert="" class="rc-sidenav__$1"')
  .replace(/<div class="rc-sidenav__groups"/, '<div class="rc-sidenav__groups" data-pf-roving=""');
html = html.replace(/<button type="button" aria-label="Закрыть карточку"/g, '<button type="button" data-pf-close aria-label="Закрыть карточку"');
/* Numbered route-point pins are not in the design system yet: exported from Figma (LocationPinWithStatus) */
const PIN_SVG = Object.fromEntries(['assigned', 'enroute', 'completed'].map(k => [k, fs.readFileSync(path.join(__dirname, 'pins', k + '.svg'), 'utf8')
  .replace(/<\?xml[^>]*>/, '').replace(/\s*preserveAspectRatio="none"/, '').replace(/\s*overflow="visible"/, '').replace(/\s*style="display: block;"/, '')
  .replace(/\r?\n\s*/g, '')]));
const R = el => renderToStaticMarkup(el);
const UI = {
  close: R(h(IconButton, { icon: 'cancel', label: 'Закрыть карточку' })).replace('<button type="button"', '<button type="button" data-pf-close'),
  btn: R(h(Button, { variant: 'secondary', iconRight: 'arrow-right' }, '__L__')),
  journey36: R(h(Icon, { name: 'journey', size: 36, color: 'var(--icons-information)' })),
  garage: R(h(Icon, { name: 'garage', size: 24, color: 'var(--icons-success)' })),
  photoOk: R(h(Icon, { name: 'photo-uploaded', size: 24, color: 'var(--icons-action)' })),
  photoNo: R(h(Icon, { name: 'photo-not-finished', size: 24, color: 'var(--icons-secondary)' })),
  sitePin: Object.fromEntries(PIN_STATUSES.map(st => [st, R(h(MapPin, { status: st, size: 36 }))])),
  numPin: PIN_SVG,
  proof: (() => {
    const tag = (html, attr) => html.replace('<button type="button"', '<button type="button" ' + attr);
    /* Container fill marker: the Figma TBO container shape (exported vector), tinted per fill level */
    const CONT_PATH = 'M2.04142 0C0.914556 0 0 0.836267 0 1.86667V5.6C0 6.6304 0.914556 7.46667 2.04142 7.46667H2.38033L5.5541 24.8792C5.88277 26.6786 7.58665 28 9.58112 28H20.4149C22.4114 28 24.1132 26.6786 24.4419 24.8792L27.6197 7.46667H27.9586C29.0854 7.46667 30 6.6304 30 5.6V1.86667C30 0.836267 29.0854 0 27.9586 0H2.04142Z';
    return {
      close: tag(R(h(IconButton, { icon: 'cancel', label: 'Закрыть отчёт' })), 'data-pf-pclose'),
      prev: tag(R(h(IconButton, { icon: 'chevron-down', label: 'Предыдущее задание' })), 'data-pf-pstep="-1"'),
      next: tag(R(h(IconButton, { icon: 'chevron-down', label: 'Следующее задание' })), 'data-pf-pstep="1"'),
      rotate: R(h(Icon, { name: 'rotate', size: 20 })),
      download: R(h(Icon, { name: 'download', size: 20 })),
      chev16: R(h(Icon, { name: 'chevron-down', size: 16 })),
      minus: R(h(Icon, { name: 'remove-task-icon', size: 24, color: 'var(--icons-action)' })),
      plus: R(h(Icon, { name: 'add-task-icon', size: 24, color: 'var(--icons-action)' })),
      share: tag(R(h(Button, { variant: 'secondary' }, 'Поделиться')), 'data-pf-pshare'),
      ok: tag(R(h(Button, { variant: 'accent-green' }, 'Подтвердить')), 'data-pf-pcheck="ok"'),
      sus: tag(R(h(Button, { variant: 'accent-orange' }, 'Подозрительно')), 'data-pf-pcheck="sus"'),
      bad: tag(R(h(Button, { variant: 'accent-red' }, 'Некорректно')), 'data-pf-pcheck="bad"'),
      pin: R(h(MapPin, { status: 'completed', size: 36 })),
      cont: '<svg width="30" height="28" viewBox="0 0 30 28" aria-hidden="true"><path d="' + CONT_PATH + '"/></svg>',
    };
  })(),
};
/* Street-following polylines for each truck's past and planned stretch (trace-routes.js, A* over the backdrop's road pixels) */
const stopAt = i => [pins[i].x, pins[i].y - 2];
const routeReq = {};
for (const t of MAP_TRUCKS) {
  routeReq[t.plate + ':past'] = t.past.map(stopAt).concat([[t.x, t.y]]);
  routeReq[t.plate + ':plan'] = [[t.x, t.y]].concat(t.plan.map(stopAt));
}
const traced = JSON.parse(require('child_process').execFileSync(process.execPath, [path.join(__dirname, 'trace-routes.js')], {
  input: JSON.stringify({ image: path.join(__dirname, '..', '..', 'images', 'platform', 'map-almaty.webp'), routes: routeReq }), maxBuffer: 1 << 24 }).toString());
const TRUCK_LINES = Object.fromEntries(MAP_TRUCKS.map(t => [t.plate, { past: traced[t.plate + ':past'], plan: traced[t.plate + ':plan'] }]));
const payload = JSON.stringify({ sites: SITES, routes: ROUTES, ui: UI, nav: NAV_TIPS,
  trucks: TRUCK_LINES,
  tips: { depot: { name: 'Депо №1', sub: 'ПрУ МЕД · пр. Суюнбая, 263' } } }).replace(/</g, '\\u003c');
html += '\n<script type="application/json" id="pf-data">' + payload + '</script>';
fs.writeFileSync(path.join(OUT, 'platform-fragment.html'), html);


/* ---------- Scoped stylesheet: DS tokens + DS component CSS + this organism ---------- */
let tokens = fs.readFileSync(path.join(DSDIR, 'tokens.css'), 'utf8');
tokens = tokens.replace(/^\.([a-z0-9-]+) \{/gm, '.rds .$1 {')
  .replace(/^:root, \[data-theme="light"\] \{/m, '.rds {').replace(/^:root \{/m, '.rds {')
  .replace(/^@font-face.*$/gm, l => /MedeoSansVariable\.woff2/.test(l) ? l : '');
let bundle = fs.readFileSync(path.join(DSDIR, 'components/bundle.css'), 'utf8');
bundle = bundle.replace(/^@import[^\n]*\n/m, '').replace(/^body\{[^}]*\}\n?/m, '');
const css = (tokens + '\n' + bundle).replace(/\/\*[\s\S]*?\*\//g, '').replace(/[ \t]+$/gm, '').replace(/\n\s*\n+/g, '\n');
fs.writeFileSync(process.env.CSS_OUT || path.join(OUT, 'platform-ds.css'),
  '/* RaccoonAI Design System for Claude (tokens.css + components/bundle.css), scoped to .rds. Generated; do not edit by hand. */\n' + css);
console.log('fragment', html.length, 'pins', pins.length);
