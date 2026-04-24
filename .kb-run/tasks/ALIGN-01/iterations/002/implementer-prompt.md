You are the implementer for kb-run task ALIGN-01 remediation iteration 002.

Context:
- Repo root: /Users/justinrich/Projects/LaneShadow
- Worktree: /Users/justinrich/Projects/LaneShadow/.kb-run/worktrees/ALIGN-01
- Task file: /Users/justinrich/Projects/LaneShadow/.spec/prds/v2/tasks/sprint-03-design-system-alignment/ALIGN-01-audit-token-outputs.md
- Sprint: sprint-03-design-system-alignment
- Start commit: 11542c485dbe630c2b4d52e7eee2531b3dabacd2
- Do not edit any `.kb-run*` files. The host owns runner state and evidence artifacts.
- Stay strictly inside the task write scope. If the task cannot be completed without going out of scope, stop and return `status=blocked`.
- Do not commit. The orchestrator owns commits.
- Run the task's required reading yourself from the repository before editing.

Normalized requirement matrix:
- AC-1 [ACCEPTANCE CRITERIA]: Surface/border gaps documented [PRIMARY]
- AC-2 [ACCEPTANCE CRITERIA]: map.* gaps documented
- AC-3 [ACCEPTANCE CRITERIA]: sizing.stroke documented
- AC-4 [ACCEPTANCE CRITERIA]: signal/status-tint gaps documented
- AC-5 [ACCEPTANCE CRITERIA]: Android column + naming-mismatch section
- TC-1 [TEST CRITERIA]: drift-report.md exists at the specified path
- TC-2 [TEST CRITERIA]: drift-report.md contains ≥12 distinct MISSING rows
- TC-3 [TEST CRITERIA]: surface.scrim-soft row has expected light rgba(34,24,16,0.18)
- TC-4 [TEST CRITERIA]: map.style.light and map.style.dark rows both present
- TC-5 [TEST CRITERIA]: sizing.stroke.md row records expected value 2
- TC-6 [TEST CRITERIA]: No production Swift or Kotlin files modified

Reviewer findings to close:
- HIGH spec_mismatch: expand the report to enumerate every wrong-valued Android key as a discrete row, not just outright omissions. At minimum include rows such as `surface.primary` and `border.default` where `Tokens.kt` hardcodes the light value and cannot represent the dark value.
- MEDIUM spec_mismatch: add the canonical theme-token rows for `stroke.sm`, `stroke.md`, and `stroke.lg`, and keep them distinct from the separate dimensions-schema `sizing.stroke.*` audit.

Task-specific emphasis:
- This remains audit-only. Never modify generated tokens, semantic JSON, `ios/**`, or `android/**`.
- Preserve the already-satisfied explicit AC/TC rows.
- Use canonical theme JSON dotted paths for theme-token rows.
- The report should now clearly distinguish:
  1. Missing rows
  2. Wrong-valued Android rows
  3. Naming mismatches
  4. Separate dimensions-schema `sizing.stroke.*` drift called out alongside, not instead of, canonical theme `stroke.*` rows

Runtime commands to use as evidence where relevant:
- test: test -f .spec/prds/v2/tasks/sprint-03-design-system-alignment/drift-report.md

Completion contract:
- Final response must be JSON only matching the existing implementer completion schema.
- Set `task_id` to `ALIGN-01`.
- Set `evidence_path` to `/Users/justinrich/Projects/LaneShadow/.kb-run/tasks/ALIGN-01/iterations/002/evidence.md` and `evidence_manifest_path` to `/Users/justinrich/Projects/LaneShadow/.kb-run/tasks/ALIGN-01/iterations/002/evidence-manifest.json`; do not write those files.
- Include concrete `files_changed` and `verification_commands`.
- `acceptance_criteria_evidence` must cover every requirement id above. Use `status=met` or `not_met`.
- If blocked, explain the blocker precisely and list `failed_commands`.

Write scope:
- Allowed: `.spec/prds/v2/tasks/sprint-03-design-system-alignment/drift-report.md`
- Prohibited: `tokens/platforms/**`, `tokens/scripts/generate.ts`, `tokens/semantic/**`, `ios/**`, `android/**`
