"""Tests for OSM curvature scoring module."""

import json
from pathlib import Path
from unittest.mock import MagicMock, patch

import httpx
import pytest

from scripts.curation.pipeline.enrichment.cache import FileCache
from scripts.curation.pipeline.enrichment.curvature import compute_bearing, compute_curvature_score
from scripts.curation.pipeline.enrichment.osm_client import OSMClient


class TestBearingComputation:
    """Tests for bearing calculation between coordinates."""

    def test_bearing_north(self):
        """Bearing due north should be 0 degrees."""
        bearing = compute_bearing(40.0, -100.0, 41.0, -100.0)
        assert bearing == pytest.approx(0.0, abs=0.1)

    def test_bearing_east(self):
        """Bearing due east should be ~90 degrees."""
        bearing = compute_bearing(40.0, -100.0, 40.0, -99.0)
        assert bearing == pytest.approx(90.0, abs=1.0)

    def test_bearing_south(self):
        """Bearing due south should be 180 degrees."""
        bearing = compute_bearing(41.0, -100.0, 40.0, -100.0)
        assert bearing == pytest.approx(180.0, abs=0.1)

    def test_bearing_west(self):
        """Bearing due west should be ~270 degrees."""
        bearing = compute_bearing(40.0, -99.0, 40.0, -100.0)
        assert bearing == pytest.approx(270.0, abs=1.0)

    def test_bearing_diagonal(self):
        """Test bearing in diagonal direction."""
        bearing = compute_bearing(40.0, -100.0, 41.0, -99.0)
        # Northeast direction, should be around 35-45 degrees due to spherical geometry
        assert 35 < bearing < 45

    def test_bearing_wrapping(self):
        """Bearing should wrap correctly at 360/0 boundary."""
        # Going just west of north
        bearing = compute_bearing(40.0, -100.0, 40.01, -100.01)
        # Should be near 360 (or 0), not negative
        assert 0 <= bearing < 360


class TestCurvatureScoring:
    """Tests for curvature score computation."""

    def test_straight_line_zero_curvature(self):
        """Perfectly straight road should have curvature near 0."""
        # Straight line north
        geometry = [(40.0, -100.0), (40.01, -100.0), (40.02, -100.0), (40.03, -100.0)]
        score = compute_curvature_score(geometry)
        assert score is not None
        assert score < 5  # Should be very low

    def test_90_degree_turn_high_curvature(self):
        """90-degree turn should produce high curvature."""
        # L-shaped route: north then east
        geometry = [
            (40.0, -100.0),
            (40.01, -100.0),
            (40.01, -99.99),
            (40.01, -99.98),
        ]
        score = compute_curvature_score(geometry)
        assert score is not None
        assert score > 50  # Should be high

    def test_zigzag_high_curvature(self):
        """Zigzag pattern should produce very high curvature."""
        # Zigzag: alternating directions
        geometry = [
            (40.0, -100.0),
            (40.01, -100.0),
            (40.01, -99.99),
            (40.02, -99.99),
            (40.02, -99.98),
            (40.03, -99.98),
        ]
        score = compute_curvature_score(geometry)
        assert score is not None
        assert score > 70  # Should be very high

    def test_circular_road_high_curvature(self):
        """Circular road should produce high curvature."""
        # Approximate circle with 8 points
        import math

        center_lat, center_lng = 40.0, -100.0
        radius = 0.01  # ~1.1 km
        geometry = []
        for i in range(9):
            angle = math.radians(i * 45)
            lat = center_lat + radius * math.sin(angle)
            lng = center_lng + radius * math.cos(angle)
            geometry.append((lat, lng))

        score = compute_curvature_score(geometry)
        assert score is not None
        assert score > 50  # Circular road should be twisty

    def test_insufficient_points(self):
        """Geometry with < 3 points should return None."""
        geometry = [(40.0, -100.0), (40.01, -100.0)]
        score = compute_curvature_score(geometry)
        assert score is None

    def test_score_range(self):
        """Curvature score should always be in 0-100 range."""
        # Test various geometries
        test_cases = [
            # Straight line
            [(40.0, -100.0), (40.01, -100.0), (40.02, -100.0), (40.03, -100.0)],
            # Gentle curve
            [(40.0, -100.0), (40.01, -100.0), (40.015, -99.995), (40.02, -99.99)],
            # Sharp turns
            [(40.0, -100.0), (40.01, -100.0), (40.01, -99.99), (40.01, -99.98)],
            # Zigzag
            [
                (40.0, -100.0),
                (40.01, -100.0),
                (40.01, -99.99),
                (40.02, -99.99),
                (40.02, -99.98),
            ],
        ]

        for geometry in test_cases:
            score = compute_curvature_score(geometry)
            if score is not None:
                assert 0 <= score <= 100, f"Score {score} out of range for {geometry}"

    def test_determinism(self):
        """Same geometry should always produce same score."""
        geometry = [
            (40.0, -100.0),
            (40.01, -100.0),
            (40.01, -99.99),
            (40.02, -99.99),
            (40.02, -99.98),
            (40.03, -99.98),
        ]

        scores = []
        for _ in range(100):
            score = compute_curvature_score(geometry)
            scores.append(score)

        # All scores should be identical
        assert all(s == scores[0] for s in scores), "Curvature score is not deterministic"


