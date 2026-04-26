# UC-SBX-06-ios: Snapshot testing for design parity (`swift-snapshot-testing`) — iOS

**Sprint:** [Sprint 6: Navigator Screens & Sandbox Hardening](SPRINT.md)
**Agent:** swift-implementer
**Estimate:** 480 min
**Type:** FEATURE
**Status:** Backlog
**Priority:** P0
**Effort:** XL
**PRD Refs:** UC-SBX-06

---

## Background

Stand up a deterministic, story-iterating snapshot test target on iOS using `swift-snapshot-testing`; capture every registered story in light + dark on iPhone SE; commit baselines; author the snapshots parity manifest; wire `pnpm snapshots:record:ios` / `pnpm snapshots:check` / `pnpm snapshots:parity-report` scripts.

## Critical Constraints

**MUST:**
- Add `pointfreeco/swift-snapshot-testing` (v1.12.0+, MIT) to the iOS test target via SPM — test-scope only, zero runtime footprint on the app binary.
- Render every story in `LaneShadowStories.all` against the `iPhoneSe` (2nd gen) device profile in BOTH light and dark — produce 2 snapshot images per story.
- Snapshot file names MUST follow `{tier}.{component}.{variant}.{theme}.png` matching story ids with `.light` / `.dark` suffix.
- Reference images MUST be committed to `ios/LaneShadowTests/__Snapshots__/{TestClassName}/` and tracked in git.
- Author `tokens/sandbox/snapshots.parity.json` mapping iOS snapshot names ↔ Android snapshot names so `pnpm snapshots:parity-report` can produce the cross-platform HTML diff.
- Disable animations and freeze any time-dependent state in the snapshot harness — every run MUST be deterministic.

**NEVER:**
- Use mocks for snapshot rendering — render the actual story view via `story.render(story.initialArgs)` exactly as the sandbox does.
- Commit snapshot diffs without verifying them visually first (the HTML report or local Xcode preview).
- Hardcode story lists in the snapshot tests — iterate over `LaneShadowStories.all` so new stories are auto-covered.
- Render against a varying simulator (use ONLY iPhone SE 2nd gen for size determinism).
- Touch any path under `android/**`, `react-native/**`, or `~/Projects/native-sandbox/**`.

**STRICTLY:**
- First test run records baselines; second run MUST verify zero diff against committed PNGs.
- `pnpm snapshots:check` MUST verify every story id in `stories.parity.json#shared` has both `.light` and `.dark` PNGs and zero orphan files exist.
- A `snapshot-tests` CI job runs `xcodebuild test` against the snapshot test target and fails on any diff.

## Specification

**Objective:** Stand up a deterministic, story-iterating snapshot test target on iOS using `swift-snapshot-testing`; capture every registered story in light + dark on iPhone SE; commit baselines; author the snapshots parity manifest; wire scripts.

**Success State:** Running `xcodebuild test -scheme LaneShadow` produces zero snapshot diffs against committed baselines; `pnpm snapshots:check` exits 0; intentional component changes are recorded via `pnpm snapshots:record:ios` and committed as updated PNGs alongside the code; `pnpm snapshots:parity-report` produces an HTML side-by-side iOS/Android diff for every entry in `snapshots.parity.json`.

## Acceptance Criteria

### AC-1 — swift-snapshot-testing SPM dependency added
- **GIVEN** A developer opens `ios/LaneShadow.xcodeproj` (or its package manifest)
- **WHEN** They inspect the iOS test target dependencies
- **THEN** They find `pointfreeco/swift-snapshot-testing` (v1.12.0+) registered as a SPM dependency on the test target only — not on the app target
- **Verify:** Open project; verify package listing; assert app target has zero references to `SnapshotTesting`
- **TDD State:** RED

