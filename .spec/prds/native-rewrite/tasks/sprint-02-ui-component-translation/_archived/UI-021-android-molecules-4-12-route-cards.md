# UI-021: Android molecules 4/12 — route cards (all): `RouteThumbnail`, `RouteBadge`, `RouteOptionCard` (ui), `RouteOptionCard` (planning), `SessionCard`, `SavedRouteCard`, `FavoriteRoadCard`, `RouteAttachmentCard` (ui), `RouteAttachmentCard` (chat), `RouteLegTimeline`, `RoutePin`, `WaypointCard`

**Task ID:** UI-021
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

Sprint 2 translates the React Native baseline into native platform components and sandbox scenarios before rider-facing feature sprints resume. This task covers the `molecules` slice for `Android molecules 4/12 — route cards (all): RouteThumbnail, RouteBadge, RouteOptionCard (ui), RouteOptionCard (planning), SessionCard, SavedRouteCard, FavoriteRoadCard, RouteAttachmentCard (ui), RouteAttachmentCard (chat), RouteLegTimeline, RoutePin, WaypointCard`.

**Objective:** Implement Android molecules 4/12 — route cards (all): `RouteThumbnail`, `RouteBadge`, `RouteOptionCard` (ui), `RouteOptionCard` (planning), `SessionCard`, `SavedRouteCard`, `FavoriteRoadCard`, `RouteAttachmentCard` (ui), `RouteAttachmentCard` (chat), `RouteLegTimeline`, `RoutePin`, `WaypointCard` as Jetpack Compose work with parity to the RN baseline, token-only styling, and sandbox coverage.

**Success State:** A reviewer can open the Android sandbox, browse this task's scenarios, and confirm naming, interface, theme, state, accessibility, and layout parity against RN.

## CRITICAL CONSTRAINTS

### MUST
- Implement the listed components or compositions with parity-aligned naming and interfaces: `RouteThumbnail`, `RouteBadge`, `RouteOptionCard` (ui), `RouteOptionCard` (planning), `SessionCard`, `SavedRouteCard`, `FavoriteRoadCard`, `RouteAttachmentCard` (ui), `RouteAttachmentCard` (chat), `RouteLegTimeline`, `RoutePin`, `WaypointCard`.
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
**THEN** The listed components or compositions exist in the correct Android Compose directories with parity-aligned names and signatures: `RouteThumbnail`, `RouteBadge`, `RouteOptionCard` (ui), `RouteOptionCard` (planning), `SessionCard`, `SavedRouteCard`, `FavoriteRoadCard`, `RouteAttachmentCard` (ui), `RouteAttachmentCard` (chat), `RouteLegTimeline`, `RoutePin`, `WaypointCard`.
**Verify:** `printf "%s\n" "`RouteThumbnail`, `RouteBadge`, `RouteOptionCard` (ui), `RouteOptionCard` (planning), `SessionCard`, `SavedRouteCard`, `FavoriteRoadCard`, `RouteAttachmentCard` (ui), `RouteAttachmentCard` (chat), `RouteLegTimeline`, `RoutePin`, `WaypointCard`"`

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
| TC-1 | AC-1 | The listed components or compositions exist in the correct Android Compose directories with parity-aligned names and signatures: `RouteThumbnail`, `RouteBadge`, `RouteOptionCard` (ui), `RouteOptionCard` (planning), `SessionCard`, `SavedRouteCard`, `FavoriteRoadCard`, `RouteAttachmentCard` (ui), `RouteAttachmentCard` (chat), `RouteLegTimeline`, `RoutePin`, `WaypointCard`. | `printf "%s\n" "`RouteThumbnail`, `RouteBadge`, `RouteOptionCard` (ui), `RouteOptionCard` (planning), `SessionCard`, `SavedRouteCard`, `FavoriteRoadCard`, `RouteAttachmentCard` (ui), `RouteAttachmentCard` (chat), `RouteLegTimeline`, `RoutePin`, `WaypointCard`"` |
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
| RouteThumbnail | `react-native/components/ui/route-thumbnail.tsx` | `node_modules/expo-linear-gradient/src/LinearGradient.tsx` (LinearGradient); `node_modules/react-native/Libraries/Components/View/View.js` | `android/app/src/main/java/com/laneshadow/ui/molecules/RouteThumbnail.kt` | 1 layout × width (default 96) × height (default 96) × bounds/rotation props |
| RouteBadge | `react-native/components/ui/route-badge.tsx` | `node_modules/react-native/Libraries/Components/View/View.js` (View); `node_modules/react-native-paper/src/styles/themes/v3/tokens.tsx` (useTheme) | `android/app/src/main/java/com/laneshadow/ui/molecules/RouteBadge.kt` | 2 variants (primary/neutral) × withIcon/withoutIcon × iconSize (default 14) |
| RouteOptionCard (ui) | `react-native/components/ui/route-option-card.tsx` | `react-native/components/ui/route-badge.tsx` (RouteBadge); `react-native/components/ui/weather-pill.tsx` (WeatherPill); `react-native/components/ui/stat-row.tsx` (StatRow) | `android/app/src/main/java/com/laneshadow/ui/molecules/RouteOptionCard.kt` | 2 variants (selected/compact) × withBadges/withoutBadges × withStats/withoutStats × withWeather/withoutWeather |
| RouteOptionCard (planning) | `react-native/components/planning/route-option-card.tsx` | `react-native/components/ui/badge.tsx` (Badge); `react-native/components/ui/rain-badge.tsx` (RainBadge); `react-native/components/ui/temperature-badge.tsx` (TemperatureBadge); `react-native/components/planning/wind-badge.tsx` (WindBadge) | `android/app/src/main/java/com/laneshadow/ui/molecules/PlanningRouteOptionCard.kt` | 1 layout × isSelected/isSelected=false × isLoading/isLoading=false × includeFavorites/includeFavorites=false |
| SessionCard | `react-native/components/ui/session-card.tsx` | `node_modules/react-native/Libraries/Components/Pressable/Pressable.js` (Pressable); `node_modules/react-native/Libraries/Components/View/View.js` | `android/app/src/main/java/com/laneshadow/ui/molecules/SessionCard.kt` | 3 statuses (active/completed/saved) × isActive/isActive=false × compact/compact=false × pressable/non-pressable |
| SavedRouteCard | `react-native/components/ui/saved-route-card.tsx` | `react-native/components/ui/route-thumbnail.tsx` (RouteThumbnail); `node_modules/react-native/Libraries/Components/Pressable/Pressable.js` | `android/app/src/main/java/com/laneshadow/ui/molecules/SavedRouteCard.kt` | 1 layout × thumbnail size 60×60 × withStats/withoutStats |
| FavoriteRoadCard | `react-native/components/ui/favorite-road-card.tsx` | `react-native/components/ui/route-thumbnail.tsx` (RouteThumbnail); `node_modules/react-native/Libraries/Components/Pressable/Pressable.js` | `android/app/src/main/java/com/laneshadow/ui/molecules/FavoriteRoadCard.kt` | 1 layout × thumbnail size 80×80 × withDeleteButton/withoutDeleteButton |
| RouteAttachmentCard (ui) | `react-native/components/ui/route-attachment-card.tsx` | `node_modules/react-native/Libraries/Components/Pressable/Pressable.js` (Pressable); `node_modules/react-native/Libraries/Components/View/View.js` | `android/app/src/main/java/com/laneshadow/ui/molecules/RouteAttachmentCard.kt` | 2 variants (compact/full) × isBest/isBest=false × isSelected/isSelected=false × withWeatherBadge/withoutWeatherBadge |
| RouteAttachmentCard (chat) | Same as ui variant | Same as ui variant | Same file as ui variant (variant prop switches) | Same variants as ui |
| RouteLegTimeline | `react-native/components/ui/route-leg-timeline.tsx` | `node_modules/expo-linear-gradient/src/LinearGradient.tsx` (LinearGradient); `react-native/components/planning/wind-badge.tsx` (WindBadge); `react-native/components/ui/rain-badge.tsx` (RainBadge) | `android/app/src/main/java/com/laneshadow/ui/molecules/RouteLegTimeline.kt` | 1 layout × legs array × withOverlays/withoutOverlays |
| RoutePin | `react-native/components/discovery/route-pin.tsx` | `node_modules/react-native-maps/lib/components/MapMarker.js` (Marker); `node_modules/react-native/Libraries/Components/Pressable/Pressable.js` | `android/app/src/main/java/com/laneshadow/ui/molecules/RoutePin.kt` | 6 archetypes × withRank/withoutRank (1-10) × withDistance/withoutDistance × pressed/default states |
| WaypointCard | `react-native/components/map/waypoint-marker.tsx` | `node_modules/@rnmapbox/maps/lib/components/markerView.js` (MarkerView); `node_modules/react-native-svg/src/elements/Shape.tsx` (Path, Circle) | `android/app/src/main/java/com/laneshadow/ui/molecules/WaypointMarker.kt` | 3 kinds (on_route/off_route/mixed) × 4 states (default/selected/pressed/disabled) × showIndex/showIndex=false × size (default 32) |

