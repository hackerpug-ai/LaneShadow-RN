# kb-run Implementer Prompt

Execution unit: `UC-MOL-08-android`
Sprint: `sprint-04-molecules-composite-patterns`
Worktree: `.kb-run/worktrees/UC-MOL-08-android`
Role: `kotlin-implementer`
Start commit: `079b8e4c9a666a42434a18bb66fcde27c0b29855`

## Non-Negotiable kb-run Rules

- You are a direct `codex exec` child process, not an in-harness subagent. Do not spawn or delegate to any subagent.
- Work only inside `/Users/justinrich/Projects/LaneShadow/.kb-run/worktrees/UC-MOL-08-android`.
- Do not edit parent/main worktree files or any `.kb-run*` orchestrator state, notebooks, or checksums.
- Create a real git commit before finishing. Commit normally so hooks run. Never use `--no-verify`, `-n`, or hook-disabling env vars.
- Finish with a clean worktree.
- Respect `RULES.md` and keep scope limited to this task's Android molecule, story, and test files.

## Objective

Implement `UC-MOL-08-android` from the approved `UC-MOL-05-android` base without reopening pill-family work that already landed in the dependency task.

## Task Source of Truth

- Task file: `/Users/justinrich/Projects/LaneShadow/.spec/prds/v2/tasks/sprint-04-molecules-composite-patterns/UC-MOL-08-android-location-route-molecules.md`
- Worktree: `/Users/justinrich/Projects/LaneShadow/.kb-run/worktrees/UC-MOL-08-android`
- Dependency note: `UC-MOL-05-android` is already satisfied in this worktree base.
- Alignment note: `ALIGN-03-android` remains waived with baseline risk for this sprint run.

## Important Scheduler Notes

- The root repository is already dirty; do not revert unrelated changes.
- This worktree is intentionally based on the approved `UC-MOL-05-android` branch head because root `main` is not currently mergeable for dependent follow-on work.
- Do not modify `.kb-run*` artifacts.
- Do not reopen `android/app/src/main/java/com/laneshadow/ui/molecules/LSTagPill.kt` or `LSWeatherBadge.kt` unless a direct compile or contract break forces a dependency fix.

## Required Outcome

Implement both Android molecules and their tests/stories so the task satisfies:

1. `LSLocationContextBar` as a two-`LSTagPill` row with `Arrangement.SpaceBetween` and exact-once mode-pill callback behavior.
2. `LSRouteAttachmentCard` with:
   - named 3.dp leading stripe resolved from `theme.colors.route.<variant>`
   - selected border via `color.signal.default`
   - optional `LSBestBadge`
   - optional `LSWeatherBadge`
   - metrics row
   - five scenic dots using the task-specified box-circle approach
   - compact mode hiding badges with tighter padding
3. story registration for both molecules with the required variants
4. zero inline `Color(0xFF...)`

## Validation Targets

- `cd android && ./gradlew detekt`
- `cd android && ./gradlew :app:compileDebugKotlin`
- `cd android && ./gradlew test`
- `cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.molecules.LSLocationContextBarTest.renders_two_tag_pills_with_space_between'`
- `cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.molecules.LSRouteAttachmentCardTest.full_best_selected_variant_renders_all_slots'`
- `cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.molecules.LSRouteAttachmentCardTest.compact_mode_suppresses_best_badge_and_weather_badge'`
- `cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.molecules.LSRouteAttachmentCardTest.route_variant_stripe_resolves_correct_color'`
- `grep -n 'Color(0xFF' android/app/src/main/java/com/laneshadow/ui/molecules/LSLocationContextBar.kt android/app/src/main/java/com/laneshadow/ui/molecules/LSRouteAttachmentCard.kt | wc -l | grep -x '0'`

## Completion Contract

- Create a real commit with hooks enabled.
- Final response must include:
  - commit SHA
  - files changed
  - validation commands run with pass/fail
  - whether connected-device tests ran or remain blocked by environment
  - any residual risks
