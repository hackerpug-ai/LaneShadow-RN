# UI-029: Android molecules 8/12 — chat cards & inline blocks: `ErrorMessage`, `RoutingCard`, `ReasoningCard`, `ThinkingCard`, `LocationSearchCard`, `PlanningCard`, `RouteMiniMap`

**Task ID:** UI-029
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

Sprint 2 translates the React Native baseline into native platform components and sandbox scenarios before rider-facing feature sprints resume. This task covers the `molecules` slice for `Android molecules 8/12 — chat cards & inline blocks: ErrorMessage, RoutingCard, ReasoningCard, ThinkingCard, LocationSearchCard, PlanningCard, RouteMiniMap`.

**Objective:** Implement Android molecules 8/12 — chat cards & inline blocks: `ErrorMessage`, `RoutingCard`, `ReasoningCard`, `ThinkingCard`, `LocationSearchCard`, `PlanningCard`, `RouteMiniMap` as Jetpack Compose work with parity to the RN baseline, token-only styling, and sandbox coverage.

**Success State:** A reviewer can open the Android sandbox, browse this task's scenarios, and confirm naming, interface, theme, state, accessibility, and layout parity against RN.

## CRITICAL CONSTRAINTS

### MUST
- Implement the listed components or compositions with parity-aligned naming and interfaces: `ErrorMessage`, `RoutingCard`, `ReasoningCard`, `ThinkingCard`, `LocationSearchCard`, `PlanningCard`, `RouteMiniMap`.
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
**THEN** The listed components or compositions exist in the correct Android Compose directories with parity-aligned names and signatures: `ErrorMessage`, `RoutingCard`, `ReasoningCard`, `ThinkingCard`, `LocationSearchCard`, `PlanningCard`, `RouteMiniMap`.
**Verify:** `printf "%s\n" "`ErrorMessage`, `RoutingCard`, `ReasoningCard`, `ThinkingCard`, `LocationSearchCard`, `PlanningCard`, `RouteMiniMap`"`

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
| TC-1 | AC-1 | The listed components or compositions exist in the correct Android Compose directories with parity-aligned names and signatures: `ErrorMessage`, `RoutingCard`, `ReasoningCard`, `ThinkingCard`, `LocationSearchCard`, `PlanningCard`, `RouteMiniMap`. | `printf "%s\n" "`ErrorMessage`, `RoutingCard`, `ReasoningCard`, `ThinkingCard`, `LocationSearchCard`, `PlanningCard`, `RouteMiniMap`"` |
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
| ErrorMessage | `react-native/components/chat/error-message.tsx` | `node_modules/react-native/Libraries/Components/View/View.js`; `node_modules/react-native-paper/src/components/Typography/Text.tsx` | `android/app/src/main/java/com/laneshadow/ui/molecules/ErrorMessage.kt` | Single variant × all messages (static) |
| RoutingCard | `react-native/components/chat/routing-card.tsx` | `node_modules/react-native-reanimated/src/Animated.js`; `node_modules/react-native/Libraries/Components/View/View.js` | `android/app/src/main/java/com/laneshadow/ui/molecules/RoutingCard.kt` | 5 states (pending/running/completed/failed/cancelled) × phase pills (running) |
| ReasoningCard | `react-native/components/chat/cards/reasoning-card.tsx` | `node_modules/react-native-reanimated/src/Animated.js`; `node_modules/react-native/Libraries/Components/Pressable/Pressable.js` | `android/app/src/main/java/com/laneshadow/ui/molecules/ReasoningCard.kt` | 4 states (collapsed/streaming/expanded/error) × expandable |
| ThinkingCard | `react-native/components/chat/cards/thinking-card.tsx` | `node_modules/react-native-reanimated/src/Animated.js`; `node_modules/react-native/Libraries/Components/Pressable/Pressable.js`; `node_modules/@gorhom/bottom-sheet` | `android/app/src/main/java/com/laneshadow/ui/molecules/ThinkingCard.kt` | 4 states (collapsed/streaming/sheet/failed) × bottom sheet timeline |
| LocationSearchCard | `react-native/components/chat/cards/location-search-card.tsx` | `node_modules/react-native-reanimated/src/Animated.js`; `node_modules/expo-haptics`; `node_modules/react-native/Libraries/Components/Pressable/Pressable.js` | `android/app/src/main/java/com/laneshadow/ui/molecules/LocationSearchCard.kt` | 3 states (running/complete/failed) × place result rows |
| PlanningCard | `react-native/components/chat/cards/planning-card.tsx` | `node_modules/react-native-reanimated/src/Animated.js`; `node_modules/react-native/Libraries/Components/View/View.js` | `android/app/src/main/java/com/laneshadow/ui/molecules/PlanningCard.kt` | 3 states (streaming/complete/failed) × static display |
| RouteMiniMap | `react-native/components/chat/cards/route-mini-map.tsx` | `node_modules/@rnmapbox/maps/src/components/MapView.js`; `node_modules/@rnmapbox/maps/src/components/Camera.js`; `node_modules/@rnmapbox/maps/src/components/ShapeSource.js`; `node_modules/@rnmapbox/maps/src/components/LineLayer.js` | `android/app/src/main/java/com/laneshadow/ui/molecules/RouteMiniMap.kt` | Single variant (read-only map) × light/dark theme |

