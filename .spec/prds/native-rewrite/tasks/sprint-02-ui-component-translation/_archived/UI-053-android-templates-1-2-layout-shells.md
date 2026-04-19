# UI-053: Android templates 1/2 — layout shells: `BaseViewLayout`, `SubpageLayout`, `MenuLayout`, `TeacherSimpleViewLayout`, `TeacherTabViewLayout`, `AuthScreenLayout`

**Task ID:** UI-053
**Sprint:** Sprint 2 - UI Component Translation and Fidelity Sandbox
**Assigned To:** kotlin-implementer
**Reviewer:** kotlin-reviewer
**Estimate:** 480 min
**Type:** [FEATURE]
**Status:** Planned
**Phase:** Templates
**Quality Score:** 115/115

---

## BACKGROUND

Sprint 2 translates the React Native baseline into native platform components and sandbox scenarios before rider-facing feature sprints resume. This task covers the `templates` slice for `Android templates 1/2 — layout shells: BaseViewLayout, SubpageLayout, MenuLayout, TeacherSimpleViewLayout, TeacherTabViewLayout, AuthScreenLayout`.

**Objective:** Implement Android templates 1/2 — layout shells: `BaseViewLayout`, `SubpageLayout`, `MenuLayout`, `TeacherSimpleViewLayout`, `TeacherTabViewLayout`, `AuthScreenLayout` as Jetpack Compose work with parity to the RN baseline, token-only styling, and sandbox coverage.

**Success State:** A reviewer can open the Android sandbox, browse this task's scenarios, and confirm naming, interface, theme, state, accessibility, and layout parity against RN.

## CRITICAL CONSTRAINTS

### MUST
- Implement the listed components or compositions with parity-aligned naming and interfaces: `BaseViewLayout`, `SubpageLayout`, `MenuLayout`, `TeacherSimpleViewLayout`, `TeacherTabViewLayout`, `AuthScreenLayout`.
- Use only the LaneShadow core theme contract locked by `UI-001`: `tokens/semantic/semantic.tokens.json` as the source of truth, generated `native-theme` outputs as the shared packaging layer, and the platform theme entry points (`LaneShadowTheme` on Android, `.laneShadowTheme()` on iOS) for colors, spacing, typography, radii, elevation, and state styling.
- Register sandbox scenarios for default, interactive, and edge-case states with RN reference labels.
- Respect safe-area, layout shell, and background treatment parity without adding new primitives.

### NEVER
- Add unrelated feature wiring or backend dependencies to satisfy sandbox rendering.
- Introduce hardcoded UI primitives or platform-only naming drift.

### STRICTLY
- Preserve light and dark parity, accessibility labels, and deterministic fixtures for every scenario.

## DELIVERABLES