### AC-2 — Per-story light + dark snapshots
- **GIVEN** The snapshot test class `StorySnapshotTests`
- **WHEN** A developer runs `xcodebuild test ...` for the first time
- **THEN** The test iterates `LaneShadowStories.all`, renders each story on `iPhoneSe` in both `.light` and `.dark` modes via `assertSnapshot(of: previewFor(story, theme:), as: .image(on: .iPhoneSe), named: "\(story.id).\(theme)")`, recording a PNG per (story × theme) pair on first run
- **Verify:** First run records baselines; inspect `ios/LaneShadowTests/__Snapshots__/StorySnapshotTests/` for `{tier}.{component}.{variant}.{light|dark}.png` per story
- **TDD State:** RED

### AC-3 — Second run passes with zero diff
- **GIVEN** Baselines are committed
- **WHEN** A developer runs `xcodebuild test ...` again with no code changes
- **THEN** Every snapshot test passes with zero pixel diff; total snapshot count equals `2 × LaneShadowStories.all.count`
- **Verify:** Run `xcodebuild test`; assert exit 0 and snapshot test count
- **TDD State:** RED

### AC-4 — Snapshots parity manifest authored
- **GIVEN** The repo at `tokens/sandbox/`
- **WHEN** A developer opens `tokens/sandbox/snapshots.parity.json`
- **THEN** They find a JSON object mapping every shared story id to its iOS + Android snapshot name pair using `{tier}.{component}.{variant}.{theme}` strings; the entries cover every id in `stories.parity.json#shared` × `{light, dark}`
- **Verify:** Load `snapshots.parity.json`; assert key set equals `shared × {light, dark}`
- **TDD State:** RED

### AC-5 — snapshots:check guards parity
- **GIVEN** All baselines + manifest are in place
- **WHEN** A developer runs `pnpm snapshots:check`
- **THEN** The script verifies every shared story id has a `.light.png` and `.dark.png` under `ios/LaneShadowTests/__Snapshots__/`, that no orphan PNG exists, and exits 0; deleting any required PNG causes a non-zero exit
- **Verify:** Run `pnpm snapshots:check` → exit 0; rename one PNG; rerun → non-zero; revert
- **TDD State:** RED

### AC-6 — Record-then-commit workflow
- **GIVEN** A developer intentionally changes an atom's visual appearance
- **WHEN** They run `pnpm snapshots:record:ios`
- **THEN** The script invokes the snapshot tests in record mode, regenerates affected PNGs in `ios/LaneShadowTests/__Snapshots__/`, and the developer can commit the updated PNGs alongside the code change in a single commit
- **Verify:** Touch an atom view; run `pnpm snapshots:record:ios`; observe updated PNGs in `git status`; commit and rerun `xcodebuild test` → green
- **TDD State:** RED

### AC-7 — Parity report generates HTML
- **GIVEN** Baselines exist on both platforms
- **WHEN** A developer runs `pnpm snapshots:parity-report`
- **THEN** The script reads `snapshots.parity.json`, collects iOS + Android PNGs, and writes an HTML side-by-side diff at `tokens/sandbox/.reports/snapshots-parity.html` for every shared (story × theme)
- **Verify:** Run `pnpm snapshots:parity-report`; open generated HTML; confirm rows render side-by-side
- **TDD State:** RED

### AC-8 — Determinism guarantees
- **GIVEN** The snapshot harness `SnapshotPreviewHarness`
- **WHEN** A developer reads its setup
- **THEN** It disables UIView animations (`UIView.setAnimationsEnabled(false)`), freezes `Date()`-dependent state via injected clock, sets a fixed system locale (`en_US_POSIX`) and timezone (`UTC`), and asserts no network or disk I/O occurs during render
- **Verify:** Read `SnapshotPreviewHarness.swift`; run snapshot suite three times back-to-back — zero diffs across runs
- **TDD State:** RED

## Test Criteria

