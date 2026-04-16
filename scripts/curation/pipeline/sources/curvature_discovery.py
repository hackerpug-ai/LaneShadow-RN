"""Consume precomputed curvature discovery output and emit staging JSONL."""

from __future__ import annotations

import argparse
import dataclasses
import hashlib
import json
import logging
import os
import re
from functools import lru_cache
from pathlib import Path
from typing import Any, Iterable, Sequence

from scripts.curation.pipeline.models import Route

logger = logging.getLogger(__name__)

REPO_ROOT = Path(__file__).resolve().parents[4]
DEFAULT_ARTIFACT_PATH = REPO_ROOT / "data" / "curvature" / "adamfranco-us-curvature.jsonl"
DEFAULT_CATALOG_PATH = REPO_ROOT / "baseline" / "catalog.jsonl"
OUTPUT_PATH = REPO_ROOT / "staging" / "curvature_discovery.jsonl"
PROGRESS_PATH = REPO_ROOT / "staging" / "curvature_discovery.jsonl.progress"
AUDIT_PATH = REPO_ROOT / "staging" / "curvature_discovery.jsonl.audit.json"

SOURCE_LABEL = "adamfranco/curvature"
SOURCE_NAME = "curvature_discovery"
PRIMARY_ARCHETYPE = "twisties"
SUPPORTED_ARTIFACT_SUFFIXES: tuple[tuple[str, ...], ...] = (
    (".jsonl",),
    (".ndjson",),
)
REJECTED_RAW_SOURCE_SUFFIXES: tuple[tuple[str, ...], ...] = (
    (".osm", ".pbf"),
    (".osm",),
    (".pbf",),
)


def _slugify(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")


def _normalize_state(value: str) -> str:
    return " / ".join(part.strip() for part in str(value).split("/") if part.strip())


def _canonical_key(name: str, state: str) -> tuple[str, str]:
    return (_slugify(name), _slugify(_normalize_state(state)))


def _artifact_identifier(path: str | Path) -> str:
    path_obj = Path(path)
    suffixes = tuple(path_obj.suffixes)
    base_name = path_obj.name
    for supported_suffixes in SUPPORTED_ARTIFACT_SUFFIXES:
        if suffixes[-len(supported_suffixes):] == supported_suffixes:
            base_name = path_obj.name[: -len("".join(supported_suffixes))]
            break
    return f"artifact:{_slugify(base_name)}"


def _validate_precomputed_artifact_path(path: Path) -> Path:
    suffixes = tuple(path.suffixes)
    for rejected_suffixes in REJECTED_RAW_SOURCE_SUFFIXES:
        if suffixes[-len(rejected_suffixes):] == rejected_suffixes:
            raise ValueError(
                "Curvature discovery only accepts precomputed JSONL/NDJSON artifacts; "
                f"refusing raw source input {path}."
            )

    for supported_suffixes in SUPPORTED_ARTIFACT_SUFFIXES:
        if suffixes[-len(supported_suffixes):] == supported_suffixes:
            return path

    raise ValueError(
        "Curvature discovery only accepts precomputed JSONL/NDJSON artifacts; "
        f"unsupported artifact path {path}."
    )


def _resolve_existing_precomputed_artifact_path(path: str | Path) -> Path:
    resolved = _validate_precomputed_artifact_path(Path(path).expanduser())
    if not resolved.is_file():
        raise FileNotFoundError(f"Curvature artifact does not exist: {resolved}")
    return resolved


@lru_cache(maxsize=None)
def _artifact_provenance_for_path(path_str: str) -> dict[str, str]:
    path = _resolve_existing_precomputed_artifact_path(path_str)
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)

    sha256 = digest.hexdigest()
    return {
        "artifact_id": f"{_artifact_identifier(path)}#sha256:{sha256[:12]}",
        "artifact_sha256": sha256,
    }


def _artifact_provenance(path: str | Path) -> dict[str, str]:
    return _artifact_provenance_for_path(str(Path(path).expanduser()))


