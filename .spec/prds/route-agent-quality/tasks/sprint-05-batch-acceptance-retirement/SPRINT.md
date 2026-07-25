---
sprint: 5
slug: sprint-05-batch-acceptance-retirement
sequence: 5
timeline: Phase 3
status: In Progress
prd: .spec/prds/route-agent-quality/README.md
prd_version: 3.1.1
roadmap: .spec/prds/route-agent-quality/ROADMAP.md
generated_by: kb-sprint-tasks-plan
generated: 2026-07-19T22:48:19Z
planned_from_roadmap_sha: b3cf8a4b315218d683bc6c92e8bb6399e80503d7918ae868db66c79fb1a59103
planned_from_source_sha: facc807930bd3b207c26cfae5b3650205f294858
---

# Sprint 05: Batch acceptance + retirement

**Sequence:** 5
**Timeline:** Phase 3
**Status:** In Progress
> Progress: 0/4 tasks completed · updated 2026-07-25T01:21:09Z
**Proposed by:** product-manager + convex-planner (lane)

## Overview

This sprint turns the Sprint 04 couch-gate PASS into an accepted, auditable full-batch catalog. The operator runs the real `--all` waterfall under the existing cost and retry governance, reads a coverage report with per-lever realized yields and rider-ready totals, compares those observations with the PRD's expected-yield assumptions without treating them as a committed target, and records an explicit accept/reject decision. A far-below-estimate lever escalates to the Founder-Operator and cannot silently complete the batch or unlock retirement.

The sprint also makes retirement fail-closed: only routes with evidence that every recovery lever failed are candidates; a `marginal` classifier verdict is not enough; the founder must review the failure reason and explicitly confirm each retirement; and the route record, reason, and audit history remain available for reversible un-retire. The independent top-50-by-composite-rank review is rendered separately from the provenance-stratified couch sample so a bad first-surface road, duplicate headliner, or test row cannot pass unseen.

## Human Testing Gate

**Gate:** The Founder-Operator accepts the full batch's realized rider-ready count against the expected-yield table on the real catalog.

### Human Test Deliverable

A real, un-seeded full-batch acceptance packet containing the `coverageReport`, per-lever realized PASS rates, rider-ready count, expected-yield comparison, explicit accept/reject or escalation decision, a top-50-by-composite-rank review, and a retirement-candidate review. The packet must show that the Sprint 04 couch gate was PASS before `--all`, that no route auto-retired, and that every committed retirement has an explicit founder confirmation with a preserved record.

### Test Steps

1. Run the full `--all` batch under the cost circuit-breaker on the real dev catalog after the couch gate is PASS.
2. Open `coverageReport`; read per-lever PASS rates, terminal-state counts, cost telemetry, and rider-ready count.
3. Compare realized counts against the PRD expected-yield table; record accept, reject, or an escalation for a far-below-estimate lever.
4. Confirm a far-below-estimate lever escalates rather than silently completing.
5. Review the top-50-by-composite-rank routes for correct road and plausible length.
6. Confirm no duplicate headliner or test/seed row appears among the top 50.
7. Review retirement candidates with their per-route failure reasons and all-lever evidence.
8. Confirm nothing auto-retires without explicit Founder-Operator confirmation; verify each committed retirement remains reversible.

## Tasks

| ID | Title | Agent | Estimate |
|----|-------|-------|----------|
| S5-T1 | Full `--all` batch execution + coverageReport realized-yield table + acceptance recording + low-yield-lever escalation (REC-04 AC-7) | convex-implementer | 120 min |
| S5-T2 | Retirement flow: all-lever-failure eligibility, explicit confirm, reversible unretire, preserved record (REC-05) | convex-implementer | 120 min |
| S5-T3 | Top-50-by-composite-rank render harness for Founder review (VER-05 AC-6) | convex-implementer | 90 min |
| S5-T4 | Accept realized yield (headline gate); review top-50-by-rank; review retirement candidates before commit | Founder-Operator | 45 min |

## Dependencies

- **Blocks:** Sprint 10 Founder-region Saturday-arc capstone — it consumes the accepted post-batch catalog.
- **Dependent on:** Sprint 04 Trust pipeline — the couch-sample verdict must be PASS before `--all` is permitted.
- **Parallel:** Sprint 06 Rider-ready surface may run in parallel after Sprint 04; this sprint's acceptance decision is independent of its UI caption work.

## PRD Coverage

- UC-REC-04 AC-7: realized rider-ready acceptance, per-lever yield comparison, low-yield escalation, retirement lock.
- UC-REC-05 AC-1..5: all-lever failure eligibility, founder review and explicit confirmation, preserved and reversible retirement.
- UC-VER-05 AC-6: independent top-50-by-composite-rank review.
- Criteria T-REC-013, T-REC-014, T-REC-015, T-REC-017, T-REC-019, T-VER-020.

## Capability Coverage

- CAP-GEO-04: all-levers-failed evidence → Founder decision → reversible exclusion.
- CAP-GEO-05 (consumed): couch-sample PASS → `--all` unlock.
- CAP-GEO-03 (consumed): accepted `riderReady` catalog is the input to the capstone's browse/plot/save path.

## Source Coverage

- UC-REC-04 AC-7 / T-REC-017: `coverageReport`, expected-yield assumptions, realized count, explicit acceptance, escalation, and retirement lock.
- UC-REC-04 AC-5/6 / T-REC-019: cost circuit-breaker, retry/backoff, cursor, and total cost remain visible in the full-batch report.
- UC-REC-05 / T-REC-013..015: retirement candidates are all-lever-failed, founder-confirmed, recorded, and reversible.
- UC-VER-05 AC-6 / T-VER-020: rank-ordered first-surface top 50 is independently rendered and reviewable.
- TR 11 §1/§2/§3: real Convex integration, real operator driver, and no fixture-only acceptance.

## Blocks

- Sprint 10: accepted post-batch catalog is a prerequisite for the SLC/Ogden Saturday arc.

## Task Detail Files

Generated by /kb-sprint-tasks-plan on 2026-07-19T22:48:19Z (specialist-authored lane: convex-planner + product-manager; single Convex/operator domain).

- S5-T1-full-all-batch-coverage-report-acceptance-low-yield-escalation.md
- S5-T2-retirement-eligibility-explicit-confirmation-reversible-unretire.md
- S5-T3-top-50-composite-rank-founder-review-harness.md
- S5-T4-founder-accept-realized-yield-review-retirement-candidates.md
