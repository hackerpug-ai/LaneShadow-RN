# Sprint 4: Molecules

**Sequence:** 4
**Timeline:** Phase 3 · Week 3–4
**Status:** Planned

---

## Overview

This sprint delivers the eight molecule UCs — compositions of atoms into small reusable Navigator patterns. Every molecule ships paired iOS + Android implementations, with a story per variant, and every molecule routes through the ATM-tier public APIs (no raw `Text`/`Box`/`HStack` with literal colors). The sprint includes the four general-purpose patterns retained from v1 (Card+ListRow, Toolbar+NavHeader, BottomSheet+Toast+Modal, FormField+TabItem+EmptyState) and the four new Navigator-specific molecules (Pill semantics family, ChatInput, Navigator trio of PhaseIndicator/WeatherTimeline/InstrumentReadout, and LocationContextBar+RouteAttachmentCard) that UC-ORG-03 / UC-ORG-04 / UC-SCR-01..06 will compose upward from.

Per-platform split: every UC expands to paired `-ios` + `-android` tasks. The 10-task-per-sprint gate is intentionally exceeded (16 paired tasks) to expose parallel execution; the sprint gate still operates at UC granularity.

---

## Package Boundaries (CONSTITUTION)

Inherited from Sprint 1; restated for molecule-tier enforcement.

- **Theme package is the ONLY token source.** Every molecule imports colors / typography / spacing / motion / icon names from the project-local theme package (`tokens/platforms/swift/Sources/LaneShadowTheme/` on iOS, `tokens/platforms/kotlin/src/main/java/com/laneshadow/theme/generated/` + `LaneShadowTheme` Compose wrapper on Android). No literal tokens anywhere in molecule code.
- **Composition-only rule.** Every molecule composes from ATM-tier public APIs (`LSText`, `LSIcon`, `LSPill`, `LSGlassPanel`, `LSBadge`, `LSScrim`, `LSSpinner`, etc.). No raw `Text` / `Image` / `HStack` / `Row` / `Column` with literal values. A molecule caught inlining a primitive with a literal color is a review-time reject.
- **Sandbox runtime is the ONLY preview surface.** Every molecule ships a Story per variant via `Story`, `SandboxRoot`, `ThemeController`, `ArgValues` from `~/Projects/native-sandbox`, registered into `ios/LaneShadow/Sandbox/Stories/*Stories.swift` and `android/app/src/debug/java/com/laneshadow/sandbox/stories/*Stories.kt`.
- **Story contract (per `~/Projects/native-sandbox/RULES.md` §6).** Every molecule story conforms to: dotted tier-first `id` (e.g. `molecules.chatinput.default-empty`, `molecules.pill-family.filterchip-selected`, `molecules.weathertimeline.six-hour`), `tier: ComponentTier.molecule`, PascalCase `component` name (e.g. `"LSChatInput"`), short `name`, one-sentence `summary`, stateless render closure. Stories register into `MoleculeStories.all` (iOS `enum` `static let all: [Story]` / Android `object` `val all: List<Story>`). Composed at host level into `LaneShadowSandbox` — no global registry.
- **Debug-only on Android.** Every molecule Story file lives under `android/app/src/debug/java/com/laneshadow/sandbox/stories/`. Release builds must not ship sandbox code.

---

## Human Test Deliverable

A reviewer can open every molecule story in the sandbox on both platforms, toggle light and dark, cycle through all declared variants, and confirm that each molecule composes cleanly over ATM-tier atoms — `LSChatInput` swaps the trailing icon between `sliders` and `send` based on input, `LSPhaseIndicator` shows the active-phase ring pulse, `LSWeatherTimeline` tints each cell per condition, `LSInstrumentReadout` renders the 4-column mono grid with dividers, and `LSRouteAttachmentCard` renders its variant stripe in `color.route.*`.

