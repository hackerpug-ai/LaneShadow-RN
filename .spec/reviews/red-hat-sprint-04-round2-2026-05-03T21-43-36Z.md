# Red-Hat Review Report — Sprint 04 Remediation Round 2

**Report Date:** 2026-05-03T21:43:36Z
**Target:** Sprint 04 Conversational Planning Loop — Post-Remediation Status
**Prior Review:** `red-hat-sprint-04-2026-05-03T14-19-50Z.md` (35 findings, verdict: NOT code-complete)
**Reviewed By:** convex-reviewer, swift-reviewer, kotlin-reviewer (parallel dispatch, adversarial red-hat)

---

## Executive Summary

**Sprint 04 remediation has made measurable but insufficient progress.** Of 14 remediation tasks, only 4 have been merged (R01, R03, R04, R05), closing 6 of 35 original findings. The 3 CRITICAL runtime-fatal findings from round 1 are partially addressed — iOS can now reach `db.routeEnrichments:list` (R01 merged) and RouteDetailsScreen viewState is no longer hardcoded empty (R05 merged) — but the backend endpoint for saved-route fingerprint checking (R02) remains unmerged, iOS tests for R05 crash at runtime, and Android remediation is substantially incomplete with 4 of 5 tasks never started.

**The human testing gate still cannot pass.** Of the 8 gate steps, zero have automated E2E coverage on either platform (R08 iOS and R12 Android are both not started). Phase-name taxonomy is unaligned on both platforms (R06, R11 not started). Android cross-platform template parity sits at 0% (R10 not started). The R09 Android route card tap fix that was marked APPROVED by its reviewer is test theatre — tests assert against controlled state overrides, not real Compose behavior.

**Remediation merge status: 4 merged, 1 ready but unmerged (R02), 2 with code but unmerged (R06 empty, R09 test theatre), 7 not started.**

---

## Remediation Task Status

### MERGED (4/14)

| Task | Title | Round-2 Verdict | Notes |
|------|-------|-----------------|-------|
| CHAT-S04-R01 | `db.routeEnrichments.list` reactive query | **PASS** — all 5 ACs satisfied | Index-backed, ownership-checked, chronologically sorted |
| CHAT-S04-R03 | Auth taxonomy + IDOR fix | **NEEDS_FIXES** — AC-7 failed | IDOR closed, auth taxonomy aligned, but `auth-error-taxonomy.json` fixture not emitted |
| CHAT-S04-R04 | Remove fetchWeather stub + fix updateSessionTitle | **PASS** — all 6 ACs satisfied | Stub removed, clerkUserId bug fixed |
| CHAT-S04-R05 | iOS RouteDetailsScreen viewState live wiring | **PARTIAL** — logic correct, tests crash | Polylines decoded, isBest derived, timeRange formatted; but xcodebuild test crashes before verification |

### UNMERGED WITH CODE (2/14)

| Task | Title | Round-2 Verdict | Notes |
|------|-------|-----------------|-------|
| CHAT-S04-R02 | `db.savedRoutes.getRouteIndexFingerprint` | **PASS** (worktree) — all 6 ACs satisfied in worktree code | Ready to merge; blocks iOS "already-saved" badge |
| CHAT-S04-R09 | Android RouteResultsScreen tap + recall | **FAIL** — test theatre, APPROVED verdict unjustified | All 6 ACs use stateOverride bypass or assert local data, not Compose semantics |

### NOT STARTED (8/14)

