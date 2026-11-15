/* Экраны 5–6 «Настройки» — handoff/screens/SettingsRules.dc.html и SettingsExceptions.dc.html.
   Регистрируются как window.TabelScreens.SettingsRules (#/settings) и window.TabelScreens.SettingsExceptions (#/settings/exceptions).
   Общее: шапка с «Отменить / Сохранить», переключатель разделов настроек, раскладка «основная колонка + правая панель».
   Все значения — моки из макетов. Черновик правится локально; «Сохранить» фиксирует его, «Отменить» откатывает к сохранённому. */
(() => {
const { useState, useMemo, useEffect, useRef } = React;
const DS = window.RaccoonDS;
const { CheckToggle, SectionTabs, NAV_USER } = window.TabelUI;

// ---------- общие куски ----------
const SETTINGS_TABS = [
  { route: 'settings', label: 'Правила и пороги' },
  { route: 'settings/exceptions', label: 'Типы исключений' }
];

const plural = (n, one, few, many) => {
  const a = Math.abs(n) % 100, b = a % 10;
  if (a > 10 && a < 20) return many;
  if (b > 1 && b < 5) return few;
  return b === 1 ? one : many;
};
const today = () => new Date().toLocaleDateString('ru-RU');

// Черновик + сохранённая версия. formKey пересоздаёт неуправляемые поля DS (Field, Radio) после отката.
function useDraft(initial) {
  const [saved, setSaved] = useState(initial);
  const [draft, setDraft] = useState(initial);
  const [formKey, setFormKey] = useState(0);
  const [flash, setFlash] = useState(false);
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);
  const dirty = JSON.stringify(saved) !== JSON.stringify(draft);
  return {
    saved, draft, setDraft, formKey, dirty, flash,
    remount: () => setFormKey((k) => k + 1),
    cancel: () => { setDraft(saved); setFormKey((k) => k + 1); },
    save: (onSave) => {
      if (!dirty) return;
      if (onSave) onSave(saved, draft);
      setSaved(draft);
      setFlash(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setFlash(false), 2500);
    }
  };
}

// Шапка раздела + переключатель «Правила и пороги / Типы исключений» + две колонки.
function SettingsFrame({ tab, flagCount, form, onSave, aside, children }) {
  return (
    <>
      <SectionTabs active="settings" flagCount={flagCount}>
        <span role="status" className="st-status">{form.flash ? 'Изменения сохранены' : ''}</span>
        <DS.Button variant="tertiary" onClick={form.cancel}>Отменить</DS.Button>
        <DS.Button variant="primary" onClick={() => form.save(onSave)}>Сохранить</DS.Button>
      </SectionTabs>
      <div className="st-wrap">
        <nav aria-label="Разделы настроек" className="st-seg">
          <div role="tablist" className="rc-seg">
            {SETTINGS_TABS.map((t) => (
              <a key={t.route} href={'#/' + t.route} role="tab" aria-selected={tab === t.route} aria-current={tab === t.route ? 'page' : undefined}
                className={'rc-seg__item' + (tab === t.route ? ' is-selected' : '')}>{t.label}</a>
            ))}
          </div>
        </nav>
        <div className="st-cols">
          <div className="st-main">{children}</div>
          <aside className="st-aside">{aside}</aside>
        </div>
      </div>
    </>
  );
}

function Card({ label, title, sub, className, children }) {
  return (
    <section aria-label={label || title} className={'st-card' + (className ? ' ' + className : '')}>
      {sub ? (
        <div className="st-card__head">
          <h2 className="st-card__title">{title}</h2>
          <span className="st-card__sub">{sub}</span>
        </div>
      ) : <h2 className="st-card__title">{title}</h2>}
      {children}
    </section>
  );
}

// Выпадающий список в стиле макета: подпись сверху (или слева при inline), нативный select, шеврон DS.
function Select({ label, value, onChange, options, inline, className, ariaLabel }) {
  const control = (
    <span className="ctl__wrap st-select__wrap">
      <select className="ctl__select st-select__el" value={value} aria-label={ariaLabel} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <span className="ctl__icon ctl__icon--right" aria-hidden="true"><DS.Icon name="chevron-down" size={20} color="var(--icons-secondary)" /></span>
    </span>
  );
  if (!label) return control;
  return <label className={'st-select' + (inline ? ' st-select--inline' : '') + (className ? ' ' + className : '')}>{label}{control}</label>;
}

// Switch из DS неуправляемый: как CheckToggle — клик ловит кнопка, key пересоздаёт переключатель.
function SwitchToggle({ on, onChange, label, ariaLabel }) {
  return (
    <button type="button" className="cb st-switch" aria-pressed={on} aria-label={ariaLabel} onClick={() => onChange(!on)}>
      <DS.Switch key={on ? 'on' : 'off'} on={on} label={label} />
    </button>
  );
}

// Чекбокс без подписи (в ячейке таблицы): доступное имя — через aria-label.
function BareCheck({ checked, onChange, ariaLabel }) {
  return (
    <button type="button" className="cb" aria-pressed={checked} aria-label={ariaLabel} onClick={() => onChange(!checked)}>
      <DS.Checkbox key={checked ? 'on' : 'off'} checked={checked} />
    </button>
  );
}

// Группа радио: Radio из DS неуправляемый, выбор ловим всплывающим change на fieldset (data-v у опции).
function RadioGroup({ legend, name, value, onChange, options, children }) {
  return (
    <fieldset className="st-fs" onChange={(e) => { const o = e.target.closest('[data-v]'); if (o) onChange(o.dataset.v); }}>
      <legend className="st-legend">{legend}</legend>
      {options.map((o) => (
        <div key={o.value} className="st-row" data-v={o.value}><DS.Radio name={name} checked={value === o.value} label={o.label} /></div>
      ))}
      {children}
    </fieldset>
  );
}

const Muted = ({ children }) => <span className="st-muted">{children}</span>;

// =====================================================================
// Экран 5. Правила и пороги
// =====================================================================

// Параметры: подписи и единицы — для истории изменений и счётчика переопределений.
const RULES = {
  depotR: { label: 'радиус депо', unit: 'м' },
  routeR: { label: 'радиус точки', unit: 'м' },
  leaveLast: { label: '«Ушёл» на последней точке маршрута' },
  leaveAny: { label: '«Ушёл» на любой точке маршрута' },
  leaveDepot: { label: '«Ушёл» в депо' },
  leavePolygon: { label: '«Ушёл» на полигоне' },
  outside: { label: 'отметка вне геозоны', values: { accept: 'принимать с исключением', reject: 'не давать отметиться' } },
  tol: { label: 'допуск расхождения', unit: 'мин' },
  inFact: { label: 'опора «Пришёл»: факт выхода на линию' },
  inArrive: { label: 'опора «Пришёл»: прибытие на первую точку' },
  prep: { label: 'норматив подготовки', unit: 'мин' },
  outTask: { label: 'опора «Ушёл»: закрытие последней задачи' },
  outLeave: { label: 'опора «Ушёл»: отъезд с последней точки' },
  outDepot: { label: 'опора «Ушёл»: въезд в депо' },
  lateTol: { label: 'допуск опоздания', unit: 'мин' },
  lateExc: { label: 'порог исключения за опоздание', unit: 'мин' },
  splitReason: { label: 'разделение причины опоздания' },
  gap: { label: 'промежуток между сменами', values: { ifNoLeave: 'если не было «Ушёл»', always: 'всегда', never: 'не засчитывать' } },
  gapMax: { label: 'максимальный промежуток', unit: 'мин' },
  loaderStart: { label: 'начало дня грузчика', values: { mark: 'по «Пришёл»', arrive: 'по прибытию машины', plan: 'по плану' } },
  waitCount: { label: 'ожидание машины' },
  waitMax: { label: 'порог ожидания', unit: 'мин' },
  normDriver: { label: 'норма водителя', unit: 'ч' },
  normLoader: { label: 'норма грузчика', unit: 'ч' },
  overtime: { label: 'порог переработки', unit: 'мин' },
  breakMin: { label: 'вычет перерыва', unit: 'мин' },
  noShow: { label: 'проверка неявки', unit: 'мин' },
  leaveRemind: { label: 'напоминание про «Ушёл»', unit: 'мин' },
  autoClose: { label: 'автозакрытие дня' },
  routeAt: { label: 'отправка маршрута грузчику' },
  photo: { label: 'обязательное фото' },
  cameraOnly: { label: 'фото только с камеры' },
  driverCrew: { label: 'отметка бригады водителем' }
};

const ORG_DEFAULTS = {
  depotR: '200', routeR: '300',
  leaveLast: true, leaveAny: true, leaveDepot: true, leavePolygon: false, outside: 'accept',
  tol: '30', inFact: true, inArrive: true, prep: '30', outTask: true, outLeave: true, outDepot: false,
  lateTol: '10', lateExc: '30', splitReason: true,
  gap: 'ifNoLeave', gapMax: '120', loaderStart: 'plan', waitCount: true, waitMax: '30',
  normDriver: '12', normLoader: '10', overtime: '30', breakMin: '0',
  noShow: '30', leaveRemind: '15', autoClose: '23:59', routeAt: '20:00',
  photo: true, cameraOnly: true, driverCrew: true
};

const LEVELS = [
  { value: 'd1', label: 'Депо №1' },
  { value: 'org', label: 'Организация (для всех депо)' },
  { value: 'd2', label: 'Депо №2' }
];
const levelName = (lv) => LEVELS.find((l) => l.value === lv).label;

const RULES_INITIAL = { org: ORG_DEFAULTS, over: { d1: { routeR: '400' }, d2: {} } };

const HISTORY_INITIAL = ['[ДАТА] · [HR] · радиус точки 300 → 400 м', '[ДАТА] · [HR] · включено ожидание машины'];

const fmtVal = (k, v) => {
  const m = RULES[k];
  if (typeof v === 'boolean') return v ? 'вкл.' : 'выкл.';
  if (m.values) return m.values[v];
  return v + (m.unit ? ' ' + m.unit : '');
};
function describeChange(k, a, b, where) {
  const m = RULES[k];
  const scope = where ? ' (' + where + ')' : '';
  if (typeof b === 'boolean') return (b ? 'включено ' : 'выключено ') + m.label + scope;
  if (m.unit && a != null) return m.label + ' ' + a + ' → ' + b + ' ' + m.unit + scope;
  return m.label + ': ' + (a == null ? '' : fmtVal(k, a) + ' → ') + fmtVal(k, b) + scope;
}

// Предпросмотр: грубая модель — сколько исключений дал бы прошлый месяц при таких порогах.
// При настройках из макета даёт 7, из них блокирующих 3.
function previewCount(s) {
  const n = (v) => Math.max(1, parseFloat(String(v).replace(',', '.')) || 1);
  const discrepancy = Math.round(2 * 30 / n(s.tol));
  const geo = s.outside === 'reject' ? 0 : Math.round(400 / n(s.routeR));
  const late = Math.round(2 * 30 / n(s.lateExc));
  const wait = s.waitCount ? Math.round(30 / n(s.waitMax)) : 0;
  const gap = s.gap === 'ifNoLeave' ? Math.round(120 / n(s.gapMax)) : 0;
  return { total: discrepancy + geo + late + wait + gap, blocking: discrepancy + geo };
}

// Поля экрана правил читают значения и сеттер из контекста (уровень, переопределения).
const RulesCtx = React.createContext(null);

// Числовое поле DS (неуправляемое): значение ловим всплывающим change, key пересоздаёт поле при смене уровня и откате.
function Num({ k, label, suffix, hint, iconLeft, inheritHint, className }) {
  const { values, set, over, isOrg, name, rk } = React.useContext(RulesCtx);
  const overridden = !isOrg && Object.prototype.hasOwnProperty.call(over, k);
  const h = overridden ? 'Переопределено для ' + name : (inheritHint && !isOrg ? 'наследуется от организации' : hint);
  return (
    <div className={'st-field' + (className ? ' ' + className : '')} onChange={(e) => set(k, e.target.value)}>
      <DS.Field key={rk} layout="vertical" label={label} value={values[k]} suffix={suffix} iconLeft={iconLeft}
        hint={h} state={overridden ? 'selected' : 'default'} />
    </div>
  );
}
function Check({ k, label }) {
  const { values, set } = React.useContext(RulesCtx);
  return <div className="st-row"><CheckToggle checked={!!values[k]} onChange={(v) => set(k, v)} label={label} /></div>;
}
function Sw({ k, label }) {
  const { values, set } = React.useContext(RulesCtx);
  return <div className="st-row"><SwitchToggle on={!!values[k]} onChange={(v) => set(k, v)} label={label} /></div>;
}

function SettingsRulesScreen({ flagCount }) {
  const form = useDraft(RULES_INITIAL);
  const [level, setLevel] = useState('d1');
  const [history, setHistory] = useState(HISTORY_INITIAL);
  const [preview, setPreview] = useState(() => previewCount({ ...ORG_DEFAULTS, ...RULES_INITIAL.over.d1 }));
  const [busy, setBusy] = useState(false);
  const busyTimer = useRef(null);
  useEffect(() => () => clearTimeout(busyTimer.current), []);

  const { draft } = form;
  const isOrg = level === 'org';
  const over = isOrg ? {} : draft.over[level];
  const values = { ...draft.org, ...over };
  const overCount = Object.keys(over).length;
  const name = levelName(level);

  const set = (k, v) => form.setDraft((d) => {
    if (isOrg) return { ...d, org: { ...d.org, [k]: v } };
    const o = { ...d.over[level] };
    if (v === d.org[k]) delete o[k]; else o[k] = v;
    return { ...d, over: { ...d.over, [level]: o } };
  });
  const resetOverrides = () => { form.setDraft((d) => ({ ...d, over: { ...d.over, [level]: {} } })); form.remount(); };

  const onSave = (prev, next) => {
    const lines = [];
    Object.keys(RULES).forEach((k) => {
      if (prev.org[k] !== next.org[k]) lines.push(describeChange(k, prev.org[k], next.org[k], 'организация'));
    });
    ['d1', 'd2'].forEach((lv) => {
      const a = { ...next.org, ...prev.over[lv] }, b = { ...next.org, ...next.over[lv] };
      const keys = new Set([...Object.keys(prev.over[lv]), ...Object.keys(next.over[lv])]);
      keys.forEach((k) => { if (a[k] !== b[k]) lines.push(describeChange(k, a[k], b[k], levelName(lv))); });
    });
    const stamp = today() + ' · ' + NAV_USER.name + ' · ';
    setHistory((h) => [...lines.reverse().map((l) => stamp + l), ...h]);
  };

  const recalc = () => {
    setBusy(true);
    clearTimeout(busyTimer.current);
    busyTimer.current = setTimeout(() => { setPreview(previewCount(values)); setBusy(false); }, 700);
  };

  const rk = level + form.formKey; // ключ для пересоздания неуправляемых полей и радиогрупп
  const ctx = { values, set, over, isOrg, name, rk };

  const aside = (
    <>
      <Card label="Область применения" title="Где действуют" className="st-card--scope">
        <Select label="Уровень" value={level} onChange={setLevel} options={LEVELS} />
        <span className="st-text">
          {isOrg
            ? 'Настройки организации действуют во всех депо, кроме переопределённых параметров.'
            : `${name} наследует настройки организации. Переопределено: ${overCount} ${plural(overCount, 'параметр', 'параметра', 'параметров')}.`}
        </span>
        {!isOrg && overCount > 0 && (
          <a href="#/settings" className="st-text" onClick={(e) => { e.preventDefault(); resetOverrides(); }}>Сбросить всё к настройкам организации</a>
        )}
      </Card>

      <section aria-label="Предпросмотр" className="st-card st-preview">
        <h2 className="st-card__title st-preview__title">Проверить на прошлом месяце</h2>
        <span className="st-text st-preview__text">Пересчитаем октябрь с новыми порогами и покажем, сколько было бы исключений</span>
        <div className="st-preview__rows" aria-live="polite" aria-busy={busy}>
          <div className="st-preview__row"><span>Сейчас</span><strong>10</strong></div>
          <div className="st-preview__row"><span>С новыми настройками</span><strong>{busy ? '…' : preview.total}</strong></div>
          <div className="st-preview__row"><span>из них блокирующих</span><span>{busy ? '…' : preview.blocking}</span></div>
        </div>
        <div className="st-preview__btn">
          <DS.Button variant="secondary" disabled={busy} onClick={recalc}>Пересчитать</DS.Button>
        </div>
      </section>

      <Card label="История изменений" title="История изменений" className="st-card--history">
        {history.map((h, i) => <div key={history.length - i} className="st-text">{h}</div>)}
      </Card>
    </>
  );

  return (
    <RulesCtx.Provider value={ctx}>
    <SettingsFrame tab="settings" flagCount={flagCount} form={form} onSave={onSave} aside={aside}>
      <Card title="Геозоны" sub="Где отметка считается «на месте»">
        <div className="st-grid">
          <Num k="depotR" label="Радиус депо" suffix="м" inheritHint className="st-w200" />
          <Num k="routeR" label="Радиус точки маршрута" suffix="м" className="st-w200" />
        </div>
        <fieldset className="st-fs">
          <legend className="st-legend">Где грузчик может отметить «Ушёл»</legend>
          <div className="st-inline">
            <Check k="leaveLast" label="Последняя точка маршрута" />
            <Check k="leaveAny" label="Любая точка маршрута" />
            <Check k="leaveDepot" label="Депо" />
            <Check k="leavePolygon" label="Полигон" />
          </div>
        </fieldset>
        <RadioGroup key={'out' + rk} legend="Отметка вне геозоны" name="outside" value={values.outside} onChange={(v) => set('outside', v)} options={[
          { value: 'accept', label: <>Принимать и помечать исключением <Muted>— рекомендуется: человек не уходит обратно в WhatsApp</Muted></> },
          { value: 'reject', label: 'Не давать отметиться' }
        ]} />
      </Card>

      <Card title="Сверка с событиями" sub="С чем сравнивать отметки и на что опираться в предложениях системы">
        <Num k="tol" label="Допуск расхождения" suffix="мин" hint="Меньше — больше исключений, точнее табель" className="st-max320" />
        <div className="st-grid st-grid--wide">
          <fieldset className="st-fs st-w240">
            <legend className="st-legend">Опорные события для «Пришёл»</legend>
            <Check k="inFact" label="Факт выхода на линию (shift_fact_start) — водители" />
            <Check k="inArrive" label="Прибытие машины на первую точку — грузчики" />
            <Num k="prep" label="Норматив подготовки до выхода на линию" suffix="мин"
              hint="Если отметки нет, система предложит «Пришёл» = факт выхода минус норматив, с пометкой «оценка»" className="st-max320 st-mt2" />
          </fieldset>
          <fieldset className="st-fs st-w240">
            <legend className="st-legend">Опорные события для «Ушёл»</legend>
            <Check k="outTask" label="Закрытие последней задачи" />
            <Check k="outLeave" label="Отъезд машины с последней точки" />
            <Check k="outDepot" label="Въезд машины в депо" />
          </fieldset>
        </div>
      </Card>

      <Card title="Выход на линию" sub="Опоздание = shift_fact_start − shift_plan_start, по каждой смене дня отдельно. В табель идёт худшее отклонение за день. Считается только для водителей">
        <div className="st-grid">
          <Num k="lateTol" label="Допуск опоздания" suffix="мин" hint="В пределах допуска — выход вовремя" className="st-w220" />
          <Num k="lateExc" label="Создавать исключение при опоздании свыше" suffix="мин" hint="Меньшие опоздания только считаются в табеле" className="st-w220" />
        </div>
        <Check k="splitReason" label={<>Разделять причину по отметке «Пришёл» <Muted>— если водитель пришёл вовремя, задержка помечается как «в депо», а не как опоздание водителя</Muted></>} />
      </Card>

      <Card title="Рабочий день" sub="Как считаются часы в табеле">
        <RadioGroup key={'gap' + rk} legend="Промежуток между сменами в одном дне" name="gap" value={values.gap} onChange={(v) => set('gap', v)} options={[
          { value: 'ifNoLeave', label: <>Засчитывать, если между сменами не было отметки «Ушёл» <Muted>— рекомендуется</Muted></> },
          { value: 'always', label: 'Засчитывать всегда' },
          { value: 'never', label: 'Не засчитывать' }
        ]}>
          <Num k="gapMax" label="Не засчитывать промежуток длиннее" suffix="мин" hint="Длиннее — создаётся пометка для HR" className="st-max320 st-mt2" />
        </RadioGroup>
        <RadioGroup key={'ls' + rk} legend="Начало дня грузчика" name="loaderStart" value={values.loaderStart} onChange={(v) => set('loaderStart', v)} options={[
          { value: 'mark', label: 'По отметке «Пришёл»' },
          { value: 'arrive', label: 'По прибытию машины на первую точку' },
          { value: 'plan', label: 'По плановому времени, если пришёл раньше' }
        ]} />
        <div className="st-grid st-grid--end">
          <Check k="waitCount" label="Засчитывать ожидание машины" />
          <Num k="waitMax" label="Помечать ожидание дольше" suffix="мин" className="st-w200" />
        </div>
        <div className="st-grid">
          <Num k="normDriver" label="Норма, водитель" suffix="ч" className="st-w150" />
          <Num k="normLoader" label="Норма, грузчик" suffix="ч" className="st-w150" />
          <Num k="overtime" label="Переработка сверх нормы" suffix="мин" className="st-w150" />
          <Num k="breakMin" label="Вычитать перерыв" suffix="мин" className="st-w150" />
        </div>
      </Card>

      <Card title="Напоминания и автозакрытие" sub="Чем раньше бот напомнит, тем меньше исключений дойдёт до HR">
        <div className="st-grid">
          <Num k="noShow" label="Неявка: через сколько мин после начала смены" className="st-w220" />
          <Num k="leaveRemind" label="Напомнить про «Ушёл» после последнего события" suffix="мин" className="st-w220" />
          <Num k="autoClose" label="Автозакрытие дня (черновик «Ушёл»)" iconLeft="time" className="st-w220" />
          <Num k="routeAt" label="Присылать грузчику маршрут накануне в" iconLeft="time" className="st-w220" />
        </div>
      </Card>

      <section aria-label="Отметка" className="st-card st-card--list">
        <h2 className="st-card__title st-card__title--gap">Отметка</h2>
        <Sw k="photo" label="Фото обязательно" />
        <Sw k="cameraOnly" label="Только с камеры, не из галереи" />
        <Sw k="driverCrew" label="Водитель может отмечать свою бригаду" />
      </section>

      <div className="st-note">Изменения применяются к новым дням. Закрытые периоды не пересчитываются.</div>
    </SettingsFrame>
    </RulesCtx.Provider>
  );
}

// =====================================================================
// Экран 6. Типы исключений
// =====================================================================

// [название, подсказка, проверять: 'on'|'off'|'lock', поведение: 'block'|'soft'|'lock', кто, массово: 'on'|'off'|'na', спросить в боте]
const EX_DATA = [
  ['Нет данных', [
    ['Нет «Пришёл»', 'есть события дня, нет отметки', 'on', 'block', 'HR', 'on', true],
    ['Нет «Ушёл»', 'прошло время автозакрытия', 'on', 'block', 'HR', 'on', true],
    ['Неявка?', 'в графике, нет ни одного события', 'lock', 'lock', 'Начальник колонны', 'na', true]
  ]],
  ['Сомнительные', [
    ['Вне геозоны', 'дальше радиуса депо или точки', 'on', 'block', 'HR', 'on', false],
    ['Нет подтверждения машиной', 'машина бригады не была на точке', 'on', 'block', 'Начальник колонны', 'na', false],
    ['Расхождение с событиями', 'больше допуска', 'on', 'block', 'HR', 'on', false],
    ['Отметил водитель', 'грузчик отмечен за бригаду', 'on', 'soft', 'Начальник колонны', 'on', false],
    ['Подмена', 'смену начал не назначенный водитель', 'on', 'block', 'Начальник колонны', 'na', false]
  ]],
  ['По правилам', [
    ['Переработка', 'сверх нормы и порога', 'on', 'block', 'HR', 'off', false],
    ['Ожидание машины', 'дольше порога', 'on', 'soft', 'HR', 'on', false],
    ['Ранний уход', 'ушёл до конца работы бригады', 'off', 'block', 'Начальник колонны', 'na', true],
    ['Опоздание выхода на линию', 'факт позже плана больше порога', 'on', 'soft', 'Начальник колонны', 'na', true]
  ]]
];

const EX_GROUPS = EX_DATA.map(([title, rows], gi) => ({
  title,
  rows: rows.map(([label, hint, chk, behavior, who, bulk, ask], ri) => ({
    id: gi + '-' + ri, label, hint, locked: chk === 'lock', chk, behavior, who, bulk, ask
  }))
}));

const EX_INITIAL = {
  level: 'd1',
  rows: Object.fromEntries(EX_GROUPS.flatMap((g) => g.rows).map((r) => [r.id, {
    chk: r.chk === 'on', behavior: r.behavior, who: r.who, bulk: r.bulk === 'on', ask: r.ask
  }])),
  forceClose: true,
  forceWho: 'Главный специалист HR'
};

const BEHAVIORS = [{ value: 'block', label: 'Блокирует закрытие' }, { value: 'soft', label: 'Пометка' }];
const WHO = ['HR', 'Начальник колонны', 'Диспетчер'].map((v) => ({ value: v, label: v }));
const EX_LEVELS = [{ value: 'd1', label: 'Депо №1' }, { value: 'org', label: 'Организация (для всех депо)' }];
const FORCE_WHO = ['Главный специалист HR', 'Любой HR'].map((v) => ({ value: v, label: v }));

const EX_COLS = [
  { key: 'type', title: 'Тип исключения' },
  { key: 'chk', title: 'Проверять' },
  { key: 'beh', title: 'Поведение' },
  { key: 'who', title: 'Кто разбирает' },
  { key: 'bulk', title: 'Массово принимать' },
  { key: 'ask', title: 'Спросить сотрудника в боте' }
];

function ExRow({ row, v, set }) {
  return (
    <div className="st-ex__row">
      <div className="st-ex__c st-ex__c--type">
        <span className="st-ex__label">{row.label}</span>
        <span className="st-ex__hint">{row.hint}</span>
      </div>
      <div className="st-ex__c st-ex__c--chk">
        {row.locked
          ? <span className="st-ex__always">всегда</span>
          : <BareCheck checked={v.chk} onChange={(x) => set({ chk: x })} ariaLabel={'Проверять: ' + row.label} />}
      </div>
      <div className="st-ex__c st-ex__c--beh">
        {row.locked
          ? <span className="st-ex__lock">Блокирует закрытие</span>
          : <Select ariaLabel={'Поведение: ' + row.label} value={v.behavior} onChange={(x) => set({ behavior: x })} options={BEHAVIORS} />}
      </div>
      <div className="st-ex__c st-ex__c--who">
        <Select ariaLabel={'Кто разбирает: ' + row.label} value={v.who} onChange={(x) => set({ who: x })} options={WHO} />
      </div>
      <div className="st-ex__c st-ex__c--bulk">
        {row.bulk === 'na'
          ? <span className="st-ex__na">нет предложения</span>
          : <BareCheck checked={v.bulk} onChange={(x) => set({ bulk: x })} ariaLabel={'Массово принимать предложение: ' + row.label} />}
      </div>
      <div className="st-ex__c st-ex__c--ask">
        <SwitchToggle on={v.ask} onChange={(x) => set({ ask: x })} ariaLabel={'Спросить сотрудника в боте: ' + row.label} />
      </div>
    </div>
  );
}

function SettingsExceptionsScreen({ flagCount }) {
  const form = useDraft(EX_INITIAL);
  const { draft, setDraft } = form;
  const setRow = (id) => (patch) => setDraft((d) => ({ ...d, rows: { ...d.rows, [id]: { ...d.rows[id], ...patch } } }));

  const aside = (
    <>
      <section aria-label="Закрытие месяца" className="st-card st-card--scope">
        <h2 className="st-card__title st-card__title--sm">Закрытие месяца</h2>
        <div className="st-row">
          <CheckToggle checked={draft.forceClose} onChange={(v) => setDraft((d) => ({ ...d, forceClose: v }))}
            label="Разрешить закрытие с открытыми блокирующими исключениями — с причиной" />
        </div>
        <Select label="Кто может закрыть принудительно" className="st-max320" value={draft.forceWho}
          onChange={(v) => setDraft((d) => ({ ...d, forceWho: v }))} options={FORCE_WHO} />
        <span className="st-card__sub">Такие дни остаются в табеле с пометкой и попадают в выгрузку с комментарием.</span>
      </section>
      <section aria-label="Как читать настройки" className="st-card st-card--help">
        <h2 className="st-card__title st-card__title--sm">Как это влияет на очередь</h2>
        <span><strong>Блокирует закрытие</strong> — попадает в счётчик на вкладке, месяц не закрыть без решения.</span>
        <span><strong>Пометка</strong> — день идёт в табель, исключение видно в очереди, но не мешает.</span>
        <span><strong>Спросить сотрудника</strong> — бот сначала пишет работнику. Ответил вовремя — исключение закрывается без HR.</span>
      </section>
    </>
  );

  return (
    <SettingsFrame tab="settings/exceptions" flagCount={flagCount} form={form} aside={aside}>
      <div className="st-ex__intro">
        <Select label="Уровень" inline value={draft.level} onChange={(v) => setDraft((d) => ({ ...d, level: v }))} options={EX_LEVELS} className="st-ex__level" />
        <span className="st-ex__lead">Для каждого типа задайте: проверять ли его вообще, мешает ли он закрыть месяц, кто разбирает и можно ли принимать предложение системы массово. Некоторые типы нельзя отключить — они защищают от потери оплаченных часов.</span>
      </div>
      <div className="st-ex">
        <div className="st-ex__table">
          <div className="st-ex__head">
            {EX_COLS.map((c) => <div key={c.key} className={'st-ex__c st-ex__c--' + c.key}>{c.title}</div>)}
          </div>
          {EX_GROUPS.map((g) => (
            <React.Fragment key={g.title}>
              <div className="st-ex__group">{g.title}</div>
              {g.rows.map((r) => <ExRow key={r.id} row={r} v={draft.rows[r.id]} set={setRow(r.id)} />)}
            </React.Fragment>
          ))}
        </div>
      </div>
    </SettingsFrame>
  );
}

window.TabelScreens = window.TabelScreens || {};
window.TabelScreens.SettingsRules = SettingsRulesScreen;
window.TabelScreens.SettingsExceptions = SettingsExceptionsScreen;
})();
