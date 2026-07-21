---
sprint: 4
slug: sprint-04-trust-pipeline
sequence: 4
timeline: Phase 2
status: Awaiting Close
prd: .spec/prds/route-agent-quality/README.md
prd_version: 3.1.1
roadmap: .spec/prds/route-agent-quality/ROADMAP.md
generated_by: kb-sprint-tasks-plan
generated: 2026-07-14T00:00:00Z
tasks_expanded: 2026-07-14
---

# Sprint 04: Trust pipeline

**Sequence:** 4
**Timeline:** Phase 2
**Status:** Awaiting Close
> Progress: 7/7 tasks completed · updated 2026-07-19T23:02:46Z
> Status-Note: REDHAT-FIX 01/02/04/05/09/11 all implemented + verified (314/314). Prior 2026-07-19 gate closeout WITHDRAWN as forged (used lever2FixedGeometry seam under s4-human-gate, not real providers). Re-audit run 2026-07-20T205404Z: steps 1-2 honest real-provider PASS, steps 6/8 code-verified, steps 3-5 + 7 BLOCKED on real catalog data + human Founder-Operator couch review (S4-T7). GATE-GOAL: ACHIEVED not met — requires real ~25-route catalog load + founder review.
**Proposed by:** product-manager + convex-planner (lane) + aisdk-planner (lever-2 structured output)

## Overview

The phase-sliced "trust pipeline": the deterministic geometry gate hardened to full (VER-01),
the bounded LLM repair round (VER-02), the three recovery levers (Lever 1 promote, Lever 2
reconstruct, Lever 3 re-route), the cross-provider ride-worthiness classifier (VER-03), the
resumable `--sample` waterfall with a cost circuit-breaker and a REVIEW queue (REC-04 sample,
VER-04), and the founder couch-sample gate (VER-05) — all on real Google + LLM APIs, closing on
one couch human gate so the full `--all` batch (Sprint 05) can be unlocked.

The gate is the single source of truth for ALL geometry admission (specified in UC-VER-01,
invoked by every lever — never re-implemented per lever): ratio = routed / claimed within
0.6–1.6; ≥2 anchors each within 150 mi of the route centroid; reject degenerate (≤4 points or
<1 point/mi); applied to all geometry going forward including a pre-existing-rows sweep; ratio
skipped in favor of the degenerate + region checks when the claimed length is quarantined
(null/outlier) so the routed length becomes the stored truth.

The three levers run in order (promote → reconstruct → re-route) until one produces a
gate-passing geometry, recording provenance (`scraped_promoted` / `ai_reconstructed` /
`name_routed`): Lever 1 promotes validated in-row scraped polylines at $0 (no LLM/geocode);
Lever 2 reconstructs from turn-by-turn descriptions via LLM-extracted ordered anchors →
region-biased geocode → route-through-waypoints → gate, with structured outputs through the
Mastra model layer established in Sprint 02; Lever 3 re-routes from endpoint/road-name
structure deterministically (no LLM). Gate-failing reconstructions get a bounded repair (≤2
attempts, geocode log + measured lengths fed back, keep the better of the two by ratio
distance), then land in the REVIEW queue. The ride-worthiness classifier runs across the whole
catalog on a DIFFERENT provider than anchor extraction, recording a `ride`/`marginal`/
`not_a_ride` verdict as stored evidence (never a transient read-time decision; `not_a_ride`
withholds rider-ready; `marginal` never auto-retires).

The `--sample` waterfall is resumable (skip already-PASSed on restart), cost-capped
(`--max-cost` circuit-breaker + rate-limit/backoff, ~$0.07/reconstructed route), and ends every
processed route in exactly one terminal state. The couch-sample gate (VER-05) assembles a ~25
stratified sample spanning all three provenance types, renders each recovered line on a map
with its provenance + measured-vs-claimed lengths, and the founder records a per-route verdict
(true / off / wrong) and an overall pass/fail — a single `wrong` (fabricated-but-passing line)
forces fail, and the driver refuses `--all` until the couch verdict is recorded as pass. That
couch PASS is the deterministic unlock for the full `--all` batch in Sprint 05.

