# UI-035: Android molecules 11/12 — auth & onboarding molecules: `AuthCard`, `TopographicBackground`, `DownloadErrorSheet`, `WifiRequiredSheet`

**Task ID:** UI-035
**Sprint:** Sprint 2 - UI Component Translation and Fidelity Sandbox
**Assigned To:** kotlin-implementer
**Reviewer:** kotlin-reviewer
**Estimate:** 240 min
**Type:** [FEATURE]
**Status:** Planned
**Phase:** Molecules
**Quality Score:** 115/115

---

## BACKGROUND

Sprint 2 translates the React Native baseline into native platform components and sandbox scenarios before rider-facing feature sprints resume. This task covers the `molecules` slice for `Android molecules 11/12 — auth & onboarding molecules: AuthCard, TopographicBackground, DownloadErrorSheet, WifiRequiredSheet`.

**Objective:** Implement Android molecules 11/12 — auth & onboarding molecules: `AuthCard`, `TopographicBackground`, `DownloadErrorSheet`, `WifiRequiredSheet` as Jetpack Compose work with parity to the RN baseline, token-only styling, and sandbox coverage.

**Success State:** A reviewer can open the Android sandbox, browse this task's scenarios, and confirm naming, interface, theme, state, accessibility, and layout parity against RN.

## CRITICAL CONSTRAINTS

### MUST
- Implement the listed components or compositions with parity-aligned naming and interfaces: `AuthCard`, `TopographicBackground`, `DownloadErrorSheet`, `WifiRequiredSheet`.
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
**THEN** The listed components or compositions exist in the correct Android Compose directories with parity-aligned names and signatures: `AuthCard`, `TopographicBackground`, `DownloadErrorSheet`, `WifiRequiredSheet`.
**Verify:** `printf "%s\n" "`AuthCard`, `TopographicBackground`, `DownloadErrorSheet`, `WifiRequiredSheet`"`

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
| TC-1 | AC-1 | The listed components or compositions exist in the correct Android Compose directories with parity-aligned names and signatures: `AuthCard`, `TopographicBackground`, `DownloadErrorSheet`, `WifiRequiredSheet`. | `printf "%s\n" "`AuthCard`, `TopographicBackground`, `DownloadErrorSheet`, `WifiRequiredSheet`"` |
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
| AuthCard | `react-native/components/auth/auth-card.tsx` | `node_modules/react-native/Libraries/Components/View/View.js`; `node_modules/react-native-paper/src/core/theming.tsx` (useTheme) | `android/app/src/main/java/com/laneshadow/ui/molecules/AuthCard.kt` | 1 layout × title/no-title × footer/no-footer |
| TopographicBackground | `react-native/components/auth/topographic-background.tsx` | `node_modules/react-native-svg/src/elements/Svg.tsx`; `node_modules/react-native/Libraries/Components/View/View.js` | `android/app/src/main/java/com/laneshadow/ui/molecules/TopographicBackground.kt` | 1 layout × opacity prop (default 0.1) |
| DownloadErrorSheet | `react-native/components/onboarding/download-error-sheet.tsx` | `node_modules/@gorhom/bottom-sheet/src/components/bottomSheet/BottomSheet.tsx`; `node_modules/react-native-paper/src/components/Button/Button.tsx` | `android/app/src/main/java/com/laneshadow/ui/molecules/DownloadErrorSheet.kt` | 1 layout × retryCount 0/1/2/3+ (show support link) |
| WifiRequiredSheet | `react-native/components/onboarding/wifi-required-sheet.tsx` | `node_modules/@gorhom/bottom-sheet/src/components/bottomSheet/BottomSheet.tsx`; `node_modules/react-native-paper/src/components/Button/Button.tsx` | `android/app/src/main/java/com/laneshadow/ui/molecules/WifiRequiredSheet.kt` | 1 layout × 1 fixed state |

## STYLE PROPERTIES MATRIX

