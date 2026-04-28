# Pre-existing Issues — AUTH-S03-T04

Date: 2026-04-28
Worktree: /Users/justinrich/Projects/LaneShadow/.claude/worktrees/AUTH-S03-T04

## Issue 1: Missing native-sandbox include build (initial blocker)

Initial gradle runs failed with:

```
Included build '/Users/justinrich/Projects/LaneShadow/.claude/worktrees/native-sandbox/android' does not exist.
```

A local symlink was created at `.claude/worktrees/native-sandbox -> /Users/justinrich/Projects/native-sandbox` to continue diagnosis.

## Issue 2: Duplicate composite build path (current hard blocker)

All required commands are blocked by a duplicate included-build path conflict:

```
Included build /Users/justinrich/Projects/native-theme/platforms/kotlin has build path :kotlin
which is the same as included build
/Users/justinrich/Projects/LaneShadow/.claude/worktrees/native-theme/platforms/kotlin
```

This failure occurs before task-specific sources are compiled, so it blocks:

- `./gradlew :app:testDebugUnitTest`
- `./gradlew :app:compileDebugKotlin`
- `./gradlew :app:ktlintCheck`

Evidence logs:
- `.tmp/AUTH-S03-T04/testDebugUnitTest.log`
- `.tmp/AUTH-S03-T04/compileDebugKotlin.log`
- `.tmp/AUTH-S03-T04/ktlintCheck.log`

## Notes for follow-up

Resolution likely requires normalizing composite includeBuild wiring for `native-theme` so only one `:kotlin` composite is present in this worktree environment.

## Issue 3: Pre-commit hook blocker

`git commit` is blocked by a pre-commit hook permission error:

```
sh: scripts/tokens/enforce-native-compliance.sh: Permission denied
exit status 126
```

And the same Android typecheck blocker from Issue 2 is triggered during hooks.
