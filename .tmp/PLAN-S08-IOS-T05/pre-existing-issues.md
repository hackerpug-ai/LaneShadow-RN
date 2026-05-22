# Pre-Existing Issues Blocking Repo-Level JS Checks

## TypeScript / Test Tooling
- `pnpm type-check:native` fails before evaluating source because `tsgo` is unavailable in this worktree: `sh: tsgo: command not found`.
- `pnpm test` fails before evaluating source because `vitest` is unavailable in this worktree: `sh: vitest: command not found`.
- `pnpm design:review --screens planning-screen` fails before running the pipeline because `tsx` is unavailable in this worktree: `ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL Command "tsx" not found`.
- All three commands also warn that `node_modules` is missing in the worktree.

## Lint Warnings
- `pnpm exec biome check --no-errors-on-unmatched` fails on a repo-level config schema mismatch (`biome.json` expects 2.4.12 while the CLI is 2.4.15`) and then scans generated `.agent-cache/derived-data/**` JSON files, producing formatter failures unrelated to the modified UI test sources.

## Native Checks
- Native iOS checks relevant to this task succeeded:
  - targeted planning-screen XCUITests passed
  - full 7-variant planning-screen capture batch passed
  - `xcodebuild build` passed
  - `swiftlint` on modified UI test files passed

These issues were observed after implementing the task and are environment/repo-tooling problems outside the touched Swift files.
