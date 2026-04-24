---
sequence: 3
timeline: Phase 3 · Week 3
status: Needs Remediation
sprint_id: sprint-03-design-system-alignment
gate_type: visual_parity
---

# Sprint 03: Second Theme Foundation + Atom Migration

## Overview

Sprints 1-2 built the token pipeline and atom components from the PRD and `native-theme` primitives. The design system at `.spec/design/system/` is still the authoritative visual source, but Sprint 03 now follows a safer migration strategy: ship Copper as a second theme in parallel with the legacy theme, then move the atom layer onto that new theme before higher-level UI work continues. This sprint therefore does two things together: closes token drift against the design system and uses that corrected token surface to migrate atoms, stories, and `LSMap` onto the second theme. Deleting the legacy theme is explicitly out of scope for this sprint and happens only after parity is proven in later roadmap work.

## Human Testing Gate

**Gate:** A reviewer opens the sandbox on both platforms, confirms the Copper second theme is active for atom stories, toggles light/dark, and verifies that every generated token key/value matches `design/system/tokens/` exactly and every atom component renders identically to its `design/system/atoms/` HTML reference — zero visual drift between platforms and between spec and implementation, with the legacy theme still intact but no longer driving Sprint 03 atom stories.

## Human Test Deliverable

1. Run `pnpm tokens:validate && pnpm tokens:sync-check && pnpm icons:check` and confirm all exit 0 with no drift warnings.
2. Verify the Copper second theme exists on both platforms without deleting the legacy theme.
3. Compare generated `Tokens.swift` color keys against `design/system/tokens/theme.light.json` and `theme.dark.json` — every key present, every value matching (hex + alpha).
4. Compare generated `Tokens.kt` color keys against the same JSON sources — identical coverage and values.
5. Open every atom story in the sandbox on iOS and Android side-by-side under the Copper theme; compare each against its `design/system/atoms/{component}/` HTML reference — colors, spacing, typography, sizing, corner radii, elevation all match.
6. Open the `LSMap` story on both platforms and verify it renders the Copper Studio map style, accepts multi-polyline with route-variant colors, and falls back gracefully on missing token.
7. Toggle light/dark at every story; confirm no hard-coded light-only or dark-only values survive.
8. Confirm legacy-theme deletion has not happened yet: any compatibility shims required for downstream work remain in place until the final cleanup sprint.

## Reopen Notes

Red-hat review on 2026-04-24 re-opened Sprint 03 completion because the LSMap implementation tasks are not finished:

- `UC-ATM-12-ios` is reopened. The iOS map wrapper still has a hardcoded style URL, no real `updateUIView` behavior, and no implemented polyline, annotation, camera-fit, or scroll-isolation logic.
- `UC-ATM-12-android` is reopened. Android still ships a placeholder `Box` while the real Mapbox `AndroidView` path remains commented out.
- `ALIGN-03-android` remains closed for this sprint review. It is noted here only as context and is not being reopened by this update.
- `ALIGN-04-ios` and `ALIGN-04-android` remain closed. Their story-registration work does not reopen, but Sprint 03 still cannot be accepted until both LSMap platform tasks are actually completed and the human testing gate is rerun.

Carryover required before Sprint 03 can be closed:

1. Finish `UC-ATM-12-ios` against AC-2 through AC-9.
2. Finish `UC-ATM-12-android` against AC-2 through AC-7 plus story rendering.
3. Re-run the Sprint 03 human testing gate, especially the LSMap stories on both platforms.
4. Update task and runner state after remediation so later sprint planning is not relying on false completion.

## Tasks

| ID | Title | Agent | Estimate |
|----|-------|-------|----------|
| ALIGN-01 | Audit legacy theme usage and token drift against `design/system/tokens/` — produce second-theme migration source of truth | swift-planner + kotlin-planner | 120 min |
| ALIGN-02-ios | Introduce the Copper second-theme token surface on iOS — fix missing keys, wrong values, naming gaps, preserve legacy theme | swift-implementer | 180 min |
| ALIGN-02-android | Introduce the Copper second-theme token surface on Android — fix missing keys, wrong values, naming gaps, preserve legacy theme | kotlin-implementer | 180 min |
| ALIGN-03-ios | Migrate iOS atom components onto the Copper second theme — correct color mappings, typography resolution, spacing, radii, elevation per atom | swift-implementer | 240 min |
| ALIGN-03-android | Migrate Android atom components onto the Copper second theme — correct color mappings, typography resolution, spacing, radii, elevation per atom | kotlin-implementer | 240 min |
| UC-ATM-11 | `LSMap` shared contract — multi-polyline API, `RouteVariant` enum, fixture polylines, stub implementations on the new theme surface | swift-planner + kotlin-planner | 180 min |
| UC-ATM-12-ios | `LSMap` iOS implementation on the Copper theme — Mapbox Maps SDK integration, Copper Studio styles, `UIViewRepresentable` wrapper, annotation rendering | swift-implementer | 360 min |
| UC-ATM-12-android | `LSMap` Android implementation on the Copper theme — Mapbox Maps SDK integration, Copper Studio styles, `AndroidView` wrapper, annotation rendering | kotlin-implementer | 360 min |
| ALIGN-04-ios | Switch iOS sandbox atom stories to the Copper theme — fix any broken argTypes, add missing variants per design system | swift-implementer | 120 min |
| ALIGN-04-android | Switch Android sandbox atom stories to the Copper theme — fix any broken argTypes, add missing variants per design system | kotlin-implementer | 120 min |

## Task Detail Files

Generated by /kb-sprint-tasks-plan on 2026-04-23T21:45:00-07:00

- ALIGN-01-audit-token-outputs.md
- ALIGN-02-ios-refactor-swift-token-generation.md
- ALIGN-02-android-refactor-kotlin-token-generation.md
- ALIGN-03-ios-refactor-ios-atoms.md
- ALIGN-03-android-refactor-android-atoms.md
- UC-ATM-11-lsmap-shared-contract.md
- UC-ATM-12-ios-lsmap-ios-implementation.md
- UC-ATM-12-android-lsmap-android-implementation.md
- ALIGN-04-ios-update-ios-sandbox-stories.md
- ALIGN-04-android-update-android-sandbox-stories.md

## Dependencies

- Blocks: Sprint 04
- Dependent on: Sprint 02

## PRD Coverage

- `04-uc-tok.md` — token key/value alignment and second-theme surface
- `05-uc-atm.md` — atom migration plus UC-ATM-11 through UC-ATM-13 (LSMap)
- `design/system/tokens/` — authoritative token spec
- `design/system/atoms/` — authoritative atom visual specs

### Per-Task Design Files

| Task | Design Reference |
|------|-----------------|
| ALIGN-01 | [`design/system/tokens/`](../../design/system/tokens/) |
| ALIGN-02-ios | [`design/system/tokens/`](../../design/system/tokens/) |
| ALIGN-02-android | [`design/system/tokens/`](../../design/system/tokens/) |
| ALIGN-03-ios | [`design/system/atoms/`](../../design/system/atoms/) |
| ALIGN-03-android | [`design/system/atoms/`](../../design/system/atoms/) |
| UC-ATM-11 | [`design/system/atoms/map/`](../../design/system/atoms/map/) |
| UC-ATM-12-ios | [`design/system/atoms/map/`](../../design/system/atoms/map/) |
| UC-ATM-12-android | [`design/system/atoms/map/`](../../design/system/atoms/map/) |
| ALIGN-04-ios | [`design/system/atoms/`](../../design/system/atoms/) |
| ALIGN-04-android | [`design/system/atoms/`](../../design/system/atoms/) |
