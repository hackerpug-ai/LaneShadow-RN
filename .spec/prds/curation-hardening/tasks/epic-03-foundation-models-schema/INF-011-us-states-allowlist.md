# INF-011 — US_STATES allowlist in crawl_plan inventory classifier

**Epic:** epic-03-foundation-models-schema
**Status:** Backlog (stub)
**Priority:** P2 (non-blocking follow-up)
**Agent:** python-implement
**Estimated effort:** S (~60 min)
**Created:** 2026-04-14 (morning, from BASE-009a MR remediation follow-up)

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
- [ ] Epic 4 SRC-001/006 and Epic 9 RID-001/002/006 inherit the change (framework-general)
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
3. The INF-011 change is a framework improvement that benefits all future source tasks (Epic 4 SRC-001/006, Epic 9 RID-001/002/006) which is the same cross-epic scope as the existing INF-001..007

Alternative placements considered and rejected:
- **Epic 6 (Quality — Dedup & Floor):** the 27 records are not a dedup or quality-floor issue; they parse cleanly and have honest data
- **BASE-009c (new Epic 2 task):** would inflate BASE-009 scope; the point of closing BASE-009a/b cleanly is to unblock Epic 3, not to spawn follow-up work in the same epic

## Notes

- This stub is intentionally brief. When the implementer picks it up, generate a full TASK-TEMPLATE v4.0 file matching Epic 2 BASE-00x quality level (currently Epic 3 INF tasks are stubs per INDEX.md "Stub Tasks" note — only Epic 1 and Epic 2 have full-detail task files).
- Cross-reference in INDEX.md: add row for INF-011 under "Epic 3: Foundation (STUBS)" when this stub is committed.
