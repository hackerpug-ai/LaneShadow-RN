# Sprint 2: UI Component Translation and Fidelity Sandbox

**Sequence:** 2
**Status:** Planned

## Overview

Translate all 195 React Native components to Kotlin/Compose (Android) and Swift/SwiftUI (iOS) following the atomic design hierarchy. Every RN component gets identically-named platform equivalents (e.g., `Button` → `Button.kt` + `Button.swift`) consuming shared semantic tokens. Tasks are dual (Android + iOS run in parallel per component subset) and iterative (each subset respects the atomic dependency graph: atoms → molecules → organisms → templates → screens).

## Human Testing Gate

**Gate:** A reviewer can open Android and iOS sandbox modes, browse every atom/molecule/organism/template/screen scenario grouped by the atomic catalog, and confirm each native component renders with token-accurate parity against the React Native Storybook baseline.

## Human Test Deliverable

Both native platforms expose sandbox modes that mirror the React Native baseline component-by-component, enabling side-by-side fidelity verification before rider-facing auth, discovery, and planning sprints resume.

## Human Test Steps

1. Launch React Native Storybook and confirm the baseline `Tokens`, `Atoms`, `Molecules`, `Organisms`, `Templates`, and `Screens` scenario groups render in light and dark mode.
2. Launch the Android sandbox mode and confirm it exposes the same top-level groups, with RN reference labels linking each scenario to its source file.
3. Launch the iOS sandbox mode and confirm it exposes the same top-level groups, with RN reference labels.
4. For each completed atom subset (primitives, form controls, feedback/containers, icon/branding, map polylines): browse its scenarios on RN / Android / iOS side-by-side and confirm token-accurate parity.
5. For each completed molecule subset (12 categories): browse its scenarios on all three platforms and confirm interaction parity (states, animations, keyboard avoidance).
6. For each completed organism subset (7 categories): browse sheet/map/chat/navigation scenarios using deterministic fixtures (no auth, no backend) and confirm composition parity.
7. Open template scenarios (layouts, sheet wrappers, error boundaries) and confirm each platform renders the wrapper with correct safe-area + gradient handling.
8. Browse the screen scenarios (onboarding, route flows) on all three platforms and confirm screen-level composition parity.
9. Capture the phase-1 fidelity screenshot set across RN, Android, iOS for the approved verification slice.
10. Confirm every Android / iOS task in the Tasks table has a matching completion record referencing the specific component files that were translated.

## Source Coverage

- `06-technical-requirements.md`
- `08-design-system.md`
- `08a-atomic-component-catalog.md` (195 components inventoried)
- `08b-android-component-map.md` (Kotlin/Compose signatures)
- `08c-ios-component-map.md` (Swift/SwiftUI signatures)
- `08d-component-parity-spec.md` (cross-platform parity contract)
- `react-native/app/storybook.tsx`
- `react-native/stories/**`

## Dependencies

- Sprint 1: Repo Restructure and Server Frontload

## Blocks

- Sprint 3: Auth and Discovery Shell
- Sprint 4: Chat Planning and Comparison
- Sprint 5: Turn-by-Turn Navigation
- Sprint 6: Ride Recording and Saved Rides
- Sprint 7: Offline Maps and Cache Recovery
- Sprint 8: Voice Assistant
- Sprint 9: Gatekeeper and Platform Polish
- Sprint 10: Native Parity and React Native Retirement

## Sprint Structure

Tasks are organized into 7 phases following the atomic dependency graph. Each phase (except Foundation and Fidelity verification) runs its Android and iOS tasks in parallel. Within a phase, subsets are iterative — later subsets may depend on earlier ones within the same atomic level only when noted.

- **Phase A** — Foundation & sandbox bootstrap (4 tasks, shared)
- **Phase B** — Atoms (10 tasks — 5 subsets × dual platform)
- **Phase C** — Molecules (24 tasks — 12 subsets × dual platform)
- **Phase D** — Organisms (14 tasks — 7 subsets × dual platform)
- **Phase E** — Templates (4 tasks — 2 subsets × dual platform)
- **Phase F** — Screens (4 tasks — 2 subsets × dual platform)
- **Phase G** — Fidelity verification (3 tasks — 1 design + 2 reviewer)
- **Phase H** — Delta compositions from UC audit (22 tasks — 11 compositions × dual platform, added 2026-04-17)

**Total: 85 tasks (63 original + 22 delta from UC composition audit). ~55 platform-days of work on each native platform assuming no parallel streams per platform; with parallel execution within a platform, ~18–22 days elapsed.**

---

## Tasks

### Phase A — Foundation & Sandbox Bootstrap

