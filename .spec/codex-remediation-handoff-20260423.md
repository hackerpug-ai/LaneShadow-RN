# Restart Handoff for UC-ATM-02 iOS Remediation

## Summary
- Use this plan as the content for a new handoff note at `.spec/codex-remediation-handoff-20260423.md`.
- Treat `.kb-run/worktrees/UC-ATM-02-ios` as the active source of truth; do not create a new worktree or rediscover the task.
- Fix the failure path in this order: hook wrapper, native child sandbox, stale test selector, then resume the blocked task and commit through normal hooks.

## Implementation Changes
- In the new handoff note, record these verified facts exactly: `UC-ATM-02-ios` is `blocked_environment`; the pending code changes already live in `.kb-run/worktrees/UC-ATM-02-ios`; host-shell `xcodebuild build` and `xcodebuild test -only-testing:LaneShadowTests/LSButtonTests` pass when `scripts/agent-worktree-env.sh` is sourced and both `-derivedDataPath "$DERIVED_DATA_PATH"` and `-clonedSourcePackagesDirPath "$SWIFTPM_CACHE_DIR"` are supplied.
- Add `scripts/ios/xcodebuild-worktree.sh` and repoint `lefthook.yml` `ios-typecheck` to that wrapper. The wrapper must source `scripts/agent-worktree-env.sh`, forward all incoming `xcodebuild` args unchanged, and always append `-derivedDataPath "$DERIVED_DATA_PATH"` plus `-clonedSourcePackagesDirPath "$SWIFTPM_CACHE_DIR"`.
- In the kb-run sprint launcher under `~/.codex/skills/kb-run-sprint/`, edit the file containing `codex exec --sandbox workspace-write` so native mobile child sessions use `--sandbox danger-full-access`. Keep non-native tasks on their current sandbox policy.
- Update `.spec/prds/v2/tasks/sprint-02-atoms-foundation-primitives/UC-ATM-02-ios-button-atom-all-variants-states-ios-swiftui.md` so every targeted test selector is `LaneShadowTests/LSButtonTests`.
- Resume the task from the existing worktree, rerun the normal kb-run flow, let the runner update `.kb-run/state.json` itself, and commit only after hooks pass.

## Test Plan
- Run targeted `swiftformat --lint` for the two story files already changed in the worktree.
- Run the wrapper-backed `xcodebuild build` from `.kb-run/worktrees/UC-ATM-02-ios`.
- Run the wrapper-backed `xcodebuild test ... -only-testing:LaneShadowTests/LSButtonTests`.
- Create the remediation commit from `.kb-run/worktrees/UC-ATM-02-ios` with hooks enabled and confirm `ios-typecheck` now passes inside the hook path.
- Confirm the runner advances `UC-ATM-02-ios` out of `blocked_environment` without hand-editing task state.

## Assumptions and Defaults
- The existing sandbox story cleanup edits in `.kb-run/worktrees/UC-ATM-02-ios` are the intended changes and should be preserved.
- The host Xcode/CoreSimulator installation is usable; the failure is the child-session and hook wiring, not repo code.
- `~/.codex/AGENTS.md` already exists; if `~/.codex/CLAUDE.md` is missing, add a one-line pointer there when documenting the hook policy so cross-harness guidance stays aligned.

## Documentation
- End the restart work by adding `~/.codex/RULES.md` adjacent to `~/.codex/hooks.json`, explaining why the hooks exist, why native iOS hooks must use worktree-local caches, and why the mobile child sandbox is intentionally broader than the default.
