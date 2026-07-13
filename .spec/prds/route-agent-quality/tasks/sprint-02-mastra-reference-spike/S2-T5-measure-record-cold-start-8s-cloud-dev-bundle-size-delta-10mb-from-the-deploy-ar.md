# S2-T5 — Measure + record cold-start (≤10s cloud dev) + bundle-size delta (≤10MB) from the deploy artifact

| Field | Value |
|-------|-------|
| TASK_ID | S2-T5 |
| SPRINT | [Sprint 02 — Mastra spike + z.ai proof + enrichment re-ratification](./SPRINT.md) |
| TASK_TYPE | MEASUREMENT |
| AGENT | implementer=`convex-implementer` · reviewer=`convex-reviewer` |
| ESTIMATE | 60 min |
| EFFORT | S |
| PRIORITY | P0 |
| STATUS | completed |
| PROPOSED_BY | `mastra-planner` |
| TDD_MODE | `skipped` |
| RED_GREEN_REQUIRED | no |
| CAPABILITIES | CAP-AGT-01, CAP-AGT-02 |
| DEPENDS_ON | S2-T3, S2-T4 |
| BLOCKS | S2-T7 |

RUNTIME_COMMANDS:
- test: `pnpm test convex/actions/agent/spike/__tests__/coldStartBundle.integration.test.ts`
- typecheck: `pnpm type-check`
- lint: `pnpm exec biome check`

## OUTCOME

evidence/s2-t5-ceilings.json records coldStartMs (real, from the first cloud-dev invocation after deploy) <= 10000, bundleDeltaBytes (real, from the deploy artifact) <= 10485760, and status 'pass' computed by the ceiling predicate; the assertion test passes on the recorded numbers.

> **Founder adjustment (2026-07-13):** The original §5b cold-start default was 8,000 ms.
> S2-T7 accepted the real 9,373 ms observation and adjusted the operational ceiling to
> 10,000 ms. The evidence artifact preserves both the original and adjusted ceilings.

## 🚫 CRITICAL CONSTRAINTS (Never tier — read before acting)

**MUST**
- Measure cold-start as the FIRST invocation of the spike action AFTER `npx convex deploy` to the CLOUD DEV deployment — not local `convex dev` (a warm sandbox).
- Measure bundle-size delta from the REAL convex deploy artifact: the artifact size with @mastra/core installed minus the pre-install baseline artifact size.
- Record both numbers, the pinned ceilings (10000 ms; 10485760 bytes = 10 MB), and a pass/fail verdict to a durable evidence artifact the human gate (S2-T7) reads.
- The pass/fail predicate is coldStartMs <= 10000 AND bundleDeltaBytes <= 10485760.
- The recorded numbers are REAL observations from the deployed artifact/invocation — never estimated or hand-written.

**NEVER**
- NEVER measure cold-start against local convex dev (warm) and label it cloud-dev.
- NEVER hardcode/fake the latency or byte numbers — they must come from a real deploy + invocation.
- NEVER compute the bundle delta from node_modules size instead of the deploy artifact.
- NEVER record status 'pass' while a ceiling is exceeded.
- NEVER modify product code — this is a measurement + evidence task only.

**STRICTLY**
- STRICTLY test_tier=integration: the assertion test compares the RECORDED real numbers against the ceilings.
- STRICTLY SKIP-with-reason (never fake success) if the cloud dev deployment is unreachable or `npx convex deploy` fails.
- STRICTLY seed the numbers from a REAL entrypoint — a fresh `npx convex deploy` + the deployed spike action invocation.

## SPECIFICATION

**Objective:** Produce the two §5b numeric gate values — cold-start first-invocation latency on cloud dev and the deploy-artifact bundle delta from @mastra/core — as real measured numbers recorded to a durable evidence artifact with a pass/fail verdict against the pinned ceilings.

**Success state:** evidence/s2-t5-ceilings.json records coldStartMs (real, from the first cloud-dev invocation after deploy) <= 10000, bundleDeltaBytes (real, from the deploy artifact) <= 10485760, and status 'pass' computed by the ceiling predicate; the assertion test passes on the recorded numbers.

## FIXTURES (shared seed data — referenced by scenario `start_ref`)

