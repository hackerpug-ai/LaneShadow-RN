---
stability: FEATURE_SPEC
last_validated: 2026-04-09
prd_version: 1.1.0
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
| UC-OFF-07 | Create Route While Offline | User plans route with no connection using local leg generation |
| UC-OFF-08 | Progressive Enrichment | Route enhances incrementally as connectivity returns |

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

## UC-OFF-07: Create Route While Offline

**Description:** User plans and creates a motorcycle route with no internet connection. Local Qwen3.5 model generates leg labels immediately, Mapbox SDK calculates route geometry offline, and draft route persists to AsyncStorage.

**Acceptance Criteria:**
- ☐ User can access route planning with no internet connection
- ☐ System detects offline status and shows "Offline Mode" banner
- ☐ Qwen3.5 generates leg labels locally within 0.5s
- ☐ Mapbox SDK calculates route geometry using downloaded maps
- ☐ Draft route persists to AsyncStorage with status `local_only`
- ☐ Route displays immediately with leg labels and geometry
- ☐ System shows "Sync pending" indicator for draft route
- ☐ Route remains editable while offline
- ☐ Multiple draft routes can be created and stored locally

**Primary Path:**
1. User opens route planning screen
2. System detects no network connection
3. User enters route waypoints (FROM → TO → ...)
4. Qwen3.5 generates leg labels locally: ["SF → Daly City", "Daly City → Santa Cruz"]
5. Mapbox SDK calculates route geometry from downloaded offline maps
6. System creates draft route in AsyncStorage with `syncStatus: 'local_only'`
7. Route displays on map with geometry and leg labels
8. System shows "Offline - will sync when connected" indicator

**Error Paths:**
- Qwen3.5 model unavailable → Use generic labels derived from waypoint names ("Start → End")
- Offline maps not downloaded → Show "Download offline maps first" prompt
- AsyncStorage write fails → Show error, retry option

**References:**
- Hybrid Enrichment Architecture: `09-hybrid-enrichment.md`
- Local Model Integration: Phase 0 in README.md

---

## UC-OFF-08: Progressive Enrichment

**Description:** Route created offline displays immediately with basic leg labels, then incrementally enhances with creative label, rationale, and highlights when connectivity returns. UI updates reactively as each enrichment component arrives.

**Acceptance Criteria:**
- ☐ Route displays immediately with leg labels (0.35s)
- ☐ System shows "Enhancing..." indicator after connection
- ☐ Haiku enrichment completes in background without blocking UI
- ☐ Creative route label appears when ready (3.9s avg)
- ☐ Scenic rationale appears when ready
- ☐ Highlight tags appear when ready
- ☐ UI updates incrementally (not all-or-nothing)
- ☐ Progressive enhancement toast shows current stage
- ☐ Enrichment status badge updates: partial → complete
- ☐ User can continue using app during enrichment

**Primary Path:**
1. User creates route offline (UC-OFF-07)
2. Route displays with leg labels only
3. Device connects to WiFi/cellular
4. System detects connectivity restored
5. Draft route enqueued for sync with status `pending_sync`
6. Convex receives route plan and leg labels
7. Haiku enrichment job queued
8. Haiku generates: label, rationale, highlights
9. Each component merged into route document as it arrives
10. UI updates reactively:
    - Label appears first (replaces generic "Route #123")
    - Rationale appears below label
    - Highlight tags appear in chips
11. Enrichment status badge changes from "partial" to "complete"
12. Progressive enhancement toast dismisses automatically

**Progressive Enhancement Stages:**
```
0.0s: Route geometry + leg labels (Qwen3.5 local)
1.0s: Creative label appears (Haiku)
2.5s: Rationale appears (Haiku)
3.9s: Highlight tags appear (Haiku)
✓ Complete
```

**Error Paths:**
- Haiku enrichment fails → Keep partial enrichment, log error
- Sync queue timeout → Retry with exponential backoff
- User goes offline during enrichment → Pause, resume when connected

**References:**
- Hybrid Enrichment Architecture: `09-hybrid-enrichment.md`
- Sync Queue Processing: `08-technical-requirements.md`

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
