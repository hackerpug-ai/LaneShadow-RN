---
stability: TEST_SPEC
last_validated: 2026-06-14
prd_version: 2.0.0
---

# E2E / Human Testing Criteria — Discovery-MVP

Version 1.0.0 · 2026-06-13 · 24 criteria across 20 use cases.

> **⚠️ DELTA-001 (v2.0.0, folded into Sprint 01):** The criteria below cover the as-built Sprint 01 DISC use cases (dedicated Discover screen). Criteria for the delta UCs (**UC-DISC-09/10/11** — curated-route suggestion pills + chat-driven curated discovery on the map/chat home) are authored JIT when Sprint 01 is re-expanded, against real iOS + Android + live Convex, with the NL/intent signal **fixtured at the determinism seam** (assert which curated routes are surfaced/plotted, not prose). Criteria **T-DISC-002 / 005 / 006 / 007 / 008** are re-scoped or retired when the dedicated screen is removed. See [DELTA-001](./DELTA-001-unified-map-chat-discovery.md).

Per the project iron rule: integration/E2E against **real services** is the primary acceptance bar. The capstone is the on-device journey (UC-DISC-01) verified on real iOS + real Android against live Convex.

| Type | Count |
|---|---|
| integration-test | 10 |
| build-gate | 2 |
| human-gate | 4 |
| e2e-automated | 8 |

## DATA: Backend Data & Queries

### UC-DATA-01: Seed @convex-dev/geospatial from curated_routes centroids

| # | Criterion | AC Ref | Type | Setup | Pass/Fail |
|---|---|---|---|---|---|
| T-DATA-001 | After running the geospatial seeding function against live Convex dev, debugGeospatialData reports total_in_index approximately equal to the curated_routes count (~5,654, allowing skipped junk centroids), and a second run does not increase the count (idempotent). | UC-DATA-01 AC1, AC2 | integration-test | Run the new internal seeding mutation/action against the live Convex dev deployment that holds the 5,654-row curated_routes catalog; capture point count before, after first run, and after second run via debugGeospatialData. | PASS when post-seed point count is within tolerance of route count AND a re-run yields no net new points; FAIL on empty index, large undercount, or duplication on re-run. |
| T-DATA-002 | geospatial.nearest and geospatial.query(rectangle) over the seeded points return at least one real route for a founder riding region within the 500ms validation latency budget, with state and primaryArchetype available as filterKeys and compositeScore as sortKey. | UC-DATA-01 AC3, AC4 | integration-test | Against live Convex dev with the index seeded, issue a nearest query at a founder-region point and a rectangle query over a founder-region bbox; inspect returned filterKeys/sortKey and measure latency. | PASS when both queries return >=1 real route under 500ms and each point carries the expected filterKeys + sortKey; FAIL on empty result, missing keys, or latency over budget. |

### UC-DATA-02: Archetype mapping layer (UI enum <-> DB enum)

| # | Criterion | AC Ref | Type | Setup | Pass/Fail |
|---|---|---|---|---|---|
| T-DATA-003 | Filtering by UI archetype 'scenic' through listCuratedRoutes returns only routes whose DB primaryArchetype maps to scenic, every returned card's primaryArchetype is a valid UI enum (never a raw DB-only value like mountain/desert), and no route is dropped for lacking an exact UI equivalent. | UC-DATA-02 AC1, AC2, AC3 | integration-test | Call api.curatedRoutes.listCuratedRoutes against live Convex dev with archetypes=['scenic']; inspect the DB primaryArchetype of source rows and the returned primaryArchetype values across a representative bbox/state. | PASS when results are correctly filtered, all returned archetypes are UI enums, and DB-only values are deterministically bucketed; FAIL if a raw DB value escapes or an expected route is dropped. |
| T-DATA-004 | The archetype-map transform is a pure deterministic function (unit-tested, zero I/O) and no curated_routes document's primaryArchetype value is mutated by the gate (verified by comparing a sample of DB rows before/after). | UC-DATA-02 AC4 | build-gate | Run the pure archetype-map unit suite (UNIT_TEST_JUSTIFIED: pure, zero I/O); separately query a sample of curated_routes primaryArchetype values before and after the gate ships against live Convex dev. | PASS when unit tests are green AND sampled DB archetype values are byte-identical pre/post; FAIL on any test failure or any observed DB mutation. |

