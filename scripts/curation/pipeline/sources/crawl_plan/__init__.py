"""Crawl Plan Protocol framework module.

Public API for the shared crawl-plan framework used by all data-source tasks
(BASE-009a MotorcycleRoads, BASE-009b BestBikingRoads, Epic 4 SRC-001/006,
Epic 9 RID-001/002/006, and any future Form B/C/D sources).

**Framework design contract:**
- No source-specific code (no MR/BBR hardcoding) lives in this package.
- All source-specific logic is in caller adapters (fetch_fn, link_extractor,
  parse_fn, patterns, selector maps).
- The ``canonicalize()`` function preserves path case (lowercase scheme+host
  only) — framework-wide rule due to BBR mixed-case slugs like ``Columbia-2``.
- All records carry ``state_primary`` + ``states_all`` (list) — framework-wide
  multi-state schema rule.

Phases delivered:
- Phase 1: ``inventory`` — InventoryRow, canonicalize, classify, discover
- Phase 3: ``selectors`` — SelectorMap, load_selectors (stub in Phase 1)
- Phase 3+5: ``parser`` — parse_with_selectors, SchemaViolation
- Phase 5: ``executor`` — run_crawl, AuditCounters (stub in Phase 1)
"""

from .executor import AuditCounters, run_crawl
from .inventory import InventoryRow, canonicalize, classify, discover
from .parser import SchemaViolation, parse_with_selectors
from .selector_map import SelectorMap, load_selectors

# Expose selector_map as the `selectors` submodule so callers can do:
#   from scripts.curation.pipeline.sources.crawl_plan import selectors
# Note: we renamed selectors.py → selector_map.py to avoid shadowing the
# Python stdlib `selectors` module (which asyncio depends on).
from . import selector_map as selectors

__all__ = [
    # inventory
    "InventoryRow",
    "canonicalize",
    "classify",
    "discover",
    # selectors
    "SelectorMap",
    "load_selectors",
    # parser
    "parse_with_selectors",
    "SchemaViolation",
    # executor
    "run_crawl",
    "AuditCounters",
]
