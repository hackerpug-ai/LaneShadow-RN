# UI-064: Android delta atom — `VoiceListeningVisualizer` (audio amplitude waveform atom for UC-VOICE-02); Compose custom Canvas + animateFloat

**Task ID:** UI-064
**Sprint:** Sprint 2 - UI Component Translation and Fidelity Sandbox
**Assigned To:** kotlin-implementer
**Reviewer:** kotlin-reviewer
**Estimate:** 240 min
**Type:** [FEATURE]
**Status:** Planned
**Phase:** Delta Atom
**Quality Score:** 115/115

---

## BACKGROUND

Sprint 2 translates the React Native baseline into native platform components and sandbox scenarios before rider-facing feature sprints resume. This task covers the `delta-atom` slice for `Android delta atom — VoiceListeningVisualizer (audio amplitude waveform atom for UC-VOICE-02); Compose custom Canvas + animateFloat`.

**Objective:** Implement Android delta atom — `VoiceListeningVisualizer` (audio amplitude waveform atom for UC-VOICE-02); Compose custom Canvas + animateFloat as Jetpack Compose work with parity to the RN baseline, token-only styling, and sandbox coverage.

**Success State:** A reviewer can open the Android sandbox, browse this task's scenarios, and confirm naming, interface, theme, state, accessibility, and layout parity against RN.

## CRITICAL CONSTRAINTS

### MUST
- Implement the listed components or compositions with parity-aligned naming and interfaces: Android delta atom — `VoiceListeningVisualizer` (audio amplitude waveform atom for UC-VOICE-02); Compose custom Canvas + animateFloat.
- Use only the LaneShadow core theme contract locked by `UI-001`: `tokens/semantic/semantic.tokens.json` as the source of truth, generated `native-theme` outputs as the shared packaging layer, and the platform theme entry points (`LaneShadowTheme` on Android, `.laneShadowTheme()` on iOS) for colors, spacing, typography, radii, elevation, and state styling.
- Register sandbox scenarios for default, interactive, and edge-case states with RN reference labels.
- Treat parity as spec-driven against the delta composition contract when there is no existing RN baseline story.

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
**THEN** The listed components or compositions exist in the correct Android Compose directories with parity-aligned names and signatures: Android delta atom — `VoiceListeningVisualizer` (audio amplitude waveform atom for UC-VOICE-02); Compose custom Canvas + animateFloat.
**Verify:** `printf "%s\n" "Android delta atom — `VoiceListeningVisualizer` (audio amplitude waveform atom for UC-VOICE-02); Compose custom Canvas + animateFloat"`

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
| TC-1 | AC-1 | The listed components or compositions exist in the correct Android Compose directories with parity-aligned names and signatures: Android delta atom — `VoiceListeningVisualizer` (audio amplitude waveform atom for UC-VOICE-02); Compose custom Canvas + animateFloat. | `printf "%s\n" "Android delta atom — `VoiceListeningVisualizer` (audio amplitude waveform atom for UC-VOICE-02); Compose custom Canvas + animateFloat"` |
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
| VoiceListeningVisualizer | **RN baseline pending — properties derived from task spec and UC-VOICE-02 voice interaction UX** | n/a (NEW component — delta) | `android/app/src/main/java/com/laneshadow/ui/atoms/VoiceListeningVisualizer.kt` | 1 variant (audio amplitude waveform) × 2 states (idle/recording) × animation (amplitude bars driven by audio input) |

## STYLE PROPERTIES MATRIX

> Exhaustive enumeration of every style property from both sources per `08f-translation-protocol.md`. Columns: Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping. `ESCALATE` = no token covers the value — add a proposed token to DECISIONS.md before implementing.
>
> **Token reference** (from `tokens/semantic/semantic.tokens.json`): space xs=4 sm=8 md=12 lg=16 xl=24 2xl=32 3xl=48 4xl=64; radius none=0 sm=4 md=8 lg=16 xl=24 2xl=32 full=9999; elevation[2] shadowOffset=0/2 shadowOpacity=0.05 shadowRadius=4 androidElevation=2. **Paper labelLarge**: fontFamily=sans-serif-medium, fontWeight=500, fontSize=14, lineHeight=20, letterSpacing=0.1. **Paper labelSmall**: fontFamily=sans-serif-medium, fontWeight=500, fontSize=11, lineHeight=16, letterSpacing=0.5. **semantic.type.label.md**: fontSize=14, lineHeight=20, fontWeight=500. **semantic.type.body.sm**: fontSize=14, lineHeight=21, fontWeight=400.

### VoiceListeningVisualizer

**Source files read:**
- LaneShadow: **RN baseline pending — properties derived from task spec**
- Framework: n/a (NEW component — delta)
- Use case: `.spec/artifacts/team-product/320-voice-interaction-ux.md` (voice interaction UX for motorcycle riding)

> **Note**: This is a **NEW delta component** — no RN baseline exists. Properties are derived from the task description ("audio amplitude waveform atom for UC-VOICE-02; Compose custom Canvas + animateFloat") and the voice interaction UX specification which shows a waveform visualization pattern: `●  ● ● ● ●  ●` with animated amplitude bars during recording.

