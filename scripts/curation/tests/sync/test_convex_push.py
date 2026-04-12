"""Tests for pipeline/sync/convex_push.py - TDD: RED phase for AC-1"""

import pytest
import responses as responses_mock
from scripts.curation.pipeline.models import Route

# These imports will fail until we create the module - that's expected for RED
try:
    from scripts.curation.pipeline.sync.convex_push import (
        push_routes,
        PushSummary,
        ConfigurationError,
    )
    IMPORTS_AVAILABLE = True
except ImportError:
    IMPORTS_AVAILABLE = False


BASE_URL = "https://fake-convex.convex.site"
DEPLOY_KEY = "test-key-abc123"


def _make_route(n: int) -> Route:
    """Create a test Route with minimal required fields."""
    return Route(
        route_id=f"fhwa-route-{n:04d}",
        name=f"Route {n}",
        state="TN",
        source="fhwa",
        centroid_lat=35.0 + n * 0.01,
        centroid_lng=-84.0,
    )


def _make_routes(count: int) -> list[Route]:
    """Create a list of test Routes."""
    return [_make_route(i) for i in range(count)]


@pytest.mark.skipif(not IMPORTS_AVAILABLE, reason="Module not created yet - RED phase")
@responses_mock.activate
def test_push_routes_batches_120_routes_into_three_calls():
    """AC-1: push_routes batches 120 routes into 3 HTTP calls of 50/50/20.

    GIVEN: a list of 120 Route objects and batch_size=50
    WHEN: push_routes(routes, base_url, deploy_key, batch_size=50) is called
    THEN: the underlying HTTP client is called exactly 3 times,
          with batch sizes of 50, 50, and 20 respectively,
          and each request includes Authorization: Bearer {deploy_key} header
    """
    # GIVEN: 120 routes and mocked endpoint
    routes = _make_routes(120)

    # Mock 3 successful responses
    for i in range(3):
        responses_mock.add(
            responses_mock.POST,
            f"{BASE_URL}/api/ingest-routes",
            json={"created": 40, "updated": 10, "errors": []},
            status=200,
        )

    # WHEN: push_routes called with batch_size=50
    summary = push_routes(routes, BASE_URL, DEPLOY_KEY, batch_size=50)

    # THEN: exactly 3 HTTP calls were made
    assert len(responses_mock.calls) == 3, (
        f"Expected 3 HTTP calls for 120 routes with batch_size=50, "
        f"but got {len(responses_mock.calls)}"
    )

    # AND: Authorization header present on each call
    for call in responses_mock.calls:
        auth_header = call.request.headers.get("Authorization")
        assert auth_header == f"Bearer {DEPLOY_KEY}", (
            f"Expected 'Authorization: Bearer {DEPLOY_KEY}' header, "
            f"got '{auth_header}'"
        )

    # AND: summary reflects total sent
    assert summary.sent == 120


@pytest.mark.skipif(not IMPORTS_AVAILABLE, reason="Module not created yet - RED phase")
@responses_mock.activate
def test_push_routes_aggregates_inserted_and_updated_counts():
    """AC-2: push_routes aggregates inserted and updated counts across batches.

    GIVEN: 3 batches where batch 1 returns {created:30, updated:20, errors:[]},
           batch 2 returns {created:25, updated:25, errors:[]},
           batch 3 returns {created:10, updated:10, errors:[]}
    WHEN: push_routes processes all batches
    THEN: the returned PushSummary has sent=120, inserted=65, updated=55,
          failed=0, and errors=[]
    """
    # GIVEN: 120 routes and mocked endpoint with varying responses
    routes = _make_routes(120)

    # Mock 3 responses with different created/updated counts
    batch_responses = [
        {"created": 30, "updated": 20, "errors": []},
        {"created": 25, "updated": 25, "errors": []},
        {"created": 10, "updated": 10, "errors": []},
    ]

    for resp in batch_responses:
        responses_mock.add(
            responses_mock.POST,
            f"{BASE_URL}/api/ingest-routes",
            json=resp,
            status=200,
        )

    # WHEN: push_routes called
    summary = push_routes(routes, BASE_URL, DEPLOY_KEY, batch_size=50)

    # THEN: PushSummary aggregates correctly
    assert summary.sent == 120, f"Expected sent=120, got {summary.sent}"
    assert summary.inserted == 65, f"Expected inserted=65 (30+25+10), got {summary.inserted}"
    assert summary.updated == 55, f"Expected updated=55 (20+25+10), got {summary.updated}"
    assert summary.failed == 0, f"Expected failed=0, got {summary.failed}"
    assert summary.errors == [], f"Expected no errors, got {summary.errors}"


