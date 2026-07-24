# S5-T3 — Top-50-by-composite-rank Founder review harness

> Status: Backlog
> Proposed By: `convex-planner`

| Field | Value |
|---|---|
| TASK_ID | S5-T3 |
| SPRINT | [Sprint 05 — Batch acceptance + retirement](./SPRINT.md) |
| TASK_TYPE | FEATURE |
| AGENT | `convex-implementer` |
| ESTIMATE | 90 min |
| EFFORT | M |
| PRIORITY | P0 |
| PROPOSED_BY | `convex-planner` |
| TDD_MODE | `red_first` |
| RED_GREEN_REQUIRED | yes |
| CAPABILITIES | touches `CAP-GEO-03` and Founder-Bar T2; consumes accepted/gated catalog; provides independent rank-surface evidence |
| DEPENDS_ON | S5-T1, S4-T1, S4-T2, S4-T6 |
| BLOCKS | S5-T4, S10-T1 |

RUNTIME_COMMANDS:
- integration: `pnpm test convex/__tests__/S5T3-*.integration.test.ts`
- typecheck: `pnpm type-check`
- lint: `pnpm exec biome check convex scripts`
- operator: `pnpm tsx scripts/top-50-curated-review.ts`

## BACKGROUND

The couch sample is stratified by provenance and difficulty, not by the surface a rider sees first. A route can therefore pass the couch sample while a duplicate headliner, test row, or wrong high-score line occupies the top of discovery. This task creates a deterministic top-50 manifest and local render harness, with a separate founder verdict, so the first-surface catalog is reviewed independently.

## 🚫 CRITICAL CONSTRAINTS (Never tier)

- **MUST** select exactly the first 50 eligible rows by `riderReady=true` and descending `compositeScore` using the real indexed query/order.
- **MUST** include route identity, score, provenance, measured/claimed length, geometry evidence, and render path in the manifest.
- **MUST** render map images locally from the persisted geometry; image bytes must not flow through Convex.
- **NEVER** substitute the couch sample, a fixture-only ranking, or a client-side sort for the top-50 review.
- **NEVER** silently omit duplicates, test/seed rows, retired rows, shadows, or non-ready rows; the harness must fail with the excluded IDs/reasons if any appear.

## SPECIFICATION

**Objective:** Build the operator harness that exports and renders the real post-gate top 50 by composite rank and records a separate fail-closed review result for road correctness, plausible length, duplicate headliners, and test/seed contamination.

**Success state:** `scripts/top-50-curated-review.ts` queries the canonical indexed ready surface, produces a 50-row manifest plus local PNGs and metadata, and the review artifact is PASS only when all rows are correct/plausible and none is a duplicate or test/seed row. One failure makes the artifact RED and does not alter couch-gate status.

## ACCEPTANCE CRITERIA

### AC-1 [PRIMARY] — Manifest is exactly the real rank-ordered ready surface

**Requirement:** GIVEN a real post-batch catalog WHEN the harness exports the top 50 THEN it returns up to 50 rows in descending composite rank from the canonical rider-ready query and includes measured geometry/provenance/length evidence for each.

- TEST_TIER: `integration`  · VERIFY: `pnpm test convex/__tests__/S5T3-top-50-manifest.integration.test.ts`
- FLOW_REF: UC-VER-05 / T-VER-020

SCENARIO:
- `start_ref`: `s5t3-ranked-ready-manifest`
- `ACTION`: Seed a public test-support catalog with 55 route rows spanning scores, ready/non-ready status, provenance, and saved geometry; invoke the actual top-50 query/export and parse the manifest.
- `MUST_OBSERVE`: manifest contains exactly the first 50 eligible rows (or all rows when the real catalog has fewer), is score-descending with deterministic tie-break, each row has route ID/name/score/provenance/measured and claimed miles/geometry reference, and no non-ready row is present.
- `MUST_NOT_OBSERVE`: client-side re-sort, rows without geometry evidence, or a fixed fixture list independent of the query.
- `NEGATIVE_CONTROL`: insert a higher-score `riderReady=false` row and a lower-score ready row; the non-ready row must not enter the manifest.
- `EVIDENCE`: Convex query capture plus manifest JSON with query ordering and row IDs.

### AC-2 — Local renders and metadata make every row reviewable

**Requirement:** GIVEN a valid top-50 manifest WHEN the operator runs the render harness THEN each manifest row has a local map PNG and a metadata record showing road identity, provenance, measured-vs-claimed length, and source route ID, while Convex receives no image bytes.

