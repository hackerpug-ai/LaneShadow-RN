# UI-049: Android organisms 6/7 — enrichment & waypoint composition: `EnrichedRouteCard`, `EnrichmentProgressProvider`, `WaypointList`

**Task ID:** UI-049
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

Sprint 2 translates the React Native baseline into native platform components and sandbox scenarios before rider-facing feature sprints resume. This task covers the `organisms` slice for `Android organisms 6/7 — enrichment & waypoint composition: EnrichedRouteCard, EnrichmentProgressProvider, WaypointList`.

**Objective:** Implement Android organisms 6/7 — enrichment & waypoint composition: `EnrichedRouteCard`, `EnrichmentProgressProvider`, `WaypointList` as Jetpack Compose work with parity to the RN baseline, token-only styling, and sandbox coverage.

**Success State:** A reviewer can open the Android sandbox, browse this task's scenarios, and confirm naming, interface, theme, state, accessibility, and layout parity against RN.

## CRITICAL CONSTRAINTS

### MUST
- Implement the listed components or compositions with parity-aligned naming and interfaces: `EnrichedRouteCard`, `EnrichmentProgressProvider`, `WaypointList`.
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
**THEN** The listed components or compositions exist in the correct Android Compose directories with parity-aligned names and signatures: `EnrichedRouteCard`, `EnrichmentProgressProvider`, `WaypointList`.
**Verify:** `printf "%s\n" "`EnrichedRouteCard`, `EnrichmentProgressProvider`, `WaypointList`"`

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
| TC-1 | AC-1 | The listed components or compositions exist in the correct Android Compose directories with parity-aligned names and signatures: `EnrichedRouteCard`, `EnrichmentProgressProvider`, `WaypointList`. | `printf "%s\n" "`EnrichedRouteCard`, `EnrichmentProgressProvider`, `WaypointList`"` |
| TC-2 | AC-2 | All visuals use the LaneShadow core theme contract from `UI-001` and render correctly in both color modes without hardcoded UI primitives. | `rg -n "Token consumption\|light and dark" .spec/prds/native-rewrite/08d-component-parity-spec.md .spec/prds/native-rewrite/08-design-system.md` |
| TC-3 | AC-3 | Each listed component has deterministic sandbox coverage with RN reference labels and explicit state variants where applicable. | `rg -n "RN reference\|scenario\|interactive states" .spec/prds/native-rewrite/tasks/sprint-02-ui-component-translation/SPRINT.md` |
| TC-4 | AC-4 | Accessibility labels, touch targets, keyboard or safe-area handling, and motion or state parity behave correctly for this component family. | `rg -n "Accessibility\|Keyboard handling\|RTL support\|Animation parity\|State parity" .spec/prds/native-rewrite/08d-component-parity-spec.md` |
| TC-5 | AC-5 | The composition renders using only previously defined platform components, deterministic fixtures, and no backend or auth dependencies. | `rg -n "deterministic\|fixtures\|no auth\|no backend" .spec/prds/native-rewrite/tasks/sprint-02-ui-component-translation/SPRINT.md` |
| TC-6 | ALL | Repo validation gates remain green for the touched workspace when this task is complete. | `detekt --input android --config .detekt/config.yml && ./android/gradlew assembleDebug` |

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
|---|---|---|---|---|---|
| EnrichedRouteCard | `react-native/components/enrichment/enriched-route-card.tsx` | `node_modules/react-native-reanimated` (Animated.View, FadeIn, FadeOut, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming); `node_modules/react-native/Libraries/Utilities/AccessibilityInfo/AccessibilityInfo.js` (announceForAccessibility) | `android/app/src/main/java/com/laneshadow/ui/organisms/EnrichedRouteCard.kt` | 1 layout × 5 enrichment statuses (pending/running-fast/running-extended/completed/failed/cancelled) × inline indicator variant |
| EnrichmentProgressProvider | `react-native/components/enrichment/enrichment-progress-provider.tsx` | `node_modules/react-native/Libraries/Utilities/AccessibilityInfo/AccessibilityInfo.js` (announceForAccessibility); React Context (createContext, useContext, Provider) | `android/app/src/main/java/com/laneshadow/ui/organisms/EnrichmentProgressProvider.kt` | 4 statuses (draft/partial/complete/failed) × auto-dismiss toast (3000ms default) |
| WaypointList | `react-native/components/waypoints/waypoint-list.tsx` | `node_modules/react-native/Libraries/Components/Pressable/Pressable.js` (Pressable); `node_modules/react-native/Libraries/Utilities/AccessibilityInfo/AccessibilityInfo.js` (announceForAccessibility) | `android/app/src/main/java/com/laneshadow/ui/organisms/WaypointList.kt` | 3 states (loading/empty/with-waypoints) × collapsible header × glassmorphic container |

## STYLE PROPERTIES MATRIX

