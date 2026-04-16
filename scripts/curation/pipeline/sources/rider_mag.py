"""Rider Magazine 50 Best Roads offline executor and parser."""

from __future__ import annotations

import dataclasses
import json
import logging
import re
from pathlib import Path
from typing import Any

import yaml
from bs4 import BeautifulSoup, Tag

from scripts.curation.pipeline.models import Route

logger = logging.getLogger(__name__)

REPO_ROOT = Path(__file__).resolve().parents[4]
CRAWL_PLAN_DIR = REPO_ROOT / ".spec" / "prds" / "curation-hardening" / "crawl-plans" / "rider_mag"
FIXTURES_DIR = REPO_ROOT / "fixtures" / "rider_mag"
MANIFEST_PATH = FIXTURES_DIR / "fixtures.manifest.yaml"
SOURCE_ARTICLE_PATH = FIXTURES_DIR / "source_article.html"
URLS_PATH = CRAWL_PLAN_DIR / "urls.jsonl"
SELECTORS_PATH = CRAWL_PLAN_DIR / "selectors.yaml"
OUTPUT_PATH = REPO_ROOT / "staging" / "rider_mag.jsonl"
PROGRESS_PATH = REPO_ROOT / "staging" / "rider_mag.jsonl.progress"
AUDIT_PATH = REPO_ROOT / "staging" / "rider_mag.jsonl.audit.json"
EVIDENCE_DIR = REPO_ROOT / ".tmp" / "SRC-006"
EVIDENCE_AUDIT_PATH = EVIDENCE_DIR / "rider_mag_audit.json"

SOURCE_LABEL = "Rider Magazine"
SOURCE_COLLECTION = "Rider Magazine 50 Best Motorcycle Roads in America"
SOURCE_ORDERING_NOTE = (
    "The roads are listed more or less alphabetically by state rather than in rank order."
)
SOURCE_RANK_KIND = "alphabetical_by_state_order"
GROUND_TRUTH_SOURCE = "rider_magazine_50_best"
GROUND_TRUTH_PROVIDER = "rider_mag"
ARTICLE_TITLE = "50 Best Motorcycle Roads in America"

HEADING_RE = re.compile(
    r"^(?P<source_rank>\d+)\.\s*(?P<route_name>.+?)\s*"
    r"\((?P<state_text>.+?)\s*/\s*(?P<distance_miles>[\d,]+)\s*miles\):?$"
)


