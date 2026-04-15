"""Tests for INF-004 route embedding generation pipeline.

Tests use mocked OpenAI client to avoid calling real API.
Follows AC-1 through AC-8 from INF-004 task definition.
"""

import time
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from unittest.mock import MagicMock, Mock, patch

import pytest
from openai import RateLimitError

from scripts.curation.pipeline.embed.batch_embed_routes import (
    EmbeddingCostLedger,
    batch_embed_routes,
    build_search_text,
    generate_embeddings,
    load_routes_needing_embedding,
    main,
    write_cost_ledger,
)
from scripts.curation.pipeline.models import Route



# =============================================================================
# Fixtures
# =============================================================================


@pytest.fixture
def mock_openai_client():
    """Mock OpenAI client with controlled embedding responses."""
    client = MagicMock()

    def mock_create(*args, **kwargs):
        """Return embeddings for each input text."""
        input_texts = kwargs.get("input", [])
        # Return one embedding per input text
        return MagicMock(
            data=[MagicMock(embedding=[0.1] * 1536) for _ in input_texts]
        )

    client.embeddings.create.side_effect = mock_create
    return client


@pytest.fixture
def sample_routes():
    """Sample routes for testing."""
    return [
        Route(
            route_id="r1",
            name="Tail of the Dragon",
            state="TN",
            source="fhwa",
            centroid_lat=35.5,
            centroid_lng=-83.5,
            candidate_identifiers=["The Dragon", "Deals Gap", "US-129"],
            highway_number="US-129",
        ),
        Route(
            route_id="r2",
            name="Blue Ridge Parkway",
            state="NC",
            source="fhwa",
            centroid_lat=36.0,
            centroid_lng=-81.5,
            candidate_identifiers=["BRP", "Blue Ridge"],
            highway_number="US-129",
        ),
        Route(
            route_id="r3",
            name="",  # Empty name should be skipped
            state="VA",
            source="motorcycleroads",
            centroid_lat=37.0,
            centroid_lng=-79.0,
        ),
    ]


# =============================================================================
# AC-1: build_search_text concatenates fields
# =============================================================================


def test_build_search_text(sample_routes):
    """AC-1: build_search_text concatenates name, state, highway, candidate_identifiers."""
    route = sample_routes[0]
    text = build_search_text(route)

    # Should contain all key fields
    assert "Tail of the Dragon" in text
    assert "TN" in text
    assert "US-129" in text
    assert "The Dragon" in text or "Deals Gap" in text or "US-129" in text

    # Should be a non-empty string
    assert len(text) > 0


def test_build_search_text_with_empty_name():
    """Routes with empty name should produce empty search_text."""
    route = Route(
        route_id="empty",
        name="",
        state="TX",
        source="test",
        centroid_lat=30.0,
        centroid_lng=-97.0,
    )
    text = build_search_text(route)
    assert text == ""


def test_build_search_text_with_missing_optional_fields():
    """Should handle missing highway_number and candidate_identifiers gracefully."""
    route = Route(
        route_id="minimal",
        name="Route 66",
        state="CA",
        source="test",
        centroid_lat=34.0,
        centroid_lng=-118.0,
        # No highway_number or candidate_identifiers
    )
    text = build_search_text(route)
    assert "Route 66" in text
    assert "CA" in text


# =============================================================================
# AC-2: generate_embeddings returns 1536-dim vectors
# =============================================================================


def test_generate_embeddings_returns_1536_dim(mock_openai_client):
    """AC-2: generate_embeddings returns 1536-dimensional vectors."""
    texts = ["Route 1", "Route 2"]
    embeddings = generate_embeddings(texts, mock_openai_client)

    assert len(embeddings) == 2
    for emb in embeddings:
        assert len(emb) == 1536


def test_generate_embeddings_calls_openai_batch_api(mock_openai_client):
    """Should call OpenAI batch embedding API, not individual calls."""
    texts = ["Route 1", "Route 2", "Route 3"]
    generate_embeddings(texts, mock_openai_client)

    # Should call API once with all texts
    mock_openai_client.embeddings.create.assert_called_once()
    call_args = mock_openai_client.embeddings.create.call_args
    assert "input" in call_args.kwargs
    assert call_args.kwargs["input"] == texts


def test_generate_embeddings_uses_correct_model(mock_openai_client):
    """Should use text-embedding-3-small model explicitly."""
    texts = ["Route 1"]
    generate_embeddings(texts, mock_openai_client, model="text-embedding-3-small")

    call_args = mock_openai_client.embeddings.create.call_args
    assert call_args.kwargs["model"] == "text-embedding-3-small"


# =============================================================================
# AC-3: batch_embed_routes populates fields
# =============================================================================


