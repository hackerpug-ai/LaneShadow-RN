---
stability: FEATURE_SPEC
last_validated: 2026-07-10
prd_version: 3.0.0
---

# Functional Groups

| Group | Prefix | Description |
|-------|--------|-------------|
| Catalog Hygiene | **HYG** | Deterministic at-rest cleanup: editorial score-scale normalization (÷100), duplicate-group merge, length + test-row quarantine, state-string normalization. Runs first — the gate is calibrated against claimed lengths, so the dirty truth is fixed before the levers run. |
| Geometry Recovery | **REC** | The rescue-first waterfall over all ~4,050 broken-geometry routes: lever 1 promote in-row scraped polylines, lever 2 AI-reconstruct from turn-by-turn descriptions, lever 3 re-route from names/endpoints; resumable orchestration; provenance recording; retirement only after all levers fail, founder-confirmed, reversible. |
| Verification & Review | **VER** | The trust authority, independent of the production engine: the single deterministic geometry gate, the bounded LLM repair round, the cross-provider ride-worthiness classifier, the REVIEW queue, and the founder couch-sample gate that unlocks the full batch. Owns the gate spec — REC invokes it, VER defines it. |
| Rider-Ready Surface | **SURF** | The read-path promise: the stored `riderReady` flag; hard gating of the discovery agent tool, browse queries, and carousel; centroid-fallback removal; honest thin-region absence (including labeled fallback-to-national and the distance-label fix); detail-view provenance caption; the saved-routes reachability guarantee. |
| Agent Quality | **AGT** | The conversation promise: the Mastra rebuild of the agent layer on a Sonnet-class orchestrator tier (regex intent routing deleted, deterministic routing pipeline preserved as tools, in-session memory + personal-library awareness); location- and intent-grounded discovery (duration, waypoint-anchored stops); one-question interrogation when ambiguous; honest distances, thin-data candor, and volunteered weather verdicts; persona-fit reply shaping (simple-by-default, honest comfort labels, shareable close); the real failed transcripts as the regression eval suite with wired traces. |

## Use Case Summary

| Group | Prefix | Use Cases |
|-------|--------|-----------|
| Catalog Hygiene | HYG | 4 (UC-HYG-01 … UC-HYG-04) |
| Geometry Recovery | REC | 5 (UC-REC-01 … UC-REC-05) |
| Verification & Review | VER | 5 (UC-VER-01 … UC-VER-05) |
| Rider-Ready Surface | SURF | 6 (UC-SURF-01 … UC-SURF-06) |
| Agent Quality | AGT | 6 (UC-AGT-01 … UC-AGT-06) |
| **Total** | | **26** |