### UC-DATA-03: Add curatedRouteRef bookmark field to saved_routes

| # | Criterion | AC Ref | Type | Setup | Pass/Fail |
|---|---|---|---|---|---|
| T-DATA-005 | The additive optional curatedRouteRef field deploys to live Convex without invalidating any existing saved_routes document, a saved_routes row can be created with only curatedRouteRef (no planInput/routeSnapshot/routeIndex), the listing path distinguishes a curated bookmark from a planned save, and a write with neither curatedRouteRef nor a valid planned payload is rejected. | UC-DATA-03 AC1, AC2, AC3, AC4 | integration-test | Deploy the schema change to live Convex dev; create a curated bookmark via the save mutation with curatedRouteRef set; list a rider's library; attempt an invalid empty save; verify pre-existing planned saves remain readable. | PASS when deploy preserves existing docs, the curated bookmark persists and is distinguishable, and the invalid write is rejected; FAIL on schema rejection of existing docs, fabricated-payload requirement, or an empty/garbage save persisting. |

### UC-DATA-04: Normalize dirty state strings and clamp junk lengthMiles in the read path

| # | Criterion | AC Ref | Type | Setup | Pass/Fail |
|---|---|---|---|---|---|
| T-DATA-006 | A state filter (e.g. 'North Carolina') returns routes stored under BOTH dirty spelling variants, every returned card shows a single canonical state spelling, and no card ever displays an absurd lengthMiles (>1000mi outlier or 0mi) sourced from live data. | UC-DATA-04 AC1, AC2, AC3 | integration-test | Call listCuratedRoutes with state='North Carolina' against live Convex dev; compare result count to the known split (202 'North-Carolina' + 43 'North Carolina'); inspect returned state strings and lengthMiles across the result set. | PASS when both spelling variants are returned under one canonical spelling and all lengths are sanitized; FAIL if either variant is dropped, mixed spellings escape, or a junk length renders. |
| T-DATA-007 | state-normalize and length-clamp are pure deterministic transforms (unit-tested, zero I/O) and the gate performs no write-back to curated_routes (verified by sampling DB rows before/after). | UC-DATA-04 AC4 | build-gate | Run the pure state-normalize and length-clamp unit suites (UNIT_TEST_JUSTIFIED: pure, zero I/O); sample curated_routes state and lengthMiles values before and after the gate against live Convex dev. | PASS when unit tests are green AND no DB write-back is observed; FAIL on any test failure or observed mutation of curated_routes. |

### UC-DATA-05: listCuratedRoutes public query (bbox via geospatial, state, archetype[], sort, limit)

| # | Criterion | AC Ref | Type | Setup | Pass/Fail |
|---|---|---|---|---|---|
| T-DATA-008 | listCuratedRoutes returns correct results for each browse mode against live Convex: a bbox query returns only centroids inside the box ranked by compositeScore; sort='nearest' with a center returns ascending-distance results with distanceMi populated; archetypes=['scenic','twisties'] returns only mapped routes with UI-enum archetypes; a state query returns both dirty spelling variants; every card carries 0-1 scores and clamped lengthMiles; and the result honors the limit cap without a full-table scan. | UC-DATA-05 AC1, AC2, AC3, AC4, AC5, AC6 | integration-test | Exercise api.curatedRoutes.listCuratedRoutes against live Convex dev across all four arg modes (bbox, nearest+center, archetypes[], state) plus a limit/perf check over the 5,654-row catalog; inspect score scale, lengthMiles, distanceMi, and measure latency. | PASS when every mode returns correct, ranked, capped results with 0-1 scores and clamped lengths within interactive latency; FAIL on any out-of-box result, missing distanceMi, 0-100 score escape, junk length, dropped state variant, or full-table scan. |

### UC-DATA-06: getCuratedRouteDetail public query (lean fields + dimension scores + polyline-or-null + basic weather)

