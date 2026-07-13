# Pre-Existing Issues Blocking the Full Lint Gate

## Summary

The task's prescribed lint gate is the FULL `pnpm exec biome check` (VERIFICATION GATES, line 153 of
the S2-T4 task file). This command exits **1** due to **19 pre-existing lint errors** in files
**unrelated to S2-T4**. The S2-T4 scoped files introduce **zero** lint errors.

- **Full gate** (`pnpm exec biome check`): exit **1** — 19 pre-existing errors (documented below)
- **Scoped gate** (`pnpm exec biome check` on the 3 S2-T4 source files only): exit **0** — clean
- Full command output: `.tmp/S2-T4/lint-full-output.txt`
- Errors-only output: `.tmp/S2-T4/lint-errors-only.txt`

## Verification method (prescribed git-stash equivalent)

The S2-T4 work was already committed (commits `b35841c3` + `5808ae05`), so there were no uncommitted
changes to `git stash`. The equivalent prescribed verification was performed instead:

1. **Reverted** all S2-T4 source files to their pre-S2-T4 state at commit `9d705414` (the S2-T3
   commit that S2-T4 branched from):
   - `convex/actions/agent/spike/rideAgentSpike.ts` — reverted to `9d705414`
   - `convex.json` — reverted to `9d705414`
   - `package.json` — reverted to `9d705414`
   - `pnpm-lock.yaml` — reverted to `9d705414`
2. **Deleted** the 2 files S2-T4 created (they did not exist at `9d705414`):
   - `convex/actions/agent/spike/spikeObservability.ts` — removed
   - `convex/actions/agent/spike/__tests__/spikeObservability.integration.test.ts` — removed
3. **Ran** `pnpm exec biome check --diagnostic-level=error --max-diagnostics=500` → exit **1**,
   **Found 19 errors** — the IDENTICAL error set to the S2-T4 state.
4. **Restored** all files to HEAD (`5808ae05`) — working tree clean, HEAD unchanged.

Baseline output: `.tmp/S2-T4/lint-stashed-baseline.txt`

**Result**: The 19 errors are byte-for-byte identical with and without the S2-T4 work →
**confirmed pre-existing** (not caused by S2-T4). Zero errors disappear when S2-T4 work is removed.

## S2-T4 scoped files — ZERO lint errors

| File | Full-gate result | Scoped-gate result |
|------|-----------------|-------------------|
| `convex/actions/agent/spike/spikeObservability.ts` | clean | clean |
| `convex/actions/agent/spike/rideAgentSpike.ts` | clean | clean |
| `convex/actions/agent/spike/__tests__/spikeObservability.integration.test.ts` | clean | clean |

Scoped staged-file lint (pre-commit behavior):
`pnpm exec biome check` scoped to the 3 S2-T4 source files → exit **0**, "Checked 3 files. No fixes applied."
Output: `.tmp/S2-T4/lint-scoped-output-2.txt`

## Pre-Existing Biome errors (full `pnpm exec biome check`, exit 1)

19 errors across 13 files. None are in `convex/actions/agent/spike/` or any S2-T4-scoped path.

### `app/(app)/(tabs)/index.footer-visibility-simple.test.tsx`
- line 5:1 — `assist/source/organizeImports` — Imports not sorted (FIXABLE)
- (file) — `format` — Formatter would print different content (FIXABLE)

### `app/(auth)/sign-in.tsx`
- (file) — `format` — Formatter would print different content (FIXABLE)

### `biome-plugins/no-dynamic-import.grit`
- (file) — `format` — Grit plugin formatter would print different content (FIXABLE)

### `components/layouts/menu-layout.integration.test.tsx`
- (file) — `format` — Formatter would print different content (FIXABLE)

### `components/layouts/subpage-layout.tsx`
- (file) — `format` — Formatter would print different content (FIXABLE)

### `components/map/route-tag.test.ts`
- line 7:1 — `assist/source/organizeImports` — Imported names not sorted (FIXABLE)

### `convex/actions/agent/__tests__/planRideSingleRoute.integration.test.ts`
- line 15:1 — `assist/source/organizeImports` — Imports not sorted (FIXABLE)
- (file) — `format` — Formatter would print different content (FIXABLE)

### `convex/curatedGeometryQa.ts`
- (file) — `format` — Formatter would print different content (FIXABLE)

### `convex/db/savedRoutes.ts`
- (file) — `format` — Formatter would print different content (FIXABLE)

### `lib/ai/model-manifest.ts`
- line 251:43 — `plugin` (no-dynamic-import) — Dynamic `import()` banned in production code

### `scripts/__tests__/check-convex-health.integration.test.ts`
- line 9:1 — `assist/source/organizeImports` — Imports not organized (FIXABLE)
- (file) — `format` — Formatter would print different content (FIXABLE)

### `scripts/test-protomaps.ts`
- line 24:31 — `plugin` (no-dynamic-import) — Dynamic `import()` banned in production code

### `tests/discovery/quarantine-import-graph.integration.test.ts`
- line 22:1 — `assist/source/organizeImports` — Imported names not sorted (FIXABLE)
- (file) — `format` — Formatter would print different content (FIXABLE)

### `tokens/scripts/generate.ts`
- line 1698:36 — `plugin` (no-dynamic-import) — Dynamic `import()` banned in production code
- line 1740:32 — `plugin` (no-dynamic-import) — Dynamic `import()` banned in production code

## Scoped staged-file lint (pre-commit behavior)

`pnpm exec biome check` scoped to the staged S2-T4 source files exits **0** — the S2-T4 changes
introduce zero lint errors. This is the pre-commit-hook behavior (lefthook runs biome on staged
files only). The task's prescribed gate is the FULL command, which fails on the pre-existing errors
above.
