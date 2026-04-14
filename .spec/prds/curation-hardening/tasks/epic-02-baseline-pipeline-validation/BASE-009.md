================================================================================
TASK: BASE-009 - Crawl Plan Protocol remediation — re-crawl MR + BBR under new methodology
================================================================================

TASK_TYPE: INFRA / REMEDIATION
STATUS: Backlog
TDD_PHASE: RED
CURRENT_AC: AC-1
PRIORITY: P0
EFFORT: L
TYPE: REMEDIATION
ITERATION: 1

--------------------------------------------------------------------------------
CRITICAL CONSTRAINTS
--------------------------------------------------------------------------------

MUST: Apply all seven phases of [CRAWL-PLAN-PROTOCOL.md](../CRAWL-PLAN-PROTOCOL.md) to both motorcycleroads.com and bestbikingroads.com (both are Form A — HTML scrapers). Phases MUST run sequentially with committed artifacts at every gate.
MUST: Build the shared `scripts/curation/pipeline/sources/crawl_plan/` framework module (inventory.py, selectors.py, parser.py, executor.py) as part of this task — it does not exist yet and is the substrate BASE-009 plus every future source task depends on.
MUST: Replace `staging/motorcycleroads.jsonl` and `staging/bestbikingroads.jsonl` with new outputs from the protocol-driven executor. Regenerate `baseline/catalog.jsonl`, `baseline/scores.json`, `baseline/archetype_counts.json`, `baseline/source_counts.json`, `baseline-report.md`, and `review.md` against the re-crawled staging files.
MUST: Upgrade `review.md` verdict from "PASS WITH ISSUES" to "PASS". If the honest new verdict is still "PASS WITH ISSUES" or "FAIL", STOP and escalate to the user — do not commit a weaker verdict to make the gate pass.
NEVER: Copy selectors from the existing `motorcycleroads.py` / `bestbikingroads.py`. Those scrapers are the failure mode this task exists to fix. New selectors MUST be derived in Phase 3 against committed fixtures, validated with `fixture_yield` scoring, and stored in `selectors.yaml`.
NEVER: Mark this task done while any Phase 6 required-field yield is below 100% for fields marked `required: true`, or while any landmark (Tail of the Dragon, Million Dollar Highway, Blue Ridge Parkway, Beartooth Highway, Pacific Coast Highway) is missing from the regenerated catalog.
NEVER: Run Phase 5 execution before Phase 4 fixture tests pass locally. Running execution without committed, passing fixture tests is a protocol violation.
NEVER: Rewrite git history. Create a new commit that overwrites the junk baseline files in place — the prior PASS WITH ISSUES baseline must remain in git history for audit.
STRICTLY: Respect robots.txt and rate limits (BBR: 3-4s delay, MR: 2-3s delay) — the same discipline the current scrapers already enforce.
STRICTLY: Convex push stays `--dry-run`. This task does not write to production Convex.

--------------------------------------------------------------------------------
SPECIFICATION
--------------------------------------------------------------------------------

**Objective:** Remediate the Epic 2 "PASS WITH ISSUES" baseline by re-crawling motorcycleroads.com and bestbikingroads.com under the newly adopted [CRAWL-PLAN-PROTOCOL.md](../CRAWL-PLAN-PROTOCOL.md) seven-phase methodology. Build the shared crawl_plan framework module that every future source task will reuse. Replace the junk staging and baseline artifacts in place, regenerate `review.md` with verdict PASS, and commit the crawl plan artifacts (site-map, inventory, fixtures, selectors, report) as the reference methodology application for the entire Curation Hardening initiative.

**Success looks like:**
1. `scripts/curation/pipeline/sources/crawl_plan/` framework module exists, importable, unit-tested, and documented
2. `.spec/prds/curation-hardening/crawl-plans/motorcycleroads/` contains site-map.md, urls.jsonl, selectors.yaml, crawl-report.md with verdict PASS
3. `.spec/prds/curation-hardening/crawl-plans/bestbikingroads/` contains the same four files with verdict PASS
4. `fixtures/motorcycleroads/` and `fixtures/bestbikingroads/` each contain ≥3 committed HTML fixtures per page type plus `fixtures.manifest.yaml`
5. `scripts/curation/tests/sources/test_motorcycleroads_fixtures.py` and `test_bestbikingroads_fixtures.py` exist and pass locally
6. `staging/motorcycleroads.jsonl` regenerated under the framework: 300-1000 routes (true universe range)
7. `staging/bestbikingroads.jsonl` regenerated under the framework: 3,500-5,500 routes
8. Both staging files have `.audit.json` siblings with populated counters and verdict PASS gates met
9. `baseline/catalog.jsonl` regenerated from the new staging files; `baseline/source_counts.json` reflects the new counts
10. `review.md` verdict is PASS (not PASS WITH ISSUES); the Alabama-stamped Blue Ridge Parkway / Beartooth Pass bug is gone
11. All 5 landmark routes present in the regenerated catalog in at least one source (cross-source dedup is Epic 6, not this task)

--------------------------------------------------------------------------------
BACKGROUND
--------------------------------------------------------------------------------

