# UI-012: iOS atoms 4/5 — icon & branding: `MotorcyclePlusIcon`, `CompassPlusIcon`, `LaneShadowLogo`, `TypingIndicator` (SF Symbol mapping + custom asset fallbacks)

**Task ID:** UI-012
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

Sprint 2 translates the React Native baseline into native platform components and sandbox scenarios before rider-facing feature sprints resume. This task covers the `atoms` slice for `iOS atoms 4/5 — icon & branding: MotorcyclePlusIcon, CompassPlusIcon, LaneShadowLogo, TypingIndicator (SF Symbol mapping + custom asset fallbacks)`.

**Objective:** Implement iOS atoms 4/5 — icon & branding: `MotorcyclePlusIcon`, `CompassPlusIcon`, `LaneShadowLogo`, `TypingIndicator` (SF Symbol mapping + custom asset fallbacks) as SwiftUI work with parity to the RN baseline, token-only styling, and sandbox coverage.

**Success State:** A reviewer can open the iOS sandbox, browse this task's scenarios, and confirm naming, interface, theme, state, accessibility, and layout parity against RN.

## CRITICAL CONSTRAINTS

### MUST
- Implement the listed components or compositions with parity-aligned naming and interfaces: `MotorcyclePlusIcon`, `CompassPlusIcon`, `LaneShadowLogo`, `TypingIndicator` (SF Symbol mapping + custom asset fallbacks).
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
**THEN** The listed components or compositions exist in the correct iOS SwiftUI directories with parity-aligned names and signatures: `MotorcyclePlusIcon`, `CompassPlusIcon`, `LaneShadowLogo`, `TypingIndicator` (SF Symbol mapping + custom asset fallbacks).
**Verify:** `printf "%s\n" "`MotorcyclePlusIcon`, `CompassPlusIcon`, `LaneShadowLogo`, `TypingIndicator` (SF Symbol mapping + custom asset fallbacks)"`

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
| TC-1 | AC-1 | The listed components or compositions exist in the correct iOS SwiftUI directories with parity-aligned names and signatures: `MotorcyclePlusIcon`, `CompassPlusIcon`, `LaneShadowLogo`, `TypingIndicator` (SF Symbol mapping + custom asset fallbacks). | `printf "%s\n" "`MotorcyclePlusIcon`, `CompassPlusIcon`, `LaneShadowLogo`, `TypingIndicator` (SF Symbol mapping + custom asset fallbacks)"` |
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
| MotorcyclePlusIcon | `react-native/components/ui/motorcycle-plus-icon.tsx` | `node_modules/@expo/vector-icons/MaterialCommunityIcons.tsx` (motorbike, plus-circle glyphs); `node_modules/react-native/Libraries/Components/View/View.js` | `ios/LaneShadow/Views/Atoms/MotorcyclePlusIcon.swift` | 1 variant × 1 default size (22) × color override |
| CompassPlusIcon | `react-native/components/map/compass-plus-icon.tsx` | `node_modules/react-native-svg/lib/commonjs/elements/Circle.js`, `Line.js`, `Path.js`, `G.js`; `node_modules/react-native/Libraries/Components/View/View.js` | `ios/LaneShadow/Views/Atoms/CompassPlusIcon.swift` | 1 variant × 1 default size (28) × semantic color mapping |
| LaneShadowLogo | `react-native/components/auth/lane-shadow-logo.tsx` | `node_modules/react-native-svg/lib/commonjs/elements/Circle.js`, `Path.js`; `node_modules/react-native/Libraries/Components/View/View.js` | `ios/LaneShadow/Views/Atoms/LaneShadowLogo.swift` | 1 variant × size prop × 2 color modes (light/dark) |
| TypingIndicator | `react-native/components/chat/typing-indicator.tsx` | `node_modules/react-native-reanimated/lib/commonjs/Animated.js` (useSharedValue, withTiming, withRepeat); `node_modules/react-native/Libraries/Components/View/View.js` | `ios/LaneShadow/Views/Atoms/TypingIndicator.swift` | 2 size variants (sm/md) × 2 animation states (animated/reduced-motion) × color override |
| IconSymbol | `react-native/components/ui/icon-symbol.tsx`, `icon-symbol.ios.tsx` | `node_modules/@expo/vector-icons/MaterialCommunityIcons.tsx`; `node_modules/expo-symbols/build/SymbolWeight.d.ts` | `ios/LaneShadow/Views/Atoms/IconSymbol.swift` | SF Symbol mapping table × MaterialCommunityIcons fallback × size/color props |

