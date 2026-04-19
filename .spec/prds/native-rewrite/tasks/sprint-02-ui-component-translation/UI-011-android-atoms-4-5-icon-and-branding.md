# UI-011: Android atoms 4/5 — icon & branding: `MotorcyclePlusIcon`, `CompassPlusIcon`, `LaneShadowLogo`, `TypingIndicator` (+ resolve `IconSymbol.ios` divergence into shared resource map)

**Task ID:** UI-011
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

Sprint 2 translates the React Native baseline into native platform components and sandbox scenarios before rider-facing feature sprints resume. This task covers the `atoms` slice for `Android atoms 4/5 — icon & branding: MotorcyclePlusIcon, CompassPlusIcon, LaneShadowLogo, TypingIndicator (+ resolve IconSymbol.ios divergence into shared resource map)`.

**Objective:** Implement Android atoms 4/5 — icon & branding: `MotorcyclePlusIcon`, `CompassPlusIcon`, `LaneShadowLogo`, `TypingIndicator` (+ resolve `IconSymbol.ios` divergence into shared resource map) as Jetpack Compose work with parity to the RN baseline, token-only styling, and sandbox coverage.

**Success State:** A reviewer can open the Android sandbox, browse this task's scenarios, and confirm naming, interface, theme, state, accessibility, and layout parity against RN.

## CRITICAL CONSTRAINTS

### MUST
- Implement the listed components or compositions with parity-aligned naming and interfaces: `MotorcyclePlusIcon`, `CompassPlusIcon`, `LaneShadowLogo`, `TypingIndicator` (+ resolve `IconSymbol.ios` divergence into shared resource map).
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
**THEN** The listed components or compositions exist in the correct Android Compose directories with parity-aligned names and signatures: `MotorcyclePlusIcon`, `CompassPlusIcon`, `LaneShadowLogo`, `TypingIndicator` (+ resolve `IconSymbol.ios` divergence into shared resource map).
**Verify:** `printf "%s\n" "`MotorcyclePlusIcon`, `CompassPlusIcon`, `LaneShadowLogo`, `TypingIndicator` (+ resolve `IconSymbol.ios` divergence into shared resource map)"`

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
| TC-1 | AC-1 | The listed components or compositions exist in the correct Android Compose directories with parity-aligned names and signatures: `MotorcyclePlusIcon`, `CompassPlusIcon`, `LaneShadowLogo`, `TypingIndicator` (+ resolve `IconSymbol.ios` divergence into shared resource map). | `printf "%s\n" "`MotorcyclePlusIcon`, `CompassPlusIcon`, `LaneShadowLogo`, `TypingIndicator` (+ resolve `IconSymbol.ios` divergence into shared resource map)"` |
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
| MotorcyclePlusIcon | `react-native/components/ui/motorcycle-plus-icon.tsx` | `node_modules/@expo/vector-icons/MaterialCommunityIcons.js` (glyphMap: motorbike, plus-circle); `node_modules/react-native/Libraries/Components/View/View.js` | `android/app/src/main/java/com/laneshadow/ui/atoms/MotorcyclePlusIcon.kt` | 1 fixed composition (motorbike + plus-circle overlay) × size prop (default=22) × 1 state (static) |
| CompassPlusIcon | `react-native/components/map/compass-plus-icon.tsx` | `node_modules/react-native-svg/lib/commonjs/elements/Circle.js`; `node_modules/react-native-svg/lib/commonjs/elements/Path.js`; `node_modules/react-native-svg/lib/commonjs/elements/G.js`; `node_modules/react-native-svg/lib/commonjs/elements/Line.js` | `android/app/src/main/java/com/laneshadow/ui/atoms/CompassPlusIcon.kt` | 1 fixed composition (compass rose + plus badge) × size prop (default=28) × 1 state (static) |
| LaneShadowLogo | `react-native/components/auth/lane-shadow-logo.tsx` | `node_modules/react-native-svg/lib/commonjs/elements/Circle.js`; `node_modules/react-native-svg/lib/commonjs/elements/Path.js` | `android/app/src/main/java/com/laneshadow/ui/atoms/LaneShadowLogo.kt` | 1 fixed geometry (S-curve route glyph + 2 endpoints) × size prop (required) × 1 state (static) |
| TypingIndicator | `react-native/components/chat/typing-indicator.tsx` | `node_modules/react-native-reanimated/lib/commonjs/animatedApi.js` (withTiming, withDelay, withRepeat, withSequence); `node_modules/react-native/Libraries/Components/AccessibilityInfo/AccessibilityInfo.js` | `android/app/src/main/java/com/laneshadow/ui/atoms/TypingIndicator.kt` | 2 size variants (sm/md) × 2 animation modes (animated/reduced-motion) × 3 dots (staggered 150ms) |
| IconSymbol (Android/Web) | `react-native/components/ui/icon-symbol.tsx` | `node_modules/@expo/vector-icons/MaterialCommunityIcons.js` (full glyphMap); `node_modules/expo-symbols/src/SymbolWeight.ts` (weight type, unused on Android) | `android/app/src/main/java/com/laneshadow/ui/atoms/IconSymbol.kt` | 1 wrapper × dynamic name prop × size prop (default=24) × 1 state (static). Note: iOS uses IconSymbol.ios.tsx (identical implementation) |
| IconSymbol.ios | `react-native/components/ui/icon-symbol.ios.tsx` | `node_modules/@expo/vector-icons/MaterialCommunityIcons.js` (same as Android) | `ios/LaneShadow/Components/Atoms/IconSymbol.swift` | Same as Android. Note: Divergence resolution required — both files currently use MaterialCommunityIcons; no SF Symbols in use yet |

