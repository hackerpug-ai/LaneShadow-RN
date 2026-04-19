# UI-010: iOS atoms 3/5 — feedback & containers: `ThemeBadge`, `ThemeCard` (+ subcomponents), `ThemeChip`, `ThemeAvatar`, `ThemeSkeleton`, `ThemeProgress`, `ThemeCollapsible`, `ThemeFAB`

**Task ID:** UI-010
**Sprint:** Sprint 2 - UI Component Translation and Fidelity Sandbox
**Assigned To:** swift-implementer
**Reviewer:** swift-reviewer
**Estimate:** 480 min
**Type:** [FEATURE]
**Status:** Planned
**Phase:** Atoms
**Quality Score:** 115/115

---

## BACKGROUND

Sprint 2 translates the React Native baseline into native platform components and sandbox scenarios before rider-facing feature sprints resume. This task covers the `atoms` slice for `iOS atoms 3/5 — feedback & containers: ThemeBadge, ThemeCard (+ subcomponents), ThemeChip, ThemeAvatar, ThemeSkeleton, ThemeProgress, ThemeCollapsible, ThemeFAB`.

**Objective:** Implement iOS atoms 3/5 — feedback & containers: `ThemeBadge`, `ThemeCard` (+ subcomponents), `ThemeChip`, `ThemeAvatar`, `ThemeSkeleton`, `ThemeProgress`, `ThemeCollapsible`, `ThemeFAB` as SwiftUI work with parity to the RN baseline, token-only styling, and sandbox coverage.

**Success State:** A reviewer can open the iOS sandbox, browse this task's scenarios, and confirm naming, interface, theme, state, accessibility, and layout parity against RN.

## CRITICAL CONSTRAINTS

### MUST
- Implement the listed components or compositions with parity-aligned naming and interfaces: `ThemeBadge`, `ThemeCard` (+ subcomponents), `ThemeChip`, `ThemeAvatar`, `ThemeSkeleton`, `ThemeProgress`, `ThemeCollapsible`, `ThemeFAB`.
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
**THEN** The listed components or compositions exist in the correct iOS SwiftUI directories with parity-aligned names and signatures: `ThemeBadge`, `ThemeCard` (+ subcomponents), `ThemeChip`, `ThemeAvatar`, `ThemeSkeleton`, `ThemeProgress`, `ThemeCollapsible`, `ThemeFAB`.
**Verify:** `printf "%s\n" "`ThemeBadge`, `ThemeCard` (+ subcomponents), `ThemeChip`, `ThemeAvatar`, `ThemeSkeleton`, `ThemeProgress`, `ThemeCollapsible`, `ThemeFAB`"`

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
| TC-1 | AC-1 | The listed components or compositions exist in the correct iOS SwiftUI directories with parity-aligned names and signatures: `ThemeBadge`, `ThemeCard` (+ subcomponents), `ThemeChip`, `ThemeAvatar`, `ThemeSkeleton`, `ThemeProgress`, `ThemeCollapsible`, `ThemeFAB`. | `printf "%s\n" "`ThemeBadge`, `ThemeCard` (+ subcomponents), `ThemeChip`, `ThemeAvatar`, `ThemeSkeleton`, `ThemeProgress`, `ThemeCollapsible`, `ThemeFAB`"` |
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
| Badge | `react-native/components/ui/badge.tsx` | `node_modules/react-native/Libraries/Components/View/View.js`; `node_modules/react-native-paper/src/core/theming.tsx` (useTheme) | `ios/LaneShadow/Views/Atoms/ThemeBadge.swift` | 7 variants (default/secondary/destructive/outline/success/warning/info) × opacity prop (0-1) |
| Card | `react-native/components/ui/card.tsx` | `node_modules/react-native/Libraries/Components/Pressable/Pressable.js`; `node_modules/react-native/Libraries/Components/View/View.js` | `ios/LaneShadow/Views/Atoms/ThemeCard.swift` | 5 variants (default/primary/success/warning/danger) × disabled × pressed |
| CardHeader | `react-native/components/ui/card.tsx` | `node_modules/react-native/Libraries/Components/View/View.js` | `ios/LaneShadow/Views/Atoms/ThemeCard.swift` (nested struct) | 1 layout × marginBottom: space.md |
| CardTitle | `react-native/components/ui/card.tsx` | `node_modules/react-native-paper/src/components/Text/Text.tsx` (semantic.type.title.md) | `ios/LaneShadow/Views/Atoms/ThemeCard.swift` (nested struct) | 5 variants (text color maps to variant) |
| CardContent | `react-native/components/ui/card.tsx` | `node_modules/react-native/Libraries/Components/View/View.js` | `ios/LaneShadow/Views/Atoms/ThemeCard.swift` (nested struct) | 1 layout |
| CardDescription | `react-native/components/ui/card.tsx` | `node_modules/react-native-paper/src/components/Text/Text.tsx` (semantic.type.body.sm) | `ios/LaneShadow/Views/Atoms/ThemeCard.swift` (nested struct) | 5 variants (text color maps to variant) |
| Chip | `react-native/components/ui/chip.tsx` | `node_modules/react-native/Libraries/Components/Pressable/Pressable.js`; `node_modules/react-native-paper/src/components/Text/Text.tsx` (semantic.type.label.sm) | `ios/LaneShadow/Views/Atoms/ThemeChip.swift` | selected × pressed × icon presence |
| Avatar | `react-native/components/ui/avatar.tsx` | `node_modules/react-native/Libraries/Image/Image.js`; `node_modules/react-native/Libraries/Components/View/View.js` | `ios/LaneShadow/Views/Atoms/ThemeAvatar.swift` | 3 sizes (default=40/lg=64/xl=96) × image/initials × showBorder/showRing × badge |
| AvatarBadge | `react-native/components/ui/avatar.tsx` | `node_modules/react-native/Libraries/Components/View/View.js` | `ios/LaneShadow/Views/Atoms/ThemeAvatar.swift` (nested struct) | 4 variants (default/success/warning/danger) × minWidth=20 minHeight=20 |
| Skeleton | `react-native/components/ui/skeleton.tsx` | `node_modules/react-native/Libraries/Animated/Animated.js` (Animated.timing/loop/sequence) | `ios/LaneShadow/Views/Atoms/ThemeSkeleton.swift` | 3 shapes (rectangle/circle/rounded) × custom width/height |
| SkeletonAvatar | `react-native/components/ui/skeleton.tsx` | (composes Skeleton) | `ios/LaneShadow/Views/Atoms/ThemeSkeleton.swift` (nested variant) | 3 sizes (default=40/lg=64/xl=96) with shape=circle |
| SkeletonText | `react-native/components/ui/skeleton.tsx` | (composes Skeleton) | `ios/LaneShadow/Views/Atoms/ThemeSkeleton.swift` (nested variant) | custom width × lines (1+) with height=16 shape=rounded |
| Progress | `react-native/components/ui/progress.tsx` | `node_modules/react-native/Libraries/Animated/Animated.js` (Animated.timing/interpolate) | `ios/LaneShadow/Views/Atoms/ThemeProgress.swift` | determinate (value 0-100) × indeterminate |
| Collapsible | `react-native/components/ui/collapsible.tsx` | `node_modules/react-native/Libraries/Components/TouchableOpacity/TouchableOpacity.js` | `ios/LaneShadow/Views/Atoms/ThemeCollapsible.swift` | open/closed × chevron rotation (0°→90°) |
| FAB | `react-native/components/ui/fab.tsx` | `node_modules/react-native-paper/src/components/FAB/FAB.tsx` (Paper FAB) | `ios/LaneShadow/Views/Atoms/ThemeFAB.swift` | icon × label (optional) × visible |