**Built on the spikes:** the gate module + reconstruct-one path + persist/recompute seam are the
Sprint 01 reference implementations (hardened to full here, not rebuilt); the Mastra model layer
+ z.ai structured-output proof are the Sprint 02 foundation the Lever 2 anchors + repair round
extractions resolve through; the cleaned claimed lengths from Sprint 03 are what the ratio gate
calibrates against. Enrichment-PRD `06-external-dependencies.md` re-ratification (Sprint 02,
T-AGT-024) is the cross-PRD prerequisite already discharged before this sprint's structured
outputs land.

## Human Testing Gate

**Gate:** The Founder-Operator reviews the ~25 rendered couch-sample lines and records the passing verdict that unlocks the full batch.

### Human Test Deliverable

A founder-reviewed ~25-route couch sample, stratified across all three provenance types
(`scraped_promoted` / `ai_reconstructed` / `name_routed`) and a range of reconstruction
difficulty, each recovered line rendered as a map PNG alongside its provenance and measured-vs-
claimed lengths. The founder records a per-route verdict (`true` / `off` / `wrong`) and an
overall pass/fail — a single `wrong` (a fabricated-but-gate-passing line) forces the verdict
red, and the batch driver refuses `--all` until the couch verdict is recorded as pass. The
founder also dispositions three REVIEW-queue items (approve / retry / retire) so the fail-closed
adjudication path is exercised on real failures. The lever waterfall runs as a `--sample` batch
on real Google Geocoding/Routes + the real geometry/orchestrator LLM tiers; every processed route
ends in exactly one terminal state.

### Test Steps

1. Run the lever waterfall as a `--sample` batch on real Google + LLM APIs.
2. Confirm each processed route ends in exactly one terminal state.
3. Open the ~25-route couch sample rendered as map PNGs.
4. Record `true`, `off`, or `wrong` for each sampled route.
5. Record an overall pass or fail verdict.
6. Confirm a single `wrong` verdict forces the gate red.
7. Disposition three REVIEW-queue items: approve, retry, retire.
8. Confirm the driver refuses `--all` until the couch verdict passes.

## Tasks

