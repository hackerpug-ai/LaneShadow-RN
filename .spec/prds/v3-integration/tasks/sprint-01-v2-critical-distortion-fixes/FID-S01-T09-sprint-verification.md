================================================================================
TASK: FID-S01-T09 - Sprint 01 Verification (Screenshots + Visual Comparison)
================================================================================

TASK_TYPE:  VERIFICATION
STATUS:     Backlog
PRIORITY:   P1
EFFORT:     S
AGENT:      implementer=qa-engineer | reviewer=code-reviewer

RUNTIME_COMMANDS:
  ios-sandbox: cd ios && xcodebuild -project LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' build
  android-sandbox: cd android && ./gradlew assembleDebug
  native-compliance: scripts/tokens/enforce-native-compliance.sh

PROGRESS: AC-1..AC-3 not started

--------------------------------------------------------------------------------
OUTCOME
--------------------------------------------------------------------------------

Sprint 01 verification captures screenshots of every modified component on both platforms and visually compares against `.spec/design/system/` HTML/PNG references, recording findings in a sprint summary.

--------------------------------------------------------------------------------
🚫 CRITICAL CONSTRAINTS
--------------------------------------------------------------------------------

- MUST capture screenshots on both iOS Simulator (iPhone 16) AND Android Emulator
- MUST compare each screenshot against the authoritative `.spec/design/system/` HTML/PNG reference
- MUST record findings with PASS/FAIL per AC per task and attach screenshot evidence
- NEVER mark an AC PASS without visual evidence — "looks right" is not evidence
- NEVER skip a platform — both iOS and Android must be verified

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

- [ ] Screenshots captured for all T01-T08 modified components on iOS Simulator (AC-1)
- [ ] Screenshots captured for all T06-T08 modified components on Android Emulator (AC-2)
- [ ] Visual comparison report produced with PASS/FAIL per AC per task (AC-3)
- [ ] Report committed to sprint folder

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA
--------------------------------------------------------------------------------

AC-1: iOS screenshot capture
  GIVEN: All iOS tasks (T01-T05) are complete and committed
  WHEN:  Verification runs on iOS Simulator
  THEN:  Screenshots exist for: IdleScreen (typography + map), PlanningScreen (map), ErrorScreen (map + callout), LSRouteCard, LSRouteSheet, LSSessionsDrawer, AppHeader hamburger

  TDD_STATE:     n/a (verification task)
  TEST_FILE:     .spec/prds/v3-integration/tasks/sprint-01-v2-critical-distortion-fixes/VERIFICATION.md
  TEST_FUNCTION: n/a

AC-2: Android screenshot capture
  GIVEN: All Android tasks (T06-T08) are complete and committed
  WHEN:  Verification runs on Android Emulator
  THEN:  Screenshots exist for: LSSessionsDrawer, AppHeader hamburger, RouteDetailsScreen (polyline), LSRouteCard (heart + map), LSRouteSheet (timeRange), LSNavigatorMessage (pinned dot), LSSectionHeader

  TDD_STATE:     n/a (verification task)
  TEST_FILE:     .spec/prds/v3-integration/tasks/sprint-01-v2-critical-distortion-fixes/VERIFICATION.md
  TEST_FUNCTION: n/a

AC-3: Visual comparison report
  GIVEN: All screenshots are captured
  WHEN:  Report is generated
  THEN:  VERIFICATION.md contains PASS/FAIL per AC per task with screenshot paths and comparison notes against `.spec/design/system/` references

  TDD_STATE:     n/a (verification task)
  TEST_FILE:     .spec/prds/v3-integration/tasks/sprint-01-v2-critical-distortion-fixes/VERIFICATION.md
  TEST_FUNCTION: n/a

--------------------------------------------------------------------------------
SCOPE
--------------------------------------------------------------------------------

writeAllowed:
- .spec/prds/v3-integration/tasks/sprint-01-v2-critical-distortion-fixes/VERIFICATION.md (NEW)
- .spec/prds/v3-integration/tasks/sprint-01-v2-critical-distortion-fixes/screenshots/ (NEW — directory)