| ID | Title | Agent | Estimate |
|----|-------|-------|----------|
| UI-001 | Define theme token JSON schema (source of truth) | frontend-designer | 0.5 day |
| UI-002 | Enforce theme token schema in iOS | swift-implementer | 0.75 day |
| UI-002B | Enforce theme token schema in Android | kotlin-implementer | 0.75 day |
| UI-003 | Bootstrap Android sandbox host, catalog navigation, and RN reference registry | kotlin-implementer | 1 day |
| UI-004 | Bootstrap iOS sandbox host, catalog navigation, and RN reference registry | swift-implementer | 1 day |

### Phase B — Atoms (42 components, 5 subsets)

Atoms must complete before any molecule task that depends on them.

| ID | Title | Agent | Estimate |
|----|-------|-------|----------|
| UI-005 | Android atoms 1/5 — core primitives & typography: `ThemedText`, `ThemedView`, `IconSymbol`, `Separator`, `DragHandle`, `SheetHandle` | kotlin-implementer | 0.5 days |
| UI-006 | iOS atoms 1/5 — core primitives & typography: `ThemeText`, `ThemeBackground`, `ThemeIcon`, `ThemeSeparator`, `ThemeDragHandle` (inline), `ThemeSheetHandle` (inline) | swift-implementer | 0.5 days |
| UI-007 | Android atoms 2/5 — form controls: `Button`, `PrimaryButton`, `Input`, `Textarea`, `BottomSheetInput`, `Switch`, `Toggle`, `Checkbox`, `Slider` | kotlin-implementer | 1 day |
| UI-008 | iOS atoms 2/5 — form controls: `ThemeButton`, `ThemePrimaryButton`, `ThemeInput`, `ThemeTextarea`, `ThemeBottomSheetInput`, `ThemeSwitch`, `ThemeToggle`, `ThemeCheckbox`, `ThemeSlider` | swift-implementer | 1 day |
| UI-009 | Android atoms 3/5 — feedback & containers: `Badge`, `Card` (+ `CardHeader`/`CardTitle`/`CardContent`/`CardDescription`), `Chip`, `Avatar`, `Skeleton`, `Progress`, `Collapsible`, `FAB` | kotlin-implementer | 1 day |
| UI-010 | iOS atoms 3/5 — feedback & containers: `ThemeBadge`, `ThemeCard` (+ subcomponents), `ThemeChip`, `ThemeAvatar`, `ThemeSkeleton`, `ThemeProgress`, `ThemeCollapsible`, `ThemeFAB` | swift-implementer | 1 day |
| UI-011 | Android atoms 4/5 — icon & branding: `MotorcyclePlusIcon`, `CompassPlusIcon`, `LaneShadowLogo`, `TypingIndicator` (+ resolve `IconSymbol.ios` divergence into shared resource map) | kotlin-implementer | 0.5 days |
| UI-012 | iOS atoms 4/5 — icon & branding: `MotorcyclePlusIcon`, `CompassPlusIcon`, `LaneShadowLogo`, `TypingIndicator` (SF Symbol mapping + custom asset fallbacks) | swift-implementer | 0.5 days |
| UI-013 | Android atoms 5/5 — map polyline atoms (Google Maps Compose SDK): `RoutePolyline`, `RoutePolylineComponent`, `DeviationPolyline` | kotlin-implementer | 0.5 days |
| UI-014 | iOS atoms 5/5 — map polyline atoms (Mapbox iOS / MapKit overlay): `RoutePolyline`, `RoutePolylineComponent`, `DeviationPolyline` | swift-implementer | 0.5 days |

### Phase C — Molecules (107 components, 12 subsets)

All molecule subsets can start once their dependent atoms in Phase B are complete. Subsets are independent of each other and can run in parallel per platform.

