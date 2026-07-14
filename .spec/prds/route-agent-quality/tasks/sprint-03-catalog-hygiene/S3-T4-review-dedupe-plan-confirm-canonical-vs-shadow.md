# S3-T4 — Review the dedupe dry-run plan on real data; confirm canonical-vs-shadow per group before commit (T-HYG-005)

| Field | Value |
|-------|-------|
| TASK_ID | S3-T4 |
| SPRINT | [Sprint 03 — Catalog hygiene](./SPRINT.md) |
| TASK_TYPE | CHORE |
| AGENT | `Founder-Operator` (human verification gate — no reviewer) |
| ESTIMATE | 30 min |
| EFFORT | S |
| PRIORITY | P0 |
| STATUS | Backlog |
| PROPOSED_BY | `convex-planner` |
| TDD_MODE | `skipped` |
| RED_GREEN_REQUIRED | no |
| CAPABILITIES | — (N/A: deterministic at-rest cleanup) |
| DEPENDS_ON | S3-T2 |
| BLOCKS | Sprint 04 |

RUNTIME_COMMANDS:
- (human gate — operator runs the real hygiene passes on the dev deployment; no automated suite)

## OUTCOME

All seven gate steps pass on the real dev deployment: score dry-run previewed; dedupe dry-run reviewed and canonical-vs-shadow confirmed per group; merge committed; 'Cherohala Skyway' returns exactly one row; length + test-row quarantine reasons recorded; the second state-normalization pass changes nothing.

## 🚫 CRITICAL CONSTRAINTS (Never tier — read before acting)

**MUST**
- Run every pass as a {dryRun:true} preview FIRST and inspect the change-set before any commit.
- Review each duplicate group's canonical-vs-shadow selection and confirm the canonical is the gate-passing or highest-score row (T-HYG-005) BEFORE the commit run.
- Only commit the merge after per-group confirmation; then verify a 'Cherohala Skyway' search returns exactly one row.
- Run state normalization twice and confirm the second pass reports changed == 0.

**NEVER**
- Never commit the dedupe merge before reviewing the dry-run plan per group.
- Never invent automated tests for this gate — it is an operator checklist.
- Never write code in this task.

**STRICTLY**
- The gate passes only when all seven checklist items are confirmed on the real dev deployment.
- Each quarantine reason must be visible/recorded when the operator lists quarantined rows.

## DONE WHEN

- AC-1: the ÷100 change-set is previewed without any write
- AC-2: the duplicate-group plan (groups + per-group canonical + shadows) is returned without writing
- AC-3: the canonical-vs-shadow selection is inspected for every duplicate group
- AC-4 [PRIMARY]: the canonical is confirmed to be the gate-passing or highest-score row for every group before the commit run (T-HYG-005)
- AC-5: the merge commits and a 'Cherohala Skyway' search returns exactly one row
- AC-6: each quarantine reason (zero_length / length_outlier / test_row) is recorded and listable
- AC-7: the second pass reports changed == 0
- All seven gate steps confirmed on the real dev deployment; canonical-vs-shadow confirmed per duplicate group BEFORE the commit run (T-HYG-005)

## SPECIFICATION

**Objective:** Founder-Operator executes the Sprint-03 human testing gate on the real catalog: preview each hygiene pass, review the dedupe canonical-vs-shadow plan per group, confirm and commit the merge, and verify quarantine reasons and state-normalization idempotency.

**Success state:** All seven gate steps pass on the real dev deployment: score dry-run previewed; dedupe dry-run reviewed and canonical-vs-shadow confirmed per group; merge committed; 'Cherohala Skyway' returns exactly one row; length + test-row quarantine reasons recorded; the second state-normalization pass changes nothing.

## ACCEPTANCE CRITERIA (operator verification checklist — human gate)

### AC-1 — Score normalization dry-run previewed without writing

**Requirement:** GIVEN the real catalog WHEN the operator runs normalizeEditorialScores dry-run THEN the ÷100 change-set is previewed without any write

- TEST_TIER: `manual`  ·  VERIFICATION_SERVICE: Founder-Operator review on the real Convex dev deployment
- FLOW_REF: T-HYG-005
- VERIFY: `npx convex run curatedGeometryHygiene:normalizeEditorialScores '{"dryRun":true}'`

### AC-2 — Dedupe dry-run plan produced on the real catalog

**Requirement:** GIVEN the real catalog WHEN the operator runs dedupeGroups dry-run THEN the duplicate-group plan (groups + per-group canonical + shadows) is returned without writing

- TEST_TIER: `manual`  ·  VERIFICATION_SERVICE: Founder-Operator review on the real Convex dev deployment
- FLOW_REF: T-HYG-005
- VERIFY: `npx convex run curatedGeometryHygiene:dedupeGroups '{"dryRun":true}'`

### AC-3 — Each duplicate group's canonical-vs-shadow selection reviewed

**Requirement:** GIVEN the dedupe dry-run plan WHEN the operator reviews each group THEN the canonical-vs-shadow selection is inspected for every duplicate group

