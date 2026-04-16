"""Tests for the curvature discovery artifact consumer."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path

import pytest

from scripts.curation.pipeline.sources import curvature_discovery

FIXTURE_PATH = Path(__file__).parent.parent / "fixtures" / "curvature_discovery_sample.jsonl"


def _fixture_sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def _write_catalog(path: Path, rows: list[dict[str, object]]) -> Path:
    path.write_text(
        "".join(json.dumps(row) + "\n" for row in rows),
        encoding="utf-8",
    )
    return path


def test_resolve_artifact_path_prefers_cli_override_then_env_then_default(
    monkeypatch: pytest.MonkeyPatch,
    tmp_path: Path,
) -> None:
    cli_path = tmp_path / "cli.jsonl"
    env_path = tmp_path / "env.jsonl"
    default_path = tmp_path / "default.jsonl"
    for path in (cli_path, env_path, default_path):
        path.write_text("{}", encoding="utf-8")

    monkeypatch.setattr(curvature_discovery, "DEFAULT_ARTIFACT_PATH", default_path)
    monkeypatch.setenv("CURVATURE_ARTIFACT_PATH", str(env_path))

    assert curvature_discovery.resolve_artifact_path(cli_path) == cli_path
    assert curvature_discovery.resolve_artifact_path() == env_path

    monkeypatch.delenv("CURVATURE_ARTIFACT_PATH")
    assert curvature_discovery.resolve_artifact_path() == default_path


def test_resolve_artifact_path_fails_loudly_without_precomputed_artifact(
    monkeypatch: pytest.MonkeyPatch,
    tmp_path: Path,
) -> None:
    missing_default = tmp_path / "missing-default.jsonl"
    monkeypatch.setattr(curvature_discovery, "DEFAULT_ARTIFACT_PATH", missing_default)
    monkeypatch.delenv("CURVATURE_ARTIFACT_PATH", raising=False)

    with pytest.raises(FileNotFoundError, match="CURVATURE_ARTIFACT_PATH"):
        curvature_discovery.resolve_artifact_path()


@pytest.mark.parametrize("suffix", [".osm", ".pbf", ".osm.pbf"])
def test_resolve_artifact_path_rejects_raw_osm_inputs(tmp_path: Path, suffix: str) -> None:
    artifact_path = tmp_path / f"raw-source{suffix}"
    artifact_path.write_text("not-jsonl", encoding="utf-8")

    with pytest.raises(ValueError, match="JSONL/NDJSON"):
        curvature_discovery.resolve_artifact_path(artifact_path)


def test_load_routes_fails_loudly_when_default_catalog_is_missing(
    monkeypatch: pytest.MonkeyPatch,
    tmp_path: Path,
) -> None:
    monkeypatch.setattr(curvature_discovery, "DEFAULT_CATALOG_PATH", tmp_path / "missing-catalog.jsonl")

    with pytest.raises(FileNotFoundError, match="existing catalog"):
        curvature_discovery.load_routes(artifact_path=FIXTURE_PATH)


def test_load_routes_allows_explicit_catalog_opt_out(monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> None:
    monkeypatch.setattr(curvature_discovery, "DEFAULT_CATALOG_PATH", tmp_path / "missing-catalog.jsonl")

    routes = curvature_discovery.load_routes(
        artifact_path=FIXTURE_PATH,
        existing_catalog_path=False,
    )

    assert [route.name for route in routes] == ["Canyon Run", "Switchback Ridge", "Already Known Pass"]


def test_load_routes_excludes_existing_catalog_name_state_matches(tmp_path: Path) -> None:
    catalog_path = _write_catalog(
        tmp_path / "catalog.jsonl",
        [{"name": "Already Known Pass", "state": "CA"}],
    )

    routes = curvature_discovery.load_routes(
        artifact_path=FIXTURE_PATH,
        existing_catalog_path=catalog_path,
    )

    assert [route.name for route in routes] == ["Canyon Run", "Switchback Ridge"]


def test_load_routes_normalizes_twisties_and_populates_curvature_score(tmp_path: Path) -> None:
    catalog_path = _write_catalog(tmp_path / "empty-catalog.jsonl", [])

    routes = curvature_discovery.load_routes(
        artifact_path=FIXTURE_PATH,
        existing_catalog_path=catalog_path,
    )

    by_name = {route.name: route for route in routes}
    assert by_name["Switchback Ridge"].primary_archetype == "twisties"
    assert by_name["Switchback Ridge"].curvature_score == pytest.approx(87.25)
    assert by_name["Canyon Run"].primary_archetype == "twisties"
    assert by_name["Canyon Run"].curvature_score == pytest.approx(91.0)


def test_load_routes_invalid_json_error_includes_artifact_path_and_line_number(tmp_path: Path) -> None:
    artifact_path = tmp_path / "broken.jsonl"
    artifact_path.write_text(
        '{"name":"ok","state":"CA","centroid_lat":1,"centroid_lng":2,"curvature_score":3}\n'
        '{"name":"broken"\n',
        encoding="utf-8",
    )

    with pytest.raises(ValueError, match=r"broken\.jsonl at line 2"):
        curvature_discovery.load_routes(
            artifact_path=artifact_path,
            existing_catalog_path=_write_catalog(tmp_path / "catalog.jsonl", []),
        )


def test_write_outputs_is_deterministic(tmp_path: Path) -> None:
    routes = curvature_discovery.load_routes(
        artifact_path=FIXTURE_PATH,
        existing_catalog_path=_write_catalog(tmp_path / "catalog.jsonl", []),
    )
    output_path = tmp_path / "curvature_discovery.jsonl"
    progress_path = tmp_path / "curvature_discovery.jsonl.progress"
    audit_path = tmp_path / "curvature_discovery.jsonl.audit.json"

    first = curvature_discovery.write_outputs(
        routes,
        artifact_path=FIXTURE_PATH,
        output_path=output_path,
        progress_path=progress_path,
        audit_path=audit_path,
    ).read_text(encoding="utf-8")
    second = curvature_discovery.write_outputs(
        list(reversed(routes)),
        artifact_path=FIXTURE_PATH,
        output_path=output_path,
        progress_path=progress_path,
        audit_path=audit_path,
    ).read_text(encoding="utf-8")

    assert first == second
    rows = [json.loads(line) for line in first.strip().splitlines()]
    expected_sha = _fixture_sha256(FIXTURE_PATH)
    expected_artifact_id = f"artifact:curvature-discovery-sample#sha256:{expected_sha[:12]}"
    assert [row["name"] for row in rows] == ["Canyon Run", "Switchback Ridge", "Already Known Pass"]
    assert all(str(FIXTURE_PATH) not in line for line in first.splitlines())
    assert all(expected_artifact_id in row["source_refs"] for row in rows)
    audit = json.loads(audit_path.read_text(encoding="utf-8"))
    assert audit["written"] == 3
    assert audit["artifact_id"] == expected_artifact_id
    assert audit["artifact_sha256"] == expected_sha
    assert str(FIXTURE_PATH) not in json.dumps(audit)


def test_write_outputs_rejects_raw_source_paths(tmp_path: Path) -> None:
    routes = curvature_discovery.load_routes(
        artifact_path=FIXTURE_PATH,
        existing_catalog_path=_write_catalog(tmp_path / "catalog.jsonl", []),
    )
    raw_artifact_path = tmp_path / "us-latest.osm.pbf"
    raw_artifact_path.write_text("raw", encoding="utf-8")

    with pytest.raises(ValueError, match="JSONL/NDJSON"):
        curvature_discovery.write_outputs(
            routes,
            artifact_path=raw_artifact_path,
            output_path=tmp_path / "curvature_discovery.jsonl",
            progress_path=tmp_path / "curvature_discovery.jsonl.progress",
            audit_path=tmp_path / "curvature_discovery.jsonl.audit.json",
        )
