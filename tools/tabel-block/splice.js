// Puts the server-rendered pieces into tabel.html between their markers, so the build can be rerun in place:
//   <!-- tb:sidenav -->…<!-- /tb:sidenav -->      the RaccoonDS SideNav (sidenav.html)
//   <!-- tb:icon NAME -->…<!-- /tb:icon -->        a RaccoonDS icon's SVG (icons.json)
// and the icons the grid script uses into js/tabel.js beside the page.
// Usage: node splice.js ../../tabel.html <outdir of build-tabel.js>
const fs = require('fs'), path = require('path');
const [page, dir] = process.argv.slice(2);
let s = fs.readFileSync(page, 'utf8');
const nav = fs.readFileSync(path.join(dir, 'sidenav.html'), 'utf8');
const icons = JSON.parse(fs.readFileSync(path.join(dir, 'icons.json'), 'utf8'));
s = s.replace(/<!-- tb:sidenav -->(?:[\s\S]*?<!-- \/tb:sidenav -->)?/, () => '<!-- tb:sidenav -->' + nav + '<!-- /tb:sidenav -->');
s = s.replace(/<!-- tb:icon ([\w-]+) -->(?:[\s\S]*?<!-- \/tb:icon -->)?/g, (m, n) => {
  if (!icons[n]) throw new Error('icon not rendered: ' + n);
  return '<!-- tb:icon ' + n + ' -->' + icons[n] + '<!-- /tb:icon -->';
});
fs.writeFileSync(page, s);
console.log('spliced', page);
// The grid script draws its controls with the same icons: /* tb:icons */{…}/* /tb:icons */ in js/tabel.js.
const js = path.join(path.dirname(page), 'js/tabel.js');
if (fs.existsSync(js)) {
  const used = ['chevron-left', 'chevron-right', 'chevron-down', 'tear-off-calendar', 'search', 'settings', 'cancel', 'check', 'download'];
  const map = {}; used.forEach(n => { map[n] = icons[n]; });
  fs.writeFileSync(js, fs.readFileSync(js, 'utf8').replace(/\/\* tb:icons \*\/[\s\S]*?\/\* \/tb:icons \*\//, () => '/* tb:icons */' + JSON.stringify(map) + '/* /tb:icons */'));
  console.log('spliced', js);
}