| ID | Title | Agent | Estimate |
|----|-------|-------|----------|
| S4-T1 | Deterministic geometry gate (VER-01 full: ratio band, anchor/region, degenerate, pre-existing sweep, quarantine ratio-skip) + bounded LLM repair round (VER-02) | convex-implementer | 210 min |
| S4-T2 | Lever 1 promote (`scraped_promoted`, $0) + Lever 3 re-route (`name_routed`) deterministic paths (REC-01, REC-03) | convex-implementer | 180 min |
| S4-T3 | Lever 2 reconstruct (`ai_reconstructed`) LLM anchors → geocode → route → gate, structured outputs via the model layer (REC-02) | convex-implementer | 180 min |
| S4-T4 | Cross-provider ride-worthiness classifier stored as evidence (VER-03) | convex-implementer | 150 min |
| S4-T5 | Resumable `--sample` waterfall + cost circuit-breaker + rate-limit/backoff + REVIEW queue with dispositions (REC-04 sample, T-REC-019, VER-04) | convex-implementer | 210 min |
| S4-T6 | Couch-sample assembler (~25 stratified) + `recordCouchVerdict` + `couchGateStatus --all` block (VER-05 AC-1..5) | convex-implementer | 150 min |
| S4-T7 | Review rendered couch-sample lines + record verdicts (couch gate); disposition REVIEW-queue items | Founder-Operator | 45 min |
| REDHAT-FIX-01 | Re-run closeout without `lever2FixedGeometry`, using live-provider provenance and recovered catalog routes; cited `.gate-evidence/2026-07-19T22:59:46Z/scripts/step1.sh:4-11` | convex-implementer | 120 min |
| REDHAT-FIX-02 | Implement bounded/paginated whole-catalog `classifyCatalog` enumeration with checkpointing and completion coverage; cited `convex/actions/rideWorthinessClassifier.ts:226-265` | convex-implementer | 120 min |
| REDHAT-FIX-03 | Bind founder couch approval to an authenticated immutable real sample/export manifest with reviewer identity, hashes, route decisions, and notes; cited `.gate-evidence/2026-07-19T22:59:46Z/scripts/step3.sh:6-35` and `step4.sh:5-18` | convex-implementer | 120 min |
| REDHAT-FIX-04 | Require exact unique sample membership, authorization, and snapshot/version binding before couch PASS can unlock `--all`; cited `convex/couchVerdict.ts:51-101,128-145` | convex-implementer | 120 min |
| REDHAT-FIX-05 | Make REVIEW approval re-run the canonical geometry gate and prevent automatic rider-ready on failing geometry; cited `convex/reviewQueue.ts:235-292` | convex-implementer | 90 min |
| REDHAT-FIX-06 | Enforce founder/operator authorization for REVIEW and couch operational mutations using canonical role/ownership checks; cited `convex/guards.ts:15-28`, `convex/reviewQueue.ts:236-239,317-320`, `convex/couchVerdict.ts:51-58,151-156` | convex-implementer | 90 min |
| REDHAT-FIX-07 | Enforce in-region anchor validity in the canonical geometry verdict for every lever, not only existing-geometry reevaluation; cited `convex/curatedGeometryGate.ts:99-128,146-183` | convex-implementer | 90 min |
| REDHAT-FIX-08 | Remove or founder/operator-gate public fixture and cleanup seams so authenticated callers cannot manufacture or erase production trust evidence; cited `convex/reviewQueue.ts:96-224`, `convex/couchSampleAssembler.ts:356-423`, `convex/waterfallOrchestrator.ts:249-372`, `convex/couchVerdict.ts:157-169` | convex-implementer | 120 min |
| REDHAT-FIX-09 | Make waterfall terminal-state, retry, and provider-cost accounting durable and fail-closed across Lever 3 exceptions and cost limits; cited `convex/waterfallOrchestrator.ts:518-526,586-607,695-718,759-785` | convex-implementer | 120 min |
| REDHAT-FIX-10 | Bind stored couch samples to real route records, unique exact membership, gate-passing geometry, and immutable export metadata; cited `convex/couchSampleAssembler.ts:523-580`, `convex/schema.ts:326-348` | convex-implementer | 120 min |
| REDHAT-FIX-11 | Record and enforce the freeway/rescue-first geometry attempt required before classifier completion, with persisted coverage evidence; cited `convex/actions/rideWorthinessClassifier.ts:249-279` | convex-implementer | 120 min |
| REDHAT-FIX-12 | Rebuild founder/live-provider gate evidence harness so goal-state cannot claim completion from stale/forged bundles OR forged completion inputs — no caller-controlled `steps`/`founderVerdict`/`headCommit`/optional-bundle authority; founder attestation resolved only from `couchGateStatus.allowed`-bound authenticated durable `couch_verdicts` records (exact sampleId/manifestHash/catalogVersion, non-test operator identity), HEAD computed internally, a committed evidence manifest mandatory and resolved from immutable HEAD-blob content with per-file freshness and realpath containment, step PASS claims substantiated against it, generator provenance a two-object attested_source_commit/attestation_commit contract (CRITICAL/HIGH/MEDIUM, third refresh per fresh red-hat review 2026-07-21T005254Z: manifest/artifacts still caller-controlled via working-tree reads + directory-level freshness, artifact path traversal, founder attestation unbound to the live active-manifest gate, impossible self-HEAD-equality provenance); cited `tools/gate/deriveGoalState.ts:212-298,340-355,396-439,486-567`, `.spec/reviews/red-hat-sprint-04-trust-pipeline-20260721T005254Z.md` | convex-implementer | 360 min |
| REDHAT-FIX-13 | Require operator/internal authorization for provider-costing waterfall and classifier operations; cited `convex/waterfallOrchestrator.ts:809`, `convex/couchVerdict.ts:454`, `convex/actions/rideWorthinessClassifier.ts:315,365` | convex-implementer | 120 min |
| REDHAT-FIX-14 | Require operator authorization for active couch-manifest rotation and make active-manifest selection an explicit transition; cited `convex/couchSampleAssembler.ts:619`, `convex/couchVerdict.ts:188-191` | convex-implementer | 120 min |
| REDHAT-FIX-15 | Invalidate an active couch PASS on live catalog/geometry drift since freeze; cited `convex/couchSampleAssembler.ts:663`, `convex/couchVerdict.ts:203-219` | convex-implementer | 135 min |
| REDHAT-FIX-16 | Fail-closed handling + operator migration/re-freeze for legacy couch manifests missing a complete `routeHashes` baseline (HIGH, fresh red-hat review 2026-07-20T221805Z); cited `convex/couchVerdict.ts:227-247` (`routeHashes ?? []` bypass), `convex/schema.ts:373-375` | convex-implementer | 135 min |

