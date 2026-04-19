# UI-066: Android delta molecule — `Speedometer` (radial speed gauge with speed-limit color states for UC-NAV-04); Compose Canvas with arc path

**Task ID:** UI-066
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

Sprint 2 translates the React Native baseline into native platform components and sandbox scenarios before rider-facing feature sprints resume. This task covers the `delta-molecule` slice for `Android delta molecule — Speedometer (radial speed gauge with speed-limit color states for UC-NAV-04); Compose Canvas with arc path`.

**Objective:** Implement Android delta molecule — `Speedometer` (radial speed gauge with speed-limit color states for UC-NAV-04); Compose Canvas with arc path as Jetpack Compose work with parity to the RN baseline, token-only styling, and sandbox coverage.

**Success State:** A reviewer can open the Android sandbox, browse this task's scenarios, and confirm naming, interface, theme, state, accessibility, and layout parity against RN.

## CRITICAL CONSTRAINTS

### MUST
- Implement the listed components or compositions with parity-aligned naming and interfaces: Android delta molecule — `Speedometer` (radial speed gauge with speed-limit color states for UC-NAV-04); Compose Canvas with arc path.
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
**THEN** The listed components or compositions exist in the correct Android Compose directories with parity-aligned names and signatures: Android delta molecule — `Speedometer` (radial speed gauge with speed-limit color states for UC-NAV-04); Compose Canvas with arc path.
**Verify:** `printf "%s\n" "Android delta molecule — `Speedometer` (radial speed gauge with speed-limit color states for UC-NAV-04); Compose Canvas with arc path"`

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
| TC-1 | AC-1 | The listed components or compositions exist in the correct Android Compose directories with parity-aligned names and signatures: Android delta molecule — `Speedometer` (radial speed gauge with speed-limit color states for UC-NAV-04); Compose Canvas with arc path. | `printf "%s\n" "Android delta molecule — `Speedometer` (radial speed gauge with speed-limit color states for UC-NAV-04); Compose Canvas with arc path"` |
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
| Speedometer | **RN baseline pending — properties derived from task spec and UC-NAV-04** | n/a (NEW component — delta) | `android/app/src/main/java/com/laneshadow/ui/molecules/Speedometer.kt` | 1 variant (radial speed gauge) × 3 states (under-limit/near-limit/over-limit) × animation (needle sweep, color transitions) |

## STYLE PROPERTIES MATRIX

> Exhaustive enumeration of every style property from both sources per `08f-translation-protocol.md`. Columns: Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping. `ESCALATE` = no token covers the value — add a proposed token to DECISIONS.md before implementing.
>
> **Token reference** (from `tokens/semantic/semantic.tokens.json`): space xs=4 sm=8 md=12 lg=16 xl=24 2xl=32 3xl=48 4xl=64; radius none=0 sm=4 md=8 lg=16 xl=24 2xl=32 full=9999; elevation[2] shadowOffset=0/2 shadowOpacity=0.05 shadowRadius=4 androidElevation=2. **Paper labelLarge**: fontFamily=sans-serif-medium, fontWeight=500, fontSize=14, lineHeight=20, letterSpacing=0.1. **Paper labelSmall**: fontFamily=sans-serif-medium, fontWeight=500, fontSize=11, lineHeight=16, letterSpacing=0.5. **semantic.type.label.md**: fontSize=14, lineHeight=20, fontWeight=500. **semantic.type.body.sm**: fontSize=14, lineHeight=21, fontWeight=400.

### Speedometer

**Source files read:**
- LaneShadow: **RN baseline pending — properties derived from task spec**
- Framework: n/a (NEW component — delta)
- Use case: `.spec/prds/native-rewrite/09-uc-navigation.md` (UC-NAV-04: Real-Time Metrics)

> **Note**: This is a **NEW delta component** — no RN baseline exists. Properties are derived from the task description ("radial speed gauge with speed-limit color states for UC-NAV-04; Compose Canvas with arc path") and UC-NAV-04 which specifies: "circular/radial speed gauge with speed-limit color state (green/yellow/red)".

**Layout — container:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| size | Task spec | `120 × 120` (circular gauge) | `Modifier.size(120.dp)` | `.frame(width: 120, height: 120)` | ESCALATE — propose `size.speedometer = 120` |
| aspectRatio | Task spec | `1:1` (circular) | n/a (size handles) | n/a | n/a |