> Exhaustive enumeration of every style property from both sources per `08f-translation-protocol.md`. Columns: Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping. `ESCALATE` = no token covers the value — add a proposed token to DECISIONS.md before implementing.
>
> **Token reference** (from `tokens/semantic/semantic.tokens.json`): space xs=4 sm=8 md=12 lg=16 xl=24 2xl=32 3xl=48 4xl=64; radius none=0 sm=4 md=8 lg=16 xl=24 2xl=32 full=9999; elevation[2] shadowOffset=0/2 shadowOpacity=0.05 shadowRadius=4 androidElevation=2. **Paper labelLarge**: fontFamily=sans-serif-medium, fontWeight=500, fontSize=14, lineHeight=20, letterSpacing=0.1. **Paper labelSmall**: fontFamily=sans-serif-medium, fontWeight=500, fontSize=11, lineHeight=16, letterSpacing=0.5. **semantic.type.label.md**: fontSize=14, lineHeight=20, fontWeight=500. **semantic.type.body.sm**: fontSize=14, lineHeight=21, fontWeight=400.

### EnrichedRouteCard

**Source files read:**
- LaneShadow: `react-native/components/enrichment/enriched-route-card.tsx`
- Framework: `node_modules/react-native-reanimated`
- Dependencies: `react-native/components/ui/route-option-card.tsx`, `react-native/components/planning/enrichment-status-indicator.tsx`, `react-native/hooks/use-enrichment-status.ts`

**Note:** EnrichedRouteCard is a wrapper component that composes RouteOptionCard and EnrichmentStatusIndicator. All styling is delegated to child components. See RouteOptionCard (UI-041/042) and EnrichmentStatusIndicator (below) for detailed style properties.

**Composition:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| showEnrichmentIndicator | RN-wrapper | `['pending', 'running', 'failed'].includes(enrichment.status)` | `if (listOf('pending', 'running', 'failed').contains(enrichment.status))` | `if (['pending', 'running', 'failed'].contains(enrichment.status))` | n/a (status enum) |
| indicatorStatus (running-fast) | RN-wrapper | `'running-fast' as const` | `EnrichmentStatus.RunningFast` | `.runningFast` | n/a (enum case) |
| indicatorStatus (running-extended) | RN-wrapper | `'running-extended' as const` | `EnrichmentStatus.RunningExtended` | `.runningExtended` | n/a (enum case) |
| variant | RN-wrapper | `'inline'` (fixed) | `EnrichmentVariant.Inline` | `.inline` | n/a (variant enum) |
| enrichedWeatherSummary | RN-wrapper | `routeEnrichment.highlights.slice(0, 2).join(' • ')` | `enrichment.highlights.take(2).joinToString(' • ')` | `enrichment.highlights.prefix(2).joined(separator: ' • ')` | n/a (string join) |

---

### EnrichmentStatusIndicator (dependency of EnrichedRouteCard)

**Source files read:**
- LaneShadow: `react-native/components/planning/enrichment-status-indicator.tsx`
- Framework: `node_modules/react-native-reanimated`, `node_modules/react-native/Libraries/Components/ActivityIndicator/ActivityIndicator.js`
- Dependencies: `react-native/components/ui/badge.tsx`, `react-native/components/ui/icon-symbol.tsx`

**Layout — minimal container:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| alignSelf | RN-wrapper | `'flex-start'` | `Modifier.align(Alignment.Start)` | `.frame(maxWidth: .infinity, alignment: .leading)` | n/a |
| borderWidth | RN-wrapper | `1` | `Modifier.border(1.dp, ...)` | `.overlay(RoundedRectangle(...).stroke(..., lineWidth: 1))` | ESCALATE — propose `borderWidth.thin = 1` |
| borderRadius | RN-wrapper | `12` | `RoundedCornerShape(12.dp)` | `RoundedRectangle(cornerRadius: 12)` | ESCALATE — `radius` token 12 missing; propose `radius.md2 = 12` |
| paddingVertical | RN-wrapper | `4` | `Modifier.padding(vertical = 4.dp)` | `.padding(.vertical, 4)` | `space.xs` ✓ |
| paddingHorizontal | RN-wrapper | `8` | `Modifier.padding(horizontal = 8.dp)` | `.padding(.horizontal, 8)` | `space.sm` ✓ |

