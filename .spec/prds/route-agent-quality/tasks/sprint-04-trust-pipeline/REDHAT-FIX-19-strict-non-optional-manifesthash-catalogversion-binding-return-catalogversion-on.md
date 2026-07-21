# REDHAT-FIX-19 — Strict non-optional manifestHash/catalogVersion binding + return catalogVersion on all couchGateStatus shapes
> Status: ⬜ Pending

| Field | Value |
|-------|-------|
| TASK_ID | REDHAT-FIX-19 |
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
- test: `npx vitest run convex/__tests__/REDHAT-FIX-19-*.integration.test.ts`
- typecheck: `npx tsc --noEmit -p convex/tsconfig.json`
- lint: `pnpm exec biome check`

> **Command note:** `pnpm test` maps to bare `vitest` (watch mode) and HANGS in an agent shell — always use `npx vitest run`. vitest has no `--grep`; the single-test filter is `-t '<name>'`.

## OUTCOME

Closes the fail-open binding hole: a PASS only unlocks when active-manifest and verdict both carry non-empty matching manifestHash and catalogVersion, and every couchGateStatus response includes catalogVersion so founder attestation can fail closed. Red-hat HIGH-1: couchGateStatus uses (!activeHash || !v.hash || equal) and omits catalogVersion on the allowed path, so evaluateFounderAttestation receives catalogVersion:null and accepts missing row bindings.

## 🚫 CRITICAL CONSTRAINTS (Never tier — read before acting)

**MUST**
- MUST read convex/_generated/ai/guidelines.md before implementation
- MUST require non-empty AND strict equality of manifestHash and catalogVersion on BOTH active-manifest and verdict sides before a PASS can unlock
- MUST return catalogVersion on every couchGateStatus shape (including early returns: null when unknown; string when known)
- MUST make evaluateFounderAttestation fail closed when status or row lacks non-empty manifestHash/catalogVersion (no more null-skips)
- MUST prove live (not pure-helper-only) negatives for missing manifestHash and missing catalogVersion on the verdict side

**NEVER**
- NEVER keep the fail-open pattern (!activeManifestHash || !v.manifestHash || equal)
- NEVER omit catalogVersion from the allowed return path (couchVerdict.ts:299-306 today)
- NEVER change latest-verdict selection order / pass-only filter — REDHAT-FIX-17 owns that
- NEVER touch deriveGoalState completeness or gate-plan.json
- NEVER synthesize S4-T7 Founder-Operator evidence

**STRICTLY**
- STRICTLY binding fields are non-optional for unlock: empty string, undefined, and null all fail closed
- STRICTLY live integration tests exercise couchGateStatus (and founder path as applicable), not only evaluateFounderAttestation pure-helper unit cases

## DONE WHEN

- AC-1 [Missing verdict manifestHash fails closed] [PRIMARY]: allowed===false even though overallVerdict was pass
- AC-2 [Missing verdict catalogVersion fails closed (live)]: allowed===false
- AC-3 [Allowed path returns catalogVersion]: response includes catalogVersion as a non-null string equal to the active manifest catalogVersion
- AC-4 [evaluateFounderAttestation fails closed on missing bindings]: present===false with a reason naming missing/unbound binding fields
- Every behavioral AC scenario passes `validate_scenario` (exit 0); RED-against-start recorded before GREEN; seeded-value EVIDENCE artifact captured
- `npx tsc --noEmit -p convex/tsconfig.json` → 0 errors + `pnpm exec biome check` clean + `pnpm convex:dev --once` clean
- NO-REGRESSION: `pnpm type-check` reports zero new errors vs. a baseline captured at task start
- Only SCOPE.writeAllowed files modified (`git diff --name-only`)

## SPECIFICATION

**Objective:** Make exact manifestHash/catalogVersion binding non-optional for couch unlock and founder attestation, and surface catalogVersion on every status shape.

**Success state:** A PASS missing manifestHash or catalogVersion cannot unlock; allowed:true responses include non-null catalogVersion matching the active manifest; evaluateFounderAttestation rejects missing bindings.

## FIXTURES (shared seed data — referenced by scenario `start_ref`)

- `operator-identity` (seed_method: `public_api`): Authenticated operator for freeze/activate/verdict.
    - users row upserted for clerkUserId 'test:s4t19-operator' with role 'operator'
