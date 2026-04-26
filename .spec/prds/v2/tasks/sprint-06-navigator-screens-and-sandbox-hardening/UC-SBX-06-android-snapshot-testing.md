# UC-SBX-06-android: Snapshot testing for design parity (`dropshots`) — Android

**Sprint:** [Sprint 6: Navigator Screens & Sandbox Hardening](SPRINT.md)
**Agent:** kotlin-implementer
**Estimate:** 480 min
**Type:** FEATURE
**Status:** Backlog
**Priority:** P0
**Effort:** XL
**PRD Refs:** UC-SBX-06

---

## Background

Stand up the Android visual-regression snapshot suite using `dropshots`, capture light + dark baselines for every sandbox story, and integrate with the cross-platform parity manifest so CI fails on any visual drift or coverage gap.

## Critical Constraints

**MUST:**
- Add `dropshots` (Dropbox, v0.6.0+, Apache 2.0) as a test-scope Gradle plugin in `android/app/build.gradle.kts` — connectedDebugAndroidTest configuration only.
- Author paired light + dark snapshot tests for every story registered in the Android sandbox — naming `{tier}.{component}.{variant}.{theme}` matching the dotted story ID.
- Render against the Pixel 5 emulator profile for size determinism; disable animations; freeze time/randomness.
- Store reference PNGs at `android/app/src/androidTest/screenshots/{TestClassName}/{testName}.png`; commit alongside test code.
- Contribute Android snapshot names to `tokens/sandbox/snapshots.parity.json` so `pnpm snapshots:check` and `pnpm snapshots:parity-report` succeed.

**NEVER:**
- Include dropshots in the `main` or `release` build configurations — test scope only.
- Use non-deterministic content in stories (no `Date()`, no `Random`, no live data) — providers are already pure but tests must additionally pin clock/locale.
- Bypass a snapshot diff by lowering the dropshots threshold below the project default without explicit approval.
- Commit `_failure_*.png` artifacts — diff outputs are gitignored.
- Add Android-only or iOS-only snapshots without an explicit allow-list entry in `snapshots.parity.json`.

**STRICTLY:**
- Follow TDD: write snapshot test → first run records baseline → second run verifies green → commit test + PNG together.
- Run on a single emulator profile (Pixel 5, API 34) in CI to guarantee identical pixel output.
- Enforce 1:1 naming parity — every Android snapshot has a matching iOS snapshot ID (modulo allow-list).

## Specification

**Objective:** Stand up the Android visual-regression snapshot suite using `dropshots`, capture light + dark baselines for every sandbox story, and integrate with the cross-platform parity manifest so CI fails on any visual drift or coverage gap.

**Success State:** `./gradlew :app:connectedDebugAndroidTest` runs the snapshot suite green; `pnpm snapshots:check` confirms every story has `.light` + `.dark` PNGs with no orphans; `pnpm snapshots:parity-report` produces an HTML side-by-side diff covering every component variant.

## Acceptance Criteria

### AC-1 — Dropshots integration
- **GIVEN** Developer opens `android/app/build.gradle.kts`
- **WHEN** They inspect the plugins + test dependencies
- **THEN** They find the dropshots Gradle plugin applied with a test-scope dependency on dropshots runtime; release/main builds do not link it
- **Verify:** `./gradlew :app:dependencies --configuration releaseRuntimeClasspath` shows no dropshots; `:app:assembleRelease` succeeds
- **TDD State:** RED

### AC-2 — Paired light + dark snapshot per story
- **GIVEN** Developer runs `./gradlew :app:connectedDebugAndroidTest`
- **WHEN** The snapshot suite executes
- **THEN** For every story registered in `LaneShadowSandboxEntry.kt`, two test cases execute (`*_light` + `*_dark`); both pass against committed reference PNGs
- **Verify:** Test report shows test count = 2 × story count; all green
- **TDD State:** RED

### AC-3 — Naming convention
- **GIVEN** Developer inspects `android/app/src/androidTest/screenshots/`
- **WHEN** They list reference PNGs
- **THEN** Every PNG filename matches `{tier}.{component}.{variant}.{theme}.png` where `{theme}` is `light` or `dark`
- **Verify:** Bash regex check over filenames returns zero violations
- **TDD State:** RED

