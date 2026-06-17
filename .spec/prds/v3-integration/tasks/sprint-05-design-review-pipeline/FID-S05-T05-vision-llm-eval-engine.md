================================================================================
TASK: FID-S05-T05 - Vision LLM eval engine using claude-sonnet-4-6 multimodal
================================================================================

TASK_TYPE:  FEATURE
STATUS:     Backlog
PRIORITY:   P0
EFFORT:     L
AGENT:      implementer=convex-implementer | reviewer=convex-reviewer
SPRINT:     [sprint-05-design-review-pipeline](./SPRINT.md)
ESTIMATE:   360 min

RUNTIME_COMMANDS:
  test:      pnpm tsx scripts/design-review/__tests__/<file>
  typecheck: pnpm type-check:native
  lint:      pnpm exec biome check --no-errors-on-unmatched scripts/design-review/

PROGRESS: AC-1 not started · 0/6 complete

--------------------------------------------------------------------------------
OUTCOME
--------------------------------------------------------------------------------

Run claude-sonnet-4-6 multimodal calls per manifest entry against reference + capture and emit zod-validated per-component issue JSON with one-shot retry and concurrency cap of 3.

--------------------------------------------------------------------------------
🚫 CRITICAL CONSTRAINTS
--------------------------------------------------------------------------------

- MUST use model id `claude-sonnet-4-6` (not claude-sonnet-4 or claude-3-*)
- MUST pass two images per call: image 1 = reference, image 2 = captured (order is semantically load-bearing)
- MUST inject `annotations.json` verbatim into user content + read system prompt from disk file
- NEVER send images in reverse order (capture-first will skew prompt semantics)
- NEVER hardcode prompt text inside `visual-eval.ts`; STRICTLY read from `prompts/visual-eval.md` (and `.locked.md` after T06 calibration)
- NEVER run more than `DESIGN_REVIEW_CONCURRENCY` (default 3) requests in parallel

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

- [ ] AC-1: visual-eval.ts emits per-entry JSON to `.design-review/evals/visual/{id}.json` for every manifest entry [PRIMARY]
- [ ] AC-2: Zod schema enforces issue array shape with the article §3.1 enums + confidence range
- [ ] AC-3: One-shot retry on schema failure; second failure logs and continues
- [ ] AC-4: Concurrency capped at `DESIGN_REVIEW_CONCURRENCY` (default 3)
- [ ] AC-5: Prompt loaded from `prompts/visual-eval.md`; not hardcoded
- [ ] AC-6: `pnpm design:eval` script registered

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA (TDD beads)
--------------------------------------------------------------------------------

AC-1: visual-eval.ts performs multimodal Anthropic call per manifest entry [PRIMARY]
  GIVEN: .design-review/manifest.json exists from T04
  WHEN:  pnpm design:eval runs
  THEN:  For each entry, an Anthropic claude-sonnet-4-6 call is made with [reference, captured] images plus annotations.json + screen/state/theme context, and result written to .design-review/evals/visual/{id}.json
  TDD_STATE:     none
  TEST_FILE:     scripts/design-review/__tests__/visual-eval.test.ts
  TEST_FUNCTION: test_eval_emits_per_entry_files
  VERIFY:        pnpm design:eval && find .design-review/evals/visual -name '*.json' | wc -l | awk '{ if ($1 < 1) exit 1 }'

AC-2: Zod schema enforces issue array shape
  GIVEN: schemas/visual-issue.zod.ts is implemented
  WHEN:  Schema validates output
  THEN:  z.array(z.object({component, passed, issue_type ∈ {spacing,color,typography,placement,overflow,missing}, observed, expected, severity ∈ {low,med,high}, confidence ∈ [0,1]})) parses successfully on golden fixture and rejects out-of-range / unknown-enum payloads
  TDD_STATE:     none
  TEST_FILE:     scripts/design-review/__tests__/visual-issue-schema.test.ts
  TEST_FUNCTION: test_schema_accepts_valid_rejects_invalid
  VERIFY:        pnpm tsx scripts/design-review/__tests__/visual-issue-schema.test.ts

