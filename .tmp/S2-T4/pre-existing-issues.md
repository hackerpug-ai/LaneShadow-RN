# Pre-Existing Issues Blocking the Full Lint Gate (non-mutative proof, v2)

## Summary

The task's prescribed lint gate is the FULL `pnpm exec biome check` (VERIFICATION GATES,
line 153 of the S2-T4 task file). This command exits **1** due to **19 pre-existing lint
errors**, **236 warnings**, and **61 infos** in files **unrelated to S2-T4**. The S2-T4
scoped files introduce **zero** lint diagnostics (errors/warnings/infos).

- **Full gate** (`pnpm exec biome check`): exit **1** — 19 errors, 236 warnings, 61 infos
  (Checked 842 files). All pre-existing.
- **Scoped gate** (`pnpm exec biome check` on the 3 S2-T4 source files only): exit **0** —
  "Checked 3 files in 7ms. No fixes applied." (zero errors, zero warnings, zero infos)
- Full command output: `.tmp/S2-T4/lint-full-output.txt`
- Full error dump (`--diagnostic-level=error --max-diagnostics=999`): `.tmp/S2-T4/lint-errors-fulldump.txt`
- Full all-severity dump (`--max-diagnostics=9999`): `.tmp/S2-T4/lint-alldiag-fulldump.txt`
- Errors-only file list: `.tmp/S2-T4/lint-error-files.txt`
- All-diagnostic file list: `.tmp/S2-T4/lint-all-diagnostic-files.txt`

## Verification method — NON-MUTATIVE disjoint-set proof (read-only)

**No source file was reverted, restored, stashed, checked-out, or deleted at any point.**
The working tree of committed S2-T4 source stayed clean at HEAD throughout this proof.
`git status --short` showed ZERO source-file changes at every step (only `.tmp/S2-T4/`
evidence files, which are the permitted evidence output, were created/modified).

The proof is established by **disjoint-set membership** computed from two read-only
enumerations:

1. **S2-T4 source files touched** — read-only `git diff --name-only 9d705414..HEAD -- convex/
   package.json pnpm-lock.yaml convex.json` (no working-tree mutation; pure diff query).
2. **Lint-diagnostic file paths** — parse the captured full `pnpm exec biome check` output
   for every `<path>:<line>:<col>` and `<path> <rule>` diagnostic header (read-only parse of
   an already-captured text file).
3. **Intersection** — the two sets are proven DISJOINT (intersection is empty): no S2-T4
   source file appears in the lint-diagnostic set.

An optional **read-only archive baseline** (belt-and-suspenders, also non-mutative) confirms
the result: `git archive 9d705414 | tar -x -C /tmp/s2t4-baseline` extracts the pre-S2-T4 tree
into an isolated temp dir WITHOUT touching the working tree, then runs biome there. The
baseline (pre-S2-T4) shows the IDENTICAL 19 errors across the IDENTICAL 8 line-level error
files → confirms pre-existing. (Baseline checked 840 files vs current 842 — the 2 extra
current files are the S2-T4-created `spikeObservability.ts` + its integration test, neither
of which has any diagnostic.)

### Disjoint-set proof (non-mutative) — S2-T4 source files

Enumerated via read-only `git diff --name-only 9d705414..HEAD` (6 files):

| # | S2-T4 source file touched |
|---|---------------------------|
| 1 | `convex.json` |
| 2 | `convex/actions/agent/spike/__tests__/spikeObservability.integration.test.ts` |
| 3 | `convex/actions/agent/spike/rideAgentSpike.ts` |
| 4 | `convex/actions/agent/spike/spikeObservability.ts` |
| 5 | `package.json` |
| 6 | `pnpm-lock.yaml` |

(Source: `.tmp/S2-T4/s2t4-touched-source-files.txt`)

### Disjoint-set proof (non-mutative) — lint error files (14 unique, error-level)

Parsed from `.tmp/S2-T4/lint-errors-fulldump.txt` (all 19 errors live in these 14 files):

