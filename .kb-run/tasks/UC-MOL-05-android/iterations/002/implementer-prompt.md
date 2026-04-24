# kb-run Implementer Prompt

Execution unit: `UC-MOL-05-android`
Sprint: `sprint-04-molecules-composite-patterns`
Worktree: `.kb-run/worktrees/UC-MOL-05-android`
Role: `kotlin-implementer`
Start commit: `ae98746fcc6cef1235b04723af7520a09987b7ed`

## Non-Negotiable kb-run Rules

- You are a direct `codex exec` child process, not an in-harness subagent. Do not spawn or delegate to any subagent.
- Work only inside `/Users/justinrich/Projects/LaneShadow/.kb-run/worktrees/UC-MOL-05-android`.
- Do not edit parent/main worktree files or any `.kb-run*` orchestrator state, notebooks, or checksums.
- Create a real git commit before finishing. Commit normally so hooks run. Never use `--no-verify`, `-n`, or hook-disabling env vars.
- Finish with a clean worktree.
- Respect `RULES.md` and keep scope limited to this task's Android molecule files and tests.

## Objective

Fix the reviewer rejection from iteration `001` without reopening unrelated molecule stories or shared Android atom work.

## Current Reviewer Verdict

Reviewer response: `/Users/justinrich/Projects/LaneShadow/.kb-run/tasks/UC-MOL-05-android/iterations/001/reviewer-response.json`

Unresolved requirements:

1. `AC-4`: `LSWeatherBadge` renders its label with `ContentColor.Primary` instead of the condition-specific weather foreground token.
2. `LSWeatherBadge` test coverage is too weak to catch that composable-level foreground regression.

## Required Fix

1. Update `android/app/src/main/java/com/laneshadow/ui/molecules/LSWeatherBadge.kt` so the badge label uses the same weather foreground token family already resolved for the icon and border.
2. Preserve atom composition: the label must still flow through `LSText`. Raw `Text(...)` is not an acceptable fix.
3. If the current atom API makes that impossible, you are explicitly authorized to make the smallest scoped atom change needed in:
   - `android/app/src/main/java/com/laneshadow/ui/atoms/LSText.kt`
   - `android/app/src/test/java/com/laneshadow/ui/atoms/LSTextTest.kt`
   so `LSWeatherBadge` can keep using `LSText` while rendering the condition-specific weather foreground.
4. Strengthen `android/app/src/test/java/com/laneshadow/ui/molecules/LSWeatherBadgeTest.kt` or add the smallest additional scoped test needed so the wrong generic label color path would fail immediately next time.
5. Keep the rest of the pill-family molecules and story IDs stable unless a direct dependency of the weather-badge fix forces a change.
6. Run the normal Android task-scoped validation. If connected-device tests are still unavailable, report that clearly as an environment limitation rather than pretending they ran.

## Concrete References

- Reviewer findings:
  - `/Users/justinrich/Projects/LaneShadow/.kb-run/tasks/UC-MOL-05-android/iterations/001/reviewer-response.json`
- Current incorrect label color path:
  - `android/app/src/main/java/com/laneshadow/ui/molecules/LSWeatherBadge.kt:39-42`
- Weather token resolver:
  - `android/app/src/main/java/com/laneshadow/ui/molecules/PillSemanticsTypes.kt`
- Task source of truth:
  - `.spec/prds/v2/tasks/sprint-04-molecules-composite-patterns/UC-MOL-05-android-pill-semantics-family.md`
- Design reference:
  - `.spec/design/system/molecules/weather-badge/README.md`

## Validation Targets

- `cd android && ./gradlew detekt`
- `cd android && ./gradlew :app:compileDebugKotlin`
- `cd android && ./gradlew test`
- `cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.molecules.LSWeatherBadgeTest.rain_condition_resolves_correct_tint_and_icon'`
- `cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.molecules.LSWeatherBadgeTest.all_six_conditions_resolve_distinct_tints'`
- `grep -n 'Color(0xFF' android/app/src/main/java/com/laneshadow/ui/molecules/LSTagPill.kt android/app/src/main/java/com/laneshadow/ui/molecules/LSFilterChip.kt android/app/src/main/java/com/laneshadow/ui/molecules/LSSuggestionChip.kt android/app/src/main/java/com/laneshadow/ui/molecules/LSWeatherBadge.kt | wc -l | grep -x '0'`

## Completion Contract

- Create a real commit with hooks enabled.
- Final response must include:
  - commit SHA
  - files changed
  - validation commands run with pass/fail
  - how the weather label now resolves from the condition-specific foreground token
  - what test coverage changed to catch the previous regression
