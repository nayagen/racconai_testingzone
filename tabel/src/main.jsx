/* Табель — каркас приложения и роутинг по location.hash. Экраны регистрируются в window.TabelScreens.
   Маршруты:
     #/                          → Timesheet           (Main.dc.html)
     #/exceptions                → Exceptions          (Exceptions.dc.html)
     #/feed                      → Feed                (Feed.dc.html)
     #/settings                  → SettingsRules       (SettingsRules.dc.html)
     #/settings/exceptions       → SettingsExceptions  (SettingsExceptions.dc.html)
     #/day/<таб.№>/<YYYY-MM-DD>  → DayDetail, если в этот день исключение, иначе DayDetailNormal
     #/day                       → DayDetail с примером из макета (ссылки из очереди исключений и ленты)
   Каждый экран получает пропсы ScreenProps (см. CLAUDE.md) и сам рисует шапку раздела (TabelUI.SectionTabs). */
(() => {
const { useState, useMemo, useEffect } = React;
const DS = window.RaccoonDS;
const D = window.TabelData;
const { NAV_GROUPS, NAV_USER, useHashRoute, StubScreen } = window.TabelUI;

const TITLES = {
  Timesheet: 'Табель за месяц', Exceptions: 'Очередь исключений', Feed: 'Лента отметок',
  SettingsRules: 'Настройки: правила', SettingsExceptions: 'Настройки: типы исключений',
  DayDetail: 'Карточка дня', DayDetailNormal: 'Карточка дня'
};

function resolve(route, data) {
  const parts = route.split('/').filter(Boolean);
  const head = parts[0] || '';
  if (head === 'exceptions') return { name: 'Exceptions' };
  if (head === 'feed') return { name: 'Feed' };
  if (head === 'settings') return { name: parts[1] === 'exceptions' ? 'SettingsExceptions' : 'SettingsRules' };
  if (head === 'day') {
    const [, id, date] = parts;
    const employee = id ? data.rows.find((r) => r.id === id) : null;
    const dayIndex = employee && date ? data.days.findIndex((d) => d.date === date) : -1;
    const cell = dayIndex >= 0 ? employee.cells[dayIndex] : null;
    const day = dayIndex >= 0 ? data.days[dayIndex] : null;
    const normal = cell && cell.kind === 'work' && !cell.flag;
    return { name: normal ? 'DayDetailNormal' : 'DayDetail', day: { id, date, employee, day, cell } };
  }
  return { name: 'Timesheet' };
}

function App() {
  const route = useHashRoute();
  const [period, setPeriod] = useState(D.DEFAULT_PERIOD);
  const data = useMemo(() => D.buildTimesheet(period), [period]);
  const flagCount = data.rows.reduce((a, r) => a + r.flags, 0);
  const { name, day } = resolve(route, data);

  useEffect(() => { document.title = TITLES[name] + ' · RaccoonAI'; window.scrollTo(0, 0); }, [name, route]);

  const Screen = (window.TabelScreens || {})[name];
  const props = { data, period, setPeriod, flagCount, route, day };

  return (
    <div className="shell">
      <div className="shell__nav"><DS.SideNav value="timesheet" groups={NAV_GROUPS} user={NAV_USER} quickActions={false} /></div>
      <main className="shell__main">
        {Screen ? <Screen key={name} {...props} /> : <StubScreen title={TITLES[name]} />}
      </main>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
})();
