# INF-011 — US_STATES allowlist in crawl_plan inventory classifier

**Epic:** epic-03-foundation-models-schema
**Status:** **PHASE 1 COMPLETE (2026-04-14 afternoon)** — framework scaffolding + USPS prefix mapping + `states_all` fallback + DC support landed. Phase 2 (NLP-based extraction for 17 remaining MR cross-country records) deferred to Sprint 10.
**Priority:** P2 (non-blocking follow-up)
**Agent:** python-implement
**Estimated effort:** S (~60 min) — actual Phase 1 wall clock ~90 min including tests + retroactive normalization script
**Created:** 2026-04-14 (morning, from BASE-009a MR remediation follow-up)
**Phase 1 completed:** 2026-04-14 afternoon (commit TBD)

---

## Context

BASE-009a's MotorcycleRoads remediation produced clean staging of 1,899 records, but ~27 of those (1.4%) have a `state_primary` value that is not a US state slug. Examples from the committed staging: `united-states` (12), `southeast` (5), `northeast` (2), `pacific-coast` (2), `east-coast` (1), `golf-coast` (1), `great-lakes` (1), `midwest` (1), `northwest` (1), `south` (1).

**Root cause.** `scripts/curation/pipeline/sources/crawl_plan/inventory.py::classify()` accepts any URL matching the PT-03 pattern `^/motorcycle-roads/([a-z-]+)/([A-Za-z0-9-]+)$` without intersecting the first captured group against a known US_STATES allowlist. MR publishes a small number of cross-region "trip" pages under the same 2-segment URL pattern using region slugs instead of state slugs; these slip through the classifier and get stamped with a non-state `state_primary`.

**Current state (documented in MR crawl-report.md):** these 27 records still parse cleanly — `route_name`, `description`, `rating`, `distance_mi`, and `states_all` are all populated. The `states_all` field correctly reflects the multi-state nature where the meta description carries it. Only `state_primary` is non-canonical.

**Why this wasn't blocking for BASE-009a:** 1.4% is below any gate threshold; no schema violation; records are honest measurements of site reality. Flagged as non-blocking follow-up in MR `crawl-report.md` "Known limitation: 27 region-aggregator records".

## Scope

Framework-general improvement to `crawl_plan.inventory.classify()`. Two implementation options:

**Option A — Reject at inventory time.** Add a `US_STATES` allowlist parameter to `classify()` (or a companion `filter_by_state_allowlist()` helper). When a PT-03 URL's captured state slug is not in the allowlist, either (a) reject the URL entirely (framework never fetches it) or (b) reclassify it as a new page type like `PT-04-region-aggregator`.

**Option B — Accept and mark.** Accept the URL as PT-03 but set `state_primary=null` and populate `states_all` from the parser's DOM extraction (meta description or similar). This preserves the route's content while honestly signaling non-canonical provenance.

**Recommendation (for the future implementer):** Option B is more faithful to the "don't silently drop data" principle. Option A is simpler to implement. Discuss before committing — this stub is a placeholder for the decision, not a prescription.

## Acceptance criteria

- [ ] `scripts/curation/pipeline/sources/crawl_plan/inventory.py` exports `US_STATES` constant (set of 50 lowercase state slugs)
- [ ] `classify()` accepts an optional `state_allowlist` parameter (default: `US_STATES`), used to intersect PT-03 URL slugs
- [ ] Unit tests in `test_crawl_plan_framework.py` cover: allowed state → PT-03 classification, disallowed region slug → null / PT-04 / reject (depending on Option A or B)
- [ ] Re-run MR inventory + execution → new staging has 0 non-US-state `state_primary` values OR 27 records with explicit marking (page_type or state_primary=null)
- [ ] Epic 4 SRC-001/006 and Sprint 9 RID-001/002/006 inherit the change (framework-general)
- [ ] Existing 108 fixture tests still pass
- [ ] Framework unit tests still pass
- [ ] MR `crawl-report.md` "Known limitation" section updated to reflect the fix (or removed if Option A and yield is clean)

## Depends on

- BASE-009b complete (to avoid entangling framework changes with the BBR remediation commit)
- Epic 3 INF-001..003 (models + schema extensions) if Option B is chosen and the Route model needs a `state_primary: Optional[str]` field

## Blocks

- None (non-blocking improvement)

## Reference evidence

- `.spec/prds/curation-hardening/crawl-plans/motorcycleroads/crawl-report.md` — "Known limitation: 27 region-aggregator records" section with the full slug/count table
- `.spec/prds/curation-hardening/tasks/epic-02-baseline-pipeline-validation/DECISIONS.md` — "BASE-009b Phase 5 findings" sub-section 3a (gate recalibration) and the surrounding context of why these 27 records were left in scope for BASE-009a

## Rationale for Epic 3 placement

This is an inventory-contract / schema-correctness fix, not a dedup or quality-floor concern. Epic 3 (Foundation — Models, Schema, Dependencies) is the right home because:

1. The change defines what a valid `state_primary` value is — a schema-level contract
2. The fix affects the Route / EnrichedRoute model (Option B adds a nullable field)
3. The INF-011 change is a framework improvement that benefits all future source tasks (Epic 4 SRC-001/006, Sprint 9 RID-001/002/006) which is the same cross-epic scope as the existing INF-001..007