## STYLE PROPERTIES MATRIX

> Exhaustive enumeration of every style property from both sources per `08f-translation-protocol.md`. Columns: Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping. `ESCALATE` = no token covers the value — add a proposed token to DECISIONS.md before implementing.
>
> **Token reference** (from `tokens/semantic/semantic.tokens.json`): space xs=4 sm=8 md=12 lg=16 xl=24 2xl=32 3xl=48 4xl=64; radius none=0 sm=4 md=8 lg=16 xl=24 2xl=32 full=9999; elevation[2] shadowOffset=0/2 shadowOpacity=0.05 shadowRadius=4 androidElevation=2. **semantic.type.label.sm**: fontSize=13, fontWeight=500, lineHeight=20. **semantic.type.title.md**: fontSize=20, fontWeight=600, lineHeight=28. **semantic.type.body.sm**: fontSize=14, lineHeight=21, fontWeight=400.

### ThemeBadge

**Source files read:**
- LaneShadow: `react-native/components/ui/badge.tsx`
- Framework: `node_modules/react-native/Libraries/Components/View/View.js`, `node_modules/react-native-paper/src/core/theming.tsx`

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | height | RN-wrapper | `paddingVertical: 2` + text height (20) = ~22 | `Modifier.height(IntrinsicSize.Min)` | `.frame(minHeight: 22)` | ESCALATE — text height from `type.label.sm.lineHeight` |
| Layout | paddingHorizontal | RN-wrapper | `10` | `Modifier.padding(horizontal = 10.dp)` | `.padding(.horizontal, 10)` | ESCALATE — `space.xs + space.sm/2 = 8`; propose `space.badgePaddingHorizontal = 10` |
| Layout | paddingVertical | RN-wrapper | `2` | `Modifier.padding(vertical = 2.dp)` | `.padding(.vertical, 2)` | ESCALATE — `space.xs/2 = 2`; propose `space.badgePaddingVertical = 2` |
| Layout | borderRadius | RN-wrapper | `radius.full` = 9999 | `CircleShape` | `Capsule()` | `radius.full` |
| Layout | flexDirection | RN-wrapper | `'row'` | `Row` | `HStack` | n/a |
| Layout | alignItems | RN-wrapper | `'center'` | `Alignment.CenterVertically` | `.alignment(.center)` | n/a |
| Layout | icon marginRight | RN-wrapper | `space.xs` = 4 | `Spacer(Modifier.width(4.dp))` | `Spacer(minLength: 4)` | `space.xs` |
| Visual — backgroundColor | default | RN-wrapper | `color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |
| Visual — backgroundColor | secondary | RN-wrapper | `color.secondary.default` | `LaneShadowTheme.colors.secondary` | `theme.colors.secondary` | `color.secondary.default` |
| Visual — backgroundColor | destructive | RN-wrapper | `color.danger.default` | `LaneShadowTheme.colors.danger` | `theme.colors.danger` | `color.danger.default` |
| Visual — backgroundColor | success | RN-wrapper | `color.success.default` | `LaneShadowTheme.colors.success` | `theme.colors.success` | `color.success.default` |
| Visual — backgroundColor | warning | RN-wrapper | `color.warning.default` | `LaneShadowTheme.colors.warning` | `theme.colors.warning` | `color.warning.default` |
| Visual — backgroundColor | info | RN-wrapper | (uses default) | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |
| Visual — backgroundColor | outline | RN-wrapper | `'transparent'` | `Color.Transparent` | `.clear` | n/a |
| Visual — backgroundColor (with opacity) | any | RN-wrapper | `baseColor + opacity hex (e.g., "80" for 50%)` | `baseColor.copy(alpha = opacity)` | `baseColor.opacity(opacity)` | ESCALATE — opacity prop not in tokens; propose `opacity.badgeBackground` |
| Visual — textColor | default/destructive/success/warning | RN-wrapper | `color.onPrimary.default` | `LaneShadowTheme.colors.onPrimary` | `theme.colors.onPrimary` | `color.onPrimary.default` |
| Visual — textColor | secondary | RN-wrapper | `color.onSecondary.default` | `LaneShadowTheme.colors.onSecondary` | `theme.colors.onSecondary` | `color.onSecondary.default` |
| Visual — textColor | outline | RN-wrapper | `color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |
| Visual — borderWidth | outline | RN-wrapper | `1` | `Modifier.border(1.dp, ...)` | `.overlay(Capsule().stroke(..., lineWidth: 1))` | ESCALATE — propose `borderWidth.thin = 1` |
| Visual — borderColor | outline | RN-wrapper | `color.border.default` | `LaneShadowTheme.colors.border` | `theme.colors.border` | `color.border.default` |
| Typography | source | RN-wrapper | `semantic.type.label.sm` | `TextStyle(fontSize = 13.sp, fontWeight = 500, lineHeight = 20.sp)` | `.font(.system(size: 13, weight: .medium))` | `type.label.sm` |
| Typography | fontWeight | RN-wrapper | `'600'` (overrides label.sm default) | `FontWeight.SemiBold` | `.semibold` | ESCALATE — `type.label.sm.fontWeight = 500` in tokens; prop hardcodes 600 |
| Interaction | accessibilityRole | RN-wrapper | (not set; defaults to 'text' via Text) | `Modifier.semantics { role = Role.Text }` | `.accessibilityAddTraits(.isStaticText)` | n/a |
| Interaction | testID | RN-wrapper | passed via prop | `Modifier.testTag(testID)` | `.accessibilityIdentifier(testID)` | n/a |