- `active-manifest-pass-missing-verdict-manifestHash` (seed_method: `public_api`): Active frozen manifest with complete hashes + a pass row whose manifestHash is cleared/absent (legacy unbound shape).
    - operator storeCouchSample + activateCouchManifest + recordCouchVerdict(pass)
    - verdict row reduced to missing/empty manifestHash while overallVerdict remains pass (only reachable emulation of pre-binding rows)
- `active-manifest-pass-missing-verdict-catalogVersion` (seed_method: `public_api`): Same as above but catalogVersion cleared/absent on the pass verdict row.
    - operator freeze/activate/pass then clear verdict.catalogVersion
- `healthy-bound-pass` (seed_method: `public_api`): Active frozen manifest with complete baseline and a fully bound pass (both hashes/versions present and equal).
    - operator storeCouchSample + activate + recordCouchVerdict(pass) with real manifestHash+catalogVersion written by freeze

## ACCEPTANCE CRITERIA (TDD beads — RED → GREEN → REFACTOR per AC)

### AC-1 [PRIMARY] — Missing verdict manifestHash fails closed

**Requirement:** GIVEN An active frozen manifest and a PASS verdict missing/empty manifestHash WHEN couchGateStatus is queried THEN allowed===false even though overallVerdict was pass

- TEST_TIER: `integration` · VERIFICATION_SERVICE: Convex dev deployment (live couchGateStatus binding)
- FLOW_REF: UC-VER-05
- VERIFY: `npx vitest run convex/__tests__/REDHAT-FIX-19-strict-manifest-binding.integration.test.ts -t 'AC-1'`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: binding filter is stubbed to (!activeManifestHash || !v.manifestHash || equal) so empty/missing verdict manifestHash still unlocks; couchGateStatus is mocked to return allowed === true when verdict.manifestHash is absent; static shell treats empty manifestHash as bound
- EVIDENCE: `db_query` (required_capture: true)
- CASE 1 — start_ref `active-manifest-pass-missing-verdict-manifestHash`
  - ACTION: Seed active-manifest-pass-missing-verdict-manifestHash via real operator entrypoints + legacy-shape reduction; Query couchGateStatus (live, not pure helper)
  - MUST_OBSERVE: couchGateStatus.allowed === false; typeof couchGateStatus.catalogVersion !== 'undefined'
  - MUST_NOT_OBSERVE: couchGateStatus.allowed === true; empty manifestHash still unlocks; '' manifestHash treated as bound

### AC-2 — Missing verdict catalogVersion fails closed (live)

**Requirement:** GIVEN An active frozen manifest and a PASS verdict missing/empty catalogVersion WHEN couchGateStatus is queried THEN allowed===false

- TEST_TIER: `integration` · VERIFICATION_SERVICE: Convex dev deployment (live couchGateStatus catalogVersion binding)
- FLOW_REF: UC-VER-05
- VERIFY: `npx vitest run convex/__tests__/REDHAT-FIX-19-strict-manifest-binding.integration.test.ts -t 'AC-2'`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: binding filter is stubbed to (!activeCatalogVersion || !v.catalogVersion || equal) so empty/missing verdict catalogVersion still unlocks; couchGateStatus is mocked to allowed === true when catalogVersion is absent; static shell treats empty catalogVersion as bound
- EVIDENCE: `db_query` (required_capture: true)
- CASE 1 — start_ref `active-manifest-pass-missing-verdict-catalogVersion`
  - ACTION: Seed pass with missing catalogVersion; Query couchGateStatus
  - MUST_OBSERVE: couchGateStatus.allowed === false; 'catalogVersion' in couchGateStatus
  - MUST_NOT_OBSERVE: couchGateStatus.allowed === true; empty catalogVersion still unlocks; catalogVersion key absent

### AC-3 — Allowed path returns catalogVersion

**Requirement:** GIVEN A healthy fully-bound pass on an active frozen manifest WHEN couchGateStatus returns allowed:true THEN response includes catalogVersion as a non-null string equal to the active manifest catalogVersion

