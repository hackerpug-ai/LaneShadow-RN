================================================================================
TASK: FID-S05-T01 - Phase 0 cleanup: remove sandbox snapshot tests + parity infra
================================================================================

TASK_TYPE:  INFRA
STATUS:     Backlog
PRIORITY:   P0
EFFORT:     M
AGENT:      implementer=swift-implementer + kotlin-implementer | reviewer=code-reviewer
SPRINT:     [sprint-05-design-review-pipeline](./SPRINT.md)
ESTIMATE:   120 min

RUNTIME_COMMANDS:
  typecheck: pnpm type-check:native
  ios-build: cd ios && xcodebuild -project LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' build
  android-build: cd android && ./gradlew :app:assembleDebug

PROGRESS: AC-1 not started · 0/5 complete

--------------------------------------------------------------------------------
OUTCOME
--------------------------------------------------------------------------------

Delete snapshot tests, parity manifests, and parity scripts on both platforms while preserving the sandbox catalog UI and canonical-id naming spec.

--------------------------------------------------------------------------------
🚫 CRITICAL CONSTRAINTS
--------------------------------------------------------------------------------

- MUST preserve `LaneShadowStories.all` (iOS) and `LaneShadowSandboxEntry` (Android) catalog UI source files
- MUST preserve canonical-id naming spec section in `RULES.md` — only annotate, never remove
- MUST verify `SandboxSnapshotTestBase.kt` has zero importers (`grep -r SandboxSnapshotTestBase android/`) before deleting
- NEVER delete sandbox catalog UI source files
- NEVER bypass pre-push with `--no-verify`; STRICTLY all four toolchain builds must remain green after deletion

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

- [ ] AC-1: All listed snapshot files + parity JSONs + scripts/snapshots/ removed [PRIMARY]
- [ ] AC-2: package.json and lefthook.yml have zero references to snapshots:* scripts
- [ ] AC-3: pnpm type-check:native, iOS xcodebuild build, Android assembleDebug all succeed
- [ ] AC-4: Sandbox catalog UI source preserved + canonical-id spec text remains in RULES.md
- [ ] AC-5: `git grep -nE 'snapshots:check|scripts/snapshots/'` returns no live source references

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA (verification gates — INFRA, not TDD)
--------------------------------------------------------------------------------

AC-1: Snapshot test files removed on both platforms [PRIMARY]
  GIVEN: iOS and Android snapshot tests + their snapshot PNGs exist on main
  WHEN:  Phase 0 cleanup commits land
  THEN:  StorySnapshotTests.swift, AllStoriesSnapshotTest.kt, both snapshot dirs, SandboxSnapshotTestBase.kt (if no importers), and tokens/sandbox/{snapshots.parity,parity-thresholds,parity-exemptions}.json are removed
  TDD_STATE: none
  VERIFY:    git ls-files | grep -E '(StorySnapshotTests\.swift|AllStoriesSnapshotTest\.kt|tokens/sandbox/(snapshots\.parity|parity-thresholds|parity-exemptions)\.json|scripts/snapshots/)' | wc -l | grep -q '^0$'

AC-2: Package.json and lefthook scripts removed
  GIVEN: Root package.json contains snapshots:* scripts and lefthook.yml has pre-push entries
  WHEN:  Cleanup edits land
  THEN:  snapshots:record:ios, snapshots:record:android, snapshots:check, snapshots:sync-manifest, snapshots:parity-report, snapshots:parity-coverage are removed from package.json AND pre-push entries removed from lefthook.yml
  TDD_STATE: none
  VERIFY:    ! grep -E 'snapshots:(check|record|sync-manifest|parity-report|parity-coverage)' package.json lefthook.yml

AC-3: All four toolchains stay green
  GIVEN: Files have been deleted
  WHEN:  Each toolchain runs
  THEN:  pnpm type-check:native, xcodebuild build, gradlew assembleDebug, and pnpm dev boot all succeed
  TDD_STATE: none
  VERIFY:    pnpm type-check:native && cd ios && xcodebuild -project LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' build && cd ../android && ./gradlew :app:assembleDebug

AC-4: Sandbox catalog UI preserved and navigable
  GIVEN: Sandbox catalog UI survives the cleanup
  WHEN:  Debug builds launch and navigate to the sandbox entry
  THEN:  LaneShadowSandboxEntry renders LaneShadowStories.all without crash and canonical-id naming spec text remains in RULES.md
  TDD_STATE: none
  VERIFY:    git ls-files | grep -q LaneShadowStories && grep -q 'Cross-Platform Component Parity' RULES.md

