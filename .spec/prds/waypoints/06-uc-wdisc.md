---
stability: FEATURE_SPEC
last_validated: 2026-04-14
prd_version: 1.0.0
functional_group: WDISC
---

# Use Cases: Waypoint Discovery (WDISC)

Phase 0.5 scope: **Moments Near Me** (Option A — minimum viable UX). Surprise Me, Moments Feed card stack, and along-route bloom are all deferred.

Rider lexicon for UX copy: [`../../research/waypoint-demand/05-rider-lexicon.md`](../../research/waypoint-demand/05-rider-lexicon.md).

| UC ID | Title | Description |
|---|---|---|
| UC-WDISC-01 | Browse Waypoints on Map | Rider opens Moments Near Me and sees waypoints as pins on a map |
| UC-WDISC-02 | Filter by Category | Rider filters waypoints by Pause / Wander / Taste |
| UC-WDISC-03 | Filter by Effort | Rider filters by effort level (pullover / park / side-trip) |
| UC-WDISC-04 | Sort by Score or Proximity | Rider toggles sort order between "Best" and "Nearest" |
| UC-WDISC-05 | View Waypoint Details | Rider taps a waypoint pin to see details |
| UC-WDISC-06 | Rural Radius Auto-Expansion | When fewer than 5 waypoints in 20 miles, automatically expand search radius |
| UC-WDISC-07 | Report "Not a Delight" | Rider downvotes a waypoint that shouldn't have been surfaced |
| UC-WDISC-08 | Show Waypoints on Current Route | Route detail view passively surfaces waypoints along the polyline |

---

## UC-WDISC-01: Browse Waypoints on Map (Moments Near Me)

**Description**: Rider taps "Moments Near Me" from the main navigation and sees curated waypoints within their current area displayed as pins on a map, with a list view toggle.

**Acceptance Criteria**:
- ☐ User can access "Moments Near Me" from the main app navigation (tab or menu item)
- ☐ Map displays waypoints as copper-accented pins matching LaneShadow theme
- ☐ Map is centered on user's current GPS location (or last known location)
- ☐ Waypoints within 20-mile radius are displayed by default
- ☐ Pin color or icon varies by category (Pause / Wander / Taste)
- ☐ Pin density clusters at low zoom; individual pins at high zoom
- ☐ Loading indicator displays while waypoints are fetched from op-sqlite
- ☐ Toggle between map view and list view
- ☐ Empty state displays when zero waypoints in the region (before rural auto-expansion kicks in)
- ☐ System works fully offline after initial waypoints.db sync

## UC-WDISC-02: Filter by Category

**Description**: Rider filters Moments Near Me results by one or more categories.

**Acceptance Criteria**:
- ☐ Filter chips for Pause, Wander, Taste are visible above the map/list
- ☐ User can select one, multiple, or none (none = show all)
- ☐ Selection persists across app sessions (local preference)
- ☐ Chip count badge shows number of matching waypoints
- ☐ Selecting a chip updates map + list in <200ms (pure SQL query on op-sqlite)
- ☐ "Clear filters" control restores all-categories view
- ☐ **Gather category is NOT included in Phase 0.5** — category is deferred

## UC-WDISC-03: Filter by Effort

**Description**: Rider filters by the level of effort required at the waypoint.

**Acceptance Criteria**:
- ☐ Filter chips for `pullover`, `park`, `side-trip` are visible (secondary chip row below category chips)
- ☐ Chip labels use rider-friendly terms: "Pull Over" / "Park & Walk" / "Side Trip"
- ☐ User can select one or multiple
- ☐ Selection persists across sessions
- ☐ Chip-count badge updates with filter changes

## UC-WDISC-04: Sort by Score or Proximity

**Description**: Rider toggles between "Best" (highest composite score) and "Nearest" (closest distance) sort orders.

**Acceptance Criteria**:
- ☐ Sort toggle is visible on the Moments Near Me screen
- ☐ Default sort is "Best" (highest composite score first)
- ☐ Sort selection persists across sessions
- ☐ When "Best" is selected, the list shows rank badges for the top 10 waypoints
- ☐ When "Nearest" is selected, the list shows distance in miles
- ☐ Sort recalculates when user location changes by more than 5 miles

