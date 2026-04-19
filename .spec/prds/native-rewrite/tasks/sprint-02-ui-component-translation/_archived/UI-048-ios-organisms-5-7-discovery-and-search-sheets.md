# UI-048: iOS organisms 5/7 — discovery & search sheets: `IntentSearchSheet`, `StateFilterSheet`

**Task ID:** UI-048
**Sprint:** Sprint 2 - UI Component Translation and Fidelity Sandbox
**Assigned To:** swift-implementer
**Reviewer:** swift-reviewer
**Estimate:** 240 min
**Type:** [FEATURE]
**Status:** Planned
**Phase:** Organisms
**Quality Score:** 115/115

---

## BACKGROUND

Sprint 2 translates the React Native baseline into native platform components and sandbox scenarios before rider-facing feature sprints resume. This task covers the `organisms` slice for `iOS organisms 5/7 — discovery & search sheets: IntentSearchSheet, StateFilterSheet`.

**Objective:** Implement iOS organisms 5/7 — discovery & search sheets: `IntentSearchSheet`, `StateFilterSheet` as SwiftUI work with parity to the RN baseline, token-only styling, and sandbox coverage.

**Success State:** A reviewer can open the iOS sandbox, browse this task's scenarios, and confirm naming, interface, theme, state, accessibility, and layout parity against RN.

## CRITICAL CONSTRAINTS

### MUST
- Implement the listed components or compositions with parity-aligned naming and interfaces: `IntentSearchSheet`, `StateFilterSheet`.
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
**THEN** The listed components or compositions exist in the correct iOS SwiftUI directories with parity-aligned names and signatures: `IntentSearchSheet`, `StateFilterSheet`.
**Verify:** `printf "%s\n" "`IntentSearchSheet`, `StateFilterSheet`"`

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
| TC-1 | AC-1 | The listed components or compositions exist in the correct iOS SwiftUI directories with parity-aligned names and signatures: `IntentSearchSheet`, `StateFilterSheet`. | `printf "%s\n" "`IntentSearchSheet`, `StateFilterSheet`"` |
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
| IntentSearchSheet | `react-native/components/discovery/intent-search-sheet.tsx` | `node_modules/react-native/Libraries/Components/View/View.js` (View); `node_modules/react-native-paper/src/components/Typography/Text.js` (titleLarge, bodyMedium, bodyLarge, bodySmall); `node_modules/react-native/Libraries/Components/ActivityIndicator/ActivityIndicator.js` | `ios/LaneShadow/Views/Organisms/IntentSearchSheet.swift` | 5 states (idle/cache_hit/searching/offline_unsupported/results) × 1 fixed size |
| StateFilterSheet | `react-native/components/discovery/state-filter-sheet.tsx` | `node_modules/react-native/Libraries/Lists/FlatList/FlatList.js` (FlatList); `node_modules/@gorhom/bottom-sheet/src/components/bottomSheetTextInput/BottomSheetTextInput.tsx` (via BottomSheetInput); `node_modules/react-native/Libraries/Components/ScrollView/ScrollView.js` (horizontal chips) | `ios/LaneShadow/Views/Organisms/StateFilterSheet.swift` | 2 states (has selection/empty) × 1 fixed size × searchable |

## STYLE PROPERTIES MATRIX

> Exhaustive enumeration of every style property from both sources per `08f-translation-protocol.md`. Columns: Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping. `ESCALATE` = no token covers the value — add a proposed token to DECISIONS.md before implementing.
>
> **Token reference** (from `tokens/semantic/semantic.tokens.json`): space xs=4 sm=8 md=12 lg=16 xl=24 2xl=32 3xl=48 4xl=64; radius none=0 sm=4 md=8 lg=16 xl=24 2xl=32 full=9999; elevation[2] shadowOffset=0/2 shadowOpacity=0.05 shadowRadius=4 androidElevation=2. **Paper labelLarge**: fontFamily=sans-serif-medium, fontWeight=500, fontSize=14, lineHeight=20, letterSpacing=0.1. **Paper labelSmall**: fontFamily=sans-serif-medium, fontWeight=500, fontSize=11, lineHeight=16, letterSpacing=0.5. **semantic.type.label.md**: fontSize=14, lineHeight=20, fontWeight=500. **semantic.type.body.sm**: fontSize=14, lineHeight=21, fontWeight=400.

### IntentSearchSheet

