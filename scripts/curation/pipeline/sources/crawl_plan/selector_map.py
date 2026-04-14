"""Phase 3 selector helpers for the Crawl Plan Protocol.

Provides loading, validation, and querying of ``selectors.yaml`` files that
specify how to extract structured fields from HTML fixtures.

**Phase 1 status (STUB):** The public API is declared here so that
``__init__.py`` can export it and Phase 4 tests can import it.  The full
implementation (running selectors against BeautifulSoup trees, computing
``fixture_yield``, YAML schema validation) is delivered in Phase 3.

Crawl Plan Protocol: Phase 3 — SELECTOR SPEC
"""

from __future__ import annotations

from typing import Any, Optional


class SelectorMap:
    """Holds the parsed contents of a ``selectors.yaml`` file.

    A selector map describes, per page-type (e.g. ``PT-03-route-detail``), a
    mapping of field name → field definition dict.  Field definition keys
    (following Phase 3 selectors.yaml format):

    - ``selector``: CSS selector string
    - ``attr``: Optional attribute to extract (default: inner text)
    - ``regex``: Optional regex applied to the extracted string
    - ``parse_as``: Optional type coercion ("float", "int", "str")
    - ``bounds``: Optional ``[min, max]`` for numeric fields
    - ``required``: ``true`` / ``false`` — drives :class:`.parser.SchemaViolation`
    - ``fixture_yield``: e.g. ``"5/5"`` — recorded after Phase 3 validation
    - ``derived``: Alternative extraction mode (e.g. ``"url_regex"``)
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

    **STUB — Phase 3 full implementation.**  In Phase 1 this function raises
    ``NotImplementedError``; Phase 3 will implement YAML loading plus schema
    validation.

    Args:
        path: Filesystem path to the ``selectors.yaml`` file.

    Returns:
        :class:`SelectorMap` instance.

    Raises:
        NotImplementedError: Always in Phase 1.
        FileNotFoundError: In Phase 3, when *path* does not exist.
        ValueError: In Phase 3, when the YAML fails schema validation.
    """
    raise NotImplementedError(
        "load_selectors() is a Phase 3 deliverable.  "
        "The Phase 1 stub raises NotImplementedError intentionally."
    )