| # | Criterion | AC Ref | Type | Setup | Pass/Fail |
|---|---|---|---|---|---|
| T-DATA-009 | getCuratedRouteDetail returns the encoded polyline string for a route that HAS geometry, returns routePolyline=null plus a valid centroid for a route that LACKS geometry, returns a headline-capable summary/name and 0-1 dimension scores, exposes the centroid the client uses for getCurrentWeather, and returns NO enrichment fields (no photos/history/elevation). | UC-DATA-06 AC1, AC2, AC3, AC5 | integration-test | Call api.curatedRoutes.getCuratedRouteDetail against live Convex dev for a known polyline-present route and a known polyline-absent route (from the verified ~55%/~45% split); inspect the returned shape including the explicit v.union(string,null) polyline field and absence of enrichment fields. | PASS when both geometry branches return correctly, scores are 0-1, name/summary support a headline, and no enrichment field is present; FAIL on a missing centroid for the null-polyline case, a 0-100 score, or any enrichment field leaking. |
| T-DATA-010 | The client can render basic current conditions by invoking api.weather.getCurrentWeather with the centroid returned by getCuratedRouteDetail against the live Open-Meteo provider, and the detail still renders fully when weather is unavailable. | UC-DATA-06 AC4 | integration-test | From a detail context against live Convex dev, fetch the route centroid then call getCurrentWeather; separately simulate weather failure (typed WEATHER_UNAVAILABLE) and confirm detail still renders. | PASS when real conditions return for a valid centroid AND detail degrades gracefully to 'conditions unavailable' on failure; FAIL if weather errors block the detail render or no real conditions are returned for a healthy provider. |

## DISC: Discovery Surface

### UC-DISC-01: Rider completes the full discover-to-ride journey on a real device

| # | Criterion | AC Ref | Type | Setup | Pass/Fail |
|---|---|---|---|---|---|
| T-DISC-001 | On a real iOS device and a real Android device against live Convex, the founder completes the full arc: app opens to Discovery (not chat), sees real nearby and by-state pins from the 5,654-route catalog, filters by archetype and sorts best/nearest with the pin set updating, taps a route to a detail view (headline + score bars + geometry-or-centroid + basic conditions), saves it and finds it in Saved on reopen, and hands off to Google/Apple Maps to navigate. | UC-DISC-01 AC1, AC2, AC3, AC4, AC5, AC6, AC7 | human-gate | D9 capstone: build and run the app on a real iOS device and a real Android device pointed at the live Convex dev deployment; the founder performs the end-to-end discover-to-ride journey in a region he actually rides; record video/screenshot evidence per platform. | PASS when the entire arc completes on BOTH platforms against live services with recorded evidence and no mocks; FAIL if any step (default landing, live pins, filter/sort, detail, save+reopen, maps handoff) breaks on either platform. |

### UC-DISC-02: Discovery is the default home and the chat planning agent is demoted to a Plan-a-ride drawer entry

| # | Criterion | AC Ref | Type | Setup | Pass/Fail |
|---|---|---|---|---|---|
| T-DISC-002 | On a real device cold launch, the app lands on the Discovery screen (not the chat map); the drawer shows 'Discover' as the primary Navigate entry and a separate 'Plan a ride' entry that opens the unmodified chat planning screen; and navigating Discover -> Plan a ride -> Discover never points two drawer entries at the same screen. | UC-DISC-02 AC1, AC2, AC3, AC4, AC5 | e2e-automated | Cold-launch the app on a real iOS and real Android device against live Convex; assert via testIDs (drawer-discover, drawer-plan-a-ride) the landing screen and drawer routing; confirm index.tsx (chat) is reachable only via 'Plan a ride' and is rendered unchanged. | PASS when cold launch lands on Discovery, both drawer entries resolve to distinct routes, and chat is reachable+unmodified via 'Plan a ride'; FAIL if the app opens on chat, a duplicate-landing drawer entry exists, or chat internals were edited. |
| T-DISC-002b | The chat planning agent is demoted, not deleted: on a real device the default landing route is Discovery, the drawer 'Plan a ride' entry opens the chat screen, the chat screen (index.tsx) renders unchanged beyond the default-landing rewiring, and the drawer never points two entries at the same screen across a Discover → Plan a ride → Discover loop. | UC-DISC-02 AC6, AC7, AC8, AC9, AC10 | e2e-automated | On a real iOS and Android device against live Convex, inspect the expo-router default route + MenuLayout drawer entries; git-diff index.tsx to confirm chat internals are untouched beyond routing; drive the Discover→Plan-a-ride→Discover navigation loop. | PASS when default route is Discovery, 'Plan a ride' resolves to the unmodified chat screen, 'Discover' returns to the Discovery home, and no two drawer entries resolve to the same route; FAIL on chat-as-default, edited chat internals, or duplicate-target drawer entries. |

