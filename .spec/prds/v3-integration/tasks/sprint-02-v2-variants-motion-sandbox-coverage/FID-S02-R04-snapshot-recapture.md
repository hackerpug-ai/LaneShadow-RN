================================================================================
TASK: FID-S02-R04 - Snapshot Re-Capture After Remediation
================================================================================

TASK_TYPE:  FIX
STATUS:     Backlog
PRIORITY:   P1
EFFORT:     S
AGENT:      implementer=swift-implementer + kotlin-implementer | reviewer=swift-reviewer + kotlin-reviewer

RUNTIME_COMMANDS:
  snapshots-check: pnpm snapshots:check
  snapshots-parity: pnpm snapshots:parity-coverage
  ios-test: xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'
  android-test: cd android && ./gradlew test

PROGRESS: Not started

--------------------------------------------------------------------------------
OUTCOME (1 sentence)
--------------------------------------------------------------------------------

Snapshot baselines (light + dark PNGs) are re-captured on both platforms after R01-R03 fixes land, ensuring the regression net reflects correct motion timings, real component rendering, and complete story coverage.

--------------------------------------------------------------------------------
SOURCE
--------------------------------------------------------------------------------

Red-hat review 2026-04-28 Finding 13 (HIGH).
Once R01 fixes motion tokens, R02 fixes tests, and R03 adds missing Android molecules, the existing snapshot baselines will be stale (wrong motion frames, potentially missing component rendering). Must re-capture.

--------------------------------------------------------------------------------
🚫 CRITICAL CONSTRAINTS
--------------------------------------------------------------------------------

- MUST NOT re-capture until R01, R02, R03 are all committed and tests pass
- MUST capture both light + dark for every story
- MUST verify `pnpm snapshots:check` exits 0 after re-capture
- MUST verify `pnpm snapshots:parity-coverage` meets thresholds (atoms/molecules ≥95%, organisms ≥90%, tokens 100%)
- MUST NOT lower thresholds to pass

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

- [ ] All iOS snapshots re-captured with correct motion timings from tokens (AC-1)
- [ ] All Android snapshots re-captured with correct motion timings from tokens (AC-2)
- [ ] `pnpm snapshots:check` exits 0 (AC-3)
- [ ] `pnpm snapshots:parity-coverage` meets thresholds (AC-4)
- [ ] Snapshot PNGs visually inspected (sample of 5) — no empty regions or wrong rendering

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA
--------------------------------------------------------------------------------

AC-1: iOS snapshot re-capture
  GIVEN: R01 and R02 are landed and all iOS tests pass
  WHEN:  Snapshot capture runs
  THEN:  All StoryCoverageTests still pass (same counts) and new PNGs reflect token-driven motion (1400ms frames, not 600ms)

AC-2: Android snapshot re-capture
  GIVEN: R01 and R03 are landed and all Android tests pass
  WHEN:  Snapshot capture runs
  THEN:  New PNGs reflect 1400ms motion timings, LSCancelConfirmSheet renders in Planning V02, LSSavedPill renders in RouteDetails V01

AC-3: Coverage check clean
  GIVEN: All snapshots re-captured
  WHEN:  `pnpm snapshots:check` runs
  THEN:  Exit code 0, zero coverage gaps

AC-4: Parity thresholds met
  GIVEN: All snapshots re-captured
  WHEN:  `pnpm snapshots:parity-coverage` runs
  THEN:  atoms ≥ 95%, molecules ≥ 95%, organisms ≥ 90%, tokens = 100%

--------------------------------------------------------------------------------
SCOPE
--------------------------------------------------------------------------------

writeAllowed:
- ios/LaneShadowTests/__Snapshots__/StorySnapshotTests/*.png (MODIFY — re-captured)
- android/app/src/androidTest/screenshots/AllStoriesSnapshotTest/*.png (MODIFY — re-captured)

writeProhibited:
- ios/LaneShadow/Views/** — no implementation changes
- android/app/src/main/** — no implementation changes
- tokens/** — no token changes
- Any source code file

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends on: FID-S02-R01 (motion tokens), FID-S02-R02 (iOS tests), FID-S02-R03 (Android molecules)
Blocks:     Sprint 03 start
Parallel:   None (terminal remediation task)

================================================================================
