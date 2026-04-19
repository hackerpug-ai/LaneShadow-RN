# UI-044: iOS organisms 3/7 — navigation & menus: `ThemeDrawerMenu` (both variants), `SessionSidebar`

**Task ID:** UI-044
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

Sprint 2 translates the React Native baseline into native platform components and sandbox scenarios before rider-facing feature sprints resume. This task covers the `organisms` slice for `iOS organisms 3/7 — navigation & menus: ThemeDrawerMenu (both variants), SessionSidebar`.

**Objective:** Implement iOS organisms 3/7 — navigation & menus: `ThemeDrawerMenu` (both variants), `SessionSidebar` as SwiftUI work with parity to the RN baseline, token-only styling, and sandbox coverage.

**Success State:** A reviewer can open the iOS sandbox, browse this task's scenarios, and confirm naming, interface, theme, state, accessibility, and layout parity against RN.

## CRITICAL CONSTRAINTS

### MUST
- Implement the listed components or compositions with parity-aligned naming and interfaces: `ThemeDrawerMenu` (both variants), `SessionSidebar`.
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
**THEN** The listed components or compositions exist in the correct iOS SwiftUI directories with parity-aligned names and signatures: `ThemeDrawerMenu` (both variants), `SessionSidebar`.
**Verify:** `printf "%s\n" "`ThemeDrawerMenu` (both variants), `SessionSidebar`"`

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
| TC-1 | AC-1 | The listed components or compositions exist in the correct iOS SwiftUI directories with parity-aligned names and signatures: `ThemeDrawerMenu` (both variants), `SessionSidebar`. | `printf "%s\n" "`ThemeDrawerMenu` (both variants), `SessionSidebar`"` |
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
| ThemeDrawerMenu (ui variant) | `react-native/components/ui/drawer-menu.tsx` | `node_modules/react-native/Libraries/Animated/Animated.js` (Animated.timing/Value); `node_modules/react-native/Libraries/Components/Pressable/Pressable.js` | `ios/LaneShadow/Views/Organisms/ThemeDrawerMenu.swift` | 1 fixed layout × 2 states (open/closed) × 2 alignments (left/right) |
| ThemeDrawerMenu (ui/menus variant) | `react-native/components/ui/menus/drawer-menu.tsx` | `node_modules/react-native/Libraries/Animated/Animated.js` (Animated.timing/Value); `node_modules/react-native/Libraries/Components/Pressable/Pressable.js` | `ios/LaneShadow/Views/Organisms/Menus/ThemeDrawerMenu.swift` | 1 fixed layout × 2 states (open/closed) × 2 alignments (left/right) |
| SessionSidebar | `react-native/components/ui/session-sidebar.tsx` | `node_modules/react-native/Libraries/Components/ScrollView/ScrollView.js` | `ios/LaneShadow/Views/Organisms/SessionSidebar.swift` | 1 fixed layout × 2 states (visible/hidden) × session grouping (today/yesterday/older) |

## STYLE PROPERTIES MATRIX

> Exhaustive enumeration of every style property from both sources per `08f-translation-protocol.md`. Columns: Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping. `ESCALATE` = no token covers the value — add a proposed token to DECISIONS.md before implementing.
>
> **Token reference** (from `tokens/semantic/semantic.tokens.json`): space xs=4 sm=8 md=12 lg=16 xl=24 2xl=32 3xl=48 4xl=64; radius none=0 sm=4 md=8 lg=16 xl=24 2xl=32 full=9999; elevation[2] shadowOffset=0/2 shadowOpacity=0.05 shadowRadius=4 iosShadowRadius=4 iosShadowOpacity=0.05.

### ThemeDrawerMenu (ui variant)

**Source files read:**
- LaneShadow: `react-native/components/ui/drawer-menu.tsx`
- Framework: `node_modules/react-native/Libraries/Animated/Animated.js`, `node_modules/react-native/Libraries/Components/Pressable/Pressable.js`

**Layout — drawer dimensions:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| width | RN-wrapper | `280` (hardcoded) | `Modifier.width(280.dp)` | `.frame(width: 280)` | ESCALATE — propose `space.drawerWidth = 280` |
| height | RN-wrapper | `'100%'` | `Modifier.fillMaxHeight()` | `.frame(maxHeight: .infinity)` | n/a |

