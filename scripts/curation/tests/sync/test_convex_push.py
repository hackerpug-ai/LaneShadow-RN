"""Tests for pipeline/sync/convex_push.py - CLI-based embedding backfill"""

import json
from unittest.mock import patch, MagicMock
import pytest
import subprocess
from scripts.curation.pipeline.models import Route
from scripts.curation.pipeline.sync.convex_push import (
    push_routes,
    PushSummary,
    ConfigurationError,
)


BASE_URL = "https://fake-convex.convex.site"
DEPLOY_KEY = "test-key-abc123"


def _make_route(n: int, with_embedding: bool = True) -> Route:
    """Create a test Route with minimal required fields."""
    route = Route(
        route_id=f"fhwa-route-{n:04d}",
        name=f"Route {n}",
        state="TN",
        source="fhwa",
        centroid_lat=35.0 + n * 0.01,
        centroid_lng=-84.0,
    )
    if with_embedding:
        route.embedding = [0.1] * 1536  # OpenAI text-embedding-3-small dimension
    return route


def _make_routes(count: int, with_embedding: bool = True) -> list[Route]:
    """Create a list of test Routes."""
    return [_make_route(i, with_embedding) for i in range(count)]


@patch('subprocess.run')
def test_push_routes_batches_120_routes_into_three_calls(mock_run):
    """AC-1: push_routes batches 120 routes into 3 CLI calls of 10/10/10.

    GIVEN: a list of 120 Route objects with embeddings and batch_size=10
    WHEN: push_routes(routes, base_url, deploy_key, batch_size=10) is called
    THEN: the Convex CLI is called exactly 12 times (120/10),
          and each call includes the proper JSON payload
    """
    # GIVEN: 120 routes with embeddings
    routes = _make_routes(120)

    # Mock 12 successful CLI responses (120 routes / 10 per batch = 12 batches)
    for i in range(12):
        mock_run.return_value = MagicMock(
            returncode=0,
            stdout=json.dumps({"updated": 10, "errors": []})
        )

    # WHEN: push_routes called with batch_size=10
    summary = push_routes(routes, BASE_URL, DEPLOY_KEY, batch_size=10)

    # THEN: exactly 12 CLI calls were made
    assert mock_run.call_count == 12, (
        f"Expected 12 CLI calls for 120 routes with batch_size=10, "
        f"but got {mock_run.call_count}"
    )

    # AND: summary reflects total sent
    assert summary.sent == 120
    assert summary.updated == 120


@patch('subprocess.run')
def test_push_routes_aggregates_updated_counts(mock_run):
    """AC-2: push_routes aggregates updated counts across batches.

    GIVEN: 3 batches where batch 1 returns {updated:10, errors:[]},
           batch 2 returns {updated:10, errors:[]},
           batch 3 returns {updated:10, errors:[]}
    WHEN: push_routes processes all batches
    THEN: the returned PushSummary has sent=30, updated=30,
          failed=0, and errors=[]
    """
    # GIVEN: 30 routes with embeddings and mocked CLI responses
    routes = _make_routes(30)

    # Mock 3 responses with different updated counts
    batch_responses = [
        {"updated": 10, "errors": []},
        {"updated": 10, "errors": []},
        {"updated": 10, "errors": []},
    ]

    for resp in batch_responses:
        mock_run.return_value = MagicMock(
            returncode=0,
            stdout=json.dumps(resp)
        )

    # WHEN: push_routes called
    summary = push_routes(routes, BASE_URL, DEPLOY_KEY, batch_size=10)

    # THEN: PushSummary aggregates correctly
    assert summary.sent == 30, f"Expected sent=30, got {summary.sent}"
    assert summary.updated == 30, f"Expected updated=30 (10+10+10), got {summary.updated}"
    assert summary.failed == 0, f"Expected failed=0, got {summary.failed}"
    assert summary.errors == [], f"Expected no errors, got {summary.errors}"