**Source files read:**
- LaneShadow: `react-native/components/discovery/intent-search-sheet.tsx`
- Framework: `node_modules/react-native/Libraries/Components/View/View.js`, `node_modules/react-native-paper/src/components/Typography/Text.js`, `node_modules/react-native/Libraries/Components/ActivityIndicator/ActivityIndicator.js`
- Dependencies: `react-native/components/sheets/bottom-sheet-wrapper.tsx`, `react-native/components/ui/button.tsx`, `react-native/components/ui/icon-symbol.tsx`, `react-native/components/discovery/intent-summary-pill.tsx`

**Layout — container:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| flex | RN-wrapper | `1` | `Modifier.fillMaxSize()` | `.frame(maxWidth: .infinity, maxHeight: .infinity)` | n/a |
| gap | RN-wrapper | `16` | `Arrangement.spacedBy(16.dp)` | `Spacer(minLength: 16)` or `.padding(16)` | `space.xl` ✓ |

**Layout — header:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| gap | RN-wrapper | `4` | `Arrangement.spacedBy(4.dp)` | `Spacer(minLength: 4)` | `space.xs` ✓ |
| paddingBottom | RN-wrapper | `16` | `Modifier.padding(bottom = 16.dp)` | `.padding(.bottom, 16)` | `space.xl` ✓ |
| borderBottomWidth | RN-wrapper | `1` | `Modifier.border(1.dp, ...)` | `.overlay(RoundedRectangle(...).stroke(..., lineWidth: 1))` | ESCALATE — propose `borderWidth.thin = 1` |
| borderColor | RN-wrapper | `semantic.color.border.default` | `LaneShadowTheme.colors.border` | `theme.colors.border` | `color.border.default` |

**Typography — header title:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| variant | Paper | `titleLarge` | `MaterialTheme.typography.titleLarge` | `.font(.title)` (custom) | ESCALATE — Paper titleLarge not in tokens; map to `type.heading.lg` |
| fontSize | Paper titleLarge | 22 | `22.sp` | `22` | ESCALATE — propose `type.heading.lg.fontSize = 22` |
| fontWeight | Paper titleLarge | `'400'` (regular) | `FontWeight.Normal` | `.regular` | `type.heading.lg.fontWeight` |
| lineHeight | Paper titleLarge | 28 | `28.sp` | `.lineSpacing(28 - 22)` = 6 | `type.heading.lg.lineHeight` |
| color | RN-wrapper | `semantic.color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |

**Typography — header subtitle:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| variant | Paper | `bodyMedium` | `MaterialTheme.typography.bodyMedium` | `.font(.body)` | ESCALATE — Paper bodyMedium not in tokens; map to `type.body.sm` |
| fontSize | Paper bodyMedium | 14 | `14.sp` | `14` | `type.body.sm.fontSize` ✓ |
| fontWeight | Paper bodyMedium | `'400'` | `FontWeight.Normal` | `.regular` | `type.body.sm.fontWeight` ✓ |
| lineHeight | Paper bodyMedium | 20 | `20.sp` | `.lineSpacing(20 - 14)` = 6 | `type.body.sm.lineHeight` ✓ |
| color | RN-wrapper | `semantic.color.onSurface.muted` | `LaneShadowTheme.colors.onSurfaceMuted` | `theme.colors.onSurfaceMuted` | `color.onSurface.muted` |

**Layout — input row:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| alignItems | RN-wrapper | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.alignment(.center)` | n/a |
| height | RN-wrapper | `48` | `Modifier.height(48.dp)` | `.frame(height: 48)` | ESCALATE — propose `size.inputHeight = 48` |
| paddingHorizontal | RN-wrapper | `12` | `Modifier.padding(horizontal = 12.dp)` | `.padding(.horizontal, 12)` | `space.md` ✓ |
| backgroundColor | RN-wrapper | `semantic.color.surface.default` | `LaneShadowTheme.colors.surface` | `theme.colors.surface` | `color.surface.default` |
| borderRadius | RN-wrapper | `semantic.radius.lg` = 16 | `RoundedCornerShape(16.dp)` | `RoundedRectangle(cornerRadius: 16)` | `radius.lg` ✓ |
| borderWidth | RN-wrapper | `1` | `Modifier.border(1.dp, ...)` | `.overlay(RoundedRectangle(...).stroke(..., lineWidth: 1))` | ESCALATE — propose `borderWidth.thin = 1` |
| borderColor | RN-wrapper | `semantic.color.border.default` | `LaneShadowTheme.colors.border` | `theme.colors.border` | `color.border.default` |

