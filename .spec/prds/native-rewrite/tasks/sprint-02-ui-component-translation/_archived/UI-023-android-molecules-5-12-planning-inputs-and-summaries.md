# UI-023: Android molecules 5/12 — planning inputs & summaries: `DepartureTimeSelector`, `DateRangePicker`, `ScenicBiasSegmented`, `PlanningProgressIndicator`, `SuggestionChips`, `PreferencesRow`, `PlanningStatusTab`, `RainTimingSummary`, `SegmentDetailView`, `TempRangeSummary`, `WeatherStrip`, `EnrichmentStatusIndicator`

**Task ID:** UI-023
**Sprint:** Sprint 2 - UI Component Translation and Fidelity Sandbox
**Assigned To:** kotlin-implementer
**Reviewer:** kotlin-reviewer
**Estimate:** 720 min
**Type:** [FEATURE]
**Status:** Planned
**Phase:** Molecules
**Quality Score:** 115/115

---

## BACKGROUND

Sprint 2 translates the React Native baseline into native platform components and sandbox scenarios before rider-facing feature sprints resume. This task covers the `molecules` slice for `Android molecules 5/12 — planning inputs & summaries: DepartureTimeSelector, DateRangePicker, ScenicBiasSegmented, PlanningProgressIndicator, SuggestionChips, PreferencesRow, PlanningStatusTab, RainTimingSummary, SegmentDetailView, TempRangeSummary, WeatherStrip, EnrichmentStatusIndicator`.

**Objective:** Implement Android molecules 5/12 — planning inputs & summaries: `DepartureTimeSelector`, `DateRangePicker`, `ScenicBiasSegmented`, `PlanningProgressIndicator`, `SuggestionChips`, `PreferencesRow`, `PlanningStatusTab`, `RainTimingSummary`, `SegmentDetailView`, `TempRangeSummary`, `WeatherStrip`, `EnrichmentStatusIndicator` as Jetpack Compose work with parity to the RN baseline, token-only styling, and sandbox coverage.

**Success State:** A reviewer can open the Android sandbox, browse this task's scenarios, and confirm naming, interface, theme, state, accessibility, and layout parity against RN.

## CRITICAL CONSTRAINTS

### MUST
- Implement the listed components or compositions with parity-aligned naming and interfaces: `DepartureTimeSelector`, `DateRangePicker`, `ScenicBiasSegmented`, `PlanningProgressIndicator`, `SuggestionChips`, `PreferencesRow`, `PlanningStatusTab`, `RainTimingSummary`, `SegmentDetailView`, `TempRangeSummary`, `WeatherStrip`, `EnrichmentStatusIndicator`.
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
**THEN** The listed components or compositions exist in the correct Android Compose directories with parity-aligned names and signatures: `DepartureTimeSelector`, `DateRangePicker`, `ScenicBiasSegmented`, `PlanningProgressIndicator`, `SuggestionChips`, `PreferencesRow`, `PlanningStatusTab`, `RainTimingSummary`, `SegmentDetailView`, `TempRangeSummary`, `WeatherStrip`, `EnrichmentStatusIndicator`.
**Verify:** `printf "%s\n" "`DepartureTimeSelector`, `DateRangePicker`, `ScenicBiasSegmented`, `PlanningProgressIndicator`, `SuggestionChips`, `PreferencesRow`, `PlanningStatusTab`, `RainTimingSummary`, `SegmentDetailView`, `TempRangeSummary`, `WeatherStrip`, `EnrichmentStatusIndicator`"`

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
| TC-1 | AC-1 | The listed components or compositions exist in the correct Android Compose directories with parity-aligned names and signatures: `DepartureTimeSelector`, `DateRangePicker`, `ScenicBiasSegmented`, `PlanningProgressIndicator`, `SuggestionChips`, `PreferencesRow`, `PlanningStatusTab`, `RainTimingSummary`, `SegmentDetailView`, `TempRangeSummary`, `WeatherStrip`, `EnrichmentStatusIndicator`. | `printf "%s\n" "`DepartureTimeSelector`, `DateRangePicker`, `ScenicBiasSegmented`, `PlanningProgressIndicator`, `SuggestionChips`, `PreferencesRow`, `PlanningStatusTab`, `RainTimingSummary`, `SegmentDetailView`, `TempRangeSummary`, `WeatherStrip`, `EnrichmentStatusIndicator`"` |
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
| DepartureTimeSelector | `react-native/components/ui/departure-time-selector.tsx` | `@react-native-community/datetimepicker`; `react-native/Libraries/Components/Pressable/Pressable.js` | `android/app/src/main/java/com/laneshadow/ui/molecules/DepartureTimeSelector.kt` | 1 layout × 3 states (default/pressed/disabled) |
| DateRangePicker | `react-native/components/ui/date-range-picker.tsx` | `react-native/Libraries/Components/ScrollView/ScrollView.js` (horizontal) | `android/app/src/main/java/com/laneshadow/ui/molecules/DateRangePicker.kt` | 4 presets (all/week/month/3months) × 2 states (selected/unselected) |
| ScenicBiasSegmented | `react-native/components/ui/scenic-bias-segmented.tsx` | `react-native-paper/src/components/SegmentedButtons/SegmentedButtons.jsx` | `android/app/src/main/java/com/laneshadow/ui/molecules/ScenicBiasSegmented.kt` | 2 options (default/high scenic) × 3 states (idle/pressed/disabled) |
| PlanningProgressIndicator | `react-native/components/ui/planning-progress-indicator.tsx` | `react-native/Libraries/Components/ActivityIndicator/ActivityIndicator.js` | `android/app/src/main/java/com/laneshadow/ui/molecules/PlanningProgressIndicator.kt` | 4 steps (reading/finding/weather/building) × 3 step states (pending/current/completed) |
| SuggestionChips | `react-native/components/ui/suggestion-chips.tsx` | `react-native/Libraries/Components/Pressable/Pressable.js` | `android/app/src/main/java/com/laneshadow/ui/molecules/SuggestionChips.kt` | 2 layouts (horizontal/vertical) × 2 states (default/pressed) |
| PreferencesRow | `react-native/components/sheets/preferences-row.tsx` | `@react-native-community/datetimepicker`; `react-native/Libraries/Components/ScrollView/ScrollView.js` (horizontal) | `android/app/src/main/java/com/laneshadow/ui/molecules/PreferencesRow.kt` | 5 chips (scenic/departure/highways/tolls/favorites) × 2 states (active/inactive) |
| PlanningStatusTab | `react-native/components/planning/planning-status-tab.tsx` | `react-native-reanimated` (FadeIn/FadeOut/SlideInDown); `react-native/Libraries/Components/ActivityIndicator/ActivityIndicator.js` | `android/app/src/main/java/com/laneshadow/ui/molecules/PlanningStatusTab.kt` | 5 statuses (pending/running/completed/failed/cancelled) × animated |
| RainTimingSummary | `react-native/components/planning/rain-timing-summary.tsx` | `react-native/Libraries/Components/View/View.js` | `android/app/src/main/java/com/laneshadow/ui/molecules/RainTimingSummary.kt` | 1 layout × 3 states (has-rain/unavailable/hidden) |
| SegmentDetailView | `react-native/components/planning/segment-detail-view.tsx` | `react-native/Libraries/Components/ScrollView/ScrollView.js`; `react-native/Libraries/Components/TouchableOpacity/TouchableOpacity.js` | `android/app/src/main/java/com/laneshadow/ui/molecules/SegmentDetailView.kt` | 2 modes (single-leg/multi-leg collapsible) × concerning weather highlight |
| TempRangeSummary | `react-native/components/planning/temp-range-summary.tsx` | `react-native/Libraries/Components/View/View.js` | `android/app/src/main/java/com/laneshadow/ui/molecules/TempRangeSummary.kt` | 1 layout × 4 display modes (high-low/consistent/unavailable/extreme-temp) |
| WeatherStrip | `react-native/components/planning/weather-strip.tsx` | `react-native/Libraries/TouchableWithoutFeedback/TouchableWithoutFeedback.js` | `android/app/src/main/java/com/laneshadow/ui/molecules/WeatherStrip.kt` | 3 modes (good-conditions/worst-conditions/expanded-all) × tap-to-expand |
| EnrichmentStatusIndicator | `react-native/components/planning/enrichment-status-indicator.tsx` | `react-native-reanimated` (FadeIn/FadeOut/pulse); `react-native/Libraries/Components/ActivityIndicator/ActivityIndicator.js` | `android/app/src/main/java/com/laneshadow/ui/molecules/EnrichmentStatusIndicator.kt` | 3 variants (inline/standalone/minimal) × 6 statuses (pending/running-fast/running-extended/completed/failed/cancelled) |

