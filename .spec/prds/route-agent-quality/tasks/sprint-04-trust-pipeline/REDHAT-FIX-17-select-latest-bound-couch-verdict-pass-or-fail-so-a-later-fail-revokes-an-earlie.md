# REDHAT-FIX-17 — Select LATEST bound couch verdict (pass OR fail) so a later fail revokes an earlier pass
> Status: ⬜ Pending

| Field | Value |
|-------|-------|
| TASK_ID | REDHAT-FIX-17 |
| SPRINT | [Sprint 04 — Trust pipeline](./SPRINT.md) |
| TASK_TYPE | FEATURE |
| AGENT | implementer=`convex-implementer` · reviewer=`convex-reviewer` |
| ESTIMATE | 90 min |
| EFFORT | S |
| PRIORITY | P0 |
| STATUS | Backlog |
| PROPOSED_BY | `convex-planner` |
| TDD_MODE | `red_first` |
| RED_GREEN_REQUIRED | yes |
| CAPABILITIES | CAP-GEO-05 |
| DEPENDS_ON | — |
| BLOCKS | — |

RUNTIME_COMMANDS:
- test: `npx vitest run convex/__tests__/REDHAT-FIX-17-*.integration.test.ts`
- typecheck: `npx tsc --noEmit -p convex/tsconfig.json`
- lint: `pnpm exec biome check`

> **Command note:** `pnpm test` maps to bare `vitest` (watch mode) and HANGS in an agent shell — always use `npx vitest run`. vitest has no `--grep`; the single-test filter is `-t '<name>'`.

## OUTCOME

Makes the couch --all gate honor the latest founder/operator verdict on the active manifest: a later fail after an earlier pass revokes unlock, so pass@t1 → fail@t2 blocks runAllWaterfall. Red-hat CRITICAL-1 (20260721T153804Z): couchGateStatus filters history to PASS rows only, so a founder/operator fail cannot revoke a prior pass — contradicting getCouchVerdict's latest-by-recordedAt contract and append-only fail recording.

## 🚫 CRITICAL CONSTRAINTS (Never tier — read before acting)

**MUST**
- MUST read convex/_generated/ai/guidelines.md before implementation
- MUST select the LATEST verdict (by recordedAt desc) among rows bound to the active manifest sampleId (pass OR fail), then allow only if that row's overallVerdict is 'pass'
- MUST prove pass@t1 → fail@t2 → couchGateStatus.allowed===false and runAllWaterfall throws ConvexError{code:'COUCH_GATE_BLOCKED'} via a live Convex integration test
- MUST keep a sole latest bound pass returning allowed:true (no happy-path regression)
- MUST leave binding equality soft/fail-open as-is in this task — FIX-19 owns strict non-optional manifestHash/catalogVersion equality

**NEVER**
- NEVER filter history to overallVerdict==='pass' before selecting the newest row (the CRITICAL-1 bug)
- NEVER change recordCouchVerdict membership/append-only logic or reject overall fail
- NEVER tighten the (!activeManifestHash || !v.manifestHash || equal) fail-open equality — that is REDHAT-FIX-19
- NEVER touch deriveGoalState, verifyEvidenceManifest, gate-plan.json, or S4-T7 human Founder-Operator evidence
- NEVER synthesize or substitute the human Founder-Operator visual review

**STRICTLY**
- STRICTLY only modify the bound-verdict selection / allowed decision inside couchGateStatus (~274-306) plus the new FIX-17 integration test
- STRICTLY selection must match getCouchVerdict's latest-by-recordedAt authority for the active sample, then gate on that row being pass

## DONE WHEN

