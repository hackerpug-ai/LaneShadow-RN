# UI-075: iOS delta molecule — `PlatformNotificationTemplate` (iOS local notification template for UC-NAV-07 + UC-OFFL-09); UNMutableNotificationContent + variants

**Task ID:** UI-075
**Sprint:** Sprint 2 - UI Component Translation and Fidelity Sandbox
**Assigned To:** swift-implementer
**Reviewer:** swift-reviewer
**Estimate:** 480 min
**Type:** [FEATURE]
**Status:** Planned
**Phase:** Delta Molecule
**Quality Score:** 115/115

---

## BACKGROUND

Sprint 2 translates the React Native baseline into native platform components and sandbox scenarios before rider-facing feature sprints resume. This task covers the `delta-molecule` slice for `iOS delta molecule — PlatformNotificationTemplate (iOS local notification template for UC-NAV-07 + UC-OFFL-09); UNMutableNotificationContent + variants`.

**Objective:** Implement iOS delta molecule — `PlatformNotificationTemplate` (iOS local notification template for UC-NAV-07 + UC-OFFL-09); UNMutableNotificationContent + variants as SwiftUI work with parity to the RN baseline, token-only styling, and sandbox coverage.

**Success State:** A reviewer can open the iOS sandbox, browse this task's scenarios, and confirm naming, interface, theme, state, accessibility, and layout parity against RN.

## CRITICAL CONSTRAINTS

### MUST
- Implement the listed components or compositions with parity-aligned naming and interfaces: iOS delta molecule — `PlatformNotificationTemplate` (iOS local notification template for UC-NAV-07 + UC-OFFL-09); UNMutableNotificationContent + variants.
- Use only the LaneShadow core theme contract locked by `UI-001`: `tokens/semantic/semantic.tokens.json` as the source of truth, generated `native-theme` outputs as the shared packaging layer, and the platform theme entry points (`LaneShadowTheme` on Android, `.laneShadowTheme()` on iOS) for colors, spacing, typography, radii, elevation, and state styling.
- Register sandbox scenarios for default, interactive, and edge-case states with RN reference labels.
- Treat parity as spec-driven against the delta composition contract when there is no existing RN baseline story.

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
**THEN** The listed components or compositions exist in the correct iOS SwiftUI directories with parity-aligned names and signatures: iOS delta molecule — `PlatformNotificationTemplate` (iOS local notification template for UC-NAV-07 + UC-OFFL-09); UNMutableNotificationContent + variants.
**Verify:** `printf "%s\n" "iOS delta molecule — `PlatformNotificationTemplate` (iOS local notification template for UC-NAV-07 + UC-OFFL-09); UNMutableNotificationContent + variants"`

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
| TC-1 | AC-1 | The listed components or compositions exist in the correct iOS SwiftUI directories with parity-aligned names and signatures: iOS delta molecule — `PlatformNotificationTemplate` (iOS local notification template for UC-NAV-07 + UC-OFFL-09); UNMutableNotificationContent + variants. | `printf "%s\n" "iOS delta molecule — `PlatformNotificationTemplate` (iOS local notification template for UC-NAV-07 + UC-OFFL-09); UNMutableNotificationContent + variants"` |
| TC-2 | AC-2 | All visuals use the LaneShadow core theme contract from `UI-001` and render correctly in both color modes without hardcoded UI primitives. | `rg -n "Token consumption\|light and dark" .spec/prds/native-rewrite/08d-component-parity-spec.md .spec/prds/native-rewrite/08-design-system.md` |
| TC-3 | AC-3 | Each listed component has deterministic sandbox coverage with RN reference labels and explicit state variants where applicable. | `rg -n "RN reference\|scenario\|interactive states" .spec/prds/native-rewrite/tasks/sprint-02-ui-component-translation/SPRINT.md` |
| TC-4 | AC-4 | Accessibility labels, touch targets, keyboard or safe-area handling, and motion or state parity behave correctly for this component family. | `rg -n "Accessibility\|Keyboard handling\|RTL support\|Animation parity\|State parity" .spec/prds/native-rewrite/08d-component-parity-spec.md` |
| TC-5 | AC-5 | The composition renders using only previously defined platform components, deterministic fixtures, and no backend or auth dependencies. | `rg -n "deterministic\|fixtures\|no auth\|no backend" .spec/prds/native-rewrite/tasks/sprint-02-ui-component-translation/SPRINT.md` |
| TC-6 | ALL | Repo validation gates remain green for the touched workspace when this task is complete. | `swiftformat --lint ios/LaneShadow --config .swiftformat && xcodebuild -workspace ios/LaneShadow.xcworkspace -scheme LaneShadow -destination "platform=iOS Simulator,name=iPhone 16" test` |

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
| PlatformNotificationTemplate | **RN baseline pending — OS-level notifications render outside React tree** | n/a (NEW component — delta) | `ios/LaneShadow/Views/Molecules/PlatformNotificationTemplate.swift` | 2 variants (navigation/download) × 3 states (active/progress/success) × OS notification integration (UNMutableNotificationContent) |

