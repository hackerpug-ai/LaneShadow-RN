# UI-042: iOS organisms 2/7 — route detail sheets: `ThemeRouteDetailsSheet`, `ThemeRouteTimeline`, `RouteDirectionsSheet`, `RouteOptionsSheet`, `PlanRideSheet`, `RouteDetailsSkeleton`

**Task ID:** UI-042
**Sprint:** Sprint 2 - UI Component Translation and Fidelity Sandbox
**Assigned To:** swift-implementer
**Reviewer:** swift-reviewer
**Estimate:** 720 min
**Type:** [FEATURE]
**Status:** Planned
**Phase:** Organisms
**Quality Score:** 115/115

---

## BACKGROUND

Sprint 2 translates the React Native baseline into native platform components and sandbox scenarios before rider-facing feature sprints resume. This task covers the `organisms` slice for `iOS organisms 2/7 — route detail sheets: ThemeRouteDetailsSheet, ThemeRouteTimeline, RouteDirectionsSheet, RouteOptionsSheet, PlanRideSheet, RouteDetailsSkeleton`.

**Objective:** Implement iOS organisms 2/7 — route detail sheets: `ThemeRouteDetailsSheet`, `ThemeRouteTimeline`, `RouteDirectionsSheet`, `RouteOptionsSheet`, `PlanRideSheet`, `RouteDetailsSkeleton` as SwiftUI work with parity to the RN baseline, token-only styling, and sandbox coverage.

**Success State:** A reviewer can open the iOS sandbox, browse this task's scenarios, and confirm naming, interface, theme, state, accessibility, and layout parity against RN.

## CRITICAL CONSTRAINTS

### MUST
- Implement the listed components or compositions with parity-aligned naming and interfaces: `ThemeRouteDetailsSheet`, `ThemeRouteTimeline`, `RouteDirectionsSheet`, `RouteOptionsSheet`, `PlanRideSheet`, `RouteDetailsSkeleton`.
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
**THEN** The listed components or compositions exist in the correct iOS SwiftUI directories with parity-aligned names and signatures: `ThemeRouteDetailsSheet`, `ThemeRouteTimeline`, `RouteDirectionsSheet`, `RouteOptionsSheet`, `PlanRideSheet`, `RouteDetailsSkeleton`.
**Verify:** `printf "%s\n" "`ThemeRouteDetailsSheet`, `ThemeRouteTimeline`, `RouteDirectionsSheet`, `RouteOptionsSheet`, `PlanRideSheet`, `RouteDetailsSkeleton`"`

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
| TC-1 | AC-1 | The listed components or compositions exist in the correct iOS SwiftUI directories with parity-aligned names and signatures: `ThemeRouteDetailsSheet`, `ThemeRouteTimeline`, `RouteDirectionsSheet`, `RouteOptionsSheet`, `PlanRideSheet`, `RouteDetailsSkeleton`. | `printf "%s\n" "`ThemeRouteDetailsSheet`, `ThemeRouteTimeline`, `RouteDirectionsSheet`, `RouteOptionsSheet`, `PlanRideSheet`, `RouteDetailsSkeleton`"` |
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
| ThemeRouteDetailsSheet | `react-native/components/sheets/route-details-sheet.tsx` | `node_modules/react-native-gesture-handler/src/gestures/ScrollView.tsx`; `node_modules/react-native-paper/src/components/Text.tsx` | `ios/LaneShadow/Views/Organisms/ThemeRouteDetailsSheet.swift` | 3 sections (header/rationale/stats/conditions) × save button shown/hidden |
| ThemeRouteTimeline | `react-native/components/sheets/route-timeline.tsx` | `node_modules/expo-linear-gradient/src/LinearGradient.tsx` | `ios/LaneShadow/Views/Organisms/ThemeRouteTimeline.swift` | Fixed layout × start/end points optional |
| RouteDirectionsSheet | `react-native/components/sheets/route-directions-sheet.tsx` | `node_modules/@gorhom/bottom-sheet/src/components/bottomSheetScrollView/BottomSheetScrollView.tsx`; `node_modules/react-native-paper/src/components/Text.tsx` | `ios/LaneShadow/Views/Organisms/RouteDirectionsSheet.swift` | 2 snap points (50%/90%) × legs with/without steps × leg selection |
| RouteOptionsSheet | `react-native/components/sheets/route-options-sheet.tsx` | `node_modules/react-native-gesture-handler/src/gestures/ScrollView.tsx`; `node_modules/react-native-paper/src/components/Text.tsx` | `ios/LaneShadow/Views/Organisms/RouteOptionsSheet.swift` | Multiple route options × favorite exclusion alert × save button shown/hidden |
| PlanRideSheet | `react-native/components/sheets/plan-ride-sheet.tsx` | `node_modules/@gorhom/bottom-sheet/src/components/bottomSheetScrollView/BottomSheetScrollView.tsx`; `node_modules/react-native-paper/src/components/Text.tsx` | `ios/LaneShadow/Views/Organisms/PlanRideSheet.swift` | 2 inputs (start/end) × preferences row × plan button enabled/disabled |
| RouteDetailsSkeleton | `react-native/components/skeleton/route-details-skeleton.tsx` | None (pure composition) | `ios/LaneShadow/Views/Organisms/RouteDetailsSkeleton.swift` | Configurable weatherCount × statRowCount × showRouteCard |

