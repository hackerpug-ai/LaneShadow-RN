---
sprint: 1
slug: sprint-01-geometry-reference-spike
sequence: 1
timeline: Phase 1 (parallel opener)
status: Done
prd: .spec/prds/route-agent-quality/README.md
prd_version: 3.1.1
roadmap: .spec/prds/route-agent-quality/ROADMAP.md
generated_by: kb-sprint-tasks-plan
---

# Sprint 01: Geometry reference-flow spike

**Sequence:** 1
**Timeline:** Phase 1 (parallel opener)
**Status:** Done — red-hat remediation REDHAT-FIX-001..007 landed; founder gate re-pass 20260712T100751Z
**Proposed by:** product-manager + convex-planner (lane) + aisdk-planner (anchor completion) + react-native-ui-planner (cold-boot plot flow)

## Overview

The recorded prerequisite that unblocks the REC deep build. This spike proves the geometry
reference flow end-to-end on real services: **reconstruct ONE real PoC route** through a Convex
action (real reconstruction LLM + real Google) → the deterministic gate admits the line within
the ratio band → persist it as `ai_reconstructed` → recompute its `riderReady` flag → the route
returns from `listCuratedRoutes` in **both** national-best and nearest modes → Maestro plots its
correct road line on the simulator from a **cold boot**, and the Founder-Operator watches it.

Anchor extraction uses a **direct AI-SDK completion** (per T-REC-016 decoupling) so this spike does
NOT depend on the Sprint 02 Mastra-in-Convex spike. The gate module + persist/recompute seam are
**reference implementations Sprint 04/06 harden** — not throwaway.

## Human Testing Gate

**Gate:** The Founder-Operator watches one real recovered route plot its correct road line on the
simulator from a cold boot.

### Human Test Deliverable

A single recovered PoC route that browses → returns from `listCuratedRoutes` (national-best AND
nearest) → plots its correct road line on the iOS simulator from a cold boot, with the
gate→query→render seam recorded green.

### Test Steps

1. Reconstruct one real PoC route through a Convex action on real APIs.
2. Confirm the deterministic gate admits the line within the ratio band.
3. Persist the line as `ai_reconstructed` and recompute its rider-ready flag.
4. Query `listCuratedRoutes` national-best mode; confirm the route appears.
5. Query `listCuratedRoutes` nearest mode; confirm the route appears.
6. Cold-boot the simulator and tap the recovered route.
7. Watch the correct road line plot on the map.

## Tasks

| ID | Title | Agent | Estimate |
|----|-------|-------|----------|
| S1-T1 | Direct AI-SDK anchor-extraction completion (decoupled from the Mastra spike per T-REC-016) | aisdk-implementer | 60 min |
| S1-T2 | Deterministic gate module (VER-01 core) + reconstruct-one path + persist `ai_reconstructed` + `recomputeRiderReady` seam + query return (best + nearest) | convex-implementer | 180 min |
| S1-T3 | Maestro cold-boot plot-verification flow for the single recovered route | react-native-ui-implementer | 75 min |
| S1-T4 | Observe the recovered line plotted from cold boot; record the §5 seam as green | Founder-Operator | 25 min |
| REDHAT-FIX-001 | Make the recovered road line visibly render in the cold-boot detail map and add an honest visual oracle; fixes H1 | react-native-ui-implementer | 120 min |
| REDHAT-FIX-002 | Replace the transparent real-line probe with evidence that distinguishes a painted road line from a blank map; fixes H2 | react-native-ui-implementer | 90 min |
| REDHAT-FIX-003 | Rework Human Testing Gate steps 1–3 to execute a real reconstruct→gate→persist chain with distinct evidence; fixes H3 | convex-implementer | 120 min |
| REDHAT-FIX-004 | Perform the actual Founder-Operator observation after the visual gate is fixed; fixes H4 | Founder-Operator | 30 min |
| REDHAT-FIX-005 | Protect or internalize reconstruct and verification entry points to prevent unauthenticated quota/write access; fixes H5 | convex-implementer | 90 min |
| REDHAT-FIX-006 | Replace S1-T2 soft assertions with failure-discriminating tests for AC-4/5/6; fixes M1 | convex-implementer | 90 min |
| REDHAT-FIX-007 | Execute and archive the absent-route Maestro branch as part of the gate evidence; fixes M2 | react-native-ui-implementer | 60 min |

## Dependencies

- **Blocks:** Sprint 04 (Trust pipeline)
- **Dependent on:** None

## PRD Coverage

- UC-REC-02 (Reconstruct geometry from turn-by-turn descriptions — Lever 2)
- UC-VER-01 (Enforce the deterministic geometry gate)
- UC-SURF-01 (Compute the rider-ready flag — seam only)
- Criterion: T-REC-016 (human-gate, geometry §5 spike)