## STYLE PROPERTIES MATRIX

> Exhaustive enumeration of every style property from both sources per `08f-translation-protocol.md`. Columns: Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping. `ESCALATE` = no token covers the value — add a proposed token to DECISIONS.md before implementing.
>
> **Token reference** (from `tokens/semantic/semantic.tokens.json`): space xs=4 sm=8 md=12 lg=16 xl=24 2xl=32 3xl=48 4xl=64; radius none=0 sm=4 md=8 lg=16 xl=24 2xl=32 full=9999; elevation[2] shadowOffset=0/2 shadowOpacity=0.05 shadowRadius=4 androidElevation=2. **Paper labelLarge**: fontFamily=sans-serif-medium, fontWeight=500, fontSize=14, lineHeight=20, letterSpacing=0.1. **Paper labelSmall**: fontFamily=sans-serif-medium, fontWeight=500, fontSize=11, lineHeight=16, letterSpacing=0.5. **semantic.type.label.md**: fontSize=14, lineHeight=20, fontWeight=500. **semantic.type.body.sm**: fontSize=14, lineHeight=21, fontWeight=400.

### RouteThumbnail

**Source files read:**
- LaneShadow: `react-native/components/ui/route-thumbnail.tsx`
- Framework: `node_modules/expo-linear-gradient/src/LinearGradient.tsx`, `node_modules/react-native/Libraries/Components/View/View.js`

**Layout — container:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| width (default) | RN-wrapper props | `96` | `Modifier.width(96.dp)` | `.frame(width: 96)` | ESCALATE — 96 is between 3xl=48 and 4xl=64 |
| height (default) | RN-wrapper props | `96` | `Modifier.height(96.dp)` | `.frame(height: 96)` | ESCALATE — 96 is between 3xl=48 and 4xl=64 |
| borderRadius | RN-wrapper | `semantic.radius.lg` | `RoundedCornerShape(16.dp)` | `RoundedRectangle(cornerRadius: 16)` | `radius.lg = 16` |
| overflow | RN-wrapper | `'hidden'` | `Modifier.clip(shape = RoundedCornerShape(16.dp))` | `.clipped()` | n/a |

**Visual — gradient:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| colors | RN-wrapper | `[semantic.color.background.default, semantic.color.surface.default]` | `Brush.horizontalGradient(listOf(colorBackground, colorSurface))` | `LinearGradient(colors: [colorBackground, colorSurface])` | `color.background.default`, `color.surface.default` |
| start/end | RN-wrapper | `{x:0, y:0} → {x:1, y:1}` | `start = Offset(0f, 0f), end = Offset(1f, 1f)` | `startPoint: .leading, endPoint: .trailing` | n/a |

**Layout — route line:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| position | RN-wrapper | `absolute` | `Modifier.offset(x, y)` | `.position(x, y)` | n/a |
| top/left/width/height | RN-wrapper | derived from bounds or props | `Modifier.offset(x = left.dp, y = top.dp).size(width = width.dp, height = height.dp)` | `.position(x: left, y: top).frame(width: width, height: height)` | derived values |
| borderWidth | RN-wrapper | `2` | `BorderStroke(2.dp, color)` | `.border(width: 2)` | ESCALATE — 2 is minimal border |
| borderRightWidth/borderBottomWidth | RN-wrapper | `0` | n/a (use drawBehind) | n/a | n/a |
| borderColor | RN-wrapper | `semantic.color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |
| borderRadius | RN-wrapper | `semantic.radius.md` | `RoundedCornerShape(8.dp)` | `RoundedRectangle(cornerRadius: 8)` | `radius.md = 8` |
| transform/rotate | RN-wrapper | `rotation` (degrees) | `Modifier.graphicsLayer { rotationZ = rotation }` | `.rotationEffect(.degrees(rotation))` | n/a |

**Constants:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| MIN_ROUTE_DIMENSION | RN-wrapper | `20` | `20.dp` | `20` | ESCALATE — 20 is between sm=8 and md=12 |
| ROUTE_PADDING | RN-wrapper | `16` | `16.dp` | `16` | `space.lg = 16` |
| DEFAULT_ROTATION | RN-wrapper | `-10` | `-10f` | `-10` | n/a |

### RouteBadge

**Source files read:**
- LaneShadow: `react-native/components/ui/route-badge.tsx`
- Framework: `node_modules/react-native/Libraries/Components/View/View.js`, `node_modules/react-native-paper/src/styles/themes/v3/tokens.tsx`

**Layout — container:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| alignItems | RN-wrapper | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.alignment(.center)` | n/a |
| gap | RN-wrapper | `4` | `Arrangement.spacedBy(4.dp)` | `Spacer(minLength: 4)` | `space.xs = 4` |
| paddingVertical | RN-wrapper | `4` | `Modifier.padding(vertical = 4.dp)` | `.padding(.vertical, 4)` | `space.xs = 4` |
| paddingHorizontal | RN-wrapper | `8` | `Modifier.padding(horizontal = 8.dp)` | `.padding(.horizontal, 8)` | `space.sm = 8` |
| borderRadius | RN-wrapper | `6` | `RoundedCornerShape(6.dp)` | `RoundedRectangle(cornerRadius: 6)` | ESCALATE — 6 is between sm=4 and md=8 |
| borderWidth | RN-wrapper | `1` | `BorderStroke(1.dp, color)` | `.border(width: 1)` | ESCALATE — minimal border |
| alignSelf | RN-wrapper | `'flex-start'` | `Modifier.align(Alignment.Start)` | `.frame(maxWidth: .infinity, alignment: .leading)` | n/a |

**Visual — colors (by variant):**

