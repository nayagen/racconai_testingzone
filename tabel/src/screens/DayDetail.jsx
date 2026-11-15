/* Карточка дня сотрудника.
   DayDetail       — день с исключением (handoff/screens/DayDetail.dc.html): решение HR, переписка через бота, журнал.
   DayDetailNormal — штатный день, закрыт автоматически (handoff/screens/DayDetailNormal.dc.html).
   Общие части (шапка, плитки, смены, хронология, фото и карта отметок, журнал, окна фото и карты) — вверху файла.
   Контент — моки из макетов; если в маршруте есть сотрудник (day.employee), подставляются его ФИО, таб. №, роль,
   дата и часы из ячейки табеля (day.cell.hours). */
(() => {
const { useState, useEffect, useRef } = React;
const DS = window.RaccoonDS;
const { SelectControl, fmt1, go } = window.TabelUI;

// ---------- сотрудник и дата ----------
const MON_S = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
const MON_G = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
const WK = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];
const ROLE_GEN = { 'Грузчик': 'грузчика', 'Водитель': 'водителя' };

// Соседний рабочий день сотрудника в текущем периоде (выходные пропускаем).
function adjacentDay(data, emp, date, dir) {
  if (!data || !emp) return null;
  const i0 = data.days.findIndex((d) => d.date === date);
  if (i0 < 0) return null;
  for (let i = i0 + dir; i >= 0 && i < data.days.length; i += dir) {
    if (emp.cells[i] && emp.cells[i].kind === 'work') return 'day/' + emp.id + '/' + data.days[i].date;
  }
  return null;
}

function usePerson(dayProp, data, fallbackDate) {
  const e = dayProp && dayProp.employee;
  const date = e && dayProp.date ? dayProp.date : fallbackDate;
  const name = e ? e.name : 'Касымов Арман';
  const [sur, first = ''] = name.split(' ');
  const [y, m, dd] = date.split('-').map(Number);
  const wd = WK[new Date(Date.UTC(y, m - 1, dd)).getUTCDay()];
  const role = e ? e.role : 'Грузчик';
  const cell = dayProp && dayProp.cell;
  return {
    name, first, short: sur + ' ' + first.charAt(0) + '.', id: e ? e.id : '1102', role,
    roleGen: ROLE_GEN[role] || role.toLowerCase(), norm: e ? e.norm : 10,
    hours: e && cell && cell.hours != null ? cell.hours : null,
    dLong: dd + ' ' + MON_S[m - 1] + ' ' + y, dShort: dd + ' ' + MON_S[m - 1], dGen: dd + ' ' + MON_G[m - 1], wd,
    prev: adjacentDay(data, e, date, -1), next: adjacentDay(data, e, date, 1)
  };
}

const minsOf = (t) => { const p = String(t).split(':'); return (+p[0]) * 60 + (+p[1] || 0); };
const hm = (w) => Math.floor(w / 60) + ' ч ' + (w % 60) + ' мин';
const hours1 = (w) => fmt1(Math.round(w / 6) / 10);

// Закрытие окна по Esc.
function useEscape(open, onClose) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
}

// ---------- шапка ----------
function DayHeader({ p, pill }) {
  return (
    <>
      <div className="dd-crumbs"><a href="#/">Табель</a> / <a href="#/exceptions">Исключения</a> / {p.name}</div>
      <div className="dd-head">
        <div className="dd-head__main">
          <div className="dd-head__titles">
            <h1 className="dd-title">{p.name} · {p.dLong}, {p.wd}</h1>
            <span className="dd-sub">{p.role} · Депо №1 · таб. № {p.id}</span>
          </div>
          <span className={'dd-pill dd-pill--' + pill.tone}><DS.Icon name={pill.icon} size={16} color="currentColor" />{pill.text}</span>
        </div>
        <div className="dd-head__nav">
          <DS.IconButton icon="chevron-left" label="Предыдущий день" size="medium" disabled={!p.prev} onClick={() => p.prev && go(p.prev)} />
          <DS.IconButton icon="chevron-right" label="Следующий день" size="medium" disabled={!p.next} onClick={() => p.next && go(p.next)} />
        </div>
      </div>
    </>
  );
}

// ---------- смены ----------
function CopyId({ id }) {
  const [done, setDone] = useState(false);
  useEffect(() => { if (!done) return undefined; const t = setTimeout(() => setDone(false), 1500); return () => clearTimeout(t); }, [done]);
  const copy = () => {
    try { if (navigator.clipboard) navigator.clipboard.writeText(id).catch(() => {}); } catch (e) { /* буфер недоступен */ }
    setDone(true);
  };
  return <DS.Button variant="secondary" size="small" onClick={copy}>{done ? 'Скопировано' : 'Копировать'}</DS.Button>;
}

function ShiftsSection({ shifts, monoId, summary }) {
  return (
    <details id="shifts" className="dd-panel dd-panel--shifts dd-fold">
      <summary className="dd-fold__sum">
        <DS.Icon name="chevron-right" size={20} color="var(--icons-default)" />
        <h2 className="dd-h2">Смены в RaccoonAI</h2>
        <span className="dd-muted">{summary}</span>
      </summary>
      {shifts.map((s, i) => s.gap ? (
        <div key={i} className="dd-gap"><span className="dd-gap__title">{s.title}</span><span>{s.text}</span></div>
      ) : (
        <div key={i} className="dd-shift">
          <span className="dd-shift__label">{s.label}</span>
          <div className="dd-shift__info">
            <span className="dd-shift__period">{s.period}</span>
            <span className="dd-shift__meta">{s.meta}</span>
            <span className="dd-shift__id">ID <a href="#" className={monoId ? 'dd-mono' : ''} onClick={(e) => e.preventDefault()}>{s.id}</a> <CopyId id={s.id} /></span>
          </div>
          <div className="dd-shift__chips">
            <span className="dd-chip"><span className="dd-chip__k">Выход план</span><span className="dd-chip__v">{s.plan}</span></span>
            <span className="dd-chip"><span className="dd-chip__k">Выход факт</span><span className="dd-chip__v">{s.fact}</span></span>
            {s.late
              ? <span className="dd-chip dd-chip--late">{s.delta}</span>
              : <span className="dd-chip dd-chip--ok"><DS.Icon name="check" size={16} color="currentColor" /><span className="dd-chip__v">{s.delta}</span></span>}
          </div>
        </div>
      ))}
    </details>
  );
}