> Exhaustive enumeration of every style property from both sources per `08f-translation-protocol.md`. Columns: Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping. `ESCALATE` = no token covers the value — add a proposed token to DECISIONS.md before implementing.
>
> **Token reference** (from `tokens/semantic/semantic.tokens.json`): space xs=4 sm=8 md=12 lg=16 xl=24 2xl=32 3xl=48 4xl=64; radius none=0 sm=4 md=8 lg=16 xl=24 2xl=32 full=9999; elevation[4] shadowOffset=0/4 shadowOpacity=0.15 shadowRadius=8 androidElevation=4.

### AuthCard

**Source files read:**
- LaneShadow: `react-native/components/auth/auth-card.tsx`
- Framework: `node_modules/react-native/Libraries/Components/View/View.js`, `node_modules/react-native-paper/src/core/theming.tsx`

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | borderWidth | RN-wrapper | 1 | `Modifier.border(1.dp, ...)` | `.overlay(RoundedRectangle(...).stroke(..., lineWidth: 1))` | ESCALATE — propose `borderWidth.thin = 1` |
| Layout | backgroundColor | RN-wrapper | `semantic.color.card.default` | `LaneShadowTheme.colors.card` | `theme.colors.card` | `color.card.default` |
| Layout | borderColor | RN-wrapper | `semantic.color.border.default` | `LaneShadowTheme.colors.border` | `theme.colors.border` | `color.border.default` |
| Layout | borderRadius | RN-wrapper | `semantic.radius.lg` = 16 | `RoundedCornerShape(16.dp)` | `RoundedRectangle(cornerRadius: 16)` | `radius.lg` |
| Layout | padding | RN-wrapper | `semantic.space.xl` = 24 | `Modifier.padding(24.dp)` | `.padding(24)` | `space.xl` |
| Layout | gap | RN-wrapper | `semantic.space.md` = 12 | `Arrangement.spacedBy(12.dp)` | `Spacing(12)` | `space.md` |
| Typography — title | variant | Paper | `titleMedium` | `MaterialTheme.typography.titleMedium` | `.font(.titleMedium)` | `type.title.md` |
| Typography — title | color | RN-wrapper | `semantic.color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |
| Visual | elevation | RN-wrapper | `semantic.elevation[4]` | `Modifier.shadow(elevation = 4.dp)` | `.shadow(...)` | `elevation[4]` |

### AuthDivider (exported from auth-card.tsx)

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| Layout | alignItems | RN-wrapper | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.alignment(.center)` | n/a |
| Layout | gap | RN-wrapper | `semantic.space.sm` = 8 | `Arrangement.spacedBy(8.dp)` | `Spacing(8)` | `space.sm` |
| Visual | dividerLine height | RN-wrapper | `StyleSheet.hairlineWidth` | `Modifier.height(1.dp)` | `.frame(height: 1)` | ESCALATE — propose `borderWidth.hairline = 1` |
| Visual | dividerLine backgroundColor | RN-wrapper | `semantic.color.divider.default` | `LaneShadowTheme.colors.divider` | `theme.colors.divider` | `color.divider.default` |
| Typography | variant | Paper | `labelMedium` | `MaterialTheme.typography.labelMedium` | `.font(.labelMedium)` | `type.label.sm` |
| Typography | color | RN-wrapper | `semantic.color.onSurface.subtle` | `LaneShadowTheme.colors.onSurfaceSubtle` | `theme.colors.onSurfaceSubtle` | `color.onSurface.subtle` |

### TopographicBackground

