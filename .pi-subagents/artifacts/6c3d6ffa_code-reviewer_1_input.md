# Task for code-reviewer

Perform a fresh READ-ONLY red-team review of current HEAD a39c5850f4e8e8813013f0f0d403ed16ada3b112 in /Users/inference1/Projects/LaneShadow-RN. Audit the exact HEAD commit (REDHAT-FIX-12) against the REDHAT-FIX-12 task contract: tools/gate/deriveGoalState.ts, four rebuilt scripts, goal-state output, and test. Hunt for bypasses, stale/evidence substitution, shell identity spoofing, commit mismatch, and test theatre. Recheck REDHAT-FIX-16 implementation exists/fails closed. Do not edit files and do not claim founder/live-provider gate has passed from proxy artifacts. Return concise severity/confidence findings with file:line evidence and test commands/results if run.

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