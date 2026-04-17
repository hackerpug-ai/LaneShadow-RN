# Sprint 10: Native Parity and React Native Retirement

**Sequence:** 10
**Status:** Planned

## Overview

Verify native parity, close residual wiring and edge-case gaps, run the full rider regression matrix, and remove the React Native app once the parity audit passes. All 195 components and pending-delta compositions were built in Sprint 2; this sprint is verification, gap-filling, and cutover — not component building.

## Human Testing Gate

**Gate:** Full-app regression passes across both native apps — every prior sprint's wiring, flows, and screens work end-to-end in the integrated build, the parity audit reports zero open gaps, and removing `react-native/` causes no functional loss.

## Human Test Deliverable

The team can delete the React Native app with confidence because full-app regression on native Android and iOS demonstrates that every rider journey — from auth through voice, offline, and billing — operates correctly on top of the Sprint 2 component foundation and the Sprint 3–9 wiring.

## Human Test Steps

1. Execute the full-app E2E verification matrix on Android across all flows built in Sprints 3–9 (auth, discovery, chat planning, comparison, turn-by-turn, recording, offline, voice, gatekeeper, billing).
2. Repeat the full-app E2E matrix on iOS and confirm parity with Android and the PRD.
3. Review the PAR-001 gap report and confirm every catalog component has sandbox coverage, use-case wiring, and a fidelity snapshot.
4. Exercise edge-case state transitions and accessibility flows called out by the audit on both platforms.
5. Remove `react-native/` in a verification branch and confirm no required commands, docs, or flows still depend on it.

## Components Consumed

All atomic, molecular, organism, and composition entries from `08a-atomic-component-catalog.md` (the full 195-component catalog plus pending-delta compositions). This sprint consumes the entire catalog en bloc — no new components are built here; every component referenced below was delivered in Sprint 2 and wired by Sprints 3–9.

## Source Coverage

- `README.md`
- `07-native-app-backlog.md`
- `08a-atomic-component-catalog.md`
- `08b-android-component-map.md`
- `08c-ios-component-map.md`
- `08d-component-parity-spec.md`
- `09-uc-navigation.md`
- `10-uc-ride-recording.md`
- `11-uc-offline.md`
- `12-uc-chat-planning.md`
- `13-uc-voice-assistant.md`
- `14-uc-route-comparison.md`
- `15-uc-ride-flow.md`
- `16-uc-gatekeeper.md`

## Dependencies

- Sprint 2: UI Component Translation and Fidelity Sandbox (all 195 components + pending-delta compositions)
- Sprint 3: Auth and Discovery Shell
- Sprint 4: Chat Planning and Comparison
- Sprint 5: Turn-by-Turn Navigation
- Sprint 6: Ride Recording and Saved Rides
- Sprint 7: Offline Maps and Cache Recovery
- Sprint 8: Voice Assistant
- Sprint 9: Gatekeeper and Platform Polish

## Blocks

- React Native retirement and final native-cutover release

## Tasks

| ID | Title | Agent | Estimate |
|----|-------|-------|----------|
| PAR-001 | Audit every component in the 08a catalog against implementation; verify each has sandbox coverage, use-case wiring, and a fidelity snapshot; produce a gap report | frontend-designer | 0.5 day |
| PAR-002 | Close remaining Android wiring gaps (components complete from Sprint 2); focus on edge-case state transitions and accessibility audit outcomes | kotlin-implementer | 1 day |
| PAR-003 | Close remaining iOS wiring gaps (components complete from Sprint 2); focus on edge-case state transitions and accessibility audit outcomes | swift-implementer | 1 day |
| PAR-004 | Run the full-app E2E verification matrix against all prior sprints' wiring on both platforms; execute route-data-display and cutover checklist; no component work | worker | 1 day |
| PAR-005 | Delete `react-native/` once the parity audit passes; repair docs and tooling; verify no functionality loss | worker | 0.5 day |
