# Task for code-reviewer

ROLE: Red-team adversarial code reviewer. TARGET: /Users/inference1/Projects/LaneShadow-RN/.spec/prds/route-agent-quality/tasks/sprint-04-trust-pipeline (Sprint 04 Trust pipeline). Independently review the sprint specification, all task files, current implementation, tests, and gate evidence for stubbed logic, test theatre, unfulfilled acceptance criteria, contradictions, reliability, and integration gaps. Read repository instructions and the target SPRINT.md before source. Run safe read-only inspection/tests as appropriate. DO NOT edit any file, checkbox, git state, or artifact; report only. Stop when you provide a structured response: AC verdict coverage summary; findings each with severity/confidence/file:line/evidence/impact/fix; gate runnable/provable assessment; positive evidence; risks. Be adversarial and cite only verified facts.

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