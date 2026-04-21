<!-- Task Template v5.1 | INFRA-adapted for sandbox/token foundation work -->

================================================================================
TASK: UC-SBX-05-ios - Pre-V2 failed-port cleanup — iOS
================================================================================

TASK_TYPE:  INFRA
STATUS:     Backlog
PRIORITY:   P0
EFFORT:     M
SPRINT:     [sprint-01-foundation-tokens-and-v2-reset](./SPRINT.md)
AGENT:      implementer=swift-implementer | reviewer=swift-reviewer
ESTIMATE:   120 min

RUNTIME_COMMANDS:
  test:      xcodebuild test -project ios/LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'
  typecheck: xcodebuild -project ios/LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -quiet ONLY_ACTIVE_ARCH=YES build
  lint:      swiftformat --quiet ios/LaneShadow

PRD_REFS:   UC-SBX-05, .spec/prds/v2/09-uc-sbx.md
DEPENDS_ON: UC-SBX-00-ios
BLOCKS:     (none)

--------------------------------------------------------------------------------
OUTCOME
--------------------------------------------------------------------------------

All v1.x failed-port iOS files deleted; sandbox Stories/ aggregators reset to empty shells; sandbox still boots to empty state.

--------------------------------------------------------------------------------
🚫 CRITICAL CONSTRAINTS (Never tier — read before acting)
--------------------------------------------------------------------------------

- NEVER modify ~/Projects/native-sandbox/** or ~/Projects/native-theme/**.
- MUST delete ONLY files listed in the cleanup manifest — no collateral deletions.
- MUST reset Stories/ aggregators to empty shells (not delete them entirely) to preserve sandbox entry wiring.
- MUST verify no remaining references to v1.x symbols via grep sweep (FeedScreen, LSRideCard, LSProfileHeader, LSMenuPanel, LSMapChatOverlay, LSEphemeralMessage, DiscoverSection, SettingsEntry).
- STRICTLY no hardcoded tokens — LaneShadowTheme remains the only token source.

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

[ ] All v1.x files from cleanup manifest deleted from ios/ — maps to AC-1 (PRIMARY)
[ ] Stories/ aggregators contain empty-story shells only
[ ] grep sweep for v1.x symbols returns 0 matches in ios/
[ ] Sandbox boots to empty state in simulator
[ ] xcodebuild build + test pass; swiftformat clean
[ ] Only SCOPE.write_allowed files modified

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA
--------------------------------------------------------------------------------

AC-1: All v1.x files removed and build succeeds [PRIMARY]
  GIVEN: v1.x failed-port files still present per cleanup manifest
  WHEN:  files enumerated in manifest are deleted and xcodeproj references pruned
  THEN:  xcodebuild build succeeds with no unresolved references

  TDD_STATE:     none
  TEST_FILE:     n/a (deletion task)
  TEST_FUNCTION: n/a
  VERIFY:        xcodebuild -project ios/LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -quiet ONLY_ACTIVE_ARCH=YES build

AC-2: Aggregators reset to empty shells
  GIVEN: Stories/ aggregator files existed with v1.x registrations
  WHEN:  aggregators are rewritten to empty-shell form
  THEN:  each aggregator file compiles and registers zero stories

  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadow/Sandbox/Stories
  TEST_FUNCTION: n/a
  VERIFY:        swift -e 'import Foundation; exit(0)' && grep -L 'LSRideCard\|LSProfileHeader\|FeedScreen' ios/LaneShadow/Sandbox/Stories/*.swift | wc -l

AC-3: v1.x grep sweep clean (edge)
  GIVEN: cleanup complete
  WHEN:  grep for v1.x symbols runs over ios/
  THEN:  zero matches for FeedScreen, LSRideCard, LSProfileHeader, LSMenuPanel, LSMapChatOverlay, LSEphemeralMessage, DiscoverSection, SettingsEntry

  TDD_STATE:     none
  TEST_FILE:     n/a
  TEST_FUNCTION: n/a
  VERIFY:        ! grep -RE '(FeedScreen|LSRideCard|LSProfileHeader|LSMenuPanel|LSMapChatOverlay|LSEphemeralMessage|DiscoverSection|SettingsEntry)' ios/

AC-4: Sandbox still boots empty (error-path proof)
  GIVEN: cleanup merged
  WHEN:  shake triggers in simulator
  THEN:  LaneShadowSandbox opens with empty-story placeholder visible

  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadow/Sandbox/Entry/LaneShadowSandbox.swift
  TEST_FUNCTION: n/a
  VERIFY:        xcrun simctl io booted shake && sleep 2 && xcrun simctl io booted screenshot /tmp/sbx.png && test -s /tmp/sbx.png


--------------------------------------------------------------------------------
SCOPE (file-level write permissions)
--------------------------------------------------------------------------------

writeAllowed:
- ios/LaneShadow/Sandbox/Stories/**.swift (MODIFY) — reset to empty shells
- ios/LaneShadow/**/* (DELETE) — files listed in cleanup manifest only
- ios/LaneShadow.xcodeproj/project.pbxproj (MODIFY) — prune deleted file references

