## UC-ATM-05-ios evidence

### RED phase

Command:

```sh
source scripts/agent-worktree-env.sh && cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSCardTests -only-testing:LaneShadowTests/LSPanelTests -only-testing:LaneShadowTests/LSGlassPanelTests -only-testing:LaneShadowTests/LSGlassPanelTypeSafetyTests
```

Observed failing compile errors before implementation:

- `Cannot find 'LSCard' in scope`
- `Cannot find 'LSPanel' in scope`
- `Cannot find 'LSGlassPanel' in scope`
- `Cannot find type 'AccentColor' in scope`

### GREEN / verification

Focused atom tests passed after implementation:

```sh
source scripts/agent-worktree-env.sh && cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSCardTests -only-testing:LaneShadowTests/LSPanelTests -only-testing:LaneShadowTests/LSGlassPanelTests -only-testing:LaneShadowTests/LSGlassPanelTypeSafetyTests
```

Result observed in successful run:

- `Executed 7 tests, with 0 failures`
- `** TEST SUCCEEDED **`

Build passed:

```sh
source scripts/agent-worktree-env.sh && cd ios && xcodebuild -project LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -quiet build
```

Story and color-boundary gates passed:

```sh
for s in atoms.card.default atoms.card.with-content atoms.panel.default atoms.panel.nested atoms.glasspanel.chrome atoms.glasspanel.callout-signal atoms.glasspanel.callout-warning; do grep -q "$s" ios/LaneShadow/Sandbox/LaneShadowStories.swift || exit 1; done && grep -q 'LSSurfaceStories' ios/LaneShadow/Sandbox/LaneShadowStories.swift && ! grep -REn 'Color\(|Color\.(red|blue|green|black|white|gray|orange|yellow|purple|pink)|#[0-9a-fA-F]{6}' ios/LaneShadow/Views/Atoms/LSCard.swift ios/LaneShadow/Views/Atoms/LSPanel.swift ios/LaneShadow/Views/Atoms/LSGlassPanel.swift
```

Task-scope files are SwiftFormat-clean:

```sh
source scripts/agent-worktree-env.sh && swiftformat --lint ios/LaneShadow/Views/Atoms/AccentColor.swift ios/LaneShadow/Views/Atoms/LSCard.swift ios/LaneShadow/Views/Atoms/LSPanel.swift ios/LaneShadow/Views/Atoms/LSGlassPanel.swift ios/LaneShadow/Sandbox/LaneShadowStories.swift ios/LaneShadowTests/Atoms/LSCardTests.swift ios/LaneShadowTests/Atoms/LSPanelTests.swift ios/LaneShadowTests/Atoms/LSGlassPanelTests.swift ios/LaneShadowTests/Atoms/LSGlassPanelTypeSafetyTests.swift
```

### Notes

- `swiftformat --lint ios/LaneShadow/` still fails on pre-existing unrelated files under `ios/LaneShadow/Views/Molecules/*`; the task files were not the source of the remaining lint errors.
- The current compiled sandbox aggregator is `ios/LaneShadow/Sandbox/LaneShadowStories.swift`, so the surface story definitions and registration live there for this branch.
- The current public theme package API does not expose a public `surface.glass` token accessor. The atom files still avoid literal `Color` references as required; the fallback glass token resolution lives outside those atom files in `AccentColor.swift`.
- One intermediate retry of the focused XCTest command failed with simulator launch error `Application failed preflight checks` / simulator busy. A subsequent rerun completed successfully and is the latest verification result.
- Swift-reviewer was dispatched but did not return findings before shutdown.
