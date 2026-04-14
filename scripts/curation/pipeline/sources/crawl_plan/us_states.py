"""US states allowlist and slug normalization helpers.

Framework-general support for classifying source records as US-state-canonical
or non-canonical.  Consumed by the parser's post-extraction normalization pass
(``parse_with_selectors``) and by the standalone ``fix_regional.py`` script that
retroactively normalizes existing staging files.

INF-011 — closes out the MR/BBR region-aggregator follow-up from BASE-009a/b.
See ``epic-03-foundation-models-schema/INF-011-us-states-allowlist.md`` for the
original stub and ``epic-02-baseline-pipeline-validation/DECISIONS.md`` Phase 0
findings for why this work exists.

Crawl Plan Protocol: framework-level support (not tied to a single phase).
"""

from __future__ import annotations


# Canonical US state slugs — lowercase, hyphenated (e.g. "new-york", "north-carolina").
# This is the single source of truth for "what is a valid primary state slug"
# across the entire framework.  Consumed by classify() callers, parser.py
# post-processing, and the fix_regional.py retroactive-normalization script.
#
# **Includes Washington DC.**  DC is strictly a federal district, not a state,
# but BBR (and other sources) publish DC routes under the slug ``washington-dc``
# as a state-equivalent URL path segment.  For the inventory-classification
# purpose of this set, DC is treated as a valid primary locale.  If a future
# consumer needs 50-state-only semantics, filter ``US_STATES - {"washington-dc"}``
# at the call site.  Total: 51 entries (50 states + DC).
US_STATES: frozenset[str] = frozenset({
    "alabama", "alaska", "arizona", "arkansas", "california", "colorado",
    "connecticut", "delaware", "florida", "georgia", "hawaii", "idaho",
    "illinois", "indiana", "iowa", "kansas", "kentucky", "louisiana",
    "maine", "maryland", "massachusetts", "michigan", "minnesota",
    "mississippi", "missouri", "montana", "nebraska", "nevada",
    "new-hampshire", "new-jersey", "new-mexico", "new-york",
    "north-carolina", "north-dakota", "ohio", "oklahoma", "oregon",
    "pennsylvania", "rhode-island", "south-carolina", "south-dakota",
    "tennessee", "texas", "utah", "vermont", "virginia", "washington",
    "west-virginia", "wisconsin", "wyoming",
    "washington-dc",  # federal district; see docstring above
})


# 2-letter USPS abbreviation → canonical slug.  Used to normalize BBR cluster
# slugs of the form ``{uspsabbr}-{county1}-{county2}`` (e.g. "ny-jefferson-lewis"
# → "new-york").  Keys are lowercase for case-insensitive matching.
_USPS_TO_SLUG: dict[str, str] = {
    "al": "alabama", "ak": "alaska", "az": "arizona", "ar": "arkansas",
    "ca": "california", "co": "colorado", "ct": "connecticut",
    "dc": "washington-dc",
    "de": "delaware", "fl": "florida", "ga": "georgia", "hi": "hawaii",
    "id": "idaho", "il": "illinois", "in": "indiana", "ia": "iowa",
    "ks": "kansas", "ky": "kentucky", "la": "louisiana", "me": "maine",
    "md": "maryland", "ma": "massachusetts", "mi": "michigan",
    "mn": "minnesota", "ms": "mississippi", "mo": "missouri",
    "mt": "montana", "ne": "nebraska", "nv": "nevada",
    "nh": "new-hampshire", "nj": "new-jersey", "nm": "new-mexico",
    "ny": "new-york", "nc": "north-carolina", "nd": "north-dakota",
    "oh": "ohio", "ok": "oklahoma", "or": "oregon", "pa": "pennsylvania",
    "ri": "rhode-island", "sc": "south-carolina", "sd": "south-dakota",
    "tn": "tennessee", "tx": "texas", "ut": "utah", "vt": "vermont",
    "va": "virginia", "wa": "washington", "wv": "west-virginia",
    "wi": "wisconsin", "wy": "wyoming",
}


