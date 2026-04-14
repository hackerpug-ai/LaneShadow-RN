"""Phase 3+5 selector-driven HTML parser for the Crawl Plan Protocol.

Provides :func:`parse_with_selectors` — the function that takes an HTML string
and a :class:`.selectors.SelectorMap` and returns a structured record dict.

**Schema guarantee (mandatory in every phase including this stub):**
Every record dict returned by :func:`parse_with_selectors` MUST contain:
- ``state_primary`` (str | None): URL-derived primary state.  Always populated
  in Phase 5 full implementation (required field); may be ``None`` here if the
  caller does not supply a url.
- ``states_all`` (list[str]): All states the route traverses.  At minimum
  contains ``[state_primary]`` when the primary state is known.  Empty list is
  acceptable in stub / error paths, but Phase 4 fixture tests will assert
  ``expected.state in record.states_all``.

**Multi-state rationale (from DECISIONS.md Phase 0 recon):**
The Natchez Trace Parkway crosses AL/MS/TN.  Blue Ridge Parkway crosses VA/NC.
A single ``state: str`` field silently drops the secondary states.  Every
consumer downstream (Convex schema, scoring, Epic 4/9) must treat
``states_all`` as the authoritative list.

**Fail-closed via SchemaViolation:**
If a field with ``required: true`` yields a null/empty value, the parser raises
:exc:`SchemaViolation` rather than returning a record with a silent null.  This
is the Phase 3/5 contract; the stub enforces the same contract on the declared
schema structure.

Crawl Plan Protocol: Phase 3 — SELECTOR SPEC, Phase 5 — EXECUTION
"""

from __future__ import annotations

from typing import Any, Optional

from .selector_map import SelectorMap


class SchemaViolation(Exception):
    """Raised when a required field is null after selector extraction.

    This is the framework's fail-closed mechanism.  A ``SchemaViolation``
    means the HTML page did not yield a value for a required field — the
    record cannot be written to the output JSONL.  Phase 5 executor increments
    ``schema_validation_fail`` in the audit counters when this is raised.

    Attributes:
        field: The field name that was required but null.
        page_type: The page type being parsed.
        url: The URL of the page being parsed.
    """

    def __init__(self, field: str, page_type: str, url: str = ""):
        self.field = field
        self.page_type = page_type
        self.url = url
        super().__init__(
            f"SchemaViolation: required field '{field}' is null "
            f"for page_type='{page_type}' url='{url}'"
        )


def parse_with_selectors(
    html: str,
    selector_map: SelectorMap,
    page_type: str,
    url: str = "",
    url_derived_fields: Optional[dict[str, Any]] = None,
) -> dict[str, Any]:
    """Parse *html* using the field definitions in *selector_map[page_type]*.

    Returns a record dict.  The record ALWAYS contains:
    - ``state_primary``: from *url_derived_fields* if provided, else ``None``.
    - ``states_all``: list containing ``state_primary`` when non-null, else
      empty list.

    **STUB — Phase 3 full implementation.**  In Phase 1 the function:
    - Does NOT perform real CSS selector extraction.
    - DOES enforce the ``SchemaViolation`` contract: if *url_derived_fields*
      marks a field as required but supplies ``None``, ``SchemaViolation`` is
      raised.
    - DOES return a skeleton record with the mandatory schema fields declared.
    - DOES pass the unit tests in ``test_crawl_plan_framework.py``.

    In Phase 3+5, this function will:
    - Import BeautifulSoup and run each field's CSS selector.
    - Handle ``attr``, ``regex``, ``parse_as``, ``bounds`` transformations.
    - Support the ``derived: url_regex`` extraction mode.
    - Raise ``SchemaViolation`` for any ``required: true`` field that yields
      null after extraction.

    Args:
        html: Raw HTML string of the page to parse.
        selector_map: A :class:`.selectors.SelectorMap` instance.  Must contain
            field definitions for *page_type*.
        page_type: The page type key (e.g. ``"PT-03-route-detail"``).
        url: The source URL; used in ``SchemaViolation`` messages and for
            URL-derived field extraction in Phase 3+5.
        url_derived_fields: Optional dict of pre-computed URL-derived field
            values (e.g. ``{"state_primary": "tennessee"}``).  Values here take
            precedence over selector extraction.  If a required field appears
            here with value ``None``, ``SchemaViolation`` is raised.

    Returns:
        Dict with at minimum ``state_primary`` and ``states_all`` keys, plus
        any fields defined in *selector_map* for *page_type*.

    Raises:
        SchemaViolation: If any ``required: true`` field resolves to null.
    """
    url_derived = url_derived_fields or {}

    # Build skeleton record with mandatory schema fields
    record: dict[str, Any] = {}

    # Populate url-derived fields first
    for field_name, value in url_derived.items():
        record[field_name] = value

    # Enforce required-field contract on url_derived_fields
    required = selector_map.required_fields(page_type)
    for field_name in required:
        if field_name in record and record[field_name] is None:
            raise SchemaViolation(field=field_name, page_type=page_type, url=url)

    # Stub: mark remaining defined fields as None (Phase 3 fills these in)
    for field_name, defn in selector_map.fields(page_type).items():
        if field_name not in record:
            # In Phase 1 stub, non-url-derived fields default to None.
            # Required fields that were not pre-populated via url_derived_fields
            # will be treated as null here — raise SchemaViolation.
            if defn.get("required", False):
                raise SchemaViolation(field=field_name, page_type=page_type, url=url)
            record[field_name] = None

    # Ensure mandatory multi-state schema fields are always present
    if "state_primary" not in record:
        record["state_primary"] = None
    if "states_all" not in record:
        sp = record.get("state_primary")
        record["states_all"] = [sp] if sp is not None else []
    elif not isinstance(record["states_all"], list):
        # Coerce to list if caller accidentally passed a string
        record["states_all"] = [record["states_all"]]

    # If state_primary was just set and states_all is empty, backfill
    sp = record.get("state_primary")
    if sp is not None and not record["states_all"]:
        record["states_all"] = [sp]

    return record
