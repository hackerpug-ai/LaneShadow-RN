<!-- Task Template v5.1 | INFRA-adapted for sandbox/token foundation work -->

================================================================================
TASK: UC-SBX-05-android - Pre-V2 failed-port cleanup — Android
================================================================================

TASK_TYPE:  INFRA
STATUS:     Backlog
PRIORITY:   P0
EFFORT:     M
SPRINT:     [sprint-01-foundation-tokens-and-v2-reset](./SPRINT.md)
AGENT:      implementer=kotlin-implementer | reviewer=kotlin-reviewer
ESTIMATE:   120 min

RUNTIME_COMMANDS:
  test:      cd android && ./gradlew test
  typecheck: cd android && ./gradlew :app:compileDebugKotlin
  lint:      cd android && ./gradlew detekt

PRD_REFS:   UC-SBX-05, .spec/prds/v2/09-uc-sbx.md
DEPENDS_ON: UC-SBX-00-android
BLOCKS:     (none)

--------------------------------------------------------------------------------
OUTCOME
--------------------------------------------------------------------------------

All v1.x failed-port Android files deleted; sandbox Stories aggregators reset to empty shells; debug build still boots empty sandbox.

--------------------------------------------------------------------------------
🚫 CRITICAL CONSTRAINTS (Never tier — read before acting)
--------------------------------------------------------------------------------

- NEVER modify ~/Projects/native-sandbox/** or ~/Projects/native-theme/**.
- MUST delete ONLY files listed in the cleanup manifest.
- MUST reset Stories aggregators to empty shells (not delete entry files).
- MUST verify no remaining references to v1.x symbols via grep sweep.
- STRICTLY no hardcoded tokens — LaneShadowTheme Compose wrapper is the only token source.

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

[ ] All v1.x files from cleanup manifest deleted from android/ — maps to AC-1 (PRIMARY)
[ ] Stories aggregators reduced to empty shells
[ ] grep sweep for v1.x symbols returns 0 matches in android/
[ ] Sandbox boots to empty state via launch intent
[ ] compileDebugKotlin + test + detekt all pass
[ ] Only SCOPE.write_allowed files modified

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA
--------------------------------------------------------------------------------

AC-1: All v1.x files removed and compile succeeds [PRIMARY]
  GIVEN: v1.x failed-port files present per manifest
  WHEN:  files are deleted
  THEN:  compileDebugKotlin succeeds with no unresolved references

  TDD_STATE:     none
  TEST_FILE:     n/a
  TEST_FUNCTION: n/a
  VERIFY:        cd android && ./gradlew :app:compileDebugKotlin

AC-2: Aggregators reset to empty shells
  GIVEN: Stories aggregator files had v1.x registrations
  WHEN:  aggregators rewritten as empty shells
  THEN:  each file compiles and registers zero stories

  TDD_STATE:     none
  TEST_FILE:     android/app/src/debug/java/com/laneshadow/sandbox/stories
  TEST_FUNCTION: n/a
  VERIFY:        grep -L 'LSRideCard\|LSProfileHeader\|FeedScreen' android/app/src/debug/java/com/laneshadow/sandbox/stories/*.kt | wc -l

AC-3: v1.x grep sweep clean (edge)
  GIVEN: cleanup complete
  WHEN:  grep over android/ runs
  THEN:  zero matches for FeedScreen, LSRideCard, LSProfileHeader, LSMenuPanel, LSMapChatOverlay, LSEphemeralMessage, DiscoverSection, SettingsEntry

  TDD_STATE:     none
  TEST_FILE:     n/a
  TEST_FUNCTION: n/a
  VERIFY:        ! grep -RE '(FeedScreen|LSRideCard|LSProfileHeader|LSMenuPanel|LSMapChatOverlay|LSEphemeralMessage|DiscoverSection|SettingsEntry)' android/

AC-4: Sandbox still boots empty (error-path proof)
  GIVEN: cleanup merged
  WHEN:  launch intent fires
  THEN:  empty-story placeholder visible in sandbox

  TDD_STATE:     none
  TEST_FILE:     android/app/src/debug/java/com/laneshadow/sandbox/LaneShadowSandbox.kt
  TEST_FUNCTION: n/a
  VERIFY:        adb shell am start -n com.laneshadow/.MainActivity --es com.laneshadow.extra.OPEN_SANDBOX true && sleep 2 && adb shell dumpsys activity activities | grep -q LaneShadowSandbox


--------------------------------------------------------------------------------
SCOPE (file-level write permissions)
--------------------------------------------------------------------------------

writeAllowed:
- android/app/src/debug/java/com/laneshadow/sandbox/stories/**.kt (MODIFY) — reset to empty shells
- android/app/src/**/* (DELETE) — manifest-listed files only

