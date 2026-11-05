# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary: decision-makers at **large waste-removal operators (МВО)** in Kazakhstan — owners, operations directors and heads of dispatch who are evaluating whether to move their fleet, dispatch and client operations onto RaccoonAI.

Secondary: **akimats and city situational centers** (government) that need city-wide visibility into waste removal across every connected operator.

These are large-enterprise and public-sector buyers: they evaluate carefully, need credible proof, and act through a sales conversation, not self-serve sign-up.

## Product Purpose

RaccoonAI is an AI platform for waste removal. It puts the whole work of an МВО — from client request to landfill — into one system: requests, routes, vehicles, drivers and clients in a single ecosystem. The AI dispatcher assigns jobs to vehicles automatically, so human dispatchers handle only the exceptions.

This website's job is to make a qualified operator or city body **request a demo / book a call**. Success = a demo request from the right organization.

## Positioning

One source of data for dispatcher, driver, client and city: a client's request, the driver's route, the weighing at the landfill and the report to the akimat are the *same job*, seen by each party in their own app with one shared status. Built for Kazakh МВО operations specifically (СО vs ТБО waste types, akimat reporting, Wialon GPS), with an AI dispatcher trained on the operator's own historical routes.

## Operating Context

- Operators run daily shifts of crews and vehicles across depots: garbage trucks (ТБО), skip loaders, multilifts, dump trucks, liquid-waste trucks.
- Today many dispatch rooms rely on 1C and spreadsheets; RaccoonAI replaces that.
- Landfill weighbridge data, GPS (Wialon), fuel (ГСМ) and photo reports (before/after) are part of the daily workflow.
- City bodies watch plan vs. fact per collection site, missed pickups, vehicle locations of all МВО, resident complaints and gas-analyzer readings.

## Capabilities and Constraints

Product lineup (from the existing RaccoonAI client landing design):

- **Platform** — dispatch ERP: requests and routes, client/contract registry, GPS map, vehicle and driver shifts, fuel monitoring, weighbridge data, СО bin registry, photo reports. Web, for dispatchers and МВО management.
- **AI dispatcher** — auto-assigns jobs and builds routes; weighs SLA priority, site location, waste type (СО/ТБО), suitable vehicle, client priority. Two-level control (fleet-wide switch + per vehicle); manual reassignment always available. Built into the Platform.
- **DriverApp** — route sequence, before/after photo reports, problem reporting, schedule and earnings. Android, iOS, PWA.
- **Client App + WhatsApp bot** — clients request pickups in the app or via WhatsApp; the bot recognizes the client by phone number and creates a job in the Platform.
- **Sentinel and Inspect** — monitoring for akimats: plan vs. fact by site, map of all МВО vehicles (incl. parking in restricted zones), resident complaints, gas analyzers (CO2, CH, O2). Web, for government and situational centers.

Constraints:

- **Languages:** the website ships in Russian, Kazakh and English (switcher with flags in the header, user decision 2026-11-06). Russian in the HTML is the source; Kazakh and English are dictionaries in `i18n/`. The first visit picks the language from the browser time zone: CIS countries get Russian, everyone else English; an explicit choice is remembered. The Kazakh and English texts are machine-quality drafts until a native speaker reviews them.
- Primary call to action: **request a demo / contact**. No self-serve sign-up or public pricing.
- The repository currently holds a plain static HTML/CSS/JS starter page (`index.html`, `style.css`, `script.js`) that is not yet RaccoonAI content.

Open decisions: contact channel(s) and actual email/phone; whether English is a full translation or partial.

## Brand Commitments

- Name: **RaccoonAI**. Based in Almaty, Kazakhstan.
- Voice in existing copy: concrete and operational, speaks the operator's language (МВО, СО/ТБО, ГСМ, полигон, акимат); positions AI as assisting dispatchers — "решения остаются за диспетчером" (decisions stay with the dispatcher).
- Marketing look (user's stated preference, 2026-11-03): clean, premium, modern, at the craft level of top SaaS sites (Stripe, Linear, Samsara); show the real product (Platform, map, DriverApp) rather than metaphors; no cultural or heritage costume.
- Existing brand assets live in the user's Claude artifacts: "RaccoonAI Design System for Claude", "RaccoonAI — Fluent-редизайн логотипа", and "RaccoonAI — лендинг для клиентов". Visual direction is decided later, not here.

## Evidence on Hand

Claims stated in the existing RaccoonAI client landing design (user's own material):

- Pilot launches in Almaty and Astana.
- Development partner: ТОО «Ак Тартып», described as the largest МВО in Kazakhstan.
- Used by the Almaty Situational Center.

**Not available — never fabricate:** share of auto-assigned routes, number of vehicles on the platform, jobs per month (all placeholders `[X%]`, `[N]` in the design), contact email and phone, testimonials, case studies, client logos, pricing.

## Product Principles

1. **One job, one status.** Every surface should reinforce that dispatcher, driver, client and city share the same record.
2. **AI assists, people decide.** Present automation as removing routine work, with human control always visible.
3. **Speak operations, not hype.** Use the operator's real terms and workflows; concrete beats buzzwords.
4. **Proof over promise.** Lead with real pilots and partners; leave metrics as placeholders until real numbers exist.
5. **Built for more than one language.** Russian ships first; Kazakh and English must drop in without a redesign.

## Accessibility & Inclusion

Russian, Kazakh and English, switched in the header; layouts must tolerate longer Kazakh/English strings, and Kazakh needs fonts with Ә Ғ Қ Ң Ө Ү Һ.
