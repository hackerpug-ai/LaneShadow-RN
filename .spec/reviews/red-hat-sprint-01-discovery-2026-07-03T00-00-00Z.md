# Red-Hat Review Report

**Report Date**: 2026-07-03T00:00:00Z
**Target**: Sprint 1 — Discovery on the Route Plan View (`.spec/prds/mvp/tasks/sprint-01-discovery-on-the-route-plan-view`)
**Reviewed By**: `convex-reviewer`, `react-native-ui-reviewer` (auto-selected from `AGENTS.md`)
**Merged Code Range**: `main` through `a6581765` and `3f20b67e`
**Sprint Status Claimed**: Complete

---

## Executive Summary

This is a fresh independent red-team review of Sprint 1 after the code was merged to `main` through `a6581765` and `3f20b67e`. The core architecture is largely implemented: curated discovery lives on the route-plan view, suggestion cards plot directly without a chat round-trip, the discovery slot no longer shows generic `IDLE_SUGGESTIONS`, the footer chat button is distinct from send, and the route carousel/tag/details-sheet flow is wired. However, the sprint has **2 CRITICAL** and **7 HIGH** severity gaps. The most severe issues are a missing primary integration test for the DATA-008b score-mapping fix and a logic bug that still fabricates `distanceMeters: 0` for best-sort options. Additionally, four RN integration test files specified in task acceptance criteria are absent, and two backend AC-3 write-back safety tests are missing. The sprint cannot be considered fully verified until these test gaps and the distance-meters bug are closed.

**Overall Verdict**: `needs-revision`

---

## CRITICAL Findings

- [ ] **DATA-008b — Missing primary integration test for score correctness**
  - **Severity**: CRITICAL
  - **Location**: `convex/actions/agent/tools/__tests__/discoverCuratedRoutes.scores.integration.test.ts` (file does not exist)
  - **Evidence**: No `*scores*` test file under `convex/actions/agent/tools/__tests__/`. No `optionCarriesRealNonZeroScores` test anywhere. The existing `discoverCuratedRoutes.integration.test.ts:23-24` explicitly defers score correctness to DATA-008b, but that test was never created.
  - **Expected**: A live-dev integration test that drives `runDiscoverCuratedRoutes`, loads the created `route_plans` option, and asserts `scores.composite > 0` and equal to the route's real `compositeScore`.
  - **Agents**: `convex-reviewer`
  - **Fix**: Create `convex/actions/agent/tools/__tests__/discoverCuratedRoutes.scores.integration.test.ts` with `optionCarriesRealNonZeroScores` and `distanceGuardedToNearestSort`.

- [ ] **DATA-008b — `distanceMeters: 0` is still fabricated for best-sort options**
  - **Severity**: CRITICAL
  - **Location**: `convex/actions/agent/tools/discoverCuratedRoutes.ts:151`
  - **Evidence**: `stats.distanceMeters: (route.distanceMi || 0) * 1609.344`. When `route.distanceMi` is `undefined` (best sort), the `|| 0` fallback produces a real `0` meter value instead of omitting the field.
  - **Expected**: Best-sort options must carry `distanceMeters: undefined` (or omit the field) when no real distance exists.
  - **Agents**: `convex-reviewer`
  - **Fix**: Guard with `(route.distanceMi != null ? route.distanceMi : undefined)` and only set `distanceMeters` when a real distance is present.

---

## HIGH Findings

### Backend / Convex

- [ ] **DATA-002 AC-3 — Missing DB write-back verification for archetype mapping**
  - **Severity**: HIGH
  - **Location**: `convex/__tests__/listCuratedRoutes.archetype.integration.test.ts` (file does not exist); `convex/curatedRoutes.ts` / `convex/archetypeMap.ts`
  - **Evidence**: No `gatePerformsNoDbWriteBack` test exists. The archetype map is pure (`archetypeMap.ts:19-26`, `buildRouteCard` applies it on read), but no live-dev test samples rows before/after to prove zero DB mutation.
  - **Agents**: `convex-reviewer`
  - **Fix**: Add a test that samples 20 `curated_routes` rows, exercises the archetype gate, and asserts zero `primaryArchetype` values changed.

