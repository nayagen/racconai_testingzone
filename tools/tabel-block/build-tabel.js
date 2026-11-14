// Server-renders the RaccoonDS pieces of the «Табель» screen (tabel.html) into static HTML, as tools/platform-block does
// for the Platform screen. Usage: DSDIR=<design-system dir with components/bundle.js> node build-tabel.js <outdir>
// Writes <outdir>/sidenav.html and <outdir>/icons.json (name -> inner SVG markup). Needs react@18.3.1 and react-dom@18.3.1.
const fs = require('fs'), path = require('path');
const React = require('react'); const { renderToStaticMarkup: R } = require('react-dom/server');
global.window = globalThis; globalThis.React = React; globalThis.ReactDOM = require('react-dom'); globalThis.document = undefined;
require('vm').runInThisContext(fs.readFileSync(path.join(process.env.DSDIR, 'components/bundle.js'), 'utf8'));
const DS = globalThis.RaccoonDS, h = React.createElement;
const OUT = process.argv[2] || '.';

// Navigation as in the handoff's Main screen: the Platform sections with «Табель» selected, the HR user at the foot.
const NAV_GROUPS = [
  [{icon:'dashboard-icon',label:'Дэшборд',value:'dashboard'},{icon:'task',label:'Задания',value:'jobs'},{icon:'journey',label:'Маршруты',value:'routes'},{icon:'garbage-truck',label:'Экипажи',value:'crews'},{icon:'navigation',label:'Контроль движения',value:'gps'}],
  [{icon:'location',label:'Площадки',value:'locations'},{icon:'group-of-locations',label:'Маршрутные группы',value:'route-groups'},{icon:'admin-icon',label:'Реестр контейнеров',value:'containers'},{icon:'budget',label:'Заказчики',value:'clients'}],
  [{icon:'garage',label:'Автопарк',value:'fleet'},{icon:'tear-off-calendar',label:'График смен',value:'shifts'}],
  [{icon:'phone-calling',label:'Колл-центр',value:'call-center'},{icon:'analytics',label:'Аналитика',value:'analytics'},{icon:'users',label:'Сотрудники',value:'staff'},{icon:'time-card',label:'Табель',value:'timesheet'},{icon:'weight-station',label:'Весовая',value:'weighing'}]
];
const nav = R(h(DS.SideNav, { value: 'timesheet', groups: NAV_GROUPS, user: { initials: 'ГС', name: 'Гульнара С.', role: 'HR-менеджер' }, quickActions: false }));
fs.writeFileSync(path.join(OUT, 'sidenav.html'), nav);

const ICONS = ['chevron-left', 'chevron-right', 'chevron-down', 'tear-off-calendar', 'search', 'settings', 'cancel', 'check', 'download', 'whatsapp', 'time', 'location', 'camera', 'garbage-truck', 'info'];
const icons = {};
ICONS.forEach(n => { const m = R(h(DS.Icon, { name: n, size: 20 })); icons[n] = m.replace(/^<span[^>]*>/, '').replace(/<\/span>$/, ''); });
fs.writeFileSync(path.join(OUT, 'icons.json'), JSON.stringify(icons, null, 1));
console.log('sidenav', nav.length, 'icons', Object.entries(icons).map(([k, v]) => k + ':' + v.length).join(' '));