writeProhibited:
- ios/**, android/**, server/**, react-native/**, any source code files

--------------------------------------------------------------------------------
DELIVERABLE
--------------------------------------------------------------------------------

- .spec/prds/v3-integration/tasks/sprint-01-v2-critical-distortion-fixes/VERIFICATION.md (NEW): PASS/FAIL matrix with screenshot evidence
- .spec/prds/v3-integration/tasks/sprint-01-v2-critical-distortion-fixes/screenshots/ (NEW): Platform-specific screenshot captures

--------------------------------------------------------------------------------
READING LIST
--------------------------------------------------------------------------------

1. .spec/design/system/views/ [PRIMARY REFERENCE]
   - Focus: HTML/PNG authoritative mockups for visual comparison

2. .spec/design/system/organisms/ [PRIMARY REFERENCE]
   - Focus: Organism-level HTML/PNG mockups

3. .spec/prds/v3-integration/tasks/sprint-01-v2-critical-distortion-fixes/SPRINT.md
   - Focus: Human Testing Gate steps 1-7

4. .spec/prds/v3-integration/remediations/00-summary.md
   - Focus: Gap severity rollup for context on what to look for

--------------------------------------------------------------------------------
EVIDENCE GATES
--------------------------------------------------------------------------------

Gate 1: Screenshots directory contains images for both platforms
Gate 2: VERIFICATION.md exists with PASS/FAIL per AC
Gate 3: Every T01-T08 AC has a corresponding entry in the report
Gate 4: git diff --name-only ⊆ writeAllowed

--------------------------------------------------------------------------------
OUT OF SCOPE
--------------------------------------------------------------------------------

- Automated pixel-diff testing (future tooling)
- Performance profiling
- Accessibility audit (Sprint 02)

--------------------------------------------------------------------------------
CONTEXT
--------------------------------------------------------------------------------

**Current state:** Sprint 01 tasks T01-T08 modify iOS typography, map slots, route card geometry, route sheet shell, sessions drawer container, Android build blockers, Android token corrections, and Android drawer container. No visual verification exists yet.
**Gap:** Need human-readable evidence that the distortion fixes actually match the design system references before marking the sprint complete.

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends on: FID-S01-T01..T08 (all implementation tasks must complete first)
Blocks:     None
Parallel:   None (runs after all tasks)

================================================================================

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    { "id": "AC-1", "type": "acceptance_criterion", "description": "GIVEN iOS tasks T01-T05 complete WHEN verification runs THEN screenshots captured for all modified components on iOS Simulator", "verify": "ls .spec/prds/v3-integration/tasks/sprint-01-v2-critical-distortion-fixes/screenshots/ios/" },
    { "id": "AC-2", "type": "acceptance_criterion", "description": "GIVEN Android tasks T06-T08 complete WHEN verification runs THEN screenshots captured for all modified components on Android Emulator", "verify": "ls .spec/prds/v3-integration/tasks/sprint-01-v2-critical-distortion-fixes/screenshots/android/" },
    { "id": "AC-3", "type": "acceptance_criterion", "description": "GIVEN all screenshots captured WHEN report generated THEN VERIFICATION.md contains PASS/FAIL per AC per task with evidence", "verify": "cat .spec/prds/v3-integration/tasks/sprint-01-v2-critical-distortion-fixes/VERIFICATION.md" },
    { "id": "TC-1", "type": "test_criterion", "description": "iOS screenshot count matches expected component list from T01-T05", "maps_to_ac": "AC-1", "verify": "ls .spec/prds/v3-integration/tasks/sprint-01-v2-critical-distortion-fixes/screenshots/ios/ | wc -l" },
    { "id": "TC-2", "type": "test_criterion", "description": "Android screenshot count matches expected component list from T06-T08", "maps_to_ac": "AC-2", "verify": "ls .spec/prds/v3-integration/tasks/sprint-01-v2-critical-distortion-fixes/screenshots/android/ | wc -l" },
    { "id": "TC-3", "type": "test_criterion", "description": "VERIFICATION.md has PASS or FAIL entry for every AC in T01-T08", "maps_to_ac": "AC-3", "verify": "grep -c 'PASS\\|FAIL' .spec/prds/v3-integration/tasks/sprint-01-v2-critical-distortion-fixes/VERIFICATION.md" }
  ]
}
-->
