"""Phase 5 execution runner for the Crawl Plan Protocol.

Provides :func:`run_crawl` — the function that iterates the committed
``urls.jsonl`` inventory, fetches each detail page, parses it via
:func:`.parser.parse_with_selectors`, and writes output JSONL.

Audit counters and resume-file support prevent re-fetching on restarts and
enable Phase 6 accounting (the :class:`AuditCounters` dict is written as a
sibling ``.audit.json`` file).

**Phase 1 status (STUB):** The public API and :class:`AuditCounters` type are
declared here so ``__init__.py`` can export them and unit tests can import them.
The full implementation is delivered in Phase 5.

Crawl Plan Protocol: Phase 5 — EXECUTION
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Callable, Iterator, Optional, TypedDict

from .inventory import InventoryRow
from .parser import SchemaViolation


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


def run_crawl(
    inventory_path: str,
    output_path: str,
    fetch_fn: Callable[[str], str],
    parse_fn: Callable[[str, str], dict[str, Any]],
    page_type_filter: Optional[str] = None,
    resume_path: Optional[str] = None,
) -> AuditCounters:
    """Iterate the committed inventory and fetch+parse each detail page.

    **STUB — Phase 5 full implementation.**  In Phase 1 this function raises
    ``NotImplementedError``.  Phase 5 will implement:
    - Reading ``urls.jsonl`` and optionally filtering by *page_type_filter*.
    - Loading resume state from *resume_path* (a JSONL of already-fetched URLs).
    - Calling *fetch_fn* for each non-resumed URL.
    - Calling *parse_fn* on the returned HTML.
    - Writing parsed records to *output_path* as JSONL (append mode so partial
      runs can be resumed).
    - Catching :exc:`.parser.SchemaViolation` and incrementing
      ``schema_validation_fail`` (no record written).
    - Catching HTTP errors and incrementing ``http_error``.
    - Writing ``{output_path}.audit.json`` at the end.

    Args:
        inventory_path: Path to the committed ``urls.jsonl`` inventory file.
        output_path: Path to write parsed records (JSONL, append mode).
        fetch_fn: ``(url) -> html_str`` callable (rate-limited by caller).
        parse_fn: ``(html, url) -> record_dict`` callable.  Should raise
            :exc:`.parser.SchemaViolation` on required-field nulls.
        page_type_filter: If set, only rows whose ``page_type`` matches this
            string are fetched.  e.g. ``"PT-03-route-detail"``.
        resume_path: Path to a JSONL file recording already-fetched URLs.  If
            ``None``, uses ``{output_path}.resume.jsonl``.

    Returns:
        :class:`AuditCounters` dict.  Also written to ``{output_path}.audit.json``.

    Raises:
        NotImplementedError: Always in Phase 1.
    """
    raise NotImplementedError(
        "run_crawl() is a Phase 5 deliverable.  "
        "The Phase 1 stub raises NotImplementedError intentionally."
    )
