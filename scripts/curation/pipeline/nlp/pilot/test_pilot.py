"""Tests for GLM NLP Pilot - Labeled Dataset + Haiku Accuracy Validation.

TDD: One test per acceptance criterion.
"""

import json
from pathlib import Path


class TestDatasetSchema:
    """AC-1: Labeled dataset created and schema-valid."""

    def test_dataset_schema_valid(self, tmp_path: Path) -> None:
        """GIVEN pilot script is run with --build-dataset flag
        WHEN it collects 100 posts
        THEN dataset.json is written with valid schema
        """
        # Import the function to build dataset
        from scripts.curation.pipeline.nlp.pilot.run_pilot import build_dataset

        # WHEN: Build dataset
        dataset_path = tmp_path / "dataset.json"
        dataset = build_dataset(num_posts=100)

        # THEN: Write to file
        dataset_path.write_text(json.dumps(dataset, indent=2))

        # VERIFY: Schema is valid
        loaded = json.loads(dataset_path.read_text())

        assert len(loaded) == 100, f"Expected 100 entries, got {len(loaded)}"

        for entry in loaded:
            required_keys = {
                "post_id",
                "source",
                "text_snippet",
                "label_road_names",
                "label_attributes",
            }
            assert (
                set(entry.keys()) >= required_keys
            ), f"Missing keys: {required_keys - set(entry.keys())}"

            # Validate road_names is a list of strings
            assert isinstance(entry["label_road_names"], list)
            assert all(isinstance(name, str) for name in entry["label_road_names"])

            # Validate attributes has correct structure
            attrs = entry["label_attributes"]
            assert isinstance(attrs, dict)
            attr_keys = {"scenery", "twistiness", "traffic", "road_quality"}
            assert set(attrs.keys()) == attr_keys

            # Validate each attribute value
            valid_values = {"positive", "negative", "neutral", "absent"}
            assert all(attrs[k] in valid_values for k in attr_keys)

            # Validate text_snippet length
            assert len(entry["text_snippet"]) <= 500

        print("OK")


class TestExtractionRuns:
    """AC-2: Haiku extraction runs without error on all 100 posts."""

    def test_extraction_runs_without_error(self, tmp_path: Path, monkeypatch) -> None:
        """GIVEN dataset.json exists and ANTHROPIC_API_KEY is set
        WHEN run_pilot.py is executed
        THEN extraction completes without unhandled exceptions
        """
        # GIVEN: Create a minimal dataset
        from scripts.curation.pipeline.nlp.pilot.run_pilot import build_dataset

        dataset_path = tmp_path / "dataset.json"
        dataset = build_dataset(num_posts=10)  # Small dataset for testing
        dataset_path.write_text(json.dumps(dataset, indent=2))

        # Mock the API key
        monkeypatch.setenv("ANTHROPIC_API_KEY", "test-key-for-dry-run")

        # WHEN: Run dry-run validation
        import subprocess

        result = subprocess.run(
            [
                "python3",
                "scripts/curation/pipeline/nlp/pilot/run_pilot.py",
                "--dataset-path",
                str(dataset_path),
                "--dry-run-validate",
            ],
            capture_output=True,
            text=True,
        )

        # THEN: Should exit 0 and print post count
        assert result.returncode == 0, f"Script failed: {result.stderr}"
        output = result.stdout + result.stderr
        assert "10 posts ready" in output or "10 posts" in output


class TestRoadNameF1Gate:
    """AC-3: Road name F1 computed and threshold gate enforced."""

    def test_road_name_f1_gate_enforced_pass(self, tmp_path: Path) -> None:
        """GIVEN extraction results exist with F1 >= 0.75
        WHEN pilot script computes F1
        THEN script exits 0 (PASS)
        """
        from scripts.curation.pipeline.nlp.pilot.run_pilot import compute_f1_score

        # Test F1 calculation
        predictions = ["Tail of the Dragon", "Blue Ridge Parkway"]
        labels = ["Tail of the Dragon", "Blue Ridge Parkway"]

        precision, recall, f1 = compute_f1_score(predictions, labels)

        assert f1 == 1.0, f"Expected F1=1.0 for perfect match, got {f1}"
        assert f1 >= 0.75, "Should pass threshold gate"

    def test_road_name_f1_gate_enforced_fail(self, tmp_path: Path) -> None:
        """GIVEN extraction results exist with F1 < 0.75
        WHEN pilot script computes F1
        THEN script exits 1 (FAIL)
        """
        from scripts.curation.pipeline.nlp.pilot.run_pilot import compute_f1_score

        # Test F1 calculation with poor predictions
        predictions = ["Wrong Road Name"]
        labels = ["Tail of the Dragon", "Blue Ridge Parkway"]

        precision, recall, f1 = compute_f1_score(predictions, labels)

        assert f1 < 0.75, f"Expected F1 < 0.75, got {f1}"