---

### ThemeCard

**Source files read:**
- LaneShadow: `react-native/components/ui/card.tsx`
- Framework: `node_modules/react-native/Libraries/Components/Pressable/Pressable.js`, `node_modules/react-native/Libraries/Components/View/View.js`

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | width | RN-wrapper | `'100%'` | `Modifier.fillMaxWidth()` | `.frame(maxWidth: .infinity)` | n/a |
| Layout | padding | RN-wrapper | `space.lg` = 16 | `Modifier.padding(16.dp)` | `.padding(16)` | `space.lg` |
| Layout | borderRadius | RN-wrapper | `radius.lg` = 16 | `RoundedCornerShape(16.dp)` | `RoundedRectangle(cornerRadius: 16)` | `radius.lg` |
| Visual — backgroundColor | default | RN-wrapper | `color.card.default` | `LaneShadowTheme.colors.card` | `theme.colors.card` | `color.card.default` |
| Visual — backgroundColor | primary | RN-wrapper | `color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |
| Visual — backgroundColor | success | RN-wrapper | `color.success.default` | `LaneShadowTheme.colors.success` | `theme.colors.success` | `color.success.default` |
| Visual — backgroundColor | warning | RN-wrapper | `color.warning.default` | `LaneShadowTheme.colors.warning` | `theme.colors.warning` | `color.warning.default` |
| Visual — backgroundColor | danger | RN-wrapper | `color.danger.default` | `LaneShadowTheme.colors.danger` | `theme.colors.danger` | `color.danger.default` |
| Visual — backgroundColor | disabled | RN-wrapper | `color.card.disabled` (fallback to card.default) | `LaneShadowTheme.colors.cardDisabled` | `theme.colors.cardDisabled` | `color.card.disabled` |
| Visual — backgroundColor | pressed | RN-wrapper | `color.card.pressed` (fallback to card.default) OR variant.pressed | `LaneShadowTheme.colors.cardPressed` | `theme.colors.cardPressed` | `color.card.pressed` |
| Visual — borderWidth | showBorder=true | RN-wrapper | `1` | `Modifier.border(1.dp, ...)` | `.overlay(RoundedRectangle(...).stroke(..., lineWidth: 1))` | ESCALATE — propose `borderWidth.thin = 1` |
| Visual — borderColor | showBorder=true | RN-wrapper | `color.border.default` | `LaneShadowTheme.colors.border` | `theme.colors.border` | `color.border.default` |
| Visual — shadow (default) | RN-wrapper | `semantic.elevation[2]` = shadowOffset=0/2, shadowOpacity=0.05, shadowRadius=4, elevation=2 | `Modifier.shadow(elevation = 2.dp)` | `.shadow(color:.black.opacity(0.05), radius: 4, y: 2)` | `elevation[2]` |
| Visual — shadow (pressed) | RN-wrapper | `semantic.elevation[3]` = shadowOffset=0/4, shadowOpacity=0.08, shadowRadius=8, elevation=3 | `Modifier.shadow(elevation = 3.dp)` | `.shadow(color:.black.opacity(0.08), radius: 8, y: 4)` | `elevation[3]` |
| Interaction | onPress | RN-wrapper | optional prop; wraps in Pressable | `Modifier.clickable { ... }` | `.onTapGesture { ... }` | n/a |
| Interaction | disabled | RN-wrapper | `disabled` prop; uses pressed state logic | `Modifier.enabled(!disabled)` | `.disabled(disabled)` | n/a |
| Interaction | accessibilityRole | RN-wrapper | (not set; Pressable provides 'button' when onPress present) | `Modifier.semantics { role = Role.Button }` | `.accessibilityAddTraits(.isButton)` | n/a |

#### CardHeader (subcomponent)

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | flexDirection | RN-wrapper | `'row'` | `Row` | `HStack` | n/a |
| Layout | alignItems | RN-wrapper | `'center'` | `Alignment.CenterVertically` | `.alignment(.center)` | n/a |
| Layout | justifyContent | RN-wrapper | `'space-between'` | `Arrangement.SpaceBetween` | `.spacing(.between)` (HStack default) | n/a |
| Layout | marginBottom | RN-wrapper | `space.md` = 12 | `Modifier.padding(bottom = 12.dp)` | `.padding(.bottom, 12)` | `space.md` |

#### CardTitle (subcomponent)

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Typography | source | RN-wrapper | `semantic.type.title.md` | `TextStyle(fontSize = 20.sp, fontWeight = 600, lineHeight = 28.sp)` | `.font(.system(size: 20, weight: .semibold))` | `type.title.md` |
| Typography — color | default variant | RN-wrapper | `color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |
| Typography — color | primary/success/warning/danger | RN-wrapper | `color.onPrimary.default` | `LaneShadowTheme.colors.onPrimary` | `theme.colors.onPrimary` | `color.onPrimary.default` |