| Task | Title | Round-2 Verdict | Notes |
|------|-------|-----------------|-------|
| CHAT-S04-R06 | iOS phase name alignment | **FAIL** — worktree empty, no Phase enum | Zero commits beyond main |
| CHAT-S04-R07 | iOS story ID normalization | **FAIL** — mixed legacy/canonical formats persist | Task never started |
| CHAT-S04-R08 | iOS XCUITest E2E suite (8 gate steps) | **FAIL** — no XCUITest files exist | Zero E2E coverage |
| CHAT-S04-R10 | Android AppStories registration (~36 stories) | **FAIL** — `AppStories.kt` returns `emptyList()` | 0% template parity |
| CHAT-S04-R11 | Android phase name alignment | **FAIL** — no Phase enum exists | Task never started |
| CHAT-S04-R12 | Android instrumented E2E suite (8 gate steps) | **FAIL** — no E2E test files exist | Zero E2E coverage |
| CHAT-S04-R13 | iOS LaneShadowErrorMapper + FORBIDDEN case | **FAIL** — no .forbidden case, no fixture test | Task never started |
| CHAT-S04-R14 | Android LaneShadowErrorMapper + FORBIDDEN case | **FAIL** — KnownErrorCodes missing FORBIDDEN | Task never started |

---

## HIGH Confidence Findings (3+ Agents Agree)

- [ ] **RF-01: Sprint-04 human gate still cannot pass.** All three reviewers independently confirm zero automated E2E coverage on either platform (R08, R12 not started). 4 of 8 gate steps had runtime/visual failures in round 1; only partial fixes merged. Phase names still wrong on both platforms. | Severity: **CRITICAL**
      Agents: convex-reviewer, swift-reviewer, kotlin-reviewer

- [ ] **RF-02: R09 APPROVED verdict is unjustified — test theatre.** kotlin-reviewer found all 6 ACs use `stateOverride` test path that bypasses ViewModel logic, or assert local Kotlin data variables instead of Compose semantics stateDescription. The reviewer who approved R09 did not detect this. | Severity: **CRITICAL**
      Agents: kotlin-reviewer, swift-reviewer (cross-platform concern on test patterns)

- [ ] **RF-03: Phase-name taxonomy unaligned on both platforms.** Neither R06 (iOS) nor R11 (Android) has been started. iOS uses freeform String `currentPhase` with no enum; Android has no Phase enum either. Human gate step 2 will not show canonical labels `parsing/searching/drafting/enriching/finalizing`. | Severity: **HIGH**
      Agents: swift-reviewer, kotlin-reviewer, convex-reviewer (spec alignment)

- [ ] **RF-04: Cross-platform template parity at 0% for Android.** `AppStories.kt:13` still returns `emptyList()`. R10 not started. `pnpm snapshots:check` would show 100% `ios_only` for all sprint-04 templates. | Severity: **HIGH**
      Agents: kotlin-reviewer, swift-reviewer (parity contract)

---

## MEDIUM Confidence Findings (2 Agents Agree)

- [ ] **RF-05: R02 ready to merge but blocking iOS "already-saved" badge.** convex-reviewer verified the worktree implementation passes all 6 ACs with correct index-backed lookup and soft-delete filtering. Must merge to unblock iOS RouteDetails saved-state rendering. | Severity: **HIGH**
      Agents: convex-reviewer, swift-reviewer

- [ ] **RF-06: R05 merged but iOS tests crash — runtime verification gap.** swift-reviewer reports `xcodebuild test` crashes with "signal kill before establishing connection" in RouteDetailsScreenViewStateTests. Logic appears correct from code review but cannot be verified at runtime. | Severity: **HIGH**
      Agents: swift-reviewer, kotlin-reviewer (parallel concern on test stability)

- [ ] **RF-07: R03 AC-7 fixture missing — blocks R13/R14.** The `auth-error-taxonomy.json` fixture was specified in R03 but never emitted. Without it, mobile mapper tasks (R13, R14) have no fixture to consume. | Severity: **MEDIUM**
      Agents: convex-reviewer, swift-reviewer (R13 blocked), kotlin-reviewer (R14 blocked)

- [ ] **RF-08: FORBIDDEN error code missing from both mobile platforms.** R03 added `FORBIDDEN` to the server error taxonomy, but neither iOS (no `.forbidden` case) nor Android (KnownErrorCodes missing `FORBIDDEN`) handles it. R13 and R14 not started. | Severity: **MEDIUM**
      Agents: swift-reviewer, kotlin-reviewer

---

## LOW Confidence Findings (Single Agent)

