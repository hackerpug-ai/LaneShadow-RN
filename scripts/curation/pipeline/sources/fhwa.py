"""FHWA National Scenic Byways CSV ingestion module.

This module parses FHWA CSV files into Route instances.
"""

import csv
import logging
import re
from scripts.curation.pipeline.models import Route

logger = logging.getLogger(__name__)


def _make_route_id(name: str, state: str) -> str:
    """Deterministic slug from name + state. Used as stable upsert key."""
    slug = re.sub(r"[^a-z0-9]+", "-", (name + "-" + state).lower()).strip("-")
    return f"fhwa-{slug}"


def _safe_float(value: str | None) -> float | None:
    """Return float or None without raising."""
    try:
        return float(value) if value and value.strip() else None
    except (ValueError, TypeError):
        return None


def parse_fhwa_csv(path: str) -> list[Route]:
    """
    Parse FHWA National Scenic Byways CSV into Route instances.

    Skips rows with missing required fields or unparseable coordinates,
    logging a warning for each skipped row.

    Returns a list of Route objects with source="fhwa".
    """
    routes = []
    with open(path, newline="", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        for i, row in enumerate(reader):
            try:
                name = row.get("RouteName", "").strip()
                state = row.get("State", "").strip()
                if not name or not state:
                    logger.warning("Row %d: missing name or state — skipping", i)
                    continue
                centroid_lat = float(row["CentroidLat"])
                centroid_lng = float(row["CentroidLng"])
            except (KeyError, ValueError) as e:
                logger.warning("Row %d: parse error (%s) — skipping", i, e)
                continue

            routes.append(Route(
                route_id=_make_route_id(name, state),
                name=name,
                state=state,
                source="fhwa",
                centroid_lat=centroid_lat,
                centroid_lng=centroid_lng,
                length_miles=_safe_float(row.get("LengthMiles")),
            ))
    return routes
