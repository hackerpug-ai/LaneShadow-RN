---
stability: CONSTITUTION
last_validated: 2026-06-13
prd_version: 2.0.0
---

# External Dependencies (Backend)

## @convex-dev/geospatial — spatial index component
- **Version:** 0.2.1 (pinned in `geospatialIndex.ts` comment).
- **Status:** installed, registered in `convex.config.ts` (`app.use(geospatial)`), wired in `geospatialIndex.ts`. **Points table EMPTY** — MVP must seed it (UC-DATA-01).
- **Shape (already declared):** `GeospatialIndex<string, { state: string; primaryArchetype: string }>` — key = route doc id, filterKeys = state + primaryArchetype, sortKey = compositeScore.
- **APIs used:** `geospatial.insert/add` (seeding), `geospatial.query({shape: rectangle})` (bbox browse), `geospatial.nearest({point, limit})` (nearest sort). Validation already proven in `geospatialValidation.ts` against Nashville + a Southeast box with a <500ms latency assertion (note: that file is validation-only and should be removed/quarantined before prod).
- **Risk:** component is a separate datastore from `curated_routes` — it can drift out of sync with the catalog. Seeding must be idempotent and (post-MVP) re-run when the catalog changes. For MVP the catalog is static, so a one-shot idempotent seed suffices.

## Weather provider — Open-Meteo (via existing Convex action)
- **Endpoint:** `https://api.open-meteo.com/v1/forecast` (no API key; free tier).
- **Function:** `api.weather.getCurrentWeather({lat, lng})` action (`server/convex/actions/weather.ts`), `'use node'`, Clerk-gated. Returns `{tempF, condition (CLEAR|CLOUDY|RAIN|SNOW|FOG|WIND|STORM), severity (normal|advisory|warning), dayOfWeek}`. Has 8s timeout + single retry; throws `WEATHER_UNAVAILABLE` ConvexError on failure.
- **MVP use:** 'basic conditions' on the detail screen, called with the route centroid. This is **not** the deferred weather-intelligence (best-day-to-ride) feature.
- **Risk:** third-party availability/rate limits. Detail MUST degrade gracefully to 'conditions unavailable' (the action already surfaces a typed error).

## Convex platform + Clerk auth
- All existing curation reads use `requireIdentity` (Clerk). The two new client-callable queries inherit this posture — both are Clerk-gated via `requireIdentity` (decision locked 2026-06-13, resolving R-DATA-9 / open item #74). "Public" describes the Convex function being client-callable (not `internalQuery`), not anonymous access. See the Auth-gate precondition in [04-api-design.md](./04-api-design.md).

## Maps deep-link (client, named for completeness)
- 'Ride it' opens Google/Apple Maps via deep link — a **client** concern (no backend dependency). Listed so it is not silently dropped from the data layer's awareness.
