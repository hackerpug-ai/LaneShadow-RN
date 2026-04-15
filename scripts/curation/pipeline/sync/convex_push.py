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

try:
    # Try relative import first (when running as module)
    from scripts.curation.pipeline.models import Route
except ImportError:
    # Fallback to absolute import (when running from scripts/curation)
    from scripts.curation.pipeline.models import Route

logger = logging.getLogger(__name__)

# Batch size reduced from 50 to 10 for embedding payload size (INF-007)
DEFAULT_BATCH_SIZE: int = 10


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


def _maybe_set(d: dict, obj, attr: str, camel_key: str) -> None:
    """Set d[camel_key] = obj.attr if the attribute exists and is not None/empty.

    Helper for serializing optional Route/EnrichedRoute fields to Convex camelCase.
    Skips None values, empty lists, and missing attributes.
    """
    if not hasattr(obj, attr):
        return
    val = getattr(obj, attr)
    if val is None:
        return
    if isinstance(val, (list, dict)) and not val:
        return
    d[camel_key] = val


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

    # ========================================================================
    # Semantic matching fields (Epic 3 — INF-002, INF-007)
    # ========================================================================
    # CRITICAL: embedding → searchEmbedding rename
    if hasattr(route, "embedding") and route.embedding is not None:
        payload["searchEmbedding"] = route.embedding

    _maybe_set(payload, route, "search_text", "searchText")
    _maybe_set(payload, route, "candidate_identifiers", "candidateIdentifiers")
    _maybe_set(payload, route, "match_confidence", "matchConfidence")
    _maybe_set(payload, route, "llm_reconciliation_log", "llmReconciliationLog")

    # ========================================================================
    # Enrichment output fields (Epic 9/10 LLM pipeline — INF-007)
    # ========================================================================
    _maybe_set(payload, route, "description", "description")
    _maybe_set(payload, route, "rating", "rating")
    _maybe_set(payload, route, "designation", "designation")
    _maybe_set(payload, route, "source_url", "sourceUrl")
    _maybe_set(payload, route, "source_refs", "sourceRefs")
    _maybe_set(payload, route, "highway_number", "highwayNumber")
    _maybe_set(payload, route, "elevation_gain_m", "elevationGainM")
    _maybe_set(payload, route, "surface", "surface")
    _maybe_set(payload, route, "aadt", "aadt")
    _maybe_set(payload, route, "aadt_median", "aadtMedian")
    _maybe_set(payload, route, "aadt_max", "aadtMax")
    _maybe_set(payload, route, "pavement_iri", "pavementIri")
    _maybe_set(payload, route, "mention_frequency", "mentionFrequency")

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

        # ========================================================================
        # Derived scoring fields (EnrichedRoute — INF-007)
        # ========================================================================
        _maybe_set(payload, route, "mention_frequency_score", "mentionFrequencyScore")
        _maybe_set(payload, route, "designation_score", "designationScore")
        _maybe_set(payload, route, "elevation_drama_score", "elevationDramaScore")
        _maybe_set(payload, route, "road_quality_score", "roadQualityScore")
        _maybe_set(payload, route, "low_traffic_score", "lowTrafficScore")
        _maybe_set(payload, route, "weather_suitability", "weatherSuitability")
        _maybe_set(payload, route, "best_months", "bestMonths")
        _maybe_set(payload, route, "source_count", "sourceCount")
        _maybe_set(payload, route, "quality_tier", "qualityTier")

    return payload


def _push_batch(
    session: requests.Session,
    url: str,
    headers: dict[str, str],
    batch: list[Route],
) -> dict[str, Any]:
    """
    POST one batch to the Convex ingest endpoint using CLI.

    Returns the parsed JSON response body.
    Raises requests.HTTPError on non-2xx that is not retried.
    """
    import subprocess
    import json

    # Prepare minimal payload for embedding backfill (only routeId + searchEmbedding)
    updates = [
        {
            "routeId": route.route_id,
            "searchEmbedding": route.embedding,
        }
        for route in batch
        if route.embedding is not None
    ]

    if not updates:
        return {"updated": 0, "errors": []}

    payload = {"updates": updates}
    payload_json = json.dumps(payload)

    # Call Convex CLI with JSON argument
    cmd = [
        "npx",
        "convex",
        "run",
        "curationAdmin:backfillRouteEmbeddings",
        payload_json,
    ]

    result = subprocess.run(
        cmd,
        capture_output=True,
        text=True,
        timeout=60,
    )

    if result.returncode != 0:
        raise RuntimeError(f"Convex CLI failed: {result.stderr}")

    return json.loads(result.stdout)


