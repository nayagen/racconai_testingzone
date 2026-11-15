/* Экран 2 «Очередь исключений» — handoff/screens/Exceptions.dc.html. Регистрируется как window.TabelScreens.Exceptions.
   Моковые данные — из <script data-dc-script> макета (renderVals).
   Упрощено относительно макета: у каждой строки одно действие («Принять» предложение системы или «Разобрать» в карточке дня),
   ручное решение (время, код, причина) принимается только в карточке дня, фильтры по роли и типу — в двух списках вместо боковой панели. */
(() => {
const { useState, useMemo } = React;
const DS = window.RaccoonDS;
const { SelectControl, SectionTabs } = window.TabelUI;

// ---------- моковые данные из макета ----------
// тип: [название, кол-во, пометка?, описание, кто разбирает, выключено?]
// исключение: [имя, роль, дата, тип, теги, предложение, пометка?]; тег: 'подпись|значение|plain|warn|ok'
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
      ['Отметил водитель', '0', true, 'Грузчика отметил водитель за всю бригаду, сам сотрудник не отмечался.', 'Начальник колонны'],
      ['Подмена', '0', false, 'Смену на машине начал не тот водитель, который на неё назначен.', 'Начальник колонны']
    ],
    items: [
      ['Жумабаев Нурсултан', 'Грузчик', '1 Окт 2026, чт', 'Нет подтверждения машиной', ['Машина маршрута №9|не заезжала на эту точку|warn', 'Пришёл|06:55', 'Место отметки|ул. Сатпаева 30'], ''],
      ['Ахметов Бауыржан', 'Водитель', '7 Окт 2026, ср', 'Вне геозоны', ['Отметка|в 3,8 км от депо|warn', 'Пришёл|05:31', 'Выезд на линию|вовремя, 06:04|ok'], '']
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
  }
];

const ROLES = [['all', 'Все роли'], ['Водитель', 'Водители'], ['Грузчик', 'Грузчики']];
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
    hasSug: r[5] !== '', block: !r[6], soft: !!r[6],
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

const TYPE_DESC = Object.fromEntries(TYPES.flat().map((t) => [t.label, t.desc]));

// ---------- строка очереди ----------
function ExceptionRow({ it, href, onAccept }) {
  return (
    <li className="ex-row">
      <div className="ex-row__main">
        <div className="ex-row__who">
          <a href={href} className="ex-row__name">{it.name}</a>
          <span className="ex-caption">{it.role} · {it.date}</span>
        </div>
        <div className="ex-row__what">
          <span className="ex-tag" title={TYPE_DESC[it.type]}>{it.type}</span>
          {it.soft && <span className="ex-caption">не блокирует закрытие</span>}
        </div>
        {it.hasSug && <p className="ex-row__sug"><span className="ex-row__sug-lbl">Система предлагает:</span> {it.sug}</p>}
      </div>
      <div className="ex-row__actions">
        {it.hasSug ? <>
          <a href={href} className="rc-btn rc-btn--tertiary rc-btn--default ex-link">Открыть день</a>
          <DS.Button variant="secondary" icon="check" onClick={onAccept}>Принять</DS.Button>
        </> : <a href={href} className="rc-btn rc-btn--secondary rc-btn--default ex-link">Разобрать</a>}
      </div>
    </li>
  );
}

// ---------- экран ----------
function ExceptionsScreen({ data, flagCount }) {
  const [collapsed, setCollapsed] = useState({});
  const [sort, setSort] = useState('block');
  const [accepted, setAccepted] = useState({});
  const [last, setLast] = useState(null); // { keys, text }
  const [role, setRole] = useState('all');
  const [type, setType] = useState('all');

  // Ссылка на карточку дня сотрудника, если он есть в табеле.
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
  const sugKeys = visible.filter((it) => it.hasSug).map((it) => it.key);

  const roleOptions = ROLES.map(([v, l]) => ({ value: v, label: l + ' · ' + (roleCount[v] || 0) }));
  const typeOptions = [{ value: 'all', label: 'Все типы · ' + byRole.length }].concat(
    TYPES.flat().filter((t) => typeCount[t.label] || type === t.label).map((t) => ({ value: t.label, label: t.label + ' · ' + (typeCount[t.label] || 0) })));

  const close = (keys, text) => {
    if (!keys.length) return;
    const a = { ...accepted };
    keys.forEach((k) => { a[k] = true; });
    setAccepted(a); setLast({ keys, text });
  };
  const acceptKeys = (keys) => close(keys, keys.length === 1
    ? 'Предложение системы принято, исключение закрыто'
    : 'Принято ' + nSug(keys.length) + ' системы, исключения закрыты');
  const undoLast = () => {
    const a = { ...accepted };
    last.keys.forEach((k) => { delete a[k]; });
    setAccepted(a); setLast(null);
  };

  let listGroups;
  if (sort === 'person') {
    const byName = {};
    visible.forEach((it) => { (byName[it.name] = byName[it.name] || []).push(it); });
    listGroups = Object.keys(byName).sort((a, b) => a.localeCompare(b, 'ru')).map((n) => {
      const its = byName[n].slice().sort((a, b) => a.day - b.day);
      return { key: 'p:' + n, title: n, hint: its[0].role, items: its };
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
        <div className={'ex-summary' + (nBlock === 0 ? ' is-ready' : '')}>
          <div className="ex-summary__text">
            {nBlock > 0 ? <>
              <span className="ex-summary__title">Чтобы закрыть месяц, осталось разобрать {nBlock}</span>
              <span className="ex-caption">Пометки ({open.length - nBlock}) закрытию не мешают. Начните с предложений системы: их можно принять одним нажатием.</span>
            </> : <>
              <span className="ex-summary__title">Блокирующих исключений нет, месяц можно закрыть</span>
              <a href="#/" className="ex-summary__link">Вернуться к табелю</a>
            </>}
          </div>
          {sugKeys.length > 0 && (
            <DS.Button variant="primary" icon="check" onClick={() => acceptKeys(sugKeys)}>Принять все предложения · {sugKeys.length}</DS.Button>
          )}
        </div>

        <div className="ex-toolbar">
          <SelectControl className="ex-select" label={<span className="sr-only">Роль</span>} value={role} onChange={setRole} options={roleOptions} />
          <SelectControl className="ex-select ex-select--wide" label={<span className="sr-only">Тип исключения</span>} value={type} onChange={setType} options={typeOptions} />
          <SelectControl className="ex-select ex-select--wide ex-sort" label={<span className="sr-only">Сортировка</span>} value={sort} onChange={setSort} options={SORTS} />
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
            <section key={g.key} className="ex-group" aria-label={g.title}>
              <button type="button" className="ex-group__btn" aria-expanded={isOpen} onClick={() => setCollapsed({ ...collapsed, [g.key]: !collapsed[g.key] })}>
                <DS.Icon name={isOpen ? 'chevron-down' : 'chevron-right'} size={20} color="var(--icons-default)" />
                <h2 className="ex-group__title">{g.title}</h2>
                <span className="ex-group__count">{g.items.length}</span>
                <span className="ex-caption">{g.hint}</span>
              </button>
              {isOpen && (
                <ul className="ex-rows">
                  {g.items.map((it) => (
                    <ExceptionRow key={it.key} it={it} href={dayHref(it)} onAccept={() => acceptKeys([it.key])} />
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </div>
    </>
  );
}

window.TabelScreens = window.TabelScreens || {};
window.TabelScreens.Exceptions = ExceptionsScreen;
})();
