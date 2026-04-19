# UI-052: iOS organisms 7/7 — planning, voice, settings, dev organisms: same component list (iOS naming)

**Task ID:** UI-052
**Sprint:** Sprint 2 - UI Component Translation and Fidelity Sandbox
**Assigned To:** swift-implementer
**Reviewer:** swift-reviewer
**Estimate:** 480 min
**Type:** [FEATURE]
**Status:** Planned
**Phase:** Organisms
**Quality Score:** 115/115

---

## BACKGROUND

Sprint 2 translates the React Native baseline into native platform components and sandbox scenarios before rider-facing feature sprints resume. This task covers the `organisms` slice for `iOS organisms 7/7 — planning, voice, settings, dev organisms: same component list (iOS naming)`.

**Objective:** Implement iOS organisms 7/7 — planning, voice, settings, dev organisms: same component list (iOS naming) as SwiftUI work with parity to the RN baseline, token-only styling, and sandbox coverage.

**Success State:** A reviewer can open the iOS sandbox, browse this task's scenarios, and confirm naming, interface, theme, state, accessibility, and layout parity against RN.

## CRITICAL CONSTRAINTS

### MUST
- Implement the listed components or compositions with parity-aligned naming and interfaces: same component list (iOS naming).
- Use only the LaneShadow core theme contract locked by `UI-001`: `tokens/semantic/semantic.tokens.json` as the source of truth, generated `native-theme` outputs as the shared packaging layer, and the platform theme entry points (`LaneShadowTheme` on Android, `.laneShadowTheme()` on iOS) for colors, spacing, typography, radii, elevation, and state styling.
- Register sandbox scenarios for default, interactive, and edge-case states with RN reference labels.
- Use deterministic composition fixtures so complex sheets, maps, chat, and list layouts are diffable.

### NEVER
- Add unrelated feature wiring or backend dependencies to satisfy sandbox rendering.
- Introduce hardcoded UI primitives or platform-only naming drift.

### STRICTLY
- Preserve light and dark parity, accessibility labels, and deterministic fixtures for every scenario.

## DELIVERABLES

