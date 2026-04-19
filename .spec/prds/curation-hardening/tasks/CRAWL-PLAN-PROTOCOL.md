# Crawl Plan Protocol

**Purpose:** Every task that extracts data from a remote source (web scraper, paginated API, RSS feed, GIS query, forum crawl) MUST produce a **crawl plan artifact** before running at scale. The plan is committed to the repo. Running extraction at scale without a committed crawl plan is prohibited.

**Companion protocol:** [`CURATION-REVIEW-PROTOCOL.md`](./CURATION-REVIEW-PROTOCOL.md) is the *post-pipeline* gate — it runs after extraction completes. This protocol is the *pre-extraction* gate — it prevents junk from entering the pipeline in the first place. They are non-overlapping and both mandatory.

**Governing principle:** *A crawl plan is an artifact, not a script.* Each phase produces committable files that the next phase can run against **offline, in seconds**, with no network and no rate limit risk. You cannot enter phase N+1 until phase N's artifact is committed and its gate has been passed.

---

## Why This Protocol Exists (Epic 2 Retrospective)

Epic 2's BBR and MR scrapers produced a "PASS WITH ISSUES" verdict for clear and preventable reasons:

| Failure in Epic 2 | Root cause | Phase that would have caught it |
|---|---|---|
| MR yielded 30 routes vs. >50 expected; BBR yielded 413 vs. ~4,100 expected | No URL inventory; discovery and fetch interleaved in one pass | Phase 1 (Inventory) |
| "Blue Ridge Parkway" and "Beartooth Pass" stamped as Alabama routes | Sidebar cross-state links pulled in as route links, then labeled with the current listing page's state | Phase 3 (Selector Spec) + Phase 4 (Dry-Run Parse) |
| `rating: 0.0` on nearly all MR routes | Blind guessing at selectors (`.field-field-rating`, `[class*='rating']`) with no validation against a real page | Phase 3 (Selector Spec) |
| "State from listing page" bug patched *after* running at scale (commit `facb67b`) | No fixture-based unit tests catching the bug offline | Phase 4 (Dry-Run Parse) |
| "PASS WITH ISSUES" verdict allowed to stand | No accountability contract for fetched/parsed/schema-fail counters | Phase 6 (Accounting) |
| Cannot diff against a truth file to detect coverage gaps | No committed inventory to diff against | Phase 1 (Inventory) |

Every one of these is a phase gate that would have caught the problem **before** spending 3.75 hours scraping and committing junk. This protocol institutionalizes those gates.

---

## When to Apply (Decision Rubric)

**Apply this protocol when ANY are true:**
- Task fetches ≥10 pages from a website
- Task navigates from an index/listing page to detail pages
- Task uses selectors (CSS/XPath/DOM walking) to extract structured fields
- Task pages through a paginated API without a known fixed endpoint count
- Task ingests an RSS feed across multiple forums/subreddits
- Task filters a structured GIS feature layer into a project-specific schema
- Task extracts data from an HTML table, editorial list, or curated web page

**Do NOT apply when:**
- Task consumes a committed static file (e.g., `data/fhwa_byways.csv` produced by Epic 2 BASE-000)
- Task consumes pre-computed output from an external tool (e.g., Epic 4 SRC-004 `adamfranco/curvature` output file)
- Task is a one-time hand-curated import (≤10 records you can visually verify)
- Task is a single-endpoint API call with a documented schema (e.g., `/v1/route/{id}` with OpenAPI spec)

If you are unsure, **apply the protocol**. The cost of an unneeded plan at small scale is an hour; the cost of a missed plan at large scale is a committed junk baseline and days of firefighting.

---

## The Seven Phases

Phases run strictly sequentially. A task that "combines" phases or skips a gate is in violation of this protocol and cannot be merged. Each phase's gate is binary: pass or stop.

### Phase 0 — RECON (manual, ~30 min per source, zero code)

**Goal:** understand what page/endpoint types exist before writing one line of extraction.

