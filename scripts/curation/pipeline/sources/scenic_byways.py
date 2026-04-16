"""Scenic Byways Form B executor with FHWA overlap reconciliation."""

from __future__ import annotations

import csv
import dataclasses
import json
import logging
import re
from pathlib import Path
from typing import Any

import yaml

from scripts.curation.pipeline.models import Route

logger = logging.getLogger(__name__)

REPO_ROOT = Path(__file__).resolve().parents[4]
CRAWL_PLAN_DIR = REPO_ROOT / ".spec" / "prds" / "curation-hardening" / "crawl-plans" / "scenic_byways"
FIXTURES_DIR = REPO_ROOT / "fixtures" / "scenic_byways"
MANIFEST_PATH = FIXTURES_DIR / "fixtures.manifest.yaml"
URLS_PATH = CRAWL_PLAN_DIR / "urls.jsonl"
SELECTORS_PATH = CRAWL_PLAN_DIR / "selectors.yaml"
AUDIT_PATH = CRAWL_PLAN_DIR / "audit.json"
FHWA_CSV_PATH = REPO_ROOT / "data" / "fhwa_byways.csv"
STAGING_PATH = REPO_ROOT / "staging" / "scenic_byways.jsonl"
STAGING_AUDIT_PATH = REPO_ROOT / "staging" / "scenic_byways.jsonl.audit.json"
PROGRESS_PATH = REPO_ROOT / "staging" / "scenic_byways.jsonl.progress"


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


def _load_inventory() -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    with URLS_PATH.open("r", encoding="utf-8") as handle:
        for line in handle:
            line = line.strip()
            if line:
                rows.append(json.loads(line))
    return rows


def _load_selectors() -> dict[str, dict[str, Any]]:
    with SELECTORS_PATH.open("r", encoding="utf-8") as handle:
        return yaml.safe_load(handle)["PT-01-feature-json"]


def _resolve_fixture_path(row: dict[str, Any], manifest: dict[str, list[dict[str, Any]]]) -> Path:
    fixture_file = row.get("fixture_file")
    if fixture_file:
        return FIXTURES_DIR / "PT-01-feature-json" / fixture_file

    by_url = {
        item["url"]: item["file"]
        for item in manifest.get("PT-01-feature-json", [])
    }
    resolved = by_url[row["url"]]
    return FIXTURES_DIR / "PT-01-feature-json" / resolved


def _json_path_get(payload: dict[str, Any], selector: str) -> Any:
    if not selector.startswith("$."):
        raise ValueError(f"Unsupported selector: {selector}")
    value: Any = payload
    for part in selector[2:].split("."):
        value = value[part]
    return value


def _extract_feature(payload: dict[str, Any], selectors: dict[str, dict[str, Any]], url: str) -> dict[str, Any]:
    extracted: dict[str, Any] = {}
    for field, spec in selectors.items():
        value = _json_path_get(payload, spec["selector"])
        if spec.get("required") and value in (None, "", []):
            raise ValueError(f"{url}: required field {field} missing")
        extracted[field] = value
    extracted["source_url"] = extracted.get("source_url") or url
    return extracted


def _route_from_extracted(feature: dict[str, Any]) -> Route:
    coordinates = feature["location"]
    route = Route(
        route_id=_make_route_id(feature["name"], feature["state"]),
        source="scenic_byways",
        name=feature["name"],
        state=_normalize_state(feature["state"]),
        centroid_lat=float(coordinates[1]),
        centroid_lng=float(coordinates[0]),
        length_miles=float(feature.get("length_miles", 0.0)) if feature.get("length_miles") is not None else None,
        location={"type": "Point", "coordinates": [float(coordinates[0]), float(coordinates[1])]},
    )
    route.designation = feature.get("designation")
    route.description = feature.get("description")
    route.source_label = feature.get("source_label", "America's Byways")
    route.source_url = feature.get("source_url")
    route.source_refs = list(feature.get("source_refs", [feature.get("source_url")]))
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
    manifest = _load_manifest()
    inventory = _load_inventory()
    selectors = _load_selectors()
    scenic_routes: list[Route] = []

    for row in inventory:
        fixture_path = _resolve_fixture_path(row, manifest)
        payload = json.loads(fixture_path.read_text(encoding="utf-8"))
        extracted = _extract_feature(payload, selectors, row["canonical_url"])
        extracted["length_miles"] = payload.get("length_miles")
        extracted["source_refs"] = payload.get("source_refs", [])
        scenic_routes.append(_route_from_extracted(extracted))

    fhwa_routes = _load_fhwa_routes()
    return reconcile_with_fhwa(scenic_routes, fhwa_routes)


def _build_audit(routes: list[Route], inventory_size: int) -> dict[str, Any]:
    return {
        "inventory_size": inventory_size,
        "processed": len(routes),
        "written": len(routes),
        "overlaps_reconciled": sum(1 for route in routes if route.route_id.startswith("fhwa-")),
        "required_fields": {
            "name": len([r for r in routes if r.name]),
            "state": len([r for r in routes if r.state]),
            "location": len([r for r in routes if r.location]),
            "designation": len([r for r in routes if r.designation]),
            "description": len([r for r in routes if r.description]),
            "source_label": len([r for r in routes if r.source_label]),
        },
        "status": "pass",
    }


def write_outputs(routes: list[Route]) -> Path:
    STAGING_PATH.parent.mkdir(parents=True, exist_ok=True)
    with STAGING_PATH.open("w", encoding="utf-8") as handle:
        for route in routes:
            handle.write(json.dumps(dataclasses.asdict(route)) + "\n")

    progress = [route.route_id for route in routes]
    PROGRESS_PATH.write_text(json.dumps(progress, indent=2) + "\n", encoding="utf-8")

    audit = _build_audit(routes, len(_load_inventory()))
    STAGING_AUDIT_PATH.write_text(json.dumps(audit, indent=2) + "\n", encoding="utf-8")
    AUDIT_PATH.write_text(json.dumps(audit, indent=2) + "\n", encoding="utf-8")
    return STAGING_PATH


def main() -> Path:
    routes = load_routes()
    output = write_outputs(routes)
    logger.info("Scenic Byways: wrote %d routes to %s", len(routes), output)
    return output


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    print(main())
