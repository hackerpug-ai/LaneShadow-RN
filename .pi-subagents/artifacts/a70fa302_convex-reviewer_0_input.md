# Task for convex-reviewer

Perform a READ-ONLY adversarial red-hat review of Sprint 04 at /Users/inference1/Projects/LaneShadow-RN/.spec/prds/route-agent-quality/tasks/sprint-04-trust-pipeline. Goal: identify implementation gaps, stubs, AC failures, and human-gate weaknesses. Non-goals: do not edit any file, do not run destructive commands, and do not write the final report. Required reading: /Users/inference1/Projects/LaneShadow-RN/convex/_generated/ai/guidelines.md, SPRINT.md and all seven S4-T*.md files; inspect relevant Convex code/tests/evidence and the gate artifacts. Every substantive claim must cite file:line. First deliver an AC verdict table covering each task AC (pass/fail/partial); then human-test gate assessment; then findings grouped with severity (Critical/High/Medium/Low) and confidence. Treat claimed completion and existing gate artifacts as evidence to validate, not proof. Stop with concise structured findings for a parent-written consolidated report. Verification: use repo inspection and focused non-mutating checks only.

---
**Output:**
Write your findings to exactly this path: /Users/inference1/Projects/LaneShadow-RN/.pi-subagents/artifacts/outputs/a70fa302/.pi-subagents/redhat-convex-s4.md
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