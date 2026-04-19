# UI-074: Android delta molecule — `PlatformNotificationTemplate` (cross-platform OS notification template for UC-NAV-07 + UC-OFFL-09); Android foreground service notification builder + variants

**Task ID:** UI-074
**Sprint:** Sprint 2 - UI Component Translation and Fidelity Sandbox
**Assigned To:** kotlin-implementer
**Reviewer:** kotlin-reviewer
**Estimate:** 480 min
**Type:** [FEATURE]
**Status:** Planned
**Phase:** Delta Molecule
**Quality Score:** 115/115

---

## BACKGROUND

Sprint 2 translates the React Native baseline into native platform components and sandbox scenarios before rider-facing feature sprints resume. This task covers the `delta-molecule` slice for `Android delta molecule — PlatformNotificationTemplate (cross-platform OS notification template for UC-NAV-07 + UC-OFFL-09); Android foreground service notification builder + variants`.

**Objective:** Implement Android delta molecule — `PlatformNotificationTemplate` (cross-platform OS notification template for UC-NAV-07 + UC-OFFL-09); Android foreground service notification builder + variants as Jetpack Compose work with parity to the RN baseline, token-only styling, and sandbox coverage.

**Success State:** A reviewer can open the Android sandbox, browse this task's scenarios, and confirm naming, interface, theme, state, accessibility, and layout parity against RN.

## CRITICAL CONSTRAINTS

### MUST
- Implement the listed components or compositions with parity-aligned naming and interfaces: Android delta molecule — `PlatformNotificationTemplate` (cross-platform OS notification template for UC-NAV-07 + UC-OFFL-09); Android foreground service notification builder + variants.
- Use only the LaneShadow core theme contract locked by `UI-001`: `tokens/semantic/semantic.tokens.json` as the source of truth, generated `native-theme` outputs as the shared packaging layer, and the platform theme entry points (`LaneShadowTheme` on Android, `.laneShadowTheme()` on iOS) for colors, spacing, typography, radii, elevation, and state styling.
- Register sandbox scenarios for default, interactive, and edge-case states with RN reference labels.
- Treat parity as spec-driven against the delta composition contract when there is no existing RN baseline story.

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
**THEN** The listed components or compositions exist in the correct Android Compose directories with parity-aligned names and signatures: Android delta molecule — `PlatformNotificationTemplate` (cross-platform OS notification template for UC-NAV-07 + UC-OFFL-09); Android foreground service notification builder + variants.
**Verify:** `printf "%s\n" "Android delta molecule — `PlatformNotificationTemplate` (cross-platform OS notification template for UC-NAV-07 + UC-OFFL-09); Android foreground service notification builder + variants"`

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
| TC-1 | AC-1 | The listed components or compositions exist in the correct Android Compose directories with parity-aligned names and signatures: Android delta molecule — `PlatformNotificationTemplate` (cross-platform OS notification template for UC-NAV-07 + UC-OFFL-09); Android foreground service notification builder + variants. | `printf "%s\n" "Android delta molecule — `PlatformNotificationTemplate` (cross-platform OS notification template for UC-NAV-07 + UC-OFFL-09); Android foreground service notification builder + variants"` |
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
| PlatformNotificationTemplate | **RN baseline pending — OS-level notifications render outside React tree** | n/a (NEW component — delta) | `android/app/src/main/java/com/laneshadow/ui/molecules/PlatformNotificationTemplate.kt` | 2 variants (navigation/download) × 3 states (active/progress/success) × OS notification integration (NotificationCompat.Builder) |

## STYLE PROPERTIES MATRIX

> Exhaustive enumeration of every style property from both sources per `08f-translation-protocol.md`. Columns: Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping. `ESCALATE` = no token covers the value — add a proposed token to DECISIONS.md before implementing.
>
> **Token reference** (from `tokens/semantic/semantic.tokens.json`): space xs=4 sm=8 md=12 lg=16 xl=24 2xl=32 3xl=48 4xl=64; radius none=0 sm=4 md=8 lg=16 xl=24 2xl=32 full=9999; elevation[2] shadowOffset=0/2 shadowOpacity=0.05 shadowRadius=4 androidElevation=2. **Paper labelLarge**: fontFamily=sans-serif-medium, fontWeight=500, fontSize=14, lineHeight=20, letterSpacing=0.1. **Paper labelSmall**: fontFamily=sans-serif-medium, fontWeight=500, fontSize=11, lineHeight=16, letterSpacing=0.5. **semantic.type.label.md**: fontSize=14, lineHeight=20, fontWeight=500. **semantic.type.body.sm**: fontSize=14, lineHeight=21, fontWeight=400.