- android/app/src/main/java/com/laneshadow/ui/templates/**
- android/app/src/debug/java/com/laneshadow/sandbox/stories/TemplatesStories.kt — story set aggregated into AppStories.all
- android/app/src/test/java/com/laneshadow/**
- android/app/src/androidTest/java/com/laneshadow/**

## ACCEPTANCE CRITERIA

### AC-1
**GIVEN** The RN baseline and atomic parity contract define the expected components and interfaces.
**WHEN** This task is implemented.
**THEN** The listed components or compositions exist in the correct Android Compose directories with parity-aligned names and signatures: `BaseViewLayout`, `SubpageLayout`, `MenuLayout`, `TeacherSimpleViewLayout`, `TeacherTabViewLayout`, `AuthScreenLayout`.
**Verify:** `printf "%s\n" "`BaseViewLayout`, `SubpageLayout`, `MenuLayout`, `TeacherSimpleViewLayout`, `TeacherTabViewLayout`, `AuthScreenLayout`"`

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
| TC-1 | AC-1 | The listed components or compositions exist in the correct Android Compose directories with parity-aligned names and signatures: `BaseViewLayout`, `SubpageLayout`, `MenuLayout`, `TeacherSimpleViewLayout`, `TeacherTabViewLayout`, `AuthScreenLayout`. | `printf "%s\n" "`BaseViewLayout`, `SubpageLayout`, `MenuLayout`, `TeacherSimpleViewLayout`, `TeacherTabViewLayout`, `AuthScreenLayout`"` |
| TC-2 | AC-2 | All visuals use the LaneShadow core theme contract from `UI-001` and render correctly in both color modes without hardcoded UI primitives. | `rg -n "Token consumption\|light and dark" .spec/prds/native-rewrite/08d-component-parity-spec.md .spec/prds/native-rewrite/08-design-system.md` |
| TC-3 | AC-3 | Each listed component has deterministic sandbox coverage with RN reference labels and explicit state variants where applicable. | `rg -n "RN reference\|scenario\|interactive states" .spec/prds/native-rewrite/tasks/sprint-02-ui-component-translation/SPRINT.md` |
| TC-4 | AC-4 | Accessibility labels, touch targets, keyboard or safe-area handling, and motion or state parity behave correctly for this component family. | `rg -n "Accessibility\|Keyboard handling\|RTL support\|Animation parity\|State parity" .spec/prds/native-rewrite/08d-component-parity-spec.md` |
| TC-5 | ALL | Repo validation gates remain green for the touched workspace when this task is complete. | `detekt --input android --config .detekt/config.yml && ./android/gradlew assembleDebug` |

## READING LIST

1. `.spec/prds/native-rewrite/README.md`
2. `.spec/prds/native-rewrite/tasks/sprint-02-ui-component-translation/SPRINT.md`
3. `.spec/prds/native-rewrite/08a-atomic-component-catalog.md`
4. `.spec/prds/native-rewrite/08d-component-parity-spec.md`
5. `RULES.md`
6. `.spec/prds/native-rewrite/08b-android-component-map.md`

## GUARDRAILS

### WRITE-ALLOWED
- android/app/src/main/java/com/laneshadow/ui/templates/**
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
| BaseViewLayout | `react-native/components/layouts/base-view-layout.tsx` | `node_modules/react-native/Libraries/Components/View/View.js`; `node_modules/react-native-safe-area-context/src/NativeSafeAreaProvider.tsx` | `android/app/src/main/java/com/laneshadow/ui/templates/BaseViewLayout.kt` | 1 layout × 2 states (light/dark) |
| SubpageLayout | `react-native/components/layouts/subpage-layout.tsx` | `node_modules/react-native/Libraries/Components/View/View.js`; `node_modules/expo-linear-gradient/src/LinearGradient.tsx`; `node_modules/react-native/Libraries/Components/Pressable/Pressable.js` | `android/app/src/main/java/com/laneshadow/ui/templates/SubpageLayout.kt` | 1 layout × 2 variants (with/without rightAction) |
| MenuLayout | `react-native/components/layouts/menu-layout.tsx` | `node_modules/react-native/Libraries/Animated/Animated.js`; `node_modules/react-native/Libraries/Components/View/View.js` | `android/app/src/main/java/com/laneshadow/ui/templates/MenuLayout.kt` | 1 layout × 2 alignments (left/right) × 2 states (open/closed) |
| TeacherSimpleViewLayout | `react-native/components/layouts/teacher-simple-view-layout.tsx` | `node_modules/react-native/Libraries/Components/View/View.js`; `node_modules/react-native/Libraries/Components/Pressable/Pressable.js` | `android/app/src/main/java/com/laneshadow/ui/templates/TeacherSimpleViewLayout.kt` | 1 layout × 1 state |
| TeacherTabViewLayout | `react-native/components/layouts/teacher-tab-view-layout.tsx` | `node_modules/react-native/Libraries/Components/View/View.js` | `android/app/src/main/java/com/laneshadow/ui/templates/TeacherTabViewLayout.kt` | 1 layout × 1 state |
| AuthScreenLayout | N/A (not in RN baseline — parity with SubpageLayout pattern) | N/A | `android/app/src/main/java/com/laneshadow/ui/templates/AuthScreenLayout.kt` | 1 layout × 1 state |

## STYLE PROPERTIES MATRIX

> Exhaustive enumeration of every style property from both sources per `08f-translation-protocol.md`. Columns: Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping. `ESCALATE` = no token covers the value — add a proposed token to DECISIONS.md before implementing.
>
> **Token reference** (from `tokens/semantic/semantic.tokens.json`): space xs=4 sm=8 md=12 lg=16 xl=24 2xl=32 3xl=48 4xl=64; radius none=0 sm=4 md=8 lg=16 xl=24 2xl=32 full=9999; elevation[2] shadowOffset=0/2 shadowOpacity=0.05 shadowRadius=4 androidElevation=2. **Paper labelLarge**: fontFamily=sans-serif-medium, fontWeight=500, fontSize=14, lineHeight=20, letterSpacing=0.1. **Paper labelSmall**: fontFamily=sans-serif-medium, fontWeight=500, fontSize=11, lineHeight=16, letterSpacing=0.5. **semantic.type.label.md**: fontSize=14, lineHeight=20, fontWeight=500. **semantic.type.body.sm**: fontSize=14, lineHeight=21, fontWeight=400.

### BaseViewLayout

**Source files read:**
- LaneShadow: `react-native/components/layouts/base-view-layout.tsx`
- Framework: `node_modules/react-native/Libraries/Components/View/View.js`, `node_modules/react-native-safe-area-context/src/NativeSafeAreaProvider.tsx`

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | flex | RN-wrapper | `1` | `Modifier.fillMaxSize()` | `.frame(maxWidth: .infinity, maxHeight: .infinity)` | n/a |
| Layout | paddingTop | RN-wrapper | `insets.top` | `Modifier.padding(top = WindowInsets.safeContent.asPaddingValues().calculateTopPadding())` | `.padding(.top, safeAreaInsets.top)` | n/a (safe area) |
| Layout | paddingBottom | RN-wrapper | `insets.bottom` | `Modifier.padding(bottom = WindowInsets.safeContent.asPaddingValues().calculateBottomPadding())` | `.padding(.bottom, safeAreaInsets.bottom)` | n/a (safe area) |
| Visual | backgroundColor | RN-wrapper | `semantic.color.background.default` | `LaneShadowTheme.colors.background` | `theme.colors.background` | `color.background.default` |

### SubpageLayout

**Source files read:**
- LaneShadow: `react-native/components/layouts/subpage-layout.tsx`
- Framework: `node_modules/expo-linear-gradient/src/LinearGradient.tsx`, `node_modules/react-native/Libraries/Components/Pressable/Pressable.js`, `node_modules/react-native-paper/src/styles/themes/v3/tokens.tsx`

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | flex | RN-wrapper | `1` | `Modifier.fillMaxSize()` | `.frame(maxWidth: .infinity, maxHeight: .infinity)` | n/a |
| Layout | headerGradient paddingTop | RN-wrapper | `insets.top` | `Modifier.padding(top = WindowInsets.statusBars.asPaddingValues().calculateTopPadding())` | `.padding(.top, safeAreaInsets.top)` | n/a (safe area) |
| Layout | content paddingBottom | RN-wrapper | `insets.bottom` | `Modifier.padding(bottom = WindowInsets.safeContent.asPaddingValues().calculateBottomPadding())` | `.padding(.bottom, safeAreaInsets.bottom)` | n/a (safe area) |
| Layout | navRow height | RN-wrapper | hardcoded `52` | `Modifier.height(52.dp)` | `.frame(height: 52)` | ESCALATE — propose `space.headerHeight = 52` |
| Layout | navRow paddingHorizontal | RN-wrapper | `semantic.space.lg` = 16 | `Modifier.padding(horizontal = 16.dp)` | `.padding(.horizontal, 16)` | `space.lg` |
| Layout | titleRow paddingHorizontal | RN-wrapper | `semantic.space.lg` = 16 | `Modifier.padding(horizontal = 16.dp)` | `.padding(.horizontal, 16)` | `space.lg` |
| Layout | titleRow paddingBottom | RN-wrapper | `semantic.space.lg` = 16 | `Modifier.padding(bottom = 16.dp)` | `.padding(.bottom, 16)` | `space.lg` |
| Layout | accentRule marginTop | RN-wrapper | `semantic.space.sm` = 8 | `Modifier.padding(top = 8.dp)` | `.padding(.top, 8)` | `space.sm` |
| Layout | accentRule width | RN-wrapper | hardcoded `32` | `Modifier.width(32.dp)` | `.frame(width: 32)` | ESCALATE — propose `space.accentRuleWidth = 32` |
| Layout | accentRule height | RN-wrapper | hardcoded `3` | `Modifier.height(3.dp)` | `.frame(height: 3)` | ESCALATE — propose `space.accentRuleHeight = 3` |
| Layout | accentRule borderRadius | RN-wrapper | hardcoded `1.5` | `RoundedCornerShape(1.5.dp)` | `RoundedRectangle(cornerRadius: 1.5)` | ESCALATE — `radius` token 1.5 missing; use `radius.xs = 4` or propose `radius.thin = 1.5` |
| Visual | backgroundColor | RN-wrapper | `semantic.color.background.default` | `LaneShadowTheme.colors.background` | `theme.colors.background` | `color.background.default` |
| Visual | gradientColors | RN-wrapper | `[surface.default, surface.default + 0% alpha]` | `Brush.verticalGradient(colors = listOf(surface, surface.copy(alpha = 0f)))` | `LinearGradient(colors: [surface, surface.opacity(0)])` | `color.surface.default` |
| Visual | backButton backgroundColor | RN-wrapper | `semantic.color.surfaceVariant.default` | `LaneShadowTheme.colors.surfaceVariant` | `theme.colors.surfaceVariant` | `color.surfaceVariant.default` |
| Visual | backButton backgroundColor (pressed) | RN-wrapper | `semantic.color.surfaceVariant.pressed` | `LaneShadowTheme.colors.surfaceVariantPressed` | `theme.colors.surfaceVariantPressed` | `color.surfaceVariant.pressed` |
| Visual | backButton borderRadius | RN-wrapper | `semantic.radius.full` = 9999 | `CircleShape` | `Circle()` | `radius.full` |
| Visual | backButton borderWidth | RN-wrapper | hardcoded `1` | `Modifier.border(1.dp, ...)` | `.overlay(RoundedRectangle(...).stroke(..., lineWidth: 1))` | ESCALATE — propose `borderWidth.thin = 1` |
| Visual | backButton borderColor | RN-wrapper | `semantic.color.border.default` | `LaneShadowTheme.colors.border` | `theme.colors.border` | `color.border.default` |
| Visual | backButton icon size | RN-wrapper | hardcoded `20` | `Modifier.size(20.dp)` | `.frame(width: 20, height: 20)` | ESCALATE — propose `iconSize.sm = 20` |
| Visual | backButton icon color | RN-wrapper | `semantic.color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |
| Visual | accentRule backgroundColor | RN-wrapper | `semantic.color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |
| Typography — title | fontSize | Paper headlineMedium | 28 | `28.sp` | `.font(.system(size: 28, weight: .bold))` | ESCALATE — `type.display.sm.fontSize = 28` missing from tokens |
| Typography — title | fontWeight | RN-wrapper | hardcoded `'700'` | `FontWeight.Bold` | `.bold` | ESCALATE — propose `fontWeight.bold = 700` |
| Typography — title | color | RN-wrapper | `semantic.color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |
| Interaction | backButton size | RN-wrapper | hardcoded `36` × `36` | `Modifier.size(36.dp)` | `.frame(width: 36, height: 36)` | ESCALATE — propose `touchTarget.sm = 36` |

### MenuLayout

**Source files read:**
- LaneShadow: `react-native/components/layouts/menu-layout.tsx`
- Framework: `node_modules/react-native/Libraries/Animated/Animated.js`

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | flex | RN-wrapper | `1` | `Modifier.fillMaxSize()` | `.frame(maxWidth: .infinity, maxHeight: .infinity)` | n/a |
| Layout | DRAWER_WIDTH | RN-wrapper | hardcoded `280` | `280.dp` | `280` | ESCALATE — propose `size.drawerWidth = 280` |
| Layout | animation duration | RN-wrapper | hardcoded `300` | `300ms` (animateFloatAsState) | `0.3` | ESCALATE — propose `duration.drawer = 300` |
| Layout | contentArea transform | RN-wrapper | `translateX` offset based on alignment | `Modifier.offset{x = ...}` | `.offset(x: ...)` | n/a |
| Interaction | alignment | RN-wrapper | `'left'` or `'right'` | enum | enum | n/a |

### TeacherSimpleViewLayout

**Source files read:**
- LaneShadow: `react-native/components/layouts/teacher-simple-view-layout.tsx`
- Framework: `node_modules/react-native/Libraries/Components/View/View.js`, `node_modules/react-native/Libraries/Components/Pressable/Pressable.js`

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | flex | RN-wrapper | `1` | `Modifier.fillMaxSize()` | `.frame(maxWidth: .infinity, maxHeight: .infinity)` | n/a |
| Layout | header height | RN-wrapper | hardcoded `60` | `Modifier.height(60.dp)` | `.frame(height: 60)` | ESCALATE — propose `space.headerHeight = 60` |
| Layout | header paddingHorizontal | RN-wrapper | `semantic.space.lg` = 16 | `Modifier.padding(horizontal = 16.dp)` | `.padding(.horizontal, 16)` | `space.lg` |
| Layout | header paddingVertical | RN-wrapper | `semantic.space.sm` = 8 | `Modifier.padding(vertical = 8.dp)` | `.padding(.vertical, 8)` | `space.sm` |
| Layout | backButton width/height | RN-wrapper | hardcoded `44` | `Modifier.size(44.dp)` | `.frame(width: 44, height: 44)` | ESCALATE — propose `touchTarget.md = 44` |
| Layout | backButton padding | RN-wrapper | `semantic.space.sm` = 8 | `Modifier.padding(8.dp)` | `.padding(8)` | `space.sm` |
| Visual | backgroundColor | RN-wrapper | `semantic.color.background.default` | `LaneShadowTheme.colors.background` | `theme.colors.background` | `color.background.default` |
| Visual | borderBottomColor | RN-wrapper | `semantic.color.border.default` | `LaneShadowTheme.colors.border` | `theme.colors.border` | `color.border.default` |
| Visual | borderBottomWidth | RN-wrapper | hardcoded `1` | `Modifier.border(1.dp, ...)` | `.overlay(RoundedRectangle(...).stroke(..., lineWidth: 1))` | ESCALATE — propose `borderWidth.thin = 1` |
| Visual | backButton backgroundColor (pressed) | RN-wrapper | `semantic.color.surface.pressed` | `LaneShadowTheme.colors.surfacePressed` | `theme.colors.surfacePressed` | `color.surface.pressed` |
| Visual | backButton borderRadius | RN-wrapper | `semantic.radius.full` = 9999 | `CircleShape` | `Circle()` | `radius.full` |
| Typography — title | variant | Paper titleLarge | fontSize=22, fontWeight=400 | `TextStyle(fontSize=22.sp, fontWeight=FontWeight.Normal)` | `.font(.title)` | ESCALATE — `type.title.lg.fontSize = 22` missing |
| Typography — title | color | RN-wrapper | `semantic.color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |
| Interaction | icon size | RN-wrapper | hardcoded `24` | `Modifier.size(24.dp)` | `.frame(width: 24, height: 24)` | ESCALATE — propose `iconSize.md = 24` |
| Interaction | icon color | RN-wrapper | `semantic.color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |

### TeacherTabViewLayout

**Source files read:**
- LaneShadow: `react-native/components/layouts/teacher-tab-view-layout.tsx`
- Framework: N/A (composition of other layouts)

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Composition | BaseViewLayout | RN-wrapper | yes | `BaseViewLayout {}` | `BaseViewLayout {}` | n/a |
| Composition | MenuLayout | RN-wrapper | yes | `MenuLayout {}` | `MenuLayout {}` | n/a |
| Composition | Header | RN-wrapper | yes | `Header {}` | `Header {}` | n/a |
| Composition | TeacherTabBar | RN-wrapper | yes | `TeacherTabBar {}` | `TeacherTabBar {}` | n/a |
| Composition | VoiceAssistantOverlay | RN-wrapper | yes | `VoiceAssistantOverlay {}` | `VoiceAssistantOverlay {}` | n/a |
| Composition | Banner | RN-wrapper | yes | `Banner {}` | `Banner {}` | n/a |

### AuthScreenLayout

**Source files read:**
- N/A (not in RN baseline — parity with SubpageLayout pattern)

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | pattern | SubpageLayout | same structure | Same as SubpageLayout | Same as SubpageLayout | n/a |
| Layout | safe area handling | SubpageLayout | `insets.top/bottom` | Same as SubpageLayout | Same as SubpageLayout | n/a |

---

## DESIGN NOTES

- Treat safe-area, background, and layout shell behavior as parity-sensitive design work, not platform defaults.
- Avoid unstyled Material defaults and route all styling through the documented Compose theme layer.

## VERIFICATION GATES

- detekt --input android --config .detekt/config.yml
- ./android/gradlew assembleDebug
- Validate sandbox scenarios for this task in the native sandbox host

## DEPENDENCIES

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
