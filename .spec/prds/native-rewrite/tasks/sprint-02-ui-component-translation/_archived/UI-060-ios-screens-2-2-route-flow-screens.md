# UI-060: iOS screens 2/2 — route flow screens: same component list (iOS naming)

**Task ID:** UI-060
**Sprint:** Sprint 2 - UI Component Translation and Fidelity Sandbox
**Assigned To:** swift-implementer
**Reviewer:** swift-reviewer
**Estimate:** 720 min
**Type:** [FEATURE]
**Status:** Planned
**Phase:** Screens
**Quality Score:** 115/115

---

## BACKGROUND

Sprint 2 translates the React Native baseline into native platform components and sandbox scenarios before rider-facing feature sprints resume. This task covers the `screens` slice for `iOS screens 2/2 — route flow screens: same component list (iOS naming)`.

**Objective:** Implement iOS screens 2/2 — route flow screens: same component list (iOS naming) as SwiftUI work with parity to the RN baseline, token-only styling, and sandbox coverage.

**Success State:** A reviewer can open the iOS sandbox, browse this task's scenarios, and confirm naming, interface, theme, state, accessibility, and layout parity against RN.

## CRITICAL CONSTRAINTS

### MUST
- Implement the listed components or compositions with parity-aligned naming and interfaces: same component list (iOS naming).
- Use only the LaneShadow core theme contract locked by `UI-001`: `tokens/semantic/semantic.tokens.json` as the source of truth, generated `native-theme` outputs as the shared packaging layer, and the platform theme entry points (`LaneShadowTheme` on Android, `.laneShadowTheme()` on iOS) for colors, spacing, typography, radii, elevation, and state styling.
- Register sandbox scenarios for default, interactive, and edge-case states with RN reference labels.
- Compose only existing templates, organisms, and delta components and avoid one-off screen styling.

### NEVER
- Add unrelated feature wiring or backend dependencies to satisfy sandbox rendering.
- Introduce hardcoded UI primitives or platform-only naming drift.

### STRICTLY
- Preserve light and dark parity, accessibility labels, and deterministic fixtures for every scenario.

## DELIVERABLES

