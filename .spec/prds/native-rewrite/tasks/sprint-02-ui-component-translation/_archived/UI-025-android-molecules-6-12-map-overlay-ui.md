# UI-025: Android molecules 6/12 — map overlay UI: `MapHeaderOverlay`, `MapControls`, `MapPlanningIndicator`, `MinimalOverlayWidget`, `MinimalOverlayWidgetPreview`, `OverlayToggle`, `PlanFAB`, `SearchResultMarker`, `WaypointMarker`

**Task ID:** UI-025
**Sprint:** Sprint 2 - UI Component Translation and Fidelity Sandbox
**Assigned To:** kotlin-implementer
**Reviewer:** kotlin-reviewer
**Estimate:** 480 min
**Type:** [FEATURE]
**Status:** Planned
**Phase:** Molecules
**Quality Score:** 115/115

---

## BACKGROUND

Sprint 2 translates the React Native baseline into native platform components and sandbox scenarios before rider-facing feature sprints resume. This task covers the `molecules` slice for `Android molecules 6/12 — map overlay UI: MapHeaderOverlay, MapControls, MapPlanningIndicator, MinimalOverlayWidget, MinimalOverlayWidgetPreview, OverlayToggle, PlanFAB, SearchResultMarker, WaypointMarker`.

**Objective:** Implement Android molecules 6/12 — map overlay UI: `MapHeaderOverlay`, `MapControls`, `MapPlanningIndicator`, `MinimalOverlayWidget`, `MinimalOverlayWidgetPreview`, `OverlayToggle`, `PlanFAB`, `SearchResultMarker`, `WaypointMarker` as Jetpack Compose work with parity to the RN baseline, token-only styling, and sandbox coverage.

**Success State:** A reviewer can open the Android sandbox, browse this task's scenarios, and confirm naming, interface, theme, state, accessibility, and layout parity against RN.

## CRITICAL CONSTRAINTS

### MUST
- Implement the listed components or compositions with parity-aligned naming and interfaces: `MapHeaderOverlay`, `MapControls`, `MapPlanningIndicator`, `MinimalOverlayWidget`, `MinimalOverlayWidgetPreview`, `OverlayToggle`, `PlanFAB`, `SearchResultMarker`, `WaypointMarker`.
- Use only the LaneShadow core theme contract locked by `UI-001`: `tokens/semantic/semantic.tokens.json` as the source of truth, generated `native-theme` outputs as the shared packaging layer, and the platform theme entry points (`LaneShadowTheme` on Android, `.laneShadowTheme()` on iOS) for colors, spacing, typography, radii, elevation, and state styling.
- Register sandbox scenarios for default, interactive, and edge-case states with RN reference labels.
- Compose only from already-defined atoms on the same platform and preserve RN layout hierarchy.

### NEVER
- Add unrelated feature wiring or backend dependencies to satisfy sandbox rendering.
- Introduce hardcoded UI primitives or platform-only naming drift.

### STRICTLY
- Preserve light and dark parity, accessibility labels, and deterministic fixtures for every scenario.

## DELIVERABLES

