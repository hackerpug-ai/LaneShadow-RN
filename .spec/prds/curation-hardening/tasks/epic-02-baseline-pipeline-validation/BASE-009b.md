================================================================================
TASK: BASE-009b - Apply Crawl Plan Protocol to BestBikingRoads + regenerate Epic 2 baseline
================================================================================

TASK_TYPE: INFRA / REMEDIATION
STATUS: Done
TDD_PHASE: GREEN
CURRENT_AC: complete
PRIORITY: P0
EFFORT: L
TYPE: REMEDIATION
ITERATION: 1
ESTIMATED_EFFORT_MINUTES: 300

--------------------------------------------------------------------------------
CRITICAL CONSTRAINTS
--------------------------------------------------------------------------------

MUST: Consume the `scripts/curation/pipeline/sources/crawl_plan/` framework module built by BASE-009a **without modification**. If the framework needs changes to support BBR, the change is a framework bug that must be fixed in the framework module (not via a BBR-specific patch), and BASE-009a's unit tests should be updated to cover the new case.
MUST: Apply all seven phases of [CRAWL-PLAN-PROTOCOL.md](../CRAWL-PLAN-PROTOCOL.md) to bestbikingroads.com (Form A — HTML scraper). Each phase's deliverable must be committed before the next phase runs.
MUST: Use the Phase 0 `site-map.md` pre-committed by the user (manual recon, co-committed with MR's site-map before BASE-009a dispatched). If the committed BBR site-map.md is missing or empty, STOP and escalate.
MUST: Replace `staging/bestbikingroads.jsonl` with the protocol-driven executor output. The new file has row count matching the committed BBR `urls.jsonl` inventory within ±10%.
MUST: Regenerate `baseline/catalog.jsonl`, `baseline/scores.json`, `baseline/archetype_counts.json`, and `baseline/source_counts.json` from the combined clean staging (FHWA untouched, MR clean from BASE-009a, BBR clean from this task).
MUST: Upgrade `review.md` verdict from "PASS WITH ISSUES" to "PASS". If the honest new verdict is still "PASS WITH ISSUES" or "FAIL", STOP and escalate to the user — do not soften the verdict to make the gate pass.
MUST: Commit BBR `crawl-plans/bestbikingroads/crawl-report.md` with verdict PASS, the regenerated baseline artifacts, and the upgraded review.md in a single atomic commit.
NEVER: Copy selectors from the existing `scripts/curation/pipeline/sources/bestbikingroads.py`. The existing scraper is the failure mode this task exists to fix. New selectors MUST be derived in Phase 3 against committed BBR fixtures with `fixture_yield` validation.
NEVER: Modify the framework module (`crawl_plan/`). If a framework bug is discovered, file a separate fix commit touching only the framework and its unit tests; do not bundle framework changes into the BBR task commit.
NEVER: Touch MR artifacts committed by BASE-009a.
NEVER: Mark this task done while any Phase 6 BBR required-field yield is below 100% for fields marked `required: true`, or while any of the 5 landmarks is missing from the regenerated catalog.
NEVER: Run Phase 5 execution before Phase 4 BBR fixture tests pass locally.
NEVER: Rewrite git history. Create a new commit that overwrites the junk baseline files in place. The PASS WITH ISSUES baseline must remain in git history for audit.
STRICTLY: Respect robots.txt and rate limits (BBR: 3-4s delay, ~20 req/min cap). Phase 5 is ~3.75-4.5 hours of serial execution depending on cluster page count. This is expected and non-negotiable.
STRICTLY: Convex push stays `--dry-run`. No production writes.

BBR-SPECIFIC RULES FROM 2026-04-13 PHASE 0 RECON (see DECISIONS.md "Phase 0 recon findings"):

MUST: Declare `rating` field `required: false` in BBR selectors.yaml. Phase 0 recon established that BBR stores ratings in inline JavaScript (`responseA[i].comments_ave_rating`), NOT in the DOM, which is why the prior scraper's `.rating` / `[class*='rating']` selectors never matched. Declaring `rating: required: true` would fail Phase 3's fixture_yield validation (0/5 yield). Declaring it `required: false` is the honest choice. The inline JS CAN be extracted via regex or a small JS-string parser, but that is optional enrichment, not a required field. Document this explicitly in BBR's selectors.yaml comment.

MUST: The `/rides/{cluster}` multi-area index pages are IN-SCOPE and ADDITIVE. Phase 0 recon measured cluster overlap on Tennessee: state listing has 68 rides, cluster `lake-obion-weakley` has 46 rides with only 17% URL overlap (83% additive). Cumulative state + 2 clusters = 132 unique rides vs banner "167 routes". **Skipping clusters reproduces Epic 2's exact ~10% yield failure.** Phase 1 inventory MUST include cluster pages as a distinct page type (the site-map.md already classifies them as PT-02 sub-state cluster index). If the inventory row count comes in below 3,500 it almost certainly means cluster pages were skipped — return to Phase 1.

MUST: Use the framework's canonicalize() function WITHOUT overriding it. BBR has mixed-case slugs like `Columbia-2` where lowercasing the path would collapse distinct routes. The framework's canonicalize() (built in BASE-009a) preserves path case; do not add BBR-specific normalization that lowercases slugs.

MUST: Use the framework's `state_primary` + `states_all` schema (inherited from BASE-009a). Multi-state routes are first-class on BBR (Blue Ridge Parkway crosses NC/VA, etc.). Phase 4 fixture assertions use `expected.state in record.states_all`.

--------------------------------------------------------------------------------
SPECIFICATION
--------------------------------------------------------------------------------

**Objective:** Apply the proven crawl_plan framework (from BASE-009a) to bestbikingroads.com, regenerate the Epic 2 baseline artifacts from the combined clean staging files, and upgrade `review.md` verdict from "PASS WITH ISSUES" to "PASS". This task completes the Epic 2 remediation and unblocks Epic 3 (INF-001).

**Why split from BASE-009a:** BBR has ~4,100 US routes vs MR's ~300-1000, and Phase 5 BBR execution takes ~3.75 hours at the site's rate limit (vs MR's ~30 minutes). By the time this task dispatches, the framework is proven on MR, so BBR Phase 1-4 iteration is fast and Phase 5 is a dispatch-and-walk-away operation. If framework bugs had been discovered here instead of in 009a, each re-run would cost 3.75 hours.

**In scope:**
1. All seven protocol phases applied to bestbikingroads.com
2. Rewrite of `scripts/curation/pipeline/sources/bestbikingroads.py` as a thin glue layer over the framework (≤100 lines, same shape as BASE-009a's motorcycleroads.py rewrite)
3. Committed BBR crawl plan artifacts at `.spec/prds/curation-hardening/crawl-plans/bestbikingroads/`
4. Committed BBR fixtures at `fixtures/bestbikingroads/`
5. Committed Phase 4 contract tests at `scripts/curation/tests/sources/test_bestbikingroads_fixtures.py`
6. Regenerated `staging/bestbikingroads.jsonl` from the new executor
7. Regenerated Epic 2 baseline artifacts: `baseline/catalog.jsonl`, `baseline/scores.json`, `baseline/archetype_counts.json`, `baseline/source_counts.json`
8. Updated `baseline-report.md` Community Scrapers section with new counts and yields
9. Rewritten `review.md` with verdict PASS (Epic 2 verdict upgrade — load-bearing for every downstream epic)

**Out of scope:**
- Any MR work (completed in BASE-009a)
- Framework modifications (if a framework bug is found, fix in a separate commit scoped to `crawl_plan/` + its unit tests; that fix may be by this task or escalated to user)
- Convex production writes
- FHWA re-processing (FHWA data is Form E exempt; already clean via BASE-000)

**Success looks like:**
1. `.spec/prds/curation-hardening/crawl-plans/bestbikingroads/` has 4 files committed: `site-map.md` (user-provided), `urls.jsonl`, `selectors.yaml`, `crawl-report.md` (verdict PASS)
2. `fixtures/bestbikingroads/` has ≥3 fixtures per page type + `fixtures.manifest.yaml` with expected values
3. `scripts/curation/tests/sources/test_bestbikingroads_fixtures.py` exists and passes locally
4. `staging/bestbikingroads.jsonl` has 2,900-3,400 rows (≥90% of the ~3,226 measured inventory — see DECISIONS.md "AC-3 gate recalibration"); `.audit.json` sibling has non-zero counters, zero `schema_validation_fail`
5. `scripts/curation/pipeline/sources/bestbikingroads.py` is ≤100 lines of thin glue over the framework
6. `baseline/catalog.jsonl`, `baseline/scores.json`, `baseline/archetype_counts.json`, `baseline/source_counts.json` regenerated from clean FHWA + MR + BBR staging
7. `review.md` verdict is exactly "PASS" (not "PASS WITH ISSUES", not "FAIL")
8. All 5 landmarks (Tail of the Dragon, Blue Ridge Parkway, Beartooth Highway, Pacific Coast Highway, Million Dollar Highway) present in the regenerated catalog in at least one source (cross-source dedup is Epic 6, not this task)
9. `baseline-report.md` Community Scrapers section reflects the new counts and PASS verdicts

--------------------------------------------------------------------------------
BACKGROUND
--------------------------------------------------------------------------------

**Why this task exists:** Epic 2's BASE-002 (community scrapers validation) declared BBR "slow but functional" after ~21 minutes of scraping had produced ~413 routes against a true US universe of ~4,100. The review.md verdict was "PASS WITH ISSUES" and was allowed to stand. Every downstream epic (Epic 6 dedup, Epic 8 calibration, Epic 12 orchestrator) diffs against this baseline. A ~10% yield with sidebar contamination makes every downstream diff meaningless.

**Why this task needs BASE-009a first:** The shared `crawl_plan/` framework does not exist at Epic 2 BASE-008 completion. BASE-009a builds it and proves it on MR (the smaller of the two community scrapers, ~30 min Phase 5 vs BBR's ~3.75 hr). Splitting the work means framework bugs are discovered on MR's cheap execution cycle, not on BBR's expensive one.

**Current state at task start (post-BASE-009a):**
- Framework `scripts/curation/pipeline/sources/crawl_plan/` exists, importable, unit-tested
- `scripts/curation/pipeline/sources/motorcycleroads.py` is a ≤100-line glue file
- `staging/motorcycleroads.jsonl` is clean (300-1000 rows, no Alabama contamination)
- `crawl-plans/motorcycleroads/` has all 4 artifacts committed with verdict PASS
- `fixtures/motorcycleroads/` committed
- `crawl-plans/bestbikingroads/site-map.md` committed by user (Phase 0 recon) — the only BBR artifact that exists
- `staging/bestbikingroads.jsonl` still contains the junk 413 rows
- `scripts/curation/pipeline/sources/bestbikingroads.py` still contains blind selectors
- `review.md` still has verdict "PASS WITH ISSUES"

**Desired state at task end:**
- BBR staging file replaced with clean data (~2,900-3,400 rows; see DECISIONS.md "AC-3 gate recalibration" for the gate recalibration rationale)
- BBR crawl plan artifacts committed
- BBR fixtures committed
- BBR parser rewritten as framework glue
- Epic 2 baseline artifacts regenerated from clean staging
- `review.md` verdict upgraded to PASS
- Epic 3 (INF-001) is unblocked

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA (TDD Beads)
--------------------------------------------------------------------------------

AC-1: Framework is consumed as-is (no modifications in this task)
  GIVEN: BASE-009a committed the framework module
  WHEN: This task's commits are inspected
  THEN: No file under `scripts/curation/pipeline/sources/crawl_plan/` has been modified by this task (any framework fixes land as separate commits scoped to the framework + its unit tests)

  VERIFY: `git log --oneline BASE-009a..HEAD -- scripts/curation/pipeline/sources/crawl_plan/ | grep -v "framework fix" | wc -l | xargs -I{} test {} -eq 0 && echo "framework untouched PASS"`

AC-2: Phase 0 BBR site-map.md is committed (pre-existing input)
  GIVEN: User committed both site-maps before BASE-009a dispatched
  WHEN: The Phase 0 BBR site-map is checked
  THEN: `.spec/prds/curation-hardening/crawl-plans/bestbikingroads/site-map.md` exists with page type taxonomy, URL patterns, sample URLs, and known traps (explicitly including a decision on whether `/rides/{cluster}` multi-area pages are additive or redundant)

  VERIFY: `f=".spec/prds/curation-hardening/crawl-plans/bestbikingroads/site-map.md"; test -f "$f" && grep -q "PT-" "$f" && grep -qiE "sample" "$f" && grep -qiE "trap" "$f" && echo "BBR site-map PASS"`

AC-3: Phase 1 BBR urls.jsonl committed with row count in expected range
  GIVEN: site-map.md from AC-2
  WHEN: Framework inventory runs against BBR state listing pages + top-level index
  THEN: `.../crawl-plans/bestbikingroads/urls.jsonl` exists; PT-route-detail count in [3100, 3400] (recalibrated 2026-04-14 per DECISIONS.md "AC-3 gate recalibration" — measured reality from the first Phase 5 run, replacing the inflated pre-flight site-banner estimate of [3500, 5500]); every row has non-null page_type

  VERIFY: `PYTHONPATH=$(pwd) .venv/bin/python -c "import json; rows=[json.loads(l) for l in open('.spec/prds/curation-hardening/crawl-plans/bestbikingroads/urls.jsonl')]; details=[r for r in rows if 'route-detail' in r['page_type']]; assert 3100 <= len(details) <= 3400, len(details); assert all(r['page_type'] for r in rows); print(f'BBR inventory PASS: {len(details)} route details, {len(rows)} total rows')"`

AC-4: Phase 2 BBR fixtures committed with manifest
  GIVEN: urls.jsonl from AC-3
  WHEN: 3-5 fixtures per BBR page type are downloaded and committed
  THEN: `fixtures/bestbikingroads/` has per-page-type directories with ≥3 .html files and `fixtures.manifest.yaml` with expected values (including at least one fixture for a known landmark like Tail of the Dragon or Million Dollar Highway for AC-8 landmark-spot-check)

  VERIFY: `PYTHONPATH=$(pwd) .venv/bin/python -c "
import os, yaml
base = 'fixtures/bestbikingroads'
assert os.path.isdir(base)
m = yaml.safe_load(open(f'{base}/fixtures.manifest.yaml'))
for pt, items in m.items():
    assert len(items) >= 3
    for it in items:
        assert os.path.isfile(f'{base}/{pt}/{it[\"file\"]}')
        assert 'expected' in it and 'route_name' in it['expected']
print('BBR fixtures PASS')"`

AC-5: Phase 3 BBR selectors.yaml committed with fixture_yield 5/5 on required fields
  GIVEN: BBR fixtures from AC-4
  WHEN: Selectors are derived (LLM-assisted) and validated against all BBR fixtures
  THEN: `.../crawl-plans/bestbikingroads/selectors.yaml` exists; every `required: true` field has fixture_yield equal to the fixture count for that page type

  VERIFY: `PYTHONPATH=$(pwd) .venv/bin/python -c "
import yaml
sel = yaml.safe_load(open('.spec/prds/curation-hardening/crawl-plans/bestbikingroads/selectors.yaml'))
for pt, fields in sel.items():
    for fname, fdef in fields.items():
        if fdef.get('required'):
            y = fdef.get('fixture_yield','0/0')
            n,d = map(int, y.split('/'))
            assert n==d and n>0, f'{pt}/{fname} required but yield {y}'
print('BBR selectors PASS')"`

AC-6: Phase 4 BBR fixture tests pass
  GIVEN: selectors.yaml from AC-5 and fixtures from AC-4
  WHEN: `pytest scripts/curation/tests/sources/test_bestbikingroads_fixtures.py` runs
  THEN: All assertions pass (exit 0)

  VERIFY: `PYTHONPATH=$(pwd) .venv/bin/python -m pytest scripts/curation/tests/sources/test_bestbikingroads_fixtures.py -v`

AC-7: Phase 5 BBR execution replaces staging file with ≥90% inventory yield + bestbikingroads.py is thin glue
  GIVEN: Fixture tests passing from AC-6
  WHEN: `python -m scripts.curation.pipeline.sources.bestbikingroads` runs under the new framework
  THEN: `staging/bestbikingroads.jsonl` row count ≥90% of inventory; `.audit.json` shows fetched > 0, parse_success > 0, schema_validation_fail < 1% of parse attempts; `bestbikingroads.py` is ≤100 non-comment lines with no BeautifulSoup calls

  VERIFY: `PYTHONPATH=$(pwd) .venv/bin/python -c "
import json, os
staging = 'staging/bestbikingroads.jsonl'
audit = 'staging/bestbikingroads.jsonl.audit.json'
assert os.path.isfile(staging) and os.path.isfile(audit)
a = json.load(open(audit))
assert a.get('fetched',0) > 0 and a.get('parse_success',0) > 0
assert a.get('schema_validation_fail',0) / max(1, a.get('parse_success',1)) < 0.01
inv = sum(1 for _ in open('.spec/prds/curation-hardening/crawl-plans/bestbikingroads/urls.jsonl'))
staged = sum(1 for _ in open(staging))
assert staged / inv >= 0.90, f'yield {staged/inv:.1%}'
src = open('scripts/curation/pipeline/sources/bestbikingroads.py').read()
lines = [l for l in src.split('\n') if l.strip() and not l.strip().startswith('#')]
assert len(lines) <= 100
assert 'BeautifulSoup' not in src and 'soup.select' not in src
assert 'crawl_plan' in src
print(f'BBR execution PASS: {staged}/{inv} = {staged/inv:.1%}, glue {len(lines)} lines')"`

AC-8: Phase 6 BBR crawl-report.md committed with verdict PASS
  GIVEN: Execution complete from AC-7
  WHEN: crawl-report.md is written per the protocol template
  THEN: `.../crawl-plans/bestbikingroads/crawl-report.md` exists with verdict PASS, counters table, required-field yield table, and landmark presence check with Tail of the Dragon and Million Dollar Highway marked FOUND (both are BBR-resident, not FHWA/MR)

  VERIFY: `f=".spec/prds/curation-hardening/crawl-plans/bestbikingroads/crawl-report.md"; grep -qE "^\*\*?Verdict:\*\*? PASS$" "$f" && grep -q "Tail of the Dragon" "$f" && grep -q "Million Dollar" "$f" && echo "BBR crawl-report PASS"`

AC-9: Epic 2 baseline artifacts regenerated from combined clean staging
  GIVEN: FHWA, MR, and BBR staging files are all clean (FHWA via BASE-000, MR via BASE-009a, BBR via this task)
  WHEN: The existing Epic 2 pipeline stages are re-run against the combined staging
  THEN: `baseline/catalog.jsonl`, `baseline/scores.json`, `baseline/archetype_counts.json`, and `baseline/source_counts.json` are regenerated; source_counts.json has updated fhwa/motorcycleroads/bestbikingroads counts

  VERIFY: `PYTHONPATH=$(pwd) .venv/bin/python -c "
import json
base = '.spec/prds/curation-hardening/tasks/epic-02-baseline-pipeline-validation/baseline'
sc = json.load(open(f'{base}/source_counts.json'))
assert sc['fhwa'] >= 580 and sc['fhwa'] <= 710
assert sc['motorcycleroads'] >= 300 and sc['motorcycleroads'] <= 1000
assert sc['bestbikingroads'] >= 2900 and sc['bestbikingroads'] <= 3400  # staging-count range (≥90% of ~3,226 inventory per AC-3 recalibration)
for f in ['catalog.jsonl','scores.json','archetype_counts.json']:
    import os
    assert os.path.isfile(f'{base}/{f}')
print(f'baseline regen PASS: {sc}')"`

AC-10: review.md verdict upgraded from PASS WITH ISSUES to PASS + all 5 landmarks present
  GIVEN: Regenerated baseline from AC-9
  WHEN: review.md is rewritten against the clean baseline AND all 5 landmark searches run against the combined staging
  THEN: review.md verdict line is exactly "PASS" (not "PASS WITH ISSUES", not "FAIL"); Tail of the Dragon, Million Dollar Highway, Blue Ridge Parkway, Beartooth Highway, Pacific Coast Highway each appear at least once across FHWA+MR+BBR staging

  VERIFY: `grep -E "^(\*\*)?Verdict:(\*\*)?" .spec/prds/curation-hardening/tasks/epic-02-baseline-pipeline-validation/review.md | grep -vq "WITH ISSUES" && grep -E "^(\*\*)?Verdict:(\*\*)?" .spec/prds/curation-hardening/tasks/epic-02-baseline-pipeline-validation/review.md | grep -q "PASS" && PYTHONPATH=$(pwd) .venv/bin/python -c "
import json
routes = []
for s in ['fhwa','motorcycleroads','bestbikingroads']:
    try:
        routes += [json.loads(l) for l in open(f'staging/{s}.jsonl')]
    except FileNotFoundError:
        pass
landmarks = ['Tail of the Dragon','Million Dollar','Blue Ridge Parkway','Beartooth','Pacific Coast']
missing = [l for l in landmarks if not any(l.lower() in (r.get('name') or '').lower() for r in routes)]
assert not missing, f'missing {missing}'
print('verdict upgraded + landmarks PASS')"`

Quality Criteria:
- [ ] All 10 ACs verified
- [ ] Framework not modified by this task (any fixes in separate commits)
- [ ] Phase 4 BBR fixture tests committed BEFORE Phase 5 execution
- [ ] Final commit is atomic: BBR crawl plan + BBR staging + regenerated baseline + upgraded review.md in ONE commit
- [ ] No `--no-verify` or bypass flags

--------------------------------------------------------------------------------
TEST CRITERIA (Boolean Verification)
--------------------------------------------------------------------------------

| # | Boolean Statement | Maps To AC | Status |
|---|-------------------|------------|--------|
| 1 | No framework modifications in this task's commits | AC-1 | [ ] TRUE [ ] FALSE |
| 2 | BBR site-map.md committed with page types + traps | AC-2 | [ ] TRUE [ ] FALSE |
| 3 | BBR urls.jsonl route-detail count in [3100, 3400] (recalibrated from [3500, 5500] 2026-04-14) | AC-3 | [ ] TRUE [ ] FALSE |
| 4 | BBR fixtures ≥3 per page type + manifest.expected | AC-4 | [ ] TRUE [ ] FALSE |
| 5 | BBR selectors.yaml fixture_yield 5/5 on required | AC-5 | [ ] TRUE [ ] FALSE |
| 6 | BBR fixture pytest tests pass | AC-6 | [ ] TRUE [ ] FALSE |
| 7 | BBR staging yield ≥90% + glue ≤100 lines | AC-7 | [ ] TRUE [ ] FALSE |
| 8 | BBR crawl-report.md PASS + Tail/Million Dollar FOUND | AC-8 | [ ] TRUE [ ] FALSE |
| 9 | Epic 2 baseline artifacts regenerated with updated counts | AC-9 | [ ] TRUE [ ] FALSE |
| 10 | review.md verdict PASS + all 5 landmarks present | AC-10 | [ ] TRUE [ ] FALSE |

--------------------------------------------------------------------------------
READING LIST
--------------------------------------------------------------------------------

1. .spec/prds/curation-hardening/tasks/CRAWL-PLAN-PROTOCOL.md — ALL; focus on Form A deliverables and phase gates
2. .spec/prds/curation-hardening/tasks/CURATION-REVIEW-PROTOCOL.md — Step 1 pre-verification (this task satisfies it for BBR)
3. .spec/prds/curation-hardening/tasks/epic-02-baseline-pipeline-validation/BASE-009a.md — the framework is built here; this task consumes it as-is
4. .spec/prds/curation-hardening/crawl-plans/bestbikingroads/site-map.md — user-provided Phase 0 input (required to exist)
5. .spec/prds/curation-hardening/tasks/epic-02-baseline-pipeline-validation/review.md — the "PASS WITH ISSUES" verdict this task upgrades
6. .spec/prds/curation-hardening/tasks/epic-02-baseline-pipeline-validation/baseline-report.md — lines 133-211 (Community Scrapers section being updated)
7. scripts/curation/pipeline/sources/crawl_plan/ — the framework this task consumes. DO NOT MODIFY.
8. scripts/curation/pipeline/sources/bestbikingroads.py — the failure mode. DO NOT copy selectors.
9. scripts/curation/pipeline/sources/motorcycleroads.py (post-BASE-009a) — reference implementation of what a framework-glue file looks like

--------------------------------------------------------------------------------
GUARDRAILS
--------------------------------------------------------------------------------

WRITE-ALLOWED:
- scripts/curation/pipeline/sources/bestbikingroads.py — REWRITE as thin glue (≤100 lines, same shape as motorcycleroads.py from BASE-009a)
- .spec/prds/curation-hardening/crawl-plans/bestbikingroads/urls.jsonl — NEW (Phase 1)
- .spec/prds/curation-hardening/crawl-plans/bestbikingroads/selectors.yaml — NEW (Phase 3)
- .spec/prds/curation-hardening/crawl-plans/bestbikingroads/crawl-report.md — NEW (Phase 6)
- fixtures/bestbikingroads/ — NEW (Phase 2 HTML + manifest)
- scripts/curation/tests/sources/test_bestbikingroads_fixtures.py — NEW Phase 4 contract tests
- .spec/prds/curation-hardening/tasks/epic-02-baseline-pipeline-validation/baseline/catalog.jsonl — REGENERATE
- .spec/prds/curation-hardening/tasks/epic-02-baseline-pipeline-validation/baseline/scores.json — REGENERATE
- .spec/prds/curation-hardening/tasks/epic-02-baseline-pipeline-validation/baseline/archetype_counts.json — REGENERATE
- .spec/prds/curation-hardening/tasks/epic-02-baseline-pipeline-validation/baseline/source_counts.json — REGENERATE
- .spec/prds/curation-hardening/tasks/epic-02-baseline-pipeline-validation/review.md — REWRITE (verdict upgrade PASS)
- .spec/prds/curation-hardening/tasks/epic-02-baseline-pipeline-validation/baseline-report.md — UPDATE Community Scrapers section only

WRITE-PROHIBITED:
- scripts/curation/pipeline/sources/crawl_plan/ — framework is CONSTITUTION for this task. Any bugs found here escalate to a separate framework-fix commit.
- scripts/curation/pipeline/sources/motorcycleroads.py — committed by BASE-009a, do not touch
- .spec/prds/curation-hardening/crawl-plans/motorcycleroads/ — BASE-009a scope
- fixtures/motorcycleroads/ — BASE-009a scope
- convex/** — no schema changes
- BASE-000.md through BASE-009a.md — frozen prior tasks
- CRAWL-PLAN-PROTOCOL.md — constitution
- Any commit using `--no-verify` or rewriting git history

MUST:
- [ ] Final commit is atomic: BBR crawl plan + fixtures + staging + regenerated baseline + upgraded review.md
- [ ] If framework bug discovered, fix in a separate commit scoped to `crawl_plan/` + its unit tests, land the framework fix first, then continue the BBR task
- [ ] BBR Phase 5 respects rate limit (~3.75 hr wall clock, serial)

MUST NOT:
- [ ] Bundle framework fixes into the BBR task commit
- [ ] Soften the review.md verdict to make AC-10 pass
- [ ] Reintroduce sidebar contamination (fixture tests guard this)

--------------------------------------------------------------------------------
AGENT INSTRUCTIONS (Phase-Driven Flow)
--------------------------------------------------------------------------------

AGENT: python-implement

### Preflight (~5 min)
  VERIFY: `from scripts.curation.pipeline.sources.crawl_plan import inventory, selectors, parser, executor` succeeds (framework from BASE-009a is committed)
  VERIFY: `.spec/prds/curation-hardening/crawl-plans/bestbikingroads/site-map.md` exists
  VERIFY: `staging/motorcycleroads.jsonl` is the clean BASE-009a output (≥300 rows, sample-check state correctness)
  If any check fails, STOP — BASE-009a is not complete or user has not provided BBR site-map.

### Phase 1 — INVENTORY (~30 min)
  DO: Run framework `inventory.discover()` with BBR patterns from site-map.md against BBR's 50 state listing pages + top-level index. If `/rides/{cluster}` is in scope per site-map, include those index pages too.
  COMMIT: urls.jsonl. If reject rate > 10%, STOP — return to user for Phase 0 revision.
  GATE: AC-3 verify passes.

### Phase 2 — FIXTURES (~30 min)
  DO: Download 3-5 BBR pages per page type. MUST include Tail of the Dragon and Million Dollar Highway fixtures (for AC-8 landmark presence check).
  COMMIT: fixtures + manifest.
  GATE: AC-4 verify passes.

### Phase 3 — SELECTOR SPEC (~30 min)
  DO: LLM-assisted selector derivation + fixture_yield validation across all BBR fixtures.
  WRITE: selectors.yaml.
  COMMIT.
  GATE: AC-5 verify passes.

### Phase 4 — DRY-RUN PARSE (~30 min)
  DO: Write test_bestbikingroads_fixtures.py following the protocol pattern. Run pytest. Iterate until green.
  COMMIT.
  GATE: AC-6 verify passes.

### Phase 5 — EXECUTION (~225 min, rate-limited, mostly unattended)
  DO: Rewrite bestbikingroads.py as framework glue (≤100 lines). Run `python -m scripts.curation.pipeline.sources.bestbikingroads`. Phase 5 takes ~3.75 hours at the BBR rate limit.
  MONITOR: `.audit.json` updates every 100 routes via file polling. If schema_validation_fail rate > 5%, STOP and escalate.
  HANDLE: Routes that fail schema validation → `needs_llm_fallback.jsonl` queue. Optional end-of-run Firecrawl fallback if queue > 0 (budget: $20 max).
  GATE: AC-7 verify passes.

### Phase 6 — ACCOUNTING + BASELINE REGEN (~60 min)
  DO: Write crawl-plans/bestbikingroads/crawl-report.md with counters, yields, landmark check, verdict PASS.
  DO: Re-run Epic 2 pipeline stages against combined clean staging:
    - extraction: `python -m scripts.curation.pipeline.extraction.client --sample 20 --count 20 --out <baseline>/catalog.jsonl`
    - scoring: `python -m scripts.curation.pipeline.scoring.composite --input <baseline>/catalog.jsonl --out <baseline>/scores.json --count 20`
    - classification: `python -m scripts.curation.pipeline.classification.archetype --routes <baseline>/catalog.jsonl --scores <baseline>/scores.json --out <baseline>/archetype_counts.json --count 20`
  DO: Regenerate baseline/source_counts.json from wc-l of staging files.
  DO: Update baseline-report.md Community Scrapers section (replace "PASS WITH ISSUES" sections for MR and BBR with PASS sections citing the new crawl-reports).
  DO: Rewrite review.md with verdict PASS. Remove the PASS WITH ISSUES rationale block. Add a line crediting BASE-009a/b for the remediation.
  DO: Single atomic commit containing all BBR crawl plan artifacts + fixtures + staging-file-regen-commit-marker + regenerated baseline + updated baseline-report.md + upgraded review.md.
  GATE: AC-8, AC-9, AC-10 verify commands pass.

### Task end
  REPORT: Summary of committed artifacts, BBR staging row count, MR+BBR+FHWA source counts, any schema_validation_fails, the Phase 5 wall clock, and a copy of the new review.md verdict rationale. Await user approval to unblock Epic 3.

--------------------------------------------------------------------------------
ORCHESTRATOR VERIFICATION PROTOCOL
--------------------------------------------------------------------------------

AFTER Preflight: framework import + AC-2 verify → expect "ok" and "BBR site-map PASS"
AFTER Phase 1: AC-3 verify → expect "BBR inventory PASS"
AFTER Phase 2: AC-4 verify → expect "BBR fixtures PASS"
AFTER Phase 3: AC-5 verify → expect "BBR selectors PASS"
AFTER Phase 4: AC-6 pytest → expect exit 0
AFTER Phase 5: AC-7 verify → expect "BBR execution PASS"
AFTER Phase 6: AC-1, AC-8, AC-9, AC-10 verify → expect all PASS

If AC-10 cannot be honestly satisfied (verdict would be FAIL or PASS WITH ISSUES), STOP and escalate to user. Do not soften the verdict.

--------------------------------------------------------------------------------
AGENT ASSIGNMENT
--------------------------------------------------------------------------------

**Implementation Agent:** python-implement
**Review Agent:** python-review + code-reviewer (especially the verdict-upgrade honesty check on review.md)
**Assignment Date:** 2026-04-13

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends On:
- BASE-009a (framework + MR remediation, committed with verdict PASS)
- User-committed `.spec/prds/curation-hardening/crawl-plans/bestbikingroads/site-map.md`

Blocks:
- INF-001 (Epic 3 Foundation start) — Epic 3 extends models against this clean baseline; extending against junk is the cascade failure the BASE-009a/b split prevents

--------------------------------------------------------------------------------
TASK READINESS
--------------------------------------------------------------------------------

Prerequisites:
- [ ] BASE-009a committed with verdict PASS on MR
- [ ] `scripts/curation/pipeline/sources/crawl_plan/` framework importable
- [ ] `staging/motorcycleroads.jsonl` is clean (BASE-009a output)
- [ ] User has approved BASE-009a's MR crawl-report.md (human checkpoint between 009a and 009b)
- [ ] `.spec/prds/curation-hardening/crawl-plans/bestbikingroads/site-map.md` committed

Can Execute In Parallel With: none (serial Epic 2 remediation)

--------------------------------------------------------------------------------
NOTES
--------------------------------------------------------------------------------

- Estimated effort: ~300 minutes (~5 hours). Breakdown: Preflight + Phase 1 ~35 min; Phase 2 ~30 min; Phase 3 ~30 min; Phase 4 ~30 min; Phase 5 ~225 min (rate-limited BBR execution, mostly unattended); Phase 6 ~60 min (baseline regen + review.md rewrite + atomic commit).
- Phase 5 is the long pole. The agent dispatches the executor and reports back when it completes. The user does not need to babysit; the executor writes `.audit.json` updates every 100 routes and the `.progress` file makes the run resumable if interrupted.
- Verdict upgrade honesty: the review.md verdict is a human-review-grade assertion. If the AC-10 gate cannot be honestly satisfied (e.g., BBR yield came in at 85%, or a landmark is missing, or schema validation fails on >1% of routes), the agent STOPS and escalates. A fabricated PASS verdict is a protocol violation worse than the original PASS WITH ISSUES.
- The framework-untouched invariant (AC-1) is a design-quality gate. If BBR's structure requires framework changes, the design was wrong and BASE-009a should have caught it. In practice, framework fixes land in a separate PR-like commit scoped to `crawl_plan/` + its unit tests, and BASE-009b then consumes the fixed framework — but this should be rare.
- After this task completes, Epic 2 is DONE. User reviews review.md + baseline artifacts, approves, and dispatches Epic 3 (INF-001).
- **Phase 0 recon is complete** (committed 2026-04-13 PM in `e7f6368`). The site-map.md at `.spec/prds/curation-hardening/crawl-plans/bestbikingroads/site-map.md` is the authoritative input. Summary of findings: (1) 6 page types identified, 3 in-scope (PT-01 state listing, PT-02 sub-state cluster index, PT-03 route detail); (2) `/rides/{cluster}` IS additive (83% novel routes on the measured Tennessee sample) — confirmed in-scope; (3) rating is inline JS, not DOM — declare `required: false`; (4) cross-state "you might also like" rail is present on PT-01 and PT-03 — defense is URL-derived `state_primary`, never listing-page context; (5) mixed-case slugs (e.g. `Columbia-2`) must be preserved in canonicalization; (6) robots.txt only disallows `/droute.php` (irrelevant); no Crawl-delay directive — recommended 3-4 s delay; (7) Phase 5 wall-clock estimate at ~4,600 fetches × 3.5 s ≈ 4.5 hr, compatible with the 3.75 hr task estimate but on the upper edge.

--------------------------------------------------------------------------------
APPROVAL
--------------------------------------------------------------------------------

Approved By: [pending]
Date: [pending]

================================================================================
