---
sequence: 4
timeline: Phase 4 · Week 4
status: Planned
sprint_id: sprint-04-molecules-composite-patterns
gate_type: visual_parity
---

# Sprint 04: Molecules — Composite Patterns

## Overview

Build all eight molecule UCs — compositions of atoms shaped for the Navigator screens. Every molecule routes through atom APIs from Sprints 02–03 (no inlined SwiftUI `Text`, no raw Compose `Box` with literal colors). Includes the Pill semantics family (`LSTagPill` / `LSFilterChip` / `LSSuggestionChip` / `LSWeatherBadge`), `LSChatInput` with location bar + suggestion chips + collapse/send/filter affordances, the Navigator molecules (`LSPhaseIndicator` / `LSWeatherTimeline` / `LSInstrumentReadout`), `LSLocationContextBar` + `LSRouteAttachmentCard`, and the shared patterns (`LSContentCard` / `LSListRow` / `LSToolbar` / `LSNavHeader` / `LSBottomSheet` / `LSToast` / `LSModal` / `LSFormField` / `LSTabItem` / `LSEmptyState`). All rendered in the sandbox with mock data on the Copper second theme delivered by Sprint 03.

## Human Testing Gate

**Gate:** A reviewer opens every molecule story in the sandbox on both platforms, toggles light/dark, and confirms that `LSChatInput` (with location bar, suggestion chips, collapse/send/filter affordances), `LSPhaseIndicator`, `LSWeatherTimeline`, `LSInstrumentReadout`, `LSRouteAttachmentCard`, the Pill semantics family, and all shared patterns render per-variant across iOS and Android — composing atoms only, no inlined primitives, faithful to the Copper concepts at `.spec/design/system/molecules/`.

## Human Test Deliverable

1. Launch sandbox on both platforms; confirm Molecules tier shows stories for ContentCard, ListRow, Toolbar, NavHeader, BottomSheet, Toast, Modal, FormField, TabItem, EmptyState, TagPill, FilterChip, SuggestionChip, WeatherBadge, ChatInput, PhaseIndicator, WeatherTimeline, InstrumentReadout, LocationContextBar, RouteAttachmentCard.
2. Open ChatInput story and verify the full affordance set — text input, leading icon, trailing send/sliders swap, suggestion chip row, location badge, collapse/expand behavior, isThinking spinner, isEnabled disabled state.
3. Open Pill semantics family and verify TagPill, FilterChip, SuggestionChip, WeatherBadge each compose from `LSPill` with correct content, interaction, and color resolution (including all six weather conditions × two sizes).
4. Open Navigator molecules and verify PhaseIndicator renders compass chip + header + multi-step phase list with `motion.recipe.phaseDotPulse`; WeatherTimeline renders 6-cell horizontal grid with per-condition tinted backgrounds; InstrumentReadout renders 4-column metric grid with mono `typography.instrument.lg` values.
5. Open LocationContextBar (auto/manual mode toggle) and RouteAttachmentCard (best/alt1/alt2 variants with leading stripe in `color.route.<variant>`, scenic dot meter, optional `LSBestBadge`/`LSWeatherBadge`).
6. Toggle light/dark across all stories on both platforms; run `pnpm sandbox:parity-check` and confirm every Molecules story ID exists on both platforms.
7. Run `lefthook run pre-commit` and confirm `ios-typecheck` (xcodebuild build) and `android-typecheck` (gradle compileDebugKotlin) both succeed.
8. Verify atom composition: tests assert each molecule uses atoms from UC-ATM-01 through UC-ATM-10 — raw `Text`/`Box` with literal colors fail snapshot/style inspection.

## Tasks

| ID | Title | Agent | Estimate |
|----|-------|-------|----------|
| UC-MOL-01-ios | Card + ListRow molecules — iOS | swift-implementer | 180 min |
| UC-MOL-01-android | Card + ListRow molecules — Android | kotlin-implementer | 180 min |
| UC-MOL-02-ios | Toolbar + NavHeader molecules — iOS | swift-implementer | 120 min |
| UC-MOL-02-android | Toolbar + NavHeader molecules — Android | kotlin-implementer | 120 min |
| UC-MOL-03-ios | BottomSheet + Toast + Modal molecules — iOS | swift-implementer | 240 min |
| UC-MOL-03-android | BottomSheet + Toast + Modal molecules — Android | kotlin-implementer | 240 min |
| UC-MOL-04-ios | FormField + TabItem + EmptyState molecules — iOS | swift-implementer | 180 min |
| UC-MOL-04-android | FormField + TabItem + EmptyState molecules — Android | kotlin-implementer | 180 min |
| UC-MOL-05-ios | Pill semantics family (TagPill / FilterChip / SuggestionChip / WeatherBadge) — iOS | swift-implementer | 120 min |
| UC-MOL-05-android | Pill semantics family (TagPill / FilterChip / SuggestionChip / WeatherBadge) — Android | kotlin-implementer | 120 min |
| UC-MOL-06-ios | ChatInput molecule (`LSChatInput`) — iOS | swift-implementer | 240 min |
| UC-MOL-06-android | ChatInput molecule (`LSChatInput`) — Android | kotlin-implementer | 240 min |
| UC-MOL-07-ios | Navigator molecules (PhaseIndicator / WeatherTimeline / InstrumentReadout) — iOS | swift-implementer | 180 min |
| UC-MOL-07-android | Navigator molecules (PhaseIndicator / WeatherTimeline / InstrumentReadout) — Android | kotlin-implementer | 180 min |
| UC-MOL-08-ios | LocationContextBar + RouteAttachmentCard molecules — iOS | swift-implementer | 120 min |
| UC-MOL-08-android | LocationContextBar + RouteAttachmentCard molecules — Android | kotlin-implementer | 120 min |

