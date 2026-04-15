"""Quality report generation for the curation pipeline.

Queries the state DB and writes a markdown report to:
    .spec/research/curation-hardening/artifacts/full-load-quality-report.md
"""

from __future__ import annotations

import json
import math
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

_REPO_ROOT = Path(__file__).resolve().parent.parent.parent.parent.parent
REPORT_PATH = (
    _REPO_ROOT
    / ".spec"
    / "research"
    / "curation-hardening"
    / "artifacts"
    / "full-load-quality-report.md"
)

SCORE_FIELDS = [
    "scenic_score", "technical_score", "traffic_score",
    "remoteness_score", "condition_score", "elevation_score",
    "designation_score", "community_score",
]

KEY_FIELDS = ["name", "state", "description", "length_miles", "source_url"]


def _pct(num: int, denom: int) -> str:
    if denom == 0:
        return "N/A"
    return f"{100.0 * num / denom:.1f}%"


def _mean(vals: list[float]) -> float:
    if not vals:
        return 0.0
    return sum(vals) / len(vals)


def _std(vals: list[float]) -> float:
    if len(vals) < 2:
        return 0.0
    m = _mean(vals)
    variance = sum((v - m) ** 2 for v in vals) / len(vals)
    return math.sqrt(variance)


def generate_quality_report(conn: sqlite3.Connection, output_path: Path = REPORT_PATH) -> str:
    """Generate the quality report and write to output_path.

    Returns the report as a string (also written to file).
    """
    output_path.parent.mkdir(parents=True, exist_ok=True)
    lines: list[str] = []
    now = datetime.now(timezone.utc).isoformat()

    lines.append("# Curation Full-Load Quality Report")
    lines.append(f"\n**Generated**: {now}")
    lines.append("")

    # -------------------------------------------------------------------------
    # Section 1: Summary
    # -------------------------------------------------------------------------
    lines.append("## 1. Summary")
    lines.append("")

    totals = conn.execute(
        """
        SELECT
            COUNT(*) AS total,
            SUM(CASE WHEN ingested_at IS NOT NULL THEN 1 ELSE 0 END) AS ingested,
            SUM(CASE WHEN extracted_at IS NOT NULL THEN 1 ELSE 0 END) AS extracted,
            SUM(CASE WHEN pushed_at IS NOT NULL THEN 1 ELSE 0 END) AS pushed,
            SUM(CASE WHEN embedded_at IS NOT NULL THEN 1 ELSE 0 END) AS embedded,
            SUM(COALESCE(extraction_cost_usd, 0.0)) AS total_cost
        FROM route_state
        """
    ).fetchone()

    source_rows = conn.execute(
        """
        SELECT source,
            COUNT(*) AS total,
            SUM(CASE WHEN ingested_at IS NOT NULL THEN 1 ELSE 0 END) AS ingested,
            SUM(CASE WHEN extracted_at IS NOT NULL THEN 1 ELSE 0 END) AS extracted,
            SUM(CASE WHEN pushed_at IS NOT NULL THEN 1 ELSE 0 END) AS pushed,
            SUM(CASE WHEN embedded_at IS NOT NULL THEN 1 ELSE 0 END) AS embedded,
            SUM(COALESCE(extraction_cost_usd, 0.0)) AS cost
        FROM route_state
        GROUP BY source
        ORDER BY source
        """
    ).fetchall()

    if totals:
        t = dict(totals)
        lines.append(f"- **Total routes ingested**: {t['ingested']:,}")
        lines.append(f"- **Extracted**: {t['extracted']:,} ({_pct(t['extracted'] or 0, t['ingested'] or 1)})")
        lines.append(f"- **Pushed to Convex**: {t['pushed']:,} ({_pct(t['pushed'] or 0, t['ingested'] or 1)})")
        lines.append(f"- **Embedded**: {t['embedded']:,} ({_pct(t['embedded'] or 0, t['pushed'] or 1)})")
        lines.append(f"- **Total extraction cost**: ${t['total_cost']:.4f}")
        lines.append("")

    lines.append("### Per-Source Counts")
    lines.append("")
    lines.append("| Source | Total | Ingested | Extracted | Pushed | Embedded | Cost |")
    lines.append("|--------|-------|----------|-----------|--------|----------|------|")
    for r in source_rows:
        row = dict(r)
        lines.append(
            f"| {row['source']} | {row['total']} | {row['ingested']} | "
            f"{row['extracted']} | {row['pushed']} | {row['embedded']} | ${row['cost']:.4f} |"
        )
    lines.append("")

    # -------------------------------------------------------------------------
    # Section 2: Null-field table
    # -------------------------------------------------------------------------
    lines.append("## 2. Null-Field Analysis")
    lines.append("")
    lines.append("Percentage of routes where key normalized fields are NULL.")
    lines.append("")
    lines.append("| Source | name% | state% | description% | length_miles% | source_url% |")
    lines.append("|--------|-------|--------|--------------|---------------|-------------|")

    all_sources = [r["source"] for r in source_rows]
    for src in all_sources:
        src_rows = conn.execute(
            "SELECT normalized_route_json FROM route_state WHERE source = ?",
            (src,),
        ).fetchall()

        field_null_counts = {f: 0 for f in KEY_FIELDS}
        total_src = len(src_rows)

        for db_row in src_rows:
            if not db_row["normalized_route_json"]:
                for f in KEY_FIELDS:
                    field_null_counts[f] += 1
                continue
            try:
                norm = json.loads(db_row["normalized_route_json"])
            except json.JSONDecodeError:
                continue

            for f in KEY_FIELDS:
                # Map field names to normalized dict keys
                key_map = {
                    "name": "name",
                    "state": "state",
                    "description": "description",
                    "length_miles": "length_miles",
                    "source_url": "source_url",
                }
                val = norm.get(key_map[f])
                if val is None or val == "":
                    field_null_counts[f] += 1

        row_pcts = [
            _pct(field_null_counts.get(f, 0), total_src) for f in KEY_FIELDS
        ]
        lines.append(f"| {src} | {' | '.join(row_pcts)} |")

    lines.append("")

    # -------------------------------------------------------------------------
    # Section 3: Score distributions
    # -------------------------------------------------------------------------
    lines.append("## 3. Score Distributions (Extracted Routes)")
    lines.append("")

    extracted_rows = conn.execute(
        "SELECT extraction_payload_json FROM route_state WHERE extracted_at IS NOT NULL AND extraction_payload_json IS NOT NULL"
    ).fetchall()

    score_buckets: dict[str, list[float]] = {f: [] for f in SCORE_FIELDS}
    for db_row in extracted_rows:
        try:
            attrs = json.loads(db_row["extraction_payload_json"])
        except (json.JSONDecodeError, TypeError):
            continue
        for sf in SCORE_FIELDS:
            val = attrs.get(sf)
            if val is not None:
                try:
                    score_buckets[sf].append(float(val))
                except (TypeError, ValueError):
                    pass

    lines.append("| Score Field | Count | Mean | Std | Min | Max |")
    lines.append("|-------------|-------|------|-----|-----|-----|")
    for sf in SCORE_FIELDS:
        vals = score_buckets[sf]
        if vals:
            mean_v = _mean(vals)
            std_v = _std(vals)
            min_v = min(vals)
            max_v = max(vals)
            lines.append(
                f"| {sf} | {len(vals)} | {mean_v:.3f} | {std_v:.3f} | {min_v:.3f} | {max_v:.3f} |"
            )
        else:
            lines.append(f"| {sf} | 0 | N/A | N/A | N/A | N/A |")
    lines.append("")

    # -------------------------------------------------------------------------
    # Section 4: Duplicate detection
    # -------------------------------------------------------------------------
    lines.append("## 4. Duplicate Detection")
    lines.append("")

    # Duplicate canonical_url
    dup_url = conn.execute(
        """
        SELECT canonical_url, COUNT(*) AS cnt
        FROM route_state
        WHERE canonical_url IS NOT NULL
        GROUP BY canonical_url
        HAVING cnt > 1
        ORDER BY cnt DESC
        LIMIT 20
        """
    ).fetchall()

    lines.append(f"### Duplicate canonical_url ({len(dup_url)} groups)")
    if dup_url:
        lines.append("")
        lines.append("| canonical_url | Count |")
        lines.append("|---------------|-------|")
        for r in dup_url[:10]:
            lines.append(f"| {r['canonical_url']} | {r['cnt']} |")
    else:
        lines.append("")
        lines.append("No duplicate canonical URLs found.")
    lines.append("")

    # Duplicate (route_name, state_primary)
    dup_name_state = conn.execute(
        """
        SELECT route_name, state_primary, COUNT(*) AS cnt
        FROM route_state
        WHERE route_name IS NOT NULL AND state_primary IS NOT NULL
        GROUP BY route_name, state_primary
        HAVING cnt > 1
        ORDER BY cnt DESC
        LIMIT 20
        """
    ).fetchall()

    lines.append(f"### Duplicate (name, state) pairs ({len(dup_name_state)} groups)")
    if dup_name_state:
        lines.append("")
        lines.append("| Name | State | Count |")
        lines.append("|------|-------|-------|")
        for r in dup_name_state[:10]:
            lines.append(f"| {r['route_name']} | {r['state_primary']} | {r['cnt']} |")
    else:
        lines.append("")
        lines.append("No duplicate (name, state) pairs found.")
    lines.append("")

    # -------------------------------------------------------------------------
    # Section 5: Errors
    # -------------------------------------------------------------------------
    lines.append("## 5. Error Breakdown")
    lines.append("")

    error_counts = conn.execute(
        """
        SELECT error_stage, COUNT(*) AS cnt
        FROM route_state
        WHERE error_stage IS NOT NULL
        GROUP BY error_stage
        ORDER BY cnt DESC
        """
    ).fetchall()

    if not error_counts:
        lines.append("No errors recorded.")
    else:
        lines.append("| Stage | Count |")
        lines.append("|-------|-------|")
        for r in error_counts:
            lines.append(f"| {r['error_stage']} | {r['cnt']} |")
        lines.append("")

        # Sample errors per stage
        for r in error_counts:
            stage = r["error_stage"]
            samples = conn.execute(
                "SELECT route_id, last_error FROM route_state WHERE error_stage = ? LIMIT 5",
                (stage,),
            ).fetchall()
            lines.append(f"### Sample errors: {stage}")
            lines.append("")
            for s in samples:
                err = (s["last_error"] or "")[:200].replace("\n", " ")
                lines.append(f"- `{s['route_id']}`: {err}")
            lines.append("")

    # -------------------------------------------------------------------------
    # Section 6: Cost ledger
    # -------------------------------------------------------------------------
    lines.append("## 6. Cost Ledger")
    lines.append("")

    run_rows = conn.execute(
        """
        SELECT stage, SUM(total_cost_usd) AS cost, COUNT(*) AS runs,
               SUM(routes_succeeded) AS succeeded
        FROM pipeline_runs
        GROUP BY stage
        ORDER BY stage
        """
    ).fetchall()

    if run_rows:
        lines.append("| Stage | Runs | Routes Succeeded | Total Cost |")
        lines.append("|-------|------|-----------------|------------|")
        for r in run_rows:
            lines.append(
                f"| {r['stage']} | {r['runs']} | {r['succeeded'] or 0} | ${r['cost'] or 0:.4f} |"
            )
    else:
        lines.append("No pipeline run records found.")
    lines.append("")

    report_text = "\n".join(lines)
    output_path.write_text(report_text)
    return report_text
