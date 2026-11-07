# Platform block generator

Builds the "Платформа" section of `index.html` (the dispatcher dashboard, Figma RaccoonAI Desktop node `4296:5593`) by server-rendering components from the RaccoonAI Design System for Claude (`window.RaccoonDS`, react 18.3.1) into static HTML. The page ships no React.

1. Download the design system's `project/` folder (tokens.css, components/bundle.js, components/bundle.css) and point `DSDIR` at it.
2. `npm i react@18.3.1 react-dom@18.3.1` next to these scripts.
3. `DSDIR=<project> CSS_OUT=../../platform-ds.css node build-platform.js <outdir>` writes `platform-fragment.html` and the scoped `platform-ds.css`.
4. `node splice.js ../../index.html <outdir>/platform-fragment.html` replaces the section in place.

Layout of the organisms lives in `platform.css` (hand-written, design pixels on a 1600 x 980 screen). Assets: `images/platform/` (2GIS map backdrop and truck illustration from the design system), `fonts/MedeoSansVariable.woff2`.

Truck routes on the map follow the streets of the backdrop: `trace-routes.js` (called by the build, needs `sharp`) classifies the map pixels into main roads, streets and blocks, finds the cheapest path between consecutive stops with A*, and simplifies it into straight runs. Stops per truck are authored in `MAP_TRUCKS` (`past` / `plan`, pin indices in visiting order).

## Live map

On the page the backdrop is only a placeholder: `script.js` lays a Leaflet map with 2GIS raster tiles (`vendor/leaflet.min.js`, 1.9.4) under the pins, trucks, depot and routes. Those keep the backdrop pixel positions the build gives them; `GEO` in script.js ties backdrop pixels to Web Mercator (scale and offset fitted to the 2GIS tiles, zoom ≈ 13.738), and each overlay follows the map through the CSS `translate` property. If you regenerate `map-almaty.webp` at a different view, refit `GEO`. Night tiles are recoloured on a canvas with the same curve as `dark-map.html`. The 2GIS tiles are used without an API key; a MapGL key would allow switching to vector maps with native light and dark styles.
