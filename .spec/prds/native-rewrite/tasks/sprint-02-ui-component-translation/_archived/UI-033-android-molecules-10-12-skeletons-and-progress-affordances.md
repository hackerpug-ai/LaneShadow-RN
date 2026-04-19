# UI-033: Android molecules 10/12 — skeletons & progress affordances: `CardSkeleton`, `LabelSkeleton`, `SkeletonWrapper`, `WeatherBadgeSkeleton`, `DownloadProgressIndicator` (offline), `DownloadProgressIndicator` (model), `DownloadProgressBanner`

**Task ID:** UI-033
**Sprint:** Sprint 2 - UI Component Translation and Fidelity Sandbox
**Assigned To:** kotlin-implementer
**Reviewer:** kotlin-reviewer
**Estimate:** 240 min
**Type:** [FEATURE]
**Status:** Planned
**Phase:** Molecules
**Quality Score:** 115/115

---

## BACKGROUND

Sprint 2 translates the React Native baseline into native platform components and sandbox scenarios before rider-facing feature sprints resume. This task covers the `molecules` slice for `Android molecules 10/12 — skeletons & progress affordances: CardSkeleton, LabelSkeleton, SkeletonWrapper, WeatherBadgeSkeleton, DownloadProgressIndicator (offline), DownloadProgressIndicator (model), DownloadProgressBanner`.

**Objective:** Implement Android molecules 10/12 — skeletons & progress affordances: `CardSkeleton`, `LabelSkeleton`, `SkeletonWrapper`, `WeatherBadgeSkeleton`, `DownloadProgressIndicator` (offline), `DownloadProgressIndicator` (model), `DownloadProgressBanner` as Jetpack Compose work with parity to the RN baseline, token-only styling, and sandbox coverage.

**Success State:** A reviewer can open the Android sandbox, browse this task's scenarios, and confirm naming, interface, theme, state, accessibility, and layout parity against RN.

## CRITICAL CONSTRAINTS

### MUST
- Implement the listed components or compositions with parity-aligned naming and interfaces: `CardSkeleton`, `LabelSkeleton`, `SkeletonWrapper`, `WeatherBadgeSkeleton`, `DownloadProgressIndicator` (offline), `DownloadProgressIndicator` (model), `DownloadProgressBanner`.
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
**THEN** The listed components or compositions exist in the correct Android Compose directories with parity-aligned names and signatures: `CardSkeleton`, `LabelSkeleton`, `SkeletonWrapper`, `WeatherBadgeSkeleton`, `DownloadProgressIndicator` (offline), `DownloadProgressIndicator` (model), `DownloadProgressBanner`.
**Verify:** `printf "%s\n" "`CardSkeleton`, `LabelSkeleton`, `SkeletonWrapper`, `WeatherBadgeSkeleton`, `DownloadProgressIndicator` (offline), `DownloadProgressIndicator` (model), `DownloadProgressBanner`"`

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
| TC-1 | AC-1 | The listed components or compositions exist in the correct Android Compose directories with parity-aligned names and signatures: `CardSkeleton`, `LabelSkeleton`, `SkeletonWrapper`, `WeatherBadgeSkeleton`, `DownloadProgressIndicator` (offline), `DownloadProgressIndicator` (model), `DownloadProgressBanner`. | `printf "%s\n" "`CardSkeleton`, `LabelSkeleton`, `SkeletonWrapper`, `WeatherBadgeSkeleton`, `DownloadProgressIndicator` (offline), `DownloadProgressIndicator` (model), `DownloadProgressBanner`"` |
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
| CardSkeleton | `react-native/components/skeleton/card-skeleton.tsx` | `node_modules/react-native/Libraries/Animated/Animated.js`; `node_modules/react-native/Libraries/Components/View/View.js` | `android/app/src/main/java/com/laneshadow/ui/molecules/CardSkeleton.kt` | 2 variants (compact/default) × 2 badges (best/weather) |
| LabelSkeleton | `react-native/components/skeleton/label-skeleton.tsx` | `node_modules/react-native/Libraries/Animated/Animated.js`; `node_modules/react-native/Libraries/Components/View/View.js` | `android/app/src/main/java/com/laneshadow/ui/molecules/LabelSkeleton.kt` | 3 widths (short=80/medium=160/long=240) × custom height × custom radius |
| SkeletonWrapper | `react-native/components/skeleton/skeleton-wrapper.tsx` | `node_modules/react-native-reanimated/src/reanimated2/FadeIn.ts` | `android/app/src/main/java/com/laneshadow/ui/molecules/SkeletonWrapper.kt` | Wrapper with loading/skeleton/content states × fade transition |
| WeatherBadgeSkeleton | `react-native/components/skeleton/weather-badge-skeleton.tsx` | `node_modules/react-native/Libraries/Animated/Animated.js`; `node_modules/react-native/Libraries/Components/View/View.js` | `android/app/src/main/java/com/laneshadow/ui/molecules/WeatherBadgeSkeleton.kt` | 2 variants (compact/default) |
| DownloadProgressIndicator (offline) | `react-native/components/model/DownloadProgressIndicator.tsx` | `node_modules/react-native/Libraries/Animated/Animated.js`; `node_modules/react-native-paper/src/components/ActivityIndicator/ActivityIndicator.tsx` | `android/app/src/main/java/com/laneshadow/ui/molecules/DownloadProgressIndicator.kt` | 4 states (downloading/completed/failed/paused) × radial animation |
| DownloadProgressIndicator (model) | Same as offline | Same as offline | Same file (variant prop) | Same variants |
| DownloadProgressBanner | `react-native/components/model/DownloadProgressBanner.tsx` | `node_modules/react-native/Libraries/Animated/Animated.js`; `node_modules/react-native/Libraries/Components/TouchableOpacity/TouchableOpacity.js` | `android/app/src/main/java/com/laneshadow/ui/molecules/DownloadProgressBanner.kt` | Slim horizontal banner × slide animation × dismiss button |