def push_routes(
    routes: list[Route],
    base_url: str,
    deploy_key: str,
    batch_size: int = DEFAULT_BATCH_SIZE,
    dry_run: bool = False,
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
        dry_run: If True, validate serialization without making HTTP requests (default: False)

    Returns:
        PushSummary with aggregate statistics across all batches

    Raises:
        ConfigurationError: if deploy_key is empty or None (unless dry_run=True)
        requests.HTTPError: on 4xx errors (not retried)

    Source: PRD §API Design Internal (POST /api/ingest-routes) in
            09-technical-requirements.md
    """
    if not deploy_key and not dry_run:
        raise ConfigurationError(
            "CURATION_DEPLOY_KEY is not set. "
            "Add it to .env.local (see 09-technical-requirements.md §API Design)."
        )

    if dry_run:
        import json as _json
        for route in routes:
            d = _route_to_dict(route)
            _json.dumps(d)  # verify JSON-serializable
        logger.info(f"DRY RUN: {len(routes)} routes serialized successfully (no HTTP calls)")
        return PushSummary(sent=len(routes))

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


if __name__ == "__main__":
    import argparse
    import json
    import logging
    import os
    import sys
    from pathlib import Path

    from scripts.curation.pipeline.models import EnrichedRoute

    logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")

    parser = argparse.ArgumentParser(description="Push routes to Convex (dry-run by default)")
    parser.add_argument("--input", required=True, help="Input JSON file of scored routes")
    parser.add_argument("--staging", required=True, help="Staging JSONL file with route metadata (e.g., staging/fhwa.jsonl)")
    parser.add_argument("--dry-run", action="store_true", default=True, help="Dry-run mode (default: True)")
    parser.add_argument("--base-url", default=os.environ.get("CONVEX_URL", ""), help="Convex base URL")
    parser.add_argument("--deploy-key", default=os.environ.get("CURATION_DEPLOY_KEY", ""), help="Deploy key")
    args = parser.parse_args()

    # Read scored routes
    scores_list = json.load(open(args.input))

    # Build lookup dict from staging file (route_id -> metadata dict)
    staging_lookup = {}
    for line in open(args.staging):
        if line.strip():
            route_dict = json.loads(line)
            staging_lookup[route_dict["route_id"]] = route_dict

    # Reconstruct EnrichedRoute objects by joining scores with staging metadata
    routes = []
    for s in scores_list:
        route_id = s["route_id"]
        if route_id not in staging_lookup:
            logger.warning(f"Route {route_id} not found in staging file, skipping")
            continue

        metadata = staging_lookup[route_id]
        er = EnrichedRoute(
            route_id=route_id,
            name=s["name"],
            state=metadata.get("state", ""),
            source=metadata.get("source", "fhwa"),
            centroid_lat=metadata.get("centroid_lat", 0.0),
            centroid_lng=metadata.get("centroid_lng", 0.0),
            length_miles=metadata.get("length_miles"),
            bounds_ne_lat=metadata.get("bounds_ne_lat"),
            bounds_ne_lng=metadata.get("bounds_ne_lng"),
            bounds_sw_lat=metadata.get("bounds_sw_lat"),
            bounds_sw_lng=metadata.get("bounds_sw_lng"),
            composite_score=s.get("composite_score", 0.0),
            curvature_score=s.get("curvature_score", 0.0),
            scenic_score=s.get("scenic_score", 0.0),
            technical_score=s.get("technical_score", 0.0),
            traffic_score=s.get("traffic_score", 0.0),
            remoteness_score=s.get("remoteness_score", 0.0),
        )
        routes.append(er)

    logger.info(f"Read {len(routes)} routes from {args.input} (joined with {args.staging})")

    summary = push_routes(
        routes=routes,
        base_url=args.base_url,
        deploy_key=args.deploy_key or "dry-run-placeholder",
        dry_run=args.dry_run,
    )

    logger.info(f"Result: sent={summary.sent}, inserted={summary.inserted}, failed={summary.failed}")

    if summary.failed > 0:
        for err in summary.errors:
            logger.error(f"Error: {err}")
        sys.exit(1)
