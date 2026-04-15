"""LLM extraction client for route attribute extraction.

Supports Anthropic Claude Haiku (high throughput) and z.ai (fallback).
Temperature is hardcoded to 0 (Pipeline Principle P4) and cannot be overridden.

Pipeline Principle P5: Deterministic parser between LLM and downstream code.
"""

import logging
import os
import time
from typing import Optional

import instructor
from pydantic import ValidationError

from scripts.curation.pipeline.extraction.schema import RouteAttributes

logger = logging.getLogger(__name__)

# z.ai OpenAI-compatible endpoint (fallback)
ZAI_BASE_URL = "https://api.z.ai/api/paas/v4"


# System prompt for route attribute extraction
EXTRACTION_SYSTEM_PROMPT = """You are an expert motorcycle route analyst. Your task is to analyze route descriptions and extract structured attributes.

For each route, provide:
1. Reasoning: Brief chain-of-thought about the route's character
2. Scores (0.0-1.0): scenic, technical, traffic (inverted), remoteness, condition, elevation, designation, community
3. Season: Best riding season
4. Road surface: Surface type
5. Primary archetype: Main ride style

Important scoring guidelines:
- scenic_score: Natural beauty, views, landscape variety
- technical_score: Curves, elevation changes, riding challenge
- traffic_score: INVERTED - 1.0 = empty road, 0.0 = heavy traffic
- remoteness_score: Distance from cities, cellular coverage
- condition_score: Pavement quality, maintenance
- elevation_score: Elevation gain, variety, mountain passes
- designation_score: Official scenic byway or national park status
- community_score: Rider fame, popularity, reviews

Always think step-by-step in the reasoning field before assigning scores."""


class ExtractionClient:
    """LLM + Instructor client for route attribute extraction.

    Uses Claude Haiku by default (high throughput, ~$0.25/1M input tokens).
    Falls back to z.ai glm-4.7-flash if no Anthropic key is available.

    Pipeline Principle P4: All extraction runs at temperature=0.
    Pipeline Principle P5: Pydantic validation between LLM and downstream code.
    """

    def __init__(self, api_key: Optional[str] = None, model: Optional[str] = None):
        """Initialize the extraction client.

        Args:
            api_key: API key. Falls back to ANTHROPIC_API_KEY, then OPENAI_API_KEY,
                     then Z_AI_API_KEY env vars.
            model: Model name. Defaults based on which key is found.

        Raises:
            ValueError: If API key is not provided or found in environment.
        """
        self._backend = "anthropic"  # default assumption

        if api_key is None:
            api_key = os.environ.get("ANTHROPIC_API_KEY")
            if not api_key:
                api_key = os.environ.get("OPENAI_API_KEY")
                if api_key:
                    self._backend = "openai"
                else:
                    api_key = os.environ.get("Z_AI_API_KEY")
                    if api_key:
                        self._backend = "zai"
        else:
            # Explicit key provided — assume Anthropic
            self._backend = "anthropic"

        if not api_key:
            raise ValueError(
                "API key must be provided via api_key parameter, "
                "ANTHROPIC_API_KEY, OPENAI_API_KEY, or Z_AI_API_KEY environment variable"
            )

        # Initialize client based on backend
        if self._backend == "anthropic":
            import anthropic

            raw_client = anthropic.Anthropic(api_key=api_key)
            self.client = instructor.from_anthropic(raw_client)
            self._model = model or "claude-haiku-4-5-20251001"
        elif self._backend == "openai":
            from openai import OpenAI

            raw_client = OpenAI(api_key=api_key)
            self.client = instructor.from_openai(raw_client)
            self._model = model or "gpt-4o-mini"
        else:
            from openai import OpenAI

            raw_client = OpenAI(api_key=api_key, base_url=ZAI_BASE_URL)
            self.client = instructor.from_openai(raw_client)
            self._model = model or "glm-4.7-flash"

        # P4: Temperature is hardcoded to 0 - no overrides allowed
        self._temperature = 0

        logger.info(
            f"ExtractionClient initialized (backend={self._backend}, "
            f"model={self._model}, temperature={self._temperature})"
        )

    def extract(
        self,
        route_text: str,
        max_retries: int = 2,
        retry_delay: float = 1.0,
    ) -> RouteAttributes:
        """Extract structured attributes from route description text.

        Args:
            route_text: Route description or name + description text
            max_retries: Number of retries on validation failure (default: 2)
            retry_delay: Seconds to wait between retries (default: 1.0)

        Returns:
            RouteAttributes: Validated structured attributes

        Raises:
            ValidationError: If extraction fails after max retries
            Exception: If the API call fails with a non-validation error
        """
        last_error = None

        for attempt in range(max_retries + 1):
            try:
                start_time = time.time()

                if self._backend == "anthropic":
                    response = self.client.messages.create(
                        model=self._model,
                        temperature=self._temperature,
                        max_tokens=1024,
                        response_model=RouteAttributes,
                        messages=[
                            {"role": "system", "content": EXTRACTION_SYSTEM_PROMPT},
                            {"role": "user", "content": route_text},
                        ],
                    )
                else:
                    # OpenAI-compatible (openai or zai)
                    response = self.client.chat.completions.create(
                        model=self._model,
                        temperature=self._temperature,
                        max_tokens=1024,
                        response_model=RouteAttributes,
                        messages=[
                            {"role": "system", "content": EXTRACTION_SYSTEM_PROMPT},
                            {"role": "user", "content": route_text},
                        ],
                    )

                latency_ms = (time.time() - start_time) * 1000

                logger.debug(
                    f"Extraction succeeded (attempt {attempt + 1}, latency={latency_ms:.0f}ms)"
                )

                return response

            except ValidationError as e:
                last_error = e

                if attempt < max_retries:
                    # Retry with validation error as context
                    route_text = f"{route_text}\n\n[Previous attempt failed validation: {str(e)}]"
                    logger.warning(
                        f"Validation failed on attempt {attempt + 1}, retrying... Error: {e}"
                    )
                    time.sleep(retry_delay)
                else:
                    logger.error(
                        f"Extraction failed after {max_retries + 1} attempts: {e}"
                    )

            except Exception as e:
                # Non-validation errors are not retried
                logger.error(f"Extraction failed with non-validation error: {e}")
                raise

        # All retries exhausted
        raise ValidationError(
            f"Extraction failed after {max_retries + 1} attempts"
        ) from last_error

    @property
    def temperature(self) -> int:
        """Get the temperature setting (always 0)."""
        return self._temperature

    @property
    def model(self) -> str:
        """Get the model name."""
        return self._model


