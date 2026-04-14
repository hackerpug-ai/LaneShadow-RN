"""Phase 3+5 selector-driven HTML parser for the Crawl Plan Protocol.

Provides :func:`parse_with_selectors` — the function that takes an HTML string
and a :class:`.selectors.SelectorMap` and returns a structured record dict.

**Schema guarantee (mandatory for all records):**
Every record dict returned by :func:`parse_with_selectors` MUST contain:
- ``state_primary`` (str | None): URL-derived primary state.  Always populated
  for PT-03 route detail pages (required field); None for index pages.
- ``states_all`` (list[str]): All states the route traverses.  At minimum
  contains a title-cased version of ``state_primary`` when primary state is known.
  Empty list acceptable for index page types.

**Multi-state rationale (from DECISIONS.md Phase 0 recon):**
The Natchez Trace Parkway crosses AL/MS/TN.  Blue Ridge Parkway crosses VA/NC.
A single ``state: str`` field silently drops the secondary states.  Every
consumer downstream (Convex schema, scoring, Epic 4/9) must treat
``states_all`` as the authoritative list.

**Fail-closed via SchemaViolation:**
If a field with ``required: true`` yields a null/empty value, the parser raises
:exc:`SchemaViolation` rather than returning a record with a silent null.

Crawl Plan Protocol: Phase 3 — SELECTOR SPEC, Phase 5 — EXECUTION
"""

from __future__ import annotations

import re
import logging
from typing import Any, Optional

from .selector_map import SelectorMap
from .us_states import US_STATES, normalize_state_primary

logger = logging.getLogger(__name__)


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


# ---------------------------------------------------------------------------
# Internal extraction helpers
# ---------------------------------------------------------------------------

def _extract_css(soup: Any, selector: str, attr: Optional[str] = None) -> Optional[str]:
    """Extract text or attribute from the first CSS-matched element."""
    elem = soup.select_one(selector)
    if elem is None:
        return None
    if attr:
        val = elem.get(attr)
        return str(val) if val is not None else None
    return elem.get_text(strip=True) or None


def _apply_regex(text: Optional[str], pattern: str, group: int = 1) -> Optional[str]:
    """Apply a regex to *text* and return the specified capture group."""
    if text is None:
        return None
    m = re.search(pattern, text)
    if m:
        try:
            return m.group(group)
        except IndexError:
            return None
    return None


def _coerce(value: Optional[str], parse_as: str) -> Any:
    """Coerce a string value to the declared type."""
    if value is None:
        return None
    if parse_as == "str":
        return str(value)
    if parse_as == "int":
        try:
            return int(value)
        except (ValueError, TypeError):
            return None
    if parse_as == "float":
        try:
            return float(value)
        except (ValueError, TypeError):
            return None
    if parse_as == "bool":
        return bool(value)
    # state_list and link_list are handled separately
    return value


def _extract_state_list(raw: Optional[str]) -> list[str]:
    """Parse a 'State1,United States,State2,...' string into a state list.

    Filters out 'United States' and empty strings.  Returns title-cased state
    names.
    """
    if not raw:
        return []
    parts = [s.strip() for s in raw.split(",")]
    return [p for p in parts if p and p not in ("United States", "United States ")]


def _extract_states_from_meta(soup: Any) -> list[str]:
    """Extract states_all from the <meta name='description'> content.

    The meta content format is:
    'Route Name | Route Ref. #NNNNN | State1,United States,State2,...'

    Returns a list of state names (title case), excluding 'United States'.
    """
    meta = soup.select_one("meta[name='description']")
    if not meta:
        return []
    content = meta.get("content", "")
    # Capture everything after the last pipe separator
    m = re.search(r"\|\s*([\w ,]+United States[\w ,]*?)(?:\"|$)", content)
    if m:
        return _extract_state_list(m.group(1))
    return []


