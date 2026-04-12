"""Tests for FHWA CSV ingestion module.

TDD Phase: RED for AC-1, AC-2, AC-3, AC-4
"""

from pathlib import Path
import pytest

FIXTURES_DIR = Path(__file__).parent.parent / "fixtures"

# Path where the real FHWA dataset should be placed
# This is documented for users who want to run the full dataset test
REAL_FHWA_CSV_PATH = Path(__file__).parent.parent.parent / "data" / "raw" / "fhwa_byways.csv"


def test_parse_fhwa_csv_returns_route_objects_with_required_fields():
    """AC-1: parse_fhwa_csv returns Route objects with required fields.

    GIVEN: a valid FHWA CSV file at a known path
    WHEN: parse_fhwa_csv(path) is called
    THEN: it returns a list of Route objects where each Route has
          route_id, name, state, centroid_lat, centroid_lng, length_miles
          populated, and source equals "fhwa"
    """
    # GIVEN: a valid FHWA sample CSV
    path = str(FIXTURES_DIR / "fhwa_sample.csv")

    # WHEN: parse_fhwa_csv is called
    # This will fail because the module doesn't exist yet
    from scripts.curation.pipeline.sources.fhwa import parse_fhwa_csv

    routes = parse_fhwa_csv(path)

    # THEN: returns Route objects with required fields and source="fhwa"
    assert len(routes) > 0, "Should return at least one route"
    for route in routes:
        assert route.source == "fhwa", f"Route source should be 'fhwa', got {route.source}"
        assert route.route_id, "Route should have a route_id"
        assert route.name, "Route should have a name"
        assert route.state, "Route should have a state"
        assert isinstance(route.centroid_lat, float), "centroid_lat should be float"
        assert isinstance(route.centroid_lng, float), "centroid_lng should be float"


@pytest.mark.skipif(
    not REAL_FHWA_CSV_PATH.exists(),
    reason=f"Real FHWA CSV not found at {REAL_FHWA_CSV_PATH}"
)
def test_parse_fhwa_csv_returns_184_routes_for_full_dataset():
    """AC-2: parse_fhwa_csv returns exactly 184 routes for the full dataset.

    GIVEN: the full FHWA National Scenic Byways CSV (184 data rows)
    WHEN: parse_fhwa_csv(path) is called
    THEN: the returned list has exactly 184 Route objects, all with source="fhwa"
    """
    from scripts.curation.pipeline.sources.fhwa import parse_fhwa_csv

    # GIVEN: the full FHWA dataset
    path = str(REAL_FHWA_CSV_PATH)

    # WHEN: parse_fhwa_csv is called
    routes = parse_fhwa_csv(path)

    # THEN: returns exactly 184 routes
    assert len(routes) == 184, f"Expected 184 routes, got {len(routes)}"

    # AND: all routes have source="fhwa"
    for route in routes:
        assert route.source == "fhwa", f"Route source should be 'fhwa', got {route.source}"


def test_parse_fhwa_csv_skips_rows_with_missing_required_fields():
    """AC-3: parse_fhwa_csv skips rows with missing required fields.

    GIVEN: a CSV where one row is missing a required field (e.g., empty name or lat)
    WHEN: parse_fhwa_csv(path) is called
    THEN: the malformed row is skipped (not raised as an exception),
          a warning is logged, and the returned list contains only the valid rows
    """
    import tempfile
    import csv
    from scripts.curation.pipeline.sources.fhwa import parse_fhwa_csv

    # GIVEN: a CSV with one valid row and one row missing a required field
    with tempfile.NamedTemporaryFile(mode='w', suffix='.csv', delete=False, encoding='utf-8-sig') as f:
        writer = csv.writer(f)
        writer.writerow(['RouteName', 'State', 'CentroidLat', 'CentroidLng', 'LengthMiles'])
        writer.writerow(['Valid Route', 'CA', '36.0', '-121.0', '100.0'])  # Valid
        writer.writerow(['', 'NV', '37.0', '-122.0', '50.0'])  # Missing name
        temp_path = f.name

    try:
        # WHEN: parse_fhwa_csv is called
        routes = parse_fhwa_csv(temp_path)

        # THEN: only the valid row is returned
        assert len(routes) == 1, f"Expected 1 route (invalid row skipped), got {len(routes)}"
        assert routes[0].name == 'Valid Route'
        assert routes[0].state == 'CA'
    finally:
        import os
        os.unlink(temp_path)


def test_parse_fhwa_csv_skips_rows_with_unparseable_lat_lng():
    """AC-4: parse_fhwa_csv skips rows with unparseable lat/lng.

    GIVEN: a CSV where one row has a non-numeric value in the lat or lng column
    WHEN: parse_fhwa_csv(path) is called
    THEN: that row is skipped with a logged warning, no ValueError is raised,
          and valid rows are still returned
    """
    import tempfile
    import csv
    from scripts.curation.pipeline.sources.fhwa import parse_fhwa_csv

    # GIVEN: a CSV with one valid row and one row with non-numeric lat
    with tempfile.NamedTemporaryFile(mode='w', suffix='.csv', delete=False, encoding='utf-8-sig') as f:
        writer = csv.writer(f)
        writer.writerow(['RouteName', 'State', 'CentroidLat', 'CentroidLng', 'LengthMiles'])
        writer.writerow(['Valid Route', 'CA', '36.0', '-121.0', '100.0'])  # Valid
        writer.writerow(['Invalid Lat Route', 'NV', 'N/A', '-122.0', '50.0'])  # Invalid lat
        temp_path = f.name

    try:
        # WHEN: parse_fhwa_csv is called (should not raise ValueError)
        routes = parse_fhwa_csv(temp_path)

        # THEN: only the valid row is returned
        assert len(routes) == 1, f"Expected 1 route (invalid row skipped), got {len(routes)}"
        assert routes[0].name == 'Valid Route'
        assert routes[0].state == 'CA'
    finally:
        import os
        os.unlink(temp_path)
