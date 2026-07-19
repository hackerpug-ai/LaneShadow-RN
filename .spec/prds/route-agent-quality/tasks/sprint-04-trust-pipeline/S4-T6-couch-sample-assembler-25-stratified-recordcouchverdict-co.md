# S4-T6 — Couch-sample assembler (~25 stratified) + recordCouchVerdict + couchGateStatus --all block (VER-05 AC-1..5) (UC-VER-05)
> Status: ✅ Completed
> Commit: 3271846b
> Reviewer: convex-reviewer
> Completed: 2026-07-18T06:11:31Z

| Field | Value |
|-------|-------|
| TASK_ID | S4-T6 |
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
| DEPENDS_ON | S4-T5 |
| BLOCKS | — |

RUNTIME_COMMANDS:
- test: `pnpm test convex/__tests__/<FILE>.integration.test.ts`
- typecheck: `pnpm type-check`
- lint: `pnpm exec biome check`

## OUTCOME

~25 stratified routes rendered as PNGs with metadata; founder records per-route verdicts + overall pass/fail; --all block until pass

## 🚫 CRITICAL CONSTRAINTS (Never tier — read before acting)

**MUST**
- MUST read convex/_generated/ai/guidelines.md before implementation
- MUST stratify sample across all 3 provenance types (scraped_promoted, ai_reconstructed, name_routed)
- MUST include range of reconstruction difficulty (easy, medium, hard)
- MUST render each route as map PNG with provenance + lengths
- MUST block --all batch until couch verdict = pass

**NEVER**
- NEVER allow full batch before couch verdict = pass
- NEVER assemble un-stratified sample (single provenance only)
- NEVER render sample without map PNG per route
- NEVER accept a verdict with 'wrong' routes (fabricated-but-passing)
- NEVER let founder review more than ~25 routes in couch sample

**STRICTLY**
- STRICTLY sample size is ~25 routes (not 100, not 5)
- STRICTLY each route shows provenance + measured-vs-claimed lengths
- STRICTLY per-route verdict is true/off/wrong
- STRICTLY single 'wrong' → overall fail
- STRICTLY couchGateStatus blocks --all until pass recorded

## DONE WHEN

- AC-1 [Couch-sample assembler stratifies ~25 routes across all 3 provenance types] [PRIMARY]: ~25 routes are selected with representation from all 3 provenance types
- AC-2 [Couch-sample includes range of reconstruction difficulty (easy anchor-rich, sparse-description cases)]: Sample includes easy (7+ anchors, clear description) + hard (2-3 anchors, sparse description) cases
- AC-3 [Couch-sample renders each route as map PNG with provenance + measured-vs-claimed lengths]: Each route has a map PNG + metadata showing provenance + routedMiles vs claimedMiles
- AC-4 [recordCouchVerdict accepts per-route verdicts (true/off/wrong) + overall pass/fail]: Verdicts are persisted and overall pass/fail is recorded
- AC-5 [couchGateStatus blocks --all batch until couch verdict = pass]: --all is blocked until recordCouchVerdict({overallVerdict: 'pass'}) is called
- Every behavioral AC scenario passes `validate_scenario` (exit 0); RED-against-start recorded before GREEN; seeded-value EVIDENCE artifact captured
- `pnpm type-check` clean + `pnpm exec biome check` clean + `pnpm convex:dev --once` clean
- Only SCOPE.writeAllowed files modified (`git diff --name-only`)

## SPECIFICATION

**Objective:** Assemble ~25-route stratified couch sample across provenance types + difficulty, render as map PNGs, record founder verdict, and block full batch until pass

**Success state:** ~25 stratified routes rendered as PNGs with metadata; founder records per-route verdicts + overall pass/fail; --all block until pass

## FIXTURES (shared seed data — referenced by scenario `start_ref`; seeded via `curatedGeometryTestSupport`)

- `couch-provenance-mix` (seed_method: `public_api`): Routes across all 3 provenance types (for stratification testing)
    - routeId: 'test:scraped-1', provenance: 'scraped_promoted', anchorCount: 5, lengthMiles: 41
    - routeId: 'test:ai-recon-1', provenance: 'ai_reconstructed', anchorCount: 7, lengthMiles: 50
    - routeId: 'test:name-routed-1', provenance: 'name_routed', anchorCount: 2, lengthMiles: 25

## ACCEPTANCE CRITERIA (TDD beads — RED → GREEN → REFACTOR per AC)