#### CardContent (subcomponent)

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | flex | RN-wrapper | `1` | `Modifier.weight(1f)` | `LayoutPriority(1)` / `Frame(maxWidth:.infinity)` | n/a |

#### CardDescription (subcomponent)

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Typography | source | RN-wrapper | `semantic.type.body.sm` | `TextStyle(fontSize = 14.sp, lineHeight = 21.sp, fontWeight = 400)` | `.font(.system(size: 14))` | `type.body.sm` |
| Typography — color | default variant | RN-wrapper | `color.onSurface.muted` (fallback to onSurface.default) | `LaneShadowTheme.colors.onSurfaceMuted` | `theme.colors.onSurfaceMuted` | `color.onSurface.muted` |
| Typography — color | primary/success/warning/danger | RN-wrapper | `color.onPrimary.default` | `LaneShadowTheme.colors.onPrimary` | `theme.colors.onPrimary` | `color.onPrimary.default` |

---

### ThemeChip

**Source files read:**
- LaneShadow: `react-native/components/ui/chip.tsx`
- Framework: `node_modules/react-native/Libraries/Components/Pressable/Pressable.js`, `node_modules/react-native-paper/src/components/Text/Text.tsx`

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | alignSelf | RN-wrapper | `'flex-start'` | `Modifier.wrapContentWidth()` | `.frame(maxWidth: .infinity, alignment: .leading)` | n/a |
| Layout | flexDirection | RN-wrapper | `'row'` (content) | `Row` | `HStack` | n/a |
| Layout | alignItems | RN-wrapper | `'center'` (content) | `Alignment.CenterVertically` | `.alignment(.center)` | n/a |
| Layout | gap | RN-wrapper | `4` | `Spacer(Modifier.width(4.dp))` | `Spacer(minLength: 4)` | `space.xs` |
| Layout | paddingHorizontal | RN-wrapper | `space.md` = 12 | `Modifier.padding(horizontal = 12.dp)` | `.padding(.horizontal, 12)` | `space.md` |
| Layout | paddingVertical | RN-wrapper | `6` | `Modifier.padding(vertical = 6.dp)` | `.padding(.vertical, 6)` | ESCALATE — propose `space.chipPaddingVertical = 6` |
| Layout | borderRadius | RN-wrapper | `radius.full` = 9999 | `CircleShape` | `Capsule()` | `radius.full` |
| Visual — backgroundColor | selected | RN-wrapper | `color.primary.default` + 20% opacity (`${hex}20`) | `LaneShadowTheme.colors.primary.copy(alpha = 0.12f)` | `theme.colors.primary.opacity(0.12)` | ESCALATE — propose `opacity.chipSelected = 0.12` |
| Visual — backgroundColor | pressed (unselected) | RN-wrapper | `color.muted.default` | `LaneShadowTheme.colors.muted` | `theme.colors.muted` | `color.muted.default` |
| Visual — backgroundColor | idle (unselected) | RN-wrapper | `'transparent'` | `Color.Transparent` | `.clear` | n/a |
| Visual — borderWidth | any | RN-wrapper | `1` | `Modifier.border(1.dp, ...)` | `.overlay(Capsule().stroke(..., lineWidth: 1))` | ESCALATE — propose `borderWidth.thin = 1` |
| Visual — borderColor | selected | RN-wrapper | `color.primary.default` + 40% opacity (`${hex}60`) | `LaneShadowTheme.colors.primary.copy(alpha = 0.4f)` | `theme.colors.primary.opacity(0.4)` | ESCALATE — propose `opacity.chipBorderSelected = 0.4` |
| Visual — borderColor | unselected | RN-wrapper | `color.border.default` | `LaneShadowTheme.colors.border` | `theme.colors.border` | `color.border.default` |
| Typography | source | RN-wrapper | `semantic.type.label.sm` (but fontSize overridden) | `TextStyle(fontSize = 13.sp, fontWeight = 500, lineHeight = 20.sp)` | `.font(.system(size: 13, weight: .medium))` | `type.label.sm` (with override) |
| Typography | fontSize | RN-wrapper | hardcoded `13` (overrides label.sm) | `13.sp` | `13` | ESCALATE — `type.label.sm.fontSize = 13` missing from tokens |
| Typography — color | selected | RN-wrapper | `color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |
| Typography — color | unselected | RN-wrapper | `color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |
| Icon | size | RN-wrapper | hardcoded `16` | `Modifier.size(16.dp)` | `.frame(width: 16, height: 16)` | ESCALATE — propose `iconSize.sm = 16` |
| Icon — color | selected | RN-wrapper | `color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |
| Icon — color | unselected | RN-wrapper | `color.onSurface.muted` | `LaneShadowTheme.colors.onSurfaceMuted` | `theme.colors.onSurfaceMuted` | `color.onSurface.muted` |
| Interaction | onPress | RN-wrapper | optional prop | `Modifier.clickable { ... }` | `.onTapGesture { ... }` | n/a |
| Interaction | accessibilityRole | RN-wrapper | (not set; Pressable defaults) | `Modifier.semantics { role = Role.Button }` | `.accessibilityAddTraits(.isButton)` | n/a |
| Interaction | accessibilityState.selected | RN-wrapper | `selected` prop | `Modifier.semantics { selected() }` | `.accessibilityAddTraits(.isSelected)` | n/a |
| Interaction | testID | RN-wrapper | passed via prop | `Modifier.testTag(testID)` | `.accessibilityIdentifier(testID)` | n/a |

---

### ThemeAvatar

**Source files read:**
- LaneShadow: `react-native/components/ui/avatar.tsx`
- Framework: `node_modules/react-native/Libraries/Image/Image.js`, `node_modules/react-native/Libraries/Components/View/View.js`

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | width/height (default) | RN-wrapper | `40` | `Modifier.size(40.dp)` | `.frame(width: 40, height: 40)` | ESCALATE — propose `size.avatarDefault = 40` |
| Layout | width/height (lg) | RN-wrapper | `64` | `Modifier.size(64.dp)` | `.frame(width: 64, height: 64)` | ESCALATE — propose `size.avatarLg = 64` |
| Layout | width/height (xl) | RN-wrapper | `96` | `Modifier.size(96.dp)` | `.frame(width: 96, height: 96)` | ESCALATE — propose `size.avatarXl = 96` |
| Layout | borderRadius | RN-wrapper | `radius.full` = 9999 | `CircleShape` | `Circle()` | `radius.full` |
| Layout | alignItems | RN-wrapper | `'center'` | `Alignment.Center` | `.frame(alignment: .center)` / `HStack(alignment: .center)` | n/a |
| Layout | justifyContent | RN-wrapper | `'center'` | `Arrangement.Center` | n/a | n/a |
| Layout | overflow | RN-wrapper | `'hidden'` | `Modifier.clip(CircleShape)` | `.clipped()` | n/a |
| Visual — backgroundColor | RN-wrapper | `color.muted.default` | `LaneShadowTheme.colors.muted` | `theme.colors.muted` | `color.muted.default` |
| Visual — borderWidth | showBorder=true | RN-wrapper | `2` | `Modifier.border(2.dp, ...)` | `.overlay(Circle().stroke(..., lineWidth: 2))` | ESCALATE — propose `borderWidth.avatar = 2` |
| Visual — borderColor | showBorder=true | RN-wrapper | `color.border.default` | `LaneShadowTheme.colors.border` | `theme.colors.border` | `color.border.default` |
| Visual — borderWidth | showRing=true | RN-wrapper | `2` | `Modifier.border(2.dp, ...)` | `.overlay(Circle().stroke(..., lineWidth: 2))` | ESCALATE — same as above |
| Visual — borderColor | showRing=true | RN-wrapper | `color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |
| Typography — initials | fontSize (default) | RN-wrapper | hardcoded `16` | `16.sp` | `.font(.system(size: 16, weight: .medium))` | ESCALATE — `type.avatarDefault.fontSize = 16` |
| Typography — initials | fontSize (lg) | RN-wrapper | hardcoded `24` | `24.sp` | `.font(.system(size: 24, weight: .medium))` | ESCALATE — `type.avatarLg.fontSize = 24` |
| Typography — initials | fontSize (xl) | RN-wrapper | hardcoded `36` | `36.sp` | `.font(.system(size: 36, weight: .medium))` | ESCALATE — `type.avatarXl.fontSize = 36` |
| Typography — initials | fontWeight | RN-wrapper | `'500'` | `FontWeight.Medium` | `.medium` | ESCALATE — propose `fontWeight.avatarInitials = 500` |
| Typography — initials | color | RN-wrapper | `color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |
| Image | resizeMode | RN-wrapper | `'cover'` | `ContentScale.Crop` | `.aspectRatio(contentMode: .fill)` / `AsyncImage(url:).aspectRatio(contentMode: .fill)` | n/a |
| Badge | position | RN-wrapper | `top: -4, right: -4` (absolute) | `Modifier.offset(x = (-4).dp, y = (-4).dp)` | `.offset(x: -4, y: -4)` | ESCALATE — propose `space.badgeOffset = -4` |
| Interaction | accessibilityLabel | RN-wrapper | `alt` prop → Image accessibilityLabel | `Modifier.semantics { contentDescription = alt }` | `.accessibilityLabel(alt)` | n/a |

#### AvatarBadge (subcomponent)

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | minWidth | RN-wrapper | `20` | `Modifier.widthIn(min = 20.dp)` | `.frame(minWidth: 20)` | ESCALATE — propose `size.badgeMin = 20` |
| Layout | minHeight | RN-wrapper | `20` | `Modifier.heightIn(min = 20.dp)` | `.frame(minHeight: 20)` | ESCALATE — propose `size.badgeMin = 20` |
| Layout | borderRadius | RN-wrapper | `radius.full` = 9999 | `CircleShape` | `Circle()` | `radius.full` |
| Layout | paddingHorizontal | RN-wrapper | `4` | `Modifier.padding(horizontal = 4.dp)` | `.padding(.horizontal, 4)` | `space.xs` |
| Layout | paddingVertical | RN-wrapper | `2` | `Modifier.padding(vertical = 2.dp)` | `.padding(.vertical, 2)` | ESCALATE — `space.xs/2` |
| Layout | alignItems | RN-wrapper | `'center'` | `Alignment.Center` | `.frame(alignment: .center)` | n/a |
| Layout | justifyContent | RN-wrapper | `'center'` | `Arrangement.Center` | n/a | n/a |
| Visual — backgroundColor | default | RN-wrapper | `color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |
| Visual — backgroundColor | success | RN-wrapper | `color.success.default` | `LaneShadowTheme.colors.success` | `theme.colors.success` | `color.success.default` |
| Visual — backgroundColor | warning | RN-wrapper | `color.warning.default` | `LaneShadowTheme.colors.warning` | `theme.colors.warning` | `color.warning.default` |
| Visual — backgroundColor | danger | RN-wrapper | `color.danger.default` | `LaneShadowTheme.colors.danger` | `theme.colors.danger` | `color.danger.default` |

