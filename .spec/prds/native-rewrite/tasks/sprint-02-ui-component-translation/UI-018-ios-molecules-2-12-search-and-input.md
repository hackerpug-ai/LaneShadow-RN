# UI-018: iOS molecules 2/12 — search & input: `SearchBar`, `ThemeFloatingSearchInput`, `ThemeCaptionInput`, `ThemeLocationInput`, `ThemeOverlayPill`, `ThemeWhereToBar`

**Task ID:** UI-018
**Sprint:** Sprint 2 - UI Component Translation and Fidelity Sandbox
**Assigned To:** swift-implementer
**Reviewer:** swift-reviewer
**Estimate:** 240 min
**Type:** [FEATURE]
**Status:** Planned
**Phase:** Molecules
**Quality Score:** 115/115

---

## BACKGROUND

Sprint 2 translates the React Native baseline into native platform components and sandbox scenarios before rider-facing feature sprints resume. This task covers the `molecules` slice for `iOS molecules 2/12 — search & input: SearchBar, ThemeFloatingSearchInput, ThemeCaptionInput, ThemeLocationInput, ThemeOverlayPill, ThemeWhereToBar`.

**Objective:** Implement iOS molecules 2/12 — search & input: `SearchBar`, `ThemeFloatingSearchInput`, `ThemeCaptionInput`, `ThemeLocationInput`, `ThemeOverlayPill`, `ThemeWhereToBar` as SwiftUI work with parity to the RN baseline, token-only styling, and sandbox coverage.

**Success State:** A reviewer can open the iOS sandbox, browse this task's scenarios, and confirm naming, interface, theme, state, accessibility, and layout parity against RN.

## CRITICAL CONSTRAINTS

### MUST
- Implement the listed components or compositions with parity-aligned naming and interfaces: `SearchBar`, `ThemeFloatingSearchInput`, `ThemeCaptionInput`, `ThemeLocationInput`, `ThemeOverlayPill`, `ThemeWhereToBar`.
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
**THEN** The listed components or compositions exist in the correct iOS SwiftUI directories with parity-aligned names and signatures: `SearchBar`, `ThemeFloatingSearchInput`, `ThemeCaptionInput`, `ThemeLocationInput`, `ThemeOverlayPill`, `ThemeWhereToBar`.
**Verify:** `printf "%s\n" "`SearchBar`, `ThemeFloatingSearchInput`, `ThemeCaptionInput`, `ThemeLocationInput`, `ThemeOverlayPill`, `ThemeWhereToBar`"`

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
| TC-1 | AC-1 | The listed components or compositions exist in the correct iOS SwiftUI directories with parity-aligned names and signatures: `SearchBar`, `ThemeFloatingSearchInput`, `ThemeCaptionInput`, `ThemeLocationInput`, `ThemeOverlayPill`, `ThemeWhereToBar`. | `printf "%s\n" "`SearchBar`, `ThemeFloatingSearchInput`, `ThemeCaptionInput`, `ThemeLocationInput`, `ThemeOverlayPill`, `ThemeWhereToBar`"` |
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
| SearchBar | `react-native/components/ui/search-bar.tsx` | `node_modules/react-native/Libraries/Components/View/View.js`; `node_modules/react-native-paper/src/components/Text/Text.tsx` | `ios/LaneShadow/Views/Molecules/SearchBar.swift` | 1 fixed layout × 2 states (idle/pressed) |
| ThemeFloatingSearchInput | `react-native/components/ui/floating-search-input.tsx` | `node_modules/react-native/Libraries/Components/Pressable/Pressable.js`; `node_modules/react-native-paper/src/components/ActivityIndicator/ActivityIndicator.tsx`; `node_modules/react-native-paper/src/components/Icon/Icon.tsx` | `ios/LaneShadow/Views/Molecules/ThemeFloatingSearchInput.swift` | 1 layout × 3 states (default/loading/withClear) |
| ThemeCaptionInput | `react-native/components/ui/caption-input.tsx` | `node_modules/react-native/Libraries/Components/TextInput/TextInput.js`; `node_modules/react-native/Libraries/Components/Pressable/Pressable.js` | `ios/LaneShadow/Views/Molecules/ThemeCaptionInput.swift` | 1 fixed layout × 3 action buttons × 2 states (idle/pressed on send) |
| ThemeLocationInput | `react-native/components/location-input.tsx` | `node_modules/react-native/Libraries/Components/View/View.js`; `node_modules/react-native-paper/src/components/Text/Text.tsx`; uses `Input` from `react-native/components/ui/input.tsx` | `ios/LaneShadow/Views/Molecules/ThemeLocationInput.swift` | 1 layout × 2 types (current/destination) × 4 states (idle/focused/error/disabled) × 3 skeleton items |
| ThemeOverlayPill | `react-native/components/ui/overlay-pill.tsx` | `node_modules/react-native/Libraries/Components/View/View.js`; `node_modules/react-native-paper/src/components/Text/Text.tsx` | `ios/LaneShadow/Views/Molecules/ThemeOverlayPill.swift` | 1 fixed layout × 2 states (active/inactive) |
| ThemeWhereToBar | `react-native/components/map/where-to-bar.tsx` | `node_modules/react-native/Libraries/Components/View/View.js`; uses `FloatingSearchInput` | `ios/LaneShadow/Views/Molecules/ThemeWhereToBar.swift` | 1 fixed layout × 2 states (default/withSuggestions) × 3 skeleton items |