**Layout — container:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| width | Task spec | `'100%'` (full width of parent) | `Modifier.fillMaxWidth()` | `.frame(maxWidth: .infinity)` | n/a |
| height | Task spec | `48` (to accommodate waveform bars) | `Modifier.height(48.dp)` | `.frame(height: 48)` | `space.2xl + space.sm` = 40, ESCALATE — propose `space.5xl = 56` or `size.waveformHeight = 48` |
| flexDirection | Task spec | `'row'` (horizontal waveform) | `Row(...)` | `HStack` | n/a |
| alignItems | Task spec | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.alignment(.center)` | n/a |
| justifyContent | Task spec | `'center'` (waveform centered) | `horizontalArrangement = Arrangement.Center` | n/a | n/a |
| gap | Task spec | `4` (spacing between amplitude bars) | `Spacer(Modifier.width(4.dp))` | `Spacer(minLength: 4)` | `space.xs` |

**Layout — amplitude bars:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| barCount | Task spec | `7` (fixed number of bars) | Loop 7 times | ForEach 0..<7 | n/a |
| barWidth | Task spec | `4` (thin bars) | `Modifier.width(4.dp)` | `.frame(width: 4)` | ESCALATE — propose `size.waveformBarWidth = 4` |
| barMinHeight | Task spec | `8` (minimum height when idle) | `Modifier.height(8.dp)` | `.frame(height: 8)` | ESCALATE — propose `size.waveformBarMinHeight = 8` |
| barMaxHeight | Task spec | `32` (maximum height during loud audio) | `Modifier.height(32.dp)` | `.frame(height: 32)` | ESCALATE — propose `size.waveformBarMaxHeight = 32` |
| barBorderRadius | Task spec | `2` (slightly rounded caps) | `RoundedCornerShape(2.dp)` | `RoundedRectangle(cornerRadius: 2)` | `radius.sm = 4` (nearest) or ESCALATE — `radius.xs = 2` |

**Visual — colors (by state):**

| State | Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|---|
| idle | backgroundColor | Task spec | `color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |
| idle | opacity | Task spec | `0.3` (subtle when not recording) | `Modifier.alpha(0.3f)` | `.opacity(0.3)` | ESCALATE — propose `opacity.waveformIdle = 0.3` |
| recording | backgroundColor | Task spec | `color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |
| recording | opacity | Task spec | `1.0` (full visibility when recording) | `Modifier.alpha(1f)` | `.opacity(1)` | n/a |

**Animation — amplitude response:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|---|
| animationType | Task spec | `animateFloat` (per-bar height animation) | `animateFloatAsState(targetValue = amplitude)` | `.animation(.easeInOut(duration: 0.1))` | n/a |
| duration | Task spec | `100ms` (fast response to audio) | `durationMillis = 100` | `0.1` | ESCALATE — propose `motion.duration.fast = 100` |
| easing | Task spec | `easeInOut` (smooth amplitude transitions) | `EaseInOut` | `.easeInOut` | n/a |
| amplitudeSource | Task spec | `audio amplitude` (0.0-1.0 from audio input) | Passed as `List<Float>` or `Flow<List<Float>>` | Passed as `[CGFloat]` or `@State` | n/a |
| idleAnimation | Task spec | `gentle pulse` (subtle breathing when idle) | `infiniteRepeatable(animation, ...)` | `.animation(.easeInOut(duration: 1.5).repeatForever())` | ESCALATE — propose `motion.duration.slow = 1500` |

**Typography — status label (optional):**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|---|
| text | UX spec | `"Listening..."` | `Text("Listening...")` | `Text("Listening...")` | n/a |
| fontSize | Paper labelSmall | 11 | `11.sp` | `11` | ESCALATE — `type.label.sm.fontSize = 11` |
| fontWeight | Paper labelSmall | `'500'` | `FontWeight.Medium` | `.medium` | `type.label.sm.fontWeight` |
| color | Task spec | `color.onSurface.muted` | `LaneShadowTheme.colors.onSurfaceMuted` | `theme.colors.onSurfaceMuted` | `color.onSurface.muted` |
| textAlign | Task spec | `'center'` | `TextAlign.Center` | `.multilineTextAlignment(.center)` | n/a |

**Interaction:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|---|
| accessibilityRole | Task spec | `'none'` (visual feedback only) | `Modifier.semantics { invisibleToUser() }` | `.accessibilityElement(.isAccessibilityElement(false))` | n/a |
| testID | Task spec | passed via prop | `Modifier.testTag(testID)` | `.accessibilityIdentifier(testID)` | n/a |

**State — recording state:**

| State | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|---|
| isRecording | Task spec | `boolean` prop | drives animation target (idle pulse vs amplitude-driven) | same | n/a |
| amplitudes | Task spec | `List<Float>` or `Flow<List<Float>>` | 0.0-1.0 values driving bar heights | same | n/a |

## DESIGN NOTES

- Treat parity as spec-driven against the delta composition contract when no RN baseline story exists.
- Provide a static capture mode for motion-heavy or animated states so screenshot diffs remain deterministic.
- Avoid unstyled Material defaults and route all styling through the documented Compose theme layer.

## VERIFICATION GATES

- pnpm type-check:native
- ./android/gradlew assembleDebug
- Validate sandbox scenarios for this task in the native sandbox host

## DEPENDENCIES

- UI-003

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