## Dependencies

- **Blocks:** Sprint 05 (Batch acceptance + retirement), Sprint 06 (Rider-ready surface)
- **Dependent on:** Sprint 01 (gate module + reconstruct seam), Sprint 03 (cleaned claimed lengths)

## PRD Coverage

- UC-REC-01/02/03/04(sample), UC-VER-01/02/03/04/05 · criteria T-REC-001..012/019, T-VER-001..019 (incl. T-VER-016, T-VER-018 human-gates)

## Capability Coverage

- CAP-GEO-01: lever-2 reconstruction (full pipeline)
- CAP-GEO-02: lever-1 promotion
- CAP-GEO-05: couch-sample gate (sample export → founder verdict → batch unlock)
- CAP-GEO-06: lever-3 reroute

## Source Coverage

- UC-REC-01: Promote validated in-row scraped polylines (Lever 1, `scraped_promoted`, $0, gate-gated)
- UC-REC-02: Reconstruct geometry from turn-by-turn descriptions (Lever 2, `ai_reconstructed`, LLM anchors → geocode → route → gate via the Mastra model layer)
- UC-REC-03: Re-route from endpoints or road names (Lever 3, `name_routed`, deterministic, gate-gated)
- UC-REC-04 (sample): Orchestrate the resumable rescue waterfall — `--sample` batch, provenance, resume, cost cap (`--max-cost` circuit-breaker + rate-limit/backoff), exactly-one-terminal-state, per-lever/per-state counts
- UC-VER-01: Enforce the deterministic geometry gate (ratio 0.6–1.6, ≥2 anchors within 150 mi, degenerate rejection, pre-existing sweep, quarantine ratio-skip) — the single source of truth invoked by every lever
- UC-VER-02: Run the bounded LLM repair round (≤2 attempts, geocode-log + measured-length feedback, keep-better, then REVIEW)
- UC-VER-03: Classify ride-worthiness across the whole catalog (cross-provider LLM verdict stored as evidence; `not_a_ride` withholds rider-ready; `marginal` never auto-retires)
- UC-VER-04: Hold gate failures in a REVIEW queue (fail-closed, founder dispositions approve/retry/retire, recorded)
- UC-VER-05: Gate the full batch on a founder couch-sample (~25 stratified, per-route true/off/wrong, single `wrong` forces fail, `--all` blocked until pass)
- Criteria T-REC-001..012/019, T-VER-001..019 (incl. T-VER-016, T-VER-018 human-gates)
- TR 11-e2e-testing §1 (service integration tier)

## Blocks

- Sprint 05 Batch acceptance + retirement — couch PASS is the deterministic unlock for the full `--all` batch.
- Sprint 06 Rider-ready surface — the rider-ready flag semantics + provenance the surface renders are produced here.

## Task Detail Files

