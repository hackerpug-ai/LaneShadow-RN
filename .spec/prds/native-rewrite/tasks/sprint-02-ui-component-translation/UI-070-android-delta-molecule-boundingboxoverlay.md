# UI-070: Android delta molecule — `BoundingBoxOverlay` (interactive region-selection polygon on map for UC-OFFL-02); Google Maps SDK polygon overlay + touch handlers

**Task ID:** UI-070
**Sprint:** Sprint 2 - UI Component Translation and Fidelity Sandbox
**Assigned To:** kotlin-implementer
**Reviewer:** kotlin-reviewer
**Estimate:** 480 min
**Type:** [FEATURE]
**Status:** Planned
**Phase:** Delta Molecule
**Quality Score:** 115/115

---

## BACKGROUND

Sprint 2 translates the React Native baseline into native platform components and sandbox scenarios before rider-facing feature sprints resume. This task covers the `delta-molecule` slice for `Android delta molecule — BoundingBoxOverlay (interactive region-selection polygon on map for UC-OFFL-02); Google Maps SDK polygon overlay + touch handlers`.

**Objective:** Implement Android delta molecule — `BoundingBoxOverlay` (interactive region-selection polygon on map for UC-OFFL-02); Google Maps SDK polygon overlay + touch handlers as Jetpack Compose work with parity to the RN baseline, token-only styling, and sandbox coverage.

**Success State:** A reviewer can open the Android sandbox, browse this task's scenarios, and confirm naming, interface, theme, state, accessibility, and layout parity against RN.

## CRITICAL CONSTRAINTS

### MUST
- Implement the listed components or compositions with parity-aligned naming and interfaces: Android delta molecule — `BoundingBoxOverlay` (interactive region-selection polygon on map for UC-OFFL-02); Google Maps SDK polygon overlay + touch handlers.
- Use only the LaneShadow core theme contract locked by `UI-001`: `tokens/semantic/semantic.tokens.json` as the source of truth, generated `native-theme` outputs as the shared packaging layer, and the platform theme entry points (`LaneShadowTheme` on Android, `.laneShadowTheme()` on iOS) for colors, spacing, typography, radii, elevation, and state styling.
- Register sandbox scenarios for default, interactive, and edge-case states with RN reference labels.
- Treat parity as spec-driven against the delta composition contract when there is no existing RN baseline story.

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
**THEN** The listed components or compositions exist in the correct Android Compose directories with parity-aligned names and signatures: Android delta molecule — `BoundingBoxOverlay` (interactive region-selection polygon on map for UC-OFFL-02); Google Maps SDK polygon overlay + touch handlers.
**Verify:** `printf "%s\n" "Android delta molecule — `BoundingBoxOverlay` (interactive region-selection polygon on map for UC-OFFL-02); Google Maps SDK polygon overlay + touch handlers"`

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
| TC-1 | AC-1 | The listed components or compositions exist in the correct Android Compose directories with parity-aligned names and signatures: Android delta molecule — `BoundingBoxOverlay` (interactive region-selection polygon on map for UC-OFFL-02); Google Maps SDK polygon overlay + touch handlers. | `printf "%s\n" "Android delta molecule — `BoundingBoxOverlay` (interactive region-selection polygon on map for UC-OFFL-02); Google Maps SDK polygon overlay + touch handlers"` |
| TC-2 | AC-2 | All visuals use the LaneShadow core theme contract from `UI-001` and render correctly in both color modes without hardcoded UI primitives. | `rg -n "Token consumption\|light and dark" .spec/prds/native-rewrite/08d-component-parity-spec.md .spec/prds/native-rewrite/08-design-system.md` |
| TC-3 | AC-3 | Each listed component has deterministic sandbox coverage with RN reference labels and explicit state variants where applicable. | `rg -n "RN reference\|scenario\|interactive states" .spec/prds/native-rewrite/tasks/sprint-02-ui-component-translation/SPRINT.md` |
| TC-4 | AC-4 | Accessibility labels, touch targets, keyboard or safe-area handling, and motion or state parity behave correctly for this component family. | `rg -n "Accessibility\|Keyboard handling\|RTL support\|Animation parity\|State parity" .spec/prds/native-rewrite/08d-component-parity-spec.md` |
| TC-5 | AC-5 | The composition renders using only previously defined platform components, deterministic fixtures, and no backend or auth dependencies. | `rg -n "deterministic\|fixtures\|no auth\|no backend" .spec/prds/native-rewrite/tasks/sprint-02-ui-component-translation/SPRINT.md` |
| TC-6 | ALL | Repo validation gates remain green for the touched workspace when this task is complete. | `pnpm type-check:native && ./android/gradlew assembleDebug` |

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
| BoundingBoxOverlay | **RN baseline pending — properties derived from task spec and UC-OFFL-02** | n/a (NEW component — delta) | `android/app/src/main/java/com/laneshadow/ui/molecules/BoundingBoxOverlay.kt` | 1 variant (interactive region-selection polygon) × 3 states (idle/editing/confirmed) × map SDK integration (Google Maps Polygon) |

