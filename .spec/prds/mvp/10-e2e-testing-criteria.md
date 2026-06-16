---
stability: TEST_SPEC
last_validated: 2026-06-15
prd_version: 3.0.0
---

# E2E / Human Testing Criteria — Discovery-MVP

Version 3.0.0 · 2026-06-15 · 21 criteria across 17 use cases.

> **✅ v3.0.0 (2026-06-15): the separate discovery view is removed.** The DISC criteria below test discovery **on the route plan view** (`index.tsx`): suggestion cards over the input (UC-DISC-09), chat-driven NL curated discovery via the card→map loop (UC-DISC-10), and the no-separate-screen structural contract (UC-DISC-11). The dedicated-screen criteria **T-DISC-002 / 002b / 003 / 005 / 006 / 007 / 008** are **retired** with the screen; **T-DISC-001** (capstone) and **T-DISC-004** (hook) are updated to the plan view. NL/intent for UC-DISC-10 is **fixtured at the determinism seam** — assert which curated routes are surfaced/plotted, not prose.

Per the project iron rule: integration/E2E against **real services** is the primary acceptance bar. The capstone is the on-device journey (UC-DISC-01) verified on real iOS + real Android against live Convex.

| Type | Count |
|---|---|
| integration-test | 10 |
| build-gate | 2 |
| human-gate | 3 |
| e2e-automated | 6 |
| **Total** | **21** |

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

## DISC: Discovery (on the route plan view)

### UC-DISC-01: Rider completes the full discover-to-ride journey on a real device

| # | Criterion | AC Ref | Type | Setup | Pass/Fail |
|---|---|---|---|---|---|
| T-DISC-001 | On a real iOS device and a real Android device against live Convex, the founder completes the full arc: app opens to the route plan view (map + chat home, NOT a separate Discovery screen), sees curated-route suggestion cards over the input when no route is on the map, taps a card to plot a route OR chats a natural-language request and the latest curated route plots on the map, taps a route to a detail view (headline + score bars + geometry-or-centroid + basic conditions), saves it and finds it in Saved on reopen, and hands off to Google/Apple Maps to navigate. | UC-DISC-01 AC1, AC2, AC3, AC4, AC5, AC6, AC7, AC8 | human-gate | D9 capstone: build and run the app on a real iOS device and a real Android device pointed at the live Convex dev deployment; the founder performs the end-to-end discover-to-ride journey on the plan view in a region he actually rides; record video/screenshot evidence per platform. | PASS when the entire arc completes on BOTH platforms against live services with recorded evidence and no mocks; FAIL if any step (plan-view landing, suggestion cards, card-tap plot, chat plot, detail, save+reopen, maps handoff) breaks on either platform. |

### UC-DISC-04: useCuratedDiscovery hook returns live rows in the shape the suggestion cards + chat discovery consume

| # | Criterion | AC Ref | Type | Setup | Pass/Fail |
|---|---|---|---|---|---|
| T-DISC-004 | useCuratedDiscovery against live Convex returns rows in the {id,name,lat,lng,archetype(UI enum),score,distanceMi} shape the suggestion cards iterate over, surfaces a loading state when routes is undefined and a distinct empty state when routes===[], derives query center from useCurrentLocation when no center is passed, orders nearest-first when location is available and best-first otherwise, and carries compositeScore through on the raw 0-1 scale without rescaling. | UC-DISC-04 AC1, AC2, AC3, AC4, AC5 | integration-test | Render a harness mounting useCuratedDiscovery against live Convex dev (api.curatedRoutes.listCuratedRoutes); assert returned row shape, loading/empty conventions, location-derived center, nearest/best ordering, and 0-1 score values. | PASS when the hook returns the exact consumed shape with correct loading/empty signals, location-derived center, correct nearest/best ordering, and unrescaled 0-1 scores; FAIL on shape mismatch, conflated loading/empty, missing center derivation, or any 0-100 rescale. |

### UC-DISC-09: Rider discovers whole curated routes from the suggestion cards over the plan input

| # | Criterion | AC Ref | Type | Setup | Pass/Fail |
|---|---|---|---|---|---|
| T-DISC-009 | On a real iOS/Android device against live Convex, with no route on the map the chat input shows curated-route suggestion cards (real road name + mileage from the live catalog, NOT IDLE_SUGGESTIONS prompts); tapping a card plots that curated route on the map; the cards hide once a route is shown and return when the route is cleared; the cards are sourced from useCuratedDiscovery (nearest-first when location available, best otherwise). | UC-DISC-09 AC1, AC2, AC3, AC4, AC5 | e2e-automated | On a real iOS/Android device against live Convex, cold-open to the plan view with no route; via testIDs (`chat-input-suggestion-chips` slot, `discovery-suggestion-pill-{routeId}`) assert cards show live name+mileage, tap one to plot, then clear the route and assert cards return; assert content differs from IDLE_SUGGESTIONS. | PASS when live curated cards show only when no route is on the map, a tap plots the correct route, and cards hide/return on route show/clear; FAIL on hardcoded prompts appearing as suggestions, a tap not plotting, or cards persisting while a route is displayed. |

### UC-DISC-10: Rider discovers curated routes by chatting; results ride the existing card→map loop

