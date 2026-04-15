"""Normalize staging rows from all three sources to a common Route-shaped dict.

Each source has slightly different field names. This module maps them to a
canonical dict that the extractor and convex_push can consume.

Returned dict fields:
    route_id, name, state, source, description, length_miles,
    centroid_lat, centroid_lng, canonical_url, source_url, rating

centroid_lat / centroid_lng may be None for scraper sources — that is
acceptable. The Convex validator requires a float, so we default to 0.0
at push time (see stages.py).
"""

from __future__ import annotations

import hashlib
import re
from typing import Any, Optional
from urllib.parse import urlparse

# KM -> miles conversion factor
_KM_TO_MILES = 0.621371

# State name normalizer — expand lowercase to Title Case
_STATE_MAP: dict[str, str] = {
    "alabama": "Alabama", "alaska": "Alaska", "arizona": "Arizona",
    "arkansas": "Arkansas", "california": "California", "colorado": "Colorado",
    "connecticut": "Connecticut", "delaware": "Delaware", "florida": "Florida",
    "georgia": "Georgia", "hawaii": "Hawaii", "idaho": "Idaho",
    "illinois": "Illinois", "indiana": "Indiana", "iowa": "Iowa",
    "kansas": "Kansas", "kentucky": "Kentucky", "louisiana": "Louisiana",
    "maine": "Maine", "maryland": "Maryland", "massachusetts": "Massachusetts",
    "michigan": "Michigan", "minnesota": "Minnesota", "mississippi": "Mississippi",
    "missouri": "Missouri", "montana": "Montana", "nebraska": "Nebraska",
    "nevada": "Nevada", "new hampshire": "New Hampshire", "new jersey": "New Jersey",
    "new mexico": "New Mexico", "new york": "New York",
    "north carolina": "North Carolina", "north dakota": "North Dakota",
    "ohio": "Ohio", "oklahoma": "Oklahoma", "oregon": "Oregon",
    "pennsylvania": "Pennsylvania", "rhode island": "Rhode Island",
    "south carolina": "South Carolina", "south dakota": "South Dakota",
    "tennessee": "Tennessee", "texas": "Texas", "utah": "Utah",
    "vermont": "Vermont", "virginia": "Virginia", "washington": "Washington",
    "west virginia": "West Virginia", "wisconsin": "Wisconsin",
    "wyoming": "Wyoming",
    # Canadian provinces (bestbikingroads has some)
    "ontario": "Ontario", "british columbia": "British Columbia",
    "alberta": "Alberta", "quebec": "Quebec",
}


def _normalize_state(raw: Optional[str]) -> str:
    """Return Title-Case state name from any casing. Returns raw title-case if unknown."""
    if not raw:
        return ""
    lower = raw.strip().lower()
    if lower in _STATE_MAP:
        return _STATE_MAP[lower]
    return raw.strip().title()


def _slug_from_url(url: Optional[str]) -> str:
    """Extract the last non-empty path segment from a URL as a slug."""
    if not url:
        return ""
    parsed = urlparse(url)
    # Get the last non-empty segment
    segments = [s for s in parsed.path.split("/") if s]
    if segments:
        slug = segments[-1]
        # Remove common extensions
        slug = re.sub(r"\.(html?|php|asp)$", "", slug, flags=re.IGNORECASE)
        return slug
    return ""


def _make_route_id(source: str, url: Optional[str], fallback_name: Optional[str] = None) -> str:
    """Derive a stable route_id from source + url slug.

    Falls back to a hash of (source, name) if URL is missing.
    """
    slug = _slug_from_url(url)
    if slug:
        # Clean up slug: lowercase, remove special chars, replace spaces/underscores with hyphens
        slug = re.sub(r"[^a-z0-9\-]", "-", slug.lower())
        slug = re.sub(r"-+", "-", slug).strip("-")
        return f"{source}:{slug}"

    # Fallback: hash of source + name
    key = f"{source}:{(fallback_name or '').lower().strip()}"
    digest = hashlib.md5(key.encode()).hexdigest()[:12]
    return f"{source}:{digest}"


def normalize_staging_row(row: dict[str, Any], source: str) -> dict[str, Any]:
    """Normalize a single staging row to a canonical Route-shaped dict.

    Args:
        row: Raw staging JSON dict
        source: One of 'motorcycleroads' | 'bestbikingroads' | 'fhwa'

    Returns:
        Dict with keys: route_id, name, state, source, description,
        length_miles, centroid_lat, centroid_lng, canonical_url,
        source_url, rating

    Raises:
        ValueError: if source is unrecognized
    """
    if source == "fhwa":
        return _normalize_fhwa(row)
    elif source in ("motorcycleroads", "bestbikingroads"):
        return _normalize_scraper(row, source)
    else:
        raise ValueError(f"Unknown source: {source!r}")


def _normalize_fhwa(row: dict[str, Any]) -> dict[str, Any]:
    """FHWA rows are already in Route shape — minimal transformation."""
    # Validate required FHWA fields
    if not row.get("route_id"):
        raise ValueError(f"FHWA row missing route_id: {row}")

    return {
        "route_id": row["route_id"],
        "name": row.get("name") or "",
        "state": _normalize_state(row.get("state")),
        "source": "fhwa",
        "description": row.get("description"),
        "length_miles": _safe_float(row.get("length_miles")),
        "centroid_lat": _safe_float(row.get("centroid_lat")),
        "centroid_lng": _safe_float(row.get("centroid_lng")),
        "bounds_ne_lat": _safe_float(row.get("bounds_ne_lat")),
        "bounds_ne_lng": _safe_float(row.get("bounds_ne_lng")),
        "bounds_sw_lat": _safe_float(row.get("bounds_sw_lat")),
        "bounds_sw_lng": _safe_float(row.get("bounds_sw_lng")),
        "canonical_url": row.get("canonical_url"),
        "source_url": row.get("source_url") or row.get("canonical_url"),
        "rating": _safe_float(row.get("rating")),
    }


def _normalize_scraper(row: dict[str, Any], source: str) -> dict[str, Any]:
    """Normalize motorcycleroads or bestbikingroads scraper row."""
    route_name = row.get("route_name") or ""
    canonical_url = row.get("canonical_url")
    source_url = row.get("source_url") or canonical_url

    route_id = _make_route_id(source, canonical_url, fallback_name=route_name)

    # State normalization
    state = _normalize_state(row.get("state_primary"))

    # Distance: motorcycleroads uses distance_mi; bestbikingroads uses distance_km
    length_miles: Optional[float] = None
    if row.get("distance_mi") is not None:
        length_miles = _safe_float(row["distance_mi"])
    elif row.get("distance_km") is not None:
        km = _safe_float(row["distance_km"])
        if km is not None:
            length_miles = round(km * _KM_TO_MILES, 2)

    return {
        "route_id": route_id,
        "name": route_name,
        "state": state,
        "source": source,
        "description": row.get("description"),
        "length_miles": length_miles,
        "centroid_lat": None,   # Not available from scrapers
        "centroid_lng": None,
        "bounds_ne_lat": None,
        "bounds_ne_lng": None,
        "bounds_sw_lat": None,
        "bounds_sw_lng": None,
        "canonical_url": canonical_url,
        "source_url": source_url,
        "rating": _safe_float(row.get("rating")),
    }


def _safe_float(val: Any) -> Optional[float]:
    """Convert val to float or return None on failure."""
    if val is None:
        return None
    try:
        return float(val)
    except (TypeError, ValueError):
        return None
