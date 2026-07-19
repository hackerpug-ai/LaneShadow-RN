---
sprint: 4
slug: sprint-04-trust-pipeline
sequence: 4
timeline: Phase 2
status: In Progress
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
**Status:** In Progress
> Progress: 7/8 tasks completed · updated 2026-07-18T06:11:51Z
> Status-Note: 7/7 tasks completed; landing deterministic gates
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
