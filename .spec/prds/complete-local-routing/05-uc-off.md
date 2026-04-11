---
stability: FEATURE_SPEC
last_validated: 2026-04-10
prd_version: 1.4.0
functional_group: OFF
---

# Use Cases: Offline Management (OFF)

## Use Case Summary

| ID | Title | Description |
|----|-------|-------------|
| UC-OFF-01 | Download Offline Region | User downloads map region for offline use |
| UC-OFF-02 | Track Download Progress | User sees progress indicator during region download |
| UC-OFF-03 | List Downloaded Regions | User views all downloaded offline regions |
| UC-OFF-04 | Delete Offline Region | User removes downloaded region to free storage |
| UC-OFF-05 | Manage Storage Limits | System handles storage limits gracefully |
| UC-OFF-06 | Learn About Offline Features | User accesses education about offline capabilities |
| UC-OFF-07 | Create Route With Connection Required | Mapbox calculates geometry offline; route commits to Convex when connected |
| UC-OFF-08 | Progressive Enrichment | Route displays with deterministic leg labels immediately; server-side enrichment trickles in |

---

## UC-OFF-01: Download Offline Region

**Description:** User selects a geographic area (bounding box) to download for offline routing use.

**Acceptance Criteria:**
- ☐ User can access offline region download screen from settings
- ☐ User can define region bounds using map interface or coordinate input
- ☐ User can name the downloaded region
- ☐ User can initiate download with confirmation dialog
- ☐ System downloads map tiles for specified region
- ☐ System stores region metadata in Convex
- ☐ Download completes successfully with valid region data
- ☐ User can cancel download before completion

---

## UC-OFF-02: Track Download Progress

**Description:** User sees real-time progress indicator showing download completion percentage and estimated time remaining.

**Acceptance Criteria:**
- ☐ User can view progress bar during download
- ☐ Progress bar updates smoothly as download progresses
- ☐ System displays percentage complete (0-100%)
- ☐ System displays estimated time remaining
- ☐ System displays downloaded file size
- ☐ Progress indicator dismisses when download completes
- ☐ User can background download and return to see progress

---

## UC-OFF-03: List Downloaded Regions

**Description:** User views all downloaded offline regions with metadata including name, bounds, size, and download date.

**Acceptance Criteria:**
- ☐ User can access offline regions list from settings
- ☐ System displays all downloaded regions in list format
- ☐ Each region shows name, geographic bounds, and size
- ☐ Each region shows download date
- ☐ List is sorted by most recently used
- ☐ List updates when regions are added or removed
- ☐ Empty state displays helpful message when no regions downloaded

---

## UC-OFF-04: Delete Offline Region

**Description:** User removes a downloaded offline region to free device storage.

**Acceptance Criteria:**
- ☐ User can select region for deletion from list
- ☐ System displays confirmation dialog before deletion
- ☐ Confirmation dialog shows region size to inform decision
- ☐ System removes region data from device storage
- ☐ System removes region metadata from Convex
- ☐ List updates to remove deleted region
- ☐ System updates available storage space
- ☐ User can cancel deletion without losing data

---

## UC-OFF-05: Manage Storage Limits

**Description:** System handles device storage limits gracefully by warning user and preventing downloads when space is insufficient.

**Acceptance Criteria:**
- ☐ System checks available storage before download
- ☐ System warns user if insufficient space for requested region
- ☐ Warning message shows required space vs available space
- ☐ System prevents download when space insufficient
- ☐ System suggests deleting old regions to free space
- ☐ System handles storage errors during download gracefully
- ☐ System cleans up partial downloads on failure

---

## UC-OFF-07: Create Route With Connection Required

**Description:** User plans a motorcycle route. Mapbox SDK can calculate route geometry from downloaded map tiles without internet. However, the route must be committed to Convex (requires connectivity) before it is persisted. If the user is offline when they submit, the app shows a "Connect to save your route" prompt. The geometry is NOT lost — the Mapbox route object stays in component state and auto-commits as soon as connectivity returns.

**Acceptance Criteria:**
- ☐ User can access route planning at any time (online or offline)
- ☐ Mapbox SDK calculates route geometry from downloaded map tiles (no internet required for geometry calculation)
- ☐ System derives leg labels deterministically from waypoint names (e.g., "San Francisco → Daly City") — pure code, no model
- ☐ Route geometry and leg labels display on map immediately
- ☐ If user is online: route commits to Convex immediately on submit
- ☐ If user is offline: system shows "Connect to save your route" banner
- ☐ Geometry held in component state while offline — NOT lost
- ☐ When connectivity returns, app auto-commits the pending route to Convex
- ☐ Auto-commit completes without user re-submitting

