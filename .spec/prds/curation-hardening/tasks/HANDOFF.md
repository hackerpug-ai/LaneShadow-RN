# Crawl Plan Protocol Execution — Session Handoff

**Handoff written:** 2026-04-13 evening
**Written by:** Claude (session ending; user going to bed)
**Author context:** This handoff was written immediately after committing `a623e3d` and being about to dispatch BASE-009a Phase 1, when the user requested a full handoff doc instead.
**For:** The next Claude session (or you when you wake up) to continue the Curation Hardening initiative's Crawl Plan Protocol execution without losing context.

**IF YOU ARE A FRESH AGENT: read this entire document first, then read the "Key Documents (reading order)" list, then proceed from "Immediate Next Step".**

---

## TL;DR

1. **What we're doing:** Remediating Epic 2's "PASS WITH ISSUES" verdict on the MotorcycleRoads (MR) and BestBikingRoads (BBR) community scrapers by re-crawling both under a newly adopted seven-phase Crawl Plan Protocol. Phase 0 recon is complete for both sites. Specs are written. Commit `a623e3d` is the current HEAD.
2. **Immediate next step:** Dispatch `python-implement` agent to execute BASE-009a Phase 1 (build framework + MR inventory). Scope is tight — STOP after Phase 1 committed, return for human review.
3. **After that:** human checkpoint → dispatch BASE-009a Phase 2-6 → review MR crawl-report.md → dispatch BASE-009b (BBR + baseline regen + review.md verdict upgrade) → verify → unblock Epic 3 (INF-001).
4. **Total remaining wall clock:** ~8-10 hours of agent work (mostly unattended Phase 5 executions) + ~30 min of human review touchpoints.
5. **The one thing you must not do:** soften the Epic 2 `review.md` verdict from PASS WITH ISSUES → PASS without honest evidence. Fabricating the verdict is worse than leaving it.

---

## Current State (as of 2026-04-13 PM / commit a623e3d)

### Git state
- **HEAD:** `a623e3d Adopt Crawl Plan Protocol; insert Epic 2 BASE-009a/b remediation`
- **Parent:** `e7f6368 BASE-009b Phase 0: bestbikingroads.com site-map` (contains both MR and BBR site-maps due to a pre-commit hook auto-staging both files together — intentional, noted in DECISIONS.md)
- **Working tree:** dirty only with this HANDOFF.md (commit it when you finish reading)
- **Branch:** `main` (no feature branch — docs and planning land on main directly per project convention)