### AC-1 [PRIMARY] — Couch-sample assembler stratifies ~25 routes across all 3 provenance types

**Requirement:** GIVEN A catalog with routes across all 3 provenance types (scraped_promoted, ai_reconstructed, name_routed) WHEN Couch-sample assembler runs --sample THEN ~25 routes are selected with representation from all 3 provenance types

- TEST_TIER: `integration`  ·  VERIFICATION_SERVICE: Convex dev deployment (real couch-sample assembler)
- FLOW_REF: UC-VER-05
- VERIFY: `pnpm test convex/__tests__/S4T6-couch-stratification.integration.test.ts`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: sample is single-provenance only; sample size is not ~25; provenance types are missing
- EVIDENCE: `db_query` (required_capture: true)
- CASE 1 — start_ref `couch-stratified-sample`
    - ACTION (api_client): Run couch-sample assembler --sample; Query sample routes by provenance; Verify all 3 provenance types present; Verify total ~25 routes
    - MUST_OBSERVE: scraped_promoted count >= 5, ai_reconstructed count >= 5, name_routed count >= 5, total routes >= 20, <= 30
    - MUST_NOT_OBSERVE: any provenance type count == 0

### AC-2 — Couch-sample includes range of reconstruction difficulty (easy anchor-rich, sparse-description cases)

**Requirement:** GIVEN Routes varying in anchor count (2 to 15) and description length WHEN Couch-sample assembler stratifies THEN Sample includes easy (7+ anchors, clear description) + hard (2-3 anchors, sparse description) cases

- TEST_TIER: `integration`  ·  VERIFICATION_SERVICE: Convex dev deployment (real difficulty stratification)
- FLOW_REF: UC-VER-05
- VERIFY: `pnpm test convex/__tests__/S4T6-couch-difficulty-range.integration.test.ts`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: sample is all-easy cases; sample is all-hard cases; difficulty is not measured
- EVIDENCE: `db_query` (required_capture: true)
- CASE 1 — start_ref `couch-difficulty-spread`
    - ACTION (api_client): Run couch-sample assembler; Query sample anchor counts; Verify range: min >= 2, max >= 7
    - MUST_OBSERVE: min anchor count >= 2, max anchor count >= 7, spread >= 5
    - MUST_NOT_OBSERVE: all routes have same anchor count

### AC-3 — Couch-sample renders each route as map PNG with provenance + measured-vs-claimed lengths

**Requirement:** GIVEN A stratified couch-sample of ~25 routes WHEN Couch-sample assembler exports the sample THEN Each route has a map PNG + metadata showing provenance + routedMiles vs claimedMiles

- TEST_TIER: `integration`  ·  VERIFICATION_SERVICE: Convex dev deployment (real PNG rendering + metadata export)
- FLOW_REF: UC-VER-05
- VERIFY: `pnpm test convex/__tests__/S4T6-couch-render-pngs.integration.test.ts`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: PNG files are not generated; metadata is missing; provenance is not shown
- EVIDENCE: `file_artifact` (required_capture: true)
- CASE 1 — start_ref `couch-render-pngs`
    - ACTION (api_client): Run couch-sample assembler --export; Verify PNG files exist for each route; Verify metadata file includes provenance + lengths
    - MUST_OBSERVE: PNG count == sample size, metadata.provenance == 'ai_reconstructed' (literal value present), metadata.routedMiles == 41.1 AND metadata.claimedMiles == 41 (both present)
    - MUST_NOT_OBSERVE: PNG files missing, metadata incomplete

### AC-4 — recordCouchVerdict accepts per-route verdicts (true/off/wrong) + overall pass/fail

**Requirement:** GIVEN Founder reviewing rendered couch-sample PNGs WHEN Founder calls recordCouchVerdict with per-route verdicts + overall verdict THEN Verdicts are persisted and overall pass/fail is recorded

- TEST_TIER: `integration`  ·  VERIFICATION_SERVICE: Convex dev deployment (real recordCouchVerdict mutation)
- FLOW_REF: UC-VER-05
- VERIFY: `pnpm test convex/__tests__/S4T6-record-verdict.integration.test.ts`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: verdicts are not persisted; overall verdict is not recorded; per-route verdicts are missing
- EVIDENCE: `db_query` (required_capture: true)
- CASE 1 — start_ref `record-verdict-pass`
    - ACTION (api_client): Call recordCouchVerdict({overallVerdict: 'pass', routeVerdicts: [...]}); Query couch_verdict table; Verify overall pass, per-route verdicts stored
    - MUST_OBSERVE: overallVerdict == 'pass', routeVerdicts count == sample size
    - MUST_NOT_OBSERVE: verdict not persisted

