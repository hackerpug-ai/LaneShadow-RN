---
stability: FEATURE_SPEC
last_validated: 2026-04-14
prd_version: 1.0.0
---

# Scope

## In Scope — Phase 0.5

### Content categories
- **Pause** — scenic overlooks, vistas, pullouts, photo spots, waterfall pullouts, sunset viewpoints
- **Wander** — historic sites, ghost towns, lighthouses, covered bridges, weird Americana, small museums, interpretive-sign clusters, walkable scenic features
- **Taste** — independent diners, BBQ joints, small-town cafes, ice cream stands, biker-friendly food stops (thin at launch, enriches via UC-RIDER-03)

### Sourcing
- Overture Maps Foundation Places (bulk download, monthly cadence)
- HMDB.org historical markers
- USGS GNIS named geographic features
- National Register of Historic Places
- NPS + USDA + FHWA overlook / scenic byway feeds
- OpenStreetMap `tourism=*|historic=*|amenity=*` (already in stack)
- Rider-forum NLP extension of UC-RIDER-03 (hard dependency)
- Founder-curated regional seed list (3 regions)
- AllThePlaces chain inventory (feeds the chain blocklist)
- US Census TIGER/Line + ACS for density classifier

### Backend
- New Convex table `curated_waypoints` (lean + full projection pattern)
- New op-sqlite mirror `waypoints.db` with `contentVersion`-gated delta sync
- Extension of intent schema with 3 nullable waypoint keys
- Full 7-layer quality-gate pipeline + 6 rural-aware refinements
- Haiku extraction with prompt caching (O1–O4)
- Voyage embeddings for O5 deduplication
- Sonnet Vision for O6 ambiguous-Pause verification
- Cost monitoring + LLM call telemetry

### Frontend (Option A — minimum viable UX)
- **Moments Near Me** screen: map view + list view + category filter chips + effort filter chips + sort control
- Waypoint detail sheet: name + category badge + composite score + one-liner + photo (when available) + distance from location + effort/trigger_score + save/unsave + "not a delight" downvote button
- Rural radius auto-expansion when fewer than 5 waypoints in 20 miles
- Waypoints also surface passively on the existing route detail sheet when a route passes within 5 miles of a high-scoring waypoint

### Flywheel
- User downvote loop (L7) with deterministic score penalty
- Freshness SLA (L8) — Taste 12 months, Pause 36 months, Wander 36 months
- Telemetry for engagement, downvote rate, category-distribution, and regional density

## Out of Scope — Phase 0.5 (deferred or dropped)

### Categories
- **Gather** — rider hangouts, bike meets, motorcycle museums, rally venues — **deferred to Phase 1** (community density insufficient at launch)

### UX surfaces
- **Surprise Me button** — **deferred to Phase 1**, evaluate after Moments Near Me engagement data exists
- **Moments Feed (card stack)** — **deferred to Phase 1** as retention mechanic
- **Along-route bloom** (real-time ambient waypoint surfacing during a ride) — **deferred to Phase 3** with Ride Companion voice
- **Voice integration** — **Phase 3 Ride Companion** territory
- **Multi-day trip waypoint planning** — **out of scope**, different product surface
- **Advanced filters** (biker-friendly tag, seasonal, bike-type fit) — **deferred to Phase 1**

### Content contribution
- **User-submitted waypoints** — **deferred to Phase 1**; Phase 0.5 catalog is pipeline-generated + founder-seeded
- **User-uploaded photos** — **deferred to Phase 1**

### Sources
- **Google Places API** — **dropped** (replaced by Overture Maps)
- **TripAdvisor** — **dropped** (audience mismatch + legal risk, see sourcing research)
- **Atlas Obscura partner tier** — **deferred to Phase 1+** when partner discussion makes sense
- **Roadfood** — **deferred to Phase 1+** (no API, partnership required)
- **Yelp Fusion API** — **not used** (redundant with Overture)
- **HERE Places API** — **not used** (redundant with Overture)
- **Apple MapKit** — **not used** (platform lock-in risk)
- **Foursquare direct API** — **not used in Phase 0.5** (data already in Overture under Apache-2.0)

### Quality gates
- **L6 Claude Vision** for non-ambiguous Pause candidates — **scoped to ambiguous only** in Phase 0.5 per cost-scoping rule

## Success criteria

A Phase 0.5 launch is considered successful when:

- **Catalog**: Pause + Wander categories have ≥5,000 waypoints each nationally; Taste has ≥500 waypoints (thin is OK) and grows ≥20%/month post-UC-RIDER-03 completion
- **Engagement**: ≥30% of active riders open the Moments Near Me surface at least once per session
- **Trust**: downvote rate < 5% of view events (riders don't feel like the catalog is noise)
- **Rural fairness**: rural regions (per Census density classifier) have ≥3 surfaced waypoints per 20-mile radius on average
- **Cost**: monthly LLM + sourcing cost stays under $20/month steady state
- **Founder dogfood**: founder personally rides to ≥2 previously-unknown waypoints/month via the app
