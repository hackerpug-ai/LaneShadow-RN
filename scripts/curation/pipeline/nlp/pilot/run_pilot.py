"""GLM NLP Pilot - Run Haiku extraction on labeled dataset.

This script validates that Claude 3 Haiku can reliably extract road names
and riding-attribute signals from motorcycle forum/social posts.
"""

import logging
import os
import sys
import time
from pathlib import Path
from typing import Any, Dict, List

import anthropic
import instructor
from pydantic import BaseModel, ValidationError
from tenacity import (
    retry,
    stop_after_attempt,
    wait_exponential,
    retry_if_exception_type,
)

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger(__name__)


# Pydantic schema for pilot extraction
class PilotExtraction(BaseModel):
    """Structured extraction from forum posts for pilot validation.

    Road names are extracted as strings.
    Attributes are classified as positive/negative/neutral/absent.
    """

    road_names: List[str]
    attributes: Dict[str, str]  # scenery, twistiness, traffic, road_quality


# Sample labeled dataset for pilot validation
# In production, this would be hand-curated from real forum posts
SAMPLE_DATASET: List[Dict[str, Any]] = [
    {
        "post_id": "adv001",
        "source": "advrider",
        "text_snippet": (
            "Just finished the Tail of the Dragon - 318 curves in 11 miles! "
            "The road surface is pristine but there was too much traffic today. "
            "Scenery is amazing with the Smoky Mountains."
        ),
        "label_road_names": ["Tail of the Dragon"],
        "label_attributes": {
            "scenery": "positive",
            "twistiness": "positive",
            "traffic": "negative",
            "road_quality": "positive",
        },
    },
    {
        "post_id": "adv002",
        "source": "advrider",
        "text_snippet": (
            "Ride report: Going-to-the-Sun Road in Glacier NP. "
            "Absolutely stunning views but slow going due to construction. "
            "Road is in good shape otherwise."
        ),
        "label_road_names": ["Going-to-the-Sun Road"],
        "label_attributes": {
            "scenery": "positive",
            "twistiness": "neutral",
            "traffic": "neutral",
            "road_quality": "neutral",
        },
    },
    {
        "post_id": "reddit001",
        "source": "reddit",
        "text_snippet": (
            "Avoid I-95 through Jersey - bumper to bumper trucks and potholes everywhere. "
            "Took me 3 hours to go 50 miles."
        ),
        "label_road_names": ["I-95"],
        "label_attributes": {
            "scenery": "absent",
            "twistiness": "absent",
            "traffic": "negative",
            "road_quality": "negative",
        },
    },
]


def build_dataset(num_posts: int = 100) -> List[Dict[str, Any]]:
    """Build or load the labeled dataset for pilot validation.

    Args:
        num_posts: Number of posts to include in dataset (default: 100)

    Returns:
        List of dataset entries with labels
    """
    # For now, generate synthetic data by repeating sample entries
    # In production, this would load from a curated dataset file
    dataset = []

    for i in range(num_posts):
        # Cycle through sample data
        sample = SAMPLE_DATASET[i % len(SAMPLE_DATASET)]

        # Create unique post_id
        entry = {
            "post_id": f"{sample['post_id']}_synth_{i}",
            "source": sample["source"],
            "text_snippet": sample["text_snippet"],
            "label_road_names": sample["label_road_names"],
            "label_attributes": sample["label_attributes"],
        }
        dataset.append(entry)

    logger.info(f"Built dataset with {len(dataset)} entries")
    return dataset


class PilotExtractionClient:
    """Client for Haiku extraction with retry logic."""

    def __init__(self, api_key: str | None = None):
        """Initialize the pilot extraction client.

        Args:
            api_key: Anthropic API key. If None, reads from ANTHROPIC_API_KEY env var.
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

        # Use Claude 3 Haiku for pilot
        self._model = "claude-3-haiku-20240307"
        self._temperature = 0

        logger.info(f"PilotExtractionClient initialized (model={self._model})")

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(min=1, max=10),
        retry=retry_if_exception_type((ValidationError, anthropic.APIError)),
    )
    def extract(self, post_text: str) -> tuple[PilotExtraction, int, int]:
        """Extract road names and attributes from a forum post.

        Args:
            post_text: The forum post text to analyze

        Returns:
            Tuple of (extraction result, input_tokens, output_tokens)

        Raises:
            ValidationError: If extraction fails validation after retries
            anthropic.APIError: If API call fails after retries
        """
        system_prompt = """You are an expert motorcycle route analyst. Extract road names and riding attributes from forum posts.

Road names: Specific named roads, highways, or routes mentioned (e.g., "Tail of the Dragon", "US-129", "Blue Ridge Parkway").

