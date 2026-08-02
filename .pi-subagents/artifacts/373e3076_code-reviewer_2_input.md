# Task for code-reviewer

Perform a fresh read-only red-hat code quality review of Sprint 04 Trust Pipeline, target /Users/inference1/Projects/LaneShadow-RN/.spec/prds/route-agent-quality/tasks/sprint-04-trust-pipeline, at post-remediation HEAD eddcbe50. Read SPRINT.md, all task files, current source and tests, prior reports .spec/reviews/red-hat-sprint-04-trust-pipeline-20260720T160338Z.md and .spec/reviews/red-hat-sprint-04-trust-pipeline-20260720T185110Z.md. Re-check all prior CRITICAL/HIGH finding IDs/issues explicitly with VERIFIED FIXED/STILL FAILS/NOT VERIFIABLE, evidence file:line. Independently look for stale tests, fake evidence, incorrect gate/oracle wiring, concurrency/data integrity, incomplete AC behavior and regressions introduced in commits through eddcbe50. Do not change files. Return structured concise report including AC/gate verdict and new findings severity/confidence.

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