**Layout — input container (icon + text):**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| flex | RN-wrapper | `1` | `Modifier.weight(1f)` | `.frame(maxWidth: .infinity)` | n/a |
| gap | RN-wrapper | `8` | `Arrangement.spacedBy(8.dp)` | `Spacer(minLength: 8)` | `space.sm` ✓ |

**Visual — search icon:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| size | RN-wrapper | `20` | `20.dp` | `20` | ESCALATE — propose `icon.sm = 20` |
| color | RN-wrapper | `semantic.color.onSurface.muted` | `LaneShadowTheme.colors.onSurfaceMuted` | `theme.colors.onSurfaceMuted` | `color.onSurface.muted` |
| marginLeft | RN-wrapper | `4` | `Modifier.padding(start = 4.dp)` | `.padding(.leading, 4)` | `space.xs` ✓ |

**Visual — input text:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| variant | Paper | `bodyLarge` | `MaterialTheme.typography.bodyLarge` | `.font(.body)` | ESCALATE — Paper bodyLarge not in tokens; map to `type.body.md` |
| fontSize | Paper bodyLarge | 16 | `16.sp` | `16` | `type.body.md.fontSize` ✓ |
| fontWeight | Paper bodyLarge | `'400'` | `FontWeight.Normal` | `.regular` | `type.body.md.fontWeight` ✓ |
| lineHeight | Paper bodyLarge | 24 | `24.sp` | `.lineSpacing(24 - 16)` = 8 | `type.body.md.lineHeight` ✓ |
| color (has query) | RN-wrapper | `semantic.color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |
| color (placeholder) | RN-wrapper | `semantic.color.onSurface.subtle` | `LaneShadowTheme.colors.onSurfaceSubtle` | `theme.colors.onSurfaceSubtle` | `color.onSurface.subtle` |

**Layout — clear button:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| size | RN-wrapper | `32 × 32` | `Modifier.size(32.dp)` | `.frame(width: 32, height: 32)` | `space.xl + space.sm` (composed) = 32 ✓ |

**Layout — loading container:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| alignItems | RN-wrapper | `'center'` | `Modifier.align(Alignment.CenterHorizontally)` | `.frame(maxWidth: .infinity)` + `HStack` center | n/a |
| gap | RN-wrapper | `semantic.space.md` = 12 | `Arrangement.spacedBy(12.dp)` | `Spacer(minLength: 12)` | `space.md` ✓ |
| paddingVertical | RN-wrapper | `32` | `Modifier.padding(vertical = 32.dp)` | `.padding(.vertical, 32)` | `space.xl + space.md` (composed) = 40, closest `space.2xl` = 32 ✓ |

**Visual — activity indicator:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| size | RN-wrapper | `'large'` | `Modifier.size(48.dp)` (Compose large=48) | `48` | ESCALATE — propose `size.activityIndicator.large = 48` |
| color | RN-wrapper | `semantic.color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |

**Typography — loading message:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| variant (primary) | Paper | `bodyLarge` | `MaterialTheme.typography.bodyLarge` | `.font(.body)` | `type.body.md` ✓ |
| textAlign | RN-wrapper | `'center'` | `textAlign = TextAlign.Center` | `.multilineTextAlignment(.center)` | n/a |
| variant (secondary) | Paper | `bodySmall` | `MaterialTheme.typography.bodySmall` | `.font(.caption)` | ESCALATE — Paper bodySmall not in tokens; map to `type.body.xs` |
| fontSize | Paper bodySmall | 12 | `12.sp` | `12` | ESCALATE — propose `type.body.xs.fontSize = 12` |
| lineHeight | Paper bodySmall | 16 | `16.sp` | `.lineSpacing(16 - 12)` = 4 | ESCALATE — propose `type.body.xs.lineHeight = 16` |

**Layout — offline container:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| gap | RN-wrapper | `semantic.space.lg` = 16 | `Arrangement.spacedBy(16.dp)` | `Spacer(minLength: 16)` | `space.lg` ✓ |