## UC-WDISC-05: View Waypoint Details

**Description**: Rider taps a waypoint pin or list item to see a detailed bottom sheet.

**Acceptance Criteria**:
- ☐ Tapping a waypoint pin or list row opens a details bottom sheet (iOS/Android sheet pattern)
- ☐ Sheet displays: waypoint name, category badge, composite score (0–10 scale), rider-voice one-liner (from O3), photo if available, effort level, distance from user, category-specific tags
- ☐ "Show on map" button centers the map on the waypoint
- ☐ "Save waypoint" button adds to user's saved list (requires auth; anonymous users see sign-in prompt)
- ☐ "Not a delight" button triggers UC-WDISC-07 downvote flow
- ☐ "Get directions" button opens the device's default maps app with the waypoint's coordinates
- ☐ Sheet supports swipe-to-dismiss
- ☐ Sheet content loads from op-sqlite full-record cache if available, else fetches from Convex and caches
- ☐ Works offline for previously-viewed waypoints

## UC-WDISC-06: Rural Radius Auto-Expansion

**Description**: When the initial 20-mile radius returns fewer than 5 waypoints, the system automatically expands to 50, then 100, then 150 miles until it finds at least 5 candidates — so rural riders never see an empty map.

**Acceptance Criteria**:
- ☐ System first queries for waypoints within 20 miles of user location
- ☐ If fewer than 5 results, expand to 50 miles and re-query
- ☐ If still fewer than 5, expand to 100 miles
- ☐ If still fewer than 5, expand to 150 miles (hard cap)
- ☐ Map view visually shows the current search radius as a translucent circle overlay
- ☐ A banner above the list reads "Showing results within {N} miles" when radius >20 miles
- ☐ If the hard cap (150 miles) still yields fewer than 5 waypoints, empty state message reads: "No moments found within 150 miles. Want to help us find some? Tap here to suggest one." (tap target deferred to Phase 1 submission feature)
- ☐ "Rare find" badge is applied to waypoints whose `local_uniqueness` score from R3 exceeds 0.7

## UC-WDISC-07: Report "Not a Delight"

**Description**: Rider can downvote a waypoint that doesn't feel like a moment of delight. Triggers the L7 flywheel loop.

**Acceptance Criteria**:
- ☐ Downvote button is visible in the waypoint detail sheet (UC-WDISC-05)
- ☐ Button label reads "Not a delight" (rider-friendly, no accusations)
- ☐ Tapping the button opens a simple reason picker: "Chain business" / "Not open" / "Not interesting" / "Unsafe to stop" / "Other (describe)"
- ☐ Submission requires authentication (anonymous users see sign-in prompt)
- ☐ Submission triggers a Convex mutation that records the downvote and applies the deterministic score penalty (−0.2 per downvote, floor at 0)
- ☐ After submission, the waypoint is removed from the rider's view for 30 days (don't re-surface something they already rejected)
- ☐ Confirmation toast: "Thanks. We'll surface it less."
- ☐ Rate-limited: max 10 downvotes per user per day (prevent abuse)

## UC-WDISC-08: Show Waypoints on Current Route (passive surfacing)

**Description**: When the rider is viewing a curated route's detail sheet (from the existing curation/UC-DISC-05 flow), high-scoring waypoints within 5 miles of the route polyline are passively surfaced.

**Acceptance Criteria**:
- ☐ The existing route detail sheet (`../curation/04-uc-discovery.md` UC-DISC-05) gains a new section: "Moments along this ride"
- ☐ Section shows up to 5 waypoints within 5 miles of the route polyline, sorted by composite score descending
- ☐ Each waypoint is rendered as a compact card: category icon, name, one-liner, distance-from-route
- ☐ Tapping a card opens the waypoint detail sheet (UC-WDISC-05)
- ☐ If fewer than 5 waypoints match, shows whatever's available
- ☐ If zero waypoints match, section is hidden (no empty state in this context — the route itself is the content)
- ☐ Query is a spatial join against op-sqlite `waypoints.db`, executed when the route detail sheet opens
- ☐ Works fully offline
