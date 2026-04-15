"""Unit tests for community site scrapers.

Tests rate limiting, robots.txt checking, JSONL output, resume logic,
and scraper functionality with mocked HTTP responses.
"""

import asyncio
import json
import tempfile
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from bs4 import BeautifulSoup

from scripts.curation.pipeline.sources.base_scraper import (
    BaseScraper,
    RateLimiter,
    UserAgentRotator,
)
from scripts.curation.pipeline.sources.robots_checker import RobotsChecker
# from scripts.curation.pipeline.sources.bestbikingroads import BestBikingRoadsScraper
# NOTE: BestBikingRoadsScraper class was removed in BASE-009b refactor
# The scraper is now a thin glue script using crawl_plan framework
# Tests need to be updated to match new architecture


class TestRateLimiter:
    """Test rate limiting functionality."""

    @pytest.mark.asyncio
    async def test_respects_min_delay(self):
        """Test that minimum delay is enforced between requests."""
        limiter = RateLimiter(min_delay=0.1, max_delay=0.2, max_per_minute=100)

        import time
        start = time.monotonic()

        await limiter.wait()
        await limiter.wait()

        elapsed = time.monotonic() - start

        # Should take at least 0.1 seconds
        assert elapsed >= 0.1

    @pytest.mark.asyncio
    async def test_respects_max_per_minute(self):
        """Test that per-minute request cap is enforced."""
        limiter = RateLimiter(min_delay=0.01, max_delay=0.02, max_per_minute=2)

        # First two requests should go through quickly
        await limiter.wait()
        await limiter.wait()

        # Third request should be rate-limited
        import time
        start = time.monotonic()
        await limiter.wait()
        elapsed = time.monotonic() - start

        # Should be delayed due to hitting the cap
        assert elapsed >= 0.5  # Generous allowance for test timing


class TestUserAgentRotator:
    """Test User-Agent rotation."""

    def test_returns_valid_user_agent(self):
        """Test that rotator returns a valid User-Agent string."""
        rotator = UserAgentRotator()
        ua = rotator.next()

        assert isinstance(ua, str)
        assert len(ua) > 0
        assert "Mozilla" in ua

    def test_rotates_user_agents(self):
        """Test that rotator returns different UAs (probabilistically)."""
        rotator = UserAgentRotator()

        # Get 20 UAs and check we get variety
        uas = [rotator.next() for _ in range(20)]
        unique_uas = set(uas)

        # Should have multiple different UAs
        assert len(unique_uas) > 1


class TestRobotsChecker:
    """Test robots.txt checking functionality."""

    @pytest.mark.asyncio
    async def test_allows_when_no_robots_txt(self):
        """Test that scraping is allowed when robots.txt is unavailable."""
        checker = RobotsChecker()

        with patch("httpx.AsyncClient.get") as mock_get:
            mock_get.side_effect = Exception("Network error")

            result = await checker.can_fetch("https://example.com/page")

            # Should allow scraping when robots.txt is unavailable
            assert result is True

    @pytest.mark.asyncio
    async def test_respects_disallow(self):
        """Test that disallowed URLs are blocked."""
        checker = RobotsChecker()

        robots_content = """
        User-agent: *
        Disallow: /private/
        """

        with patch("httpx.AsyncClient.get") as mock_get:
            mock_response = MagicMock()
            mock_response.text = robots_content
            mock_response.raise_for_status = MagicMock()
            mock_get.return_value = mock_response

            # Disallowed URL
            result1 = await checker.can_fetch("https://example.com/private/page")
            assert result1 is False

            # Allowed URL
            result2 = await checker.can_fetch("https://example.com/public/page")
            assert result2 is True


class _ConcreteBaseScraper(BaseScraper):
    """Concrete subclass for testing BaseScraper abstract methods."""

    async def scrape(self):
        """Stub implementation of abstract method."""
        return
        yield  # make it an async generator


class TestBaseScraper:
    """Test base scraper functionality."""

    @pytest.fixture
    def temp_output_dir(self):
        """Create a temporary directory for test output."""
        with tempfile.TemporaryDirectory() as tmpdir:
            yield Path(tmpdir)

    @pytest.mark.asyncio
    async def test_jsonl_write_and_resume(self, temp_output_dir):
        """Test that JSONL writes are resumable with deduplication."""
        scraper = _ConcreteBaseScraper("test_source", temp_output_dir)

        # Write a record
        record1 = {
            "name": "Test Route 1",
            "state": "TN",
            "description": "Test description",
            "rating": 4.5,
            "source_url": "https://example.com/route1",
            "source": "test_source",
        }

        scraper.write_jsonl(record1)

        # Check that URL is tracked
        assert scraper.is_already_scraped("https://example.com/route1")

        # Write same record again (should be skipped)
        scraper.write_jsonl(record1)

        # Read JSONL file and verify only one record
        jsonl_path = temp_output_dir / "test_source.jsonl"
        with open(jsonl_path, "r") as f:
            lines = f.readlines()

        assert len(lines) == 1

        # Verify record content
        data = json.loads(lines[0])
        assert data["name"] == "Test Route 1"
        assert "scraped_at" in data

    @pytest.mark.asyncio
    async def test_loads_existing_urls_on_init(self, temp_output_dir):
        """Test that existing URLs are loaded for resume capability."""
        # Create a JSONL file with existing data
        jsonl_path = temp_output_dir / "test_source.jsonl"
        with open(jsonl_path, "w") as f:
            f.write(json.dumps({
                "name": "Existing Route",
                "state": "NC",
                "source_url": "https://example.com/existing",
                "source": "test_source",
            }) + "\n")

        # Create scraper and check it loaded the existing URL
        scraper = _ConcreteBaseScraper("test_source", temp_output_dir)

        assert scraper.is_already_scraped("https://example.com/existing")

    def test_requires_source_url(self, temp_output_dir):
        """Test that records without source_url are rejected."""
        scraper = _ConcreteBaseScraper("test_source", temp_output_dir)

        record_without_url = {
            "name": "Test Route",
            "state": "TN",
        }

        with pytest.raises(ValueError, match="must include source_url"):
            scraper.write_jsonl(record_without_url)


# NOTE: TestBestBikingRoadsScraper class removed in BASE-009b remediation
# BestBikingRoadsScraper was refactored from class-based to script-based architecture
# using the crawl_plan framework. Tests need to be rewritten to match new architecture.