- AC-1 [Later fail revokes earlier pass] [PRIMARY]: allowed===false and runAllWaterfall throws COUCH_GATE_BLOCKED
- AC-2 [Sole latest pass still unlocks]: allowed===true and overallVerdict==='pass'
- AC-3 [Sole latest fail blocks --all]: allowed===false and runAllWaterfall throws COUCH_GATE_BLOCKED
- AC-4 [getCouchVerdict latest matches gate authority]: getCouchVerdict returns overallVerdict==='fail' (latest) and couchGateStatus.allowed===false
- Every behavioral AC scenario passes `validate_scenario` (exit 0); RED-against-start recorded before GREEN; seeded-value EVIDENCE artifact captured
- `npx tsc --noEmit -p convex/tsconfig.json` → 0 errors + `pnpm exec biome check` clean + `pnpm convex:dev --once` clean
- NO-REGRESSION: `pnpm type-check` reports zero new errors vs. a baseline captured at task start
- Only SCOPE.writeAllowed files modified (`git diff --name-only`)

## SPECIFICATION

**Objective:** Make couchGateStatus unlock only when the latest bound verdict for the active manifest is pass, so a later fail revokes an earlier pass.

**Success state:** After pass@t1 then fail@t2 on the same active manifest, couchGateStatus.allowed===false with overallVerdict reflecting fail (or null+blocked reason) and runAllWaterfall throws COUCH_GATE_BLOCKED; a sole latest pass still returns allowed:true.

## FIXTURES (shared seed data — referenced by scenario `start_ref`)

- `operator-identity` (seed_method: `public_api`): Authenticated operator used to freeze, activate, and record pass/fail verdicts.
    - users row upserted for clerkUserId 'test:s4t17-operator' with role 'operator' via testSupport:devSetupFounderUser
- `active-manifest-with-pass-then-fail` (seed_method: `public_api`): Frozen active couch manifest with an earlier bound PASS then a later bound FAIL (append-only).
    - operator storeCouchSample('redhatfix17-revoke') freezes a real membership set
    - operator activateCouchManifest for that sampleId
    - operator recordCouchVerdict(pass) exact membership at t1
    - operator recordCouchVerdict(fail) exact membership at t2 (later recordedAt)
- `active-manifest-sole-pass` (seed_method: `public_api`): Frozen active couch manifest with a single latest bound PASS (happy path / negative control).
    - operator storeCouchSample('redhatfix17-sole-pass') + activateCouchManifest + recordCouchVerdict(pass) only
- `active-manifest-sole-fail` (seed_method: `public_api`): Frozen active couch manifest with only a FAIL verdict (never had a pass).
    - operator storeCouchSample('redhatfix17-sole-fail') + activateCouchManifest + recordCouchVerdict(fail)

## ACCEPTANCE CRITERIA (TDD beads — RED → GREEN → REFACTOR per AC)

### AC-1 [PRIMARY] — Later fail revokes earlier pass

**Requirement:** GIVEN A frozen active manifest with operator-recorded pass@t1 then fail@t2 (append-only) bound to the same sampleId WHEN couchGateStatus is queried and runAllWaterfall is called THEN allowed===false and runAllWaterfall throws COUCH_GATE_BLOCKED

- TEST_TIER: `integration` · VERIFICATION_SERVICE: Convex dev deployment (real couchGateStatus + runAllWaterfall gate)
- FLOW_REF: UC-VER-05
- VERIFY: `npx vitest run convex/__tests__/REDHAT-FIX-17-latest-verdict-revokes-pass.integration.test.ts -t 'AC-1'`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: the status path is stubbed to filter history to pass-only rows so fail@t2 is ignored and pass@t1 still unlocks; couchGateStatus is mocked to always return allowed === true after a later fail; empty fail history is treated as still unlocked (pass-only selection)
- EVIDENCE: `db_query` (required_capture: true)
- CASE 1 — start_ref `active-manifest-with-pass-then-fail`
  - ACTION: Seed active-manifest-with-pass-then-fail via real operator entrypoints (storeCouchSample, activateCouchManifest, recordCouchVerdict pass then fail); Query couchGateStatus; Call runAllWaterfall({routeIds:['test:s4t17-r1'], maxCost:1}) and capture the thrown error
  - MUST_OBSERVE: couchGateStatus.allowed === false; error.code == 'COUCH_GATE_BLOCKED'
  - MUST_NOT_OBSERVE: couchGateStatus.allowed === true; empty fail history still unlocks; runAllWaterfall proceeds with no COUCH_GATE_BLOCKED

### AC-2 — Sole latest pass still unlocks

