// Merge translator outputs into i18n/en.js and i18n/kk.js; report missing keys.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
const [D, ROOT] = process.argv.slice(2);
const norm = s => s.replace(/[  ]/g, ' ').replace(/‑/g, '-').replace(/\s+/g, ' ').trim();
const en = {}, kk = {};
let missing = [];
for (let i = 1; i <= 9; i++) {
  const chunk = `${D}/chunk${i}.json`, out = `${D}/out${i}.json`;
  if (!existsSync(chunk)) continue;
  const src = JSON.parse(readFileSync(chunk, 'utf8'));
  const tr = existsSync(out) ? JSON.parse(readFileSync(out, 'utf8')) : {};
  for (const { t } of src) {
    const v = tr[t];
    if (!v || typeof v.en !== 'string' || typeof v.kk !== 'string') { missing.push(t); continue; }
    en[norm(t)] = norm(v.en); kk[norm(t)] = norm(v.kk);
  }
}
// hand fixes applied last
if (existsSync(`${D}/fixes.json`)) {
  const f = JSON.parse(readFileSync(`${D}/fixes.json`, 'utf8'));
  for (const [k, v] of Object.entries(f)) { if (v.en != null) en[norm(k)] = v.en; if (v.kk != null) kk[norm(k)] = v.kk; }
}
const head = l => `// Generated from the translation tables: Russian source text → ${l === 'en' ? 'English' : 'Kazakh'}. See i18n/i18n.js.\n(window.RACCOON_I18N = window.RACCOON_I18N || {}).${l} = `;
writeFileSync(`${ROOT}/i18n/en.js`, head('en') + JSON.stringify(en, null, 0).replace(/","/g, '",\n"') + ';\n');
writeFileSync(`${ROOT}/i18n/kk.js`, head('kk') + JSON.stringify(kk, null, 0).replace(/","/g, '",\n"') + ';\n');
console.log('en', Object.keys(en).length, 'kk', Object.keys(kk).length, 'missing', missing.length);
if (missing.length) writeFileSync(`${D}/missing.json`, JSON.stringify(missing, null, 1));
