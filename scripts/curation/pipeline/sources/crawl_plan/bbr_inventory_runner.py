"""BBR Phase 1 inventory runner — one-shot script for BASE-009b.

Fetches all PT-01 state listing pages from BestBikingRoads.com, extracts
PT-02 cluster-index links and PT-03 route-detail links, classifies them,
deduplicates by canonical_url, and writes the result to:

    .spec/prds/curation-hardening/crawl-plans/bestbikingroads/urls.jsonl

This is the Phase 1 (INVENTORY) step per the Crawl Plan Protocol.  The script
delegates all framework logic to the generic ``crawl_plan`` module; all
BBR-specific patterns are passed as parameters, not hardcoded into the module.

Rate-limiting: 3.0-4.0s random delay between requests (site-map.md recommendation).

Discovery flow (per site-map.md §9 Handoff):
    1. Fetch each PT-01 state listing (50 URLs, one per US state)
    2. Extract PT-02 cluster links and PT-03 route-detail links (same-state only for PT-03)
    3. Fetch each PT-02 cluster page
    4. Extract PT-03 route-detail links from each cluster page
    5. Canonicalize + classify + deduplicate all PT-03 URLs

Traps defended:
    TRAP-01: Cross-state sidebar links — PT-03 links kept regardless of state (canonicalize + dedup
             collapses duplicates; state is ALWAYS derived from the route URL at parse time)
    TRAP-02: Cluster pages must be included (83% additive on Tennessee sample)
    TRAP-03: No PT-02→PT-02 recursion; full cluster set only discoverable from PT-01
    TRAP-04: Mixed-case slugs preserved (canonicalize() in framework preserves path case)
    TRAP-05: Host aliases normalized to www.bestbikingroads.com
    TRAP-06: Non-US routes filtered (require /united-states/ in path)
    TRAP-07: Top-10 curated pages rejected (top-10-best-rides in path)

Usage (from repo root):
    PYTHONPATH=$(pwd):$(pwd)/scripts/curation .venv/bin/python \
        -m scripts.curation.pipeline.sources.crawl_plan.bbr_inventory_runner
"""

from __future__ import annotations

import json
import logging
import random
import re
import time
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urljoin, urlparse

import httpx
from bs4 import BeautifulSoup