**Layout — empty state:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| alignItems | RN-wrapper | `'center'` | `Modifier.align(Alignment.CenterHorizontally)` | `.frame(maxWidth: .infinity)` + center | n/a |
| gap | RN-wrapper | `semantic.space.md` = 12 | `Arrangement.spacedBy(12.dp)` | `Spacer(minLength: 12)` | `space.md` ✓ |
| paddingHorizontal | RN-wrapper | `24` | `Modifier.padding(horizontal = 24.dp)` | `.padding(.horizontal, 24)` | ESCALATE — `space.xl = 24` ✓ |

**Visual — offline icon:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| size | RN-wrapper | `48` | `48.dp` | `48` | `space.3xl` ✓ |
| color | RN-wrapper | `semantic.color.onSurface.subtle` | `LaneShadowTheme.colors.onSurfaceSubtle` | `theme.colors.onSurfaceSubtle` | `color.onSurface.subtle` |

**Layout — chips scroll container:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| horizontal | RN-wrapper | `true` | `LazyRow(...)` (horizontal) | `.scrollContentBackground(.hidden)` + `.horizontal` | n/a |
| showsHorizontalScrollIndicator | RN-wrapper | `false` | `LazyRow(..., userScrollEnabled = true)` | `.scrollIndicators(.hidden)` | n/a |
| gap | RN-wrapper | `semantic.space.sm` = 8 | `Arrangement.spacedBy(8.dp)` | `Spacer(minLength: 8)` | `space.sm` ✓ |
| paddingHorizontal | RN-wrapper | `16` | `Modifier.padding(horizontal = 16.dp)` | `.padding(.horizontal, 16)` | `space.lg` ✓ |
| paddingVertical | RN-wrapper | `8` | `Modifier.padding(vertical = 8.dp)` | `.padding(.vertical, 8)` | `space.sm` ✓ |

**Layout — chip:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| backgroundColor | RN-wrapper | `semantic.color.surfaceVariant.default` | `LaneShadowTheme.colors.surfaceVariant` | `theme.colors.surfaceVariant` | `color.surfaceVariant.default` |
| borderRadius | RN-wrapper | `semantic.radius.full` = 9999 | `CircleShape` | `Capsule()` | `radius.full` ✓ |
| borderWidth | RN-wrapper | `1` | `Modifier.border(1.dp, ...)` | `.overlay(Capsule().stroke(..., lineWidth: 1))` | ESCALATE — propose `borderWidth.thin = 1` |
| borderColor | RN-wrapper | `semantic.color.border.default` | `LaneShadowTheme.colors.border` | `theme.colors.border` | `color.border.default` |
| paddingHorizontal | RN-wrapper | `16` | `Modifier.padding(horizontal = 16.dp)` | `.padding(.horizontal, 16)` | `space.lg` ✓ |
| paddingVertical | RN-wrapper | `8` | `Modifier.padding(vertical = 8.dp)` | `.padding(.vertical, 8)` | `space.sm` ✓ |

**Typography — chip text:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| variant | Paper | `labelMedium` | `MaterialTheme.typography.labelMedium` | `.font(.subheadline)` | ESCALATE — Paper labelMedium not in tokens; map to `type.label.sm` |
| fontSize | Paper labelMedium | 12 | `12.sp` | `12` | ESCALATE — propose `type.label.sm.fontSize = 12` |
| fontWeight | Paper labelMedium | `'500'` | `FontWeight.Medium` | `.medium` | `type.label.sm.fontWeight` ✓ |
| lineHeight | Paper labelMedium | 16 | `16.sp` | `.lineSpacing(16 - 12)` = 4 | ESCALATE — propose `type.label.sm.lineHeight = 16` |
| color | RN-wrapper | `semantic.color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |

---

### StateFilterSheet

**Source files read:**
- LaneShadow: `react-native/components/discovery/state-filter-sheet.tsx`
- Framework: `node_modules/react-native/Libraries/Lists/FlatList/FlatList.js`, `node_modules/react-native/Libraries/Components/ScrollView/ScrollView.js`
- Dependencies: `react-native/components/sheets/bottom-sheet-wrapper.tsx`, `react-native/components/ui/bottom-sheet-input.tsx`, `react-native/components/discovery/state-list-item.tsx`

**Layout — container:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| flex | RN-wrapper | `1` | `Modifier.fillMaxSize()` | `.frame(maxWidth: .infinity, maxHeight: .infinity)` | n/a |
| gap | RN-wrapper | `16` | `Arrangement.spacedBy(16.dp)` or `Column(verticalArrangement = Arrangement.spacedBy(16.dp))` | `Spacer(minLength: 16)` or `.padding(16)` | `space.xl` ✓ |

**Layout — header:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| gap | RN-wrapper | `4` | `Arrangement.spacedBy(4.dp)` | `Spacer(minLength: 4)` | `space.xs` ✓ |
| paddingBottom | RN-wrapper | `16` | `Modifier.padding(bottom = 16.dp)` | `.padding(.bottom, 16)` | `space.xl` ✓ |
| borderBottomWidth | RN-wrapper | `1` | `Modifier.border(1.dp, ...)` | `.overlay(RoundedRectangle(...).stroke(..., lineWidth: 1))` | ESCALATE — propose `borderWidth.thin = 1` |
| borderColor | RN-wrapper | `semantic.color.border.default` | `LaneShadowTheme.colors.border` | `theme.colors.border` | `color.border.default` |

**Typography — header title:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| variant | Paper | `titleLarge` | `MaterialTheme.typography.titleLarge` | `.font(.title)` | ESCALATE — Paper titleLarge; map to `type.heading.lg` |
| color | RN-wrapper | `semantic.color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |

**Typography — header subtitle:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| variant | Paper | `bodyMedium` | `MaterialTheme.typography.bodyMedium` | `.font(.body)` | `type.body.sm` ✓ |
| color | RN-wrapper | `semantic.color.onSurface.muted` | `LaneShadowTheme.colors.onSurfaceMuted` | `theme.colors.onSurfaceMuted` | `color.onSurface.muted` |

**Layout — list:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| flex | RN-wrapper | `1` | `Modifier.fillMaxSize()` | `.frame(maxWidth: .infinity, maxHeight: .infinity)` | n/a |
| showsVerticalScrollIndicator | RN-wrapper | `true` | `LazyColumn(..., userScrollEnabled = true)` | `.scrollIndicators(.visible)` | n/a |

**Layout — empty container:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| alignItems | RN-wrapper | `'center'` | `Modifier.align(Alignment.CenterHorizontally)` | `.frame(maxWidth: .infinity)` + center | n/a |
| gap | RN-wrapper | `semantic.space.md` = 12 | `Arrangement.spacedBy(12.dp)` | `Spacer(minLength: 12)` | `space.md` ✓ |
| paddingVertical | RN-wrapper | `48` | `Modifier.padding(vertical = 48.dp)` | `.padding(.vertical, 48)` | `space.3xl` ✓ |
| paddingHorizontal | RN-wrapper | `24` | `Modifier.padding(horizontal = 24.dp)` | `.padding(.horizontal, 24)` | `space.xl` ✓ |

**Visual — empty icon:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| size | RN-wrapper | `48` | `48.dp` | `48` | `space.3xl` ✓ |
| color | RN-wrapper | `semantic.color.onSurface.subtle` | `LaneShadowTheme.colors.onSurfaceSubtle` | `theme.colors.onSurfaceSubtle` | `color.onSurface.subtle` |

**Typography — empty text:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| variant | Paper | `bodyMedium` | `MaterialTheme.typography.bodyMedium` | `.font(.body)` | `type.body.sm` ✓ |
| textAlign | RN-wrapper | `'center'` | `textAlign = TextAlign.Center` | `.multilineTextAlignment(.center)` | n/a |
| color | RN-wrapper | `semantic.color.onSurface.muted` | `LaneShadowTheme.colors.onSurfaceMuted` | `theme.colors.onSurfaceMuted` | `color.onSurface.muted` |

**Layout — footer:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| paddingTop | RN-wrapper | `16` | `Modifier.padding(top = 16.dp)` | `.padding(.top, 16)` | `space.lg` ✓ |
| borderTopWidth | RN-wrapper | `0` | no border | no border | n/a |

**Layout — clear button:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| width | RN-wrapper | `'100%'` | `Modifier.fillMaxWidth()` | `.frame(maxWidth: .infinity)` | n/a |
| variant | RN-wrapper (Button) | `'outline'` | `ButtonColors.outline` | `.buttonStyle(.bordered)` | n/a (variant) |

---

### StateListItem (dependency of StateFilterSheet)

**Source files read:**
- LaneShadow: `react-native/components/discovery/state-list-item.tsx`
- Framework: `node_modules/react-native/Libraries/Components/Pressable/Pressable.js`