| ID | Title | Agent | Estimate |
|----|-------|-------|----------|
| UI-015 | Android molecules 1/12 — layout & sections: `AppHeader`, `Header`, `SectionHeader`, `BottomNavigation`, `TeacherTabBar`, `ToggleGroup`, `Banner`, `EmptyState`, `KeyboardAvoidingInput`, `MarkdownText`, `ThemePicker` | kotlin-implementer | 1 day |
| UI-016 | iOS molecules 1/12 — layout & sections: `ThemeAppHeader`, `Header` (template-like), `ThemeSectionHeader`, `ThemeBottomNavigation`, `TeacherTabBar`, `ThemeToggleGroup`, `ThemeBanner`, `ThemeEmptyState`, `KeyboardAvoidingInput`, `MarkdownText`, `ThemePicker` | swift-implementer | 1 day |
| UI-017 | Android molecules 2/12 — search & input: `SearchBar`, `FloatingSearchInput`, `CaptionInput`, `LocationInput`, `OverlayPill`, `WhereToBar` | kotlin-implementer | 0.5 days |
| UI-018 | iOS molecules 2/12 — search & input: `SearchBar`, `ThemeFloatingSearchInput`, `ThemeCaptionInput`, `ThemeLocationInput`, `ThemeOverlayPill`, `ThemeWhereToBar` | swift-implementer | 0.5 days |
| UI-019 | Android molecules 3/12 — weather badges & pills: `WeatherPill`, `TemperatureBadge`, `RainBadge`, `WindBadge`, `WeatherOverlay`, `WeatherGauge`, `WeatherPillsRow` | kotlin-implementer | 1 day |
| UI-020 | iOS molecules 3/12 — weather badges & pills: `ThemeWeatherPill`, `ThemeTemperatureBadge`, `ThemeRainBadge`, `ThemeWindBadge`, `WeatherOverlay`, `ThemeWeatherGauge`, `ThemeWeatherPillsRow` | swift-implementer | 1 day |
| UI-021 | Android molecules 4/12 — route cards (all): `RouteThumbnail`, `RouteBadge`, `RouteOptionCard` (ui), `RouteOptionCard` (planning), `SessionCard`, `SavedRouteCard`, `FavoriteRoadCard`, `RouteAttachmentCard` (ui), `RouteAttachmentCard` (chat), `RouteLegTimeline`, `RoutePin`, `WaypointCard` | kotlin-implementer | 1.5 days |
| UI-022 | iOS molecules 4/12 — route cards (all): `ThemeRouteThumbnail`, `RouteBadge`, `ThemeRouteOptionCard` (x2), `ThemeSessionCard`, `ThemeSavedRouteCard`, `ThemeFavoriteRoadCard`, `ThemeRouteAttachmentCard` (x2), `ThemeRouteLegTimeline`, `RoutePin`, `ThemeWaypointCard` | swift-implementer | 1.5 days |
| UI-023 | Android molecules 5/12 — planning inputs & summaries: `DepartureTimeSelector`, `DateRangePicker`, `ScenicBiasSegmented`, `PlanningProgressIndicator`, `SuggestionChips`, `PreferencesRow`, `PlanningStatusTab`, `RainTimingSummary`, `SegmentDetailView`, `TempRangeSummary`, `WeatherStrip`, `EnrichmentStatusIndicator` | kotlin-implementer | 1.5 days |
| UI-024 | iOS molecules 5/12 — planning inputs & summaries: `ThemeDepartureTimeSelector`, `ThemeDateRangePicker`, `ThemeScenicBiasSegmented`, `ThemePlanningProgressIndicator`, `SuggestionChips`, `ThemePreferencesRow`, `ThemePlanningStatusTab`, `ThemeRainTimingSummary`, `ThemeSegmentDetailView`, `ThemeTempRangeSummary`, `ThemeWeatherStrip`, `ThemeEnrichmentStatusIndicator` | swift-implementer | 1.5 days |
| UI-025 | Android molecules 6/12 — map overlay UI: `MapHeaderOverlay`, `MapControls`, `MapPlanningIndicator`, `MinimalOverlayWidget`, `MinimalOverlayWidgetPreview`, `OverlayToggle`, `PlanFAB`, `SearchResultMarker`, `WaypointMarker` | kotlin-implementer | 1 day |
| UI-026 | iOS molecules 6/12 — map overlay UI: `ThemeMapHeaderOverlay`, `MapControls`, `ThemeMapPlanningIndicator`, `ThemeMinimalOverlayWidget`, `ThemeMinimalOverlayWidgetPreview`, `ThemeOverlayToggle`, `ThemePlanFAB`, `SearchResultMarker`, `WaypointMarker` | swift-implementer | 1 day |
| UI-027 | Android molecules 7/12 — discovery: `DiscoveryFilterBar`, `DiscoverySortToggle`, `DiscoveryEmptyOverlay`, `DiscoveryLoadingOverlay`, `IntentSummaryPill`, `StateListItem` | kotlin-implementer | 0.5 days |
| UI-028 | iOS molecules 7/12 — discovery: `DiscoveryFilterBar`, `DiscoverySortToggle`, `DiscoveryEmptyOverlay`, `DiscoveryLoadingOverlay`, `IntentSummaryPill`, `StateListItem` | swift-implementer | 0.5 days |
| UI-029 | Android molecules 8/12 — chat cards & inline blocks: `ErrorMessage`, `RoutingCard`, `ReasoningCard`, `ThinkingCard`, `LocationSearchCard`, `PlanningCard`, `RouteMiniMap` | kotlin-implementer | 0.5 days |
| UI-030 | iOS molecules 8/12 — chat cards & inline blocks: `ThemeErrorMessage`, `RoutingCard`, `ReasoningCard`, `ThinkingCard`, `LocationSearchCard`, `PlanningCard`, `RouteMiniMap` | swift-implementer | 0.5 days |
| UI-031 | Android molecules 9/12 — dialogs, banners & context menus: `DeleteRouteDialog`, `RenameRouteDialog`, `DeleteFavoriteDialog`, `SaveFavoriteSheet`, `FavoriteExclusionAlert`, `SessionContextMenu`, `NewSessionButton`, `ConnectionBanner`, `PermissionNotification`, `FavoritesInfoSheet`, `PlanningErrorSheet`, `PlanningLoading`, `TogglesContainer`, `SaveRouteConfirmationSheet` | kotlin-implementer | 1.5 days |
| UI-032 | iOS molecules 9/12 — dialogs, banners & context menus: `ThemeDeleteRouteDialog`, `ThemeRenameRouteDialog`, `DeleteFavoriteDialog`, `SaveFavoriteSheet`, `FavoriteExclusionAlert`, `ThemeSessionContextMenu`, `ThemeNewSessionButton`, `ThemeConnectionBanner`, `ThemePermissionNotification`, `ThemeFavoritesInfoSheet`, `ThemePlanningErrorSheet`, `ThemePlanningLoading`, `ThemeTogglesContainer`, `SaveRouteConfirmationSheet` | swift-implementer | 1.5 days |
| UI-033 | Android molecules 10/12 — skeletons & progress affordances: `CardSkeleton`, `LabelSkeleton`, `SkeletonWrapper`, `WeatherBadgeSkeleton`, `DownloadProgressIndicator` (offline), `DownloadProgressIndicator` (model), `DownloadProgressBanner` | kotlin-implementer | 0.5 days |
| UI-034 | iOS molecules 10/12 — skeletons & progress affordances: `CardSkeleton`, `LabelSkeleton`, `SkeletonWrapper`, `WeatherBadgeSkeleton`, `DownloadProgressIndicator` (x2), `DownloadProgressBanner` | swift-implementer | 0.5 days |
| UI-035 | Android molecules 11/12 — auth & onboarding molecules: `AuthCard`, `TopographicBackground`, `DownloadErrorSheet`, `WifiRequiredSheet` | kotlin-implementer | 0.5 days |
| UI-036 | iOS molecules 11/12 — auth & onboarding molecules: `ThemeAuthCard`, `ThemeTopographicBackground`, `DownloadErrorSheet`, `WifiRequiredSheet` | swift-implementer | 0.5 days |
| UI-037 | Android molecules 12/12 — offline, toasts, enrichment reveals: `RegionListItem`, `RegionNameBottomSheet`, `RenameRegionBottomSheet`, `DeleteConfirmationDialog`, `ErrorToast`, `SuccessToast`, `InfoToast`, `WarningToast`, `CreativeLabelFadeIn`, `HighlightTagsStagger`, `ProgressiveEnhancementToast`, `RationaleReveal`, `EnrichmentStatusBadge` | kotlin-implementer | 1 day |
| UI-038 | iOS molecules 12/12 — offline, toasts, enrichment reveals: same component list (iOS naming) | swift-implementer | 1 day |