- TEST_TIER: `integration` + `human-gate`  · VERIFY: `pnpm test convex/__tests__/S5T3-top-50-render.integration.test.ts`
- FLOW_REF: TR 11 §3 / T-VER-020

SCENARIO:
- `start_ref`: `s5t3-local-render-manifest`
- `ACTION`: Export a real manifest, run `pnpm tsx scripts/top-50-curated-review.ts --render`, inspect the output directory and captured Convex calls.
- `MUST_OBSERVE`: one PNG and one metadata entry per manifest row, metadata maps one-to-one to route IDs and includes length/provenance, output path is local and deterministic, and Convex payloads contain only IDs/metadata.
- `MUST_NOT_OBSERVE`: missing PNG, image base64 in a Convex mutation, or render success with no route ID mapping.
- `NEGATIVE_CONTROL`: delete one geometry before rendering; the harness must fail that row and not emit a passing review packet.
- `EVIDENCE`: filesystem manifest/PNG inventory, metadata JSON, and captured CLI/Convex stdout.

### AC-3 — Review is independent and fails on a wrong road, duplicate, or test row

**Requirement:** GIVEN a rendered top-50 packet WHEN the Founder-Operator records row verdicts and overall review THEN one `wrong`, duplicate headliner, or test/seed row forces RED regardless of couch-gate status; all clean rows are required for PASS.

- TEST_TIER: `integration` + `human-gate`  · VERIFY: `pnpm test convex/__tests__/S5T3-top-50-review.integration.test.ts`
- FLOW_REF: UC-VER-05 / T-VER-020

SCENARIO:
- `start_ref`: `s5t3-top-50-negative-control`
- `ACTION`: Record a `wrong` verdict for one row and a duplicate/test marker in the review support data; query review status; clear the negative control, record all rows as correct/plausible, and query again.
- `MUST_OBSERVE`: first result is `fail` with offending route IDs/reasons; second result is `pass` only after every row is reviewed and no contamination remains; couch-gate state remains unchanged.
- `MUST_NOT_OBSERVE`: partial review treated as pass, a wrong row hidden by aggregation, or top-50 review auto-changing retirement/couch state.
- `NEGATIVE_CONTROL`: deliberately mark one top-ranked row `wrong`; the gate must fail even with 49 `correct` verdicts.
- `EVIDENCE`: append-only review JSON and Convex audit query with row-level verdicts.

## TEST CRITERIA

| TC | Statement | Maps to | Verify |
|---|---|---|---|
| TC-1 | Top-50 manifest is real, ordered, and rider-ready-only | AC-1 | `pnpm test convex/__tests__/S5T3-top-50-manifest.integration.test.ts` |
| TC-2 | Local PNG/metadata output is complete and no image bytes cross Convex | AC-2 | `pnpm test convex/__tests__/S5T3-top-50-render.integration.test.ts` |
| TC-3 | Any wrong/duplicate/test row forces independent review RED | AC-3 | `pnpm test convex/__tests__/S5T3-top-50-review.integration.test.ts` |

## READING LIST

- `convex/curatedRoutes.ts` — canonical rider-ready/composite-score query and exclusion rules.
- `convex/curatedGeometry.ts` — geometry evidence and coverage helpers.
- `convex/couchSampleExport.ts` / `convex/couchRouteMapPng.ts` — local render boundary pattern.
- `scripts/backfill-curated-geometry.ts` — operator-driver conventions and artifact output.
- `convex/schema.ts` — route indexes, geometry provenance, quarantine, duplicate, and audit fields.
- `.spec/prds/route-agent-quality/10-technical-requirements/09-capability-chains.md` — CAP-GEO-03/05.
- `.spec/prds/route-agent-quality/11-e2e-testing-criteria.md` — T-VER-020.
- `convex/_generated/ai/guidelines.md`.

## GUARDRAILS

**WRITE-ALLOWED:**
- `convex/curatedRoutes.ts` (ranked internal query only if the existing query lacks the exact contract).
- `convex/curatedGeometry.ts` (manifest/report query only).
- `convex/top50Review.ts` (new operator review mutation/query if needed).
- `scripts/top-50-curated-review.ts` (new local renderer/manifest driver).
- `convex/__tests__/S5T3-*.integration.test.ts`.

**WRITE-PROHIBITED:**
- Any other sprint's `.spec` files/task files, couch verdicts, or retirement state.
- Image storage in Convex, client-side ranking, or silent filtering of contamination.
- Changes to route geometry or rider-ready flags as a side effect of review export.

## CODE PATTERN