Generated by /kb-sprint-tasks-plan on 2026-07-14 (specialist-authored: convex-planner [lane] + aisdk-planner [S4-T3 lever-2 structured output]; single backend domain, no design planner). Fakeability audit: 0 CRITICAL across all 7 tasks (`validate_scenario`); T4 fully clean (0 HIGH). Avg quality ≈ 110/115 (TEST TIER COMPLIANCE met — PRIMARY AC integration, 0 fakeable scenarios).

- S4-T1-deterministic-geometry-gate-ver-01-full-ratio-band-anchor.md
- S4-T2-lever-1-promote-scraped-promoted-0-lever-3-re-route-name-r.md
- S4-T3-lever-2-reconstruct-ai-reconstructed-llm-anchors-geocode-r.md
- S4-T4-cross-provider-ride-worthiness-classifier-stored-as-eviden.md
- S4-T5-resumable-sample-waterfall-cost-circuit-breaker-rate-limit.md
- S4-T6-couch-sample-assembler-25-stratified-recordcouchverdict-co.md
- S4-T7-review-rendered-couch-sample-lines-record-verdicts-couch-g.md

REDHAT-FIX-12..15 added by /kb-sprint-tasks-plan on 2026-07-20 in response to the fresh red-hat review `.spec/reviews/red-hat-sprint-04-trust-pipeline-20260720T205905Z.md` (specialist-authored: convex-planner; append mode, no re-expansion of S4-T1..T7 or REDHAT-FIX-01..11). Covers the 4 unresolved CRITICAL/HIGH findings: stale/forged founder gate-evidence bundle, missing operator authorization on provider-costing operations, missing operator authorization on active couch-manifest rotation, and no live catalog/geometry drift invalidation of an active couch PASS.

- REDHAT-FIX-12-rebuild-founder-live-provider-gate-evidence-harness.md
- REDHAT-FIX-13-operator-authorization-provider-costing-operations.md
- REDHAT-FIX-14-operator-authorized-active-manifest-rotation.md
- REDHAT-FIX-15-live-catalog-geometry-drift-invalidation.md

REDHAT-FIX-12 refreshed + REDHAT-FIX-16 added by /kb-sprint-tasks-plan on 2026-07-20 in response to the fresh red-hat review `.spec/reviews/red-hat-sprint-04-trust-pipeline-20260720T221805Z.md` (specialist-authored: convex-planner; targeted refresh of one task + one new task, no re-expansion of S4-T1..T7, REDHAT-FIX-01..11, or REDHAT-FIX-13..15). That review found the sprint's prior closeout **not accepted** (`needs-revision`): REDHAT-FIX-12's anti-forgery harness (`tools/gate/deriveGoalState.ts` + its integration test) was never actually built — the tracked `sprint-goal-state.json` is an honest hand-authored BLOCKED sentinel, not a machine-derived, fail-closed artifact, and the retained forged `.gate-evidence/2026-07-19T22:59:46Z` bundle still carries the removed `lever2FixedGeometry` seam and bare `s4-human-gate` identity untested against the current surface. Separately, `couchGateStatus` was found to treat a legacy frozen manifest with no persisted `routeHashes` as drift-free (`routeHashes ?? []` skips the drift loop), letting a pre-FIX-15 PASS unlock `--all` with zero live geometry revalidation.

- **REDHAT-FIX-12 (REFRESHED, same task ID — precision gap closed, not re-authored from scratch):** the existing charter already required the writer + stale-bundle/seam/identity rejection, but its one behavioral AC for "rebuilt step scripts" (AC-3) only exercised step4 (`recordCouchVerdict`) and step7 (disposition) — not step3 (couch export) or step5 (`getCouchVerdict`), despite the OUTCOME/SCOPE promising all four. Added AC-5 (+TC-8/TC-9) covering step3/step5, with an explicit constraint that step5's control cannot be a FORBIDDEN check (it's `requireIdentity`, not `requireOperator`, in current source — asserting otherwise would force an out-of-scope guard change). Estimate 150→165 min.
- **REDHAT-FIX-16 (NEW):** fail-closed handling for a legacy couch manifest missing a complete `routeHashes` baseline (missing/empty/incomplete/duplicate), plus an operator-authorized migration/re-freeze path that does not silently inherit the old PASS verdict — mirrors REDHAT-FIX-14's explicit-activation pattern so a fresh activation + fresh `recordCouchVerdict(pass)` is required before `--all` unlocks again. A non-legacy complete-baseline no-drift manifest is proven unaffected (no REDHAT-FIX-15 happy-path regression).