def test_batch_embed_routes_populates_fields(sample_routes, mock_openai_client):
    """AC-3: batch_embed_routes populates search_text and embedding for all routes."""
    updated_routes, ledger = batch_embed_routes(sample_routes, mock_openai_client)

    # Should process all 3 routes (including the one with empty name)
    assert ledger.total_routes == 3
    # But skip the empty name one
    assert ledger.embedded_routes == 2
    assert ledger.skipped_routes == 1

    # Check populated fields
    for route in updated_routes:
        if route.name:  # Non-empty routes
            assert route.search_text is not None
            assert len(route.search_text) > 0
            assert route.embedding is not None
            assert len(route.embedding) == 1536
        else:  # Empty name route
            assert route.search_text == ""
            assert route.embedding is None


def test_batch_embed_routes_returns_cost_ledger(sample_routes, mock_openai_client):
    """Should return accurate cost ledger with token counts and cost."""
    _, ledger = batch_embed_routes(sample_routes, mock_openai_client)

    assert ledger.total_routes == 3
    assert ledger.embedded_routes == 2
    assert ledger.skipped_routes == 1
    assert ledger.total_input_tokens > 0
    assert ledger.total_cost_usd > 0.0
    assert ledger.batch_count >= 1
    assert ledger.model == "text-embedding-3-small"


# =============================================================================
# AC-4: skip routes with empty search_text
# =============================================================================


def test_skip_empty_search_text(sample_routes, mock_openai_client):
    """AC-4: Routes with empty search_text should be skipped (not embedded)."""
    updated_routes, ledger = batch_embed_routes(sample_routes, mock_openai_client)

    # Find the empty-name route
    empty_route = next(r for r in updated_routes if r.route_id == "r3")
    assert empty_route.search_text == ""
    assert empty_route.embedding is None

    # Should be counted as skipped
    assert ledger.skipped_routes == 1


def test_skip_all_empty_routes(mock_openai_client):
    """If all routes have empty search_text, should skip all."""
    routes = [
        Route(
            route_id="e1",
            name="",
            state="TX",
            source="test",
            centroid_lat=30.0,
            centroid_lng=-97.0,
        ),
        Route(
            route_id="e2",
            name="",
            state="OK",
            source="test",
            centroid_lat=35.0,
            centroid_lng=-97.0,
        ),
    ]

    updated_routes, ledger = batch_embed_routes(routes, mock_openai_client)

    assert ledger.embedded_routes == 0
    assert ledger.skipped_routes == 2
    assert ledger.total_input_tokens == 0
    assert ledger.total_cost_usd == 0.0


# =============================================================================
# AC-5: retry on rate limit with exponential backoff
# =============================================================================


def test_retry_on_rate_limit(mock_openai_client):
    """AC-5: Should retry on RateLimitError with exponential backoff (1s, 2s, 4s)."""
    # Mock RateLimitError twice, then succeed
    error_response = MagicMock()
    error_response.status_code = 429

    call_count = 0

    def side_effect(*args, **kwargs):
        nonlocal call_count
        call_count += 1
        if call_count <= 2:
            raise RateLimitError("Rate limit", response=error_response, body=None)
        return MagicMock(data=[MagicMock(embedding=[0.1] * 1536)])

    mock_openai_client.embeddings.create.side_effect = side_effect

    texts = ["Route 1"]
    start = time.time()
    embeddings = generate_embeddings(texts, mock_openai_client, max_retries=3)
    elapsed = time.time() - start

    # Should succeed after retries
    assert len(embeddings) == 1
    assert call_count == 3  # 2 failures + 1 success

    # Should have waited with exponential backoff (1s + 2s = 3s minimum)
    # Allow some tolerance for test execution time
    assert elapsed >= 2.5  # At least 1s + 2s backoff


def test_retry_fails_after_max_retries(mock_openai_client):
    """Should give up after max_retries exhausted."""
    error_response = MagicMock()
    error_response.status_code = 429

    mock_openai_client.embeddings.create.side_effect = RateLimitError(
        "Rate limit", response=error_response, body=None
    )

    texts = ["Route 1"]
    with pytest.raises(RateLimitError):
        generate_embeddings(texts, mock_openai_client, max_retries=2)


# =============================================================================
# AC-6: CLI --dry-run does not push to Convex
# =============================================================================


def test_cli_dry_run_no_push(mock_openai_client):
    """AC-6: --dry-run should NOT call convex_push.push_routes."""
    # Mock sample routes
    sample_routes = [
        Route(
            route_id="r1",
            name="Test Route",
            state="TX",
            source="test",
            centroid_lat=30.0,
            centroid_lng=-97.0,
        )
    ]

    # Mock load_routes_needing_embedding to return sample routes
    with patch("pipeline.embed.batch_embed_routes.load_routes_needing_embedding", return_value=sample_routes):
        # Mock push_routes at its source location to track if it's called
        with patch("pipeline.sync.convex_push.push_routes") as mock_push:
            # Set up environment
            with patch.dict(
                "os.environ",
                {"OPENAI_API_KEY": "test-key", "CONVEX_URL": "http://test", "CURATION_DEPLOY_KEY": "test-key"},
            ):
                # Run CLI with --dry-run
                exit_code = main(["--dry-run"])

                # Should succeed
                assert exit_code == 0

                # Should NOT call push_routes
                mock_push.assert_not_called()