**Source files read:**
- LaneShadow: `react-native/components/auth/topographic-background.tsx`
- Framework: `node_modules/react-native-svg/src/elements/Svg.tsx`, `node_modules/react-native/Libraries/Components/View/View.js`

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | pointerEvents | RN-wrapper | `'none'` | `Modifier.pointerEvents(PointerEventType.PassThrough)` | `.allowsHitTesting(false)` | n/a |
| Layout | style | RN-wrapper | `StyleSheet.absoluteFillObject` | `Modifier.fillMaxSize()` | `.frame(maxWidth: .infinity, maxHeight: .infinity)` | n/a |
| Layout | viewBox | Svg | `"0 0 360 800"` | `ContentScale` + bounds | SwiftUI `SVGView` bounds | n/a |
| Visual | opacity (prop) | RN-wrapper | default 0.1 | `Modifier.alpha(0.1f)` | `.opacity(0.1)` | ESCALATE — propose `opacity.topographic = 0.1` |
| Visual | strokeWidth | RN-wrapper | `Math.max(1, Math.round(semantic.space.xs / 2))` = 2 | `Stroke(width = 2.dp)` | `.stroke(lineWidth: 2)` | `space.xs / 2` (computed) |
| Visual | RadialGradient cx/cy | RN-wrapper | `20% / 25%` | same | same | n/a |
| Visual | RadialGradient rx/ry | RN-wrapper | `60%` | same | same | n/a |
| Visual | RadialGradient stop 0% | RN-wrapper | `primary.default` stopOpacity 0.22 | `Color(0.22f).compositeOver(primary)` | same | `color.primary.default` |
| Visual | RadialGradient stop 55% | RN-wrapper | `primary.default` stopOpacity 0.08 | `Color(0.08f).compositeOver(primary)` | same | `color.primary.default` |
| Visual | RadialGradient stop 100% | RN-wrapper | `primary.default` stopOpacity 0 | `Color.Transparent` | `.clear` | `color.primary.default` |
| Visual | Path stroke | RN-wrapper | `onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |
| Visual | Path strokeOpacity | RN-wrapper | 0.06, 0.05, 0.045, 0.04, 0.035, 0.03 (gradient) | `Color(0.06f)` etc | `.opacity(0.06)` | ESCALATE — propose `opacity.topographicPath` values |
| Visual | Path fill | RN-wrapper | `'none'` | no fill | no fill | n/a |

### DownloadErrorSheet

**Source files read:**
- LaneShadow: `react-native/components/onboarding/download-error-sheet.tsx`
- Framework: `node_modules/@gorhom/bottom-sheet/src/components/bottomSheet/BottomSheet.tsx`, `node_modules/react-native-paper/src/components/Button/Button.tsx`, `react-native/components/sheets/bottom-sheet-wrapper.tsx`

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout — BottomSheetWrapper | paddingHorizontal | RN-wrapper | `semantic.space.lg` = 16 | `Modifier.padding(horizontal = 16.dp)` | `.padding(.horizontal, 16)` | `space.lg` |
| Layout — BottomSheetWrapper | paddingTop | RN-wrapper | `semantic.space.md` = 12 | `Modifier.padding(top = 12.dp)` | `.padding(.top, 12)` | `space.md` |
| Layout — BottomSheetWrapper | paddingBottom | RN-wrapper | `semantic.space.lg` = 16 | `Modifier.padding(bottom = 16.dp)` | `.padding(.bottom, 16)` | `space.lg` |
| Layout — BottomSheetWrapper | gap | RN-wrapper | `semantic.space.md` = 12 | `Arrangement.spacedBy(12.dp)` | `Spacing(12)` | `space.md` |
| Layout — content | alignItems | RN-wrapper | `'center'` | `horizontalAlignment = Alignment.CenterHorizontally` | `.frame(maxWidth: .infinity)` | n/a |
| Layout — content | padding | RN-wrapper | hardcoded 24 | `Modifier.padding(24.dp)` | `.padding(24)` | `space.xl` ✓ |
| Layout — content | gap | RN-wrapper | `semantic.space.lg` = 16 | `Arrangement.spacedBy(16.dp)` | `Spacing(16)` | `space.lg` |
| Layout — iconContainer | width/height | RN-wrapper | hardcoded 64 | `Modifier.size(64.dp)` | `.frame(width: 64, height: 64)` | ESCALATE — propose `space.4xl = 64` ✓ |
| Layout — iconContainer | borderRadius | RN-wrapper | `semantic.radius.full` = 9999 | `CircleShape` | `Circle()` | `radius.full` |
| Visual — iconContainer | backgroundColor | RN-wrapper | `semantic.color.danger.default` | `LaneShadowTheme.colors.danger` | `theme.colors.danger` | `color.danger.default` |
| Visual — iconContainer | marginBottom | RN-wrapper | hardcoded 16 | `Modifier.padding(bottom = 16.dp)` | `.padding(.bottom, 16)` | `space.lg` ✓ |
| Typography — icon | variant | Paper | `headlineLarge` | `MaterialTheme.typography.headlineLarge` | `.font(.headlineLarge)` | `type.display.xl` |
| Typography — icon | fontSize | RN-wrapper | hardcoded 32 | `32.sp` | `.font(.system(size: 32))` | ESCALATE — `type.display.xl.fontSize = 32` |
| Typography — icon | fontWeight | RN-wrapper | hardcoded `'700'` | `FontWeight.Bold` | `.bold` | ESCALATE — `fontWeight.bold = 700` |
| Typography — icon | color | RN-wrapper | `semantic.color.onPrimary.default` | `LaneShadowTheme.colors.onPrimary` | `theme.colors.onPrimary` | `color.onPrimary.default` |
| Typography — title | variant | Paper | `titleLarge` | `MaterialTheme.typography.titleLarge` | `.font(.titleLarge)` | `type.title.lg` |
| Typography — title | textAlign | RN-wrapper | `'center'` | `textAlign = TextAlign.Center` | `.multilineTextAlignment(.center)` | n/a |
| Typography — message | variant | Paper | `bodyMedium` | `MaterialTheme.typography.bodyMedium` | `.font(.bodyMedium)` | `type.body.md` |
| Typography — message | textAlign | RN-wrapper | `'center'` | `textAlign = TextAlign.Center` | `.multilineTextAlignment(.center)` | n/a |
| Typography — message | color | RN-wrapper | `semantic.color.onSurface.muted` | `LaneShadowTheme.colors.onSurfaceMuted` | `theme.colors.onSurfaceMuted` | `color.onSurface.muted` |
| Interaction | supportLink shown | RN-wrapper | `retryCount >= 3` | `if (retryCount >= 3)` | same | n/a |

### WifiRequiredSheet

**Source files read:**
- LaneShadow: `react-native/components/onboarding/wifi-required-sheet.tsx`
- Framework: `node_modules/@gorhom/bottom-sheet/src/components/bottomSheet/BottomSheet.tsx`, `node_modules/react-native-paper/src/components/Button/Button.tsx`, `react-native/components/sheets/bottom-sheet-wrapper.tsx`

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout — BottomSheetWrapper | Same as DownloadErrorSheet | — | — | — | — | — |
| Layout — content | Same as DownloadErrorSheet | — | — | — | — | — |
| Layout — iconContainer | Same as DownloadErrorSheet | — | — | — | — | — |
| Visual — iconContainer | backgroundColor | RN-wrapper | `semantic.color.warning.default` | `LaneShadowTheme.colors.warning` | `theme.colors.warning` | `color.warning.default` |
| Typography — icon | variant | Paper | `headlineLarge` | `MaterialTheme.typography.headlineLarge` | `.font(.headlineLarge)` | `type.display.xl` |
| Typography — icon | fontSize | RN-wrapper | hardcoded 24 | `24.sp` | `.font(.system(size: 24))` | ESCALATE — `type.display.md.fontSize = 24` |
| Typography — icon | fontWeight | RN-wrapper | hardcoded `'700'` | `FontWeight.Bold` | `.bold` | ESCALATE — `fontWeight.bold = 700` |
| Typography — icon | text | RN-wrapper | hardcoded `'WiFi'` | same | same | n/a |
| Typography — title | Same as DownloadErrorSheet | — | — | — | — | — |
| Typography — message | Same as DownloadErrorSheet | — | — | — | — | — |

## DESIGN NOTES

- Preserve RN spacing, composition hierarchy, and edge-case fixtures such as long labels, loading, and error states.
- Define detents, handles, scrim, keyboard avoidance, and safe-area behavior explicitly.
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