**Problem:** Epic 2's community scraper validation (BASE-002) produced a `review.md` verdict of "PASS WITH ISSUES" that was allowed to stand. MotorcycleRoads delivered 30 routes against an expected >50 baseline (true universe ~300-700). BestBikingRoads delivered 413 routes against a true universe of ~4,100 (a ~10% yield, then declared "slow but functional"). The MR scraper stamped "Blue Ridge Parkway" and "Beartooth Pass" as Alabama routes because state listing page sidebars cross-linked routes from other states and the scraper treated those links as inbound from the current listing state. The scraper's selectors (`.field-field-rating`, `.field-field-description`, `[class*='rating']`) were blind guesses never validated against a real route page; `rating: 0.0` landed on almost every record.

**Root causes (documented in [CRAWL-PLAN-PROTOCOL.md](../CRAWL-PLAN-PROTOCOL.md) "Why This Protocol Exists"):**
1. Discovery, fetch, and extraction were interleaved in a single pass with no intermediate artifacts to validate
2. Selectors were blind guesses, never checked against a real page before running at scale
3. The scraper swallowed exceptions and had no accountability counters, so a 10% yield was indistinguishable from a working scraper hitting a small universe
4. No committed URL inventory meant dedup happened at extraction time — too late to catch sidebar contamination
5. No fixture-based parser tests, so structural bugs (state from listing page vs route URL) were only discovered after running at scale

**Why re-crawl:** Every downstream epic in the Curation Hardening initiative diffs its catalog against the Epic 2 baseline. Epic 6 dedup measures merge rates against this baseline. Epic 8 scoring calibration diffs against it. If the baseline is wrong by 90% of the true BBR universe and has state contamination, every downstream diff is meaningless. A clean baseline is foundational — see the cascade-failure analysis in the 2026-04-13 DECISIONS.md entry ("Crawl Plan Protocol adoption").

**Why now:** The Crawl Plan Protocol was adopted on 2026-04-13 specifically in response to the Epic 2 findings. BASE-009 is the first application of the protocol and the retroactive fix for the failure mode it was designed to prevent. Epic 4 (3 new sources) and Epic 9 (3 new community sources) depend on the protocol being battle-tested on a known-hard case before it is applied to unknown sources.

**Current state after BASE-008:** `baseline/catalog.jsonl` has 20 FHWA records (scored neutral 0.5 because Phase 1 has no curvature/elevation data). `staging/motorcycleroads.jsonl` has 30 records with sidebar contamination. `staging/bestbikingroads.jsonl` has ~413 records against a ~4,100-route universe. `review.md` verdict is "PASS WITH ISSUES". No crawl-plan artifacts or shared framework code exist.

**Desired state after BASE-009:** All seven crawl plan phases complete for both sources. Staging files replaced. Baseline and review regenerated. `review.md` upgraded to PASS. The Crawl Plan Protocol is proven on two real sources, giving downstream Epic 4 and Epic 9 tasks a working reference implementation plus a shared `crawl_plan/` framework they can reuse without rewriting.

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA (TDD Beads)
--------------------------------------------------------------------------------

AC-1: Shared crawl_plan framework module exists and is importable
  GIVEN: Task start (no framework exists)
  WHEN: `scripts/curation/pipeline/sources/crawl_plan/` is created with inventory.py, selectors.py, parser.py, executor.py
  THEN: `from scripts.curation.pipeline.sources.crawl_plan import inventory, selectors, parser, executor` succeeds

  TDD_STATE: [ ] RED  [ ] VERIFY_RED  [ ] GREEN  [ ] VERIFY_GREEN  [ ] REFACTOR
  TEST_FILE: scripts/curation/tests/sources/test_crawl_plan_framework.py
  TEST_FUNCTION: test_framework_modules_importable
  VERIFY: `PYTHONPATH=$(pwd) .venv/bin/python -c "from scripts.curation.pipeline.sources.crawl_plan import inventory, selectors, parser, executor; print('ok')"`

AC-2: Phase 0 site-map.md committed for both sources
  GIVEN: Framework module from AC-1 exists
  WHEN: Recon is performed manually on MR and BBR and site-map.md is written for each
  THEN: `.spec/prds/curation-hardening/crawl-plans/{source}/site-map.md` exists for each source and contains (a) page type taxonomy with IDs, (b) URL pattern per page type, (c) sample URLs per type, (d) known traps section

  VERIFY: `for s in motorcycleroads bestbikingroads; do f=".spec/prds/curation-hardening/crawl-plans/$s/site-map.md"; test -f "$f" && grep -q "PT-" "$f" && grep -qiE "sample" "$f" && grep -qiE "trap" "$f" || { echo "FAIL: $f incomplete"; exit 1; }; done && echo "site-map PASS"`

