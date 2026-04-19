# UI-007: Android atoms 2/5 — form controls: `Button`, `PrimaryButton`, `Input`, `Textarea`, `BottomSheetInput`, `Switch`, `Toggle`, `Checkbox`, `Slider`

**Task ID:** UI-007
**Sprint:** Sprint 2 - UI Component Translation and Fidelity Sandbox
**Assigned To:** kotlin-implementer
**Reviewer:** kotlin-reviewer
**Estimate:** 480 min
**Type:** [FEATURE]
**Status:** Planned
**Phase:** Atoms
**Quality Score:** 115/115

---

## BACKGROUND

Sprint 2 translates the React Native baseline into native platform components and sandbox scenarios before rider-facing feature sprints resume. This task covers the `atoms` slice for `Android atoms 2/5 — form controls: Button, PrimaryButton, Input, Textarea, BottomSheetInput, Switch, Toggle, Checkbox, Slider`.

**Objective:** Implement Android atoms 2/5 — form controls: `Button`, `PrimaryButton`, `Input`, `Textarea`, `BottomSheetInput`, `Switch`, `Toggle`, `Checkbox`, `Slider` as Jetpack Compose work with parity to the RN baseline, token-only styling, and sandbox coverage.

**Success State:** A reviewer can open the Android sandbox, browse this task's scenarios, and confirm naming, interface, theme, state, accessibility, and layout parity against RN.

## CRITICAL CONSTRAINTS

### MUST
- Implement the listed components or compositions with parity-aligned naming and interfaces: `Button`, `PrimaryButton`, `Input`, `Textarea`, `BottomSheetInput`, `Switch`, `Toggle`, `Checkbox`, `Slider`.
- Follow the **Photocopy Translation Protocol** in `.spec/prds/native-rewrite/08f-translation-protocol.md`. For every component, read **both** the LaneShadow RN wrapper at `react-native/components/ui/<name>.tsx` **and** the framework primitive source(s) in `node_modules` (react-native-paper, @gorhom/bottom-sheet, react-native core) per the Framework-source Reading Map in `08b-android-component-map.md`.
- Map **every visual decision** in the RN source (color, height, padding, radius, opacity, border, shadow / elevation, animation, state-transition, typography metric) to its semantic-token equivalent from the `UI-001` core theme contract. Read the framework primitive's source in `node_modules` for any external library import and enumerate **every** style property it contributes to the rendered visual. If no token covers a value, STOP and escalate to this sprint's `DECISIONS.md` before improvising.
- Honor the **Prohibited Primitives** rule in `08b-android-component-map.md` § Prohibited Primitives. Do not ship `androidx.compose.material3.Button` / `TextField` / `Switch` / `Checkbox` / `Slider` / `Card` / `FloatingActionButton` as the final rendered surface. Compose using the allowed neutral primitives (`Surface` with `tonalElevation = 0.dp`, `Box`, `Row`, `Column`, `BasicText`, `BasicTextField`, `Canvas`, `Modifier.clickable / pointerInput`).
- Populate the `TRANSLATION SOURCES` table and `STYLE PROPERTIES MATRIX` sub-sections below before implementation begins. Implementer reads these as the authoritative spec.
- Register sandbox scenarios for default, interactive, and edge-case states with RN reference labels (Story.summary = relative RN reference path).
- Cover all interactive states required by the parity spec for atomic controls and visuals.

### NEVER
- Add unrelated feature wiring or backend dependencies to satisfy sandbox rendering.
- Introduce hardcoded UI primitives or platform-only naming drift.
- Ship `androidx.compose.material3.*` final-rendered surfaces without the full default override pattern documented in `08b` § Override pattern.
- Improvise a value when no semantic token covers it — escalate via `DECISIONS.md` instead.

### STRICTLY
- Preserve light and dark parity, accessibility labels, and deterministic fixtures for every scenario.
- Side-by-side AC-6 verification (RN sandbox vs Android sandbox) is mandatory; screenshot pairs attached to the task PR.

## DELIVERABLES