## STYLE PROPERTIES MATRIX

> Exhaustive enumeration of every style property from both sources per `08f-translation-protocol.md`. Columns: Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping. `ESCALATE` = no token covers the value — add a proposed token to DECISIONS.md before implementing.
>
> **Token reference** (from `tokens/semantic/semantic.tokens.json`): space xs=4 sm=8 md=12 lg=16 xl=24 2xl=32 3xl=48 4xl=64; radius none=0 sm=4 md=8 lg=16 xl=24 2xl=32 full=9999; elevation[2] shadowOffset=0/2 shadowOpacity=0.05 shadowRadius=4 androidElevation=2. **Paper labelLarge**: fontFamily=sans-serif-medium, fontWeight=500, fontSize=14, lineHeight=20, letterSpacing=0.1. **Paper labelSmall**: fontFamily=sans-serif-medium, fontWeight=500, fontSize=11, lineHeight=16, letterSpacing=0.5. **semantic.type.label.md**: fontSize=14, lineHeight=20, fontWeight=500. **semantic.type.body.sm**: fontSize=14, lineHeight=21, fontWeight=400.

### PlatformNotificationTemplate

**Source files read:**
- LaneShadow: **RN baseline pending — OS-level notifications render outside React tree**
- Framework: n/a (NEW component — delta)
- Use cases: `.spec/prds/native-rewrite/09-uc-navigation.md` (UC-NAV-07: Background Navigation), `.spec/prds/native-rewrite/11-uc-offline.md` (UC-OFFL-09: Background Download)

> **Note**: This is a **NEW delta component** — no RN baseline exists because OS-level notifications render outside the React Native view tree. Properties are derived from the task description ("cross-platform OS notification template for UC-NAV-07 + UC-OFFL-09; iOS background task notification") and UC-NAV-07/UC-OFFL-09 which specify platform-notification content compositions for navigation and download progress.

**Layout — notification (UNMutableNotificationContent):**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|---|
| sound | Task spec | `default` | `setSound(...)` | `.sound = .default` | n/a |
| badge | Task spec | `1` (show app badge) | `setNumber(1)` | `.badge = 1` | n/a |
| categoryIdentifier | Task spec | `"navigation"` or `"download"` | `setCategory("navigation")` | `.categoryIdentifier = "navigation"` | n/a |
| threadIdentifier | Task spec | `unique per session` | `setGroup("nav_session_123")` | `.threadIdentifier = "nav_session_123"` | n/a |
| targetContentIdentifier | Task spec | `session ID` | n/a | `.targetContentIdentifier = "session_123"` | n/a |

**Layout — navigation variant (UC-NAV-07):**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|---|
| title | Task spec | `"Navigating to {destination}"` | `setContentTitle("Navigating to $destination")` | `.title = "Navigating to \(destination)"` | n/a |
| body | Task spec | `"{distance} remaining • {eta}"` | `setContentText("$distance remaining • $eta")` | `.body = "\(distance) remaining • \(eta)"` | n/a |
| subtitle | Task spec | `"LaneShadow Navigation"` | `setSubText("LaneShadow Navigation")` | `.subtitle = "LaneShadow Navigation"` | n/a |
| category | Task spec | `.navigation` | `setCategory(Notification.CATEGORY_NAVIGATION)` | `.category = .navigation` | n/a |
| sound | Task spec | `default` | n/a | `.sound = .defaultCritical` | n/a |