| Variant | backgroundColor | borderColor | textColor | Token |
|---|---|---|---|---|
| primary | `${semantic.color.primary.default}33` (20% alpha) | `${semantic.color.primary.default}4D` (30% alpha)` | `semantic.color.primary.default` | `color.primary.default` + alpha |
| neutral | `semantic.color.divider.default` | `semantic.color.border.default` | `semantic.color.onSurface.subtle` | `color.divider.default`, `color.border.default`, `color.onSurface.subtle` |

**Typography — text:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| fontSize | RN-wrapper | `12` | `fontSize = 12.sp` | `.font(.system(size: 12))` | ESCALATE — 12 is between md=12 and labelSmall=11 |
| fontWeight | RN-wrapper | `500` | `FontWeight.Medium` | `.fontWeight(.medium)` | non-token |

**Visual — icon:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| iconSize (default) | RN-wrapper props | `14` | `size = 14.dp` | `14` | ESCALATE — 14 is non-standard |
| gap (icon-text) | RN-wrapper | `4` | `Spacer(minLength: 4.dp)` | `Spacer(minLength: 4)` | `space.xs = 4` |

### RouteOptionCard (ui)

**Source files read:**
- LaneShadow: `react-native/components/ui/route-option-card.tsx`
- Framework: `node_modules/react-native/Libraries/Components/View/View.js`, `node_modules/react-native-paper/src/styles/themes/v3/tokens.tsx`

**Layout — container:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| borderRadius | RN-wrapper | `16` | `RoundedCornerShape(16.dp)` | `RoundedRectangle(cornerRadius: 16)` | `radius.lg = 16` |
| padding (selected) | RN-wrapper | `16` | `Modifier.padding(16.dp)` | `.padding(16)` | `space.lg = 16` |
| padding (compact) | RN-wrapper | `12` | `Modifier.padding(12.dp)` | `.padding(12)` | `space.md = 12` |
| marginBottom | RN-wrapper | `12` | `Modifier.padding(bottom = 12.dp)` | `.padding(.bottom, 12)` | `space.md = 12` |

**Visual — colors (by variant):**

| Variant | backgroundColor | borderColor | borderWidth | opacity | Token |
|---|---|---|---|---|---|
| selected | `semantic.color.card.default` | `semantic.color.primary.default` | `2` | `1` | `color.card.default`, `color.primary.default` |
| compact | `semantic.color.card.default` | `'rgba(255,255,255,0.05)'` | `1` | `0.8` | `color.card.default` + hardcoded alpha |

**Layout — cardHeader (selected variant):**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| justifyContent | RN-wrapper | `'space-between'` | `horizontalArrangement = Arrangement.SpaceBetween` | n/a (HStack default) | n/a |
| alignItems | RN-wrapper | `'flex-start'` | `verticalAlignment = Alignment.Top` | `.alignment(.top)` | n/a |
| marginBottom | RN-wrapper | `12` | `Spacer(modifier = Modifier.height(12.dp))` | `Spacer(minLength: 12)` | `space.md = 12` |

**Typography — routeName:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| fontSize | RN-wrapper | `18` | `fontSize = 18.sp` | `.font(.system(size: 18))` | ESCALATE — 18 is non-standard |
| fontWeight | RN-wrapper | `600` | `FontWeight.SemiBold` | `.fontWeight(.semibold)` | non-token |
| marginBottom | RN-wrapper | `8` | `Spacer(modifier = Modifier.height(8.dp))` | `Spacer(minLength: 8)` | `space.sm = 8` |

**Layout — badges row:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| gap | RN-wrapper | `8` | `Arrangement.spacedBy(8.dp)` | `Spacer(minLength: 8)` | `space.sm = 8` |
| flexWrap | RN-wrapper | `'wrap'` | n/a (use FlowRow) | n/a | n/a |

**Layout — statsRow:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| gap | RN-wrapper | `16` | `Arrangement.spacedBy(16.dp)` | `Spacer(minLength: 16)` | `space.lg = 16` |
| marginBottom | RN-wrapper | `12` | `Spacer(modifier = Modifier.height(12.dp))` | `Spacer(minLength: 12)` | `space.md = 12` |

**Layout — compactRow:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| justifyContent | RN-wrapper | `'space-between'` | `horizontalArrangement = Arrangement.SpaceBetween` | n/a (HStack default) | n/a |
| alignItems | RN-wrapper | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.alignment(.center)` | n/a |

**Typography — compactName:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| fontSize | RN-wrapper | `16` | `fontSize = 16.sp` | `.font(.system(size: 16))` | ESCALATE — 16 is close to md=12 |
| fontWeight | RN-wrapper | `500` | `FontWeight.Medium` | `.fontWeight(.medium)` | non-token |

**Typography — compactStats:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| fontSize | RN-wrapper | `14` | `fontSize = 14.sp` | `.font(.system(size: 14))` | ESCALATE — 14 is non-standard |

### RouteOptionCard (planning)

**Source files read:**
- LaneShadow: `react-native/components/planning/route-option-card.tsx`
- Framework: `node_modules/react-native/Libraries/Components/Pressable/Pressable.js`, `node_modules/react-native/Libraries/Components/View/View.js`

**Layout — container:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| borderRadius | RN-wrapper | `semantic.radius.lg` | `RoundedCornerShape(16.dp)` | `RoundedRectangle(cornerRadius: 16)` | `radius.lg = 16` |
| padding | RN-wrapper | `semantic.space.md` | `Modifier.padding(12.dp)` | `.padding(12)` | `space.md = 12` |
| borderWidth | RN-wrapper (selected) | `2` | `BorderStroke(2.dp, color)` | `.border(width: 2)` | ESCALATE — 2 is minimal border |
| borderWidth | RN-wrapper (not selected) | `1` | `BorderStroke(1.dp, color)` | `.border(width: 1)` | ESCALATE — minimal border |
| marginVertical | RN-wrapper | `4` | `Modifier.padding(vertical = 4.dp)` | `.padding(.vertical, 4)` | `space.xs = 4` |

**Visual — colors (by state):**

| State | backgroundColor | borderColor | opacity | Token |
|---|---|---|---|---|
| selected | `semantic.color.surface.default` | `semantic.color.primary.default` | `1` | `color.surface.default`, `color.primary.default` |
| not selected | `semantic.color.surface.default` | `semantic.color.border.default` | `1` | `color.surface.default`, `color.border.default` |
| loading | same as selected | same as selected | `0.6` | `color.surface.default` + alpha |

**Layout — header:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| marginBottom | RN-wrapper | `12` | `Spacer(modifier = Modifier.height(12.dp))` | `Spacer(minLength: 12)` | `space.md = 12` |

**Layout — titleRow:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| justifyContent | RN-wrapper | `'space-between'` | `horizontalArrangement = Arrangement.SpaceBetween` | n/a (HStack default) | n/a |
| alignItems | RN-wrapper | `'flex-start'` | `verticalAlignment = Alignment.Top` | `.alignment(.top)` | n/a |
| marginBottom | RN-wrapper | `4` | `Spacer(modifier = Modifier.height(4.dp))` | `Spacer(minLength: 4)` | `space.xs = 4` |

**Typography — title:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| variant | RN-wrapper | `titleMedium` (Paper) | `MaterialTheme.typography.titleMedium` | `.font(.title2)` | non-token |
| color | RN-wrapper | `semantic.color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |

**Typography — rationale:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| variant | RN-wrapper | `bodyMedium` (Paper) | `MaterialTheme.typography.bodyMedium` | `.font(.body)` | non-token |
| color | RN-wrapper | `semantic.color.onSurface.muted` | `LaneShadowTheme.colors.onSurfaceMuted` | `theme.colors.onSurfaceMuted` | `color.onSurface.muted` |
| lineHeight | RN-wrapper | `20` | `lineHeight = 20.sp` | `.lineSpacing(4)` (16+4=20) | `type.label.md = 20` |

**Layout — stats:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| justifyContent | RN-wrapper | `'space-between'` | `horizontalArrangement = Arrangement.SpaceBetween` | n/a (HStack default) | n/a |
| alignItems | RN-wrapper | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.alignment(.center)` | n/a |
| gap | RN-wrapper | `8` | `Arrangement.spacedBy(8.dp)` | `Spacer(minLength: 8)` | `space.sm = 8` |

**Layout — statRow:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| alignItems | RN-wrapper | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.alignment(.center)` | n/a |
| flex | RN-wrapper | `1` | `Modifier.weight(1f)` | `LayoutPriority(1)` | n/a |

**Layout — weatherRow:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| alignItems | RN-wrapper | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.alignment(.center)` | n/a |
| flex | RN-wrapper | `3` | `Modifier.weight(3f)` | `LayoutPriority(3)` | n/a |
| flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| gap | RN-wrapper | `8` | `Arrangement.spacedBy(8.dp)` | `Spacer(minLength: 8)` | `space.sm = 8` |