**Deliverable:** `{source}/site-map.md` — committed markdown document with:
- **Page type taxonomy.** List each distinct page template with an ID (`PT-01`, `PT-02`, …). For BBR this might be: country index, state listing, cluster index, route detail, top-10 curated editorial. For Reddit: subreddit listing, comment thread, user profile.
- **URL/endpoint pattern per page type.** Concrete regex or template, e.g., `PT-03 route detail: https://www.bestbikingroads.com/motorcycle-roads/united-states/{state-slug}/ride/{route-slug}`.
- **Transition graph.** How you get from one page type to another. Which links on PT-02 lead to PT-03? Which do NOT (sidebar, nav, pagination, related-rail)?
- **Sample URLs per page type, 3-5 per type.** The exact URLs you will download in Phase 2.
- **Known traps.** Free-form list. Examples: "PT-03's sidebar lists cross-state routes — do not treat as inbound from current state", "PT-04 top-10 curated pages have different DOM and should be skipped", "RSS feed returns XML 2.0 but forum N returns RSS 1.0 with different item schema".
- **Scope decisions.** Explicit in/out-of-scope per page type with a reason.

**Tooling:** Browser + `curl` + your eyes. **Do not automate recon.** Automating Phase 0 is how Epic 2 produced junk.

**Gate:** You can write one-sentence answers to all of these without guessing:
- How many distinct page types exist in scope?
- What URL pattern identifies each?
- Which page types have links to which other page types?
- What are the known traps you must defend against?

If any answer is "I'm not sure", you stay in Phase 0.

---

### Phase 1 — INVENTORY (shallow crawl, committed artifact)

**Goal:** produce a frozen, deduplicated, canonical URL list per page type. Detail pages are **not** fetched in this phase — only index/listing pages.

**Deliverable:** `{source}/urls.jsonl` — committed JSONL, one row per discovered URL:

```json
{"page_type": "PT-03-route-detail", "url": "https://www.bestbikingroads.com/motorcycle-roads/united-states/california/ride/highway-1", "canonical_url": "https://www.bestbikingroads.com/motorcycle-roads/united-states/california/ride/highway-1", "discovered_from": "https://www.bestbikingroads.com/motorcycle-roads/united-states/california/", "first_seen": "2026-04-13T15:22:03Z"}
```

**What the inventory script does:**
1. Fetch every index/listing page from Phase 0 (e.g., 50 state pages for BBR)
2. Extract every link matching a Phase 0 URL pattern
3. Classify each link by `page_type` using the declared patterns
4. Reject anything that doesn't match a known pattern. **Log the reject with its source page.** If you see >10 rejects per source page, either you missed a page type in Phase 0 or the site changed — stop and return to Phase 0.
5. **Canonicalize URLs.** Strip query strings, lowercase host, normalize trailing slash, resolve relative paths. This is where cross-state duplicate sidebar links collapse to a single canonical URL.
6. Dedupe by `canonical_url`.
7. Write `urls.jsonl` sorted by `canonical_url`. Commit it.

**Why this is the single most important phase:** The inventory is the truth file everything else diffs against. For a ~4,500-page crawl it is your checkpoint: if execution crashes at hour 2, you resume by subtracting already-completed URLs from the inventory, not by re-running discovery. **Dedup lives in this phase, not in the crawler.** Epic 2's MR sidebar contamination is trivially impossible once canonicalization happens here.

**Gate:**
1. Row counts per `page_type` are within your Phase 0 expected range (for BBR: ~4,000–4,500 route-detail URLs, not 30, not 50,000)
2. Every row has a non-null `page_type`
3. Zero rejected-pattern rate, OR rejects are all accounted for (e.g., intentional out-of-scope PT-04 editorial pages)
4. `urls.jsonl` is committed to git

If inventory yields an unexpected count (too small or too large), **investigate the discovery logic before fetching any detail page**. A 10% miss at inventory time becomes a 10% miss at scale.

---

### Phase 2 — FIXTURES (download samples, commit HTML)

**Goal:** capture 3–5 real HTML (or API response) samples per page type and commit them to the repo. This is what kills blind selectors.

**Deliverable:**

```
fixtures/{source}/
├── PT-01-state-listing/
│   ├── alabama.html
│   ├── california.html
│   └── texas.html
├── PT-02-route-detail/
│   ├── tail-of-the-dragon.html
│   ├── beartooth-highway.html
│   ├── blue-ridge-parkway.html
│   ├── pacific-coast-highway.html
│   └── million-dollar-highway.html
└── fixtures.manifest.yaml
```

`fixtures.manifest.yaml` records the source URL, fetch timestamp, expected values for key fields (used as assertions in Phase 4), and a checksum:

```yaml
PT-02-route-detail:
  - file: tail-of-the-dragon.html
    url: https://www.bestbikingroads.com/.../tail-of-the-dragon
    fetched_at: 2026-04-13T15:30:01Z
    sha256: abc123...
    expected:
      route_name: "Tail of the Dragon"
      state: "North Carolina"   # caught by Phase 4 assertion
      rating_min: 4.5
      has_description: true
  - file: blue-ridge-parkway.html
    ...
```

**Why commit fixtures:** they pin the schema the selectors assume. They enable offline iteration in seconds. They enable CI checks that catch selector drift when the site changes.

Fixture size: ~50–200 KB per file, ~5 files per page type, ~2–5 page types per source → ~2–5 MB per source. Acceptable for git. For larger-than-threshold sources, use `git-lfs` or a dedicated `fixtures-archive` directory with a README pointing to a canonical URL.

**Gate:**
1. ≥3 fixtures per page type (5 preferred)
2. Every fixture is a real-world page — not a 503, not a Cloudflare challenge, not an empty body
3. `fixtures.manifest.yaml` has `expected:` entries for at least the "required" fields (see Phase 3)
4. Fixtures and manifest committed

---

### Phase 3 — SELECTOR SPEC (AI earns its cost here)

**Goal:** produce a deterministic selector map for each page type, validated against the Phase 2 fixtures.

**Deliverable:** `{source}/selectors.yaml`

```yaml
PT-02-route-detail:
  route_name:
    selector: "h1.route-title"
    required: true
    fixture_yield: 5/5

  description:
    selector: ".field-field-description .field-content"
    required: false
    fixture_yield: 4/5   # one route has no description (the 5/5 rule is relaxed only for nullable fields)

  rating:
    selector: ".rating_meter_img"
    attr: "alt"
    regex: "(\\d+\\.?\\d*)"
    parse_as: "float"
    bounds: [0.0, 5.0]
    required: false
    fixture_yield: 3/5

  state:
    derived: "url_regex"
    regex: "/motorcycle-roads/united-states/([a-z-]+)/ride/"
    mapper: "slug_to_state"
    required: true
    fixture_yield: 5/5
```

**This is the ONE phase where AI extraction (Firecrawl `/extract`, GLM-4.7-flash, or a direct LLM call) is cost-effective.** The workflow:

1. Pass one fixture HTML + the target field names to an LLM with a structured-output prompt:
   > Given this HTML, identify CSS selectors for: `route_name`, `description`, `rating`, `distance_mi`, `start_location`, `end_location`. For each, return the selector and a confidence score. For fields not present, return null.
2. Collect the proposed selector map
3. Validate the map across **all 3–5 fixtures** for that page type using a tiny harness (`run_selectors_against_fixtures.py`)
4. Record `fixture_yield` per field (e.g., `4/5` means the selector works on 4 of 5 fixtures)
5. For `required: true` fields, **fixture_yield MUST be 5/5** or you stop, investigate, and refine

**AI cost:** ~30 fixture calls per source at ~10K tokens each = $0.10–$0.30 total. Zero cost for execution.

**Gate:**
1. Every `required: true` field has fixture_yield 5/5 across all fixtures for that page type
2. `selectors.yaml` is committed
3. Nullable fields have explicit `required: false` marking — silent nullability is forbidden (it's how Epic 2's scoring landed at neutral 0.5 for everything)

---

### Phase 4 — DRY-RUN PARSE (offline pytest, the bug killer)

**Goal:** prove the parser yields valid records against the fixtures before touching the network.

**Deliverable:** a pytest module at `scripts/curation/tests/sources/test_{source}_fixtures.py`

```python
def test_parse_route_detail_yields_required_fields():
    for fixture in load_fixtures("bestbikingroads", "PT-02-route-detail"):
        record = parse(fixture.html, url=fixture.url)
        # Required fields populated
        assert record.route_name, f"{fixture.file}: route_name missing"
        # Expected values from fixtures.manifest.yaml
        assert record.state == fixture.expected.state, \
            f"{fixture.file}: expected {fixture.expected.state}, got {record.state}"
        # Type and bounds
        assert isinstance(record.rating, (float, type(None)))
        if record.rating is not None:
            assert 0.0 <= record.rating <= 5.0
        # Cross-field coherence
        assert record.source_url == fixture.url
        assert record.state in US_STATES
```

