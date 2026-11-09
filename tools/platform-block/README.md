# Platform block generator

Builds the "Платформа" section of `index.html` (the dispatcher dashboard, Figma RaccoonAI Desktop node `4296:5593`) by server-rendering components from the RaccoonAI Design System for Claude (`window.RaccoonDS`, react 18.3.1) into static HTML. The page ships no React.

1. Download the design system's `project/` folder (tokens.css, components/bundle.js, components/bundle.css) and point `DSDIR` at it.
2. `npm i react@18.3.1 react-dom@18.3.1` next to these scripts.
3. `DSDIR=<project> CSS_OUT=../../platform-ds.css node build-platform.js <outdir>` writes `platform-fragment.html` and the scoped `platform-ds.css`.
4. `node splice.js ../../index.html <outdir>/platform-fragment.html` replaces the section in place.

Layout of the organisms lives in `platform.css` (hand-written, design pixels on a 1600 x 980 screen). Assets: `images/platform/` (2GIS map backdrop and truck illustration from the design system), `fonts/MedeoSansVariable.woff2`.

Truck routes on the map follow the streets of the backdrop: `trace-routes.js` (called by the build, needs `sharp`) classifies the map pixels into main roads, streets and blocks, finds the cheapest path between consecutive stops with A*, and simplifies it into straight runs. Stops per truck are authored in `MAP_TRUCKS` (`past` / `plan`, pin indices in visiting order).

## Live map

On the page the backdrop is only a placeholder: `js/platform.js` lays a Leaflet map with 2GIS raster tiles (`vendor/leaflet.min.js`, 1.9.4) under the pins, trucks, depot and routes. Those keep the backdrop pixel positions the build gives them; `GEO` in js/platform.js ties backdrop pixels to Web Mercator (scale and offset fitted to the 2GIS tiles, zoom ≈ 13.738), and each overlay follows the map through the CSS `translate` property. If you regenerate `map-almaty.webp` at a different view, refit `GEO`. Night tiles are recoloured on a canvas with the same curve as `dark-map.html`. The 2GIS tiles are used without an API key; a MapGL key would allow switching to vector maps with native light and dark styles.

## Fleet

`node tools/platform-block/fleet.mjs` puts the whole depot on the map: the Gantt trucks the build left off plus new ones, 29 in all (10 refuse trucks, 6 skip loaders, 6 hook lifts, 5 dump trucks, 2 vacuum trucks; 21 on the line, 8 in the depot). Every stop of a truck's day becomes a job pin snapped to a real road (OSRM nearest) with its Russian street address (Nominatim reverse); every truck gets its street route (OSRM) as past / planned polylines. It writes `platform-fleet.js` (`window.PF_FLEET`, merged by js/platform.js before the Platform starts: pins, trucks and truck cards are cloned from the build's markup) and rewrites the «Статус вывоза» numbers in `index.html` from the sites and trucks on the map. Network answers are cached in `fleet-cache.json`, so reruns are offline and identical. Run it again after a build (the build resets `index.html`); change the fleet in `NEW` and `TYPES`.

### Map truck icons

All trucks on the map (ТБО included) use the top-down icons from `images/Truck on map/<type>/State=Default.png`.
`node tools/platform-block/truck-icons.mjs` copies them to `images/platform/trucks/map/<type>.png` and draws the selected
state `<type>-on.png` (the same truck with the #242A35 outline the ТБО drawing has). Rerun it after replacing an icon.

### Pin clusters

On the live map, pins closer than 16 px on screen merge into a round marker with their count (a marker that would cover
another marker or a pin takes it in too, so nothing overlaps); its ring is split by the
statuses inside (colours read from the pins). Groups are rebuilt when a zoom lands (and every 0.35 of a level during a
wheel glide) and when the map filter changes; from zoom 16.5 every pin stands alone. Clicking a cluster flies into it.
The selected pin never hides in a cluster, and the tour turns clustering off. Tuning: `CL_R`, `CL_STEP`, `CL_OFF`,
`CL_LIFT`, `CL_GAP` in `js/platform.js`.
