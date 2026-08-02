# Task for convex-reviewer

Perform a fresh READ-ONLY adversarial review of current HEAD a39c5850f4e8e8813013f0f0d403ed16ada3b112 in /Users/inference1/Projects/LaneShadow-RN for Sprint 04 trust pipeline. Focus specifically on rechecking prior CRITICAL/HIGH: REDHAT-FIX-12 machine-derived gate goal-state writer and REDHAT-FIX-16 legacy frozen couch manifest routeHashes fail-closed migration. Inspect the actual committed diff, task ACs, schemas, Convex code, integration tests, and runtime test evidence where feasible. Do not edit files or treat sentinels/self-reports/passing tests/generated bundles as proof of founder/live-provider gate. Return findings with severity, confidence, precise file:line evidence, and state whether each prior C/H is fixed/reopened/partial. Also identify any new C/H issue.

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