- TEST_TIER: `integration` · VERIFICATION_SERVICE: Convex dev deployment (allowed shape completeness)
- FLOW_REF: UC-VER-05
- VERIFY: `npx vitest run convex/__tests__/REDHAT-FIX-19-strict-manifest-binding.integration.test.ts -t 'AC-3'`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: allowed return path is stubbed to omit catalogVersion so evaluateFounderAttestation receives null and accepts missing bindings; couchGateStatus is mocked to return allowed === true with catalogVersion === null; static shell drops catalogVersion on the allowed shape
- EVIDENCE: `api_response` (required_capture: true)
- CASE 1 — start_ref `healthy-bound-pass`
  - ACTION: Seed healthy-bound-pass; Query couchGateStatus; Assert shape fields
  - MUST_OBSERVE: couchGateStatus.allowed === true; typeof couchGateStatus.catalogVersion === 'string' && couchGateStatus.catalogVersion.length > 0; typeof couchGateStatus.manifestHash === 'string' && couchGateStatus.manifestHash.length > 0
  - MUST_NOT_OBSERVE: catalogVersion === null on allowed === true; empty catalogVersion string on allowed path; catalogVersion key absent

### AC-4 — evaluateFounderAttestation fails closed on missing bindings

**Requirement:** GIVEN A status with allowed:true but null/missing catalogVersion or a pass row missing catalogVersion/manifestHash WHEN evaluateFounderAttestation(status, row) is evaluated THEN present===false with a reason naming missing/unbound binding fields

- TEST_TIER: `integration` · VERIFICATION_SERVICE: tools/gate evaluateFounderAttestation + live status shape (integration suite covering both)
- FLOW_REF: UC-VER-05
- VERIFY: `npx vitest run convex/__tests__/REDHAT-FIX-19-strict-manifest-binding.integration.test.ts -t 'AC-4'`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: evaluateFounderAttestation is stubbed to skip binding checks when status.catalogVersion is null (fail-open); helper is mocked to return present === true for empty/missing row catalogVersion; static shell accepts absent bindings as match
- EVIDENCE: `api_response` (required_capture: true)
- CASE 1 — start_ref `healthy-bound-pass`
  - ACTION: Construct GateStatusRow allowed:true with catalogVersion:null and matching sampleId/manifestHash; Construct VerdictRow overallVerdict pass with empty catalogVersion; Call evaluateFounderAttestation(status, row)
  - MUST_OBSERVE: attestation.present === false && attestation.reason === 'missing_binding'; typeof attestation.reason === 'string' && attestation.reason.length > 0
  - MUST_NOT_OBSERVE: attestation.present === true && attestation.reason === null; empty catalogVersion accepted as bound; none of the binding fields checked

## TEST CRITERIA

| TC | Statement | Maps to | Verify |
|----|-----------|---------|--------|
| TC-1 | couchGateStatus.allowed is false when the pass verdict is missing manifestHash | AC-1 | `npx vitest run convex/__tests__/REDHAT-FIX-19-strict-manifest-binding.integration.test.ts -t 'AC-1'` |
| TC-2 | couchGateStatus.allowed is false when the pass verdict is missing catalogVersion | AC-2 | `npx vitest run convex/__tests__/REDHAT-FIX-19-strict-manifest-binding.integration.test.ts -t 'AC-2'` |
| TC-3 | couchGateStatus includes a non-empty catalogVersion string when allowed is true | AC-3 | `npx vitest run convex/__tests__/REDHAT-FIX-19-strict-manifest-binding.integration.test.ts -t 'AC-3'` |
| TC-4 | evaluateFounderAttestation.present is false when status.catalogVersion is null | AC-4 | `npx vitest run convex/__tests__/REDHAT-FIX-19-strict-manifest-binding.integration.test.ts -t 'AC-4'` |
| TC-5 | every couchGateStatus early-return path includes a catalogVersion field (null or string) | AC-3 | `npx vitest run convex/__tests__/REDHAT-FIX-19-strict-manifest-binding.integration.test.ts -t 'AC-3'` |

## SCOPE (file-level write permissions)

**writeAllowed:**
- convex/couchVerdict.ts (MODIFY — binding filter strictness + catalogVersion on ALL return shapes; do not change latest-verdict selection)
- tools/gate/resolveFounderVerdict.ts (MODIFY — evaluateFounderAttestation fail closed on missing non-empty hashes/versions)
- convex/__tests__/REDHAT-FIX-19-strict-manifest-binding.integration.test.ts (NEW)

**writeProhibited:**
- convex/couchVerdict.ts latest-verdict-not-pass-only selection — REDHAT-FIX-17
- tools/gate/deriveGoalState.ts — REDHAT-FIX-18/20
- tools/gate/verifyEvidenceManifest.ts — REDHAT-FIX-18
- gate-plan.json — REDHAT-FIX-20
- recordCouchVerdict exact-membership / WRONG_FORCES_FAIL logic (unless only to ensure written bindings remain present — prefer no change)
- Any RN/Expo/app client code

## READING LIST