## STYLE PROPERTIES MATRIX

> Exhaustive enumeration of every style property from both sources per `08f-translation-protocol.md`. Columns: Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping. `ESCALATE` = no token covers the value — add a proposed token to DECISIONS.md before implementing.
>
> **Token reference** (from `tokens/semantic/semantic.tokens.json`): space xs=4 sm=8 md=12 lg=16 xl=24 2xl=32 3xl=48 4xl=64; radius none=0 sm=4 md=8 lg=16 xl=24 2xl=32 full=9999; elevation[2] shadowOffset=0/2 shadowOpacity=0.05 shadowRadius=4 androidElevation=2.

### SearchBar

**Source files read:**
- LaneShadow: `react-native/components/ui/search-bar.tsx`
- Framework: `node_modules/react-native/Libraries/Components/View/View.js`, `node_modules/react-native-paper/src/components/Text/Text.tsx`

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| Layout | alignItems | RN-wrapper | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.alignment(.center)` | n/a |
| Layout | gap | RN-wrapper | `12` | `Spacer(Modifier.width(12.dp))` | `Spacer(minLength: 12)` | ESCALATE — propose `space.searchBarGap = 12` |
| Layout | borderRadius | RN-wrapper | `12` | `RoundedCornerShape(12.dp)` | `RoundedRectangle(cornerRadius: 12)` | ESCALATE — propose `radius.searchBar = 12` |
| Layout | paddingVertical | RN-wrapper | `12` | `Modifier.padding(vertical = 12.dp)` | `.padding(.vertical, 12)` | ESCALATE — propose `space.searchBarPadding = 12` |
| Layout | paddingHorizontal | RN-wrapper | `16` | `Modifier.padding(horizontal = 16.dp)` | `.padding(.horizontal, 16)` | `space.lg` ✓ |
| Visual | backgroundColor | RN-wrapper | `semantic.color.card.default` | `LaneShadowTheme.colors.card` | `theme.colors.card` | `color.card.default` |
| Typography | icon size | RN-wrapper | `20` | `20.dp` | `20` | ESCALATE — propose `size.icon.search = 20` |
| Typography | icon color | RN-wrapper | `semantic.color.onSurface.subtle` | `LaneShadowTheme.colors.onSurfaceSubtle` | `theme.colors.onSurfaceSubtle` | `color.onSurface.subtle` |
| Typography | placeholder fontSize | RN-wrapper | `15` | `15.sp` | `.font(.system(size: 15))` | ESCALATE — propose `type.searchBar.fontSize = 15` |
| Typography | placeholder color | RN-wrapper | `semantic.color.onSurface.subtle` | `LaneShadowTheme.colors.onSurfaceSubtle` | `theme.colors.onSurfaceSubtle` | `color.onSurface.subtle` |
| Layout | flex | RN-wrapper | `1` (placeholder) | `Modifier.weight(1f)` | `.frame(maxWidth: .infinity)` | n/a |

### ThemeFloatingSearchInput

**Source files read:**
- LaneShadow: `react-native/components/ui/floating-search-input.tsx`
- Framework: `node_modules/react-native/Libraries/Components/Pressable/Pressable.js`, `node_modules/react-native-paper/src/components/ActivityIndicator/ActivityIndicator.tsx`, `node_modules/react-native-paper/src/components/Icon/Icon.tsx`, uses `Input` from `react-native/components/ui/input.tsx`

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| Layout | alignItems | RN-wrapper | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.alignment(.center)` | n/a |
| Layout | flex | RN-wrapper | `1` | `Modifier.fillMaxWidth()` | `.frame(maxWidth: .infinity)` | n/a |
| Layout | minWidth | RN-wrapper | `0` | `Modifier.requiredWidth(IntrinsicSize.Min)` | `.frame(minWidth: 0)` | n/a |
| Layout | flexShrink | RN-wrapper | `1` | `Modifier.weight(1f)` | n/a | n/a |
| Layout | position | RN-wrapper | `'relative'` | n/a (Compose uses Box) | `.position(...)` | n/a |
| Layout | borderWidth | RN-wrapper | `1` | `Modifier.border(1.dp, ...)` | `.overlay(RoundedRectangle(...).stroke(..., lineWidth: 1))` | ESCALATE — propose `borderWidth.thin = 1` |
| Layout | borderRadius | RN-wrapper | `semantic.radius.xl` = 24 | `RoundedCornerShape(24.dp)` | `RoundedRectangle(cornerRadius: 24)` | `radius.xl` |
| Layout | paddingHorizontal | RN-wrapper | `semantic.space.md` = 12 | `Modifier.padding(horizontal = 12.dp)` | `.padding(.horizontal, 12)` | `space.md` |
| Layout | paddingVertical | RN-wrapper | `semantic.space.xs` = 4 | `Modifier.padding(vertical = 4.dp)` | `.padding(.vertical, 4)` | `space.xs` |
| Layout | leftIcon marginRight | RN-wrapper | `semantic.space.sm` = 8 | `Modifier.padding(end = 8.dp)` | `.padding(.trailing, 8)` | `space.sm` |
| Layout | input paddingRight (loading) | RN-wrapper | `semantic.space['4xl']` = 64 | `Modifier.padding(end = 64.dp)` | `.padding(.trailing, 64)` | `space.4xl` |
| Layout | input paddingRight (default) | RN-wrapper | `semantic.space['2xl']` = 32 | `Modifier.padding(end = 32.dp)` | `.padding(.trailing, 32)` | `space.2xl` |
| Layout | clearButton right | RN-wrapper | `semantic.space.sm` = 8 | `Modifier.offset(x = 8.dp).align(Alignment.CenterEnd)` | `.offset(x: 8)` | `space.sm` |
| Layout | clearButton paddingHorizontal | RN-wrapper | `semantic.space.xs` = 4 | `Modifier.padding(horizontal = 4.dp)` | `.padding(.horizontal, 4)` | `space.xs` |
| Layout | clearButton paddingVertical | RN-wrapper | `semantic.space.xs` = 4 | `Modifier.padding(vertical = 4.dp)` | `.padding(.vertical, 4)` | `space.xs` |
| Layout | clearButton position | RN-wrapper | `'absolute'` | `Modifier.align(Alignment.CenterEnd)` | `.position(.absolute)` | n/a |
| Layout | hitSlop | RN-wrapper | `top/bottom/left/right: semantic.space.xs` = 4 | `Modifier.clickable(onClick = null, interactionSource = remember { MutableInteractionSource() }).indication = null. then padding` | `.contentShape(Rectangle()).hitSlop(...)` | `space.xs` |
| Visual | backgroundColor | RN-wrapper | `semantic.color.surfaceVariant.default` | `LaneShadowTheme.colors.surfaceVariant` | `theme.colors.surfaceVariant` | `color.surfaceVariant.default` |
| Visual | borderColor | RN-wrapper | `semantic.color.border.default` | `LaneShadowTheme.colors.border` | `theme.colors.border` | `color.border.default` |
| Visual | leftIcon size | RN-wrapper | `semantic.space.xl` = 24 | `24.dp` | `24` | `space.xl` |
| Visual | leftIcon color | RN-wrapper | `semantic.color.onSurface.subtle` | `LaneShadowTheme.colors.onSurfaceSubtle` | `theme.colors.onSurfaceSubtle` | `color.onSurface.subtle` |
| Visual | clearButton opacity (pressed) | RN-wrapper | `0.8` | `Modifier.alpha(0.8f)` | `.opacity(0.8)` | ESCALATE — propose `opacity.pressed = 0.8` |
| Visual | loadingIndicator size | RN-wrapper | `semantic.space.md` = 12 | `12.dp` | `12` | `space.md` |
| Visual | loadingIndicator color | RN-wrapper | `semantic.color.onSurface.subtle` | `LaneShadowTheme.colors.onSurfaceSubtle` | `theme.colors.onSurfaceSubtle` | `color.onSurface.subtle` |
| Visual | clearIcon size | RN-wrapper | `18` | `18.dp` | `18` | ESCALATE — propose `size.icon.clear = 18` |
| Visual | clearIcon color | RN-wrapper | `semantic.color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |
| Visual | input backgroundColor | RN-wrapper | `'transparent'` | `Color.Transparent` | `.clear` | n/a |
| Visual | input borderWidth | RN-wrapper | `0` | no border | no border | n/a |
| Visual | input paddingHorizontal | RN-wrapper | `0` | `Modifier.padding(horizontal = 0.dp)` | `.padding(.horizontal, 0)` | n/a |
| Visual | input paddingRight | RN-wrapper | dynamic (see above) | `Modifier.padding(end = ...)` | `.padding(.trailing, ...)` | `space.4xl` or `space.2xl` |
| Visual | input maxWidth | RN-wrapper | `'100%'` | `Modifier.fillMaxWidth()` | `.frame(maxWidth: .infinity)` | n/a |
| Interaction | pointerEvents (input, pressableOnly) | RN-wrapper | `'none'` | `Modifier.pointerEventKind(PointerEventKind.Pass)` | `.allowsHitTesting(false)` | n/a |
| Interaction | accessibilityRole (pressable) | RN-wrapper | `'button'` | `Modifier.semantics { role = Role.Button }` | `.accessibilityAddTraits(.isButton)` | n/a |

### ThemeCaptionInput

**Source files read:**
- LaneShadow: `react-native/components/ui/caption-input.tsx`
- Framework: `node_modules/react-native/Libraries/Components/TextInput/TextInput.js`, `node_modules/react-native/Libraries/Components/Pressable/Pressable.js`

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | position | RN-wrapper | `'relative'` | n/a (Compose uses Box) | `.zIndex(...)` | n/a |
| Layout | flexDirection | RN-wrapper | `'row'` (actionButtons) | `Row(...)` | `HStack` | n/a |
| Layout | alignItems | RN-wrapper | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.alignment(.center)` | n/a |
| Layout | gap | RN-wrapper | `semantic.space.xs` = 4 | `Spacer(Modifier.width(4.dp))` | `Spacer(minLength: 4)` | `space.xs` |
| Layout | borderRadius | RN-wrapper | `semantic.radius.xl` = 24 | `RoundedCornerShape(24.dp)` | `RoundedRectangle(cornerRadius: 24)` | `radius.xl` |
| Layout | padding | RN-wrapper | `semantic.space.md` = 12 | `Modifier.padding(12.dp)` | `.padding(12)` | `space.md` |
| Layout | input minHeight | RN-wrapper | `80` | `Modifier.heightIn(min = 80.dp)` | `.frame(minHeight: 80)` | ESCALATE — propose `size.captionInputMinHeight = 80` |
| Layout | input maxHeight | RN-wrapper | `120` | `Modifier.heightIn(max = 120.dp)` | `.frame(maxHeight: 120)` | ESCALATE — propose `size.captionInputMaxHeight = 120` |
| Layout | input paddingRight | RN-wrapper | `120` | `Modifier.padding(end = 120.dp)` | `.padding(.trailing, 120)` | ESCALATE — propose `size.captionInputActionsWidth = 120` |
| Layout | input textAlignVertical | RN-wrapper | `'top'` | `textAlign = TextAlign.Top` | `.multilineTextAlignment(.leading).frame(alignment: .topLeading)` | n/a |
| Layout | actionButtons position | RN-wrapper | `'absolute'` | `Modifier.align(Alignment.BottomEnd)` | `.position(.absolute)` | n/a |
| Layout | actionButtons right | RN-wrapper | `8` | `Modifier.offset(x = 8.dp).align(Alignment.CenterEnd)` | `.offset(x: 8)` | `space.sm` ✓ |
| Layout | actionButtons bottom | RN-wrapper | `8` | `Modifier.offset(y = 8.dp).align(Alignment.BottomEnd)` | `.offset(y: 8)` | `space.sm` ✓ |
| Layout | actionButton size | RN-wrapper | `36 × 36` | `Modifier.size(36.dp)` | `.frame(width: 36, height: 36)` | ESCALATE — propose `size.captionActionButton = 36` |
| Layout | actionButton padding | RN-wrapper | `semantic.space.sm` = 8 | `Modifier.padding(8.dp)` | `.padding(8)` | `space.sm` |
| Layout | actionButton borderRadius | RN-wrapper | `semantic.radius.full` = 9999 | `CircleShape` | `Circle()` | `radius.full` |
| Visual | backgroundColor | RN-wrapper | `semantic.color.surface.default` | `LaneShadowTheme.colors.surface` | `theme.colors.surface` | `color.surface.default` |
| Visual | actionButton backgroundColor (default) | RN-wrapper | `semantic.color.surface.default` | `LaneShadowTheme.colors.surface` | `theme.colors.surface` | `color.surface.default` |
| Visual | actionButton backgroundColor (pressed) | RN-wrapper | `semantic.color.surface.pressed` | `LaneShadowTheme.colors.surfacePressed` | `theme.colors.surfacePressed` | `color.surface.pressed` |
| Visual | actionButton backgroundColor (send) | RN-wrapper | `semantic.color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |
| Visual | actionButton backgroundColor (send, pressed) | RN-wrapper | `semantic.color.primary.pressed` | `LaneShadowTheme.colors.primaryPressed` | `theme.colors.primaryPressed` | `color.primary.pressed` |
| Visual | actionButton opacity (disabled) | RN-wrapper | `0.4` | `Modifier.alpha(0.4f)` | `.opacity(0.4)` | ESCALATE — propose `opacity.disabledStrong = 0.4` |
| Typography | input style | RN-wrapper | `semantic.type.body.md` | `MaterialTheme.typography.bodyMedium` | `.font(.system(.body(.medium)))` | `type.body.md` |
| Typography | input color | RN-wrapper | `semantic.color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |
| Typography | placeholder color | RN-wrapper | `semantic.color.onSurface.subtle` | `LaneShadowTheme.colors.onSurfaceSubtle` | `theme.colors.onSurfaceSubtle` | `color.onSurface.subtle` |
| Typography | actionIcon size | RN-wrapper | `20` | `20.dp` | `20` | ESCALATE — propose `size.icon.action = 20` |
| Typography | actionIcon color (disabled) | RN-wrapper | `semantic.color.onSurface.muted` | `LaneShadowTheme.colors.onSurfaceMuted` | `theme.colors.onSurfaceMuted` | `color.onSurface.muted` |
| Typography | actionIcon color (send) | RN-wrapper | `semantic.color.onPrimary.default` | `LaneShadowTheme.colors.onPrimary` | `theme.colors.onPrimary` | `color.onPrimary.default` |

