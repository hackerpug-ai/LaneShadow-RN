Review kb-run task ALIGN-02-android. Respond with JSON only matching the reviewer verdict schema used by kb-run review-contract.

Task file: /Users/justinrich/Projects/LaneShadow/.spec/prds/v2/tasks/sprint-03-design-system-alignment/ALIGN-02-android-refactor-kotlin-token-generation.md
Checkpoint commit: 3b0b462fca10f3287b1f996dba299cc57c972972
Worktree: /Users/justinrich/Projects/LaneShadow/.kb-run/worktrees/ALIGN-02-android

Requirements:
- AC-1: Light-mode color coverage [PRIMARY]
- AC-2: Dark-mode color coverage
- AC-3: map.style constants exposed
- AC-4: sizing.stroke scale exposed
- AC-5: Input-hash changes on edit
- AC-6: All theme unit tests pass
- TC-1: Tokens.kt contains a val for surface.scrim-soft mapped as Color with alpha ~0.18 float constructor
- TC-2: Tokens.kt contains val for border.glass resolved to dark-mode rgba(242,238,232,0.22)
- TC-3: Tokens.kt map.style.light equals exactly `mapbox://styles/laneshadow/clxwarm01`
- TC-4: LaneShadowTheme.sizing.stroke.md equals `2.dp`
- TC-5: ColorSetTest.bundledJson_decodesAllCoreGroups exits BUILD SUCCESSFUL
- TC-6: pnpm tokens:generate with missing mapbox.tokens.json throws clear error

Validation summary:
- `pnpm tokens:generate` passed and regenerated `Tokens.kt`.
- `cd android && ./gradlew :theme:test` passed with `BUILD SUCCESSFUL`.
- `cd android && ./gradlew :app:compileDebugKotlin` passed with `BUILD SUCCESSFUL`.
- The checkpoint commit also passed the repo pre-commit gates `tokens:validate` and `type-check:native`.
- `cd android && ./gradlew detekt` fails because task `detekt` does not exist in root project `LaneShadowAndroid`; treat that as a task-contract/harness issue, not an implementation regression unless you find code that should have added or depended on such a task.

Changed files:
- tokens/scripts/generate.ts
- tokens/platforms/kotlin/src/main/java/com/laneshadow/theme/generated/Tokens.kt
- tokens/platforms/kotlin/src/test/kotlin/com/laneshadow/theme/TokensDimensionsTest.kt
- tokens/platforms/kotlin/src/test/kotlin/com/laneshadow/theme/TokensMapStyleTest.kt

Review focus:
- Verify the checkpoint satisfies the full Android Copper token outcome, not just the named spot checks.
- Confirm the generator owns the `Tokens.kt` changes and the emitted Kotlin surface includes light/dark colors, `map.style`, and `sizing.stroke`.
- Confirm the new Kotlin tests actually enforce the required token surface and map style behavior.
- Treat the invalid `detekt` runtime command as harness/task-contract noise unless you find a concrete implementation defect behind it.
- Treat runner-owned `.kb-run` artifacts and untracked `server/convex/_generated` symlink noise as out of scope.
- APPROVED only if every requirement is satisfied and there are no concrete HIGH findings.