- `convex/_generated/ai/guidelines.md` (all) — Convex API rules (mandatory)
- `convex/couchVerdict.ts` (198-306) — [PRIMARY PATTERN] all couchGateStatus return shapes missing catalogVersion; soft binding filter at 280-286 — HIGH-1
- `tools/gate/resolveFounderVerdict.ts` (101-181) — evaluateFounderAttestation fail-open when status.catalogVersion/manifestHash null (only mismatch checked when both present)
- `convex/schema.ts` (391-410) — couch_verdicts optional manifestHash/catalogVersion — fail closed in logic even if schema remains optional for legacy rows
- `.spec/reviews/red-hat-sprint-04-trust-pipeline-20260721T153804Z.md` (32-36) — HIGH-1 finding text

## CODE PATTERN

- Pattern: function exactBind(active: string|null|undefined, row: string|null|undefined): boolean { return !!active && !!row && active === row } // require both non-empty; filter: exactBind(activeManifestHash, v.manifestHash) && exactBind(activeCatalogVersion, v.catalogVersion)
- Pattern source: `convex/couchVerdict.ts:280-306 + tools/gate/resolveFounderVerdict.ts:114-150`
- Anti-pattern: (!active || !row || equal); returning allowed without catalogVersion; treating null catalogVersion as 'no need to check row binding'
- Design references: `.spec/reviews/red-hat-sprint-04-trust-pipeline-20260721T153804Z.md`, `convex/couchVerdict.ts`, `tools/gate/resolveFounderVerdict.ts`

## VERIFICATION GATES

- AC-1 PRIMARY missing manifestHash: `npx vitest run convex/__tests__/REDHAT-FIX-19-strict-manifest-binding.integration.test.ts -t 'AC-1'` → Exit 0; allowed===false
- Full FIX-19 suite: `npx vitest run convex/__tests__/REDHAT-FIX-19-strict-manifest-binding.integration.test.ts` → Exit 0
- Typecheck (in-scope): `npx tsc --noEmit -p convex/tsconfig.json` → Exit 0
- Lint: `pnpm exec biome check convex/couchVerdict.ts tools/gate/resolveFounderVerdict.ts convex/__tests__/REDHAT-FIX-19-strict-manifest-binding.integration.test.ts` → Exit 0
- Scope compliance: `git diff --name-only HEAD~1 HEAD | sort -u` → Only paths in guardrails.write_allowed
- scenario validator → Exit 0, zero CRITICAL/HIGH:

```bash
python3 -c "import re,sys;print(re.search(r'<!-- REQUIREMENT-CONTRACT v1 -->\n<!--\n(.*?)\n-->',open(sys.argv[1]).read(),re.S).group(1))" \
  .spec/prds/route-agent-quality/tasks/sprint-04-trust-pipeline/REDHAT-FIX-19-*.md \
  | python3 ~/Projects/brain/tools/validate-scenario/validate_scenario.py; echo "EXIT:$?"
```

## AGENT ASSIGNMENT

- Agent: `convex-implementer` — Owns strict couch verdict binding equality and founder attestation fail-closed path: require non-empty equal manifestHash/catalogVersion on both sides and surface catalogVersion on every couchGateStatus return.
- Reviewer: `convex-reviewer`

## EVIDENCE GATES

- RED phase: each behavioral AC's test went red before green (pre-fix bug reproduced)
- Integration coverage: PRIMARY AC is integration against real services (Convex dev / filesystem+git)
- Scenario un-fakeable: validate_scenario exit 0 on every behavioral AC; captured EVIDENCE shows concrete must_observe values

## DEPENDENCIES