- TEST_TIER: `manual`  ·  VERIFICATION_SERVICE: Founder-Operator review on the real Convex dev deployment
- FLOW_REF: T-HYG-005
- VERIFY: `pnpm tsx scripts/hygiene-curated-routes.ts --dedupe --dryRun`

### AC-4 [PRIMARY] — Canonical confirmed as the gate-passing or highest-score row before commit

**Requirement:** GIVEN the reviewed plan WHEN the operator confirms each group THEN the canonical is confirmed to be the gate-passing or highest-score row for every group before the commit run (T-HYG-005)

- TEST_TIER: `manual`  ·  VERIFICATION_SERVICE: Founder-Operator review on the real Convex dev deployment
- FLOW_REF: T-HYG-005
- VERIFY: `pnpm tsx scripts/hygiene-curated-routes.ts --dedupe --dryRun`

### AC-5 — Merge committed; Cherohala Skyway returns exactly one row

**Requirement:** GIVEN the confirmed plan WHEN the operator commits the merge and searches THEN the merge commits and a 'Cherohala Skyway' search returns exactly one row

- TEST_TIER: `manual`  ·  VERIFICATION_SERVICE: Founder-Operator review on the real Convex dev deployment
- FLOW_REF: T-HYG-005
- VERIFY: `npx convex run curatedGeometryHygiene:dedupeGroups '{}' && npx convex run semanticSearch:findRoutesByIdentifier '{"identifier":"Cherohala Skyway"}'`

### AC-6 — Length + test-row quarantine reasons recorded

**Requirement:** GIVEN the real catalog WHEN the operator runs length + test-row quarantine THEN each quarantine reason (zero_length / length_outlier / test_row) is recorded and listable

- TEST_TIER: `manual`  ·  VERIFICATION_SERVICE: Founder-Operator review on the real Convex dev deployment
- FLOW_REF: T-HYG-005
- VERIFY: `pnpm tsx scripts/hygiene-curated-routes.ts --length --test-rows`

### AC-7 — State normalization run twice; second pass changes nothing

**Requirement:** GIVEN the real catalog WHEN the operator runs normalizeStates twice THEN the second pass reports changed == 0

- TEST_TIER: `manual`  ·  VERIFICATION_SERVICE: Founder-Operator review on the real Convex dev deployment
- FLOW_REF: T-HYG-005
- VERIFY: `npx convex run curatedGeometryHygiene:normalizeStates '{}'`

## TEST CRITERIA

| TC | Statement | Maps to | Verify |
|----|-----------|---------|--------|
| TC-1 | The founder confirms the canonical-vs-shadow selection for every duplicate group before the commit run (T-HYG-005) | AC-4 | `pnpm tsx scripts/hygiene-curated-routes.ts --dedupe --dryRun` |
| TC-2 | After the committed merge a 'Cherohala Skyway' search returns exactly one row | AC-5 | `npx convex run semanticSearch:findRoutesByIdentifier '{"identifier":"Cherohala Skyway"}'` |
| TC-3 | The second normalizeStates pass reports changed 0 | AC-7 | `npx convex run curatedGeometryHygiene:normalizeStates '{}'` |

## SCOPE (file-level write permissions)

**writeAllowed:**
- (none)

