================================================================================
TASK: FID-S05-T06 - Calibration set + prompt tuning to ≥85% precision/recall
================================================================================

TASK_TYPE:  FEATURE
STATUS:     In Progress
PRIORITY:   P0
EFFORT:     XL
AGENT:      implementer=convex-implementer | reviewer=convex-reviewer
SPRINT:     [sprint-05-design-review-pipeline](./SPRINT.md)
ESTIMATE:   480 min

RUNTIME_COMMANDS:
  test:      pnpm tsx scripts/design-review/__tests__/<file>
  typecheck: pnpm type-check:native
  lint:      pnpm exec biome check --no-errors-on-unmatched scripts/design-review/

PROGRESS: AC-1 ✓ AC-3 ✓ AC-4 ✓ · AC-2 partial (stub round-1.json) · AC-5 partial (code reads locked prompt but file absent) · AC-6 partial (rounds.md has stub Round 1) · 3/6 complete

--------------------------------------------------------------------------------
OUTCOME
--------------------------------------------------------------------------------

Author a hand-labeled golden set, iterate the eval prompt to ≥85% precision/recall on 10 calibration entries, validate on 5 held-out entries, and lock the prompt.

--------------------------------------------------------------------------------
🚫 CRITICAL CONSTRAINTS
--------------------------------------------------------------------------------

- MUST refuse to lock the prompt unless precision AND recall both ≥ 0.85 on the 10-entry calibration set
- MUST hold out 5 entries from prompt iteration to test for overfitting
- MUST track each calibration round in `.spec/design/calibration/rounds.md`
- NEVER modify the locked prompt after promotion (`prompts/visual-eval.locked.md` is immutable)
- NEVER use held-out entries during prompt tuning; STRICTLY held-out test set may drop ≤5pp from calibration set scores

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

- [x] AC-1: 15-entry hand-labeled `golden-set.json` committed (8 passing + 5 single-issue + 2 multi-issue) ✓ reviewer confirmed
- [ ] AC-2: `calibrate.ts` computes precision/recall vs labels and emits round JSONs [PRIMARY] — PARTIAL: framework correct but round-1.json contains stub/fabricated 85% scores; must delete stub and run real calibration
- [x] AC-3: Lock step refuses promotion when precision OR recall < 0.85 ✓ reviewer confirmed
- [x] AC-4: Held-out 5 entries used only for validation; ≤5pp drift to lock ✓ reviewer confirmed
- [ ] AC-5: `prompts/visual-eval.locked.md` created and read by visual-eval.ts when present — PARTIAL: visual-eval.ts reads locked path correctly but locked prompt file does not exist yet (correct: cannot create until real calibration ≥85%)
- [ ] AC-6: `rounds.md` tracks each iteration with diffs + scores — PARTIAL: rounds.md has stub Round 1 entry; needs deletion or replacement with real round data

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA (TDD beads)
--------------------------------------------------------------------------------

AC-1: Golden set authored with 15 hand-labeled entries
  GIVEN: design system + injection branches
  WHEN:  .spec/design/calibration/golden-set.json is committed
  THEN:  File contains 15 entries (8 passing + 5 single-issue regressions covering spacing/color/typography weight/overflow/missing + 2 multi-issue) with `expected_issues: [{component, issue_type, severity}]`
  TDD_STATE:     none
  TEST_FILE:     scripts/design-review/__tests__/validate-golden-set.ts
  TEST_FUNCTION: schema verification
  VERIFY:        pnpm tsx scripts/design-review/__tests__/validate-golden-set.ts

AC-2: calibrate.ts computes precision and recall against labels [PRIMARY]
  GIVEN: Visual-eval engine + golden set
  WHEN:  pnpm design:calibrate runs
  THEN:  Calibration runner evaluates 10 calibration entries (5 held out), computes per-round precision/recall, and writes .design-review/calibration/round-{n}.json
  TDD_STATE:     none
  TEST_FILE:     scripts/design-review/__tests__/calibrate.test.ts
  TEST_FUNCTION: test_precision_recall_computed
  VERIFY:        pnpm tsx scripts/design-review/__tests__/calibrate.test.ts

AC-3: Lock refused below 85%
  GIVEN: Calibration round produces precision OR recall < 0.85
  WHEN:  calibrate attempts to lock prompt
  THEN:  Process refuses to write prompts/visual-eval.locked.md and exits non-zero with diagnostics
  TDD_STATE:     none
  TEST_FILE:     scripts/design-review/__tests__/calibrate-lock-refusal.test.ts
  TEST_FUNCTION: test_lock_refused_below_threshold
  VERIFY:        pnpm tsx scripts/design-review/__tests__/calibrate-lock-refusal.test.ts

