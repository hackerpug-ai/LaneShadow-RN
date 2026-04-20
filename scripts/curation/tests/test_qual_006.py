"""Tests for QUAL-006 fetch_all_routes Convex bridge."""

from __future__ import annotations

import json

import pytest
import responses
from scripts.curation.pipeline.dedup.semantic_deduplicator import fetch_all_routes
from scripts.curation.pipeline.models import Route
from scripts.curation.pipeline.sync.convex_fetch import ConfigurationError


def _route_doc(route_id: str) -> dict[str, object]:
    return {
        "routeId": route_id,
        "name": f"Route {route_id}",
        "state": "TN",
        "source": "FHWA",
        "centroidLat": 35.5,
        "centroidLng": -83.5,
        "candidateIdentifiers": [f"id-{route_id}"],
    }


def _request_json(call: responses.Call) -> dict[str, object]:
    body = call.request.body
    if isinstance(body, bytes):
        return json.loads(body.decode("utf-8"))
    if isinstance(body, str):
        return json.loads(body)
    raise TypeError(f"unexpected request body type: {type(body)!r}")


@responses.activate
def test_fetch_all_routes_makes_http_call() -> None:
    """AC1: mock POST to curationAdmin:getAllCuratedRoutes, verify 5 Route objects returned."""
    base_url = "https://example.convex.site"
    url = f"{base_url}/api/run/curationAdmin:getAllCuratedRoutes"

    responses.add(
        responses.POST,
        url,
        json={
            "status": "success",
            "value": {
                "page": [_route_doc(f"r{i}") for i in range(1, 6)],
                "continueCursor": None,
                "isDone": True,
            },
        },
        status=200,
    )

    routes = fetch_all_routes(base_url, "deploy-key")

    assert len(routes) == 5
    assert all(isinstance(route, Route) for route in routes)
    assert len(responses.calls) == 1
    assert responses.calls[0].request.url == url
    assert _request_json(responses.calls[0]) == {
        "args": {"cursor": None, "numItems": 1000},
    }


@responses.activate
def test_fetch_all_routes_paginates() -> None:
    """AC2: mock 3 pages (2,2,1 routes), verify 3 POST requests and 5 routes total."""
    base_url = "https://example.convex.site"
    url = f"{base_url}/api/run/curationAdmin:getAllCuratedRoutes"

    responses.add(
        responses.POST,
        url,
        json={
            "status": "success",
            "value": {
                "page": [_route_doc("r1"), _route_doc("r2")],
                "continueCursor": "cursor-1",
                "isDone": False,
            },
        },
        status=200,
    )
    responses.add(
        responses.POST,
        url,
        json={
            "status": "success",
            "value": {
                "page": [_route_doc("r3"), _route_doc("r4")],
                "continueCursor": "cursor-2",
                "isDone": False,
            },
        },
        status=200,
    )
    responses.add(
        responses.POST,
        url,
        json={
            "status": "success",
            "value": {
                "page": [_route_doc("r5")],
                "continueCursor": None,
                "isDone": True,
            },
        },
        status=200,
    )

    routes = fetch_all_routes(base_url, "deploy-key")

    assert len(routes) == 5
    assert [route.route_id for route in routes] == ["r1", "r2", "r3", "r4", "r5"]
    assert len(responses.calls) == 3

    assert _request_json(responses.calls[0]) == {
        "args": {"cursor": None, "numItems": 1000},
    }
    assert _request_json(responses.calls[1]) == {
        "args": {"cursor": "cursor-1", "numItems": 1000},
    }
    assert _request_json(responses.calls[2]) == {
        "args": {"cursor": "cursor-2", "numItems": 1000},
    }


@responses.activate
def test_fetch_all_routes_respects_limit() -> None:
    """AC3: mock 100 routes, pass limit=10, verify <=10 returned."""
    base_url = "https://example.convex.site"
    url = f"{base_url}/api/run/curationAdmin:getAllCuratedRoutes"

    responses.add(
        responses.POST,
        url,
        json={
            "status": "success",
            "value": {
                "page": [_route_doc(f"r{i}") for i in range(1, 101)],
                "continueCursor": None,
                "isDone": True,
            },
        },
        status=200,
    )

    routes = fetch_all_routes(base_url, "deploy-key", limit=10)

    assert len(routes) <= 10
    assert len(routes) == 10
    assert [route.route_id for route in routes] == [f"r{i}" for i in range(1, 11)]
    assert len(responses.calls) == 1
    assert _request_json(responses.calls[0]) == {
        "args": {"cursor": None, "numItems": 1000},
    }


@pytest.mark.parametrize("deploy_key", ["", None])
def test_fetch_all_routes_missing_key_raises(deploy_key: str | None) -> None:
    """AC4: empty deploy key should raise ConfigurationError."""
    with pytest.raises(ConfigurationError):
        fetch_all_routes("https://example.convex.site", deploy_key)