- [ ] **DATA-004 AC-3 — Missing DB write-back verification for state normalization**
  - **Severity**: HIGH
  - **Location**: `convex/__tests__/listCuratedRoutes.state.integration.test.ts` (file does not exist); `convex/curatedRoutes.ts` / `convex/dataNormalization.ts`
  - **Evidence**: No `normalizeCanonicalAndNoWriteBack` test exists. `normalizeState` is pure (`dataNormalization.ts:6-14`), but no live-dev test proves no DB write-back.
  - **Agents**: `convex-reviewer`
  - **Fix**: Add a test that samples 20 `curated_routes` rows, exercises the state-normalization gate, and asserts zero `state` values changed.

### React Native / UI

- [ ] **RUX-004 — Missing `index.route-tag.integration.test.tsx`**
  - **Severity**: HIGH
  - **Location**: `app/(app)/(tabs)/index.route-tag.integration.test.tsx` (file does not exist)
  - **Evidence**: RUX-004 AC specifies `pnpm test app/(app)/(tabs)/index.route-tag.integration.test.tsx` with tests `tagShowsLabelAndDistance`, `tagTapOpensDetails`, and `tagFollowsPaging`. Glob returns zero results.
  - **Agents**: `react-native-ui-reviewer`
  - **Fix**: Create the integration test file against the full screen/live data.

- [ ] **RUX-007 — Missing `index.card-loading.integration.test.tsx`**
  - **Severity**: HIGH
  - **Location**: `app/(app)/(tabs)/index.card-loading.integration.test.tsx` (file does not exist)
  - **Evidence**: RUX-007 AC-2/AC-3 specify `pnpm test "app/(app)/(tabs)/index.card-loading.integration.test.tsx"` with tests `cardTapShowsThenHidesMapPlanningIndicator` and `cardTapDoesNotAppendChatMessage`. File is absent.
  - **Agents**: `react-native-ui-reviewer`
  - **Fix**: Create the integration test file asserting `mapPlanningVisible` toggle around `createCuratedPlan`.

- [ ] **DISC-016 — Missing `index.discovery.integration.test.tsx`**
  - **Severity**: HIGH
  - **Location**: `app/(app)/(tabs)/index.discovery.integration.test.tsx` (file does not exist)
  - **Evidence**: DISC-016 AC specifies `pnpm test app/(app)/(tabs)/index.discovery.integration.test.tsx` with tests `tapPlotsRouteWithoutChatMessage`, `cameraFitsTappedRouteIncludingCentroid`, and `typedMessageStillSends`. File is absent; the sprint closeout test batch lists 5 related files but not this one.
  - **Agents**: `react-native-ui-reviewer`
  - **Fix**: Create the integration test file. Maestro coverage exists but the task-level integration test is required by AC.

- [ ] **DISC-020 — Missing `curated-route-card.integration.test.tsx`**
  - **Severity**: HIGH
  - **Location**: `components/chat/cards/curated-route-card.integration.test.tsx` (file does not exist)
  - **Evidence**: DISC-020 AC specifies `pnpm test components/chat/cards/curated-route-card.integration.test.tsx` with tests `curatedCardShowsScoreAsPercentOnZeroToOneScale`, `earlierCuratedCardReRendersAndReturnsToMap`, and `centroidOnlyCuratedPlotsViaFallback`. File is absent.
  - **Agents**: `react-native-ui-reviewer`
  - **Fix**: Create the integration test file against live Convex.

---

## MEDIUM Findings

- [ ] **`norm()` silent coercion risk**
  - **Severity**: MEDIUM
  - **Location**: `convex/curatedRoutes.ts:123`
  - **Evidence**: `const norm = (v: number) => (v > 1 ? v / 100 : v)`. A corrupted value of `1.5` would become `0.015`, masking upstream data issues.
  - **Agents**: `convex-reviewer`
  - **Fix**: Add explicit data-quality logging or clamp/reject values outside documented ranges.

- [ ] **`buildRouteCard` parameter typed as `any`**
  - **Severity**: MEDIUM
  - **Location**: `convex/curatedRoutes.ts:125`
  - **Evidence**: The route parameter is `any`, bypassing TypeScript checking for the card builder.
  - **Agents**: `convex-reviewer`
  - **Fix**: Replace `any` with the proper `CuratedRouteDoc` or generated document type.

