# REDHAT-FIX-18 — Canonical gate-step completeness check in deriveGoalState (fixed 1..8 from gate-plan.json)
> Status: ⬜ Pending

| Field | Value |
|-------|-------|
| TASK_ID | REDHAT-FIX-18 |
| SPRINT | [Sprint 04 — Trust pipeline](./SPRINT.md) |
| TASK_TYPE | FEATURE |
| AGENT | implementer=`convex-implementer` · reviewer=`convex-reviewer` |
| ESTIMATE | 150 min |
| EFFORT | M |
| PRIORITY | P0 |
| STATUS | Backlog |
| PROPOSED_BY | `convex-planner` |
| TDD_MODE | `red_first` |
| RED_GREEN_REQUIRED | yes |
| CAPABILITIES | CAP-GEO-05 |
| DEPENDS_ON | — |
| BLOCKS | — |

RUNTIME_COMMANDS:
- test: `npx vitest run convex/__tests__/REDHAT-FIX-18-*.integration.test.ts`
- typecheck: `npx tsc --noEmit -p convex/tsconfig.json`
- lint: `pnpm exec biome check`

> **Command note:** `pnpm test` maps to bare `vitest` (watch mode) and HANGS in an agent shell — always use `npx vitest run`. vitest has no `--grep`; the single-test filter is `-t '<name>'`.

## OUTCOME

Forces the sprint goal-state writer to require the full canonical eight-step gate (from committed gate-plan.json): every step present, no duplicates/extras/reorders, and every step substantiated-PASS before met:true. Red-hat CRITICAL-2: allStepsPass is merely opts.steps.length>0 && !anyBlocked, so a 1-step HEAD-bound all-PASS bundle can satisfy the mechanical predicate while omitting human steps 3/4/5/7. Existing FIX-12 AC-9 only proves a supplied PASS cannot exceed its chosen manifest.

## 🚫 CRITICAL CONSTRAINTS (Never tier — read before acting)

**MUST**
- MUST read convex/_generated/ai/guidelines.md and tools/gate/deriveGoalState.ts before implementation
- MUST load a fixed committed expected step set (1..8 from HEAD-bound gate-plan.json steps[].n) and reject missing, duplicate, extra, or reordered step IDs in supplied step-results
- MUST call the step predicate complete only when ALL canonical steps are substantiated-PASS (not merely steps.length>0 && !anyBlocked)
- MUST prove PRIMARY: a 1-step all-PASS HEAD-bound bundle yields met:false / gate incomplete (not ACHIEVED)
- MUST resolve step-results + evidence-bundle corroboration against the canonical expected set (HEAD-bound plan), not an unconstrained CLI-chosen subset as the completeness source

**NEVER**
- NEVER treat a non-empty subset of non-blocked steps as gate-complete (the CRITICAL-2 bug at deriveGoalState.ts:333)
- NEVER rebind gate-plan.json literal_cmd paths or planned_at timestamps — REDHAT-FIX-20 owns plan path rewrite
- NEVER synthesize S4-T7 Founder-Operator human evidence or force founder.present=true
- NEVER weaken FIX-12 HEAD-bound manifest / artifact freshness / path-escape checks
- NEVER forge ACHIEVED by omitting human steps 3/4/5/7 from the expected set

**STRICTLY**
- STRICTLY expected step IDs come from committed gate-plan.json (read-only for path content) — not a hard-coded magic list that drifts from the plan
- STRICTLY verifyEvidenceManifest rejects evidence_steps that are not exactly the canonical 1..8 set (or deriveGoalState rejects incomplete evidence_steps before met)

## DONE WHEN

- AC-1 [1-step all-PASS bundle is incomplete] [PRIMARY]: met===false, goal is GATE-GOAL: BLOCKED, not ACHIEVED (incomplete canonical steps)
- AC-2 [Duplicate/missing/extra/reordered step IDs rejected]: met===false with an error/blocker naming the identity/order violation
- AC-3 [Full 1..8 substantiated-PASS satisfies step completeness predicate]: no incomplete-steps error; any remaining met:false is only founder/attestation or unrelated blockers — not missing steps
- AC-4 [verifyEvidenceManifest rejects incomplete evidence_steps set]: verification fails closed (ok:false or deriveGoalState error) — incomplete evidence_steps cannot substantiate full completeness
- Every behavioral AC scenario passes `validate_scenario` (exit 0); RED-against-start recorded before GREEN; seeded-value EVIDENCE artifact captured
- `npx tsc --noEmit -p convex/tsconfig.json` → 0 errors + `pnpm exec biome check` clean + `pnpm convex:dev --once` clean
- NO-REGRESSION: `pnpm type-check` reports zero new errors vs. a baseline captured at task start
- Only SCOPE.writeAllowed files modified (`git diff --name-only`)

