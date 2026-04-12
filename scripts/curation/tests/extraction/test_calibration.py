"""Tests for calibration gate (PIPE-009)."""

import json
import tempfile
from pathlib import Path

import pytest

from scripts.curation.pipeline.extraction.calibration import (
    CALIBRATION_THRESHOLD,
    CalibrationGate,
    CalibrationResult,
    DEFAULT_CALIBRATION_THRESHOLD,
    MIN_SAMPLE_SIZE,
    run_calibration,
)
from scripts.curation.pipeline.extraction.ground_truth import (
    GroundTruthRecord,
    load_ground_truth,
)


# =============================================================================
# FIXTURES
# =============================================================================


@pytest.fixture
def sample_weights():
    """Sample scoring weights for testing."""
    return {
        "curviness": 0.25,
        "scenery": 0.15,
        "traffic": 0.15,
        "condition": 0.10,
        "osm_curvature": 0.15,
        "elevation_drama": 0.10,
        "fhwa_designation": 0.05,
        "community_rating": 0.05,
    }


@pytest.fixture
def sample_ground_truth():
    """Sample ground truth data (20 routes)."""
    ground_truth = []
    for i in range(20):
        ground_truth.append({
            "route_id": f"route_{i:03d}",
            "name": f"Test Route {i}",
            "editorial_rank": i + 1,  # 1-20 (lower is better)
            "source": "rider_mag",
            "features": {
                "curviness": 0.5 + (i * 0.02),  # Increasing with rank
                "scenery": 0.5 + (i * 0.02),
                "traffic": 0.5,
                "condition": 0.5,
                "osm_curvature": 0.5,
                "elevation_drama": 0.5,
                "fhwa_designation": 0.5,
                "community_rating": 0.5,
            },
        })
    return ground_truth


@pytest.fixture
def correlated_pipeline_scores():
    """Pipeline scores that correlate with editorial rank.

    Higher editorial rank (lower number) = higher score.
    """
    # Create scores that inversely correlate with editorial_rank
    # Rank 1 gets score 0.95, rank 20 gets score 0.05
    return [0.95 - (i * 0.045) for i in range(20)]


@pytest.fixture
def anti_correlated_pipeline_scores():
    """Pipeline scores that anti-correlate with editorial rank.

    Higher editorial rank (lower number) = lower score.
    """
    # Create scores that directly correlate with editorial_rank
    # Rank 1 gets score 0.05, rank 20 gets score 0.95
    return [0.05 + (i * 0.045) for i in range(20)]


@pytest.fixture
def random_pipeline_scores():
    """Random pipeline scores with no correlation."""
    # Fixed "random" values for reproducibility
    return [
        0.42, 0.73, 0.21, 0.88, 0.35,
        0.67, 0.19, 0.54, 0.91, 0.28,
        0.63, 0.37, 0.82, 0.14, 0.76,
        0.33, 0.58, 0.24, 0.69, 0.41,
    ]


@pytest.fixture
def ground_truth_jsonl_file(sample_ground_truth):
    """Create a temporary ground truth JSONL file."""
    with tempfile.NamedTemporaryFile(mode='w', suffix='.jsonl', delete=False) as f:
        for record in sample_ground_truth:
            # Write without 'features' for ground truth file format
            gt_record = {
                "route_id": record["route_id"],
                "name": record["name"],
                "editorial_rank": record["editorial_rank"],
                "source": record["source"],
                "state": "CA",
                "notes": f"Test route {record['route_id']}",
            }
            f.write(json.dumps(gt_record) + '\n')
        temp_path = Path(f.name)

    yield temp_path

    # Cleanup
    temp_path.unlink(missing_ok=True)


# =============================================================================
# CALIBRATION RESULT TESTS
# =============================================================================


def test_calibration_result_to_report():
    """Test CalibrationResult.to_report() generates correct structure."""
    result = CalibrationResult(
        rho=0.75,
        p_value=0.001,
        sample_size=20,
        top10_recovery_rate=0.6,
        weights={"curviness": 0.25, "scenery": 0.15},
        sensitivity={"curviness": 0.1, "scenery": 0.05},
        threshold=0.6,
        passed=True,
        residuals=[1.0, -2.0, 0.5],
    )

    report = result.to_report()

    assert report["spearman_rho"] == 0.75
    assert report["p_value"] == 0.001
    assert report["sample_size"] == 20
    assert report["top10_recovery_rate"] == 0.6
    assert report["threshold"] == 0.6
    assert report["passed"] is True
    assert "weights" in report
    assert "per_feature_sensitivity" in report
    assert "residuals" in report
    assert "timestamp" in report


