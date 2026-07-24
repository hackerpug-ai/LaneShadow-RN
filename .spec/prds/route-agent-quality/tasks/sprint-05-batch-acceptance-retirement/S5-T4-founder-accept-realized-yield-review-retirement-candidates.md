# S5-T4 — Founder acceptance of realized yield, top-50 review, and retirement review

> Status: Backlog
> Proposed By: `product-manager`

| Field | Value |
|---|---|
| TASK_ID | S5-T4 |
| SPRINT | [Sprint 05 — Batch acceptance + retirement](./SPRINT.md) |
| TASK_TYPE | HUMAN_GATE |
| AGENT | `Founder-Operator` |
| ESTIMATE | 45 min |
| EFFORT | M |
| PRIORITY | P0 |
| PROPOSED_BY | `product-manager` |
| TDD_MODE | `skipped` |
| RED_GREEN_REQUIRED | no |
| CAPABILITIES | closes CAP-GEO-04 and Sprint 05 gate; consumes CAP-GEO-05 PASS, S5-T1 report, S5-T2 candidates, S5-T3 top-50 packet |
| DEPENDS_ON | S5-T1, S5-T2, S5-T3 |
| BLOCKS | Sprint 10 |

RUNTIME_COMMANDS:
- full batch: `pnpm tsx scripts/backfill-curated-geometry.ts --all`
- coverage: `pnpm tsx scripts/geometry-coverage-report.ts`
- top-50 packet: `pnpm tsx scripts/top-50-curated-review.ts --render`
- verification: `pnpm test convex/__tests__/S5T1-*.integration.test.ts convex/__tests__/S5T2-*.integration.test.ts convex/__tests__/S5T3-*.integration.test.ts`

## BACKGROUND

This is the Founder-Operator decision surface, not an implementation shortcut. The previous catalog was considered complete while its first-surface routes were not trustworthy. The gate therefore binds three independent observations: the realized full-batch report, a top-50 rank review, and explicit retirement-candidate review. Expected yields are priors only. A disappointing lever must be escalated, not hidden by a total count, and a route must never disappear merely because a batch finished.

## 🚫 CRITICAL CONSTRAINTS (Never tier)

- **MUST** run on the real post-Sprint-04 catalog with no seeded or fixture rows in the acceptance evidence.
- **MUST** record accept/reject/escalate against observed per-lever yields and rider-ready count; do not convert estimates into a promised target.
- **MUST** inspect every top-50 row and every retirement candidate before committing decisions.
- **NEVER** accept a partial/cost-stopped batch as complete.
- **NEVER** approve automatic retirement; every retirement requires an explicit route-level confirmation and preserved reason.

## SPECIFICATION

**Objective:** Execute and document the Sprint 05 human gate over the real catalog: accept the realized yield only after complete batch evidence, review the independent top-50 packet, and disposition retirement candidates with explicit confirmation.

**Success state:** A signed/recorded Founder-Operator gate artifact contains the full-batch report, expected-yield comparison, decision (accept/reject/escalate), top-50 row verdicts, retirement-candidate review, and confirmation that no route auto-retired. The sprint is green only when the required decision evidence is complete and the accepted catalog is the input to Sprint 10.

## ACCEPTANCE CRITERIA

### AC-1 [PRIMARY] — Founder records a realized-yield decision on a complete batch

**Requirement:** GIVEN a couch PASS and a complete real `--all` report WHEN the Founder-Operator compares per-lever realized yields and rider-ready count with the expected-yield table THEN the founder records accept, reject, or escalation with the raw report reference and the retirement lock follows the decision.

- TEST_TIER: `human-gate`  · VERIFY: `pnpm tsx scripts/geometry-coverage-report.ts` plus the persisted acceptance artifact
- FLOW_REF: UC-REC-04 AC-7 / T-REC-017

SCENARIO:
- `start_ref`: `s5t4-real-batch-acceptance-packet` (real un-seeded dev deployment; no test-support route IDs)
- `ACTION`: Confirm couch status PASS; run/resume `--all` to `isDone=true`; open `coverageReport`; record observed per-lever counts/rates and rider-ready count against the labeled assumptions; submit the Founder decision.
- `MUST_OBSERVE`: raw report includes complete terminal totals, cost/cursor reconciliation, and rider-ready count; decision includes accept/reject/escalation, per-lever comparison, timestamp, and operator identity; retirement unlock reflects decision/escalation resolution.
- `MUST_NOT_OBSERVE`: acceptance of an incomplete report, a promised numeric catalog target, or an unlocked retirement path after unresolved escalation/reject.
- `NEGATIVE_CONTROL`: use a cost-stopped report or omit one per-lever comparison; the gate must remain non-green.
- `EVIDENCE`: raw stdout, report JSON, persisted acceptance decision, and command transcript.