**Runs in under one second.** You iterate on the parser until every assertion passes. This is where Epic 2's "Alabama routes for Blue Ridge Parkway" bug dies: the assertion `record.state == fixture.expected.state` catches it in milliseconds, offline, without touching a single live URL.

**What it proves:**
- Every fixture parses successfully → the selectors are not blind
- Every required field is non-null → no silent nullability
- Every field passes type/bounds checks → no `rating: 0.0` landing as a valid float
- Every `state`, `source_url`, and other cross-field invariant holds → no sidebar contamination
- Schema evolution is CI-gated → if a future change breaks the parser, CI flags it before merge

**Gate:**
1. All fixture tests pass locally
2. Tests are runnable via `pytest scripts/curation/tests/sources/test_{source}_fixtures.py`
3. Tests are wired into the project's CI (or the path is documented for manual CI add)
4. The test file is committed

---

### Phase 5 — EXECUTION (boring, auditable, resumable)

**Goal:** fetch every URL in the committed inventory, parse it with the validated selectors, write records to staging. Fetch + parse + write. That's it.

**Deliverable:**
- `staging/{source}.jsonl` (gitignored runtime output)
- `staging/{source}.jsonl.progress` (gitignored resume file: set of already-completed canonical URLs)
- `staging/{source}.jsonl.audit.json` (committed at the end; counters, not data)

**What the executor does:**
1. Load `{source}/urls.jsonl` from Phase 1 — **does zero discovery at runtime**
2. Load `staging/{source}.jsonl.progress` and subtract already-completed URLs (resumability)
3. For each remaining URL:
   - Respect robots.txt and rate limits (keep existing `base_scraper.py` discipline)
   - Fetch; on 5xx, retry with exponential backoff; on 4xx, log and move on
   - Parse with the validated selectors from Phase 3
   - Run the parser through the same schema check as Phase 4
   - On success: append record to `{source}.jsonl`, append URL to `.progress`
   - On failure: increment the appropriate counter, optionally push to a `needs_llm_fallback.jsonl` queue
4. Write counters to `.audit.json` every N records (default: 100)

**NO extraction logic lives in this phase.** If the parser finds a page that doesn't match the fixtures, that is either (a) a new template you missed in Phase 0 — stop and return to Phase 0 for that one page type, or (b) a legitimate one-off anomaly you log in the audit and move on from.

**Optional AI fallback:** pages that fail schema validation during execution can be queued for one-shot LLM extraction via Firecrawl `/extract` at the end of the run. Budget ceiling: 5% of pages, ~$20 max for a 4,500-page crawl. Record fallback records separately with a `extraction_method: "llm_fallback"` flag so downstream consumers know their provenance.

**Gate:**
1. Run completes without unhandled crashes
2. Resumable: killing and restarting the executor produces identical output to a clean run (modulo ordering)
3. `audit.json` is written on every run, including partial runs

---

### Phase 6 — ACCOUNTING (the verdict, not a guess)

**Goal:** produce a committable report that makes "PASS WITH ISSUES" impossible as a verdict.

**Deliverable:** `{source}/crawl-report.md` — committed markdown:

```markdown
# BestBikingRoads Crawl Report

**Date:** 2026-04-13
**Inventory snapshot:** urls.jsonl sha256:abc123
**Parser commit:** git:def456
**Runtime:** 3h 42m

## Counters
| Counter | Value | % of inventory |
|---|---|---|
| Inventory size | 4,312 | 100.0% |
| Fetched 2xx | 4,287 | 99.4% |
| Fetched 4xx (dead link) | 7 | 0.2% |
| Fetched 5xx (retry exhausted) | 18 | 0.4% |
| Parse success | 4,287 | 100.0% (of fetched) |
| Schema validation pass | 4,287 | 100.0% (of parsed) |
| LLM fallback triggered | 0 | 0.0% |
| Records written to staging | 4,287 | 99.4% (of inventory) |

## Required-field yield
| Field | Populated | Yield |
|---|---|---|
| route_name | 4,287 / 4,287 | 100.0% |
| state | 4,287 / 4,287 | 100.0% |
| source_url | 4,287 / 4,287 | 100.0% |
| description | 4,029 / 4,287 | 94.0% |
| rating | 3,812 / 4,287 | 88.9% |
| distance_mi | 2,104 / 4,287 | 49.1% (known sparse, nullable in schema) |

## Landmark presence check
- Tail of the Dragon: FOUND (once, state=North Carolina)
- Million Dollar Highway: FOUND (once, state=Colorado)
- Pacific Coast Highway: FOUND (once, state=California)
- Blue Ridge Parkway: FOUND (once, state=North Carolina / Virginia)
- Beartooth Highway: FOUND (once, state=Montana / Wyoming)

## Verdict: PASS
All gates met. No required-field nulls. All landmarks present in expected state.
```

