---
sprint: 6
slug: sprint-06-rider-ready-surface
sequence: 6
timeline: Phase 3
status: In Progress
prd: .spec/prds/route-agent-quality/README.md
prd_version: 3.1.1
roadmap: .spec/prds/route-agent-quality/ROADMAP.md
generated_by: kb-sprint-tasks-plan
generated: 2026-07-26T21:13:31Z
planned_from_roadmap_sha: a1a731ba497125d1b4b569da76d98c43fdf32e4daca7615963aae359473a8ac7
planned_from_source_sha: 11e5f40fb8015f3a021ac273531c2fb7ffac672e
source_kind: git-head
---

# Sprint 06: Rider-ready surface

**Sequence:** 6
**Timeline:** Phase 3
**Status:** In Progress
> Progress: 2/8 tasks completed · updated 2026-07-30T06:38:27Z
**Proposed by:** react-native-ui-planner (lane) + convex-planner (gated queries) + frontend-designer (caption + absence states) + product-manager (gate)

## Overview

This sprint builds the read-path gate the agent's discovery tool and every browse surface must
serve through, so a rider never sees a dot masquerade as a route, never reads a fabricated
`0mi` distance, and never loses a saved route to the gate. The stored `riderReady` flag —
composed deterministically from gate-passed geometry, a real ride name, a sane 0–1 score, a sane
length, a positive ride-worthiness verdict, and not-retired/not-shadow status (Sprint 01's
`recomputeRiderReady` seam, hardened here) — becomes the single indexed predicate that powers
discovery, browse, and the carousel. The centroid fallback is removed from `discoverCuratedRoutes`
so a route with no gate-passing geometry can never be suggested.

The honest-absence work is the human-trust leg: a thin-coverage region gets a real "no routes
near you yet" message (not centroid dots or padded junk), the fallback-to-national case is labeled
so distant routes are never presented as nearby, the fabricated `0mi` distance label is removed,
and screen readers are politely notified when absence or fallback content replaces results. The
provenance caption on the detail view renders as calm, muted, informational context for inferred
lines only (`ai_reconstructed`, `name_routed`) — never a badge or warning — and stays silent for
`scraped_promoted` and pre-provenance geometry so the signal keeps meaning. Saved/bookmarked
curated routes always resolve to detail regardless of rider-ready status, with the existing
honest "Approximate location" state for un-recovered lines and a canonical redirect for
duplicate-shadow rows.

