---
stability: FEATURE_SPEC
last_validated: 2026-04-20
prd_version: 2.0.0
functional_group: SBX
---

# Use Cases: Sandbox Infrastructure (SBX)

The SBX group delivers the story registry, tier aggregation, theme toggling, and mock data pipeline that make every other group visually reviewable. It also owns the terminal legacy-UI deletion pass. The sandbox organization follows the Storywright pattern (`AtomStories.swift`, `MoleculeStories.swift`, etc.) on iOS and its Kotlin analog on Android.

| ID         | Title                                                        | Description |
|------------|--------------------------------------------------------------|-------------|
| UC-SBX-01  | Story registry + tier aggregation                            | Tier-organized story registration pattern on both platforms with a cross-platform parity manifest. |
| UC-SBX-02  | Theme controller + light/dark toggle + args control system   | Shared sandbox theming bridge and argument-control UI for story variants. |
| UC-SBX-03  | Mock data providers + fixtures                               | Hard-coded fixture JSON + typed provider layer whose shapes mirror `convex/` read types. |
| UC-SBX-04  | React Native shell retirement                                | Terminal cleanup pass that deletes the `react-native/` app shell and strips RN-related build config after all V2 screens ship. |
| UC-SBX-05  | Pre-V2 failed-port cleanup (iOS + Android)                   | Early audit-and-delete pass that removes the failed 1:1 RN-to-native port artifacts from `ios/LaneShadow/Views/` and `android/app/src/main/.../ui/` **before** Sprint 2 (ATM) so new V2 atoms have clean ground to land on. |
| UC-SBX-06  | Snapshot testing for design parity                            | Visual regression snapshot suite (`swift-snapshot-testing` iOS + `dropshots` Android) capturing every story in light/dark, with a CI-level cross-platform parity diff report. |

---

## UC-SBX-01 — Story registry + tier aggregation

Mirror Storywright's tier-aggregation pattern in LaneShadow. On iOS, `ios/LaneShadow/Sandbox/LaneShadowSandboxEntry.swift` aggregates `AtomStories.all + MoleculeStories.all + OrganismStories.all + TemplateStories.all + ModifierStories.all + InfrastructureStories.all`. Each tier enum aggregates per-component files (e.g., `AtomButtonStories.all + AtomTypographyStories.all + ...`). Story IDs follow `{tier}.{component}.{variant}` dot notation. Android mirrors the same hierarchy in `android/app/src/debug/java/com/laneshadow/sandbox/` with equivalent aggregation via Kotlin objects. A **parity manifest** at `tokens/sandbox/stories.parity.json` lists every story ID that MUST exist on both platforms; CI fails if any iOS-only or Android-only story ID appears without an explicit allow-list entry.

### Acceptance Criteria
- ☐ Developer can open `ios/LaneShadow/Sandbox/LaneShadowSandboxEntry.swift` and find a `LaneShadowSandboxEntry.makeRootView()` function that aggregates at least six tier enums (Atom, Molecule, Organism, Template, Modifier, Infrastructure) into a single `SandboxRootView(stories:)` call.
- ☐ Developer can open `ios/LaneShadow/Sandbox/Stories/AtomStories.swift` and find it reducing-over per-component story files (e.g., `AtomButtonStories.all + AtomTypographyStories.all`) — no story is declared directly in the tier aggregator.
- ☐ Developer can open the analogous `android/app/src/debug/java/com/laneshadow/sandbox/LaneShadowSandboxEntry.kt` and find equivalent tier aggregation producing the same six-tier `SandboxRoot` wiring on Android.
- ☐ Developer can open any story file (iOS or Android) and find every story's `id` follows `{tier}.{component}.{variant}` dot notation (e.g., `atoms.button.primary`, `molecules.card.with-image`, `screens.feed.default`).
- ☐ Developer can run `pnpm sandbox:parity-check` and the script reads `tokens/sandbox/stories.parity.json`, collects story IDs from both platforms via platform-specific reflection scripts, and exits 0 iff the sets match.
- ☐ Developer can add a new iOS-only story via `stories.parity.json`'s `ios_only: [...]` allow-list and see the parity check pass; the same story fails if added to the main list without an Android counterpart.
- ☐ Developer can launch `/native-sandbox --platform ios` and see every registered iOS story render; `/native-sandbox --platform android` does the same for Android.

