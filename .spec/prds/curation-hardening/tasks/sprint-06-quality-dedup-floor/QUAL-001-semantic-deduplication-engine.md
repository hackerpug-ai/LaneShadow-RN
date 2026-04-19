# QUAL-001: Semantic Deduplication Engine

**Task ID:** QUAL-001
**Sprint:** [sprint-06 — Quality Infrastructure (Semantic Dedup & Floor)](SPRINT.md)
**Assigned To:** python-implement
**Reviewer:** python-review
**Review Mode:** SINGLE
**Status:** Backlog
**Priority:** P0
**Effort:** L
**Estimate:** 360 min
**Type:** FEATURE
**PRD Refs:** UC-QUAL-01
**Depends on:** INF-003, INF-004, INF-006  |  **Blocks:** QUAL-002, QUAL-003, Sprint-7

---

## GOAL

For every curated_route, retrieve top-10 nearest neighbors via INF-006, auto-merge pairs with cosine > 0.92, queue pairs 0.75–0.92 for LLM arbitration, and emit a calibration set of known-duplicate pairs — all within a 15-minute full-catalog runtime budget.

## DELIVERABLE

- scripts/curation/pipeline/dedup/__init__.py (NEW): package init exposing SemanticDeduplicator
- scripts/curation/pipeline/dedup/semantic_deduplicator.py (NEW): SemanticDeduplicator class with run(), _fetch_candidates(), _classify_pair(), _merge_routes(), emit_calibration_set(), cost_ledger
- scripts/curation/tests/test_qual_001.py (NEW): pytest suite covering all ACs with mocked Convex HTTP via responses library

## DONE WHEN

- [x] All curated_routes are iterated and top-10 nearest neighbors fetched via findCandidateRoutesByEmbedding
- [x] Pairs with cosine > 0.92 are auto-merged using source priority order; each merge writes to route_matches via addRouteMatch and appends to llmReconciliationLog
- [x] Pairs with cosine 0.75–0.92 are written to an arbitration queue JSON file consumed by QUAL-002
- [x] Pairs with cosine < 0.75 are left untouched with no route_matches row written
- [ ] A calibration set of known-duplicate pairs (at minimum 50 confirmed positives, 50 confirmed negatives) is emitted to scripts/curation/data/calibration/dedup_calibration_set.json ← FAIL: calibration labels are derived from cosine classification (not “confirmed”), and there is no enforcement of >=50 positives/negatives (evidence: scripts/curation/pipeline/dedup/semantic_deduplicator.py:323)
- [ ] Full-catalog run completes under 15 minutes (measured via wall-clock timer in main()) ← PARTIAL: wall-clock warning exists, but provided verifications ran with empty catalog (no evidence of full-catalog runtime) (evidence: scripts/curation/pipeline/dedup/semantic_deduplicator.py:556)
- [x] cd scripts/curation && python -m pytest tests/test_qual_001.py -v passes
- [x] Only WRITE-ALLOWED files modified

## OUT OF SCOPE

- LLM arbitration of 0.75–0.92 pairs — deferred to QUAL-002
- Quality tier assignment — deferred to QUAL-003
- Re-embedding routes — INF-004 owns all embeddings; QUAL-001 only reads them
- Geospatial or Levenshtein fallback cascade — old architecture, do not reintroduce
- Rejection of low-quality routes — deferred to QUAL-004 and beyond
- Threshold tuning based on calibration set — calibration set is emitted for future manual tuning; QUAL-001 uses fixed initial thresholds

## CRITICAL CONSTRAINTS

**MUST:**
- Use cosine thresholds exactly: > 0.92 = auto-merge, 0.75–0.92 = arbitration queue, < 0.75 = separate — do not invent intermediate thresholds
- Apply source priority FHWA > Scenic Byways > Rider Mag > motorcycleroads > BBR > curvature_discovery on every conflicting field when merging
- Write every auto-merge decision to route_matches table via addRouteMatch (HTTP POST through convex_push.py) with matchConfidence, cosineSimilarity, matchReasoning populated
- Append one llmReconciliationLog entry per merge to the winning curated_route with runId, reconciledAt, conflictsResolved, notes
- Emit calibration set JSON before main() exits — file must exist even if catalog is empty (write empty arrays)

**NEVER:**
- Write to field_provenance dict or route_mentions table — those fields no longer exist in the schema
- Re-embed routes by calling updateRouteEmbedding — INF-004 owns all embedding generation
- Skip writing a route_matches row for any auto-merged pair, even if the pair was already merged in a prior run
- Hit the real Convex deployment in tests — all HTTP calls must be intercepted by the responses library
- Introduce a new cosine threshold value not defined in the spec (0.92 and 0.75 are the only thresholds)