## SPECIFICATION

**Objective:** Close the subset-steps bypass: deriveGoalState requires the fixed 1..8 gate-plan step set, all substantiated-PASS, before the mechanical step predicate can pass.

**Success state:** A fresh 1-step all-PASS HEAD-bound bundle yields met:false with an incomplete/missing-steps blocker; only a complete 1..8 substantiated-PASS set (still subject to founder attestation) can satisfy the step completeness predicate.

## FIXTURES (shared seed data — referenced by scenario `start_ref`)

- `canonical-gate-plan` (seed_method: `public_api`): Committed gate-plan.json with planned_steps=8 and steps n=1..8 (read-only expected set source).
    - file .spec/prds/route-agent-quality/tasks/sprint-04-trust-pipeline/gate-plan.json exists with steps[].n == 1..8
- `one-step-all-pass-bundle` (seed_method: `public_api`): Temp git repo HEAD-bound evidence bundle with only step 1 PASS in step-results and manifest evidence_steps.
    - temp repo with .gate-evidence/one-step/manifest.json evidence_steps:{'1':{result:'PASS',artifacts:['evidence/step1.json']}}
    - committed at HEAD with matching artifacts
    - step-results JSON steps:[{n:1,result:'PASS'}]
- `full-eight-step-all-pass-bundle` (seed_method: `public_api`): Temp git repo HEAD-bound bundle with steps 1..8 all PASS and full evidence_steps 1..8 (completeness happy path; founder may still block).
    - manifest evidence_steps for String(1)..String(8) each PASS with ≥1 artifact
    - step-results steps n=1..8 all PASS in order
    - committed at HEAD
- `reordered-or-duplicate-steps` (seed_method: `public_api`): Step-results that claim 1..8 PASS but with duplicate n or wrong order/extra ids.
    - steps with duplicate n:1 or missing n:7 or extra n:9

## ACCEPTANCE CRITERIA (TDD beads — RED → GREEN → REFACTOR per AC)

### AC-1 [PRIMARY] — 1-step all-PASS bundle is incomplete

**Requirement:** GIVEN A HEAD-bound evidence bundle and step-results containing only step 1 as PASS WHEN deriveGoalState is run with that steps array and bundlePath THEN met===false, goal is GATE-GOAL: BLOCKED, not ACHIEVED (incomplete canonical steps)

- TEST_TIER: `integration` · VERIFICATION_SERVICE: filesystem+git temp repo + deriveGoalState (real HEAD-bound paths)
- FLOW_REF: UC-VER-05
- VERIFY: `npx vitest run convex/__tests__/REDHAT-FIX-18-canonical-step-completeness.integration.test.ts -t 'AC-1'`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: allStepsPass is stubbed to opts.steps.length > 0 && !anyBlocked so a 1-step all-PASS set yields met === true; deriveGoalState is mocked to return GATE-GOAL: ACHIEVED for an empty 2..8 step set; static completeness check treats empty missing-steps as complete
- EVIDENCE: `file_artifact` (required_capture: true)
- CASE 1 — start_ref `one-step-all-pass-bundle`
  - ACTION: Create temp git repo with one-step-all-pass-bundle committed at HEAD; Call deriveGoalState({steps:[{n:1,result:'PASS'}], bundlePath, repoCwd, convexRepoCwd}); Capture state.met, state.goal, state.gate.overall, state.error or blocker
  - MUST_OBSERVE: state.met === false; state.goal === 'GATE-GOAL: BLOCKED'; error.code == 'INCOMPLETE_CANONICAL_STEPS' || state.gate.blocker includes 'incomplete'
  - MUST_NOT_OBSERVE: state.met === true; state.goal === 'GATE-GOAL: ACHIEVED'; empty missing-steps set treated as complete

### AC-2 — Duplicate/missing/extra/reordered step IDs rejected

**Requirement:** GIVEN Step-results that claim PASS but violate the canonical 1..8 identity set (duplicate, missing, extra, or reordered) WHEN deriveGoalState evaluates completeness THEN met===false with an error/blocker naming the identity/order violation

