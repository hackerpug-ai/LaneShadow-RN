# iOS Learnings: AUTH-S03-T11 Real-device WDA E2E gate

## Implementation Date
2026-04-29

## Edge Cases Discovered
1. When WDA is unreachable, the harness still needs to emit all Sprint 03 steps; readiness becomes `FAIL` and dependent iOS steps become `BLOCKED`.
2. Diagnostics must still be materialized even without an active WDA session; placeholder source/screenshot files preserve artifact contract.

## API Contract Notes
- iOS-only WDA evidence cannot validate Android/dashboard/server observations; these remain `MANUAL` or `BLOCKED`.
- Result schema stability (`id`, `status`, `detail`, `dependsOn`, `timestamp`, `evidence`, `remediation`) is essential for artifact tests.

## UI Decisions
- Auth provider buttons switched to semantic identifiers (`auth.signIn.apple`, `auth.signIn.google`) to avoid localization brittleness.
- Sign-in root now exposes `auth.signIn.root` for stable WDA assertions.

## Platform-Specific Notes
- Real-device iOS build gate in CI/worktree can fail on missing signing team even when simulator tests pass.
- Node ESM warning appears because repo package type is not module; harmless for harness execution.

## Files Created/Modified
- ios/E2E/lib/wda-helpers.js — dependency-free WDA helper + step tracker.
- ios/E2E/sprint-03-auth.js — Sprint 03 flow artifact generator.
- ios/E2E/results/sprint-03-auth.json — generated artifact baseline.
- ios/E2E/diagnostics/sprint-03-auth/* — generated failure diagnostics artifacts.
- ios/LaneShadowTests/Integration/Sprint03WDAArtifactTests.swift — artifact contract tests for AC-1..AC-5.
- ios/LaneShadow/DesignSystem/Molecules/LSAuthProviderButton.swift — stable auth provider identifiers.
- ios/LaneShadow/Features/Auth/SignInScreen.swift — sign-in root identifier.
