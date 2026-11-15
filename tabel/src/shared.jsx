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
  // Новая ширина по умолчанию (например, другой набор колонок) сбрасывает ручную подстройку.
  useEffect(() => { setW(initial); }, [initial]);
  const clamp = (v) => Math.max(min, Math.min(max, v));
  // Перетаскивание мышью или пальцем; жест снимается и при отмене указателя, и при потере окна фокуса.
  const start = useCallback((e) => {
    e.preventDefault();
    const x0 = e.clientX, w0 = w;
    const move = (ev) => setW(clamp(w0 + dir * (ev.clientX - x0)));
    const stop = () => {
      window.removeEventListener('pointermove', move);
      ['pointerup', 'pointercancel', 'blur'].forEach((t) => window.removeEventListener(t, stop));
    };
    window.addEventListener('pointermove', move);
    ['pointerup', 'pointercancel', 'blur'].forEach((t) => window.addEventListener(t, stop));
  }, [w, min, max, dir]);
  // С клавиатуры: стрелки меняют ширину на 16 px, Shift — на 64, Home — по умолчанию.
  const onKeyDown = useCallback((e) => {
    const step = e.shiftKey ? 64 : 16;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault();
      const sign = (e.key === 'ArrowRight' ? 1 : -1) * dir;
      setW((v) => clamp(v + sign * step));
    } else if (e.key === 'Home') { e.preventDefault(); setW(initial); }
  }, [min, max, dir, initial]);
  return [w, start, () => setW(initial), onKeyDown];
}

// Шапка раздела: вкладки «Табель / Исключения / Лента отметок / Настройки» + действия справа.
// active — route раздела ('' | 'exceptions' | 'feed' | 'settings'); null — ни одна вкладка не выбрана.
const SECTION_TITLES = { '': 'Табель за месяц', exceptions: 'Очередь исключений', feed: 'Лента отметок', settings: 'Настройки табеля' };

function SectionTabs({ active, flagCount, title, children }) {
  const h1 = title || SECTION_TITLES[active];
  return (
    <div className="topbar">
      {h1 && <h1 className="sr-only">{h1}</h1>}
      <nav aria-label="Разделы табеля" className="rc-tabs rc-tabs--medium">
        {SECTIONS.map((s) => (
          <a key={s.route} href={'#/' + s.route} aria-current={active === s.route ? 'page' : undefined} className={'rc-tab' + (active === s.route ? ' is-selected' : '')}>
            {s.icon && <DS.Icon name={s.icon} size={16} color="currentColor" />}
            {s.label}
            {s.count && flagCount != null && <span className="rc-navcount">{flagCount}</span>}
          </a>
        ))}
      </nav>
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

// ---------- доступность: окна и вложенные чекбоксы ----------
// Ставится один раз и работает для всех экранов, без правок в каждом окне:
// 1) скрытый input чекбокса/радио дизайн-системы внутри кнопки не получает фокус (иначе две остановки Tab, вторая невидима);
// 2) любое [role=dialog]: при открытии фокус уходит внутрь, Tab не выходит за окно, при закрытии фокус возвращается туда, откуда открыли.
const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]):not([tabindex="-1"]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
const visible = (el) => el.getClientRects().length > 0 && getComputedStyle(el).visibility !== 'hidden';
const dialogs = []; // стек открытых окон: { el, returnTo }

function syncDialogs() {
  document.querySelectorAll('button input, [role="button"] input').forEach((i) => { if (i.tabIndex !== -1) i.tabIndex = -1; });
  // Чекбокс DS без подписи: имя берём из data-cb-label обёртки.
  document.querySelectorAll('[data-cb-label] input').forEach((i) => { const l = i.closest('[data-cb-label]').dataset.cbLabel; if (i.getAttribute('aria-label') !== l) i.setAttribute('aria-label', l); });
  for (let k = dialogs.length - 1; k >= 0; k--) {
    if (!document.contains(dialogs[k].el)) {
      const { returnTo } = dialogs.splice(k, 1)[0];
      if (returnTo && document.contains(returnTo) && (!document.activeElement || document.activeElement === document.body || !document.contains(document.activeElement))) returnTo.focus();
    }
  }
  document.querySelectorAll('[role="dialog"]').forEach((el) => {
    if (dialogs.some((d) => d.el === el)) return;
    dialogs.push({ el, returnTo: document.activeElement });
    if (!el.contains(document.activeElement)) {
      const first = [...el.querySelectorAll(FOCUSABLE)].find(visible);
      (first || el).focus();
      if (!first) el.tabIndex = -1;
    }
  });
}

function trapTab(e) {
  if (e.key !== 'Tab' || !dialogs.length) return;
  const el = dialogs[dialogs.length - 1].el;
  const items = [...el.querySelectorAll(FOCUSABLE)].filter(visible);
  if (!items.length) { e.preventDefault(); return; }
  const first = items[0], last = items[items.length - 1];
  if (!el.contains(document.activeElement)) { e.preventDefault(); first.focus(); }
  else if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
}

if (!window.__tabelA11y) {
  window.__tabelA11y = true;
  new MutationObserver(syncDialogs).observe(document.documentElement, { childList: true, subtree: true });
  document.addEventListener('keydown', trapTab, true);
}

const go = (route) => { window.location.hash = '#/' + route; };

window.TabelUI = { NAV_GROUPS, NAV_USER, SECTIONS, fmt1, dash, useHashRoute, CheckToggle, SelectControl, useResizable, SectionTabs, StubScreen, go };
})();