AC-3: Phase 1 urls.jsonl committed with row counts in expected range
  GIVEN: site-map.md from AC-2 defines page types and URL patterns
  WHEN: Inventory script runs against the index/listing pages for both sources
  THEN: `urls.jsonl` exists for each source. MR route-detail count in [300, 1000]. BBR route-detail count in [3500, 5500]. No rows have null page_type.

  VERIFY (MR): `PYTHONPATH=$(pwd) .venv/bin/python -c "import json; rows=[json.loads(l) for l in open('.spec/prds/curation-hardening/crawl-plans/motorcycleroads/urls.jsonl')]; details=[r for r in rows if r['page_type']=='PT-02-route-detail']; assert 300 <= len(details) <= 1000, len(details); print(f'MR inventory PASS: {len(details)} route details')"`
  VERIFY (BBR): `PYTHONPATH=$(pwd) .venv/bin/python -c "import json; rows=[json.loads(l) for l in open('.spec/prds/curation-hardening/crawl-plans/bestbikingroads/urls.jsonl')]; details=[r for r in rows if r['page_type']=='PT-02-route-detail']; assert 3500 <= len(details) <= 5500, len(details); print(f'BBR inventory PASS: {len(details)} route details')"`

AC-4: Phase 2 fixtures committed with manifest
  GIVEN: urls.jsonl from AC-3 has classified URLs
  WHEN: 3-5 fixtures per page type are downloaded and committed per source
  THEN: `fixtures/{source}/` contains directories per page type with ≥3 .html files, plus `fixtures.manifest.yaml` recording URL, fetched_at, sha256, and expected field values (at least `route_name` and `state`)

  VERIFY: `PYTHONPATH=$(pwd) .venv/bin/python -c "
import os, yaml
for s in ['motorcycleroads','bestbikingroads']:
    base = f'fixtures/{s}'
    assert os.path.isdir(base), f'missing {base}'
    m = yaml.safe_load(open(f'{base}/fixtures.manifest.yaml'))
    for pt, items in m.items():
        assert len(items) >= 3, f'{s}/{pt} has {len(items)} fixtures'
        for it in items:
            assert os.path.isfile(f'{base}/{pt}/{it[\"file\"]}')
            assert 'expected' in it and 'route_name' in it['expected']
print('fixtures PASS')"`

AC-5: Phase 3 selectors.yaml committed with fixture_yield 5/5 on required fields
  GIVEN: Fixtures from AC-4 exist
  WHEN: Selectors are derived (LLM-assisted per protocol) and validated against all fixtures of each page type
  THEN: `selectors.yaml` exists for each source; every field with `required: true` has `fixture_yield` equal to the total fixture count for that page type (e.g., 5/5, not 3/5)

  VERIFY: `PYTHONPATH=$(pwd) .venv/bin/python -c "
import yaml
for s in ['motorcycleroads','bestbikingroads']:
    sel = yaml.safe_load(open(f'.spec/prds/curation-hardening/crawl-plans/{s}/selectors.yaml'))
    for pt, fields in sel.items():
        for fname, fdef in fields.items():
            if fdef.get('required'):
                y = fdef.get('fixture_yield','0/0')
                n,d = map(int, y.split('/'))
                assert n==d and n>0, f'{s}/{pt}/{fname} required but yield {y}'
print('selectors PASS')"`

AC-6: Phase 4 fixture tests pass for both sources
  GIVEN: selectors.yaml from AC-5 and fixtures from AC-4
  WHEN: pytest runs the fixture test files
  THEN: Both test files exit 0 (all assertions pass)

  VERIFY: `PYTHONPATH=$(pwd) .venv/bin/python -m pytest scripts/curation/tests/sources/test_motorcycleroads_fixtures.py scripts/curation/tests/sources/test_bestbikingroads_fixtures.py -v`

AC-7: Phase 5 execution replaces staging files with ≥90% inventory yield
  GIVEN: Fixture tests passing from AC-6
  WHEN: The new executor runs against both committed urls.jsonl inventories
  THEN: Both staging files exist with row counts ≥90% of their inventory size; both have `.audit.json` sibling files with non-zero `fetched` and `parse_success`; `schema_validation_fail` < 5% of attempts

  VERIFY: `PYTHONPATH=$(pwd) .venv/bin/python -c "
import json, os
for s in ['motorcycleroads','bestbikingroads']:
    staging = f'staging/{s}.jsonl'
    audit = f'staging/{s}.jsonl.audit.json'
    assert os.path.isfile(staging) and os.path.isfile(audit)
    a = json.load(open(audit))
    assert a.get('fetched',0) > 0 and a.get('parse_success',0) > 0
    inv_count = sum(1 for _ in open(f'.spec/prds/curation-hardening/crawl-plans/{s}/urls.jsonl'))
    staged = sum(1 for _ in open(staging))
    yield_pct = staged / inv_count
    assert yield_pct >= 0.90, f'{s} yield {yield_pct:.1%}'
print('execution PASS')"`

AC-8: Phase 6 crawl-report.md committed with verdict PASS for both sources
  GIVEN: Execution complete from AC-7 with audit counters
  WHEN: crawl-report.md is written for each source using the protocol template
  THEN: Both files exist with verdict PASS, required-field yield table, and all 5 landmarks marked FOUND

  VERIFY: `for s in motorcycleroads bestbikingroads; do f=".spec/prds/curation-hardening/crawl-plans/$s/crawl-report.md"; grep -qE "^\*\*?Verdict:\*\*? PASS" "$f" && grep -q "Tail of the Dragon" "$f" && grep -q "Million Dollar" "$f" || { echo "FAIL: $f"; exit 1; }; done && echo "crawl reports PASS"`

