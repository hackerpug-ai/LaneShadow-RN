Review kb-run task ALIGN-04-ios and respond with JSON only that matches this schema exactly:

`/Users/justinrich/Projects/LaneShadow/.kb-run/reviewer-verdict.schema.json`

Do not search for another schema. Do not inspect or mutate any `.kb-run/tasks/**` path other than that shared schema file. Review the current worktree only.

Task file: `/Users/justinrich/Projects/LaneShadow/.spec/prds/v2/tasks/sprint-03-design-system-alignment/ALIGN-04-ios-update-ios-sandbox-stories.md`
Worktree: `/Users/justinrich/Projects/LaneShadow/.kb-run/worktrees/ALIGN-04-ios`
Checkpoint commit: none

Task requirements to evaluate:
- AC-1: All 17 V2 atoms have at least one registered story
- AC-2: ColorSwatchStory shows V2 semantic group labels
- AC-3: TypographyStory uses `LaneShadowTheme.typography.instrumentLg/.instrumentMd/.instrumentSm` and no `.system(size:)`
- AC-4: `LSMapStories.all` is registered in `LaneShadowStories.all`
- AC-5: `swiftformat --lint ios/LaneShadow/Sandbox/` and full `xcodebuild test` pass
- TC-1: listed LS* atom components are registered
- TC-2: `Signal`, `Route`, `Weather`, `Status` labels exist
- TC-3: zero `.system(size:` calls remain in `LaneShadowStories.swift`
- TC-4: `LSMapStories.all` appears in `LaneShadowStories.swift`
- TC-5: sandbox swiftformat lint exits 0
- TC-6: iOS build exits `BUILD SUCCEEDED`
- TC-7: full iOS test suite exits `TEST SUCCEEDED`

Host evidence already observed:
- `swiftformat --lint ios/LaneShadow/Sandbox/` passed
- `xcodebuild build -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'` passed with `** BUILD SUCCEEDED **`
- Static checks passed:
  - registered atom story components found: `LSAvatar`, `LSBadge`, `LSBestBadge`, `LSButton`, `LSCard`, `LSDivider`, `LSGlassPanel`, `LSIcon`, `LSMap`, `LSPanel`, `LSPhaseDot`, `LSPill`, `LSScrim`, `LSSpinner`, `LSText`, `LSTextArea`, `LSTextField`
  - `grep -c '"Signal"\|"Route"\|"Weather"\|"Status"' ios/LaneShadow/Sandbox/LaneShadowStories.swift` => `4`
  - `grep -c '\.system(size' ios/LaneShadow/Sandbox/LaneShadowStories.swift` => `0`
  - `grep -n 'LSMapStories.all' ios/LaneShadow/Sandbox/LaneShadowStories.swift` => `62:        + LSMapStories.all`
- Full `xcodebuild test` failed with exit 65 because `ios/LaneShadowTests/LaneShadowTests.swift` still asserts legacy `Theme*` atoms and placeholder `AtomsStories.swift` content such as:
  - `ThemeText.swift`, `ThemeButton.swift`, `ThemeInput.swift`
  - story ids like `atoms/theme-text/default` and `atoms/theme-button/default`
  - accessibility hooks inside the placeholder `AtomsStories.swift`

Changed files in the worktree:
- `ios/LaneShadow/Sandbox/LaneShadowStories.swift`
- `ios/LaneShadow/Sandbox/Stories/AtomsStories.swift`
- `tokens/scripts/generate.ts`
- `tokens/platforms/swift/Sources/LaneShadowTheme/Generated/Tokens.swift`

Important review question:
- Decide whether the full-suite test failure is a task-scoped regression or an unrelated baseline blocker outside ALIGN-04-ios scope.
- Decide whether the typography visibility change in `tokens/scripts/generate.ts` and generated `Tokens.swift` is an acceptable minimal prerequisite for AC-3 or a scope violation that should block approval.

Return JSON only. No markdown fences. No prose outside the JSON object.