## STYLE PROPERTIES MATRIX

> Exhaustive enumeration of every style property from both sources per `08f-translation-protocol.md`. Columns: Category | Property | Source in source | Android equivalent | iOS equivalent | Token mapping. `ESCALATE` = no token covers the value — add a proposed token to DECISIONS.md before implementing.
>
> **Token reference** (from `tokens/semantic/semantic.tokens.json`): space xs=4 sm=8 md=12 lg=16 xl=24 2xl=32 3xl=48 4xl=64; radius none=0 sm=4 md=8 lg=16 xl=24 2xl=32 full=9999; elevation[2] shadowOffset=0/2 shadowOpacity=0.05 shadowRadius=4 androidElevation=2. **Paper labelLarge**: fontFamily=sans-serif-medium, fontWeight=500, fontSize=14, lineHeight=20, letterSpacing=0.1. **Paper labelSmall**: fontFamily=sans-serif-medium, fontWeight=500, fontSize=11, lineHeight=16, letterSpacing=0.5. **semantic.type.label.md**: fontSize=14, lineHeight=20, fontWeight=500. **semantic.type.body.sm**: fontSize=14, lineHeight=21, fontWeight=400.

### BoundingBoxOverlay

**Source files read:**
- LaneShadow: **RN baseline pending — properties derived from task spec**
- Framework: n/a (NEW component — delta)
- Use case: `.spec/prds/native-rewrite/11-uc-offline.md` (UC-OFFL-02: Select Region for Download)

> **Note**: This is a **NEW delta component** — no RN baseline exists. Properties are derived from the task description ("interactive region-selection polygon on map for UC-OFFL-02; Google Maps SDK polygon overlay + touch handlers") and UC-OFFL-02 which specifies: "draggable/zoom-reactive polygon overlay rendered atop the map".

**Layout — polygon (Google Maps SDK):**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|---|
| bounds | Task spec | `LatLngBounds` (southWest, northEast) | `LatLngBounds.builder().include(...).build()` | `GMSCoordinateBounds` | n/a |
| strokeWidth | Task spec | `2` | `strokeWidth = 2f` | `strokeWidth = 2` | ESCALATE — propose `borderWidth.thin = 2` |
| strokeColor | Task spec | `color.primary.default` | `strokeColor = ContextCompat.getColor(context, R.color.primary)` | `strokeColor = theme.colors.primary` | `color.primary.default` |
| fillColor | Task spec | `color.primary.default` with 0.1 alpha | `fillColor = (primary with 0.1 alpha)` | `fillColor = theme.colors.primary.withAlphaComponent(0.1)` | ESCALATE — `opacity.boundingBoxFill = 0.1` |
| zIndex | Task spec | `1` (above map, below markers) | `zIndex = 1f` | `zIndex = 1` | n/a |
| clickable | Task spec | `false` (polygon itself not tappable) | `clickable = false` | `isTappable = false` | n/a |

