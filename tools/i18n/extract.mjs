// Collect every Russian string the page can show.
// full: whole text nodes / attribute values from the rendered marketing DOM (outside the Platform replica), with section context.
// runs: Cyrillic runs from the Platform replica markup, its JSON data and script.js (covers JS-generated text).
import { spawn } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
const ROOT = 'C:/Users/Ayan Zhan/Documents/GitHub/racconai_testingzone/racconai_testingzone-1';
const OUT = process.argv[2];
const url = 'file:///C:/Users/Ayan%20Zhan/Documents/GitHub/racconai_testingzone/racconai_testingzone-1/index.html';

// Shared with the runtime (i18n.js): a run starts with a Cyrillic letter and continues over Cyrillic letters,
// spaces and in-sentence punctuation; digits, Latin letters, quotes '"', '·', '<' end it.
const RUN = /[\u0400-\u04FF][\u0400-\u04FF\u00A0 ,.:;!?«»()\-–—\/№%+]*/g;
const TAIL = /[\s\u00A0,;:(\-–—«\/№+]+$/;
const norm = s => s.replace(/[\u00A0\u202F]/g, ' ').replace(/\u2011/g, '-').replace(/\s+/g, ' ').trim();
const decode = s => s.replace(/&nbsp;/g, '\u00A0').replace(/&mdash;/g, '—').replace(/&ndash;/g, '–').replace(/&laquo;/g, '«').replace(/&raquo;/g, '»')
  .replace(/&#(\d+);/g, (m, d) => String.fromCharCode(+d)).replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/\\u([0-9a-fA-F]{4})/g, (m, h) => String.fromCharCode(parseInt(h, 16)));
const runsOf = text => { const out = []; for (const m of decode(text).matchAll(RUN)) { const core = norm(m[0].replace(TAIL, '')); if (core) out.push(core); } return out; };

const html = readFileSync(`${ROOT}/index.html`, 'utf8');
const js = readFileSync(`${ROOT}/script.js`, 'utf8');
const lines = html.split('\n');
const blob = lines.filter(l => l.length > 3000).join('\n');
const runs = new Map();
const addRuns = (txt, src) => { for (const r of runsOf(txt)) { if (!runs.has(r)) runs.set(r, src); } };
addRuns(blob, 'platform');
addRuns(js, 'script');

// Rendered DOM
const port = 9300 + Math.floor(Math.random() * 500);
const ch = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new', '--disable-gpu', `--remote-debugging-port=${port}`, `--user-data-dir=${OUT}/prof${port}`, '--window-size=1440,900', 'about:blank']);
const sleep = ms => new Promise(r => setTimeout(r, ms));
let tabs; for (let i = 0; i < 50; i++) { try { tabs = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); break; } catch { await sleep(200); } }
const ws = new WebSocket(tabs.find(t => t.type === 'page').webSocketDebuggerUrl);
await new Promise(r => ws.onopen = r);
let id = 0; const pend = {};
ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id && pend[m.id]) { pend[m.id](m); delete pend[m.id]; } };
const send = (method, params = {}) => new Promise(r => { const i = ++id; pend[i] = r; ws.send(JSON.stringify({ id: i, method, params })); });
await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
await send('Page.enable'); await send('Page.navigate', { url }); await sleep(3000);
const collector = `(() => {
  const CY = /[\\u0400-\\u04FF]/;
  const norm = s => s.replace(/[\\u00A0\\u202F]/g, ' ').replace(/\\u2011/g, '-').replace(/\\s+/g, ' ').trim();
  const sec = el => { const s = el.closest('section, header, footer, figure.pause'); return s ? (s.id || s.className.split(' ')[0] || s.tagName.toLowerCase()) : 'page'; };
  const out = [];
  const inPf = el => !!el.closest('#pf-viewport');
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let n; while ((n = w.nextNode())) {
    const p = n.parentElement; if (!p || p.closest('script, style')) continue;
    if (!CY.test(n.data)) continue;
    if (inPf(p)) continue;
    out.push({ t: norm(n.data), c: sec(p), tag: p.tagName.toLowerCase() });
  }
  document.querySelectorAll('[aria-label], [alt], [placeholder], [title], [data-tip]').forEach(el => {
    if (inPf(el)) return;
    ['aria-label', 'alt', 'placeholder', 'title', 'data-tip'].forEach(a => { const v = el.getAttribute(a); if (v && CY.test(v)) out.push({ t: norm(v), c: sec(el), tag: '@' + a }); });
  });
  out.push({ t: norm(document.title), c: 'head', tag: 'title' });
  const md = document.querySelector('meta[name=description]'); if (md) out.push({ t: norm(md.content), c: 'head', tag: 'meta' });
  // the Platform figure's own aria-label and caption sit outside #pf-viewport and are caught above
  return JSON.stringify(out);
})()`;
const r = await send('Runtime.evaluate', { expression: collector, returnByValue: true });
const items = JSON.parse(r.result.result.value);
ch.kill();

const full = new Map();
for (const it of items) { if (it.t && !full.has(it.t)) full.set(it.t, { c: it.c, tag: it.tag }); }
// runs from the marketing script strings are already in `runs`; drop runs that equal a full key
for (const k of full.keys()) runs.delete(k);
writeFileSync(`${OUT}/full.json`, JSON.stringify([...full].map(([t, v]) => ({ t, ...v })), null, 1));
writeFileSync(`${OUT}/runs.json`, JSON.stringify([...runs].map(([t, src]) => ({ t, src })), null, 1));
console.log('full', full.size, 'runs', runs.size);
process.exit(0);
