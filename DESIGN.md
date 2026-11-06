---
name: RaccoonAI
description: AI dispatch for waste removal, shown as live product on a white operations ground.
colors:
  ink: "#080a11"
  ink-hover: "#232838"
  ink-disabled: "#4a5263"
  body: "#242a35"
  muted: "#586579"
  page: "#ffffff"
  tint: "#f1f5f9"
  tint-hover: "#e4eaf1"
  line: "#e2e8f0"
  line-strong: "#cbd5e1"
  line-hover: "#94a3b8"
  map-ground: "#eef2f6"
  ai: "#7008e7"
  ai-text: "#6a0fe0"
  ai-soft: "#ede9fe"
  ai-line: "#c4b4ff"
  action: "#155dfc"
  action-halo: "#bedbff"
  status-created: "#f0b100"
  status-created-ink: "#6b4a00"
  status-created-soft: "#fef6d8"
  status-progress: "#2b7fff"
  status-progress-ink: "#0f3fae"
  status-progress-soft: "#dbeafe"
  status-done-strong: "#008236"
  status-done-ink: "#0b4d26"
  status-done-soft: "#dcfce7"
  status-fail: "#fb2c36"
  error-ink: "#c10007"
  error-text: "#8a0b10"
  error-soft: "#fee2e2"
typography:
  display:
    fontFamily: "Onest, system-ui, sans-serif"
    fontSize: "clamp(40px, 4.6vw, 66px)"
    fontWeight: 600
    lineHeight: 1.04
    letterSpacing: "-0.036em"
  headline:
    fontFamily: "Onest, system-ui, sans-serif"
    fontSize: "clamp(32px, 3.6vw, 50px)"
    fontWeight: 600
    lineHeight: 1.08
    letterSpacing: "-0.03em"
  headline-sm:
    fontFamily: "Onest, system-ui, sans-serif"
    fontSize: "clamp(26px, 2.6vw, 36px)"
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Onest, system-ui, sans-serif"
    fontSize: "24px"
    fontWeight: 600
    letterSpacing: "-0.02em"
  lead:
    fontFamily: "Onest, system-ui, sans-serif"
    fontSize: "clamp(18px, 1.5vw, 21px)"
    fontWeight: 400
    lineHeight: 1.55
  body:
    fontFamily: "Onest, system-ui, sans-serif"
    fontSize: "18px"
    fontWeight: 400
    lineHeight: 1.6
  body-sm:
    fontFamily: "Onest, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.5
  button:
    fontFamily: "Onest, system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 600
    lineHeight: 1
  ui:
    fontFamily: "Medeo Sans, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.4
  ui-label:
    fontFamily: "Medeo Sans, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 600
    lineHeight: 1
  ui-micro:
    fontFamily: "Medeo Sans, system-ui, sans-serif"
    fontSize: "11px"
    fontWeight: 600
    letterSpacing: "0.04em"
  plate:
    fontFamily: "Medeo Sans, system-ui, sans-serif"
    fontWeight: 600
    letterSpacing: "0.02em"
    fontFeature: "tnum"
  note:
    fontFamily: "Onest, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 500
    lineHeight: 1.4
rounded:
  xs: "6px"
  sm: "8px"
  md: "10px"
  lg: "12px"
  card: "14px"
  panel: "20px"
  device: "34px"
  pill: "999px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  2xl: "48px"
  gutter: "clamp(16px, 4vw, 40px)"
  section: "clamp(72px, 10vw, 136px)"
  wrap: "1240px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.page}"
    typography: "{typography.button}"
    rounded: "{rounded.lg}"
    padding: "0 26px"
    height: "52px"
  button-primary-hover:
    backgroundColor: "{colors.ink-hover}"
  button-primary-disabled:
    backgroundColor: "{colors.ink-disabled}"
  button-quiet:
    backgroundColor: "{colors.tint}"
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.lg}"
    padding: "0 26px"
    height: "52px"
  button-quiet-hover:
    backgroundColor: "{colors.tint-hover}"
  button-sm:
    rounded: "{rounded.md}"
    padding: "0 18px"
    height: "42px"
  status-created:
    backgroundColor: "{colors.status-created-soft}"
    textColor: "{colors.status-created-ink}"
    typography: "{typography.ui-label}"
    rounded: "{rounded.pill}"
    padding: "6px 10px"
  status-progress:
    backgroundColor: "{colors.status-progress-soft}"
    textColor: "{colors.status-progress-ink}"
    typography: "{typography.ui-label}"
    rounded: "{rounded.pill}"
    padding: "6px 10px"
  status-done:
    backgroundColor: "{colors.status-done-soft}"
    textColor: "{colors.status-done-ink}"
    typography: "{typography.ui-label}"
    rounded: "{rounded.pill}"
    padding: "6px 10px"
  status-ai:
    backgroundColor: "{colors.ai-soft}"
    textColor: "{colors.ai-text}"
    typography: "{typography.ui-label}"
    rounded: "{rounded.pill}"
    padding: "6px 10px"
  status-ai-proposed:
    backgroundColor: "{colors.page}"
    textColor: "{colors.ai-text}"
  ui-card:
    backgroundColor: "{colors.page}"
    rounded: "{rounded.card}"
    padding: "14px 16px 16px"
    width: "min(300px, 46%)"
  product-panel:
    backgroundColor: "{colors.page}"
    rounded: "{rounded.panel}"
    padding: "clamp(20px, 2.4vw, 32px)"
  product-fragment:
    backgroundColor: "{colors.tint}"
    typography: "{typography.ui}"
    rounded: "{rounded.card}"
    padding: "14px"
  module-chip:
    backgroundColor: "{colors.tint}"
    textColor: "{colors.body}"
    rounded: "{rounded.pill}"
    padding: "6px 12px"
  switch-off:
    backgroundColor: "{colors.line-strong}"
    rounded: "{rounded.pill}"
    width: "44px"
    height: "26px"
  switch-on:
    backgroundColor: "{colors.ai}"
  input-field:
    backgroundColor: "{colors.page}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "0 14px"
    height: "52px"
  form-panel:
    backgroundColor: "{colors.tint}"
    rounded: "{rounded.panel}"
    padding: "clamp(24px, 3vw, 40px)"
---

# Design System: RaccoonAI

## Overview

**Creative North Star: "Live Operations, Light"**

The marketing site is a dispatch room with the lights on. A white ground carries near-black ink, and the product itself does the persuading: map, route, the AI pick panel, fleet switches and plan-vs-fact bars are rebuilt in HTML and CSS at real density, not shown as screenshots. Marketing copy is set in Onest with tight display tracking; everything that is product is set in Medeo Sans, so the reader always knows which voice is speaking.

Color is semantic before it is decorative. Violet belongs to the AI and nothing else. Job states use the client product's status colors, the same ones dispatchers see in the Platform. The primary call to action is ink, not a brand color, so the page's one strong hue stays reserved for "the AI did or proposes this". Depth is minimal: flat tinted bands and hairlines for structure, one soft lifted shadow only on UI that floats over the product stage.

As built, the world departs from the direction contract in three values: ink is #080a11 (contract #0b1220), the cool product grey is #f1f5f9 (contract #f2f4f7), and violet is the product design system's AI ramp (#7008e7 / #6a0fe0 / #ede9fe / #c4b4ff) rather than the contract's #3a2fd6. The build is normative.

**Key Characteristics:**
- White page, ink headings, slate body text; cool tint bands alternate with white sections.
- Product UI replicas at real density are the primary imagery; no illustrations, stock, or screenshots. Documentary field photography supports them in three places only (see Photography).
- Violet only for AI meaning; status colors only for job states; ink for the primary action.
- Two families: Onest for marketing voice, Medeo Sans for anything that is product UI.
- One soft shadow, used only on floating product UI.
- A single on-load signature sequence whose resting state is the end state.

## Colors