// ---------- хронология ----------
function Timeline({ events }) {
  return (
    <section aria-label="Хронология дня" className="dd-panel dd-panel--timeline">
      <h2 className="dd-h2 dd-h2--timeline">Хронология дня</h2>
      {events.map((e, i) => (
        <div key={i} className="dd-ev">
          <div className="dd-ev__time">{e.time}</div>
          <div className="dd-ev__rail">
            <div className={'dd-ev__dot' + (e.warn ? ' dd-ev__dot--warn' : '')} />
            <div className="dd-ev__line" />
          </div>
          <div className="dd-ev__body">
            <span className="dd-ev__title">
              {e.shift && <span className="dd-ev__shift">Смена {e.shift}</span>}
              <span className="dd-ev__name">{e.title}</span>
            </span>
            <span className="dd-ev__meta">{e.meta} <span className="dd-ev__src">· {e.src}</span></span>
          </div>
        </div>
      ))}
    </section>
  );
}

// ---------- журнал ----------
function Journal({ entries }) {
  return (
    <details className="dd-panel dd-panel--log dd-fold">
      <summary className="dd-fold__sum">
        <DS.Icon name="chevron-right" size={20} color="var(--icons-default)" />
        <h2 className="dd-h2">Журнал изменений</h2>
        <span className="dd-muted">{entries.length}</span>
      </summary>
      {entries.map((t) => <div key={t} className="dd-log">{t}</div>)}
    </details>
  );
}

// ---------- карта (рисунок из макета: кварталы, дороги, сквер, река) ----------
const parseRects = (s) => s.split(' ').map((r) => r.split(',').map(Number));
const RECTS_THUMB = parseRects('6,6,22,34 6,46,22,48 33,6,30,22 33,34,30,60 68,6,26,22 68,34,26,60 102,6,22,28 102,40,22,54 158,6,30,22 158,34,30,60 193,6,30,28 193,40,30,54 231,6,26,22 231,34,26,60 263,6,36,28 263,40,36,54 6,118,30,28 42,118,30,28 77,118,22,28 104,118,22,28 158,118,22,28 188,118,22,28 215,118,30,28 253,118,22,28 281,118,25,28 330,118,22,28 358,118,36,28 422,118,36,28 6,170,26,28 37,170,36,28 81,170,18,28 105,170,29,28 158,170,30,28 194,170,30,28 229,170,30,28 267,170,30,28 330,170,22,28 357,170,22,28 385,170,13,28 422,170,26,28 456,170,18,28 6,222,18,22 32,222,22,22 62,222,18,22 86,222,36,22 158,222,18,22 158,250,18,44 184,222,30,22 184,250,30,44 222,222,26,28 222,256,26,38 256,222,26,28 256,256,26,38 287,222,18,28 287,256,18,38 330,222,30,28 330,256,30,38 366,222,18,22 366,250,18,44 422,222,26,28 422,256,26,38 456,222,18,34 456,262,18,32');
const RECTS_BIG = parseRects('6,6,26,22 6,34,26,60 38,6,18,22 38,34,18,60 64,6,18,28 64,40,18,54 90,6,18,34 90,46,18,48 113,6,18,22 113,34,18,60 158,6,30,22 158,34,30,60 193,6,18,34 193,46,18,48 217,6,18,34 217,46,18,48 240,6,22,34 240,46,22,48 270,6,36,22 270,34,36,60 6,118,36,28 48,118,18,28 71,118,18,28 97,118,22,28 158,118,22,28 188,118,18,28 214,118,26,28 248,118,22,28 275,118,31,28 330,118,22,28 358,118,18,28 384,118,14,28 422,118,18,28 448,118,22,28 6,170,36,28 48,170,26,28 80,170,36,28 122,170,12,28 158,170,22,28 185,170,22,28 212,170,36,28 254,170,36,28 330,170,30,28 366,170,32,28 422,170,18,28 448,170,26,28 6,222,26,22 37,222,30,22 73,222,18,22 99,222,18,22 158,222,26,28 158,256,26,38 192,222,26,34 192,262,26,32 224,222,36,28 224,256,36,38 265,222,18,28 265,256,18,38 289,222,17,22 289,250,17,44 330,222,26,34 330,262,26,32 364,222,30,28 364,256,30,38 422,222,30,34 422,262,30,32 458,222,16,28 458,256,16,38');
const TREES = [[350, 20], [372, 46], [398, 24], [430, 40], [455, 70], [345, 74], [410, 80], [462, 18]];
const MINOR_ROADS = ['M0 158 L480 158', 'M0 210 L480 210', 'M318 0 L318 300', 'M410 106 L410 300'];
const MAJOR_ROADS = ['M0 106 L480 106', 'M146 0 L146 300'];
// Точки маршрута и трек машины в координатах большой карты 480×300; превью рисуется в масштабе 0,5.
const ROUTE_PTS = [[232, 158], [318, 210], [410, 262]];
const THUMB_PTS = [[116, 79], [159, 105], [205, 132]];
const TRACK = '0,106 146,106 146,158 232,158 318,158 318,210 410,210 410,300';

function MapBase({ big }) {
  return (
    <>
      <rect x="0" y="0" width="480" height="300" className="dd-map__ground" />
      <rect x="324" y="0" width="156" height="100" className="dd-map__park" />
      {TREES.map(([x, y]) => <circle key={x} cx={x} cy={y} r="5" className="dd-map__tree" />)}
      <path d="M0 262 C40 252 80 284 140 270" className="dd-map__river" />
      {(big ? RECTS_BIG : RECTS_THUMB).map(([x, y, w, h]) => <rect key={x + '-' + y} x={x} y={y} width={w} height={h} rx="1.5" className="dd-map__bld" />)}
      {MINOR_ROADS.map((d) => <path key={'a' + d} d={d} className="dd-map__road-edge" />)}
      {MINOR_ROADS.map((d) => <path key={'b' + d} d={d} className="dd-map__road" />)}
      {MAJOR_ROADS.map((d) => <path key={'c' + d} d={d} className="dd-map__avenue-edge" />)}
      {MAJOR_ROADS.map((d) => <path key={'d' + d} d={d} className="dd-map__avenue" />)}
      {big && (
        <g className="dd-map__labels">
          <text x="20" y="109" className="is-strong">ул. Жандосова</text>
          <text x="0" y="0" transform="translate(149 290) rotate(-90)" className="is-strong">ул. Розыбакиева</text>
          <text x="340" y="213">ул. Сатпаева</text>
          <text x="20" y="161">ул. Мынбаева</text>
          <text x="392" y="60" className="is-park">сквер</text>
          <text x="18" y="290" className="is-water">р. Есентай</text>
        </g>
      )}
    </>
  );
}

