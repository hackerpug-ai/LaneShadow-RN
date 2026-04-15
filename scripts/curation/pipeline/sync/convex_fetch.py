"""Convex fetch helpers for reading route data.

Provides query functions to fetch routes from Convex via HTTP API.
"""

from __future__ import annotations

import logging
from typing import Any

import requests

from scripts.curation.pipeline.models import Route

logger = logging.getLogger(__name__)


class ConfigurationError(Exception):
    """Raised when required configuration (e.g., deploy key) is missing."""


def _dict_to_route(data: dict[str, Any]) -> Route:
    """Convert a Convex route document to a Route dataclass.

    Args:
        data: Route document from Convex (camelCase)

    Returns:
        Route object with snake_case fields
    """
    return Route(
        route_id=data["routeId"],
        name=data["name"],
        state=data["state"],
        source=data["source"],
        centroid_lat=data["centroidLat"],
        centroid_lng=data["centroidLng"],
        length_miles=data.get("lengthMiles"),
        bounds_ne_lat=data.get("boundsNeLat"),
        bounds_ne_lng=data.get("boundsNeLng"),
        bounds_sw_lat=data.get("boundsSwLat"),
        bounds_sw_lng=data.get("boundsSwLng"),
        candidate_identifiers=data.get("candidateIdentifiers", []),
        highway_number=data.get("highwayNumber"),
        search_text=data.get("searchText"),
        embedding=data.get("searchEmbedding"),  # Convex uses searchEmbedding
    )


def fetch_routes_needing_embedding(
    base_url: str,
    deploy_key: str,
    incremental: bool = False,
    limit: int = 1000,
) -> list[Route]:
    """Fetch routes from Convex that need embeddings.

    Queries the getRoutesNeedingEmbedding Convex function via HTTP.
    If incremental=True, only returns routes without searchEmbedding.
    If incremental=False, returns all routes (up to limit).

    Args:
        base_url: Base URL of the Convex deployment (e.g., "https://example.convex.site")
        deploy_key: Deploy key for authentication (CURATION_DEPLOY_KEY from .env.local)
        incremental: If True, only fetch routes without existing embeddings
        limit: Maximum number of routes to fetch (default: 1000)

    Returns:
        List of Route objects

    Raises:
        ConfigurationError: if deploy_key is empty or None
        requests.HTTPError: on HTTP errors

    Example:
        >>> routes = fetch_routes_needing_embedding(
        ...     base_url="https://myapp.convex.site",
        ...     deploy_key="my_deploy_key",
        ...     incremental=True,
        ... )
        >>> len(routes)
        42
    """
    if not deploy_key:
        raise ConfigurationError(
            "CURATION_DEPLOY_KEY is not set. "
            "Add it to .env.local (see 09-technical-requirements.md §API Design)."
        )

    url = f"{base_url.rstrip('/')}/api/semanticSearch/getRoutesNeedingEmbedding"
    headers = {
        "Authorization": f"Bearer {deploy_key}",
        "Content-Type": "application/json",
    }

    logger.info(
        f"Fetching routes from Convex (incremental={incremental}, limit={limit})..."
    )

    params = {
        "incremental": incremental,
        "limit": limit,
    }

    response = requests.get(url, headers=headers, params=params, timeout=30)
    response.raise_for_status()

    data = response.json()
    routes = [_dict_to_route(route_data) for route_data in data]

    logger.info(f"Fetched {len(routes)} routes from Convex")

    return routes
