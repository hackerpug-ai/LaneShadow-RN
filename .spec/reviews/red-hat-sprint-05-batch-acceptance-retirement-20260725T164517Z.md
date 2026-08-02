# Red-Hat Review Report

**Report Date**: 2026-07-25T16:45:17Z
**Target**: Sprint 05 — Batch acceptance + retirement (`sprint-05-batch-acceptance-retirement`)
**Reviewed By**: convex-reviewer (domain), test-quality-reviewer (standing seat)
**Test-reality lens**: RAN — implementation + planning hybrid mode (implemented Convex tests audited for oracle strength; gate evidence audited for seed/fixture reality + negative-path observability)
**Gate pre-check (deterministic, skill-emitted)**: 4 auto-findings (see §"Gate Pre-Check Auto-Findings" below)

---

## Executive Summary

The Convex **source code** for REDHAT-FIX-01..06 is largely real and landed — live-scan honesty, runId-bound acceptance, zero-candidate escalation, `retiredAt: null`, OCC guard, top-50 scrub, and **39 of 44 behavioral ACs have implemented integration tests with strong oracles and explicit negative controls**. That work is trustworthy.

**But the sprint's `goal:complete / met:true` claim does not hold.** REDHAT-FIX-07 was marked Complete without any source change: the exact `.take(500)` bug it was chartered to remove is still at `convex/curatedGeometry.ts:1336`, its 5 cited test files do not exist, and `sprint-goal-state.json:132 livePathSilentTake500: false` is directly contradicted by source. On top of that, the Human Testing Gate evidence is **staged, not durable**: `gate-results.json` does not exist at the pinned commit `0b1df54c`, all 8 gate logs and the goal-state are uncommitted working-tree modifications whose committed counterparts reference a different run_id, the cited `.tmp/S5-T4/` artifact directory is **empty**, two function references in the goal-state (`runFullBatchAll`, `coverageReportLivePublic`) are fictional, the operator identity `s4t5-redhatfix07-operator` appears in zero source files, and the same runId was `rejected` 4.5 hours earlier in `prev-cycle2-rejected.json`. The top-50 evidence is contaminated by a test fixture (`motorcycleroads:twist-of-tepusquet-loop` from `seedPoCRoute`) that the scrub predicate cannot catch.

**Verdict: NEEDS_FIXES — the sprint is not done. Sprint 10 unblock should be re-blocked.**

---

## HIGH Confidence Findings (3+ Agents / Deterministic Agree)