Both tasks passed the mandatory fakeability audit (`tools/validate-scenario/validate_scenario.py`) clean — zero CRITICAL/HIGH — after one round-trip: the first-pass scenarios had 7 (FIX-12) and 3 (FIX-16) violations (WEAK_ORACLE/NEG_OBSERVE_WEAK/NEG_CONTROL_WEAK — weak oracles with no concrete anchor, missing empty/start-signature negatives, negative controls not naming a stub/mock/empty failure mode); convex-planner corrected the flagged scenarios verbatim, re-verified at 0/115 CRITICAL+HIGH.

The MEDIUM finding (catalog-eligibility-fingerprint scope narrower than documented, on REDHAT-FIX-15) and LOW finding (REDHAT-FIX-13's operator-authorization test coverage exercises only one of four provider operations past authorization) are **explicitly out of scope** for this refresh — the review did not require them for CRITICAL/HIGH contract precision, and folding them in was assessed as unnecessary scope creep.

**The Founder-Operator/live-provider human gate (S4-T7) remains an external, unresolved, human-owned blocker — unchanged by this refresh.** Neither REDHAT-FIX-12 nor REDHAT-FIX-16 claims, simulates, or reduces the scope of that gate; `sprint-goal-state.json` still correctly reports `met:false` / `gate.overall:"BLOCKED"` pending a real ~25-route catalog load and a genuine Founder-Operator visual review + disposition of three REVIEW-queue items. No evidence of that human review has been manufactured by this task-planning pass.

- REDHAT-FIX-16-legacy-couch-manifest-fail-closed-migration.md

REDHAT-FIX-12 refreshed a second time by /kb-sprint-tasks-plan on 2026-07-20 in response to the fresh red-hat review `.spec/reviews/red-hat-sprint-04-trust-pipeline-20260720T233411Z.md` (specialist-authored: convex-planner; targeted refresh of one task, same TASK_ID, no re-expansion of S4-T1..T7 or any other REDHAT-FIX-*). That review found the sprint **not accepted for closeout** (`needs-revision`): the FIX-12 writer's own completion predicate — not just its script coverage — remained forgeable. `DeriveOptions` accepted caller-controlled `steps`, `headCommit`, `bundlePath`, and `founderVerdict` from an arbitrary JSON file/CLI args; `founderVerdict` was trusted verbatim as `opts.founderVerdict === true`; `headCommit` defaulted to a caller override (`opts.headCommit || headCommit()`); and `validateBundle` short-circuited a missing bundle directory to `{ok:true}` and never gated on captured-commit-vs-HEAD as a pass/fail check. A black-box reproduction at reviewed HEAD (`a39c5850`) — an all-PASS step-results JSON with `founderVerdict:true` and no/clean bundle — produced `met:true`, `GATE-GOAL: ACHIEVED`, exit 0, with no founder record, live-provider call, or valid evidence (CRITICAL, re-opened). Separately, the bundle-validation gap meant a clean-but-stale or untracked bundle also passed (HIGH), and the checked-in `sprint-goal-state.json`'s `generator.head_commit` did not match reviewed HEAD, sourced from an ephemeral `/tmp/...` input (MEDIUM).

- **REDHAT-FIX-12 (REFRESHED a second time, same task ID — completion-authority hardening, not just script rebuild):** AC-1..AC-5 / TC-1..TC-9 preserved verbatim. Added AC-6..AC-10 / TC-10..TC-17 closing all three findings: AC-6 removes the caller `founderVerdict` boolean as completion authority — the writer now resolves the founder/S4-T7 attestation ONLY from authenticated durable `couch_verdicts` rows (operator-recorded via `recordCouchVerdict`, read via `getCouchVerdict`/`couchGateStatus`); AC-7 removes caller-controlled `headCommit` — HEAD is computed internally via `git rev-parse HEAD` and a forged `--head-commit` has zero effect; AC-8 makes the committed evidence manifest MANDATORY (not optional) — missing, untracked (not git-tracked), and clean-but-stale (captured commit ≠ internal HEAD) bundles are each rejected fail-closed, closing the HIGH finding; AC-9 requires every step's PASS claim be substantiated against the manifest's enumerated per-step artifacts, so a tampered/altered step-results JSON (a BLOCKED step flipped to PASS) is inert; AC-10 closes the MEDIUM finding — `generator.head_commit` must equal the actual current HEAD (never a stale/parent commit) and the input-manifest reference must be repository-relative and immutable (never an ephemeral `/tmp/...` path). Adversarial test coverage spans all six forgery vectors named in the review: missing bundle, untracked bundle, clean-but-stale bundle, forged/bogus CLI `--head-commit`, tampered step-results JSON, and an arbitrary `founderVerdict:true` flag with no real S4-T7 record. Estimate 165→225 min (EFFORT M→L).

This refresh passed the mandatory fakeability audit (`tools/validate-scenario/validate_scenario.py`) clean — zero CRITICAL/HIGH across all 10 scenarios — after two correction round-trips with convex-planner (first pass: 4 WEAK_ORACLE violations, vague must_observe assertions with no concrete anchor; second pass, after the AC set was substantially reworded: 3 further WEAK_ORACLE violations on inequality-only assertions lacking a concrete anchor, mechanically tightened to match the already-passing AC-2 phrasing pattern). Every `requirements[]` entry (AC-1..AC-10, TC-1..TC-17 — 27 total) carries a stable, gapless, non-duplicated ID.

**REDHAT-FIX-16 is preserved as FIXED and untouched** — the review confirmed its focused live Convex-dev test passed and made no finding against it; this refresh does not modify `convex/couchVerdict.ts` or `convex/couchSampleAssembler.ts`, only imports/calls their existing public read APIs.

**The Founder-Operator/live-provider human gate (S4-T7) remains an external, unresolved, human-owned blocker — unchanged by this refresh.** REDHAT-FIX-12 does not claim, simulate, or reduce the scope of that gate; a genuine "pass" can only be produced by a real seeded call through the operator-gated `recordCouchVerdict` mutation, never a JSON flag, CLI arg, or raw insert. No evidence of the human S4-T7 review has been manufactured by this task-planning pass, and `sprint-goal-state.json` continues to correctly report `met:false` pending both this remediation being implemented AND a genuine Founder-Operator review of a real ~25-route catalog.

REDHAT-FIX-12 refreshed a third time by /kb-sprint-tasks-plan on 2026-07-21 in response to the fresh independent red-hat review `.spec/reviews/red-hat-sprint-04-trust-pipeline-20260721T005254Z.md` (specialist-authored: convex-planner; targeted refresh of one task, same TASK_ID, no re-expansion of S4-T1..T7 or any other REDHAT-FIX-*). That review confirmed AC-1..AC-9 FIXED (both focused live Convex-dev suites passed) but found the sprint **still not accepted for closeout** (`needs-revision`): (1) CRITICAL — `validateBundle`/`loadManifest` read the manifest via `readFileSync` off the live working tree with no HEAD-blob binding, and froze freshness at bundle-DIRECTORY-level `git log -1`, so two isolated real-git reproductions (a manifest modified only in the working tree; a stale manifest+artifact laundered by an unrelated new bundle file at HEAD) both returned `validateBundle:{ok:true}` / `substantiateSteps:null`; (2) CRITICAL — `substantiateSteps`'s `posix.join(bundleRel, art)` normalizes `..` with no containment check, so a manifest declaring `artifacts:["../../package.json"]` (tracked but unrelated) was accepted as substantiation; (3) HIGH — `resolveFounderVerdict` called `getCouchVerdict({})` (the latest of up to 50 verdicts across ALL samples) and never called `couchGateStatus`, so a historic/inactive pass (including from a test/development operator) could satisfy `founder.present` even while the authoritative `couchGateStatus.allowed` gate was blocked; (4) MEDIUM — AC-10's self-HEAD-equality claim was semantically impossible for an ordinary follow-up commit (a file cannot record the hash of the commit that will contain it).

- **REDHAT-FIX-12 (REFRESHED a third time, same task ID — content-binding, containment, and attestation-scope hardening):** AC-1..AC-9 / TC-1..TC-16 preserved byte-for-byte (independently confirmed FIXED by the fresh review's passing suite). AC-10/TC-17 revised in place — replaced the impossible self-HEAD-equality claim with an explicit two-object provenance contract (`generator.attested_source_commit` = the internally-computed reviewed HEAD; `attestation_commit` = the sentinel's later carrying commit, verified via `git merge-base --is-ancestor` to be a STRICT descendant, never equal). Added AC-11 (manifest/artifacts resolved from immutable HEAD-blob content, never a working-tree `readFileSync`, with PER-FILE freshness — each required file's own last-touch commit, not the bundle directory's — closing both CRITICAL reproductions), AC-12 (realpath artifact containment before any git-tracking check, rejecting `../` traversal to an out-of-bundle tracked file), and AC-13 (founder attestation resolved ONLY from `couchGateStatus.allowed===true` for the CURRENT active manifest, bound to its exact `sampleId`/`manifestHash`/`catalogVersion` via a matching `getCouchVerdict({sampleId})` row recorded by a real `requireOperator`-authorized non-test, non-bare identity — never `getCouchVerdict({})`'s latest-across-all-samples row; a historic/inactive/legacy-drifted pass now yields `met:false`/`human_test.verdict:'pending'`). `requireOperator`'s role set (`founder` OR `operator`) is preserved as the legitimate S4-T7 reviewer set, consistent with this sprint's own "Founder-Operator" human-gate framing — AC-13 does not narrow it to `founder` alone. Estimate 225→360 min (EFFORT L→XL).

This refresh passed the mandatory fakeability audit (`tools/validate-scenario/validate_scenario.py`) clean — zero CRITICAL/HIGH across all 13 behavioral scenarios (AC-1..AC-13; TCs inherit their AC's scenario) — after one correction round-trip with convex-planner (2 WEAK_ORACLE violations on the AC-11/AC-12 new scenarios — a "bytes differ" assertion and a "does NOT start with" assertion with no concrete anchor — tightened to name a SHA-256 digest comparison and concrete `realpath()` example paths respectively). Every `requirements[]` entry (AC-1..AC-13, TC-1..TC-22 — 35 total) carries a stable, gapless, non-duplicated ID; 18 fixtures total (7 new).

**REDHAT-FIX-16 is preserved as FIXED and untouched** — this refresh does not modify `convex/couchVerdict.ts` or `convex/couchSampleAssembler.ts`; the new AC-13 calls only their existing public read APIs (`couchGateStatus`, `getCouchVerdict`).

**The Founder-Operator/live-provider human gate (S4-T7) remains an external, unresolved, human-owned blocker — unchanged by this refresh.** REDHAT-FIX-12 does not claim, simulate, or reduce the scope of that gate; a genuine "pass" can only be produced by a real seeded call through the operator-gated `recordCouchVerdict` mutation, bound to the live active manifest via `couchGateStatus`, never a JSON flag, CLI arg, historic pass, or raw insert. No evidence of the human S4-T7 review has been manufactured by this task-planning pass, and `sprint-goal-state.json` continues to correctly report `met:false` pending both this remediation being implemented AND a genuine Founder-Operator review of a real ~25-route catalog.