# =============================================================================
# RUN CALIBRATION TESTS
# =============================================================================


def test_run_calibration_correlated(
    sample_ground_truth, correlated_pipeline_scores, sample_weights
):
    """Test calibration with correlated scores should pass."""
    result = run_calibration(
        ground_truth=sample_ground_truth,
        pipeline_scores=correlated_pipeline_scores,
        weights=sample_weights,
        threshold=0.6,
    )

    assert result.sample_size == 20
    assert result.rho > 0.8  # Strong positive correlation
    assert result.passed is True
    assert result.top10_recovery_rate > 0.5


def test_run_calibration_anti_correlated(
    sample_ground_truth, anti_correlated_pipeline_scores, sample_weights
):
    """Test calibration with anti-correlated scores should fail."""
    result = run_calibration(
        ground_truth=sample_ground_truth,
        pipeline_scores=anti_correlated_pipeline_scores,
        weights=sample_weights,
        threshold=0.6,
    )

    assert result.sample_size == 20
    assert result.rho < -0.8  # Strong negative correlation
    assert result.passed is False


def test_run_calibration_random(
    sample_ground_truth, random_pipeline_scores, sample_weights
):
    """Test calibration with random scores should have low correlation."""
    result = run_calibration(
        ground_truth=sample_ground_truth,
        pipeline_scores=random_pipeline_scores,
        weights=sample_weights,
        threshold=0.6,
    )

    assert result.sample_size == 20
    # Random scores should have low correlation (could be positive or negative)
    assert abs(result.rho) < 0.5
    assert result.passed is False


def test_run_calibration_minimum_sample_size():
    """Test that calibration enforces minimum sample size."""
    # Create only 10 samples (below minimum)
    small_ground_truth = [
        {
            "route_id": f"route_{i:03d}",
            "name": f"Test Route {i}",
            "editorial_rank": i + 1,
            "source": "rider_mag",
            "features": {},
        }
        for i in range(10)
    ]
    small_scores = [0.5] * 10

    with pytest.raises(AssertionError) as exc_info:
        run_calibration(
            ground_truth=small_ground_truth,
            pipeline_scores=small_scores,
            weights={},
            threshold=0.6,
        )

    assert "requires >=" in str(exc_info.value)
    assert "got 10" in str(exc_info.value)


def test_run_calibration_mismatched_lengths(sample_ground_truth, sample_weights):
    """Test that calibration catches mismatched input lengths."""
    wrong_length_scores = [0.5] * 15  # Should be 20

    with pytest.raises(ValueError) as exc_info:
        run_calibration(
            ground_truth=sample_ground_truth,
            pipeline_scores=wrong_length_scores,
            weights=sample_weights,
            threshold=0.6,
        )

    assert "must have same length" in str(exc_info.value)


def test_run_calibration_sensitivity_analysis(
    sample_ground_truth, correlated_pipeline_scores, sample_weights
):
    """Test that sensitivity analysis is computed."""
    result = run_calibration(
        ground_truth=sample_ground_truth,
        pipeline_scores=correlated_pipeline_scores,
        weights=sample_weights,
        threshold=0.6,
        score_func=lambda features, weights: sum(
            features.get(k, 0.5) * v for k, v in weights.items()
        ),
    )

    # Should have sensitivity for each feature
    assert len(result.sensitivity) == len(sample_weights)
    for feature in sample_weights:
        assert feature in result.sensitivity
        # Sensitivity should be a float (could be positive, negative, or zero)
        assert isinstance(result.sensitivity[feature], float)


def test_run_calibration_top10_recovery(
    sample_ground_truth, correlated_pipeline_scores, sample_weights
):
    """Test top-10 recovery rate calculation."""
    result = run_calibration(
        ground_truth=sample_ground_truth,
        pipeline_scores=correlated_pipeline_scores,
        weights=sample_weights,
        threshold=0.6,
    )

    # With highly correlated scores, recovery should be high
    assert result.top10_recovery_rate >= 0.0
    assert result.top10_recovery_rate <= 1.0


# =============================================================================
# CALIBRATION GATE TESTS
# =============================================================================


def test_calibration_gate_initialization():
    """Test CalibrationGate initialization."""
    gate = CalibrationGate(threshold=0.7)
    assert gate.threshold == 0.7


def test_calibration_gate_uses_default_threshold():
    """Test that CalibrationGate uses default threshold."""
    gate = CalibrationGate()
    assert gate.threshold == CALIBRATION_THRESHOLD


