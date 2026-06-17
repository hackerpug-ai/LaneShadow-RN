# QUAL-003: Quality Floor Filter (premium/standard/minimal)

**Task ID:** QUAL-003
**Sprint:** [sprint-06 — Quality Infrastructure (Semantic Dedup & Floor)](SPRINT.md)
**Assigned To:** python-implement
**Reviewer:** python-review
**Review Mode:** SINGLE
**Status:** Backlog
**Priority:** P0
**Effort:** S
**Estimate:** 90 min
**Type:** FEATURE
**PRD Refs:** UC-QUAL-02
**Depends on:** QUAL-001  |  **Blocks:** QUAL-004

---

## GOAL

Read reconciled curated_routes post-dedup, compute a qualityTier (premium/standard/minimal) for each route based on field completeness with a government-source allowlist, write the tier back to Convex, and log tier distribution counts.

## DELIVERABLE

- scripts/curation/pipeline/quality/__init__.py (NEW): package init exposing FloorFilter
- scripts/curation/pipeline/quality/floor_filter.py (NEW): FloorFilter class with run(), _compute_tier(), _is_government_source(), _log_distribution(), main() entrypoint
- scripts/curation/tests/test_qual_003.py (NEW): pytest suite covering all ACs with mocked Convex HTTP via responses library

## DONE WHEN

- [ ] Every curated_route fetched from Convex receives a qualityTier assignment of 'premium', 'standard', or 'minimal'
- [ ] Tier calculation uses the at-least-one-of rule: description > 100 chars OR community_rating present OR FHWA designation present OR curvatureScore present earns at minimum 'standard'; all four present earns 'premium'
- [ ] Government sources (FHWA, Scenic Byways) are allowlisted: routes from these sources are never assigned 'minimal' regardless of field completeness
- [ ] qualityTier is written back to each curated_route in Convex via the sync HTTP bridge (updateRoute or equivalent mutation)
- [ ] Tier distribution counts (premium: N, standard: N, minimal: N) are logged to stdout and written to scripts/curation/data/reports/quality_floor_report.json
- [ ] Phase 1 is soft-floor only — no routes are deleted or rejected
- [ ] cd scripts/curation && python -m pytest tests/test_qual_003.py -v passes
- [ ] Only WRITE-ALLOWED files modified

## OUT OF SCOPE

- Route rejection or deletion based on quality tier — Phase 1 is soft-floor only; hard rejection is deferred to a future sprint
- LLM-assisted quality scoring — QUAL-003 is purely deterministic field-completeness logic
- Elevation or surface completeness as tier-determining fields in Phase 1 — listed as future signals but excluded from the Phase 1 scoring rule
- CI integration of the quality floor report — deferred to QUAL-004
- Re-deduplication or re-arbitration triggered by tier assignment — QUAL-003 is read-only with respect to dedup outputs

## CRITICAL CONSTRAINTS

**MUST:**
- Implement the at-least-one-of scoring rule exactly: description > 100 chars, community_rating present (not null/empty), FHWA designation present (not null/empty), curvatureScore present (not null/undefined) — meeting one qualifies for 'standard'; meeting all four qualifies for 'premium'; meeting none assigns 'minimal'
- Apply government source allowlist: if a route's sourceRefs contains 'FHWA' or 'Scenic Byways', its minimum tier is 'standard' even if zero completeness fields are populated
- Write qualityTier back to every route in Convex — no route may be left with a null or stale qualityTier after a successful run
- Log and persist tier distribution (counts for premium, standard, minimal) to scripts/curation/data/reports/quality_floor_report.json on every run

**NEVER:**
- Delete or reject any route based on qualityTier — Phase 1 is soft-floor only; this is an explicit out-of-scope guard
- Use LLM inference to determine quality tier — scoring must be fully deterministic based on field presence and length
- Write to field_provenance dict or route_mentions table — those fields no longer exist
- Hit the real Convex deployment in tests — all HTTP must be mocked via responses library