**Layout — download variant (UC-OFFL-09):**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|---|
| title | Task spec | `"Downloading {regionName}"` | `setContentTitle("Downloading $regionName")` | `.title = "Downloading \(regionName)"` | n/a |
| body | Task spec | `"{progress}% • {sizeMB} MB of {totalMB} MB"` | `setContentText("$progress% • $sizeMB MB of $totalMB MB")` | `.body = "\(progress)% • \(sizeMB) MB of \(totalMB) MB"` | n/a |
| subtitle | Task spec | `"LaneShadow Offline Maps"` | `setSubText("LaneShadow Offline Maps")` | `.subtitle = "LaneShadow Offline Maps"` | n/a |
| category | Task spec | `.progress` | `setCategory(Notification.CATEGORY_PROGRESS)` | `.category = .progress` | n/a |
| sound | Task spec | `none` (progress is silent) | n/a | `.sound = .none` | n/a |

**Visual — colors (via UNNotificationContent extension):**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|---|
| backgroundColor | Task spec | `color.surface.default` | `<item name="android:background">@color/surface</item>` | n/a | `color.surface.default` |
| titleColor | Task spec | `color.onSurface.default` | `TextView textColor="@color/onSurface"` | n/a | `color.onSurface.default` |
| bodyColor | Task spec | `color.onSurface.muted` | `TextView textColor="@color/onSurfaceMuted"` | n/a | `color.onSurface.muted` |
| iconColor | Task spec | `color.primary.default` | `Icon tint="@color/primary"` | n/a | `color.primary.default` |

**Typography — title:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|---|
| fontSize | Paper labelLarge | 14 | `14sp` (in XML) | n/a | `type.label.md.fontSize` |
| fontWeight | Paper labelLarge | `'500'` | `android:textStyle="bold"` | n/a | `type.label.md.fontWeight` |
| color | Task spec | `color.onSurface.default` | `@color/onSurface` | n/a | `color.onSurface.default` |

**Typography — body:**

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
| pauseAction | Task spec | `"Pause"` | `addAction(Action(..., "Pause", ...))` | n/a | n/a |
| resumeAction | Task spec | `"Resume"` | `addAction(Action(..., "Resume", ...))` | n/a | n/a |

**Interaction:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|---|
| contentIntent | Task spec | `tap opens app` | `setContentIntent(PendingIntent...)` | n/a | n/a |
| notificationId | Task spec | `unique per session` | `NOTIFICATION_ID_NAVIGATION = 1` | n/a | n/a |
| categoryId | Task spec | `"laneshadow_navigation"` | `createNotificationChannel("laneshadow_navigation", ...)` | `UNUserNotificationCenterDelegate` | n/a |

**State — props (navigation):**

| State | Source | Type | Android | iOS | Token |
|---|---|---|---|---|---|---|
| destination | Task spec | `String` | `val destination: String` | `var destination: String` | n/a |
| distanceRemaining | Task spec | `String` | `val distanceRemaining: String` | `var distanceRemaining: String` | n/a |
| eta | Task spec | `String` | `val eta: String` | `var eta: String` | n/a |

**State — props (download):**

| State | Source | Type | Android | iOS | Token |
|---|---|---|---|---|---|---|
| regionName | Task spec | `String` | `val regionName: String` | `var regionName: String` | n/a |
| progress | Task spec | `Int` (0-100) | `val progress: Int` | `var progress: Int` | n/a |
| sizeMB | Task spec | `Int` | `val sizeMB: Int` | `var sizeMB: Int` | n/a |
| totalMB | Task spec | `Int` | `val totalMB: Int` | `var totalMB: Int` | n/a |

## DESIGN NOTES

- Treat parity as spec-driven against the delta composition contract when no RN baseline story exists.
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
