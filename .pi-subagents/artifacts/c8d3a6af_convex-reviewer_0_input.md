# Task for convex-reviewer

Fresh independent adversarial red-hat review of Sprint 04 Trust Pipeline at CURRENT HEAD 41eca15c (read-only; do not modify files). Focus FIX-26 command-authority closure and regressions FIX-17..25. Read target SPRINT.md, REDHAT-FIX-26 task, prior report .spec/reviews/red-hat-sprint-04-trust-pipeline-20260721T185814Z.md, tools/gate/deriveGoalState.ts, relevant tests. Reproduce full matrix using real code: Unicode whitespace NBSP/U+2007/U+202F/U+2028, ZW U+200B/U+FEFF, Cyrillic/Latin homoglyphs in interpreter and each part of .gate-evidence/script path, arbitrary non-ASCII bytes/characters, exact ASCII plan acceptance, plus prior FIX-24/25 attacks. Hunt bypasses—especially ways to make enforcement not recognize a Unicode-polluted gate script. Reconfirm FIX-17..25. Run focused Vitest/typecheck as practical. Deliver mandatory AC verdict table with file:line + commands/output and only evidence-backed CRITICAL/HIGH/MEDIUM/LOW findings. No edits.

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