### AC-5 — couchGateStatus blocks --all batch until couch verdict = pass

**Requirement:** GIVEN Full batch run invoked with --all flag WHEN couchGateStatus checks for couch verdict THEN --all is blocked until recordCouchVerdict({overallVerdict: 'pass'}) is called

- TEST_TIER: `integration`  ·  VERIFICATION_SERVICE: Convex dev deployment (real couchGateStatus block)
- FLOW_REF: UC-VER-05
- VERIFY: `pnpm test convex/__tests__/S4T6-couch-gate-block.integration.test.ts`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: --all runs without couch pass; block is not enforced; verdict is not checked
- EVIDENCE: `stdout` (required_capture: true)
- CASE 1 — start_ref `couch-gate-block-all`
    - ACTION (api_client): Call waterfall --all before couch verdict; Verify command blocked with error; Call recordCouchVerdict({overallVerdict: 'pass'}); Verify --all now succeeds
    - MUST_OBSERVE: --all exitCode != 0 before couch pass (blocked), --all exitCode == 0 after couch pass (unblocked)
    - MUST_NOT_OBSERVE: --all runs before pass

## TEST CRITERIA

| TC | Statement | Maps to | Verify |
|----|-----------|---------|--------|
| TC-1 | Couch sample stratifies across provenance types | AC-1 | `pnpm test convex/__tests__/S4T6-couch-stratification.integration.test.ts --grep 'TC-1'` |
| TC-2 | Couch sample includes difficulty range | AC-2 | `pnpm test convex/__tests__/S4T6-couch-difficulty-range.integration.test.ts --grep 'TC-2'` |
| TC-3 | Couch sample renders PNGs with metadata | AC-3 | `pnpm test convex/__tests__/S4T6-couch-render-pngs.integration.test.ts --grep 'TC-3'` |
| TC-4 | recordCouchVerdict persists verdicts | AC-4 | `pnpm test convex/__tests__/S4T6-record-verdict.integration.test.ts --grep 'TC-4'` |
| TC-5 | couchGateStatus blocks --all until pass | AC-5 | `pnpm test convex/__tests__/S4T6-couch-gate-block.integration.test.ts --grep 'TC-5'` |

## SCOPE (file-level write permissions)

**writeAllowed:**
- convex/actions/couchSampleAssembler.ts (NEW) - assembler + stratification
- convex/actions/couchVerdict.ts (NEW) - recordCouchVerdict mutation
- convex/schema.ts (MODIFY) - couch_verdict table
- convex/__tests__/S4T6-*.integration.test.ts (NEW)

**writeProhibited:**
- Sample size > 30 or < 20 - must be ~25
- Single-provenance sample - must stratify
- Unblocked --all - must enforce couch pass
- PNG-less export - must render each route

## READING LIST

- `convex/actions/couchSampleAssembler.ts` (stratification logic) — Sample assembly pattern
- `convex/schema.ts` (couch_verdict table) — Verdict storage schema
- `convex/actions/waterfallOrchestrator.ts` (couchGateStatus check) — Block enforcement

## CODE PATTERN

- Pattern: Stratified sample + verdict block
- Pattern source: `convex/actions/couchSampleAssembler.ts`
- Anti-pattern: Unstratified sample, unblocked --all, missing PNGs

## VERIFICATION GATES

- test: `pnpm test convex/__tests__/S4T6-*.integration.test.ts` → Exit 0
- typecheck: `pnpm type-check` → Exit 0
- lint: `pnpm exec biome check` → Exit 0
- convex build: `pnpm convex:dev --once` → Exit 0

## AGENT ASSIGNMENT

- Agent: `convex-implementer` — Convex backend implementation - assembles stratified couch sample and blocks full batch until founder verdict
- Reviewer: `convex-reviewer`

## EVIDENCE GATES

- RED phase: each behavioral AC's test went red before green (TDD_STATE history).
- Integration coverage: PRIMARY AC is `integration` against the real Convex dev deployment.
- Scenario un-fakeable: `validate_scenario` exit 0 on every behavioral AC; captured EVIDENCE shows the seeded MUST_OBSERVE value (not merely "tests passed").

