# UI-016: iOS molecules 1/12 — layout & sections: `ThemeAppHeader`, `Header` (template-like), `ThemeSectionHeader`, `ThemeBottomNavigation`, `TeacherTabBar`, `ThemeToggleGroup`, `ThemeBanner`, `ThemeEmptyState`, `KeyboardAvoidingInput`, `MarkdownText`, `ThemePicker`

**Task ID:** UI-016
**Sprint:** Sprint 2 - UI Component Translation and Fidelity Sandbox
**Assigned To:** swift-implementer
**Reviewer:** swift-reviewer
**Estimate:** 480 min
**Type:** [FEATURE]
**Status:** Planned
**Phase:** Molecules
**Quality Score:** 115/115

---

## BACKGROUND

Sprint 2 translates the React Native baseline into native platform components and sandbox scenarios before rider-facing feature sprints resume. This task covers the `molecules` slice for `iOS molecules 1/12 — layout & sections: ThemeAppHeader, Header (template-like), ThemeSectionHeader, ThemeBottomNavigation, TeacherTabBar, ThemeToggleGroup, ThemeBanner, ThemeEmptyState, KeyboardAvoidingInput, MarkdownText, ThemePicker`.

**Objective:** Implement iOS molecules 1/12 — layout & sections: `ThemeAppHeader`, `Header` (template-like), `ThemeSectionHeader`, `ThemeBottomNavigation`, `TeacherTabBar`, `ThemeToggleGroup`, `ThemeBanner`, `ThemeEmptyState`, `KeyboardAvoidingInput`, `MarkdownText`, `ThemePicker` as SwiftUI work with parity to the RN baseline, token-only styling, and sandbox coverage.

**Success State:** A reviewer can open the iOS sandbox, browse this task's scenarios, and confirm naming, interface, theme, state, accessibility, and layout parity against RN.

## CRITICAL CONSTRAINTS

### MUST
- Implement the listed components or compositions with parity-aligned naming and interfaces: `ThemeAppHeader`, `Header` (template-like), `ThemeSectionHeader`, `ThemeBottomNavigation`, `TeacherTabBar`, `ThemeToggleGroup`, `ThemeBanner`, `ThemeEmptyState`, `KeyboardAvoidingInput`, `MarkdownText`, `ThemePicker`.
- Use only the LaneShadow core theme contract locked by `UI-001`: `tokens/semantic/semantic.tokens.json` as the source of truth, generated `native-theme` outputs as the shared packaging layer, and the platform theme entry points (`LaneShadowTheme` on Android, `.laneShadowTheme()` on iOS) for colors, spacing, typography, radii, elevation, and state styling.
- Register sandbox scenarios for default, interactive, and edge-case states with RN reference labels.
- Compose only from already-defined atoms on the same platform and preserve RN layout hierarchy.

### NEVER
- Add unrelated feature wiring or backend dependencies to satisfy sandbox rendering.
- Introduce hardcoded UI primitives or platform-only naming drift.

### STRICTLY
- Preserve light and dark parity, accessibility labels, and deterministic fixtures for every scenario.

## DELIVERABLES