**STRICTLY:**
- Convex function names must match INF-006 exactly: findCandidateRoutesByEmbedding, addRouteMatch — no aliases or wrappers that rename them
- Runtime budget of < 15 minutes for full catalog (5,608 routes) must be enforced with a wall-clock check in main() that logs a WARNING if exceeded

## SPECIFICATION

**Objective:** Implement a SemanticDeduplicator that iterates all curated_routes, uses vector similarity to classify each pair as auto-merge, arbitration-queue, or separate, writes merge decisions to Convex, and emits a calibration set for threshold tuning.

**Success state:** After a successful run against the full merged catalog, route_matches contains one row per auto-merged pair with isArbitrated=false, an arbitration queue file exists at scripts/curation/data/arbitration/arbitration_queue.json with all 0.75–0.92 pairs, llmReconciliationLog is updated on merged routes, and the calibration JSON file is present and valid.

## ACCEPTANCE CRITERIA (TDD Beads)

Each AC is a RED → GREEN → REFACTOR micro-cycle. Orchestrator advances through ACs sequentially.

### 1: Auto-merge above threshold

**GIVEN:** Two routes with cosine similarity 0.95 are returned as neighbors by findCandidateRoutesByEmbedding
**WHEN:** SemanticDeduplicator.run() processes the higher-priority route
**THEN:** addRouteMatch is called with cosineSimilarity=0.95, matchConfidence='high', isArbitrated=false; the winning route's llmReconciliationLog gains one entry; the lower-priority route is marked as merged

- **Verify:** `cd scripts/curation && python -m pytest tests/test_qual_001.py::TestSemanticDeduplicator::test_auto_merge_above_threshold -v`
- **Test file:** `scripts/curation/tests/test_qual_001.py`
- **Test function:** `test_auto_merge_above_threshold`
- **TDD state:** [ ] RED  [ ] VERIFY_RED  [ ] GREEN  [ ] VERIFY_GREEN  [ ] REFACTOR

### 2: Arbitration queue for mid-range similarity

**GIVEN:** Two routes with cosine similarity 0.83 are returned as neighbors
**WHEN:** SemanticDeduplicator.run() processes the pair
**THEN:** The pair is written to arbitration_queue.json with cosineSimilarity=0.83; addRouteMatch is NOT called; no llmReconciliationLog entry is added

- **Verify:** `cd scripts/curation && python -m pytest tests/test_qual_001.py::TestSemanticDeduplicator::test_arbitration_queue_mid_range -v`
- **Test file:** `scripts/curation/tests/test_qual_001.py`
- **Test function:** `test_arbitration_queue_mid_range`
- **TDD state:** [ ] RED  [ ] VERIFY_RED  [ ] GREEN  [ ] VERIFY_GREEN  [ ] REFACTOR

### 3: Threshold boundary exactness at 0.92

**GIVEN:** One neighbor pair at cosine exactly 0.92 and another at 0.921
**WHEN:** SemanticDeduplicator._classify_pair() is called for each
**THEN:** cosine=0.92 is classified as 'arbitration' (not auto-merge); cosine=0.921 is classified as 'auto-merge'

- **Verify:** `cd scripts/curation && python -m pytest tests/test_qual_001.py::TestSemanticDeduplicator::test_threshold_boundary_at_092 -v`
- **Test file:** `scripts/curation/tests/test_qual_001.py`
- **Test function:** `test_threshold_boundary_at_092`
- **TDD state:** [ ] RED  [ ] VERIFY_RED  [ ] GREEN  [ ] VERIFY_GREEN  [ ] REFACTOR

### 4: Source priority tie-breaking

**GIVEN:** A cosine > 0.92 pair where route_a has source='BBR' and route_b has source='FHWA'
**WHEN:** _merge_routes() is called
**THEN:** route_b (FHWA) is the surviving winner; route_a fields are discarded in favor of route_b on all conflicts; matchReasoning contains 'source_priority'

- **Verify:** `cd scripts/curation && python -m pytest tests/test_qual_001.py::TestSemanticDeduplicator::test_source_priority_fhwa_over_bbr -v`
- **Test file:** `scripts/curation/tests/test_qual_001.py`
- **Test function:** `test_source_priority_fhwa_over_bbr`
- **TDD state:** [ ] RED  [ ] VERIFY_RED  [ ] GREEN  [ ] VERIFY_GREEN  [ ] REFACTOR

### 5: Calibration set emission