// Пин отметки: остриё в (x, y). big — размер большой карты.
function Pin({ x, y, big }) {
  const [r, k, dy, hole] = big ? [16, 20, 32, 6] : [10, 12, 18, 4];
  return (
    <>
      <path d={`M${x} ${y} C${x} ${y} ${x - r} ${y - k} ${x - r} ${y - dy} A${r} ${r} 0 1 1 ${x + r} ${y - dy} C${x + r} ${y - k} ${x} ${y} ${x} ${y} Z`} className={'dd-map__pin' + (big ? ' dd-map__pin--big' : '')} />
      <circle cx={x} cy={y - dy} r={hole} className="dd-map__pin-hole" />
    </>
  );
}

// Превью карты 240×150. m: { zone:[x,y], line:[x1,y1,x2,y2], dist:{x,y,t}, pin:[x,y], ring:[x,y] } в координатах превью.
function MapThumbSvg({ m }) {
  return (
    <svg viewBox="0 0 240 150" preserveAspectRatio="xMidYMid slice" width="100%" height="100%" aria-hidden="true" className="dd-map__svg">
      <g transform="scale(0.5)"><MapBase /></g>
      <circle cx={m.zone[0]} cy={m.zone[1]} r="58" className="dd-map__zone" />
      <polyline points="0,53 73,53 73,79 116,79 159,79 159,105 205,105 205,150" className="dd-map__track" />
      {m.line && <line x1={m.line[0]} y1={m.line[1]} x2={m.line[2]} y2={m.line[3]} className="dd-map__dist" />}
      {m.dist && <text x={m.dist.x} y={m.dist.y} className="dd-map__dist-t">{m.dist.t}</text>}
      {THUMB_PTS.map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r="8" className="dd-map__pt" />
          <text x={x} y={y + 3} textAnchor="middle" className="dd-map__pt-t">{i + 1}</text>
        </g>
      ))}
      {m.pin && <Pin x={m.pin[0]} y={m.pin[1]} />}
      {m.ring && <circle cx={m.ring[0]} cy={m.ring[1]} r="13" className="dd-map__ring" />}
    </svg>
  );
}

const ExpandMark = () => (
  <span aria-hidden="true" className="dd-expand">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6" /><path d="M9 21H3v-6" /><path d="M21 3l-7 7" /><path d="M3 21l7-7" /></svg>
  </span>
);

const Legend = () => (
  <span className="dd-legend">
    <span><span aria-hidden="true" className="dd-legend__dot dd-legend__dot--mark" />отметка</span>
    <span><span aria-hidden="true" className="dd-legend__dot dd-legend__dot--pt" />точки маршрута</span>
    <span><span aria-hidden="true" className="dd-legend__dash" />трек машины</span>
  </span>
);

// ---------- фото отметки ----------
// Внешних картинок в прототипе нет: кадр с камеры нарисован (стена магазина, дверь разгрузки, сотрудник в жилете).
function PhotoArt({ kind, label }) {
  const evening = kind === 'out';
  return (
    <svg viewBox="0 0 120 120" preserveAspectRatio="xMidYMid slice" width="100%" height="100%" role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : 'true'} className={'dd-photo__svg' + (evening ? ' is-evening' : '')}>
      <rect x="0" y="0" width="120" height="120" className="dd-ph__sky" />
      <rect x="0" y="22" width="120" height="74" className="dd-ph__wall" />
      <rect x="10" y="28" width="62" height="10" rx="1" className="dd-ph__sign" />
      <rect x="14" y="31.5" width="30" height="3" rx="1.5" className="dd-ph__sign-t" />
      <rect x="80" y="30" width="30" height="20" rx="1" className="dd-ph__win" />
      <rect x="10" y="46" width="44" height="50" rx="1" className="dd-ph__door" />
      {[52, 58, 64, 70, 76, 82, 88].map((y) => <line key={y} x1="10" y1={y} x2="54" y2={y} className="dd-ph__door-l" />)}
      <rect x="0" y="96" width="120" height="24" className="dd-ph__ground" />
      <rect x="60" y="78" width="16" height="18" rx="1" className="dd-ph__box" />
      <rect x="62" y="70" width="12" height="9" rx="1" className="dd-ph__box" />
      <circle cx="92" cy="50" r="7" className="dd-ph__head" />
      <path d="M80 98 L82 68 Q92 58 102 68 L104 98 Z" className="dd-ph__body" />
      <path d="M84 66 L100 66 L101 84 L83 84 Z" className="dd-ph__vest" />
      <rect x="83" y="74" width="18" height="2.5" className="dd-ph__stripe" />
      <rect x="84" y="98" width="7" height="14" className="dd-ph__legs" />
      <rect x="93" y="98" width="7" height="14" className="dd-ph__legs" />
    </svg>
  );
}

function PhotoThumb({ kind, onOpen, alt }) {
  return (
    <button type="button" className="dd-photo" onClick={onOpen} aria-label={'Открыть ' + alt.charAt(0).toLowerCase() + alt.slice(1) + ' в окне'} title="Открыть фото">
      <span className="dd-photo__frame"><PhotoArt kind={kind} label={alt} /></span>
      <ExpandMark />
    </button>
  );
}

// Блок одной отметки: заголовок с меткой, фото и превью карты, подпись.
function MarkBlock({ title, tag, tagTone, photo, map, caption }) {
  return (
    <div className="dd-mark">
      <div className="dd-mark__head"><span className="dd-mark__title">{title}</span><span className={'dd-tag dd-tag--' + tagTone}>{tag}</span></div>
      <div className="dd-mark__media">
        <div className="dd-mark__photo">{photo}</div>
        <div className="dd-mark__map">{map}</div>
      </div>
      <span className="dd-muted">{caption}</span>
    </div>
  );
}

function MapThumbButton({ m, onOpen, label }) {
  return (
    <button type="button" className="dd-mapthumb" onClick={onOpen} aria-label={label} title="Открыть карту">
      <MapThumbSvg m={m} />
      <ExpandMark />
    </button>
  );
}

