"""MR Phase 1 inventory runner — one-shot script for BASE-009a.

Fetches all PT-01 paginated master-index pages from MotorcycleRoads.com,
extracts route-detail links, classifies them, deduplicates by canonical_url,
and writes the result to:

    .spec/prds/curation-hardening/crawl-plans/motorcycleroads/urls.jsonl

This is the Phase 1 (INVENTORY) step per the Crawl Plan Protocol.  The script
delegates all framework logic to the generic ``crawl_plan`` module; all
MR-specific patterns are passed as parameters, not hardcoded into the module.

Rate-limiting: 2.0-4.0s random delay between requests (matches base_scraper.py).

Usage (from repo root):
    PYTHONPATH=$(pwd) scripts/curation/.venv/bin/python \
        scripts/curation/pipeline/sources/crawl_plan/mr_inventory_runner.py
"""

from __future__ import annotations

import json
import logging
import random
import re
import time
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urljoin

import httpx
from bs4 import BeautifulSoup

from scripts.curation.pipeline.sources.crawl_plan.inventory import (
    InventoryRow,
    canonicalize,
    classify,
    discover,
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

BASE_URL = "https://www.motorcycleroads.com"
MASTER_INDEX_URL = f"{BASE_URL}/motorcycle-rides-in/united-states"
OUTPUT_PATH = Path(
    ".spec/prds/curation-hardening/crawl-plans/motorcycleroads/urls.jsonl"
)

# Rate limiting: 2.0-4.0 seconds, matching base_scraper.py discipline
MIN_DELAY = 2.0
MAX_DELAY = 4.0

# Page-type patterns (derived from site-map.md, generic framework call)
# PT-03: exactly 2 path segments after /motorcycle-roads/
# First segment = state slug [a-z-]+, second = route slug [a-z0-9-]+
PT03_PATTERN = r"https://www\.motorcycleroads\.com/motorcycle-roads/[a-z-]+/[a-z0-9-]+$"
PATTERNS: list[tuple[str, str]] = [
    (PT03_PATTERN, "PT-03-route-detail"),
]

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
]

# ---------------------------------------------------------------------------
# HTTP fetch with rate limiting
# ---------------------------------------------------------------------------

_http = httpx.Client(timeout=30.0, follow_redirects=True)
_last_fetch_time: float = 0.0


def fetch(url: str) -> str:
    """Fetch URL with rate limiting and UA rotation."""
    global _last_fetch_time
    elapsed = time.monotonic() - _last_fetch_time
    delay = random.uniform(MIN_DELAY, MAX_DELAY)
    if elapsed < delay:
        sleep_for = delay - elapsed
        log.debug("Rate limit: sleeping %.2fs", sleep_for)
        time.sleep(sleep_for)
    headers = {"User-Agent": random.choice(USER_AGENTS)}
    response = _http.get(url, headers=headers)
    _last_fetch_time = time.monotonic()
    response.raise_for_status()
    return response.text


# ---------------------------------------------------------------------------
# Link extractor for MR master-index pages
# ---------------------------------------------------------------------------

def extract_route_links(html: str, source_url: str) -> list[str]:
    """Extract candidate route links from an MR master-index page.

    Returns absolute URLs.  The framework's discover() handles canonicalization
    and classification; we only extract raw hrefs here.

    Traps handled:
    - T-05: Global rails (/motorcycle-roads/ links) are extracted but the
      classifier will accept only the 2-segment pattern (PT-03).
    - T-06: "Read Road Guide" / "More" link text — we extract by href, not text.
    - T-07: "No Results Found" — the caller checks for empty results to detect
      end of pagination.
    """
    soup = BeautifulSoup(html, "html.parser")
    links: list[str] = []
    for a in soup.find_all("a", href=True):
        href = a["href"]
        # Only consider links that could be route details
        if "/motorcycle-roads/" not in href:
            continue
        # Resolve relative URLs
        absolute = urljoin(BASE_URL, href)
        # Strip query string eagerly (pagination noise in href, not the URL itself)
        absolute = absolute.split("?")[0]
        links.append(absolute)
    return links


def is_empty_page(html: str) -> bool:
    """Return True if the page has the 'No Results Found' sentinel (T-07)."""
    return "No Results Found" in html or "no results" in html.lower()


# ---------------------------------------------------------------------------
# Enumerate all master-index pagination URLs
# ---------------------------------------------------------------------------