---

### ThemeSkeleton

**Source files read:**
- LaneShadow: `react-native/components/ui/skeleton.tsx`
- Framework: `node_modules/react-native/Libraries/Animated/Animated.js` (Animated.timing/loop/sequence)

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | width | RN-wrapper | prop; default `'100%'` | `Modifier.fillMaxWidth()` | `.frame(maxWidth: .infinity)` | n/a |
| Layout | height | RN-wrapper | prop; default `16` | `Modifier.height(16.dp)` | `.frame(height: 16)` | ESCALATE — `type.body.sm.fontSize = 14`; 16 is arbitrary |
| Layout | borderRadius | RN-wrapper | shape-based: circle=full, rectangle=none, rounded=md | shape switch | shape switch | shape switch |
| Layout | borderRadius | circle | RN-wrapper | `radius.full` = 9999 | `CircleShape` | `Circle()` | `radius.full` |
| Layout | borderRadius | rectangle | RN-wrapper | `radius.none` = 0 | `RectangleShape` | `Rectangle()` | `radius.none` |
| Layout | borderRadius | rounded | RN-wrapper | `radius.md` = 8 | `RoundedCornerShape(8.dp)` | `RoundedRectangle(cornerRadius: 8)` | `radius.md` |
| Visual | backgroundColor | RN-wrapper | `color.muted.default` | `LaneShadowTheme.colors.muted` | `theme.colors.muted` | `color.muted.default` |
| Animation | type | RN-wrapper | `Animated.loop` with `Animated.sequence` | `infiniteRepeatable(animation = keyframes {...})` | `.animation(.easeInOut(duration: 0.75).repeatForever(autoreverses: true))` | n/a |
| Animation | duration | RN-wrapper | `750ms` each direction (to 0.3, back to 1) | `durationMillis = 750` | `0.75` | ESCALATE — propose `motion.duration.slow = 750` |
| Animation | property | RN-wrapper | `opacity` (1 → 0.3 → 1) | `alpha` | `.opacity` | n/a |
| Animation | easing | RN-wrapper | `Animated.timing` (linear) | `Easing.Linear` | `.linear` | n/a |