### Epic 2 status
- **BASE-000 through BASE-008:** committed, verdict "PASS WITH ISSUES" (see `review.md`)
- **BASE-009a (framework + MR remediation):** task file written, Phase 0 input ready, NOT YET DISPATCHED
- **BASE-009b (BBR + baseline regeneration + verdict upgrade):** task file written, Phase 0 input ready, depends on BASE-009a
- **Dependency chain:** BASE-008 → BASE-009a → BASE-009b → INF-001 (Epic 3 start, still gated)
- **Current `review.md` verdict:** PASS WITH ISSUES (load-bearing junk — every downstream epic diffs against this, so fixing it is Epic 2's blocking remediation)

### Phase 0 recon — COMPLETE (both sites)
Committed in `e7f6368`. Two site-maps produced by parallel `general-purpose` subagents with explicit briefs. Key findings already integrated into BASE-009a/b specs (see DECISIONS.md "Phase 0 recon findings"):

**MotorcycleRoads (7 page types, 3 in-scope):**
- PT-01 US master listing at `/motorcycle-rides-in/united-states` (103 paginated pages × ~20 routes = ~2,044 US routes)
- PT-02 state listing at `/motorcycle-rides-in/{state}` (coverage audit only)
- PT-03 route detail at `/{state-slug}/{route-slug}` (2 path segments, URL-regex classifier)
- **Critical finding:** the prior scraper hit `/motorcycle-roads/{state}` which returns the HOMEPAGE with a 30-route global sidebar rail — this is the exact root cause of Epic 2's 30-route MR yield
- **AC range revised:** from [300, 1000] → [1800, 2200]
- **Phase 5 budget revised:** from ~30 min → ~85 min (rate-limited)

**BestBikingRoads (6 page types, 3 in-scope):**
- PT-01 state listing at `/routes/{state}`
- **PT-02 sub-state cluster index at `/{state}/rides/{cluster}` — LOAD-BEARING DISCOVERY**
- PT-03 route detail at `/{state}/ride/{slug}`
- **Critical finding:** clusters are 83% additive (measured on Tennessee: state=68 rides, cluster lake-obion-weakley=46 rides, 17% overlap). **Skipping clusters reproduces Epic 2's exact ~10% yield failure.**
- **AC range unchanged:** [3,500, 5,500] (already accounted for clusters in original user estimate)
- **Rating field:** is in inline JavaScript (`responseA[i].comments_ave_rating`), NOT DOM — must be declared `required: false` in selectors.yaml
- **Mixed-case slugs** like `Columbia-2` must be preserved in canonicalization (framework-wide rule)

### Framework decisions locked in from recon
1. **Multi-state schema:** records have `state_primary` (URL-derived, always populated) and `states_all` (DOM list, ≥1 entry). Phase 4 fixture tests assert `expected.state in record.states_all`, NOT `==`. Framework-wide rule (Epic 4/9 inherit).
2. **canonicalize() preserves path case:** lowercase scheme + host only. Framework-wide rule.
3. **Framework must be generic:** inventory.py/parser.py/executor.py cannot hardcode MR or BBR specifics. The design review at BASE-009a AC-1 verifies extensibility to Form B (GIS), Form C (RSS), Form D (paginated API) — code-reviewer checks this.

---

## Key Documents (reading order for a fresh agent)

Read these files in order before touching anything:

1. **`.spec/prds/curation-hardening/tasks/CRAWL-PLAN-PROTOCOL.md`** (ALL) — the methodology. Phase 0-6, gate rules, tool recommendations, Forms A/B/C/D/E. The constitutional document. Read the Revision History entry at the bottom for the framework-wide rules.

2. **`.spec/prds/curation-hardening/tasks/epic-02-baseline-pipeline-validation/DECISIONS.md`** — scroll to "Crawl Plan Protocol adoption" and read that entry + "Split sub-decision" + "Phase 0 recon findings" sub-sections. ~400 lines total. This is WHY we're here.

3. **`.spec/prds/curation-hardening/tasks/epic-02-baseline-pipeline-validation/BASE-009a.md`** (ALL) — the task spec for framework + MR remediation. Read the CRITICAL CONSTRAINTS "CROSS-CUTTING RULES" block carefully.

4. **`.spec/prds/curation-hardening/tasks/epic-02-baseline-pipeline-validation/BASE-009b.md`** (ALL) — the task spec for BBR + baseline regeneration + review.md verdict upgrade. Read the "BBR-SPECIFIC RULES" block carefully.

5. **`.spec/prds/curation-hardening/crawl-plans/motorcycleroads/site-map.md`** — Phase 0 deliverable, the authoritative input to BASE-009a. Don't modify.

6. **`.spec/prds/curation-hardening/crawl-plans/bestbikingroads/site-map.md`** — Phase 0 deliverable, the authoritative input to BASE-009b. Don't modify.

7. **`.spec/prds/curation-hardening/tasks/epic-02-baseline-pipeline-validation/review.md`** — the current "PASS WITH ISSUES" verdict. BASE-009b must honestly upgrade this to PASS.

8. **`.spec/prds/curation-hardening/tasks/epic-02-baseline-pipeline-validation/baseline-report.md`** — read lines 133-211 (Community Scrapers section) to see the symptoms BASE-009a/b remediates.

9. **`scripts/curation/pipeline/sources/motorcycleroads.py`** and **`bestbikingroads.py`** — the failed scrapers. DO NOT copy their selectors. DO note their rate limit + robots.txt patterns in `base_scraper.py` which the framework must preserve.

10. **`.spec/prds/curation-hardening/tasks/CURATION-REVIEW-PROTOCOL.md`** — Step 1 upgraded to require passing crawl reports. This is the post-pipeline gate that closes Epic 2 after BASE-009b lands.

11. **`.spec/prds/curation-hardening/00-overview.md`** — pipeline principles section. P6 added. Scan to understand the architectural invariants P0-P6 you must preserve.

12. **`.spec/prds/curation-hardening/tasks/INDEX.md`** — task inventory + dependency graph + Crawl Plan Protocol modality table.

---

## Path Forward — Ordered Steps

### STEP 1 — Dispatch BASE-009a Phase 1 (framework + MR inventory)

**Scope:** STRICT. Build the `crawl_plan/` framework module, write unit tests, run MR inventory against the master index, commit `urls.jsonl` + framework code. STOP there. Do NOT proceed to Phase 2 (fixtures) in this dispatch.

**Why tight scope:** Phase 1 is the highest-risk part of BASE-009a. Framework design bugs discovered here are cheap to fix; the same bugs discovered during Phase 5 execution are expensive. Human checkpoint after Phase 1 catches framework design problems before investing in fixtures and selectors.

**Agent type:** `python-implement` (has Read/Write/Edit/Bash/Glob/Grep/WebSearch + jina__read_url + exa code search — sufficient for framework build + inventory fetch)

**Expected duration:** ~2 hours

**Dispatch prompt (copy verbatim when dispatching):**

```
You are executing PHASE 1 ONLY of BASE-009a (Crawl Plan Protocol framework + MotorcycleRoads remediation). Your scope is tight and must not expand: build the shared `crawl_plan/` framework module, write unit tests, run the MR inventory against the committed site-map, commit the results, and STOP. Do NOT proceed to Phase 2 (fixtures) in this dispatch.

## Read these files first (in this order)

1. `.spec/prds/curation-hardening/tasks/CRAWL-PLAN-PROTOCOL.md` — ALL; focus on "Phase 1 — INVENTORY" and "Cross-cutting framework rules from first Phase 0 recon" in the Revision History
2. `.spec/prds/curation-hardening/tasks/epic-02-baseline-pipeline-validation/BASE-009a.md` — ALL; focus on CRITICAL CONSTRAINTS "CROSS-CUTTING RULES" block, AC-1 (framework importable + unit tests), AC-3 (MR inventory in [1800, 2200])
3. `.spec/prds/curation-hardening/tasks/epic-02-baseline-pipeline-validation/DECISIONS.md` — "Phase 0 recon findings" sub-section
4. `.spec/prds/curation-hardening/crawl-plans/motorcycleroads/site-map.md` — the authoritative Phase 0 input; do not modify
5. `scripts/curation/pipeline/sources/base_scraper.py` — reuse its rate limiting + robots.txt + JSONL writing primitives; do not rewrite them
6. `scripts/curation/pipeline/sources/motorcycleroads.py` — the failed scraper; note its shape, DO NOT copy its selectors or URL patterns

## What to build in this dispatch

### Part A — Framework module (`scripts/curation/pipeline/sources/crawl_plan/`)

Files to create:
- `__init__.py` — public exports (InventoryRow, canonicalize, classify, discover, SelectorMap, load_selectors, parse_with_selectors, SchemaViolation, run_crawl, AuditCounters)
- `inventory.py` — Phase 1 logic: InventoryRow dataclass, canonicalize(), classify(), discover()
- `selectors.py` — Phase 3 helpers: load selectors.yaml, validate against fixtures (stub acceptable for Phase 1; full impl in Phase 3)
- `parser.py` — Phase 3+5 selector-driven parser with SchemaViolation (stub acceptable for Phase 1; full impl in Phase 4)
- `executor.py` — Phase 5 runner with audit counters + resume file support (stub acceptable for Phase 1; full impl in Phase 5)

**Critical framework rules (FROM DECISIONS.md "Phase 0 recon findings" — non-negotiable):**

1. **Preserve path case in canonicalize().** Lowercase scheme + host only. Do NOT call `.lower()` on the whole URL. Mixed-case slugs like `Columbia-2` are distinct routes on BBR and the framework is shared.
2. **Multi-state schema.** Records returned by the parser must support `state_primary` (URL-derived) + `states_all` (list). Even though the Phase 1 work doesn't touch the parser, the parser stub MUST declare these fields so Phase 4 tests can assert list-membership.
3. **Generic framework.** inventory.py / parser.py / executor.py must NOT hardcode MR or BBR URL patterns, selectors, or domain logic. They take patterns and selector maps as parameters. A code-reviewer will specifically check Form B/C/D extensibility at AC-1 review.
4. **No blind selectors anywhere.** The framework enforces fail-closed parsing via SchemaViolation on required-field nulls.

### Part B — Framework unit tests (`scripts/curation/tests/sources/test_crawl_plan_framework.py`)

Tests MUST cover:
- `canonicalize()` — scheme/host lowercased, path case preserved (use `/alabama/Columbia-2` as a test case), trailing slash stripped, query/fragment dropped, idempotent
- `classify()` — matches first pattern, returns None for no-match, handles regex with capture groups
- `InventoryRow` serialization round-trip (dict ↔ dataclass)
- `parse_with_selectors()` stub — returns dict for happy path, raises SchemaViolation for required-field null
- `discover()` — given a fake fetch_fn returning a page with 5 links (3 matching, 2 noise), returns 3 deduplicated InventoryRows

Run: `PYTHONPATH=$(pwd) .venv/bin/python -m pytest scripts/curation/tests/sources/test_crawl_plan_framework.py -v`
Must exit 0.

### Part C — Run MR inventory (Phase 1 execution)

1. Read the committed `.spec/prds/curation-hardening/crawl-plans/motorcycleroads/site-map.md` to extract the page type taxonomy and URL patterns
2. Write a MR-specific discover caller that:
   - Fetches the master index `https://www.motorcycleroads.com/motorcycle-rides-in/united-states` and all 103 pagination pages
   - Extracts route links using the page type patterns from the site-map
   - Canonicalizes + classifies + dedupes via the framework
3. Rate limit: 2-3 seconds between fetches (match `base_scraper.py` discipline). Read robots.txt first.
4. Write the output to `.spec/prds/curation-hardening/crawl-plans/motorcycleroads/urls.jsonl`
5. Verify the file has route-detail count in [1800, 2200] per AC-3

Do NOT write the MR scraper glue file (`scripts/curation/pipeline/sources/motorcycleroads.py`) yet — that's Phase 5. Use a small inventory-runner script or inline Python for this dispatch. Commit the inventory-runner if you write one; it will be replaced by the proper glue file in Phase 5.

### Part D — Commit

Single commit containing:
- `scripts/curation/pipeline/sources/crawl_plan/` (5 files)
- `scripts/curation/tests/sources/test_crawl_plan_framework.py` (1 file)
- `scripts/curation/tests/sources/conftest.py` (1 file if needed)
- `.spec/prds/curation-hardening/crawl-plans/motorcycleroads/urls.jsonl` (1 file)

Commit message: `BASE-009a Phase 1: crawl_plan framework + MR inventory (N route details)`

Respect commit discipline from CLAUDE.md:
- No `--no-verify` or `--no-gpg-sign`
- If pre-commit hooks fail, FIX the cause and create a new commit (do not amend, do not bypass)
- Use HEREDOC for the commit message

## Gates (verify BEFORE reporting done)

Run each verify command from BASE-009a.md and confirm output:
- AC-1: `PYTHONPATH=$(pwd) .venv/bin/python -c "from scripts.curation.pipeline.sources.crawl_plan import inventory, selectors, parser, executor; print('ok')"` → "ok"
- AC-1 tests: `PYTHONPATH=$(pwd) .venv/bin/python -m pytest scripts/curation/tests/sources/test_crawl_plan_framework.py -v` → exit 0
- AC-3 MR: `PYTHONPATH=$(pwd) .venv/bin/python -c "import json; rows=[json.loads(l) for l in open('.spec/prds/curation-hardening/crawl-plans/motorcycleroads/urls.jsonl')]; details=[r for r in rows if 'route-detail' in r['page_type']]; assert 1800 <= len(details) <= 2200, len(details); print(f'MR inventory PASS: {len(details)} route details')"` → "MR inventory PASS: N route details"

## STOP conditions (escalate to user; do not continue)

- AC-3 inventory count < 1800 or > 2200 — Phase 0 site-map may be wrong, or the master index pagination is different than documented. STOP and report findings.
- AC-1 unit tests fail — framework has bugs. Fix them and re-run. If you can't fix, STOP and report.
- `canonicalize()` is collapsing distinct URLs (test with `/alabama/Columbia-2` vs `/alabama/columbia-2`) — your canonicalize() is wrong. Fix it before committing.
- `discover()` reject rate > 10% on MR — the site-map's URL patterns don't match reality. STOP.
- Framework has MR-specific code (hardcoded URLs, hardcoded selectors, hardcoded schema) — refactor before committing.

## Out of scope for THIS dispatch (do NOT touch)

- Phase 2 fixtures — next dispatch
- Phase 3 selectors.yaml — next dispatch
- Phase 4 MR fixture tests — next dispatch
- Phase 5 execution — next dispatch
- Phase 6 crawl-report.md — next dispatch
- ANY BBR work — BASE-009b scope
- `scripts/curation/pipeline/sources/motorcycleroads.py` rewrite — Phase 5
- `baseline/*.json` or `review.md` — BASE-009b scope

## Reporting

When done, return a brief report (under 300 words) with:
- Framework files created (list with LOC counts)
- Unit test results (N tests, all passed/any failed)
- MR inventory row count (total + route-detail subset)
- Commit SHA
- Any deviations from the spec and why
- Any framework design decisions you want the user to confirm
- Wall-clock time spent

If you hit a STOP condition, STOP and return a short escalation report instead.
```

---

### STEP 2 — Human review after BASE-009a Phase 1 (~15 min)

Before dispatching Phase 2-6, the user (or you as reviewer) must verify:

1. **Framework is importable:** `PYTHONPATH=$(pwd) .venv/bin/python -c "from scripts.curation.pipeline.sources.crawl_plan import inventory, selectors, parser, executor"`
2. **Unit tests pass:** `pytest scripts/curation/tests/sources/test_crawl_plan_framework.py -v`
3. **canonicalize() preserves path case** — spot-check by running `python -c "from scripts.curation.pipeline.sources.crawl_plan.inventory import canonicalize; print(canonicalize('https://www.example.com/Alabama/Columbia-2/'))"` — the output must NOT be all lowercase
4. **Multi-state schema is in the parser stub** — grep for `state_primary` and `states_all` in `crawl_plan/parser.py`
5. **MR inventory count in [1800, 2200]** — `wc -l .spec/prds/curation-hardening/crawl-plans/motorcycleroads/urls.jsonl`
6. **Sample 20 random URLs** from the inventory — do they look like real MR route detail URLs? Any that look like sidebar/nav/trap links?
7. **Framework is generic** — skim the `crawl_plan/` files for any `motorcycleroads` or MR-specific string literals. Should be none.
8. **No hardcoded domain logic** — the framework should take patterns/selectors as parameters

**If any of the above fails:** escalate to user, or fix the framework in a follow-up agent dispatch before proceeding.

**If all pass:** proceed to STEP 3.

---

### STEP 3 — Dispatch BASE-009a Phase 2-6 (fixtures, selectors, tests, execution, accounting)

**Scope:** Complete BASE-009a. Phase 2 fixtures → Phase 3 selectors → Phase 4 MR fixture tests → Phase 5 MR execution → Phase 6 MR crawl-report.md PASS.

**Agent type:** `python-implement`

**Expected duration:** ~3-4 hours (most of it Phase 5 MR execution at ~85 min rate-limited + iteration time)

**Dispatch prompt (copy verbatim):**

```
You are executing PHASES 2-6 of BASE-009a (Crawl Plan Protocol framework + MotorcycleRoads remediation). Phase 1 (framework + MR inventory) has been committed and reviewed. Your scope is to complete the remaining phases for MR only. Do NOT touch BBR. Do NOT regenerate the Epic 2 baseline or review.md — those are BASE-009b scope.

## Preflight

Verify these before starting:
- `from scripts.curation.pipeline.sources.crawl_plan import inventory, selectors, parser, executor` — works
- `.spec/prds/curation-hardening/crawl-plans/motorcycleroads/urls.jsonl` — committed, row count in [1800, 2200]
- `pytest scripts/curation/tests/sources/test_crawl_plan_framework.py` — passes

If any preflight fails, STOP and escalate.

## Read these files (in this order)

1. `.spec/prds/curation-hardening/tasks/CRAWL-PLAN-PROTOCOL.md` — Phases 2-6, Form A section
2. `.spec/prds/curation-hardening/tasks/epic-02-baseline-pipeline-validation/BASE-009a.md` — ALL AC criteria, especially AC-4 through AC-9; NOTES section for Phase 0 findings recap
3. `.spec/prds/curation-hardening/crawl-plans/motorcycleroads/site-map.md` — Phase 0 input, authoritative
4. `.spec/prds/curation-hardening/tasks/epic-02-baseline-pipeline-validation/DECISIONS.md` — "Phase 0 recon findings"

## Execution

### Phase 2 — Fixtures (~30 min)

- Download 3-5 MR fixtures per in-scope page type (see site-map.md for the page type taxonomy — PT-01 US master listing, PT-02 state listing, PT-03 route detail)
- Use real landmark routes where possible: Natchez Trace Parkway (for multi-state schema test), Tail of the Dragon or similar if available, Blue Ridge Parkway
- Write `fixtures/motorcycleroads/{PT-NN}/*.html` + `fixtures/motorcycleroads/fixtures.manifest.yaml` with source URL, fetched_at, sha256, and `expected:` values for required fields (at minimum route_name and states_all list for multi-state fixtures)
- Commit the fixtures

### Phase 3 — Selector spec (~45 min, LLM-assisted)

- For each page type, pass one fixture to an LLM (Firecrawl /extract or GLM-4.7-flash via z.ai or Claude) with a structured-output prompt asking for CSS selectors for: route_name, description, rating, distance_mi (if present), difficulty (if present), states_all (parse state list from DOM)
- Validate each proposed selector across ALL fixtures for that page type; record `fixture_yield: N/M` per field
- Refine required fields until fixture_yield is N/N (e.g., 5/5)
- Write `.spec/prds/curation-hardening/crawl-plans/motorcycleroads/selectors.yaml`
- Declare `state_primary` as `derived: url_regex` with the MR URL pattern; `states_all` as a DOM selector (may be nullable if fixture_yield is less than full)
- Commit selectors.yaml

### Phase 4 — MR fixture tests (~45 min iteration)

- Write `scripts/curation/tests/sources/test_motorcycleroads_fixtures.py` following the protocol pattern
- CRITICAL: assertions MUST use `expected.state in record.states_all` (list membership), NOT `record.state == expected.state` (string equality)
- Iterate parser.py (in the framework) + selectors.yaml until all tests pass
- If parser needs framework changes, land them as a separate commit scoped to the framework — DO NOT bundle framework fixes into a fixture-test commit
- Commit the fixture tests
- Run: `pytest scripts/curation/tests/sources/test_motorcycleroads_fixtures.py -v` — must exit 0

### Phase 5 — Execution (~85 min rate-limited)

- Rewrite `scripts/curation/pipeline/sources/motorcycleroads.py` as a ≤100-line glue file that:
  - Loads `urls.jsonl` from the committed inventory
  - Calls the framework executor with the committed selectors
  - Writes to `staging/motorcycleroads.jsonl` with `.progress` and `.audit.json` siblings
  - Reuses the existing `base_scraper.py` rate limiting + robots.txt discipline
- Run: `python -m scripts.curation.pipeline.sources.motorcycleroads`
- Watch `.audit.json` updates every 100 routes
- If `schema_validation_fail` rate > 5%, STOP and escalate — the protocol assumption is wrong
- Wall clock: ~85 min at 2-3s rate limit

### Phase 6 — Accounting (~15 min)

- Write `.spec/prds/curation-hardening/crawl-plans/motorcycleroads/crawl-report.md` using the protocol template
- Required sections: counters table, required-field yield table, landmark presence check, verdict PASS
- Do NOT regenerate `baseline/catalog.jsonl`, `baseline/*.json`, `review.md`, or `baseline-report.md` — those are BASE-009b scope
- Single atomic commit containing: crawl-report.md + motorcycleroads.py rewrite + any final framework tweaks

## Gates (all must pass before reporting done)

- AC-4: `fixtures/motorcycleroads/` has ≥3 fixtures per page type + manifest
- AC-5: `selectors.yaml` has fixture_yield N/N for all `required: true` fields
- AC-6: `pytest test_motorcycleroads_fixtures.py` exit 0
- AC-7: `staging/motorcycleroads.jsonl` yield ≥90% of inventory; `schema_validation_fail` < 1% of parse attempts
- AC-8: `crawl-report.md` verdict PASS
- AC-9: `motorcycleroads.py` ≤100 non-comment lines, no BeautifulSoup, imports crawl_plan framework

## STOP conditions

- Any required field cannot hit fixture_yield N/N — the selector is wrong OR the field is genuinely optional; mark `required: false` and document why
- Schema validation failure rate > 5% during Phase 5 — escalate
- crawl-report.md honest verdict would be PASS WITH ISSUES or FAIL — escalate, DO NOT soften
- Alabama-stamped Blue Ridge Parkway or similar sidebar-contamination reappears — the cross-state schema rule was violated

## Out of scope

- Any BBR work — BASE-009b
- `baseline/*.json`, `baseline/catalog.jsonl`, `review.md`, `baseline-report.md` — BASE-009b
- Convex push — not until after BASE-009b

## Reporting

Report (under 400 words):
- Fixture count per page type
- Selector fixture_yield table
- Phase 5 audit counters (fetched, parsed, schema_validation_fail, llm_fallback_queued)
- Staging row count vs inventory
- Landmark presence check results
- crawl-report.md verdict + rationale
- Commit SHAs
- Any framework fixes landed separately
- Wall-clock time

If any STOP condition hit: short escalation report, do not proceed.
```

---

### STEP 4 — Human review after BASE-009a Phase 2-6 (~15 min)

Verify:

1. **crawl-report.md verdict:** grep for `Verdict: PASS` at the top of `.spec/prds/curation-hardening/crawl-plans/motorcycleroads/crawl-report.md`. Should be exactly "PASS", not "PASS WITH ISSUES".
2. **Staging row count:** `wc -l staging/motorcycleroads.jsonl` — should be within ±10% of inventory (AC-7)
3. **Random sample 5 routes:** `shuf -n 5 staging/motorcycleroads.jsonl | jq` — check each for:
   - `route_name` non-empty
   - `state_primary` matches the URL
   - `states_all` is a list with ≥1 entry matching `state_primary`
   - No Alabama-stamped out-of-state routes
4. **Landmark presence:** `grep -i "natchez trace" staging/motorcycleroads.jsonl` should return at least 1 match
5. **Glue file ≤100 lines:** `wc -l scripts/curation/pipeline/sources/motorcycleroads.py` + visual check for no BeautifulSoup

**If any fail:** fix the framework or re-run Phase 5 (cost: ~85 min).

**If all pass:** proceed to STEP 5.

---

### STEP 5 — Dispatch BASE-009b (BBR + baseline regeneration + verdict upgrade)

**Scope:** All 7 phases for BBR + regenerate Epic 2 baseline artifacts from clean combined staging + upgrade `review.md` verdict from "PASS WITH ISSUES" to "PASS" + atomic commit.

**Agent type:** `python-implement`

**Expected duration:** ~5 hours (Phase 5 BBR is ~3.75-4.5 hr rate-limited; mostly unattended)

**Dispatch prompt (copy verbatim):**

```
You are executing BASE-009b (Apply Crawl Plan Protocol to BestBikingRoads + regenerate Epic 2 baseline). BASE-009a is complete: the `crawl_plan/` framework is committed, unit-tested, and proven on MotorcycleRoads. Your scope is BBR + Epic 2 baseline regeneration + review.md verdict upgrade. Do NOT modify the framework module except as separate commits for framework bugs (see CRITICAL CONSTRAINTS). Do NOT touch MR artifacts — they're done.

## Preflight

Verify these before starting:
- `from scripts.curation.pipeline.sources.crawl_plan import inventory, selectors, parser, executor` — works
- `.spec/prds/curation-hardening/crawl-plans/motorcycleroads/crawl-report.md` exists with verdict PASS
- `staging/motorcycleroads.jsonl` exists and is the BASE-009a output (not the junk 30-route version)
- `scripts/curation/pipeline/sources/motorcycleroads.py` is ≤100 lines of glue
- `.spec/prds/curation-hardening/crawl-plans/bestbikingroads/site-map.md` exists (user-committed Phase 0)

If any preflight fails, STOP.

## Read these files (in this order)

1. `.spec/prds/curation-hardening/tasks/CRAWL-PLAN-PROTOCOL.md` — ALL
2. `.spec/prds/curation-hardening/tasks/epic-02-baseline-pipeline-validation/BASE-009b.md` — ALL; focus on BBR-SPECIFIC RULES block and AC-1 through AC-10
3. `.spec/prds/curation-hardening/tasks/epic-02-baseline-pipeline-validation/DECISIONS.md` — "Phase 0 recon findings", especially Findings 4 and 5 (BBR-specific)
4. `.spec/prds/curation-hardening/crawl-plans/bestbikingroads/site-map.md` — authoritative Phase 0 input
5. `.spec/prds/curation-hardening/tasks/epic-02-baseline-pipeline-validation/review.md` — the "PASS WITH ISSUES" verdict you're upgrading
6. `scripts/curation/pipeline/sources/motorcycleroads.py` (post-BASE-009a) — reference implementation for the BBR glue file shape

## Critical BBR-specific rules (FROM DECISIONS.md "Phase 0 recon findings")

1. `/rides/{cluster}` pages are IN-SCOPE and ADDITIVE. Phase 1 inventory must include them. If row count < 3,500, you skipped clusters — return to Phase 1.
2. `rating` field is in inline JS (`responseA[i].comments_ave_rating`), NOT DOM. Declare `required: false` in selectors.yaml.
3. Mixed-case slugs like `Columbia-2` must be preserved. The framework's canonicalize() already does this — DO NOT override it.
4. Multi-state schema: same rule as MR. `state_primary` + `states_all`, list membership assertions.

## Execution (all seven phases)

Phase 1 — BBR inventory (~30 min): run framework `discover()` against BBR state listings + cluster index pages. Verify count in [3,500, 5,500].

Phase 2 — BBR fixtures (~30 min): 3-5 per page type. MUST include fixtures for Tail of the Dragon and Million Dollar Highway (needed for AC-8 landmark gate).

Phase 3 — BBR selectors (~30 min): LLM-assisted. Rating `required: false`. Validate fixture_yield N/N on required fields.

Phase 4 — BBR fixture tests (~30 min): `scripts/curation/tests/sources/test_bestbikingroads_fixtures.py` passing.

Phase 5 — BBR execution (~225 min rate-limited): rewrite `bestbikingroads.py` as ≤100-line glue. Run it. Mostly unattended. Watch `.audit.json`. If `schema_validation_fail` > 5%, STOP.

Phase 6 — BBR crawl-report.md + baseline regeneration (~60 min):
- Write `.spec/prds/curation-hardening/crawl-plans/bestbikingroads/crawl-report.md` with verdict PASS
- Re-run the Epic 2 downstream pipeline against clean combined staging:
  - `python -m scripts.curation.pipeline.extraction.client --sample 20 --count 20 --out <baseline>/catalog.jsonl`
  - `python -m scripts.curation.pipeline.scoring.composite --input <baseline>/catalog.jsonl --out <baseline>/scores.json --count 20`
  - `python -m scripts.curation.pipeline.classification.archetype --routes <baseline>/catalog.jsonl --scores <baseline>/scores.json --out <baseline>/archetype_counts.json --count 20`
- Regenerate `baseline/source_counts.json` from wc-l of the three staging files (fhwa/motorcycleroads/bestbikingroads)
- Update `baseline-report.md` Community Scrapers section (lines 133-211) to reflect new counts + PASS verdicts
- Rewrite `review.md` with verdict PASS. Remove the PASS WITH ISSUES rationale. Add a line crediting BASE-009a/b for the remediation.

## Atomic final commit

ONE commit containing:
- `crawl-plans/bestbikingroads/*.md` (site-map was already committed; add urls.jsonl, selectors.yaml, crawl-report.md)
- `fixtures/bestbikingroads/` (HTML + manifest)
- `scripts/curation/tests/sources/test_bestbikingroads_fixtures.py`
- `scripts/curation/pipeline/sources/bestbikingroads.py` (glue rewrite)
- `baseline/catalog.jsonl`, `baseline/scores.json`, `baseline/archetype_counts.json`, `baseline/source_counts.json`
- `baseline-report.md` (updated Community Scrapers section)
- `review.md` (verdict upgrade)

Commit message: `BASE-009b: BBR Crawl Plan Protocol remediation + Epic 2 baseline regenerated; review.md verdict PASS`

## Gates (verify BEFORE reporting done)

Run all 10 AC VERIFY commands from BASE-009b.md. Every one must pass.

## STOP conditions

- If the honest `review.md` verdict is PASS WITH ISSUES or FAIL, STOP and escalate. DO NOT soften the verdict — the original PASS WITH ISSUES is more honest than a fabricated PASS.
- Inventory count below 3,500 → clusters were skipped; STOP
- Any of the 5 landmarks missing from combined staging → escalate
- Framework bug discovered → fix in a separate commit scoped to `crawl_plan/`, then continue BBR work

## Reporting

Report (under 500 words):
- BBR inventory count (total + route-detail + cluster subtype)
- BBR fixture count per page type
- BBR selector fixture_yield table
- Phase 5 audit counters
- BBR staging row count vs inventory
- Regenerated baseline source_counts
- Landmark presence check — all 5
- review.md verdict + rationale
- Final commit SHA
- Framework fixes landed separately (if any)
- Wall-clock time (total + Phase 5 only)
```

---

### STEP 6 — Final verification and Epic 3 unblock (~15 min)

After BASE-009b lands:

1. **review.md verdict is honest PASS:** read the rationale, confirm no weasel words like "PASS WITH MINOR ISSUES" or "PASS (with exceptions)"
2. **baseline/source_counts.json:** `jq . baseline/source_counts.json` — should show {fhwa: ~645, motorcycleroads: ~2044, bestbikingroads: ~4100}
3. **All 5 landmarks present:** grep each of Tail of the Dragon, Million Dollar Highway, Blue Ridge Parkway, Beartooth Highway, Pacific Coast Highway in combined staging files
4. **baseline-report.md Community Scrapers section:** no longer says "PASS WITH ISSUES"; cites the new crawl-reports
5. **Mobile app smoke test (optional):** if Convex dev deployment is running, optionally run the Epic 2 Curation Review Protocol Step 12 dry-run push

**If all pass:** mark Epic 2 DONE, unblock INF-001 (Epic 3 start). The Curation Hardening initiative resumes normal epic sequencing from here.

**If anything fails:** fix or escalate. DO NOT proceed to Epic 3 on a dirty baseline.

---

## Pre-dispatch Checklist (before STEP 1)

Before dispatching BASE-009a Phase 1, verify:

- [ ] `git log --oneline -3` shows `a623e3d Adopt Crawl Plan Protocol; insert Epic 2 BASE-009a/b remediation` as HEAD (or a later commit if work has progressed)
- [ ] `.spec/prds/curation-hardening/tasks/CRAWL-PLAN-PROTOCOL.md` exists
- [ ] `.spec/prds/curation-hardening/tasks/epic-02-baseline-pipeline-validation/BASE-009a.md` exists
- [ ] `.spec/prds/curation-hardening/tasks/epic-02-baseline-pipeline-validation/BASE-009b.md` exists
- [ ] `.spec/prds/curation-hardening/crawl-plans/motorcycleroads/site-map.md` exists (committed in e7f6368)
- [ ] `.spec/prds/curation-hardening/crawl-plans/bestbikingroads/site-map.md` exists (committed in e7f6368)
- [ ] `.spec/prds/curation-hardening/tasks/epic-02-baseline-pipeline-validation/DECISIONS.md` has "Crawl Plan Protocol adoption" entry with "Phase 0 recon findings" sub-section
- [ ] Working tree is clean (`git status` empty) — any work-in-progress is committed before dispatching agents

---

## Risks and Gotchas (things that will bite you)

1. **BBR rate limit is the real wall clock:** ~3.75-4.5 hours for Phase 5. Don't try to parallelize it; BBR will ban you. The agent must be unattended during this phase.

2. **Pre-commit hooks run type-check + ESLint on every commit.** They take ~30 seconds each and pass (with pre-existing warnings we don't fix). The TS type-check and ESLint are project-wide, not scoped to the changed files — if some unrelated file breaks TS in the future, this could block commits. Expected behavior as of 2026-04-13.

3. **`--no-verify` is blocked globally.** Don't try to bypass hooks; fix the underlying cause.

4. **Deleted file staging:** when BASE-009a was renamed → BASE-009a.md, the old BASE-009.md was deleted. `git add` on the deleted path stages the deletion correctly. This is already done in `a623e3d`.

5. **`e7f6368` contains both site-maps due to a pre-commit hook** — noted in DECISIONS.md. Not a bug; just weird commit attribution.

6. **Multi-state record schema is NEW.** Every existing Route model in the codebase uses a single `state` string field. The framework's parser produces `state_primary` + `states_all`, which means either (a) the parser's output dict has both fields and downstream consumers handle both, or (b) the parser's output maps to the existing Route model using `state_primary` for backward compatibility. Decide which in Phase 1 framework design. Epic 3 INF-002 Route model extension will handle the full schema change later.

7. **Framework-general rules vs task-specific rules:** the two CROSS-CUTTING RULES (path case preservation, multi-state schema) apply to ALL source tasks forever. The BBR-SPECIFIC RULES (rating required:false, clusters in-scope) apply only to BBR. Don't conflate them.

8. **Agent context window budget:** a full BASE-009a Phase 1 run probably fits in one agent session (~2 hours). BASE-009a Phase 2-6 is closer to the edge (~3-4 hours). BASE-009b is ~5 hours and will strain context. If an agent session exhausts its context, it should commit what it has and report — the next session can pick up from the committed state.

9. **Review.md verdict fabrication is the biggest risk.** The whole point of the protocol is to make "PASS WITH ISSUES" impossible as a lazy verdict. If BASE-009b finishes and the verdict shows "PASS" but the review is clearly half-done (e.g., "landmarks: 4/5 found, one missing but we'll fix later"), reject the commit and re-run. The code-reviewer at BASE-009b final review specifically checks this.

10. **Firecrawl API budget:** if used for Phase 3 selector spec, budget is ~$0.30 per source (MR + BBR = ~$0.60 total). Not a blocker, but should be logged if used.

---

## User Preferences Observed This Session

1. **Atomic commits.** User wants one commit per task, not incremental WIP commits. Commit discipline per CLAUDE.md is strict.
2. **Honest verdicts.** User explicitly flagged fabricated PASS verdicts as worse than honest PASS WITH ISSUES. Don't soften.
3. **Human checkpoints between risky phases.** The BASE-009a Phase 1 → Phase 2+ split is for the user's review eyes, not just the agent's benefit.
4. **Subagents for recon with explicit briefs.** The original protocol said "do not automate recon"; the user overrode that (correctly — the recon agents caught the MR root cause in 30 min). Future Phase 0 recons should be allowed to use agents IF the user provides explicit briefs and reviews the output.
5. **Spec corrections before dispatch.** When the recon findings surfaced spec-level bugs (MR range wrong, multi-state schema missing, canonicalize path-case bug), the user chose to fix the specs before dispatching rather than let the agent discover them. This pattern should continue.
6. **Parallel agent dispatch is fine.** The Phase 0 recon was two parallel general-purpose agents; both returned successfully. Use parallel dispatch where tasks are independent.
7. **Cross-referencing matters.** Every decision should have a DECISIONS.md entry; every spec change should cite the decision. The user values audit trails.

---

## If you (future Claude) get stuck

1. **First:** re-read this HANDOFF.md and the key documents list in order. Almost everything is in there.
2. **If you need to understand WHY something was decided:** search DECISIONS.md for keywords. Every non-obvious decision has an entry.
3. **If the spec and reality diverge:** trust the spec. Escalate to user before changing the spec. The Phase 0 findings pattern is: agent discovers, user approves spec change, agent executes.
4. **If a dispatch gate fails:** STOP, do not fabricate, escalate. The protocol is designed to catch failures at gates, not after the fact.
5. **If you're not sure what "next" means:** STEP 1 is always the safest place to resume. Everything after STEP 1 depends on prior verification.
6. **If the user is asleep:** do as much autonomous work as you can (dispatch agents, wait for results, verify gates), but DO NOT commit anything with a fabricated verdict or skip a gate. If you hit a gate failure, stop and write a new HANDOFF-UPDATE.md at the same location with your findings. Don't proceed to the next step without human approval.

---

## Appendix: Files Touched This Session (for git archaeology)

**New files (committed in `a623e3d`):**
- `.spec/prds/curation-hardening/tasks/CRAWL-PLAN-PROTOCOL.md`
- `.spec/prds/curation-hardening/tasks/epic-02-baseline-pipeline-validation/BASE-009a.md`
- `.spec/prds/curation-hardening/tasks/epic-02-baseline-pipeline-validation/BASE-009b.md`

**Deleted files (committed in `a623e3d`):**
- `.spec/prds/curation-hardening/tasks/epic-02-baseline-pipeline-validation/BASE-009.md` (split into 009a + 009b)

**Modified files (committed in `a623e3d`):**
- `.spec/prds/curation-hardening/00-overview.md` (added P6)
- `.spec/prds/curation-hardening/tasks/CURATION-REVIEW-PROTOCOL.md` (Step 1 upgrade)
- `.spec/prds/curation-hardening/tasks/INDEX.md` (task counts + effort + Crawl Plan Protocol section)
- `.spec/prds/curation-hardening/tasks/epic-02-baseline-pipeline-validation/EPIC.md` (effort + ACs + task table + wave plan + DoD)
- `.spec/prds/curation-hardening/tasks/epic-02-baseline-pipeline-validation/DECISIONS.md` (adoption + split + Phase 0 findings entries)
- `.spec/prds/curation-hardening/tasks/epic-04-sources-government-editorial/EPIC.md` (Crawl Plan Protocol compliance section)
- `.spec/prds/curation-hardening/tasks/epic-09-community-ingestion/EPIC.md` (Crawl Plan Protocol compliance section)

**Committed earlier in `e7f6368` (Phase 0 recon output):**
- `.spec/prds/curation-hardening/crawl-plans/motorcycleroads/site-map.md`
- `.spec/prds/curation-hardening/crawl-plans/bestbikingroads/site-map.md`

**Files that still don't exist (will be created by BASE-009a/b dispatches):**
- `scripts/curation/pipeline/sources/crawl_plan/__init__.py`
- `scripts/curation/pipeline/sources/crawl_plan/inventory.py`
- `scripts/curation/pipeline/sources/crawl_plan/selectors.py`
- `scripts/curation/pipeline/sources/crawl_plan/parser.py`
- `scripts/curation/pipeline/sources/crawl_plan/executor.py`
- `scripts/curation/tests/sources/test_crawl_plan_framework.py`
- `scripts/curation/tests/sources/test_motorcycleroads_fixtures.py`
- `scripts/curation/tests/sources/test_bestbikingroads_fixtures.py`
- `scripts/curation/tests/sources/conftest.py` (may need update)
- `.spec/prds/curation-hardening/crawl-plans/motorcycleroads/urls.jsonl`
- `.spec/prds/curation-hardening/crawl-plans/motorcycleroads/selectors.yaml`
- `.spec/prds/curation-hardening/crawl-plans/motorcycleroads/crawl-report.md`
- `.spec/prds/curation-hardening/crawl-plans/bestbikingroads/urls.jsonl`
- `.spec/prds/curation-hardening/crawl-plans/bestbikingroads/selectors.yaml`
- `.spec/prds/curation-hardening/crawl-plans/bestbikingroads/crawl-report.md`
- `fixtures/motorcycleroads/` (directory + HTML + manifest)
- `fixtures/bestbikingroads/` (directory + HTML + manifest)

**Files that will be regenerated (by BASE-009b, not BASE-009a):**
- `.spec/prds/curation-hardening/tasks/epic-02-baseline-pipeline-validation/baseline/catalog.jsonl`
- `.spec/prds/curation-hardening/tasks/epic-02-baseline-pipeline-validation/baseline/scores.json`
- `.spec/prds/curation-hardening/tasks/epic-02-baseline-pipeline-validation/baseline/archetype_counts.json`
- `.spec/prds/curation-hardening/tasks/epic-02-baseline-pipeline-validation/baseline/source_counts.json`
- `.spec/prds/curation-hardening/tasks/epic-02-baseline-pipeline-validation/review.md` (verdict upgrade)
- `.spec/prds/curation-hardening/tasks/epic-02-baseline-pipeline-validation/baseline-report.md` (Community Scrapers section update)
- `staging/motorcycleroads.jsonl` (by BASE-009a)
- `staging/bestbikingroads.jsonl` (by BASE-009b)

---

## Appendix: Quick-Reference Commands

```bash
# Verify current state
git log --oneline -5
git status

# Verify framework is importable (after Phase 1 lands)
PYTHONPATH=$(pwd) .venv/bin/python -c "from scripts.curation.pipeline.sources.crawl_plan import inventory, selectors, parser, executor; print('ok')"

# Run framework unit tests
PYTHONPATH=$(pwd) .venv/bin/python -m pytest scripts/curation/tests/sources/test_crawl_plan_framework.py -v

# Check MR inventory count (after Phase 1 lands)
PYTHONPATH=$(pwd) .venv/bin/python -c "
import json
rows = [json.loads(l) for l in open('.spec/prds/curation-hardening/crawl-plans/motorcycleroads/urls.jsonl')]
details = [r for r in rows if 'route-detail' in r['page_type']]
print(f'MR: {len(rows)} total, {len(details)} route details')
assert 1800 <= len(details) <= 2200
"

# Check BBR inventory count (after BASE-009b Phase 1 lands)
PYTHONPATH=$(pwd) .venv/bin/python -c "
import json
rows = [json.loads(l) for l in open('.spec/prds/curation-hardening/crawl-plans/bestbikingroads/urls.jsonl')]
details = [r for r in rows if 'route-detail' in r['page_type']]
print(f'BBR: {len(rows)} total, {len(details)} route details')
assert 3500 <= len(details) <= 5500
"

# Run MR fixture tests (after Phase 4 lands)
PYTHONPATH=$(pwd) .venv/bin/python -m pytest scripts/curation/tests/sources/test_motorcycleroads_fixtures.py -v

# Run BBR fixture tests (after BASE-009b Phase 4 lands)
PYTHONPATH=$(pwd) .venv/bin/python -m pytest scripts/curation/tests/sources/test_bestbikingroads_fixtures.py -v

# Check review.md verdict (after BASE-009b lands)
grep -E "^(\*\*)?Verdict:" .spec/prds/curation-hardening/tasks/epic-02-baseline-pipeline-validation/review.md

# Check all 5 landmarks present (after BASE-009b lands)
for landmark in "Tail of the Dragon" "Million Dollar" "Blue Ridge Parkway" "Beartooth" "Pacific Coast"; do
  count=$(grep -ic "$landmark" staging/fhwa.jsonl staging/motorcycleroads.jsonl staging/bestbikingroads.jsonl 2>/dev/null | awk -F: '{s+=$2} END {print s}')
  echo "$landmark: $count matches"
done
```

---

*End of handoff. Commit this file before signing off, along with any other in-flight work.*