### AC-4 — Record cycle for intentional changes
- **GIVEN** Developer changes a component visually and runs `pnpm snapshots:record:android`
- **WHEN** The script invokes the dropshots record task on the emulator
- **THEN** Updated reference PNGs are written; subsequent `pnpm snapshots:check` passes; the change can be committed alongside the code change
- **Verify:** Manual smoke + a fixture test demonstrating the record→verify loop
- **TDD State:** RED

### AC-5 — Parity manifest + check passes
- **GIVEN** Developer runs `pnpm snapshots:check` (also wired to lefthook pre-push)
- **WHEN** The script reads `tokens/sandbox/snapshots.parity.json` and walks Android + iOS snapshot directories
- **THEN** Exit 0 — every story ID has both `.light` and `.dark` snapshots on both platforms; no orphan PNGs exist
- **Verify:** `pnpm snapshots:check` exits 0
- **TDD State:** RED

### AC-6 — Cross-platform parity report
- **GIVEN** Developer runs `pnpm snapshots:parity-report`
- **WHEN** The script generates the HTML side-by-side diff
- **THEN** The report shows every iOS/Android snapshot pair side-by-side, grouped by component variant + theme; opens in a browser for design QA
- **Verify:** Report HTML produced; manual visual inspection shows expected component grid
- **TDD State:** RED

## Test Criteria

| ID | Statement | Maps to AC | Verify | Type |
|----|-----------|------------|--------|------|
| TC-1 | Dropshots is absent from release classpath | AC-1 | `./gradlew :app:dependencies --configuration releaseRuntimeClasspath \| grep dropshots` empty | build |
| TC-2 | Snapshot suite test count equals 2 × registered story count | AC-2 | Compare connectedDebugAndroidTest report count to story registry count via JUnit listener | instrumented |
| TC-3 | Every snapshot PNG matches `{tier}.{component}.{variant}.{theme}.png` naming | AC-3 | Bash regression over screenshots dir | ci-script |
| TC-4 | First run records baseline; second run passes byte-equal | AC-4 | Two-pass instrumented test on a fixture story | instrumented |
| TC-5 | snapshots:check enforces parity + no orphans | AC-5 | `pnpm snapshots:check` exit 0 | integration |
| TC-6 | Animations and time are deterministic in tests | AC-2, AC-4 | Inspect test base class for animation-disable + clock-pin setup | unit |

## Reading List

- `concepts/designs.html` lines `1-end` — REQUIRED READING — visual design source for this task
- `.spec/prds/v2/09-uc-sbx.md` lines `112-138` — UC-SBX-06 acceptance criteria + technical notes verbatim
- `.spec/prds/v2/11-technical-requirements.md` lines `30-35` — Snapshot reference paths + parity manifest contracts
- `tokens/sandbox/snapshots.parity.json` lines `1-end` — Snapshot name parity manifest
- `tokens/sandbox/stories.parity.json` lines `1-end` — Source-of-truth story IDs that snapshots must cover
- `android/app/build.gradle.kts` lines `1-end` — Where to add the dropshots plugin + test dep
- `https://github.com/dropbox/dropshots` lines `README` — dropshots API + record-then-verify workflow

## Guardrails

**WRITE-ALLOWED:**
- `android/app/build.gradle.kts` (add dropshots plugin + testImplementation)
- `android/app/src/androidTest/java/com/laneshadow/sandbox/snapshots/**` (test classes)
- `android/app/src/androidTest/screenshots/**` (committed reference PNGs)
- `tokens/sandbox/snapshots.parity.json` (Android entries)
- `.gitignore` additions for `_failure_*.png` outputs

**WRITE-PROHIBITED:**
- `ios/**`
- `react-native/**`
- `tokens/platforms/kotlin/src/main/java/com/laneshadow/theme/generated/**` — read only
- native-sandbox library — external dep
- `android/app/src/main/**` — production code untouched in this task

## Code Pattern

**Reference:** Per-story instrumented test class extends a `SandboxSnapshotTestBase` that disables animations, pins clock/locale, configures the LaneShadow theme controller for the requested theme, renders the Story via `setContent { SandboxRoot(stories = listOf(story)) }`, and calls `dropshots.assertSnapshot(name = "{tier}.{component}.{variant}.{theme}")`.

