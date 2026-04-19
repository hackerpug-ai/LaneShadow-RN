# UI-019: Android molecules 3/12 — weather badges & pills: `WeatherPill`, `TemperatureBadge`, `RainBadge`, `WindBadge`, `WeatherOverlay`, `WeatherGauge`, `WeatherPillsRow`

**Task ID:** UI-019
**Sprint:** Sprint 2 - UI Component Translation and Fidelity Sandbox
**Assigned To:** kotlin-implementer
**Reviewer:** kotlin-reviewer
**Estimate:** 480 min
**Type:** [FEATURE]
**Status:** Planned
**Phase:** Molecules
**Quality Score:** 115/115

---

## BACKGROUND

Sprint 2 translates the React Native baseline into native platform components and sandbox scenarios before rider-facing feature sprints resume. This task covers the `molecules` slice for `Android molecules 3/12 — weather badges & pills: WeatherPill, TemperatureBadge, RainBadge, WindBadge, WeatherOverlay, WeatherGauge, WeatherPillsRow`.

**Objective:** Implement Android molecules 3/12 — weather badges & pills: `WeatherPill`, `TemperatureBadge`, `RainBadge`, `WindBadge`, `WeatherOverlay`, `WeatherGauge`, `WeatherPillsRow` as Jetpack Compose work with parity to the RN baseline, token-only styling, and sandbox coverage.

**Success State:** A reviewer can open the Android sandbox, browse this task's scenarios, and confirm naming, interface, theme, state, accessibility, and layout parity against RN.

## CRITICAL CONSTRAINTS

### MUST
- Implement the listed components or compositions with parity-aligned naming and interfaces: `WeatherPill`, `TemperatureBadge`, `RainBadge`, `WindBadge`, `WeatherOverlay`, `WeatherGauge`, `WeatherPillsRow`.
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
**THEN** The listed components or compositions exist in the correct Android Compose directories with parity-aligned names and signatures: `WeatherPill`, `TemperatureBadge`, `RainBadge`, `WindBadge`, `WeatherOverlay`, `WeatherGauge`, `WeatherPillsRow`.
**Verify:** `printf "%s\n" "`WeatherPill`, `TemperatureBadge`, `RainBadge`, `WindBadge`, `WeatherOverlay`, `WeatherGauge`, `WeatherPillsRow`"`

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
| TC-1 | AC-1 | The listed components or compositions exist in the correct Android Compose directories with parity-aligned names and signatures: `WeatherPill`, `TemperatureBadge`, `RainBadge`, `WindBadge`, `WeatherOverlay`, `WeatherGauge`, `WeatherPillsRow`. | `printf "%s\n" "`WeatherPill`, `TemperatureBadge`, `RainBadge`, `WindBadge`, `WeatherOverlay`, `WeatherGauge`, `WeatherPillsRow`"` |
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
| WeatherPill | `react-native/components/ui/weather-pill.tsx` | `node_modules/react-native/Libraries/Components/View/View.js` (View); `node_modules/react-native-paper/src/styles/themes/v3/tokens.tsx` (useTheme) | `android/app/src/main/java/com/laneshadow/ui/molecules/WeatherPill.kt` | 1 layout × iconSize (default 16) × backgroundColor override × textColor override |
| TemperatureBadge | `react-native/components/ui/temperature-badge.tsx` | `react-native/components/ui/badge.tsx` (Badge); `node_modules/react-native/Libraries/Components/View/View.js` | `android/app/src/main/java/com/laneshadow/ui/molecules/TemperatureBadge.kt` | 5 temperature levels (cold/mild/warm/hot/unavailable) × withValue/withoutValue × opacity (0.15/0.08) |
| RainBadge | `react-native/components/ui/rain-badge.tsx` | `react-native/components/ui/badge.tsx` (Badge); `node_modules/react-native/Libraries/Components/View/View.js` | `android/app/src/main/java/com/laneshadow/ui/molecules/RainBadge.kt` | 5 rain levels (none/light/moderate/heavy/unavailable) × 4 variants (success/warning/destructive/secondary) × opacity (0.15/0.2/0.08) |
| WindBadge | `react-native/components/planning/wind-badge.tsx` | `react-native/components/ui/badge.tsx` (Badge); `node_modules/react-native/Libraries/Components/View/View.js` | `android/app/src/main/java/com/laneshadow/ui/molecules/WindBadge.kt` | 4 wind levels (low/moderate/high/unavailable) × 4 variants (success/warning/destructive/secondary) |
| WeatherOverlay | `react-native/components/map/weather-overlay.tsx` | `node_modules/@rnmapbox/maps/lib/components/shapeSource.js` (ShapeSource); `node_modules/@rnmapbox/maps/lib/components/lineLayer.js` (LineLayer) | `android/app/src/main/java/com/laneshadow/ui/molecules/WeatherOverlay.kt` | 3 layers (wind/rain/temperature) × BASE_STROKE_WIDTH (6) × opacity (0.75-0.95) × zoom-based width scale |
| WeatherGauge | `react-native/components/map/weather-gauge.tsx` | `node_modules/react-native/Libraries/Components/View/View.js` (View); `node_modules/react-native/Libraries/Components/Text/Text.js` | `android/app/src/main/java/com/laneshadow/ui/molecules/WeatherGauge.kt` | 3 metrics (wind/rain/temp) × 1 fixed size (minWidth 56, padding 8) |
| WeatherPillsRow | `react-native/components/map/weather-pills-row.tsx` | `node_modules/react-native/Libraries/Components/View/View.js` (View); `node_modules/react-native-paper/src/styles/themes/v3/tokens.tsx` (useTheme) | `android/app/src/main/java/com/laneshadow/ui/molecules/WeatherPillsRow.kt` | 3 pills (wind/temp/conditions) × glassmorphic background × severity tints (10% opacity) |