### Phase D — Organisms (24 components, 7 subsets)

Organisms depend on molecules from Phase C. Each subset can run in parallel per platform once its molecule prerequisites are complete.

| ID | Title | Agent | Estimate |
|----|-------|-------|----------|
| UI-039 | Android organisms 1/7 — chat composition: `ChatInput`, `ChatTranscript` | kotlin-implementer | 1 day |
| UI-040 | iOS organisms 1/7 — chat composition: `ChatInput`, `ChatTranscript` | swift-implementer | 1 day |
| UI-041 | Android organisms 2/7 — route detail sheets: `RouteDetailsSheet`, `RouteTimeline`, `RouteDirectionsSheet`, `RouteOptionsSheet`, `PlanRideSheet`, `RouteDetailsSkeleton` | kotlin-implementer | 1.5 days |
| UI-042 | iOS organisms 2/7 — route detail sheets: `ThemeRouteDetailsSheet`, `ThemeRouteTimeline`, `RouteDirectionsSheet`, `RouteOptionsSheet`, `PlanRideSheet`, `RouteDetailsSkeleton` | swift-implementer | 1.5 days |
| UI-043 | Android organisms 3/7 — navigation & menus: `DrawerMenu` (ui), `DrawerMenu` (ui/menus), `SessionSidebar` | kotlin-implementer | 1 day |
| UI-044 | iOS organisms 3/7 — navigation & menus: `ThemeDrawerMenu` (both variants), `SessionSidebar` | swift-implementer | 1 day |
| UI-045 | Android organisms 4/7 — map wrappers & toast stack (Google Maps SDK): `MapViewWrapper`, `MapboxMapView`, `MapToastStack` | kotlin-implementer | 1 day |
| UI-046 | iOS organisms 4/7 — map wrappers & toast stack (Mapbox iOS via `UIViewRepresentable`): `MapViewWrapper`, `MapboxMapView`, `MapToastStack` | swift-implementer | 1 day |
| UI-047 | Android organisms 5/7 — discovery & search sheets: `IntentSearchSheet`, `StateFilterSheet` | kotlin-implementer | 0.5 days |
| UI-048 | iOS organisms 5/7 — discovery & search sheets: `IntentSearchSheet`, `StateFilterSheet` | swift-implementer | 0.5 days |
| UI-049 | Android organisms 6/7 — enrichment & waypoint composition: `EnrichedRouteCard`, `EnrichmentProgressProvider`, `WaypointList` | kotlin-implementer | 1 day |
| UI-050 | iOS organisms 6/7 — enrichment & waypoint composition: `ThemeEnrichedRouteCard`, `EnrichmentProgressProvider`, `ThemeWaypointList` | swift-implementer | 1 day |
| UI-051 | Android organisms 7/7 — planning, voice, settings, dev organisms: `PlanningBottomSheet`, `ModelManagerSection`, `VoiceAssistantOverlay`, `DevMenu`, `FavoriteRoadsSection` | kotlin-implementer | 1 day |
| UI-052 | iOS organisms 7/7 — planning, voice, settings, dev organisms: same component list (iOS naming) | swift-implementer | 1 day |

