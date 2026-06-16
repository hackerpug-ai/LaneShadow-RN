---
stability: FEATURE_SPEC
last_validated: 2026-06-15
prd_version: 3.0.0
functional_group: DATA
---

# Use Cases: Backend Data & Queries (DATA)

The foundational backend gates plus the read path that turn the existing 5,654-row curated_routes catalog into a discoverable surface. Owns the five enabling gates (seed @convex-dev/geospatial from centroids, UI<->DB archetype mapping in the query layer, the additive optional curatedRouteRef bookmark field on saved_routes, dirty-state-string normalization, junk-lengthMiles clamping) and the two net-new public queries (listCuratedRoutes for bbox/state/archetype/sort browse, getCuratedRouteDetail for lean detail + dimension scores + polyline-or-null + centroid for weather). Read path over existing tables: no destructive migration. Honors the verified D0 truths: scores are 0-1 (NOT 0-100), enrichment is EMPTY, routePolyline is ~55% present, oneLiner/badges/designation are 0% present.

| ID | Title | Tier |
|---|---|---|
| UC-DATA-01 | Seed @convex-dev/geospatial from curated_routes centroids | integration |
| UC-DATA-02 | Archetype mapping layer (UI enum <-> DB enum) | integration |
| UC-DATA-03 | Add curatedRouteRef bookmark field to saved_routes | integration |
| UC-DATA-04 | Normalize dirty state strings and clamp junk lengthMiles in the read path | integration |
| UC-DATA-05 | listCuratedRoutes public query (bbox via geospatial, state, archetype[], sort, limit) | integration |
| UC-DATA-06 | getCuratedRouteDetail public query (lean fields + dimension scores + polyline-or-null + basic weather) | integration |

---

## UC-DATA-01: Seed @convex-dev/geospatial from curated_routes centroids

GATE (SPATIAL-RESOLVE). The @convex-dev/geospatial component (v0.2.1) is installed and wired in geospatialIndex.ts (key=route doc id, coordinates=centroid, filterKeys={state, primaryArchetype}, sortKey=compositeScore) and registered in convex.config.ts, but its component points table is EMPTY (debugGeospatialData returns total_in_index=0). An internal seeding mutation/action must populate one geospatial point per curated_route from its centroidLat/centroidLng, carrying state + primaryArchetype as filterKeys and compositeScore as the sortKey, idempotently (re-running does not duplicate). This is the prerequisite for listCuratedRoutes bbox/nearest. Centroid is 100% present so every route is seedable; routes with junk centroids (if any) are skipped and logged. This is enabling-only: it does NOT alter curated_routes.

**Test tier:** integration  
**Verification service:** live Convex dev deployment

**Acceptance Criteria**

- ☐ Founder can run the geospatial seeding function against live Convex dev and observe the geospatial component points table populated with one point per curated_route (target ~5,654, allowing for skipped junk centroids).
- ☐ System can re-run the seeding function against live Convex without creating duplicate geospatial points for already-seeded routes.
- ☐ System can answer geospatial.nearest and geospatial.query (rectangle) against live Convex returning at least one real route for a founder riding region within the 500ms validation latency budget.
- ☐ System can store state and primaryArchetype as filterKeys and compositeScore as the sortKey on each seeded point so downstream bbox queries can filter and rank against live Convex.

---

## UC-DATA-02: Archetype mapping layer (UI enum <-> DB enum)

GATE (ARCHETYPE-ALIGN). The discovery UI archetype enum is twisties|scenic|technical|cruising|sport|adventure (+ 'all') — used now by the suggestion cards and chat-driven discovery (no filter chip UI in v3.0.0); the DB primaryArchetype union is twisties|mountain|coastal|adventure|scenic_byway|desert. Only 'twisties' and 'adventure' overlap exactly. The fix is a PURE mapping layer applied inside the query layer (UI archetype filter -> set of DB archetypes for filtering; DB primaryArchetype -> UI archetype for the returned card), NOT a destructive DB migration. Mapping (locked stance): scenic -> {scenic_byway, coastal}, technical -> {mountain}, cruising -> {scenic_byway} fallback, sport -> {twisties} fallback, desert -> adventure on the way back to UI, mountain/coastal/scenic_byway -> nearest UI bucket. The exact table is finalized in 04-api-design; the principle is locked: map in the read path, leave the DB enum untouched. listCuratedRoutes accepts UI archetypes and returns UI archetypes.

