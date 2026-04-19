# UI-013: Android atoms 5/5 — map polyline atoms (Google Maps Compose SDK): `RoutePolyline`, `RoutePolylineComponent`, `DeviationPolyline`

**Task ID:** UI-013
**Sprint:** Sprint 2 - UI Component Translation and Fidelity Sandbox
**Assigned To:** kotlin-implementer
**Reviewer:** kotlin-reviewer
**Estimate:** 240 min
**Type:** [FEATURE]
**Status:** Planned
**Phase:** Atoms
**Quality Score:** 115/115

---

## BACKGROUND

Sprint 2 translates the React Native baseline into native platform components and sandbox scenarios before rider-facing feature sprints resume. This task covers the `atoms` slice for `Android atoms 5/5 — map polyline atoms (Google Maps Compose SDK): RoutePolyline, RoutePolylineComponent, DeviationPolyline`.

**Objective:** Implement Android atoms 5/5 — map polyline atoms (Google Maps Compose SDK): `RoutePolyline`, `RoutePolylineComponent`, `DeviationPolyline` as Jetpack Compose work with parity to the RN baseline, token-only styling, and sandbox coverage.

**Success State:** A reviewer can open the Android sandbox, browse this task's scenarios, and confirm naming, interface, theme, state, accessibility, and layout parity against RN.

## CRITICAL CONSTRAINTS

### MUST
- Implement the listed components or compositions with parity-aligned naming and interfaces: `RoutePolyline`, `RoutePolylineComponent`, `DeviationPolyline`.
- Use only the LaneShadow core theme contract locked by `UI-001`: `tokens/semantic/semantic.tokens.json` as the source of truth, generated `native-theme` outputs as the shared packaging layer, and the platform theme entry points (`LaneShadowTheme` on Android, `.laneShadowTheme()` on iOS) for colors, spacing, typography, radii, elevation, and state styling.
- Register sandbox scenarios for default, interactive, and edge-case states with RN reference labels.
- Cover all interactive states required by the parity spec for atomic controls and visuals.

### NEVER
- Add unrelated feature wiring or backend dependencies to satisfy sandbox rendering.
- Introduce hardcoded UI primitives or platform-only naming drift.

### STRICTLY
- Preserve light and dark parity, accessibility labels, and deterministic fixtures for every scenario.

## DELIVERABLES

