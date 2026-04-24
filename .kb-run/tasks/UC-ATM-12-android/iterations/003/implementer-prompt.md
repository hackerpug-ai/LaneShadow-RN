Continuation retry for `UC-ATM-12-android`.

Start from the existing worktree state. `android/app/src/test/java/com/laneshadow/ui/atoms/LSMapTest.kt` has already been rewritten into behavior-focused tests. Do not revert or replace that rewrite unless a compile failure forces a small correction.

Your first read must be:
- `android/app/src/test/java/com/laneshadow/ui/atoms/LSMapTest.kt`

Then implement only the minimum required production changes in:
- `android/app/src/main/java/com/laneshadow/ui/atoms/LSMap.kt`
- `android/app/src/main/java/com/laneshadow/ui/atoms/LSMapTypes.kt`

Only read these additional files if needed for exact token names or fallback composition:
- `android/app/src/main/java/com/laneshadow/ui/atoms/LSGlassPanel.kt`
- `android/app/src/debug/java/com/laneshadow/sandbox/stories/LSMapStories.kt`
- `tokens/platforms/kotlin/src/main/java/com/laneshadow/theme/generated/Tokens.kt`

Do not reread repo rules. Do not do repo-wide searches. Do not inspect unrelated files.

Implementation target:
- make the rewritten `LSMapTest.kt` pass with in-scope helpers and LSMap fallback/runtime wiring
- keep Mapbox SDK types out of the public `LSMap` signature
- include `rememberNestedScrollInteropConnection` / `nestedScroll` in `LSMap.kt`
- keep style URLs sourced from generated tokens only
- do not add raw `Color(0x` literals to LSMap implementation

Validation:
- source `scripts/agent-worktree-env.sh`
- the worktree Gradle wrapper cache is pre-seeded; use the isolated Gradle home
- run `cd android && ./gradlew :app:compileDebugKotlin`
- run `cd android && ./gradlew :app:test --tests '*.LSMapTest'`

Evidence required before finish:
- `/Users/justinrich/Projects/LaneShadow/.kb-run/tasks/UC-ATM-12-android/iterations/003/evidence.md`
- `/Users/justinrich/Projects/LaneShadow/.kb-run/tasks/UC-ATM-12-android/iterations/003/evidence-manifest.json`

Final response must satisfy `.kb-run/implementer-completion.schema.json` with `task_id = UC-ATM-12-android`.

If validation still fails because of infrastructure, return a blocked completion JSON with the exact command, failure, and whether code edits were otherwise complete.
