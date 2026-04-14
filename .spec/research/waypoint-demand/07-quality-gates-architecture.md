---
stability: DESIGN_DECISION
last_validated: 2026-04-14
research_scope: waypoint-quality-gate-architecture
parent_doc: README.md
related_findings: 03-findings.md, 06-sourcing-alternatives-deep-research.md
applies_to: .spec/prds/waypoints/ (forthcoming) Phase 0.5
---

# Waypoint Quality Gates — Architecture

## Purpose

Define the quality-gate stack for the Phase 0.5 waypoint pipeline. Quality gates are the defensive layers that ensure no chain restaurant, generic POI, or hallucinated waypoint reaches a rider's screen — and that rural waypoints aren't under-represented by a pipeline whose data sources skew urban.

**Decision**: Option B (7 layers) + 6 rural-aware refinements. Approved 2026-04-14.

## The core tension this architecture resolves

The deep-research in [`06-sourcing-alternatives-deep-research.md`](./06-sourcing-alternatives-deep-research.md) identified that **Overture Maps has weaker rural coverage than urban** — precisely opposite of LaneShadow's cruiser/touring persona, who rides almost entirely in rural areas (city traffic is dangerous on a motorcycle). Naive quality gates amplify this mismatch: they over-filter rural candidates (where signal is sparse by nature) and under-filter urban ones (where noise is dense). The architecture below deliberately tilts the scales toward rural.

**The asymmetry is category-specific.** Pause and Wander are structurally rural-strong because their primary sources are federal datasets (USGS GNIS, NPS, NRHP, HMDB) that cover rural areas uniformly. **The rural coverage problem lives almost entirely in the Taste category** — indie diners, biker-friendly cafes, small-town food stops — because those waypoints only exist in commercial databases (urban-biased) and rider-forum chatter (rural-biased). The architecture treats Taste differently from Pause/Wander accordingly.

---

## Part 1: The 7 gate layers

Every waypoint passes through these layers in order during pipeline extraction. Later layers see only candidates that survived earlier layers.

### L1 — Category pre-filter (deterministic, ingestion)

**What it does**: Drops any candidate whose source category doesn't map to Pause / Wander / Taste. Pulled from structured source tags: OSM `amenity=*|tourism=*|historic=*`, Overture `categories.primary`, USGS GNIS feature class, HMDB marker type, NRHP property type.

**Why it matters**: The simplest, most obvious filter. Eliminates 70–90% of raw source volume with zero cost. A `amenity=atm` is not a waypoint.

**Cost**: Zero. Pure deterministic mapping.

**Rural impact**: Neutral.

### L2 — Deterministic chain blocklist (deterministic, ingestion)

**What it does**: Blocks any candidate whose name or brand attribute matches a chain. The blocklist is **auto-generated from the AllThePlaces inventory** (which is itself free and CC0-1.0 licensed, already included in Overture Maps). Updates with each Overture release.

**Key insight**: We don't maintain the chain list manually. AllThePlaces tracks 3,000+ chain brands with fresh scrapes; we ingest it as a lookup table alongside Overture and use it as a name-matcher + `brand:wikidata`-matcher on incoming candidates.

**Why it matters**: Research `03-findings.md` showed chain contamination in rider language is ~0%. Riders already reject chains; the blocklist reinforces that behavior at the pipeline layer.

**Cost**: Zero. Hash lookup + regex name match.

**Rural impact**: **Slight net negative** for rural volume — interstate-adjacent chains (Cracker Barrel, Waffle House) are sometimes the ONLY Overture entries in rural stretches. L2 removes them. Mitigation is in the rural refinements (especially R5, which makes rider-forum NLP the primary rural source).

### L3 — Density-aware confidence threshold (deterministic, ingestion)

**What it does**: Uses Overture Maps' built-in `confidence_score` field (0–1) as a pre-filter, with the threshold varying by local population density.

**Thresholds** (see R1 for how density is determined):

| Density class | Confidence threshold |
|---|---|
| Urban | ≥ 0.60 |
| Suburban | ≥ 0.50 |
| Rural | ≥ 0.30 |
| Remote | ≥ 0.20 |