**Test Steps:**
1. Launch `/native-sandbox` on both platforms; confirm the Molecules tier aggregates Card+ListRow, Toolbar+NavHeader, BottomSheet+Toast+Modal, FormField+TabItem+EmptyState, Pill semantics family (TagPill/FilterChip/SuggestionChip/WeatherBadge), ChatInput, PhaseIndicator, WeatherTimeline, InstrumentReadout, LocationContextBar, and RouteAttachmentCard stories.
2. Open the Pill family stories and verify `LSTagPill`, `LSFilterChip` (selected/unselected), `LSSuggestionChip`, and `LSWeatherBadge` (all six weather conditions × two sizes) each render with their correct tokens and compose internally from `LSPill` + `LSIcon` + `LSText` (no raw pill-shape re-implementations).
3. Open the ChatInput stories (Default empty, With Text, Thinking, Disabled, With Suggestions+Location) and verify the input bar uses `LSGlassPanel(.chrome)`, the trailing icon swaps between `sliders` and `send` as text is typed, the `isThinking` state swaps the trailing slot to `LSSpinner`, the suggestion-chip row scrolls horizontally, and the `LSLocationContextBar` renders above the suggestion row.
4. Open the Navigator molecules (`LSPhaseIndicator`, `LSWeatherTimeline`, `LSInstrumentReadout`) and verify the compass chip + header on PhaseIndicator, the active-step `motion.recipe.phaseDotPulse` ring pulse, the 6-cell weather grid with per-condition tint backgrounds, and the 4-column mono instrument readout with top/bottom dividers.
5. Open `LSRouteAttachmentCard` in its `Best Selected`, `Best Compact`, `Alt1`, `Alt2`, `With Favorite Flag`, and `Long Title (overflow)` stories and verify the 3px leading stripe resolves to `color.route.best / .alt1 / .alt2` per variant, the `LSBestBadge` appears only when `isBest && !compact`, and the 5-dot scenic meter renders correctly.
6. Open `LSLocationContextBar` and verify the two `LSTagPill`s (location with signal pin icon + mode pill) render with space-between layout; tap the mode pill and confirm `onModeChange` fires once.
7. Run the iOS + Android molecule test suites and confirm the "composes only from atoms" assertions pass — no raw primitives with literal colors.

---

## Tasks

| ID | Title | Agent | Estimate |
|----|-------|-------|----------|
| UC-MOL-01-ios | Card + ListRow molecules — iOS SwiftUI | swift-implementer | 180 min |
| UC-MOL-01-android | Card + ListRow molecules — Android Compose | kotlin-implementer | 180 min |
| UC-MOL-02-ios | Toolbar + NavHeader molecules — iOS SwiftUI | swift-implementer | 150 min |
| UC-MOL-02-android | Toolbar + NavHeader molecules — Android Compose | kotlin-implementer | 150 min |
| UC-MOL-03-ios | BottomSheet + Toast + Modal molecules — iOS SwiftUI | swift-implementer | 240 min |
| UC-MOL-03-android | BottomSheet + Toast + Modal molecules — Android Compose | kotlin-implementer | 240 min |
| UC-MOL-04-ios | FormField + TabItem + EmptyState molecules — iOS SwiftUI | swift-implementer | 180 min |
| UC-MOL-04-android | FormField + TabItem + EmptyState molecules — Android Compose | kotlin-implementer | 180 min |
| UC-MOL-05-ios | Pill semantics family (TagPill / FilterChip / SuggestionChip / WeatherBadge) — iOS SwiftUI | swift-implementer | 180 min |
| UC-MOL-05-android | Pill semantics family (TagPill / FilterChip / SuggestionChip / WeatherBadge) — Android Compose | kotlin-implementer | 180 min |
| UC-MOL-06-ios | ChatInput molecule (`LSChatInput`) — iOS SwiftUI | swift-implementer | 300 min |
| UC-MOL-06-android | ChatInput molecule (`LSChatInput`) — Android Compose | kotlin-implementer | 300 min |
| UC-MOL-07-ios | Navigator molecules (PhaseIndicator / WeatherTimeline / InstrumentReadout) — iOS SwiftUI | swift-implementer | 240 min |
| UC-MOL-07-android | Navigator molecules (PhaseIndicator / WeatherTimeline / InstrumentReadout) — Android Compose | kotlin-implementer | 240 min |
| UC-MOL-08-ios | LocationContextBar + RouteAttachmentCard molecules — iOS SwiftUI | swift-implementer | 180 min |
| UC-MOL-08-android | LocationContextBar + RouteAttachmentCard molecules — Android Compose | kotlin-implementer | 180 min |