### UC-DISC-03: Rider discovers roads in a state they are curious about

| # | Criterion | AC Ref | Type | Setup | Pass/Fail |
|---|---|---|---|---|---|
| T-DISC-003 | On a real device against live Convex, selecting a state shows that state's curated pins, results include routes stored under both dirty spelling variants of the state, combining state + archetype + best/nearest sort narrows results accordingly, and choosing a state+filter combination with no matches shows the empty overlay. | UC-DISC-03 AC1, AC2, AC3, AC4 | e2e-automated | On a real iOS/Android device against live Convex, open the StateFilterSheet, select a known double-spelled state (e.g. North Carolina), then layer an archetype filter and sort; also drive a zero-match state+filter combination. | PASS when state browse returns both spelling variants, combined filters narrow correctly, and zero-match shows the empty overlay; FAIL if a spelling variant is missing, filters do not compose, or the empty state does not appear. |

### UC-DISC-04: useCuratedDiscovery hook returns live rows in the shape RouteDiscoveryScreen consumes

| # | Criterion | AC Ref | Type | Setup | Pass/Fail |
|---|---|---|---|---|---|
| T-DISC-004 | useCuratedDiscovery against live Convex returns rows in the {id,name,lat,lng,archetype(UI enum),score,distanceMi} shape the screen iterates over, surfaces a loading state when routes is undefined and a distinct empty state when routes===[], derives query center from useCurrentLocation when no center is passed, applies UI-enum archetypes and best\|nearest sort, and carries compositeScore through on the raw 0-1 scale without rescaling. | UC-DISC-04 AC1, AC2, AC3, AC4, AC5 | integration-test | Render a harness mounting useCuratedDiscovery against live Convex dev (api.curatedRoutes.listCuratedRoutes); assert returned row shape, loading/empty conventions, location-derived center, filter/sort pass-through, and 0-1 score values. | PASS when the hook returns the exact consumed shape with correct loading/empty signals, location-derived center, working filter/sort, and unrescaled 0-1 scores; FAIL on shape mismatch, conflated loading/empty, missing center derivation, or any 0-100 rescale. |

### UC-DISC-05: Wire RouteDiscoveryScreen from MOCK_ROUTES to the live hook with archetype chips, best/nearest sort, and empty/loading overlays

| # | Criterion | AC Ref | Type | Setup | Pass/Fail |
|---|---|---|---|---|---|
| T-DISC-005 | On a real device against live Convex, Discovery shows real curated pins instead of the 8 mock routes; tapping an archetype chip updates the pin set and chip counts from live data; toggling Best/Nearest updates pin ordering and rank/distance labels; the loading and empty overlays appear at the right times; and composite scores render as bars/percent of a 0-1 value, never as a raw 0-100 number. | UC-DISC-05 AC1, AC2, AC3, AC4, AC5 | e2e-automated | On a real iOS/Android device against live Convex, open Discovery; via testIDs (route-pin-{routeId}, discovery-filter-bar-chip-{archetype}, discovery-sort-toggle, discovery-loading-overlay, discovery-empty-overlay) exercise chips, sort, and an empty bbox; inspect rendered score format. | PASS when live pins replace mocks, chips/counts and sort update from live data, overlays fire correctly, and scores render as bars/percent; FAIL on any mock route appearing, stale counts, non-updating sort, missing overlay, or a raw 0-100/decimal score. |

### UC-DISC-06: Resolve the map-component divergence: standardize Discovery pins on MapboxMapView

| # | Criterion | AC Ref | Type | Setup | Pass/Fail |
|---|---|---|---|---|---|
| T-DISC-006 | On a real device, Discovery pins are rendered by MapboxMapView (the same engine as the home map) with no react-native-maps map mounted on the screen, RoutePin visuals (copper circle, archetype icon, rank badge, distance label) render without importing Marker from react-native-maps, tapping a Mapbox pin opens the detail handler with the correct routeId, and camera center is passed as [lng,lat] while marker coordinates are {latitude,longitude} without transposition. | UC-DISC-06 AC1, AC2, AC3, AC4 | e2e-automated | On a real iOS and real Android device, mount the wired Discovery screen; verify the native map is Mapbox (no react-native-maps instance), tap pins to assert routeId routing, and confirm pin placement matches expected coordinates (no lat/lng swap) against known route centroids. | PASS when only MapboxMapView is mounted, pins render+tap correctly with the right routeId, and coordinates are not transposed; FAIL if a second map SDK mounts, pins fail to render/tap, or pins are misplaced due to coordinate transposition. |