#### SkeletonAvatar (variant)

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | width/height (default) | RN-wrapper | `40` | `Modifier.size(40.dp)` | `.frame(width: 40, height: 40)` | ESCALATE — `size.avatarDefault = 40` |
| Layout | width/height (lg) | RN-wrapper | `64` | `Modifier.size(64.dp)` | `.frame(width: 64, height: 64)` | ESCALATE — `size.avatarLg = 64` |
| Layout | width/height (xl) | RN-wrapper | `96` | `Modifier.size(96.dp)` | `.frame(width: 96, height: 96)` | ESCALATE — `size.avatarXl = 96` |
| Layout | shape | RN-wrapper | `'circle'` | `CircleShape` | `Circle()` | n/a |

#### SkeletonText (variant)

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | height | RN-wrapper | `16` | `Modifier.height(16.dp)` | `.frame(height: 16)` | ESCALATE — arbitrary; map to `type.body.sm.lineHeight = 21`? |
| Layout | width | RN-wrapper | prop; default `'100%'` | `Modifier.fillMaxWidth()` | `.frame(maxWidth: .infinity)` | n/a |
| Layout | width (last line) | RN-wrapper | `'75%'` (when lines > 1) | `Modifier.fillMaxWidth(0.75f)` | `.frame(maxWidth: .infinity).frame(width: 75%, alignment: .leading)` | n/a |
| Layout | marginTop | RN-wrapper | `space.sm` = 8 (between lines) | `Modifier.padding(top = 8.dp)` | `.padding(.top, 8)` | `space.sm` |
| Layout | shape | RN-wrapper | `'rounded'` | `RoundedCornerShape(8.dp)` | `RoundedRectangle(cornerRadius: 8)` | `radius.md` |

