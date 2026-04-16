"""Publish curvature artifact releases into Convex File Storage.

This CLI reads a local curvature release manifest plus the referenced full
artifact and per-state shard files, uploads them to Convex File Storage via
short-lived upload URLs, then registers the release and shard metadata in
Convex tables.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import logging
import os
import subprocess
import sys
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Protocol

import requests

logger = logging.getLogger(__name__)

_REPO_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_SOURCE = "curvature"
DEFAULT_UPLOAD_URL_MUTATION = "curationArtifacts:generateArtifactUploadUrl"
DEFAULT_UPSERT_RELEASE_MUTATION = "curationArtifacts:upsertArtifactRelease"
DEFAULT_UPSERT_SHARDS_MUTATION = "curationArtifacts:upsertArtifactShards"
DEFAULT_ACTIVATE_RELEASE_MUTATION = "curationArtifacts:activateArtifactRelease"


class ConfigurationError(RuntimeError):
    """Raised when required runtime configuration is missing."""


class ManifestError(RuntimeError):
    """Raised when the manifest shape or local artifacts are invalid."""


class ConvexRequestError(RuntimeError):
    """Raised when a Convex HTTP API call or upload fails."""


@dataclass(frozen=True)
class ArtifactFileSpec:
    """Local artifact file referenced by the release manifest."""

    kind: str
    path: Path
    content_type: str
    count_rows: bool
    expected_sha256: str | None = None
    expected_row_count: int | None = None
    state: str | None = None


@dataclass(frozen=True)
class VerifiedArtifactFile:
    """Artifact file with computed integrity metadata."""

    kind: str
    path: Path
    content_type: str
    sha256: str
    row_count: int | None
    state: str | None = None


@dataclass(frozen=True)
class ReleaseBundle:
    """Fully resolved publish inputs for one release."""

    source: str
    release_id: str
    generated_at_ms: int
    active: bool
    artifact_name: str
    manifest: ArtifactFileSpec
    full_artifact: ArtifactFileSpec
    shards: tuple[ArtifactFileSpec, ...]


@dataclass(frozen=True)
class PublishConfig:
    """Runtime configuration for Convex API calls."""

    base_url: str
    generate_upload_url_mutation: str = DEFAULT_UPLOAD_URL_MUTATION
    upsert_release_mutation: str = DEFAULT_UPSERT_RELEASE_MUTATION
    upsert_shards_mutation: str = DEFAULT_UPSERT_SHARDS_MUTATION
    activate_release_mutation: str = DEFAULT_ACTIVATE_RELEASE_MUTATION


@dataclass(frozen=True)
class PublishResult:
    """Outcome of one publish run."""

    source: str
    release_id: str
    manifest_storage_id: str
    full_artifact_storage_id: str
    shard_storage_ids: dict[str, str]
    shard_count: int


class PublisherClient(Protocol):
    """Minimal client contract used by publish_release()."""

    def generate_upload_url(self) -> str: ...

    def upload_file(self, upload_url: str, artifact: VerifiedArtifactFile) -> str: ...

    def upsert_release(self, payload: dict[str, Any]) -> Any: ...

    def upsert_shards(self, payload: dict[str, Any]) -> Any: ...

    def activate_release(self, payload: dict[str, Any]) -> Any: ...


class ConvexPublisherClient:
    """Convex HTTP API client for artifact publishing."""

    def __init__(self, config: PublishConfig, session: requests.Session | None = None):
        self.config = config
        self._owns_session = session is None
        self.session = session or requests.Session()

    def close(self) -> None:
        if self._owns_session:
            self.session.close()

    def generate_upload_url(self) -> str:
        value = self._call_mutation(self.config.generate_upload_url_mutation, {})
        if isinstance(value, str) and value:
            return value
        if isinstance(value, dict):
            for key in ("uploadUrl", "postUrl", "url"):
                upload_url = value.get(key)
                if isinstance(upload_url, str) and upload_url:
                    return upload_url
        raise ConvexRequestError(
            f"{self.config.generate_upload_url_mutation} did not return an upload URL"
        )

    def upload_file(self, upload_url: str, artifact: VerifiedArtifactFile) -> str:
        try:
            with artifact.path.open("rb") as handle:
                response = self.session.post(
                    upload_url,
                    data=handle,
                    headers={"Content-Type": artifact.content_type},
                    timeout=120,
                )
            response.raise_for_status()
        except requests.RequestException as exc:
            raise ConvexRequestError(
                f"Upload failed for {artifact.path}: {exc}"
            ) from exc

        try:
            payload = response.json()
        except ValueError as exc:
            raise ConvexRequestError(
                f"Upload response for {artifact.path} was not valid JSON"
            ) from exc

        storage_id = payload.get("storageId")
        if not isinstance(storage_id, str) or not storage_id:
            raise ConvexRequestError(
                f"Upload response for {artifact.path} did not include storageId"
            )
        return storage_id

    def upsert_release(self, payload: dict[str, Any]) -> Any:
        return self._call_mutation(self.config.upsert_release_mutation, payload)

    def upsert_shards(self, payload: dict[str, Any]) -> Any:
        return self._call_mutation(self.config.upsert_shards_mutation, payload)

    def activate_release(self, payload: dict[str, Any]) -> Any:
        return self._call_mutation(self.config.activate_release_mutation, payload)

    def _call_mutation(self, path: str, args: dict[str, Any]) -> Any:
        args_json = json.dumps(args)
        cmd = ["npx", "convex", "run", path, args_json]
        if self.config.base_url:
            cmd.extend(["--url", self.config.base_url])

        env = os.environ.copy()
        env.pop("CONVEX_DEPLOYMENT", None)

        result = subprocess.run(
            cmd,
            cwd=str(_REPO_ROOT),
            capture_output=True,
            text=True,
            timeout=120,
            env=env,
        )
        if result.returncode != 0:
            raise ConvexRequestError(
                f"Convex mutation {path} failed: {result.stderr.strip() or result.stdout.strip()}"
            )

        output = result.stdout.strip()
        if output.startswith('"') and output.endswith('"'):
            try:
                output = json.loads(output)
            except json.JSONDecodeError:
                pass

        try:
            return json.loads(output) if isinstance(output, str) else output
        except json.JSONDecodeError as exc:
            raise ConvexRequestError(
                f"Convex mutation {path} returned invalid JSON: {output[:200]}"
            ) from exc


def _utc_now() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def _timestamp_ms(raw_value: str | int | float | None) -> int:
    if raw_value is None:
        return int(datetime.now(timezone.utc).timestamp() * 1000)
    if isinstance(raw_value, bool):
        raise ManifestError("generatedAt must be an integer timestamp or ISO-8601 string")
    if isinstance(raw_value, int):
        return raw_value
    if isinstance(raw_value, float):
        if not raw_value.is_integer():
            raise ManifestError("generatedAt float values must be whole milliseconds")
        return int(raw_value)
    normalized = raw_value.strip()
    if not normalized:
        raise ManifestError("generatedAt must not be empty")
    if normalized.isdigit():
        return int(normalized)
    try:
        parsed = datetime.fromisoformat(normalized.replace("Z", "+00:00"))
    except ValueError as exc:
        raise ManifestError(
            "generatedAt must be an integer timestamp or ISO-8601 string"
        ) from exc
    return int(parsed.timestamp() * 1000)


def _load_dotenv() -> None:
    """Load `.env.local` without overwriting already-set variables."""
    env_path = _REPO_ROOT / ".env.local"
    if not env_path.exists():
        return

    with env_path.open() as handle:
        for raw_line in handle:
            line = raw_line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, _, value = line.partition("=")
            key = key.strip()
            value = value.strip()
            if key and key not in os.environ:
                os.environ[key] = value


def _require_string(mapping: dict[str, Any], key: str) -> str:
    value = mapping.get(key)
    if not isinstance(value, str) or not value.strip():
        raise ManifestError(f"Manifest field '{key}' is required")
    return value.strip()


def _optional_string(mapping: dict[str, Any], *keys: str) -> str | None:
    for key in keys:
        value = mapping.get(key)
        if isinstance(value, str) and value.strip():
            return value.strip()
    return None


def _optional_int(mapping: dict[str, Any], key: str) -> int | None:
    value = mapping.get(key)
    if value is None:
        return None
    if isinstance(value, bool):
        raise ManifestError(f"Manifest field '{key}' must be an integer")
    if isinstance(value, int):
        return value
    if isinstance(value, float) and value.is_integer():
        return int(value)
    if isinstance(value, str) and value.strip():
        try:
            return int(value)
        except ValueError as exc:
            raise ManifestError(f"Manifest field '{key}' must be an integer") from exc
    raise ManifestError(f"Manifest field '{key}' must be an integer")


def _artifact_content_type(path: Path) -> str:
    if path.suffix.lower() == ".json":
        return "application/json"
    if path.suffix.lower() == ".jsonl":
        return "application/x-ndjson"
    return "application/octet-stream"


def _resolve_input_path(raw_path: str, *, manifest_path: Path) -> Path:
    candidate = Path(raw_path)
    tried: list[Path] = []

    def _add(value: Path) -> None:
        resolved = value if value.is_absolute() else value.resolve()
        if resolved not in tried:
            tried.append(resolved)

    if candidate.is_absolute():
        _add(candidate)
    else:
        _add(manifest_path.parent / candidate)
        _add(Path.cwd() / candidate)
        _add(_REPO_ROOT / candidate)

    for path in tried:
        if path.exists():
            return path

    attempted = ", ".join(str(path) for path in tried)
    raise ManifestError(f"Artifact path '{raw_path}' does not exist. Tried: {attempted}")


def load_release_bundle(
    manifest_path: str | Path,
    *,
    source: str | None = None,
    release_id: str | None = None,
    generated_at: str | None = None,
    active: bool | None = None,
) -> ReleaseBundle:
    """Load and normalize one curvature release manifest."""
    manifest_file = Path(manifest_path).resolve()
    if not manifest_file.exists():
        raise ManifestError(f"Manifest file does not exist: {manifest_file}")

    try:
        manifest_data = json.loads(manifest_file.read_text())
    except json.JSONDecodeError as exc:
        raise ManifestError(f"Manifest file is not valid JSON: {manifest_file}") from exc

    if not isinstance(manifest_data, dict):
        raise ManifestError("Manifest root must be a JSON object")

    artifact_name = _optional_string(manifest_data, "artifact_name", "artifactName")
    if not artifact_name:
        artifact_name = manifest_file.stem.replace(".manifest", "")

    full_artifact = ArtifactFileSpec(
        kind="full_artifact",
        path=_resolve_input_path(
            _require_string(manifest_data, "artifact_path"),
            manifest_path=manifest_file,
        ),
        content_type="application/x-ndjson",
        count_rows=True,
        expected_sha256=_optional_string(manifest_data, "artifact_sha256", "sha256"),
        expected_row_count=_optional_int(manifest_data, "rows"),
    )

    per_state = manifest_data.get("per_state")
    if not isinstance(per_state, list) or not per_state:
        raise ManifestError("Manifest field 'per_state' must be a non-empty array")

    shards: list[ArtifactFileSpec] = []
    for index, entry in enumerate(per_state):
        if not isinstance(entry, dict):
            raise ManifestError(f"Manifest shard entry #{index} must be an object")
        state = _optional_string(entry, "state", "state_slug")
        if not state:
            raise ManifestError(f"Manifest shard entry #{index} is missing 'state' or 'state_slug'")
        shards.append(
            ArtifactFileSpec(
                kind="shard",
                state=state,
                path=_resolve_input_path(
                    _require_string(entry, "path"),
                    manifest_path=manifest_file,
                ),
                content_type="application/x-ndjson",
                count_rows=True,
                expected_sha256=_optional_string(entry, "sha256"),
                expected_row_count=_optional_int(entry, "rows"),
            )
        )

    resolved_source = source or _optional_string(manifest_data, "source") or DEFAULT_SOURCE
    resolved_release_id = (
        release_id
        or _optional_string(manifest_data, "release_id", "releaseId")
        or f"{artifact_name}-sha256-{(full_artifact.expected_sha256 or 'pending')[:12]}"
    )
    resolved_generated_at_ms = _timestamp_ms(
        generated_at
        or manifest_data.get("generated_at")
        or manifest_data.get("generatedAt")
        or _utc_now()
    )
    resolved_active = active if active is not None else bool(manifest_data.get("active", True))

    manifest_spec = ArtifactFileSpec(
        kind="manifest",
        path=manifest_file,
        content_type=_artifact_content_type(manifest_file),
        count_rows=False,
    )

    return ReleaseBundle(
        source=resolved_source,
        release_id=resolved_release_id,
        generated_at_ms=resolved_generated_at_ms,
        active=resolved_active,
        artifact_name=artifact_name,
        manifest=manifest_spec,
        full_artifact=full_artifact,
        shards=tuple(shards),
    )


def verify_artifact_file(spec: ArtifactFileSpec) -> VerifiedArtifactFile:
    """Compute integrity metadata and validate manifest expectations."""
    sha256 = hashlib.sha256()
    newline_count = 0
    file_size = 0
    last_byte = b""

    with spec.path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            sha256.update(chunk)
            file_size += len(chunk)
            if spec.count_rows:
                newline_count += chunk.count(b"\n")
                last_byte = chunk[-1:]

    digest = sha256.hexdigest()
    row_count = None
    if spec.count_rows:
        row_count = newline_count + (1 if file_size > 0 and last_byte != b"\n" else 0)

    if spec.expected_sha256 and digest != spec.expected_sha256:
        raise ManifestError(
            f"{spec.kind} checksum mismatch for {spec.path}: "
            f"expected {spec.expected_sha256}, got {digest}"
        )
    if spec.expected_row_count is not None and row_count != spec.expected_row_count:
        raise ManifestError(
            f"{spec.kind} row count mismatch for {spec.path}: "
            f"expected {spec.expected_row_count}, got {row_count}"
        )

    return VerifiedArtifactFile(
        kind=spec.kind,
        path=spec.path,
        content_type=spec.content_type,
        sha256=digest,
        row_count=row_count,
        state=spec.state,
    )


def publish_release(bundle: ReleaseBundle, client: PublisherClient) -> PublishResult:
    """Publish the manifest, full artifact, and shards to Convex."""
    logger.info("Verifying local curvature artifacts for release %s", bundle.release_id)
    verified_manifest = verify_artifact_file(bundle.manifest)
    verified_full_artifact = verify_artifact_file(bundle.full_artifact)
    verified_shards = [verify_artifact_file(shard) for shard in bundle.shards]

    logger.info("Uploading manifest file %s", verified_manifest.path)
    manifest_storage_id = client.upload_file(client.generate_upload_url(), verified_manifest)

    logger.info("Uploading full artifact %s", verified_full_artifact.path)
    full_artifact_storage_id = client.upload_file(
        client.generate_upload_url(),
        verified_full_artifact,
    )

    shard_storage_ids: dict[str, str] = {}
    for shard in verified_shards:
        logger.info("Uploading shard %s (%s)", shard.state, shard.path)
        shard_storage_ids[shard.state or "unknown"] = client.upload_file(
            client.generate_upload_url(),
            shard,
        )

    release_payload = {
        "source": bundle.source,
        "releaseId": bundle.release_id,
        "manifestStorageId": manifest_storage_id,
        "fullArtifactStorageId": full_artifact_storage_id,
        "rowCount": verified_full_artifact.row_count,
        "sha256": verified_full_artifact.sha256,
        "generatedAt": bundle.generated_at_ms,
    }
    logger.info("Upserting release metadata for %s", bundle.release_id)
    client.upsert_release(release_payload)

    shard_payloads = []
    for shard in verified_shards:
        shard_payloads.append(
            {
                "source": bundle.source,
                "releaseId": bundle.release_id,
                "state": shard.state,
                "storageId": shard_storage_ids[shard.state or "unknown"],
                "rowCount": shard.row_count,
                "sha256": shard.sha256,
            }
        )

    logger.info("Upserting %s shard metadata rows", len(shard_payloads))
    client.upsert_shards({"shards": shard_payloads})

    if bundle.active:
        logger.info("Activating release %s", bundle.release_id)
        client.activate_release(
            {
                "source": bundle.source,
                "releaseId": bundle.release_id,
            }
        )

    return PublishResult(
        source=bundle.source,
        release_id=bundle.release_id,
        manifest_storage_id=manifest_storage_id,
        full_artifact_storage_id=full_artifact_storage_id,
        shard_storage_ids=shard_storage_ids,
        shard_count=len(verified_shards),
    )


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Upload curvature artifacts to Convex File Storage and register metadata.",
    )
    parser.add_argument("--manifest", required=True, help="Path to the release manifest JSON")
    parser.add_argument("--source", help=f"Artifact source name (default: {DEFAULT_SOURCE})")
    parser.add_argument("--release-id", help="Override release identifier")
    parser.add_argument("--generated-at", help="Override generatedAt timestamp (UTC ISO-8601)")
    parser.add_argument(
        "--inactive",
        action="store_true",
        help="Register the release as inactive instead of active",
    )
    parser.add_argument(
        "--base-url",
        default=os.environ.get("CONVEX_URL", ""),
        help="Convex deployment URL (defaults to CONVEX_URL)",
    )
    parser.add_argument(
        "--generate-upload-url-mutation",
        default=os.environ.get(
            "CURVATURE_ARTIFACT_UPLOAD_MUTATION",
            DEFAULT_UPLOAD_URL_MUTATION,
        ),
        help="Convex mutation path that returns a short-lived upload URL",
    )
    parser.add_argument(
        "--upsert-release-mutation",
        default=os.environ.get(
            "CURVATURE_ARTIFACT_UPSERT_RELEASE_MUTATION",
            DEFAULT_UPSERT_RELEASE_MUTATION,
        ),
        help="Convex mutation path that upserts release metadata",
    )
    parser.add_argument(
        "--upsert-shards-mutation",
        default=os.environ.get(
            "CURVATURE_ARTIFACT_UPSERT_SHARDS_MUTATION",
            DEFAULT_UPSERT_SHARDS_MUTATION,
        ),
        help="Convex mutation path that upserts shard metadata in one batch",
    )
    parser.add_argument(
        "--activate-release-mutation",
        default=os.environ.get(
            "CURVATURE_ARTIFACT_ACTIVATE_RELEASE_MUTATION",
            DEFAULT_ACTIVATE_RELEASE_MUTATION,
        ),
        help="Convex mutation path that marks a release active",
    )
    return parser


def _validate_config(args: argparse.Namespace) -> PublishConfig:
    if not args.base_url:
        raise ConfigurationError("CONVEX_URL or --base-url is required")
    return PublishConfig(
        base_url=args.base_url,
        generate_upload_url_mutation=args.generate_upload_url_mutation,
        upsert_release_mutation=args.upsert_release_mutation,
        upsert_shards_mutation=args.upsert_shards_mutation,
        activate_release_mutation=args.activate_release_mutation,
    )


def main(argv: list[str] | None = None) -> int:
    _load_dotenv()
    parser = build_parser()
    args = parser.parse_args(argv)

    logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")

    try:
        config = _validate_config(args)
        bundle = load_release_bundle(
            args.manifest,
            source=args.source,
            release_id=args.release_id,
            generated_at=args.generated_at,
            active=False if args.inactive else None,
        )
        client = ConvexPublisherClient(config)
        try:
            result = publish_release(bundle, client)
        finally:
            client.close()
    except (ConfigurationError, ManifestError, ConvexRequestError) as exc:
        logger.error("%s", exc)
        return 1

    print(
        json.dumps(
            {
                "source": result.source,
                "releaseId": result.release_id,
                "manifestStorageId": result.manifest_storage_id,
                "fullArtifactStorageId": result.full_artifact_storage_id,
                "shardCount": result.shard_count,
                "shardStorageIds": result.shard_storage_ids,
            },
            indent=2,
            sort_keys=True,
        )
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