AC-5: No live references to removed scripts
  GIVEN: Repo state after cleanup
  WHEN:  `git grep` is run
  THEN:  No live source references to snapshots:check or scripts/snapshots/ remain (excluding historical .spec/ docs)
  TDD_STATE: none
  VERIFY:    ! git grep -nE 'snapshots:check|scripts/snapshots/' -- ':!.spec/**' ':!**/CHANGELOG*'

--------------------------------------------------------------------------------
TEST CRITERIA
--------------------------------------------------------------------------------

| ID | Statement | Maps to | Verify |
|----|-----------|---------|--------|
| TC-1 | All listed snapshot files absent from git tree | AC-1 | `git ls-files \| grep -E 'StorySnapshotTests\|AllStoriesSnapshotTest\|tokens/sandbox/(snapshots\.parity\|parity-thresholds)' \| wc -l \| grep -q '^0$'` |
| TC-2 | package.json contains zero snapshot scripts | AC-2 | `! grep -E '"snapshots:' package.json` |
| TC-3 | lefthook.yml contains zero snapshot pre-push entries | AC-2 | `! grep -E 'snapshots:(check\|parity-coverage)' lefthook.yml` |
| TC-4 | TypeScript native typecheck passes | AC-3 | `pnpm type-check:native` |
| TC-5 | iOS xcodebuild build succeeds | AC-3 | `cd ios && xcodebuild -project LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' build` |
| TC-6 | Android assembleDebug succeeds | AC-3 | `cd android && ./gradlew :app:assembleDebug` |
| TC-7 | SandboxSnapshotTestBase only deleted if no importers | AC-1 | `! git grep -n 'SandboxSnapshotTestBase' android/` |
| TC-8 | Sandbox stories source file remains in tree | AC-4 | `git ls-files \| grep -q LaneShadowStories` |
| TC-9 | RULES.md still documents canonical-id naming spec | AC-4 | `grep -q 'Cross-Platform Component Parity' RULES.md` |

--------------------------------------------------------------------------------
SCOPE
--------------------------------------------------------------------------------

writeAllowed:
- ios/LaneShadowTests/Sandbox/StorySnapshotTests.swift (DELETE)
- ios/LaneShadowTests/__Snapshots__/StorySnapshotTests/ (DELETE — entire dir)
- android/app/src/androidTest/java/com/laneshadow/sandbox/snapshots/AllStoriesSnapshotTest.kt (DELETE)
- android/app/src/androidTest/java/com/laneshadow/sandbox/snapshots/SandboxSnapshotTestBase.kt (DELETE — only if zero importers)
- android/app/src/androidTest/screenshots/AllStoriesSnapshotTest/ (DELETE — entire dir)
- tokens/sandbox/snapshots.parity.json (DELETE)
- tokens/sandbox/parity-thresholds.json (DELETE)
- tokens/sandbox/parity-exemptions.json (DELETE if exists)
- scripts/snapshots/ (DELETE — entire dir: check.ts, record-ios.sh, record-android.sh, parity-report.ts, sync-manifest.ts, parity-coverage.ts)
- package.json (MODIFY — remove snapshots:* scripts only)
- lefthook.yml (MODIFY — remove pre-push snapshots:check + snapshots:parity-coverage entries)
- RULES.md (MODIFY — annotate Cross-Platform Component Parity section, preserve canonical-id spec)