## STYLE PROPERTIES MATRIX

> Exhaustive enumeration of every style property from both sources per `08f-translation-protocol.md`. Columns: Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping. `ESCALATE` = no token covers the value — add a proposed token to DECISIONS.md before implementing.
>
> **Token reference** (from `tokens/semantic/semantic.tokens.json`): space xs=4 sm=8 md=12 lg=16 xl=24 2xl=32 3xl=48 4xl=64; radius none=0 sm=4 md=8 lg=16 xl=24 2xl=32 full=9999; elevation[2] shadowOffset=0/2 shadowOpacity=0.05 shadowRadius=4 androidElevation=2.

### MotorcyclePlusIcon

**Source files read:**
- LaneShadow: `react-native/components/ui/motorcycle-plus-icon.tsx`
- Framework: `node_modules/@expo/vector-icons/MaterialCommunityIcons.js`, `node_modules/react-native/Libraries/Components/View/View.js`

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | size (prop) | RN-wrapper | `size = 22` (default) | `Modifier.size(22.dp)` | `.frame(width: 22, height: 22)` | ESCALATE — propose `iconSize.sm = 22` |
| Layout | container width/height | RN-wrapper | `size` prop | `Modifier.size(size.dp)` | `.frame(width: size, height: size)` | dynamic from prop |
| Layout | overlaySize | RN-wrapper | `Math.round(size * 0.55)` = 12 (when size=22) | `size.dp * 0.55` | `size * 0.55` | ESCALATE — propose `iconSize.overlayMultiplier = 0.55` |
| Layout | overlay bottom offset | RN-wrapper | `-Math.round(overlaySize * 0.2)` = -2 | `Modifier.offset(x = (-overlaySize * 0.2).dp, y = (-overlaySize * 0.2).dp)` | `.offset(x: -overlaySize * 0.2, y: -overlaySize * 0.2)` | ESCALATE — propose `iconSize.overlayOffset = 0.2` |
| Layout | overlay right offset | RN-wrapper | `-Math.round(overlaySize * 0.2)` = -2 | same as bottom | same as bottom | same as above |
| Layout | overlay position | RN-wrapper | `position: 'absolute'` | `Modifier.wrapContentSize(unbounded = true).offset(...)` | `.overlay(alignment: .bottomTrailing)` | n/a |
| Visual | motorbike color | RN-wrapper | `color ?? semantic.color.onSurface.default` | `MaterialTheme.colorScheme.onSurface` | `UIColor.onSurface` | `color.onSurface.default` |
| Visual | plus-circle color | RN-wrapper | `semantic.color.primary.default` | `MaterialTheme.colorScheme.primary` | `UIColor.primary` | `color.primary.default` |
| Icon | motorbike glyph | MaterialCommunityIcons | `name="motorbike"` | `Icons.Rounded.Motorbike` or `ImageVector` resource | `UIImage(named: "motorbike")` | ESCALATE — create icon name mapping table |
| Icon | plus-circle glyph | MaterialCommunityIcons | `name="plus-circle"` | `Icons.Rounded.AddCircle` or `ImageVector` resource | `UIImage(named: "plus_circle")` | ESCALATE — same as above |

