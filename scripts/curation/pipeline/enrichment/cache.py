"""File-based cache for OSM API responses.

Provides persistent caching keyed by route_id and query parameters.
Cache entries include timestamps for invalidation.
"""

import json
import logging
from pathlib import Path
from typing import Any, Optional

logger = logging.getLogger(__name__)


class FileCache:
    """File-based cache for API responses.

    Cache entries are stored as JSON files with metadata including
    timestamp for cache invalidation. Keys are constructed from
    route_id and query parameters.
    """

    def __init__(self, cache_dir: Path):
        """Initialize the file cache.

        Args:
            cache_dir: Directory to store cache files. Created if it doesn't exist.
        """
        self.cache_dir = cache_dir
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        logger.debug(f"Initialized file cache at {cache_dir}")

    def get(self, key: str) -> Optional[dict[str, Any]]:
        """Retrieve a cached response if available.

        Args:
            key: Cache key (typically route_id + query params)

        Returns:
            Cached response dict, or None if not found or on error.
        """
        cache_path = self._get_cache_path(key)
        if not cache_path.exists():
            logger.debug(f"Cache miss: {key}")
            return None

        try:
            with open(cache_path, "r", encoding="utf-8") as f:
                entry = json.load(f)
            logger.debug(f"Cache hit: {key} (timestamp: {entry.get('timestamp')})")
            return entry.get("data")
        except (json.JSONDecodeError, OSError) as e:
            logger.warning(f"Failed to read cache entry {key}: {e}")
            return None

    def set(self, key: str, data: dict[str, Any]) -> None:
        """Store a response in the cache.

        Args:
            key: Cache key (typically route_id + query params)
            data: Response data to cache
        """
        cache_path = self._get_cache_path(key)
        entry = {
            "data": data,
            "timestamp": Path(cache_path).stat().st_mtime if cache_path.exists() else 0,
        }
        try:
            with open(cache_path, "w", encoding="utf-8") as f:
                json.dump(entry, f, indent=2)
            logger.debug(f"Cached response: {key}")
        except OSError as e:
            logger.warning(f"Failed to write cache entry {key}: {e}")

    def _get_cache_path(self, key: str) -> Path:
        """Get the filesystem path for a cache key.

        Args:
            key: Cache key

        Returns:
            Path to cache file (key is sanitized for filesystem safety)
        """
        # Sanitize key for filesystem safety
        safe_key = key.replace("/", "_").replace("\\", "_").replace(":", "_")
        return self.cache_dir / f"{safe_key}.json"