**STRICTLY:**
- The allowlist check must run before the completeness check — a government-source route cannot be downgraded to 'minimal' by any completeness logic path
- The scoring rule must handle None, empty string, and 0 as equivalent to 'not present' for all four completeness fields

## SPECIFICATION

**Objective:** Implement a deterministic FloorFilter that assigns qualityTier to every post-dedup curated_route based on field completeness and a government-source allowlist, writes tiers back to Convex, and produces a tier distribution report — without rejecting any routes.

**Success state:** After a successful run, every curated_route in Convex has a non-null qualityTier, FHWA and Scenic Byways routes are all 'standard' or 'premium', quality_floor_report.json exists with distribution counts summing to the total route count, and no routes have been deleted.

## ACCEPTANCE CRITERIA (TDD Beads)

Each AC is a RED → GREEN → REFACTOR micro-cycle. Orchestrator advances through ACs sequentially.

### 1: All four completeness fields present yields premium tier

**GIVEN:** A route with description='A' * 101, community_rating=4.5, designation='US Scenic Byways', curvatureScore=1.8, and source='BBR'
**WHEN:** FloorFilter._compute_tier() is called
**THEN:** Returns 'premium'

- **Verify:** `cd scripts/curation && python -m pytest tests/test_qual_003.py::TestFloorFilter::test_all_fields_present_yields_premium -v`
- **Test file:** `scripts/curation/tests/test_qual_003.py`
- **Test function:** `test_all_fields_present_yields_premium`
- **TDD state:** [ ] RED  [ ] VERIFY_RED  [ ] GREEN  [ ] VERIFY_GREEN  [ ] REFACTOR

### 2: At least one completeness field yields standard tier

**GIVEN:** A route with description='Short', community_rating=None, designation=None, curvatureScore=1.2, and source='motorcycleroads'
**WHEN:** FloorFilter._compute_tier() is called
**THEN:** Returns 'standard' (curvatureScore present satisfies the at-least-one rule)

- **Verify:** `cd scripts/curation && python -m pytest tests/test_qual_003.py::TestFloorFilter::test_one_field_present_yields_standard -v`
- **Test file:** `scripts/curation/tests/test_qual_003.py`
- **Test function:** `test_one_field_present_yields_standard`
- **TDD state:** [ ] RED  [ ] VERIFY_RED  [ ] GREEN  [ ] VERIFY_GREEN  [ ] REFACTOR

### 3: Zero completeness fields yields minimal tier for non-government source

**GIVEN:** A route with description='Short', community_rating=None, designation=None, curvatureScore=None, and source='curvature_discovery'
**WHEN:** FloorFilter._compute_tier() is called
**THEN:** Returns 'minimal'

- **Verify:** `cd scripts/curation && python -m pytest tests/test_qual_003.py::TestFloorFilter::test_no_fields_yields_minimal -v`
- **Test file:** `scripts/curation/tests/test_qual_003.py`
- **Test function:** `test_no_fields_yields_minimal`
- **TDD state:** [ ] RED  [ ] VERIFY_RED  [ ] GREEN  [ ] VERIFY_GREEN  [ ] REFACTOR

### 4: Government source allowlist prevents minimal tier

**GIVEN:** A route with description='Short', community_rating=None, designation=None, curvatureScore=None, and sourceRefs containing 'FHWA'
**WHEN:** FloorFilter._compute_tier() is called
**THEN:** Returns 'standard' (FHWA allowlist overrides zero-completeness minimal assignment)

- **Verify:** `cd scripts/curation && python -m pytest tests/test_qual_003.py::TestFloorFilter::test_government_source_allowlist_prevents_minimal -v`
- **Test file:** `scripts/curation/tests/test_qual_003.py`
- **Test function:** `test_government_source_allowlist_prevents_minimal`
- **TDD state:** [ ] RED  [ ] VERIFY_RED  [ ] GREEN  [ ] VERIFY_GREEN  [ ] REFACTOR

### 5: Tier distribution report written with correct counts