@pytest.mark.skipif(not IMPORTS_AVAILABLE, reason="Module not created yet - RED phase")
@responses_mock.activate
def test_push_routes_retries_batch_once_on_503():
    """AC-3: push_routes retries a failing batch once before logging error and continuing.

    Test case 1: 503 on first attempt, succeeds on retry
    GIVEN: a batch that returns HTTP 503 on the first attempt but succeeds on the second
    WHEN: push_routes processes that batch
    THEN: the batch is retried exactly once, and the second attempt's response is recorded

    Test case 2: 503 on both attempts (permanent failure)
    GIVEN: a batch that returns HTTP 503 on both attempts
    WHEN: push_routes processes that batch
    THEN: the batch is retried exactly once, the error is appended to PushSummary.errors,
          PushSummary.failed is incremented by the batch size, and the pipeline continues
    """
    # GIVEN: 100 routes split into 2 batches
    routes = _make_routes(100)

    # Batch 1: 503 on first attempt, success on retry
    responses_mock.add(
        responses_mock.POST,
        f"{BASE_URL}/api/ingest-routes",
        json={"error": "Service unavailable"},
        status=503,
    )
    responses_mock.add(
        responses_mock.POST,
        f"{BASE_URL}/api/ingest-routes",
        json={"created": 30, "updated": 20, "errors": []},
        status=200,
    )

    # Batch 2: 503 on both attempts (permanent failure)
    responses_mock.add(
        responses_mock.POST,
        f"{BASE_URL}/api/ingest-routes",
        json={"error": "Service unavailable"},
        status=503,
    )
    responses_mock.add(
        responses_mock.POST,
        f"{BASE_URL}/api/ingest-routes",
        json={"error": "Service unavailable"},
        status=503,
    )

    # WHEN: push_routes called
    summary = push_routes(routes, BASE_URL, DEPLOY_KEY, batch_size=50)

    # THEN: batch 1 succeeded after retry, batch 2 failed permanently
    assert len(responses_mock.calls) == 4, f"Expected 4 HTTP calls (1+1 for batch1, 1+1 for batch2), got {len(responses_mock.calls)}"
    assert summary.sent == 100
    assert summary.inserted == 30, f"Expected inserted=30 (from batch1 retry), got {summary.inserted}"
    assert summary.updated == 20, f"Expected updated=20 (from batch1 retry), got {summary.updated}"
    assert summary.failed == 50, f"Expected failed=50 (batch2 size), got {summary.failed}"
    assert len(summary.errors) == 1, f"Expected 1 error (batch2 permanent failure), got {len(summary.errors)}"
    assert "permanent failure" in summary.errors[0].lower(), f"Expected error message to mention 'permanent failure', got: {summary.errors[0]}"


@pytest.mark.skipif(not IMPORTS_AVAILABLE, reason="Module not created yet - RED phase")
def test_push_routes_raises_configuration_error_on_missing_deploy_key():
    """AC-4: push_routes raises ConfigurationError when deploy_key is empty or None.

    GIVEN: deploy_key is an empty string or None
    WHEN: push_routes(routes, base_url, deploy_key="") is called
    THEN: a ConfigurationError is raised immediately with a clear message
          — no HTTP request is made
    """
    # GIVEN: routes and empty deploy key
    routes = _make_routes(10)

    # WHEN: push_routes called with empty deploy key
    # THEN: ConfigurationError is raised
    with pytest.raises(ConfigurationError) as exc_info:
        push_routes(routes, BASE_URL, deploy_key="")

    # AND: error message is clear
    assert "CURATION_DEPLOY_KEY" in str(exc_info.value)
    assert ".env.local" in str(exc_info.value)

    # WHEN: push_routes called with None deploy key
    # THEN: ConfigurationError is raised
    with pytest.raises(ConfigurationError) as exc_info:
        push_routes(routes, BASE_URL, deploy_key=None)

    # AND: error message is clear
    assert "CURATION_DEPLOY_KEY" in str(exc_info.value)


@pytest.mark.skipif(not IMPORTS_AVAILABLE, reason="Module not created yet - RED phase")
@responses_mock.activate
def test_push_routes_raises_configuration_error_before_http_call():
    """AC-4 verification: No HTTP request is made when ConfigurationError is raised.

    GIVEN: deploy_key is empty and HTTP endpoint is mocked
    WHEN: push_routes is called
    THEN: ConfigurationError is raised and no HTTP call is made
    """
    # GIVEN: routes, empty deploy key, and mocked endpoint
    routes = _make_routes(10)
    responses_mock.add(
        responses_mock.POST,
        f"{BASE_URL}/api/ingest-routes",
        json={"created": 10, "updated": 0, "errors": []},
        status=200,
    )

    # WHEN: push_routes called with empty deploy key
    # THEN: ConfigurationError is raised before any HTTP call
    with pytest.raises(ConfigurationError):
        push_routes(routes, BASE_URL, deploy_key="")

    # AND: no HTTP calls were made
    assert len(responses_mock.calls) == 0, "Expected no HTTP calls when deploy_key is empty"
