# UI-039: Android organisms 1/7 — chat composition: `ChatInput`, `ChatTranscript`

**Task ID:** UI-039
**Sprint:** Sprint 2 - UI Component Translation and Fidelity Sandbox
**Assigned To:** kotlin-implementer
**Reviewer:** kotlin-reviewer
**Estimate:** 480 min
**Type:** [FEATURE]
**Status:** Planned
**Phase:** Organisms
**Quality Score:** 115/115

---

## BACKGROUND

Sprint 2 translates the React Native baseline into native platform components and sandbox scenarios before rider-facing feature sprints resume. This task covers the `organisms` slice for `Android organisms 1/7 — chat composition: ChatInput, ChatTranscript`.

**Objective:** Implement Android organisms 1/7 — chat composition: `ChatInput`, `ChatTranscript` as Jetpack Compose work with parity to the RN baseline, token-only styling, and sandbox coverage.

**Success State:** A reviewer can open the Android sandbox, browse this task's scenarios, and confirm naming, interface, theme, state, accessibility, and layout parity against RN.

## CRITICAL CONSTRAINTS

### MUST
- Implement the listed components or compositions with parity-aligned naming and interfaces: `ChatInput`, `ChatTranscript`.
- Use only the LaneShadow core theme contract locked by `UI-001`: `tokens/semantic/semantic.tokens.json` as the source of truth, generated `native-theme` outputs as the shared packaging layer, and the platform theme entry points (`LaneShadowTheme` on Android, `.laneShadowTheme()` on iOS) for colors, spacing, typography, radii, elevation, and state styling.
- Register sandbox scenarios for default, interactive, and edge-case states with RN reference labels.
- Use deterministic composition fixtures so complex sheets, maps, chat, and list layouts are diffable.

### NEVER
- Add unrelated feature wiring or backend dependencies to satisfy sandbox rendering.
- Introduce hardcoded UI primitives or platform-only naming drift.

### STRICTLY
- Preserve light and dark parity, accessibility labels, and deterministic fixtures for every scenario.

## DELIVERABLES