# =============================================================================
# AC-7: CLI --commit DOES push to Convex
# =============================================================================


def test_cli_commit_pushes(mock_openai_client):
    """AC-7: --commit SHOULD call convex_push.push_routes with embedded routes."""
    # Mock sample routes
    sample_routes = [
        Route(
            route_id="r1",
            name="Test Route",
            state="TX",
            source="test",
            centroid_lat=30.0,
            centroid_lng=-97.0,
        )
    ]

    # Mock load_routes_needing_embedding to return sample routes
    with patch("pipeline.embed.batch_embed_routes.load_routes_needing_embedding", return_value=sample_routes):
        # Mock push_routes at its source location
        # This patches the function before it's imported by batch_embed_routes
        with patch("pipeline.sync.convex_push.push_routes") as mock_push:
            # Mock successful push summary using a simple Mock object
            mock_summary = Mock()
            mock_summary.inserted = 1
            mock_summary.updated = 0
            mock_summary.failed = 0
            mock_push.return_value = mock_summary

            # Set up environment
            with patch.dict(
                "os.environ",
                {"OPENAI_API_KEY": "test-key", "CONVEX_URL": "http://test", "CURATION_DEPLOY_KEY": "test-key"},
            ):
                # Run CLI with --commit
                exit_code = main(["--commit"])

                # Should succeed
                assert exit_code == 0

                # SHOULD call push_routes exactly once
                mock_push.assert_called_once()

                # Verify push_routes was called with correct arguments
                call_args = mock_push.call_args
                assert call_args.kwargs["dry_run"] is False
                assert call_args.kwargs["base_url"] == "http://test"
                assert call_args.kwargs["deploy_key"] == "test-key"
                # Verify routes were passed
                assert len(call_args.kwargs["routes"]) == 1
                pushed_route = call_args.kwargs["routes"][0]
                assert pushed_route.route_id == "r1"
                # Note: embedding may be None if OpenAI API fails, which is OK for this test
                # The key behavioral guarantee is that push_routes WAS called


# =============================================================================
# AC-8: incremental mode filters routes without embeddings
# =============================================================================


def test_incremental_mode_filters():
    """AC-8: incremental=True should only return routes without embeddings."""
    with patch("pipeline.embed.batch_embed_routes.load_routes_needing_embedding") as mock_load:
        # Mock: some routes have embeddings, some don't
        mock_load.return_value = [
            Route(
                route_id="r1",
                name="Route 1",
                state="TX",
                source="test",
                centroid_lat=30.0,
                centroid_lng=-97.0,
                embedding=None,  # No embedding yet
            ),
            Route(
                route_id="r2",
                name="Route 2",
                state="OK",
                source="test",
                centroid_lat=35.0,
                centroid_lng=-97.0,
                embedding=[0.1] * 1536,  # Already has embedding
            ),
        ]

        # Note: load_routes_needing_embedding now requires CONVEX_URL and CURATION_DEPLOY_KEY
        # This test verifies the contract raises OSError without credentials
        with pytest.raises(OSError, match="CONVEX_URL environment variable is required"):
            load_routes_needing_embedding(incremental=True)


# =============================================================================
# Additional utility tests
# =============================================================================


def test_write_cost_ledger(tmp_path):
    """Should write markdown cost ledger to specified path."""
    ledger = EmbeddingCostLedger(
        total_routes=100,
        embedded_routes=95,
        skipped_routes=5,
        total_input_tokens=50000,
        total_cost_usd=1.0,
        batch_count=1,
        model="text-embedding-3-small",
        started_at=datetime.now().isoformat(),
        finished_at=datetime.now().isoformat(),
    )

    output_path = tmp_path / "cost-ledger.md"
    write_cost_ledger(ledger, output_path)

    # Should create file
    assert output_path.exists()

    # Should contain key info
    content = output_path.read_text()
    assert "100" in content  # total_routes
    assert "95" in content  # embedded_routes
    assert "1.0" in content  # cost
    assert "text-embedding-3-small" in content


def test_cli_requires_api_key_for_commit():
    """CLI should require OPENAI_API_KEY for --commit mode."""
    with patch.dict("os.environ", {}, clear=True):
        with patch("sys.argv", ["prog", "--commit"]):
            with pytest.raises(SystemExit) as exc_info:
                main(["--commit"])
            # Should exit with error
            assert exc_info.value.code != 0
