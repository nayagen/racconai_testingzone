/* Экран 1 «Табель за месяц» — handoff/screens/Main.dc.html. Регистрируется как window.TabelScreens.Timesheet. */
(() => {
const { useState, useMemo, useEffect, useRef, useLayoutEffect } = React;
const DS = window.RaccoonDS;
const D = window.TabelData;
const { fmt1, dash, CheckToggle, SelectControl, useResizable, SectionTabs } = window.TabelUI;

const METRICS = [
  { value: 'h', label: 'Часы' },
  { value: 'km', label: 'Пробег, км' },
  { value: 'fuel', label: 'ГСМ, л' },
  { value: 'late', label: 'Опоздание выхода, мин' }
];

const SUM_COLS = [
  { key: 'total', title: 'Часы по норме' },
  { key: 'over', title: 'Переработка, ч' },
  { key: 'km', title: 'Пробег, км' },
  { key: 'fuel', title: 'ГСМ, л' },
  { key: 'rate', title: 'л/100 км' },
  { key: 'late', title: 'Опозд. выхода, дн' },
  { key: 'days', title: 'Дни' },
  { key: 'flags', title: <span className="bang" role="img" aria-label="Исключения" title="Исключения">!</span> }
];

const LEFT_W = 294, SUM_W = 560;

// ---------- выбор периода ----------
function PeriodPicker({ period, onApply }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(period);
  const [remember, setRemember] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const next = D.shiftPeriod(period, 1);
  const canNext = next.from <= D.TODAY;
  const err = D.validatePeriod(draft);
  const anchor = D.pd(draft.to || period.to);

  const pick = (preset) => {
    if (preset === 'custom') { setDraft({ ...draft, preset: 'custom' }); return; }
    setDraft(D.presetPeriod(preset, anchor.getUTCFullYear(), anchor.getUTCMonth()));
  };
  const setDate = (key) => (e) => setDraft({ ...draft, preset: 'custom', [key]: e.target.value });

  return (
    <div className="ctl period"><span id="period-lbl">Период</span>
      <div className="rc-dategroup">
        <DS.IconButton icon="chevron-left" label="Предыдущий период" size="medium" onClick={() => onApply(D.shiftPeriod(period, -1))} />
        <button type="button" className="rc-datebtn period-btn" aria-haspopup="dialog" aria-expanded={open} aria-labelledby="period-lbl period-val"
          style={{ boxShadow: `inset 0 0 0 1px var(${open ? '--border-action' : '--border-primary'})` }}
          onClick={() => { setDraft(period); setOpen(!open); }}>
          <DS.Icon name="tear-off-calendar" size={20} /><span id="period-val">{D.periodLabel(period)}</span>
        </button>
        <DS.IconButton icon="chevron-right" size="medium" disabled={!canNext}
          label={canNext ? 'Следующий период' : 'Следующий период ещё не начался'} onClick={() => canNext && onApply(next)} />
      </div>

      {open && <>
        <button type="button" className="popover-scrim" tabIndex={-1} aria-label="Закрыть выбор периода" onClick={() => setOpen(false)} />
        <div className="popover" role="dialog" aria-label="Период табеля">
          <div className="popover__head">
            <span className="popover__title">Период табеля</span>
            <span className="popover__sub">У каждого МВО свой период закрытия. Выберите шаблон или задайте даты.</span>
          </div>
          <div className="presets" role="radiogroup" aria-label="Шаблон периода">
            {D.PRESETS.map((p) => (
              <button key={p.value} type="button" role="radio" aria-checked={draft.preset === p.value}
                className={'preset' + (draft.preset === p.value ? ' is-selected' : '')} onClick={() => pick(p.value)}>
                <span>{p.label}</span><span className="preset__hint">{p.hint}</span>
              </button>
            ))}
          </div>
          <div className="dates">
            <label className="ctl">С
              <input type="date" className={'ctl__input' + (err ? ' is-error' : '')} value={draft.from} max={D.TODAY} onChange={setDate('from')} />
            </label>
            <span className="dates__dash" aria-hidden="true">—</span>
            <label className="ctl">По
              <input type="date" className={'ctl__input' + (err ? ' is-error' : '')} value={draft.to} min={draft.from} onChange={setDate('to')} />
            </label>
          </div>
          <span role="status" className={'hint' + (err ? ' is-error' : '')} style={{ marginTop: 'calc(-1 * var(--space-2))' }}>
            {err || `${draft.preset === 'custom' ? 'Свой период' : 'Шаблон'}: ${D.shortD(draft.from, true)} – ${D.shortD(draft.to, true)} · ${D.periodLength(draft)} дн.`}
          </span>
          <CheckToggle checked={remember} onChange={setRemember} label="Сделать периодом по умолчанию для МВО «Депо №1»" />
          <div className="popover__foot">
            <DS.Button variant="tertiary" onClick={() => setOpen(false)}>Отмена</DS.Button>
            <DS.Button variant="primary" disabled={!!err} onClick={() => { if (!err) { onApply(draft); setOpen(false); } }}>Показать</DS.Button>
          </div>
        </div>
      </>}
    </div>
  );
}

// ---------- сетка ----------
function cellView(c, row, metric) {
  if (c.kind === 'off') return { kind: 'off', text: c.code };
  if (metric !== 'h' && !row.isDriver) return c.flag ? { kind: 'flag', text: dash } : { kind: 'off', text: dash, none: true };
  let text = c.hours == null ? dash : fmt1(c.hours);
  if (metric !== 'h' && c.hours != null) {
    text = metric === 'late' ? (c.late > D.LATE_TOLERANCE ? '+' + c.late : '0') : String(metric === 'km' ? c.km : c.fuel);
  }
  const hot = metric === 'late' && c.late > D.LATE_TOLERANCE;
  return {
    kind: c.flag ? 'flag' : 'num', text,
    hot, quiet: metric === 'late' && !hot,
    over: metric === 'h' && c.hours != null && c.hours > row.norm,
    two: metric === 'late' && c.twoShifts
  };
}

function rowSums(r) {
  return {
    total: fmt1(r.total),
    over: r.over > 0.05 ? fmt1(r.over) : dash,
    km: r.isDriver ? String(r.km) : dash,
    fuel: r.isDriver ? String(r.fuel) : dash,
    rate: r.isDriver && r.km ? fmt1(r.fuel / r.km * 100) : dash,
    late: r.isDriver ? String(r.lateDays) : dash,
    days: String(r.workDays),
    flags: r.flags ? String(r.flags) : ''
  };
}

function groupSums(rows) {
  const s = rows.reduce((a, r) => ({ total: a.total + r.total, over: a.over + r.over, flags: a.flags + r.flags, km: a.km + r.km, fuel: a.fuel + r.fuel, late: a.late + r.lateDays }),
    { total: 0, over: 0, flags: 0, km: 0, fuel: 0, late: 0 });
  return {
    total: fmt1(s.total), over: s.over > 0.05 ? fmt1(s.over) : dash,
    km: s.km ? String(s.km) : dash, fuel: s.fuel ? String(s.fuel) : dash,
    rate: s.km ? fmt1(s.fuel / s.km * 100) : dash, late: s.km ? String(s.late) : dash,
    days: dash, flags: s.flags ? String(s.flags) : ''
  };
}

// ---------- клавиатура и подсветка ----------
// Сетка — один шаг Tab (roving tabindex): фокус стоит на одной ячейке, стрелки двигают его по дням и сотрудникам,
// Home/End — к первому/последнему дню, Ctrl+Home/End — к первому/последнему сотруднику, Enter открывает день.
// Подсветка столбца: одно правило в <style>, которое переписывается при наведении или фокусе (вместо правил на каждый день).
const NAV_SEL = '[data-r][data-c]';
const colRule = (col) => col ? `.tt [data-col="${col}"] { background: var(--surface-secondary); }` : '';

function useGridNav(gridRef, colStyleRef, deps) {
  const active = useRef({ r: 0, c: 0 });
  const setCol = (col) => { if (colStyleRef.current && colStyleRef.current.dataset.col !== (col || '')) { colStyleRef.current.dataset.col = col || ''; colStyleRef.current.textContent = colRule(col); } };

  // После каждой отрисовки ровно одна ячейка получает tabIndex=0.
  useLayoutEffect(() => {
    const g = gridRef.current; if (!g) return;
    const { r, c } = active.current;
    const el = g.querySelector(`[data-r="${r}"][data-c="${c}"]`) || g.querySelector(NAV_SEL);
    if (el) { el.tabIndex = 0; active.current = { r: +el.dataset.r, c: +el.dataset.c }; }
  });

  const onFocus = (e) => {
    const t = e.target.closest(NAV_SEL);
    if (t) {
      const g = gridRef.current;
      g.querySelectorAll(NAV_SEL + '[tabindex="0"]').forEach((x) => { if (x !== t) x.tabIndex = -1; });
      t.tabIndex = 0; active.current = { r: +t.dataset.r, c: +t.dataset.c };
    }
    const colEl = e.target.closest('[data-col]');
    setCol(colEl && colEl.dataset.col);
  };
  const onKeyDown = (e) => {
    const t = e.target.closest(NAV_SEL); if (!t) return;
    let r = +t.dataset.r, c = +t.dataset.c;
    const g = gridRef.current;
    const rows = g.querySelectorAll('[data-r][data-c="0"]').length;
    const cols = g.querySelectorAll('[data-r="' + r + '"][data-c]').length;
    switch (e.key) {
      case 'ArrowRight': c = Math.min(cols - 1, c + 1); break;
      case 'ArrowLeft': c = Math.max(0, c - 1); break;
      case 'ArrowDown': r = Math.min(rows - 1, r + 1); break;
      case 'ArrowUp': r = Math.max(0, r - 1); break;
      case 'Home': if (e.ctrlKey) r = 0; c = 0; break;
      case 'End': if (e.ctrlKey) r = rows - 1; c = cols - 1; break;
      case 'PageDown': r = Math.min(rows - 1, r + 10); break;
      case 'PageUp': r = Math.max(0, r - 10); break;
      default: return;
    }
    e.preventDefault();
    const next = g.querySelector(`[data-r="${r}"][data-c="${c}"]`);
    if (next) { next.focus({ preventScroll: true }); next.scrollIntoView({ block: 'nearest', inline: 'nearest' }); }
  };
  const onPointerOver = (e) => { const colEl = e.target.closest('[data-col]'); setCol(colEl && colEl.dataset.col); };
  const onPointerLeave = () => { if (!gridRef.current.contains(document.activeElement)) setCol(null); };
  return { onFocus, onKeyDown, onPointerOver, onPointerLeave };
}

function DayCell({ c, row, day, metric, r, ci }) {
  const v = cellView(c, row, metric);
  const cls = 'dc' + (day.monthStart ? ' is-month-start' : '');
  const href = `#/day/${row.id}/${day.date}`;
  const nav = { 'data-r': r, 'data-c': ci, tabIndex: -1 };
  const date = `${day.n} ${day.w}`;
  if (v.kind === 'off') {
    const label = { 'В': 'выходной', 'Б': 'больничный', 'ОТ': 'отпуск', 'НН': 'неявка' }[v.text] || 'нет данных';
    return (
      <div className={cls} role="gridcell" data-col={day.key}>
        <div className="day-off" {...nav} aria-label={`${row.name}, ${date}: ${label}`}>
          <span className={'pill ' + (v.none ? 'pill--none' : 'pill--' + v.text)} aria-hidden="true">{v.text}</span>
        </div>
      </div>
    );
  }
  if (v.kind === 'flag') {
    return (
      <div className={cls} role="gridcell" data-col={day.key}>
        <a href={href} {...nav} className="day-flag" aria-label={`${row.name}, ${date}: ${v.text}, требует проверки`} title="Требует проверки — открыть день">
          {v.text}<span className="bang" aria-hidden="true">!</span>{v.two && <span className="day-cell__mark" aria-hidden="true">2см</span>}
        </a>
      </div>
    );
  }
  return (
    <div className={cls} role="gridcell" data-col={day.key}>
      <a href={href} {...nav} className={'day-cell' + (v.hot ? ' is-hot' : '') + (v.quiet ? ' is-quiet' : '') + (v.over ? ' is-over' : '')}
        aria-label={`${row.name}, ${date}: ${v.text}${v.two ? ', две смены' : ''}`} title="Открыть карточку дня">
        {v.text}{v.two && <span className="day-cell__mark" aria-hidden="true">2см</span>}
      </a>
    </div>
  );
}

function SumCells({ vals, isRow }) {
  return SUM_COLS.map((col, i) => (
    <div key={col.key} role="gridcell" data-col={'s' + i}
      className={'s-' + col.key + (col.key === 'over' && isRow ? (vals.over === dash ? ' is-calm' : ' is-hot') : '')}>{vals[col.key]}</div>
  ));
}

// Строка сотрудника не перерисовывается при перетаскивании ширины колонок: ширины заданы CSS-переменными на контейнере.
const PersonRow = React.memo(function PersonRow({ r, days, metric, flat, rIndex, ariaIndex }) {
  return (
    <div className="tt-r tt-row" role="row" aria-rowindex={ariaIndex}>
      <div className="tt-left" role="rowheader">
        <div className="tt-person" style={flat ? { paddingLeft: 'var(--space-3)' } : null}>
          <span className="tt-person__name">{r.name}</span>
          <span className="tt-person__id">таб. № {r.id}</span>
        </div>
        <div className="tt-person__role">{r.role}</div>
      </div>
      <div className="tt-days">
        {r.cells.map((c, i) => <DayCell key={i} c={c} row={r} day={days[i]} metric={metric} r={rIndex} ci={i} />)}
      </div>
      <div className="tt-sum"><SumCells vals={rowSums(r)} isRow /></div>
    </div>
  );
});

function TimesheetGrid({ days, groups, metric, collapsed, onToggleGroup }) {
  const [leftW, startLeft, resetLeft, keyLeft] = useResizable(LEFT_W, 200, 560, 1);
  const [sumW, startSum, resetSum, keySum] = useResizable(SUM_W, 360, 1000, -1);
  const gridRef = useRef(null), colStyleRef = useRef(null);
  const nav = useGridNav(gridRef, colStyleRef);

  let rIndex = 0, ariaIndex = 1;
  const total = groups.reduce((a, g) => a + (g.label ? 1 : 0) + ((!collapsed[g.id] || !g.label) ? g.rows.length : 0), 1);

  return (
    <div className="tt-scroll" style={{ '--tt-left-w': leftW + 'px', '--tt-sum-w': sumW + 'px' }}>
      <style ref={colStyleRef} />
      <div className="tt" role="grid" aria-label="Табель: сотрудники по дням" aria-rowcount={total} aria-colcount={days.length + SUM_COLS.length + 1}
        ref={gridRef} onFocus={nav.onFocus} onKeyDown={nav.onKeyDown} onPointerOver={nav.onPointerOver} onPointerLeave={nav.onPointerLeave}>
        <div className="tt-r tt-head" role="row" aria-rowindex={ariaIndex++}>
          <div className="tt-left" role="columnheader">
            <div className="tt-head__name">Сотрудник</div>
            <div className="tt-head__role" aria-hidden="true">Роль</div>
            <button type="button" className="resizer resizer--right" aria-label="Ширина колонки сотрудников: стрелки влево и вправо, Home — по умолчанию"
              title="Потяните или используйте стрелки. Двойной клик — по умолчанию" onPointerDown={startLeft} onDoubleClick={resetLeft} onKeyDown={keyLeft}><span /></button>
          </div>
          <div className="tt-days">
            {days.map((d) => (
              <div key={d.key} role="columnheader" data-col={d.key} aria-label={`${d.n}, ${d.weekday}${d.weekend ? ', выходной' : ''}`}
                className={'day-h' + (d.weekend ? ' is-weekend' : '') + (d.monthStart ? ' is-month-start' : '')}>
                <span className="day-h__n" aria-hidden="true">{d.n}</span><span className="day-h__w" aria-hidden="true">{d.w}</span>
              </div>
            ))}
          </div>
          <div className="tt-sum">
            <button type="button" className="resizer resizer--left" aria-label="Ширина блока итогов: стрелки влево и вправо, Home — по умолчанию"
              title="Потяните или используйте стрелки. Двойной клик — по умолчанию" onPointerDown={startSum} onDoubleClick={resetSum} onKeyDown={keySum}><span /></button>
            {SUM_COLS.map((c, i) => <div key={c.key} role="columnheader" data-col={'s' + i}>{c.title}</div>)}
          </div>
        </div>

        {groups.length === 0 && (
          <div className="empty-row" role="row"><div role="gridcell"><DS.EmptyState icon="search" title="Никого не нашли" text="Измените фильтры или строку поиска." /></div></div>
        )}

        {groups.map((g) => {
          const open = !collapsed[g.id];
          return (
            <React.Fragment key={g.id}>
              {g.label && (
                <div className="tt-r tt-group" role="row" aria-rowindex={ariaIndex++}>
                  <div className="tt-left" role="rowheader">
                    <button type="button" className="tt-group__btn" aria-expanded={open} onClick={() => onToggleGroup(g.id)}>
                      <DS.Icon name={open ? 'chevron-down' : 'chevron-right'} size={20} color="var(--icons-default)" />
                      <span className="tt-group__name">{g.label}</span>
                      <span className="tt-group__count"><DS.CounterBadge count={g.countLabel} tone="neutral" /></span>
                    </button>
                  </div>
                  <div className="tt-days" aria-hidden="true">{days.map((d) => <div key={d.key} />)}</div>
                  <div className="tt-sum"><SumCells vals={groupSums(g.rows)} /></div>
                </div>
              )}
              {(open || !g.label) && g.rows.map((r) => (
                <PersonRow key={r.id} r={r} days={days} metric={metric} flat={!g.label} rIndex={rIndex++} ariaIndex={ariaIndex++} />
              ))}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

function Legend() {
  return (
    <div className="legend">
      <span className="legend__item"><span className="legend__swatch">12,0</span> часы · <b style={{ fontWeight: 600 }}>12,9</b> сверх нормы</span>
      <span className="legend__item"><span className="legend__swatch legend__swatch--flag" /> требует проверки — клик открывает день</span>
      <span className="legend__item">
        <span className="pill pill--В">В</span> выходной
        <span className="pill pill--Б">Б</span> больничный
        <span className="pill pill--ОТ">ОТ</span> отпуск
        <span className="pill pill--НН">НН</span> неявка
      </span>
      <div className="legend__notes">
        <span>Дни прокручиваются горизонтально; сотрудник и итоги закреплены.</span>
        <span>«2см» — в дне две смены; в режиме опоздания показано худшее отклонение за день.</span>
        <span>Пробег — по Wialon за смены дня, ГСМ — из мониторинга ГСМ; у грузчиков не считается.</span>
      </div>
    </div>
  );
}

// ---------- выгрузка ----------
function ExportModal({ periodLabel, teams, rows, flagCount, periodOpen, onClose }) {
  const [sel, setSel] = useState(() => Object.fromEntries(teams.map((t) => [t.id, true])));
  const [format, setFormat] = useState('xlsx');
  const [layout, setLayout] = useState('sheets');
  const [inc, setInc] = useState({ km: true, fuel: true, flags: false, filters: false });

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const counts = useMemo(() => Object.fromEntries(teams.map((t) => [t.id, rows.filter((r) => r.team === t.id).length])), [teams, rows]);
  const chosen = teams.filter((t) => sel[t.id]);
  const people = chosen.reduce((a, t) => a + counts[t.id], 0);
  const setAll = (v) => setSel(Object.fromEntries(teams.map((t) => [t.id, v])));
  // Radio из DS неуправляемый: выбранное значение ловим всплывающим change на fieldset (data-v у опции).
  return (
    <div className="scrim" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-label="Выгрузка табеля" className="rc-modal export">
        <header className="rc-modal__head">
          <div className="rc-modal__titles">
            <h2 className="rc-modal__title">Выгрузка табеля</h2>
            <div className="rc-modal__subtitle">{periodLabel} · Депо №1</div>
          </div>
          <button type="button" className="rc-modal__close" aria-label="Закрыть" onClick={onClose}><DS.Icon name="cancel" size={24} /></button>
        </header>
        <DS.Separator />
        <div className="rc-modal__body">
          <fieldset className="fs fs--row" onChange={(e) => setFormat(e.target.closest('.fs__opt').dataset.v)}>
            <legend>Формат</legend>
            <div className="fs__opt" data-v="xlsx"><DS.Radio name="fmt" checked={format === 'xlsx'} label="Excel (.xlsx)" /></div>
            <div className="fs__opt" data-v="1c"><DS.Radio name="fmt" checked={format === '1c'} label="1С (файл обмена)" /></div>
          </fieldset>

          <fieldset className="fs">
            <legend>Команды</legend>
            <div className="fs__links">
              <DS.Button variant="link" size="small" onClick={() => setAll(true)}>Выбрать все</DS.Button>
              <DS.Button variant="link" size="small" onClick={() => setAll(false)}>Снять все</DS.Button>
            </div>
            {teams.map((t) => (
              <button key={t.id} type="button" className="team-opt" aria-pressed={!!sel[t.id]} onClick={() => setSel({ ...sel, [t.id]: !sel[t.id] })}>
                <DS.Checkbox key={sel[t.id] ? 'on' : 'off'} checked={!!sel[t.id]} label={t.name} />
                <span className="team-opt__count">{counts[t.id]} чел.</span>
              </button>
            ))}
          </fieldset>

          <fieldset className="fs" onChange={(e) => setLayout(e.target.closest('.fs__opt').dataset.v)}>
            <legend>Как разложить</legend>
            <div className="fs__opt" data-v="sheets"><DS.Radio name="layout" checked={layout === 'sheets'} label="Один файл, отдельный лист на каждую команду" /></div>
            <div className="fs__opt" data-v="blocks"><DS.Radio name="layout" checked={layout === 'blocks'} label="Один лист, команды блоками с итогами" /></div>
            <div className="fs__opt" data-v="zip"><DS.Radio name="layout" checked={layout === 'zip'} label="Отдельный файл на каждую команду (ZIP)" /></div>
          </fieldset>

          <fieldset className="fs fs--row">
            <legend>Что включить</legend>
            <div className="fs__opt"><DS.Checkbox checked disabled label="Часы и коды дней" /></div>
            <div className="fs__opt"><CheckToggle checked={inc.km} onChange={(v) => setInc({ ...inc, km: v })} label="Пробег" /></div>
            <div className="fs__opt"><CheckToggle checked={inc.fuel} onChange={(v) => setInc({ ...inc, fuel: v })} label="ГСМ" /></div>
            <div className="fs__opt"><CheckToggle checked={inc.flags} onChange={(v) => setInc({ ...inc, flags: v })} label="Пометки исключений" /></div>
          </fieldset>

          <CheckToggle checked={inc.filters} onChange={(v) => setInc({ ...inc, filters: v })} label="Учитывать текущие фильтры (роль, «Только с исключениями»)" />

          {periodOpen && <div className="note">Период ещё не закрыт — в файле будет пометка «Черновик». Неразобранных исключений: {flagCount}.</div>}
        </div>
        <DS.Separator />
        <footer className="rc-modal__foot">
          <span className="rc-modal__footl">Будет выгружено: команд — {chosen.length}, сотрудников — {people}</span>
          <div className="rc-modal__footr">
            <DS.Button variant="tertiary" onClick={onClose}>Отмена</DS.Button>
            <DS.Button variant="primary" disabled={chosen.length === 0} onClick={onClose}>Скачать</DS.Button>
          </div>
        </footer>
      </section>
    </div>
  );
}

// ---------- экран «Табель» ----------
const GROUP_OPTIONS = [{ value: 'team', label: 'По командам' }, { value: 'role', label: 'По ролям' }, { value: 'none', label: 'Без группировки' }];
const ROLE_OPTIONS = [{ value: 'all', label: 'Все' }, { value: 'Водитель', label: 'Водители' }, { value: 'Грузчик', label: 'Грузчики' }];
const DEPOT_OPTIONS = [{ value: '1', label: 'Депо №1' }, { value: '2', label: 'Депо №2' }];

function TimesheetScreen({ data, period, setPeriod, flagCount: totalFlags }) {
  const [exportOpen, setExportOpen] = useState(false);
  const [metric, setMetric] = useState('h');
  const [role, setRole] = useState('all');
  const [grouping, setGrouping] = useState('team');
  const [depot, setDepot] = useState('1');
  const [query, setQuery] = useState('');
  const [onlyFlags, setOnlyFlags] = useState(false);
  const [collapsed, setCollapsed] = useState({});

  const flagCount = data.rows.reduce((a, r) => a + r.flags, 0);
  const periodOpen = period.to >= '2026-10-01';

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const match = (r) => (role === 'all' || r.role === role) && (!q || r.name.toLowerCase().includes(q) || r.id.includes(q));
    const buckets = grouping === 'team'
      ? data.teams.map((t) => ({ id: t.id, label: t.name, all: data.rows.filter((r) => r.team === t.id) }))
      : grouping === 'role'
        ? [{ id: 'Водитель', label: 'Водители' }, { id: 'Грузчик', label: 'Грузчики' }].map((g) => ({ ...g, all: data.rows.filter((r) => r.role === g.id) }))
        : [{ id: 'all', label: null, all: data.rows }];
    return buckets.map((b) => {
      const all = b.all.filter(match);
      const rows = onlyFlags ? all.filter((r) => r.flags > 0) : all;
      return { id: b.id, label: b.label, rows, countLabel: onlyFlags ? `${rows.length}/${all.length}` : String(rows.length) };
    }).filter((g) => g.rows.length > 0);
  }, [data, role, grouping, query, onlyFlags]);

  return (
    <>
    <SectionTabs active="" flagCount={totalFlags}>
      <DS.Button variant="secondary" onClick={() => setExportOpen(true)}>Выгрузить в 1С / Excel</DS.Button>
      <DS.Button variant="primary" disabled={flagCount > 0}>Закрыть период</DS.Button>
    </SectionTabs>
    <div className="card">
      <div className="filters">
        <PeriodPicker period={period} onApply={setPeriod} />
        <SelectControl className="ctl--depot" label="Депо" value={depot} onChange={setDepot} options={DEPOT_OPTIONS} />
        <SelectControl className="ctl--role" label="Роль" value={role} onChange={setRole} options={ROLE_OPTIONS} />
        <SelectControl className="ctl--group" label="Группировка" value={grouping} onChange={setGrouping} options={GROUP_OPTIONS} />
        <label className="ctl ctl--search">Поиск
          <span className="ctl__wrap">
            <span className="ctl__icon ctl__icon--left" aria-hidden="true"><DS.Icon name="search" size={20} color="var(--icons-secondary)" /></span>
            <input type="search" className="ctl__input ctl__input--search" placeholder="ФИО или табельный №" value={query} onChange={(e) => setQuery(e.target.value)} />
          </span>
        </label>
        <CheckToggle className="cb--filter" checked={onlyFlags} onChange={setOnlyFlags} label="Только с исключениями" />
      </div>

      <div className={'period-status' + (periodOpen ? '' : ' is-closed')}>
        <span className="period-status__title">{periodOpen ? 'Период открыт' : 'Период закрыт · только просмотр'}</span>
        <span>{data.rows.length} сотрудников · исключений к разбору до закрытия периода: {flagCount}</span>
        {flagCount > 0 && <a href="#/exceptions" className="link-strong">Перейти к исключениям →</a>}
      </div>

      <div className="toolbar">
        <DS.SegmentedTabs items={METRICS} value={metric} onChange={setMetric} />
        {grouping !== 'none' && (
          <div className="toolbar__right">
            <DS.Button variant="secondary" size="small" onClick={() => setCollapsed({})}>Развернуть все</DS.Button>
            <DS.Button variant="secondary" size="small" onClick={() => setCollapsed(Object.fromEntries(groups.map((g) => [g.id, true])))}>Свернуть все</DS.Button>
          </div>
        )}
      </div>

      <TimesheetGrid days={data.days} groups={groups} metric={metric} collapsed={collapsed}
        onToggleGroup={(id) => setCollapsed({ ...collapsed, [id]: !collapsed[id] })} />

      <Legend />
    </div>
    {exportOpen && (
      <ExportModal periodLabel={D.periodLabel(period)} teams={data.teams} rows={data.rows} flagCount={flagCount}
        periodOpen={periodOpen} onClose={() => setExportOpen(false)} />
    )}
    </>
  );
}

window.TabelScreens = window.TabelScreens || {};
window.TabelScreens.Timesheet = TimesheetScreen;
})();