**Layout — weatherItem:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| alignItems | RN-wrapper | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.alignment(.center)` | n/a |
| flex | RN-wrapper | `1` | `Modifier.weight(1f)` | `LayoutPriority(1)` | n/a |

**Layout — favoriteList (expandable):**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| backgroundColor | RN-wrapper | `addOpacity(semantic.color.surface.default, 0.5)` | `LaneShadowTheme.colors.surface.copy(alpha = 0.5f)` | `theme.colors.surface.opacity(0.5)` | `color.surface.default` + alpha |
| borderRadius | RN-wrapper | `semantic.radius.md` | `RoundedCornerShape(8.dp)` | `RoundedRectangle(cornerRadius: 8)` | `radius.md = 8` |
| padding | RN-wrapper | `semantic.space.sm` | `Modifier.padding(8.dp)` | `.padding(8)` | `space.sm = 8` |
| marginTop | RN-wrapper | `semantic.space.sm` | `Modifier.padding(top = 8.dp)` | `.padding(.top, 8)` | `space.sm = 8` |

### SessionCard

**Source files read:**
- LaneShadow: `react-native/components/ui/session-card.tsx`
- Framework: `node_modules/react-native/Libraries/Components/Pressable/Pressable.js`, `node_modules/react-native/Libraries/Components/View/View.js`

**Layout — card:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| borderRadius | RN-wrapper | `12` | `RoundedCornerShape(12.dp)` | `RoundedRectangle(cornerRadius: 12)` | `radius.lg = 16` (12 is close) |
| padding | RN-wrapper | `14` | `Modifier.padding(14.dp)` | `.padding(14)` | ESCALATE — 14 is non-standard |
| borderWidth | RN-wrapper | `1` | `BorderStroke(1.dp, color)` | `.border(width: 1)` | ESCALATE — minimal border |
| gap | RN-wrapper | `10` | `Arrangement.spacedBy(10.dp)` | `Spacer(minLength: 10)` | ESCALATE — 10 is non-standard |

**Layout — compactCard:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| padding | RN-wrapper | `10` | `Modifier.padding(10.dp)` | `.padding(10)` | ESCALATE — 10 is non-standard |
| gap | RN-wrapper | `6` | `Arrangement.spacedBy(6.dp)` | `Spacer(minLength: 6)` | ESCALATE — 6 is between xs=4 and sm=8 |

**Layout — header:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| justifyContent | RN-wrapper | `'space-between'` | `horizontalArrangement = Arrangement.SpaceBetween` | n/a (HStack default) | n/a |
| alignItems | RN-wrapper | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.alignment(.center)` | n/a |

**Layout — headerLeft:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| alignItems | RN-wrapper | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.alignment(.center)` | n/a |
| gap | RN-wrapper | `10` | `Arrangement.spacedBy(10.dp)` | `Spacer(minLength: 10)` | ESCALATE — 10 is non-standard |
| flex | RN-wrapper | `1` | `Modifier.weight(1f)` | `LayoutPriority(1)` | n/a |

**Typography — title:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| fontSize | RN-wrapper | `16` | `fontSize = 16.sp` | `.font(.system(size: 16))` | ESCALATE — 16 is close to md=12 |
| fontWeight | RN-wrapper | `700` | `FontWeight.Bold` | `.fontWeight(.bold)` | non-token |

**Visual — statusBadge:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| paddingHorizontal | RN-wrapper | `10` | `Modifier.padding(horizontal = 10.dp)` | `.padding(.horizontal, 10)` | ESCALATE — 10 is non-standard |
| paddingVertical | RN-wrapper | `4` | `Modifier.padding(vertical = 4.dp)` | `.padding(.vertical, 4)` | `space.xs = 4` |
| borderRadius | RN-wrapper | `12` | `RoundedCornerShape(12.dp)` | `RoundedRectangle(cornerRadius: 12)` | `radius.lg = 16` (12 is close) |

**Typography — statusText:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| fontSize | RN-wrapper | `11` | `fontSize = 11.sp` | `.font(.system(size: 11))` | ESCALATE — 11 is close to labelSmall=11 |
| fontWeight | RN-wrapper | `700` | `FontWeight.Bold` | `.fontWeight(.bold)` | non-token |
| textTransform | RN-wrapper | `'capitalize'` | `text = text.replaceFirstChar { it.uppercase() }` | `.textCase(.uppercase)` (SwiftUI has no capitalize) | n/a |

**Typography — metaText:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| fontSize | RN-wrapper | `13` | `fontSize = 13.sp` | `.font(.system(size: 13))` | ESCALATE — 13 is non-standard |
| fontWeight | RN-wrapper | `500` | `FontWeight.Medium` | `.fontWeight(.medium)` | non-token |

**Typography — preview:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| fontSize | RN-wrapper | `14` | `fontSize = 14.sp` | `.font(.system(size: 14))` | ESCALATE — 14 is non-standard |
| fontWeight | RN-wrapper | `400` | `FontWeight.Normal` | `.fontWeight(.regular)` | non-token |
| lineHeight | RN-wrapper | `20` | `lineHeight = 20.sp` | `.lineSpacing(6)` (14+6=20) | `type.label.md = 20` |

**Visual — colors (by status):**

| Status | backgroundColor (isActive) | backgroundColor (isActive=false) | borderColor (isActive) | borderColor (isActive=false) | Token |
|---|---|---|---|---|---|
| active | `${semantic.color.primary.default}15` | `semantic.color.surfaceVariant.default` | `semantic.color.primary.default` | `semantic.color.border.default` | `color.primary.default` + alpha, `color.surfaceVariant.default`, `color.border.default` |
| completed | `${semantic.color.success.default}25` | `semantic.color.surfaceVariant.default` | `semantic.color.success.default` | `semantic.color.border.default` | `color.success.default` + alpha, `color.surfaceVariant.default`, `color.border.default` |
| saved | `semantic.color.surfaceVariant.pressed` | `semantic.color.surfaceVariant.default` | `semantic.color.border.default` | `semantic.color.border.default` | `color.surfaceVariant.pressed`, `color.surfaceVariant.default`, `color.border.default` |

**Visual — elevation (by pressed state):**

| State | Elevation | Token |
|---|---|---|
| pressed (isActive=false) | `semantic.elevation[3]` | `elevation[3]` |
| default (isActive=false) | `semantic.elevation[1]` | `elevation[1]` |

### SavedRouteCard

**Source files read:**
- LaneShadow: `react-native/components/ui/saved-route-card.tsx`
- Framework: `node_modules/react-native/Libraries/Components/Pressable/Pressable.js`, `node_modules/react-native/Libraries/Components/View/View.js`

**Layout — container:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| borderRadius | RN-wrapper | `semantic.radius.lg` | `RoundedCornerShape(16.dp)` | `RoundedRectangle(cornerRadius: 16)` | `radius.lg = 16` |
| padding | RN-wrapper | `semantic.space.md` | `Modifier.padding(12.dp)` | `.padding(12)` | `space.md = 12` |
| borderWidth | RN-wrapper | `StyleSheet.hairlineWidth` | `BorderStroke(1.dp, color)` (Compose has no hairline) | `.border(width: 0.5)` | ESCALATE — hairline |
| opacity (pressed) | RN-wrapper | `0.8` | `alpha = 0.8f` | `.opacity(0.8)` | ESCALATE — opacity constant |

**Layout — content:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| alignItems | RN-wrapper | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.alignment(.center)` | n/a |
| gap | RN-wrapper | `semantic.space.md` | `Arrangement.spacedBy(12.dp)` | `Spacer(minLength: 12)` | `space.md = 12` |

**Layout — thumbnailContainer:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| alignItems | RN-wrapper | `'center'` | `horizontalAlignment = Alignment.CenterHorizontally` | `.frame(maxWidth: .infinity, alignment: .center)` | n/a |
| justifyContent | RN-wrapper | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.frame(maxHeight: .infinity, alignment: .center)` | n/a |

**Layout — textContainer:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| flex | RN-wrapper | `1` | `Modifier.weight(1f)` | `LayoutPriority(1)` | n/a |
| gap | RN-wrapper | `4` | `Arrangement.spacedBy(4.dp)` | `Spacer(minLength: 4)` | `space.xs = 4` |

**Typography — name:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| semantic.type.title.sm | RN-wrapper | `fontSize: 18, fontWeight: 600` | `MaterialTheme.typography.titleSmall` | `.font(.title3)` | `type.title.sm` |
| color | RN-wrapper | `semantic.color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |
| numberOfLines | RN-wrapper | `2` | `maxLines = 2` | `.lineLimit(2)` | n/a |