// ---------- окна ----------
function Overlay({ onClose, closeLabel, dim, label, className, children }) {
  useEscape(true, onClose);
  return (
    <div className="dd-overlay">
      <button type="button" className={'dd-overlay__scrim' + (dim ? ' is-dim' : '')} onClick={onClose} aria-label={closeLabel} tabIndex={-1} />
      <section role="dialog" aria-modal="true" aria-label={label} className={'rc-modal dd-modal ' + (className || '')}>{children}</section>
    </div>
  );
}

function ModalHead({ title, sub, onClose, entity = true }) {
  const ref = useRef(null);
  useEffect(() => { if (ref.current) ref.current.focus(); }, []);
  return (
    <>
      <header className="rc-modal__head dd-modal__head">
        <div className="rc-modal__titles">
          <h2 className={entity ? 'rc-modal__title--entity' : 'rc-modal__title'}>{title}</h2>
          <span className="dd-modal__sub">{sub}</span>
        </div>
        <button ref={ref} type="button" className="rc-modal__close" onClick={onClose} aria-label="Закрыть"><DS.Icon name="cancel" size={24} /></button>
      </header>
      <DS.Separator />
    </>
  );
}

function PhotoModal({ title, sub, alt, kind, wide, onClose }) {
  return (
    <Overlay onClose={onClose} closeLabel="Закрыть фото" dim label={alt.replace(/:.*/, '')} className={wide ? 'dd-modal--photo-wide' : 'dd-modal--photo'}>
      <ModalHead title={title} sub={sub} onClose={onClose} />
      <div className="dd-photo-full"><PhotoArt kind={kind} label={alt} /></div>
    </Overlay>
  );
}

// Большая карта. m: { zone:[x,y], line, label:{x,y,t}, pin:[x,y] }, card: { style, kind, title }, stats — подписи под картой.
function MapModal({ title, sub, ariaLabel, svgLabel, m, card, stats, onClose }) {
  const [zoom, setZoom] = useState(1);
  const origin = (m.pin[0] / 480 * 100) + '% ' + (m.pin[1] / 300 * 100) + '%';
  return (
    <Overlay onClose={onClose} closeLabel="Закрыть карту" dim label={ariaLabel} className="dd-modal--map">
      <ModalHead title={title} sub={sub} onClose={onClose} />
      <div className="dd-bigmap">
        <div className="dd-bigmap__canvas" style={{ transform: 'scale(' + zoom + ')', transformOrigin: origin }}>
          <svg viewBox="0 0 480 300" preserveAspectRatio="xMidYMid slice" width="100%" height="100%" role="img" aria-label={svgLabel} className="dd-map__svg">
            <MapBase big />
            <circle cx={m.zone[0]} cy={m.zone[1]} r="116" className="dd-map__zone dd-map__zone--big" />
            <polyline points={TRACK} className="dd-map__track dd-map__track--big" />
            <line x1={m.line[0]} y1={m.line[1]} x2={m.line[2]} y2={m.line[3]} className="dd-map__dist dd-map__dist--big" />
            <rect x={m.label.x - 19} y={m.label.y - 12} width="38" height="16" rx="8" className="dd-map__dist-bg" />
            <text x={m.label.x} y={m.label.y} textAnchor="middle" className="dd-map__dist-t dd-map__dist-t--big">{m.label.t}</text>
            {ROUTE_PTS.map(([x, y], i) => (
              <g key={i}>
                <circle cx={x} cy={y} r="12" className="dd-map__pt dd-map__pt--big" />
                <text x={x} y={y + 4} textAnchor="middle" className="dd-map__pt-t dd-map__pt-t--big">{i + 1}</text>
              </g>
            ))}
            <circle cx={m.pin[0]} cy={m.pin[1]} r="14" className="dd-map__halo" />
            <Pin x={m.pin[0]} y={m.pin[1]} big />
            <line x1="14" y1="284" x2="43" y2="284" className="dd-map__scale" />
            <line x1="14" y1="280" x2="14" y2="288" className="dd-map__scale" />
            <line x1="43" y1="280" x2="43" y2="288" className="dd-map__scale" />
            <text x="50" y="287" className="dd-map__scale-t">100 м</text>
          </svg>
        </div>
        <div className="dd-bigmap__card" style={card.style}>
          <span className="dd-bigmap__thumb"><PhotoArt kind={card.kind} /></span>
          <span className="dd-bigmap__card-text">
            <span className="dd-bigmap__card-title">{card.title}</span>
            <span className="dd-bigmap__card-sub">камера · точность 12 м</span>
            <span className="dd-bigmap__card-ok">в геозоне</span>
          </span>
        </div>
        <div className="dd-zoom">
          <button type="button" aria-label="Приблизить" disabled={zoom >= 2} onClick={() => setZoom((z) => Math.min(2, z + 0.5))}>+</button>
          <button type="button" aria-label="Отдалить" disabled={zoom <= 1} onClick={() => setZoom((z) => Math.max(1, z - 0.5))}>−</button>
        </div>
      </div>
      <div className="dd-bigmap__foot">
        <div className="dd-bigmap__stats">
          {stats.map(([k, v, mono]) => <span key={k}><span className="dd-bigmap__k">{k}</span> {mono ? <span className="dd-mono">{v}</span> : <strong>{v}</strong>}</span>)}
        </div>
        <Legend />
      </div>
    </Overlay>
  );
}

// ======================================================================
// Экран 3: день с исключением (нет отметки «Ушёл»)
// ======================================================================
const DRAFT = '16:38';
const ARRIVE = '06:48';
const REASONS = ['Сотрудник забыл отметиться', 'Подтвердил начальник колонны', 'Подтверждено GPS машины', 'Сбой связи или телефона', 'Ошибка в графике или маршруте', 'Отметил водитель за бригаду', 'Другое'];
const REASON_OPTIONS = [{ value: '', label: 'Выберите причину' }].concat(REASONS.map((r) => ({ value: r, label: r })));
const DAY_CODES = [{ value: 'Я — явка', label: 'Я — явка' }, { value: 'НН — неявка', label: 'НН — неявка' }, { value: 'Б — больничный', label: 'Б — больничный' }, { value: 'ОТ — отпуск', label: 'ОТ — отпуск' }];

