# Red-Hat Review Report — Sprint 04 Remediation Round 3

**Report Date:** 2026-05-03T22:15:00Z
**Target:** `.spec/prds/v3-integration/tasks/sprint-04-conversational-planning-loop` — Sprint 04 Conversational Planning Loop
**Prior Reviews:**
- `red-hat-sprint-04-2026-05-03T14-19-50Z.md` (round 1, 35 findings, NOT code-complete)
- `red-hat-sprint-04-round2-2026-05-03T21-43-36Z.md` (round 2, 4/14 merged, NOT code-complete)
**Reviewed By:** convex-reviewer, swift-reviewer, kotlin-reviewer (parallel adversarial dispatch)

---

## Executive Summary

**Sprint 04 has merged most remediation tasks but still cannot pass its human gate.** All 17 remediation tasks are marked complete by their implementers; this round-3 review verified that 11 are PASS, 5 are PARTIAL with material gaps, and 1 is FAIL. The CRITICAL backend dependencies (R01, R03, R04, R17) and the iOS error mapping (R13) are real and well-tested. But the three highest-leverage tasks for the gate — **R06/R11 phase taxonomy, R08/R12 E2E suites, R02 saved-route fingerprint** — all ship with structural compromises that look complete on paper but fail at runtime or under inspection.

**Three patterns recur across all three platforms in this round:**

1. **Test theatre with new mechanisms.** Round-2 caught `stateOverride` on Android R09; round-3 finds the rewrite removed `stateOverride` but introduced existence-assertion stubs (`assertIsDisplayed()` instead of `assertSemanticsValueEquals`). iOS R08 hardcodes `evidence=1` regardless of whether the Convex `cancelPlan` mutation fired. Convex R02 tests assert the **wrong index** (`by_ownerType_and_ownerId` vs the AC-mandated composite). Same anti-pattern, three different surfaces.
2. **Dead code shipped as "alignment."** Both R06 (iOS) and R11 (Android) added a `Phase` enum (or partial type) but never wired it into the live data path. `PlanningState.currentPhase` is still `String = "analyzing"` on iOS; `PlanningViewModel` still uses raw `when (status?.lowercase())` on Android. The enums are inert.
3. **Auth bypass invalidates real-backend testing.** iOS R08 uses `bypassAuth: true` with literal fake JWT `"ui-test-jwt"`, which Convex will reject. Android R12 ships with stubbed `ConvexClient.cancelPlan()` that returns `true` without a network call. The 8 gate tests exist on both platforms but cannot exercise the real planning loop because the auth path is faked.

**Closure status (17/17 tasks):**
- **PASS (11):** R01, R03, R04, R05, R07, R10 (with caveats), R13, R14 (mapper only), R15 (no-op fix only), R16 (code only), R17
- **PARTIAL (5):** R02 (composite index broken), R06 (enum not wired), R08 (fake auth + weak assertions), R09 (theatre AC-4/5/6), R11 (Phase enum dead), R12 (missing helpers + stub `ConvexClient`)
- **FAIL (1):** R14 fixture round-trip test fails at runtime due to `NETWORK_TIMEOUT` regression

**The 8 human-gate steps still cannot be verified end-to-end on either platform.** Recommend `/kb-run-sprint --limit 2` for a Wave-5 remediation round.

---

## HIGH Confidence Findings (3+ Agents Agree)

