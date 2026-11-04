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
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.4
  ui-label:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 600
    lineHeight: 1
  ui-micro:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "11px"
    fontWeight: 600
    letterSpacing: "0.04em"
  plate:
    fontFamily: "Inter, system-ui, sans-serif"
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

The marketing site is a dispatch room with the lights on. A white ground carries near-black ink, and the product itself does the persuading: map, route, assignment card, DriverApp phone, fleet switches and plan-vs-fact bars are rebuilt in HTML and CSS at real density, not shown as screenshots. Marketing copy is set in Onest with tight display tracking; everything that is product is set in Inter, so the reader always knows which voice is speaking.

Color is semantic before it is decorative. Violet belongs to the AI and nothing else. Job states use the client product's status colors, the same ones dispatchers see in the Platform. The primary call to action is ink, not a brand color, so the page's one strong hue stays reserved for "the AI did or proposes this". Depth is minimal: flat tinted bands and hairlines for structure, one soft lifted shadow only on UI that floats over the product stage.

As built, the world departs from the direction contract in three values: ink is #080a11 (contract #0b1220), the cool product grey is #f1f5f9 (contract #f2f4f7), and violet is the product design system's AI ramp (#7008e7 / #6a0fe0 / #ede9fe / #c4b4ff) rather than the contract's #3a2fd6. The build is normative.

**Key Characteristics:**
- White page, ink headings, slate body text; cool tint bands alternate with white sections.
- Product UI replicas at real density are the primary imagery; no illustrations, stock, or screenshots. Documentary field photography supports them in three places only (see Photography).
- Violet only for AI meaning; status colors only for job states; ink for the primary action.
- Two families: Onest for marketing voice, Inter for anything that is product UI.
- One soft shadow, used only on floating product UI.
- A single on-load signature sequence whose resting state is the end state.

## Colors

A neutral slate world with two semantic voices: the AI violet ramp and the product's job-status ramps.

### Primary
- **Dispatch Ink** (ink): headings, primary buttons, the depot marker, the check-list discs, the phone bezel, the top rule of the proof list. Hover deepens toward Graphite Hover (ink-hover); the submitting state uses ink-disabled.

### Secondary
- **AI Violet** (ai): the AI's proposed route stroke, the new-pin fill and pulse ring, the "on" state of AI switches, the AI dot. This is the strongest hue on the page and it always means the AI.
- **AI Violet Text** (ai-text): AI labels and copy on light grounds ("Назначено AI", "Назначено AI · 10 точек", the "AI-диспетчер" product name), deepened for 4.5:1 on AI Soft.
- **AI Soft** (ai-soft): AI chip fill, the DriverApp "new point" tile, the mobile driver strip.
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

**Display Font:** Onest (with system-ui, sans-serif), self-hosted 400-700, cyrillic and latin
**Body Font:** Onest
**Label/Mono Font:** Inter (with system-ui, sans-serif), self-hosted 400-600, for product UI

**Character:** Onest is a warm, geometric grotesk that tightens well at display sizes and reads comfortably in Russian body copy. Inter is the product's own UI face; using it inside every replica makes the rebuilt UI read as the real product.

### Hierarchy
- **Display** (600, clamp 40-66px, 1.04, -0.036em): the hero headline only, balanced wrapping.
- **Headline** (600, clamp 32-50px, 1.08, -0.03em): section headings. **Headline Small** (600, clamp 26-36px, 1.15, -0.025em) for sub-section heads; the proof heading uses clamp 28-40px.
- **Title** (600, 24px, -0.02em): product names; the four-view headings use 22px / -0.015em.
- **Lead** (400, clamp 18-21px, 1.55, max 34ch in hero): the hero supporting line; section intros use clamp 18-20px at max 62ch.
- **Body** (400, 18px, 1.6; 17px under 600px): running text. Check-list items 17px / 1.55 at max 56ch. **Body Small** (15px): nav, "where" lines, feature descriptions, footer.
- **Button** (600, 17px, line-height 1; 15px on small buttons).
- **UI** (Inter 400, 13-14px): text inside product replicas. **UI Label** (Inter 600, 13px; 12px in table rows): status chips. **UI Micro** (Inter 600, 11-12px, 0.04-0.05em, uppercase): column headers and group labels inside product replicas only.
- **Plate** (Inter 600, tabular figures, 0.02em, no wrap): vehicle plates such as "123 ABC 02", wherever they appear.
- **Note** (Onest 500, 13px, muted): "Демонстрационные данные" captions under every replica.