- [ ] **F1. REDHAT-FIX-07 is fictionally complete — `.take(500)` still in live path** | Severity: CRITICAL
      Source `convex/curatedGeometry.ts:1336` still contains `.take(500)` in the unscoped live `coverageReport` path (the founder's actual query path) — the exact bug FIX-07 was scoped to remove. `sprint-goal-state.json:132` claims `livePathSilentTake500: false`; the source contradicts this. The founder's accept rationale in `gate-results.json:132` cites this non-existent fix as evidence ("Reconstruct lever is healthy at 76.9%… the take(500) false-zero bug is confirmed fixed").
      Agents: convex-reviewer, test-quality-reviewer, gate-pre-check (oracle provability)
      Evidence: `rg -n "\.take\(500\)" convex/curatedGeometry.ts` → `1336`. `git log -1 --format=%H HEAD` → `b153f675` (no FIX-07 source commit).

- [ ] **F2. REDHAT-FIX-07 has zero test files** | Severity: CRITICAL
      The 5 `REDHATFIX07-*.integration.test.ts` files referenced by FIX-07's TC-1..5 do not exist: `find convex/__tests__ -name "*REDHATFIX07*"` → empty. 5 ACs have no oracle that would fail on regression.
      Agents: convex-reviewer, test-quality-reviewer
      Evidence: FIX-07 task file lines 110/133/157/181/205 cite the 5 paths; `ls convex/__tests__/ | rg -i redhatfix07` → 0 hits.

- [ ] **F3. Gate evidence is not durable — uncommitted + stale pinned commit** | Severity: CRITICAL
      All 8 `gate-logs/step-*.log` + `gate-results.json` + `sprint-goal-state.json` are working-tree modifications. The committed `gate-results.json` at HEAD `b153f675` references a DIFFERENT run (`s5-redhat-gate-20260725T033734Z` / runner `kb-run-human-tests`). The pinned commit `0b1df54c` (per `sprint-goal-state.json:70,117 written_at_commit`) **does not contain `gate-results.json` at all** — `git show 0b1df54c:.../gate-results.json` → fatal. A `git checkout` would erase the "passing" gate.
      Agents: convex-reviewer, test-quality-reviewer, gate-pre-check (evidence rule)
      Evidence: `git status --short | rg gate-results` → modified; `git ls-files .../gate-results.json` → untracked.

- [ ] **F4. `.tmp/S5-T4/` artifact directory is empty — dangling evidence references** | Severity: CRITICAL
      `gate-results.json:71,149` cites `.tmp/S5-T4/coverage-report-accepted.json` and `.tmp/S5-T4/top50-manifest.json`. `ls -la .tmp/S5-T4/` → empty. S5-T4 task file EVIDENCE row also cites `.tmp/S5-T4/founder-gate-packet.json` — does not exist.
      Agents: convex-reviewer, test-quality-reviewer
      Evidence: directory listing.

- [ ] **F5. Fictional function references in goal-state and step-1 log** | Severity: HIGH
      `sprint-goal-state.json:130-131` references `runFullBatchAll` and `coverageReportLivePublic`; `gate-logs/step-1.log:2` claims `"via runFullBatchAll"`. Both symbols are fictional — `rg "runFullBatchAll|coverageReportLivePublic" convex/ scripts/` → 0 hits. Real entry points are `runFullBatch` (`waterfallOrchestrator.ts:1147`) and `coverageReport` (`curatedGeometry.ts:1235`).
      Agents: convex-reviewer, gate-pre-check (executability)
      Evidence: ripgrep across `convex/` and `scripts/`.

- [ ] **F6. `operatorIdentity` is a seed-shaped string, not a real founder** | Severity: HIGH
      `operatorIdentity: "s4t5-redhatfix07-operator"` appears in zero source files and matches the `s4t5-...` test-identity pattern. `requireFounder` (`guards.ts:125`) would throw FORBIDDEN for a non-founder role; no audit trail exists in the repo that a real founder session executed `resolveBatchEscalation(accept)`.
      Agents: convex-reviewer
      Evidence: `rg -l s4t5-redhatfix07-operator` → 0 hits.

- [ ] **F7. Top-50 evidence is contaminated by a test fixture** | Severity: HIGH
      `gate-logs/step-5.log` row #1 (`motorcycleroads:twist-of-tepusquet-loop`, compositeScore 85) is the `seedPoCRoute` fixture defined in `convex/curatedGeometryTestSupport.ts:226`. The scrub predicate `isTestSeedRoute` (`top50Eligibility.ts:34-44`) only matches `test:`/`seed:` prefixes and `Fixture` in name — it does NOT catch fixture routes with real-provider prefixes. Step-6 `contaminationCount: 0` is therefore false.
      Agents: test-quality-reviewer
      Evidence: `rg -n "tepusquet" convex/curatedGeometryTestSupport.ts` → 226.

- [ ] **F8. Same runId rejected 4.5 hours earlier — "honest goal semantics" (FIX-05) violated** | Severity: HIGH
      `s5-full-batch-redhatfix07-20260725T075100Z` is `decision: "rejected"` in `sprint-goal-state.prev-cycle2-rejected.json` (2026-07-25T12:01:44Z) and `decision: "accepted"` in the current `sprint-goal-state.json` (2026-07-25T16:33:23Z). `resolveBatchEscalation` (line 1680) requires `existing.decision === 'escalation_required'` — a prior `rejected` cannot be re-resolved. Either the artifact was deleted/recreated (no transcript) or a fresh `requestBatchAcceptance` ignored the prior rejection.
      Agents: convex-reviewer, gate-pre-check (honest-goal-semantics rule)
      Evidence: side-by-side read of prev-cycle2 vs current goal-state.

---

## MEDIUM Confidence Findings (2 Agents Agree)

- [ ] **F9. Step-7 retirement-candidate review is an empty 5-line blob** | Severity: HIGH
      Working-tree `gate-logs/step-7.log` contains no candidate list — just `{"note":"Retirement unlocked after founder accept; candidates reviewed via listRetirementCandidates (no auto-retire)"}`. SPRINT.md step-7 requires "Review retirement candidates with their per-route failure reasons and all-lever evidence." The oracle is unobservable. Notably the HEAD step-7.log was 63 lines with a real candidate (`motorcycleroads:eklutna-lake-road` + 3 lever reasons) — the working tree **replaced** real evidence with a synthetic note.
      Agents: convex-reviewer, test-quality-reviewer, gate-pre-check (oracle provability)

- [ ] **F10. Step-8 is 6 lines of self-attested booleans** | Severity: MEDIUM
      `gate-logs/step-8.log`: `{"autoRetire": false, "reversible": true, "retirementUnlockedAt": ..., "status": "pass"}`. No row-level evidence, no reversibility test against a real retired route, no `unretireRoute` transcript.
      Agents: convex-reviewer, test-quality-reviewer

- [ ] **F11. Accept and retirement-unlock not independently observed** | Severity: MEDIUM
      `acceptedAt == retirementUnlockedAt == resolvedAtMs == 1784997157931` (same ms). In source (`resolveBatchEscalation` lines 1715-1731) both fields are set in the same `ctx.db.patch`. SPRINT.md gate step 8 ("Confirm nothing auto-retires without explicit Founder-Operator confirmation; verify each committed retirement remains reversible") cannot distinguish "founder accepted, then retirement unlocked" from "retirement auto-unlocked in the same op".
      Agents: convex-reviewer, test-quality-reviewer

- [ ] **F12. Step-6 self-attested contamination while #1 row is a fixture** | Severity: HIGH
      `gate-logs/step-6.log` asserts `contaminationCount: 0, testRowsCount: 0, seedRowsCount: 0` but `gate-logs/step-5.log` row 1 is the `tepusquet` fixture (see F7). The scrub predicate's blind spot makes step-6's "pass" false.
      Agents: test-quality-reviewer, convex-reviewer

- [ ] **F13. `name_routed 415` count is take(500)-shaped** | Severity: MEDIUM
      `ai_reconstructed` and `scraped_promoted` candidateCounts are both 1798; `name_routed` is 415. Total 4011 ≠ processedTotal 5756. 415 is exactly what a take(500)-truncated scan would produce if `name_routed` rows were clustered in one status bucket. Without FIX-07's exhaustive count (see F1), the number is suspect.
      Agents: convex-reviewer

- [ ] **F14. Mixed compositeScore scales in step-5.log** | Severity: MEDIUM
      Rows 1-3 use integer scores (`85`/`78`/`78`); rows ~30+ use decimal scores (`0.8571`/`0.85`/`0.85`). `sortManifestRows` (`top50Review.ts:124`) sorts raw numerically — `85 > 0.8571` is always true, so integer-scored rows rank above decimal-scored rows regardless of true quality. Ranking integrity across the merged list is not internally consistent.
      Agents: convex-reviewer

---

## LOW Confidence Findings (Single Agent)

- [ ] **F15. SPRINT.md "11/11 tasks completed" vs 10-row task table** — FIX-07 is the implicit 11th, added by a planning expansion commit (`b153f675 plan(sprint-05): expand REDHAT-FIX-07`) but never added to the formal table. SPRINT.md line 106 even says `"REDHAT-FIX expansion by /kb-sprint-tasks-plan on 2026-07-25T02:37:45Z (--only REDHAT-FIX-01..06)"` — explicit 01..06, yet FIX-07 exists and is treated as done.
      Agent: convex-reviewer

- [ ] **F16. `cycle: 0` contradicts `prev-cycle1-blocked.json` and `prev-cycle2-rejected.json`** — at least cycle 3. FIX-05 AC was supposed to enforce honest cycle semantics.
      Agent: convex-reviewer

- [ ] **F17. `redhat_fix_07.founder_decision: "rejected"` vs `full_batch.founder_decision: "accepted"` in the same file** — `sprint-goal-state.json` lines 135 vs 167 record the same founder action two different ways.
      Agent: convex-reviewer

- [ ] **F18. Step-2 `source: "persisted"` claim is unverifiable** — no proof the `batch_acceptance_artifacts` row for that runId actually exists in the Convex deployment; no mutation transcript in the repo.
      Agent: convex-reviewer

---

## Gate Pre-Check Auto-Findings (deterministic, skill-emitted per [2.5])

These findings are emitted by the skill itself regardless of what the reviewer agents concluded:

| # | Rule | Finding | Severity |
|---|------|---------|----------|
| G1 | EXECUTABILITY | Step-1 documents execution "via `runFullBatchAll`" — this symbol does not exist in source. The real entry point is `runFullBatch` (`waterfallOrchestrator.ts:1147`) invoked from `scripts/backfill-curated-geometry.ts`. The gate step is **not executable as documented**. | HIGH |
| G2 | ORACLE PROVABILITY | Step-7 asserts "candidates reviewed via `listRetirementCandidates`" with no candidate list and no oracle that can recompute against real output. A step whose oracle cannot resolve is gate-provability theatre. | HIGH |
| G3 | ORACLE PROVABILITY | Step-8 booleans (`autoRetire:false, reversible:true`) have no oracle in source — there is no field, log line, or query whose real output these booleans reflect. | HIGH |
| G4 | EVIDENCE | Sprint claims `goal:complete` / `met:true` (sprint-goal-state.json:114-115) without a fresh passing `gate-results.json` at or after the pinned commit. `git show 0b1df54c:.../gate-results.json` → fatal: path not in commit. The committed version at HEAD references a different run_id (`s5-redhat-gate-20260725T033734Z`). **The gate is unverified as durable.** | HIGH |

---

## Agent Contradictions & Debates

| Topic | convex-reviewer | test-quality-reviewer | Assessment |
|-------|-----------------|----------------------|------------|
| Are the 39 implemented-test ACs trustworthy? | Yes — cites specific assertions and the regressions they would catch | Yes — independently verified strong negative controls (remove-lever, stale-OCC, seed-substitution, step-3≠step-4) | **Agreement**: the implemented Convex tests are real and would catch real regressions. The defect is in FIX-07 + gate evidence, not in FIX-01..06. |
| Top-50 evidence quality | Flagged mixed compositeScore scales (F14) | Flagged fixture contamination (F7) — found the `tepusquet` row in `curatedGeometryTestSupport.ts:226` | **Complementary, not contradictory**: test-quality found the smoking gun; convex-reviewer's scale-mixing observation is consistent with merged real + fixture sources. |
| `name_routed 415` suspicion | "take(500)-shaped" but unverifiable without exhaustive count | Did not specifically address | **Convex-reviewer-only finding** — kept at MEDIUM confidence. |
| Accept/retirement same-ms | "Not independently observable" (MEDIUM) | "Same-ms means single write; PRD requires human observability" (LOW — could be legitimate single-transaction design) | **Agreement on the fact, disagreement on severity**: the discrepancy is whether same-transaction is acceptable design or a gate observability hole. The PRD's "explicit confirmation" language supports the stricter reading. |

---

## AC VERDICT TABLE (consolidated)

21 acceptance criteria across 11 task files. Re-verified against source — the task files' own `[x]` marks were not trusted.

| # | AC Item | Verdict | Evidence |
|---|---------|---------|----------|
| S5-T1 AC-1 | full `--all` batch under cost CB after couch PASS | ⚠️ PARTIAL | `waterfallOrchestrator.ts:1147` (runFullBatch) exists; no transcript of 5756-route run; step-1 cites fictional `runFullBatchAll` |
| S5-T1 AC-2 | coverageReport yields/cost/cursor | ✅ PASS | `curatedGeometry.ts:1235` (FIX-01 honest live-scan return at 1374-1378) |
| S5-T1 AC-3 | accept/reject/escalation bound to live runId | ✅ PASS | `curatedGeometry.ts:1513` requestBatchAcceptance; `:1622` isRunFullBatchProvenance; `:1653` resolveBatchEscalation (FIX-02 applied) |
| S5-T1 AC-4 | far-below lever escalates | ✅ PASS | `curatedGeometry.ts:1457` detectLowYieldEscalations; `:1476-1490` zero-candidate branch (FIX-04 applied) |
| S5-T2 AC-1 | all-lever-failure eligibility + reversible | ✅ PASS | `curatedGeometry.ts:3115` listRetirementCandidates; `:3437` unretireRoute with OCC guard; `retiredAt: null` at 3486 (FIX-06 applied) |
| S5-T3 AC-1 | top-50 by composite rank | ✅ PASS (source) / ⚠️ PARTIAL (evidence) | `top50Review.ts:60` resolveTop50Review; mixed scales + fixture contamination in step-5.log |
| S5-T4 AC-1 | Founder records realized-yield decision | ❌ FAIL | `.tmp/S5-T4/` empty; operatorIdentity is seed-shaped; runId appears in zero committed files |
| S5-T4 AC-2 | far-below escalates not silent complete | ⚠️ PARTIAL | Logic real; accept/retirement same-ms not independently observed |
| S5-T4 AC-3 | top-50 reviewed independently | ⚠️ PARTIAL | 50 rows present but row #1 is a fixture; step-6 self-attested |
| S5-T4 AC-4 | retirement candidates reviewed; no auto-retire | ❌ FAIL | step-7.log is 5 lines with zero candidates; oracle unobservable |
| REDHAT-FIX-01 (4 ACs) | remove live stubs; real `--all` | ✅ PASS | `curatedGeometry.ts:1368-1378`; `__tests__/REDHATFIX01-*.integration.test.ts` exist with "Forbidden stub pair" assertions |
| REDHAT-FIX-02 (4 ACs) | bind acceptance to live runId + provenance | ✅ PASS | Source lines 1521-1525, 1571, 1622, 1688, 1707; 5 test files exist with seed-substitution negative controls |
| REDHAT-FIX-03 (4 ACs) | scrub test:/seed: from retirement candidates | ✅ PASS | `curatedGeometry.ts:3189` + `top50Eligibility.ts:34-44`; 4 test files exist |
| REDHAT-FIX-04 (4 ACs) | zero-candidate lever is escalation | ✅ PASS | `curatedGeometry.ts:1476-1490`; 4 test files exist |
| REDHAT-FIX-05 (4 ACs) | honest goal semantics; no complete-on-reject | ❌ FAIL | Same runId rejected 4.5h earlier in prev-cycle2 then accepted; cycle counter reset to 0; `redhat_fix_07.founder_decision:"rejected"` vs `full_batch.founder_decision:"accepted"` in same file |
| REDHAT-FIX-06 (4 ACs) | retiredAt:null, pagination, OCC | ✅ PASS | `rg "retiredAt:\s*undefined" convex/` → 0 production hits; OCC guard at 3464; 4 test files exist |
| REDHAT-FIX-07 AC-1 | exhaustive lever candidateCount when N>500 | ❌ FAIL | `.take(500)` still at `curatedGeometry.ts:1336`; test file does not exist |
| REDHAT-FIX-07 AC-2 | minority provenances not false-zeroed | ❌ FAIL | Same take(500); test file does not exist |
| REDHAT-FIX-07 AC-3 | test:/seed: purged from unscoped coverageReport | ❌ FAIL | Unscoped scan (1330-1365) does not call `isTestSeedRoute`; test file does not exist |
| REDHAT-FIX-07 AC-4 | prefix-scoped harness counts test: rows; no take(500) | ❌ FAIL | Same take(500); test file does not exist |
| REDHAT-FIX-07 AC-5 | post-fix report is the only valid founder input | ❌ FAIL | The accept rationale cites the non-existent fix as evidence; test file does not exist |

**Completion Gate**: 6 × FAIL + 6 × PARTIAL + 9 × PASS → **NEEDS_FIXES**

---

## Recommendations by Category

1. **Gaps** — Re-open REDHAT-FIX-07. Replace `.take(500)` at `convex/curatedGeometry.ts:1336` with exhaustive pagination (reuse the `listRetirementCandidates:3148-3213` cursor pattern) or an aggregate counter table. Extend `isTestSeedRoute` to the unscoped coverageReport path (currently only `listRetirementCandidates` and `top50Review` scrub). Write the 5 missing `REDHATFIX07-*.integration.test.ts` files; run them RED against the unfixed path, then GREEN after the fix. Do not mark FIX-07 Complete until `rg "take\(500\)" convex/curatedGeometry.ts` returns 0 hits on the live path AND the 5 tests exist and pass.

2. **Risks** — Commit the gate evidence. The current state (uncommitted working tree with stale `written_at_commit` and an empty `.tmp/S5-T4/`) fails the gate-pre-check durability rule (G4). Either commit fresh evidence against the post-fix HEAD and re-pin `written_at_commit`, or re-run `/kb-run-human-tests sprint-05-batch-acceptance-retirement` against the real catalog post-FIX-07 and replace the working-tree logs with real terminal output. Delete the fictional `runFullBatchAll` / `coverageReportLivePublic` references; point step-1.log at the real entry point. Re-block Sprint 10 until FIX-07 is real and the gate is durable.

3. **Assumptions** — Produce a real mutation transcript for `requestBatchAcceptance` and `resolveBatchEscalation` against runId `s5-full-batch-redhatfix07-20260725T075100Z`, including the authenticated founder's user ID. Replace `operatorIdentity: "s4t5-redhatfix07-operator"` with the real founder identity (or document why a test identity was used and whether `requireFounder` was bypassed). Reconcile the same-runId rejected→accepted flip — either show the `escalation_required` intermediate state or admit the accept was a fresh decision that ignored the prior reject. Restore step-7.log to a real candidate list (HEAD had `motorcycleroads:eklutna-lake-road` with 3 lever reasons — explain why it was replaced with a 5-line note).

4. **Contradictions** — Fix the task table to either include FIX-07 formally (making it 11 rows) or stop claiming "11/11" (making it 10/10 with FIX-07 acknowledged as out-of-scope). Resolve the `redhat_fix_07.founder_decision: "rejected"` vs `full_batch.founder_decision: "accepted"` internal contradiction in `sprint-goal-state.json`. Restore the cycle counter to ≥3 or document why it was reset. Normalise the compositeScore scale in step-5.log (single scale, or document the two-scale rendering).

---

## Agent Reports (Summary)

- **convex-reviewer** (domain): 21 AC verdicts, 7 HIGH + 4 MEDIUM + 4 LOW findings. Re-verified all `[x]` marks against source; flagged FIX-07 fictional completion, fictional function references, stale pinned commit, empty `.tmp/S5-T4/`, seed-shaped operatorIdentity, mixed compositeScore scales.
- **test-quality-reviewer** (standing seat): 3 audits run (oracle strength / seed-fixture reality / negative-path). 39 of 44 ACs have strong implemented-test oracles with explicit negative controls (remove-lever, stale-OCC, seed-substitution, step-3≠step-4). 5 ACs (REDHAT-FIX-07) have zero tests. Found the `tepusquet` fixture contamination in step-5.log row #1. Confirmed gate evidence is uncommitted and undurable.

---

## Metadata

- **Agents**:
  - `convex-reviewer` (auto-selected per AGENTS.md "Convex tasks → convex-reviewer") — tools: Glob, Grep, Read, Bash
  - `test-quality-reviewer` (standing seat — mandatory portfolio lens) — tools: Glob, Grep, Read, Bash
- **Confidence Framework**: HIGH (3+ agents or deterministic skill-emitted), MEDIUM (2 agents), LOW (1 agent)
- **Gate pre-check**: 4 deterministic auto-findings (G1-G4) merged per skill [2.5]
- **Report Generated**: 2026-07-25T16:45:17Z
- **Duration**: ~15m (parallel dispatch)
- **Next Steps**: [Remediate REDHAT-FIX-07 + commit durable gate evidence | Re-block Sprint 10 | Re-run `/review-red-hat` after remediation]