## STYLE PROPERTIES MATRIX

> Exhaustive enumeration of every style property from both sources per `08f-translation-protocol.md`. Columns: Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping. `ESCALATE` = no token covers the value — add a proposed token to DECISIONS.md before implementing.
>
> **Token reference** (from `tokens/semantic/semantic.tokens.json`): space xs=4 sm=8 md=12 lg=16 xl=24 2xl=32 3xl=48 4xl=64; radius none=0 sm=4 md=8 lg=16 xl=24 2xl=32 full=9999; elevation[2] shadowOffset=0/2 shadowOpacity=0.05 shadowRadius=4 androidElevation=2. **Paper labelLarge**: fontFamily=sans-serif-medium, fontWeight=500, fontSize=14, lineHeight=20, letterSpacing=0.1. **Paper labelSmall**: fontFamily=sans-serif-medium, fontWeight=500, fontSize=11, lineHeight=16, letterSpacing=0.5. **semantic.type.label.md**: fontSize=14, lineHeight=20, fontWeight=500. **semantic.type.body.sm**: fontSize=14, lineHeight=21, fontWeight=400.

### CardSkeleton

**Source files read:**
- LaneShadow: `react-native/components/skeleton/card-skeleton.tsx`
- Framework: `node_modules/react-native/Libraries/Animated/Animated.js`, `node_modules/react-native/Libraries/Components/View/View.js`

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | backgroundColor | RN-wrapper | `color.surfaceVariant.default` | `LaneShadowTheme.colors.surfaceVariant` | `theme.colors.surfaceVariant` | `color.surfaceVariant.default` |
| Layout | borderColor | RN-wrapper | `color.border.default` | `LaneShadowTheme.colors.border` | `theme.colors.border` | `color.border.default` |
| Layout | borderWidth | RN-wrapper | 1 | `Modifier.border(1.dp, ...)` | `.overlay(RoundedRectangle(...).stroke(..., lineWidth: 1))` | ESCALATE — propose `borderWidth.thin = 1` |
| Layout | borderRadius | RN-wrapper | 12 (hardcoded) | `RoundedCornerShape(12.dp)` | `RoundedRectangle(cornerRadius: 12)` | ESCALATE — `radius.lg = 16` is close; propose `radius.card = 12` |
| Layout — compact | padding | RN-wrapper | 10 | `Modifier.padding(10.dp)` | `.padding(10)` | ESCALATE — `space.md = 12` is close; propose `space.sm2 = 10` |
| Layout — default | padding | RN-wrapper | 14 | `Modifier.padding(14.dp)` | `.padding(14)` | ESCALATE — `space.lg = 16` is close; propose `space.md3 = 14` |
| Layout | gap | RN-wrapper | compact=6, default=10 | `Arrangement.spacedBy(6.dp or 10.dp)` | `Spacer(minLength: 6 or 10)` | ESCALATE — `space.xs = 4`, `space.sm = 8` |
| Layout — badge row | gap | RN-wrapper | 8 | `Arrangement.spacedBy(8.dp)` | `Spacer(minLength: 8)` | `space.sm` |
| Layout — badge | paddingHorizontal | RN-wrapper | 10 | `Modifier.padding(horizontal = 10.dp)` | `.padding(.horizontal, 10)` | ESCALATE — `space.md = 12` is close; propose `space.sm2 = 10` |
| Layout — badge | paddingVertical | RN-wrapper | 4 | `Modifier.padding(vertical = 4.dp)` | `.padding(.vertical, 4)` | `space.xs` |
| Layout — badge | borderRadius | RN-wrapper | `radius.lg` = 16 | `RoundedCornerShape(16.dp)` | `RoundedRectangle(cornerRadius: 16)` | `radius.lg` |
| Layout — weather badge | gap | RN-wrapper | 4 | `Arrangement.spacedBy(4.dp)` | `Spacer(minLength: 4)` | `space.xs` |
| Visual — shimmer overlay | backgroundColor | RN-wrapper | `rgba(255,255,255,0.10)` | `Color.White.copy(alpha = 0.1f)` | `.white.opacity(0.1)` | ESCALATE — propose `color.shimmer = rgba(255,255,255,0.10)` |
| Visual — shimmer | duration | RN-wrapper | 1500ms | `durationMillis = 1500` | `.duration(1.5)` | n/a |
| Visual — badge bg | backgroundColor | RN-wrapper | `color.muted.default` | `LaneShadowTheme.colors.muted` | `theme.colors.muted` | `color.muted.default` |
| Visual — weather icon circle | size | RN-wrapper | 14 | `14.dp` | `14` | ESCALATE — `space.sm = 8`, `space.md = 12`; propose `iconSize.xs = 14` |
| Visual — weather icon circle | borderRadius | RN-wrapper | 7 (half of 14) | `CircleShape` | `Circle()` | `radius.full` ✓ (9999/2 = 7) |
| Visual — weather icon circle | backgroundColor | RN-wrapper | `color.surfaceVariant.pressed` | `LaneShadowTheme.colors.surfaceVariantPressed` | `theme.colors.surfaceVariantPressed` | `color.surfaceVariant.pressed` |
| Visual — weather text bar | width | RN-wrapper | 40 | `40.dp` | `40` | ESCALATE — `space.xl = 24`, `space.2xl = 32`; propose `space.3xl = 48` / 40 |
| Visual — weather text bar | height | RN-wrapper | 12 | `12.dp` | `12` | `space.md` |
| Visual — weather text bar | borderRadius | RN-wrapper | `radius.sm` = 4 | `RoundedCornerShape(4.dp)` | `RoundedRectangle(cornerRadius: 4)` | `radius.sm` |
| Layout — title | height | RN-wrapper | compact=14, default=16 | `Modifier.height(14.dp or 16.dp)` | `.frame(height: 14 or 16)` | ESCALATE — `space.md = 12`, `space.lg = 16` |
| Layout — title | width | RN-wrapper | 70% | `Modifier.fillMaxWidth(0.7f)` | `.frame(maxWidth: .infinity * 0.7)` | n/a |
| Visual — title bar | backgroundColor | RN-wrapper | `color.muted.default` | `LaneShadowTheme.colors.muted` | `theme.colors.muted` | `color.muted.default` |
| Visual — title bar | borderRadius | RN-wrapper | `radius.sm` = 4 | `RoundedCornerShape(4.dp)` | `RoundedRectangle(cornerRadius: 4)` | `radius.sm` |
| Layout — description | gap | RN-wrapper | 6 | `Arrangement.spacedBy(6.dp)` | `Spacer(minLength: 6)` | ESCALATE — `space.xs = 4`, `space.sm = 8` |
| Layout — description bar | height | RN-wrapper | 14 | `Modifier.height(14.dp)` | `.frame(height: 14)` | ESCALATE — `space.md = 12` is close |
| Layout — description bar | width | RN-wrapper | 100%, 60% | `Modifier.fillMaxWidth(1f or 0.6f)` | `.frame(maxWidth: .infinity * 1 or 0.6)` | n/a |
| Visual — description bar | backgroundColor | RN-wrapper | `color.muted.default` | `LaneShadowTheme.colors.muted` | `theme.colors.muted` | `color.muted.default` |
| Visual — description bar | borderRadius | RN-wrapper | `radius.sm` = 4 | `RoundedCornerShape(4.dp)` | `RoundedRectangle(cornerRadius: 4)` | `radius.sm` |
| Layout — stat | height | RN-wrapper | compact=11, default=13 | `Modifier.height(11.dp or 13.dp)` | `.frame(height: 11 or 13)` | ESCALATE — `space.sm = 8`, `space.md = 12` |
| Layout — stat | width | RN-wrapper | 85% | `Modifier.fillMaxWidth(0.85f)` | `.frame(maxWidth: .infinity * 0.85)` | n/a |
| Layout — stat | marginTop | RN-wrapper | 2 | `Modifier.padding(top = 2.dp)` | `.padding(.top, 2)` | ESCALATE — `space.xs = 4` / 2 |
| Visual — stat bar | backgroundColor | RN-wrapper | `color.muted.default` | `LaneShadowTheme.colors.muted` | `theme.colors.muted` | `color.muted.default` |
| Visual — stat bar | borderRadius | RN-wrapper | `radius.sm` = 4 | `RoundedCornerShape(4.dp)` | `RoundedRectangle(cornerRadius: 4)` | `radius.sm` |
| Interaction | accessibilityRole | RN-wrapper | `'progressbar'` | `Modifier.semantics { role = Role.ProgressBar }` | `.accessibilityAddTraits(.updatesFrequently)` | n/a |
| Interaction | accessibilityLabel | RN-wrapper | `'Loading'` | `Modifier.semantics { this.contentDescription = "Loading" }` | `.accessibilityLabel("Loading")` | n/a |