### CompassPlusIcon

**Source files read:**
- LaneShadow: `react-native/components/map/compass-plus-icon.tsx`
- Framework: `node_modules/react-native-svg/lib/commonjs/elements/*.js`

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | size (prop) | RN-wrapper | `size = 28` (default) | `Modifier.size(28.dp)` | `.frame(width: 28, height: 28)` | ESCALATE — propose `iconSize.md = 28` |
| Layout | viewBox | RN-wrapper | ``0 0 ${size} ${size}``` | n/a (Compose uses intrinsic sizing) | n/a (SwiftUI uses intrinsic sizing) | n/a |
| Layout | center | RN-wrapper | `size / 2` = 14 | `size / 2` | `size / 2` | calculated |
| Layout | radius | RN-wrapper | `(size - strokeWidth * 2) / 2` | calculated | calculated | calculated |
| Layout | badgeCenterX | RN-wrapper | `center + radius * 0.5` | calculated | calculated | ESCALATE — propose `iconSize.badgeOffset = 0.5` |
| Layout | badgeCenterY | RN-wrapper | `center + radius * 0.5` | calculated | calculated | same as above |
| Layout | badgeRadius | RN-wrapper | `Math.max(6, semantic.space.md) / 2` = 6 | `6.dp` | `6` | `space.md / 2` |
| Visual | strokeWidth | RN-wrapper | `Math.max(1.5, semantic.space.xs / 3)` = 1.5 | `StrokeWidth(1.5.dp)` | `1.5` | ESCALATE — propose `strokeWidth.thin = 1.5` |
| Visual | strokeLinecap | RN-wrapper | `'round'` | `StrokeCap.Round` | `.lineCap(.round)` | n/a |
| Visual | strokeLinejoin | RN-wrapper | `'round'` | `StrokeJoin.Round` | `.lineJoin(.round)` | n/a |
| Visual | compass fill | RN-wrapper | `semantic.color.primary.default` | `MaterialTheme.colorScheme.primary` | `Color.primary` | `color.primary.default` |
| Visual | compass stroke | RN-wrapper | `semantic.color.onPrimary.default` | `MaterialTheme.colorScheme.onPrimary` | `Color.onPrimary` | `color.onPrimary.default` |
| Visual | needle fill | RN-wrapper | `semantic.color.onPrimary.default` | `MaterialTheme.colorScheme.onPrimary` | `Color.onPrimary` | `color.onPrimary.default` |
| Visual | badge fill | RN-wrapper | `semantic.color.onSurface.default` | `MaterialTheme.colorScheme.onSurface` | `Color.onSurface` | `color.onSurface.default` |
| Visual | badge plus stroke | RN-wrapper | `semantic.color.surface.default` | `MaterialTheme.colorScheme.surface` | `Color.surface` | `color.surface.default` |
| Visual | badge plus strokeWidth | RN-wrapper | `strokeWidth * 0.9` = 1.35 | `1.35.dp` | `1.35` | ESCALATE — same as above |
| Path | needlePath | RN-wrapper | `M ${center} ${center - radius * 0.6} L ${center + radius * 0.2} ${center + radius * 0.4} L ${center - radius * 0.2} ${center + radius * 0.4} Z` | Compose Path with same data | SwiftUI Path with same data | n/a |
| Path | tick marks (vertical) | RN-wrapper | 2 Line elements at x1/x2=center | `drawLine()` calls | `Path { addLine(to:) }` | n/a |
| Accessibility | role | RN-wrapper | `role="img"` | `Modifier.semantics { role = Role.Image }` | `.accessibilityAddTraits(.isImage)` | n/a |

### LaneShadowLogo

**Source files read:**
- LaneShadow: `react-native/components/auth/lane-shadow-logo.tsx`
- Framework: `node_modules/react-native-svg/lib/commonjs/elements/Circle.js`, `node_modules/react-native-svg/lib/commonjs/elements/Path.js`

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | size (prop) | RN-wrapper | required prop | `Modifier.size(size.dp)` | `.frame(width: size, height: size)` | dynamic from prop |
| Layout | viewBox | RN-wrapper | `"0 0 24 24"` (fixed) | n/a | n/a | n/a |
| Visual | strokeWidth | RN-wrapper | `Math.max(2, Math.round(semantic.space.sm / 3))` = 3 | `3.dp` | `3` | ESCALATE — `strokeWidth.logo = 3` |
| Visual | dotRadius | RN-wrapper | `Math.max(2, Math.round(semantic.space.xs / 1.5))` = 3 | `3.dp` | `3` | ESCALATE — `iconSize.logoDot = 3` |
| Visual | stroke color | RN-wrapper | `semantic.color.onPrimary.default` | `MaterialTheme.colorScheme.onPrimary` | `Color.onPrimary` | `color.onPrimary.default` |
| Visual | fill color (circles) | RN-wrapper | `semantic.color.onPrimary.default` | same as stroke | same as stroke | same as stroke |
| Visual | strokeLinecap | RN-wrapper | `'round'` | `StrokeCap.Round` | `.lineCap(.round)` | n/a |
| Visual | strokeLinejoin | RN-wrapper | `'round'` | `StrokeJoin.Round` | `.lineJoin(.round)` | n/a |
| Path | S-curve route | RN-wrapper | `M8 6 V12 C8 15 12 15 12 12 V10 C12 7 16 7 16 10 V18` | Compose Path with same data | SwiftUI Path with same data | n/a |
| Path | start dot | RN-wrapper | `<Circle cx="8" cy="6" r={dotRadius} />` | `drawCircle(cx=8.dp, cy=6.dp, radius=dotRadius.dp)` | `Path { addEllipse(in: ...) }` | n/a |
| Path | end dot | RN-wrapper | `<Circle cx="16" cy="18" r={dotRadius} />` | `drawCircle(cx=16.dp, cy=18.dp, radius=dotRadius.dp)` | same as above | n/a |
| Accessibility | role | RN-wrapper | none set | `Modifier.semantics { role = Role.Image }` | `.accessibilityAddTraits(.isImage)` | ESCALATE — add accessibilityLabel "LaneShadow logo" |

### TypingIndicator

**Source files read:**
- LaneShadow: `react-native/components/chat/typing-indicator.tsx`
- Framework: `node_modules/react-native-reanimated/lib/commonjs/animatedApi.js`, `node_modules/react-native/Libraries/Components/AccessibilityInfo/AccessibilityInfo.js`

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | sm diameter | RN-wrapper | `SIZE_CONFIG.sm.diameter` = 4 | `4.dp` | `4` | ESCALATE — propose `animationDotSize.sm = 4` |
| Layout | md diameter | RN-wrapper | `SIZE_CONFIG.md.diameter` = 6 | `6.dp` | `6` | ESCALATE — propose `animationDotSize.md = 6` |
| Layout | sm gap | RN-wrapper | `SIZE_CONFIG.sm.gap` = 3 | `3.dp` | `3` | ESCALATE — propose `animationDotGap.sm = 3` |
| Layout | md gap | RN-wrapper | `SIZE_CONFIG.md.gap` = 4 | `4.dp` | `4` | ESCALATE — propose `animationDotGap.md = 4` |
| Layout | flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| Layout | alignItems | RN-wrapper | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.alignment(.center)` | n/a |
| Visual | color | RN-wrapper | `color ?? semantic.color.onSurface.subtle ?? semantic.color.onSurface.default` | `MaterialTheme.colorScheme.onSurfaceVariant` | `Color.onSurfaceVariant` | `color.onSurface.subtle` |
| Visual | borderRadius | RN-wrapper | `diameter / 2` (makes circle) | `CircleShape` or `Radius(diameter / 2)` | `Capsule()` or `RoundedRectangle(cornerRadius: diameter / 2)` | n/a |
| Animation | duration (half-period) | RN-wrapper | `ANIMATION_DURATION_MS` = 300 | `durationMillis = 300` | `0.3` | ESCALATE — propose `animationDuration.typing = 300` |
| Animation | loop delay | RN-wrapper | `LOOP_DELAY_MS` = 300 | same | same | same as above |
| Animation | scale min | RN-wrapper | `SCALE_MIN` = 0.6 | `0.6f` | `0.6` | ESCALATE — propose `animationScale.typingMin = 0.6` |
| Animation | scale max | RN-wrapper | `SCALE_MAX` = 1.0 | `1.0f` | `1.0` | ESCALATE — propose `animationScale.typingMax = 1.0` |
| Animation | stagger per dot | RN-wrapper | `STAGGER_MS` = 150 | `startDelayMillis = 150` (dot 1), `300` (dot 2) | `.delay(0.15)` (dot 1), `.delay(0.3)` (dot 2) | ESCALATE — propose `animationStagger.typing = 150` |
| Animation | repeat mode | RN-wrapper | `-1` (infinite) | `RepeatMode.Restart` with `repeatable = -1` | `.repeatForever(autoreverses: true)` | n/a |
| Animation | easing | RN-wrapper | `withTiming` (linear) | `Easing.Linear` | `.linear` | n/a |
| Animation | sequence | RN-wrapper | `withSequence(timing(min), timing(max), timing(max))` | `animateTo` with keyframes or `AnimationSpec` | `.animation(.easeInOut(duration: 0.3).repeatForever(autoreverses: true))` | n/a |
| Animation | reduce-motion mode | RN-wrapper | `AccessibilityInfo.isReduceMotionEnabled()` → render static at `SCALE_MAX` | `AnimatedVisibility(visible = !reduceMotion)` | `@Environment(\.accessibilityReduceMotion)` var reduceMotion | n/a |
| Accessibility | role | RN-wrapper | `'progressbar'` | `Modifier.semantics { role = Role.ProgressBar }` | `.accessibilityAddTraits(.updatesFrequently)` | n/a |
| Accessibility | label | RN-wrapper | `'Assistant is typing'` | `contentDescription = "Assistant is typing"` | `.accessibilityLabel("Assistant is typing")` | n/a |
| Test | testID | RN-wrapper | `'typing-indicator'` (container), `'typing-indicator-dot-{0,1,2}'` (dots) | `Modifier.testTag(...)` | `.accessibilityIdentifier(...)` | n/a |

