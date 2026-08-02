# Task for convex-reviewer

Read-only independent red-team review of current /Users/inference1/Projects/LaneShadow-RN focused on REDHAT-FIX-27 command-authority closure and regression FIX-17..26. Reproduce/check full non-ASCII evasion matrix: Cyrillic е inside .gate-evidence/evidence markers, Cyrillic һ in .sh, ZWSP U+200B/U+FEFF, full-width ．/／, script path, args, arbitrary non-ASCII code unit; exact ASCII plan command must be sole accept on off-plan axis. Search for any NEW severity issue / next seam. Human S4-T7 external BLOCKED is correct and not a code defect. No edits. Run focused tests where possible. Return AC verdict table with file:line evidence, commands/results, findings severity/confidence.

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