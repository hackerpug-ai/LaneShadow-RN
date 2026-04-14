"""Phase 5 execution runner for the Crawl Plan Protocol.

Provides :func:`run_crawl` — the function that iterates the committed
``urls.jsonl`` inventory, fetches each detail page, parses it via
:func:`.parser.parse_with_selectors`, and writes output JSONL.

Audit counters and resume-file support prevent re-fetching on restarts and
enable Phase 6 accounting (the :class:`AuditCounters` dict is written as a
sibling ``.audit.json`` file).

Crawl Plan Protocol: Phase 5 — EXECUTION
"""

from __future__ import annotations

import json
import logging
import time
from pathlib import Path
from typing import Any, Callable, Optional, TypedDict

from .inventory import InventoryRow
from .parser import SchemaViolation

logger = logging.getLogger(__name__)


class AuditCounters(TypedDict):
    """Audit counters written by :func:`run_crawl` to ``{output}.audit.json``.

    Used in Phase 6 accounting to validate that:
    - ``fetched`` + ``skipped_resume`` == total inventory rows
    - ``schema_validation_fail`` == 0 for required fields
    - ``parse_success`` / ``fetched`` > protocol threshold (e.g. 95%)

    Fields:
        fetched: Number of detail pages actually fetched in this run.
        skipped_resume: Number of rows skipped because they were in the resume
            file (already fetched in a previous run).
        parse_success: Number of records that passed parsing + schema validation.
        schema_validation_fail: Number of records that raised
            :exc:`.parser.SchemaViolation`.
        http_error: Number of fetch failures (non-200 responses, timeouts, etc.)
        total_inventory: Total rows in the ``urls.jsonl`` input.
    """

    fetched: int
    skipped_resume: int
    parse_success: int
    schema_validation_fail: int
    http_error: int
    total_inventory: int


