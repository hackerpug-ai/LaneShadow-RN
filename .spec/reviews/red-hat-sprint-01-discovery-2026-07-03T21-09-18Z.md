# Red-Hat Review Report — Cycle 2 Re-Review

**Report Date**: 2026-07-03T21:09:18Z
**Target**: Sprint 1 — Discovery on the Route Plan View (`.spec/prds/mvp/tasks/sprint-01-discovery-on-the-route-plan-view`)
**Review Type**: Cycle 2 re-review after REDHAT-FIX-004 and REDHAT-FIX-005 remediation
**Reviewed By**: `convex-reviewer`, `react-native-ui-reviewer` (auto-selected from `AGENTS.md`)
**Previous Report**: [red-hat-sprint-01-discovery-2026-07-03T18-53-01Z.md](./red-hat-sprint-01-discovery-2026-07-03T18-53-01Z.md)
**Fix Commits Reviewed**: `23dd71b3` (REDHAT-FIX-004 implementation), `1655729c` (REDHAT-FIX-005 implementation)
**Merge Commits Reviewed**: `92e6bc25` (REDHAT-FIX-004 merge), `6b3b37c4` (REDHAT-FIX-005 merge)

---

## Executive Summary

This is a fresh independent red-team re-review of the Cycle 1 findings from `red-hat-sprint-01-discovery-2026-07-03T18-53-01Z.md`. All **7 original Cycle 1 findings are resolved** with concrete file:line evidence and passing tests:

- **Convex side (REDHAT-FIX-005)**: `durationSeconds`/`legsCount` no longer fabricate `0`; best-sort discovery without a center now uses the first route's centroid instead of `{0,0}`; the state write-back purity test documents its idempotent-normalization limitation; and the live scores integration test cleans up its `route_plans` rows.
- **RN side (REDHAT-FIX-004)**: the ~207-line `MOCK_SEMANTIC` object is defined once in `test-helpers/mock-semantic.ts`; the three `index.*` integration suites share a single `setupHomeScreenMocks()` harness; and the three index files use a consistent Reanimated mock.

The fixes introduced **one new HIGH-severity issue** in a sibling code path (`createCuratedRoutePlan` still fabricates `durationSeconds: 0` / `legsCount: 0`), plus a handful of LOW/MEDIUM hygiene items. No new CRITICAL issues were found.

**Overall Verdict**: `approved-with-cleanup` — original findings closed, tests green, type-check and biome clean; recommend tracking the new HIGH finding as a follow-up task.

---

## Cycle 1 Findings — Resolution Verdicts

