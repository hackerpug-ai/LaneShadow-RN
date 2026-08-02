# Task for convex-planner

You previously expanded REDHAT-FIX-08 and REDHAT-FIX-09. validate_scenario FAILED. Fix the scenarios so every behavioral AC passes with zero CRITICAL and zero HIGH violations. Do NOT write project files other than returning JSON. proposed_by must remain "convex-planner".

## Input draft
Read: /Users/inference1/Projects/LaneShadow-RN/.spec/prds/route-agent-quality/tasks/sprint-05-batch-acceptance-retirement/.task-expansion-draft-redhat-fix-08-09.json

## Validator
Run locally after editing in your head (orchestrator will re-run):
python3 /Users/inference1/Projects/brain/tools/validate-scenario/validate_scenario.py <contract.json>
Also study a PASSING example:
/Users/inference1/Projects/LaneShadow-RN/.spec/prds/route-agent-quality/tasks/sprint-05-batch-acceptance-retirement/.task-expansion-draft-redhat-fix-07.json
and FIX-07 scenarios' would_fail_if / must_not_observe style.

## Failures to fix

### REDHAT-FIX-08 (exit 1)
- NEG_CONTROL_WEAK (HIGH x3): would_fail_if must name disconnect/stub/empty/mock/static/hardcoded conditions explicitly. Include tokens like: stub, mock, empty, hardcoded, static, take(500) still present.
- NEG_OBSERVE_WEAK (HIGH): must_not_observe must include empty/start signature like "empty levers", "candidateCount == 0", "(0)", "empty".

### REDHAT-FIX-09 (exit 1) — CRITICAL weak oracles
- WEAK_ORACLE CRITICAL: must_observe 'acceptance.retirementUnlockedAt != null' — no concrete anchor. Fix to concrete like `acceptance.retirementUnlockedAt == <ISO-timestamp>` or `retirementUnlockedAt is non-null ISO string matching /^\d{4}-/` AND include a literal/number.
- WEAK_ORACLE CRITICAL: 'git show resolves all gate evidence at written_at_commit' — use concrete: `git show exit_code == 0` and `gate-results.json contains "run_id":"<NEW_RUN_ID>"`
- WEAK_ORACLE CRITICAL: 'git status --porcelain is empty' — use `git status --porcelain output == ""` or `modified_file_count == 0`
- NEG_CONTROL_WEAK / NEG_OBSERVE_WEAK same as above — add stub/mock/empty/hardcoded/static and empty-start must_not_observe.

## Fix rules (SCENARIO-CONTRACT)
For EVERY AC scenario:
1. negative_control.would_fail_if MUST include at least one of: stub, mock, empty, hardcoded, static, disconnect, take(500), fabricated
2. end_state.must_observe MUST have concrete anchors: numbers, quoted literals, == comparisons with values
3. end_state.must_not_observe MUST include empty/start signatures: "empty", "0", "candidateCount == 0", "[]", "missing files", etc.
4. Keep fixtures with seed_method public_api
5. Keep 5 ACs + 5 TCs + flattened requirements[] in sync (requirements[].scenario must match AC scenarios)

## Output
Return full corrected JSON:
```json
{
  "expanded_tasks": [ /* both tasks fully corrected */ ]
}
```
Do not omit fields. Keep all non-scenario content from the draft unless a scenario-linked field must change.

---
**Output:**
Write your findings to exactly this path: /Users/inference1/Projects/LaneShadow-RN/.spec/prds/route-agent-quality/tasks/sprint-05-batch-acceptance-retirement/.task-expansion-draft-redhat-fix-08-09-remediated.json
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