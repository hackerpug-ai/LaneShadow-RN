"""Retroactive normalization of region-aggregator records in staging files.

INF-011 — reads a staging JSONL file, applies ``normalize_state_primary()`` to
any record whose ``state_primary`` is not a canonical US state, writes the
file back in place, and prints a summary report.

This is a one-shot script for closing out the MR/BBR region-aggregator
follow-up after BASE-009a/b Phase 5 runs.  Going forward, the parser's
post-extraction normalization pass (added to ``parse_with_selectors``) catches
these records during Phase 5 execution so the fix is transparent to new
source tasks (Epic 4, Epic 9).

Usage::

    python -m scripts.curation.pipeline.sources.crawl_plan.fix_regional \\
        --staging staging/motorcycleroads.jsonl

    python -m scripts.curation.pipeline.sources.crawl_plan.fix_regional \\
        --staging staging/bestbikingroads.jsonl --dry-run
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from .us_states import US_STATES, normalize_state_primary


def fix_staging(path: Path, dry_run: bool = False) -> dict[str, int]:
    """Apply region-aggregator normalization to *path* in place.

    Args:
        path: Staging JSONL file to normalize.
        dry_run: If True, do not write the file; just report counts.

    Returns:
        Dict with counters: total, non_state_before, fixed_by_prefix,
        fixed_by_states_all, still_non_state, non_state_after.
    """
    lines = path.read_text().splitlines()
    records = [json.loads(l) for l in lines if l.strip()]

    total = len(records)
    non_state_before = 0
    fixed_by_prefix = 0
    fixed_by_states_all = 0
    still_non_state = 0
    fixed_records: list[str] = []

    out_lines: list[str] = []
    for r in records:
        sp = r.get("state_primary")
        if sp in US_STATES or sp is None:
            out_lines.append(json.dumps(r, ensure_ascii=False))
            continue

        # Found a non-US state — try to normalize
        non_state_before += 1
        states_all = r.get("states_all") or []
        normalized = normalize_state_primary(sp, states_all)

        if normalized is None:
            still_non_state += 1
            out_lines.append(json.dumps(r, ensure_ascii=False))
            continue

        # Classify the fix path
        if len(sp) >= 3 and sp[2] == "-" and normalized == _prefix_slug(sp[:2]):
            fixed_by_prefix += 1
            fix_reason = f"prefix '{sp[:2]}'"
        else:
            fixed_by_states_all += 1
            fix_reason = "states_all"

        # Update the record
        r["state_primary"] = normalized
        normalized_title = normalized.replace("-", " ").title()
        # Put the canonical state first in states_all
        if normalized_title not in states_all:
            r["states_all"] = [normalized_title] + list(states_all)

        fixed_records.append(
            f"  {(r.get('route_name') or r.get('name') or '???')[:55]}  "
            f"{sp} -> {normalized} (via {fix_reason})"
        )
        out_lines.append(json.dumps(r, ensure_ascii=False))

    non_state_after = still_non_state

    if not dry_run:
        path.write_text("\n".join(out_lines) + "\n")

    return {
        "total": total,
        "non_state_before": non_state_before,
        "fixed_by_prefix": fixed_by_prefix,
        "fixed_by_states_all": fixed_by_states_all,
        "still_non_state": still_non_state,
        "non_state_after": non_state_after,
        "sample_fixes": fixed_records[:10],
    }


def _prefix_slug(prefix: str) -> str | None:
    """Local helper: map a 2-letter USPS prefix to a canonical slug.

    Used by fix_staging() to classify the fix path for reporting.
    """
    from .us_states import _USPS_TO_SLUG
    return _USPS_TO_SLUG.get(prefix.lower())


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Apply region-aggregator normalization to a staging JSONL file in place"
    )
    parser.add_argument("--staging", required=True, help="Path to staging JSONL file")
    parser.add_argument("--dry-run", action="store_true", help="Report without writing")
    args = parser.parse_args()

    path = Path(args.staging)
    if not path.exists():
        print(f"ERROR: {path} does not exist", file=sys.stderr)
        return 1

    print(f"Normalizing {path}")
    result = fix_staging(path, dry_run=args.dry_run)

    print(f"  total records: {result['total']}")
    print(f"  non-US-state before: {result['non_state_before']}")
    print(f"  fixed via USPS prefix: {result['fixed_by_prefix']}")
    print(f"  fixed via states_all fallback: {result['fixed_by_states_all']}")
    print(f"  still non-US-state after: {result['still_non_state']}")
    print(f"  non-US-state rate: {result['non_state_after']}/{result['total']} = {result['non_state_after']/result['total']*100:.2f}%")
    if result["sample_fixes"]:
        print("  sample fixes:")
        for s in result["sample_fixes"]:
            print(s)
    if args.dry_run:
        print("  (DRY RUN — file not written)")

    return 0


if __name__ == "__main__":
    sys.exit(main())
