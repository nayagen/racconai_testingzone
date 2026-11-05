// Load the page in a language, let it run (tour, sequences), and list text that is still Cyrillic.
import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';
const [OUT, LANG, WAIT = '9000', TZ = ''] = process.argv.slice(2);
const url = `file:///C:/Users/Ayan%20Zhan/Documents/GitHub/racconai_testingzone/racconai_testingzone-1/index.html${LANG ? '?lang=' + LANG : ''}`;
const port = 9300 + Math.floor(Math.random() * 500);
const ch = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new', '--disable-gpu', `--remote-debugging-port=${port}`, `--user-data-dir=${OUT}/prof${port}`, '--window-size=1440,900', 'about:blank']);
const sleep = ms => new Promise(r => setTimeout(r, ms));
let tabs; for (let i = 0; i < 50; i++) { try { tabs = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); break; } catch { await sleep(200); } }
const ws = new WebSocket(tabs.find(t => t.type === 'page').webSocketDebuggerUrl);
await new Promise(r => ws.onopen = r);
let id = 0; const pend = {}; const logs = [];
ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id && pend[m.id]) { pend[m.id](m); delete pend[m.id]; } if (m.method === 'Runtime.exceptionThrown') logs.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text); };
const send = (method, params = {}) => new Promise(r => { const i = ++id; pend[i] = r; ws.send(JSON.stringify({ id: i, method, params })); });
await send('Runtime.enable');
if (TZ) await send('Emulation.setTimezoneOverride', { timezoneId: TZ });
await send('Page.enable'); await send('Page.navigate', { url }); await sleep(2500);
// scroll through the page so observers fire
const h = (await send('Runtime.evaluate', { expression: 'document.body.scrollHeight', returnByValue: true })).result.result.value;
for (let y = 0; y < h; y += 700) { await send('Runtime.evaluate', { expression: `scrollTo(0,${y})` }); await sleep(250); }
await send('Runtime.evaluate', { expression: `document.getElementById('pf-viewport').scrollIntoView()` });
await sleep(+WAIT);
const r = await send('Runtime.evaluate', { returnByValue: true, expression: `(() => {
  const CY = /[\\u0400-\\u04FF]/; const out = new Set();
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let n;
  while ((n = w.nextNode())) { const p = n.parentElement; if (!p || p.closest('script,style,[data-i18n-skip]')) continue; if (CY.test(n.data)) out.add(n.data.replace(/\\s+/g,' ').trim()); }
  document.querySelectorAll('[aria-label],[alt],[placeholder],[title]').forEach(el => { if (el.closest('[data-i18n-skip]')) return; ['aria-label','alt','placeholder','title'].forEach(a => { const v = el.getAttribute(a); if (v && CY.test(v)) out.add('@' + v); }); });
  return JSON.stringify({ lang: document.documentElement.lang, title: document.title, left: [...out] });
})()` });
const res = JSON.parse(r.result.result.value);
res.errors = logs;
writeFileSync(`${OUT}/coverage-${LANG || 'auto'}.json`, JSON.stringify(res, null, 1));
console.log(res.lang, '|', res.title, '| left:', res.left.length, '| errors:', logs.length);
ch.kill(); process.exit(0);