**Why it matters**: Overture's confidence score is a pre-built quality signal we get for free — source-weighted by Meta/Microsoft/Foursquare/AllThePlaces. In urban areas there are plenty of high-confidence alternatives so we can afford to be strict. In rural areas we accept more signal with lower verification because the cost of a false negative (missing the one decent diner) outweighs the cost of a false positive (surfacing a mediocre one).

**Cost**: Zero. Comparison against a lookup table.

**Rural impact**: **Net positive** — leniency is the whole point.

### L4 — Haiku motorcycle-relevance gate (LLM, Taste only)

**What it does**: For Taste candidates only (Pause and Wander skip this gate), Claude Haiku reads the waypoint's name, description, source tags, and any corroborating rider-forum mentions, then returns a binary `is_rider_stop: bool`. A candidate that doesn't pass this gate is dropped — not just down-scored.

**What Haiku is asked** (simplified prompt):

> "This is a candidate Taste waypoint for a motorcycle ride-discovery app. Target riders are recreational cruiser and touring motorcyclists who value independent businesses, scenic surroundings, and places that welcome motorcycles. Based on the name, description, tags, and any corroborating rider mentions, is this place a plausible 'moment of delight' stop on a motorcycle ride? Return only `{"is_rider_stop": true|false, "reason": "..."}`. Examples of `true`: an independent diner, a BBQ shack, a small-town cafe, a biker-welcoming pub. Examples of `false`: a hospital cafeteria, an airport lounge, a hotel room-service menu, a company cafeteria."

**Why it's Taste-only**: Pause and Wander don't need this gate because their sources are authoritative (HMDB, GNIS, NRHP are curated by definition). Taste is the only category where Overture and OSM can surface genuinely irrelevant candidates — that's where the LLM gate earns its keep.

**Cost**: ~$0.0003 per call. For a Phase 0.5 Taste pipeline run of 5,000–10,000 candidates, total cost ~$1.50–3. Trivial.

**Rural impact**: Neutral directly, but works in concert with R5 (which makes rider-forum NLP the primary rural Taste source, so the Haiku prompt has rider-forum context to ground against).

### L5 — Multi-source corroboration boost (deterministic, scoring)

**What it does**: This is a *score boost*, not a filter. A waypoint that appears in ≥2 independent sources (e.g., HMDB + Overture + rider-forum NLP) gets a composite score bonus. Single-source waypoints are not rejected — they rank lower by default.

**Implementation**: Cross-reference by spatial proximity (waypoints within ~50m of each other from different sources are the same entity) plus name similarity. Overture's GERS ID already handles this for cross-Overture sources. For external sources (HMDB, forum NLP), we add a matching pass at ingestion.

**Why it matters**: A waypoint that multiple independent sources care about is empirically higher-quality than a single-mention. The corroboration signal naturally surfaces "rider-favorite" places without needing explicit rider tagging.

**Cost**: Zero. Spatial + string join.

**Rural impact**: **Neutral** — rural waypoints rarely appear in ≥2 sources, so they don't get the boost, but they don't get penalized either. The rural refinements (especially R2, R3, R4) compensate.

### L7 — User downvote loop (deterministic + lightweight LLM, runtime)

**What it does**: Post-launch, riders can mark a waypoint "not a moment of delight." This applies a deterministic score penalty and queues the waypoint for review after N downvotes. Phase 0.5 implementation is **minimum viable**: button + deterministic penalty (–0.2 per downvote, floor at 0), no review queue, no auto-delete. The flywheel starts the moment the first user signs up.

**Why it's here**: The rider community is our ground truth. No pipeline is perfect; the downvote loop is the self-correcting mechanism.

**Cost**: Negligible (one mutation per downvote).

**Rural impact**: Neutral. Both rural and urban waypoints can be downvoted.

### L8 — Freshness SLA (deterministic, scheduled)

