================================================================================
TASK: FID-S05-T08 - Claude Code design-review skill orchestrating one-shot pipeline
================================================================================

TASK_TYPE:  FEATURE
STATUS:     Backlog
PRIORITY:   P0
EFFORT:     M
AGENT:      implementer=convex-implementer | reviewer=convex-reviewer
SPRINT:     [sprint-05-design-review-pipeline](./SPRINT.md)
ESTIMATE:   180 min

RUNTIME_COMMANDS:
  test:      pnpm tsx scripts/design-review/__tests__/<file>
  typecheck: pnpm type-check:native
  lint:      pnpm exec biome check --no-errors-on-unmatched scripts/design-review/

PROGRESS: AC-1 not started · 0/6 complete

--------------------------------------------------------------------------------
OUTCOME
--------------------------------------------------------------------------------

Author a Claude Code design-review skill plus a `pnpm design:review` umbrella that drives the full pipeline (references → capture → export → manifest → eval → report) and parses report.json into the article §6 schema.

--------------------------------------------------------------------------------
🚫 CRITICAL CONSTRAINTS
--------------------------------------------------------------------------------

- MUST place SKILL.md at `~/.claude/skills/design-review/` (outside project tree)
- MUST accept skill input schema `{ screens?, severity_threshold?, dry_run? }`
- MUST honor `pnpm design:review` flags `--screens`, `--severity-threshold`, `--dry-run`
- MUST return article §6 shape: `{ issues, summary: { total, high, med, low, screens_passed, screens_failed } }`
- NEVER duplicate logic from T07 merge-report; STRICTLY shell out to `pnpm design:report`
- STRICTLY description triggers on phrases: "run design review", "check design fidelity", "verify UI matches the design system"

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

- [ ] AC-1: SKILL.md authored at correct path with frontmatter triggers
- [ ] AC-2: `pnpm design:review` umbrella orchestrates full pipeline; halts on any step failure [PRIMARY]
- [ ] AC-3: `--screens` filter narrows test class + manifest scope
- [ ] AC-4: `--severity-threshold` flag piped through to merge-report via env var
- [ ] AC-5: `--dry-run` returns manifest only (no xcodebuild, eval, or report)
- [ ] AC-6: Skill output conforms to article §6 schema

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA (TDD beads)
--------------------------------------------------------------------------------

AC-1: SKILL.md authored at correct path with frontmatter triggers
  GIVEN: ~/.claude/skills/design-review/ does not exist
  WHEN:  Skill author lands changes
  THEN:  ~/.claude/skills/design-review/SKILL.md exists with frontmatter `name: design-review` and description containing the three trigger phrases
  TDD_STATE:     none
  TEST_FILE:     /Users/justinrich/.claude/skills/design-review/SKILL.md
  TEST_FUNCTION: grep verification
  VERIFY:        test -f /Users/justinrich/.claude/skills/design-review/SKILL.md && grep -q 'name: design-review' /Users/justinrich/.claude/skills/design-review/SKILL.md && grep -q 'run design review' /Users/justinrich/.claude/skills/design-review/SKILL.md

AC-2: pnpm design:review umbrella orchestrates full pipeline [PRIMARY]
  GIVEN: All Phase scripts exist (T02, T03, T04, T05, T06, T07)
  WHEN:  pnpm design:review runs
  THEN:  Sequence executes: design:references → capture (xcodebuild test) → design:export → design:manifest → design:eval → design:report; non-zero on any step failure
  TDD_STATE:     none
  TEST_FILE:     scripts/design-review/__tests__/run-sequence.test.ts
  TEST_FUNCTION: test_pipeline_sequence
  VERIFY:        pnpm tsx scripts/design-review/__tests__/run-sequence.test.ts

