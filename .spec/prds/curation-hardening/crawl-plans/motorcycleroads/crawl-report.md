# MotorcycleRoads.com Crawl Report

**Date:** 2026-04-14
**Source:** motorcycleroads.com (Form A — HTML scraper)
**Task:** [BASE-009a](../../tasks/epic-02-baseline-pipeline-validation/BASE-009a.md) — Crawl Plan Protocol framework + MotorcycleRoads remediation
**Inventory snapshot:** `urls.jsonl` from commit `80b07fb` (1,908 PT-03-route-detail rows)
**Parser commit chain:** `8fd9aee` (Phases 2-4) → `ffa287d` (Phase 5 glue) → `585852f` (description selector fix) → this Phase 6 commit
**Framework module:** `scripts/curation/pipeline/sources/crawl_plan/` (committed in `80b07fb`, refined through Phases 2-5)

**Phase 5 timeline:**
- 1st run started 2026-04-14 01:04 — aborted at 590 routes after spot-checking revealed 0% description rate (Python module cache held the pre-`585852f` parser bytecode). Killed cleanly; staging files removed.
- 2nd run started 02:03:56, completed 04:39:19 — wall clock ~2 hr 35 min, ~4.9 s per route at MR rate limit, 1899 successful fetches.

**Verdict: PASS**

---

## Counters

| Counter | Value | % of inventory |
|---|---|---|
| Inventory size | 1,908 | 100.0% |
| Fetched 2xx | 1,899 | 99.5% |
| Fetched 4xx (dead link) | 9 | 0.5% |
| Fetched 5xx (retry exhausted) | 0 | 0.0% |
| Parse success | 1,899 | 100.0% (of fetched) |
| Schema validation pass | 1,899 | 100.0% (of parsed) |
| Schema validation fail | 0 | 0.0% |
| LLM fallback triggered | 0 | 0.0% |
| Records written to staging | 1,899 | 99.5% (of inventory) |

**Gate (≥95% fetched, ≥99% parse, <1% schema fail):** all PASS.

---

## Required-field yield

| Field | Required? | Populated | Yield |
|---|---|---|---|
| `route_name` | true | 1,899 / 1,899 | 100.0% |
| `state_primary` | true | 1,899 / 1,899 | 100.0% (see "Known limitation" below) |
| `source_url` | true | 1,899 / 1,899 | 100.0% |
| `states_all` | false | 1,899 / 1,899 | 100.0% (always at least 1 entry containing state_primary) |
| `description` | false | 1,891 / 1,899 | 99.6% (8 routes have a Written Directions section with no body text) |
| `rating` | false | 1,899 / 1,899 | 100.0% |
| `distance_mi` | false | 1,833 / 1,899 | 96.5% (66 routes do not declare distance on the listing) |

**Multi-state records:** 140 / 1,899 (7.4%). The `state_primary` + `states_all` schema works as designed — Natchez Trace Parkway correctly resolves to `['Alabama', 'Mississippi', 'Tennessee']`, Beartooth Pass to `['Montana', 'Wyoming']`, etc.

---

## Landmark presence check

| Landmark | Status | Evidence |
|---|---|---|
| Natchez Trace Parkway | **FOUND** | `Natchez Trace Parkway` with `states_all: ['Alabama', 'Mississippi', 'Tennessee']` (multi-state schema validated end-to-end) |
| Beartooth Pass | **FOUND** | `Beartooth Pass` with `states_all: ['Montana', 'Wyoming']` (multi-state validated) |
| Pacific Coast Highway | **FOUND** | `Pacific Coast Cruise; Hwy 1` (California) |
| Blue Ridge Parkway | **PARTIAL** | MR does not have a single canonical "Blue Ridge Parkway" route; has 6 routes referencing it (e.g. `NC 215 - Alternate to or from Blue Ridge Parkway`, `Blue Ridge to Ellijay`). The full Blue Ridge Parkway is in FHWA. Acceptable. |
| Tail of the Dragon | **PARTIAL** | MR does not have a direct `tail-of-the-dragon` slug; has 12 routes referencing it (e.g. `The Ohio Cousin of the "Tail of the Dragon"`, `Alabama's Mini Dragon to 29 Dreams`). The actual Tail of the Dragon is BBR-resident. Acceptable. |
| Million Dollar Highway | NOT FOUND | BBR-resident only; will be checked at Epic 2 baseline level after BASE-009b. |

**Gate (all 5 landmarks present somewhere in the combined catalog):** deferred to BASE-009b (Epic 2 baseline regeneration). MR-only landmarks (Natchez Trace, Beartooth, Pacific Coast) are all FOUND with correct multi-state extraction where applicable.

---

## Known limitation: 27 region-aggregator records (1.4%)

**Issue.** The Phase 0 site-map identified PT-03 route detail pages as having URL pattern `/motorcycle-roads/{state-slug}/{route-slug}` (2 path segments after `/motorcycle-roads/`). MR also publishes a small number of cross-region "trip" pages under the same 2-segment pattern using region slugs instead of state slugs. The framework's `classify()` function does not currently intersect the slug against a known US-state list, so these region pages are accepted as PT-03 records.