**GIVEN:** A mock catalog of 6 routes: 2 premium, 3 standard, 1 minimal
**WHEN:** FloorFilter.run() completes and _log_distribution() is called
**THEN:** quality_floor_report.json contains {'premium': 2, 'standard': 3, 'minimal': 1, 'total': 6} and the same counts are logged to stdout

- **Verify:** `cd scripts/curation && python -m pytest tests/test_qual_003.py::TestFloorFilter::test_tier_distribution_report_written -v`
- **Test file:** `scripts/curation/tests/test_qual_003.py`
- **Test function:** `test_tier_distribution_report_written`
- **TDD state:** [ ] RED  [ ] VERIFY_RED  [ ] GREEN  [ ] VERIFY_GREEN  [ ] REFACTOR

### 6: Empty string and zero treated as not-present

**GIVEN:** A route with description='', community_rating=0, designation='', curvatureScore=0, and source='BBR'
**WHEN:** FloorFilter._compute_tier() is called
**THEN:** Returns 'minimal' (empty string and zero are not counted as present completeness fields)

- **Verify:** `cd scripts/curation && python -m pytest tests/test_qual_003.py::TestFloorFilter::test_empty_and_zero_treated_as_not_present -v`
- **Test file:** `scripts/curation/tests/test_qual_003.py`
- **Test function:** `test_empty_and_zero_treated_as_not_present`
- **TDD state:** [ ] RED  [ ] VERIFY_RED  [ ] GREEN  [ ] VERIFY_GREEN  [ ] REFACTOR

## TEST CRITERIA

Boolean statements that map 1:1 to acceptance criteria. No conditional language.

1. A route with all four completeness fields populated returns 'premium' from _compute_tier()
2. A route with exactly one completeness field populated returns 'standard' from _compute_tier()
3. A route with zero completeness fields and a non-government source returns 'minimal' from _compute_tier()
4. A route with zero completeness fields and sourceRefs containing 'FHWA' returns 'standard' from _compute_tier()
5. quality_floor_report.json premium + standard + minimal counts sum to the total number of routes processed
6. Empty string, None, and zero are all treated as not-present for all four completeness fields

## READING LIST

- `scripts/curation/pipeline/embed/batch_embed_routes.py` (lines: 1-80) — main() CLI pattern and distribution logging to replicate for FloorFilter
- `scripts/curation/pipeline/sync/convex_fetch.py` (lines: 1-60) — How to fetch all curated_routes from Convex via HTTP GET — pagination pattern if present
- `scripts/curation/pipeline/sync/convex_push.py` (lines: 1-60) — How to write back qualityTier to a curated_route — mutation name and payload shape
- `scripts/curation/tests/test_inf004_embed.py` (lines: 1-50) — responses library mock pattern for Convex HTTP — GET and POST mock registration
- `.spec/prds/curation-hardening/05-uc-qual.md` (lines: 1-80) — UC-QUAL-02 exact tier definition, completeness fields, and government source allowlist specification

## GUARDRAILS

### WRITE-ALLOWED
- scripts/curation/pipeline/quality/__init__.py
- scripts/curation/pipeline/quality/floor_filter.py
- scripts/curation/tests/test_qual_003.py
- scripts/curation/data/reports/quality_floor_report.json