## Task Detail Files

Generated by /kb-sprint-tasks-plan on 2026-04-23T22:00:00-07:00

- UC-MOL-01-ios-card-listrow-molecules.md
- UC-MOL-01-android-card-listrow-molecules.md
- UC-MOL-02-ios-toolbar-navheader-molecules.md
- UC-MOL-02-android-toolbar-navheader-molecules.md
- UC-MOL-03-ios-bottomsheet-toast-modal-molecules.md
- UC-MOL-03-android-bottomsheet-toast-modal-molecules.md
- UC-MOL-04-ios-formfield-tabitem-emptystate-molecules.md
- UC-MOL-04-android-formfield-tabitem-emptystate-molecules.md
- UC-MOL-05-ios-pill-semantics-family.md
- UC-MOL-05-android-pill-semantics-family.md
- UC-MOL-06-ios-chatinput-molecule.md
- UC-MOL-06-android-chatinput-molecule.md
- UC-MOL-07-ios-navigator-molecules.md
- UC-MOL-07-android-navigator-molecules.md
- UC-MOL-08-ios-location-route-molecules.md
- UC-MOL-08-android-location-route-molecules.md

## Dependencies

- Blocks: Sprint 05
- Dependent on: Sprint 03

## PRD Coverage

- `06-uc-mol.md` — UC-MOL-01 through UC-MOL-08
- `.spec/design/system/molecules/` — authoritative molecule visual specs (HTML writeouts per molecule)

### Per-Task Design Files

| Task | Design Reference |
|------|-----------------|
| UC-MOL-01-ios | [`design/system/molecules/content-card/`](../../../design/system/molecules/content-card/) + [`design/system/molecules/list-row/`](../../../design/system/molecules/list-row/) |
| UC-MOL-01-android | [`design/system/molecules/content-card/`](../../../design/system/molecules/content-card/) + [`design/system/molecules/list-row/`](../../../design/system/molecules/list-row/) |
| UC-MOL-02-ios | [`design/system/molecules/toolbar/`](../../../design/system/molecules/toolbar/) + [`design/system/molecules/nav-header/`](../../../design/system/molecules/nav-header/) |
| UC-MOL-02-android | [`design/system/molecules/toolbar/`](../../../design/system/molecules/toolbar/) + [`design/system/molecules/nav-header/`](../../../design/system/molecules/nav-header/) |
| UC-MOL-03-ios | [`design/system/molecules/bottom-sheet/`](../../../design/system/molecules/bottom-sheet/) + [`design/system/molecules/toast/`](../../../design/system/molecules/toast/) + [`design/system/molecules/modal/`](../../../design/system/molecules/modal/) |
| UC-MOL-03-android | [`design/system/molecules/bottom-sheet/`](../../../design/system/molecules/bottom-sheet/) + [`design/system/molecules/toast/`](../../../design/system/molecules/toast/) + [`design/system/molecules/modal/`](../../../design/system/molecules/modal/) |
| UC-MOL-04-ios | [`design/system/molecules/form-field/`](../../../design/system/molecules/form-field/) + [`design/system/molecules/tab-item/`](../../../design/system/molecules/tab-item/) + [`design/system/molecules/empty-state/`](../../../design/system/molecules/empty-state/) |
| UC-MOL-04-android | [`design/system/molecules/form-field/`](../../../design/system/molecules/form-field/) + [`design/system/molecules/tab-item/`](../../../design/system/molecules/tab-item/) + [`design/system/molecules/empty-state/`](../../../design/system/molecules/empty-state/) |
| UC-MOL-05-ios | [`design/system/molecules/tag-pill/`](../../../design/system/molecules/tag-pill/) + [`design/system/molecules/filter-chip/`](../../../design/system/molecules/filter-chip/) + [`design/system/molecules/suggestion-chip/`](../../../design/system/molecules/suggestion-chip/) + [`design/system/molecules/weather-badge/`](../../../design/system/molecules/weather-badge/) |
| UC-MOL-05-android | [`design/system/molecules/tag-pill/`](../../../design/system/molecules/tag-pill/) + [`design/system/molecules/filter-chip/`](../../../design/system/molecules/filter-chip/) + [`design/system/molecules/suggestion-chip/`](../../../design/system/molecules/suggestion-chip/) + [`design/system/molecules/weather-badge/`](../../../design/system/molecules/weather-badge/) |
| UC-MOL-06-ios | [`design/system/molecules/chat-input/`](../../../design/system/molecules/chat-input/) |
| UC-MOL-06-android | [`design/system/molecules/chat-input/`](../../../design/system/molecules/chat-input/) |
| UC-MOL-07-ios | [`design/system/molecules/phase-indicator/`](../../../design/system/molecules/phase-indicator/) + [`design/system/molecules/weather-timeline/`](../../../design/system/molecules/weather-timeline/) + [`design/system/molecules/instrument-readout/`](../../../design/system/molecules/instrument-readout/) |
| UC-MOL-07-android | [`design/system/molecules/phase-indicator/`](../../../design/system/molecules/phase-indicator/) + [`design/system/molecules/weather-timeline/`](../../../design/system/molecules/weather-timeline/) + [`design/system/molecules/instrument-readout/`](../../../design/system/molecules/instrument-readout/) |
| UC-MOL-08-ios | [`design/system/molecules/location-context-bar/`](../../../design/system/molecules/location-context-bar/) + [`design/system/molecules/route-attachment-card/`](../../../design/system/molecules/route-attachment-card/) |
| UC-MOL-08-android | [`design/system/molecules/location-context-bar/`](../../../design/system/molecules/location-context-bar/) + [`design/system/molecules/route-attachment-card/`](../../../design/system/molecules/route-attachment-card/) |
