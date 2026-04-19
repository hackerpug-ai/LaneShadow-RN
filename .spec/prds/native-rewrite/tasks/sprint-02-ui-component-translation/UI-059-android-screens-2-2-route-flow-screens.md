# UI-059: Android screens 2/2 — route flow screens: `RouteDiscoveryScreen`, `RouteComparisonView`, `RouteOptionsScreen`, `SavedRoutesScreen`

**Task ID:** UI-059
**Sprint:** Sprint 2 - UI Component Translation and Fidelity Sandbox
**Assigned To:** kotlin-implementer
**Reviewer:** kotlin-reviewer
**Estimate:** 720 min
**Type:** [FEATURE]
**Status:** Planned
**Phase:** Screens
**Quality Score:** 115/115

---

## BACKGROUND

Sprint 2 translates the React Native baseline into native platform components and sandbox scenarios before rider-facing feature sprints resume. This task covers the `screens` slice for `Android screens 2/2 — route flow screens: RouteDiscoveryScreen, RouteComparisonView, RouteOptionsScreen, SavedRoutesScreen`.

**Objective:** Implement Android screens 2/2 — route flow screens: `RouteDiscoveryScreen`, `RouteComparisonView`, `RouteOptionsScreen`, `SavedRoutesScreen` as Jetpack Compose work with parity to the RN baseline, token-only styling, and sandbox coverage.

**Success State:** A reviewer can open the Android sandbox, browse this task's scenarios, and confirm naming, interface, theme, state, accessibility, and layout parity against RN.

## CRITICAL CONSTRAINTS

### MUST
- Implement the listed components or compositions with parity-aligned naming and interfaces: `RouteDiscoveryScreen`, `RouteComparisonView`, `RouteOptionsScreen`, `SavedRoutesScreen`.
- Use only the LaneShadow core theme contract locked by `UI-001`: `tokens/semantic/semantic.tokens.json` as the source of truth, generated `native-theme` outputs as the shared packaging layer, and the platform theme entry points (`LaneShadowTheme` on Android, `.laneShadowTheme()` on iOS) for colors, spacing, typography, radii, elevation, and state styling.
- Register sandbox scenarios for default, interactive, and edge-case states with RN reference labels.
- Compose only existing templates, organisms, and delta components and avoid one-off screen styling.

### NEVER
- Add unrelated feature wiring or backend dependencies to satisfy sandbox rendering.
- Introduce hardcoded UI primitives or platform-only naming drift.

### STRICTLY
- Preserve light and dark parity, accessibility labels, and deterministic fixtures for every scenario.

## DELIVERABLES