**GIVEN:** A mock catalog with 10 routes where 4 pairs are known duplicates (cosine > 0.92) and 4 pairs are known non-duplicates (cosine < 0.75)
**WHEN:** emit_calibration_set() is called after run()
**THEN:** scripts/curation/data/calibration/dedup_calibration_set.json exists, contains 'positives' list with 4 entries and 'negatives' list with 4 entries, each entry has routeId_a, routeId_b, cosineSimilarity, label

- **Verify:** `cd scripts/curation && python -m pytest tests/test_qual_001.py::TestSemanticDeduplicator::test_calibration_set_emitted -v`
- **Test file:** `scripts/curation/tests/test_qual_001.py`
- **Test function:** `test_calibration_set_emitted`
- **TDD state:** [ ] RED  [ ] VERIFY_RED  [ ] GREEN  [ ] VERIFY_GREEN  [ ] REFACTOR

### 6: Runtime budget warning on exceeded wall clock

**GIVEN:** A mock catalog of 100 routes where the mocked findCandidateRoutesByEmbedding is artificially delayed past 15 minutes via monkeypatching
**WHEN:** main() finishes
**THEN:** A WARNING log line containing 'runtime budget exceeded' is emitted; the process exits 0 (soft warning, not hard failure)

- **Verify:** `cd scripts/curation && python -m pytest tests/test_qual_001.py::TestSemanticDeduplicator::test_runtime_budget_warning -v`
- **Test file:** `scripts/curation/tests/test_qual_001.py`
- **Test function:** `test_runtime_budget_warning`
- **TDD state:** [ ] RED  [ ] VERIFY_RED  [ ] GREEN  [ ] VERIFY_GREEN  [ ] REFACTOR

## TEST CRITERIA

Boolean statements that map 1:1 to acceptance criteria. No conditional language.

1. addRouteMatch is called exactly once for each cosine > 0.92 pair with cosineSimilarity, matchConfidence='high', isArbitrated=false populated
2. Each auto-merged route's llmReconciliationLog gains exactly one new entry per run invocation
3. Pairs with cosine 0.75–0.92 appear in arbitration_queue.json and addRouteMatch is not called for them
4. cosine=0.92 is classified as arbitration; cosine=0.921 is classified as auto-merge
5. The route from the lower-priority source is the loser in every conflicting-field merge
6. dedup_calibration_set.json is written with a 'positives' key and a 'negatives' key after every run
7. main() emits a WARNING log when wall-clock time exceeds 900 seconds and still exits 0

## READING LIST

- `scripts/curation/pipeline/embed/batch_embed_routes.py` (lines: 1-80) — CLI entrypoint pattern, cost ledger dataclass, main() structure to replicate
- `scripts/curation/pipeline/sync/convex_push.py` (lines: 1-60) — How to POST to Convex HTTP action endpoint; auth header pattern
- `scripts/curation/tests/test_inf004_embed.py` (lines: 1-80) — responses library mock pattern for Convex HTTP calls; MagicMock fixture conventions
- `server/convex/semanticSearch.ts` (lines: 1-100) — Exact signatures of findCandidateRoutesByEmbedding and addRouteMatch — do not deviate
- `.spec/prds/curation-hardening/tasks/epic-03-foundation-models-schema/INF-006.md` (lines: 1-60) — INF-006 contract: return shape of findCandidateRoutesByEmbedding, route_matches schema fields

## GUARDRAILS

### WRITE-ALLOWED
- scripts/curation/pipeline/dedup/__init__.py
- scripts/curation/pipeline/dedup/semantic_deduplicator.py
- scripts/curation/tests/test_qual_001.py
- scripts/curation/data/calibration/dedup_calibration_set.json
- scripts/curation/data/arbitration/arbitration_queue.json

