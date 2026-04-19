# UI-078: Android delta organism — `CompletionSummaryCard` (post-ride summary hero with metrics + curvature highlight + polyline preview + save/discard CTAs for UC-REC-05 + UC-NAV-06 + UC-FLOW-08); consumes `Card`, `StatRow`, `RouteThumbnail`, `Button`

**Task ID:** UI-078
**Sprint:** Sprint 2 - UI Component Translation and Fidelity Sandbox
**Assigned To:** kotlin-implementer
**Reviewer:** kotlin-reviewer
**Estimate:** 480 min
**Type:** [FEATURE]
**Status:** Planned
**Phase:** Delta Organism
**Quality Score:** 115/115

---

## BACKGROUND

Sprint 2 translates the React Native baseline into native platform components and sandbox scenarios before rider-facing feature sprints resume. This task covers the `delta-organism` slice for `Android delta organism — CompletionSummaryCard (post-ride summary hero with metrics + curvature highlight + polyline preview + save/discard CTAs for UC-REC-05 + UC-NAV-06 + UC-FLOW-08); consumes Card, StatRow, RouteThumbnail, Button`.

**Objective:** Implement Android delta organism — `CompletionSummaryCard` (post-ride summary hero with metrics + curvature highlight + polyline preview + save/discard CTAs for UC-REC-05 + UC-NAV-06 + UC-FLOW-08); consumes `Card`, `StatRow`, `RouteThumbnail`, `Button` as Jetpack Compose work with parity to the RN baseline, token-only styling, and sandbox coverage.

**Success State:** A reviewer can open the Android sandbox, browse this task's scenarios, and confirm naming, interface, theme, state, accessibility, and layout parity against RN.

## CRITICAL CONSTRAINTS

### MUST
- Implement the listed components or compositions with parity-aligned naming and interfaces: Android delta organism — `CompletionSummaryCard` (post-ride summary hero with metrics + curvature highlight + polyline preview + save/discard CTAs for UC-REC-05 + UC-NAV-06 + UC-FLOW-08); consumes `Card`, `StatRow`, `RouteThumbnail`, `Button`.
- Use only the LaneShadow core theme contract locked by `UI-001`: `tokens/semantic/semantic.tokens.json` as the source of truth, generated `native-theme` outputs as the shared packaging layer, and the platform theme entry points (`LaneShadowTheme` on Android, `.laneShadowTheme()` on iOS) for colors, spacing, typography, radii, elevation, and state styling.
- Register sandbox scenarios for default, interactive, and edge-case states with RN reference labels.
- Treat parity as spec-driven against the delta composition contract when there is no existing RN baseline story.

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
**THEN** The listed components or compositions exist in the correct Android Compose directories with parity-aligned names and signatures: Android delta organism — `CompletionSummaryCard` (post-ride summary hero with metrics + curvature highlight + polyline preview + save/discard CTAs for UC-REC-05 + UC-NAV-06 + UC-FLOW-08); consumes `Card`, `StatRow`, `RouteThumbnail`, `Button`.
**Verify:** `printf "%s\n" "Android delta organism — `CompletionSummaryCard` (post-ride summary hero with metrics + curvature highlight + polyline preview + save/discard CTAs for UC-REC-05 + UC-NAV-06 + UC-FLOW-08); consumes `Card`, `StatRow`, `RouteThumbnail`, `Button`"`

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
| TC-1 | AC-1 | The listed components or compositions exist in the correct Android Compose directories with parity-aligned names and signatures: Android delta organism — `CompletionSummaryCard` (post-ride summary hero with metrics + curvature highlight + polyline preview + save/discard CTAs for UC-REC-05 + UC-NAV-06 + UC-FLOW-08); consumes `Card`, `StatRow`, `RouteThumbnail`, `Button`. | `printf "%s\n" "Android delta organism — `CompletionSummaryCard` (post-ride summary hero with metrics + curvature highlight + polyline preview + save/discard CTAs for UC-REC-05 + UC-NAV-06 + UC-FLOW-08); consumes `Card`, `StatRow`, `RouteThumbnail`, `Button`"` |
| TC-2 | AC-2 | All visuals use the LaneShadow core theme contract from `UI-001` and render correctly in both color modes without hardcoded UI primitives. | `rg -n "Token consumption\|light and dark" .spec/prds/native-rewrite/08d-component-parity-spec.md .spec/prds/native-rewrite/08-design-system.md` |
| TC-3 | AC-3 | Each listed component has deterministic sandbox coverage with RN reference labels and explicit state variants where applicable. | `rg -n "RN reference\|scenario\|interactive states" .spec/prds/native-rewrite/tasks/sprint-02-ui-component-translation/SPRINT.md` |
| TC-4 | AC-4 | Accessibility labels, touch targets, keyboard or safe-area handling, and motion or state parity behave correctly for this component family. | `rg -n "Accessibility\|Keyboard handling\|RTL support\|Animation parity\|State parity" .spec/prds/native-rewrite/08d-component-parity-spec.md` |
| TC-5 | AC-5 | The composition renders using only previously defined platform components, deterministic fixtures, and no backend or auth dependencies. | `rg -n "deterministic\|fixtures\|no auth\|no backend" .spec/prds/native-rewrite/tasks/sprint-02-ui-component-translation/SPRINT.md` |
| TC-6 | ALL | Repo validation gates remain green for the touched workspace when this task is complete. | `pnpm type-check:native && ./android/gradlew assembleDebug` |

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
|---|---|---|---|---|
| CompletionSummaryCard | **RN BASELINE PENDING** — new delta organism for UC-REC-05 + UC-NAV-06 + UC-FLOW-08 | Composes: `Card` (UI-040/UI-041), `StatRow` (UI-052/UI-053), `RouteThumbnail` (UI-062/UI-063), `Button` (UI-016/UI-017); reference: `node_modules/react-native-paper/src/components/Card/Card.tsx` | `android/app/src/main/java/com/laneshadow/ui/organisms/CompletionSummaryCard.kt` | 1 fixed layout × 2 states (loading/loaded) × 2 action modes (save/discard) |