- [ ] **RF-19: Sprint-04 human gate still cannot pass on either platform.** All three reviewers independently confirmed:
  - **Convex side:** R02 AC-5 composite index is architecturally broken (`routeIndex` is a nested object, the index value can never equality-match a string arg); RF-10 still open (`v.any()` on `routePlans.getPlanById` and `sessionMessages.list` — the two highest-traffic mobile subscriptions have no return-shape type safety).
  - **iOS side:** R08 uses `bypassAuth: true` injecting fake JWT `"ui-test-jwt"`, violating the NON-NEGOTIABLE constraint that R08 "MUST authenticate with real signed-in user via `CLERK_TEST_EMAIL` / `CLERK_TEST_PASSWORD`." All 8 gate-step tests are PARTIAL — gate step 2 asserts only `count >= 2` (not the 5 canonical labels), gate step 6 writes `cancelMutationFired = 1` unconditionally, gate step 8 uses `XCTSkip` if backend doesn't fail.
  - **Android side:** R12 ships with `ConvexClient.cancelPlan()` returning `true` with a "placeholder" comment; required deliverables `Sprint04E2EHarness.kt`, `ScreenshotEvidence.kt`, `ConvexQueryProbe.kt`, `Sprint04ManualAnnotationLintTest.kt` do not exist; gate step 7 has an explicit code comment admitting session ID reuse "would require..." (i.e., not implemented); gate step 8 is non-deterministic (waits 45s for an error_screen tag with no fault injection).
  | Severity: **CRITICAL**
  Agents: convex-reviewer, swift-reviewer, kotlin-reviewer

- [ ] **RF-20: Phase-name taxonomy is still unaligned end-to-end on both platforms — `Phase` types are dead code.** R06 (iOS) and R11 (Android) both shipped Phase types but never wired them into the live data path:
  - **iOS:** `PlanningState.currentPhase: String` (RideFlow.swift:122,131) defaults to `"analyzing"` — not even one of the 5 canonical labels. No typed `Phase` enum was created. `RideFlowPhaseTaxonomyTests` only verifies `PlanningMockProvider`, not Convex decoding. AC-5 (`ConvexPhaseDecodingTests.swift`) was never created. `NavigatorDomain.swift:192` still has the dead comment listing the legacy names.
  - **Android:** A `Phase` enum exists at `RideFlowState.kt:16-54` with `fromLabel()` defined, but `rg "fromLabel|Phase\." android/app/src/main/java/` returns ZERO call sites. `PlanningViewModel.kt:92` still does `latestAgentMessage?.status?.lowercase() ?: "parsing"`. `phaseIndexForStatus()` in PlanningUiState.kt:30-38 is a raw `when` over strings. The enum is inert.
  | Severity: **CRITICAL**
  Agents: swift-reviewer, kotlin-reviewer, convex-reviewer (cross-platform spec alignment)

