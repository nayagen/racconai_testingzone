/* Экран 4 «Лента отметок за сегодня» — handoff/screens/Feed.dc.html. Регистрируется как window.TabelScreens.Feed.
   Счётчики дня, поток отметок с фильтром, окно «фото и карта отметки», список «Не отметились».
   Фото в макете — внешние картинки; здесь вместо них плейсхолдер-селфи (SVG на токенах). Карта — схематичная SVG-подложка из макета. */
(() => {
const { useState, useEffect, useRef } = React;
const DS = window.RaccoonDS;
const { SectionTabs } = window.TabelUI;

const TODAY_LABEL = 'Сегодня, 27 Окт 2026';

const COUNTERS = [
  { label: 'По графику сегодня', value: 48 },
  { label: 'Отметились «Пришёл»', value: 41 },
  { label: 'Не отметились', value: 3, tone: 'attention' },
  { label: 'Ушли', value: 1 }
];

// время, сотрудник, тип, роль, место, статус-исключение ('' — подтверждено)
const FEED = [
  ['07:12', 'Касымов Арман', 'Пришёл', 'Грузчик', 'первая точка маршрута №12, 90 м', ''],
  ['07:09', 'Абдрахманов Марат', 'Пришёл', 'Грузчик', 'отметил водитель Ахметов Б., фото бригады', ''],
  ['07:02', 'Жумабаев Нурсултан', 'Пришёл', 'Грузчик', '1,2 км от первой точки маршрута №9', 'Вне геозоны'],
  ['06:51', 'Исаев Тимур', 'Пришёл', 'Грузчик', 'первая точка маршрута №7, 210 м', ''],
  ['06:05', 'Ким Виктор', 'Ушёл', 'Водитель', 'Депо №1 · ночная смена с 26 Окт', ''],
  ['05:58', 'Сериков Данияр', 'Пришёл', 'Водитель', 'Депо №1', ''],
  ['05:44', 'Ахметов Бауыржан', 'Пришёл', 'Водитель', 'Депо №1', ''],
  ['05:40', 'Нурланов Ерлан', 'Пришёл', 'Водитель', 'резерв · WhatsApp без ссылки, сеть недоступна', 'Резервный канал']
].map((r, i) => ({ i, time: r[0], name: r[1], kind: r[2], role: r[3], place: r[4], status: r[5], warn: r[5] !== '' }));

// гео отметки на карте: центр геозоны (cx, cy, r в px; 100 м = 29 px), пин (px, py), что подписать
const GEO = [
  { kind: 'route', cx: 232, cy: 158, r: 116, px: 264, py: 120, dist: '90 м', to: 'До точки 1', radius: '400 м', acc: 'камера · точность 12 м', inZone: true, coords: '43.2346, 76.8892', track: true },
  { kind: 'route', cx: 232, cy: 158, r: 116, px: 218, py: 146, dist: '40 м', to: 'До точки 1', radius: '400 м', acc: 'телефон водителя · точность 8 м', inZone: true, coords: '43.2339, 76.8871', track: true },
  { kind: 'route', cx: 92, cy: 214, r: 116, px: 432, py: 92, dist: '1,2 км', to: 'До точки 1', radius: '400 м', acc: 'камера · точность 15 м', inZone: false, coords: '43.2412, 76.9015', track: false },
  { kind: 'route', cx: 232, cy: 158, r: 116, px: 280, py: 120, dist: '210 м', to: 'До точки 1', radius: '400 м', acc: 'камера · точность 10 м', inZone: true, coords: '43.2351, 76.8901', track: true },
  { kind: 'depot', cx: 232, cy: 184, r: 58, px: 254, py: 168, dist: '30 м', to: 'До депо', radius: '200 м', acc: 'камера · точность 9 м', inZone: true, coords: '43.2318, 76.8884', track: false },
  { kind: 'depot', cx: 232, cy: 184, r: 58, px: 206, py: 200, dist: '35 м', to: 'До депо', radius: '200 м', acc: 'камера · точность 11 м', inZone: true, coords: '43.2313, 76.8876', track: false },
  { kind: 'depot', cx: 232, cy: 184, r: 58, px: 262, py: 196, dist: '40 м', to: 'До депо', radius: '200 м', acc: 'камера · точность 7 м', inZone: true, coords: '43.2314, 76.8889', track: false },
  { kind: 'depot', cx: 232, cy: 184, r: 58, px: null, py: null, dist: '', to: 'До депо', radius: '200 м', acc: '', inZone: false, coords: 'нет данных', track: false }
];

const MISSING = [
  ['Омаров Ерасыл', 'Грузчик · маршрут №4 · начало 07:00'],
  ['Байжанов Кайрат', 'Водитель · машина 456 DEF 02 · начало 06:00'],
  ['Тулегенов Аслан', 'Грузчик · маршрут №12 · начало 07:00']
].map((m) => ({ name: m[0], info: m[1] }));

const FILTERS = [
  { value: 'all', label: 'Все' },
  { value: 'in', label: 'Пришёл' },
  { value: 'out', label: 'Ушёл' },
  { value: 'warn', label: 'Требуют проверки', count: FEED.filter((f) => f.warn).length }
];
const FILTER_FN = {
  all: () => true,
  in: (f) => f.kind === 'Пришёл',
  out: (f) => f.kind === 'Ушёл',
  warn: (f) => f.warn
};

// ---------- подложка карты (схема из макета, 480 × 300) ----------
const TREES = [[350, 20], [372, 46], [398, 24], [430, 40], [455, 70], [345, 74], [410, 80], [462, 18]];
const HOUSES = [
  [6, 6, 26, 22], [6, 34, 26, 60], [38, 6, 18, 22], [38, 34, 18, 60], [64, 6, 18, 28], [64, 40, 18, 54], [90, 6, 18, 34], [90, 46, 18, 48],
  [113, 6, 18, 22], [113, 34, 18, 60], [158, 6, 30, 22], [158, 34, 30, 60], [193, 6, 18, 34], [193, 46, 18, 48], [217, 6, 18, 34], [217, 46, 18, 48],
  [240, 6, 22, 34], [240, 46, 22, 48], [270, 6, 36, 22], [270, 34, 36, 60],
  [6, 118, 36, 28], [48, 118, 18, 28], [71, 118, 18, 28], [97, 118, 22, 28], [158, 118, 22, 28], [188, 118, 18, 28], [214, 118, 26, 28], [248, 118, 22, 28],
  [275, 118, 31, 28], [330, 118, 22, 28], [358, 118, 18, 28], [384, 118, 14, 28], [422, 118, 18, 28], [448, 118, 22, 28],
  [6, 170, 36, 28], [48, 170, 26, 28], [80, 170, 36, 28], [122, 170, 12, 28], [158, 170, 22, 28], [185, 170, 22, 28], [212, 170, 36, 28], [254, 170, 36, 28],
  [330, 170, 30, 28], [366, 170, 32, 28], [422, 170, 18, 28], [448, 170, 26, 28],
  [6, 222, 26, 22], [37, 222, 30, 22], [73, 222, 18, 22], [99, 222, 18, 22], [158, 222, 26, 28], [158, 256, 26, 38], [192, 222, 26, 34], [192, 262, 26, 32],
  [224, 222, 36, 28], [224, 256, 36, 38], [265, 222, 18, 28], [265, 256, 18, 38], [289, 222, 17, 22], [289, 250, 17, 44], [330, 222, 26, 34], [330, 262, 26, 32],
  [364, 222, 30, 28], [364, 256, 30, 38], [422, 222, 30, 34], [422, 262, 30, 32], [458, 222, 16, 28], [458, 256, 16, 38]
];
const MINOR_ROADS = ['M0 158 L480 158', 'M0 210 L480 210', 'M318 0 L318 300', 'M410 106 L410 300'];
const MAJOR_ROADS = ['M0 106 L480 106', 'M146 0 L146 300'];

function Basemap() {
  return (
    <g>
      <rect className="fd-map__ground" x="0" y="0" width="480" height="300" />
      <rect className="fd-map__park" x="324" y="0" width="156" height="100" />
      {TREES.map(([cx, cy]) => <circle key={cx + '-' + cy} className="fd-map__tree" cx={cx} cy={cy} r="5" />)}
      <path className="fd-map__river" d="M0 262 C40 252 80 284 140 270" />
      {HOUSES.map(([x, y, w, h]) => <rect key={x + '-' + y} className="fd-map__house" x={x} y={y} width={w} height={h} rx="1.5" />)}
      {MINOR_ROADS.map((d) => <path key={'c' + d} className="fd-map__road-casing" d={d} />)}
      {MINOR_ROADS.map((d) => <path key={'f' + d} className="fd-map__road" d={d} />)}
      {MAJOR_ROADS.map((d) => <path key={'c' + d} className="fd-map__avenue-casing" d={d} />)}
      {MAJOR_ROADS.map((d) => <path key={'f' + d} className="fd-map__avenue" d={d} />)}
      <text className="fd-map__label fd-map__label--strong" x="20" y="109">ул. Жандосова</text>
      <text className="fd-map__label fd-map__label--strong" x="0" y="0" transform="translate(149 290) rotate(-90)">ул. Розыбакиева</text>
      <text className="fd-map__label" x="340" y="213">ул. Сатпаева</text>
      <text className="fd-map__label" x="20" y="161">ул. Мынбаева</text>
      <text className="fd-map__label fd-map__label--park" x="392" y="60">сквер</text>
      <text className="fd-map__label fd-map__label--water" x="18" y="290">р. Есентай</text>
    </g>
  );
}

// ---------- плейсхолдер фото с камеры ----------
function Photo({ className, label, fit }) {
  return (
    <svg className={'fd-photo ' + (className || '')} viewBox="0 0 120 160" preserveAspectRatio={fit === 'contain' ? 'xMidYMid meet' : 'xMidYMid slice'}
      role={label ? 'img' : undefined} aria-label={label || undefined} aria-hidden={label ? undefined : 'true'}>
      <rect className="fd-photo__bg" x="0" y="0" width="120" height="160" />
      <circle className="fd-photo__figure" cx="60" cy="66" r="24" />
      <path className="fd-photo__figure" d="M14 160 C14 122 34 104 60 104 C86 104 106 122 106 160 Z" />
    </svg>
  );
}

// ---------- вычисления для карты выбранной отметки (как в renderVals макета) ----------
function geoView(f) {
  const g = GEO[f.i];
  const has = g.px !== null;
  const isDepot = g.kind === 'depot';
  const color = g.inZone ? 'var(--text-success)' : 'var(--text-warning)';
  const mx = (g.cx + (has ? g.px : g.cx)) / 2, my = (g.cy + (has ? g.py : g.cy)) / 2;
  const lw = g.dist.length > 4 ? 46 : 38;
  const pct = (v, total) => (v / total * 100).toFixed(1) + '%';
  const cardPos = !has ? null : (g.px > 330
    ? { right: pct(480 - g.px + 22, 480), top: pct(g.py + 6, 300) }
    : { left: pct(g.px + 22, 480), top: pct(Math.max(4, g.py - 64), 300) });
  const px = g.px || 0, py = g.py || 0;
  return {
    g, has, isDepot, color, cardPos, mx, my, lw,
    pinPath: has ? `M${px} ${py} C${px} ${py} ${px - 16} ${py - 20} ${px - 16} ${py - 32} A16 16 0 1 1 ${px + 16} ${py - 32} C${px + 16} ${py - 20} ${px} ${py} ${px} ${py} Z` : '',
    mapLabel: has
      ? `Карта: пин отметки «${f.kind}» ${f.time}, ${g.dist} от ${isDepot ? 'депо' : 'первой точки маршрута'}, ${g.inZone ? 'внутри' : 'вне'} геозоны радиусом ${g.radius}`
      : 'Карта: геозона депо, геопозиция отметки не передана'
  };
}

const ZOOMS = [1, 1.5, 2];

function MarkMap({ f }) {
  const [zoom, setZoom] = useState(0);
  const v = geoView(f);
  const { g, has } = v;
  const z = ZOOMS[zoom];
  return (
    <div className="fd-map">
      <div className="fd-map__layer" style={{ transform: `scale(${z})`, transformOrigin: `${(g.cx / 480 * 100).toFixed(1)}% ${(g.cy / 300 * 100).toFixed(1)}%` }}>
        <svg viewBox="0 0 480 300" preserveAspectRatio="xMidYMid slice" width="100%" height="100%" role="img" aria-label={v.mapLabel} className="fd-map__svg">
          <Basemap />
          <circle className="fd-map__zone" cx={g.cx} cy={g.cy} r={g.r} />
          {g.track && (
            <g>
              <polyline className="fd-map__track" points="0,106 146,106 146,158 232,158 318,158 318,210 410,210 410,300" />
              <circle className="fd-map__mark" cx="318" cy="210" r="12" />
              <text className="fd-map__mark-text" x="318" y="214" textAnchor="middle">2</text>
              <circle className="fd-map__mark" cx="410" cy="262" r="12" />
              <text className="fd-map__mark-text" x="410" y="266" textAnchor="middle">3</text>
            </g>
          )}
          {has && (
            <g>
              <line x1={g.cx} y1={g.cy} x2={g.px} y2={g.py} className="fd-map__dist-line" style={{ stroke: v.color }} />
              <rect className="fd-map__dist-bg" x={v.mx - v.lw / 2 + 10} y={v.my - 18} width={v.lw} height="16" rx="8" />
              <text className="fd-map__dist-text" x={v.mx + 10} y={v.my - 6} textAnchor="middle">{g.dist}</text>
            </g>
          )}
          <rect className="fd-map__mark" x={g.cx - 12} y={g.cy - 12} width="24" height="24" rx={v.isDepot ? 4 : 12} />
          <text className="fd-map__mark-text" x={g.cx} y={g.cy + 4} textAnchor="middle">{v.isDepot ? 'Д' : '1'}</text>
          {has && (
            <g>
              <circle cx={g.px} cy={g.py} r="14" style={{ fill: v.color, fillOpacity: 0.18 }} />
              <path className="fd-map__pin" d={v.pinPath} style={{ fill: v.color }} />
              <circle className="fd-map__pin-dot" cx={g.px} cy={g.py - 32} r="6" />
            </g>
          )}
          <line className="fd-map__scale" x1="14" y1="284" x2="43" y2="284" />
          <line className="fd-map__scale" x1="14" y1="280" x2="14" y2="288" />
          <line className="fd-map__scale" x1="43" y1="280" x2="43" y2="288" />
          <text className="fd-map__scale-text" x="50" y="287">100 м</text>
        </svg>
        {has && (
          <div className="fd-pincard" style={v.cardPos}>
            <Photo className="fd-pincard__photo" />
            <span className="fd-pincard__text">
              <span className="fd-pincard__title">«{f.kind}» {f.time}</span>
              <span className="fd-pincard__acc">{g.acc}</span>
              <span className="fd-pincard__zone" style={{ color: v.color }}>{g.inZone ? 'в геозоне' : 'вне геозоны'}</span>
            </span>
          </div>
        )}
      </div>
      {!has && (
        <div className="fd-nogeo">
          <svg className="fd-nogeo__icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 9v4" /><path d="M12 17h.01" /><path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" /></svg>
          <span>Геопозиция не передана: отметка через резервный канал без сети. Показана геозона депо.</span>
        </div>
      )}
      <div className="fd-zoom">
        <button type="button" aria-label="Приблизить" disabled={zoom === ZOOMS.length - 1} onClick={() => setZoom(Math.min(ZOOMS.length - 1, zoom + 1))}>+</button>
        <button type="button" aria-label="Отдалить" disabled={zoom === 0} onClick={() => setZoom(Math.max(0, zoom - 1))}>−</button>
      </div>
    </div>
  );
}

// ---------- окно «фото и карта отметки» ----------
function MarkModal({ f, onClose }) {
  const closeRef = useRef(null);
  useEffect(() => {
    if (closeRef.current) closeRef.current.focus();
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  const v = geoView(f);
  const { g, has } = v;
  return (
    <div className="fd-dialog" role="dialog" aria-modal="true" aria-label={`Фото и карта отметки: ${f.name}, «${f.kind}» ${f.time}`}>
      <button type="button" className="fd-dialog__scrim" tabIndex={-1} aria-label="Закрыть" onClick={onClose} />
      <section className="rc-modal fd-modal">
        <header className="rc-modal__head">
          <div className="rc-modal__titles">
            <h2 className="rc-modal__title--entity">{f.name} · «{f.kind}» {f.time}</h2>
            <span className="fd-modal__sub">{TODAY_LABEL} · {f.role} · {f.place}</span>
          </div>
          <button ref={closeRef} type="button" className="rc-modal__close" aria-label="Закрыть" onClick={onClose}><DS.Icon name="cancel" size={24} /></button>
        </header>
        <DS.Separator />
        <div className="fd-modal__body">
          <div className="fd-modal__photo">
            <Photo className="fd-modal__img" fit="contain" label={`Фото отметки «${f.kind}»: ${f.name}`} />
          </div>
          <div className="fd-modal__geo">
            <MarkMap key={f.i} f={f} />
            <div className="fd-modal__info">
              <div className="fd-modal__facts">
                <span><span className="fd-muted">{g.to}:</span> <strong style={{ color: has ? v.color : 'var(--text-warning)' }}>{has ? g.dist : 'нет геопозиции'}</strong></span>
                <span><span className="fd-muted">Радиус геозоны:</span> <strong>{g.radius}</strong></span>
                <span><span className="fd-muted">Координаты:</span> <span className="fd-mono">{g.coords}</span></span>
              </div>
              <span className="fd-legend">
                <span className="fd-legend__item"><span aria-hidden="true" className="fd-legend__dot" style={{ background: v.color }} />отметка</span>
                <span className="fd-legend__item"><span aria-hidden="true" className="fd-legend__square" />{v.isDepot ? 'депо' : 'точки маршрута'}</span>
                {g.track && <span className="fd-legend__item"><span aria-hidden="true" className="fd-legend__track" />трек машины</span>}
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

// ---------- экран ----------
function FeedScreen({ flagCount }) {
  const [filter, setFilter] = useState('all');
  const [sel, setSel] = useState(-1);
  const [reminded, setReminded] = useState({});
  const list = FEED.filter(FILTER_FN[filter]);
  const selected = sel >= 0 ? FEED[sel] : null;

  return (
    <>
      <SectionTabs active="feed" flagCount={flagCount}>
        <span className="fd-live">{TODAY_LABEL} · Депо №1 · обновляется в реальном времени</span>
      </SectionTabs>

      <div className="fd">
        <div className="fd-counters">
          {COUNTERS.map((c) => (
            <div key={c.label} className={'fd-counter' + (c.tone ? ' fd-counter--' + c.tone : '')}>
              <span className="fd-counter__label">{c.label}</span>
              <span className="fd-counter__value">{c.value}</span>
            </div>
          ))}
        </div>

        <div className="fd-cols">
          <section aria-label="Отметки" className="fd-feed">
            <div className="fd-feed__filters"><DS.SegmentedTabs items={FILTERS} value={filter} onChange={setFilter} /></div>
            {list.map((f) => (
              <article key={f.i} className="fd-mark">
                <span className="fd-mark__time">{f.time}</span>
                <button type="button" className="fd-thumb" onClick={() => setSel(f.i)}
                  aria-label={`Открыть фото и карту отметки: ${f.name}, «${f.kind}» ${f.time}`} title="Открыть фото и карту">
                  <Photo label={`Фото отметки: ${f.name}`} />
                </button>
                <div className="fd-mark__who">
                  <span className="fd-mark__name">{f.name} · {f.kind}</span>
                  <span className="fd-mark__place">{f.role} · {f.place}</span>
                </div>
                {f.warn
                  ? <a href="#/day" className="fd-badge fd-badge--warn">{f.status}</a>
                  : <span className="fd-badge fd-badge--ok">Подтверждено</span>}
              </article>
            ))}
            {list.length === 0 && <div className="fd-empty">Отметок нет</div>}
          </section>

          <aside aria-label="Не отметились" className="fd-missing">
            <h2 className="fd-missing__title">Не отметились</h2>
            <span className="fd-missing__sub">Есть в графике, смена началась более 30 мин назад</span>
            {MISSING.map((m) => (
              <div key={m.name} className="fd-missing__row">
                <div className="fd-missing__who">
                  <span className="fd-missing__name">{m.name}</span>
                  <span className="fd-missing__info">{m.info}</span>
                </div>
                {reminded[m.name]
                  ? <DS.Button variant="secondary" size="small" icon="check" disabled>Напоминание отправлено</DS.Button>
                  : <DS.Button variant="secondary" size="small" onClick={() => setReminded({ ...reminded, [m.name]: true })}>Напомнить в боте</DS.Button>}
              </div>
            ))}
          </aside>
        </div>
      </div>

      {selected && <MarkModal f={selected} onClose={() => setSel(-1)} />}
    </>
  );
}

window.TabelScreens = window.TabelScreens || {};
window.TabelScreens.Feed = FeedScreen;
})();
