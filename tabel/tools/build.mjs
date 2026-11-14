// Сборка табеля для показа: JSX компилируется заранее, без Babel в браузере (~3 МБ и компиляция при каждой загрузке).
//
//   npm i --no-save --no-package-lock esbuild@0.24.2
//   node tabel/tools/build.mjs            → tabel/dist/{index.html, app.js, app.css}
//
// Порядок файлов берётся из tabel/index.html, поэтому новый экран достаточно подключить там.
// Что делает:
//   - склеивает CSS (токены, бандл DS, стили экранов) и сжимает пробелы;
//   - из бандла DS выкидывает иконки, которых нет в коде экранов (438 КБ → ~70 КБ), и неиспользуемые пины/машинки карты;
//   - компилирует JSX в React.createElement и минифицирует;
//   - подключает React в продакшен-сборке.
// Для разработки по-прежнему открывайте tabel/index.html: там JSX компилируется в браузере и правки видны сразу.
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const out = path.join(root, "dist");
const esbuild = createRequire(path.join(process.cwd(), "/"))("esbuild");
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");

const html = read("index.html");
const css = [...html.matchAll(/<link rel="stylesheet" href="((?:ds|src)\/[^"]+)">/g)].map((m) => m[1]);
const jsx = [...html.matchAll(/<script type="text\/babel"[^>]*src="([^"]+)"><\/script>/g)].map((m) => m[1]);
const plain = [...html.matchAll(/<script src="((?:ds|src)\/[^"]+)"><\/script>/g)].map((m) => m[1]);
if (!css.length || !jsx.length || !plain.length) throw new Error("не нашёл подключения в tabel/index.html");

// ---- бандл DS: только используемые иконки ----
const appSource = jsx.map(read).join("\n");
function trimBundle(src) {
  const literal = (name) => {
    const start = src.indexOf(`var ${name}=`) + `var ${name}=`.length;
    let depth = 0, i = start, inStr = false;
    for (; i < src.length; i++) {
      const ch = src[i];
      if (inStr) { if (ch === "\\") i++; else if (ch === '"') inStr = false; continue; }
      if (ch === '"') inStr = true; else if (ch === "{") depth++; else if (ch === "}" && --depth === 0) break;
    }
    return { start, end: i + 1, value: JSON.parse(src.slice(start, i + 1)) };
  };
  const names = ["ICONS", "ICON_META", "ICON_ALIAS", "PINS", "TRUCKS"];
  const parts = Object.fromEntries(names.map((n) => [n, literal(n)]));
  let code = src;
  for (const n of [...names].sort((a, b) => parts[b].start - parts[a].start)) code = code.slice(0, parts[n].start) + "{}" + code.slice(parts[n].end);
  const quoted = (k) => new RegExp(`['"]${k.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")}['"]`).test(appSource + code);
  const alias = parts.ICON_ALIAS.value;
  const used = new Set([...Object.keys(parts.ICONS.value), ...Object.keys(alias)].filter(quoted));
  for (const k of [...used]) if (alias[k]) used.add(alias[k]);
  const pick = (obj) => Object.fromEntries(Object.entries(obj).filter(([k]) => used.has(k)));
  const keep = { ICONS: pick(parts.ICONS.value), ICON_META: pick(parts.ICON_META.value), ICON_ALIAS: pick(alias), PINS: {}, TRUCKS: {} };
  let res = src;
  for (const n of [...names].sort((a, b) => parts[b].start - parts[a].start)) res = res.slice(0, parts[n].start) + JSON.stringify(keep[n]) + res.slice(parts[n].end);
  return { code: res, icons: Object.keys(keep.ICONS).length };
}

fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });

const cssText = css.map((f) => `/* ${f} */\n` + read(f).replace(/@import url\([^)]*\);?/g, "")).join("\n");
const cssMin = esbuild.transformSync(cssText, { loader: "css", minifyWhitespace: true }).code;
fs.writeFileSync(path.join(out, "app.css"), cssMin);

const js = plain.map((f) => {
  if (!f.endsWith("bundle.js")) return read(f);
  const t = trimBundle(read(f));
  console.log(`DS: иконок оставлено ${t.icons}`);
  return t.code;
}).join(";\n") + ";\n" + jsx.map((f) => `// ${f}\n` + read(f)).join("\n");
const jsMin = esbuild.transformSync(js, { loader: "jsx", jsx: "transform", jsxFactory: "React.createElement", jsxFragment: "React.Fragment", minify: true, target: "es2019", charset: "utf8" }).code;
fs.writeFileSync(path.join(out, "app.js"), jsMin);

const title = (html.match(/<title>([^<]*)<\/title>/) || [, "Табель"])[1];
fs.writeFileSync(path.join(out, "index.html"), `<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<link rel="icon" href="../../favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap">
<link rel="stylesheet" href="app.css">
</head>
<body>
<div id="root"></div>
<noscript>Для табеля нужен JavaScript.</noscript>
<script src="https://cdnjs.cloudflare.com/ajax/libs/react/18.3.1/umd/react.production.min.js" crossorigin></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.3.1/umd/react-dom.production.min.js" crossorigin></script>
<script src="app.js"></script>
</body>
</html>
`);
const kb = (s) => Math.round(Buffer.byteLength(s) / 1024);
console.log(`dist: app.js ${kb(jsMin)} КБ, app.css ${kb(cssMin)} КБ`);