---

### LabelSkeleton

**Source files read:**
- LaneShadow: `react-native/components/skeleton/label-skeleton.tsx`
- Framework: `node_modules/react-native/Libraries/Animated/Animated.js`, `node_modules/react-native/Libraries/Components/View/View.js`

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout — width | short | RN-wrapper | 80 | `Modifier.width(80.dp)` | `.frame(width: 80)` | ESCALATE — `space.xl = 24`, `space.2xl = 32`; propose `size.skeletonShort = 80` |
| Layout — width | medium | RN-wrapper | 160 | `Modifier.width(160.dp)` | `.frame(width: 160)` | ESCALATE — propose `size.skeletonMedium = 160` |
| Layout — width | long | RN-wrapper | 240 | `Modifier.width(240.dp)` | `.frame(width: 240)` | ESCALATE — propose `size.skeletonLong = 240` |
| Layout — height | RN-wrapper | 28 (default) | `Modifier.height(28.dp)` | `.frame(height: 28)` | ESCALATE — `space.lg = 16`, `space.xl = 24`; propose `type.label.md.lineHeight = 28` |
| Layout — borderRadius | RN-wrapper | `radius.md` = 8 (default) | `RoundedCornerShape(8.dp)` | `RoundedRectangle(cornerRadius: 8)` | `radius.md` |
| Visual | backgroundColor | RN-wrapper | `color.surfaceVariant.default` | `LaneShadowTheme.colors.surfaceVariant` | `theme.colors.surfaceVariant` | `color.surfaceVariant.default` |
| Visual — shimmer overlay | backgroundColor | RN-wrapper | `rgba(255,255,255,0.10)` | `Color.White.copy(alpha = 0.1f)` | `.white.opacity(0.1)` | ESCALATE — propose `color.shimmer = rgba(255,255,255,0.10)` |
| Visual — shimmer | duration | RN-wrapper | 1500ms | `durationMillis = 1500` | `.duration(1.5)` | n/a |
| Interaction | accessibilityRole | RN-wrapper | `'progressbar'` | `Modifier.semantics { role = Role.ProgressBar }` | `.accessibilityAddTraits(.updatesFrequently)` | n/a |
| Interaction | accessibilityLabel | RN-wrapper | `'Loading'` | `Modifier.semantics { this.contentDescription = "Loading" }` | `.accessibilityLabel("Loading")` | n/a |
| State | reduceMotion | RN-wrapper | detect via `AccessibilityInfo.isReduceMotionEnabled()` | `LocalAccessibilityManager.applyReduceMotion()` | `@Environment(\.accessibilityReduceMotion)` | n/a |