**What it does**: Every waypoint row has a `last_verified` timestamp. Records older than **12 months** (Taste) or **36 months** (Pause, Wander — these are stable; landmarks don't close) are re-verified on the next pipeline run: the source is re-queried, and any change triggers re-scoring.

**Why it matters**: Diners close. Historical markers don't. Different categories deserve different freshness SLAs.

**Cost**: Zero beyond the normal pipeline run.

**Rural impact**: Neutral.

### L6 — Claude Vision Street View check (Phase 0.5 default, scoped to ambiguous candidates)

**In Phase 0.5.** Revised 2026-04-14 from original Phase 1 opt-in framing — the AI leverage decision (Thread 4, Option C) committed to Vision verification at launch rather than deferring.

Claude 3.5 Sonnet vision reads the Street View tile at a Pause candidate's coordinates and returns `{is_pullover_safe: bool, reason: string}`. Candidates that fail are rejected from the catalog.

**Critical scoping rule — L6 only runs on ambiguous candidates.** We do NOT vision-verify every Pause candidate because many are self-verified by their source signal:

- **Auto-passing (skip Vision)**: Pause candidates where the source provides a clear pullover signal — e.g., OSM `tourism=viewpoint` tagged with `parking=yes` or `highway=pull_out`; HMDB markers (which include photos and are roadside by definition); NPS overlooks (federally-designated pullouts); FHWA scenic byway waysides (pullouts by definition).
- **Auto-failing (skip Vision, drop)**: USGS GNIS summits/peaks at elevation >1000ft above the nearest road (unreachable); OSM viewpoints with `access=private`; anything tagged `access=no`.
- **Ambiguous — run Vision**: Overture Places `category=scenic_viewpoint` with no pullover signal; OSM viewpoints without `parking=*` or `highway=*` tag; GNIS features within 500ft of a road but no explicit pullout data.

**Cost math (revised)**:
- Estimated total Pause candidate pool: ~20,000 (Overture + OSM + GNIS + HMDB + NPS combined)
- Auto-passing subset (~50%): 10,000 candidates, $0 Vision cost
- Auto-failing subset (~15%): 3,000 candidates, $0 Vision cost (dropped pre-Vision)
- Ambiguous subset (~35%): 7,000 candidates × $0.004 per Sonnet Vision call = **~$28 one-time**
- Ongoing cost: re-verification on the freshness SLA cycle, scaled to new incremental ambiguous candidates — likely **$2–5/month** steady state

**Total AI cost for Phase 0.5 Pause verification: ~$28 one-time + $2–5/month** (not $80). The scoping rule preserves the quality benefit of Vision while keeping cost proportional to actual ambiguity.

---

## Part 2: The 6 rural-aware refinements

These are not separate layers; they're modifications to the layers above. They all depend on **R1** (the density classifier) being in place first.

### R1 — Census-density classifier (enabler)

**What it does**: Uses US Census Bureau tract-level population density data (free, public domain) to classify every waypoint coordinate as `urban | suburban | rural | remote` at ingestion time. Adds `density_class` as a column on `curated_waypoints`.

**Classification thresholds** (tentative, tune with data):

| Class | Population density (per sq mi) |
|---|---|
| Urban | > 1,000 |
| Suburban | 250–1,000 |
| Rural | 25–250 |
| Remote | < 25 |

**Why this is R1 and not R-anything-else**: Every other rural refinement uses `density_class` as input. Without it, they don't work. Build this first, test it first.

**Data source**: US Census Bureau TIGER/Line shapefiles (free, public domain) joined against American Community Survey 5-Year Population Estimates at the census tract level. Alternatively, a pre-built lookup table keyed by lat/lng bucket. Updated every 1–3 years (census data is slow-moving).

**Implementation note**: Can be computed once per waypoint at ingestion time, or lazily at query time. At ingestion is simpler; pre-compute.

### R2 — Density-aware confidence thresholds (refines L3)

Already covered in L3 above. This *is* the refinement — L3 as written is already rural-aware by design. R2 is the decision to tune thresholds per density class rather than flat-threshold.

### R3 — Local-density score normalization (scoring)

**What it does**: When computing a waypoint's composite score, boost it by `1 / log(nearby_waypoints_in_same_category)`. A diner that's the only restaurant within 20 miles gets a meaningful boost over an identical diner that's one of 50 in a 5-mile radius.

**Math**:
```
local_uniqueness = 1 / log(1 + nearby_count)
composite_score = base_score * (1 + 0.3 * local_uniqueness)
```

where `nearby_count` is the number of same-category waypoints within a 10-mile radius.

**Why it matters**: Rural rider mental model is "one or two great stops per ride" — scarcity increases waypoint value. Without normalization, the scoring pipeline implicitly rewards density, which penalizes exactly the rural persona we serve.

**Cost**: Zero. Pure math on pre-computed spatial indices.

**Rural impact**: Strongly positive for rural.

### R4 — Route-proximity score boost (scoring)

**What it does**: Waypoints within N miles of a curated route (from the existing `curated_routes` table) get a score boost proportional to the route's composite score. This uses our *existing route catalog* as a secondary quality signal for waypoints — without needing any new data source.

**Implementation**: For each waypoint, compute the distance to the nearest curated route using PostGIS / SpatiaLite. If the distance is less than 5 miles, apply a boost of `route_composite_score × distance_decay_factor`.

**Why it matters**: Our curated routes are overwhelmingly rural (Blue Ridge, Smokies, Tail of the Dragon, Sierra passes, Utah 12, etc.). Any waypoint that happens to sit on or near one of these routes *gets a rural boost* for free. This is the most elegant single refinement in the stack because it composes existing infrastructure.

**Cost**: Zero. One spatial join per waypoint at ingestion or first query.

**Rural impact**: Strongly positive — rural routes carry rural waypoints with them.

### R5 — Rider-forum NLP as PRIMARY Taste source for rural areas (sourcing)

**What it does**: Inverts the default sourcing priority for the Taste category based on `density_class`:

- **Urban / suburban**: Overture is primary, rider-forum NLP is corroboration (for the L5 boost)
- **Rural / remote**: **Rider-forum NLP is primary**, Overture is supplemental (for L5 corroboration only)

**Why this is important**: Forum posts about "best stops on Blue Ridge Parkway" are *inherently* rural-biased — riders write about rural rides, not urban commutes. Making forum NLP the primary rural Taste source means the rural Taste catalog is built from the source that actually indexes rural indie diners, rather than built from Overture (which doesn't) and *then* checked against forum NLP (too late — Overture already rejected the good ones).

**Implementation**: The UC-RIDER-03 pipeline in `curation-hardening` extracts waypoint mentions with lat/lng. For rural mentions, the waypoint enters `curated_waypoints` directly; for urban mentions, it enters only as a corroboration signal for an existing Overture-sourced waypoint.

**Rural impact**: Strongly positive. This is the biggest single rural refinement.

### R6 — Founder regional seeding (sourcing, cold-start)

**What it does**: The founder manually seeds 30–50 Taste waypoints per region of personal use before Phase 0.5 launch. This is a cold-start hedge: even if R1–R5 all work, rural catalog density at launch is uncertain, and a thin catalog on day one is a bad first-use experience. Founder seeding guarantees a minimum floor.

**Scope**: **3 regions in Phase 0.5**, selected based on where the founder actually rides. My proposed default (adjust if wrong): **(1) Utah / SW Colorado (Utah 12, Moab, Cedar Breaks, La Sal Loop); (2) Blue Ridge Parkway / Smokies (NC/TN/VA); (3) Sierra Nevada / Eastern Sierra (CA). These regions are chosen for: high v3-persona fit (cruiser/touring), well-known ride destinations, sufficient founder personal knowledge to seed high-quality waypoints, and diverse geography to test the rural refinements against different terrain.

**Budget**: ~2–4 hours of founder time per region = 6–12 hours total. Within the v3 "5–10 hrs/week side project" budget.

**Implementation**: Founder maintains a seed list (CSV or JSON) in `.spec/prds/waypoints/founder-seed/`. The ingestion pipeline treats these as **Tier 1 trusted entries** — they bypass L1–L4 gates (the founder has already evaluated them) and are tagged with `source=founder_seed`. They do still participate in L5 (corroboration boost), L7 (downvote loop), and L8 (freshness SLA).

**Rural impact**: Guaranteed minimum floor. Not scalable, but it doesn't need to be — scale comes from R5 once UC-RIDER-03 lands.

---

## Part 3: How the architecture composes

A Taste candidate's lifecycle through the pipeline, from ingestion to surfacing:

```
1. Raw candidate from Overture, OSM, rider-forum NLP, or founder seed
         ↓
2. L1 — Category pre-filter: drop if not Taste
         ↓
3. L2 — Chain blocklist: drop if in AllThePlaces chain inventory
         ↓
4. R1 — Compute density_class for this coordinate
         ↓
5. L3 + R2 — Confidence threshold (rural: ≥0.3, urban: ≥0.6)
         ↓
6. L4 — Haiku motorcycle-relevance gate (Taste only)
         ↓
7. Waypoint enters curated_waypoints with base score
         ↓
8. R3 — Local-density normalization applied
         ↓
9. R4 — Route-proximity boost applied (if near curated route)
         ↓
10. L5 — Multi-source corroboration boost applied (if in ≥2 sources)
         ↓
11. Composite score finalized
         ↓
12. (runtime) L7 — User downvotes drag score over time
         ↓
13. (scheduled) L8 — Freshness SLA re-verifies after 12 months (Taste)
```

A Pause candidate skips L4 (no Haiku gate) and optionally goes through L6 (Vision) in Phase 1. A Wander candidate skips L4. Founder-seed candidates skip L1–L4 entirely (trusted).

## Part 4: What's in Phase 0.5 vs. Phase 1

| Layer | Phase 0.5 | Phase 1 | Rationale |
|---|---|---|---|
| L1 | ✅ | | Core |
| L2 | ✅ | | Core |
| L3 | ✅ | | Core |
| L4 (Haiku relevance) | ✅ Taste only | | Core for Taste |
| L5 (corroboration) | ✅ | | Core |
| L6 (Vision, scoped to ambiguous Pause candidates) | ✅ | | Phase 0.5 default per Thread 4 Option C. ~$28 one-time + $2–5/mo steady state, scoping rule drops ~65% of candidates before Vision |
| L7 (downvote) | ✅ Minimum viable | Enhanced | Phase 0.5: button + score drag only. Phase 1: review queue, auto-delete thresholds |
| L8 (freshness) | ✅ | | Core |
| R1 (density classifier) | ✅ | | Enabler for everything |
| R2 (tiered thresholds) | ✅ | | Core |
| R3 (local normalization) | ✅ | | Core |
| R4 (route proximity) | ✅ | | Core |
| R5 (forum-primary rural Taste) | ✅ | | Core — this is the biggest rural lever |
| R6 (founder seeding) | ✅ 3 regions | More regions | Phase 0.5: Utah/SW CO + Blue Ridge/Smokies + Sierra (TBD with founder) |

## Part 5: What this architecture does NOT do

- **Does not ship a catalog with 10,000 rural Taste waypoints.** Rural is sparse by nature; the architecture prevents us from making it worse than reality, not from manufacturing density that doesn't exist.
- **Does not use Google Places or TripAdvisor.** See `06-sourcing-alternatives-deep-research.md`.
- **Does not rely on user downvotes to catch systematic errors.** L7 is a self-correcting mechanism, not a QA substitute. L1–L5 must be correct on their own.
- **Does not pre-classify rural/urban using zip codes.** Zip codes are distribution units, not population-density units — a zip code can span both urban and rural. Census tract is the right primitive.
- **Does not commit to L6 Vision.** Phase 0.5 defers it; Phase 1 enables it if the data shows it's needed.

## References

- `03-findings.md` — research validating taxonomy + chain contamination rate
- `06-sourcing-alternatives-deep-research.md` — sourcing stack (Overture + HMDB + GNIS + forum NLP)
- `.spec/PRODUCT-STRATEGY.md` Pillar 1 — waypoint ontology + Phase 0.5 Feature Sequencing
- `.spec/prds/curation-hardening/07-uc-rider.md` — UC-RIDER-03 community NLP pipeline (the source for R5)
- [US Census Bureau TIGER/Line shapefiles](https://www.census.gov/geographies/mapping-files/time-series/geo/tiger-line-file.html) — R1 data source
- [AllThePlaces](https://www.alltheplaces.xyz/) — L2 chain inventory source (included in Overture under CC0-1.0)