## STYLE PROPERTIES MATRIX

> Exhaustive enumeration of every style property from both sources per `08f-translation-protocol.md`. Columns: Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping. `ESCALATE` = no token covers the value — add a proposed token to DECISIONS.md before implementing.
>
> **Token reference** (from `tokens/semantic/semantic.tokens.json`): space xs=4 sm=8 md=12 lg=16 xl=24 2xl=32 3xl=48 4xl=64; radius none=0 sm=4 md=8 lg=16 xl=24 2xl=32 full=9999; elevation[2] shadowOffset=0/2 shadowOpacity=0.05 shadowRadius=4 androidElevation=2. **Paper labelLarge**: fontFamily=sans-serif-medium, fontWeight=500, fontSize=14, lineHeight=20, letterSpacing=0.1. **Paper labelSmall**: fontFamily=sans-serif-medium, fontWeight=500, fontSize=11, lineHeight=16, letterSpacing=0.5. **semantic.type.label.md**: fontSize=14, lineHeight=20, fontWeight=500. **semantic.type.body.sm**: fontSize=14, lineHeight=21, fontWeight=400.

### CompletionSummaryCard

**Source files read:**
- Task specification: UI-078 task description
- Composed components: Card (UI-040), StatRow (UI-052), RouteThumbnail (UI-062), Button (UI-016)

**Note:** This is a NEW delta organism component. Properties below are derived from the UC-REC-05, UC-NAV-06, and UC-FLOW-08 use cases and task specification. RN baseline implementation is pending.

**Layout — card container:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| cardPadding | Task spec | `space.lg` = 16 | `Modifier.padding(all = 16.dp)` | `.padding(16)` | `space.lg` |
| cardGap | Task spec | `space.lg` = 16 between sections | `Arrangement.spacedBy(16.dp)` | `VStack(spacing: 16)` | `space.lg` |
| cardRadius | Card component | `radius.lg` = 16 | `RoundedCornerShape(16.dp)` | `RoundedRectangle(cornerRadius: 16)` | `radius.lg` |
| cardElevation | Card component | `elevation[2]` | `LaneShadowTheme.elevation.level2` | `theme.elevation[2]` | `elevation[2]` |

**Layout — hero section (curvature highlight):**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| heroHeight | Task spec | `space.5xl` = 80 | `Modifier.height(80.dp)` | `.frame(height: 80)` | ESCALATE — propose `space.5xl = 80` |
| heroPadding | Task spec | `space.md` = 12 | `Modifier.padding(all = 12.dp)` | `.padding(12)` | `space.md` |
| curvatureIconSize | Task spec | 32 | `Modifier.size(32.dp)` | `.frame(width: 32, height: 32)` | `space.2xl` |
| heroGap | Task spec | `space.sm` = 8 | `Arrangement.spacedBy(8.dp)` | `HStack(spacing: 8)` | `space.sm` |