class TestFileCache:
    """Tests for file-based caching."""

    def test_cache_miss(self, tmp_path):
        """Cache should return None for missing entries."""
        cache = FileCache(tmp_path)
        result = cache.get("nonexistent_key")
        assert result is None

    def test_cache_hit(self, tmp_path):
        """Cache should return stored data."""
        cache = FileCache(tmp_path)
        test_data = {"elements": [{"id": 123, "nodes": [1, 2, 3]}]}

        cache.set("test_key", test_data)
        result = cache.get("test_key")

        assert result == test_data

    def test_cache_persistence(self, tmp_path):
        """Cache should persist across instances."""
        # Write to first cache instance
        cache1 = FileCache(tmp_path)
        test_data = {"elements": [{"id": 456}]}

        cache1.set("persistent_key", test_data)

        # Read from second cache instance
        cache2 = FileCache(tmp_path)
        result = cache2.get("persistent_key")

        assert result == test_data

    def test_cache_file_creation(self, tmp_path):
        """Cache should create files on disk."""
        cache = FileCache(tmp_path)
        test_data = {"test": "data"}

        cache.set("file_key", test_data)

        # Check that cache file exists
        cache_files = list(tmp_path.glob("*.json"))
        assert len(cache_files) > 0

    def test_cache_key_sanitization(self, tmp_path):
        """Cache should sanitize keys for filesystem safety."""
        cache = FileCache(tmp_path)
        test_data = {"test": "data"}

        # Key with filesystem-unsafe characters
        unsafe_key = "route/123:query\\params"
        cache.set(unsafe_key, test_data)

        # Should be able to retrieve it
        result = cache.get(unsafe_key)
        assert result == test_data


