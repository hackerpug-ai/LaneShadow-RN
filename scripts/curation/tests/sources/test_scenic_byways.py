"""Scenic Byways ingest and overlap reconciliation tests."""

from __future__ import annotations

import json

from scripts.curation.pipeline.sources.scenic_byways import (
    AUDIT_PATH,
    _load_fhwa_routes,
    _load_inventory,
    _load_manifest,
    _load_selectors,
    _extract_feature,
    _resolve_fixture_path,
    _route_from_extracted,
    load_routes,
    main,
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

    output = main()
    assert output.is_file()
    assert AUDIT_PATH.is_file()
    audit = json.loads(AUDIT_PATH.read_text(encoding="utf-8"))
    assert audit["inventory_size"] == 3
    assert audit["written"] == 3


def test_scenic_byways_prefers_gis_geometry_on_fhwa_overlap() -> None:
    manifest = _load_manifest()
    selectors = _load_selectors()
    scenic_routes = []
    for row in _load_inventory():
        fixture_path = _resolve_fixture_path(row, manifest)
        payload = json.loads(fixture_path.read_text(encoding="utf-8"))
        extracted = _extract_feature(payload, selectors, row["canonical_url"])
        extracted["length_miles"] = payload.get("length_miles")
        extracted["source_refs"] = payload.get("source_refs", [])
        scenic_routes.append(_route_from_extracted(extracted))
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
