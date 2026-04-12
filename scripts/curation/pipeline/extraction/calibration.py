"""Calibration gate for pipeline scoring validation.

Implements PIPE-009: Calibration Gate - validates that pipeline scoring
produces rankings correlated with editorial ground truth before allowing
full-catalog extraction.

This is a HARD gate per P3: composite-score weights must be calibrated
against ground truth before full extraction runs.
"""

from __future__ import annotations

import json
import os
import sys
import time
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Callable

# =============================================================================
# CONSTANTS
# =============================================================================

DEFAULT_CALIBRATION_THRESHOLD = 0.6  # Spearman rho
MIN_SAMPLE_SIZE = 20

# Allow override via environment variable
CALIBRATION_THRESHOLD = float(
    os.environ.get("CALIBRATION_THRESHOLD", DEFAULT_CALIBRATION_THRESHOLD)
)


# =============================================================================
# DATA STRUCTURES
# =============================================================================


@dataclass
class CalibrationResult:
    """Result of a calibration run.

    Contains all metrics and diagnostics from the calibration gate.
    """

    rho: float  # Spearman correlation coefficient
    p_value: float  # Statistical significance
    sample_size: int  # Number of ground truth routes
    top10_recovery_rate: float  # Overlap between editorial and pipeline top-10
    weights: dict[str, float]  # Scoring weights used
    sensitivity: dict[str, float]  # Per-feature sensitivity analysis
    threshold: float  # Pass/fail threshold
    passed: bool  # Whether calibration passed
    residuals: list[float] = field(default_factory=list)  # Rank differences
    timestamp: int = field(default_factory=lambda: int(time.time()))

    def to_report(self) -> dict[str, Any]:
        """Convert to JSON-serializable report dictionary.

        Returns:
            Dict with all calibration metrics for reporting
        """
        return {
            "timestamp": self.timestamp,
            "passed": self.passed,
            "spearman_rho": self.rho,
            "p_value": self.p_value,
            "threshold": self.threshold,
            "sample_size": self.sample_size,
            "top10_recovery_rate": self.top10_recovery_rate,
            "weights": self.weights,
            "per_feature_sensitivity": self.sensitivity,
            "residuals": self.residuals,
        }


# =============================================================================
# SCORING FUNCTIONS FOR SENSITIVITY ANALYSIS
# =============================================================================


def _compute_composite_score(
    features: dict[str, float], weights: dict[str, float]
) -> float:
    """Compute a composite score from features and weights.

    Args:
        features: Dict mapping feature names to normalized values (0.0-1.0)
        weights: Dict mapping feature names to weight values

    Returns:
        Composite score as weighted sum (clamped to 0.0-1.0)
    """
    score = 0.0
    for feature_name, weight in weights.items():
        feature_value = features.get(feature_name, 0.5)  # Neutral default
        score += weight * feature_value

    return min(1.0, max(0.0, score))


# =============================================================================
# MAIN CALIBRATION FUNCTION
# =============================================================================