class TestOSMClient:
    """Tests for OSM Overpass API client."""

    def test_client_initialization(self, tmp_path):
        """Client should initialize with cache directory."""
        client = OSMClient(cache_dir=tmp_path)
        assert client.cache.cache_dir == tmp_path

    def test_rate_limiting(self, tmp_path):
        """Client should respect rate limiting between requests."""
        client = OSMClient(cache_dir=tmp_path)

        mock_response = MagicMock()
        mock_response.json.return_value = {"elements": []}
        mock_response.raise_for_status = MagicMock()

        with patch("httpx.post", return_value=mock_response) as mock_post:
            # First request
            client.fetch_highway_geometry(40.0, -100.0, radius_m=1000, route_id="test1")
            first_time = client.last_request_time

            # Immediate second request should trigger rate limit wait
            client.fetch_highway_geometry(40.0, -100.0, radius_m=1000, route_id="test2")

            # Should have called post twice
            assert mock_post.call_count == 2

    def test_cache_usage(self, tmp_path):
        """Client should use cached responses when available."""
        client = OSMClient(cache_dir=tmp_path)

        mock_response = MagicMock()
        test_data = {"elements": [{"id": 123, "geometry": [{"lat": 40.0, "lon": -100.0}]}]}
        mock_response.json.return_value = test_data
        mock_response.raise_for_status = MagicMock()

        with patch("httpx.post", return_value=mock_response) as mock_post:
            # First request - should hit API
            result1 = client.fetch_highway_geometry(40.0, -100.0, route_id="cache_test")
            assert mock_post.call_count == 1
            assert result1 == test_data["elements"]

            # Second request with same params - should use cache
            result2 = client.fetch_highway_geometry(40.0, -100.0, route_id="cache_test")
            assert mock_post.call_count == 1  # No additional API call
            assert result2 == test_data["elements"]

    def test_overpass_query_format(self, tmp_path):
        """Client should construct correct Overpass QL query."""
        client = OSMClient(cache_dir=tmp_path)

        mock_response = MagicMock()
        mock_response.json.return_value = {"elements": []}
        mock_response.raise_for_status = MagicMock()

        with patch("httpx.post", return_value=mock_response) as mock_post:
            client.fetch_highway_geometry(35.5, -83.5, radius_m=1500, route_id="query_test")

            # Verify the call was made
            assert mock_post.called
            call_args = mock_post.call_args

            # Check URL
            assert call_args[0][0] == OSMClient.OVERPASS_URL

            # Check query contains expected elements
            query = call_args[1]["data"]["data"]
            assert "[out:json]" in query
            assert 'way["highway"]' in query
            assert "around:1500,35.5,-83.5" in query

    def test_missing_geometry_handling(self, tmp_path):
        """Client should handle missing geometry gracefully."""
        client = OSMClient(cache_dir=tmp_path)

        # Mock empty response
        mock_response = MagicMock()
        mock_response.json.return_value = {"elements": []}
        mock_response.raise_for_status = MagicMock()

        with patch("httpx.post", return_value=mock_response):
            result = client.compute_curvature_for_route(40.0, -100.0, route_id="missing_test")
            assert result is None

    def test_curvature_computation(self, tmp_path):
        """Client should compute curvature from OSM geometry."""
        client = OSMClient(cache_dir=tmp_path)

        # Mock response with geometry
        mock_response = MagicMock()
        mock_data = {
            "elements": [
                {
                    "id": 123,
                    "nodes": [1, 2, 3, 4],
                    "geometry": [
                        {"lat": 40.0, "lon": -100.0},
                        {"lat": 40.01, "lon": -100.0},
                        {"lat": 40.01, "lon": -99.99},
                        {"lat": 40.02, "lon": -99.99},
                    ],
                }
            ]
        }
        mock_response.json.return_value = mock_data
        mock_response.raise_for_status = MagicMock()

        with patch("httpx.post", return_value=mock_response):
            score = client.compute_curvature_for_route(40.0, -100.0, route_id="curvature_test")
            assert score is not None
            assert 0 <= score <= 100

    def test_http_error_handling(self, tmp_path):
        """Client should handle HTTP errors gracefully."""
        client = OSMClient(cache_dir=tmp_path)

        with patch("httpx.post", side_effect=httpx.HTTPError("API error")):
            score = client.compute_curvature_for_route(40.0, -100.0, route_id="error_test")
            assert score is None

    def test_way_without_geometry(self, tmp_path):
        """Client should handle ways without geometry field."""
        client = OSMClient(cache_dir=tmp_path)

        mock_response = MagicMock()
        mock_data = {
            "elements": [
                {
                    "id": 123,
                    "nodes": [1, 2, 3],
                    # No geometry field
                }
            ]
        }
        mock_response.json.return_value = mock_data
        mock_response.raise_for_status = MagicMock()

        with patch("httpx.post", return_value=mock_response):
            score = client.compute_curvature_for_route(40.0, -100.0, route_id="no_geom_test")
            assert score is None

    def test_selects_longest_way(self, tmp_path):
        """Client should select the way with most nodes as most relevant."""
        client = OSMClient(cache_dir=tmp_path)

        mock_response = MagicMock()
        mock_data = {
            "elements": [
                {
                    "id": 111,
                    "nodes": [1, 2],
                    "geometry": [{"lat": 40.0, "lon": -100.0}, {"lat": 40.01, "lon": -100.0}],
                },
                {
                    "id": 222,
                    "nodes": [1, 2, 3, 4, 5],  # More nodes
                    "geometry": [
                        {"lat": 40.0, "lon": -100.0},
                        {"lat": 40.01, "lon": -100.0},
                        {"lat": 40.01, "lon": -99.99},
                        {"lat": 40.02, "lon": -99.99},
                        {"lat": 40.02, "lon": -99.98},
                    ],
                },
            ]
        }
        mock_response.json.return_value = mock_data
        mock_response.raise_for_status = MagicMock()

        with patch("httpx.post", return_value=mock_response):
            score = client.compute_curvature_for_route(40.0, -100.0, route_id="longest_test")
            # Should compute curvature from the longer way (222)
            assert score is not None
            assert 0 <= score <= 100
