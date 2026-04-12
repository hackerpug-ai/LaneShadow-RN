"""Anthropic + Instructor client for LLM extraction.

This module wraps the Anthropic SDK with Instructor for structured extraction.
Temperature is hardcoded to 0 (Pipeline Principle P4) and cannot be overridden.

Pipeline Principle P5: Deterministic parser between LLM and downstream code.
"""

import logging
import os
import time
from typing import Optional

import anthropic
import instructor
from pydantic import ValidationError

from scripts.curation.pipeline.extraction.schema import RouteAttributes

logger = logging.getLogger(__name__)


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
    """Anthropic + Instructor client for route attribute extraction.

    Pipeline Principle P4: All extraction runs at temperature=0.
    Pipeline Principle P5: Pydantic validation between LLM and downstream code.
    """

    def __init__(self, api_key: Optional[str] = None):
        """Initialize the extraction client.

        Args:
            api_key: Anthropic API key. If None, reads from ANTHROPIC_API_KEY env var.

        Raises:
            ValueError: If API key is not provided or found in environment.
        """
        if api_key is None:
            api_key = os.environ.get("ANTHROPIC_API_KEY")

        if not api_key:
            raise ValueError(
                "Anthropic API key must be provided via api_key parameter "
                "or ANTHROPIC_API_KEY environment variable"
            )

        # Initialize Anthropic client
        raw_client = anthropic.Anthropic(api_key=api_key)

        # Wrap with Instructor for structured extraction
        self.client = instructor.from_anthropic(raw_client)

        # P4: Temperature is hardcoded to 0 - no overrides allowed
        self._temperature = 0
        self._model = "claude-3-5-haiku-latest"

        logger.info(
            f"ExtractionClient initialized (model={self._model}, temperature={self._temperature})"
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
            anthropic.APIError: If the Anthropic API call fails
        """
        last_error = None

        for attempt in range(max_retries + 1):
            try:
                start_time = time.time()

                # Call Haiku with Instructor for structured extraction
                response = self.client.chat.completions.create(
                    model=self._model,
                    temperature=self._temperature,  # ALWAYS 0 (P4)
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