### Phase E — Templates (11 components, 2 subsets)

Templates depend on organisms. Each subset runs in parallel per platform.

| ID | Title | Agent | Estimate |
|----|-------|-------|----------|
| UI-053 | Android templates 1/2 — layout shells: `BaseViewLayout`, `SubpageLayout`, `MenuLayout`, `TeacherSimpleViewLayout`, `TeacherTabViewLayout`, `AuthScreenLayout` | kotlin-implementer | 1 day |
| UI-054 | iOS templates 1/2 — layout shells: `BaseViewLayout`, `SubpageLayout`, `MenuLayout`, `TeacherSimpleViewLayout`, `TeacherTabViewLayout`, `ThemeAuthScreenLayout` | swift-implementer | 1 day |
| UI-055 | Android templates 2/2 — infra wrappers: `BottomSheetWrapper`, `BottomActionSheet`, `ErrorBoundary`, `ModelGatekeeperProvider`, `ButtonUsage` | kotlin-implementer | 0.5 days |
| UI-056 | iOS templates 2/2 — infra wrappers: `BottomSheetWrapper`, `BottomActionSheet`, `ThemeErrorBoundary`, `ModelGatekeeperProvider`, `ButtonUsage` | swift-implementer | 0.5 days |

### Phase F — Screens (10 components, 2 subsets)

Screens depend on templates + organisms. Final composition layer.

| ID | Title | Agent | Estimate |
|----|-------|-------|----------|
| UI-057 | Android screens 1/2 — onboarding & setup: `WelcomeScreen`, `CompletionScreen`, `DownloadProgressScreen`, `SetupRequiredScreen`, `ModelDownloadScreen` | kotlin-implementer | 1 day |
| UI-058 | iOS screens 1/2 — onboarding & setup: same component list (iOS naming) | swift-implementer | 1 day |
| UI-059 | Android screens 2/2 — route flow screens: `RouteDiscoveryScreen`, `RouteComparisonView`, `RouteOptionsScreen`, `SavedRoutesScreen` | kotlin-implementer | 1.5 days |
| UI-060 | iOS screens 2/2 — route flow screens: same component list (iOS naming) | swift-implementer | 1.5 days |

### Phase G — Fidelity Verification

Runs after each platform has completed its full translation path and all sandbox scenarios are wired up.

| ID | Title | Agent | Estimate |
|----|-------|-------|----------|
| UI-061 | Define phase-1 fidelity scenario set (atom subset 1, molecule subsets 1+3+4, organism subset 2, template subset 1, onboarding screen) + screenshot capture protocol | frontend-designer | 0.5 days |
| UI-062 | Android phase-1 fidelity capture: run screenshot harness on all scenarios in UI-061 set, compare against RN baseline, file variance report | kotlin-reviewer | 0.5 days |
| UI-063 | iOS phase-1 fidelity capture: run screenshot harness on all scenarios in UI-061 set, compare against RN baseline, file variance report | swift-reviewer | 0.5 days |

## Phase-1 Fidelity Scenario Set (UI-061)

UI-062 and UI-063 must run the same deterministic phase-1 fidelity slice. Every selected scenario is fixture-backed, captured in light and dark unless noted otherwise, and labeled with its RN reference path.

### Scenario IDs

