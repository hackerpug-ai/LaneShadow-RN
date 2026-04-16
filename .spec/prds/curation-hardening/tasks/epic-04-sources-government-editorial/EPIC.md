# Epic 4: Source Diversification — Government, Editorial & Geometric

**Sequence:** 4 / 11  
**Priority:** P1  
**Status:** Completed  
**Estimated Effort:** 660 minutes (~11 hours)

---

## Overview

Reduce single-source concentration by running the three surviving Epic 4 sources end-to-end through the curation pipeline:

- Scenic Byways GIS (`SRC-001`) for government provenance, geometry upgrade, and designation metadata
- Rider Magazine 50 Best (`SRC-006`) for editorial ground truth and calibration input
- adamfranco/curvature consumer (`SRC-004`) for hidden-gem twisties from precomputed geometry output

This epic stays scoped to the existing three source tasks, but tightens them to match the current task template, the Crawl Plan Protocol, and the real repo constraints discovered after Epic 2 and Epic 3 landed.

**Theme:** Ingest the three sources, reconcile them into the catalog, preserve their provenance into Convex, and verify the existing mobile discovery/detail flow can surface that provenance without creating a new UI branch.

**PRD Reference:** [S4.1, S4.4, S4.6](../../04-uc-src.md)

---

## Why This Epic Matters

- Scenic Byways GIS is no longer a raw count-expansion story; it is the higher-fidelity geometry and metadata upgrade over the Epic 2 FHWA baseline.
- Rider Magazine becomes the primary editorial ground-truth input for Epic 8 calibration, so partial ingest is unacceptable.
- Curvature discovery is the only surviving “hidden gem” source after the 2026-04-12 scope revision.
- Mobile discovery currently syncs only lean route-card fields. Epic 4 is the first time source-specific provenance needs to survive from ingest through Convex into rider-facing detail surfaces.

---

## Human Test Steps

After all 3 tasks are complete, an administrator should be able to:

1. Run Scenic Byways ingestion and verify the staging output contains reconciled Scenic Byways records with route geometry, `location`, designation, and description fields populated.
2. Verify Scenic Byways records reconcile against the existing FHWA baseline without creating duplicate discoverable entries for the same route overlap.
3. Run Rider Magazine ingestion and verify exactly 50 routes are emitted with preserved editorial description, source provenance, and ground-truth metadata.
4. Run curvature discovery against the precomputed curvature artifact and verify candidate routes exclude already-cataloged name+state matches while keeping `primary_archetype="twisties"` and a populated `curvature_score`.
5. Run extraction, scoring, and classification across the newly ingested routes and verify Scenic Byways classify toward scenic byway archetypes, Rider routes retain editorial richness, and curvature candidates remain twisties-oriented.
6. Push the new records to Convex dev and verify source-specific metadata needed by mobile survives the sync contract.
7. Open the existing mobile discovery/detail flow and verify Scenic Byways, Rider Magazine, and curvature routes render with the correct provenance language on existing detail surfaces, without a new source-specific screen, filter, or overlay.

All 7 steps must pass.

---

## Acceptance Criteria (Epic-Level)

- [x] `SRC-001.md`, `SRC-006.md`, and `SRC-004.md` exist in this epic directory and follow the task template sections used elsewhere in `.spec/prds/curation-hardening/tasks/`
- [x] Scenic Byways task includes Crawl Plan Protocol deliverables for Form B inventory, fixtures, selectors, fixture tests, execution, and crawl report
- [x] Rider Magazine task includes Crawl Plan Protocol deliverables for Form A inventory, fixtures, selectors, fixture tests, execution, and crawl report
- [x] Curvature task treats the source as Form E exempt and requires a provenance landing document instead of a crawl plan
- [x] Scenic Byways task covers FHWA overlap reconciliation and Convex/mobile provenance contract widening
- [x] Rider Magazine task covers exact 50-route validation and preserved editorial provenance
- [x] Curvature task covers precomputed input consumption, hidden-gem candidate filtering, and twisties provenance
- [x] The epic remains at 3 tasks and 7 human test steps

---

## PRD Sections Covered

- **S4.1** — UC-SRC-01 Ingest US Scenic Byways GIS Layer
- **S4.4** — UC-SRC-04 Run adamfranco/curvature Geometric Discovery
- **S4.6** — UC-SRC-06 Ingest Rider Magazine 50 Best Roads

---

## Tasks

| ID | Title | Type | Agent | Priority | Effort | Est. Min | Depends On | Blocks |
|----|-------|------|-------|----------|--------|----------|------------|--------|
| SRC-001 | Ingest Scenic Byways GIS + reconcile FHWA overlaps + preserve provenance contract | FEATURE | python-implement | P1 | L | 300 | BASE-009b, INF-001, INF-002, INF-003 | QUAL-001 |
| SRC-006 | Ingest Rider Magazine 50 Best + preserve editorial provenance | FEATURE | python-implement | P1 | M | 210 | BASE-009b, INF-001, INF-002 | QUAL-001, SCO-002 |
| SRC-004 | Consume curvature output + emit hidden-gem twisties candidates | FEATURE | python-implement | P1 | M | 150 | INF-001, INF-002, INF-003 | QUAL-001 |

**Total Tasks:** 3  
**Total Estimated Effort:** 660 minutes (~11 hours)

---

## Dependencies

**Depends On**

- Epic 2 crawl-plan framework and clean baseline outputs, especially `BASE-009a` and `BASE-009b`
- Epic 3 foundation contracts in `scripts/curation/pipeline/models.py`, `models/curated-routes.ts`, `convex/schema.ts`, and `scripts/curation/pipeline/sync/convex_push.py`

**Blocks**

- Epic 6 quality/dedup floor, which depends on new source output entering the shared pipeline
- Epic 8 calibration, where Rider Magazine is the upstream editorial anchor

---

## Definition of Done

- [x] All 3 task files exist with template-compliant sections
- [x] Scenic Byways and Rider Magazine have crawl-plan artifacts, fixture tests, and PASS crawl reports
- [x] Curvature discovery has a committed provenance landing document and executable consumer task
- [x] The task plan explicitly covers Convex/mobile provenance survival for Epic 4 metadata
- [x] This epic can be executed by `/kb-run-epic epic-04-sources-government-editorial`

---

## Notes

- Scenic Byways GIS should be planned as a geometry and metadata upgrade over the Epic 2 FHWA baseline, not a naïve “799 new routes” assumption.
- Rider Magazine is upstream of the calibration gate. A partial or softened ingest here poisons Epic 8.
- Curvature discovery must consume a precomputed artifact only. Running raw OSM curvature generation is out of scope for this epic.
- The current mobile lean sync path only persists route-card fields. That gap is folded into `SRC-001` so provenance survives to existing detail surfaces without adding a fourth task.
- Curvature storage follow-up is now implemented: the full US artifact, manifest, and 51 state shards were published to Convex File Storage, release/shard metadata is live in `curation_artifact_releases` and `curation_artifact_shards`, and the active release is `adamfranco-us-curvature-51-states-sha256-ab590f7234b9`.