### ThemeLocationInput

**Source files read:**
- LaneShadow: `react-native/components/location-input.tsx`
- Framework: `node_modules/react-native/Libraries/Components/View/View.js`, `node_modules/react-native-paper/src/components/Text/Text.tsx`, uses `Input` from `react-native/components/ui/input.tsx`

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | width | RN-wrapper | `'100%'` | `Modifier.fillMaxWidth()` | `.frame(maxWidth: .infinity)` | n/a |
| Layout | flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| Layout | alignItems | RN-wrapper | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.alignment(.center)` | n/a |
| Layout | suggestions marginTop | RN-wrapper | `-1` | `Modifier.offset(y = (-1).dp)` | `.offset(y: -1)` | n/a (visual flush) |
| Layout | suggestions borderWidth | RN-wrapper | `1` (left/right/bottom) | `Modifier.border(start = 1.dp, end = 1.dp, bottom = 1.dp)` | `.overlay(RoundedRectangle(...).strokeBorder(..., lineWidth: 1))` | ESCALATE — propose `borderWidth.thin = 1` |
| Layout | suggestions borderBottomLeftRadius | RN-wrapper | `semantic.radius.lg` = 16 | `RoundedCornerShape(16.dp, 16.dp, 0.dp, 0.dp)` (top-left, top-right, bottom-right, bottom-left) | `.clipShape(RoundedRectangle(cornerRadii: .init(topLeading: 16)))` | `radius.lg` |
| Layout | suggestions borderBottomRightRadius | RN-wrapper | `semantic.radius.lg` = 16 | `RoundedCornerShape(16.dp, 16.dp, 0.dp, 0.dp)` | `.clipShape(RoundedRectangle(cornerRadii: .init(topTrailing: 16)))` | `radius.lg` |
| Layout | suggestionRow gap | RN-wrapper | `4` | `Spacer(Modifier.height(4.dp))` | `Spacer(minLength: 4)` | `space.xs` |
| Layout | suggestionRow paddingHorizontal | RN-wrapper | `semantic.space.md` = 12 | `Modifier.padding(horizontal = 12.dp)` | `.padding(.horizontal, 12)` | `space.md` |
| Layout | suggestionRow paddingVertical | RN-wrapper | `semantic.space.sm` = 8 | `Modifier.padding(vertical = 8.dp)` | `.padding(.vertical, 8)` | `space.sm` |
| Layout | skeleton height | RN-wrapper | `semantic.space.md` = 12 | `Modifier.height(12.dp)` | `.frame(height: 12)` | `space.md` |
| Layout | skeleton width | RN-wrapper | `'70%'` | `Modifier.fillMaxWidth(0.7f)` | `.frame(maxWidth: .infinity).layoutPriority(-1)` or percentage | n/a |
| Layout | skeleton borderRadius | RN-wrapper | `semantic.radius.md` = 8 | `RoundedCornerShape(8.dp)` | `RoundedRectangle(cornerRadius: 8)` | `radius.md` |
| Visual | suggestions backgroundColor | RN-wrapper | `semantic.color.surface.default` | `LaneShadowTheme.colors.surface` | `theme.colors.surface` | `color.surface.default` |
| Visual | suggestions borderColor | RN-wrapper | `semantic.color.border.default` | `LaneShadowTheme.colors.border` | `theme.colors.border` | `color.border.default` |
| Visual | skeleton backgroundColor | RN-wrapper | `semantic.color.surfaceVariant.default` | `LaneShadowTheme.colors.surfaceVariant` | `theme.colors.surfaceVariant` | `color.surfaceVariant.default` |
| Visual | skeleton inner backgroundColor | RN-wrapper | `semantic.color.surface.default` | `LaneShadowTheme.colors.surface` | `theme.colors.surface` | `color.surface.default` |
| Visual | suggestionRow backgroundColor (pressed) | RN-wrapper | `semantic.color.surfaceVariant.pressed` | `LaneShadowTheme.colors.surfaceVariantPressed` | `theme.colors.surfaceVariantPressed` | `color.surfaceVariant.pressed` |
| Typography | suggestionText variant | RN-wrapper | `bodySmall` (Paper) | `MaterialTheme.typography.bodySmall` | `.font(.system(.body(.small)))` | `type.body.sm` |
| Typography | suggestionText color | RN-wrapper | `semantic.color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |
| Typography | suggestionText numberOfLines | RN-wrapper | `1` | `maxLines = 1`, `overflow = TextOverflow.Ellipsis` | `.lineLimit(1)` | n/a |