---

### SkeletonWrapper

**Source files read:**
- LaneShadow: `react-native/components/skeleton/skeleton-wrapper.tsx`
- Framework: `node_modules/react-native-reanimated/src/reanimated2/FadeIn.ts`

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| State | loading | RN-wrapper | boolean prop | `val loading: Boolean` | `@Binding var loading: Bool` | n/a |
| Visual | fadeDuration | RN-wrapper | 300ms (default) | `animationSpec = durationMillis = 300` | `.animation(.easeInOut(duration: 0.3))` | ESCALATE — propose `motion.duration.fade = 300` |
| Visual | fadeAnimation | RN-wrapper | `FadeIn` from Reanimated | `AnimatedVisibility` with `fadeIn()` | `.transition(.opacity)` | n/a |
| Interaction | accessibilityLabel (loading) | RN-wrapper | `'Loading'` | `Modifier.semantics { this.contentDescription = "Loading" }` | `.accessibilityLabel("Loading")` | n/a |
| Interaction | accessibilityRole (loading) | RN-wrapper | `'progressbar'` | `Modifier.semantics { role = Role.ProgressBar }` | `.accessibilityAddTraits(.updatesFrequently)` | n/a |
| State | reduceMotion | RN-wrapper | detect via `AccessibilityInfo.isReduceMotionEnabled()` | `LocalAccessibilityManager.applyReduceMotion()` | `@Environment(\.accessibilityReduceMotion)` | n/a |
| State | reduceMotion behavior | RN-wrapper | `fadeConfig.duration = 0` | `animationSpec = spring(dampingRatio = 1f, stiffness = 1000f)` or `durationMillis = 0` | `.animation(.default)` (instant) | n/a |

---

### WeatherBadgeSkeleton

**Source files read:**
- LaneShadow: `react-native/components/skeleton/weather-badge-skeleton.tsx`
- Framework: `node_modules/react-native/Libraries/Animated/Animated.js`, `node_modules/react-native/Libraries/Components/View/View.js`

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | borderRadius | RN-wrapper | `radius.full` = 9999 | `CircleShape` | `Capsule()` or `RoundedRectangle(cornerRadius: .greatestFiniteMagnitude)` | `radius.full` |
| Layout | gap | RN-wrapper | 6 | `Arrangement.spacedBy(6.dp)` | `Spacer(minLength: 6)` | ESCALATE — `space.xs = 4`, `space.sm = 8` |
| Layout | paddingVertical | RN-wrapper | 6 | `Modifier.padding(vertical = 6.dp)` | `.padding(.vertical, 6)` | ESCALATE — `space.xs = 4` is close |
| Layout | paddingHorizontal | RN-wrapper | 12 | `Modifier.padding(horizontal = 12.dp)` | `.padding(.horizontal, 12)` | `space.md` |
| Visual | backgroundColor | RN-wrapper | `color.surfaceVariant.default` | `LaneShadowTheme.colors.surfaceVariant` | `theme.colors.surfaceVariant` | `color.surfaceVariant.default` |
| Visual — icon circle | size | RN-wrapper | compact=12, default=16 | `Modifier.size(12.dp or 16.dp)` | `.frame(width: 12 or 16, height: 12 or 16)` | ESCALATE — `space.sm = 8`, `space.md = 12`; propose `iconSize.xs = 12`, `iconSize.sm = 16` |
| Visual — icon circle | borderRadius | RN-wrapper | half of size | `CircleShape` | `Circle()` | `radius.full` |
| Visual — icon circle | backgroundColor | RN-wrapper | `color.muted.default` | `LaneShadowTheme.colors.muted` | `theme.colors.muted` | `color.muted.default` |
| Visual — text bar | width | RN-wrapper | compact=40, default=60 | `Modifier.width(40.dp or 60.dp)` | `.frame(width: 40 or 60)` | ESCALATE — `space.xl = 24`, `space.2xl = 32` |
| Visual — text bar | height | RN-wrapper | compact=10, default=13 | `Modifier.height(10.dp or 13.dp)` | `.frame(height: 10 or 13)` | ESCALATE — `space.sm = 8`, `space.md = 12` |
| Visual — text bar | borderRadius | RN-wrapper | `radius.sm` = 4 | `RoundedCornerShape(4.dp)` | `RoundedRectangle(cornerRadius: 4)` | `radius.sm` |
| Visual — text bar | backgroundColor | RN-wrapper | `color.muted.default` | `LaneShadowTheme.colors.muted` | `theme.colors.muted` | `color.muted.default` |
| Visual — pulse | duration | RN-wrapper | 500ms (half cycle) | `durationMillis = 500` | `.duration(0.5)` | n/a |
| Visual — pulse | min/max opacity | RN-wrapper | 0.6 / 1.0 | `alpha = 0.6f / 1.0f` | `.opacity(0.6 / 1.0)` | ESCALATE — propose `opacity.pulseMin = 0.6`, `opacity.pulseMax = 1.0` |
| Interaction | accessibilityRole | RN-wrapper | `'progressbar'` | `Modifier.semantics { role = Role.ProgressBar }` | `.accessibilityAddTraits(.updatesFrequently)` | n/a |
| Interaction | accessibilityLabel | RN-wrapper | `'Loading'` | `Modifier.semantics { this.contentDescription = "Loading" }` | `.accessibilityLabel("Loading")` | n/a |
| State | reduceMotion | RN-wrapper | detect via `AccessibilityInfo.isReduceMotionEnabled()` | `LocalAccessibilityManager.applyReduceMotion()` | `@Environment(\.accessibilityReduceMotion)` | n/a |