- android/app/src/main/java/com/laneshadow/ui/atoms/**
- android/app/src/debug/java/com/laneshadow/sandbox/stories/AtomsStories.kt — story set aggregated into AppStories.all
- android/app/src/test/java/com/laneshadow/**
- android/app/src/androidTest/java/com/laneshadow/**

## ACCEPTANCE CRITERIA

### AC-1
**GIVEN** The RN baseline and atomic parity contract define the expected components and interfaces.
**WHEN** This task is implemented.
**THEN** The listed components or compositions exist in the correct Android Compose directories with parity-aligned names and signatures: `Button`, `PrimaryButton`, `Input`, `Textarea`, `BottomSheetInput`, `Switch`, `Toggle`, `Checkbox`, `Slider`.
**Verify:** `printf "%s\n" "`Button`, `PrimaryButton`, `Input`, `Textarea`, `BottomSheetInput`, `Switch`, `Toggle`, `Checkbox`, `Slider`"`

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

### AC-6 — RN-Baseline-Diff Gate (universal, per `08f`)
**GIVEN** the RN baseline scenario registry from `UI-002` (`react-native/stories/registry/scenarioRegistry.generated.ts`) and the native sandbox stories registered for this task in `AppStories.all`.
**WHEN** a reviewer opens the same `Story.id` in the RN sandbox and the Android sandbox side-by-side.
**THEN** rendering matches at parity: token-mapped colors are identical, heights / radii / paddings match within ±1px tolerance, all interactive state transitions (press, focus, disable, error, loading) produce visually identical results, and accessibility roles / labels match. Any intentional deviation is logged in `tasks/sprint-02-ui-component-translation/DECISIONS.md` with rationale and reviewer sign-off.
**Verify:** Screenshot pair (RN | Android) attached to the task PR for at least one variant per component, plus a `variance--<scenario-id>--rn-vs-android--<theme>.json` entry per `UI-002` conventions.

## TEST CRITERIA

| ID | Maps To | Boolean Statement | Verify |
|---|---|---|---|
| TC-1 | AC-1 | The listed components or compositions exist in the correct Android Compose directories with parity-aligned names and signatures: `Button`, `PrimaryButton`, `Input`, `Textarea`, `BottomSheetInput`, `Switch`, `Toggle`, `Checkbox`, `Slider`. | `printf "%s\n" "`Button`, `PrimaryButton`, `Input`, `Textarea`, `BottomSheetInput`, `Switch`, `Toggle`, `Checkbox`, `Slider`"` |
| TC-2 | AC-2 | All visuals use the LaneShadow core theme contract from `UI-001` and render correctly in both color modes without hardcoded UI primitives. | `rg -n "Token consumption\|light and dark" .spec/prds/native-rewrite/08d-component-parity-spec.md .spec/prds/native-rewrite/08-design-system.md` |
| TC-3 | AC-3 | Each listed component has deterministic sandbox coverage with RN reference labels and explicit state variants where applicable. | `rg -n "RN reference\|scenario\|interactive states" .spec/prds/native-rewrite/tasks/sprint-02-ui-component-translation/SPRINT.md` |
| TC-4 | AC-4 | Accessibility labels, touch targets, keyboard or safe-area handling, and motion or state parity behave correctly for this component family. | `rg -n "Accessibility\|Keyboard handling\|RTL support\|Animation parity\|State parity" .spec/prds/native-rewrite/08d-component-parity-spec.md` |
| TC-5 | ALL | Repo validation gates remain green for the touched workspace when this task is complete. | `pnpm type-check:native && ./android/gradlew assembleDebug` |

## READING LIST

### Spec layer (read first)
1. `.spec/prds/native-rewrite/README.md`
2. `.spec/prds/native-rewrite/tasks/sprint-02-ui-component-translation/SPRINT.md`
3. `.spec/prds/native-rewrite/08a-atomic-component-catalog.md`
4. `.spec/prds/native-rewrite/08d-component-parity-spec.md`
5. `.spec/prds/native-rewrite/08b-android-component-map.md` — including § Prohibited Primitives and § Framework-source Reading Map (NEW)
6. `.spec/prds/native-rewrite/08f-translation-protocol.md` — Photocopy Translation Protocol (NEW, mandatory)
7. `RULES.md`

### LaneShadow RN wrappers (the source of truth for visual + behavior — read in full)
8. `react-native/components/ui/button.tsx`
9. `react-native/components/ui/primary-button.tsx`
10. `react-native/components/ui/input.tsx`
11. `react-native/components/ui/textarea.tsx`
12. `react-native/components/ui/bottom-sheet-input.tsx`
13. `react-native/components/ui/switch.tsx`
14. `react-native/components/ui/toggle.tsx`
15. `react-native/components/ui/checkbox.tsx`
16. `react-native/components/ui/slider.tsx`
17. `react-native/components/CLAUDE.md` — keyboard-handling contract for `BottomSheetInput`

### Framework primitive sources in `node_modules` (read for every style property contributed to the rendered visual)
18. `node_modules/react-native-paper/src/components/Typography/Text.tsx` + `node_modules/react-native-paper/src/components/Typography/v2/*.tsx` (used by Button, PrimaryButton, Input, BottomSheetInput, Toggle, Checkbox)
19. `node_modules/react-native-paper/src/core/theming.tsx` (used by PrimaryButton via `useTheme`)
20. `node_modules/@gorhom/bottom-sheet/src/components/bottomSheetTextInput/BottomSheetTextInput.tsx` (used by BottomSheetInput)
21. `node_modules/react-native/Libraries/Components/Pressable/Pressable.js` (used by Button, PrimaryButton, Toggle, Checkbox)
22. `node_modules/react-native/Libraries/Components/TextInput/TextInput.js` (used by Input, Textarea)
23. `node_modules/react-native/Libraries/Components/Switch/Switch.js` (used by Switch)
24. `react-native/components/ui/__tests__/` (any existing snapshot or behavior tests for these atoms)

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

**Reference:** `.spec/prds/native-rewrite/08b-android-component-map.md` (+ § Prohibited Primitives, § Override pattern, § Framework-source Reading Map)

**Pattern:** Single reusable `@Composable` per component, composed from allowed neutral primitives (`Surface(tonalElevation = 0.dp)`, `Box`, `Row`, `Column`, `BasicText`, `BasicTextField`, `Canvas`, `Modifier.clickable / pointerInput`), with variant / size / state expressed as enum parameters, all visual values sourced from `LaneShadowTheme.colors / spacing / radius / typography`, and one `Story(id = "atom.<component>.<state>", tier = ComponentTier.Atom, ...)` per state in the `STYLE PROPERTIES MATRIX` registered in `AppStories.all`.

**Anti-pattern:** Shipping `androidx.compose.material3.Button / TextField / Switch / Checkbox / Slider / Card / FloatingActionButton` as the final rendered surface; using `MaterialTheme.colorScheme.*` instead of `LaneShadowTheme.colors.*`; hardcoded `Color(0xFF...)`, `4.dp`, `16.sp` literals; backend-aware composables; duplicated variant files (use one composable + enum parameter).

## TRANSLATION SOURCES

| Component | RN wrapper source | Framework primitives + `node_modules` paths | Native target file | Variants × sizes × states |
|---|---|---|---|---|
| Button | `react-native/components/ui/button.tsx` | `node_modules/react-native-paper/src/styles/themes/v3/tokens.tsx` (labelLarge metrics); `node_modules/react-native/Libraries/Components/Pressable/Pressable.js` | `android/app/src/main/java/com/laneshadow/ui/atoms/Button.kt` | 7 variants (default/secondary/outline/ghost/destructive/link/glass) × 6 sizes (sm/default/lg/xl/2xl/icon) × 4 states (default/pressed/disabled/loading) |
| PrimaryButton | `react-native/components/ui/primary-button.tsx` | `node_modules/react-native-paper/src/styles/themes/v3/tokens.tsx`; `node_modules/react-native-paper/src/core/theming.tsx` (useTheme); `node_modules/react-native/Libraries/Components/View/View.js` | `android/app/src/main/java/com/laneshadow/ui/atoms/PrimaryButton.kt` | 1 fixed style × 3 states (default/disabled/loading). Note: NOT wrapped in Pressable — caller provides onPress gesture |
| Input | `react-native/components/ui/input.tsx` | `node_modules/react-native-paper/src/styles/themes/v3/tokens.tsx` (labelSmall for label); `node_modules/react-native/Libraries/Components/TextInput/TextInput.js` | `android/app/src/main/java/com/laneshadow/ui/atoms/Input.kt` | {plain/withLabel/withLeftIcon/withRightIcon} × 4 states (idle/focused/error/disabled) |
| Textarea | `react-native/components/ui/textarea.tsx` | `node_modules/react-native/Libraries/Components/TextInput/TextInput.js` (multiline TextInput) | `android/app/src/main/java/com/laneshadow/ui/atoms/Textarea.kt` | 1 layout × 4 states (idle/focused/error/disabled) |
| BottomSheetInput | `react-native/components/ui/bottom-sheet-input.tsx` | `node_modules/@gorhom/bottom-sheet/src/components/bottomSheetTextInput/BottomSheetTextInput.tsx`; `node_modules/react-native-paper/src/styles/themes/v3/tokens.tsx` (labelSmall) | `android/app/src/main/java/com/laneshadow/ui/atoms/BottomSheetInput.kt` | same layout as Input × 4 states; keyboard behavior: keyboardBehavior="interactive", android_keyboardInputMode="adjustResize", keyboardBlurBehavior="restore" |
| Switch | `react-native/components/ui/switch.tsx` | `node_modules/react-native/Libraries/Animated/Animated.js` (Animated.timing/Value); `node_modules/react-native/Libraries/Components/Pressable/Pressable.js` | `android/app/src/main/java/com/laneshadow/ui/atoms/Switch.kt` | 1 fixed size × 3 states (off/on/disabled) |
| Toggle | `react-native/components/ui/toggle.tsx` | `node_modules/react-native-paper/src/styles/themes/v3/tokens.tsx` (semantic.type.label.md = labelLarge); `node_modules/react-native/Libraries/Components/Pressable/Pressable.js` | `android/app/src/main/java/com/laneshadow/ui/atoms/Toggle.kt` | 2 variants (default/outline) × 3 sizes (sm/default/lg) × toggled ×  3 states (idle/pressed/disabled) |
| Checkbox | `react-native/components/ui/checkbox.tsx` | `node_modules/react-native-paper/src/styles/themes/v3/tokens.tsx` (checkmark text style); `node_modules/react-native/Libraries/Components/Pressable/Pressable.js` | `android/app/src/main/java/com/laneshadow/ui/atoms/Checkbox.kt` | 1 fixed size × 4 states (unchecked/checked/indeterminate/disabled) |
| Slider | `react-native/components/ui/slider.tsx` | `node_modules/react-native/Libraries/Components/View/View.js` (PanResponder — no Paper) | `android/app/src/main/java/com/laneshadow/ui/atoms/Slider.kt` | 1 fixed geometry × 3 states (default/dragging/disabled) |

## STYLE PROPERTIES MATRIX

> Exhaustive enumeration of every style property from both sources per `08f-translation-protocol.md`. Columns: Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping. `ESCALATE` = no token covers the value — add a proposed token to DECISIONS.md before implementing.
>
> **Token reference** (from `tokens/semantic/semantic.tokens.json`): space xs=4 sm=8 md=12 lg=16 xl=24 2xl=32 3xl=48 4xl=64; radius none=0 sm=4 md=8 lg=16 xl=24 2xl=32 full=9999; elevation[2] shadowOffset=0/2 shadowOpacity=0.05 shadowRadius=4 androidElevation=2. **Paper labelLarge**: fontFamily=sans-serif-medium, fontWeight=500, fontSize=14, lineHeight=20, letterSpacing=0.1. **Paper labelSmall**: fontFamily=sans-serif-medium, fontWeight=500, fontSize=11, lineHeight=16, letterSpacing=0.5. **semantic.type.label.md**: fontSize=14, lineHeight=20, fontWeight=500. **semantic.type.body.sm**: fontSize=14, lineHeight=21, fontWeight=400.

### Button

**Source files read:**
- LaneShadow: `react-native/components/ui/button.tsx`
- Framework: `node_modules/react-native-paper/src/styles/themes/v3/tokens.tsx`, `node_modules/react-native/Libraries/Components/Pressable/Pressable.js`

**Layout — heights (by size):**

| Size | Source | Height value | Android | iOS | Token |
|---|---|---|---|---|---|
| sm | RN-wrapper | `space.xl + space.md` = 36 | `Modifier.height(36.dp)` | `.frame(height: 36)` | `space.xl + space.md` (composed) |
| default | RN-wrapper | `space.2xl + space.sm` = 40 | `Modifier.height(40.dp)` | `.frame(height: 40)` | `space.2xl + space.sm` |
| lg | RN-wrapper | `space.2xl + space.md` = 44 | `Modifier.height(44.dp)` | `.frame(height: 44)` | `space.2xl + space.md` |
| xl | RN-wrapper | `space.3xl` = 48 | `Modifier.height(48.dp)` | `.frame(height: 48)` | `space.3xl` |
| 2xl | RN-wrapper | `space.4xl - space.sm` = 56 | `Modifier.height(56.dp)` | `.frame(height: 56)` | ESCALATE — propose `space.5xl = 56` |
| icon | RN-wrapper | `space.2xl + space.sm` = 40, width=40 | `Modifier.size(40.dp)` | `.frame(width: 40, height: 40)` | `space.2xl + space.sm` |

**Layout — padding horizontal (by size):**

| Size | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| sm | RN-wrapper | `space.md` = 12 | `Modifier.padding(horizontal = 12.dp)` | `.padding(.horizontal, 12)` | `space.md` |
| default | RN-wrapper | `space.lg` = 16 | `Modifier.padding(horizontal = 16.dp)` | `.padding(.horizontal, 16)` | `space.lg` |
| lg | RN-wrapper | `space.2xl` = 32 | `Modifier.padding(horizontal = 32.dp)` | `.padding(.horizontal, 32)` | `space.2xl` |
| xl / 2xl | RN-wrapper | `space.lg` = 16 | `Modifier.padding(horizontal = 16.dp)` | `.padding(.horizontal, 16)` | `space.lg` |
| icon | RN-wrapper | 0 | none | none | n/a |

**Layout — borderRadius (by size):**

| Size | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| icon | RN-wrapper | `radius.full` = 9999 | `CircleShape` | `Circle()` | `radius.full` |
| 2xl | RN-wrapper | `radius.xl` = 24 | `RoundedCornerShape(24.dp)` | `RoundedRectangle(cornerRadius: 24)` | `radius.xl` |
| xl | RN-wrapper | `radius.lg` = 16 | `RoundedCornerShape(16.dp)` | `RoundedRectangle(cornerRadius: 16)` | `radius.lg` |
| sm/default/lg | RN-wrapper | `radius.md` = 8 | `RoundedCornerShape(8.dp)` | `RoundedRectangle(cornerRadius: 8)` | `radius.md` |

**Layout — flex / alignment:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| alignItems | RN-wrapper | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.alignment(.center)` | n/a |
| justifyContent | RN-wrapper | `'center'` | `horizontalArrangement = Arrangement.Center` | n/a (HStack default) | n/a |
| iconSpacing | RN-wrapper | `space.sm` = 8 | `Spacer(Modifier.width(8.dp))` | `Spacer(minLength: 8)` | `space.sm` |

**Visual — backgroundColor (by variant × state):**

| Variant | State | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|---|
| default | default | RN-wrapper | `color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |
| default | pressed | RN-wrapper | `color.primary.pressed` | (pressed branch) | (pressed branch) | `color.primary.pressed` |
| default | disabled | RN-wrapper | `color.primary.disabled` | `alpha(0.5f)` on container | `.opacity(0.5)` | `color.primary.disabled` |
| secondary | default | RN-wrapper | `color.secondary.default` | `LaneShadowTheme.colors.secondary` | `theme.colors.secondary` | `color.secondary.default` |
| secondary | pressed | RN-wrapper | `color.secondary.pressed` | (pressed branch) | (pressed branch) | `color.secondary.pressed` |
| secondary | disabled | RN-wrapper | `color.secondary.disabled` | (disabled branch) | (disabled branch) | `color.secondary.disabled` |
| destructive | default | RN-wrapper | `color.danger.default` | `LaneShadowTheme.colors.danger` | `theme.colors.danger` | `color.danger.default` |
| destructive | pressed | RN-wrapper | `color.danger.pressed` | (pressed branch) | (pressed branch) | `color.danger.pressed` |
| destructive | disabled | RN-wrapper | `color.danger.disabled` | (disabled branch) | (disabled branch) | `color.danger.disabled` |
| outline | default | RN-wrapper | `color.background.default` | `LaneShadowTheme.colors.background` | `theme.colors.background` | `color.background.default` |
| outline | pressed | RN-wrapper | `color.accent.pressed` | `LaneShadowTheme.colors.accent.pressed` | `theme.colors.accentPressed` | `color.accent.pressed` |
| ghost | any | RN-wrapper | `'transparent'` | `Color.Transparent` | `.clear` | n/a |
| link | any | RN-wrapper | `'transparent'` | `Color.Transparent` | `.clear` | n/a |
| glass | default | RN-wrapper | `color.surfaceVariant.default` | `LaneShadowTheme.colors.surfaceVariant` | `theme.colors.surfaceVariant` | `color.surfaceVariant.default` |
| glass | pressed | RN-wrapper | `color.surfaceVariant.pressed` | (pressed branch) | (pressed branch) | `color.surfaceVariant.pressed` |
| glass | disabled | RN-wrapper | `color.surfaceVariant.disabled` | (disabled branch) | (disabled branch) | `color.surfaceVariant.disabled` |

**Visual — textColor (by variant × state):**

| Variant | State | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|---|
| default / destructive / glass | any | RN-wrapper | `color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |
| secondary | any | RN-wrapper | `color.onSecondary.default` (fallback: onSurface) | `LaneShadowTheme.colors.onSecondary` | `theme.colors.onSecondary` | `color.onSecondary.default` |
| outline / ghost | idle | RN-wrapper | `color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |
| outline / ghost | pressed | RN-wrapper | `color.accent.default` | `LaneShadowTheme.colors.accent` | `theme.colors.accent` | `color.accent.default` |
| link | any | RN-wrapper | `color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |
| any | disabled | RN-wrapper | `color.onSurface.disabled` | `LaneShadowTheme.colors.onSurfaceDisabled` | `theme.colors.onSurfaceDisabled` | `color.onSurface.disabled` |

**Visual — border (outline/glass variant):**

| Variant | Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|---|
| outline | borderWidth | RN-wrapper | 1 | `Modifier.border(1.dp, ...)` | `.overlay(RoundedRectangle(...).stroke(..., lineWidth: 1))` | ESCALATE — propose `borderWidth.thin = 1` |
| outline | borderColor | RN-wrapper | `color.border.default` | `LaneShadowTheme.colors.border` | `theme.colors.border` | `color.border.default` |
| glass | borderWidth | RN-wrapper | 1 | `Modifier.border(1.dp, ...)` | same | ESCALATE — same as above |
| glass | borderColor | RN-wrapper | `color.border.default` | `LaneShadowTheme.colors.border` | `theme.colors.border` | `color.border.default` |

**Visual — opacity (disabled):**

| State | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| disabled | RN-wrapper | `opacity: 0.5` | `Modifier.alpha(0.5f)` | `.opacity(0.5)` | ESCALATE — propose `opacity.disabled = 0.5` |

**Typography (Paper labelLarge — used for button label text):**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| fontFamily | Paper/tokens | `sans-serif-medium` (Android) | `MaterialTheme.typography.labelLarge.fontFamily` → map to LaneShadow font | `.font(.system(size: 14, weight: .medium))` | `type.label.md.fontWeight` |
| fontSize | Paper/tokens | 14 | `14.sp` | `14` | `type.label.md.fontSize` |
| fontWeight | Paper/tokens | `'500'` (medium) | `FontWeight.Medium` | `.medium` | `type.label.md.fontWeight` |
| lineHeight | Paper/tokens | 20 | `LineHeightStyle` or `lineHeight = 20.sp` | `.lineSpacing(20 - 14)` = 6 | `type.label.md.lineHeight` |
| letterSpacing | Paper/tokens | 0.1 | `LetterSpacing(0.1.sp)` | `.tracking(0.1)` | ESCALATE — `type.label.md` missing letterSpacing; propose `0.1` |
| textDecorationLine | RN-wrapper | `'underline'` when `variant='link'` | `TextDecoration.Underline` | `.underline()` | n/a |

**State — opacity:**

| State | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| loading or disabled | RN-wrapper | `opacity: disabled ? 0.5 : 1` | `Modifier.alpha(if (disabled \|\| loading) 0.5f else 1f)` | `.opacity(...)` | ESCALATE — `opacity.disabled = 0.5` |

**Interaction:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| accessibilityRole | RN-wrapper | `'button'` | `Modifier.semantics { role = Role.Button }` | `.accessibilityAddTraits(.isButton)` | n/a |
| accessibilityState.disabled | RN-wrapper | `disabled \|\| loading` | `Modifier.semantics { disabled() }` | `.accessibilityAddTraits(.notEnabled)` | n/a |
| testID | RN-wrapper | passed via prop | `Modifier.testTag(testID)` | `.accessibilityIdentifier(testID)` | n/a |
| hitSlop | Pressable | none set | n/a | n/a | n/a |

---

### PrimaryButton

**Source files read:**
- LaneShadow: `react-native/components/ui/primary-button.tsx`
- Framework: `node_modules/react-native-paper/src/styles/themes/v3/tokens.tsx`, `node_modules/react-native-paper/src/core/theming.tsx`, `node_modules/react-native/Libraries/Components/View/View.js`

> **Note**: PrimaryButton wraps `View` (not `Pressable`) — it renders the copper glow container. The caller provides the gesture. Android uses `Box` + `Modifier.clickable`; iOS uses custom `ButtonStyle`.

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | height | RN-wrapper | prop `height` default=56 | `Modifier.height(height.dp)` | `.frame(height: 56)` | ESCALATE — propose `space.5xl = 56` |
| Layout | borderRadius | RN-wrapper | hardcoded `20` | `RoundedCornerShape(20.dp)` | `RoundedRectangle(cornerRadius: 20)` | ESCALATE — `radius` token 20 missing; propose `radius.xl2 = 20` or map to `radius.xl = 24` (nearest) |
| Layout | alignItems | RN-wrapper | `'center'` | `Arrangement.Center` | `HStack` default | n/a |
| Layout | justifyContent | RN-wrapper | `'center'` | `Arrangement.Center` | n/a | n/a |
| Layout | paddingHorizontal | RN-wrapper | hardcoded `24` | `Modifier.padding(horizontal = 24.dp)` | `.padding(.horizontal, 24)` | ESCALATE — `space.xl = 24` ✓ use `space.xl` |
| Layout | contentGap | RN-wrapper | `gap: 8` | `Spacer(Modifier.width(8.dp))` | `Spacer(minLength: 8)` | `space.sm` |
| Visual | backgroundColor (default) | RN-wrapper | `color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |
| Visual | backgroundColor (disabled) | RN-wrapper | `color.primary.disabled` | `LaneShadowTheme.colors.primaryDisabled` | `theme.colors.primaryDisabled` | `color.primary.disabled` |
| Visual | shadowColor (default) | RN-wrapper | `rgba(184, 115, 50, 0.4)` (copper glow) | `Modifier.shadow(elevation=4.dp, ambientColor=Color(0x66B87332), spotColor=...)` | `.shadow(color: Color(0xB87332).opacity(0.4), radius: 16, y: 8)` | ESCALATE — no token; propose `color.primaryGlow = rgba(184,115,50,0.4)` |
| Visual | shadowColor (disabled) | RN-wrapper | `'transparent'` | none | none | n/a |
| Visual | shadowOffset.height | RN-wrapper | 8 | (in shadow modifier) | `y: 8` | ESCALATE — propose `shadow.primaryOffset = 8` |
| Visual | shadowOpacity | RN-wrapper | 0.4 (disabled: 0) | (in shadow modifier) | (in shadow modifier) | ESCALATE — `opacity.shadow.primary = 0.4` |
| Visual | shadowRadius | RN-wrapper | 16 | `elevation=4.dp` (approx) | `radius: 16` | ESCALATE — `shadow.primary.radius = 16` |
| Visual | elevation (Android) | RN-wrapper | 4 (disabled: 0) | `Modifier.shadow(elevation = 4.dp)` | n/a | ESCALATE — maps to `elevation[4]` conceptually |
| Typography | fontSize | RN-wrapper | hardcoded `16` | `16.sp` | `.font(.system(size: 16, weight: .semibold))` | `type.body.md.fontSize` (=16) ✓ |
| Typography | fontWeight | RN-wrapper | hardcoded `'600'` | `FontWeight.SemiBold` | `.semibold` | ESCALATE — propose `fontWeight.semibold = 600` |
| Typography | color | RN-wrapper | `color.onPrimary.default` | `LaneShadowTheme.colors.onPrimary` | `theme.colors.onPrimary` | `color.onPrimary.default` |
| State | opacity (disabled) | RN-wrapper | via backgroundColor switch, not opacity | backgroundColor = disabled color | same | `color.primary.disabled` |
| Interaction | accessibilityRole | caller (View) | not set on view — caller's responsibility | `Modifier.semantics { role = Role.Button }` on clickable wrapper | `.accessibilityAddTraits(.isButton)` | n/a |

---

### Input

**Source files read:**
- LaneShadow: `react-native/components/ui/input.tsx`
- Framework: `node_modules/react-native-paper/src/styles/themes/v3/tokens.tsx` (labelSmall for label), `node_modules/react-native/Libraries/Components/TextInput/TextInput.js`

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | height | RN-wrapper | hardcoded `48` | `Modifier.height(48.dp)` | `.frame(height: 48)` | ESCALATE — propose `size.inputHeight = 48` |
| Layout | width | RN-wrapper | `'100%'` | `Modifier.fillMaxWidth()` | `.frame(maxWidth: .infinity)` | n/a |
| Layout | borderRadius | RN-wrapper | `radius.xl` = 24 | `RoundedCornerShape(24.dp)` | `RoundedRectangle(cornerRadius: 24)` | `radius.xl` |
| Layout | leftIcon paddingLeft | RN-wrapper | hardcoded `16` | `Modifier.padding(start = 16.dp)` | `.padding(.leading, 16)` | `space.lg` ✓ |
| Layout | leftIcon paddingRight | RN-wrapper | hardcoded `8` | `Modifier.padding(end = 8.dp)` | `.padding(.trailing, 8)` | `space.sm` ✓ |
| Layout | rightIcon paddingLeft | RN-wrapper | hardcoded `8` | `Modifier.padding(start = 8.dp)` | `.padding(.leading, 8)` | `space.sm` ✓ |
| Layout | rightIcon paddingRight | RN-wrapper | hardcoded `16` | `Modifier.padding(end = 16.dp)` | `.padding(.trailing, 16)` | `space.lg` ✓ |
| Layout | textInput paddingHorizontal | RN-wrapper | hardcoded `8` | (handled by BasicTextField padding) | (same) | `space.sm` ✓ |
| Layout | textInput paddingVertical | RN-wrapper | hardcoded `12` | (handled by BasicTextField padding) | (same) | `space.md` ✓ |
| Layout | wrapper gap (label→input) | RN-wrapper | `gap: 4` | `Spacer(Modifier.height(4.dp))` | `Spacer(minLength: 4)` | `space.xs` ✓ |
| Visual | backgroundColor | RN-wrapper | `color.surface.default` | `LaneShadowTheme.colors.surface` | `theme.colors.surface` | `color.surface.default` |
| Visual | overflow | RN-wrapper | `'hidden'` | `Modifier.clip(shape)` | `.clipped()` | n/a |
| Visual | opacity (disabled) | RN-wrapper | `editable ? 1 : 0.5` | `Modifier.alpha(if (!editable) 0.5f else 1f)` | `.opacity(...)` | ESCALATE — `opacity.disabled = 0.5` |
| Visual | border — idle | RN-wrapper | none (no default border) | no border | no border | n/a |
| Visual | border — focused | RN-wrapper | 1px `color.primary.default` | `Modifier.border(1.dp, LaneShadowTheme.colors.primary, shape)` | `.overlay(RoundedRectangle(cornerRadius:24).stroke(theme.colors.primary, lineWidth: 1))` | `color.primary.default` |
| Visual | border — error | RN-wrapper | 1px `color.danger.default` | `Modifier.border(1.dp, LaneShadowTheme.colors.danger, shape)` | (same with danger) | `color.danger.default` |
| Typography — label | fontFamily | Paper labelSmall | `sans-serif-medium` | `FontFamily.Default / Medium` | `.system(size:11, weight:.medium)` | `type.label.sm.fontWeight` |
| Typography — label | fontSize | Paper labelSmall | 11 | `11.sp` | `11` | ESCALATE — `type.label.sm.fontSize = 11` missing from tokens; use `type.label.sm` from Paper |
| Typography — label | fontWeight | Paper labelSmall | `'500'` | `FontWeight.Medium` | `.medium` | `type.label.sm.fontWeight` |
| Typography — label | lineHeight | Paper labelSmall | 16 | `16.sp` | `.lineSpacing(16 - 11)` = 5 | n/a |
| Typography — label | letterSpacing | Paper labelSmall | 0.5 | `LetterSpacing(0.5.sp)` | `.tracking(0.5)` | ESCALATE — missing from token; propose `type.label.sm.letterSpacing = 0.5` |
| Typography — label | textTransform | RN-wrapper | `'uppercase'` | `text.uppercase()` | `.textCase(.uppercase)` | n/a |
| Typography — label | color | RN-wrapper | `color.onSurface.subtle` | `LaneShadowTheme.colors.onSurfaceSubtle` | `theme.colors.onSurfaceSubtle` | `color.onSurface.subtle` |
| Typography — label | paddingLeft | RN-wrapper | `space.xs` = 4 | `Modifier.padding(start = 4.dp)` | `.padding(.leading, 4)` | `space.xs` |
| Typography — input | fontSize | RN TextInput | 16 (default; not overridden in wrapper) | `16.sp` via `BasicTextField` | `.font(.body)` | `type.body.md.fontSize` |
| Typography — input | fontWeight | RN TextInput | `'400'` (default) | `FontWeight.Normal` | `.regular` | `type.body.md.fontWeight` |
| Typography — input | color | RN-wrapper | `color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |
| Typography — input | placeholderColor | RN-wrapper | `color.onSurface.subtle` | `LocalContentColor provides LaneShadowTheme.colors.onSurfaceSubtle` | `.foregroundStyle(theme.colors.onSurfaceSubtle)` | `color.onSurface.subtle` |
| Interaction — icon | iconSize | RN-wrapper | hardcoded `20` | `Modifier.size(20.dp)` | `.frame(width: 20, height: 20)` | ESCALATE — propose `iconSize.md = 20` |
| Interaction — icon | iconColor (idle) | RN-wrapper | `color.onSurface.muted` | `LaneShadowTheme.colors.onSurfaceMuted` | `theme.colors.onSurfaceMuted` | `color.onSurface.muted` |
| Interaction — icon | iconColor (focused) | RN-wrapper | `color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |
| Interaction — icon | iconColor (error) | RN-wrapper | `color.danger.default` | `LaneShadowTheme.colors.danger` | `theme.colors.danger` | `color.danger.default` |
| Interaction — icon | iconColor (disabled) | RN-wrapper | `color.onSurface.disabled` | `LaneShadowTheme.colors.onSurfaceDisabled` | `theme.colors.onSurfaceDisabled` | `color.onSurface.disabled` |
| Keyboard | android_keyboardInputMode | RN TextInput default | `'adjustResize'` (default on Android) | handled by Compose scaffold | n/a | n/a |
| State | `onFocus` / `onBlur` | RN-wrapper | `useState` isFocused drives border | `InteractionSource` + `collectIsFocusedAsState()` | `@FocusState` | n/a |

---

### Textarea

**Source files read:**
- LaneShadow: `react-native/components/ui/textarea.tsx`
- Framework: `node_modules/react-native/Libraries/Components/TextInput/TextInput.js`

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | width | RN-wrapper | `'100%'` | `Modifier.fillMaxWidth()` | `.frame(maxWidth: .infinity)` | n/a |
| Layout | minHeight | RN-wrapper | hardcoded `80` | `Modifier.heightIn(min = 80.dp)` | `.frame(minHeight: 80)` | ESCALATE — propose `size.textareaMinHeight = 80` |
| Layout | borderRadius | RN-wrapper | `radius.md` = 8 | `RoundedCornerShape(8.dp)` | `RoundedRectangle(cornerRadius: 8)` | `radius.md` |
| Layout | paddingHorizontal | RN-wrapper | `space.md` = 12 | `Modifier.padding(horizontal = 12.dp)` | `.padding(.horizontal, 12)` | `space.md` |
| Layout | paddingVertical | RN-wrapper | `space.sm` = 8 | `Modifier.padding(vertical = 8.dp)` | `.padding(.vertical, 8)` | `space.sm` |
| Layout | textAlignVertical | RN-wrapper | `'top'` | `BasicTextField contentAlignment = Alignment.Top` | `.multilineTextAlignment(.leading)` | n/a |
| Visual | backgroundColor | RN-wrapper | `color.input.default` | `LaneShadowTheme.colors.input` | `theme.colors.input` | `color.input.default` |
| Visual | opacity (disabled) | RN-wrapper | `editable ? 1 : 0.5` | `Modifier.alpha(...)` | `.opacity(...)` | ESCALATE — `opacity.disabled = 0.5` |
| Visual | border (idle) | RN-wrapper | 1px `color.border.default` | `Modifier.border(1.dp, LaneShadowTheme.colors.border, shape)` | `.overlay(RoundedRectangle(cornerRadius:8).stroke(theme.colors.border, lineWidth: 1))` | `color.border.default` |
| Visual | border (focused) | RN-wrapper | 2px `color.ring.default` | `Modifier.border(2.dp, LaneShadowTheme.colors.ring, shape)` | `.overlay(...stroke(..., lineWidth: 2))` | `color.ring.default` |
| Visual | border (error) | RN-wrapper | 1px `color.danger.default` | `Modifier.border(1.dp, LaneShadowTheme.colors.danger, shape)` | (same) | `color.danger.default` |
| Typography | uses | RN-wrapper | `semantic.type.body.sm` = {fontSize:14, lineHeight:21, fontWeight:400} | `TextStyle(fontSize=14.sp, lineHeight=21.sp, fontWeight=FontWeight.Normal)` | `.font(.system(size:14))` | `type.body.sm` |
| Typography | color | RN-wrapper | `color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |
| Typography | placeholderColor | RN-wrapper | `color.onSurface.subtle` | (via LocalContentColor) | `.foregroundStyle(theme.colors.onSurfaceSubtle)` | `color.onSurface.subtle` |
| Keyboard | multiline | RN TextInput | `multiline=true` | `BasicTextField` (always multiline) | `TextEditor` | n/a |
| State | onFocus/onBlur | RN-wrapper | useState isFocused drives border switch | `collectIsFocusedAsState()` | `@FocusState` | n/a |

---

### BottomSheetInput

**Source files read:**
- LaneShadow: `react-native/components/ui/bottom-sheet-input.tsx`
- Framework: `node_modules/@gorhom/bottom-sheet/src/components/bottomSheetTextInput/BottomSheetTextInput.tsx`, `node_modules/react-native-paper/src/styles/themes/v3/tokens.tsx` (labelSmall for label)

> **Critical behavioral note**: `BottomSheetTextInput` is a thin wrapper around `react-native-gesture-handler`'s `TextInput`. It registers with `useBottomSheetInternal()` so the sheet's `animatedKeyboardState` tracks focus target, enabling `keyboardBehavior="interactive"` (sheet grows with keyboard) and `keyboardBlurBehavior="restore"` (sheet shrinks when keyboard dismisses). On Android, `android_keyboardInputMode="adjustResize"` is set on the parent `BottomSheetWrapper`. The Android native equivalent must set `WindowCompat.setDecorFitsSystemWindows(window, false)` + `ViewCompat.setWindowInsetsAnimationCallback(...)` on the activity, or use Compose's `imePadding()` modifier inside a `BottomSheetScaffold`.

Visual properties are **identical to Input** — same height (48), same borderRadius (`radius.xl = 24`), same color tokens, same icon placement. Only the input field widget differs: `BottomSheetTextInput` vs `TextInput`.

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | height | RN-wrapper | hardcoded `48` | `Modifier.height(48.dp)` | `.frame(height: 48)` | ESCALATE — `size.inputHeight = 48` |
| Layout | borderRadius | RN-wrapper | `radius.xl` = 24 | `RoundedCornerShape(24.dp)` | `RoundedRectangle(cornerRadius: 24)` | `radius.xl` |
| Layout | icon positioning | RN-wrapper | same as Input (pl-4/pr-2) | same as Input | same as Input | `space.lg` / `space.sm` |
| Layout | label gap | RN-wrapper | `gap: 4` | `Spacer(Modifier.height(4.dp))` | `Spacer(minLength: 4)` | `space.xs` |
| Visual | backgroundColor | RN-wrapper | `color.surface.default` | `LaneShadowTheme.colors.surface` | `theme.colors.surface` | `color.surface.default` |
| Visual | border (focused) | RN-wrapper | 1px `color.primary.default` | `Modifier.border(1.dp, ...)` | `.overlay(...)` | `color.primary.default` |
| Visual | border (error) | RN-wrapper | 1px `color.danger.default` | `Modifier.border(1.dp, ...)` | `.overlay(...)` | `color.danger.default` |
| Visual | opacity (disabled) | RN-wrapper | 0.5 | `Modifier.alpha(0.5f)` | `.opacity(0.5)` | ESCALATE — `opacity.disabled = 0.5` |
| Typography — label | Same as Input label | Paper labelSmall | fontSize=11 fontWeight=500 letterSpacing=0.5 uppercase | same as Input label | same | same |
| Typography — input | fontSize | RN-wrapper | hardcoded `16` | `16.sp` | `.font(.system(size: 16))` | `type.body.md.fontSize` |
| Typography — input | fontWeight | RN-wrapper | hardcoded `'400'` | `FontWeight.Normal` | `.regular` | `type.body.md.fontWeight` |
| Keyboard | behavior | Gorhom + BottomSheetWrapper | `keyboardBehavior="interactive"` | `Modifier.imePadding()` on bottom sheet content; `android_windowSoftInputMode = "adjustResize"` on Activity | `.presentationDetents([.medium]).scrollDismissesKeyboard(.interactively)` | n/a |
| Keyboard | blurBehavior | Gorhom + BottomSheetWrapper | `keyboardBlurBehavior="restore"` | Sheet snaps back to pre-keyboard detent on blur | same | n/a |
| Keyboard | focus registration | Gorhom BottomSheetTextInput | registers node handle with `textInputNodesRef` + `animatedKeyboardState` | No direct equivalent — use `FocusRequester` + `LaunchedEffect` to drive sheet expansion | `@FocusState` + sheet detent change | n/a |
| Interaction | onFocus/onBlur | Gorhom wrapper | calls `animatedKeyboardState.set(target)` on focus; clears on blur if no other input focused | `InteractionSource.collectIsFocusedAsState()` | `@FocusState` | n/a |

---

### Switch

**Source files read:**
- LaneShadow: `react-native/components/ui/switch.tsx`
- Framework: `node_modules/react-native/Libraries/Animated/Animated.js`, `node_modules/react-native/Libraries/Components/Pressable/Pressable.js`

> **Note**: This is a **fully custom switch** — it does NOT use React Native's `Switch` component. The RN team built track + thumb from scratch using `Animated.View` + `Animated.timing`. The Android implementation must replicate the exact geometry, NOT use `Switch` from M3 which has different dimensions (52×32 track; 20px thumb vs LaneShadow's 44×24/20px).

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | trackWidth | RN-wrapper | hardcoded `44` | `Modifier.width(44.dp)` | `.frame(width: 44)` | ESCALATE — propose `control.switchTrackWidth = 44` |
| Layout | trackHeight | RN-wrapper | hardcoded `24` | `Modifier.height(24.dp)` | `.frame(height: 24)` | ESCALATE — propose `control.switchTrackHeight = 24` |
| Layout | thumbSize | RN-wrapper | `20 × 20` | `Modifier.size(20.dp)` | `.frame(width: 20, height: 20)` | ESCALATE — propose `control.switchThumbSize = 20` |
| Layout | thumbOffset at off | RN-wrapper | `translateX = 2` (left margin 2px) | `offset(x = 2.dp)` | `.offset(x: 2)` | ESCALATE — `space.xs/2 = 2`; propose `control.switchThumbOffsetOff = 2` |
| Layout | thumbOffset at on | RN-wrapper | `translateX = 22` | `offset(x = 22.dp)` | `.offset(x: 22)` | ESCALATE — propose `control.switchThumbOffsetOn = 22` |
| Visual | trackColor (on) | RN-wrapper | `color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |
| Visual | trackColor (off) | RN-wrapper | `color.input.default` | `LaneShadowTheme.colors.input` | `theme.colors.input` | `color.input.default` |
| Visual | trackBorderRadius | RN-wrapper | `radius.full` = 9999 | `RoundedCornerShape(percent = 50)` | `Capsule()` | `radius.full` |
| Visual | trackBorderWidth | RN-wrapper | `2px transparent` | `Modifier.border(2.dp, Color.Transparent, Capsule)` | `.strokeBorder(Color.clear, lineWidth: 2)` | n/a |
| Visual | thumbColor | RN-wrapper | `color.surface.default` | `LaneShadowTheme.colors.surface` | `theme.colors.surface` | `color.surface.default` |
| Visual | thumbBorderRadius | RN-wrapper | `radius.full` | `CircleShape` | `Circle()` | `radius.full` |
| Visual | thumbShadow | RN-wrapper | `...semantic.elevation[2]` = shadowColor=#000, shadowOffset={0,2}, shadowOpacity=0.05, shadowRadius=4, elevation=2 | `Modifier.shadow(elevation = 2.dp, shape = CircleShape)` | `.shadow(color:.black.opacity(0.05), radius: 4, y: 2)` | `elevation[2]` |
| Visual | opacity (disabled) | RN-wrapper | `disabled ? 0.5 : 1` | `Modifier.alpha(if (disabled) 0.5f else 1f)` | `.opacity(disabled ? 0.5 : 1)` | ESCALATE — `opacity.disabled = 0.5` |
| Animation | duration | RN-wrapper | `200ms` | `animateFloatAsState(duration = 200)` or `updateTransition` | `withAnimation(.easeInOut(duration: 0.2))` | ESCALATE — propose `motion.duration.medium = 200` |
| Animation | easing | RN-wrapper | `Animated.timing` default = linear | `tween(durationMillis = 200, easing = LinearEasing)` | `.linear` | ESCALATE — propose `motion.easing.switch = linear` |
| Animation | property animated | RN-wrapper | thumbTranslateX (0→22, 22→0) | `animateFloatAsState(if (value) 22f else 2f)` | `@State var offsetX: CGFloat` animated | n/a |
| Interaction | accessibilityRole | RN-wrapper | `'switch'` | `Modifier.semantics { role = Role.Switch }` | `.accessibilityAddTraits(.isToggle)` | n/a |
| Interaction | accessibilityState.checked | RN-wrapper | `value` (bool) | `Modifier.semantics { stateDescription = if (value) "On" else "Off" }` | `.accessibilityValue(value ? "1" : "0")` | n/a |
| Interaction | accessibilityState.disabled | RN-wrapper | `disabled` | `Modifier.semantics { disabled() }` | `.accessibilityAddTraits(.notEnabled)` | n/a |

---

### Toggle

**Source files read:**
- LaneShadow: `react-native/components/ui/toggle.tsx`
- Framework: `node_modules/react-native-paper/src/styles/themes/v3/tokens.tsx` (via semantic.type.label.md), `node_modules/react-native/Libraries/Components/Pressable/Pressable.js`

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | height (sm) | RN-wrapper | hardcoded `36` | `Modifier.height(36.dp)` | `.frame(height: 36)` | `space.xl + space.md` = 36 ✓ |
| Layout | height (default) | RN-wrapper | hardcoded `40` | `Modifier.height(40.dp)` | `.frame(height: 40)` | `space.2xl + space.sm` = 40 ✓ |
| Layout | height (lg) | RN-wrapper | hardcoded `44` | `Modifier.height(44.dp)` | `.frame(height: 44)` | `space.2xl + space.md` = 44 ✓ |
| Layout | paddingHorizontal (all sizes) | RN-wrapper | `space.md` = 12 | `Modifier.padding(horizontal = 12.dp)` | `.padding(.horizontal, 12)` | `space.md` |
| Layout | borderRadius | RN-wrapper | `radius.md` = 8 | `RoundedCornerShape(8.dp)` | `RoundedRectangle(cornerRadius: 8)` | `radius.md` |
| Layout | iconSpacing | RN-wrapper | `space.sm` = 8 | `Spacer(Modifier.width(8.dp))` | `Spacer(minLength: 8)` | `space.sm` |
| Visual | backgroundColor (pressed=true) | RN-wrapper | `color.accent.default` | `LaneShadowTheme.colors.accent` | `theme.colors.accent` | `color.accent.default` |
| Visual | backgroundColor (pressed=false, outline) | RN-wrapper | `'transparent'` | `Color.Transparent` | `.clear` | n/a |
| Visual | backgroundColor (idle, default variant) | RN-wrapper | `'transparent'` | `Color.Transparent` | `.clear` | n/a |
| Visual | backgroundColor (finger-pressed, unpressed) | RN-wrapper | `color.muted.pressed \|\| color.muted.default` | `LaneShadowTheme.colors.mutedPressed` | `theme.colors.mutedPressed` | `color.muted.pressed` |
| Visual | border (outline variant only) | RN-wrapper | 1px `color.border.default` | `Modifier.border(1.dp, LaneShadowTheme.colors.border, shape)` | `.overlay(RoundedRectangle(cornerRadius:8).stroke(...))` | `color.border.default` |
| Visual | opacity (disabled) | RN-wrapper | `disabled ? 0.5 : 1` | `Modifier.alpha(if (disabled) 0.5f else 1f)` | `.opacity(...)` | ESCALATE — `opacity.disabled = 0.5` |
| Typography | source | RN-wrapper | `semantic.type.label.md` = {fontSize:14, lineHeight:20, fontWeight:500} | `TextStyle(fontSize=14.sp, lineHeight=20.sp, fontWeight=FontWeight.Medium)` | `.font(.system(size:14, weight:.medium))` | `type.label.md` |
| Typography | color (pressed) | RN-wrapper | `color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |
| Typography | color (idle) | RN-wrapper | `color.onSurface.muted \|\| color.onSurface.default` | `LaneShadowTheme.colors.onSurfaceMuted` | `theme.colors.onSurfaceMuted` | `color.onSurface.muted` |
| Typography | color (disabled) | RN-wrapper | `color.onSurface.disabled` | `LaneShadowTheme.colors.onSurfaceDisabled` | `theme.colors.onSurfaceDisabled` | `color.onSurface.disabled` |
| Interaction | accessibilityRole | RN-wrapper | `'button'` | `Modifier.semantics { role = Role.Button }` | `.accessibilityAddTraits(.isButton)` | n/a |
| Interaction | accessibilityState.selected | RN-wrapper | `pressed` | `Modifier.semantics { selected = pressed }` | `.accessibilityAddTraits(pressed ? .isSelected : [])` | n/a |
| Interaction | accessibilityState.disabled | RN-wrapper | `disabled` | `Modifier.semantics { disabled() }` | `.accessibilityAddTraits(.notEnabled)` | n/a |

---

### Checkbox

**Source files read:**
- LaneShadow: `react-native/components/ui/checkbox.tsx`
- Framework: `node_modules/react-native/Libraries/Components/Pressable/Pressable.js`

> Note: Checkbox uses `<Text>` from react-native-paper for the checkmark glyph (✓). The Typography section below documents that text's style. For Android use a Canvas-drawn checkmark or vector drawable, NOT `Checkbox` from M3 (different visual).

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | size | RN-wrapper | `16 × 16` | `Modifier.size(16.dp)` | `.frame(width: 16, height: 16)` | ESCALATE — propose `control.checkboxSize = 16` |
| Layout | borderRadius | RN-wrapper | `radius.sm` = 4 | `RoundedCornerShape(4.dp)` | `RoundedRectangle(cornerRadius: 4)` | `radius.sm` |
| Layout | indeterminate bar: width | RN-wrapper | hardcoded `8` | `Modifier.width(8.dp)` | `.frame(width: 8)` | ESCALATE — propose `control.checkboxIndetermWidth = 8` |
| Layout | indeterminate bar: height | RN-wrapper | hardcoded `2` | `Modifier.height(2.dp)` | `.frame(height: 2)` | ESCALATE — propose `control.checkboxIndetermHeight = 2` |
| Layout | indeterminate bar: borderRadius | RN-wrapper | hardcoded `1` | `RoundedCornerShape(1.dp)` | `RoundedRectangle(cornerRadius: 1)` | ESCALATE — `radius.none = 0` (nearest) |
| Visual | backgroundColor (unchecked) | RN-wrapper | `'transparent'` | `Color.Transparent` | `.clear` | n/a |
| Visual | backgroundColor (checked/indeterminate, idle) | RN-wrapper | `color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |
| Visual | backgroundColor (checked, pressed) | RN-wrapper | `color.primary.pressed` | `LaneShadowTheme.colors.primaryPressed` | `theme.colors.primaryPressed` | `color.primary.pressed` |
| Visual | borderWidth | RN-wrapper | `1` | `Modifier.border(1.dp, ...)` | `.overlay(RoundedRectangle(cornerRadius:4).stroke(..., lineWidth: 1))` | ESCALATE — `borderWidth.thin = 1` |
| Visual | borderColor | RN-wrapper | `color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |
| Visual | opacity (disabled) | RN-wrapper | `disabled ? 0.5 : 1` | `Modifier.alpha(if (disabled) 0.5f else 1f)` | `.opacity(...)` | ESCALATE — `opacity.disabled = 0.5` |
| Typography — checkmark ✓ | fontSize | RN-wrapper (Paper Text) | hardcoded `12` | Canvas draw checkmark (NOT Text) | `Path` draw | ESCALATE — `type.checkmark.fontSize = 12` |
| Typography — checkmark ✓ | fontWeight | RN-wrapper | hardcoded `'700'` | n/a (use Canvas) | n/a (use Path) | ESCALATE |
| Typography — checkmark ✓ | lineHeight | RN-wrapper | hardcoded `14` | n/a | n/a | n/a |
| Typography — checkmark ✓ | color | RN-wrapper | `color.onPrimary.default` | `LaneShadowTheme.colors.onPrimary` (Canvas paint color) | `theme.colors.onPrimary` | `color.onPrimary.default` |
| Typography — indeterminate | bar color | RN-wrapper | `color.onPrimary.default` | `LaneShadowTheme.colors.onPrimary` | `theme.colors.onPrimary` | `color.onPrimary.default` |
| Interaction | accessibilityRole | RN-wrapper | `'checkbox'` | `Modifier.semantics { role = Role.Checkbox }` | `.accessibilityAddTraits(.isButton)` (no native checkbox trait) | n/a |
| Interaction | accessibilityState.checked | RN-wrapper | `indeterminate ? 'mixed' : checked` | `Modifier.semantics { toggleableState = if (indeterminate) ToggleableState.Indeterminate else if (checked) ToggleableState.On else ToggleableState.Off }` | `.accessibilityValue(checked ? "1" : "0")` | n/a |
| Interaction | accessibilityState.disabled | RN-wrapper | `disabled` | `Modifier.semantics { disabled() }` | `.accessibilityAddTraits(.notEnabled)` | n/a |

---

### Slider

**Source files read:**
- LaneShadow: `react-native/components/ui/slider.tsx`
- Framework: `node_modules/react-native/Libraries/Components/View/View.js` (PanResponder — no Paper)

> This is a **fully custom slider** using `PanResponder`, NOT React Native's `Slider` or community `@react-native-community/slider`. The Android implementation must replicate the exact track/thumb geometry using `Slider` M3 with full override, or a `Canvas`-based custom composable.

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | container height | RN-wrapper | `20` (to vertically center 8px track + 20px thumb) | `Modifier.height(20.dp)` | `.frame(height: 20)` | ESCALATE — `control.sliderContainerHeight = 20` |
| Layout | container width | RN-wrapper | `'100%'` | `Modifier.fillMaxWidth()` | `.frame(maxWidth: .infinity)` | n/a |
| Layout | trackHeight | RN-wrapper | `8` | (in Slider `track` slot) | (in custom track view) | ESCALATE — `control.sliderTrackHeight = 8` |
| Layout | thumbSize | RN-wrapper | `20 × 20` | (in Slider `thumb` slot) | `.frame(width: 20, height: 20)` | ESCALATE — `control.sliderThumbSize = 20` |
| Layout | thumbTopOffset | RN-wrapper | `-6` (centers 20px thumb on 8px track) | automatically handled by Slider composable | n/a | n/a |
| Layout | thumbLeftMargin | RN-wrapper | `-10` (centers thumb at position) | `offset(x = -10.dp)` on thumb | n/a | n/a |
| Visual | trackColor (inactive) | RN-wrapper | `color.secondary.default` | `LaneShadowTheme.colors.secondary` (inactive track) | `theme.colors.secondary` | `color.secondary.default` |
| Visual | rangeColor (active) | RN-wrapper | `color.primary.default` | `LaneShadowTheme.colors.primary` (active track) | `theme.colors.primary` | `color.primary.default` |
| Visual | trackBorderRadius | RN-wrapper | `radius.full` = 9999 | `SliderDefaults.Track` custom or `RoundedCornerShape(percent=50)` | `Capsule()` | `radius.full` |
| Visual | thumbBorderColor | RN-wrapper | `color.primary.default` | `LaneShadowTheme.colors.primary` (thumb border) | `theme.colors.primary` | `color.primary.default` |
| Visual | thumbBorderWidth | RN-wrapper | `2` | `Modifier.border(2.dp, ..., CircleShape)` | `.strokeBorder(..., lineWidth: 2)` | ESCALATE — `borderWidth.thumb = 2` |
| Visual | thumbBackgroundColor | RN-wrapper | `color.background.default` | `LaneShadowTheme.colors.background` | `theme.colors.background` | `color.background.default` |
| Visual | thumbBorderRadius | RN-wrapper | `radius.full` | `CircleShape` | `Circle()` | `radius.full` |
| Visual | thumbShadow | RN-wrapper | `...semantic.elevation[2]` | `Modifier.shadow(elevation = 2.dp, shape = CircleShape)` | `.shadow(color:.black.opacity(0.05), radius: 4, y: 2)` | `elevation[2]` |
| Visual | opacity (disabled) | RN-wrapper | `disabled ? 0.5 : 1` | `Modifier.alpha(if (disabled) 0.5f else 1f)` | `.opacity(...)` | ESCALATE — `opacity.disabled = 0.5` |
| Interaction | accessibilityRole | RN-wrapper | `'adjustable'` | `Modifier.semantics { role = Role.Slider }` | `.accessibilityAddTraits(.isAdjustable)` | n/a |
| Interaction | accessibilityValue | RN-wrapper | `{min, max, now: value}` | `Modifier.semantics { setProgress { ... }; stateDescription = "$value" }` | `.accessibilityValue(Text(String(value)))` | n/a |
| Interaction | gesture | RN-wrapper | `PanResponder.create` (tap + drag both update value) | `Slider(onValueChange = ...)` with `SliderDefaults.Thumb / Track` override | `Slider(value:in:)` with `.tint(theme.colors.primary)` + custom thumb | n/a |
| Interaction | step | RN-wrapper | prop `step` default=1 | `Slider(steps = (max-min)/step - 1)` | `Slider(value:in:step:)` | n/a |

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
- UI-005

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