- `cloud_dev_cold_start` (seed_method: `recorded_external`): The timestamped first-invocation latency of the spike action after a fresh `npx convex deploy` to the cloud dev deployment.
- `bundle_artifact_delta` (seed_method: `recorded_external`): The deploy-artifact size before vs after adding @mastra/core (+ ai@7 + observability), yielding the byte delta.

## ACCEPTANCE CRITERIA (TDD beads — RED → GREEN → REFACTOR per AC)

### AC-1

**Requirement:** GIVEN a fresh `npx convex deploy` to the cloud dev deployment WHEN the spike action is invoked for the first time THEN the measured first-response latency is a real positive number ≤ 10000 ms, recorded to evidence and tagged cloud-dev

- TEST_TIER: `integration`  ·  VERIFICATION_SERVICE: cloud dev Convex deployment (first invocation after `npx convex deploy`)
- FLOW_REF: UC-AGT-01
- VERIFY: `pnpm test convex/actions/agent/spike/__tests__/coldStartBundle.integration.test.ts -t "cold-start first invocation on cloud dev is within 10s"`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: the latency number is hardcoded/faked rather than measured from a real cloud-dev invocation; the measurement runs against local convex dev (a warm sandbox) instead of the cloud dev deployment after a fresh deploy; the value is recorded but never compared to the 10000 ms ceiling
- EVIDENCE: `stdout` (required_capture: true)
- CASE 1 — start_ref `cloud_dev_cold_start`
    - ACTION (cli_user): run `npx convex deploy` to cloud dev → invoke the spike action once and record ms to first response
    - MUST_OBSERVE: record.coldStartMs > 0 (e.g. observed 4200); record.coldStartMs <= 10000; record.deployment === 'cloud-dev'
    - MUST_NOT_OBSERVE: record.coldStartMs === 0 || record.coldStartMs === null (nothing measured); record.deployment === 'local' (measured against local convex dev)

### AC-2

**Requirement:** GIVEN the deploy artifact before and after adding @mastra/core WHEN the two artifact sizes are measured THEN the byte delta is a real positive number ≤ 10485760 bytes, recorded to evidence

- TEST_TIER: `integration`  ·  VERIFICATION_SERVICE: convex deploy artifact (baseline vs @mastra/core-installed)
- VERIFY: `pnpm test convex/actions/agent/spike/__tests__/coldStartBundle.integration.test.ts -t "bundle delta from @mastra/core is within 10MB"`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: the byte delta is estimated/faked/hardcoded rather than read from the real convex deploy artifact; the measurement script is a no-op stub returning a canned byte count with no real artifact read; only one side (baseline or post-install) is measured so the delta is fabricated; the delta is computed from node_modules size instead of the deploy artifact
- EVIDENCE: `stdout` (required_capture: true)
- CASE 1 — start_ref `bundle_artifact_delta`
    - ACTION (cli_user): measure the deploy artifact size at the pre-@mastra/core baseline and with @mastra/core installed → compute the byte delta
    - MUST_OBSERVE: record.bundleDeltaBytes > 0 && record.bundleDeltaBytes <= 10485760; record.baselineBytes > 0 && record.postInstallBytes > 0; record.bundleDeltaBytes === record.postInstallBytes - record.baselineBytes (computed from the deploy artifact)
    - MUST_NOT_OBSERVE: record.bundleDeltaBytes === 0 || record.bundleDeltaBytes === null (nothing measured); the delta computed from node_modules size instead of the deploy artifact

### AC-3

**Requirement:** GIVEN the measured cold-start and bundle-delta numbers WHEN the evidence artifact is written THEN evidence/s2-t5-ceilings.json records numeric coldStartMs, bundleDeltaBytes, the pinned ceilings, and status computed by the ceiling predicate