- TEST_TIER: `integration` · VERIFICATION_SERVICE: filesystem+git temp repo + deriveGoalState
- FLOW_REF: UC-VER-05
- VERIFY: `npx vitest run convex/__tests__/REDHAT-FIX-18-canonical-step-completeness.integration.test.ts -t 'AC-2'`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: step identity validation is stubbed to accept any caller-selected steps without comparing to the fixed 1..8 set; duplicate/missing step IDs are mocked as valid; empty expected-set comparison is omitted (no-op identity check)
- EVIDENCE: `stdout` (required_capture: true)
- CASE 1 — start_ref `reordered-or-duplicate-steps`
  - ACTION: Build step-results with duplicate n:1 and missing n:7 (or extra n:9); Call deriveGoalState with a full or partial bundle; Capture error/blocker
  - MUST_OBSERVE: state.met === false; error.code == 'INVALID_STEP_IDENTITY' || state.gate.blocker includes 'duplicate' || state.gate.blocker includes 'missing'
  - MUST_NOT_OBSERVE: state.met === true; state.goal === 'GATE-GOAL: ACHIEVED'; empty identity violation

### AC-3 — Full 1..8 substantiated-PASS satisfies step completeness predicate

**Requirement:** GIVEN A HEAD-bound bundle with evidence_steps 1..8 all PASS and step-results n=1..8 all PASS in order WHEN deriveGoalState evaluates the step predicate (founder may still be absent) THEN no incomplete-steps error; any remaining met:false is only founder/attestation or unrelated blockers — not missing steps

- TEST_TIER: `integration` · VERIFICATION_SERVICE: filesystem+git temp repo + deriveGoalState
- FLOW_REF: UC-VER-05
- VERIFY: `npx vitest run convex/__tests__/REDHAT-FIX-18-canonical-step-completeness.integration.test.ts -t 'AC-3'`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: completeness check is stubbed to reject a full 1..8 substantiated-PASS set (false positive block); founder path is mocked to inject met === true without S4-T7; static shell reports incomplete for a full set
- EVIDENCE: `file_artifact` (required_capture: true)
- CASE 1 — start_ref `full-eight-step-all-pass-bundle`
  - ACTION: Create full-eight-step-all-pass-bundle at HEAD; Call deriveGoalState with steps 1..8 all PASS; Inspect state.error and state.gate.blocker
  - MUST_OBSERVE: state.gate.steps.length === 8; state.error?.code !== 'INCOMPLETE_CANONICAL_STEPS'; state.met === false && state.goal === 'GATE-GOAL: BLOCKED' && founder.present === false
  - MUST_NOT_OBSERVE: error.code == 'INCOMPLETE_CANONICAL_STEPS'; state.met === true with empty founder attestation; no 8 steps

### AC-4 — verifyEvidenceManifest rejects incomplete evidence_steps set

**Requirement:** GIVEN A HEAD-bound manifest.json whose evidence_steps omits required steps (e.g. only step 1) WHEN verifyEvidenceManifest or deriveGoalState substantiation runs against the canonical expected set THEN verification fails closed (ok:false or deriveGoalState error) — incomplete evidence_steps cannot substantiate full completeness

- TEST_TIER: `integration` · VERIFICATION_SERVICE: filesystem+git + verifyEvidenceManifest/deriveGoalState
- FLOW_REF: UC-VER-05
- VERIFY: `npx vitest run convex/__tests__/REDHAT-FIX-18-canonical-step-completeness.integration.test.ts -t 'AC-4'`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: verifyEvidenceManifest is stubbed to accept arbitrary evidence_steps with no required 1..8 set; manifest completeness is mocked to ok:true for empty steps 2..8; static shell treats a 1-step evidence_steps map as complete
- EVIDENCE: `api_response` (required_capture: true)
- CASE 1 — start_ref `one-step-all-pass-bundle`
  - ACTION: Create HEAD-bound one-step manifest; Run verifyEvidenceManifest and/or deriveGoalState completeness path; Capture ok/error
  - MUST_OBSERVE: state.met === false; verifyResult.ok === false || error.code == 'INCOMPLETE_EVIDENCE_STEPS' || error.code == 'INCOMPLETE_CANONICAL_STEPS'
  - MUST_NOT_OBSERVE: state.met === true; verifyResult.ok === true for empty steps 2..8; GATE-GOAL: ACHIEVED

