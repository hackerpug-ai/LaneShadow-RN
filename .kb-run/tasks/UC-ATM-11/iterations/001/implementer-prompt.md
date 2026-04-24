You are the implementer for kb-run task UC-ATM-11.

Context:
- Repo root: /Users/justinrich/Projects/LaneShadow
- Worktree: /Users/justinrich/Projects/LaneShadow/.kb-run/worktrees/UC-ATM-11
- Task file: /Users/justinrich/Projects/LaneShadow/.spec/prds/v2/tasks/sprint-03-design-system-alignment/UC-ATM-11-lsmap-shared-contract.md
- Sprint: sprint-03-design-system-alignment
- Start commit: e9c71eec46caadd2b0fc19739efe98e64469de75
- Do not edit any .kb-run files. The host owns runner state and evidence artifacts.
- Stay strictly inside the task write scope. If the task cannot be completed without going out of scope, stop and return status=blocked.
- Do not commit. The orchestrator owns commits.
- Run the task's required reading yourself from the repository before editing.

Normalized requirement matrix:
- AC-1 [ACCEPTANCE CRITERIA]: Contract file exists with all types [PRIMARY]
- AC-2 [ACCEPTANCE CRITERIA]: Fixture file with 3 scenarios
- AC-3 [ACCEPTANCE CRITERIA]: iOS stub compiles without Mapbox import
- AC-4 [ACCEPTANCE CRITERIA]: Access-token convention documented
- AC-5 [ACCEPTANCE CRITERIA]: iOS stub signature matches contract
- TC-1 [TEST CRITERIA]: tokens/api/LSMap.contract.md exists
- TC-2 [TEST CRITERIA]: tokens/sandbox/fixtures/routes.fixtures.json exists
- TC-3 [TEST CRITERIA]: route_results_three_alts.polylines array has exactly 3 entries
- TC-4 [TEST CRITERIA]: ios/LaneShadow/Views/Atoms/LSMap.swift exists and has no MapboxMaps import
- TC-5 [TEST CRITERIA]: xcodebuild build succeeds after adding LSMap.swift stub
- TC-6 [TEST CRITERIA]: LSMap.swift stub body references LSGlassPanel
- TC-7 [TEST CRITERIA]: LSMap.swift type declarations contain MapMode, CameraPosition, CameraFit, PolylineData, Annotation

Runtime commands to use as evidence where relevant:
- test: test -f tokens/api/LSMap.contract.md && test -f tokens/sandbox/fixtures/routes.fixtures.json
- typecheck: cd ios && xcodebuild build -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'

Completion contract:
- Final response must be JSON only matching the provided schema.
- Set task_id to "UC-ATM-11".
- Set evidence_path to "/Users/justinrich/Projects/LaneShadow/.kb-run/tasks/UC-ATM-11/iterations/001/evidence.md" and evidence_manifest_path to "/Users/justinrich/Projects/LaneShadow/.kb-run/tasks/UC-ATM-11/iterations/001/evidence-manifest.json"; do not write those files.
- Include concrete files_changed and verification_commands.
- acceptance_criteria_evidence must cover every requirement id above. Use status=met or not_met.
- If blocked, explain the blocker precisely and list failed_commands.

Task-specific emphasis:
- This is the shared LSMap contract task. Deliver the shared contract doc, fixtures, and the scoped iOS stub only. Android production implementation is out of scope.
