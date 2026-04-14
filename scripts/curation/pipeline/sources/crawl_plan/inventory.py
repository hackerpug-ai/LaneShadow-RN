"""Phase 1 inventory logic for the Crawl Plan Protocol.

Provides URL canonicalization, page-type classification, and link discovery.
All functions are generic — they take patterns and parameters; no source-specific
logic (no MR or BBR hardcoding) lives here.

Crawl Plan Protocol: Phase 1 — INVENTORY
"""

from __future__ import annotations

import re
import time
from dataclasses import dataclass, asdict
from datetime import datetime, timezone
from typing import Callable, Optional
from urllib.parse import urlparse, urlunparse


@dataclass
class InventoryRow:
    """One discovered URL in the inventory.

    Fields:
        page_type: Classifier match result (e.g., "PT-03-route-detail"). Never null.
        url: The original discovered URL (may have trailing slash, query string).
        canonical_url: Canonical form: scheme+host lowercased, path case preserved,
            trailing slash stripped, query string and fragment dropped.
        discovered_from: The index/listing page URL this link was extracted from.
        first_seen: ISO-8601 UTC timestamp (RFC-3339, e.g. "2026-04-13T15:22:03Z").
    """

    page_type: str
    url: str
    canonical_url: str
    discovered_from: str
    first_seen: str

    def to_dict(self) -> dict:
        """Serialize to a plain dict (for JSONL writing)."""
        return asdict(self)

    @classmethod
    def from_dict(cls, d: dict) -> "InventoryRow":
        """Deserialize from a plain dict."""
        return cls(
            page_type=d["page_type"],
            url=d["url"],
            canonical_url=d["canonical_url"],
            discovered_from=d["discovered_from"],
            first_seen=d["first_seen"],
        )


def canonicalize(url: str) -> str:
    """Return a canonical form of *url*.

    Rules (non-negotiable per DECISIONS.md Phase 0 recon findings):
    - Lowercase scheme and host ONLY.
    - Preserve path, query, and fragment case exactly as-is.
    - Strip trailing slash from the path (except for root "/").
    - Drop the query string and fragment entirely.

    Rationale for preserving path case: BestBikingRoads uses mixed-case slugs
    like ``Columbia-2``.  The framework is shared between MR and BBR so
    lowercasing the path would silently collapse ``/alabama/Columbia-2`` and
    ``/alabama/columbia-2`` into the same canonical URL, erasing distinct routes.

    Examples::

        canonicalize("https://www.Example.COM/Alabama/Columbia-2/")
        # -> "https://www.example.com/Alabama/Columbia-2"

        canonicalize("https://WWW.MOTORCYCLEROADS.COM/motorcycle-roads/tennessee/deals-gap/?utm=foo")
        # -> "https://www.motorcycleroads.com/motorcycle-roads/tennessee/deals-gap"

        canonicalize("https://www.motorcycleroads.com/")
        # -> "https://www.motorcycleroads.com/"

    Args:
        url: Any absolute HTTP/HTTPS URL.

    Returns:
        Canonical URL string.
    """
    parsed = urlparse(url)

    # Lowercase scheme and host only
    scheme = parsed.scheme.lower()
    netloc = parsed.netloc.lower()

    # Preserve path case; strip trailing slash (except bare root "/")
    path = parsed.path
    if path != "/" and path.endswith("/"):
        path = path.rstrip("/")

    # Drop query string and fragment
    canonical = urlunparse((scheme, netloc, path, "", "", ""))
    return canonical


def classify(url: str, patterns: list[tuple[str, str]]) -> Optional[str]:
    """Return the page_type label for *url* by matching against *patterns*.

    Patterns are checked in order; the first match wins (and later patterns are
    not evaluated).  This mirrors ``re.match`` semantics — the pattern is matched
    against the full canonical URL string.

    Args:
        url: The canonical URL to classify.
        patterns: Ordered list of ``(pattern, page_type)`` tuples where *pattern*
            is a Python regex string matched against the full URL.  If *pattern*
            contains named groups or plain capture groups, they are ignored for
            classification purposes.

    Returns:
        The ``page_type`` string for the first matching pattern, or ``None`` if
        no pattern matches (the URL should be rejected/logged as an unclassified
        link).
    """
    for pattern, page_type in patterns:
        if re.search(pattern, url):
            return page_type
    return None


def _now_iso() -> str:
    """Return current UTC time as a compact ISO-8601 string ending in 'Z'."""
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def discover(
    index_urls: list[str],
    patterns: list[tuple[str, str]],
    fetch_fn: Callable[[str], str],
    link_extractor: Callable[[str, str], list[str]],
    *,
    dedup: bool = True,
    reject_log: Optional[list[dict]] = None,
) -> list[InventoryRow]:
    """Discover and classify all links reachable from *index_urls*.

    This is the core Phase 1 function.  It:
    1. Fetches each index/listing page using *fetch_fn*.
    2. Extracts candidate links using *link_extractor*.
    3. Canonicalizes each link.
    4. Classifies each canonical URL via *classify()*.
    5. Rejects (and optionally logs) URLs that do not match any pattern.
    6. Deduplicates by ``canonical_url`` (keeping first occurrence).

    The function is **generic** — all source-specific logic lives in the caller's
    *fetch_fn* and *link_extractor* callables.

    Args:
        index_urls: Ordered list of listing/index page URLs to crawl.  These are
            fetched sequentially in order.  They should NOT be in *patterns* —
            they are traversed, not collected.
        patterns: Ordered ``(pattern, page_type)`` list passed verbatim to
            :func:`classify`.
        fetch_fn: ``(url) -> html_str`` callable.  Must handle rate limiting,
            robots.txt checking, and User-Agent rotation.  Raise an exception on
            fatal HTTP errors; return empty string on ignorable errors (the page
            will produce no links and be skipped).
        link_extractor: ``(html, source_url) -> list[str]`` callable.  Extracts
            candidate hrefs (absolute or relative) from *html*.  The framework
            calls :func:`canonicalize` on each result, so the extractor need not
            canonicalize itself.
        dedup: If ``True`` (default), deduplicate by ``canonical_url``, keeping
            the first occurrence.
        reject_log: Optional mutable list.  If provided, rejected URLs (those that
            do not match any pattern) are appended as dicts with keys
            ``url``, ``canonical_url``, and ``discovered_from``.  Useful for
            diagnosing unexpected link types without stopping the crawl.

    Returns:
        List of :class:`InventoryRow` objects, in discovery order (subject to
        dedup).
    """
    rows: list[InventoryRow] = []
    seen: set[str] = set()

    for index_url in index_urls:
        try:
            html = fetch_fn(index_url)
        except Exception as exc:
            # Log and skip — don't abort the entire crawl for one page
            import logging
            logging.getLogger(__name__).warning(
                "discover: failed to fetch %s: %s", index_url, exc
            )
            continue

        if not html:
            continue

        raw_links = link_extractor(html, index_url)

        for raw_url in raw_links:
            canon = canonicalize(raw_url)
            page_type = classify(canon, patterns)

            if page_type is None:
                if reject_log is not None:
                    reject_log.append(
                        {
                            "url": raw_url,
                            "canonical_url": canon,
                            "discovered_from": index_url,
                        }
                    )
                continue

            if dedup and canon in seen:
                continue

            seen.add(canon)
            rows.append(
                InventoryRow(
                    page_type=page_type,
                    url=raw_url,
                    canonical_url=canon,
                    discovered_from=index_url,
                    first_seen=_now_iso(),
                )
            )

    return rows