A neutral slate world with two semantic voices: the AI violet ramp and the product's job-status ramps.

### Primary
- **Dispatch Ink** (ink): headings, primary buttons, the depot marker, the check-list discs, the top rule of the proof list. Hover deepens toward Graphite Hover (ink-hover); the submitting state uses ink-disabled.

### Secondary
- **AI Violet** (ai): the AI's proposed route stroke, the new-pin fill and pulse ring, the "on" state of AI switches, the AI dot. This is the strongest hue on the page and it always means the AI.
- **AI Violet Text** (ai-text): AI labels and copy on light grounds ("Назначено AI", "Назначено AI · 10 точек", the "AI-диспетчер" product name), deepened for 4.5:1 on AI Soft.
- **AI Soft** (ai-soft): AI chip fill, the chosen candidate row in the AI pick panel.
- **AI Line** (ai-line): the hairline around the AI assignment card.

### Tertiary
- **Product Action Blue** (action): borrowed from the product's action surface. Used for the focus outline, input focus border (with Action Halo, action-halo, as the 3px ring) and the DriverApp point number. Not a marketing CTA color.
- **Status ramps** (status-created, status-progress, status-done, status-fail families): the client product's job states. Created is amber-on-cream, In progress / En route is blue-on-ice, Done is green-on-mint, Fail is red. Strong values draw route lines, pins, the truck and bar segments; soft + ink pairs make chips.
- **Error** (error-ink, error-soft, error-text): invalid field border and message; error form-status panel.

### Neutral
- **Page White** (page): the default ground and the fill of every floating card, panel, input and table row.
- **Operations Tint** (tint): alternating section bands, quiet buttons, product fragments, module chips, the demo form panel. Hover deepens to tint-hover.
- **Map Ground** (map-ground): the stage map's base.
- **Body Slate** (body): running text. **Muted Slate** (muted): secondary text, meta, captions, legends; darkened so it holds contrast on Operations Tint.
- **Hairline** (line) and **Strong Hairline** (line-strong): section dividers, list rules, column separators; line-strong is the input stroke and the switch's off track; line-hover is the input hover stroke.

### Named Rules
**The Violet Means AI Rule.** AI Violet and its ramp mark only what the AI did, proposes, or controls. Never use it for a CTA, a link, a heading accent, or decoration.

**The Ink Action Rule.** The primary call to action is Dispatch Ink on white. A colored CTA would compete with the AI's meaning.

**The Shared Status Rule.** Job states use the product's status ramps with the same wording the product uses. The same status renders identically everywhere it appears.

## Typography

**Display Font:** Onest (with system-ui, sans-serif), self-hosted 400-700, cyrillic and latin Onest has no Kazakh letters, so on Kazakh pages (`html[lang="kk"]`) marketing text uses Medeo Sans, the product font, which covers them.
**Body Font:** Onest
**Label/Mono Font:** Medeo Sans (with system-ui, sans-serif), the RaccoonAI product font, self-hosted as one variable file (fonts/MedeoSansVariable.woff2, 100-900, cyrillic with Kazakh letters and latin), for product UI

**Character:** Onest is a warm, geometric grotesk that tightens well at display sizes and reads comfortably in Russian body copy. Medeo Sans is the product's own UI face; using it inside every replica makes the rebuilt UI read as the real product.

### Hierarchy
- **Display** (600, clamp 44-88px, 1, -0.04em, max 12ch): the Platform h1 only, balanced wrapping. It is the page's single display headline; every other block, #dispatcher included, opens on Headline.
- **Headline** (600, clamp 32-50px, 1.08, -0.03em): section headings. **Headline Small** (600, clamp 26-36px, 1.15, -0.025em) for sub-section heads; the proof heading uses clamp 28-40px.
- **Title** (600, 24px, -0.02em): product names; the four-view headings use 22px / -0.015em.
- **Lead** (400, clamp 18-21px, 1.55, max 34ch in hero): the hero supporting line; section intros use clamp 18-20px at max 62ch.
- **Body** (400, 18px, 1.6; 17px under 600px): running text. Check-list items 17px / 1.55 at max 56ch. **Body Small** (15px): nav, "where" lines, feature descriptions, footer.
- **Button** (600, 17px, line-height 1; 15px on small buttons).
- **UI** (Medeo Sans 400, 13-14px): text inside product replicas. **UI Label** (Medeo Sans 600, 13px; 12px in table rows): status chips. **UI Micro** (Medeo Sans 600, 11-12px, 0.04-0.05em, uppercase): column headers and group labels inside product replicas only.
- **Plate** (Medeo Sans 600, tabular figures, 0.02em, no wrap): vehicle plates such as "123 ABC 02", wherever they appear.
- **Note** (Onest 500, 13px, muted): short interaction hints under a replica when it has controls («Кнопка работает»).

### Named Rules
**The Two Voices Rule.** Onest speaks for RaccoonAI; Medeo Sans speaks for the product. If it is a piece of the product, it is set in Medeo Sans.

**The Product-Only Caps Rule.** Uppercase tracked micro-labels exist only as table and group headers inside product UI. They never sit above a marketing heading.

## Layout

A single centered wrap (1240px max, fluid gutter clamp 16-40px). Sections breathe on a fluid vertical rhythm (clamp 72-136px), alternating white and Operations Tint bands. The hero is an asymmetric 5:7 grid with the product stage larger than the copy; split sections are 1:1 with a fluid gap (clamp 40-96px) and can reverse order; the demo section is 5:6.