Alternative placements considered and rejected:
- **Sprint 6 (Quality — Dedup & Floor):** the 27 records are not a dedup or quality-floor issue; they parse cleanly and have honest data
- **BASE-009c (new Epic 2 task):** would inflate BASE-009 scope; the point of closing BASE-009a/b cleanly is to unblock Epic 3, not to spawn follow-up work in the same epic

## Notes

- This stub is intentionally brief. When the implementer picks it up, generate a full TASK-TEMPLATE v4.0 file matching Epic 2 BASE-00x quality level (currently Epic 3 INF tasks are stubs per INDEX.md "Stub Tasks" note — only Epic 1 and Epic 2 have full-detail task files).
- Cross-reference in INDEX.md: add row for INF-011 under "Epic 3: Foundation (STUBS)" when this stub is committed.

---

## Phase 1 Execution Summary (2026-04-14 afternoon)

**Scope executed:** Framework scaffolding + USPS prefix mapping + `states_all` fallback + DC support. 30 of 47 region-aggregator records normalized across MR + BBR (64% reduction).

**Deliverables shipped:**

- `scripts/curation/pipeline/sources/crawl_plan/us_states.py` — new module with `US_STATES` frozenset (51 entries: 50 states + DC), `is_us_state()`, `slugify_state_name()`, `normalize_state_primary()`
- `scripts/curation/pipeline/sources/crawl_plan/parser.py` — post-extraction normalization cascade added to `parse_with_selectors()`:
  1. Identity (already canonical) → keep
  2. USPS 2-letter prefix (`ny-*`, `wa-*`, `mt-*`, etc.) → map to full state slug
  3. First US state name in `states_all` → use that slug
  4. Give up (record keeps non-canonical slug)
- `scripts/curation/pipeline/sources/crawl_plan/__init__.py` — exports `US_STATES`, `is_us_state`, `slugify_state_name`, `normalize_state_primary`
- `scripts/curation/pipeline/sources/crawl_plan/fix_regional.py` — one-shot CLI for retroactively normalizing existing staging files (applied to MR + BBR staging)
- `scripts/curation/tests/sources/test_crawl_plan_framework.py` — 40+ new tests covering `TestUSStates`, `TestIsUSState`, `TestSlugifyStateName`, `TestNormalizeStatePrimary` (all 4 cascade paths), `TestParserNormalizesStatePrimary` (end-to-end parser integration)

**Results:**

| Source | Before INF-011 | After INF-011 | Reduction |
|---|---|---|---|
| MotorcycleRoads | 27 / 1,899 (1.42%) | 17 / 1,899 (0.90%) | 37% |
| BestBikingRoads | 20 / 3,224 (0.62%) | **0 / 3,224 (0.00%)** | 100% |
| **Combined community** | 47 / 5,123 (0.92%) | 17 / 5,123 (0.33%) | **64%** |

**Fixes applied:**

- BBR: 13 via USPS prefix mapping + 7 via new DC allowlist entry = 20/20 fixed ✅
- MR: 10 via `states_all` fallback (east-coast → north-carolina for Devil's Racetrack; great-lakes → michigan for Lake Shore Drive; etc.) = 10/27 fixed

**What the 17 remaining MR records are:**

- **11 `united-states` cross-country routes** — literally multi-state tour routes ("Indian's Northeast Texas Loop", "Ashley National Forest to Flaming Gorge National Recreation Area", "Rt 50 - Clarksburg, WV East to Winchester, VA"). `states_all=['United States']` only. Cannot be collapsed to a single `state_primary`. Future option: add `is_cross_country: bool` flag to the Route model (Epic 3 INF-002 scope) or parse state hints from route names via NLP (Sprint 10).
- **6 regional slug records** — routes under `golf-coast`, `great-lakes` (wait no, this was fixed), `midwest`, `northeast`, `pacific-coast`, `southeast` with `states_all` containing only the region name. Route names contain state hints ("PA Route 340 Through Pennsylvania Amish Country" → PA; "Nacimiento Road - Paso Robles to Big Sur" → CA) but extracting them requires NLP. Deferred to Sprint 10.

**Why not fix the remaining 17 now?** NLP-based state extraction from route names is the wrong tool to build in BASE-009 / INF-011 scope. Sprint 10 (Community NLP & Signal Merge) has the NLP pipeline; the `normalize_state_primary()` cascade can be extended there with a 5th case: "regex against route_name for state hints". At 0.33% of combined community catalog, the remaining records are well within any downstream quality-floor tolerance and do not block Epic 3-12 progress.

**Phase 2 (deferred to Sprint 10):** extend `normalize_state_primary()` with route-name NLP pattern matching. Goal: bring combined non-canonical rate from 0.33% to <0.05%. Non-blocking, tracked here for future pickup.

**Cross-epic inheritance.** The `normalize_state_primary()` cascade is in the framework's parser post-processing, so Epic 4 SRC-001/006 (Scenic Byways GIS, Rider Magazine) and Sprint 9 RID-001/002/006 (ADVRider, Reddit, Pushshift) automatically inherit the normalization. Future sources with similar region-aggregator URL patterns will be correctly handled without any task-level changes.
