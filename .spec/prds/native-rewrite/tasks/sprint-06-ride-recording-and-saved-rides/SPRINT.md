# Sprint 6: Ride Recording and Saved Rides

**Sequence:** 6
**Status:** Planned

## Overview

Extend active riding into persistent ride capture by wiring Sprint-2 UI primitives (and pending Sprint-2 delta organisms) into native background tracking, pause/resume flows, curvature analysis, ride completion persistence, saved-ride hydration, and share intents. This sprint is about wiring and state — not component construction.

## Human Testing Gate

**Gate:** A rider can record a ride, pause and resume it, persist a completion summary, reopen the saved ride after relaunch, and fire a share intent whose payload matches persisted state.

## Human Test Deliverable

Recorded rides become durable artifacts: state transitions are observable, persistence survives relaunch, and share intents carry the persisted summary data. UI surfaces are hydrated from Sprint-2 components (plus pending delta organisms) — no new visual primitives are built here.

## Human Test Steps

1. Start ride recording on Android and confirm the recording state machine transitions to `RECORDING`, GPS points persist to the local store, and the Sprint-2 `PermissionNotification` surfaces when location permission is missing.
2. Start ride recording on iOS and confirm identical state machine + persistence behavior; background sampling continues when the app is backgrounded.
3. Pause and resume recording on both platforms and confirm timer state, session status, and point-capture gating match the state machine (no UI regressions — surfaces are unchanged Sprint-2 wiring).
4. Complete a ride and confirm the persisted session hydrates `CompletionSummaryCard` (pending Sprint 2 delta) with map trace, metrics, and save/share actions — verify by inspecting persisted fields, not pixel layout.
5. Relaunch the app and confirm the saved ride hydrates `SavedRouteCard` in the saved-rides `SubpageLayout`; `EmptyState` renders when the list is empty.
6. Trigger share from `RideShareSheet` (pending Sprint 2 delta) and confirm the share intent payload matches persisted summary fields byte-for-byte.

## Source Coverage

- `10-uc-ride-recording.md`
- `15-uc-ride-flow.md`
- `17-state-convex-architecture.md`

## Dependencies

- Sprint 5: Turn-by-Turn Navigation
- Sprint 2 UI components (from `08a-atomic-component-catalog.md`):
  - `UI-SavedRouteCard` (molecule)
  - `UI-PermissionNotification` (molecule)
  - `UI-SubpageLayout` (template)
  - `UI-EmptyState` (molecule)
  - `UI-SectionHeader` (molecule)
- Sprint 2 **delta** components (pending, flagged as `pending Sprint 2 delta`):
  - `UI-CompletionSummaryCard` (organism, pending Sprint 2 delta)
  - `UI-RideShareSheet` (organism, pending Sprint 2 delta)

## Blocks

- Sprint 7: Offline Maps and Cache Recovery
- Sprint 10: Native Parity and React Native Retirement

## Tasks

| ID | Title | Agent | Estimate |
|----|-------|-------|----------|
| REC-001 | Define ride-session and ride-point local schemas with sync boundaries | worker | 0.5 day |
| REC-002 | Wire Android background recording service + GPS sampling into local persistence + recording state machine | kotlin-implementer | 1 day |
| REC-003 | Wire iOS background recording + GPS sampling into local persistence + recording state machine | swift-implementer | 1 day |
| REC-004 | Wire pause/resume controls, curvature analysis, and live ride metrics into the recording state machine | kotlin-implementer | 0.5 day |
| REC-005 | Wire Sprint-2 + delta components into post-ride persistence and share-intent flows per UC-REC-05/06 | frontend-designer | 0.5 day |
| REC-006 | Wire saved-rides list, reopen flow, and repository sync using Sprint-2 layout + list primitives | swift-implementer | 1 day |

---

### REC-001 — Ride-session / ride-point schemas

Define local schemas, sync boundaries, and ID strategy for `rideSession` and `ridePoint`. Pure data-layer task; no UI.

**Components Consumed:** None (data-layer only).

---

### REC-002 — Android background recording wiring

Wire the Android foreground service, GPS sampler, and persistence writer into the recording state machine defined in REC-001 + `17-state-convex-architecture.md`. Emit state transitions (`IDLE → RECORDING → PAUSED → COMPLETED`) that UI surfaces subscribe to. No UI construction — surfaces consume existing Sprint-2 primitives.

**Components Consumed:**
- `PermissionNotification` (Sprint 2) — surfaced when location permission is revoked mid-session.

---

### REC-003 — iOS background recording wiring

Wire iOS `CLLocationManager` background updates, power-aware sampling, and persistence writer into the recording state machine. Parity with REC-002 on state transitions and persistence semantics. No UI construction.

**Components Consumed:**
- `PermissionNotification` (Sprint 2) — surfaced when location or background permission is revoked.

---

### REC-004 — Pause/resume + curvature + live metrics wiring

Wire pause/resume controls and the curvature analyzer into the recording state machine. Compute and publish live metrics (distance, duration, curvature score) as observable state that HUD surfaces (Sprint 5) subscribe to. No new UI primitives.

**Components Consumed:** None new — reuses Sprint-5 HUD bindings; only publishes state updates.

---

### REC-005 — Ride completion + share flow wiring

Wire Sprint-2 `SavedRouteCard` + `PermissionNotification` + (pending Sprint 2 delta) `CompletionSummaryCard` + `RideShareSheet` into the post-ride persistence and share-intent flows specified in UC-REC-05/06. Responsibilities:
- On `COMPLETED` transition, persist the session summary and hydrate `CompletionSummaryCard` from the persisted record (not in-memory state).
- Bind the card's save action to the saved-rides repository.
- Bind the share action to `RideShareSheet`, which constructs a share intent whose payload is derived from persisted fields.

No visual-primitive construction in this task — all visual atoms/molecules/organisms come from Sprint 2 (existing or delta).

**Components Consumed:**
- `CompletionSummaryCard` (organism, **pending Sprint 2 delta**)
- `RideShareSheet` (organism, **pending Sprint 2 delta**)
- `SavedRouteCard` (Sprint 2)
- `PermissionNotification` (Sprint 2)

---

### REC-006 — Saved-rides list + reopen + repository sync

Wire the saved-rides screen using Sprint-2 `SubpageLayout` as the shell, `SectionHeader` for grouping, `SavedRouteCard` for rows, and `EmptyState` for the zero-state. Implement reopen hydration from the local repository and sync boundary with Convex per `17-state-convex-architecture.md`. No new UI.

**Components Consumed:**
- `SubpageLayout` (Sprint 2)
- `SectionHeader` (Sprint 2)
- `SavedRouteCard` (Sprint 2)
- `EmptyState` (Sprint 2)