def run_calibration(
    ground_truth: list[dict[str, Any]],
    pipeline_scores: list[float],
    weights: dict[str, float],
    threshold: float = CALIBRATION_THRESHOLD,
    score_func: Callable[[dict[str, Any], dict[str, float]], float] | None = None,
) -> CalibrationResult:
    """Run calibration gate on pipeline scores against editorial ground truth.

    Computes Spearman rank correlation between pipeline scores and editorial
    rankings, then reports whether the correlation meets the threshold.

    Args:
        ground_truth: List of ground truth records, each with:
            - route_id: str
            - name: str
            - editorial_rank: int (lower is better)
            - features: dict[str, float] (feature values for sensitivity analysis)
        pipeline_scores: List of composite scores (same order as ground_truth)
        weights: Dict of feature weights used in scoring
        threshold: Minimum Spearman rho to pass (default: from env or 0.6)
        score_func: Optional function to compute scores from features.
                    If None, uses _compute_composite_score.

    Returns:
        CalibrationResult with all metrics and pass/fail status

    Raises:
        AssertionError: If fewer than MIN_SAMPLE_SIZE ground truth records
        ValueError: If ground_truth and pipeline_scores have different lengths
    """
    # Validate inputs
    assert len(ground_truth) >= MIN_SAMPLE_SIZE, (
        f"Calibration requires >= {MIN_SAMPLE_SIZE} samples, "
        f"got {len(ground_truth)}"
    )

    if len(ground_truth) != len(pipeline_scores):
        raise ValueError(
            f"ground_truth ({len(ground_truth)}) and pipeline_scores "
            f"({len(pipeline_scores)}) must have same length"
        )

    # Extract editorial rankings
    editorial_ranks = [gt["editorial_rank"] for gt in ground_truth]

    # Compute Spearman rank correlation
    try:
        from scipy import stats

        rho, p_value = stats.spearmanr(editorial_ranks, pipeline_scores)
        rho = float(rho)
        p_value = float(p_value)
    except ImportError:
        raise ImportError(
            "scipy is required for calibration. "
            "Install with: pip install scipy"
        )

    # Compute top-10 recovery rate
    # Editorial top-10 (lowest ranks = best)
    editorial_top10_ids = set(
        gt["route_id"]
        for gt in sorted(ground_truth, key=lambda x: x["editorial_rank"])[:10]
    )

    # Pipeline top-10 (highest scores = best)
    indexed_scores = list(enumerate(pipeline_scores))
    pipeline_top10_indices = sorted(
        indexed_scores, key=lambda x: x[1], reverse=True
    )[:10]
    pipeline_top10_ids = set(ground_truth[i][0] for i, _ in pipeline_top10_indices)

    recovery_rate = len(editorial_top10_ids & pipeline_top10_ids) / 10.0

    # Compute residuals (rank differences)
    # Sort by editorial rank, compare to pipeline rank
    indexed_ground_truth = list(enumerate(ground_truth))
    sorted_by_editorial = sorted(
        indexed_ground_truth, key=lambda x: x[1]["editorial_rank"]
    )

    # Get pipeline rankings (highest score = rank 1)
    sorted_by_pipeline = sorted(
        enumerate(pipeline_scores), key=lambda x: x[1], reverse=True
    )
    pipeline_rank_map = {i: rank + 1 for rank, (i, _) in enumerate(sorted_by_pipeline)}

    residuals = []
    for i, gt in sorted_by_editorial:
        editorial_rank = gt["editorial_rank"]
        pipeline_rank = pipeline_rank_map[i]
        residuals.append(float(pipeline_rank - editorial_rank))

    # Per-feature sensitivity analysis (leave-one-out)
    sensitivity: dict[str, float] = {}
    if score_func:
        for feature in weights:
            # Create reduced weights (remove this feature)
            reduced_weights = {
                k: v for k, v in weights.items() if k != feature
            }

            # Normalize remaining weights to sum to 1.0
            total_weight = sum(reduced_weights.values())
            if total_weight > 0:
                reduced_weights = {
                    k: v / total_weight for k, v in reduced_weights.items()
                }
            else:
                # All weights were removed, use equal weighting
                n_features = len(reduced_weights)
                reduced_weights = {k: 1.0 / n_features for k in reduced_weights}

            # Recompute scores without this feature
            reduced_scores = [
                score_func(gt.get("features", {}), reduced_weights)
                for gt in ground_truth
            ]

            # Compute new correlation
            reduced_rho, _ = stats.spearmanr(editorial_ranks, reduced_scores)
            reduced_rho = float(reduced_rho)

            # Sensitivity = drop in correlation when feature is removed
            sensitivity[feature] = rho - reduced_rho
    else:
        # No sensitivity analysis if no score function provided
        sensitivity = {feature: 0.0 for feature in weights}

    return CalibrationResult(
        rho=rho,
        p_value=p_value,
        sample_size=len(ground_truth),
        top10_recovery_rate=recovery_rate,
        weights=weights,
        sensitivity=sensitivity,
        threshold=threshold,
        passed=rho >= threshold,
        residuals=residuals,
    )


# =============================================================================
# CALIBRATION GATE CLASS
# =============================================================================


