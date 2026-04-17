# Sprint 7: Offline Maps and Cache Recovery

**Sequence:** 7
**Status:** Planned

## Overview

Wire Sprint-2 offline and map-region compositions into the Mapbox offline SDK, local cache layer, and Convex sync pipeline so riders can download regions, manage storage, and recover route/session state without connectivity. This sprint is integration-first: UI atoms/molecules are already built in Sprint 2; the work here is lifecycle wiring, platform-native download plumbing, and cache/sync correctness.

## Human Testing Gate

**Gate:** A rider can trigger an offline region download, observe progress via wired Sprint-2 UI (and pending-delta OS notification surface), relaunch offline, load cached map tiles and route data from disk, and reconcile pending sync artifacts on reconnect — all verified at the download/cache/sync layer, not by re-rendering UI.

## Human Test Deliverable

Both apps demonstrate end-to-end offline download lifecycle, on-disk cache integrity, and deterministic sync reconciliation using Sprint-2 UI as the pre-built surface.

## Human Test Steps

1. Initiate a region download and verify the Mapbox offline pack is created, bytes are streamed to disk, and progress events reach the wired `DownloadProgressIndicator` / `DownloadProgressBanner`.
2. Background the app mid-download and verify the download continues via Android foreground service / iOS background task, surfaced through `BackgroundDownloadNotification` (pending Sprint 2 delta).
3. Pause, resume, and cancel downloads and verify pack state, partial-byte cleanup, and recovery of the correct `RegionListItem` state after relaunch.
4. Airplane-mode the device and verify cached tiles render from the offline pack and cached route/ride documents load from the local store without network calls.
5. Rename and delete regions and verify the filesystem pack, metadata index, and Convex-mirrored record all reconcile.
6. Reconnect and verify pending-sync artifacts flush cleanly, conflict resolution runs, and cache TTL policy evicts stale regions per spec.

## Source Coverage

- `11-uc-offline.md`
- `17-state-convex-architecture.md`
- `08a-atomic-component-catalog.md` (Sprint-2 UI consumed here)

## Dependencies

- Sprint 2 UI compositions (required, consumed wholesale):
  - UI-XXX `DownloadProgressIndicator`
  - UI-XXX `DownloadProgressBanner`
  - UI-XXX `RegionListItem`
  - UI-XXX `RegionNameBottomSheet`
  - UI-XXX `RenameRegionBottomSheet`
  - UI-XXX `DeleteConfirmationDialog`
  - UI-XXX `RegionBoundsPreview` (pending Sprint 2 delta)
  - UI-XXX `BoundingBoxOverlay` (pending Sprint 2 delta)
  - UI-XXX `BackgroundDownloadNotification` (pending Sprint 2 delta — OS notification surface)
- Sprint 3: Auth and Discovery Shell
- Sprint 4: Chat Planning and Comparison
- Sprint 6: Ride Recording and Saved Rides

## Blocks

- Sprint 10: Native Parity and React Native Retirement

## Tasks

| ID | Title | Agent | Estimate |
|----|-------|-------|----------|
| OFFL-001 | Define offline region metadata schema, cache TTL, and local recovery policy | worker | 0.5 day |
| OFFL-002 | Wire Android Mapbox offline SDK (pack create/download/pause/resume/cancel) into region lifecycle | kotlin-implementer | 1 day |
| OFFL-003 | Wire iOS Mapbox offline SDK (pack create/download/pause/resume/cancel) into region lifecycle | swift-implementer | 1 day |
| OFFL-004 | Wire Sprint-2 offline UI into the download lifecycle per UC-OFFL-02/05/09 | frontend-designer | 0.5 day |
| OFFL-005 | Wire cached route access, offline ride recovery, and sync conflict handling | convex-implementer | 0.5 day |
| OFFL-006 | Wire offline failure states, restore paths, and human-test instrumentation | worker | 0.5 day |

---

### OFFL-001 — Define offline region metadata schema, cache TTL, and local recovery policy

Define the on-device schema (region id, bounds, pack path, byte size, createdAt, lastAccessedAt, status), cache TTL rules, and restart-recovery policy consumed by OFFL-002..006.

#### Components Consumed
- None (schema/policy task).

---

### OFFL-002 — Wire Android Mapbox offline SDK into region lifecycle

Integrate Mapbox Android offline SDK: pack creation from bounds, progress event stream, pause/resume/cancel, foreground-service lifecycle, and on-disk byte accounting. Emit typed events into the shared download-lifecycle store consumed by OFFL-004. No UI is constructed here; consume Sprint-2 compositions via shared state.

#### Components Consumed
- `BoundingBoxOverlay` (pending Sprint 2 delta) — rendered by the region-picker screen; this task only emits bounds into the store it reads from.
- `RegionBoundsPreview` (pending Sprint 2 delta) — consumes bounds state published by this task.

---

### OFFL-003 — Wire iOS Mapbox offline SDK into region lifecycle

Integrate Mapbox iOS offline SDK: pack creation, progress stream, pause/resume/cancel, iOS background task lifecycle, and on-disk byte accounting. Emit typed events into the shared download-lifecycle store consumed by OFFL-004. No UI is constructed here.

#### Components Consumed
- `BoundingBoxOverlay` (pending Sprint 2 delta) — consumed by picker screen via shared bounds state.
- `RegionBoundsPreview` (pending Sprint 2 delta) — consumed via shared bounds state.

---

### OFFL-004 — Wire Sprint-2 offline UI into the download lifecycle per UC-OFFL-02/05/09

Wire Sprint-2 `DownloadProgressIndicator` + `DownloadProgressBanner` + `RegionListItem` + `RegionNameBottomSheet` + `RenameRegionBottomSheet` + `DeleteConfirmationDialog` + (pending delta) `BackgroundDownloadNotification` into offline download lifecycle per UC-OFFL-02/05/09. Bind each component's props to the lifecycle store produced by OFFL-002/003, route sheet submissions to the metadata layer from OFFL-001, and connect delete/cancel confirmations to pack-teardown actions. No new components authored — consumption and wiring only.

#### Components Consumed
- `DownloadProgressIndicator` — per-region and in-progress progress display.
- `DownloadProgressBanner` — persistent top banner with pause/resume/cancel.
- `RegionListItem` — idle, in-flight, and downloaded row variants.
- `RegionNameBottomSheet` — naming at region creation.
- `RenameRegionBottomSheet` — rename flow on existing packs.
- `DeleteConfirmationDialog` — cancel-partial and delete-confirm flows.
- `BackgroundDownloadNotification` (pending Sprint 2 delta) — OS-level notification surface.

---

### OFFL-005 — Wire cached route access, offline ride recovery, and sync conflict handling

Wire Convex local-first reads for cached routes and saved rides, offline-started ride resumption, and reconnection conflict resolution (last-write-wins / merge per schema). Integrate with the metadata layer from OFFL-001 for TTL-driven eviction.

#### Components Consumed
- `RegionListItem` — consumes `lastAccessedAt` updates emitted by this task.
- `DeleteConfirmationDialog` — reused for TTL/eviction confirmations triggered from storage-management flows.

---

### OFFL-006 — Wire offline failure states, restore paths, and human-test instrumentation

Wire failure/retry surfaces into Sprint-2 banners and list items, add restart-recovery probes for in-flight packs, and emit instrumentation events required for the Human Testing Gate.

#### Components Consumed
- `DownloadProgressBanner` — consumed for failure and retry states.
- `RegionListItem` — consumed for error badge state.
- `DeleteConfirmationDialog` — consumed for orphan-pack cleanup prompts.