---

## UC-SBX-02 — Theme controller + light/dark toggle + args control system

Deliver a shared theme-controller bridge that maps `native-sandbox`'s generic `ThemeMode` into LaneShadow's host `ThemeMode` (light/dark/auto). The controller is exposed inside the sandbox UI as a toggle button in the sandbox top bar; toggling it live re-renders every story. In parallel, deliver `argTypes` control support: `text`, `select`, `toggle`, `number`, `color-token`. The `color-token` control lets a developer preview an atom/molecule with a specific TOK color token swapped in.

### Acceptance Criteria
- ☐ Developer can open `ios/LaneShadow/Sandbox/LaneShadowSandboxThemeController.swift` and find a `LaneShadowSandboxThemeController: ObservableObject, ThemeController` class bridging `NativeSandbox.ThemeMode` into a host `ThemeMode` enum consumed by the theme provider.
- ☐ Developer can open the analogous Kotlin file `android/app/src/debug/java/com/laneshadow/sandbox/LaneShadowSandboxThemeController.kt` and find equivalent bridging for Compose's `isSystemInDarkTheme` and host `ThemeMode`.
- ☐ Developer can toggle light/dark/auto in the sandbox top bar on both platforms and see every currently visible story re-render with the correct theme variant.
- ☐ Developer can open any story with `argTypes` declared and see control widgets in the sandbox inspector pane: text inputs for `.text`, dropdowns for `.select`, toggles for `.toggle`, steppers for `.number`.
- ☐ Developer can declare a `control: .colorToken(group: "color.action")` argType on an atom story, open the story, and see a dropdown listing every token in that group with a live-swap as selection changes.
- ☐ Developer can change any arg control value on both platforms and see the story re-render within one frame (no app relaunch required).
- ☐ Developer can confirm the theme controller changes are scoped to the sandbox preview wrapper only — they do not leak into the main app's theme when the app is run normally outside sandbox mode.

---

## UC-SBX-03 — Mock data providers + fixtures

Deliver a typed mock data layer. Fixture JSON files live at `tokens/sandbox/fixtures/` and are generated into platform-specific typed data (Swift structs + Kotlin data classes) at build time via a small codegen step. Each organism/screen gets a dedicated provider (e.g., `RideDetailMockProvider`, `FeedMockProvider`, `DiscoverMockProvider`, `ProfileMockProvider`). Provider data shapes mirror the read types in `convex/schema.ts`, so future integration is a 1:1 provider swap. No provider performs I/O, network, or disk access.

### Acceptance Criteria
- ☐ Developer can open `tokens/sandbox/fixtures/` and find a set of JSON files — at minimum `routes.fixtures.json`, `users.fixtures.json`, `sessions.fixtures.json`, `navigator-messages.fixtures.json`, `weather-timelines.fixtures.json`, `planning-phases.fixtures.json`, `suggestion-chips.fixtures.json` — each containing 6–12 representative records.
- ☐ Developer can run `pnpm fixtures:generate` and the script produces `tokens/platforms/swift/Sources/LaneShadowMocks/Generated/Fixtures.swift` and `tokens/platforms/kotlin/.../generated/Fixtures.kt` containing typed Swift structs and Kotlin data classes matching the JSON shape.
- ☐ Developer can import `LaneShadowMocks` in Swift and read `Mocks.routes[0]` to get a fully-typed `Route` struct whose fields match the `routes` table read type in `convex/schema.ts` (with Navigator-domain extensions per `11-technical-requirements.md`).
- ☐ Developer can import `LaneShadowMocks` in Kotlin and read the analogous typed value.
- ☐ Developer can open any Navigator screen story (`Screens / Idle`, `Screens / Planning`, `Screens / RouteResults`, `Screens / RouteDetails`, `Screens / Sessions`, `Screens / Error`) on either platform and see it populated from a named `*MockProvider` (`IdleMockProvider`, `PlanningMockProvider`, `RouteResultsMockProvider`, `RouteDetailsMockProvider`, `SessionsMockProvider`, `ErrorMockProvider`) that wraps the generated fixture constants — never inline literals inside the story.
- ☐ Developer can declare a story with `argTypes: [.init("provider", control: .select(options: ["default","empty","overflow","long-copy"]))]` and see the story swap between provider variants live in the sandbox.
- ☐ Developer can verify that no mock provider performs I/O (network, disk, Convex) — each provider is a pure synchronous function returning the fixture records, asserted by a platform test.