- **Pattern:** indexed query → local artifact export → append-only independent human verdict.
- **Pattern source:** `convex/curatedRoutes.ts`, `convex/couchSampleExport.ts`, `scripts/backfill-curated-geometry.ts`.
- **Anti-pattern:** using the ~25 couch sample as a top-50 proxy or accepting a report that does not enumerate every row.

## VERIFICATION GATES

- `pnpm test convex/__tests__/S5T3-*.integration.test.ts` → integration and negative-control scenarios pass.
- `pnpm type-check` → exit 0.
- `pnpm exec biome check convex scripts` → exit 0.
- `pnpm convex:dev --once` → exit 0.
- `git diff --name-only` → only S5-T3 allow-listed paths changed.

## AGENT INSTRUCTIONS

Write RED integration tests before implementation. Exercise the actual indexed query and local render path; fixture only the catalog setup, never the rank selection or review verdict. Capture row-level evidence and test the single-wrong negative control. Keep top-50 review independent from couch state and retirement mutations.

## AGENT ASSIGNMENT

- **Agent:** `convex-implementer` — owns the internal query, audit mutation, and local render driver.
- **Rationale:** the review packet crosses Convex data access and an operator-side TypeScript renderer.
- **Reviewer:** `convex-reviewer` — challenge ranking/index parity, contamination checks, and image-boundary safety.

## EVIDENCE GATES

- RED evidence for AC-1..3.
- Integration evidence includes ordered route IDs, output inventory, and row-level negative-control verdict.
- Human evidence is separate from the couch sample and records all 50 rows or the real catalog size.
- `validate_scenario` zero CRITICAL for every behavioral scenario.

## DEPENDENCIES

- Depends on: S5-T1 and Sprint 04 gate/persist work.
- Blocks: S5-T4 and S10-T1.

## CODING STANDARDS

