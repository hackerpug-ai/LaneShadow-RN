---
stability: FEATURE_SPEC
last_validated: 2026-04-10
prd_version: 1.3.0
functional_group: DISC
---

# Use Cases: Route Discovery (DISC)

| UC ID | Title | Description |
|-------|-------|-------------|
| UC-DISC-01 | Browse Routes on Map | User views curated routes as pins on map, centered on current location |
| UC-DISC-02 | Filter by Archetype | User filters routes by ride type (twisties, mountain, coastal, adventure, scenic_byway, desert) |
| UC-DISC-03 | Filter by State/Region | User filters routes by state or geographic region |
| UC-DISC-04 | Sort by Score or Proximity | User sorts route results by composite quality score or distance from location |
| UC-DISC-05 | View Route Details | User taps route pin to view details card with name, archetype, score, highlights, and key attributes |
| UC-DISC-06 | Show Route on Map | User taps "Show on map" from route details to display route geometry on main map view |
| UC-DISC-07 | Intent-Based Search | User types or speaks natural language intent; normalized-intent cache or Claude Haiku (server-side) extracts query params; deterministic SQL returns pre-selected matching routes. No on-device LLM. |

---

## UC-DISC-01: Browse Routes on Map

**Description:** Rider opens the route discovery screen and sees curated routes displayed as pins on a map centered on their current location. Routes are loaded from local op-sqlite database, enabling offline access after initial sync.

**Acceptance Criteria:**
- ☐ User can view route discovery screen with map interface
- ☐ Map displays curated routes as copper-accented pins (matching LaneShadow theme)
- ☐ Map is centered on user's current location or last known location
- ☐ Routes within 50-mile radius are displayed by default
- ☐ Pin density adjusts based on zoom level (clustering at low zoom, individual pins at high zoom)
- ☐ Loading indicator displays while routes are fetched from local database
- ☐ Empty state displays when no routes are available in the region
- ☐ Map interaction (pan, zoom) maintains route pin visibility
- ☐ System works offline after initial route sync

---

## UC-DISC-02: Filter by Archetype

**Description:** Rider filters route discovery results by ride archetype to match their mood or bike type. Archetype filter is persisted across sessions for quick access to preferred ride types.

**Acceptance Criteria:**
- ☐ User can access archetype filter from discovery screen
- ☐ Filter displays 6 archetypes: twisties, mountain, coastal, adventure, scenic_byway, desert
- ☐ User can select single archetype or multiple archetypes
- ☐ Map pins update to show only matching routes
- ☐ Filter selection persists across app sessions
- ☐ Filter selection resets when user changes location (new search context)
- ☐ "Clear filters" option resets to show all routes
- ☐ Filter chip shows count of matching routes
- ☐ No results state displays when filter has no matches in current region

---

## UC-DISC-03: Filter by State/Region

**Description:** Rider filters route discovery results by state or geographic region. Useful when planning trips to specific areas or browsing routes in a different state.

**Acceptance Criteria:**
- ☐ User can access state/region filter from discovery screen
- ☐ Filter displays list of states with available routes
- ☐ User can select single state or multiple states
- ☐ Map pins update to show only matching routes in selected state(s)
- ☐ Map auto-centers on selected state region
- ☐ Filter selection persists across app sessions
- ☐ "Clear filters" option resets to location-based search
- ☐ State list shows route count per state
- ☐ System works offline for states with previously synced routes

---

## UC-DISC-04: Sort by Score or Proximity

**Description:** Rider controls the order of route results, prioritizing either highest-quality routes (composite score) or nearest routes (distance from current location).

**Acceptance Criteria:**
- ☐ User can toggle sort order between "Best" (composite score) and "Nearest" (distance)
- ☐ Default sort is "Best" (highest composite score first)
- ☐ Sort selection persists across app sessions
- ☐ Map pins display rank badge for top 10 routes when sorted by "Best"
- ☐ Distance label displays on route pins when sorted by "Nearest"
- ☐ Sort order applies to both map view and list view (if implemented)
- ☐ Sort recalculates when user location changes significantly (>10 miles)
- ☐ System works offline using cached distances from route centroids

---

## UC-DISC-05: View Route Details

**Description:** Rider taps a route pin to view detailed information about the curated route, helping them decide if it matches their preferences for the day's ride.

**Acceptance Criteria:**
- ☐ User can tap route pin to open route details bottom sheet
- ☐ Details sheet displays route name and archetype badge
- ☐ Details sheet displays composite score (0-10 scale)
- ☐ Details sheet displays 3 key highlights (short phrases)
- ☐ Details sheet displays route attributes: curviness, scenery quality, traffic level, challenge level
- ☐ Details sheet displays route length (if available)
- ☐ Details sheet displays distance from current location
- ☐ "Show on map" button displays route geometry
- ☐ "Save route" button adds route to user's saved routes
- ☐ "Hide route" button removes route from future discovery
- ☐ Details sheet supports swipe-to-dismiss
- ☐ System works offline using cached route data

---

## UC-DISC-06: Show Route on Map

**Description:** Rider taps "Show on map" from route details to display the full route geometry on the main map view, enabling them to visualize the route before committing to ride it.

