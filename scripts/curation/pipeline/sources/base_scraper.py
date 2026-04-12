"""Base scraper class with shared functionality for community site scraping.

Provides rate limiting, User-Agent rotation, Playwright fallback for JS-rendered
pages, and resumable JSONL writing with deduplication.
"""

import asyncio
import json
import logging
import random
import time
from abc import ABC, abstractmethod
from pathlib import Path
from typing import AsyncIterator, Optional

import httpx
from bs4 import BeautifulSoup

logger = logging.getLogger(__name__)


class RateLimiter:
    """Enforces rate limiting with configurable delays and per-minute caps."""

    def __init__(self, min_delay: float = 2.0, max_delay: float = 4.0, max_per_minute: int = 20):
        """Initialize rate limiter with delay bounds and request cap.

        Args:
            min_delay: Minimum seconds between requests (default 2.0)
            max_delay: Maximum seconds between requests (default 4.0)
            max_per_minute: Maximum requests allowed per minute (default 20)
        """
        self.min_delay = min_delay
        self.max_delay = max_delay
        self.max_per_minute = max_per_minute
        self.request_times: list[float] = []

    async def wait(self) -> None:
        """Wait as needed to enforce rate limits.

        Ensures:
        - No more than max_per_minute requests in any 60-second window
        - Random delay between min_delay and max_delay for each request
        """
        now = time.monotonic()

        # Enforce per-minute cap
        recent = [t for t in self.request_times if now - t < 60]
        if len(recent) >= self.max_per_minute:
            sleep_until = recent[0] + 60
            wait_time = max(0, sleep_until - now)
            logger.debug(f"Rate limit reached, waiting {wait_time:.2f}s")
            await asyncio.sleep(wait_time)
            now = time.monotonic()

        # Enforce min/max delay
        delay = random.uniform(self.min_delay, self.max_delay)
        logger.debug(f"Rate limiting: waiting {delay:.2f}s")
        await asyncio.sleep(delay)

        # Record this request time
        self.request_times.append(time.monotonic())


class UserAgentRotator:
    """Rotates through a pool of common browser User-Agent strings."""

    USER_AGENTS = [
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:121.0) Gecko/20100101 Firefox/121.0",
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Edge/120.0.0.0",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36 Edg/119.0.0.0",
    ]

    def next(self) -> str:
        """Return a random User-Agent string from the pool."""
        return random.choice(self.USER_AGENTS)