| Scenario ID | Slice | RN reference | Fixture key | Themes | Capture notes |
|---|---|---|---|---|---|
| `tokens.colors.default` | Atom subset 1 | `react-native/stories/tokens/Colors.stories.tsx#Default` | `token-colors-v1` | light and dark | Token palette board only; no scrolling |
| `tokens.typography.default` | Atom subset 1 | `react-native/stories/tokens/Typography.stories.tsx#Default` | `token-typography-v1` | light and dark | Full type ramp in fixed-width frame |
| `atoms.icon-symbol.common-icons` | Atom subset 1 | `react-native/stories/components/IconSymbol.stories.tsx#CommonIcons` | `icon-common-v1` | light and dark | Use default symbol grid ordering |
| `atoms.separator.in-list` | Atom subset 1 | `react-native/stories/components/Separator.stories.tsx#InList` | `separator-list-v1` | light and dark | Three-row list fixture with stable copy |
| `atoms.drag-handle.in-context` | Atom subset 1 | `react-native/stories/components/DragHandle.stories.tsx#InContext` | `drag-handle-sheet-v1` | light and dark | Centered in bottom-sheet chrome fixture |
| `molecules.layout.app-header.with-both-icons` | Molecule subset 1 | `react-native/stories/components/AppHeader.stories.tsx#WithBothIcons` | `app-header-dual-actions-v1` | light and dark | Header title, leading icon, trailing icon fixed |
| `molecules.layout.section-header.complete` | Molecule subset 1 | `react-native/stories/components/SectionHeader.stories.tsx#Complete` | `section-header-complete-v1` | light and dark | Title, subtitle, action button fixed |
| `molecules.layout.bottom-navigation.saved-active` | Molecule subset 1 | `react-native/stories/components/BottomNavigation.stories.tsx#SavedActive` | `bottom-nav-saved-v1` | light and dark | Selected tab must remain `Saved` |
| `molecules.layout.banner.with-actions` | Molecule subset 1 | `react-native/stories/components/Banner.stories.tsx#WithActions` | `banner-actions-v1` | light and dark | Two action labels, no dismiss animation |
| `molecules.weather.weather-pill.multiple` | Molecule subset 3 | `react-native/stories/components/WeatherPill.stories.tsx#Multiple` | `weather-pill-multi-v1` | light and dark | Render the full row fixture, no overflow wrapping |
| `molecules.weather.temperature-badge.all-states` | Molecule subset 3 | `react-native/stories/components/TemperatureBadge.stories.tsx#AllStates` | `temperature-badge-all-v1` | light and dark | All temperature states in one board |
| `molecules.weather.rain-badge.all-states` | Molecule subset 3 | `react-native/stories/components/RainBadge.stories.tsx#AllStates` | `rain-badge-all-v1` | light and dark | All rain states in one board |
| `molecules.weather.weather-gauge.all-metrics` | Molecule subset 3 | `react-native/stories/map/WeatherGauge.stories.tsx#AllMetrics` | `weather-gauge-all-metrics-v1` | light and dark | Wind, rain, and temperature all present |
| `molecules.route.route-thumbnail.default` | Molecule subset 4 | `react-native/stories/components/RouteThumbnail.stories.tsx#Default` | `route-thumbnail-default-v1` | light and dark | Use the default bounds and rotation from story |
| `molecules.route.route-badge.with-icon` | Molecule subset 4 | `react-native/stories/components/RouteBadge.stories.tsx#WithIcon` | `route-badge-icon-v1` | light and dark | Icon and label stay fixed |
| `molecules.route.route-option-card.with-heavy-rain` | Molecule subset 4 | `react-native/stories/components/RouteOptionCard.stories.tsx#WithHeavyRain` | `route-option-heavy-rain-v1` | light and dark | Preserve selected-state styling from story fixture |
| `molecules.route.session-card.many-routes` | Molecule subset 4 | `react-native/stories/components/SessionCard.stories.tsx#ManyRoutes` | `session-card-many-routes-v1` | light and dark | Use multi-route session fixture unchanged |
| `molecules.route.saved-route-card.long-route` | Molecule subset 4 | `react-native/stories/components/SavedRouteCard.stories.tsx#LongRoute` | `saved-route-long-v1` | light and dark | Long metadata strings must not wrap differently |
| `molecules.route.route-attachment-card.compact-selected` | Molecule subset 4 | `react-native/stories/components/RouteAttachmentCard.stories.tsx#CompactSelected` | `route-attachment-compact-selected-v1` | light and dark | Compact card with selected state locked on |
| `organisms.route-details.high-wind-route` | Organism subset 2 | `react-native/stories/sheets/RouteDetailsSheet.stories.tsx#HighWindRoute` | `route-details-high-wind-v1` | light and dark | Capture sheet body at rest, no drag interaction |
| `templates.layout.base-view-layout.default-shell` | Template subset 1 | `react-native/components/layouts/base-view-layout.tsx` | `base-view-layout-shell-v1` | light and dark | Source-backed baseline; no RN Storybook export exists |
| `templates.layout.teacher-simple-view-layout.default-shell` | Template subset 1 | `react-native/components/layouts/teacher-simple-view-layout.tsx` | `teacher-simple-layout-shell-v1` | light and dark | Source-backed baseline; static title and content blocks |
| `templates.layout.auth-screen-layout.default-shell` | Template subset 1 | `react-native/components/auth/auth-screen-layout.tsx` | `auth-screen-layout-shell-v1` | light and dark | Source-backed baseline with fixed auth-card placeholder |
| `screens.onboarding.welcome.default` | Onboarding screen | `react-native/components/onboarding/welcome-screen.tsx` | `welcome-screen-default-v1` | light and dark | Source-backed baseline; downloading state must be off |