**Acceptance Criteria:**
- ☐ User can tap "Show on map" button from route details sheet
- ☐ Main map view opens with route geometry displayed as copper-accented polyline
- ☐ Map zooms to fit route bounds with padding
- ☐ Route polyline thickness matches existing lane navigation style
- ☐ Route start and end points are marked with distinct pins
- ☐ User can pan and zoom map while route is displayed
- ☐ "Start navigation" button displays (if navigation is available)
- ☐ "Back to discovery" button returns to discovery screen
- ☐ Route geometry is loaded from local op-sqlite database
- ☐ System works offline after route sync

---

## UC-DISC-07: Intent-Based Search

**Description:** Rider types or speaks a natural language intent ("twisty mountain roads near me", "something remote and challenging"). The Intent Query Service extracts structured query parameters via slot-filling; deterministic `params_to_sql()` converts these params into a SQL query that runs against local `discovery.db`, returning pre-selected routes ordered by pre-computed composite scores. **No LLM ever sees or ranks route candidates** — selection is entirely the database's job. **No on-device LLM is used anywhere in this flow** — LLM inference is server-side Haiku only.

### Single shipping path (Haiku online + normalized-intent cache)

```
User intent string
   ↓
Normalize: lower(trim(collapse_ws(strip_stopwords(intent))))
   ↓
intent_param_cache lookup (op-sqlite, PK = normalized intent)
   ├── HIT → validated params JSON → params_to_sql() → op-sqlite → top 10
   └── MISS
         ├── Online  → POST /api/intent/extract-params (Haiku, Instructor,
         │              temp=0, retry-on-validation-failure)
         │              → cache write → params_to_sql() → op-sqlite → top 10
         └── Offline → OFFLINE_UNSUPPORTED empty state
                       ("Connect to search, or try one of your recent searches")
                       Surfaces the top cached intents as shortcut chips.
```

Cache coverage is expected to be very high in practice. Real route-search intents cluster heavily on a small set of phrasings ("twisty roads", "coastal ride", "mountain route in Colorado"), and normalization collapses many surface variants onto the same key. After the first few dozen users, the cache carries most traffic with zero network.

**Catalog browse is separately offline-capable:** the map view with filters (archetype, state, bounds, sort) is pure SQL over the synced lean tier and works fully offline without touching any LLM or cache. UC-DISC-01 through UC-DISC-06 are unaffected by network state. Only free-text intent search has an online component.

### Validation

| Path | Model | Result | Source |
|------|-------|--------|--------|
| Cache hit | none | <50ms, zero network | N/A |
| Cache miss + online | Haiku (server-side) | ~1.0s extraction, 100% valid JSON via Instructor | `INTENT_TO_QUERY_RESULTS_2026-04-10.md` (Haiku baseline) |
| Cache miss + offline | none | returns OFFLINE_UNSUPPORTED immediately | N/A |

There is no on-device LLM in this flow. The prior research on Qwen3.5 is retained as historical context for why on-device LLM is out of scope (`ENVIRONMENT_BIAS_FINDING_2026-04-10.md`).

### Query params extracted (10 keys, all nullable)

- `archetype` — twisties | mountain | coastal | adventure | scenic_byway | desert
- `state` — 2-letter code (overrides bounding box)
- `min_length_mi`, `max_length_mi` — for "long"/"epic" or "short"/"quick" intents
- `max_technical` — 0.5 for "gentle"/"beginner"
- `min_traffic_score` — 0.7 for "low traffic"
- `min_remoteness` — 0.7 for "remote"/"away from crowds"
- `max_distance_mi` — radius override
- `season` — year_round | apr_nov | may_sep
- `sort_by` — curvature | scenic | technical | traffic | remoteness | length

### Acceptance Criteria

- ☐ User can access intent search input from discovery screen (bottom sheet, KeyboardAvoidingInput)
- ☐ Input accepts free text (e.g., "show me something twisty in Utah")
- ☐ Normalized-intent cache lookup happens before any network call; cache hit returns in <50ms end-to-end
- ☐ Cache-hit results render without any loading spinner
- ☐ Cache-miss + online: `/api/intent/extract-params` called, Haiku returns params in <2s, result cached, results render with a loading indicator during the Haiku call
- ☐ Cache-miss + offline: empty state displayed with "Connect to search" message and recent-intents shortcut chips (populated from `intent_param_cache` ordered by `hit_count DESC`)
- ☐ Enum validation runs after extraction; hallucinated archetype/season/sort_by values are dropped, not forwarded to SQL
- ☐ Deterministic `params_to_sql()` constructs parameterized query from extracted params
- ☐ No LLM ever receives route candidates or is asked to rank
- ☐ No on-device LLM is loaded, downloaded, or invoked at any point in this flow
- ☐ Map updates to show top 10 SQL results, ordered by `sort_by` or composite score
- ☐ Search results display the extracted intent summary ("Showing: mountain routes, sorted by curvature")
- ☐ If local query returns zero results AND device is online: re-prompt Haiku to broaden the query, re-run `params_to_sql()` locally
- ☐ "Clear search" resets to proximity-based browse (UC-DISC-01)
- ☐ Cached intents work fully offline after initial sync; non-cached offline intents surface the OFFLINE_UNSUPPORTED empty state with no attempted inference
- ☐ Schema-version bump invalidates the intent cache (rows with stale `schema_version` are ignored and repopulated lazily on next online hit)
- ☐ UC-DISC-01 through UC-DISC-06 (catalog browse, map view, filters, sort, details) work fully offline via pure SQL — never gated on intent search or connectivity