---

## UC-SBX-04 — React Native shell retirement

Terminal cleanup pass that runs only after all screens in SCR have passed their human testing gate. Deletes the `react-native/` app shell in its entirety and strips every RN-related reference from shared build config. (Failed-port native-side UI is already gone at this point — UC-SBX-05 ran before Sprint 2.) Leaves `convex/`, `tokens/`, and non-UI native code untouched.

### Acceptance Criteria
- ☐ Developer can run `ls /Users/justinrich/Projects/LaneShadow/react-native` and see "No such file or directory" — the entire RN subtree is deleted.
- ☐ Developer can open `package.json` and see no `react-native`, `expo`, Metro, or RN-related dependencies in `dependencies` or `devDependencies`.
- ☐ Developer can open `lefthook.yml` and see no pre-commit or pre-push hooks referencing `react-native/` paths.
- ☐ Developer can open `Makefile` and see no targets invoking Expo, Metro, or React Native CLI.
- ☐ Developer can open `tsconfig*.json` variants at the repo root and see no `paths`, `include`, or `references` entries pointing into `react-native/`.
- ☐ Developer can run `pnpm type-check:native` after the deletion and see zero type errors.
- ☐ Developer can run `pnpm exec biome check --no-errors-on-unmatched` and see zero lint errors related to removed imports/unused code.
- ☐ Developer can run `xcodebuild -project ios/LaneShadow.xcodeproj -scheme LaneShadow build` and the iOS project builds green without referencing any deleted path.
- ☐ Developer can run `cd android && ./gradlew :app:compileDebugKotlin` and the Android module builds green.
- ☐ Developer can launch `/native-sandbox --platform ios` and `/native-sandbox --platform android` and verify every story from UC-ATM-01 through UC-SCR-06 (including the six Navigator screens) still renders — cleanup did not regress the V2 system.
- ☐ Developer can read the final cleanup commit and see it consists entirely of `D` (deletion) lines in `git diff --stat` (except for minimal edits to `package.json`, `lefthook.yml`, `Makefile`, and `tsconfig*.json` to strip references).

---

## UC-SBX-05 — Pre-V2 failed-port cleanup (iOS + Android)

A preliminary audit-and-delete pass that runs **before Sprint 2 (ATM)**, in parallel with Sprint 1 (TOK). The prior attempt to replace the React Native layer was a 1:1 port that landed partial artifacts in the native trees: partial atoms (Avatar, Badge, BottomSheetInput, Button) under `ios/LaneShadow/Views/` + `ios/LaneShadow/Sandbox/Stories/AtomsStories.swift|MoleculesStories.swift`, and their Kotlin analogs under `android/app/src/main/java/com/laneshadow/ui/` + `android/app/src/debug/java/com/laneshadow/sandbox/`. Those artifacts are **not V2 Navigator** — their APIs, token usage, and story conventions do not match what UC-ATM-01 through UC-SCR-06 require — and they will cause type-collisions, duplicate symbol conflicts, and semantic drift if V2 atoms are authored alongside them. This UC audits what exists, produces a machine-readable cleanup manifest, deletes the failed-port UI artifacts across both platforms, resets sandbox entry/aggregator files to empty-story shells, verifies both platforms build green with zero stories registered, and commits the work as a single "V2 reset" commit. Non-UI code (service layer, Convex wrappers, domain models that mirror Convex types, DI modules, fonts, non-color asset catalogs, build scaffolding) is explicitly preserved. All tasks associated with the retired `sprint-02-ui-component-translation` (UI-001 Avatar, UI-002 Badge, UI-003 BottomSheetInput, UI-004 Button, plus their FIX-* follow-ups on both iOS and Android) must have zero surviving code after this UC completes, regardless of their current "completed" status in the task tracker.