## TEST CRITERIA

| TC | Statement | Maps to | Verify |
|----|-----------|---------|--------|
| TC-1 | deriveGoalState.met is false when only step 1 is PASS in a HEAD-bound all-PASS-but-incomplete set | AC-1 | `npx vitest run convex/__tests__/REDHAT-FIX-18-canonical-step-completeness.integration.test.ts -t 'AC-1'` |
| TC-2 | deriveGoalState rejects step-results with duplicate or missing canonical step IDs | AC-2 | `npx vitest run convex/__tests__/REDHAT-FIX-18-canonical-step-completeness.integration.test.ts -t 'AC-2'` |
| TC-3 | a full 1..8 substantiated-PASS set does not produce an incomplete-steps error | AC-3 | `npx vitest run convex/__tests__/REDHAT-FIX-18-canonical-step-completeness.integration.test.ts -t 'AC-3'` |
| TC-4 | incomplete evidence_steps relative to canonical 1..8 fails closed | AC-4 | `npx vitest run convex/__tests__/REDHAT-FIX-18-canonical-step-completeness.integration.test.ts -t 'AC-4'` |
| TC-5 | goal remains GATE-GOAL: BLOCKED for the 1-step all-PASS negative (never ACHIEVED) | AC-1 | `npx vitest run convex/__tests__/REDHAT-FIX-18-canonical-step-completeness.integration.test.ts -t 'AC-1'` |

## SCOPE (file-level write permissions)

**writeAllowed:**
- tools/gate/deriveGoalState.ts (MODIFY — canonical step-set completeness + reject missing/duplicate/extra/reordered; not plan script-path rebinding)
- tools/gate/verifyEvidenceManifest.ts (MODIFY — require canonical evidence_steps set 1..8 when verifying completeness)
- convex/__tests__/REDHAT-FIX-18-canonical-step-completeness.integration.test.ts (NEW)
- convex/__tests__/REDHATFIX12-gate-evidence-integrity.integration.test.ts (MODIFY only if extending AC-9 with AC-completeness; prefer NEW FIX-18 file)

**writeProhibited:**
- convex/couchVerdict.ts — REDHAT-FIX-17/19
- .spec/prds/route-agent-quality/tasks/sprint-04-trust-pipeline/gate-plan.json content rebinding (literal_cmd / planned_at) — REDHAT-FIX-20
- tools/gate/deriveGoalState.ts plan-script rejection of bundles not in HEAD-bound plan — REDHAT-FIX-20 owns that slice
- Forging PASS for human steps 3/4/5/7 or synthesizing S4-T7
- Any RN/Expo/app client code

## READING LIST

- `tools/gate/deriveGoalState.ts` (281-334) — [PRIMARY PATTERN] DeriveOptions.steps caller-selected; allStepsPass = length>0 && !anyBlocked — CRITICAL-2
- `tools/gate/deriveGoalState.ts` (380-427) — CLI reads file.steps and passes through — completeness must not trust unconstrained subset
- `tools/gate/deriveGoalState.ts` (213-265) — substantiateSteps — PASS claims vs manifest; extend with canonical set completeness
- `tools/gate/verifyEvidenceManifest.ts` (64-74,150-215) — Accepts arbitrary evidence_steps; no required 1..8 set today
- `.spec/prds/route-agent-quality/tasks/sprint-04-trust-pipeline/gate-plan.json` (all) — READ-ONLY expected step set source (steps[].n == 1..8); do not rebind literal_cmd (FIX-20)
- `convex/__tests__/REDHATFIX12-gate-evidence-integrity.integration.test.ts` (524-575) — Existing AC-9 only proves supplied PASS cannot exceed chosen manifest — not full completeness

## CODE PATTERN

- Pattern: const expected = loadGatePlanExpectedSteps(cwd); const identity = validateStepIdentity(opts.steps, expected); if (!identity.ok) return error; const allStepsPass = expected.every(n => isPassing(stepByN[n].result)) && !error;
- Pattern source: `tools/gate/deriveGoalState.ts:290-334 (deriveGoalState completeness) + tools/gate/verifyEvidenceManifest.ts:64-74 (parseManifest)`
- Anti-pattern: opts.steps.length > 0 && !anyBlocked; trusting CLI file.steps as the definition of 'complete'; only checking supplied PASS claims without requiring missing steps to be present
- Design references: `.spec/reviews/red-hat-sprint-04-trust-pipeline-20260721T153804Z.md`, `tools/gate/deriveGoalState.ts`, `.spec/prds/route-agent-quality/tasks/sprint-04-trust-pipeline/gate-plan.json`