---

### ThemeProgress

**Source files read:**
- LaneShadow: `react-native/components/ui/progress.tsx`
- Framework: `node_modules/react-native/Libraries/Animated/Animated.js` (Animated.timing/interpolate)

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | width | RN-wrapper | `'100%'` | `Modifier.fillMaxWidth()` | `.frame(maxWidth: .infinity)` | n/a |
| Layout | height | RN-wrapper | hardcoded `16` | `Modifier.height(16.dp)` | `.frame(height: 16)` | ESCALATE — propose `size.progressHeight = 16` |
| Layout | borderRadius | RN-wrapper | `radius.full` = 9999 | `CircleShape` | `Capsule()` | `radius.full` |
| Layout | overflow | RN-wrapper | `'hidden'` | `Modifier.clip(CircleShape)` | `.clipped()` | n/a |
| Visual — backgroundColor | track | RN-wrapper | `color.secondary.default` | `LaneShadowTheme.colors.secondary` | `theme.colors.secondary` | `color.secondary.default` |
| Visual — backgroundColor | indicator | RN-wrapper | `color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |
| Layout — indicator | position | RN-wrapper | `absolute left: 0 top: 0` | `Modifier.align(Alignment.CenterStart)` | `.frame(maxWidth: .infinity, alignment: .leading)` | n/a |
| Layout — indicator | height | RN-wrapper | `16` (matches container) | `Modifier.fillMaxHeight()` | `.frame(height: 16)` | same as container |
| Layout — indicator | borderRadius | RN-wrapper | `radius.full` = 9999 | `CircleShape` | `Capsule()` | `radius.full` |
| Layout — indicator | width (determinate) | RN-wrapper | `percentage` (0-100) interpolated to '0%'-'100%' | `Modifier.fillMaxWidth(percentage / 100f)` | `.frame(maxWidth: .infinity).frame(width: percentage%)` | n/a |
| Layout — indicator | width (indeterminate) | RN-wrapper | `'30%'` | `Modifier.fillMaxWidth(0.3f)` | `.frame(width: 30%)` | ESCALATE — propose `size.progressIndeterminateWidth = 30%` |
| Animation — determinate | duration | RN-wrapper | `300ms` | `durationMillis = 300` | `0.3` | ESCALATE — propose `motion.duration.fast = 300` |
| Animation — determinate | property | RN-wrapper | `width` (from current to percentage) | `animateFloatAsState(...)` | `.animation(.linear(duration: 0.3), value: percentage)` | n/a |
| Animation — indeterminate | duration | RN-wrapper | `1500ms` each direction | `durationMillis = 1500` | `1.5` | ESCALATE — propose `motion.duration.indeterminate = 1500` |
| Animation — indeterminate | property | RN-wrapper | `translateX` (-100% to 100%) | `offset { x = interpolate(...) }` | `.offset(x: ...)` | n/a |
| Interaction | accessibilityRole | RN-wrapper | `'progressbar'` | `Modifier.semantics { role = Role.ProgressBar }` | `.accessibilityAddTraits(.updatesFrequently)` | n/a |
| Interaction | accessibilityValue | RN-wrapper | `{min: 0, max, now: value}` | `Modifier.semantics { stateDescription = "${value} of ${max}" }` | `.accessibilityValue("${value} / ${max}")` | n/a |

---

### ThemeCollapsible

**Source files read:**
- LaneShadow: `react-native/components/ui/collapsible.tsx`
- Framework: `node_modules/react-native/Libraries/Components/TouchableOpacity/TouchableOpacity.js`

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | flexDirection | RN-wrapper | `'row'` (header) | `Row` | `HStack` | n/a |
| Layout | alignItems | RN-wrapper | `'center'` (header) | `Alignment.CenterVertically` | `.alignment(.center)` | n/a |
| Layout | gap | RN-wrapper | `space.sm` = 8 | `Spacer(Modifier.width(8.dp))` | `Spacer(minLength: 8)` | `space.sm` |
| Layout | marginTop | RN-wrapper | `space.sm` = 8 (content when open) | `Modifier.padding(top = 8.dp)` | `.padding(.top, 8)` | `space.sm` |
| Layout | marginLeft | RN-wrapper | `space.xl` = 24 (content when open) | `Modifier.padding(start = 24.dp)` | `.padding(.leading, 24)` | `space.xl` |
| Visual | activeOpacity | RN-wrapper | `0.8` | `InteractionSource.collectIsPressedAsState()` → alpha | `.opacity(pressed ? 0.8 : 1)` | ESCALATE — `opacity.pressed = 0.8` |
| Icon | name | RN-wrapper | `'chevron-right'` | `Icons.Rounded.KeyboardArrowDown` | `Image(systemName: "chevron.right")` | n/a |
| Icon | size | RN-wrapper | `18` | `Modifier.size(18.dp)` | `.font(.system(size: 18))` | ESCALATE — propose `iconSize.chevron = 18` |
| Icon | weight | RN-wrapper | `'medium'` | (not applicable in Material Icons) | `.weight(.medium)` | n/a |
| Icon — color | RN-wrapper | `color.onSurface.muted` (fallback to onSurface.default) | `LaneShadowTheme.colors.onSurfaceMuted` | `theme.colors.onSurfaceMuted` | `color.onSurface.muted` |
| Animation | property | RN-wrapper | `transform: [{rotate: isOpen ? '90deg' : '0deg'}]` | `Modifier.rotate(if (isOpen) 90f else 0f)` | `.rotationEffect(.degrees(isOpen ? 90 : 0))` | n/a |
| Animation | duration | RN-wrapper | none (implicit) | use theme default (150ms) | `.animation(.default)` | ESCALATE — propose `motion.duration.default = 150` |
| Interaction | onPress | RN-wrapper | `TouchableOpacity` | `Modifier.clickable { ... }` | `.onTapGesture { ... }` | n/a |
| Typography | source | RN-wrapper | `ThemedText type="defaultSemiBold"` | `TextStyle(fontSize = 16.sp, fontWeight = 600, lineHeight = 24.sp)` | `.font(.system(size: 16, weight: .semibold))` | ESCALATE — `type.body.md`? no match |
| Typography — color | RN-wrapper | `color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |
| State | isOpen | RN-wrapper | `useState(false)` | `mutableStateOf(false)` | `@State private var isOpen = false` | n/a |