- [ ] **Multiple `as any` casts in `curatedRoutes.ts`**
  - **Severity**: MEDIUM
  - **Location**: `convex/curatedRoutes.ts:191,201,231,258,289`
  - **Evidence**: Repeated `as any` casts degrade type safety across query builders.
  - **Agents**: `convex-reviewer`
  - **Fix**: Use proper Convex types or narrower assertions.

- [ ] **Mode 3 (state) query may truncate results**
  - **Severity**: MEDIUM
  - **Location**: `convex/curatedRoutes.ts:259`
  - **Evidence**: `.take(effectiveLimit * 2)` can drop rows if one spelling variant dominates.
  - **Agents**: `convex-reviewer`
  - **Fix**: Use a two-pass merge or explicit per-variant limit.

- [ ] **Geospatial health test falls back to fake token**
  - **Severity**: MEDIUM
  - **Location**: `convex/__tests__/geospatialSeed.integration.test.ts:42`
  - **Evidence**: `convexToken = 'test-token'` when config file is absent; tests may pass without hitting Convex.
  - **Agents**: `convex-reviewer`
  - **Fix**: Fail the test when the token cannot be resolved.

- [ ] **`.maestro/rux-001-route-carousel-paging.yaml` is stale**
  - **Severity**: MEDIUM
  - **Location**: `.maestro/rux-001-route-carousel-paging.yaml`
  - **Evidence**: `SPRINT-RUN-STATUS.md:59` explicitly warns it still references stale `route-carousel-card` selectors.
  - **Agents**: `react-native-ui-reviewer`
  - **Fix**: Update selectors to `route-summary-card` or archive the flow.

- [ ] **Hardcoded copper accent hex fallback in chat input**
  - **Severity**: MEDIUM
  - **Location**: `components/chat/chat-input.tsx:159`
  - **Evidence**: `'#EE7C2B'` used as fallback for `semantic.color.accent?.default`.
  - **Agents**: `react-native-ui-reviewer`
  - **Fix**: Ensure tokens always provide the accent; remove the hardcoded hex fallback from production render code.

---

## LOW Findings

- [ ] **Hardcoded map loading background color**
  - **Severity**: LOW
  - **Location**: `app/(app)/(tabs)/index.tsx:1749`
  - **Evidence**: `'#0b0b0c'` for map loading background.
  - **Agents**: `react-native-ui-reviewer`

- [ ] **E2E marker text uses hardcoded color/font**
  - **Severity**: LOW
  - **Location**: `app/(app)/(tabs)/index.tsx:1758-1759`
  - **Evidence**: `color: '#000'`, `fontSize: 2`.
  - **Agents**: `react-native-ui-reviewer`

- [ ] **Hardcoded font size in chat input**
  - **Severity**: LOW
  - **Location**: `components/chat/chat-input.tsx:169`
  - **Evidence**: `fontSize: 11.5` instead of a semantic typography token.
  - **Agents**: `react-native-ui-reviewer`

- [ ] **`deriveArchetypeLabel` uses `any` parameter**
  - **Severity**: LOW
  - **Location**: `app/(app)/(tabs)/index.tsx:83`
  - **Evidence**: `route: any` param type.
  - **Agents**: `react-native-ui-reviewer`

- [ ] **`manualRouteOptions` typed as `any`**
  - **Severity**: LOW
  - **Location**: `app/(app)/(tabs)/index.tsx:923`
  - **Evidence**: `const [manualRouteOptions, setManualRouteOptions] = useState<any>(null)`.
  - **Agents**: `react-native-ui-reviewer`

- [ ] **Placeholder card stubs in card registry**
  - **Severity**: LOW
  - **Location**: `components/chat/card-registry.ts:82-83`
  - **Evidence**: `weather_card: PlaceholderCard, // TODO: replace when fetchWeather tool is real` and `saved_route_card: PlaceholderCard, // TODO: replace when saveRoute tool is real`.
  - **Agents**: `react-native-ui-reviewer`
  - **Note**: Out of sprint scope, but tracked as known stubs.

---

## Agent Contradictions & Debates