## VERIFICATION GATES

- AC-1 PRIMARY 1-step incomplete: `npx vitest run convex/__tests__/REDHAT-FIX-18-canonical-step-completeness.integration.test.ts -t 'AC-1'` → Exit 0; met===false; not ACHIEVED
- Full FIX-18 suite: `npx vitest run convex/__tests__/REDHAT-FIX-18-canonical-step-completeness.integration.test.ts` → Exit 0
- Typecheck (in-scope): `npx tsc --noEmit -p convex/tsconfig.json` → Exit 0
- Lint: `pnpm exec biome check tools/gate convex/__tests__/REDHAT-FIX-18-canonical-step-completeness.integration.test.ts` → Exit 0
- Scope compliance: `git diff --name-only HEAD~1 HEAD | sort -u` → Only paths in guardrails.write_allowed
- scenario validator → Exit 0, zero CRITICAL/HIGH:

```bash
python3 -c "import re,sys;print(re.search(r'<!-- REQUIREMENT-CONTRACT v1 -->\n<!--\n(.*?)\n-->',open(sys.argv[1]).read(),re.S).group(1))" \
  .spec/prds/route-agent-quality/tasks/sprint-04-trust-pipeline/REDHAT-FIX-18-*.md \
  | python3 ~/Projects/brain/tools/validate-scenario/validate_scenario.py; echo "EXIT:$?"
```

## AGENT ASSIGNMENT

- Agent: `convex-implementer` — Owns tools/gate deriveGoalState + verifyEvidenceManifest integrity: make met require the fixed committed 1..8 step set with full substantiated-PASS, not a caller-selected non-empty subset.
- Reviewer: `convex-reviewer`

## EVIDENCE GATES

- RED phase: each behavioral AC's test went red before green (pre-fix bug reproduced)
- Integration coverage: PRIMARY AC is integration against real services (Convex dev / filesystem+git)
- Scenario un-fakeable: validate_scenario exit 0 on every behavioral AC; captured EVIDENCE shows concrete must_observe values

## DEPENDENCIES

- Depends on: —
- Blocks: —
- Notes: Coordinate with REDHAT-FIX-20 on tools/gate/deriveGoalState.ts: FIX-18 owns canonical step completeness; FIX-20 owns reject-scripts-not-in-plan. Prefer sequential merge or a single PR that preserves both partitions.

## CODING STANDARDS

- convex/_generated/ai/guidelines.md
- brain/docs/TESTING-HIERARCHY.md
- brain/docs/CODING-STANDARDS.md
- brain/docs/CONVEX-RULES.md

