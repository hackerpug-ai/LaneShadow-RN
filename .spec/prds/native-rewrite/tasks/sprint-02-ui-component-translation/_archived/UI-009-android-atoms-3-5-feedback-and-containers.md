# UI-009: Android atoms 3/5 — feedback & containers: `Badge`, `Card` (+ `CardHeader`/`CardTitle`/`CardContent`/`CardDescription`), `Chip`, `Avatar`, `Skeleton`, `Progress`, `Collapsible`, `FAB`

**Task ID:** UI-009
**Sprint:** Sprint 2 - UI Component Translation and Fidelity Sandbox
**Assigned To:** kotlin-implementer
**Reviewer:** kotlin-reviewer
**Estimate:** 480 min
**Type:** [FEATURE]
**Status:** Planned
**Phase:** Atoms
**Quality Score:** 115/115

---

## BACKGROUND

Sprint 2 translates the React Native baseline into native platform components and sandbox scenarios before rider-facing feature sprints resume. This task covers the `atoms` slice for `Android atoms 3/5 — feedback & containers: Badge, Card (+ CardHeader/CardTitle/CardContent/CardDescription), Chip, Avatar, Skeleton, Progress, Collapsible, FAB`.

**Objective:** Implement Android atoms 3/5 — feedback & containers: `Badge`, `Card` (+ `CardHeader`/`CardTitle`/`CardContent`/`CardDescription`), `Chip`, `Avatar`, `Skeleton`, `Progress`, `Collapsible`, `FAB` as Jetpack Compose work with parity to the RN baseline, token-only styling, and sandbox coverage.

**Success State:** A reviewer can open the Android sandbox, browse this task's scenarios, and confirm naming, interface, theme, state, accessibility, and layout parity against RN.

## CRITICAL CONSTRAINTS

### MUST
- Implement the listed components or compositions with parity-aligned naming and interfaces: `Badge`, `Card` (+ `CardHeader`/`CardTitle`/`CardContent`/`CardDescription`), `Chip`, `Avatar`, `Skeleton`, `Progress`, `Collapsible`, `FAB`.
- Use only the LaneShadow core theme contract locked by `UI-001`: `tokens/semantic/semantic.tokens.json` as the source of truth, generated `native-theme` outputs as the shared packaging layer, and the platform theme entry points (`LaneShadowTheme` on Android, `.laneShadowTheme()` on iOS) for colors, spacing, typography, radii, elevation, and state styling.
- Register sandbox scenarios for default, interactive, and edge-case states with RN reference labels.
- Cover all interactive states required by the parity spec for atomic controls and visuals.

### NEVER
- Add unrelated feature wiring or backend dependencies to satisfy sandbox rendering.
- Introduce hardcoded UI primitives or platform-only naming drift.

### STRICTLY
- Preserve light and dark parity, accessibility labels, and deterministic fixtures for every scenario.

## DELIVERABLES