**Requirement:** GIVEN A frozen active manifest with a single latest bound PASS and no later fail WHEN couchGateStatus is queried THEN allowed===true and overallVerdict==='pass'

- TEST_TIER: `integration` · VERIFICATION_SERVICE: Convex dev deployment (couchGateStatus happy path)
- FLOW_REF: UC-VER-05
- VERIFY: `npx vitest run convex/__tests__/REDHAT-FIX-17-latest-verdict-revokes-pass.integration.test.ts -t 'AC-2'`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: the latest-verdict selector is stubbed to require a fail row and blocks a sole pass; couchGateStatus is mocked to return allowed === false for a sole pass; empty pass history is incorrectly required before unlock
- EVIDENCE: `db_query` (required_capture: true)
- CASE 1 — start_ref `active-manifest-sole-pass`
  - ACTION: Seed active-manifest-sole-pass via real operator entrypoints; Query couchGateStatus
  - MUST_OBSERVE: couchGateStatus.allowed === true; couchGateStatus.overallVerdict === 'pass'
  - MUST_NOT_OBSERVE: couchGateStatus.allowed === false; no bound pass; empty pass history

### AC-3 — Sole latest fail blocks --all

**Requirement:** GIVEN A frozen active manifest with only a FAIL verdict (never passed) WHEN couchGateStatus is queried and runAllWaterfall is called THEN allowed===false and runAllWaterfall throws COUCH_GATE_BLOCKED

- TEST_TIER: `integration` · VERIFICATION_SERVICE: Convex dev deployment (fail-only gate block)
- FLOW_REF: UC-VER-05
- VERIFY: `npx vitest run convex/__tests__/REDHAT-FIX-17-latest-verdict-revokes-pass.integration.test.ts -t 'AC-3'`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: fail-only history is stubbed/ignored because no PASS row exists and the gate falls through to allowed === true; couchGateStatus is mocked to treat empty pass list as unlock; static shell returns allowed === true with no fail check
- EVIDENCE: `db_query` (required_capture: true)
- CASE 1 — start_ref `active-manifest-sole-fail`
  - ACTION: Seed active-manifest-sole-fail via real operator entrypoints; Query couchGateStatus; Call runAllWaterfall and capture the error
  - MUST_OBSERVE: couchGateStatus.allowed === false; error.code == 'COUCH_GATE_BLOCKED'
  - MUST_NOT_OBSERVE: couchGateStatus.allowed === true; empty pass list unlocks; no COUCH_GATE_BLOCKED

### AC-4 — getCouchVerdict latest matches gate authority

**Requirement:** GIVEN The pass-then-fail fixture (AC-1) WHEN getCouchVerdict({sampleId}) and couchGateStatus are both queried THEN getCouchVerdict returns overallVerdict==='fail' (latest) and couchGateStatus.allowed===false

- TEST_TIER: `integration` · VERIFICATION_SERVICE: Convex dev deployment (getCouchVerdict vs couchGateStatus consistency)
- FLOW_REF: UC-VER-05
- VERIFY: `npx vitest run convex/__tests__/REDHAT-FIX-17-latest-verdict-revokes-pass.integration.test.ts -t 'AC-4'`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: getCouchVerdict is stubbed to return pass while a later fail exists; couchGateStatus is mocked to stay allowed === true despite getCouchVerdict overallVerdict === 'fail'; empty fail row is omitted from the latest selection
- EVIDENCE: `api_response` (required_capture: true)
- CASE 1 — start_ref `active-manifest-with-pass-then-fail`
  - ACTION: Seed pass-then-fail fixture; Query getCouchVerdict({sampleId}); Query couchGateStatus
  - MUST_OBSERVE: getCouchVerdict.overallVerdict === 'fail'; couchGateStatus.allowed === false
  - MUST_NOT_OBSERVE: getCouchVerdict.overallVerdict === 'pass'; couchGateStatus.allowed === true; empty fail history

## TEST CRITERIA