---

### ThemeFAB

**Source files read:**
- LaneShadow: `react-native/components/ui/fab.tsx`
- Framework: `node_modules/react-native-paper/src/components/FAB/FAB.tsx` (Paper FAB component)

> **Note:** This component wraps React Native Paper's FAB. Paper FAB is a fully-styled Material Design component; the RN wrapper only overrides backgroundColor, borderRadius, and color. For iOS, use SwiftUI's native floating action button patterns or replicate Material FAB geometry.

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | size | RN-wrapper | Paper FAB default (56×56 for standard FAB with icon only; larger with label) | `Modifier.size(56.dp)` | `.frame(width: 56, height: 56)` | ESCALATE — Paper FAB size; propose `size.fab = 56` |
| Layout | borderRadius | RN-wrapper | `radius.xl` = 24 | `RoundedCornerShape(24.dp)` | `RoundedRectangle(cornerRadius: 24)` | `radius.xl` |
| Visual — backgroundColor | RN-wrapper | `color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |
| Visual — color | RN-wrapper | `color.onSurface.default` (passed to Paper FAB `color` prop) | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |
| Visual — shadow | Paper FAB | Material elevation: 6dp (standard) | `Modifier.shadow(elevation = 6.dp)` | `.shadow(color:.black.opacity(0.2), radius: 8, y: 4)` | ESCALATE — propose `elevation[6]` for FAB |
| Icon | size | Paper FAB | 24 (Material icon size) | `Modifier.size(24.dp)` | `.font(.system(size: 24))` | ESCALATE — `iconSize.md = 24`? |
| Typography — label | source | Paper FAB | Material button label (14sp, medium) | `TextStyle(fontSize = 14.sp, fontWeight = 500)` | `.font(.system(size: 14, weight: .medium))` | `type.label.md` |
| Interaction | onPress | RN-wrapper | prop → Paper FAB onPress | `Modifier.clickable { ... }` | `.onTapGesture { ... }` | n/a |
| Interaction | visible | RN-wrapper | prop → Paper FAB visible | `Modifier.if (visible) { ... } else { .alpha(0f) }` | `.opacity(visible ? 1 : 0)` | n/a |
| Interaction | accessibilityRole | Paper FAB | `'button'` | `Modifier.semantics { role = Role.Button }` | `.accessibilityAddTraits(.isButton)` | n/a |
| Interaction | testID | RN-wrapper | prop → Paper FAB testID | `Modifier.testTag(testID)` | `.accessibilityIdentifier(testID)` | n/a |

## DESIGN NOTES

- Cover baseline states and typography or icon behavior explicitly so later molecules inherit stable primitives.
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
- UI-008

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
