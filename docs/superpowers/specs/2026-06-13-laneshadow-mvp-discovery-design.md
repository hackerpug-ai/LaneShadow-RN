# LaneShadow MVP — Design Spec: Discovery as the Hero

**Date:** 2026-06-13
**Status:** DRAFT (awaiting user review)
**Author:** Brainstorming session (Claude)
**Supersedes thinking in:** the earlier "wire recommendation layer through the chat agent" sketch from this same session (revised after grounding in `.spec/PRODUCT-STRATEGY.md`)

---

## 1. Context: why this spec exists

LaneShadow-RN was forked from `../LaneShadow` (commit `7d7ddbd1`, 2026-06-08) to **abandon the dual-native Swift/Kotlin track** and ship the **React Native app + Convex backend** that already existed in the original repo as a "parity reference." Doing the app twice (native + RN) was the pain point the fork resolved.

Consequence: most "halfway-done" initiatives in `.spec/prds/` were the **native track** (v2 design system, v3-integration, native-rewrite) and are **dead as code**. What survives the pivot:

- The **React Native app** (now at repo root): 17 screens, 213 components, 32 hooks, Mapbox rendering confirmed on-device.
- The **Convex backend**: 102 functions, 25 tables — production-grade, platform-independent.
- The **product/design intent** captured in the PRDs and `.spec/PRODUCT-STRATEGY.md` (v3.0, ACTIVE).
- The **backend data initiatives** (curation, curation-hardening, waypoints, llm-interaction-logging) — mostly landed in Convex.

### The drift this spec corrects

The **active strategy** and the **code** disagree on the centerpiece:

- Strategy (`PRODUCT-STRATEGY.md`, Pillar 1): *"The curation pipeline … **IS the product.**"* — *"`What's great near me?` as the primary entry point."* — *"This is the free, open, hero experience."*
- Strategy (What We Leave Behind): NL/agentic *planning* is *"**not the core value.** May complete in Phase 4."*

But the code **leads with the demoted feature** (the conversational planning agent is the home screen) and the **hero feature — Discovery (browse the curated catalog) — exists only as an unmounted component running on mock data.**