**Layout — minimal content:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| alignItems | RN-wrapper | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.alignment(.center)` | n/a |

**Layout — inline container:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| alignSelf | RN-wrapper | `'flex-start'` | `Modifier.align(Alignment.Start)` | `.frame(maxWidth: .infinity, alignment: .leading)` | n/a |

**Layout — inline inner:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| alignItems | RN-wrapper | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.alignment(.center)` | n/a |
| justifyContent | RN-wrapper | `'space-between'` | `horizontalArrangement = Arrangement.SpaceBetween` | `Spacer()` | n/a |
| borderWidth | RN-wrapper | `1` | `Modifier.border(1.dp, ...)` | `.overlay(RoundedRectangle(...).stroke(..., lineWidth: 1))` | ESCALATE — propose `borderWidth.thin = 1` |
| borderRadius | RN-wrapper | `12` | `RoundedCornerShape(12.dp)` | `RoundedRectangle(cornerRadius: 12)` | ESCALATE — `radius` token 12 missing |
| paddingVertical | RN-wrapper | `6` | `Modifier.padding(vertical = 6.dp)` | `.padding(.vertical, 6)` | ESCALATE — `space.xxs = 6` not in tokens; propose |
| paddingHorizontal | RN-wrapper | `10` | `Modifier.padding(horizontal = 10.dp)` | `.padding(.horizontal, 10)` | ESCALATE — `space.sm2 = 10` not in tokens; propose |
| gap | RN-wrapper | `8` | `Arrangement.spacedBy(8.dp)` | `Spacer(minLength: 8)` | `space.sm` ✓ |

**Layout — inline left:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| alignItems | RN-wrapper | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.alignment(.center)` | n/a |

**Visual — status colors:**

| Status | Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| completed | accentColor | RN-wrapper | `semantic.color.success.default` | `LaneShadowTheme.colors.success` | `theme.colors.success` | `color.success.default` |
| completed | backgroundColor | RN-wrapper | `${semantic.color.success.default}15` (21% opacity) | `LaneShadowTheme.colors.success.copy(alpha = 0.15f)` | `theme.colors.success.opacity(0.15)` | ESCALATE — `color.success.tint = 21%` not in tokens; use opacity |
| failed | accentColor | RN-wrapper | `semantic.color.danger.default` | `LaneShadowTheme.colors.danger` | `theme.colors.danger` | `color.danger.default` |
| failed | backgroundColor | RN-wrapper | `${semantic.color.danger.default}15` | `LaneShadowTheme.colors.danger.copy(alpha = 0.15f)` | `theme.colors.danger.opacity(0.15)` | ESCALATE — `color.danger.tint = 21%` not in tokens; use opacity |
| cancelled | accentColor | RN-wrapper | `semantic.color.onSurface.muted` | `LaneShadowTheme.colors.onSurfaceMuted` | `theme.colors.onSurfaceMuted` | `color.onSurface.muted` |
| cancelled | backgroundColor | RN-wrapper | `semantic.color.surfaceVariant.pressed` | `LaneShadowTheme.colors.surfaceVariantPressed` | `theme.colors.surfaceVariantPressed` | `color.surfaceVariant.pressed` |
| running-extended | accentColor | RN-wrapper | `semantic.color.info.default` | `LaneShadowTheme.colors.info` | `theme.colors.info` | `color.info.default` |
| running-extended | backgroundColor | RN-wrapper | `${semantic.color.info.default}15` | `LaneShadowTheme.colors.info.copy(alpha = 0.15f)` | `theme.colors.info.opacity(0.15)` | ESCALATE — `color.info.tint = 21%` not in tokens; use opacity |
| pending/running-fast | accentColor | RN-wrapper | `semantic.color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |
| pending/running-fast | backgroundColor | RN-wrapper | `${semantic.color.primary.default}15` | `LaneShadowTheme.colors.primary.copy(alpha = 0.15f)` | `theme.colors.primary.opacity(0.15)` | ESCALATE — `color.primary.tint = 21%` not in tokens; use opacity |

**Visual — borderColor (inline):**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| color | RN-wrapper | `${accentColor}40` (25% opacity) | `accentColor.copy(alpha = 0.25f)` | `accentColor.opacity(0.25)` | ESCALATE — use opacity |

**Visual — activity indicator:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| size (minimal) | RN-wrapper | `'small'` | `14.dp` | `14` | ESCALATE — propose `size.activityIndicator.small = 14` |
| size (inline/standalone) | RN-wrapper | `16` | `16.dp` | `16` | ESCALATE — propose `size.activityIndicator.md = 16` |
| color | RN-wrapper | `accentColor` (per status) | `LaneShadowTheme.colors.{status}` | `theme.colors.{status}` | per status token |

**Visual — icons:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| size (minimal) | RN-wrapper | `14` | `14.dp` | `14` | ESCALATE — propose `icon.xs = 14` |
| size (inline/standalone) | RN-wrapper | `16` | `16.dp` | `16` | ESCALATE — propose `icon.sm = 16` |
| color | RN-wrapper | `accentColor` (per status) | `LaneShadowTheme.colors.{status}` | `theme.colors.{status}` | per status token |

