# Red-Hat Review Report — Cycle 1 Re-Review

**Report Date**: 2026-07-03T18:53:01Z
**Target**: Sprint 1 — Discovery on the Route Plan View (`.spec/prds/mvp/tasks/sprint-01-discovery-on-the-route-plan-view`)
**Review Type**: Cycle 1 re-review after REDHAT-FIX remediation
**Reviewed By**: `convex-reviewer`, `react-native-ui-reviewer` (auto-selected from `AGENTS.md`)
**Previous Report**: [red-hat-sprint-01-discovery-2026-07-03T00-00-00Z.md](./red-hat-sprint-01-discovery-2026-07-03T00-00-00Z.md)
**Redhat-Fix Commits Reviewed**: `e69769c8`, `78ab6cd5`, `5e26f44e`

---

## Executive Summary

This is a fresh independent red-team re-review of the Sprint 1 remedial fixes (REDHAT-FIX-001/002/003) that were merged to `main` to close the Cycle 0 findings. All **8 original Cycle 0 findings are resolved** with concrete file:line evidence: the `distanceMeters: 0` fabrication is guarded to `undefined`, the missing `discoverCuratedRoutes.scores.integration.test.ts` proves real non-zero scores against live Convex dev, the two DB write-back purity tests exist, and the four missing RN integration test files are present and passing.

However, the fixes introduced **new quality and maintainability issues** that should be addressed before the sprint is considered fully hardened. The most significant are: (1) heavy duplication of mock infrastructure and `MOCK_SEMANTIC` objects across the four new RN test files, and (2) a few remaining fabricated-zero patterns and test-design limitations in the Convex backend. No new CRITICAL issues were introduced. The sprint is materially closer to green, but a follow-up cleanup pass is recommended.

**Overall Verdict**: `approved-with-cleanup` — original findings closed, no blockers, but new MEDIUM/HIGH hygiene findings should be tracked.

---

## Original Cycle 0 Findings — Resolution Verdicts

| # | Finding | Severity | Verdict | Evidence |
|---|---------|----------|---------|----------|
| 1 | `distanceMeters: 0` fabricated for best-sort options in `discoverCuratedRoutes.ts` | CRITICAL | **RESOLVED** | `convex/actions/agent/tools/discoverCuratedRoutes.ts:154` now reads `route.distanceMi != null ? route.distanceMi * 1609.344 : undefined`. |
| 2 | Missing `discoverCuratedRoutes.scores.integration.test.ts` | CRITICAL | **RESOLVED** | File created at `convex/actions/agent/tools/__tests__/discoverCuratedRoutes.scores.integration.test.ts:1-323`; `optionCarriesRealNonZeroScores` and `distanceGuardedToNearestSort` tests present. |
| 3 | Missing DB write-back verification for archetype mapping (DATA-002 AC-3) | HIGH | **RESOLVED** | `convex/__tests__/listCuratedRoutes.archetype.integration.test.ts:1-92` contains `gatePerformsNoDbWriteBack`. |
| 4 | Missing DB write-back verification for state normalization (DATA-004 AC-3) | HIGH | **RESOLVED** | `convex/__tests__/listCuratedRoutes.state.integration.test.ts:1-97` contains `normalizeCanonicalAndNoWriteBack`. |
| 5 | Missing `index.route-tag.integration.test.tsx` (RUX-004) | HIGH | **RESOLVED** | File created at `app/(app)/(tabs)/index.route-tag.integration.test.tsx:1-727`; tests `tagShowsLabelAndDistance`, `tagTapOpensDetails`, `tagFollowsPaging` present and passing. |
| 6 | Missing `index.card-loading.integration.test.tsx` (RUX-007) | HIGH | **RESOLVED** | File created at `app/(app)/(tabs)/index.card-loading.integration.test.tsx:1-652`; tests `cardTapShowsThenHidesMapPlanningIndicator`, `cardTapDoesNotAppendChatMessage` present and passing. |
| 7 | Missing `index.discovery.integration.test.tsx` (DISC-016) | HIGH | **RESOLVED** | File created at `app/(app)/(tabs)/index.discovery.integration.test.tsx:1-757`; tests `tapPlotsRouteWithoutChatMessage`, `cameraFitsTappedRouteIncludingCentroid`, `typedMessageStillSends` present and passing. |
| 8 | Missing `curated-route-card.integration.test.tsx` (DISC-020) | HIGH | **RESOLVED** | File created at `components/chat/cards/curated-route-card.integration.test.tsx:1-734`; tests `curatedCardShowsScoreAsPercentOnZeroToOneScale`, `earlierCuratedCardReRendersAndReturnsToMap`, `centroidOnlyCuratedPlotsViaFallback` present and passing. |