## DEPENDENCIES

- Depends on: S4-T5
- Blocks: —

## CODING STANDARDS

- convex/_generated/ai/guidelines.md
- brain/docs/TESTING-HIERARCHY.md

<details>
<summary>▸ Full agent specification (TASK-TEMPLATE v5.2 — machine-readable requirement contract)</summary>

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "version": "1",
  "task_id": "S4-T6",
  "tdd_mode": "red_first",
  "verification_policy": {
    "requires_tests": true,
    "requires_red_evidence": true,
    "requires_seeded_evidence": true
  },
  "fixtures": {
    "couch-provenance-mix": {
      "description": "Routes across all 3 provenance types (for stratification testing)",
      "seed_method": "public_api",
      "records": [
        "routeId: 'test:scraped-1', provenance: 'scraped_promoted', anchorCount: 5, lengthMiles: 41",
        "routeId: 'test:ai-recon-1', provenance: 'ai_reconstructed', anchorCount: 7, lengthMiles: 50",
        "routeId: 'test:name-routed-1', provenance: 'name_routed', anchorCount: 2, lengthMiles: 25"
      ]
    }
  },
  "requirements": [
    {
      "id": "AC-1",
      "type": "acceptance_criterion",
      "primary": true,
      "description": "GIVEN a catalog with routes across all 3 provenance types WHEN couch-sample assembler runs --sample THEN ~25 routes are selected with representation from all 3 provenance types",
      "verify": "pnpm test convex/__tests__/S4T6-couch-stratification.integration.test.ts",
      "maps_to_ac": null,
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "verification_service": "Convex dev deployment (real couch-sample assembler)",
        "negative_control": {
          "would_fail_if": [
            "sample is single-provenance only",
            "sample size is not ~25",
            "provenance types are missing"
          ]
        },
        "evidence": {
          "artifact_type": "db_query",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "couch-stratified-sample",
            "action": {
              "actor": "api_client",
              "steps": [
                "Run couch-sample assembler --sample",
                "Query sample routes by provenance",
                "Verify all 3 provenance types present",
                "Verify total ~25 routes"
              ]
            },
            "end_state": {
              "must_observe": [
                "scraped_promoted count >= 5",
                "ai_reconstructed count >= 5",
                "name_routed count >= 5",
                "total routes >= 20, <= 30"
              ],
              "must_not_observe": [
                "any provenance type count == 0"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "AC-2",
      "type": "acceptance_criterion",
      "primary": false,
      "description": "GIVEN routes varying in anchor count (2 to 15) and description length WHEN couch-sample assembler stratifies THEN sample includes easy (7+ anchors, clear description) + hard (2-3 anchors, sparse description) cases",
      "verify": "pnpm test convex/__tests__/S4T6-couch-difficulty-range.integration.test.ts",
      "maps_to_ac": null,
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "verification_service": "Convex dev deployment (real difficulty stratification)",
        "negative_control": {
          "would_fail_if": [
            "sample is all-easy cases",
            "sample is all-hard cases",
            "difficulty is not measured"
          ]
        },
        "evidence": {
          "artifact_type": "db_query",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "couch-difficulty-spread",
            "action": {
              "actor": "api_client",
              "steps": [
                "Run couch-sample assembler",
                "Query sample anchor counts",
                "Verify range: min >= 2, max >= 7"
              ]
            },
            "end_state": {
              "must_observe": [
                "min anchor count >= 2",
                "max anchor count >= 7",
                "spread >= 5"
              ],
              "must_not_observe": [
                "all routes have same anchor count"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "AC-3",
      "type": "acceptance_criterion",
      "primary": false,
      "description": "GIVEN a stratified couch-sample of ~25 routes WHEN couch-sample assembler exports the sample THEN each route has a map PNG + metadata showing provenance + routedMiles vs claimedMiles",
      "verify": "pnpm test convex/__tests__/S4T6-couch-render-pngs.integration.test.ts",
      "maps_to_ac": null,
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "verification_service": "Convex dev deployment (real PNG rendering + metadata export)",
        "negative_control": {
          "would_fail_if": [
            "PNG files are not generated",
            "metadata is missing",
            "provenance is not shown"
          ]
        },
        "evidence": {
          "artifact_type": "file_artifact",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "couch-render-pngs",
            "action": {
              "actor": "api_client",
              "steps": [
                "Run couch-sample assembler --export",
                "Verify PNG files exist for each route",
                "Verify metadata file includes provenance + lengths"
              ]
            },
            "end_state": {
              "must_observe": [
                "PNG count == sample size",
                "metadata.provenance == 'ai_reconstructed' (literal value present)",
                "metadata.routedMiles == 41.1 AND metadata.claimedMiles == 41 (both present)"
              ],
              "must_not_observe": [
                "PNG files missing",
                "metadata incomplete"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "AC-4",
      "type": "acceptance_criterion",
      "primary": false,
      "description": "GIVEN founder reviewing rendered couch-sample PNGs WHEN founder calls recordCouchVerdict with per-route verdicts + overall verdict THEN verdicts are persisted and overall pass/fail is recorded",
      "verify": "pnpm test convex/__tests__/S4T6-record-verdict.integration.test.ts",
      "maps_to_ac": null,
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "verification_service": "Convex dev deployment (real recordCouchVerdict mutation)",
        "negative_control": {
          "would_fail_if": [
            "verdicts are not persisted",
            "overall verdict is not recorded",
            "per-route verdicts are missing"
          ]
        },
        "evidence": {
          "artifact_type": "db_query",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "record-verdict-pass",
            "action": {
              "actor": "api_client",
              "steps": [
                "Call recordCouchVerdict({overallVerdict: 'pass', routeVerdicts: [...]})",
                "Query couch_verdict table",
                "Verify overall pass, per-route verdicts stored"
              ]
            },
            "end_state": {
              "must_observe": [
                "overallVerdict == 'pass'",
                "routeVerdicts count == sample size"
              ],
              "must_not_observe": [
                "verdict not persisted"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "AC-5",
      "type": "acceptance_criterion",
      "primary": false,
      "description": "GIVEN full batch run invoked with --all flag WHEN couchGateStatus checks for couch verdict THEN --all is blocked until recordCouchVerdict({overallVerdict: 'pass'}) is called",
      "verify": "pnpm test convex/__tests__/S4T6-couch-gate-block.integration.test.ts",
      "maps_to_ac": null,
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "verification_service": "Convex dev deployment (real couchGateStatus block)",
        "negative_control": {
          "would_fail_if": [
            "--all runs without couch pass",
            "block is not enforced",
            "verdict is not checked"
          ]
        },
        "evidence": {
          "artifact_type": "stdout",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "couch-gate-block-all",
            "action": {
              "actor": "api_client",
              "steps": [
                "Call waterfall --all before couch verdict",
                "Verify command blocked with error",
                "Call recordCouchVerdict({overallVerdict: 'pass'})",
                "Verify --all now succeeds"
              ]
            },
            "end_state": {
              "must_observe": [
                "--all exitCode != 0 before couch pass (blocked)",
                "--all exitCode == 0 after couch pass (unblocked)"
              ],
              "must_not_observe": [
                "--all runs before pass"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "TC-1",
      "type": "test_criterion",
      "description": "Couch sample stratifies across provenance types",
      "verify": "pnpm test convex/__tests__/S4T6-couch-stratification.integration.test.ts --grep 'TC-1'",
      "maps_to_ac": "AC-1"
    },
    {
      "id": "TC-2",
      "type": "test_criterion",
      "description": "Couch sample includes difficulty range",
      "verify": "pnpm test convex/__tests__/S4T6-couch-difficulty-range.integration.test.ts --grep 'TC-2'",
      "maps_to_ac": "AC-2"
    },
    {
      "id": "TC-3",
      "type": "test_criterion",
      "description": "Couch sample renders PNGs with metadata",
      "verify": "pnpm test convex/__tests__/S4T6-couch-render-pngs.integration.test.ts --grep 'TC-3'",
      "maps_to_ac": "AC-3"
    },
    {
      "id": "TC-4",
      "type": "test_criterion",
      "description": "recordCouchVerdict persists verdicts",
      "verify": "pnpm test convex/__tests__/S4T6-record-verdict.integration.test.ts --grep 'TC-4'",
      "maps_to_ac": "AC-4"
    },
    {
      "id": "TC-5",
      "type": "test_criterion",
      "description": "couchGateStatus blocks --all until pass",
      "verify": "pnpm test convex/__tests__/S4T6-couch-gate-block.integration.test.ts --grep 'TC-5'",
      "maps_to_ac": "AC-5"
    }
  ]
}
-->
</details>