### From convex-reviewer
- [ ] **RF-09: F-13 still open** — `completeEnrichment` silent no-op when `enrichments` arg absent. Row stays PENDING forever. Not addressed by any remediation task. | Severity: MEDIUM
- [ ] **RF-10: F-14 still open** — `v.any()` return validators on `routePlans.getPlanById` and `sessionMessages.list`. Type safety lost end-to-end. Not addressed by any remediation task. | Severity: LOW
- [ ] **RF-11: R02 schema index field path may mismatch** — schema defines index on `routeIndex.routeFingerprint` but code queries with `args.routeIndex` (a string). Runtime index usage unverified. | Severity: MEDIUM

### From swift-reviewer
- [ ] **RF-12: F-19 still open** — IdleScreen.swift:131,139,150 still use `Color.blue.opacity()` literals instead of `wx.rain` tokens. Not addressed. | Severity: MEDIUM
- [ ] **RF-13: F-20 still open** — LSPhaseIndicator.swift:52 still uses `.heading.sm` instead of `.opinion.md`. Not addressed. | Severity: MEDIUM
- [ ] **RF-14: F-22 still open** — ErrorScreen still uses heuristic string matching instead of typed LaneShadowError dispatch. Not addressed. | Severity: MEDIUM
- [ ] **RF-15: F-34 still open** — `handleRideThisTap` empty body with misleading comment. Not addressed. | Severity: LOW

### From kotlin-reviewer
- [ ] **RF-16: F-28 still open** — `RideFlowState.Error` does not implement `WithSession`, creating fragile special-case branching. | Severity: MEDIUM
- [ ] **RF-17: F-27 unresolved** — `gradlew test` has 16-17 baseline failures. Not verified with `git stash && rerun` proof. | Severity: HIGH
- [ ] **RF-18: F-25 still open** — LSPhaseIndicator raw `6.dp` head-dot literal, LSNavigatorMessage raw `6.dp` attachment spacing. | Severity: LOW

---

## Original Findings Closure Status

| Original Finding | Severity | Round-2 Status | Closed By |
|-----------------|----------|----------------|-----------|
| F-01: Sprint NOT code-complete | CRITICAL | **STILL OPEN** | — |
| F-02: No real-device E2E | HIGH | **STILL OPEN** | — (R08, R12 not started) |
| F-03: Sprint metadata misleading | HIGH | **PARTIALLY CLOSED** | R01/R03/R04/R05 merged, but 10 tasks still open |
| F-04: Android Unauthenticated never fires | HIGH | **CLOSED** | R03 (guards.ts now throws structured codes) |
| F-05: No TDD RED evidence | MEDIUM | **STILL OPEN** | — |
| F-06: Phase-name taxonomy mismatch | MEDIUM | **STILL OPEN** | — (R06, R11 not started) |
| F-07: `db/routeEnrichments:list` missing | CRITICAL | **CLOSED** | R01 merged |
| F-08: `db/savedRoutes:getRouteIndexFingerprint` missing | CRITICAL | **PARTIALLY CLOSED** | R02 implemented but not merged |
| F-09: IDOR on getActiveRoutePlansForSession | HIGH | **CLOSED** | R03 merged |
| F-10: Android phantom `db/planningSessions:list` | HIGH | **NOT RE-VERIFIED** | — |
| F-11: fetchWeather stub exposed | MEDIUM | **CLOSED** | R04 merged |
| F-12: updateSessionTitle broken | MEDIUM | **CLOSED** | R04 merged |
| F-13: completeEnrichment silent no-op | MEDIUM | **STILL OPEN** | — |
| F-14: v.any() return validators | LOW | **STILL OPEN** | — |
| F-15: Android AppStories emptyList() | HIGH | **STILL OPEN** | — (R10 not started) |
| F-16: iOS story ID split | MEDIUM | **STILL OPEN** | — (R07 not started) |
| F-17: iOS RouteDetails viewState stubs | CRITICAL | **PARTIALLY CLOSED** | R05 merged but tests crash |
| F-18: Android route card tap dropped | CRITICAL | **NOT CLOSED** | R09 test theatre, not real fix |
| F-19: Color.blue.opacity literals | MEDIUM | **STILL OPEN** | — |
| F-20: LSPhaseIndicator typography | MEDIUM | **STILL OPEN** | — |
| F-21: Android showWarningChrome missing | MEDIUM | **STILL OPEN** | — |
| F-22: iOS ErrorScreen string matching | MEDIUM | **STILL OPEN** | — |
| F-23: iOS LSNavigatorMessage pin order | LOW | **NOT RE-VERIFIED** | — |
| F-24: Android hardcoded Big Sur camera | LOW | **STILL OPEN** | — |
| F-25: Android raw 6.dp literals | LOW | **STILL OPEN** | — |
| F-26: REQUIREMENT-CONTRACT stale | HIGH | **NOT RE-VERIFIED** | — |
| F-27: gradlew baseline failures | HIGH | **STILL OPEN** | — |
| F-28: RideFlowState.Error WithSession | MEDIUM | **STILL OPEN** | — |
| F-29: cancelActivePlan swallows errors | LOW | **NOT RE-VERIFIED** | — |
| F-30: detekt LoginSmokeTest blocker | LOW | **NOT RE-VERIFIED** | — |
| F-31: T03 sandbox gate unchecked | MEDIUM | **STILL OPEN** | — |
| F-32: T01 unverifiable baseline reference | MEDIUM | **NOT RE-VERIFIED** | — |
| F-33: iOS ChatStore cancelActivePlan catch | MEDIUM | **NOT RE-VERIFIED** | — |
| F-34: handleRideThisTap empty body | LOW | **STILL OPEN** | — |
| F-35: Alt polyline promotion not rendered | MEDIUM | **NOT RE-VERIFIED** | — |