const EX_SHIFTS = [
  { label: 'Смена 1', period: '07:05 – 11:40 · 4 ч 35 мин', meta: 'Маршрут №12 · 123 ABC 02 · водитель Ахметов Б.', id: 'S482317', plan: '07:00', fact: '07:05', delta: '+5 мин · в допуске' },
  { gap: true, title: 'Между сменами', text: '11:40 – 12:52 · 1 ч 12 мин · рабочий день не прерывался, в табель засчитывается' },
  { label: 'Смена 2', period: '12:52 – 16:38 · 3 ч 46 мин', meta: 'Маршрут №15 · 456 DEF 02 · водитель Сериков Д.', id: 'S482354', plan: '12:30', fact: '12:52', delta: '+22 мин · сверх допуска', late: true }
];
const EX_EVENTS = [
  { time: '06:48', title: 'Пришёл', meta: 'Фото + гео, 140 м от первой точки маршрута №12 (ул. Жандосова 58)', src: 'WhatsApp-бот, сам' },
  { time: '07:05', title: 'Машина 123 ABC 02 на первой точке', meta: 'Присутствие грузчика подтверждено прибытием машины', src: 'Wialon', shift: 1 },
  { time: '07:05', title: 'Начало смены · маршрут №12', meta: 'Выход: план 07:00, факт 07:05 · водитель Ахметов Б.', src: 'Платформа', shift: 1 },
  { time: '11:40', title: 'Конец смены · маршрут №12', meta: 'Последняя задача маршрута закрыта', src: 'DriverApp', shift: 1 },
  { time: '12:52', title: 'Начало смены · маршрут №15', meta: 'Выход: план 12:30, факт 12:52 — опоздание +22 мин · водитель Сериков Д.', src: 'Платформа', warn: true, shift: 2 },
  { time: '16:38', title: 'Последняя задача закрыта', meta: 'Конец смены 2 в RaccoonAI', src: 'DriverApp', shift: 2 },
  { time: '16:41', title: 'Бот напомнил отметить уход', meta: 'Ответа нет', src: 'WhatsApp-бот', warn: true },
  { time: '—', title: 'Ушёл — нет отметки', meta: 'Черновик: 16:38 по закрытию последней задачи смены 2', src: 'Система, черновик', warn: true }
];
const MAP_IN_THUMB = { zone: [116, 79], line: [116, 79, 132, 60], dist: { x: 126, y: 75, t: '140 м' }, pin: [132, 60] };
const MAP_OUT_THUMB = { zone: [205, 132], ring: [205, 132] };
const MAP_IN_BIG = { zone: [232, 158], line: [232, 158, 264, 120], label: { x: 269, y: 152, t: '140 м' }, pin: [264, 120] };
const CARD_IN = { left: '60.4%', top: '12%', maxWidth: 'calc(100% - 60.4% - var(--space-2))' };

// Переписка с сотрудником через бота.
function MessageModal({ p, st, set, onSend, onClose }) {
  const TPL = {
    time: p.first + ', добрый день! В табеле за ' + p.dGen + ' нет вашей отметки «Ушёл». По закрытию последней задачи это 16:38. Подтвердите время или напишите, когда вы ушли.',
    remind: p.first + ', отметьте, пожалуйста, уход за ' + p.dGen + ': нажмите «Ушёл» в боте и укажите время.',
    own: ''
  };
  const tplKey = st.tpl || 'time';
  const msgText = st.msgText !== undefined ? st.msgText : TPL[tplKey];
  const btns = st.btns !== undefined ? st.btns : true;
  const canSend = !!msgText.trim();
  const BTN_LABEL = 'Добавить кнопки ответа: «16:38 верно» · «Ушёл в другое время»';
  return (
    <Overlay onClose={onClose} closeLabel="Закрыть" label="Сообщение сотруднику" className="dd-modal--msg">
      <ModalHead entity={false} title={'Сообщение от имени HR · ' + p.name} onClose={onClose}
        sub={<><DS.Icon name="whatsapp" size={16} color="var(--icons-secondary)" />через WhatsApp-бот · +7 701 *** ** 34</>} />
      <div aria-label="Переписка" className="dd-chat">
        <span className="dd-chat__day">{p.dLong}</span>
        <div className="dd-bubble dd-bubble--in">
          <span className="dd-bubble__who">Бот табеля</span>
          <span>Вы закончили работу? Нажмите «Ушёл» и пришлите фото.</span>
          <span className="dd-bubble__time">16:41 · без ответа</span>
        </div>
        {st.msgSent && (
          <>
            <span className="dd-chat__day">Сегодня</span>
            <div className="dd-bubble dd-bubble--out">
              <span className="dd-bubble__who dd-bubble__who--hr">HR · через бот</span>
              <span className="dd-bubble__text">{st.sentText}</span>
              {st.sentWithButtons && (
                <span className="dd-bubble__btns"><span className="dd-quick">16:38 верно</span><span className="dd-quick">Ушёл в другое время</span></span>
              )}
              <span className="dd-bubble__time">10:30 · {st.msgReplied ? 'прочитано' : 'доставлено'}</span>
            </div>
          </>
        )}
        {st.msgTyping && <span className="dd-chat__typing">{p.short} печатает…</span>}
        {st.msgReplied && (
          <div className="dd-bubble dd-bubble--in">
            <span className="dd-bubble__who">{p.name}</span>
            <span>Ушёл в другое время: в 16:45. Ждал машину на точке, забыл нажать.</span>
            <span className="dd-bubble__time">10:31</span>
          </div>
        )}
      </div>
      {st.msgReplied && (
        <div className="dd-apply" role="status">
          {st.msgApplied
            ? <><span>«Ушёл» 16:45 подставлен в решение HR. Выберите причину и сохраните.</span><DS.Button variant="secondary" size="small" onClick={onClose}>К решению</DS.Button></>
            : <><span>Сотрудник указал уход в <strong>16:45</strong>. Подставить в решение?</span><DS.Button variant="primary" size="small" onClick={() => set({ msgApplied: true, leaveEdit: '16:45', reasonErr: false })}>Подставить 16:45</DS.Button></>}
        </div>
      )}
      {!st.msgSent ? (
        <div className="dd-compose">
          <div role="radiogroup" aria-label="Шаблон" className="dd-choices">
            {[['time', 'Уточнить время ухода'], ['remind', 'Попросить отметиться'], ['own', 'Своё сообщение']].map(([k, l]) => (
              <button key={k} type="button" role="radio" aria-checked={k === tplKey} className={'dd-choice dd-choice--tpl' + (k === tplKey ? ' is-on' : '')} onClick={() => set({ tpl: k, msgText: TPL[k] })}>{l}</button>
            ))}
          </div>
          <label className="dd-label">Текст сообщения
            <textarea rows={4} className="dd-textarea" value={msgText} placeholder="Напишите сообщение" onChange={(e) => set({ msgText: e.target.value })} />
          </label>
          <button type="button" className="cb dd-cb" aria-pressed={btns} onClick={() => set({ btns: !btns })}>
            <DS.Checkbox key={btns ? 'on' : 'off'} checked={btns} label={BTN_LABEL} />
          </button>
          <span className="dd-muted">Ответ придёт сюда и в журнал дня. Исключение остаётся открытым, пока HR не примет решение.</span>
          <div className="dd-compose__foot">
            <DS.Button variant="tertiary" onClick={onClose}>Отмена</DS.Button>
            <DS.Button variant="primary" icon="message-sent" disabled={!canSend} onClick={() => canSend && onSend(msgText, btns)}>Отправить</DS.Button>
          </div>
        </div>
      ) : (
        <div className="dd-compose dd-compose--sent"><DS.Button variant="tertiary" onClick={onClose}>Закрыть</DS.Button></div>
      )}
    </Overlay>
  );
}