- android/app/src/main/java/com/laneshadow/ui/screens/**
- android/app/src/debug/java/com/laneshadow/sandbox/stories/ScreensStories.kt — story set aggregated into AppStories.all
- android/app/src/test/java/com/laneshadow/**
- android/app/src/androidTest/java/com/laneshadow/**

## ACCEPTANCE CRITERIA

### AC-1
**GIVEN** The RN baseline and atomic parity contract define the expected components and interfaces.
**WHEN** This task is implemented.
**THEN** The listed components or compositions exist in the correct Android Compose directories with parity-aligned names and signatures: `RouteDiscoveryScreen`, `RouteComparisonView`, `RouteOptionsScreen`, `SavedRoutesScreen`.
**Verify:** `printf "%s\n" "`RouteDiscoveryScreen`, `RouteComparisonView`, `RouteOptionsScreen`, `SavedRoutesScreen`"`

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
**GIVEN** native-sandbox is installed and the DEBUG variant is running.
**WHEN** `make android_sandbox` launches the sandbox (sends intent extra `com.laneshadow.OPEN_SANDBOX=true` to MainActivity).
**THEN** every component listed in DELIVERABLES has at least one `Story(id = "<tier>.<component>.<state>", tier = ComponentTier.<Tier>, component = "<Name>", name = "<State>", summary = "<rn-reference-path>") { <Composable usage> }` registered in `AppStories.all` and renders in the story-tree drawer under its tier, wrapped by `themedPreview { content -> LaneShadowTheme { content() } }`.

**Launch:** `make android_sandbox` (canonical). Secondary: long-press app root (debug gesture) or `adb shell am start -a android.intent.action.VIEW -d "app-sandbox://sandbox"`.

## TEST CRITERIA

| ID | Maps To | Boolean Statement | Verify |
|---|---|---|---|
| TC-1 | AC-1 | The listed components or compositions exist in the correct Android Compose directories with parity-aligned names and signatures: `RouteDiscoveryScreen`, `RouteComparisonView`, `RouteOptionsScreen`, `SavedRoutesScreen`. | `printf "%s\n" "`RouteDiscoveryScreen`, `RouteComparisonView`, `RouteOptionsScreen`, `SavedRoutesScreen`"` |
| TC-2 | AC-2 | All visuals use the LaneShadow core theme contract from `UI-001` and render correctly in both color modes without hardcoded UI primitives. | `rg -n "Token consumption\|light and dark" .spec/prds/native-rewrite/08d-component-parity-spec.md .spec/prds/native-rewrite/08-design-system.md` |
| TC-3 | AC-3 | Each listed component has deterministic sandbox coverage with RN reference labels and explicit state variants where applicable. | `rg -n "RN reference\|scenario\|interactive states" .spec/prds/native-rewrite/tasks/sprint-02-ui-component-translation/SPRINT.md` |
| TC-4 | AC-4 | Accessibility labels, touch targets, keyboard or safe-area handling, and motion or state parity behave correctly for this component family. | `rg -n "Accessibility\|Keyboard handling\|RTL support\|Animation parity\|State parity" .spec/prds/native-rewrite/08d-component-parity-spec.md` |
| TC-5 | AC-5 | The composition renders using only previously defined platform components, deterministic fixtures, and no backend or auth dependencies. | `rg -n "deterministic\|fixtures\|no auth\|no backend" .spec/prds/native-rewrite/tasks/sprint-02-ui-component-translation/SPRINT.md` |
| TC-6 | ALL | Repo validation gates remain green for the touched workspace when this task is complete. | `detekt --input android --config .detekt/config.yml && ./android/gradlew assembleDebug` |

## READING LIST

1. `.spec/prds/native-rewrite/README.md`
2. `.spec/prds/native-rewrite/tasks/sprint-02-ui-component-translation/SPRINT.md`
3. `.spec/prds/native-rewrite/08a-atomic-component-catalog.md`
4. `.spec/prds/native-rewrite/08d-component-parity-spec.md`
5. `RULES.md`
6. `.spec/prds/native-rewrite/08b-android-component-map.md`

## GUARDRAILS

### WRITE-ALLOWED
- android/app/src/main/java/com/laneshadow/ui/screens/**
- android/app/src/main/java/com/laneshadow/ui/sandbox/**
- android/app/src/test/java/com/laneshadow/**
- android/app/src/androidTest/java/com/laneshadow/**

### WRITE-PROHIBITED
- ios/**
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

**Reference:** `.spec/prds/native-rewrite/08b-android-component-map.md`

**Pattern:** Single reusable @Composable with variant props or enums, token-backed MaterialTheme access, and sandbox fixture registration.

**Anti-pattern:** Backend-aware composables, duplicated variant files, or hardcoded visual constants.

## TRANSLATION SOURCES

| Component | RN wrapper source | Framework primitives + `node_modules` paths | Native target file | Variants × sizes × states |
|---|---|---|---|---|
| RouteDiscoveryScreen | `react-native/components/discovery/route-discovery-screen.tsx` | `node_modules/react-native/Libraries/Components/View/View.js`; `node_modules/react-native-mapbox-gl/maps/mapbox/MapView.js` | `android/app/src/main/java/com/laneshadow/ui/screens/RouteDiscoveryScreen.kt` | 1 screen × 2 filters (all/specific) × 2 sorts (best/distance) |
| RouteComparisonView | `react-native/components/screens/route-comparison-view.tsx` | `node_modules/react-native/Libraries/Components/View/View.js`; `node_modules/react-native/Libraries/Components/ScrollView/ScrollView.js` | `android/app/src/main/java/com/laneshadow/ui/screens/RouteComparisonView.kt` | 1 screen × 3 states (loading/empty/with-routes) |
| RouteOptionsScreen | `react-native/components/screens/route-options-screen.tsx` | `node_modules/react-native/Libraries/Components/View/View.js`; `node_modules/react-native/Libraries/Components/ScrollView/ScrollView.js` | `android/app/src/main/java/com/laneshadow/ui/screens/RouteOptionsScreen.kt` | 1 screen × 3 states (loading/error/with-routes) |
| SavedRoutesScreen | `react-native/components/screens/saved-routes-screen.tsx` | `node_modules/react-native/Libraries/Components/View/View.js`; `node_modules/react-native/Libraries/Components/ScrollView/ScrollView.js` | `android/app/src/main/java/com/laneshadow/ui/screens/SavedRoutesScreen.kt` | 1 screen × 3 states (loading/empty/with-routes) |

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
- Avoid unstyled Material defaults and route all styling through the documented Compose theme layer.

## VERIFICATION GATES

- detekt --input android --config .detekt/config.yml
- ./android/gradlew assembleDebug
- Validate sandbox scenarios for this task in the native sandbox host

## DEPENDENCIES

- UI-055
- UI-051

## CODING STANDARDS

- .spec/prds/native-rewrite/08d-component-parity-spec.md — naming, interface, token, state, animation, accessibility, keyboard, and RTL parity
- .spec/prds/native-rewrite/08-design-system.md — token generation and consumption rules
- ~/Projects/brain/docs/TDD-METHODOLOGY.md — RED/GREEN/REFACTOR evidence expectations

## OUT OF SCOPE

- Feature wiring beyond sandbox-ready component translation.
- Changes to unrelated sprints or backend and server code.

---

## Native Sandbox Integration (added 2026-04-18)

`native-sandbox` is installed as a Gradle composite build (`com.nativesandbox:library` via `includeBuild("../../native-sandbox/android")` with `debugImplementation`).

### Sandbox Deliverables (in addition to the component sources above)

- `android/app/src/debug/java/com/laneshadow/sandbox/stories/<ComponentGroup>Stories.kt` — debug-only story set; `object` with `val all: List<Story>`, aggregated into `AppStories.all` at `android/app/src/debug/java/com/laneshadow/sandbox/stories/AppStories.kt`.

### Sandbox Acceptance Criterion

**GIVEN** the native-sandbox Gradle composite build is wired and the DEBUG variant is built.
**WHEN** the reviewer runs `make android_sandbox` (or triggers the long-press gesture / sends intent extra `com.laneshadow.OPEN_SANDBOX=true`).
**THEN** every component named in DELIVERABLES has at least one registered `Story(id = "<tier>.<component>.<state>", tier = ComponentTier.<Tier>, component = "<Name>", name = "<State>", summary = "<rn-reference-path>") { <Composable usage> }` appearing in the sandbox story-tree drawer, wrapped by `previewWrapper = themedPreview { content -> LaneShadowTheme { content() } }` so the preview canvas inherits LaneShadow tokens while chrome stays neutral.

### Reviewer Launch

- **Primary:** `make android_sandbox` (from repo root) — builds debug APK, installs, launches MainActivity with the sandbox intent extra.
- **Secondary:** long-press app root (debug-only gesture), or `adb shell am start -a android.intent.action.VIEW -d "app-sandbox://sandbox"`.

### Contract references

- `com.nativesandbox.model.Story` — `id`, `tier` (ComponentTier), `component`, `name`, `summary`, `content: @Composable`.
- `com.nativesandbox.views.SandboxRoot` — entry composable; receives `stories`, optional `themeController`, `previewWrapper`.
- Chrome is theme-neutral by design; only the preview canvas is re-themed via `previewWrapper`.
