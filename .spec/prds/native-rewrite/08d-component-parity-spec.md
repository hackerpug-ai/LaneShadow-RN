---
stability: CONSTITUTION
last_validated: 2026-04-16
prd_version: 1.0.0
functional_group: DESIGN
---

# Cross-Platform Component Parity Specification

## Overview

This document guarantees UX fidelity between the React Native app and both native implementations. Every RN component maps to identically-named, identically-behaved components on Android (Kotlin/Compose) and iOS (Swift/SwiftUI).

**Supporting documents:**
- [08a-atomic-component-catalog.md](./08a-atomic-component-catalog.md) — Full RN component inventory with atomic classification
- [08b-android-component-map.md](./08b-android-component-map.md) — Android Compose architecture with composable signatures
- [08c-ios-component-map.md](./08c-ios-component-map.md) — iOS SwiftUI architecture with View signatures

---

## Naming Convention (Both Platforms)

| Rule | Convention | Example |
|------|-----------|---------|
| Component names | PascalCase, identical on both platforms | `ThemeButton`, `RouteCard`, `WeatherStrip` |
| Props/params | CamelCase | `variant`, `onSave`, `isDisabled` |
| Variant enums | PascalCase | `ButtonVariant.Primary`, `CardElevation.Level2` |
| Callbacks | Platform-idiomatic | Android: `(id: String) -> Unit` / iOS: `(String) -> Void` |
| Files | One component per file, named after component | `ThemeButton.kt` / `ThemeButton.swift` |
| Directories | Mirror atomic level | `atoms/`, `molecules/`, `organisms/`, `templates/`, `screens/` |

---

## Token Contract

All three UI stacks consume the same semantic token names from the canonical JSON source at `tokens/semantic/semantic.tokens.json`.

- **Canonical source**: `tokens/semantic/semantic.tokens.json`
- **Native bundle sync**: `pnpm tokens:sync` mirrors that file into the Swift and Kotlin package resource paths defined in `tokens/sync.config.json`
- **Runtime delivery**:
  - React Native loads canonical JSON through `tokens/platforms/typescript`
  - Swift loads bundled JSON through `tokens/platforms/swift/Sources/LaneShadowTheme/ThemeLoader.swift`
  - Kotlin loads bundled JSON through `tokens/platforms/kotlin/src/main/kotlin/com/laneshadow/theme/ThemeLoader.kt`
- **Shared primitives**: `../native-theme` provides the cross-platform `ColorSet`, typography, elevation, and color parsing primitives
- **Token consumption rule**: component code must reference semantic token accessors only; hardcoded colors, spacing, radii, elevations, or platform-only renames are forbidden
- **Drift gates**: `pnpm tokens:validate` validates schema integrity, `pnpm tokens:sync-check` verifies bundled copies are current. Legacy references to `validate:tokens` or Style Dictionary codegen are historical only and are not the locked Sprint 2 contract.

---

## Component Parity Matrix

### Atoms (60 components)

| RN Component | Android (Compose) | iOS (SwiftUI) | Props Contract |
|-------------|-------------------|---------------|----------------|
| Button | ThemeButton | ThemeButton | variant: Primary/Secondary/Tertiary/Danger, size: Sm/Md/Lg, icon?, loading, disabled |
| Badge | ThemeBadge | ThemeBadge | variant: Default/Success/Warning/Danger/Info, icon? |
| Chip | ThemeChip | ThemeChip | label, icon?, selected, onPress |
| Input | ThemeInput | ThemeInput | label, error?, leftIcon?, rightIcon?, editable, onFocus, onBlur |
| Switch | ThemeSwitch | ThemeSwitch | value, onValueChange, disabled |
| Checkbox | ThemeCheckbox | ThemeCheckbox | checked, onCheckedChange, disabled, indeterminate |
| Toggle | ThemeToggle | ThemeToggle | pressed, onPressedChange, variant, size, icon? |
| Separator | ThemeSeparator | ThemeSeparator | orientation: Horizontal/Vertical |
| Skeleton | ThemeSkeleton | ThemeSkeleton | width, height, shape: Rect/Circle/Text |
| Slider | ThemeSlider | ThemeSlider | value, onValueChange, min, max, step |
| Progress | ThemeProgress | ThemeProgress | value, max, indeterminate |
| Avatar | ThemeAvatar | ThemeAvatar | source?, initials?, size: Sm/Md/Lg, showRing |
| IconSymbol | ThemeIcon | ThemeIcon | name, size, color |
| ThemedText | ThemeText | ThemeText | variant: Label/Body/Title/Heading/Display × Sm/Md/Lg, color? |
| ThemedView | ThemeSurface | ThemeSurface | variant: Default/Elevated/Sunken |
| FAB | ThemeFAB | ThemeFAB | icon, label?, onPress, visible |
| StatRow | StatRow | StatRow | icon, value, iconSize |
| WeatherPill | WeatherPill | WeatherPill | icon, description, backgroundColor, textColor |
| RouteBadge | RouteBadge | RouteBadge | variant: Default/Scenic/Popular/New, icon? |
| RainBadge | RainBadge | RainBadge | level: None/Light/Moderate/Heavy |
| TemperatureBadge | TemperatureBadge | TemperatureBadge | summary, value |
| WindBadge | WindBadge | WindBadge | level: Calm/Light/Moderate/Strong |
| DragHandle | DragHandle | DragHandle | — |
| SectionHeader | SectionHeader | SectionHeader | title, action? |
| OverlayPill | OverlayPill | OverlayPill | visible, text, onDismiss |
| Banner | ThemeBanner | ThemeBanner | variant, title, description, action?, onDismiss? |
| EmptyState | EmptyState | EmptyState | icon, headline, body, ctaLabel?, onCtaPress? |
| MarkdownText | MarkdownText | MarkdownText | content |
| Collapsible | ThemeCollapsible | ThemeCollapsible | open, onOpenChange |
| DateRangePicker | DateRangePicker | DateRangePicker | value, onChange |
| SearchBar | SearchBar | SearchBar | value, onChange, placeholder, onClear |
| Skeleton loaders | SkeletonWrapper, CardSkeleton, etc. | ThemeSkeleton variants | type: Card/Label/Details/Weather |

