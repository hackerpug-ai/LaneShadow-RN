# ALIGN-03-android Implementer Packet

You are executing `ALIGN-03-android` in a fresh kb-run restart.

Task file:
- `.spec/prds/v2/tasks/sprint-03-design-system-alignment/ALIGN-03-android-refactor-android-atoms.md`

Required reading before edits:
- `.spec/prds/v2/tasks/sprint-03-design-system-alignment/drift-report.md`
- `android/app/src/main/java/com/laneshadow/ui/atoms/LSButton.kt`
- `android/app/src/main/java/com/laneshadow/ui/atoms/LSText.kt`
- `android/app/src/main/java/com/laneshadow/ui/atoms/LSGlassPanel.kt`
- `android/app/src/main/java/com/laneshadow/ui/atoms/LSPhaseDot.kt`
- `tokens/platforms/kotlin/src/main/java/com/laneshadow/theme/generated/Tokens.kt`

Critical constraints:
- Stay inside the task scope for Android atoms and their tests.
- Do not edit sandbox story files or generated token outputs.
- Follow RED -> GREEN -> REFACTOR and record concrete evidence.
- Do not commit; the orchestrator owns checkpoint commits.

Runtime commands:
- `cd android && ./gradlew detekt`
- `cd android && ./gradlew :app:compileDebugKotlin`
- `cd android && ./gradlew :app:test`

Minimum requirement coverage:
- AC-1 through AC-7
- TC-1 through TC-7

Completion packet requirements:
- Summarize changed files.
- List RED tests run and failing evidence.
- List GREEN validation commands and results.
- Confirm no out-of-scope files were changed.