| Topic | convex-reviewer | react-native-ui-reviewer | Assessment |
|-------|-----------------|--------------------------|------------|
| DATA-008b score fix completeness | CRITICAL: missing test + `distanceMeters: 0` bug still present | Did not review this backend file | Backend-only finding; no contradiction, but cross-stack impact on chat card scores |
| SPRINT-RUN-STATUS test completeness | N/A (focused on backend) | HIGH: 4 RN integration test files specified in ACs are missing despite status claiming complete | Status file lists passing tests but omits the task-specified integration tests |
| Distance display for best-sort options | CRITICAL: fabricated `0` may render as "0 miles" | N/A | Needs verification on the RN side; could become a HIGH UI finding if rendered literally |

---

## Recommendations by Category

1. **Missing Tests (highest priority)**
   - Create `discoverCuratedRoutes.scores.integration.test.ts` (DATA-008b).
   - Add `gatePerformsNoDbWriteBack` (DATA-002) and `normalizeCanonicalAndNoWriteBack` (DATA-004) tests.
   - Create the four missing RN integration tests: `index.route-tag`, `index.card-loading`, `index.discovery`, and `curated-route-card`.

2. **Logic Bugs**
   - Fix `discoverCuratedRoutes.ts:151` to avoid fabricating `distanceMeters: 0` for best-sort options.

3. **Type Safety**
   - Remove `any` from `buildRouteCard`, `deriveArchetypeLabel`, and `manualRouteOptions`.
   - Remove `as any` casts in `curatedRoutes.ts` where possible.

4. **Human Testing Gate Integrity**
   - Update or archive stale `.maestro/rux-001-route-carousel-paging.yaml`.
   - Re-run the full `discovery-full-gate.yaml` and `rux-002-one-route-plot.yaml` Maestro flows after fixes.

5. **Token / Theme Hygiene**
   - Replace hardcoded hex values (`#EE7C2B`, `#0b0b0c`, `#000`) and magic font sizes with semantic tokens.

---

## AC Verdict Summary (Per Task)

| Task | Verdict | Key Issue |
|------|---------|-----------|
| DATA-001 | PASS | — |
| DATA-002 | PARTIAL | AC-3 write-back test missing |
| DATA-004 | PARTIAL | AC-3 write-back test missing |
| DATA-005 | PASS | — |
| DATA-008 | PASS | — |
| DATA-008b | FAIL | Missing primary test + `distanceMeters: 0` bug |
| OPS-001 | PASS | — |
| DATA-009 | PASS | — |
| DATA-010 | PASS | — |
| DATA-011 | PASS | — |
| DISC-002 | PASS | — |
| DISC-016 | PARTIAL | Integration test missing; code path correct |
| DISC-017 | PASS | — |
| DISC-018 | PASS | — |
| DISC-019 | PASS | — |
| DISC-020 | PARTIAL | Integration test missing; code path correct |
| DISC-021 | PASS | — |
| RUX-001 | PASS | — |
| RUX-002 | PASS | — |
| RUX-003 | PASS | — |
| RUX-004 | PARTIAL | Integration test missing; code path correct |
| RUX-005 | PASS | — |
| RUX-006 | PASS | — |
| RUX-007 | PARTIAL | Integration test missing; wiring correct |
| RUX-008 | PASS | — |

---

## Agent Reports (Summary)

- **`convex-reviewer`**: Analyzed 30+ backend source and test files. Found 2 CRITICAL, 2 HIGH, 5 MEDIUM, and 2 LOW findings. Core concern: DATA-008b fix is untested and still contains a `distanceMeters: 0` fabrication bug. DATA-002/004 AC-3 write-back safety tests are absent.
- **`react-native-ui-reviewer`**: Analyzed 25+ RN source files, 15+ task AC documents, and 12+ Maestro flows. Found 1 CRITICAL, 4 HIGH, 2 MEDIUM, and 6 LOW findings. Core concern: four integration test files specified in task ACs are missing, and one Maestro flow is stale.

---

## Metadata

- **Agents**: `convex-reviewer`, `react-native-ui-reviewer`
- **Confidence Framework**: With two reviewers, findings reported by both are marked where applicable; single-agent findings are called out individually.
- **Report Generated**: 2026-07-03T00:00:00Z
- **Target Commits**: `a6581765`, `3f20b67e`
- **Next Steps**: Remediate CRITICAL/HIGH findings (especially missing tests and the `distanceMeters: 0` bug), re-run the affected test suites and Maestro gates, then request a follow-up red-hat review.
