================================================================================
TASK: FID-S05-T09 - Re-eval loop with 3-iteration cap and before/after scoring
================================================================================

TASK_TYPE:  FEATURE
STATUS:     Backlog
PRIORITY:   P0
EFFORT:     S
AGENT:      implementer=convex-implementer | reviewer=convex-reviewer
SPRINT:     [sprint-05-design-review-pipeline](./SPRINT.md)
ESTIMATE:   120 min

RUNTIME_COMMANDS:
  test:      pnpm tsx scripts/design-review/__tests__/<file>
  typecheck: pnpm type-check:native
  lint:      pnpm exec biome check --no-errors-on-unmatched scripts/design-review/

PROGRESS: AC-1 not started · 0/5 complete

--------------------------------------------------------------------------------
OUTCOME
--------------------------------------------------------------------------------

Extend the design-review skill to support narrow-scoped fix-then-re-eval iterations capped at 3 with persisted before/after scores and a `force=true` bypass that resets the counter.

--------------------------------------------------------------------------------
🚫 CRITICAL CONSTRAINTS
--------------------------------------------------------------------------------

- MUST persist iteration state at `.design-review/iterations/{screen}.{state}.json` per article §6
- MUST cap at 3 iterations and emit `status: "max_iterations_reached"` when exceeded
- MUST refuse further runs without explicit `force=true` override
- NEVER reset iteration counters silently when scope narrows
- NEVER allow iteration 4+ without explicit force flag; STRICTLY each iteration record carries `{ iteration, before_score, current_score, max_iterations: 3 }`

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

- [ ] AC-1: Skill accepts narrow-scoped `screens=[…]` for fix-then-re-eval [PRIMARY]
- [ ] AC-2: Iteration counter persisted per (screen, state)
- [ ] AC-3: 3-iteration cap enforced; `status: "max_iterations_reached"` returned
- [ ] AC-4: `force=true` bypasses cap and resets counter (history preserved)
- [ ] AC-5: before/after scores included in skill output

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA (TDD beads)
--------------------------------------------------------------------------------

AC-1: Skill accepts narrow-scoped screens=[…] for fix-then-re-eval [PRIMARY]
  GIVEN: Initial run flagged issues on auth-screen.entry.dark
  WHEN:  Skill is re-invoked with screens=['auth-screen'] after fix
  THEN:  Pipeline runs only the auth-screen subset and updates iteration state for affected (screen,state) entries
  TDD_STATE:     none
  TEST_FILE:     scripts/design-review/__tests__/reeval-scope.test.ts
  TEST_FUNCTION: test_narrow_rerun
  VERIFY:        pnpm tsx scripts/design-review/__tests__/reeval-scope.test.ts

AC-2: Iteration counter persisted per (screen, state)
  GIVEN: First re-eval after initial run
  WHEN:  Re-eval completes
  THEN:  .design-review/iterations/auth-screen.entry.json contains { iteration: 2, before_score, current_score, max_iterations: 3 }
  TDD_STATE:     none
  TEST_FILE:     scripts/design-review/__tests__/iteration-persistence.test.ts
  TEST_FUNCTION: test_counter_increments
  VERIFY:        pnpm tsx scripts/design-review/__tests__/iteration-persistence.test.ts

AC-3: 3-iteration cap enforced
  GIVEN: Iteration state shows iteration=3
  WHEN:  Skill is invoked again without force=true
  THEN:  Skill returns status: 'max_iterations_reached' and does NOT run the eval pipeline
  TDD_STATE:     none
  TEST_FILE:     scripts/design-review/__tests__/iteration-cap.test.ts
  TEST_FUNCTION: test_cap_enforced
  VERIFY:        pnpm tsx scripts/design-review/__tests__/iteration-cap.test.ts

AC-4: force=true bypasses cap and resets counter
  GIVEN: Iteration state at max_iterations_reached
  WHEN:  Skill is invoked with force=true
  THEN:  Pipeline proceeds and counter resets to 1 with prior scores recorded in a `history[]` block
  TDD_STATE:     none
  TEST_FILE:     scripts/design-review/__tests__/iteration-force.test.ts
  TEST_FUNCTION: test_force_reset
  VERIFY:        pnpm tsx scripts/design-review/__tests__/iteration-force.test.ts