| ID | Statement | Maps to AC | Verify | Type |
|----|-----------|------------|--------|------|
| TC-1 | swift-snapshot-testing is on the test target only | AC-1 | Static check: app target object file does not contain SnapshotTesting symbols | static |
| TC-2 | Snapshot count equals 2 × story count | AC-2 | Test asserts `Set(snapshotFileNames).count == 2 * LaneShadowStories.all.count` | unit |
| TC-3 | Second-run snapshot tests all pass | AC-3 | Run `xcodebuild test` twice; second run exit 0 with zero diff lines | integration |
| TC-4 | snapshots.parity.json keys cover shared × {light, dark} | AC-4 | Test loads both manifests; asserts coverage | unit |
| TC-5 | snapshots:check exits non-zero on missing PNG | AC-5 | Shell test: hide one PNG; run `pnpm snapshots:check`; assert non-zero exit | integration |
| TC-6 | Three back-to-back runs produce zero diffs | AC-8 | Run `xcodebuild test` three times; assert each pass | integration |
| TC-7 | snapshots:parity-report writes HTML at expected path | AC-7 | Run `pnpm snapshots:parity-report`; assert file exists at `tokens/sandbox/.reports/snapshots-parity.html` | integration |

## Reading List

- `.spec/prds/v2/09-uc-sbx.md` lines `112-138` — UC-SBX-06 acceptance criteria + Technical Notes — swift-snapshot-testing setup, naming, parity manifest, CI
- `.spec/prds/v2/11-technical-requirements.md` lines `all` — Story / Theme / preview wrapper API used by the snapshot harness
- `concepts/designs.html` lines `all` — REQUIRED READING — visual design source for this task
- `ios/LaneShadow/Sandbox/LaneShadowStories.swift` lines `all` — Story aggregation source iterated by snapshot tests
- `ios/LaneShadow/Sandbox/Theme/LaneShadowSandboxThemeController.swift` lines `all` — Theme controller used to switch light/dark in the harness
- `ios/LaneShadow/Sandbox/Theme/LaneShadowPreviewWrapper.swift` lines `all` — Preview wrapper that must be applied identically to the snapshot render
- `tokens/sandbox/stories.parity.json` lines `all` — Source of shared story ids that snapshots.parity.json must mirror
- `ios/LaneShadowTests/` lines `all` — Existing test target — add `Sandbox/StorySnapshotTests.swift` here
- `lefthook.yml` lines `all` — Add pre-push `snapshots:check` hook entry

## Guardrails

**WRITE-ALLOWED:**
- `ios/LaneShadow.xcodeproj/**` — SPM dependency wiring only
- `ios/LaneShadowTests/Sandbox/StorySnapshotTests.swift`
- `ios/LaneShadowTests/Sandbox/SnapshotPreviewHarness.swift`
- `ios/LaneShadowTests/__Snapshots__/**`
- `tokens/sandbox/snapshots.parity.json`
- `scripts/snapshots/record-ios.sh`
- `scripts/snapshots/check.ts`
- `scripts/snapshots/parity-report.ts`
- `package.json` — script entries for snapshots:record:ios, snapshots:check, snapshots:parity-report
- `lefthook.yml` — pre-push snapshots:check hook

**WRITE-PROHIBITED:**
- `android/**`
- `react-native/**`
- `tokens/platforms/swift/Sources/LaneShadowTheme/**` — read only
- `~/Projects/native-sandbox/**` — external dep
- `ios/LaneShadow/**` — production app code (no app-target deps allowed)

## Code Pattern

**Reference:** Story-iterating snapshot test class + deterministic preview harness; record-on-first-run, verify-on-subsequent; `{tier}.{component}.{variant}.{theme}` naming convention shared across platforms.

**Source:** PRD UC-SBX-06; Point-Free `swift-snapshot-testing` v1.12 idioms; Storywright-derived naming.

**Anti-Pattern:** Per-story handwritten snapshot tests (breaks auto-coverage of new stories); rendering with animations/network enabled; varying simulator profiles between runs; committing baselines without visual review.

## Design

**References:**
- `concepts/designs.html`
- `.spec/prds/v2/09-uc-sbx.md#UC-SBX-06`

**Interaction Notes:**
- Snapshot harness has no interactive UI — it is a test infrastructure surface.
- The HTML parity report renders three columns per row: iOS PNG | diff highlight | Android PNG.

## Verification Gates