<details>
<summary>▸ Full agent specification (TASK-TEMPLATE v5.2 — machine-readable requirement contract)</summary>

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "version": "1",
  "task_id": "REDHAT-FIX-18",
  "tdd_mode": "red_first",
  "verification_policy": {
    "requires_tests": true,
    "requires_red_evidence": true,
    "requires_seeded_evidence": true
  },
  "fixtures": {
    "canonical-gate-plan": {
      "description": "Committed gate-plan.json with planned_steps=8 and steps n=1..8 (read-only expected set source).",
      "seed_method": "public_api",
      "records": [
        "file .spec/prds/route-agent-quality/tasks/sprint-04-trust-pipeline/gate-plan.json exists with steps[].n == 1..8"
      ]
    },
    "one-step-all-pass-bundle": {
      "description": "Temp git repo HEAD-bound evidence bundle with only step 1 PASS in step-results and manifest evidence_steps.",
      "seed_method": "public_api",
      "records": [
        "temp repo with .gate-evidence/one-step/manifest.json evidence_steps:{'1':{result:'PASS',artifacts:['evidence/step1.json']}}",
        "committed at HEAD with matching artifacts",
        "step-results JSON steps:[{n:1,result:'PASS'}]"
      ]
    },
    "full-eight-step-all-pass-bundle": {
      "description": "Temp git repo HEAD-bound bundle with steps 1..8 all PASS and full evidence_steps 1..8 (completeness happy path; founder may still block).",
      "seed_method": "public_api",
      "records": [
        "manifest evidence_steps for String(1)..String(8) each PASS with \u22651 artifact",
        "step-results steps n=1..8 all PASS in order",
        "committed at HEAD"
      ]
    },
    "reordered-or-duplicate-steps": {
      "description": "Step-results that claim 1..8 PASS but with duplicate n or wrong order/extra ids.",
      "seed_method": "public_api",
      "records": [
        "steps with duplicate n:1 or missing n:7 or extra n:9"
      ]
    }
  },
  "requirements": [
    {
      "id": "AC-1",
      "type": "acceptance_criterion",
      "primary": true,
      "description": "GIVEN a HEAD-bound evidence bundle and step-results containing only step 1 as PASS WHEN deriveGoalState is run THEN met===false and goal is GATE-GOAL: BLOCKED (not ACHIEVED)",
      "verify": "npx vitest run convex/__tests__/REDHAT-FIX-18-canonical-step-completeness.integration.test.ts -t 'AC-1'",
      "maps_to_ac": null,
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "topology": "single-node",
        "verification_service": "filesystem+git temp repo + deriveGoalState (real HEAD-bound paths)",
        "negative_control": {
          "would_fail_if": [
            "allStepsPass is stubbed to opts.steps.length > 0 && !anyBlocked so a 1-step all-PASS set yields met === true",
            "deriveGoalState is mocked to return GATE-GOAL: ACHIEVED for an empty 2..8 step set",
            "static completeness check treats empty missing-steps as complete"
          ]
        },
        "evidence": {
          "artifact_type": "file_artifact",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "one-step-all-pass-bundle",
            "action": {
              "actor": "api_client",
              "steps": [
                "Create temp git repo with one-step-all-pass-bundle committed at HEAD",
                "Call deriveGoalState({steps:[{n:1,result:'PASS'}], bundlePath, repoCwd, convexRepoCwd})",
                "Capture state.met, state.goal, state.gate.overall, state.error or blocker"
              ]
            },
            "end_state": {
              "must_observe": [
                "state.met === false",
                "state.goal === 'GATE-GOAL: BLOCKED'",
                "error.code == 'INCOMPLETE_CANONICAL_STEPS' || state.gate.blocker includes 'incomplete'"
              ],
              "must_not_observe": [
                "state.met === true",
                "state.goal === 'GATE-GOAL: ACHIEVED'",
                "empty missing-steps set treated as complete"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "AC-2",
      "type": "acceptance_criterion",
      "description": "GIVEN step-results that violate the canonical 1..8 identity set WHEN deriveGoalState evaluates completeness THEN met===false with error/blocker naming the identity/order violation",
      "verify": "npx vitest run convex/__tests__/REDHAT-FIX-18-canonical-step-completeness.integration.test.ts -t 'AC-2'",
      "maps_to_ac": null,
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "topology": "single-node",
        "verification_service": "filesystem+git temp repo + deriveGoalState",
        "negative_control": {
          "would_fail_if": [
            "step identity validation is stubbed to accept any caller-selected steps without comparing to the fixed 1..8 set",
            "duplicate/missing step IDs are mocked as valid",
            "empty expected-set comparison is omitted (no-op identity check)"
          ]
        },
        "evidence": {
          "artifact_type": "stdout",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "reordered-or-duplicate-steps",
            "action": {
              "actor": "api_client",
              "steps": [
                "Build step-results with duplicate n:1 and missing n:7 (or extra n:9)",
                "Call deriveGoalState with a full or partial bundle",
                "Capture error/blocker"
              ]
            },
            "end_state": {
              "must_observe": [
                "state.met === false",
                "error.code == 'INVALID_STEP_IDENTITY' || state.gate.blocker includes 'duplicate' || state.gate.blocker includes 'missing'"
              ],
              "must_not_observe": [
                "state.met === true",
                "state.goal === 'GATE-GOAL: ACHIEVED'",
                "empty identity violation"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "AC-3",
      "type": "acceptance_criterion",
      "description": "GIVEN a HEAD-bound full 1..8 PASS bundle and step-results WHEN deriveGoalState runs THEN no incomplete-steps error (founder may still block met)",
      "verify": "npx vitest run convex/__tests__/REDHAT-FIX-18-canonical-step-completeness.integration.test.ts -t 'AC-3'",
      "maps_to_ac": null,
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "topology": "single-node",
        "verification_service": "filesystem+git temp repo + deriveGoalState",
        "negative_control": {
          "would_fail_if": [
            "completeness check is stubbed to reject a full 1..8 substantiated-PASS set (false positive block)",
            "founder path is mocked to inject met === true without S4-T7",
            "static shell reports incomplete for a full set"
          ]
        },
        "evidence": {
          "artifact_type": "file_artifact",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "full-eight-step-all-pass-bundle",
            "action": {
              "actor": "api_client",
              "steps": [
                "Create full-eight-step-all-pass-bundle at HEAD",
                "Call deriveGoalState with steps 1..8 all PASS",
                "Inspect state.error and state.gate.blocker"
              ]
            },
            "end_state": {
              "must_observe": [
                "state.gate.steps.length === 8",
                "state.error?.code !== 'INCOMPLETE_CANONICAL_STEPS'",
                "state.met === false && state.goal === 'GATE-GOAL: BLOCKED' && founder.present === false"
              ],
              "must_not_observe": [
                "error.code == 'INCOMPLETE_CANONICAL_STEPS'",
                "state.met === true with empty founder attestation",
                "no 8 steps"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "AC-4",
      "type": "acceptance_criterion",
      "description": "GIVEN a HEAD-bound manifest with incomplete evidence_steps WHEN verifyEvidenceManifest/deriveGoalState runs THEN fails closed relative to canonical 1..8",
      "verify": "npx vitest run convex/__tests__/REDHAT-FIX-18-canonical-step-completeness.integration.test.ts -t 'AC-4'",
      "maps_to_ac": null,
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "topology": "single-node",
        "verification_service": "filesystem+git + verifyEvidenceManifest/deriveGoalState",
        "negative_control": {
          "would_fail_if": [
            "verifyEvidenceManifest is stubbed to accept arbitrary evidence_steps with no required 1..8 set",
            "manifest completeness is mocked to ok:true for empty steps 2..8",
            "static shell treats a 1-step evidence_steps map as complete"
          ]
        },
        "evidence": {
          "artifact_type": "api_response",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "one-step-all-pass-bundle",
            "action": {
              "actor": "api_client",
              "steps": [
                "Create HEAD-bound one-step manifest",
                "Run verifyEvidenceManifest and/or deriveGoalState completeness path",
                "Capture ok/error"
              ]
            },
            "end_state": {
              "must_observe": [
                "state.met === false",
                "verifyResult.ok === false || error.code == 'INCOMPLETE_EVIDENCE_STEPS' || error.code == 'INCOMPLETE_CANONICAL_STEPS'"
              ],
              "must_not_observe": [
                "state.met === true",
                "verifyResult.ok === true for empty steps 2..8",
                "GATE-GOAL: ACHIEVED"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "TC-1",
      "type": "test_criterion",
      "description": "deriveGoalState.met is false when only step 1 is PASS in a HEAD-bound all-PASS-but-incomplete set",
      "maps_to_ac": "AC-1",
      "verify": "npx vitest run convex/__tests__/REDHAT-FIX-18-canonical-step-completeness.integration.test.ts -t 'AC-1'"
    },
    {
      "id": "TC-2",
      "type": "test_criterion",
      "description": "deriveGoalState rejects step-results with duplicate or missing canonical step IDs",
      "maps_to_ac": "AC-2",
      "verify": "npx vitest run convex/__tests__/REDHAT-FIX-18-canonical-step-completeness.integration.test.ts -t 'AC-2'"
    },
    {
      "id": "TC-3",
      "type": "test_criterion",
      "description": "a full 1..8 substantiated-PASS set does not produce an incomplete-steps error",
      "maps_to_ac": "AC-3",
      "verify": "npx vitest run convex/__tests__/REDHAT-FIX-18-canonical-step-completeness.integration.test.ts -t 'AC-3'"
    },
    {
      "id": "TC-4",
      "type": "test_criterion",
      "description": "incomplete evidence_steps relative to canonical 1..8 fails closed",
      "maps_to_ac": "AC-4",
      "verify": "npx vitest run convex/__tests__/REDHAT-FIX-18-canonical-step-completeness.integration.test.ts -t 'AC-4'"
    },
    {
      "id": "TC-5",
      "type": "test_criterion",
      "description": "goal remains GATE-GOAL: BLOCKED for the 1-step all-PASS negative (never ACHIEVED)",
      "maps_to_ac": "AC-1",
      "verify": "npx vitest run convex/__tests__/REDHAT-FIX-18-canonical-step-completeness.integration.test.ts -t 'AC-1'"
    }
  ]
}
-->

</details>