### AC-2 — Far-below estimate is escalated rather than silently completed

**Requirement:** GIVEN a per-lever realized rate below the documented escalation example WHEN the Founder reviews the table THEN the recorded decision is escalation/reject with the affected lever and evidence, not automatic acceptance.

- TEST_TIER: `human-gate`  · VERIFY: persisted acceptance artifact and `coverageReport`
- FLOW_REF: T-REC-017

SCENARIO:
- `start_ref`: `s5t4-real-batch-acceptance-packet`
- `ACTION`: Identify any far-below estimate lever (including reconstruct <40% if present), record its numerator/denominator and decision, then inspect lock status.
- `MUST_OBSERVE`: low-yield lever is named, evidence is linked, status is `escalation_required` or `rejected`, and no silent completion occurs.
- `MUST_NOT_OBSERVE`: low rate omitted because total rider-ready count is acceptable, or retirement begins automatically.
- `NEGATIVE_CONTROL`: attempt to submit `accepted` while the low-yield escalation is unresolved; the command must fail or remain non-green.
- `EVIDENCE`: coverage report excerpt, decision artifact, and lock response.

### AC-3 — Top-50 packet is reviewed independently and completely

**Requirement:** GIVEN the rendered top-50 packet WHEN the Founder reviews it THEN every row is marked correct/plausible or a named failure, and any wrong road, duplicate headliner, or test/seed row makes the review fail.

- TEST_TIER: `human-gate`  · VERIFY: `pnpm tsx scripts/top-50-curated-review.ts --render`
- FLOW_REF: UC-VER-05 AC-6 / T-VER-020

SCENARIO:
- `start_ref`: `s5t4-top-50-review-packet` (real post-gate packet)
- `ACTION`: Open each rendered top-50 image/metadata entry; verify road identity and plausible measured-vs-claimed length; search the manifest for duplicate/test/seed markers; submit all row verdicts.
- `MUST_OBSERVE`: 50 (or real catalog size) row verdicts, no contamination, and an independent top-50 review status.
- `MUST_NOT_OBSERVE`: a couch-sample verdict substituted for a top-50 verdict or a partial review accepted.
- `NEGATIVE_CONTROL`: mark one row `wrong` or inject a known test marker; review becomes RED.
- `EVIDENCE`: manifest, image inventory, row-level review JSON, and final status.

### AC-4 — Retirement candidates are reviewed and only explicit decisions commit

**Requirement:** GIVEN the candidate list WHEN the Founder reviews each failure reason and chooses actions THEN no route auto-retires; any retirement has explicit confirmation and reason; unresolved candidates remain visible.

- TEST_TIER: `human-gate`  · VERIFY: `npx convex run reviewQueue:listGeometryReviewQueue '{"limit":200}'` and persisted disposition artifacts
- FLOW_REF: UC-REC-05 / T-REC-014 / T-REC-015

SCENARIO:
- `start_ref`: `s5t4-retirement-review-packet` (real candidate list; use test-support only to rehearse command shape before the real gate)
- `ACTION`: Export candidates, inspect all-lever failure evidence and classifier verdicts, record keep/retry/retire decisions, and for each retirement invoke the explicit confirmation path with a reason.
- `MUST_OBSERVE`: every candidate has a disposition or remains explicitly unresolved; retired rows have `retiredAt`, `retirementReason`, and audit evidence; preserved route IDs remain queryable.
- `MUST_NOT_OBSERVE`: auto-retired rows, missing failure reason, deletion, or marginal-only retirement.
- `NEGATIVE_CONTROL`: run the batch/report without founder confirmations; retired count must not increase.
- `EVIDENCE`: candidate export, row-level decision log, Convex disposition query, and before/after retired count.

## TEST CRITERIA

| TC | Statement | Maps to | Verify |
|---|---|---|---|
| TC-1 | Complete real batch receives explicit realized-yield decision | AC-1 | persisted acceptance artifact + `geometry-coverage-report.ts` output |
| TC-2 | Far-below yield is escalated and remains locked | AC-2 | acceptance/lock artifact |
| TC-3 | Every top-50 row is independently reviewed; one wrong fails | AC-3 | top-50 manifest and review JSON |
| TC-4 | Candidate retirement is explicit, reasoned, preserved, and reversible | AC-4 | candidate/disposition query and audit evidence |