## STYLE PROPERTIES MATRIX

> Exhaustive enumeration of every style property from both sources per `08f-translation-protocol.md`. Columns: Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping. `ESCALATE` = no token covers the value — add a proposed token to DECISIONS.md before implementing.
>
> **Token reference** (from `tokens/semantic/semantic.tokens.json`): space xs=4 sm=8 md=12 lg=16 xl=24 2xl=32 3xl=48 4xl=64; radius none=0 sm=4 md=8 lg=16 xl=24 2xl=32 full=9999; elevation[2] shadowOffset=0/2 shadowOpacity=0.05 shadowRadius=4 androidElevation=2. **Paper labelLarge**: fontFamily=sans-serif-medium, fontWeight=500, fontSize=14, lineHeight=20, letterSpacing=0.1. **Paper labelSmall**: fontFamily=sans-serif-medium, fontWeight=500, fontSize=11, lineHeight=16, letterSpacing=0.5. **semantic.type.label.md**: fontSize=14, lineHeight=20, fontWeight=500. **semantic.type.body.sm**: fontSize=14, lineHeight=21, fontWeight=400.

### DepartureTimeSelector

**Source files read:**
- LaneShadow: `react-native/components/ui/departure-time-selector.tsx`
- Framework: `@react-native-community/datetimepicker`, `react-native/Libraries/Components/Pressable/Pressable.js`

**Layout — container:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| gap | RN-wrapper | `8` | `Modifier.fillMaxWidth().wrapContentHeight()` with gap via `Arrangement.spacedBy(8.dp)` | `VStack(spacing: 8)` | `space.sm` (8) |

**Layout — label:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| fontSize | RN-wrapper | `13` | `TextStyle(fontSize = 13.sp)` | `.font(.system(size: 13))` | ESCALATE — propose `type.label.xs = 13` |
| fontWeight | RN-wrapper | `'500'` | `FontWeight.Medium` | `.weight(.medium)` | n/a (Platform default medium) |
| textTransform | RN-wrapper | `'uppercase'` | `TextStyle(textAlign = TextAlign.Center)` (Compose lacks uppercase) | `.textCase(.uppercase)` | n/a |
| letterSpacing | RN-wrapper | `0.5` | `TextStyle(letterSpacing = 0.5.sp)` | `.tracking(0.5)` | n/a |
| color | RN-wrapper | `semantic.color.onSurface.subtle` | `MaterialTheme.colorScheme.onSurfaceVariant` | `theme.colors.onSurfaceVariant` | `color.onSurface.subtle` |

**Layout — button:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| paddingVertical | RN-wrapper | `12` | `Modifier.padding(vertical = 12.dp)` | `.padding(.vertical, 12)` | ESCALATE — propose `space.md + space.xs = 12` |
| paddingHorizontal | RN-wrapper | `16` | `Modifier.padding(horizontal = 16.dp)` | `.padding(.horizontal, 16)` | `space.lg` (16) |
| borderRadius | RN-wrapper | `8` | `Modifier.clip(RoundedCornerShape(8.dp))` | `.cornerRadius(8)` | `radius.md` (8) |
| borderWidth | RN-wrapper | `1` | `Modifier.border(1.dp, ...)` | `.overlay(RoundedRectangle(cornerRadius: 8).stroke(..., lineWidth: 1))` | n/a |
| gap | RN-wrapper | `8` | `Arrangement.spacedBy(8.dp)` | `spacing: 8` | `space.sm` (8) |

**Visual — button colors:**

| State | Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|---|
| default | backgroundColor | RN-wrapper | `${semantic.color.primary.default}1F` (12% alpha) | `primaryColor.copy(alpha = 0.12f)` | `Color.primary.opacity(0.12)` | `color.primary.default` + alpha |
| default | borderColor | RN-wrapper | `${semantic.color.primary.default}4D` (30% alpha) | `primaryColor.copy(alpha = 0.3f)` | `Color.primary.opacity(0.3)` | `color.primary.default` + alpha |
| pressed | opacity | RN-wrapper | `0.8` | `Modifier.alpha(0.8f)` (via press interaction) | `.opacity(0.8)` | n/a |
| icon color | RN-wrapper | `semantic.color.primary.default` | `MaterialTheme.colorScheme.primary` | `theme.colors.primary` | `color.primary.default` |
| text color | RN-wrapper | `semantic.color.onSurface.default` | `MaterialTheme.colorScheme.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |

**Visual — icon:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| size | RN-wrapper | `18` | `Modifier.size(18.dp)` | `.frame(width: 18, height: 18)` | ESCALATE — propose `icon.sm = 18` |
| marginRight | RN-wrapper | `-4` | `Spacer(Modifier.width(-4.dp))` (negative spacing not recommended) | `Spacer().frame(width: -4)` | n/a (use positive spacing) |

### DateRangePicker

**Source files read:**
- LaneShadow: `react-native/components/ui/date-range-picker.tsx`
- Framework: `react-native/Libraries/Components/ScrollView/ScrollView.js` (horizontal)

**Layout — container:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| flexDirection | RN-wrapper | `'row'` (via ScrollView horizontal) | `Row(...)` (LazyRow) | `HStack` | n/a |
| gap | RN-wrapper | `semantic.space.sm` | `Arrangement.spacedBy(space.sm.dp)` | `spacing: space.sm` | `space.sm` (8) |
| paddingHorizontal | RN-wrapper | `semantic.space.md` | `Modifier.padding(horizontal = space.md.dp)` | `.padding(.horizontal, space.md)` | `space.md` (12) |

**Layout — chip:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| alignSelf | RN-wrapper | `'flex-start'` | `Modifier.wrapContentWidth()` | `.frame(maxWidth: .infinity, alignment: .leading)` | n/a |
| paddingHorizontal | RN-wrapper | `semantic.space.md` | `Modifier.padding(horizontal = space.md.dp)` | `.padding(.horizontal, space.md)` | `space.md` (12) |
| paddingVertical | RN-wrapper | `semantic.space.sm` | `Modifier.padding(vertical = space.sm.dp)` | `.padding(.vertical, space.sm)` | `space.sm` (8) |
| borderRadius | RN-wrapper | `semantic.radius.full` | `Modifier.clip(RoundedCornerShape(9999.dp))` | `.capsule()` / `.cornerRadius(9999)` | `radius.full` (9999) |

**Visual — chip colors:**

| State | Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|---|
| selected | backgroundColor | RN-wrapper | `semantic.color.primary.default` | `MaterialTheme.colorScheme.primary` | `theme.colors.primary` | `color.primary.default` |
| selected | textColor | RN-wrapper | `semantic.color.onPrimary.default` | `MaterialTheme.colorScheme.onPrimary` | `theme.colors.onPrimary` | `color.onPrimary.default` |
| unselected | backgroundColor | RN-wrapper | `semantic.color.surfaceVariant.default` | `MaterialTheme.colorScheme.surfaceVariant` | `theme.colors.surfaceVariant` | `color.surfaceVariant.default` |
| unselected | textColor | RN-wrapper | `semantic.color.onSurface.default` | `MaterialTheme.colorScheme.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |

**Typography — chip text:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| style | RN-wrapper | `semantic.type.label.sm` | `MaterialTheme.typography.labelSmall` | `theme.font.labelSmall` / `.font(.caption)` | `type.label.sm` |

### ScenicBiasSegmented

**Source files read:**
- LaneShadow: `react-native/components/ui/scenic-bias-segmented.tsx`
- Framework: `react-native-paper/src/components/SegmentedButtons/SegmentedButtons.jsx`

**Layout — container:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| flexDirection | RN-wrapper | `'column'` | `Column(...)` | `VStack` | n/a |
| gap | RN-wrapper | `semantic.space.sm` | `Arrangement.spacedBy(space.sm.dp)` | `spacing: space.sm` | `space.sm` (8) |

**Layout — segmented container:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| width | RN-wrapper | `'100%'` | `Modifier.fillMaxWidth()` | `.frame(maxWidth: .infinity)` | n/a |
| backgroundColor | RN-wrapper | `semantic.color.input.default` | `MaterialTheme.colorScheme.surfaceVariant` | `theme.colors.surfaceVariant` | `color.input.default` |
| borderRadius | RN-wrapper | `semantic.radius.xl` | `Modifier.clip(RoundedCornerShape(radius.xl.dp))` | `.cornerRadius(radius.xl)` | `radius.xl` (24) |
| padding | RN-wrapper | `semantic.space.xs` | `Modifier.padding(space.xs.dp)` | `.padding(space.xs)` | `space.xs` (4) |

**Layout — segmented button:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| flex | RN-wrapper | `1` | `Modifier.weight(1f)` | `.layoutPriority(1)` | n/a |
| paddingVertical | RN-wrapper | `buttonPaddingY = space.sm + space.xs = 12` | `Modifier.padding(vertical = (space.sm + space.xs).dp)` | `.padding(.vertical, space.sm + space.xs)` | `space.sm + space.xs` (composed) |
| paddingHorizontal | RN-wrapper | `semantic.space.md` | `Modifier.padding(horizontal = space.md.dp)` | `.padding(.horizontal, space.md)` | `space.md` (12) |
| borderRadius | RN-wrapper | `semantic.radius.lg` | `Modifier.clip(RoundedCornerShape(radius.lg.dp))` | `.cornerRadius(radius.lg)` | `radius.lg` (16) |

**Visual — button colors:**

| State | Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|---|
| default checked | backgroundColor | RN-wrapper | `semantic.color.background.default` | `MaterialTheme.colorScheme.background` | `theme.colors.background` | `color.background.default` |
| default checked | textColor | RN-wrapper | `semantic.color.onSurface.default` | `MaterialTheme.colorScheme.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |
| high checked | backgroundColor | RN-wrapper | `semantic.color.primary.default` | `MaterialTheme.colorScheme.primary` | `theme.colors.primary` | `color.primary.default` |
| high checked | textColor | RN-wrapper | `semantic.color.onPrimary.default` | `MaterialTheme.colorScheme.onPrimary` | `theme.colors.onPrimary` | `color.onPrimary.default` |
| unchecked | backgroundColor | RN-wrapper | `'transparent'` | `Color.Transparent` | `.clear` | n/a |
| unchecked | textColor | RN-wrapper | `semantic.color.onSurface.muted` | `MaterialTheme.colorScheme.onSurfaceVariant` | `theme.colors.onSurfaceVariant` | `color.onSurface.muted` |

**Typography — label text:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| style | RN-wrapper | `semantic.type.label.md` | `MaterialTheme.typography.labelMedium` | `theme.font.labelMedium` / `.font(.subheadline)` | `type.label.md` |
| label style | RN-wrapper | `labelSmall` (Paper) | `MaterialTheme.typography.labelSmall` | `theme.font.labelSmall` / `.font(.caption2)` | Paper `labelSmall` |

### PlanningProgressIndicator

**Source files read:**
- LaneShadow: `react-native/components/ui/planning-progress-indicator.tsx`
- Framework: `react-native/Libraries/Components/ActivityIndicator/ActivityIndicator.js`

**Layout — container:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| alignItems | RN-wrapper | `'flex-start'` | `verticalAlignment = Alignment.Top` | `.alignment(.top)` | n/a |
| justifyContent | RN-wrapper | `'space-between'` | `horizontalArrangement = Arrangement.SpaceBetween` | n/a (HStack default) | n/a |
| padding | RN-wrapper | `16` | `Modifier.padding(16.dp)` | `.padding(16)` | ESCALATE — propose `space.lg + space.xs = 16` |
| borderRadius | RN-wrapper | `12` | `Modifier.clip(RoundedCornerShape(12.dp))` | `.cornerRadius(12)` | ESCALATE — propose `radius.lg + space.xs = 12` |
| margin | RN-wrapper | `16` | `Modifier.padding(16.dp)` (use padding instead) | `.padding(16)` | ESCALATE — propose `space.lg + space.xs = 16` |
| gap | RN-wrapper | `8` | `Arrangement.spacedBy(8.dp)` | `spacing: 8` | `space.sm` (8) |
| borderWidth | RN-wrapper | `1` | `Modifier.border(1.dp, ...)` | `.overlay(..., lineWidth: 1)` | n/a |

**Visual — container colors:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| backgroundColor | RN-wrapper | `semantic.color.card.default` | `MaterialTheme.colorScheme.surface` | `theme.colors.surface` | `color.card.default` |
| borderColor | RN-wrapper | `semantic.color.border.default` | `MaterialTheme.colorScheme.outline` | `theme.colors.outline` | `color.border.default` |
| elevation | RN-wrapper | `semantic.elevation[2]` | `Modifier.shadow(elevation = 2.dp, ...)` | `.shadow(radius: 4, y: 2)` | `elevation[2]` |

**Layout — step:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| flex | RN-wrapper | `1` | `Modifier.weight(1f)` | `.layoutPriority(1)` | n/a |
| alignItems | RN-wrapper | `'center'` | `horizontalAlignment = Alignment.CenterHorizontally` | `.frame(maxWidth: .infinity)` | n/a |

**Layout — iconContainer:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| width/height | RN-wrapper | `44` | `Modifier.size(44.dp)` | `.frame(width: 44, height: 44)` | ESCALATE — propose `space.xl - space.sm = 44` |
| borderRadius | RN-wrapper | `22` (half of width) | `Modifier.clip(CircleShape)` | `.clipShape(Circle())` | `radius.full` |
| marginBottom | RN-wrapper | `10` | `Modifier.padding(bottom = 10.dp)` | `.padding(.bottom, 10)` | ESCALATE — propose `space.md - space.xs = 10` |
| borderWidth | RN-wrapper | `2` | `Modifier.border(2.dp, ...)` | `.overlay(..., lineWidth: 2)` | n/a |

**Visual — iconContainer colors (by state):**

| State | Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|---|
| completed | backgroundColor | RN-wrapper | `${semantic.color.success.default}25` (15% alpha) | `successColor.copy(alpha = 0.15f)` | `Color.success.opacity(0.15)` | `color.success.default` + alpha |
| completed | borderColor | RN-wrapper | `semantic.color.success.default` | `MaterialTheme.colorScheme.primary` (success) | `theme.colors.success` | `color.success.default` |
| current | backgroundColor | RN-wrapper | `${semantic.color.primary.default}25` (15% alpha) | `primaryColor.copy(alpha = 0.15f)` | `Color.primary.opacity(0.15)` | `color.primary.default` + alpha |
| current | borderColor | RN-wrapper | `semantic.color.primary.default` | `MaterialTheme.colorScheme.primary` | `theme.colors.primary` | `color.primary.default` |
| pending | backgroundColor | RN-wrapper | `semantic.color.surfaceVariant.default` | `MaterialTheme.colorScheme.surfaceVariant` | `theme.colors.surfaceVariant` | `color.surfaceVariant.default` |
| pending | borderColor | RN-wrapper | `semantic.color.border.default` | `MaterialTheme.colorScheme.outline` | `theme.colors.outline` | `color.border.default` |

**Layout — activeDot:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| width/height | RN-wrapper | `6` | `Modifier.size(6.dp)` | `.frame(width: 6, height: 6)` | ESCALATE — propose `space.xs + space.xs = 6` |
| borderRadius | RN-wrapper | `3` (half of width) | `Modifier.clip(RoundedCornerShape(3.dp))` | `.cornerRadius(3)` | n/a (composed) |
| backgroundColor | RN-wrapper | `semantic.color.primary.default` | `MaterialTheme.colorScheme.primary` | `theme.colors.primary` | `color.primary.default` |

**Typography — label:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| fontSize | RN-wrapper | `12` | `TextStyle(fontSize = 12.sp)` | `.font(.system(size: 12))` | ESCALATE — propose `type.label.xs = 12` |
| lineHeight | RN-wrapper | `16` | `TextStyle(lineHeight = 16.sp)` | `.lineSpacing(4)` (12+4=16) | ESCALATE — propose `type.label.xs lineHeight = 16` |
| textAlign | RN-wrapper | `'center'` | `TextStyle(textAlign = TextAlign.Center)` | `.multilineTextAlignment(.center)` | n/a |
| fontWeight (current) | RN-wrapper | `'700'` | `FontWeight.Bold` (700) | `.weight(.bold)` | n/a |
| fontWeight (other) | RN-wrapper | `'600'` | `FontWeight.SemiBold` (600) | `.weight(.semibold)` | n/a |

**Visual — connector:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| height | RN-wrapper | `2` | `Modifier.height(2.dp)` | `.frame(height: 2)` | n/a |
| backgroundColor (completed) | RN-wrapper | `${semantic.color.success.default}60` (38% alpha) | `successColor.copy(alpha = 0.38f)` | `Color.success.opacity(0.38)` | `color.success.default` + alpha |
| backgroundColor (pending) | RN-wrapper | `semantic.color.border.default` | `MaterialTheme.colorScheme.outline` | `theme.colors.outline` | `color.border.default` |

### SuggestionChips

**Source files read:**
- LaneShadow: `react-native/components/ui/suggestion-chips.tsx`
- Framework: `react-native/Libraries/Components/Pressable/Pressable.js`

**Layout — container (horizontal):**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| flexDirection | RN-wrapper | `'row'` | `Row(...)` (LazyRow) | `HStack` | n/a |
| paddingHorizontal | RN-wrapper | `16` | `Modifier.padding(horizontal = 16.dp)` | `.padding(.horizontal, 16)` | `space.lg` (16) |
| paddingVertical | RN-wrapper | `12` | `Modifier.padding(vertical = 12.dp)` | `.padding(.vertical, 12)` | ESCALATE — propose `space.md + space.xs = 12` |
| gap | RN-wrapper | `8` | `Arrangement.spacedBy(8.dp)` | `spacing: 8` | `space.sm` (8) |

**Layout — chip:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| alignItems | RN-wrapper | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.alignment(.center)` | n/a |
| paddingHorizontal | RN-wrapper | `14` | `Modifier.padding(horizontal = 14.dp)` | `.padding(.horizontal, 14)` | ESCALATE — propose `space.md + space.xs = 14` |
| paddingVertical | RN-wrapper | `8` | `Modifier.padding(vertical = 8.dp)` | `.padding(.vertical, 8)` | `space.sm` (8) |
| borderRadius | RN-wrapper | `20` | `Modifier.clip(RoundedCornerShape(20.dp))` | `.cornerRadius(20)` | ESCALATE — propose `radius.lg + space.md = 20` |
| gap | RN-wrapper | `6` | `Arrangement.spacedBy(6.dp)` | `spacing: 6` | ESCALATE — propose `space.xs + space.xs = 6` |
| borderWidth | RN-wrapper | `1` | `Modifier.border(1.dp, ...)` | `.overlay(..., lineWidth: 1)` | n/a |
| minHeight | RN-wrapper | `36` | `Modifier.heightIn(min = 36.dp)` | `.frame(minHeight: 36)` | ESCALATE — propose `space.xl - space.md = 36` |