writeProhibited:
- ~/Projects/native-sandbox/** (never modify sibling projects)
- ~/Projects/native-theme/** (never modify sibling projects)
- android/**, server/**, react-native/** — out of scope
- ios/LaneShadow/Sandbox/Entry/**, Theme/**, Launch/** — preserve UC-SBX-00 wiring

--------------------------------------------------------------------------------
BOUNDARIES
--------------------------------------------------------------------------------

✅ Always:
- Consult cleanup-manifest before deleting; surface any discrepancy
- Preserve UC-SBX-00 host wiring — only aggregators get emptied
- Run full grep sweep before committing

⚠️ Ask First:
- Deleting any file NOT on the manifest
- Removing Stories/ aggregator files entirely (empty-shell, don't delete)

--------------------------------------------------------------------------------
DELIVERABLE
--------------------------------------------------------------------------------

- ios/LaneShadow/Sandbox/Stories/*.swift (MODIFY): rewritten as empty-story shells
- ios/LaneShadow/** (DELETE): v1.x files per cleanup manifest
- ios/LaneShadow.xcodeproj/project.pbxproj (MODIFY): prune references to deleted files

--------------------------------------------------------------------------------
READING LIST
--------------------------------------------------------------------------------

1. .spec/prds/v2/concepts/designs.html [PRIMARY]
   - Lines: all
   - Focus: REQUIRED READING — visual baseline for post-cleanup empty state
2. .spec/prds/v2/09-uc-sbx.md
   - Lines: UC-SBX-05 section
   - Focus: cleanup scope + acceptance criteria
3. .spec/prds/v2/tasks/sprint-01-foundation-tokens-and-v2-reset/SPRINT.md
   - Lines: cleanup-manifest reference
   - Focus: exact file list to delete
4. ~/Projects/native-sandbox/RULES.md
   - Lines: §7 Story contract
   - Focus: empty-story shell form

--------------------------------------------------------------------------------
DESIGN
--------------------------------------------------------------------------------

References:
- /Users/justinrich/Projects/LaneShadow/.spec/prds/v2/concepts/designs.html

Interaction notes:
- REQUIRED READING: /Users/justinrich/Projects/LaneShadow/.spec/prds/v2/concepts/designs.html

Pattern (to imitate):
```
// LaneShadowSandboxStories.swift
public enum LaneShadowSandboxStories { public static func register() { /* no stories yet */ } }
```

Pattern source: ~/Projects/native-sandbox/RULES.md §7 (empty-shell registration)

Anti-pattern (to avoid):
Leaving commented-out v1.x code; deleting aggregator files entirely (breaks entry wiring).

--------------------------------------------------------------------------------
AGENT INSTRUCTIONS
--------------------------------------------------------------------------------

INFRA deletion task — enumerate manifest, delete files, reset aggregators, grep sweep, verify sandbox boots empty, commit.

### IMPLEMENTATION STEPS (INFRA — run in order)

1. 1. Read cleanup manifest from SPRINT.md
2. 2. Enumerate v1.x files under ios/ matching manifest
3. 3. Delete each file; prune xcodeproj references using xcodeproj gem
4. 4. Rewrite Stories/ aggregator files as empty-story shells
5. 5. Run grep sweep for v1.x symbols — must be 0 matches
6. 6. Run xcodebuild build + test
7. 7. Boot simulator, shake, verify empty sandbox
8. 8. Commit

### VERIFICATION CHECKLIST

- [ ] manifest files deleted
    - Command: `comm -12 <(git diff --name-only --diff-filter=D | sort) <(sort path/to/cleanup-manifest.txt) | wc -l`
    - Expected: == manifest line count
- [ ] grep sweep clean
    - Command: `grep -RE '(FeedScreen|LSRideCard|LSProfileHeader|LSMenuPanel|LSMapChatOverlay|LSEphemeralMessage|DiscoverSection|SettingsEntry)' ios/ || echo CLEAN`
    - Expected: CLEAN
- [ ] aggregators empty
    - Command: `wc -l ios/LaneShadow/Sandbox/Stories/*.swift`
    - Expected: each file < ~20 lines (shell only)

--------------------------------------------------------------------------------
VERIFICATION GATES (run before declaring DONE)
--------------------------------------------------------------------------------

- **Build clean** — `xcodebuild -project ios/LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -quiet ONLY_ACTIVE_ARCH=YES build` → Exit 0
- **Tests pass** — `xcodebuild test -project ios/LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'` → Exit 0
- **Lint clean** — `swiftformat --quiet ios/LaneShadow` → no changes

--------------------------------------------------------------------------------
AGENT ASSIGNMENT
--------------------------------------------------------------------------------

Implementer: **swift-implementer**
Rationale: iOS deletion + aggregator reset requires Swift + xcodeproj awareness — swift-implementer owns iOS deletions.
Reviewer: **swift-reviewer**

--------------------------------------------------------------------------------
CODING STANDARDS
--------------------------------------------------------------------------------

- /Users/justinrich/Projects/LaneShadow/CLAUDE.md
- /Users/justinrich/Projects/LaneShadow/RULES.md
- ~/Projects/native-sandbox/RULES.md
- ~/Projects/native-theme/README.md
- ~/.claude/CLAUDE.md (commit discipline)

--------------------------------------------------------------------------------
NOTES
--------------------------------------------------------------------------------

Depends on UC-SBX-00-ios — the empty sandbox shell must exist before aggregators can be reset against it.