## STYLE PROPERTIES MATRIX

> Exhaustive enumeration of every style property from both sources per `08f-translation-protocol.md`. Columns: Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping. `ESCALATE` = no token covers the value — add a proposed token to DECISIONS.md before implementing.
>
> **Token reference** (from `tokens/semantic/semantic.tokens.json`): space xs=4 sm=8 md=12 lg=16 xl=24 2xl=32 3xl=48 4xl=64; radius none=0 sm=4 md=8 lg=16 xl=24 2xl=32 full=9999; elevation[2] shadowOffset=0/2 shadowOpacity=0.05 shadowRadius=4 androidElevation=2. **Paper labelLarge**: fontFamily=sans-serif-medium, fontWeight=500, fontSize=14, lineHeight=20, letterSpacing=0.1. **Paper labelSmall**: fontFamily=sans-serif-medium, fontWeight=500, fontSize=11, lineHeight=16, letterSpacing=0.5. **semantic.type.label.md**: fontSize=14, lineHeight=20, fontWeight=500. **semantic.type.body.sm**: fontSize=14, lineHeight=21, fontWeight=400.

### WeatherPill

**Source files read:**
- LaneShadow: `react-native/components/ui/weather-pill.tsx`
- Framework: `node_modules/react-native/Libraries/Components/View/View.js`, `node_modules/react-native-paper/src/styles/themes/v3/tokens.tsx`