## STYLE PROPERTIES MATRIX

> Exhaustive enumeration of every style property from both sources per `08f-translation-protocol.md`. Columns: Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping. `ESCALATE` = no token covers the value — add a proposed token to DECISIONS.md before implementing.
>
> **Token reference** (from `tokens/semantic/semantic.tokens.json`): space xs=4 sm=8 md=12 lg=16 xl=24 2xl=32 3xl=48 4xl=64; radius none=0 sm=4 md=8 lg=16 xl=24 2xl=32 full=9999; elevation[2] shadowOffset=0/2 shadowOpacity=0.05 shadowRadius=4 androidElevation=2. **Paper labelLarge**: fontFamily=sans-serif-medium, fontWeight=500, fontSize=14, lineHeight=20, letterSpacing=0.1. **Paper labelSmall**: fontFamily=sans-serif-medium, fontWeight=500, fontSize=11, lineHeight=16, letterSpacing=0.5. **semantic.type.label.md**: fontSize=14, lineHeight=20, fontWeight=500. **semantic.type.body.sm**: fontSize=14, lineHeight=21, fontWeight=400.

### ErrorMessage

**Source files read:**
- LaneShadow: `react-native/components/chat/error-message.tsx`
- Framework: `node_modules/react-native/Libraries/Components/View/View.js`, `node_modules/react-native-paper/src/components/Typography/Text.tsx`

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | alignSelf | RN-wrapper | `'flex-start'` | `Modifier.align(Alignment.Start)` | `.frame(maxWidth: .infinity, alignment: .leading)` | n/a |
| Layout | maxWidth | RN-wrapper | `'80%'` | `Modifier.fillMaxWidth(0.8f)` | `.frame(maxWidth: .infinity)` then padding | n/a |
| Layout | borderRadius | RN-wrapper | `semantic.radius.lg` = 16 | `RoundedCornerShape(16.dp)` | `RoundedRectangle(cornerRadius: 16)` | `radius.lg` |
| Layout | borderWidth | RN-wrapper | `1` | `Modifier.border(1.dp, ...)` | `.overlay(RoundedRectangle(...).stroke(..., lineWidth: 1))` | ESCALATE — propose `borderWidth.thin = 1` |
| Layout | padding | RN-wrapper | `semantic.space.md` = 12 | `Modifier.padding(12.dp)` | `.padding(12)` | `space.md` |
| Layout | marginVertical | RN-wrapper | hardcoded `4` | `Modifier.padding(vertical = 4.dp)` | `.padding(.vertical, 4)` | `space.xs` ✓ |
| Visual | backgroundColor | RN-wrapper | `semantic.color.surfaceVariant.default` | `LaneShadowTheme.colors.surfaceVariant` | `theme.colors.surfaceVariant` | `color.surfaceVariant.default` |
| Visual | borderColor | RN-wrapper | `semantic.color.warning.default` | `LaneShadowTheme.colors.warning` | `theme.colors.warning` | `color.warning.default` |
| Typography | variant | RN-wrapper | `bodyMedium` (Paper) | `MaterialTheme.typography.bodyMedium` | `.font(.system(size: 14, weight: .regular))` | `type.body.md` |
| Typography | color | RN-wrapper | `semantic.color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |
| Interaction | accessibilityLabel | RN-wrapper | prop passed through | `Modifier.semantics { label = ... }` | `.accessibilityLabel(...)` | n/a |
| Interaction | testID | RN-wrapper | prop `testID` | `Modifier.testTag(testID)` | `.accessibilityIdentifier(testID)` | n/a |

---

### RoutingCard

**Source files read:**
- LaneShadow: `react-native/components/chat/routing-card.tsx`
- Framework: `node_modules/react-native-reanimated/src/Animated.js`, `node_modules/react-native/Libraries/Components/View/View.js`

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout (container) | minWidth | RN-wrapper | `'90%'` | `Modifier.fillMaxWidth(0.9f)` | `.frame(maxWidth: .infinity)` with padding | n/a |
| Layout (card) | backgroundColor | RN-wrapper (all states) | `semantic.color.surfaceVariant.default` | `LaneShadowTheme.colors.surfaceVariant` | `theme.colors.surfaceVariant` | `color.surfaceVariant.default` |
| Layout (card) | borderRadius | RN-wrapper (all states) | `semantic.radius.md` = 8 | `RoundedCornerShape(8.dp)` | `RoundedRectangle(cornerRadius: 8)` | `radius.md` |
| Layout (card) | padding | RN-wrapper (all states) | `semantic.space.md` = 12 | `Modifier.padding(12.dp)` | `.padding(12)` | `space.md` |
| Layout (card) | gap | RN-wrapper (running) | `semantic.space.sm` = 8 | `Arrangement.spacedBy(8.dp)` | `VStack(spacing: 8)` | `space.sm` |
| Layout (pillRow) | flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| Layout (pillRow) | flexWrap | RN-wrapper | `'wrap'` | `Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth())` | `FlowLayout` (custom) | n/a |
| Layout (pillRow) | gap | RN-wrapper | hardcoded `8` | `Arrangement.spacedBy(8.dp)` | `HStack(spacing: 8)` | `space.sm` ✓ |
| Layout (PhasePill) | borderRadius | RN-wrapper | `semantic.radius.full` = 9999 | `CircleShape` | `Capsule()` | `radius.full` |
| Layout (PhasePill) | paddingHorizontal | RN-wrapper | `semantic.space.sm` = 8 | `Modifier.padding(horizontal = 8.dp)` | `.padding(.horizontal, 8)` | `space.sm` |
| Layout (PhasePill) | paddingVertical | RN-wrapper | `semantic.space.xs` = 4 | `Modifier.padding(vertical = 4.dp)` | `.padding(.vertical, 4)` | `space.xs` |
| Visual (PhasePill) | backgroundColor (active) | RN-wrapper | `semantic.color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |
| Visual (PhasePill) | backgroundColor (inactive) | RN-wrapper | `semantic.color.surfaceVariant.default` | `LaneShadowTheme.colors.surfaceVariant` | `theme.colors.surfaceVariant` | `color.surfaceVariant.default` |
| Typography (PhasePill) | style | RN-wrapper | `semantic.type.label.sm` | `MaterialTheme.typography.labelSmall` | `.font(.system(size: 11, weight: .medium))` | `type.label.sm` |
| Typography (PhasePill) | color (active) | RN-wrapper | `semantic.color.onPrimary.default` | `LaneShadowTheme.colors.onPrimary` | `theme.colors.onPrimary` | `color.onPrimary.default` |
| Typography (PhasePill) | color (inactive) | RN-wrapper | `semantic.color.onSurface.muted` | `LaneShadowTheme.colors.onSurface.copy(alpha = 0.6f)` | `theme.colors.onSurface.opacity(0.6)` | `color.onSurface.muted` |
| Typography (status) | style | RN-wrapper | `semantic.type.body.sm` | `MaterialTheme.typography.bodySmall` | `.font(.system(size: 14, weight: .regular))` | `type.body.sm` |
| Typography (status) | color | RN-wrapper | `semantic.color.onSurface.muted` | `LaneShadowTheme.colors.onSurface.copy(alpha = 0.6f)` | `theme.colors.onSurface.opacity(0.6)` | `color.onSurface.muted` |
| Visual (FailedCard) | backgroundColor | RN-wrapper | `${semantic.color.danger.default}1A` (hex opacity ~10%) | `LaneShadowTheme.colors.danger.copy(alpha = 0.1f)` | `theme.colors.danger.opacity(0.1)` | `color.danger.default` + alpha |
| Visual (FailedCard) | borderColor | RN-wrapper | `${semantic.color.danger.default}4D` (hex opacity ~30%) | `LaneShadowTheme.colors.danger.copy(alpha = 0.3f)` | `theme.colors.danger.opacity(0.3)` | `color.danger.default` + alpha |
| Visual (FailedCard) | borderWidth | RN-wrapper | `1` | `Modifier.border(1.dp, ...)` | `.overlay(RoundedRectangle(...).stroke(..., lineWidth: 1))` | ESCALATE — `borderWidth.thin` |
| Animation (PhasePill) | scale (active) | RN-wrapper | `withTiming(1.05)` + `withRepeat` | `Modifier.graphicsLayer { scaleX = if (active) 1.05f else 1f; scaleY = ... }` + `animateFloatAsState` | `.scaleEffect(active ? 1.05 : 1.0).animation(.easeInOut(duration: 0.6).repeatForever(autoreverses: true))` | n/a |
| Animation (PhasePill) | duration | RN-wrapper | `600ms` | `animationSpec = spring(dampingRatio = Spring.DampingRatioMediumBouncy)` | `.easeInOut(duration: 0.6)` | n/a |
| Animation (PhasePill) | reduceMotion | RN-wrapper | `AccessibilityInfo.isReduceMotionEnabled()` | `LocalAccessibilityManager.accessibilityState.isReduceMotionEnabled` | `Environment(\\.accessibilityReduceMotion).boolValue` | n/a |
| Interaction | accessibilityLiveRegion | RN-wrapper | `'polite'` | `Modifier.semantics { liveRegion = LiveRegionMode.Polite }` | `.accessibilityLiveRegion(.polite)` | n/a |
| Interaction | accessibilityLabel | RN-wrapper | dynamic based on state | `Modifier.semantics { label = ... }` | `.accessibilityLabel(...)` | n/a |

