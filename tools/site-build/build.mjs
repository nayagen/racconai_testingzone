// Site build for GitHub Pages: copies the published files into an output folder and minifies our own CSS and JS there.
// The repository keeps the readable sources; only the deployed copy is minified. Run by .github/workflows/pages.yml.
//
//   node tools/site-build/build.mjs <src> <out>
//
// esbuild is resolved from the current working directory (CI runs `npm i --no-save esbuild@…` in the repo root first).
// Minification only: no bundling, no syntax lowering, top-level names kept (the page scripts share globals such as
// window.Raccoon, window.PF_FLEET and window.RACCOON_I18N). vendor/ is already minified and is copied as is.
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const [src, out] = process.argv.slice(2).map((p) => path.resolve(p));
if (!src || !out) { console.error("usage: build.mjs <src> <out>"); process.exit(2); }
const esbuild = createRequire(path.join(process.cwd(), "/"))("esbuild");

// What the site serves: the pages and the folders they load from. Everything else (tools, docs, agent folders) stays out.
const PAGES = ["index.html", "driverapp.html", "clientapp.html", "favicon.svg"];
const ROOT_ASSETS = /\.(css|js)$/; // style.css, platform.css, platform-ds.css, platform-fleet.js
const DIRS = ["js", "i18n", "images", "fonts", "vendor"];

fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(path.join(out, ".nojekyll"), "");

const copied = [];
const copy = (rel) => {
  const to = path.join(out, rel);
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.copyFileSync(path.join(src, rel), to);
  copied.push(rel);
};
for (const f of fs.readdirSync(src)) {
  if (PAGES.includes(f) || (ROOT_ASSETS.test(f) && fs.statSync(path.join(src, f)).isFile())) { copy(f); }
}
const walk = (rel) => {
  for (const e of fs.readdirSync(path.join(src, rel), { withFileTypes: true })) {
    if (e.name.startsWith(".")) { continue; }
    const r = path.join(rel, e.name);
    if (e.isDirectory()) { walk(r); } else { copy(r); }
  }
};
DIRS.forEach((d) => fs.existsSync(path.join(src, d)) && walk(d));

let before = 0, after = 0;
for (const rel of copied) {
  const ext = path.extname(rel);
  // vendor/ is minified upstream; the i18n dictionaries are plain string maps that gzip as well as their minified form
  if ((ext !== ".css" && ext !== ".js") || rel.startsWith("vendor" + path.sep) || rel.includes(".min.") || /^i18n.(en|kk)\.js$/.test(rel)) { continue; }
  const file = path.join(out, rel), code = fs.readFileSync(file, "utf8");
  // CSS: whitespace and comments only. esbuild's syntax pass rewrites values (colours, numbers) in ways that are not always
  // exact, which moved a few antialiased pixels; whitespace-only is pixel-identical. JS: full minification.
  const css = ext === ".css";
  const res = esbuild.transformSync(code, {
    loader: ext.slice(1), target: "esnext", charset: "utf8", legalComments: "inline", sourcefile: rel,
    minifyWhitespace: true, minifyIdentifiers: !css, minifySyntax: !css,
  });
  fs.writeFileSync(file, res.code);
  before += Buffer.byteLength(code); after += Buffer.byteLength(res.code);
}
console.log(`${copied.length} files; CSS/JS minified ${Math.round(before / 1024)} KB -> ${Math.round(after / 1024)} KB`);