- android/app/src/main/java/com/laneshadow/ui/atoms/**
- android/app/src/debug/java/com/laneshadow/sandbox/stories/AtomsStories.kt — story set aggregated into AppStories.all
- android/app/src/test/java/com/laneshadow/**
- android/app/src/androidTest/java/com/laneshadow/**

## ACCEPTANCE CRITERIA

### AC-1
**GIVEN** The RN baseline and atomic parity contract define the expected components and interfaces.
**WHEN** This task is implemented.
**THEN** The listed components or compositions exist in the correct Android Compose directories with parity-aligned names and signatures: `RoutePolyline`, `RoutePolylineComponent`, `DeviationPolyline`.
**Verify:** `printf "%s\n" "`RoutePolyline`, `RoutePolylineComponent`, `DeviationPolyline`"`

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
| TC-1 | AC-1 | The listed components or compositions exist in the correct Android Compose directories with parity-aligned names and signatures: `RoutePolyline`, `RoutePolylineComponent`, `DeviationPolyline`. | `printf "%s\n" "`RoutePolyline`, `RoutePolylineComponent`, `DeviationPolyline`"` |
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
- android/app/src/main/java/com/laneshadow/ui/atoms/**
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
| RoutePolyline | `react-native/components/map/route-polyline.tsx` | `node_modules/@rnmapbox/maps/lib/components/lineLayer.js` (LineLayer style properties); `node_modules/@rnmapbox/maps/lib/components/shapeSource.js` (ShapeSource onPress) | `android/app/src/main/java/com/laneshadow/ui/atoms/RoutePolyline.kt` | 3 segment types (overview/leg/overlay) × 4 overlay types (wind/rain/temperature/scenic) × 2 states (default/selected) |
| RoutePolylineComponent | `react-native/components/map/route-polyline-component.tsx` | `node_modules/@rnmapbox/maps/lib/components/lineLayer.js`; `node_modules/@rnmapbox/maps/lib/components/shapeSource.js`; `node_modules/@mapbox/polyline/src/index.js` (encodePolyline for geometry callback) | `android/app/src/main/java/com/laneshadow/ui/atoms/RoutePolylineComponent.kt` | Uses RoutePolyline data model; adds tap handling, highlight state, haptic feedback |
| DeviationPolyline | `react-native/components/map/deviation-polyline.tsx` | `node_modules/@rnmapbox/maps/lib/components/lineLayer.js`; `node_modules/@rnmapbox/maps/lib/components/shapeSource.js` | `android/app/src/main/java/com/laneshadow/ui/atoms/DeviationPolyline.kt` | 3 segment types (original/detour/reconnect) × 2 states (default/active) |

> **Library note:** RN baseline uses `@rnmapbox/maps` (Mapbox GL JS SDK). Android native equivalent uses Google Maps Compose SDK — different APIs, same visual output.

## STYLE PROPERTIES MATRIX

> Exhaustive enumeration of every style property from both sources per `08f-translation-protocol.md`. Columns: Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping. `ESCALATE` = no token covers the value — add a proposed token to DECISIONS.md before implementing.
>
> **Token reference** (from `tokens/semantic/semantic.tokens.json`): space xs=4 sm=8 md=12 lg=16 xl=24 2xl=32 3xl=48 4xl=64; radius none=0 sm=4 md=8 lg=16 xl=24 2xl=32 full=9999.

### RoutePolyline (data builder)

**Source files read:**
- LaneShadow: `react-native/components/map/route-polyline.tsx`
- Framework: `node_modules/@rnmapbox/maps/lib/components/lineLayer.js`

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | overview.strokeWidth | RN-wrapper | `6` | `Stroke.width(6.dp)` | `strokeWidth: 6` | ESCALATE — propose `polylineWidth.routeOverview = 6` |
| Layout | leg.strokeWidth | RN-wrapper | `4` | `Stroke.width(4.dp)` | `strokeWidth: 4` | ESCALATE — propose `polylineWidth.routeLeg = 4` |
| Layout | overlay.strokeWidth | RN-wrapper | `6` (wind/rain/temp) | `Stroke.width(6.dp)` | `strokeWidth: 6` | `polylineWidth.routeOverlay` (same as overview) |
| Visual | overview.color (selected) | RN-wrapper | `semantic.color.routeSelected.default` | `LaneShadowTheme.colors.routeSelected` | `theme.colors.routeSelected` | `color.routeSelected.default` |
| Visual | overview.color (alternate) | RN-wrapper | `semantic.color.routeAlternate.default` | `LaneShadowTheme.colors.routeAlternate` | `theme.colors.routeAlternate` | `color.routeAlternate.default` |
| Visual | leg.color (selected) | RN-wrapper | `semantic.color.routeSelected.default` | `LaneShadowTheme.colors.routeSelected` | `theme.colors.routeSelected` | `color.routeSelected.default` |
| Visual | leg.color (alternate) | RN-wrapper | `semantic.color.onSurface.muted` | `LaneShadowTheme.colors.onSurfaceMuted` | `theme.colors.onSurfaceMuted` | `color.onSurface.muted` |
| Visual | wind overlay.color | RN-wrapper | `getWindColor(level, semantic)` — dynamic | `LaneShadowTheme.colors.windXXX` | `theme.colors.windXXX` | ESCALATE — overlay color tokens not defined; propose `color.overlay.wind.mild/medium/extreme` |
| Visual | rain overlay.color | RN-wrapper | `getRainColor(level, semantic)` — dynamic | `LaneShadowTheme.colors.rainXXX` | `theme.colors.rainXXX` | ESCALATE — propose `color.overlay.rain.light/moderate/heavy` |
| Visual | temperature overlay.color | RN-wrapper | `getTemperatureColor(level, semantic)` — dynamic | `LaneShadowTheme.colors.tempXXX` | `theme.colors.tempXXX` | ESCALATE — propose `color.overlay.temp.cold/mild/hot` |
| Visual | lineCap | RN-wrapper | `'round'` (via Mapbox LineLayer default) | `Stroke.cap = RoundCap` / `Cap.round()` | `lineCap: .round` | n/a |
| Visual | lineJoin | RN-wrapper | `'round'` (via Mapbox LineLayer default) | `Stroke.join = RoundJoint` / `Join.round()` | `lineJoin: .round` | n/a |
| Visual | lineOpacity | RN-wrapper | `1.0` (explicit in RoutePolylineComponent) | `Stroke.opacity = 1.0f` | `strokeOpacity: 1.0` | n/a |
| Visual | geodesic | RN-wrapper | not set (Mapbox default: false) | `Polyline.geodesic(false)` | `isGeodesic: false` | n/a |
| Interaction | tappable | RN-wrapper | `ShapeSource onPress` callback | `Polyline clickable = true` + `Polyline.onClick` | `MKMapView delegate didSelectPolyline` | n/a |
| Interaction | zIndex | RN-wrapper | not set (Mapbox renders in ShapeSource order) | `Polyline.zIndex` — overlay segments above overview | `renderer.zPosition` | n/a |

### RoutePolylineComponent (tap handler + visual highlight)

**Source files read:**
- LaneShadow: `react-native/components/map/route-polyline-component.tsx`
- Framework: `node_modules/@rnmapbox/maps/lib/components/lineLayer.js`, `node_modules/expo-haptics/src/Haptics.ts`

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Visual | highlight.color | RN-wrapper | `semantic.color.tertiary.default` (when selected) | `LaneShadowTheme.colors.tertiary` | `theme.colors.tertiary` | `color.tertiary.default` |
| Visual | highlight.strokeWidth | RN-wrapper | `semantic.space.sm` = 8 | `Stroke.width(8.dp)` | `strokeWidth: 8` | `space.sm` ✓ |
| Visual | normal.strokeWidth fallback | RN-wrapper | `semantic.space.sm / 2` = 4 | `Stroke.width(4.dp)` | `strokeWidth: 4` | `space.sm / 2` (composed) |
| Interaction | hapticFeedback | RN-wrapper | `Haptics.impactAsync(ImpactFeedbackStyle.Medium)` | `LocalHapticFeedback.provideHapticFeedback(HapticFeedbackType.LongPress)` | `UIImpactFeedbackGenerator(style: .medium).impactOccurred()` | ESCALATE — propose `haptic.style.segmentSelect = medium` |
| Interaction | tap callback | RN-wrapper | `onSegmentSelect(segment: SegmentSelectData)` | `Polyline.onClick { segment -> callback(...) }` | `mapView(_:didSelect:)` delegate | n/a |
| Interaction | callback.geometry | RN-wrapper | Google Polyline encoded string via `@mapbox/polyline.encode` | `Polyline.encode()` | `MKPolyline.coordinates` | n/a (geometry encoding) |
| Interaction | callback.bounds | RN-wrapper | `{ northEast, southWest }` computed from coordinates | `LatLngBounds.builder()` | `MKMapRect` from coordinates | n/a |
| Interaction | callback.legIndex | RN-wrapper | parsed from segment ID (`leg-0` → 0) | `segmentId.split("-")[1].toInt()` | same parsing | n/a |
| Interaction | callback.segmentType | RN-wrapper | `'overview' \| 'leg' \| 'wind' \| 'rain' \| 'temp'` | `enum class SegmentType` | `enum SegmentType` | n/a |
| State | selectedSegmentId | RN-wrapper | prop drives `isHighlighted` bool | `selectedSegmentId: String?` prop | `selectedSegmentID: String?` prop | n/a |
| State | activeSegment | RN-wrapper | internal state from tap, resets on next tap | `remember { mutableStateOf<String?>(null) }` | `@State var activeSegment: String?` | n/a |

### DeviationPolyline

**Source files read:**
- LaneShadow: `react-native/components/map/deviation-polyline.tsx`
- Framework: `node_modules/@rnmapbox/maps/lib/components/lineLayer.js`

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | strokeWidth (default) | RN-wrapper | prop default `4` | `Stroke.width(width.dp)` | `strokeWidth: width` | ESCALATE — propose `polylineWidth.deviation = 4` |
| Layout | strokeWidth (active) | RN-wrapper | `strokeWidth + 2` = 6 | `Stroke.width((strokeWidth + 2).dp)` | `strokeWidth: strokeWidth + 2` | composed from base |
| Visual | original.color | RN-wrapper | `semantic.color.deviationOriginalRoute.default` (fallback: `semantic.color.muted.default`) | `LaneShadowTheme.colors.deviationOriginalRoute` | `theme.colors.deviationOriginalRoute` | ESCALATE — token missing; use `color.muted.default` |
| Visual | detour.color | RN-wrapper | `semantic.color.deviationDetourPath.default` (fallback: `semantic.color.orange.default`) | `LaneShadowTheme.colors.deviationDetourPath` | `theme.colors.deviationDetourPath` | ESCALATE — token missing; use `color.orange.default` |
| Visual | reconnect.color | RN-wrapper | `semantic.color.deviationReconnectPoint.default` (fallback: `semantic.color.success.default`) | `LaneShadowTheme.colors.deviationReconnectPoint` | `theme.colors.deviationReconnectPoint` | ESCALATE — token missing; use `color.success.default` |
| Visual | lineCap | RN-wrapper | `'round'` | `Stroke.cap = RoundCap` | `lineCap: .round` | n/a |
| Visual | lineJoin | RN-wrapper | `'round'` | `Stroke.join = RoundJoint` | `lineJoin: .round` | n/a |
| Visual | lineOpacity | RN-wrapper | `1.0` | `Stroke.opacity = 1.0f` | `strokeOpacity: 1.0` | n/a |
| State | isActive | RN-wrapper | prop drives stroke width increment | `isActive: Boolean` prop | `isActive: Bool` prop | n/a |

## DESIGN NOTES

- Cover baseline states and typography or icon behavior explicitly so later molecules inherit stable primitives.
- Use fixed cameras, fixed coordinates, and deterministic map visuals for screenshot capture.
- Avoid unstyled Material defaults and route all styling through the documented Compose theme layer.

## VERIFICATION GATES

- pnpm type-check:native
- ./android/gradlew assembleDebug
- Validate sandbox scenarios for this task in the native sandbox host

## DEPENDENCIES

- UI-001
- UI-002
- UI-003
- UI-011

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