**Typography — label:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| variant | RN-wrapper | `semantic.type.label.sm` | `MaterialTheme.typography.labelSmall` | `.font(.caption)` | ESCALATE — `type.label.sm` not in Paper; use semantic |
| fontSize | semantic | `12` | `12.sp` | `12` | ESCALATE — propose `type.label.sm.fontSize = 12` |
| fontWeight | semantic | `500` | `FontWeight.Medium` | `.medium` | `type.label.sm.fontWeight` ✓ |
| lineHeight | semantic | `16` | `16.sp` | `.lineSpacing(16 - 12)` = 4 | ESCALATE — propose `type.label.sm.lineHeight = 16` |
| marginLeft (minimal/inline) | RN-wrapper | `semantic.space.xs` = 4 | `Modifier.padding(start = 4.dp)` | `.padding(.leading, 4)` | `space.xs` ✓ |
| marginLeft (standalone) | RN-wrapper | `semantic.space.sm` = 8 | `Modifier.padding(start = 8.dp)` | `.padding(.leading, 8)` | `space.sm` ✓ |

**Typography — standalone label (fontWeight):**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| fontWeight | RN-wrapper | `'600'` | `FontWeight.SemiBold` | `.semibold` | ESCALATE — propose `fontWeight.semibold = 600` |

**Layout — standalone container:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| borderWidth | RN-wrapper | `1` | `Modifier.border(1.dp, ...)` | `.overlay(RoundedRectangle(...).stroke(..., lineWidth: 1))` | ESCALATE — propose `borderWidth.thin = 1` |
| borderRadius | RN-wrapper | `semantic.radius.md` = 8 | `RoundedCornerShape(8.dp)` | `RoundedRectangle(cornerRadius: 8)` | `radius.md` ✓ |
| padding | RN-wrapper | `semantic.space.md` = 12 | `Modifier.padding(12.dp)` | `.padding(12)` | `space.md` ✓ |
| gap | RN-wrapper | `8` | `Arrangement.spacedBy(8.dp)` | `Spacer(minLength: 8)` | `space.sm` ✓ |

**Layout — standalone header:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| alignItems | RN-wrapper | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.alignment(.center)` | n/a |
| justifyContent | RN-wrapper | `'space-between'` | `horizontalArrangement = Arrangement.SpaceBetween` | `Spacer()` | n/a |

**Layout — standalone left:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| alignItems | RN-wrapper | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.alignment(.center)` | n/a |
| flex | RN-wrapper | `1` | `Modifier.weight(1f)` | `.frame(maxWidth: .infinity)` | n/a |

**Layout — phase badge:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| marginLeft | RN-wrapper | `semantic.space.xs` = 4 | `Modifier.padding(start = 4.dp)` | `.padding(.leading, 4)` | `space.xs` ✓ |
| opacity | RN-wrapper | `0.6` | `Modifier.alpha(0.6f)` | `.opacity(0.6)` | ESCALATE — propose `opacity.secondary = 0.6` |

**Layout — standalone details:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| marginTop | RN-wrapper | `semantic.space.sm` = 8 | `Modifier.padding(top = 8.dp)` | `.padding(.top, 8)` | `space.sm` ✓ |
| gap | RN-wrapper | `4` | `Arrangement.spacedBy(4.dp)` | `Spacer(minLength: 4)` | `space.xs` ✓ |

**Layout — progress bar:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| height | RN-wrapper | `4` | `Modifier.height(4.dp)` | `.frame(height: 4)` | ESCALATE — propose `size.progressBar.height = 4` |
| borderRadius | RN-wrapper | `2` | `RoundedCornerShape(2.dp)` | `RoundedRectangle(cornerRadius: 2)` | ESCALATE — propose `radius.sm2 = 2` |
| backgroundColor | RN-wrapper | `${accentColor}30` (19% opacity) | `accentColor.copy(alpha = 0.19f)` | `accentColor.opacity(0.19)` | ESCALATE — use opacity |

**Layout — progress fill:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| height | RN-wrapper | `'100%'` | `Modifier.fillMaxHeight()` | `.frame(maxHeight: .infinity)` | n/a |
| borderRadius | RN-wrapper | `2` | `RoundedCornerShape(2.dp)` | `RoundedRectangle(cornerRadius: 2)` | ESCALATE — propose `radius.sm2 = 2` |
| width (running-fast) | RN-wrapper | `'60%'` | `Modifier.fillMaxWidth(0.6f)` | `.frame(maxWidth: .infinity)` * 0.6 | n/a |
| width (running-extended) | RN-wrapper | `'85%'` | `Modifier.fillMaxWidth(0.85f)` | `.frame(maxWidth: .infinity)` * 0.85 | n/a |

**Typography — details label:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| variant | RN-wrapper | `semantic.type.label.sm` | `MaterialTheme.typography.labelSmall` | `.font(.caption)` | ESCALATE — `type.label.sm` not in Paper; use semantic |
| marginTop | RN-wrapper | `semantic.space.xs` = 4 | `Modifier.padding(top = 4.dp)` | `.padding(.top, 4)` | `space.xs` ✓ |
| color | RN-wrapper | `semantic.color.onSurface.muted` | `LaneShadowTheme.colors.onSurfaceMuted` | `theme.colors.onSurfaceMuted` | `color.onSurface.muted` |