### PlatformNotificationTemplate

**Source files read:**
- LaneShadow: **RN baseline pending — OS-level notifications render outside React tree**
- Framework: n/a (NEW component — delta)
- Use cases: `.spec/prds/native-rewrite/09-uc-navigation.md` (UC-NAV-07: Background Navigation), `.spec/prds/native-rewrite/11-uc-offline.md` (UC-OFFL-09: Background Download)

> **Note**: This is a **NEW delta component** — no RN baseline exists because OS-level notifications render outside the React Native view tree. Properties are derived from the task description ("cross-platform OS notification template for UC-NAV-07 + UC-OFFL-09; Android foreground service notification builder + variants") and UC-NAV-07/UC-OFFL-09 which specify platform-notification content compositions for navigation and download progress.

**Layout — notification (Android NotificationCompat):**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|---|
| smallIcon | Task spec | `app icon` | `setSmallIcon(R.drawable.ic_notification)` | `UNNotificationIcon` | n/a |
| largeIcon | Task spec | `app logo` | `setLargeIcon(BitmapFactory.decodeResource(...))` | `UNNotificationAttachment` | n/a |
| contentTitle | Task spec | `primary text` | `setContentTitle(title)` | `UNMutableNotificationContent().title = ...` | n/a |
| contentText | Task spec | `secondary text` | `setContentText(text)` | `.body = ...` | n/a |
| priority | Task spec | `PRIORITY_HIGH` | `setPriority(NotificationCompat.PRIORITY_HIGH)` | `.category = .navigation` | n/a |
| ongoing | Task spec | `true` (navigation) / `false` (download complete) | `setOngoing(true)` | n/a | n/a |
| autoCancel | Task spec | `false` (don't dismiss on tap) | `setAutoCancel(false)` | n/a | n/a |

**Layout — navigation variant (UC-NAV-07):**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|---|
| contentTitle | Task spec | `"Navigating to {destination}"` | `setContentTitle("Navigating to $destination")` | `.title = "Navigating to \(destination)"` | n/a |
| contentText | Task spec | `"{distance} remaining • {eta}"` | `setContentText("$distance remaining • $eta")` | `.body = "\(distance) remaining • \(eta)"` | n/a |
| subText | Task spec | `"LaneShadow Navigation"` | `setSubText("LaneShadow Navigation")` | `.subtitle = "LaneShadow Navigation"` | n/a |
| category | Task spec | `"navigation"` | `setCategory(Notification.CATEGORY_NAVIGATION)` | `.category = .navigation` | n/a |
| foregroundService | Task spec | `true` | `setForegroundServiceBehavior(Notification.FOREGROUND_SERVICE_IMMEDIATE)` | n/a | n/a |

**Layout — download variant (UC-OFFL-09):**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|---|
| contentTitle | Task spec | `"Downloading {regionName}"` | `setContentTitle("Downloading $regionName")` | `.title = "Downloading \(regionName)"` | n/a |
| contentText | Task spec | `"{progress}% • {sizeMB} MB of {totalMB} MB"` | `setContentText("$progress% • $sizeMB MB of $totalMB MB")` | `.body = "\(progress)% • \(sizeMB) MB of \(totalMB) MB"` | n/a |
| subText | Task spec | `"LaneShadow Offline Maps"` | `setSubText("LaneShadow Offline Maps")` | `.subtitle = "LaneShadow Offline Maps"` | n/a |
| category | Task spec | `"progress"` | `setCategory(Notification.CATEGORY_PROGRESS)` | `.category = .progress` | n/a |
| progress | Task spec | `0-100` | `setProgress(max, current, indeterminate=false)` | n/a | n/a |
| progressMax | Task spec | `100` | `setProgress(100, current, ...)` | n/a | n/a |

**Visual — colors (via notification drawable):**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|---|
| backgroundColor | Task spec | `color.surface.default` | `<item name="android:background">@color/surface</item>` | `.category = .navigation` | `color.surface.default` |
| titleColor | Task spec | `color.onSurface.default` | `TextView textColor="@color/onSurface"` | n/a | `color.onSurface.default` |
| textColor | Task spec | `color.onSurface.muted` | `TextView textColor="@color/onSurfaceMuted"` | n/a | `color.onSurface.muted` |
| iconColor | Task spec | `color.primary.default` | `Icon tint="@color/primary"` | n/a | `color.primary.default` |

**Typography — title:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|---|
| fontSize | Paper labelLarge | 14 | `14sp` (in XML) | n/a | `type.label.md.fontSize` |
| fontWeight | Paper labelLarge | `'500'` | `android:textStyle="bold"` | n/a | `type.label.md.fontWeight` |
| color | Task spec | `color.onSurface.default` | `@color/onSurface` | n/a | `color.onSurface.default` |

**Typography — text:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|---|
| fontSize | Paper labelSmall | 11 | `11sp` (in XML) | n/a | ESCALATE — `type.label.sm.fontSize = 11` |
| fontWeight | Paper labelSmall | `'400'` | `android:textStyle="normal"` | n/a | `type.label.sm.fontWeight` |
| color | Task spec | `color.onSurface.muted` | `@color/onSurfaceMuted` | n/a | `color.onSurface.muted` |

**Action buttons (navigation variant):**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|---|
| stopAction | Task spec | `"Stop Navigation"` | `addAction(Action(..., "Stop Navigation", ...))` | `.categoryActionIdentifiers = [.stopNavigation]` | n/a |
| pauseAction | Task spec | `"Pause" (optional)` | `addAction(Action(..., "Pause", ...))` | n/a | n/a |
| resumeAction | Task spec | `"Resume" (optional)` | `addAction(Action(..., "Resume", ...))` | n/a | n/a |

**Action buttons (download variant):**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|---|
| cancelAction | Task spec | `"Cancel"` | `addAction(Action(..., "Cancel", ...))` | `.categoryActionIdentifiers = [.cancel]` | n/a |
| pauseAction | Task spec | `"Pause"` | `addAction(Action(..., "Pause", ...)) | n/a | n/a |
| resumeAction | Task spec | `"Resume"` | `addAction(Action(..., "Resume", ...))` | n/a | n/a |

**Interaction:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|---|
| contentIntent | Task spec | `tap opens app` | `setContentIntent(PendingIntent...)` | n/a | n/a |
| deleteIntent | Task spec | `swipe dismisses` | `setDeleteIntent(PendingIntent...)` | n/a | n/a |
| notificationId | Task spec | `unique per session` | `NOTIFICATION_ID_NAVIGATION = 1` | n/a | n/a |
| channelId | Task spec | `"laneshadow_navigation"` | `createNotificationChannel("laneshadow_navigation", ...)` | n/a | n/a |

**State — props (navigation):**

| State | Source | Type | Android | iOS | Token |
|---|---|---|---|---|---|---|
| destination | Task spec | `String` | `val destination: String` | n/a | n/a |
| distanceRemaining | Task spec | `String` | `val distanceRemaining: String` | n/a | n/a |
| eta | Task spec | `String` | `val eta: String` | n/a | n/a |

**State — props (download):**

| State | Source | Type | Android | iOS | Token |
|---|---|---|---|---|---|---|
| regionName | Task spec | `String` | `val regionName: String` | n/a | n/a |
| progress | Task spec | `Int` (0-100) | `val progress: Int` | n/a | n/a |
| sizeMB | Task spec | `Int` | `val sizeMB: Int` | n/a | n/a |
| totalMB | Task spec | `Int` | `val totalMB: Int` | n/a | n/a |

## DESIGN NOTES

- Treat parity as spec-driven against the delta composition contract when no RN baseline story exists.
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
