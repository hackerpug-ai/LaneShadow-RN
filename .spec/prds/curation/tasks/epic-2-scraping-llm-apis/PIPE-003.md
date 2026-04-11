# PIPE-003: Community Site Scrapers

**Task ID:** PIPE-003
**Epic:** Epic 2 - Web Scraping, LLM Extraction & Public APIs
**Assigned To:** general-purpose
**Priority:** P0
**Effort:** L
**Estimate:** 360 min
**Type:** [FEATURE]
**Status:** Backlog

---

## DEPENDENCIES

- **Depends on:** PIPE-001 (Python pipeline project setup + directory scaffold)
- **Blocks:** PIPE-004 (LLM extraction with Haiku + Instructor)

---

## BACKGROUND

The curation pipeline needs community-sourced motorcycle route data from two primary sites: motorcycleroads.com and bestbikingroads.com. These sites collectively contain 17,976+ routes that form the long-tail of our catalog beyond the FHWA seed data (184 routes). The scrapers must be polite (rate-limited, robots.txt-aware), resilient (resumable JSONL writes, crash recovery), and produce structured output that feeds directly into the LLM extraction stage (PIPE-004).

**PRD References:**
- S2.2 (Phase 2: Web Scraping)
- S3-INGEST (UC-INGEST-02, UC-INGEST-03)
- S9-TRD-2 (LLM Extraction Layer) — scrapers feed the extraction input
- S10-TRD-1.2 (Directory Structure) — scripts/curation/pipeline/sources/

**Key Constraints (from Pipeline Principles):**
- P2: Routes enter only from verifiable sources. Every row must have `source_url`.
- P4: N/A (no LLM in this task)
- P5: N/A (no LLM output to parse here, but JSONL schema is deterministic)

---

## ACCEPTANCE CRITERIA

### AC-001: motorcycleroads.com Scraper
**GIVEN** the motorcycleroads.com scraper is configured for a target state
**WHEN** the scraper runs
**THEN** it extracts name, state, description, rating, and source_url for each route
**AND** it paginates through all state pages correctly
**AND** output is written as structured JSONL with one JSON object per line
**AND** each row contains a `source_url` field linking to the original page

**Verify:** Run scraper for a single state (e.g., "Tennessee"), inspect JSONL output for correct fields and valid URLs.

### AC-002: bestbikingroads.com Scraper
**GIVEN** the bestbikingroads.com scraper is configured
**WHEN** the scraper runs against the site (17,976 routes)
**THEN** it extracts route name, location, description, rating, and source_url
**AND** it handles the site's pagination/listing structure
**AND** output is written as structured JSONL compatible with the motorcycleroads format

**Verify:** Run scraper for a limited subset (first 50 routes), verify JSONL output structure matches expected schema.

### AC-003: Rate Limiting Enforcement
**GIVEN** either scraper is running
**WHEN** HTTP requests are made to the target domain
**THEN** a minimum delay of 2 seconds and maximum of 4 seconds (randomized) is enforced between requests
**AND** no more than 20 requests per minute are sent to any single domain
**AND** the scraper respects robots.txt directives for the target site

**Verify:** Run scraper with request logging enabled, verify inter-request delays and per-minute rate.

### AC-004: Playwright Fallback for JS-Rendered Pages
**GIVEN** a page returns content that BeautifulSoup cannot parse (JS-rendered content)
**WHEN** the scraper detects empty or malformed HTML from httpx
**THEN** it falls back to Playwright to render the page
**AND** the Playwright-rendered content is parsed correctly
**AND** the fallback is logged for monitoring

**Verify:** Identify a JS-heavy page on either site, verify Playwright fallback activates and produces valid output.

### AC-005: Resumable JSONL Writes
**GIVEN** the scraper has partially written a JSONL file and is interrupted
**WHEN** the scraper is restarted
**THEN** it reads the existing JSONL file to determine which routes have already been scraped
**AND** it resumes from the next unscraped route
**AND** no duplicate entries appear in the final output