**Test tier:** integration  
**Verification service:** live Convex dev deployment (mapping transform itself unit-justified: pure, zero I/O)

**Acceptance Criteria**

- ☐ System can resolve a 'scenic' archetype request (from a suggestion card or chat-driven discovery) through listCuratedRoutes and return only curated_routes whose DB primaryArchetype maps to scenic (scenic_byway/coastal) from live Convex.
- ☐ Rider can receive every discovery card with a primaryArchetype value that is a valid UI archetype enum (never a raw DB-only value like mountain or desert) from live Convex.
- ☐ System can map a DB primaryArchetype with no exact UI equivalent (mountain, coastal, scenic_byway, desert) to a deterministic UI bucket so no route is dropped from results against live Convex.
- ☐ Founder can verify the archetype mapping is a pure deterministic transform (unit-tested, zero I/O) and that no curated_routes document's primaryArchetype value was mutated by this gate.

---

## UC-DATA-03: Add curatedRouteRef bookmark field to saved_routes

GATE (SAVE-RESOLVE). The existing saved_routes table requires planInput + routeSnapshot + routeIndex (a fully-planned route with legs/geometry) which curated routes LACK. Rather than synthesize fake PlanInput/legs, add an OPTIONAL curatedRouteRef: v.id('curated_routes') to savedRouteValidator so a curated save is a first-class 'bookmark'. This is an additive, non-destructive schema change: the new field is optional, existing planned saves are untouched, and the existing required fields (planInput/routeSnapshot/routeIndex) become conditionally relevant only for planned saves. Schema evolution stance: add optional -> ship. A curated save records the curatedRouteRef plus name/owner identity; it does NOT fabricate a RouteSnapshot. The Saved screen reopens a curated save by dereferencing curatedRouteRef back into getCuratedRouteDetail.

**Test tier:** integration  
**Verification service:** live Convex dev deployment

**Acceptance Criteria**

- ☐ Founder can deploy the additive optional curatedRouteRef field to live Convex without invalidating or rewriting any existing saved_routes document.
- ☐ Rider can create a saved_routes row that references a curated_routes id via curatedRouteRef without supplying a fabricated planInput/routeSnapshot/routeIndex, verified against live Convex.
- ☐ System can distinguish a curated bookmark (curatedRouteRef present) from a planned save (planInput/routeSnapshot present) when listing a Rider's library against live Convex.
- ☐ System can reject a saved_routes write that has neither curatedRouteRef nor a valid planned-route payload so no empty/garbage save is persisted to live Convex.

---

## UC-DATA-04: Normalize dirty state strings and clamp junk lengthMiles in the read path

GATE (DATA-NORM). Live data is dirty: 9 states appear under two spellings (e.g. 'North-Carolina' 202 vs 'North Carolina' 43), so a state filter on the raw string silently misses rows; and lengthMiles has outliers (41 routes >1000mi, max 710,430; 64 at exactly 0). Fix in the READ PATH, not by mutating the catalog: (1) a pure state-normalize transform canonicalizes both query-side (a 'North Carolina' filter matches both spellings via normalized comparison or a normalized index probe over both variants) and return-side (cards return one canonical spelling); (2) a pure length-clamp transform sanitizes lengthMiles on the way out (values <=0 or above a sane ceiling are returned as undefined/clamped, never rendered as 710,430mi or 0mi). Both are deterministic, zero-I/O transforms. They do NOT write back to curated_routes (write-back normalization is a deferred fast-follow).

**Test tier:** integration  
**Verification service:** live Convex dev deployment (state-normalize + length-clamp transforms unit-justified: pure, zero I/O)

**Acceptance Criteria**

- ☐ System can resolve a state request (e.g. North Carolina, from chat-driven discovery) through listCuratedRoutes and return routes stored under BOTH spelling variants of that state from live Convex.
- ☐ Rider can view a discovery card whose lengthMiles is sanitized so no route ever displays an absurd length (>1000mi outlier or 0mi) sourced from live Convex.
- ☐ System can return a single canonical state spelling on every discovery card regardless of which raw spelling the underlying curated_routes document stored, verified against live Convex.
- ☐ Founder can verify state-normalize and length-clamp are pure deterministic transforms (unit-tested, zero I/O) and that the gate performs no write-back to the curated_routes catalog.

---

## UC-DATA-05: listCuratedRoutes public query (bbox via geospatial, state, archetype[], sort, limit)