## STYLE PROPERTIES MATRIX

> Exhaustive enumeration of every style property from both sources per `08f-translation-protocol.md`. Columns: Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping. `ESCALATE` = no token covers the value — add a proposed token to DECISIONS.md before implementing.
>
> **Token reference** (from `tokens/semantic/semantic.tokens.json`): space xs=4 sm=8 md=12 lg=16 xl=24 2xl=32 3xl=48 4xl=64; radius none=0 sm=4 md=8 lg=16 xl=24 2xl=32 full=9999; elevation[2] shadowOffset=0/2 shadowOpacity=0.05 shadowRadius=4 androidElevation=2.

### MotorcyclePlusIcon

**Source files read:**
- LaneShadow: `react-native/components/ui/motorcycle-plus-icon.tsx`
- Framework: `node_modules/@expo/vector-icons/MaterialCommunityIcons.tsx`

**Layout — sizing:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| containerSize | RN-wrapper | `size = 22` (default) | `Modifier.size(22.dp)` | `.frame(width: 22, height: 22)` | ESCALATE — propose `iconSize.sm = 22` |
| overlaySize | RN-wrapper | `size * 0.55` (calculated) | `(size * 0.55).dp` | `size * 0.55` | n/a (proportional) |
| overlayOffsetBottom | RN-wrapper | `overlaySize * 0.2` (calculated) | `-(overlaySize * 0.2).dp` | `-overlaySize * 0.2` | n/a (proportional) |
| overlayOffsetRight | RN-wrapper | `overlaySize * 0.2` (calculated) | `-(overlaySize * 0.2).dp` | `-overlaySize * 0.2` | n/a (proportional) |

**Visual — colors:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| baseIconColor | RN-wrapper | `semantic.color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |
| overlayIconColor | RN-wrapper | `semantic.color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |

**Visual — glyphs:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| baseGlyph | RN-wrapper | `motorbike` (MaterialCommunityIcons) | `Icons.Rounded.Motorbike` | ESCALATE — propose SF Symbol `figure.outdoor.stairs` or custom asset | n/a |
| overlayGlyph | RN-wrapper | `plus-circle` (MaterialCommunityIcons) | `Icons.Rounded.AddCircle` | `plus.circle.fill` (SF Symbol) | n/a |

**Layout — positioning:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| overlayPosition | RN-wrapper | `position: absolute`, `bottom: -20%`, `right: -20%` | `offset(x = -offset, y = -offset)` | `.offset(x: -offset, y: -offset)` | n/a |

### CompassPlusIcon

**Source files read:**
- LaneShadow: `react-native/components/map/compass-plus-icon.tsx`
- Framework: `node_modules/react-native-svg/lib/commonjs/elements/Circle.js`, `Line.js`, `Path.js`, `G.js`

**Layout — sizing:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| containerSize | RN-wrapper | `size = 28` (default) | `Modifier.size(28.dp)` | `.frame(width: 28, height: 28)` | ESCALATE — propose `iconSize.md = 28` |
| strokeWidth | RN-wrapper | `Math.max(1.5, semantic.space.xs / 3)` | `max(1.5.dp, space.xs / 3)` | `max(1.5, space.xs / 3)` | `space.xs / 3` (derived) |
| badgeRadius | RN-wrapper | `Math.max(6, semantic.space.md) / 2` | `max(6.dp, space.md / 2)` | `max(6, space.md / 2)` | `space.md / 2` (derived) |
| compassRadius | RN-wrapper | `(size - strokeWidth * 2) / 2` | `(size - strokeWidth * 2) / 2` | `(size - strokeWidth * 2) / 2` | n/a (calculated) |