def resolve_artifact_path(artifact_path: str | Path | None = None) -> Path:
    """Resolve the precomputed artifact path or fail loudly."""
    candidates: list[Path] = []
    if artifact_path is not None:
        candidates.append(Path(artifact_path).expanduser())
    env_path = os.getenv("CURVATURE_ARTIFACT_PATH")
    if env_path:
        candidates.append(Path(env_path).expanduser())
    candidates.append(DEFAULT_ARTIFACT_PATH)

    for candidate in candidates:
        if candidate.is_file():
            return _validate_precomputed_artifact_path(candidate)

    tried = ", ".join(str(candidate) for candidate in candidates)
    raise FileNotFoundError(
        "Curvature discovery requires a precomputed artifact. "
        f"Tried {tried}. Provide --artifact, set CURVATURE_ARTIFACT_PATH, "
        f"or place the file at {DEFAULT_ARTIFACT_PATH}."
    )


def _coerce_float(value: Any, field_name: str) -> float:
    try:
        return float(value)
    except (TypeError, ValueError) as exc:
        raise ValueError(f"Invalid {field_name}: {value!r}") from exc


def _extract_coordinates(row: dict[str, Any]) -> tuple[float, float]:
    if isinstance(row.get("location"), dict):
        location = row["location"]
        if location.get("type") == "Point":
            coordinates = location.get("coordinates") or []
            if len(coordinates) >= 2:
                return _coerce_float(coordinates[1], "location.latitude"), _coerce_float(
                    coordinates[0],
                    "location.longitude",
                )

    lat_value = row.get("centroid_lat", row.get("lat"))
    lng_value = row.get("centroid_lng", row.get("lng"))
    if lat_value is None or lng_value is None:
        raise ValueError("Missing centroid_lat/centroid_lng or lat/lng")
    return _coerce_float(lat_value, "latitude"), _coerce_float(lng_value, "longitude")


def _extract_name(row: dict[str, Any]) -> str:
    for field_name in ("name", "route_name", "road_name"):
        value = row.get(field_name)
        if value and str(value).strip():
            return str(value).strip()
    raise ValueError("Missing route name")


def _extract_state(row: dict[str, Any]) -> str:
    value = row.get("state")
    if value and str(value).strip():
        return _normalize_state(str(value).strip())
    raise ValueError("Missing state")


def _extract_curvature_score(row: dict[str, Any]) -> float:
    for field_name in ("curvature_score", "score"):
        value = row.get(field_name)
        if value not in (None, ""):
            return _coerce_float(value, field_name)
    raise ValueError("Missing curvature_score/score")


def _load_existing_catalog_keys(
    catalog_path: str | Path | bool | None = None,
) -> set[tuple[str, str]]:
    if catalog_path is False:
        return set()

    path = Path(catalog_path).expanduser() if catalog_path is not None else DEFAULT_CATALOG_PATH
    if not path.is_file():
        raise FileNotFoundError(
            "Curvature discovery requires an existing catalog for exclusion. "
            f"Missing catalog at {path}. Pass existing_catalog_path=False to opt out explicitly."
        )

    keys: set[tuple[str, str]] = set()
    with path.open("r", encoding="utf-8") as handle:
        for line_number, line in enumerate(handle, start=1):
            stripped = line.strip()
            if not stripped:
                continue
            try:
                row = json.loads(stripped)
            except json.JSONDecodeError:
                logger.warning("Catalog row %d is invalid JSON; skipping", line_number)
                continue

            name = str(row.get("name", "")).strip()
            state = str(row.get("state", "")).strip()
            if name and state:
                keys.add(_canonical_key(name, state))

    return keys


def _route_from_row(row: dict[str, Any], artifact_path: Path) -> Route:
    name = _extract_name(row)
    state = _extract_state(row)
    curvature_score = _extract_curvature_score(row)
    centroid_lat, centroid_lng = _extract_coordinates(row)

    route = Route(
        route_id=f"{SOURCE_NAME}-{_slugify(name)}-{_slugify(state)}",
        source=SOURCE_NAME,
        name=name,
        state=state,
        centroid_lat=centroid_lat,
        centroid_lng=centroid_lng,
        length_miles=(
            _coerce_float(row["length_miles"], "length_miles")
            if row.get("length_miles") not in (None, "")
            else None
        ),
        location={
            "type": "Point",
            "coordinates": [centroid_lng, centroid_lat],
        },
    )
    route.curvature_score = curvature_score
    route.primary_archetype = PRIMARY_ARCHETYPE
    route.source_label = SOURCE_LABEL
    route.source_url = row.get("source_url") or row.get("url")
    artifact_ref = _artifact_provenance(artifact_path)["artifact_id"]
    route.source_refs = [ref for ref in (route.source_url, artifact_ref) if ref]
    route.candidate_identifiers = [name]
    route.search_text = (
        f"{name} ({state})\n"
        f"Hidden-gem {PRIMARY_ARCHETYPE} candidate discovered from precomputed curvature output."
    )
    return route