**Visual — chip colors:**

| State | Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|---|
| default | backgroundColor | RN-wrapper | `semantic.color.surfaceVariant.default` | `MaterialTheme.colorScheme.surfaceVariant` | `theme.colors.surfaceVariant` | `color.surfaceVariant.default` |
| pressed | backgroundColor | RN-wrapper | `semantic.color.primary.pressed` | `MaterialTheme.colorScheme.primary.copy(alpha = 0.8f)` | `theme.colors.primary.opacity(0.8)` | `color.primary.pressed` |
| disabled | opacity | RN-wrapper | `0.5` | `Modifier.alpha(0.5f)` | `.opacity(0.5)` | n/a |
| borderColor | RN-wrapper | `semantic.color.border.default` | `MaterialTheme.colorScheme.outline` | `theme.colors.outline` | `color.border.default` |
| icon color | RN-wrapper | `semantic.color.primary.default` | `MaterialTheme.colorScheme.primary` | `theme.colors.primary` | `color.primary.default` |
| text color | RN-wrapper | `semantic.color.onSurface.muted` | `MaterialTheme.colorScheme.onSurfaceVariant` | `theme.colors.onSurfaceVariant` | `color.onSurface.muted` |

**Typography — chip text:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| fontSize | RN-wrapper | `14` | `TextStyle(fontSize = 14.sp)` | `.font(.system(size: 14))` | ESCALATE — propose `type.body.sm = 14` |
| fontWeight | RN-wrapper | `'600'` | `FontWeight.SemiBold` (600) | `.weight(.semibold)` | n/a |
| icon fontSize | RN-wrapper | `14` | `TextStyle(fontSize = 14.sp)` | `.font(.system(size: 14))` | ESCALATE — propose `type.body.sm = 14` |

### PreferencesRow

**Source files read:**
- LaneShadow: `react-native/components/sheets/preferences-row.tsx`
- Framework: `@react-native-community/datetimepicker`, `react-native/Libraries/Components/ScrollView/ScrollView.js` (horizontal)

**Layout — scrollContent:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| flexDirection | RN-wrapper | `'row'` | `Row(...)` (LazyRow) | `HStack` | n/a |
| alignItems | RN-wrapper | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.alignment(.center)` | n/a |
| gap | RN-wrapper | `8` | `Arrangement.spacedBy(8.dp)` | `spacing: 8` | `space.sm` (8) |
| paddingVertical | RN-wrapper | `2` | `Modifier.padding(vertical = 2.dp)` | `.padding(.vertical, 2)` | ESCALATE — propose `space.xs / 2 = 2` |

**Layout — chip:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| alignItems | RN-wrapper | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.alignment(.center)` | n/a |
| gap | RN-wrapper | `6` | `Arrangement.spacedBy(6.dp)` | `spacing: 6` | ESCALATE — propose `space.xs + space.xs = 6` |
| height | RN-wrapper | `40` | `Modifier.height(40.dp)` | `.frame(height: 40)` | `space.2xl + space.sm` (composed) |
| paddingHorizontal | RN-wrapper | `12` | `Modifier.padding(horizontal = 12.dp)` | `.padding(.horizontal, 12)` | `space.md` (12) |
| borderRadius | RN-wrapper | `20` | `Modifier.clip(RoundedCornerShape(20.dp))` | `.cornerRadius(20)` | ESCALATE — propose `radius.lg + space.md = 20` |