**Verify:** Start scraper, kill it mid-run, restart it, verify it picks up where it left off with no duplicates.

---

## TEST CRITERIA

- [ ] motorcycleroads scraper produces valid JSONL with name/state/description/rating/source_url
- [ ] bestbikingroads scraper produces valid JSONL with compatible schema
- [ ] Rate limiting enforces 2-4 second delays between requests
- [ ] Maximum 20 requests per minute per domain is respected
- [ ] robots.txt is checked before scraping begins
- [ ] Playwright fallback activates for JS-rendered pages
- [ ] JSONL writes are resumable after interruption
- [ ] No duplicate entries in output files after resume
- [ ] Rotating User-Agent strings are used across requests
- [ ] Each JSONL row has a `source_url` field (P2 compliance)
- [ ] Unit tests pass: `cd scripts/curation && python -m pytest tests/test_scrapers.py`

---

## READING LIST

- `.spec/prds/curation/09-technical-requirements.md` — Pipeline Principles (P2, P5), Web Scraper component spec
- `.spec/prds/curation/10-trd-detail.md` — Section 1.2 (Directory Structure), Section 1.3 (Scraping Strategy)
- `.spec/prds/curation/README.md` — Phase 2 implementation plan
- httpx documentation: https://www.python-httpx.org
- BeautifulSoup documentation: https://www.crummy.com/software/BeautifulSoup/bs4/doc/
- Playwright Python: https://playwright.dev/python/

---

## GUARDRAILS

**WRITE-ALLOWED FILES:**
- `scripts/curation/pipeline/sources/__init__.py` (NEW)
- `scripts/curation/pipeline/sources/motorcycleroads.py` (NEW)
- `scripts/curation/pipeline/sources/bestbikingroads.py` (NEW)
- `scripts/curation/pipeline/sources/base_scraper.py` (NEW)
- `scripts/curation/pipeline/sources/robots_checker.py` (NEW)
- `scripts/curation/tests/test_scrapers.py` (NEW)
- `scripts/curation/requirements.txt` (MODIFY — add httpx, beautifulsoup4, playwright)

**NEVER MODIFY:**
- `convex/` — this is a Python pipeline task, no Convex code changes
- Any file outside `scripts/curation/`
- Existing `scripts/curation/pipeline/sources/fhwa.py` (PIPE-002 artifact)

---

## CODE PATTERN

**Base Scraper Class:**
```python
class BaseScraper(ABC):
    def __init__(self, source_name: str, output_dir: Path):
        self.source_name = source_name
        self.output_dir = output_dir
        self.rate_limiter = RateLimiter(min_delay=2.0, max_delay=4.0, max_per_minute=20)
        self.ua_rotator = UserAgentRotator()
        self.session = httpx.AsyncClient(timeout=30.0)
        self.playwright: Playwright | None = None

    async def fetch(self, url: str) -> str:
        await self.rate_limiter.wait()
        headers = {"User-Agent": self.ua_rotator.next()}
        response = await self.session.get(url, headers=headers)
        html = response.text
        if self._is_js_rendered(html):
            html = await self._fetch_with_playwright(url)
        return html

    @abstractmethod
    async def scrape(self) -> AsyncIterator[dict]:
        ...

    def write_jsonl(self, record: dict) -> None:
        with jsonlines.open(self.output_dir / f"{self.source_name}.jsonl", "a") as f:
            f.write(record)
```

**JSONL Record Schema (output of scrapers):**
```python
{
    "name": str,
    "state": str | None,
    "description": str | None,
    "rating": float | None,
    "source_url": str,           # REQUIRED — P2 compliance
    "source": str,               # "motorcycleroads" | "bestbikingroads"
    "scraped_at": int,           # unix timestamp
    "raw_html_path": str | None, # path to archived HTML (optional, NOT stored in output)
}
```

