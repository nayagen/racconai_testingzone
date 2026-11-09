# Site build

GitHub Pages publishes the site through `.github/workflows/pages.yml` on every push to `main`. The workflow runs
`build.mjs`, which copies what the pages load (the three `.html` pages, `favicon.svg`, the root `.css` and `.js` files and
`js/`, `i18n/`, `images/`, `fonts/`, `vendor/`) into `_site/` and minifies it there. Tools, docs and agent folders are not published.

- **JS:** full esbuild minification. No bundling, and top-level names are kept, so the shared globals still work.
- **CSS:** whitespace and comments only. esbuild's syntax pass rewrites some values inexactly, and that moved a few antialiased
  pixels. Whitespace-only output renders pixel-identical.
- **Not minified:** `vendor/` (already minified) and the `i18n/en.js` and `i18n/kk.js` dictionaries (minifying gains nothing after gzip).

Edit the readable sources as before; never commit minified files. To check a build locally:

```sh
npm i --no-save esbuild@0.24.2
node tools/site-build/build.mjs . _site
```

When you add a new top-level folder that a page loads from, add it to `DIRS` in `build.mjs`.