AC-3: --screens filter narrows test class + manifest
  GIVEN: Multi-screen capture suite exists
  WHEN:  pnpm design:review --screens auth-screen,idle-screen runs
  THEN:  Only auth-screen and idle-screen are captured/evaluated/reported (xcodebuild -only-testing filtered + manifest entries filtered)
  TDD_STATE:     none
  TEST_FILE:     scripts/design-review/__tests__/run-screens-filter.test.ts
  TEST_FUNCTION: test_screens_filter
  VERIFY:        pnpm tsx scripts/design-review/__tests__/run-screens-filter.test.ts

AC-4: --severity-threshold flag piped through to merge-report
  GIVEN: Mixed severity issues
  WHEN:  pnpm design:review --severity-threshold low runs
  THEN:  DESIGN_REVIEW_SEVERITY=low is propagated to design:report
  TDD_STATE:     none
  TEST_FILE:     scripts/design-review/__tests__/run-severity.test.ts
  TEST_FUNCTION: test_severity_propagation
  VERIFY:        pnpm tsx scripts/design-review/__tests__/run-severity.test.ts

AC-5: --dry-run returns manifest only
  GIVEN: Pipeline supports dry-run mode
  WHEN:  pnpm design:review --dry-run runs
  THEN:  Pipeline stops after manifest build and skill returns the manifest entries without running xcodebuild test, eval, or report
  TDD_STATE:     none
  TEST_FILE:     scripts/design-review/__tests__/run-dry.test.ts
  TEST_FUNCTION: test_dry_run_mode
  VERIFY:        pnpm tsx scripts/design-review/__tests__/run-dry.test.ts

AC-6: Skill output conforms to article §6 schema
  GIVEN: report.json exists
  WHEN:  Skill parses it
  THEN:  Returned object has issues[] and summary with keys total, high, med, low, screens_passed, screens_failed
  TDD_STATE:     none
  TEST_FILE:     scripts/design-review/__tests__/skill-output-shape.test.ts
  TEST_FUNCTION: test_skill_output
  VERIFY:        pnpm tsx scripts/design-review/__tests__/skill-output-shape.test.ts

--------------------------------------------------------------------------------
TEST CRITERIA
--------------------------------------------------------------------------------

| ID | Statement | Maps to | Verify |
|----|-----------|---------|--------|
| TC-1 | Skill file present at home-relative path | AC-1 | `test -f /Users/justinrich/.claude/skills/design-review/SKILL.md` |
| TC-2 | Three trigger phrases present in description | AC-1 | grep all three: 'run design review', 'check design fidelity', 'verify UI matches the design system' |
| TC-3 | Pipeline halts non-zero on any step failure | AC-2 | `pnpm tsx scripts/design-review/__tests__/run-failure-propagation.test.ts` |
| TC-4 | --screens filter prunes captures | AC-3 | `pnpm tsx scripts/design-review/__tests__/run-screens-filter.test.ts` |
| TC-5 | --severity-threshold flows via env var | AC-4 | `pnpm tsx scripts/design-review/__tests__/run-severity.test.ts` |
| TC-6 | --dry-run skips capture/eval/report | AC-5 | `pnpm tsx scripts/design-review/__tests__/run-dry.test.ts` |
| TC-7 | Skill output schema matches §6 | AC-6 | `pnpm tsx scripts/design-review/__tests__/skill-output-shape.test.ts` |
| TC-8 | TS typecheck passes | AC-2 | `pnpm type-check:native` |

--------------------------------------------------------------------------------
SCOPE
--------------------------------------------------------------------------------