### IconSymbol (Divergence Resolution)

**Source files read:**
- LaneShadow: `react-native/components/ui/icon-symbol.tsx`, `react-native/components/ui/icon-symbol.ios.tsx`
- Framework: `node_modules/@expo/vector-icons/MaterialCommunityIcons.js`, `node_modules/expo-symbols/src/SymbolWeight.ts`

**Finding:** Both `icon-symbol.tsx` and `icon-symbol.ios.tsx` are **identical implementations** using MaterialCommunityIcons. No SF Symbols are in use yet. The `SymbolWeight` type is imported but unused in the props signature (present in function parameters but not applied to any rendering logic).

**Divergence resolution:** Merge into single cross-platform implementation. Document icon name mapping table for MaterialCommunityIcons glyphMap.

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | size (prop) | RN-wrapper | `size = 24` (default) | `Modifier.size(24.dp)` | `.frame(width: 24, height: 24)` | ESCALATE — propose `iconSize.default = 24` |
| Visual | color (prop) | RN-wrapper | required prop | `tint = color` | `.foregroundColor(color)` | dynamic from prop |
| Icon | name (prop) | RN-wrapper | `name: IconName` (keyof MaterialCommunityIcons.glyphMap) | `Icons.Rounded.[name]` or lookup table | `UIImage(named: "[name]")` | ESCALATE — create mapping table |
| Type | IconName | RN-wrapper | `keyof typeof MaterialCommunityIcons.glyphMap` | sealed class or enum of supported names | enum of supported names | n/a |
| Type | SymbolWeight | RN-wrapper | present in params but unused | n/a | n/a | n/a (future: SF Symbols support) |
| Test | testID (prop) | RN-wrapper | optional prop | `Modifier.testTag(testID)` | `.accessibilityIdentifier(testID)` | n/a |
| Style | style (prop) | RN-wrapper | `StyleProp<TextStyle>` | `Modifier` chain | `.modifier(...)` chain | n/a |

