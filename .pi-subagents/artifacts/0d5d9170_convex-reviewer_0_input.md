# Task for convex-reviewer

Perform a read-only adversarial red-hat review of Sprint 04 at /Users/inference1/Projects/LaneShadow-RN/.spec/prds/route-agent-quality/tasks/sprint-04-trust-pipeline. Goal: independently audit all task acceptance criteria and the actual Convex implementation, especially geometry gate, recovery levers, classifier pagination/checkpointing, sample waterfall, review queue, couch verdict authorization/snapshot binding, and human gate evidence. Read convex/_generated/ai/guidelines.md first. Do NOT edit any files. Treat all services/evidence as suspect; cite exact file:line. Run focused safe checks if useful. Return only: mandatory AC verdict summary (by task), high/medium/low findings with severity/confidence/evidence/fix, human-gate verdict, and any contradictions. Do not produce a report file—the parent will consolidate. Finish when all seven task specs and their implementation seams have been audited.

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