**Layout — container:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| alignItems | RN-wrapper | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.alignment(.center)` | n/a |
| gap | RN-wrapper | `6` | `Modifier.width(6.dp)` or `Arrangement.spacedBy(6.dp)` | `Spacer(minLength: 6)` | ESCALATE — propose `space.xs = 4` has 4, need 6 |
| paddingVertical | RN-wrapper | `6` | `Modifier.padding(vertical = 6.dp)` | `.padding(.vertical, 6)` | ESCALATE — propose `space.sm = 8` (6 is between xs=4 and sm=8) |
| paddingHorizontal | RN-wrapper | `12` | `Modifier.padding(horizontal = 12.dp)` | `.padding(.horizontal, 12)` | ESCALATE — propose `space.md = 12` |
| borderRadius | RN-wrapper | `20` | `RoundedCornerShape(20.dp)` | `RoundedRectangle(cornerRadius: 20)` | ESCALATE — propose `radius.xl = 24` (20 is close) |
| alignSelf | RN-wrapper | `'flex-start'` | `Modifier.align(Alignment.Start)` | `.frame(maxWidth: .infinity, alignment: .leading)` | n/a |

**Layout — icon:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| iconSize (default) | RN-wrapper props | `16` | `size = 16.dp` | `16` | ESCALATE — between sm=8 and md=12 |
| gap (icon-text) | RN-wrapper | `6` | `Spacer(minLength: 6.dp)` | `Spacer(minLength: 6)` | same as container gap |

**Visual — colors:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| backgroundColor (default) | RN-wrapper | `${semantic.color.warning.default}26` (15% alpha) | `LaneShadowTheme.colors.warning.copy(alpha = 0.15f)` | `theme.colors.warning.opacity(0.15)` | `color.warning.default` + alpha |
| textColor (default) | RN-wrapper | `semantic.color.warning.default` | `LaneShadowTheme.colors.warning` | `theme.colors.warning` | `color.warning.default` |
| fontSize (description) | RN-wrapper | `13` | `fontSize = 13.sp` | `.font(.system(size: 13))` | ESCALATE — 13 is non-standard |

### TemperatureBadge

**Source files read:**
- LaneShadow: `react-native/components/ui/temperature-badge.tsx`, `react-native/components/ui/badge.tsx`
- Framework: `node_modules/react-native/Libraries/Components/View/View.js`

**Layout — inherits from Badge:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| flexDirection | Badge | `'row'` | `Row(...)` | `HStack` | n/a |
| gap | Badge | `4` | `Arrangement.spacedBy(4.dp)` | `Spacer(minLength: 4)` | `space.xs = 4` |
| paddingHorizontal | Badge | `10` | `Modifier.padding(horizontal = 10.dp)` | `.padding(.horizontal, 10)` | ESCALATE — 10 (between xs=4 and sm=8) |
| paddingVertical | Badge | `2` | `Modifier.padding(vertical = 2.dp)` | `.padding(.vertical, 2)` | ESCALATE — 2 is minimal |
| borderRadius | Badge | `semantic.radius.full` | `CircleShape` | `Capsule` / `RoundedRectangle(cornerRadius: .infinity)` | `radius.full = 9999` |

**Visual — badge variants × opacity:**

| Level | Badge variant | Opacity | Background color | Text color | Token |
|---|---|---|---|---|---|
| cold | `info` | 0.15 | `color.info.default × 0.15` | `color.onSurface.subtle` | `color.info.default` |
| mild | `success` | 0.15 | `color.success.default × 0.15` | `color.onSurface.subtle` | `color.success.default` |
| warm | `warning` | 0.15 | `color.warning.default × 0.15` | `color.onSurface.subtle` | `color.warning.default` |
| hot | `destructive` | 0.15 | `color.danger.default × 0.15` | `color.onSurface.subtle` | `color.danger.default` |
| unavailable | `secondary` | 0.08 | `color.secondary.default × 0.08` | `color.onSurface.subtle` | `color.secondary.default` |

**Visual — icon:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| iconSize | RN-wrapper | `14` | `size = 14.dp` | `14` | ESCALATE — 14 is non-standard |
| iconColor | RN-wrapper | `semantic.color.onSurface.subtle` | `LaneShadowTheme.colors.onSurfaceSubtle` | `theme.colors.onSurfaceSubtle` | `color.onSurface.subtle` |
| gap (icon-text) | Badge | `4` | `Spacer(minLength: 4.dp)` | `Spacer(minLength: 4)` | `space.xs = 4` |

**Typography — text:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| fontSize | Badge | `semantic.type.label.sm` | `MaterialTheme.typography.labelSmall` | `.font(.system(size: 11))` | `type.label.sm` |
| fontWeight | Badge | `600` (from Badge) | `FontWeight.SemiBold` | `.fontWeight(.semibold)` | non-token |

### RainBadge

**Source files read:**
- LaneShadow: `react-native/components/ui/rain-badge.tsx`, `react-native/components/ui/badge.tsx`
- Framework: `node_modules/react-native/Libraries/Components/View/View.js`

**Layout — inherits from Badge (same as TemperatureBadge above)**

**Visual — badge variants × opacity:**

| Level | Badge variant | Opacity | Background color | Text color | Token |
|---|---|---|---|---|---|
| none | `success` | 0.15 | `color.success.default × 0.15` | `color.onSurface.subtle` | `color.success.default` |
| light | `warning` | 0.15 | `color.warning.default × 0.15` | `color.onSurface.subtle` | `color.warning.default` |
| moderate | `warning` | 0.2 | `color.warning.default × 0.2` | `color.onSurface.subtle` | `color.warning.default` |
| heavy | `destructive` | 0.15 | `color.danger.default × 0.15` | `color.onSurface.subtle` | `color.danger.default` |
| unavailable | `secondary` | 0.08 | `color.secondary.default × 0.08` | `color.onSurface.subtle` | `color.secondary.default` |

**Visual — icon color (overrides Badge default):**

| Level | Icon color | Token |
|---|---|---|
| none | `color.success.default` | `color.success.default` |
| light | `color.warning.default` | `color.warning.default` |
| moderate | `color.warning.default` | `color.warning.default` |
| heavy | `color.danger.default` | `color.danger.default` |
| unavailable | `color.onSurface.subtle` | `color.onSurface.subtle` |

### WindBadge

**Source files read:**
- LaneShadow: `react-native/components/planning/wind-badge.tsx`, `react-native/components/ui/badge.tsx`
- Framework: `node_modules/react-native/Libraries/Components/View/View.js`

**Layout — inherits from Badge (same as TemperatureBadge above)**

**Visual — badge variants:**

| Level | Badge variant | Background color | Text color | Token |
|---|---|---|---|---|
| low | `success` | `color.success.default` | `color.onSurface.subtle` | `color.success.default` |
| moderate | `warning` | `color.warning.default` | `color.onSurface.subtle` | `color.warning.default` |
| high | `destructive` | `color.danger.default` | `color.onSurface.subtle` | `color.danger.default` |
| unavailable | `secondary` | `color.secondary.default` | `color.onSurface.subtle` | `color.secondary.default` |

**Visual — icon:**
- Uses `weather-windy` icon name
- No explicit iconSize — relies on Badge icon rendering

### WeatherOverlay

**Source files read:**
- LaneShadow: `react-native/components/map/weather-overlay.tsx`
- Framework: `node_modules/@rnmapbox/maps/lib/components/shapeSource.js`, `node_modules/@rnmapbox/maps/lib/components/lineLayer.js`

**Visual — line properties:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| BASE_STROKE_WIDTH | RN-wrapper | `6` | `lineWidth = 6f` | `lineWidth = 6` | ESCALATE — propose `strokeWidth.medium = 6` |
| wind opacity | RN-wrapper | `0.85` | `lineOpacity = 0.85f` | `lineOpacity = 0.85` | ESCALATE — opacity constant |
| rain opacity (light) | RN-wrapper | `0.75` | `lineOpacity = 0.75f` | `lineOpacity = 0.75` | ESCALATE — opacity constant |
| rain opacity (moderate) | RN-wrapper | `0.85` | `lineOpacity = 0.85f` | `lineOpacity = 0.85` | ESCALATE — opacity constant |
| rain opacity (heavy) | RN-wrapper | `0.95` | `lineOpacity = 0.95f` | `lineOpacity = 0.95` | ESCALATE — opacity constant |
| rain width | RN-wrapper | `BASE_STROKE_WIDTH + 1 = 7` | `lineWidth = 7f` | `lineWidth = 7` | ESCALATE — derived constant |
| temperature opacity | RN-wrapper | `0.9` | `lineOpacity = 0.9f` | `lineOpacity = 0.9` | ESCALATE — opacity constant |
| temperature width | RN-wrapper | `BASE_STROKE_WIDTH - 1 = 5` | `lineWidth = 5f` | `lineWidth = 5` | ESCALATE — derived constant |
| lineCap | RN-wrapper | `'round'` | `lineCap = LineCap.Round` | `lineCap = .round` | n/a |
| lineJoin | RN-wrapper | `'round'` | `lineJoin = LineJoin.Round` | `lineJoin = .round` | n/a |

**Visual — colors (by level):**
- Wind: `getWindColor(level, semantic)` — uses `semantic.color.success/warning/danger.default`
- Rain: `getRainColor(level, semantic)` — uses `semantic.color.success/warning/danger.default`
- Temperature: `getTemperatureColor(level, semantic)` — uses `semantic.color.info/warning/danger/default`

**Zoom-based width scale:**

| Zoom range | Scale factor | Effective width (base=6) |
|---|---|---|
| < 12 (low) | 1.5 | 9 |
| 12-15 (medium) | 1.0 | 6 |
| > 15 (high) | 0.75 | 4.5 |

### WeatherGauge

**Source files read:**
- LaneShadow: `react-native/components/map/weather-gauge.tsx`
- Framework: `node_modules/react-native/Libraries/Components/View/View.js`, `node_modules/react-native/Libraries/Components/Text/Text.js`

**Layout — container:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| position | RN-wrapper | `absolute top:0 right:0` | `Modifier.align(Alignment.TopEnd)` | `.frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topTrailing)` | n/a |
| borderRadius | RN-wrapper | `12` | `RoundedCornerShape(12.dp)` | `RoundedRectangle(cornerRadius: 12)` | `radius.lg = 16` (12 is close) |
| padding | RN-wrapper | `8` | `Modifier.padding(8.dp)` | `.padding(8)` | `space.sm = 8` |
| gap | RN-wrapper | `8` | `Arrangement.spacedBy(8.dp)` | `Spacer(minLength: 8)` | `space.sm = 8` |
| minWidth | RN-wrapper | `56` | `Modifier.widthIn(min = 56.dp)` | `.frame(minWidth: 56)` | ESCALATE — 56 is non-standard |

**Layout — value circle:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| width/height | RN-wrapper | `44` | `Modifier.size(44.dp)` | `.frame(width: 44, height: 44)` | ESCALATE — 44 is between 2xl=32 and 3xl=48 |
| borderRadius | RN-wrapper | `22` (half of 44) | `CircleShape` | `Circle()` | `radius.full = 9999` |
| borderWidth | RN-wrapper | `1.5` | `BorderStroke(1.5.dp, color)` | `.border(width: 1.5)` | ESCALATE — 1.5 is non-standard |

**Typography — value:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| fontSize | RN-wrapper | `16` | `fontSize = 16.sp` | `.font(.system(size: 16))` | ESCALATE — 16 is close to md=12 |
| fontWeight | RN-wrapper | `700` | `FontWeight.Bold` | `.fontWeight(.bold)` | non-token |
| lineHeight | RN-wrapper | `20` | `lineHeight = 20.sp` | `.lineSpacing(4)` (16+4=20) | `type.label.md = 20` |

**Typography — unit:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| fontSize | RN-wrapper | `9` | `fontSize = 9.sp` | `.font(.system(size: 9))` | ESCALATE — 9 is non-standard |
| fontWeight | RN-wrapper | `600` | `FontWeight.SemiBold` | `.fontWeight(.semibold)` | non-token |
| letterSpacing | RN-wrapper | `0.5` | `letterSpacing = 0.5.sp` | `.tracking(0.5)` | ESCALATE — 0.5 is Paper labelSmall |
| textTransform | RN-wrapper | `'uppercase'` | `text = text.uppercase()` | `.textCase(.uppercase)` | n/a |

**Layout — metric border:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| borderTopWidth | RN-wrapper | `1` | `BorderStroke(1.dp, color)` | `.border(width: 1)` | ESCALATE — minimal border |
| borderStyle | RN-wrapper | `'dotted'` | `BorderStroke(1.dp, color, BorderStyle.Dashed)` (no dotted in Compose) | `.border(style: .dotted)` | n/a |
| borderColor | RN-wrapper | `'rgba(255,255,255,0.1)'` | `Color.White.copy(alpha = 0.1f)` | `Color.white.opacity(0.1)` | ESCALATE — hardcoded white |

### WeatherPillsRow

**Source files read:**
- LaneShadow: `react-native/components/map/weather-pills-row.tsx`
- Framework: `node_modules/react-native/Libraries/Components/View/View.js`, `node_modules/react-native-paper/src/styles/themes/v3/tokens.tsx`

**Layout — container:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| alignItems | RN-wrapper | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.alignment(.center)` | n/a |
| paddingHorizontal | RN-wrapper | `8` | `Modifier.padding(horizontal = 8.dp)` | `.padding(.horizontal, 8)` | `space.sm = 8` |
| paddingVertical | RN-wrapper | `6` | `Modifier.padding(vertical = 6.dp)` | `.padding(.vertical, 6)` | ESCALATE — 6 is between xs=4 and sm=8 |
| borderRadius | RN-wrapper | `semantic.radius.full` | `CircleShape` | `Capsule` | `radius.full = 9999` |
| borderWidth | RN-wrapper | `1` | `BorderStroke(1.dp, color)` | `.border(width: 1)` | ESCALATE — minimal border |
| gap | RN-wrapper | `semantic.space.xs` | `Arrangement.spacedBy(4.dp)` | `Spacer(minLength: 4)` | `space.xs = 4` |