Structure inside sections comes from hairlines, not boxes: the four-view row is a ruled 4-column strip with column dividers, products are a short 4-column index (each column under a line-strong rule: Title-size name, a 14px muted audience line, one 16px sentence, and a «К разделу ↑» link back to the product's section; no interface fragments), features are a 4-column ruled list, the proof list is 3 columns under an ink top rule, and #clients pairs two smaller topics as 1:1 columns (heading, paragraph, card below). Inner spacing steps on 8 / 12 / 16 / 24 / 32 / 48px.

Responsive: at 1080px the hero stacks, views go 2-up, features 2-up, products 2-column. Under 1280px the desktop dock gives way to the sticky header and its menu. At 860px splits and the demo grid stack, proof goes 1-up. At 600px body drops to 17px, views, features, products and form rows go single column, the AI-weighs list stacks each factor over its note, the stage map goes square and the step labels set under their numbers. Under 1280px the header is sticky at 72px with a near-opaque white fill and gains a hairline once the page scrolls; on desktop there is no header (see Navigation).

## Elevation & Depth

Mostly flat. Depth comes from tonal layering (white cards on Operations Tint, white rows inside tint fragments) and hairlines. A single soft two-layer shadow lifts only UI that floats: stage cards, the AI pick panel, the fleet panel. No gradients, no glass, no blur.

### Shadow Vocabulary
- **Floating UI** (`box-shadow: 0 1px 2px rgba(8, 10, 17, .06), 0 12px 32px -8px rgba(8, 10, 17, .16)`): cards and panels that sit above the stage or a section ground.
- **Hairline inset** (`box-shadow: inset 0 0 0 1px #e2e8f0`): the map frame and the brand mark tile.
- **Switch knob** (`box-shadow: 0 1px 2px rgba(0,0,0,.2)`): the toggle thumb only.

### Named Rules
**The One Shadow Rule.** There is one elevation. If a surface does not float over product UI, it has no shadow.

## Shapes

Softly rounded, product-like geometry. Radii step by role: 6px for the focus outline and brand tile, 8px for mini buttons and table rows, 10px for small buttons, inputs and fragment rows, 12px for buttons, view panels and status panels, 14px for floating cards and product fragments, 20px for the stage, product panels and the form panel. Pills (999px) for status chips, module chips, switches and bars. Chat bubbles use one tight corner (12px with 4px at the speaker's side). Dots and pins are circles.

## Components

### Buttons
Solid, quiet, and confident; no outlines, no icons.
- **Shape:** gently rounded (12px; 10px on small).
- **Primary:** Dispatch Ink fill, white text, 52px tall, 26px side padding. Small variant 42px / 18px, used in the header.
- **Hover / Focus:** fill shifts to ink-hover over .2s on the standard ease; press nudges down 1px; focus is the global 3px Action Blue outline at 3px offset. Submitting state uses ink-disabled with a progress cursor and "Отправляем…".
- **Quiet:** Operations Tint fill with ink text, hover tint-hover. The secondary hero action.

### Chips
- **Status chip:** pill, Medeo Sans 600 13px, 6px x 10px, leading 7px dot in currentColor. Created, In progress (also "Машина в пути"), Done, AI. Smaller in table rows (12px, 4px x 8px).
- **AI proposed:** white fill with a 1.5px dashed AI Violet outline; it becomes the solid AI chip once assigned.
- **Module chip:** pill, Operations Tint, body text 14px, 6px x 12px; lists Platform modules.

### Cards / Containers
- **Floating UI card:** white, 14px corners, Floating UI shadow, 14px 16px 16px padding, Medeo Sans. The AI assignment card adds an AI Line hairline.
- **Product panel** (fleet): white, 20px corners, Floating UI shadow, fluid padding (clamp 20-32px), header ruled off with a hairline.
- **Product fragment:** Operations Tint, 14px corners, 14px padding, white inner rows at 8-10px corners. Flat.
- **Form panel:** Operations Tint, 20px corners, fluid padding (clamp 24-40px), 18px field gap. Flat.
- **Next steps (demo copy column):** «Что будет после заявки» (19px h3) over a ruled `ol` of three steps (call, demo on their routes, pilot), each a 26px ink counter disc, a 17px ink title and a 15px muted line; max 46ch. It states the process only, no timing or terms the team has not committed to.

### Inputs / Fields
- **Style:** white, 1px Strong Hairline, 10px corners, 52px tall, Onest 17px ink; labels 15px 600 ink above with an optional "необязательно" in muted 400. Select uses a drawn chevron.
- **Hover:** stroke to line-hover.
- **Focus:** stroke to Action Blue plus a 3px Action Halo ring.
- **Error:** error-ink stroke and a 14px error-ink message below; form-level status uses error-soft / error-text, success uses status-done-soft / status-done-ink.
- **Contacts and fallback:** phone and email come from one `CONTACT` object in script.js. While a value is empty its row (and the whole `dl.contacts` when both are empty) stays hidden, and no message cites it. A request that cannot be sent says so, keeps the typed data, and, once the values exist, offers a prefilled mailto letter and a tel link. No bracketed placeholders ever reach the page.

### Navigation
**Desktop (≥1280px): the dock replaces the header.** There is no top bar. A fixed `nav.tree-nav` («Разделы страницы») sits at the left edge, 16px in and centred vertically in the window, bare on the page: no card, outline, shadow or CTA (the demo CTA lives in the hero and the form). It is 208px wide. Top to bottom: the brand (32px mark tile, 18px 700 wordmark, links to #top), a hairline, the section tree, a hairline, the language switcher. Every centre sits on one line at x = 24px: mark, rail, ticks, diamond and flag. All text starts at x = 52px.

Section tree: the current page's sections in page order; on the main page eight (Платформа, Заявки, AI-диспетчер, Плановый вывоз, Весовая, Жасыл Даму, Заказчики, Продукты), on driverapp.html three (Обзор, Экраны приложения, Навигатор и связь). Rows are 32px tall, 2px apart, with Onest 500 14px muted labels; the active and hovered label turns ink. The rail is a 1px line-strong hairline from the first row's centre to the last, with a 3px tick per section. An ink fill grows down it to the marked row (ticks it has passed turn ink), and a 7px ink diamond (1px radius) sits on that row. A shared 5% ink pill rests behind the marked label. The marker, fill and pill share one position on a critically damped spring (≈0.25s, no overshoot). It rests on the section whose top has passed 40% of the window, follows the pointer or keyboard focus across rows, and springs back on leave; a click moves it at once.

**Other page (`ul.tree-pages`, «Страницы»):** under the section tree, before the theme switch, a link to the site's other page only (the current page is not listed, user decision 2026-11-06): DriverApp (driverapp.html, Lucide `smartphone`) on the main page, Платформа (index.html, Lucide `layout-dashboard`) on driverapp.html. It is a 36px row built like the theme switch: a 20px icon on the x = 24px line, so it stays visible in the strip, and the label at 52px, muted, turning ink on a tint hover. A hairline closes the group. It sits outside the rail: the rail marks positions on this page, this row leaves it.

**Dock column.** `main` and the footer shift right by `--dock: clamp(0px, 1688px - 100vw, 224px)`, so page content always starts 264px from the window edge (40px clear of the dock). The labels therefore stay open beside the column, and below 1688px a white column holds the dock and full-bleed sections start after it. From 1688px the centred column leaves that room on its own and nothing shifts.

**Strip.** While the Platform screen (`.pf-frame`, wider than the column on large windows) is behind the dock, it clips to its left 48px: the mark, the rail with its ticks and diamond, and the language code. The clip also limits hit-testing. Hover, keyboard focus or an open language menu opens it again (0.36s clip slide, text fades in). The language menu opens upward over the section list. Reduced motion: no clip animation, and the marker jumps.

Layout clearance: on desktop `--edge: 80px` keeps the Platform frame at least 80px from the edges of its column. `--header-h` is 0, so the hero and the Platform fit use the full window height, and scroll-padding-top is 24px.

**Under 1280px: the header.** A sticky 72px header: brand mark tile and 20px 700 wordmark on the left; language switcher and small primary «Запросить демо» on the right, 12px apart. The sections move into a menu: a 42px hamburger (`details.m-nav`, labelled «Разделы страницы», becomes a close icon when open) right of the CTA opens a full-width white panel with the page's sections as 17px ruled rows, then the other page as one full-width 44px outlined button with its icon; it closes on a pick, Escape (focus returns to the toggle) or a tap outside. The CTA never wraps; under 380px the wordmark hides and the mark stays. Under 600px the header keeps the brand, the CTA and the menu only: the theme switch moves to a full-width outlined «Тёмная тема» button at the foot of the menu, under the language row. Footer repeats brand, city, and the same links plus «Запросить демо» on a hairline; on the main page the DriverApp link goes to driverapp.html.

Language switcher: on desktop it sits in the dock under the section tree (menu opening upward), without flags: the summary is the 14px 600 code (RU / KK / EN) in a 21px box centred on the dock’s 24px line, so it stays visible in the strip, with the chevron after it when the dock opens; the menu lists the three language names only. In the header it sits before the CTA as a 42px `details.lang` summary with a 21×14 flag (3px radius, hairline outline) and the 14px 600 code (RU / KK / EN) with a chevron; it opens a white 12px-radius menu with the one shadow listing Русский, Қазақша, English with flags, each in its own language, the current one on tint. Under 600px it leaves the header and appears as a row of three flag + code buttons at the foot of the mobile menu (current one outlined in ink). The switcher is `translate="no"` and never translated. Flags: Russia tricolour, Kazakhstan (sky blue, sun, eagle, hoist ornament), the United Kingdom for English.

Translation mechanism: i18n.js runs in <head>, chooses the language (?lang=, then the stored choice, then the time zone: CIS → ru, else en), hides the body until the dictionary has been applied (2.5s cap), and translates text nodes and aria-label/alt/placeholder/title by their Russian source; whole-node matches first, then Cyrillic runs, so text built later by script.js and the Platform replica is caught by a MutationObserver. Switching back restores the original Russian. Tooling lives in tools/i18n.

### Fleet Switch
A 44 x 26px pill toggle with a white 20px knob. Off is Strong Hairline, on is AI Violet; the knob slides 18px over .25s. Per-vehicle rows read "Назначено AI · N точек" in AI Violet Text when on and "Вручную · диспетчер" in muted when off. Turning the fleet switch off sets every vehicle to manual and disables the row switches (45% opacity).

### Product Stage and Signature Sequence
The third block (#dispatcher, Operations Tint, right after #intake so the request it assigns has already been introduced) is about the AI dispatcher only. Copy column: an h2 at Headline size (the same scale as every section heading, so the page has one hero), a lead on auto-assignment, a ruled `dl` of the five factors the AI weighs (SLA, site location, waste type, suitable vehicle, client priority), then a single underlined text link with a drawn down-arrow, «Как устроен контроль», to #ai-control. The block carries no demo button: the header, the Platform block and the form already ask for it. The stage map is the same 2GIS Almaty backdrop as the Platform screen, cropped to Алмалинский district (`images/dispatch-map-1020.webp`, with a 2040px Topaz upscale for dense screens) and shown at about 1:1. It sits under one SVG overlay that shares its 1020 x 500 coordinate system (object-position 0 50% and preserveAspectRatio xMinYMid slice keep the two aligned), with a small «© 2GIS» credit bottom-left. The route was traced along the streets of that crop with `tools/platform-block/trace-routes.js`: from the depot along Ауэзова, then east on Шевченко through numbered stops (8 and 9 done in green, 10 next in status-progress), with the AI leg to stop 11 (violet, pulse ring) at Шевченко × Желтоксан. The truck is the Platform design system's ТБО garbage-truck marker (TruckMarker «musorovoz»), heading along the street. The stage also holds the floating request card, and the **AI pick panel**: a floating card with an AI Line hairline ("Подбор машины", request · waste type · SLA, status chip) listing three candidate trucks, each with a drawn check or cross mark and the reason it was taken or passed over (the chosen row on AI Soft with AI Violet Text), and a footer with the route position and "Переназначить". The block uses the standard section padding, with the copy and stage top-aligned in a 5:7 grid (gap clamp 40-96px). On desktop the map stays inside the wrap at 420-470px tall with 20px corners, the request card sits 20px in from its top-left, and the panel overlaps the map's lower right by 112px with a 20px inset, clear of the route. The 3-step bar sits 24px above the map, so the story reads before it plays; at its right end a quiet text button with a drawn pause/play glyph («Остановить анимацию» / «Запустить анимацию», `aria-pressed`) stops the loop and shows the assigned end state (WCAG 2.2.2); under reduced motion it is hidden. Below 1081px the pick panel sits under the map, overlapping it by 72px (40px on phones); there it never fades out: while the request lands it waits in place, rows pending and the chip reading «AI подбирает», so no blank gap opens. The markup's default is the final, assigned state. The block's second half (#ai-control) is a 1:1 split: "Решения остаются за диспетчером" (Headline Small h3), the learning paragraph, two checks, and the depot photo stage with the fleet switch panel.

While the stage is at least 35% visible, JavaScript loops the sequence every 11.4s and pauses offscreen. The truck drives along the route legs with requestAnimationFrame, positioned and turned by the path itself (getPointAtLength, ease in-out). It is drawn under the pins, so a stop marker stays readable when the truck parks on it. The truck drives the live leg to stop 10 while the request lands and the AI checks trucks; on arrival stop 10 turns done green and the passed leg fades. After the assignment it drives the violet AI leg to stop 11, which also turns done. It holds for about 2s and starts over. There is no replay button. The steps: the new request lands as "Неназначено"; the pick panel appears with "AI подбирает" and checks each truck in turn (pending rows at half opacity with no verdict, the checking row's mark pulses in violet); the chosen row and the dashed violet route (drawn along a mask) show the proposal, and the chip reads "AI предлагает"; then the route turns solid, the chip becomes "Назначено AI" and the request turns "Машина в пути". Transitions use .6s on cubic-bezier(.16, 1, .3, 1). Under reduced motion or without JavaScript nothing plays and the end state shows; a global reduced-motion rule also removes all transitions, animations and smooth scrolling.

### DriverApp and Request Intake
**DriverApp has its own page (driverapp.html, user decision 2026-11-06: the main page was too long).** The main page keeps a short stop in story order, and every mention links there:
- **#driverapp teaser (main page, tint, between #schedule and #weighing):** a 1:1 split. The h2 «DriverApp: смена водителя в одном приложении», the lead, the four capabilities as a 2-column list (32px white icon tiles with the Lucide tab icons, 16px 500 ink labels; one column under 600px), then «Подробнее о DriverApp →» (the more-link with a right arrow that slides 3px on hover; links that leave the page point right, links within it point up or down). Beside it the cab photo (`cab-*`, 20px corners, 5:4, 4:3 under 600px), which replaces the cab photo pause.
- **Other links:** the fourth #schedule step names DriverApp as an underlined `.inline-link` (line-strong underline, 4px offset, ink on hover); the DriverApp column in #products reads «Открыть страницу →» instead of «К разделу ↑»; the dock, the mobile menu and the footer link the page.
- **driverapp.html:** the same header, dock, footer, script.js and dictionaries as the main page (script.js runs each block only when its markup is present). Order: the opener `#top`, built like the main page opener (shared `.pf-hero` rules, now in style.css): the cab photo (`cab-*`) full-bleed under the left daylight wash, filling the first viewport; on the left the badge «Raccoon AI DriverApp», the h1 in two lines «Смена водителя / в одном приложении», the lead, «Запросить демо» and the quiet «Посмотреть экраны», the store badges, and the device note on the white proof strip. On the right the **opener prototype** (`.dh-proto`, `role="img"` with a spoken summary): the HTML-built phone plays one stop as a loop (about 12s): the truck drives up to stop 1 on the route screen, a finger ring presses the site card, «Фотографии ДО» opens on an empty frame, the ring presses «Сделать фото» and the shot lands with a short white flash, the ring presses «Готово», and the finished task shows (ДО/ПОСЛЕ green). A white Platform card (plate, address, «Задание 1 · Вывоз ТБО», status chip) overlaps the phone’s left edge; its chip reads «Машина в пути» and turns «Выполнено» with both photo thumbnails at the same moment the driver closes the task (one job, one status). It runs only while 35% visible and in a visible tab, has the shared pause/play text button, and the markup (and reduced motion) is the end state. Under 1080px the stage stacks under the copy; under 860px the photo sits only behind the phone, fading in from the tint above; under 600px the Platform card moves under the phone. There is no separate cab photo band any more. Then #screens (tint, the tablist split below, h2 «Что водитель делает в приложении»), #stop (white, the one-stop flow below with its copy as the h2; the .flow panel turns tint on the white band), and the demo form on a tint band (the form panel turns white there).

On driverapp.html, under 860px the DriverApp copy column dissolves (display: contents) so the phone sits between the lead and the screen list that drives it. Under 1080px the DriverApp copy column dissolves (display: contents) so the phone sits between the lead and the screen list that drives it. Under 1080px the intake queue rows stack the source label above client and status.
- **#screens (driverapp.html, tint):** a split. The copy column holds four capabilities as a vertical WAI-ARIA tablist (route, before/after photos, problem report, schedule and earnings). The selected row has a tint fill and ink title; the others are muted. Arrow keys, Home and End move between rows. They switch the screen of an HTML-built phone on a tint stage: 300px wide, ink bezel 42px radius, screen 34px, the one shadow, Medeo Sans throughout.
  - **Phone screens:** the DriverApp Figma frames (Raccoon AI Mobile Apps) built at their 412×917 size plus a 30px status bar (time, punch-hole, signal, battery) so the rounded screen corners never clip the top bar; .ds is 412×947 design px, scaled to the bezel with --s = screen width / 412 (.6845 desktop, .6456 under 600px). Inside the phone the product speaks in the RaccoonAI Design System tokens (`.rds`: --surface-*, --text-*, --status-*, --radius-*), set in Medeo Sans as in the app; the DS night tokens live in style.css so both pages share them. Icons are the Figma exports in `images/driverapp/icons/`; the truck marker is the Figma «Truck on map / enroute · container» component (`images/driverapp/truck.svg`). 2ГИС green and Яндекс yellow are product truth in the mock.
  - **Shared chrome:** the Figma top bar (avatar photo, plate 384BCJ02, «Асаубаев Ерлан», «На линии») with its side padding raised to 16px, and the tab bar (История / Маршруты / Профиль, Маршруты selected).
  - **Map:** one map layer under every bottom sheet, the frames' own 2GIS rasters (`images/driverapp/map-city.webp`, `map-near.webp`, with night recolors) placed exactly as in Figma (object-fit cover at 0.85, frame px). Selecting the job zooms from the city view into the street view around pin 1 (1s). Bottom sheets are separate states anchored above the tab bar with the map tools (alert, flag, my location, back) riding on top; a state change fades the old sheet and lifts the new one in, and buttons that arrive with a state (Следующее задание, Завершить маршрут) open the sheet upward (grid-rows fold).
  - **The story (autoplay, ≈54s):** route list «Рейс 1» (the jobs scroll under the fixed header and come back) → tap job 1 → job sheet (2ГИС / Яндекс Карты / «Начать задание» swipe) → tap 2ГИС: the truck drives a blue route traced on the street centrelines with a turn at each crossing (up Чайковского, east on Шевченко, up to Жамбыла, east to the site), easing off into each turn, the line consumed behind it → swipe «Начать задание» (white knob, the green Figma progress trailing it; the idle swipe carries the Figma «Animated Light» glint) → task «Сделайте фото ДО», chip Начато → ДО → «Фотографии» (count 5 → 6 with +) → «Сделать фото»: the whole phone turns −90° into a landscape camera (frame corners, two hint pills, shutter; overfilled site photo) → shutter with a white flash → back upright to «Фотографии ДО» with the shot → Готово → ДО green, «Сделайте фото ПОСЛЕ» → a clock card on a dimmed screen, «10 минут спустя» (Onest: narration, not app UI) → ПОСЛЕ → camera with the clean site («Пустые контейнеры») → shot → «Фотографии ПОСЛЕ» with the shot → Готово → «Задание 1 выполнено», both green, «Следующее задание» → «3 часа спустя» → route list end (job 13, МСК «Точка разгрузки», 12 из 17, 85% fill) → swipe «Поехать на Разгрузку» → «Едем на Разгрузку»: the truck drives back through the grid and west on Курмангазы to the МСК flag → «Вы прибыли на точку» → swipe «Завершить маршрут» → «Рейс 1 · Успешно завершен в 16:23», 88:33 green. A finger ring marks each tap and drag. The Platform card follows the same job: Машина в пути → Начато (on the swipe) → the ДО thumbnail → Выполнено with both thumbnails; it steps back for the camera and after the job.
  - **Autoplay mechanics:** one story clock (requestAnimationFrame) fires state keyframes as data-* attributes on .dh-proto (data-sheet, data-scr, data-task, data-pg, data-cam, data-skip, data-swipe, data-sync, data-zoom) and places the truck from the clock, so pause, seek and resume always land on a coherent frame. The list follows the story: «Маршрут по порядку» for the route, the drive and the unload, «Фотоотчёт до и после» from the ДО tap to «Следующее задание»; then «Сообщить о проблеме» and «График и заработок» hold 5s each and it loops. The selected row's 2px hairline fills over its stretch. A click jumps there (story tabs play on, static tabs hold, paused). It pauses while keyboard focus is in the list, offscreen (under 35% visible) and in a hidden tab, and has the shared pause/play text button (WCAG 2.2.2).
  - **Reduced motion:** no autoplay and no button; the tabs jump to still frames (route list, the closed task, the static screens).
  - **Under the tabs:** classic black App Store / Google Play badges (48px, 10px radius), shown as static images (`span role="img"`, no hover) until real store links exist, then a one-line device note with a tablet icon: «Подойдёт личный смартфон водителя, но лучше всего — корпоративный планшет», muted, with «корпоративный планшет» in ink and 600 weight.
- **DriverApp, one stop (#stop on driverapp.html, .drv-more):**
  - **Copy:** the section h2 «В пути навигатор, на точке DriverApp. Связь не обязательна» in a 5fr column, its paragraph in a 7fr column beside it (stacked under 680px).
  - **Flow stage:** a white .flow stage (the section is tint) tells a single stop in four steps, left to right:
    1. the job-selection phone, with its 2ГИС button ringed in ink;
    2. a white navigator card, where the app is in the background;
    3. the photo phone, showing an offline banner, ДО/ПОСЛЕ done, and "Следующее задание";
    4. a Platform card that receives the queued photos later.
  - **Phones:** these are smaller (256px, 528px screen) and follow the DriverApp Figma designs (Driver Mobile React, ТБО процесс). The map is the 2GIS crop and the truck is the ТБО marker. Their in-app colours (2ГИС green, Яндекс yellow, green photo buttons) are product truth inside the mock only.
  - **Network rail:** under the steps, one network line runs edge to edge: solid ink while online, dashed line-strong while offline, each segment with a 13px caption. It is not a job status, so it uses no status ramp.
  - **Layout:** steps use subgrid rows (title / rail / content), so the network status sits directly under each step heading and rails align. There are 4 columns on desktop, 2×2 under 1080px (no arrow across the row break), and 1 under 680px (arrows turn downward, rows size to content).
  - **Step markers:** each title carries a 24px ink index circle. White 28px arrow chips with the one shadow sit in the gutter between steps, level with the phones.
  - **Motion:**
    - The 2ГИС button pulses slowly four times, then rests: 1.8s ease-in-out, scale 1→1.07, with a soft green glow.
    - The first time the stage comes into view, steps enter one at a time, 2.2s apart. The current index fills ink and the others go outlined.
    - Inside each step the parts cascade:
      - the title at 0s;
      - the network line, drawn left to right with clip-path (1.1s, ease-in-out, from 0.15s), so adjacent segments read as one line being drawn;
      - its caption at 0.45s;
      - the phone or card at 0.55s, with opacity, an 18px lift and 6px blur;
      - the card's own children, staggered 110ms apart from 0.75s;
      - the arrow at 1.5s, with a slight overshoot.
    - The rail line is a ::before stripe (solid ink or a dashed gradient), not a border, so it can be drawn.
    - After the cascade every step stays on screen; nothing is hidden again. Then the highlight makes one pass: every 3.2s it moves to the next step (index filled ink, title ink, card lifted 6px); from 681px up the other steps step back (title muted, card at 55% opacity). After the fourth step it rests with every step at full strength and does not run again. On the single-column phone layout there is no dimming.
    - Without JS or with reduced motion, all four steps show and nothing pulses.
  - Route: a progress bar and a numbered timeline (done in green, current in Action Blue with a halo and "Начать работу", unload last).
  - Photo report: the before and after shots from `images/platform/proof` (b1/a1).
  - Problem report: radio options and a comment.
  - Schedule and earnings: a week strip and monthly earnings.

  Inside the phone, Action Blue is the product's own action colour. In #products the DriverApp row reads «Для водителей · iOS и Android», matching the store badges.
- **#intake (white, the second block):** a split. The copy column has a ruled `dl` of the three channels, each with a 16px glyph on a tint tile: Client App (Lucide `smartphone`), WhatsApp bot (the design system `whatsapp` icon, filled in icons-success #00a63e) and SIP telephony (Lucide `headset`). Lucide glyphs use their 24px grid at stroke 2; the same three glyphs mark the channel cards and the queue rows. The stage is a wiring diagram in product cards:
  - three channel cards side by side (equal columns, 12px gap, 8px on phones), each with its glyph tile and name: Client App (task, address and an Action Blue «Отправить» pill), WhatsApp (an incoming bubble on the #efeae2 chat ground) and Звонок (a green «Входящий звонок» dot and the caller's number);
  - dashed Line Strong wires (1.5px, 4/5 dash), drawn by script.js in px on every resize, curving from each card's foot to one «Платформа» port pill (the brand mark plus the word) that sits on the queue card's top edge;
  - the Platform's "Заявки · сегодня" queue with a running «N принято» count, clipped to four rows, each with a source label, client, task · address and a shared status chip.

  The loop (2.8s per request) sends one request at a time: the card takes an Action Blue ring and its wire turns pale blue, a 22px Action Blue segment runs down the wire (1.1s), and on arrival the port flashes, the request lands at the top of the queue as «Неназначено» (tinted; the list slides down one row and the oldest row leaves under the clip) and the rows below step on to «Назначено AI» and «Машина в пути». The idle card then fades to its channel's next request. Six requests, two per channel, rotate; the markup is the state after a full cycle, so the loop has no seam. It runs only on screen, stops in a hidden tab, and has the same pause/play text button as the dispatcher stage (WCAG 2.2.2). Under reduced motion it stays on the static markup and the button is hidden.

### Scheduled Collection and Client Registry
Page order follows one job from request to report: #top Platform (tint), #intake (white), #dispatcher (tint), #schedule (white), the #driverapp teaser (tint; the full DriverApp story is on driverapp.html), #weighing (white), #zhasyl (tint), the site photo pause, #clients (white), the crew photo pause, #products (tint), proof «Пилоты и партнёры» (white), demo. The "Одна заявка, четыре экрана" block and the #city Sentinel block were removed; the Sentinel row was later removed from #products as well, and the products h2 no longer mentions the city.
- **#schedule (tint band):** a 1:1 split. On the left are the Headline, the lead and a ruled, numbered `ol.cycle` with four steps: route group, generation at a set hour, approval, DriverApp. The numbers are Medeo Sans and muted, and the sequence is real. On the right is the route-group panel: the group name, its trucks, its sites and the daily generation time, then tomorrow's route sheets in a tint table with white rows (plate, crew, points, status) and an ink "Утвердить все". Clicking the button turns each neutral "Ждёт утверждения" chip (`status-wait`: tint fill, slate dot) into the done-green "Утверждён", staggered by 160ms, and the footer reads "Отправлено в DriverApp". It is not AI, so there is no violet. Below the split, "Три типа графиков" (Headline Small) sits beside a one-line explainer, then the **schedule matrix**: a white floating table for November 2026 with one row per site (name and type · rule) and one column per day. Weekends are faintly shaded, pickups are 16px ink squares, and the next shift's column (6 ноября) is outlined in ink and tagged "лист на 6 ноября". Phones show the first 10 days. An sr-only paragraph summarises the matrix.
- **#clients (white):** the registry as a split, then «Заказчики по нормативу» and «Двусторонняя синхронизация с 1С» side by side (`.clients-pair`, stacked under 860px), each a Headline Small h3, one paragraph and its card:
  - **Registry:** a BIN search field in the focused-input style, a floating client card with a "БИН проверен" chip and the contract's tariff table (task type → price per м³ or per request), and a muted duplicate-guard note.
  - **Clients on norm:** a site card listing attached legal entities with fixed monthly fees and a load meter. The meter is an ink fill up to capacity, a status-fail overflow segment and an ink capacity tick, with the % in error ink. Under it is the suggested schedule change.
  - **1C sync:** RaccoonAI ⇄ 1С:Бухгалтерия, the three synced objects ticked "совпадает", a two-line event log for a new client, and document chips (ЭАВР, ЭСФ, paper).

  Replicas carry no "demo data" caption; a muted note appears only to say what is interactive.

### Weighbridge
**#weighing (white, after the #driverapp teaser):** the landfill weighbridge integration, which follows the job to the landfill. Facts confirmed by the user (2026-11-06): the weighbridge sends each weighing automatically and the Platform matches it to the trip by plate number; the outcomes are tonnage per trip, truck and day, and tonnage per customer and site. Nothing else (anomaly flags, akimat reports, billing by weight) is claimed.
- **Split (5:5, top-aligned):** Headline h2 «Интеграция с весовой: вес каждого рейса без ручного ввода», the lead, then a four-step `ol.cycle` with Lucide icons (weight, cloud-upload, link, chart-column): weighing, record goes to the Platform, match by plate, tonnage in reports.
- **Stage (`.wb-stage`):** a weighbridge record card (400px max, centred: «Весовая · Полигон Айтей», record number, the plate in the outlined Plate style, time, and a tint strip of Брутто / Тара / Нетто with the net cell outlined in ink), a 56px dashed Line Strong wire, and the trip card below it with the «Платформа · по госномеру» port pill on its top edge (the #intake port). The trip card lists three of the trip's sites with container count and their share of the weight, an «и ещё N площадок» row with the rest, and the unload row: «Разгрузка · Полигон Айтей», record · time, Нетто, and a chip («Ждём заезд на весовую» status-wait → «Вес получен» done). It is not AI, so there is no violet.
- **Loop (9s, two records alternating):** the record is weighed (gross, tare, net appear 0.8s apart; pending values sit at 35% opacity), a 22px Action Blue segment runs the wire, the port flashes, the unload row takes an Action Blue ring on sel-soft and fills, the chip turns «Вес получен», then the site weights fill 140ms apart. It runs only while 35% visible and in a visible tab, has the shared pause/play text button, and under reduced motion stays on the markup (the first record, landed).
- **Outcomes (`.clients-pair` below):** «Тоннаж по рейсу, машине и дню» with a floating card of three trucks, each a segmented bar (one segment per trip, ink and muted alternating, scaled to 20 t) and its total, over a tint fleet-total row (278,5 т, matching the Platform screen); «Тоннаж по заказчику и площадке» with a floating card whose segmented tab control (Заказчики / Площадки, arrow keys, Home / End) swaps two ruled lists, each row a name, a muted meta line, the tonnage and a 6px ink share bar. A note «Переключатель работает» sits under the list.

### Zhasyl Damu reporting
**#zhasyl (tint, after #weighing):** reporting to Жасыл Даму, the EPR (РОП) operator that requires digital proof of collection from city container sites. Copy is the user's (2026-11-06), with "Raccoon AI" set as the brand's RaccoonAI. The user's overline «ИНТЕГРАЦИЯ С ЖАСЫЛ ДАМУ» is left out under the Product-Only Caps Rule; the nav label «Жасыл Даму» names the block instead. Claims: photos, weighbridge data and GPS tracks are collected during work and sent daily via API, with a visible send status. Nothing else (acceptance by Жасыл Даму, retries, deadlines) is claimed.
- **Split (top-aligned):** Headline h2 «Отчётность для Жасыл Даму — без лишней работы» (Жасыл Даму kept on one line), the lead, then «Как это работает» (19px h3) over a three-step `ol.cycle` (Lucide settings, truck, send).
- **Send log (`.zd-log`, floating):** «Отправка в Жасыл Даму», «Ежедневно по API · контейнерные площадки города», a RaccoonAI → Жасыл Даму pill, then a tint table of days (day, sites, photos, trips, status): today is status-wait «Сбор данных», earlier days are done «Отправлено». A muted foot names what each send holds. Below 681px and between 861 and 1240px (where the card is too narrow for five columns) the header row hides and each day stacks: date and status on top, the three counts with their units (`.zd-unit`, in the markup so they translate) beneath.
- **«Что уходит в Жасыл Даму» (Headline Small h3 + three cards):** flat white cards (20px, no shadow, on the tint band; subgrid rows keep headings level), each opening on its data on a tint fragment: the before/after photo pair (proof b2/a2) with address · trip · plate; the weighbridge record (plate, landfill · time, an ink-outlined Нетто 6 840 кг, record · trip, matching #weighing); a drawn street grid with the GPS track in ink, done-green stops, an amber stop marker («Стоянка 6 мин») and an ink unload square. Then a 19px h4 and the user's sentence. 3 columns, 2 under 1080px, 1 under 680px.

### Platform Screen
The page opens on the Platform section (it owns the h1 and #top; #intake follows, then the AI-dispatcher block with the animated stage, its headline an h2 at Headline size). It opens on a full-bleed dawn photograph (an unbranded fleet on an Almaty avenue under the Alatau; masked to fade into the tint at its foot, a left-side daylight wash under the copy) that carries the headline at a bold Display size (clamp 44-88px, line-height 1, -0.04em, max 12ch), the lead (max 40ch) and two actions («Запросить демо», «Посмотреть интерфейс» to the screen), then the proof line: a white 12px-radius strip, 14px body text, «Пилоты в Алматы и Астане · Партнёр по разработке — ТОО «Ак Тартып» · Ситуационный центр Алматы» with small line-strong dot separators (stacked without dots under 600px), with generous space above and below the copy. The hero fills the first viewport so only the top of the screen (clamp 88-148px) shows; the screen rises over the photo's lower edge (clamp 64-112px). Under 860px the photo follows the copy at 4:3 and the screen overlaps it by 56px. **Screen magnet:** a manual scroll that comes to rest with the screen within 30% of the window (260px at most) of its anchor spot glides on to exactly where «Посмотреть интерфейс» (`#pf-viewport`) lands it: its top at the page scroll-padding (24px on desktop, under the 88px header below 1280px), using the same native smooth scroll. One pull per approach (it re-arms once the screen leaves the zone, so nudges stay put); it waits for a lifted finger, ignores scrolls started by in-page links, falls back to a 180ms quiet spell where `scrollend` is missing, and is off under reduced motion. The section shows the real dispatcher dashboard (Figma RaccoonAI Desktop, node 4296:5593), not a marketing replica. It is the one exception to the Two Voices Rule: inside `.rds` the product speaks in its own design system, Medeo Sans and the RaccoonAI Design System tokens (`--surface-*`, `--text-*`, `--status-*`), with components server-rendered from `RaccoonDS` (SideNav, SearchField, FilterButton, IconButton, PlateNumber, Avatar, StatusBadge, PercentBadge, DateButton, Select, MapPin, TruckMarker, Button, Separator). Organisms (map, truck card, status block) are laid out in `platform.css`.
- **Frame:** the screen is always laid out at its full 1600 x 980 design size and scaled as a whole, like browser zoom, so text, spacing and icons shrink together and nothing inside is squeezed. The scale is the smaller of two: what fits the frame width, and what fits the window height below the sticky header (with 62px for the caption row). The height fit never goes below 0.8; below that the screen runs past the fold and the page scrolls. When the height limits the scale, the screen, the tour wrapper and the caption row narrow to the scaled width (`--pf-fit`) and stay centred. Inside the screen the side-nav items keep 40px, the status row 384 to 420px, the Gantt scrolls inside its panel, the upper-right card scrolls when taller than the map row, and both modals cap at the screen height. It scales to the frame via `--pf-s`. The frame fills the window minus the gutters up to 1600px. On larger screens it grows to 80% of the viewport width, scaling the HTML screen past its design size, but stays narrow enough that the screen keeps at least 880 design px of height in the window (on ultrawide monitors that wins over 80%); below a 0.5 scale it pans horizontally at a readable 0.72 scale instead, opening scrolled to the right edge (map and truck card) with the hint "Листайте вбок". 20px corners, the Floating UI shadow, on an Operations Tint band. Caption "Интерфейс Платформы".
- **Selection:** the upper-right panel follows Figma 23644:69859. The truck on the map shows the truck card (default), a map pin shows its site card (container groups, attached clients, today's jobs with status and photo state), a Gantt trip shows its route card (vehicle, crew, numbered route points). The close button collapses the card column (320 ms, none under reduced motion) and the map widens to fill it; focus returns to the item that was selected, and the next click on a pin, the truck or a trip brings the card back. The selected pin grows 1.35x with a drop shadow; the selected trip gets a 2px ink outline. Pins and trips are buttons in two roving groups (one Tab stop each, arrows move, Enter selects); the panel is a polite live region. Card data is generated in the build (`#pf-data`) and rendered by script.js with design-system classes. The map carries three garbage trucks (TruckMarker `musorovoz`, state `enroute`; the selected variant swaps in on selection); each opens its own truck card (vehicle, crew and trips from its Gantt row). The selected truck also shows its routes on the map: the past stretch through the completed stops of its in-progress trip in solid ink (3px), and the remaining stops as a blue dashed line (`icons-action`, 3.5px) on a dashed white casing, traced along the streets of the backdrop at build time (`tools/platform-block/trace-routes.js`: A* over road pixels, main roads preferred, simplified to straight runs) and drawn with 6px rounded corners. Stops are authored per truck in the build (`MAP_TRUCKS.past/plan`) and match the trip progress.
- **Interaction:** the Gantt tabs are live too. «Статус вывоза» and «Расписание маршрутов» (Figma 4439:1609) are a WAI-ARIA tablist (click, ←/→, Home/End) that swaps the panel and its toolbar. The side-nav page items (14, no «Экипажи») are buttons in one roving tab stop. Hovering or focusing one shows a 300px white card to the right of the nav (radius-lg, shadow-lg, notch at the item): the item icon in action blue, the page name, «Вы здесь» on Дэшборд, and one or two lines on what the page does (NAV_TIPS in build-platform.js). The nav logo, quick actions, utilities and user block, plus the map controls, toolbars and the status-tab body, stay `inert` and `aria-hidden`; buttons inside cards other than close are removed from the tab order; each tab panel has a visually hidden one-line summary. The schedule body scrolls vertically inside the screen. Each truck row groups its trips into shift containers; trips in one container share a shift id. Hovering a trip (or the gap between trips of the same shift), or keyboard-focusing one, draws a 1px ink outline round the whole shift with a dark label: state (green «Активная смена», muted «Смена завершена» / «Плановая смена»), shift id and driver. Nothing is outlined at rest, and AI proposals sit outside any shift. Hovering the job counter next to a plate shows a 300px white card above it (notch at the counter): «N заданий на день», a line on what it counts (every job in all of the shift's trips; AI proposals excluded until approved) and plate · date. Hovering the «Пробег за смену» or «Расход топлива» tile in the truck card shows the same card style explaining the source: mileage from Wialon GPS tracks, fuel use and tank level from the ДУТ (fuel level sensor). The truck/user toggle in the «Расписание маршрутов» toolbar switches the Gantt rows: by truck (plate per row, a shift outline names its driver) or by driver (one row per shift driver as «Фамилия И.», full name in the title; a mid-day handover gives the truck two driver rows, AI proposals stay with the last driver, and the shift outline names the truck). Both views are rendered at build time and swapped with the hidden attribute; the selected trip and scroll position carry over. The red alert icon on the three «Внимание» plates is a crew report. Hovering or focusing it opens a 320px white alert card (shadow-lg, radius-lg) 8px above the icon (below only when there is no room; positioned against the scaled screen so the Gantt scroll box does not clip it): error icon and red title (ДТП, запаркованная КП, простой техники), source · time · plate, the message naming the shift driver (and the blocked address or trip), and one small primary Button (Связаться с экипажем / Переназначить задание). The card stays open while the pointer is on it, and its button opens that truck's in-progress trip in the side card. Hovering or keyboard-focusing the truck, a pin or the depot on the map shows a dark tooltip (truck: plate and driver; pin: address, facility name and job count; depot: name and address). It flips below near the top edge and clamps inside the map; it is `aria-hidden` because each button's accessible name carries the same text.
- **Route card modal (Figma 19601:36533)**: clicking a trip row in the truck card (each row is now a button) opens the route card over the screen, in the same scaled-screen dialog pattern as the photo proof (manual focus trap, rest of the screen inert, Escape/scrim/X close and return focus to the row). Header: down/up chevrons step through the truck's trips, route id and trip number, route status badge, started/finished times. Left: plate, crew, shift badge, vehicle line, numbered job list (status pin, checkbox, address and job id, containers, volume, job type and client, status, photo-proof icon; delete/drag/more appear on row hover), the unload row with landfill and the trip summary. Right: the platform map backdrop cropped around the truck; the current trip shows its traced route and numbered stops (the map truck's stops), other trips show a note that the GPS track is shown for the current trip, plus a decorative player bar. Below: the weighbridge row, filled for completed trips. Footer: «Перенести выбранные задания» enables with the selected count, «Сохранить» closes; «Отменить маршрут», «Завершить принудительно», the selects, add-job link and map tools are decorative.
- **Photo proof modal (Figma 19635:35376):** in the site card, the blue photo icon of each completed job is a button that opens a 1400×920 modal inside the scaled screen (ink scrim at 48%, radius-xl, shadow-lg). It has a header (prev/next job across all proofs, site name, «Отчёт о выполнении задания», check-status chip, address · client · order · job type · container group, message icon, close), the site's job tabs (DS segmented, status dot, jobs without a proof disabled), a 240px info rail (crew, Plate Number, vehicle, depot; job details) and a Фото-отчёт / GPS segmented switch. The photo pane has a fill bar (container type, count, a per-container fill marker tinted by level: 0 error, 0.5 action, 0.75 AI, 1.0 success, 1.25 warning; actual vs nominal m³) and До/После photo columns with an ink time tag, rotate, dots, download and three thumbnails (4px action ring on the current one). The GPS pane is the map backdrop centred on the site with the pin and a stay card. Footer: Поделиться (copies a summary), then Подтвердить / Подозрительно / Некорректно, which recolour the check chip. The truck type follows the site type, and the photo scene is picked by site type (images/platform/proof, Higgsfield). The modal traps focus; Escape, the scrim and close return focus to the photo icon.
- **Auto tour (default presentation):** once the visitor is on the screen (80% of it visible, or it fills 70% of the window), never on page load; it pauses below 35% visibility, a drawn ink cursor (white keyline, small drop shadow) walks 12 steps on the real interface, using the same clicks and hover cards a visitor gets. It opens on the side nav (hovering all 14 pages so each page card explains itself), then: map, site card, photo proof (confirms, closes), truck card and route, fuel metric card, route card modal (job rows, map, next trip, close), «Расписание маршрутов», a split shift, the ДТП alert and its CTA, an AI proposal, the driver view. **Camera:** the first time a feature appears the screen zooms in on it, up to 2x (fit-limited so the whole feature stays in view), with a 720 ms ease-in-out transform on .pf-screen (--cam-z, --cam-tx, --cam-ty on top of --pf-s); it pans between neighbouring targets and zooms back out for overview moments. **Spotlight:** a rounded window (14px, 2px white keyline) over the feature and its hover card while the rest of the stage dims to 38% ink. Cursor, spotlight, narration and prompts sit on the unzoomed .pf-stage in real px, so they keep their size while the screen zooms. Narration: Onest on Dispatch Ink, 330px, «N из 12», title, one or two sentences, beside its anchor where there is room. The caption row is the tour bar: left-aligned: «‹ Назад», «Обзор интерфейса N / 12» (a polite live region), «Далее ›», then the primary «Попробовать интерфейс самому», all 44px tall. The step buttons are white with a 1.5px strong hairline and a hairline shadow, Onest 600 15px with 20px ink chevrons; hover turns the outline ink; «Назад» is disabled on step 1. The bar wraps on narrow frames. ‹ and › restart the script at the neighbouring step: the interface is reset to the default state and rebuilt to what that step expects (the site card for the photo step, the schedule tab from step 9), Gantt rows are scrolled into view before the camera aims at them, and › past step 12 goes to the invite. They work while the pause prompt is open too. **Click on the screen pauses** and opens a white prompt over a veil, «Обзор на паузе» with «Изучить самому» and «Продолжить обзор» (focused; Escape or a click on the veil resumes). The bar button, Tab into the screen or Escape while playing hand over control at once: modals close, hovers clear, the camera returns to 1x, the rest of the state stays; the caption then offers «Смотреть обзор интерфейса». It ends, never loops, on a white invite card over a 30% ink veil with «Попробовать интерфейс самому» (focused) and «Посмотреть ещё раз». It pauses offscreen and in a hidden tab. Hover-only CSS effects have .is-th twins the tour can set. Under reduced motion or when the frame pans (narrow screens) nothing autoplays; the replay link starts it, with no camera or cursor glides. The frame fits the window with 62px reserved for the caption row.
- **Explore mode (tour off):** the caption line becomes an explore strip: an ink pill with a cursor glyph «Интерфейс кликабельный» and one line naming what to click («Нажимайте на машины и точки на карте, рейсы и вкладки.»), with «Смотреть обзор интерфейса» on the right (stacked under 860px). When the visitor takes control, four labelled rings (Машина, Площадка, Рейс, Вкладка) in the cursor-ring vocabulary (white keyline on ink, soft pulse halo, label pill above) mark real targets in view; they go on the first click or key press, on resize, or after 7s. Reduced motion: no pulse.
- **Regenerate, don't hand-edit:** `tools/platform-block/README.md`.

### Photography
Field photographs give the replicas a real place: the depot behind the fleet panel and a crew at a container site as a photo pause before #products. Each is documentary, natural cool daylight or blue hour, slate-white-blue grade, Almaty with the Alatau where it fits; no logos, lettering, readable plates, or posed people.
- **Photo stage:** the photo sits flat at 86% of the column with 20px corners on a hairline-grey placeholder; the product panel floats over its lower edge (88% wide, overlapping clamp 96-168px), offset to the side opposite the photo. Under 860px the photo goes full width at 4:3 (1:1 under 600px) and the panel overlaps it by 72px (56px).
- **Photo pauses:** two full-bleed bands with no text on the main page sit between blocks where the story moves from screens to the field: a shared container site between a block of flats and shops before #clients (`site-*`), and a crew rolling a container to the truck before #products (`crew-*`). Height clamp 240-460px (30vw), 220px under 600px, object-fit cover with per-image focal points; lazy-loaded srcset 960-3840. They carry descriptive alt text and no caption: like the hero, they illustrate a place, not a claim. No more than one pause between any two blocks, and none next to the form. The cab photo (`cab-*`) now sits in the #driverapp teaser and, full-bleed, behind the driverapp.html opener.
- **Proof:** no photograph sits next to the proof list, so no image has to be captioned as illustrative beside factual claims.
- **Files:** WebP in `images/` at four widths with `srcset`, lazy-loaded, intrinsic width and height set. Generation provenance lives in `images/PROVENANCE.md`; replace with real pilot photography when it exists.

## Do's and Don'ts

### Do:
- **Do** rebuild product UI in HTML/CSS at real density, set in Medeo Sans, without a "demo data" caption.
- **Do** keep AI Violet for AI-made or AI-proposed things, and pair AI Violet Text with AI Soft for labels.
- **Do** use the product status ramps (soft fill + ink text + currentColor dot) for any job state, with the product's wording.
- **Do** set vehicle plates in the Plate style everywhere.
- **Do** make the primary action Dispatch Ink and the secondary action Quiet tint.
- **Do** structure sections with hairlines and tint bands; lift only floating product UI with the single Floating UI shadow.
- **Do** make the resting state of any motion the meaningful end state, and honor reduced motion.

### Don't:
- **Don't** use violet for CTAs, links, heading accents, or decoration.
- **Don't** replace a product replica with a static screenshot or a row of equal feature cards.
- **Don't** add gradients, glass, blur, or a second shadow level.
- **Don't** put uppercase tracked labels above marketing headings; caps live only inside product UI headers.
- **Don't** set product UI in Onest or marketing headings in Medeo Sans.
