# Task for code-reviewer

Read-only adversarial review of Sprint 04 at /Users/inference1/Projects/LaneShadow-RN/.spec/prds/route-agent-quality/tasks/sprint-04-trust-pipeline at post-remediation HEAD 9a1b9596. Read previous report .spec/reviews/red-hat-sprint-04-trust-pipeline-20260720T205905Z.md. Re-check every previous CRITICAL/HIGH finding and claimed FIX-12..15. Trace the founder/live-provider gate from specifications to production script/workflow and prove or disprove a real authenticated provider call; sentinels/self-report/tests/generated evidence are not proof. Inspect git history, actual implementation, tests. No edits. Return concrete severity-ranked file:line findings, each old critical/high disposition, commands checked.

## Acceptance Contract
Acceptance level: checked
Completion is not accepted from prose alone. End with a structured acceptance report.

Criteria:
- criterion-1: Return concrete findings with file paths and severity when applicable

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