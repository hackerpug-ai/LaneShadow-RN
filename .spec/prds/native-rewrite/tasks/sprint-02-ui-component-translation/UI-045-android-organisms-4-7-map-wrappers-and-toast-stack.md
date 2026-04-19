# UI-045: Android organisms 4/7 — map wrappers & toast stack (Google Maps SDK): `MapViewWrapper`, `MapboxMapView`, `MapToastStack`

**Task ID:** UI-045
**Sprint:** Sprint 2 - UI Component Translation and Fidelity Sandbox
**Assigned To:** kotlin-implementer
**Reviewer:** kotlin-reviewer
**Estimate:** 480 min
**Type:** [FEATURE]
**Status:** Planned
**Phase:** Organisms
**Quality Score:** 115/115

---

## BACKGROUND

Sprint 2 translates the React Native baseline into native platform components and sandbox scenarios before rider-facing feature sprints resume. This task covers the `organisms` slice for `Android organisms 4/7 — map wrappers & toast stack (Google Maps SDK): MapViewWrapper, MapboxMapView, MapToastStack`.

**Objective:** Implement Android organisms 4/7 — map wrappers & toast stack (Google Maps SDK): `MapViewWrapper`, `MapboxMapView`, `MapToastStack` as Jetpack Compose work with parity to the RN baseline, token-only styling, and sandbox coverage.

**Success State:** A reviewer can open the Android sandbox, browse this task's scenarios, and confirm naming, interface, theme, state, accessibility, and layout parity against RN.

## CRITICAL CONSTRAINTS

### MUST
- Implement the listed components or compositions with parity-aligned naming and interfaces: `MapViewWrapper`, `MapboxMapView`, `MapToastStack`.
- Use only the LaneShadow core theme contract locked by `UI-001`: `tokens/semantic/semantic.tokens.json` as the source of truth, generated `native-theme` outputs as the shared packaging layer, and the platform theme entry points (`LaneShadowTheme` on Android, `.laneShadowTheme()` on iOS) for colors, spacing, typography, radii, elevation, and state styling.
- Register sandbox scenarios for default, interactive, and edge-case states with RN reference labels.
- Use deterministic composition fixtures so complex sheets, maps, chat, and list layouts are diffable.

### NEVER
- Add unrelated feature wiring or backend dependencies to satisfy sandbox rendering.
- Introduce hardcoded UI primitives or platform-only naming drift.

### STRICTLY
- Preserve light and dark parity, accessibility labels, and deterministic fixtures for every scenario.

## DELIVERABLES

