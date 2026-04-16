"""Scenic Byways ingest and overlap reconciliation tests."""

from __future__ import annotations

from scripts.curation.pipeline.sources.scenic_byways import (
    _load_fhwa_routes,
    _load_feature_records,
    _route_from_feature,
    load_routes,
    reconcile_with_fhwa,
)


def test_scenic_byways_ingest_emits_required_metadata() -> None:
    routes = load_routes()

    assert len(routes) == 3

    for route in routes:
        assert route.route_id
        assert route.name
        assert route.state
        assert route.source == "scenic_byways"
        assert route.location
        assert route.designation
        assert route.description
        assert route.source_label == "America's Byways"
        assert route.source_url


def test_scenic_byways_prefers_gis_geometry_on_fhwa_overlap() -> None:
    scenic_routes = [_route_from_feature(feature) for feature in _load_feature_records()]
    fhwa_routes = _load_fhwa_routes()
    reconciled = reconcile_with_fhwa(scenic_routes, fhwa_routes)

    coronado = next(route for route in reconciled if route.name == "Coronado Trail Scenic Byway")
    fhwa_match = next(route for route in fhwa_routes if route.name == "Coronado Trail Scenic Byway")

    assert coronado.route_id == fhwa_match.route_id
    assert coronado.location == {
        "type": "Point",
        "coordinates": [-109.3761, 33.7427],
    }
    assert coronado.centroid_lat == 33.7427
    assert coronado.centroid_lng == -109.3761
    assert (coronado.centroid_lat, coronado.centroid_lng) != (
        fhwa_match.centroid_lat,
        fhwa_match.centroid_lng,
    )
