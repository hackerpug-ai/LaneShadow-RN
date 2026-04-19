# UI-006: iOS atoms 1/5 — core primitives & typography: `ThemeText`, `ThemeBackground`, `ThemeIcon`, `ThemeSeparator`, `ThemeDragHandle` (inline), `ThemeSheetHandle` (inline)

**Task ID:** UI-006
**Sprint:** Sprint 2 - UI Component Translation and Fidelity Sandbox
**Assigned To:** swift-implementer
**Reviewer:** swift-reviewer
**Estimate:** 240 min
**Type:** [FEATURE]
**Status:** Planned
**Phase:** Atoms
**Quality Score:** 115/115

---

## BACKGROUND

Sprint 2 translates the React Native baseline into native platform components and sandbox scenarios before rider-facing feature sprints resume. This task covers the `atoms` slice for `iOS atoms 1/5 — core primitives & typography: ThemeText, ThemeBackground, ThemeIcon, ThemeSeparator, ThemeDragHandle (inline), ThemeSheetHandle (inline)`.

**Objective:** Implement iOS atoms 1/5 — core primitives & typography: `ThemeText`, `ThemeBackground`, `ThemeIcon`, `ThemeSeparator`, `ThemeDragHandle` (inline), `ThemeSheetHandle` (inline) as SwiftUI work with parity to the RN baseline, token-only styling, and sandbox coverage.

**Success State:** A reviewer can open the iOS sandbox, browse this task's scenarios, and confirm naming, interface, theme, state, accessibility, and layout parity against RN.

## CRITICAL CONSTRAINTS

### MUST
- Implement the listed components or compositions with parity-aligned naming and interfaces: `ThemeText`, `ThemeBackground`, `ThemeIcon`, `ThemeSeparator`, `ThemeDragHandle` (inline), `ThemeSheetHandle` (inline).
- Use only the LaneShadow core theme contract locked by `UI-001`: `tokens/semantic/semantic.tokens.json` as the source of truth, generated `native-theme` outputs as the shared packaging layer, and the platform theme entry points (`LaneShadowTheme` on Android, `.laneShadowTheme()` on iOS) for colors, spacing, typography, radii, elevation, and state styling.
- Register sandbox scenarios for default, interactive, and edge-case states with RN reference labels.
- Cover all interactive states required by the parity spec for atomic controls and visuals.

### NEVER
- Add unrelated feature wiring or backend dependencies to satisfy sandbox rendering.
- Introduce hardcoded UI primitives or platform-only naming drift.

### STRICTLY
- Preserve light and dark parity, accessibility labels, and deterministic fixtures for every scenario.

## DELIVERABLES

