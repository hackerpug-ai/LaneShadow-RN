# S2-T1 — Pre-existing issues (verified via git stash, not introduced by this task)

## Repo-wide `pnpm lint` (biome check .)

`pnpm lint` run across the whole repo reports 21-22 errors / ~240 warnings / ~61 infos. These
are **pre-existing** and unrelated to S2-T1's scope. Verified by stashing all worktree changes
(`git stash -u` from the primary checkout on `main` @ 03fdbf70) and re-running `biome check .`
from the primary checkout — it reported 22 errors independent of any S2-T1 edit.

Scoped verification: `pnpm exec biome check convex/actions/agent/lib/models.ts
convex/actions/agent/lib/__tests__/models.orchestratorTier.test.ts package.json convex.json`
→ 0 errors (after auto-fixing formatting-only issues in the new test file with
`biome check --write`).

None of the 21-22 repo-wide errors are in files touched by this task
(`convex/actions/agent/lib/models.ts`, `convex/actions/agent/lib/__tests__/models.orchestratorTier.test.ts`,
`package.json`, `convex.json`).

## `pnpm test <file> -t "<title>"` argument forwarding

The exact contract VERIFY commands (`pnpm test convex/actions/agent/lib/__tests__/models.orchestratorTier.test.ts -t "..."`)
run all 4 tests in the file instead of filtering to the single named test — this is a
pre-existing `pnpm test` script/arg-forwarding quirk in this repo (confirmed: `npx vitest run
<file> -t "<title>"` and `pnpm test -- <file> -t "<title>"` both filter correctly to 1
test + 3 skipped; only the bare `pnpm test <file> -t "..."` form — used verbatim by the
task's own VERIFY commands — runs all 4). Not introduced by this task. Does not affect
correctness: every contract VERIFY command still exits 0, and each of the 4 ACs is
independently asserted and passes (see `verification-summary.json` / captured stdout).

## `convex/_generated` worktree symlink

`git status` in the worktree shows `convex/_generated/*` as deleted (tracked files) plus an
untracked `convex/_generated` entry — this is the worktree setup's intentional symlink
(`convex/_generated` -> primary checkout's generated dir), noted in the task's routing
packet ("`.env.local` and `convex/_generated` are already symlinked into the worktree").
Not touched or staged by this task's commit.
