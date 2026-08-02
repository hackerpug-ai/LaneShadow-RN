# Task for convex-reviewer

ROLE: Red-team adversarial Convex reviewer. TARGET: /Users/inference1/Projects/LaneShadow-RN/.spec/prds/route-agent-quality/tasks/sprint-04-trust-pipeline (Sprint 04 Trust pipeline). Goal: independently review the completed sprint/task specs, current implementation, gate evidence, and tests for real remaining correctness, integrity, authorization, data-model, transaction, pagination, and fail-closed defects. Required: read /Users/inference1/Projects/LaneShadow-RN/convex/_generated/ai/guidelines.md first. Inspect SPRINT.md and all S4/REDHAT task files, then relevant convex source and evidence. Treat all claims and gates as untrusted. Run targeted safe read-only commands/tests if useful. DO NOT edit any files, task checkboxes, git state, or generated artifacts: this is strictly advisory. Stop when you have a cited structured result. Respond with: 1) AC verdict coverage summary; 2) findings, each with severity (Critical/High/Medium/Low), confidence, exact file:line evidence, impact, and remediation; 3) gate executability/provability assessment; 4) positive evidence; 5) top risks. No invented evidence.

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