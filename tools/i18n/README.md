# Page translations (ru → en, kk)

Russian in `index.html` / `js/*.js` is the source. `i18n/en.js` and `i18n/kk.js` are generated dictionaries keyed by the Russian text; `i18n/i18n.js` applies them at runtime.

After changing Russian copy:
1. `node extract.mjs <work-dir>` lists every Russian string (whole text nodes of the marketing page, Cyrillic runs of the Platform replica and js/*.js) into `full.json` / `runs.json`.
2. Translate new strings following `BRIEF.md` (glossary and fragment rules) into `outN.json` next to a matching `chunkN.json`; small corrections go in `fixes.json`.
3. `node merge.mjs <dir-with-chunks> <project-root>` rebuilds `i18n/en.js` and `i18n/kk.js` and lists missing keys.
4. `node coverage.mjs <work-dir> en` loads the page in English and lists any text still in Cyrillic.

The scripts expect Chrome at `C:/Program Files/Google/Chrome/Application/chrome.exe`; the page URL is set at the top of each script.