### Deterministic capture protocol

- Use deterministic fixtures only. No auth, backend, geolocation, network, timers, or random data.
- Freeze locale to `en-US`, calendar to Gregorian, timezone to `America/Denver`, and text scale to the platform default.
- Disable live animations before capture. Motion tokens may define the intended durations, but screenshots capture the resting state only.
- Use light and dark capture for every scenario above. A waiver is allowed only if the scenario is monochrome and the waiver is documented in the variance report.
- For atoms, molecules, and organisms, capture the component bounds inside a fixed review frame with 24pt outer padding and no scroll offset.
- For templates and screens, capture the full portrait phone frame with safe areas visible.

### Device and simulator assumptions

- React Native baseline: Storybook scenario rendered in portrait review frame with the same fixture payload and theme as native capture.
- Android native capture: Pixel 9 emulator, portrait, default font scale, deterministic seed data.
- iOS native capture: iPhone 16 simulator, portrait, default Dynamic Type, deterministic seed data.
- For map-backed fixtures, camera position, zoom, and route geometry must be hard-coded by fixture key before capture begins.

### Output naming and report shape

- Screenshot file naming: `phase1/{platform}/{scenario_id}--{theme}--{device_key}.png`
- Variance report naming: `phase1/{platform}/variance-report.md`
- UI-062 and UI-063 must emit one variance report section per scenario ID, in the same order as the table above.
- Every report entry must include: scenario ID, RN reference, fixture key, theme, screenshot paths, verdict, and remediation note if failed.

### Failure rules

- Token mismatches are failures. This includes incorrect semantic colors, spacing, radius, typography, elevation, motion labels, or opacity usage relative to the fixture.
- Layout shifts are failures. This includes different bounds, clipping, wrapping, misalignment, or safe-area handling against the RN baseline.
- Missing states are failures. If a fixture expects a selected, active, compact, or warning state and the native capture omits it, the scenario fails.
- Accessibility regressions are failures. This includes contrast loss, touch-target regressions, missing labels in the sandbox metadata, or Dynamic Type breakage visible in capture.
- Cosmetic anti-aliasing differences may be noted, but they are not failures unless they obscure token consumption or visual parity.

### Phase H — Delta Compositions from UC Audit (22 tasks, 11 compositions × dual platform)

Added 2026-04-17 via delta-replan. These are net-new compositions flagged by the per-UC audit across files `09-` through `16-`. They are not in the original 195-component RN catalog; each must be built token-accurately on both platforms before its consuming sprint (3–9) begins.

See `../../NEW-COMPOSITIONS-FOR-SPRINT-2-DELTA.md` for the full audit report, Tier A/B/C classification, and consuming-UC map.

Dependencies: each delta task depends on the relevant existing Phase B/C/D/E subset (e.g., Phase C molecules for molecule-level deltas). Runs in parallel within platform.