class CalibrationGate:
    """Calibration gate for pipeline validation.

    Implements a hard checkpoint that validates pipeline scoring against
    editorial ground truth before allowing full-catalog extraction.

    Usage:
        gate = CalibrationGate(threshold=0.6)
        result = gate.evaluate(ground_truth, pipeline_scores, weights)
        gate.assert_passed(result)  # Raises CalibrationError if failed
        gate.write_report(result, output_path)
    """

    def __init__(self, threshold: float = CALIBRATION_THRESHOLD):
        """Initialize calibration gate.

        Args:
            threshold: Minimum Spearman rho to pass (default: from env or 0.6)
        """
        self.threshold = threshold

    def evaluate(
        self,
        ground_truth: list[dict[str, Any]],
        pipeline_scores: list[float],
        weights: dict[str, float],
        score_func: Callable[[dict[str, Any], dict[str, float]], float] | None = None,
    ) -> CalibrationResult:
        """Run calibration and return result.

        Args:
            ground_truth: List of ground truth records
            pipeline_scores: List of composite scores
            weights: Scoring weights used
            score_func: Optional function for sensitivity analysis

        Returns:
            CalibrationResult with all metrics
        """
        return run_calibration(
            ground_truth=ground_truth,
            pipeline_scores=pipeline_scores,
            weights=weights,
            threshold=self.threshold,
            score_func=score_func,
        )

    def assert_passed(self, result: CalibrationResult) -> None:
        """Assert that calibration passed, otherwise halt the pipeline.

        This is the HARD GATE mechanism. When calibration fails, this method
        prints diagnostics and exits the program with an error code.

        Args:
            result: CalibrationResult from evaluate()

        Raises:
            SystemExit: Always exits if calibration fails (code 1)
        """
        if result.passed:
            return

        # Print detailed failure diagnostics
        print("\n" + "=" * 70, file=sys.stderr)
        print("CALIBRATION GATE FAILED", file=sys.stderr)
        print("=" * 70, file=sys.stderr)
        print(
            f"\nSpearman rho: {result.rho:.4f} (threshold: {result.threshold:.2f})",
            file=sys.stderr,
        )
        print(f"P-value: {result.p_value:.6f}", file=sys.stderr)
        print(f"Sample size: {result.sample_size}", file=sys.stderr)
        print(f"Top-10 recovery rate: {result.top10_recovery_rate:.1%}", file=sys.stderr)
        print(file=sys.stderr)

        print("Per-feature sensitivity (correlation drop when removed):", file=sys.stderr)
        for feature, sensitivity_drop in sorted(
            result.sensitivity.items(), key=lambda x: x[1], reverse=True
        ):
            print(f"  - {feature}: {sensitivity_drop:+.4f}", file=sys.stderr)

        print("\nResidual distribution (pipeline_rank - editorial_rank):", file=sys.stderr)
        print(f"  Min: {min(result.residuals):+.1f}", file=sys.stderr)
        print(f"  Max: {max(result.residuals):+.1f}", file=sys.stderr)
        print(f"  Mean: {sum(result.residuals) / len(result.residuals):+.1f}", file=sys.stderr)

        print("\n" + "=" * 70, file=sys.stderr)
        print("FULL-CATALOG EXTRACTION HALTED", file=sys.stderr)
        print("Calibration is a hard gate (P3). Fix weights or schema before proceeding.", file=sys.stderr)
        print("=" * 70 + "\n", file=sys.stderr)

        sys.exit(1)

    def write_report(self, result: CalibrationResult, output_path: Path) -> None:
        """Write calibration report to JSON file.

        Args:
            result: CalibrationResult from evaluate()
            output_path: Path where report JSON will be written
        """
        output_path.parent.mkdir(parents=True, exist_ok=True)

        with open(output_path, "w") as f:
            json.dump(result.to_report(), f, indent=2)

        print(f"\nCalibration report written to: {output_path}")

    def print_report(self, result: CalibrationResult) -> None:
        """Print calibration report to stdout for immediate visibility.

        Args:
            result: CalibrationResult from evaluate()
        """
        print("\n" + "=" * 70)
        print("CALIBRATION REPORT", file=sys.stderr)
        print("=" * 70, file=sys.stderr)

        status = "PASS" if result.passed else "FAIL"
        print(f"\nStatus: {status}", file=sys.stderr)
        print(f"Spearman rho: {result.rho:.4f} (threshold: {result.threshold:.2f})", file=sys.stderr)
        print(f"P-value: {result.p_value:.6f}", file=sys.stderr)
        print(f"Sample size: {result.sample_size}", file=sys.stderr)
        print(f"Top-10 recovery rate: {result.top10_recovery_rate:.1%}", file=sys.stderr)

        print("\nPer-feature sensitivity:", file=sys.stderr)
        for feature, sensitivity_drop in sorted(
            result.sensitivity.items(), key=lambda x: x[1], reverse=True
        ):
            print(f"  - {feature}: {sensitivity_drop:+.4f}", file=sys.stderr)

        print("\n" + "=" * 70 + "\n", file=sys.stderr)


class CalibrationError(Exception):
    """Raised when calibration fails and gate enforcement is via exception."""

    pass