**Layout — retry button:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| marginLeft | RN-wrapper | `semantic.space.sm` = 8 | `Modifier.padding(start = 8.dp)` | `.padding(.leading, 8)` | `space.sm` ✓ |
| hitSlop | RN-wrapper | `8` | `Modifier.clickable(onClick, indication = null).padding(8.dp)` | `.contentShape(Rectangle()).padding(8)` | ESCALATE — `space.sm = 8` ✓ |

**Animation — pulse (running states):**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| withSequence | RN-wrapper | `withTiming(0.4, { duration: 800 }), withTiming(1, { duration: 800 })` | `animateFloatAsState(..., animationSpec = infiniteRepeatable(tween(800), repeating = RepeatMode.Reverse))` | `.opacity(pulseOpacity).animation(.easeInOut(duration: 0.8).repeatForever(autoreverses: true))` | n/a (animation timing) |
| duration | RN-wrapper | `800ms` | `800ms` | `0.8` | n/a (animation timing) |

**Animation — enter/exit:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| FadeIn.duration | RN-wrapper | `200` | `AnimatedContent(...) { ... }` (EnterTransition) | `.transition(.opacity.animation(.easeIn(duration: 0.2)))` | n/a (animation timing) |
| FadeOut.duration | RN-wrapper | `200` | `AnimatedContent(...) { ... }` (ExitTransition) | `.transition(.opacity.animation(.easeOut(duration: 0.2)))` | n/a (animation timing) |

---

### EnrichmentProgressProvider

**Source files read:**
- LaneShadow: `react-native/components/enrichment/enrichment-progress-provider.tsx`
- Framework: `node_modules/react-native/Libraries/Utilities/AccessibilityInfo/AccessibilityInfo.js`, React Context

**Note:** EnrichmentProgressProvider is a context provider component with no visual styling. It manages state and accessibility announcements. All styling is delegated to child components (e.g., EnrichmentStatusIndicator).

**State management:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| AUTO_DISMISS_DELAY_MS | RN-wrapper | `3000` | `3000L` | `3.0` | ESCALATE — propose `timing.toast.autoDismiss = 3000` |

**Accessibility announcements:**

| Status | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| draft | RN-wrapper | `'Route enrichment starting'` | `stringResource(R.string.enrichment_starting)` | `NSLocalizedString('enrichment_starting', ...)` | n/a (localization) |
| partial | RN-wrapper | `'Route partially enriched'` | `stringResource(R.string.enrichment_partial)` | `NSLocalizedString('enrichment_partial', ...)` | n/a (localization) |
| complete | RN-wrapper | `'Route enrichment complete'` | `stringResource(R.string.enrichment_complete)` | `NSLocalizedString('enrichment_complete', ...)` | n/a (localization) |
| failed | RN-wrapper | `'Route enrichment failed'` | `stringResource(R.string.enrichment_failed)` | `NSLocalizedString('enrichment_failed', ...)` | n/a (localization) |

**Default stages:**

| Stage | Source | Value |
|---|---|---|
| DEFAULT_STAGES | RN-wrapper | `[{ name: 'Leg labels', complete: false }, { name: 'Weather data', complete: false }, { name: 'Elevation', complete: false }, { name: 'Scenic analysis', complete: false }]` |

---

### WaypointList

**Source files read:**
- LaneShadow: `react-native/components/waypoints/waypoint-list.tsx`
- Framework: `node_modules/react-native/Libraries/Components/Pressable/Pressable.js`, `node_modules/react-native/Libraries/Utilities/AccessibilityInfo/AccessibilityInfo.js`
- Dependencies: `react-native/components/waypoints/waypoint-card.tsx`, `react-native/components/ui/drag-handle.tsx`, `react-native/components/ui/icon-symbol.tsx`

**Layout — glassmorphic container:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| width | RN-wrapper | `'100%'` | `Modifier.fillMaxWidth()` | `.frame(maxWidth: .infinity)` | n/a |
| borderRadius | RN-wrapper | `16` | `RoundedCornerShape(16.dp)` | `RoundedRectangle(cornerRadius: 16)` | `radius.lg` ✓ |
| borderWidth | RN-wrapper | `1` | `Modifier.border(1.dp, ...)` | `.overlay(RoundedRectangle(...).stroke(..., lineWidth: 1))` | ESCALATE — propose `borderWidth.thin = 1` |
| backgroundColor | RN-wrapper | `addOpacity(semantic.color.surface.default, 0.85)` | `LaneShadowTheme.colors.surface.copy(alpha = 0.85f)` | `theme.colors.surface.opacity(0.85)` | ESCALATE — `color.surface.alpha = 85%` not in tokens; use opacity |
| borderColor | RN-wrapper | `addOpacity(semantic.color.border.default, 0.3)` | `LaneShadowTheme.colors.border.copy(alpha = 0.3f)` | `theme.colors.border.opacity(0.3)` | ESCALATE — `color.border.alpha = 30%` not in tokens; use opacity |
| padding | RN-wrapper | `semantic.space.lg` = 16 | `Modifier.padding(16.dp)` | `.padding(16)` | `space.lg` ✓ |