**Layout — gauge arc:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|---|
| arcStartAngle | Task spec | `135°` (bottom-left, 7 o'clock) | `startAngle = 135f` | `.degrees(135)` | n/a |
| arcEndAngle | Task spec | `405°` (bottom-right, 5 o'clock via 270° sweep) | `endAngle = 405f` (sweep 270°) | `.degrees(405)` | n/a |
| arcStrokeWidth | Task spec | `8` (thick arc for visibility) | `style = Stroke(width = 8.dp)` | `.stroke(lineWidth: 8)` | ESCALATE — propose `size.speedometerArcWidth = 8` |
| arcBorderRadius | Task spec | `4` (rounded caps) | `Stroke(cap = StrokeCap.Round)` or `pathEffect = PathEffect.roundCorner(4.dp)` | `.lineCap(.round)` | `radius.sm = 4` ✓ |

**Layout — needle:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|---|
| needleLength | Task spec | `45` (from center to edge) | Calculated: `(size / 2) - padding` | Same | n/a |
| needleWidth | Task spec | `2` (thin needle) | `Modifier.width(2.dp)` | `.frame(width: 2)` | ESCALATE — propose `size.speedometerNeedleWidth = 2` |
| needlePivot | Task spec | `center` (rotates from center) | `rotate(angle, pivot = center)` | `.rotationEffect(Angle(degrees: angle), anchor: .center)` | n/a |
| needleRotationRange | Task spec | `135° to 405°` (270° total sweep) | `135f + (speed / maxSpeed) * 270f` | Same | n/a |

**Layout — center pivot:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|---|
| pivotSize | Task spec | `8` (small circle at center) | `Modifier.size(8.dp)` | `.frame(width: 8, height: 8)` | `space.xs = 4`, ESCALATE — propose `size.speedometerPivot = 8` |
| pivotBorderRadius | Task spec | `radius.full` (circle) | `CircleShape` | `Circle()` | `radius.full` |

**Visual — colors (by speed-limit state):**

| State | Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|---|
| under-limit | arcColor | Task spec | `color.success.default` (green) | `LaneShadowTheme.colors.success` | `theme.colors.success` | `color.success.default` |
| under-limit | needleColor | Task spec | `color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |
| near-limit | arcColor | Task spec | `color.warning.default` (yellow) | `LaneShadowTheme.colors.warning` | `theme.colors.warning` | `color.warning.default` |
| near-limit | threshold | Task spec | `speedLimit * 0.9` (90% of limit) | Calculated: `if (speed >= limit * 0.9)` | Same | n/a |
| over-limit | arcColor | Task spec | `color.danger.default` (red) | `LaneShadowTheme.colors.danger` | `theme.colors.danger` | `color.danger.default` |
| over-limit | threshold | Task spec | `speedLimit * 1.0` (at or over limit) | Calculated: `if (speed >= limit)` | Same | n/a |

**Visual — pivot colors:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|---|
| pivotColor | Task spec | `color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |
| pivotBorder | Task spec | `1px color.border.default` | `Modifier.border(1.dp, ...)` | `.overlay(Circle().stroke(...))` | `color.border.default` |

**Typography — speed value (center overlay):**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|---|
| text | Task spec | `speed` (numeric, e.g., "45") | `Text("${speed.toInt()}")` | `Text("\(speed)")` | n/a |
| fontSize | Task spec | `24` (large, readable) | `24.sp` | `.font(.system(size: 24, weight: .bold))` | ESCALATE — propose `type.speedometerValue.fontSize = 24` |
| fontWeight | Task spec | `'700'` (bold) | `FontWeight.Bold` | `.bold` | ESCALATE — `type.speedometerValue.fontWeight = 700` |
| color | Task spec | `color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |
| textAlign | Task spec | `'center'` | `TextAlign.Center` | `.multilineTextAlignment(.center)` | n/a |
| offset | Task spec | `below center` (y+35 from center) | `Modifier.offset(y = 35.dp)` | `.offset(y: 35)` | ESCALATE — propose `space.lg + space.md = 28` or `offset.speedometerValue = 35` |

**Typography — unit label:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|---|
| text | Task spec | `"mph"` or `"km/h"` | `Text(unit)` | `Text(unit)` | n/a |
| fontSize | Paper labelSmall | 11 | `11.sp` | `.font(.system(size: 11, weight: .medium))` | ESCALATE — `type.label.sm.fontSize = 11` |
| fontWeight | Paper labelSmall | `'500'` | `FontWeight.Medium` | `.medium` | `type.label.sm.fontWeight` |
| color | Task spec | `color.onSurface.muted` | `LaneShadowTheme.colors.onSurfaceMuted` | `theme.colors.onSurfaceMuted` | `color.onSurface.muted` |
| offset | Task spec | `below speed value` | `Modifier.offset(y = 55.dp)` | `.offset(y: 55)` | ESCALATE — propose `offset.speedometerUnit = 55` |

**Animation — needle response:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|---|
| animationType | Task spec | `animateFloat` (needle rotation) | `animateFloatAsState(targetValue = rotation)` | `.animation(.easeInOut(duration: 0.3))` | n/a |
| duration | Task spec | `300ms` (smooth but responsive) | `durationMillis = 300` | `0.3` | ESCALATE — propose `motion.duration.medium = 300` |
| easing | Task spec | `easeInOut` | `EaseInOut` | `.easeInOut` | n/a |
| colorTransition | Task spec | `animateColor` (arc color state change) | `animateColorAsState(targetValue = arcColor)` | `.animation(.easeInOut(duration: 0.2))` | ESCALATE — propose `motion.duration.colorState = 200` |

**Interaction:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|---|
| accessibilityRole | Task spec | `'summary'` (displays live metric) | `Modifier.semantics { role = Role.Img }` | `.accessibilityAddTraits(.isImage)` | n/a |
| accessibilityLabel | Task spec | `"Speed: {speed} {unit}"` | `contentDescription = "Speed: $speed $unit"` | `.accessibilityLabel("Speed: \(speed) \(unit)")` | n/a |
| accessibilityState | Task spec | `"Over speed limit"` when over | `stateDescription = if (overLimit) "Over speed limit" else null` | `.accessibilityHint(overLimit ? "Over speed limit" : nil)` | n/a |
| testID | Task spec | passed via prop | `Modifier.testTag(testID)` | `.accessibilityIdentifier(testID)` | n/a |

**State — props:**

| State | Source | Type | Android | iOS | Token |
|---|---|---|---|---|---|---|
| speed | Task spec | `Float` (0-200+) | `val speed: Float` | `var speed: CGFloat` | n/a |
| speedLimit | Task spec | `Float` (e.g., 55, 65, 75) | `val speedLimit: Float` | `var speedLimit: CGFloat` | n/a |
| unit | Task spec | `String` ("mph" or "km/h") | `val unit: String` | `var unit: String` | n/a |

## DESIGN NOTES

- Treat parity as spec-driven against the delta composition contract when no RN baseline story exists.
- Provide a static capture mode for motion-heavy or animated states so screenshot diffs remain deterministic.
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
