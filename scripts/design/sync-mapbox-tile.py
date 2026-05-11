#!/usr/bin/env python3
"""
Sync the canonical mapbox paper tile (BLOCK A from
.spec/design/system/views/_mapbox-paper-tile.svg.html) into every consuming
view's `<svg class="view-{name}__map-svg" ...>...</svg>` block.

Preserves any inner content tagged with the marker comment
`<!-- view-overlay -->` or any element that uses --wx-* tokens
(weather overlays like rain slashes) by re-appending them after the
canonical content.

Usage:  python3 scripts/design/sync-mapbox-tile.py [--dry-run]
"""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
VIEWS_DIR = ROOT / ".spec" / "design" / "system" / "views"
PARTIAL = VIEWS_DIR / "_mapbox-paper-tile.svg.html"

VIEW_FILES = [
    "idle-screen/idle-screen.html",
    "planning-screen/planning-screen.html",
    "route-results-screen/route-results-screen.html",
    "route-details-screen/route-details-screen.html",
    "sessions-screen/sessions-screen.html",
    "error-screen/error-screen.html",
    "auth-screen/auth-screen.html",
]

# Match a view-{name}__map-svg block and capture (open_tag, inner, close_tag)
BLOCK_RE = re.compile(
    r'(<svg class="view-[a-z-]+__map-svg"[^>]*>)(.*?)(</svg>)',
    re.DOTALL,
)

# Detect a <g> group that uses any --wx-* token (weather overlay, e.g. rain
# slashes layered on top of the substrate map). We preserve these as
# story-specific decoration after the canonical content.
WX_GROUP_RE = re.compile(
    r'<g[^>]*(?:stroke|fill)\s*=\s*"[^"]*--wx-[^"]*"[^>]*>.*?</g>',
    re.DOTALL,
)


def extract_canonical_block(partial_path: Path) -> str:
    """Pull BLOCK A inner contents from the canonical partial."""
    src = partial_path.read_text()
    # BLOCK A starts at "<!-- mapbox-paper-tile · regenerate ... -->"
    # and ends just before "<!-- ──── END BLOCK A"
    start_marker = "<!-- mapbox-paper-tile · regenerate from _mapbox-paper-tile.svg.html -->"
    end_marker_re = re.compile(r"<!--\s*[─-]+\s*\n\s*END BLOCK A", re.MULTILINE)
    start = src.find(start_marker)
    if start < 0:
        raise RuntimeError(f"Could not find start marker in {partial_path}")
    end_m = end_marker_re.search(src, start)
    if end_m is None:
        raise RuntimeError(f"Could not find END BLOCK A marker in {partial_path}")
    block = src[start:end_m.start()].rstrip()
    return block


def rewrite_view(path: Path, canonical: str, dry_run: bool) -> tuple[int, int]:
    """Rewrite all map-svg blocks in a single view file. Returns (replaced, preserved)."""
    src = path.read_text()
    replaced = 0
    preserved = 0

    def repl(match: re.Match) -> str:
        nonlocal replaced, preserved
        open_tag, inner, close_tag = match.group(1), match.group(2), match.group(3)
        # Detect any --wx-* groups in the existing inner content; preserve them
        wx_groups = WX_GROUP_RE.findall(inner)
        preserved_block = ""
        if wx_groups:
            preserved += len(wx_groups)
            preserved_block = (
                "\n        <!-- preserved weather overlay (story-specific) -->\n        "
                + "\n        ".join(g.strip() for g in wx_groups)
                + "\n      "
            )
        replaced += 1
        # Indent the canonical content to 8 spaces (consistent with existing format)
        indented = "\n".join(
            ("        " + line) if line.strip() else line
            for line in canonical.splitlines()
        )
        return f"{open_tag}\n{indented}{preserved_block}\n      {close_tag}"

    new_src = BLOCK_RE.sub(repl, src)

    if not dry_run and new_src != src:
        path.write_text(new_src)
    return replaced, preserved


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true", help="report only; no writes")
    args = ap.parse_args()

    canonical = extract_canonical_block(PARTIAL)
    if not canonical.startswith("<!-- mapbox-paper-tile"):
        print("ERROR: canonical block does not start with expected marker", file=sys.stderr)
        return 1
    print(f"Canonical block: {len(canonical)} chars, "
          f"{canonical.count(chr(10))} lines")

    total_replaced = 0
    total_preserved = 0
    for rel in VIEW_FILES:
        path = VIEWS_DIR / rel
        if not path.exists():
            print(f"  SKIP {rel} (not found)")
            continue
        r, p = rewrite_view(path, canonical, args.dry_run)
        prefix = "[dry-run]" if args.dry_run else "[wrote]"
        print(f"  {prefix} {rel}  replaced={r}  weather-overlays-preserved={p}")
        total_replaced += r
        total_preserved += p

    print(f"\nTotal: {total_replaced} blocks replaced, "
          f"{total_preserved} weather overlays preserved.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