AC-4: Held-out validation ≤5pp drop
  GIVEN: Locked prompt achieves ≥85% on calibration set
  WHEN:  calibrate evaluates held-out 5 entries
  THEN:  Held-out precision and recall both within 5 percentage points of calibration scores; otherwise lock is reverted
  TDD_STATE:     none
  TEST_FILE:     scripts/design-review/__tests__/calibrate-holdout.test.ts
  TEST_FUNCTION: test_holdout_drift_within_5pp
  VERIFY:        pnpm tsx scripts/design-review/__tests__/calibrate-holdout.test.ts

AC-5: Locked prompt promoted and read by eval engine
  GIVEN: Calibration passes
  WHEN:  Lock step runs
  THEN:  scripts/design-review/prompts/visual-eval.locked.md is created (copy of tuned visual-eval.md) and visual-eval.ts reads from .locked.md when present
  TDD_STATE:     none
  TEST_FILE:     scripts/design-review/visual-eval.ts
  TEST_FUNCTION: grep verification
  VERIFY:        test -f scripts/design-review/prompts/visual-eval.locked.md && grep -q 'visual-eval.locked.md' scripts/design-review/visual-eval.ts

AC-6: Calibration history tracked in rounds.md
  GIVEN: Multiple iterations
  WHEN:  Round completes
  THEN:  .spec/design/calibration/rounds.md gains an entry summarizing diffs + precision/recall for that round
  TDD_STATE:     none
  TEST_FILE:     .spec/design/calibration/rounds.md
  TEST_FUNCTION: grep verification
  VERIFY:        grep -cE '^## Round [0-9]+' .spec/design/calibration/rounds.md | awk '{ if ($1 < 1) exit 1 }'

--------------------------------------------------------------------------------
TEST CRITERIA
--------------------------------------------------------------------------------

| ID | Statement | Maps to | Verify |
|----|-----------|---------|--------|
| TC-1 | Golden set has 15 entries with required regression categories | AC-1 | `pnpm tsx scripts/design-review/__tests__/validate-golden-set.ts` |
| TC-2 | Precision matches labeled-issue overlap formula | AC-2 | `pnpm tsx scripts/design-review/__tests__/precision-formula.test.ts` |
| TC-3 | Recall matches labeled-issue coverage formula | AC-2 | `pnpm tsx scripts/design-review/__tests__/recall-formula.test.ts` |
| TC-4 | Lock step refuses below threshold | AC-3 | `pnpm tsx scripts/design-review/__tests__/calibrate-lock-refusal.test.ts` |
| TC-5 | Held-out drift refusal triggers revert | AC-4 | `pnpm tsx scripts/design-review/__tests__/calibrate-holdout.test.ts --case=drift` |
| TC-6 | Locked prompt path is loaded preferentially when present | AC-5 | `pnpm tsx scripts/design-review/__tests__/locked-prompt-preference.test.ts` |
| TC-7 | rounds.md gains structured headers per round | AC-6 | `grep -cE '^## Round [0-9]+' .spec/design/calibration/rounds.md` |
| TC-8 | TS typecheck passes | AC-2 | `pnpm type-check:native` |

--------------------------------------------------------------------------------
SCOPE
--------------------------------------------------------------------------------