**Typography — path:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| semantic.type.body.sm | RN-wrapper | `fontSize: 14, lineHeight: 21, fontWeight: 400` | `MaterialTheme.typography.bodySmall` | `.font(.body)` | `type.body.sm` |
| color | RN-wrapper | `semantic.color.onSurface.subtle` | `LaneShadowTheme.colors.onSurfaceSubtle` | `theme.colors.onSurfaceSubtle` | `color.onSurface.subtle` |
| numberOfLines | RN-wrapper | `1` | `maxLines = 1` | `.lineLimit(1)` | n/a |

**Layout — statsRow:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| alignItems | RN-wrapper | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.alignment(.center)` | n/a |
| gap | RN-wrapper | `semantic.space.sm` | `Arrangement.spacedBy(8.dp)` | `Spacer(minLength: 8)` | `space.sm = 8` |

**Typography — stats (distance/duration/dateSaved):**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| semantic.type.body.sm | RN-wrapper | `fontSize: 14, lineHeight: 21, fontWeight: 400` | `MaterialTheme.typography.bodySmall` | `.font(.body)` | `type.body.sm` |
| color | RN-wrapper | `semantic.color.onSurface.muted` | `LaneShadowTheme.colors.onSurfaceMuted` | `theme.colors.onSurfaceMuted` | `color.onSurface.muted` |

### FavoriteRoadCard

**Source files read:**
- LaneShadow: `react-native/components/ui/favorite-road-card.tsx`
- Framework: `node_modules/react-native/Libraries/Components/Pressable/Pressable.js`, `node_modules/react-native/Libraries/Components/View/View.js`

**Layout — container:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| borderRadius | RN-wrapper | `semantic.radius.lg` | `RoundedCornerShape(16.dp)` | `RoundedRectangle(cornerRadius: 16)` | `radius.lg = 16` |
| padding | RN-wrapper | `semantic.space.lg` | `Modifier.padding(16.dp)` | `.padding(16)` | `space.lg = 16` |
| borderWidth | RN-wrapper | `StyleSheet.hairlineWidth` | `BorderStroke(1.dp, color)` (Compose has no hairline) | `.border(width: 0.5)` | ESCALATE — hairline |
| opacity (pressed) | RN-wrapper | `0.8` | `alpha = 0.8f` | `.opacity(0.8)` | ESCALATE — opacity constant |

**Layout — content:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| alignItems | RN-wrapper | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.alignment(.center)` | n/a |
| gap | RN-wrapper | `semantic.space.md` | `Arrangement.spacedBy(12.dp)` | `Spacer(minLength: 12)` | `space.md = 12` |

**Layout — textContainer:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| flex | RN-wrapper | `1` | `Modifier.weight(1f)` | `LayoutPriority(1)` | n/a |

**Typography — name:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| semantic.type.title.md | RN-wrapper | `fontSize: 20, fontWeight: 600` | `MaterialTheme.typography.titleMedium` | `.font(.title2)` | `type.title.md` |
| color | RN-wrapper | `semantic.color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |
| numberOfLines | RN-wrapper | `2` | `maxLines = 2` | `.lineLimit(2)` | n/a |

**Layout — deleteButtonContainer:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| zIndex | RN-wrapper | `1` | `Modifier.zIndex(1)` | `.zIndex(1)` | n/a |

**Layout — deleteButtonContent:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| padding | RN-wrapper | `8` | `Modifier.padding(8.dp)` | `.padding(8)` | `space.sm = 8` |
| borderRadius | RN-wrapper | `8` | `RoundedCornerShape(8.dp)` | `RoundedRectangle(cornerRadius: 8)` | `radius.md = 8` |
| margin | RN-wrapper | `-8` | `Modifier.padding(-8.dp)` | `.padding(-8)` | ESCALATE — negative padding |

**Visual — delete icon:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| iconSize | RN-wrapper | `20` | `size = 20.dp` | `20` | ESCALATE — 20 is between sm=8 and md=12 |
| iconColor | RN-wrapper | `semantic.color.danger.default` | `LaneShadowTheme.colors.danger` | `theme.colors.danger` | `color.danger.default` |
| opacity (pressed) | RN-wrapper | `0.6` | `alpha = 0.6f` | `.opacity(0.6)` | ESCALATE — opacity constant |

### RouteAttachmentCard (ui + chat variants)

**Source files read:**
- LaneShadow: `react-native/components/ui/route-attachment-card.tsx`
- Framework: `node_modules/react-native/Libraries/Components/Pressable/Pressable.js`, `node_modules/react-native/Libraries/Components/View/View.js`

**Layout — card:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| borderRadius | RN-wrapper | `12` | `RoundedCornerShape(12.dp)` | `RoundedRectangle(cornerRadius: 12)` | `radius.lg = 16` (12 is close) |
| borderWidth | RN-wrapper | `1` | `BorderStroke(1.dp, color)` | `.border(width: 1)` | ESCALATE — minimal border |

**Layout — compactCard (map overlay):**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| padding | RN-wrapper | `10` | `Modifier.padding(10.dp)` | `.padding(10)` | ESCALATE — 10 is non-standard |
| minWidth | RN-wrapper | `200` | `Modifier.widthIn(min = 200.dp)` | `.frame(minWidth: 200)` | ESCALATE — 200 is arbitrary |

**Layout — fullCard (chat transcript):**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| paddingVertical | RN-wrapper | `10` | `Modifier.padding(vertical = 10.dp)` | `.padding(.vertical, 10)` | ESCALATE — 10 is non-standard |
| paddingHorizontal | RN-wrapper | `12` | `Modifier.padding(horizontal = 12.dp)` | `.padding(.horizontal, 12)` | `space.md = 12` |
| width | RN-wrapper | `'100%'` | `Modifier.fillMaxWidth()` | `.frame(maxWidth: .infinity)` | n/a |

**Visual — colors (by state):**

| State | backgroundColor (isSelected) | backgroundColor (isSelected=false) | borderColor (isSelected) | borderColor (isSelected=false) | Token |
|---|---|---|---|---|---|
| selected | `${semantic.color.primary.default}15` | same | `semantic.color.primary.default` | same | `color.primary.default` + alpha |
| not selected | `semantic.color.surfaceVariant.default` | same | `semantic.color.border.default` | same | `color.surfaceVariant.default`, `color.border.default` |
| pressed (isSelected=false) | same | same | same | same | `opacity = 0.8` |

**Layout — compactContent:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| alignItems | RN-wrapper | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.alignment(.center)` | n/a |
| gap | RN-wrapper | `8` | `Arrangement.spacedBy(8.dp)` | `Spacer(minLength: 8)` | `space.sm = 8` |

**Layout — fullContent:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| alignItems | RN-wrapper | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.alignment(.center)` | n/a |
| gap | RN-wrapper | `12` | `Arrangement.spacedBy(12.dp)` | `Spacer(minLength: 12)` | `space.md = 12` |

**Layout — compactBadges:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| gap | RN-wrapper | `4` | `Arrangement.spacedBy(4.dp)` | `Spacer(minLength: 4)` | `space.xs = 4` |
| alignItems | RN-wrapper | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.alignment(.center)` | n/a |

**Layout — bestBadge:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| backgroundColor | RN-wrapper | `${semantic.color.primary.default}20` (12.5% alpha) | `LaneShadowTheme.colors.primary.copy(alpha = 0.125f)` | `theme.colors.primary.opacity(0.125)` | `color.primary.default` + alpha |
| paddingHorizontal | RN-wrapper | `6` | `Modifier.padding(horizontal = 6.dp)` | `.padding(.horizontal, 6)` | ESCALATE — 6 is between xs=4 and sm=8 |
| paddingVertical | RN-wrapper | `2` | `Modifier.padding(vertical = 2.dp)` | `.padding(.vertical, 2)` | ESCALATE — 2 is minimal |
| borderRadius | RN-wrapper | `8` | `RoundedCornerShape(8.dp)` | `RoundedRectangle(cornerRadius: 8)` | `radius.md = 8` |

