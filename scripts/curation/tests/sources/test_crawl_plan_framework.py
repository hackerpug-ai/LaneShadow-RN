"""Unit tests for the crawl_plan framework — Phase 1 coverage.

Covers:
- canonicalize(): scheme/host lowercased, path case preserved, trailing slash
  stripped, query/fragment dropped, idempotent.
- classify(): first-match wins, returns None for no-match, handles regex.
- InventoryRow: serialization round-trip (dict ↔ dataclass).
- parse_with_selectors() stub: returns dict with state_primary + states_all
  fields; raises SchemaViolation for required-field null.
- discover(): given a fake fetch_fn returning a page with 5 links (3 matching
  patterns, 2 noise), returns 3 deduplicated InventoryRows.

Run:
    PYTHONPATH=$(pwd) .venv/bin/python -m pytest scripts/curation/tests/sources/test_crawl_plan_framework.py -v
"""

from __future__ import annotations

import pytest

from scripts.curation.pipeline.sources.crawl_plan.inventory import (
    InventoryRow,
    canonicalize,
    classify,
    discover,
)
from scripts.curation.pipeline.sources.crawl_plan.parser import (
    SchemaViolation,
    parse_with_selectors,
)
from scripts.curation.pipeline.sources.crawl_plan.selector_map import SelectorMap
from scripts.curation.pipeline.sources.crawl_plan.us_states import (
    US_STATES,
    is_us_state,
    normalize_state_primary,
    slugify_state_name,
)


# ---------------------------------------------------------------------------
# canonicalize()
# ---------------------------------------------------------------------------

class TestCanonicalize:
    """canonicalize() must preserve path case, lowercase scheme+host only."""

    def test_lowercases_scheme_and_host(self):
        result = canonicalize("HTTPS://WWW.MOTORCYCLEROADS.COM/motorcycle-roads/tennessee/deals-gap")
        assert result.startswith("https://www.motorcycleroads.com/")

    def test_preserves_path_case(self):
        """Mixed-case path segments must NOT be lowercased (BBR Columbia-2 case)."""
        url = "https://www.example.com/Alabama/Columbia-2"
        result = canonicalize(url)
        assert "Alabama/Columbia-2" in result

    def test_path_case_bbr_scenario(self):
        """canonicalize('/alabama/Columbia-2/') must preserve Columbia-2 case."""
        url = "https://www.bestbikingroads.com/alabama/Columbia-2/"
        result = canonicalize(url)
        # Path case preserved; trailing slash stripped
        assert result == "https://www.bestbikingroads.com/alabama/Columbia-2"

    def test_distinct_case_variants_are_different(self):
        """Columbia-2 and columbia-2 must NOT collapse to the same canonical URL."""
        upper = canonicalize("https://www.bestbikingroads.com/alabama/Columbia-2/")
        lower = canonicalize("https://www.bestbikingroads.com/alabama/columbia-2/")
        assert upper != lower, (
            "canonicalize() is collapsing distinct case variants — "
            "this would silently erase distinct BBR routes"
        )

    def test_strips_trailing_slash_from_path(self):
        url = "https://www.motorcycleroads.com/motorcycle-roads/tennessee/deals-gap/"
        result = canonicalize(url)
        assert not result.endswith("/")
        assert "deals-gap" in result

    def test_preserves_root_slash(self):
        """Root path '/' should be kept as-is (no double slash, no strip)."""
        url = "https://www.motorcycleroads.com/"
        result = canonicalize(url)
        assert result == "https://www.motorcycleroads.com/"

    def test_drops_query_string(self):
        url = "https://www.motorcycleroads.com/motorcycle-rides-in/united-states?page=5&utm=foo"
        result = canonicalize(url)
        assert "?" not in result
        assert "page" not in result

    def test_drops_fragment(self):
        url = "https://www.example.com/some/path#section"
        result = canonicalize(url)
        assert "#" not in result

    def test_idempotent(self):
        """Applying canonicalize twice must return the same result."""
        url = "https://WWW.EXAMPLE.COM/Alabama/Columbia-2/?foo=bar"
        once = canonicalize(url)
        twice = canonicalize(once)
        assert once == twice

    def test_no_query_no_mutation(self):
        """A URL already in canonical form should be returned unchanged."""
        url = "https://www.motorcycleroads.com/motorcycle-roads/tennessee/deals-gap"
        result = canonicalize(url)
        assert result == url