| TC | Statement | Maps to | Verify |
|----|-----------|---------|--------|
| TC-1 | couchGateStatus.allowed is false when the latest bound verdict is fail after an earlier pass | AC-1 | `npx vitest run convex/__tests__/REDHAT-FIX-17-latest-verdict-revokes-pass.integration.test.ts -t 'AC-1'` |
| TC-2 | runAllWaterfall throws COUCH_GATE_BLOCKED after pass@t1 then fail@t2 | AC-1 | `npx vitest run convex/__tests__/REDHAT-FIX-17-latest-verdict-revokes-pass.integration.test.ts -t 'AC-1'` |
| TC-3 | couchGateStatus.allowed is true when the sole latest bound verdict is pass | AC-2 | `npx vitest run convex/__tests__/REDHAT-FIX-17-latest-verdict-revokes-pass.integration.test.ts -t 'AC-2'` |
| TC-4 | couchGateStatus.allowed is false when the only bound verdict is fail | AC-3 | `npx vitest run convex/__tests__/REDHAT-FIX-17-latest-verdict-revokes-pass.integration.test.ts -t 'AC-3'` |
| TC-5 | getCouchVerdict latest overallVerdict is fail while couchGateStatus.allowed is false on the pass-then-fail sample | AC-4 | `npx vitest run convex/__tests__/REDHAT-FIX-17-latest-verdict-revokes-pass.integration.test.ts -t 'AC-4'` |

## SCOPE (file-level write permissions)

**writeAllowed:**
- convex/couchVerdict.ts (MODIFY — only bound-verdict selection / allowed decision ~274-306; keep soft binding equality untouched)
- convex/__tests__/REDHAT-FIX-17-latest-verdict-revokes-pass.integration.test.ts (NEW)

**writeProhibited:**
- convex/couchVerdict.ts binding fail-open equality (!activeManifestHash || !v.manifestHash || equal) — REDHAT-FIX-19
- convex/couchVerdict.ts catalogVersion return-shape completeness — REDHAT-FIX-19
- convex/couchVerdict.ts recordCouchVerdict membership / append-only / WRONG_FORCES_FAIL logic
- tools/gate/deriveGoalState.ts — REDHAT-FIX-18
- tools/gate/verifyEvidenceManifest.ts — REDHAT-FIX-18
- tools/gate/resolveFounderVerdict.ts — REDHAT-FIX-19
- .spec/prds/route-agent-quality/tasks/sprint-04-trust-pipeline/gate-plan.json — REDHAT-FIX-20
- S4-T7 human Founder-Operator visual review — external human-owned blocker; never synthesize
- Any RN/Expo/app client code

## READING LIST

- `convex/_generated/ai/guidelines.md` (all) — Convex API rules that override training data (mandatory)
- `convex/couchVerdict.ts` (152-171) — getCouchVerdict already returns LATEST by recordedAt (any verdict) — status must match this authority
- `convex/couchVerdict.ts` (274-306) — [PRIMARY PATTERN] boundPass filters to overallVerdict==='pass' then sorts — CRITICAL-1; change to latest bound verdict then allow only if pass
- `convex/couchVerdict.ts` (52-149) — recordCouchVerdict is append-only and allows overall fail — do not change membership/append-only
- `convex/couchVerdict.ts` (574-604) — runAllWaterfall throws COUCH_GATE_BLOCKED when gate.allowed is false — PRIMARY AC end-to-end sink
- `convex/__tests__/REDHAT-FIX-16-legacy-manifest-fail-closed.integration.test.ts` (1-120) — Live Convex seed pattern (devSetupFounderUser, storeCouchSample, activate, recordCouchVerdict) to mirror

## CODE PATTERN

- Pattern: const bound = verdicts.filter(v => softBind(v)).sort((a,b)=>b.recordedAt-a.recordedAt); const latest = bound[0]; if (!latest || latest.overallVerdict !== 'pass') return { allowed:false, ... }; return { allowed:true, overallVerdict:'pass', ... }
- Pattern source: `convex/couchVerdict.ts:152-171 (getCouchVerdict latest-any) + convex/couchVerdict.ts:274-306 (status selection to fix)`
- Anti-pattern: filter(v => v.overallVerdict === 'pass') then take [0] — ignores later fail; inventing a replace-in-place update of the pass row instead of append-only
- Design references: `.spec/reviews/red-hat-sprint-04-trust-pipeline-20260721T153804Z.md`, `convex/couchVerdict.ts`, `.spec/prds/route-agent-quality/tasks/sprint-04-trust-pipeline/SPRINT.md`