**Typography — bestBadgeText:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| fontSize (compact) | RN-wrapper | `11` | `fontSize = 11.sp` | `.font(.system(size: 11))` | ESCALATE — 11 is close to labelSmall=11 |
| fontWeight | RN-wrapper | `700` | `FontWeight.Bold` | `.fontWeight(.bold)` | non-token |
| color | RN-wrapper | `semantic.color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |

**Layout — weatherBadge:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| backgroundColor | RN-wrapper | `${getWeatherColor(type)}20` (12.5% alpha) | derived color with alpha = 0.125f | `color.opacity(0.125)` | derived from weather type |
| paddingHorizontal | RN-wrapper | `6` | `Modifier.padding(horizontal = 6.dp)` | `.padding(.horizontal, 6)` | ESCALATE — 6 is between xs=4 and sm=8 |
| paddingVertical | RN-wrapper | `2` | `Modifier.padding(vertical = 2.dp)` | `.padding(.vertical, 2)` | ESCALATE — 2 is minimal |
| borderRadius | RN-wrapper | `8` | `RoundedCornerShape(8.dp)` | `RoundedRectangle(cornerRadius: 8)` | `radius.md = 8` |
| flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| gap | RN-wrapper | `4` | `Arrangement.spacedBy(4.dp)` | `Spacer(minLength: 4)` | `space.xs = 4` |

**Typography — compactLabel:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| fontSize | RN-wrapper | `14` | `fontSize = 14.sp` | `.font(.system(size: 14))` | ESCALATE — 14 is non-standard |
| fontWeight | RN-wrapper | `600` | `FontWeight.SemiBold` | `.fontWeight(.semibold)` | non-token |
| flex | RN-wrapper | `1` | `Modifier.weight(1f)` | `LayoutPriority(1)` | n/a |

**Typography — compactText:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| fontSize | RN-wrapper | `11` | `fontSize = 11.sp` | `.font(.system(size: 11))` | ESCALATE — 11 is close to labelSmall=11 |

**Layout — titleSection:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| alignItems | RN-wrapper | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.alignment(.center)` | n/a |
| gap | RN-wrapper | `6` | `Arrangement.spacedBy(6.dp)` | `Spacer(minLength: 6)` | ESCALATE — 6 is between xs=4 and sm=8 |
| flexShrink | RN-wrapper | `1` | `Modifier.weight(1f, fill = false)` | `LayoutPriority(1)` | n/a |

**Typography — fullLabel:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| fontSize | RN-wrapper | `14` | `fontSize = 14.sp` | `.font(.system(size: 14))` | ESCALATE — 14 is non-standard |
| fontWeight | RN-wrapper | `600` | `FontWeight.SemiBold` | `.fontWeight(.semibold)` | non-token |
| flex | RN-wrapper | `1` | `Modifier.weight(1f)` | `LayoutPriority(1)` | n/a |

**Layout — statsSection:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| alignItems | RN-wrapper | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.alignment(.center)` | n/a |
| gap | RN-wrapper | `10` | `Arrangement.spacedBy(10.dp)` | `Spacer(minLength: 10)` | ESCALATE — 10 is non-standard |
| flexShrink | RN-wrapper | `0` | `Modifier.weight(0f)` | `LayoutPriority(0)` | n/a |

**Layout — statItem:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| alignItems | RN-wrapper | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.alignment(.center)` | n/a |
| gap | RN-wrapper | `3` | `Arrangement.spacedBy(3.dp)` | `Spacer(minLength: 3)` | ESCALATE — 3 is minimal |

**Typography — statValue:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| fontSize | RN-wrapper | `12` | `fontSize = 12.sp` | `.font(.system(size: 12))` | ESCALATE — 12 is close to md=12 |
| fontWeight | RN-wrapper | `500` | `FontWeight.Medium` | `.fontWeight(.medium)` | non-token |

**Layout — scenicSection:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| alignItems | RN-wrapper | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.alignment(.center)` | n/a |
| gap | RN-wrapper | `3` | `Arrangement.spacedBy(3.dp)` | `Spacer(minLength: 3)` | ESCALATE — 3 is minimal |
| flexShrink | RN-wrapper | `0` | `Modifier.weight(0f)` | `LayoutPriority(0)` | n/a |

**Typography — scenicValue:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| fontSize | RN-wrapper | `12` | `fontSize = 12.sp` | `.font(.system(size: 12))` | ESCALATE — 12 is close to md=12 |
| fontWeight | RN-wrapper | `600` | `FontWeight.SemiBold` | `.fontWeight(.semibold)` | non-token |

**Visual — stat/scenic icons:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| iconSize | RN-wrapper | `12` | `size = 12.dp` | `12` | ESCALATE — 12 is close to md=12 |
| iconColor (stat) | RN-wrapper | `semantic.color.onSurface.muted` | `LaneShadowTheme.colors.onSurfaceMuted` | `theme.colors.onSurfaceMuted` | `color.onSurface.muted` |
| iconColor (scenic) | RN-wrapper | `semantic.color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |

### RouteLegTimeline

**Source files read:**
- LaneShadow: `react-native/components/ui/route-leg-timeline.tsx`
- Framework: `node_modules/expo-linear-gradient/src/LinearGradient.tsx`, `node_modules/react-native/Libraries/Components/View/View.js`

**Layout — segmentRow:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| alignItems | RN-wrapper | `'stretch'` | `verticalAlignment = Alignment.Top` | `.alignment(.top)` | n/a |
| paddingVertical | RN-wrapper | `semantic.space.md` | `Modifier.padding(vertical = 12.dp)` | `.padding(.vertical, 12)` | `space.md = 12` |

**Layout — leftColumn:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| flexDirection | RN-wrapper | `'column'` | `Column(...)` | `VStack` | n/a |
| alignItems | RN-wrapper | `'center'` | `horizontalAlignment = Alignment.CenterHorizontally` | `.frame(maxWidth: .infinity, alignment: .center)` | n/a |
| flexShrink | RN-wrapper | `0` | `Modifier.width(Width.Inherent)` | `FixedSize()` | n/a |
| width | RN-wrapper | `semantic.space.xl` | `Modifier.width(24.dp)` | `.frame(width: 24)` | `space.xl = 24` |