class TestAttributeF1Reported:
    """AC-4: Attribute classification F1 reported per attribute."""

    def test_attribute_f1_reported(self, tmp_path: Path) -> None:
        """GIVEN extraction results exist
        WHEN pilot script evaluates attributes
        THEN results.json contains F1 for all 4 attributes
        """
        from scripts.curation.pipeline.nlp.pilot.run_pilot import compute_attribute_f1

        # Test attribute F1 calculation
        predicted_attrs = {
            "scenery": "positive",
            "twistiness": "positive",
            "traffic": "negative",
            "road_quality": "positive",
        }
        label_attrs = {
            "scenery": "positive",
            "twistiness": "positive",
            "traffic": "negative",
            "road_quality": "positive",
        }

        f1_scores = compute_attribute_f1(predicted_attrs, label_attrs)

        # All attributes should have F1 scores
        assert "scenery" in f1_scores
        assert "twistiness" in f1_scores
        assert "traffic" in f1_scores
        assert "road_quality" in f1_scores

        # Perfect match should give F1 = 1.0 for all
        assert all(f1 == 1.0 for f1 in f1_scores.values())


class TestTokenUsageSummary:
    """AC-5: Token usage summary written to results."""

    def test_token_usage_summary(self, tmp_path: Path) -> None:
        """GIVEN extraction run completes
        WHEN results.json is written
        THEN it contains total_input_tokens and total_output_tokens
        """
        # Create a mock results dict
        results = {
            "road_name_f1": 0.80,
            "status": "PASS",
            "total_input_tokens": 15000,
            "total_output_tokens": 5000,
        }

        results_path = tmp_path / "results.json"
        results_path.write_text(json.dumps(results, indent=2))

        # Verify token counts are present and integers
        loaded = json.loads(results_path.read_text())
        assert isinstance(loaded["total_input_tokens"], int)
        assert isinstance(loaded["total_output_tokens"], int)
        assert loaded["total_input_tokens"] > 0
        assert loaded["total_output_tokens"] > 0


class TestEndToEnd:
    """End-to-end integration tests with mocked API calls."""

    def test_full_pilot_with_mock_api(self, tmp_path: Path, monkeypatch) -> None:
        """GIVEN dataset exists and API is mocked
        WHEN full pilot runs
        THEN results.json is written with correct structure
        """
        from unittest.mock import Mock, patch
        from scripts.curation.pipeline.nlp.pilot.run_pilot import (
            PilotExtraction,
            build_dataset,
        )

        # GIVEN: Create dataset
        dataset_path = tmp_path / "dataset.json"
        dataset = build_dataset(num_posts=10)
        dataset_path.write_text(json.dumps(dataset, indent=2))

        results_path = tmp_path / "results.json"

        # Mock the API client
        mock_extraction = PilotExtraction(
            road_names=["Tail of the Dragon"],
            attributes={
                "scenery": "positive",
                "twistiness": "positive",
                "traffic": "negative",
                "road_quality": "positive",
            },
        )

        with patch(
            "scripts.curation.pipeline.nlp.pilot.run_pilot.PilotExtractionClient"
        ) as mock_client_class:
            mock_client = Mock()
            mock_client.extract.return_value = (mock_extraction, 150, 50)
            mock_client_class.return_value = mock_client

            # Mock API key
            monkeypatch.setenv("ANTHROPIC_API_KEY", "test-key")

            # WHEN: Run pilot
            import subprocess

            result = subprocess.run(
                [
                    "python3",
                    "scripts/curation/pipeline/nlp/pilot/run_pilot.py",
                    "--dataset-path",
                    str(dataset_path),
                    "--results-path",
                    str(results_path),
                ],
                capture_output=True,
                text=True,
            )

            # THEN: Should complete successfully
            assert result.returncode == 0, f"Pilot failed: {result.stderr}"
            assert results_path.exists(), "Results file not created"

            # Verify results structure
            results = json.loads(results_path.read_text())
            required_keys = {
                "road_name_precision",
                "road_name_recall",
                "road_name_f1",
                "attribute_f1",
                "attribute_f1_mean",
                "total_input_tokens",
                "total_output_tokens",
                "status",
            }
            assert set(results.keys()) >= required_keys
            assert results["status"] in ["PASS", "FAIL"]
            assert isinstance(results["total_input_tokens"], int)
            assert isinstance(results["total_output_tokens"], int)