**Layout — header:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| paddingVertical | RN-wrapper | `space.xs` = 4 | `Modifier.padding(vertical = 4.dp)` | `.padding(.vertical, 4)` | `space.xs` |
| paddingHorizontal | RN-wrapper | `space.md` = 12 | `Modifier.padding(horizontal = 12.dp)` | `.padding(.horizontal, 12)` | `space.md` |
| borderBottomWidth | RN-wrapper | `1` | `Modifier.border(1.dp, ...)` | `.overlay(Rectangle().stroke(Color.clear, lineWidth: 1))` | n/a |
| borderBottomColor | RN-wrapper | `color.border.default` | `LaneShadowTheme.colors.border` | `theme.colors.border` | `color.border.default` |

**Layout — section:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| padding | RN-wrapper | `space.lg` = 16 | `Modifier.padding(16.dp)` | `.padding(16)` | `space.lg` |

**Layout — menu item:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| padding | RN-wrapper | `space.md` = 12 | `Modifier.padding(12.dp)` | `.padding(12)` | `space.md` |
| borderRadius | RN-wrapper | `radius.lg` = 16 | `RoundedCornerShape(16.dp)` | `RoundedRectangle(cornerRadius: 16)` | `radius.lg` |
| marginBottom | RN-wrapper | `space.xs` = 4 | `Modifier.padding(bottom = 4.dp)` | `.padding(.bottom, 4)` | `space.xs` |
| gap | RN-wrapper | `12` (hardcoded) | `Arrangement.spacedBy(12.dp)` | `Spacer(minLength: 12)` | ESCALATE — propose `space.iconTextGap = 12` |

**Layout — footer:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| paddingVertical | RN-wrapper | `space.sm` = 8 | `Modifier.padding(vertical = 8.dp)` | `.padding(.vertical, 8)` | `space.sm` |
| paddingHorizontal | RN-wrapper | `space.md` = 12 | `Modifier.padding(horizontal = 12.dp)` | `.padding(.horizontal, 12)` | `space.md` |
| gap | RN-wrapper | `space.lg` = 16 | `Arrangement.spacedBy(16.dp)` | `Spacer(minLength: 16)` | `space.lg` |
| borderTopWidth | RN-wrapper | `1` | `Modifier.border(1.dp, ...)` | `.overlay(Rectangle().stroke(Color.clear, lineWidth: 1))` | n/a |
| borderTopColor | RN-wrapper | `color.border.default` | `LaneShadowTheme.colors.border` | `theme.colors.border` | `color.border.default` |

**Visual — backdrop:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| backgroundColor | RN-wrapper | `color.scrim.default` | `LaneShadowTheme.colors.scrim` | `theme.colors.scrim` | `color.scrim.default` |
| position | RN-wrapper | `'absolute'` | `Modifier.fillMaxSize()` | `.frame(maxWidth: .infinity, maxHeight: .infinity)` | n/a |
| zIndex | RN-wrapper | `10` | `Modifier.zIndex(10)` | `.zIndex(10)` | n/a |

**Visual — drawer container:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| backgroundColor | RN-wrapper | `color.background.default` | `LaneShadowTheme.colors.background` | `theme.colors.background` | `color.background.default` |
| position | RN-wrapper | `'absolute'` | `Modifier.wrapContentSize(unbounded = true)` | `.frame(maxWidth: .infinity, maxHeight: .infinity)` | n/a |
| zIndex | RN-wrapper | `20` | `Modifier.zIndex(20)` | `.zIndex(20)` | n/a |

**Visual — menu item states:**

| State | Source | backgroundColor | Android | iOS | Token |
|---|---|---|---|---|---|---|
| active | RN-wrapper | `${color.primary.default}1A` (10% opacity) | `LaneShadowTheme.colors.primary.copy(alpha = 0.1f)` | `theme.colors.primary.opacity(0.1)` | `color.primary.default` + alpha |
| pressed | RN-wrapper | `color.surface.pressed` | `LaneShadowTheme.colors.surfacePressed` | `theme.colors.surfacePressed` | `color.surface.pressed` |
| disabled | RN-wrapper | `opacity: 0.5` | `alpha(0.5f)` | `.opacity(0.5)` | n/a |

