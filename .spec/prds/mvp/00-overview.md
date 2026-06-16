---
stability: PRODUCT_CONTEXT
last_validated: 2026-06-15
prd_version: 3.0.0
---

## LaneShadow Discovery-MVP

> **✅ v3.0.0 (2026-06-15): the separate discovery view is removed.** Discovery is the behavior of the **route plan view** (the single map + chat home), not a dedicated screen: curated-route **suggestion cards** over the chat input (tap → plot) plus **chat-driven natural-language curated discovery** surfaced as the existing route-cards that render on the map. There is no dedicated Discovery screen and no structured filter/sort/state-browse UI. This folds [DELTA-001](./DELTA-001-unified-map-chat-discovery.md) into the canonical solution below.

### What this is

LaneShadow is a motorcycle-route **discovery** app for recreational cruiser and touring riders, built React Native (iOS + Android) on a Convex backend. This MVP delivers exactly one job, end to end, on real devices:

> **Open the app → find a great road near me (or in a state I'm curious about) → see why it's good and whether today is rideable → save it → go ride it.**

Discovery is both the **hero** (the thing the rider opens the app to do) and the **gate** (the one experience the MVP must nail before anything else is built on top of it). Everything in this PRD exists to make that single arc work for real, against live curated data, on a real iPhone and a real Android phone.

### The problem: strategy/code drift

The active product strategy (`.spec/PRODUCT-STRATEGY.md` v3.0, "Ride the Moment") is unambiguous about the centerpiece:

- **Pillar 1 — Ride Discovery:** *"The curation pipeline … **IS the product.** It turns hours of forum-browsing into 30 seconds of 'show me the best roads near Asheville.'"* — *"`What's great near me?` as the primary entry point."* — *"**This is the free, open, hero experience.**"*
- **What We Leave Behind:** natural-language *planning* (the conversational agent) is explicitly *"**not the core value.** May complete in Phase 4."*

The **code contradicts the strategy.** The home screen today is the conversational **planning agent** — the demoted feature. The hero feature, Discovery, exists only as an **orphaned component tree** (`components/discovery/*`) that is never mounted in `app/`, renders 8 hardcoded `MOCK_ROUTES`, scores them on a wrong 0–100 scale (real data is 0–1), and draws on a non-Mapbox `MapViewWrapper` that diverges from the live Mapbox home map. Meanwhile the backend is healthy: a verified **5,654-route catalog** across all 50 states sits behind Convex with no public browse query to expose it.

So LaneShadow has the engine (curated data) and the dashboard (discovery UI) but they were never connected, and the car is being driven from the back seat (chat). The product is misaligned with its own strategy at the most load-bearing point.

### The solution: re-anchor on Discovery

This MVP corrects the drift by making discovery the behavior of the route plan view (the app's home) and wiring it to the real catalog:

1. **Make discovery the behavior of the route plan view (no separate screen).** The map + chat home is the default landing; when no route is on the map, curated-route **suggestion cards** sit over the chat input (tap → the route plots on the map), and chatting a natural-language request returns curated routes as the existing route-cards. Replace `MOCK_ROUTES` with live Convex data via a new `useCuratedDiscovery` hook. No dedicated Discovery screen, no archetype filter-bar / sort-toggle / by-state browse picker.
2. **Expose the catalog.** Add the two net-new public Convex queries that don't exist yet (`listCuratedRoutes` for browse, `getCuratedRouteDetail` for the detail surface) over the existing healthy tables.
3. **Make the catalog trustworthy at the UI seam.** Five foundational backend gates fix verified data-truth problems before any feature renders: seed the spatial index, map the UI↔DB archetype enums in the query layer, add a first-class save reference for curated routes, normalize dirty state strings, and clamp junk length outliers. These are not optional polish — they are the difference between a working surface and a broken one.
4. **Surface a lean, honest detail view.** Because rich enrichment (photos/history/elevation) is verified-empty and ~45% of routes lack geometry, the detail view renders only what real data supports: a name/summary-derived headline, score bars (rendered as % or bars, never "92"), polyline-or-centroid-fallback geometry, and basic weather conditions. No badges, no synthetic richness.
5. **Close the loop.** Save a curated route as a first-class bookmark and hand off to Google/Apple Maps to actually ride it.

Grounded in Pillar 1, this is the smallest possible product that lets the founder — user #1, whose KPI is *"Routes Founder Personally Rode > 2/month"* — open the app and find a road worth riding this weekend. It is mostly **wiring**, not invention, which is exactly why it is the right MVP: it ships the strategy's hero with the lowest risk.
