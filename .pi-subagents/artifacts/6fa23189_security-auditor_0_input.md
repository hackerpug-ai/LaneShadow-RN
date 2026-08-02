# Task for security-auditor

Goal: independently adversarially audit the current repository's off-plan command-authority path, focused on FIX-25 shell-metachar rejection. Read the target sprint artifacts at /Users/inference1/Projects/LaneShadow-RN/.spec/prds/route-agent-quality/tasks/sprint-04-trust-pipeline and actual source/tests. Do NOT edit files. Verify every command input boundary and hunt bypasses including Unicode normalization/confusables, whitespace/IFS/quotes/newlines, serialized/structured inputs and alternative call paths. Reconfirm all stated FIX-17 through FIX-25 properties insofar as their task acceptance criteria define them. Return a concise report with exact file:line evidence, reproducible commands/tests, severity, and explicitly distinguish external human gate as not a code finding. Stop after read-only audit; no source changes.

---
**Output:**
Write your findings to exactly this path: /Users/inference1/Projects/LaneShadow-RN/.pi-subagents/artifacts/outputs/6fa23189/tmp/security-audit.txt
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