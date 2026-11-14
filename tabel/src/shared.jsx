/* Табель — общие компоненты и утилиты для всех экранов. Экспорт: window.TabelUI.
   Каждый файл обёрнут в IIFE: Babel исполняет скрипты в общем глобальном пространстве. */
(() => {
const { useState, useEffect, useCallback } = React;
const DS = window.RaccoonDS;

// ---------- навигация Платформы ----------
const NAV_GROUPS = [
  [{ icon: 'dashboard-icon', label: 'Дэшборд', value: 'dashboard' }, { icon: 'task', label: 'Задания', value: 'jobs' }, { icon: 'journey', label: 'Маршруты', value: 'routes' }, { icon: 'garbage-truck', label: 'Экипажи', value: 'crews' }, { icon: 'navigation', label: 'Контроль движения', value: 'gps' }],
  [{ icon: 'location', label: 'Площадки', value: 'locations' }, { icon: 'group-of-locations', label: 'Маршрутные группы', value: 'route-groups' }, { icon: 'admin-icon', label: 'Реестр контейнеров', value: 'containers' }, { icon: 'budget', label: 'Заказчики', value: 'clients' }],
  [{ icon: 'garage', label: 'Автопарк', value: 'fleet' }, { icon: 'tear-off-calendar', label: 'График смен', value: 'shifts' }],
  [{ icon: 'phone-calling', label: 'Колл-центр', value: 'call-center' }, { icon: 'analytics', label: 'Аналитика', value: 'analytics' }, { icon: 'users', label: 'Сотрудники', value: 'staff' }, { icon: 'time-card', label: 'Табель', value: 'timesheet', href: '#/' }, { icon: 'weight-station', label: 'Весовая', value: 'weighing' }]
];
const NAV_USER = { initials: 'ГС', name: 'Гульнара С.', role: 'HR-менеджер' };

// Разделы табеля. Экраны кроме «Табель» — следующие по плану (handoff/README.md, «Порядок работы»).
const SECTIONS = [
  { route: '', label: 'Табель' },
  { route: 'exceptions', label: 'Исключения', count: true, screen: 'Exceptions.dc.html', title: 'Очередь исключений' },
  { route: 'feed', label: 'Лента отметок', screen: 'Feed.dc.html', title: 'Лента отметок за сегодня' },
  { route: 'settings', label: 'Настройки', icon: 'settings', screen: 'SettingsRules.dc.html', title: 'Настройки: правила и пороги' }
];

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

// ---------- утилиты ----------
const fmt1 = (n) => n.toFixed(1).replace('.', ',');
const dash = '—';

function useHashRoute() {
  const read = () => window.location.hash.replace(/^#\/?/, '');
  const [route, setRoute] = useState(read);
  useEffect(() => {
    const on = () => setRoute(read());
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return route;
}

// Чекбокс DS неуправляемый (defaultChecked). Делаем его управляемым: клик ловит кнопка, key пересоздаёт чекбокс.
function CheckToggle({ checked, onChange, label, className }) {
  return (
    <button type="button" className={'cb' + (className ? ' ' + className : '')} aria-pressed={checked} onClick={() => onChange(!checked)}>
      <DS.Checkbox key={checked ? 'on' : 'off'} checked={checked} label={label} />
    </button>
  );
}

function SelectControl({ label, value, onChange, options, className }) {
  return (
    <label className={'ctl ' + (className || '')}>{label}
      <span className="ctl__wrap">
        <select className="ctl__select" value={value} onChange={(e) => onChange && onChange(e.target.value)}>
          {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <span className="ctl__icon ctl__icon--right" aria-hidden="true"><DS.Icon name="chevron-down" size={20} color="var(--icons-secondary)" /></span>
      </span>
    </label>
  );
}

// Перетаскивание ширины колонки. dir = +1 тянем вправо (левая колонка), −1 тянем влево (итоги).
function useResizable(initial, min, max, dir) {
  const [w, setW] = useState(initial);
  const start = useCallback((e) => {
    e.preventDefault();
    const x0 = e.clientX, w0 = w;
    const move = (ev) => setW(Math.max(min, Math.min(max, w0 + dir * (ev.clientX - x0))));
    const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  }, [w, min, max, dir]);
  return [w, start, () => setW(initial)];
}

// Шапка раздела: вкладки «Табель / Исключения / Лента отметок / Настройки» + действия справа.
// active — route раздела ('' | 'exceptions' | 'feed' | 'settings'); null — ни одна вкладка не выбрана.
function SectionTabs({ active, flagCount, children }) {
  return (
    <div className="topbar">
      <div role="tablist" aria-label="Разделы табеля" className="rc-tabs rc-tabs--medium" style={{ flexWrap: 'wrap' }}>
        {SECTIONS.map((s) => (
          <a key={s.route} href={'#/' + s.route} role="tab" aria-selected={active === s.route} className={'rc-tab' + (active === s.route ? ' is-selected' : '')}>
            {s.icon && <DS.Icon name={s.icon} size={16} color="currentColor" />}
            {s.label}
            {s.count && flagCount != null && <span className="rc-navcount">{flagCount}</span>}
          </a>
        ))}
      </div>
      {children && <div className="topbar__actions">{children}</div>}
    </div>
  );
}

// Заглушка для экрана, которого ещё нет.
function StubScreen({ title, screen }) {
  return (
    <div className="card">
      <div className="stub">
        <DS.EmptyState icon="time-card" title={title} text="Экран ещё не свёрстан." action={null} />
        {screen && <span className="stub__meta">Макет: handoff/screens/{screen}</span>}
        <DS.Button variant="secondary" icon="back" onClick={() => { window.location.hash = '#/'; }}>К табелю</DS.Button>
      </div>
    </div>
  );
}

const go = (route) => { window.location.hash = '#/' + route; };

window.TabelUI = { NAV_GROUPS, NAV_USER, SECTIONS, fmt1, dash, useHashRoute, CheckToggle, SelectControl, useResizable, SectionTabs, StubScreen, go };
})();