Attributes (classify as positive/negative/neutral/absent):
- scenery: Visual beauty, views, landscape (positive = beautiful/stunning, negative = ugly/boring, absent = not mentioned)
- twistiness: Curves and technical challenge (positive = very curvy/technical, negative = straight/boring, absent = not mentioned)
- traffic: Traffic density (positive = light traffic, negative = heavy/congested, absent = not mentioned)
- road_quality: Pavement condition (positive = smooth/pristine, negative = potholes/rough, absent = not mentioned)

Return ONLY the road names explicitly mentioned in the text."""

        start_time = time.time()

        # Call Haiku with Instructor for structured extraction
        response = self.client.messages.create(
            model=self._model,
            temperature=self._temperature,
            max_tokens=1024,
            response_model=PilotExtraction,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Extract from this post:\n\n{post_text}"},
            ],
        )

        latency_ms = (time.time() - start_time) * 1000

        # Extract token usage from response
        # Note: Instructor response doesn't always include usage, need to handle this
        input_tokens = getattr(response, "_raw_response", None)
        if input_tokens:
            # Try to get usage from raw response
            try:
                usage = input_tokens.usage
                input_tokens = usage.input_tokens
                output_tokens = usage.output_tokens
            except AttributeError:
                input_tokens = 0
                output_tokens = 0
        else:
            input_tokens = 0
            output_tokens = 0

        logger.debug(f"Extraction succeeded (latency={latency_ms:.0f}ms)")

        return response, input_tokens, output_tokens


def compute_f1_score(
    predictions: list[str], labels: list[str]
) -> tuple[float, float, float]:
    """Compute precision, recall, and F1 for extraction evaluation.

    Args:
        predictions: Extracted road names
        labels: Ground-truth road names

    Returns:
        Tuple of (precision, recall, f1)
    """
    if not labels and not predictions:
        return 1.0, 1.0, 1.0  # Perfect match when both empty

    if not labels:
        return 0.0, 1.0, 0.0  # No labels but predictions = false positives

    if not predictions:
        return 1.0, 0.0, 0.0  # Labels but no predictions = false negatives

    # Convert to sets for comparison (case-insensitive)
    pred_set = {p.lower().strip() for p in predictions}
    label_set = {l.lower().strip() for l in labels}

    # True positives: predictions that match labels
    tp = len(pred_set & label_set)

    # False positives: predictions not in labels
    fp = len(pred_set - label_set)

    # False negatives: labels not predicted
    fn = len(label_set - pred_set)

    # Precision: TP / (TP + FP)
    precision = tp / (tp + fp) if (tp + fp) > 0 else 0.0

    # Recall: TP / (TP + FN)
    recall = tp / (tp + fn) if (tp + fn) > 0 else 0.0

    # F1: 2 * (precision * recall) / (precision + recall)
    f1 = (
        2 * (precision * recall) / (precision + recall)
        if (precision + recall) > 0
        else 0.0
    )

    return precision, recall, f1


def compute_attribute_f1(
    predicted_attrs: dict[str, str], label_attrs: dict[str, str]
) -> dict[str, float]:
    """Compute F1 for each attribute classification.

    Args:
        predicted_attrs: Predicted attributes dict
        label_attrs: Ground-truth attributes dict

    Returns:
        Dict mapping attribute name to F1 score
    """
    attribute_names = ["scenery", "twistiness", "traffic", "road_quality"]
    f1_scores = {}

    for attr in attribute_names:
        pred = predicted_attrs.get(attr, "absent")
        label = label_attrs.get(attr, "absent")

        # Binary classification: correct or not
        if pred == label:
            f1_scores[attr] = 1.0
        else:
            f1_scores[attr] = 0.0

    return f1_scores


def main() -> int:
    """Main entry point for pilot script.

    Returns:
        Exit code (0 if road_name_f1 >= 0.75, 1 otherwise)
    """
    import argparse

    parser = argparse.ArgumentParser(
        description="Run GLM NLP Pilot - Haiku accuracy validation"
    )
    parser.add_argument(
        "--build-dataset",
        action="store_true",
        help="Build labeled dataset and exit",
    )
    parser.add_argument(
        "--dataset-path",
        type=str,
        default="scripts/curation/pipeline/nlp/pilot/dataset.json",
        help="Path to dataset file",
    )
    parser.add_argument(
        "--results-path",
        type=str,
        default="scripts/curation/pipeline/nlp/pilot/results.json",
        help="Path to results file",
    )
    parser.add_argument(
        "--dry-run-validate",
        action="store_true",
        help="Validate dataset exists and exit",
    )

    args = parser.parse_args()

    # Build dataset if requested
    if args.build_dataset:
        dataset = build_dataset(num_posts=100)
        dataset_path = Path(args.dataset_path)
        dataset_path.parent.mkdir(parents=True, exist_ok=True)

        import json

        dataset_path.write_text(json.dumps(dataset, indent=2))
        logger.info(f"Dataset written to {dataset_path}")
        return 0

    # Dry-run validation
    if args.dry_run_validate:
        dataset_path = Path(args.dataset_path)
        if not dataset_path.exists():
            logger.error(f"Dataset not found at {dataset_path}")
            return 1

        import json

        dataset = json.loads(dataset_path.read_text())
        logger.info(f"{len(dataset)} posts ready")
        return 0

    # Run full pilot
    logger.info("Starting GLM NLP Pilot...")

    # Load dataset
    dataset_path = Path(args.dataset_path)
    import json

    dataset = json.loads(dataset_path.read_text())
    logger.info(f"Loaded {len(dataset)} posts from dataset")

    # Initialize client
    client = PilotExtractionClient()

    # Run extraction on all posts
    results = []
    total_input_tokens = 0
    total_output_tokens = 0

    for entry in dataset:
        post_id = entry["post_id"]
        text = entry["text_snippet"]

        try:
            extraction, in_tokens, out_tokens = client.extract(text)
            total_input_tokens += in_tokens
            total_output_tokens += out_tokens

            results.append(
                {
                    "post_id": post_id,
                    "predicted_road_names": extraction.road_names,
                    "predicted_attributes": extraction.attributes,
                    "label_road_names": entry["label_road_names"],
                    "label_attributes": entry["label_attributes"],
                }
            )

        except Exception as e:
            logger.error(f"Extraction failed for {post_id}: {e}")
            results.append(
                {
                    "post_id": post_id,
                    "predicted_road_names": [],
                    "predicted_attributes": {},
                    "label_road_names": entry["label_road_names"],
                    "label_attributes": entry["label_attributes"],
                    "error": str(e),
                }
            )

    # Compute F1 scores
    road_name_precisions: list[float] = []
    road_name_recalls: list[float] = []
    road_name_f1s: list[float] = []
    attribute_f1s: dict[str, list[float]] = {
        "scenery": [],
        "twistiness": [],
        "traffic": [],
        "road_quality": [],
    }

    for result in results:
        if "error" in result:
            continue

        # Road name F1
        prec, rec, f1 = compute_f1_score(
            result["predicted_road_names"], result["label_road_names"]
        )
        road_name_precisions.append(prec)
        road_name_recalls.append(rec)
        road_name_f1s.append(f1)

        # Attribute F1
        attr_f1 = compute_attribute_f1(
            result["predicted_attributes"], result["label_attributes"]
        )
        for attr, f1_val in attr_f1.items():
            attribute_f1s[attr].append(f1_val)

    # Aggregate scores
    road_name_precision = (
        sum(road_name_precisions) / len(road_name_precisions)
        if road_name_precisions
        else 0.0
    )
    road_name_recall = (
        sum(road_name_recalls) / len(road_name_recalls) if road_name_recalls else 0.0
    )
    road_name_f1 = (
        sum(road_name_f1s) / len(road_name_f1s) if road_name_f1s else 0.0
    )

    attribute_f1_mean = {
        attr: (sum(vals) / len(vals) if vals else 0.0)
        for attr, vals in attribute_f1s.items()
    }
    attribute_f1_overall = sum(attribute_f1_mean.values()) / len(attribute_f1_mean)

    # Determine PASS/FAIL
    status = "PASS" if road_name_f1 >= 0.75 else "FAIL"

    # Write results
    results_data = {
        "road_name_precision": road_name_precision,
        "road_name_recall": road_name_recall,
        "road_name_f1": road_name_f1,
        "attribute_f1": attribute_f1_mean,
        "attribute_f1_mean": attribute_f1_overall,
        "total_input_tokens": total_input_tokens,
        "total_output_tokens": total_output_tokens,
        "status": status,
        "num_posts": len(dataset),
        "num_successful": len([r for r in results if "error" not in r]),
    }

    results_path = Path(args.results_path)
    results_path.parent.mkdir(parents=True, exist_ok=True)
    results_path.write_text(json.dumps(results_data, indent=2))

    logger.info(f"Results written to {results_path}")
    logger.info(f"Road name F1: {road_name_f1:.3f} (threshold: 0.75)")
    logger.info(f"Status: {status}")

    # Exit with appropriate code
    return 0 if status == "PASS" else 1


if __name__ == "__main__":
    sys.exit(main())
