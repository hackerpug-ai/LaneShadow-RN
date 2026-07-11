---
stability: CONSTITUTION
last_validated: 2026-07-10
prd_version: 1.0.0
---

# Architecture Diagram

```
 OPERATOR (npx convex run / driver scripts, serial)
 ┌───────────────────────────────────────────────────────────────────────────────┐
 │ scripts/hygiene-curated-routes.ts        scripts/reconstruct-curated-geometry.ts│
 │ scripts/classify-curated-routes.ts       scripts/geometry-coverage-report.ts    │
 │ scripts/geometry-couch-sample.ts (renders Mapbox PNGs LOCALLY → .tmp/GEO/)      │
 └───────────────┬───────────────────────────────────────────────────────────────┘
                 │ npx convex run  (bounded batch per call; cursor resume;
                 │  lever-2 --all REFUSED until couchGateStatus = pass)
                 ▼
 CONVEX INTERNAL FUNCTIONS  (operator-only, deployment-env keys)
 ┌────────────────────────────────────────────────────────────────────────────┐
 │  default runtime                     │  'use node' actions (external calls)  │
 │  ────────────────                    │  ──────────────────                   │
 │  curatedGeometryHygiene   (HYG)      │  curatedGeometryReconstruct (lever 2) │
 │  curatedGeometryPromote   (lever 1)  │  curatedGeometryReroute     (lever 3) │
 │  curatedGeometryGate [PURE gate] ◄───┼── imported ──► curatedGeometryClassify│
 │  curatedGeometry (data-access)       │                                       │
 │  curatedGeometryReview (founder ops) │      │ LLM anchors  │ geocode │ route │
 └──────────────┬───────────────────────┴──────┼──────────────┼─────────┼──────┘
                │ persist (deterministic,       ▼              ▼         ▼
                │  atomic route+side-table)  ┌────────────┐ ┌──────────┐ ┌──────────┐
                │                            │ LLM tiers  │ │ Google   │ │ Google   │
                │                            │ geometry:  │ │ Geocoding│ │ Routes   │
                │                            │  Anthropic │ │ API      │ │ compute  │
                │                            │ classifier:│ └──────────┘ │ Routes   │
                │                            │  x-provider│              └──────────┘
                │                            │  (pi-ai)   │
                │                            └────────────┘
                ▼
 TABLES
 ┌───────────────────────────────┐        ┌───────────────────────────────────────┐
 │ curated_routes                │ 1───1  │ curated_route_geometry (side table)    │
 │  geometryStatus / Provenance  │◄──────►│  value/segments + verification{ratio,  │
 │  riderReady (INDEXED)         │ routeId│   verdict,attempts,anchorCount} +      │
 │  rideWorthiness / retiredAt   │        │   provenance + anchors[]               │
 │  duplicateOf / quarantine     │        └───────────────────────────────────────┘
 │  by_riderReady_and_score      │
 │  by_geometry_status           │
 └──────────┬────────────────────┘
            │ GATED READ PATH (riderReady=true only; retired/shadow/quarantine excluded;
            │  saved-route detail reachability preserved)
            ▼
 PUBLIC (Clerk-gated)                      RN APP SURFACES
 ┌────────────────────────────┐           ┌────────────────────────────────────────┐
 │ listCuratedRoutes          │──────────►│ discovery pills/pins/carousel/chat cards│
 │ getCuratedRouteDetail      │           │ curated-route/[id] detail + provenance  │
 │ discoverCuratedRoutes tool │           │  caption; thin region → HONEST ABSENCE  │
 └────────────────────────────┘           │  (labeled fallback, no fabricated 0mi)  │
                                          └────────────────────────────────────────┘
```
