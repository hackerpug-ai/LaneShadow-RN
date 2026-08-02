# Task for convex-planner

You are the project's designated implementation planning specialist (convex-planner). Expand TWO task stubs from Sprint 05 into full TASK-TEMPLATE v5.1 definitions with REQUIREMENT-CONTRACT v1.

IMPORTANT: Return your output as a single ```json code block. Do NOT write files (except your tool may read). DO NOT implement code. Only expand the task definitions.

Every task you propose MUST set `proposed_by`: `convex-planner` in its JSON (Proposed By tripwire).

Working directory: /Users/inference1/Projects/LaneShadow-RN

## SPRINT CONTEXT
- Title: Sprint 05: Batch acceptance + retirement
- Sequence: 5
- Sprint folder: /Users/inference1/Projects/LaneShadow-RN/.spec/prds/route-agent-quality/tasks/sprint-05-batch-acceptance-retirement
- Gate: The Founder-Operator accepts the full batch's realized rider-ready count against the expected-yield table on the real catalog.
- Capability Coverage: CAP-GEO-04, CAP-GEO-05 (consumed), CAP-GEO-03 (consumed)
- Sprint ID: sprint-05-batch-acceptance-retirement

## TASK STUBS (exactly these two)

### REDHAT-FIX-08 (150 min, convex-implementer)
Actually remove `.take(500)` from the unscoped live `coverageReport` path — the FOUNDER'S REAL query path, `convex/curatedGeometry.ts:1330-1365` — with an exhaustive paginate-to-completion scan or an indexed aggregate keyed by `geometryProvenance` (no fixed row cap, no separate fictional `coverageReportLivePublic` function — fix the function the founder actually calls). Also exclude `test:`/`seed:` AND fixture routes (e.g. `curatedGeometryTestSupport.ts:226`'s `tepusquet` `seedPoCRoute`) from this same unscoped scan by extending `isTestSeedRoute` (`top50Eligibility.ts:34-44`) beyond prefix-matching to catch known fixture routeIds. Write the 5 real `REDHATFIX07-*.integration.test.ts` files the prior task cited but never created, with assertions that fail on a `.take(500)` regression (N>500 rows in one status bucket must still be exhaustively counted). Fix `sortManifestRows` (`top50Review.ts:124`) to normalize `compositeScore` onto one scale before sorting — integer (`85`) and decimal (`0.85`) scores are currently mixed, so integer rows always outrank decimal rows regardless of true quality. Verify via `rg -n "\.take\(500\)" convex/curatedGeometry.ts` returning zero matches in the unscoped path; cited red-hat findings F1, F2, F7, F12, F13, F14, G1

### REDHAT-FIX-09 (180 min, convex-implementer)
Record a REAL founder acceptance, not a fabricated one. Run a FRESH real `runFullBatch` (new `runId` — prior `s5-full-batch-redhatfix07-20260725T075100Z` was already rejected once; `resolveBatchEscalation` requires prior state `escalation_required`, so a rejected artifact can never legitimately become accepted). Use REAL entry points `waterfallOrchestrator:runFullBatch` and `curatedGeometry:coverageReport` (NOT fictional `runFullBatchAll` / `coverageReportLivePublic`). Real authenticated founder identity for requestBatchAcceptance/resolveBatchEscalation (not seed-shaped `s4t5-redhatfix07-operator`). Legitimate state machine: requestBatchAcceptance(accept) → escalation_required → resolveBatchEscalation(accept, rationale). Commit gate-results.json + 8 gate-logs + sprint-goal-state.json at real SHA with written_at_commit that git show can resolve. Populate .tmp/S5-T4/{coverage-report-accepted,top50-manifest,founder-gate-packet}.json for real. Real step-7 row-level retirement candidates + step-8 unretireRoute transcript. Honest cycle counter. Depends on REDHAT-FIX-08. Findings F3-F6, F8-F11, F15-F18, G2-G4.

## MUST READ (use Read tool)
1. /Users/inference1/Projects/LaneShadow-RN/.spec/reviews/red-hat-sprint-05-batch-acceptance-retirement-20260725T164517Z.md
2. /Users/inference1/Projects/LaneShadow-RN/.spec/prds/route-agent-quality/tasks/sprint-05-batch-acceptance-retirement/REDHAT-FIX-07-exhaustive-coverage-report-lever-counts.md
3. /Users/inference1/Projects/LaneShadow-RN/.spec/prds/route-agent-quality/tasks/sprint-05-batch-acceptance-retirement/.task-expansion-draft-redhat-fix-07.json  ← MATCH THIS JSON SCHEMA EXACTLY for field names/structure
4. Code hotspots: convex/curatedGeometry.ts (coverageReport ~1235-1380, take(500) ~1336), convex/lib/top50Eligibility.ts, convex/top50Review.ts sortManifestRows ~124, convex/curatedGeometryTestSupport.ts ~226, convex/guards.ts ~125, resolveBatchEscalation in curatedGeometry.ts
5. /Users/inference1/Projects/brain/docs/kanban/SCENARIO-CONTRACT-V1.md (first 120 lines ok)
6. PRD: .spec/prds/route-agent-quality/05-uc-rec.md (skim)

## VERIFICATION COMMANDS (exact)
- npx vitest run convex/__tests__/<file>.integration.test.ts  (NOT pnpm test)
- pnpm type-check
- pnpm exec biome check convex scripts
- pnpm tsx scripts/backfill-curated-geometry.ts --all
- rg -n "\\.take\\(500\\)" convex/curatedGeometry.ts
- rg "runFullBatchAll|coverageReportLivePublic" convex/ scripts/ .spec/

## REQUIRED PER TASK
Full expanded task matching FIX-07 draft keys including:
task_id, title, task_type FEATURE, tdd_mode red_first, verification_policy, status Backlog, priority P0, effort M, estimate_minutes, agent convex-implementer, agent_rationale, reviewer convex-reviewer, proposed_by convex-planner, sprint_id, prd_refs, touches_capabilities, provides, consumes, boundary_contracts, critical_constraints{must,never,strictly}, specification{objective,success_state,background}, fixtures with seed_method public_api, acceptance_criteria 4+ with full scenario objects, test_criteria 4+, requirements flattened, reading_list, guardrails, design, verification_gates, coding_standards, dependencies, notes, resolution_source

PRIMARY ACs: test_tier integration, verification_service "Convex dev deployment", flow_ref UC-REC-04/05 or UC-VER-05.

Scenarios must be non-fakeable: concrete must_observe, must_not_observe, negative_control.would_fail_if, fixtures public_api.

FIX-08 = code (take500 removal, fixture scrub, REDHATFIX07 tests, score normalize).
FIX-09 depends_on REDHAT-FIX-08 = honest gate evidence + real founder accept path.

## OUTPUT FORMAT
Return EXACTLY one JSON object:
{
  "expanded_tasks": [ /* REDHAT-FIX-08, REDHAT-FIX-09 */ ]
}

Be as thorough as FIX-07 (5 ACs each preferred). No prose outside the json fence.

---
**Output:**
Write your findings to exactly this path: /Users/inference1/Projects/LaneShadow-RN/.spec/prds/route-agent-quality/tasks/sprint-05-batch-acceptance-retirement/.task-expansion-draft-redhat-fix-08-09.json
This path is authoritative for this run.
Ignore any other output filename or output path mentioned elsewhere, including output destinations in the base agent prompt, system prompt, or task instructions.

## Acceptance Contract
Acceptance level: checked
Completion is not accepted from prose alone. End with a structured acceptance report.

Criteria:
- criterion-1: Implement the requested change without widening scope

Required evidence: changed-files, tests-added, commands-run, residual-risks, no-staged-files

Finish with a fenced JSON block tagged `acceptance-report` in this shape:
Use empty arrays when no items apply; array fields contain strings unless object entries are shown.
`criteriaSatisfied[].status` must be exactly one of: satisfied, not-satisfied, not-applicable.
`commandsRun[].result` must be exactly one of: passed, failed, not-run.
`manualNotes` and `notes` are optional strings; an empty string means no note and does not satisfy `manual-notes` evidence.
```acceptance-report
{
  "criteriaSatisfied": [
    {
      "id": "criterion-1",
      "status": "satisfied",
      "evidence": "specific proof"
    }
  ],
  "changedFiles": [
    "src/file.ts"
  ],
  "testsAddedOrUpdated": [
    "test/file.test.ts"
  ],
  "commandsRun": [
    {
      "command": "command",
      "result": "passed",
      "summary": "short result"
    }
  ],
  "validationOutput": [
    "validation output or concise summary"
  ],
  "residualRisks": [
    "none"
  ],
  "noStagedFiles": true,
  "diffSummary": "short description of the diff",
  "reviewFindings": [
    "blocker: file.ts:12 - issue found, or no blockers"
  ],
  "manualNotes": "anything else the parent should know"
}
```