- android/app/src/main/java/com/laneshadow/ui/organisms/**
- android/app/src/debug/java/com/laneshadow/sandbox/stories/OrganismsStories.kt — story set aggregated into AppStories.all
- android/app/src/test/java/com/laneshadow/**
- android/app/src/androidTest/java/com/laneshadow/**

## ACCEPTANCE CRITERIA

### AC-1
**GIVEN** The RN baseline and atomic parity contract define the expected components and interfaces.
**WHEN** This task is implemented.
**THEN** The listed components or compositions exist in the correct Android Compose directories with parity-aligned names and signatures: `MapViewWrapper`, `MapboxMapView`, `MapToastStack`.
**Verify:** `printf "%s\n" "`MapViewWrapper`, `MapboxMapView`, `MapToastStack`"`

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
| TC-1 | AC-1 | The listed components or compositions exist in the correct Android Compose directories with parity-aligned names and signatures: `MapViewWrapper`, `MapboxMapView`, `MapToastStack`. | `printf "%s\n" "`MapViewWrapper`, `MapboxMapView`, `MapToastStack`"` |
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
- android/app/src/main/java/com/laneshadow/ui/organisms/**
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
| MapViewWrapper | `react-native/components/map/map-view.tsx` | `node_modules/react-native-maps` (MapView, Marker, Polyline, PROVIDER_GOOGLE); `node_modules/react-native-maps/lib/android/src/...` | `android/app/src/main/java/com/laneshadow/ui/organisms/MapViewWrapper.kt` | 1 fixed layout × 2 providers (Google Maps/Mapbox) × imperative camera controls |
| MapboxMapView | `react-native/components/map/mapbox-map-view.tsx` | `node_modules/@rnmapbox/maps` (MapView, Camera, MarkerView, ShapeSource, LineLayer, UserLocation); `node_modules/@rnmapbox/maps/lib/android/...` | `android/app/src/main/java/com/laneshadow/ui/organisms/MapboxMapView.kt` | 1 fixed layout × 2 themes (dark/light) × imperative camera controls |
| MapToastStack | `react-native/components/map/map-toast-stack.tsx` | `node_modules/react-native-reanimated` (Animated.View, FadeIn, FadeOut); `node_modules/react-native/Libraries/Components/Pressable/Pressable.js` | `android/app/src/main/java/com/laneshadow/ui/organisms/MapToastStack.kt` | 1 fixed layout × max 85% width × auto-fade (5s) × 2 states (streaming/idle) |

## STYLE PROPERTIES MATRIX

> Exhaustive enumeration of every style property from both sources per `08f-translation-protocol.md`. Columns: Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping. `ESCALATE` = no token covers the value — add a proposed token to DECISIONS.md before implementing.
>
> **Token reference** (from `tokens/semantic/semantic.tokens.json`): space xs=4 sm=8 md=12 lg=16 xl=24 2xl=32 3xl=48 4xl=64; radius none=0 sm=4 md=8 lg=16 xl=24 2xl=32 full=9999; elevation[2] shadowOffset=0/2 shadowOpacity=0.05 shadowRadius=4 androidElevation=2.

### MapViewWrapper (Google Maps SDK)

**Source files read:**
- LaneShadow: `react-native/components/map/map-view.tsx`
- Framework: `node_modules/react-native-maps`, Google Maps SDK for Android

**Layout — container:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| width | RN-wrapper | `'100%'` | `Modifier.fillMaxWidth()` | `.frame(maxWidth: .infinity)` | n/a |
| height | RN-wrapper | `'100%'` | `Modifier.fillMaxHeight()` | `.frame(maxHeight: .infinity)` | n/a |
| flex | RN-wrapper | `1` | `Modifier.weight(1f)` | `frame(maxWidth: .infinity, maxHeight: .infinity)` | n/a |

**Layout — web fallback:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| padding | RN-wrapper | `space.lg` = 16 | `Modifier.padding(16.dp)` | `.padding(16)` | `space.lg` |
| alignItems | RN-wrapper | `'center'` | `Modifier.align(Alignment.CenterHorizontally)` | `.frame(maxWidth: .infinity)` | n/a |
| justifyContent | RN-wrapper | `'center'` | `Modifier.align(Alignment.CenterVertically)` | `.frame(maxHeight: .infinity)` | n/a |
| backgroundColor | RN-wrapper | `color.surface.default` | `LaneShadowTheme.colors.surface` | `theme.colors.surface` | `color.surface.default` |

**Visual — map style (dark/light):**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| styleURL (dark) | RN-wrapper | `buildMapStyleFromTheme({ semantic, dark: true })` | `MapStyleOptions.loadRawResourceStyle(context, R.raw.map_style_dark)` | `darkModeStyleURL` | `color.map.dark` (custom) |
| styleURL (light) | RN-wrapper | `buildMapStyleFromTheme({ semantic, dark: false })` | `MapStyleOptions.loadRawResourceStyle(context, R.raw.map_style_light)` | `lightModeStyleURL` | `color.map.light` (custom) |

**Typography — web fallback:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| style | RN-wrapper | `bodyMedium` (Paper) | `LaneShadowTheme.typography.bodyMd` | `theme.typography.bodyMd` | `type.body.md` |
| color | RN-wrapper | `color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |

**Camera controls — imperative handle:**

| Method | Source | Android | iOS | Notes |
|---|---|---|---|---|
| setCameraPosition | RN-wrapper | `googleMap.animateCamera(...)` | `mapView.setCamera(...)` | Accepts {coordinates?, zoom?, duration} |
| zoomBy | RN-wrapper | `googleMap.animateToRegion(...)` | `mapView.setCamera(zoomLevel: ...)` | Positive = zoom in, negative = zoom out |
| recenterToUser | RN-wrapper | `googleMap.animateCamera(...)` | `mapView.setCamera(centerCoordinate: userLoc)` | Requires user location tracking |
| animateToRegion | RN-wrapper | `googleMap.animateToRegion(...)` | `mapView.setCamera(...)` | Region = {latitude, longitude, latitudeDelta, longitudeDelta} |
| fitToCoordinates | RN-wrapper | `googleMap.fitToCoordinates(...)` | `mapView.fitBounds(...)` | Accepts edgePadding option |

### MapboxMapView

**Source files read:**
- LaneShadow: `react-native/components/map/mapbox-map-view.tsx`
- Framework: `node_modules/@rnmapbox/maps`, Mapbox Maps SDK for Android

**Layout — container:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| width | RN-wrapper | `'100%'` | `Modifier.fillMaxWidth()` | `.frame(maxWidth: .infinity)` | n/a |
| height | RN-wrapper | `'100%'` | `Modifier.fillMaxHeight()` | `.frame(maxHeight: .infinity)` | n/a |
| flex | RN-wrapper | `1` | `Modifier.weight(1f)` | `frame(maxWidth: .infinity, maxHeight: .infinity)` | n/a |

**Layout — web fallback:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| alignItems | RN-wrapper | `'center'` | `Modifier.align(Alignment.CenterHorizontally)` | `.frame(maxWidth: .infinity)` | n/a |
| justifyContent | RN-wrapper | `'center'` | `Modifier.align(Alignment.CenterVertically)` | `.frame(maxHeight: .infinity)` | n/a |

**Visual — map style (dark/light):**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| styleURL (dark) | RN-wrapper | `MAP_STYLES.dark` | `Style.OUTDOORS` or `Style.DARK` | `Style.dark` | n/a (Mapbox constant) |
| styleURL (light) | RN-wrapper | `MAP_STYLES.light` | `Style.LIGHT` | `Style.light` | n/a (Mapbox constant) |

**Visual — marker:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| width | RN-wrapper | `24` | `24.dp` | `24` | ESCALATE — propose `space.markerSize = 24` |
| height | RN-wrapper | `24` | `24.dp` | `24` | ESCALATE — propose `space.markerSize = 24` |
| backgroundColor | RN-wrapper | `'#B87333'` (copper) | `Color(0xFFB87333)` | `Color(red: 0.72, green: 0.45, blue: 0.2)` | ESCALATE — propose `color.map.marker = #B87333` |
| borderRadius | RN-wrapper | `12` (half width) | `CircleShape` | `Circle()` | `radius.full` |
| borderWidth | RN-wrapper | `2` | `border(2.dp, ...)` | `overlay(stroke: lineWidth: 2)` | n/a |
| borderColor | RN-wrapper | `'#FFFFFF'` | `Color.White` | `Color.white` | n/a |

**Visual — polyline:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| strokeColor | RN-wrapper | `'#B87333'` (copper, default) | `Color(0xFFB87333)` | `Color(red: 0.72, green: 0.45, blue: 0.2)` | ESCALATE — propose `color.map.polyline = #B87333` |
| strokeWidth | RN-wrapper | `4` (default) | `4.dp` | `4` | ESCALATE — propose `space.mapPolylineWidth = 4` |
| lineOpacity | RN-wrapper | `1.0` | `1.0f` | `1.0` | n/a |

**Camera controls — imperative handle:**

| Method | Source | Android | iOS | Notes |
|---|---|---|---|---|
| setCamera | RN-wrapper (native) | `cameraRef.setCamera(...)` | `mapView.camera.setCamera(...)` | Accepts {center, zoom, pitch, heading, duration} |
| zoomIn / zoomOut | RN-wrapper (native) | `cameraRef.zoomTo(...)` | `mapView.camera.setCamera(zoomLevel: ...)` | Delta-based zoom |
| setCameraPosition | RN-wrapper (parity) | `setCamera(...)` with coordinate conversion | `setCamera(...)` with coordinate conversion | Google Maps format {latitude, longitude} → Mapbox [lng, lat] |
| zoomBy | RN-wrapper (parity) | `zoomTo(...)` | `setCamera(zoomLevel: ...)` | Positive = zoom in, negative = zoom out |
| recenterToUser | RN-wrapper (parity) | `setCamera(centerCoordinate: userLoc)` | `setCamera(centerCoordinate: userLoc)` | Requires user location tracking |
| animateToRegion | RN-wrapper (parity) | `setCamera(...)` with zoom calc | `setCamera(...)` with zoom calc | Converts Google Maps region to Mapbox camera |
| fitToCoordinates | RN-wrapper (parity) | `fitBounds(...)` | `mapView.camera.setBounds(...)` | Accepts padding option |

**Coordinate conversion:**

| Format | Source | Android | iOS | Notes |
|---|---|---|---|---|
| Google Maps | RN-wrapper | `{latitude: Double, longitude: Double}` | `{latitude: Double, longitude: Double}` | Standard geo format |
| Mapbox | RN-wrapper | `[longitude, latitude]` (Point) | `[longitude, latitude]` (CLLocationCoordinate2D) | GeoJSON spec |

### MapToastStack

**Source files read:**
- LaneShadow: `react-native/components/map/map-toast-stack.tsx`
- Framework: `node_modules/react-native-reanimated`, `node_modules/react-native/Libraries/Components/Pressable/Pressable.js`

**Layout — container:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| position | RN-wrapper | `'absolute'` | `Modifier.wrapContentSize(unbounded = true)` | `.frame(maxWidth: .infinity, maxHeight: .infinity)` | n/a |
| bottom | RN-wrapper | `bottomOffset` (prop) | `Modifier.offset(y = -bottomOffset.dp)` | `.offset(y: -bottomOffset)` | n/a (runtime prop) |
| paddingHorizontal | RN-wrapper | `space.lg` = 16 | `Modifier.padding(horizontal = 16.dp)` | `.padding(.horizontal, 16)` | `space.lg` |
| gap | RN-wrapper | `space.sm` = 8 | `Arrangement.spacedBy(8.dp)` | `Spacer(minLength: 8)` | `space.sm` |
| zIndex | RN-wrapper | `25` | `Modifier.zIndex(25)` | `.zIndex(25)` | n/a |

**Layout — toast:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| maxWidth | RN-wrapper | `85%` (of screen width) | `Modifier.fillMaxWidth(0.85f)` | `.frame(maxWidth: .infinity * 0.85)` | ESCALATE — propose `space.toastMaxWidthRatio = 0.85` |
| minWidth | RN-wrapper | `200` | `Modifier.widthIn(min = 200.dp)` | `.frame(minWidth: 200)` | ESCALATE — propose `space.toastMinWidth = 200` |
| paddingVertical | RN-wrapper | `space.sm` = 8 | `Modifier.padding(vertical = 8.dp)` | `.padding(.vertical, 8)` | `space.sm` |
| paddingHorizontal | RN-wrapper | `space.lg` = 16 | `Modifier.padding(horizontal = 16.dp)` | `.padding(.horizontal, 16)` | `space.lg` |
| borderRadius | RN-wrapper | `radius.xl` = 24 | `RoundedCornerShape(24.dp)` | `RoundedRectangle(cornerRadius: 24)` | `radius.xl` |

**Visual — toast container:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| backgroundColor | RN-wrapper | `color.surface.default` | `LaneShadowTheme.colors.surface` | `theme.colors.surface` | `color.surface.default` |
| borderWidth | RN-wrapper | `StyleSheet.hairlineWidth` (~1px) | `border(1.dp, ...)` | `overlay(stroke: lineWidth: 1)` | n/a |
| borderColor | RN-wrapper | `color.border.default` | `LaneShadowTheme.colors.border` | `theme.colors.border` | `color.border.default` |
| opacity | RN-wrapper | `0.92` | `alpha(0.92f)` | `.opacity(0.92)` | ESCALATE — propose `opacity.toast = 0.92` |
| shadow | RN-wrapper | `elevation[2]` | `Modifier.shadow(elevation = 2.dp, ...)` | `.shadow(radius: 4)` | `elevation[2]` |

**Typography — toast text:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| style | RN-wrapper | `type.body.sm` | `LaneShadowTheme.typography.bodySm` | `theme.typography.bodySm` | `type.body.sm` |
| color | RN-wrapper | `color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |
| numberOfLines | RN-wrapper | `2` | `maxLines = 2` | `.lineLimit(2)` | n/a |
| flexShrink | RN-wrapper | `1` | `Modifier.weight(1f)` | `layoutPriority(1)` | n/a |

**Animation — toast enter/exit:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| enterDuration | RN-wrapper | `200` (FadeIn) | `AnimatedVisibility(enters = fadeIn(animationSpec = tween(200)))` | `.opacity(0).animation(.easeInOut(duration: 0.2))` | ESCALATE — propose `duration.toastEnter = 200` |
| exitDuration | RN-wrapper | `300` (FadeOut) | `AnimatedVisibility(exits = fadeOut(animationSpec = tween(300)))` | `.opacity(0).animation(.easeInOut(duration: 0.3))` | ESCALATE — propose `duration.toastExit = 300` |

**Animation — auto-fade:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| autoFadeMs | RN-wrapper | `5000` (default) | `LaunchedEffect { delay(5000) }` | `.onReceive(timer) { ... }` | ESCALATE — propose `duration.toastAutoFade = 5000` |
| streaming behavior | RN-wrapper | Deferred until `status !== 'streaming'` | Skip timer while streaming | Skip timer while streaming | n/a |

**Layout — typing indicator:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| marginLeft | RN-wrapper | `space.xs` = 4 | `Modifier.padding(start = 4.dp)` | `.padding(.leading, 4)` | `space.xs` |
| paddingBottom | RN-wrapper | `2` | `Modifier.padding(bottom = 2.dp)` | `.padding(.bottom, 2)` | n/a |
| size | RN-wrapper | `'sm'` | `TypingIndicator(size = "sm")` | `TypingIndicator(size: .sm)` | n/a (component prop) |

## DESIGN NOTES

- Use deterministic composition fixtures so complex sheets, maps, chat, and stacked layouts remain diffable.
- Use fixed cameras, fixed coordinates, and deterministic map visuals for screenshot capture.
- Avoid unstyled Material defaults and route all styling through the documented Compose theme layer.

## VERIFICATION GATES

- detekt --input android --config .detekt/config.yml
- ./android/gradlew assembleDebug
- Validate sandbox scenarios for this task in the native sandbox host

## DEPENDENCIES

- UI-037

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