**Layout — corner handles (optional, for editing):**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|---|
| handleCount | Task spec | `4` (one per corner) | Loop 4 times | ForEach 0..<4 | n/a |
| handleSize | Task spec | `24` | `Modifier.size(24.dp)` | `.frame(width: 24, height: 24)` | ESCALATE — propose `size.boundingBoxHandle = 24` |
| handleBorderRadius | Task spec | `radius.full` (circle) | `CircleShape` | `Circle()` | `radius.full` |
| handleColor | Task spec | `color.surface.default` | `LaneShadowTheme.colors.surface` | `theme.colors.surface` | `color.surface.default` |
| handleBorder | Task spec | `2px color.primary.default` | `Modifier.border(2.dp, primary, CircleShape)` | `.overlay(Circle().stroke(..., lineWidth: 2))` | `color.primary.default` |
| handlePosition | Task spec | `at each corner` | `Marker(position = corner, ...)` | `GMSMarker(position: corner)` | n/a |
| handleIcon | Task spec | `drag indicator` | `Icon(imageVector = Icons.Default.DragHandle, ...)` | `UIImage(systemName: "line.3.horizontal")` | n/a |
| handleIconSize | Task spec | `16` | `Modifier.size(16.dp)` | `.frame(width: 16, height: 16)` | ESCALATE — propose `iconSize.sm = 16` |
| handleIconColor | Task spec | `color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |
| draggable | Task spec | `true` (when editing) | `Marker.draggable = true` | `isDraggable = true` | n/a |

**Visual — states:**

| State | Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|---|
| idle | strokeWidth | Task spec | `2` | `strokeWidth = 2f` | `strokeWidth = 2` | `borderWidth.thin` |
| idle | strokeColor | Task spec | `color.primary.default` | `strokeColor = primary` | `strokeColor = theme.colors.primary` | `color.primary.default` |
| idle | handlesVisible | Task spec | `false` | Hide markers | Hide markers | n/a |
| editing | strokeWidth | Task spec | `3` (thicker when editable) | `strokeWidth = 3f` | `strokeWidth = 3` | ESCALATE — propose `borderWidth.boundingBoxEditing = 3` |
| editing | strokeColor | Task spec | `color.primary.default` | `strokeColor = primary` | `strokeColor = theme.colors.primary` | `color.primary.default` |
| editing | handlesVisible | Task spec | `true` | Show markers at corners | Show markers at corners | n/a |
| confirmed | strokeColor | Task spec | `color.success.default` (green) | `strokeColor = success` | `strokeColor = theme.colors.success` | `color.success.default` |
| confirmed | handlesVisible | Task spec | `false` | Hide markers | Hide markers | n/a |

**Animation — handle drag:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|---|
| animationType | Task spec | `none` (direct 1:1 drag) | No animation — direct marker drag | No animation | n/a |
| dragResponse | Task spec | `immediate` | `onMarkerDrag` callback updates bounds | `didDragMarker` callback | n/a |
| boundsUpdate | Task spec | `on every drag event` | `Polygon.points = new corners` | `polygon.polygon = new corners` | n/a |

**Interaction:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|---|
| accessibilityRole | Task spec | `'none'` (visual overlay) | `Modifier.semantics { invisibleToUser() }` | `.accessibilityElement(.isAccessibilityElement(false))` | n/a |
| accessibilityLabel | Task spec | `"Bounding box from {sw} to {ne}"` | `contentDescription = "Bounding box..."` | `.accessibilityLabel("Bounding box...")` | n/a |
| testID | Task spec | passed via prop | `Modifier.testTag(testID)` | `.accessibilityIdentifier(testID)` | n/a |
| touch handling | Task spec | `via corner handles` | `Marker.onDragEnd` | `didDragMarker` | n/a |

**State — props:**

| State | Source | Type | Android | iOS | Token |
|---|---|---|---|---|---|---|
| bounds | Task spec | `LatLngBounds` | `val bounds: LatLngBounds` | `var bounds: GMSCoordinateBounds` | n/a |
| isEditable | Task spec | `Boolean` | `val isEditable: Boolean` | `var isEditable: Bool` | n/a |
| onBoundsChanged | Task spec | `(LatLngBounds) -> Unit` | `val onBoundsChanged: (LatLngBounds) -> Unit` | `var onBoundsChanged: (GMSCoordinateBounds) -> Void` | n/a |

## DESIGN NOTES

- Treat parity as spec-driven against the delta composition contract when no RN baseline story exists.
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