**Visual — chip colors:**

| State | Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|---|
| active | backgroundColor | RN-wrapper | `semantic.color.primary.default` | `MaterialTheme.colorScheme.primary` | `theme.colors.primary` | `color.primary.default` |
| active | iconColor/textColor | RN-wrapper | `semantic.color.onPrimary.default` | `MaterialTheme.colorScheme.onPrimary` | `theme.colors.onPrimary` | `color.onPrimary.default` |
| inactive | backgroundColor | RN-wrapper | `semantic.color.surfaceVariant.default` | `MaterialTheme.colorScheme.surfaceVariant` | `theme.colors.surfaceVariant` | `color.surfaceVariant.default` |
| inactive | iconColor/textColor | RN-wrapper | `semantic.color.onSurface.muted` | `MaterialTheme.colorScheme.onSurfaceVariant` | `theme.colors.onSurfaceVariant` | `color.onSurface.muted` |
| pressed | opacity | RN-wrapper | `0.8` | `Modifier.alpha(0.8f)` (via press interaction) | `.opacity(0.8)` | n/a |
| disabled (no favorites) | opacity | RN-wrapper | `0.5` | `Modifier.alpha(0.5f)` | `.opacity(0.5)` | n/a |

**Typography — chip text:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| fontSize | RN-wrapper | `13` | `TextStyle(fontSize = 13.sp)` | `.font(.system(size: 13))` | ESCALATE — propose `type.label.xs = 13` |
| fontWeight | RN-wrapper | `'500'` | `FontWeight.Medium` (500) | `.weight(.medium)` | n/a |

**Visual — icon:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| size | RN-wrapper | `16` | `Modifier.size(16.dp)` | `.frame(width: 16, height: 16)` | ESCALATE — propose `icon.xs = 16` |

### PlanningStatusTab

**Source files read:**
- LaneShadow: `react-native/components/planning/planning-status-tab.tsx`
- Framework: `react-native-reanimated`, `react-native/Libraries/Components/ActivityIndicator/ActivityIndicator.js`

**Layout — wrapper:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| marginHorizontal | RN-wrapper | `semantic.space.md` | `Modifier.padding(horizontal = space.md.dp)` | `.padding(.horizontal, space.md)` | `space.md` (12) |
| borderRadius | RN-wrapper | `semantic.radius.md` | `Modifier.clip(RoundedCornerShape(radius.md.dp))` | `.cornerRadius(radius.md)` | `radius.md` (8) |
| backgroundColor | RN-wrapper | `semantic.color.surface.default` | `MaterialTheme.colorScheme.surface` | `theme.colors.surface` | `color.surface.default` |
| elevation | RN-wrapper | `semantic.elevation[3]` | `Modifier.shadow(elevation = 3.dp, ...)` | `.shadow(radius: 6, y: 3)` | `elevation[3]` |

**Layout — pressable:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| alignItems | RN-wrapper | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.alignment(.center)` | n/a |
| minHeight | RN-wrapper | `64` | `Modifier.heightIn(min = 64.dp)` | `.frame(minHeight: 64)` | ESCALATE — propose `space.3xl + space.lg = 64` |

**Layout — accentBar:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| width | RN-wrapper | `4` | `Modifier.width(4.dp)` | `.frame(width: 4)` | ESCALATE — propose `space.xs = 4` |
| alignSelf | RN-wrapper | `'stretch'` | `Modifier.fillMaxHeight()` | `.frame(maxHeight: .infinity)` | n/a |

**Visual — accentBar colors (by status):**

| Status | Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|---|
| completed | backgroundColor | RN-wrapper | `semantic.color.success.default` | `MaterialTheme.colorScheme.primary` (success) | `theme.colors.success` | `color.success.default` |
| failed | backgroundColor | RN-wrapper | `semantic.color.danger.default` | `MaterialTheme.colorScheme.error` | `theme.colors.error` | `color.danger.default` |
| cancelled | backgroundColor | RN-wrapper | `semantic.color.onSurface.muted` | `MaterialTheme.colorScheme.onSurfaceVariant` | `theme.colors.onSurfaceVariant` | `color.onSurface.muted` |
| other | backgroundColor | RN-wrapper | `semantic.color.primary.default` | `MaterialTheme.colorScheme.primary` | `theme.colors.primary` | `color.primary.default` |

**Layout — iconArea:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| width | RN-wrapper | `28` | `Modifier.width(28.dp)` | `.frame(width: 28)` | ESCALATE — propose `space.lg + space.xs = 28` |
| marginLeft | RN-wrapper | `semantic.space.sm` | `Modifier.padding(start = space.sm.dp)` | `.padding(.leading, space.sm)` | `space.sm` (8) |

**Visual — icon:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| size | RN-wrapper | `20` | `Modifier.size(20.dp)` | `.frame(width: 20, height: 20)` | ESCALATE — propose `icon.sm = 20` |

**Layout — centerColumn:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| flex | RN-wrapper | `1` | `Modifier.weight(1f)` | `.layoutPriority(1)` | n/a |
| justifyContent | RN-wrapper | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.frame(maxHeight: .infinity)` | n/a |
| gap | RN-wrapper | `2` | `Arrangement.spacedBy(2.dp)` | `spacing: 2` | ESCALATE — propose `space.xs / 2 = 2` |
| marginHorizontal | RN-wrapper | `semantic.space.sm` | `Modifier.padding(horizontal = space.sm.dp)` | `.padding(.horizontal, space.sm)` | `space.sm` (8) |

**Typography — routeLabel:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| style | RN-wrapper | `semantic.type.label.sm` | `MaterialTheme.typography.labelSmall` | `theme.font.labelSmall` / `.font(.caption)` | `type.label.sm` |
| fontWeight | RN-wrapper | `'700'` | `FontWeight.Bold` (700) | `.weight(.bold)` | n/a |
| color | RN-wrapper | `semantic.color.onSurface.default` | `MaterialTheme.colorScheme.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |

**Typography — statusText:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| style | RN-wrapper | `semantic.type.label.sm` | `MaterialTheme.typography.labelSmall` | `theme.font.labelSmall` / `.font(.caption)` | `type.label.sm` |
| color (by status) | RN-wrapper | varies | varies | varies | varies by status |

**Layout — rightArea:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| alignItems | RN-wrapper | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.alignment(.center)` | n/a |
| flexShrink | RN-wrapper | `0` | `Modifier.width(IntrinsicSize.Min)` | `.fixedSize()` | n/a |
| marginRight | RN-wrapper | `semantic.space.sm` | `Modifier.padding(end = space.sm.dp)` | `.padding(.trailing, space.sm)` | `space.sm` (8) |

**Layout — dismissButton:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| marginLeft | RN-wrapper | `semantic.space.sm` | `Modifier.padding(start = space.sm.dp)` | `.padding(.leading, space.sm)` | `space.sm` (8) |
| hitSlop | RN-wrapper | `8` | `Modifier.clickable(onClick = {}, indication = null).padding(8.dp)` | `.contentShape(Rectangle()).padding(8)` | `space.sm` (8) |

**Visual — spinner/indicator:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| size | RN-wrapper | `20` | `Modifier.size(20.dp)` | `.frame(width: 20, height: 20)` | ESCALATE — propose `icon.sm = 20` |
| size (check/alert) | RN-wrapper | `22` | `Modifier.size(22.dp)` | `.frame(width: 22, height: 22)` | ESCALATE — propose `icon.md = 22` |