**Source:** `.spec/prds/v2/09-uc-sbx.md#UC-SBX-06`

**Anti-Pattern:** Hand-written ad-hoc render harnesses, animations enabled during snapshots, multi-emulator runs producing diverging PNGs, or skipping the parity manifest update.

## Design

**References:**
- `concepts/designs.html`
- `.spec/prds/v2/09-uc-sbx.md#UC-SBX-06`

**Interaction Notes:**
- No UI surface — this is test-suite infrastructure.
- Output surface is the parity-report HTML for human design QA.

## Verification Gates

| Gate | Command | Expected |
|------|---------|----------|
| lint | `cd android && ./gradlew detekt` | 0 violations |
| build | `cd android && ./gradlew :app:compileDebugKotlin` | BUILD SUCCESSFUL |
| release-build | `cd android && ./gradlew :app:assembleRelease` | BUILD SUCCESSFUL with no dropshots in classpath |
| snapshot-record | `pnpm snapshots:record:android` | Reference PNGs written for every story × {light,dark} |
| snapshot-verify | `cd android && ./gradlew :app:connectedDebugAndroidTest` | All snapshot tests pass byte-equal |
| snapshot-parity-check | `pnpm snapshots:check` | Exit 0 — full parity, no orphans |
| snapshot-parity-report | `pnpm snapshots:parity-report` | HTML report produced |

## Agent Assignment

**Agent:** kotlin-implementer

**Rationale:** Adds the dropshots Gradle plugin, authors instrumented snapshot tests for every story across light/dark, manages PNG baselines, and integrates parity manifest checks. TDD record-then-verify cycle is squarely in kotlin-implementer's wheelhouse.

## Coding Standards

- `brain/docs/kotlin-rules.md`
- `RULES.md §6 ComponentTier`
- `RULES.md §10 args`

## Dependencies

**Depends On:** UC-SBX-01-android, UC-SBX-02-android, UC-SBX-03-android, UC-SCR-01-android, UC-SCR-02-android, UC-SCR-03-android, UC-SCR-04-android, UC-SCR-05-android, UC-SCR-06-android

**Blocks:** _(none — terminal task)_

## TDD Workflow

1. **RED** — Write SandboxSnapshotTestBase + per-story snapshot tests; first runs record baselines
2. **GREEN** — Add dropshots plugin; commit reference PNGs; wire scripts
3. **REFACTOR** — Clean base class
4. **VERIFY** — Run all seven gates; commit when green

---

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{"requirements":[
{"id":"AC-1","type":"acceptance_criterion","description":"Dropshots integration","verify":"build"},
{"id":"AC-2","type":"acceptance_criterion","description":"Paired light + dark snapshot per story","verify":"instrumented"},
{"id":"AC-3","type":"acceptance_criterion","description":"Naming convention","verify":"shell"},
{"id":"AC-4","type":"acceptance_criterion","description":"Record cycle for intentional changes","verify":"manual + instrumented"},
{"id":"AC-5","type":"acceptance_criterion","description":"Parity manifest + check passes","verify":"shell"},
{"id":"AC-6","type":"acceptance_criterion","description":"Cross-platform parity report","verify":"manual"},
{"id":"TC-1","type":"test_criterion","description":"Dropshots absent from release classpath","verify":"build","maps_to_ac":"AC-1"},
{"id":"TC-2","type":"test_criterion","description":"Test count == 2 × stories","verify":"instrumented","maps_to_ac":"AC-2"},
{"id":"TC-3","type":"test_criterion","description":"Naming regex","verify":"ci-script","maps_to_ac":"AC-3"},
{"id":"TC-4","type":"test_criterion","description":"Record then verify byte-equal","verify":"instrumented","maps_to_ac":"AC-4"},
{"id":"TC-5","type":"test_criterion","description":"snapshots:check exit 0","verify":"integration","maps_to_ac":"AC-5"},
{"id":"TC-6","type":"test_criterion","description":"Determinism (anim/clock/locale)","verify":"unit","maps_to_ac":"AC-2"}
]}
-->