writeProhibited:
- ~/Projects/native-sandbox/** (never modify sibling projects)
- ~/Projects/native-theme/** (never modify sibling projects)
- ios/**, server/**, react-native/** — out of scope
- android/app/src/debug/java/com/laneshadow/sandbox/{LaneShadowSandbox.kt, theme/**, launch/**} — preserve UC-SBX-00 wiring

--------------------------------------------------------------------------------
BOUNDARIES
--------------------------------------------------------------------------------

✅ Always:
- Consult cleanup-manifest before deleting
- Preserve UC-SBX-00-android host wiring
- Run grep sweep before committing

⚠️ Ask First:
- Deleting any file not on manifest
- Removing aggregator files entirely

--------------------------------------------------------------------------------
DELIVERABLE
--------------------------------------------------------------------------------

- android/app/src/debug/java/com/laneshadow/sandbox/stories/*.kt (MODIFY): rewritten as empty shells
- android/app/src/** (DELETE): v1.x files per cleanup manifest

--------------------------------------------------------------------------------
READING LIST
--------------------------------------------------------------------------------

1. .spec/prds/v2/concepts/designs.html [PRIMARY]
   - Lines: all
   - Focus: REQUIRED READING — visual baseline for post-cleanup empty state
2. .spec/prds/v2/09-uc-sbx.md
   - Lines: UC-SBX-05 section
   - Focus: cleanup scope + ACs
3. .spec/prds/v2/tasks/sprint-01-foundation-tokens-and-v2-reset/SPRINT.md
   - Lines: cleanup-manifest section
   - Focus: exact file list
4. ~/Projects/native-sandbox/RULES.md
   - Lines: §7
   - Focus: empty-story shell form (Kotlin)

--------------------------------------------------------------------------------
DESIGN
--------------------------------------------------------------------------------

References:
- /Users/justinrich/Projects/LaneShadow/.spec/prds/v2/concepts/designs.html

Interaction notes:
- REQUIRED READING: /Users/justinrich/Projects/LaneShadow/.spec/prds/v2/concepts/designs.html

Pattern (to imitate):
```
object LaneShadowSandboxStories { fun register() { /* no stories yet */ } }
```

Pattern source: ~/Projects/native-sandbox/RULES.md §7 (Kotlin empty-shell registration)

Anti-pattern (to avoid):
Leaving commented-out v1.x code; deleting aggregator files entirely.

--------------------------------------------------------------------------------
AGENT INSTRUCTIONS
--------------------------------------------------------------------------------

INFRA deletion task — enumerate manifest, delete, reset aggregators, grep sweep, verify sandbox boots empty, commit.

### IMPLEMENTATION STEPS (INFRA — run in order)

1. 1. Read cleanup manifest from SPRINT.md
2. 2. Enumerate v1.x files under android/ matching manifest
3. 3. Delete each file
4. 4. Rewrite Stories aggregator files to empty shells
5. 5. Run grep sweep for v1.x symbols — 0 matches
6. 6. Run compileDebugKotlin + test + detekt
7. 7. Boot emulator, fire launch intent, verify empty sandbox
8. 8. Commit

### VERIFICATION CHECKLIST

- [ ] manifest files deleted
    - Command: `git diff --name-only --diff-filter=D | grep -c android/`
    - Expected: == manifest android line count
- [ ] grep sweep clean
    - Command: `grep -RE '(FeedScreen|LSRideCard|LSProfileHeader|LSMenuPanel|LSMapChatOverlay|LSEphemeralMessage|DiscoverSection|SettingsEntry)' android/ || echo CLEAN`
    - Expected: CLEAN
- [ ] aggregators empty
    - Command: `wc -l android/app/src/debug/java/com/laneshadow/sandbox/stories/*.kt`
    - Expected: each file short (shell only)

--------------------------------------------------------------------------------
VERIFICATION GATES (run before declaring DONE)
--------------------------------------------------------------------------------

- **Typecheck clean** — `cd android && ./gradlew :app:compileDebugKotlin` → Exit 0
- **Tests pass** — `cd android && ./gradlew test` → Exit 0
- **Lint clean** — `cd android && ./gradlew detekt` → no errors

--------------------------------------------------------------------------------
AGENT ASSIGNMENT
--------------------------------------------------------------------------------

Implementer: **kotlin-implementer**
Rationale: Android deletion + Gradle source-set awareness — kotlin-implementer owns Android deletions.
Reviewer: **kotlin-reviewer**

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

Depends on UC-SBX-00-android.
