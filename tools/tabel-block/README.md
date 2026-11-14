# Табель block generator

`tabel.html` shows the «Табель» screen of the Platform (handoff «Табель HR», screen 1 `Main.dc.html`) at a 1600 × 960
design size. The side nav and the icons come from the RaccoonAI Design System (`window.RaccoonDS`, react 18.3.1),
server-rendered once into static HTML like `tools/platform-block`; the page ships no React. The grid, filters, metric
switch, groups and the export dialog are drawn by `js/tabel.js` with the design system's classes from `platform-ds.css`.

1. Put the design system folder (`components/bundle.js`) somewhere and point `DSDIR` at it.
2. `npm i react@18.3.1 react-dom@18.3.1` next to these scripts (or set `NODE_PATH`).
3. `DSDIR=<dir> node build-tabel.js <outdir>` writes `sidenav.html` and `icons.json`.
4. `node splice.js ../../tabel.html <outdir>` replaces the `<!-- tb:sidenav -->` and `<!-- tb:icon NAME -->` blocks in
   the page and the `/* tb:icons */` map in `js/tabel.js`.

Data follows the handoff prototype: seven teams, 64 people, norms 12 h (drivers) and 10 h (loaders), mileage and fuel
for drivers only, period October 2026 (today 28 October; September is closed). Касымов Арман's 5 October is the day the
#razbor card resolves; saving it clears that cell in the grid.
