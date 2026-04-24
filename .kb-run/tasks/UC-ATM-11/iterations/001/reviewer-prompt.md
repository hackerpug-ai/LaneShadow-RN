Review kb-run task UC-ATM-11. Respond with JSON only matching the reviewer verdict schema used by kb-run review-contract.

Task file: /Users/justinrich/Projects/LaneShadow/.spec/prds/v2/tasks/sprint-03-design-system-alignment/UC-ATM-11-lsmap-shared-contract.md
Checkpoint commit: e600f2b6c23c0b36cc3cc8330042347c0ea588db
Worktree: /Users/justinrich/Projects/LaneShadow/.kb-run/worktrees/UC-ATM-11

Requirements:
- AC-1: Contract file exists with all types [PRIMARY]
- AC-2: Fixture file with 3 scenarios
- AC-3: iOS stub compiles without Mapbox import
- AC-4: Access-token convention documented
- AC-5: iOS stub signature matches contract
- TC-1: tokens/api/LSMap.contract.md exists
- TC-2: tokens/sandbox/fixtures/routes.fixtures.json exists
- TC-3: route_results_three_alts.polylines array has exactly 3 entries
- TC-4: ios/LaneShadow/Views/Atoms/LSMap.swift exists and has no MapboxMaps import
- TC-5: xcodebuild build succeeds after adding LSMap.swift stub
- TC-6: LSMap.swift stub body references LSGlassPanel
- TC-7: LSMap.swift type declarations contain MapMode, CameraPosition, CameraFit, PolylineData, Annotation

Validation summary:
- `test -f tokens/api/LSMap.contract.md && test -f tokens/sandbox/fixtures/routes.fixtures.json` passed.
- Route fixture verification returned `PASS` for exactly 3 `route_results_three_alts` polylines with variants `best`, `alt1`, and `alt2`.
- `grep -c 'import MapboxMaps' ios/LaneShadow/Views/Atoms/LSMap.swift` returned `0`.
- `grep -n 'MBXAccessToken\|secrets.xml\|MAPBOX_ACCESS_TOKEN' tokens/api/LSMap.contract.md` matched both platform token conventions.
- `cd ios && xcodebuild build -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'` finished with `BUILD SUCCEEDED`.
- Checkpoint commit succeeded with hooks enabled after the worktree inherited root `node_modules` and `convex/_generated`.

Changed files:
- tokens/api/LSMap.contract.md
- tokens/sandbox/fixtures/routes.fixtures.json
- ios/LaneShadow/Views/Atoms/LSMap.swift

Review focus:
- Verify the commit satisfies every AC/TC for UC-ATM-11.
- Confirm the shared contract remains SDK-agnostic in its public surface.
- Confirm the iOS stub stays within scope: no Mapbox import, LSGlassPanel fallback only, signature aligned with the contract.
- Treat root-linked `node_modules` and generated Convex symlinks as preflight environment setup, not task scope.
- APPROVED only if every requirement is satisfied and there are no concrete HIGH findings.
