---
sprint: 6
slug: sprint-06-rider-ready-surface
sequence: 6
timeline: Phase 3
status: Completed — red-hat APPROVE WITH FINDINGS dispositioned
prd: .spec/prds/route-agent-quality/README.md
prd_version: 3.1.1
roadmap: .spec/prds/route-agent-quality/ROADMAP.md
generated_by: kb-sprint-tasks-plan
generated: 2026-07-26T21:13:31Z
planned_from_roadmap_sha: a1a731ba497125d1b4b569da76d98c43fdf32e4daca7615963aae359473a8ac7
planned_from_source_sha: 11e5f40fb8015f3a021ac273531c2fb7ffac672e
source_kind: git-head
red_hat_review: .spec/reviews/red-hat-sprint-06-rider-ready-surface-20260801T0356Z.md
red_hat_sha: 7f989406eb9cb304b721b9ce7841246fd07a608c
red_hat_verdict: APPROVE WITH FINDINGS
remediation_planned: 2026-08-01
---

# Sprint 06: Rider-ready surface

**Sequence:** 6
**Timeline:** Phase 3
**Status:** Completed — red-hat APPROVE WITH FINDINGS dispositioned (2026-08-01)
> Progress: 7/8 implementation tasks complete · S6-T7 omitted by Founder-Operator (not a pass) · red-hat 20260801T0356Z: **0 gate-blocking findings** · 3 non-blocking follow-ups chartered · updated 2026-08-01
**Proposed by:** react-native-ui-planner (lane) + convex-planner (gated queries) + frontend-designer (caption + absence states) + product-manager (gate)
**Red-hat authority:** `.spec/reviews/red-hat-sprint-06-rider-ready-surface-20260801T0356Z.md` @ SHA `7f989406eb9cb304b721b9ce7841246fd07a608c`

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

**Omission (2026-07-31):** The Founder-Operator explicitly omitted S6-T7 from this sprint's required closeout. This is a documented scope waiver, not a device-test pass; no real-device evidence is claimed.

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
| S6-T7 | **Omitted by Founder-Operator (2026-07-31):** eyeball the provenance caption on device (light + dark) — **not a pass** | Founder-Operator | 30 min |
| S6-T8 | Design handoff — provenance caption calm treatment spec (light + dark tokens) | frontend-designer | 45 min |

## Red-hat findings disposition (20260801T0356Z)

Authority: `.spec/reviews/red-hat-sprint-06-rider-ready-surface-20260801T0356Z.md`  
Reviewed SHA: `7f989406eb9cb304b721b9ce7841246fd07a608c` · Verdict: **APPROVE WITH FINDINGS**  
**Gate-blocking remediation required for Sprint 06 orchestration closeout: none.**  
The review records six findings (5 MEDIUM, 1 LOW); none block landing. Missing full-suite / Maestro / `convex:dev --once` runs are **not** Sprint 06 gate obligations (review §6: runtime prerequisites beyond static review scope).

| Finding ID | Severity | Task | Disposition | Gate blocker? | Tracking |
|------------|----------|------|-------------|---------------|----------|
| **S6-F1** | MEDIUM | S6-T3 | Four-state decoder dead branch (`index.tsx` final `isEmpty` arm); UX coherence when `isEmpty && fellBackToBest` | **No** | Follow-up task **REDHAT-FOLLOW-S6-F1** (non-blocking polish) |
| **S6-F2** | MEDIUM | S6-T5 | Canonical redirect returns `null` silently on data-integrity fault (double-`duplicateOf`); rider sees blank/not-found | **No** | Follow-up task **REDHAT-FOLLOW-S6-F2** — **Sprint 07** honest-states (out of S6 gate) |
| **S6-F3** | MEDIUM | S6-T6 | Maestro saved-reachability depends on `CLERK_TEST_EMAIL`/`CLERK_TEST_PASSWORD` without clear pre-condition fail | **No** | Follow-up task **REDHAT-FOLLOW-S6-F3** (config polish) |
| **S6-F4** | LOW | S6-T6 | YAML lint not executable (PyYAML absent); manual structure OK | **No** | **Accepted advisory** — no task |
| **S6-F5** | MEDIUM | S6-T7 | Real-device calm-vs-warning judgment gap after FO omission | **No** (waived) | **Accepted scope waiver** — see below; **no fake device-pass task** |
| **S6-F6** | MEDIUM | S6-T8 | `pnpm tokens:validate` not formally recorded in review | **No** | **Accepted evidence gap closed at plan time** — `pnpm tokens:validate` exits 0 on reviewed tree; tokens resolve; no REDHAT-FIX (not a gate re-open) |