def _slugify(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")


def _normalize_state_text(state_text: str) -> str:
    return " / ".join(part.strip() for part in state_text.split(",") if part.strip())


def _load_manifest() -> dict[str, Any]:
    with MANIFEST_PATH.open("r", encoding="utf-8") as handle:
        return yaml.safe_load(handle)


def _load_selectors() -> dict[str, Any]:
    with SELECTORS_PATH.open("r", encoding="utf-8") as handle:
        return yaml.safe_load(handle)["PT-01-route-section"]


def _load_inventory() -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    with URLS_PATH.open("r", encoding="utf-8") as handle:
        for line in handle:
            line = line.strip()
            if line:
                rows.append(json.loads(line))
    return rows


def _load_source_article() -> str:
    return SOURCE_ARTICLE_PATH.read_text(encoding="utf-8")


def parse_route_section_html(section_html: str, article_url: str) -> dict[str, Any]:
    soup = BeautifulSoup(section_html, "html.parser")
    heading = soup.select_one("h2")
    if heading is None:
        raise ValueError("Route section is missing heading")

    heading_text = heading.get_text(" ", strip=True)
    match = HEADING_RE.match(heading_text)
    if match is None:
        raise ValueError(f"Unparseable Rider heading: {heading_text}")

    description_node = None
    related_node = soup.select_one("p.has-text-align-center a")

    for paragraph in soup.select("p"):
        text = paragraph.get_text(" ", strip=True)
        if text and not text.startswith("Related:"):
            description_node = paragraph
            break

    if description_node is None:
        raise ValueError(f"Missing description for {heading_text}")
    if related_node is None or not related_node.get("href"):
        raise ValueError(f"Missing related link for {heading_text}")

    state_text = match.group("state_text").strip()
    source_rank = int(match.group("source_rank"))
    route_name = match.group("route_name").strip()
    states_all = [part.strip() for part in state_text.split(",") if part.strip()]
    route_id = f"rider-mag-{source_rank:02d}-{_slugify(route_name)}"
    fragment = f"rider-mag-route-{source_rank:02d}-{_slugify(route_name)}"

    return {
        "route_id": route_id,
        "route_name": route_name,
        "heading_text": heading_text,
        "state_text": state_text,
        "state": _normalize_state_text(state_text),
        "states_all": states_all,
        "distance_miles": int(match.group("distance_miles").replace(",", "")),
        "description": description_node.get_text(" ", strip=True),
        "related_title": related_node.get_text(" ", strip=True),
        "related_url": related_node["href"],
        "source_url": f"{article_url}#{fragment}",
        "canonical_source_url": article_url,
        "fragment": fragment,
        "source_rank": source_rank,
        "source_rank_kind": SOURCE_RANK_KIND,
        "editorial_rank": source_rank,
        "ground_truth": True,
        "ground_truth_source": GROUND_TRUTH_SOURCE,
        "ground_truth_provider": GROUND_TRUTH_PROVIDER,
        "ground_truth_notes": SOURCE_ORDERING_NOTE,
        "source_collection": SOURCE_COLLECTION,
        "source_collection_title": ARTICLE_TITLE,
        "source_label": SOURCE_LABEL,
        "designation": SOURCE_COLLECTION,
        "source_refs": [article_url, related_node["href"]],
    }


def parse_source_article(html: str) -> list[dict[str, Any]]:
    soup = BeautifulSoup(html, "html.parser")
    article_url = _load_manifest()["source_article"]["url"]
    sections: list[dict[str, Any]] = []

    for heading in soup.select("h2"):
        heading_text = heading.get_text(" ", strip=True)
        if not heading_text or not heading_text[0].isdigit() or ". " not in heading_text:
            continue

        section_nodes: list[Tag] = [heading]
        sibling = heading.next_sibling
        while sibling:
            if isinstance(sibling, Tag):
                if sibling.name == "h2":
                    break
                section_nodes.append(sibling)
            sibling = sibling.next_sibling

        section_html = "\n".join(str(node) for node in section_nodes)
        sections.append(parse_route_section_html(section_html, article_url))

    return sections


def _route_from_section(section: dict[str, Any]) -> Route:
    route = Route(
        route_id=section["route_id"],
        name=section["route_name"],
        state=section["state"],
        source="editorial",
        centroid_lat=0.0,
        centroid_lng=0.0,
        length_miles=float(section["distance_miles"]),
    )
    route.description = section["description"]
    route.designation = section["designation"]
    route.source_label = section["source_label"]
    route.source_url = section["source_url"]
    route.source_refs = list(section["source_refs"])
    route.candidate_identifiers = [section["route_name"], *section["states_all"]]
    route.search_text = (
        f"{section['route_name']} ({section['state']})\n"
        f"{section['description']}\n"
        f"Related: {section['related_title']}"
    )
    route.ground_truth = True
    route.ground_truth_source = section["ground_truth_source"]
    route.ground_truth_provider = section["ground_truth_provider"]
    route.editorial_rank = section["editorial_rank"]
    route.source_rank = section["source_rank"]
    route.source_rank_kind = section["source_rank_kind"]
    route.source_collection = section["source_collection"]
    route.source_collection_title = section["source_collection_title"]
    route.ground_truth_notes = section["ground_truth_notes"]
    route.related_article_url = section["related_url"]
    route.related_article_title = section["related_title"]
    route.state_raw = section["state_text"]
    route.states_all = list(section["states_all"])
    return route


def _serialize_route(route: Route) -> dict[str, Any]:
    payload = dataclasses.asdict(route)
    extras = {
        "ground_truth": getattr(route, "ground_truth", None),
        "ground_truth_source": getattr(route, "ground_truth_source", None),
        "ground_truth_provider": getattr(route, "ground_truth_provider", None),
        "editorial_rank": getattr(route, "editorial_rank", None),
        "source_rank": getattr(route, "source_rank", None),
        "source_rank_kind": getattr(route, "source_rank_kind", None),
        "source_collection": getattr(route, "source_collection", None),
        "source_collection_title": getattr(route, "source_collection_title", None),
        "ground_truth_notes": getattr(route, "ground_truth_notes", None),
        "related_article_url": getattr(route, "related_article_url", None),
        "related_article_title": getattr(route, "related_article_title", None),
        "state_raw": getattr(route, "state_raw", None),
        "states_all": getattr(route, "states_all", None),
    }
    for key, value in extras.items():
        if value not in (None, "", []):
            payload[key] = value
    return payload


def load_routes() -> list[Route]:
    sections = parse_source_article(_load_source_article())
    inventory = _load_inventory()
    selectors = _load_selectors()

    if len(sections) != 50:
        raise ValueError(f"Expected exactly 50 Rider routes, found {len(sections)}")
    if len(inventory) != 50:
        raise ValueError(f"Inventory must contain exactly 50 routes, found {len(inventory)}")

    section_by_rank = {section["source_rank"]: section for section in sections}
    inventory_ranks = {row["source_rank"] for row in inventory}
    if inventory_ranks != set(section_by_rank):
        raise ValueError("Inventory ranks do not match parsed article ranks")

    required_selector_fields = [name for name, spec in selectors.items() if spec["required"]]
    routes: list[Route] = []

    for row in inventory:
        section = section_by_rank[row["source_rank"]]
        for field in required_selector_fields:
            if section.get(field) in (None, "", []):
                raise ValueError(f"Rank {row['source_rank']}: missing required field {field}")
        routes.append(_route_from_section(section))

    routes.sort(key=lambda route: getattr(route, "editorial_rank"))
    return routes


def _build_audit(routes: list[Route]) -> dict[str, Any]:
    return {
        "inventory_size": 50,
        "written": len(routes),
        "required_fields": {
            "name": len([route for route in routes if route.name]),
            "state": len([route for route in routes if route.state]),
            "description": len([route for route in routes if route.description]),
            "source_label": len([route for route in routes if route.source_label]),
            "source_rank": len([route for route in routes if getattr(route, "source_rank", None)]),
            "ground_truth": len([route for route in routes if getattr(route, "ground_truth", False)]),
        },
        "source_rank_kind": SOURCE_RANK_KIND,
        "ground_truth_source": GROUND_TRUTH_SOURCE,
        "ordering_note": SOURCE_ORDERING_NOTE,
        "status": "pass",
    }


def write_outputs(routes: list[Route]) -> Path:
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    EVIDENCE_DIR.mkdir(parents=True, exist_ok=True)

    with OUTPUT_PATH.open("w", encoding="utf-8") as handle:
        for route in routes:
            handle.write(json.dumps(_serialize_route(route), ensure_ascii=False) + "\n")

    progress = [route.route_id for route in routes]
    PROGRESS_PATH.write_text(json.dumps(progress, indent=2) + "\n", encoding="utf-8")

    audit = _build_audit(routes)
    AUDIT_PATH.write_text(json.dumps(audit, indent=2) + "\n", encoding="utf-8")
    EVIDENCE_AUDIT_PATH.write_text(json.dumps(audit, indent=2) + "\n", encoding="utf-8")
    return OUTPUT_PATH


def main() -> Path:
    routes = load_routes()
    output = write_outputs(routes)
    logger.info("Rider Magazine: wrote %d routes to %s", len(routes), output)
    return output


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    print(main())