Additionally, this UC sweeps any surviving references to the **retired v1.x social-app surface** (FeedScreen, DiscoverScreen, ProfileScreen, SettingsScreen, Onboarding/SignIn/SignUp screens, LSRideCard, LSProfileHeader, LSMenuPanel, LSMapChatOverlay, LSEphemeralMessage) so Sprint 2 atom work cannot inherit dead references. These components were part of the prior PRD v1.x roster and are fully retired in v2.0.0; no code carrying their names may survive UC-SBX-05.

### Acceptance Criteria
- ☐ Developer can open `.spec/prds/v2/cleanup-manifest.md` and find a complete table of files and directories across `ios/LaneShadow/` and `android/app/` with a rationale column distinguishing `delete: failed-port UI` entries from `keep: non-UI` entries; no file in either UI tree is silently retained.
- ☐ Developer can grep the manifest for every UI-001 through UI-004 task artifact (Avatar, Badge, BottomSheetInput, Button on iOS and Android, plus their tests and story files) and find each listed under `delete`.
- ☐ Developer can run `ls ios/LaneShadow/Views/` after cleanup and see the directory empty or removed — every failed-port SwiftUI view under it is gone.
- ☐ Developer can run `ls ios/LaneShadowTests/Components/UI/` after cleanup and see the corresponding failed-port test files removed; test scaffolding (e.g., base test utilities) that is reusable for V2 is preserved and listed in the manifest as `keep: test utility`.
- ☐ Developer can open `ios/LaneShadow/Sandbox/Stories/AtomsStories.swift` and `MoleculesStories.swift` post-cleanup and find each file reset to an empty aggregator (`static var all: [Story] { [] }`) so the sandbox still compiles but registers zero stories.
- ☐ Developer can run `ls android/app/src/main/java/com/laneshadow/ui/` after cleanup and see only directories/files that are either empty tier scaffolding or explicitly retained non-UI packages per the manifest; all failed-port composables are deleted.
- ☐ Developer can run `ls android/app/src/debug/java/com/laneshadow/sandbox/` after cleanup and see tier aggregator files reset to empty story lists (`val all: List<Story> = emptyList()`).
- ☐ Developer can run `xcodebuild -project ios/LaneShadow.xcodeproj -scheme LaneShadow build` post-cleanup and see the iOS project build green with zero errors and zero warnings introduced by the deletion.
- ☐ Developer can run `cd android && ./gradlew :app:compileDebugKotlin` post-cleanup and see the Android module compile green.
- ☐ Developer can run `pnpm type-check:native` post-cleanup and see zero type errors anywhere in the repo (the failed-port code held no cross-references that V2 work or `convex/` code depends on).
- ☐ Developer can launch `/native-sandbox --platform ios` and `/native-sandbox --platform android` post-cleanup and see the sandbox UI itself boot cleanly with zero stories listed — no crash, no missing-file errors.
- ☐ Developer can read the "V2 reset" commit in `git log` and see it is a single commit whose diff is overwhelmingly `D` (deletion) lines, with only the minimal edits required to reset sandbox entry/aggregator files to empty-story shells.
- ☐ Developer can confirm that `convex/`, `tokens/` (excluding UI-tier outputs), domain model files, service layer wrappers, DI modules, bundled fonts, and launch/icon asset catalogs are **still present** post-cleanup — each explicitly listed as `keep` in the manifest.
- ☐ Product manager can verify that open task tracker entries UI-001 through UI-004 and their FIX-* follow-ups are closed or archived with a reference to this "V2 reset" commit — preventing accidental re-work on deleted code.
- ☐ Developer can `grep -r "LSRideCard\|LSProfileHeader\|LSMenuPanel\|LSMapChatOverlay\|LSEphemeralMessage\|FeedScreen\|DiscoverScreen\|ProfileScreen\|SettingsScreen\|WelcomeScreen\|SignInScreen\|SignUpScreen\|ChatScreen" ios/ android/` post-cleanup and see zero matches — the v1.x social-app surface is fully purged from both native trees.

