# Data ingestion sources
# NOTE: MotorcycleRoadsScraper removed in BASE-009a Phase 5.
# NOTE: BestBikingRoadsScraper removed in BASE-009b Phase 5.
# Both are now thin glue modules over crawl_plan framework.
# Use: python -m scripts.curation.pipeline.sources.bestbikingroads
# Use: python -m scripts.curation.pipeline.sources.motorcycleroads

from .base_scraper import BaseScraper, RateLimiter, UserAgentRotator
from .robots_checker import RobotsChecker

__all__ = [
    "BaseScraper",
    "RateLimiter",
    "UserAgentRotator",
    "RobotsChecker",
]