AC-9: Epic 2 review.md verdict upgraded from PASS WITH ISSUES to PASS
  GIVEN: New clean baseline regenerated from AC-7 staging files
  WHEN: review.md is rewritten
  THEN: The verdict line is exactly "PASS" (not "PASS WITH ISSUES", not "FAIL")

  VERIFY: `grep -E "^(\*\*)?Verdict:(\*\*)?" .spec/prds/curation-hardening/tasks/epic-02-baseline-pipeline-validation/review.md | grep -vq "WITH ISSUES" && grep -E "^(\*\*)?Verdict:(\*\*)?" .spec/prds/curation-hardening/tasks/epic-02-baseline-pipeline-validation/review.md | grep -q "PASS" && echo "verdict upgraded PASS"`

AC-10: All 5 landmarks present in regenerated baseline catalog
  GIVEN: Clean staging files from AC-7 and regenerated baseline
  WHEN: The catalog and staging files are searched for landmark names
  THEN: Tail of the Dragon, Million Dollar Highway, Blue Ridge Parkway, Beartooth Highway, Pacific Coast Highway each appear at least once (FHWA, MR, or BBR — cross-source dedup is Epic 6, not this task)

  VERIFY: `PYTHONPATH=$(pwd) .venv/bin/python -c "
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
print('landmarks PASS')"`

Quality Criteria:
- [ ] All 10 ACs verified
- [ ] All seven protocol phases executed and documented
- [ ] Verdict is PASS (not PASS WITH ISSUES)
- [ ] Framework code is generic — not BBR/MR-specific
- [ ] No commits use `--no-verify`

--------------------------------------------------------------------------------
TEST CRITERIA (Boolean Verification)
--------------------------------------------------------------------------------

| # | Boolean Statement | Maps To AC | Status |
|---|-------------------|------------|--------|
| 1 | crawl_plan framework modules importable | AC-1 | [ ] TRUE [ ] FALSE |
| 2 | site-map.md committed for both sources with page types + traps | AC-2 | [ ] TRUE [ ] FALSE |
| 3 | urls.jsonl row counts within expected ranges | AC-3 | [ ] TRUE [ ] FALSE |
| 4 | fixtures committed with ≥3 per page type + manifest.expected | AC-4 | [ ] TRUE [ ] FALSE |
| 5 | selectors.yaml fixture_yield 5/5 on required fields | AC-5 | [ ] TRUE [ ] FALSE |
| 6 | Fixture pytest tests pass for both sources | AC-6 | [ ] TRUE [ ] FALSE |
| 7 | Staging yield ≥90% of inventory for both sources | AC-7 | [ ] TRUE [ ] FALSE |
| 8 | crawl-report.md verdict PASS for both sources + landmarks FOUND | AC-8 | [ ] TRUE [ ] FALSE |
| 9 | Epic 2 review.md verdict upgraded to PASS | AC-9 | [ ] TRUE [ ] FALSE |
| 10 | All 5 landmarks present in regenerated catalog | AC-10 | [ ] TRUE [ ] FALSE |

--------------------------------------------------------------------------------
READING LIST
--------------------------------------------------------------------------------

1. .spec/prds/curation-hardening/tasks/CRAWL-PLAN-PROTOCOL.md
   - Lines: ALL
   - Focus: Seven-phase methodology, Form A (HTML scraper) deliverables, per-phase gate rules, tool recommendations

2. .spec/prds/curation-hardening/tasks/CURATION-REVIEW-PROTOCOL.md
   - Lines: ALL
   - Focus: Step 1 (upgraded to require passing crawl plan reports), verdict rules, review.md template

3. .spec/prds/curation-hardening/tasks/epic-02-baseline-pipeline-validation/review.md
   - Lines: ALL
   - Focus: The "PASS WITH ISSUES" verdict this task replaces; MR 30 routes, BBR 413 routes, Alabama sidebar contamination

4. .spec/prds/curation-hardening/tasks/epic-02-baseline-pipeline-validation/baseline-report.md
   - Lines: 133-211 (Community Scrapers section)
   - Focus: All MR and BBR PASS WITH ISSUES symptoms being remediated

5. .spec/prds/curation-hardening/tasks/epic-02-baseline-pipeline-validation/DECISIONS.md
   - Lines: ALL (especially the 2026-04-13 Crawl Plan Protocol adoption entry)
   - Focus: Why the protocol exists, why BASE-009 is the first application

6. scripts/curation/pipeline/sources/motorcycleroads.py
   - Lines: 112-250
   - Focus: The blind-selector pattern being replaced. Do NOT copy these selectors — derive new ones in Phase 3 against committed fixtures

7. scripts/curation/pipeline/sources/bestbikingroads.py
   - Lines: ALL
   - Focus: Same failure pattern as MR; same replacement strategy

8. scripts/curation/pipeline/sources/base_scraper.py
   - Lines: ALL
   - Focus: Rate limiting, robots.txt check, JSONL writing primitives — KEEP these; only replace discovery and extraction logic

--------------------------------------------------------------------------------
GUARDRAILS
--------------------------------------------------------------------------------