writeAllowed:
- /Users/justinrich/.claude/skills/design-review/SKILL.md (NEW — outside project tree)
- scripts/design-review/run.ts (NEW — umbrella orchestrator)
- scripts/design-review/__tests__/*.ts (NEW)
- package.json (MODIFY — add design:review umbrella script)

writeProhibited:
- scripts/design-review/visual-eval.ts — owned by T05
- scripts/design-review/merge-report.ts — owned by T07
- ios/** — capture suite owned by T03

--------------------------------------------------------------------------------
BOUNDARIES
--------------------------------------------------------------------------------

✅ Always:
- Shell out to existing `pnpm` scripts via `child_process.spawn` (or equivalent); do not duplicate their logic
- Document skill triggers in description so router selection is reliable
- Propagate non-zero exit codes from any sub-step

⚠️ Ask First:
- If umbrella needs to support extra flags beyond `--screens`, `--severity-threshold`, `--dry-run`

--------------------------------------------------------------------------------
DELIVERABLE
--------------------------------------------------------------------------------

- /Users/justinrich/.claude/skills/design-review/SKILL.md (NEW): Claude Code skill entry with frontmatter triggers
- scripts/design-review/run.ts (NEW): umbrella orchestrator
- package.json (MODIFY): design:review script

--------------------------------------------------------------------------------
AGENT INSTRUCTIONS (TDD Flow)
--------------------------------------------------------------------------------

Standard RED → GREEN → REFACTOR per AC. Strategy: AC-2 (orchestrator) first since AC-3/4/5 are flag variations on it. Then AC-1 (SKILL.md). Then AC-6 (output parsing). The flag tests (AC-3/4/5) are quick once AC-2 is solid.

For AC-2: implement `run.ts` as a thin sequencer using `child_process.spawn` with `stdio: 'inherit'` and check exit codes. For AC-1: SKILL.md frontmatter description should be one paragraph including all three trigger phrases verbatim. For AC-6: parse `.design-review/report.json` and reshape to article §6 (count by severity, derive screens_passed/failed from per-screen issue presence).

--------------------------------------------------------------------------------
READING LIST
--------------------------------------------------------------------------------

1. /Users/justinrich/.claude/plans/plan-a-design-review-logical-clock.md [PRIMARY PATTERN]
   - Sections: Phase 8 + article §6
   - Focus: Skill input + output schema

2. /Users/justinrich/.claude/skills/ (browse a few existing SKILL.md files)
   - Focus: Frontmatter format conventions

3. /Users/justinrich/Projects/LaneShadow/package.json
   - Section: scripts block
   - Focus: Existing design:* scripts to compose

--------------------------------------------------------------------------------
EVIDENCE GATES
--------------------------------------------------------------------------------

Gate 1: Skill present
  Command:  test -f /Users/justinrich/.claude/skills/design-review/SKILL.md
  Expected: exit 0

Gate 2: Pipeline orchestration test
  Command:  pnpm tsx scripts/design-review/__tests__/run-sequence.test.ts
  Expected: exit 0

Gate 3: Flag tests
  Command:  pnpm tsx scripts/design-review/__tests__/run-screens-filter.test.ts && pnpm tsx scripts/design-review/__tests__/run-severity.test.ts && pnpm tsx scripts/design-review/__tests__/run-dry.test.ts
  Expected: exit 0

Gate 4: Skill output shape
  Command:  pnpm tsx scripts/design-review/__tests__/skill-output-shape.test.ts
  Expected: exit 0

Gate 5: TS typecheck
  Command:  pnpm type-check:native
  Expected: exit 0

--------------------------------------------------------------------------------
OUT OF SCOPE
--------------------------------------------------------------------------------

- Re-eval iteration loop (T09)
- Smoke test + docs (T10)
- Implementing capture suite (T03) or eval engine (T05)

--------------------------------------------------------------------------------
CONTEXT
--------------------------------------------------------------------------------

**Current state:** Individual phases (references/capture/export/manifest/eval/report) are wired but require manual `pnpm` invocations; no Claude Code skill entry exists.

**Gap:** Sprint gate requires a single command and a skill that drive the entire pipeline and return a fix-agent-friendly summary in article §6 shape.

--------------------------------------------------------------------------------
REVIEW (for convex-reviewer)
--------------------------------------------------------------------------------

Must pass:
- Skill file at correct path (~/.claude/skills/design-review/) with required triggers
- Pipeline halts on any step failure (non-zero exit propagated)
- All three flags exercised end-to-end with passing tests

Should verify:
- Skill description is concise and unambiguous for router selection
- Umbrella script is thin (delegates to pnpm scripts; no duplicated logic)
- Article §6 output shape exactly matches: `{ issues, summary: { total, high, med, low, screens_passed, screens_failed } }`

Verdict: APPROVED | NEEDS_FIXES
Domain reviewer: convex-reviewer

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends on: FID-S05-T07
Blocks:     FID-S05-T09, FID-S05-T10
Parallel:   (none)

================================================================================

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{"requirements":[{"id":"AC-1","type":"acceptance_criterion","description":"SKILL.md authored with triggers","verify":"test -f /Users/justinrich/.claude/skills/design-review/SKILL.md && grep -q 'name: design-review' /Users/justinrich/.claude/skills/design-review/SKILL.md","maps_to_ac":null,"satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null},{"id":"AC-2","type":"acceptance_criterion","description":"design:review umbrella orchestrates pipeline","verify":"pnpm tsx scripts/design-review/__tests__/run-sequence.test.ts","maps_to_ac":null,"satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null},{"id":"AC-3","type":"acceptance_criterion","description":"--screens filter narrows pipeline","verify":"pnpm tsx scripts/design-review/__tests__/run-screens-filter.test.ts","maps_to_ac":null,"satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null},{"id":"AC-4","type":"acceptance_criterion","description":"--severity-threshold propagated","verify":"pnpm tsx scripts/design-review/__tests__/run-severity.test.ts","maps_to_ac":null,"satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null},{"id":"AC-5","type":"acceptance_criterion","description":"--dry-run stops after manifest","verify":"pnpm tsx scripts/design-review/__tests__/run-dry.test.ts","maps_to_ac":null,"satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null},{"id":"AC-6","type":"acceptance_criterion","description":"Skill output matches §6 schema","verify":"pnpm tsx scripts/design-review/__tests__/skill-output-shape.test.ts","maps_to_ac":null,"satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null},{"id":"TC-1","type":"test_criterion","description":"SKILL.md file present","verify":"test -f /Users/justinrich/.claude/skills/design-review/SKILL.md","maps_to_ac":"AC-1","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null},{"id":"TC-2","type":"test_criterion","description":"Trigger phrases present","verify":"grep -q 'run design review' /Users/justinrich/.claude/skills/design-review/SKILL.md && grep -q 'check design fidelity' /Users/justinrich/.claude/skills/design-review/SKILL.md && grep -q 'verify UI matches the design system' /Users/justinrich/.claude/skills/design-review/SKILL.md","maps_to_ac":"AC-1","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null},{"id":"TC-3","type":"test_criterion","description":"Failure propagation","verify":"pnpm tsx scripts/design-review/__tests__/run-failure-propagation.test.ts","maps_to_ac":"AC-2","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null},{"id":"TC-4","type":"test_criterion","description":"--screens filter test","verify":"pnpm tsx scripts/design-review/__tests__/run-screens-filter.test.ts","maps_to_ac":"AC-3","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null},{"id":"TC-5","type":"test_criterion","description":"Severity propagation test","verify":"pnpm tsx scripts/design-review/__tests__/run-severity.test.ts","maps_to_ac":"AC-4","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null},{"id":"TC-6","type":"test_criterion","description":"Dry-run test","verify":"pnpm tsx scripts/design-review/__tests__/run-dry.test.ts","maps_to_ac":"AC-5","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null},{"id":"TC-7","type":"test_criterion","description":"Skill output shape","verify":"pnpm tsx scripts/design-review/__tests__/skill-output-shape.test.ts","maps_to_ac":"AC-6","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null},{"id":"TC-8","type":"test_criterion","description":"Native typecheck","verify":"pnpm type-check:native","maps_to_ac":"AC-2","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null}]}
-->
