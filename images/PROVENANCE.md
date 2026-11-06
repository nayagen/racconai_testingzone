# Image provenance

All photographs on the landing page are AI-generated illustrative images, not photos of a real operator, fleet or pilot. Replace them with real field photography from the pilots when it is available.

Generated 2026-11-04 with Higgsfield, model GPT Image 2.5 (`gpt_image_2_5`), quality `xhigh`. Masters were downloaded as PNG and encoded to WebP (sharp 0.33.5, q78; q72 above 2000px). Masters are not committed.

| Files | Used in | Job id | Master | Prompt summary |
|---|---|---|---|---|
| `depot-{640,960,1280,1792}.webp` | AI-dispatcher section, behind the fleet panel | `a980ab7c-0ca0-435d-8e55-5343227ebd20` | 1792×2240, 4:5, 2k | Dawn at a waste-collection depot near Almaty: unbranded white rear-loaders and a skip loader, Tien Shan behind. No logos, lettering, readable plates or people. |
| `city-{640,960,1280,1792}.webp` | Not used since the Sentinel section was removed (was behind the Sentinel panel) | `99764daa-0154-42d6-9323-4dcdd1a587f7` | 1792×2240, 4:5, 2k | Elevated view of Almaty at blue hour: microdistricts, lit avenues, Zailiysky Alatau. No text or signage. |
| `hero-{960,1600,2400,3840}.webp` | Page opener, full-bleed behind the headline (generated 2026-11-05) | `6549a7cc-95cb-409a-8b2d-b19f8b461aa8` (image id) | 3840×1648, 21:9, 4k | Documentary dawn in Almaty: four unbranded white rear-loaders on an empty poplar-lined avenue heading toward the snow-capped Zailiysky Alatau; open pale sky upper left for the headline. No logos, lettering, readable plates or people. |
| `crew-{960,1600,2400,3840}.webp` | Proof section, full-width band | `32c973e4-eb64-4a25-bafe-cd580bffc3a9` | 3840×1648, 21:9, 4k | Candid early-morning shot: a worker wheels a container to an unbranded garbage truck on a microdistrict street. No logos, lettering or readable plates. |
| `cab-{960,1600,2400,3840}.webp` | Photo pause before #driverapp on the landing page; was also the DriverApp page opener until 2026-11-06 (generated 2026-11-06, quality xhigh, 4k) | `b2a14344-2084-4f9e-b6f8-bf1e074ea4b3` | 3840×1648, 21:9, 4k | Early morning in Almaty, inside the cab of a white garbage truck at a microdistrict container site: gloved hand on the wheel, a rugged tablet in a dashboard mount with its screen lost in glare, euro containers under a shelter, Alatau in haze. No logos, lettering, readable plates or faces. |
| `driver-{960,1600,2400,3840}.webp` | DriverApp page opener (driverapp.html #top), full-bleed behind the headline and the app prototype (generated 2026-11-06, quality xhigh, 4k) | `919c2d60-e526-45ae-ba8c-d570e3f91295` | 3840×1648, 21:9, 4k | Sunrise at an Almaty microdistrict container site: a driver in a navy hi-vis jacket checks his route on a rugged tablet (screen turned toward him, no interface visible), an unbranded white rear-loader behind him on the right, four grey and green euro containers under a shelter on his left, panel blocks and the Alatau in haze. No logos, lettering, readable plates or signage. |
| `site-{960,1600,2400,3840}.webp` | Photo pause before #clients (generated 2026-11-06, quality xhigh, 4k) | `0c00e7f4-4f84-4e4c-87de-428f141f1518` | 3840×1648, 21:9, 4k | A municipal container site in an Almaty microdistrict: five grey and green euro containers under a light shelter between a Soviet-era block and ground-floor shops with blank awnings. No logos, signage text, readable plates or recognizable faces. |

## Platform photo-proof modal (`images/platform/proof/`)

Generated 2026-11-05 with Higgsfield GPT Image 2.5 (`gpt_image_2_5`), quality `high`, 4:3, 2k (2336×1744 masters, not committed), encoded to 1280px WebP q76. Each "after" is an image edit of its "before" (same camera, waste removed). Shown in the job photo-report modal; the scene is picked by site type.

| Files | Scene | Before job id | After job id |
|---|---|---|---|
| `b1.webp` / `a1.webp` | Roofed courtyard shelter with six 1.1 m³ euro containers | `be113361-65b1-465b-ada4-71176a9ca067` | `4f7e925f-72f2-48c6-8735-9d0d612d47ca` |
| `b2.webp` / `a2.webp` | 8 m³ skip with bulky waste (KGO / skip sites) | `2c691bf1-dc11-4708-8f73-0c4e6b14799e` | `7503e1e8-edcb-45bd-8425-90d237e8f735` |
| `b3.webp` / `a3.webp` | Fenced pad behind a school, four green euro containers | `ca4bd04b-2c34-4b79-9f55-feef9f5a23d0` | `c1797ae7-f7a3-4a95-b8f4-9b0cc7825a36` |
| `b4.webp` / `a4.webp` | Street-side pad with wheeled bins and euro containers | `59e8ad61-6965-403d-b102-83105ce0f744` | `82cc672d-0eb6-4688-8ab6-3d35e47d520f` |

`message-state.svg` is exported from Figma (Raccoon AI Desktop, node 19635:35376).

## AI-dispatcher stage map (`images/dispatch-map-1020.webp`, `images/dispatch-map-2040.webp`)

A 1020 × 500 crop (map x 550–1570, y 280–780) of `images/platform/map-almaty.webp`, the 2GIS backdrop already used by the Platform screen. The 2040px version was upscaled on 2026-11-05 with Higgsfield Topaz (`topaz_image`, variant Text Refine). The upscale misspelled two labels («Парк Карагайлы», «Сапаргали Бегалина»), so those areas were replaced with a Lanczos upscale of the original pixels. The «High Fidelity V2» variant was tried and rejected because it rewrote more labels. Map data © 2GIS; the stage shows the credit.

## Dark-theme variants (`*-dark.webp`, generated 2026-11-06)

Every image has a `-dark` twin next to it, shown when the page is in dark mode (toggle in the dock and the header; script.js swaps them). Masters are not committed.

**Photos** — Higgsfield GPT Image 2.5 (`gpt_image_2_5`) image edits of the light masters: same camera, framing and objects, re-lit as a pre-dawn Almaty night (street and work lights on, lit windows). Encoded to the same widths and qualities as the light files. The hero keeps a clean navy sky at upper left for the headline.

| Files | Job id |
|---|---|
| `hero-{960,1600,2400,3840}-dark.webp` | `afa221d1-6d62-4e36-af88-237a6f48d7a0` (xhigh, 4k) |
| `depot-{640,960,1280,1792}-dark.webp` | `2b4ba756-69ad-43cb-a084-350ead2341e7` (xhigh, 2k) |
| `cab-{960,1600,2400,3840}-dark.webp` | `b495eac9-cf06-4208-8593-b54faa95e606` (xhigh, 4k) |
| `site-{960,1600,2400,3840}-dark.webp` | `7d0eed17-917d-456b-abbb-2c58a93e111b` (xhigh, 4k) |
| `driver-{960,1600,2400,3840}-dark.webp` | `818ce214-a0e0-4c66-a08c-907b4d8d15eb` (xhigh, 4k) |
| `crew-{960,1600,2400,3840}-dark.webp` | `3c82a595-6de0-4286-918f-3de4f6af2f0d` (xhigh, 4k) |

**Photo proof** (`platform/proof/{a,b}{1-4}-dark.webp`) — quality high, 2k, 1280px WebP q76. Each night "before" is an edit of the light "before"; each night "after" is an edit of the clean light "after" with its night "before" as the lighting reference, so a pair stays one camera position. (Editing the night "before" to remove waste was tried first and left the waste in place.)

| Pair | Before job id | After job id |
|---|---|---|
| 1 | `edfeeb34-cb71-4c13-b73f-477da86c962d` | `7ceeecd6-6ab5-4aa2-835c-87e79e16e5f8` |
| 2 | `3be63135-5a8f-4551-8790-4ccbb839205b` | `6005930d-eec3-4e13-8ec0-45aed63befc5` |
| 3 | `4346a926-da50-4833-a0de-4be6147b9dac` | `89219d7c-e6c7-4ca4-bc33-a9f842d02a4e` |
| 4 | `a450a052-36fd-4898-851c-e51aea132966` | `51cbd104-201a-45e5-9b6f-6ccde0f1d200` |

**Truck illustration** (`platform/garbage-truck-green-dark.webp`) — the same truck re-cut by GPT Image 2.5 onto a transparent background (the light file sits on opaque white), job `225c45ca-e802-4beb-92f3-4bb8b246f9cc`, 192px WebP with alpha.

**Maps** (`dispatch-map-{1020,2040}-dark.webp`, `platform/map-almaty-dark.webp`) — not generated: a generative redraw garbles the 2GIS street labels (see the Topaz note above). They are a deterministic per-pixel recolor of the light maps (sharp): neutral ground, roads and labels invert onto a slate-navy ramp, arterials and metro marks keep their amber/red, parks and hills become a muted teal-green. Labels stay pixel-exact. Map data © 2GIS.

Not varied: the top-down truck markers (`platform/trucks/*.png`, transparent) and `message-state.svg` read on both themes.

**DriverApp phone** (`driverapp/`) — not generated. From the Figma file «Raccoon AI Mobile Apps» (DriverApp frames), exported through the Figma MCP on 2026-11-06:
- `map-city.webp`, `map-near.webp`: the frames' «Route Trace» 2GIS rasters (1919×1079), WebP q80. Map data © 2GIS. `*-dark.webp` are the same deterministic per-pixel recolor as the other maps (slate-navy ground, amber arterials, muted parks).
- `site-before.webp`, `site-after.webp`: the camera-frame photos (overfilled and emptied container site, 800×600), WebP q82. Real field photos from the design file.
- `avatar.webp`: the Figma «Profile Pictures» image, 120px.
- `driver-photo.webp`: the photo in the Figma «Profile» frame (15310:30337), 1024px PNG downscaled to 320px WebP q84.
- `truck-tbo.png`: a copy of `images/Truck on map/Мусоровоз ТБО/State=Default.png` (56×56), the map marker on the DriverApp phone and tablet and in the «КП запаркована» illustration. It replaced `truck-musorovoz.svg`, the Platform replica's inline render of the same component, which drew stray white wheel shapes.
- `icons/*.svg`: icon exports from the same frames, unchanged; `icons/month-prev.svg` joins the two layers of the «Back Icon» export (white disc, dark chevron) into one file.

**Client App phone** (`clientapp/`) — not generated. From the same Figma file (Client App frames: order creation, Кто встретит, Дата вывоза, the order statuses, the photo report), exported through the Figma MCP on 2026-11-07:
- `photo-before-1.jpg`, `photo-after-1.jpg`: the report photos (800×600 JPEG), real field photos from the design file.
- `icons/*.svg`: icon exports from the same frames; `truck-container-blue.svg` and `truck-garbage-green.svg` are the «Truck on map» components with the export's background and clip rectangles removed.
- `icons/history-head-blue.svg`, `tab-history-on.svg`, `tab-orders.svg`, `download-white.svg`, `go-circle-dark.svg`: icon exports from the «История заявок» frames (12995:22254, 20151:17820) for the #report phone.
- The map is not a new file: the Client App frames use the same «Route Trace» 2GIS raster as DriverApp, so the phone shows `driverapp/map-near.webp` (and its dark recolor).
