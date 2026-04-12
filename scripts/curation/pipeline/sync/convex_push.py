"""Convex batch upsert push module.

Pushes scored + classified routes to Convex in batches via POST /api/ingest-routes.
Handles authentication (Bearer token), batching, retry-once on 5xx, and result aggregation.

Source: PRD §API Design Internal (POST /api/ingest-routes) in
        09-technical-requirements.md
"""

from __future__ import annotations

import logging
from dataclasses import dataclass, field
from typing import Any

import requests

from scripts.curation.pipeline.models import Route

logger = logging.getLogger(__name__)


class ConfigurationError(Exception):
    """Raised when required configuration (e.g., deploy key) is missing."""


@dataclass
class PushSummary:
    """Aggregate result of a push_routes() call across all batches."""

    sent: int = 0
    inserted: int = 0
    updated: int = 0
    failed: int = 0
    errors: list[str] = field(default_factory=list)


def _route_to_dict(route: Route) -> dict[str, Any]:
    """
    Serialize a Route dataclass to the JSON dict expected by POST /api/ingest-routes.

    Field mapping: Python snake_case → Convex camelCase.
    Source: curated_routes lean tier schema in 09-technical-requirements.md.

    Note: This function handles both Route and EnrichedRoute objects.
    EnrichedRoute extends Route with additional fields that we include if present.
    """
    payload: dict[str, Any] = {
        # --- Identity ---
        "routeId": route.route_id,
        # --- Basic display fields ---
        "name": route.name,
        "state": route.state,
        "source": route.source,
        # --- Location ---
        "centroidLat": route.centroid_lat,
        "centroidLng": route.centroid_lng,
        "lengthMiles": route.length_miles,
        "boundsNeLat": route.bounds_ne_lat,
        "boundsNeLng": route.bounds_ne_lng,
        "boundsSwLat": route.bounds_sw_lat,
        "boundsSwLng": route.bounds_sw_lng,
    }

    # Add enriched fields if present (EnrichedRoute extends Route)
    if hasattr(route, "composite_score"):
        payload.update(
            {
                # --- Scores ---
                "compositeScore": route.composite_score if route.composite_score is not None else 0.0,
                "curvatureScore": getattr(route, "curvature_score", 0.0),
                "scenicScore": getattr(route, "scenic_score", 0.0),
                "technicalScore": getattr(route, "technical_score", 0.0),
                "trafficScore": getattr(route, "traffic_score", 0.0),
                "remotenessScore": getattr(route, "remoteness_score", 0.0),
                # --- Classification ---
                "primaryArchetype": getattr(route, "primary_archetype", ""),
                "secondaryTags": getattr(route, "secondary_tags", []),
                # --- Pre-digested display text ---
                "oneLiner": getattr(route, "one_liner", ""),
                "summary": getattr(route, "summary", ""),
                "badges": getattr(route, "badges", []),
                # --- Seasonality ---
                "season": getattr(route, "season", "year_round"),
                # --- Version tracking ---
                "contentVersion": getattr(route, "content_version", 1),
                "enrichmentVersion": getattr(route, "enrichment_version", None),
            }
        )

    return payload


def _push_batch(
    session: requests.Session,
    url: str,
    headers: dict[str, str],
    batch: list[Route],
) -> dict[str, Any]:
    """
    POST one batch to the Convex ingest endpoint.

    Returns the parsed JSON response body.
    Raises requests.HTTPError on non-2xx that is not retried.
    """
    payload = {"routes": [_route_to_dict(r) for r in batch]}
    resp = session.post(url, json=payload, headers=headers, timeout=30)
    resp.raise_for_status()
    return resp.json()


def push_routes(
    routes: list[Route],
    base_url: str,
    deploy_key: str,
    batch_size: int = 50,
) -> PushSummary:
    """
    Push scored + classified routes to Convex in batches.

    Batches routes into groups of `batch_size`, POSTs each batch to
    {base_url}/api/ingest-routes with Bearer auth, retries once on 5xx,
    and aggregates results into a PushSummary.

    Args:
        routes: List of Route or EnrichedRoute objects to push
        base_url: Base URL of the Convex deployment (e.g., "https://example.convex.site")
        deploy_key: Deploy key for authentication (CURATION_DEPLOY_KEY from .env.local)
        batch_size: Number of routes per batch (default: 50)

    Returns:
        PushSummary with aggregate statistics across all batches

    Raises:
        ConfigurationError: if deploy_key is empty or None
        requests.HTTPError: on 4xx errors (not retried)

    Source: PRD §API Design Internal (POST /api/ingest-routes) in
            09-technical-requirements.md
    """
    if not deploy_key:
        raise ConfigurationError(
            "CURATION_DEPLOY_KEY is not set. "
            "Add it to .env.local (see 09-technical-requirements.md §API Design)."
        )

    url = f"{base_url.rstrip('/')}/api/ingest-routes"
    headers = {
        "Authorization": f"Bearer {deploy_key}",
        "Content-Type": "application/json",
    }
    summary = PushSummary(sent=len(routes))

    with requests.Session() as session:
        for i in range(0, len(routes), batch_size):
            batch = routes[i : i + batch_size]
            try:
                result = _push_batch(session, url, headers, batch)
            except requests.HTTPError as exc:
                if exc.response is not None and exc.response.status_code >= 500:
                    # Retry once on 5xx
                    logger.warning("Batch %d: 5xx on first attempt, retrying once", i)
                    try:
                        result = _push_batch(session, url, headers, batch)
                    except requests.HTTPError as retry_exc:
                        msg = f"Batch {i}-{i + len(batch)}: permanent failure — {retry_exc}"
                        logger.error(msg)
                        summary.failed += len(batch)
                        summary.errors.append(msg)
                        continue
                else:
                    raise  # 4xx errors are not retried — re-raise immediately

            summary.inserted += result.get("created", 0)
            summary.updated += result.get("updated", 0)
            if result.get("errors"):
                summary.errors.extend(result["errors"])

    return summary