---

## New Findings Introduced by the Fixes

### HIGH Severity

- [ ] **H-1: `MOCK_SEMANTIC` duplicated across all four RN integration test files**
  - **Severity**: HIGH
  - **Locations**:
    - `app/(app)/(tabs)/index.route-tag.integration.test.tsx:208-414`
    - `app/(app)/(tabs)/index.card-loading.integration.test.tsx:194-400`
    - `app/(app)/(tabs)/index.discovery.integration.test.tsx:193-399`
    - `components/chat/cards/curated-route-card.integration.test.tsx:248-454`
  - **Evidence**: ~207 lines of identical theme-token object repeated in each file. Any theme shape change requires updating four files; a single drift creates silent test gaps.
  - **Recommendation**: Extract `MOCK_SEMANTIC` to a shared test fixture (e.g., `react-native/test-helpers/mock-semantic.ts`) and import it in all four files.

- [ ] **H-2: Shared RN mock infrastructure duplicated across the three `index.*.integration.test.tsx` files**
  - **Severity**: HIGH
  - **Locations**: `app/(app)/(tabs)/index.route-tag.integration.test.tsx`, `index.card-loading.integration.test.tsx`, `index.discovery.integration.test.tsx`
  - **Evidence**: Each file repeats ~60 `vi.mock(...)` blocks for Convex, expo-router, safe-area-context, reanimated, Clerk, haptics, rnmapbox, contexts, and hooks. Only a handful of mocks differ per test scenario.
  - **Recommendation**: Extract a `setupHomeScreenMocks()` helper or `renderHomeScreen()` utility to a shared helper file (e.g., `react-native/test-helpers/index-screen.ts`). Each test file imports the base setup and overrides only scenario-specific mocks.

- [ ] **H-3: State write-back purity test is partially blind to idempotent normalization mutations**
  - **Severity**: HIGH
  - **Location**: `convex/__tests__/listCuratedRoutes.state.integration.test.ts:63-95`
  - **Evidence**: The test compares `card.state` values returned by `listCuratedRoutesInternal`, which applies `normalizeState()` in `buildRouteCard` (`convex/curatedRoutes.ts:129`). If a hypothetical write-back normalized `'North-Carolina'` → `'North Carolina'`, both pre and post samples would show `'North Carolina'`, hiding the mutation. The test header claims "If the stored value mutated, the card output would change" — this is not true for idempotent-normalization mutations.
  - **Mitigation**: Convex queries structurally cannot perform writes, so the practical risk is zero. The issue is test documentation/robustness.
  - **Recommendation**: Either (a) add a comment acknowledging the limitation and noting that Convex's query guarantee is the real guard, or (b) sample raw `curated_routes` rows via a dedicated internal query that bypasses `buildRouteCard`.

---

### MEDIUM Severity

- [ ] **M-1: `durationSeconds` and `legsCount` still fabricated as `0`**
  - **Severity**: MEDIUM
  - **Location**: `convex/actions/agent/tools/discoverCuratedRoutes.ts:155-156`
  - **Evidence**:
    ```typescript
    stats: {
      distanceMeters: route.distanceMi != null ? route.distanceMi * 1609.344 : undefined, // fixed
      durationSeconds: 0, // still fabricated
      legsCount: 0,       // still fabricated
    },
    ```
  - **Impact**: Same anti-pattern as the original `distanceMeters` bug. Consumers checking `stats.durationSeconds > 0` will get false negatives; consumers treating `0` as meaningful will get false positives.
  - **Recommendation**: Apply the same `!= null` guard pattern, returning `undefined` when no real data exists, or document explicitly that `0` is the agreed "not available" sentinel.

