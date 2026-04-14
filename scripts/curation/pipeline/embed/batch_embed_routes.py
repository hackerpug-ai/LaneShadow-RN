"""Batch embedding generation for curated routes using OpenAI text-embedding-3-small.

This module implements INF-004: Route Embedding Generation Pipeline.
It generates 1536-dimensional embeddings for route search_text and backfills
them into Convex.

Usage:
    python -m pipeline.embed.batch_embed_routes --dry-run
    python -m pipeline.embed.batch_embed_routes --commit
    python -m pipeline.embed.batch_embed_routes --commit --incremental

Cost tracking:
    - Model: text-embedding-3-small
    - Dimensions: 1536
    - Cost: $0.00002 per 1K tokens
    - Token estimation: ~1 token per 4 characters
"""

from __future__ import annotations

import argparse
import logging
import os
import sys
import time
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path
from typing import TYPE_CHECKING

import openai
from openai import RateLimitError

if TYPE_CHECKING:
    from collections.abc import Callable

    from scripts.curation.pipeline.models import Route
    from scripts.curation.pipeline.sync.convex_push import PushSummary


logger = logging.getLogger(__name__)


# =============================================================================
# Cost Ledger
# =============================================================================


@dataclass
class EmbeddingCostLedger:
    """Cost tracking for embedding generation runs.

    Attributes:
        total_routes: Total routes processed
        embedded_routes: Routes that received embeddings
        skipped_routes: Routes skipped (empty search_text)
        total_input_tokens: Estimated input tokens
        total_cost_usd: Total cost in USD
        batch_count: Number of batches processed
        model: OpenAI model used
        started_at: ISO timestamp of start
        finished_at: ISO timestamp of completion
        errors: List of error messages
    """

    total_routes: int = 0
    embedded_routes: int = 0
    skipped_routes: int = 0
    total_input_tokens: int = 0
    total_cost_usd: float = 0.0
    batch_count: int = 0
    model: str = "text-embedding-3-small"
    started_at: str = ""
    finished_at: str = ""
    errors: list[str] = field(default_factory=list)


# =============================================================================
# Text Building
# =============================================================================


def build_search_text(route: Route) -> str:
    """Concatenate name + state + highway_number + source + candidate_identifiers into embedding-ready text.

    This builds the searchable text representation that will be embedded.
    Empty fields are skipped.

    Args:
        route: Route object with name, state, highway_number, source, candidate_identifiers

    Returns:
        Concatenated string for embedding, or empty string if name is empty

    Examples:
        >>> route = Route(
        ...     route_id="r1",
        ...     name="Tail of the Dragon",
        ...     state="TN",
        ...     source="fhwa",
        ...     centroid_lat=35.5,
        ...     centroid_lng=-83.5,
        ...     highway_number="US-129",
        ...     candidate_identifiers=["The Dragon", "Deals Gap"]
        ... )
        >>> text = build_search_text(route)
        >>> "Tail of the Dragon" in text
        True
        >>> "TN" in text
        True
        >>> "US-129" in text
        True
    """
    # Skip routes with empty names - they produce poor embeddings
    if not route or not route.name or not route.name.strip():
        return ""

    parts = [route.name.strip()]

    # Add state
    if route.state:
        parts.append(route.state.strip())

    # Add highway number if available
    if route.highway_number:
        parts.append(route.highway_number.strip())

    # Add source
    if route.source:
        parts.append(route.source.strip())

    # Add candidate identifiers (aliases, alternate names)
    if route.candidate_identifiers:
        for identifier in route.candidate_identifiers:
            if identifier and identifier.strip():
                parts.append(identifier.strip())

    return " ".join(parts)


# =============================================================================
# Embedding Generation
# =============================================================================