### UC-DISC-07: Discovery surface legibility on a phone: pin density, filter bar, sort affordance

| # | Criterion | AC Ref | Type | Setup | Pass/Fail |
|---|---|---|---|---|---|
| T-DISC-007 | On real iPhone and Android devices at zoom levels 8/10/12 against live Convex, every visible route pin has a >=44x44dp tap target, the glassmorphic filter bar + sort toggle leave >=60% of an iPhone 14 portrait viewport as unobstructed map, the sort toggle shows its active segment, chips show live count badges (formatted), pins are legible against both light and dark Mapbox styles, rank badges show on 'best' and distance labels show on 'nearest'. | UC-DISC-07 AC1, AC2, AC3, AC4, AC5, AC6, AC7, AC8 | human-gate | On a real iPhone 14 (390x844pt) and a real Android device against live Convex, visually inspect Discovery at zoom 8/10/12 in portrait; verify touch-target hit area with a gloved tap, overlay coverage budget, active-state affordances, count badge formatting, and pin contrast on both base map styles. | PASS when touch targets, map-visibility budget, active-state affordances, formatted live counts, and pin contrast all meet spec on both devices; FAIL on any sub-44dp target, >40% overlay obstruction, ambiguous active state, hardcoded counts, or illegible pins on either style. |

### UC-DISC-08: Discovery empty and loading states are legible and non-misleading

| # | Criterion | AC Ref | Type | Setup | Pass/Fail |
|---|---|---|---|---|---|
| T-DISC-008 | On a real device against live Convex, the loading skeleton appears after 300ms of query loading (and does NOT flash when data resolves under 300ms), an empty bbox with no active filter shows 'No routes in this area' / 'Try zooming out or moving the map', an active archetype filter with zero results shows the archetype-specific message plus a working 'Clear filter' CTA that resets the filter and re-queries, and the empty overlay renders with the map visible behind it (not a solid blocking screen). | UC-DISC-08 AC1, AC2, AC3, AC4, AC5, AC6 | e2e-automated | On a real iOS/Android device against live Convex, navigate to an ocean bbox (zero routes) with and without an active filter; throttle/observe query timing to verify the 300ms debounce; tap the 'Clear filter' CTA and confirm re-query. | PASS when the debounce prevents flash, the two empty messages are context-correct, the Clear-filter CTA resets and re-queries, and the map is visible behind the overlay; FAIL on skeleton flash, wrong/empty messaging, a non-functional CTA, or a solid blocking empty screen. |

## DTL: Route Detail

### UC-DTL-01: Lean route detail layout renders correctly from real Convex data

| # | Criterion | AC Ref | Type | Setup | Pass/Fail |
|---|---|---|---|---|---|
| T-DTL-001 | On a real device against live Convex, the detail screen renders all six sections (header name + archetype badge + clamped length, summary-or-'No description yet', five score bars + composite headline, polyline-or-centroid map, weather row, Save+Ride-It action row) without a JS error or blank section for sampled curated_routes rows including ones missing summary and/or polyline. | UC-DTL-01 AC1, AC2, AC3, AC4, AC5, AC6, AC7, AC8, AC9, AC10, AC11, AC12 | e2e-automated | On a real iOS/Android device against live Convex, open getCuratedRouteDetail-backed detail for a sample spanning: summary-present, summary-absent, polyline-present, polyline-absent, and a junk/zero length route; assert each section renders via testID curated-detail-screen. | PASS when all six sections render correctly across every sampled variant with no error or blank section, length is clamped/hidden appropriately, and scores show as percent bars; FAIL on any crash, blank section, raw 0-1 float, or absurd length display. |

### UC-DTL-02: Score visualization: 0–1 float → labeled percentage bar