**This spec re-anchors the MVP on Discovery**, per the active strategy and per a utility/effort analysis: Discovery ties the recommendation layer to the UI most directly (scores, archetypes, proximity *are* what's shown and how it ranks), serves all four personas' actual entry point, and is mostly **wiring** rather than invention.

### Decisions locked during brainstorming

| Decision | Choice |
|---|---|
| MVP centerpiece | **Discovery** (browse/search curated catalog) as hero + gate |
| Chat planning agent | **Kept as a secondary "plan a ride" path**, not the centerpiece |
| Recommendation delivery | Through the **Discovery surface** (cloud-backed) |
| Data quality | **Wire first, tune later** (surface current scores; calibration is fast-follow) |
| Platforms | **iOS + Android together** |
| Visual bar | **Ship current RN look**; Copper Navigator mockups are post-MVP north star |
| On-device LLM / offline-first | **Deferred well past MVP** (cloud is fine for first versions; revisit only if real usage shows offline blocks rides) |
| Waypoints / Voice / Community / Pro | **Deferred** (later phases) |

---

## 2. Product goal & the one MVP job

**Vision (strategy):** *"Help motorcycle riders ride the moment — find the best experiences, know when conditions are right, and build a library of roads worth returning to."*

**The single job the MVP must do well** (drawn from all four personas' shared success story — *"I found a great road, saw the weather was good, and went riding"* — and the #1 KPI, *Routes Founder Personally Rode > 2/month*):

> **Open the app → find a great road near me (or in a state I'm curious about) → see why it's good and whether today is rideable → save it → go ride it.**

**MVP gate test:** *On a real iOS and a real Android device, against live Convex: open Discovery, see real curated routes near a location and for a chosen state, filter by archetype, sort by best/nearest, open one to a detail view with its description and basic conditions, save it to the library, and hand off to a maps app to ride it.*

---

## 3. Scope

### In scope (each item earns its place by utility)

1. **Discovery surface, cloud-backed** — mount the existing `components/discovery/*` UI; replace `MOCK_ROUTES` with real curated data from Convex. Map + pins, archetype filter chips, sort best/nearest, by-proximity and by-state, ranked by composite score. *This is the hero.*
2. **Route detail** — tap a route → geometry on the map + rich enrichment (one-liner, summary, badges, composite/dimension scores) + **basic conditions** (weather) for the route + Save action.
3. **Save + minimal library** — save a discovered curated route into the user's library; it appears in the existing Saved screen and reopens. (Saved infra largely exists.)
4. **Real, non-junky seed data in the founder's riding regions** — verify `curated_routes` is populated with centroid + archetype + score + geometry + enrichment where the founder rides. (He is user #1; an empty/garbage catalog fails the only test that matters.)
5. **Minimal "ride it" handoff** — open-in-Google/Apple-Maps deep link (and/or GPX). Per strategy, turn-by-turn is out (*"riders who want turn-by-turn can export to Google Maps"*); this cheap handoff is what makes the MVP actually rideable. *(Flagged: the one item added beyond strict "discovery"; cut if undesired.)*
6. **Repo cleanup** — delete the stale `react-native/` shadow directory; fix `pnpm-workspace.yaml`.

### Out of scope (deferred, with rationale)

| Deferred | Why / when |
|---|---|
| Chat planning agent as **hero** | Kept as secondary path. Strategy: "not core value… may complete in Phase 4." |
| On-device LLM + offline-first (local SQLite discovery DB, `shared/lib/discovery/`, on-device intent) | User decision: defer well past MVP. Highest technical risk (2s ceiling, device tiers). Discovery/planning happens at home on wifi. The already-built local-DB discovery hook becomes the offline fast-follow. |
| NL search inside Discovery | Structured filters + proximity + score ranking satisfy the job with zero LLM. NL is the first enhancement (cloud-first, then on-device). |
| Waypoints / "Moments Near Me" | Strategy Phase 0.5. Routes alone satisfy the core job. |
| Voice Ride Companion | Strategy Phase 3. The differentiator, but far out. |
| Community / sharing / submission | Strategy Phase 1. Matters for growth, not for "founder finds rides." |
| Weather intelligence ("best day to ride"), Pro tier, monetization | Strategy Phase 2/4. |
| Scoring calibration, quality-floor enforcement, flywheel auto-rescoring | Fast-follow ("wire first, tune later"). `curation-hardening/sprint-08`. |
| Turn-by-turn navigation | Out, permanently (strategy: export to Google Maps instead). |

---

## 4. Architecture

### 4.1 The Discovery data flow (cloud path)

```
Discover tab  (app/(app)/(tabs)/discover.tsx → RouteDiscoveryScreen)
   │  params: { center{lat,lng} | state, archetypes[], sort: best|nearest, bbox }
   ▼
useCuratedDiscovery()   ← NEW Convex-backed hook (replaces local-DB use-route-discovery)
   │  useQuery(api.curatedRoutes.listCuratedRoutes, params)
   ▼
listCuratedRoutes  ← NEW public Convex query
   │  curated_routes  via  by_centroid (bbox) / by_archetype / by_composite_score
   │  → [{ routeId, name, centroid{lat,lng}, primaryArchetype, compositeScore, distanceMi? }]
   ▼
RouteDiscoveryScreen → map pins + filter bar + sort toggle + (existing) empty/loading overlays
   │  tap pin / list row
   ▼
Route detail  (getCuratedRouteDetail(routeId))  ← NEW public query (route + enrichment)
   │  geometry on map + one-liner/summary/badges/scores + basic weather + Save
   ├─ Save → recordRouteFeedback('save') + persist into saved_routes (reuse existing save path)
   └─ Ride it → open-in-Maps deep link / GPX export   ← NEW (small)
```

### 4.2 Key architectural facts (verified in code)

- The Discovery UI is **substantially built**: `components/discovery/route-discovery-screen.tsx`, `discovery-filter-bar.tsx` (archetype enum: `twisties | scenic | technical | cruising | sport | adventure`), `discovery-sort-toggle.tsx` (`best | nearest`), `discovery-empty-overlay.tsx`, `discovery-loading-overlay.tsx`. The screen currently renders `MOCK_ROUTES`.
- The **existing `hooks/use-route-discovery.ts` is wired to the local on-device discovery DB** (`shared/lib/discovery/db` + `queryByBoundingBox`) — the **offline-first** path we are **deferring**. MVP introduces a **Convex-backed hook** instead; the local-DB hook is preserved for the offline fast-follow.
- The schema (`convex/schema.ts`) already indexes `curated_routes` by `by_centroid`, `by_archetype` (`primaryArchetype`), and `by_composite_score` (`compositeScore`).
- **No public browse query exists yet** — `leanSync`/`fetchEnrichments` are `internalQuery`. MVP adds public `listCuratedRoutes` + `getCuratedRouteDetail`.
- Tab mounting is trivial: `app/(app)/(tabs)/_layout.tsx` uses expo-router `Tabs` (tab bar hidden; nav via `MenuLayout` drawer + `router.push()`). Add a `discover` screen + a drawer entry.
- **No export/GPX/open-in-maps exists** anywhere — item 5 is net-new (small).
- The **chat planning agent stays as-is** (home screen). It is not modified for MVP. (Its later enhancement to consult the catalog is Phase 4 per strategy.)

### 4.3 Module boundaries

- **Backend (Convex):** new `curatedRoutes` public query module (browse + detail). Pure read path over existing tables; no schema change required for MVP (confirm enrichment shape covers detail needs).
- **Client data:** one new hook `useCuratedDiscovery` (Convex `useQuery`), returning the `Spot`-like shape the discovery screen already consumes, so the screen change is minimal.
- **Client UI:** re-point `RouteDiscoveryScreen` from mock → hook; add route-detail surface; add Save + handoff; mount tab + drawer entry.

---

## 5. Work breakdown (decomposes into the TaskList)

Ordered; dependencies noted. Recommended agents per `brain/agents` (RN frontend → `react-native-ui-*`; Convex → `convex-*`).

| # | Task | Scope / files | Acceptance criteria (integration/E2E unless noted) | Depends on | Agent |
|---|---|---|---|---|---|
| **D0** | **Verify live curated data** | `pnpm server:dev`; inspect `curated_routes` | Confirm row count, score distribution, `primaryArchetype`, `centroid`, geometry, and enrichment present in ≥1 founder region. If empty → run/locate artifact-publish path (`convex/curationArtifacts.ts`, `scripts/curation/publish_*`). **GATE: do not proceed on empty data.** | — | convex-implementer |
| **D1** | **Repo cleanup** | delete `react-native/`; fix `pnpm-workspace.yaml`; confirm `pnpm type-check` + build green | Stale shadow dir gone; build still green on both platforms | — | (direct) |
| **D2** | **`listCuratedRoutes` public query** | `convex/curatedRoutes.ts` (new) using `by_centroid`/`by_archetype`/`by_composite_score` | Given bbox/state + archetypes[] + sort, returns ranked curated routes (real data) with id/name/centroid/archetype/compositeScore; verified against live Convex | D0 | convex-implementer |
| **D3** | **`getCuratedRouteDetail` public query** | `convex/curatedRoutes.ts` | Given routeId, returns geometry + enrichment (one-liner, summary, badges, dimension scores); verified against live Convex | D0 | convex-implementer |
| **D4** | **`useCuratedDiscovery` Convex hook** | `hooks/use-curated-discovery.ts` (new) | Reactive `useQuery` returns discovery rows in the shape `RouteDiscoveryScreen` consumes; loading/empty states honored | D2 | react-native-ui-implementer |
| **D5** | **Wire + mount Discovery screen** | `route-discovery-screen.tsx` (mock→hook), `app/(app)/(tabs)/discover.tsx` (new), `(tabs)/_layout.tsx`, `MenuLayout` drawer entry | On device, Discover tab shows real pins; archetype filter + best/nearest sort work against live data; empty/loading overlays correct | D4 | react-native-ui-implementer |
| **D6** | **Route detail surface** | new detail route/screen + map geometry + enrichment render + basic weather | Tapping a pin/row opens detail with real geometry, description, scores, and basic conditions; verified on device | D3, D5 | react-native-ui-implementer |
| **D7** | **Save discovered route** | reuse save path; map curated route → `saved_routes`; `recordRouteFeedback('save')` | Saving from detail persists to library and appears in Saved screen; verified against live Convex | D6 | react-native-ui-implementer + convex-implementer |
| **D8** | **"Ride it" handoff** | new util: open-in-Google/Apple-Maps deep link (+ optional GPX) | From detail, hand off route to a maps app on iOS + Android | D6 | react-native-ui-implementer |
| **D9** | **On-device E2E gate** | iOS + Android, live Convex | Full MVP gate test (§2) passes with recorded evidence on both platforms | D5–D8 | (direct) + implementers |

Reviews: each backend task → `convex-reviewer`; each frontend task → `react-native-ui-reviewer`.

---

## 6. Testing & verification

Per the project's iron rule (real services, no mocks):

- **Backend (D2/D3/D7):** integration tests against **real Convex** (`convex-test` is insufficient for the acceptance bar; exercise live `pnpm server:dev`).
- **Pure logic only:** the curated-route → discovery-row / → saved-route transforms may have unit tests (zero-I/O, justified).
- **Primary gate (D9):** on-device E2E on **real iOS + real Android** against **live Convex** — watch the full job work for real. This is what "done" means.

---

## 7. Risks & decisions

| Risk / decision | Note |
|---|---|
| **R1 — Curated data may be thin/junky** | D0 is a hard gate. "Wire first, tune later" assumes data *exists*; if regions are empty, seeding (or the artifact-publish path) enters MVP scope. |
| **R2 — Detail needs geometry the catalog may store coarsely** | Confirm `curated_routes` geometry is renderable as a polyline in D3; if only centroid exists, detail geometry may need a derivation step (could expand D3/D6). |
| **R3 — Discovery query performance at catalog scale** | `by_centroid` bbox + score sort should suffice; watch result sizes; cap `limit`. |
| **R4 — Basic weather in detail** | Reuse existing weather actions/`route_enrichments`; keep it "basic conditions," not the deferred weather-intelligence. |
| **D — Offline path preserved** | The local-DB discovery hook (`use-route-discovery.ts`) is intentionally left in place, unused by MVP, for the offline fast-follow. |

---

## 8. What comes after MVP (named, so nothing is silently dropped)

In rough strategy order: NL search in Discovery (cloud → on-device) · offline-first (op-sqlite projection + on-device intent, reusing the preserved local-DB hook) · Waypoints / Moments · weather-informed discovery ("rideable this weekend?") · community submit/rate/share · scoring calibration + quality floor + flywheel rescoring · chat agent consulting the catalog · Voice Ride Companion · Pro tier + affiliate/sponsorship revenue.

---

## 9. Open questions for review

1. Is the **"ride it" handoff (item 5)** wanted in MVP, or cut to pure discovery + save?
2. Should this spec **live in `.spec/`** (the project's formal convention) and/or feed the `kb-prd-plan` / `kb-sprint-plan` pipeline, or remain a brainstorming artifact here?
3. Any founder **riding regions** to prioritize for the D0 data check / seeding?
