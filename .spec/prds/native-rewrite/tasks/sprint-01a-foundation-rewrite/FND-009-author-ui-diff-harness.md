================================================================================
TASK: FND-009 - Author per-component screenshot-diff harness
================================================================================

TASK_TYPE: FEATURE
STATUS: Done
PRIORITY: P1
EFFORT: L
ESTIMATE: 480 min
AGENT: devops-engineer
SPRINT: sprint-01a-foundation-rewrite

--------------------------------------------------------------------------------
GOAL
--------------------------------------------------------------------------------

Implement a per-component screenshot-diff harness that captures RN/Android/iOS screenshots and detects pixel-level variance at commit time, catching drift early instead of at Phase G.

--------------------------------------------------------------------------------
DELIVERABLE
--------------------------------------------------------------------------------

- scripts/ui-diff/capture-rn.ts (NEW): RN Storybook screenshot capture
- scripts/ui-diff/capture-android.ts (NEW): Android Compose screenshot capture
- scripts/ui-diff/capture-ios.ts (NEW): iOS SwiftUI screenshot capture
- scripts/ui-diff/compare.ts (NEW): Pixel diff with configurable ±1px tolerance
- scripts/ui-diff/variance-schema.ts (NEW): Variance report JSON schema
- scripts/ui-diff/README.md (NEW): Usage documentation
- package.json (MODIFY): Add ui:diff npm script
- .lefthook.yml (MODIFY): Add opt-in pre-push gate

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

- [x] All 5 TypeScript scripts exist in scripts/ui-diff/
- [x] pnpm ui:diff script wired and runs full harness
- [x] lefthook pre-push gate is opt-in (git config lane-shadow.ui-diff.enabled)
- [x] README.md documents usage, setup, and CI/CD integration
- [x] `pnpm type-check:native` passes for all scripts
- [x] Variance reports conform to variance-schema.ts

--------------------------------------------------------------------------------
OUT OF SCOPE
--------------------------------------------------------------------------------

- Writing native UI components
- Creating Storybook stories
- Setting up CI/CD pipeline integration

--------------------------------------------------------------------------------
CRITICAL CONSTRAINTS
--------------------------------------------------------------------------------

MUST:
- capture-rn.ts MUST capture to screenshots/rn/baseline/{component-name}.png
- capture-android.ts MUST capture to screenshots/android/baseline/{component-name}.png
- capture-ios.ts MUST capture to screenshots/ios/baseline/{component-name}.png
- compare.ts MUST use configurable tolerance (default ±1px) per 08d parity spec
- variance-schema.ts MUST define JSON schema for CI/CD consumption
- pnpm ui:diff MUST run full harness: capture RN + Android + iOS + compare + report
- lefthook pre-push gate MUST be opt-in via git config

NEVER:
- Hard-code platform-specific paths — use cross-platform path libraries
- Assume emulator/simulator is running — scripts must detect and prompt
- Block pushes by default — lefthook gate must be opt-in

STRICTLY:
- Name screenshots consistently: {component-name}.png across platforms
- Follow ±1px tolerance threshold for passing diffs
- Generate variance reports in JSON format for CI/CD
- Exit with code 1 if any component exceeds variance threshold

--------------------------------------------------------------------------------
SPECIFICATION
--------------------------------------------------------------------------------

**Objective**: Build screenshot-diff infrastructure that captures RN/Android/iOS component screenshots and detects pixel-level variance at commit time.

**Success looks like**: scripts/ui-diff/ contains all 5 scripts plus README; pnpm ui:diff runs the full harness; lefthook pre-push gate is opt-in; variance reports are machine-readable JSON.

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA
--------------------------------------------------------------------------------

AC-1: RN screenshot capture works
  GIVEN: React Native app is running with Storybook
  WHEN: capture-rn.ts is executed
  THEN: Screenshots captured to screenshots/rn/baseline/{component-name}.png
  TDD_STATE: [x] RED  [x] VERIFY_RED  [x] GREEN  [x] VERIFY_GREEN  [x] REFACTOR

AC-2: Android screenshot capture works
  GIVEN: Android emulator is running with app installed
  WHEN: capture-android.ts is executed
  THEN: Screenshots captured to screenshots/android/baseline/{component-name}.png
  TDD_STATE: [x] RED  [x] VERIFY_RED  [x] GREEN  [x] VERIFY_GREEN  [x] REFACTOR

AC-3: iOS screenshot capture works
  GIVEN: iOS simulator is running with app installed
  WHEN: capture-ios.ts is executed
  THEN: Screenshots captured to screenshots/ios/baseline/{component-name}.png
  TDD_STATE: [x] RED  [x] VERIFY_RED  [x] GREEN  [x] VERIFY_GREEN  [x] REFACTOR

AC-4: Pixel diff detects variance
  GIVEN: Baseline screenshots exist for all platforms
  WHEN: compare.ts is executed
  THEN: Diff images generated in screenshots/diff/ and variance.json report created
  TDD_STATE: [x] RED  [x] VERIFY_RED  [x] GREEN  [x] VERIFY_GREEN  [x] REFACTOR

