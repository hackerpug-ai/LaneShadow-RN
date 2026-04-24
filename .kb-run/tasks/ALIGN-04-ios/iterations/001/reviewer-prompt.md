Review kb-run task ALIGN-04-ios. Respond with JSON only matching the reviewer verdict schema used by kb-run review-contract.

Task file: /Users/justinrich/Projects/LaneShadow/.spec/prds/v2/tasks/sprint-03-design-system-alignment/ALIGN-04-ios-update-ios-sandbox-stories.md
Checkpoint commit: none; review the current working tree in /Users/justinrich/Projects/LaneShadow/.kb-run/worktrees/ALIGN-04-ios
Worktree: /Users/justinrich/Projects/LaneShadow/.kb-run/worktrees/ALIGN-04-ios

Requirements:
- AC-1: All 17 V2 atoms have at least one registered story
- AC-2: ColorSwatchStory shows V2 semantic group labels
- AC-3: TypographyStory uses LaneShadowTheme instrument constants with no `.system(size:)` fallback
- AC-4: LSMapStories.all registered in LaneShadowStories.all
- AC-5: `xcodebuild test` + `swiftformat --lint` pass
- TC-1: Story registry covers the listed atom component names
- TC-2: LaneShadowStories.swift includes Signal, Route, Weather, Status labels
- TC-3: LaneShadowStories.swift contains zero `.system(size:` calls
- TC-4: LaneShadowStories.swift contains `LSMapStories.all`
- TC-5: `swiftformat --lint ios/LaneShadow/Sandbox/` exits 0
- TC-6: `xcodebuild build` exits `BUILD SUCCEEDED`
- TC-7: `xcodebuild test` exits `TEST SUCCEEDED`

Validation summary:
- Static host checks passed for the current worktree:
  - Registered atom story components found: `LSAvatar`, `LSBadge`, `LSBestBadge`, `LSButton`, `LSCard`, `LSDivider`, `LSGlassPanel`, `LSIcon`, `LSMap`, `LSPanel`, `LSPhaseDot`, `LSPill`, `LSScrim`, `LSSpinner`, `LSText`, `LSTextArea`, `LSTextField`
  - `grep -c '"Signal"\|"Route"\|"Weather"\|"Status"' ios/LaneShadow/Sandbox/LaneShadowStories.swift` => `4`
  - `grep -c '\.system(size' ios/LaneShadow/Sandbox/LaneShadowStories.swift` => `0`
  - `grep -n 'LSMapStories.all' ios/LaneShadow/Sandbox/LaneShadowStories.swift` => `62:        + LSMapStories.all`
- `swiftformat --lint ios/LaneShadow/Sandbox/` passed.
- `cd ios && xcodebuild build -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'` passed with `** BUILD SUCCEEDED **`.
- `cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'` failed with exit 65, but the observed failures are legacy source-contract assertions in `ios/LaneShadowTests/LaneShadowTests.swift` expecting `Theme*` atoms and placeholder `AtomsStories.swift` content:
  - `test_ui006_ac2_atomSourcesUseThemeTokensWithoutHardcodedPrimitives`
  - `test_ui006_ac3_registersDeterministicAtomsStoriesWithRnReferenceSummaries`
  - `test_ui006_ac4_storyCoverageIncludesAccessibilitySafeAreaAndStateParityHooks`
  - `test_ui008_ac1_formControlAtomFilesExistWithExpectedTypes`
  - `test_ui008_ac2_formControlAtomsUseThemeTokensWithoutUIKitFallbacks`
  - `test_ui008_ac3_registersDeterministicFormControlStoriesWithRnReferenceSummaries`
  - `test_ui008_ac4_formControlStoriesIncludeAccessibilityAndStateParityHooks`
- Those tests assert legacy `ThemeText`, `ThemeButton`, `ThemeInput`, and hard-coded `AtomsStories.swift` story ids like `atoms/theme-text/default`, which do not match the Sprint 03 LS* story contract under review here.

Changed files in current worktree:
- ios/LaneShadow/Sandbox/LaneShadowStories.swift
- ios/LaneShadow/Sandbox/Stories/AtomsStories.swift
- tokens/scripts/generate.ts
- tokens/platforms/swift/Sources/LaneShadowTheme/Generated/Tokens.swift

Out-of-scope-but-intentional change to evaluate:
- `tokens/scripts/generate.ts` and generated `Tokens.swift` were updated to make `LaneShadowTheme.typography.instrument*` publicly accessible so `TypographyStory` can satisfy AC-3 from the app target. Please judge whether this is the minimal acceptable prerequisite fix or an unacceptable scope violation.

Out-of-scope noise to ignore:
- Main worktree has unrelated dirty files and kb-run state changes outside this task.
- `ALIGN-03-android` is owned by another agent and must not affect this review.

Review focus:
- Judge the task against the full current worktree state, not only the last-line diff.
- Determine whether AC-1 through AC-4 are satisfied in the current worktree.
- Determine whether the full-suite `xcodebuild test` failure is a task-scoped regression or an unrelated baseline blocker.
- APPROVED is valid only if every requirement is satisfied or if TC-7/AC-5 is blocked solely by unrelated baseline failures outside the task scope and you call that out explicitly.
