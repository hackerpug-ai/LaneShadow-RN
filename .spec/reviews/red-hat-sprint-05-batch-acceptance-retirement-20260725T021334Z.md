# Red-Hat Review Report

**Report Date**: 2026-07-25T02:13:34Z
**Target**: Sprint 05 — Batch acceptance + retirement (`sprint-05-batch-acceptance-retirement`)
**Target Path**: `.spec/prds/route-agent-quality/tasks/sprint-05-batch-acceptance-retirement/`
**Claimed Status**: `Completed` / `goal: complete` / `met: true` / human-test 8/8 PASS / e2e PASS
**Reviewed By**: `convex-reviewer`, `test-quality-reviewer`, `product-manager`
**Test-reality lens**: ran (IMPLEMENTED mode — integration tests + committed gate evidence audited; no live mutation/probe execution)
**Verdict**: **NEEDS_REVISION (BLOCK)** — the sprint's headline claim ("real, un-seeded full-batch acceptance packet" producing an "accepted catalog") is **not supported by the committed evidence.** Convergent CRITICAL findings from all three reviewers.

---

## Executive Summary

The sprint's *machinery* is genuinely built — retirement eligibility, explicit confirmation, reversible un-retire, top-50 fail-closed review, and the escalation/lock state machine are real and largely PASS on their own merits, and the S5-T1/T2/T3 integration tests carry strong oracles. **But the sprint's *headline outcome* is unsupported.** Three independent reviewers converged on the same core defect: the founder's acceptance decision was computed against a **seeded** coverage report (`candidateCount: 10/10/10`, the `s5t1-low-yield-reconstruct` fixture shape) that **contradicts the only live coverage report in the packet** (`candidateCount: 119/0/0`, `totalCostUSD: 0`). No real `--all` batch was executed for the gate (zero provider-call/cost evidence), the retirement-candidate export is **94% `test:s4t5-passed-*` seed rows**, and the batch was **REJECTED** yet the sprint is marked `goal: complete`. Sprint 10's prerequisite (an *accepted* catalog) does not exist. A code-level escalation bypass (zero-candidate levers silently skip the floor check → auto-accept/unlock on live data) makes the live path strictly less safe than the seeded evidence suggests.

---

## Gate Pre-Check (deterministic, skill-emitted — source: `gate-pre-check`)

The Human Testing Gate pre-check ran against `SPRINT.md` §"Human Testing Gate" + `gate-results.json` + `gate-logs/step-{1..8}.log`.

- **Executability**: PASS — all referenced entry points resolve (`scripts/backfill-curated-geometry.ts`, `scripts/geometry-coverage-report.ts`, `scripts/top-50-curated-review.ts`, `reviewQueue:listGeometryReviewQueue`; `package.json` scripts `test`/`type-check`/`convex:dev`/`lint` exist). Oracle symbols resolve in source (`escalation_required` setter `curatedGeometry.ts:1494`; `retireRoute` `:2912`; `unretireRoute` `:2992`; `retirementUnlockedAt` schema field; `contaminationCount`/`reviewedRowCount` in `top50Review.ts`).
- **Freshness**: PASS — `gate-results.json` (`recorded_at` 2026-07-25T01:44:24Z) postdates the last source-changing commit (`0b1df54c` GATE-FIX, 2026-07-25T01:43:12Z) by ~1 min. The trailing `055321d1` status-sync commit changed only spec/status files.
- **Non-empty result / oracle provability**: **FAILS** — emits the following auto-findings (merged below, source `gate-pre-check`):
  - **GF-1 (HIGH)** Data contradiction: `gate-logs/step-2.log` (live coverageReport) shows reconstruct/reroute `candidateCount: 0`, but `gate-logs/step-3.log` + `gate-results.json` acceptance artifact shows `candidateCount: 10` per lever. The acceptance decision was computed against numbers that do not match the real coverageReport.
  - **GF-2 (HIGH)** Test/seed contamination: `gate-logs/step-7.log` (retirement candidate list) contains 47 `test:s4t5-passed-*` seed rows (47 of 50 candidates). Violates S5-T4 AC-1 `must_not_observe: "acceptance packet containing routeId prefix 'test:' or 'seed:'"`.
  - **GF-3 (HIGH)** Gate-provability hole: `gate-logs/step-5.log` / `step-6.log` are aggregate-only (`{contaminationCount:0, reviewedRowCount:50, status:pass}` / `{testRows:0, rowCount:50}`). The gate step "Review top-50 … for correct road and plausible length" asserts a human road-correctness oracle that is **unobservable** from aggregate counts — no row-level verdicts, scores, or road identities.
  - **GF-4 (MEDIUM)** `totalCostUSD: 0` on a claimed real `--all` full batch (`step-2.log`). S5-T1 AC-1 `must_observe: totalCostUSD > 0`; AC-4 requires cost reconciliation.
  - **GF-5 (MEDIUM)** `terminalStates.unresolved: 500` while `isDone: true` (`step-2.log`) — internal contradiction.
  - **GF-6 (MEDIUM)** `gate-logs/step-3.log` and `step-4.log` are **byte-identical** — step 4 ("confirm far-below escalates") re-displays step 3's artifact; not an independent negative control.
  - **GF-7 (MEDIUM)** Gate semantics vs outcome: gate titled "Founder-Operator **ACCEPTS** the full batch" but recorded `resolve.decision: "rejected"`; sprint marked `goal: complete`.