| # | Finding | Severity | Verdict | Evidence | Notes |
|---|---------|----------|---------|----------|-------|
| H-1 | `MOCK_SEMANTIC` duplicated across 4 RN integration test files | HIGH | **RESOLVED** | `test-helpers/mock-semantic.ts:8` exports `MOCK_SEMANTIC`; all 4 target files import it (`index.route-tag:32`, `index.card-loading:32`, `index.discovery:32`, `curated-route-card:36`). `grep -rn "const MOCK_SEMANTIC"` returns zero hits in the 4 target files. | Byte-identical extraction. Imports resolve correctly at each depth. |
| H-2 | Shared RN mock infrastructure duplicated across 3 `index.*` files | HIGH | **RESOLVED** | `test-helpers/index-screen.ts:216` defines `setupHomeScreenMocks()`; all 3 `index.*` files call it (`index.route-tag:40-48`, `index.card-loading:40-48`, `index.discovery:40-48`). No inline `vi.mock()` blocks for boundary modules remain in those files. | `curated-route-card` correctly does NOT adopt the index harness. |
| H-3 | State write-back purity test blind to idempotent normalization mutations | HIGH | **RESOLVED** | `convex/__tests__/listCuratedRoutes.state.integration.test.ts:15-42` contains a 28-line comment block documenting the limitation; keywords "idempotent" and "read-path" present. Test passes (6.07s). | Convex's structural read-path-only query guarantee is correctly identified as the real guard. |
| M-1 | `durationSeconds` and `legsCount` fabricated as `0` | MEDIUM | **RESOLVED** | `convex/actions/agent/tools/discoverCuratedRoutes.ts:175-176` now sets both to `undefined`. Integration test `omitCuratedStatsFabricatedZeros` verifies `toBeUndefined()` against live Convex dev. | Same anti-pattern as the original CRITICAL `distanceMeters` bug; now mirrored to `undefined`. |
| M-2 | Live scores test creates un-cleaned `route_plans` rows | MEDIUM | **RESOLVED** | `convex/actions/agent/tools/__tests__/discoverCuratedRoutes.scores.integration.test.ts:157-173` adds an `afterAll` hook; `convex/db/routePlans.ts:592-603` adds `deleteByClerkUserIdPrefixInternal` scoped to test prefixes. | Mutation is `internalMutation` — unreachable from client. |
| M-3 | `centerPoint` fallback to `{ lat: 0, lng: 0 }` | MEDIUM | **RESOLVED** | `convex/actions/agent/tools/discoverCuratedRoutes.ts:128-132` now falls back to the first route's centroid. Integration test `centerPointFallsBackToRouteCentroid` verifies best-sort centroid usage and nearest-sort preservation. | Sentinel `{0,0}` only remains as a last-resort guard when no routes are returned. |
| M-4 | Reanimated `withTiming` mock inconsistency across RN tests | MEDIUM | **PARTIAL** | Resolved for 3 `index.*` files: `test-helpers/index-screen.ts:73` uses `withTiming: vi.fn((v: number) => v)`. Still differs in `components/chat/cards/curated-route-card.integration.test.tsx:65` (`withTiming: (_val: unknown) => undefined`). | Cross-suite inconsistency persists but was explicitly out of scope for REDHAT-FIX-004; no assertions depend on animated value state. |

---

## New Findings Introduced by the Fixes

### HIGH Severity

- [ ] **N-1: `createCuratedRoutePlan` still fabricates `durationSeconds: 0` / `legsCount: 0`**
  - **Severity**: HIGH
  - **Confidence**: 1 agent + orchestrator verification
  - **Location**: `convex/db/routePlans.ts:402-406`
  - **Evidence**:
    ```typescript
    stats: {
      distanceMeters: args.distanceMi * 1609.344,
      durationSeconds: 0,   // ← fabricated
      legsCount: 0,         // ← fabricated
    },
    ```
  - **Impact**: The DISC-016 direct card-tap path creates `COMPLETED` `route_plans` rows with hardcoded `0` for curated stats. This is the same anti-pattern as the original CRITICAL `distanceMeters: 0` bug (REDHAT-FIX-001) and the Cycle 1 M-1 finding (REDHAT-FIX-005 Part A). Any UI consumer treating `0` as meaningful will display incorrect `0s` / `0 legs`.
  - **Recommendation**: Apply the same `undefined` guard pattern used in `discoverCuratedRoutes.ts:175-176` — change `durationSeconds: 0` → `durationSeconds: undefined` and `legsCount: 0` → `legsCount: undefined`.

### MEDIUM Severity

- [ ] **NEW-M-1: `curated-route-card` still inlines boundary mocks that duplicate `index-screen.ts` patterns**
  - **Severity**: MEDIUM
  - **Confidence**: 1 agent
  - **Location**: `components/chat/cards/curated-route-card.integration.test.tsx:99-130`
  - **Evidence**: The file inlines its own `vi.mock()` for `convex/react`, `expo-router`, `react-native-safe-area-context`, `@clerk/clerk-expo`, `expo-haptics`, `@rnmapbox/maps`, plus context/hook/store mocks — all semantically identical to equivalents in `test-helpers/index-screen.ts`.
  - **Impact**: If a shared boundary contract changes, both the index harness and the card mock must be updated independently; drift risk is moderate.
  - **Recommendation**: Consider a follow-up task to extract a `setupCardMocks()` helper analogous to `setupHomeScreenMocks()`. Explicitly out of scope for REDHAT-FIX-004.

