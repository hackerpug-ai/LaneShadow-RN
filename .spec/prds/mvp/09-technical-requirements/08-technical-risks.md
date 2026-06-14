---
stability: CONSTITUTION
last_validated: 2026-06-13
prd_version: 2.0.0
---

# Backend Technical Risks

## R-DATA-1 — Partial geometry (routePolyline 55%)
~45% of routes (2,557/5,654) have NO `routePolyline`. **Impact:** detail map can't draw a line for nearly half the catalog. **Mitigation (locked):** `getCuratedRouteDetail` returns `routePolyline: string | null`; client falls back to a centroid marker (centroid is 100% present). Acceptance explicitly tests both branches. Polyline backfill is post-MVP.

## R-DATA-2 — Dirty state strings (9 double-spelled states)
E.g. 'North-Carolina' (202) vs 'North Carolina' (43). **Impact:** a naive `by_state` equality filter silently drops ~18% of NC routes. **Mitigation (locked):** state-normalize transform probes BOTH spelling variants query-side and returns one canonical spelling. Pure, unit-tested. Write-back cleanup deferred.

## R-DATA-3 — Score scale confusion (0-1, not 0-100)
All scores are 0-1 (median composite 0.60, max 0.90); the orphan mock screen shows `score: 92`. **Impact:** if the API or UI treats them as 0-100, every route reads as ~0.6%. **Mitigation (locked):** API returns 0-1 with explicit field documentation; UI renders %/bars; acceptance asserts no 0-100 value escapes. Score-formatting is a pure transform.

## R-DATA-4 — Junk lengthMiles outliers
41 routes >1000mi (max 710,430), 64 at exactly 0. **Impact:** absurd '710,430 mi' or '0 mi' on cards/detail. **Mitigation (locked):** length-clamp transform returns `undefined` for non-positive or above-ceiling values; UI hides length when undefined. Pure, unit-tested.

## R-DATA-5 — Query performance at 5,654 rows
A full-table `.filter()` would scan all 5,654 docs per request. **Impact:** slow, non-interactive browse. **Mitigation (locked):** bbox/nearest via the **seeded geospatial index** (filterKeys + sortKey), state browse via `by_state` index (both normalized variants), best-sort via geospatial sortKey / `by_composite_score`, and a hard server-side `limit` cap. **No `.filter()` for geography or state.** Latency budget proven by `geospatialValidation.ts` (<500ms for nearest + rectangle).

## R-DATA-6 — Geospatial index drift / empty-on-launch
The component points table is a separate datastore and is currently EMPTY. **Impact:** if seeding is skipped or partial, bbox/nearest browse returns nothing — the hero screen is empty. **Mitigation:** UC-DATA-01 is a GATE that must precede listCuratedRoutes; seeding is idempotent and verified (point count ~= 5,654) against live Convex before D5 wiring. For MVP the catalog is static so one idempotent seed holds; re-sync-on-change is post-MVP.

## R-DATA-7 — saved_routes shape friction for bookmarks
`saved_routes` requires `planInput/routeSnapshot/routeIndex`; a curated bookmark has none. **Impact:** either schema churn or fabricated snapshots. **Mitigation (locked):** additive optional `curatedRouteRef`; recommended path is making the planned-payload fields optional + enforcing 'curatedRouteRef XOR planned-payload' in the mutation, keeping the change additive and non-destructive (see 03-data-schema open decision).

## R-DATA-8 — Empty enrichment misread as a bug
`curated_route_enrichments` is EMPTY by design for MVP. **Impact:** a developer may 'fix' detail by wiring enrichment fetch and get nothing, or block on it. **Mitigation:** 04-api-design + acceptance explicitly state detail is LEAN-only and returns NO enrichment fields; enrichment is named OUT OF SCOPE.

## R-DATA-9 — Auth posture ambiguity on public reads — RESOLVED (2026-06-13)
Existing **client-callable public reads** (`savedRoutes`, `planningSessions`, `favoriteRoads`) are Clerk-gated via `requireIdentity`; the two new queries are client-callable (not `internalQuery`) and follow the same `requireIdentity` posture. (The curation pipeline's `leanSync` / `fetchEnrichments` are a separate `internalQuery`-via-HTTP pattern guarded by `CURATION_DEPLOY_KEY`, not Clerk — not the precedent here.) **Decision (locked):** both `listCuratedRoutes` and `getCuratedRouteDetail` are Clerk-gated via `requireIdentity` — Discovery browse requires an authenticated session for MVP. "Public" refers only to the Convex function being client-callable, not anonymous access. **Auth-gate precondition (verified 2026-06-13):** identity-routing infrastructure EXISTS — the `(auth)` group gates via Convex `<Authenticated>`/`<Unauthenticated>` (`app/(auth)/_layout.tsx`: unauthenticated → sign-in stack, authenticated → `<Redirect to /(app)>`), and `signOut` → `/(auth)/sign-in`. **But the `(app)` group lacks the reverse guard:** `app/index.tsx` redirects unconditionally to `/(app)/(tabs)` and neither `(app)/_layout.tsx` nor `(tabs)/_layout.tsx` redirects an unauthenticated session to `/(auth)/sign-in`, so a logged-out cold launch lands on the app home (queries client-skipped, e.g. `(tabs)/index.tsx` on `isSignedIn`) rather than the login page. The founder dogfood (always signed in via cached Clerk token) never observes this. Closing the gap is one small guard (`<Authenticated>`/`<Unauthenticated>` wrapper on `(app)` that redirects to `/(auth)/sign-in`) — a pre-existing app-level concern, candidate MVP task; not introduced by this MVP.
