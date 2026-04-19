# UI-038: iOS molecules 12/12 — offline, toasts, enrichment reveals: same component list (iOS naming)

**Task ID:** UI-038
**Sprint:** Sprint 2 - UI Component Translation and Fidelity Sandbox
**Assigned To:** swift-implementer
**Reviewer:** swift-reviewer
**Estimate:** 480 min
**Type:** [FEATURE]
**Status:** Planned
**Phase:** Molecules
**Quality Score:** 115/115

---

## BACKGROUND

Sprint 2 translates the React Native baseline into native platform components and sandbox scenarios before rider-facing feature sprints resume. This task covers the `molecules` slice for `iOS molecules 12/12 — offline, toasts, enrichment reveals: same component list (iOS naming)`.

**Objective:** Implement iOS molecules 12/12 — offline, toasts, enrichment reveals: same component list (iOS naming) as SwiftUI work with parity to the RN baseline, token-only styling, and sandbox coverage.

**Success State:** A reviewer can open the iOS sandbox, browse this task's scenarios, and confirm naming, interface, theme, state, accessibility, and layout parity against RN.

## CRITICAL CONSTRAINTS

### MUST
- Implement the listed components or compositions with parity-aligned naming and interfaces: same component list (iOS naming).
- Use only the LaneShadow core theme contract locked by `UI-001`: `tokens/semantic/semantic.tokens.json` as the source of truth, generated `native-theme` outputs as the shared packaging layer, and the platform theme entry points (`LaneShadowTheme` on Android, `.laneShadowTheme()` on iOS) for colors, spacing, typography, radii, elevation, and state styling.
- Register sandbox scenarios for default, interactive, and edge-case states with RN reference labels.
- Compose only from already-defined atoms on the same platform and preserve RN layout hierarchy.

### NEVER
- Add unrelated feature wiring or backend dependencies to satisfy sandbox rendering.
- Introduce hardcoded UI primitives or platform-only naming drift.

### STRICTLY
- Preserve light and dark parity, accessibility labels, and deterministic fixtures for every scenario.

## DELIVERABLES