def _extract_rating(soup: Any) -> Optional[float]:
    """Extract the route rating as a float from 'X.XX out of 5' text."""
    # Search full page text for the first rating occurrence
    all_texts = soup.find_all(string=re.compile(r"\d+\.\d+ out of 5"))
    for text in all_texts:
        m = re.search(r"(\d+\.\d+) out of 5", str(text))
        if m:
            try:
                return float(m.group(1))
            except ValueError:
                continue
    return None


def _extract_distance_mi(soup: Any) -> Optional[int]:
    """Extract distance in miles from span#mile strong:first-child."""
    mile_span = soup.select_one("span#mile")
    if not mile_span:
        return None
    strongs = mile_span.find_all("strong")
    if strongs:
        text = strongs[0].get_text(strip=True)
        try:
            return int(text)
        except ValueError:
            return None
    return None


def _extract_description(soup: Any) -> Optional[str]:
    """Extract route description from the Written Directions section.

    Finds the h3 containing 'Written Directions' and collects all following
    sibling element text until the next h3 heading.  MR wraps description
    text in <span> elements (not <p>), so we collect any non-empty text
    element (p, span, div) that isn't structural noise.
    """
    all_h3 = soup.find_all("h3")
    for h3 in all_h3:
        if "Written Directions" in h3.get_text():
            parts = []
            for sibling in h3.next_siblings:
                if not hasattr(sibling, "name"):
                    continue
                if sibling.name == "h3":
                    break
                if sibling.name in ("p", "span", "div"):
                    text = sibling.get_text(strip=True)
                    if text:
                        parts.append(text)
            if parts:
                return " ".join(parts)
    return None


def _extract_url_derived(
    url: str, field_name: str, field_def: dict[str, Any]
) -> Optional[str]:
    """Extract a url_regex derived field from *url*."""
    pattern = field_def.get("pattern", "")
    group = field_def.get("capture_group", 1)
    m = re.search(pattern, url)
    if m:
        try:
            return m.group(group)
        except IndexError:
            return None
    return None