# ---------------------------------------------------------------------------
# classify()
# ---------------------------------------------------------------------------

class TestClassify:
    """classify() returns first-match page_type or None."""

    PATTERNS = [
        (r"^https://www\.motorcycleroads\.com/motorcycle-roads/[a-z-]+/[a-z0-9-]+$",
         "PT-03-route-detail"),
        (r"^https://www\.motorcycleroads\.com/motorcycle-rides-in/",
         "PT-01-or-02-listing"),
    ]

    def test_matches_first_pattern(self):
        url = "https://www.motorcycleroads.com/motorcycle-roads/tennessee/deals-gap"
        assert classify(url, self.PATTERNS) == "PT-03-route-detail"

    def test_matches_second_pattern_when_first_fails(self):
        url = "https://www.motorcycleroads.com/motorcycle-rides-in/united-states"
        assert classify(url, self.PATTERNS) == "PT-01-or-02-listing"

    def test_returns_none_for_no_match(self):
        url = "https://www.motorcycleroads.com/places/some-place"
        assert classify(url, self.PATTERNS) is None

    def test_first_match_wins(self):
        """When multiple patterns could match, first one wins."""
        # Both patterns match this URL if we extend PATTERNS
        patterns = [
            (r"specific", "specific-type"),
            (r".*", "catch-all"),
        ]
        assert classify("specific-and-more", patterns) == "specific-type"

    def test_empty_patterns_returns_none(self):
        assert classify("https://www.example.com/foo", []) is None

    def test_pattern_with_capture_groups(self):
        """Capture groups in regex are fine — we only care about match/no-match."""
        patterns = [
            (r"/motorcycle-roads/([a-z-]+)/([a-z0-9-]+)$", "PT-03-route-detail"),
        ]
        url = "https://www.motorcycleroads.com/motorcycle-roads/tennessee/deals-gap"
        assert classify(url, patterns) == "PT-03-route-detail"

    def test_editorial_one_segment_rejected(self):
        """PT-05 editorial articles (1 path segment after /motorcycle-roads/) must not match PT-03."""
        pt03_pattern = [
            (r"/motorcycle-roads/[a-z-]+/[a-z0-9-]+$", "PT-03-route-detail"),
        ]
        editorial = "https://www.motorcycleroads.com/motorcycle-roads/top-10-rides-northeast"
        assert classify(editorial, pt03_pattern) is None


# ---------------------------------------------------------------------------
# InventoryRow serialization
# ---------------------------------------------------------------------------

class TestInventoryRowSerialization:
    """InventoryRow must round-trip through dict ↔ dataclass."""

    SAMPLE = InventoryRow(
        page_type="PT-03-route-detail",
        url="https://www.motorcycleroads.com/motorcycle-roads/tennessee/deals-gap/",
        canonical_url="https://www.motorcycleroads.com/motorcycle-roads/tennessee/deals-gap",
        discovered_from="https://www.motorcycleroads.com/motorcycle-rides-in/united-states",
        first_seen="2026-04-13T15:22:03Z",
    )

    def test_to_dict_has_all_fields(self):
        d = self.SAMPLE.to_dict()
        assert set(d.keys()) == {
            "page_type", "url", "canonical_url", "discovered_from", "first_seen"
        }

    def test_to_dict_values_correct(self):
        d = self.SAMPLE.to_dict()
        assert d["page_type"] == "PT-03-route-detail"
        assert d["canonical_url"] == "https://www.motorcycleroads.com/motorcycle-roads/tennessee/deals-gap"

    def test_from_dict_round_trip(self):
        d = self.SAMPLE.to_dict()
        reconstructed = InventoryRow.from_dict(d)
        assert reconstructed == self.SAMPLE

    def test_from_dict_preserves_all_fields(self):
        d = {
            "page_type": "PT-01-listing",
            "url": "https://www.motorcycleroads.com/motorcycle-rides-in/united-states?page=1",
            "canonical_url": "https://www.motorcycleroads.com/motorcycle-rides-in/united-states",
            "discovered_from": "https://www.motorcycleroads.com/motorcycle-rides-in/united-states",
            "first_seen": "2026-04-13T10:00:00Z",
        }
        row = InventoryRow.from_dict(d)
        assert row.page_type == "PT-01-listing"
        assert row.url == d["url"]
        assert row.canonical_url == d["canonical_url"]