### Gate-blocking REDHAT-FIX tasks

**None.** No CRITICAL/HIGH findings. No MEDIUM finding is required before Sprint 06 can satisfy orchestration gates per the independent review’s landing statement (“None block landing”).

### Accepted scope waiver (S6-T7 / S6-F5)

| Field | Value |
|-------|-------|
| **Finding** | S6-F5 (MEDIUM) |
| **Task** | S6-T7 |
| **Decision** | Omitted by Founder-Operator (2026-07-31) |
| **Record** | `.spec/orchestrate/orch-route-agent-quality-s06-rider-ready-surface-20260730T055327Z-codex-omission.json` |
| **Not a pass** | `true` — no real-device evidence is claimed; automation/fixtures cannot substitute for calm-vs-warning judgment |
| **Orchestration** | Human gate overall = `OMITTED` (not PASS); sprint may close with this waiver |
| **Pre-Sprint-07 note** | Review recommends scheduling a real-device calm-caption check before Sprint 07’s agent rebuild **depends** on this surface. That is a **forward schedule item**, not an S6 gate re-open and not a fabricated device-pass task in this sprint. |

### Explicit non-obligations (review §6 — do not invent gate tasks)

| Gate / evidence | Specified in | Disposition for S6 closeout |
|-----------------|--------------|------------------------------|
| Full `pnpm test` suite | Task RUNTIME_COMMANDS | Not run in review (timeout / Convex dep) — **not** a gate obligation |
| Maestro e2e flows | S6-T6 TC-2..4 | Require iOS sim + Convex dev — **not** blocked for S6 closeout |
| `pnpm convex:dev --once` | S6-T1/T2/T5 | Runtime prerequisite — **not** a gate obligation |
| Real-device human gate | S6-T7 AC-1..7 | **FO omission** (above) |

### Non-blocking follow-up tasks (first-class rows; do **not** block S6 met)

These preserve exact finding IDs/severity for later execution. They are **not** prerequisites for Sprint 06 orchestration gates.

| ID | Finding | Severity | Title | Agent | Estimate | Blocks S6 gate? |
|----|---------|----------|-------|-------|----------|-----------------|
| REDHAT-FOLLOW-S6-F1 | S6-F1 | MEDIUM | Collapse four-state discovery decoder so every `(isEmpty, isLoading, fellBackToBest)` cell is intentional (remove dead `isEmpty` arm) | react-native-ui-implementer | 45 min | **No** |
| REDHAT-FOLLOW-S6-F2 | S6-F2 | MEDIUM | Honest detail empty-state when canonical redirect hits a data-integrity fault (double-`duplicateOf`) — Sprint 07 honest-states | convex-implementer + react-native-ui-implementer | 90 min | **No** (S7) |
| REDHAT-FOLLOW-S6-F3 | S6-F3 | MEDIUM | Fail-closed Maestro pre-condition for `CLERK_TEST_EMAIL`/`CLERK_TEST_PASSWORD` on saved-reachability flow | react-native-ui-implementer | 30 min | **No** |

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

### Red-hat follow-up task detail files (2026-08-01)

Dispositioned from red-hat review `red-hat-sprint-06-rider-ready-surface-20260801T0356Z` (APPROVE WITH FINDINGS). **Zero gate-blocking REDHAT-FIX files** — none of S6-F1..F6 re-open Sprint 06 orchestration gates. Follow-ups below are first-class tracked work with exact finding IDs; they do not claim S6-T7 device pass and do not require re-running the FO human gate for S6 closeout.

- REDHAT-FOLLOW-S6-F1-four-state-decoder-dead-branch.md — closes **S6-F1** (MEDIUM), non-blocking polish
- REDHAT-FOLLOW-S6-F2-canonical-redirect-integrity-fault-honest-state.md — closes **S6-F2** (MEDIUM), Sprint 07 follow-up
- REDHAT-FOLLOW-S6-F3-maestro-clerk-env-precondition.md — closes **S6-F3** (MEDIUM), non-blocking config polish

**Not filed as tasks (justified):** S6-F4 accepted LOW advisory; S6-F5 accepted FO scope waiver (S6-T7 omission record); S6-F6 tokens:validate evidence gap closed at plan time (command exit 0).