**Rate Limiter:**
```python
class RateLimiter:
    def __init__(self, min_delay: float, max_delay: float, max_per_minute: int):
        self.min_delay = min_delay
        self.max_delay = max_delay
        self.max_per_minute = max_per_minute
        self.request_times: list[float] = []

    async def wait(self) -> None:
        now = time.monotonic()
        # Enforce max_per_minute
        recent = [t for t in self.request_times if now - t < 60]
        if len(recent) >= self.max_per_minute:
            sleep_until = recent[0] + 60
            await asyncio.sleep(sleep_until - now)
        # Enforce min/max delay
        delay = random.uniform(self.min_delay, self.max_delay)
        await asyncio.sleep(delay)
        self.request_times.append(time.monotonic())
```

---

## AGENT INSTRUCTIONS

1. Read `scripts/curation/pipeline/` to understand existing scaffold from PIPE-001
2. Check robots.txt for both motorcycleroads.com and bestbikingroads.com before implementing scrapers
3. Create `base_scraper.py` with shared rate limiting, UA rotation, Playwright fallback, and resumable JSONL writing
4. Implement `motorcycleroads.py` — state-paginated scraping with name/state/description/rating/source_url extraction
5. Implement `bestbikingroads.py` — route listing pagination with same field extraction
6. Create `robots_checker.py` — utility to fetch and parse robots.txt before scraping
7. Write comprehensive tests in `tests/test_scrapers.py` — mock HTTP responses, verify JSONL output, test rate limiting, test resume logic
8. Verify all tests pass: `cd scripts/curation && python -m pytest tests/test_scrapers.py -v`
9. Do NOT store full HTML in JSONL output — only structured fields + source_url

---

## ORCHESTRATOR VERIFICATION PROTOCOL

1. **Pre-dispatch:** Verify PIPE-001 task is complete (check for `scripts/curation/pipeline/` directory scaffold)
2. **Post-completion verification:**
   ```bash
   # Verify files exist
   ls scripts/curation/pipeline/sources/motorcycleroads.py
   ls scripts/curation/pipeline/sources/bestbikingroads.py
   ls scripts/curation/pipeline/sources/base_scraper.py

   # Run tests
   cd scripts/curation && python -m pytest tests/test_scrapers.py -v

   # Verify no full HTML stored in JSONL (spot check)
   head -1 scripts/curation/output/motorcycleroads.jsonl | python -m json.tool
   ```
3. **Evidence gate:** All tests pass, JSONL files have correct schema, no HTML blobs in output

---

## AGENT ASSIGNMENT

**Primary:** general-purpose
**Rationale:** This is a Python web scraping task, not Convex or React Native. The general-purpose agent handles httpx/BeautifulSoup/Playwright best.

---

## EVIDENCE GATES

- [ ] Both scraper files exist and import without error
- [ ] Unit tests pass with >80% coverage on scraper modules
- [ ] JSONL output contains `source_url` on every row (P2 compliance)
- [ ] Rate limiting verified via test (mock time assertions)
- [ ] Resumable write verified via test (interrupt + resume scenario)
- [ ] robots.txt checker exists and is called before scraping

---

## REVIEW CRITERIA

- Code follows existing `scripts/curation/pipeline/` patterns from PIPE-001
- Rate limiting is enforced at the base class level (not per-scraper)
- JSONL schema is consistent across both scrapers
- Playwright is lazy-loaded (only imported when needed)
- Error handling covers HTTP errors, timeouts, and malformed HTML
- Logging provides visibility into scraping progress

---

## NOTES

- **motorcycleroads.com** is state-paginated: iterate through US states, scrape each state's route listing
- **bestbikingroads.com** has 17,976 routes: the scraper must handle large-volume pagination efficiently
- **Rotating User-Agent:** Use a pool of 10+ common browser UA strings, rotate randomly per request
- **Resumable writes:** Each JSONL line is a complete JSON object. On resume, read existing lines to build a set of already-scraped URLs, skip those during the new run
- **robots.txt:** Store the parsed robots.txt result for the session; re-check at most once per session (not per request)
- **Full HTML storage is explicitly forbidden** — only structured fields + source_url in JSONL output. Raw HTML may optionally be saved to a separate archive directory for debugging but must not appear in the pipeline JSONL