- `convex/_generated/ai/guidelines.md`
- `RULES.md`
- `AGENTS.md`
- `.spec/prds/route-agent-quality/10-technical-requirements/11-e2e-testing.md`

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "version": "1",
  "task_id": "S5-T3",
  "tdd_mode": "red_first",
  "verification_policy": {
    "requires_tests": true,
    "requires_red_evidence": true,
    "requires_seeded_evidence": true
  },
  "fixtures": {
    "s5t3-ranked-ready-manifest": {
      "description": "Public test-support catalog with 55 route rows spanning composite scores, ready/non-ready status, provenance, and saved geometry",
      "seed_method": "public_api",
      "records": [
        "55 routes: 50 with riderReady==true and compositeScore descending 0.99..0.50",
        "5 routes with riderReady==false including one higher-score non-ready (compositeScore: 0.995)",
        "each ready row has routeId, name, provenance, measuredMiles, claimedMiles, geometry reference"
      ]
    },
    "s5t3-local-render-manifest": {
      "description": "Valid top-50 manifest with persisted geometry for local PNG render and metadata mapping",
      "seed_method": "public_api",
      "records": [
        "manifest rowCount==50 (or catalog size), each row has routeId and geometry polyline reference",
        "output dir: local deterministic path under .tmp/top-50-review/"
      ]
    },
    "s5t3-top-50-negative-control": {
      "description": "Rendered top-50 packet with support for injecting one wrong verdict and a duplicate/test marker",
      "seed_method": "public_api",
      "records": [
        "50 reviewable rows with initial verdicts unset",
        "negative control row: top-ranked routeId marked verdict=='wrong' or test/seed marker present"
      ]
    }
  },
  "requirements": [
    {
      "id": "AC-1",
      "type": "acceptance_criterion",
      "primary": true,
      "description": "GIVEN a real post-batch catalog WHEN the harness exports the top 50 THEN it returns up to 50 rows in descending composite rank from the canonical rider-ready query and includes measured geometry/provenance/length evidence for each",
      "verify": "pnpm test convex/__tests__/S5T3-top-50-manifest.integration.test.ts",
      "maps_to_ac": null,
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "verification_service": "Convex dev deployment (real indexed rider-ready compositeScore query)",
        "negative_control": {
          "would_fail_if": [
            "manifest is a static hard-coded fixture list independent of the query",
            "ranking is client-side re-sort of a stub response",
            "higher-score riderReady==false row is included (empty ready filter)",
            "disconnected query returns empty manifest while seed has 50 ready rows"
          ]
        },
        "evidence": {
          "artifact_type": "db_query",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "s5t3-ranked-ready-manifest",
            "action": {
              "actor": "api_client",
              "steps": [
                "Seed public test-support catalog with 55 routes spanning scores and ready flags",
                "Invoke actual top-50 query/export",
                "Parse manifest ordering and row fields"
              ]
            },
            "end_state": {
              "must_observe": [
                "manifest.rowCount==50 (exactly first 50 eligible rows with riderReady==true)",
                "rows are score-descending with deterministic tie-break (score[i] >= score[i+1])",
                "each row has routeId length >= 1, name, compositeScore, provenance, measuredMiles, claimedMiles, geometryRef length >= 1",
                "every manifest row has riderReady==true"
              ],
              "must_not_observe": [
                "row with riderReady==false in manifest",
                "higher-score non-ready row (compositeScore==0.995) included",
                "client-side re-sort or fixed fixture list independent of query",
                "rows with geometryRef empty",
                "manifest.rowCount==(0) after seeding 50 riderReady==true routes"
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
      "description": "GIVEN a valid top-50 manifest WHEN the operator runs the render harness THEN each manifest row has a local map PNG and a metadata record showing road identity, provenance, measured-vs-claimed length, and source route ID, while Convex receives no image bytes",
      "verify": "pnpm test convex/__tests__/S5T3-top-50-render.integration.test.ts",
      "maps_to_ac": null,
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "verification_service": "Convex dev deployment + local top-50-curated-review.ts render harness",
        "negative_control": {
          "would_fail_if": [
            "render is stubbed and emits PNG count without reading geometry",
            "image base64 is hard-coded into a Convex mutation payload",
            "delete one geometry and harness still emits a passing review packet",
            "empty output directory accepted as success"
          ]
        },
        "evidence": {
          "artifact_type": "file_artifact",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "s5t3-local-render-manifest",
            "action": {
              "actor": "api_client",
              "steps": [
                "Export a real manifest",
                "Run pnpm tsx scripts/top-50-curated-review.ts --render",
                "Inspect output directory and captured Convex calls"
              ]
            },
            "end_state": {
              "must_observe": [
                "pngCount == manifest.rowCount (one PNG per row)",
                "metadataEntryCount == manifest.rowCount with 1:1 routeId mapping",
                "each metadata row has measuredMiles, claimedMiles, provenance, routeId length >= 1",
                "output path is local under .tmp/ and Convex payloads contain only IDs/metadata (imageByteCount==0)"
              ],
              "must_not_observe": [
                "pngCount < manifest.rowCount (missing PNG for any row)",
                "image base64 or binary in a Convex mutation payload",
                "render success with empty routeId mapping",
                "status=='pass' review packet after one geometry is deleted (empty geometry)"
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
      "description": "GIVEN a rendered top-50 packet WHEN the Founder-Operator records row verdicts and overall review THEN one wrong, duplicate headliner, or test/seed row forces status=='fail' regardless of couch-gate status; all clean rows are required for status=='pass'",
      "verify": "pnpm test convex/__tests__/S5T3-top-50-review.integration.test.ts",
      "maps_to_ac": null,
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "verification_service": "Convex dev deployment (real independent top-50 review artifact)",
        "negative_control": {
          "would_fail_if": [
            "review is stubbed to always return status=='pass'",
            "one wrong verdict is omitted/aggregated away (static rollup)",
            "partial review with empty verdicts is treated as pass",
            "top-50 review mutates couch-gate or retirement state (disconnected side effects)"
          ]
        },
        "evidence": {
          "artifact_type": "db_query",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "s5t3-top-50-negative-control",
            "action": {
              "actor": "api_client",
              "steps": [
                "Record verdict=='wrong' for one top-ranked row and a duplicate/test marker",
                "Query review status (expect fail)",
                "Clear negative control, record all 50 rows as correct/plausible",
                "Query review status again (expect pass)"
              ]
            },
            "end_state": {
              "must_observe": [
                "first result status=='fail' with offending routeId length >= 1 and reason length >= 1",
                "second result status=='pass' only after every row is reviewed and contaminationCount==0",
                "reviewedRowCount==50 (or real catalog size)",
                "couchGateStatusUnchanged==true across both queries"
              ],
              "must_not_observe": [
                "status=='pass' with one row verdict=='wrong' (even if correctCount==49)",
                "partial review treated as pass (empty verdicts remaining)",
                "top-50 review mutates retirementUnlockedAt or couchGateStatus",
                "status=='fail' with empty offending routeId list"
              ]
            }
          }
        ]
      }
    },
    {"id": "TC-1", "kind": "test", "statement": "Rank manifest", "maps_to": ["AC-1"]},
    {"id": "TC-2", "kind": "test", "statement": "Render boundary", "maps_to": ["AC-2"]},
    {"id": "TC-3", "kind": "test", "statement": "Review negative control", "maps_to": ["AC-3"]}
  ]
}
-->