**Closed: 4 (F-04, F-07, F-09, F-11, F-12)**
**Partially closed: 3 (F-03, F-08, F-17)**
**Still open: 22**
**Not re-verified: 6**

---

## Sprint Gate Coverage — 8 Human Test Steps (Re-assessed)

| Step | Round-1 Status | Round-2 Status | Delta |
|------|---------------|----------------|-------|
| 1. Chip tap → optimistic message → reconciled | MANUAL | **MANUAL** | No change (no E2E suite) |
| 2. LSPhaseIndicator canonical phases | FAILS | **FAILS** | No change (R06, R11 not started) |
| 3. RouteResults: 3 polylines + 3 cards | FAILS Android | **FAILS Android** | R09 test theatre, not real fix |
| 4. RouteDetails: instruments + weather | FAILS iOS | **PARTIAL iOS** | R01 + R05 merged but tests crash; R02 not merged |
| 5. Alt route card tap → polyline promotes | FAILS both | **FAILS both** | No change |
| 6. Cancel mid-planning → return to Idle | MANUAL | **MANUAL** | No change (no E2E suite) |
| 7. Refine via chat → same sessionId | MANUAL | **MANUAL** | No change (no E2E suite) |
| 8. Planning failure → ErrorScreen | FAILS auth path | **FAILS auth path** | R03 closed server side, but R13/R14 not started on mobile |

**Still 4 of 8 gate steps with runtime/visual failures. Zero steps have automated E2E verification.**

---

## Agent Contradictions & Debates

| Topic | kotlin-reviewer (R09) | Prior R09 Reviewer | Assessment |
|-------|----------------------|-------------------|------------|
| R09 test quality | FAIL — all 6 ACs are test theatre (stateOverride bypass, local data assertions) | APPROVED — 9 review cycles, verdict APPROVED | **kotlin-reviewer correct.** The prior reviewer approved tests that assert against controlled test doubles, not real Compose semantics. The `stateOverride` path bypasses ViewModel logic entirely. This is a subagent fabrication risk documented in the project's CLAUDE.md. |

| Topic | convex-reviewer (R02) | swift-reviewer (R02) | Assessment |
|-------|----------------------|---------------------|------------|
| R02 merge readiness | PASS — all 6 ACs satisfied in worktree | PARTIAL — schema index field path may mismatch | **Both valid.** Code logic is correct, but runtime index usage is unverified. Merge is the right call, with a follow-up verification. |

---

## Recommendations