def generate_embeddings(
    texts: list[str],
    client: openai.OpenAI,
    model: str = "text-embedding-3-small",
    max_retries: int = 3,
) -> list[list[float]]:
    """Call OpenAI batch embedding API with exponential backoff retry on RateLimitError/APIConnectionError.

    Args:
        texts: List of text strings to embed
        client: OpenAI client instance
        model: Model name (default: text-embedding-3-small)
        max_retries: Maximum retry attempts (default: 3)

    Returns:
        List of embedding vectors (each 1536-dimensional for text-embedding-3-small)

    Raises:
        RateLimitError: If rate limit persists after max_retries
        openai.APIConnectionError: If connection fails after max_retries
        openai.APIError: For other API errors

    Examples:
        >>> client = openai.OpenAI(api_key="test")
        >>> texts = ["Route 1", "Route 2"]
        >>> embeddings = generate_embeddings(texts, client)
        >>> len(embeddings)
        2
        >>> len(embeddings[0])
        1536
    """
    if not texts:
        return []

    # Estimate input tokens (rough approximation: ~1 token per 4 characters)
    total_chars = sum(len(text) for text in texts)
    estimated_tokens = total_chars // 4

    logger.debug(f"Generating embeddings for {len(texts)} texts (~{estimated_tokens} tokens)")

    # Exponential backoff: 1s, 2s, 4s
    backoff_delays = [1, 2, 4]

    for attempt in range(max_retries):
        try:
            response = client.embeddings.create(input=texts, model=model)
            # Extract embedding vectors
            embeddings = [item.embedding for item in response.data]
            return embeddings

        except RateLimitError as e:
            if attempt < max_retries - 1:
                delay = backoff_delays[attempt]
                logger.warning(f"Rate limit hit, retrying in {delay}s (attempt {attempt + 1}/{max_retries})")
                time.sleep(delay)
            else:
                logger.error(f"Rate limit persisted after {max_retries} retries")
                raise

        except openai.APIConnectionError as e:
            if attempt < max_retries - 1:
                delay = backoff_delays[attempt]
                logger.warning(f"Connection error, retrying in {delay}s (attempt {attempt + 1}/{max_retries})")
                time.sleep(delay)
            else:
                logger.error(f"Connection failed after {max_retries} retries")
                raise

        except openai.APIError as e:
            # Don't retry on other API errors (auth, invalid request, etc.)
            logger.error(f"API error (no retry): {e}")
            raise

    # Should never reach here, but satisfy type checker
    raise RuntimeError("Unexpected state in retry loop")


# =============================================================================
# Batch Processing
# =============================================================================


def batch_embed_routes(
    routes: list[Route],
    client: openai.OpenAI,
    batch_size: int = 100,
) -> tuple[list[Route], EmbeddingCostLedger]:
    """Process routes in batches, skip empty search_text, populate route.search_text and route.embedding.

    Args:
        routes: List of Route objects to embed
        client: OpenAI client instance
        batch_size: Number of routes per batch (default: 100)

    Returns:
        Tuple of (updated_routes, cost_ledger)

    Examples:
        >>> client = openai.OpenAI(api_key="test")
        >>> routes = [Route(...), Route(...)]
        >>> updated, ledger = batch_embed_routes(routes, client)
        >>> ledger.embedded_routes > 0
        True
    """
    ledger = EmbeddingCostLedger(
        total_routes=len(routes),
        started_at=datetime.now().isoformat(),
    )

    # Build search text for all routes first
    routes_to_embed = []
    skipped_count = 0

    for route in routes:
        search_text = build_search_text(route)
        route.search_text = search_text

        if search_text:
            routes_to_embed.append(route)
        else:
            skipped_count += 1
            logger.debug(f"Skipping route {route.route_id}: empty search_text")

    ledger.skipped_routes = skipped_count

    if not routes_to_embed:
        logger.warning("No routes to embed (all skipped)")
        ledger.finished_at = datetime.now().isoformat()
        return routes, ledger

    # Process in batches
    for i in range(0, len(routes_to_embed), batch_size):
        batch = routes_to_embed[i : i + batch_size]
        ledger.batch_count += 1

        logger.info(f"Processing batch {ledger.batch_count} ({len(batch)} routes)")

        try:
            # Generate embeddings for this batch
            texts = [route.search_text for route in batch]
            embeddings = generate_embeddings(texts, client)

            # Update routes with embeddings (in-place modification)
            for route, embedding in zip(batch, embeddings):
                route.embedding = embedding

            # Track cost
            batch_chars = sum(len(text) for text in texts)
            batch_tokens = batch_chars // 4
            batch_cost = (batch_tokens / 1000) * 0.00002  # $0.00002 per 1K tokens

            ledger.total_input_tokens += batch_tokens
            ledger.total_cost_usd += batch_cost
            ledger.embedded_routes += len(batch)

        except (RateLimitError, openai.APIConnectionError, openai.APIError) as e:
            error_msg = f"Batch {ledger.batch_count} failed: {e}"
            logger.error(error_msg)
            ledger.errors.append(error_msg)
            # Continue with next batch

    ledger.finished_at = datetime.now().isoformat()

    return routes, ledger


# =============================================================================
# Route Loading (not yet wired)
# =============================================================================


def load_routes_needing_embedding(incremental: bool = False) -> list[Route]:
    """Query Convex for routes. If incremental, only those without searchEmbedding.

    Args:
        incremental: If True, only return routes without embeddings

    Returns:
        List of Route objects

    Raises:
        NotImplementedError: Not yet wired to Convex fetch helper

    Note:
        This function is a placeholder for INF-004. It will be implemented
        when the Convex query helper is available.
    """
    raise NotImplementedError(
        "load_routes_needing_embedding is not yet implemented. "
        "Convex query helper needs to be wired."
    )


# =============================================================================
# Cost Ledger Output
# =============================================================================