- android/app/src/main/java/com/laneshadow/ui/atoms/**
- android/app/src/debug/java/com/laneshadow/sandbox/stories/AtomsStories.kt — story set aggregated into AppStories.all
- android/app/src/test/java/com/laneshadow/**
- android/app/src/androidTest/java/com/laneshadow/**

## ACCEPTANCE CRITERIA

### AC-1
**GIVEN** The RN baseline and atomic parity contract define the expected components and interfaces.
**WHEN** This task is implemented.
**THEN** The listed components or compositions exist in the correct Android Compose directories with parity-aligned names and signatures: `Badge`, `Card` (+ `CardHeader`/`CardTitle`/`CardContent`/`CardDescription`), `Chip`, `Avatar`, `Skeleton`, `Progress`, `Collapsible`, `FAB`.
**Verify:** `printf "%s\n" "`Badge`, `Card` (+ `CardHeader`/`CardTitle`/`CardContent`/`CardDescription`), `Chip`, `Avatar`, `Skeleton`, `Progress`, `Collapsible`, `FAB`"`

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
| TC-1 | AC-1 | The listed components or compositions exist in the correct Android Compose directories with parity-aligned names and signatures: `Badge`, `Card` (+ `CardHeader`/`CardTitle`/`CardContent`/`CardDescription`), `Chip`, `Avatar`, `Skeleton`, `Progress`, `Collapsible`, `FAB`. | `printf "%s\n" "`Badge`, `Card` (+ `CardHeader`/`CardTitle`/`CardContent`/`CardDescription`), `Chip`, `Avatar`, `Skeleton`, `Progress`, `Collapsible`, `FAB`"` |
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
- android/app/src/main/java/com/laneshadow/ui/atoms/**
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
| Badge | `react-native/components/ui/badge.tsx` | `node_modules/react-native-paper/src/styles/themes/v3/tokens.tsx` (labelSmall); `node_modules/react-native/Libraries/Components/View/View.js` | `android/app/src/main/java/com/laneshadow/ui/atoms/Badge.kt` | 7 variants (default/secondary/destructive/outline/success/warning/info) × 1 fixed size × 1 state + opacity prop (0-1) |
| Card (+ CardHeader, CardTitle, CardContent, CardDescription) | `react-native/components/ui/card.tsx` | `node_modules/react-native/Libraries/Components/Pressable/Pressable.js`; `node_modules/react-native/Libraries/Components/View/View.js` | `android/app/src/main/java/com/laneshadow/ui/atoms/Card.kt` | 5 variants (default/primary/success/warning/danger) × 2 states (default/pressed) × disabled × optional border |
| Chip | `react-native/components/ui/chip.tsx` | `node_modules/react-native/Libraries/Components/Pressable/Pressable.js`; `node_modules/react-native-paper/src/styles/themes/v3/tokens.tsx` (labelSmall) | `android/app/src/main/java/com/laneshadow/ui/atoms/Chip.kt` | 1 fixed size × 3 states (selected/pressed/disabled) × optional icon |
| Avatar (+ AvatarBadge) | `react-native/components/ui/avatar.tsx` | `node_modules/react-native/Libraries/Image/Image.js`; `node_modules/react-native/Libraries/Components/View/View.js` | `android/app/src/main/java/com/laneshadow/ui/atoms/Avatar.kt` | 3 sizes (default/lg/xl) × 2 shapes (full) × 3 display modes (image/initials/empty) × optional border/ring/badge |
| Skeleton (+ SkeletonAvatar, SkeletonText) | `react-native/components/ui/skeleton.tsx` | `node_modules/react-native/Libraries/Animated/Animated.js` (Animated.timing + loop); `node_modules/react-native/Libraries/Components/View/View.js` | `android/app/src/main/java/com/laneshadow/ui/atoms/Skeleton.kt` | 3 shapes (rectangle/circle/rounded) × custom dimensions × pulse animation (750ms fade 1→0.3→1) |
| Progress | `react-native/components/ui/progress.tsx` | `node_modules/react-native/Libraries/Animated/Animated.js` (Animated.timing + interpolate); `node_modules/react-native/Libraries/Components/View/View.js` | `android/app/src/main/java/com/laneshadow/ui/atoms/Progress.kt` | 1 fixed height (16px) × 2 modes (determinate/indeterminate) × smooth transition (300ms) |
| Collapsible | `react-native/components/ui/collapsible.tsx` | `node_modules/react-native/Libraries/Components/TouchableOpacity/TouchableOpacity.js`; `node_modules/react-native/Libraries/Components/View/View.js` | `android/app/src/main/java/com/laneshadow/ui/atoms/Collapsible.kt` | 1 fixed size × chevron rotation (0°→90°) × content reveal (mt=sm, ml=xl) |
| FAB | `react-native/components/ui/fab.tsx` | `node_modules/react-native-paper/src/components/FAB/FAB.tsx`; `node_modules/react-native-paper/src/styles/themes/v3/tokens.tsx` | `android/app/src/main/java/com/laneshadow/ui/atoms/FAB.kt` | Paper FAB wrapper × radius.xl × primary color × onSurface text |

## STYLE PROPERTIES MATRIX

> Exhaustive enumeration of every style property from both sources per `08f-translation-protocol.md`. Columns: Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping. `ESCALATE` = no token covers the value — add a proposed token to DECISIONS.md before implementing.
>
> **Token reference** (from `tokens/semantic/semantic.tokens.json`): space xs=4 sm=8 md=12 lg=16 xl=24 2xl=32 3xl=48 4xl=64; radius none=0 sm=4 md=8 lg=16 xl=24 2xl=32 full=9999; elevation[2] shadowOffset=0/2 shadowOpacity=0.05 shadowRadius=4 androidElevation=2. **Paper labelSmall**: fontFamily=sans-serif-medium, fontWeight=500, fontSize=11, lineHeight=16, letterSpacing=0.5. **semantic.type.label.sm**: fontSize=12, fontWeight=600. **semantic.type.title.md**: fontSize=18, fontWeight=600. **semantic.type.body.sm**: fontSize=14, lineHeight=21, fontWeight=400.

### Badge

**Source files read:**
- LaneShadow: `react-native/components/ui/badge.tsx`
- Framework: `node_modules/react-native-paper/src/styles/themes/v3/tokens.tsx`, `node_modules/react-native/Libraries/Components/View/View.js`

**Layout — padding:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| paddingHorizontal | RN-wrapper | 10 | `Modifier.padding(horizontal = 10.dp)` | `.padding(.horizontal, 10)` | ESCALATE — propose `space.xs + space.sm = 10` |
| paddingVertical | RN-wrapper | 2 | `Modifier.padding(vertical = 2.dp)` | `.padding(.vertical, 2)` | ESCALATE — propose `space.xxxs = 2` |

**Layout — border:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| borderWidth (outline) | RN-wrapper | 1 | `Modifier.border(1.dp)` | `.overlay(strokeBorder(lineWidth: 1))` | ESCALATE — propose `borderWidth.thin = 1` |
| borderColor (outline) | RN-wrapper | `color.border.default` | `LaneShadowTheme.colors.border` | `theme.colors.border` | `color.border.default` |

**Layout — borderRadius:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| borderRadius | RN-wrapper | `radius.full` = 9999 | `CircleShape` | `Capsule()` | `radius.full` |

**Layout — flex / alignment:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| alignItems | RN-wrapper | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.alignment(.center)` | n/a |
| justifyContent | RN-wrapper | `'center'` | `horizontalArrangement = Arrangement.Center` | n/a (HStack default) | n/a |
| alignSelf | RN-wrapper | `'flex-start'` | `Modifier.wrapContentWidth(Alignment.Start)` | `.frame(maxWidth: .infinity, alignment: .leading)` | n/a |
| iconSpacing | RN-wrapper | `space.xs` = 4 | `Spacer(Modifier.width(4.dp))` | `Spacer(minLength: 4)` | `space.xs` |

**Visual — backgroundColor (by variant):**

| Variant | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| default | RN-wrapper | `color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |
| secondary | RN-wrapper | `color.secondary.default` | `LaneShadowTheme.colors.secondary` | `theme.colors.secondary` | `color.secondary.default` |
| destructive | RN-wrapper | `color.danger.default` | `LaneShadowTheme.colors.danger` | `theme.colors.danger` | `color.danger.default` |
| outline | RN-wrapper | `'transparent'` | `Color.Transparent` | `.clear` | n/a |
| success | RN-wrapper | `color.success.default` | `LaneShadowTheme.colors.success` | `theme.colors.success` | `color.success.default` |
| warning | RN-wrapper | `color.warning.default` | `LaneShadowTheme.colors.warning` | `theme.colors.warning` | `color.warning.default` |
| info | RN-wrapper | `color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |
| any (with opacity) | RN-wrapper | hex with alpha suffix | `copy(color = baseColor.withOpacity(opacity))` | `.opacity(opacity)` | n/a (dynamic) |

**Visual — textColor (by variant):**

| Variant | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| default / destructive / success / warning / info | RN-wrapper | `color.onPrimary.default` | `LaneShadowTheme.colors.onPrimary` | `theme.colors.onPrimary` | `color.onPrimary.default` |
| secondary | RN-wrapper | `color.onSecondary.default` | `LaneShadowTheme.colors.onSecondary` | `theme.colors.onSecondary` | `color.onSecondary.default` |
| outline | RN-wrapper | `color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |

**Typography:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| fontSize | RN-wrapper | `semantic.type.label.sm` = 12 | `fontSize = 12.sp` | `.font(.system(size: 12))` | ESCALATE — propose `type.label.sm.fontSize = 12` |
| fontWeight | RN-wrapper | 600 | `fontWeight = FontWeight.SemiBold` | `.fontWeight(.semibold)` | ESCALATE — propose `type.label.sm.fontWeight = 600` |

### Card

**Source files read:**
- LaneShadow: `react-native/components/ui/card.tsx`
- Framework: `node_modules/react-native/Libraries/Components/Pressable/Pressable.js`, `node_modules/react-native/Libraries/Components/View/View.js`

**Layout — padding:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| padding (container) | RN-wrapper | `space.lg` = 16 | `Modifier.padding(16.dp)` | `.padding(16)` | `space.lg` |
| marginBottom (header) | RN-wrapper | `space.md` = 12 | `Modifier.padding(bottom = 12.dp)` | `.padding(.bottom, 12)` | `space.md` |

**Layout — border:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| borderWidth (optional) | RN-wrapper | 1 | `Modifier.border(1.dp)` | `.overlay(strokeBorder(lineWidth: 1))` | ESCALATE — propose `borderWidth.thin = 1` |
| borderColor (optional) | RN-wrapper | `color.border.default` | `LaneShadowTheme.colors.border` | `theme.colors.border` | `color.border.default` |

**Layout — borderRadius:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| borderRadius | RN-wrapper | `radius.lg` = 16 | `RoundedCornerShape(16.dp)` | `RoundedRectangle(cornerRadius: 16)` | `radius.lg` |

**Layout — flex / alignment:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| flexDirection (header) | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| alignItems (header) | RN-wrapper | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.alignment(.center)` | n/a |
| justifyContent (header) | RN-wrapper | `'space-between'` | `horizontalArrangement = Arrangement.SpaceBetween` | `.spacing(.infinity)` | n/a |

**Visual — backgroundColor (by variant × state):**

| Variant | State | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|---|
| default | default | RN-wrapper | `color.card.default` | `LaneShadowTheme.colors.card` | `theme.colors.card` | `color.card.default` |
| default | pressed | RN-wrapper | `color.card.pressed` (fallback: card.default) | `LaneShadowTheme.colors.cardPressed` | `theme.colors.cardPressed` | `color.card.pressed` |
| default | disabled | RN-wrapper | `color.card.disabled` (fallback: card.default) | `LaneShadowTheme.colors.cardDisabled` | `theme.colors.cardDisabled` | `color.card.disabled` |
| primary | default | RN-wrapper | `color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |
| primary | pressed | RN-wrapper | `color.primary.pressed` (fallback: primary.default) | `LaneShadowTheme.colors.primaryPressed` | `theme.colors.primaryPressed` | `color.primary.pressed` |
| success | default | RN-wrapper | `color.success.default` | `LaneShadowTheme.colors.success` | `theme.colors.success` | `color.success.default` |
| success | pressed | RN-wrapper | `color.success.pressed` (fallback: success.default) | `LaneShadowTheme.colors.successPressed` | `theme.colors.successPressed` | `color.success.pressed` |
| warning | default | RN-wrapper | `color.warning.default` | `LaneShadowTheme.colors.warning` | `theme.colors.warning` | `color.warning.default` |
| warning | pressed | RN-wrapper | `color.warning.pressed` (fallback: warning.default) | `LaneShadowTheme.colors.warningPressed` | `theme.colors.warningPressed` | `color.warning.pressed` |
| danger | default | RN-wrapper | `color.danger.default` | `LaneShadowTheme.colors.danger` | `theme.colors.danger` | `color.danger.default` |
| danger | pressed | RN-wrapper | `color.danger.pressed` (fallback: danger.default) | `LaneShadowTheme.colors.dangerPressed` | `theme.colors.dangerPressed` | `color.danger.pressed` |

**Visual — textColor (CardTitle by variant):**

| Variant | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| default | RN-wrapper | `color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |
| primary / success / warning / danger | RN-wrapper | `color.onPrimary.default` | `LaneShadowTheme.colors.onPrimary` | `theme.colors.onPrimary` | `color.onPrimary.default` |

**Visual — textColor (CardDescription by variant):**

| Variant | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| default | RN-wrapper | `color.onSurface.muted` (fallback: onSurface.default) | `LaneShadowTheme.colors.onSurfaceMuted` | `theme.colors.onSurfaceMuted` | `color.onSurface.muted` |
| primary / success / warning / danger | RN-wrapper | `color.onPrimary.default` | `LaneShadowTheme.colors.onPrimary` | `theme.colors.onPrimary` | `color.onPrimary.default` |

**Visual — elevation:**

| State | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| default | RN-wrapper | `elevation[2]` | shadowOffset=0/2, shadowOpacity=0.05, shadowRadius=4, androidElevation=2 | `.shadow(radius: 4, y: 2, opacity: 0.05)` | `elevation[2]` |
| pressed | RN-wrapper | `elevation[3]` | ESCALATE — propose `elevation[3]` values | ESCALATE — propose `elevation[3]` values | `elevation[3]` |

**Typography — CardTitle:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| fontSize | RN-wrapper | `semantic.type.title.md` = 18 | `fontSize = 18.sp` | `.font(.system(size: 18))` | ESCALATE — propose `type.title.md.fontSize = 18` |
| fontWeight | RN-wrapper | 600 | `fontWeight = FontWeight.SemiBold` | `.fontWeight(.semibold)` | ESCALATE — propose `type.title.md.fontWeight = 600` |

**Typography — CardDescription:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| fontSize | RN-wrapper | `semantic.type.body.sm` = 14 | `fontSize = 14.sp` | `.font(.system(size: 14))` | ESCALATE — propose `type.body.sm.fontSize = 14` |
| lineHeight | RN-wrapper | 21 | `lineHeight = 21.sp` | `.lineSpacing(21 - 14)` | ESCALATE — propose `type.body.sm.lineHeight = 21` |
| fontWeight | RN-wrapper | 400 | `fontWeight = FontWeight.Normal` | `.fontWeight(.regular)` | ESCALATE — propose `type.body.sm.fontWeight = 400` |

### Chip

**Source files read:**
- LaneShadow: `react-native/components/ui/chip.tsx`
- Framework: `node_modules/react-native/Libraries/Components/Pressable/Pressable.js`, `node_modules/react-native-paper/src/styles/themes/v3/tokens.tsx`

**Layout — padding:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| paddingHorizontal | RN-wrapper | `space.md` = 12 | `Modifier.padding(horizontal = 12.dp)` | `.padding(.horizontal, 12)` | `space.md` |
| paddingVertical | RN-wrapper | 6 | `Modifier.padding(vertical = 6.dp)` | `.padding(.vertical, 6)` | ESCALATE — propose `space.xxs = 6` |

**Layout — border:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| borderWidth | RN-wrapper | 1 | `Modifier.border(1.dp)` | `.overlay(strokeBorder(lineWidth: 1))` | ESCALATE — propose `borderWidth.thin = 1` |
| borderColor (selected) | RN-wrapper | `color.primary.default` with 40% alpha | `LaneShadowTheme.colors.primary.copy(alpha = 0.4f)` | `theme.colors.primary.opacity(0.4)` | n/a (dynamic) |
| borderColor (unselected) | RN-wrapper | `color.border.default` | `LaneShadowTheme.colors.border` | `theme.colors.border` | `color.border.default` |

**Layout — borderRadius:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| borderRadius | RN-wrapper | `radius.full` = 9999 | `CircleShape` | `Capsule()` | `radius.full` |

**Layout — flex / alignment:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| alignItems | RN-wrapper | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.alignment(.center)` | n/a |
| gap | RN-wrapper | 4 | `Arrangement.spacedBy(4.dp)` | `.spacing(4)` | ESCALATE — propose `space.xxs = 4` |
| alignSelf | RN-wrapper | `'flex-start'` | `Modifier.wrapContentWidth(Alignment.Start)` | `.frame(maxWidth: .infinity, alignment: .leading)` | n/a |

**Visual — backgroundColor (by state):**

| State | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| selected | RN-wrapper | `color.primary.default` with 12% alpha | `LaneShadowTheme.colors.primary.copy(alpha = 0.12f)` | `theme.colors.primary.opacity(0.12)` | n/a (dynamic) |
| pressed | RN-wrapper | `color.muted.default` | `LaneShadowTheme.colors.muted` | `theme.colors.muted` | `color.muted.default` |
| default | RN-wrapper | `'transparent'` | `Color.Transparent` | `.clear` | n/a |

**Visual — textColor (by state):**

| State | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| selected | RN-wrapper | `color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |
| unselected | RN-wrapper | `color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |
| pressed | RN-wrapper | `color.onSurface.muted` | `LaneShadowTheme.colors.onSurfaceMuted` | `theme.colors.onSurfaceMuted` | `color.onSurface.muted` |

**Typography:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| fontSize | RN-wrapper | 13 (from semantic.type.label.sm) | `fontSize = 13.sp` | `.font(.system(size: 13))` | ESCALATE — propose `type.label.sm.fontSize = 13` |
| fontWeight | RN-wrapper | 500 (from semantic.type.label.sm) | `fontWeight = FontWeight.Medium` | `.fontWeight(.medium)` | ESCALATE — propose `type.label.sm.fontWeight = 500` |

**Icon:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| size | RN-wrapper | 16 | `Modifier.size(16.dp)` | `.frame(width: 16, height: 16)` | ESCALATE — propose `iconSize.sm = 16` |
| color (selected) | RN-wrapper | `color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |
| color (unselected) | RN-wrapper | `color.onSurface.muted` | `LaneShadowTheme.colors.onSurfaceMuted` | `theme.colors.onSurfaceMuted` | `color.onSurface.muted` |

### Avatar

**Source files read:**
- LaneShadow: `react-native/components/ui/avatar.tsx`
- Framework: `node_modules/react-native/Libraries/Image/Image.js`, `node_modules/react-native/Libraries/Components/View/View.js`

**Layout — dimensions (by size):**

| Size | Source | Width/Height | Android | iOS | Token |
|---|---|---|---|---|---|
| default | RN-wrapper | 40 | `Modifier.size(40.dp)` | `.frame(width: 40, height: 40)` | ESCALATE — propose `avatarSize.default = 40` |
| lg | RN-wrapper | 64 | `Modifier.size(64.dp)` | `.frame(width: 64, height: 64)` | ESCALATE — propose `avatarSize.lg = 64` |
| xl | RN-wrapper | 96 | `Modifier.size(96.dp)` | `.frame(width: 96, height: 96)` | ESCALATE — propose `avatarSize.xl = 96` |

**Layout — border:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| borderWidth (showBorder) | RN-wrapper | 2 | `Modifier.border(2.dp)` | `.overlay(strokeBorder(lineWidth: 2))` | ESCALATE — propose `borderWidth.medium = 2` |
| borderColor (showBorder) | RN-wrapper | `color.border.default` | `LaneShadowTheme.colors.border` | `theme.colors.border` | `color.border.default` |
| borderWidth (showRing) | RN-wrapper | 2 | `Modifier.border(2.dp)` | `.overlay(strokeBorder(lineWidth: 2))` | ESCALATE — propose `borderWidth.medium = 2` |
| borderColor (showRing) | RN-wrapper | `color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |

**Layout — borderRadius:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| borderRadius | RN-wrapper | `radius.full` = 9999 | `CircleShape` | `Circle()` | `radius.full` |

**Layout — badge positioning:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| position | RN-wrapper | `absolute` | `Modifier.align(Alignment.TopEnd)` | `.overlay(alignment: .topTrailing)` | n/a |
| top | RN-wrapper | -4 | `offset(x = 4.dp, y = (-4).dp)` | `.offset(x: 4, y: -4)` | ESCALATE — propose `space.negative_xs = -4` |
| right | RN-wrapper | -4 | (same as top) | (same as top) | ESCALATE — propose `space.negative_xs = -4` |

**Layout — flex / alignment:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| alignItems | RN-wrapper | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.alignment(.center)` | n/a |
| justifyContent | RN-wrapper | `'center'` | `horizontalArrangement = Arrangement.Center` | n/a (VStack default) | n/a |

**Visual — backgroundColor:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| fallback | RN-wrapper | `color.muted.default` | `LaneShadowTheme.colors.muted` | `theme.colors.muted` | `color.muted.default` |

**Visual — textColor (initials):**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| color | RN-wrapper | `color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |

**Typography — initials (by size):**

| Size | Source | fontSize | Android | iOS | Token |
|---|---|---|---|---|---|
| default | RN-wrapper | 16 | `fontSize = 16.sp` | `.font(.system(size: 16))` | ESCALATE — propose `avatarInitialsSize.default = 16` |
| lg | RN-wrapper | 24 | `fontSize = 24.sp` | `.font(.system(size: 24))` | ESCALATE — propose `avatarInitialsSize.lg = 24` |
| xl | RN-wrapper | 36 | `fontSize = 36.sp` | `.font(.system(size: 36))` | ESCALATE — propose `avatarInitialsSize.xl = 36` |
| fontWeight | RN-wrapper | 500 | `fontWeight = FontWeight.Medium` | `.fontWeight(.medium)` | ESCALATE — propose `avatarInitialsFontWeight = 500` |

**Image — resizeMode:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| resizeMode | RN-wrapper | `'cover'` | `ContentScale.Crop` | `.scaledToFill()` | n/a |

**AvatarBadge — layout:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| borderRadius | RN-wrapper | `radius.full` = 9999 | `CircleShape` | `Capsule()` | `radius.full` |
| minWidth | RN-wrapper | 20 | `Modifier.widthIn(20.dp)` | `.frame(minWidth: 20)` | ESCALATE — propose `badgeSize.sm = 20` |
| minHeight | RN-wrapper | 20 | `Modifier.heightIn(20.dp)` | `.frame(minHeight: 20)` | ESCALATE — propose `badgeSize.sm = 20` |
| paddingHorizontal | RN-wrapper | 4 | `Modifier.padding(horizontal = 4.dp)` | `.padding(.horizontal, 4)` | `space.xs` |
| paddingVertical | RN-wrapper | 2 | `Modifier.padding(vertical = 2.dp)` | `.padding(.vertical, 2)` | ESCALATE — propose `space.xxxs = 2` |

**AvatarBadge — backgroundColor (by variant):**

| Variant | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| default | RN-wrapper | `color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |
| success | RN-wrapper | `color.success.default` | `LaneShadowTheme.colors.success` | `theme.colors.success` | `color.success.default` |
| warning | RN-wrapper | `color.warning.default` | `LaneShadowTheme.colors.warning` | `theme.colors.warning` | `color.warning.default` |
| danger | RN-wrapper | `color.danger.default` | `LaneShadowTheme.colors.danger` | `theme.colors.danger` | `color.danger.default` |

### Skeleton

**Source files read:**
- LaneShadow: `react-native/components/ui/skeleton.tsx`
- Framework: `node_modules/react-native/Libraries/Animated/Animated.js`, `node_modules/react-native/Libraries/Components/View/View.js`

**Layout — dimensions:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| width | RN-wrapper | custom (default: 100%) | `Modifier.fillMaxWidth()` or custom | `.frame(maxWidth: .infinity)` or custom | n/a (caller-provided) |
| height | RN-wrapper | custom (default: 16) | `Modifier.height(16.dp)` or custom | `.frame(height: 16)` or custom | ESCALATE — propose `skeletonHeight.default = 16` |

**Layout — borderRadius (by shape):**

| Shape | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| circle | RN-wrapper | `radius.full` = 9999 | `CircleShape` | `Circle()` | `radius.full` |
| rectangle | RN-wrapper | `radius.none` = 0 | `RectangleShape` | `RoundedRectangle(cornerRadius: 0)` | `radius.none` |
| rounded (default) | RN-wrapper | `radius.md` = 8 | `RoundedCornerShape(8.dp)` | `RoundedRectangle(cornerRadius: 8)` | `radius.md` |

**Visual — backgroundColor:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| color | RN-wrapper | `color.muted.default` | `LaneShadowTheme.colors.muted` | `theme.colors.muted` | `color.muted.default` |

**Animation — pulse:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| type | RN-wrapper | `Animated.loop` + `Animated.sequence` | `infiniteRepeatable` + `keyframes` | `.repeatForever(autoreverses:)` | n/a |
| duration (fade out) | RN-wrapper | 750ms | `duration = 750` | `.animation(.linear(duration: 0.75))` | ESCALATE — propose `animationDuration.slow = 750` |
| duration (fade in) | RN-wrapper | 750ms | (same) | (same) | ESCALATE — propose `animationDuration.slow = 750` |
| opacity range | RN-wrapper | 1 → 0.3 → 1 | `alpha 1f → 0.3f → 1f` | `.opacity 1 → 0.3 → 1` | n/a |
| useNativeDriver | RN-wrapper | true | (default in Compose) | n/a (iOS native) | n/a |

**SkeletonAvatar — dimensions (by size):**

| Size | Source | Width/Height | Android | iOS | Token |
|---|---|---|---|---|---|
| default | RN-wrapper | 40 | `Modifier.size(40.dp)` | `.frame(width: 40, height: 40)` | `avatarSize.default = 40` (from Avatar) |
| lg | RN-wrapper | 64 | `Modifier.size(64.dp)` | `.frame(width: 64, height: 64)` | `avatarSize.lg = 64` (from Avatar) |
| xl | RN-wrapper | 96 | `Modifier.size(96.dp)` | `.frame(width: 96, height: 96)` | `avatarSize.xl = 96` (from Avatar) |

**SkeletonText — dimensions:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| width | RN-wrapper | custom (default: 100%) | `Modifier.fillMaxWidth()` or custom | `.frame(maxWidth: .infinity)` or custom | n/a (caller-provided) |
| height | RN-wrapper | 16 | `Modifier.height(16.dp)` | `.frame(height: 16)` | `skeletonHeight.default = 16` |
| marginTop (multi-line) | RN-wrapper | `space.sm` = 8 | `Modifier.padding(top = 8.dp)` | `.padding(.top, 8)` | `space.sm` |
| lastLineWidth | RN-wrapper | 75% | `Modifier.fillMaxWidth(0.75f)` | `.frame(maxWidth: .infinity).frame(width: 75%)` | n/a (fixed ratio) |

### Progress

**Source files read:**
- LaneShadow: `react-native/components/ui/progress.tsx`
- Framework: `node_modules/react-native/Libraries/Animated/Animated.js`, `node_modules/react-native/Libraries/Components/View/View.js`

**Layout — container:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| width | RN-wrapper | `'100%'` | `Modifier.fillMaxWidth()` | `.frame(maxWidth: .infinity)` | n/a |
| height | RN-wrapper | 16 | `Modifier.height(16.dp)` | `.frame(height: 16)` | ESCALATE — propose `progressHeight = 16` |
| borderRadius | RN-wrapper | `radius.full` = 9999 | `CircleShape` | `Capsule()` | `radius.full` |
| overflow | RN-wrapper | `'hidden'` | `Modifier.clip(RectangleShape)` | `.clipped()` | n/a |

**Layout — indicator (determinate):**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| width | RN-wrapper | animated 0-100% | `Modifier.fillMaxWidth(percentage / 100f)` | `.frame(width: geometry.size.width * percentage / 100)` | n/a (animated) |
| height | RN-wrapper | 16 | `Modifier.height(16.dp)` | `.frame(height: 16)` | ESCALATE — propose `progressHeight = 16` |
| borderRadius | RN-wrapper | `radius.full` = 9999 | `CircleShape` | `Capsule()` | `radius.full` |
| position | RN-wrapper | `'absolute'` + `left: 0` + `top: 0` | `Modifier.align(Alignment.CenterStart)` | `.overlay(alignment: .leading)` | n/a |

**Layout — indicator (indeterminate):**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| width | RN-wrapper | 30% | `Modifier.fillMaxWidth(0.3f)` | `.frame(width: geometry.size.width * 0.3)` | n/a (fixed ratio) |
| height | RN-wrapper | 16 | `Modifier.height(16.dp)` | `.frame(height: 16)` | ESCALATE — propose `progressHeight = 16` |
| borderRadius | RN-wrapper | `radius.full` = 9999 | `CircleShape` | `Capsule()` | `radius.full` |

**Visual — backgroundColor:**

| Element | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| container | RN-wrapper | `color.secondary.default` | `LaneShadowTheme.colors.secondary` | `theme.colors.secondary` | `color.secondary.default` |
| indicator | RN-wrapper | `color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |

**Animation — determinate:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| duration | RN-wrapper | 300ms | `duration = 300` | `.animation(.linear(duration: 0.3))` | ESCALATE — propose `animationDuration.fast = 300` |
| useNativeDriver | RN-wrapper | false | (default in Compose) | n/a | n/a |
| easing | RN-wrapper | timing (linear) | `Easing.Linear` | `.timingFunction(.linear)` | n/a |

**Animation — indeterminate:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| type | RN-wrapper | `Animated.loop` + `Animated.sequence` | `infiniteRepeatable` + `keyframes` | `.repeatForever(autoreverses:)` | n/a |
| duration (translate) | RN-wrapper | 1500ms each direction | `duration = 1500` | `.animation(.linear(duration: 1.5))` | ESCALATE — propose `animationDuration.medium = 1500` |
| translate range | RN-wrapper | -100% → 100% | `offset x: -1f → 1f` | `.offset(x: -geometry.size.width) → .offset(x: geometry.size.width)` | n/a |
| useNativeDriver | RN-wrapper | true | (default in Compose) | n/a (iOS native) | n/a |

### Collapsible

**Source files read:**
- LaneShadow: `react-native/components/ui/collapsible.tsx`
- Framework: `node_modules/react-native/Libraries/Components/TouchableOpacity/TouchableOpacity.js`, `node_modules/react-native/Libraries/Components/View/View.js`

**Layout — header:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| alignItems | RN-wrapper | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.alignment(.center)` | n/a |
| gap | RN-wrapper | `space.sm` = 8 | `Arrangement.spacedBy(8.dp)` | `.spacing(8)` | `space.sm` |

**Layout — content (when open):**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| marginTop | RN-wrapper | `space.sm` = 8 | `Modifier.padding(top = 8.dp)` | `.padding(.top, 8)` | `space.sm` |
| marginLeft | RN-wrapper | `space.xl` = 24 | `Modifier.padding(start = 24.dp)` | `.padding(.leading, 24)` | `space.xl` |

**Visual — chevron:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| icon | RN-wrapper | `chevron-right` | `Icons.AutoMirrored.Filled.KeyboardArrowRight` | `chevron.right` | n/a (system icon) |
| size | RN-wrapper | 18 | `Modifier.size(18.dp)` | `.frame(width: 18, height: 18)` | ESCALATE — propose `iconSize.md = 18` |
| weight | RN-wrapper | `'medium'` | n/a | `.weight(.medium)` | n/a |
| color | RN-wrapper | `color.onSurface.muted` (fallback: onSurface.default) | `LaneShadowTheme.colors.onSurfaceMuted` | `theme.colors.onSurfaceMuted` | `color.onSurface.muted` |
| rotation (closed) | RN-wrapper | 0° | `rotationZ = 0f` | `.rotationEffect(.degrees(0))` | n/a |
| rotation (open) | RN-wrapper | 90° | `rotationZ = 90f` | `.rotationEffect(.degrees(90))` | n/a |

**Typography — title:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| type | RN-wrapper | `defaultSemiBold` | `fontSize = 16.sp, fontWeight = 600` | `.font(.system(size: 16, weight: .semibold))` | ESCALATE — propose `type.label.md.fontSize = 16, fontWeight = 600` |

**Interaction:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| activeOpacity | RN-wrapper | 0.8 | `interactionSource = MutableInteractionSource()` + alpha | `.buttonStyle(.plain)` (system) | n/a |

### FAB

**Source files read:**
- LaneShadow: `react-native/components/ui/fab.tsx`
- Framework: `node_modules/react-native-paper/src/components/FAB/FAB.tsx`, `node_modules/react-native-paper/src/styles/themes/v3/tokens.tsx`

**Layout — sizing:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| size | RN-wrapper | Paper default (56px) | `Modifier.size(56.dp)` | `.frame(width: 56, height: 56)` | ESCALATE — propose `fabSize = 56` |
| iconSize | RN-wrapper | Paper default (24px) | `Modifier.size(24.dp)` | `.frame(width: 24, height: 24)` | ESCALATE — propose `fabIconSize = 24` |

**Layout — borderRadius:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| borderRadius | RN-wrapper | `radius.xl` = 24 | `RoundedCornerShape(24.dp)` | `RoundedRectangle(cornerRadius: 24)` | `radius.xl` |

**Visual — backgroundColor:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| color | RN-wrapper | `color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |

**Visual — textColor:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| color | RN-wrapper | `color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |

**Interaction — press:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| behavior | RN-wrapper | Paper default | `scale press` | `.scaleEffect(pressed ? 0.95 : 1.0)` | n/a (Paper handles) |
| elevation | RN-wrapper | Paper default (6) | `shadow` + `androidElevation` | `.shadow(radius: 6, y: 3)` | ESCALATE — propose `elevation[6]` |

## DESIGN NOTES

- Cover baseline states and typography or icon behavior explicitly so later molecules inherit stable primitives.
- Provide a static capture mode for motion-heavy or animated states so screenshot diffs remain deterministic.
- Avoid unstyled Material defaults and route all styling through the documented Compose theme layer.

## VERIFICATION GATES

- pnpm type-check:native
- ./android/gradlew assembleDebug
- Validate sandbox scenarios for this task in the native sandbox host

## DEPENDENCIES

- UI-001
- UI-002
- UI-003
- UI-007

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