### Immediate (blocks sprint closure)

1. **Merge R02** — worktree code is correct, blocks iOS "already-saved" badge
2. **Fix R05 test crash** — investigate xcodebuild test crash, get runtime verification passing
3. **Rewrite R09 tests** — reject test theatre, require Compose semantics assertions against real ViewModel behavior, not stateOverride doubles
4. **Emit R03 AC-7 fixture** — create `convex/__fixtures__/auth-error-taxonomy.json`
5. **Implement R06** — iOS phase-name canonical enum (blocking gate step 2)
6. **Implement R11** — Android phase-name canonical enum (blocking gate step 2)
7. **Implement R10** — Android AppStories registration (blocking parity gate)

### Required for gate (must land before human test)

8. **Implement R08** — iOS XCUITest E2E suite (8 gate steps)
9. **Implement R12** — Android instrumented E2E suite (8 gate steps)
10. **Implement R13** — iOS FORBIDDEN error case + fixture test
11. **Implement R14** — Android FORBIDDEN error case + fixture test

### Process integrity

12. **Verify R09 prior reviewer** — the 9-cycle APPROVED verdict for test theatre suggests the reviewer agent was not adversarial enough. This is a documented subagent fabrication pattern.
13. **Run `git stash && rerun` proof** for Android baseline test failures (F-27)
14. **Run `pnpm snapshots:check`** to surface parity gaps

### Technical debt (post-sprint)

15. **Address F-13** — `completeEnrichment` silent no-op (decision needed: by-design or bug?)
16. **Address F-14** — Replace `v.any()` return validators with explicit shapes
17. **Address F-19, F-20, F-25** — Token/typography/literal alignment

---

## Agent Reports (Summary)

- **convex-reviewer:** R01 PASS, R03 NEEDS_FIXES (AC-7 fixture), R04 PASS, R02 PASS (worktree). 2 open findings (F-13, F-14). Convex build passes.
- **swift-reviewer:** R05 PARTIAL (logic correct, tests crash), R06 FAIL (not started), R07 FAIL (not started), R08 FAIL (not started), R13 FAIL (not started). 8 original findings still open on iOS.
- **kotlin-reviewer:** R09 FAIL (test theatre, APPROVED unjustified), R10 FAIL (not started), R11 FAIL (not started), R12 FAIL (not started), R14 FAIL (not started). 5 original findings still open on Android.

---

## Metadata

- **Prior Review:** `.spec/reviews/red-hat-sprint-04-2026-05-03T14-19-50Z.md`
- **Remediation Tasks Created:** 14 (CHAT-S04-R01 through R14)
- **Merged:** 4 (R01, R03, R04, R05)
- **Ready to Merge:** 1 (R02)
- **Needs Rewrite:** 1 (R09 — test theatre)
- **Not Started:** 8 (R06, R07, R08, R10, R11, R12, R13, R14)
- **Original Findings Closed:** 5 of 35
- **Original Findings Partially Closed:** 3 of 35
- **Reviewers:** convex-reviewer, swift-reviewer, kotlin-reviewer (parallel, ~3-5 min each)
- **Confidence Framework:** HIGH (3+ agents), MEDIUM (2 agents), LOW (1 agent)

---

## Final Verdict

**Code-complete: NO.**

Sprint 04 remediation made real progress on the backend — 3 of 4 Convex remediations are correctly merged (R01, R03, R04), closing the IDOR vulnerability, the missing routeEnrichments endpoint, the fetchWeather stub, and the updateSessionTitle bug. iOS RouteDetails viewState is no longer hardcoded empty (R05).

But the remediation is **incomplete at 29% merge rate (4/14)**, and the remaining 10 tasks are where the integration surface lives:
- Zero E2E coverage on either platform
- Phase-name taxonomy unaligned on both platforms
- Android template parity at 0%
- Android route card tap fix is test theatre
- FORBIDDEN error case missing from both mobile platforms

**The human testing gate remains blocked.** Sprint-05 should not dispatch until at minimum R02 (merge), R06, R08, R10, R11, R12, R09 (rewrite), R13, R14 are complete.