# ---------------------------------------------------------------------------
# parse_with_selectors() stub
# ---------------------------------------------------------------------------

class TestParseWithSelectors:
    """parse_with_selectors() must return dict with state_primary + states_all."""

    def _make_selector_map(self, required_fields=None, optional_fields=None):
        """Build a minimal SelectorMap for testing."""
        fields = {}
        for f in (required_fields or []):
            fields[f] = {"selector": f".{f}", "required": True}
        for f in (optional_fields or []):
            fields[f] = {"selector": f".{f}", "required": False}
        return SelectorMap({"PT-03-route-detail": fields})

    def test_returns_dict_with_state_primary(self):
        sm = self._make_selector_map()
        record = parse_with_selectors(
            html="<html></html>",
            selector_map=sm,
            page_type="PT-03-route-detail",
            url="https://www.motorcycleroads.com/motorcycle-roads/tennessee/deals-gap",
            url_derived_fields={"state_primary": "tennessee"},
        )
        assert "state_primary" in record
        assert record["state_primary"] == "tennessee"

    def test_returns_dict_with_states_all(self):
        sm = self._make_selector_map()
        record = parse_with_selectors(
            html="<html></html>",
            selector_map=sm,
            page_type="PT-03-route-detail",
            url="https://www.motorcycleroads.com/motorcycle-roads/tennessee/deals-gap",
            url_derived_fields={"state_primary": "tennessee"},
        )
        assert "states_all" in record
        assert isinstance(record["states_all"], list)

    def test_states_all_contains_state_primary(self):
        """states_all must contain a title-case form of state_primary.

        state_primary is a URL slug (e.g. 'tennessee') while states_all
        contains proper names (e.g. 'Tennessee').  The contract is that
        the title-cased version of state_primary is always in states_all
        when the parser falls back to the backfill path (no meta states found).
        """
        sm = self._make_selector_map()
        record = parse_with_selectors(
            html="<html></html>",
            selector_map=sm,
            page_type="PT-03-route-detail",
            url="https://www.motorcycleroads.com/motorcycle-roads/tennessee/deals-gap",
            url_derived_fields={"state_primary": "tennessee"},
        )
        # states_all holds proper names (title case); state_primary holds URL slug
        state_primary_title = record["state_primary"].replace("-", " ").title()
        assert state_primary_title in record["states_all"], (
            f"Expected '{state_primary_title}' in states_all={record['states_all']}"
        )

    def test_raises_schema_violation_for_required_field_null(self):
        """A required field with None value must raise SchemaViolation."""
        sm = self._make_selector_map(required_fields=["route_name"])
        with pytest.raises(SchemaViolation) as exc_info:
            parse_with_selectors(
                html="<html></html>",
                selector_map=sm,
                page_type="PT-03-route-detail",
                url="https://www.motorcycleroads.com/motorcycle-roads/tennessee/deals-gap",
                url_derived_fields={},  # route_name not provided → None → SchemaViolation
            )
        assert exc_info.value.field == "route_name"
        assert exc_info.value.page_type == "PT-03-route-detail"

    def test_raises_schema_violation_when_required_url_derived_field_is_none(self):
        """required field with explicit None in url_derived_fields must raise."""
        sm = self._make_selector_map(required_fields=["state_primary"])
        with pytest.raises(SchemaViolation):
            parse_with_selectors(
                html="<html></html>",
                selector_map=sm,
                page_type="PT-03-route-detail",
                url="https://www.motorcycleroads.com/motorcycle-roads/tennessee/deals-gap",
                url_derived_fields={"state_primary": None},  # explicitly None
            )

    def test_optional_field_null_does_not_raise(self):
        """Optional fields with no value should not raise."""
        sm = self._make_selector_map(optional_fields=["description"])
        record = parse_with_selectors(
            html="<html></html>",
            selector_map=sm,
            page_type="PT-03-route-detail",
            url="https://www.motorcycleroads.com/motorcycle-roads/tennessee/deals-gap",
            url_derived_fields={"state_primary": "tennessee"},
        )
        # No exception; description should be None (stub)
        assert record.get("description") is None

    def test_schema_violation_has_field_name(self):
        sm = self._make_selector_map(required_fields=["route_name"])
        with pytest.raises(SchemaViolation) as exc_info:
            parse_with_selectors(
                html="<html></html>",
                selector_map=sm,
                page_type="PT-03-route-detail",
                url="https://www.example.com/",
                url_derived_fields={},
            )
        assert "route_name" in str(exc_info.value)