def build_index_urls(max_pages: int = 200) -> list[str]:
    """Build the list of master-index page URLs to crawl.

    We detect end-of-pagination dynamically (T-07 sentinel) rather than
    hardcoding 103 pages, because the route count grows over time.

    The list starts at page 0 (no query string) and increments until we
    hit "No Results Found" or reach max_pages.  We return the full list
    immediately so discover() can iterate it.

    For the runner, we probe pages dynamically in the main loop rather than
    pre-building the list, so this helper just pre-generates the candidate URLs.
    We stop early in run().
    """
    urls = [MASTER_INDEX_URL]  # page=0 (no query string)
    for i in range(1, max_pages):
        urls.append(f"{MASTER_INDEX_URL}?page={i}")
    return urls


# ---------------------------------------------------------------------------
# Main runner
# ---------------------------------------------------------------------------

def run() -> list[InventoryRow]:
    """Run Phase 1 inventory: fetch all master-index pages, return InventoryRows."""
    rows: list[InventoryRow] = []
    seen_canonical: set[str] = set()
    reject_log: list[dict] = []
    page_num = 0
    empty_streak = 0
    max_empty = 2  # stop after 2 consecutive empty pages

    log.info("Phase 1 MR inventory started. Base URL: %s", MASTER_INDEX_URL)
    log.info("Rate limit: %.1f–%.1f s between requests", MIN_DELAY, MAX_DELAY)

    while True:
        if page_num == 0:
            url = MASTER_INDEX_URL
        else:
            url = f"{MASTER_INDEX_URL}?page={page_num}"

        log.info("Fetching page %d: %s", page_num, url)

        try:
            html = fetch(url)
        except httpx.HTTPStatusError as exc:
            log.error("HTTP error %d on %s — stopping pagination", exc.response.status_code, url)
            break
        except Exception as exc:
            log.error("Network error on %s: %s — stopping", url, exc)
            break

        # T-07: detect end of pagination
        if is_empty_page(html):
            empty_streak += 1
            log.info("Empty/no-results page at page %d (streak=%d)", page_num, empty_streak)
            if empty_streak >= max_empty:
                log.info("Stopping pagination after %d consecutive empty pages.", empty_streak)
                break
            page_num += 1
            continue
        else:
            empty_streak = 0

        # Extract links from this page
        raw_links = extract_route_links(html, url)
        page_new = 0

        for raw_url in raw_links:
            canon = canonicalize(raw_url)
            page_type = classify(canon, PATTERNS)

            if page_type is None:
                reject_log.append({"url": raw_url, "canonical_url": canon, "discovered_from": url})
                continue

            if canon in seen_canonical:
                continue

            seen_canonical.add(canon)
            row = InventoryRow(
                page_type=page_type,
                url=raw_url,
                canonical_url=canon,
                discovered_from=url,
                first_seen=datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
            )
            rows.append(row)
            page_new += 1

        log.info(
            "Page %d: %d links extracted, %d new route-details (total so far: %d)",
            page_num, len(raw_links), page_new, len(rows),
        )

        page_num += 1

        # Safety valve: if we've crawled 150 pages and found 0 routes, something is wrong
        if page_num > 150 and len(rows) == 0:
            log.error("STOP: 150+ pages crawled with 0 routes found — aborting.")
            break

    log.info("Inventory complete: %d route-detail rows, %d rejects", len(rows), len(reject_log))
    if reject_log:
        log.info("Top reject URLs (first 5):")
        for r in reject_log[:5]:
            log.info("  REJECT: %s", r["canonical_url"])

    return rows


def write_jsonl(rows: list[InventoryRow], output_path: Path) -> None:
    """Write sorted InventoryRows to urls.jsonl."""
    output_path.parent.mkdir(parents=True, exist_ok=True)
    sorted_rows = sorted(rows, key=lambda r: r.canonical_url)
    with open(output_path, "w", encoding="utf-8") as f:
        for row in sorted_rows:
            f.write(json.dumps(row.to_dict(), ensure_ascii=False) + "\n")
    log.info("Wrote %d rows to %s", len(sorted_rows), output_path)


if __name__ == "__main__":
    import sys
    start_time = time.monotonic()

    rows = run()

    # Count route-details
    route_details = [r for r in rows if r.page_type == "PT-03-route-detail"]
    log.info("Route-detail count: %d (expected range: [1800, 2200])", len(route_details))

    if not (1800 <= len(route_details) <= 2200):
        log.error(
            "STOP CONDITION: route-detail count %d is outside [1800, 2200]. "
            "Writing partial results anyway for inspection.",
            len(route_details),
        )

    write_jsonl(rows, OUTPUT_PATH)

    elapsed = time.monotonic() - start_time
    log.info("Phase 1 MR inventory finished in %.1f minutes.", elapsed / 60)
    log.info("Output: %s", OUTPUT_PATH)
    log.info("Row counts: total=%d route-details=%d", len(rows), len(route_details))

    if not (1800 <= len(route_details) <= 2200):
        sys.exit(1)
