"""Quality floor filtering for curated routes (QUAL-003)."""

from __future__ import annotations

import argparse
import json
import logging
from pathlib import Path
from typing import Any

import requests

logger = logging.getLogger(__name__)


class FloorFilter:
    """Apply quality floor tiers to reconciled curated routes."""

    _GOVERNMENT_SOURCE_ALLOWLIST = {"FHWA", "Scenic Byways"}

    def __init__(
        self,
        *,
        base_url: str,
        deploy_key: str,
        report_output_path: Path | str = Path("scripts/curation/data/reports/quality_floor_report.json"),
        timeout_seconds: int = 30,
    ) -> None:
        self.base_url = base_url.rstrip("/")
        self.deploy_key = deploy_key
        self.timeout_seconds = timeout_seconds
        self.report_output_path = Path(report_output_path)

    def run(self, routes: list[dict[str, Any]] | None = None) -> dict[str, int]:
        """Compute and persist quality tier for each route."""
        reconciled_routes = routes if routes is not None else self._fetch_reconciled_routes()

        distribution = {"premium": 0, "standard": 0, "minimal": 0}
        for route in reconciled_routes:
            quality_tier = self._compute_tier(route)
            route_id = str(route.get("routeId") or route.get("route_id") or "")
            if not route_id:
                logger.warning("Skipping route without routeId: %s", route)
                continue

            route["qualityTier"] = quality_tier
            self._write_quality_tier_to_convex(route_id, quality_tier)
            distribution[quality_tier] += 1

        distribution["total"] = sum(distribution.values())
        self._log_distribution(distribution)
        return distribution

    def _compute_tier(self, route: dict[str, Any]) -> str:
        """Compute quality tier from field completeness and government allowlist."""
        description = route.get("description")
        description_present = isinstance(description, str) and len(description.strip()) > 100

        community_rating = self._first_present(route, "community_rating", "communityRating", "rating")
        community_rating_present = self._is_present(community_rating)

        designation = route.get("designation")
        designation_present = self._is_present(designation)

        curvature_score = self._first_present(route, "curvatureScore", "curvature_score")
        curvature_present = self._is_present(curvature_score)

        all_fields_present = all(
            [description_present, community_rating_present, designation_present, curvature_present]
        )
        any_field_present = any(
            [description_present, community_rating_present, designation_present, curvature_present]
        )

        if self._is_government_source(route):
            if all_fields_present:
                return "premium"
            return "standard"

        if all_fields_present:
            return "premium"
        if any_field_present:
            return "standard"
        return "minimal"

    def _is_government_source(self, route: dict[str, Any]) -> bool:
        """Return True when sourceRefs include an allowlisted government source."""
        source_refs = route.get("sourceRefs")
        if source_refs is None:
            source_refs = route.get("source_refs")

        if not isinstance(source_refs, list):
            return False

        for ref in source_refs:
            if isinstance(ref, str) and ref in self._GOVERNMENT_SOURCE_ALLOWLIST:
                return True
        return False

    def _log_distribution(self, distribution: dict[str, int]) -> None:
        """Persist tier distribution report."""
        self.report_output_path.parent.mkdir(parents=True, exist_ok=True)
        self.report_output_path.write_text(json.dumps(distribution, indent=2), encoding="utf-8")

    def _fetch_reconciled_routes(self) -> list[dict[str, Any]]:
        """Fetch reconciled curated routes from Convex."""
        url = f"{self.base_url}/api/run/curationAdmin:getReconciledRoutesPage"
        headers = {
            "Authorization": f"Bearer {self.deploy_key}",
            "Content-Type": "application/json",
        }

        routes: list[dict[str, Any]] = []
        cursor: str | None = None
        while True:
            payload: dict[str, Any] = {"args": {"cursor": cursor, "numItems": 1000}}
            response = requests.post(
                url,
                headers=headers,
                json=payload,
                timeout=self.timeout_seconds,
            )
            response.raise_for_status()
            body = response.json()
            value = body.get("value")

            if isinstance(value, list):
                routes.extend(item for item in value if isinstance(item, dict))
                break

            if isinstance(value, dict):
                page = value.get("page")
                if isinstance(page, list):
                    routes.extend(item for item in page if isinstance(item, dict))
                    is_done = bool(value.get("isDone", True))
                    next_cursor = value.get("continueCursor")
                    cursor = next_cursor if isinstance(next_cursor, str) else None
                    if is_done or cursor is None:
                        break
                    continue

                result = value.get("result")
                if isinstance(result, list):
                    routes.extend(item for item in result if isinstance(item, dict))
                break

            break

        return routes

    def _write_quality_tier_to_convex(self, route_id: str, quality_tier: str) -> None:
        """Persist qualityTier back to Convex for a route."""
        url = f"{self.base_url}/api/run/curationAdmin:setRouteQualityTier"
        headers = {
            "Authorization": f"Bearer {self.deploy_key}",
            "Content-Type": "application/json",
        }
        payload = {
            "args": {
                "routeId": route_id,
                "qualityTier": quality_tier,
            }
        }

        response = requests.post(
            url,
            headers=headers,
            json=payload,
            timeout=self.timeout_seconds,
        )
        response.raise_for_status()

    @staticmethod
    def _first_present(route: dict[str, Any], *keys: str) -> Any:
        for key in keys:
            if key in route:
                return route.get(key)
        return None

    @staticmethod
    def _is_present(value: Any) -> bool:
        if value is None:
            return False
        if isinstance(value, str):
            return bool(value.strip())
        if isinstance(value, bool):
            return value
        if isinstance(value, (int, float)):
            return value != 0
        return True


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run quality floor filtering")
    parser.add_argument("--base-url", required=True, help="Convex deployment URL")
    parser.add_argument("--deploy-key", required=True, help="Convex deploy key")
    parser.add_argument(
        "--report-output-path",
        default="scripts/curation/data/reports/quality_floor_report.json",
        help="Path to write quality floor distribution report",
    )
    parser.add_argument(
        "--timeout-seconds",
        type=int,
        default=30,
        help="HTTP timeout in seconds",
    )
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    logging.basicConfig(level=logging.INFO)
    args = parse_args(argv)

    floor_filter = FloorFilter(
        base_url=args.base_url,
        deploy_key=args.deploy_key,
        report_output_path=args.report_output_path,
        timeout_seconds=args.timeout_seconds,
    )
    distribution = floor_filter.run()
    logger.info("quality floor complete: %s", distribution)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
