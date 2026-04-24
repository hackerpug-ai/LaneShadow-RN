# kb-run Reviewer Prompt

Execution unit: `UC-ATM-05-ios`
Sprint: `sprint-02-atoms-foundation-primitives`
Role: `swift-reviewer`
Worktree: `.kb-run/worktrees/UC-ATM-05-ios`
Latest implementer commit: `1016597bc1d4a04d56e2a7b32c5a1f598707f064`

## Review Standard

The user explicitly relaxed testing standards for this sprint.

Interpretation for this review:

- Prioritize correctness, scope, and merge safety.
- Do not reject solely for non-exhaustive tests if the implementation is sound and targeted build/smoke evidence is present.
- Do not require additional polish-only coverage beyond the core task outcome.

## Task

Review `UC-ATM-05-ios` against:

- `.spec/prds/v2/tasks/sprint-02-atoms-foundation-primitives/UC-ATM-05-ios-surface-atoms-lscard-lspanel-lsglasspanel-ios-swiftui.md`

Important context:

- The task file's original XCTest selectors are invalid in this repo.
- Valid selectors confirmed by the kb-run helper:
  - `LaneShadowTests/LSCardTests`
  - `LaneShadowTests/LSPanelTests`
  - `LaneShadowTests/LSGlassPanelTests`
  - `LaneShadowTests/LSGlassPanelTypeSafetyTests`
- The live sandbox target compiles `ios/LaneShadow/Sandbox/LaneShadowStories.swift`; surface stories and aggregation now live there directly.
- The public theme API does not expose a direct `surface.glass` accessor, so the implementation resolves the fallback through `AccentColor.swift` while keeping literal `Color` usage out of the three atom files.

## Scope Under Review

Branch diff vs `main...HEAD` currently contains:

- `ios/LaneShadow/Sandbox/LaneShadowStories.swift`
- `ios/LaneShadow/Views/Atoms/AccentColor.swift`
- `ios/LaneShadow/Views/Atoms/LSCard.swift`
- `ios/LaneShadow/Views/Atoms/LSGlassPanel.swift`
- `ios/LaneShadow/Views/Atoms/LSPanel.swift`
- `ios/LaneShadowTests/Atoms/LSCardTests.swift`
- `ios/LaneShadowTests/Atoms/LSGlassPanelTests.swift`
- `ios/LaneShadowTests/Atoms/LSGlassPanelTypeSafetyTests.swift`
- `ios/LaneShadowTests/Atoms/LSPanelTests.swift`

Latest implementer commit itself changed the same files.

## What Changed

- Added `LSCard`, `LSPanel`, and `LSGlassPanel` surface atoms.
- Added `AccentColor` to enforce the type-safe accent API for glass callouts.
- Added 7 required surface stories directly in `LaneShadowStories.swift`.
- Added focused XCTest coverage for card, panel, glass variants, and accent type safety.

## Validation Evidence

- `source scripts/agent-worktree-env.sh && cd ios && xcodebuild test -scheme LaneShadow -destination 'id=20EC6FD5-4630-4DEF-83F9-1D36093F704E' -only-testing:LaneShadowTests/LSCardTests -only-testing:LaneShadowTests/LSPanelTests -only-testing:LaneShadowTests/LSGlassPanelTests -only-testing:LaneShadowTests/LSGlassPanelTypeSafetyTests` -> PASS (`Executed 7 tests, with 0 failures`)
- `source scripts/agent-worktree-env.sh && cd ios && xcodebuild -project LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -quiet build` -> PASS
- Story registration grep in `LaneShadowStories.swift` -> PASS
- No literal `Color` grep across `LSCard.swift`, `LSPanel.swift`, `LSGlassPanel.swift` -> PASS
- `source scripts/agent-worktree-env.sh && swiftformat --lint ios/LaneShadow/Views/Atoms/AccentColor.swift ios/LaneShadow/Views/Atoms/LSCard.swift ios/LaneShadow/Views/Atoms/LSPanel.swift ios/LaneShadow/Views/Atoms/LSGlassPanel.swift ios/LaneShadow/Sandbox/LaneShadowStories.swift ios/LaneShadowTests/Atoms/LSCardTests.swift ios/LaneShadowTests/Atoms/LSPanelTests.swift ios/LaneShadowTests/Atoms/LSGlassPanelTests.swift ios/LaneShadowTests/Atoms/LSGlassPanelTypeSafetyTests.swift` -> PASS
- Commit hook passed and produced `1016597b`

## Review Focus

1. Does the branch satisfy AC-1 through AC-9 with merge-safe implementations?
2. Is the `AccentColor` fallback approach acceptable given the current theme API shape?
3. Are the inline story additions in `LaneShadowStories.swift` consistent with the current sandbox architecture?
4. Are there any remaining merge blockers, regressions, or scope problems?

## Required JSON

Return JSON only:

```json
{
  "verdict": "APPROVED | NEEDS_FIXES",
  "confidence": "HIGH | MEDIUM | LOW",
  "tasks": [
    {
      "id": "UC-ATM-05-ios",
      "verdict": "APPROVED | NEEDS_FIXES",
      "requirements": [
        {
          "id": "AC-1",
          "satisfied": true,
          "evidence": "file/test output",
          "remediation": null
        }
      ]
    }
  ],
  "findings": [
    {
      "severity": "CRITICAL | HIGH | MEDIUM | LOW",
      "task_id": "UC-ATM-05-ios",
      "location": "file:line or symbol",
      "evidence": "specific code or behavior",
      "fix": "actionable remediation"
    }
  ],
  "summary": "short verdict summary"
}
```

`APPROVED` is valid when the remaining issues are non-blocking under the relaxed sprint standard and there are no `CRITICAL` or `HIGH` findings.