## STYLE PROPERTIES MATRIX

> Exhaustive enumeration of every style property from both sources per `08f-translation-protocol.md`. Columns: Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping. `ESCALATE` = no token covers the value — add a proposed token to DECISIONS.md before implementing.
>
> **Token reference** (from `tokens/semantic/semantic.tokens.json`): space xs=4 sm=8 md=12 lg=16 xl=24 2xl=32 3xl=48 4xl=64; radius none=0 sm=4 md=8 lg=16 xl=24 2xl=32 full=9999; elevation[2] shadowOffset=0/2 shadowOpacity=0.05 shadowRadius=4 androidElevation=2. **Paper labelLarge**: fontFamily=sans-serif-medium, fontWeight=500, fontSize=14, lineHeight=20, letterSpacing=0.1. **Paper labelSmall**: fontFamily=sans-serif-medium, fontWeight=500, fontSize=11, lineHeight=16, letterSpacing=0.5. **semantic.type.label.md**: fontSize=14, lineHeight=20, fontWeight=500. **semantic.type.body.sm**: fontSize=14, lineHeight=21, fontWeight=400.

### ThemeRouteDetailsSheet

**Source files read:**
- LaneShadow: `react-native/components/sheets/route-details-sheet.tsx`
- Framework: `node_modules/react-native-gesture-handler/src/gestures/ScrollView.tsx`, `node_modules/react-native-paper/src/components/Text.tsx`

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | container gap | RN-wrapper | hardcoded `16` | `Arrangement.spacedBy(16.dp)` | `spacing: 16` | `space.lg` ✓ |
| Layout | header flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| Layout | header justifyContent | RN-wrapper | `'space-between'` | `Arrangement.SpaceBetween` | `space-between` (HStack default) | n/a |
| Layout | header alignItems | RN-wrapper | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.alignment(.center)` | n/a |
| Layout | header paddingBottom | RN-wrapper | hardcoded `8` | `Modifier.padding(bottom = 8.dp)` | `.padding(.bottom, 8)` | `space.sm` ✓ |
| Layout | badge flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| Layout | badge gap | RN-wrapper | hardcoded `4` | `Arrangement.spacedBy(4.dp)` | `spacing: 4` | `space.xs` ✓ |
| Layout | badge paddingVertical | RN-wrapper | hardcoded `4` | `Modifier.padding(vertical = 4.dp)` | `.padding(.vertical, 4)` | `space.xs` ✓ |
| Layout | badge paddingHorizontal | RN-wrapper | hardcoded `10` | `Modifier.padding(horizontal = 10.dp)` | `.padding(.horizontal, 10)` | ESCALATE — `space.md - 2 = 10` |
| Layout | badge borderRadius | RN-wrapper | hardcoded `6` | `RoundedCornerShape(6.dp)` | `RoundedRectangle(cornerRadius: 6)` | ESCALATE — `radius.sm + 2 = 6` |
| Layout | badge backgroundColor | RN-wrapper | `${semantic.color.primary.default}1F` (12% alpha) | `LaneShadowTheme.colors.primary.copy(alpha = 0.12f)` | `theme.colors.primary.opacity(0.12)` | `color.primary.default` |
| Layout | section marginBottom | RN-wrapper | hardcoded `20` | `Modifier.padding(bottom = 20.dp)` | `.padding(.bottom, 20)` | ESCALATE — `space.xl - 4 = 20` |
| Layout | sectionLabel marginBottom | RN-wrapper | hardcoded `8` | `Modifier.padding(bottom = 8.dp)` | `.padding(.bottom, 8)` | `space.sm` ✓ |
| Layout | statsCard/conditionsCard borderRadius | RN-wrapper | hardcoded `12` | `RoundedCornerShape(12.dp)` | `RoundedRectangle(cornerRadius: 12)` | ESCALATE — `radius.lg - 4 = 12` |
| Layout | statsCard/conditionsCard padding | RN-wrapper | hardcoded `16` | `Modifier.padding(16.dp)` | `.padding(16)` | `space.lg` ✓ |
| Layout | statsCard/conditionsCard gap | RN-wrapper | hardcoded `12` | `Arrangement.spacedBy(12.dp)` | `spacing: 12` | `space.md` ✓ |
| Layout | statsCard/conditionsCard backgroundColor | RN-wrapper | `addOpacity(semantic.color.surface.default, 0.8)` | `LaneShadowTheme.colors.surface.copy(alpha = 0.8f)` | `theme.colors.surface.opacity(0.8)` | `color.surface.default` |
| Layout | conditionRow flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| Layout | conditionRow justifyContent | RN-wrapper | `'space-between'` | `Arrangement.SpaceBetween` | `space-between` | n/a |
| Layout | statusRow flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| Layout | statusRow gap | RN-wrapper | hardcoded `6` | `Arrangement.spacedBy(6.dp)` | `spacing: 6` | ESCALATE — `space.sm - 2 = 6` |
| Layout | actions paddingTop | RN-wrapper | hardcoded `8` | `Modifier.padding(top = 8.dp)` | `.padding(.top, 8)` | `space.sm` ✓ |
| Typography | titleLarge | RN-wrapper | Paper Text `variant="titleLarge"` | `MaterialTheme.typography.titleLarge` | `.font(.title)` | ESCALATE — `type.title.lg` |
| Typography | labelMedium | RN-wrapper | Paper Text `variant="labelMedium"` | `MaterialTheme.typography.labelMedium` | `.font(.caption)` | `type.label.md` ✓ |
| Typography | bodyMedium | RN-wrapper | Paper Text `variant="bodyMedium"` | `MaterialTheme.typography.bodyMedium` | `.font(.body)` | `type.body.md` ✓ |
| Typography | sectionLabel textTransform | RN-wrapper | `'uppercase'` | `text.uppercase()` | `.textCase(.uppercase)` | n/a |
| Typography | sectionLabel letterSpacing | RN-wrapper | hardcoded `0.5` | `LetterSpacing(0.5.sp)` | `.tracking(0.5)` | ESCALATE — `type.label.sm.letterSpacing = 0.5` |
| Typography | badgeText fontSize | RN-wrapper | hardcoded `12` | `12.sp` | `.font(.system(size: 12))` | ESCALATE — `type.label.xs.fontSize = 12` |
| Typography | badgeText fontWeight | RN-wrapper | hardcoded `'600'` | `FontWeight.SemiBold` | `.semibold` | ESCALATE — `fontWeight.semibold = 600` |
| Typography | badgeText textTransform | RN-wrapper | `'uppercase'` | `text.uppercase()` | `.textCase(.uppercase)` | n/a |
| Typography | badgeText letterSpacing | RN-wrapper | hardcoded `0.5` | `LetterSpacing(0.5.sp)` | `.tracking(0.5)` | ESCALATE — `type.label.xs.letterSpacing = 0.5` |
| Visual | rationale lineHeight | RN-wrapper | hardcoded `22` | `lineHeight = 22.sp` | `.lineSpacing(22 - fontSize)` | ESCALATE — `type.body.md.lineHeight` |

### ThemeRouteTimeline

**Source files read:**
- LaneShadow: `react-native/components/sheets/route-timeline.tsx`
- Framework: `node_modules/expo-linear-gradient/src/LinearGradient.tsx`

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | timelineContainer width | RN-wrapper | hardcoded `24` | `Modifier.width(24.dp)` | `.frame(width: 24)` | ESCALATE — `space.lg + space.sm = 16 + 8 = 24` |
| Layout | timelineContainer flexDirection | RN-wrapper | `'column'` | `Column(...)` | `VStack` | n/a |
| Layout | timelineContainer alignItems | RN-wrapper | `'center'` | `horizontalAlignment = Alignment.CenterHorizontally` | `.frame(maxWidth: .infinity).multilineTextAlignment(.center)` | n/a |
| Layout | timelineContainer paddingTop | RN-wrapper | `semantic.space.lg` = 16 | `Modifier.padding(top = 16.dp)` | `.padding(.top, 16)` | `space.lg` |
| Layout | timelineDot size (start/end) | RN-wrapper | `semantic.space.md` = 12 | `Modifier.size(12.dp)` | `.frame(width: 12, height: 12)` | `space.md` |
| Layout | timelineDot borderRadius | RN-wrapper | `semantic.radius.full` = 9999 | `CircleShape` | `Circle()` | `radius.full` |
| Layout | timelineLine width | RN-wrapper | hardcoded `2` | `Modifier.width(2.dp)` | `.frame(width: 2)` | ESCALATE — propose `borderWidth.thin = 1` (nearest) or `size.timelineLine = 2` |
| Layout | timelineLine flex | RN-wrapper | `flex: 1` | `Modifier.weight(1f)` | `LayoutPriority(1)` | n/a |
| Layout | timelineLine marginVertical | RN-wrapper | hardcoded `4` | `Modifier.padding(vertical = 4.dp)` | `.padding(.vertical, 4)` | `space.xs` ✓ |
| Layout | timelineLine borderRadius | RN-wrapper | hardcoded `9999` | `RoundedCornerShape(percent = 50)` | `Capsule()` | `radius.full` |
| Visual | startDot backgroundColor | RN-wrapper | `'transparent'` | `Color.Transparent` | `.clear` | n/a |
| Visual | startDot borderWidth | RN-wrapper | hardcoded `2` | `Modifier.border(2.dp, ...)` | `.strokeBorder(...lineWidth: 2)` | ESCALATE — `borderWidth.thick = 2` |
| Visual | startDot borderColor | RN-wrapper | `semantic.color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |
| Visual | endDot backgroundColor | RN-wrapper | `withAlpha(semantic.color.onSurface.muted, 0.5)` | `LaneShadowTheme.colors.onSurfaceMuted.copy(alpha = 0.5f)` | `theme.colors.onSurfaceMuted.opacity(0.5)` | `color.onSurface.muted` |
| Visual | gradient colors | RN-wrapper | `[primary.default, primary@0.5, onSurface.muted@0.3]` | `Brush.verticalGradient(...)` | `LinearGradient(...)` | `color.primary.default` |

