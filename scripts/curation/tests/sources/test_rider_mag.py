"""Rider Magazine ingest tests."""

from __future__ import annotations

import json

from scripts.curation.pipeline.sources.rider_mag import (
    AUDIT_PATH,
    OUTPUT_PATH,
    SOURCE_COLLECTION,
    SOURCE_LABEL,
    SOURCE_ORDERING_NOTE,
    GROUND_TRUTH_SOURCE,
    load_routes,
    main,
    parse_source_article,
    _load_source_article,
)


def test_rider_mag_ingest_emits_exactly_fifty_records() -> None:
    sections = parse_source_article(_load_source_article())
    routes = load_routes()

    assert len(sections) == 50
    assert len(routes) == 50
    assert [getattr(route, "editorial_rank") for route in routes] == list(range(1, 51))

    output = main()
    assert output == OUTPUT_PATH
    assert output.is_file()
    assert AUDIT_PATH.is_file()

    lines = [json.loads(line) for line in output.read_text(encoding="utf-8").splitlines() if line.strip()]
    assert len(lines) == 50

    for record in lines:
        assert record["name"]
        assert record["state"]
        assert record["description"]
        assert record["source"] == "editorial"
        assert record["source_label"] == SOURCE_LABEL
        assert record["designation"] == SOURCE_COLLECTION
        assert record["ground_truth"] is True
        assert record["ground_truth_source"] == GROUND_TRUTH_SOURCE
        assert record["source_rank_kind"] == "alphabetical_by_state_order"
        assert record["source_url"].startswith("https://ridermagazine.com/2024/12/17/50-best-motorcycle-roads-in-america/#")
        assert len(record["source_refs"]) == 2


def test_rider_mag_records_include_ground_truth_metadata() -> None:
    routes = load_routes()
    route = routes[0]

    assert route.source == "editorial"
    assert route.description
    assert route.designation == SOURCE_COLLECTION
    assert route.source_label == SOURCE_LABEL
    assert getattr(route, "ground_truth") is True
    assert getattr(route, "ground_truth_source") == GROUND_TRUTH_SOURCE
    assert getattr(route, "ground_truth_provider") == "rider_mag"
    assert getattr(route, "source_rank_kind") == "alphabetical_by_state_order"
    assert getattr(route, "editorial_rank") == 1
    assert getattr(route, "source_rank") == 1
    assert getattr(route, "source_collection") == SOURCE_COLLECTION
    assert getattr(route, "ground_truth_notes") == SOURCE_ORDERING_NOTE
    assert getattr(route, "related_article_url").startswith("https://ridermagazine.com/")

    lines = [json.loads(line) for line in main().read_text(encoding="utf-8").splitlines() if line.strip()]
    assert all(record["ground_truth"] for record in lines)
    assert {record["ground_truth_source"] for record in lines} == {GROUND_TRUTH_SOURCE}
    assert {record["source_rank_kind"] for record in lines} == {"alphabetical_by_state_order"}
    assert lines[13]["name"] == "Route 66"
    assert lines[13]["editorial_rank"] == 14
    assert lines[13]["state_raw"] == "Illinois, Missouri, Oklahoma, Texas, New Mexico, Arizona, California"
