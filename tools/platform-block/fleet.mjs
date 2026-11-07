// Fleet for the Platform map: every truck of the depot on the map, each with its day route and its job pins.
//
//   node tools/platform-block/fleet.mjs            (from the repo root; needs network on the first run)
//
// Reads the shipped Platform data (index.html #pf-data), then:
//   - places the 9 trucks of the Gantt that the build left off the map, along their trips of the day
//     (completed trips, the trip in progress, the next assigned trip; AI suggestions are not routes yet);
//   - adds 17 trucks so the fleet is 10 refuse trucks (2 in the depot), 6 skip loaders (1), 6 hook lifts (3),
//     5 dump trucks (2) and 2 vacuum trucks (0): 29, 21 on the line;
//   - gives every stop a site (a job pin) snapped to a real road (OSRM nearest) with its Russian street
//     address (Nominatim reverse), and every truck its street route (OSRM route) as past / planned polylines;
//   - writes platform-fleet.js (window.PF_FLEET, merged by script.js before the Platform starts) and rewrites the
//     numbers of the «Статус вывоза» tab in index.html from the sites and trucks now on the map.
// Network answers are cached in fleet-cache.json, so later runs are offline and give the same result.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, '..', '..');
const INDEX = path.join(ROOT, 'index.html');
const CACHE_FILE = path.join(HERE, 'fleet-cache.json');
const OUT = path.join(ROOT, 'platform-fleet.js');

const html = fs.readFileSync(INDEX, 'utf8');
const PF = JSON.parse(html.match(/<script type="application\/json" id="pf-data">([\s\S]*?)<\/script>/)[1]);

/* ---------- backdrop px <-> geo (same fit as GEO in script.js) ---------- */
const GEO = { a: 3497284.9656436485, bx: -2495094.399519851, by: -1281326.2418159847 };
const toGeo = ([x, y]) => { const X = (x - GEO.bx) / GEO.a, Y = (y - GEO.by) / GEO.a; return [X * 360 - 180, Math.atan(Math.sinh(Math.PI * (1 - 2 * Y))) * 180 / Math.PI]; };
const toPx = ([lng, lat]) => { const f = lat * Math.PI / 180; return [GEO.a * (lng + 180) / 360 + GEO.bx, GEO.a * (1 - Math.log(Math.tan(f) + 1 / Math.cos(f)) / Math.PI) / 2 + GEO.by]; };

/* ---------- seeded random ---------- */
let seed = 20261108;
const rnd = () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const ri = (a, b) => a + Math.floor(rnd() * (b - a + 1));
const pick = arr => arr[Math.floor(rnd() * arr.length)];