### WRITE-PROHIBITED
- convex/** — schema contract frozen, handled by INF-003; QUAL-003 is a consumer only
- scripts/curation/pipeline/dedup/** — owned by QUAL-001 and QUAL-002; do not modify
- scripts/curation/pipeline/embed/** — embedding generation owned by INF-004
- scripts/curation/pipeline/models.py — shared dataclass; changes require cross-task review
- scripts/curation/data/arbitration/** — dedup outputs are read-only inputs for QUAL-003
- Any file not explicitly listed in write_allowed

## DESIGN

**References:**
- SPRINT.md (sprint-06-quality-dedup-floor/SPRINT.md)
- .spec/prds/curation-hardening/05-uc-qual.md#UC-QUAL-02
- .spec/prds/curation-hardening/tasks/epic-03-foundation-models-schema/INF-003.md

**Interaction notes:**
- qualityTier is a schema-defined enum on curated_routes: 'premium' | 'standard' | 'minimal' — do not invent other values
- sourceRefs is a list field on curated_routes; _is_government_source() checks if any element matches 'FHWA' or 'Scenic Byways' (case-sensitive, exact match)
- The Convex write-back mutation name for qualityTier must be confirmed from convex_push.py before implementation — do not assume a name; check the actual mutation

**Pattern (reference):**

```python
from dataclasses import dataclass
from typing import Literal
import json, logging

QualityTier = Literal['premium', 'standard', 'minimal']
GOVERNMENT_SOURCES = {'FHWA', 'Scenic Byways'}

@dataclass
class TierDistribution:
    premium: int = 0
    standard: int = 0
    minimal: int = 0

    @property
    def total(self) -> int:
        return self.premium + self.standard + self.minimal

class FloorFilter:
    def run(self, routes: list[dict]) -> TierDistribution: ...
    def _compute_tier(self, route: dict) -> QualityTier: ...
    def _is_government_source(self, route: dict) -> bool: ...
    def _log_distribution(self, dist: TierDistribution, output_path: str) -> None: ...

def main():
    routes = fetch_all_routes()  # via convex_fetch.py
    fltr = FloorFilter()
    dist = fltr.run(routes)
    fltr._log_distribution(dist, 'data/reports/quality_floor_report.json')
    print(json.dumps({'premium': dist.premium, 'standard': dist.standard, 'minimal': dist.minimal, 'total': dist.total}, indent=2))
```

**Pattern source:** `scripts/curation/pipeline/embed/batch_embed_routes.py`

**Anti-pattern:** Do not reject or delete routes based on tier — Phase 1 is soft-floor only. Do not use LLM inference for scoring. Do not treat curvatureScore=0 as present — zero is not a valid curvature signal. Do not re-introduce field_provenance or route_mentions.

## VERIFICATION GATES

| Gate | Command | Expected |
|---|---|---|
| All Tests Pass | `cd scripts/curation && python -m pytest tests/test_qual_003.py -v` | Exit 0 |
| Scope Compliance | `git diff --name-only` | Only WRITE-ALLOWED files modified |

## AGENT INSTRUCTIONS

Per AC: RED (write pytest with xfail marker, mock Convex fetch HTTP GET via responses library to return fixture route dicts, mock Convex push HTTP POST to capture qualityTier write-back) → GREEN (implement minimal FloorFilter with _compute_tier, _is_government_source, _log_distribution passing each AC) → REFACTOR (extract GOVERNMENT_SOURCES constant, TierDistribution dataclass, clean main()). Orchestrator verifies each gate after REFACTOR. Confirm the exact Convex mutation name for writing qualityTier from convex_push.py before implementing run().

## AGENT ASSIGNMENT

**Implementation agent:** `python-implement`
**Rationale:** Deterministic field-completeness scoring and Convex write-back via HTTP bridge — pure Python pipeline with no LLM calls and no schema changes.

**Review agent:** `python-review`
**Rationale:** Domain-specific reviewer for Python curation pipeline — validates TDD evidence, scope compliance, and anti-pattern adherence with fresh context.

## CODING STANDARDS

- `brain/docs/kanban/TASK-TEMPLATE.md (v5.0)`
- `brain/docs/TDD-METHODOLOGY.md`

## DEPENDENCIES

**Depends on:** QUAL-001

## NOTES

- Phase 1 hard constraint: soft-floor only — no route is ever deleted or rejected; enforce this as an explicit guard in _compute_tier() that returns a tier but never removes a route from the output list
- The at-least-one-of rule is intentionally lenient for Phase 1 — a single curvature score is enough for 'standard'; the bar for 'minimal' should be routes with truly no structured data
- Government source allowlist is exact-match case-sensitive against sourceRefs list elements — do not use substring matching or case folding
- quality_floor_report.json is the seed for the CI coverage gate planned in QUAL-004 — ensure the JSON schema is stable: keys 'premium', 'standard', 'minimal', 'total', 'generatedAt' (ISO timestamp)