**Migration gate (risk #22):** the geospatial re-index is migration-gated — the rider-ready index
point-count must equal the rider-ready count before the SURF gate deploys, so the read path and
the index never diverge. The sprint builds on the sample-batch rider-ready set from Sprint 04
(rider-ready routes + flag semantics exist) and runs parallel with Sprint 05's batch-acceptance
work; it is independent of that sprint's UI caption work.

## Human Testing Gate

**Gate:** The Founder-Operator confirms on a real device that the provenance caption reads as calm context, never a warning.

### Human Test Deliverable

A real, un-seeded rider-ready surface verification on a device: an `ai_reconstructed` route detail
whose provenance caption reads as plain informational text in both light and dark mode with no
badge or warning affordance; a `scraped_promoted` route that shows no caption; an honest
"no routes near you yet" state when browsing a thin region (with a labeled fallback-to-national
and no fabricated `0mi`); and a saved non-ready route that still opens its detail. The deliverable
must be exercised against the real post-Sprint-04 rider-ready catalog — no fixtures.

### Test Steps

1. Open a detail view for an `ai_reconstructed` route on device.
2. Confirm the caption reads as plain informational text.
3. Confirm muted styling with no badge or warning affordance.
4. Check the caption in both light and dark mode.
5. Confirm a `scraped_promoted` route shows no caption.
6. Browse a thin region; confirm the honest "no routes near you yet" state.
7. Confirm a saved non-ready route still opens its detail.

## Tasks

| ID | Title | Agent | Estimate |
|----|-------|-------|----------|
| S6-T1 | `riderReady` flag composition (7 inputs) stored + indexed + geospatial re-index migration gate + recompute triggers (SURF-01) | convex-implementer | 150 min |
| S6-T2 | Hard-gate discovery tool + all `listCuratedRoutes` modes + carousel; remove centroid fallback (SURF-02, SURF-03) | convex-implementer | 120 min |
| S6-T3 | Honest thin-region absence + labeled national fallback + fabricated-`0mi` fix (`index.tsx:350`) + `fellBackToBest` exposure + a11y announce (SURF-04) | react-native-ui-implementer | 180 min |
| S6-T4 | Provenance caption leaf (calm, muted, no badge) for `ai_reconstructed` + `name_routed` only + `getCuratedRouteDetail` `geometryProvenance` projection (SURF-05) | frontend-designer | 120 min |
| S6-T5 | Saved-routes reachability: canonical redirect, approximate state, never gate-hidden (SURF-06) | convex-implementer | 90 min |
| S6-T6 | Retarget `curated-route-detail.yaml` provenance flow off the dead AC-1 testID to deep-link/map-pin; thin-region + saved-reachability Maestro flows | react-native-ui-implementer | 150 min |
| S6-T7 | Eyeball the provenance caption on device (light + dark); confirm it reads as context not alert | Founder-Operator | 30 min |
| S6-T8 | Design handoff — provenance caption calm treatment spec (light + dark tokens) | frontend-designer | 45 min |

## Dependencies

- **Blocks:** Sprint 07 Agent rebuild — the agent's discovery tool serves through this rider-ready gate.
- **Dependent on:** Sprint 04 Trust pipeline — rider-ready routes + flag semantics exist (the sample-batch rider-ready set).
- **Parallel:** Sprint 05 Batch acceptance + retirement may run in parallel after Sprint 04; this sprint's read-path/caption work is independent of its acceptance decision.

## PRD Coverage

- UC-SURF-01: compute the rider-ready flag (stored, indexed, recompute triggers).
- UC-SURF-02: gate the discovery agent tool (rider-ready only; centroid fallback removed).
- UC-SURF-03: gate browse queries and the carousel (all `listCuratedRoutes` modes rider-ready only).
- UC-SURF-04: honest thin-region absence (honest empty, labeled fallback-to-national, fabricated-`0mi` fix, a11y announce).
- UC-SURF-05: render the provenance caption on detail (calm, muted, inferred-lines only).
- UC-SURF-06: never hide a rider's saved routes (canonical redirect, approximate state, gate-independent detail).
- Criteria T-SURF-001..021 (incl. T-SURF-018 human-gate).

## Capability Coverage

- CAP-GEO-03: rider-ready gating (flag → indexed query → discovery → render).
- CAP-GEO-04: saved-route reachability (canonical redirect, gate-independent detail).

## Source Coverage

- UC-SURF-01 / T-SURF-001..005: `riderReady` deterministic composition from the 7 inputs, stored + indexed, false on any missing condition, recompute on geometry/score/length/classifier/retirement/shadow change.
- UC-SURF-02 / T-SURF-006..010: discovery tool rider-ready only; `discoverCuratedRoutes` centroid fallback removed; honest empty-or-partial over padding.
- UC-SURF-03 / T-SURF-011..015: every `listCuratedRoutes` browse mode + home carousel + chat cards rider-ready only; quarantined/shadow/retired excluded in the same gated read path.
- UC-SURF-04 / T-SURF-016..020: honest thin-region "no routes near you yet", labeled fallback-to-national, no fabricated `0mi`, a11y announce.
- UC-SURF-05 / T-SURF-021: calm provenance caption for `ai_reconstructed`/`name_routed` only; correct caption copy; silent for `scraped_promoted`/pre-provenance.
- TR 11 §1/§2/§3: real Convex integration, real RN device surface, no fixture-only caption/absence proof.

## Blocks

- Sprint 07: the discovery tool's rider-ready gate and the `discoverCuratedRoutes` centroid-fallback removal must land before the agent rebuild can serve honest suggestions through this gate.

## Task Detail Files

Generated by /kb-sprint-tasks-plan on 2026-07-26T21:13:31Z (specialist-authored: react-native-ui-planner (lane) + convex-planner + frontend-designer + product-manager; multi-domain — Convex read-path gate + RN honest-absence surface + calm provenance caption; avg quality 105/115; fakeability audit 0 CRITICAL across all FEATURE ACs).

- S6-T1-riderready-flag-composition-7-inputs-stored-indexed-geospati.md
- S6-T2-hard-gate-discovery-tool-all-listcuratedroutes-modes-carouse.md
- S6-T3-honest-thin-region-absence-labeled-national-fallback-fabrica.md
- S6-T4-provenance-caption-leaf-calm-muted-no-badge-for-ai-reconstru.md
- S6-T5-saved-routes-reachability-canonical-redirect-approximate-sta.md
- S6-T6-retarget-curated-route-detail-yaml-provenance-flow-off-the-d.md
- S6-T7-eyeball-the-provenance-caption-on-device-light-dark-confirm-.md
- S6-T8-design-handoff-provenance-caption-calm-treatment-spec-light-.md
