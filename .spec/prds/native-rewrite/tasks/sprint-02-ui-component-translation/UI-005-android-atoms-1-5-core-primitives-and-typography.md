# UI-005: Android atoms 1/5 — core primitives & typography: `ThemedText`, `ThemedView`, `IconSymbol`, `Separator`, `DragHandle`, `SheetHandle`

**Task ID:** UI-005
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

Sprint 2 translates the React Native baseline into native platform components and sandbox scenarios before rider-facing feature sprints resume. This task covers the `atoms` slice for `Android atoms 1/5 — core primitives & typography: ThemedText, ThemedView, IconSymbol, Separator, DragHandle, SheetHandle`.

**Objective:** Implement Android atoms 1/5 — core primitives & typography: `ThemedText`, `ThemedView`, `IconSymbol`, `Separator`, `DragHandle`, `SheetHandle` as Jetpack Compose work with parity to the RN baseline, token-only styling, and sandbox coverage.

**Success State:** A reviewer can open the Android sandbox, browse this task's scenarios, and confirm naming, interface, theme, state, accessibility, and layout parity against RN.

## CRITICAL CONSTRAINTS

### MUST
- Implement the listed components or compositions with parity-aligned naming and interfaces: `ThemedText`, `ThemedView`, `IconSymbol`, `Separator`, `DragHandle`, `SheetHandle`.
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
**THEN** The listed components or compositions exist in the correct Android Compose directories with parity-aligned names and signatures: `ThemedText`, `ThemedView`, `IconSymbol`, `Separator`, `DragHandle`, `SheetHandle`.
**Verify:** `printf "%s\n" "`ThemedText`, `ThemedView`, `IconSymbol`, `Separator`, `DragHandle`, `SheetHandle`"`

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
| TC-1 | AC-1 | The listed components or compositions exist in the correct Android Compose directories with parity-aligned names and signatures: `ThemedText`, `ThemedView`, `IconSymbol`, `Separator`, `DragHandle`, `SheetHandle`. | `printf "%s\n" "`ThemedText`, `ThemedView`, `IconSymbol`, `Separator`, `DragHandle`, `SheetHandle`"` |
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
| ThemedText | `react-native/components/themed-text.tsx` | `node_modules/react-native-paper/src/components/Typography/Text.tsx` (Text with variant prop); `node_modules/react-native/Libraries/Text/Text.js` | `android/app/src/main/java/com/laneshadow/ui/atoms/ThemedText.kt` | 2 variants (default/defaultSemiBold) × Paper variants (bodyMedium/titleSmall) |
| ThemedView | `react-native/components/themed-view.tsx` | `node_modules/react-native/Libraries/Components/View/View.js` | `android/app/src/main/java/com/laneshadow/ui/atoms/ThemedView.kt` | 1 fixed layout (column) × 1 style (surface background) |
| IconSymbol | `react-native/components/ui/icon-symbol.tsx` (Android/web); `react-native/components/ui/icon-symbol.ios.tsx` (iOS) | `node_modules/@expo/vector-icons/MaterialCommunityIcons.js`; `node_modules/react-native/Libraries/Text/Text.js` (icon renders as text) | `android/app/src/main/java/com/laneshadow/ui/atoms/IconSymbol.kt` | All MaterialCommunityIcons.glyphMap icons × 2 props (size/color) |
| Separator | `react-native/components/ui/separator.tsx` | `node_modules/react-native/Libraries/Components/View/View.js` | `android/app/src/main/java/com/laneshadow/ui/atoms/Separator.kt` | 2 orientations (horizontal/vertical) × 1 fixed dimension (1px line) |
| DragHandle | `react-native/components/ui/drag-handle.tsx` | `node_modules/react-native/Libraries/Components/View/View.js` | `android/app/src/main/java/com/laneshadow/ui/atoms/DragHandle.kt` | 1 fixed size (36×4) × 3 configurable props (width/height/borderRadius) |
| SheetHandle | `react-native/components/sheets/sheet-handle.tsx` | `node_modules/react-native/Libraries/Components/View/View.js` | `android/app/src/main/java/com/laneshadow/ui/atoms/SheetHandle.kt` | 1 fixed size (48×5) × 1 fixed style (onSurface.subtle, full radius) |

