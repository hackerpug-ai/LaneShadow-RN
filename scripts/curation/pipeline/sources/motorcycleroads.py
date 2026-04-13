"""MotorcycleRoads.com scraper for US motorcycle route data.

Scrapes route listings by state from motorcycleroads.com, extracting:
- Route name
- State
- Description
- Rating (if available)
- Source URL (required for P2 compliance)

The site is organized by state pages with pagination.
"""

import asyncio
import logging
import re
from pathlib import Path
from typing import AsyncIterator

from bs4 import BeautifulSoup
from urllib.parse import urljoin

from .base_scraper import BaseScraper
from .robots_checker import RobotsChecker

logger = logging.getLogger(__name__)


class MotorcycleRoadsScraper(BaseScraper):
    """Scraper for motorcycleroads.com community-sourced routes.

    State-paginated scraper that extracts route data from state listing pages.
    """

    BASE_URL = "https://www.motorcycleroads.com"
    ROADS_LISTING_URL = f"{BASE_URL}/motorcycle-roads"

    # US states to scrape (can be filtered)
    US_STATES = [
        "Alabama", "Alaska", "Arizona", "Arkansas", "California",
        "Colorado", "Connecticut", "Delaware", "Florida", "Georgia",
        "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas",
        "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts",
        "Michigan", "Minnesota", "Mississippi", "Missouri", "Montana",
        "Nebraska", "Nevada", "New Hampshire", "New Jersey", "New Mexico",
        "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma",
        "Oregon", "Pennsylvania", "Rhode Island", "South Carolina",
        "South Dakota", "Tennessee", "Texas", "Utah", "Vermont",
        "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming"
    ]

    def __init__(self, output_dir: Path, states: list[str] | None = None):
        """Initialize the motorcycleroads.com scraper.

        Args:
            output_dir: Directory for JSONL output files
            states: List of states to scrape (default: all US states)
        """
        super().__init__("motorcycleroads", output_dir)
        self.states = states or self.US_STATES
        self.robots_checker = RobotsChecker()

    async def scrape(self) -> AsyncIterator[dict]:
        """Scrape routes from motorcycleroads.com.

        Yields:
            Dictionary records for each scraped route with fields:
            - name: str
            - state: str | None
            - description: str | None
            - rating: float | None
            - source_url: str
            - source: "motorcycleroads"
            - scraped_at: int
        """
        logger.info(f"Starting scrape of {len(self.states)} states from motorcycleroads.com")

        # Check robots.txt before starting
        try:
            can_scrape = await self.robots_checker.can_fetch(self.ROADS_LISTING_URL)
            if not can_scrape:
                logger.error("robots.txt disallows scraping motorcycleroads.com")
                return
        except Exception as e:
            logger.warning(f"Could not check robots.txt: {e}")

        total_routes = 0

        for state in self.states:
            logger.info(f"Scraping state: {state}")

            try:
                async for route in self._scrape_state(state):
                    total_routes += 1
                    if total_routes % 10 == 0:
                        logger.info(f"Scraped {total_routes} routes so far")
                    yield route

            except Exception as e:
                logger.error(f"Error scraping state {state}: {e}")
                continue

        logger.info(f"Completed scraping {total_routes} routes from {len(self.states)} states")

    async def _scrape_state(self, state: str) -> AsyncIterator[dict]:
        """Scrape all routes for a specific state.

        Args:
            state: State name (e.g., "Tennessee")

        Yields:
            Route records for the state
        """
        state_slug = state.lower().replace(" ", "-")

        # Try the state page URL
        state_url = f"{self.BASE_URL}/motorcycle-roads/{state_slug}"

        try:
            html = await self.fetch(state_url)
            soup = BeautifulSoup(html, "html.parser")

            # Find all route links on the state page
            # Routes are typically in views-field-title or similar containers
            route_links = soup.select("a[href*='/motorcycle-roads/']")

            logger.info(f"Found {len(route_links)} route links for {state}")

            for link in route_links:
                href = link.get("href", "")

                # Skip if not a direct route link
                if not href or "/motorcycle-roads/" not in href:
                    continue

                # Build full URL
                route_url = urljoin(self.BASE_URL, href)

                # Skip if already scraped
                if self.is_already_scraped(route_url):
                    logger.debug(f"Skipping already scraped: {route_url}")
                    continue

                try:
                    # Extract basic info from the listing page
                    route_name = link.get_text(strip=True)

                    if not route_name or route_name.lower() in ["read road guide", "more"]:
                        continue

                    # Fetch the route detail page
                    route_html = await self.fetch(route_url)
                    route_soup = BeautifulSoup(route_html, "html.parser")

                    # Extract detailed information
                    record = self._extract_route_data(route_soup, route_url, route_name, state)

                    if record:
                        self.write_jsonl(record)
                        yield record

                except Exception as e:
                    logger.error(f"Error scraping route {route_url}: {e}")
                    continue

        except Exception as e:
            logger.error(f"Error fetching state page {state_url}: {e}")

    def _extract_route_data(self, soup: BeautifulSoup, url: str, name: str, state: str) -> dict | None:
        """Extract structured data from a route detail page.

        Args:
            soup: BeautifulSoup object of the route page
            url: The route page URL
            name: Route name (from listing)
            state: State name

        Returns:
            Dictionary with route data or None if extraction fails
        """
        try:
            # Extract description from various possible locations
            description = None

            # Try common description selectors
            desc_selectors = [
                ".field-field-scenery",
                ".field-field-description",
                "article.route .content",
                ".route-description",
                "[property='og:description']"
            ]

            for selector in desc_selectors:
                elem = soup.select_one(selector)
                if elem:
                    description = elem.get_text(strip=True)
                    if len(description) > 50:  # Only use if substantial
                        break

            # Extract rating
            rating = None

            # Try to find rating in the page
            rating_selectors = [
                ".field-field-rating .field-content",
                ".rating_meter_img",
                "[class*='rating']",
                "[class*='score']"
            ]

            for selector in rating_selectors:
                elem = soup.select_one(selector)
                if elem:
                    rating_text = elem.get_text(strip=True)
                    # Look for numeric ratings (e.g., "4.5", "4.5 out of 5")
                    match = re.search(r"(\d+\.?\d*)\s*(out of\s*\d+)?", rating_text)
                    if match:
                        try:
                            rating = float(match.group(1))
                            if rating > 5:  # Normalize to 5-point scale if needed
                                rating = rating / 2
                            break
                        except ValueError:
                            pass

            # Build the record
            record = {
                "name": name,
                "state": state,
                "description": description,
                "rating": rating,
                "source_url": url,
                "source": "motorcycleroads",
            }

            return record

        except Exception as e:
            logger.error(f"Error extracting route data from {url}: {e}")
            return None


async def main():
    """Main entry point for production scraping."""
    import logging

    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )

    # Production output directory
    output_dir = Path("/Users/justinrich/Projects/LaneShadow/staging")

    # Scrape all US states (production mode)
    scraper = MotorcycleRoadsScraper(output_dir, states=None)  # None means all US states

    try:
        route_count = 0
        async for route in scraper.scrape():
            route_count += 1
            if route_count % 10 == 0:
                print(f"Progress: {route_count} routes scraped...")

        print(f"\n✓ Total routes scraped: {route_count}")

    finally:
        await scraper.close()


if __name__ == "__main__":
    asyncio.run(main())
