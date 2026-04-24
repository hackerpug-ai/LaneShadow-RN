# kb-run Reviewer Prompt

Execution unit: `UC-ATM-02-ios`
Sprint: `sprint-02-atoms-foundation-primitives`
Role: `swift-reviewer`
Implementer commit: `70587687a67b0deda009ba567b040a9d6414b551`
Worktree: `.kb-run/worktrees/UC-ATM-02-ios`

## Task

Review `UC-ATM-02-ios` against:

- `.spec/prds/v2/tasks/sprint-02-atoms-foundation-primitives/UC-ATM-02-ios-button-atom-all-variants-states-ios-swiftui.md`

This is a remediation pass after a previous `NEEDS_FIXES` verdict.

## Scope Under Review

Diff vs `main` now contains only:

- `ios/LaneShadow.xcodeproj/project.pbxproj`
- `ios/LaneShadow/Sandbox/LaneShadowStories.swift`
- `ios/LaneShadow/Sandbox/Stories/LSButtonStories.swift`
- `ios/LaneShadow/Views/Atoms/LSButton.swift`
- `ios/LaneShadow/Views/Atoms/LSButtonStyle.swift`
- `ios/LaneShadowTests/Atoms/LSButtonTests.swift`
- `ios/project.yml`

Review especially for:

1. `AC-1` / `AC-4`: button label/icon color path is token-resolved end-to-end and does not depend on shared hard-coded text/icon color helpers.
2. `AC-2`: primary pressed state uses the correct pressed token mapping.
3. `AC-3`: disabled state uses explicit disabled token mappings rather than opacity-dimming a base state.
4. `AC-4`: outline padding matches the fixed spec padding.
5. `AC-5` through `AC-9`: stories/tests/grep gates still satisfy the task.
6. Scope: generated project changes are acceptable only if they are necessary to exclude legacy `Button.swift` and include `LSButtonStories.swift`.

## Validation Evidence

- `swiftformat --lint ios/LaneShadow/Views/Atoms/LSButton.swift ios/LaneShadow/Views/Atoms/LSButtonStyle.swift ios/LaneShadow/Sandbox/Stories/LSButtonStories.swift ios/LaneShadow/Sandbox/LaneShadowStories.swift ios/LaneShadowTests/Atoms/LSButtonTests.swift` -> pass
- `cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Atoms/LSButtonTests` -> pass but no-op selector, 0 tests
- `cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSButtonTests` -> pass, 7 tests
- `cd ios && xcodebuild -project LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -quiet ONLY_ACTIVE_ARCH=YES COMPILER_INDEX_STORE_ENABLE=NO SWIFT_COMPILATION_MODE=incremental build` -> pass
- Grep gates for story ids, no literal `Color(...)` in `LSButton.swift`, and no `Image(systemName:)` in `LSButton.swift` -> pass
- Full `swiftformat --lint ios/LaneShadow/` still fails due unrelated pre-existing molecule formatting issues outside this task scope

## Reviewer Contract

Inspect the actual diff and changed files in the worktree. Return JSON only in this shape:

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

`APPROVED` is valid only if every AC is covered, every requirement is satisfied, and there are no `CRITICAL` or `HIGH` findings.