AC-3: One-shot retry on schema failure
  GIVEN: Initial Anthropic response fails zod parse
  WHEN:  Engine handles failure
  THEN:  Engine re-prompts with 'Your previous output failed schema X' and accepts retry; if retry also fails the entry is recorded with error status (does not abort the whole run)
  TDD_STATE:     none
  TEST_FILE:     scripts/design-review/__tests__/visual-eval-retry.test.ts
  TEST_FUNCTION: test_one_shot_retry_then_fail
  VERIFY:        pnpm tsx scripts/design-review/__tests__/visual-eval-retry.test.ts

AC-4: Concurrency capped at 3 (DESIGN_REVIEW_CONCURRENCY env override)
  GIVEN: Manifest has many entries
  WHEN:  Eval runs
  THEN:  At most DESIGN_REVIEW_CONCURRENCY in-flight Anthropic calls (default 3); env override respected
  TDD_STATE:     none
  TEST_FILE:     scripts/design-review/__tests__/visual-eval-concurrency.test.ts
  TEST_FUNCTION: test_concurrency_cap
  VERIFY:        DESIGN_REVIEW_CONCURRENCY=2 pnpm tsx scripts/design-review/__tests__/visual-eval-concurrency.test.ts

AC-5: Prompt loaded from prompts/visual-eval.md
  GIVEN: scripts/design-review/prompts/visual-eval.md exists with article §3.1 base text
  WHEN:  Engine starts
  THEN:  System prompt is read from disk and not hardcoded inside visual-eval.ts
  TDD_STATE:     none
  TEST_FILE:     scripts/design-review/visual-eval.ts
  TEST_FUNCTION: grep verification
  VERIFY:        grep -q 'visual-eval.md' scripts/design-review/visual-eval.ts && test -f scripts/design-review/prompts/visual-eval.md

AC-6: pnpm design:eval script registered
  GIVEN: package.json
  WHEN:  Inspected
  THEN:  design:eval entry resolves to scripts/design-review/visual-eval.ts via tsx
  TDD_STATE:     none
  TEST_FILE:     package.json
  TEST_FUNCTION: grep verification
  VERIFY:        grep -q '"design:eval"' package.json

--------------------------------------------------------------------------------
TEST CRITERIA
--------------------------------------------------------------------------------

| ID | Statement | Maps to | Verify |
|----|-----------|---------|--------|
| TC-1 | Engine sends image 1 = reference, image 2 = captured (order locked) | AC-1 | `pnpm tsx scripts/design-review/__tests__/image-order.test.ts` |
| TC-2 | Model id is claude-sonnet-4-6 | AC-1 | `grep -q 'claude-sonnet-4-6' scripts/design-review/visual-eval.ts` |
| TC-3 | Zod schema accepts valid fixture | AC-2 | `pnpm tsx scripts/design-review/__tests__/visual-issue-schema.test.ts --case=valid` |
| TC-4 | Zod schema rejects out-of-range confidence | AC-2 | `pnpm tsx scripts/design-review/__tests__/visual-issue-schema.test.ts --case=invalid-confidence` |
| TC-5 | Zod schema rejects unknown issue_type enum value | AC-2 | `pnpm tsx scripts/design-review/__tests__/visual-issue-schema.test.ts --case=invalid-enum` |
| TC-6 | Schema failure triggers exactly one retry | AC-3 | `pnpm tsx scripts/design-review/__tests__/visual-eval-retry.test.ts` |
| TC-7 | Concurrency env override respected | AC-4 | `DESIGN_REVIEW_CONCURRENCY=1 pnpm tsx scripts/design-review/__tests__/visual-eval-concurrency.test.ts` |
| TC-8 | Annotations injected verbatim into user content | AC-1 | `pnpm tsx scripts/design-review/__tests__/annotations-injection.test.ts` |
| TC-9 | TS typecheck passes | AC-1 | `pnpm type-check:native` |
| TC-10 | Per-entry output filename matches manifest entry id | AC-1 | `pnpm tsx scripts/design-review/__tests__/output-filename.test.ts` |

--------------------------------------------------------------------------------
SCOPE
--------------------------------------------------------------------------------