### ThemeOverlayPill

**Source files read:**
- LaneShadow: `react-native/components/ui/overlay-pill.tsx`
- Framework: `node_modules/react-native/Libraries/Components/View/View.js`, `node_modules/react-native-paper/src/components/Text/Text.tsx`

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| Layout | alignItems | RN-wrapper | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.alignment(.center)` | n/a |
| Layout | gap | RN-wrapper | `6` | `Spacer(Modifier.width(6.dp))` | `Spacer(minLength: 6)` | ESCALATE — propose `space.overlayPillGap = 6` |
| Layout | paddingVertical | RN-wrapper | `6` | `Modifier.padding(vertical = 6.dp)` | `.padding(.vertical, 6)` | ESCALATE — propose `space.overlayPillPadding = 6` |
| Layout | paddingHorizontal | RN-wrapper | `12` | `Modifier.padding(horizontal = 12.dp)` | `.padding(.horizontal, 12)` | `space.md` ✓ |
| Layout | borderRadius | RN-wrapper | `20` | `RoundedCornerShape(20.dp)` | `RoundedRectangle(cornerRadius: 20)` | ESCALATE — propose `radius.overlayPill = 20` |
| Layout | borderWidth | RN-wrapper | `1` | `Modifier.border(1.dp, ...)` | `.overlay(RoundedRectangle(...).stroke(..., lineWidth: 1))` | ESCALATE — propose `borderWidth.thin = 1` |
| Visual | backgroundColor (inactive) | RN-wrapper | `semantic.color.divider.default` | `LaneShadowTheme.colors.divider` | `theme.colors.divider` | `color.divider.default` |
| Visual | backgroundColor (active) | RN-wrapper | `semantic.color.primary.default` + 20% opacity | `LaneShadowTheme.colors.primary.copy(alpha = 0.2f)` | `theme.colors.primary.opacity(0.2)` | `color.primary.default` |
| Visual | borderColor (active) | RN-wrapper | `semantic.color.primary.default` + 30% opacity | `LaneShadowTheme.colors.primary.copy(alpha = 0.3f)` | `theme.colors.primary.opacity(0.3)` | `color.primary.default` |
| Visual | borderColor (inactive) | RN-wrapper | `'transparent'` | `Color.Transparent` | `.clear` | n/a |
| Typography | iconSize | RN-wrapper | `16` (default) | `16.dp` | `16` | ESCALATE — propose `size.icon.small = 16` |
| Typography | label fontSize | RN-wrapper | `13` | `13.sp` | `.font(.system(size: 13))` | ESCALATE — propose `type.overlayPill.fontSize = 13` |
| Typography | label fontWeight | RN-wrapper | `'500'` | `FontWeight.Medium` | `.medium` | `type.label.md.fontWeight` (=500) ✓ |
| Typography | label color (active) | RN-wrapper | `semantic.color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |
| Typography | label color (inactive) | RN-wrapper | `semantic.color.onSurface.subtle` | `LaneShadowTheme.colors.onSurfaceSubtle` | `theme.colors.onSurfaceSubtle` | `color.onSurface.subtle` |