# ---------------------------------------------------------------------------
# discover()
# ---------------------------------------------------------------------------

class TestDiscover:
    """discover() must extract, classify, and deduplicate inventory rows."""

    # Three valid route-detail links + two noise links on one fake index page
    FAKE_HTML = """
    <html><body>
      <a href="https://www.motorcycleroads.com/motorcycle-roads/tennessee/deals-gap">Deals Gap</a>
      <a href="https://www.motorcycleroads.com/motorcycle-roads/california/pch">PCH</a>
      <a href="https://www.motorcycleroads.com/motorcycle-roads/virginia/blue-ridge-parkway">Blue Ridge</a>
      <a href="https://www.motorcycleroads.com/places/some-place">Some Place</a>
      <a href="https://www.motorcycleroads.com/clubs/biker-club">Biker Club</a>
    </body></html>
    """

    PATTERNS = [
        (
            r"https://www\.motorcycleroads\.com/motorcycle-roads/[a-z-]+/[a-z0-9-]+$",
            "PT-03-route-detail",
        )
    ]

    def _fetch_fn(self, url: str) -> str:
        return self.FAKE_HTML

    def _link_extractor(self, html: str, source_url: str) -> list[str]:
        from bs4 import BeautifulSoup
        soup = BeautifulSoup(html, "html.parser")
        return [a["href"] for a in soup.find_all("a", href=True)]

    def test_returns_three_matching_rows(self):
        rows = discover(
            index_urls=["https://www.motorcycleroads.com/motorcycle-rides-in/united-states"],
            patterns=self.PATTERNS,
            fetch_fn=self._fetch_fn,
            link_extractor=self._link_extractor,
        )
        assert len(rows) == 3

    def test_all_rows_are_inventory_row(self):
        rows = discover(
            index_urls=["https://www.motorcycleroads.com/motorcycle-rides-in/united-states"],
            patterns=self.PATTERNS,
            fetch_fn=self._fetch_fn,
            link_extractor=self._link_extractor,
        )
        for row in rows:
            assert isinstance(row, InventoryRow)

    def test_page_type_is_correct(self):
        rows = discover(
            index_urls=["https://www.motorcycleroads.com/motorcycle-rides-in/united-states"],
            patterns=self.PATTERNS,
            fetch_fn=self._fetch_fn,
            link_extractor=self._link_extractor,
        )
        for row in rows:
            assert row.page_type == "PT-03-route-detail"

    def test_deduplication(self):
        """If the same URL appears twice (two index pages returning same links), it's counted once."""
        rows = discover(
            index_urls=[
                "https://www.motorcycleroads.com/motorcycle-rides-in/united-states",
                "https://www.motorcycleroads.com/motorcycle-rides-in/united-states?page=1",
            ],
            patterns=self.PATTERNS,
            fetch_fn=self._fetch_fn,  # same HTML returned for both — same 3 routes
            link_extractor=self._link_extractor,
        )
        # After dedup, still 3 rows (not 6)
        assert len(rows) == 3

    def test_noise_links_rejected(self):
        """Links to /places/ and /clubs/ must not appear in results."""
        rows = discover(
            index_urls=["https://www.motorcycleroads.com/motorcycle-rides-in/united-states"],
            patterns=self.PATTERNS,
            fetch_fn=self._fetch_fn,
            link_extractor=self._link_extractor,
        )
        canonical_urls = {row.canonical_url for row in rows}
        assert not any("places" in u or "clubs" in u for u in canonical_urls)

    def test_reject_log_populated(self):
        """reject_log accumulates non-matching links when provided."""
        reject_log: list[dict] = []
        rows = discover(
            index_urls=["https://www.motorcycleroads.com/motorcycle-rides-in/united-states"],
            patterns=self.PATTERNS,
            fetch_fn=self._fetch_fn,
            link_extractor=self._link_extractor,
            reject_log=reject_log,
        )
        # 2 noise links → 2 reject entries
        assert len(reject_log) == 2

    def test_discovered_from_is_set(self):
        index_url = "https://www.motorcycleroads.com/motorcycle-rides-in/united-states"
        rows = discover(
            index_urls=[index_url],
            patterns=self.PATTERNS,
            fetch_fn=self._fetch_fn,
            link_extractor=self._link_extractor,
        )
        for row in rows:
            assert row.discovered_from == index_url

    def test_first_seen_is_set(self):
        rows = discover(
            index_urls=["https://www.motorcycleroads.com/motorcycle-rides-in/united-states"],
            patterns=self.PATTERNS,
            fetch_fn=self._fetch_fn,
            link_extractor=self._link_extractor,
        )
        for row in rows:
            assert row.first_seen  # non-empty string
            assert "T" in row.first_seen  # ISO-8601 format

    def test_fetch_error_skips_page(self):
        """A fetch_fn that raises must not abort the entire crawl."""
        def failing_fetch(url: str) -> str:
            raise ConnectionError("simulated network error")

        rows = discover(
            index_urls=["https://www.motorcycleroads.com/motorcycle-rides-in/united-states"],
            patterns=self.PATTERNS,
            fetch_fn=failing_fetch,
            link_extractor=self._link_extractor,
        )
        assert rows == []


