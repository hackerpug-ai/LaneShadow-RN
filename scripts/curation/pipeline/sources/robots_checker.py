"""Robots.txt checker utility for web scraping compliance.

Fetches and parses robots.txt files to ensure scrapers respect site policies.
"""

import logging
from urllib.robotparser import RobotFileParser
from urllib.parse import urlparse

import httpx

logger = logging.getLogger(__name__)


class RobotsChecker:
    """Checks robots.txt before scraping to ensure compliance."""

    def __init__(self, user_agent: str = "*"):
        """Initialize the robots.txt checker.

        Args:
            user_agent: User agent string to check (default "*" applies to all bots)
        """
        self.user_agent = user_agent
        self._cache: dict[str, RobotFileParser] = {}

    async def can_fetch(self, url: str) -> bool:
        """Check if a URL can be fetched according to robots.txt.

        Args:
            url: The URL to check

        Returns:
            True if the URL is allowed to be fetched
        """
        parsed = urlparse(url)
        base_url = f"{parsed.scheme}://{parsed.netloc}"

        # Get or create robots.txt parser for this domain
        if base_url not in self._cache:
            rp = RobotFileParser()
            robots_url = f"{base_url}/robots.txt"

            try:
                # Fetch robots.txt
                async with httpx.AsyncClient(timeout=10.0) as client:
                    response = await client.get(robots_url)
                    response.raise_for_status()

                # Parse robots.txt content
                rp.parse(response.text.splitlines())
                self._cache[base_url] = rp
                logger.info(f"Loaded robots.txt for {base_url}")

            except httpx.HTTPError as e:
                logger.warning(f"Could not fetch robots.txt for {base_url}: {e}")
                # If robots.txt is unavailable, allow scraping (conservative approach)
                return True
            except Exception as e:
                logger.error(f"Error parsing robots.txt for {base_url}: {e}")
                return True

        # Check if URL is allowed
        rp = self._cache[base_url]
        can_fetch = rp.can_fetch(self.user_agent, url)

        if not can_fetch:
            logger.warning(f"robots.txt disallows fetching: {url}")

        return can_fetch

    async def check_urls(self, urls: list[str]) -> dict[str, bool]:
        """Check multiple URLs and return allowed status for each.

        Args:
            urls: List of URLs to check

        Returns:
            Dictionary mapping URL to allowed status
        """
        results = {}
        for url in urls:
            results[url] = await self.can_fetch(url)
        return results

    def clear_cache(self) -> None:
        """Clear the cached robots.txt parsers."""
        self._cache.clear()


async def check_before_scraping(urls: list[str], user_agent: str = "*") -> dict[str, bool]:
    """Convenience function to check robots.txt before starting a scrape.

    Args:
        urls: List of URLs to check
        user_agent: User agent string (default "*")

    Returns:
        Dictionary mapping URL to allowed status

    Raises:
        ValueError: If any URL is disallowed by robots.txt
    """
    checker = RobotsChecker(user_agent=user_agent)
    results = await checker.check_urls(urls)

    disallowed = [url for url, allowed in results.items() if not allowed]

    if disallowed:
        logger.error(f"The following URLs are disallowed by robots.txt: {disallowed}")
        raise ValueError(f"Scraping disallowed by robots.txt for {len(disallowed)} URLs")

    return results
