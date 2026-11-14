/* Экран 1 «Табель за месяц» — handoff/screens/Main.dc.html. Регистрируется как window.TabelScreens.Timesheet. */
(() => {
const { useState, useMemo, useEffect } = React;
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

// Подсветка столбца дня / итога при наведении: правила генерируются под число дней периода.
function crosshairCss(nDays) {
  const sel = [];
  for (let i = 0; i < nDays; i++) {
    sel.push(`.tt:has(.h-d${i}:hover) :is(.h-d${i}, .c-d${i})`, `.tt:has(.c-d${i}:hover) .h-d${i}`);
  }
  SUM_COLS.forEach((_, i) => sel.push(`.tt:has(.hs${i}:hover) :is(.hs${i}, .rs${i})`, `.tt:has(.rs${i}:hover) .hs${i}`));
  return sel.join(',\n') + ' { background: var(--surface-secondary); }';
}

function DayCell({ c, row, day, metric }) {
  const v = cellView(c, row, metric);
  const cls = 'dc c-' + day.key + (day.monthStart ? ' is-month-start' : '');
  const href = `#/day/${row.id}/${day.date}`;
  if (v.kind === 'off') {
    return <div className={cls}><div className="day-off"><span className={'pill ' + (v.none ? 'pill--none' : 'pill--' + v.text)}>{v.text}</span></div></div>;
  }
  if (v.kind === 'flag') {
    return (
      <div className={cls}>
        <a href={href} className="day-flag" aria-label={`${row.name}, ${day.n}: требует проверки`} title="Требует проверки — открыть день">
          {v.text}<span className="bang" aria-hidden="true">!</span>{v.two && <span className="day-cell__mark">2см</span>}
        </a>
      </div>
    );
  }
  return (
    <div className={cls}>
      <a href={href} className={'day-cell' + (v.hot ? ' is-hot' : '') + (v.quiet ? ' is-quiet' : '') + (v.over ? ' is-over' : '')}
        aria-label={`${row.name}, ${day.n}: ${v.text}`} title="Открыть карточку дня">
        {v.text}{v.two && <span className="day-cell__mark">2см</span>}
      </a>
    </div>
  );
}

function TimesheetGrid({ days, groups, metric, collapsed, onToggleGroup }) {
  const [leftW, startLeft, resetLeft] = useResizable(LEFT_W, 200, 560, 1);
  const [sumW, startSum, resetSum] = useResizable(SUM_W, 360, 1000, -1);
  const css = useMemo(() => crosshairCss(days.length), [days.length]);

  const sumCells = (vals, rowCls) => SUM_COLS.map((col, i) => (
    <div key={col.key} className={(rowCls ? `rs${i} ` : '') + 's-' + col.key + (col.key === 'over' && rowCls ? (vals.over === dash ? ' is-calm' : ' is-hot') : '')}>{vals[col.key]}</div>
  ));

  return (
    <div className="tt-scroll">
      <style>{css}</style>
      <div className="tt" role="table" aria-label="Табель: сотрудники по дням">
        <div className="tt-r tt-head" role="row">
          <div className="tt-left" style={{ width: leftW }}>
            <div className="tt-head__name">Сотрудник</div>
            <div className="tt-head__role">Роль</div>
            <button type="button" className="resizer resizer--right" aria-label="Изменить ширину колонки сотрудников"
              title="Потяните, чтобы изменить ширину. Двойной клик — по умолчанию" onPointerDown={startLeft} onDoubleClick={resetLeft}><span /></button>
          </div>
          <div className="tt-days">
            {days.map((d) => (
              <div key={d.key} className={`day-h h-${d.key}` + (d.weekend ? ' is-weekend' : '') + (d.monthStart ? ' is-month-start' : '')}>
                <span className="day-h__n">{d.n}</span><span className="day-h__w">{d.w}</span>
              </div>
            ))}
          </div>
          <div className="tt-sum" style={{ width: sumW }}>
            <button type="button" className="resizer resizer--left" aria-label="Изменить ширину блока итогов"
              title="Потяните, чтобы изменить ширину. Двойной клик — по умолчанию" onPointerDown={startSum} onDoubleClick={resetSum}><span /></button>
            {SUM_COLS.map((c, i) => <div key={c.key} className={'hs' + i}>{c.title}</div>)}
          </div>
        </div>

        {groups.length === 0 && (
          <div className="empty-row"><DS.EmptyState icon="search" title="Никого не нашли" text="Измените фильтры или строку поиска." /></div>
        )}

        {groups.map((g) => {
          const open = !collapsed[g.id];
          return (
            <React.Fragment key={g.id}>
              {g.label && (
                <div className="tt-r tt-group" role="row">
                  <div className="tt-left" style={{ width: leftW }}>
                    <button type="button" className="tt-group__btn" aria-expanded={open} onClick={() => onToggleGroup(g.id)}>
                      <DS.Icon name={open ? 'chevron-down' : 'chevron-right'} size={20} color="var(--icons-default)" />
                      <span className="tt-group__name">{g.label}</span>
                      <span className="tt-group__count"><DS.CounterBadge count={g.countLabel} tone="neutral" /></span>
                    </button>
                  </div>
                  <div className="tt-days">{days.map((d) => <div key={d.key} />)}</div>
                  <div className="tt-sum" style={{ width: sumW }}>{sumCells(groupSums(g.rows), false)}</div>
                </div>
              )}
              {(open || !g.label) && g.rows.map((r) => (
                <div key={r.id} className="tt-r tt-row" role="row">
                  <div className="tt-left" style={{ width: leftW }}>
                    <div className="tt-person" style={g.label ? null : { paddingLeft: 'var(--space-3)' }}>
                      <span className="tt-person__name">{r.name}</span>
                      <span className="tt-person__id">таб. № {r.id}</span>
                    </div>
                    <div className="tt-person__role">{r.role}</div>
                  </div>
                  <div className="tt-days">
                    {r.cells.map((c, i) => <DayCell key={i} c={c} row={r} day={days[i]} metric={metric} />)}
                  </div>
                  <div className="tt-sum" style={{ width: sumW }}>{sumCells(rowSums(r), true)}</div>
                </div>
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
