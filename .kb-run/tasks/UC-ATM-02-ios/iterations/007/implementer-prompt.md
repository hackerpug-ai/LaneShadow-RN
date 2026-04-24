# kb-run Implementer Prompt

Execution unit: `UC-ATM-02-ios`
Sprint: `sprint-02-atoms-foundation-primitives`
Worktree: `.kb-run/worktrees/UC-ATM-02-ios`
Role: `swift-implementer`
Start commit: `4f07ed7a79b4c45c64b18b8f05610e1907eba474`

## Objective

Fix the remaining reviewer rejection from iteration `006` without reopening broader button work.

## Current Reviewer Verdict

Reviewer response: `.kb-run/tasks/UC-ATM-02-ios/iterations/006/reviewer-response.json`

Unresolved requirements:

1. `AC-3`: disabled state still does not consume the required disabled opacity token.
2. `STATE-MATRIX`: hover and focus remain incomplete; the task outcome explicitly requires `default / hover / pressed / disabled / focus`.
3. Scope hygiene: `LSIcon` gained a public `resolvedColorOverride` that is broader than necessary for the button remediation.

## Selector Correction

The task markdown's documented selector is invalid in this repo:

- Invalid: `-only-testing:LaneShadowTests/Atoms/LSButtonTests`
- Validated replacement: `-only-testing:LaneShadowTests/LSButtonTests`

Preflight evidence from the kb-run selector helper:

- `LaneShadowTests/Atoms/LSButtonTests` -> invalid path-shaped selector
- `LaneShadowTests/LSButtonTests` -> valid

Use the valid selector for your test runs and mention the correction in your response.

## Required Fix

1. Make disabled buttons consume the disabled opacity token in addition to disabled colors.
2. Complete the button state matrix:
   - add explicit hover handling
   - wire hover into the style in a platform-appropriate way for Catalyst/macOS pointer environments
   - replace the current generic focus treatment with the specified 3px variant-colored focus ring
3. Keep the icon fix intact: button icons must still render through `LSIcon`.
4. Narrow the `LSIcon` override so arbitrary callers cannot bypass the semantic icon color contract.
5. Strengthen tests so they would fail if:
   - disabled opacity stopped using the token path
   - hover state regressed
   - focus ring regressed back to the generic ring/default border path

## Concrete References

- Task outcome requires five states: `.spec/prds/v2/05-uc-atm.md:57`
- Disabled opacity is explicitly required: `.spec/prds/v2/05-uc-atm.md:63`
- Concept doc shows per-variant hover/focus behavior and the 3px focus ring:
  - `.spec/prds/v2/concepts/uc-atm-02-button.html:197`
  - `.spec/prds/v2/concepts/uc-atm-02-button.html:200`
  - `.spec/prds/v2/concepts/uc-atm-02-button.html:204`
  - `.spec/prds/v2/concepts/uc-atm-02-button.html:207`
  - `.spec/prds/v2/concepts/uc-atm-02-button.html:211`
  - `.spec/prds/v2/concepts/uc-atm-02-button.html:214`
  - `.spec/prds/v2/concepts/uc-atm-02-button.html:218`
  - `.spec/prds/v2/concepts/uc-atm-02-button.html:221`
  - `.spec/prds/v2/concepts/uc-atm-02-button.html:225`
  - `.spec/prds/v2/concepts/uc-atm-02-button.html:228`
  - `.spec/prds/v2/concepts/uc-atm-02-button.html:232`
  - `.spec/prds/v2/concepts/uc-atm-02-button.html:235`
  - `.spec/prds/v2/concepts/uc-atm-02-button.html:740`
- Theme layer already exposes relevant state tokens:
  - `tokens/platforms/swift/Sources/LaneShadowTheme/Theme.swift`
  - `tokens/platforms/swift/Sources/LaneShadowTheme/ThemeSchema.swift`

## Suggested Direction

- Prefer modeling hover as an explicit `LSButtonInteractionState.hover`.
- Use token-backed `ColorSet.hover` / `ColorSet.focus` where available instead of inventing literals.
- If SwiftUI does not expose hover in pure iOS contexts, keep the API/task behavior compile-safe and exercise hover via deterministic style/token tests plus a story/demo path that can run on Catalyst.
- For focus, implement the required 3px ring as a variant-colored treatment rather than a single generic border color.
- For `LSIcon`, prefer an internal/fileprivate helper or non-public initializer path so only the button code can pass a resolved color override.

## Validation Targets

- `swiftformat --lint ios/LaneShadow/Views/Atoms/LSButton.swift ios/LaneShadow/Views/Atoms/LSButtonStyle.swift ios/LaneShadow/Views/Atoms/LSIcon.swift ios/LaneShadow/Sandbox/Stories/LSButtonStories.swift ios/LaneShadowTests/Atoms/LSButtonTests.swift`
- `cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSButtonTests`
- `cd ios && xcodebuild -project LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -quiet ONLY_ACTIVE_ARCH=YES COMPILER_INDEX_STORE_ENABLE=NO SWIFT_COMPILATION_MODE=incremental build`
- `for v in primary secondary ghost accept destructive outline; do grep -q "atoms.button.$v" ios/LaneShadow/Sandbox/Stories/LSButtonStories.swift || exit 1; done && grep -q 'LSButtonStories' ios/LaneShadow/Sandbox/LaneShadowStories.swift`
- `! grep -REn 'Color\\(|Color\\.(red|blue|green|black|white|gray|orange|yellow|purple|pink)|#[0-9a-fA-F]{6}' ios/LaneShadow/Views/Atoms/LSButton.swift`
- `! grep -REn 'Image\\(systemName:' ios/LaneShadow/Views/Atoms/LSButton.swift`

## Completion Contract

- Create a real commit with hooks enabled.
- Final response must include:
  - commit SHA
  - files changed
  - validation commands run with pass/fail
  - how hover/focus are now represented
  - how disabled opacity is token-driven
  - how the `LSIcon` override was narrowed