**Visual — colors:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| compassBackground | RN-wrapper | `semantic.color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |
| compassForeground | RN-wrapper | `semantic.color.onPrimary.default` | `LaneShadowTheme.colors.onPrimary` | `theme.colors.onPrimary` | `color.onPrimary.default` |
| badgeBackground | RN-wrapper | `semantic.color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |
| badgeForeground | RN-wrapper | `semantic.color.surface.default` | `LaneShadowTheme.colors.surface` | `theme.colors.surface` | `color.surface.default` |

**Visual — stroke properties:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| strokeLinecap | RN-wrapper | `'round'` | `StrokeCap.Round` | `.lineCap(.round)` | n/a |
| strokeLinejoin | RN-wrapper | `'round'` | `StrokeJoin.Round` | `.lineJoin(.round)` | n/a |
| badgeStrokeWidth | RN-wrapper | `strokeWidth * 0.9` | `strokeWidth * 0.9` | `strokeWidth * 0.9` | n/a (proportional) |

### LaneShadowLogo

**Source files read:**
- LaneShadow: `react-native/components/auth/lane-shadow-logo.tsx`
- Framework: `node_modules/react-native-svg/lib/commonjs/elements/Circle.js`, `Path.js`

**Layout — sizing:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| containerSize | RN-wrapper | `size` prop (variable) | `Modifier.size(size.dp)` | `.frame(width: size, height: size)` | n/a (caller-provided) |
| strokeWidth | RN-wrapper | `Math.max(2, Math.round(semantic.space.sm / 3))` | `max(2.dp, (space.sm / 3).dp.round())` | `max(2, (space.sm / 3).rounded())` | `space.sm / 3` (derived) |
| dotRadius | RN-wrapper | `Math.max(2, Math.round(semantic.space.xs / 1.5))` | `max(2.dp, (space.xs / 1.5).dp.round())` | `max(2, (space.xs / 1.5).rounded())` | `space.xs / 1.5` (derived) |

**Visual — colors:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| foreground | RN-wrapper | `semantic.color.onPrimary.default` | `LaneShadowTheme.colors.onPrimary` | `theme.colors.onPrimary` | `color.onPrimary.default` |

**Visual — path geometry:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| viewBox | RN-wrapper | `0 0 24 24` | `viewBox = "0 0 24 24"` | `CGRect(x: 0, y: 0, width: 24, height: 24)` | n/a (fixed coordinate space) |
| dotPosition1 | RN-wrapper | `cx="8" cy="6"` | `Offset(8f, 6f)` | `CGPoint(x: 8, y: 6)` | n/a (fixed coordinates) |
| dotPosition2 | RN-wrapper | `cx="16" cy="18"` | `Offset(16f, 18f)` | `CGPoint(x: 16, y: 18)` | n/a (fixed coordinates) |
| pathData | RN-wrapper | `M8 6 V12 C8 15 12 15 12 12 V10 C12 7 16 7 16 10 V18` | Path string | `Path { move(to: CGPoint(x: 8, y: 6)); addLine(...) }` | n/a (fixed path) |

### TypingIndicator

**Source files read:**
- LaneShadow: `react-native/components/chat/typing-indicator.tsx`
- Framework: `node_modules/react-native-reanimated/lib/commonjs/Animated.js`

**Layout — sizing (by variant):**

| Size | Source | Dot diameter | Gap | Android | iOS | Token |
|---|---|---|---|---|---|---|
| sm | RN-wrapper | 4 | 3 | `Size(4.dp)`, `Spacer(3.dp)` | `.frame(width: 4, height: 4)`, `Spacer(minLength: 3)` | ESCALATE — propose `animationDotSize.sm = 4`, `animationDotGap.sm = 3` |
| md | RN-wrapper | 6 | 4 | `Size(6.dp)`, `Spacer(4.dp)` | `.frame(width: 6, height: 6)`, `Spacer(minLength: 4)` | ESCALATE — propose `animationDotSize.md = 6`, `animationDotGap.md = 4` |