### RainTimingSummary

**Source files read:**
- LaneShadow: `react-native/components/planning/rain-timing-summary.tsx`
- Framework: `react-native/Libraries/Components/View/View.js`

**Layout — container:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| alignItems | RN-wrapper | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.alignment(.center)` | n/a |
| gap | RN-wrapper | `semantic.space.sm` | `Arrangement.spacedBy(space.sm.dp)` | `spacing: space.sm` | `space.sm` (8) |

**Visual — icon:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| size | RN-wrapper | `16` | `Modifier.size(16.dp)` | `.frame(width: 16, height: 16)` | ESCALATE — propose `icon.xs = 16` |
| color | RN-wrapper | `semantic.color.onSurface.muted` | `MaterialTheme.colorScheme.onSurfaceVariant` | `theme.colors.onSurfaceVariant` | `color.onSurface.muted` |

**Typography — text:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| variant | RN-wrapper | `bodySmall` (Paper) | `MaterialTheme.typography.bodySmall` | `theme.font.bodySmall` / `.font(.caption2)` | Paper `bodySmall` |
| color (available) | RN-wrapper | `semantic.color.onSurface.default` | `MaterialTheme.colorScheme.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |
| color (unavailable) | RN-wrapper | `semantic.color.onSurface.muted` | `MaterialTheme.colorScheme.onSurfaceVariant` | `theme.colors.onSurfaceVariant` | `color.onSurface.muted` |
| opacity (unavailable) | RN-wrapper | `0.6` | `Modifier.alpha(0.6f)` | `.opacity(0.6)` | n/a |

### SegmentDetailView

**Source files read:**
- LaneShadow: `react-native/components/planning/segment-detail-view.tsx`
- Framework: `react-native/Libraries/Components/ScrollView/ScrollView.js`, `react-native/Libraries/Components/TouchableOpacity/TouchableOpacity.js`

**Layout — container:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| gap | RN-wrapper | `8` | `Arrangement.spacedBy(8.dp)` | `spacing: 8` | `space.sm` (8) |

**Layout — header (multi-leg):**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| alignItems | RN-wrapper | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.alignment(.center)` | n/a |
| gap | RN-wrapper | `semantic.space.sm` | `Arrangement.spacedBy(space.sm.dp)` | `spacing: space.sm` | `space.sm` (8) |

**Layout — segmentsList:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| marginTop | RN-wrapper | `8` | `Modifier.padding(top = 8.dp)` | `.padding(.top, 8)` | `space.sm` (8) |
| marginLeft | RN-wrapper | `24` | `Modifier.padding(start = 24.dp)` | `.padding(.leading, 24)` | ESCALATE — propose `space.xl + space.xs = 24` |

**Layout — segmentRow:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| alignItems | RN-wrapper | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.alignment(.center)` | n/a |
| gap | RN-wrapper | `12` | `Arrangement.spacedBy(12.dp)` | `spacing: 12` | `space.md` (12) |
| paddingVertical | RN-wrapper | `12` | `Modifier.padding(vertical = 12.dp)` | `.padding(.vertical, 12)` | `space.md` (12) |
| paddingHorizontal | RN-wrapper | `16` | `Modifier.padding(horizontal = 16.dp)` | `.padding(.horizontal, 16)` | `space.lg` (16) |
| borderRadius | RN-wrapper | `8` | `Modifier.clip(RoundedCornerShape(8.dp))` | `.cornerRadius(8)` | `radius.md` (8) |
| marginBottom | RN-wrapper | `6` | `Modifier.padding(bottom = 6.dp)` | `.padding(.bottom, 6)` | ESCALATE — propose `space.xs + space.xs = 6` |

**Visual — segmentRow colors:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| backgroundColor | RN-wrapper | `'rgba(255, 255, 255, 0.03)'` | `Color.White.copy(alpha = 0.03f)` | `Color.white.opacity(0.03)` | ESCALATE — propose `color.surface.elevated = white-3%` |
| concerning backgroundColor | RN-wrapper | `${semantic.color.warning.default}15` (8% alpha) | `warningColor.copy(alpha = 0.08f)` | `Color.warning.opacity(0.08)` | `color.warning.default` + alpha |

**Layout — warningIndicator:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| position | RN-wrapper | `'absolute'` | `Modifier.wrapContentSize(Alignment.TopStart).offset(...)` | `.overlay(...)` | n/a |
| width | RN-wrapper | `3` | `Modifier.width(3.dp)` | `.frame(width: 3)` | ESCALATE — propose `borderWidth.sm = 3` |
| backgroundColor | RN-wrapper | `semantic.color.warning.default` | `MaterialTheme.colorScheme.tertiary` (warning) | `theme.colors.warning` | `color.warning.default` |

**Typography — legNumber:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| minWidth | RN-wrapper | `20` | `Modifier.widthIn(min = 20.dp)` | `.frame(minWidth: 20)` | ESCALATE — propose `space.md + space.xs = 20` |
| fontWeight | RN-wrapper | `'600'` | `FontWeight.SemiBold` (600) | `.weight(.semibold)` | n/a |

**Typography — distance:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| flex | RN-wrapper | `1` | `Modifier.weight(1f)` | `.layoutPriority(1)` | n/a |

**Layout — weatherBadges:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| alignItems | RN-wrapper | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.alignment(.center)` | n/a |
| gap | RN-wrapper | `6` | `Arrangement.spacedBy(6.dp)` | `spacing: 6` | ESCALATE — propose `space.xs + space.xs = 6` |
| flexWrap | RN-wrapper | `'wrap'` | `Row(horizontalArrangement = ..., modifier = Modifier.wrapContentWidth())` | `FlowRow` | n/a |

### TempRangeSummary

**Source files read:**
- LaneShadow: `react-native/components/planning/temp-range-summary.tsx`
- Framework: `react-native/Libraries/Components/View/View.js`

**Layout — container:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| alignItems | RN-wrapper | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.alignment(.center)` | n/a |
| gap | RN-wrapper | `semantic.space.sm` | `Arrangement.spacedBy(space.sm.dp)` | `spacing: space.sm` | `space.sm` (8) |

**Visual — icon:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| size | RN-wrapper | `16` | `Modifier.size(16.dp)` | `.frame(width: 16, height: 16)` | ESCALATE — propose `icon.xs = 16` |
| color (by extreme) | RN-wrapper | varies (info/danger/default) | varies | varies | varies by extreme status |

**Typography — text:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| variant | RN-wrapper | `bodySmall` (Paper) | `MaterialTheme.typography.bodySmall` | `theme.font.bodySmall` / `.font(.caption2)` | Paper `bodySmall` |
| color (normal) | RN-wrapper | `semantic.color.onSurface.default` | `MaterialTheme.colorScheme.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |
| color (unavailable) | RN-wrapper | `semantic.color.onSurface.muted` | `MaterialTheme.colorScheme.onSurfaceVariant` | `theme.colors.onSurfaceVariant` | `color.onSurface.muted` |
| color (cold) | RN-wrapper | `semantic.color.info.default` | `MaterialTheme.colorScheme.tertiary` (info) | `theme.colors.info` | `color.info.default` |
| color (hot) | RN-wrapper | `semantic.color.danger.default` | `MaterialTheme.colorScheme.error` | `theme.colors.error` | `color.danger.default` |
| opacity (unavailable) | RN-wrapper | `0.6` | `Modifier.alpha(0.6f)` | `.opacity(0.6)` | n/a |

### WeatherStrip

**Source files read:**
- LaneShadow: `react-native/components/planning/weather-strip.tsx`
- Framework: `react-native/Libraries/TouchableWithoutFeedback/TouchableWithoutFeedback.js`

**Layout — container:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| alignItems | RN-wrapper | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.alignment(.center)` | n/a |
| gap | RN-wrapper | `6` | `Arrangement.spacedBy(6.dp)` | `spacing: 6` | ESCALATE — propose `space.xs + space.xs = 6` |
| paddingVertical | RN-wrapper | `4` | `Modifier.padding(vertical = 4.dp)` | `.padding(.vertical, 4)` | `space.xs` (4) |
| paddingHorizontal | RN-wrapper | `8` | `Modifier.padding(horizontal = 8.dp)` | `.padding(.horizontal, 8)` | `space.sm` (8) |
| borderRadius | RN-wrapper | `8` | `Modifier.clip(RoundedCornerShape(8.dp))` | `.cornerRadius(8)` | `radius.md` (8) |
| alignSelf | RN-wrapper | `'flex-start'` | `Modifier.wrapContentWidth()` | `.frame(maxWidth: .infinity, alignment: .leading)` | n/a |