## READING LIST

- `SPRINT.md` — gate and test steps.
- `.spec/prds/route-agent-quality/05-uc-rec.md` — realized-yield assumptions and REC-05.
- `.spec/prds/route-agent-quality/06-uc-ver.md` — top-50 independent review.
- `.spec/prds/route-agent-quality/11-e2e-testing-criteria.md` — T-REC-017, T-REC-020, T-VER-020.
- `scripts/backfill-curated-geometry.ts`, `scripts/geometry-coverage-report.ts`, `scripts/top-50-curated-review.ts`.
- `convex/reviewQueue.ts`, `convex/curatedGeometry.ts`, and `convex/curatedRoutes.ts`.

## GUARDRAILS

**WRITE-ALLOWED:**
- Gate evidence artifacts emitted by the real driver (`.tmp/route-agent-quality/sprint-05/` or the run's canonical evidence directory).
- Founder decisions through existing operator Convex mutations and S5-T1/S5-T2/S5-T3 APIs.

**WRITE-PROHIBITED:**
- Any source-code or other-sprint edits by the Founder task.
- Fixture-only evidence, hand-edited counts, automatic retirement, or changing the expected-yield assumptions during the gate.

## CODE PATTERN

- **Pattern:** inspect raw evidence → record explicit decision → preserve audit packet.
- **Pattern source:** Sprint 04 couch gate artifact and `convex/couchVerdict.ts`.
- **Anti-pattern:** approving from a summary screenshot, treating the estimate as a target, or allowing a batch script to make founder decisions.

## VERIFICATION GATES

- `pnpm tsx scripts/geometry-coverage-report.ts` → report is from the real post-batch deployment.
- `pnpm tsx scripts/top-50-curated-review.ts --render` → manifest/render packet exists and is independently reviewed.
- `npx convex run reviewQueue:listGeometryReviewQueue '{"limit":200}'` → candidate reasons are visible.
- `pnpm test convex/__tests__/S5T1-*.integration.test.ts convex/__tests__/S5T2-*.integration.test.ts convex/__tests__/S5T3-*.integration.test.ts` → supporting contract checks pass.
- Gate proof recomputed from raw evidence; no wholesale suite invocation substitutes for the human steps.

## AGENT INSTRUCTIONS

Run the steps in order, capture raw command output and artifacts, and never replace a missing real result with a fixture or estimate. If the batch stops or a low-yield escalation is unresolved, record RED and stop. Review every row/candidate before submitting the decision; do not silently skip difficult routes.

## AGENT ASSIGNMENT

- **Agent:** `Founder-Operator`.
- **Rationale:** only the founder can accept realized quality, review first-surface road truth, and authorize irreversible-in-practice catalog exclusion.
- **Reviewer:** `product-manager` verifies the packet is complete and the scope remains honest; `convex-reviewer` verifies state evidence.

## EVIDENCE GATES

- Real un-seeded catalog is proven in the run metadata and no route IDs match test/seed prefixes.
- Full batch is `isDone=true`, or gate is explicitly RED with cursor/stop reason.
- Raw report, top-50 manifest/review, candidate export, and decision artifacts are all present.
- Every retirement has explicit confirmation, reason, and preserved route record.

## DEPENDENCIES

- Depends on S5-T1, S5-T2, S5-T3 and Sprint 04 couch PASS.
- Blocks Sprint 10 capstone.

## CODING STANDARDS

- `RULES.md`
- `.spec/prds/route-agent-quality/11-e2e-testing-criteria.md`
- `.spec/prds/route-agent-quality/10-technical-requirements/09-capability-chains.md`

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "version": "1",
  "task_id": "S5-T4",
  "tdd_mode": "skipped",
  "verification_policy": {
    "requires_tests": false,
    "requires_red_evidence": false,
    "requires_seeded_evidence": true
  },
  "fixtures": {
    "s5t4-real-batch-acceptance-packet": {
      "description": "Real un-seeded post-Sprint-04 dev catalog with couch PASS and complete isDone==true full-batch coverageReport (no test-support route IDs in acceptance evidence)",
      "seed_method": "cli",
      "records": [
        "operator: pnpm tsx scripts/backfill-curated-geometry.ts --all until isDone==true",
        "operator: pnpm tsx scripts/geometry-coverage-report.ts produces raw coverageReport JSON",
        "couchGateStatus: 'pass', no routeId matching test: or seed: prefixes in acceptance packet"
      ]
    },
    "s5t4-top-50-review-packet": {
      "description": "Real post-gate top-50 rendered packet (manifest + local PNGs + metadata) independent of couch sample",
      "seed_method": "cli",
      "records": [
        "operator: pnpm tsx scripts/top-50-curated-review.ts --render",
        "manifest rowCount==50 (or real catalog size), images and metadata under local output dir"
      ]
    },
    "s5t4-retirement-review-packet": {
      "description": "Real retirement candidate list from all-lever-failed evidence with per-route failure reasons",
      "seed_method": "cli",
      "records": [
        "operator: npx convex run reviewQueue:listGeometryReviewQueue '{\"limit\":200}'",
        "candidates export with lever failure reasons and classifier verdicts"
      ]
    }
  },
  "requirements": [
    {
      "id": "AC-1",
      "type": "acceptance_criterion",
      "primary": true,
      "description": "GIVEN a couch PASS and a complete real --all report WHEN the Founder-Operator compares per-lever realized yields and rider-ready count with the expected-yield table THEN the founder records accept, reject, or escalation with the raw report reference and the retirement lock follows the decision",
      "verify": "pnpm tsx scripts/geometry-coverage-report.ts plus the persisted acceptance artifact",
      "maps_to_ac": null,
      "scenario": {
        "tier": "visible",
        "test_tier": "e2e",
        "verification_service": "Convex dev deployment (real un-seeded catalog + operator scripts)",
        "negative_control": {
          "would_fail_if": [
            "acceptance uses a static hard-coded report instead of real coverageReport",
            "cost-stopped incomplete report (isDone==false) is accepted",
            "fixture/seeded test: route IDs substitute for the real catalog",
            "decision artifact is mocked empty with no operator identity"
          ]
        },
        "evidence": {
          "artifact_type": "file_artifact",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "s5t4-real-batch-acceptance-packet",
            "action": {
              "actor": "founder_operator",
              "steps": [
                "Confirm couchGateStatus=='pass'",
                "Run/resume --all until isDone==true",
                "Open coverageReport; record per-lever counts/rates and riderReady count against labeled assumptions",
                "Submit Founder decision (accept|reject|escalation)"
              ]
            },
            "end_state": {
              "must_observe": [
                "coverageReport.isDone==true with terminalTotals count >= 1, totalCostUSD > 0, continueCursor reconciled",
                "decision is one of 'accepted'|'rejected'|'escalation_required' with perLeverComparison count >= 1",
                "decision.timestamp is ISO string length >= 1 and operatorIdentity length >= 1",
                "retirementUnlockedAt non-null only when decision=='accepted' or escalation is resolved"
              ],
              "must_not_observe": [
                "decision=='accepted' while isDone==false (partial/cost-stopped report)",
                "promised numeric catalog target used as pass/fail threshold",
                "retirementUnlockedAt set after unresolved escalation or decision=='rejected'",
                "empty report JSON or (0) per-lever comparison fields",
                "acceptance packet containing routeId prefix 'test:' or 'seed:'"
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
      "description": "GIVEN a per-lever realized rate below the documented escalation example WHEN the Founder reviews the table THEN the recorded decision is escalation/reject with the affected lever and evidence, not automatic acceptance",
      "verify": "persisted acceptance artifact and coverageReport",
      "maps_to_ac": null,
      "scenario": {
        "tier": "visible",
        "test_tier": "e2e",
        "verification_service": "Convex dev deployment (real acceptance/lock artifacts)",
        "negative_control": {
          "would_fail_if": [
            "submit decision=='accepted' while low-yield escalation is unresolved and command succeeds",
            "low rate is omitted/stubbed because total riderReady looks acceptable",
            "lock query is mocked to always unlock",
            "static decision artifact with empty lever name"
          ]
        },
        "evidence": {
          "artifact_type": "db_query",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "s5t4-real-batch-acceptance-packet",
            "action": {
              "actor": "founder_operator",
              "steps": [
                "Identify any far-below estimate lever (including reconstruct realizedRate < 0.40 if present)",
                "Record numerator/denominator and decision",
                "Inspect retirement lock status",
                "Attempt submit accepted while escalation unresolved"
              ]
            },
            "end_state": {
              "must_observe": [
                "lowYieldLever=='reconstruct' (or named lever) with numerator >= 0 and denominator >= 1",
                "decision=='escalation_required' or decision=='rejected'",
                "retirementUnlockedAt==null while escalation unresolved",
                "submit decision=='accepted' while unresolved returns ok==false or gateStatus=='red'"
              ],
              "must_not_observe": [
                "decision=='accepted' with unresolved low-yield lever",
                "low rate omitted because total riderReadyCount looks acceptable",
                "retiredCount increases automatically with no founder confirmation",
                "empty lever name or empty evidence link on escalation"
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
      "description": "GIVEN the rendered top-50 packet WHEN the Founder reviews it THEN every row is marked correct/plausible or a named failure, and any wrong road, duplicate headliner, or test/seed row makes the review fail",
      "verify": "pnpm tsx scripts/top-50-curated-review.ts --render",
      "maps_to_ac": null,
      "scenario": {
        "tier": "visible",
        "test_tier": "e2e",
        "verification_service": "local top-50 render packet + independent founder review JSON",
        "negative_control": {
          "would_fail_if": [
            "couch-sample verdict is substituted for top-50 review (static substitute)",
            "partial review with empty remaining verdicts is accepted as pass",
            "one wrong row is mocked away and review stays green",
            "seeded test marker is omitted from contamination scan"
          ]
        },
        "evidence": {
          "artifact_type": "file_artifact",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "s5t4-top-50-review-packet",
            "action": {
              "actor": "founder_operator",
              "steps": [
                "Open each rendered top-50 image/metadata entry",
                "Verify road identity and plausible measured-vs-claimed length",
                "Search manifest for duplicate/test/seed markers",
                "Submit all row verdicts"
              ]
            },
            "end_state": {
              "must_observe": [
                "rowVerdictCount==50 (or real catalog size)",
                "review.status=='pass' only when contaminationCount==0 and every row verdict in {'correct','plausible'}",
                "any wrong/duplicate/test marker forces review.status=='fail' with offending routeId length >= 1"
              ],
              "must_not_observe": [
                "couch-sample verdict substituted for a top-50 verdict",
                "partial review accepted (status=='pass' with empty remaining verdicts)",
                "status=='pass' when one row verdict=='wrong' or test/seed marker present",
                "review packet with (0) row verdicts"
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
      "description": "GIVEN the candidate list WHEN the Founder reviews each failure reason and chooses actions THEN no route auto-retires; any retirement has explicit confirmation and reason; unresolved candidates remain visible",
      "verify": "npx convex run reviewQueue:listGeometryReviewQueue '{\"limit\":200}' and persisted disposition artifacts",
      "maps_to_ac": null,
      "scenario": {
        "tier": "visible",
        "test_tier": "e2e",
        "verification_service": "Convex dev deployment (real reviewQueue + disposition audit)",
        "negative_control": {
          "would_fail_if": [
            "batch/report path auto-increases retired count without founder confirmation",
            "retire mutation is stubbed to succeed without confirmed==true",
            "hard delete removes route document after retire",
            "empty failure reason still commits retirement"
          ]
        },
        "evidence": {
          "artifact_type": "db_query",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "s5t4-retirement-review-packet",
            "action": {
              "actor": "founder_operator",
              "steps": [
                "Export candidates and inspect all-lever failure evidence and classifier verdicts",
                "Record keep/retry/retire decisions",
                "For each retirement invoke explicit confirmation path with a reason",
                "Run batch/report without founder confirmations as negative control"
              ]
            },
            "end_state": {
              "must_observe": [
                "every candidate has disposition in {'keep','retry','retire','unresolved'}",
                "retired rows have retiredAt non-null ISO timestamp and retirementReason length >= 1",
                "dispositionAuditCount >= 1 per retirement",
                "preserved routeId remains queryable (detail.ok==true) after retire"
              ],
              "must_not_observe": [
                "auto-retired rows after batch/report with no confirmation (retiredCount must not increase)",
                "retirementReason empty on retired row",
                "route document deleted (detail returns empty or none)",
                "marginal-only route retired without all-lever failure evidence (eligible==true from marginal alone)"
              ]
            }
          }
        ]
      }
    },
    {"id": "TC-1", "kind": "test", "statement": "Yield decision", "maps_to": ["AC-1"]},
    {"id": "TC-2", "kind": "test", "statement": "Escalation", "maps_to": ["AC-2"]},
    {"id": "TC-3", "kind": "test", "statement": "Top-50 review", "maps_to": ["AC-3"]},
    {"id": "TC-4", "kind": "test", "statement": "Retirement review", "maps_to": ["AC-4"]}
  ]
}
-->