**Layout — dot:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| width/height | RN-wrapper | `semantic.space.md` | `Modifier.size(12.dp)` | `.frame(width: 12, height: 12)` | `space.md = 12` |
| borderRadius | RN-wrapper | `semantic.radius.full` | `CircleShape` | `Circle()` | `radius.full = 9999` |
| backgroundColor (start/end) | RN-wrapper | `'transparent'` | `Color.Transparent` | `.clear` | n/a |
| borderWidth | RN-wrapper | `2` | `BorderStroke(2.dp, color)` | `.border(width: 2)` | ESCALATE — 2 is minimal border |
| borderColor (start) | RN-wrapper | `semantic.color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |
| borderColor (waypoint) | RN-wrapper | `withAlpha(semantic.color.primary.default, 0.5)` | `LaneShadowTheme.colors.primary.copy(alpha = 0.5f)` | `theme.colors.primary.opacity(0.5)` | `color.primary.default` + alpha |
| backgroundColor (end) | RN-wrapper | `withAlpha(semantic.color.onSurface.muted ?? semantic.color.onSurface.default, 0.5)` | `LaneShadowTheme.colors.onSurfaceMuted.copy(alpha = 0.5f)` | `theme.colors.onSurfaceMuted.opacity(0.5)` | `color.onSurface.muted` + alpha |

**Layout — connector:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| width | RN-wrapper | `2` | `Modifier.width(2.dp)` | `.frame(width: 2)` | ESCALATE — minimal width |
| flex | RN-wrapper | `1` | `Modifier.weight(1f)` | `LayoutPriority(1)` | n/a |
| marginVertical | RN-wrapper | `4` | `Modifier.padding(vertical = 4.dp)` | `.padding(.vertical, 4)` | `space.xs = 4` |
| borderRadius | RN-wrapper | `9999` | `CircleShape` (for clip) | `.clipShape(Capsule())` | `radius.full = 9999` |

**Visual — connector gradient:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| colors | RN-wrapper | `[semantic.color.primary.default, withAlpha(semantic.color.primary.default, 0.5), withAlpha(semantic.color.onSurface.muted ?? semantic.color.onSurface.default, 0.3)]` | `Brush.verticalGradient(listOf(colorPrimary, colorPrimaryAlpha05, colorOnSurfaceMutedAlpha03))` | `LinearGradient(colors: [colorPrimary, colorPrimaryOpacity05, colorOnSurfaceMutedOpacity03])` | `color.primary.default` + alphas |
| start/end | RN-wrapper | `{x:0.5, y:0} → {x:0.5, y:1}` | `start = Offset(0.5f, 0f), end = Offset(0.5f, 1f)` | `startPoint: .top, endPoint: .bottom` | n/a |

**Layout — rightContent:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| flex | RN-wrapper | `1` | `Modifier.weight(1f)` | `LayoutPriority(1)` | n/a |
| flexDirection | RN-wrapper | `'column'` | `Column(...)` | `VStack` | n/a |
| paddingLeft | RN-wrapper | `semantic.space.sm` | `Modifier.padding(start = 8.dp)` | `.padding(.leading, 8)` | `space.sm = 8` |

**Typography — location/segment labels:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| variant (start/end/segment) | RN-wrapper | `bodySmall` (Paper) | `MaterialTheme.typography.bodySmall` | `.font(.caption)` | non-token |
| color (start/end) | RN-wrapper | `semantic.color.onSurface.subtle` | `LaneShadowTheme.colors.onSurfaceSubtle` | `theme.colors.onSurfaceSubtle` | `color.onSurface.subtle` |
| color (segment) | RN-wrapper | `semantic.color.onSurface.muted` | `LaneShadowTheme.colors.onSurfaceMuted` | `theme.colors.onSurfaceMuted` | `color.onSurface.muted` |
| marginBottom | RN-wrapper | `semantic.space.xs` | `Spacer(modifier = Modifier.height(4.dp))` | `Spacer(minLength: 4)` | `space.xs = 4` |

**Layout — statsRow:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| gap | RN-wrapper | `semantic.space.sm` | `Arrangement.spacedBy(8.dp)` | `Spacer(minLength: 8)` | `space.sm = 8` |
| marginBottom | RN-wrapper | `semantic.space.xs` | `Spacer(modifier = Modifier.height(4.dp))` | `Spacer(minLength: 4)` | `space.xs = 4` |

**Typography — stats (distance/duration):**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| variant | RN-wrapper | `bodySmall` (Paper) | `MaterialTheme.typography.bodySmall` | `.font(.caption)` | non-token |
| color (value) | RN-wrapper | `semantic.color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |
| color (separator) | RN-wrapper | `semantic.color.onSurface.subtle` | `LaneShadowTheme.colors.onSurfaceSubtle` | `theme.colors.onSurfaceSubtle` | `color.onSurface.subtle` |

**Layout — badgesRow:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| flexWrap | RN-wrapper | `'wrap'` | n/a (use FlowRow) | n/a | n/a |
| gap | RN-wrapper | `semantic.space.xs` | `Arrangement.spacedBy(4.dp)` | `Spacer(minLength: 4)` | `space.xs = 4` |
| marginBottom | RN-wrapper | `semantic.space.xs` | `Spacer(modifier = Modifier.height(4.dp))` | `Spacer(minLength: 4)` | `space.xs = 4` |

### RoutePin

**Source files read:**
- LaneShadow: `react-native/components/discovery/route-pin.tsx`
- Framework: `node_modules/react-native-maps/lib/components/MapMarker.js`, `node_modules/react-native/Libraries/Components/Pressable/Pressable.js`

**Layout — container:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| alignItems | RN-wrapper | `'center'` | `horizontalAlignment = Alignment.CenterHorizontally` | `.frame(maxWidth: .infinity, alignment: .center)` | n/a |
| justifyContent | RN-wrapper | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.frame(maxHeight: .infinity, alignment: .center)` | n/a |

**Layout — pinBody:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| width/height | RN-wrapper | `44` | `Modifier.size(44.dp)` | `.frame(width: 44, height: 44)` | ESCALATE — 44 is between 2xl=32 and 3xl=48 |
| borderRadius | RN-wrapper | `22` (half of 44) | `CircleShape` | `Circle()` | `radius.full = 9999` |
| backgroundColor | RN-wrapper | `semantic.color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |
| alignItems | RN-wrapper | `'center'` | `horizontalAlignment = Alignment.CenterHorizontally` | `.frame(maxWidth: .infinity, alignment: .center)` | n/a |
| justifyContent | RN-wrapper | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.frame(maxHeight: .infinity, alignment: .center)` | n/a |

**Visual — shadow:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| shadowColor | RN-wrapper | `'#000'` | `shadowColor = Color.Black` | `.shadow(color: .black)` | ESCALATE — hardcoded black |
| shadowOffset | RN-wrapper | `{width: 0, height: 2}` | `offset = Offset(0f, 2f)` | `.shadow(radius: 3)` | n/a |
| shadowOpacity | RN-wrapper | `0.25` | `shadowAlpha = 0.25f` | n/a (SwiftUI uses radius) | ESCALATE — opacity constant |
| shadowRadius | RN-wrapper | `3` | `shadowRadius = 3.dp` | `.shadow(radius: 3)` | ESCALATE — shadow radius |
| elevation | RN-wrapper | `3` | `elevation = 3.dp` | n/a (iOS uses shadow) | ESCALATE — elevation constant |

**Visual — icon:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| iconSize | RN-wrapper | `24` | `size = 24.dp` | `24` | ESCALATE — 24 is close to xl=24 |
| iconColor | RN-wrapper | `semantic.color.onPrimary.default` | `LaneShadowTheme.colors.onPrimary` | `theme.colors.onPrimary` | `color.onPrimary.default` |

**Layout — rankBadge:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| position | RN-wrapper | `absolute top: -4 right: -4` | `Modifier.offset(x = 4.dp, y = -4.dp).align(Alignment.TopEnd)` | `.offset(x: -4, y: -4)` | n/a |
| width/height | RN-wrapper | `18` | `Modifier.size(18.dp)` | `.frame(width: 18, height: 18)` | ESCALATE — 18 is non-standard |
| borderRadius | RN-wrapper | `9` (half of 18) | `CircleShape` | `Circle()` | `radius.full = 9999` |
| backgroundColor | RN-wrapper | `semantic.color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |
| alignItems | RN-wrapper | `'center'` | `horizontalAlignment = Alignment.CenterHorizontally` | `.frame(maxWidth: .infinity, alignment: .center)` | n/a |
| justifyContent | RN-wrapper | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.frame(maxHeight: .infinity, alignment: .center)` | n/a |

**Typography — rankText:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| semantic.type.label.sm | RN-wrapper | `fontSize: 11, fontWeight: 500, lineHeight: 16` | `MaterialTheme.typography.labelSmall` | `.font(.system(size: 11)).fontWeight(.medium)` | `type.label.sm` |
| color | RN-wrapper | `semantic.color.onPrimary.default` | `LaneShadowTheme.colors.onPrimary` | `theme.colors.onPrimary` | `color.onPrimary.default` |
| fontSize | RN-wrapper (override) | `10` | `fontSize = 10.sp` | `.font(.system(size: 10))` | ESCALATE — 10 is non-standard |
| fontWeight | RN-wrapper (override) | `700` | `FontWeight.Bold` | `.fontWeight(.bold)` | non-token |
| lineHeight | RN-wrapper (override) | `12` | `lineHeight = 12.sp` | `.lineSpacing(2)` (10+2=12) | ESCALATE — 12 is non-standard |

**Visual — rankBadge shadow:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| shadowColor | RN-wrapper | `'#000'` | `shadowColor = Color.Black` | `.shadow(color: .black)` | ESCALATE — hardcoded black |
| shadowOffset | RN-wrapper | `{width: 0, height: 1}` | `offset = Offset(0f, 1f)` | `.shadow(radius: 2)` | n/a |
| shadowOpacity | RN-wrapper | `0.3` | `shadowAlpha = 0.3f` | n/a (SwiftUI uses radius) | ESCALATE — opacity constant |
| shadowRadius | RN-wrapper | `2` | `shadowRadius = 2.dp` | `.shadow(radius: 2)` | ESCALATE — shadow radius |
| elevation | RN-wrapper | `2` | `elevation = 2.dp` | n/a (iOS uses shadow) | ESCALATE — elevation constant |

**Layout — distanceLabel:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| position | RN-wrapper | (relative, via margin) | `Modifier.padding(top = 4.dp)` | `.padding(.top, 4)` | `space.xs = 4` |
| paddingHorizontal | RN-wrapper | `8` | `Modifier.padding(horizontal = 8.dp)` | `.padding(.horizontal, 8)` | `space.sm = 8` |
| paddingVertical | RN-wrapper | `2` | `Modifier.padding(vertical = 2.dp)` | `.padding(.vertical, 2)` | ESCALATE — 2 is minimal |
| borderRadius | RN-wrapper | `12` | `RoundedCornerShape(12.dp)` | `RoundedRectangle(cornerRadius: 12)` | `radius.lg = 16` (12 is close) |
| backgroundColor | RN-wrapper | `${semantic.color.surface.default}CC` (80% alpha) | `LaneShadowTheme.colors.surface.copy(alpha = 0.8f)` | `theme.colors.surface.opacity(0.8)` | `color.surface.default` + alpha |
| alignItems | RN-wrapper | `'center'` | `horizontalAlignment = Alignment.CenterHorizontally` | `.frame(maxWidth: .infinity, alignment: .center)` | n/a |
| justifyContent | RN-wrapper | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.frame(maxHeight: .infinity, alignment: .center)` | n/a |

