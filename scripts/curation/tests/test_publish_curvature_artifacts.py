"""Tests for the curvature artifact publisher CLI."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path
from types import SimpleNamespace

import pytest

from scripts.curation.publish_curvature_artifacts import (
    ConvexPublisherClient,
    ConvexRequestError,
    ManifestError,
    PublishConfig,
    load_release_bundle,
    publish_release,
)


def _sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def _write_jsonl(path: Path, rows: list[dict]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("".join(json.dumps(row) + "\n" for row in rows))


class FakePublisherClient:
    def __init__(self) -> None:
        self.generated_urls: list[str] = []
        self.uploads: list[tuple[str, str, Path]] = []
        self.release_payloads: list[dict] = []
        self.shard_payloads: list[dict] = []
        self.activation_payloads: list[dict] = []
        self._url_counter = 0
        self._storage_counter = 0

    def generate_upload_url(self) -> str:
        self._url_counter += 1
        url = f"https://upload.example/{self._url_counter}"
        self.generated_urls.append(url)
        return url

    def upload_file(self, upload_url, artifact):
        self._storage_counter += 1
        self.uploads.append((upload_url, artifact.kind, artifact.path))
        return f"storage-{self._storage_counter}"

    def upsert_release(self, payload):
        self.release_payloads.append(payload)
        return {"ok": True}

    def upsert_shards(self, payload):
        self.shard_payloads.append(payload)
        return {"ok": True}

    def activate_release(self, payload):
        self.activation_payloads.append(payload)
        return {"ok": True}


def test_load_release_bundle_resolves_current_manifest_shape(tmp_path, monkeypatch):
    repo_root = tmp_path
    monkeypatch.chdir(repo_root)
    monkeypatch.setattr(
        "scripts.curation.publish_curvature_artifacts._utc_now",
        lambda: "2026-04-16T12:00:00Z",
    )

    full_artifact = repo_root / ".tmp" / "curvature-build" / "jsonl" / "merged" / "us.jsonl"
    shard = repo_root / ".tmp" / "curvature-build" / "jsonl" / "utah.jsonl"
    _write_jsonl(full_artifact, [{"route": "a"}, {"route": "b"}])
    _write_jsonl(shard, [{"route": "ut"}])

    manifest_path = repo_root / "data" / "curvature" / "release.manifest.json"
    manifest_path.parent.mkdir(parents=True, exist_ok=True)
    manifest_path.write_text(
        json.dumps(
            {
                "artifact_name": "adamfranco-us-curvature-51-states",
                "artifact_path": ".tmp/curvature-build/jsonl/merged/us.jsonl",
                "artifact_sha256": _sha256(full_artifact),
                "rows": 2,
                "per_state": [
                    {
                        "state_slug": "utah",
                        "path": ".tmp/curvature-build/jsonl/utah.jsonl",
                        "sha256": _sha256(shard),
                        "rows": 1,
                    }
                ],
            }
        )
    )

    bundle = load_release_bundle(manifest_path)

    assert bundle.source == "curvature"
    assert bundle.release_id == "adamfranco-us-curvature-51-states-sha256-" + _sha256(full_artifact)[:12]
    assert bundle.generated_at_ms == 1776340800000
    assert bundle.full_artifact.path == full_artifact.resolve()
    assert bundle.shards[0].state == "utah"
    assert bundle.shards[0].path == shard.resolve()


def test_publish_release_uploads_files_and_registers_metadata(tmp_path):
    full_artifact = tmp_path / "artifacts" / "us.jsonl"
    california = tmp_path / "artifacts" / "california.jsonl"
    utah = tmp_path / "artifacts" / "utah.jsonl"
    manifest_path = tmp_path / "release.manifest.json"

    _write_jsonl(full_artifact, [{"route": "a"}, {"route": "b"}, {"route": "c"}])
    _write_jsonl(california, [{"route": "ca-1"}, {"route": "ca-2"}])
    _write_jsonl(utah, [{"route": "ut-1"}])
    manifest_path.write_text(
        json.dumps(
            {
                "artifact_name": "curvature-us",
                "artifact_path": str(full_artifact),
                "artifact_sha256": _sha256(full_artifact),
                "rows": 3,
                "per_state": [
                    {
                        "state_slug": "california",
                        "path": str(california),
                        "sha256": _sha256(california),
                        "rows": 2,
                    },
                    {
                        "state_slug": "utah",
                        "path": str(utah),
                        "sha256": _sha256(utah),
                        "rows": 1,
                    },
                ],
            }
        )
    )

    bundle = load_release_bundle(
        manifest_path,
        source="curvature",
        release_id="release-2026-04-16",
        generated_at="2026-04-16T12:00:00Z",
        active=True,
    )
    client = FakePublisherClient()

    result = publish_release(bundle, client)

    assert result.release_id == "release-2026-04-16"
    assert result.manifest_storage_id == "storage-1"
    assert result.full_artifact_storage_id == "storage-2"
    assert result.shard_storage_ids == {
        "california": "storage-3",
        "utah": "storage-4",
    }

    assert [upload[1] for upload in client.uploads] == [
        "manifest",
        "full_artifact",
        "shard",
        "shard",
    ]
    assert client.release_payloads == [
        {
            "source": "curvature",
            "releaseId": "release-2026-04-16",
            "manifestStorageId": "storage-1",
            "fullArtifactStorageId": "storage-2",
            "rowCount": 3,
            "sha256": _sha256(full_artifact),
            "generatedAt": 1776340800000,
        }
    ]
    assert client.shard_payloads == [
        {
            "shards": [
                {
                    "source": "curvature",
                    "releaseId": "release-2026-04-16",
                    "state": "california",
                    "storageId": "storage-3",
                    "rowCount": 2,
                    "sha256": _sha256(california),
                },
                {
                    "source": "curvature",
                    "releaseId": "release-2026-04-16",
                    "state": "utah",
                    "storageId": "storage-4",
                    "rowCount": 1,
                    "sha256": _sha256(utah),
                },
            ]
        },
    ]
    assert client.activation_payloads == [
        {
            "source": "curvature",
            "releaseId": "release-2026-04-16",
        }
    ]


def test_publish_release_stops_before_upload_on_checksum_mismatch(tmp_path):
    full_artifact = tmp_path / "artifacts" / "us.jsonl"
    shard = tmp_path / "artifacts" / "utah.jsonl"
    manifest_path = tmp_path / "release.manifest.json"

    _write_jsonl(full_artifact, [{"route": "a"}])
    _write_jsonl(shard, [{"route": "ut"}])
    manifest_path.write_text(
        json.dumps(
            {
                "artifact_name": "curvature-us",
                "artifact_path": str(full_artifact),
                "artifact_sha256": "deadbeef",
                "rows": 1,
                "per_state": [
                    {
                        "state_slug": "utah",
                        "path": str(shard),
                        "sha256": _sha256(shard),
                        "rows": 1,
                    }
                ],
            }
        )
    )

    bundle = load_release_bundle(manifest_path)
    client = FakePublisherClient()

    with pytest.raises(ManifestError, match="checksum mismatch"):
        publish_release(bundle, client)

    assert client.uploads == []
    assert client.release_payloads == []
    assert client.shard_payloads == []
    assert client.activation_payloads == []


def test_convex_client_runs_cli_mutation_and_surfaces_upload_errors(tmp_path, monkeypatch):
    config = PublishConfig(
        base_url="https://example.convex.cloud",
    )
    calls: list[dict] = []

    def fake_run(cmd, **kwargs):
        calls.append({"cmd": cmd, **kwargs})
        return SimpleNamespace(returncode=0, stdout='{"uploadUrl":"https://upload.example/1"}\n', stderr="")

    monkeypatch.setattr("scripts.curation.publish_curvature_artifacts.subprocess.run", fake_run)
    client = ConvexPublisherClient(config)

    upload_url = client.generate_upload_url()

    assert upload_url == "https://upload.example/1"
    mutation_call = calls[0]
    assert mutation_call["cmd"] == [
        "npx",
        "convex",
        "run",
        "curationArtifacts:generateArtifactUploadUrl",
        "{}",
        "--url",
        "https://example.convex.cloud",
    ]

    artifact = tmp_path / "release.manifest.json"
    artifact.write_text('{"ok":true}')

    verified = type(
        "Verified",
        (),
        {
            "path": artifact,
            "content_type": "application/json",
        },
    )()

    with pytest.raises(ConvexRequestError, match="Upload failed"):
        client.upload_file(upload_url, verified)

    client.close()