- Depends on: —
- Blocks: —
- Notes: Coordinate with REDHAT-FIX-17 on couchVerdict.ts: FIX-17 owns latest-verdict selection; FIX-19 owns binding equality + catalogVersion return field. Prefer FIX-17 first then FIX-19, or merge carefully without reverting either.

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
  "task_id": "REDHAT-FIX-19",
  "tdd_mode": "red_first",
  "verification_policy": {
    "requires_tests": true,
    "requires_red_evidence": true,
    "requires_seeded_evidence": true
  },
  "fixtures": {
    "operator-identity": {
      "description": "Authenticated operator for freeze/activate/verdict.",
      "seed_method": "public_api",
      "records": [
        "users row upserted for clerkUserId 'test:s4t19-operator' with role 'operator'"
      ]
    },
    "active-manifest-pass-missing-verdict-manifestHash": {
      "description": "Active frozen manifest with complete hashes + a pass row whose manifestHash is cleared/absent (legacy unbound shape).",
      "seed_method": "public_api",
      "records": [
        "operator storeCouchSample + activateCouchManifest + recordCouchVerdict(pass)",
        "verdict row reduced to missing/empty manifestHash while overallVerdict remains pass (only reachable emulation of pre-binding rows)"
      ]
    },
    "active-manifest-pass-missing-verdict-catalogVersion": {
      "description": "Same as above but catalogVersion cleared/absent on the pass verdict row.",
      "seed_method": "public_api",
      "records": [
        "operator freeze/activate/pass then clear verdict.catalogVersion"
      ]
    },
    "healthy-bound-pass": {
      "description": "Active frozen manifest with complete baseline and a fully bound pass (both hashes/versions present and equal).",
      "seed_method": "public_api",
      "records": [
        "operator storeCouchSample + activate + recordCouchVerdict(pass) with real manifestHash+catalogVersion written by freeze"
      ]
    }
  },
  "requirements": [
    {
      "id": "AC-1",
      "type": "acceptance_criterion",
      "primary": true,
      "description": "GIVEN an active frozen manifest and a PASS verdict missing/empty manifestHash WHEN couchGateStatus is queried THEN allowed===false",
      "verify": "npx vitest run convex/__tests__/REDHAT-FIX-19-strict-manifest-binding.integration.test.ts -t 'AC-1'",
      "maps_to_ac": null,
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "topology": "single-node",
        "verification_service": "Convex dev deployment (live couchGateStatus binding)",
        "negative_control": {
          "would_fail_if": [
            "binding filter is stubbed to (!activeManifestHash || !v.manifestHash || equal) so empty/missing verdict manifestHash still unlocks",
            "couchGateStatus is mocked to return allowed === true when verdict.manifestHash is absent",
            "static shell treats empty manifestHash as bound"
          ]
        },
        "evidence": {
          "artifact_type": "db_query",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "active-manifest-pass-missing-verdict-manifestHash",
            "action": {
              "actor": "api_client",
              "steps": [
                "Seed active-manifest-pass-missing-verdict-manifestHash via real operator entrypoints + legacy-shape reduction",
                "Query couchGateStatus (live, not pure helper)"
              ]
            },
            "end_state": {
              "must_observe": [
                "couchGateStatus.allowed === false",
                "typeof couchGateStatus.catalogVersion !== 'undefined'"
              ],
              "must_not_observe": [
                "couchGateStatus.allowed === true",
                "empty manifestHash still unlocks",
                "'' manifestHash treated as bound"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "AC-2",
      "type": "acceptance_criterion",
      "description": "GIVEN an active frozen manifest and a PASS verdict missing/empty catalogVersion WHEN couchGateStatus is queried THEN allowed===false",
      "verify": "npx vitest run convex/__tests__/REDHAT-FIX-19-strict-manifest-binding.integration.test.ts -t 'AC-2'",
      "maps_to_ac": null,
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "topology": "single-node",
        "verification_service": "Convex dev deployment (live couchGateStatus catalogVersion binding)",
        "negative_control": {
          "would_fail_if": [
            "binding filter is stubbed to (!activeCatalogVersion || !v.catalogVersion || equal) so empty/missing verdict catalogVersion still unlocks",
            "couchGateStatus is mocked to allowed === true when catalogVersion is absent",
            "static shell treats empty catalogVersion as bound"
          ]
        },
        "evidence": {
          "artifact_type": "db_query",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "active-manifest-pass-missing-verdict-catalogVersion",
            "action": {
              "actor": "api_client",
              "steps": [
                "Seed pass with missing catalogVersion",
                "Query couchGateStatus"
              ]
            },
            "end_state": {
              "must_observe": [
                "couchGateStatus.allowed === false",
                "'catalogVersion' in couchGateStatus"
              ],
              "must_not_observe": [
                "couchGateStatus.allowed === true",
                "empty catalogVersion still unlocks",
                "catalogVersion key absent"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "AC-3",
      "type": "acceptance_criterion",
      "description": "GIVEN a healthy fully-bound pass WHEN couchGateStatus returns allowed:true THEN catalogVersion is a non-empty string matching the active manifest",
      "verify": "npx vitest run convex/__tests__/REDHAT-FIX-19-strict-manifest-binding.integration.test.ts -t 'AC-3'",
      "maps_to_ac": null,
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "topology": "single-node",
        "verification_service": "Convex dev deployment (allowed shape completeness)",
        "negative_control": {
          "would_fail_if": [
            "allowed return path is stubbed to omit catalogVersion so evaluateFounderAttestation receives null and accepts missing bindings",
            "couchGateStatus is mocked to return allowed === true with catalogVersion === null",
            "static shell drops catalogVersion on the allowed shape"
          ]
        },
        "evidence": {
          "artifact_type": "api_response",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "healthy-bound-pass",
            "action": {
              "actor": "api_client",
              "steps": [
                "Seed healthy-bound-pass",
                "Query couchGateStatus",
                "Assert shape fields"
              ]
            },
            "end_state": {
              "must_observe": [
                "couchGateStatus.allowed === true",
                "typeof couchGateStatus.catalogVersion === 'string' && couchGateStatus.catalogVersion.length > 0",
                "typeof couchGateStatus.manifestHash === 'string' && couchGateStatus.manifestHash.length > 0"
              ],
              "must_not_observe": [
                "catalogVersion === null on allowed === true",
                "empty catalogVersion string on allowed path",
                "catalogVersion key absent"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "AC-4",
      "type": "acceptance_criterion",
      "description": "GIVEN status allowed:true with null catalogVersion or row missing bindings WHEN evaluateFounderAttestation runs THEN present===false",
      "verify": "npx vitest run convex/__tests__/REDHAT-FIX-19-strict-manifest-binding.integration.test.ts -t 'AC-4'",
      "maps_to_ac": null,
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "topology": "single-node",
        "verification_service": "tools/gate evaluateFounderAttestation + live status shape",
        "negative_control": {
          "would_fail_if": [
            "evaluateFounderAttestation is stubbed to skip binding checks when status.catalogVersion is null (fail-open)",
            "helper is mocked to return present === true for empty/missing row catalogVersion",
            "static shell accepts absent bindings as match"
          ]
        },
        "evidence": {
          "artifact_type": "api_response",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "healthy-bound-pass",
            "action": {
              "actor": "api_client",
              "steps": [
                "Construct GateStatusRow allowed:true with catalogVersion:null and matching sampleId/manifestHash",
                "Construct VerdictRow overallVerdict pass with empty catalogVersion",
                "Call evaluateFounderAttestation(status, row)"
              ]
            },
            "end_state": {
              "must_observe": [
                "attestation.present === false && attestation.reason === 'missing_binding'",
                "typeof attestation.reason === 'string' && attestation.reason.length > 0"
              ],
              "must_not_observe": [
                "attestation.present === true && attestation.reason === null",
                "empty catalogVersion accepted as bound",
                "none of the binding fields checked"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "TC-1",
      "type": "test_criterion",
      "description": "couchGateStatus.allowed is false when the pass verdict is missing manifestHash",
      "maps_to_ac": "AC-1",
      "verify": "npx vitest run convex/__tests__/REDHAT-FIX-19-strict-manifest-binding.integration.test.ts -t 'AC-1'"
    },
    {
      "id": "TC-2",
      "type": "test_criterion",
      "description": "couchGateStatus.allowed is false when the pass verdict is missing catalogVersion",
      "maps_to_ac": "AC-2",
      "verify": "npx vitest run convex/__tests__/REDHAT-FIX-19-strict-manifest-binding.integration.test.ts -t 'AC-2'"
    },
    {
      "id": "TC-3",
      "type": "test_criterion",
      "description": "couchGateStatus includes a non-empty catalogVersion string when allowed is true",
      "maps_to_ac": "AC-3",
      "verify": "npx vitest run convex/__tests__/REDHAT-FIX-19-strict-manifest-binding.integration.test.ts -t 'AC-3'"
    },
    {
      "id": "TC-4",
      "type": "test_criterion",
      "description": "evaluateFounderAttestation.present is false when status.catalogVersion is null",
      "maps_to_ac": "AC-4",
      "verify": "npx vitest run convex/__tests__/REDHAT-FIX-19-strict-manifest-binding.integration.test.ts -t 'AC-4'"
    },
    {
      "id": "TC-5",
      "type": "test_criterion",
      "description": "every couchGateStatus early-return path includes a catalogVersion field (null or string)",
      "maps_to_ac": "AC-3",
      "verify": "npx vitest run convex/__tests__/REDHAT-FIX-19-strict-manifest-binding.integration.test.ts -t 'AC-3'"
    }
  ]
}
-->

</details>