---

## HIGH Confidence Findings (3 Agents Agree)

- [ ] **F1. SEED_SUBSTITUTION — acceptance decided against fixture data, not the live catalog.** Severity: **CRITICAL**.
      The founder's coverageReport (`gate-logs/step-2.log`, `source:"live"`) reports promote=119 / reconstruct=0 / reroute=0 candidates. The acceptance artifact (`gate-logs/step-3.log`, `gate-results.json`, `runId:"s5t4-live-acceptance"`) reports promote=10 / reconstruct=10 / reroute=10 — the exact `s5t1-low-yield-reconstruct` fixture shape. `requestBatchAcceptance` reads the persisted report by `runId` (`curatedGeometry.ts:1451-1456`) while the human read the un-scoped live query (`runId:null`). The "live" runId is mislabeled — the decision's per-lever numbers contradict the only live report in the packet. Violates S5-T4 AC-1 `must_observe` and the sprint's central Never-tier constraint.
      Agents: `convex-reviewer`, `test-quality-reviewer`, `product-manager`

- [ ] **F2. No real `--all` batch was executed for the gate.** Severity: **CRITICAL**.
      `totalCostUSD: 0` (`step-2.log`) is hardcoded on the live branch (`curatedGeometry.ts:1335`). A grep across all `.tmp/route-agent-quality/sprint-05/*.log` for `pageCostUSD|cumulativeCost|cost_exceeded|provider` returns **zero hits** — no transcript of `scripts/backfill-curated-geometry.ts --all`, no provider calls, no cost accounting. `isDone:true` is hardcoded (`curatedGeometry.ts:1333`). The "complete real `--all` batch" deliverable has no execution evidence.
      Agents: `convex-reviewer`, `test-quality-reviewer`, `product-manager`

- [ ] **F3. Test/seed contamination of the acceptance packet.** Severity: **HIGH**.
      `gate-logs/step-7.log` (retirement candidate export, part of the acceptance packet per the Human Test Deliverable) contains exactly 50 rows: **47 are `test:s4t5-passed-*`** and only 3 are real (`motorcycleroads:*`). 94% seed contamination. The GATE-FIX that scrubbed `test:` rows from the top-50 surface (step-6 `testRows:0`) was **not** applied to the retirement-candidate export. Violates S5-T4 AC-1 `must_not_observe: "acceptance packet containing routeId prefix 'test:' or 'seed:'"` and the EVIDENCE GATE "no route IDs match test/seed prefixes."
      Agents: `convex-reviewer`, `test-quality-reviewer`, `product-manager`

---

## MEDIUM Confidence Findings (2 Agents Agree)