**Layout — metrics section (StatRow composition):**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| metricsGap | Task spec | `space.md` = 12 between stats | `Arrangement.spacedBy(12.dp)` | `HStack(spacing: 12)` | `space.md` |
| statLabelSize | StatRow component | `labelSmall` (11sp) | `MaterialTheme.typography.labelSmall` | `theme.typography.caption` | ESCALATE — propose `type.label.xs = 11` |
| statValueSize | StatRow component | `headlineSmall` (24sp) | `MaterialTheme.typography.headlineSmall` | `theme.typography.title2` | ESCALATE — propose `type.display.sm = 24` |

**Layout — route preview (RouteThumbnail composition):**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| thumbnailHeight | RouteThumbnail component | `space.4xl + space.xl` = 88 | `Modifier.height(88.dp)` | `.frame(height: 88)` | `space.4xl + space.xl` |
| thumbnailRadius | RouteThumbnail component | `radius.md` = 8 | `RoundedCornerShape(8.dp)` | `RoundedRectangle(cornerRadius: 8)` | `radius.md` |
| thumbnailGap | Task spec | `space.md` = 12 | `Arrangement.spacedBy(12.dp)` | `VStack(spacing: 12)` | `space.md` |

**Layout — action buttons (save/discard CTAs):**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| buttonGap | Task spec | `space.md` = 12 | `Arrangement.spacedBy(12.dp)` | `HStack(spacing: 12)` | `space.md` |
| buttonHeight | Button component | `space.2xl + space.sm` = 40 | `Modifier.height(40.dp)` | `.frame(height: 40)` | `space.2xl + space.sm` |
| buttonRadius | Button component | `radius.md` = 8 | `RoundedCornerShape(8.dp)` | `RoundedRectangle(cornerRadius: 8)` | `radius.md` |

**Visual — colors:**

| Element | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| cardBackground | Card component | `color.surface.default` | `LaneShadowTheme.colors.surface` | `theme.colors.surface` | `color.surface.default` |
| curvatureHighlight | Task spec | `color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |
| statLabel | StatRow component | `color.onSurfaceVariant.default` | `LaneShadowTheme.colors.onSurfaceVariant` | `theme.colors.onSurfaceVariant` | `color.onSurfaceVariant.default` |
| statValue | StatRow component | `color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |
| saveButtonBackground | Button component (default) | `color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |
| discardButtonBackground | Button component (outline) | `color.background.default` | `LaneShadowTheme.colors.background` | `theme.colors.background` | `color.background.default` |

**Typography — hero text:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| heroTitleSize | Task spec | `headlineMedium` (18sp) | `MaterialTheme.typography.headlineMedium` | `theme.typography.headline` | ESCALATE — propose `type.display.xs = 18` |
| heroTitleColor | Task spec | `color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |
| heroSubtitleSize | Task spec | `bodyMedium` (14sp) | `MaterialTheme.typography.bodyMedium` | `theme.typography.body` | `type.body.md` |
| heroSubtitleColor | Task spec | `color.onSurface.muted` | `LaneShadowTheme.colors.onSurfaceMuted` | `theme.colors.onSurfaceMuted` | `color.onSurface.muted` |

**States — loading/loaded:**

| State | Source | Visual | Android | iOS | Token |
|---|---|---|---|---|---|
| loading | Task spec | shimmer skeleton with `color.surfaceVariant.default` | `LaneShadowTheme.colors.surfaceVariant` | `theme.colors.surfaceVariant` | `color.surfaceVariant.default` |
| loaded | Task spec | full card render with all sections populated | (see colors above) | (see colors above) | (see colors above) |

**Action modes — save/discard:**

| Mode | Source | Visual | Android | iOS | Token |
|---|---|---|---|---|---|
| save | Task spec | primary button with `color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |
| discard | Task spec | outline button with `color.onSurface.default` text | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |

## DESIGN NOTES

- Treat parity as spec-driven against the delta composition contract when no RN baseline story exists.
- Use fixed cameras, fixed coordinates, and deterministic map visuals for screenshot capture.
- Avoid unstyled Material defaults and route all styling through the documented Compose theme layer.

## VERIFICATION GATES

- pnpm type-check:native
- ./android/gradlew assembleDebug
- Validate sandbox scenarios for this task in the native sandbox host

## DEPENDENCIES

- UI-021
- UI-066

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