**Layout — header:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| alignItems | RN-wrapper | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.alignment(.center)` | n/a |
| justifyContent | RN-wrapper | `'space-between'` | `horizontalArrangement = Arrangement.SpaceBetween` | `Spacer()` | n/a |
| padding | RN-wrapper | `16` | `Modifier.padding(16.dp)` | `.padding(16)` | `space.lg` ✓ |
| borderRadius | RN-wrapper | `16` | `RoundedCornerShape(16.dp)` | `RoundedRectangle(cornerRadius: 16)` | `radius.lg` ✓ |
| backgroundColor (pressed) | RN-wrapper | `addOpacity(semantic.color.primary.default, 0.1)` | `LaneShadowTheme.colors.primary.copy(alpha = 0.1f)` (via interactionSource) | `.opacity(pressed ? 1.0 : 0.8)` | ESCALATE — `color.primary.pressed = 10%` not in tokens; use opacity |

**Layout — header left:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| alignItems | RN-wrapper | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.alignment(.center)` | n/a |
| gap | RN-wrapper | `8` | `Arrangement.spacedBy(8.dp)` | `Spacer(minLength: 8)` | `space.sm` ✓ |

**Typography — header title:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| fontSize | RN-wrapper | `18` | `18.sp` | `18` | ESCALATE — `type.heading.md.fontSize = 18` not in tokens; propose |
| fontWeight | RN-wrapper | `'600'` | `FontWeight.SemiBold` | `.semibold` | ESCALATE — propose `fontWeight.semibold = 600` |
| color | RN-wrapper | `semantic.color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |

**Typography — header count:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| fontSize | RN-wrapper | `14` | `14.sp` | `14` | `type.body.sm.fontSize` ✓ |
| color | RN-wrapper | `semantic.color.onSurface.subtle` | `LaneShadowTheme.colors.onSurfaceSubtle` | `theme.colors.onSurfaceSubtle` | `color.onSurface.subtle` |

**Visual — pending indicator:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| size | RN-wrapper | `8 × 8` | `Modifier.size(8.dp)` | `.frame(width: 8, height: 8)` | ESCALATE — propose `size.indicator.dot = 8` |
| borderRadius | RN-wrapper | `4` | `RoundedCornerShape(4.dp)` | `RoundedRectangle(cornerRadius: 4)` | `radius.sm` ✓ |
| backgroundColor | RN-wrapper | `semantic.color.warning.default` | `LaneShadowTheme.colors.warning` | `theme.colors.warning` | `color.warning.default` |

**Visual — chevron icon:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| size | RN-wrapper | `24` | `24.dp` | `24` | ESCALATE — `icon.lg = 24` not in tokens; propose |
| color | RN-wrapper | `semantic.color.onSurface.subtle` | `LaneShadowTheme.colors.onSurfaceSubtle` | `theme.colors.onSurfaceSubtle` | `color.onSurface.subtle` |
| name (collapsed) | RN-wrapper | `'chevron-down'` | `Icons.AutoMirrored.Filled.KeyboardArrowDown` | `chevron.down` | n/a (icon name) |
| name (expanded) | RN-wrapper | `'chevron-up'` | `Icons.AutoMirrored.Filled.KeyboardArrowUp` | `chevron.up` | n/a (icon name) |

**Layout — drag handle container:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| alignItems | RN-wrapper | `'center'` | `Modifier.align(Alignment.CenterHorizontally)` | `.frame(maxWidth: .infinity)` | n/a |
| paddingVertical | RN-wrapper | `4` | `Modifier.padding(vertical = 4.dp)` | `.padding(.vertical, 4)` | `space.xs` ✓ |

**Layout — waypoint cards:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| paddingHorizontal | RN-wrapper | `16` | `Modifier.padding(horizontal = 16.dp)` | `.padding(.horizontal, 16)` | `space.lg` ✓ |
| paddingBottom | RN-wrapper | `16` | `Modifier.padding(bottom = 16.dp)` | `.padding(.bottom, 16)` | `space.lg` ✓ |

**Typography — loading/empty text:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| fontSize | RN-wrapper | `14` | `14.sp` | `14` | `type.body.sm.fontSize` ✓ |
| textAlign | RN-wrapper | `'center'` | `textAlign = TextAlign.Center` | `.multilineTextAlignment(.center)` | n/a |
| color (loading) | RN-wrapper | `semantic.color.onSurface.subtle` | `LaneShadowTheme.colors.onSurfaceSubtle` | `theme.colors.onSurfaceSubtle` | `color.onSurface.subtle` |
| color (empty) | RN-wrapper | `semantic.color.onSurface.subtle` | `LaneShadowTheme.colors.onSurfaceSubtle` | `theme.colors.onSurfaceSubtle` | `color.onSurface.subtle` |
| fontStyle (empty) | RN-wrapper | `'italic'` | `FontStyle.Italic` | `.italic()` | n/a (font style) |

**Accessibility — WaypointList:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| accessibilityLabel | RN-wrapper | `'Waypoint list'` | `contentDescription = 'Waypoint list'` | `.accessibilityLabel('Waypoint list')` | n/a (localization) |
| accessibilityHint | RN-wrapper | `'\${count} waypoints\${hasPending ? ', some pending approval' : ''}'` | `contentDescription = '...'` | `.accessibilityHint('...')` | n/a (localization) |

---

### WaypointCard (dependency of WaypointList)

**Source files read:**
- LaneShadow: `react-native/components/waypoints/waypoint-card.tsx`
- Framework: `node_modules/react-native/Libraries/Components/Pressable/Pressable.js`
- Dependencies: `react-native/components/ui/badge.tsx`, `react-native/components/ui/button.tsx`, `react-native/components/ui/icon-symbol.tsx`

**Layout — card:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| borderStyle | RN-wrapper | `'solid'` | `Modifier.border(1.dp, ...)` | `.overlay(RoundedRectangle(...).stroke(..., lineWidth: 1))` | n/a |
| borderWidth | RN-wrapper | `1` (rejected: 2) | `Modifier.border(1.dp, ...)` or `Modifier.border(2.dp, ...)` | `.overlay(RoundedRectangle(...).stroke(..., lineWidth: 1))` | ESCALATE — propose `borderWidth.thin = 1, borderWidth.medium = 2` |
| borderRadius | RN-wrapper | `semantic.radius.lg` = 16 | `RoundedCornerShape(16.dp)` | `RoundedRectangle(cornerRadius: 16)` | `radius.lg` ✓ |
| padding | RN-wrapper | `semantic.space.lg` = 16 | `Modifier.padding(16.dp)` | `.padding(16)` | `space.lg` ✓ |
| marginBottom | RN-wrapper | `semantic.space.md` = 12 | `Modifier.padding(bottom = 12.dp)` | `.padding(.bottom, 12)` | `space.md` ✓ |

**Visual — card colors:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| backgroundColor | RN-wrapper | `semantic.color.card.default` | `LaneShadowTheme.colors.card` | `theme.colors.card` | `color.card.default` |
| borderColor (rejected) | RN-wrapper | `semantic.color.danger.default` | `LaneShadowTheme.colors.danger` | `theme.colors.danger` | `color.danger.default` |
| borderColor (default) | RN-wrapper | `semantic.color.border.default` | `LaneShadowTheme.colors.border` | `theme.colors.border` | `color.border.default` |

**Layout — card header:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| justifyContent | RN-wrapper | `'space-between'` | `horizontalArrangement = Arrangement.SpaceBetween` | `Spacer()` | n/a |
| alignItems | RN-wrapper | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.alignment(.center)` | n/a |
| marginBottom | RN-wrapper | `semantic.space.md` = 12 | `Modifier.padding(bottom = 12.dp)` | `.padding(.bottom, 12)` | `space.md` ✓ |

