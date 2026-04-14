---
stability: FEATURE_SPEC
last_validated: 2026-04-14
prd_version: 1.0.0
---

# Functional Groups

Four functional groups cover the Phase 0.5 scope. Each maps to one use-case file.

## WSRC — Waypoint Sourcing

**Concern**: how candidate waypoints enter the pipeline from external sources.

**Use case file**: [`04-uc-wsrc.md`](./04-uc-wsrc.md)

**Use cases**:
- UC-WSRC-01 — Ingest Overture Maps Places (bulk, monthly)
- UC-WSRC-02 — Ingest HMDB historical markers
- UC-WSRC-03 — Ingest National Register of Historic Places
- UC-WSRC-04 — Ingest USGS GNIS geographic features
- UC-WSRC-05 — Ingest NPS / USDA / FHWA overlook and scenic byway feeds
- UC-WSRC-06 — Extract OSM tourism/historic/amenity tags (reuses existing Overpass integration)
- UC-WSRC-07 — Consume rider-forum NLP waypoint emissions (from UC-RIDER-03 extension)
- UC-WSRC-08 — Ingest founder-curated regional seed list
- UC-WSRC-09 — Ingest AllThePlaces chain inventory (feeds chain blocklist)
- UC-WSRC-10 — Pre-compute census-tract density classifier (R1 enabler)

## WQUAL — Waypoint Quality

**Concern**: how candidates are filtered, scored, verified, and re-verified to ensure the catalog is high-quality and rural-fair.

**Use case file**: [`05-uc-wqual.md`](./05-uc-wqual.md)

**Use cases**:
- UC-WQUAL-01 — L1 category pre-filter
- UC-WQUAL-02 — L2 deterministic chain blocklist
- UC-WQUAL-03 — L3 + R2 density-aware confidence threshold
- UC-WQUAL-04 — L4 Haiku motorcycle-relevance gate (Taste only)
- UC-WQUAL-05 — L5 multi-source corroboration boost
- UC-WQUAL-06 — L6 Sonnet Vision pullover verification (ambiguous Pause only)
- UC-WQUAL-07 — L8 freshness SLA re-verification
- UC-WQUAL-08 — R3 local-density score normalization
- UC-WQUAL-09 — R4 route-proximity score boost
- UC-WQUAL-10 — R5 rider-forum primary source priority for rural Taste

## WDISC — Waypoint Discovery

**Concern**: how riders discover and interact with waypoints in the mobile app.

**Use case file**: [`06-uc-wdisc.md`](./06-uc-wdisc.md)

**Use cases (Option A — minimum viable UX)**:
- UC-WDISC-01 — Browse waypoints on map (Moments Near Me)
- UC-WDISC-02 — Filter by category (Pause / Wander / Taste)
- UC-WDISC-03 — Filter by effort (pullover / park / side-trip)
- UC-WDISC-04 — Sort by trigger score or proximity
- UC-WDISC-05 — View waypoint details
- UC-WDISC-06 — Rural radius auto-expansion (fewer than 5 nearby → expand to 50, then 100 miles)
- UC-WDISC-07 — Report "not a delight" (L7 downvote flow)
- UC-WDISC-08 — Show waypoints on current route detail view (passive surfacing)

## WFLY — Waypoint Flywheel

**Concern**: how usage data and rider feedback improve catalog quality over time.

**Use case file**: [`07-uc-wfly.md`](./07-uc-wfly.md)

**Use cases**:
- UC-WFLY-01 — Process user downvote → deterministic score penalty
- UC-WFLY-02 — Schedule freshness re-verification (category-specific SLA)
- UC-WFLY-03 — Recalibrate composite scoring weights after flywheel data accumulates