### Molecules (50 components)

| RN Component | Android (Compose) | iOS (SwiftUI) | Props Contract |
|-------------|-------------------|---------------|----------------|
| Card | ThemeCard | ThemeCard | elevation: 0-5, radius: Sm/Md/Lg, onPress? |
| RouteOptionCard | RouteOptionCard | RouteOptionCard | route, selected, onSelect |
| RouteThumbnail | RouteThumbnail | RouteThumbnail | bounds, rotation |
| RouteLegTimeline | RouteLegTimeline | RouteLegTimeline | legs |
| SavedRouteCard | SavedRouteCard | SavedRouteCard | route, onSave, onShare, onDelete |
| FavoriteRoadCard | FavoriteRoadCard | FavoriteRoadCard | road, onRemove |
| SessionCard | SessionCard | SessionCard | session, onPress, onLongPress |
| ChatInput | ChatInput | ChatInput | onSend, placeholder, attachment? |
| TypingIndicator | TypingIndicator | TypingIndicator | visible |
| PlanningProgressIndicator | PlanningProgressIndicator | PlanningProgressIndicator | status, progress |
| ScenicBiasSegmented | ScenicBiasSegmented | ScenicBiasSegmented | value, onChange |
| DepartureTimeSelector | DepartureTimeSelector | DepartureTimeSelector | value, onChange |
| ConnectionBanner | ConnectionBanner | ConnectionBanner | visible, onRetry |
| FloatingSearchInput | FloatingSearchInput | FloatingSearchInput | value, onChange, placeholder |
| RouteAttachmentCard | RouteAttachmentCard | RouteAttachmentCard | route, onRemove |
| ToggleGroup | ToggleGroup | ToggleGroup | options, selected, onSelectionChange |
| SuggestionChips | SuggestionChips | SuggestionChips | suggestions, onSelect |
| WeatherStrip | WeatherStrip | WeatherStrip | forecasts |
| IntentSummaryPill | IntentSummaryPill | IntentSummaryPill | intent, onRemove |
| DownloadProgressIndicator | DownloadProgressIndicator | DownloadProgressIndicator | progress, status |

### Organisms (45 components)

| RN Component | Android (Compose) | iOS (SwiftUI) | Props Contract |
|-------------|-------------------|---------------|----------------|
| MapView | MapView | MapView | routes, cameraPosition, overlays, onRegionChange |
| MapboxMapView | MapboxMapView | MapboxMapView | style, annotations, gestures |
| RoutePolyline | RoutePolyline | RoutePolyline | coordinates, color, width |
| DeviationPolyline | DeviationPolyline | DeviationPolyline | original, detour, reconnect |
| WaypointMarker | WaypointMarker | WaypointMarker | waypoint, status |
| SearchResultMarker | SearchResultMarker | SearchResultMarker | result, onSelect |
| WeatherOverlay | WeatherOverlay | WeatherOverlay | forecasts, visible |
| MapControls | MapControls | MapControls | onLocate, onZoomIn, onZoomOut, onCompass |
| RouteDiscoveryScreen | RouteDiscoveryView | RouteDiscoveryView | routes, onRouteSelect, filters |
| DiscoveryFilterBar | DiscoveryFilterBar | DiscoveryFilterBar | filters, onChange |
| RoutePin | RoutePin | RoutePin | route, onPress |
| EnrichedRouteCard | EnrichedRouteCard | EnrichedRouteCard | route, enrichmentData |
| ChatTranscript | ChatTranscript | ChatTranscript | messages, onRouteSelect |
| PlanningCard | PlanningCard | PlanningCard | plan, onAccept, onReject |
| ReasoningCard | ReasoningCard | ReasoningCard | reasoning |
| ThinkingCard | ThinkingCard | ThinkingCard | visible |
| RouteMiniMap | RouteMiniMap | RouteMiniMap | route |
| VoiceAssistantOverlay | VoiceAssistantOverlay | VoiceAssistantOverlay | state, onActivate, onCancel |
| WaypointList | WaypointList | WaypointList | waypoints, onReorder, onDelete |
| WaypointCard | WaypointCard | WaypointCard | waypoint, onEdit, onDelete |
| RouteDetailsSheet | RouteDetailsSheet | RouteDetailsSheet | route, enrichment |
| PlanRideSheet | PlanRideSheet | PlanRideSheet | onPlan, preferences |
| PlanningBottomSheet | PlanningBottomSheet | PlanningBottomSheet | status, results |
| RouteOptionsSheet | RouteOptionsSheet | RouteOptionsSheet | routes, onSelect |
| RouteTimeline | RouteTimeline | RouteTimeline | legs |
| SaveRouteConfirmationSheet | SaveRouteConfirmationSheet | SaveRouteConfirmationSheet | route, onSave |
| RegionListItem | RegionListItem | RegionListItem | region, onDownload, onDelete |
| RegionNameBottomSheet | RegionNameBottomSheet | RegionNameBottomSheet | onSubmit |