- ios/LaneShadow/Views/Organisms/**
- ios/LaneShadow/Sandbox/Stories/OrganismsStories.swift — @MainActor enum with `static let all: [Story]`, aggregated into LaneShadowStories.all
- ios/LaneShadowTests/**
- ios/LaneShadowSnapshotTests/**

## ACCEPTANCE CRITERIA

### AC-1
**GIVEN** The RN baseline and atomic parity contract define the expected components and interfaces.
**WHEN** This task is implemented.
**THEN** The listed components or compositions exist in the correct iOS SwiftUI directories with parity-aligned names and signatures: same component list (iOS naming).
**Verify:** `printf "%s\n" "same component list (iOS naming)"`

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
**GIVEN** native-sandbox is installed and a DEBUG build is running.
**WHEN** `make ios_sandbox` launches the sandbox (passes `-LaneShadowSandbox` arg to the app).
**THEN** every component listed in DELIVERABLES has at least one `Story(id: "<tier>.<component>.<state>", tier: .<tier>, component: "<Name>", name: "<State>", summary: "<rn-reference-path>") { _ in <SwiftUI usage> }` registered in `LaneShadowStories.all` and renders in the story-tree drawer under its tier, wrapped by `themedPreview { $0.laneShadowTheme() }`.

**Launch:** `make ios_sandbox` (canonical). Secondary: device shake (simulator: `xcrun simctl io booted shake`) or `xcrun simctl launch <id> com.laneshadow.app -LaneShadowSandbox`.

## TEST CRITERIA

| ID | Maps To | Boolean Statement | Verify |
|---|---|---|---|
| TC-1 | AC-1 | The listed components or compositions exist in the correct iOS SwiftUI directories with parity-aligned names and signatures: same component list (iOS naming). | `printf "%s\n" "same component list (iOS naming)"` |
| TC-2 | AC-2 | All visuals use the LaneShadow core theme contract from `UI-001` and render correctly in both color modes without hardcoded UI primitives. | `rg -n "Token consumption\|light and dark" .spec/prds/native-rewrite/08d-component-parity-spec.md .spec/prds/native-rewrite/08-design-system.md` |
| TC-3 | AC-3 | Each listed component has deterministic sandbox coverage with RN reference labels and explicit state variants where applicable. | `rg -n "RN reference\|scenario\|interactive states" .spec/prds/native-rewrite/tasks/sprint-02-ui-component-translation/SPRINT.md` |
| TC-4 | AC-4 | Accessibility labels, touch targets, keyboard or safe-area handling, and motion or state parity behave correctly for this component family. | `rg -n "Accessibility\|Keyboard handling\|RTL support\|Animation parity\|State parity" .spec/prds/native-rewrite/08d-component-parity-spec.md` |
| TC-5 | AC-5 | The composition renders using only previously defined platform components, deterministic fixtures, and no backend or auth dependencies. | `rg -n "deterministic\|fixtures\|no auth\|no backend" .spec/prds/native-rewrite/tasks/sprint-02-ui-component-translation/SPRINT.md` |
| TC-6 | ALL | Repo validation gates remain green for the touched workspace when this task is complete. | `pnpm type-check:native && swiftformat --lint ios/LaneShadow --config .swiftformat && xcodebuild -workspace ios/LaneShadow.xcworkspace -scheme LaneShadow -destination "platform=iOS Simulator,name=iPhone 16" test` |

## READING LIST

1. `.spec/prds/native-rewrite/README.md`
2. `.spec/prds/native-rewrite/tasks/sprint-02-ui-component-translation/SPRINT.md`
3. `.spec/prds/native-rewrite/08a-atomic-component-catalog.md`
4. `.spec/prds/native-rewrite/08d-component-parity-spec.md`
5. `RULES.md`
6. `.spec/prds/native-rewrite/08c-ios-component-map.md`

## GUARDRAILS

### WRITE-ALLOWED
- ios/LaneShadow/Views/Organisms/**
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
| PlanningBottomSheet | `react-native/components/sheets/planning-bottom-sheet.tsx` | `node_modules/@gorhom/bottom-sheet/src/components/bottomSheet/BottomSheet.tsx`; `node_modules/react-native-paper/src/components/Text/Text.tsx`; `node_modules/react-native-reanimated/src/Animated.js` | `ios/LaneShadow/Views/Organisms/PlanningBottomSheet.swift` | 3 snap presets (content/half/full) × streaming state × event list × total row |
| ModelManagerSection | `react-native/components/model/ModelManagerSection.tsx` | `node_modules/react-native-paper/src/components/Card/Card.tsx`; `node_modules/react-native-paper/src/components/Button/Button.tsx` | `ios/LaneShadow/Views/Organisms/ModelManagerSection.swift` | 3 cards (status/info/actions) × 3 states (active/corrupted/updateAvailable) |
| VoiceAssistantOverlay | `react-native/components/assistant/voice-assistant-overlay.tsx` | `node_modules/react-native-paper/src/components/Text/Text.tsx`; `node_modules/react-native/Libraries/Components/View/View.js` | `ios/LaneShadow/Views/Organisms/VoiceAssistantOverlay.swift` | 2 states (idle/recording) × transcript display × dismiss button |
| DevMenu | `react-native/components/dev/dev-menu.tsx` | `node_modules/@gorhom/bottom-sheet/src/components/bottomSheetModal/BottomSheetModal.tsx`; `node_modules/react-native-reanimated/src/Animated.js`; `node_modules/react-native-gesture-handler/src/gestures/PanGesture.ts` | `ios/LaneShadow/Views/Organisms/DevMenu.swift` | Floating draggable FAB × bottom sheet modal × 3 action buttons × result banner |
| FavoriteRoadsSection | `react-native/components/settings/favorite-roads-section.tsx` | `node_modules/react-native/Libraries/Lists/FlatList/FlatList.js` (via SavedRouteCard) | `ios/LaneShadow/Views/Organisms/FavoriteRoadsSection.swift` | 3 states (loading/empty/loaded) × delete dialog × route cards list |

## STYLE PROPERTIES MATRIX

> Exhaustive enumeration of every style property from both sources per `08f-translation-protocol.md`. Columns: Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping. `ESCALATE` = no token covers the value — add a proposed token to DECISIONS.md before implementing.
>
> **Token reference** (from `tokens/semantic/semantic.tokens.json`): space xs=4 sm=8 md=12 lg=16 xl=24 2xl=32 3xl=48 4xl=64; radius none=0 sm=4 md=8 lg=16 xl=24 2xl=32 full=9999; elevation[2] shadowOffset=0/2 shadowOpacity=0.05 shadowRadius=4 androidElevation=2. **Paper labelLarge**: fontFamily=sans-serif-medium, fontWeight=500, fontSize=14, lineHeight=20, letterSpacing=0.1. **Paper labelMedium**: fontFamily=sans-serif-medium, fontWeight=500, fontSize=12, lineHeight=16, letterSpacing=0.5. **Paper titleMedium**: fontFamily=sans-serif, fontWeight=500, fontSize=16, lineHeight=24, letterSpacing=0.15. **Paper headlineSmall**: fontFamily=sans-serif, fontWeight=400, fontSize=24, lineHeight=32, letterSpacing=0. **Paper bodyMedium**: fontFamily=sans-serif, fontWeight=400, fontSize=14, lineHeight=20, letterSpacing=0.25.

### PlanningBottomSheet

**Source files read:**
- LaneShadow: `react-native/components/sheets/planning-bottom-sheet.tsx`
- Framework: `node_modules/@gorhom/bottom-sheet/src/components/bottomSheet/BottomSheet.tsx`, `node_modules/react-native-paper/src/components/Text/Text.tsx`, `node_modules/react-native-reanimated/src/Animated.js`

**Layout — snap points (presets):**

| Preset | Source | Snap point value | Android | iOS | Token |
|---|---|---|---|---|---|
| content | RN-wrapper (via BottomSheetWrapper) | `['40%']` | `BottomSheetScaffold(sheetPeekHeight = 0.4f)` | `.presentationDetents([.fraction(0.4)])` | n/a (preset constant) |
| half | RN-wrapper (via BottomSheetWrapper) | `['60%']` | `BottomSheetScaffold(sheetPeekHeight = 0.6f)` | `.presentationDetents([.fraction(0.6)])` | n/a (preset constant) |
| full | RN-wrapper (via BottomSheetWrapper) | `['90%']` | `BottomSheetScaffold(sheetPeekHeight = 0.9f)` | `.presentationDetents([.fraction(0.9)])` | n/a (preset constant) |

**Layout — padding (content wrapper):**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| paddingHorizontal | RN-wrapper (via BottomSheetWrapper) | `space.lg` = 16 | `Modifier.padding(horizontal = 16.dp)` | `.padding(.horizontal, 16)` | `space.lg` |
| paddingTop | RN-wrapper (via BottomSheetWrapper) | `space.md` = 12 | `Modifier.padding(top = 12.dp)` | `.padding(.top, 12)` | `space.md` |
| paddingBottom | RN-wrapper (via BottomSheetWrapper) | `space.lg` = 16 | `Modifier.padding(bottom = 16.dp)` | `.padding(.bottom, 16)` | `space.lg` |
| gap | RN-wrapper (via BottomSheetWrapper) | `space.md` = 12 | `Arrangement.spacedBy(12.dp)` | default VStack spacing (12) | `space.md` |

**Layout — event row:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| alignItems | RN-wrapper | `'flex-start'` | `verticalAlignment = Alignment.Top` | `.alignment(.top)` | n/a |
| gap | RN-wrapper | `10` | `Arrangement.spacedBy(10.dp)` | `Spacer(minLength: 10)` | ESCALATE — propose `space.rowGap = 10` |
| minHeight | RN-wrapper | `44` | `Modifier.minHeight(44.dp)` | `.frame(minHeight: 44)` | ESCALATE — propose `minHeight.touchTarget = 44` |
| paddingVertical | RN-wrapper | `4` | `Modifier.padding(vertical = 4.dp)` | `.padding(.vertical, 4)` | ESCALATE — propose `space.xxs = 4` |
| iconSize | RN-wrapper | `16` | `Modifier.size(16.dp)` | `.frame(width: 16, height: 16)` | ESCALATE — propose `iconSize.sm = 16` |
| iconSpacing | RN-wrapper | `10` (implicit via row gap) | `Spacer(Modifier.width(10.dp))` | `Spacer(minLength: 10)` | ESCALATE — `space.rowGap = 10` |

**Layout — total row:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| totalSpacer width | RN-wrapper | `26` (16px icon + 10px gap) | `Spacer(Modifier.width(26.dp))` | `Spacer(minLength: 26)` | ESCALATE — composed from iconSize + rowGap |

**Layout — separators:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| itemSeparator height | RN-wrapper | `StyleSheet.hairlineWidth` (1) | `Modifier.height(1.dp)` | `.frame(height: 1)` | ESCALATE — propose `borderWidth.hairline = 1` |
| itemSeparator marginVertical | RN-wrapper | `2` | `Modifier.padding(vertical = 2.dp)` | `.padding(.vertical, 2)` | ESCALATE — propose `space.xxxs = 2` |
| divider height | RN-wrapper | `1` | `Modifier.height(1.dp)` | `.frame(height: 1)` | ESCALATE — `borderWidth.hairline = 1` |
| divider marginVertical | RN-wrapper | `4` | `Modifier.padding(vertical = 4.dp)` | `.padding(.vertical, 4)` | `space.xs` |

**Layout — StreamingThinking container:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| padding | RN-wrapper | `12` | `Modifier.padding(12.dp)` | `.padding(12)` | `space.md` |
| marginBottom | RN-wrapper | `12` | `Modifier.padding(bottom = 12.dp)` | `.padding(.bottom, 12)` | `space.md` |
| minHeight | RN-wrapper | `80` | `Modifier.minHeight(80.dp)` | `.frame(minHeight: 80)` | ESCALATE — propose `minHeight.thinkingContainer = 80` |
| maxHeight | RN-wrapper | `200` | `Modifier.height(200.dp)` | `.frame(height: 200)` | ESCALATE — propose `maxHeight.thinkingContainer = 200` |
| borderRadius | RN-wrapper | `radius.md` = 8 | `RoundedCornerShape(8.dp)` | `.cornerRadius(8)` | `radius.md` |
| gap | RN-wrapper | `space.sm` = 8 | `Arrangement.spacedBy(8.dp)` | `Spacer(minLength: 8)` | `space.sm` |
| pulsingDot size | RN-wrapper | `8×8` | `Modifier.size(8.dp)` | `.frame(width: 8, height: 8)` | ESCALATE — propose `size.pulsingDot = 8` |
| pulsingDot borderRadius | RN-wrapper | `4` | `CircleShape` | `Capsule()` (aspectRatio 1:1) | n/a (derived from size/2) |

**Visual — backgroundColor:**

| Element | State | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|---|
| StreamingThinking container | default | RN-wrapper | `surfaceVariant.default` | `LaneShadowTheme.colors.surfaceVariant` | `theme.colors.surfaceVariant` | `color.surfaceVariant.default` |
| pulsingDot | default | RN-wrapper | `primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |
| divider / itemSeparator | default | RN-wrapper | `border.default` | `LaneShadowTheme.colors.border` | `theme.colors.border` | `color.border.default` |
| thinking border | default | RN-wrapper | `primary.default + '30'` (opacity) | `primaryColor.copy(alpha = 0.3f)` | `primaryColor.opacity(0.3)` | ESCALATE — propose `color.primary.withOpacity = {0.3: '#B873334D'}` |

**Typography (Paper variants used):**

| Element | Paper variant | Source Properties | Android | iOS | Token |
|---|---|---|---|---|---|
| Header | titleMedium | fontSize=16, fontWeight=500, lineHeight=24 | `MaterialTheme.typography.titleMedium` | `.font(.system(size: 16, weight: .medium))` | `type.title.md.fontSize/lineHeight/fontWeight` |
| Event summary | bodyMedium | fontSize=14, fontWeight=400, lineHeight=20 | `MaterialTheme.typography.bodyMedium` | `.font(.system(size: 14, weight: .regular))` | `type.body.md.fontSize/lineHeight/fontWeight` |
| Event duration | labelMedium | fontSize=12, fontWeight=500, lineHeight=16 | `MaterialTheme.typography.labelMedium` | `.font(.system(size: 12, weight: .medium))` | `type.label.sm.fontSize/lineHeight/fontWeight` |
| Total row | labelLarge | fontSize=14, fontWeight=500, lineHeight=20 | `MaterialTheme.typography.labelLarge` | `.font(.system(size: 14, weight: .medium))` | `type.label.md.fontSize/lineHeight/fontWeight` |
| Thinking header | labelMedium | fontSize=12, fontWeight=500, lineHeight=16 | `MaterialTheme.typography.labelMedium` | `.font(.system(size: 12, weight: .medium))` | `type.label.sm.fontSize/lineHeight/fontWeight` |
| Thinking text | bodyMedium | fontSize=14, fontWeight=400, lineHeight=20 | `MaterialTheme.typography.bodyMedium` | `.font(.system(size: 14, weight: .regular))` | `type.body.md.fontSize/lineHeight/fontWeight` |

**State — animation (StreamingThinking):**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| animation | RN-wrapper (Reanimated) | `withRepeat(withSequence(withTiming(1.0, 600), withTiming(0.4, 600)), -1)` | `InfiniteTransition.animateFloat(..., animationSpec = RepeatableSpec(600ms))` | `.animation(.easeInOut(duration: 0.6).repeatForever(autoreverses: true))` | n/a (motion spec) |
| reduceMotion | RN-wrapper | `AccessibilityInfo.isReduceMotionEnabled()` | `LocalAccessibilityManager.reduceMotion` | `@Environment(\.accessibilityReduceMotion)` | n/a (platform API) |

**Interaction:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| testID (root) | RN-wrapper | `'planning-bottom-sheet'` | `Modifier.testTag("planning-bottom-sheet")` | `.accessibilityIdentifier("planning-bottom-sheet")` | n/a |
| testID (event list) | RN-wrapper | `'planning-bottom-sheet-list'` | `Modifier.testTag("planning-bottom-sheet-list")` | `.accessibilityIdentifier("planning-bottom-sheet-list")` | n/a |
| accessibilityRole | RN-wrapper | none set | n/a | n/a | n/a |

---

### ModelManagerSection

**Source files read:**
- LaneShadow: `react-native/components/model/ModelManagerSection.tsx`
- Framework: `node_modules/react-native-paper/src/components/Card/Card.tsx`, `node_modules/react-native-paper/src/components/Button/Button.tsx`

**Layout — ScrollView:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| flex | RN-wrapper | `1` | `Modifier.fillMaxSize()` | `.frame(maxWidth: .infinity, maxHeight: .infinity)` | n/a |
| backgroundColor | RN-wrapper | `'#111827'` (hardcoded) | `LaneShadowTheme.colors.background` | `theme.colors.background` | `color.background.default` |
| contentContainerStyle padding | RN-wrapper | `16` | `Modifier.padding(16.dp)` | `.padding(16)` | `space.lg` |
| contentContainerStyle gap | RN-wrapper | `16` | `Arrangement.spacedBy(16.dp)` | `Spacer(minLength: 16)` | `space.lg` |

**Layout — title:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| fontSize | RN-wrapper | `24` | `24.sp` | `24` | ESCALATE — propose `type.display.xs.fontSize = 24` |
| fontWeight | RN-wrapper | `'700'` | `FontWeight.Bold` | `.bold` | ESCALATE — propose `type.display.xs.fontWeight = 700` |
| color | RN-wrapper | `'#F3F4F6'` (hardcoded) | `LaneShadowTheme.colors.onBackground` | `theme.colors.onBackground` | `color.onBackground.default` |
| letterSpacing | RN-wrapper | `-0.5` | `LetterSpacing(-0.5.sp)` | `.tracking(-0.5)` | ESCALATE — propose `type.display.xs.letterSpacing = -0.5` |
| marginBottom | RN-wrapper | `8` | `Modifier.padding(bottom = 8.dp)` | `.padding(.bottom, 8)` | `space.sm` |

**Layout — Card:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| backgroundColor | RN-wrapper | `'#1F2937'` (hardcoded) | `LaneShadowTheme.colors.surface` | `theme.colors.surface` | `color.surface.default` |
| borderRadius | RN-wrapper | `16` | `RoundedCornerShape(16.dp)` | `.cornerRadius(16)` | `radius.lg` |

**Layout — status row:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| justifyContent | RN-wrapper | `'space-between'` | `horizontalArrangement = Arrangement.SpaceBetween` | n/a (HStack default) | n/a |
| alignItems | RN-wrapper | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.alignment(.center)` | n/a |
| gap | RN-wrapper | `8` | `Arrangement.spacedBy(8.dp)` | `Spacer(minLength: 8)` | `space.sm` |
| statusDot size | RN-wrapper | `8×8` | `Modifier.size(8.dp)` | `.frame(width: 8, height: 8)` | ESCALATE — `size.pulsingDot = 8` |
| statusDot borderRadius | RN-wrapper | `4` | `CircleShape` | `Capsule()` | n/a (derived from size/2) |

**Layout — info row:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| justifyContent | RN-wrapper | `'space-between'` | `horizontalArrangement = Arrangement.SpaceBetween` | n/a | n/a |
| alignItems | RN-wrapper | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.alignment(.center)` | n/a |
| paddingVertical | RN-wrapper | `8` | `Modifier.padding(vertical = 8.dp)` | `.padding(.vertical, 8)` | `space.sm` |
| borderBottomWidth | RN-wrapper | `1` | `Modifier.border(1.dp, ...)` | `.overlay(RoundedRectangle(...).stroke(..., lineWidth: 1))` | ESCALATE — propose `borderWidth.thin = 1` |
| borderBottomColor | RN-wrapper | `'rgba(255, 255, 255, 0.05)'` | `border.copy(alpha = 0.05f)` | `border.opacity(0.05)` | ESCALATE — propose `color.border.separator = {opacity: 0.05}` |

**Typography (status/info):**

| Element | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| statusLabel fontSize | RN-wrapper | `12` | `12.sp` | `12` | `type.label.xs.fontSize` |
| statusLabel fontWeight | RN-wrapper | `'500'` | `FontWeight.Medium` | `.medium` | `type.label.xs.fontWeight` |
| statusLabel color | RN-wrapper | `'#9CA3AF'` (hardcoded) | `LaneShadowTheme.colors.onSurfaceVariant` | `theme.colors.onSurfaceVariant` | `color.onSurfaceVariant.default` |
| statusText fontSize | RN-wrapper | `14` | `14.sp` | `14` | `type.label.md.fontSize` |
| statusText fontWeight | RN-wrapper | `'600'` | `FontWeight.SemiBold` | `.semibold` | ESCALATE — propose `type.label.md.fontWeight = 600` |
| infoLabel | same as statusLabel | — | — | — | `type.label.xs.fontSize/fontWeight` |
| infoValue fontSize | RN-wrapper | `14` | `14.sp` | `14` | `type.body.md.fontSize` |
| infoValue fontWeight | RN-wrapper | `'600'` | `FontWeight.SemiBold` | `.semibold` | ESCALATE — `type.label.md.fontWeight = 600` |
| checksumValue fontSize | RN-wrapper | `12` | `12.sp` | `12` | `type.label.xs.fontSize` |
| checksumValue fontFamily | RN-wrapper | `'monospace'` | `FontFamily.Monospace` | `.monospaced` | ESCALATE — propose `type.label.xs.fontFamily = monospace` |
| checksumValue color | RN-wrapper | `'#6B7280'` (hardcoded) | `LaneShadowTheme.colors.onSurfaceDisabled` | `theme.colors.onSurfaceDisabled` | `color.onSurface.disabled` |

**Layout — actions:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| gap | RN-wrapper | `12` | `Arrangement.spacedBy(12.dp)` | `Spacer(minLength: 12)` | `space.md` |
| buttonContent paddingVertical | RN-wrapper | `8` | `Modifier.padding(vertical = 8.dp)` | `.padding(.vertical, 8)` | `space.sm` |
| deleteButton marginTop | RN-wrapper | `8` | `Modifier.padding(top = 8.dp)` | `.padding(.top, 8)` | `space.sm` |

**Visual — status colors (hardcoded):**

| State | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| corrupted | RN-wrapper | `'#EF4444'` (hardcoded red) | `LaneShadowTheme.colors.danger` | `theme.colors.danger` | `color.danger.default` |
| updateAvailable | RN-wrapper | `'#F59E0B'` (hardcoded amber) | `LaneShadowTheme.colors.warning` | `theme.colors.warning` | `color.warning.default` |
| active | RN-wrapper | `'#10B981'` (hardcoded green) | `LaneShadowTheme.colors.success` | `theme.colors.success` | `color.success.default` |
| deleteButton textColor | RN-wrapper | `'#EF4444'` (hardcoded) | `LaneShadowTheme.colors.danger` | `theme.colors.danger` | `color.danger.default` |
| updateButton backgroundColor | RN-wrapper | `'#F59E0B'` (hardcoded) | `LaneShadowTheme.colors.warning` | `theme.colors.warning` | `color.warning.default` |
| validateButton borderColor | RN-wrapper | `'#374151'` (hardcoded) | `LaneShadowTheme.colors.outline` | `theme.colors.outline` | ESCALATE — propose `color.outline.default` |

**Layout — infoCard:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| backgroundColor | RN-wrapper | `'rgba(245, 158, 11, 0.1)'` (warning + 0.1 opacity) | `warning.copy(alpha = 0.1f)` | `warning.opacity(0.1)` | ESCALATE — propose `color.warning.surfaceContainer = {opacity: 0.1}` |
| borderRadius | RN-wrapper | `12` | `RoundedCornerShape(12.dp)` | `.cornerRadius(12)` | `radius.md` |
| borderWidth | RN-wrapper | `1` | `Modifier.border(1.dp, ...)` | same | ESCALATE — `borderWidth.thin = 1` |
| borderColor | RN-wrapper | `'rgba(245, 158, 11, 0.3)'` (warning + 0.3 opacity) | `warning.copy(alpha = 0.3f)` | `warning.opacity(0.3)` | ESCALATE — propose `color.warning.outline = {opacity: 0.3}` |
| gap | RN-wrapper | `8` | `Arrangement.spacedBy(8.dp)` | `Spacer(minLength: 8)` | `space.sm` |
| marginBottom | RN-wrapper | `12` | `Modifier.padding(bottom = 12.dp)` | `.padding(.bottom, 12)` | `space.md` |

**Typography (infoCard):**

| Element | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| infoTitle fontSize | RN-wrapper | `14` | `14.sp` | `14` | `type.label.md.fontSize` |
| infoTitle fontWeight | RN-wrapper | `'600'` | `FontWeight.SemiBold` | `.semibold` | ESCALATE — `type.label.md.fontWeight = 600` |
| infoTitle color | RN-wrapper | `'#F59E0B'` (warning) | `LaneShadowTheme.colors.warning` | `theme.colors.warning` | `color.warning.default` |
| infoText fontSize | RN-wrapper | `13` | `13.sp` | `13` | ESCALATE — propose `type.body.xs.fontSize = 13` |
| infoText lineHeight | RN-wrapper | `20` | `LineHeightStyle(20.sp)` | `.lineSpacing(20 - 13)` | `type.body.xs.lineHeight = 20` |
| infoText color | RN-wrapper | `'#D1D5DB'` (hardcoded) | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |
| infoText marginBottom | RN-wrapper | `8` | `Modifier.padding(bottom = 8.dp)` | `.padding(.bottom, 8)` | `space.sm` |

---

### VoiceAssistantOverlay

**Source files read:**
- LaneShadow: `react-native/components/assistant/voice-assistant-overlay.tsx`
- Framework: `node_modules/react-native-paper/src/components/Text/Text.tsx`, `node_modules/react-native/Libraries/Components/View/View.js`

**Layout — container:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| padding | RN-wrapper | `space.md` = 12 | `Modifier.padding(12.dp)` | `.padding(12)` | `space.md` |
| borderRadius | RN-wrapper | `radius.md` = 8 | `RoundedCornerShape(8.dp)` | `.cornerRadius(8)` | `radius.md` |

**Visual — backgroundColor:**

| Element | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| container | RN-wrapper | `surfaceVariant.default` | `LaneShadowTheme.colors.surfaceVariant` | `theme.colors.surfaceVariant` | `color.surfaceVariant.default` |

**Typography:**

| Element | Paper variant | Android | iOS | Token |
|---|---|---|---|---|
| title | titleMedium | `MaterialTheme.typography.titleMedium` | `.font(.system(size: 16, weight: .medium))` | `type.title.md.fontSize/fontWeight` |
| body | bodyMedium | `MaterialTheme.typography.bodyMedium` | `.font(.system(size: 14, weight: .regular))` | `type.body.md.fontSize/fontWeight` |
| dismiss link | labelSmall | `MaterialTheme.typography.labelSmall` | `.font(.system(size: 11, weight: .medium))` | `type.label.xs.fontSize/fontWeight` |

**Visual — textColor:**

| Element | State | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|---|
| title | default | RN-wrapper | `onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |
| transcript | default | RN-wrapper | `onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |
| listening | default | RN-wrapper | `onSurface.muted` | `LaneShadowTheme.colors.onSurfaceDisabled` | `theme.colors.onSurfaceDisabled` | `color.onSurface.disabled` |
| dismiss link | default | RN-wrapper | `primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |

**Interaction:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| dismiss onPress | RN-wrapper | `onPress` prop | `onClick` | `.onTapGesture` | n/a |

---

### DevMenu

**Source files read:**
- LaneShadow: `react-native/components/dev/dev-menu.tsx`
- Framework: `node_modules/@gorhom/bottom-sheet/src/components/bottomSheetModal/BottomSheetModal.tsx`, `node_modules/react-native-reanimated/src/Animated.js`, `node_modules/react-native-gesture-handler/src/gestures/PanGesture.ts`

**Layout — FAB:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| position | RN-wrapper | `'absolute'` | `Modifier.wrapContentSize(unbounded = true).offset(...)` | `.position(...)` | n/a |
| width/height | RN-wrapper | `56` | `Modifier.size(56.dp)` | `.frame(width: 56, height: 56)` | ESCALATE — propose `size.fab = 56` |
| borderRadius | RN-wrapper | `28` (56/2) | `CircleShape` | `.clipShape(Capsule())` | n/a (derived from size/2) |
| zIndex/elevation | RN-wrapper | `999999` | `Modifier.zIndex(9999).shadow(elevation = 4.dp)` | `.zIndex(9999)` | n/a (platform-specific) |
| initial position | RN-wrapper | `x: screenWidth - 56 - 16`, `y: 60` | calculated from screen dims | same | ESCALATE — propose `offset.fabDefault = {right: 16, top: 60}` |
| hitSlop | RN-wrapper | `{top: 10, bottom: 10, left: 10, right: 10}` | `Modifier.pointerInput(Unit).detectTapGestures { tapOffset = ... }` | `.contentShape(Rectangle()).padding(10)` | ESCALATE — propose `hitSlop.md = 10` |
| iconSize | RN-wrapper | `24` | `Modifier.size(24.dp)` | `.frame(width: 24, height: 24)` | ESCALATE — propose `iconSize.md = 24` |
| icon color | RN-wrapper | `'#FFFFFF'` (hardcoded white) | `Color.White` | `.white` | ESCALATE — propose `color.fabIcon = '#FFFFFF'` |

**Visual — FAB backgroundColor:**

| State | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| default | RN-wrapper | `primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |
| elevation | RN-wrapper | `semantic.elevation[4]` | `shadowOffset=0/2, shadowOpacity=0.05, shadowRadius=4, androidElevation=2` | `.shadow(radius: 4, y: 2)` | `elevation[4]` |

**Layout — bottom sheet content:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| snapPoints | RN-wrapper | `['60%']` | `BottomSheetScaffold(sheetPeekHeight = 0.6f)` | `.presentationDetents([.fraction(0.6)])` | n/a (preset constant) |
| padding | RN-wrapper | `24` | `Modifier.padding(24.dp)` | `.padding(24)` | ESCALATE — propose `space.xl = 24` |
| gap (section) | RN-wrapper | `space.lg` = 16 | `Arrangement.spacedBy(16.dp)` | `Spacer(minLength: 16)` | `space.lg` |
| gap (header) | RN-wrapper | `space.sm` = 8 | `Arrangement.spacedBy(8.dp)` | `Spacer(minLength: 8)` | `space.sm` |
| marginBottom (header) | RN-wrapper | `8` | `Modifier.padding(bottom = 8.dp)` | `.padding(.bottom, 8)` | `space.sm` |

**Layout — infoText:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| padding | RN-wrapper | `12` | `Modifier.padding(12.dp)` | `.padding(12)` | `space.md` |
| borderRadius | RN-wrapper | `8` | `RoundedCornerShape(8.dp)` | `.cornerRadius(8)` | `radius.md` |
| fontFamily | RN-wrapper | `'monospace'` | `FontFamily.Monospace` | `.monospaced` | ESCALATE — `type.label.xs.fontFamily = monospace` |
| fontSize | RN-wrapper | `12` | `12.sp` | `12` | `type.label.xs.fontSize` |
| lineHeight | RN-wrapper | `16` | `LineHeightStyle(16.sp)` | `.lineSpacing(16 - 12)` | `type.label.xs.lineHeight` |

**Layout — resultBanner:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| padding | RN-wrapper | `12` | `Modifier.padding(12.dp)` | `.padding(12)` | `space.md` |
| borderRadius | RN-wrapper | `8` | `RoundedCornerShape(8.dp)` | `.cornerRadius(8)` | `radius.md` |

**Typography (bottom sheet):**

| Element | Paper variant | Android | iOS | Token |
|---|---|---|---|---|
| header | headlineSmall | `MaterialTheme.typography.headlineSmall` | `.font(.system(size: 24, weight: .regular))` | `type.headline.sm.fontSize/fontWeight` |
| section title | titleMedium | `MaterialTheme.typography.titleMedium` | `.font(.system(size: 16, weight: .medium))` | `type.title.md.fontSize/fontWeight` |
| infoText | bodyMedium | `MaterialTheme.typography.bodyMedium` | `.font(.system(size: 14, weight: .regular))` | `type.body.md.fontSize/fontWeight` |
| resultBanner | bodyMedium | same | same | `type.body.md.fontSize/fontWeight` |

**Visual — backgroundColor:**

| Element | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| bottom sheet background | RN-wrapper | `surface.default` | `LaneShadowTheme.colors.surface` | `theme.colors.surface` | `color.surface.default` |
| handleIndicator | RN-wrapper | `onSurface.subtle` | `LaneShadowTheme.colors.onSurfaceDisabled` | `theme.colors.onSurfaceDisabled` | `color.onSurface.subtle` |
| infoText background | RN-wrapper | `surfaceVariant.default` | `LaneShadowTheme.colors.surfaceVariant` | `theme.colors.surfaceVariant` | `color.surfaceVariant.default` |
| resultBanner success | RN-wrapper | `success.default` | `LaneShadowTheme.colors.success` | `theme.colors.success` | `color.success.default` |
| resultBanner error | RN-wrapper | `danger.default` | `LaneShadowTheme.colors.danger` | `theme.colors.danger` | `color.danger.default` |

**Visual — textColor:**

| Element | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| header | RN-wrapper | `onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |
| section title | RN-wrapper | `onSurface.muted` | `LaneShadowTheme.colors.onSurfaceDisabled` | `theme.colors.onSurfaceDisabled` | `color.onSurface.disabled` |
| infoText | RN-wrapper | `onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |
| resultBanner | RN-wrapper | `onPrimary.default` | `LaneShadowTheme.colors.onPrimary` | `theme.colors.onPrimary` | `color.onPrimary.default` |

**State — drag gesture (Reanimated):**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| panGesture | RN-wrapper | `Gesture.Pan()` | `Modifier.draggable2D(...)` (or custom gesture) | `.gesture(DragGesture())` | n/a (gesture API) |
| snap onEnd | RN-wrapper | `centerX < screenWidth / 2 ? 16 : screenWidth - 56 - 16` | `animateToAsState(...)` | `.offset(x: snapX)` | n/a (computed) |
| withSpring | RN-wrapper | `withSpring(snapX)` | `animateFloatAsState(..., animationSpec = spring())` | `.animation(.spring())` | n/a (motion spec) |

**Interaction:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| testID (FAB) | RN-wrapper | `'dev-menu-fab'` | `Modifier.testTag("dev-menu-fab")` | `.accessibilityIdentifier("dev-menu-fab")` | n/a |
| testID (sheet) | RN-wrapper | `'dev-menu-sheet'` | `Modifier.testTag("dev-menu-sheet")` | `.accessibilityIdentifier("dev-menu-sheet")` | n/a |
| testID (clear model) | RN-wrapper | `'clear-model-button'` | `Modifier.testTag("clear-model-button")` | `.accessibilityIdentifier("clear-model-button")` | n/a |
| testID (reset setup) | RN-wrapper | `'reset-setup-button'` | `Modifier.testTag("reset-setup-button")` | `.accessibilityIdentifier("reset-setup-button")` | n/a |
| testID (model info) | RN-wrapper | `'model-info-text'` | `Modifier.testTag("model-info-text")` | `.accessibilityIdentifier("model-info-text")` | n/a |
| backdrop | RN-wrapper | `BottomSheetBackdrop` with `disappearsOnIndex=-1, appearsOnIndex=0` | `BottomSheetScaffold(sheetPeekHeight = ...)` with scrim | `.presentationBackgroundInteraction(.enabled(upThrough: .fraction(0.6)))` | n/a (component API) |
| keyboard handling | RN-wrapper | `android_keyboardInputMode="adjustResize"` | `WindowInsets.ime` | `.keyboardType(.default)` (iOS handles natively) | n/a (platform API) |

---

### FavoriteRoadsSection

**Source files read:**
- LaneShadow: `react-native/components/settings/favorite-roads-section.tsx`
- Framework: `node_modules/react-native/Libraries/Lists/FlatList/FlatList.js` (via SavedRouteCard)

**Layout — section:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| width | RN-wrapper | `'100%'` | `Modifier.fillMaxWidth()` | `.frame(maxWidth: .infinity)` | n/a |
| marginBottom | RN-wrapper | `space.lg` = 16 | `Modifier.padding(bottom = 16.dp)` | `.padding(.bottom, 16)` | `space.lg` |

**Layout — cardRow:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| alignItems | RN-wrapper | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.alignment(.center)` | n/a |
| gap | RN-wrapper | `12` | `Arrangement.spacedBy(12.dp)` | `Spacer(minLength: 12)` | `space.md` |

**Layout — deleteButton:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| padding | RN-wrapper | `8` | `Modifier.padding(8.dp)` | `.padding(8)` | `space.sm` |
| borderRadius | RN-wrapper | `8` | `RoundedCornerShape(8.dp)` | `.cornerRadius(8)` | `radius.md` |
| marginLeft | RN-wrapper | `8` | `Modifier.padding(start = 8.dp)` | `.padding(.leading, 8)` | `space.sm` |
| iconSize | RN-wrapper | `20` | `Modifier.size(20.dp)` | `.frame(width: 20, height: 20)` | ESCALATE — propose `iconSize.default = 20` |

**Layout — skeleton:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| height | RN-wrapper | `80` | `Modifier.height(80.dp)` | `.frame(height: 80)` | ESCALATE — propose `height.card = 80` |
| marginBottom | RN-wrapper | `space.md` = 12 | `Modifier.padding(bottom = 12.dp)` | `.padding(.bottom, 12)` | `space.md` |
| backgroundColor | RN-wrapper | `surfaceVariant.default` | `LaneShadowTheme.colors.surfaceVariant` | `theme.colors.surfaceVariant` | `color.surfaceVariant.default` |
| borderRadius | RN-wrapper | `radius.lg` = 16 | `RoundedCornerShape(16.dp)` | `.cornerRadius(16)` | `radius.lg` |

**Layout — FlatList:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| ItemSeparatorComponent height | RN-wrapper | `space.md` = 12 | `Arrangement.spacedBy(12.dp)` | `Spacer(minLength: 12)` | `space.md` |
| scrollEnabled | RN-wrapper | `false` | `userScrollEnabled = false` | `.scrollDisabled(true)` | n/a |

**Visual — deleteButton color:**

| Element | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| icon | RN-wrapper | `danger.default` | `LaneShadowTheme.colors.danger` | `theme.colors.danger` | `color.danger.default` |
| pressed opacity | RN-wrapper | `pressed ? 0.6 : 1` | `Modifier.alpha(if (pressed) 0.6f else 1f)` | `.opacity(pressed ? 0.6 : 1)` | ESCALATE — propose `opacity.pressed = 0.6` |

**Typography (see SavedRouteCard for full spec):**

| Element | Paper variant | Android | iOS | Token |
|---|---|---|---|---|
| SectionHeader title | custom (fontSize=20, fontWeight=600) | `20.sp` / `FontWeight.SemiBold` | `.font(.system(size: 20, weight: .semibold))` | ESCALATE — propose `type.sectionHeader.fontSize = 20, fontWeight = 600` |
| card title | title.sm | `MaterialTheme.typography.titleSmall` | `.font(.system(size: 14, weight: .semibold))` | `type.title.sm.fontSize/fontWeight` |
| card body | body.sm | `MaterialTheme.typography.bodySmall` | `.font(.system(size: 14, weight: .regular))` | `type.body.sm.fontSize/fontWeight` |

**Interaction:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| card accessibilityRole | RN-wrapper | `'button'` | `Modifier.semantics { role = Role.Button }` | `.accessibilityAddTraits(.isButton)` | n/a |
| card accessibilityLabel | RN-wrapper | ``View ${name}`` | `Modifier.semantics { contentDescription = "View $name" }` | `.accessibilityLabel("View \(name)")` | n/a |
| delete accessibilityRole | RN-wrapper | `'button'` | same | same | n/a |
| delete accessibilityLabel | RN-wrapper | `'Delete saved route'` | `Modifier.semantics { contentDescription = "Delete saved route" }` | `.accessibilityLabel("Delete saved route")` | n/a |
| testID (empty state) | RN-wrapper | `'empty-state'` | `Modifier.testTag("empty-state")` | `.accessibilityIdentifier("empty-state")` | n/a |
| testID (delete dialog) | RN-wrapper | `'delete-favorite-dialog'` | `Modifier.testTag("delete-favorite-dialog")` | `.accessibilityIdentifier("delete-favorite-dialog")` | n/a |

## DESIGN NOTES

- Use deterministic composition fixtures so complex sheets, maps, chat, and stacked layouts remain diffable.
- Provide a static capture mode for motion-heavy or animated states so screenshot diffs remain deterministic.
- Avoid default SwiftUI list, form, or navigation styling unless it is fully token-overridden and parity-approved.

## VERIFICATION GATES

- pnpm type-check:native
- swiftformat --lint ios/LaneShadow --config .swiftformat
- xcodebuild -workspace ios/LaneShadow.xcworkspace -scheme LaneShadow -destination "platform=iOS Simulator,name=iPhone 16" test
- Validate sandbox scenarios for this task in the native sandbox host

## DEPENDENCIES

- UI-038

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