writeAllowed:
- scripts/design-review/visual-eval.ts (NEW)
- scripts/design-review/schemas/visual-issue.zod.ts (NEW)
- scripts/design-review/prompts/visual-eval.md (NEW)
- scripts/design-review/__tests__/*.ts (NEW)
- package.json (MODIFY — add design:eval script)

writeProhibited:
- scripts/design-review/prompts/visual-eval.locked.md — created in T06 only
- scripts/design-review/merge-report.ts — owned by T07
- scripts/design-review/calibrate.ts — owned by T06

--------------------------------------------------------------------------------
BOUNDARIES
--------------------------------------------------------------------------------

✅ Always:
- Reuse existing Anthropic SDK import pattern from convex/agent/
- Read API key from `ANTHROPIC_API_KEY` env var (never commit keys)
- Honor concurrency cap via `p-limit` or equivalent semaphore
- Send `reference` image first in the multimodal payload, `captured` second

⚠️ Ask First:
- If `claude-sonnet-4-6` model id is unavailable in the Anthropic API at run time
- If annotations.json payload exceeds context window for any entry

--------------------------------------------------------------------------------
DELIVERABLE
--------------------------------------------------------------------------------

Order: schema first (others import it), then prompt, then engine, then package wiring.

- scripts/design-review/schemas/visual-issue.zod.ts (NEW): Zod schema (read by visual-eval.ts)
- scripts/design-review/prompts/visual-eval.md (NEW): Initial system prompt (article §3.1)
- scripts/design-review/visual-eval.ts (NEW): Eval engine entry point
- package.json (MODIFY): design:eval script

--------------------------------------------------------------------------------
AGENT INSTRUCTIONS (TDD Flow)
--------------------------------------------------------------------------------

Standard RED → GREEN → REFACTOR per AC. Strategy: AC-2 (schema) first because everything depends on it. Then AC-5 (prompt loading). Then AC-1 (single-entry happy path), AC-3 (retry path), AC-4 (concurrency cap). Finally AC-6 (package wiring).

For AC-3 retry test: stub the Anthropic client to return an invalid payload first, valid second. For AC-4 concurrency: use `p-limit` semaphore mock to assert max in-flight count.

--------------------------------------------------------------------------------
READING LIST
--------------------------------------------------------------------------------

1. /Users/justinrich/Projects/LaneShadow/convex/agent/ [PRIMARY PATTERN]
   - Lines: Anthropic SDK import + call pattern
   - Focus: Reuse SDK init + error handling pattern

2. /Users/justinrich/.claude/plans/plan-a-design-review-logical-clock.md [PRIMARY PATTERN]
   - Sections: Phase 5 + article §3.1
   - Focus: Vision LLM contract + initial prompt content

3. /Users/justinrich/Projects/LaneShadow/.design-review/manifest.json (after T04 lands)
   - Lines: entries[] schema
   - Focus: Input shape from T04

--------------------------------------------------------------------------------
EVIDENCE GATES
--------------------------------------------------------------------------------

Gate 1: Schema test
  Command:  pnpm tsx scripts/design-review/__tests__/visual-issue-schema.test.ts
  Expected: exit 0

Gate 2: Retry test
  Command:  pnpm tsx scripts/design-review/__tests__/visual-eval-retry.test.ts
  Expected: exit 0

Gate 3: Concurrency test
  Command:  DESIGN_REVIEW_CONCURRENCY=2 pnpm tsx scripts/design-review/__tests__/visual-eval-concurrency.test.ts
  Expected: exit 0

Gate 4: TS typecheck
  Command:  pnpm type-check:native
  Expected: exit 0

Gate 5: Image order locked
  Command:  pnpm tsx scripts/design-review/__tests__/image-order.test.ts
  Expected: exit 0

--------------------------------------------------------------------------------
OUT OF SCOPE
--------------------------------------------------------------------------------

- Calibration loop (T06)
- Merge/report aggregation (T07)
- Behavioral fidelity axis (article §3.2 — deferred entire sprint)
- Locking the prompt file (happens in T06)

--------------------------------------------------------------------------------
CONTEXT
--------------------------------------------------------------------------------

**Current state:** Manifest from T04 lists capture+reference+annotations triples; nothing evaluates them. Anthropic SDK is already in use under `convex/agent/` with claude-* models.

**Gap:** Need a multimodal evaluator that emits a structured, token-aware issue list per (screen,state,theme) which downstream merge/report (T07) and re-eval loops (T09) can consume.

--------------------------------------------------------------------------------
REVIEW (for convex-reviewer)
--------------------------------------------------------------------------------

Must pass:
- Schema validation accepts golden fixture and rejects malformed payloads
- Image order is reference-first, capture-second
- Concurrency cap honored (test asserts max in-flight)
- Prompt loaded from disk file, not embedded string
- One-shot retry on schema failure; second failure recorded as error entry (does not abort run)

Should verify:
- Anthropic SDK reuse mirrors `convex/agent/` init pattern
- Per-entry output filenames match manifest ids exactly
- API key read from env, never logged

Verdict: APPROVED | NEEDS_FIXES
Domain reviewer: convex-reviewer

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends on: FID-S05-T04
Blocks:     FID-S05-T06, FID-S05-T07
Parallel:   (none)

================================================================================

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{"requirements":[{"id":"AC-1","type":"acceptance_criterion","description":"Multimodal call per manifest entry with output written","verify":"pnpm design:eval && find .design-review/evals/visual -name '*.json' | wc -l | awk '{ if ($1 < 1) exit 1 }'","maps_to_ac":null,"satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null},{"id":"AC-2","type":"acceptance_criterion","description":"Zod schema enforces issue array shape","verify":"pnpm tsx scripts/design-review/__tests__/visual-issue-schema.test.ts","maps_to_ac":null,"satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null},{"id":"AC-3","type":"acceptance_criterion","description":"One-shot retry on schema failure","verify":"pnpm tsx scripts/design-review/__tests__/visual-eval-retry.test.ts","maps_to_ac":null,"satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null},{"id":"AC-4","type":"acceptance_criterion","description":"Concurrency cap enforced","verify":"DESIGN_REVIEW_CONCURRENCY=2 pnpm tsx scripts/design-review/__tests__/visual-eval-concurrency.test.ts","maps_to_ac":null,"satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null},{"id":"AC-5","type":"acceptance_criterion","description":"Prompt read from disk, not hardcoded","verify":"grep -q 'visual-eval.md' scripts/design-review/visual-eval.ts && test -f scripts/design-review/prompts/visual-eval.md","maps_to_ac":null,"satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null},{"id":"AC-6","type":"acceptance_criterion","description":"design:eval script registered","verify":"grep -q '\"design:eval\"' package.json","maps_to_ac":null,"satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null},{"id":"TC-1","type":"test_criterion","description":"Image order locked","verify":"pnpm tsx scripts/design-review/__tests__/image-order.test.ts","maps_to_ac":"AC-1","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null},{"id":"TC-2","type":"test_criterion","description":"Model id is claude-sonnet-4-6","verify":"grep -q 'claude-sonnet-4-6' scripts/design-review/visual-eval.ts","maps_to_ac":"AC-1","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null},{"id":"TC-3","type":"test_criterion","description":"Schema accepts valid fixture","verify":"pnpm tsx scripts/design-review/__tests__/visual-issue-schema.test.ts --case=valid","maps_to_ac":"AC-2","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null},{"id":"TC-4","type":"test_criterion","description":"Schema rejects out-of-range confidence","verify":"pnpm tsx scripts/design-review/__tests__/visual-issue-schema.test.ts --case=invalid-confidence","maps_to_ac":"AC-2","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null},{"id":"TC-5","type":"test_criterion","description":"Schema rejects unknown issue_type","verify":"pnpm tsx scripts/design-review/__tests__/visual-issue-schema.test.ts --case=invalid-enum","maps_to_ac":"AC-2","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null},{"id":"TC-6","type":"test_criterion","description":"Retry-on-failure flow","verify":"pnpm tsx scripts/design-review/__tests__/visual-eval-retry.test.ts","maps_to_ac":"AC-3","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null},{"id":"TC-7","type":"test_criterion","description":"Concurrency env override","verify":"DESIGN_REVIEW_CONCURRENCY=1 pnpm tsx scripts/design-review/__tests__/visual-eval-concurrency.test.ts","maps_to_ac":"AC-4","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null},{"id":"TC-8","type":"test_criterion","description":"Annotations verbatim injection","verify":"pnpm tsx scripts/design-review/__tests__/annotations-injection.test.ts","maps_to_ac":"AC-1","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null},{"id":"TC-9","type":"test_criterion","description":"Native typecheck","verify":"pnpm type-check:native","maps_to_ac":"AC-1","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null},{"id":"TC-10","type":"test_criterion","description":"Output filename matches entry id","verify":"pnpm tsx scripts/design-review/__tests__/output-filename.test.ts","maps_to_ac":"AC-1","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null}]}
-->
