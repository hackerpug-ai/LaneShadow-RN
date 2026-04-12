"""BestBikingRoads.com scraper for international motorcycle route data.

Scrapes route listings by country from bestbikingroads.com, extracting:
- Route name
- Location (country/state)
- Description
- Rating (if available)
- Source URL (required for P2 compliance)

The site is organized by country with pagination. Contains 17,976+ routes.
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


class BestBikingRoadsScraper(BaseScraper):
    """Scraper for bestbikingroads.com community-sourced routes.

    Country-paginated scraper with US state sub-pages. Extracts route data
    from listing pages with pagination support.
    """

    BASE_URL = "https://www.bestbikingroads.com"
    ROADS_LISTING_URL = f"{BASE_URL}/roads/"

    # Focus on US routes initially (can be expanded)
    US_STATES = [
        "alabama", "alaska", "arizona", "arkansas", "california",
        "colorado", "connecticut", "florida", "georgia", "hawaii",
        "idaho", "illinois", "indiana", "iowa", "kansas", "kentucky",
        "louisiana", "maine", "maryland", "massachusetts", "michigan",
        "minnesota", "mississippi", "missouri", "montana", "nebraska",
        "nevada", "new-hampshire", "new-jersey", "new-mexico", "new-york",
        "north-carolina", "north-dakota", "ohio", "oklahoma", "oregon",
        "pennsylvania", "rhode-island", "south-carolina", "south-dakota",
        "tennessee", "texas", "utah", "vermont", "virginia", "washington",
        "west-virginia", "wisconsin", "wyoming"
    ]

    def __init__(self, output_dir: Path, states: list[str] | None = None):
        """Initialize the bestbikingroads.com scraper.

        Args:
            output_dir: Directory for JSONL output files
            states: List of states to scrape (default: US states)
        """
        super().__init__("bestbikingroads", output_dir)
        self.states = states or self.US_STATES
        self.robots_checker = RobotsChecker()

    async def scrape(self) -> AsyncIterator[dict]:
        """Scrape routes from bestbikingroads.com.

        Yields:
            Dictionary records for each scraped route with fields:
            - name: str
            - state: str | None
            - description: str | None
            - rating: float | None
            - source_url: str
            - source: "bestbikingroads"
            - scraped_at: int
        """
        logger.info(f"Starting scrape of {len(self.states)} states from bestbikingroads.com")

        # Check robots.txt before starting
        try:
            can_scrape = await self.robots_checker.can_fetch(self.ROADS_LISTING_URL)
            if not can_scrape:
                logger.error("robots.txt disallows scraping bestbikingroads.com")
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
            state: State slug (e.g., "tennessee")

        Yields:
            Route records for the state
        """
        state_url = f"{self.BASE_URL}/motorcycle-roads/united-states/routes/{state}"

        try:
            html = await self.fetch(state_url)
            soup = BeautifulSoup(html, "html.parser")

            # Find all route links on the state page
            # BestBikingRoads uses various link structures
            route_links = soup.select("a[href*='/motorcycle-roads/']")

            logger.info(f"Found {len(route_links)} route links for {state}")

            for link in route_links:
                href = link.get("href", "")

                # Skip if not a direct route link (exclude country/state listings)
                if not href or "/motorcycle-roads/" not in href:
                    continue

                # Skip navigation/filter links
                if any(skip in href for skip in ["/country/", "/routes/", "/roads/"]):
                    continue

                # Build full URL
                route_url = urljoin(self.BASE_URL, href)

                # Skip if already scraped
                if self.is_already_scraped(route_url):
                    logger.debug(f"Skipping already scraped: {route_url}")
                    continue

                try:
                    # Extract basic info from the link
                    route_name = link.get_text(strip=True)

                    if not route_name or len(route_name) < 3:
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
            state: State slug

        Returns:
            Dictionary with route data or None if extraction fails
        """
        try:
            # Extract description
            description = None

            # Try various description selectors
            desc_selectors = [
                ".route-description",
                ".road-description",
                "[property='og:description']",
                "article p",
                ".content p"
            ]

            for selector in desc_selectors:
                elem = soup.select_one(selector)
                if elem:
                    text = elem.get_text(strip=True)
                    if len(text) > 50:  # Only use if substantial
                        description = text
                        break

            # Extract rating
            rating = None

            # Look for rating displays
            rating_selectors = [
                ".rating",
                ".score",
                "[class*='star']",
                "[class*='rating-value']"
            ]

            for selector in rating_selectors:
                elem = soup.select_one(selector)
                if elem:
                    rating_text = elem.get_text(strip=True)
                    # Look for numeric ratings
                    match = re.search(r"(\d+\.?\d*)", rating_text)
                    if match:
                        try:
                            rating = float(match.group(1))
                            if rating > 5:  # Normalize to 5-point scale if needed
                                rating = rating / 2
                            break
                        except ValueError:
                            pass

            # Normalize state name (convert slug to proper name)
            state_name = self._normalize_state_name(state)

            # Build the record
            record = {
                "name": name,
                "state": state_name,
                "description": description,
                "rating": rating,
                "source_url": url,
                "source": "bestbikingroads",
            }

            return record

        except Exception as e:
            logger.error(f"Error extracting route data from {url}: {e}")
            return None

    def _normalize_state_name(self, state_slug: str) -> str:
        """Convert state slug to proper state name.

        Args:
            state_slug: State slug (e.g., "tennessee")

        Returns:
            Proper state name (e.g., "Tennessee")
        """
        # Common state mappings
        state_map = {
            "alabama": "Alabama", "alaska": "Alaska", "arizona": "Arizona",
            "arkansas": "Arkansas", "california": "California", "colorado": "Colorado",
            "connecticut": "Connecticut", "florida": "Florida", "georgia": "Georgia",
            "hawaii": "Hawaii", "idaho": "Idaho", "illinois": "Illinois",
            "indiana": "Indiana", "iowa": "Iowa", "kansas": "Kansas",
            "kentucky": "Kentucky", "louisiana": "Louisiana", "maine": "Maine",
            "maryland": "Maryland", "massachusetts": "Massachusetts", "michigan": "Michigan",
            "minnesota": "Minnesota", "mississippi": "Mississippi", "missouri": "Missouri",
            "montana": "Montana", "nebraska": "Nebraska", "nevada": "Nevada",
            "new-hampshire": "New Hampshire", "new-jersey": "New Jersey",
            "new-mexico": "New Mexico", "new-york": "New York",
            "north-carolina": "North Carolina", "north-dakota": "North Dakota",
            "ohio": "Ohio", "oklahoma": "Oklahoma", "oregon": "Oregon",
            "pennsylvania": "Pennsylvania", "rhode-island": "Rhode Island",
            "south-carolina": "South Carolina", "south-dakota": "South Dakota",
            "tennessee": "Tennessee", "texas": "Texas", "utah": "Utah",
            "vermont": "Vermont", "virginia": "Virginia", "washington": "Washington",
            "west-virginia": "West Virginia", "wisconsin": "Wisconsin", "wyoming": "Wyoming"
        }

        return state_map.get(state_slug.lower(), state_slug.title())


async def main():
    """Main entry point for testing."""
    import logging

    logging.basicConfig(level=logging.INFO)

    output_dir = Path("/Users/justinrich/Projects/LaneShadow/scripts/curation/output")

    # Scrape just Tennessee for testing
    scraper = BestBikingRoadsScraper(output_dir, states=["tennessee"])

    try:
        route_count = 0
        async for route in scraper.scrape():
            route_count += 1
            print(f"Scraped: {route['name']} ({route['state']})")
            if route_count >= 5:  # Limit for testing
                break

        print(f"\nTotal routes scraped: {route_count}")

    finally:
        await scraper.close()


if __name__ == "__main__":
    asyncio.run(main())