- ios/LaneShadow/Views/Atoms/**
- ios/LaneShadow/Sandbox/Stories/AtomsStories.swift — @MainActor enum with `static let all: [Story]`, aggregated into LaneShadowStories.all
- ios/LaneShadowTests/**
- ios/LaneShadowSnapshotTests/**

## ACCEPTANCE CRITERIA

### AC-1
**GIVEN** The RN baseline and atomic parity contract define the expected components and interfaces.
**WHEN** This task is implemented.
**THEN** The listed components or compositions exist in the correct iOS SwiftUI directories with parity-aligned names and signatures: `ThemeText`, `ThemeBackground`, `ThemeIcon`, `ThemeSeparator`, `ThemeDragHandle` (inline), `ThemeSheetHandle` (inline).
**Verify:** `printf "%s\n" "`ThemeText`, `ThemeBackground`, `ThemeIcon`, `ThemeSeparator`, `ThemeDragHandle` (inline), `ThemeSheetHandle` (inline)"`

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
| TC-1 | AC-1 | The listed components or compositions exist in the correct iOS SwiftUI directories with parity-aligned names and signatures: `ThemeText`, `ThemeBackground`, `ThemeIcon`, `ThemeSeparator`, `ThemeDragHandle` (inline), `ThemeSheetHandle` (inline). | `printf "%s\n" "`ThemeText`, `ThemeBackground`, `ThemeIcon`, `ThemeSeparator`, `ThemeDragHandle` (inline), `ThemeSheetHandle` (inline)"` |
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
- ios/LaneShadow/Views/Atoms/**
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
| ThemeText | `react-native/components/themed-text.tsx` | `node_modules/react-native-paper/src/components/Typography/Text.tsx` (variant: bodyMedium, titleSmall) | `ios/LaneShadow/Views/Atoms/ThemeText.swift` | 2 variants (default/defaultSemiBold) × 1 size × 1 state |
| ThemeBackground | `react-native/components/themed-view.tsx` | `node_modules/react-native/Libraries/Components/View/View.js` | `ios/LaneShadow/Views/Atoms/ThemeBackground.swift` | 1 variant × 1 size × 1 state |
| ThemeIcon | `react-native/components/ui/icon-symbol.tsx`, `react-native/components/ui/icon-symbol.ios.tsx` | `node_modules/@expo/vector-icons/MaterialCommunityIcons.js` (iOS uses MaterialCommunityIcons for consistency) | `ios/LaneShadow/Views/Atoms/ThemeIcon.swift` | 1 fixed type × variable size × 1 state |
| ThemeSeparator | `react-native/components/ui/separator.tsx` | `node_modules/react-native/Libraries/Components/View/View.js` | `ios/LaneShadow/Views/Atoms/ThemeSeparator.swift` | 2 orientations (horizontal/vertical) × 1 size × 1 state |
| ThemeDragHandle (inline) | `react-native/components/ui/drag-handle.tsx` | `node_modules/react-native/Libraries/Components/View/View.js` | `ios/LaneShadow/Views/Atoms/ThemeDragHandle.swift` | 1 fixed style × 1 size × 1 state |
| ThemeSheetHandle (inline) | `react-native/components/sheets/sheet-handle.tsx` | `node_modules/react-native/Libraries/Components/View/View.js` | `ios/LaneShadow/Views/Atoms/ThemeSheetHandle.swift` | 1 fixed style × 1 size × 1 state |

## STYLE PROPERTIES MATRIX

> Exhaustive enumeration of every style property from both sources per `08f-translation-protocol.md`. Columns: Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping. `ESCALATE` = no token covers the value — add a proposed token to DECISIONS.md before implementing.
>
> **Token reference** (from `tokens/semantic/semantic.tokens.json`): space xs=4 sm=8 md=12 lg=16 xl=24 2xl=32 3xl=48 4xl=64; radius none=0 sm=4 md=8 lg=16 xl=24 2xl=32 full=9999; elevation[2] shadowOffset=0/2 shadowOpacity=0.05 shadowRadius=4 androidElevation=2. **Paper bodyMedium**: fontFamily=sans-serif, fontWeight=400, fontSize=14, lineHeight=20, letterSpacing=0.25. **Paper titleSmall**: fontFamily=sans-serif-medium, fontWeight=500, fontSize=14, lineHeight=20, letterSpacing=0.1.

### ThemeText

**Source files read:**
- LaneShadow: `react-native/components/themed-text.tsx`
- Framework: `node_modules/react-native-paper/src/components/Typography/Text.tsx`

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Typography — default | fontFamily | Paper bodyMedium | `sans-serif` (default) | `MaterialTheme.typography.bodyMedium.fontFamily` → map to LaneShadow font | `.font(.body)` | `type.body.md.fontFamily` |
| Typography — default | fontSize | Paper bodyMedium | 14 | `14.sp` | `14` | `type.body.md.fontSize` |
| Typography — default | fontWeight | Paper bodyMedium | `'400'` (normal) | `FontWeight.Normal` | `.regular` | `type.body.md.fontWeight` |
| Typography — default | lineHeight | Paper bodyMedium | 20 | `LineHeightStyle` or `lineHeight = 20.sp` | `.lineSpacing(20 - 14)` = 6 | `type.body.md.lineHeight` |
| Typography — default | letterSpacing | Paper bodyMedium | 0.25 | `LetterSpacing(0.25.sp)` | `.tracking(0.25)` | ESCALATE — `type.body.md` missing letterSpacing; propose `0.25` |
| Typography — defaultSemiBold | fontFamily | Paper titleSmall | `sans-serif-medium` | `MaterialTheme.typography.titleSmall.fontFamily` → map to LaneShadow font | `.font(.system(size: 14, weight: .medium))` | `type.label.md.fontWeight` |
| Typography — defaultSemiBold | fontSize | Paper titleSmall | 14 | `14.sp` | `14` | `type.label.md.fontSize` |
| Typography — defaultSemiBold | fontWeight | Paper titleSmall | `'500'` (medium) | `FontWeight.Medium` | `.medium` | `type.label.md.fontWeight` |
| Typography — defaultSemiBold | lineHeight | Paper titleSmall | 20 | `20.sp` | `.lineSpacing(20 - 14)` = 6 | `type.label.md.lineHeight` |
| Typography — defaultSemiBold | letterSpacing | Paper titleSmall | 0.1 | `LetterSpacing(0.1.sp)` | `.tracking(0.1)` | ESCALATE — `type.label.md` missing letterSpacing; propose `0.1` |
| Visual | color | RN-wrapper | `semantic.color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |
| Interaction | testID | RN-wrapper | passed via prop | `Modifier.testTag(testID)` | `.accessibilityIdentifier(testID)` | n/a |

### ThemeBackground

**Source files read:**
- LaneShadow: `react-native/components/themed-view.tsx`
- Framework: `node_modules/react-native/Libraries/Components/View/View.js`

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | flexDirection | RN-wrapper | `'column'` | `Column(...)` | `VStack` | n/a |
| Visual | backgroundColor | RN-wrapper | `semantic.color.surface.default` | `LaneShadowTheme.colors.surface` | `theme.colors.surface` | `color.surface.default` |
| Visual | style | RN-wrapper | prop `style?: ViewStyle` | `Modifier.then(if style != null)` | `.background(...)` | n/a (passed through) |

### ThemeIcon

**Source files read:**
- LaneShadow: `react-native/components/ui/icon-symbol.tsx`, `react-native/components/ui/icon-symbol.ios.tsx`
- Framework: `node_modules/@expo/vector-icons/MaterialCommunityIcons.js`

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | size | RN-wrapper | prop default=24 | `Modifier.size(size.dp)` | `.frame(width: size, height: size)` | ESCALATE — propose `iconSize.default = 24` |
| Visual | color | RN-wrapper | prop `color: string \| OpaqueColorValue` | `tint = color` | `.foregroundStyle(color)` | n/a (passed through) |
| Visual | name | RN-wrapper | prop `name: IconName` (keyof MaterialCommunityIcons.glyphMap) | `Icon(imageVector = Icons.Default[name])` | `Image(systemName: mappedSFSymbol)` | n/a (name mapping) |
| Visual | style | RN-wrapper | prop `style?: StyleProp<TextStyle>` | `Modifier.then(if style != null)` | `.background(...)` | n/a (passed through) |
| Interaction | testID | RN-wrapper | passed via prop | `Modifier.testTag(testID)` | `.accessibilityIdentifier(testID)` | n/a |
| Note | weight | RN-wrapper | prop `weight?: SymbolWeight` (unused on iOS — MaterialCommunityIcons doesn't support weight) | n/a | n/a | n/a |

### ThemeSeparator

**Source files read:**
- LaneShadow: `react-native/components/ui/separator.tsx`
- Framework: `node_modules/react-native/Libraries/Components/View/View.js`

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout — horizontal | height | RN-wrapper | hardcoded `1` | `Modifier.height(1.dp)` | `.frame(height: 1)` | ESCALATE — propose `borderWidth.thin = 1` |
| Layout — horizontal | width | RN-wrapper | `'100%'` | `Modifier.fillMaxWidth()` | `.frame(maxWidth: .infinity)` | n/a |
| Layout — vertical | height | RN-wrapper | `'100%'` | `Modifier.fillMaxHeight()` | `.frame(maxHeight: .infinity)` | n/a |
| Layout — vertical | width | RN-wrapper | hardcoded `1` | `Modifier.width(1.dp)` | `.frame(width: 1)` | ESCALATE — propose `borderWidth.thin = 1` |
| Visual | backgroundColor | RN-wrapper | `semantic.color.border.default` | `LaneShadowTheme.colors.border` | `theme.colors.border` | `color.border.default` |
| Layout | orientation | RN-wrapper | prop `orientation?: 'horizontal' \| 'vertical'` default=`'horizontal'` | `if (orientation == vertical) Modifier.width(1.dp).fillMaxHeight() else Modifier.height(1.dp).fillMaxWidth()` | `.frame(width: orientation == vertical ? 1 : nil, height: orientation == horizontal ? 1 : nil)` | n/a |
| Visual | style | RN-wrapper | prop `style?: ViewStyle` | `Modifier.then(if style != null)` | `.background(...)` | n/a (passed through) |

### ThemeDragHandle (inline)

**Source files read:**
- LaneShadow: `react-native/components/ui/drag-handle.tsx`
- Framework: `node_modules/react-native/Libraries/Components/View/View.js`

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | width | RN-wrapper | prop default=36 | `Modifier.width(36.dp)` | `.frame(width: 36)` | ESCALATE — propose `size.dragHandleWidth = 36` |
| Layout | height | RN-wrapper | prop default=4 | `Modifier.height(4.dp)` | `.frame(height: 4)` | ESCALATE — propose `size.dragHandleHeight = 4` |
| Layout | borderRadius | RN-wrapper | prop default=2 | `RoundedCornerShape(2.dp)` | `RoundedRectangle(cornerRadius: 2)` | ESCALATE — propose `radius.dragHandle = 2` or map to `radius.sm = 4` (nearest) |
| Layout | alignSelf | RN-wrapper | `'center'` | `Modifier.align(Alignment.CenterHorizontally)` | `.frame(maxWidth: .infinity)` | n/a |
| Layout | marginVertical | StyleSheet | hardcoded `8` | `Modifier.padding(vertical = 8.dp)` | `.padding(.vertical, 8)` | `space.sm` ✓ |
| Visual | backgroundColor | RN-wrapper | `semantic.color.onSurface.subtle` | `LaneShadowTheme.colors.onSurfaceSubtle` | `theme.colors.onSurfaceSubtle` | `color.onSurface.subtle` |

### ThemeSheetHandle (inline)

**Source files read:**
- LaneShadow: `react-native/components/sheets/sheet-handle.tsx`
- Framework: `node_modules/react-native/Libraries/Components/View/View.js`

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout — container | width | StyleSheet | `'100%'` | `Modifier.fillMaxWidth()` | `.frame(maxWidth: .infinity)` | n/a |
| Layout — container | alignItems | StyleSheet | `'center'` | `Modifier.align(Alignment.CenterHorizontally)` | `.frame(maxWidth: .infinity)` | n/a |
| Layout — container | justifyContent | StyleSheet | `'center'` | `Arrangement.Center` | n/a | n/a |
| Layout — handle | width | StyleSheet | hardcoded `48` | `Modifier.width(48.dp)` | `.frame(width: 48)` | ESCALATE — propose `size.sheetHandleWidth = 48` |
| Layout — handle | height | StyleSheet | hardcoded `5` | `Modifier.height(5.dp)` | `.frame(height: 5)` | ESCALATE — propose `size.sheetHandleHeight = 5` |
| Layout — handle | borderRadius | StyleSheet | hardcoded `999` (full pill) | `CircleShape` or `RoundedCornerShape(999.dp)` | `Capsule()` or `RoundedRectangle(cornerRadius: 999)` | `radius.full` ✓ |
| Visual | backgroundColor | RN-wrapper | `semantic.color.onSurface.subtle` | `LaneShadowTheme.colors.onSurfaceSubtle` | `theme.colors.onSurfaceSubtle` | `color.onSurface.subtle` |
| Interaction | testID | RN-wrapper | hardcoded `'sheet-handle'` | `Modifier.testTag("sheet-handle")` | `.accessibilityIdentifier("sheet-handle")` | n/a |

## DESIGN NOTES

- Cover baseline states and typography or icon behavior explicitly so later molecules inherit stable primitives.
- Define detents, handles, scrim, keyboard avoidance, and safe-area behavior explicitly.
- Avoid default SwiftUI list, form, or navigation styling unless it is fully token-overridden and parity-approved.

## VERIFICATION GATES

- pnpm type-check:native
- swiftformat --lint ios/LaneShadow --config .swiftformat
- xcodebuild -workspace ios/LaneShadow.xcworkspace -scheme LaneShadow -destination "platform=iOS Simulator,name=iPhone 16" test
- Validate sandbox scenarios for this task in the native sandbox host

## DEPENDENCIES

- UI-001
- UI-002
- UI-004

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
