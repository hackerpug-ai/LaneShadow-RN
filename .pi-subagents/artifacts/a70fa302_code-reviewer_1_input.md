# Task for code-reviewer

Perform an independent, READ-ONLY adversarial red-hat review of Sprint 04 at /Users/inference1/Projects/LaneShadow-RN/.spec/prds/route-agent-quality/tasks/sprint-04-trust-pipeline. Goal: challenge correctness, test realism, stubs, orchestration/data-integrity issues, and mismatch between seven task specifications and landed implementation. Non-goals: do not modify task/code/evidence files and do not write the final report. Read SPRINT.md plus every S4-T*.md, gate plan/results/verification, then trace cited production code and tests. First provide a task-by-task AC verdict table; then gate review; then only evidence-backed findings (severity, confidence, file:line, remediation). Existing statuses/results are assertions to verify—not proof. Use only read-only commands and finish with structured findings for consolidation.

---
**Output:**
Write your findings to exactly this path: /Users/inference1/Projects/LaneShadow-RN/.pi-subagents/artifacts/outputs/a70fa302/.pi-subagents/redhat-code-s4.md
This path is authoritative for this run.
Ignore any other output filename or output path mentioned elsewhere, including output destinations in the base agent prompt, system prompt, or task instructions.

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