- [ ] **RF-21: New test-theatre patterns introduced in this round.** Round-2 caught `stateOverride` bypass on Android R09. The round-3 rewrites and additions introduced new theatre on every platform:
  - **Convex:** `savedRoutes.test.ts:55` asserts `handlerCode.toContain('by_ownerType_and_ownerId')` — this is the OLD index, not the AC-5 mandated `by_ownerType_ownerId_routeIndex` composite. The test gives a false green because the implementation also uses the old index.
  - **iOS:** `Sprint04GateE2ETests.swift:357` writes `cancelMutationFired = 1` unconditionally regardless of whether the mutation actually fired. `weatherDataPresent = 1` written without checking weather content. Gate step 8 `XCTSkip` allows pass without ever observing an error screen.
  - **Android:** R09 AC-4 polyline test asserts `onNodeWithTag("route-results-map").assertIsDisplayed()` before AND after selection change — never reads the `stateDescription` semantics that would distinguish dashed from solid. R09 AC-5 border color test only re-asserts card existence after tap. R09 AC-6 recomposition bound is set to `initialCount + 30` (3x the spec's ≤11 limit). Sprint04GateE2ETest.kt:413-416 has an EXPLICIT CODE COMMENT acknowledging gate step 7 session-reuse is unverified.
  | Severity: **HIGH**
  Agents: convex-reviewer, swift-reviewer, kotlin-reviewer

---

## MEDIUM Confidence Findings (2 Agents Agree)

- [ ] **RF-22: R02 saved-route fingerprint composite index is structurally wrong.** convex-reviewer found `schema.ts:55` defines `by_ownerType_ownerId_routeIndex` indexing field `routeIndex` (a nested object `{routeFingerprint, sampledPoints}`), but the query at `savedRoutes.ts:497-505` uses the old 2-field index + in-memory `.find()`. Even if the query were rewritten to use the composite, Convex cannot index nested-object fields by leaf string equality — the index as defined cannot support fingerprint-equality lookup. This blocks the iOS "already-saved" badge rendering on RouteDetailsScreen (gate step 4). Decision needed: flatten `routeFingerprint` to a top-level field, or accept the in-memory approach and update AC-5.
  | Severity: **HIGH**
  Agents: convex-reviewer, swift-reviewer (downstream consumer of fingerprint)

- [ ] **RF-23: R14 Android fixture round-trip test FAILS at runtime — `NETWORK_TIMEOUT` regression.** kotlin-reviewer ran `./gradlew test` and observed `LaneShadowErrorMapperFixtureTest.fixtureRoundTrip_everyCodeMapsToItsMobileMappingTarget` failing with `"Code 'NETWORK_TIMEOUT' has no mapping in laneShadowErrorForCode"`. The fixture lists `NETWORK_TIMEOUT → NetworkTimeout`, but `NetworkTimeout` is a `data class` requiring an `IOException` constructor param — `laneShadowErrorForCode("NETWORK_TIMEOUT")` returns `null`. R14 marker AC PASS for sealed class + KnownErrorCodes, but the round-trip gate FAILS. Fix: remove `NETWORK_TIMEOUT` from `__fixtures__/auth-error-taxonomy.json` (it's a client-detected transport error, never server-emitted) and update fixture entry count to 18.
  | Severity: **HIGH**
  Agents: kotlin-reviewer, convex-reviewer (fixture is shared with iOS/Android via R17)

- [ ] **RF-24: R12 Android instrumented suite missing required deliverables.** kotlin-reviewer found four required helper files do not exist anywhere in the tree: `Sprint04E2EHarness.kt`, `ScreenshotEvidence.kt`, `ConvexQueryProbe.kt`, `Sprint04ManualAnnotationLintTest.kt`. The single test file `Sprint04GateE2ETest.kt` includes a stubbed `ConvexClient` with `getCurrentSession()` returning `null` and `cancelPlan()` returning `true` — both labeled "placeholder" in code comments. No screenshots exist at `androidTest/screenshots/sprint-04-e2e/`. The MANUAL annotation block exists but is titled "MANUAL VERIFICATION REQUIRED FOR REAL-DEVICE E2E EVIDENCE" instead of the AC-9-mandated "MANUAL REAL-DEVICE VERIFICATION."
  | Severity: **HIGH**
  Agents: kotlin-reviewer, swift-reviewer (parallel concern on iOS/Android E2E parity)

- [ ] **RF-25: R15 `completeEnrichment` AC-2 is ambiguous — `enrichments:undefined` becomes `status:COMPLETED` instead of `FAILED`.** convex-reviewer found the original F-13 silent no-op is fixed (handler now always calls `db.patch`), but the post-fix behavior sets `status:COMPLETED` even when `enrichments` is undefined. The task spec said "FAILED **or** COMPLETED with empty entries" — `undefined` is not "empty entries." A downstream consumer reading `status:'completed'` expects usable data and gets `undefined`. The test at `routeEnrichments.test.ts:195-204` accepts undefined as valid completion, embedding the ambiguity into the contract. Recommend setting `status:FAILED` when `enrichments` is absent.
  | Severity: **MEDIUM**
  Agents: convex-reviewer, swift-reviewer (RouteDetails consumer of enrichment status)

- [ ] **RF-26: AppStories cross-platform parity at risk — two divergent registries on Android.** kotlin-reviewer found two `AppStories.kt` objects: `android/app/src/debug/.../sandbox/stories/AppStories.kt` (delegates to `TemplateStories.all` with mixed canonical IDs like `templates.idle.default` AND `templates.idle-screen.v-no-location`) and `android/app/src/main/.../ui/sandbox/stories/AppStories.kt` (uses `Sprint04*Stories` with canonical `templates.planning-screen.phase1`). It is unclear which registry the sandbox runner and `pnpm snapshots:check` consume. iOS R07 normalized to `templates.{x}-screen.{variant}` format. If Android uses the debug registry's mixed names, parity will fail.
  | Severity: **MEDIUM**
  Agents: kotlin-reviewer, swift-reviewer (parity contract enforcement)

- [ ] **RF-27: Auth taxonomy fixture path may not be resolvable from mobile build systems.** convex-reviewer flagged the fixture lives at `server/convex/__fixtures__/auth-error-taxonomy.json`, outside the iOS and Android module trees. swift-reviewer confirmed the iOS test loads it via `Bundle.module` and the test PASSES, so iOS works. kotlin-reviewer confirmed Android has a copy at `android/app/src/test/resources/auth-error-taxonomy.json` and the per-entry test PASSES. The fixture is fine — but the round-trip check FAILS due to `NETWORK_TIMEOUT` (RF-23). The cross-platform fixture mechanism is correct; the entry list is wrong.
  | Severity: **LOW**
  Agents: convex-reviewer, swift-reviewer, kotlin-reviewer (informational)

---

## LOW Confidence Findings (Single Agent)

### From convex-reviewer
- [ ] **RF-28: `requireSession` still throws plain `Error('SESSION_REQUIRED')`.** `guards.ts:83,87` were not part of R03's scope (only `requireIdentity` was), but plain errors lose structured codes on the wire and create taxonomy inconsistency with the rest of the auth path.
  | Severity: LOW

- [ ] **RF-29: `v.any()` still on `routePlans.getPlanById` (line 285) and `sessionMessages.list` (line 412).** Round-2 RF-10 flagged this; no remediation task was created. The two highest-traffic mobile subscriptions have no return-shape type safety end-to-end.
  | Severity: HIGH (re-asserted)

- [ ] **RF-30: SPRINT.md status table is stale.** R02 shows STATUS "Backlog (worktree ready)" but commit `702f7793` is on main. R15 shows "Backlog" but commit `da601ab8` is on main. Future reviewers will get false "not started" signals.
  | Severity: LOW

### From swift-reviewer
- [ ] **RF-31: F-19 still open** — `IdleScreen.swift:131,139,150` use `Color.blue.opacity(0.6/0.8/0.1)` literals instead of `wx.rain` tokens. No remediation touched this in any round.
  | Severity: MEDIUM

- [ ] **RF-32: F-20 still open** — `LSPhaseIndicator.swift:52` uses `.heading.sm` instead of `.opinion.md`. No remediation touched this.
  | Severity: MEDIUM

- [ ] **RF-33: F-15 still open** — `RouteDetailsViewModel.swift:86-89` `handleRideThisTap` body is a comment-only no-op with misleading "// Log to performance table" comment that performs no logging.
  | Severity: LOW

- [ ] **RF-34: R16 task file STATUS not updated.** `CHAT-S04-R16-ios-r05-test-crash-fix.md` STATUS is still "Backlog" with `- [ ]` checkboxes unchecked despite the crash fix landing in commit `c8025757`. Process artifact only, but creates tracking drift.
  | Severity: LOW

### From kotlin-reviewer
- [ ] **RF-35: F-28 still open** — `RideFlowState.Error(val sessionId: String?)` does not implement `WithSession`, creating fragile special-case branching at every Error consumer.
  | Severity: MEDIUM

- [ ] **RF-36: F-27 baseline failures CONFIRMED PRE-EXISTING.** `git stash && ./gradlew test` returns identical 17 failures on bare main, validating round-2's assumption. F-27 is legitimately legacy debt, not a sprint-04 regression. (One sprint-04 failure IS new — see RF-23.)
  | Severity: LOW (re-classified after stash proof)

- [ ] **RF-37: F-25 still open** — `LSPhaseIndicator.kt:124` raw `BreathingHeadDot(size = 6.dp)`, `LSPhaseIndicator.kt:154` raw `size: Dp = 6.dp`. No token backing.
  | Severity: LOW

---

## Agent Contradictions & Debates

| Topic | Position A | Position B | Resolution |
|-------|-----------|-----------|------------|
| R02 status | convex-reviewer: "PARTIAL — AC-5 FAIL (composite index never used)" | round-2 said "PASS — all 6 ACs satisfied in worktree" | round-3 verdict prevails. Round-2's worktree review missed that the implementation file uses the old index even though the new index was added to schema. The schema-side change passed reviewer eyeballs but the query-side change did not happen. |
| R09 progress | kotlin-reviewer: "PARTIAL — `stateOverride` removed but new theatre introduced (existence vs semantics)" | implementer marked R09 task complete | kotlin-reviewer is correct. AC-4 and AC-5 still don't assert what the AC mandates (polyline style transition, border color value). The improvement is real but the gate is not met. |
| R12 completeness | kotlin-reviewer: "FAIL — 4 required helper files missing" | implementer marked complete | kotlin-reviewer is correct per the R12 spec. The single test file exists but the supporting infrastructure (E2EHarness, ScreenshotEvidence, ConvexQueryProbe, ManualAnnotationLintTest) does not. |
| R08 auth path | swift-reviewer: "PARTIAL — bypassAuth fake JWT violates NON-NEGOTIABLE constraint" | implementer marked complete | swift-reviewer is correct. The R08 task spec explicitly named CLERK_TEST_EMAIL/CLERK_TEST_PASSWORD as required. The XCUITest harness is real but the auth path is fake, so backend mutations cannot succeed. |

---

## Recommendations by Category

### Gaps
1. **Wire the `Phase` enum through to the LSPhaseIndicator on both platforms (RF-20).** This is the single highest-leverage fix:
   - iOS: `PlanningState.currentPhase: String` → `Phase?`. Update `ConvexClient+LaneShadow.swift` to decode `sessionMessages.status` strings via `Phase.init(rawValue:)`. Create `ConvexPhaseDecodingTests.swift` per R06 AC-5.
   - Android: Replace `phaseIndexForStatus()` raw-string `when` with `Phase.fromLabel(status)?.ordinal ?: 0`. Change `PlanningUiState.currentPhase: String` to `Phase`. Update `PlanningViewModel` to consume the typed enum.
2. **Fix R02 saved-route fingerprint index (RF-22).** Either flatten `routeFingerprint` to a top-level field on `saved_routes` and re-index, or formally accept the in-memory `.find()` approach and update AC-5 to remove the composite-index requirement. Update the test at `savedRoutes.test.ts:55` to assert the actual index used.
3. **Replace iOS R08 auth bypass with real Clerk auth (RF-19).** Use the existing `AuthEmailPasswordE2ETests.swift` sign-in pattern with `CLERK_TEST_EMAIL` / `CLERK_TEST_PASSWORD` env vars. The Convex backend will reject `"ui-test-jwt"` on every planning mutation; the gate cannot pass with the current setup.
4. **Implement Android R12 missing deliverables (RF-24).** Create `Sprint04E2EHarness.kt`, `ScreenshotEvidence.kt`, `ConvexQueryProbe.kt`, `Sprint04ManualAnnotationLintTest.kt`. Replace stubbed `ConvexClient.cancelPlan()` with a real HTTP call via the existing `request()` method.

### Risks
1. **RF-23 NETWORK_TIMEOUT fixture regression must be fixed before merge** — the Android test suite is currently red. Either remove `NETWORK_TIMEOUT` from the fixture (it's a client-detected transport error, never server-emitted) or special-case it in the round-trip test.
2. **RF-29 `v.any()` validators on `getPlanById` and `sessionMessages.list`** — round-2 flagged this as RF-10 with no remediation task created. These are the two queries the entire mobile sandbox subscribes to; without explicit return validators, any backend shape change breaks consumers silently. File a remediation task.
3. **RF-26 AppStories registry split** — running `pnpm snapshots:parity-coverage` now would clarify which registry is authoritative. If the debug registry's mixed-naming variants are consumed, parity will fail before cross-platform review can find drift.

### Assumptions to Validate
1. Round-2 declared R02 "ready to merge with all 6 ACs satisfied" — that was incorrect. Future worktree reviews must verify the query handler actually uses the new index, not just that the schema defines it.
2. The R12 task file claims AC compliance but the implementation lacks 4 required helper files. Implementer self-attestation is unreliable; reviewers must enumerate the deliverables list explicitly.

### Contradictions
1. SPRINT.md status table shows R02 and R15 as "Backlog" while their implementation commits are on main (RF-30). Sync the table to actual git state.
2. R16 STATUS field is "Backlog" with unchecked AC boxes despite the crash fix landing in commit `c8025757` (RF-34). Update the file.

---

## Original Findings Closure Status

| Original Finding | Severity | Round-3 Status | Closed By |
|-----------------|----------|----------------|-----------|
| F-01: Sprint NOT code-complete | CRITICAL | **STILL OPEN** | — (8 gate steps still PARTIAL on both platforms) |
| F-02: No real-device E2E | HIGH | **STILL OPEN** | R08 (iOS) PARTIAL with fake JWT; R12 (Android) PARTIAL with stubbed ConvexClient |
| F-03: Sprint metadata misleading | HIGH | **PARTIALLY CLOSED** | 11 of 17 R-tasks PASS; 6 still PARTIAL/FAIL |
| F-04: Android Unauthenticated | HIGH | **CLOSED** | R03 (round 2) |
| F-05: No TDD RED evidence | MEDIUM | **STILL OPEN** | — |
| F-06: Phase-name taxonomy mismatch | MEDIUM | **PARTIAL** | R06 + R11 added enums but neither is wired into live data path |
| F-07: routeEnrichments.list missing | CRITICAL | **CLOSED** | R01 (round 2) |
| F-08: savedRoutes fingerprint missing | CRITICAL | **PARTIAL** | R02 query exists but composite index unused; in-memory `.find()` only |
| F-09: IDOR on getActiveRoutePlansForSession | HIGH | **CLOSED** | R03 (round 2) |
| F-10: Android phantom planningSessions:list | HIGH | NOT RE-VERIFIED | — |
| F-11: fetchWeather stub | MEDIUM | **CLOSED** | R04 (round 2) |
| F-12: updateSessionTitle bug | MEDIUM | **CLOSED** | R04 (round 2) |
| F-13: completeEnrichment silent no-op | MEDIUM | **PARTIALLY CLOSED** | R15 prevents silent return but COMPLETED+undefined ambiguous (RF-25) |
| F-14: v.any() return validators | LOW | **STILL OPEN** | — (no remediation task created) |
| F-15: Story ID drift | MEDIUM | **CLOSED (iOS)** / **PARTIAL (Android)** | R07 normalized iOS; R10 normalized Sprint04 stories but TemplateStories debug registry has mixed names (RF-26) |
| F-16: iOS sandbox story IDs | MEDIUM | **CLOSED** | R07 (this round) |
| F-17: iOS RouteDetails empty viewState | CRITICAL | **CLOSED** | R05 + R16 (this round, runtime-verified) |
| F-18: Android RouteResults tap/recall | HIGH | **PARTIAL** | R09 stateOverride removed but AC-4/5/6 still theatre (RF-21) |
| F-19: iOS Color.blue literals | MEDIUM | **STILL OPEN** | — (RF-31) |
| F-20: iOS .heading.sm typography | MEDIUM | **STILL OPEN** | — (RF-32) |
| F-22: ErrorScreen heuristic strings | MEDIUM | **CLOSED** | iOS ErrorScreenViewModel now typed dispatch (per swift-reviewer) |
| F-25: Android raw 6.dp literals | LOW | **STILL OPEN** | — (RF-37) |
| F-27: Android baseline test failures | HIGH | **PRE-EXISTING (verified)** | Stash proof confirmed; not a sprint-04 regression |
| F-28: RideFlowState.Error WithSession | MEDIUM | **STILL OPEN** | — (RF-35) |
| F-34: handleRideThisTap empty body | LOW | **STILL OPEN** | — (RF-33) |

---

## Remediation Task Status (round-3)

### PASS (11/17)

| Task | Title | Round-3 Verdict | Notes |
|------|-------|-----------------|-------|
| R01 | db.routeEnrichments.list | **PASS** | All 5 ACs verified |
| R03 | Auth taxonomy + IDOR fix | **PASS** | All 7 ACs verified incl. AC-7 via R17 |
| R04 | fetchWeather stub + updateSessionTitle | **PASS** | All 6 ACs verified |
| R05 | iOS RouteDetailsScreen viewState live wiring | **PASS** | Logic verified at runtime after R16 crash fix |
| R07 | iOS sandbox story ID normalization | **PASS** | All template IDs match canonical regex |
| R10 | Android AppStories registration | **PASS (Sprint04 only)** | Sprint04 stories present + canonical; debug TemplateStories mixed (RF-26 risk) |
| R13 | iOS LaneShadowError FORBIDDEN + mapper | **PASS** | All ACs verified, fixture round-trip clean |
| R14 | Android LaneShadowError FORBIDDEN + mapper (sealed class only) | **PASS for sealed class** | Mapper round-trip FAILS (RF-23) — see PARTIAL below |
| R15 | completeEnrichment no-op fix | **PASS for no-op fix** | AC-2 terminal-state semantics ambiguous (RF-25) |
| R16 | iOS R05 test crash fix | **PASS for code** | Task file STATUS not updated (RF-34) |
| R17 | auth-error-taxonomy.json fixture | **PASS** | All 3 ACs verified incl. drift detection test |

### PARTIAL (5/17)

| Task | Title | Round-3 Verdict | Material Gap |
|------|-------|-----------------|--------------|
| R02 | savedRoutes fingerprint | **PARTIAL** | AC-5 composite index unused; query uses old 2-field index + in-memory `.find()`; index architecturally cannot match nested-object field by leaf string (RF-22) |
| R06 | iOS phase name alignment | **PARTIAL** | No typed `Phase` enum; `currentPhase: String = "analyzing"`; AC-5 ConvexPhaseDecodingTests not created (RF-20) |
| R08 | iOS XCUITest E2E suite | **PARTIAL** | `bypassAuth: true` + fake JWT violates NON-NEGOTIABLE constraint; gate steps 2/4/5/6/7/8 have weak or hardcoded assertions (RF-19, RF-21) |
| R09 | Android RouteResults tap+recall+alt | **PARTIAL** | stateOverride removed but AC-4 (polyline style) and AC-5 (border color) assert existence not semantics; AC-6 bound 3x permissive (RF-21) |
| R11 | Android phase name alignment | **PARTIAL** | `Phase` enum is dead code — never called in production; PlanningViewModel still uses raw string `when` (RF-20) |
| R12 | Android instrumented E2E suite | **PARTIAL** | 4 required helper files missing; `ConvexClient` stubbed; gate step 7 explicitly admits session reuse not verified; gate step 8 non-deterministic (RF-24) |

### FAIL (1/17)

| Task | Title | Round-3 Verdict | Reason |
|------|-------|-----------------|--------|
| R14 (round-trip) | Android fixture round-trip test | **FAIL at runtime** | `NETWORK_TIMEOUT` listed in fixture but `laneShadowErrorForCode("NETWORK_TIMEOUT")` returns null (NetworkTimeout requires IOException constructor); test FAILS (RF-23) |

---

## Recommended Wave-5 Remediation Plan

Based on RF-19/RF-20/RF-21/RF-22/RF-23/RF-24, recommend:

```
Wave 0 (parallel-2): RF-23 fix (remove NETWORK_TIMEOUT or special-case) + RF-22 R02 index decision
Wave 1 (parallel-2): RF-20 iOS Phase enum wire-through + RF-20 Android Phase enum wire-through
Wave 2 (sequential): RF-19 iOS R08 real-Clerk auth path
Wave 3 (sequential): RF-24 Android R12 missing helpers + real ConvexClient
Wave 4 (parallel-2): RF-21 iOS R08 weak assertion fixes + RF-21 Android R09 semantics assertions
Wave 5 (single): RF-19 final 8-step gate verification on real iPhone + emulator with screenshot evidence
```

**Sprint-04 closure gate (revised):**
1. RF-23 fixture round-trip test green on Android
2. RF-22 R02 fingerprint query verified to use either the composite index or accept the in-memory approach with explicit AC-5 update
3. RF-20 Phase enum reachable from live data on both platforms (LSPhaseIndicator binds to enum)
4. RF-19 R08 + R12 use real Clerk auth (no fake JWT) and real ConvexClient (no stubbed cancelPlan)
5. All 8 gate steps green with screenshot evidence under `ios/build/test-results/sprint-04-e2e/` and `android/app/src/androidTest/screenshots/sprint-04-e2e/`
6. Re-run `/review-red-hat` with all findings closed
7. Human walks the 8-step gate on real iPhone and real Android device with evidence artifacts attached

---

## Agent Reports (Summary)

| Reviewer | Tasks Reviewed | PASS | PARTIAL | FAIL | New HIGH/CRITICAL findings |
|----------|----------------|------|---------|------|---------------------------|
| convex-reviewer | R01, R02, R03, R04, R15, R17 (+ schema cross-cuts) | 4 | 2 | 0 | 4 (RF-22, RF-25, RF-29, RF-30) |
| swift-reviewer | T01/T03/T05/T07/T09a/T10a + R05/R06/R07/R08/R13/R16 | 4 | 2 | 0 | 4 (RF-19/20/21 cross-cut, RF-31/32) |
| kotlin-reviewer | T02/T04/T06/T08/T09b/T10b + R09/R10/R11/R12/R14 | 3 | 3 | 1 | 5 (RF-19/20/21/23/24 cross-cut, RF-26) |

---

## Metadata

- **Agents:** convex-reviewer (Glob/Grep/Read/Bash), swift-reviewer (Glob/Grep/Read/Bash), kotlin-reviewer (Glob/Grep/Read/Bash)
- **Confidence Framework:** HIGH (3+ agents), MEDIUM (2 agents), LOW (1 agent)
- **Report Generated:** 2026-05-03T22:15:00Z
- **Duration:** ~6m parallel dispatch (longest agent: swift-reviewer at 384s)
- **Methodology:** Adversarial red-team review per `~/Projects/brain/docs/ANTI-STUB-REVIEW.md`; AC enumeration with file:line citation; runtime verification via gradlew/grep/git log; cross-agent finding consolidation
- **Next Steps:**
  1. Triage RF-19/20/21/22/23/24 (HIGH/CRITICAL) for Wave-5 remediation
  2. File new task for RF-29 (`v.any()` validators) — never had a remediation task
  3. File new task for RF-31/32/33 (round-1 findings still open after 2 remediation rounds)
  4. Update SPRINT.md status table to reflect actual git state (RF-30, RF-34)
  5. Decision needed on RF-22 R02 index architecture before Wave-5

**Verdict: NEEDS_FIXES — sprint-04 cannot close. 6 of 17 remediation tasks ship with material gaps; 8 human-gate steps cannot be verified end-to-end on either platform.**
