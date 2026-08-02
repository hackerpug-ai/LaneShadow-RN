# Task for product-manager

You are the product planning specialist for LaneShadow-RN. This is READ-ONLY planning; do not edit files. Expand ONLY Sprint 05: Batch acceptance + retirement from /Users/inference1/Projects/LaneShadow-RN/.spec/prds/route-agent-quality/ROADMAP.md into implementation-ready task definitions for S5-T1 through S5-T4. Read the PRD index and relevant REC/VER use cases and e2e criteria, especially realized-yield acceptance, escalation, retirement eligibility/explicit founder confirmation/reversible unretire, and independent top-50 review. Return exactly one ```json block, no prose, with {"expanded_tasks":[...]} and full TASK-TEMPLATE-compatible objects. Every task MUST include proposed_by:"product-manager"; ACs must have stable AC-N ids, GWT requirements, scenarios with shared fixture start_ref, concrete must_observe/must_not_observe, negative_control and evidence; TCs stable TC-N; requirements[] flattened; exact verification gates and guardrails. Keep product scope honest: expected-yield table is an estimate, founder accepts realized count, far-below lever yields escalate, couch PASS unlocks --all, no auto-retirement, records preserved. No file edits.

## Acceptance Contract
Acceptance level: attested
Completion is not accepted from prose alone. End with a structured acceptance report.

Criteria:
- criterion-1: Return concrete findings with file paths and severity when applicable

Required evidence: review-findings, residual-risks

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