---

## Human Testing Gate

**Gate:** Every molecule story renders on both iOS and Android composing over ATM-tier atoms (no inlined raw primitives), with `LSChatInput`, `LSPhaseIndicator`, `LSWeatherTimeline`, `LSInstrumentReadout`, `LSRouteAttachmentCard`, and the full Pill semantics family (TagPill / FilterChip / SuggestionChip / WeatherBadge) rendering correctly per variant and matching the Copper Navigator concepts.

---

## Source Coverage

- `.spec/prds/v2/06-uc-mol.md` — UC-MOL-01 through UC-MOL-08 acceptance criteria
- `.spec/prds/v2/concepts/designs.html` — authoritative Copper Navigator composition reference
- `.spec/prds/v2/11-technical-requirements.md` — entity schemas (`SuggestionChip`, `LocationContext`, `RouteAttachment`, `WeatherSummary`, `WeatherTimelineEntry`, `PlanningPhase`, `FilterChip`) consumed by these molecules
- All atoms from Sprints 2 and 3 (UC-ATM-01 through UC-ATM-13) as composition inputs

### Per-Task Design Files

| Task | Design Reference |
|------|-----------------|
| UC-MOL-01-ios | [`concepts/uc-mol-01-card-listrow.html`](../../concepts/uc-mol-01-card-listrow.html) |
| UC-MOL-01-android | [`concepts/uc-mol-01-card-listrow.html`](../../concepts/uc-mol-01-card-listrow.html) |
| UC-MOL-02-ios | [`concepts/uc-mol-02-toolbar-navheader.html`](../../concepts/uc-mol-02-toolbar-navheader.html) |
| UC-MOL-02-android | [`concepts/uc-mol-02-toolbar-navheader.html`](../../concepts/uc-mol-02-toolbar-navheader.html) |
| UC-MOL-03-ios | [`concepts/uc-mol-03-bottomsheet-toast-modal.html`](../../concepts/uc-mol-03-bottomsheet-toast-modal.html) |
| UC-MOL-03-android | [`concepts/uc-mol-03-bottomsheet-toast-modal.html`](../../concepts/uc-mol-03-bottomsheet-toast-modal.html) |
| UC-MOL-04-ios | [`concepts/uc-mol-04-formfield-tabitem-emptystate.html`](../../concepts/uc-mol-04-formfield-tabitem-emptystate.html) |
| UC-MOL-04-android | [`concepts/uc-mol-04-formfield-tabitem-emptystate.html`](../../concepts/uc-mol-04-formfield-tabitem-emptystate.html) |
| UC-MOL-05-ios | [`concepts/uc-mol-05-pill-family.html`](../../concepts/uc-mol-05-pill-family.html) |
| UC-MOL-05-android | [`concepts/uc-mol-05-pill-family.html`](../../concepts/uc-mol-05-pill-family.html) |
| UC-MOL-06-ios | [`concepts/uc-mol-06-chatinput.html`](../../concepts/uc-mol-06-chatinput.html) |
| UC-MOL-06-android | [`concepts/uc-mol-06-chatinput.html`](../../concepts/uc-mol-06-chatinput.html) |
| UC-MOL-07-ios | [`concepts/uc-mol-07-navigator-molecules.html`](../../concepts/uc-mol-07-navigator-molecules.html) |
| UC-MOL-07-android | [`concepts/uc-mol-07-navigator-molecules.html`](../../concepts/uc-mol-07-navigator-molecules.html) |
| UC-MOL-08-ios | [`concepts/uc-mol-08-location-route.html`](../../concepts/uc-mol-08-location-route.html) |
| UC-MOL-08-android | [`concepts/uc-mol-08-location-route.html`](../../concepts/uc-mol-08-location-route.html) |

---

## Blocks

- Sprint 5 (Organisms) — every organism composes from molecules; `LSNavigatorMessage`, `LSInlineErrorCallout`, `LSRouteSheet`, `LSSessionsDrawer`, and `LSRouteCard` all depend on specific molecules from this sprint.
- Sprints 6, 7 — indirectly, through the screen dependency chain.