**Primary Path (Online):**
1. User opens route planning screen
2. User enters route waypoints (FROM → TO → ...)
3. Mapbox SDK calculates route geometry from downloaded maps (offline-capable)
4. System derives leg labels from waypoint names: ["San Francisco → Daly City", "Daly City → Santa Cruz"]
5. Route displays on map with geometry and leg labels
6. User taps "Save Route"
7. Route commits to Convex immediately
8. Haiku enrichment job queued in background

**Offline Path:**
1. User opens route planning screen
2. User enters route waypoints
3. Mapbox SDK calculates route geometry (offline map tiles used)
4. System derives leg labels from waypoint names
5. Route displays on map
6. User taps "Save Route"
7. System detects no connectivity — shows "Connect to save your route" banner
8. Route geometry and leg labels remain in component state
9. When connectivity returns, route auto-commits to Convex
10. Haiku enrichment job queued after commit

**Error Paths:**
- Offline maps not downloaded → Show "Download offline maps first" prompt
- Connectivity returns but auto-commit fails → Retry with exponential backoff; user can manually retry

**References:**
- Progressive Enrichment Architecture: `09-hybrid-enrichment.md`

---

## UC-OFF-08: Progressive Enrichment

**Description:** After a route is committed to Convex, it displays immediately with geometry and deterministic leg labels (derived from waypoint names, pure code). Server-side weather and Haiku creative enrichment trickle in as background jobs. UI updates reactively as each enrichment component arrives.

**Acceptance Criteria:**
- ☐ Route displays immediately after Convex commit with leg labels and geometry
- ☐ System shows "Enhancing..." indicator while server jobs run
- ☐ Haiku enrichment completes in background without blocking UI
- ☐ Creative route label appears when ready (3.9s avg)
- ☐ Scenic rationale appears when ready
- ☐ Highlight tags appear when ready
- ☐ Weather badges appear when ready (background fetch, <20s)
- ☐ UI updates incrementally (not all-or-nothing)
- ☐ Progressive enhancement toast shows current stage
- ☐ Enrichment status badge updates: partial → complete
- ☐ User can continue using app during enrichment

**Primary Path:**
1. User commits route to Convex (UC-OFF-07 online path)
2. Route displays with geometry + deterministic leg labels
3. Haiku enrichment job queued by Convex scheduler
4. Weather enrichment job queued by Convex scheduler
5. Jobs run in background:
   - Haiku generates: creative label, rationale, highlights
   - Weather API fetches wind, rain, temperature data
6. Each component merged into route document as it arrives
7. UI updates reactively:
   - Creative label appears first (replaces "Route #123")
   - Rationale appears below label
   - Highlight tags appear in chips
   - Weather badges fade in as data arrives
8. Enrichment status badge changes from "partial" to "complete"
9. Progressive enhancement toast dismisses automatically

**Progressive Enhancement Stages:**
```
0.0s:  Route geometry + deterministic leg labels (committed to Convex)
1.0s:  Creative label appears (Haiku)
2.5s:  Rationale appears (Haiku)
3.9s:  Highlight tags appear (Haiku)
<20s:  Weather badges appear (Open-Meteo background fetch)
✓ Complete
```

**Error Paths:**
- Haiku enrichment fails → Keep partial enrichment (leg labels + geometry), log error
- Weather fetch fails → Route usable without weather; retry in background
- User goes offline during enrichment → Pause server jobs, resume when connected

**References:**
- Progressive Enrichment Architecture: `09-hybrid-enrichment.md`
- Enrichment API: `08-technical-requirements.md`

---

## UC-OFF-06: Learn About Offline Features

**Description:** User can access educational content explaining offline routing capabilities and how to use them.

**Acceptance Criteria:**
- ☐ User can access offline help from settings or download screen
- ☐ Help content explains what offline routing is
- ☐ Help content explains how to download regions
- ☐ Help content explains when offline routing is active
- ☐ Help content includes FAQ for common questions
- ☐ Help content is accessible and easy to understand
- ☐ User can dismiss help content and return to previous screen