### Named Rules
**The Two Voices Rule.** Onest speaks for RaccoonAI; Inter speaks for the product. If it is a piece of the product, it is set in Inter.

**The Product-Only Caps Rule.** Uppercase tracked micro-labels exist only as table and group headers inside product UI. They never sit above a marketing heading.

## Layout

A single centered wrap (1240px max, fluid gutter clamp 16-40px). Sections breathe on a fluid vertical rhythm (clamp 72-136px), alternating white and Operations Tint bands. The hero is an asymmetric 5:7 grid with the product stage larger than the copy; split sections are 1:1 with a fluid gap (clamp 40-96px) and can reverse order; the demo section is 5:6.

Structure inside sections comes from hairlines, not boxes: the four-view row is a ruled 4-column strip with column dividers, products are ruled rows (3:5:4 name / text / fragment), features are a 4-column ruled list, the proof list is 3 columns under an ink top rule. Inner spacing steps on 8 / 12 / 16 / 24 / 32 / 48px.

Responsive: at 1080px the hero stacks, views go 2-up, features 2-up, products 2-column. At 860px nav links hide, splits and the demo grid stack, proof goes 1-up. At 600px body drops to 17px, views, features, products and form rows go single column, the phone is hidden and replaced by an AI Soft driver strip under the stage, and stage cards reposition so they do not collide. The header is sticky at 72px with a near-opaque white fill and gains a hairline once the page scrolls.

## Elevation & Depth

Mostly flat. Depth comes from tonal layering (white cards on Operations Tint, white rows inside tint fragments) and hairlines. A single soft two-layer shadow lifts only UI that floats: stage cards, the DriverApp phone, the fleet and Sentinel panels. No gradients, no glass, no blur.

### Shadow Vocabulary
- **Floating UI** (`box-shadow: 0 1px 2px rgba(8, 10, 17, .06), 0 12px 32px -8px rgba(8, 10, 17, .16)`): cards and panels that sit above the stage or a section ground.
- **Hairline inset** (`box-shadow: inset 0 0 0 1px #e2e8f0`): the map frame and the brand mark tile.
- **Switch knob** (`box-shadow: 0 1px 2px rgba(0,0,0,.2)`): the toggle thumb only.

### Named Rules
**The One Shadow Rule.** There is one elevation. If a surface does not float over product UI, it has no shadow.

## Shapes