**Visual — container colors:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| backgroundColor | RN-wrapper | `addOpacity(semantic.color.success.default, 0.08)` | `successColor.copy(alpha = 0.08f)` | `Color.success.opacity(0.08)` | `color.success.default` + alpha |

**Layout — badgeContainer:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| alignItems | RN-wrapper | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.alignment(.center)` | n/a |
| gap | RN-wrapper | `6` | `Arrangement.spacedBy(6.dp)` | `spacing: 6` | ESCALATE — propose `space.xs + space.xs = 6` |

**Layout — goodConditionsBadge:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| alignItems | RN-wrapper | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.alignment(.center)` | n/a |
| gap | RN-wrapper | `4` | `Arrangement.spacedBy(4.dp)` | `spacing: 4` | `space.xs` (4) |
| paddingVertical | RN-wrapper | `4` | `Modifier.padding(vertical = 4.dp)` | `.padding(.vertical, 4)` | `space.xs` (4) |
| paddingHorizontal | RN-wrapper | `8` | `Modifier.padding(horizontal = 8.dp)` | `.padding(.horizontal, 8)` | `space.sm` (8) |
| borderRadius | RN-wrapper | `6` | `Modifier.clip(RoundedCornerShape(6.dp))` | `.cornerRadius(6)` | ESCALATE — propose `radius.xs + space.xs = 6` |

**Visual — goodConditionsBadge colors:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| backgroundColor | RN-wrapper | `addOpacity(semantic.color.success.default, 0.15)` | `successColor.copy(alpha = 0.15f)` | `Color.success.opacity(0.15)` | `color.success.default` + alpha |
| icon color | RN-wrapper | `semantic.color.success.default` | `MaterialTheme.colorScheme.primary` (success) | `theme.colors.success` | `color.success.default` |
| label color | RN-wrapper | `semantic.color.success.default` | `MaterialTheme.colorScheme.primary` (success) | `theme.colors.success` | `color.success.default` |

**Typography — goodConditionsBadge:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| icon fontSize | RN-wrapper | `12` | `TextStyle(fontSize = 12.sp)` | `.font(.system(size: 12))` | ESCALATE — propose `type.label.xs = 12` |
| icon fontWeight | RN-wrapper | `'600'` | `FontWeight.SemiBold` (600) | `.weight(.semibold)` | n/a |
| label fontSize | RN-wrapper | `12` | `TextStyle(fontSize = 12.sp)` | `.font(.system(size: 12))` | ESCALATE — propose `type.label.xs = 12` |
| label fontWeight | RN-wrapper | `'500'` | `FontWeight.Medium` (500) | `.weight(.medium)` | n/a |

**Layout — additionalWarningBadge:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| paddingVertical | RN-wrapper | `4` | `Modifier.padding(vertical = 4.dp)` | `.padding(.vertical, 4)` | `space.xs` (4) |
| paddingHorizontal | RN-wrapper | `8` | `Modifier.padding(horizontal = 8.dp)` | `.padding(.horizontal, 8)` | `space.sm` (8) |
| borderRadius | RN-wrapper | `6` | `Modifier.clip(RoundedCornerShape(6.dp))` | `.cornerRadius(6)` | ESCALATE — propose `radius.xs + space.xs = 6` |
| marginLeft | RN-wrapper | `2` | `Modifier.padding(start = 2.dp)` | `.padding(.leading, 2)` | ESCALATE — propose `space.xs / 2 = 2` |

**Visual — additionalWarningBadge colors:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| backgroundColor | RN-wrapper | `addOpacity(semantic.color.warning.default, 0.15)` | `warningColor.copy(alpha = 0.15f)` | `Color.warning.opacity(0.15)` | `color.warning.default` + alpha |
| label color | RN-wrapper | `semantic.color.warning.default` | `MaterialTheme.colorScheme.tertiary` (warning) | `theme.colors.warning` | `color.warning.default` |

**Typography — additionalWarningBadge:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| fontSize | RN-wrapper | `12` | `TextStyle(fontSize = 12.sp)` | `.font(.system(size: 12))` | ESCALATE — propose `type.label.xs = 12` |
| fontWeight | RN-wrapper | `'600'` | `FontWeight.SemiBold` (600) | `.weight(.semibold)` | n/a |

**Layout — expandedBadges:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| alignItems | RN-wrapper | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.alignment(.center)` | n/a |
| gap | RN-wrapper | `6` | `Arrangement.spacedBy(6.dp)` | `spacing: 6` | ESCALATE — propose `space.xs + space.xs = 6` |
| marginLeft | RN-wrapper | `6` | `Modifier.padding(start = 6.dp)` | `.padding(.leading, 6)` | ESCALATE — propose `space.xs + space.xs = 6` |

### EnrichmentStatusIndicator

**Source files read:**
- LaneShadow: `react-native/components/planning/enrichment-status-indicator.tsx`
- Framework: `react-native-reanimated`, `react-native/Libraries/Components/ActivityIndicator/ActivityIndicator.js`

**Layout — minimalContainer:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| alignSelf | RN-wrapper | `'flex-start'` | `Modifier.wrapContentWidth()` | `.frame(maxWidth: .infinity, alignment: .leading)` | n/a |
| borderWidth | RN-wrapper | `1` | `Modifier.border(1.dp, ...)` | `.overlay(..., lineWidth: 1)` | n/a |
| borderRadius | RN-wrapper | `12` | `Modifier.clip(RoundedCornerShape(12.dp))` | `.cornerRadius(12)` | ESCALATE — propose `radius.lg + space.xs = 12` |
| paddingVertical | RN-wrapper | `4` | `Modifier.padding(vertical = 4.dp)` | `.padding(.vertical, 4)` | `space.xs` (4) |
| paddingHorizontal | RN-wrapper | `8` | `Modifier.padding(horizontal = 8.dp)` | `.padding(.horizontal, 8)` | `space.sm` (8) |

**Visual — minimalContainer colors (by status):**

| Status | backgroundColor | borderColor | Android | iOS | Token |
|---|---|---|---|---|---|
| completed | `${success}15` | `success` | `successColor.copy(alpha = 0.08f)` / `successColor` | `Color.success.opacity(0.08)` / `Color.success` | `color.success.default` + alpha |
| failed | `${danger}15` | `danger` | `errorColor.copy(alpha = 0.08f)` / `errorColor` | `Color.error.opacity(0.08)` / `Color.error` | `color.danger.default` + alpha |
| cancelled | `surfaceVariant.pressed` | `onSurface.muted` | `surfaceVariantColor` / `onSurfaceVariantColor` | `theme.colors.surfaceVariant` / `theme.colors.onSurfaceVariant` | `color.surfaceVariant.pressed` / `color.onSurface.muted` |
| running-extended | `${info}15` | `info` | `infoColor.copy(alpha = 0.08f)` / `infoColor` | `Color.info.opacity(0.08)` / `Color.info` | `color.info.default` + alpha |
| other | `${primary}15` | `primary` | `primaryColor.copy(alpha = 0.08f)` / `primaryColor` | `Color.primary.opacity(0.08)` / `Color.primary` | `color.primary.default` + alpha |

**Layout — minimalContent:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| alignItems | RN-wrapper | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.alignment(.center)` | n/a |