## VERIFICATION GATES

- AC-1 PRIMARY pass→fail revokes: `npx vitest run convex/__tests__/REDHAT-FIX-17-latest-verdict-revokes-pass.integration.test.ts -t 'AC-1'` → Exit 0; allowed===false; COUCH_GATE_BLOCKED
- Full FIX-17 suite: `npx vitest run convex/__tests__/REDHAT-FIX-17-latest-verdict-revokes-pass.integration.test.ts` → Exit 0
- Typecheck (in-scope): `npx tsc --noEmit -p convex/tsconfig.json` → Exit 0
- Lint: `pnpm exec biome check` → Exit 0
- Scope compliance: `git diff --name-only HEAD~1 HEAD | sort -u` → Only paths in guardrails.write_allowed
- scenario validator → Exit 0, zero CRITICAL/HIGH:

```bash
python3 -c "import re,sys;print(re.search(r'<!-- REQUIREMENT-CONTRACT v1 -->\n<!--\n(.*?)\n-->',open(sys.argv[1]).read(),re.S).group(1))" \
  .spec/prds/route-agent-quality/tasks/sprint-04-trust-pipeline/REDHAT-FIX-17-*.md \
  | python3 ~/Projects/brain/tools/validate-scenario/validate_scenario.py; echo "EXIT:$?"
```

## AGENT ASSIGNMENT

- Agent: `convex-implementer` — Owns Convex couch-gate control plane: change couchGateStatus verdict selection so the latest bound append-only row is authoritative (pass OR fail), matching getCouchVerdict and recordCouchVerdict append-only fail semantics.
- Reviewer: `convex-reviewer`

## EVIDENCE GATES

- RED phase: each behavioral AC's test went red before green (pre-fix bug reproduced)
- Integration coverage: PRIMARY AC is integration against real services (Convex dev / filesystem+git)
- Scenario un-fakeable: validate_scenario exit 0 on every behavioral AC; captured EVIDENCE shows concrete must_observe values

## DEPENDENCIES

