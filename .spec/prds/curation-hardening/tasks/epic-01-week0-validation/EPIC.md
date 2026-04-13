# Epic 1: Week 0 — Validation & De-Risking

**Sequence:** 1 / 11
**Priority:** P0
**Status:** Backlog
**Estimated Effort:** 480 minutes (~8 hours across 4 spikes)

---

## Overview

Before committing to 7 weeks of curation pipeline hardening, de-risk the four highest-uncertainty technical assumptions via focused validation spikes. Each spike produces a machine-readable PASS/FAIL report. **Epic 1 blocks all subsequent epics** — no hardening code is written until Week 0 validation clears.

**Theme:** Prove the assumptions before building the pipeline.

**PRD Reference:** [S1.0 Priority 0: Validation & Setup (Week 0)](../../01-scope.md)

---

## Human Test Steps

After all 4 tasks are complete, an administrator should be able to:

1. **Run the GLM NLP pilot** — Execute `python scripts/curation/pipeline/nlp/pilot/run_pilot.py` against the 100-post labeled dataset. Verify `results.json` contains `road_name_f1 >= 0.75` and `status: "PASS"`. If FAIL, escalate with report and pivot to sentence-transformer fallback (AD-002).
2. **Run the BDR GPX verifier** — Execute `python scripts/curation/pipeline/sources/bdr_pilot/verify_bdr.py`. **RESULT (2026-04-12): FAIL — all BDR GPX URLs returned HTTP 403.** Combined with V3 lifestyle mismatch (BDR is ADV/dual-sport), UC-SRC-02 was dropped entirely and no replacement was sought. Spike retained as historical evidence.
3. **Run the twtex feasibility probe** — Execute `python scripts/curation/pipeline/sources/twtex_pilot/probe_twtex.py`. **RESULT (2026-04-12): NO-GO — PRD assumption invalidated.** twtex.com is Two Wheeled Texans, a Texas-only motorcycle forum, not a curated Top 100 list. UC-SRC-03 was dropped entirely and no replacement was sought. Spike retained as historical evidence.
4. **Run the Convex Geospatial validation** — Execute `npx convex run seedGeospatialTest:seedRoutes`, then `npx convex run geospatialValidation:validateNearestNeighbor` and `npx convex run geospatialValidation:validateRectangularRange`. Verify both print PASS with `latency_ms < 500`.
5. **Review consolidated Week 0 report** — Inspect all four reports. Sources invalidated by VAL-002/VAL-003 have been dropped from the plan (see PRD `01-scope.md` Dropped section). Only proceed to Epic 2 after VAL-001 and VAL-004 pass or explicit user-approved override.

6. **Execute the Curation Review Protocol** — Run [`../CURATION-REVIEW-PROTOCOL.md`](../CURATION-REVIEW-PROTOCOL.md). For Epic 1 this is minimal (no pipeline changes yet): steps 1, 6, 7, 8, 12 (existing baseline pipeline only — FHWA + motorcycleroads + bestbikingroads + extraction + scoring + classification + push dry-run). Most protocol steps are N/A until later epics. Write `review.md` to this epic folder with verdict PASS. This establishes the "frozen baseline" that all future epic reviews will diff against.

---

## Acceptance Criteria (Epic-Level)

- [ ] All 4 validation scripts exist and are runnable from the project root
- [ ] Each script produces a structured JSON report
- [ ] Each script returns exit code 0 on PASS, 1 on FAIL
- [ ] Each script has at least 4 GIVEN-WHEN-THEN acceptance criteria with TDD evidence
- [ ] No code outside the validation pilot directories is modified
- [ ] Week 0 consolidated report presented to user for go/no-go decision
- [ ] Curation Review Protocol executed (minimal Epic 1 scope) with PASS verdict
- [ ] `review.md` artifact committed to `epic-01-week0-validation/` with baseline snapshot

---

## PRD Sections Covered

- **S1.0** — Priority 0: Validation & Setup (Week 0)
- **UC-RIDER-03** — GLM NLP extraction (validated via VAL-001)
- ~~**UC-SRC-02** — BDR GPX~~ (dropped 2026-04-12; VAL-002 found 403s; source also a V3 mismatch)
- ~~**UC-SRC-03** — twtex.com~~ (dropped 2026-04-12; VAL-003 invalidated PRD assumption)
- **AD-005, AD-010** — Convex Geospatial (validated via VAL-004)

---

## Tasks

| ID | Title | Type | Agent | Priority | Effort | Est. Min | Depends On | Blocks |
|----|-------|------|-------|----------|--------|----------|------------|--------|
| [VAL-001](./VAL-001.md) | GLM NLP Pilot — Labeled Dataset + Claude Haiku Accuracy Validation | INFRA | python-implement | P0 | S | 180 | — | RID-003, INF-001 |
| [VAL-002](./VAL-002.md) | BDR GPX Verification — Live Accessibility + Segmentation Feasibility | INFRA | python-implement | P0 | S | 90 | — | ~~SRC-002~~ *(source dropped — see INDEX)* |
| [VAL-003](./VAL-003.md) | twtex.com Feasibility Research — WAF Detection, ToU Review, Technical Approach | INFRA | python-implement | P0 | S | 90 | — | ~~SRC-003~~ *(source dropped — see INDEX)* |
| [VAL-004](./VAL-004.md) | Convex Geospatial Index Setup — Install, Seed, and Validate Query Performance | INFRA | convex-implementer | P0 | S | 120 | — | INF-003, INF-007, QUAL-001 |

**Total Tasks:** 4
**Total Estimated Effort:** 480 minutes (~8 hours, 1 day of focused work)
**Parallelization:** All 4 tasks can run in parallel — no inter-task dependencies.

---

## Dependencies

**Blocks:**
- Epic 2: Baseline Pipeline Validation (must complete spikes before baseline validation)
- Epic 3: Foundation — Models, Schema, Dependencies
- Epic 6: Quality Infrastructure — Dedup & Floor (QUAL-001 depends on VAL-004)
- Epic 10: Community NLP & Signals (RID-003 depends on VAL-001)
- *Epic 5 (Community + Geometric) was deleted 2026-04-12 after VAL-002 and VAL-003 invalidated their respective sources. SRC-004 (curvature) was folded into Epic 4.*

**Depends On:**
- (none — this is the entry epic)

---

## Definition of Done

- [ ] All 4 task files committed to repo
- [ ] All 4 tasks moved to `Done` status
- [ ] All 4 JSON reports present in the pilot directories
- [ ] All 4 scripts return exit code 0 on live execution
- [ ] Consolidated Week 0 decision documented in PR description or task notes
- [ ] User has explicitly approved proceeding to Epic 2 based on validation results

---

## Notes

- All four validations can run independently — dispatch in parallel for fastest time-to-decision
- If a validation FAILS, the corresponding downstream epic must be revised or descoped before proceeding
- VAL-004 (Convex Geospatial) is the highest-risk validation — if the Beta package has stability issues, the dedup strategy (AD-001) needs pivoting
- Validation pilot directories (`*_pilot/`) are throwaway spikes — their code may be removed or replaced by the full implementations in later epics
