"""Scenic Byways fixture-backed ingest with FHWA overlap reconciliation.

The task scope for SRC-001 is to ship the ingest/reconciliation contract and
the committed crawl-plan artifacts. The module consumes committed offline
fixtures so tests stay deterministic and the staging output is reproducible.
"""

from __future__ import annotations

import dataclasses
import csv
import json
import logging
import re
from pathlib import Path
from typing import Any

import yaml

from scripts.curation.pipeline.models import Route

logger = logging.getLogger(__name__)

REPO_ROOT = Path(__file__).resolve().parents[4]
FIXTURES_DIR = REPO_ROOT / "fixtures" / "scenic_byways"
MANIFEST_PATH = FIXTURES_DIR / "fixtures.manifest.yaml"
FHWA_CSV_PATH = REPO_ROOT / "data" / "fhwa_byways.csv"
STAGING_PATH = REPO_ROOT / "staging" / "scenic_byways.jsonl"


def _slugify(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")


def _normalize_state(value: str) -> str:
    return " / ".join(part.strip() for part in value.split("/") if part.strip())


def _canonical_key(name: str, state: str) -> tuple[str, str]:
    return (_slugify(name), _slugify(_normalize_state(state)))


def _make_route_id(name: str, state: str) -> str:
    return f"scenic-byways-{_slugify(name)}-{_slugify(state)}"


def _load_manifest() -> dict[str, list[dict[str, Any]]]:
    with MANIFEST_PATH.open("r", encoding="utf-8") as handle:
        return yaml.safe_load(handle)


def _load_feature_records() -> list[dict[str, Any]]:
    manifest = _load_manifest()
    records: list[dict[str, Any]] = []

    for item in manifest.get("PT-01-feature-json", []):
        fixture_path = FIXTURES_DIR / "PT-01-feature-json" / item["file"]
        with fixture_path.open("r", encoding="utf-8") as handle:
            record = json.load(handle)
        record["_manifest"] = item
        records.append(record)

    return records


def _route_from_feature(feature: dict[str, Any]) -> Route:
    coordinates = feature["location"]["coordinates"]
    route = Route(
        route_id=_make_route_id(feature["name"], feature["state"]),
        source="scenic_byways",
        name=feature["name"],
        state=_normalize_state(feature["state"]),
        centroid_lat=float(coordinates[1]),
        centroid_lng=float(coordinates[0]),
        length_miles=float(feature["length_miles"]),
        location=feature["location"],
    )
    route.designation = feature.get("designation")
    route.description = feature.get("description")
    route.source_label = feature.get("source_label", "America's Byways")
    route.source_url = feature.get("source_url")
    route.source_refs = list(feature.get("source_refs", []))
    return route


def _load_fhwa_routes() -> list[Route]:
    routes: list[Route] = []
    with FHWA_CSV_PATH.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        for row in reader:
            name = (row.get("RouteName") or "").strip()
            state = (row.get("State") or "").strip()
            lat = row.get("CentroidLat")
            lng = row.get("CentroidLng")
            if not name or not state or not lat or not lng:
                continue
            routes.append(
                Route(
                    route_id=f"fhwa-{_slugify(name)}-{_slugify(state)}",
                    source="fhwa",
                    name=name,
                    state=state,
                    centroid_lat=float(lat),
                    centroid_lng=float(lng),
                    length_miles=float(row["LengthMiles"]) if row.get("LengthMiles") else None,
                )
            )
    return routes


def _build_fhwa_index(routes: list[Route]) -> dict[tuple[str, str], Route]:
    return {_canonical_key(route.name, route.state): route for route in routes}


def reconcile_with_fhwa(
    scenic_routes: list[Route],
    fhwa_routes: list[Route],
) -> list[Route]:
    """Reuse the FHWA route_id on stable name+state overlap.

    That makes Scenic Byways an upsert-style fidelity upgrade instead of a
    duplicate insert source.
    """

    fhwa_index = _build_fhwa_index(fhwa_routes)
    reconciled: list[Route] = []

    for route in scenic_routes:
        overlap = fhwa_index.get(_canonical_key(route.name, route.state))
        if overlap:
            route.route_id = overlap.route_id
            if route.length_miles is None:
                route.length_miles = overlap.length_miles
        reconciled.append(route)

    reconciled.sort(key=lambda item: item.route_id)
    return reconciled


def load_routes() -> list[Route]:
    scenic_routes = [_route_from_feature(feature) for feature in _load_feature_records()]
    fhwa_routes = _load_fhwa_routes()
    return reconcile_with_fhwa(scenic_routes, fhwa_routes)


def write_staging(routes: list[Route], path: Path = STAGING_PATH) -> Path:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as handle:
        for route in routes:
            handle.write(json.dumps(dataclasses.asdict(route)) + "\n")
    return path


def main() -> Path:
    routes = load_routes()
    output = write_staging(routes)
    logger.info("Scenic Byways: wrote %d routes to %s", len(routes), output)
    return output


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    print(main())