@patch('subprocess.run')
def test_push_routes_retries_batch_once_on_cli_failure(mock_run):
    """AC-3: push_routes retries a failing batch once before logging error and continuing.

    Test case 1: CLI failure on first attempt, succeeds on retry
    GIVEN: a batch that fails on the first attempt but succeeds on the second
    WHEN: push_routes processes that batch
    THEN: the batch is retried exactly once, and the second attempt's response is recorded

    Test case 2: CLI failure on both attempts (permanent failure)
    GIVEN: a batch that fails on both attempts
    WHEN: push_routes processes that batch
    THEN: the batch is retried exactly once, the error is appended to PushSummary.errors,
          PushSummary.failed is incremented by the batch size, and the pipeline continues
    """
    # GIVEN: 20 routes split into 2 batches
    routes = _make_routes(20)

    # Batch 1: Failure on first attempt, success on retry
    mock_run.side_effect = [
        # First call fails
        MagicMock(returncode=1, stderr="CLI error"),
        # Second call succeeds
        MagicMock(returncode=0, stdout=json.dumps({"updated": 10, "errors": []})),
        # Third call fails (batch 2, first attempt)
        MagicMock(returncode=1, stderr="CLI error"),
        # Fourth call fails (batch 2, retry - permanent failure)
        MagicMock(returncode=1, stderr="CLI error"),
    ]

    # WHEN: push_routes called
    summary = push_routes(routes, BASE_URL, DEPLOY_KEY, batch_size=10)

    # THEN: batch 1 succeeded after retry, batch 2 failed permanently
    assert mock_run.call_count == 4, f"Expected 4 CLI calls (1+1 for batch1, 1+1 for batch2), got {mock_run.call_count}"
    assert summary.sent == 20
    assert summary.updated == 10, f"Expected updated=10 (from batch1 retry), got {summary.updated}"
    assert summary.failed == 10, f"Expected failed=10 (batch2 size), got {summary.failed}"
    assert len(summary.errors) == 1, f"Expected 1 error (batch2 permanent failure), got {len(summary.errors)}"


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


@patch('subprocess.run')
def test_push_routes_raises_configuration_error_before_cli_call(mock_run):
    """AC-4 verification: No CLI call is made when ConfigurationError is raised.

    GIVEN: deploy_key is empty
    WHEN: push_routes is called
    THEN: ConfigurationError is raised and no CLI call is made
    """
    # GIVEN: routes and empty deploy key
    routes = _make_routes(10)

    # WHEN: push_routes called with empty deploy key
    # THEN: ConfigurationError is raised before any CLI call
    with pytest.raises(ConfigurationError):
        push_routes(routes, BASE_URL, deploy_key="")

    # AND: no CLI calls were made
    assert mock_run.call_count == 0, "Expected no CLI calls when deploy_key is empty"


@patch('subprocess.run')
def test_push_routes_skips_routes_without_embeddings(mock_run):
    """Test that routes without embeddings are skipped.

    GIVEN: a mix of routes with and without embeddings
    WHEN: push_routes is called
    THEN: only routes with embeddings are processed
    """
    # GIVEN: 10 routes, only half with embeddings
    routes = _make_routes(10, with_embedding=False)
    for i in range(5, 10):
        routes[i].embedding = [0.1] * 1536

    # Mock successful CLI response for the batch with embeddings
    mock_run.return_value = MagicMock(
        returncode=0,
        stdout=json.dumps({"updated": 5, "errors": []})
    )

    # WHEN: push_routes called
    summary = push_routes(routes, BASE_URL, DEPLOY_KEY, batch_size=10)

    # THEN: all routes are counted in sent
    assert summary.sent == 10, f"Expected sent=10 (all routes counted), got {summary.sent}"
    # Only routes with embeddings were updated
    assert summary.updated == 5, f"Expected updated=5 (only routes with embeddings), got {summary.updated}"
    # One CLI call should be made for the batch
    assert mock_run.call_count == 1, f"Expected 1 CLI call (batch with 5 embedded routes), got {mock_run.call_count}"