**Visual — colors:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| dotColor | RN-wrapper | `semantic.color.onSurface.subtle` (fallback: onSurface.default) | `LaneShadowTheme.colors.onSurfaceSubtle` | `theme.colors.onSurfaceSubtle` | `color.onSurface.subtle` |

**Visual — borderRadius:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| dotShape | RN-wrapper | `diameter / 2` (circular) | `CircleShape` | `Circle()` | `radius.full` |

**Animation — timing:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| scaleMin | RN-wrapper | `0.6` | `scaleX = 0.6f, scaleY = 0.6f` | `.scaleEffect(0.6)` | ESCALATE — propose `animationScale.min = 0.6` |
| scaleMax | RN-wrapper | `1.0` | `scaleX = 1f, scaleY = 1f` | `.scaleEffect(1.0)` | ESCALATE — propose `animationScale.max = 1.0` |
| halfPeriodDuration | RN-wrapper | `300 ms` | `300.milliseconds` | `0.3` | ESCALATE — propose `animationDuration.typingHalfPeriod = 300` |
| loopDelay | RN-wrapper | `300 ms` | `300.milliseconds` | `0.3` | ESCALATE — propose `animationDuration.typingLoopDelay = 300` |
| staggerDelay | RN-wrapper | `150 ms` | `150.milliseconds` | `0.15` | ESCALATE — propose `animationDuration.typingStagger = 150` |
| totalCycleDuration | RN-wrapper | `900 ms` (300 + 300 + 300) | `900.milliseconds` | `0.9` | n/a (calculated) |

**Animation — behavior:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| repeatCount | RN-wrapper | `-1` (infinite) | `RepeatMode.Infinite` | `.repeatForever(autoreverses: false)` | n/a |
| reduceMotion | RN-wrapper | static dots at scale 1.0 | check `isReduceMotionEnabled()` | `Environment(\\.isReduceMotionEnabled)` | n/a (system setting) |