- ios/LaneShadow/Views/Molecules/**
- ios/LaneShadow/Sandbox/Stories/MoleculesStories.swift — @MainActor enum with `static let all: [Story]`, aggregated into LaneShadowStories.all
- ios/LaneShadowTests/**
- ios/LaneShadowSnapshotTests/**

## ACCEPTANCE CRITERIA

### AC-1
**GIVEN** The RN baseline and atomic parity contract define the expected components and interfaces.
**WHEN** This task is implemented.
**THEN** The listed components or compositions exist in the correct iOS SwiftUI directories with parity-aligned names and signatures: `ThemeAppHeader`, `Header` (template-like), `ThemeSectionHeader`, `ThemeBottomNavigation`, `TeacherTabBar`, `ThemeToggleGroup`, `ThemeBanner`, `ThemeEmptyState`, `KeyboardAvoidingInput`, `MarkdownText`, `ThemePicker`.
**Verify:** `printf "%s\n" "`ThemeAppHeader`, `Header` (template-like), `ThemeSectionHeader`, `ThemeBottomNavigation`, `TeacherTabBar`, `ThemeToggleGroup`, `ThemeBanner`, `ThemeEmptyState`, `KeyboardAvoidingInput`, `MarkdownText`, `ThemePicker`"`

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
**GIVEN** native-sandbox is installed and a DEBUG build is running.
**WHEN** `make ios_sandbox` launches the sandbox (passes `-LaneShadowSandbox` arg to the app).
**THEN** every component listed in DELIVERABLES has at least one `Story(id: "<tier>.<component>.<state>", tier: .<tier>, component: "<Name>", name: "<State>", summary: "<rn-reference-path>") { _ in <SwiftUI usage> }` registered in `LaneShadowStories.all` and renders in the story-tree drawer under its tier, wrapped by `themedPreview { $0.laneShadowTheme() }`.

**Launch:** `make ios_sandbox` (canonical). Secondary: device shake (simulator: `xcrun simctl io booted shake`) or `xcrun simctl launch <id> com.laneshadow.app -LaneShadowSandbox`.

## TEST CRITERIA

| ID | Maps To | Boolean Statement | Verify |
|---|---|---|---|
| TC-1 | AC-1 | The listed components or compositions exist in the correct iOS SwiftUI directories with parity-aligned names and signatures: `ThemeAppHeader`, `Header` (template-like), `ThemeSectionHeader`, `ThemeBottomNavigation`, `TeacherTabBar`, `ThemeToggleGroup`, `ThemeBanner`, `ThemeEmptyState`, `KeyboardAvoidingInput`, `MarkdownText`, `ThemePicker`. | `printf "%s\n" "`ThemeAppHeader`, `Header` (template-like), `ThemeSectionHeader`, `ThemeBottomNavigation`, `TeacherTabBar`, `ThemeToggleGroup`, `ThemeBanner`, `ThemeEmptyState`, `KeyboardAvoidingInput`, `MarkdownText`, `ThemePicker`"` |
| TC-2 | AC-2 | All visuals use the LaneShadow core theme contract from `UI-001` and render correctly in both color modes without hardcoded UI primitives. | `rg -n "Token consumption\|light and dark" .spec/prds/native-rewrite/08d-component-parity-spec.md .spec/prds/native-rewrite/08-design-system.md` |
| TC-3 | AC-3 | Each listed component has deterministic sandbox coverage with RN reference labels and explicit state variants where applicable. | `rg -n "RN reference\|scenario\|interactive states" .spec/prds/native-rewrite/tasks/sprint-02-ui-component-translation/SPRINT.md` |
| TC-4 | AC-4 | Accessibility labels, touch targets, keyboard or safe-area handling, and motion or state parity behave correctly for this component family. | `rg -n "Accessibility\|Keyboard handling\|RTL support\|Animation parity\|State parity" .spec/prds/native-rewrite/08d-component-parity-spec.md` |
| TC-5 | ALL | Repo validation gates remain green for the touched workspace when this task is complete. | `pnpm type-check:native && swiftformat --lint ios/LaneShadow --config .swiftformat && xcodebuild -workspace ios/LaneShadow.xcworkspace -scheme LaneShadow -destination "platform=iOS Simulator,name=iPhone 16" test` |

## READING LIST

1. `.spec/prds/native-rewrite/README.md`
2. `.spec/prds/native-rewrite/tasks/sprint-02-ui-component-translation/SPRINT.md`
3. `.spec/prds/native-rewrite/08a-atomic-component-catalog.md`
4. `.spec/prds/native-rewrite/08d-component-parity-spec.md`
5. `RULES.md`
6. `.spec/prds/native-rewrite/08c-ios-component-map.md`

## GUARDRAILS

### WRITE-ALLOWED
- ios/LaneShadow/Views/Molecules/**
- ios/LaneShadow/Sandbox/**
- ios/LaneShadowTests/**
- ios/LaneShadowSnapshotTests/**
- ios/LaneShadowUITests/**

### WRITE-PROHIBITED
- android/**
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

**Reference:** `.spec/prds/native-rewrite/08c-ios-component-map.md`

**Pattern:** Single SwiftUI view with enum or binding-driven variants, theme environment consumption, and deterministic sandbox scenarios.

**Anti-pattern:** Default SwiftUI styling, live service dependencies, or platform-specific naming drift.

## TRANSLATION SOURCES

| Component | RN wrapper source | Framework primitives + `node_modules` paths | Native target file | Variants × sizes × states |
|---|---|---|---|---|
| ThemeAppHeader | `react-native/components/ui/app-header.tsx` | `node_modules/react-native/Libraries/Components/View/View.js`; `node_modules/react-native-paper/src/components/Text/Text.tsx` | `ios/LaneShadow/Views/Molecules/ThemeAppHeader.swift` | 1 layout × 2 states (default/pressed on icons) × 2 slots (left/right) |
| Header | `react-native/components/layouts/header.tsx` | `node_modules/react-native/Libraries/Components/View/View.js`; `node_modules/react-native-paper/src/components/Text/Text.tsx` | `ios/LaneShadow/Views/Molecules/Header.swift` | 1 fixed layout × 1 state (pressed on menu) |
| ThemeSectionHeader | `react-native/components/ui/section-header.tsx` | `node_modules/react-native/Libraries/Components/View/View.js`; `node_modules/react-native-paper/src/components/Text/Text.tsx` | `ios/LaneShadow/Views/Molecules/ThemeSectionHeader.swift` | 1 layout × 2 variants (with/without action) |
| ThemeBottomNavigation | `react-native/components/ui/bottom-navigation.tsx` | `node_modules/react-native/Libraries/Components/View/View.js`; `node_modules/react-native-paper/src/components/Text/Text.tsx` | `ios/LaneShadow/Views/Molecules/ThemeBottomNavigation.swift` | 1 fixed layout × 4 tabs × 2 states (active/inactive) |
| TeacherTabBar | `react-native/components/layouts/teacher-tab-bar.tsx` | `node_modules/react-native/Libraries/Components/View/View.js`; `node_modules/react-native/Libraries/Components/Pressable/Pressable.js` | `ios/LaneShadow/Views/Molecules/TeacherTabBar.swift` | 1 fixed layout × 2 tabs × 1 center action button × 3 states (default/active/disabled) |
| ThemeToggleGroup | `react-native/components/ui/toggle-group.tsx` | `node_modules/react-native/Libraries/Components/Pressable/Pressable.js`; `node_modules/react-native/Libraries/Components/View/View.js` | `ios/LaneShadow/Views/Molecules/ThemeToggleGroup.swift` | 2 variants (default/outline) × 3 sizes (sm/default/lg) × 2 modes (single/multiple) × 3 states (idle/pressed/disabled) |
| ThemeBanner | `react-native/components/ui/banner.tsx` | `node_modules/react-native-paper/src/components/Banner/Banner.tsx` | `ios/LaneShadow/Views/Molecules/ThemeBanner.swift` | 1 fixed layout × 2 states (visible/hidden) |
| ThemeEmptyState | `react-native/components/ui/empty-state.tsx` | `node_modules/react-native/Libraries/Components/View/View.js`; `node_modules/react-native-paper/src/components/Text/Text.tsx` | `ios/LaneShadow/Views/Molecules/ThemeEmptyState.swift` | 1 fixed layout × 2 variants (with/without CTA) |
| KeyboardAvoidingInput | `react-native/components/ui/keyboard-avoiding-input.tsx` | `node_modules/react-native/Libraries/Components/Keyboard/KeyboardAvoidingView.js` | `ios/LaneShadow/Views/Molecules/KeyboardAvoidingInput.swift` | 1 wrapper × 3 behaviors (padding/position/height) |
| MarkdownText | `react-native/components/ui/markdown-text.tsx` | `node_modules/react-native-markdown-display` (Markdown component) | `ios/LaneShadow/Views/Molecules/MarkdownText.swift` | 1 text renderer × CommonMark elements (headings, lists, code blocks, links, tables, blockquotes) |
| ThemePicker | `react-native/components/settings/theme-picker.tsx` | `node_modules/react-native/Libraries/Components/Pressable/Pressable.js`; `node_modules/react-native/Libraries/Components/View/View.js` | `ios/LaneShadow/Views/Molecules/ThemePicker.swift` | 1 fixed layout × 3 options (light/dark/auto) × 2 states (selected/unselected) |

## STYLE PROPERTIES MATRIX

> Exhaustive enumeration of every style property from both sources per `08f-translation-protocol.md`. Columns: Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping. `ESCALATE` = no token covers the value — add a proposed token to DECISIONS.md before implementing.
>
> **Token reference** (from `tokens/semantic/semantic.tokens.json`): space xs=4 sm=8 md=12 lg=16 xl=24 2xl=32 3xl=48 4xl=64; radius none=0 sm=4 md=8 lg=16 xl=24 2xl=32 full=9999; elevation[2] shadowOffset=0/2 shadowOpacity=0.05 shadowRadius=4 androidElevation=2.

### ThemeAppHeader

**Source files read:**
- LaneShadow: `react-native/components/ui/app-header.tsx`
- Framework: `node_modules/react-native/Libraries/Components/View/View.js`, `node_modules/react-native/Libraries/Components/Pressable/Pressable.js`, `node_modules/react-native-paper/src/components/Text/Text.tsx`

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | height | RN-wrapper | `60` | `Modifier.height(60.dp)` | `.frame(height: 60)` | ESCALATE — propose `space.5xl = 60` |
| Layout | padding | RN-wrapper | `semantic.space.lg` = 16 | `Modifier.padding(16.dp)` | `.padding(16)` | `space.lg` |
| Layout | flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| Layout | alignItems | RN-wrapper | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.alignment(.center)` | n/a |
| Layout | justifyContent | RN-wrapper | `'space-between'` | `horizontalArrangement = Arrangement.SpaceBetween` | n/a | n/a |
| Layout | iconButton size | RN-wrapper | `44 × 44` | `Modifier.size(44.dp)` | `.frame(width: 44, height: 44)` | ESCALATE — propose `size.touchTarget = 44` |
| Layout | iconButton padding | RN-wrapper | `semantic.space.sm` = 8 | `Modifier.padding(8.dp)` | `.padding(8)` | `space.sm` |
| Visual | backgroundColor | RN-wrapper | `semantic.color.background.default` + 80% opacity | `LaneShadowTheme.colors.background.copy(alpha = 0.8f)` | `theme.colors.background.opacity(0.8)` | `color.background.default` |
| Visual | borderBottomWidth | RN-wrapper | `1` | `Modifier.border(1.dp, ...)` | `.overlay(RoundedRectangle(...).stroke(..., lineWidth: 1))` | ESCALATE — propose `borderWidth.thin = 1` |
| Visual | borderBottomColor | RN-wrapper | `semantic.color.primary.default` + 20% opacity | `LaneShadowTheme.colors.primary.copy(alpha = 0.2f)` | `theme.colors.primary.opacity(0.2)` | `color.primary.default` |
| Visual | iconButton pressed backgroundColor | RN-wrapper | `semantic.color.surface.pressed` | `LaneShadowTheme.colors.surfacePressed` | `theme.colors.surfacePressed` | `color.surface.pressed` |
| Visual | iconButton borderRadius | RN-wrapper | `semantic.radius.full` = 9999 | `CircleShape` | `Circle()` | `radius.full` |
| Typography | title style | RN-wrapper | `semantic.type.heading.md` | `MaterialTheme.typography.headingMd` | `.font(.system(.heading(.md)))` | `type.heading.md` |
| Typography | title color | RN-wrapper | `semantic.color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |
| Typography | title textAlign | RN-wrapper | `'center'` | `textAlign = TextAlign.Center` | `.multilineTextAlignment(.center)` | n/a |
| Typography | icon size | RN-wrapper | `24` | `24.dp` | `24` | ESCALATE — propose `size.icon.default = 24` |
| Typography | icon color | RN-wrapper | `semantic.color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |

### Header

**Source files read:**
- LaneShadow: `react-native/components/layouts/header.tsx`
- Framework: `node_modules/react-native/Libraries/Components/View/View.js`, `node_modules/react-native/Libraries/Components/Pressable/Pressable.js`, `node_modules/react-native-paper/src/components/Text/Text.tsx`

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | height | RN-wrapper | `60` | `Modifier.height(60.dp)` | `.frame(height: 60)` | ESCALATE — propose `space.5xl = 60` |
| Layout | paddingHorizontal | RN-wrapper | `semantic.space.lg` = 16 | `Modifier.padding(horizontal = 16.dp)` | `.padding(.horizontal, 16)` | `space.lg` |
| Layout | paddingVertical | RN-wrapper | `semantic.space.sm` = 8 | `Modifier.padding(vertical = 8.dp)` | `.padding(.vertical, 8)` | `space.sm` |
| Layout | flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| Layout | alignItems | RN-wrapper | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.alignment(.center)` | n/a |
| Layout | justifyContent | RN-wrapper | `'space-between'` | `horizontalArrangement = Arrangement.SpaceBetween` | n/a | n/a |
| Layout | menuButton size | RN-wrapper | `44 × 44` | `Modifier.size(44.dp)` | `.frame(width: 44, height: 44)` | ESCALATE — propose `size.touchTarget = 44` |
| Layout | menuButton padding | RN-wrapper | `semantic.space.sm` = 8 | `Modifier.padding(8.dp)` | `.padding(8)` | `space.sm` |
| Visual | backgroundColor | RN-wrapper | `semantic.color.background.default` | `LaneShadowTheme.colors.background` | `theme.colors.background` | `color.background.default` |
| Visual | borderBottomWidth | RN-wrapper | `1` | `Modifier.border(1.dp, ...)` | `.overlay(RoundedRectangle(...).stroke(..., lineWidth: 1))` | ESCALATE — propose `borderWidth.thin = 1` |
| Visual | borderBottomColor | RN-wrapper | `semantic.color.border.default` | `LaneShadowTheme.colors.border` | `theme.colors.border` | `color.border.default` |
| Visual | menuButton pressed backgroundColor | RN-wrapper | `semantic.color.surface.pressed` | `LaneShadowTheme.colors.surfacePressed` | `theme.colors.surfacePressed` | `color.surface.pressed` |
| Visual | menuButton borderRadius | RN-wrapper | `semantic.radius.full` = 9999 | `CircleShape` | `Circle()` | `radius.full` |
| Typography | title variant | RN-wrapper | `titleLarge` (Paper) | `MaterialTheme.typography.titleLarge` | `.font(.system(.title(.large)))` | `type.title.lg` |
| Typography | title color | RN-wrapper | `semantic.color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |
| Typography | menu icon size | RN-wrapper | `24` | `24.dp` | `24` | ESCALATE — propose `size.icon.default = 24` |
| Typography | menu icon color | RN-wrapper | `semantic.color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |

### ThemeSectionHeader

**Source files read:**
- LaneShadow: `react-native/components/ui/section-header.tsx`
- Framework: `node_modules/react-native/Libraries/Components/View/View.js`, `node_modules/react-native-paper/src/components/Text/Text.tsx`

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| Layout | justifyContent | RN-wrapper | `'space-between'` | `horizontalArrangement = Arrangement.SpaceBetween` | n/a | n/a |
| Layout | alignItems | RN-wrapper | `'flex-start'` | `verticalAlignment = Alignment.Top` | `.alignment(.top)` | n/a |
| Typography | title fontSize | RN-wrapper | `20` | `20.sp` | `.font(.system(size: 20, weight: .semibold))` | ESCALATE — propose `type.section.title.fontSize = 20` |
| Typography | title fontWeight | RN-wrapper | `'600'` | `FontWeight.SemiBold` | `.semibold` | ESCALATE — propose `fontWeight.semibold = 600` |
| Typography | title color | RN-wrapper | `semantic.color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |
| Typography | subtitle fontSize | RN-wrapper | `14` | `14.sp` | `.font(.system(size: 14))` | ESCALATE — propose `type.section.subtitle.fontSize = 14` |
| Typography | subtitle marginTop | RN-wrapper | `4` | `Modifier.padding(top = 4.dp)` | `.padding(.top, 4)` | ESCALATE — propose `space.xxs = 4` |
| Typography | subtitle color | RN-wrapper | `semantic.color.onSurface.subtle` | `LaneShadowTheme.colors.onSurfaceSubtle` | `theme.colors.onSurfaceSubtle` | `color.onSurface.subtle` |
| Typography | action fontSize | RN-wrapper | `16` | `16.sp` | `.font(.system(size: 16, weight: .medium))` | `type.body.md.fontSize` (=16) ✓ |
| Typography | action fontWeight | RN-wrapper | `'500'` | `FontWeight.Medium` | `.medium` | `type.label.md.fontWeight` (=500) ✓ |
| Typography | action color | RN-wrapper | `semantic.color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |

### ThemeBottomNavigation

**Source files read:**
- LaneShadow: `react-native/components/ui/bottom-navigation.tsx`
- Framework: `node_modules/react-native/Libraries/Components/View/View.js`, `node_modules/react-native-paper/src/components/Text/Text.tsx`

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | height | RN-wrapper | `84` | `Modifier.height(84.dp)` | `.frame(height: 84)` | ESCALATE — propose `space.bottomNavHeight = 84` |
| Layout | borderTopWidth | RN-wrapper | `1` | `Modifier.border(1.dp, ...)` | `.overlay(RoundedRectangle(...).stroke(..., lineWidth: 1))` | ESCALATE — propose `borderWidth.thin = 1` |
| Layout | flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| Layout | justifyContent | RN-wrapper | `'space-around'` | `horizontalArrangement = Arrangement.SpaceAround` | n/a | n/a |
| Layout | paddingTop | RN-wrapper | `8` | `Modifier.padding(top = 8.dp)` | `.padding(.top, 8)` | `space.sm` ✓ |
| Layout | navItem gap | RN-wrapper | `4` | `Spacer(Modifier.height(4.dp))` | `Spacer(minLength: 4)` | `space.xs` ✓ |
| Layout | navItem paddingVertical | RN-wrapper | `8` | `Modifier.padding(vertical = 8.dp)` | `.padding(.vertical, 8)` | `space.sm` ✓ |
| Layout | navItem paddingHorizontal | RN-wrapper | `16` | `Modifier.padding(horizontal = 16.dp)` | `.padding(.horizontal, 16)` | `space.lg` ✓ |
| Visual | backgroundColor | RN-wrapper | `semantic.color.surface.default` | `LaneShadowTheme.colors.surface` | `theme.colors.surface` | `color.surface.default` |
| Visual | borderTopColor | RN-wrapper | `semantic.color.divider.default` | `LaneShadowTheme.colors.divider` | `theme.colors.divider` | `color.divider.default` |
| Typography | icon size | RN-wrapper | `24` | `24.dp` | `24` | ESCALATE — propose `size.icon.default = 24` |
| Typography | label fontSize | RN-wrapper | `10` | `10.sp` | `.font(.system(size: 10))` | ESCALATE — propose `type.label.xs.fontSize = 10` |
| Typography | label color (active) | RN-wrapper | `semantic.color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |
| Typography | label color (inactive) | RN-wrapper | `semantic.color.onSurface.subtle` | `LaneShadowTheme.colors.onSurfaceSubtle` | `theme.colors.onSurfaceSubtle` | `color.onSurface.subtle` |

### TeacherTabBar

**Source files read:**
- LaneShadow: `react-native/components/layouts/teacher-tab-bar.tsx`
- Framework: `node_modules/react-native/Libraries/Components/View/View.js`, `node_modules/react-native/Libraries/Components/Pressable/Pressable.js`, `node_modules/react-native-paper/src/components/Text/Text.tsx`

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | height | RN-wrapper | `80` | `Modifier.height(80.dp)` | `.frame(height: 80)` | ESCALATE — propose `space.teacherTabBarHeight = 80` |
| Layout | borderTopWidth | RN-wrapper | `1` | `Modifier.border(1.dp, ...)` | `.overlay(RoundedRectangle(...).stroke(..., lineWidth: 1))` | ESCALATE — propose `borderWidth.thin = 1` |
| Layout | flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| Layout | paddingHorizontal | RN-wrapper | `semantic.space.lg` = 16 | `Modifier.padding(horizontal = 16.dp)` | `.padding(.horizontal, 16)` | `space.lg` |
| Layout | tabItem gap | RN-wrapper | `semantic.space.xs` = 4 | `Spacer(Modifier.height(4.dp))` | `Spacer(minLength: 4)` | `space.xs` |
| Layout | centerButton marginTop | RN-wrapper | `-30` | `Modifier.offset(y = (-30).dp)` | `.offset(y: -30)` | n/a |
| Layout | centerButton size | RN-wrapper | `64 × 64` | `Modifier.size(64.dp)` | `.frame(width: 64, height: 64)` | ESCALATE — propose `size.teacherFAB = 64` |
| Layout | activeIndicator padding | RN-wrapper | `semantic.space.sm` = 8 | `Modifier.padding(8.dp)` | `.padding(8)` | `space.sm` |
| Visual | backgroundColor | RN-wrapper | `semantic.color.background.default` | `LaneShadowTheme.colors.background` | `theme.colors.background` | `color.background.default` |
| Visual | borderTopColor | RN-wrapper | `semantic.color.border.default` | `LaneShadowTheme.colors.border` | `theme.colors.border` | `color.border.default` |
| Visual | centerButton backgroundColor (default) | RN-wrapper | `semantic.color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |
| Visual | centerButton backgroundColor (pressed) | RN-wrapper | `semantic.color.primary.pressed` | `LaneShadowTheme.colors.primaryPressed` | `theme.colors.primaryPressed` | `color.primary.pressed` |
| Visual | centerButton backgroundColor (disabled) | RN-wrapper | `semantic.color.primary.disabled` | `LaneShadowTheme.colors.primaryDisabled` | `theme.colors.primaryDisabled` | `color.primary.disabled` |
| Visual | centerButton borderRadius | RN-wrapper | `semantic.radius.full` = 9999 | `CircleShape` | `Circle()` | `radius.full` |
| Visual | centerButton shadowColor | RN-wrapper | `semantic.color.primary.default` | `shadowColor = LaneShadowTheme.colors.primary` | `.shadow(color: theme.colors.primary)` | `color.primary.default` |
| Visual | centerButton shadowOffset | RN-wrapper | `width: 0, height: 4` | `offset(0.dp, 4.dp)` | `y: 4` | ESCALATE — propose `shadow.fab.offset = 4` |
| Visual | centerButton shadowOpacity | RN-wrapper | `0.3` | `alpha = 0.3f` | `.opacity(0.3)` | ESCALATE — propose `shadow.fab.opacity = 0.3` |
| Visual | centerButton shadowRadius | RN-wrapper | `8` | `blurRadius = 8.dp` | `radius: 8` | ESCALATE — propose `shadow.fab.radius = 8` |
| Visual | activeIndicator backgroundColor | RN-wrapper | `semantic.color.primary.default` + 20% opacity | `LaneShadowTheme.colors.primary.copy(alpha = 0.2f)` | `theme.colors.primary.opacity(0.2)` | `color.primary.default` |
| Visual | activeIndicator borderRadius | RN-wrapper | `semantic.radius.full` = 9999 | `CircleShape` | `RoundedRectangle(cornerRadius: 9999)` | `radius.full` |
| Typography | tab icon size (active) | RN-wrapper | `24` | `24.dp` | `24` | ESCALATE — propose `size.icon.default = 24` |
| Typography | tab icon size (recording) | RN-wrapper | `36` | `36.dp` | `36` | ESCALATE — propose `size.icon.recording = 36` |
| Typography | tab icon color (active) | RN-wrapper | `semantic.color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |
| Typography | tab icon color (inactive) | RN-wrapper | `semantic.color.onSurface.muted` | `LaneShadowTheme.colors.onSurfaceMuted` | `theme.colors.onSurfaceMuted` | `color.onSurface.muted` |
| Typography | tab label variant (active) | RN-wrapper | `labelMedium` (Paper) | `MaterialTheme.typography.labelMedium` | `.font(.system(.label(.medium)))` | `type.label.md` |
| Typography | tab label variant (inactive) | RN-wrapper | `bodySmall` (Paper) | `MaterialTheme.typography.bodySmall` | `.font(.system(.body(.small)))` | `type.body.sm` |
| Typography | tab label color (active) | RN-wrapper | `semantic.color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |
| Typography | tab label color (inactive) | RN-wrapper | `semantic.color.onSurface.muted` | `LaneShadowTheme.colors.onSurfaceMuted` | `theme.colors.onSurfaceMuted` | `color.onSurface.muted` |
| Interaction | centerButton transform (pressed/recording) | RN-wrapper | `scale: 1.1` | `Modifier.graphicsLayer { scaleX = 1.1f; scaleY = 1.1f }` | `.scaleEffect(1.1)` | n/a |
| Interaction | centerButton opacity (disabled) | RN-wrapper | `0.5` | `Modifier.alpha(0.5f)` | `.opacity(0.5)` | ESCALATE — propose `opacity.disabled = 0.5` |

### ThemeToggleGroup

**Source files read:**
- LaneShadow: `react-native/components/ui/toggle-group.tsx`
- Framework: `node_modules/react-native/Libraries/Components/Pressable/Pressable.js`, `node_modules/react-native/Libraries/Components/View/View.js`

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | container gap | RN-wrapper | `semantic.space.xs` = 4 | `Spacer(Modifier.width(4.dp))` | `Spacer(minLength: 4)` | `space.xs` |
| Layout | flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| Layout | item height (sm) | RN-wrapper | `36` | `Modifier.height(36.dp)` | `.frame(height: 36)` | `space.xl + space.md` (composed) |
| Layout | item height (default) | RN-wrapper | `40` | `Modifier.height(40.dp)` | `.frame(height: 40)` | `space.2xl + space.sm` (composed) |
| Layout | item height (lg) | RN-wrapper | `44` | `Modifier.height(44.dp)` | `.frame(height: 44)` | `space.2xl + space.md` (composed) |
| Layout | item paddingHorizontal | RN-wrapper | `semantic.space.md` = 12 | `Modifier.padding(horizontal = 12.dp)` | `.padding(.horizontal, 12)` | `space.md` |
| Layout | item icon marginRight | RN-wrapper | `semantic.space.sm` = 8 | `Modifier.padding(end = 8.dp)` | `.padding(.trailing, 8)` | `space.sm` |
| Layout | flexDirection (item) | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| Visual | item borderRadius | RN-wrapper | `semantic.radius.md` = 8 | `RoundedCornerShape(8.dp)` | `RoundedRectangle(cornerRadius: 8)` | `radius.md` |
| Visual | backgroundColor (default variant, pressed) | RN-wrapper | `semantic.color.muted.pressed` | `LaneShadowTheme.colors.mutedPressed` | `theme.colors.mutedPressed` | `color.muted.pressed` |
| Visual | backgroundColor (outline variant, pressed) | RN-wrapper | `'transparent'` | `Color.Transparent` | `.clear` | n/a |
| Visual | backgroundColor (isPressed) | RN-wrapper | `semantic.color.accent.default` | `LaneShadowTheme.colors.accent` | `theme.colors.accent` | `color.accent.default` |
| Visual | borderWidth (outline variant) | RN-wrapper | `1` | `Modifier.border(1.dp, ...)` | `.overlay(RoundedRectangle(...).stroke(..., lineWidth: 1))` | ESCALATE — propose `borderWidth.thin = 1` |
| Visual | borderColor (outline variant) | RN-wrapper | `semantic.color.border.default` | `LaneShadowTheme.colors.border` | `theme.colors.border` | `color.border.default` |
| Visual | opacity (disabled) | RN-wrapper | `0.5` | `Modifier.alpha(0.5f)` | `.opacity(0.5)` | ESCALATE — propose `opacity.disabled = 0.5` |
| Typography | textColor (disabled) | RN-wrapper | `semantic.color.onSurface.disabled` | `LaneShadowTheme.colors.onSurfaceDisabled` | `theme.colors.onSurfaceDisabled` | `color.onSurface.disabled` |
| Typography | textColor (isPressed) | RN-wrapper | `semantic.color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |
| Typography | textColor (pressed, !isPressed) | RN-wrapper | `semantic.color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |
| Typography | textColor (idle) | RN-wrapper | `semantic.color.onSurface.muted` | `LaneShadowTheme.colors.onSurfaceMuted` | `theme.colors.onSurfaceMuted` | `color.onSurface.muted` |

### ThemeBanner

**Source files read:**
- LaneShadow: `react-native/components/ui/banner.tsx`
- Framework: `node_modules/react-native-paper/src/components/Banner/Banner.tsx`

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Visual | backgroundColor | RN-wrapper | `semantic.color.warning.default` + 20% opacity | `LaneShadowTheme.colors.warning.copy(alpha = 0.2f)` | `theme.colors.warning.opacity(0.2)` | `color.warning.default` |
| Layout | paddingHorizontal | RN-wrapper | `semantic.space.md` = 12 | `Modifier.padding(horizontal = 12.dp)` | `.padding(.horizontal, 12)` | `space.md` |
| Layout | flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| Layout | alignItems | RN-wrapper | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.alignment(.center)` | n/a |

### ThemeEmptyState

**Source files read:**
- LaneShadow: `react-native/components/ui/empty-state.tsx`
- Framework: `node_modules/react-native/Libraries/Components/View/View.js`, `node_modules/react-native-paper/src/components/Text/Text.tsx`

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | flex | RN-wrapper | `1` | `Modifier.fillMaxSize()` | `.frame(maxWidth: .infinity)` | n/a |
| Layout | alignItems | RN-wrapper | `'center'` | `horizontalAlignment = Alignment.CenterHorizontally` | n/a | n/a |
| Layout | justifyContent | RN-wrapper | `'center'` | `verticalArrangement = Arrangement.Center` | n/a | n/a |
| Layout | icon marginTop | RN-wrapper | `semantic.space.lg` = 16 | `Modifier.padding(top = 16.dp)` | `.padding(.top, 16)` | `space.lg` |
| Layout | body marginTop | RN-wrapper | `semantic.space.sm` = 8 | `Modifier.padding(top = 8.dp)` | `.padding(.top, 8)` | `space.sm` |
| Layout | cta marginTop | RN-wrapper | `semantic.space.xl` = 24 | `Modifier.padding(top = 24.dp)` | `.padding(.top, 24)` | `space.xl` |
| Typography | icon size | RN-wrapper | `64` | `64.dp` | `64` | ESCALATE — propose `size.icon.hero = 64` |
| Typography | icon color | RN-wrapper | `semantic.color.onSurface.muted` | `LaneShadowTheme.colors.onSurfaceMuted` | `theme.colors.onSurfaceMuted` | `color.onSurface.muted` |
| Typography | headline variant | RN-wrapper | `titleMedium` (Paper) | `MaterialTheme.typography.titleMedium` | `.font(.system(.title(.medium)))` | `type.title.md` |
| Typography | headline color | RN-wrapper | `semantic.color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |
| Typography | headline textAlign | RN-wrapper | `'center'` | `textAlign = TextAlign.Center` | `.multilineTextAlignment(.center)` | n/a |
| Typography | body variant | RN-wrapper | `bodyMedium` (Paper) | `MaterialTheme.typography.bodyMedium` | `.font(.system(.body(.medium)))` | `type.body.md` |
| Typography | body color | RN-wrapper | `semantic.color.onSurface.subtle` | `LaneShadowTheme.colors.onSurfaceSubtle` | `theme.colors.onSurfaceSubtle` | `color.onSurface.subtle` |
| Typography | body textAlign | RN-wrapper | `'center'` | `textAlign = TextAlign.Center` | `.multilineTextAlignment(.center)` | n/a |

### KeyboardAvoidingInput

**Source files read:**
- LaneShadow: `react-native/components/ui/keyboard-avoiding-input.tsx`
- Framework: `node_modules/react-native/Libraries/Components/Keyboard/KeyboardAvoidingView.js`

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | width | RN-wrapper | `'100%'` | `Modifier.fillMaxWidth()` | `.frame(maxWidth: .infinity)` | n/a |
| Behavior | behavior (iOS default) | RN-wrapper | `'padding'` | `WindowInsets = WindowInsets(0.dp)` (no Android equivalent) | `.keyboardBehavior(.padding)` | n/a |
| Behavior | behavior (Android) | RN-wrapper | `undefined` | n/a | n/a | n/a |
| Behavior | keyboardVerticalOffset | RN-wrapper | `offset` prop | `Modifier.offset(y = offset.dp)` | `.keyboardOffset(offset)` | n/a |
| Layout | paddingBottom (safe area) | RN-wrapper | `insets.bottom` | `WindowInsets.systemBars.addBottom(insets.bottom)` | `.padding(.bottom, insets.bottom)` | n/a |

### MarkdownText

**Source files read:**
- LaneShadow: `react-native/components/ui/markdown-text.tsx`
- Framework: `node_modules/react-native-markdown-display` (Markdown component)

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Typography | body | RN-wrapper | `semantic.type.body.lg` | `MaterialTheme.typography.bodyLarge` | `.font(.system(.body(.large)))` | `type.body.lg` |
| Typography | body color | RN-wrapper | `semantic.color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |
| Typography | heading1 | RN-wrapper | `semantic.type.heading.lg` | `MaterialTheme.typography.headingLarge` | `.font(.system(.heading(.large)))` | `type.heading.lg` |
| Typography | heading1 marginTop | RN-wrapper | `semantic.space.md` = 12 | `Modifier.padding(top = 12.dp)` | `.padding(.top, 12)` | `space.md` |
| Typography | heading1 marginBottom | RN-wrapper | `semantic.space.sm` = 8 | `Modifier.padding(bottom = 8.dp)` | `.padding(.bottom, 8)` | `space.sm` |
| Typography | heading2 | RN-wrapper | `semantic.type.heading.md` | `MaterialTheme.typography.headingMedium` | `.font(.system(.heading(.medium)))` | `type.heading.md` |
| Typography | heading2 marginTop | RN-wrapper | `semantic.space.md` = 12 | `Modifier.padding(top = 12.dp)` | `.padding(.top, 12)` | `space.md` |
| Typography | heading2 marginBottom | RN-wrapper | `semantic.space.sm` = 8 | `Modifier.padding(bottom = 8.dp)` | `.padding(.bottom, 8)` | `space.sm` |
| Typography | heading3 | RN-wrapper | `semantic.type.heading.sm` | `MaterialTheme.typography.headingSmall` | `.font(.system(.heading(.small)))` | `type.heading.sm` |
| Typography | heading3 marginTop | RN-wrapper | `semantic.space.sm` = 8 | `Modifier.padding(top = 8.dp)` | `.padding(.top, 8)` | `space.sm` |
| Typography | heading3 marginBottom | RN-wrapper | `semantic.space.xs` = 4 | `Modifier.padding(bottom = 4.dp)` | `.padding(.bottom, 4)` | `space.xs` |
| Typography | strong fontWeight | RN-wrapper | `'700'` | `FontWeight.Bold` | `.bold` | ESCALATE — propose `fontWeight.bold = 700` |
| Typography | code_inline backgroundColor | RN-wrapper | `semantic.color.surfaceVariant.default` | `LaneShadowTheme.colors.surfaceVariant` | `theme.colors.surfaceVariant` | `color.surfaceVariant.default` |
| Typography | code_inline color | RN-wrapper | `semantic.color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |
| Typography | code_inline style | RN-wrapper | `semantic.type.body.sm` | `MaterialTheme.typography.bodySmall` | `.font(.system(.body(.small)))` | `type.body.sm` |
| Typography | code_inline paddingHorizontal | RN-wrapper | `semantic.space.xs` = 4 | `Modifier.padding(horizontal = 4.dp)` | `.padding(.horizontal, 4)` | `space.xs` |
| Typography | code_inline paddingVertical | RN-wrapper | `2` | `Modifier.padding(vertical = 2.dp)` | `.padding(.vertical, 2)` | ESCALATE — propose `space.codeInlinePadding = 2` |
| Typography | code_inline borderRadius | RN-wrapper | `semantic.radius.sm` = 4 | `RoundedCornerShape(4.dp)` | `RoundedRectangle(cornerRadius: 4)` | `radius.sm` |
| Typography | code_block backgroundColor | RN-wrapper | `semantic.color.surfaceVariant.default` | `LaneShadowTheme.colors.surfaceVariant` | `theme.colors.surfaceVariant` | `color.surfaceVariant.default` |
| Typography | code_block style | RN-wrapper | `semantic.type.body.sm` | `MaterialTheme.typography.bodySmall` | `.font(.system(.body(.small)))` | `type.body.sm` |
| Typography | code_block padding | RN-wrapper | `semantic.space.md` = 12 | `Modifier.padding(12.dp)` | `.padding(12)` | `space.md` |
| Typography | code_block borderRadius | RN-wrapper | `semantic.radius.md` = 8 | `RoundedCornerShape(8.dp)` | `RoundedRectangle(cornerRadius: 8)` | `radius.md` |
| Typography | code_block fontFamily (iOS) | RN-wrapper | `'Menlo'` | `FontFamily.Monospace` | `.monospaced()` | n/a |
| Typography | blockquote backgroundColor | RN-wrapper | `semantic.color.surfaceVariant.default` + 20% opacity | `LaneShadowTheme.colors.surfaceVariant.copy(alpha = 0.2f)` | `theme.colors.surfaceVariant.opacity(0.2)` | `color.surfaceVariant.default` |
| Typography | blockquote borderLeftWidth | RN-wrapper | `4` | `Modifier.padding(start = 4.dp)` (simulated) | `.overlay(Rectangle().fill(...).frame(width: 4))` | ESCALATE — propose `borderWidth.thick = 4` |
| Typography | blockquote borderLeftColor | RN-wrapper | `semantic.color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |
| Typography | blockquote paddingLeft | RN-wrapper | `semantic.space.md` = 12 | `Modifier.padding(start = 12.dp)` | `.padding(.leading, 12)` | `space.md` |
| Typography | blockquote paddingVertical | RN-wrapper | `semantic.space.xs` = 4 | `Modifier.padding(vertical = 4.dp)` | `.padding(.vertical, 4)` | `space.xs` |
| Typography | link color | RN-wrapper | `semantic.color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |
| Typography | link textDecorationLine | RN-wrapper | `'underline'` | `TextDecoration.Underline` | `.underline()` | n/a |
| Typography | table borderWidth | RN-wrapper | `1` | `Modifier.border(1.dp, ...)` | `.overlay(RoundedRectangle(...).stroke(..., lineWidth: 1))` | ESCALATE — propose `borderWidth.thin = 1` |
| Typography | table borderColor | RN-wrapper | `semantic.color.border.default` | `LaneShadowTheme.colors.border` | `theme.colors.border` | `color.border.default` |
| Typography | table borderRadius | RN-wrapper | `semantic.radius.md` = 8 | `RoundedCornerShape(8.dp)` | `RoundedRectangle(cornerRadius: 8)` | `radius.md` |
| Typography | th backgroundColor | RN-wrapper | `semantic.color.surfaceVariant.default` | `LaneShadowTheme.colors.surfaceVariant` | `theme.colors.surfaceVariant` | `color.surfaceVariant.default` |
| Typography | th fontWeight | RN-wrapper | `'700'` | `FontWeight.Bold` | `.bold` | ESCALATE — propose `fontWeight.bold = 700` |
| Typography | th padding | RN-wrapper | `semantic.space.sm` = 8 | `Modifier.padding(8.dp)` | `.padding(8)` | `space.sm` |

### ThemePicker

**Source files read:**
- LaneShadow: `react-native/components/settings/theme-picker.tsx`
- Framework: `node_modules/react-native/Libraries/Components/View/View.js`, `node_modules/react-native/Libraries/Components/Pressable/Pressable.js`, `node_modules/react-native-paper/src/components/Text/Text.tsx`

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | container gap | RN-wrapper | `semantic.space.md` = 12 | `Spacer(Modifier.height(12.dp))` | `Spacer(minLength: 12)` | `space.md` |
| Layout | grid gap | RN-wrapper | `semantic.space.md` = 12 | `Spacer(Modifier.width(12.dp))` | `Spacer(minLength: 12)` | `space.md` |
| Layout | card padding | RN-wrapper | `semantic.space.md` = 12 | `Modifier.padding(12.dp)` | `.padding(12)` | `space.md` |
| Layout | card borderRadius | RN-wrapper | `semantic.radius.lg` = 16 | `RoundedCornerShape(16.dp)` | `RoundedRectangle(cornerRadius: 16)` | `radius.lg` |
| Layout | previewWrap marginBottom | RN-wrapper | `semantic.space.sm` = 8 | `Modifier.padding(bottom = 8.dp)` | `.padding(.bottom, 8)` | `space.sm` |
| Layout | labelRow marginLeft | RN-wrapper | `semantic.space.xs` = 4 | `Modifier.padding(start = 4.dp)` | `.padding(.leading, 4)` | `space.xs` |
| Layout | checkBadge position | RN-wrapper | `top: semantic.space.xs, right: semantic.space.xs` = 4 | `Modifier.offset(x = 4.dp, y = 4.dp).align(Alignment.TopEnd)` | `.offset(x: 4, y: 4)` | `space.xs` |
| Layout | checkBadge size | RN-wrapper | `18 × 18` | `Modifier.size(18.dp)` | `.frame(width: 18, height: 18)` | ESCALATE — propose `size.checkBadge = 18` |
| Layout | checkBadge borderRadius | RN-wrapper | `9` | `CircleShape` | `Circle()` | `checkBadge.size / 2` |
| Visual | card backgroundColor | RN-wrapper | `semantic.color.surface.default` | `LaneShadowTheme.colors.surface` | `theme.colors.surface` | `color.surface.default` |
| Visual | card borderWidth | RN-wrapper | `2` | `Modifier.border(2.dp, ...)` | `.overlay(RoundedRectangle(...).stroke(..., lineWidth: 2))` | ESCALATE — propose `borderWidth.card = 2` |
| Visual | card borderColor (selected) | RN-wrapper | `semantic.color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |
| Visual | card borderColor (unselected) | RN-wrapper | `semantic.color.border.default` | `LaneShadowTheme.colors.border` | `theme.colors.border` | `color.border.default` |
| Visual | checkBadge backgroundColor | RN-wrapper | `semantic.color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |
| Visual | card opacity (pressed) | RN-wrapper | `0.85` | `Modifier.alpha(0.85f)` | `.opacity(0.85)` | ESCALATE — propose `opacity.pressed = 0.85` |
| Visual | card shadowColor (selected) | RN-wrapper | `#B87333` (hardcoded copper) | `shadowColor = Color(0xFFB87333)` | `.shadow(color: Color(0xB87333))` | n/a (hardcoded preview) |
| Visual | card shadowOffset (selected) | RN-wrapper | `width: 0, height: 0` | `offset(0.dp, 0.dp)` | `x: 0, y: 0` | n/a |
| Visual | card shadowOpacity (selected) | RN-wrapper | `0.35` | `alpha = 0.35f` | `.opacity(0.35)` | n/a (hardcoded preview) |
| Visual | card shadowRadius (selected) | RN-wrapper | `8` | `blurRadius = 8.dp` | `radius: 8` | n/a (hardcoded preview) |
| Visual | card elevation (selected) | RN-wrapper | `4` | `elevation = 4.dp` | n/a | n/a (hardcoded preview) |
| Typography | label variant | RN-wrapper | `labelLarge` (Paper) | `MaterialTheme.typography.labelLarge` | `.font(.system(.label(.large)))` | `type.label.lg` |
| Typography | label color | RN-wrapper | `semantic.color.onSurface.muted` | `LaneShadowTheme.colors.onSurfaceMuted` | `theme.colors.onSurfaceMuted` | `color.onSurface.muted` |
| Typography | label textTransform | RN-wrapper | `'uppercase'` | `textAlign = TextAlign.Center` (Compose has no textTransform) | `.textCase(.uppercase)` | n/a |
| Typography | label letterSpacing | RN-wrapper | `1` | `letterSpacing = 1.sp` | `.tracking(1)` | ESCALATE — propose `letterSpacing.label = 1` |
| Typography | cardLabel variant | RN-wrapper | `labelMedium` (Paper) | `MaterialTheme.typography.labelMedium` | `.font(.system(.label(.medium)))` | `type.label.md` |
| Typography | cardLabel color (selected) | RN-wrapper | `semantic.color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |
| Typography | cardLabel color (unselected) | RN-wrapper | `semantic.color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |
| Typography | cardLabel fontWeight (selected) | RN-wrapper | `'700'` | `FontWeight.Bold` | `.bold` | ESCALATE — propose `fontWeight.bold = 700` |
| Typography | cardLabel fontWeight (unselected) | RN-wrapper | `'500'` | `FontWeight.Medium` | `.medium` | `type.label.md.fontWeight` (=500) ✓ |
| Typography | icon size | RN-wrapper | `16` | `16.dp` | `16` | ESCALATE — propose `size.icon.small = 16` |
| Typography | icon color (selected) | RN-wrapper | `semantic.color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |
| Typography | icon color (unselected) | RN-wrapper | `semantic.color.onSurface.muted` | `LaneShadowTheme.colors.onSurfaceMuted` | `theme.colors.onSurfaceMuted` | `color.onSurface.muted` |
| Typography | checkIcon color | RN-wrapper | `#FFFFFF` (hardcoded white) | `Color.White` | `.white` | n/a (hardcoded) |
| Typography | checkIcon size | RN-wrapper | `10` | `10.dp` | `10` | ESCALATE — propose `size.icon.tiny = 10` |
| Layout | phone preview width | RN-wrapper | `62` | `62.dp` | `62` | n/a (hardcoded preview) |
| Layout | phone preview height | RN-wrapper | `96` | `96.dp` | `96` | n/a (hardcoded preview) |
| Layout | phone preview borderRadius | RN-wrapper | `10` | `RoundedCornerShape(10.dp)` | `RoundedRectangle(cornerRadius: 10)` | n/a (hardcoded preview) |

## DESIGN NOTES

- Preserve RN spacing, composition hierarchy, and edge-case fixtures such as long labels, loading, and error states.
- Define detents, handles, scrim, keyboard avoidance, and safe-area behavior explicitly.
- Avoid default SwiftUI list, form, or navigation styling unless it is fully token-overridden and parity-approved.

## VERIFICATION GATES

- pnpm type-check:native
- swiftformat --lint ios/LaneShadow --config .swiftformat
- xcodebuild -workspace ios/LaneShadow.xcworkspace -scheme LaneShadow -destination "platform=iOS Simulator,name=iPhone 16" test
- Validate sandbox scenarios for this task in the native sandbox host

## DEPENDENCIES

- UI-014

## CODING STANDARDS

- .spec/prds/native-rewrite/08d-component-parity-spec.md — naming, interface, token, state, animation, accessibility, keyboard, and RTL parity
- .spec/prds/native-rewrite/08-design-system.md — token generation and consumption rules
- ~/Projects/brain/docs/TDD-METHODOLOGY.md — RED/GREEN/REFACTOR evidence expectations

## OUT OF SCOPE

- Feature wiring beyond sandbox-ready component translation.
- Changes to unrelated sprints or backend and server code.

---

## Native Sandbox Integration (added 2026-04-18)

`native-sandbox` is installed as a local SPM package (`NativeSandbox` product at `relativePath = ../../native-sandbox/ios`, linked into the LaneShadow target).

### Sandbox Deliverables (in addition to the component sources above)

- `ios/LaneShadow/Sandbox/Stories/<ComponentGroup>Stories.swift` — `@MainActor enum <Group>Stories { static let all: [Story] }` aggregated into `LaneShadowStories.all` at `ios/LaneShadow/Sandbox/LaneShadowStories.swift`.

### Sandbox Acceptance Criterion

**GIVEN** the NativeSandbox SPM package is linked and a DEBUG build is running.
**WHEN** the reviewer runs `make ios_sandbox` (or shakes the device / passes `-LaneShadowSandbox` arg).
**THEN** every component named in DELIVERABLES has at least one registered `Story(id: "<tier>.<component>.<state>", tier: .<tier>, component: "<Name>", name: "<State>", summary: "<rn-reference-path>") { _ in <SwiftUI usage> }` appearing in the sandbox story-tree drawer, wrapped by `previewWrapper: themedPreview { $0.laneShadowTheme() }` so the preview canvas inherits LaneShadow tokens while chrome stays neutral.

### Reviewer Launch

- **Primary:** `make ios_sandbox` (from repo root) — builds Debug, installs to simulator, launches with `-LaneShadowSandbox` arg.
- **Secondary:** device shake (simulator: `xcrun simctl io booted shake`), or `xcrun simctl launch <sim-id> com.laneshadow.app -LaneShadowSandbox`, or deep link `laneshadow-sandbox://sandbox`.

### Contract references

- `NativeSandbox.Story` — `id`, `tier` (`.atom|.molecule|.organism|.template|.screen`), `component`, `name`, `summary`, `content` view builder (`{ _ in ... }`).
- `NativeSandbox.SandboxRoot` — entry view; receives `stories`, optional `themeController`, `previewWrapper`.
- Swift 6 strict concurrency: Story containers MUST be `@MainActor` because `Story` is not Sendable.
- Chrome is theme-neutral by design; only the preview canvas is re-themed via `previewWrapper`.