FEATURE (D2). The net-new public Convex query that powers the Discovery home. No public browse query exists today (the curation `leanSync` is an `internalQuery` invoked via an HTTP admin route guarded by `CURATION_DEPLOY_KEY`, not a Clerk-gated client-callable query). Args: an optional bbox (north/south/east/west) OR an optional state OR an optional center{lat,lng}; archetypes[] (UI enums, empty = all); sort = 'best' (compositeScore desc) | 'nearest' (distance from center asc); limit (capped, default ~50). Behavior: when bbox/center is given, resolve candidate route ids via the seeded geospatial index (UC-DATA-01) using filterKeys for state/archetype and sortKey for best-sort, then load lean fields from curated_routes; when only state is given, use the by_state index with state-normalization (UC-DATA-04) over both spellings. Returns a lean ranked array of cards: {routeId, name, state(canonical), primaryArchetype(UI-mapped, UC-DATA-02), centroidLat, centroidLng, compositeScore(0-1), all 5 dimension scores(0-1, optional), lengthMiles(clamped, optional), distanceMi?(when sort=nearest), summary?}. Scores are 0-1; the UI renders them as % or bars. No enrichment is read (table empty). Returns validator is fully specified (returns on all public functions). Must be performant at 5,654 rows: bbox+limit caps result size, never a full-table filter().

**Test tier:** integration  
**Verification service:** live Convex dev deployment

**Acceptance Criteria**

- ☐ Rider can request listCuratedRoutes with a bbox and receive only curated routes whose centroids fall inside that bbox, ranked by compositeScore, from live Convex.
- ☐ Rider can request listCuratedRoutes with sort='nearest' and a center point and receive routes ordered by ascending distance with a distanceMi field populated, from live Convex.
- ☐ Rider can request listCuratedRoutes with archetypes=['scenic','twisties'] and receive only routes whose DB archetype maps into that UI set, with primaryArchetype returned as a UI enum, from live Convex.
- ☐ Rider can request listCuratedRoutes by state name and receive routes stored under both dirty spelling variants of that state, from live Convex.
- ☐ System can return every card with compositeScore and dimension scores on a 0-1 scale and lengthMiles clamped, so no 0-100 score or 710,430mi length escapes to the client, verified against live Convex.
- ☐ System can cap the result set to the requested limit and complete a bbox browse over the 5,654-row catalog within an interactive latency budget against live Convex (never a full-table scan).

---

## UC-DATA-06: getCuratedRouteDetail public query (lean fields + dimension scores + polyline-or-null + basic weather)

FEATURE (D3). The net-new public query for the route detail surface. Arg: routeId (curated_routes id or routeId string). Returns LEAN data only (curated_route_enrichments is EMPTY, so NO photos/history/elevation/recommendedStarts): {routeId, name, state(canonical), primaryArchetype(UI-mapped), centroidLat/Lng, bounds, compositeScore(0-1), curvature/scenic/technical/traffic/remoteness scores(0-1, optional), lengthMiles(clamped, optional), summary?/description?, source/sourceLabel?/sourceUrl?, routePolyline: string | null (present for ~55%; null for the other ~45% so the client falls back to a centroid marker), geometrySource?}. oneLiner/badges/designation are 0% populated so the headline is DERIVED from summary or name and NO badges are returned. Basic weather: the existing getCurrentWeather action (Open-Meteo) is invoked from the client/detail using the route centroid for 'is it rideable today' conditions; this query exposes the centroid the weather call needs and does NOT block on weather (weather is a separate action call, gracefully degradable to 'conditions unavailable'). Returns validator fully specified; polyline field explicitly v.union(v.string(), v.null()).

**Test tier:** integration  
**Verification service:** live Convex dev deployment + live Open-Meteo weather provider

**Acceptance Criteria**

- ☐ Rider can open getCuratedRouteDetail for a route that HAS a routePolyline and receive the encoded polyline string for map rendering, from live Convex.
- ☐ Rider can open getCuratedRouteDetail for a route that LACKS a routePolyline and receive routePolyline=null plus a valid centroid so the client falls back to a centroid marker, from live Convex.
- ☐ Rider can view a detail headline derived from summary or name (never a missing oneLiner) and a detail body with dimension scores on a 0-1 scale, from live Convex.
- ☐ Rider can see basic current conditions for the route by the client invoking getCurrentWeather with the route centroid returned by this query, against the live weather provider, and still see the detail if weather is unavailable.
- ☐ System can return getCuratedRouteDetail with NO enrichment fields (no photos/history/elevation) because curated_route_enrichments is empty, verified against live Convex.

---
