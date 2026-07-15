---
sprint: 3
slug: sprint-03-catalog-hygiene
sequence: 3
timeline: Phase 1 (parallel opener)
status: In Progress
prd: .spec/prds/route-agent-quality/README.md
prd_version: 3.1.1
roadmap: .spec/prds/route-agent-quality/ROADMAP.md
generated_by: kb-sprint-tasks-plan
generated: 2026-07-13T00:00:00Z
tasks_expanded: 2026-07-13
---

# Sprint 03: Catalog hygiene

**Sequence:** 3
**Timeline:** Phase 1 (parallel opener)
**Status:** In Progress
**Proposed by:** product-manager + convex-planner (lane)

## Overview

Deterministic at-rest cleanup of the real 5,757-route `curated_routes` catalog so every
downstream gate calibrates against honest data. Four hygiene passes, each an operator-only
`internalAction` with a mandatory `{dryRun?}` preview: (1) ÷100 the ~103 out-of-scale editorial
scores so the whole catalog shares the 0–1 scale; (2) collapse the ~50 duplicate name groups
(~106 rows) to one canonical row each via a reversible `duplicateOf` shadow flag, with a
founder-reviewed dry-run plan before commit; (3) quarantine the ~64 zero/negative-length rows,
~41 >1,000 mi outliers, and any test/seed-named rows with recorded reasons, excluded from
rider-ready; (4) canonicalize dirty state strings while preserving multi-state routes as an
ordered set. Every mutating pass is idempotent — a second run changes nothing.

**No boundary chain (N/A):** deterministic at-rest cleanup, no CAP-* segment. Feeds
CAP-GEO-01/03 by cleaning the claimed lengths the geometry gate (Sprint 04) calibrates against.

**Runs FIRST in the data pipeline:** no code dependency on the Sprint 01/02 spikes — runs
parallel with them; must finish before Sprint 04 (Trust pipeline) consumes the cleaned lengths.

## Human Testing Gate

**Gate:** The Founder-Operator confirms the canonical-versus-shadow pick for every duplicate group before the merge commits.

### Human Test Deliverable

A founder-reviewed `dedupeGroups --dryRun` plan on the **real dev catalog** that lists every
duplicate group with its selected canonical (gate-passing or highest-score row) versus shadows;
the founder confirms each pick before the commit run, after which a "Cherohala Skyway" search
returns exactly one row. The score-normalization, length/test-row quarantine, and state
normalization passes each run with their own dry-run preview and prove idempotency on a second
run.

### Test Steps

1. Run `normalizeEditorialScores` dry-run; preview the divide-by-100 change-set without writing.
2. Run `dedupeGroups` dry-run on the real catalog.
3. Review each duplicate group's canonical-versus-shadow selection.
4. Confirm the canonical is the gate-passing or highest-score row.
5. Commit the merge; confirm "Cherohala Skyway" search returns exactly one row.
6. Run length and test-row quarantine; confirm each reason is recorded.
7. Run state normalization twice; confirm the second pass changes nothing.

## Tasks

| ID | Title | Agent | Estimate |
|----|-------|-------|----------|
| S3-T1 | Score-scale ÷100 normalization at rest with dry-run preview (UC-HYG-01) | convex-implementer | 90 min |
| S3-T2 | Duplicate-group detection + reversible duplicateOf merge with dry-run plan (UC-HYG-02) | convex-implementer | 120 min |
| S3-T3 | Length + test/seed-row quarantine with reasons; state-string normalization idempotent (UC-HYG-03, UC-HYG-04) | convex-implementer | 120 min |
| S3-T4 | Review the dedupe dry-run plan on real data; confirm canonical-vs-shadow per group before commit | Founder-Operator | 30 min |
| REDHAT-FIX-001 | Exercise the in-scale and mixed-scale dimension guards through the real normalization handler (F-1) | convex-implementer | 30 min |
| REDHAT-FIX-002 | Re-capture behavioral RED evidence for score normalization before GREEN (F-2) | convex-implementer | 30 min |
| REDHAT-FIX-003 | Isolate hygiene integration seeds from concurrent shared-dev deployments (F-4) | convex-implementer | 45 min |
| REDHAT-FIX-004 | Generalize catalog scan/change-set boundaries for paginated T2/T3 hygiene passes (F-3) | convex-implementer | 60 min |

## Dependencies

- **Blocks:** Sprint 04 (Trust pipeline)
- **Dependent on:** None (parallel with Sprint 01, Sprint 02)

## PRD Coverage

- UC-HYG-01..04 · criteria T-HYG-001..012 (incl. T-HYG-005 human-gate)

## Capability Coverage

- N/A — deterministic at-rest cleanup; no boundary chain. Feeds CAP-GEO-01/03 by cleaning the
  claimed lengths the gate calibrates against.

## Source Coverage

- UC-HYG-01: Normalize the editorial score scale (÷100 at rest, idempotent, dry-run)
- UC-HYG-02: Merge duplicate route groups (reversible `duplicateOf` shadow, founder-reviewed plan)
- UC-HYG-03: Quarantine length outliers, zero-length, and test rows (reasons recorded)
- UC-HYG-04: Normalize state strings (canonical form, multi-state preserved, idempotent)
- Criteria T-HYG-001..012 (incl. T-HYG-005 human-gate)
- TR 03-data-schema (`quarantine`, `duplicateOf`, `scoreScaleNormalizedAt` deltas)
- TR 04-api-design (`convex/curatedGeometryHygiene.ts` contract; `{dryRun?}` on every mutation)
- TR 11-e2e-testing §1 (service integration tier), §2 (determinism seam)

## Blocks

- Sprint 04 Trust pipeline — the geometry gate calibrates against the cleaned claimed lengths;
  hygiene must finish before the lever waterfall runs.

## Task Detail Files

Generated by /kb-sprint-tasks-plan on 2026-07-13 (specialist-authored: convex-planner; single-domain, no design planner). Fakeability audit: 15/15 scenarios pass `validate_scenario`, 0 CRITICAL. Avg quality 115/115.

REDHAT-FIX tasks added 2026-07-13 (specialist-authored: convex-planner; remediation from red-hat review F-1..F-4).

- S3-T1-score-scale-normalization-dry-run-preview.md
- S3-T2-duplicate-group-reversible-merge-dry-run-plan.md
- S3-T3-length-testrow-quarantine-state-normalization.md
- S3-T4-review-dedupe-plan-confirm-canonical-vs-shadow.md
- REDHAT-FIX-001-mixed-scale-dimension-guards-real-handler.md
- REDHAT-FIX-002-recapture-behavioral-red-evidence-score-normalization.md
- REDHAT-FIX-003-isolate-hygiene-integration-seeds-concurrent-dev.md
- REDHAT-FIX-004-generalize-catalog-scan-paginated-t2-t3-passes.md