Softly rounded, product-like geometry. Radii step by role: 6px for the focus outline and brand tile, 8px for mini buttons and table rows, 10px for small buttons, inputs and fragment rows, 12px for buttons, view panels and status panels, 14px for floating cards and product fragments, 20px for the stage, product panels and the form panel, 34px for the phone bezel (27px screen). Pills (999px) for status chips, module chips, switches and bars. Chat bubbles use one tight corner (12px with 4px at the speaker's side). Dots and pins are circles.

## Components

### Buttons
Solid, quiet, and confident; no outlines, no icons.
- **Shape:** gently rounded (12px; 10px on small).
- **Primary:** Dispatch Ink fill, white text, 52px tall, 26px side padding. Small variant 42px / 18px, used in the header.
- **Hover / Focus:** fill shifts to ink-hover over .2s on the standard ease; press nudges down 1px; focus is the global 3px Action Blue outline at 3px offset. Submitting state uses ink-disabled with a progress cursor and "Отправляем…".
- **Quiet:** Operations Tint fill with ink text, hover tint-hover. The secondary hero action.

### Chips
- **Status chip:** pill, Inter 600 13px, 6px x 10px, leading 7px dot in currentColor. Created, In progress (also "Машина в пути"), Done, AI. Smaller in table rows (12px, 4px x 8px).
- **AI proposed:** white fill with a 1.5px dashed AI Violet outline; it becomes the solid AI chip once assigned.
- **Module chip:** pill, Operations Tint, body text 14px, 6px x 12px; lists Platform modules.

### Cards / Containers
- **Floating UI card:** white, 14px corners, Floating UI shadow, 14px 16px 16px padding, Inter. The AI assignment card adds an AI Line hairline.
- **Product panel** (fleet, Sentinel): white, 20px corners, Floating UI shadow, fluid padding (clamp 20-32px), header ruled off with a hairline.
- **Product fragment:** Operations Tint, 14px corners, 14px padding, white inner rows at 8-10px corners. Flat.
- **Form panel:** Operations Tint, 20px corners, fluid padding (clamp 24-40px), 18px field gap. Flat.

### Inputs / Fields
- **Style:** white, 1px Strong Hairline, 10px corners, 52px tall, Onest 17px ink; labels 15px 600 ink above with an optional "необязательно" in muted 400. Select uses a drawn chevron.
- **Hover:** stroke to line-hover.
- **Focus:** stroke to Action Blue plus a 3px Action Halo ring.
- **Error:** error-ink stroke and a 14px error-ink message below; form-level status uses error-soft / error-text, success uses status-done-soft / status-done-ink.

### Navigation
Sticky 72px header: brand mark tile and 20px 700 wordmark left, Onest 500 15px body-color links (ink and underline on hover), small primary "Запросить демо" right. Links hide under 860px; the CTA stays. Footer repeats brand, city, and links on a hairline.

### Fleet Switch
A 44 x 26px pill toggle with a white 20px knob. Off is Strong Hairline, on is AI Violet; the knob slides 18px over .25s. Per-vehicle rows read "Назначено AI · N точек" in AI Violet Text when on and "Вручную · диспетчер" in muted when off. Turning the fleet switch off sets every vehicle to manual and disables the row switches (45% opacity).

### Product Stage and Signature Sequence
The hero stage composes an SVG city map (map ground, white roads, tinted blocks, grey fleet), a live route in status-progress, done and next pins, the depot and the truck, two floating UI cards and the DriverApp phone overlapping the stage edge. The markup's default is the final, assigned state.

On first view (35% visible, once), JavaScript plays: the new request lands as "Неназначено"; the AI card appears as "AI предлагает" with a dashed violet route drawn along a mask (1.1s) and a pulsing ring on the new pin; then the route turns solid, the chip becomes "Назначено AI", the request turns "Машина в пути", and the phone gains the new point. Transitions use .6s on cubic-bezier(.16, 1, .3, 1). Under reduced motion or without JavaScript nothing plays and the end state shows; a global reduced-motion rule also removes all transitions, animations and smooth scrolling.

### Platform Screen
The section after the hero shows the real dispatcher dashboard (Figma RaccoonAI Desktop, node 4296:5593), not a marketing replica. It is the one exception to the Two Voices Rule: inside `.rds` the product speaks in its own design system, Medeo Sans and the RaccoonAI Design System tokens (`--surface-*`, `--text-*`, `--status-*`), with components server-rendered from `RaccoonDS` (SideNav, SearchField, FilterButton, IconButton, PlateNumber, Avatar, StatusBadge, PercentBadge, DateButton, Select, MapPin, TruckMarker, Button, Separator). Organisms (map, truck card, status block) are laid out in `platform.css`.
- **Frame:** the screen keeps its 1600 x 980 design size and scales to the frame (max 1600px, wider than the wrap) via `--pf-s`; below a 0.5 scale it stops shrinking and pans horizontally with the hint "Листайте вбок". 20px corners, the Floating UI shadow, on an Operations Tint band. Caption "Интерфейс Платформы · демонстрационные данные".
- **Selection:** the upper-right panel follows Figma 23644:69859. The truck on the map shows the truck card (default), a map pin shows its site card (container groups, attached clients, today's jobs with status and photo state), a Gantt trip shows its route card (vehicle, crew, numbered route points). The close button collapses the card column (320 ms, none under reduced motion) and the map widens to fill it; focus returns to the item that was selected, and the next click on a pin, the truck or a trip brings the card back. The selected pin grows 1.35x with a drop shadow; the selected trip gets a 2px ink outline. Pins and trips are buttons in two roving groups (one Tab stop each, arrows move, Enter selects); the panel is a polite live region. Card data is generated in the build (`#pf-data`) and rendered by script.js with design-system classes. The map carries three garbage trucks (TruckMarker `musorovoz`, state `enroute`; the selected variant swaps in on selection); each opens its own truck card (vehicle, crew and trips from its Gantt row). The selected truck also shows its routes on the map: the past stretch through the completed stops of its in-progress trip in solid ink (3px), and the remaining stops as a blue dashed line (`icons-action`, 3.5px) on a dashed white casing, traced along the streets of the backdrop at build time (`tools/platform-block/trace-routes.js`: A* over road pixels, main roads preferred, simplified to straight runs) and drawn with 6px rounded corners. Stops are authored per truck in the build (`MAP_TRUCKS.past/plan`) and match the trip progress.
- **Interaction:** the Gantt tabs are live too. «Статус вывоза» and «Расписание маршрутов» (Figma 4439:1609) are a WAI-ARIA tablist (click, ←/→, Home/End) that swaps the panel and its toolbar. The side-nav page items (14, no «Экипажи») are buttons in one roving tab stop. Hovering or focusing one shows a 300px white card to the right of the nav (radius-lg, shadow-lg, notch at the item): the item icon in action blue, the page name, «Вы здесь» on Дэшборд, and one or two lines on what the page does (NAV_TIPS in build-platform.js). The nav logo, quick actions, utilities and user block, plus the map controls, toolbars and the status-tab body, stay `inert` and `aria-hidden`; buttons inside cards other than close are removed from the tab order; each tab panel has a visually hidden one-line summary. The schedule body scrolls vertically inside the screen. Each truck row groups its trips into shift containers; trips in one container share a shift id. Hovering a trip (or the gap between trips of the same shift), or keyboard-focusing one, draws a 1px ink outline round the whole shift with a dark label: state (green «Активная смена», muted «Смена завершена» / «Плановая смена»), shift id and driver. Nothing is outlined at rest, and AI proposals sit outside any shift. The red alert icon on the three «Внимание» plates is a crew report. Hovering or focusing it opens a 320px white alert card (shadow-lg, radius-lg) 8px above the icon (below only when there is no room; positioned against the scaled screen so the Gantt scroll box does not clip it): error icon and red title (ДТП, запаркованная КП, простой техники), source · time · plate, the message naming the shift driver (and the blocked address or trip), and one small primary Button (Связаться с экипажем / Переназначить задание). The card stays open while the pointer is on it, and its button opens that truck's in-progress trip in the side card. Hovering or keyboard-focusing the truck, a pin or the depot on the map shows a dark tooltip (truck: plate and driver; pin: address, facility name and job count; depot: name and address). It flips below near the top edge and clamps inside the map; it is `aria-hidden` because each button's accessible name carries the same text.
- **Photo proof modal (Figma 19635:35376):** in the site card, the blue photo icon of each completed job is a button that opens a 1400×920 modal inside the scaled screen (ink scrim at 48%, radius-xl, shadow-lg). It has a header (prev/next job across all proofs, site name, «Отчёт о выполнении задания», check-status chip, address · client · order · job type · container group, message icon, close), the site's job tabs (DS segmented, status dot, jobs without a proof disabled), a 240px info rail (crew, Plate Number, vehicle, depot; job details) and a Фото-отчёт / GPS segmented switch. The photo pane has a fill bar (container type, count, a per-container fill marker tinted by level: 0 error, 0.5 action, 0.75 AI, 1.0 success, 1.25 warning; actual vs nominal m³) and До/После photo columns with an ink time tag, rotate, dots, download and three thumbnails (4px action ring on the current one). The GPS pane is the map backdrop centred on the site with the pin and a stay card. Footer: Поделиться (copies a summary), then Подтвердить / Подозрительно / Некорректно, which recolour the check chip. The truck type follows the site type, and the photo scene is picked by site type (images/platform/proof, Higgsfield). The modal traps focus; Escape, the scrim and close return focus to the photo icon.
- **Regenerate, don't hand-edit:** `tools/platform-block/README.md`.

### Photography
Field photographs give the replicas a real place: the depot behind the fleet panel, the city behind the Sentinel panel, and a crew at a container site as a full-width band opening the proof section. Each is documentary, natural cool daylight or blue hour, slate-white-blue grade, Almaty with the Alatau where it fits; no logos, lettering, readable plates, or posed people.
- **Photo stage:** the photo sits flat at 86% of the column with 20px corners on a hairline-grey placeholder; the product panel floats over its lower edge (88% wide, overlapping clamp 96-168px), offset to the side opposite the photo. Under 860px the photo goes full width at 4:3 (1:1 under 600px) and the panel overlaps it by 72px (56px).
- **Proof band:** full-bleed, clamp 300-620px tall (280px on phones), object-fit cover, captioned "Иллюстративное изображение" in the Note style because it sits next to factual proof.
- **Files:** WebP in `images/` at four widths with `srcset`, lazy-loaded, intrinsic width and height set. Generation provenance lives in `images/PROVENANCE.md`; replace with real pilot photography when it exists.

## Do's and Don'ts

### Do:
- **Do** rebuild product UI in HTML/CSS at real density, set in Inter, and caption it "Демонстрационные данные".
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
- **Don't** set product UI in Onest or marketing headings in Inter.
