# Pre-Existing Issues Blocking Repo-Wide Verification

## Verification Method
- Confirmed with `git stash push -u -m 'caps-s07-t01-preexisting-check'`
- Re-ran `pnpm type-check:native` on the stashed worktree: exit code `1`
- Re-ran `pnpm lint` on the stashed worktree: exit code `1`
- Restored task changes with `git stash pop`

## TypeScript / Generated Convex Errors
- `server/convex/__tests__/curationAdmin.test.ts:9` and many adjacent files cannot resolve `../_generated/dataModel`
- `server/convex/actions/agent/**` and `server/convex/db/**` report missing `*_generated/{api,dataModel,server}` modules
- Additional pre-existing TypeScript diagnostics appear in those backend files once generated-module resolution fails

See `.tmp/CAPS-S07-T01/typecheck-output.txt` and `.tmp/CAPS-S07-T01/preexisting-typecheck.txt`.

## Lint Tooling Failure
- `pnpm lint` exits with `ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL`
- Root cause in this environment: `Command "biome" not found`

See `.tmp/CAPS-S07-T01/lint-output.txt` and `.tmp/CAPS-S07-T01/preexisting-lint.txt`.
