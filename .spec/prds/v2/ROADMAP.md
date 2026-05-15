---
roadmap: 1
project: LaneShadow V2 — Navigator Design System
generated: 2026-04-23T21:00:00-07:00
prd: .spec/prds/v2/
sprint_count: 8
---

# Sprint Roadmap: LaneShadow V2 — Navigator Design System

## Overview

**Sprints:** 8 (2 completed, 6 planned)
**Total Tasks:** ~79 (22 completed, ~57 planned)
**Current Sprint:** Sprint 03 — Second Theme Foundation + Atom Migration

This roadmap covers the full V2 Copper design system migration: tokens, atoms, molecules, organisms, six Navigator screens, sandbox infrastructure, React Native retirement, and final legacy-theme deletion. Sprints 1-2 are completed on `main`. Sprint 3 now establishes a second theme alongside the current implementation and migrates the atom layer onto it. Sprints 4-7 build upward through molecules → organisms → screens, then retire the React Native shell. Sprint 8 deletes the legacy theme only after parity is locked.

**Migration strategy update**
1. Ship the Copper theme as a second theme instead of doing a one-shot replacement.
2. Move atoms to the new theme first so higher layers inherit the new token surface through stable atom APIs.
3. Continue molecules, organisms, and screens on top of the new theme once atom parity is green.
4. Delete the legacy theme only at the end of the roadmap, after sandbox parity and RN retirement are complete.

## Sprint Sequence