---

### DownloadProgressIndicator (offline + model variants)

**Source files read:**
- LaneShadow: `react-native/components/model/DownloadProgressIndicator.tsx`
- Framework: `node_modules/react-native/Libraries/Animated/Animated.js`, `node_modules/react-native-paper/src/components/ActivityIndicator/ActivityIndicator.tsx`

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout — container | paddingVertical | RN-wrapper | 32 | `Modifier.padding(vertical = 32.dp)` | `.padding(.vertical, 32)` | ESCALATE — `space.3xl = 48` is close |
| Layout — container | paddingHorizontal | RN-wrapper | 24 | `Modifier.padding(horizontal = 24.dp)` | `.padding(.horizontal, 24)` | `space.xl` |
| Layout | gap | RN-wrapper | 24 | `Arrangement.spacedBy(24.dp)` | `Spacer(minLength: 24)` | `space.xl` |
| Layout — ring container | size | RN-wrapper | 200 | `Modifier.size(200.dp)` | `.frame(width: 200, height: 200)` | ESCALATE — propose `size.progressRing = 200` |
| Visual — outer ring | size | RN-wrapper | 200 | `Modifier.size(200.dp)` | `.frame(width: 200, height: 200)` | ESCALATE — same as above |
| Visual — outer ring | borderRadius | RN-wrapper | 100 (half of 200) | `CircleShape` | `Circle()` | `radius.full` ✓ (9999/2 = 100) |
| Visual — outer ring | borderWidth | RN-wrapper | 2 | `Modifier.border(2.dp, ...)` | `.overlay(Circle().stroke(..., lineWidth: 2))` | ESCALATE — `borderWidth.thin = 1` is close |
| Visual — outer ring | borderStyle | RN-wrapper | `'dashed'` | `BorderStroke(2.dp, PathDashEffect)` | `dash: phases` or custom stroke | n/a |
| Visual — outer ring | opacity | RN-wrapper | 0.5 | `Modifier.alpha(0.5f)` | `.opacity(0.5)` | ESCALATE — propose `opacity.faint = 0.5` |
| Visual — outer ring | borderColor (downloading) | RN-wrapper | `#F59E0B` (amber) | `Color(0xFFF59E0B)` | `Color(red: 0.96, green: 0.62, blue: 0.04)` | ESCALATE — propose `color.progress.downloading = #F59E0B` |
| Visual — outer ring | borderColor (completed) | RN-wrapper | `#10B981` (green) | `Color(0xFF10B981)` | `Color(red: 0.06, green: 0.72, blue: 0.51)` | ESCALATE — propose `color.progress.completed = #10B981` |
| Visual — outer ring | borderColor (failed) | RN-wrapper | `#EF4444` (red) | `Color(0xFFEF4444)` | `Color(red: 0.94, green: 0.26, blue: 0.27)` | `color.danger.default` |
| Visual — middle ring | size | RN-wrapper | 180 | `Modifier.size(180.dp)` | `.frame(width: 180, height: 180)` | ESCALATE — propose `size.progressRingInner = 180` |
| Visual — middle ring | borderRadius | RN-wrapper | 90 (half of 180) | `CircleShape` | `Circle()` | `radius.full` ✓ (9999/2 = 90) |
| Visual — middle ring | borderWidth | RN-wrapper | 1 | `Modifier.border(1.dp, ...)` | `.overlay(Circle().stroke(..., lineWidth: 1))` | ESCALATE — `borderWidth.thin = 1` |
| Visual — middle ring | opacity | RN-wrapper | 0.3 | `Modifier.alpha(0.3f)` | `.opacity(0.3)` | ESCALATE — propose `opacity.veryFaint = 0.3` |
| Visual — middle ring | borderColor | RN-wrapper | same as outer ring | same | same | same as outer ring |
| Visual — progress ring | size | RN-wrapper | 160 | `Modifier.size(160.dp)` | `.frame(width: 160, height: 160)` | ESCALATE — propose `size.progressRingFill = 160` |
| Visual — progress ring | borderRadius | RN-wrapper | 80 (half of 160) | `CircleShape` | `Circle()` | `radius.full` ✓ (9999/2 = 80) |
| Visual — progress ring | backgroundColor | RN-wrapper | `rgba(0, 0, 0, 0.8)` | `Color.Black.copy(alpha = 0.8f)` | `.black.opacity(0.8)` | ESCALATE — propose `color.progressTrack = rgba(0,0,0,0.8)` |
| Visual — progress fill | width | RN-wrapper | 2 | `2.dp` | `2` | ESCALATE — `borderWidth.thin = 1` is close |
| Visual — progress fill | shadowColor | RN-wrapper | `#F59E0B` (amber) | `Color(0xFFF59E0B)` | `Color(red: 0.96, green: 0.62, blue: 0.04)` | ESCALATE — same as outer ring |
| Visual — progress fill | shadowOffset | RN-wrapper | `{width: 0, height: 0}` | `Shadow(elevation = 8.dp, offset = Offset(0.dp, 0.dp))` | `.shadow(color: radius: y:)` | ESCALATE — `elevation[8]` |
| Visual — progress fill | shadowOpacity | RN-wrapper | 0.8 | `alpha = 0.8f` | `opacity: 0.8` | ESCALATE — propose `opacity.shadowBright = 0.8` |
| Visual — progress fill | shadowRadius | RN-wrapper | 8 | `8.dp` | `8` | ESCALATE — `shadow.primaryRadius = 8` |
| Visual — particle | size | RN-wrapper | 8 | `Modifier.size(8.dp)` | `.frame(width: 8, height: 8)` | `space.sm` ✓ |
| Visual — particle dot | size | RN-wrapper | 4 | `Modifier.size(4.dp)` | `.frame(width: 4, height: 4)` | `space.xs` ✓ |
| Visual — particle dot | borderRadius | RN-wrapper | 2 (half of 4) | `CircleShape` | `Circle()` | `radius.full` ✓ (9999/2 = 2) |
| Visual — particle dot | shadowColor | RN-wrapper | `#F59E0B` (amber) | `Color(0xFFF59E0B)` | `Color(red: 0.96, green: 0.62, blue: 0.04)` | ESCALATE — same as outer ring |
| Visual — particle dot | shadowOffset | RN-wrapper | `{width: 0, height: 0}` | `Shadow(elevation = 4.dp, offset = Offset(0.dp, 0.dp))` | `.shadow(color: radius: y:)` | `elevation[4]` |
| Visual — particle dot | shadowOpacity | RN-wrapper | 1 | `alpha = 1f` | `opacity: 1` | n/a |
| Visual — particle dot | shadowRadius | RN-wrapper | 4 | `4.dp` | `4` | ESCALATE — `shadow.subtleRadius = 4` |
| Typography — progressText | fontSize | RN-wrapper | 36 | `36.sp` | `36` | ESCALATE — propose `type.display.xl.fontSize = 36` |
| Typography — progressText | fontWeight | RN-wrapper | 700 | `FontWeight.Bold` | `.bold` | ESCALATE — propose `fontWeight.bold = 700` |
| Typography — progressText | color | RN-wrapper | `#F59E0B` (amber) | `Color(0xFFF59E0B)` | `Color(red: 0.96, green: 0.62, blue: 0.04)` | ESCALATE — same as outer ring |
| Typography — progressText | letterSpacing | RN-wrapper | -1 | `LetterSpacing(-1.sp)` | `.tracking(-1)` | n/a |
| Typography — subText | fontSize | RN-wrapper | 12 | `12.sp` | `12` | ESCALATE — `type.label.sm.fontSize = 11` is close |
| Typography — subText | fontWeight | RN-wrapper | 500 | `FontWeight.Medium` | `.medium` | `type.label.md.fontWeight` |
| Typography — subText | color | RN-wrapper | `#9CA3AF` (gray) | `Color(0xFF9CA3AF)` | `Color(red: 0.61, green: 0.64, blue: 0.69)` | ESCALATE — propose `color.textSecondary = #9CA3AF` |
| Typography — statusText | fontSize | RN-wrapper | 14 | `14.sp` | `14` | `type.label.md.fontSize` |
| Typography — statusText | fontWeight | RN-wrapper | 600 | `FontWeight.SemiBold` | `.semibold` | ESCALATE — `type.label.md.fontWeight = 600` |
| Typography — statusText | color | RN-wrapper | `#10B981` (green) | `Color(0xFF10B981)` | `Color(red: 0.06, green: 0.72, blue: 0.51)` | ESCALATE — propose `color.success = #10B981` |
| Typography — statusText | letterSpacing | RN-wrapper | 1 | `LetterSpacing(1.sp)` | `.tracking(1)` | n/a |
| Typography — errorText | fontSize | RN-wrapper | 16 | `16.sp` | `16` | `type.body.md.fontSize` |
| Typography — errorText | fontWeight | RN-wrapper | 700 | `FontWeight.Bold` | `.bold` | ESCALATE — propose `fontWeight.bold = 700` |
| Typography — errorText | color | RN-wrapper | `#EF4444` (red) | `Color(0xFFEF4444)` | `Color(red: 0.94, green: 0.26, blue: 0.27)` | `color.danger.default` |
| Layout — stats panel | backgroundColor | RN-wrapper | `rgba(0, 0, 0, 0.4)` | `Color.Black.copy(alpha = 0.4f)` | `.black.opacity(0.4)` | ESCALATE — propose `color.panelOverlay = rgba(0,0,0,0.4)` |
| Layout — stats panel | borderRadius | RN-wrapper | 16 | `RoundedCornerShape(16.dp)` | `RoundedRectangle(cornerRadius: 16)` | `radius.lg` |
| Layout — stats panel | padding | RN-wrapper | 16 | `Modifier.padding(16.dp)` | `.padding(16)` | `space.lg` |
| Layout — stats panel | gap | RN-wrapper | 8 | `Arrangement.spacedBy(8.dp)` | `Spacer(minLength: 8)` | `space.sm` |
| Typography — statLabel | fontSize | RN-wrapper | 12 | `12.sp` | `12` | ESCALATE — `type.label.sm.fontSize = 11` is close |
| Typography — statLabel | fontWeight | RN-wrapper | 500 | `FontWeight.Medium` | `.medium` | `type.label.md.fontWeight` |
| Typography — statLabel | color | RN-wrapper | `#9CA3AF` (gray) | `Color(0xFF9CA3AF)` | `Color(red: 0.61, green: 0.64, blue: 0.69)` | ESCALATE — same as subText |
| Typography — statValue | fontSize | RN-wrapper | 14 | `14.sp` | `14` | `type.label.md.fontSize` |
| Typography — statValue | fontWeight | RN-wrapper | 600 | `FontWeight.SemiBold` | `.semibold` | ESCALATE — `type.label.md.fontWeight = 600` |
| Typography — statValue | color | RN-wrapper | `#F3F4F6` (off-white) | `Color(0xFFF3F4F6)` | `Color(red: 0.95, green: 0.96, blue: 0.96)` | ESCALATE — propose `color.onSurfaceDim = #F3F4F6` |
| Layout — error panel | backgroundColor | RN-wrapper | `rgba(239, 68, 68, 0.1)` | `Color(0xFFEF4444).copy(alpha = 0.1f)` | `Color(red: 0.94, green: 0.26, blue: 0.27).opacity(0.1)` | ESCALATE — propose `color.errorContainer = rgba(239,68,68,0.1)` |
| Layout — error panel | borderRadius | RN-wrapper | 8 | `RoundedCornerShape(8.dp)` | `RoundedRectangle(cornerRadius: 8)` | `radius.md` |
| Layout — error panel | padding | RN-wrapper | 12 | `Modifier.padding(12.dp)` | `.padding(12)` | `space.md` |
| Layout — error panel | borderLeftWidth | RN-wrapper | 3 | `Modifier.drawBehind { drawRoundRect(...).size(width=3.dp) }` | `.overlay(Rectangle().fill(...).frame(width: 3))` | ESCALATE — propose `borderWidth.thick = 3` |
| Layout — error panel | borderLeftColor | RN-wrapper | `#EF4444` (red) | `Color(0xFFEF4444)` | `Color(red: 0.94, green: 0.26, blue: 0.27)` | `color.danger.default` |
| Typography — errorPanelText | fontSize | RN-wrapper | 12 | `12.sp` | `12` | ESCALATE — `type.label.sm.fontSize = 11` is close |
| Typography — errorPanelText | color | RN-wrapper | `#FCA5A5` (light red) | `Color(0xFFFCA5A5)` | `Color(red: 0.99, green: 0.65, blue: 0.65)` | ESCALATE — propose `color.onErrorContainer = #FCA5A5` |
| Layout — statusBar | backgroundColor | RN-wrapper | `rgba(0, 0, 0, 0.3)` | `Color.Black.copy(alpha = 0.3f)` | `.black.opacity(0.3)` | ESCALATE — propose `color.badgeOverlay = rgba(0,0,0,0.3)` |
| Layout — statusBar | borderRadius | RN-wrapper | 20 | `RoundedCornerShape(20.dp)` | `RoundedRectangle(cornerRadius: 20)` | ESCALATE — `radius.xl = 24` is close |
| Layout — statusBar | padding | RN-wrapper | 8 vertical, 16 horizontal | `Modifier.padding(vertical = 8.dp, horizontal = 16.dp)` | `.padding(.vertical, 8).padding(.horizontal, 16)` | `space.sm`, `space.lg` |
| Layout — statusBar | gap | RN-wrapper | 8 | `Arrangement.spacedBy(8.dp)` | `Spacer(minLength: 8)` | `space.sm` |
| Layout — statusDot | size | RN-wrapper | 8 | `Modifier.size(8.dp)` | `.frame(width: 8, height: 8)` | `space.sm` ✓ |
| Layout — statusDot | borderRadius | RN-wrapper | 4 (half of 8) | `CircleShape` | `Circle()` | `radius.full` ✓ (9999/2 = 4) |
| Visual — animations | pulse | RN-wrapper | 1000ms cycle (500ms each direction) | `durationMillis = 1000` | `.animation(.easeInOut(duration: 1).repeatForever(autoreverses: true))` | n/a |
| Visual — animations | rotation | RN-wrapper | 20000ms full cycle (speeds up with progress) | `durationMillis = 20000 - progress * 150` | `.rotationEffect(...).animation(.linear(duration: 20).repeatForever(autoreverses: false))` | n/a |
| Visual — animations | particle | RN-wrapper | 1500ms cycle (speeds up with progress) | `durationMillis = 1500 - progress * 10` | `.animation(...)` | n/a |