/* ---------- network with cache ---------- */
const cache = fs.existsSync(CACHE_FILE) ? JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8')) : {};
const saveCache = () => fs.writeFileSync(CACHE_FILE, JSON.stringify(cache));
const sleep = ms => new Promise(r => setTimeout(r, ms));
let lastNom = 0;
let lastOsrm = 0;
async function getJSON(url, polite) {
  if (cache[url]) { return cache[url]; }
  if (!polite) { const w = lastOsrm + 150 - Date.now(); if (w > 0) { await sleep(w); } lastOsrm = Date.now(); }
  if (polite) { const wait = lastNom + 1100 - Date.now(); if (wait > 0) { await sleep(wait); } lastNom = Date.now(); }
  for (let i = 0; i < 4; i++) {
    try {
      const r = await fetch(url, { headers: { 'User-Agent': 'raccoonai-landing-fleet/1.0 (ayan@raccoonai.kz)', 'Accept-Language': 'ru' } });
      if (r.ok) { const j = await r.json(); cache[url] = j; if (Object.keys(cache).length % 10 === 0) { saveCache(); } return j; }
    } catch (e) { /* retry */ }
    await sleep(1500 * (i + 1));
  }
  throw new Error('fetch failed ' + url);
}
const OSRM = 'https://router.project-osrm.org';
const f6 = v => v.toFixed(6);
async function nearest(g) {
  const j = await getJSON(`${OSRM}/nearest/v1/driving/${f6(g[0])},${f6(g[1])}?number=1`);
  const w = j.waypoints && j.waypoints[0];
  return w ? { g: w.location, dist: w.distance } : null;
}
async function route(gs) {
  const j = await getJSON(`${OSRM}/route/v1/driving/${gs.map(g => f6(g[0]) + ',' + f6(g[1])).join(';')}?overview=full&geometries=geojson`);
  return j.routes[0].geometry.coordinates;
}
async function streetOf(g) {
  const j = await getJSON(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=17&accept-language=ru&lat=${f6(g[1])}&lon=${f6(g[0])}`, true);
  const a = (j && j.address) || {};
  return { road: a.road || a.pedestrian || a.residential || '', house: a.house_number || '', suburb: a.suburb || a.neighbourhood || a.quarter || '' };
}
const shortRoad = r => r
  .replace(/^улица\s+/i, 'ул. ').replace(/\s+улица$/i, '').replace(/^проспект\s+/i, 'пр. ').replace(/\s+проспект$/i, '')
  .replace(/^микрорайон\s+/i, 'мкр. ').replace(/^переулок\s+/i, 'пер. ').replace(/^бульвар\s+/i, 'б-р ').replace(/^шоссе\s+/i, 'ш. ')
  .replace(/^площадь\s+/i, 'пл. ');

/* ---------- geometry helpers ---------- */
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
function simplify(pts, eps) {
  if (pts.length < 3) { return pts; }
  const keep = new Uint8Array(pts.length); keep[0] = keep[pts.length - 1] = 1;
  const st = [[0, pts.length - 1]];
  while (st.length) {
    const [i, j] = st.pop(); let md = 0, mi = -1; const a = pts[i], b = pts[j], L = dist(a, b) || 1e-9;
    for (let k = i + 1; k < j; k++) { const p = pts[k]; const d = Math.abs((b[0] - a[0]) * (a[1] - p[1]) - (a[0] - p[0]) * (b[1] - a[1])) / L; if (d > md) { md = d; mi = k; } }
    if (md > eps) { keep[mi] = 1; st.push([i, mi], [mi, j]); }
  }
  return pts.filter((_, k) => keep[k]);
}
const pxLine = coords => simplify(coords.map(toPx), 0.8).map(p => [+p[0].toFixed(1), +p[1].toFixed(1)]);
function splitAt(line, frac) { // [first part, rest] at frac of the length; the cut point ends one and starts the other
  const seg = []; let tot = 0;
  for (let i = 1; i < line.length; i++) { const d = dist(line[i - 1], line[i]); seg.push(d); tot += d; }
  let goal = tot * frac;
  for (let i = 1; i < line.length; i++) {
    if (goal <= seg[i - 1] || i === line.length - 1) {
      const t = seg[i - 1] ? Math.min(1, goal / seg[i - 1]) : 0, a = line[i - 1], b = line[i];
      const c = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
      return [line.slice(0, i).concat([c]), [c].concat(line.slice(i))];
    }
    goal -= seg[i - 1];
  }
  return [line, [line[line.length - 1]]];
}
const heading = line => { const a = line[0]; const b = line.find(p => dist(p, a) > 12) || line[line.length - 1]; return Math.round(Math.atan2(b[1] - a[1], b[0] - a[0]) * 180 / Math.PI); };

/* ---------- fleet ---------- */
const TYPES = {
  tbo: { vtype: 'Мусоровоз ТБО', rtype: 'Маршрут ТБО', kind: 'Точка вывоза ТБО', job: 'Вывоз ТБО', crew: 3, per: [7, 10], models: ['МАЗ 5340 КО-427', 'КамАЗ 53605 МК-4546', 'Iveco EuroCargo SB-800'], rad: 150, dens: 0.125 },
  bunker: { vtype: 'Бункеровоз', rtype: 'Маршрут КГО', kind: 'Площадка КГО', job: 'Вывоз КГО', crew: 1, per: [2, 3], models: ['КамАЗ 43253 МКС-4505', 'МАЗ 5550 бункеровоз'], rad: 120, dens: 0.126 },
  multi: { vtype: 'Мультилифт', rtype: 'Маршрут СО', kind: 'Бункерная площадка СО', job: 'Замена бункера', crew: 1, per: [1, 2], models: ['КамАЗ 65115 мультилифт', 'Volvo FM мультилифт'], rad: 120, dens: 0.125 },
  samosval: { vtype: 'Самосвал', rtype: 'Маршрут СО', kind: 'Стройплощадка', job: 'Вывоз СО', crew: 1, per: [2, 3], models: ['КамАЗ 6520 самосвал', 'Shacman X3000 самосвал'], rad: 130, dens: 0.171 },
  assen: { vtype: 'Ассенизатор', rtype: 'Маршрут ЖБО', kind: 'Септик', job: 'Откачка ЖБО', crew: 1, per: [2, 3], models: ['КамАЗ 43253 КО-505', 'ГАЗон Next ассенизатор'], rad: 140, dens: 0.063 },
};
const TYPE_OF_VTYPE = Object.fromEntries(Object.entries(TYPES).map(([k, t]) => [t.vtype, k]));
const ROUTES = PF.routes;
const ganttPlates = [...new Set(Object.values(ROUTES).map(r => r.plate))];
const ON_MAP = Object.keys(PF.trucks); // the build already routes these three
const DEPOT_PX = [626, 304];

const FIRST = ['Ерлан', 'Данияр', 'Айбек', 'Нурлан', 'Ринат', 'Тимур', 'Бахытжан', 'Алмас', 'Ерболат', 'Сергей', 'Дмитрий', 'Марат', 'Асхат', 'Канат', 'Жандос', 'Ильяс', 'Олжас', 'Руслан', 'Арман', 'Мейрам', 'Санжар', 'Талгат', 'Виктор', 'Ербол', 'Газиз', 'Бекзат', 'Мирас', 'Медет'];
const LAST = ['Абдрахманов', 'Байжанов', 'Сулейменов', 'Жаксылыков', 'Исмаилов', 'Кенжебаев', 'Мусин', 'Нургалиев', 'Омаров', 'Рахимов', 'Сатыбалдиев', 'Тулегенов', 'Усенов', 'Шарипов', 'Ахметов', 'Бекмуханов', 'Дауренов', 'Ермеков', 'Иванов', 'Пак', 'Козлов', 'Садыков', 'Есимов', 'Жумагулов', 'Калиев', 'Маратов', 'Серикбаев', 'Тасмагамбетов'];
const used = new Set(Object.values(ROUTES).flatMap(r => r.crew.map(c => c[1])));
function person(role, kind) {
  for (;;) { const n = pick(LAST) + ' ' + pick(FIRST); if (!used.has(n)) { used.add(n); return ['', n, role, kind]; } }
}
const initials = n => n.split(' ').map(w => w[0]).join('');
const crewFor = t => [person('Водитель', 'driver'), ...Array.from({ length: TYPES[t].crew - 1 }, () => person('Грузчик', 'loader'))].map(c => [initials(c[1]), c[1], c[2], c[3]]);
const usedPlates = new Set(ganttPlates);
function plate() { const L = 'ABCEHKMOPTXY'; for (;;) { const p = ri(100, 999) + pick(L) + pick(L) + pick(L) + '02'; if (!usedPlates.has(p)) { usedPlates.add(p); return p; } } }

// the fleet: 12 Gantt trucks (3 already on the map) + 17 new
const fleet = [];
for (const pl of ganttPlates) {
  const rs = Object.keys(ROUTES).filter(k => ROUTES[k].plate === pl);
  const r0 = ROUTES[rs[0]];
  fleet.push({ plate: pl, t: TYPE_OF_VTYPE[r0.vtype], gantt: true, onMap: ON_MAP.includes(pl), depot: !rs.some(k => ROUTES[k].k === 'in-progress'), keys: rs });
}
const NEW = [['tbo', 1, 2], ['bunker', 3, 1], ['multi', 1, 2], ['samosval', 3, 2], ['assen', 2, 0]];
for (const [t, on, dep] of NEW) {
  for (let i = 0; i < on + dep; i++) { fleet.push({ plate: plate(), t, gantt: false, onMap: false, depot: i >= on }); }
}
const count = t => fleet.filter(f => f.t === t), check = Object.keys(TYPES).map(t => t + ' ' + count(t).filter(f => !f.depot).length + '/' + count(t).length);
console.log('fleet', fleet.length, check.join(', '));

/* ---------- districts: one per truck, spread over the backdrop ---------- */
const existingTips = PF.sites.map(s => [s.x, s.y]);
const allTips = existingTips.slice();
const work = fleet.filter(f => !f.onMap);
const cells = [];
for (let gy = 0; gy < 5; gy++) { for (let gx = 0; gx < 7; gx++) { cells.push([110 + gx * 230 + (rnd() - .5) * 90, 100 + gy * 175 + (rnd() - .5) * 70]); } }
// the foothills (lower right) have few roads; keep districts in the city
const cityCells = cells.filter(c => !(c[0] > 1250 && c[1] > 620)).sort(() => rnd() - .5);
work.forEach((f, i) => { f.center = cityCells[i % cityCells.length]; });

const geoDepot = toGeo(DEPOT_PX);
async function stopNear(center, rad) {
  for (let tries = 0; tries < 30; tries++) {
    const ang = rnd() * Math.PI * 2, r = rad * Math.sqrt(rnd());
    const p = [center[0] + Math.cos(ang) * r, center[1] + Math.sin(ang) * r];
    if (p[0] < 30 || p[1] < 60 || p[0] > 1570 || p[1] > 870) { continue; }
    const n = await nearest(toGeo(p));
    if (!n || n.dist > 120) { continue; }
    const q = toPx(n.g);
    if (allTips.some(t => dist(t, q) < 24)) { continue; }
    allTips.push(q);
    return { g: n.g, px: q };
  }
  throw new Error('no stop near ' + center);
}
const order = (pts, from) => { // nearest-neighbour tour from a start point
  const left = pts.slice(), out = []; let cur = from;
  while (left.length) { left.sort((a, b) => dist(a.px, cur) - dist(b.px, cur)); const n = left.shift(); out.push(n); cur = n.px; }
  return out;
};

/* ---------- sites ---------- */
const CLIENTS = [...new Set(PF.sites.flatMap(s => s.groups.map(g => g.client)))];
const ROLES = { tbo: ['Жилой дом', 'Магазин', 'Офис', 'Кафе', 'Школа', 'Аптека', 'Супермаркет', 'Пекарня'], bunker: ['Жилой дом', 'Склад', 'Офис'], multi: ['Стройка', 'Склад'], samosval: ['Стройка'], assen: ['Частный дом', 'Кафе', 'Автомойка'] };
const NAMES = {
  tbo: ['ЖК «Алтын Булак»', 'ЖК «Достык Сити»', 'ЖК «Самал Тауэрс»', 'ЖК «Арман»', 'Школа-гимназия №{n}', 'Детский сад «Ақбота»', 'Поликлиника №{n}', 'Супермаркет «Береке»', 'Кафе «Достархан»', 'БЦ «Нурлы Тау»', 'Колледж №{n}', 'ТД «Арай»'],
  bunker: ['ЖК «Жетысу»', 'ОСИ «Алмалы»', 'ЖК «Шанырак»', 'КСК «Коктем»'],
  multi: ['Стройка ЖК «Зенит»', 'Склад «Алматы Логистик»', 'Стройка БЦ «Арена»'],
  samosval: ['Стройка ЖК «Орион»', 'Реконструкция школы №{n}', 'Стройка ТРЦ «Глобус»', 'Стройка ЖК «Дала»'],
  assen: ['Частный сектор', 'Автомойка «Чистюля»', 'Кафе «Самса Хаус»', 'СТО «Мотор»'],
};
const HOURS = ['Круглосуточно', '06:00 - 22:00', '08:00 - 20:00', '09:00 - 18:00'];
const MANAGERS = [...new Set(PF.sites.map(s => s.manager))];
let jobNo = 2224001, routeNo = 401;
function cont(t) {
  if (t === 'tbo') { const big = rnd() < .5, n = ri(1, 6), rso = rnd() < .45; const vol = +(n * (big ? 1.1 : 0.75)).toFixed(2); return { base: big ? '1.1 евро' : '0.75', n, label: (big ? '1.1 евро' : '0.75') + ' (' + n + ')' + (rso ? ' · РСО (1)' : ''), vol }; }
  if (t === 'bunker') { return { base: 'Бункер 8 м³', n: 1, label: 'Бункер 8 м³ (1)' + (rnd() < .4 ? ' · РСО (1)' : ''), vol: 8 }; }
  if (t === 'multi') { const big = rnd() < .5; return { base: big ? 'Бункер 27 м³' : 'Бункер 8 м³', n: 1, label: (big ? 'Бункер 27 м³' : 'Бункер 8 м³') + ' (1)', vol: big ? 27 : 8 }; }
  if (t === 'samosval') { const v = ri(10, 15); return { base: 'Навал ' + v + ' м³', n: 1, label: 'Навал ' + v + ' м³', vol: v }; }
  const v = ri(5, 8); return { base: 'Септик ' + v + ' м³', n: 1, label: 'Септик ' + v + ' м³', vol: v };
}
const newSites = [];
async function makeSite(stop, t, pin, jobStatus, client) {
  const s = await streetOf(stop.g);
  const road = shortRoad(s.road || s.suburb || 'Алматы');
  const addr = road + ', ' + (s.house || ri(2, 180) + (rnd() < .15 ? '/' + ri(1, 9) : ''));
  const nm = pick(NAMES[t]).replace('{n}', ri(12, 190));
  const c = cont(t);
  const site = {
    name: rnd() < .4 ? addr : nm, addr, kind: TYPES[t].kind, hours: pick(HOURS), pin,
    groups: [{ cont: c.base, n: c.n, sched: rnd() < .8, client, role: pick(ROLES[t]) }].concat(t === 'tbo' && rnd() < .5 ? [{ cont: c.base, n: ri(1, 4), sched: rnd() < .7, client: pick(CLIENTS), role: pick(ROLES[t]) }] : []),
    extra: t === 'tbo' ? ri(0, 18) : 0, jobs: [{ id: 'Z' + (jobNo++), status: jobStatus }], manager: pick(MANAGERS),
    x: Math.round(stop.px[0]), y: Math.round(stop.px[1]),
  };
  newSites.push(site);
  return { site, c };
}
const PIN_OF = { completed: 'completed', enroute: 'in-progress', assigned: 'assigned' };
const JOB_OF = { completed: 'completed', enroute: 'enroute', assigned: 'assigned' };

/* ---------- trips per truck ---------- */
const hm = m => Math.floor(m / 60) + ':' + String(m % 60).padStart(2, '0');
const routesOut = {}, lines = {}, trucksOut = [];
let parkI = 0;
const PARK = [[-54, 46], [-18, 46], [18, 46], [54, 46], [-54, 82], [-18, 82], [18, 82], [54, 82]];

for (const f of work) {
  const T = TYPES[f.t];
  let crew, model, trips; // trips: [{key, r}] with r.points in visiting order
  if (f.gantt) {
    const keys = f.keys.filter(k => ROUTES[k].k !== 'ai');
    trips = keys.map(k => ({ key: k, r: JSON.parse(JSON.stringify(ROUTES[k])) }));
    crew = trips[0].r.crew; model = trips[0].r.model;
  } else {
    crew = crewFor(f.t); model = pick(T.models);
    const n1 = ri(T.per[0], T.per[1]), n2 = ri(T.per[0], T.per[1]);
    const id = () => 'M' + (routeNo++);
    const base = { plate: f.plate, model, vtype: T.vtype, rtype: T.rtype, depot: 'Депо №1', crew, shift: 'active', author: ['Бибинур Байдарова', 'Автор'] };
    const s1 = ri(360, 420), e1 = s1 + n1 * ri(20, 35) + 60;
    if (f.depot) {
      const s2 = ri(14 * 60, 15 * 60);
      trips = [
        { key: 'fl-' + f.plate + '-1', r: { ...base, trip: 1, id: id(), k: 'completed', f: hm(s1), t: hm(e1), done: n1, total: n1, points: Array.from({ length: n1 }, () => ({ st: 'completed' })) } },
        { key: 'fl-' + f.plate + '-2', r: { ...base, trip: 2, id: id(), k: 'assigned', f: hm(s2), t: hm(s2 + n2 * 30 + 60), done: 0, total: n2, points: Array.from({ length: n2 }, () => ({ st: 'assigned' })) } },
      ];
    } else {
      const done = ri(0, n2 - 1), s2 = e1 + 20;
      trips = [
        { key: 'fl-' + f.plate + '-1', r: { ...base, trip: 1, id: id(), k: 'completed', f: hm(s1), t: hm(e1), done: n1, total: n1, points: Array.from({ length: n1 }, () => ({ st: 'completed' })) } },
        { key: 'fl-' + f.plate + '-2', r: { ...base, trip: 2, id: id(), k: 'in-progress', f: hm(s2), t: hm(s2 + n2 * 30 + 60), done, total: n2, points: Array.from({ length: n2 }, (_, i) => ({ st: i < done ? 'completed' : i === done ? 'enroute' : 'assigned' })) } },
      ];
    }
  }
  // place every stop of the day near the district, in a sensible visiting order
  const all = trips.flatMap(tr => tr.r.points);
  const stops = [];
  for (let i = 0; i < all.length; i++) { stops.push(await stopNear(f.center, T.rad)); }
  const ordered = order(stops, f.center);
  const client = pick(CLIENTS);
  let k = 0;
  for (const tr of trips) {
    for (const pt of tr.r.points) {
      const stop = ordered[k++];
      const { site, c } = await makeSite(stop, f.t, PIN_OF[pt.st], JOB_OF[pt.st], pt.client || pick(CLIENTS));
      pt.addr = site.addr; pt.pin = [site.x, site.y]; pt.client = pt.client || site.groups[0].client; pt.id = site.jobs[0].id;
      pt.cont = pt.cont || c.label; pt.vol = pt.vol || c.vol; pt.type = pt.type || T.job;
      stop.st = pt.st;
    }
    routesOut[tr.key] = tr.r;
  }
  // route of the day: completed stops (past), the truck, the stops still to do (plan)
  const seq = ordered.slice(0, k);
  const firstOpen = seq.findIndex(s => s.st !== 'completed');
  let past, plan, pos, rot;
  if (f.depot) {
    const park = PARK[parkI++ % PARK.length];
    pos = [DEPOT_PX[0] + park[0], DEPOT_PX[1] + park[1]];
    const done = seq.filter(s => s.st === 'completed'), todo = seq.filter(s => s.st !== 'completed');
    past = done.length ? pxLine(await route([...done.map(s => s.g), toGeo(pos)])) : [pos];
    plan = todo.length ? pxLine(await route([toGeo(pos), ...todo.map(s => s.g)])) : [pos];
    rot = -90;
  } else {
    const prev = firstOpen > 0 ? seq[firstOpen - 1].g : geoDepot, next = seq[firstOpen].g;
    const leg = (await route([prev, next])).map(toPx);
    const [a, b] = splitAt(leg, 0.35 + rnd() * 0.3);
    pos = b[0];
    const before = firstOpen > 1 ? (await route(seq.slice(0, firstOpen).map(s => s.g))).map(toPx) : [];
    const after = seq.length - firstOpen > 1 ? (await route(seq.slice(firstOpen).map(s => s.g))).map(toPx) : [];
    past = simplify(before.concat(a), 0.8).map(p => [+p[0].toFixed(1), +p[1].toFixed(1)]);
    plan = simplify(b.concat(after), 0.8).map(p => [+p[0].toFixed(1), +p[1].toFixed(1)]);
    rot = heading(plan);
  }
  lines[f.plate] = { past, plan };
  const extraKm = ri(18, 64);
  trucksOut.push({
    plate: f.plate, type: f.t, vtype: T.vtype, model, depot: f.depot, driver: crew[0][1], crew,
    x: +pos[0].toFixed(1), y: +pos[1].toFixed(1), rot,
    km: (f.depot ? ri(14, 30) : extraKm) + ' км', odo: ri(60000, 240000) + ' км', fuel: ri(40, 95) + ' л', left: 'Осталось ' + ri(60, 140) + ' л',
    gps: f.depot ? 'В депо с ' + (routesOut[trips[0].key] ? routesOut[trips[0].key].t : '11:00') : ri(1, 3) + ' мин назад (13:3' + ri(0, 2) + ')',
    since: f.depot ? null : (trips[0].r.f.length === 4 ? '0' : '') + trips[0].r.f,
    keys: trips.map(tr => tr.key),
  });
  console.log(f.plate, f.t, f.depot ? 'depot' : 'line', 'stops', k);
  saveCache();
}

/* ---------- a few sites with no truck yet (unassigned) and missed pickups ---------- */
for (const [pin, job, n] of [['created', 'created', 6], ['failed', 'not_completed', 3]]) {
  for (let i = 0; i < n; i++) {
    const c = pick(cityCells), t = pick(['tbo', 'tbo', 'tbo', 'bunker']);
    const stop = await stopNear(c, 160);
    await makeSite(stop, t, pin, job, pick(CLIENTS));
  }
}
saveCache();

/* ---------- «Статус вывоза» from the map ---------- */
const sites = PF.sites.concat(newSites);
const siteVol = s => s.groups.reduce((v, g) => {
  const m = /([\d.]+)\s*м³/.exec(g.cont); const each = m ? +m[1] : g.cont.startsWith('1.1') ? 1.1 : 0.75;
  return v + each * g.n;
}, 0);
const bucket = { created: [0, 0], assigned: [0, 0], completed: [0, 0], failed: [0, 0] };
for (const s of sites) { const b = s.pin === 'in-progress' ? 'assigned' : s.pin; bucket[b][0]++; bucket[b][1] += siteVol(s); }
const totalSites = sites.length, totalVol = Object.values(bucket).reduce((v, b) => v + b[1], 0);
// trucks on the map, with what they carried today (completed points of their trips)
const allTrucks = fleet.map(f => {
  const keys = f.onMap ? Object.keys(ROUTES).filter(k => ROUTES[k].plate === f.plate) : trucksOut.find(t => t.plate === f.plate).keys;
  const rs = keys.map(k => routesOut[k] || ROUTES[k]).filter(r => r.k !== 'ai');
  const done = rs.flatMap(r => r.points.filter(p => p.st === 'completed')), plan = rs.flatMap(r => r.points);
  return { t: f.t, depot: f.depot, doneVol: done.reduce((v, p) => v + (p.vol || 0), 0), planVol: plan.reduce((v, p) => v + (p.vol || 0), 0) };
});
const typeStat = t => {
  const ts = allTrucks.filter(x => x.t === t), on = ts.filter(x => !x.depot).length;
  const vol = ts.reduce((v, x) => v + x.doneVol, 0), plan = ts.reduce((v, x) => v + x.planVol, 0);
  return { on, total: ts.length, vol, wt: vol * TYPES[t].dens, volPct: plan ? vol / plan * 100 : 0 };
};
const fmt1 = v => v.toFixed(1), pct = v => (Math.round(v * 10) / 10).toFixed(1) + '%';
const stats = Object.fromEntries(Object.keys(TYPES).map(t => [t, typeStat(t)]));
const fleetOn = fleet.filter(f => !f.depot).length;
const doneVol = bucket.completed[1];
const doneWt = Object.values(stats).reduce((w, s) => w + s.wt, 0);
console.log('sites', totalSites, JSON.stringify(bucket), 'fleet on', fleetOn, '/', fleet.length);

let out = html;
const segRe = (cls) => new RegExp('(<span class="pf-seg pf-seg--' + cls + ' caption-m-medium" style="flex-grow:)[^"]*(">)[^<]*(</span>)', 'g');
const maxN = Math.max(...Object.values(bucket).map(b => b[0])), maxV = Math.max(...Object.values(bucket).map(b => b[1]));
let segI = {};
out = out.replace(/<span class="pf-seg pf-seg--(created|assigned|completed|failed) caption-m-medium" style="flex-grow:[^"]*">[^<]*<\/span>/g, (m, cls) => {
  const second = segI[cls] = (segI[cls] || 0) + 1;
  const b = bucket[cls];
  if (second === 1) { return `<span class="pf-seg pf-seg--${cls} caption-m-medium" style="flex-grow:${+(b[0] / maxN).toFixed(2)}">${b[0]}</span>`; }
  return `<span class="pf-seg pf-seg--${cls} caption-m-medium" style="flex-grow:${+(b[1] / maxV).toFixed(2)}">${Math.round(b[1])} м³</span>`;
});
const KPI = { created: 'Неназначено', assigned: 'Запланировано', failed: 'Невывоз', completed: 'Выполнено' };
for (const [cls, label] of Object.entries(KPI)) {
  const b = bucket[cls];
  const re = new RegExp('(<p class="caption-caps-bold">' + label + '</p></div><div class="pf-kpi__cols">)([\\s\\S]*?)(</div></div></div>)');
  out = out.replace(re, (m, a, body, z) => {
    let i = 0;
    body = body.replace(/(<span class="pf-kpi__pct pf-kpi__pct--[a-z-]+">)([^<]*)(<\/span><p class="pf-kpi__num">)([^<]*)(<\/p>)/g, (mm, p1, _pc, p3, _n, p5) => {
      i++;
      if (i === 1) { return p1 + pct(b[0] / totalSites * 100) + p3 + b[0] + p5; }
      if (i === 2) { return p1 + pct(b[1] / totalVol * 100) + p3 + Math.round(b[1]) + ' м³' + p5; }
      return p1 + ' ' + p3 + fmt1(doneWt) + ' т' + p5;
    });
    return a + body + z;
  });
}
out = out.replace(/(<p class="caption-caps-bold">Техника на линии<\/p><span class="pf-bigpct">)[^<]*(<\/span>)/, '$1' + pct(fleetOn / fleet.length * 100) + '$2')
  .replace(/(<p class="body-m-medium">На линии<\/p><p class="body-m-medium">)[^<]*(<\/p>)/, '$1' + fleetOn + ' из ' + fleet.length + '$2')
  .replace(/(<p class="body-m-medium">Объём<\/p><p class="body-m-medium">)[^<]*(<\/p>)/, '$1' + fmt1(Object.values(stats).reduce((v, s) => v + s.vol, 0)) + ' м³$2')
  .replace(/(<p class="body-m-medium">Вес<\/p><p class="body-m-medium">)[^<]*(<\/p>)/, '$1' + fmt1(doneWt) + ' т$2');
const FLEET_LABEL = { tbo: 'Мусоровозы ТБО', bunker: 'Бункеровозы', multi: 'Мультилифты', samosval: 'Самосвалы', assen: 'Ассенизаторы' };
const tone = p => p >= 90 ? 'green' : p >= 70 ? 'yellow' : p >= 50 ? 'orange' : 'red';
for (const [t, label] of Object.entries(FLEET_LABEL)) {
  const s = stats[t], onPct = s.on / s.total * 100;
  const re = new RegExp('(<p class="caption-caps-bold">' + label + '</p>[\\s\\S]*?</div>)(<div class="pf-frow">[\\s\\S]*?)(</div></div>(?:<div class="pf-fleet|</div>))');
  out = out.replace(re, (m, head, rows, tail) => head +
    `<div class="pf-frow"><p class="body-m-medium">${s.on} из ${s.total}</p><span class="rc-pct rc-pct--${tone(onPct)}">${onPct === 100 ? '100%' : pct(onPct)}</span></div>` +
    `<div class="pf-frow"><p class="body-m-medium">${fmt1(s.vol)} м³</p><span class="rc-pct rc-pct--disabled">${pct(s.volPct)}</span></div>` +
    `<div class="pf-frow"><p class="body-m-medium">${fmt1(s.wt)} т</p><span class="rc-pct rc-pct--disabled">${pct(s.volPct)}</span></div>` + tail.replace(/^<\/div>/, ''));
}
fs.writeFileSync(INDEX, out);

fs.writeFileSync(OUT, '/* Generated by tools/platform-block/fleet.mjs; do not edit by hand. The whole depot on the Platform map: trucks,\n   their routes of the day and the job pins along them (merged into #pf-data by script.js). Map data © 2GIS; roads © OSM contributors. */\n' +
  'window.PF_FLEET = ' + JSON.stringify({ sites: newSites, routes: routesOut, lines, trucks: trucksOut }) + ';\n');
console.log('wrote', path.relative(ROOT, OUT), 'sites +' + newSites.length, 'trucks +' + trucksOut.length, 'routes ' + Object.keys(routesOut).length);
console.log('types', JSON.stringify(Object.fromEntries(Object.entries(stats).map(([t, s]) => [t, s.on + '/' + s.total + ' ' + fmt1(s.vol) + 'm3 ' + fmt1(s.wt) + 't ' + pct(s.volPct)]))));