### RouteDirectionsSheet

**Source files read:**
- LaneShadow: `react-native/components/sheets/route-directions-sheet.tsx`
- Framework: `node_modules/@gorhom/bottom-sheet/src/components/bottomSheetScrollView/BottomSheetScrollView.tsx`, `node_modules/react-native-paper/src/components/Text.tsx`

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | header paddingHorizontal | RN-wrapper | `semantic.space.lg` = 16 | `Modifier.padding(horizontal = 16.dp)` | `.padding(.horizontal, 16)` | `space.lg` |
| Layout | header paddingTop | RN-wrapper | `semantic.space.md` = 12 | `Modifier.padding(top = 12.dp)` | `.padding(.top, 12)` | `space.md` |
| Layout | header paddingBottom | RN-wrapper | `semantic.space.sm` = 8 | `Modifier.padding(bottom = 8.dp)` | `.padding(.bottom, 8)` | `space.sm` |
| Layout | header borderBottomWidth | RN-wrapper | hardcoded `1` | `Modifier.border(1.dp, ...)` | `.overlay(...stroke(...lineWidth: 1))` | ESCALATE — `borderWidth.thin = 1` |
| Layout | header borderBottomColor | RN-wrapper | `${semantic.color.border.default}33` (20% alpha) | `LaneShadowTheme.colors.border.copy(alpha = 0.2f)` | `theme.colors.border.opacity(0.2)` | `color.border.default` |
| Layout | legsContent paddingTop | RN-wrapper | hardcoded `12` | `Modifier.padding(top = 12.dp)` | `.padding(.top, 12)` | `space.md` ✓ |
| Layout | legsContent paddingBottom | RN-wrapper | hardcoded `120` | `Modifier.padding(bottom = 120.dp)` | `.padding(.bottom, 120)` | ESCALATE — propose `size.sheetFooterClearance = 120` |
| Layout | legSection marginBottom | RN-wrapper | hardcoded `16` | `Modifier.padding(bottom = 16.dp)` | `.padding(.bottom, 16)` | `space.lg` ✓ |
| Layout | legSectionHeader flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| Layout | legSectionHeader justifyContent | RN-wrapper | `'space-between'` | `Arrangement.SpaceBetween` | `space-between` | n/a |
| Layout | legSectionHeader marginBottom | RN-wrapper | hardcoded `8` | `Modifier.padding(bottom = 8.dp)` | `.padding(.bottom, 8)` | `space.sm` ✓ |
| Layout | stepCard borderRadius | RN-wrapper | hardcoded `8` | `RoundedCornerShape(8.dp)` | `RoundedRectangle(cornerRadius: 8)` | `radius.md` ✓ |
| Layout | stepCard borderWidth | RN-wrapper | hardcoded `1` | `Modifier.border(1.dp, ...)` | `.overlay(...stroke(...lineWidth: 1))` | ESCALATE — `borderWidth.thin = 1` |
| Layout | stepCard padding | RN-wrapper | hardcoded `12` | `Modifier.padding(12.dp)` | `.padding(12)` | `space.md` ✓ |
| Layout | stepCard backgroundColor | RN-wrapper | `${semantic.color.surface.default}E6` (90% alpha) | `LaneShadowTheme.colors.surface.copy(alpha = 0.9f)` | `theme.colors.surface.opacity(0.9)` | `color.surface.default` |
| Layout | stepCard borderColor | RN-wrapper | `${semantic.color.border.default}4D` (30% alpha) | `LaneShadowTheme.colors.border.copy(alpha = 0.3f)` | `theme.colors.border.opacity(0.3)` | `color.border.default` |
| Layout | stepCard marginBottom | RN-wrapper | `semantic.space.xs` = 4 or `semantic.space.md` = 12 | `Modifier.padding(bottom = ...)` | `.padding(.bottom, ...)` | `space.xs` / `space.md` |
| Layout | stepContent flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| Layout | stepContent alignItems | RN-wrapper | `'flex-start'` | `verticalAlignment = Alignment.Top` | `.alignment(.top)` | n/a |
| Layout | stepContent gap | RN-wrapper | hardcoded `12` | `Arrangement.spacedBy(12.dp)` | `spacing: 12` | `space.md` ✓ |
| Layout | stepNumber size | RN-wrapper | hardcoded `24 × 24` | `Modifier.size(24.dp)` | `.frame(width: 24, height: 24)` | `space.lg + space.sm = 24` |
| Layout | stepNumber borderRadius | RN-wrapper | hardcoded `12` | `RoundedCornerShape(12.dp)` | `RoundedRectangle(cornerRadius: 12)` | `radius.lg` ✓ |
| Layout | stepNumber backgroundColor | RN-wrapper | `${semantic.color.primary.default}1A` (10% alpha) | `LaneShadowTheme.colors.primary.copy(alpha = 0.1f)` | `theme.colors.primary.opacity(0.1)` | `color.primary.default` |
| Layout | stepNumber fontSize | RN-wrapper | hardcoded `12` | `12.sp` | `.font(.system(size: 12))` | ESCALATE — `type.label.xs.fontSize = 12` |
| Layout | stepNumber fontWeight | RN-wrapper | hardcoded `'700'` | `FontWeight.Bold` | `.bold` | ESCALATE — `fontWeight.bold = 700` |
| Layout | stepInfo gap | RN-wrapper | hardcoded `4` | `Arrangement.spacedBy(4.dp)` | `spacing: 4` | `space.xs` ✓ |
| Layout | stepMeta flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| Layout | stepMeta gap | RN-wrapper | hardcoded `4` | `Arrangement.spacedBy(4.dp)` | `spacing: 4` | `space.xs` ✓ |
| Layout | legCard borderRadius | RN-wrapper | hardcoded `12` | `RoundedCornerShape(12.dp)` | `RoundedRectangle(cornerRadius: 12)` | `radius.lg` ✓ |
| Layout | legCard borderWidth | RN-wrapper | hardcoded `1` | `Modifier.border(1.dp, ...)` | `.overlay(...stroke(...lineWidth: 1))` | ESCALATE — `borderWidth.thin = 1` |
| Layout | legCard padding | RN-wrapper | hardcoded `12` | `Modifier.padding(12.dp)` | `.padding(12)` | `space.md` ✓ |
| Layout | legCard gap | RN-wrapper | hardcoded `8` | `Arrangement.spacedBy(8.dp)` | `spacing: 8` | `space.sm` ✓ |
| Layout | legCard marginBottom | RN-wrapper | `semantic.space.sm` = 8 or `semantic.space.xl` = 24 | `Modifier.padding(bottom = ...)` | `.padding(.bottom, ...)` | `space.sm` / `space.xl` |
| Layout | legHeader flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| Layout | legHeader gap | RN-wrapper | hardcoded `8` | `Arrangement.spacedBy(8.dp)` | `spacing: 8` | `space.sm` ✓ |
| Layout | legNumber size | RN-wrapper | hardcoded `28 × 28` | `Modifier.size(28.dp)` | `.frame(width: 28, height: 28)` | ESCALATE — `space.xl + space.sm = 24 + 8 = 32` (nearest) or `space.lg + space.md = 28` |
| Layout | legNumber borderRadius | RN-wrapper | hardcoded `14` | `RoundedCornerShape(14.dp)` | `RoundedRectangle(cornerRadius: 14)` | ESCALATE — `radius.md + 6 = 14` |
| Layout | legNumber backgroundColor | RN-wrapper | `${semantic.color.primary.default}1A` (10% alpha) | `LaneShadowTheme.colors.primary.copy(alpha = 0.1f)` | `theme.colors.primary.opacity(0.1)` | `color.primary.default` |
| Layout | legStats flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| Layout | legStats gap | RN-wrapper | hardcoded `16` | `Arrangement.spacedBy(16.dp)` | `spacing: 16` | `space.lg` ✓ |
| Layout | statPair flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| Layout | statPair gap | RN-wrapper | hardcoded `4` | `Arrangement.spacedBy(4.dp)` | `spacing: 4` | `space.xs` ✓ |
| Layout | legLocations gap | RN-wrapper | hardcoded `4` | `Arrangement.spacedBy(4.dp)` | `spacing: 4` | `space.xs` ✓ |
| Layout | legLocations paddingLeft | RN-wrapper | hardcoded `4` | `Modifier.padding(start = 4.dp)` | `.padding(.leading, 4)` | `space.xs` ✓ |
| Layout | locationGroup flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| Layout | locationGroup gap | RN-wrapper | hardcoded `4` | `Arrangement.spacedBy(4.dp)` | `spacing: 4` | `space.xs` ✓ |
| Layout | legSummary gap | RN-wrapper | hardcoded `6` | `Arrangement.spacedBy(6.dp)` | `spacing: 6` | ESCALATE — `space.sm - 2 = 6` |
| Layout | legSummary paddingLeft | RN-wrapper | hardcoded `18` | `Modifier.padding(start = 18.dp)` | `.padding(.leading, 18)` | ESCALATE — `space.lg + space.xs = 18` |
| Layout | legDetails paddingLeft | RN-wrapper | hardcoded `18` | `Modifier.padding(start = 18.dp)` | `.padding(.leading, 18)` | `space.lg + space.xs = 18` |
| Layout | summaryCard gap | RN-wrapper | hardcoded `8` | `Arrangement.spacedBy(8.dp)` | `spacing: 8` | `space.sm` ✓ |
| Layout | summaryCard padding | RN-wrapper | hardcoded `8` | `Modifier.padding(8.dp)` | `.padding(8)` | `space.sm` ✓ |
| Layout | summaryCard borderRadius | RN-wrapper | hardcoded `8` | `RoundedCornerShape(8.dp)` | `RoundedRectangle(cornerRadius: 8)` | `radius.md` ✓ |
| Layout | summaryCard borderWidth | RN-wrapper | hardcoded `1` | `Modifier.border(1.dp, ...)` | `.overlay(...stroke(...lineWidth: 1))` | ESCALATE — `borderWidth.thin = 1` |
| Layout | summaryCard marginBottom | RN-wrapper | hardcoded `16` | `Modifier.padding(bottom = 16.dp)` | `.padding(.bottom, 16)` | `space.lg` ✓ |
| Layout | summaryCard backgroundColor | RN-wrapper | `${semantic.color.primary.default}0D` (5% alpha) | `LaneShadowTheme.colors.primary.copy(alpha = 0.05f)` | `theme.colors.primary.opacity(0.05)` | `color.primary.default` |
| Layout | summaryCard borderColor | RN-wrapper | `${semantic.color.primary.default}33` (20% alpha) | `LaneShadowTheme.colors.primary.copy(alpha = 0.2f)` | `theme.colors.primary.opacity(0.2)` | `color.primary.default` |
| Layout | footer paddingHorizontal | RN-wrapper | `semantic.space.lg` = 16 | `Modifier.padding(horizontal = 16.dp)` | `.padding(.horizontal, 16)` | `space.lg` |
| Layout | footer paddingTop | RN-wrapper | `semantic.space.md` = 12 | `Modifier.padding(top = 12.dp)` | `.padding(.top, 12)` | `space.md` |
| Layout | footer paddingBottom | RN-wrapper | `semantic.space.lg + insets.bottom` | `Modifier.padding(bottom = (16 + insets.bottom).dp)` | `.padding(.bottom, 16 + insets.bottom)` | `space.lg` + inset |
| Layout | footer borderTopWidth | RN-wrapper | hardcoded `1` | `Modifier.border(1.dp, ...)` | `.overlay(...stroke(...lineWidth: 1))` | ESCALATE — `borderWidth.thin = 1` |
| Layout | footer borderTopColor | RN-wrapper | `${semantic.color.border.default}33` (20% alpha) | `LaneShadowTheme.colors.border.copy(alpha = 0.2f)` | `theme.colors.border.opacity(0.2)` | `color.border.default` |
| Layout | footerButtons flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| Layout | footerButtons gap | RN-wrapper | hardcoded `8` | `Arrangement.spacedBy(8.dp)` | `spacing: 8` | `space.sm` ✓ |
| Typography | titleLarge fontWeight | RN-wrapper | hardcoded `'700'` | `FontWeight.Bold` | `.bold` | ESCALATE — `fontWeight.bold = 700` |
| Typography | labelMedium fontWeight | RN-wrapper | hardcoded `'600'` | `FontWeight.SemiBold` | `.semibold` | ESCALATE — `fontWeight.semibold = 600` |
| Typography | labelMedium textTransform | RN-wrapper | `'uppercase'` | `text.uppercase()` | `.textCase(.uppercase)` | n/a |
| Typography | labelMedium letterSpacing | RN-wrapper | hardcoded `0.5` | `LetterSpacing(0.5.sp)` | `.tracking(0.5)` | ESCALATE — `type.label.sm.letterSpacing = 0.5` |
| Typography | instruction lineHeight | RN-wrapper | hardcoded `20` | `lineHeight = 20.sp` | `.lineSpacing(20 - fontSize)` | ESCALATE — `type.body.md.lineHeight` |
| Typography | locationText lineHeight | RN-wrapper | hardcoded `18` | `lineHeight = 18.sp` | `.lineSpacing(18 - fontSize)` | ESCALATE — `type.body.md.lineHeight` |
| Typography | legSummaryText fontSize | RN-wrapper | hardcoded `12` | `12.sp` | `.font(.system(size: 12))` | ESCALATE — `type.label.xs.fontSize = 12` |
| Typography | legSummaryText lineHeight | RN-wrapper | hardcoded `16` | `lineHeight = 16.sp` | `.lineSpacing(16 - 12)` | ESCALATE — `type.label.xs.lineHeight = 16` |
| Typography | statText fontSize | RN-wrapper | hardcoded `12` | `12.sp` | `.font(.system(size: 12))` | ESCALATE — `type.label.xs.fontSize = 12` |
| Visual | legCard backgroundColor (selected) | RN-wrapper | `${semantic.color.primary.default}1A` (10% alpha) | `LaneShadowTheme.colors.primary.copy(alpha = 0.1f)` | `theme.colors.primary.opacity(0.1)` | `color.primary.default` |
| Visual | legCard borderColor (selected) | RN-wrapper | `semantic.color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |
| Visual | legCard backgroundColor (pressed) | RN-wrapper | `${semantic.color.surface.default}CC` (80% alpha) | `LaneShadowTheme.colors.surface.copy(alpha = 0.8f)` | `theme.colors.surface.opacity(0.8)` | `color.surface.default` |
| Visual | legCard backgroundColor (idle) | RN-wrapper | `${semantic.color.surface.default}E6` (90% alpha) | `LaneShadowTheme.colors.surface.copy(alpha = 0.9f)` | `theme.colors.surface.opacity(0.9)` | `color.surface.default` |
| Visual | legCard borderColor (idle) | RN-wrapper | `${semantic.color.border.default}4D` (30% alpha) | `LaneShadowTheme.colors.border.copy(alpha = 0.3f)` | `theme.colors.border.opacity(0.3)` | `color.border.default` |

### RouteOptionsSheet

**Source files read:**
- LaneShadow: `react-native/components/sheets/route-options-sheet.tsx`
- Framework: `node_modules/react-native-gesture-handler/src/gestures/ScrollView.tsx`, `node_modules/react-native-paper/src/components/Text.tsx`

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | header alignItems | RN-wrapper | `'center'` | `Modifier.align(Alignment.CenterHorizontally)` | `.frame(maxWidth: .infinity).multilineTextAlignment(.center)` | n/a |
| Layout | header paddingBottom | RN-wrapper | hardcoded `8` | `Modifier.padding(bottom = 8.dp)` | `.padding(.bottom, 8)` | `space.sm` ✓ |
| Layout | scrollView flex | RN-wrapper | `flex: 1` | `Modifier.fillMaxHeight()` | `.frame(maxHeight: .infinity)` | n/a |
| Layout | scrollView width | RN-wrapper | `'100%'` | `Modifier.fillMaxWidth()` | `.frame(maxWidth: .infinity)` | n/a |
| Layout | actions flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| Layout | actions justifyContent | RN-wrapper | `'space-between'` | `Arrangement.SpaceBetween` | `space-between` | n/a |
| Layout | actions alignItems | RN-wrapper | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.alignment(.center)` | n/a |
| Layout | actions paddingTop | RN-wrapper | hardcoded `16` | `Modifier.padding(top = 16.dp)` | `.padding(.top, 16)` | `space.lg` ✓ |
| Layout | actions gap | RN-wrapper | hardcoded `12` | `Arrangement.spacedBy(12.dp)` | `spacing: 12` | `space.md` ✓ |