def test_calibration_gate_evaluate(
    sample_ground_truth, correlated_pipeline_scores, sample_weights
):
    """Test CalibrationGate.evaluate() returns CalibrationResult."""
    gate = CalibrationGate(threshold=0.6)
    result = gate.evaluate(
        ground_truth=sample_ground_truth,
        pipeline_scores=correlated_pipeline_scores,
        weights=sample_weights,
    )

    assert isinstance(result, CalibrationResult)
    assert result.passed is True


def test_calibration_gate_assert_passed_on_success(
    sample_ground_truth, correlated_pipeline_scores, sample_weights
):
    """Test assert_passed does nothing when calibration passes."""
    gate = CalibrationGate(threshold=0.6)
    result = gate.evaluate(
        ground_truth=sample_ground_truth,
        pipeline_scores=correlated_pipeline_scores,
        weights=sample_weights,
    )

    # Should not raise
    gate.assert_passed(result)


def test_calibration_gate_assert_passed_on_failure(
    sample_ground_truth, anti_correlated_pipeline_scores, sample_weights, capsys
):
    """Test assert_passed halts pipeline when calibration fails."""
    gate = CalibrationGate(threshold=0.6)
    result = gate.evaluate(
        ground_truth=sample_ground_truth,
        pipeline_scores=anti_correlated_pipeline_scores,
        weights=sample_weights,
    )

    with pytest.raises(SystemExit) as exc_info:
        gate.assert_passed(result)

    assert exc_info.value.code == 1

    # Check error output
    captured = capsys.readouterr()
    assert "CALIBRATION GATE FAILED" in captured.err
    assert "FULL-CATALOG EXTRACTION HALTED" in captured.err
    assert "Spearman rho" in captured.err


def test_calibration_gate_write_report(
    sample_ground_truth, correlated_pipeline_scores, sample_weights
):
    """Test CalibrationGate.write_report() creates JSON file."""
    with tempfile.TemporaryDirectory() as tmpdir:
        output_path = Path(tmpdir) / "calibration_report.json"

        gate = CalibrationGate(threshold=0.6)
        result = gate.evaluate(
            ground_truth=sample_ground_truth,
            pipeline_scores=correlated_pipeline_scores,
            weights=sample_weights,
        )

        gate.write_report(result, output_path)

        # Verify file exists and has correct content
        assert output_path.exists()

        with open(output_path) as f:
            report = json.load(f)

        assert report["passed"] is True
        assert "spearman_rho" in report
        assert "weights" in report
        assert "per_feature_sensitivity" in report


def test_calibration_gate_print_report(
    sample_ground_truth, correlated_pipeline_scores, sample_weights, capsys
):
    """Test CalibrationGate.print_report() outputs to stdout."""
    gate = CalibrationGate(threshold=0.6)
    result = gate.evaluate(
        ground_truth=sample_ground_truth,
        pipeline_scores=correlated_pipeline_scores,
        weights=sample_weights,
    )

    gate.print_report(result)

    captured = capsys.readouterr()
    assert "CALIBRATION REPORT" in captured.err
    assert "Status:" in captured.err
    assert "Spearman rho" in captured.err


# =============================================================================
# THRESHOLD CONFIGURATION TESTS
# =============================================================================


def test_default_threshold():
    """Test default threshold is 0.6."""
    assert DEFAULT_CALIBRATION_THRESHOLD == 0.6


def test_threshold_environment_variable(monkeypatch):
    """Test that threshold can be configured via environment variable."""
    monkeypatch.setenv("CALIBRATION_THRESHOLD", "0.8")

    # Re-import to pick up environment variable
    from importlib import reload
    import scripts.curation.pipeline.extraction.calibration as calib_module
    reload(calib_module)

    assert calib_module.CALIBRATION_THRESHOLD == 0.8


def test_configurable_threshold_pass(
    sample_ground_truth, correlated_pipeline_scores, sample_weights
):
    """Test that lowering threshold allows more results to pass."""
    # Use a very low threshold - should always pass
    result = run_calibration(
        ground_truth=sample_ground_truth,
        pipeline_scores=correlated_pipeline_scores,
        weights=sample_weights,
        threshold=0.1,
    )

    assert result.passed is True


def test_configurable_threshold_fail(
    sample_ground_truth, anti_correlated_pipeline_scores, sample_weights
):
    """Test that raising threshold makes it harder to pass."""
    # Use anti-correlated scores with a moderate threshold - should fail
    result = run_calibration(
        ground_truth=sample_ground_truth,
        pipeline_scores=anti_correlated_pipeline_scores,
        weights=sample_weights,
        threshold=0.5,
    )

    assert result.passed is False


