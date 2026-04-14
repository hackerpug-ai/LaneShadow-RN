"""MotorcycleRoads.com thin glue layer for the Crawl Plan Protocol.

This file is <= 100 non-comment lines and contains no CSS selectors,
no BS4 soup calls, and no URL patterns.  All discovery, parsing,
and execution logic lives in the crawl_plan framework.

Crawl Plan Protocol: Phase 5 — EXECUTION (Form A, HTML scraper)

Usage:
    python -m scripts.curation.pipeline.sources.motorcycleroads
"""

from __future__ import annotations

import logging
import re
import time
from pathlib import Path

import httpx

from scripts.curation.pipeline.sources.crawl_plan import (
    load_selectors,
    parse_with_selectors,
    run_crawl,
)

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

INVENTORY_PATH = Path(".spec/prds/curation-hardening/crawl-plans/motorcycleroads/urls.jsonl")
SELECTORS_PATH = Path(".spec/prds/curation-hardening/crawl-plans/motorcycleroads/selectors.yaml")
OUTPUT_PATH = Path("staging/motorcycleroads.jsonl")
PROGRESS_PATH = Path("staging/motorcycleroads.jsonl.progress")
PAGE_TYPE_FILTER = "PT-03-route-detail"

# Rate limiting (matches base_scraper.py discipline; robots.txt has no Crawl-delay)
MIN_DELAY = 2.0
MAX_DELAY = 4.0
USER_AGENTS = [
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
]
_ua_cycle = 0


def _next_ua() -> str:
    global _ua_cycle
    ua = USER_AGENTS[_ua_cycle % len(USER_AGENTS)]
    _ua_cycle += 1
    return ua


_last_request_time: float = 0.0


def fetch_url(url: str) -> str:
    """Fetch a URL with rate limiting.  Raises on HTTP error."""
    global _last_request_time
    import random

    elapsed = time.monotonic() - _last_request_time
    delay = random.uniform(MIN_DELAY, MAX_DELAY)
    if elapsed < delay:
        time.sleep(delay - elapsed)

    headers = {"User-Agent": _next_ua()}
    response = httpx.get(url, headers=headers, timeout=30, follow_redirects=True)
    _last_request_time = time.monotonic()

    response.raise_for_status()
    return response.text


def parse_route_detail(html: str, url: str) -> dict:
    """Parse a PT-03 route detail page using the selector map."""
    m = re.search(r"/motorcycle-roads/([a-z-]+)/", url)
    state_primary = m.group(1) if m else None
    return parse_with_selectors(
        html=html,
        selector_map=_selector_map,
        page_type=PAGE_TYPE_FILTER,
        url=url,
        url_derived_fields={"state_primary": state_primary},
    )


_selector_map = None  # loaded at run time


def main() -> None:
    """Run the MotorcycleRoads crawl."""
    global _selector_map
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(name)s: %(message)s",
    )
    logger.info("Loading selectors from %s", SELECTORS_PATH)
    _selector_map = load_selectors(str(SELECTORS_PATH))

    logger.info("Starting crawl: inventory=%s output=%s", INVENTORY_PATH, OUTPUT_PATH)
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)

    counters = run_crawl(
        inventory_path=str(INVENTORY_PATH),
        output_path=str(OUTPUT_PATH),
        fetch_fn=fetch_url,
        parse_fn=parse_route_detail,
        page_type_filter=PAGE_TYPE_FILTER,
        resume_path=str(PROGRESS_PATH),
    )

    logger.info(
        "Crawl complete: fetched=%d skipped=%d parse_success=%d fail=%d http_err=%d",
        counters["fetched"],
        counters["skipped_resume"],
        counters["parse_success"],
        counters["schema_validation_fail"],
        counters["http_error"],
    )


if __name__ == "__main__":
    main()