writeProhibited:
- ios/LaneShadow/Sandbox/** — sandbox catalog UI must remain
- android/app/src/debug/java/com/laneshadow/sandbox/** — sandbox catalog UI must remain
- .spec/design/system/** — design system reference owned by T02
- ios/LaneShadow/** (other than sandbox-adjacent) — production app code untouched

--------------------------------------------------------------------------------
BOUNDARIES
--------------------------------------------------------------------------------

✅ Always:
- Run `grep -r SandboxSnapshotTestBase android/` before deleting that file
- Run all four toolchain builds after deletion (typecheck + iOS build + Android build + dev boot)
- Preserve canonical-id spec text in RULES.md
- Use `git rm` (not bare `rm`) so deletions are tracked

⚠️ Ask First:
- If any sandbox-runtime code (not snapshot tests) references snapshots:* paths
- If RULES.md edits would remove rather than annotate the parity section
- If SandboxSnapshotTestBase.kt has importers (then keep it; only the test class is deleted)

--------------------------------------------------------------------------------
DELIVERABLE
--------------------------------------------------------------------------------

Order: deletions first (no compile order between platforms), then config/script removals, then docs annotation.

- ios/LaneShadowTests/Sandbox/StorySnapshotTests.swift (DELETE): iOS snapshot test class removed
- ios/LaneShadowTests/__Snapshots__/StorySnapshotTests/ (DELETE): iOS PNG baselines removed
- android/app/src/androidTest/java/com/laneshadow/sandbox/snapshots/AllStoriesSnapshotTest.kt (DELETE): Android snapshot test class removed
- android/app/src/androidTest/screenshots/AllStoriesSnapshotTest/ (DELETE): Android PNG baselines removed
- tokens/sandbox/snapshots.parity.json (DELETE): parity manifest removed
- tokens/sandbox/parity-thresholds.json (DELETE): per-tier thresholds removed
- scripts/snapshots/ (DELETE): parity scripts directory removed
- package.json (MODIFY): snapshots:* scripts removed from `scripts` block
- lefthook.yml (MODIFY): pre-push `snapshots:check` and `snapshots:parity-coverage` jobs removed (lines 88-99)
- RULES.md (MODIFY): "Cross-Platform Component Parity" section annotated with one-line note pointing to sprint-05; canonical-id spec preserved

--------------------------------------------------------------------------------
AGENT INSTRUCTIONS (verification checklist — INFRA)
--------------------------------------------------------------------------------

1. Pre-flight: confirm working tree is clean (`git status --porcelain` empty) before starting.
2. Run `grep -r SandboxSnapshotTestBase android/`. If it has callers other than `AllStoriesSnapshotTest.kt`, keep the base class and only delete the test.
3. `git rm` each path listed in `writeAllowed` (deletions). Use `-r` for directories.
4. Edit `package.json`: remove the six `snapshots:*` script entries. Verify with `grep -E '"snapshots:' package.json` returns no matches.
5. Edit `lefthook.yml`: remove lines 88-99 (`snapshots:check` and `snapshots:parity-coverage` jobs). Preserve the `pre-push` block header and any other jobs.
6. Edit `RULES.md` "Cross-Platform Component Parity" section: append a note like "_Note (2026-05-04): Snapshot parity gate removed in Sprint 05; pipeline replaced by `pnpm design:review`. Canonical-id naming spec below remains load-bearing for the in-app sandbox catalog UI._"
7. Run all four verification commands (AC-3 verify). All must exit 0.
8. Run AC-5 verify; must return no matches.
9. Manual: launch debug builds on both platforms, navigate to sandbox catalog, confirm stories render.
10. Commit with message: `chore(sprint-05): remove sandbox snapshot tests + parity infra (FID-S05-T01)`. Pre-commit hooks must pass without `--no-verify`.

--------------------------------------------------------------------------------
READING LIST
--------------------------------------------------------------------------------

1. /Users/justinrich/.claude/plans/plan-a-design-review-logical-clock.md [PRIMARY PATTERN]
   - Section: Phase 0 — authoritative deletion list
   - Focus: exact file paths to remove and what to preserve

2. /Users/justinrich/Projects/LaneShadow/RULES.md
   - Section: "Cross-Platform Component Parity"
   - Focus: identify exact section to annotate; preserve canonical-id spec text

3. /Users/justinrich/Projects/LaneShadow/lefthook.yml
   - Lines: 88-99
   - Focus: jobs to remove

4. /Users/justinrich/Projects/LaneShadow/package.json
   - Section: scripts
   - Focus: snapshot script names to remove

--------------------------------------------------------------------------------
EVIDENCE GATES
--------------------------------------------------------------------------------

Gate 1: TypeScript typecheck
  Command:  pnpm type-check:native
  Expected: exit 0

Gate 2: iOS build
  Command:  cd ios && xcodebuild -project LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' build
  Expected: BUILD SUCCEEDED

Gate 3: Android build
  Command:  cd android && ./gradlew :app:assembleDebug
  Expected: BUILD SUCCESSFUL

Gate 4: No live snapshot script refs
  Command:  git grep -nE 'snapshots:check|scripts/snapshots/' -- ':!.spec/**' ':!**/CHANGELOG*' || echo OK
  Expected: OK

Gate 5: Sandbox catalog UI preserved
  Command:  git ls-files | grep -E 'LaneShadowStories|LaneShadowSandboxEntry'
  Expected: at least one match each

--------------------------------------------------------------------------------
OUT OF SCOPE
--------------------------------------------------------------------------------

- Removing or refactoring sandbox catalog UI (LaneShadowStories, LaneShadowSandboxEntry)
- Deleting tokens/ root or other token packages outside tokens/sandbox/
- Editing RULES.md sections other than Cross-Platform Component Parity
- Producing design references (T02 owns this)
- Building XCUITest capture harness (T03)

--------------------------------------------------------------------------------
CONTEXT
--------------------------------------------------------------------------------