| ID | Title | Agent | Estimate |
|----|-------|-------|----------|
| UI-064 | Android delta atom — `VoiceListeningVisualizer` (audio amplitude waveform atom for UC-VOICE-02); Compose custom Canvas + animateFloat | kotlin-implementer | 0.5 days |
| UI-065 | iOS delta atom — `VoiceListeningVisualizer` (audio amplitude waveform atom for UC-VOICE-02); SwiftUI Canvas + TimelineView | swift-implementer | 0.5 days |
| UI-066 | Android delta molecule — `Speedometer` (radial speed gauge with speed-limit color states for UC-NAV-04); Compose Canvas with arc path | kotlin-implementer | 1 day |
| UI-067 | iOS delta molecule — `Speedometer` (radial speed gauge for UC-NAV-04); SwiftUI Gauge or custom Canvas | swift-implementer | 1 day |
| UI-068 | Android delta molecule — `TurnInstructionCard` (maneuver icon + street + distance + lane guidance for UC-NAV-02 + UC-FLOW-06); consumes `StatRow`, `IconSymbol`, `WeatherPill` | kotlin-implementer | 1 day |
| UI-069 | iOS delta molecule — `TurnInstructionCard` (same contract for UC-NAV-02 + UC-FLOW-06) | swift-implementer | 1 day |
| UI-070 | Android delta molecule — `BoundingBoxOverlay` (interactive region-selection polygon on map for UC-OFFL-02); Google Maps SDK polygon overlay + touch handlers | kotlin-implementer | 1 day |
| UI-071 | iOS delta molecule — `BoundingBoxOverlay` (region-selection overlay for UC-OFFL-02); MapKit/Mapbox polygon + gesture recognizer | swift-implementer | 1 day |
| UI-072 | Android delta molecule — `RegionBoundsPreview` (static region thumbnail for UC-OFFL-01); Mapbox Snapshotter | kotlin-implementer | 0.5 days |
| UI-073 | iOS delta molecule — `RegionBoundsPreview` (region thumbnail for UC-OFFL-01); Mapbox snapshot API | swift-implementer | 0.5 days |
| UI-074 | Android delta molecule — `PlatformNotificationTemplate` (cross-platform OS notification template for UC-NAV-07 + UC-OFFL-09); Android foreground service notification builder + variants | kotlin-implementer | 1 day |
| UI-075 | iOS delta molecule — `PlatformNotificationTemplate` (iOS local notification template for UC-NAV-07 + UC-OFFL-09); UNMutableNotificationContent + variants | swift-implementer | 1 day |
| UI-076 | Android delta organism — `ElevationProfileChart` (native chart with grade-colored segments + crosshair for UC-COMP-04); Vico chart library + custom marker | kotlin-implementer | 1.5 days |
| UI-077 | iOS delta organism — `ElevationProfileChart` (same contract for UC-COMP-04); Swift Charts + custom annotation | swift-implementer | 1.5 days |
| UI-078 | Android delta organism — `CompletionSummaryCard` (post-ride summary hero with metrics + curvature highlight + polyline preview + save/discard CTAs for UC-REC-05 + UC-NAV-06 + UC-FLOW-08); consumes `Card`, `StatRow`, `RouteThumbnail`, `Button` | kotlin-implementer | 1 day |
| UI-079 | iOS delta organism — `CompletionSummaryCard` (same contract) | swift-implementer | 1 day |
| UI-080 | Android delta organism — `RideShareSheet` (share sheet with GPX/link/summary variants for UC-REC-06); consumes `BottomSheetWrapper`, `ToggleGroup`, `Button` | kotlin-implementer | 1 day |
| UI-081 | iOS delta organism — `RideShareSheet` (same contract for UC-REC-06) | swift-implementer | 1 day |
| UI-082 | Android delta organism — `GatekeeperUpgradePrompt` (paywall modal with tier cards + benefits + CTAs + offline variant for UC-GATE-03 + UC-GATE-08); consumes `BottomSheetWrapper`, `Card`, `Badge`, `Button` | kotlin-implementer | 1 day |
| UI-083 | iOS delta organism — `GatekeeperUpgradePrompt` (same contract for UC-GATE-03 + UC-GATE-08) | swift-implementer | 1 day |
| UI-084 | Android delta screen — `RideCompletionScreen` (full completion flow composing `CompletionSummaryCard` + `RideShareSheet` for UC-NAV-06 + UC-FLOW-08) | kotlin-implementer | 1 day |
| UI-085 | iOS delta screen — `RideCompletionScreen` (same contract) | swift-implementer | 1 day |

**Out of scope for this delta (documented in `NEW-COMPOSITIONS-FOR-SPRINT-2-DELTA.md`):**
- Tier B compositional patterns (16 items — expressible with existing 08a components; documented inline in consuming UC files)
- Tier C state infrastructure (4 templates — belong to state-architecture doc, not UI catalog)

---

## Parallelism & Build Order

Within a platform, execution flow is:

```
Phase A (UI-001, UI-002) → Phase A (UI-003 | UI-004)
        ↓
Phase B atoms (5 subsets — serial within platform, parallel across platforms)
        ↓
Phase C molecules (12 subsets — parallel within platform once atoms complete)
        ↓
Phase D organisms (7 subsets — parallel within platform once molecules complete)
        ↓
Phase E templates (2 subsets — parallel)
        ↓
Phase F screens (2 subsets — parallel)
        ↓
Phase G fidelity verification
```

Every Android task has a dual iOS task in the same subset. They MUST stay name-parity aligned per `08d-component-parity-spec.md` — same PascalCase component names, same prop/param signatures, identical semantic token consumption.

## Completion Criteria (per task)

Each task is complete when:
- [ ] Every listed RN component has an identically-named Compose (Android) or SwiftUI (iOS) equivalent in the appropriate `atoms/`, `molecules/`, `organisms/`, `templates/`, or `screens/` directory
- [ ] Each component consumes ONLY shared semantic tokens (no hardcoded colors, spacing, radii, elevations)
- [ ] Each component has at least one sandbox scenario browsable in the platform's sandbox mode, labeled with its RN reference path
- [ ] All interactive states (default, pressed, disabled, loading, error) are represented in sandbox scenarios
- [ ] Light and dark mode render correctly for every scenario
- [ ] The task's component files are committed with the test IDs from `08d-component-parity-spec.md` attached

## Sprint Definition of Done

- All 63 tasks marked complete
- Android and iOS sandbox modes expose the full catalog hierarchy (atoms → molecules → organisms → templates → screens)
- Phase-1 fidelity screenshot set captured on all three platforms with variance report published
- No regressions in React Native Storybook — RN remains the baseline reference