**Layout — flex:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| alignItems | RN-wrapper | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.alignment(.center)` | n/a |

**Accessibility:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| accessibilityRole | RN-wrapper | `'progressbar'` | `role = Role.ProgressBar` | `.accessibilityAddTraits(.isUpdating)` | n/a |
| accessibilityLabel | RN-wrapper | `'Assistant is typing'` | `contentDescription = "Assistant is typing"` | `.accessibilityLabel("Assistant is typing")` | n/a |

### IconSymbol (SF Symbol Mapping)

**Source files read:**
- LaneShadow: `react-native/components/ui/icon-symbol.tsx`, `icon-symbol.ios.tsx`
- Framework: `node_modules/@expo/vector-icons/MaterialCommunityIcons.tsx`

**Icon mapping strategy:**

| MaterialCommunityIcons name | SF Symbol | iOS fallback | Notes |
|---|---|---|---|
| motorbike | ESCALATE — propose custom asset `motorbike.fill` | `figure.outdoor.stairs` | No exact SF Symbol match for motorcycle glyph |
| plus-circle | `plus.circle.fill` | n/a | Direct SF Symbol equivalent |
| chevron-left | `chevron.left` | n/a | Direct SF Symbol equivalent |
| chevron-right | `chevron.right` | n/a | Direct SF Symbol equivalent |
| chevron-down | `chevron.down` | n/a | Direct SF Symbol equivalent |
| chevron-up | `chevron.up` | n/a | Direct SF Symbol equivalent |
| menu | `line.3.horizontal` | n/a | Direct SF Symbol equivalent |
| close | `xmark` | n/a | Direct SF Symbol equivalent |
| plus | `plus` | n/a | Direct SF Symbol equivalent |
| minus | `minus` | n/a | Direct SF Symbol equivalent |
| check | `checkmark` | n/a | Direct SF Symbol equivalent |
| heart | `heart` | n/a | Direct SF Symbol equivalent |
| heart-outline | `heart` (outline variant) | n/a | Use `.renderingMode(.template)` for outline |
| star | `star` | n/a | Direct SF Symbol equivalent |
| star-outline | `star` (outline variant) | n/a | Use `.renderingMode(.template)` for outline |
| account | `person.circle` | n/a | Direct SF Symbol equivalent |
| settings | `gearshape` | n/a | Direct SF Symbol equivalent |
| search | `magnifyingglass` | n/a | Direct SF Symbol equivalent |
| filter | `line.3.horizontal.decrease.circle` | n/a | Direct SF Symbol equivalent |
| bell | `bell` | n/a | Direct SF Symbol equivalent |
| bell-outline | `bell` (outline variant) | n/a | Use `.renderingMode(.template)` for outline |
| chat | `bubble.left.and.bubble.right` | n/a | Direct SF Symbol equivalent |
| send | `paperplane` | n/a | Direct SF Symbol equivalent |
| image | `photo` | n/a | Direct SF Symbol equivalent |
| camera | `camera` | n/a | Direct SF Symbol equivalent |
| location | `location` | n/a | Direct SF Symbol equivalent |
| map | `map` | n/a | Direct SF Symbol equivalent |
| navigate | `location.north.fill` | n/a | Direct SF Symbol equivalent |
| bookmark | `bookmark` | n/a | Direct SF Symbol equivalent |
| bookmark-outline | `bookmark` (outline variant) | n/a | Use `.renderingMode(.template)` for outline |
| share | `square.and.arrow.up` | n/a | Direct SF Symbol equivalent |
| copy | `doc.on.doc` | n/a | Direct SF Symbol equivalent |
| trash | `trash` | n/a | Direct SF Symbol equivalent |
| edit | `pencil` | n/a | Direct SF Symbol equivalent |
| delete | `trash` | n/a | Direct SF Symbol equivalent |
| info | `info.circle` | n/a | Direct SF Symbol equivalent |
| warning | `exclamationmark.triangle` | n/a | Direct SF Symbol equivalent |
| error | `xmark.circle` | n/a | Direct SF Symbol equivalent |
| success | `checkmark.circle` | n/a | Direct SF Symbol equivalent |

**Visual — sizing:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| defaultSize | RN-wrapper | `size = 24` (default) | `Modifier.size(24.dp)` | `.font(.system(size: 24))` | ESCALATE — propose `iconSize.default = 24` |
| customSize | RN-wrapper | `size` prop (variable) | `Modifier.size(size.dp)` | `.font(.system(size: size))` | n/a (caller-provided) |

**Visual — colors:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| tintColor | RN-wrapper | `color` prop | `tint = color` | `.foregroundStyle(color)` | n/a (caller-provided) |

**Visual — weight (iOS only):**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| symbolWeight | RN-wrapper | `weight?: SymbolWeight` (unused in RN) | n/a | `.weight(weight)` | n/a (SF Symbol API) |

**Implementation strategy:**

| Platform | Approach | Rationale |
|---|---|---|---|
| iOS | Use `Image(systemName:)` with SF Symbol lookup table | Native iOS iconography, matches system aesthetics |
| iOS (no SF Symbol) | Fall back to custom asset in `Assets.xcassets` | For glyphs without SF Symbol equivalents (e.g., motorbike) |
| Android | Use `Icons.Rounded.*` from Material Design Icons | Consistent with existing Android implementation |
| Web | Use MaterialCommunityIcons | Existing RN web implementation |

## DESIGN NOTES

- Cover baseline states and typography or icon behavior explicitly so later molecules inherit stable primitives.
- Use fixed cameras, fixed coordinates, and deterministic map visuals for screenshot capture.
- Provide a static capture mode for motion-heavy or animated states so screenshot diffs remain deterministic.
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
- UI-010

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
