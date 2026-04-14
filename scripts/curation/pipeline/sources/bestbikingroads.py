"""BestBikingRoads.com scraper for US motorcycle route data.

Scrapes route listings by state from bestbikingroads.com, extracting:
- Route name
- Location (country/state)
- Description
- Rating (if available)
- Source URL (required for P2 compliance)

The site is organized by country with pagination. Contains 17,976+ routes.
This scraper focuses on US routes only.
"""

import asyncio
import json
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

    State-paginated scraper that extracts US-only route data from state
    listing pages. Includes state-level progress tracking for resumability.
    """

    BASE_URL = "https://www.bestbikingroads.com"
    ROADS_LISTING_URL = f"{BASE_URL}/roads/"

    # Progress file for state-level resume
    PROGRESS_FILE = "bestbikingroads_progress.json"

    # Focus on US routes only
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
        self._progress_path = self.output_dir / self.PROGRESS_FILE
        self._completed_states: set[str] = self._load_progress()

    def _load_progress(self) -> set[str]:
        """Load completed states from progress file for resume capability."""
        if not self._progress_path.exists():
            return set()

        try:
            with open(self._progress_path, "r", encoding="utf-8") as f:
                data = json.loads(f.read())
                completed = set(data.get("completed_states", []))
                if completed:
                    logger.info(f"Resuming: {len(completed)} states already completed ({', '.join(sorted(completed)[:5])}...)")
                return completed
        except (json.JSONDecodeError, Exception) as e:
            logger.warning(f"Could not load progress file: {e}")
            return set()

    def _save_progress(self, state: str) -> None:
        """Mark a state as completed and persist progress."""
        self._completed_states.add(state)
        try:
            with open(self._progress_path, "w", encoding="utf-8") as f:
                json.dump({"completed_states": sorted(self._completed_states)}, f, indent=2)
        except Exception as e:
            logger.warning(f"Could not save progress file: {e}")

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
        skipped_states = 0

        for state in self.states:
            # Skip states already completed in a previous run
            if state in self._completed_states:
                logger.info(f"Skipping completed state: {state}")
                skipped_states += 1
                continue

            logger.info(f"Scraping state: {state}")

            try:
                state_routes = 0
                async for route in self._scrape_state(state):
                    total_routes += 1
                    state_routes += 1
                    if total_routes % 10 == 0:
                        logger.info(f"Scraped {total_routes} routes so far")
                    yield route

                # Mark state as completed after processing all its routes
                self._save_progress(state)
                logger.info(f"Completed {state}: {state_routes} routes")

            except Exception as e:
                logger.error(f"Error scraping state {state}: {e}")
                # Don't mark as completed on error — will retry on next run
                continue

        logger.info(f"Completed scraping {total_routes} routes from {len(self.states)} states ({skipped_states} resumed)")

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
            route_links = soup.select("a[href*='/motorcycle-roads/']")

            logger.info(f"Found {len(route_links)} route links for {state}")

            for link in route_links:
                href = link.get("href", "")

                # Skip if not a direct route link
                if not href or "/motorcycle-roads/" not in href:
                    continue

                # Skip navigation/filter/listing links
                if any(skip in href for skip in ["/country/", "/routes/", "/roads/"]):
                    continue

                # US-only filter: skip any route not in /united-states/
                if "/united-states/" not in href:
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

                    # Extract state from route URL: /united-states/{state}/ride/{slug}
                    # The listing page contains cross-state links, so use the URL's state.
                    route_state = state  # default to listing state
                    url_path = route_url.split("/united-states/")[-1]
                    parts = url_path.split("/")
                    if len(parts) >= 1:
                        url_state_slug = parts[0]
                        # Verify it's a known US state slug
                        if url_state_slug in self.US_STATES:
                            route_state = url_state_slug

                    # Fetch the route detail page
                    route_html = await self.fetch(route_url)
                    route_soup = BeautifulSoup(route_html, "html.parser")

                    # Extract detailed information
                    record = self._extract_route_data(route_soup, route_url, route_name, route_state)

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
    """Main entry point for production scraping."""
    import logging

    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )

    # Production output directory
    output_dir = Path("/Users/justinrich/Projects/LaneShadow/staging")

    # Scrape all US states (production mode)
    scraper = BestBikingRoadsScraper(output_dir, states=None)  # None means all US states

    try:
        route_count = 0
        async for route in scraper.scrape():
            route_count += 1
            if route_count % 100 == 0:
                print(f"Progress: {route_count} routes scraped...")

        print(f"\n✓ Total routes scraped: {route_count}")

    finally:
        await scraper.close()


if __name__ == "__main__":
    asyncio.run(main())