- Depends on: —
- Blocks: —
- Notes: Coordinate with REDHAT-FIX-19 if both land together: FIX-17 owns latest-verdict selection; FIX-19 owns binding equality strictness and catalogVersion on all return shapes. Same file, non-overlapping logic blocks.

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
  "task_id": "REDHAT-FIX-17",
  "tdd_mode": "red_first",
  "verification_policy": {
    "requires_tests": true,
    "requires_red_evidence": true,
    "requires_seeded_evidence": true
  },
  "fixtures": {
    "operator-identity": {
      "description": "Authenticated operator used to freeze, activate, and record pass/fail verdicts.",
      "seed_method": "public_api",
      "records": [
        "users row upserted for clerkUserId 'test:s4t17-operator' with role 'operator' via testSupport:devSetupFounderUser"
      ]
    },
    "active-manifest-with-pass-then-fail": {
      "description": "Frozen active couch manifest with an earlier bound PASS then a later bound FAIL (append-only).",
      "seed_method": "public_api",
      "records": [
        "operator storeCouchSample('redhatfix17-revoke') freezes a real membership set",
        "operator activateCouchManifest for that sampleId",
        "operator recordCouchVerdict(pass) exact membership at t1",
        "operator recordCouchVerdict(fail) exact membership at t2 (later recordedAt)"
      ]
    },
    "active-manifest-sole-pass": {
      "description": "Frozen active couch manifest with a single latest bound PASS (happy path / negative control).",
      "seed_method": "public_api",
      "records": [
        "operator storeCouchSample('redhatfix17-sole-pass') + activateCouchManifest + recordCouchVerdict(pass) only"
      ]
    },
    "active-manifest-sole-fail": {
      "description": "Frozen active couch manifest with only a FAIL verdict (never had a pass).",
      "seed_method": "public_api",
      "records": [
        "operator storeCouchSample('redhatfix17-sole-fail') + activateCouchManifest + recordCouchVerdict(fail)"
      ]
    }
  },
  "requirements": [
    {
      "id": "AC-1",
      "type": "acceptance_criterion",
      "primary": true,
      "description": "GIVEN a frozen active manifest with operator-recorded pass@t1 then fail@t2 WHEN couchGateStatus is queried and runAllWaterfall is called THEN allowed===false and runAllWaterfall throws COUCH_GATE_BLOCKED",
      "verify": "npx vitest run convex/__tests__/REDHAT-FIX-17-latest-verdict-revokes-pass.integration.test.ts -t 'AC-1'",
      "maps_to_ac": null,
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "topology": "single-node",
        "verification_service": "Convex dev deployment (real couchGateStatus + runAllWaterfall gate)",
        "negative_control": {
          "would_fail_if": [
            "the status path is stubbed to filter history to pass-only rows so fail@t2 is ignored and pass@t1 still unlocks",
            "couchGateStatus is mocked to always return allowed === true after a later fail",
            "empty fail history is treated as still unlocked (pass-only selection)"
          ]
        },
        "evidence": {
          "artifact_type": "db_query",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "active-manifest-with-pass-then-fail",
            "action": {
              "actor": "api_client",
              "steps": [
                "Seed active-manifest-with-pass-then-fail via real operator entrypoints (storeCouchSample, activateCouchManifest, recordCouchVerdict pass then fail)",
                "Query couchGateStatus",
                "Call runAllWaterfall({routeIds:['test:s4t17-r1'], maxCost:1}) and capture the thrown error"
              ]
            },
            "end_state": {
              "must_observe": [
                "couchGateStatus.allowed === false",
                "error.code == 'COUCH_GATE_BLOCKED'"
              ],
              "must_not_observe": [
                "couchGateStatus.allowed === true",
                "empty fail history still unlocks",
                "runAllWaterfall proceeds with no COUCH_GATE_BLOCKED"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "AC-2",
      "type": "acceptance_criterion",
      "description": "GIVEN a frozen active manifest with a single latest bound PASS WHEN couchGateStatus is queried THEN allowed===true and overallVerdict==='pass'",
      "verify": "npx vitest run convex/__tests__/REDHAT-FIX-17-latest-verdict-revokes-pass.integration.test.ts -t 'AC-2'",
      "maps_to_ac": null,
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "topology": "single-node",
        "verification_service": "Convex dev deployment (couchGateStatus happy path)",
        "negative_control": {
          "would_fail_if": [
            "the latest-verdict selector is stubbed to require a fail row and blocks a sole pass",
            "couchGateStatus is mocked to return allowed === false for a sole pass",
            "empty pass history is incorrectly required before unlock"
          ]
        },
        "evidence": {
          "artifact_type": "db_query",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "active-manifest-sole-pass",
            "action": {
              "actor": "api_client",
              "steps": [
                "Seed active-manifest-sole-pass via real operator entrypoints",
                "Query couchGateStatus"
              ]
            },
            "end_state": {
              "must_observe": [
                "couchGateStatus.allowed === true",
                "couchGateStatus.overallVerdict === 'pass'"
              ],
              "must_not_observe": [
                "couchGateStatus.allowed === false",
                "no bound pass",
                "empty pass history"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "AC-3",
      "type": "acceptance_criterion",
      "description": "GIVEN a frozen active manifest with only a FAIL verdict WHEN couchGateStatus is queried and runAllWaterfall is called THEN allowed===false and runAllWaterfall throws COUCH_GATE_BLOCKED",
      "verify": "npx vitest run convex/__tests__/REDHAT-FIX-17-latest-verdict-revokes-pass.integration.test.ts -t 'AC-3'",
      "maps_to_ac": null,
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "topology": "single-node",
        "verification_service": "Convex dev deployment (fail-only gate block)",
        "negative_control": {
          "would_fail_if": [
            "fail-only history is stubbed/ignored because no PASS row exists and the gate falls through to allowed === true",
            "couchGateStatus is mocked to treat empty pass list as unlock",
            "static shell returns allowed === true with no fail check"
          ]
        },
        "evidence": {
          "artifact_type": "db_query",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "active-manifest-sole-fail",
            "action": {
              "actor": "api_client",
              "steps": [
                "Seed active-manifest-sole-fail via real operator entrypoints",
                "Query couchGateStatus",
                "Call runAllWaterfall and capture the error"
              ]
            },
            "end_state": {
              "must_observe": [
                "couchGateStatus.allowed === false",
                "error.code == 'COUCH_GATE_BLOCKED'"
              ],
              "must_not_observe": [
                "couchGateStatus.allowed === true",
                "empty pass list unlocks",
                "no COUCH_GATE_BLOCKED"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "AC-4",
      "type": "acceptance_criterion",
      "description": "GIVEN the pass-then-fail fixture WHEN getCouchVerdict({sampleId}) and couchGateStatus are queried THEN getCouchVerdict.overallVerdict==='fail' and couchGateStatus.allowed===false",
      "verify": "npx vitest run convex/__tests__/REDHAT-FIX-17-latest-verdict-revokes-pass.integration.test.ts -t 'AC-4'",
      "maps_to_ac": null,
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "topology": "single-node",
        "verification_service": "Convex dev deployment (getCouchVerdict vs couchGateStatus consistency)",
        "negative_control": {
          "would_fail_if": [
            "getCouchVerdict is stubbed to return pass while a later fail exists",
            "couchGateStatus is mocked to stay allowed === true despite getCouchVerdict overallVerdict === 'fail'",
            "empty fail row is omitted from the latest selection"
          ]
        },
        "evidence": {
          "artifact_type": "api_response",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "active-manifest-with-pass-then-fail",
            "action": {
              "actor": "api_client",
              "steps": [
                "Seed pass-then-fail fixture",
                "Query getCouchVerdict({sampleId})",
                "Query couchGateStatus"
              ]
            },
            "end_state": {
              "must_observe": [
                "getCouchVerdict.overallVerdict === 'fail'",
                "couchGateStatus.allowed === false"
              ],
              "must_not_observe": [
                "getCouchVerdict.overallVerdict === 'pass'",
                "couchGateStatus.allowed === true",
                "empty fail history"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "TC-1",
      "type": "test_criterion",
      "description": "couchGateStatus.allowed is false when the latest bound verdict is fail after an earlier pass",
      "maps_to_ac": "AC-1",
      "verify": "npx vitest run convex/__tests__/REDHAT-FIX-17-latest-verdict-revokes-pass.integration.test.ts -t 'AC-1'"
    },
    {
      "id": "TC-2",
      "type": "test_criterion",
      "description": "runAllWaterfall throws COUCH_GATE_BLOCKED after pass@t1 then fail@t2",
      "maps_to_ac": "AC-1",
      "verify": "npx vitest run convex/__tests__/REDHAT-FIX-17-latest-verdict-revokes-pass.integration.test.ts -t 'AC-1'"
    },
    {
      "id": "TC-3",
      "type": "test_criterion",
      "description": "couchGateStatus.allowed is true when the sole latest bound verdict is pass",
      "maps_to_ac": "AC-2",
      "verify": "npx vitest run convex/__tests__/REDHAT-FIX-17-latest-verdict-revokes-pass.integration.test.ts -t 'AC-2'"
    },
    {
      "id": "TC-4",
      "type": "test_criterion",
      "description": "couchGateStatus.allowed is false when the only bound verdict is fail",
      "maps_to_ac": "AC-3",
      "verify": "npx vitest run convex/__tests__/REDHAT-FIX-17-latest-verdict-revokes-pass.integration.test.ts -t 'AC-3'"
    },
    {
      "id": "TC-5",
      "type": "test_criterion",
      "description": "getCouchVerdict latest overallVerdict is fail while couchGateStatus.allowed is false on the pass-then-fail sample",
      "maps_to_ac": "AC-4",
      "verify": "npx vitest run convex/__tests__/REDHAT-FIX-17-latest-verdict-revokes-pass.integration.test.ts -t 'AC-4'"
    }
  ]
}
-->

</details>