---

## UC-SBX-06 — Snapshot testing for design parity

A visual regression snapshot test suite that captures every sandbox story's rendered output as a reference image, compares future runs against those references, and provides a cross-platform parity diff. Catches both **intra-platform regressions** (a component changed on iOS) and **inter-platform drift** (iOS and Android diverged from each other).

Uses **`swift-snapshot-testing`** (Point-Free, MIT) on iOS and **`dropshots`** (Dropbox, Apache 2.0) on Android — both are test-scope dependencies only; no runtime footprint. Each platform independently snapshot-tests against its own reference images. A shared `tokens/sandbox/snapshots.parity.json` manifest maps iOS snapshot names to Android snapshot names, enabling a CI-level side-by-side visual diff report.

### Acceptance Criteria

- ☐ Developer can add `swift-snapshot-testing` (SPM) to the iOS test target and run `assertSnapshot(of: storyView, as: .image(on: .iPhoneSe), named: "atoms.button.primary.light")` — first run records reference PNG; second run passes if identical.
- ☐ Developer can add `dropshots` (Gradle plugin) to the Android app module and run `dropshots.assertSnapshot(composable, name = "atoms.button.primary.light")` — same record-then-verify behavior.
- ☐ Every story registered in the sandbox has a paired snapshot test on both platforms that captures it in **light mode** and **dark mode** (2 snapshots per story).
- ☐ Snapshot names follow `{tier}.{component}.{variant}.{theme}` convention, matching story IDs with a `.light` / `.dark` suffix.
- ☐ Reference images are stored in version control: iOS at `ios/LaneShadowTests/__Snapshots__/`, Android at `android/app/src/androidTest/screenshots/`.
- ☐ A `pnpm snapshots:parity-report` script reads `tokens/sandbox/snapshots.parity.json`, collects reference images from both platforms, and generates an HTML side-by-side diff report showing iOS vs Android for every component variant.
- ☐ A `lefthook` pre-push hook runs `pnpm snapshots:check` which verifies: (a) every story ID in `stories.parity.json` has corresponding `.light` and `.dark` snapshot files on both platforms, (b) no orphan snapshot files exist.
- ☐ CI job `snapshot-tests` runs both platform suites (`xcodebuild test` + `gradlew connectedDebugAndroidTest`) and fails the build on any snapshot diff.
- ☐ When a developer intentionally changes a component's visual appearance, they run `pnpm snapshots:record` (or platform-specific `record*` tasks) to update reference images, and commit the updated PNGs alongside the code change.
- ☐ Product manager can open the parity diff report HTML and visually compare every iOS/Android component pair to confirm design consistency.

### Technical Notes

- **iOS**: `swift-snapshot-testing` (Point-Free, v1.12.0+, MIT). Reference images at `ios/LaneShadowTests/__Snapshots__/{TestClassName}/{testName}.png`. Renders on simulator (iPhone SE 2nd gen for consistent size). Deterministic — no animations, no network.
- **Android**: `dropshots` (Dropbox, v0.6.0, Apache 2.0). Reference images at `android/app/src/androidTest/screenshots/{testClassName}/{testName}.png`. Renders on emulator (Pixel 5, same rationale). Configurable diff threshold.
- **Snapshot naming parity**: `snapshots.parity.json` maps iOS snapshot names to Android snapshot names for each component variant + theme mode. Both use the `{tier}.{component}.{variant}.{theme}` string.
- **AI-agent TDD loop**: Agent writes snapshot test → first run auto-records baseline → agent verifies test passes on second run → agent commits both test code and reference PNG.
- **Cross-platform comparison**: CI-level, not test-level. Individual snapshot tests run on each platform independently. The `pnpm snapshots:parity-report` script produces a side-by-side HTML diff report for human review.
- **Timing**: Depends on UC-SBX-01 (story registry) and UC-SBX-02 (theme controller). Lands during Sprint 5 alongside SBX hardening, verifying the full catalog.