AC-5: before/after scores included in skill output
  GIVEN: Re-eval completes
  WHEN:  Skill returns response
  THEN:  Each issue carries `before_score` and `after_score` fields reflecting the iteration's per-component severity/confidence delta
  TDD_STATE:     none
  TEST_FILE:     scripts/design-review/__tests__/before-after-scores.test.ts
  TEST_FUNCTION: test_score_fields
  VERIFY:        pnpm tsx scripts/design-review/__tests__/before-after-scores.test.ts

--------------------------------------------------------------------------------
TEST CRITERIA
--------------------------------------------------------------------------------

| ID | Statement | Maps to | Verify |
|----|-----------|---------|--------|
| TC-1 | Narrow scope only touches the requested screens | AC-1 | `pnpm tsx scripts/design-review/__tests__/reeval-scope.test.ts` |
| TC-2 | Iteration JSON file shape matches contract | AC-2 | `pnpm tsx scripts/design-review/__tests__/iteration-persistence.test.ts` |
| TC-3 | Cap blocks fourth run without force | AC-3 | `pnpm tsx scripts/design-review/__tests__/iteration-cap.test.ts` |
| TC-4 | force=true resets counter and records history | AC-4 | `pnpm tsx scripts/design-review/__tests__/iteration-force.test.ts` |
| TC-5 | before/after fields present on each issue | AC-5 | `pnpm tsx scripts/design-review/__tests__/before-after-scores.test.ts` |
| TC-6 | TS typecheck passes | AC-1 | `pnpm type-check:native` |

--------------------------------------------------------------------------------
SCOPE
--------------------------------------------------------------------------------