from scripts.curation.pipeline.sources.crawl_plan.inventory import (
    InventoryRow,
    canonicalize,
    classify,
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

BASE_URL = "https://www.bestbikingroads.com"
OUTPUT_PATH = Path(
    ".spec/prds/curation-hardening/crawl-plans/bestbikingroads/urls.jsonl"
)

# Rate limiting: 3.0-4.0 seconds per site-map.md recommendation
MIN_DELAY = 3.0
MAX_DELAY = 4.0

# US state slugs (from existing bestbikingroads.py, authoritative list)
US_STATES = [
    "alabama", "alaska", "arizona", "arkansas", "california",
    "colorado", "connecticut", "delaware", "florida", "georgia", "hawaii",
    "idaho", "illinois", "indiana", "iowa", "kansas", "kentucky",
    "louisiana", "maine", "maryland", "massachusetts", "michigan",
    "minnesota", "mississippi", "missouri", "montana", "nebraska",
    "nevada", "new-hampshire", "new-jersey", "new-mexico", "new-york",
    "north-carolina", "north-dakota", "ohio", "oklahoma", "oregon",
    "pennsylvania", "rhode-island", "south-carolina", "south-dakota",
    "tennessee", "texas", "utah", "vermont", "virginia", "washington",
    "west-virginia", "wisconsin", "wyoming",
]

# PT-01: state listing pages (seed set, not collected as inventory)
PT01_URLS = [
    f"{BASE_URL}/motorcycle-roads/united-states/routes/{state}"
    for state in US_STATES
]

# URL patterns per site-map.md §3
# PT-02: /motorcycle-roads/united-states/{state}/rides/{cluster}
PT02_PATTERN = (
    r"https://www\.bestbikingroads\.com"
    r"/motorcycle-roads/united-states/[a-z-]+/rides/[a-z0-9-]+"
)
# PT-03: /motorcycle-roads/united-states/{state}/ride/{slug} (mixed-case slug OK)
PT03_PATTERN = (
    r"https://www\.bestbikingroads\.com"
    r"/motorcycle-roads/united-states/[a-z-]+/ride/[A-Za-z0-9\-]+"
)

PATTERNS: list[tuple[str, str]] = [
    (PT03_PATTERN, "PT-03-route-detail"),  # most specific first
    (PT02_PATTERN, "PT-02-cluster-index"),
]

USER_AGENTS = [
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15",
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
        time.sleep(sleep_for)
    headers = {"User-Agent": random.choice(USER_AGENTS)}
    response = _http.get(url, headers=headers)
    _last_fetch_time = time.monotonic()
    response.raise_for_status()
    return response.text


# ---------------------------------------------------------------------------
# Canonicalize for BBR (delegates to framework, adds host-alias normalization)
# ---------------------------------------------------------------------------

def bbr_canonicalize(url: str) -> str:
    """Canonicalize a BBR URL.

    Extends framework canonicalize() with BBR-specific host-alias normalization
    (TRAP-05): www.bestbikingroads.com:443, bestbikingroads.gr → www.bestbikingroads.com.

    Path case is preserved per DECISIONS.md Finding 3 (TRAP-04).
    """
    # Strip port from host, normalize TLD to .com, force www prefix
    parsed = urlparse(url)
    host = parsed.hostname or ""
    # Normalize: strip port, force .com TLD, force www prefix
    host = re.sub(r":\d+$", "", host)  # strip port if in netloc
    host = re.sub(r"\.gr$", ".com", host)  # .gr alias → .com
    if not host.startswith("www."):
        host = "www." + host
    # Rebuild with corrected host
    fixed = parsed._replace(netloc=host, scheme="https")
    fixed_url = fixed.geturl()
    return canonicalize(fixed_url)


# ---------------------------------------------------------------------------
# Link extraction for PT-01 state listing and PT-02 cluster pages
# ---------------------------------------------------------------------------

def extract_links_from_listing(html: str, source_url: str) -> list[str]:
    """Extract PT-02 cluster and PT-03 route-detail candidate links.

    Called on both PT-01 state listing pages and PT-02 cluster pages.
    Returns absolute URLs for all /motorcycle-roads/ links that could be
    PT-02 or PT-03.  The classifier rejects everything else.

    Traps:
    - TRAP-01: sidebar cross-state links are extracted (classifier keeps them;
      dedup collapses duplicates; state is URL-derived at parse time — not
      the listing page's context).
    - TRAP-05: host aliases are normalized in bbr_canonicalize().
    - TRAP-06: non-US routes filtered here by /united-states/ prefix check.
    - TRAP-07: top-10 curated pages rejected by classifier (pattern mismatch).
    """
    soup = BeautifulSoup(html, "html.parser")
    links: list[str] = []

    for a in soup.find_all("a", href=True):
        href = a["href"].strip()
        if not href:
            continue

        # Skip anchors, javascript, etc.
        if href.startswith(("#", "javascript:", "mailto:")):
            continue

        # Resolve relative URLs
        if href.startswith("/"):
            href = BASE_URL + href
        elif not href.startswith("http"):
            href = urljoin(source_url, href)

        # Strip query string (BBR uses no query strings for content URLs)
        href = href.split("?")[0].rstrip("/")

        # TRAP-06: US-only filter
        if "/united-states/" not in href:
            continue

        # Must be a /motorcycle-roads/ path
        if "/motorcycle-roads/" not in href:
            continue

        links.append(href)

    return links


# ---------------------------------------------------------------------------
# Main runner
# ---------------------------------------------------------------------------

def run() -> list[InventoryRow]:
    """Run Phase 1 BBR inventory.

    Two-pass discovery:
    1. Fetch all 50 PT-01 state listing pages; extract PT-02 + PT-03 links.
    2. Fetch all discovered PT-02 cluster pages; extract PT-03 links.

    Returns a list of InventoryRow with page_type in {PT-02-cluster-index,
    PT-03-route-detail}.
    """
    all_rows: list[InventoryRow] = []
    seen_canonical: set[str] = set()
    reject_log: list[dict] = []

    cluster_urls: list[str] = []  # PT-02 URLs to fetch in pass 2

    def _process_links(raw_links: list[str], source_url: str) -> None:
        """Classify, dedup, and collect InventoryRows from raw links."""
        for raw_url in raw_links:
            canon = bbr_canonicalize(raw_url)
            page_type = classify(canon, PATTERNS)

            if page_type is None:
                reject_log.append({
                    "url": raw_url,
                    "canonical_url": canon,
                    "discovered_from": source_url,
                })
                continue

            if canon in seen_canonical:
                continue

            seen_canonical.add(canon)
            row = InventoryRow(
                page_type=page_type,
                url=raw_url,
                canonical_url=canon,
                discovered_from=source_url,
                first_seen=datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
            )
            all_rows.append(row)

            if page_type == "PT-02-cluster-index":
                cluster_urls.append(raw_url)

    # -----------------------------------------------------------------------
    # Pass 1: PT-01 state listing pages (50 total)
    # -----------------------------------------------------------------------
    log.info("=== Pass 1: Fetching %d PT-01 state listing pages ===", len(PT01_URLS))

    for i, pt01_url in enumerate(PT01_URLS):
        state_slug = pt01_url.rsplit("/", 1)[-1]
        log.info("PT-01 [%d/%d] %s", i + 1, len(PT01_URLS), state_slug)

        try:
            html = fetch(pt01_url)
        except Exception as exc:
            log.warning("Failed to fetch PT-01 %s: %s", pt01_url, exc)
            continue

        raw_links = extract_links_from_listing(html, pt01_url)
        before = len(all_rows)
        _process_links(raw_links, pt01_url)
        after = len(all_rows)
        new_count = after - before
        pt03_count = sum(1 for r in all_rows if r.page_type == "PT-03-route-detail")
        pt02_count = sum(1 for r in all_rows if r.page_type == "PT-02-cluster-index")
        log.info(
            "  → %d new rows (%d total PT-03, %d total PT-02)",
            new_count, pt03_count, pt02_count,
        )

    log.info(
        "Pass 1 complete: %d PT-03 route-details, %d PT-02 clusters discovered",
        sum(1 for r in all_rows if r.page_type == "PT-03-route-detail"),
        len(cluster_urls),
    )

    # -----------------------------------------------------------------------
    # Pass 2: PT-02 cluster index pages (TRAP-02: these are 83% additive)
    # -----------------------------------------------------------------------
    log.info("=== Pass 2: Fetching %d PT-02 cluster pages ===", len(cluster_urls))

    for i, cluster_url in enumerate(cluster_urls):
        log.info("PT-02 [%d/%d] %s", i + 1, len(cluster_urls), cluster_url)

        try:
            html = fetch(cluster_url)
        except Exception as exc:
            log.warning("Failed to fetch PT-02 %s: %s", cluster_url, exc)
            continue

        raw_links = extract_links_from_listing(html, cluster_url)
        before = len(all_rows)
        _process_links(raw_links, cluster_url)
        after = len(all_rows)
        log.info("  → %d new PT-03 rows", after - before)

    # -----------------------------------------------------------------------
    # Final counts
    # -----------------------------------------------------------------------
    route_details = [r for r in all_rows if r.page_type == "PT-03-route-detail"]
    clusters = [r for r in all_rows if r.page_type == "PT-02-cluster-index"]

    log.info(
        "Inventory complete: %d PT-03 route-detail, %d PT-02 cluster, %d rejects",
        len(route_details), len(clusters), len(reject_log),
    )
    if reject_log:
        log.info("Top reject URLs (first 5):")
        for r in reject_log[:5]:
            log.info("  REJECT: %s", r["canonical_url"])

    return all_rows


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

    route_details = [r for r in rows if r.page_type == "PT-03-route-detail"]
    log.info("Route-detail count: %d (expected range: [3500, 5500])", len(route_details))

    if not (3500 <= len(route_details) <= 5500):
        log.error(
            "STOP CONDITION: route-detail count %d is outside [3500, 5500]. "
            "Writing partial results anyway for inspection.",
            len(route_details),
        )

    write_jsonl(rows, OUTPUT_PATH)

    elapsed = time.monotonic() - start_time
    log.info("Phase 1 BBR inventory finished in %.1f minutes.", elapsed / 60)
    log.info("Output: %s", OUTPUT_PATH)

    route_details = [r for r in rows if r.page_type == "PT-03-route-detail"]
    clusters = [r for r in rows if r.page_type == "PT-02-cluster-index"]
    log.info("Row counts: total=%d route-details=%d clusters=%d", len(rows), len(route_details), len(clusters))

    if not (3500 <= len(route_details) <= 5500):
        sys.exit(1)
