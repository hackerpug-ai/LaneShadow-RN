# kb-run Implementer Prompt

Execution unit: `UC-MOL-05-ios`
Sprint: `sprint-04-molecules-composite-patterns`
Worktree: `.kb-run/worktrees/UC-MOL-05-ios`
Role: `swift-implementer`
Start commit: `3237dab41889e8992485e6f4109a01d23f7365e4`

## Non-Negotiable kb-run Rules

- You are a direct `codex exec` child process, not an in-harness subagent. Do not spawn or delegate to any subagent.
- Work only inside `/Users/justinrich/Projects/LaneShadow/.kb-run/worktrees/UC-MOL-05-ios`.
- Do not edit parent/main worktree files or any `.kb-run*` orchestrator state, notebooks, or checksums.
- Create a real git commit before finishing. Commit normally so hooks run. Never use `--no-verify`, `-n`, or hook-disabling env vars.
- Finish with a clean worktree.
- Respect `RULES.md`. Do not hand-edit `.pbxproj`; if project membership changes are required, use the existing generated-project flow only.

## Objective

Fix the reviewer rejection from iteration `001` without reopening unrelated story aggregation or atom API work.

## Current Reviewer Verdict

Reviewer response: `/Users/justinrich/Projects/LaneShadow/.kb-run/tasks/UC-MOL-05-ios/iterations/001/reviewer-response.json`

Unresolved requirements:

1. `AC-1`: `LSTagPill` styles the inner content instead of the `LSPill` surface.
2. `AC-2`: `LSFilterChip` styles the inner content instead of the `LSPill` surface.
3. `AC-4`: `LSSuggestionChip` styles the inner content instead of the `LSPill` surface.
4. `AC-5`: `LSWeatherBadge` styles the inner content instead of the `LSPill` surface.
5. Test coverage is too weak to catch a regression where surface styling drops below `LSPill`.

## Required Fix

1. Move surface fill/border treatment from the inner `HStack`/`LSText` subtree to the outer `LSPill` view in:
   - `ios/LaneShadow/Views/Molecules/LSTagPill.swift`
   - `ios/LaneShadow/Views/Molecules/LSFilterChip.swift`
   - `ios/LaneShadow/Views/Molecules/LSSuggestionChip.swift`
   - `ios/LaneShadow/Views/Molecules/LSWeatherBadge.swift`
2. Remove any compensating inner horizontal padding that was only present to fake the pill surface bounds once the styling moves to the container.
3. Preserve atom composition:
   - content still flows through `LSIcon` and `LSText`
   - no `Capsule()`, raw `Text`, or literal colors
4. Strengthen the molecule tests so they fail if a future edit reattaches surface styling below `LSPill`.
5. Keep existing story IDs, project generation, and sandbox registration intact unless a change is strictly required by the fixes above.

## Concrete References

- Reviewer findings:
  - `/Users/justinrich/Projects/LaneShadow/.kb-run/tasks/UC-MOL-05-ios/iterations/001/reviewer-response.json`
- Current incorrect surface placement:
  - `ios/LaneShadow/Views/Molecules/LSTagPill.swift:42-58`
  - `ios/LaneShadow/Views/Molecules/LSFilterChip.swift:55-65`
  - `ios/LaneShadow/Views/Molecules/LSSuggestionChip.swift:44-54`
  - `ios/LaneShadow/Views/Molecules/LSWeatherBadge.swift:107-121`
- Pill atom contract:
  - `ios/LaneShadow/Views/Atoms/LSPill.swift`
- Task source of truth:
  - `.spec/prds/v2/tasks/sprint-04-molecules-composite-patterns/UC-MOL-05-ios-pill-semantics-family.md`
- Design references:
  - `.spec/design/system/molecules/tag-pill/README.md`
  - `.spec/design/system/molecules/filter-chip/README.md`
  - `.spec/design/system/molecules/suggestion-chip/README.md`
  - `.spec/design/system/molecules/weather-badge/README.md`

## Validation Targets

- `swiftformat --lint ios/LaneShadow/Views/Molecules/LSTagPill.swift ios/LaneShadow/Views/Molecules/LSFilterChip.swift ios/LaneShadow/Views/Molecules/LSSuggestionChip.swift ios/LaneShadow/Views/Molecules/LSWeatherBadge.swift ios/LaneShadowTests/Molecules/LSTagPillTests.swift ios/LaneShadowTests/Molecules/LSFilterChipTests.swift ios/LaneShadowTests/Molecules/LSSuggestionChipTests.swift ios/LaneShadowTests/Molecules/LSWeatherBadgeTests.swift`
- `cd ios && xcodebuild build -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'`
- `cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSTagPillTests -only-testing:LaneShadowTests/LSFilterChipTests -only-testing:LaneShadowTests/LSSuggestionChipTests -only-testing:LaneShadowTests/LSWeatherBadgeTests`
- `grep -n 'Capsule()\\|Color(red:\\|Color(hex:\\|Font.system' ios/LaneShadow/Views/Molecules/LSTagPill.swift ios/LaneShadow/Views/Molecules/LSFilterChip.swift ios/LaneShadow/Views/Molecules/LSSuggestionChip.swift ios/LaneShadow/Views/Molecules/LSWeatherBadge.swift | wc -l | xargs test 0 -eq`

## Completion Contract

- Create a real commit with hooks enabled.
- Final response must include:
  - commit SHA
  - files changed
  - validation commands run with pass/fail
  - how surface styling now attaches to `LSPill`
  - what test coverage changed to catch the previous regression