| Gate | Command | Expected |
|------|---------|----------|
| lint | `swiftlint --quiet --strict` | Zero warnings, zero errors |
| build | `xcodebuild -project ios/LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' build` | BUILD SUCCEEDED |
| snapshot-record | `pnpm snapshots:record:ios` | Baselines regenerated; PNG count = 2 × story count; idempotent on rerun (zero diff) |
| snapshot-verify | `xcodebuild test -project ios/LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'` | All snapshot tests pass with zero pixel diff against committed baselines |
| snapshot-parity | `pnpm snapshots:check` | Exit 0; every shared story id has light + dark PNGs; zero orphans |
| parity-report | `pnpm snapshots:parity-report` | HTML report written at `tokens/sandbox/.reports/snapshots-parity.html` |
| determinism | `for i in 1 2 3; do xcodebuild test -project ios/LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' || exit 1; done` | Three consecutive passes with zero diffs |

## Agent Assignment

**Agent:** swift-implementer

**Rationale:** Adds `swift-snapshot-testing` SPM dependency, builds the deterministic per-story snapshot harness, records baselines for every story in light + dark, and authors the snapshots parity manifest. swift-implementer owns iOS test target wiring + snapshot baselines.

## Coding Standards

- `brain/docs/swift-rules.md`
- `RULES.md §6 ComponentTier`
- `RULES.md §10 args`

## Dependencies

**Depends On:** UC-SBX-01-ios, UC-SBX-02-ios, UC-SBX-03-ios, UC-SCR-01-ios, UC-SCR-02-ios, UC-SCR-03-ios, UC-SCR-04-ios, UC-SCR-05-ios, UC-SCR-06-ios

**Blocks:** _(none — terminal task)_

## TDD Workflow

1. **RED** — Write StorySnapshotTests + SnapshotPreviewHarness asserting determinism + naming
2. **GREEN** — Add SPM dep; record baselines for all stories × {light,dark}; author parity manifest + scripts
3. **REFACTOR** — Clean harness; ensure idempotent record cycle
4. **VERIFY** — Run all gates including 3× determinism; commit when green

---

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{"requirements":[
{"id":"AC-1","type":"acceptance_criterion","description":"swift-snapshot-testing SPM dep added (test target only)","verify":"project inspect"},
{"id":"AC-2","type":"acceptance_criterion","description":"Per-story light + dark snapshots","verify":"first run records"},
{"id":"AC-3","type":"acceptance_criterion","description":"Second run passes with zero diff","verify":"xcodebuild test"},
{"id":"AC-4","type":"acceptance_criterion","description":"snapshots.parity.json authored","verify":"unit"},
{"id":"AC-5","type":"acceptance_criterion","description":"snapshots:check guards parity","verify":"shell"},
{"id":"AC-6","type":"acceptance_criterion","description":"Record-then-commit workflow","verify":"manual"},
{"id":"AC-7","type":"acceptance_criterion","description":"Parity report generates HTML","verify":"shell"},
{"id":"AC-8","type":"acceptance_criterion","description":"Determinism guarantees","verify":"3x run"},
{"id":"TC-1","type":"test_criterion","description":"Dep on test target only","verify":"static","maps_to_ac":"AC-1"},
{"id":"TC-2","type":"test_criterion","description":"Snapshot count == 2 × stories","verify":"unit","maps_to_ac":"AC-2"},
{"id":"TC-3","type":"test_criterion","description":"Second run zero diff","verify":"integration","maps_to_ac":"AC-3"},
{"id":"TC-4","type":"test_criterion","description":"Manifest covers shared × {light,dark}","verify":"unit","maps_to_ac":"AC-4"},
{"id":"TC-5","type":"test_criterion","description":"check exits non-zero on missing PNG","verify":"integration","maps_to_ac":"AC-5"},
{"id":"TC-6","type":"test_criterion","description":"3x back-to-back zero diffs","verify":"integration","maps_to_ac":"AC-8"},
{"id":"TC-7","type":"test_criterion","description":"parity-report writes HTML","verify":"integration","maps_to_ac":"AC-7"}
]}
-->