**Visual — minimal icon/text:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| icon size (minimal) | RN-wrapper | `14` | `Modifier.size(14.dp)` | `.frame(width: 14, height: 14)` | ESCALATE — propose `icon.xs = 14` |
| icon size (other) | RN-wrapper | `16` | `Modifier.size(16.dp)` | `.frame(width: 16, height: 16)` | ESCALATE — propose `icon.xs = 16` |
| marginLeft | RN-wrapper | `semantic.space.xs` | `Modifier.padding(start = space.xs.dp)` | `.padding(.leading, space.xs)` | `space.xs` (4) |
| textStyle | RN-wrapper | `semantic.type.label.sm` | `MaterialTheme.typography.labelSmall` | `theme.font.labelSmall` / `.font(.caption)` | `type.label.sm` |

**Layout — inlineContainer:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| alignSelf | RN-wrapper | `'flex-start'` | `Modifier.wrapContentWidth()` | `.frame(maxWidth: .infinity, alignment: .leading)` | n/a |

**Layout — inlineInner:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| alignItems | RN-wrapper | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.alignment(.center)` | n/a |
| justifyContent | RN-wrapper | `'space-between'` | `horizontalArrangement = Arrangement.SpaceBetween` | n/a (HStack default) | n/a |
| borderWidth | RN-wrapper | `1` | `Modifier.border(1.dp, ...)` | `.overlay(..., lineWidth: 1)` | n/a |
| borderRadius | RN-wrapper | `12` | `Modifier.clip(RoundedCornerShape(12.dp))` | `.cornerRadius(12)` | ESCALATE — propose `radius.lg + space.xs = 12` |
| paddingVertical | RN-wrapper | `6` | `Modifier.padding(vertical = 6.dp)` | `.padding(.vertical, 6)` | ESCALATE — propose `space.xs + space.xs = 6` |
| paddingHorizontal | RN-wrapper | `10` | `Modifier.padding(horizontal = 10.dp)` | `.padding(.horizontal, 10)` | ESCALATE — propose `space.md - space.xs = 10` |
| gap | RN-wrapper | `8` | `Arrangement.spacedBy(8.dp)` | `spacing: 8` | `space.sm` (8) |

**Layout — standaloneContainer:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| borderWidth | RN-wrapper | `1` | `Modifier.border(1.dp, ...)` | `.overlay(..., lineWidth: 1)` | n/a |
| borderRadius | RN-wrapper | `semantic.radius.md` | `Modifier.clip(RoundedCornerShape(radius.md.dp))` | `.cornerRadius(radius.md)` | `radius.md` (8) |
| padding | RN-wrapper | `semantic.space.md` | `Modifier.padding(space.md.dp)` | `.padding(space.md)` | `space.md` (12) |
| gap | RN-wrapper | `8` | `Arrangement.spacedBy(8.dp)` | `spacing: 8` | `space.sm` (8) |
| elevation | RN-wrapper | `semantic.elevation[1]` | `Modifier.shadow(elevation = 1.dp, ...)` | `.shadow(radius: 2, y: 1)` | `elevation[1]` |

**Layout — standaloneHeader:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| alignItems | RN-wrapper | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.alignment(.center)` | n/a |
| justifyContent | RN-wrapper | `'space-between'` | `horizontalArrangement = Arrangement.SpaceBetween` | n/a (HStack default) | n/a |

**Layout — standaloneLeft:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| alignItems | RN-wrapper | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.alignment(.center)` | n/a |
| flex | RN-wrapper | `1` | `Modifier.weight(1f)` | `.layoutPriority(1)` | n/a |
| marginLeft | RN-wrapper | `semantic.space.sm` | `Modifier.padding(start = space.sm.dp)` | `.padding(.leading, space.sm)` | `space.sm` (8) |

**Typography — standalone text:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| style | RN-wrapper | `semantic.type.label.sm` | `MaterialTheme.typography.labelSmall` | `theme.font.labelSmall` / `.font(.caption)` | `type.label.sm` |
| fontWeight | RN-wrapper | `'600'` | `FontWeight.SemiBold` (600) | `.weight(.semibold)` | n/a |
| marginLeft | RN-wrapper | `semantic.space.sm` | `Modifier.padding(start = space.sm.dp)` | `.padding(.leading, space.sm)` | `space.sm` (8) |

**Layout — standaloneDetails:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| gap | RN-wrapper | `4` | `Arrangement.spacedBy(4.dp)` | `spacing: 4` | `space.xs` (4) |
| marginTop | RN-wrapper | `semantic.space.sm` | `Modifier.padding(top = space.sm.dp)` | `.padding(.top, space.sm)` | `space.sm` (8) |

**Layout — progressBar:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| height | RN-wrapper | `4` | `Modifier.height(4.dp)` | `.frame(height: 4)` | ESCALATE — propose `space.xs = 4` |
| borderRadius | RN-wrapper | `2` | `Modifier.clip(RoundedCornerShape(2.dp))` | `.cornerRadius(2)` | n/a (composed) |
| backgroundColor | RN-wrapper | `${accentColor}30` (19% alpha) | `accentColor.copy(alpha = 0.19f)` | `Color.accent.opacity(0.19)` | varies by status + alpha |

**Layout — progressFill:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| height | RN-wrapper | `'100%'` | `Modifier.fillMaxHeight()` | `.frame(maxHeight: .infinity)` | n/a |
| borderRadius | RN-wrapper | `2` | `Modifier.clip(RoundedCornerShape(2.dp))` | `.cornerRadius(2)` | n/a (composed) |
| width (fast) | RN-wrapper | `'60%'` | `Modifier.fillMaxWidth(0.6f)` | `.frame(maxWidth: .infinity).frame(width: 60%)` | n/a |
| width (extended) | RN-wrapper | `'85%'` | `Modifier.fillMaxWidth(0.85f)` | `.frame(maxWidth: .infinity).frame(width: 85%)` | n/a |

**Typography — progress text:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| style | RN-wrapper | `semantic.type.label.sm` | `MaterialTheme.typography.labelSmall` | `theme.font.labelSmall` / `.font(.caption)` | `type.label.sm` |
| color | RN-wrapper | `semantic.color.onSurface.muted` | `MaterialTheme.colorScheme.onSurfaceVariant` | `theme.colors.onSurfaceVariant` | `color.onSurface.muted` |
| marginTop | RN-wrapper | `semantic.space.xs` | `Modifier.padding(top = space.xs.dp)` | `.padding(.top, space.xs)` | `space.xs` (4) |

**Layout — retryButton:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| marginLeft | RN-wrapper | `semantic.space.sm` | `Modifier.padding(start = space.sm.dp)` | `.padding(.leading, space.sm)` | `space.sm` (8) |
| hitSlop | RN-wrapper | `8` | `Modifier.clickable(onClick = {}, indication = null).padding(8.dp)` | `.contentShape(Rectangle()).padding(8)` | `space.sm` (8) |

## DESIGN NOTES

- Preserve RN spacing, composition hierarchy, and edge-case fixtures such as long labels, loading, and error states.
- Provide a static capture mode for motion-heavy or animated states so screenshot diffs remain deterministic.
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