**Typography — distanceText:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| semantic.type.label.sm | RN-wrapper | `fontSize: 11, fontWeight: 500, lineHeight: 16` | `MaterialTheme.typography.labelSmall` | `.font(.system(size: 11)).fontWeight(.medium)` | `type.label.sm` |
| color | RN-wrapper | `semantic.color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |
| fontSize | RN-wrapper (override) | `10` | `fontSize = 10.sp` | `.font(.system(size: 10))` | ESCALATE — 10 is non-standard |
| lineHeight | RN-wrapper (override) | `12` | `lineHeight = 12.sp` | `.lineSpacing(2)` (10+2=12) | ESCALATE — 12 is non-standard |

**Visual — distanceLabel shadow:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| shadowColor | RN-wrapper | `'#000'` | `shadowColor = Color.Black` | `.shadow(color: .black)` | ESCALATE — hardcoded black |
| shadowOffset | RN-wrapper | `{width: 0, height: 1}` | `offset = Offset(0f, 1f)` | `.shadow(radius: 2)` | n/a |
| shadowOpacity | RN-wrapper | `0.2` | `shadowAlpha = 0.2f` | n/a (SwiftUI uses radius) | ESCALATE — opacity constant |
| shadowRadius | RN-wrapper | `2` | `shadowRadius = 2.dp` | `.shadow(radius: 2)` | ESCALATE — shadow radius |
| elevation | RN-wrapper | `2` | `elevation = 2.dp` | n/a (iOS uses shadow) | ESCALATE — elevation constant |

**Animation — press feedback:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| scale (default) | RN-wrapper | `1` | `scale = 1f` | `.scaleEffect(1.0)` | n/a |
| scale (pressed) | RN-wrapper | `0.9` | `scale = 0.9f` | `.scaleEffect(0.9)` | ESCALATE — scale constant |
| speed | RN-wrapper | `50` | `animationSpec = spring(dampingRatio = Spring.DampingRatioMediumBouncy, stiffness = Spring.StiffnessLow)` | `.animation(.spring(response: 0.3, dampingFraction: 0.6))` | ESCALATE — animation constant |
| bounciness | RN-wrapper | `4` | `animationSpec = spring(...)` | `.animation(.spring(...))` | ESCALATE — animation constant |

### WaypointCard (WaypointMarker)

**Source files read:**
- LaneShadow: `react-native/components/map/waypoint-marker.tsx`
- Framework: `node_modules/@rnmapbox/maps/lib/components/markerView.js`, `node_modules/react-native-svg/src/elements/Shape.tsx`

**Layout — container:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| alignItems | RN-wrapper | `'center'` | `horizontalAlignment = Alignment.CenterHorizontally` | `.frame(maxWidth: .infinity, alignment: .center)` | n/a |
| justifyContent | RN-wrapper | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.frame(maxHeight: .infinity, alignment: .center)` | n/a |
| width/height | RN-wrapper (from size) | derived from `size` prop (default 32) | `Modifier.size(size.dp)` | `.frame(width: size, height: size)` | ESCALATE — 32 is close to 2xl=32 |

**Layout — labelContainer (for index):**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| position | RN-wrapper | `absolute` | `Modifier.offset(x, y)` | `.position(x, y)` | n/a |
| alignItems | RN-wrapper | `'center'` | `horizontalAlignment = Alignment.CenterHorizontally` | `.frame(maxWidth: .infinity, alignment: .center)` | n/a |
| justifyContent | RN-wrapper | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.frame(maxHeight: .infinity, alignment: .center)` | n/a |
| width/height | RN-wrapper | `20` | `Modifier.size(20.dp)` | `.frame(width: 20, height: 20)` | ESCALATE — 20 is between sm=8 and md=12 |

**Visual — SVG marker dimensions:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| pinHeight | RN-wrapper | `size` (default 32) | derived | derived | ESCALATE — 32 is close to 2xl=32 |
| pinWidth | RN-wrapper | `size * 0.8` (default 25.6) | derived | derived | ESCALATE — derived constant |
| circleRadius | RN-wrapper | `pinWidth / 2` (default 12.8) | derived | derived | ESCALATE — derived constant |
| stemHeight | RN-wrapper | `pinHeight * 0.4` (default 12.8) | derived | derived | ESCALATE — derived constant |
| innerRadius | RN-wrapper | `circleRadius * 0.6` (default 7.68) | derived | derived | ESCALATE — derived constant |

**Visual — colors (by kind):**

| Kind | Fill color | Token |
|---|---|---|
| on_route | `semantic.color.waypointOnRoute?.default ?? semantic.color.success.default` | `color.waypointOnRoute.default` or `color.success.default` |
| off_route | `semantic.color.waypointOffRoute?.default ?? semantic.color.warning.default` | `color.waypointOffRoute.default` or `color.warning.default` |
| mixed | `semantic.color.waypointMixed?.default ?? semantic.color.info.default` | `color.waypointMixed.default` or `color.info.default` |

**Visual — colors (by state):**

| State | Fill color | Token |
|---|---|---|
| selected | `semantic.color.tertiary.default` | `color.tertiary.default` |
| pressed | `colorSet?.pressed ?? baseColor` | `color.waypointOnRoute.pressed` or similar |
| disabled | `semantic.color.muted.default` | `color.muted.default` |

**Visual — selected ring:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| circle (outer) | RN-wrapper (selected only) | radius = `circleRadius + 2` (default 14.8) | derived | derived | ESCALATE — derived constant |
| fill | RN-wrapper | `'none'` | n/a | n/a | n/a |
| stroke | RN-wrapper | `semantic.color.tertiary.default` | `LaneShadowTheme.colors.tertiary` | `theme.colors.tertiary` | `color.tertiary.default` |
| strokeWidth | RN-wrapper | `2` | `strokeWidth = 2.dp` | `.stroke(lineWidth: 2)` | ESCALATE — 2 is minimal border |

## DESIGN NOTES

- Preserve RN spacing, composition hierarchy, and edge-case fixtures such as long labels, loading, and error states.
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
