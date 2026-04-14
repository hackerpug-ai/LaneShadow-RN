"""BestBikingRoads.com thin glue — Crawl Plan Protocol Phase 5 (BASE-009b)."""

from __future__ import annotations

import logging
import random
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

INVENTORY_PATH = Path(".spec/prds/curation-hardening/crawl-plans/bestbikingroads/urls.jsonl")
SELECTORS_PATH = Path(".spec/prds/curation-hardening/crawl-plans/bestbikingroads/selectors.yaml")
OUTPUT_PATH = Path("staging/bestbikingroads.jsonl")
PROGRESS_PATH = Path("staging/bestbikingroads.jsonl.progress")
PAGE_TYPE_FILTER = "PT-03-route-detail"
MIN_DELAY, MAX_DELAY = 3.0, 4.0
USER_AGENTS = [
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
]
_ua_cycle = 0
_last_request_time: float = 0.0


def _next_ua() -> str:
    global _ua_cycle
    ua = USER_AGENTS[_ua_cycle % len(USER_AGENTS)]
    _ua_cycle += 1
    return ua


def fetch_url(url: str) -> str:
    global _last_request_time
    elapsed = time.monotonic() - _last_request_time
    delay = random.uniform(MIN_DELAY, MAX_DELAY)
    if elapsed < delay:
        time.sleep(delay - elapsed)
    r = httpx.get(url, headers={"User-Agent": _next_ua()}, timeout=30, follow_redirects=True)
    _last_request_time = time.monotonic()
    r.raise_for_status()
    return r.text


def _bbr_extras(html: str, url: str) -> dict:
    sm = re.search(r"/motorcycle-roads/united-states/([a-z-]+)/ride/", url)
    state_primary = sm.group(1) if sm else None
    hm = re.search(r'Star Rating Graphic[^(]*\((\d+\.?\d*)\)', html)
    rv = float(hm.group(1)) if hm else None
    rating = rv if (rv is not None and 0.0 <= rv <= 5.0) else None
    dm = re.search(r"(\d+)\s*kms", html)
    distance_km = int(dm.group(1)) if dm else None
    pm = re.search(r'<p>([^<]{50,}?)</p>', html, re.DOTALL)
    description = pm.group(1).strip() if pm else None
    return {
        "state_primary": state_primary,
        "source_url": url,
        "rating": rating,
        "distance_km": distance_km,
        "description": description,
    }


def parse_route_detail(html: str, url: str) -> dict:
    extras = _bbr_extras(html, url)
    record = parse_with_selectors(
        html=html,
        selector_map=_selector_map,
        page_type=PAGE_TYPE_FILTER,
        url=url,
        url_derived_fields=extras,
    )
    record.update({k: extras[k] for k in ("rating", "distance_km", "description")})
    record.setdefault("source", "bestbikingroads")
    return record


_selector_map = None


def main() -> None:
    """Run the BestBikingRoads crawl."""
    global _selector_map
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
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
        counters["fetched"], counters["skipped_resume"],
        counters["parse_success"], counters["schema_validation_fail"], counters["http_error"],
    )


if __name__ == "__main__":
    main()
