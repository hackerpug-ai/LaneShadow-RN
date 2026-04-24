# UC-ATM-11 Evidence

Host validation
- `test -f tokens/api/LSMap.contract.md && test -f tokens/sandbox/fixtures/routes.fixtures.json` passed.
- `node -e "const f=require('./tokens/sandbox/fixtures/routes.fixtures.json'); const a=f.route_results_three_alts.polylines; console.log(a.length===3 && a.some(p=>p.variant==='best') && a.some(p=>p.variant==='alt1') && a.some(p=>p.variant==='alt2')?'PASS':'FAIL')"` returned `PASS`.
- `grep -n 'MBXAccessToken\|secrets.xml\|MAPBOX_ACCESS_TOKEN' tokens/api/LSMap.contract.md` matched both platform token conventions.
- `grep -n 'LSGlassPanel\|MapMode\|CameraPosition\|CameraFit\|PolylineData\|Annotation' ios/LaneShadow/Views/Atoms/LSMap.swift` matched the required declarations and fallback reference.
- `cd ios && xcodebuild build -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'` finished with `BUILD SUCCEEDED`.
- Worktree diff remains limited to the three scoped task deliverables.

Scope note
- The child session triggered a runner checksum warning for `.kb-run-sprint-codex/.state.json.sha256`; that host-owned artifact is outside task scope and was not included in task evidence or files changed.