**Typography — header:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| style | RN-wrapper | `type.heading.md` | `LaneShadowTheme.typography.headingMd` | `theme.typography.headingMd` | `type.heading.md` |
| color | RN-wrapper | `color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |

**Typography — section title:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| style | RN-wrapper | `type.label.sm` | `LaneShadowTheme.typography.labelSm` | `theme.typography.labelSm` | `type.label.sm` |
| color | RN-wrapper | `color.onSurface.muted` | `LaneShadowTheme.colors.onSurfaceMuted` | `theme.colors.onSurfaceMuted` | `color.onSurface.muted` |
| marginBottom | RN-wrapper | `space.sm` = 8 | `Modifier.padding(bottom = 8.dp)` | `.padding(.bottom, 8)` | `space.sm` |

**Typography — menu item:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| style | RN-wrapper | `type.body.md` | `LaneShadowTheme.typography.bodyMd` | `theme.typography.bodyMd` | `type.body.md` |
| fontWeight (active) | RN-wrapper | `'500'` | `FontWeight.Medium` | `.weight(.medium)` | n/a |
| fontWeight (inactive) | RN-wrapper | `'400'` | `FontWeight.Normal` | `.weight(.regular)` | n/a |
| color (active) | RN-wrapper | `color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |
| color (inactive) | RN-wrapper | `color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |
| color (disabled) | RN-wrapper | `color.onSurface.subtle` | `LaneShadowTheme.colors.onSurfaceSubtle` | `theme.colors.onSurfaceSubtle` | `color.onSurface.subtle` |

**Iconography — menu item:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| size | RN-wrapper | `24` | `24.dp` | `24` | ESCALATE — propose `space.iconSize = 24` |
| color (active) | RN-wrapper | `color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |
| color (inactive) | RN-wrapper | `color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |
| color (disabled) | RN-wrapper | `color.onSurface.subtle` | `LaneShadowTheme.colors.onSurfaceSubtle` | `theme.colors.onSurfaceSubtle` | `color.onSurface.subtle` |

**Animation — slide transition:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| duration | RN-wrapper | `300` | `300` (animateFloatAsState) | `0.3` | ESCALATE — propose `duration.drawerSlide = 300` |
| easing | RN-wrapper | `'ease-in-out'` (default timing) | `AnimationSpec(spring() or tween(easing = FastOutSlowInEasing))` | `.easeInOut` | n/a |
| translateX (closed, left) | RN-wrapper | `-280` | `-280.dp` | `-280` | `space.drawerWidth` |
| translateX (closed, right) | RN-wrapper | `280` | `280.dp` | `280` | `space.drawerWidth` |

### ThemeDrawerMenu (ui/menus variant)

**Source files read:**
- LaneShadow: `react-native/components/ui/menus/drawer-menu.tsx`
- Framework: `node_modules/react-native/Libraries/Animated/Animated.js`, `node_modules/react-native/Libraries/Components/Pressable/Pressable.js`

**Note:** This variant is nearly identical to ThemeDrawerMenu (ui) but includes the `alignment` prop ('left' | 'right') for right-side drawer support. Style properties are identical — see ThemeDrawerMenu (ui) matrix above. Key difference:

| Property | Source | Value (left) | Value (right) | Android | iOS | Token |
|---|---|---|---|---|---|---|
| alignment | RN-wrapper | `'left'` | `'right'` | `Modifier.wrapContentSize(unbounded = true).offset(x = ...)` | `.offset(x: ...)` | n/a |
| translateX (closed, left) | RN-wrapper | `-280` | n/a | `-280.dp` | `-280` | `space.drawerWidth` |
| translateX (closed, right) | RN-wrapper | n/a | `280` | `280.dp` | `280` | `space.drawerWidth` |

### SessionSidebar

**Source files read:**
- LaneShadow: `react-native/components/ui/session-sidebar.tsx`
- Framework: `node_modules/react-native/Libraries/Components/ScrollView/ScrollView.js`

**Layout — sidebar dimensions:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| width | RN-wrapper | `SCREEN_WIDTH * 0.8` | `Modifier.fillMaxWidth(0.8f)` | `.frame(maxWidth: .infinity * 0.8)` | ESCALATE — propose `space.sidebarWidthRatio = 0.8` |
| height | RN-wrapper | `'100%'` | `Modifier.fillMaxHeight()` | `.frame(maxHeight: .infinity)` | n/a |

**Layout — header:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| paddingHorizontal | RN-wrapper | `20` (hardcoded) | `Modifier.padding(horizontal = 20.dp)` | `.padding(.horizontal, 20)` | ESCALATE — propose `space.sidebarPadding = 20` |
| paddingVertical | RN-wrapper | `20` (hardcoded) | `Modifier.padding(vertical = 20.dp)` | `.padding(.vertical, 20)` | ESCALATE — propose `space.sidebarPadding = 20` |
| borderBottomWidth | RN-wrapper | `1` | `Modifier.border(1.dp, ...)` | `.overlay(Rectangle().stroke(Color.clear, lineWidth: 1))` | n/a |
| borderBottomColor | RN-wrapper | `color.border.default` | `LaneShadowTheme.colors.border` | `theme.colors.border` | `color.border.default` |

**Layout — header title:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| fontSize | RN-wrapper | `28` | `fontSize(28.sp)` | `font(.system(size: 28))` | ESCALATE — propose `type.display.lg.fontSize = 28` |
| fontWeight | RN-wrapper | `'800'` | `FontWeight.ExtraBold` | `.weight(.heavy)` | n/a |

**Layout — new session button:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| gap | RN-wrapper | `6` (hardcoded) | `Arrangement.spacedBy(6.dp)` | `Spacer(minLength: 6)` | ESCALATE — propose `space.buttonIconGap = 6` |
| paddingHorizontal | RN-wrapper | `12` | `Modifier.padding(horizontal = 12.dp)` | `.padding(.horizontal, 12)` | `space.md` |
| paddingVertical | RN-wrapper | `8` | `Modifier.padding(vertical = 8.dp)` | `.padding(.vertical, 8)` | `space.sm` |
| borderRadius | RN-wrapper | `12` (hardcoded) | `RoundedCornerShape(12.dp)` | `RoundedRectangle(cornerRadius: 12)` | `radius.lg` |

**Layout — sessions list:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| padding | RN-wrapper | `16` (hardcoded) | `Modifier.padding(16.dp)` | `.padding(16)` | `space.lg` |

**Layout — group:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| marginBottom | RN-wrapper | `24` (hardcoded) | `Modifier.padding(bottom = 24.dp)` | `.padding(.bottom, 24)` | ESCALATE — propose `space.xl = 24` |

**Layout — group title:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| fontSize | RN-wrapper | `13` | `fontSize(13.sp)` | `font(.system(size: 13))` | `type.label.sm.fontSize` |
| fontWeight | RN-wrapper | `'700'` | `FontWeight.Bold` | `.weight(.bold)` | n/a |
| textTransform | RN-wrapper | `'uppercase'` | `toUpperCase()` | `.uppercase()` | n/a |
| marginBottom | RN-wrapper | `12` | `Modifier.padding(bottom = 12.dp)` | `.padding(.bottom, 12)` | `space.md` |
| letterSpacing | RN-wrapper | `0.8` | `letterSpacing(0.8.sp)` | `.tracking(0.8)` | n/a |

**Layout — empty state:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| paddingVertical | RN-wrapper | `60` | `Modifier.padding(vertical = 60.dp)` | `.padding(.vertical, 60)` | ESCALATE — propose `space.5xl = 64` (use 60) |
| gap | RN-wrapper | `12` | `Arrangement.spacedBy(12.dp)` | `Spacer(minLength: 12)` | `space.md` |

**Visual — backdrop:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| backgroundColor (idle) | RN-wrapper | `'rgba(0, 0, 0, 0.5)'` | `Color.Black.copy(alpha = 0.5f)` | `Color.black.opacity(0.5)` | ESCALATE — propose `color.scrim.default = rgba(0,0,0,0.5)` |
| backgroundColor (pressed) | RN-wrapper | `'rgba(0, 0, 0, 0.6)'` | `Color.Black.copy(alpha = 0.6f)` | `Color.black.opacity(0.6)` | n/a |

**Typography — new session button:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| fontSize | RN-wrapper | `16` | `fontSize(16.sp)` | `font(.system(size: 16))` | `type.body.md.fontSize` |
| fontWeight | RN-wrapper | `'700'` | `FontWeight.Bold` | `.weight(.bold)` | n/a |
| color | RN-wrapper | `color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |

**Typography — empty state:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| fontSize | RN-wrapper | `15` | `fontSize(15.sp)` | `font(.system(size: 15))` | ESCALATE — propose `type.body.sm.fontSize = 15` |
| fontWeight | RN-wrapper | `'500'` | `FontWeight.Medium` | `.weight(.medium)` | n/a |
| color | RN-wrapper | `color.onSurface.subtle` | `LaneShadowTheme.colors.onSurfaceSubtle` | `theme.colors.onSurfaceSubtle` | `color.onSurface.subtle` |

**Iconography — new session button:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| size | RN-wrapper | `26` | `26.dp` | `26` | ESCALATE — propose `space.iconSizeLg = 26` |
| color | RN-wrapper | `color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |

**Iconography — empty state:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| size | RN-wrapper | `48` | `48.dp` | `48` | `space.3xl` |
| color | RN-wrapper | `color.onSurface.subtle` | `LaneShadowTheme.colors.onSurfaceSubtle` | `theme.colors.onSurfaceSubtle` | `color.onSurface.subtle` |

## DESIGN NOTES

- Use deterministic composition fixtures so complex sheets, maps, chat, and stacked layouts remain diffable.
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