# ---------------------------------------------------------------------------
# us_states module (INF-011)
# ---------------------------------------------------------------------------

class TestUSStates:
    """US_STATES allowlist is 50 states + DC = 51 canonical slugs."""

    def test_us_states_has_51_entries(self):
        # 50 states + Washington DC (federal district, treated as state-equivalent
        # slug for URL classification — see us_states.py docstring)
        assert len(US_STATES) == 51

    def test_us_states_contains_canonical_slugs(self):
        # Spot check — all hyphenated, lowercase
        for expected in ("alabama", "california", "new-york", "north-carolina", "west-virginia", "washington-dc"):
            assert expected in US_STATES

    def test_us_states_includes_dc(self):
        # Washington DC is included for inventory-classification purposes
        assert "washington-dc" in US_STATES

    def test_us_states_no_uppercase(self):
        for slug in US_STATES:
            assert slug == slug.lower()

    def test_us_states_is_frozen(self):
        # frozenset — cannot be mutated
        with pytest.raises(AttributeError):
            US_STATES.add("puerto-rico")  # type: ignore


class TestIsUSState:
    def test_canonical_state(self):
        assert is_us_state("tennessee") is True
        assert is_us_state("north-carolina") is True

    def test_non_state(self):
        assert is_us_state("east-coast") is False
        assert is_us_state("ny-jefferson-lewis") is False
        assert is_us_state("midwest") is False

    def test_none(self):
        assert is_us_state(None) is False

    def test_empty(self):
        assert is_us_state("") is False

    def test_case_sensitive(self):
        # US_STATES is lowercase; uppercase input is not accepted
        assert is_us_state("Tennessee") is False