**Icon name mapping table (partial — ESCALATE to complete full glyphMap coverage):**

| LaneShadow usage | MaterialCommunityIcons name | Android ImageVector | iOS Asset | Notes |
|---|---|---|---|---|
| menu | `menu` | `Icons.Rounded.Menu` | `menu.svg` or PDF | Hamburger menu |
| close | `close` | `Icons.Rounded.Close` | `close.svg` or PDF | X dismiss |
| chevron-left | `chevron-left` | `Icons.AutoMirrored.Rounded.ArrowBack` | `chevron_left.svg` or PDF | RTL-aware on Android |
| chevron-right | `chevron-right` | `Icons.AutoMirrored.Rounded.ArrowForward` | `chevron_right.svg` or PDF | RTL-aware on Android |
| plus | `plus` | `Icons.Rounded.Add` | `plus.svg` or PDF | Add/create action |
| minus | `minus` | `Icons.Rounded.Remove` | `minus.svg` or PDF | Remove/delete action |
| check | `check` | `Icons.Rounded.Check` | `check.svg` or PDF | Success/complete |
| alert-circle | `alert-circle` | `Icons.Rounded.Error` | `alert_circle.svg` or PDF | Error state |
| information | `information` | `Icons.Rounded.Info` | `information.svg` or PDF | Info/help |
| heart-outline | `heart-outline` | `Icons.Outlined.FavoriteBorder` | `heart_outline.svg` or PDF | Save/favorite (empty) |
| heart | `heart` | `Icons.Rounded.Favorite` | `heart.svg` or PDF | Save/favorite (filled) |
| map-marker | `map-marker` | `Icons.Rounded.Place` | `map_marker.svg` or PDF | Location pin |

## DESIGN NOTES

- Cover baseline states and typography or icon behavior explicitly so later molecules inherit stable primitives.
- Use fixed cameras, fixed coordinates, and deterministic map visuals for screenshot capture.
- Provide a static capture mode for motion-heavy or animated states so screenshot diffs remain deterministic.
- Avoid unstyled Material defaults and route all styling through the documented Compose theme layer.

## VERIFICATION GATES

- pnpm type-check:native
- ./android/gradlew assembleDebug
- Validate sandbox scenarios for this task in the native sandbox host

## DEPENDENCIES

- UI-001
- UI-002
- UI-003
- UI-009

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