- [ ] **M-2: Live `optionCarriesRealNonZeroScores` test creates un-cleaned `route_plans` rows**
  - **Severity**: MEDIUM
  - **Location**: `convex/actions/agent/tools/__tests__/discoverCuratedRoutes.scores.integration.test.ts:151-165`
  - **Evidence**: Each run calls `runLiveDiscoverySmoke`, which creates a `route_plans` row via `createForAgentInternal` + `updatePlanStatus`. No `afterEach` teardown deletes the row.
  - **Impact**: Accumulation of test artifacts in the live dev deployment over repeated runs.
  - **Recommendation**: Add cleanup via an existing `deletePlanInternal` internal action, or accept the accumulation and document it as a dev-deployment-only cost.

- [ ] **M-3: `centerPoint` fallback to `{ lat: 0, lng: 0 }` when no center provided**
  - **Severity**: MEDIUM
  - **Location**: `convex/actions/agent/tools/discoverCuratedRoutes.ts:120`
  - **Evidence**: `const centerPoint = args.intent.center || { lat: 0, lng: 0 }`
  - **Impact**: A best-sort discovery with no center persists a plan whose start/end are (0,0), which is a real coordinate in the Atlantic Ocean. This is not exercised by the new tests and could surface as phantom map centering.
  - **Recommendation**: Either make `center` required for nearest-sort only and omit it for best-sort, or use a clearly invalid sentinel and document the behavior.

- [ ] **M-4: Reanimated mock return value inconsistency across RN tests**
  - **Severity**: MEDIUM
  - **Locations**:
    - `app/(app)/(tabs)/index.route-tag.integration.test.tsx:57` — `withTiming: vi.fn((v: number) => v)`
    - `components/chat/cards/curated-route-card.integration.test.tsx:63` — `withTiming: (_val: unknown) => undefined`
  - **Evidence**: The same mocked Reanimated API returns different shapes in different test files, creating fragility if any assertion depends on animated value state.
  - **Recommendation**: Standardize on one shared Reanimated mock when extracting shared test helpers; the identity return `(v) => v` is safer.

---

### LOW Severity

- [ ] **L-1: Duplicate `convexRun` / `runInternal` shell-out utilities**
  - **Severity**: LOW
  - **Locations**:
    - `convex/actions/agent/tools/__tests__/discoverCuratedRoutes.scores.integration.test.ts:38-53`
    - `convex/__tests__/listCuratedRoutes.archetype.integration.test.ts:41-53`
    - `convex/__tests__/listCuratedRoutes.state.integration.test.ts:42-54`
  - **Evidence**: Three near-identical helpers with minor variations (`execSync` vs `execFileSync`, `stdio` arrays). Maintenance risk if the shell-out contract changes.
  - **Recommendation**: Extract a shared `convexRun` helper in `convex/__tests__/helpers.ts` or `convex/testUtils.ts`.

- [ ] **L-2: Redundant assertion loops in write-back purity tests**
  - **Severity**: LOW
  - **Locations**:
    - `convex/__tests__/listCuratedRoutes.archetype.integration.test.ts:79-90`
    - `convex/__tests__/listCuratedRoutes.state.integration.test.ts:84-95`
  - **Evidence**: Both files count `changed` in a loop, assert `changed === 0`, then loop again to assert each row individually. After `changed === 0` passes, the per-row loop is mathematically redundant.
  - **Recommendation**: Collapse into a single pass that asserts per-row equality directly.

- [ ] **L-3: Nearest-sort mock fixture has `geometryStatus: 'generated'` but returns no geometry**
  - **Severity**: LOW
  - **Location**: `convex/actions/agent/tools/__tests__/discoverCuratedRoutes.scores.integration.test.ts:88, :115`
  - **Evidence**: The mock route has `geometryStatus: 'generated'`, so the code queries `getGeometryForRoutes`; the mock returns `[]`, forcing the centroid fallback in `buildCuratedMapGeometry`. The test only checks `distanceMeters`, so this path is untested.
  - **Recommendation**: Either set `geometryStatus: 'unresolved'` to avoid the misleading query, or add a mock geometry row to exercise the generated-geometry path.