---

### DownloadProgressBanner

**Source files read:**
- LaneShadow: `react-native/components/model/DownloadProgressBanner.tsx`
- Framework: `node_modules/react-native/Libraries/Animated/Animated.js`, `node_modules/react-native/Libraries/Components/TouchableOpacity/TouchableOpacity.js`

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | position | RN-wrapper | `'absolute'` top=0 | `Modifier.offset(x=0, y=0)` | `.frame(maxWidth: .infinity).position(.top)` | n/a |
| Layout | zIndex | RN-wrapper | 1000 | `Modifier.zIndex(1000)` | `.zIndex(1000)` | n/a |
| Visual | backgroundColor | RN-wrapper | `rgba(17, 24, 39, 0.95)` | `Color(0xFF111F27).copy(alpha = 0.95f)` | `Color(red: 0.07, green: 0.14, blue: 0.15).opacity(0.95)` | ESCALATE — propose `color.bannerDark = rgba(17,24,39,0.95)` |
| Visual | borderBottomWidth | RN-wrapper | 1 | `Modifier.drawBehind { drawLine(...).size(width=1.dp) }` | `.overlay(Rectangle().fill(...).frame(height: 1))` | ESCALATE — `borderWidth.thin = 1` |
| Visual | borderBottomColor | RN-wrapper | `rgba(245, 158, 11, 0.3)` | `Color(0xFFF59E0B).copy(alpha = 0.3f)` | `Color(red: 0.96, green: 0.62, blue: 0.04).opacity(0.3)` | ESCALATE — propose `color.progress.border = rgba(245,158,11,0.3)` |
| Layout | paddingTop | RN-wrapper | 8 | `Modifier.padding(top = 8.dp)` | `.padding(.top, 8)` | `space.sm` |
| Layout | paddingBottom | RN-wrapper | 12 | `Modifier.padding(bottom = 12.dp)` | `.padding(.bottom, 12)` | `space.md` |
| Layout | paddingHorizontal | RN-wrapper | 16 | `Modifier.padding(horizontal = 16.dp)` | `.padding(.horizontal, 16)` | `space.lg` |
| Layout — progressBar | height | RN-wrapper | 2 | `Modifier.height(2.dp)` | `.frame(height: 2)` | ESCALATE — `borderWidth.hairline = 0.5` is close |
| Layout — progressBar | position | RN-wrapper | `'absolute'` top=0 | `Modifier.offset(y=0)` | `.frame(maxHeight: .infinity).position(.top)` | n/a |
| Visual — progressBar bg | backgroundColor | RN-wrapper | `rgba(245, 158, 11, 0.2)` | `Color(0xFFF59E0B).copy(alpha = 0.2f)` | `Color(red: 0.96, green: 0.62, blue: 0.04).opacity(0.2)` | ESCALATE — propose `color.progress.bg = rgba(245,158,11,0.2)` |
| Visual — progressBar fill | height | RN-wrapper | 100% (of bg) | `Modifier.fillMaxHeight()` | `.frame(maxHeight: .infinity)` | n/a |
| Visual — progressBar fill | width | RN-wrapper | `${progress}%` | `Modifier.fillMaxWidth(progress / 100f)` | `.frame(maxWidth: .infinity * progress / 100)` | n/a |
| Visual — progressBar fill | backgroundColor | RN-wrapper | `#F59E0B` (amber) | `Color(0xFFF59E0B)` | `Color(red: 0.96, green: 0.62, blue: 0.04)` | ESCALATE — propose `color.progress.downloading = #F59E0B` |
| Layout — content | gap | RN-wrapper | 2 | `Arrangement.spacedBy(2.dp)` | `Spacer(minLength: 2)` | ESCALATE — `space.xs = 4` / 2 |
| Layout — content | marginTop | RN-wrapper | 8 | `Modifier.padding(top = 8.dp)` | `.padding(.top, 8)` | `space.sm` |
| Typography — title | fontSize | RN-wrapper | 14 | `14.sp` | `14` | `type.label.md.fontSize` |
| Typography — title | fontWeight | RN-wrapper | 600 | `FontWeight.SemiBold` | `.semibold` | ESCALATE — `type.label.md.fontWeight = 600` |
| Typography — title | color | RN-wrapper | `#F3F4F6` (off-white) | `Color(0xFFF3F4F6)` | `Color(red: 0.95, green: 0.96, blue: 0.96)` | ESCALATE — propose `color.onSurfaceDim = #F3F4F6` |
| Typography — title | letterSpacing | RN-wrapper | -0.2 | `LetterSpacing(-0.2.sp)` | `.tracking(-0.2)` | n/a |
| Typography — subtitle | fontSize | RN-wrapper | 12 | `12.sp` | `12` | ESCALATE — `type.label.sm.fontSize = 11` is close |
| Typography — subtitle | fontWeight | RN-wrapper | 500 | `FontWeight.Medium` | `.medium` | `type.label.md.fontWeight` |
| Typography — subtitle | color | RN-wrapper | `#9CA3AF` (gray) | `Color(0xFF9CA3AF)` | `Color(red: 0.61, green: 0.64, blue: 0.69)` | ESCALATE — propose `color.textSecondary = #9CA3AF` |
| Typography — dismiss | size | RN-wrapper | 16 | `16.dp` | `16` | ESCALATE — `iconSize.md = 16` |
| Typography — dismiss | iconColor | RN-wrapper | `#9CA3AF` (gray) | `Color(0xFF9CA3AF)` | `Color(red: 0.61, green: 0.64, blue: 0.69)` | ESCALATE — same as subtitle |
| Visual — animations | slide | RN-wrapper | 300ms | `animationSpec = durationMillis = 300` | `.animation(.easeInOut(duration: 0.3))` | ESCALATE — `motion.duration.fade = 300` |
| Visual — animations | progress | RN-wrapper | 300ms | `animationSpec = durationMillis = 300` | `.animation(.linear(duration: 0.3))` | same |

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