| # | Lint-error file (pre-existing, NOT touched by S2-T4) |
|---|------------------------------------------------------|
| 1 | `app/(app)/(tabs)/index.footer-visibility-simple.test.tsx` |
| 2 | `app/(auth)/sign-in.tsx` |
| 3 | `biome-plugins/no-dynamic-import.grit` |
| 4 | `components/layouts/menu-layout.integration.test.tsx` |
| 5 | `components/layouts/subpage-layout.tsx` |
| 6 | `components/map/route-tag.test.ts` |
| 7 | `convex/actions/agent/__tests__/planRideSingleRoute.integration.test.ts` |
| 8 | `convex/curatedGeometryQa.ts` |
| 9 | `convex/db/savedRoutes.ts` |
| 10 | `lib/ai/model-manifest.ts` |
| 11 | `scripts/__tests__/check-convex-health.integration.test.ts` |
| 12 | `scripts/test-protomaps.ts` |
| 13 | `tests/discovery/quarantine-import-graph.integration.test.ts` |
| 14 | `tokens/scripts/generate.ts` |

(Source: `.tmp/S2-T4/lint-error-files.txt`)

### Intersection result

```
S2-T4 source files (6) ∩ lint-error files (14) = ∅  (EMPTY)
```

The intersection file `.tmp/S2-T4/disjoint-set-intersection.txt` is empty (0 lines). The same
holds for the broader all-severity set: S2-T4 source files (6) ∩ all-diagnostic files (38) = ∅.

**Conclusion:** S2-T4 touches ZERO files that produce any lint diagnostic (error, warning, or
info). All 19 errors / 236 warnings / 61 infos are pre-existing in unrelated files. → PRE-EXISTING.

## S2-T4 scoped files — ZERO lint diagnostics (direct proof)

`pnpm exec biome check` scoped to the 3 S2-T4 source files (exit 0):

```
Checked 3 files in 7ms. No fixes applied.
```

| File | Full-gate result | Scoped-gate result |
|------|-----------------|--------------------|
| `convex/actions/agent/spike/spikeObservability.ts` | clean (not in diagnostic set) | clean |
| `convex/actions/agent/spike/rideAgentSpike.ts` | clean (not in diagnostic set) | clean |
| `convex/actions/agent/spike/__tests__/spikeObservability.integration.test.ts` | clean (not in diagnostic set) | clean |

Output: `.tmp/S2-T4/lint-scoped-output.txt` (SCOPED_LINT_EXIT=0)

## Full counts (parsed from the REAL captured output)

From `.tmp/S2-T4/lint-full-output.txt`:

```
Checked 842 files in 199ms. No fixes applied.
Found 19 errors.
Found 236 warnings.
Found 61 infos.
```

FULL_LINT_EXIT=1

## Pre-Existing Biome errors (full `pnpm exec biome check`, exit 1) — all 19

19 errors across 14 files. None are in `convex/actions/agent/spike/` or any S2-T4-scoped path.

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

## Read-only archive baseline (optional, non-mutative confirmation)

`git archive 9d705414` (the pre-S2-T4 commit) extracted to `/tmp/s2t4-baseline`; biome run there
(**never touched the worktree**):

```
Checked 840 files in 166ms. No fixes applied.
Found 19 errors.
```

The baseline shows the IDENTICAL 19 errors across the IDENTICAL 8 line-level error files as the
current S2-T4 tree. (840 vs 842 files: the 2 extra current files are the S2-T4-created
`spikeObservability.ts` + integration test, both clean.) → The errors exist BEFORE S2-T4 work
was added. Confirmed pre-existing.

Output: `.tmp/S2-T4/lint-baseline-archive-output.txt`

## Scoped staged-file lint (pre-commit behavior)

`pnpm exec biome check` scoped to the staged S2-T4 source files exits **0** — the S2-T4 changes
introduce zero lint diagnostics. This is the pre-commit-hook behavior (lefthook runs biome on
staged files only). The task's prescribed gate is the FULL command, which fails on the
pre-existing errors documented above.

## Notes

- The prior remediation commit (`8d23c8a3`) used a **mutative** verification (reverted/deleted
  S2-T4 source files, then restored them). This v2 replaces that with a **non-mutative**
  disjoint-set proof — the working tree of committed source was never mutated.
- The prior `verification-summary.json` recorded `lint.warnings: 0`, which was FALSE — the real
  full-command warning count is **236** (with 61 infos). This v2 records the real counts.
