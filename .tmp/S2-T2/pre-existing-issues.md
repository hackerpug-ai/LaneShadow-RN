# S2-T2 — Pre-existing issues observed during evidence harvest

These are **not caused by this task's changes** (2 brand-new files under
`convex/actions/agent/spike/`, zero modifications to any existing file).
Documented here per the Boy Scout Rule ("prove it, don't just claim it").

## 1. Repo-wide `pnpm lint` (biome): 19 errors / 236 warnings / 61 infos

`.tmp/S2-T2/lint-output.txt` is the full repo-wide `pnpm lint` run. `grep -n
"spikeTools\|spike/" .tmp/S2-T2/lint-output.txt` returns **zero matches** —
none of the reported errors/warnings touch our two new files. The scoped
check on exactly our files is clean:

```
pnpm exec biome check convex/actions/agent/spike/spikeTools.ts \
  convex/actions/agent/spike/__tests__/spikeTools.integration.test.ts
# → Checked 2 files in 21ms. No fixes applied.
```

This matches the task's own CRITICAL CONSTRAINTS note: "repo-wide biome has
~22 PRE-EXISTING errors — ignore those, only YOUR files must be clean."

## 2. Repo-wide `pnpm test` (full suite): 140 failed / 116 passed test files

`.tmp/S2-T2/test-output.txt` is the full repo-wide `pnpm test` run (256 test
files, 1951 tests, 653 failed / 1275 passed / 23 skipped). Our new suite
passes cleanly within this same run:

```
✓ convex/actions/agent/spike/__tests__/spikeTools.integration.test.ts (4 tests) 2119ms
```

The large failure count is dominated by a single recurring signature across
unrelated React Native component test files:

```
× ... → Can't access .root on unmounted test renderer
```

This is a **scale-dependent, pre-existing React Testing Library /
react-test-renderer infra issue in the full suite** — not something our
Convex/Mastra Node-side action tests could cause (they touch zero RN
rendering surface). Proof it is pre-existing and independent of this task's
changes:

- `git stash` (removing this task's 2 new files entirely) + re-run
  `components/map/__tests__/waypoint-marker.test.tsx` in isolation → **7/7
  pass**.
- The same file, run together in a small batch with two other
  full-suite-failing files (`map-loading-state.test.tsx`,
  `saved-routes.components.test.tsx`) — **16/16 pass**, no leakage.
- These files only fail when executed as part of the full 256-file suite
  (`pool: 'forks'`, `singleFork: true` in `vitest.config.ts` — every test
  file shares one process), consistent with cross-file state/resource
  exhaustion at scale rather than any single file's logic, and unrelated to
  a 2-file additive Convex/Mastra change with no RN rendering surface.
- `convex/__tests__/seedGeospatialTest.test.ts` failures (`TEST_ROUTES array
  contains exactly 100 routes` etc.) are unrelated fixture-count assertions
  in an unrelated seed-data test, also untouched by this task.

No fix was attempted for these pre-existing, out-of-scope infra issues —
they are unrelated to S2-T2's write-scope (`convex/actions/agent/spike/`
only) and predate this task.