AC-5: pnpm ui:diff runs full harness
  GIVEN: All platforms are available
  WHEN: pnpm ui:diff is executed
  THEN: Full harness runs, exits 0 for passing, 1 for failing diffs
  TDD_STATE: [x] RED  [x] VERIFY_RED  [x] GREEN  [x] VERIFY_GREEN  [x] REFACTOR

AC-6: lefthook pre-push gate is opt-in
  GIVEN: lefthook is configured with pre-push hook
  WHEN: User pushes without enabling ui-diff
  THEN: Push succeeds without running ui-diff
  TDD_STATE: [x] RED  [x] VERIFY_RED  [x] GREEN  [x] VERIFY_GREEN  [x] REFACTOR

--------------------------------------------------------------------------------
TEST CRITERIA
--------------------------------------------------------------------------------

| # | Statement | Maps to AC | Verify |
|---|-----------|:----------:|--------|
| 1 | capture-rn.ts captures to correct directory | AC-1 | Script creates PNGs in screenshots/rn/baseline/ |
| 2 | capture-android.ts captures to correct directory | AC-2 | Script creates PNGs in screenshots/android/baseline/ |
| 3 | capture-ios.ts captures to correct directory | AC-3 | Script creates PNGs in screenshots/ios/baseline/ |
| 4 | compare.ts generates variance report | AC-4 | screenshots/diff/variance.json exists |
| 5 | pnpm ui:diff exits correctly | AC-5 | Exit 0 for passing, 1 for failing |
| 6 | lefthook gate is opt-in | AC-6 | Push succeeds without config enabled |
| 7 | README documents usage | - | README exists with Usage and lefthook sections |

--------------------------------------------------------------------------------
READING LIST
--------------------------------------------------------------------------------

1. .lefthook.yml — Lines 1-100, existing hook configuration
2. package.json — Lines 1-100, NPM scripts configuration
3. .spec/prds/native-rewrite/08d-component-parity-spec.md — Lines 1-150, parity guarantees
4. react-native/.storybook/ — Lines 1-50, Storybook configuration
5. styles/RULES.md — Design system patterns for expected visual properties

--------------------------------------------------------------------------------
GUARDRAILS
--------------------------------------------------------------------------------

WRITE-ALLOWED:
- scripts/ui-diff/capture-rn.ts (NEW)
- scripts/ui-diff/capture-android.ts (NEW)
- scripts/ui-diff/capture-ios.ts (NEW)
- scripts/ui-diff/compare.ts (NEW)
- scripts/ui-diff/variance-schema.ts (NEW)
- scripts/ui-diff/README.md (NEW)
- package.json (MODIFY — add ui:diff script)
- .lefthook.yml (MODIFY — add opt-in pre-push hook)

WRITE-PROHIBITED:
- screenshots/** — outputs, not source code
- react-native/** — do not modify RN source
- matrices/** — do not modify matrices

--------------------------------------------------------------------------------
DESIGN
--------------------------------------------------------------------------------

**References**: 08d-component-parity-spec, .lefthook.yml, package.json

**Pattern**: Pixel diff using pngjs: iterate pixels, compare RGB channels, flag if abs(diff) > tolerance per channel. Generate diff image with highlighted mismatched pixels.

**Anti-pattern**: Hard-coding emulator/simulator detection — platforms change frequently; use adb/xcrun dynamically. Pixel-exact matching fails due to anti-aliasing — use ±1px tolerance per 08d.

--------------------------------------------------------------------------------
AGENT ASSIGNMENT
--------------------------------------------------------------------------------

**Implementation Agent**: devops-engineer
**Rationale**: Requires DevOps expertise to build screenshot capture infrastructure across platforms, implement image diff algorithms, and wire CI/CD integration.

**Review Agent**: code-reviewer — validates TypeScript quality and cross-platform patterns

--------------------------------------------------------------------------------
EVIDENCE GATES
--------------------------------------------------------------------------------

Gate 1: All scripts present
  Command: `ls -1 scripts/ui-diff/*.ts`
  Expected: Lists capture-rn.ts, capture-android.ts, capture-ios.ts, compare.ts, variance-schema.ts

Gate 2: pnpm ui:diff script exists
  Command: `grep -q '"ui:diff"' package.json`
  Expected: Exit 0

Gate 3: lefthook hook configured
  Command: `grep -A 10 'ui-diff' .lefthook.yml | grep -q 'run'`
  Expected: Exit 0

Gate 4: README present
  Command: `test -f scripts/ui-diff/README.md && wc -l scripts/ui-diff/README.md`
  Expected: File exists with > 50 lines

Gate 5: Type check
  Command: `pnpm type-check:native`
  Expected: Exit 0

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends On: (none — independent of all other FND tasks)

Blocks: (none — this is an independent utility)

--------------------------------------------------------------------------------
NOTES
--------------------------------------------------------------------------------

- Independent task — can run in parallel with FND-001 through FND-008
- Integrates with Sprint 2 execution for parity validation
- FAIL vs WARN distinction: parity violations FAIL, anti-aliasing diffs WARN
- Scripts should detect running emulators/simulators and provide clear error messages
