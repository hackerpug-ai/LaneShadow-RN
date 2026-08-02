# Task for ai-tooling-reviewer

Read-only adversarial review in /Users/inference1/Projects/LaneShadow-RN. Target: .spec/prds/route-agent-quality/tasks/sprint-04-trust-pipeline. Do NOT edit any files. Determine whether FIX-21/22 actually eliminate all working-tree reads from the canonical-plan path and exact-match off-plan scripts. Inspect source/tests/history and execute focused non-destructive tests where possible. Also re-confirm FIX-17/18/19/20 and identify NEW severity issues in couch gate control-plane functions: couchGateStatus, recordCouchVerdict, runAllWaterfall, deriveGoalState, verifyEvidenceManifest, resolveFounderVerdict, gate-plan.json. Treat external S4-T7 human Founder-Operator review as expected BLOCKED, not code finding. Produce findings with severity/confidence and file:line evidence, including a concrete verification matrix. Stop after a detailed report.

---
**Output:**
Write your findings to exactly this path: /Users/inference1/Projects/LaneShadow-RN/.pi-subagents/artifacts/outputs/8bb7ad8c/.pi/artifacts/reviews/ai-tooling-reviewer.md
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