def write_cost_ledger(ledger: EmbeddingCostLedger, output_path: Path) -> None:
    """Write markdown cost ledger to .spec/research/curation-hardening/artifacts/inf004-embedding-cost-ledger.md

    Args:
        ledger: Cost ledger to write
        output_path: Path to output markdown file

    Examples:
        >>> ledger = EmbeddingCostLedger(total_routes=100, embedded_routes=95)
        >>> write_cost_ledger(ledger, Path("cost.md"))
        >>> Path("cost.md").exists()
        True
    """
    output_path.parent.mkdir(parents=True, exist_ok=True)

    lines = [
        "# INF-004 Embedding Cost Ledger",
        "",
        f"**Generated**: {ledger.finished_at}",
        f"**Model**: {ledger.model}",
        "",
        "## Summary",
        "",
        f"- **Total routes**: {ledger.total_routes}",
        f"- **Embedded**: {ledger.embedded_routes}",
        f"- **Skipped**: {ledger.skipped_routes}",
        f"- **Batches**: {ledger.batch_count}",
        "",
        "## Cost",
        "",
        f"- **Input tokens**: {ledger.total_input_tokens:,}",
        f"- **Total cost**: ${ledger.total_cost_usd:.4f}",
        "",
        "## Errors",
        "",
    ]

    if ledger.errors:
        for error in ledger.errors:
            lines.append(f"- {error}")
    else:
        lines.append("No errors.")

    lines.append("")

    output_path.write_text("\n".join(lines))
    logger.info(f"Cost ledger written to {output_path}")


# =============================================================================
# CLI
# =============================================================================


def main(argv: list[str] | None = None) -> int:
    """CLI with --dry-run (default) and --commit flags, --incremental flag.

    Reads OPENAI_API_KEY from environment.

    Args:
        argv: Command line arguments (default: sys.argv[1:])

    Returns:
        Exit code (0 for success, 1 for error)

    Examples:
        >>> # Dry run (default)
        >>> main(["--dry-run"])
        0

        >>> # Commit to Convex
        >>> main(["--commit"])
        0

        >>> # Incremental mode
        >>> main(["--commit", "--incremental"])
        0
    """
    if argv is None:
        argv = sys.argv[1:]

    parser = argparse.ArgumentParser(
        description="Generate embeddings for curated routes using OpenAI text-embedding-3-small"
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        default=True,
        help="Generate embeddings without pushing to Convex (default)",
    )
    parser.add_argument(
        "--commit",
        action="store_true",
        help="Push embedded routes to Convex",
    )
    parser.add_argument(
        "--incremental",
        action="store_true",
        help="Only process routes without existing embeddings",
    )

    args = parser.parse_args(argv)

    # Mutually exclusive flags
    if args.dry_run and args.commit:
        parser.error("--dry-run and --commit are mutually exclusive")

    # Check API key
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        logger.error("OPENAI_API_KEY environment variable is required")
        return 1

    # Initialize OpenAI client
    client = openai.OpenAI(api_key=api_key)

    # Load routes
    try:
        routes = load_routes_needing_embedding(incremental=args.incremental)
    except NotImplementedError:
        logger.error(
            "load_routes_needing_embedding is not yet implemented. "
            "This requires Convex query helper integration."
        )
        return 1

    if not routes:
        logger.info("No routes to process")
        return 0

    # Generate embeddings
    updated_routes, ledger = batch_embed_routes(routes, client)

    logger.info(
        f"Embedded {ledger.embedded_routes}/{ledger.total_routes} routes "
        f"(${ledger.total_cost_usd:.4f}, {ledger.total_input_tokens:,} tokens)"
    )

    # Write cost ledger
    output_path = Path(
        ".spec/research/curation-hardening/artifacts/inf004-embedding-cost-ledger.md"
    )
    write_cost_ledger(ledger, output_path)

    # Push to Convex if --commit
    if args.commit:
        from scripts.curation.pipeline.sync.convex_push import push_routes

        convex_url = os.environ.get("CONVEX_URL")
        deploy_key = os.environ.get("CURATION_DEPLOY_KEY")

        if not convex_url or not deploy_key:
            logger.error("CONVEX_URL and CURATION_DEPLOY_KEY required for --commit")
            return 1

        logger.info(f"Pushing {len(updated_routes)} routes to Convex...")
        summary: PushSummary = push_routes(
            routes=updated_routes,
            base_url=convex_url,
            deploy_key=deploy_key,
            dry_run=False,
        )

        logger.info(
            f"Push complete: inserted={summary.inserted}, updated={summary.updated}, failed={summary.failed}"
        )

        if summary.failed > 0:
            logger.error("Some routes failed to push")
            return 1

    return 0


if __name__ == "__main__":
    logging.basicConfig(
        level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    )
    sys.exit(main())