# =============================================================================
# GROUND TRUTH LOADER TESTS
# =============================================================================


def test_load_ground_truth_success(ground_truth_jsonl_file):
    """Test loading ground truth from JSONL file."""
    records = load_ground_truth(ground_truth_jsonl_file)

    assert len(records) == 20
    assert all(isinstance(r, GroundTruthRecord) for r in records)

    # Check first record
    assert records[0].route_id == "route_000"
    assert records[0].name == "Test Route 0"
    assert records[0].editorial_rank == 1
    assert records[0].source == "rider_mag"
    assert records[0].state == "CA"


def test_load_ground_truth_minimum_samples():
    """Test that ground truth loader enforces minimum sample size."""
    with tempfile.NamedTemporaryFile(mode='w', suffix='.jsonl', delete=False) as f:
        # Write only 10 records (below minimum)
        for i in range(10):
            record = {
                "route_id": f"route_{i:03d}",
                "name": f"Test Route {i}",
                "editorial_rank": i + 1,
                "source": "rider_mag",
            }
            f.write(json.dumps(record) + '\n')
        temp_path = Path(f.name)

    try:
        with pytest.raises(AssertionError) as exc_info:
            load_ground_truth(temp_path)

        assert "requires >=" in str(exc_info.value)
        assert "got 10" in str(exc_info.value)
    finally:
        temp_path.unlink(missing_ok=True)


def test_load_ground_truth_missing_file():
    """Test that missing file raises FileNotFoundError."""
    with pytest.raises(FileNotFoundError):
        load_ground_truth(Path("/nonexistent/path.jsonl"))


def test_load_ground_truth_invalid_json():
    """Test that invalid JSON raises ValueError."""
    with tempfile.NamedTemporaryFile(mode='w', suffix='.jsonl', delete=False) as f:
        f.write('{"route_id": "test", "name": "Test", "editorial_rank": 1, "source": "rider_mag"}\n')
        f.write('invalid json here\n')
        temp_path = Path(f.name)

    try:
        with pytest.raises(ValueError, match="Invalid JSON"):
            load_ground_truth(temp_path)
    finally:
        temp_path.unlink(missing_ok=True)


def test_load_ground_truth_missing_required_fields():
    """Test that missing required fields raises ValueError."""
    with tempfile.NamedTemporaryFile(mode='w', suffix='.jsonl', delete=False) as f:
        # Missing "source" field
        f.write('{"route_id": "test", "name": "Test", "editorial_rank": 1}\n')
        temp_path = Path(f.name)

    try:
        with pytest.raises(ValueError, match="missing required fields"):
            load_ground_truth(temp_path)
    finally:
        temp_path.unlink(missing_ok=True)


def test_ground_truth_record_to_dict():
    """Test GroundTruthRecord.to_dict() method."""
    record = GroundTruthRecord(
        route_id="test_001",
        name="Test Route",
        editorial_rank=1,
        source="rider_mag",
        state="CA",
        notes="Test notes",
    )

    record_dict = record.to_dict()

    assert record_dict["route_id"] == "test_001"
    assert record_dict["name"] == "Test Route"
    assert record_dict["editorial_rank"] == 1
    assert record_dict["source"] == "rider_mag"
    assert record_dict["state"] == "CA"
    assert record_dict["notes"] == "Test notes"


# =============================================================================
# INTEGRATION TESTS
# =============================================================================


def test_full_calibration_workflow(
    ground_truth_jsonl_file, sample_weights
):
    """Test full workflow: load ground truth, run calibration, check result."""
    # Load ground truth
    gt_records = load_ground_truth(ground_truth_jsonl_file)

    # Convert to format expected by run_calibration
    ground_truth = [
        {
            "route_id": r.route_id,
            "name": r.name,
            "editorial_rank": r.editorial_rank,
            "source": r.source,
            "features": {
                "curviness": 0.5,
                "scenery": 0.5,
                "traffic": 0.5,
            },
        }
        for r in gt_records
    ]

    # Create correlated scores (inverse relationship with rank)
    pipeline_scores = [0.95 - (i * 0.045) for i in range(len(ground_truth))]

    # Run calibration
    gate = CalibrationGate(threshold=0.6)
    result = gate.evaluate(
        ground_truth=ground_truth,
        pipeline_scores=pipeline_scores,
        weights=sample_weights,
    )

    # Should pass with high correlation
    assert result.passed is True
    assert result.rho > 0.8

    # assert_passed should not raise
    gate.assert_passed(result)