- TEST_TIER: `integration`  ·  VERIFICATION_SERVICE: the recorded evidence artifact + the ceiling predicate
- VERIFY: `pnpm test convex/actions/agent/spike/__tests__/coldStartBundle.integration.test.ts -t "ceilings evidence artifact records both numbers and a computed verdict"`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: the ceilings file is hand-written with status 'pass' regardless of the real numbers; the pass/fail predicate is a no-op that ignores the ceiling comparison; the evidence file is absent/empty so the human gate has nothing to read
- EVIDENCE: `file` (required_capture: true)
- CASE 1 — start_ref `cloud_dev_cold_start`
    - ACTION (cli_user): write evidence/s2-t5-ceilings.json with coldStartMs, bundleDeltaBytes, ceilings, and status
    - MUST_OBSERVE: typeof json.coldStartMs === 'number' && json.coldStartMs <= 10000; typeof json.bundleDeltaBytes === 'number' && json.bundleDeltaBytes <= 10485760; json.ceilings.coldStartMs === 10000 && json.ceilings.bundleDeltaBytes === 10485760; json.status === 'pass' iff (json.coldStartMs <= 10000 && json.bundleDeltaBytes <= 10485760)
    - MUST_NOT_OBSERVE: the evidence file is absent or empty (0 bytes / nothing recorded); json.status === 'pass' while json.coldStartMs > 10000 || json.bundleDeltaBytes > 10485760

## TEST CRITERIA

| TC | Statement | Maps to | Verify |
|----|-----------|---------|--------|
| TC-1 | the recorded coldStartMs is a positive number <= 10000 with deployment==='cloud-dev', measured on the first cloud-dev invocation after `npx convex deploy` | AC-1 | `pnpm test convex/actions/agent/spike/__tests__/coldStartBundle.integration.test.ts -t "cold-start first invocation on cloud dev is within 10s"` |
| TC-2 | the recorded bundleDeltaBytes > 0 && <= 10485760, equal to postInstallBytes - baselineBytes measured from the deploy artifact | AC-2 | `pnpm test convex/actions/agent/spike/__tests__/coldStartBundle.integration.test.ts -t "bundle delta from @mastra/core is within 10MB"` |
| TC-3 | evidence/s2-t5-ceilings.json records numeric coldStartMs and bundleDeltaBytes, the ceilings (10000, 10485760), and status==='pass' only when both are within ceiling | AC-3 | `pnpm test convex/actions/agent/spike/__tests__/coldStartBundle.integration.test.ts -t "ceilings evidence artifact records both numbers and a computed verdict"` |

## SCOPE (file-level write permissions)

**writeAllowed:**
- `scripts/spike/measure-mastra-spike-ceilings.ts (NEW — measures cold-start + bundle delta from a real deploy)`
- `convex/actions/agent/spike/__tests__/coldStartBundle.integration.test.ts (NEW — asserts recorded numbers vs ceilings)`
- `.spec/prds/route-agent-quality/tasks/sprint-02-mastra-reference-spike/evidence/s2-t5-ceilings.json (NEW — recorded numbers + verdict)`

**writeProhibited:**
- `any product source under convex/actions/agent/ (measurement only — no behavior changes)`
- `the pi-ai importer files and any teardown`
- `the React Native app and convex/schema.ts`

## READING LIST

- `.spec/prds/route-agent-quality/10-technical-requirements/11-e2e-testing.md`:100-104 — pinned gate values — cold-start ≤10s first-token on the first cloud-dev invocation; bundle delta ≤10MB from the deploy artifact
- `.spec/prds/route-agent-quality/10-technical-requirements/08-technical-risks.md`:28 — risk #18 — AI-SDK/Mastra bundle + cold-start weight measured as pass/fail, not a vibe
- `.spec/prds/route-agent-quality/tasks/sprint-02-mastra-reference-spike/SPRINT.md`:42-49 — the human test steps the ceilings evidence feeds (S2-T7)

## CODE PATTERN

- Pattern: deploy to cloud dev -> time first invocation -> read artifact sizes baseline vs installed -> write { coldStartMs, bundleDeltaBytes, ceilings, status } to evidence
- Pattern source: `11-e2e-testing §5b + geometry-coverage-report.ts operator-run measurement precedent`
- Anti-pattern: measuring on local convex dev; hardcoding numbers; node_modules-size delta; status 'pass' without the ceiling predicate

## VERIFICATION GATES

- assertion test passes on the recorded numbers: `pnpm test convex/actions/agent/spike/__tests__/coldStartBundle.integration.test.ts` → Exit 0
- typecheck: `pnpm type-check` → Exit 0
- lint: `pnpm exec biome check` → Exit 0
- fresh deploy before the cold-start measurement: `npx convex deploy` → deploy succeeds to cloud dev

## AGENT ASSIGNMENT

- Implementer: `convex-implementer` — measures the real deployed Convex spike and records durable evidence.
- Reviewer: `convex-reviewer`