| # | Criterion | AC Ref | Type | Setup | Pass/Fail |
|---|---|---|---|---|---|
| T-DTL-002 | For real curated_routes rows, each ScoreDimensionBar fill width equals Math.round(score*100)% of the track for scores in [0,1], the left label and right percentage value render in the specified tokens, the bar uses the copper fill on the inset track at the pill radius and 8dp height, the composite headline shows Math.round(compositeScore*100)+'/100', and the score section is omitted (no broken layout) when all five dimension scores are null/undefined. | UC-DTL-02 AC1, AC2, AC3, AC4, AC5, AC6, AC7 | integration-test | Query real curated_routes rows from live Convex dev and render ScoreDimensionBar on device; measure rendered fill width against the expected percentage for several known scores; verify the all-null omission case. | PASS when rendered bar widths match expected percentages, tokens/dimensions are correct, the composite headline format is exact, and the section gracefully omits when all scores are null; FAIL on mismatched width, wrong format, or broken layout on omission. |

### UC-DTL-03: Geometry graceful degradation: centroid fallback with 'Approximate location' indicator

| # | Criterion | AC Ref | Type | Setup | Pass/Fail |
|---|---|---|---|---|---|
| T-DTL-003 | On a real iOS device against live Convex, a route from the ~45% no-polyline population shows a MapboxMapView centered on the centroid with a single marker at zoom ~11 plus an 'Approximate location' outline Badge below the map, while a polyline-present route shows the polyline and NO 'Approximate location' indicator, and neither case crashes or shows a blank map section. | UC-DTL-03 AC1, AC2, AC3, AC4, AC5 | e2e-automated | On a real iOS device against live Convex, open detail for a known no-polyline route and a known polyline-present route from the verified split; assert the centroid-fallback marker + badge on one and the polyline + no-badge on the other. | PASS when the no-polyline route falls back to a centroid marker + 'Approximate location' badge at appropriate zoom and the polyline route renders geometry without the badge, with no crash/blank in either; FAIL on a blank/crashed map, a missing badge on fallback, or a badge appearing when a polyline is present. |

### UC-DTL-04: Detail actions: Save and Ride It operate end-to-end

| # | Criterion | AC Ref | Type | Setup | Pass/Fail |
|---|---|---|---|---|---|
| T-DTL-004 | On a real iPhone 14 portrait, both the Save and Ride It buttons are visible without scrolling; tapping Save shows a loading state then a confirmed 'Saved' state without navigating away; tapping Ride It opens Apple Maps (iOS) / Google Maps (Android) at the centroid; and when the target maps app is absent the system falls back to the platform URL handler without crashing. | UC-DTL-04 AC1, AC2, AC3, AC4, AC5, AC6 | human-gate | On a real iPhone 14 and a real Android device against live Convex, open a curated detail; verify both action buttons (testIDs curated-detail-save, curated-detail-ride-it) are above the fold; exercise Save (observe loading->Saved) and Ride It (with maps app present and, on Android, uninstalled to force browser fallback). | PASS when both buttons are reachable without scrolling, Save shows loading->confirmed in place, Ride It opens the correct maps app at the centroid, and the missing-app fallback works; FAIL if a button requires scrolling, Save navigates away or shows no state, Ride It opens the wrong location, or the missing-app case crashes. |

## SAVE: Library & Handoff

### UC-SAVE-01: Save a curated route from detail via curatedRouteRef so it appears in Saved and reopens

| # | Criterion | AC Ref | Type | Setup | Pass/Fail |
|---|---|---|---|---|---|
| T-SAVE-001 | On a real device against live Convex, tapping Save on a curated detail persists a saved_routes row via curatedRouteRef (no fabricated planInput/routeSnapshot/routeIndex), fires recordRouteFeedback('save'), the route then appears in the existing Saved screen list and reopens its detail without a legs/PlanInput error, the SavedRouteCard renders the lean bookmark row without crashing, and the Save control reflects saved/unsave state for an already-bookmarked route. | UC-SAVE-01 AC1, AC2, AC3, AC4, AC5 | e2e-automated | On a real iOS/Android device against live Convex, save a curated route from detail; query saved_routes and routeFeedback against live Convex to confirm the curatedRouteRef row + 'save' feedback; navigate to the Saved screen (testID saved-routes-list), confirm the row, reopen it, and re-open the original detail to check Saved/Unsave state. | PASS when the bookmark persists via curatedRouteRef with feedback recorded, appears in Saved, reopens without error, renders in SavedRouteCard, and the Save control shows correct state; FAIL on a fabricated payload, missing feedback, list/reopen crash, or wrong Save-state. |