**Gate rules for the verdict:**
- **PASS:** Fetched ≥95% of inventory AND parse-success ≥99% of fetched AND all required-field yields 100% AND all landmarks present
- **FAIL:** Any of the above violated. Cannot be softened to "PASS WITH ISSUES". If gates aren't met, the crawl plan or the site changed — investigate before committing.
- **PASS WITH NOTES** is intentionally absent from this protocol. The CURATION-REVIEW-PROTOCOL has a "PASS WITH ISSUES" verdict for downstream pipeline review; at the crawl level, it is a trap that produces junk baselines.

---

## Committed Artifact Layout

Each source under a shared conventional path:

```
.spec/prds/curation-hardening/crawl-plans/{source}/
├── site-map.md               # Phase 0
├── urls.jsonl                # Phase 1
├── selectors.yaml            # Phase 3
├── crawl-report.md           # Phase 6
└── README.md                 # one-liner pointing at the live scraper module

fixtures/{source}/            # Phase 2
├── PT-01-state-listing/*.html
├── PT-02-route-detail/*.html
└── fixtures.manifest.yaml

scripts/curation/pipeline/sources/
├── {source}.py               # thin glue — loads urls.jsonl, calls executor
└── crawl_plan/               # shared framework
    ├── __init__.py
    ├── inventory.py          # Phase 1 library
    ├── selectors.py          # Phase 3+4 library (loads yaml, validates against fixtures)
    ├── parser.py             # Phase 3 selector-driven parser
    └── executor.py           # Phase 5 runner (respectful, resumable, audited)

scripts/curation/tests/sources/
├── test_{source}_fixtures.py # Phase 4
└── conftest.py               # fixture loader helper

staging/                      # gitignored
├── {source}.jsonl
├── {source}.jsonl.progress
└── {source}.jsonl.audit.json
```

**What's committed:** site-map.md, urls.jsonl, selectors.yaml, crawl-report.md, fixtures/*.html, fixtures.manifest.yaml, parser code, fixture tests.

**What's gitignored:** staging/*.jsonl, staging/*.progress, audit.json (runtime artifacts; regenerate from committed inputs).

---

## Integration with the Curation Review Protocol

The two protocols are complementary and non-overlapping:

