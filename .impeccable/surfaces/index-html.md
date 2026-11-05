---
version: 1
slug: "index-html"
primary_target: "index.html"
related_targets: ["style.css","script.js"]
---

# RaccoonAI landing page

Scope: the public landing page (index.html, style.css, script.js). Visitor mode: **Persuade**.

Audience: directors and dispatch heads of large МВО; akimats and situational centers. Action: request a demo through the form. Proof: pilots in Almaty and Astana, partner ТОО «Ак Тартып», used by the Almaty Situational Center. No invented metrics, logos, testimonials or prices.

Constraints: static HTML/CSS/JS, Russian source with Kazakh and English applied at runtime by i18n/i18n.js (header switcher, time-zone default), responsive to 390 px, light only, form posts to a form service (endpoint placeholder), contact details placeholders.

Open decisions: form service and endpoint; phone and email; real metrics; final logo wordmark (current file reads "Rakun AI").

## Direction contract

THESIS: The page shows dispatch actually happening: one request becomes an AI-proposed, dispatcher-confirmed job that every party sees in one status. It refuses the split hero with a static screenshot and a row of equal feature cards.

OWN-WORLD: White ground, near-black ink #0b1220, one deep violet #3a2fd6 that means "AI did or proposes this", the product's status colors for job states, cool greys #f2f4f7 for product stages. Product UI is rebuilt in HTML/CSS at real density: map, route, assignment card, DriverApp phone. Soft single-layer elevation only on floating UI; no gradients or glass. Tight grotesk display, comfortable body.

STORY: The visitor understands that RaccoonAI runs the whole МВО flow, believes the AI assigns while people keep control, and requests a demo.

FIRST VIEWPORT: Nav with "Запросить демо". Left: the headline "AI-диспетчер для вывоза отходов", one supporting line, the primary demo button plus a secondary link. Right, larger than the copy: a product stage with a city map, a drawn route, an "Назначено AI · 123 ABC 02" card, and the DriverApp phone overlapping its edge. Under the copy, the pilots and partner line. Signature interaction: on load, a request pin appears, the AI's dashed violet proposal draws, turns solid "Назначено", and the phone advances to the next point, once; reduced motion shows the end state.

FORM: Live Operations, Light; safer-register grounded candidate 1 of 3, user-chosen; seed:15dc7a347c8126f8

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
