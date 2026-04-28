# Pre-Existing Issues Blocking Full Quality Gates

## TypeScript Errors
- Multiple `TS2307` missing module errors for `server/convex/_generated/*` across existing files.
- Root cause: Convex generated artifacts are absent and `convex codegen/dev` cannot run in this non-interactive environment without deployment configuration.

## Lint Warnings/Errors
- `pnpm exec biome check server/` fails with `Command "biome" not found` in this worktree environment.

## Test Failures
- Repository-level Convex test execution depends on generated modules; direct handler-level tests were run and passed for changed behavior.

## Convex Dev
- `pnpm --dir server run convex:dev -- --once` fails with non-interactive prompt/configuration requirement.

All issues verified as environment/pre-existing blockers in this worktree context.