---

### ReasoningCard

**Source files read:**
- LaneShadow: `react-native/components/chat/cards/reasoning-card.tsx`
- Framework: `node_modules/react-native-reanimated/src/Animated.js`, `node_modules/react-native/Libraries/Components/Pressable/Pressable.js`

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout (container) | minWidth | RN-wrapper | `'90%'` | `Modifier.fillMaxWidth(0.9f)` | `.frame(maxWidth: .infinity)` with padding | n/a |
| Layout (card) | backgroundColor | RN-wrapper | `semantic.color.surfaceVariant.default` | `LaneShadowTheme.colors.surfaceVariant` | `theme.colors.surfaceVariant` | `color.surfaceVariant.default` |
| Layout (card) | borderRadius | RN-wrapper | `semantic.radius.md` = 8 | `RoundedCornerShape(8.dp)` | `RoundedRectangle(cornerRadius: 8)` | `radius.md` |
| Layout (card) | paddingHorizontal | RN-wrapper | `semantic.space.md` = 12 | `Modifier.padding(horizontal = 12.dp)` | `.padding(.horizontal, 12)` | `space.md` |
| Layout (card) | paddingVertical | RN-wrapper | `semantic.space.sm` = 8 | `Modifier.padding(vertical = 8.dp)` | `.padding(.vertical, 8)` | `space.sm` |
| Layout (card) | minHeight | RN-wrapper | hardcoded `44` | `Modifier.minHeight(44.dp)` | `.frame(minHeight: 44)` | ESCALATE — propose `size.touchTarget = 44` |
| Layout (headerRow) | flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| Layout (headerRow) | gap | RN-wrapper | `semantic.space.sm` = 8 | `Arrangement.spacedBy(8.dp)` | `HStack(spacing: 8)` | `space.sm` |
| Layout (bodyContainer) | paddingTop | RN-wrapper | `semantic.space.sm` = 8 | `Modifier.padding(top = 8.dp)` | `.padding(.top, 8)` | `space.sm` |
| Layout (bodyContainer) | marginTop | RN-wrapper | `semantic.space.sm` = 8 | `Modifier.padding(top = 8.dp)` (duplicate) | `.padding(.top, 8)` | `space.sm` |
| Visual (bodyContainer) | borderTopWidth | RN-wrapper | `StyleSheet.hairlineWidth` (~1px) | `Modifier.drawBehind { drawLine(...) }` | `.overlay(Rectangle().stroke(..., lineWidth: 0.5))` | ESCALATE — `borderWidth.hairline` |
| Visual (bodyContainer) | borderTopColor | RN-wrapper | `${mutedColor}33` (20% alpha) | `LaneShadowTheme.colors.onSurface.copy(alpha = 0.2f)` | `theme.colors.onSurface.opacity(0.2)` | `color.onSurface.default` + alpha |
| Visual (streamingOverlay) | backgroundColor | RN-wrapper | `${semantic.color.primary.default}14` (~8% alpha) | `LaneShadowTheme.colors.primary.copy(alpha = 0.08f)` | `theme.colors.primary.opacity(0.08)` | `color.primary.default` + alpha |
| Visual (streamingOverlay) | position | RN-wrapper | `'absolute'` + `StyleSheet.absoluteFillObject` | `Modifier.matchParentSize()` in `Box` | `.frame(maxWidth: .infinity, maxHeight: .infinity).offset(x: 0, y: 0)` | n/a |
| Typography (label) | style | RN-wrapper | `semantic.type.label.md` | `MaterialTheme.typography.labelMedium` | `.font(.system(size: 14, weight: .medium))` | `type.label.md` |
| Typography (label) | color | RN-wrapper | `semantic.color.onSurface.muted` | `LaneShadowTheme.colors.onSurface.copy(alpha = 0.6f)` | `theme.colors.onSurface.opacity(0.6)` | `color.onSurface.muted` |
| Typography (body) | style | RN-wrapper | `semantic.type.body.sm` | `MaterialTheme.typography.bodySmall` | `.font(.system(size: 14, weight: .regular))` | `type.body.sm` |
| Typography (body) | color | RN-wrapper | `semantic.color.onSurface.muted` | `LaneShadowTheme.colors.onSurface.copy(alpha = 0.6f)` | `theme.colors.onSurface.opacity(0.6)` | `color.onSurface.muted` |
| Icon (glyph) | size | RN-wrapper | `16` | `16.dp` | `16` | n/a |
| Icon (glyph) | color | RN-wrapper | `semantic.color.onSurface.muted` | `LaneShadowTheme.colors.onSurface.copy(alpha = 0.6f)` | `theme.colors.onSurface.opacity(0.6)` | `color.onSurface.muted` |
| Icon (chevron) | name | RN-wrapper | `'chevron-up'` / `'chevron-down'` | `Icons.Default.ChevronUp` / `Icons.Default.ChevronDown` | same | n/a |
| Animation (pulsingDot) | size | RN-wrapper | `6×6` | `Modifier.size(6.dp)` | `.frame(width: 6, height: 6)` | n/a |
| Animation (pulsingDot) | borderRadius | RN-wrapper | `3` | `CircleShape` | `Circle()` | n/a |
| Animation (pulsingDot) | backgroundColor | RN-wrapper | `semantic.color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |
| Animation (pulsingDot) | opacity (reducedMotion) | RN-wrapper | `0.7` | `alpha = 0.7f` | `.opacity(0.7)` | ESCALATE — `opacity.reducedMotion = 0.7` |
| Animation (pulsingDot) | opacity (animating) | RN-wrapper | `0.4 ↔ 1.0` | `alpha = animateFloatAsState(...)` | `.opacity(...).animation(.easeInOut(duration: 0.6).repeatForever(autoreverses: true))` | ESCALATE — `opacity.pulseMin = 0.4, pulseMax = 1.0` |
| Animation (pulsingDot) | duration | RN-wrapper | `600ms` | `animationSpec = tween(600)` | `.easeInOut(duration: 0.6)` | n/a |
| Interaction (Pressable) | android_ripple | RN-wrapper | `color: rippleColor` | `Modifier.clickable(..., indicationRipple = true)` | `.buttonStyle(...)` (native) | n/a |
| Interaction (Pressable) | rippleColor | RN-wrapper | `${mutedColor}14` (~8% alpha) | `LocalIndication.current.ripple(alpha = 0.08f)` | n/a | `color.onSurface.default` + alpha |
| Interaction (Pressable) | opacity (pressed) | RN-wrapper | `pressed ? 0.7 : 1` | `Modifier.alpha(if (pressed) 0.7f else 1f)` (from interactionSource) | `.opacity(pressed ? 0.7 : 1.0)` | ESCALATE — `opacity.pressed = 0.7` |
| Interaction | accessibilityRole | RN-wrapper | `'button'` | `Modifier.semantics { role = Role.Button }` | `.accessibilityAddTraits(.isButton)` | n/a |
| Interaction | accessibilityState | RN-wrapper | `{ expanded, busy: isStreaming }` | `Modifier.semantics { expanded = expanded; state = ... }` | `.accessibilityState(.expanded(expanded)).accessibilityState(.isBusy(isStreaming))` | n/a |
| Interaction | accessibilityLiveRegion | RN-wrapper | `isStreaming ? 'polite' : 'none'` | `Modifier.semantics { liveRegion = if (isStreaming) LiveRegionMode.Polite else null }` | `.accessibilityLiveRegion(isStreaming ? .polite : .none)` | n/a |

---

### ThinkingCard

**Source files read:**
- LaneShadow: `react-native/components/chat/cards/thinking-card.tsx`
- Framework: `node_modules/react-native-reanimated/src/Animated.js`, `node_modules/react-native/Libraries/Pressable/Pressable.js`, `node_modules/@gorhom/bottom-sheet`

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout (card) | Same as ReasoningCard | — | — | — | — | — |
| Layout (sheetHeader) | gap | RN-wrapper | `semantic.space.sm` = 8 | `Arrangement.spacedBy(8.dp)` | `VStack(spacing: 8)` | `space.sm` |
| Layout (durationBadge) | backgroundColor | RN-wrapper | `semantic.color.surfaceVariant.default` | `LaneShadowTheme.colors.surfaceVariant` | `theme.colors.surfaceVariant` | `color.surfaceVariant.default` |
| Layout (durationBadge) | borderRadius | RN-wrapper | `semantic.radius.sm` = 4 | `RoundedCornerShape(4.dp)` | `RoundedRectangle(cornerRadius: 4)` | `radius.sm` |
| Layout (durationBadge) | paddingHorizontal | RN-wrapper | `semantic.space.sm` = 8 | `Modifier.padding(horizontal = 8.dp)` | `.padding(.horizontal, 8)` | `space.sm` |
| Layout (durationBadge) | paddingVertical | RN-wrapper | `semantic.space.xs` = 4 | `Modifier.padding(vertical = 4.dp)` | `.padding(.vertical, 4)` | `space.xs` |
| Layout (timelineContent) | paddingTop | RN-wrapper | hardcoded `12` | `Modifier.padding(top = 12.dp)` | `.padding(.top, 12)` | `space.md` ✓ |
| Layout (timelineContent) | gap | RN-wrapper | `semantic.space.lg` = 16 | `Arrangement.spacedBy(16.dp)` | `VStack(spacing: 16)` | `space.lg` |
| Layout (stepRow) | gap | RN-wrapper | `semantic.space.md` = 12 | `Arrangement.spacedBy(12.dp)` | `HStack(spacing: 12)` | `space.md` |
| Layout (iconColumn) | width | RN-wrapper | hardcoded `24` | `Modifier.width(24.dp)` | `.frame(width: 24)` | ESCALATE — propose `space.iconColumn = 24` |
| Layout (timelineConnector) | width | RN-wrapper | `1` | `Modifier.width(1.dp)` | `.frame(width: 1)` | ESCALATE — `borderWidth.thin = 1` |
| Layout (timelineConnector) | backgroundColor | RN-wrapper | `${mutedColor}33` (20% alpha) | `LaneShadowTheme.colors.onSurface.copy(alpha = 0.2f)` | `theme.colors.onSurface.opacity(0.2)` | `color.onSurface.default` + alpha |
| Layout (timelineConnector) | marginTop | RN-wrapper | hardcoded `4` | `Modifier.padding(top = 4.dp)` | `.padding(.top, 4)` | `space.xs` ✓ |
| Layout (timelineConnector) | minHeight | RN-wrapper | hardcoded `20` | `Modifier.minHeight(20.dp)` | `.frame(minHeight: 20)` | ESCALATE — propose `space.connectorMin = 20` |
| Layout (contentColumn) | gap | RN-wrapper | `semantic.space.xs` = 4 | `Arrangement.spacedBy(4.dp)` | `VStack(spacing: 4)` | `space.xs` |
| Icon (step) | size | RN-wrapper | `20` | `20.dp` | `20` | n/a |
| Icon (step) | color (thinking) | RN-wrapper | `semantic.color.onSurface.muted` | `LaneShadowTheme.colors.onSurface.copy(alpha = 0.6f)` | `theme.colors.onSurface.opacity(0.6)` | `color.onSurface.muted` |
| Icon (step) | color (tool_start) | RN-wrapper | `semantic.color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |
| Icon (step) | color (tool_finish) | RN-wrapper | `semantic.color.success.default` | `LaneShadowTheme.colors.success` | `theme.colors.success` | `color.success.default` |
| Typography (summary) | style | RN-wrapper | `semantic.type.body.md` | `MaterialTheme.typography.bodyMedium` | `.font(.system(size: 14, weight: .regular))` | `type.body.md` |
| Typography (summary) | color | RN-wrapper | `semantic.color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |
| Typography (detail) | style | RN-wrapper | `semantic.type.body.sm` | `MaterialTheme.typography.bodySmall` | `.font(.system(size: 14, weight: .regular))` | `type.body.sm` |
| Typography (detail) | color | RN-wrapper | `semantic.color.onSurface.muted` | `LaneShadowTheme.colors.onSurface.copy(alpha = 0.6f)` | `theme.colors.onSurface.opacity(0.6)` | `color.onSurface.muted` |
| Typography (timestamp) | style | RN-wrapper | `semantic.type.label.sm` | `MaterialTheme.typography.labelSmall` | `.font(.system(size: 11, weight: .medium))` | `type.label.sm` |
| Typography (timestamp) | color | RN-wrapper | `semantic.color.onSurface.muted` | `LaneShadowTheme.colors.onSurface.copy(alpha = 0.6f)` | `theme.colors.onSurface.opacity(0.6)` | `color.onSurface.muted` |

---

### LocationSearchCard

**Source files read:**
- LaneShadow: `react-native/components/chat/cards/location-search-card.tsx`
- Framework: `node_modules/react-native-reanimated/src/Animated.js`, `node_modules/expo-haptics`, `node_modules/react-native/Libraries/Components/Pressable/Pressable.js`

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout (card) | minWidth | RN-wrapper | `'90%'` | `Modifier.fillMaxWidth(0.9f)` | `.frame(maxWidth: .infinity)` with padding | n/a |
| Layout (card) | backgroundColor | RN-wrapper (all states) | `semantic.color.surfaceVariant.default` | `LaneShadowTheme.colors.surfaceVariant` | `theme.colors.surfaceVariant` | `color.surfaceVariant.default` |
| Layout (card) | borderRadius | RN-wrapper (all states) | `semantic.radius.md` = 8 | `RoundedCornerShape(8.dp)` | `RoundedRectangle(cornerRadius: 8)` | `radius.md` |
| Layout (card) | padding | RN-wrapper (running/failed) | `semantic.space.md` = 12 | `Modifier.padding(12.dp)` | `.padding(12)` | `space.md` |
| Layout (card) | overflow | RN-wrapper (complete) | `'hidden'` | `Modifier.clip(shape)` | `.clipped()` | n/a |
| Layout (runningRow) | flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| Layout (runningRow) | gap | RN-wrapper | (none — uses marginLeft) | `Arrangement.spacedBy(8.dp)` | `HStack(spacing: 8)` | `space.sm` ✓ |
| Layout (pulsingDot) | size | RN-wrapper | `8×8` | `Modifier.size(8.dp)` | `.frame(width: 8, height: 8)` | n/a |
| Layout (pulsingDot) | borderRadius | RN-wrapper | `4` | `CircleShape` | `Circle()` | n/a |
| Layout (resultRow) | gap | RN-wrapper | hardcoded `10` | `Arrangement.spacedBy(10.dp)` | `HStack(spacing: 10)` | ESCALATE — propose `space.resultRow = 10` |
| Layout (resultRow) | paddingVertical | RN-wrapper | `semantic.space.sm` = 8 | `Modifier.padding(vertical = 8.dp)` | `.padding(.vertical, 8)` | `space.sm` |
| Layout (resultRow) | paddingHorizontal | RN-wrapper | `semantic.space.sm` = 8 | `Modifier.padding(horizontal = 8.dp)` | `.padding(.horizontal, 8)` | `space.sm` |
| Layout (indexCircle) | size | RN-wrapper | `28×28` | `Modifier.size(28.dp)` | `.frame(width: 28, height: 28)` | ESCALATE — propose `space.indexCircle = 28` |
| Layout (indexCircle) | borderRadius | RN-wrapper | `14` (half of 28) | `CircleShape` | `Circle()` | n/a |
| Layout (indexCircle) | backgroundColor (selected) | RN-wrapper | `semantic.color.info.default` | `LaneShadowTheme.colors.info` | `theme.colors.info` | `color.info.default` |
| Layout (indexCircle) | backgroundColor (unselected) | RN-wrapper | `${semantic.color.info.default}26` (~15% alpha) | `LaneShadowTheme.colors.info.copy(alpha = 0.15f)` | `theme.colors.info.opacity(0.15)` | `color.info.default` + alpha |
| Layout (resultContent) | gap | RN-wrapper | hardcoded `2` | `Arrangement.spacedBy(2.dp)` | `VStack(spacing: 2)` | ESCALATE — propose `space.textRow = 2` |
| Layout (nameRow) | gap | RN-wrapper | hardcoded `6` | `Arrangement.spacedBy(6.dp)` | `HStack(spacing: 6)` | ESCALATE — `space.xs = 4`, closest |
| Layout (rightInfo) | gap | RN-wrapper | hardcoded `2` | `Arrangement.spacedBy(2.dp)` | `VStack(spacing: 2)` | ESCALATE — `space.textRow = 2` |
| Layout (rightInfo) | minWidth | RN-wrapper | hardcoded `50` | `Modifier.minWidth(50.dp)` | `.frame(minWidth: 50)` | ESCALATE — propose `space.rightInfoMin = 50` |
| Typography (name) | style | RN-wrapper | `semantic.type.body.md` | `MaterialTheme.typography.bodyMedium` | `.font(.system(size: 14, weight: .regular))` | `type.body.md` |
| Typography (name) | fontWeight | RN-wrapper | `'600'` | `FontWeight.SemiBold` | `.semibold` | ESCALATE — propose `fontWeight.semibold = 600` |
| Typography (address) | style | RN-wrapper | `semantic.type.body.sm` | `MaterialTheme.typography.bodySmall` | `.font(.system(size: 14, weight: .regular))` | `type.body.sm` |
| Typography (address) | color | RN-wrapper | `semantic.color.muted.default` | `LaneShadowTheme.colors.muted` | `theme.colors.muted` | `color.muted.default` |
| Typography (index) | style | RN-wrapper | `semantic.type.label.sm` | `MaterialTheme.typography.labelSmall` | `.font(.system(size: 11, weight: .medium))` | `type.label.sm` |
| Typography (index) | fontWeight | RN-wrapper | `'700'` | `FontWeight.Bold` | `.bold` | ESCALATE — `fontWeight.bold = 700` |
| Interaction (Pressable) | haptic | RN-wrapper | `Haptics.impactAsync(Light)` | `LocalHapticFeedback.performHapticFeedback(HapticFeedbackType.LongPress)` | `UIImpactFeedbackGenerator.light.impactOccurred()` | n/a |

---

### PlanningCard

**Source files read:**
- LaneShadow: `react-native/components/chat/cards/planning-card.tsx`
- Framework: `node_modules/react-native-reanimated/src/Animated.js`, `node_modules/react-native/Libraries/Components/View/View.js`

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | Same as ReasoningCard (container, card, headerRow, streamingOverlay, pulsingDot) | — | — | — | — | — |
| Icon (glyph) | name (complete) | RN-wrapper | `'check-circle-outline'` | `Icons.Default.CheckCircle` (Material) | `checkmark.circle` (SF Symbols) | n/a |
| Icon (glyph) | name (failed) | RN-wrapper | `'close-circle-outline'` | `Icons.Default.CloseCircle` (Material) | `xmark.circle` (SF Symbols) | n/a |
| Icon (glyph) | name (streaming) | RN-wrapper | `'map-marker-path'` | Custom icon (draw path + pin) | Custom icon | ESCALATE — custom icon asset |
| Typography (label) | Same as ReasoningCard | — | — | — | — | — |

---

### RouteMiniMap

**Source files read:**
- LaneShadow: `react-native/components/chat/cards/route-mini-map.tsx`
- Framework: `node_modules/@rnmapbox/maps/src/components/MapView.js`, `node_modules/@rnmapbox/maps/src/components/Camera.js`, `node_modules/@rnmapbox/maps/src/components/ShapeSource.js`, `node_modules/@rnmapbox/maps/src/components/LineLayer.js`

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout (container) | height | RN-wrapper | hardcoded `120` | `Modifier.height(120.dp)` | `.frame(height: 120)` | ESCALATE — propose `space.miniMapHeight = 120` |
| Layout (container) | width | RN-wrapper | `'100%'` | `Modifier.fillMaxWidth()` | `.frame(maxWidth: .infinity)` | n/a |
| Layout (container) | borderRadius | RN-wrapper | hardcoded `8` | `Modifier.clip(RoundedCornerShape(8.dp))` | `.clipShape(RoundedRectangle(cornerRadius: 8))` | `radius.md` ✓ |
| Layout (container) | overflow | RN-wrapper | `'hidden'` | `Modifier.clip(shape)` | `.clipped()` | n/a |
| Layout (container) | pointerEvents | RN-wrapper | `'none'` | `Modifier.pointerEvents(PointerEventType.None)` | `.allowsHitTesting(false)` | n/a |
| Map (Camera) | centerCoordinate | RN-wrapper | calculated from bounds | `CameraPosition(bounds.center)` | `MapCamera(center: bounds.center)` | n/a |
| Map (Camera) | zoomLevel | RN-wrapper | `Math.log2(360 / latSpan) - 0.5` | same calculation | same calculation | n/a |
| Map (MapView) | styleURL | RN-wrapper | `MAP_STYLES[dark ? 'dark' : 'light']` | `MapboxMapUtils.getStyleUri(darkMode)` | `MapStyleURL(darkMode: dark)` | n/a |
| Map (MapView) | scrollEnabled | RN-wrapper | `false` | `MapboxMap(scrollEnabled = false, ...)` | same | n/a |
| Map (MapView) | zoomEnabled | RN-wrapper | `false` | same | same | n/a |
| Map (MapView) | rotateEnabled | RN-wrapper | `false` | same | same | n/a |
| Map (MapView) | pitchEnabled | RN-wrapper | `false` | same | same | n/a |
| Map (MapView) | logoEnabled | RN-wrapper | `false` | same | same | n/a |
| Map (MapView) | attributionEnabled | RN-wrapper | `false` | same | same | n/a |
| Map (LineLayer) | lineColor | RN-wrapper | `semantic.color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |
| Map (LineLayer) | lineWidth | RN-wrapper | hardcoded `3` | `lineWidth = 3.0f` | `lineWidth: 3` | ESCALATE — propose `borderWidth.route = 3` |
| Map (LineLayer) | lineOpacity | RN-wrapper | `1.0` | `lineOpacity = 1.0f` | `lineOpacity: 1.0` | n/a |

## DESIGN NOTES

- Preserve RN spacing, composition hierarchy, and edge-case fixtures such as long labels, loading, and error states.
- Use fixed cameras, fixed coordinates, and deterministic map visuals for screenshot capture.
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