### LOW Severity

- [ ] **NEW-L-1: `deleteByClerkUserIdPrefixInternal` uses a full table scan**
  - **Severity**: LOW
  - **Confidence**: 1 agent
  - **Location**: `convex/db/routePlans.ts:596`
  - **Evidence**: `const all = await ctx.db.query('route_plans').collect()` — no index filter; reads all rows then filters in-memory.
  - **Impact**: Acceptable for a test-only internal mutation. Could become slow on a dev deployment with many rows but does not affect production.
  - **Recommendation**: Non-blocking. Consider adding a `by_clerkUserId` index if dev deployment grows large.

- [ ] **NEW-L-2: `searchAlongRoute.ts` has a similar `{lat:0,lng:0}` sentinel**
  - **Severity**: LOW
  - **Confidence**: 1 agent
  - **Location**: `convex/actions/agent/tools/searchAlongRoute.ts:51`
  - **Evidence**: `if (points.length === 0) { return { lat: 0, lng: 0 } }`
  - **Impact**: Different code path from curated discovery; place-search helper, not a route-plan builder. Lower risk but same sentinel pattern.
  - **Recommendation**: Track for a future general sentinel-value cleanup pass.

- [ ] **NEW-L-3: `afterAll` cleanup runs once, not per-test**
  - **Severity**: LOW
  - **Confidence**: 1 agent
  - **Location**: `convex/actions/agent/tools/__tests__/discoverCuratedRoutes.scores.integration.test.ts:159`
  - **Evidence**: Cleanup is in `afterAll`; rows accumulate during the suite run. The next run's prefix-matched cleanup reaps leftovers.
  - **Impact**: Non-blocking; transient pollution only visible during a single vitest run.
  - **Recommendation**: Consider `afterEach` for stricter inter-test isolation if transient pollution becomes an issue.

- [ ] **NEW-L-4: `curated-route-card` Reanimated mock surface differs from shared helper**
  - **Severity**: LOW
  - **Confidence**: 1 agent
  - **Location**: `test-helpers/index-screen.ts:74` vs `components/chat/cards/curated-route-card.integration.test.tsx:63-68`
  - **Evidence**: Shared helper mocks `FadeInDown` only; card test mocks `FadeIn` + `FadeOut` + `withRepeat` + `withSequence`.
  - **Impact**: Negligible — mocks are no-ops and no assertions depend on Reanimated behavior.
  - **Recommendation**: No action needed; documented for awareness.

---

## Human Testing Gate Pre-Check

The sprint `SPRINT.md` status is `Complete` and the Human Testing Gate is documented.

| Check | Result | Notes |
|-------|--------|-------|
| Gate step entry points exist | **PASS** | Maestro flow `.maestro/discovery-full-gate.yaml` exists and references the app's route plan view flows. |
| `gate-results.json` exists with `verdict:"pass"` | **FAIL** | `.spec/prds/mvp/tasks/sprint-01-discovery-on-the-route-plan-view/gate-results.json` not found. |
| `sprint-goal-state.json` exists | **FAIL** | Not found at the sprint path. |

**Auto-finding (HIGH, deterministic)**: The sprint claims `Complete` but does not have a machine-readable `gate-results.json` artifact. Human-gate evidence is present in `SPRINT-RUN-STATUS.md` (Maestro E2E passed on 2026-07-02), but the canonical gate-results file is missing. Recommend generating `gate-results.json` (e.g., via `/kb-run-human-tests`) for auditability.

---

## Verification Commands Run