### WRITE-PROHIBITED
- server/convex/** — schema contract frozen, handled by INF-003; QUAL-001 is a consumer only
- scripts/curation/pipeline/embed/** — embedding generation owned by INF-004; never re-embed
- scripts/curation/pipeline/sync/** — Convex HTTP bridge is stable; do not modify
- scripts/curation/pipeline/models.py — Route dataclass is shared; changes require cross-task review
- Any file not explicitly listed in write_allowed

## DESIGN

**References:**
- SPRINT.md (sprint-06-quality-dedup-floor/SPRINT.md)
- .spec/prds/curation-hardening/05-uc-qual.md#UC-QUAL-01
- .spec/prds/curation-hardening/tasks/epic-03-foundation-models-schema/INF-006.md

**Interaction notes:**
- findCandidateRoutesByEmbedding returns [{routeId, cosineSimilarity, name, state, candidateIdentifiers}] — the embedding itself is not returned; use it purely for neighbor lookup
- addRouteMatch requires routeId (the surviving route), not the loser; set rerankModel=None and rerankCost=0.0 for auto-merges since no LLM is used
- arbitration_queue.json must be readable by QUAL-002 without schema changes; include all fields QUAL-002 needs: routeId_a, routeId_b, cosineSimilarity, name_a, name_b, state_a, state_b, highway_a, highway_b, description_a, description_b, candidate_identifiers_a, candidate_identifiers_b

**Pattern (reference):**

```python
from dataclasses import dataclass, field
from typing import List
import time, json, logging

@dataclass
class DedupLedger:
    auto_merged: int = 0
    queued_arbitration: int = 0
    separated: int = 0
    wall_seconds: float = 0.0

class SemanticDeduplicator:
    MERGE_THRESHOLD = 0.92
    ARBITRATION_FLOOR = 0.75
    SOURCE_PRIORITY = ['FHWA','Scenic Byways','Rider Mag','motorcycleroads','BBR','curvature_discovery']

    def run(self, routes: List[dict]) -> DedupLedger: ...
    def _fetch_candidates(self, route: dict) -> List[dict]: ...
    def _classify_pair(self, cosine: float) -> str: ...
    def _merge_routes(self, winner: dict, loser: dict) -> dict: ...
    def emit_calibration_set(self, output_path: str) -> None: ...

def main():
    start = time.time()
    deduplicator = SemanticDeduplicator()
    routes = fetch_all_routes()  # via convex_fetch.py
    ledger = deduplicator.run(routes)
    elapsed = time.time() - start
    if elapsed > 900:
        logging.warning('runtime budget exceeded: %.1fs > 900s', elapsed)
    deduplicator.emit_calibration_set('data/calibration/dedup_calibration_set.json')
    print(json.dumps(asdict(ledger), indent=2))
```

**Pattern source:** `scripts/curation/pipeline/embed/batch_embed_routes.py`

**Anti-pattern:** Do not re-introduce field_provenance dict or route_mentions table — those fields are gone from the schema. Do not call updateRouteEmbedding — INF-004 owns all embedding generation. Do not implement Levenshtein or geospatial fallback — the old cascade plan is dead. Do not invent cosine thresholds other than 0.92 and 0.75.

## VERIFICATION GATES

| Gate | Command | Expected |
|---|---|---|
| All Tests Pass | `cd scripts/curation && python -m pytest tests/test_qual_001.py -v` | Exit 0 |
| Scope Compliance | `git diff --name-only` | Only WRITE-ALLOWED files modified |
| Runtime Budget | `cd scripts/curation && time python -m pipeline.dedup.semantic_deduplicator --dry-run --limit 5608` | Full-catalog run completes under 15 min (900 seconds wall clock) |

## AGENT INSTRUCTIONS

Per AC: RED (write pytest with xfail marker, mock Convex HTTP endpoints via responses library — register POST URLs for findCandidateRoutesByEmbedding and addRouteMatch with fixture JSON responses) → GREEN (implement minimal SemanticDeduplicator to make each AC pass) → REFACTOR (extract _classify_pair and _merge_routes, add cost ledger, add runtime timer). Orchestrator verifies each gate after REFACTOR. Do not commit until all 6 ACs are GREEN and git diff --name-only shows only WRITE-ALLOWED files.

## AGENT ASSIGNMENT

**Implementation agent:** `python-implement`
**Rationale:** Pure Python pipeline work: vector retrieval via Convex HTTP bridge, threshold logic, merge writes, calibration set emission — no mobile or Convex schema changes required.

**Review agent:** `python-review`
**Rationale:** Domain-specific reviewer for Python curation pipeline — validates TDD evidence, scope compliance, and anti-pattern adherence with fresh context.

## CODING STANDARDS

- `brain/docs/kanban/TASK-TEMPLATE.md (v5.0)`
- `brain/docs/TDD-METHODOLOGY.md`

## DEPENDENCIES

**Depends on:** none

## NOTES

- Thresholds 0.92 and 0.75 are INITIAL GUESSES — the calibration set emitted by this task is the mechanism for future tuning; do not treat them as final
- The arbitration_queue.json schema is a contract with QUAL-002 — include all fields QUAL-002 needs in its prompt (name, state, highway, description, candidate_identifiers) to avoid a breaking change
- source priority applies field-by-field: a lower-priority source's description may be longer and still be overwritten if FHWA has any description at all — keep logic simple and consistent
- INF-006 findCandidateRoutesByEmbedding returns only top-10 neighbors by default; QUAL-001 must not assume completeness — a true duplicate outside top-10 will be missed and that is acceptable in Phase 1
- Pairs where route_a == route_b (self-neighbor) must be filtered out before classification
