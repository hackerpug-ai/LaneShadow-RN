================================================================================
TASK: CHAT-S04-R07 - iOS sandbox story ID format normalization
================================================================================

TASK_TYPE:  REFACTOR
STATUS:     Backlog
PRIORITY:   P1
EFFORT:     S
AGENT:      implementer=swift-implementer | reviewer=swift-reviewer

RUNTIME_COMMANDS:
  test:      xcodebuild -project ios/LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' test
  typecheck: xcodebuild -project ios/LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -quiet ONLY_ACTIVE_ARCH=YES build
  lint:      swiftformat --lint ios/

PROGRESS: 0/3 AC · pending

--------------------------------------------------------------------------------
OUTCOME
--------------------------------------------------------------------------------

Every iOS sprint-04 template story id matches `templates.{component-kebab}.{variant}`; pnpm snapshots:check passes with no parity drift.

--------------------------------------------------------------------------------
🚫 CRITICAL CONSTRAINTS
--------------------------------------------------------------------------------

- MUST normalize all sprint-04 template story IDs to `templates.{idle|planning|route-results|route-details|error}-screen.{variant}`
- MUST migrate snapshot file names to match new IDs cleanly (rename, do not duplicate)
- MUST add a test that asserts every sprint-04 template story id matches the canonical regex
- MUST verify pnpm snapshots:check does not regress
- NEVER leave legacy `templates.idle.default` style IDs in any sprint-04 story
- NEVER duplicate snapshot files (old + new) — must be rename only
- NEVER edit ios/LaneShadow.xcodeproj/** directly
- STRICTLY component slug must be kebab-case lowercase ending in '-screen'
- STRICTLY variant slug must be kebab-case lowercase
- STRICTLY match Android story id strings exactly for cross-platform parity

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

- [ ] All sprint-04 story IDs match canonical regex (AC-1 PRIMARY)
- [ ] Snapshot file names migrated cleanly (AC-2)
- [ ] pnpm snapshots:check passes with no parity drift (AC-3)
- [ ] xcodebuild test + build clean
- [ ] Only SCOPE.writeAllowed files modified

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA (TDD Beads)
--------------------------------------------------------------------------------

AC-1: All sprint-04 story IDs match canonical regex [PRIMARY]
  GIVEN: Sprint-04 template story registrations in ios/LaneShadow/Sandbox/Stories
  WHEN:  Each story id is checked against regex `^templates\.(idle|planning|route-results|route-details|error)-screen\.[a-z0-9-]+$`
  THEN:  Every story id matches; zero failures

  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Sandbox/StoryIdFormatTests.swift
  TEST_FUNCTION: test_allSprint04TemplateStoryIds_matchCanonicalRegex

AC-2: Snapshot file names migrated cleanly
  GIVEN: Pre-migration snapshot files for sprint-04 templates
  WHEN:  Migration completes
  THEN:  Each snapshot file name equals `{storyId}.png` (canonical format) and no legacy-named PNGs remain in the snapshot directory

  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Sandbox/StoryIdFormatTests.swift
  TEST_FUNCTION: test_snapshotFiles_useCanonicalStoryIdNaming

AC-3: pnpm snapshots:check passes with no parity drift
  GIVEN: Renamed iOS stories and snapshot files
  WHEN:  pnpm snapshots:check runs
  THEN:  Exit code is 0 and no `ios_only` entries appear in the parity report

  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Sandbox/StoryIdFormatTests.swift
  TEST_FUNCTION: test_snapshotsCheck_noIosOnlyEntries

--------------------------------------------------------------------------------
TEST CRITERIA
--------------------------------------------------------------------------------

| ID  | Statement | Maps to | Type |
|-----|-----------|---------|------|
| TC-1 | All sprint-04 template story ids match canonical regex | AC-1 | happy_path |
| TC-2 | Snapshot file names equal canonical story IDs | AC-2 | happy_path |
| TC-3 | Cross-platform parity check passes with zero `ios_only` for templates | AC-3 | happy_path |

--------------------------------------------------------------------------------
SCOPE
--------------------------------------------------------------------------------

writeAllowed:
- ios/LaneShadow/Sandbox/Stories/**
- ios/LaneShadowTests/__Snapshots__/**
- ios/LaneShadowTests/Sandbox/StoryIdFormatTests.swift (NEW)
- ios/project.yml

writeProhibited:
- ios/LaneShadow.xcodeproj/** — generated
- ios/LaneShadow/Generated/** — generated
- android/** — Android handled by R10

--------------------------------------------------------------------------------
BOUNDARIES
--------------------------------------------------------------------------------

✅ Always:
- Rename — never duplicate
- Lowercase kebab-case for all slugs
- Add regex assertion test

⚠️ Ask First:
- Removing any story (only renaming in this task)

--------------------------------------------------------------------------------
DELIVERABLE
--------------------------------------------------------------------------------

- ios/LaneShadow/Sandbox/Stories/** (MODIFY): rename story IDs to canonical form
- ios/LaneShadowTests/__Snapshots__/** (MODIFY): rename PNG files to match
- ios/LaneShadowTests/Sandbox/StoryIdFormatTests.swift (NEW): regex + snapshot file naming assertion

--------------------------------------------------------------------------------
AGENT INSTRUCTIONS (TDD Flow)
--------------------------------------------------------------------------------

## FOR EACH AC:

### RED PHASE
- READ: AC, current story registrations
- WRITE: ONE Swift Testing test
- RUN: `xcodebuild ... test -only-testing:LaneShadowTests/StoryIdFormatTests/<test_function>`
- VERIFY: Test FAILS

### GREEN PHASE
- WRITE: rename story IDs + snapshot files
- RUN: `xcodebuild ... test`
- VERIFY: Test PASSES

### REFACTOR PHASE
- READ: full diff
- RUN: full xcodebuild + snapshot:check
- VERIFY: still green

--------------------------------------------------------------------------------
READING LIST
--------------------------------------------------------------------------------

1. ios/LaneShadow/Sandbox/Stories [PRIMARY PATTERN]
   - Lines: all
   - Focus: current sprint-04 template story id strings

2. ios/LaneShadowTests/__Snapshots__
   - Lines: all
   - Focus: current snapshot filenames to migrate

3. RULES.md
   - Lines: Cross-Platform Component Parity section
   - Focus: canonical naming spec

4. .spec/prds/v3-integration/tasks/sprint-04-conversational-planning-loop/SPRINT.md
   - Lines: all
   - Focus: sprint scope of stories

5. .spec/reviews/red-hat-sprint-04-2026-05-03T14-19-50Z.md
   - Lines: F-16 section
   - Focus: exact failure description

6. scripts/snapshots
   - Lines: all
   - Focus: snapshot parity check tooling

--------------------------------------------------------------------------------
EVIDENCE GATES
--------------------------------------------------------------------------------

Gate 1: RED phase evidence
  Required: TDD_STATE values show each test went red before green.

Gate 2: All Swift Testing tests pass
  Command: xcodebuild ... test -only-testing:LaneShadowTests/StoryIdFormatTests
  Expected: Exit 0.

Gate 3: Build clean
  Command: xcodebuild ... build
  Expected: Exit 0.

Gate 4: Lint clean
  Command: swiftformat --lint ios/
  Expected: Exit 0.

Gate 5: Snapshot parity passes
  Command: pnpm snapshots:check
  Expected: Exit 0 with zero ios_only entries for sprint-04 templates.

Gate 6: Scope compliance
  Command: git diff --name-only
  Expected: Only SCOPE.writeAllowed files modified.

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends on: (none)
Blocks:     CHAT-S04-R10 (Android AppStories must use these canonical IDs)

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "taskId": "CHAT-S04-R07",
  "requirements": [
    {"id": "AC-1", "type": "acceptance_criterion", "description": "Canonical story-id regex compliance", "verify": "xcodebuild test -only-testing:LaneShadowTests/StoryIdFormatTests/test_allSprint04TemplateStoryIds_matchCanonicalRegex", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-2", "type": "acceptance_criterion", "description": "Snapshot file renames complete", "verify": "xcodebuild test -only-testing:LaneShadowTests/StoryIdFormatTests/test_snapshotFiles_useCanonicalStoryIdNaming", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-3", "type": "acceptance_criterion", "description": "Snapshot parity check passes", "verify": "pnpm snapshots:check", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-1", "type": "test_criterion", "description": "Regex assertion across all sprint-04 stories", "maps_to_ac": "AC-1", "verify": "xcodebuild test -only-testing:LaneShadowTests/StoryIdFormatTests/test_allSprint04TemplateStoryIds_matchCanonicalRegex", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-2", "type": "test_criterion", "description": "Snapshot directory has only canonical filenames", "maps_to_ac": "AC-2", "verify": "xcodebuild test -only-testing:LaneShadowTests/StoryIdFormatTests/test_snapshotFiles_useCanonicalStoryIdNaming", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-3", "type": "test_criterion", "description": "Snapshot parity tool reports no ios_only entries", "maps_to_ac": "AC-3", "verify": "pnpm snapshots:check", "satisfied": false, "evidence": null, "remediation": null}
  ]
}
-->
================================================================================
