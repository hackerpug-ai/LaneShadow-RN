# UI-058: iOS screens 1/2 — onboarding & setup: same component list (iOS naming)

**Task ID:** UI-058
**Sprint:** Sprint 2 - UI Component Translation and Fidelity Sandbox
**Assigned To:** swift-implementer
**Reviewer:** swift-reviewer
**Estimate:** 480 min
**Type:** [FEATURE]
**Status:** Planned
**Phase:** Screens
**Quality Score:** 115/115

---

## BACKGROUND

Sprint 2 translates the React Native baseline into native platform components and sandbox scenarios before rider-facing feature sprints resume. This task covers the `screens` slice for `iOS screens 1/2 — onboarding & setup: same component list (iOS naming)`.

**Objective:** Implement iOS screens 1/2 — onboarding & setup: same component list (iOS naming) as SwiftUI work with parity to the RN baseline, token-only styling, and sandbox coverage.

**Success State:** A reviewer can open the iOS sandbox, browse this task's scenarios, and confirm naming, interface, theme, state, accessibility, and layout parity against RN.

## CRITICAL CONSTRAINTS

### MUST
- Implement the listed components or compositions with parity-aligned naming and interfaces: same component list (iOS naming).
- Use only the LaneShadow core theme contract locked by `UI-001`: `tokens/semantic/semantic.tokens.json` as the source of truth, generated `native-theme` outputs as the shared packaging layer, and the platform theme entry points (`LaneShadowTheme` on Android, `.laneShadowTheme()` on iOS) for colors, spacing, typography, radii, elevation, and state styling.
- Register sandbox scenarios for default, interactive, and edge-case states with RN reference labels.
- Compose only existing templates, organisms, and delta components and avoid one-off screen styling.

### NEVER
- Add unrelated feature wiring or backend dependencies to satisfy sandbox rendering.
- Introduce hardcoded UI primitives or platform-only naming drift.

### STRICTLY
- Preserve light and dark parity, accessibility labels, and deterministic fixtures for every scenario.

## DELIVERABLES