writeAllowed:
- .spec/design/calibration/golden-set.json (NEW)
- .spec/design/calibration/rounds.md (NEW)
- scripts/design-review/calibrate.ts (NEW)
- scripts/design-review/prompts/visual-eval.md (MODIFY — iterate during tuning)
- scripts/design-review/prompts/visual-eval.locked.md (NEW — created on lock; immutable thereafter)
- scripts/design-review/visual-eval.ts (MODIFY — read locked path when present)
- scripts/design-review/__tests__/*.ts (NEW)
- package.json (MODIFY — add design:calibrate script)

writeProhibited:
- .spec/design/calibration/golden-set.json (after first commit) — mutating labels invalidates calibration; needs new round, not an edit
- scripts/design-review/prompts/visual-eval.locked.md (after creation) — immutable post-lock; produces a new round if behavior must change

--------------------------------------------------------------------------------
BOUNDARIES
--------------------------------------------------------------------------------

✅ Always:
- Use deterministic seed for the held-out 5-entry split
- Re-run held-out validation after every prompt edit
- Refuse silent lock; require both precision AND recall ≥ 0.85
- Append to `rounds.md` (never overwrite history)

⚠️ Ask First:
- If precision/recall plateau below 85% after 10 rounds (escalate prompt strategy decision)
- If held-out drift > 5pp suggests overfitting or annotation gap

--------------------------------------------------------------------------------
DELIVERABLE
--------------------------------------------------------------------------------

- .spec/design/calibration/golden-set.json (NEW): hand-labeled fixture
- scripts/design-review/calibrate.ts (NEW): calibration runner
- .spec/design/calibration/rounds.md (NEW): iteration history (append-only)
- scripts/design-review/prompts/visual-eval.locked.md (NEW): promoted prompt
- scripts/design-review/visual-eval.ts (MODIFY): read locked prompt when present
- package.json (MODIFY): design:calibrate script

--------------------------------------------------------------------------------
AGENT INSTRUCTIONS (TDD Flow)
--------------------------------------------------------------------------------

Standard RED → GREEN → REFACTOR per AC. Strategy: AC-1 first (author golden set with 15 entries — this is judgment-heavy work; consult plan Phase 6). Then AC-2 (calibrate runner emitting round JSONs). Then AC-3 (lock-refusal guard). Then AC-4 (held-out drift check). Iterate prompts/visual-eval.md across rounds 1..N until AC-3 lock succeeds. Then AC-5 (locked path swap in visual-eval.ts). Throughout, AC-6 (rounds.md append) is a continuous discipline.

For prompt iteration: keep the system prompt skeleton from article §3.1; tune phrasing of "compare spacing, color, typography, placement" + the JSON output schema reminder until precision/recall converge.

--------------------------------------------------------------------------------
READING LIST
--------------------------------------------------------------------------------

1. /Users/justinrich/.claude/plans/plan-a-design-review-logical-clock.md [PRIMARY PATTERN]
   - Section: Phase 6 calibration
   - Focus: Threshold (≥85%), holdout (5 of 15), round tracking discipline

2. /Users/justinrich/Projects/LaneShadow/scripts/design-review/visual-eval.ts (after T05)
   - Lines: prompt loader
   - Focus: How locked-path swap should work

3. /Users/justinrich/Projects/LaneShadow/scripts/design-review/schemas/visual-issue.zod.ts (after T05)
   - Lines: full file
   - Focus: Issue shape used to score predictions

--------------------------------------------------------------------------------
EVIDENCE GATES
--------------------------------------------------------------------------------

Gate 1: Golden set valid
  Command:  pnpm tsx scripts/design-review/__tests__/validate-golden-set.ts
  Expected: exit 0

Gate 2: Calibration ≥85%
  Command:  pnpm design:calibrate --verify-locked
  Expected: precision >= 0.85 AND recall >= 0.85

Gate 3: Holdout within 5pp
  Command:  pnpm tsx scripts/design-review/__tests__/calibrate-holdout.test.ts
  Expected: exit 0

Gate 4: Locked prompt exists
  Command:  test -f scripts/design-review/prompts/visual-eval.locked.md
  Expected: exit 0

Gate 5: rounds.md non-empty
  Command:  grep -cE '^## Round [0-9]+' .spec/design/calibration/rounds.md
  Expected: >= 1

--------------------------------------------------------------------------------
OUT OF SCOPE
--------------------------------------------------------------------------------

- Tuning behavioral fidelity prompts (article §3.2 — deferred entire sprint)
- Building the merged report (T07)
- Re-eval iteration loop (T09)

--------------------------------------------------------------------------------
CONTEXT
--------------------------------------------------------------------------------

**Current state:** T05 ships an unlocked prompt; precision and recall on real fixtures are unknown.

**Gap:** Sprint gate requires the LLM judge to hit ≥85% precision/recall before downstream merge/report and re-eval rely on its output. Without calibration the pipeline produces noisy issues that erode trust in the fix-agent loop.

**Reviewer findings (2026-05-04):**
- Code exists from commit `7b138092` — framework is correct
- AC-1 (golden set), AC-3 (lock refusal), AC-4 (held-out drift) confirmed PASS
- AC-2 PARTIAL: `.design-review/calibration/round-1.json` contains fabricated 85% scores — DELETE this file and run real calibration
- AC-5 PARTIAL: code reads `visual-eval.locked.md` when present, but file doesn't exist yet — correct behavior, will be created when real calibration passes
- AC-6 PARTIAL: `.spec/design/calibration/rounds.md` has stub Round 1 entry — DELETE or replace with real round data
- Missing test files: `precision-formula.test.ts` and `recall-formula.test.ts` — must create these

**Remediation plan:**
1. Delete stub `round-1.json` and stub `rounds.md` Round 1 entry
2. Create `precision-formula.test.ts` + `recall-formula.test.ts`
3. Run real calibration against auth-screen states only (v0 scope)
4. When ≥85% precision/recall achieved, promote to `visual-eval.locked.md`

--------------------------------------------------------------------------------
REVIEW (for convex-reviewer)
--------------------------------------------------------------------------------

Must pass:
- Lock refused unless both precision and recall ≥ 0.85
- Held-out 5 entries used only for validation (never for tuning)
- rounds.md captures every iteration with diffs

Should verify:
- Locked prompt path swap in visual-eval.ts is backward-compatible (engine still works without locked file in dev)
- Multi-issue golden entries actually surface multiple expected issues
- Held-out split is deterministic (same seed across runs)

Verdict: APPROVED | NEEDS_FIXES
Domain reviewer: convex-reviewer

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends on: FID-S05-T05
Blocks:     FID-S05-T07, FID-S05-T08
Parallel:   (none)

================================================================================

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{"requirements":[{"id":"AC-1","type":"acceptance_criterion","description":"15-entry golden set with hand labels","verify":"pnpm tsx scripts/design-review/__tests__/validate-golden-set.ts","maps_to_ac":null,"satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null},{"id":"AC-2","type":"acceptance_criterion","description":"calibrate.ts computes precision/recall and emits round files","verify":"pnpm tsx scripts/design-review/__tests__/calibrate.test.ts","maps_to_ac":null,"satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null},{"id":"AC-3","type":"acceptance_criterion","description":"Lock refused below 85% threshold","verify":"pnpm tsx scripts/design-review/__tests__/calibrate-lock-refusal.test.ts","maps_to_ac":null,"satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null},{"id":"AC-4","type":"acceptance_criterion","description":"Held-out drift within 5pp","verify":"pnpm tsx scripts/design-review/__tests__/calibrate-holdout.test.ts","maps_to_ac":null,"satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null},{"id":"AC-5","type":"acceptance_criterion","description":"Locked prompt promoted + read by engine","verify":"test -f scripts/design-review/prompts/visual-eval.locked.md && grep -q 'visual-eval.locked.md' scripts/design-review/visual-eval.ts","maps_to_ac":null,"satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null},{"id":"AC-6","type":"acceptance_criterion","description":"rounds.md tracks calibration history","verify":"grep -cE '^## Round [0-9]+' .spec/design/calibration/rounds.md | awk '{ if ($1 < 1) exit 1 }'","maps_to_ac":null,"satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null},{"id":"TC-1","type":"test_criterion","description":"Golden set schema check","verify":"pnpm tsx scripts/design-review/__tests__/validate-golden-set.ts","maps_to_ac":"AC-1","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null},{"id":"TC-2","type":"test_criterion","description":"Precision formula","verify":"pnpm tsx scripts/design-review/__tests__/precision-formula.test.ts","maps_to_ac":"AC-2","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null},{"id":"TC-3","type":"test_criterion","description":"Recall formula","verify":"pnpm tsx scripts/design-review/__tests__/recall-formula.test.ts","maps_to_ac":"AC-2","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null},{"id":"TC-4","type":"test_criterion","description":"Lock refusal","verify":"pnpm tsx scripts/design-review/__tests__/calibrate-lock-refusal.test.ts","maps_to_ac":"AC-3","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null},{"id":"TC-5","type":"test_criterion","description":"Holdout drift refusal","verify":"pnpm tsx scripts/design-review/__tests__/calibrate-holdout.test.ts --case=drift","maps_to_ac":"AC-4","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null},{"id":"TC-6","type":"test_criterion","description":"Locked prompt preference","verify":"pnpm tsx scripts/design-review/__tests__/locked-prompt-preference.test.ts","maps_to_ac":"AC-5","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null},{"id":"TC-7","type":"test_criterion","description":"rounds.md headers present","verify":"grep -cE '^## Round [0-9]+' .spec/design/calibration/rounds.md","maps_to_ac":"AC-6","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null},{"id":"TC-8","type":"test_criterion","description":"Native typecheck","verify":"pnpm type-check:native","maps_to_ac":"AC-2","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null}]}
-->