### PlanRideSheet

**Source files read:**
- LaneShadow: `react-native/components/sheets/plan-ride-sheet.tsx`
- Framework: `node_modules/@gorhom/bottom-sheet/src/components/bottomSheetScrollView/BottomSheetScrollView.tsx`, `node_modules/react-native-paper/src/components/Text.tsx`

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | container gap | RN-wrapper | `semantic.space.lg` = 16 | `Arrangement.spacedBy(16.dp)` | `spacing: 16` | `space.lg` |
| Layout | container paddingHorizontal | RN-wrapper | `semantic.space.lg` = 16 | `Modifier.padding(horizontal = 16.dp)` | `.padding(.horizontal, 16)` | `space.lg` |
| Layout | container paddingTop | RN-wrapper | `semantic.space.md` = 12 | `Modifier.padding(top = 12.dp)` | `.padding(.top, 12)` | `space.md` |
| Layout | container paddingBottom | RN-wrapper | `semantic.space.lg` = 16 | `Modifier.padding(bottom = 16.dp)` | `.padding(.bottom, 16)` | `space.lg` |
| Layout | header flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| Layout | header justifyContent | RN-wrapper | `'space-between'` | `Arrangement.SpaceBetween` | `space-between` | n/a |
| Layout | header alignItems | RN-wrapper | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.alignment(.center)` | n/a |
| Layout | header paddingTop | RN-wrapper | hardcoded `24` | `Modifier.padding(top = 24.dp)` | `.padding(.top, 24)` | `space.xl` ✓ |
| Layout | inputsContainer gap | RN-wrapper | `semantic.space.md` = 12 | `Arrangement.spacedBy(12.dp)` | `spacing: 12` | `space.md` |
| Layout | inputRow flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| Layout | inputRow alignItems | RN-wrapper | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.alignment(.center)` | n/a |
| Layout | inputRow gap | RN-wrapper | hardcoded `16` | `Arrangement.spacedBy(16.dp)` | `spacing: 16` | `space.lg` ✓ |
| Layout | inputColumn flex | RN-wrapper | `flex: 1` | `Modifier.weight(1f)` | `LayoutPriority(1)` | n/a |
| Layout | inputColumn gap | RN-wrapper | `semantic.space.sm` = 8 | `Arrangement.spacedBy(8.dp)` | `spacing: 8` | `space.sm` |
| Layout | swapButtonContainer alignItems | RN-wrapper | `'center'` | `horizontalAlignment = Alignment.CenterHorizontally` | `.frame(maxWidth: .infinity).multilineTextAlignment(.center)` | n/a |
| Layout | swapButtonContainer justifyContent | RN-wrapper | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.alignment(.center)` | n/a |
| Layout | swapButtonContainer marginLeft | RN-wrapper | hardcoded `8` | `Modifier.padding(start = 8.dp)` | `.padding(.leading, 8)` | `space.sm` ✓ |
| Layout | swapButton size | RN-wrapper | hardcoded `40 × 40` | `Modifier.size(40.dp)` | `.frame(width: 40, height: 40)` | `space.2xl + space.sm = 40` ✓ |
| Layout | swapButton borderRadius | RN-wrapper | hardcoded `20` | `RoundedCornerShape(20.dp)` | `RoundedRectangle(cornerRadius: 20)` | ESCALATE — `radius.xl2 = 20` |
| Keyboard | hasTextInput | RN-wrapper | `hasTextInput={true}` (Gorhom prop) | `Modifier.imePadding()` on bottom sheet content | `.presentationDetents([.medium]).scrollDismissesKeyboard(.interactively)` | n/a |

### RouteDetailsSkeleton

**Source files read:**
- LaneShadow: `react-native/components/skeleton/route-details-skeleton.tsx`
- Framework: None (pure composition of LabelSkeleton, WeatherBadgeSkeleton, CardSkeleton)

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | container gap | RN-wrapper | `semantic.space.lg` = 16 | `Arrangement.spacedBy(16.dp)` | `spacing: 16` | `space.lg` |
| Layout | container paddingVertical | RN-wrapper | hardcoded `8` | `Modifier.padding(vertical = 8.dp)` | `.padding(.vertical, 8)` | `space.sm` ✓ |
| Layout | titleSection gap | RN-wrapper | `semantic.space.md` = 12 | `Arrangement.spacedBy(12.dp)` | `spacing: 12` | `space.md` |
| Layout | badgeRow flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| Layout | badgeRow gap | RN-wrapper | hardcoded `8` | `Arrangement.spacedBy(8.dp)` | `spacing: 8` | `space.sm` ✓ |
| Layout | section gap | RN-wrapper | hardcoded `8` | `Arrangement.spacedBy(8.dp)` | `spacing: 8` | `space.sm` ✓ |
| Layout | weatherStrip flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| Layout | weatherStrip gap | RN-wrapper | hardcoded `8` | `Arrangement.spacedBy(8.dp)` | `spacing: 8` | `space.sm` ✓ |
| Layout | weatherStrip flexWrap | RN-wrapper | `'wrap'` | `Modifier.wrapContentWidth(...)` (LazyRow) | `LazyVGrid` or wrap | n/a |
| Layout | statRow flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| Layout | statRow gap | RN-wrapper | `semantic.space.sm` = 8 | `Arrangement.spacedBy(8.dp)` | `spacing: 8` | `space.sm` |
| Layout | statRow alignItems | RN-wrapper | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.alignment(.center)` | n/a |
| Layout | statIcon size | RN-wrapper | hardcoded `18 × 18` | `Modifier.size(18.dp)` | `.frame(width: 18, height: 18)` | ESCALATE — `space.md + space.xs = 12 + 4 = 16` (nearest) |
| Layout | statIcon borderRadius | RN-wrapper | `semantic.radius.sm` = 4 | `RoundedCornerShape(4.dp)` | `RoundedRectangle(cornerRadius: 4)` | `radius.sm` |
| Visual | statIcon backgroundColor | RN-wrapper | `semantic.color.muted.default` | `LaneShadowTheme.colors.muted` | `theme.colors.muted` | `color.muted.default` |

## DESIGN NOTES

- Use deterministic composition fixtures so complex sheets, maps, chat, and stacked layouts remain diffable.
- Define detents, handles, scrim, keyboard avoidance, and safe-area behavior explicitly.
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