class TestSlugifyStateName:
    def test_title_case_name(self):
        assert slugify_state_name("North Carolina") == "north-carolina"
        assert slugify_state_name("New York") == "new-york"

    def test_lowercase_name(self):
        assert slugify_state_name("north carolina") == "north-carolina"
        assert slugify_state_name("tennessee") == "tennessee"

    def test_already_hyphenated_slug(self):
        assert slugify_state_name("north-carolina") == "north-carolina"
        assert slugify_state_name("new-york") == "new-york"

    def test_non_state_returns_none(self):
        assert slugify_state_name("East coast") is None
        assert slugify_state_name("Midwest") is None
        assert slugify_state_name("New England") is None

    def test_empty_or_none(self):
        assert slugify_state_name("") is None
        assert slugify_state_name(None) is None

    def test_whitespace_trimmed(self):
        assert slugify_state_name("  Tennessee  ") == "tennessee"


class TestNormalizeStatePrimary:
    """Cascade: identity → USPS prefix → states_all fallback → None."""

    # Case 1: identity (canonical US state slug)
    def test_canonical_state_returns_self(self):
        assert normalize_state_primary("tennessee") == "tennessee"
        assert normalize_state_primary("north-carolina") == "north-carolina"

    def test_canonical_state_with_states_all_ignored(self):
        # Even with states_all, if raw_slug is canonical, case 1 wins
        assert normalize_state_primary("tennessee", ["Alabama"]) == "tennessee"

    # Case 2: USPS prefix (BBR cluster slugs)
    def test_bbr_ny_prefix(self):
        assert normalize_state_primary("ny-jefferson-lewis") == "new-york"

    def test_bbr_wa_prefix(self):
        assert normalize_state_primary("wa-adams-franklin") == "washington"

    def test_bbr_mt_prefix(self):
        assert normalize_state_primary("mt-lincoln-flathead") == "montana"

    def test_bbr_ca_prefix(self):
        assert normalize_state_primary("ca-kern-tulare") == "california"

    def test_bbr_prefix_takes_precedence_over_states_all(self):
        # Case 2 wins over Case 3
        result = normalize_state_primary(
            "ny-jefferson-lewis",
            ["California"],  # states_all says CA but prefix says NY
        )
        assert result == "new-york"

    def test_bbr_prefix_case_insensitive(self):
        # Prefix lookup is lowered
        assert normalize_state_primary("NY-Jefferson-Lewis") == "new-york"

    def test_unknown_prefix_falls_through(self):
        # "ab-" is not a USPS code; falls through to case 3 (no states_all) → None
        assert normalize_state_primary("ab-something") is None

    def test_hyphen_at_wrong_position(self):
        # "new-" is only 4 chars; slug[2]='w' not '-'; falls through
        # "east-coast" → slug[2]='s' not '-'; falls through
        assert normalize_state_primary("east-coast") is None

    # Case 3: states_all fallback
    def test_states_all_picks_first_us_state(self):
        assert normalize_state_primary(
            "east-coast",
            ["East coast", "North Carolina", "Southeast"],
        ) == "north-carolina"

    def test_states_all_with_region_and_state(self):
        # Great Lakes is not a state; Michigan is
        assert normalize_state_primary(
            "great-lakes",
            ["Great Lakes", "Michigan"],
        ) == "michigan"

    def test_states_all_all_regions_returns_none(self):
        # None of these are US states
        assert normalize_state_primary(
            "midwest",
            ["Midwest"],
        ) is None

    def test_states_all_first_match_wins(self):
        # "Pacific Coast" is not a state; "Oregon" is
        assert normalize_state_primary(
            "pacific-coast",
            ["Pacific Coast", "Oregon", "Washington", "California"],
        ) == "oregon"

    def test_states_all_empty_list(self):
        assert normalize_state_primary("east-coast", []) is None

    # Case 4: None
    def test_none_input(self):
        assert normalize_state_primary(None) is None
        assert normalize_state_primary(None, ["Tennessee"]) is None

    def test_pure_region_no_states_all(self):
        assert normalize_state_primary("southeast") is None