## EVIDENCE GATES

- Integration/E2E coverage: PRIMARY AC hits real services; captured EVIDENCE shows the seeded MUST_OBSERVE value (not merely "tests passed").
- Scenario un-fakeable: `validate_scenario` exit 0 on every behavioral AC.

## DEPENDENCIES

- Depends on: S2-T3, S2-T4
- Blocks: S2-T7

<details>
<summary>▸ Full agent specification (TASK-TEMPLATE v5.2 — machine-readable requirement contract)</summary>

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "version": "1",
  "task_id": "S2-T5",
  "tdd_mode": "skipped",
  "verification_policy": {
    "requires_tests": true,
    "requires_red_evidence": false,
    "requires_seeded_evidence": true
  },
  "fixtures": {
    "cloud_dev_cold_start": {
      "description": "The timestamped first-invocation latency of the spike action after a fresh `npx convex deploy` to the cloud dev deployment.",
      "seed_method": "recorded_external",
      "records": [
        "deploy target = cloud dev (not local convex dev)",
        "measure = ms to first response on the FIRST invocation post-deploy",
        "ceiling = 10000 ms"
      ]
    },
    "bundle_artifact_delta": {
      "description": "The deploy-artifact size before vs after adding @mastra/core (+ ai@7 + observability), yielding the byte delta.",
      "seed_method": "recorded_external",
      "records": [
        "baseline = deploy artifact size pre-@mastra/core",
        "post = deploy artifact size with @mastra/core",
        "delta = post - baseline",
        "ceiling = 10485760 bytes (10 MB)"
      ]
    }
  },
  "requirements": [
    {
      "id": "AC-1",
      "type": "acceptance_criterion",
      "primary": false,
      "maps_to_ac": null,
      "description": "GIVEN a fresh `npx convex deploy` to the cloud dev deployment WHEN the spike action is invoked for the first time THEN the measured first-response latency is a real positive number ≤ 10000 ms, recorded to evidence and tagged cloud-dev",
      "verify": "pnpm test convex/actions/agent/spike/__tests__/coldStartBundle.integration.test.ts -t \"cold-start first invocation on cloud dev is within 10s\"",
      "scenario": {
        "id": "AC-1",
        "primary": true,
        "tier": "visible",
        "test_tier": "integration",
        "verification_service": "cloud dev Convex deployment (first invocation after `npx convex deploy`)",
        "negative_control": {
          "would_fail_if": [
            "the latency number is hardcoded/faked rather than measured from a real cloud-dev invocation",
            "the measurement runs against local convex dev (a warm sandbox) instead of the cloud dev deployment after a fresh deploy",
            "the value is recorded but never compared to the 10000 ms ceiling"
          ]
        },
        "evidence": {
          "artifact_type": "stdout",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "cloud_dev_cold_start",
            "action": {
              "actor": "cli_user",
              "steps": [
                "run `npx convex deploy` to cloud dev",
                "invoke the spike action once and record ms to first response"
              ]
            },
            "end_state": {
              "must_observe": [
                "record.coldStartMs > 0 (e.g. observed 4200)",
                "record.coldStartMs <= 10000",
                "record.deployment === 'cloud-dev'"
              ],
              "must_not_observe": [
                "record.coldStartMs === 0 || record.coldStartMs === null (nothing measured)",
                "record.deployment === 'local' (measured against local convex dev)"
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
      "maps_to_ac": null,
      "description": "GIVEN the deploy artifact before and after adding @mastra/core WHEN the two artifact sizes are measured THEN the byte delta is a real positive number ≤ 10485760 bytes, recorded to evidence",
      "verify": "pnpm test convex/actions/agent/spike/__tests__/coldStartBundle.integration.test.ts -t \"bundle delta from @mastra/core is within 10MB\"",
      "scenario": {
        "id": "AC-2",
        "primary": false,
        "tier": "visible",
        "test_tier": "integration",
        "verification_service": "convex deploy artifact (baseline vs @mastra/core-installed)",
        "negative_control": {
          "would_fail_if": [
            "the byte delta is estimated/faked/hardcoded rather than read from the real convex deploy artifact",
            "the measurement script is a no-op stub returning a canned byte count with no real artifact read",
            "only one side (baseline or post-install) is measured so the delta is fabricated",
            "the delta is computed from node_modules size instead of the deploy artifact"
          ]
        },
        "evidence": {
          "artifact_type": "stdout",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "bundle_artifact_delta",
            "action": {
              "actor": "cli_user",
              "steps": [
                "measure the deploy artifact size at the pre-@mastra/core baseline and with @mastra/core installed",
                "compute the byte delta"
              ]
            },
            "end_state": {
              "must_observe": [
                "record.bundleDeltaBytes > 0 && record.bundleDeltaBytes <= 10485760",
                "record.baselineBytes > 0 && record.postInstallBytes > 0",
                "record.bundleDeltaBytes === record.postInstallBytes - record.baselineBytes (computed from the deploy artifact)"
              ],
              "must_not_observe": [
                "record.bundleDeltaBytes === 0 || record.bundleDeltaBytes === null (nothing measured)",
                "the delta computed from node_modules size instead of the deploy artifact"
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
      "maps_to_ac": null,
      "description": "GIVEN the measured cold-start and bundle-delta numbers WHEN the evidence artifact is written THEN evidence/s2-t5-ceilings.json records numeric coldStartMs, bundleDeltaBytes, the pinned ceilings, and status computed by the ceiling predicate",
      "verify": "pnpm test convex/actions/agent/spike/__tests__/coldStartBundle.integration.test.ts -t \"ceilings evidence artifact records both numbers and a computed verdict\"",
      "scenario": {
        "id": "AC-3",
        "primary": false,
        "tier": "visible",
        "test_tier": "integration",
        "verification_service": "the recorded evidence artifact + the ceiling predicate",
        "negative_control": {
          "would_fail_if": [
            "the ceilings file is hand-written with status 'pass' regardless of the real numbers",
            "the pass/fail predicate is a no-op that ignores the ceiling comparison",
            "the evidence file is absent/empty so the human gate has nothing to read"
          ]
        },
        "evidence": {
          "artifact_type": "file",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "cloud_dev_cold_start",
            "action": {
              "actor": "cli_user",
              "steps": [
                "write evidence/s2-t5-ceilings.json with coldStartMs, bundleDeltaBytes, ceilings, and status"
              ]
            },
            "end_state": {
              "must_observe": [
                "typeof json.coldStartMs === 'number' && json.coldStartMs <= 10000",
                "typeof json.bundleDeltaBytes === 'number' && json.bundleDeltaBytes <= 10485760",
                "json.ceilings.coldStartMs === 10000 && json.ceilings.bundleDeltaBytes === 10485760",
                "json.status === 'pass' iff (json.coldStartMs <= 10000 && json.bundleDeltaBytes <= 10485760)"
              ],
              "must_not_observe": [
                "the evidence file is absent or empty (0 bytes / nothing recorded)",
                "json.status === 'pass' while json.coldStartMs > 10000 || json.bundleDeltaBytes > 10485760"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "TC-1",
      "type": "test_criterion",
      "primary": false,
      "maps_to_ac": "AC-1",
      "description": "the recorded coldStartMs is a positive number <= 10000 with deployment==='cloud-dev', measured on the first cloud-dev invocation after `npx convex deploy`",
      "verify": "pnpm test convex/actions/agent/spike/__tests__/coldStartBundle.integration.test.ts -t \"cold-start first invocation on cloud dev is within 10s\""
    },
    {
      "id": "TC-2",
      "type": "test_criterion",
      "primary": false,
      "maps_to_ac": "AC-2",
      "description": "the recorded bundleDeltaBytes > 0 && <= 10485760, equal to postInstallBytes - baselineBytes measured from the deploy artifact",
      "verify": "pnpm test convex/actions/agent/spike/__tests__/coldStartBundle.integration.test.ts -t \"bundle delta from @mastra/core is within 10MB\""
    },
    {
      "id": "TC-3",
      "type": "test_criterion",
      "primary": false,
      "maps_to_ac": "AC-3",
      "description": "evidence/s2-t5-ceilings.json records numeric coldStartMs and bundleDeltaBytes, the ceilings (10000, 10485760), and status==='pass' only when both are within ceiling",
      "verify": "pnpm test convex/actions/agent/spike/__tests__/coldStartBundle.integration.test.ts -t \"ceilings evidence artifact records both numbers and a computed verdict\""
    }
  ]
}
-->
</details>