### Templates (7 components)

| RN Component | Android (Compose) | iOS (SwiftUI) | Props Contract |
|-------------|-------------------|---------------|----------------|
| BaseViewLayout | BaseViewLayout | BaseViewLayout | header?, content, fab? |
| SubpageLayout | SubpageLayout | SubpageLayout | title, onBack, content |
| MenuLayout | MenuLayout | MenuLayout | menuItems, selected, content |
| Header | AppHeader | AppHeader | title, subtitle?, action? |
| TeacherTabBarLayout | TabBarLayout | TabBarLayout | tabs, selected, content |
| TeacherTabViewLayout | TabViewLayout | TabViewLayout | tabs, content |
| BottomSheetWrapper | BottomSheetWrapper | BottomSheetWrapper | detents, content, onDismiss |

### Screens (8 components)

| RN Component | Android (Compose) | iOS (SwiftUI) | Props Contract |
|-------------|-------------------|---------------|----------------|
| RouteDiscoveryScreen | RouteDiscoveryScreen | RouteDiscoveryScreen | Convex subscription wiring |
| RouteComparisonView | RouteComparisonScreen | RouteComparisonScreen | routes, onRouteSelect |
| RouteOptionsScreen | RouteOptionsScreen | RouteOptionsScreen | routes, onSelect |
| SavedRoutesScreen | SavedRoutesScreen | SavedRoutesScreen | saved routes list |
| WelcomeScreen | WelcomeScreen | WelcomeScreen | onGetStarted |
| CompletionScreen | OnboardingCompletionScreen | OnboardingCompletionScreen | onComplete |
| DownloadProgressScreen | DownloadProgressScreen | DownloadProgressScreen | progress |
| ModelDownloadScreen | ModelSetupScreen | ModelSetupScreen | onDownload, progress |

---

## Acceptance Criteria (Per Component)

Every component must satisfy ALL of these before the RN version can be deleted:

- [ ] **Naming parity**: Same PascalCase name on Android and iOS
- [ ] **Interface parity**: Same props/params (names, types, defaults)
- [ ] **Visual parity**: Identical appearance in light and dark mode
- [ ] **Token consumption**: Uses ONLY design tokens — zero hardcoded colors/dimensions
- [ ] **State parity**: All interactive states (default, hover, pressed, disabled, loading, error)
- [ ] **Animation parity**: Same transitions, durations, easing curves
- [ ] **Accessibility**: VoiceOver/TalkBack labels, contrast ratios, touch targets
- [ ] **Keyboard handling**: Bottom sheets with inputs avoid keyboard correctly
- [ ] **RTL support**: Layout mirrors correctly for right-to-left languages

---

## Build Order

Components must be implemented in this order (dependencies flow downward):

| Phase | Level | Count | Dependencies | Est. Hours |
|-------|-------|-------|-------------|------------|
| 1 | Design tokens (08-design-system.md) | 40+ tokens | None | 30-40h |
| 2 | Atoms | 60 | Design tokens | 80-120h |
| 3 | Molecules | 50 | Atoms | 60-100h |
| 4 | Organisms | 45 | Molecules + Atoms | 120-180h |
| 5 | Templates | 7 | Organisms | 20-30h |
| 6 | Screens | 8 | Templates + Organisms + Convex hooks | 40-60h |
| **Total** | | **170** | | **350-530h** |

---

## Verification Protocol

For each component level:

1. **Atom**: Screenshot test on both platforms, compare side-by-side with RN version
2. **Molecule**: Screenshot test + interaction test (tap, scroll, state changes)
3. **Organism**: Integration test with Convex mock data + visual regression
4. **Template**: Layout test across screen sizes (compact, regular, large)
5. **Screen**: E2E test with real Convex backend + full navigation flow

---

## Files Produced

| File | Purpose | Lines |
|------|---------|-------|
| `08a-atomic-component-catalog.md` | RN component inventory + atomic classification | 686 |
| `08b-android-component-map.md` | Android Compose architecture + composable signatures | 933 |
| `08c-ios-component-map.md` | iOS SwiftUI architecture + View signatures | 946 |
| `08d-component-parity-spec.md` | This file — cross-platform parity guarantees | — |