**Layout — container:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| alignItems | RN-wrapper | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.alignment(.center)` | n/a |
| paddingHorizontal | RN-wrapper | `16` | `Modifier.padding(horizontal = 16.dp)` | `.padding(.horizontal, 16)` | `space.lg` ✓ |
| paddingVertical | RN-wrapper | `12` | `Modifier.padding(vertical = 12.dp)` | `.padding(.vertical, 12)` | `space.md` ✓ |
| borderRadius | RN-wrapper | `12` | `RoundedCornerShape(12.dp)` | `RoundedRectangle(cornerRadius: 12)` | ESCALATE — `radius` token 12 missing; propose `radius.md2 = 12` or map to `radius.md = 8` |
| borderWidth | RN-wrapper | `1` | `Modifier.border(1.dp, ...)` | `.overlay(RoundedRectangle(...).stroke(..., lineWidth: 1))` | ESCALATE — propose `borderWidth.thin = 1` |
| marginVertical | RN-wrapper | `4` | `Modifier.padding(vertical = 4.dp)` | `.padding(.vertical, 4)` | `space.xs` ✓ |
| minHeight | RN-wrapper | `48` (WCAG AA) | `Modifier.heightIn(min = 48.dp)` | `.frame(minHeight: 48)` | ESCALATE — propose `size.touchTarget.min = 48` |

**Visual — backgroundColor (pressed):**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| pressed | RN-wrapper | `semantic.color.surfaceVariant.pressed` | `LaneShadowTheme.colors.surfaceVariantPressed` (via interactionSource) | `.opacity(pressed ? 1.0 : 0.8)` | `color.surfaceVariant.pressed` |

**Visual — backgroundColor (selected):**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| selected | RN-wrapper | `${semantic.color.primary.default}1A` (10% opacity) | `LaneShadowTheme.colors.primary.copy(alpha = 0.1f)` | `theme.colors.primary.opacity(0.1)` | ESCALATE — `color.primary.tint = 10%` not in tokens; use opacity |

**Visual — backgroundColor (default):**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| default | RN-wrapper | `semantic.color.surface.default` | `LaneShadowTheme.colors.surface` | `theme.colors.surface` | `color.surface.default` |

**Visual — borderColor (selected):**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| selected | RN-wrapper | `semantic.color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |

**Visual — borderColor (default):**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| default | RN-wrapper | `semantic.color.border.default` | `LaneShadowTheme.colors.border` | `theme.colors.border` | `color.border.default` |

**Typography — state name:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| variant | Paper | `bodyLarge` | `MaterialTheme.typography.bodyLarge` | `.font(.body)` | `type.body.md` ✓ |
| fontWeight (selected) | RN-wrapper | `'600'` | `FontWeight.SemiBold` | `.semibold` | ESCALATE — propose `fontWeight.semibold = 600` |
| fontWeight (default) | RN-wrapper | `'400'` | `FontWeight.Normal` | `.regular` | `type.body.md.fontWeight` ✓ |
| color (selected) | RN-wrapper | `semantic.color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |
| color (default) | RN-wrapper | `semantic.color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |

**Typography — route count:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| variant | Paper | `bodyMedium` | `MaterialTheme.typography.bodyMedium` | `.font(.body)` | `type.body.sm` ✓ |
| marginTop | RN-wrapper | `2` | `Modifier.padding(top = 2.dp)` | `.padding(.top, 2)` | ESCALATE — `space.xxs = 2` not in tokens; propose |
| color | RN-wrapper | `semantic.color.onSurface.muted` | `LaneShadowTheme.colors.onSurfaceMuted` | `theme.colors.onSurfaceMuted` | `color.onSurface.muted` |

**Layout — checkmark container:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| marginLeft | RN-wrapper | `12` | `Modifier.padding(start = 12.dp)` | `.padding(.leading, 12)` | `space.md` ✓ |

**Visual — checkmark icon:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| size | RN-wrapper | `20` | `20.dp` | `20` | ESCALATE — propose `icon.md = 20` |
| color | RN-wrapper | `semantic.color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |

---

## DESIGN NOTES

- Use deterministic composition fixtures so complex sheets, maps, chat, and stacked layouts remain diffable.
- Define detents, handles, scrim, keyboard avoidance, and safe-area behavior explicitly.
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