| # | Sprint | Gate | Tasks | Dependencies | Status |
|---|--------|------|-------|--------------|--------|
| 1 | [Sprint 01: Foundation Tokens & V2 Reset](#sprint-01-foundation-tokens--v2-reset) | Token swatch + cleanup + sandbox boot | 9 | — | Completed |
| 2 | [Sprint 02: Atoms — Foundation Primitives](#sprint-02-atoms--foundation-primitives) | All atom stories render on both platforms | 20 | Sprint 01 | Completed |
| 3 | [Sprint 03: Second Theme Foundation + Atom Migration](#sprint-03-second-theme-foundation--atom-migration) | Second theme ships and atom stories run on it | 10 | Sprint 02 | In Progress |
| 4 | [Sprint 04: Molecules — Composite Patterns](#sprint-04-molecules--composite-patterns) | All molecule stories render, compose atoms only | 16 | Sprint 03 | In Progress |
| 5 | [Sprint 05: Organisms — Navigator Domain Compositions](#sprint-05-organisms--navigator-domain-compositions) | All organism stories render with mock data | 14 | Sprint 04 | Planned |
| 6 | [Sprint 06: Navigator Screens — Sandboxed Views](#sprint-06-navigator-screens--sandboxed-views) | All 6 screens render with fixture providers | 16 | Sprint 05 | Planned |
| 7 | [Sprint 07: Terminal Cleanup — RN Retirement](#sprint-07-terminal-cleanup--rn-retirement) | react-native/ deleted, parity passes | 2 | Sprint 06 | Planned |
| 8 | [Sprint 08: Delete Legacy Theme](#sprint-08-delete-legacy-theme) | Old theme is gone and only Copper remains | 3 | Sprint 07 | Planned |

---

## Per-Sprint Details

### Sprint 01: Foundation Tokens & V2 Reset

**Sequence:** 1
**Timeline:** Phase 1 · Week 1
**Status:** Completed

#### Human Testing Gate

**Gate:** Pre-Sprint-2 reset is complete: the failed-port UI is gone from both native trees, the sandbox launches with zero stories on both platforms building green, and the token swatch story renders every semantic color, every typography family variant, every spacing rung, and every motion recipe on both platforms — matching the Copper Navigator concepts.

#### Tasks

| ID | Title | Agent | Estimate |
|----|-------|-------|----------|
| UC-SBX-00-ios | Native-sandbox install + host wiring — iOS | swift-implementer | 180 min |
| UC-SBX-00-android | Native-sandbox install + host wiring — Android | kotlin-implementer | 180 min |
| UC-SBX-05-ios | Pre-V2 failed-port cleanup — iOS | swift-implementer | 120 min |
| UC-SBX-05-android | Pre-V2 failed-port cleanup — Android | kotlin-implementer | 120 min |
| UC-TOK-01 | Typography families (opinion / ui / instrument) | shared tooling | 180 min |
| UC-TOK-02 | Color semantics (surface / signal / role / weather / route / status) | shared tooling | 240 min |
| UC-TOK-03 | Spacing / sizing / stroke / radius / opacity / elevation | shared tooling | 120 min |
| UC-TOK-04 | Motion recipes + primitive duration/easing | shared tooling | 180 min |
| UC-TOK-05 | Cross-platform token generation pipeline + icons + Mapbox URLs | shared tooling | 480 min |

#### Dependencies

- Blocks: Sprint 02
- Dependent on: None

#### PRD Coverage

- `04-uc-tok.md` — UC-TOK-01 through UC-TOK-05
- `09-uc-sbx.md` — UC-SBX-05
- `11-technical-requirements.md` — Token pipeline, icon catalog, font manifest

---

### Sprint 02: Atoms — Foundation Primitives

**Sequence:** 2
**Timeline:** Phase 2 · Week 2
**Status:** Completed

#### Human Testing Gate

**Gate:** Every foundation atom story renders in the sandbox on both iOS and Android — typography, buttons, inputs, avatar/divider/spinner, surface trio (including `LSGlassPanel`), `LSPill`, `LSBadge` status + weather variants, `LSPhaseDot`, `LSScrim`, and the design-owned icon catalog — identical across platforms and faithful to the Copper concepts, with zero SF Symbols / Material Icons remaining.

#### Tasks

| ID | Title | Agent | Estimate |
|----|-------|-------|----------|
| UC-ATM-01-ios | Typography atoms (`LSText`) — iOS | swift-implementer | 120 min |
| UC-ATM-01-android | Typography atoms (`LSText`) — Android | kotlin-implementer | 120 min |
| UC-ATM-02-ios | Button atom (all variants + states) — iOS | swift-implementer | 240 min |
| UC-ATM-02-android | Button atom (all variants + states) — Android | kotlin-implementer | 240 min |
| UC-ATM-03-ios | Input atoms (`LSTextField`, `LSTextArea`) — iOS | swift-implementer | 180 min |
| UC-ATM-03-android | Input atoms (`LSTextField`, `LSTextArea`) — Android | kotlin-implementer | 180 min |
| UC-ATM-04-ios | Base display atoms (Avatar, Divider, Spinner) — iOS | swift-implementer | 120 min |
| UC-ATM-04-android | Base display atoms (Avatar, Divider, Spinner) — Android | kotlin-implementer | 120 min |
| UC-ATM-05-ios | Surface trio (`LSCard`, `LSPanel`, `LSGlassPanel`) — iOS | swift-implementer | 180 min |
| UC-ATM-05-android | Surface trio (`LSCard`, `LSPanel`, `LSGlassPanel`) — Android | kotlin-implementer | 180 min |
| UC-ATM-06-ios | Pill atom (`LSPill`) — iOS | swift-implementer | 60 min |
| UC-ATM-06-android | Pill atom (`LSPill`) — Android | kotlin-implementer | 60 min |
| UC-ATM-07-ios | Badge atom (`LSBadge` + `LSBestBadge`) — iOS | swift-implementer | 120 min |
| UC-ATM-07-android | Badge atom (`LSBadge` + `LSBestBadge`) — Android | kotlin-implementer | 120 min |
| UC-ATM-08-ios | PhaseDot atom (`LSPhaseDot`) — iOS | swift-implementer | 90 min |
| UC-ATM-08-android | PhaseDot atom (`LSPhaseDot`) — Android | kotlin-implementer | 90 min |
| UC-ATM-09-ios | Scrim atom (`LSScrim`) — iOS | swift-implementer | 60 min |
| UC-ATM-09-android | Scrim atom (`LSScrim`) — Android | kotlin-implementer | 60 min |
| UC-ATM-10-ios | Icon atom (`LSIcon`) — design-owned SVG catalog — iOS | swift-implementer | 240 min |
| UC-ATM-10-android | Icon atom (`LSIcon`) — design-owned SVG catalog — Android | kotlin-implementer | 240 min |

#### Dependencies

- Blocks: Sprint 03
- Dependent on: Sprint 01

#### PRD Coverage

- `05-uc-atm.md` — UC-ATM-01 through UC-ATM-10

---

### Sprint 03: Second Theme Foundation + Atom Migration

**Sequence:** 3
**Timeline:** Phase 3 · Week 3
**Status:** In Progress

#### Overview

Sprints 1-2 built the token pipeline and atom components from the PRD and `native-theme` primitives. The design system at `.spec/design/system/` remains the authoritative visual source, but the migration strategy has changed: this sprint introduces Copper as a second theme running in parallel with the current one, then moves every atom onto that new theme surface. Any drift — missing keys, wrong values, mismatched color names, incorrect typography scales — is corrected as part of that second-theme rollout. The `LSMap` atom (UC-ATM-11/12/13) also ships in this sprint as the final atom on the new theme.

#### Human Testing Gate

**Gate:** A reviewer opens the sandbox on both platforms, toggles light/dark, and verifies that the second theme is active, every generated token key/value matches `design/system/tokens/` exactly, and every atom component renders identically to its `design/system/atoms/` HTML reference — zero visual drift between platforms and between spec and implementation.

**Test Steps:**
1. Run `pnpm tokens:validate && pnpm tokens:sync-check && pnpm icons:check` and confirm all exit 0 with no drift warnings.
2. Compare generated `Tokens.swift` color keys against `design/system/tokens/theme.light.json` and `theme.dark.json` — every key present, every value matching (hex + alpha).
3. Compare generated `Tokens.kt` color keys against the same JSON sources — identical coverage and values.
4. Open every atom story in the sandbox on iOS and Android side-by-side; compare each against its `design/system/atoms/{component}/` HTML reference — colors, spacing, typography, sizing, corner radii, elevation all match.
5. Open the `LSMap` story on both platforms and verify it renders the Copper Studio map style, accepts multi-polyline with route-variant colors, and falls back gracefully on missing token.
6. Toggle light/dark at every story; confirm no hard-coded light-only or dark-only values survive.

#### Tasks

| ID | Title | Agent | Estimate |
|----|-------|-------|----------|
| ALIGN-01 | Audit token outputs against `design/system/tokens/` — identify drift in color keys, typography scales, spacing rungs, motion recipes | swift-planner + kotlin-planner | 120 min |
| ALIGN-02-ios | Refactor Swift token generation to match `design/system/tokens/` key/value spec — fix missing keys, wrong values, naming gaps | swift-implementer | 180 min |
| ALIGN-02-android | Refactor Kotlin token generation to match `design/system/tokens/` key/value spec — fix missing keys, wrong values, naming gaps | kotlin-implementer | 180 min |
| ALIGN-03-ios | Refactor iOS atom components to match `design/system/atoms/` specs — correct color mappings, typography resolution, spacing, radii, elevation per atom | swift-implementer | 240 min |
| ALIGN-03-android | Refactor Android atom components to match `design/system/atoms/` specs — correct color mappings, typography resolution, spacing, radii, elevation per atom | kotlin-implementer | 240 min |
| UC-ATM-11 | `LSMap` shared contract — multi-polyline API, `RouteVariant` enum, fixture polylines, stub implementations on both platforms | swift-planner + kotlin-planner | 180 min |
| UC-ATM-12-ios | `LSMap` iOS implementation — Mapbox Maps SDK integration, Copper Studio styles, `UIViewRepresentable` wrapper, annotation rendering | swift-implementer | 360 min |
| UC-ATM-12-android | `LSMap` Android implementation — Mapbox Maps SDK integration, Copper Studio styles, `AndroidView` wrapper, annotation rendering | kotlin-implementer | 360 min |
| ALIGN-04-ios | Update iOS sandbox stories to reflect refactored atoms — fix any broken argTypes, add missing variants per design system | swift-implementer | 120 min |
| ALIGN-04-android | Update Android sandbox stories to reflect refactored atoms — fix any broken argTypes, add missing variants per design system | kotlin-implementer | 120 min |

#### Next Sprint Tasks

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

#### Dependencies

- Blocks: Sprint 04
- Dependent on: Sprint 02

#### PRD Coverage

- `04-uc-tok.md` — token key/value alignment
- `05-uc-atm.md` — UC-ATM-11 through UC-ATM-13 (LSMap)
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

---

### Sprint 04: Molecules — Composite Patterns

**Sequence:** 4
**Timeline:** Phase 4 · Week 4
**Status:** In Progress

#### Overview

Build all eight molecule UCs — compositions of atoms shaped for the Navigator screens. Every molecule routes through atom APIs (no inlined `Text`, no raw `Box` with literal colors). Includes the Pill semantics family, ChatInput, Navigator molecules (PhaseIndicator, WeatherTimeline, InstrumentReadout), LocationContextBar, RouteAttachmentCard, and shared patterns (Card, ListRow, Toolbar, BottomSheet, Toast, Modal, FormField, TabItem, EmptyState). All rendered in the sandbox with mock data.

#### Human Testing Gate

**Gate:** A reviewer opens every molecule story in the sandbox on both platforms, toggles light/dark, and confirms that `LSChatInput` (with location bar, suggestion chips, collapse/send/filter affordances), `LSPhaseIndicator`, `LSWeatherTimeline`, `LSInstrumentReadout`, `LSRouteAttachmentCard`, the Pill semantics family, and all shared patterns render per-variant across platforms — composing atoms only, no inlined primitives, faithful to the Copper concepts.

**Test Steps:**
1. Launch sandbox on both platforms; confirm Molecules tier shows stories for ContentCard, ListRow, Toolbar, NavHeader, BottomSheet, Toast, Modal, FormField, TabItem, EmptyState, TagPill, FilterChip, SuggestionChip, WeatherBadge, ChatInput, PhaseIndicator, WeatherTimeline, InstrumentReadout, LocationContextBar, RouteAttachmentCard.
2. Open ChatInput story and verify the full affordance set — text input, leading icon, trailing send/sliders swap, suggestion chip row, location badge, collapse/expand behavior.
3. Open Pill semantics family and verify TagPill, FilterChip, SuggestionChip, WeatherBadge each compose from `LSPill` with correct content, interaction, and color resolution.
4. Open Navigator molecules and verify PhaseIndicator renders 3-state pipeline, WeatherTimeline renders forecast entries, InstrumentReadout renders distance/time/climb metrics.
5. Open RouteAttachmentCard and verify variant stripe + scenic meter + route summary compose correctly.
6. Toggle light/dark across all stories; run `pnpm sandbox:parity-check` and confirm every Molecules story ID exists on both platforms.

#### Tasks

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

#### Next Sprint Tasks

Generated by /kb-sprint-tasks-plan on 2026-04-24T00:30:00-07:00

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

#### Dependencies

- Blocks: Sprint 05
- Dependent on: Sprint 03

#### PRD Coverage

- `06-uc-mol.md` — UC-MOL-01 through UC-MOL-08

### Per-Task Design Files

| Task | Design Reference |
|------|-----------------|
| UC-MOL-01-ios | [`design/system/molecules/content-card/`](../../design/system/molecules/content-card/) + [`design/system/molecules/list-row/`](../../design/system/molecules/list-row/) |
| UC-MOL-01-android | [`design/system/molecules/content-card/`](../../design/system/molecules/content-card/) + [`design/system/molecules/list-row/`](../../design/system/molecules/list-row/) |
| UC-MOL-02-ios | [`design/system/molecules/toolbar/`](../../design/system/molecules/toolbar/) + [`design/system/molecules/nav-header/`](../../design/system/molecules/nav-header/) |
| UC-MOL-02-android | [`design/system/molecules/toolbar/`](../../design/system/molecules/toolbar/) + [`design/system/molecules/nav-header/`](../../design/system/molecules/nav-header/) |
| UC-MOL-03-ios | [`design/system/molecules/bottom-sheet/`](../../design/system/molecules/bottom-sheet/) + [`design/system/molecules/toast/`](../../design/system/molecules/toast/) + [`design/system/molecules/modal/`](../../design/system/molecules/modal/) |
| UC-MOL-03-android | [`design/system/molecules/bottom-sheet/`](../../design/system/molecules/bottom-sheet/) + [`design/system/molecules/toast/`](../../design/system/molecules/toast/) + [`design/system/molecules/modal/`](../../design/system/molecules/modal/) |
| UC-MOL-04-ios | [`design/system/molecules/form-field/`](../../design/system/molecules/form-field/) + [`design/system/molecules/tab-item/`](../../design/system/molecules/tab-item/) + [`design/system/molecules/empty-state/`](../../design/system/molecules/empty-state/) |
| UC-MOL-04-android | [`design/system/molecules/form-field/`](../../design/system/molecules/form-field/) + [`design/system/molecules/tab-item/`](../../design/system/molecules/tab-item/) + [`design/system/molecules/empty-state/`](../../design/system/molecules/empty-state/) |
| UC-MOL-05-ios | [`design/system/molecules/tag-pill/`](../../design/system/molecules/tag-pill/) + [`design/system/molecules/filter-chip/`](../../design/system/molecules/filter-chip/) + [`design/system/molecules/suggestion-chip/`](../../design/system/molecules/suggestion-chip/) + [`design/system/molecules/weather-badge/`](../../design/system/molecules/weather-badge/) |
| UC-MOL-05-android | [`design/system/molecules/tag-pill/`](../../design/system/molecules/tag-pill/) + [`design/system/molecules/filter-chip/`](../../design/system/molecules/filter-chip/) + [`design/system/molecules/suggestion-chip/`](../../design/system/molecules/suggestion-chip/) + [`design/system/molecules/weather-badge/`](../../design/system/molecules/weather-badge/) |
| UC-MOL-06-ios | [`design/system/molecules/chat-input/`](../../design/system/molecules/chat-input/) |
| UC-MOL-06-android | [`design/system/molecules/chat-input/`](../../design/system/molecules/chat-input/) |
| UC-MOL-07-ios | [`design/system/molecules/phase-indicator/`](../../design/system/molecules/phase-indicator/) + [`design/system/molecules/weather-timeline/`](../../design/system/molecules/weather-timeline/) + [`design/system/molecules/instrument-readout/`](../../design/system/molecules/instrument-readout/) |
| UC-MOL-07-android | [`design/system/molecules/phase-indicator/`](../../design/system/molecules/phase-indicator/) + [`design/system/molecules/weather-timeline/`](../../design/system/molecules/weather-timeline/) + [`design/system/molecules/instrument-readout/`](../../design/system/molecules/instrument-readout/) |
| UC-MOL-08-ios | [`design/system/molecules/location-context-bar/`](../../design/system/molecules/location-context-bar/) + [`design/system/molecules/route-attachment-card/`](../../design/system/molecules/route-attachment-card/) |
| UC-MOL-08-android | [`design/system/molecules/location-context-bar/`](../../design/system/molecules/location-context-bar/) + [`design/system/molecules/route-attachment-card/`](../../design/system/molecules/route-attachment-card/) |

---

### Sprint 05: Organisms — Navigator Domain Compositions

**Sequence:** 5
**Timeline:** Phase 5 · Week 5
**Status:** Planned

#### Overview

Build all seven organism UCs — feature-domain compositions that remain data-agnostic (render from props driven by mock providers). Includes TopBar + NavBar, MapLayer (the shared map-primary canvas reused across all screens), NavigatorMessage + InlineErrorCallout, RouteSheet, SessionsDrawer, RouteCard, and SectionHeader. Every organism composes molecules and atoms, never inlining primitives.

#### Human Testing Gate

**Gate:** A reviewer opens every organism story with mock domain data on both platforms and confirms that `LSTopBar` glass chrome renders correctly, `LSMapLayer` presents the map canvas with scrim + overlay slots, `LSNavigatorMessage` branding with compass chip + opinion-serif body + attached route cards matches the concepts, `LSInlineErrorCallout` warn-stripe + suggestion-chip footer is correct, `LSRouteSheet` bottom-sheet layout with best badge + instrument readout + weather timeline + action row is complete, `LSSessionsDrawer` left-anchored slide-in with grouped sessions + active-session stripe matches the spec, and `LSRouteCard` + `LSSectionHeader` render identically across platforms.

**Test Steps:**
1. Launch sandbox on both platforms; confirm Organisms tier shows stories for TopBar, NavBar, MapLayer, NavigatorMessage, InlineErrorCallout, RouteSheet, SessionsDrawer, RouteCard, SectionHeader.
2. Open TopBar story and verify hamburger chip + optional title + "NEW" chip all backed by `LSGlassPanel(.chrome)` in both light/dark.
3. Open MapLayer story and verify map renders with scrim overlay, content slot stacking, and safe-area / WindowInsets respect.
4. Open NavigatorMessage story and verify branded "THE NAVIGATOR" callout with compass chip, opinion-serif body, optional attached route cards, and pin/dismiss actions.
5. Open RouteSheet story and verify bottom-sheet with `LSBestBadge`, `LSInstrumentReadout`, `LSWeatherTimeline`, and Save / Ride this action row.
6. Open SessionsDrawer story and verify left-anchored slide-in with grouped sessions, active-session stripe, and drawer chrome.

#### Tasks

| ID | Title | Agent | Estimate |
|----|-------|-------|----------|
| UC-ORG-01-ios | Navigation organisms (`LSTopBar` + `LSNavBar`) — iOS | swift-implementer | 180 min |
| UC-ORG-01-android | Navigation organisms (`LSTopBar` + `LSNavBar`) — Android | kotlin-implementer | 180 min |
| UC-ORG-02-ios | `LSMapLayer` organism — iOS | swift-implementer | 240 min |
| UC-ORG-02-android | `LSMapLayer` organism — Android | kotlin-implementer | 240 min |
| UC-ORG-03-ios | `LSNavigatorMessage` + `LSInlineErrorCallout` — iOS | swift-implementer | 240 min |
| UC-ORG-03-android | `LSNavigatorMessage` + `LSInlineErrorCallout` — Android | kotlin-implementer | 240 min |
| UC-ORG-04-ios | `LSRouteSheet` organism — iOS | swift-implementer | 180 min |
| UC-ORG-04-android | `LSRouteSheet` organism — Android | kotlin-implementer | 180 min |
| UC-ORG-05-ios | `LSSessionsDrawer` organism — iOS | swift-implementer | 180 min |
| UC-ORG-05-android | `LSSessionsDrawer` organism — Android | kotlin-implementer | 180 min |
| UC-ORG-06-ios | `LSRouteCard` domain organism — iOS | swift-implementer | 120 min |
| UC-ORG-06-android | `LSRouteCard` domain organism — Android | kotlin-implementer | 120 min |
| UC-ORG-07-ios | `LSSectionHeader` organism — iOS | swift-implementer | 60 min |
| UC-ORG-07-android | `LSSectionHeader` organism — Android | kotlin-implementer | 60 min |

#### Dependencies

- Blocks: Sprint 06
- Dependent on: Sprint 04

#### PRD Coverage

- `07-uc-org.md` — UC-ORG-01 through UC-ORG-07

### Per-Task Design Files

| Task | Design Reference |
|------|-----------------|
| UC-ORG-01-ios | [`design/system/organisms/topbar-navbar/`](../../design/system/organisms/topbar-navbar/) |
| UC-ORG-01-android | [`design/system/organisms/topbar-navbar/`](../../design/system/organisms/topbar-navbar/) |
| UC-ORG-02-ios | [`design/system/organisms/map-layer/`](../../design/system/organisms/map-layer/) |
| UC-ORG-02-android | [`design/system/organisms/map-layer/`](../../design/system/organisms/map-layer/) |
| UC-ORG-03-ios | [`design/system/organisms/navigator-callouts/`](../../design/system/organisms/navigator-callouts/) |
| UC-ORG-03-android | [`design/system/organisms/navigator-callouts/`](../../design/system/organisms/navigator-callouts/) |
| UC-ORG-04-ios | [`design/system/organisms/route-sheet/`](../../design/system/organisms/route-sheet/) |
| UC-ORG-04-android | [`design/system/organisms/route-sheet/`](../../design/system/organisms/route-sheet/) |
| UC-ORG-05-ios | [`design/system/organisms/sessions-drawer/`](../../design/system/organisms/sessions-drawer/) |
| UC-ORG-05-android | [`design/system/organisms/sessions-drawer/`](../../design/system/organisms/sessions-drawer/) |
| UC-ORG-06-ios | [`design/system/organisms/route-card/`](../../design/system/organisms/route-card/) |
| UC-ORG-06-android | [`design/system/organisms/route-card/`](../../design/system/organisms/route-card/) |
| UC-ORG-07-ios | [`design/system/organisms/section-header/`](../../design/system/organisms/section-header/) |
| UC-ORG-07-android | [`design/system/organisms/section-header/`](../../design/system/organisms/section-header/) |

---

### Sprint 06: Navigator Screens — Sandboxed Views

**Sequence:** 6
**Timeline:** Phase 6 · Week 6
**Status:** Planned

#### Overview

Build all six Navigator screen templates — Idle, Planning, RouteResults, RouteDetails, Sessions, Error — composing organisms, molecules, and atoms into full-screen templates. Every screen renders from a named mock data provider in the sandbox with no live Convex wiring. This sprint also delivers the hardened sandbox infrastructure: UC-SBX-01 (parity manifest), UC-SBX-02 (theme controller + args), UC-SBX-03 (mock data providers + fixtures), and UC-SBX-06 (visual regression snapshot testing).

#### Human Testing Gate

**Gate:** A reviewer opens every Navigator screen story on both platforms with its fixture provider — Idle (map + greeting + suggestion chips), Planning (sketching polyline + phase indicator + thinking-state input), RouteResults (3 alt polylines + Navigator message + 3 route cards + refine input), RouteDetails (map + route sheet with best badge + instrument readout + weather timeline), Sessions (scrimmed map + sessions drawer), Error (map + inline error callout + recovery input) — and each screen matches the concepts end-to-end. Cross-platform parity manifest passes. `pnpm snapshots:parity-report` shows green.

**Test Steps:**
1. Launch sandbox on both platforms; confirm Screens tier shows stories for Idle, Planning, RouteResults, RouteDetails, Sessions, Error.
2. Open IdleScreen and verify `LSTopBar` + greeting overlay (opinion-serif headline with italicized "today") + full-screen paper-map + `LSChatInput` with 4 suggestion chips + location badge.
3. Open PlanningScreen and verify sketching polyline animation + `LSPhaseIndicator` with active step + thinking-state chat input (disabled).
4. Open RouteResultsScreen and verify 3 alt polylines on map + `LSNavigatorMessage` with 3 attached `LSRouteAttachmentCard` entries + refine-prompt chat input.
5. Open RouteDetailsScreen and verify map + `LSRouteSheet` bottom-sheet with `LSBestBadge` + `LSInstrumentReadout` + `LSWeatherTimeline` + Save / Ride this actions.
6. Open SessionsScreen and verify scrimmed map + `LSSessionsDrawer` slide-in with grouped sessions.
7. Run `pnpm sandbox:parity-check` and `pnpm snapshots:parity-report` and confirm both pass green.

#### Tasks

| ID | Title | Agent | Estimate |
|----|-------|-------|----------|
| SBX-INFRA-01 | Story registry + tier aggregation + parity manifest — both platforms | shared tooling | 120 min |
| SBX-INFRA-02-ios | Theme controller + light/dark toggle + args control system — iOS | swift-implementer | 120 min |
| SBX-INFRA-02-android | Theme controller + light/dark toggle + args control system — Android | kotlin-implementer | 120 min |
| SBX-INFRA-03 | Mock data providers + fixtures — fixture JSON + codegen for Swift + Kotlin | shared tooling | 180 min |
| UC-SCR-01-ios | `IdleScreen` — iOS | swift-implementer | 240 min |
| UC-SCR-01-android | `IdleScreen` — Android | kotlin-implementer | 240 min |
| UC-SCR-02-ios | `PlanningScreen` — iOS | swift-implementer | 240 min |
| UC-SCR-02-android | `PlanningScreen` — Android | kotlin-implementer | 240 min |
| UC-SCR-03-ios | `RouteResultsScreen` — iOS | swift-implementer | 240 min |
| UC-SCR-03-android | `RouteResultsScreen` — Android | kotlin-implementer | 240 min |
| UC-SCR-04-ios | `RouteDetailsScreen` — iOS | swift-implementer | 180 min |
| UC-SCR-04-android | `RouteDetailsScreen` — Android | kotlin-implementer | 180 min |
| UC-SCR-05-ios | `SessionsScreen` — iOS | swift-implementer | 180 min |
| UC-SCR-05-android | `SessionsScreen` — Android | kotlin-implementer | 180 min |
| UC-SCR-06-ios | `ErrorScreen` — iOS | swift-implementer | 120 min |
| UC-SCR-06-android | `ErrorScreen` — Android | kotlin-implementer | 120 min |

#### Dependencies

- Blocks: Sprint 07
- Dependent on: Sprint 05

#### PRD Coverage

- `08-uc-scr.md` — UC-SCR-01 through UC-SCR-06
- `09-uc-sbx.md` — UC-SBX-01, UC-SBX-02, UC-SBX-03, UC-SBX-06

### Per-Task Design Files

| Task | Design Reference |
|------|-----------------|
| UC-SCR-01-ios | [`design/system/views/mapapp/idle/`](../../design/system/views/mapapp/idle/) |
| UC-SCR-01-android | [`design/system/views/mapapp/idle/`](../../design/system/views/mapapp/idle/) |
| UC-SCR-02-ios | [`design/system/views/mapapp/planning/`](../../design/system/views/mapapp/planning/) |
| UC-SCR-02-android | [`design/system/views/mapapp/planning/`](../../design/system/views/mapapp/planning/) |
| UC-SCR-03-ios | [`design/system/views/mapapp/route-results/`](../../design/system/views/mapapp/route-results/) |
| UC-SCR-03-android | [`design/system/views/mapapp/route-results/`](../../design/system/views/mapapp/route-results/) |
| UC-SCR-04-ios | [`design/system/views/mapapp/route-details/`](../../design/system/views/mapapp/route-details/) |
| UC-SCR-04-android | [`design/system/views/mapapp/route-details/`](../../design/system/views/mapapp/route-details/) |
| UC-SCR-05-ios | [`design/system/views/mapapp/sessions-drawer/`](../../design/system/views/mapapp/sessions-drawer/) |
| UC-SCR-05-android | [`design/system/views/mapapp/sessions-drawer/`](../../design/system/views/mapapp/sessions-drawer/) |
| UC-SCR-06-ios | [`design/system/views/mapapp/error/`](../../design/system/views/mapapp/error/) |
| UC-SCR-06-android | [`design/system/views/mapapp/error/`](../../design/system/views/mapapp/error/) |

---

### Sprint 07: Terminal Cleanup — RN Retirement

**Sequence:** 7
**Timeline:** Phase 7 · Week 7
**Status:** Planned

#### Overview

Terminal cleanup pass: delete `react-native/` app-shell in its entirety after all Navigator screens have reached functional parity in the sandbox. Strip RN-related references from `package.json`, `lefthook.yml`, `Makefile`, `tsconfig*.json`. Verify sandbox still launches, parity check passes, and all pre-commit/pre-push gates pass.

#### Human Testing Gate

**Gate:** `react-native/` is gone, cross-platform parity check passes, `/native-sandbox` still launches on both platforms, and pre-commit + pre-push gates pass.

**Test Steps:**
1. Run `ls react-native/` and confirm the directory does not exist.
2. Run `pnpm sandbox:parity-check` and confirm exit 0 — every story ID exists on both platforms.
3. Launch `/native-sandbox --platform ios` and `/native-sandbox --platform android` and confirm both boot cleanly with all stories present.
4. Run `lefthook run pre-push` and confirm all checks pass (type-check, biome, tokens, builds).

#### Tasks

| ID | Title | Agent | Estimate |
|----|-------|-------|----------|
| UC-SBX-04-ios | React Native shell retirement — delete `react-native/`, strip RN refs from build configs, verify iOS build + sandbox | swift-implementer | 180 min |
| UC-SBX-04-android | React Native shell retirement — strip RN refs from Android build configs, verify Android build + sandbox | kotlin-implementer | 120 min |

#### Dependencies

- Blocks: None
- Dependent on: Sprint 06

#### PRD Coverage

- `09-uc-sbx.md` — UC-SBX-04

---

### Sprint 08: Delete Legacy Theme

**Sequence:** 8
**Timeline:** Phase 8 · Week 8
**Status:** Planned

#### Overview

Final cleanup pass: remove the pre-Copper theme once the second theme has fully absorbed the atom, molecule, organism, and screen layers. This sprint deletes the legacy theme implementation, removes compatibility shims and old token access paths, and leaves the sandbox, app, and test fixtures running on Copper as the only supported theme.

#### Human Testing Gate

**Gate:** The legacy theme no longer exists in source, only Copper theme entry points remain, the sandbox still renders every story on both platforms, and no runtime path references the deleted theme.

**Test Steps:**
1. Search the repo for the old theme entry points and confirm only Copper theme references remain.
2. Launch the sandbox on iOS and Android and confirm all atom, molecule, organism, and screen stories still render.
3. Toggle light/dark and verify the remaining theme behavior still works through the Copper theme controller.
4. Run project verification gates and confirm no deleted-theme references remain in builds, tests, or generated outputs.

#### Tasks

| ID | Title | Agent | Estimate |
|----|-------|-------|----------|
| THEME-DELETE-01 | Remove legacy shared theme exports, shims, and obsolete token access paths | shared tooling | 180 min |
| THEME-DELETE-02-ios | Remove iOS references to the deleted theme and verify sandbox/app parity | swift-implementer | 120 min |
| THEME-DELETE-02-android | Remove Android references to the deleted theme and verify sandbox/app parity | kotlin-implementer | 120 min |

#### Dependencies

- Blocks: None
- Dependent on: Sprint 07

#### PRD Coverage

- `04-uc-tok.md` — final token/theme consolidation
- `05-uc-atm.md` — atom theme migration closure
- `11-technical-requirements.md` — cleanup of obsolete theme infrastructure

---

## Dependency Graph

```
Sprint 01 (TOK + SBX-05) ──► Sprint 02 (ATM 01-10)
                                   │
                                   ▼
                             Sprint 03 (second theme + atom migration)
                                   │
                                   ▼
                             Sprint 04 (MOL)
                                   │
                                   ▼
                             Sprint 05 (ORG)
                                   │
                                   ▼
                             Sprint 06 (SCR + SBX-01/02/03/06)
                                   │
                                   ▼
                             Sprint 07 (SBX-04 — RN retirement)
                                   │
                                   ▼
                             Sprint 08 (delete legacy theme)
```

## Uncovered PRD Sections

None. All 45 UCs across 6 functional groups are covered:

| Group | UCs | Sprint Coverage |
|-------|-----|-----------------|
| TOK | 5 | Sprint 01 |
| ATM | 13 | Sprint 02 (UC-ATM 01-10) + Sprint 03 (UC-ATM 11-13) |
| MOL | 8 | Sprint 04 |
| ORG | 7 | Sprint 05 |
| SCR | 6 | Sprint 06 |
| SBX | 6 | Sprint 01 (SBX-00, SBX-05) + Sprint 06 (SBX-01/02/03/06) + Sprint 07 (SBX-04) |