**Layout — pill:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| alignItems | RN-wrapper | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.alignment(.center)` | n/a |
| paddingHorizontal | RN-wrapper | `8` | `Modifier.padding(horizontal = 8.dp)` | `.padding(.horizontal, 8)` | `space.sm = 8` |
| paddingVertical | RN-wrapper | `4` | `Modifier.padding(vertical = 4.dp)` | `.padding(.vertical, 4)` | `space.xs = 4` |
| borderRadius | RN-wrapper | `9999` | `CircleShape` | `Capsule` | `radius.full = 9999` |
| gap | RN-wrapper | `4` | `Arrangement.spacedBy(4.dp)` | `Spacer(minLength: 4)` | `space.xs = 4` |

**Visual — container:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| backgroundColor | RN-wrapper | `addOpacity(semantic.color.surface.default, 0.85)` | `LaneShadowTheme.colors.surface.copy(alpha = 0.85f)` | `theme.colors.surface.opacity(0.85)` | `color.surface.default` + alpha |
| borderColor | RN-wrapper | `addOpacity(semantic.color.border.default, 0.3)` | `LaneShadowTheme.colors.border.copy(alpha = 0.3f)` | `theme.colors.border.opacity(0.3)` | `color.border.default` + alpha |

**Visual — pill (severity tint at 10% opacity):**

| Level | Background color | Token |
|---|---|---|
| high/heavy | `color.danger.default × 0.1` | `color.danger.default` |
| moderate/warm/hot | `color.warning.default × 0.1` | `color.warning.default` |
| cold | `color.info.default × 0.1` | `color.info.default` |
| none/low/mild | `color.success.default × 0.1` | `color.success.default` |

**Typography — pill text:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| semantic.type.label.sm | RN-wrapper | `fontSize: 11, fontWeight: 500, lineHeight: 16` | `MaterialTheme.typography.labelSmall` | `.font(.system(size: 11)).fontWeight(.medium)` | `type.label.sm` |
| fontWeight | RN-wrapper | `500` | `FontWeight.Medium` | `.fontWeight(.medium)` | non-token |

**Visual — icon:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| iconSize | RN-wrapper | `14` | `size = 14.dp` | `14` | ESCALATE — 14 is non-standard |
| iconColor | RN-wrapper | `semantic.color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |

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