## Capability Coverage

- **CAP-GEO-01:** lever-2 reconstruction seam (reconstruct-one → gate → persist)
- **CAP-GEO-03:** rider-ready gating seam (recompute → indexed query → plot)

## Blocks

- Sprint 04 (Trust pipeline) is dependent on this sprint's gate module + reconstruct seam.

## Note

**SPIKE** — the recorded prerequisite that unblocks the REC deep build. Anchor extraction uses a
**direct AI-SDK completion** so this spike does NOT depend on the Sprint 02 Mastra spike. The gate
module + persist/recompute seam are reference implementations Sprint 04/06 harden — not throwaway.

## Task Detail Files

Generated by `/kb-sprint-tasks-plan` on 2026-07-11 (avg FEATURE quality ~113/115; fakeability audit `validate_scenario` exit 0 across all behavioral ACs).

- [S1-T1-direct-ai-sdk-anchor-extraction-completion.md](./S1-T1-direct-ai-sdk-anchor-extraction-completion.md) — aisdk-implementer (60 min)
- [S1-T2-deterministic-gate-reconstruct-persist-query.md](./S1-T2-deterministic-gate-reconstruct-persist-query.md) — convex-implementer (180 min)
- [S1-T3-maestro-cold-boot-plot-verification-flow.md](./S1-T3-maestro-cold-boot-plot-verification-flow.md) — react-native-ui-implementer (75 min)
- [S1-T4-founder-observe-recovered-line-plot.md](./S1-T4-founder-observe-recovered-line-plot.md) — Founder-Operator (25 min, human gate)

### Red-hat remediation task detail files

Generated by `/kb-sprint-tasks-plan --only REDHAT-FIX-001..007` on 2026-07-12 from authority `.spec/reviews/red-hat-sprint-01-2026-07-12T07-30-55Z.md` (avg quality ≥90/115; proposed_by specialists; REQUIREMENT-CONTRACT v1 on every file). **Sprint is NOT done** until these land and the human gate re-passes.

| ID | File | Agent | Est | Depends on | Finding |
|----|------|-------|-----|------------|---------|
| REDHAT-FIX-001 | [REDHAT-FIX-001-visible-road-line-paint-honest-visual-oracle-h1.md](./REDHAT-FIX-001-visible-road-line-paint-honest-visual-oracle-h1.md) | react-native-ui-implementer | 120 min | S1-T2, S1-T3 | H1 |
| REDHAT-FIX-002 | [REDHAT-FIX-002-honest-painted-road-line-oracle-h2.md](./REDHAT-FIX-002-honest-painted-road-line-oracle-h2.md) | react-native-ui-implementer | 90 min | REDHAT-FIX-001, S1-T3 | H2 |
| REDHAT-FIX-003 | [REDHAT-FIX-003-honest-gate-steps-1-3-reconstruct-evidence-h3.md](./REDHAT-FIX-003-honest-gate-steps-1-3-reconstruct-evidence-h3.md) | convex-implementer | 120 min | S1-T2 | H3 |
| REDHAT-FIX-004 | [REDHAT-FIX-004-founder-operator-observation-after-visual-fix-h4.md](./REDHAT-FIX-004-founder-operator-observation-after-visual-fix-h4.md) | Founder-Operator | 30 min | 001, 002, 003, S1-T1..T3 | H4 |
| REDHAT-FIX-005 | [REDHAT-FIX-005-auth-gate-reconstruct-verification-surface-h5.md](./REDHAT-FIX-005-auth-gate-reconstruct-verification-surface-h5.md) | convex-implementer | 90 min | S1-T2 | H5 |
| REDHAT-FIX-006 | [REDHAT-FIX-006-failure-discriminating-tests-ac456-m1.md](./REDHAT-FIX-006-failure-discriminating-tests-ac456-m1.md) | convex-implementer | 90 min | S1-T2 | M1 |
| REDHAT-FIX-007 | [REDHAT-FIX-007-archive-absent-route-maestro-ac4-m2.md](./REDHAT-FIX-007-archive-absent-route-maestro-ac4-m2.md) | react-native-ui-implementer | 60 min | S1-T3 | M2 |

**Suggested dependency order (parallel waves):**

1. **Wave A (parallel):** REDHAT-FIX-001 (paint), REDHAT-FIX-003 (gate evidence), REDHAT-FIX-005 (auth), REDHAT-FIX-006 (soft asserts), REDHAT-FIX-007 (AC-4 archive)
2. **Wave B:** REDHAT-FIX-002 (honest oracle) after 001
3. **Wave C:** REDHAT-FIX-004 (Founder-Operator) after 001+002+003 (soft-prefer 005/006/007 green)
