# Task for convex-reviewer

Perform a fresh, read-only adversarial red-hat review of Sprint 04 Trust Pipeline at /Users/inference1/Projects/LaneShadow-RN/.spec/prds/route-agent-quality/tasks/sprint-04-trust-pipeline against repository HEAD eddcbe50. Read convex/_generated/ai/guidelines.md first, SPRINT.md and every S4-T*.md, prior red-hat reports .spec/reviews/red-hat-sprint-04-trust-pipeline-20260720T160338Z.md and .spec/reviews/red-hat-sprint-04-trust-pipeline-20260720T185110Z.md, then inspect actual Convex code/tests/evidence. Recheck EVERY prior CRITICAL/HIGH finding explicitly with VERIFIED FIXED / STILL FAILS / NOT VERIFIABLE plus file:line evidence. Independently enumerate all acceptance criteria with PASS/FAIL/PARTIAL and scrutinize authorization, durable state, paging/checkpointing, classifier provider behavior, evidence integrity and tests. Do not edit any files. Return a concise structured report with severity/confidence and exact evidence.

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