**Layout — header left:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| alignItems | RN-wrapper | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.alignment(.center)` | n/a |

**Typography — kind label:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| fontSize | RN-wrapper | `12` | `12.sp` | `12` | ESCALATE — propose `type.label.sm.fontSize = 12` |
| fontWeight | RN-wrapper | `'600'` | `FontWeight.SemiBold` | `.semibold` | ESCALATE — propose `fontWeight.semibold = 600` |
| marginLeft | RN-wrapper | `semantic.space.xs` = 4 | `Modifier.padding(start = 4.dp)` | `.padding(.leading, 4)` | `space.xs` ✓ |

**Typography — order label:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| fontSize | RN-wrapper | `12` | `12.sp` | `12` | ESCALATE — propose `type.label.sm.fontSize = 12` |
| fontWeight | RN-wrapper | `'500'` | `FontWeight.Medium` | `.medium` | `type.label.sm.fontWeight` ✓ |
| marginLeft | RN-wrapper | `semantic.space.sm` = 8 | `Modifier.padding(start = 8.dp)` | `.padding(.leading, 8)` | `space.sm` ✓ |
| color | RN-wrapper | `semantic.color.onSurface.subtle` | `LaneShadowTheme.colors.onSurfaceSubtle` | `theme.colors.onSurfaceSubtle` | `color.onSurface.subtle` |

**Visual — drag handle icon:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| size | RN-wrapper | `20` | `20.dp` | `20` | ESCALATE — propose `icon.md = 20` |
| color | RN-wrapper | `semantic.color.onSurface.subtle` | `LaneShadowTheme.colors.onSurfaceSubtle` | `theme.colors.onSurfaceSubtle` | `color.onSurface.subtle` |

**Typography — waypoint name:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| fontSize | RN-wrapper | `16` | `16.sp` | `16` | `type.body.md.fontSize` ✓ |
| fontWeight | RN-wrapper | `'600'` | `FontWeight.SemiBold` | `.semibold` | ESCALATE — propose `fontWeight.semibold = 600` |
| marginBottom | RN-wrapper | `semantic.space.xs` = 4 | `Modifier.padding(bottom = 4.dp)` | `.padding(.bottom, 4)` | `space.xs` ✓ |
| color | RN-wrapper | `semantic.color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |

**Typography — waypoint description:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| fontSize | RN-wrapper | `14` | `14.sp` | `14` | `type.body.sm.fontSize` ✓ |
| marginBottom | RN-wrapper | `semantic.space.md` = 12 | `Modifier.padding(bottom = 12.dp)` | `.padding(.bottom, 12)` | `space.md` ✓ |
| color | RN-wrapper | `semantic.color.onSurface.subtle` | `LaneShadowTheme.colors.onSurfaceSubtle` | `theme.colors.onSurfaceSubtle` | `color.onSurface.subtle` |

**Layout — status row:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |

**Layout — deviation info:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| backgroundColor | RN-wrapper | `semantic.color.surface.default` | `LaneShadowTheme.colors.surface` | `theme.colors.surface` | `color.surface.default` |
| marginBottom | RN-wrapper | `semantic.space.md` = 12 | `Modifier.padding(bottom = 12.dp)` | `.padding(.bottom, 12)` | `space.md` ✓ |
| paddingVertical | RN-wrapper | `semantic.space.sm` = 8 | `Modifier.padding(vertical = 8.dp)` | `.padding(.vertical, 8)` | `space.sm` ✓ |
| paddingHorizontal | RN-wrapper | `semantic.space.md` = 12 | `Modifier.padding(horizontal = 12.dp)` | `.padding(.horizontal, 12)` | `space.md` ✓ |
| borderRadius | RN-wrapper | `semantic.radius.md` = 8 | `RoundedCornerShape(8.dp)` | `RoundedRectangle(cornerRadius: 8)` | `radius.md` ✓ |
| gap | RN-wrapper | `semantic.space.md` = 12 | `Arrangement.spacedBy(12.dp)` | `Spacer(minLength: 12)` | `space.md` ✓ |

**Layout — deviation item:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| alignItems | RN-wrapper | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.alignment(.center)` | n/a |
| gap | RN-wrapper | `semantic.space.xs` = 4 | `Arrangement.spacedBy(4.dp)` | `Spacer(minLength: 4)` | `space.xs` ✓ |

**Typography — deviation text:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| fontSize | RN-wrapper | `13` | `13.sp` | `13` | ESCALATE — propose `type.body.xs.fontSize = 13` |
| fontWeight | RN-wrapper | `'500'` | `FontWeight.Medium` | `.medium` | `type.label.sm.fontWeight` ✓ |
| color | RN-wrapper | `semantic.color.onSurface.subtle` | `LaneShadowTheme.colors.onSurfaceSubtle` | `theme.colors.onSurfaceSubtle` | `color.onSurface.subtle` |

**Visual — deviation icons:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| size | RN-wrapper | `14` | `14.dp` | `14` | ESCALATE — propose `icon.xs = 14` |
| color | RN-wrapper | `semantic.color.onSurface.subtle` | `LaneShadowTheme.colors.onSurfaceSubtle` | `theme.colors.onSurfaceSubtle` | `color.onSurface.subtle` |

**Layout — action buttons:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| gap | RN-wrapper | `semantic.space.sm` = 8 | `Arrangement.spacedBy(8.dp)` | `Spacer(minLength: 8)` | `space.sm` ✓ |
| marginTop | RN-wrapper | `semantic.space.xs` = 4 | `Modifier.padding(top = 4.dp)` | `.padding(.top, 4)` | `space.xs` ✓ |

**Layout — action button:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| flex | RN-wrapper | `1` | `Modifier.weight(1f)` | `.frame(maxWidth: .infinity)` | n/a |
| size | RN-wrapper (Button) | `'sm'` | `ButtonSize.Small` | `.controlSize(.small)` | n/a (button variant) |
| variant (reject) | RN-wrapper | `'outline'` | `ButtonVariant.Outline` | `.buttonStyle(.bordered)` | n/a (button variant) |
| variant (approve) | RN-wrapper | `'default'` | `ButtonVariant.Primary` | `.buttonStyle(.borderedProminent)` | n/a (button variant) |

---

## DESIGN NOTES

- Use deterministic composition fixtures so complex sheets, maps, chat, and stacked layouts remain diffable.
- Provide a static capture mode for motion-heavy or animated states so screenshot diffs remain deterministic.
- Avoid unstyled Material defaults and route all styling through the documented Compose theme layer.

## VERIFICATION GATES

- detekt --input android --config .detekt/config.yml
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
