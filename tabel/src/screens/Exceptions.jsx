/* Экран 2 «Очередь исключений» — handoff/screens/Exceptions.dc.html. Регистрируется как window.TabelScreens.Exceptions.
   Моковые данные и логика — из <script data-dc-script> макета (renderVals). */
(() => {
const { useState, useMemo } = React;
const DS = window.RaccoonDS;
const { CheckToggle, SelectControl, SectionTabs } = window.TabelUI;

// ---------- моковые данные из макета ----------
// тип: [название, кол-во, пометка?, описание, кто разбирает, выключено?]
// исключение: [имя, роль, дата, тип, теги, предложение, пометка?, цитата?]; тег: 'подпись|значение|plain|warn|ok'
const CATEGORIES = [
  {
    title: 'Нет данных', hint: 'отметки не хватает — система ищет опорное событие',
    types: [
      ['Нет «Пришёл»', '1', false, 'За день есть события (уход, выезд машины, задачи маршрута), но отметки прихода нет. Система предлагает время прихода по опорному событию.', 'HR'],
      ['Нет «Ушёл»', '2', false, 'Приход отмечен, ухода нет, и прошло время автозакрытия смены. Система предлагает время ухода по последнему событию дня: закрытию маршрута или отъезду машины.', 'HR'],
      ['Неявка?', '1', false, 'Сотрудник стоит в графике, но за день нет ни одного события: ни отметок, ни работы его машины. Нужно подтвердить неявку или поставить код дня.', 'Начальник колонны']
    ],
    items: [
      ['Исаев Тимур', 'Грузчик', '2 Окт 2026, пт', 'Нет «Ушёл»', ['Напоминание об уходе|без ответа|warn', 'Машина уехала с последней точки|17:02', 'Маршрут|№7'], 'Ушёл 17:02 — отъезд машины с последней точки'],
      ['Сериков Данияр', 'Водитель', '2 Окт 2026, пт', 'Нет «Пришёл»', ['Выезд на линию|план 06:00, факт 06:12', 'Ушёл|17:56, в депо|ok'], 'Пришёл 05:42 — оценка: факт выхода − норматив 30 мин'],
      ['Касымов Арман', 'Грузчик', '5 Окт 2026, пн', 'Нет «Ушёл»', ['Напоминание об уходе|без ответа|warn', 'Пришёл|06:48|ok', 'Последняя точка маршрута закрыта|16:38', 'Маршрут|№12'], 'Ушёл 16:38 — закрыта последняя задача маршрута'],
      ['Исаев Тимур', 'Грузчик', '14 Окт 2026, ср', 'Неявка?', ['За день|ни одной отметки|warn', 'По графику|в бригаде маршрута №7', 'Водитель|бригаду не отметил'], '']
    ]
  },
  {
    title: 'Сомнительные', hint: 'данные есть, но не сходятся с другими источниками',
    types: [
      ['Вне геозоны', '1', false, 'Отметка сделана дальше допустимого радиуса от депо или от точки начала работы.', 'HR'],
      ['Нет подтверждения машиной', '1', false, 'Сотрудник отметился на точке, но по GPS машина его бригады туда не заезжала.', 'Начальник колонны'],
      ['Расхождение с событиями', '0', false, 'Время отметки расходится с событиями дня (выездом машины, задачами маршрута) больше допуска.', 'HR'],
      ['Резервный канал', '1', true, 'Отметка пришла сообщением в бот без фото с камеры и геолокации, например когда приложение не работало.', 'HR'],
      ['Отметил водитель', '0', true, 'Грузчика отметил водитель за всю бригаду, сам сотрудник не отмечался.', 'Начальник колонны'],
      ['Подмена', '0', false, 'Смену на машине начал не тот водитель, который на неё назначен.', 'Начальник колонны']
    ],
    items: [
      ['Жумабаев Нурсултан', 'Грузчик', '1 Окт 2026, чт', 'Нет подтверждения машиной', ['Машина маршрута №9|не заезжала на эту точку|warn', 'Пришёл|06:55', 'Место отметки|ул. Сатпаева 30'], ''],
      ['Ахметов Бауыржан', 'Водитель', '7 Окт 2026, ср', 'Вне геозоны', ['Отметка|в 3,8 км от депо|warn', 'Пришёл|05:31', 'Выезд на линию|вовремя, 06:04|ok'], ''],
      ['Нурланов Ерлан', 'Водитель', '12 Окт 2026, пн', 'Резервный канал', ['Геолокация|не передана|warn', 'Фото|из галереи, не с камеры|warn', 'Выезд на линию|вовремя, 06:01|ok'], 'Принять как есть', true]
    ]
  },
  {
    title: 'По правилам', hint: 'данные верные, нужно решение по правилам компании',
    types: [
      ['Переработка', '1', false, 'Отработано больше нормы смены сверх порога из правил компании. Нужно решить, засчитывать ли сверхурочные.', 'HR'],
      ['Ожидание машины', '1', true, 'Сотрудник пришёл на точку вовремя, но ждал машину дольше порога. Нужно решить, засчитывать ли ожидание как рабочее время.', 'HR'],
      ['Ранний уход', '0', false, 'Сотрудник ушёл раньше, чем бригада закончила работу. Сейчас эта проверка выключена в настройках.', 'Начальник колонны', true],
      ['Опоздание выхода на линию', '1', true, 'Машина выехала на линию позже плана больше порога. Нужно выяснить, по чьей вине задержка.', 'Начальник колонны']
    ],
    items: [
      ['Ким Виктор', 'Водитель', '9 Окт 2026, пт', 'Переработка', ['Отработано|13,6 ч при норме 12 ч|warn', 'Причина|очередь на полигоне', 'Смена закончилась|18:40'], ''],
      ['Ким Виктор', 'Водитель', '21 Окт 2026, ср', 'Опоздание выхода на линию', ['Выезд 2-й смены|план 13:00, факт 13:47|warn', 'Водитель пришёл|вовремя, 05:48|ok', 'Задержка|в депо, не по вине водителя', 'Выезд 1-й смены|вовремя|ok', 'Между сменами|не уходил'], '', true],
      ['Касымов Арман', 'Грузчик', '13 Окт 2026, вт', 'Ожидание машины', ['Ждал машину|85 мин|warn', 'Пришёл на точку|06:20|ok', 'Машина приехала|07:45'], 'Засчитать ожидание по правилу компании', true]
    ]
  },
  {
    title: 'Спор сотрудника', hint: 'сотрудник не согласен с днём в табеле',
    types: [
      ['Спор', '1', false, 'Сотрудник не согласен с днём в табеле и написал об этом в боте. Нужно проверить данные и ответить ему.', 'HR']
    ],
    items: [
      ['Абдрахманов Марат', 'Грузчик', '7 Окт 2026, ср', 'Спор', ['Машина его маршрута №4|работала 07:10–16:55|ok', 'Сейчас в табеле|НН — неявка', 'По графику|в бригаде маршрута №4'], '', false, 'Я был на маршруте №4 весь день, телефон сел. Водитель Сериков может подтвердить.']
    ]
  }
];

const REASONS = ['Сотрудник забыл отметиться', 'Подтвердил начальник колонны', 'Подтверждено GPS машины', 'Сбой связи или телефона', 'Ошибка в графике или маршруте', 'Отметил водитель за бригаду', 'Другое'];
const DAY_CODES_TIME = [
  { value: 'Я', label: 'Я — явка' }, { value: 'НН', label: 'НН — неявка' },
  { value: 'Б', label: 'Б — больничный' }, { value: 'ОТ', label: 'ОТ — отпуск' }
];
const DAY_CODES_RADIO = ['НН — неявка', 'Б — больничный', 'ОТ — отпуск', 'ОД — с разрешения', 'Я — был, ввести время'];
const ROLES = [['all', 'Все'], ['Водитель', 'Водители'], ['Грузчик', 'Грузчики']];
const SORTS = [{ value: 'block', label: 'Блокирующие, сначала старые' }, { value: 'person', label: 'По сотруднику' }];
const MON = { 'Янв': 1, 'Фев': 2, 'Мар': 3, 'Апр': 4, 'Май': 5, 'Июн': 6, 'Июл': 7, 'Авг': 8, 'Сен': 9, 'Окт': 10, 'Ноя': 11, 'Дек': 12 };

// Все типы и исключения с постоянными ключами «категория-индекс», как в макете.
const TYPES = CATEGORIES.map((c, gi) => c.types.map((t, ti) => ({
  id: 'ex-tt-' + gi + '-' + ti, cat: gi, label: t[0], soft: !!t[2], desc: t[3], off: !!t[5],
  sub: t[5] ? 'выключено' : (t[2] ? 'пометка' : ''),
  meta: (t[5] ? 'Проверка выключена' : (t[2] ? 'Пометка, не блокирует закрытие' : 'Блокирует закрытие месяца')) + ' · разбирает ' + t[4]
})));
const ITEMS = CATEGORIES.flatMap((c, gi) => c.items.map((r, ii) => {
  const [d, mon, y] = r[2].replace(',', '').split(' ');
  return {
    key: gi + '-' + ii, cat: gi, name: r[0], role: r[1], date: r[2], type: r[3], sug: r[5],
    hasSug: r[5] !== '', block: !r[6], soft: !!r[6], isDispute: !!r[7], quote: r[7] || '',
    isCode: r[3].indexOf('Неявка') === 0, day: parseInt(r[2], 10),
    iso: y + '-' + String(MON[mon]).padStart(2, '0') + '-' + String(d).padStart(2, '0')
  };
}));

function plural(n, one, few, many) {
  const m10 = n % 10, m100 = n % 100;
  return m10 === 1 && m100 !== 11 ? one : (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14) ? few : many);
}
const nExc = (n) => n + ' ' + plural(n, 'исключение', 'исключения', 'исключений');
const nSug = (n) => n + ' ' + plural(n, 'предложение', 'предложения', 'предложений');

// ---------- мелкие части ----------
function Chip({ on, onClick, children }) {
  return (
    <button type="button" role="radio" aria-checked={on} className={'ex-chip' + (on ? ' is-on' : '')} onClick={onClick}>{children}</button>
  );
}

function TypeFilter({ types, counts, total, value, onChange }) {
  return (
    <aside aria-label="Типы исключений" className="ex-types">
      <button type="button" className={'ex-type-all' + (value === 'all' ? ' is-on' : '')} aria-pressed={value === 'all'} onClick={() => onChange('all')}>
        Все<span>{total}</span>
      </button>
      <div className="ex-types__grid">
        {CATEGORIES.map((c, gi) => (
          <div key={gi} className="ex-types__group">
            <div className="ex-types__title">{c.title}</div>
            {TYPES[gi].map((t) => {
              const n = counts[t.label] || 0;
              const on = value === t.label;
              return (
                <div key={t.id} className="ex-tt">
                  <button type="button" className={'ex-type' + (n === 0 ? ' is-zero' : '') + (on ? ' is-on' : '')} aria-describedby={t.id} aria-pressed={on}
                    onClick={() => onChange(on ? 'all' : t.label)}>
                    <span className="ex-type__label">{t.label}{t.sub && <span className="ex-type__sub">{t.sub}</span>}</span>
                    <span>{n}</span>
                  </button>
                  <span role="tooltip" id={t.id} className="ex-tt__pop">
                    <span className="ex-tt__title">{t.label}</span><span>{t.desc}</span><span className="ex-tt__meta">{t.meta}</span>
                  </span>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </aside>
  );
}

function EditPanel({ it, reason, setReason, onSave, onCancel }) {
  return (
    <div className="ex-edit">
      {it.isCode ? (
        <fieldset className="ex-codes">
          <legend>Код дня</legend>
          {DAY_CODES_RADIO.map((l, i) => (
            <div key={l} className="ex-codes__opt"><DS.Radio name={'code-' + it.key} checked={i === 0} label={l} /></div>
          ))}
        </fieldset>
      ) : (
        <div className="ex-edit__time">
          <DS.Field className="ex-edit__field" layout="vertical" label="Пришёл" placeholder="--:--" iconLeft="time" />
          <DS.Field className="ex-edit__field" layout="vertical" label="Ушёл" placeholder="--:--" iconLeft="time" />
          <SelectControl className="ex-edit__code" label="Код дня" value="Я" options={DAY_CODES_TIME} />
        </div>
      )}
      <div role="radiogroup" aria-label="Причина" className="ex-reasons">
        <span className="ex-caption">Причина <span className="ex-req">*</span></span>
        <div className="ex-chips">
          {REASONS.map((l) => <Chip key={l} on={reason === l} onClick={() => setReason(reason === l ? '' : l)}>{l}</Chip>)}
        </div>
        {reason === 'Другое' && <textarea rows="2" aria-label="Своя причина" placeholder="Опишите причину" className="ex-textarea" />}
      </div>
      <div className="ex-edit__foot">
        <DS.Button variant="primary" disabled={!reason} onClick={onSave}>Сохранить и закрыть исключение</DS.Button>
        <DS.Button variant="tertiary" onClick={onCancel}>Отмена</DS.Button>
        <span className="ex-caption">Сотрудник получит уведомление в боте</span>
      </div>
    </div>
  );
}

function ExceptionCard({ it, href, checked, editing, reason, onToggleCheck, onAccept, onToggleEdit, setReason, onSave }) {
  const onClick = (e) => {
    if (e.target.closest && e.target.closest('button, a, input, select, textarea, label, .ex-actions, .ex-edit')) return;
    onToggleCheck();
  };
  return (
    <article className={'ex-card' + (checked ? ' is-checked' : '')} onClick={onClick}>
      <div className="ex-card__row">
        <div className="ex-card__check" data-cb-label={`Выбрать исключение: ${it.name}, ${it.date}`}><DS.Checkbox key={checked ? 'on' : 'off'} checked={checked} /></div>
        <div className="ex-card__main">
          <div className="ex-card__body">
            <div className="ex-card__head">
              <div className="ex-card__who">
                <span className="ex-card__name">{it.name}</span>
                <span className="ex-caption">{it.role} · {it.date}</span>
              </div>
              <div className="ex-card__tags">
                <span className="ex-tag">{it.type}</span>
                {it.block && <span className="ex-tag ex-tag--block">Блокирует закрытие</span>}
                {it.soft && <span className="ex-tag ex-tag--soft">Пометка</span>}
              </div>
            </div>
            {it.isDispute && (
              <div className="ex-quote">
                <span className="ex-caption">Сообщение сотрудника в боте · 15 Окт 2026 19:12</span>
                <span>«{it.quote}»</span>
              </div>
            )}
            {it.hasSug && (
              <div className="ex-sug">
                <DS.Icon name="info" size={20} color="var(--icons-information)" />
                <span className="ex-sug__text"><span className="ex-sug__lbl">Предложение системы:</span> {it.sug}</span>
              </div>
            )}
          </div>
          <div className="ex-actions">
            {it.hasSug && <DS.Button variant="primary" fullWidth onClick={onAccept}>Применить предложение</DS.Button>}
            {it.isDispute && <DS.Button variant="primary" fullWidth onClick={() => { window.location.hash = href; }}>Ответить сотруднику</DS.Button>}
            <DS.Button variant="secondary" fullWidth onClick={onToggleEdit}>{it.isCode ? 'Поставить код' : 'Исправить'}</DS.Button>
            <a href={href} className="rc-btn rc-btn--tertiary rc-btn--default rc-btn--full ex-open">Открыть день</a>
          </div>
        </div>
      </div>
      {editing && <EditPanel it={it} reason={reason} setReason={setReason} onSave={onSave} onCancel={onToggleEdit} />}
    </article>
  );
}

// ---------- экран ----------
function ExceptionsScreen({ data, flagCount }) {
  const [editKey, setEditKey] = useState('');
  const [reasonSel, setReasonSel] = useState({});
  const [collapsed, setCollapsed] = useState({});
  const [checkedMap, setCheckedMap] = useState({});
  const [sort, setSort] = useState('block');
  const [accepted, setAccepted] = useState({});
  const [last, setLast] = useState(null); // { keys, text }
  const [role, setRole] = useState('all');
  const [type, setType] = useState('all');

  // Ссылка «Открыть день»: карточка дня сотрудника, если он есть в табеле.
  const ids = useMemo(() => Object.fromEntries(data.rows.map((r) => [r.name, r.id])), [data.rows]);
  const dayHref = (it) => (ids[it.name] && it.iso.slice(0, 7) === '2026-10') ? '#/day/' + ids[it.name] + '/' + it.iso : '#/day';

  const open = ITEMS.filter((it) => !accepted[it.key]);
  const byRole = role === 'all' ? open : open.filter((it) => it.role === role);
  const visible = type === 'all' ? byRole : byRole.filter((it) => it.type === type);

  const roleCount = { all: open.length };
  open.forEach((it) => { roleCount[it.role] = (roleCount[it.role] || 0) + 1; });
  const typeCount = {};
  byRole.forEach((it) => { typeCount[it.type] = (typeCount[it.type] || 0) + 1; });

  const nBlock = open.filter((it) => it.block).length;
  const nSoft = open.length - nBlock;
  const nSugAll = open.filter((it) => it.hasSug).length;

  const allKeys = visible.map((it) => it.key);
  const checkedCount = allKeys.filter((k) => checkedMap[k]).length;
  const selSug = visible.filter((it) => it.hasSug && checkedMap[it.key]).map((it) => it.key);
  const allChecked = allKeys.length > 0 && checkedCount === allKeys.length;

  const close = (keys, text) => {
    if (!keys.length) return;
    const a = { ...accepted }, m = { ...checkedMap };
    keys.forEach((k) => { a[k] = true; delete m[k]; });
    setAccepted(a); setCheckedMap(m); setLast({ keys, text });
    if (keys.includes(editKey)) setEditKey('');
  };
  const acceptKeys = (keys) => close(keys, 'Принято ' + nSug(keys.length) + ' системы, исключения закрыты');
  const undoLast = () => {
    const a = { ...accepted };
    last.keys.forEach((k) => { delete a[k]; });
    setAccepted(a); setLast(null);
  };
  const toggleAll = () => setCheckedMap(allChecked ? {} : Object.fromEntries(allKeys.map((k) => [k, true])));

  let listGroups;
  if (sort === 'person') {
    const byName = {};
    visible.forEach((it) => { (byName[it.name] = byName[it.name] || []).push(it); });
    listGroups = Object.keys(byName).sort((a, b) => a.localeCompare(b, 'ru')).map((n) => {
      const its = byName[n].slice().sort((a, b) => a.day - b.day);
      const nb = its.filter((it) => it.block).length;
      return { key: 'p:' + n, title: n, hint: its[0].role + ' · ' + nExc(its.length) + (nb ? ', блокирующих ' + nb : ''), items: its };
    });
  } else {
    listGroups = CATEGORIES.map((c, gi) => ({
      key: 'c:' + gi, title: c.title, hint: c.hint,
      items: visible.filter((it) => it.cat === gi).sort((a, b) => (b.block - a.block) || (a.day - b.day))
    })).filter((g) => g.items.length > 0);
  }

  return (
    <>
      <SectionTabs active="exceptions" flagCount={flagCount}>
        <span className="ex-context">Окт 2026 · Депо №1</span>
      </SectionTabs>

      <div className="ex">
        <div className="ex-banner">
          <span className="ex-banner__title">{nBlock} {plural(nBlock, 'блокирует', 'блокируют', 'блокируют')} закрытие месяца</span>
          <span>· {nSoft} {plural(nSoft, 'пометка', 'пометки', 'пометок')}, не {plural(nSoft, 'блокирует', 'блокируют', 'блокируют')} · {nSugAll} можно принять по предложению системы</span>
        </div>

        <div className="ex-layout">
          <TypeFilter counts={typeCount} total={byRole.length} value={type} onChange={(v) => { setType(v); }} />

          <section aria-label="Список исключений" className="ex-list">
            <div className="ex-toolbar">
              <div className="ex-toolbar__group">
                <CheckToggle className="ex-all" checked={allChecked} onChange={toggleAll}
                  label={<>Выбрать все{checkedCount > 0 && <span className="ex-all__count">Выбрано {checkedCount} из {allKeys.length}</span>}</>} />
                <DS.Button variant="primary" disabled={selSug.length === 0} onClick={() => acceptKeys(selSug)}>Принять предложения ({selSug.length})</DS.Button>
              </div>
              <div className="ex-toolbar__group ex-toolbar__group--right">
                <div role="radiogroup" aria-labelledby="ex-role-lbl" className="ex-roles">
                  <span id="ex-role-lbl" className="ex-muted">Роль</span>
                  {ROLES.map(([v, l]) => (
                    <Chip key={v} on={role === v} onClick={() => setRole(v)}>
                      {l} {role === v ? (roleCount[v] || 0) : <span className="ex-muted">{roleCount[v] || 0}</span>}
                    </Chip>
                  ))}
                </div>
                <SelectControl className="ex-sort" label="Сортировка" value={sort} onChange={setSort} options={SORTS} />
              </div>
            </div>

            {last && (
              <div role="status" className="ex-done">
                <DS.Icon name="check" size={20} color="currentColor" />
                <span className="ex-done__text">{last.text}</span>
                <DS.Button variant="tertiary" size="small" onClick={undoLast}>Отменить</DS.Button>
              </div>
            )}

            {listGroups.length === 0 && (
              <div className="ex-empty">
                <DS.EmptyState icon="check" title="Исключений нет" text={type === 'all' && role === 'all' ? 'Все исключения разобраны.' : 'По выбранным фильтрам исключений нет.'} action={null} />
              </div>
            )}

            {listGroups.map((g) => {
              const isOpen = !collapsed[g.key];
              return (
                <div key={g.key} className="ex-group">
                  <button type="button" className="ex-group__btn" aria-expanded={isOpen} onClick={() => setCollapsed({ ...collapsed, [g.key]: !collapsed[g.key] })}>
                    <DS.Icon name={isOpen ? 'chevron-down' : 'chevron-right'} size={20} color="var(--icons-default)" />
                    <h2 className="ex-group__title">{g.title}</h2>
                    <span className="ex-caption">{g.hint}</span>
                  </button>
                  {isOpen && g.items.map((it) => (
                    <ExceptionCard key={it.key} it={it} href={dayHref(it)}
                      checked={!!checkedMap[it.key]} editing={editKey === it.key} reason={reasonSel[it.key] || ''}
                      onToggleCheck={() => setCheckedMap({ ...checkedMap, [it.key]: !checkedMap[it.key] })}
                      onAccept={() => acceptKeys([it.key])}
                      onToggleEdit={() => setEditKey(editKey === it.key ? '' : it.key)}
                      setReason={(r) => setReasonSel({ ...reasonSel, [it.key]: r })}
                      onSave={() => close([it.key], 'Исключение закрыто: ' + it.name + ', ' + it.date.split(',')[0] + '. Сотрудник получит уведомление в боте')} />
                  ))}
                </div>
              );
            })}
          </section>
        </div>
      </div>
    </>
  );
}

window.TabelScreens = window.TabelScreens || {};
window.TabelScreens.Exceptions = ExceptionsScreen;
})();