| # | Criterion | AC Ref | Type | Setup | Pass/Fail |
|---|---|---|---|---|---|
| T-DISC-010 | On a real iOS/Android device against live Convex with the NL/intent signal fixtured at the determinism seam, a natural-language request (incl. region/state + archetype intent like "scenic roads in North Carolina") returns curated route(s) as chat route-cards, the latest plots on the map, pressing an earlier curated-route card re-renders it on the map and returns to map view, and composite scores carry through on the raw 0-1 scale rendered as bars/percent (never 0-100) — with NO filter-bar or state picker involved. | UC-DISC-10 AC1, AC2, AC3, AC4, AC5 | e2e-automated | On a real iOS/Android device against live Convex, fixture the agent's intent→listCuratedRoutes signal (determinism seam) so the surfaced route set is deterministic; send an NL request via the chat input; assert the returned routing_card set, the plotted latest route, the tap-earlier-card→re-render→map-view loop, and the score format. | PASS when the fixtured NL request yields the expected curated routes as cards, the latest plots, the earlier-card loop works, and scores render 0-1 as bars/percent; FAIL on no cards returned, wrong route set vs fixture, a broken earlier-card loop, or a 0-100 score. |

### UC-DISC-11: Discovery lives on the route plan view — no separate Discovery screen

| # | Criterion | AC Ref | Type | Setup | Pass/Fail |
|---|---|---|---|---|---|
| T-DISC-011 | On a real device cold launch, the app lands on the route plan view (map + chat home) with NO separate Discovery screen and NO drawer-hidden chat; no dedicated Discovery route, archetype filter-bar, sort-toggle, or by-state browse picker exists anywhere in the app; the full chat view opens from a button to the right of the chat input (distinct from send); and dismissing/clearing a displayed route returns the suggestion cards over the input. | UC-DISC-11 AC1, AC2, AC3, AC4, AC5 | e2e-automated | Cold-launch on a real iOS and real Android device against live Convex; assert the landing route is index.tsx (plan view); grep the route tree + drawer for any discover route/filter-bar/sort-toggle/state-picker (must be absent); via testID assert the footer full-chat button is distinct from send; clear a route and assert cards return. | PASS when the app lands on the plan view, no discovery screen/filter/sort/state-picker exists, the full-chat button is distinct from send, and clearing a route returns the cards; FAIL if any dedicated discovery surface is reachable, the full-chat button collides with send, or cards do not return on clear. |

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

Every final UC has >=1 e2e_criteria row and every authored AC is referenced. Coverage by group: DATA — UC-DATA-01 (T-DATA-001 AC1-2, T-DATA-002 AC3-4); UC-DATA-02 (T-DATA-003 AC1-3, T-DATA-004 AC4); UC-DATA-03 (T-DATA-005 AC1-4); UC-DATA-04 (T-DATA-006 AC1-3, T-DATA-007 AC4); UC-DATA-05 (T-DATA-008 AC1-6); UC-DATA-06 (T-DATA-009 AC1,2,3,5 + T-DATA-010 AC4). DISC — UC-DISC-01 journey (T-DISC-001 AC1-8, the D9 capstone human-gate); UC-DISC-04 hook (T-DISC-004 AC1-5); UC-DISC-09 suggestion cards over the plan input (T-DISC-009 AC1-5); UC-DISC-10 chat-driven curated discovery (T-DISC-010 AC1-5, NL fixtured at the determinism seam); UC-DISC-11 no-separate-screen structural contract (T-DISC-011 AC1-5). (Retired with the dedicated screen: UC-DISC-02/03/05/06/07/08 and their T-DISC-002/002b/003/005/006/007/008 rows.) DTL — UC-DTL-01 lean layout (T-DTL-001 AC1-12); UC-DTL-02 score bars (T-DTL-002 AC1-7); UC-DTL-03 geometry fallback (T-DTL-003 AC1-5); UC-DTL-04 detail actions (T-DTL-004 AC1-6). SAVE — UC-SAVE-01 persistence/reopen (T-SAVE-001 AC1-5); UC-SAVE-02 maps deep-link (T-SAVE-002 AC1-4). The capstone D9 set is the human-gate journey row (T-DISC-001 full arc) plus the supporting human-gates (T-DTL-004, T-SAVE-002) on real iOS+Android against live Convex with no mocks, satisfying the project iron rule. Two coverage notes to flag: (1) UC-DISC-01 ACs cover the integrated arc but rely on the per-feature rows (T-DISC-009/010/011, T-DTL-001/003, T-SAVE-001/002) for component-level evidence — intentional, the journey row is the integration of those. (2) Designer's UC-DTL-04 ACs assert detail-screen affordance/UX states; the underlying persistence (UC-SAVE-01) and handoff mechanics (UC-SAVE-02) are verified by T-SAVE-001/002, so DTL-04 and SAVE-01/02 are complementary, not redundant. No AC is left uncovered. UC-DISC-10's NL/intent is fixtured at the determinism seam (assert which curated routes are surfaced/plotted, not prose). Pure transforms (archetype-map T-DATA-004, state-normalize+length-clamp T-DATA-007, score-format implicit in T-DTL-002) are the only unit-justified items (zero I/O); all primary acceptance is integration/e2e/human-gate against live Convex + real devices + live Open-Meteo.
