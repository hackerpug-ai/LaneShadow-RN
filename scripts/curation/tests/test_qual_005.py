"""Tests for QUAL-005 data quality report CI gating."""

from __future__ import annotations

import json
import os
import subprocess
import sys
from pathlib import Path

from scripts.curation.pipeline.quality.data_quality_report import (
    REQUIRED_METRICS,
    run_data_quality_report,
    write_data_quality_report,
)


class TestDataQualityReport:
    """Data quality report generation and anomaly detection."""

    def test_happy_path_all_pass(self, tmp_path: Path) -> None:
        """AC-1: all metrics within threshold should PASS with exit 0."""
        metrics = _metrics_fixture()
        prior_snapshot = _write_prior_snapshot(tmp_path / "prior.json", metrics)

        report = run_data_quality_report(metrics, prior_run_path=prior_snapshot)

        assert report.verdict == "PASS"
        assert report.exit_code == 0
        assert report.violations == []
        assert "**Verdict:** PASS (exit 0)" in report.markdown

    def test_anomaly_triggers_fail(self, tmp_path: Path) -> None:
        """AC-2: >10% deviation should FAIL with exit 1."""
        current_metrics = _metrics_fixture(completeness_pct=0.72)
        prior_metrics = _metrics_fixture(completeness_pct=0.90)
        prior_snapshot = _write_prior_snapshot(tmp_path / "prior.json", prior_metrics)

        report = run_data_quality_report(current_metrics, prior_run_path=prior_snapshot)

        assert report.verdict == "FAIL"
        assert report.exit_code == 1
        assert any("completeness" in violation for violation in report.violations)
        assert "**Verdict:** FAIL (exit 1)" in report.markdown

    def test_no_prior_run_no_anomaly(self, tmp_path: Path) -> None:
        """AC-3: missing prior snapshot sets deltas to n/a and exits 0."""
        metrics = _metrics_fixture()
        missing_prior = tmp_path / "missing-prior.json"

        report = run_data_quality_report(metrics, prior_run_path=missing_prior)
        write_data_quality_report(report, output_dir=tmp_path)

        assert report.exit_code == 0
        assert report.violations == []
        assert all(metric["delta"] == "n/a" for metric in report.metrics)

        payload = json.loads((tmp_path / "data-quality-report.json").read_text(encoding="utf-8"))
        assert all(metric["previous"] is None for metric in payload["metrics"])

    def test_all_five_metrics_present(self, tmp_path: Path) -> None:
        """AC-4: report includes exactly the five required metrics."""
        metrics = _metrics_fixture()
        prior_snapshot = _write_prior_snapshot(tmp_path / "prior.json", metrics)

        report = run_data_quality_report(metrics, prior_run_path=prior_snapshot)

        names = [entry["name"] for entry in report.metrics]
        assert names == REQUIRED_METRICS

        for metric_name in REQUIRED_METRICS:
            assert metric_name in report.markdown

        write_data_quality_report(report, output_dir=tmp_path)
        payload = json.loads((tmp_path / "data-quality-report.json").read_text(encoding="utf-8"))

        assert len(payload["metrics"]) == 5
        for entry in payload["metrics"]:
            assert set(entry) == {"name", "current", "previous", "delta", "threshold", "passed"}

    def test_json_sidecar_schema(self, tmp_path: Path) -> None:
        """AC-5: JSON sidecar matches exact machine-parseable schema."""
        current_metrics = _metrics_fixture(completeness_pct=0.72)
        prior_metrics = _metrics_fixture(completeness_pct=0.90)
        prior_snapshot = _write_prior_snapshot(tmp_path / "prior.json", prior_metrics)

        report = run_data_quality_report(current_metrics, prior_run_path=prior_snapshot)
        write_data_quality_report(report, output_dir=tmp_path)

        payload = json.loads((tmp_path / "data-quality-report.json").read_text(encoding="utf-8"))

        assert set(payload) == {"verdict", "exit_code", "run_id", "timestamp", "metrics", "violations"}
        assert isinstance(payload["verdict"], str)
        assert isinstance(payload["exit_code"], int)
        assert isinstance(payload["run_id"], str)
        assert isinstance(payload["timestamp"], str)
        assert isinstance(payload["metrics"], list)
        assert isinstance(payload["violations"], list)

        for entry in payload["metrics"]:
            assert set(entry) == {"name", "current", "previous", "delta", "threshold", "passed"}

        assert "completeness_pct" in payload["violations"]


class TestCLIExitCode:
    """Process-level CLI exit code behavior."""

    def test_subprocess_exit_codes(self, tmp_path: Path) -> None:
        """AC-6: CLI exits 0 on pass and 1 on anomaly."""
        repo_root = Path(__file__).resolve().parents[3]
        env = os.environ.copy()
        existing_pythonpath = env.get("PYTHONPATH")
        env["PYTHONPATH"] = (
            f"{repo_root}{os.pathsep}{existing_pythonpath}" if existing_pythonpath else str(repo_root)
        )

        passing_metrics_path = _write_metrics_file(tmp_path / "metrics-pass.json", _metrics_fixture())
        failing_metrics_path = _write_metrics_file(
            tmp_path / "metrics-fail.json",
            _metrics_fixture(completeness_pct=0.72),
        )
        prior_path = _write_prior_snapshot(
            tmp_path / "prior.json",
            _metrics_fixture(completeness_pct=0.90),
        )

        passing_output = tmp_path / "out-pass"
        failing_output = tmp_path / "out-fail"

        passing_result = subprocess.run(
            [
                sys.executable,
                "-m",
                "pipeline.quality.data_quality_report",
                "--metrics-json",
                str(passing_metrics_path),
                "--prior-run-json",
                str(prior_path),
                "--output-dir",
                str(passing_output),
                "--run-id",
                "test-pass",
            ],
            cwd=Path(__file__).resolve().parent.parent,
            check=False,
            capture_output=True,
            text=True,
            env=env,
        )

        failing_result = subprocess.run(
            [
                sys.executable,
                "-m",
                "pipeline.quality.data_quality_report",
                "--metrics-json",
                str(failing_metrics_path),
                "--prior-run-json",
                str(prior_path),
                "--output-dir",
                str(failing_output),
                "--run-id",
                "test-fail",
            ],
            cwd=Path(__file__).resolve().parent.parent,
            check=False,
            capture_output=True,
            text=True,
            env=env,
        )

        assert passing_result.returncode == 0, passing_result.stderr
        assert failing_result.returncode == 1, failing_result.stderr


def _metrics_fixture(**overrides: float) -> dict[str, float]:
    base = {
        "completeness_pct": 0.86,
        "source_overlap_pct": 0.64,
        "extraction_success_rate": 0.93,
        "dedup_merge_rate": 0.21,
        "quality_floor_exclusion_rate": 0.08,
    }
    base.update(overrides)
    return base


def _write_metrics_file(path: Path, metrics: dict[str, float]) -> Path:
    path.write_text(json.dumps(metrics, indent=2) + "\n", encoding="utf-8")
    return path


def _write_prior_snapshot(path: Path, metrics: dict[str, float]) -> Path:
    payload = {
        "verdict": "PASS",
        "exit_code": 0,
        "run_id": "prior",
        "timestamp": "2026-04-19T00:00:00+00:00",
        "metrics": [
            {
                "name": name,
                "current": value,
                "previous": None,
                "delta": "n/a",
                "threshold": 0.10,
                "passed": True,
            }
            for name, value in metrics.items()
        ],
        "violations": [],
    }
    path.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    return path
