# Image provenance

All photographs on the landing page are AI-generated illustrative images, not photos of a real operator, fleet or pilot. Replace them with real field photography from the pilots when it is available.

Generated 2026-11-04 with Higgsfield, model GPT Image 2.5 (`gpt_image_2_5`), quality `xhigh`. Masters were downloaded as PNG and encoded to WebP (sharp 0.33.5, q78; q72 above 2000px). Masters are not committed.

| Files | Used in | Job id | Master | Prompt summary |
|---|---|---|---|---|
| `depot-{640,960,1280,1792}.webp` | AI-dispatcher section, behind the fleet panel | `a980ab7c-0ca0-435d-8e55-5343227ebd20` | 1792×2240, 4:5, 2k | Dawn at a waste-collection depot near Almaty: unbranded white rear-loaders and a skip loader, Tien Shan behind. No logos, lettering, readable plates or people. |
| `city-{640,960,1280,1792}.webp` | Not used since the Sentinel section was removed (was behind the Sentinel panel) | `99764daa-0154-42d6-9323-4dcdd1a587f7` | 1792×2240, 4:5, 2k | Elevated view of Almaty at blue hour: microdistricts, lit avenues, Zailiysky Alatau. No text or signage. |
| `hero-{960,1600,2400,3840}.webp` | Page opener, full-bleed behind the headline (generated 2026-11-05) | `6549a7cc-95cb-409a-8b2d-b19f8b461aa8` (image id) | 3840×1648, 21:9, 4k | Documentary dawn in Almaty: four unbranded white rear-loaders on an empty poplar-lined avenue heading toward the snow-capped Zailiysky Alatau; open pale sky upper left for the headline. No logos, lettering, readable plates or people. |
| `crew-{960,1600,2400,3840}.webp` | Proof section, full-width band | `32c973e4-eb64-4a25-bafe-cd580bffc3a9` | 3840×1648, 21:9, 4k | Candid early-morning shot: a worker wheels a container to an unbranded garbage truck on a microdistrict street. No logos, lettering or readable plates. |
| `cab-{960,1600,2400,3840}.webp` | Photo pause before #driverapp (generated 2026-11-06, quality xhigh, 4k) | `b2a14344-2084-4f9e-b6f8-bf1e074ea4b3` | 3840×1648, 21:9, 4k | Early morning in Almaty, inside the cab of a white garbage truck at a microdistrict container site: gloved hand on the wheel, a rugged tablet in a dashboard mount with its screen lost in glare, euro containers under a shelter, Alatau in haze. No logos, lettering, readable plates or faces. |
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