def _sorted_routes(routes: Iterable[Route]) -> list[Route]:
    return sorted(
        routes,
        key=lambda route: (
            -float(getattr(route, "curvature_score", 0.0)),
            *_canonical_key(route.name, route.state),
            route.route_id,
        ),
    )


def load_routes(
    artifact_path: str | Path | None = None,
    existing_catalog_path: str | Path | bool | None = None,
) -> list[Route]:
    """Load, normalize, and filter curvature candidates from the artifact."""
    resolved_artifact_path = resolve_artifact_path(artifact_path)
    existing_keys = _load_existing_catalog_keys(existing_catalog_path)
    routes: list[Route] = []

    with resolved_artifact_path.open("r", encoding="utf-8") as handle:
        for line_number, line in enumerate(handle, start=1):
            stripped = line.strip()
            if not stripped:
                continue

            try:
                row = json.loads(stripped)
            except json.JSONDecodeError as exc:
                raise ValueError(
                    f"Invalid JSON in curvature artifact {resolved_artifact_path} at line {line_number}"
                ) from exc
            route = _route_from_row(row, resolved_artifact_path)
            if _canonical_key(route.name, route.state) in existing_keys:
                continue
            routes.append(route)

    return _sorted_routes(routes)


def _serialize_route(route: Route) -> dict[str, Any]:
    payload = dataclasses.asdict(route)
    extras = {
        "curvature_score": getattr(route, "curvature_score", None),
        "primary_archetype": getattr(route, "primary_archetype", None),
    }
    for key, value in extras.items():
        if value not in (None, "", []):
            payload[key] = value
    return payload


def _build_audit(routes: list[Route], artifact_path: Path) -> dict[str, Any]:
    provenance = _artifact_provenance(artifact_path)
    return {
        "artifact_id": provenance["artifact_id"],
        "artifact_sha256": provenance["artifact_sha256"],
        "written": len(routes),
        "source": SOURCE_NAME,
        "primary_archetype": PRIMARY_ARCHETYPE,
        "status": "pass",
    }


def write_outputs(
    routes: list[Route],
    artifact_path: str | Path,
    output_path: str | Path = OUTPUT_PATH,
    progress_path: str | Path = PROGRESS_PATH,
    audit_path: str | Path = AUDIT_PATH,
) -> Path:
    """Write deterministic JSONL, progress, and audit outputs."""
    resolved_output_path = Path(output_path)
    resolved_progress_path = Path(progress_path)
    resolved_audit_path = Path(audit_path)
    resolved_artifact_path = _resolve_existing_precomputed_artifact_path(artifact_path)

    ordered_routes = _sorted_routes(routes)
    resolved_output_path.parent.mkdir(parents=True, exist_ok=True)

    with resolved_output_path.open("w", encoding="utf-8") as handle:
        for route in ordered_routes:
            handle.write(json.dumps(_serialize_route(route), sort_keys=True) + "\n")

    progress = [route.route_id for route in ordered_routes]
    resolved_progress_path.write_text(json.dumps(progress, indent=2) + "\n", encoding="utf-8")
    resolved_audit_path.write_text(
        json.dumps(_build_audit(ordered_routes, resolved_artifact_path), indent=2) + "\n",
        encoding="utf-8",
    )
    return resolved_output_path


def main(argv: Sequence[str] | None = None) -> Path:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--artifact",
        help="Path to precomputed adamfranco/curvature JSONL artifact",
    )
    args = parser.parse_args(argv)

    artifact_path = resolve_artifact_path(args.artifact)
    routes = load_routes(artifact_path=artifact_path)
    output_path = write_outputs(routes, artifact_path=artifact_path)
    logger.info("Curvature discovery: wrote %d routes to %s", len(routes), output_path)
    return output_path


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    print(main())