writeAllowed:
- scripts/design-review/run.ts (MODIFY — wire iteration tracking + cap + force)
- scripts/design-review/iteration-store.ts (NEW — persistence helpers)
- scripts/design-review/__tests__/*.ts (NEW)
- /Users/justinrich/.claude/skills/design-review/SKILL.md (MODIFY — document re-eval semantics + force flag)

writeProhibited:
- scripts/design-review/merge-report.ts — owned by T07
- scripts/design-review/visual-eval.ts — owned by T05

--------------------------------------------------------------------------------
BOUNDARIES
--------------------------------------------------------------------------------

✅ Always:
- Treat iteration state as authoritative; never recompute from logs
- Persist history when force=true resets counter (never lose prior round data)
- Use atomic writes (write to .tmp + rename) to prevent corruption

⚠️ Ask First:
- If a (screen, state) lacks prior iteration record on a re-eval invocation (treat as fresh? error? user decides)

--------------------------------------------------------------------------------
DELIVERABLE
--------------------------------------------------------------------------------

- scripts/design-review/iteration-store.ts (NEW): iteration persistence helpers (read/write/atomic)
- scripts/design-review/run.ts (MODIFY): wire iteration tracking + cap + force flag
- /Users/justinrich/.claude/skills/design-review/SKILL.md (MODIFY): document re-eval + force semantics in skill body

--------------------------------------------------------------------------------
AGENT INSTRUCTIONS (TDD Flow)
--------------------------------------------------------------------------------

Standard RED → GREEN → REFACTOR per AC. Strategy: AC-2 (iteration store) first since others depend on it. Then AC-1 (narrow-scope plumbing). Then AC-3 (cap enforcement). Then AC-4 (force reset). Finally AC-5 (before/after score wiring).

For atomic writes in iteration-store.ts: write to `{path}.tmp`, then `fs.rename` — never write in-place.

--------------------------------------------------------------------------------
READING LIST
--------------------------------------------------------------------------------

1. /Users/justinrich/.claude/plans/plan-a-design-review-logical-clock.md [PRIMARY PATTERN]
   - Section: Phase 9
   - Focus: Iteration cap + force semantics + history block

2. /Users/justinrich/Projects/LaneShadow/scripts/design-review/run.ts (after T08)
   - Lines: current orchestrator
   - Focus: Insertion points for iteration state

3. /Users/justinrich/Projects/LaneShadow/.design-review/report.json (runtime — after T07 runs)
   - Lines: summary block
   - Focus: Score computation source

--------------------------------------------------------------------------------
EVIDENCE GATES
--------------------------------------------------------------------------------

Gate 1: Scope test
  Command:  pnpm tsx scripts/design-review/__tests__/reeval-scope.test.ts
  Expected: exit 0

Gate 2: Cap test
  Command:  pnpm tsx scripts/design-review/__tests__/iteration-cap.test.ts
  Expected: exit 0

Gate 3: Force test
  Command:  pnpm tsx scripts/design-review/__tests__/iteration-force.test.ts
  Expected: exit 0

Gate 4: TS typecheck
  Command:  pnpm type-check:native
  Expected: exit 0

--------------------------------------------------------------------------------
OUT OF SCOPE
--------------------------------------------------------------------------------

- Smoke test + docs (T10)
- Modifying eval engine internals (T05)
- Implementing the fix agent itself (out of sprint entirely)

--------------------------------------------------------------------------------
CONTEXT
--------------------------------------------------------------------------------

**Current state:** Skill from T08 runs the pipeline once; no iteration tracking exists, so a fix agent could loop indefinitely.

**Gap:** Autonomous fix agent needs a hard cap and clear per-(screen, state) before/after deltas to know when to stop and ask a human.

--------------------------------------------------------------------------------
REVIEW (for convex-reviewer)
--------------------------------------------------------------------------------

Must pass:
- Cap blocks 4th run without force
- `force=true` cleanly resets counter and preserves history in `history[]`
- before/after scores present on every issue

Should verify:
- Iteration store is corruption-resistant (atomic writes via tmp + rename)
- SKILL.md updated to document re-eval semantics + force flag clearly
- Per-(screen, state) iteration records are independent (one screen reaching cap doesn't block other screens)

Verdict: APPROVED | NEEDS_FIXES
Domain reviewer: convex-reviewer

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends on: FID-S05-T08
Blocks:     FID-S05-T10
Parallel:   (none)

================================================================================

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{"requirements":[{"id":"AC-1","type":"acceptance_criterion","description":"Narrow-scoped re-eval supported","verify":"pnpm tsx scripts/design-review/__tests__/reeval-scope.test.ts","maps_to_ac":null,"satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null},{"id":"AC-2","type":"acceptance_criterion","description":"Iteration counter persisted","verify":"pnpm tsx scripts/design-review/__tests__/iteration-persistence.test.ts","maps_to_ac":null,"satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null},{"id":"AC-3","type":"acceptance_criterion","description":"3-iteration cap enforced","verify":"pnpm tsx scripts/design-review/__tests__/iteration-cap.test.ts","maps_to_ac":null,"satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null},{"id":"AC-4","type":"acceptance_criterion","description":"force=true bypass + reset","verify":"pnpm tsx scripts/design-review/__tests__/iteration-force.test.ts","maps_to_ac":null,"satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null},{"id":"AC-5","type":"acceptance_criterion","description":"before/after score fields emitted","verify":"pnpm tsx scripts/design-review/__tests__/before-after-scores.test.ts","maps_to_ac":null,"satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null},{"id":"TC-1","type":"test_criterion","description":"Narrow scope test","verify":"pnpm tsx scripts/design-review/__tests__/reeval-scope.test.ts","maps_to_ac":"AC-1","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null},{"id":"TC-2","type":"test_criterion","description":"Iteration persistence","verify":"pnpm tsx scripts/design-review/__tests__/iteration-persistence.test.ts","maps_to_ac":"AC-2","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null},{"id":"TC-3","type":"test_criterion","description":"Cap enforced","verify":"pnpm tsx scripts/design-review/__tests__/iteration-cap.test.ts","maps_to_ac":"AC-3","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null},{"id":"TC-4","type":"test_criterion","description":"force=true bypass","verify":"pnpm tsx scripts/design-review/__tests__/iteration-force.test.ts","maps_to_ac":"AC-4","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null},{"id":"TC-5","type":"test_criterion","description":"before/after fields present","verify":"pnpm tsx scripts/design-review/__tests__/before-after-scores.test.ts","maps_to_ac":"AC-5","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null},{"id":"TC-6","type":"test_criterion","description":"Native typecheck","verify":"pnpm type-check:native","maps_to_ac":"AC-1","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null}]}
-->