**Current state:** Repo has iOS + Android snapshot tests, parity manifests under `tokens/sandbox/`, `scripts/snapshots/*` runners, and lefthook pre-push gates referencing them; sandbox catalog UI sits alongside but is independent. Cross-platform parity tests have been brittle and high-failure-rate (HUMAN SIGNAL 2026-05-04).

**Gap:** Sprint 05 replaces pixel-diff snapshot parity with a vision-LLM design-review pipeline; snapshot infra must be removed cleanly before Phase 1 reference assets land.

--------------------------------------------------------------------------------
REVIEW (for code-reviewer)
--------------------------------------------------------------------------------

Must pass:
- All four toolchain builds green after deletion
- Sandbox catalog UI still navigable in debug builds
- Zero live references to removed scripts in source (.spec/ exempt)
- RULES.md canonical-id naming spec text preserved verbatim
- SandboxSnapshotTestBase.kt deletion guarded by importer-check evidence

Should verify:
- RULES.md annotation references sprint-05 folder explicitly
- Git history shows clean deletion commits (no leftover `.png` in `__Snapshots__`)
- Commit message references FID-S05-T01

Verdict: APPROVED | NEEDS_FIXES
Domain reviewer: code-reviewer

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends on: (none — first task in sprint)
Blocks:     FID-S05-T02, FID-S05-T03, FID-S05-T04
Parallel:   (none)

================================================================================

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{"requirements":[{"id":"AC-1","type":"acceptance_criterion","description":"All snapshot files + parity manifests + scripts/snapshots removed","verify":"git ls-files | grep -E '(StorySnapshotTests\\.swift|AllStoriesSnapshotTest\\.kt|tokens/sandbox/(snapshots\\.parity|parity-thresholds|parity-exemptions)\\.json|scripts/snapshots/)' | wc -l | grep -q '^0$'","maps_to_ac":null,"satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null},{"id":"AC-2","type":"acceptance_criterion","description":"package.json + lefthook.yml have no snapshot script references","verify":"! grep -E 'snapshots:(check|record|sync-manifest|parity-report|parity-coverage)' package.json lefthook.yml","maps_to_ac":null,"satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null},{"id":"AC-3","type":"acceptance_criterion","description":"TS typecheck + iOS build + Android build all green","verify":"pnpm type-check:native && cd ios && xcodebuild -project LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' build && cd ../android && ./gradlew :app:assembleDebug","maps_to_ac":null,"satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null},{"id":"AC-4","type":"acceptance_criterion","description":"Sandbox catalog UI preserved + canonical-id naming spec annotated","verify":"git ls-files | grep -q LaneShadowStories && grep -q 'Cross-Platform Component Parity' RULES.md","maps_to_ac":null,"satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null},{"id":"AC-5","type":"acceptance_criterion","description":"No live references to removed scripts in source","verify":"! git grep -nE 'snapshots:check|scripts/snapshots/' -- ':!.spec/**' ':!**/CHANGELOG*'","maps_to_ac":null,"satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null},{"id":"TC-1","type":"test_criterion","description":"Snapshot files absent","verify":"git ls-files | grep -E 'StorySnapshotTests|AllStoriesSnapshotTest' | wc -l | grep -q '^0$'","maps_to_ac":"AC-1","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null},{"id":"TC-2","type":"test_criterion","description":"package.json has no snapshots scripts","verify":"! grep -E '\"snapshots:' package.json","maps_to_ac":"AC-2","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null},{"id":"TC-3","type":"test_criterion","description":"lefthook has no snapshot entries","verify":"! grep -E 'snapshots:(check|parity-coverage)' lefthook.yml","maps_to_ac":"AC-2","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null},{"id":"TC-4","type":"test_criterion","description":"Native typecheck passes","verify":"pnpm type-check:native","maps_to_ac":"AC-3","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null},{"id":"TC-5","type":"test_criterion","description":"iOS builds clean","verify":"cd ios && xcodebuild -project LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' build","maps_to_ac":"AC-3","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null},{"id":"TC-6","type":"test_criterion","description":"Android builds clean","verify":"cd android && ./gradlew :app:assembleDebug","maps_to_ac":"AC-3","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null},{"id":"TC-7","type":"test_criterion","description":"Base class deletion guarded by importer check","verify":"! git grep -n 'SandboxSnapshotTestBase' android/","maps_to_ac":"AC-1","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null},{"id":"TC-8","type":"test_criterion","description":"Sandbox stories file present","verify":"git ls-files | grep -q LaneShadowStories","maps_to_ac":"AC-4","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null},{"id":"TC-9","type":"test_criterion","description":"Canonical-id naming spec preserved","verify":"grep -q 'Cross-Platform Component Parity' RULES.md","maps_to_ac":"AC-4","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null}]}
-->