class TestParserNormalizesStatePrimary:
    """parse_with_selectors() post-normalizes non-canonical state_primary."""

    def _make_map(self) -> SelectorMap:
        # Mirror the production MR selector map: state_primary URL-derived,
        # states_all extracted from meta description via the parser's
        # built-in _extract_states_from_meta special-case.
        return SelectorMap({
            "PT-03-route-detail": {
                "route_name": {"selector": "h1", "required": True, "parse_as": "str"},
                "state_primary": {
                    "derived": "url_regex",
                    "pattern": r"/motorcycle-roads/([a-z-]+)/",
                    "capture_group": 1,
                    "required": True,
                    "parse_as": "str",
                },
                "states_all": {
                    "selector": "meta[name='description']",
                    "required": False,
                    "parse_as": "state_list",
                },
            }
        })

    def test_mr_east_coast_normalized_via_states_all(self):
        # MR record with region slug but states_all has NC
        sel_map = self._make_map()
        html = (
            "<html><body><h1>Devils Racetrack - North Carolina</h1>"
            '<meta name="description" '
            'content="Devils Racetrack - NC | Ref #42 | East coast,North Carolina,United States,Southeast">'
            "</body></html>"
        )
        url = "https://www.motorcycleroads.com/motorcycle-roads/east-coast/devils-racetrack-north-carolina"
        record = parse_with_selectors(html, sel_map, "PT-03-route-detail", url)
        assert record["state_primary"] == "north-carolina"
        # North Carolina should be at the front of states_all after normalization
        assert "North Carolina" in record["states_all"]

    def test_bbr_cluster_slug_normalized_via_prefix(self):
        # BBR record with ny-jefferson-lewis cluster slug
        sel_map = self._make_map()
        html = '<html><body><h1>Buffalo - Pennsylvania Loop</h1></body></html>'
        url = "https://www.bestbikingroads.com/motorcycle-roads/ny-jefferson-lewis/ride/buffalo-pennsylvania-loop"
        record = parse_with_selectors(html, sel_map, "PT-03-route-detail", url)
        assert record["state_primary"] == "new-york"

    def test_canonical_state_unchanged(self):
        # Tennessee passes through without modification
        sel_map = self._make_map()
        html = (
            '<html><body><h1>Tail of the Dragon</h1>'
            '<meta name="description" content="Tail of the Dragon | Ref #1 | Tennessee,United States">'
            "</body></html>"
        )
        url = "https://www.motorcycleroads.com/motorcycle-roads/tennessee/tail-of-the-dragon"
        record = parse_with_selectors(html, sel_map, "PT-03-route-detail", url)
        assert record["state_primary"] == "tennessee"

    def test_unmappable_region_preserved(self):
        # "midwest" with no states_all US entries — state_primary stays as-is
        sel_map = self._make_map()
        html = '<html><body><h1>Elk River Route</h1></body></html>'
        url = "https://www.motorcycleroads.com/motorcycle-roads/midwest/elk-river"
        record = parse_with_selectors(html, sel_map, "PT-03-route-detail", url)
        # Without a states_all US match, state_primary remains "midwest" (unfixable)
        assert record["state_primary"] == "midwest"