## STYLE PROPERTIES MATRIX

> Exhaustive enumeration of every style property from both sources per `08f-translation-protocol.md`. Columns: Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping. `ESCALATE` = no token covers the value — add a proposed token to DECISIONS.md before implementing.
>
> **Token reference** (from `tokens/semantic/semantic.tokens.json`): space xs=4 sm=8 md=12 lg=16 xl=24 2xl=32 3xl=48 4xl=64; radius none=0 sm=4 md=8 lg=16 xl=24 2xl=32 full=9999; elevation[2] shadowOffset=0/2 shadowOpacity=0.05 shadowRadius=4 androidElevation=2. **Paper bodyMedium**: fontFamily=sans-serif, fontWeight=400, fontSize=14, lineHeight=20, letterSpacing=0.25. **Paper titleSmall**: fontFamily=sans-serif-medium, fontWeight=500, fontSize=14, lineHeight=20, letterSpacing=0.1.

### ThemedText

**Source files read:**
- LaneShadow: `react-native/components/themed-text.tsx`
- Framework: `node_modules/react-native-paper/src/components/Typography/Text.tsx`, `node_modules/react-native/Libraries/Text/Text.js`

**Typography — by type variant:**

| Type | Source | Paper variant | fontSize | fontWeight | lineHeight | letterSpacing | Android | iOS | Token |
|---|---|---|---|---|---|---|---|---|---|
| default | RN-wrapper | `bodyMedium` | 14 | 400 | 20 | 0.25 | `MaterialTheme.typography.bodyMedium` | `Font.bodyMedium` | ESCALATE — propose `type.body.md = fontSize=14, lineHeight=20, fontWeight=400, letterSpacing=0.25` |
| defaultSemiBold | RN-wrapper | `titleSmall` | 14 | 500 | 20 | 0.1 | `MaterialTheme.typography.titleSmall` | `Font.titleSmall` | ESCALATE — propose `type.label.md = fontSize=14, lineHeight=20, fontWeight=500, letterSpacing=0.1` |

**Visual — color:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| color | RN-wrapper | `semantic.color.onSurface.default` | `MaterialTheme.colors.onSurface` | `Color.onSurface` | `color.onSurface.default` |

**Layout — flex:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| default | Text | inherits | n/a | n/a | n/a |

### ThemedView

**Source files read:**
- LaneShadow: `react-native/components/themed-view.tsx`
- Framework: `node_modules/react-native/Libraries/Components/View/View.js`

**Layout — flex:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| flexDirection | RN-wrapper StyleSheet | `'column'` | `Column(...)` | `VStack` | n/a |

**Visual — backgroundColor:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| backgroundColor | RN-wrapper | `semantic.color.surface.default` | `MaterialTheme.colors.surface` | `Color.surface` | `color.surface.default` |

### IconSymbol

**Source files read:**
- LaneShadow: `react-native/components/ui/icon-symbol.tsx` (Android/web), `react-native/components/ui/icon-symbol.ios.tsx` (iOS)
- Framework: `node_modules/@expo/vector-icons/MaterialCommunityIcons.js`, `node_modules/react-native/Libraries/Text/Text.js`

**Layout — dimensions:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| size | RN-wrapper prop | `24` (default) | `Modifier.size(24.dp)` | `.frame(width: 24, height: 24)` | ESCALATE — propose `iconSize.default = 24` |
| size | RN-wrapper prop | `size?: number` (custom) | `Modifier.size(size.dp)` | `.frame(width: size, height: size)` | n/a (dynamic) |

**Visual — color:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| color | RN-wrapper prop | `color: string \| OpaqueColorValue` | `tint = Color(color)` | `.foregroundColor(Color(color))` | n/a (dynamic, caller-provided) |

**Typography — name mapping:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| name | RN-wrapper type | `IconName = keyof typeof MaterialCommunityIcons.glyphMap` | `Icons.Default[name]` (ImageVector) | `Image(systemName: mappedSFName)` | n/a (icon name registry) |

### Separator

**Source files read:**
- LaneShadow: `react-native/components/ui/separator.tsx`
- Framework: `node_modules/react-native/Libraries/Components/View/View.js`

**Layout — by orientation:**