**writeProhibited:**
- ALL code — this is a read-only Founder-Operator verification gate
- convex/**, scripts/**, app/**, .spec/** — no writes

## READING LIST

- `.spec/prds/route-agent-quality/tasks/sprint-03-catalog-hygiene/S3-T2-duplicate-group-detection-reversible-merge.md` — the dedupeGroups plan shape this gate reviews (blocking dependency)
- `.spec/prds/route-agent-quality/11-e2e-testing-criteria.md` (T-HYG-005) — the exact human-gate criterion and its 7 test steps
- `scripts/hygiene-curated-routes.ts` (usage header) — operator flag conventions (--dedupe/--length/--test-rows/--states/--dryRun)

## CODE PATTERN

- Anti-pattern: Committing the merge before per-group canonical-vs-shadow confirmation; fabricating an automated test in place of the operator's judgment.

## VERIFICATION GATES

- Score dry-run previews without writing: `npx convex run curatedGeometryHygiene:normalizeEditorialScores '{"dryRun":true}'` → change-set printed; no table write
- Dedupe dry-run plan reviewed + confirmed per group: `pnpm tsx scripts/hygiene-curated-routes.ts --dedupe --dryRun` → per-group canonical-vs-shadow plan; operator confirms each
- Merge committed; single Cherohala row: `npx convex run semanticSearch:findRoutesByIdentifier '{"identifier":"Cherohala Skyway"}'` → exactly 1 row
- State normalization second pass no-op: `npx convex run curatedGeometryHygiene:normalizeStates '{}'` → changed == 0 on the second run

## AGENT ASSIGNMENT

- Agent: `Founder-Operator` — Human testing gate (T-HYG-005): the Founder-Operator runs the real hygiene passes on the ~5,757-route production catalog, reviews the dedupeGroups dry-run plan, and confirms the canonical-vs-shadow pick per duplicate group before committing the merge. No automated test can substitute for the operator's per-group judgment; this is a VERIFICATION-CHECKLIST, not code.

## DEPENDENCIES

- Depends on: S3-T2
- Blocks: Sprint 04

## CODING STANDARDS

- brain/docs/WHEN-PRINTING-HUMAN-TESTING-STEPS.md
- brain/docs/HUMAN-TESTING-GATE-VERIFICATION.md

<details>
<summary>▸ Full agent specification (TASK-TEMPLATE v5.2 — machine-readable requirement contract)</summary>

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "version": "1",
  "task_id": "S3-T4",
  "tdd_mode": "skipped",
  "verification_policy": {
    "requires_tests": false,
    "requires_red_evidence": false,
    "requires_seeded_evidence": false
  },
  "fixtures": {},
  "requirements": [
    {
      "id": "AC-1",
      "type": "acceptance_criterion",
      "primary": false,
      "maps_to_ac": null,
      "description": "GIVEN the real catalog WHEN the operator runs normalizeEditorialScores dry-run THEN the \u00f7100 change-set is previewed without any write",
      "verify": "npx convex run curatedGeometryHygiene:normalizeEditorialScores '{\"dryRun\":true}'",
      "scenario": null
    },
    {
      "id": "AC-2",
      "type": "acceptance_criterion",
      "primary": false,
      "maps_to_ac": null,
      "description": "GIVEN the real catalog WHEN the operator runs dedupeGroups dry-run THEN the duplicate-group plan (groups + per-group canonical + shadows) is returned without writing",
      "verify": "npx convex run curatedGeometryHygiene:dedupeGroups '{\"dryRun\":true}'",
      "scenario": null
    },
    {
      "id": "AC-3",
      "type": "acceptance_criterion",
      "primary": false,
      "maps_to_ac": null,
      "description": "GIVEN the dedupe dry-run plan WHEN the operator reviews each group THEN the canonical-vs-shadow selection is inspected for every duplicate group",
      "verify": "pnpm tsx scripts/hygiene-curated-routes.ts --dedupe --dryRun",
      "scenario": null
    },
    {
      "id": "AC-4",
      "type": "acceptance_criterion",
      "primary": true,
      "maps_to_ac": null,
      "description": "GIVEN the reviewed plan WHEN the operator confirms each group THEN the canonical is confirmed to be the gate-passing or highest-score row for every group before the commit run (T-HYG-005)",
      "verify": "pnpm tsx scripts/hygiene-curated-routes.ts --dedupe --dryRun",
      "scenario": null
    },
    {
      "id": "AC-5",
      "type": "acceptance_criterion",
      "primary": false,
      "maps_to_ac": null,
      "description": "GIVEN the confirmed plan WHEN the operator commits the merge and searches THEN the merge commits and a 'Cherohala Skyway' search returns exactly one row",
      "verify": "npx convex run curatedGeometryHygiene:dedupeGroups '{}' && npx convex run semanticSearch:findRoutesByIdentifier '{\"identifier\":\"Cherohala Skyway\"}'",
      "scenario": null
    },
    {
      "id": "AC-6",
      "type": "acceptance_criterion",
      "primary": false,
      "maps_to_ac": null,
      "description": "GIVEN the real catalog WHEN the operator runs length + test-row quarantine THEN each quarantine reason (zero_length / length_outlier / test_row) is recorded and listable",
      "verify": "pnpm tsx scripts/hygiene-curated-routes.ts --length --test-rows",
      "scenario": null
    },
    {
      "id": "AC-7",
      "type": "acceptance_criterion",
      "primary": false,
      "maps_to_ac": null,
      "description": "GIVEN the real catalog WHEN the operator runs normalizeStates twice THEN the second pass reports changed == 0",
      "verify": "npx convex run curatedGeometryHygiene:normalizeStates '{}'",
      "scenario": null
    },
    {
      "id": "TC-1",
      "type": "test_criterion",
      "primary": false,
      "maps_to_ac": "AC-4",
      "description": "The founder confirms the canonical-vs-shadow selection for every duplicate group before the commit run (T-HYG-005)",
      "verify": "pnpm tsx scripts/hygiene-curated-routes.ts --dedupe --dryRun"
    },
    {
      "id": "TC-2",
      "type": "test_criterion",
      "primary": false,
      "maps_to_ac": "AC-5",
      "description": "After the committed merge a 'Cherohala Skyway' search returns exactly one row",
      "verify": "npx convex run semanticSearch:findRoutesByIdentifier '{\"identifier\":\"Cherohala Skyway\"}'"
    },
    {
      "id": "TC-3",
      "type": "test_criterion",
      "primary": false,
      "maps_to_ac": "AC-7",
      "description": "The second normalizeStates pass reports changed 0",
      "verify": "npx convex run curatedGeometryHygiene:normalizeStates '{}'"
    }
  ]
}
-->
</details>
