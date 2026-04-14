"""Phase 3 selector helpers for the Crawl Plan Protocol.

Provides loading, validation, and querying of ``selectors.yaml`` files that
specify how to extract structured fields from HTML fixtures.

Crawl Plan Protocol: Phase 3 — SELECTOR SPEC
"""

from __future__ import annotations

from typing import Any


class SelectorMap:
    """Holds the parsed contents of a ``selectors.yaml`` file.

    A selector map describes, per page-type (e.g. ``PT-03-route-detail``), a
    mapping of field name → field definition dict.  Field definition keys
    (following Phase 3 selectors.yaml format):

    - ``selector``: CSS selector string (or null for derived/regex-only fields)
    - ``attr``: Optional attribute to extract (default: inner text)
    - ``regex``: Optional regex applied to the extracted string
    - ``capture_group``: Which regex capture group to use (default: 1)
    - ``parse_as``: Optional type coercion ("float", "int", "str", "state_list", "link_list", "bool")
    - ``bounds``: Optional ``[min, max]`` for numeric fields
    - ``required``: ``true`` / ``false`` — drives :class:`.parser.SchemaViolation`
    - ``fixture_yield``: e.g. ``"5/5"`` — recorded after Phase 3 validation
    - ``derived``: Alternative extraction mode (e.g. ``"url_regex"``)
    - ``pattern``: Regex pattern for url_regex derived fields
    - ``filter_regex``: For link_list fields, filter hrefs matching this pattern
    - ``after_heading``: For description fields, text of heading to search after
    - ``heading_selector``: CSS selector for the heading element type
    - ``sibling_selector``: CSS selector for sibling elements to collect
    - ``text_pattern``: For sentinel/bool fields, text string to search for
    """

    def __init__(self, data: dict[str, dict[str, Any]]):
        """Initialise from a parsed selectors.yaml dict.

        Args:
            data: Top-level dict keyed by page_type.  Each value is a dict
                mapping field names to field-definition dicts.
        """
        self._data = data

    def page_types(self) -> list[str]:
        """Return all page types defined in this selector map."""
        return list(self._data.keys())

    def fields(self, page_type: str) -> dict[str, Any]:
        """Return the field-definition dict for *page_type*.

        Args:
            page_type: e.g. ``"PT-03-route-detail"``

        Returns:
            Dict of ``{field_name: field_def_dict}``.  Empty dict if page_type
            not found.
        """
        return self._data.get(page_type, {})

    def required_fields(self, page_type: str) -> list[str]:
        """Return field names that are ``required: true`` for *page_type*."""
        return [
            name
            for name, defn in self.fields(page_type).items()
            if defn.get("required", False)
        ]

    def raw(self) -> dict:
        """Return the underlying data dict (read-only view)."""
        return dict(self._data)


def load_selectors(path: str) -> SelectorMap:
    """Load a ``selectors.yaml`` file and return a :class:`SelectorMap`.

    Args:
        path: Filesystem path to the ``selectors.yaml`` file.

    Returns:
        :class:`SelectorMap` instance.

    Raises:
        FileNotFoundError: When *path* does not exist.
        ValueError: When the YAML cannot be parsed or has invalid structure.
    """
    import yaml
    from pathlib import Path

    p = Path(path)
    if not p.exists():
        raise FileNotFoundError(f"selectors.yaml not found: {path}")

    try:
        with open(p, "r", encoding="utf-8") as f:
            data = yaml.safe_load(f)
    except yaml.YAMLError as exc:
        raise ValueError(f"Failed to parse selectors.yaml at {path}: {exc}") from exc

    if not isinstance(data, dict):
        raise ValueError(f"selectors.yaml must be a top-level dict, got {type(data)}")

    # Validate structure: each top-level key must map to a dict of field defs
    for page_type, fields in data.items():
        if not isinstance(fields, dict):
            raise ValueError(
                f"selectors.yaml: page_type '{page_type}' must map to a dict of fields, "
                f"got {type(fields)}"
            )
        for field_name, field_def in fields.items():
            if not isinstance(field_def, dict):
                raise ValueError(
                    f"selectors.yaml: {page_type}/{field_name} must be a dict, "
                    f"got {type(field_def)}"
                )

    return SelectorMap(data)
