Implementer retry for `UC-ATM-12-android`. The previous pass was interrupted because it stayed in read-only exploration. This retry is strict.

Your first action must be to edit `android/app/src/test/java/com/laneshadow/ui/atoms/LSMapTest.kt` and replace the shallow source-presence assertions with targeted failing tests for these behaviors:
- style token selection / in-place theme reload
- polyline token colors and stroke width
- annotation token colors and spec sizes
- camera-fit token padding
- missing-token fallback
- network-unavailable fallback
- nested-scroll isolation

After that, edit `android/app/src/main/java/com/laneshadow/ui/atoms/LSMap.kt` and any other in-scope LSMap files needed to make those tests pass.

Do not read anything except these files unless a compile error forces it:
- `android/app/src/test/java/com/laneshadow/ui/atoms/LSMapTest.kt`
- `android/app/src/main/java/com/laneshadow/ui/atoms/LSMap.kt`
- `android/app/src/main/java/com/laneshadow/ui/atoms/LSMapTypes.kt`
- `android/app/src/main/java/com/laneshadow/ui/atoms/LSGlassPanel.kt`
- `android/app/src/debug/java/com/laneshadow/sandbox/stories/LSMapStories.kt`
- `tokens/platforms/kotlin/src/main/java/com/laneshadow/theme/generated/Tokens.kt`

Do not reread repo rules. Do not do repo-wide searches. Do not inspect unrelated files.

Validation required before finish:
- `cd android && ./gradlew :app:compileDebugKotlin`
- `cd android && ./gradlew :app:test --tests '*.LSMapTest'`

Write evidence files to:
- `/Users/justinrich/Projects/LaneShadow/.kb-run/tasks/UC-ATM-12-android/iterations/002/evidence.md`
- `/Users/justinrich/Projects/LaneShadow/.kb-run/tasks/UC-ATM-12-android/iterations/002/evidence-manifest.json`

Final response must satisfy `.kb-run/implementer-completion.schema.json` with `task_id = UC-ATM-12-android`.

If you cannot make an in-scope code edit within this retry, stop and return a blocked completion JSON explaining exactly why.