- android/app/src/main/java/com/laneshadow/ui/molecules/**
- android/app/src/debug/java/com/laneshadow/sandbox/stories/MoleculesStories.kt — story set aggregated into AppStories.all
- android/app/src/test/java/com/laneshadow/**
- android/app/src/androidTest/java/com/laneshadow/**

## ACCEPTANCE CRITERIA

### AC-1
**GIVEN** The RN baseline and atomic parity contract define the expected components and interfaces.
**WHEN** This task is implemented.
**THEN** The listed components or compositions exist in the correct Android Compose directories with parity-aligned names and signatures: `MapHeaderOverlay`, `MapControls`, `MapPlanningIndicator`, `MinimalOverlayWidget`, `MinimalOverlayWidgetPreview`, `OverlayToggle`, `PlanFAB`, `SearchResultMarker`, `WaypointMarker`.
**Verify:** `printf "%s\n" "`MapHeaderOverlay`, `MapControls`, `MapPlanningIndicator`, `MinimalOverlayWidget`, `MinimalOverlayWidgetPreview`, `OverlayToggle`, `PlanFAB`, `SearchResultMarker`, `WaypointMarker`"`

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
**GIVEN** native-sandbox is installed and the DEBUG variant is running.
**WHEN** `make android_sandbox` launches the sandbox (sends intent extra `com.laneshadow.OPEN_SANDBOX=true` to MainActivity).
**THEN** every component listed in DELIVERABLES has at least one `Story(id = "<tier>.<component>.<state>", tier = ComponentTier.<Tier>, component = "<Name>", name = "<State>", summary = "<rn-reference-path>") { <Composable usage> }` registered in `AppStories.all` and renders in the story-tree drawer under its tier, wrapped by `themedPreview { content -> LaneShadowTheme { content() } }`.

**Launch:** `make android_sandbox` (canonical). Secondary: long-press app root (debug gesture) or `adb shell am start -a android.intent.action.VIEW -d "app-sandbox://sandbox"`.

## TEST CRITERIA

| ID | Maps To | Boolean Statement | Verify |
|---|---|---|---|
| TC-1 | AC-1 | The listed components or compositions exist in the correct Android Compose directories with parity-aligned names and signatures: `MapHeaderOverlay`, `MapControls`, `MapPlanningIndicator`, `MinimalOverlayWidget`, `MinimalOverlayWidgetPreview`, `OverlayToggle`, `PlanFAB`, `SearchResultMarker`, `WaypointMarker`. | `printf "%s\n" "`MapHeaderOverlay`, `MapControls`, `MapPlanningIndicator`, `MinimalOverlayWidget`, `MinimalOverlayWidgetPreview`, `OverlayToggle`, `PlanFAB`, `SearchResultMarker`, `WaypointMarker`"` |
| TC-2 | AC-2 | All visuals use the LaneShadow core theme contract from `UI-001` and render correctly in both color modes without hardcoded UI primitives. | `rg -n "Token consumption\|light and dark" .spec/prds/native-rewrite/08d-component-parity-spec.md .spec/prds/native-rewrite/08-design-system.md` |
| TC-3 | AC-3 | Each listed component has deterministic sandbox coverage with RN reference labels and explicit state variants where applicable. | `rg -n "RN reference\|scenario\|interactive states" .spec/prds/native-rewrite/tasks/sprint-02-ui-component-translation/SPRINT.md` |
| TC-4 | AC-4 | Accessibility labels, touch targets, keyboard or safe-area handling, and motion or state parity behave correctly for this component family. | `rg -n "Accessibility\|Keyboard handling\|RTL support\|Animation parity\|State parity" .spec/prds/native-rewrite/08d-component-parity-spec.md` |
| TC-5 | ALL | Repo validation gates remain green for the touched workspace when this task is complete. | `pnpm type-check:native && ./android/gradlew assembleDebug` |

## READING LIST

1. `.spec/prds/native-rewrite/README.md`
2. `.spec/prds/native-rewrite/tasks/sprint-02-ui-component-translation/SPRINT.md`
3. `.spec/prds/native-rewrite/08a-atomic-component-catalog.md`
4. `.spec/prds/native-rewrite/08d-component-parity-spec.md`
5. `RULES.md`
6. `.spec/prds/native-rewrite/08b-android-component-map.md`

## GUARDRAILS

### WRITE-ALLOWED
- android/app/src/main/java/com/laneshadow/ui/molecules/**
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
| MapHeaderOverlay | `react-native/components/map/map-header-overlay.tsx` | `expo-linear-gradient` (LinearGradient); `react-native-safe-area-context` (useSafeAreaInsets) | `android/app/src/main/java/com/laneshadow/ui/molecules/MapHeaderOverlay.kt` | 2 layouts (with/without background) × optional left/right actions |
| MapControls | `react-native/components/map/map-controls.tsx` | `react-native/Libraries/Components/Pressable/Pressable.js`; `react-native-paper/src/components/Icon/Icon.js` | `android/app/src/main/java/com/laneshadow/ui/molecules/MapControls.kt` | 2 modes (map/chat) × 5 buttons (zoom in/out/recenter/layers/save) × optional labels |
| MapPlanningIndicator | `react-native/components/map/map-planning-indicator.tsx` | `react-native-reanimated` (FadeIn/FadeOut); `react-native/Libraries/Components/ActivityIndicator/ActivityIndicator.js` | `android/app/src/main/java/com/laneshadow/ui/molecules/MapPlanningIndicator.kt` | 1 layout × visible/hidden × bottom offset positioning |
| MinimalOverlayWidget | `react-native/components/map/minimal-overlay-widget.tsx` | `react-native-reanimated` (spring/timing animations); `react-native/Libraries/Components/Pressable/Pressable.js` | `android/app/src/main/java/com/laneshadow/ui/molecules/MinimalOverlayWidget.kt` | 3 overlays (wind/rain/temperature) × 2 states (collapsed/expanded) × availability flags |
| MinimalOverlayWidgetPreview | `react-native/components/map/minimal-overlay-widget-preview.tsx` | `react-native/Libraries/Components/ScrollView/ScrollView.js` (horizontal); `react-native/Libraries/Components/Pressable/Pressable.js` | `android/app/src/main/java/com/laneshadow/sandbox/stories/MinimalOverlayWidgetPreviewStories.kt` | 4 scenarios (all/wind-only/rain+temp/none) × demo showcase |
| OverlayToggle | `react-native/components/map/overlay-toggle.tsx` | `react-native/Libraries/Components/Pressable/Pressable.js`; `react-native-paper/src/components/ToggleGroup/ToggleGroup.js` | `android/app/src/main/java/com/laneshadow/ui/molecules/OverlayToggle.kt` | 3 overlays (wind/rain/temperature) × single-select × disabled states |
| PlanFAB | `react-native/components/map/plan-fab.tsx` | `react-native-safe-area-context` (useSafeAreaInsets); `react-native-paper/src/components/IconButton/IconButton.js` | `android/app/src/main/java/com/laneshadow/ui/molecules/PlanFAB.kt` | 1 fixed layout × safe-area bottom positioning |
| SearchResultMarker | `react-native/components/map/search-result-marker.tsx` | `@rnmapbox/maps` (MarkerView); `expo-haptics` (Haptics.impactAsync); `react-native-svg` (Svg, Circle) | `android/app/src/main/java/com/laneshadow/ui/molecules/SearchResultMarker.kt` | Numbered marker (1-based index) × 2 states (default/selected) × tap feedback |
| WaypointMarker | `react-native/components/map/waypoint-marker.tsx` | `@rnmapbox/maps` (MarkerView); `expo-haptics` (Haptics.impactAsync); `react-native-svg` (Svg, Circle, Path, G) | `android/app/src/main/java/com/laneshadow/ui/molecules/WaypointMarker.kt` | Pin-shaped marker × 3 kinds (on-route/off-route/mixed) × 4 states (default/selected/pressed/disabled) × optional index |

## STYLE PROPERTIES MATRIX

> Exhaustive enumeration of every style property from both sources per `08f-translation-protocol.md`. Columns: Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping. `ESCALATE` = no token covers the value — add a proposed token to DECISIONS.md before implementing.
>
> **Token reference** (from `tokens/semantic/semantic.tokens.json`): space xs=4 sm=8 md=12 lg=16 xl=24 2xl=32 3xl=48 4xl=64; radius none=0 sm=4 md=8 lg=16 xl=24 2xl=32 full=9999; elevation[2] shadowOffset=0/2 shadowOpacity=0.05 shadowRadius=4 androidElevation=2. **Paper labelLarge**: fontFamily=sans-serif-medium, fontWeight=500, fontSize=14, lineHeight=20, letterSpacing=0.1. **Paper labelSmall**: fontFamily=sans-serif-medium, fontWeight=500, fontSize=11, lineHeight=16, letterSpacing=0.5. **semantic.type.label.md**: fontSize=14, lineHeight=20, fontWeight=500. **semantic.type.body.sm**: fontSize=14, lineHeight=21, fontWeight=400.

### MapHeaderOverlay

**Source files read:**
- LaneShadow: `react-native/components/map/map-header-overlay.tsx`
- Framework: `expo-linear-gradient`, `react-native-safe-area-context`, `react-native-paper`

**Layout — gradient:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| width | RN-wrapper | `'100%'` | `Modifier.fillMaxWidth()` | `.frame(maxWidth: .infinity)` | n/a |
| paddingTop | RN-wrapper | `insets.top` | `Modifier.padding(top = WindowInsets.systemBars.top)` | `.padding(.top, insets.top)` | `safeArea.top` (dynamic) |
| paddingBottom | RN-wrapper | `semantic.space.xl` | `Modifier.padding(bottom = space.xl.dp)` | `.padding(.bottom, space.xl)` | `space.xl` (24) |

**Layout — content:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| alignItems | RN-wrapper | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.alignment(.center)` | n/a |
| justifyContent | RN-wrapper | `'space-between'` | `horizontalArrangement = Arrangement.SpaceBetween` | n/a (HStack default) | n/a |
| paddingHorizontal | RN-wrapper | `semantic.space.lg` | `Modifier.padding(horizontal = space.lg.dp)` | `.padding(.horizontal, space.lg)` | `space.lg` (16) |
| paddingBottom | RN-wrapper | `semantic.space['2xl']` | `Modifier.padding(bottom = space['2xl'].dp)` | `.padding(.bottom, space.2xl)` | `space.2xl` (32) |

**Layout — leftSection/rightSection:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| minWidth | RN-wrapper | `iconButtonSize = space['3xl']` | `Modifier.widthIn(min = space['3xl'].dp)` | `.frame(minWidth: space.3xl)` | `space.3xl` (48) |
| justifyContent | RN-wrapper | `'center'` | `horizontalAlignment = Alignment.CenterHorizontally` | `.frame(maxWidth: .infinity)` | n/a |

**Visual — placeholder:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| width/height | RN-wrapper | `space['3xl']` | `Modifier.size(space['3xl'].dp)` | `.frame(width: space.3xl, height: space.3xl)` | `space.3xl` (48) |

**Visual — gradient colors:**

| Mode | Colors | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|---|
| showBackground | gradient | RN-wrapper | `[surface@95%, surface@50%, transparent]` | `Brush.horizontalGradient(listOf(surfaceColor.copy(0.95f), surfaceColor.copy(0.5f), Color.Transparent))` | `LinearGradient(colors: [surface.opacity(0.95), surface.opacity(0.5), .clear])` | `color.surface.default` + alpha |
| hideBackground | gradient | RN-wrapper | `[transparent, transparent, transparent]` | `Brush.horizontalGradient(listOf(Color.Transparent))` | `LinearGradient(colors: [.clear, .clear, .clear])` | n/a |

**Typography — title:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| variant | RN-wrapper | `headlineMedium` (Paper) | `MaterialTheme.typography.headlineMedium` | `theme.font.headlineMedium` / `.font(.title3)` | Paper `headlineMedium` |
| fontWeight | RN-wrapper | `'bold'` | `FontWeight.Bold` | `.weight(.bold)` | n/a |
| color | RN-wrapper | `semantic.color.onSurface.default` | `MaterialTheme.colorScheme.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |

**Visual — action buttons:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| variant | RN-wrapper | `'glass'` (Button) | `ButtonDefaults.buttonColors(...)` (glass variant) | `.buttonStyle(.glass)` / `.background(.ultraThinMaterial)` | custom glass variant |
| size | RN-wrapper | `'icon'` | `Modifier.size(48.dp)` (icon button size) | `.frame(width: 48, height: 48)` | `space.3xl` (48) |
| icon size | RN-wrapper | `24` | `Modifier.size(24.dp)` | `.frame(width: 24, height: 24)` | ESCALATE — propose `icon.md = 24` |
| icon color | RN-wrapper | `semantic.color.onSurface.default` | `MaterialTheme.colorScheme.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |

### MapControls

**Source files read:**
- LaneShadow: `react-native/components/map/map-controls.tsx`
- Framework: `react-native/Libraries/Components/Pressable/Pressable.js`, `react-native-paper`

**Layout — container:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| alignItems | RN-wrapper | `'center'` | `horizontalAlignment = Alignment.CenterHorizontally` | `.frame(maxWidth: .infinity)` | n/a |
| gap | RN-wrapper | `semantic.space.xs` | `Arrangement.spacedBy(space.xs.dp)` | `spacing: space.xs` | `space.xs` (4) |

**Layout — offsets (position):**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| top | RN-wrapper | `insets.top + space['2xl']` | `Modifier.padding(top = (WindowInsets.systemBars.top + space['2xl']).dp)` | `.padding(.top, insets.top + space.2xl)` | `safeArea.top + space.2xl` |
| right | RN-wrapper | `semantic.space.lg` | `Modifier.padding(end = space.lg.dp)` | `.padding(.trailing, space.lg)` | `space.lg` (16) |

**Layout — cluster:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| backgroundColor | RN-wrapper | `semantic.color.surfaceVariant.default` | `MaterialTheme.colorScheme.surfaceVariant` | `theme.colors.surfaceVariant` | `color.surfaceVariant.default` |
| borderColor | RN-wrapper | `semantic.color.border.default` | `MaterialTheme.colorScheme.outline` | `theme.colors.outline` | `color.border.default` |
| borderWidth | RN-wrapper | `1.5` | `Modifier.border(1.5.dp, ...)` | `.overlay(..., lineWidth: 1.5)` | n/a |
| borderRadius | RN-wrapper | `semantic.radius['2xl']` | `Modifier.clip(RoundedCornerShape(radius['2xl'].dp))` | `.cornerRadius(radius.2xl)` | `radius.2xl` (32) |
| elevation | RN-wrapper | `semantic.elevation[3]` | `Modifier.shadow(elevation = 3.dp, ...)` | `.shadow(radius: 6, y: 3)` | `elevation[3]` |

**Layout — controlButton:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| width (no label) | RN-wrapper | `space['3xl']` | `Modifier.width(space['3xl'].dp)` | `.frame(width: space.3xl)` | `space.3xl` (48) |
| minWidth (with label) | RN-wrapper | `space['3xl']` | `Modifier.widthIn(min = space['3xl'].dp)` | `.frame(minWidth: space.3xl)` | `space.3xl` (48) |
| borderRadius | RN-wrapper | `semantic.radius['2xl']` | `Modifier.clip(RoundedCornerShape(radius['2xl'].dp))` | `.cornerRadius(radius.2xl)` | `radius.2xl` (32) |
| paddingHorizontal (with label) | RN-wrapper | `semantic.space.sm` | `Modifier.padding(horizontal = space.sm.dp)` | `.padding(.horizontal, space.sm)` | `space.sm` (8) |
| paddingVertical | RN-wrapper | `semantic.space.xs` | `Modifier.padding(vertical = space.xs.dp)` | `.padding(.vertical, space.xs)` | `space.xs` (4) |
| gap (with label) | RN-wrapper | `semantic.space.xs` | `Arrangement.spacedBy(space.xs.dp)` | `spacing: space.xs` | `space.xs` (4) |

**Visual — controlButton colors (by state/accent):**

| State | Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|---|
| default | backgroundColor | RN-wrapper | `semantic.color.surfaceVariant.default` | `MaterialTheme.colorScheme.surfaceVariant` | `theme.colors.surfaceVariant` | `color.surfaceVariant.default` |
| pressed | backgroundColor | RN-wrapper | `semantic.color.surfaceVariant.pressed` | `surfaceVariantColor.copy(alpha = 0.8f)` | `theme.colors.surfaceVariant.opacity(0.8)` | `color.surfaceVariant.pressed` |
| accent | backgroundColor | RN-wrapper | `semantic.color.primary.default` | `MaterialTheme.colorScheme.primary` | `theme.colors.primary` | `color.primary.default` |
| accent pressed | backgroundColor | RN-wrapper | `semantic.color.primary.pressed` | `primaryColor.copy(alpha = 0.8f)` | `theme.colors.primary.opacity(0.8)` | `color.primary.pressed` |
| borderColor | RN-wrapper | `semantic.color.border.default` | `MaterialTheme.colorScheme.outline` | `theme.colors.outline` | `color.border.default` |
| accent borderColor | RN-wrapper | `semantic.color.primary.default` | `MaterialTheme.colorScheme.primary` | `theme.colors.primary` | `color.primary.default` |
| elevation | RN-wrapper | `semantic.elevation[3]` | `Modifier.shadow(elevation = 3.dp, ...)` | `.shadow(radius: 6, y: 3)` | `elevation[3]` |

**Visual — controlButton hitSlop:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| top/bottom/left/right | RN-wrapper | `semantic.space.xs` | `Modifier.clickable(...).padding(space.xs.dp)` | `.contentShape(Rectangle()).padding(space.xs)` | `space.xs` (4) |

**Visual — icon:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| size | RN-wrapper | `20` | `Modifier.size(20.dp)` | `.frame(width: 20, height: 20)` | ESCALATE — propose `icon.sm = 20` |
| color (accent) | RN-wrapper | `semantic.color.onPrimary.default` | `MaterialTheme.colorScheme.onPrimary` | `theme.colors.onPrimary` | `color.onPrimary.default` |
| color (default) | RN-wrapper | `semantic.color.onSurface.default` | `MaterialTheme.colorScheme.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |

**Typography — label (optional):**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| style | RN-wrapper | `semantic.type.body.sm` | `MaterialTheme.typography.bodySmall` | `theme.font.bodySmall` / `.font(.caption)` | `type.body.sm` |
| color (accent) | RN-wrapper | `semantic.color.onPrimary.default` | `MaterialTheme.colorScheme.onPrimary` | `theme.colors.onPrimary` | `color.onPrimary.default` |
| color (default) | RN-wrapper | `semantic.color.onSurface.default` | `MaterialTheme.colorScheme.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |

**Layout — divider:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| height | RN-wrapper | `1` | `Modifier.height(1.dp)` | `.frame(height: 1)` | n/a |
| width | RN-wrapper | `'100%'` | `Modifier.fillMaxWidth()` | `.frame(maxWidth: .infinity)` | n/a |
| backgroundColor | RN-wrapper | `semantic.color.border.default` | `MaterialTheme.colorScheme.outline` | `theme.colors.outline` | `color.border.default` |

### MapPlanningIndicator

**Source files read:**
- LaneShadow: `react-native/components/map/map-planning-indicator.tsx`
- Framework: `react-native-reanimated`, `react-native/Libraries/Components/ActivityIndicator/ActivityIndicator.js`

**Layout — wrapper:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| position | RN-wrapper | `'absolute'` | `Modifier.wrapContentSize(Alignment.BottomCenter).offset(...)` | `.overlay(...)` | n/a |
| bottom | RN-wrapper | `calculatedBottom = (bottomOffset ?? 100) + extraInputOffset` | `Modifier.padding(bottom = calculatedBottom.dp)` | `.offset(y: calculatedBottom)` | dynamic (props) |
| left/right | RN-wrapper | `0` | `Modifier.wrapContentWidth()` | `.frame(maxWidth: .infinity)` | n/a |
| alignItems | RN-wrapper | `'center'` | `horizontalAlignment = Alignment.CenterHorizontally` | `.frame(maxWidth: .infinity)` | n/a |
| zIndex | RN-wrapper | `25` | `Modifier.zIndex(25)` | `.zIndex(25)` | n/a |

**Layout — pill:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| alignItems | RN-wrapper | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.alignment(.center)` | n/a |
| gap | RN-wrapper | `8` | `Arrangement.spacedBy(8.dp)` | `spacing: 8` | `space.sm` (8) |
| paddingHorizontal | RN-wrapper | `16` | `Modifier.padding(horizontal = 16.dp)` | `.padding(.horizontal, 16)` | `space.lg` (16) |
| paddingVertical | RN-wrapper | `10` | `Modifier.padding(vertical = 10.dp)` | `.padding(.vertical, 10)` | ESCALATE — propose `space.md - space.xs = 10` |
| borderRadius | RN-wrapper | `20` | `Modifier.clip(RoundedCornerShape(20.dp))` | `.cornerRadius(20)` | ESCALATE — propose `radius.lg + space.md = 20` |
| borderWidth | RN-wrapper | `StyleSheet.hairlineWidth` (~0.5) | `Modifier.border(0.5.dp, ...)` (use 1.dp) | `.overlay(..., lineWidth: 1)` | n/a |

**Visual — pill colors:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| backgroundColor | RN-wrapper | `semantic.color.surface.default` | `MaterialTheme.colorScheme.surface` | `theme.colors.surface` | `color.surface.default` |
| borderColor | RN-wrapper | `semantic.color.border.default` | `MaterialTheme.colorScheme.outline` | `theme.colors.outline` | `color.border.default` |

**Visual — pill shadow (iOS-style):**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| shadowColor | RN-wrapper | `'#000'` | `android:shadowColor` (elevation API) | `.shadow(color: .black)` | n/a |
| shadowOffset | RN-wrapper | `{ width: 0, height: 2 }` | `android:shadowDy` (elevation API) | `.shadow(radius: 8, y: 2)` | n/a |
| shadowOpacity | RN-wrapper | `0.15` | `android:shadowAlpha` (elevation API) | n/a (Color.opacity) | n/a |
| shadowRadius | RN-wrapper | `8` | `android:shadowRadius` (elevation API) | `.shadow(radius: 8)` | n/a |
| elevation | RN-wrapper | `4` | `Modifier.shadow(elevation = 4.dp, ...)` | n/a (use shadow) | ESCALATE — propose `elevation[4]` |

**Typography — text:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| variant | RN-wrapper | `bodySmall` (Paper) | `MaterialTheme.typography.bodySmall` | `theme.font.bodySmall` / `.font(.caption2)` | Paper `bodySmall` |
| color | RN-wrapper | `semantic.color.onSurface.muted` | `MaterialTheme.colorScheme.onSurfaceVariant` | `theme.colors.onSurfaceVariant` | `color.onSurface.muted` |

**Visual — typing indicator:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| size | RN-wrapper | `'sm'` (TypingIndicator) | `Modifier.size(12.dp)` (sm) | `.scaleEffect(0.8)` | n/a (component size) |

### MinimalOverlayWidget

**Source files read:**
- LaneShadow: `react-native/components/map/minimal-overlay-widget.tsx`
- Framework: `react-native-reanimated`, `react-native/Libraries/Components/Pressable/Pressable.js`

**Layout — container:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| width/height | RN-wrapper | `120` | `Modifier.size(120.dp)` | `.frame(width: 120, height: 120)` | ESCALATE — propose `space.3xl * 2.5 = 120` |
| alignItems | RN-wrapper | `'center'` | `horizontalAlignment = Alignment.CenterHorizontally` | `.frame(maxWidth: .infinity)` | n/a |
| justifyContent | RN-wrapper | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.frame(maxHeight: .infinity)` | n/a |
| position | RN-wrapper | `'relative'` | n/a (default) | n/a (default) | n/a |

**Layout — centerButton:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| width/height | RN-wrapper | `40` | `Modifier.size(40.dp)` | `.frame(width: 40, height: 40)` | ESCALATE — propose `space.xl - space.md = 40` |
| borderRadius | RN-wrapper | `20` (half of width) | `Modifier.clip(CircleShape)` | `.clipShape(Circle())` | `radius.full` |
| borderWidth | RN-wrapper | `1.5` | `Modifier.border(1.5.dp, ...)` | `.overlay(..., lineWidth: 1.5)` | n/a |
| zIndex | RN-wrapper | `10` | `Modifier.zIndex(10)` | `.zIndex(10)` | n/a |
| alignItems | RN-wrapper | `'center'` | `horizontalAlignment = Alignment.CenterHorizontally` | `.frame(maxWidth: .infinity)` | n/a |
| justifyContent | RN-wrapper | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.frame(maxHeight: .infinity)` | n/a |

**Visual — centerButton colors (by state):**

| State | Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|---|
| default | backgroundColor | RN-wrapper | `semantic.color.surfaceVariant.default` | `MaterialTheme.colorScheme.surfaceVariant` | `theme.colors.surfaceVariant` | `color.surfaceVariant.default` |
| pressed | backgroundColor | RN-wrapper | `semantic.color.surfaceVariant.pressed` | `surfaceVariantColor.copy(alpha = 0.8f)` | `theme.colors.surfaceVariant.opacity(0.8)` | `color.surfaceVariant.pressed` |
| has value | borderColor | RN-wrapper | `semantic.color.primary.default` | `MaterialTheme.colorScheme.primary` | `theme.colors.primary` | `color.primary.default` |
| no value | borderColor | RN-wrapper | `semantic.color.border.default` | `MaterialTheme.colorScheme.outline` | `theme.colors.outline` | `color.border.default` |

**Visual — icon:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| size | RN-wrapper | `20` | `Modifier.size(20.dp)` | `.frame(width: 20, height: 20)` | ESCALATE — propose `icon.sm = 20` |
| color (has value) | RN-wrapper | `semantic.color.primary.default` | `MaterialTheme.colorScheme.primary` | `theme.colors.primary` | `color.primary.default` |
| color (no value) | RN-wrapper | `semantic.color.onSurface.default` | `MaterialTheme.colorScheme.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |

**Layout — activeRing:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| position | RN-wrapper | `'absolute'` | `Modifier.wrapContentSize(Alignment.Center).offset(...)` | `.overlay(...)` | n/a |
| width/height | RN-wrapper | `48` | `Modifier.size(48.dp)` | `.frame(width: 48, height: 48)` | `space.3xl` (48) |
| borderRadius | RN-wrapper | `24` (half of width) | `Modifier.clip(CircleShape)` | `.clipShape(Circle())` | `radius.full` |
| borderWidth | RN-wrapper | `2` | `Modifier.border(2.dp, ...)` | `.overlay(..., lineWidth: 2)` | n/a |
| borderStyle | RN-wrapper | `'solid'` | n/a (default) | n/a (default) | n/a |
| borderColor | RN-wrapper | `semantic.color.primary.default` | `MaterialTheme.colorScheme.primary` | `theme.colors.primary` | `color.primary.default` |

**Layout — radialIcon:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| position | RN-wrapper | `'absolute'` | `Modifier.wrapContentSize(Alignment.Center).offset(x.dp, y.dp)` | `.overlay(...).offset(x, y)` | n/a |
| width/height | RN-wrapper | `36` | `Modifier.size(36.dp)` | `.frame(width: 36, height: 36)` | ESCALATE — propose `space.xl - space.md = 36` |
| alignItems | RN-wrapper | `'center'` | `horizontalAlignment = Alignment.CenterHorizontally` | `.frame(maxWidth: .infinity)` | n/a |
| justifyContent | RN-wrapper | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.frame(maxHeight: .infinity)` | n/a |
| RADIUS | RN-wrapper | `36` (distance from center) | `offset(x, y)` based on angle | `.offset(x, y)` based on angle | n/a (geometry) |

**Visual — radialIcon button:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| width/height | RN-wrapper | `36` | `Modifier.size(36.dp)` | `.frame(width: 36, height: 36)` | ESCALATE — propose `space.xl - space.md = 36` |
| borderRadius | RN-wrapper | `18` (half of width) | `Modifier.clip(CircleShape)` | `.clipShape(Circle())` | `radius.full` |
| borderWidth | RN-wrapper | `1` | `Modifier.border(1.dp, ...)` | `.overlay(..., lineWidth: 1)` | n/a |

**Visual — radialIcon colors (by state):**

| State | Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|---|
| active | backgroundColor | RN-wrapper | `${semantic.color.primary.default}33` (20% alpha) | `primaryColor.copy(alpha = 0.2f)` | `Color.primary.opacity(0.2)` | `color.primary.default` + alpha |
| active | borderColor | RN-wrapper | `semantic.color.primary.default` | `MaterialTheme.colorScheme.primary` | `theme.colors.primary` | `color.primary.default` |
| default | backgroundColor | RN-wrapper | `semantic.color.surfaceVariant.default` | `MaterialTheme.colorScheme.surfaceVariant` | `theme.colors.surfaceVariant` | `color.surfaceVariant.default` |
| default | borderColor | RN-wrapper | `semantic.color.border.default` | `MaterialTheme.colorScheme.outline` | `theme.colors.outline` | `color.border.default` |
| unavailable | opacity | RN-wrapper | `0.4` | `Modifier.alpha(0.4f)` | `.opacity(0.4)` | n/a |

**Visual — radialIcon icon:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| size | RN-wrapper | `18` | `Modifier.size(18.dp)` | `.frame(width: 18, height: 18)` | ESCALATE — propose `icon.sm = 18` |
| color (active) | RN-wrapper | `semantic.color.primary.default` | `MaterialTheme.colorScheme.primary` | `theme.colors.primary` | `color.primary.default` |
| color (inactive) | RN-wrapper | `semantic.color.onSurface.muted` | `MaterialTheme.colorScheme.onSurfaceVariant` | `theme.colors.onSurfaceVariant` | `color.onSurface.muted` |
| color (unavailable) | RN-wrapper | `'transparent'` | `Color.Transparent` | `.clear` | n/a |

**Animation — radial expansion:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| targetScale | RN-wrapper | `0` (collapsed) / `1` (expanded) | `animateFloatAsState(...)` | `.scaleEffect(expanded ? 1 : 0)` | n/a |
| targetOpacity | RN-wrapper | `0` (collapsed) / `1` (expanded) | `animateFloatAsState(...)` | `.opacity(expanded ? 1 : 0)` | n/a |
| duration | RN-wrapper | `200` | `animationSpec = tween(durationMillis = 200)` | `.animation(.easeInOut(duration: 0.2))` | n/a |
| spring damping | RN-wrapper | `15` | `spring(dampingRatio = 0.15)` | `.spring(response: 0.15, dampingFraction: 0.8)` | n/a |
| spring stiffness | RN-wrapper | `150` | `spring(stiffness = 150f)` | `.spring(response: 0.2, dampingFraction: 0.8)` | n/a |
| rotation | RN-wrapper | `0` (collapsed) / `180` (expanded) | `animateFloatAsState(...)` | `.rotationEffect(.degrees(expanded ? 180 : 0))` | n/a |

### OverlayToggle

**Source files read:**
- LaneShadow: `react-native/components/map/overlay-toggle.tsx`
- Framework: `react-native/Libraries/Components/Pressable/Pressable.js`, `react-native-paper`

**Layout — container:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| alignItems | RN-wrapper | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.alignment(.center)` | n/a |
| backgroundColor | RN-wrapper | `semantic.color.surface.default` | `MaterialTheme.colorScheme.surface` | `theme.colors.surface` | `color.surface.default` |
| borderRadius | RN-wrapper | `semantic.radius.xl` | `Modifier.clip(RoundedCornerShape(radius.xl.dp))` | `.cornerRadius(radius.xl)` | `radius.xl` (24) |
| paddingHorizontal | RN-wrapper | `semantic.space.xs` | `Modifier.padding(horizontal = space.xs.dp)` | `.padding(.horizontal, space.xs)` | `space.xs` (4) |
| paddingVertical | RN-wrapper | `semantic.space.xs` | `Modifier.padding(vertical = space.xs.dp)` | `.padding(.vertical, space.xs)` | `space.xs` (4) |
| elevation | RN-wrapper | `semantic.elevation[2]` | `Modifier.shadow(elevation = 2.dp, ...)` | `.shadow(radius: 4, y: 2)` | `elevation[2]` |

**Layout — item:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| width/height | RN-wrapper | `semantic.space['3xl']` | `Modifier.size(space['3xl'].dp)` | `.frame(width: space.3xl, height: space.3xl)` | `space.3xl` (48) |
| borderRadius | RN-wrapper | `semantic.radius.lg` | `Modifier.clip(RoundedCornerShape(radius.lg.dp))` | `.cornerRadius(radius.lg)` | `radius.lg` (16) |
| marginHorizontal | RN-wrapper | `4` | `Modifier.padding(horizontal = 4.dp)` | `.padding(.horizontal, 4)` | `space.xs` (4) |

**Visual — item colors (by state):**

| State | Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|---|
| disabled | backgroundColor | RN-wrapper | `'transparent'` | `Color.Transparent` | `.clear` | n/a |
| selected | backgroundColor | RN-wrapper | `semantic.color.accent.default` | `MaterialTheme.colorScheme.tertiary` (accent) | `theme.colors.accent` | `color.accent.default` |
| default | backgroundColor | RN-wrapper | `semantic.color.surfaceVariant.default` | `MaterialTheme.colorScheme.surfaceVariant` | `theme.colors.surfaceVariant` | `color.surfaceVariant.default` |
| disabled | opacity | RN-wrapper | `0.5` | `Modifier.alpha(0.5f)` | `.opacity(0.5)` | n/a |

**Visual — item icon:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| size | RN-wrapper | `semantic.space.lg` | `Modifier.size(space.lg.dp)` | `.frame(width: space.lg, height: space.lg)` | `space.lg` (16) |
| color (selected) | RN-wrapper | `semantic.color.onSurface.default` | `MaterialTheme.colorScheme.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |
| color (disabled) | RN-wrapper | `semantic.color.onSurface.disabled` | `MaterialTheme.colorScheme.onSurface.copy(alpha = 0.38f)` | `theme.colors.onSurface.disabled` | `color.onSurface.disabled` |
| color (default) | RN-wrapper | `semantic.color.onSurface.muted` | `MaterialTheme.colorScheme.onSurfaceVariant` | `theme.colors.onSurfaceVariant` | `color.onSurface.muted` |
| color (unavailable) | RN-wrapper | `'transparent'` | `Color.Transparent` | `.clear` | n/a |

### PlanFAB

**Source files read:**
- LaneShadow: `react-native/components/map/plan-fab.tsx`
- Framework: `react-native-safe-area-context`, `react-native-paper`

**Layout — container:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| position | RN-wrapper | `'absolute'` | `Modifier.wrapContentSize(Alignment.BottomEnd).offset(...)` | `.overlay(...)` | n/a |
| bottom | RN-wrapper | `0` | `Modifier.align(Alignment.BottomEnd)` | `.frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .bottomTrailing)` | n/a |
| left/right | RN-wrapper | `0` | `Modifier.fillMaxWidth()` | `.frame(maxWidth: .infinity)` | n/a |
| flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| justifyContent | RN-wrapper | `'flex-end'` | `horizontalArrangement = Arrangement.End` | `.frame(maxWidth: .infinity, alignment: .trailing)` | n/a |
| alignItems | RN-wrapper | `'flex-end'` | `verticalAlignment = Alignment.Bottom` | `.frame(maxHeight: .infinity, alignment: .bottom)` | n/a |
| pointerEvents | RN-wrapper | `'box-none'` | `Modifier.pointerEvents(PointerEvent.PassThrough)` | `.allowsHitTesting(false)` | n/a |

**Layout — container padding:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| paddingHorizontal | RN-wrapper | `semantic.space.xl` | `Modifier.padding(horizontal = space.xl.dp)` | `.padding(.horizontal, space.xl)` | `space.xl` (24) |
| paddingBottom | RN-wrapper | `insets.bottom + semantic.space.lg` | `Modifier.padding(bottom = (WindowInsets.systemBars.bottom + space.lg).dp)` | `.padding(.bottom, insets.bottom + space.lg)` | `safeArea.bottom + space.lg` |

**Layout — button:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| variant | RN-wrapper | `'default'` (Button) | `ButtonDefaults.buttonColors(...)` (primary variant) | `.buttonStyle(.borderedProminent)` | custom primary variant |
| size | RN-wrapper | `'sm'` | `Modifier.height(40.dp)` (sm) | `.controlSize(.small)` | Button `sm` size |
| borderRadius | RN-wrapper | `semantic.radius.xl` | `Modifier.clip(RoundedCornerShape(radius.xl.dp))` | `.cornerRadius(radius.xl)` | `radius.xl` (24) |

**Visual — button shadow:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| shadowColor | RN-wrapper | `semantic.color.primary.default` | `android:shadowColor` (elevation API) | `.shadow(color: theme.colors.primary)` | `color.primary.default` |
| shadowOffset | RN-wrapper | `{ width: 0, height: semantic.space.xs }` | `android:shadowDy` (elevation API) | `.shadow(radius: space.md, y: space.xs)` | `space.xs` (4) |
| shadowRadius | RN-wrapper | `semantic.space.md` | `android:shadowRadius` (elevation API) | `.shadow(radius: space.md)` | `space.md` (12) |
| shadowOpacity | RN-wrapper | `0.35` | `android:shadowAlpha` (elevation API) | n/a (Color.opacity) | n/a |
| elevation | RN-wrapper | `4` | `Modifier.shadow(elevation = 4.dp, ...)` | n/a (use shadow) | ESCALATE — propose `elevation[4]` |

**Visual — button colors:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| backgroundColor | RN-wrapper | `semantic.color.primary.default` | `MaterialTheme.colorScheme.primary` | `theme.colors.primary` | `color.primary.default` |
| icon color | RN-wrapper | `semantic.color.onSurface.default` | `MaterialTheme.colorScheme.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |
| text color | RN-wrapper | `semantic.color.onSurface.default` | `MaterialTheme.colorScheme.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |

**Typography — button text:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| variant | RN-wrapper | `labelLarge` (Paper) | `MaterialTheme.typography.labelLarge` | `theme.font.labelLarge` / `.font(.headline)` | Paper `labelLarge` |
| numberOfLines | RN-wrapper | `1` | `TextStyle(overflow = TextOverflow.Ellipsis)` | `.lineLimit(1)` | n/a |

**Visual — icon:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| size | RN-wrapper | `24` | `Modifier.size(24.dp)` | `.frame(width: 24, height: 24)` | ESCALATE — propose `icon.md = 24` |
| color | RN-wrapper | `semantic.color.onSurface.default` | `MaterialTheme.colorScheme.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |

### SearchResultMarker

**Source files read:**
- LaneShadow: `react-native/components/map/search-result-marker.tsx`
- Framework: `@rnmapbox/maps`, `expo-haptics`, `react-native-svg`

**Layout — marker (container):**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| width/height | RN-wrapper | `MARKER_SIZE = 36` | `Modifier.size(36.dp)` | `.frame(width: 36, height: 36)` | ESCALATE — propose `space.xl - space.md = 36` |
| alignItems | RN-wrapper | `'center'` | `horizontalAlignment = Alignment.CenterHorizontally` | `.frame(maxWidth: .infinity)` | n/a |
| justifyContent | RN-wrapper | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.frame(maxHeight: .infinity)` | n/a |
| transform (selected) | RN-wrapper | `[{ scale: 1.15 }]` | `Modifier.graphicsLayer { scaleX = 1.15f; scaleY = 1.15f }` | `.scaleEffect(1.15)` | n/a |

**Visual — SVG outer ring:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| radius | RN-wrapper | `MARKER_SIZE / 2 - 1.5` | `r = 16.5` | `radius: 16.5` | n/a (geometry) |
| fill (selected) | RN-wrapper | `infoColor` | `Color.Info` | `Color.info` | `color.info.default` |
| fill (default) | RN-wrapper | `${infoColor}26` (15% alpha) | `infoColor.copy(alpha = 0.15f)` | `Color.info.opacity(0.15)` | `color.info.default` + alpha |
| stroke | RN-wrapper | `infoColor` | `Color.Info` | `Color.info` | `color.info.default` |
| strokeWidth (selected) | RN-wrapper | `2` | `strokeWidth = 2.dp` | `lineWidth: 2` | n/a |
| strokeWidth (default) | RN-wrapper | `1.5` | `strokeWidth = 1.5.dp` | `lineWidth: 1.5` | n/a |
| strokeDasharray (default) | RN-wrapper | `'4 3'` | `pathEffect = PathEffect.dashPathEffect(4f, 3f)` | `dash: [4, 3]` | n/a |

**Visual — SVG inner circle:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| radius | RN-wrapper | `innerRadius = radius - 3` | `r = 13.5` | `radius: 13.5` | n/a (geometry) |
| fill | RN-wrapper | `surfaceColor` (default) / `infoColor` (selected) | `Color.Surface` / `Color.Info` | `Color.surface / Color.info` | `color.surface.default` / `color.info.default` |

**Typography — index number:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| position | RN-wrapper | `'absolute'` | `Modifier.wrapContentSize(Alignment.Center).offset(...)` | `.overlay(...)` | n/a |
| fontSize | RN-wrapper | `13` | `TextStyle(fontSize = 13.sp)` | `.font(.system(size: 13))` | ESCALATE — propose `type.label.xs = 13` |
| fontWeight | RN-wrapper | `'700'` | `FontWeight.Bold` (700) | `.weight(.bold)` | n/a |
| textAlign | RN-wrapper | `'center'` | `TextStyle(textAlign = TextAlign.Center)` | `.multilineTextAlignment(.center)` | n/a |
| color (selected) | RN-wrapper | `semantic.color.onPrimary.default` | `MaterialTheme.colorScheme.onPrimary` | `theme.colors.onPrimary` | `color.onPrimary.default` |
| color (default) | RN-wrapper | `infoColor` | `Color.Info` | `Color.info` | `color.info.default` |

**Interaction — haptic feedback:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| impact style | RN-wrapper | `Haptics.ImpactFeedbackStyle.Light` | `HapticFeedbackConstants.CONTEXT_CLICK` (light) | `.impact(.light)` | n/a (platform API) |

### WaypointMarker

**Source files read:**
- LaneShadow: `react-native/components/map/waypoint-marker.tsx`
- Framework: `@rnmapbox/maps`, `expo-haptics`, `react-native-svg`

**Layout — marker (container):**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| width | RN-wrapper | `pinWidth = size * 0.8` | `Modifier.width((size * 0.8).dp)` | `.frame(width: size * 0.8)` | n/a (geometry) |
| height | RN-wrapper | `pinHeight = size` | `Modifier.height(size.dp)` | `.frame(height: size)` | `size` prop (default 32) |
| alignItems | RN-wrapper | `'center'` | `horizontalAlignment = Alignment.CenterHorizontally` | `.frame(maxWidth: .infinity)` | n/a |
| justifyContent | RN-wrapper | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.frame(maxHeight: .infinity)` | n/a |

**Visual — SVG pin shape:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| pinWidth | RN-wrapper | `size * 0.8` | `pinWidth = size * 0.8` | `pinWidth = size * 0.8` | n/a (geometry) |
| pinHeight | RN-wrapper | `size` | `pinHeight = size` | `pinHeight = size` | n/a (geometry) |
| circleRadius | RN-wrapper | `pinWidth / 2` | `circleRadius = pinWidth / 2` | `circleRadius = pinWidth / 2` | n/a (geometry) |
| stemHeight | RN-wrapper | `pinHeight * 0.4` | `stemHeight = pinHeight * 0.4` | `stemHeight = pinHeight * 0.4` | n/a (geometry) |
| innerCircleRadius | RN-wrapper | `circleRadius * 0.6` | `innerCircleRadius = circleRadius * 0.6` | `innerCircleRadius = circleRadius * 0.6` | n/a (geometry) |

**Visual — pin colors (by kind):**

| Kind | Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|---|
| on-route | fill | RN-wrapper | `semantic.color.waypointOnRoute.default` | `Color.WaypointOnRoute` | `Color.waypointOnRoute` | `color.waypointOnRoute.default` (ESCALATE) |
| off-route | fill | RN-wrapper | `semantic.color.waypointOffRoute.default` | `Color.WaypointOffRoute` | `Color.waypointOffRoute` | `color.waypointOffRoute.default` (ESCALATE) |
| mixed | fill | RN-wrapper | `semantic.color.waypointMixed.default` | `Color.WaypointMixed` | `Color.waypointMixed` | `color.waypointMixed.default` (ESCALATE) |
| selected | fill | RN-wrapper | `semantic.color.tertiary.default` | `Color.Tertiary` | `Color.tertiary` | `color.tertiary.default` (ESCALATE) |
| inner circle | fill | RN-wrapper | `semantic.color.surface.default` | `Color.Surface` | `Color.surface` | `color.surface.default` |
| status dot | fill | RN-wrapper | `markerColor` (kind color) | `markerColor` | `markerColor` | varies by kind |

**Visual — pin colors (by state):**

| State | Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|---|
| pressed | fill | RN-wrapper | `colorSet?.pressed` or `baseColor` | `colorSet.pressed ?: baseColor` | `colorSet.pressed ?? baseColor` | `color.{kind}.pressed` (ESCALATE) |
| disabled | fill | RN-wrapper | `semantic.color.muted.default` | `Color.Muted` | `Color.muted` | `color.muted.default` |

**Visual — selected state ring:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| radius | RN-wrapper | `circleRadius + 2` | `r = circleRadius + 2` | `radius: circleRadius + 2` | n/a (geometry) |
| fill | RN-wrapper | `'none'` | n/a | n/a | n/a |
| stroke | RN-wrapper | `semantic.color.tertiary.default` | `Color.Tertiary` | `Color.tertiary` | `color.tertiary.default` (ESCALATE) |
| strokeWidth | RN-wrapper | `2` | `strokeWidth = 2.dp` | `lineWidth: 2` | n/a |

**Layout — labelContainer (optional index):**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| position | RN-wrapper | `'absolute'` | `Modifier.wrapContentSize(Alignment.TopCenter).offset(...)` | `.overlay(...)` | n/a |
| top | RN-wrapper | `circleRadius * 1.5 - 10` | `offset(y = (circleRadius * 1.5 - 10).dp)` | `.offset(y: circleRadius * 1.5 - 10)` | n/a (geometry) |
| width/height | RN-wrapper | `20` | `Modifier.size(20.dp)` | `.frame(width: 20, height: 20)` | ESCALATE — propose `space.md + space.xs = 20` |

**Interaction — haptic feedback:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| impact style | RN-wrapper | `Haptics.ImpactFeedbackStyle.Light` | `HapticFeedbackConstants.CONTEXT_CLICK` (light) | `.impact(.light)` | n/a (platform API) |

## DESIGN NOTES

- Preserve RN spacing, composition hierarchy, and edge-case fixtures such as long labels, loading, and error states.
- Use fixed cameras, fixed coordinates, and deterministic map visuals for screenshot capture.
- Avoid unstyled Material defaults and route all styling through the documented Compose theme layer.

## VERIFICATION GATES

- pnpm type-check:native
- ./android/gradlew assembleDebug
- Validate sandbox scenarios for this task in the native sandbox host

## DEPENDENCIES

- UI-013

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