if __name__ == "__main__":
    import argparse
    import json
    import logging
    import sys
    from pathlib import Path

    from scripts.curation.pipeline.extraction.schema import EXTRACTION_SCHEMA_VERSION

    logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")

    parser = argparse.ArgumentParser(
        description="Extract route attributes using LLM"
    )
    parser.add_argument(
        "--sample",
        required=True,
        help="Path to input JSONL of Route records (from FHWA or other source)",
    )
    parser.add_argument(
        "--count",
        type=int,
        default=20,
        help="Number of routes to extract (cost bound, default: 20)",
    )
    parser.add_argument(
        "--out", required=True, help="Output JSONL path for RouteAttributes"
    )
    args = parser.parse_args()

    # Verify API key is set
    api_key = (
        os.environ.get("ANTHROPIC_API_KEY")
        or os.environ.get("OPENAI_API_KEY")
        or os.environ.get("Z_AI_API_KEY")
    )
    if not api_key:
        logger.error(
            "No API key found. Set ANTHROPIC_API_KEY, OPENAI_API_KEY or Z_AI_API_KEY "
            "environment variable before running extraction."
        )
        sys.exit(1)

    # Read sample routes from JSONL
    sample_path = Path(args.sample)
    if not sample_path.exists():
        logger.error(f"Sample file not found: {sample_path}")
        sys.exit(1)

    routes = []
    with open(sample_path) as f:
        for line in f:
            if line.strip():
                routes.append(json.loads(line))
                if len(routes) >= args.count:
                    break

    logger.info(f"Read {len(routes)} routes from {sample_path}")

    # Initialize extraction client
    try:
        client = ExtractionClient()
    except ValueError as e:
        logger.error(f"Failed to initialize ExtractionClient: {e}")
        sys.exit(1)

    # Log critical metadata
    logger.info(
        f"EXTRACTION_SCHEMA_VERSION={EXTRACTION_SCHEMA_VERSION} "
        f"temperature={client.temperature} model={client.model}"
    )

    # Create output directory
    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)

    # Extract attributes for each route
    success_count = 0
    failure_count = 0

    with open(out_path, "w") as out_f:
        for i, route in enumerate(routes, 1):
            try:
                # Build extraction text from route name and description
                name = route.get("name", "Unknown Route")
                state = route.get("state", "")
                description = route.get("description", "")

                if state:
                    route_text = f"{name} ({state})\n{description}"
                else:
                    route_text = f"{name}\n{description}"

                logger.info(f"Extracting [{i}/{len(routes)}]: {name}")

                # Extract attributes via LLM
                attrs = client.extract(route_text)

                # Write as JSON line using Pydantic model_dump_json()
                out_f.write(attrs.model_dump_json() + "\n")
                success_count += 1

            except Exception as e:
                logger.error(f"Failed to extract attributes for route {i}: {e}")
                failure_count += 1
                continue

    # Summary
    logger.info(
        f"Extraction complete: {success_count} succeeded, {failure_count} failed"
    )
    logger.info(f"Output written to: {out_path}")

    if failure_count > 0:
        logger.warning(
            f"Some extractions failed ({failure_count}/{len(routes)}). "
            "Check logs for details."
        )
        sys.exit(1)
