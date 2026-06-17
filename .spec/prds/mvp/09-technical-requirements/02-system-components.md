---
stability: CONSTITUTION
last_validated: 2026-06-13
prd_version: 2.0.0
---

# Backend System Components

## Components touched / added for the Discovery data layer

| Component | Status | Role in MVP | File(s) |
|---|---|---|---|
| `curated_routes` table | EXISTS, 5,654 rows | Source of truth for browse + detail (read-only in MVP) | `convex/schema.ts`, `server/models/curated-routes.ts` |
| `curated_route_enrichments` table | EXISTS, EMPTY (0 docs) | NOT read in MVP (deferred) | `convex/schema.ts` |
| `@convex-dev/geospatial` component (v0.2.1) | INSTALLED + registered, points table EMPTY | Bbox / nearest spatial index, seeded from centroids | `convex/convex.config.ts`, `convex/geospatialIndex.ts` |
| Geospatial seeding fn | NET-NEW (internal) | Populate geospatial points from `curated_routes` centroids (UC-DATA-01) | new internal mutation/action |
| `listCuratedRoutes` | NET-NEW public query (Clerk-gated, `requireIdentity`) | Browse: bbox/state/archetype[]/sort/limit (UC-DATA-05) | new module (e.g. `convex/curatedRoutes.ts`) |
| `getCuratedRouteDetail` | NET-NEW public query (Clerk-gated, `requireIdentity`) | Lean detail + scores + polyline-or-null (UC-DATA-06) | same new module |
| Archetype map (pure) | NET-NEW transform | UI<->DB archetype mapping in read path (UC-DATA-02) | pure helper, unit-tested |
| State-normalize (pure) | NET-NEW transform | Canonicalize dirty state strings (UC-DATA-04) | pure helper, unit-tested |
| Length-clamp (pure) | NET-NEW transform | Sanitize junk lengthMiles (UC-DATA-04) | pure helper, unit-tested |
| `saved_routes` table | EXISTS | Gains optional `curatedRouteRef` for bookmarks (UC-DATA-03) | `server/models/saved-routes.ts`, `convex/schema.ts` |
| Save mutation path | EXISTS, extended | Persist a curated bookmark via `curatedRouteRef` | existing save mutation (reused) |
| `recordRouteFeedback` | EXISTS, public mutation | `save` action recorded as flywheel input on save | `convex/db/routeFeedback.ts` |
| `getCurrentWeather` action | EXISTS, public action | Basic 'rideable today' conditions from route centroid (Open-Meteo) | `convex/actions/weather.ts` |
| `geospatialValidation.ts` | EXISTS (validation-only) | Latency proof for nearest/rectangle (<500ms); remove before prod | `convex/geospatialValidation.ts` |

### Data flow (cloud read path)
```
Discovery home -> useCuratedDiscovery -> api.curatedRoutes.listCuratedRoutes(bbox|state, archetypes[], sort, limit)
  -> [geospatial.query/nearest over seeded points] + [curated_routes lean load] + [archetype map + state-normalize + length-clamp]
  -> ranked lean cards (scores 0-1, primaryArchetype as UI enum)
Detail -> api.curatedRoutes.getCuratedRouteDetail(routeId)
  -> lean fields + dimension scores + routePolyline|null + centroid
  -> client: getCurrentWeather(centroid)  [basic conditions, degradable]
  -> Save -> saved_routes{curatedRouteRef} + recordRouteFeedback('save')
  -> Ride it -> maps deep-link (client; not backend)
```

### What is explicitly NOT a backend component in MVP
Enrichment fetch (table empty), semantic/vector search (`by_embedding`), NL intent parsing, weather-intelligence (best-day scoring), community submit/rate, write-back catalog normalization, scoring calibration/flywheel rescoring.