### ThemeWhereToBar

**Source files read:**
- LaneShadow: `react-native/components/map/where-to-bar.tsx`
- Framework: `node_modules/react-native/Libraries/Components/View/View.js`, uses `FloatingSearchInput` from `react-native/components/ui/floating-search-input.tsx`

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | flex | RN-wrapper | `1` | `Modifier.fillMaxSize()` | `.frame(maxWidth: .infinity)` | n/a |
| Layout | minWidth | RN-wrapper | `0` | `Modifier.requiredWidth(IntrinsicSize.Min)` | `.frame(minWidth: 0)` | n/a |
| Layout | width | RN-wrapper | `'100%'` | `Modifier.fillMaxWidth()` | `.frame(maxWidth: .infinity)` | n/a |
| Layout | flexBasis | RN-wrapper | `'auto'` | `Modifier.weight(1f)` | n/a | n/a |
| Layout | alignSelf | RN-wrapper | `'stretch'` | `Modifier.align(Alignment.Stretch)` | `.frame(maxWidth: .infinity)` | n/a |
| Layout | flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| Layout | gap | RN-wrapper | `8` | `Spacer(Modifier.width(8.dp))` | `Spacer(minLength: 8)` | `space.sm` ✓ |
| Layout | backgroundColor | RN-wrapper | `'transparent'` | `Color.Transparent` | `.clear` | n/a |
| Layout | suggestions gap | RN-wrapper | `semantic.space.xs` = 4 | `Spacer(Modifier.height(4.dp))` | `Spacer(minLength: 4)` | `space.xs` |
| Layout | suggestions paddingVertical | RN-wrapper | `semantic.space.xs` = 4 | `Modifier.padding(vertical = 4.dp)` | `.padding(.vertical, 4)` | `space.xs` |
| Layout | suggestions borderRadius | RN-wrapper | `semantic.radius.lg` = 16 | `RoundedCornerShape(16.dp)` | `RoundedRectangle(cornerRadius: 16)` | `radius.lg` |
| Layout | suggestions maxWidth | RN-wrapper | `700` | `Modifier.widthIn(max = 700.dp)` | `.frame(maxWidth: 700)` | ESCALATE — propose `size.whereToSuggestionsMaxWidth = 700` |
| Layout | suggestions marginBottom | RN-wrapper | `8` | `Modifier.padding(bottom = 8.dp)` | `.padding(.bottom, 8)` | `space.sm` ✓ |
| Layout | suggestions borderWidth | RN-wrapper | `1` | `Modifier.border(1.dp, ...)` | `.overlay(RoundedRectangle(...).stroke(..., lineWidth: 1))` | ESCALATE — propose `borderWidth.thin = 1` |
| Layout | suggestionRow gap | RN-wrapper | `4` | `Spacer(Modifier.height(4.dp))` | `Spacer(minLength: 4)` | `space.xs` |
| Layout | suggestionRow paddingHorizontal | RN-wrapper | `semantic.space.md` = 12 | `Modifier.padding(horizontal = 12.dp)` | `.padding(.horizontal, 12)` | `space.md` |
| Layout | suggestionRow paddingVertical | RN-wrapper | `semantic.space.sm` = 8 | `Modifier.padding(vertical = 8.dp)` | `.padding(.vertical, 8)` | `space.sm` |
| Layout | skeleton height (primary) | RN-wrapper | `semantic.space.md` = 12 | `Modifier.height(12.dp)` | `.frame(height: 12)` | `space.md` |
| Layout | skeleton width (primary) | RN-wrapper | `'70%'` | `Modifier.fillMaxWidth(0.7f)` | `.frame(maxWidth: .infinity).layoutPriority(-1)` or percentage | n/a |
| Layout | skeleton borderRadius (primary) | RN-wrapper | `semantic.radius.md` = 8 | `RoundedCornerShape(8.dp)` | `RoundedRectangle(cornerRadius: 8)` | `radius.md` |
| Layout | skeleton height (secondary) | RN-wrapper | `semantic.space.sm` = 8 | `Modifier.height(8.dp)` | `.frame(height: 8)` | `space.sm` |
| Layout | skeleton width (secondary) | RN-wrapper | `'50%'` | `Modifier.fillMaxWidth(0.5f)` | percentage | n/a |
| Layout | skeleton borderRadius (secondary) | RN-wrapper | `semantic.radius.sm` = 4 | `RoundedCornerShape(4.dp)` | `RoundedRectangle(cornerRadius: 4)` | `radius.sm` |
| Visual | suggestions backgroundColor | RN-wrapper | `semantic.color.surface.default` | `LaneShadowTheme.colors.surface` | `theme.colors.surface` | `color.surface.default` |
| Visual | suggestions borderColor | RN-wrapper | `semantic.color.border.default` | `LaneShadowTheme.colors.border` | `theme.colors.border` | `color.border.default` |
| Visual | suggestions shadowOpacity | RN-wrapper | `0.08` | `shadowOpacity = 0.08f` | `.shadow(radius: 8).opacity(0.08)` | ESCALATE — propose `shadow.whereToSuggestions.opacity = 0.08` |
| Visual | suggestions shadowRadius | RN-wrapper | `8` | `blurRadius = 8.dp` | `radius: 8` | ESCALATE — propose `shadow.whereToSuggestions.radius = 8` |
| Visual | suggestions shadowOffset | RN-wrapper | `width: 0, height: 4` | `offset(0.dp, 4.dp)` | `y: 4` | ESCALATE — propose `shadow.whereToSuggestions.offset = 4` |
| Visual | suggestions elevation | RN-wrapper | `2` | `elevation = 2.dp` | n/a | n/a |
| Visual | skeleton backgroundColor | RN-wrapper | `semantic.color.surfaceVariant.default` | `LaneShadowTheme.colors.surfaceVariant` | `theme.colors.surfaceVariant` | `color.surfaceVariant.default` |
| Visual | skeleton inner backgroundColor | RN-wrapper | `semantic.color.surface.default` | `LaneShadowTheme.colors.surface` | `theme.colors.surface` | `color.surface.default` |
| Visual | suggestionRow backgroundColor (pressed) | RN-wrapper | `semantic.color.surfaceVariant.pressed` | `LaneShadowTheme.colors.surfaceVariantPressed` | `theme.colors.surfaceVariantPressed` | `color.surfaceVariant.pressed` |
| Typography | suggestionText variant (primary) | RN-wrapper | `bodyMedium` (Paper) | `MaterialTheme.typography.bodyMedium` | `.font(.system(.body(.medium)))` | `type.body.md` |
| Typography | suggestionText color (primary) | RN-wrapper | `semantic.color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |
| Typography | suggestionText numberOfLines | RN-wrapper | `1` | `maxLines = 1`, `overflow = TextOverflow.Ellipsis` | `.lineLimit(1)` | n/a |
| Typography | suggestionText variant (secondary) | RN-wrapper | `bodySmall` (Paper) | `MaterialTheme.typography.bodySmall` | `.font(.system(.body(.small)))` | `type.body.sm` |
| Typography | suggestionText color (secondary) | RN-wrapper | `semantic.color.onSurface.subtle` | `LaneShadowTheme.colors.onSurfaceSubtle` | `theme.colors.onSurfaceSubtle` | `color.onSurface.subtle` |

## DESIGN NOTES

- Preserve RN spacing, composition hierarchy, and edge-case fixtures such as long labels, loading, and error states.
- Use fixed cameras, fixed coordinates, and deterministic map visuals for screenshot capture.
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