### UC-SAVE-02: 'Ride it' maps deep-link util hands off the route from centroid + name

| # | Criterion | AC Ref | Type | Setup | Pass/Fail |
|---|---|---|---|---|---|
| T-SAVE-002 | On a real iOS device tapping 'Ride it' opens Apple Maps at the route centroid with the route name as the query/label, on a real Android device it opens Google Maps at the centroid with the route name, the correct URL scheme is selected per Platform.OS using only the already-installed expo-linking, and when the native maps scheme cannot be opened (Linking.canOpenURL false) it falls back to a web maps URL. | UC-SAVE-02 AC1, AC2, AC3, AC4 | human-gate | On a real iPhone and a real Android device against live Convex, open a curated detail and tap 'Ride it' (testID curated-detail-ride-it); verify the launched maps app and destination; force the canOpenURL-false path (e.g. uninstall Google Maps on Android) to verify the web fallback; confirm no new dependency beyond expo-linking. | PASS when each platform opens its native maps app at the correct centroid+label, the scheme is chosen per Platform.OS with no new dependency, and the web fallback works when the native scheme is unavailable; FAIL on wrong app/location, a new dependency, or a crash/no-op when the native scheme is missing. |

## Coverage

Every final UC has >=1 e2e_criteria row and every authored AC is referenced. Coverage by group: DATA — UC-DATA-01 (T-DATA-001 AC1-2, T-DATA-002 AC3-4); UC-DATA-02 (T-DATA-003 AC1-3, T-DATA-004 AC4); UC-DATA-03 (T-DATA-005 AC1-4); UC-DATA-04 (T-DATA-006 AC1-3, T-DATA-007 AC4); UC-DATA-05 (T-DATA-008 AC1-6); UC-DATA-06 (T-DATA-009 AC1,2,3,5 + T-DATA-010 AC4). DISC — UC-DISC-01 journey (T-DISC-001 AC1-7, the D9 capstone human-gate); UC-DISC-02 default-home/demote (T-DISC-002 AC1-5); UC-DISC-03 state browse (T-DISC-003 AC1-4); UC-DISC-04 hook (T-DISC-004 AC1-5); UC-DISC-05 mock->live wire (T-DISC-005 AC1-5); UC-DISC-06 Mapbox convergence (T-DISC-006 AC1-4); UC-DISC-07 legibility (T-DISC-007 AC1-8); UC-DISC-08 empty/loading states (T-DISC-008 AC1-6). DTL — UC-DTL-01 lean layout (T-DTL-001 AC1-12); UC-DTL-02 score bars (T-DTL-002 AC1-7); UC-DTL-03 geometry fallback (T-DTL-003 AC1-5); UC-DTL-04 detail actions (T-DTL-004 AC1-6). SAVE — UC-SAVE-01 persistence/reopen (T-SAVE-001 AC1-5); UC-SAVE-02 maps deep-link (T-SAVE-002 AC1-4). The capstone D9 set is the two human-gate journey rows (T-DISC-001 full arc + the supporting human-gates T-DISC-007, T-DTL-004, T-SAVE-002) on real iOS+Android against live Convex with no mocks, satisfying the project iron rule. Two coverage notes/gaps to flag: (1) UC-DISC-01 ACs cover the integrated arc but rely on the per-feature rows (T-DISC-002/005/006, T-DTL-001/003, T-SAVE-001/002) for component-level evidence — intentional, the journey row is the integration of those. (2) Designer's UC-DTL-04 ACs assert detail-screen affordance/UX states; the underlying persistence (UC-SAVE-01) and handoff mechanics (UC-SAVE-02) are verified by T-SAVE-001/002, so DTL-04 and SAVE-01/02 are complementary, not redundant. No AC is left uncovered. Pure transforms (archetype-map T-DATA-004, state-normalize+length-clamp T-DATA-007, score-format implicit in T-DTL-002) are the only unit-justified items (zero I/O); all primary acceptance is integration/e2e/human-gate against live Convex + real devices + live Open-Meteo.