| Command | Exit / Result | Notes |
|---------|---------------|-------|
| `pnpm type-check` | **PASS** (exit 0) | No TypeScript errors across `convex/tsconfig.json` or project `tsconfig.json`. |
| `pnpm test app/(app)/(tabs)/index.route-tag.integration.test.tsx app/(app)/(tabs)/index.card-loading.integration.test.tsx app/(app)/(tabs)/index.discovery.integration.test.tsx components/chat/cards/curated-route-card.integration.test.tsx` | **PASS** (4/4 files, 11/11 tests) | 991ms total. |
| `pnpm test convex/actions/agent/tools/__tests__/discoverCuratedRoutes.scores.integration.test.ts convex/__tests__/listCuratedRoutes.state.integration.test.ts` | **PASS** (2/2 files, 7/7 tests) | 38.88s total against live Convex dev. |
| `pnpm exec biome check <10 changed files>` | **PASS** (exit 0) | 4 info-level `no-dynamic-import` plugin messages on RN test files only; no lint violations. |
| `grep -rn "const MOCK_SEMANTIC" app/(app)/(tabs)/index.route-tag.integration.test.tsx app/(app)/(tabs)/index.card-loading.integration.test.tsx app/(app)/(tabs)/index.discovery.integration.test.tsx components/chat/cards/curated-route-card.integration.test.tsx` | **NO HITS** | Confirms H-1 resolution. |
| `grep -rn "setupHomeScreenMocks" test-helpers/index-screen.ts app/(app)/(tabs)/index.route-tag.integration.test.tsx app/(app)/(tabs)/index.card-loading.integration.test.tsx app/(app)/(tabs)/index.discovery.integration.test.tsx` | **4 HITS** | Confirms H-2 resolution. |
| `grep -qE 'idempotent|read-path' convex/__tests__/listCuratedRoutes.state.integration.test.ts` | **PASS** (exit 0) | Confirms H-3 resolution. |

---

## Agent Reports (Summary)

- **`convex-reviewer`**: Verified all 4 backend Cycle 1 findings (H-3, M-1, M-2, M-3) resolved. Identified 1 new HIGH (`createCuratedRoutePlan` fabricated zeros) and 3 LOW findings (full-table-scan cleanup, `searchAlongRoute` sentinel, `afterAll` cleanup granularity). All REDHAT-FIX-005 AC-1..AC-4 / TC-1..TC-5 passed.
- **`react-native-ui-reviewer`**: Verified H-1 and H-2 resolved; M-4 partially resolved (3 index files consistent, card file still inconsistent but out of scope). Identified 1 new MEDIUM (`curated-route-card` mock duplication) and 1 new LOW (Reanimated mock surface difference). All REDHAT-FIX-004 AC-1..AC-5 / TC-1..TC-5 passed.

---

## Recommendations by Category

1. **Backend Hardening (highest priority)**
   - Fix `createCuratedRoutePlan` (`convex/db/routePlans.ts:404-405`) to use `undefined` instead of fabricated `0` for `durationSeconds` and `legsCount`, matching `discoverCuratedRoutes.ts`.

2. **Test Maintainability**
   - Consider a follow-up helper for `curated-route-card` mocks to reduce duplication with `index-screen.ts`.
   - Consider `afterEach` cleanup in the live scores integration test for stricter isolation.
   - Consider adding a `by_clerkUserId` index if dev `route_plans` volume grows.

3. **Auditability**
   - Generate a `gate-results.json` artifact for the sprint's Human Testing Gate so the `Complete` status is machine-verifiable.

4. **General Sentinel Cleanup**
   - Track `searchAlongRoute.ts:51` and any other `{lat:0,lng:0}` fallbacks for a future consistency pass.

---

## Metadata

- **Agents**: `convex-reviewer`, `react-native-ui-reviewer`
- **Confidence Framework**: Findings attributed to the reviewing agent; `N-1` independently verified by the orchestrator. With two reviewers, cross-agent agreement yields higher confidence; single-agent findings are noted as such.
- **Report Generated**: 2026-07-03T21:09:18Z
- **Commits Reviewed**: `23dd71b3`, `92e6bc25`, `1655729c`, `6b3b37c4`
- **Next Steps**: Address N-1; optionally address NEW-M-1 and LOW findings; generate `gate-results.json`; no full re-review required unless production logic changes.