| Orientation | Source | Width | Height | Android | iOS | Token |
|---|---|---|---|---|---|---|
| horizontal | RN-wrapper | `'100%'` | `1` | `Modifier.fillMaxWidth().height(1.dp)` | `.frame(maxWidth: .infinity).frame(height: 1)` | n/a (hardcoded 1px) |
| vertical | RN-wrapper | `1` | `'100%'` | `Modifier.width(1.dp).fillMaxHeight()` | `.frame(width: 1).frame(maxHeight: .infinity)` | n/a (hardcoded 1px) |

**Visual — backgroundColor:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| backgroundColor | RN-wrapper | `semantic.color.border.default` | `MaterialTheme.colors.border` | `Color.border` | `color.border.default` |

### DragHandle

**Source files read:**
- LaneShadow: `react-native/components/ui/drag-handle.tsx`
- Framework: `node_modules/react-native/Libraries/Components/View/View.js`

**Layout — dimensions:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| width | RN-wrapper prop default | `36` | `Modifier.width(36.dp)` | `.frame(width: 36)` | ESCALATE — propose `dragHandle.width = 36` |
| height | RN-wrapper prop default | `4` | `Modifier.height(4.dp)` | `.frame(height: 4)` | ESCALATE — propose `dragHandle.height = 4` |
| borderRadius | RN-wrapper prop default | `2` | `RoundedCornerShape(2.dp)` | `RoundedRectangle(cornerRadius: 2)` | `radius.sm = 4` (mismatch) |
| alignSelf | RN-wrapper StyleSheet | `'center'` | `Modifier.align(Alignment.CenterHorizontally)` | `.frame(maxWidth: .infinity)` + alignment | n/a |
| marginVertical | RN-wrapper StyleSheet | `8` | `Modifier.padding(vertical = 8.dp)` | `.padding(.vertical, 8)` | `space.sm = 8` |

**Visual — backgroundColor:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| backgroundColor | RN-wrapper | `semantic.color.onSurface.subtle` | `MaterialTheme.colors.onSurfaceVariant` (alpha) | `Color.onSurface.opacity(0.4)` | ESCALATE — propose `color.onSurface.subtle = onSurfaceVariant with opacity` |

### SheetHandle

**Source files read:**
- LaneShadow: `react-native/components/sheets/sheet-handle.tsx`
- Framework: `node_modules/react-native/Libraries/Components/View/View.js`

**Layout — container:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| width | RN-wrapper StyleSheet | `'100%'` | `Modifier.fillMaxWidth()` | `.frame(maxWidth: .infinity)` | n/a |
| alignItems | RN-wrapper StyleSheet | `'center'` | `Modifier.align(Alignment.CenterHorizontally)` | alignment in container | n/a |
| justifyContent | RN-wrapper StyleSheet | `'center'` | `Modifier.align(Alignment.CenterVertically)` | alignment in container | n/a |

**Layout — handle:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| width | RN-wrapper StyleSheet | `48` | `Modifier.width(48.dp)` | `.frame(width: 48)` | ESCALATE — propose `sheetHandle.width = 48` |
| height | RN-wrapper StyleSheet | `5` | `Modifier.height(5.dp)` | `.frame(height: 5)` | ESCALATE — propose `sheetHandle.height = 5` |
| borderRadius | RN-wrapper StyleSheet | `999` | `CircleShape` | `Capsule()` / `RoundedRectangle(cornerRadius: 999)` | `radius.full = 9999` |

**Visual — backgroundColor:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| backgroundColor | RN-wrapper | `semantic.color.onSurface.subtle` | `MaterialTheme.colors.onSurfaceVariant` (alpha) | `Color.onSurface.opacity(0.4)` | ESCALATE — propose `color.onSurface.subtle = onSurfaceVariant with opacity` |

## DESIGN NOTES

- Cover baseline states and typography or icon behavior explicitly so later molecules inherit stable primitives.
- Define detents, handles, scrim, keyboard avoidance, and safe-area behavior explicitly.
- Avoid unstyled Material defaults and route all styling through the documented Compose theme layer.

## VERIFICATION GATES

- pnpm type-check:native
- ./android/gradlew assembleDebug
- Validate sandbox scenarios for this task in the native sandbox host

## DEPENDENCIES

- UI-001
- UI-002
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
