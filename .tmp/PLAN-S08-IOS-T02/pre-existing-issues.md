# Pre-Existing / Environment Issues

## Verification Method
- Re-ran the repo-wide `pnpm` checks after stashing the task files:
  - `ai-specs/PLAN-S08-IOS-T02/ios-learnings.md`
  - `ios/LaneShadow/Features/MapApp/MapAppViewModel.swift`
  - `ios/LaneShadowTests/Templates/PlanningScreenTests.swift`
- Baseline outputs were captured in:
  - `.tmp/PLAN-S08-IOS-T02/typecheck-baseline.txt`
  - `.tmp/PLAN-S08-IOS-T02/biome-baseline.txt`

## `pnpm type-check:native`
- Fails before and after stashing because the worktree does not have the JS toolchain installed:
  - `tsgo: command not found`
  - `Local package.json exists, but node_modules missing`

## `pnpm exec biome check --no-errors-on-unmatched`
- Fails before and after stashing with repo-wide issues outside this iOS task:
  - `biome.json` schema version mismatch (`2.4.12` config vs `2.4.15` CLI)
  - formatting drift in `.kb-run-sprint/state.json`
  - unrelated accessibility violations in `logos/preview.html` and `logos/v2/preview.html`

## Task Scope Note
- These failures are outside the modified Swift files for `PLAN-S08-IOS-T02`.
- Native task verification for this remediation is satisfied by:
  - `xcodebuild test -only-testing:LaneShadowTests/PlanningScreenTests`
  - `xcodebuild build -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'`
  - `scripts/tokens/enforce-native-compliance.sh`
  - `swiftlint lint ...`