| | Crawl Plan Protocol | Curation Review Protocol |
|---|---|---|
| When | Before any extraction task runs | At the end of every epic, before marking Done |
| Scope | One source at a time | Entire pipeline, all sources |
| Gate | Per-phase binary gates | PASS / PASS WITH ISSUES / FAIL verdict |
| Artifact | site-map.md, urls.jsonl, selectors.yaml, fixtures/, crawl-report.md | review.md + baseline/*.json |
| Cadence | Once per source (per crawl) | Once per epic (every epic) |

**Integration point: Curation Review Protocol Step 1.** Currently Step 1 reads:

> Verify: each source produces a JSONL staging file with expected route count. Log discrepancies.

This is exactly the "PASS WITH ISSUES" trap Epic 2 fell into. Step 1 is upgraded to:

> **Verify:** For every source in scope at this epic, the source has a committed `crawl-plans/{source}/` directory with (a) `urls.jsonl` inventory, (b) `selectors.yaml` with fixture_yield 5/5 on all required fields, (c) a passing `test_{source}_fixtures.py` test file, and (d) a `crawl-report.md` with verdict PASS from the most recent run. If any of these are missing or failing, Step 1 FAILS and the review cannot proceed.

This tightening is non-negotiable for every epic that adds or modifies a source.

---

## Task Acceptance Criteria Template (for any task that crawls)

Any task that extracts data from a remote source MUST include these acceptance criteria:

```markdown
## Acceptance Criteria

### Crawl Plan Protocol (required for all extraction tasks)
- [ ] Phase 0: `crawl-plans/{source}/site-map.md` committed with ≥1 page type, URL patterns, transition graph, sample URLs, known traps
- [ ] Phase 1: `crawl-plans/{source}/urls.jsonl` committed with row count in expected range
- [ ] Phase 2: `fixtures/{source}/` committed with ≥3 fixtures per page type + `fixtures.manifest.yaml`
- [ ] Phase 3: `crawl-plans/{source}/selectors.yaml` committed; all `required: true` fields at fixture_yield 5/5
- [ ] Phase 4: `scripts/curation/tests/sources/test_{source}_fixtures.py` exists and passes locally
- [ ] Phase 5: Executor runs against committed `urls.jsonl`, produces resumable `staging/{source}.jsonl`, writes `audit.json`
- [ ] Phase 6: `crawl-plans/{source}/crawl-report.md` committed with verdict PASS (gates met: fetch ≥95%, parse ≥99%, all required-field yields 100%, all landmarks present)

### Source-specific criteria
- [ ] (task-specific ACs go below this line — schema, scoring, classification, etc.)
```

---

## Tool Recommendations

| Phase | Tool | Notes |
|---|---|---|
| 0 RECON | Browser + `curl` + eyes | **Do not automate recon.** Automating this is how Epic 2 produced junk. |
| 1 INVENTORY | `httpx` + `selectolax` (faster than BeautifulSoup) | Shallow crawl only, no rendering |
| 2 FIXTURES | `httpx` → `.html` files | Static pages; use Playwright only if a page type is confirmed JS-rendered |
| 3 SELECTOR SPEC | Firecrawl `/extract` OR z.ai GLM-4.7-flash (already in use in Epic 2) | One-shot per fixture, ~$0.30 per source |
| 4 DRY-RUN PARSE | `pytest` + committed fixture HTML | Offline, <1s |
| 5 EXECUTION | `httpx` + rate limiter + `selectolax` + resume file | Reuses existing `base_scraper.py` discipline |
| 6 ACCOUNTING | Python → markdown | No deps |

**On Playwright/JS rendering:** BBR, MR, FHWA, Rider Mag, Scenic Byways GIS, and the 17 ADVRider RSS feeds are all server-rendered or structured data — no JS rendering needed. Only switch to Playwright for one page type if Phase 0 recon confirms JS is required. Never render everything.

**On Firecrawl as a primary extraction tool:** Firecrawl is cost-effective for the Phase 3 selector-spec step (one call per fixture, ~30 calls per source). It is **not** cost-effective as the Phase 5 production extractor at ~4,500 pages — the rate limit on BBR is the binding constraint on runtime regardless of extractor, and LLM-per-page at scale costs $50–200 + introduces nondeterminism + wastes the selector work. Use Firecrawl for discovery/spec, use selectors for execution.

---

## Forms of This Protocol (per extraction modality)

The seven-phase shape stays the same; the *deliverables* differ slightly depending on what you're extracting.

### Form A — Web scraper (HTML pages)
The canonical form described above. Example sources: BBR, MR, Rider Magazine, editorial lists.

### Form B — Structured API (GIS, JSON, OpenAPI)
- Phase 0: "Page type" = endpoint. Document query parameters, pagination model, rate limit.
- Phase 1: Inventory = list of query URLs (e.g., one per state for a state-paginated API).
- Phase 2: Fixtures = cached JSON responses as `.json` files.
- Phase 3: Selectors = JSONPath / jq expressions in the same `selectors.yaml` format.
- Phase 4: Parser tests assert field types, bounds, enum membership against fixture JSON.
- Phase 5-6: Identical.
- Example: Epic 4 SRC-001 (Scenic Byways GIS from Koordinates).

### Form C — RSS / syndication feed
- Phase 0: Document each feed URL, feed format version, item schema, forum category.
- Phase 1: Inventory = list of feed URLs + last-fetched cursors.
- Phase 2: Fixtures = sample RSS XML responses per feed.
- Phase 3: Selectors = XPath/element names in `selectors.yaml`.
- Phase 4: Parser tests assert item structure per feed (ADVRider RSS 1.0 vs RSS 2.0 variants, for example).
- Phase 5-6: Identical, with idempotent last-fetched tracking per feed.
- Example: Sprint 9 RID-001 (ADVRider 17-forum RSS).

### Form D — Paginated authenticated API (Reddit, etc.)
- Phase 0: Document auth flow, rate limit, pagination cursor, endpoint schema.
- Phase 1: Inventory = first-pass list of subreddit endpoints + search queries (pagination cursor lives in the executor, not the inventory — but the initial query list is committed).
- Phase 2: Fixtures = sample JSON responses stored under each endpoint.
- Phase 3-6: Identical.
- Example: Sprint 9 RID-002 (Reddit OAuth2) and RID-006 (Pushshift backfill).

### Form E — Pre-computed file consumer
**Skip this protocol entirely.** The file is committed or referenced; there is no crawl. Examples: Epic 2 FHWA (after BASE-000 commits the CSV), Epic 4 SRC-004 (adamfranco/curvature pre-computed output).

---

## Failure Modes and Escape Hatches

### "The site changed between Phase 2 and Phase 5"
- The Phase 4 fixture tests still pass (fixtures are committed)
- Execution will fail schema validation on pages that changed
- `.audit.json` will show a spike in `schema_validation_fail`
- Stop, re-run Phase 0 for the affected page type, refresh fixtures, regenerate selectors, re-run tests, re-execute
- If the site changed structurally, this cycle takes ~30 min; it is not a restart of the whole protocol

### "A page type I missed in Phase 0 has real data"
- The inventory classifier will reject URLs that don't match known patterns
- If the reject rate > a sanity threshold per source, Phase 1 gate fails
- Return to Phase 0, add the new page type, re-run

### "The required field is sparse (e.g., only 60% of routes have ratings)"
- The field is mis-declared as `required: true`
- Phase 3's `fixture_yield` will show 3/5 or less
- Phase 3 gate fails → you must either find a better selector OR change the schema to mark the field `required: false`
- This is a feature, not a bug — it forces the task to be honest about what fields are actually extractable

### "I need to re-crawl six months later"
- The committed `urls.jsonl` may be stale
- Re-run Phase 1 against the current site, diff against the committed `urls.jsonl`, and append new URLs to a fresh inventory
- Fixtures are refreshed from a small sample to catch site structure drift
- Phase 4 tests catch drift automatically

### "A new one-off anomaly page breaks the parser"
- It increments `schema_validation_fail` in the audit
- Push to `needs_llm_fallback.jsonl`
- At end-of-run, optionally process the fallback queue with Firecrawl `/extract`
- If the fallback queue is >5% of inventory, the crawl plan is wrong — STOP and treat it as a site change

---

## Per-Epic Application Map

| Epic | Applies? | Why |
|---|---|---|
| Epic 1 (Week 0 Validation) | No | No scraping; validation spikes only |
| **Epic 2 (Baseline Validation)** | **Retroactively** | MR and BBR must be re-crawled under this protocol to replace the "PASS WITH ISSUES" baseline with a PASS baseline. FHWA via BASE-000 is Form E (pre-computed file) and is already exempt. |
| Epic 3 (Foundation Models/Schema) | No | Schema and model work; no crawling |
| **Epic 4 (New Sources)** | **Yes, mandatory** | SRC-001 Scenic Byways GIS (Form B), SRC-006 Rider Magazine 50 Best (Form A). SRC-004 curvature is Form E (exempt). |
| Sprint 6 (Dedup & Quality Floor) | No directly, but **the crawl plan's canonicalization-at-inventory step is the first dedup pass** and must be called out so Sprint 6 knows what's already been deduplicated |
| Sprint 7 (Quality & Data Reports) | No directly, but **the `audit.json` counters from Phase 6 are a feedstock** for Sprint 7's data quality report |
| Sprint 8 (Scoring & Calibration) | No | But depends on Epic 4 Rider Mag ground truth. If Rider Mag is crawled sloppily, calibration is poisoned. This protocol is what protects Sprint 8 from that upstream risk. |
| **Sprint 9 (Community Ingestion)** | **Yes, mandatory** | RID-001 ADVRider (Form C), RID-002 Reddit (Form D), RID-006 Pushshift (Form D with historical backfill wrinkle) |
| Sprint 10 (NLP & Signal Merge) | No | NLP runs against committed staging; no crawling |
| Sprint 11 (Mobile UI) | No | Consumer side only |
| Sprint 12 (Orchestrator) | No directly, but **the orchestrator uses `urls.jsonl` inventories** as its fan-out unit and reads `audit.json` as its success gate. The protocol's artifacts are orchestrator inputs. |

---

## Open Questions (resolve before first use)

1. **Does Epic 2 get a retroactive re-crawl, or is the BBR/MR junk baseline left in place with a pointer to "known issue, resolved in Epic 4"?** Author recommendation: retroactive re-crawl via a new Epic 2.5 or as a prerequisite task in Epic 4, because downstream epics (Sprint 6 dedup, Sprint 8 calibration) diff against Epic 2's baseline and will inherit the junk.
2. **Where do fixtures live when they exceed the git-lfs threshold?** Currently assumed to stay in-repo (~2-5 MB per source). If a single source exceeds ~50 MB of fixtures, we need a `fixtures-archive/` convention with a README.
3. **Is CI wired to run `pytest scripts/curation/tests/sources/` on every PR?** If not, fixture tests are only as good as the author remembering to run them locally. Recommend wiring this into the existing test command early.
4. **Is there a budget and approval for Firecrawl API calls in Phase 3?** Estimated total across all sources in the initiative: ~$1–3. Trivial, but should be explicitly approved in the technical-requirements doc.

---

## Revision History

| Date | Change | Trigger |
|---|---|---|
| 2026-04-13 | Initial draft | Epic 2 BBR/MR "PASS WITH ISSUES" verdict triggered a protocol-level response after recognizing that sloppy ad-hoc crawling is a repeatable failure mode across all remaining source tasks. Protocol codifies the fix before Epic 4 (3 new sources), Sprint 9 (3 new community sources) compound the problem. |
| 2026-04-13 (evening) | Cross-cutting framework rules from first Phase 0 recon | BASE-009 split into BASE-009a + BASE-009b. Phase 0 recon on MR (by parallel `general-purpose` subagents) surfaced two framework-wide rules that apply to every future source task, not just MR/BBR: (1) **Multi-state record schema.** Source records that can span multiple states (Natchez Trace Parkway AL/MS/TN, Blue Ridge Parkway NC/VA, Pacific Coast Highway OR/WA/CA, etc.) MUST use `state_primary` (URL-derived, always populated) + `states_all` (DOM-parsed list, at least 1 entry matching `state_primary`). Phase 4 fixture tests assert `expected.state in record.states_all` (list membership), NOT `record.state == expected.state` (string equality). (2) **Preserve path case in canonicalize().** Lowercase scheme + host only; path/query/fragment retain case. BBR's mixed-case slugs (e.g. `Columbia-2`) are distinct routes and lowercasing the path would collapse them. Both rules documented in detail in `epic-02-baseline-pipeline-validation/DECISIONS.md` "Phase 0 recon findings" sub-section and are mandatory in BASE-009a's CROSS-CUTTING RULES section. Epic 4 SRC-001/006 and Sprint 9 RID-001/002/006 inherit both rules. Agent-driven recon with explicit briefs + human review gate proved viable in this first application — the "do not automate recon" guidance in the "When to Apply" section should be softened in a future protocol revision to "automate only with explicit traps and a human review gate". |
| 2026-04-14 (morning) | Operational anti-patterns from first retroactive Phase 5 execution | Two rules elevated to protocol-level after the MR + BBR overnight runs exposed them. **(1) Never edit framework/parser source while a crawler process is live.** Python bytecode is snapshotted at import time; on-disk edits to a module the running process already imported do not hot-reload. MR Phase 5 run #1 silently produced 590 records with 0% description rate because a parser fix was committed while the crawler was running — the running process kept using the pre-commit bytecode. Protocol rule: **kill → fix → restart**, never edit-in-flight. **(2) Long-running crawlers MUST be dispatched with process lifetime independent of the dispatching session.** Either `nohup ... & disown` from inside a shell, or the orchestrator launching with `run_in_background=true` directly, or a systemd/launchd supervisor. Subagent-dispatched bash child processes die when the subagent session ends — BBR Phase 5 stopped at 50 routes with no log entry because the python-implement agent session terminated and the crawler was its child process. Detailed root-cause analysis and recovery actions in `epic-02-baseline-pipeline-validation/DECISIONS.md` sub-sections 3c (module cache) and 3d (session death). Gate recalibration for BBR from `[3500, 5500]` to `[3100, 3400]` (see DECISIONS.md sub-section 3a) is task-level calibration and does NOT elevate to protocol-level — each future source will have its own measured range. BBR `states_all = [state_primary]` single-element design (DECISIONS.md 3b) is a source-specific exemption from the 2026-04-13 evening multi-state rule, not a retraction of the rule — the rule still applies wherever a source has authoritative multi-state evidence. |