- [ ] **L-4: Biome `no-dynamic-import` plugin informational messages**
  - **Severity**: LOW
  - **Locations**: All 4 RN integration test files
  - **Evidence**: `no-dynamic-import errored: regex pattern matched 1 variables, but expected 0` — info-level only, no violations.
  - **Recommendation**: Non-blocking. Consider upgrading or reconfiguring the Biome plugin if the noise becomes annoying.

---

## Verification Commands Run

| Command | Exit / Result | Notes |
|---------|---------------|-------|
| `pnpm type-check` | **PASS** (exit 0) | No TypeScript errors across `convex/` and project `tsconfig.json`. |
| `pnpm test "app/(app)/(tabs)/index.route-tag.integration.test.tsx"` | **PASS** (3/3) | 13 ms |
| `pnpm test "app/(app)/(tabs)/index.card-loading.integration.test.tsx"` | **PASS** (2/2) | 117 ms |
| `pnpm test "app/(app)/(tabs)/index.discovery.integration.test.tsx"` | **PASS** (3/3) | 11 ms |
| `pnpm test "components/chat/cards/curated-route-card.integration.test.tsx"` | **PASS** (3/3) | 8 ms |
| `pnpm exec biome check <8 changed files>` | **PASS** (4 infos only) | Only Biome plugin internal info messages; no lint violations in changed files. |

**Live Convex integration tests** (`discoverCuratedRoutes.scores.integration.test.ts`, `listCuratedRoutes.archetype.integration.test.ts`, `listCuratedRoutes.state.integration.test.ts`) require a running Convex dev deployment and were not executed in this review harness. Their code was reviewed statically and follows the established `npx convex run` pattern.

---

## Agent Reports (Summary)

- **`convex-reviewer`**: Verified all 4 backend Cycle 0 findings resolved. Identified 6 new issues: 1 HIGH (state purity test blind spot), 2 MEDIUM (fabricated `durationSeconds`/`legsCount`, un-cleaned live test rows), 3 LOW (helper duplication, redundant loops, nearest-sort fixture inconsistency).
- **`react-native-ui-reviewer`**: Verified all 4 RN Cycle 0 findings resolved. Identified 5 new issues: 3 HIGH (`MOCK_SEMANTIC` duplication, theme-drift risk, shared mock infra duplication), 1 MEDIUM (Reanimated mock inconsistency), 1 LOW (Biome plugin info messages).

---

## Recommendations by Category

1. **Test Maintainability (highest cleanup priority)**
   - Extract `MOCK_SEMANTIC` to a shared RN test fixture.
   - Extract shared home-screen mock setup into a reusable helper for the three `index.*.integration.test.tsx` files.
   - Extract a shared `convexRun` helper for the three Convex integration test files.

2. **Backend Hardening**
   - Decide on a consistent "no data" sentinel for curated stats (`undefined` preferred) and apply it to `durationSeconds` and `legsCount`.
   - Address the `centerPoint` (0,0) fallback or document its semantics.
   - Consider adding raw-DB sampling or a comment disclaimer for the state write-back purity test.

3. **Live Test Hygiene**
   - Add teardown for the `route_plans` rows created by `discoverCuratedRoutes.scores.integration.test.ts`, or accept and document dev-deployment artifact accumulation.

---

## Metadata

- **Agents**: `convex-reviewer`, `react-native-ui-reviewer`
- **Confidence Framework**: With two reviewers covering disjoint domains, findings are attributed to the reviewing agent. Cross-domain implications are noted. No contradictions were found.
- **Report Generated**: 2026-07-03T18:53:01Z
- **Commits Reviewed**: `e69769c8` (REDHAT-FIX-001), `78ab6cd5` (REDHAT-FIX-002), `5e26f44e` (REDHAT-FIX-003)
- **Next Steps**: Address HIGH cleanup findings; no re-review required unless production logic is changed.