function DayDetail({ day, data }) {
  const p = usePerson(day, data, '2026-10-05');
  const [st, setSt] = useState({});
  const set = (patch) => setSt((s) => Object.assign({}, s, patch));
  const timers = useRef([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const sel = st.reason || '';
  const leave = st.leaveEdit ? st.leaveEdit : DRAFT;
  const changed = leave !== DRAFT;
  const saved = st.saved || null;
  // Отработано: от «Пришёл» до «Ушёл». Если день открыт из табеля — база из часов ячейки при черновике 16:38.
  const base = p.hours != null ? Math.round(p.hours * 60) : minsOf(DRAFT) - minsOf(ARRIVE);
  const w = Math.max(0, base + minsOf(saved ? saved.time : leave) - minsOf(DRAFT));
  const workedHours = hours1(w);
  const code = st.code || DAY_CODES[0].value;

  const trySave = (mode, time) => {
    if (!sel) { set({ reasonErr: true }); return; }
    const reason = sel === 'Другое' && (st.otherText || '').trim() ? st.otherText.trim() : sel;
    set({ saved: { mode, time, reason, code }, reasonErr: false });
  };
  const sendMsg = (text, withButtons) => {
    set({ msgSent: true, sentText: text, sentWithButtons: withButtons, msgTyping: false });
    timers.current.push(setTimeout(() => set({ msgTyping: true }), 900));
    timers.current.push(setTimeout(() => set({ msgTyping: false, msgReplied: true }), 2600));
  };
  const close = (k) => () => set({ [k]: false });

  const pill = saved
    ? { tone: 'ok', icon: 'check', text: 'День закрыт HR' }
    : { tone: 'warn', icon: 'high-priority', text: 'Требует проверки · нет отметки «Ушёл»' };
  const leaveHint = changed ? (st.msgApplied && leave === '16:45' ? 'со слов сотрудника · черновик был 16:38' : 'исправлено · черновик был 16:38') : 'черновик системы';

  const log = [
    saved && '28 Окт 10:33 · HR · день закрыт: «Ушёл» ' + saved.time + ', «' + saved.reason + '»',
    st.msgApplied && '28 Окт 10:31 · HR · «Ушёл» 16:38 → 16:45 по ответу сотрудника',
    st.msgReplied && '28 Окт 10:31 · ' + p.short + ' · ответ: ушёл в 16:45',
    st.msgSent && '28 Окт 10:30 · HR · сообщение сотруднику в WhatsApp',
    p.dShort + ' 23:59 · Система · создан черновик «Ушёл» 16:38',
    p.dShort + ' 16:41 · Бот · напоминание отметить уход, без ответа',
    p.dShort + ' 06:48 · ' + p.short + ' · отметка «Пришёл»'
  ].filter(Boolean);

  const altIn = 'Фото отметки «Пришёл»: ' + p.name + ' у разгрузки магазина';

  return (
    <div className="dd">
      <DayHeader p={p} pill={pill} />

      <div className="dd-cols">
        <div className="dd-main">
          <section aria-label="Фото и карта отметок" className="dd-panel dd-panel--media">
            <h2 className="dd-h2">Отметки сотрудника</h2>
            <MarkBlock title="«Пришёл» 06:48" tag="в геозоне" tagTone="ok"
              photo={<PhotoThumb kind="in" alt={altIn} onOpen={() => set({ photoOpen: true })} />}
              map={<MapThumbButton m={MAP_IN_THUMB} onOpen={() => set({ mapOpen: true })} label="Открыть карту: где сделана фотография отметки «Пришёл»" />}
              caption="Снято камерой · 140 м от первой точки маршрута №12 · радиус 400 м" />
            <div aria-hidden="true" className="dd-divider" />
            <MarkBlock title="«Ушёл» —" tag="нет отметки" tagTone="warn"
              photo={<div className="dd-nophoto"><DS.Icon name="photo-missing" size={24} color="currentColor" /><span className="dd-nophoto__title">Фото нет</span><span className="dd-nophoto__sub">сотрудник не отметил уход</span></div>}
              map={<div role="img" aria-label="Карта: отметки «Ушёл» нет; показана последняя точка маршрута, где закрыта задача в 16:38" className="dd-mapthumb dd-mapthumb--static"><MapThumbSvg m={MAP_OUT_THUMB} /></div>}
              caption="Отметки нет. Черновик 16:38 — по закрытию последней задачи на точке 3 маршрута №15" />
            <Legend />
          </section>
          <Timeline events={EX_EVENTS} />
          <ShiftsSection shifts={EX_SHIFTS} summary="2 смены · 07:05 – 16:38 · выход 2-й смены +22 мин" />
          <Journal entries={log} />
        </div>

        <div className="dd-side">
          <section aria-label="Решение HR" className="dd-panel dd-panel--form">
            <h2 className="dd-h2">Решение HR</h2>
            {saved ? (
              <div role="status" className="dd-done">
                <span className="dd-done__title"><DS.Icon name="check" size={20} color="currentColor" />День закрыт, исключение снято</span>
                <span className="dd-done__line">Пришёл 06:48 · Ушёл {saved.time} · {saved.code} · {workedHours} ч в табель</span>
                <span className="dd-done__text">Причина: «{saved.reason}». Сотрудник получил уведомление в боте.</span>
                <span className="dd-done__actions">
                  <DS.Button variant="primary" iconRight="chevron-right" onClick={() => { window.location.hash = '#/exceptions'; }}>Следующее исключение</DS.Button>
                  <DS.Button variant="tertiary" onClick={() => set({ saved: null })}>Отменить решение</DS.Button>
                </span>
              </div>
            ) : (
              <>
                <p className="dd-lead">Отметки «Ушёл» нет. Система предлагает <strong>16:38</strong> — время, когда закрыта последняя задача маршрута.</p>
                <div className="dd-times">
                  <div className="dd-times__f"><DS.Field layout="vertical" label="Пришёл" value="06:48" iconLeft="time" /></div>
                  <label className="rc-field rc-field--vertical dd-times__f">
                    <span className="rc-field__label">Ушёл</span>
                    <span className="rc-field__control">
                      <span className={'rc-field__box' + (changed ? ' is-selected' : '')}>
                        <DS.Icon name="time" size={16} color="var(--icons-secondary)" />
                        <input className="rc-field__input" type="time" value={st.leaveEdit !== undefined ? st.leaveEdit : DRAFT} onChange={(e) => set({ leaveEdit: e.target.value })} aria-describedby="dd-leave-hint" />
                      </span>
                      <span id="dd-leave-hint" className="rc-field__hint">{leaveHint}</span>
                    </span>
                  </label>
                </div>
                <span className="dd-total">В табель: <strong>{workedHours} ч</strong> · {hm(w)}</span>
                <div className="dd-reasons">
                  <SelectControl label={<span className="dd-label__t">Причина <span className="dd-req">*</span></span>} value={sel} onChange={(v) => set({ reason: v })} options={REASON_OPTIONS} className={'dd-code' + (st.reasonErr && !sel ? ' is-error' : '')} />
                  {sel === 'Другое' && <textarea rows={2} aria-label="Своя причина" placeholder="Опишите причину" className="dd-textarea" value={st.otherText || ''} onChange={(e) => set({ otherText: e.target.value })} />}
                  {st.reasonErr && !sel && <span role="alert" className="dd-err">Выберите причину: без неё решение не сохранится</span>}
                </div>
                <details className="dd-more">
                  <summary>Код дня и перерыв <span className="dd-muted">{code.split(' — ')[0]} · перерыв 0 мин</span></summary>
                  <div className="dd-more__body">
                    <SelectControl label="Код дня" value={code} onChange={(v) => set({ code: v })} options={DAY_CODES} className="dd-code" />
                    <div className="dd-times__f"><DS.Field layout="vertical" label="Перерыв" value="0" suffix="мин" /></div>
                  </div>
                </details>
                <div className="dd-actions">
                  <DS.Button variant="primary" fullWidth onClick={() => (changed ? trySave('fixed', leave) : trySave('draft', DRAFT))}>
                    {changed ? 'Сохранить «Ушёл» ' + leave : 'Принять 16:38 и закрыть день'}
                  </DS.Button>
                  {changed && <DS.Button variant="tertiary" onClick={() => set({ leaveEdit: undefined })}>Вернуть 16:38</DS.Button>}
                </div>
                <div className="dd-foot">
                  <span className="dd-muted">Решение попадёт в журнал, сотрудник получит уведомление в боте.</span>
                  <DS.Button variant="link" icon="whatsapp" onClick={() => set({ msgOpen: true })}>Уточнить у сотрудника</DS.Button>
                </div>
              </>
            )}
          </section>
        </div>
      </div>

      {st.photoOpen && <PhotoModal wide kind="in" alt={altIn} title={p.name + ' · «Пришёл» 06:48'} sub={p.dLong + ' · снято камерой · 140 м от первой точки маршрута №12'} onClose={close('photoOpen')} />}
      {st.msgOpen && <MessageModal p={p} st={st} set={set} onSend={sendMsg} onClose={close('msgOpen')} />}
      {st.mapOpen && (
        <MapModal title="Где сделана отметка «Пришёл» 06:48" sub={p.name + ' · ' + p.dLong + ' · маршрут №12, ул. Жандосова 58'}
          ariaLabel="Карта отметки «Пришёл»" svgLabel="Карта: пин отметки «Пришёл» в 140 м от первой точки маршрута, внутри геозоны радиусом 400 м; рядом точки маршрута 2 и 3 и трек машины"
          m={MAP_IN_BIG} card={{ style: CARD_IN, kind: 'in', title: '«Пришёл» 06:48' }}
          stats={[['До точки 1:', '140 м'], ['Радиус геозоны:', '400 м'], ['Координаты:', '43.2346, 76.8892', true]]}
          onClose={close('mapOpen')} />
      )}
    </div>
  );
}

// ======================================================================
// Экран 3б: штатный день, закрыт автоматически
// ======================================================================
const NR_SHIFTS = [
  { label: 'Смена 1', period: '06:58 – 16:05 · 9 ч 07 мин', meta: 'Маршрут №12 · 123 ABC 02 · водитель Ахметов Б.', id: 'S482401', plan: '07:00', fact: '06:58', delta: '−2 мин · вовремя' }
];
const NR_EVENTS = [
  { time: '06:52', title: 'Пришёл', meta: 'Фото + гео, 90 м от первой точки маршрута №12 (ул. Жандосова 58)', src: 'WhatsApp-бот, сам' },
  { time: '06:58', title: 'Начало смены · маршрут №12', meta: 'Выход: план 07:00, факт 06:58 · водитель Ахметов Б.', src: 'Платформа', shift: 1 },
  { time: '07:04', title: 'Машина 123 ABC 02 на первой точке', meta: 'Присутствие грузчика подтверждено прибытием машины', src: 'Wialon', shift: 1 },
  { time: '16:05', title: 'Конец смены · маршрут №12', meta: 'Последняя задача маршрута закрыта', src: 'DriverApp', shift: 1 },
  { time: '16:12', title: 'Ушёл', meta: 'Фото + гео, 60 м от последней точки маршрута №12', src: 'WhatsApp-бот, сам' }
];
const NR_IN_THUMB = { zone: [116, 79], line: [116, 79, 132, 60], dist: { x: 126, y: 75, t: '90 м' }, pin: [132, 60] };
const NR_OUT_THUMB = { zone: [205, 132], line: [205, 132, 198, 126], dist: { x: 166, y: 128, t: '60 м' }, pin: [198, 126] };
const NR_IN_BIG = { zone: [232, 158], line: [232, 158, 264, 120], label: { x: 269, y: 152, t: '90 м' }, pin: [264, 120] };
const NR_OUT_BIG = { zone: [410, 264], line: [410, 264, 396, 252], label: { x: 349, y: 256, t: '60 м' }, pin: [396, 252] };
const CARD_OUT = { right: '20%', top: '52%' };

function DayDetailNormal({ day, data }) {
  const p = usePerson(day, data, '2026-10-06');
  const [open, setOpen] = useState('');
  const close = () => setOpen('');
  const w = p.hours != null ? Math.round(p.hours * 60) : minsOf('16:12') - minsOf('06:52');
  const h = Math.round(w / 6) / 10;
  const over = Math.round((h - p.norm) * 10) / 10;
  const altIn = 'Фото отметки «Пришёл»: ' + p.name + ' у разгрузки магазина';
  const altOut = 'Фото отметки «Ушёл»: ' + p.name + ' у магазина в конце дня';
  
  return (
    <div className="dd">
      <DayHeader p={p} pill={{ tone: 'ok', icon: 'check', text: 'Штатный день · без исключений' }} />

      <div className="dd-cols">
        <div className="dd-main">
          <section aria-label="Фото и карта отметок" className="dd-panel dd-panel--media">
            <h2 className="dd-h2">Отметки сотрудника</h2>
            <MarkBlock title="«Пришёл» 06:52" tag="в геозоне" tagTone="ok"
              photo={<PhotoThumb kind="in" alt={altIn} onOpen={() => setOpen('photoIn')} />}
              map={<MapThumbButton m={NR_IN_THUMB} onOpen={() => setOpen('mapIn')} label="Открыть карту: где сделана фотография отметки «Пришёл»" />}
              caption="Снято камерой · 90 м от первой точки маршрута №12 · радиус 400 м" />
            <div aria-hidden="true" className="dd-divider" />
            <MarkBlock title="«Ушёл» 16:12" tag="в геозоне" tagTone="ok"
              photo={<PhotoThumb kind="out" alt={altOut} onOpen={() => setOpen('photoOut')} />}
              map={<MapThumbButton m={NR_OUT_THUMB} onOpen={() => setOpen('mapOut')} label="Открыть карту: где сделана фотография отметки «Ушёл»" />}
              caption="Снято камерой · 60 м от последней точки маршрута №12 (точка 3) · радиус 400 м" />
            <Legend />
          </section>
          <Timeline events={NR_EVENTS} />
          <ShiftsSection shifts={NR_SHIFTS} monoId summary="1 смена · 06:58 – 16:05 · выход вовремя" />
          <Journal entries={[
            p.dShort + ' 23:59 · Система · день закрыт автоматически, исключений нет',
            p.dShort + ' 16:12 · ' + p.short + ' · отметка «Ушёл»',
            p.dShort + ' 06:52 · ' + p.short + ' · отметка «Пришёл»'
          ]} />
        </div>

        <div className="dd-side">
          <section aria-label="Итог дня" className="dd-panel dd-panel--form">
            <h2 className="dd-h2">Итог дня</h2>
            <div role="status" className="dd-auto">
              <DS.Icon name="check" size={20} color="currentColor" />
              <span className="dd-auto__text"><strong>Закрыт автоматически, действий не нужно</strong><span>Обе отметки с фото в геозоне и совпали с событиями машины.</span></span>
            </div>
            <dl className="dd-dl">
              <dt>Пришёл · Ушёл</dt><dd className="is-strong">06:52 – 16:12</dd>
              <dt>В табель</dt><dd className="is-strong">{fmt1(h)} ч · {hm(w)}</dd>
              <dt>Код дня</dt><dd>Я — явка</dd>
              <dt>Норма {p.roleGen}</dt><dd>{p.norm} ч · {over > 0 ? 'сверх нормы ' + fmt1(over) + ' ч' : 'без переработки'}</dd>
            </dl>
            <div className="dd-actions">
              <DS.Button variant="tertiary" icon="edit">Исправить вручную</DS.Button>
            </div>
          </section>
        </div>
      </div>

      {open === 'photoIn' && <PhotoModal kind="in" alt={altIn} title={p.name + ' · «Пришёл» 06:52'} sub={p.dLong + ' · снято камерой · 90 м от первой точки маршрута №12'} onClose={close} />}
      {open === 'photoOut' && <PhotoModal kind="out" alt={altOut} title={p.name + ' · «Ушёл» 16:12'} sub={p.dLong + ' · снято камерой · 60 м от последней точки маршрута №12'} onClose={close} />}
      {open === 'mapIn' && (
        <MapModal title="Где сделана отметка «Пришёл» 06:52" sub={p.name + ' · ' + p.dLong + ' · маршрут №12, ул. Жандосова 58'}
          ariaLabel="Карта отметки «Пришёл»" svgLabel="Карта: пин отметки «Пришёл» в 90 м от первой точки маршрута, внутри геозоны радиусом 400 м; рядом точки маршрута 2 и 3 и трек машины"
          m={NR_IN_BIG} card={{ style: CARD_IN, kind: 'in', title: '«Пришёл» 06:52' }}
          stats={[['До точки 1:', '90 м'], ['Радиус геозоны:', '400 м'], ['Координаты:', '43.2346, 76.8892', true]]}
          onClose={close} />
      )}
      {open === 'mapOut' && (
        <MapModal title="Где сделана отметка «Ушёл» 16:12" sub={p.name + ' · ' + p.dLong + ' · маршрут №12, последняя точка (точка 3)'}
          ariaLabel="Карта отметки «Ушёл»" svgLabel="Карта: пин отметки «Ушёл» в 60 м от последней точки маршрута (точка 3), внутри геозоны радиусом 400 м; трек машины и точки 1 и 2"
          m={NR_OUT_BIG} card={{ style: CARD_OUT, kind: 'out', title: '«Ушёл» 16:12' }}
          stats={[['До точки 3:', '60 м'], ['Радиус геозоны:', '400 м'], ['Координаты:', '43.2318, 76.8961', true]]}
          onClose={close} />
      )}
    </div>
  );
}

window.TabelScreens = window.TabelScreens || {};
window.TabelScreens.DayDetail = DayDetail;
window.TabelScreens.DayDetailNormal = DayDetailNormal;
})();