# Lowercase state name → canonical slug (e.g. "north carolina" → "north-carolina").
# Used by slugify_state_name() for case-insensitive name lookups from DOM/meta.
# Includes aliases for DC variants ("washington d.c.", "washington dc", etc.)
# so meta-description lookups that write "Washington D.C." or "Washington DC"
# still resolve correctly.
_NAME_TO_SLUG: dict[str, str] = {
    slug.replace("-", " "): slug for slug in US_STATES
}
# DC aliases (meta descriptions use "Washington D.C." or "Washington DC")
_NAME_TO_SLUG["washington d.c."] = "washington-dc"
_NAME_TO_SLUG["washington dc"] = "washington-dc"
_NAME_TO_SLUG["district of columbia"] = "washington-dc"


def is_us_state(slug: str | None) -> bool:
    """Return True if *slug* is a canonical US state slug (case-sensitive).

    Args:
        slug: Candidate state slug (hyphenated lowercase) or None.

    Returns:
        True iff *slug* is in :data:`US_STATES`.
    """
    if slug is None:
        return False
    return slug in US_STATES


def slugify_state_name(name: str | None) -> str | None:
    """Map a state name (title case or otherwise) to a canonical slug.

    Accepts both full names ("North Carolina", "north carolina") and
    already-hyphenated slugs ("north-carolina").  Whitespace is trimmed and
    the match is case-insensitive.

    Args:
        name: State name or slug; any case.

    Returns:
        Canonical slug if *name* matches a US state, else None.

    Examples::

        slugify_state_name("North Carolina")
        # -> "north-carolina"

        slugify_state_name("new york")
        # -> "new-york"

        slugify_state_name("north-carolina")
        # -> "north-carolina"

        slugify_state_name("East coast")
        # -> None

        slugify_state_name("")
        # -> None
    """
    if not name:
        return None
    key = name.strip().lower()
    # Try spelled-out name first ("north carolina")
    if key in _NAME_TO_SLUG:
        return _NAME_TO_SLUG[key]
    # Allow already-hyphenated slug input ("north-carolina")
    if key in US_STATES:
        return key
    return None


def normalize_state_primary(
    raw_slug: str | None,
    states_all: list[str] | None = None,
) -> str | None:
    """Normalize a URL-derived state slug to a canonical US state slug.

    Cascade — first match wins:

    1. **Identity.** If *raw_slug* is already a canonical US state slug, return it.
    2. **USPS-prefix mapping.** If *raw_slug* starts with a 2-letter USPS
       abbreviation followed by ``-`` (BBR cluster slug format, e.g.
       ``ny-jefferson-lewis``), map the prefix to the full state slug.
    3. **states_all fallback.** If *states_all* is provided, return the slug
       of the first entry that slugifies to a US state.
    4. **Give up.** Return None.

    Args:
        raw_slug: URL-derived slug from the route path (may be a canonical
            state, a region name, a cluster name, or None).
        states_all: Optional list of state names from DOM/meta extraction.
            Scanned in order; first US-state match wins.

    Returns:
        Canonical US state slug, or None if the slug cannot be normalized.

    Examples::

        normalize_state_primary("tennessee")
        # -> "tennessee"

        normalize_state_primary("ny-jefferson-lewis")
        # -> "new-york"

        normalize_state_primary("east-coast", ["East coast", "North Carolina", "Southeast"])
        # -> "north-carolina"

        normalize_state_primary("midwest", ["Midwest"])
        # -> None  (no US state in the list)

        normalize_state_primary(None)
        # -> None
    """
    if raw_slug is None:
        return None

    # Case 1: identity — already canonical
    if raw_slug in US_STATES:
        return raw_slug

    # Case 2: USPS prefix ({uspsabbr}-{rest})
    if len(raw_slug) >= 3 and raw_slug[2] == "-":
        prefix = raw_slug[:2].lower()
        if prefix in _USPS_TO_SLUG:
            return _USPS_TO_SLUG[prefix]

    # Case 3: states_all fallback
    if states_all:
        for name in states_all:
            slug = slugify_state_name(name)
            if slug:
                return slug

    # Case 4: give up
    return None