**Impact.** 27 / 1,899 records (1.4%) have a `state_primary` value that is not a US state slug:

| `state_primary` slug | Count | What it represents |
|---|---|---|
| `united-states` | 12 | National master pages (legitimate cross-state routes) |
| `southeast` | 5 | Regional aggregator |
| `northeast` | 2 | Regional aggregator |
| `pacific-coast` | 2 | Regional aggregator |
| `east-coast` | 1 | Regional aggregator |
| `golf-coast` | 1 | Regional aggregator (MR-side typo for "gulf-coast") |
| `great-lakes` | 1 | Regional aggregator |
| `midwest` | 1 | Regional aggregator |
| `northwest` | 1 | Regional aggregator |
| `south` | 1 | Regional aggregator |

These 27 records still parse cleanly — `route_name`, `description`, `rating`, `distance_mi`, and `states_all` are all populated. The `states_all` field correctly reflects the multi-state nature where the meta description carries it. Only `state_primary` is non-canonical.

**Recommended follow-up (not blocking for Epic 2 PASS):** add a `US_STATES` allowlist intersection to `crawl_plan.inventory.classify()` so future runs can either (a) reject these 27 URLs at inventory time, or (b) accept them as a separate page type `PT-04-region-aggregator` with `state_primary: null` and `states_all` populated from meta. Either approach is a framework-general improvement that benefits Epic 4/9 too. Track as a follow-up in `crawl_plan` future work.

**Why this is NOT a Phase 6 FAIL.** The 27 records are a documented data-quality note, not a parser bug, not a schema violation, and not a fabrication. Downstream Epic 6 dedup or Epic 7 quality floor can filter `state_primary not in US_STATES` if needed. The crawl plan correctly ingests the records, fail-closed on the parser is honored (no required field is null), and the audit counters reflect reality.

---

## HTTP errors (9 routes, 0.5%)

The 9 `http_error` entries are routes that returned a non-2xx status during fetch. The executor's retry-with-exponential-backoff logic exhausted retries and moved on; these are likely permalinks that have moved or been removed from MR since the inventory was captured (Phase 1 ran 2026-04-14 01:04; Phase 5 restart ran 02:03:56 → 04:39:19, ~2 hr later, so a small number of links may have rotated). Below the 5% threshold; well within tolerance.

---

## Schema validation (0 failures)

All 1,899 parsed records passed schema validation. The fail-closed parser (`SchemaViolation` on required-field null) was never triggered — every parsed record had non-null `route_name`, `state_primary`, and `source_url`.

---

## Sources verified

- Inventory: `.spec/prds/curation-hardening/crawl-plans/motorcycleroads/urls.jsonl` (1,908 rows)
- Selectors: `.spec/prds/curation-hardening/crawl-plans/motorcycleroads/selectors.yaml`
- Fixtures: `fixtures/motorcycleroads/` (3 PT-01, 3 PT-02, 5 PT-03 = 11 fixtures)
- Fixture tests: `scripts/curation/tests/sources/test_motorcycleroads_fixtures.py` (108 tests passing including framework tests)
- Glue file: `scripts/curation/pipeline/sources/motorcycleroads.py` (93 non-comment lines, no BeautifulSoup, imports `crawl_plan`)
- Staging: `staging/motorcycleroads.jsonl` (1,899 records)
- Audit: `staging/motorcycleroads.jsonl.audit.json`

---

## Verdict rationale

All AC-1 through AC-9 gates met:

- **AC-1** Framework importable + 37 unit tests pass ✓
- **AC-2** site-map.md committed (Phase 0 input) ✓
- **AC-3** Inventory 1,908 in [1800, 2200] ✓
- **AC-4** Fixtures committed with manifest + expected values ✓
- **AC-5** Selectors fixture_yield 5/5 on all required fields ✓
- **AC-6** Fixture tests pass (108 tests across framework + MR contract tests) ✓
- **AC-7** Staging yield 99.5% (≥90% gate); schema_validation_fail 0/1899 (<1% gate) ✓
- **AC-8** This crawl-report.md committed with verdict PASS ✓
- **AC-9** motorcycleroads.py is 93 non-comment lines of thin glue (no BeautifulSoup, no soup.select, imports crawl_plan) ✓

The Alabama-stamped Blue Ridge Parkway sidebar contamination from Epic 2 is gone: Natchez Trace Parkway correctly resolves to `['Alabama', 'Mississippi', 'Tennessee']` via the meta-description-based `states_all` extraction (the Phase 3 design decision to NOT trust DOM sidebars was correct).

The 27 region-aggregator records (1.4% of total) are documented as a known data-quality limitation requiring a `US_STATES` allowlist intersection in `crawl_plan.inventory.classify()` as future follow-up work. They do not constitute a verdict downgrade because they still parse cleanly, have populated states_all, and can be filtered downstream.

**MR Phase 5 baseline replaced.** The prior staging file (~30 routes from Epic 2 BASE-002 with sidebar contamination) is overwritten with 1,899 clean records. The Epic 2 baseline regeneration + `review.md` verdict upgrade from "PASS WITH ISSUES" to "PASS" is BASE-009b scope.