- [ ] **F4. Scope-dishonest `goal: complete` on a REJECTED batch.** Severity: **CRITICAL**.
      The gate is literally titled "The Founder-Operator **ACCEPTS** the full batch" (`SPRINT.md:33`); the Overview promises "an **accepted**, auditable full-batch catalog"; S5-T4 Success State requires "the **accepted catalog** is the input to Sprint 10" (`S5-T4.md:44`). The recorded outcome is `resolve.decision: "rejected"`, retirement `locked: true`. Marking a rejected-batch sprint `goal: complete / met: true` papers over a failed acceptance with a process-green.
      Agents: `product-manager`, `convex-reviewer` (Gap #10)

- [ ] **F5. Weak/absent negative control — gate step-4 is byte-identical to step-3.** Severity: **HIGH**.
      `gate-logs/step-3.log` and `step-4.log` are bit-for-bit identical (same `observedRates`, same `runId`, same `reason`). The step labeled "Confirm far-below lever escalates rather than silently completing" did not mutate `decision='accepted'` and show rejection — it re-displayed the prior artifact. No genuine negative control was exercised in the human evidence.
      Agents: `test-quality-reviewer`, `convex-reviewer`

- [ ] **F6. Aggregate-only top-50 evidence — the human road-review oracle is unobservable (GF-3).** Severity: **HIGH**.
      `step-5.log` / `step-6.log` are pure aggregate counts. The integration test (`S5T3-top-50-review`) proves the *review mechanism* on 10 seeded rows; it does **not** constitute evidence that a human eyeballed the real 50 roads for road identity / plausible length / duplicate headliner. The committed evidence cannot substantiate S5-T4 AC-3.
      Agents: `test-quality-reviewer`, `gate-pre-check`

---

## LOW Confidence Findings (Single Agent — still significant)

- [ ] **F7. Escalation bypass on live data — zero-candidate levers silently skip the floor check.** Severity: **CRITICAL**. Agent: `convex-reviewer`
      `detectLowYieldEscalations` skips any lever with `candidateCount <= 0` (`curatedGeometry.ts:1424`). The real catalog has reconstruct/reroute `candidateCount: 0`, so on **live** data the escalation that "protects" retirement **never fires** → decision would be `accepted` → `retirementUnlockedAt` set. The seeded 10-candidate escalation masks a real auto-unlock path. The lock is correct *given an escalation fires*; on live data none fires.

- [ ] **F8. `operatorIdentity` and `decision.timestamp` ABSENT from the acceptance artifact.** Severity: **HIGH**. Agent: `product-manager`
      S5-T4 AC-1 `must_observe` requires `decision.timestamp` (ISO) and `operatorIdentity` (len ≥ 1). The `accept` block has `acceptedAt: null` and no timestamp/identity field; `operatorIdentity` appears nowhere in any gate log. Gate step-3 was marked `pass` without validating these contract fields. A decision artifact without an attested operator/time is not auditable.

- [ ] **F9. Escalating on a 0/0 (undefined) rate is mathematically unsound.** Severity: **HIGH**. Agent: `product-manager`
      The live report has reconstruct `candidateCount: 0`; a realized rate of 0/0 is undefined, not "0.0%". The escalation reason "reconstruct realized rate 0.0% is below escalation floor 40%" is invalid against the live data. (Only meaningful against the seeded 10-candidate fixture — see F1.)

- [ ] **F10. Live `coverageReport` hardcodes `isDone:true` + `totalCostUSD:0` (semantic stub).** Severity: **HIGH**. Agent: `convex-reviewer`
      `curatedGeometry.ts:1330-1344` live branch returns `source:'live', isDone:true, continueCursor:null, totalCostUSD:0` regardless of catalog state. Any operator reading the un-scoped query is misinformed about batch completeness/cost — directly enables S5-T1 AC-4 `must_not_observe: "acceptance of a partial report."`

- [ ] **F11. `unresolved: 500` + `isDone: true` contradiction.** Severity: **HIGH**. Agent: `convex-reviewer` (confirmed by `gate-pre-check` GF-5)
      All 500 routes unresolved while the batch claims complete — a point-in-time scan mislabeled as a completed batch.

- [ ] **F12. `retiredAt: undefined` patch idiom — fragile, systemic.** Severity: **MEDIUM**. Agent: `convex-reviewer`
      `unretireRoute` (`curatedGeometry.ts:3022`) and 9 other files rely on Convex `patch` deleting the field via `undefined`, contrary to the Convex guideline "undefined is not a valid Convex value." Should be `null`. Latent break risk on a Convex upgrade.

- [ ] **F13. `listRetirementCandidates` read amplification — approaching the 16MB limit.** Severity: **MEDIUM**. Agent: `convex-reviewer`
      Scans up to 800 rows × 4 statuses + per-row artifact/geometry reads. The coverage query already logged a WARN at 14.35MB / 16.77MB limit (`03-coverage-report.log:2`).

- [ ] **F14. `unretireRoute` has no concurrency guard.** Severity: **MEDIUM**. Agent: `convex-reviewer`
      Concurrent retire/unretire on one route is last-writer-wins (no OCC token). Low practical risk (founder-only) but not OCC-safe.

- [ ] **F15. `requestBatchAcceptance` has no provenance check tying a coverage_report to a real `runFullBatch`.** Severity: **LOW**. Agent: `convex-reviewer`
      Any caller with founder identity can `persistCoverageReport`-seed a report and then accept it — the mechanism behind F1.

- [ ] **F16. top-50 `rowCount: 50` vs coverageReport `riderReadyCount: 17` internal inconsistency.** Severity: **HIGH**. Agent: `convex-reviewer`
      Either the top-50 surface ran against a different/older catalog state, or riderReady accounting diverges between the two queries. Gate internal coherence cannot be established from committed evidence.

- [ ] **F17. Sprint 10 dependency is broken.** Severity: **CRITICAL**. Agent: `product-manager`
      Sprint 10 needs an *accepted* rider-ready catalog for the SLC/Ogden Saturday arc. The real catalog has **17 rider-ready routes total** with levers 2/3 producing zero candidates; the batch was rejected with retirement locked. Sprint 10 is blocked by a rejected gate that has been marked complete — invisible to a downstream planner reading `status: Completed`.

---

## Agent Contradictions & Debates

| Topic | Agent A | Agent B | Assessment |
|-------|---------|---------|------------|
| Retirement lock integrity | `convex-reviewer`: lock is sound — no path for rejected/unresolved-escalation to set `retirementUnlockedAt` (`curatedGeometry.ts:1531,1584` only set on accept) | `convex-reviewer` (separate finding F7): on live data with zero-candidate levers, no escalation fires so the lock is never engaged → auto-accept/unlock | **Not a contradiction** — consistent. The lock is correct *given an escalation fires*; F7 shows the live path never triggers one. The bypass is upstream of the lock. |
| S5-T2 / S5-T3 mechanism quality | `convex-reviewer` + `test-quality-reviewer`: retirement + top-50 *logic* and *integration tests* are genuinely strong (PASS) | `product-manager`: focused on scope/evidence, did not contest mechanism quality | **Agreement** — the machinery is real; the defects are in S5-T1 batch-execution reality and S5-T4 gate-evidence integrity. |

The panel converged sharply. No material contradictions; the only "debate" is two framings of the same lock behavior at different layers.

---

## Recommendations by Category

1. **Gaps** (F1, F2, F3, F8, F15): Re-run the gate against a **genuinely un-seeded catalog**. Execute the real `--all` batch (`pnpm tsx scripts/backfill-curated-geometry.ts --all`) to `isDone=true` with `totalCostUSD > 0` and a non-null cursor transcript. Unify one `runId` across step-2 (read) and step-3 (accept); delete the seeded `s5t4-live-acceptance` artifact. Add `operatorIdentity` + `decision.timestamp` to the acceptance artifact. Purge `test:` rows from the retirement-candidate export (apply the same GATE-FIX treatment step-6 got). Add a provenance check tying `coverage_report` artifacts to a real `runFullBatch` invocation.

2. **Risks** (F7, F10, F11, F16): Fix `detectLowYieldEscalations` so a lever with `candidateCount===0` whose assumption expects non-zero yield does not silently pass (treat as an inspection/escalation signal). Stop hardcoding `isDone:true`/`totalCostUSD:0` on the live `coverageReport` branch. Reconcile top-50 `rowCount` vs `riderReadyCount`.

3. **Assumptions** (F4, F9, F17): Re-label the sprint status — `Completed` → `process_verified_batch_rejected` or `blocked`; reconcile `goal: complete` with `resolve.decision: "rejected"`. Do not escalate on an undefined 0/0 rate. Flag Sprint 10 as blocked (no accepted catalog exists). If rejection is an acceptable terminal outcome, rename the gate to "RECORDS a decision" rather than "ACCEPTS."

4. **Contradictions** (F5, F6): Re-run gate step-4 as a genuine negative control (mutate `decision='accepted'` while low-yield is unresolved; show rejection). Capture row-level top-50 verdicts (route IDs, road identity, measured-vs-claimed length) so the human road-review oracle is observable, not just an aggregate `{testRows:0}`.

5. **Lower priority** (F12, F13, F14): Replace `retiredAt: undefined` with `retiredAt: null` across the 10 call sites. Add an index/pagination to `listRetirementCandidates` to stay clear of the 16MB read limit. Add an OCC token to `unretireRoute`.

---

## AC Verdict Roll-Up (from `convex-reviewer` — full table in agent report)

| Task | AC | Verdict | Headline reason |
|------|----|---------|-----------------|
| S5-T1 | AC-1 | ⚠️ PARTIAL | Couch gate real; but the `--all` batch never ran for the gate (`totalCostUSD:0`, no transcript) |
| S5-T1 | AC-2 | ✅ PASS (logic) / ⚠️ evidence | Assumption-handling correct; realized numbers superseded by seeded data at acceptance |
| S5-T1 | AC-3 | ❌ FAIL (evidence) | Escalation logic correct but the escalation in evidence is a seeded artifact masking a live auto-unlock path |
| S5-T1 | AC-4 | ⚠️ PARTIAL | Resume/cursor logic present; incomplete-run negative control never exercised on real data; live query hardcodes `isDone:true` |
| S5-T2 | AC-1..4 | ✅ PASS (AC-4 ⚠️ idiom) | Eligibility / confirmation / surface / reversibility genuinely sound; `retiredAt: undefined` idiom fragile |
| S5-T3 | AC-1..3 | ✅ PASS | Index-driven manifest, local render boundary, fail-closed review all real |
| S5-T4 | AC-1 | ❌ FAIL | "real un-seeded catalog" claim false; acceptance ran against seeded report |
| S5-T4 | AC-2 | ❌ FAIL | Escalation evidence non-representative of live catalog; live path silently completes |
| S5-T4 | AC-3 | ⚠️ PARTIAL | Review logic sound; evidence coherence FAIL (rowCount 50 vs riderReady 17; aggregate-only oracle) |
| S5-T4 | AC-4 | ⚠️ PARTIAL | Process correct; candidate lever-evidence provenance unverifiable (no real batch ran) |

**Completion gate: 5 ❌ FAIL + 6 ⚠️ PARTIAL → NEEDS_REVISION (BLOCK).**

---

## Agent Reports (Summary)

- **`convex-reviewer`**: 7 HIGH / 5 MEDIUM / 2 LOW findings. Traced F1/F2/F3 to exact file:line. Refuted the "retirement lock bypass via reject/escalate paths" hypothesis (lock is sound) but surfaced a worse bypass (F7: zero-candidate levers skip escalation entirely). Verdict: NEEDS_FIXES (BLOCK).
- **`test-quality-reviewer`** (standing seat): 4 HIGH / 2 MED / 0 LOW. Confirmed integration-test oracles for S5-T1/T2/T3 are genuinely **strong** (assert specific levers, rates, exclusions, real negative controls) — defects are NOT in test logic. The defects are in the **committed human-gate evidence** (SEED_SUBSTITUTION, contamination, $0 cost on injected seams, byte-identical step-3/4, aggregate-only review). Verdict: NEEDS_FIXES.
- **`product-manager`**: 8 HIGH / 0 MED / 1 LOW (informational). Scope-honesty lens: `goal: complete` on a rejected batch is scope-dishonest; `operatorIdentity`/`decision.timestamp` MUST_OBSERVE fields absent; escalation on 0/0 undefined rate unsound; Sprint 10 dependency broken. Verdict: REQUEST CHANGES.

---

## Metadata

- **Agents**: `convex-reviewer` (Convex domain, derived from `convex-implementer` per `AGENTS.md`), `test-quality-reviewer` (mandatory standing seat — test-reality lens), `product-manager` (S5-T4 packet-completeness assignment). All validated in roster; all carry Glob/Grep/Read.
- **Confidence Framework**: HIGH (3 agents agree), MEDIUM (2 agents), LOW (1 agent). Gate-pre-check skill-emitted findings count as a confirming source.
- **Report Generated**: 2026-07-25T02:13:34Z
- **Target commit**: `055321d1` (status-sync, claimed goal achieved); source HEAD `0b1df54c` (GATE-FIX).
- **Gate pre-check**: executability PASS · freshness PASS · non-empty-result/oracle-provability **FAIL** (GF-1..GF-7).
- **Next Steps**: [Remediate F1–F6 (blockers) → re-run the real `--all` batch → re-execute the human gate against a genuinely un-seeded catalog with one unified runId → re-review | Re-scope gate language if rejection is an acceptable terminal | Flag Sprint 10 blocked]