- ios/LaneShadow/Views/Molecules/**
- ios/LaneShadow/Sandbox/Stories/MoleculesStories.swift — @MainActor enum with `static let all: [Story]`, aggregated into LaneShadowStories.all
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
- ios/LaneShadow/Views/Molecules/**
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
| RegionListItem | `react-native/components/offline/region-list-item.tsx` | `node_modules/react-native/Libraries/Components/Pressable/Pressable.js`; `node_modules/react-native/Libraries/Components/View/View.js` | `ios/LaneShadow/Views/Molecules/RegionListItem.swift` | 1 layout × 3 actions (view/edit/delete) × pressed state |
| RegionNameBottomSheet | `react-native/components/offline/region-name-bottom-sheet.tsx` | `node_modules/@gorhom/bottom-sheet/src/components/bottomSheet/BottomSheet.tsx`; `node_modules/react-native-paper/src/components/TextInput/TextInput.js` (via BottomSheetInput) | `ios/LaneShadow/Views/Molecules/RegionNameBottomSheet.swift` | 1 layout × WiFi/no-WiFi × enabled/disabled |
| RenameRegionBottomSheet | `react-native/components/offline/rename-region-bottom-sheet.tsx` | `node_modules/@gorhom/bottom-sheet`; `node_modules/react-hook-form` (zod validation) | `ios/LaneShadow/Views/Molecules/RenameRegionBottomSheet.swift` | 1 layout × validation error/no-error × unchanged/changed |
| DeleteConfirmationDialog | `react-native/components/offline/delete-confirmation-dialog.tsx` | `node_modules/react-native-paper/src/components/Dialog/Dialog.tsx` | `ios/LaneShadow/Views/Molecules/DeleteConfirmationDialog.swift` | 1 layout × 1 fixed state |
| ErrorToast | `react-native/components/toasts/error-toast.tsx` | `node_modules/react-native/Libraries/Components/View/View.js`; `node_modules/react-native-safe-area-context` | `ios/LaneShadow/Views/Molecules/ErrorToast.swift` | 1 layout × showCloseButton true/false |
| SuccessToast | `react-native/components/toasts/success-toast.tsx` | `node_modules/react-native/Libraries/Components/View/View.js`; `node_modules/react-native-safe-area-context` | `ios/LaneShadow/Views/Molecules/SuccessToast.swift` | 1 layout × showCloseButton true/false |
| InfoToast | `react-native/components/toasts/info-toast.tsx` | `node_modules/react-native/Libraries/Components/View/View.js`; `node_modules/react-native-safe-area-context` | `ios/LaneShadow/Views/Molecules/InfoToast.swift` | 1 layout × showCloseButton true/false |
| WarningToast | `react-native/components/toasts/warning-toast.tsx` | `node_modules/react-native/Libraries/Components/View/View.js`; `node_modules/react-native-safe-area-context` | `ios/LaneShadow/Views/Molecules/WarningToast.swift` | 1 layout × showCloseButton true/false |
| CreativeLabelFadeIn | `react-native/components/enrichment/creative-label-fade-in.tsx` | `node_modules/react-native-reanimated/src/Animated.js`; `node_modules/react-native/Libraries/Utilities/AccessibilityInfo/AccessibilityInfo.js` | `ios/LaneShadow/Views/Molecules/CreativeLabelFadeIn.swift` | 1 layout × visible/not-visible × with/without subtitle × reduce-motion |
| HighlightTagsStagger | `react-native/components/enrichment/highlight-tags-stagger.tsx` | `node_modules/react-native-reanimated/src/Animated.js`; `node_modules/react-native/Libraries/Utilities/AccessibilityInfo/AccessibilityInfo.js` | `ios/LaneShadow/Views/Molecules/HighlightTagsStagger.swift` | 1 layout × 0-N tags × reduce-motion |
| ProgressiveEnhancementToast | `react-native/components/enrichment/progressive-enhancement-toast.tsx` | `node_modules/react-native-reanimated/src/Animated.js`; `node_modules/react-native-safe-area-context` | `ios/LaneShadow/Views/Molecules/ProgressiveEnhancementToast.swift` | 1 layout × in-progress/complete/failed × reduce-motion |
| RationaleReveal | `react-native/components/enrichment/rationale-reveal.tsx` | `node_modules/react-native-reanimated/src/Animated.js`; `node_modules/react-native/Libraries/Utilities/AccessibilityInfo/AccessibilityInfo.js` | `ios/LaneShadow/Views/Molecules/RationaleReveal.swift` | 1 layout × expanded/collapsed × reduce-motion |
| EnrichmentStatusBadge | `react-native/components/enrichment/enrichment-status-badge.tsx` | `node_modules/react-native/Libraries/Components/View/View.js` | `ios/LaneShadow/Views/Molecules/EnrichmentStatusBadge.swift` | 4 statuses (draft/partial/complete/failed) × 2 sizes (small/medium) |

## STYLE PROPERTIES MATRIX

> Exhaustive enumeration of every style property from both sources per `08f-translation-protocol.md`. Columns: Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping. `ESCALATE` = no token covers the value — add a proposed token to DECISIONS.md before implementing.
>
> **Token reference** (from `tokens/semantic/semantic.tokens.json`): space xs=4 sm=8 md=12 lg=16 xl=24 2xl=32 3xl=48 4xl=64; radius none=0 sm=4 md=8 lg=16 xl=24 2xl=32 full=9999; elevation[4] shadowOffset=0/4 shadowOpacity=0.15 shadowRadius=8 shadowColor=#000000.

### RegionListItem

**Source files read:**
- LaneShadow: `react-native/components/offline/region-list-item.tsx`
- Framework: `node_modules/react-native/Libraries/Components/Pressable/Pressable.js`, `node_modules/react-native/Libraries/Components/View/View.js`

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | borderWidth | RN-wrapper | 1 | `Modifier.border(1.dp, ...)` | `.overlay(RoundedRectangle(...).stroke(..., lineWidth: 1))` | ESCALATE — propose `borderWidth.thin = 1` |
| Layout | backgroundColor | RN-wrapper | `semantic.color.card.default` | `LaneShadowTheme.colors.card` | `theme.colors.card` | `color.card.default` |
| Layout | borderColor | RN-wrapper | `semantic.color.border.default` | `LaneShadowTheme.colors.border` | `theme.colors.border` | `color.border.default` |
| Layout | borderRadius | RN-wrapper | `semantic.radius.lg` = 16 | `RoundedCornerShape(16.dp)` | `RoundedRectangle(cornerRadius: 16)` | `radius.lg` |
| Layout | padding | RN-wrapper | `semantic.space.lg` = 16 | `Modifier.padding(16.dp)` | `.padding(16)` | `space.lg` |
| Layout — info row | gap | RN-wrapper | `semantic.space.xs` = 4 | `Arrangement.spacedBy(4.dp)` | `Spacing(4)` | `space.xs` |
| Layout — info row | marginBottom | RN-wrapper | `semantic.space.xs` = 4 | `Modifier.padding(bottom = 4.dp)` | `.padding(.bottom, 4)` | `space.xs` |
| Layout — action row | gap | RN-wrapper | `semantic.space.md` = 12 | `Arrangement.spacedBy(12.dp)` | `Spacing(12)` | `space.md` |
| Layout — action row | marginTop | RN-wrapper | `semantic.space.md` = 12 | `Modifier.padding(top = 12.dp)` | `.padding(.top, 12)` | `space.md` |
| Layout — action row | paddingTop | RN-wrapper | `semantic.space.md` = 12 | `Modifier.padding(top = 12.dp)` | `.padding(.top, 12)` | `space.md` |
| Layout — action row | borderTopWidth | RN-wrapper | 1 | `Modifier.border(1.dp, ...)` | `.overlay(...)` | ESCALATE — `borderWidth.thin = 1` |
| Layout — action row | borderTopColor | RN-wrapper | `semantic.color.border.default` | `LaneShadowTheme.colors.border` | `theme.colors.border` | `color.border.default` |
| Layout — actionButton | paddingHorizontal | RN-wrapper | hardcoded 12 | `Modifier.padding(horizontal = 12.dp)` | `.padding(.horizontal, 12)` | `space.md` ✓ |
| Layout — actionButton | paddingVertical | RN-wrapper | `semantic.space.sm` = 8 | `Modifier.padding(vertical = 8.dp)` | `.padding(.vertical, 8)` | `space.sm` |
| Layout — actionButton | borderRadius | RN-wrapper | `semantic.radius.md` = 8 | `RoundedCornerShape(8.dp)` | `RoundedRectangle(cornerRadius: 8)` | `radius.md` |
| Layout — actionButton | gap | RN-wrapper | hardcoded 4 | `Arrangement.spacedBy(4.dp)` | `Spacing(4)` | `space.xs` ✓ |
| Typography — region name | variant | Paper | `titleMedium` | `MaterialTheme.typography.titleMedium` | `.font(.titleMedium)` | `type.title.md` |
| Typography — region name | color | RN-wrapper | `semantic.color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |
| Typography — region size | variant | Paper | `labelMedium` | `MaterialTheme.typography.labelMedium` | `.font(.labelMedium)` | `type.label.sm` |
| Typography — region size | color | RN-wrapper | `semantic.color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |
| Typography — details | variant | Paper | `bodySmall` | `MaterialTheme.typography.bodySmall` | `.font(.bodySmall)` | `type.body.sm` |
| Typography — details | color | RN-wrapper | `semantic.color.onSurface.muted` | `LaneShadowTheme.colors.onSurfaceMuted` | `theme.colors.onSurfaceMuted` | `color.onSurface.muted` |
| Visual — actionButton | backgroundColor (pressed) | RN-wrapper | `semantic.color.surfaceVariant.pressed` | `LaneShadowTheme.colors.surfaceVariantPressed` | `theme.colors.surfaceVariantPressed` | `color.surfaceVariant.pressed` |
| Visual — actionButton (delete) | backgroundColor (pressed) | RN-wrapper | `${danger.default}1A` (10% opacity) | `LaneShadowTheme.colors.danger.copy(alpha = 0.1f)` | `theme.colors.danger.opacity(0.1)` | `color.danger.default` |
| Interaction — icon | size | RN-wrapper | hardcoded 16 | `Modifier.size(16.dp)` | `.frame(width: 16, height: 16)` | ESCALATE — propose `iconSize.sm = 16` |

### RegionNameBottomSheet

**Source files read:**
- LaneShadow: `react-native/components/offline/region-name-bottom-sheet.tsx`
- Framework: `node_modules/@gorhom/bottom-sheet`, `node_modules/react-native-paper/src/components/TextInput/TextInput.js` (via BottomSheetInput), `react-native/components/sheets/bottom-sheet-wrapper.tsx`

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout — BottomSheetWrapper | Same as UI-035 DownloadErrorSheet | — | — | — | — | — |
| Layout — inputRow | gap | RN-wrapper | `semantic.space.sm` = 8 | `Arrangement.spacedBy(8.dp)` | `Spacing(8)` | `space.sm` |
| Layout — input | flex | RN-wrapper | 1 | `Modifier.weight(1f)` | `.frame(maxWidth: .infinity)` | n/a |
| Typography — title | variant | Paper | `titleMedium` | `MaterialTheme.typography.titleMedium` | `.font(.titleMedium)` | `type.title.md` |
| Typography — title | color | RN-wrapper | `semantic.color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |
| Typography — message | variant | Paper | `bodyMedium` | `MaterialTheme.typography.bodyMedium` | `.font(.bodyMedium)` | `type.body.md` |
| Typography — message | color | RN-wrapper | `semantic.color.onSurface.muted` | `LaneShadowTheme.colors.onSurfaceMuted` | `theme.colors.onSurfaceMuted` | `color.onSurface.muted` |
| Layout — character count | alignSelf | RN-wrapper | `'flex-end'` | `Modifier.align(Alignment.End)` | `.frame(maxWidth: .infinity, alignment: .trailing)` | n/a |
| Layout — character count | paddingBottom | RN-wrapper | hardcoded 8 | `Modifier.padding(bottom = 8.dp)` | `.padding(.bottom, 8)` | `space.sm` ✓ |
| Typography — character count | variant | Paper | `labelSmall` | `MaterialTheme.typography.labelSmall` | `.font(.labelSmall)` | `type.label.xs` |
| Typography — character count | color | RN-wrapper | `semantic.color.onSurface.subtle` | `LaneShadowTheme.colors.onSurfaceSubtle` | `theme.colors.onSurfaceSubtle` | `color.onSurface.subtle` |
| Layout — warning | backgroundColor | RN-wrapper | `${warning.default}1A` (10% opacity) | `LaneShadowTheme.colors.warning.copy(alpha = 0.1f)` | `theme.colors.warning.opacity(0.1)` | `color.warning.default` |
| Layout — warning | borderRadius | RN-wrapper | `semantic.radius.md` = 8 | `RoundedCornerShape(8.dp)` | `RoundedRectangle(cornerRadius: 8)` | `radius.md` |
| Layout — warning | padding | RN-wrapper | `semantic.space.md` = 12 | `Modifier.padding(12.dp)` | `.padding(12)` | `space.md` |
| Layout — warning | borderLeftWidth | RN-wrapper | hardcoded 3 | `Modifier.drawBehind { drawRoundRect(...).clip().translate(0.dp,0.dp) }` | `.overlay(Rectangle().stroke(..., lineWidth: 3))` | ESCALATE — propose `borderWidth.thick = 3` |
| Typography — warning | variant | Paper | `bodySmall` | `MaterialTheme.typography.bodySmall` | `.font(.bodySmall)` | `type.body.sm` |
| Typography — warning | color | RN-wrapper | `semantic.color.warning.default` | `LaneShadowTheme.colors.warning` | `theme.colors.warning` | `color.warning.default` |
| Layout — buttons | gap | RN-wrapper | `semantic.space.md` = 12 | `Arrangement.spacedBy(12.dp)` | `Spacing(12)` | `space.md` |
| Layout — buttons | flex | RN-wrapper | 1 | `Modifier.weight(1f)` | `.frame(maxWidth: .infinity)` | n/a |
| Interaction | maxLength | RN-wrapper | hardcoded 50 | `maxLength = 50` | `maxLength: 50` | n/a |
| Interaction | showSupportLink | RN-wrapper | `retryCount >= 3` | `if (retryCount >= 3)` | same | n/a |

### RenameRegionBottomSheet

**Source files read:**
- LaneShadow: `react-native/components/offline/rename-region-bottom-sheet.tsx`
- Framework: `node_modules/@gorhom/bottom-sheet`, `node_modules/react-hook-form`, `node_modules/zod` (validation), `node_modules/react-native-paper/src/components/TextInput/TextInput.js` (via BottomSheetInput)

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | Same as RegionNameBottomSheet | — | — | — | — | — |
| Interaction | validation | zod | `min(1), max(50)` | `validate { ... }` | `@State var validationError: String?` | n/a |
| Interaction | disabled | RN-wrapper | `isUnchanged || hasError` | `enabled = !isUnchanged && !hasError` | `.disabled(isUnchanged || hasError)` | n/a |
| Typography — error | variant | Paper | `bodySmall` | `MaterialTheme.typography.bodySmall` | `.font(.bodySmall)` | `type.body.sm` |
| Typography — error | color | RN-wrapper | `semantic.color.danger.default` | `LaneShadowTheme.colors.danger` | `theme.colors.danger` | `color.danger.default` |

### DeleteConfirmationDialog

**Source files read:**
- LaneShadow: `react-native/components/offline/delete-confirmation-dialog.tsx`
- Framework: `node_modules/react-native-paper/src/components/Dialog/Dialog.tsx`

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | backgroundColor | RN-wrapper | `semantic.color.surface.default` | `LaneShadowTheme.colors.surface` | `theme.colors.surface` | `color.surface.default` |
| Typography — title | style | Paper | `Dialog.Title` | `MaterialTheme.typography.headlineSmall` | `.alert .title` | ESCALATE — Paper Dialog title mapping |
| Typography — title | color | RN-wrapper | `semantic.color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |
| Typography — content | style | Paper | `Dialog.Content` | `MaterialTheme.typography.bodyMedium` | `.alert .message` | `type.body.md` |
| Typography — content | color | RN-wrapper | `semantic.color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |
| Interaction — cancel button | mode | Paper | `'text'` | `TextButton` | `.destructive` or `.cancel` | n/a |
| Interaction — cancel button | textColor | RN-wrapper | `semantic.color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |
| Interaction — confirm button | mode | Paper | `'text'` | `TextButton` | `.destructive` | n/a |
| Interaction — confirm button | textColor | RN-wrapper | `semantic.color.danger.default` | `LaneShadowTheme.colors.danger` | `theme.colors.danger` | `color.danger.default` |

### ErrorToast / SuccessToast / InfoToast / WarningToast

**Source files read:**
- LaneShadow: `react-native/components/toasts/{error,success,info,warning}-toast.tsx`
- Framework: `node_modules/react-native/Libraries/Components/View/View.js`, `node_modules/react-native-safe-area-context`

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | borderRadius | RN-wrapper | `semantic.radius.lg` = 16 | `RoundedCornerShape(16.dp)` | `RoundedRectangle(cornerRadius: 16)` | `radius.lg` |
| Layout | marginTop | RN-wrapper | `insets.top + semantic.space.sm` | `Modifier.padding(top = WindowInsets.statusBars.top + 8.dp)` | `.padding(.top, insets.top + 8)` | `space.sm` |
| Layout | marginHorizontal | RN-wrapper | `semantic.space.md` = 12 | `Modifier.padding(horizontal = 12.dp)` | `.padding(.horizontal, 12)` | `space.md` |
| Layout | padding | RN-wrapper | `semantic.space.md` = 12 | `Modifier.padding(12.dp)` | `.padding(12)` | `space.md` |
| Layout | gap | RN-wrapper | `semantic.space.xs` = 4 | `Arrangement.spacedBy(4.dp)` | `Spacing(4)` | `space.xs` |
| Visual — shadow | shadowColor | RN-wrapper | `#000000` | `shadowColor = Color.Black` | `.shadow(color:.black)` | n/a |
| Visual — shadow | shadowOffset | RN-wrapper | `{width: 0, height: 4}` | `shadowOffset = Offset(0.dp, 4.dp)` | `.y: 4` | n/a |
| Visual — shadow | shadowOpacity | RN-wrapper | 0.15 | `shadowOpacity = 0.15f` | `.opacity(0.15)` | ESCALATE — `opacity.shadow = 0.15` |
| Visual — shadow | shadowRadius | RN-wrapper | 8 | `shadowRadius = 8.dp` | `radius: 8` | ESCALATE — `shadow.radius = 8` |
| Visual — shadow | elevation | RN-wrapper | 4 | `elevation = 4.dp` | n/a | `elevation[4]` |
| Visual — backgroundColor (ErrorToast) | RN-wrapper | `semantic.color.danger.default` | `LaneShadowTheme.colors.danger` | `theme.colors.danger` | `color.danger.default` |
| Visual — backgroundColor (SuccessToast) | RN-wrapper | `semantic.color.success.default` | `LaneShadowTheme.colors.success` | `theme.colors.success` | `color.success.default` |
| Visual — backgroundColor (InfoToast) | RN-wrapper | `semantic.color.info.default` | `LaneShadowTheme.colors.info` | `theme.colors.info` | `color.info.default` |
| Visual — backgroundColor (WarningToast) | RN-wrapper | `semantic.color.warning.default` | `LaneShadowTheme.colors.warning` | `theme.colors.warning` | `color.warning.default` |
| Typography — title | variant | Paper | `titleSmall` | `MaterialTheme.typography.titleSmall` | `.font(.titleSmall)` | `type.title.sm` |
| Typography — title | color | RN-wrapper | `semantic.color.onPrimary.default` | `LaneShadowTheme.colors.onPrimary` | `theme.colors.onPrimary` | `color.onPrimary.default` |
| Typography — description | variant | Paper | `bodySmall` | `MaterialTheme.typography.bodySmall` | `.font(.bodySmall)` | `type.body.sm` |
| Typography — description | color | RN-wrapper | `semantic.color.onPrimary.default` | `LaneShadowTheme.colors.onPrimary` | `theme.colors.onPrimary` | `color.onPrimary.default` |
| Layout — header | gap | RN-wrapper | `semantic.space.sm` = 8 | `Arrangement.spacedBy(8.dp)` | `Spacing(8)` | `space.sm` |
| Layout — iconRow | gap | RN-wrapper | hardcoded 8 | `Arrangement.spacedBy(8.dp)` | `Spacing(8)` | `space.sm` ✓ |
| Interaction — icon | size | RN-wrapper | hardcoded 20 | `Modifier.size(20.dp)` | `.frame(width: 20, height: 20)` | ESCALATE — `iconSize.md = 20` |
| Interaction — close button | hitSlop | RN-wrapper | `{top:8, bottom:8, left:8, right:8}` | `Modifier.clickable(onClick, indication = null).size(40.dp)` | `.hitSlop(8)` | ESCALATE — `hitSlop.md = 8` |

### CreativeLabelFadeIn

**Source files read:**
- LaneShadow: `react-native/components/enrichment/creative-label-fade-in.tsx`
- Framework: `node_modules/react-native-reanimated/src/Animated.js`, `node_modules/react-native/Libraries/Utilities/AccessibilityInfo/AccessibilityInfo.js`

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Animation | fadeDuration | RN-wrapper | 300ms (default) | `animateFloatAsState(duration = 300)` | `.animation(.easeInOut(duration: 0.3))` | ESCALATE — `motion.duration.medium = 300` |
| Animation | staggerDelay | RN-wrapper | 100ms (default) | `delay(100)` | `.delay(0.1)` | ESCALATE — `motion.delay.stagger = 100` |
| Animation | highlightDuration | RN-wrapper | 500ms (default) | `animateFloatAsState(duration = 500)` | `.animation(.easeInOut(duration: 0.5))` | ESCALATE — `motion.duration.highlight = 500` |
| Animation | scale | RN-wrapper | 1.0 → 1.02 → 1.0 | `animateFloatAsState(1.02f)` | `.scaleEffect(1.02)` | ESCALATE — `motion.scale.highlight = 1.02` |
| Typography — label | style | RN-wrapper | `semantic.type.display.md` | `MaterialTheme.typography.displayMedium` | `.font(.system(size: 45))` | `type.display.md` (45/52/400) |
| Typography — label | color | RN-wrapper | `semantic.color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |
| Typography — subtitle | style | RN-wrapper | `semantic.type.body.md` | `MaterialTheme.typography.bodyMedium` | `.font(.body)` | `type.body.md` (14/21/400) |
| Typography — subtitle | color | RN-wrapper | `semantic.color.onSurface.muted` | `LaneShadowTheme.colors.onSurfaceMuted` | `theme.colors.onSurfaceMuted` | `color.onSurface.muted` |
| Layout — subtitle | marginTop | RN-wrapper | `semantic.space.xs` = 4 | `Modifier.padding(top = 4.dp)` | `.padding(.top, 4)` | `space.xs` |
| Accessibility | reduceMotion | RN-wrapper | `AccessibilityInfo.isReduceMotionEnabled()` | `LocalMotionDuration.current` | `@Environment(\.accessibilityReduceMotion)` | n/a |

### HighlightTagsStagger

**Source files read:**
- LaneShadow: `react-native/components/enrichment/highlight-tags-stagger.tsx`
- Framework: `node_modules/react-native-reanimated/src/Animated.js`, `node_modules/react-native/Libraries/Utilities/AccessibilityInfo/AccessibilityInfo.js`

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Animation | fadeDuration | RN-wrapper | 300ms (default) | `FadeIn.duration(300)` | `.opacity.animation(.easeInOut(duration: 0.3))` | ESCALATE — `motion.duration.medium = 300` |
| Animation | staggerDelay | RN-wrapper | 100ms (default) | `delay(index * 100)` | `.delay(Double(index) * 0.1)` | ESCALATE — `motion.delay.stagger = 100` |
| Animation | scaleDuration | RN-wrapper | 300ms (default) | `animateFloatAsState(duration = 300)` | `.animation(.easeOut(duration: 0.3))` | ESCALATE — `motion.duration.medium = 300` |
| Animation | scale | RN-wrapper | 0.95 → 1.0 | `animateFloatAsState(0.95f → 1f)` | `.scaleEffect(0.95).animation(...)` | ESCALATE — `motion.scale.pop = 0.95` |
| Layout — container | gap | RN-wrapper | hardcoded 8 | `Arrangement.spacedBy(8.dp)` | `Spacing(8)` | `space.sm` ✓ |
| Layout — tag | flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| Layout — tag | gap | RN-wrapper | hardcoded 4 | `Arrangement.spacedBy(4.dp)` | `Spacing(4)` | `space.xs` ✓ |
| Layout — tag | paddingHorizontal | RN-wrapper | `semantic.space.md` = 12 | `Modifier.padding(horizontal = 12.dp)` | `.padding(.horizontal, 12)` | `space.md` |
| Layout — tag | paddingVertical | RN-wrapper | `semantic.space.xs` = 4 | `Modifier.padding(vertical = 4.dp)` | `.padding(.vertical, 4)` | `space.xs` |
| Visual — tag | backgroundColor | RN-wrapper | `${primary.default}1A` (10% opacity) | `LaneShadowTheme.colors.primary.copy(alpha = 0.1f)` | `theme.colors.primary.opacity(0.1)` | `color.primary.default` |
| Visual — tag | borderColor | RN-wrapper | `${primary.default}4D` (30% opacity) | `LaneShadowTheme.colors.primary.copy(alpha = 0.3f)` | `theme.colors.primary.opacity(0.3)` | `color.primary.default` |
| Visual — tag | borderWidth | RN-wrapper | 1 | `Modifier.border(1.dp, ...)` | `.overlay(...)` | ESCALATE — `borderWidth.thin = 1` |
| Visual — tag | borderRadius | RN-wrapper | `semantic.radius.full` = 9999 | `CircleShape` / `RoundedCornerShape(percent = 50)` | `Capsule()` | `radius.full` |
| Typography — tag | style | RN-wrapper | `semantic.type.label.md` | `MaterialTheme.typography.labelMedium` | `.font(.labelMedium)` | `type.label.md` |
| Typography — tag | color | RN-wrapper | `semantic.color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |
| Typography — icon | fontSize | RN-wrapper | hardcoded 14 | `14.sp` | `.font(.system(size: 14))` | ESCALATE — `type.label.sm.fontSize = 14` |
| Accessibility | reduceMotion | RN-wrapper | `AccessibilityInfo.isReduceMotionEnabled()` | `LocalMotionDuration.current` | `@Environment(\.accessibilityReduceMotion)` | n/a |

### ProgressiveEnhancementToast

**Source files read:**
- LaneShadow: `react-native/components/enrichment/progressive-enhancement-toast.tsx`
- Framework: `node_modules/react-native-reanimated/src/Animated.js`, `node_modules/react-native-safe-area-context`

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | position | RN-wrapper | `absolute` | `Modifier.offset(...)` | `.position(...)` | n/a |
| Layout | top | RN-wrapper | hardcoded 80 | `Modifier.padding(top = 80.dp)` | `.offset(y: 80)` | ESCALATE — propose `space.enrichmentToastTop = 80` |
| Layout | alignSelf | RN-wrapper | `'center'` | `Modifier.align(Alignment.CenterHorizontally)` | `.frame(maxWidth: .infinity)` | n/a |
| Layout | maxWidth | RN-wrapper | hardcoded 400 | `Modifier.widthIn(max = 400.dp)` | `.frame(maxWidth: 400)` | ESCALATE — propose `size.enrichmentToastMaxWidth = 400` |
| Layout | padding | RN-wrapper | `semantic.space.lg` = 16 | `Modifier.padding(16.dp)` | `.padding(16)` | `space.lg` |
| Layout | gap | RN-wrapper | `semantic.space.md` = 12 | `Arrangement.spacedBy(12.dp)` | `Spacing(12)` | `space.md` |
| Visual | backgroundColor | RN-wrapper | `${card.default}CC` (80% opacity) | `LaneShadowTheme.colors.card.copy(alpha = 0.8f)` | `theme.colors.card.opacity(0.8)` | `color.card.default` |
| Visual | borderColor | RN-wrapper | `${primary.default}4D` (30% opacity) | `LaneShadowTheme.colors.primary.copy(alpha = 0.3f)` | `theme.colors.primary.opacity(0.3)` | `color.primary.default` |
| Visual | borderWidth | RN-wrapper | 1 | `Modifier.border(1.dp, ...)` | `.overlay(...)` | ESCALATE — `borderWidth.thin = 1` |
| Visual | borderRadius | RN-wrapper | `semantic.radius.lg` = 16 | `RoundedCornerShape(16.dp)` | `RoundedRectangle(cornerRadius: 16)` | `radius.lg` |
| Visual | elevation | RN-wrapper | `semantic.elevation[3]` | `Modifier.shadow(elevation = 3.dp)` | `.shadow(...)` | `elevation[3]` |
| Animation | enterDuration | RN-wrapper | 300ms | `FadeInDown.duration(300)` | `.transition(.asymmetric(insertion: .move(edge: .top).combined(with: .opacity), removal: .move(edge: .top).combined(with: .opacity)))` | ESCALATE — `motion.duration.medium = 300` |
| Animation | exitDuration | RN-wrapper | 300ms | `FadeOutUp.duration(300)` | same as enter | ESCALATE — `motion.duration.medium = 300` |
| Animation | progressDuration | RN-wrapper | 300ms | `animateFloatAsState(duration = 300)` | `.animation(.linear(duration: 0.3))` | ESCALATE — `motion.duration.fast = 300` |
| Layout — statusDot | size | RN-wrapper | hardcoded 8 | `Modifier.size(8.dp)` | `.frame(width: 8, height: 8)` | ESCALATE — propose `size.statusDot = 8` |
| Layout — statusDot | borderRadius | RN-wrapper | hardcoded 4 | `RoundedCornerShape(4.dp)` | `RoundedRectangle(cornerRadius: 4)` | `radius.sm` ✓ |
| Visual — statusDot | backgroundColor (failed) | RN-wrapper | `danger.default` | `LaneShadowTheme.colors.danger` | `theme.colors.danger` | `color.danger.default` |
| Visual — statusDot | backgroundColor (complete) | RN-wrapper | `enrichmentExtended.default` | `LaneShadowTheme.colors.enrichmentExtended` | `theme.colors.enrichmentExtended` | `color.enrichmentExtended.default` |
| Visual — statusDot | backgroundColor (in-progress) | RN-wrapper | `enrichmentFast.default` | `LaneShadowTheme.colors.enrichmentFast` | `theme.colors.enrichmentFast` | `color.enrichmentFast.default` |
| Typography — stage | style | RN-wrapper | `semantic.type.label.md` | `MaterialTheme.typography.labelMedium` | `.font(.labelMedium)` | `type.label.md` |
| Typography — stage | color | RN-wrapper | `semantic.color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |
| Layout — stageRow | gap | RN-wrapper | hardcoded 8 | `Arrangement.spacedBy(8.dp)` | `Spacing(8)` | `space.sm` ✓ |
| Layout — progressBar | height | RN-wrapper | hardcoded 4 | `Modifier.height(4.dp)` | `.frame(height: 4)` | ESCALATE — propose `size.progressBarHeight = 4` |
| Layout — progressBar | marginTop | RN-wrapper | `semantic.space.md` = 12 | `Modifier.padding(top = 12.dp)` | `.padding(.top, 12)` | `space.md` |
| Visual — progressBar | backgroundColor | RN-wrapper | `semantic.color.surfaceVariant.default` | `LaneShadowTheme.colors.surfaceVariant` | `theme.colors.surfaceVariant` | `color.surfaceVariant.default` |
| Visual — progressBar | borderRadius | RN-wrapper | `semantic.radius.sm` = 4 | `RoundedCornerShape(4.dp)` | `RoundedRectangle(cornerRadius: 4)` | `radius.sm` |
| Visual — progressFill | backgroundColor | RN-wrapper | status color | same as statusDot | same as statusDot | varies by status |
| Typography — percentage | style | RN-wrapper | `semantic.type.label.sm` | `MaterialTheme.typography.labelSmall` | `.font(.labelSmall)` | `type.label.sm` |
| Typography — percentage | color | RN-wrapper | `semantic.color.onSurface.muted` | `LaneShadowTheme.colors.onSurfaceMuted` | `theme.colors.onSurfaceMuted` | `color.onSurface.muted` |
| Typography — percentage | marginTop | RN-wrapper | `semantic.space.xs` = 4 | `Modifier.padding(top = 4.dp)` | `.padding(.top, 4)` | `space.xs` |
| Layout — dismissButton | size | RN-wrapper | hardcoded 44 | `Modifier.size(44.dp)` | `.frame(width: 44, height: 44)` | ESCALATE — `touchTarget.min = 44` |
| Layout — dismissButton | hitSlop | RN-wrapper | hardcoded 12 | `Modifier.clickable(...).size(44 + 12*2).pointerInteropFilter` | `.hitSlop(12)` | ESCALATE — `hitSlop.lg = 12` |

### RationaleReveal

**Source files read:**
- LaneShadow: `react-native/components/enrichment/rationale-reveal.tsx`
- Framework: `node_modules/react-native-reanimated/src/Animated.js`, `node_modules/react-native/Libraries/Utilities/AccessibilityInfo/AccessibilityInfo.js`

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Animation | fadeDuration | RN-wrapper | 300ms (default) | `FadeIn.duration(300)` | `.opacity.animation(.easeIn(duration: 0.3))` | ESCALATE — `motion.duration.medium = 300` |
| Animation | heightDuration | RN-wrapper | 300ms (default) | `animateFloatAsState(duration = 300)` | `.animation(.easeInOut(duration: 0.3))` | ESCALATE — `motion.duration.medium = 300` |
| Typography | style | RN-wrapper | `semantic.type.body.md` | `MaterialTheme.typography.bodyMedium` | `.font(.body)` | `type.body.md` |
| Typography | color | RN-wrapper | `semantic.color.onSurface.muted` | `LaneShadowTheme.colors.onSurfaceMuted` | `theme.colors.onSurfaceMuted` | `color.onSurface.muted` |
| Typography | numberOfLines (collapsed) | RN-wrapper | 3 (default) | `maxLines = 3` | `.lineLimit(3)` | n/a |
| Layout — toggle | alignSelf | RN-wrapper | `'flex-start'` | `Modifier.align(Alignment.Start)` | `.frame(maxWidth: .infinity, alignment: .leading)` | n/a |
| Layout — toggle | minHeight | RN-wrapper | hardcoded 44 | `Modifier.heightIn(min = 44.dp)` | `.frame(minHeight: 44)` | ESCALATE — `touchTarget.min = 44` |
| Layout — toggle | marginTop | RN-wrapper | `semantic.space.xs` = 4 | `Modifier.padding(top = 4.dp)` | `.padding(.top, 4)` | `space.xs` |
| Typography — toggle | style | RN-wrapper | `semantic.type.label.md` | `MaterialTheme.typography.labelMedium` | `.font(.labelMedium)` | `type.label.md` |
| Typography — toggle | color | RN-wrapper | `semantic.color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |
| Interaction — toggle | hitSlop | RN-wrapper | hardcoded 8 | `Modifier.clickable(...).pointerInteropFilter` | `.hitSlop(8)` | ESCALATE — `hitSlop.md = 8` |
| Accessibility | reduceMotion | RN-wrapper | `AccessibilityInfo.isReduceMotionEnabled()` | `LocalMotionDuration.current` | `@Environment(\.accessibilityReduceMotion)` | n/a |

### EnrichmentStatusBadge

**Source files read:**
- LaneShadow: `react-native/components/enrichment/enrichment-status-badge.tsx`
- Framework: `node_modules/react-native/Libraries/Components/View/View.js`

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| Layout | alignItems | RN-wrapper | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.alignment(.center)` | n/a |
| Layout | alignSelf | RN-wrapper | `'flex-start'` | `Modifier.align(Alignment.Start)` | `.frame(maxWidth: .infinity, alignment: .leading)` | n/a |
| Layout | gap | RN-wrapper | hardcoded 4 | `Arrangement.spacedBy(4.dp)` | `Spacing(4)` | `space.xs` ✓ |
| Visual | borderWidth | RN-wrapper | 1 | `Modifier.border(1.dp, ...)` | `.overlay(...)` | ESCALATE — `borderWidth.thin = 1` |
| Visual | backgroundColor | RN-wrapper | `${color}1A` (10% opacity) | `LaneShadowTheme.colors.[status].copy(alpha = 0.1f)` | `theme.colors.[status].opacity(0.1)` | varies by status |
| Visual | borderColor | RN-wrapper | `${color}4D` (30% opacity) | `LaneShadowTheme.colors.[status].copy(alpha = 0.3f)` | `theme.colors.[status].opacity(0.3)` | varies by status |
| Visual | borderRadius | RN-wrapper | `semantic.radius.lg` = 16 | `RoundedCornerShape(16.dp)` | `RoundedRectangle(cornerRadius: 16)` | `radius.lg` |
| Layout — smallPadding | paddingVertical | RN-wrapper | hardcoded 4 | `Modifier.padding(vertical = 4.dp)` | `.padding(.vertical, 4)` | ESCALATE — `space.xs = 4` ✓ |
| Layout — smallPadding | paddingHorizontal | RN-wrapper | hardcoded 8 | `Modifier.padding(horizontal = 8.dp)` | `.padding(.horizontal, 8)` | `space.sm` ✓ |
| Layout — mediumPadding | paddingVertical | RN-wrapper | hardcoded 6 | `Modifier.padding(vertical = 6.dp)` | `.padding(.vertical, 6)` | ESCALATE — propose `space.badgePaddingVertical = 6` |
| Layout — mediumPadding | paddingHorizontal | RN-wrapper | hardcoded 12 | `Modifier.padding(horizontal = 12.dp)` | `.padding(.horizontal, 12)` | `space.md` ✓ |
| Typography — small | style | RN-wrapper | `semantic.type.label.sm` | `MaterialTheme.typography.labelSmall` | `.font(.labelSmall)` | `type.label.sm` |
| Typography — medium | style | RN-wrapper | `semantic.type.label.md` | `MaterialTheme.typography.labelMedium` | `.font(.labelMedium)` | `type.label.md` |
| Typography | color | RN-wrapper | status color | `LaneShadowTheme.colors.[status]` | `theme.colors.[status]` | varies by status |
| Typography | marginLeft | RN-wrapper | `semantic.space.xs` = 4 | `Modifier.padding(start = 4.dp)` | `.padding(.leading, 4)` | `space.xs` |
| Interaction — icon | size (small) | RN-wrapper | hardcoded 14 | `Modifier.size(14.dp)` | `.frame(width: 14, height: 14)` | ESCALATE — `iconSize.sm = 14` |
| Interaction — icon | size (medium) | RN-wrapper | hardcoded 16 | `Modifier.size(16.dp)` | `.frame(width: 16, height: 16)` | ESCALATE — `iconSize.md = 16` |
| Visual — status colors | draft | RN-wrapper | `onSurface.subtle` | `LaneShadowTheme.colors.onSurfaceSubtle` | `theme.colors.onSurfaceSubtle` | `color.onSurface.subtle` |
| Visual — status colors | partial | RN-wrapper | `enrichmentFast.default` | `LaneShadowTheme.colors.enrichmentFast` | `theme.colors.enrichmentFast` | `color.enrichmentFast.default` |
| Visual — status colors | complete | RN-wrapper | `enrichmentExtended.default` | `LaneShadowTheme.colors.enrichmentExtended` | `theme.colors.enrichmentExtended` | `color.enrichmentExtended.default` |
| Visual — status colors | failed | RN-wrapper | `danger.default` | `LaneShadowTheme.colors.danger` | `theme.colors.danger` | `color.danger.default` |

## DESIGN NOTES

- Preserve RN spacing, composition hierarchy, and edge-case fixtures such as long labels, loading, and error states.
- Avoid default SwiftUI list, form, or navigation styling unless it is fully token-overridden and parity-approved.

## VERIFICATION GATES

- pnpm type-check:native
- swiftformat --lint ios/LaneShadow --config .swiftformat
- xcodebuild -workspace ios/LaneShadow.xcworkspace -scheme LaneShadow -destination "platform=iOS Simulator,name=iPhone 16" test
- Validate sandbox scenarios for this task in the native sandbox host

## DEPENDENCIES

- UI-014

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
