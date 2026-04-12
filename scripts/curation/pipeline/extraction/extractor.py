"""Batch extraction logic for processing routes at scale.

This module provides parallel extraction with ThreadPoolExecutor, resumable
JSONL output, raw response logging, and retry-on-validation-failure.

Pipeline Principle P4: All extraction at temperature=0 with retry-on-degeneration.
"""

import json
import logging
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from typing import Any, Optional

from scripts.curation.pipeline.extraction.client import ExtractionClient
from scripts.curation.pipeline.extraction.schema import EXTRACTION_SCHEMA_VERSION, RouteAttributes

logger = logging.getLogger(__name__)


def extract_single(
    route: dict[str, Any],
    client: ExtractionClient,
    max_retries: int = 2,
) -> dict[str, Any]:
    """Extract attributes from a single route.

    Args:
        route: Route dict with at least 'route_id' and 'description' fields
        client: ExtractionClient instance
        max_retries: Number of retries on validation failure

    Returns:
        Dict with original route data plus extraction results or error
    """
    route_id = route.get("route_id", "unknown")
    description = route.get("description") or route.get("name", "")

    start_time = time.time()

    try:
        # Extract attributes using the client
        attributes: RouteAttributes = client.extract(
            route_text=description,
            max_retries=max_retries,
        )

        latency_ms = (time.time() - start_time) * 1000

        # Success - return enriched route
        return {
            **route,
            "attributes": attributes.model_dump(),
            "extraction_schema_version": EXTRACTION_SCHEMA_VERSION,
            "extracted_at": int(time.time()),
            "extraction_status": "success",
            "latency_ms": round(latency_ms, 2),
        }

    except Exception as e:
        latency_ms = (time.time() - start_time) * 1000

        # Failure - return route with error info
        logger.error(f"Extraction failed for route {route_id}: {e}")

        return {
            **route,
            "extraction_error": str(e),
            "extraction_status": "failed",
            "extracted_at": int(time.time()),
            "latency_ms": round(latency_ms, 2),
        }


def extract_batch(
    routes: list[dict[str, Any]],
    output_path: Path,
    max_workers: int = 5,
    max_retries: int = 2,
    api_key: Optional[str] = None,
    resume: bool = True,
) -> dict[str, int]:
    """Extract attributes from a batch of routes in parallel.

    Args:
        routes: List of route dicts with at least 'route_id' and 'description' fields
        output_path: Path to output JSONL file (will be appended if resuming)
        max_workers: Maximum parallel extraction threads (default: 5)
        max_retries: Number of retries on validation failure (default: 2)
        api_key: Anthropic API key (if None, reads from ANTHROPIC_API_KEY env var)
        resume: If True, skip routes already in output file (default: True)

    Returns:
        Dict with extraction statistics: {total, success, failed, skipped}
    """
    # Initialize client
    client = ExtractionClient(api_key=api_key)

    # Check for existing output to support resumption
    extracted_ids = set()
    if resume and output_path.exists():
        logger.info(f"Resuming extraction from {output_path}")
        with open(output_path) as f:
            for line in f:
                if line.strip():
                    try:
                        record = json.loads(line)
                        route_id = record.get("route_id")
                        if route_id:
                            extracted_ids.add(route_id)
                    except json.JSONDecodeError:
                        continue

        logger.info(f"Found {len(extracted_ids)} already-extracted routes")

    # Filter out already-extracted routes
    pending_routes = [r for r in routes if r.get("route_id") not in extracted_ids]

    stats = {
        "total": len(routes),
        "success": 0,
        "failed": 0,
        "skipped": len(extracted_ids),
    }

    if not pending_routes:
        logger.info("No pending routes to extract")
        return stats

    logger.info(f"Extracting {len(pending_routes)} routes with {max_workers} workers")

    # Ensure output directory exists
    output_path.parent.mkdir(parents=True, exist_ok=True)

    # Process routes in parallel
    results = []
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        # Submit all extraction jobs
        futures = {
            executor.submit(extract_single, route, client, max_retries): route
            for route in pending_routes
        }

        # Collect results as they complete
        for future in as_completed(futures):
            route = futures[future]
            try:
                result = future.result()
                results.append(result)

                # Update statistics
                if result.get("extraction_status") == "success":
                    stats["success"] += 1
                else:
                    stats["failed"] += 1

                # Write result to output file immediately (resumable)
                with open(output_path, "a") as f:
                    f.write(json.dumps(result) + "\n")

                # Log progress
                completed = stats["success"] + stats["failed"]
                if completed % 10 == 0:
                    logger.info(
                        f"Progress: {completed}/{len(pending_routes)} "
                        f"(success: {stats['success']}, failed: {stats['failed']})"
                    )

            except Exception as e:
                logger.error(f"Unexpected error processing route {route.get('route_id')}: {e}")
                stats["failed"] += 1

    logger.info(
        f"Extraction complete: {stats['success']} success, "
        f"{stats['failed']} failed, {stats['skipped']} skipped"
    )

    return stats


def load_raw_responses(log_path: Path) -> list[dict[str, Any]]:
    """Load raw extraction responses from a JSONL log file.

    Args:
        log_path: Path to JSONL log file

    Returns:
        List of extraction result dicts
    """
    results = []
    if not log_path.exists():
        return results

    with open(log_path) as f:
        for line in f:
            if line.strip():
                try:
                    record = json.loads(line)
                    results.append(record)
                except json.JSONDecodeError as e:
                    logger.warning(f"Skipping invalid JSON line in {log_path}: {e}")

    return results


def get_failed_routes(log_path: Path) -> list[dict[str, Any]]:
    """Get list of routes that failed extraction from a log file.

    Args:
        log_path: Path to JSONL log file

    Returns:
        List of route dicts that failed extraction
    """
    failed = []
    for record in load_raw_responses(log_path):
        if record.get("extraction_status") == "failed":
            failed.append(record)

    return failed