WRITE-ALLOWED:
- scripts/curation/pipeline/sources/crawl_plan/ — NEW framework module (inventory, selectors, parser, executor + __init__)
- scripts/curation/pipeline/sources/motorcycleroads.py — REWRITE as thin glue (load inventory, call executor)
- scripts/curation/pipeline/sources/bestbikingroads.py — REWRITE same way
- .spec/prds/curation-hardening/crawl-plans/motorcycleroads/ — NEW directory: site-map.md, urls.jsonl, selectors.yaml, crawl-report.md
- .spec/prds/curation-hardening/crawl-plans/bestbikingroads/ — NEW directory: same four files
- fixtures/motorcycleroads/ — NEW directory with page-type subfolders, HTML files, fixtures.manifest.yaml
- fixtures/bestbikingroads/ — NEW directory with same structure
- scripts/curation/tests/sources/test_crawl_plan_framework.py — NEW unit tests for the framework
- scripts/curation/tests/sources/test_motorcycleroads_fixtures.py — NEW Phase 4 contract tests
- scripts/curation/tests/sources/test_bestbikingroads_fixtures.py — NEW Phase 4 contract tests
- scripts/curation/tests/sources/conftest.py — NEW or UPDATE (fixture loader helper)
- .spec/prds/curation-hardening/tasks/epic-02-baseline-pipeline-validation/review.md — REGENERATE
- .spec/prds/curation-hardening/tasks/epic-02-baseline-pipeline-validation/baseline-report.md — UPDATE (Community Scrapers section only)
- .spec/prds/curation-hardening/tasks/epic-02-baseline-pipeline-validation/baseline/*.json — REGENERATE (source_counts.json, scores.json, archetype_counts.json) and baseline/catalog.jsonl

WRITE-PROHIBITED:
- convex/** — no schema changes in Epic 2 remediation
- BASE-000.md through BASE-008.md — frozen prior tasks
- CRAWL-PLAN-PROTOCOL.md — treated as constitution for the duration of this task
- Any commit using `--no-verify` or bypass flags
- Any rewrite of git history (no rebase, no amend of prior commits)

MUST:
- [ ] Phases run sequentially with committed artifacts at each gate
- [ ] Phase 4 fixture tests pass locally before Phase 5 execution begins
- [ ] Phase 5 executor respects existing rate limit discipline from base_scraper.py
- [ ] Phase 6 audit counters written for every source
- [ ] Dry-run Convex push still succeeds after baseline regeneration

MUST NOT:
- [ ] Skip fixture collection (Phase 2) — the discipline dies here
- [ ] Run execution without committed Phase 3 selectors
- [ ] Commit a "PASS WITH ISSUES" verdict in the regenerated review.md — escalate instead
- [ ] Reintroduce the Alabama-stamped Blue Ridge Parkway bug (fixture test must assert `record.state == fixture.expected.state`)

--------------------------------------------------------------------------------
CODE PATTERN (Reference)
--------------------------------------------------------------------------------

Pattern: crawl_plan framework skeleton

```python
# scripts/curation/pipeline/sources/crawl_plan/__init__.py
from .inventory import InventoryRow, canonicalize, classify, discover
from .selectors import SelectorMap, load_selectors, validate_against_fixtures
from .parser import parse_with_selectors, SchemaViolation
from .executor import run_crawl, AuditCounters
```

```python
# scripts/curation/pipeline/sources/crawl_plan/inventory.py
"""Phase 1 — frozen, deduplicated, canonical URL inventory per page type."""

import json, re
from dataclasses import dataclass, asdict
from datetime import datetime, timezone
from urllib.parse import urlparse, urlunparse


@dataclass
class InventoryRow:
    page_type: str
    url: str
    canonical_url: str
    discovered_from: str
    first_seen: str


def canonicalize(url: str) -> str:
    p = urlparse(url.lower().strip())
    path = p.path.rstrip('/')
    return urlunparse((p.scheme, p.netloc, path, '', '', ''))


def classify(url: str, patterns: dict[str, str]) -> str | None:
    for pt, regex in patterns.items():
        if re.search(regex, url):
            return pt
    return None


def discover(seed_urls: list[str], patterns: dict[str, str], fetch_fn, link_selector: str) -> list[InventoryRow]:
    """Shallow crawl seeds; extract links; classify; canonicalize; dedupe; return rows."""
    seen: dict[str, InventoryRow] = {}
    now = datetime.now(timezone.utc).isoformat()
    for seed in seed_urls:
        html = fetch_fn(seed)
        # Extract links via link_selector (selectolax)
        for href in extract_links(html, link_selector):
            canon = canonicalize(href)
            if canon in seen:
                continue
            pt = classify(canon, patterns)
            if pt is None:
                continue  # reject; log separately
            seen[canon] = InventoryRow(
                page_type=pt, url=href, canonical_url=canon,
                discovered_from=seed, first_seen=now,
            )
    return sorted(seen.values(), key=lambda r: r.canonical_url)
```

```python
# scripts/curation/pipeline/sources/crawl_plan/parser.py
"""Phase 3+5 — selector-driven parser. Fail-closed on required-field nulls."""

import re
from typing import Any
from selectolax.parser import HTMLParser


class SchemaViolation(Exception):
    pass


def parse_with_selectors(html: str, selectors: dict, url: str) -> dict:
    tree = HTMLParser(html)
    record: dict[str, Any] = {'source_url': url}
    for field, spec in selectors.items():
        value = _extract_field(tree, url, spec)
        if spec.get('required') and value is None:
            raise SchemaViolation(f'{field} required but None at {url}')
        record[field] = value
    return record


def _extract_field(tree, url: str, spec: dict):
    if 'derived' in spec and spec['derived'] == 'url_regex':
        m = re.search(spec['regex'], url)
        if not m:
            return None
        raw = m.group(1)
        if spec.get('mapper') == 'slug_to_state':
            return raw.replace('-', ' ').title()
        return raw
    if 'selector' in spec:
        node = tree.css_first(spec['selector'])
        if node is None:
            return None
        if 'attr' in spec:
            raw = node.attributes.get(spec['attr'])
        else:
            raw = node.text(strip=True)
        if raw is None:
            return None
        if 'regex' in spec:
            m = re.search(spec['regex'], raw)
            raw = m.group(1) if m else None
            if raw is None:
                return None
        if spec.get('parse_as') == 'float':
            try:
                v = float(raw)
            except ValueError:
                return None
            if 'bounds' in spec:
                lo, hi = spec['bounds']
                if not (lo <= v <= hi):
                    return None
            return v
        return raw
    return None
```

```python
# scripts/curation/tests/sources/test_motorcycleroads_fixtures.py
"""Phase 4 — offline parser contract tests against committed fixtures."""

from pathlib import Path
import pytest, yaml
from scripts.curation.pipeline.sources.crawl_plan.parser import parse_with_selectors

FIXTURES_DIR = Path('fixtures/motorcycleroads')
SELECTORS = yaml.safe_load(
    open('.spec/prds/curation-hardening/crawl-plans/motorcycleroads/selectors.yaml')
)
MANIFEST = yaml.safe_load(open(FIXTURES_DIR / 'fixtures.manifest.yaml'))


def _fixtures():
    for pt, items in MANIFEST.items():
        for it in items:
            yield (pt, it)


@pytest.mark.parametrize('page_type,fixture', list(_fixtures()))
def test_fixture_parses_with_expected_fields(page_type, fixture):
    html = (FIXTURES_DIR / page_type / fixture['file']).read_text()
    record = parse_with_selectors(html, SELECTORS[page_type], fixture['url'])

    expected = fixture.get('expected', {})
    if 'route_name' in expected:
        assert record['route_name'], f"{fixture['file']}: route_name missing"
    if 'state' in expected:
        assert record['state'] == expected['state'], \
            f"{fixture['file']}: expected {expected['state']}, got {record['state']}"

    for field, spec in SELECTORS[page_type].items():
        if spec.get('required'):
            assert record[field] is not None, \
                f"{fixture['file']}: required field {field} is None"
```

**Pattern source:** [CRAWL-PLAN-PROTOCOL.md](../CRAWL-PLAN-PROTOCOL.md) — Form A HTML scraper deliverables, Phase 3 selector spec format, Phase 4 fixture-based contract tests.

**Anti-pattern:** Do NOT use `soup.select("a[href*='/motorcycle-roads/']")` or any other blind-grab selector. Do NOT declare any field `required: true` without 5/5 fixture yield. Do NOT run Phase 5 execution until the Phase 4 pytest suite is committed and green.

--------------------------------------------------------------------------------
AGENT INSTRUCTIONS (Phase-Driven Flow)
--------------------------------------------------------------------------------

AGENT: python-implement

## EXECUTION

### Phase 0 — RECON (manual, ~30-60 min per source)
  DO: Open each site in a browser. Identify distinct page templates. Click through from index → state listing → route detail → cluster → top-10 curated. Observe sidebars, pagination, and related-routes rails.
  WRITE: `.spec/prds/curation-hardening/crawl-plans/{source}/site-map.md` with page type taxonomy (PT-01..PT-NN), URL patterns, transition graph, 3-5 sample URLs per type, and known traps section.
  GATE: AC-2 verify passes. Commit site-map.md before continuing.

### Phase 1 — INVENTORY (~1 hour)
  DO: Build `crawl_plan.inventory.discover()` (AC-1 framework). Run against state listing pages for each source (MR: 50 states, BBR: 50 states + top-level index).
  DO: Canonicalize every URL, classify by Phase 0 patterns, reject unclassified links (log reject-rate), dedupe by canonical_url.
  WRITE: `crawl-plans/{source}/urls.jsonl`
  COMMIT: inventory files + framework inventory.py
  GATE: AC-3 verify commands pass for both sources.
  ESCALATE: If reject rate > 10%, STOP — Phase 0 is incomplete. Return to Phase 0, add missing page types, re-run.

### Phase 2 — FIXTURES (~30-60 min per source)
  DO: Download 3-5 real pages per page type. Use real named routes for PT-02 (Tail of the Dragon, Blue Ridge Parkway, Beartooth, Pacific Coast, Million Dollar) so landmark assertions have something to bite on.
  WRITE: `fixtures/{source}/{PT-NN}/*.html` + `fixtures/{source}/fixtures.manifest.yaml` with source URL, fetched_at, sha256, expected values for route_name + state (at minimum).
  COMMIT: HTML files + manifest (~50-200KB per file × ~30 files ≈ few MB per source)
  GATE: AC-4 verify passes.

### Phase 3 — SELECTOR SPEC (~1 hour, LLM-assisted)
  DO: For each page type, pass one fixture HTML to Firecrawl `/extract` OR GLM-4.7-flash with a structured-output prompt listing target fields. Collect proposed selectors with confidence scores.
  DO: Validate each proposed selector across ALL fixtures for that page type using a small harness. Record `fixture_yield: N/M` per field.
  DO: For any `required: true` field with yield < M/M, refine the selector OR mark the field `required: false` in selectors.yaml.
  WRITE: `crawl-plans/{source}/selectors.yaml`
  COMMIT: selectors.yaml + framework selectors.py
  GATE: AC-5 verify passes.

### Phase 4 — DRY-RUN PARSE (~1-2 hours, fast iteration)
  DO: Write `test_{source}_fixtures.py` per the code pattern above. Load fixtures + selectors + run parser. Assert required fields non-null, expected values match, types/bounds satisfied.
  DO: Write/update `test_crawl_plan_framework.py` for the framework modules (unit tests for canonicalize, classify, parse_with_selectors).
  DO: Run pytest. Iterate parser until all tests pass.
  BOY SCOUT: If you fix a bug in the parser, commit the fix separately so the test commit is clearly green.
  COMMIT: test files + parser.py (if not already)
  GATE: AC-6 pytest passes for both sources + framework tests.

### Phase 5 — EXECUTION (~3-4 hours serial, rate-limited)
  DO: Rewrite `motorcycleroads.py` and `bestbikingroads.py` as thin glue: load urls.jsonl → pass to executor → executor handles fetch + parse + schema check + write.
  DO: Run `python -m scripts.curation.pipeline.sources.motorcycleroads` (smaller, fast). Watch audit.json updates every 100 routes.
  DO: Run `python -m scripts.curation.pipeline.sources.bestbikingroads` (larger, ~3.75hr serial at 3s/page). Checkpoint via `.progress` file.
  HANDLE: schema_validation_fail → log + push to `needs_llm_fallback.jsonl`. If > 5% fail rate, STOP — the protocol assumption is wrong. Return to Phase 0/3.
  WRITE: `staging/{source}.jsonl`, `staging/{source}.jsonl.progress`, `staging/{source}.jsonl.audit.json`
  GATE: AC-7 verify passes (both yields ≥ 90%).

### Phase 6 — ACCOUNTING + BASELINE REGENERATION (~30-60 min)
  DO: Write `crawl-plans/{source}/crawl-report.md` using the protocol template: counters, required-field yield table, landmark presence check, verdict PASS.
  DO: Re-run the existing downstream Epic 2 pipeline stages against the NEW staging files:
    - BASE-003 extraction: `python -m scripts.curation.pipeline.extraction.client --sample 20 --count 20 --out baseline/catalog.jsonl`
    - BASE-004 scoring: `python -m scripts.curation.pipeline.scoring.composite --input baseline/catalog.jsonl --out baseline/scores.json --count 20`
    - BASE-005 classification: `python -m scripts.curation.pipeline.classification.archetype --routes baseline/catalog.jsonl --scores baseline/scores.json --out baseline/archetype_counts.json --count 20`
  DO: Regenerate `baseline/source_counts.json` from new wc-l counts.
  DO: Update `baseline-report.md` Community Scrapers section with new counts and yields.
  DO: Rewrite `review.md` with verdict PASS. Remove the PASS WITH ISSUES rationale block.
  DO: Single commit containing all regenerated artifacts + crawl plan artifacts + framework code + tests + parser rewrites.
  GATE: AC-8, AC-9, AC-10 verify commands pass.

--------------------------------------------------------------------------------
ORCHESTRATOR VERIFICATION PROTOCOL
--------------------------------------------------------------------------------

AFTER Phase 0: run AC-2 verify → expect "site-map PASS"
AFTER Phase 1: run AC-3 MR verify AND AC-3 BBR verify → expect both PASS
AFTER Phase 2: run AC-4 verify → expect "fixtures PASS"
AFTER Phase 3: run AC-5 verify → expect "selectors PASS"
AFTER Phase 4: run AC-6 pytest (both files) → expect exit 0
AFTER Phase 5: run AC-7 verify → expect "execution PASS"
AFTER Phase 6: run AC-8, AC-9, AC-10 verify commands → expect all PASS
FINALLY: run AC-1 verify → expect "ok"

If any gate fails: STOP. Do not skip ahead. Escalate to user with the full gate output. Preserve the working tree in its failing state — do not force-clean.

--------------------------------------------------------------------------------
AGENT ASSIGNMENT
--------------------------------------------------------------------------------

**Implementation Agent:** python-implement
**Rationale:** Pure Python work with framework build, pytest, rate-limited scraping, and existing pipeline integration. Matches the agent used for BASE-000..008.

**Review Agent:** python-review + code-reviewer
**Rationale:** python-review for code quality and TDD compliance on the framework module and fixture tests; code-reviewer for verifying the crawl plan artifacts are complete and the verdict upgrade is honest (not fabricated to satisfy the gate).

**Assignment Date:** 2026-04-13

--------------------------------------------------------------------------------
EVIDENCE GATES
--------------------------------------------------------------------------------

Gate 1: Framework importable (AC-1)
Gate 2: site-map.md committed for both sources (AC-2)
Gate 3: urls.jsonl row counts within expected ranges (AC-3)
Gate 4: Fixtures committed with expected field manifest (AC-4)
Gate 5: selectors.yaml fixture_yield 5/5 on required fields (AC-5)
Gate 6: Fixture pytest tests green for both sources (AC-6)
Gate 7: Staging yield ≥ 90% of inventory for both sources (AC-7)
Gate 8: crawl-report.md verdict PASS for both sources (AC-8)
Gate 9: review.md verdict upgraded to PASS (AC-9)
Gate 10: All 5 landmarks present in regenerated catalog (AC-10)

--------------------------------------------------------------------------------
REVIEW CRITERIA (for python-review + code-reviewer)
--------------------------------------------------------------------------------

TDD Quality:
- [ ] Phase 4 fixture tests committed BEFORE Phase 5 execution (verify via commit order)
- [ ] Framework has unit tests (not just integration tests via fixture-based tests)
- [ ] All 10 ACs verified

Code Quality:
- [ ] No blind selectors in selectors.yaml — every field is either validated via fixture_yield or marked `required: false`
- [ ] Parser raises SchemaViolation for required-field nulls (fail-closed — no silent nullability like Epic 2)
- [ ] Executor reuses rate limit + robots.txt + JSONL discipline from base_scraper.py (no regressions)
- [ ] No swallowed exceptions (no `except: pass` or `except Exception: continue` without counters)
- [ ] Executor supports resumable runs via `.progress` file

Domain-Specific:
- [ ] review.md verdict is honest (not fabricated to satisfy the gate)
- [ ] Alabama-stamped Blue Ridge Parkway / Beartooth Pass bug is NOT reintroduced — fixture test asserts `record.state == fixture.expected.state`
- [ ] URL canonicalization prevents sidebar contamination — Phase 1 collapses duplicate cross-state links
- [ ] All 5 landmarks present in regenerated baseline (AC-10)
- [ ] Framework is generic enough to support Epic 4 SRC-006 (Rider Mag) and Epic 9 RID-001 (ADVRider RSS) without modification — agent should articulate how it would extend to Form B/C/D

Review Verdict: [ ] APPROVED   [ ] NEEDS_FIXES

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends On:
- BASE-008 (committed Epic 2 baseline with PASS WITH ISSUES verdict — the baseline this task remediates)
- CRAWL-PLAN-PROTOCOL.md (the methodology — adopted 2026-04-13 in DECISIONS.md)

Blocks:
- INF-001 (Epic 3 Foundation start) — Epic 3 extends models against this clean baseline; extending against junk is the cascade failure this task prevents
- SRC-001, SRC-006 (Epic 4 new sources) — apply the same protocol using this task's framework; BASE-009 proves the pattern on a known-hard case
- RID-001, RID-002, RID-006 (Epic 9 community sources) — Forms C/D extend this framework; Form A must be battle-tested first

--------------------------------------------------------------------------------
TASK READINESS
--------------------------------------------------------------------------------

Prerequisites:
- [ ] BASE-008 committed (Epic 2 PASS WITH ISSUES baseline exists in git for audit)
- [ ] CRAWL-PLAN-PROTOCOL.md committed
- [ ] DECISIONS.md "Crawl Plan Protocol adoption" entry signed off by user

Can Execute In Parallel With: (none — serial Epic 2 remediation)

--------------------------------------------------------------------------------
NOTES
--------------------------------------------------------------------------------

- This is the FIRST application of CRAWL-PLAN-PROTOCOL.md. Implementation experience feeds back into the protocol as revision notes. If a phase gate or deliverable format proves awkward in practice, update the protocol doc in a separate commit and note it in the protocol's Revision History section.
- Estimated effort: 8-10 hours. Breakdown: Phase 0 (1hr per source × 2 = 2hr) + Phase 1 (1hr) + Phase 2 (1hr) + Phase 3 (1hr) + Phase 4 (1-2hr iteration) + Phase 5 (MR ~30min, BBR ~3.75hr serial at rate limit) + Phase 6 (30min-1hr). Phase 5 dominates the wall-clock time and is mostly unattended.
- The shared crawl_plan framework (AC-1) is generic. Epic 4 SRC-001 (Scenic Byways GIS) is Form B and extends it with a JSONPath selector adapter. Epic 4 SRC-006 (Rider Mag) is Form A and uses the framework as-is. Epic 9 RID-001 (ADVRider RSS) is Form C and extends it with an XML/feedparser adapter. All four forms share the same seven-phase shape and same gate structure.
- If the honest Phase 6 verdict is FAIL on either source, ESCALATE to user. A fabricated PASS verdict is worse than the original PASS WITH ISSUES.
- The previous PASS WITH ISSUES baseline commit must remain in git history for audit. Create a new commit that overwrites files in place — do NOT rebase or amend.
- Commit discipline per CLAUDE.md: pre-commit hooks must pass, no `--no-verify`, no bypass flags. If a hook fails, fix the underlying cause and create a new commit.

--------------------------------------------------------------------------------
APPROVAL
--------------------------------------------------------------------------------

Approved By: [pending]
Date: [pending]

================================================================================