def _extract_field(
    soup: Any,
    html: str,
    url: str,
    field_name: str,
    field_def: dict[str, Any],
) -> Any:
    """Dispatch extraction for a single field based on its definition.

    Returns the extracted value (may be None, list, str, int, float).
    """
    # Special-case fields with custom extraction logic
    if field_name == "states_all":
        return _extract_states_from_meta(soup)

    if field_name == "rating":
        return _extract_rating(soup)

    if field_name == "distance_mi":
        return _extract_distance_mi(soup)

    if field_name == "description":
        return _extract_description(soup)

    derived = field_def.get("derived")
    if derived == "url_regex":
        return _extract_url_derived(url, field_name, field_def)

    # Generic CSS + regex + attr extraction
    selector = field_def.get("selector")
    if not selector:
        # No selector, no derived — field cannot be extracted
        return None

    attr = field_def.get("attr")
    raw = _extract_css(soup, selector, attr)

    # Apply regex if specified
    regex = field_def.get("regex")
    if regex and raw is not None:
        group = field_def.get("capture_group", 1)
        raw = _apply_regex(raw, regex, group)

    parse_as = field_def.get("parse_as", "str")
    if parse_as == "state_list":
        return _extract_state_list(raw)
    if parse_as == "link_list":
        # link_list requires iterating all matching elements, not just first
        filter_regex = field_def.get("filter_regex")
        links = []
        for elem in soup.select(selector):
            href = elem.get(attr or "href", "")
            if href and (not filter_regex or re.search(filter_regex, href)):
                links.append(href)
        return links

    return _coerce(raw, parse_as)


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def parse_with_selectors(
    html: str,
    selector_map: SelectorMap,
    page_type: str,
    url: str = "",
    url_derived_fields: Optional[dict[str, Any]] = None,
) -> dict[str, Any]:
    """Parse *html* using the field definitions in *selector_map[page_type]*.

    Returns a record dict.  The record ALWAYS contains:
    - ``state_primary``: from url_derived_fields or url_regex derived field,
      else ``None``.
    - ``states_all``: list of all states; defaults to ``[state_primary_title]``
      if states_all extraction returns empty and state_primary is known.

    Args:
        html: Raw HTML string of the page to parse.
        selector_map: A :class:`.selector_map.SelectorMap` instance.  Must contain
            field definitions for *page_type*.
        page_type: The page type key (e.g. ``"PT-03-route-detail"``).
        url: The source URL; used in ``SchemaViolation`` messages and for
            URL-derived field extraction.
        url_derived_fields: Optional dict of pre-computed URL-derived field
            values (e.g. ``{"state_primary": "tennessee"}``).  Values here take
            precedence over selector extraction.  If a required field appears
            here with value ``None``, ``SchemaViolation`` is raised.

    Returns:
        Dict with at minimum ``state_primary`` and ``states_all`` keys, plus
        all fields defined in *selector_map* for *page_type*.

    Raises:
        SchemaViolation: If any ``required: true`` field resolves to null.
    """
    from bs4 import BeautifulSoup

    soup = BeautifulSoup(html, "html.parser")
    url_derived = url_derived_fields or {}
    record: dict[str, Any] = {}

    # Process fields in selector_map order
    fields = selector_map.fields(page_type)
    for field_name, field_def in fields.items():
        required = field_def.get("required", False)

        # Pre-computed url_derived_fields take precedence
        if field_name in url_derived:
            value = url_derived[field_name]
        else:
            try:
                value = _extract_field(soup, html, url, field_name, field_def)
            except Exception as exc:
                logger.warning(
                    "parse_with_selectors: error extracting %s for %s url=%s: %s",
                    field_name,
                    page_type,
                    url,
                    exc,
                )
                value = None

        # Fail-closed for required fields
        if required and (value is None or value == "" or value == []):
            raise SchemaViolation(field=field_name, page_type=page_type, url=url)

        record[field_name] = value

    # Ensure mandatory multi-state schema fields are always present
    if "state_primary" not in record:
        # Try to derive from url if not in selector_map
        if url:
            m = re.search(r"/motorcycle-roads/([a-z-]+)/", url)
            record["state_primary"] = m.group(1) if m else None
        else:
            record["state_primary"] = None

    if "states_all" not in record:
        sp = record.get("state_primary")
        record["states_all"] = [sp.replace("-", " ").title()] if sp else []
    elif not isinstance(record["states_all"], list):
        record["states_all"] = [record["states_all"]]

    # Backfill states_all from state_primary if empty
    sp = record.get("state_primary")
    if sp and not record["states_all"]:
        record["states_all"] = [sp.replace("-", " ").title()]

    # INF-011: normalize non-canonical state_primary slugs to US states.
    # MR publishes cross-region "trip" pages under slugs like "east-coast",
    # "southeast", etc., and BBR has county-group cluster slugs like
    # "ny-jefferson-lewis" that slip through URL-regex extraction as non-US
    # state_primary values.  The normalize_state_primary cascade (identity →
    # USPS prefix → states_all fallback → give up) maps them to canonical
    # slugs where possible while preserving records for ones that genuinely
    # cannot be normalized.  See DECISIONS.md "INF-011 us_states normalization"
    # and scripts/curation/pipeline/sources/crawl_plan/us_states.py.
    sp = record.get("state_primary")
    if sp and sp not in US_STATES:
        normalized = normalize_state_primary(sp, record.get("states_all"))
        if normalized:
            record["state_primary"] = normalized
            normalized_title = normalized.replace("-", " ").title()
            sa = record.get("states_all") or []
            if normalized_title not in sa:
                record["states_all"] = [normalized_title] + list(sa)

    # Store source URL
    if url and "source_url" not in record:
        record["source_url"] = url

    return record
