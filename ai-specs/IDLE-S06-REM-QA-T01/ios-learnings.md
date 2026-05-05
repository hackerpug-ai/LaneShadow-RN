# iOS Learnings: IDLE-S06-REM-QA-T01

## Implementation Date
2026-05-05

## Edge Cases Discovered
1. `pnpm design:review --screens idle-screen` passes `--screens idle-screen` as separate CLI args, so `run.ts` must parse both `--screens=value` and `--screens value` forms.
2. Modern `xcresulttool export attachments` writes UUID filenames and a manifest with human-readable attachment names; the exporter must read that manifest instead of inferring names from PNG basenames.
3. The required `xcodebuild test` class still contains legacy live-flow failures outside the idle sprint gate. A stashed base run reproduced `test_planningScreen_light` and `test_routeResultsScreen_light` failures unchanged.

## API Contract Notes
- `xcresulttool export attachments` is the stable export path on current Xcode; the older directory export flow is no longer sufficient.
- `visual-eval.ts` still requires `ANTHROPIC_API_KEY`; without it, the pipeline stops after manifest generation.

## UI Decisions
- Canonical idle captures now launch deterministic sandbox stories and capture the `idlescreen` element directly, avoiding full-screen sandbox chrome in exported PNGs.

## Platform-Specific Notes
- `LaneShadowSandbox` can be selected via `-LaneShadowSandbox` and `-SandboxStoryId`, which is enough for deterministic design-review captures without modifying production idle behavior.
- Attachment names exported from XCTest may include Xcode-added suffixes like `_0_<UUID>` that need normalization before manifest pairing.

## Files Created/Modified
- ios/LaneShadowUITests/Helpers/AppLauncher.swift — sandbox story launch support
- ios/LaneShadowUITests/DesignReview/DesignReviewHelpers.swift — element capture helper
- ios/LaneShadowUITests/DesignReview/DesignReviewCaptureTests.swift — canonical idle capture set
- scripts/design-review/run.ts — stale cleanup + CLI parsing
- scripts/design-review/build-manifest.ts — screen filtering
- scripts/design-review/export-from-xcresult.ts — xcresult discovery + attachment manifest parsing
- scripts/design-review/__tests__/build-manifest-screen-filter.test.ts — screen filter regression test
- scripts/design-review/__tests__/run-cleanup.test.ts — stale cleanup regression test