- ios/LaneShadow/Views/Screens/**
- ios/LaneShadow/Sandbox/Stories/ScreensStories.swift — @MainActor enum with `static let all: [Story]`, aggregated into LaneShadowStories.all
- ios/LaneShadowTests/**
- ios/LaneShadowSnapshotTests/**

## ACCEPTANCE CRITERIA

### AC-1
**GIVEN** The RN baseline and atomic parity contract define the expected components and interfaces.
**WHEN** This task is implemented.
**THEN** The listed components or compositions exist in the correct iOS SwiftUI directories with parity-aligned names and signatures: same component list (iOS naming).
**Verify:** `printf "%s\n" "same component list (iOS naming)"`

### AC-2
**GIVEN** Sprint 2 requires token-only styling and light and dark support.
**WHEN** The task scenarios render in the sandbox.
**THEN** All visuals use the LaneShadow core theme contract from `UI-001` and render correctly in both color modes without hardcoded UI primitives.
**Verify:** `rg -n "Token consumption|light and dark" .spec/prds/native-rewrite/08d-component-parity-spec.md .spec/prds/native-rewrite/08-design-system.md`

### AC-3
**GIVEN** Every translated component must be reviewable before rider-facing wiring resumes.
**WHEN** Sandbox scenarios are registered for this task.
**THEN** Each listed component has deterministic sandbox coverage with RN reference labels and explicit state variants where applicable.
**Verify:** `rg -n "RN reference|scenario|interactive states" .spec/prds/native-rewrite/tasks/sprint-02-ui-component-translation/SPRINT.md`

### AC-4
**GIVEN** Parity includes behavior as well as visuals.
**WHEN** The task is validated against the parity spec.
**THEN** Accessibility labels, touch targets, keyboard or safe-area handling, and motion or state parity behave correctly for this component family.
**Verify:** `rg -n "Accessibility|Keyboard handling|RTL support|Animation parity|State parity" .spec/prds/native-rewrite/08d-component-parity-spec.md`

### AC-5
**GIVEN** This task composes multiple lower-level components and fixtures.
**WHEN** The platform scenario is exercised end to end in the sandbox.
**THEN** The composition renders using only previously defined platform components, deterministic fixtures, and no backend or auth dependencies.
**Verify:** `rg -n "deterministic|fixtures|no auth|no backend" .spec/prds/native-rewrite/tasks/sprint-02-ui-component-translation/SPRINT.md`

### AC-6
**GIVEN** native-sandbox is installed and a DEBUG build is running.
**WHEN** `make ios_sandbox` launches the sandbox (passes `-LaneShadowSandbox` arg to the app).
**THEN** every component listed in DELIVERABLES has at least one `Story(id: "<tier>.<component>.<state>", tier: .<tier>, component: "<Name>", name: "<State>", summary: "<rn-reference-path>") { _ in <SwiftUI usage> }` registered in `LaneShadowStories.all` and renders in the story-tree drawer under its tier, wrapped by `themedPreview { $0.laneShadowTheme() }`.

**Launch:** `make ios_sandbox` (canonical). Secondary: device shake (simulator: `xcrun simctl io booted shake`) or `xcrun simctl launch <id> com.laneshadow.app -LaneShadowSandbox`.

## TEST CRITERIA

| ID | Maps To | Boolean Statement | Verify |
|---|---|---|---|
| TC-1 | AC-1 | The listed components or compositions exist in the correct iOS SwiftUI directories with parity-aligned names and signatures: same component list (iOS naming). | `printf "%s\n" "same component list (iOS naming)"` |
| TC-2 | AC-2 | All visuals use the LaneShadow core theme contract from `UI-001` and render correctly in both color modes without hardcoded UI primitives. | `rg -n "Token consumption\|light and dark" .spec/prds/native-rewrite/08d-component-parity-spec.md .spec/prds/native-rewrite/08-design-system.md` |
| TC-3 | AC-3 | Each listed component has deterministic sandbox coverage with RN reference labels and explicit state variants where applicable. | `rg -n "RN reference\|scenario\|interactive states" .spec/prds/native-rewrite/tasks/sprint-02-ui-component-translation/SPRINT.md` |
| TC-4 | AC-4 | Accessibility labels, touch targets, keyboard or safe-area handling, and motion or state parity behave correctly for this component family. | `rg -n "Accessibility\|Keyboard handling\|RTL support\|Animation parity\|State parity" .spec/prds/native-rewrite/08d-component-parity-spec.md` |
| TC-5 | AC-5 | The composition renders using only previously defined platform components, deterministic fixtures, and no backend or auth dependencies. | `rg -n "deterministic\|fixtures\|no auth\|no backend" .spec/prds/native-rewrite/tasks/sprint-02-ui-component-translation/SPRINT.md` |
| TC-6 | ALL | Repo validation gates remain green for the touched workspace when this task is complete. | `pnpm type-check:native && swiftformat --lint ios/LaneShadow --config .swiftformat && xcodebuild -workspace ios/LaneShadow.xcworkspace -scheme LaneShadow -destination "platform=iOS Simulator,name=iPhone 16" test` |

## READING LIST

1. `.spec/prds/native-rewrite/README.md`
2. `.spec/prds/native-rewrite/tasks/sprint-02-ui-component-translation/SPRINT.md`
3. `.spec/prds/native-rewrite/08a-atomic-component-catalog.md`
4. `.spec/prds/native-rewrite/08d-component-parity-spec.md`
5. `RULES.md`
6. `.spec/prds/native-rewrite/08c-ios-component-map.md`

## GUARDRAILS

### WRITE-ALLOWED
- ios/LaneShadow/Views/Screens/**
- ios/LaneShadow/Sandbox/**
- ios/LaneShadowTests/**
- ios/LaneShadowSnapshotTests/**
- ios/LaneShadowUITests/**

### WRITE-PROHIBITED
- android/**
- server/**
- convex/**
- Any unrelated sprint folders outside .spec/prds/native-rewrite/tasks/sprint-02-ui-component-translation/**

### MUST
- Follow the parity contract in `.spec/prds/native-rewrite/08d-component-parity-spec.md`.
- Keep sandbox scenarios deterministic and labeled with RN reference paths.
- Limit changes to the component family or sandbox or reporting surface owned by this task.

### MUST NOT
- Do not add backend or auth dependencies just to render scenarios.
- Do not modify unrelated platform directories or downstream sprint artifacts.

## CODE PATTERN

**Reference:** `.spec/prds/native-rewrite/08c-ios-component-map.md`

**Pattern:** Single SwiftUI view with enum or binding-driven variants, theme environment consumption, and deterministic sandbox scenarios.

**Anti-pattern:** Default SwiftUI styling, live service dependencies, or platform-specific naming drift.

## TRANSLATION SOURCES

| Component | RN wrapper source | Framework primitives + `node_modules` paths | Native target file | Variants × sizes × states |
|---|---|---|---|---|
| RouteDiscoveryScreen | `react-native/components/discovery/route-discovery-screen.tsx` | `node_modules/react-native/Libraries/Components/View/View.js`; `node_modules/react-native-mapbox-gl/maps/mapbox/MapView.js` | `ios/LaneShadow/Views/Screens/RouteDiscoveryScreen.swift` | 1 screen × 2 filters (all/specific) × 2 sorts (best/distance) |
| RouteComparisonView | `react-native/components/screens/route-comparison-view.tsx` | `node_modules/react-native/Libraries/Components/View/View.js`; `node_modules/react-native/Libraries/Components/ScrollView/ScrollView.js` | `ios/LaneShadow/Views/Screens/RouteComparisonView.swift` | 1 screen × 3 states (loading/empty/with-routes) |
| RouteOptionsScreen | `react-native/components/screens/route-options-screen.tsx` | `node_modules/react-native/Libraries/Components/View/View.js`; `node_modules/react-native/Libraries/Components/ScrollView/ScrollView.js` | `ios/LaneShadow/Views/Screens/RouteOptionsScreen.swift` | 1 screen × 3 states (loading/error/with-routes) |
| SavedRoutesScreen | `react-native/components/screens/saved-routes-screen.tsx` | `node_modules/react-native/Libraries/Components/View/View.js`; `node_modules/react-native/Libraries/Components/ScrollView/ScrollView.js` | `ios/LaneShadow/Views/Screens/SavedRoutesScreen.swift` | 1 screen × 3 states (loading/empty/with-routes) |

## STYLE PROPERTIES MATRIX

> Exhaustive enumeration of every style property from both sources per `08f-translation-protocol.md`. Columns: Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping. `ESCALATE` = no token covers the value — add a proposed token to DECISIONS.md before implementing.
>
> **Token reference** (from `tokens/semantic/semantic.tokens.json`): space xs=4 sm=8 md=12 lg=16 xl=24 2xl=32 3xl=48 4xl=64; radius none=0 sm=4 md=8 lg=16 xl=24 2xl=32 full=9999; elevation[2] shadowOffset=0/2 shadowOpacity=0.05 shadowRadius=4 androidElevation=2. **Paper labelLarge**: fontFamily=sans-serif-medium, fontWeight=500, fontSize=14, lineHeight=20, letterSpacing=0.1. **Paper labelSmall**: fontFamily=sans-serif-medium, fontWeight=500, fontSize=11, lineHeight=16, letterSpacing=0.5. **semantic.type.label.md**: fontSize=14, lineHeight=20, fontWeight=500. **semantic.type.body.sm**: fontSize=14, lineHeight=21, fontWeight=400.

### RouteDiscoveryScreen

**Source files read:**
- LaneShadow: `react-native/components/discovery/route-discovery-screen.tsx`
- Framework: `node_modules/react-native/Libraries/Components/View/View.js`, `node_modules/react-native-mapbox-gl/maps/mapbox/MapView.js`

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Composition | MenuLayout | RN-wrapper | yes | `MenuLayout {}` | `MenuLayout {}` | n/a |
| Composition | MapViewWrapper | RN-wrapper | yes | `MapViewWrapper {}` | `MapViewWrapper {}` | n/a |
| Composition | DiscoveryFilterBar | RN-wrapper | yes | `DiscoveryFilterBar {}` | `DiscoveryFilterBar {}` | n/a |
| Composition | DiscoverySortToggle | RN-wrapper | yes | `DiscoverySortToggle {}` | `DiscoverySortToggle {}` | n/a |
| Layout | filterBarContainer position | RN-wrapper | absolute top | `Box(Modifier.align(Alignment.TopCenter))` | `.overlay(..., alignment: .top)` | n/a |
| Layout | filterBarContainer paddingHorizontal | RN-wrapper | `semantic.space.lg` = 16 | `Modifier.padding(horizontal = 16.dp)` | `.padding(.horizontal, 16)` | `space.lg` |
| Layout | filterBarContainer paddingBottom | RN-wrapper | `semantic.space.md` = 12 | `Modifier.padding(bottom = 12.dp)` | `.padding(.bottom, 12)` | `space.md` |
| State | selectedArchetypes | RN-wrapper | `RouteArchetype[]` | `Set<RouteArchetype>` | `Set<RouteArchetype>` | n/a |
| State | sortMode | RN-wrapper | `'best'` or `'nearest'` | `enum class SortMode { BEST, NEAREST }` | `enum SortMode { case best, nearest }` | n/a |

### RouteComparisonView

**Source files read:**
- LaneShadow: `react-native/components/screens/route-comparison-view.tsx`
- Framework: `node_modules/react-native/Libraries/Components/View/View.js`, `node_modules/react-native/Libraries/Components/ScrollView/ScrollView.js`

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Composition | SubpageLayout | RN-wrapper | yes | `SubpageLayout {}` | `SubpageLayout {}` | n/a |
| Layout | scrollView | RN-wrapper | `flex: 1` | `Modifier.fillMaxSize()` | `.frame(maxWidth: .infinity, maxHeight: .infinity)` | n/a |
| Layout | scrollContent paddingHorizontal | RN-wrapper | `semantic.space.lg` = 16 | `Modifier.padding(horizontal = 16.dp)` | `.padding(.horizontal, 16)` | `space.lg` |
| Layout | routesList gap | RN-wrapper | hardcoded `12` | `Arrangement.spacedBy(12.dp)` | `VStack(spacing: 12)` | `space.md` (=12) ✓ |
| Layout | subtitleContainer marginBottom | RN-wrapper | hardcoded `8` | `Modifier.padding(bottom = 8.dp)` | `.padding(.bottom, 8)` | `space.sm` (=8) ✓ |
| Visual | routeCard backgroundColor (selected) | RN-wrapper | `primary.default + 14% alpha` | `LaneShadowTheme.colors.primary.copy(alpha = 0.14f)` | `theme.colors.primary.opacity(0.14)` | `color.primary.default` |
| Visual | routeCard backgroundColor (unselected) | RN-wrapper | `semantic.color.card.default` | `LaneShadowTheme.colors.card` | `theme.colors.card` | `color.card.default` |
| Visual | routeCard borderColor (selected) | RN-wrapper | `semantic.color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |
| Visual | routeCard borderWidth (selected) | RN-wrapper | hardcoded `2` | `Modifier.border(2.dp, ...)` | `.overlay(RoundedRectangle(...).stroke(..., lineWidth: 2))` | ESCALATE — propose `borderWidth.thick = 2` |
| Visual | routeBadge backgroundColor (selected) | RN-wrapper | `primary.default + 26% alpha` | `LaneShadowTheme.colors.primary.copy(alpha = 0.26f)` | `theme.colors.primary.opacity(0.26)` | `color.primary.default` |
| Visual | routeBadge backgroundColor (unselected) | RN-wrapper | `semantic.color.divider.default` | `LaneShadowTheme.colors.divider` | `theme.colors.divider` | `color.divider.default` |
| Typography — subtitle | fontSize | Paper bodyMedium | 14 | `14.sp` | `.font(.body)` | `type.body.md.fontSize` (=14) ✓ |
| Typography — subtitle | color | RN-wrapper | `semantic.color.onSurface.subtle` | `LaneShadowTheme.colors.onSurfaceSubtle` | `theme.colors.onSurfaceSubtle` | `color.onSurface.subtle` |
| Typography — badge text fontSize | RN-wrapper | hardcoded (icon label) | `11.sp` | `11` | ESCALATE — `type.label.sm.fontSize = 11` missing |
| Interaction | loading indicator | RN-wrapper | `ActivityIndicator` | `CircularProgressIndicator()` | `ProgressView()` | n/a |
| Interaction | empty state icon size | RN-wrapper | hardcoded `48` | `Modifier.size(48.dp)` | `.frame(width: 48, height: 48)` | ESCALATE — propose `iconSize.md = 48` |
| Interaction | empty state icon color | RN-wrapper | `semantic.color.onSurface.muted` | `LaneShadowTheme.colors.onSurfaceMuted` | `theme.colors.onSurfaceMuted` | `color.onSurface.muted` |

### RouteOptionsScreen

**Source files read:**
- LaneShadow: `react-native/components/screens/route-options-screen.tsx`
- Framework: `node_modules/react-native/Libraries/Components/View/View.js`, `node_modules/react-native/Libraries/Components/ScrollView/ScrollView.js`

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Composition | SubpageLayout | RN-wrapper | yes | `SubpageLayout {}` | `SubpageLayout {}` | n/a |
| Composition | RouteOptionCard | RN-wrapper | yes | `RouteOptionCard {}` | `RouteOptionCard {}` | n/a |
| Composition | PrimaryButton | RN-wrapper | yes | `PrimaryButton {}` | `PrimaryButton {}` | n/a |
| Layout | scrollView | RN-wrapper | `flex: 1` | `Modifier.fillMaxSize()` | `.frame(maxWidth: .infinity, maxHeight: .infinity)` | n/a |
| Layout | scrollContent paddingHorizontal | RN-wrapper | `semantic.space.lg` = 16 | `Modifier.padding(horizontal = 16.dp)` | `.padding(.horizontal, 16)` | `space.lg` |
| Layout | scrollContent paddingTop | RN-wrapper | hardcoded `16` | `Modifier.padding(top = 16.dp)` | `.padding(.top, 16)` | `space.lg` (=16) ✓ |
| Layout | routesList gap | RN-wrapper | hardcoded `12` | `Arrangement.spacedBy(12.dp)` | `VStack(spacing: 12)` | `space.md` (=12) ✓ |
| Layout | subtitleContainer marginBottom | RN-wrapper | hardcoded `8` | `Modifier.padding(bottom = 8.dp)` | `.padding(.bottom, 8)` | `space.sm` (=8) ✓ |
| Layout | bottomBar paddingHorizontal | RN-wrapper | `semantic.space.lg` = 16 | `Modifier.padding(horizontal = 16.dp)` | `.padding(.horizontal, 16)` | `space.lg` |
| Layout | bottomBar paddingBottom | RN-wrapper | `insets.bottom + space.md` = `insets.bottom + 12` | `Modifier.padding(bottom = WindowInsets.safeContent.asPaddingValues().calculateBottomPadding() + 12.dp)` | `.padding(.bottom, safeAreaInsets.bottom + 12)` | `space.md` (=12) ✓ |
| Visual | bottomBar borderTopColor | RN-wrapper | `semantic.color.divider.default` | `LaneShadowTheme.colors.divider` | `theme.colors.divider` | `color.divider.default` |
| Typography — subtitle | variant | Paper bodyMedium | fontSize=14 | `14.sp` | `.font(.body)` | `type.body.md.fontSize` (=14) ✓ |
| Typography — subtitle | color | RN-wrapper | `semantic.color.onSurface.subtle` | `LaneShadowTheme.colors.onSurfaceSubtle` | `theme.colors.onSurfaceSubtle` | `color.onSurface.subtle` |
| Interaction | loading spinner | RN-wrapper | custom View with rotation | `LaunchedEffect + InfiniteTransition` | `.rotationEffect(...)` | n/a |
| Interaction | spinner size | RN-wrapper | hardcoded `40` | `Modifier.size(40.dp)` | `.frame(width: 40, height: 40)` | ESCALATE — propose `size.spinner = 40` |
| Interaction | spinner borderTopColor | RN-wrapper | `semantic.color.primary.default` | `Color(0xFF...)` (gradient) | n/a | `color.primary.default` |
| Interaction | error iconContainer size | RN-wrapper | hardcoded `64` × `64` | `Modifier.size(64.dp)` | `.frame(width: 64, height: 64)` | ESCALATE — `space.2xl` (=32) × 2 |
| Interaction | error iconContainer borderRadius | RN-wrapper | hardcoded `32` (half of 64) | `CircleShape` | `Circle()` | `radius.full` |
| Interaction | error iconContainer backgroundColor | RN-wrapper | `danger.default + 26% alpha` | `LaneShadowTheme.colors.danger.copy(alpha = 0.26f)` | `theme.colors.danger.opacity(0.26)` | `color.danger.default` |
| Interaction | errorDot size | RN-wrapper | hardcoded `12` × `12` | `Modifier.size(12.dp)` | `.frame(width: 12, height: 12)` | ESCALATE — propose `size.dotMd = 12` |
| Interaction | errorDot backgroundColor | RN-wrapper | `semantic.color.danger.default` | `LaneShadowTheme.colors.danger` | `theme.colors.danger` | `color.danger.default` |

### SavedRoutesScreen

**Source files read:**
- LaneShadow: `react-native/components/screens/saved-routes-screen.tsx`
- Framework: `node_modules/react-native/Libraries/Components/View/View.js`, `node_modules/react-native/Libraries/Components/ScrollView/ScrollView.js`

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Composition | SubpageLayout | RN-wrapper | yes | `SubpageLayout {}` | `SubpageLayout {}` | n/a |
| Composition | SavedRouteCard | RN-wrapper | yes | `SavedRouteCard {}` | `SavedRouteCard {}` | n/a |
| Composition | SearchBar | RN-wrapper | yes | `SearchBar {}` | `SearchBar {}` | n/a |
| Layout | scrollView | RN-wrapper | `flex: 1` | `Modifier.fillMaxSize()` | `.frame(maxWidth: .infinity, maxHeight: .infinity)` | n/a |
| Layout | scrollContent paddingHorizontal | RN-wrapper | `semantic.space.lg` = 16 | `Modifier.padding(horizontal = 16.dp)` | `.padding(.horizontal, 16)` | `space.lg` |
| Layout | scrollContent paddingTop | RN-wrapper | hardcoded `16` | `Modifier.padding(top = 16.dp)` | `.padding(.top, 16)` | `space.lg` (=16) ✓ |
| Layout | scrollContent paddingBottom | RN-wrapper | hardcoded `16` | `Modifier.padding(bottom = 16.dp)` | `.padding(.bottom, 16)` | `space.lg` (=16) ✓ |
| Layout | subtitleContainer marginBottom | RN-wrapper | hardcoded `8` | `Modifier.padding(bottom = 8.dp)` | `.padding(.bottom, 8)` | `space.sm` (=8) ✓ |
| Layout | searchContainer marginTop | RN-wrapper | hardcoded `8` | `Modifier.padding(top = 8.dp)` | `.padding(.top, 8)` | `space.sm` (=8) ✓ |
| Layout | searchContainer marginBottom | RN-wrapper | hardcoded `16` | `Modifier.padding(bottom = 16.dp)` | `.padding(.bottom, 16)` | `space.lg` (=16) ✓ |
| Layout | routesList gap | RN-wrapper | hardcoded `12` | `Arrangement.spacedBy(12.dp)` | `VStack(spacing: 12)` | `space.md` (=12) ✓ |
| Visual | emptyThumbnail borderColor | RN-wrapper | `semantic.color.divider.default` | `LaneShadowTheme.colors.divider` | `theme.colors.divider` | `color.divider.default` |
| Visual | emptyRoute borderColor | RN-wrapper | `semantic.color.divider.default` | `LaneShadowTheme.colors.divider` | `theme.colors.divider` | `color.divider.default` |
| Typography — subtitle | variant | Paper bodyMedium | fontSize=14 | `14.sp` | `.font(.body)` | `type.body.md.fontSize` (=14) ✓ |
| Typography — subtitle | color | RN-wrapper | `semantic.color.onSurface.subtle` | `LaneShadowTheme.colors.onSurfaceSubtle` | `theme.colors.onSurfaceSubtle` | `color.onSurface.subtle` |
| Interaction | loading spinner | RN-wrapper | custom View with rotation | `LaunchedEffect + InfiniteTransition` | `.rotationEffect(...)` | n/a |
| Interaction | spinner size | RN-wrapper | hardcoded `40` | `Modifier.size(40.dp)` | `.frame(width: 40, height: 40)` | ESCALATE — propose `size.spinner = 40` |

---

## DESIGN NOTES

- Compose only previously translated components and avoid one-off screen-level styling or ad hoc primitives.
- Avoid default SwiftUI list, form, or navigation styling unless it is fully token-overridden and parity-approved.

## VERIFICATION GATES

- pnpm type-check:native
- swiftformat --lint ios/LaneShadow --config .swiftformat
- xcodebuild -workspace ios/LaneShadow.xcworkspace -scheme LaneShadow -destination "platform=iOS Simulator,name=iPhone 16" test
- Validate sandbox scenarios for this task in the native sandbox host

## DEPENDENCIES

- UI-056
- UI-052

## CODING STANDARDS

- .spec/prds/native-rewrite/08d-component-parity-spec.md — naming, interface, token, state, animation, accessibility, keyboard, and RTL parity
- .spec/prds/native-rewrite/08-design-system.md — token generation and consumption rules
- ~/Projects/brain/docs/TDD-METHODOLOGY.md — RED/GREEN/REFACTOR evidence expectations

## OUT OF SCOPE

- Feature wiring beyond sandbox-ready component translation.
- Changes to unrelated sprints or backend and server code.

---

## Native Sandbox Integration (added 2026-04-18)

`native-sandbox` is installed as a local SPM package (`NativeSandbox` product at `relativePath = ../../native-sandbox/ios`, linked into the LaneShadow target).

### Sandbox Deliverables (in addition to the component sources above)

- `ios/LaneShadow/Sandbox/Stories/<ComponentGroup>Stories.swift` — `@MainActor enum <Group>Stories { static let all: [Story] }` aggregated into `LaneShadowStories.all` at `ios/LaneShadow/Sandbox/LaneShadowStories.swift`.

### Sandbox Acceptance Criterion

**GIVEN** the NativeSandbox SPM package is linked and a DEBUG build is running.
**WHEN** the reviewer runs `make ios_sandbox` (or shakes the device / passes `-LaneShadowSandbox` arg).
**THEN** every component named in DELIVERABLES has at least one registered `Story(id: "<tier>.<component>.<state>", tier: .<tier>, component: "<Name>", name: "<State>", summary: "<rn-reference-path>") { _ in <SwiftUI usage> }` appearing in the sandbox story-tree drawer, wrapped by `previewWrapper: themedPreview { $0.laneShadowTheme() }` so the preview canvas inherits LaneShadow tokens while chrome stays neutral.

### Reviewer Launch

- **Primary:** `make ios_sandbox` (from repo root) — builds Debug, installs to simulator, launches with `-LaneShadowSandbox` arg.
- **Secondary:** device shake (simulator: `xcrun simctl io booted shake`), or `xcrun simctl launch <sim-id> com.laneshadow.app -LaneShadowSandbox`, or deep link `laneshadow-sandbox://sandbox`.

### Contract references

- `NativeSandbox.Story` — `id`, `tier` (`.atom|.molecule|.organism|.template|.screen`), `component`, `name`, `summary`, `content` view builder (`{ _ in ... }`).
- `NativeSandbox.SandboxRoot` — entry view; receives `stories`, optional `themeController`, `previewWrapper`.
- Swift 6 strict concurrency: Story containers MUST be `@MainActor` because `Story` is not Sendable.
- Chrome is theme-neutral by design; only the preview canvas is re-themed via `previewWrapper`.
