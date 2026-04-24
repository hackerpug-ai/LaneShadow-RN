# kb-run Reviewer Prompt

Execution unit: `UC-ATM-02-ios`
Sprint: `sprint-02-atoms-foundation-primitives`
Role: `swift-reviewer`
Worktree: `.kb-run/worktrees/UC-ATM-02-ios`
Latest implementer commit: `fb918572b0a267b42424aefaeaf904d8df88e09d`

## Review Standard

The user explicitly relaxed testing standards for this sprint.

Interpretation for this review:

- Prioritize correctness, scope, and merge safety.
- Do not reject solely for non-exhaustive tests if the implementation is sound and targeted build/smoke evidence is present.
- Do not require additional polish-only coverage beyond the core task outcome.

## Task

Review `UC-ATM-02-ios` against:

- `.spec/prds/v2/tasks/sprint-02-atoms-foundation-primitives/UC-ATM-02-ios-button-atom-all-variants-states-ios-swiftui.md`

Important context:

- The task file's original XCTest selector is invalid in this repo: `LaneShadowTests/Atoms/LSButtonTests`
- Valid selector confirmed by the kb-run helper: `LaneShadowTests/LSButtonTests`
- Previous review iteration `006` rejected for:
  - disabled opacity not token-driven
  - incomplete hover/focus state matrix
  - overly broad public `LSIcon` color override

## Scope Under Review

Branch diff vs `main...HEAD` currently contains:

- `ios/LaneShadow.xcodeproj/project.pbxproj`
- `ios/LaneShadow/Sandbox/LaneShadowStories.swift`
- `ios/LaneShadow/Sandbox/Stories/LSButtonStories.swift`
- `ios/LaneShadow/Views/Atoms/LSButton.swift`
- `ios/LaneShadow/Views/Atoms/LSButtonStyle.swift`
- `ios/LaneShadow/Views/Atoms/LSIcon.swift`
- `ios/LaneShadowTests/Atoms/LSButtonTests.swift`
- `ios/project.yml`

Latest implementer commit itself changed:

- `ios/LaneShadow/Sandbox/Stories/LSButtonStories.swift`
- `ios/LaneShadow/Views/Atoms/LSButton.swift`
- `ios/LaneShadow/Views/Atoms/LSButtonStyle.swift`
- `ios/LaneShadow/Views/Atoms/LSIcon.swift`
- `ios/LaneShadowTests/Atoms/LSButtonTests.swift`

The pre-existing `project.yml`, `project.pbxproj`, and `LaneShadowStories.swift` branch changes were previously accepted as necessary XcodeGen/registration support for this task. Re-evaluate them only if they are still merge-risky or inconsistent with the current branch state.

## What Changed In Iteration 007

- `LSButton` now tracks hover with `.onHover` and passes `isHovered` into `LSButtonStyle`.
- `LSButtonStyle` now models `hover` and `focus` explicitly.
- Focus uses a dedicated 3pt outer ring (`focusRing`, `focusRingWidth`) instead of replacing the base border.
- Disabled tokens now carry `theme.opacity.disabled` for every variant.
- `LSIcon` no longer exposes the resolved color override publicly; the override path is internal-only.
- `LSButtonStories` now includes a visible state-matrix section to exercise default/hover/pressed/focus/disabled states in the sandbox.
- `LSButtonTests` now include targeted assertions for hover tokens, disabled opacity, focus ring behavior, and the narrowed `LSIcon` API.

## Validation Evidence

- `swiftformat --lint ios/LaneShadow/Views/Atoms/LSButton.swift ios/LaneShadow/Views/Atoms/LSButtonStyle.swift ios/LaneShadow/Views/Atoms/LSIcon.swift ios/LaneShadow/Sandbox/Stories/LSButtonStories.swift ios/LaneShadowTests/Atoms/LSButtonTests.swift` -> PASS
- `cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSButtonTests` -> PASS
- `cd ios && xcodebuild -project LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -quiet ONLY_ACTIVE_ARCH=YES COMPILER_INDEX_STORE_ENABLE=NO SWIFT_COMPILATION_MODE=incremental build` -> PASS
- Story registration grep -> PASS
- `LSButton.swift` no literal color grep -> PASS
- `LSButton.swift` no `Image(systemName:)` grep -> PASS
- Commit hook passed and produced `fb918572`

## Review Focus

1. Are the previously rejected issues actually fixed?
2. Does the branch now satisfy the core task outcome well enough to merge under the relaxed sprint standard?
3. Are there any remaining merge blockers, regressions, or scope problems?
4. If there are only residual risks or non-blocking gaps, surface them as low/medium findings instead of forcing another remediation cycle.

## Required JSON

Return JSON only:

```json
{
  "verdict": "APPROVED | NEEDS_FIXES",
  "confidence": "HIGH | MEDIUM | LOW",
  "tasks": [
    {
      "id": "UC-ATM-02-ios",
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
      "task_id": "UC-ATM-02-ios",
      "location": "file:line or symbol",
      "evidence": "specific code or behavior",
      "fix": "actionable remediation"
    }
  ],
  "summary": "short verdict summary"
}
```

`APPROVED` is valid when the remaining issues are non-blocking under the relaxed sprint standard and there are no `CRITICAL` or `HIGH` findings.