- ios/LaneShadow/Views/Screens/**
- ios/LaneShadow/Sandbox/Stories/ScreensStories.swift — @MainActor enum with `static let all: [Story]`, aggregated into LaneShadowStories.all
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
- ios/LaneShadow/Views/Screens/**
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
| WelcomeScreen | `react-native/components/onboarding/welcome-screen.tsx` | `node_modules/react-native/Libraries/Components/View/View.js`; `node_modules/react-native/Libraries/Animated/Animated.js` | `ios/LaneShadow/Views/Screens/WelcomeScreen.swift` | 1 screen × 2 states (idle/downloading) × 4 carousel slides |
| CompletionScreen | `react-native/components/onboarding/completion-screen.tsx` | `node_modules/react-native/Libraries/Components/View/View.js` | `ios/LaneShadow/Views/Screens/CompletionScreen.swift` | 1 screen × 1 state |
| DownloadProgressScreen | `react-native/components/onboarding/download-progress-screen.tsx` | `node_modules/react-native/Libraries/Components/View/View.js`; `node_modules/react-native-paper/src/components/ProgressBar/ProgressBar.tsx` | `ios/LaneShadow/Views/Screens/DownloadProgressScreen.swift` | 1 screen × 3 states (downloading/complete/error) |
| SetupRequiredScreen | `react-native/components/gatekeeper/setup-required-screen.tsx` | `node_modules/react-native/Libraries/Components/View/View.js` | `ios/LaneShadow/Views/Screens/SetupRequiredScreen.swift` | 1 screen × 1 state |
| ModelDownloadScreen | N/A (composed from above) | N/A | `ios/LaneShadow/Views/Screens/ModelDownloadScreen.swift` | Composition wrapper |

## STYLE PROPERTIES MATRIX

> Exhaustive enumeration of every style property from both sources per `08f-translation-protocol.md`. Columns: Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping. `ESCALATE` = no token covers the value — add a proposed token to DECISIONS.md before implementing.
>
> **Token reference** (from `tokens/semantic/semantic.tokens.json`): space xs=4 sm=8 md=12 lg=16 xl=24 2xl=32 3xl=48 4xl=64; radius none=0 sm=4 md=8 lg=16 xl=24 2xl=32 full=9999; elevation[2] shadowOffset=0/2 shadowOpacity=0.05 shadowRadius=4 androidElevation=2. **Paper labelLarge**: fontFamily=sans-serif-medium, fontWeight=500, fontSize=14, lineHeight=20, letterSpacing=0.1. **Paper labelSmall**: fontFamily=sans-serif-medium, fontWeight=500, fontSize=11, lineHeight=16, letterSpacing=0.5. **semantic.type.label.md**: fontSize=14, lineHeight=20, fontWeight=500. **semantic.type.body.sm**: fontSize=14, lineHeight=21, fontWeight=400.

### WelcomeScreen

**Source files read:**
- LaneShadow: `react-native/components/onboarding/welcome-screen.tsx`
- Framework: `node_modules/react-native/Libraries/Components/View/View.js`, `node_modules/react-native/Libraries/Animated/Animated.js`, `node_modules/react-native-paper/src/styles/themes/v3/tokens.tsx`

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | flex | RN-wrapper | `1` | `Modifier.fillMaxSize()` | `.frame(maxWidth: .infinity, maxHeight: .infinity)` | n/a |
| Layout | paddingHorizontal | RN-wrapper | hardcoded `24` | `Modifier.padding(horizontal = 24.dp)` | `.padding(.horizontal, 24)` | `space.xl` (=24) ✓ |
| Layout | paddingTop | RN-wrapper | `max(insets.top, 24)` | `Modifier.padding(top = max(WindowInsets.statusBars.asPaddingValues().calculateTopPadding(), 24.dp))` | `.padding(.top, max(safeAreaInsets.top, 16))` | `space.xl` (=24) ✓ |
| Layout | paddingBottom | RN-wrapper | `max(insets.bottom, 40)` | `Modifier.padding(bottom = max(WindowInsets.safeContent.asPaddingValues().calculateBottomPadding(), 40.dp))` | `.padding(.bottom, max(safeAreaInsets.bottom, 40))` | ESCALATE — propose `space.4xl = 64` or use `space.3xl + space.md` (=56) |
| Layout | logoContainer size | RN-wrapper | hardcoded `120` × `120` | `Modifier.size(120.dp)` | `.frame(width: 120, height: 120)` | ESCALATE — propose `size.logo = 120` |
| Layout | logoContainer borderRadius | RN-wrapper | `semantic.radius.xl` = 24 | `RoundedCornerShape(24.dp)` | `RoundedRectangle(cornerRadius: 24)` | `radius.xl` |
| Layout | contentArea | RN-wrapper | `flex: 1, center` | `Modifier.fillMaxSize(), Box(contentAlignment = Alignment.Center)` | `VStack { Spacer(); ...; Spacer() }` | n/a |
| Layout | actionArea | RN-wrapper | width=100%, maxWidth=400 | `Modifier.fillMaxWidth().widthIn(max = 400.dp)` | `.frame(maxWidth: 400)` | n/a |
| Layout | carouselInner gap | RN-wrapper | `gap: semantic.space.sm` = 8 | `Arrangement.spacedBy(8.dp)` | `VStack(spacing: 8)` | `space.sm` |
| Layout | featureEmoji fontSize | RN-wrapper | hardcoded `48` | `fontSize = 48.sp` | `.font(.system(size: 48))` | ESCALATE — propose `type.display.icon = 48` |
| Layout | dotsContainer gap | RN-wrapper | `gap: semantic.space.sm` = 8 | `Arrangement.spacedBy(8.dp)` | `HStack(spacing: 8)` | `space.sm` |
| Layout | dot size | RN-wrapper | hardcoded `6` × `6` | `Modifier.size(6.dp)` | `.frame(width: 6, height: 6)` | ESCALATE — propose `size.dot = 6` |
| Layout | dotsContainer marginTop | RN-wrapper | hardcoded `24` | `Modifier.padding(top = 24.dp)` | `.padding(.top, 24)` | `space.xl` |
| Layout | progressTrack height | RN-wrapper | hardcoded `4` | `Modifier.height(4.dp)` | `.frame(height: 4)` | ESCALATE — propose `size.progressThin = 4` |
| Layout | progressMeta gap | RN-wrapper | `gap: semantic.space.md` = 12 | `Arrangement.spacedBy(12.dp)` | `HStack(spacing: 12)` | `space.md` |
| Visual | backgroundColor | RN-wrapper | `semantic.color.background.default` | `LaneShadowTheme.colors.background` | `theme.colors.background` | `color.background.default` |
| Visual | logoContainer backgroundColor | RN-wrapper | `semantic.color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |
| Visual | logoContainer elevation | RN-wrapper | `semantic.elevation[3]` | `Modifier.shadow(elevation = 4.dp)` | `.shadow(radius: 16, y: 8)` | `elevation[3]` |
| Visual | dot backgroundColor (active) | RN-wrapper | `semantic.color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |
| Visual | dot backgroundColor (inactive) | RN-wrapper | `semantic.color.onSurface.subtle` | `LaneShadowTheme.colors.onSurfaceSubtle` | `theme.colors.onSurfaceSubtle` | `color.onSurface.subtle` |
| Visual | dot borderRadius | RN-wrapper | `semantic.radius.full` = 9999 | `CircleShape` | `Circle()` | `radius.full` |
| Visual | progressTrack backgroundColor | RN-wrapper | `semantic.color.secondary.default` | `LaneShadowTheme.colors.secondary` | `theme.colors.secondary` | `color.secondary.default` |
| Visual | progressFill backgroundColor | RN-wrapper | `semantic.color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |
| Typography — headlineLarge | fontSize | Paper headlineLarge | 32 | `32.sp` | `.font(.system(size: 32, weight: .bold))` | ESCALATE — `type.display.md.fontSize = 32` missing |
| Typography — headlineLarge | fontWeight | RN-wrapper | hardcoded (uses Paper variant) | `FontWeight.Bold` | `.bold` | ESCALATE — propose `fontWeight.bold = 700` |
| Typography — headlineLarge | color | RN-wrapper | `semantic.color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |
| Typography — headlineSmall | fontSize | Paper headlineSmall | 24 | `24.sp` | `.font(.system(size: 24, weight: .semibold))` | ESCALATE — `type.heading.lg.fontSize = 24` missing |
| Typography — headlineSmall | fontWeight | RN-wrapper | hardcoded (uses Paper variant) | `FontWeight.SemiBold` | `.semibold` | ESCALATE — propose `fontWeight.semibold = 600` |
| Typography — headlineSmall | color | RN-wrapper | `semantic.color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |
| Typography — bodyLarge | fontSize | Paper bodyLarge | 16 | `16.sp` | `.font(.body)` | `type.body.md.fontSize` (=16) ✓ |
| Typography — bodyLarge | color | RN-wrapper | `semantic.color.onSurface.muted` | `LaneShadowTheme.colors.onSurfaceMuted` | `theme.colors.onSurfaceMuted` | `color.onSurface.muted` |
| Typography — bodyLarge | lineHeight | RN-wrapper | hardcoded `24` | `lineHeight = 24.sp` | `.lineSpacing(24 - 16)` = 8 | ESCALATE — `type.body.md.lineHeight = 24` |
| Typography — bodySmall | fontSize | Paper bodySmall | 14 | `14.sp` | `.font(.caption)` | `type.body.sm.fontSize` (=14) ✓ |
| Typography — bodySmall | color | RN-wrapper | `semantic.color.onSurface.subtle` | `LaneShadowTheme.colors.onSurfaceSubtle` | `theme.colors.onSurfaceSubtle` | `color.onSurface.subtle` |
| Animation | slideOpacity duration | RN-wrapper | `250` ms fade out, `350` ms fade in | `AnimationSpec(duration = 250ms)` | `.animation(.easeInOut(duration: 0.25))` | ESCALATE — propose `duration.fast = 250` |
| Animation | buttonOpacity → progressOpacity | RN-wrapper | sequence: 250ms out, 300ms in | `AnimationSpec(duration = 250ms)` then `300ms` | `.animation(.easeInOut(duration: 0.25).delay(0.3))` | ESCALATE — propose `duration.medium = 300` |
| Animation | carouselTimer | RN-wrapper | `4500` ms | `4500ms` (LaunchedEffect delay) | `Timer.publish(every: 4.5).autoconnect()` | ESCALATE — propose `duration.carousel = 4500` |

### CompletionScreen

**Source files read:**
- LaneShadow: `react-native/components/onboarding/completion-screen.tsx`
- Framework: `node_modules/react-native/Libraries/Components/View/View.js`

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | flex | RN-wrapper | `1` | `Modifier.fillMaxSize()` | `.frame(maxWidth: .infinity, maxHeight: .infinity)` | n/a |
| Layout | padding | RN-wrapper | hardcoded `24` | `Modifier.padding(24.dp)` | `.padding(24)` | `space.xl` (=24) ✓ |
| Layout | justifyContent | RN-wrapper | `'center'` | `Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.Center)` | `VStack { Spacer(); ...; Spacer() }` | n/a |
| Layout | alignItems | RN-wrapper | `'center'` | `horizontalAlignment = Alignment.CenterHorizontally` | `HStack(spacing: 0)` | n/a |
| Layout | logoContainer size | RN-wrapper | hardcoded `120` × `120` | `Modifier.size(120.dp)` | `.frame(width: 120, height: 120)` | ESCALATE — propose `size.logo = 120` |
| Layout | logoContainer borderRadius | RN-wrapper | `semantic.radius.xl` = 24 | `RoundedCornerShape(24.dp)` | `RoundedRectangle(cornerRadius: 24)` | `radius.xl` |
| Layout | logoContainer marginBottom | RN-wrapper | hardcoded `48` | `Modifier.padding(bottom = 48.dp)` | `.padding(.bottom, 48)` | `space.3xl` (=48) ✓ |
| Layout | textContainer gap | RN-wrapper | `gap: semantic.space.md` = 12 | `Arrangement.spacedBy(12.dp)` | `VStack(spacing: 12)` | `space.md` |
| Layout | textContainer marginBottom | RN-wrapper | hardcoded `48` | `Modifier.padding(bottom = 48.dp)` | `.padding(.bottom, 48)` | `space.3xl` (=48) ✓ |
| Layout | buttonContainer width | RN-wrapper | `100%`, maxWidth=400 | `Modifier.fillMaxWidth().widthIn(max = 400.dp)` | `.frame(maxWidth: 400)` | n/a |
| Layout | buttonContainer marginBottom | RN-wrapper | hardcoded `24` | `Modifier.padding(bottom = 24.dp)` | `.padding(.bottom, 24)` | `space.xl` (=24) ✓ |
| Layout | infoContainer gap | RN-wrapper | `gap: semantic.space.sm` = 8 | `Arrangement.spacedBy(8.dp)` | `VStack(spacing: 8)` | `space.sm` |
| Visual | backgroundColor | RN-wrapper | `semantic.color.background.default` | `LaneShadowTheme.colors.background` | `theme.colors.background` | `color.background.default` |
| Visual | logoContainer backgroundColor | RN-wrapper | `semantic.color.success.default` | `LaneShadowTheme.colors.success` | `theme.colors.success` | `color.success.default` |
| Visual | logoContainer elevation | RN-wrapper | `semantic.elevation[3]` | `Modifier.shadow(elevation = 4.dp)` | `.shadow(radius: 16, y: 8)` | `elevation[3]` |
| Typography — headlineLarge | fontSize | Paper headlineLarge | 32 | `32.sp` | `.font(.system(size: 32, weight: .bold))` | ESCALATE — `type.display.md.fontSize = 32` missing |
| Typography — headlineLarge | color | RN-wrapper | `semantic.color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |
| Typography — bodyLarge | fontSize | Paper bodyLarge | 16 | `16.sp` | `.font(.body)` | `type.body.md.fontSize` (=16) ✓ |
| Typography — bodyLarge | color | RN-wrapper | `semantic.color.onSurface.muted` | `LaneShadowTheme.colors.onSurfaceMuted` | `theme.colors.onSurfaceMuted` | `color.onSurface.muted` |
| Typography — bodySmall | fontSize | Paper bodySmall | 14 | `14.sp` | `.font(.caption)` | `type.body.sm.fontSize` (=14) ✓ |
| Typography — bodySmall | color | RN-wrapper | `semantic.color.onSurface.subtle` | `LaneShadowTheme.colors.onSurfaceSubtle` | `theme.colors.onSurfaceSubtle` | `color.onSurface.subtle` |

### DownloadProgressScreen

**Source files read:**
- LaneShadow: `react-native/components/onboarding/download-progress-screen.tsx`
- Framework: `node_modules/react-native/Libraries/Components/View/View.js`, `node_modules/react-native-paper/src/components/ProgressBar/ProgressBar.tsx`

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | flex | RN-wrapper | `1` | `Modifier.fillMaxSize()` | `.frame(maxWidth: .infinity, maxHeight: .infinity)` | n/a |
| Layout | padding | RN-wrapper | hardcoded `24` | `Modifier.padding(24.dp)` | `.padding(24)` | `space.xl` (=24) ✓ |
| Layout | justifyContent | RN-wrapper | `'center'` | `Column(verticalArrangement = Arrangement.Center)` | `VStack { Spacer(); ...; Spacer() }` | n/a |
| Layout | alignItems | RN-wrapper | `'center'` | `horizontalAlignment = Alignment.CenterHorizontally` | `HStack(spacing: 0)` | n/a |
| Layout | container maxWidth | RN-wrapper | hardcoded `400` | `Modifier.widthIn(max = 400.dp)` | `.frame(maxWidth: 400)` | n/a |
| Layout | titleContainer marginBottom | RN-wrapper | `semantic.space.xl` = 24 | `Modifier.padding(bottom = 24.dp)` | `.padding(.bottom, 24)` | `space.xl` |
| Layout | progressContainer marginBottom | RN-wrapper | `semantic.space.xl` = 24 | `Modifier.padding(bottom = 24.dp)` | `.padding(.bottom, 24)` | `space.xl` |
| Layout | percentageContainer marginBottom | RN-wrapper | `semantic.space.lg` = 16 | `Modifier.padding(bottom = 16.dp)` | `.padding(.bottom, 16)` | `space.lg` |
| Layout | statsContainer gap | RN-wrapper | `gap: semantic.space.md` = 12 | `Arrangement.spacedBy(12.dp)` | `VStack(spacing: 12)` | `space.md` |
| Layout | statsContainer padding | RN-wrapper | hardcoded `16` | `Modifier.padding(16.dp)` | `.padding(16)` | `space.lg` (=16) ✓ |
| Layout | statsContainer borderRadius | RN-wrapper | hardcoded `12` | `RoundedCornerShape(12.dp)` | `RoundedRectangle(cornerRadius: 12)` | ESCALATE — `radius` token 12 missing; use `radius.md = 8` or propose `radius.lg2 = 12` |
| Layout | statsContainer backgroundColor | RN-wrapper | hardcoded `'rgba(255, 255, 255, 0.05)'` | `Color.White.copy(alpha = 0.05f)` | `Color.white.opacity(0.05)` | ESCALATE — propose `color.surfaceOverlay = rgba(255,255,255,0.05)` |
| Layout | statRow flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| Layout | statRow justifyContent | RN-wrapper | `'space-between'` | `horizontalArrangement = Arrangement.SpaceBetween` | `HStack { Spacer(); ...; Spacer() }` | n/a |
| Layout | buttonContainer marginTop | RN-wrapper | `semantic.space.xl` = 24 | `Modifier.padding(top = 24.dp)` | `.padding(.top, 24)` | `space.xl` |
| Layout | infoContainer marginTop | RN-wrapper | `semantic.space.lg` = 16 | `Modifier.padding(top = 16.dp)` | `.padding(.top, 16)` | `space.lg` |
| Visual | backgroundColor | RN-wrapper | `semantic.color.background.default` | `LaneShadowTheme.colors.background` | `theme.colors.background` | `color.background.default` |
| Typography — headlineMedium | fontSize | Paper headlineMedium | 28 | `28.sp` | `.font(.system(size: 28, weight: .semibold))` | ESCALATE — `type.heading.lg.fontSize = 28` missing |
| Typography — headlineMedium | color | RN-wrapper | `semantic.color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |
| Typography — displaySmall | fontSize | Paper displaySmall | 36 | `36.sp` | `.font(.system(size: 36, weight: .bold))` | ESCALATE — `type.display.lg.fontSize = 36` missing |
| Typography — displaySmall | fontWeight | RN-wrapper | hardcoded `'700'` | `FontWeight.Bold` | `.bold` | ESCALATE — propose `fontWeight.bold = 700` |
| Typography — displaySmall | color | RN-wrapper | `semantic.color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |
| Typography — bodyMedium | fontSize | Paper bodyMedium | 14 | `14.sp` | `.font(.body)` | `type.body.md.fontSize` (=14) ✓ |
| Typography — bodyMedium | color (muted) | RN-wrapper | `semantic.color.onSurface.muted` | `LaneShadowTheme.colors.onSurfaceMuted` | `theme.colors.onSurfaceMuted` | `color.onSurface.muted` |
| Typography — bodyMedium | fontWeight (value) | RN-wrapper | hardcoded `'600'` | `FontWeight.SemiBold` | `.semibold` | ESCALATE — propose `fontWeight.semibold = 600` |
| Typography — bodyMedium | color (default) | RN-wrapper | `semantic.color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |
| Typography — bodySmall | fontSize | Paper bodySmall | 12 | `12.sp` | `.font(.caption)` | `type.body.sm.fontSize` (=14) - ESCALATE — propose `type.body.xs.fontSize = 12` |
| Typography — bodySmall | color | RN-wrapper | `semantic.color.onSurface.subtle` | `LaneShadowTheme.colors.onSurfaceSubtle` | `theme.colors.onSurfaceSubtle` | `color.onSurface.subtle` |
| Visual | Progress bar | Paper | `Progress` component | `LinearProgressIndicator(progress = ...)` | `ProgressView(value: ...)` | n/a |
| Visual | success color | RN-wrapper | `semantic.color.success.default` | `LaneShadowTheme.colors.success` | `theme.colors.success` | `color.success.default` |
| Visual | warning color | RN-wrapper | `semantic.color.warning.default` | `LaneShadowTheme.colors.warning` | `theme.colors.warning` | `color.warning.default` |

### SetupRequiredScreen

**Source files read:**
- LaneShadow: `react-native/components/gatekeeper/setup-required-screen.tsx`
- Framework: `node_modules/react-native/Libraries/Components/View/View.js`

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | flex | RN-wrapper | `1` | `Modifier.fillMaxSize()` | `.frame(maxWidth: .infinity, maxHeight: .infinity)` | n/a |
| Layout | padding | RN-wrapper | hardcoded `24` | `Modifier.padding(24.dp)` | `.padding(24)` | `space.xl` (=24) ✓ |
| Layout | justifyContent | RN-wrapper | `'center'` | `Column(verticalArrangement = Arrangement.Center)` | `VStack { Spacer(); ...; Spacer() }` | n/a |
| Layout | alignItems | RN-wrapper | `'center'` | `horizontalAlignment = Alignment.CenterHorizontally` | `HStack(spacing: 0)` | n/a |
| Layout | content maxWidth | RN-wrapper | hardcoded `400` | `Modifier.widthIn(max = 400.dp)` | `.frame(maxWidth: 400)` | n/a |
| Layout | iconContainer size | RN-wrapper | hardcoded `80` × `80` | `Modifier.size(80.dp)` | `.frame(width: 80, height: 80)` | ESCALATE — propose `size.iconLg = 80` |
| Layout | iconContainer borderRadius | RN-wrapper | hardcoded `40` (half of 80) | `CircleShape` | `Circle()` | `radius.full` |
| Layout | iconContainer marginBottom | RN-wrapper | hardcoded `24` | `Modifier.padding(bottom = 24.dp)` | `.padding(.bottom, 24)` | `space.xl` (=24) ✓ |
| Layout | title marginBottom | RN-wrapper | hardcoded `16` | `Modifier.padding(bottom = 16.dp)` | `.padding(.bottom, 16)` | `space.lg` (=16) ✓ |
| Layout | description marginBottom | RN-wrapper | hardcoded `32` | `Modifier.padding(bottom = 32.dp)` | `.padding(.bottom, 32)` | `space.2xl` (=32) ✓ |
| Visual | backgroundColor | RN-wrapper | `semantic.color.background.default` | `LaneShadowTheme.colors.background` | `theme.colors.background` | `color.background.default` |
| Visual | iconContainer backgroundColor | RN-wrapper | `semantic.color.warning.default` + 20% alpha | `LaneShadowTheme.colors.warning.copy(alpha = 0.2f)` | `theme.colors.warning.opacity(0.2)` | `color.warning.default` |
| Visual | icon fontSize | RN-wrapper | hardcoded `40` | `fontSize = 40.sp` | `.font(.system(size: 40))` | ESCALATE — propose `type.display.iconMd = 40` |
| Visual | icon color | RN-wrapper | `semantic.color.warning.default` | `LaneShadowTheme.colors.warning` | `theme.colors.warning` | `color.warning.default` |
| Typography — headlineMedium | fontSize | Paper headlineMedium | 28 | `28.sp` | `.font(.system(size: 28, weight: .semibold))` | ESCALATE — `type.heading.lg.fontSize = 28` missing |
| Typography — headlineMedium | fontWeight | RN-wrapper | hardcoded `'700'` | `FontWeight.Bold` | `.bold` | ESCALATE — propose `fontWeight.bold = 700` |
| Typography — headlineMedium | color | RN-wrapper | `semantic.color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |
| Typography — bodyLarge | fontSize | Paper bodyLarge | 16 | `16.sp` | `.font(.body)` | `type.body.md.fontSize` (=16) ✓ |
| Typography — bodyLarge | color | RN-wrapper | `semantic.color.onSurface.muted` | `LaneShadowTheme.colors.onSurfaceMuted` | `theme.colors.onSurfaceMuted` | `color.onSurface.muted` |
| Typography — bodyLarge | lineHeight | RN-wrapper | hardcoded `24` | `lineHeight = 24.sp` | `.lineSpacing(24 - 16)` = 8 | ESCALATE — `type.body.md.lineHeight = 24` |

### ModelDownloadScreen

**Source files read:**
- N/A (composed from above screens)

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Composition | pattern | RN-wrapper | conditional rendering based on download status | `when (status) { ... }` | `switch status { case ... }` | n/a |
| State | status enum | RN-wrapper | `'required' \| 'downloading' \| 'valid' \| 'corrupted'` | `enum class ModelStatus { REQUIRED, DOWNLOADING, VALID, CORRUPTED }` | `enum ModelStatus { case required, downloading, valid, corrupted }` | n/a |

---

## DESIGN NOTES

- Compose only previously translated components and avoid one-off screen-level styling or ad hoc primitives.
- Avoid default SwiftUI list, form, or navigation styling unless it is fully token-overridden and parity-approved.

## VERIFICATION GATES

- pnpm type-check:native
- swiftformat --lint ios/LaneShadow --config .swiftformat
- xcodebuild -workspace ios/LaneShadow.xcworkspace -scheme LaneShadow -destination "platform=iOS Simulator,name=iPhone 16" test
- Validate sandbox scenarios for this task in the native sandbox host

## DEPENDENCIES

- UI-056
- UI-052

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