def _load_progress(progress_path: Path) -> set[str]:
    """Load the set of already-fetched canonical URLs from the progress file."""
    if not progress_path.exists():
        return set()
    done: set[str] = set()
    try:
        with open(progress_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                try:
                    row = json.loads(line)
                    if "canonical_url" in row:
                        done.add(row["canonical_url"])
                except json.JSONDecodeError:
                    pass
    except OSError as exc:
        logger.warning("Could not read progress file %s: %s", progress_path, exc)
    return done


def _append_progress(progress_path: Path, canonical_url: str) -> None:
    """Append a fetched URL to the progress file."""
    with open(progress_path, "a", encoding="utf-8") as f:
        f.write(json.dumps({"canonical_url": canonical_url}) + "\n")


def _write_audit(audit_path: Path, counters: AuditCounters) -> None:
    """Write audit counters to a JSON file (overwrite)."""
    with open(audit_path, "w", encoding="utf-8") as f:
        json.dump(dict(counters), f, indent=2)
        f.write("\n")


def run_crawl(
    inventory_path: str,
    output_path: str,
    fetch_fn: Callable[[str], str],
    parse_fn: Callable[[str, str], dict[str, Any]],
    page_type_filter: Optional[str] = None,
    resume_path: Optional[str] = None,
    audit_write_interval: int = 10,
    fail_rate_threshold: float = 0.05,
) -> AuditCounters:
    """Iterate the committed inventory and fetch+parse each detail page.

    The executor:
    1. Reads ``urls.jsonl`` and optionally filters by *page_type_filter*.
    2. Loads resume state from *resume_path* (a JSONL of already-fetched URLs).
    3. Calls *fetch_fn* for each non-resumed URL.
    4. Calls *parse_fn* on the returned HTML.
    5. Writes parsed records to *output_path* as JSONL (append mode so partial
       runs can be resumed).
    6. Catches :exc:`.parser.SchemaViolation` and increments
       ``schema_validation_fail`` (no record written).
    7. Catches HTTP errors and increments ``http_error``.
    8. Writes a ``.progress`` file after every successful parse.
    9. Writes ``{output_path}.audit.json`` periodically and at the end.

    **STOP condition:** If ``schema_validation_fail / fetched > fail_rate_threshold``
    (default 5%), raises ``RuntimeError`` to signal the caller to escalate.

    Args:
        inventory_path: Path to the committed ``urls.jsonl`` inventory file.
        output_path: Path to write parsed records (JSONL, append mode).
        fetch_fn: ``(url) -> html_str`` callable (rate-limited by caller).
        parse_fn: ``(html, url) -> record_dict`` callable.  Should raise
            :exc:`.parser.SchemaViolation` on required-field nulls.
        page_type_filter: If set, only rows whose ``page_type`` matches this
            string are fetched.  e.g. ``"PT-03-route-detail"``.
        resume_path: Path to the progress file.  If ``None``, uses
            ``{output_path}.progress``.
        audit_write_interval: Write audit counters every N fetches (default 10).
        fail_rate_threshold: If schema_validation_fail / fetched exceeds this,
            raise RuntimeError (default 0.05 = 5%).

    Returns:
        :class:`AuditCounters` dict.  Also written to ``{output_path}.audit.json``.

    Raises:
        RuntimeError: If schema_validation_fail rate exceeds *fail_rate_threshold*.
    """
    inv_path = Path(inventory_path)
    out_path = Path(output_path)
    audit_path = Path(str(out_path) + ".audit.json")

    # Default resume / progress file
    if resume_path is None:
        progress_path = Path(str(out_path) + ".progress")
    else:
        progress_path = Path(resume_path)

    # Load inventory
    logger.info("Loading inventory from %s", inv_path)
    rows: list[InventoryRow] = []
    with open(inv_path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                d = json.loads(line)
                rows.append(InventoryRow.from_dict(d))
            except (json.JSONDecodeError, KeyError) as exc:
                logger.warning("Skipping invalid inventory row: %s", exc)

    # Filter by page type if requested
    if page_type_filter:
        rows = [r for r in rows if r.page_type == page_type_filter]

    total = len(rows)
    logger.info("Inventory loaded: %d rows (filter=%s)", total, page_type_filter)

    # Load resume state
    done_urls = _load_progress(progress_path)
    logger.info("Resume file has %d already-fetched URLs", len(done_urls))

    # Initialize counters
    counters: AuditCounters = {
        "fetched": 0,
        "skipped_resume": 0,
        "parse_success": 0,
        "schema_validation_fail": 0,
        "http_error": 0,
        "total_inventory": total,
    }

    # Ensure output directory exists
    out_path.parent.mkdir(parents=True, exist_ok=True)

    fetch_count = 0
    for row in rows:
        canonical = row.canonical_url

        # Skip if already done
        if canonical in done_urls:
            counters["skipped_resume"] += 1
            continue

        # Fetch
        try:
            html = fetch_fn(row.url)
        except Exception as exc:
            logger.warning("HTTP error fetching %s: %s", row.url, exc)
            counters["http_error"] += 1
            # Still mark as attempted so we don't retry on resume
            _append_progress(progress_path, canonical)
            done_urls.add(canonical)
            continue

        counters["fetched"] += 1
        fetch_count += 1

        # Parse
        try:
            record = parse_fn(html, row.url)
        except SchemaViolation as exc:
            logger.warning("SchemaViolation for %s: %s", row.url, exc)
            counters["schema_validation_fail"] += 1
            # Mark as attempted so we don't retry
            _append_progress(progress_path, canonical)
            done_urls.add(canonical)
        except Exception as exc:
            logger.warning("Parse error for %s: %s", row.url, exc)
            counters["schema_validation_fail"] += 1
            _append_progress(progress_path, canonical)
            done_urls.add(canonical)
        else:
            # Write record
            record.setdefault("source_url", row.url)
            record.setdefault("canonical_url", canonical)
            record.setdefault("page_type", row.page_type)
            record.setdefault("scraped_at", int(time.time()))

            with open(out_path, "a", encoding="utf-8") as f:
                f.write(json.dumps(record, ensure_ascii=False) + "\n")

            counters["parse_success"] += 1
            _append_progress(progress_path, canonical)
            done_urls.add(canonical)

        # Periodic audit write
        if fetch_count % audit_write_interval == 0:
            _write_audit(audit_path, counters)

            # Check fail rate
            fetched = counters["fetched"]
            if fetched > 20:  # Don't check until we have meaningful data
                fail_rate = counters["schema_validation_fail"] / fetched
                if fail_rate > fail_rate_threshold:
                    _write_audit(audit_path, counters)
                    raise RuntimeError(
                        f"schema_validation_fail rate {fail_rate:.1%} exceeds threshold "
                        f"{fail_rate_threshold:.1%} after {fetched} fetches. "
                        f"Selectors may be wrong. Audit: {dict(counters)}"
                    )

        if fetch_count % 50 == 0:
            logger.info(
                "Progress: fetched=%d skipped=%d parse_success=%d fail=%d http_err=%d",
                counters["fetched"],
                counters["skipped_resume"],
                counters["parse_success"],
                counters["schema_validation_fail"],
                counters["http_error"],
            )

    # Final audit write
    _write_audit(audit_path, counters)
    logger.info(
        "run_crawl complete: total_inventory=%d fetched=%d skipped=%d "
        "parse_success=%d schema_fail=%d http_error=%d",
        total,
        counters["fetched"],
        counters["skipped_resume"],
        counters["parse_success"],
        counters["schema_validation_fail"],
        counters["http_error"],
    )
    return counters
