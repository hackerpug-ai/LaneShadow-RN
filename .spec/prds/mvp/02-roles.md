---
stability: PRODUCT_CONTEXT
last_validated: 2026-06-13
prd_version: 1.1.0
---

## Roles

The MVP has three actors. All acceptance criteria are written against one of them (`WHO ∈ Rider / System / Founder`).

| Role | Who they are | What they do in the MVP | Persona tie-in |
|------|--------------|--------------------------|----------------|
| **Rider** | A recreational cruiser/touring rider using the app to find a road. The general end user. | Opens Discovery, browses pins by proximity or state, filters by archetype, sorts best/nearest, opens a detail view, checks basic conditions, saves a route, and hands off to maps to ride it. | All four primary personas share this entry point. **Mike** (Friday-evening "4-star road 30 min away"), **Terry** (filter a region, find roads he's never heard of), **Rachel** (clean UI, weather she can trust, beginner-comfortable roads), **Sam** (find a group-friendly loop, share later). Mike/Rachel are iOS; Sam is Android — both platforms ship together. |
| **System** | The Convex backend + the RN client app acting on the rider's behalf. | Serves ranked curated routes from the live catalog; maps UI↔DB archetypes; normalizes state strings; clamps junk lengths; falls back to centroid when geometry is absent; renders scores as bars/% on the 0–1 scale; persists the curated bookmark; fetches basic weather; opens the maps deep link. | The "it just works" promise for Mike (Design Principle 4: "Simple for Mike"); the trustworthy data behind Rachel's confidence. |
| **Founder (user #1)** | Justin, the rider who is building the app for himself first. The dogfood user and the only acceptance signal that ultimately matters. | Runs the D9 on-device gate: opens the app on his real device, finds 5 rides he's never done in his riding region, saves one, and rides it this weekend. | Strategy Founder Goal #1: *"Find exciting motorcycle experiences for myself."* KPI: *"Routes Founder Personally Rode > 2/month."* He is the Mike/Terry hybrid — the product fails if it doesn't help HIM find a road. |