- android/app/src/main/java/com/laneshadow/ui/organisms/**
- android/app/src/debug/java/com/laneshadow/sandbox/stories/OrganismsStories.kt — story set aggregated into AppStories.all
- android/app/src/test/java/com/laneshadow/**
- android/app/src/androidTest/java/com/laneshadow/**

## ACCEPTANCE CRITERIA

### AC-1
**GIVEN** The RN baseline and atomic parity contract define the expected components and interfaces.
**WHEN** This task is implemented.
**THEN** The listed components or compositions exist in the correct Android Compose directories with parity-aligned names and signatures: `ChatInput`, `ChatTranscript`.
**Verify:** `printf "%s\n" "`ChatInput`, `ChatTranscript`"`

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
**GIVEN** native-sandbox is installed and the DEBUG variant is running.
**WHEN** `make android_sandbox` launches the sandbox (sends intent extra `com.laneshadow.OPEN_SANDBOX=true` to MainActivity).
**THEN** every component listed in DELIVERABLES has at least one `Story(id = "<tier>.<component>.<state>", tier = ComponentTier.<Tier>, component = "<Name>", name = "<State>", summary = "<rn-reference-path>") { <Composable usage> }` registered in `AppStories.all` and renders in the story-tree drawer under its tier, wrapped by `themedPreview { content -> LaneShadowTheme { content() } }`.

**Launch:** `make android_sandbox` (canonical). Secondary: long-press app root (debug gesture) or `adb shell am start -a android.intent.action.VIEW -d "app-sandbox://sandbox"`.

## TEST CRITERIA

| ID | Maps To | Boolean Statement | Verify |
|---|---|---|---|
| TC-1 | AC-1 | The listed components or compositions exist in the correct Android Compose directories with parity-aligned names and signatures: `ChatInput`, `ChatTranscript`. | `printf "%s\n" "`ChatInput`, `ChatTranscript`"` |
| TC-2 | AC-2 | All visuals use the LaneShadow core theme contract from `UI-001` and render correctly in both color modes without hardcoded UI primitives. | `rg -n "Token consumption\|light and dark" .spec/prds/native-rewrite/08d-component-parity-spec.md .spec/prds/native-rewrite/08-design-system.md` |
| TC-3 | AC-3 | Each listed component has deterministic sandbox coverage with RN reference labels and explicit state variants where applicable. | `rg -n "RN reference\|scenario\|interactive states" .spec/prds/native-rewrite/tasks/sprint-02-ui-component-translation/SPRINT.md` |
| TC-4 | AC-4 | Accessibility labels, touch targets, keyboard or safe-area handling, and motion or state parity behave correctly for this component family. | `rg -n "Accessibility\|Keyboard handling\|RTL support\|Animation parity\|State parity" .spec/prds/native-rewrite/08d-component-parity-spec.md` |
| TC-5 | AC-5 | The composition renders using only previously defined platform components, deterministic fixtures, and no backend or auth dependencies. | `rg -n "deterministic\|fixtures\|no auth\|no backend" .spec/prds/native-rewrite/tasks/sprint-02-ui-component-translation/SPRINT.md` |
| TC-6 | ALL | Repo validation gates remain green for the touched workspace when this task is complete. | `pnpm type-check:native && ./android/gradlew assembleDebug` |

## READING LIST

1. `.spec/prds/native-rewrite/README.md`
2. `.spec/prds/native-rewrite/tasks/sprint-02-ui-component-translation/SPRINT.md`
3. `.spec/prds/native-rewrite/08a-atomic-component-catalog.md`
4. `.spec/prds/native-rewrite/08d-component-parity-spec.md`
5. `RULES.md`
6. `.spec/prds/native-rewrite/08b-android-component-map.md`

## GUARDRAILS

### WRITE-ALLOWED
- android/app/src/main/java/com/laneshadow/ui/organisms/**
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
| ChatInput | `react-native/components/chat/chat-input.tsx` | `node_modules/react-native/Libraries/Components/TextInput/TextInput.js`; `node_modules/react-native/Libraries/Components/Pressable/Pressable.js`; `node_modules/react-native/Libraries/Components/Keyboard/KeyboardAvoidingView.js`; `node_modules/react-native-safe-area-context/src/NativeSafeAreaProvider.tsx` | `android/app/src/main/java/com/laneshadow/ui/organisms/ChatInput.kt` | 3 states (IDLE/PLANNING/ROUTE_RESULTS) × suggestions shown/hidden × keyboard shown/hidden |
| ChatTranscript | `react-native/components/ui/chat-transcript.tsx` | `node_modules/react-native/Libraries/Components/ScrollView/ScrollView.js`; `node_modules/react-native-paper/src/components/Icon.tsx`; `node_modules/@expo/vector-icons/src/MaterialCommunityIcons.tsx` | `android/app/src/main/java/com/laneshadow/ui/organisms/ChatTranscript.kt` | 4 message types (rider/agent/card/empty) × streaming/complete states × transparent/solid background |

## STYLE PROPERTIES MATRIX

> Exhaustive enumeration of every style property from both sources per `08f-translation-protocol.md`. Columns: Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping. `ESCALATE` = no token covers the value — add a proposed token to DECISIONS.md before implementing.
>
> **Token reference** (from `tokens/semantic/semantic.tokens.json`): space xs=4 sm=8 md=12 lg=16 xl=24 2xl=32 3xl=48 4xl=64; radius none=0 sm=4 md=8 lg=16 xl=24 2xl=32 full=9999; elevation[2] shadowOffset=0/2 shadowOpacity=0.05 shadowRadius=4 androidElevation=2. **Paper labelLarge**: fontFamily=sans-serif-medium, fontWeight=500, fontSize=14, lineHeight=20, letterSpacing=0.1. **Paper labelSmall**: fontFamily=sans-serif-medium, fontWeight=500, fontSize=11, lineHeight=16, letterSpacing=0.5. **semantic.type.label.md**: fontSize=14, lineHeight=20, fontWeight=500. **semantic.type.body.sm**: fontSize=14, lineHeight=21, fontWeight=400.

### ChatInput

**Source files read:**
- LaneShadow: `react-native/components/chat/chat-input.tsx`
- Framework: `node_modules/react-native/Libraries/Components/TextInput/TextInput.js`, `node_modules/react-native/Libraries/Components/Pressable/Pressable.js`, `node_modules/react-native/Libraries/Components/Keyboard/KeyboardAvoidingView.js`

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | container position | RN-wrapper | `position: 'absolute', left: 0, right: 0, bottom: 0` | `Modifier.align(Alignment.BottomCenter)` + parent Box | `.frame(maxWidth: .infinity).ignoresSafeArea()` | n/a |
| Layout | container zIndex | RN-wrapper | `zIndex: 20` | `Modifier.zIndex(20)` | `.zIndex(20)` | ESCALATE — propose `elevation.chatInput = 20` |
| Layout | container gap | RN-wrapper | `gap: 8` | `Arrangement.spacedBy(8.dp)` | `spacing: 8` | `space.sm` ✓ |
| Layout | chipsContainer maxWidth | RN-wrapper | `maxWidth: 780` | `Modifier.requiredMaxWidth(780.dp)` | `.frame(maxWidth: 780)` | ESCALATE — propose `size.chatMaxWidth = 780` |
| Layout | chipsContainer gap | RN-wrapper | `semantic.space.sm` = 8 | `Arrangement.spacedBy(8.dp)` | `spacing: 8` | `space.sm` |
| Layout | chipsContainer paddingHorizontal | RN-wrapper | `semantic.space.md` = 12 | `Modifier.padding(horizontal = 12.dp)` | `.padding(.horizontal, 12)` | `space.md` |
| Layout | chipsContainer paddingVertical | RN-wrapper | `semantic.space.sm` = 8 | `Modifier.padding(vertical = 8.dp)` | `.padding(.vertical, 8)` | `space.sm` |
| Layout | chip paddingHorizontal | RN-wrapper | `semantic.space.md` = 12 | `Modifier.padding(horizontal = 12.dp)` | `.padding(.horizontal, 12)` | `space.md` |
| Layout | chip paddingVertical | RN-wrapper | `semantic.space.sm` = 8 | `Modifier.padding(vertical = 8.dp)` | `.padding(.vertical, 8)` | `space.sm` |
| Layout | chip borderRadius | RN-wrapper | `semantic.radius.full` = 9999 | `CircleShape` or `RoundedCornerShape(percent=50)` | `Capsule()` | `radius.full` |
| Layout | inputRow gap | RN-wrapper | `gap: 8` | `Arrangement.spacedBy(8.dp)` | `spacing: 8` | `space.sm` |
| Layout | inputRow paddingHorizontal | RN-wrapper | `semantic.space.md` = 12 | `Modifier.padding(horizontal = 12.dp)` | `.padding(.horizontal, 12)` | `space.md` |
| Layout | inputContainer maxWidth | RN-wrapper | `maxWidth: 780` | `Modifier.requiredMaxWidth(780.dp)` | `.frame(maxWidth: 780)` | ESCALATE — `size.chatMaxWidth = 780` |
| Layout | inputContainer flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| Layout | inputContainer alignItems | RN-wrapper | `'flex-end'` | `verticalAlignment = Alignment.Bottom` | `.alignment(.bottom)` | n/a |
| Layout | inputContainer flex | RN-wrapper | `flex: 1` | `Modifier.weight(1f)` | `LayoutPriority(1)` | n/a |
| Layout | inputContainer paddingHorizontal | RN-wrapper | hardcoded `16` | `Modifier.padding(horizontal = 16.dp)` | `.padding(.horizontal, 16)` | `space.lg` ✓ |
| Layout | inputContainer paddingVertical | RN-wrapper | hardcoded `10` | `Modifier.padding(vertical = 10.dp)` | `.padding(.vertical, 10)` | ESCALATE — propose `space.inputVertical = 10` |
| Layout | inputContainer gap | RN-wrapper | hardcoded `12` | `Arrangement.spacedBy(12.dp)` | `spacing: 12` | `space.md` ✓ |
| Layout | inputContainer minHeight | RN-wrapper | hardcoded `56` | `Modifier.heightIn(min = 56.dp)` | `.frame(minHeight: 56)` | ESCALATE — propose `size.chatInputMinHeight = 56` |
| Layout | inputWrapper flex | RN-wrapper | `flex: 1` | `Modifier.weight(1f)` | `LayoutPriority(1)` | n/a |
| Layout | inputWrapper minHeight | RN-wrapper | hardcoded `24` | `Modifier.heightIn(min = 24.dp)` | `.frame(minHeight: 24)` | ESCALATE — propose `size.inputTextMinHeight = 24` |
| Layout | textInput minHeight | RN-wrapper | hardcoded `24` | `Modifier.heightIn(min = 24.dp)` | `.frame(minHeight: 24)` | ESCALATE — `size.inputTextMinHeight = 24` |
| Layout | textInput maxHeight | RN-wrapper | hardcoded `140` | `Modifier.heightIn(max = 140.dp)` | `.frame(maxHeight: 140)` | ESCALATE — propose `size.inputTextMaxHeight = 140` |
| Layout | textInput padding | RN-wrapper | hardcoded `0` | `Modifier.padding(0.dp)` | `.padding(0)` | n/a |
| Layout | manualModeButton size | RN-wrapper | hardcoded `32 × 32` | `Modifier.size(32.dp)` | `.frame(width: 32, height: 32)` | ESCALATE — propose `iconSize.button = 32` |
| Layout | manualModeButton borderRadius | RN-wrapper | hardcoded `16` | `RoundedCornerShape(16.dp)` | `RoundedRectangle(cornerRadius: 16)` | ESCALATE — `radius.lg = 16` ✓ |
| Layout | sendButton size | RN-wrapper | hardcoded `40 × 40` | `Modifier.size(40.dp)` | `.frame(width: 40, height: 40)` | ESCALATE — `space.2xl + space.sm = 40` ✓ |
| Layout | sendButton borderRadius | RN-wrapper | hardcoded `20` | `RoundedCornerShape(20.dp)` | `RoundedRectangle(cornerRadius: 20)` | ESCALATE — `radius.xl2 = 20` or map to `radius.xl = 24` |
| Layout | toggleButton size | RN-wrapper | hardcoded `40 × 40` | `Modifier.size(40.dp)` | `.frame(width: 40, height: 40)` | `space.2xl + space.sm = 40` ✓ |
| Layout | toggleButton borderRadius | RN-wrapper | hardcoded `20` | `RoundedCornerShape(20.dp)` | `RoundedRectangle(cornerRadius: 20)` | ESCALATE — `radius.xl2 = 20` |
| Visual | inputContainer backgroundColor | RN-wrapper | `semantic.color.surface.default` | `LaneShadowTheme.colors.surface` | `theme.colors.surface` | `color.surface.default` |
| Visual | inputContainer borderRadius | RN-wrapper | `semantic.radius.xl` = 24 | `RoundedCornerShape(24.dp)` | `RoundedRectangle(cornerRadius: 24)` | `radius.xl` |
| Visual | inputContainer borderWidth | RN-wrapper | hardcoded `1` | `Modifier.border(1.dp, ...)` | `.overlay(...stroke(...lineWidth: 1))` | ESCALATE — `borderWidth.thin = 1` |
| Visual | inputContainer borderColor | RN-wrapper | `semantic.color.border.default` | `LaneShadowTheme.colors.border` | `theme.colors.border` | `color.border.default` |
| Visual | chip backgroundColor | RN-wrapper | `semantic.color.surfaceVariant.default` | `LaneShadowTheme.colors.surfaceVariant` | `theme.colors.surfaceVariant` | `color.surfaceVariant.default` |
| Visual | chip borderColor | RN-wrapper | hardcoded `1` transparent | `Modifier.border(1.dp, Color.Transparent)` | `.strokeBorder(Color.clear, lineWidth: 1)` | n/a |
| Visual | sendButton backgroundColor (planning) | RN-wrapper | `semantic.color.danger.default` | `LaneShadowTheme.colors.danger` | `theme.colors.danger` | `color.danger.default` |
| Visual | sendButton backgroundColor (not planning) | RN-wrapper | `semantic.color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |
| Visual | toggleButton backgroundColor | RN-wrapper | `semantic.color.surfaceVariant.default` | `LaneShadowTheme.colors.surfaceVariant` | `theme.colors.surfaceVariant` | `color.surfaceVariant.default` |
| Visual | toggleButton borderWidth | RN-wrapper | hardcoded `1.5` | `Modifier.border(1.5.dp, ...)` | `.overlay(...stroke(...lineWidth: 1.5))` | ESCALATE — propose `borderWidth.toggle = 1.5` |
| Visual | toggleButton borderColor | RN-wrapper | `semantic.color.border.default` | `LaneShadowTheme.colors.border` | `theme.colors.border` | `color.border.default` |
| Visual | toggleButton elevation | RN-wrapper | `semantic.elevation[3]` | `Modifier.shadow(elevation = 3.dp)` | `.shadow(...)` | `elevation[3]` |
| Typography | chip text | RN-wrapper | `semantic.type.body.sm` | `MaterialTheme.typography.bodySmall` | `.font(.body)` | `type.body.sm` |
| Typography | chip textColor | RN-wrapper | `semantic.color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |
| Typography | textInput | RN-wrapper | `semantic.type.body.md` | `MaterialTheme.typography.bodyMedium` | `.font(.body)` | `type.body.md` |
| Typography | textInput color | RN-wrapper | `semantic.color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |
| Typography | textInput placeholderColor | RN-wrapper | `semantic.color.onSurface.muted` | `LocalContentColor provides onSurfaceMuted` | `.foregroundStyle(theme.colors.onSurfaceMuted)` | `color.onSurface.muted` |
| Typography | manualMode icon color | RN-wrapper | `semantic.color.onSurface.muted` | `LaneShadowTheme.colors.onSurfaceMuted` | `theme.colors.onSurfaceMuted` | `color.onSurface.muted` |
| Typography | sendButton icon color | RN-wrapper | `semantic.color.onPrimary.default` | `LaneShadowTheme.colors.onPrimary` | `theme.colors.onPrimary` | `color.onPrimary.default` |
| Typography | toggleButton icon color | RN-wrapper | `semantic.color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |
| State | textInput disabled opacity | RN-wrapper | hardcoded `0.5` | `Modifier.alpha(if (isPlanning) 0.5f else 1f)` | `.opacity(isPlanning ? 0.5 : 1)` | ESCALATE — `opacity.disabled = 0.5` |
| State | textInput editable | RN-wrapper | `!isPlanning` | `enabled = !isPlanning` | `!.isPlanning` | n/a |
| Keyboard | behavior (iOS) | RN-wrapper | `KeyboardAvoidingView behavior='padding'` | `WindowInsets.ime.addPadding()` modifier | `.keyboardShortcut(.defaultDuration)` | n/a |
| Keyboard | behavior (Android) | RN-wrapper | `KeyboardAvoidingView behavior='height'` | handled by Compose scaffold | n/a | n/a |
| Keyboard | paddingBottom | RN-wrapper | `(keyboardVisible ? 0 : insets.bottom) + semantic.space.md + extraBottomOffset` | `Modifier.padding(bottom = (...).dp)` | `.padding(.bottom, ...)` | `space.md` + `insets.bottom` |

### ChatTranscript

**Source files read:**
- LaneShadow: `react-native/components/ui/chat-transcript.tsx`
- Framework: `node_modules/react-native/Libraries/Components/ScrollView/ScrollView.js`, `node_modules/react-native-paper/src/components/Icon.tsx`, `node_modules/@expo/vector-icons/src/MaterialCommunityIcons.tsx`

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | scroll flex | RN-wrapper | `flex: 1` | `Modifier.fillMaxSize()` | `FrameLayout` or `.frame(maxWidth: .infinity, maxHeight: .infinity)` | n/a |
| Layout | scrollContent padding | RN-wrapper | `semantic.space.lg` = 16 | `Modifier.padding(16.dp)` | `.padding(16)` | `space.lg` |
| Layout | scrollContent paddingTop | RN-wrapper | `semantic.space.lg + topInset` | `Modifier.padding(top = (16 + topInset).dp)` | `.padding(.top, 16 + topInset)` | `space.lg` + inset |
| Layout | scrollContent paddingBottom | RN-wrapper | `semantic.space.lg + bottomInset` | `Modifier.padding(bottom = (16 + bottomInset).dp)` | `.padding(.bottom, 16 + bottomInset)` | `space.lg` + inset |
| Layout | scrollContent gap | RN-wrapper | `semantic.space.lg` = 16 | `Arrangement.spacedBy(16.dp)` | `spacing: 16` | `space.lg` |
| Layout | scrollContent flexGrow | RN-wrapper | `flexGrow: 1` | `Modifier.fillMaxHeight()` | `.frame(maxHeight: .infinity)` | n/a |
| Layout | scroll backgroundColor (transparent=false) | RN-wrapper | `semantic.color.background.default` | `LaneShadowTheme.colors.background` | `theme.colors.background` | `color.background.default` |
| Layout | scroll backgroundColor (transparent=true) | RN-wrapper | none (transparent) | `Color.Transparent` | `.clear` | n/a |
| Layout | riderBubble maxWidth | RN-wrapper | `'80%'` | `Modifier.fillMaxWidth(0.8f)` | `.frame(maxWidth: .infinity * 0.8)` | ESCALATE — propose `size.bubbleMaxWidth = 0.8` |
| Layout | riderBubble padding | RN-wrapper | `semantic.space.md` = 12 | `Modifier.padding(12.dp)` | `.padding(12)` | `space.md` |
| Layout | riderBubble borderRadius | RN-wrapper | `semantic.radius.xl` = 24 | `RoundedCornerShape(24.dp)` | `RoundedRectangle(cornerRadius: 24)` | `radius.xl` |
| Layout | riderBubble borderBottomRightRadius | RN-wrapper | `semantic.radius.sm` = 4 | `CornerSize(4.dp)` bottom-right only | corners: [.topLeft, .topRight, .bottomLeft] radius=24, .bottomRight=4 | `radius.sm` |
| Layout | riderBubble backgroundColor | RN-wrapper | `semantic.color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |
| Layout | riderRow justifyContent | RN-wrapper | `'flex-end'` | `Arrangement.End` | `frame(maxWidth: .infinity, alignment: .trailing)` | n/a |
| Layout | agentMessageRow width | RN-wrapper | `'100%'` | `Modifier.fillMaxWidth()` | `.frame(maxWidth: .infinity)` | n/a |
| Layout | agentMessageRow (transparent) backgroundColor | RN-wrapper | `${semantic.color.surface.default}D9` (~85%) | `LaneShadowTheme.colors.surface.copy(alpha = 0.85f)` | `theme.colors.surface.opacity(0.85)` | `color.surface.default` |
| Layout | agentMessageRow (transparent) borderRadius | RN-wrapper | `semantic.radius.lg` = 16 | `RoundedCornerShape(16.dp)` | `RoundedRectangle(cornerRadius: 16)` | `radius.lg` |
| Layout | agentMessageRow (transparent) paddingHorizontal | RN-wrapper | `semantic.space.md` = 12 | `Modifier.padding(horizontal = 12.dp)` | `.padding(.horizontal, 12)` | `space.md` |
| Layout | agentMessageRow (transparent) paddingVertical | RN-wrapper | `semantic.space.sm` = 8 | `Modifier.padding(vertical = 8.dp)` | `.padding(.vertical, 8)` | `space.sm` |
| Layout | agentTextRow flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| Layout | agentTextRow alignItems | RN-wrapper | `'flex-end'` | `verticalAlignment = Alignment.Bottom` | `.alignment(.bottom)` | n/a |
| Layout | agentTextRow flexWrap | RN-wrapper | `'wrap'` | `Modifier.wrapContentWidth(...)` (LazyRow) | `LazyVGrid` or wrap | n/a |
| Layout | typingSlot marginLeft | RN-wrapper | `semantic.space.xs` = 4 | `Modifier.padding(start = 4.dp)` | `.padding(.leading, 4)` | `space.xs` |
| Layout | timestampDivider paddingVertical | RN-wrapper | hardcoded `4` | `Modifier.padding(vertical = 4.dp)` | `.padding(.vertical, 4)` | `space.xs` ✓ |
| Layout | timestampDivider alignItems | RN-wrapper | `'center'` | `Modifier.align(Alignment.CenterHorizontally)` | `.frame(maxWidth: .infinity).multilineTextAlignment(.center)` | n/a |
| Layout | emptyState padding | RN-wrapper | hardcoded `32` | `Modifier.padding(32.dp)` | `.padding(32)` | ESCALATE — `space.3xl - space.md = 48 - 16 = 32` |
| Layout | emptyState marginTop | RN-wrapper | `semantic.space.md` = 12 | `Modifier.padding(top = 12.dp)` | `.padding(.top, 12)` | `space.md` |
| Typography | bubbleText | RN-wrapper | `semantic.type.body.lg` | `MaterialTheme.typography.bodyLarge` | `.font(.body)` | `type.body.lg` |
| Typography | bubbleText color | RN-wrapper | `semantic.color.onPrimary.default` | `LaneShadowTheme.colors.onPrimary` | `theme.colors.onPrimary` | `color.onPrimary.default` |
| Typography | timestampText | RN-wrapper | `semantic.type.label.sm` | `MaterialTheme.typography.labelSmall` | `.font(.caption)` | `type.label.sm` |
| Typography | timestampText color | RN-wrapper | `semantic.color.onSurface.subtle` | `LaneShadowTheme.colors.onSurfaceSubtle` | `theme.colors.onSurfaceSubtle` | `color.onSurface.subtle` |
| Typography | emptyText | RN-wrapper | `semantic.type.body.md` | `MaterialTheme.typography.bodyMedium` | `.font(.body)` | `type.body.md` |
| Typography | emptyText color | RN-wrapper | `semantic.color.onSurface.subtle` | `LaneShadowTheme.colors.onSurfaceSubtle` | `theme.colors.onSurfaceSubtle` | `color.onSurface.subtle` |
| Typography | emptyText textAlign | RN-wrapper | `'center'` | `textAlign = TextAlign.Center` | `.multilineTextAlignment(.center)` | n/a |
| Typography | emptyText lineHeight | RN-wrapper | hardcoded `22` | `lineHeight = 22.sp` | `.lineSpacing(22 - fontSize)` | ESCALATE — `type.body.md.lineHeight` |
| Visual | emptyState icon size | RN-wrapper | hardcoded `40` | `Modifier.size(40.dp)` | `.frame(width: 40, height: 40)` | `space.2xl - space.sm = 32 - 8 = 24` (nearest) or ESCALATE `iconSize.emptyState = 40` |
| Visual | emptyState icon color | RN-wrapper | `semantic.color.onSurface.subtle` | `LaneShadowTheme.colors.onSurfaceSubtle` | `theme.colors.onSurfaceSubtle` | `color.onSurface.subtle` |
| Visual | routeAttachmentsRow gap | RN-wrapper | hardcoded `8` | `Arrangement.spacedBy(8.dp)` | `spacing: 8` | `space.sm` ✓ |
| Visual | routeAttachmentsRow marginTop | RN-wrapper | hardcoded `4` | `Modifier.padding(top = 4.dp)` | `.padding(.top, 4)` | `space.xs` ✓ |
| Interaction | keyboardDismissMode | RN-wrapper | `'on-drag'` | `Modifier.pointerInput(Unit) { detectDragGestures { ... } }` | `.gesture(DragGesture().onChanged { ... })` | n/a |
| Interaction | keyboardShouldPersistTaps | RN-wrapper | `'handled'` | `Modifier.clickable(...)` + `focusManager` | `.onTapGesture { ... }` | n/a |

## DESIGN NOTES

- Use deterministic composition fixtures so complex sheets, maps, chat, and stacked layouts remain diffable.
- Avoid unstyled Material defaults and route all styling through the documented Compose theme layer.

## VERIFICATION GATES

- pnpm type-check:native
- ./android/gradlew assembleDebug
- Validate sandbox scenarios for this task in the native sandbox host

## DEPENDENCIES

- UI-037

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
