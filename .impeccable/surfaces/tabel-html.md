---
version: 1
slug: "tabel-html"
primary_target: "tabel.html"
related_targets: ["tabel.css","js/tabel.js"]
---

# RaccoonAI Табель HR page (hidden)

Scope: tabel.html, a product page for the «Табель HR» feature, built from the Claude Design handoff (7 screens, SPEC.md, RaccoonDS). Visitor mode: **Persuade**. Hidden by user decision 2026-11-14: reachable only by direct link; the dock, mobile menu and footer of the other pages do not list it, and it carries `noindex`. Russian only for now (kk/en later).

Audience and action: directors and HR/operations heads of large МВО, shown the page in a sales conversation; action is the demo form. Claims: only what SPEC.md describes as the feature's design (bot check-ins with selfie and geozone, reconciliation with the vehicle's events, exceptions for HR, period close, export to 1С / Excel). It is not yet in production, so no launch dates, metrics or customers.

Structure: #top opener (copy) with the month timesheet screen rising under it as the main interactive replica; #razbor, one exception resolved through the bot (Касымов Арман, 5 Oct, no «Ушёл»); demo form.

## Direction contract
THESIS: the timesheet is shown as the working Platform screen at real density, not described; the category default (feature cards with icons, a dashboard screenshot) is refused.
OWN-WORLD: the site's world unchanged: white/tint bands, Onest copy, ink CTA; inside the frame the RaccoonDS `.rds` tokens, Medeo Sans, the side nav with «Табель» selected.
STORY: HR does not fill the timesheet; the system assembles days from bot check-ins and vehicle events and hands HR only what does not match; the month closes and goes to 1С.
FIRST VIEWPORT: h1 and lead left, actions under it, a three-step source line on the right; the screen's top edge visible at the fold.
FORM: established-world extension of the clientapp/driverapp page pattern; no concept roll (structure pinned by the sibling pages). seed: none (unavailable)
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