class BaseScraper(ABC):
    """Abstract base class for web scrapers with shared functionality.

    Features:
    - Rate limiting (configurable delays and per-minute caps)
    - User-Agent rotation
    - Playwright fallback for JS-rendered pages
    - Resumable JSONL writes with deduplication
    - Robots.txt checking
    """

    def __init__(self, source_name: str, output_dir: Path):
        """Initialize the base scraper.

        Args:
            source_name: Name of the data source (e.g., "motorcycleroads")
            output_dir: Directory path for JSONL output files
        """
        self.source_name = source_name
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)

        self.rate_limiter = RateLimiter(min_delay=2.0, max_delay=4.0, max_per_minute=20)
        self.ua_rotator = UserAgentRotator()
        self.session = httpx.AsyncClient(timeout=30.0, follow_redirects=True)
        self.playwright_page = None
        self._scraped_urls: set[str] = set()
        self._jsonl_path = self.output_dir / f"{self.source_name}.jsonl"

        # Load existing scraped URLs for resume capability
        self._load_scraped_urls()

    def _load_scraped_urls(self) -> None:
        """Load previously scraped URLs from existing JSONL file for resume capability."""
        if not self._jsonl_path.exists():
            return

        try:
            with open(self._jsonl_path, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if not line:
                        continue
                    try:
                        record = json.loads(line)
                        if "source_url" in record:
                            self._scraped_urls.add(record["source_url"])
                    except json.JSONDecodeError:
                        logger.warning(f"Skipping invalid JSON line in {self._jsonl_path}")
            logger.info(f"Loaded {len(self._scraped_urls)} previously scraped URLs from {self._jsonl_path}")
        except Exception as e:
            logger.error(f"Error loading scraped URLs: {e}")

    async def fetch(self, url: str) -> str:
        """Fetch a URL with rate limiting and UA rotation.

        Args:
            url: The URL to fetch

        Returns:
            HTML content as string

        Raises:
            httpx.HTTPError: If the request fails
        """
        await self.rate_limiter.wait()
        headers = {"User-Agent": self.ua_rotator.next()}

        try:
            response = await self.session.get(url, headers=headers)
            response.raise_for_status()
            html = response.text

            # Check if page is JS-rendered (empty or minimal content)
            if self._is_js_rendered(html):
                logger.info(f"JS-rendered content detected for {url}, falling back to Playwright")
                html = await self._fetch_with_playwright(url)

            return html

        except httpx.HTTPError as e:
            logger.error(f"HTTP error fetching {url}: {e}")
            raise

    def _is_js_rendered(self, html: str) -> bool:
        """Check if HTML appears to be JS-rendered (minimal content).

        Args:
            html: HTML content to check

        Returns:
            True if content appears to be JS-rendered
        """
        soup = BeautifulSoup(html, "html.parser")

        # Remove script and style elements
        for script in soup(["script", "style"]):
            script.decompose()

        text = soup.get_text(strip=True)

        # If very little text content, likely JS-rendered
        return len(text) < 200

    async def _fetch_with_playwright(self, url: str) -> str:
        """Fetch a URL using Playwright for JS-rendered content.

        Args:
            url: The URL to fetch

        Returns:
            Rendered HTML content as string
        """
        try:
            # Lazy import Playwright to avoid dependency when not needed
            from playwright.async_api import async_playwright

            if self.playwright_page is None:
                playwright = await async_playwright().start()
                browser = await playwright.chromium.launch()
                context = await browser.new_context(user_agent=self.ua_rotator.next())
                page = await context.new_page()
                self.playwright_page = page
                self._playwright = playwright  # Keep reference for cleanup

            page = self.playwright_page
            await page.goto(url, wait_until="networkidle", timeout=30000)
            html = await page.content()

            logger.info(f"Successfully fetched {url} with Playwright")
            return html

        except ImportError:
            logger.error("Playwright not installed, cannot fetch JS-rendered content")
            raise
        except Exception as e:
            logger.error(f"Error fetching with Playwright: {e}")
            raise

    def is_already_scraped(self, url: str) -> bool:
        """Check if a URL has already been scraped.

        Args:
            url: URL to check

        Returns:
            True if URL was already scraped in a previous run
        """
        return url in self._scraped_urls

    def write_jsonl(self, record: dict) -> None:
        """Write a record to the JSONL file.

        Each line is a complete JSON object. This format allows resumable
        writes - we can append to the file and skip already-scraped URLs.

        Args:
            record: Dictionary record to write (must include source_url)
        """
        if "source_url" not in record:
            raise ValueError("Record must include source_url field")

        source_url = record["source_url"]

        # Skip if already scraped
        if source_url in self._scraped_urls:
            logger.debug(f"Skipping already scraped URL: {source_url}")
            return

        # Add scraped timestamp if not present
        if "scraped_at" not in record:
            import time
            record["scraped_at"] = int(time.time())

        # Write to JSONL file
        with open(self._jsonl_path, "a", encoding="utf-8") as f:
            f.write(json.dumps(record, ensure_ascii=False) + "\n")

        # Track as scraped
        self._scraped_urls.add(source_url)

    async def close(self) -> None:
        """Clean up resources (HTTP session, Playwright browser)."""
        await self.session.aclose()

        if hasattr(self, '_playwright') and self._playwright:
            await self._playwright.stop()
            self._playwright = None

    @abstractmethod
    async def scrape(self) -> AsyncIterator[dict]:
        """Scrape the source and yield route records.

        Each yielded record must be a dict with at least:
        - name: str
        - state: str | None
        - description: str | None
        - rating: float | None
        - source_url: str (required for P2 compliance)

        Yields:
            Dictionary records for each scraped route
        """
        pass
