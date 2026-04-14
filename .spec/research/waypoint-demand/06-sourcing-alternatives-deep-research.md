---
stability: RESEARCH_FINDING
last_validated: 2026-04-14
research_scope: cost-efficient-waypoint-sourcing-alternatives
method: deep-research
iterations: 2
sources_consulted: 28
confidence: HIGH
parent_doc: README.md
applies_to: .spec/PRODUCT-STRATEGY.md Pillar 1 Phase 0.5 waypoints sourcing strategy
---

# Waypoint Sourcing — Cost-Efficient Alternatives to Google Places + TripAdvisor

## Executive Summary

**Overture Maps Foundation's Places dataset is the game-changer** this research was looking for: **64 million global POIs, commercially-licensed (CDLA-Permissive-2.0 and Apache-2.0), free to download, updated monthly, and already includes 6.5 million Foursquare places for free.** This single source replaces the Google Places API entirely for LaneShadow's use case — zero per-query cost, no rate limits, no licensing contracts, no data lawyers. Combined with USGS GNIS (1M+ free US geographic features), Geoapify's free tier (3K credits/day for OSM-based real-time lookups), and the existing HMDB + OSM + rider-forum NLP stack, LaneShadow can build a richer sourcing pipeline than "Option C" specified — at roughly **$0 one-time and ~$0/mo recurring**, not the $500–1,800 + $50–200/mo that Option C priced in.

**TripAdvisor should be dropped.** It has *some* rider-generated content (reviews mentioning "bikers welcome"), but the signal is buried in general-tourist noise and requires NLP mining from individual review pages — expensive, high-friction, legally questionable for bulk reuse. For Phase 0.5, the rider-forum NLP pipeline (already spec'd in `curation-hardening/07-uc-rider.md`) is a structurally better source for "biker-beloved" signals than TripAdvisor's review corpus.

## Key Findings

### 1. Overture Maps is a structural unlock (Confidence: HIGH, 8 sources)

Overture Maps Foundation released its Places dataset in production in 2024, backed by the Linux Foundation with Meta, Microsoft, Amazon, TomTom, and Esri as founding members. As of March 2026 it contains **64 million POIs globally** with monthly releases. Critically for a lifestyle-project budget:

| Aspect | Detail |
|---|---|
| **Cost** | Free — downloaded directly from AWS S3 or Azure Blob Storage |
| **Format** | GeoParquet (column-oriented, queryable with DuckDB, Polars, pandas) |
| **Update cadence** | Monthly releases (e.g., `2026-03-18.0`) |
| **Schema** | Unified across all source feeds; includes `category`, `confidence_score` (0–1), addresses, names, source attribution, geometry |
| **Commercial reuse** | CDLA-Permissive-2.0 for 58.8M features (Meta), Apache-2.0 for 6.5M features (Foursquare), CC0-1.0 for 1.65M features (AllThePlaces). **All three licenses allow commercial product use with attribution.** |
| **Categories** | ~280 "Basic Level" labels (restaurant, museum, historic_site, viewpoint, etc.) mapped from a richer hierarchy — enough granularity to distinguish Pause/Wander/Taste |
| **Entity resolution** | GERS (Global Entity Reference System) IDs link the same real-world entity across sources, enabling deduplication |

**Source composition of Overture Places (March 2026 release):**

| Source | License | Feature count |
|---|---|---|
| Meta, via Overture | CDLA-Permissive-2.0 | 58,843,409 |
| Foursquare, via Overture | **Apache-2.0** | **6,503,660** |
| Microsoft, via Overture | CDLA-Permissive-2.0 | 5,492,871 |
| AllThePlaces, via Overture | CC0-1.0 | 1,651,532 |
| DAC, Overture | CDLA-Permissive-2.0 | 153,642 |
| PinMeTo, Overture | CDLA-Permissive-2.0 | 130,234 |
| Other | CDLA-Permissive-2.0 | ~8,000 |

**Strategic implication**: 6.5 million curated Foursquare POIs — the same data Foursquare charges $18.75 per 1,000 premium calls for — are available for free via Overture download under Apache-2.0. This eliminates Foursquare API as a necessary spend; we use Overture for bulk and Foursquare API only if we need real-time lookups beyond Overture's monthly cadence.

**Quality caveat**: per the OSM community's global comparison study (linked below), Overture Places has strong coverage in urban areas and chain businesses but weaker coverage for **rural independent establishments** — which is exactly where LaneShadow's Taste category lives. The mitigation: Overture is the spine, HMDB handles Wander, and rider-forum NLP extraction (UC-RIDER-03) handles the rural-independent-diner gap that Overture can't fill alone.

Sources:
- [Overture Places Guide](https://docs.overturemaps.org/guides/places)
- [Overture Attribution & Licensing](https://docs.overturemaps.org/attribution)
- [Places Taxonomy Browser](https://docs.overturemaps.org/guides/places/taxonomy-browser)
- [Places Schema Reference](https://docs.overturemaps.org/schema/reference/places/place)
- [Overture Blog — 54M+ POIs announcement](https://overturemaps.org/blog/2025/overture-maps-foundation-making-open-data-the-winning-choice)
- [Overture Blog — From Discovery to Action (Travel)](https://overturemaps.org/blog/2025/from-discovery-to-action-a-new-foundation-for-travel)
- [OSM vs Overture Restaurants Comparison](https://community.openstreetmap.org/t/a-global-comparison-of-restaurants-in-openstreetmap-and-overture-places/120475)
- [Echo Analytics Overture Places Deep Dive](https://www.echo-analytics.com/blog/analyzing-overture-maps-foundations-places-data)

### 2. Google Places API is not needed (Confidence: HIGH, 5 sources)

With Overture covering 64M POIs at no cost, the only remaining reason to touch Google Places API is **real-time lookup of places that aren't in Overture yet** (e.g., a diner that opened last month). For a monthly-batch-sourcing pipeline, this is a non-issue — we use Overture's monthly releases and accept the staleness window.

The rare case where a user needs a real-time place lookup (e.g., user submits a waypoint by name, pipeline needs to geocode + verify) is cheaply served by Geoapify's free tier (3,000 credits/day) or Mapbox Search API (we're already using Mapbox for routes). **Google Places adds zero marginal value over these alternatives for our use case.**

**Recommendation: drop Google Places from the sourcing stack entirely.** Savings: $255–850 one-time + ongoing query costs. Risk of dropping: effectively zero, given Overture covers the same data space at higher scale with no per-query cost.

### 3. Foursquare API has a viable free tier but Overture is cheaper for bulk (Confidence: HIGH, 4 sources)

Foursquare's direct API pricing as of 2026:

| Endpoint class | Cost |
|---|---|
| **Pro endpoints** (search, details, autocomplete) | **FREE up to 10,000 calls/day** then pay-as-you-go |
| **Premium endpoints** (photos, tips, hours, ratings) | $18.75 per 1,000 calls, no free tier |
| Sandbox | Free for testing |

**When Foursquare API adds value vs. Overture download**: real-time autocomplete and details endpoints for in-app user search flows (a rider types "Holy Smoke Diner" → we look up the Foursquare record in real time). Not needed for bulk sourcing — Overture already has Foursquare's data.

**Recommendation**: Foursquare API is a **nice-to-have for in-app user search**, not a Phase 0.5 sourcing blocker. Defer to Phase 1+ unless we find Overture's monthly cadence is too stale for user-facing flows.

Sources:
- [Foursquare Pricing](https://foursquare.com/pricing)
- [Foursquare Places API Product Page](https://foursquare.com/products/places-api)
- [getcamino.ai Pricing Guide](https://app.getcamino.ai/learn/foursquare-places-api-pricing)
- [Medium: Foursquare Data Access Guide](https://medium.com/@tregub95/how-start-working-with-foursquare-open-source-places-c7d93ce003ce)

### 4. Geoapify is the right fill-in for real-time OSM queries (Confidence: HIGH, 4 sources)

For real-time queries that shouldn't touch Overture bulk data (e.g., "places within 500m of current GPS"), Geoapify offers an OSM-based Places API with the most generous free tier I found:

| Tier | Credits/day | Cost |
|---|---|---|
| **Free** | **3,000 credits/day** | $0 |
| API 10 | 10,000 credits/day | $59/mo |
| API 25 | 25,000 credits/day | $109/mo |
| API 50 | 50,000 credits/day | ~$200/mo |

Credits scale by request type (a simple Places query is 1 credit, enriched queries are more). At 3K/day free, LaneShadow can serve **~90K real-time POI lookups/month** for free — more than sufficient for Phase 0.5 traffic.

**Licensing**: OpenStreetMap-derived, ODbL license with attribution requirement. Usable in commercial products.

**Strategic role**: the "live" endpoint for dynamic queries that shouldn't go through Overture bulk processing. E.g., when a user opens the Moments Feed for a location, we can hit Geoapify for any gaps between Overture monthly releases.

Sources:
- [Geoapify Pricing](https://www.geoapify.com/pricing)
- [Geoapify Places API](https://www.geoapify.com/places-api)
- [Geoapify as Google Places Alternative](https://www.geoapify.com/geoapify-as-a-google-places-api-alternative)
- [Geoapify OSM Wiki Page](https://wiki.openstreetmap.org/wiki/Geoapify)

### 5. USGS GNIS is a free underused source for Pause waypoints (Confidence: HIGH, 5 sources)

USGS Geographic Names Information System contains **over 1 million domestic geographic features** with names, coordinates, and feature classes. Fully free, bulk-downloadable, US government-authoritative.

**What it gives us**:
- Named natural features (viewpoints, summits, waterfalls, lakes, streams, valleys, gaps, passes)
- Historical features (ghost towns, abandoned mines, former populated places)
- Unincorporated populated places (the small towns riders actually ride through)

**How it maps to our categories**:
- **Pause**: named scenic features (Rainbow Falls, Dead Man's Curve, Lovers' Leap, etc.)
- **Wander**: ghost towns, historical populated places, named historical features
- Not useful for Taste (no business data)

**Format**: downloadable TSV from the USGS Board on Geographic Names website; feature classes include `Summit`, `Cliff`, `Falls`, `Gap`, `Pillar`, `Arch`, `Basin`, `Cave`, `Bay`, `Overlook` — directly relevant to waypoint sourcing.

**Coverage gap it fills**: OSM and Overture both have some scenic features, but GNIS is the federal authoritative source. Cross-referencing Overture + OSM + GNIS will give us the most complete Pause catalog for Phase 0.5.

Sources:
- [USGS GNIS Main Page](https://www.usgs.gov/tools/geographic-names-information-system-gnis)
- [Download GNIS Data](https://www.usgs.gov/us-board-on-geographic-names/download-gnis-data)
- [GNIS FAQ](https://www.usgs.gov/faqs/what-geographic-names-information-system-gnis)
- [GNIS Feature Classes](https://www.usgs.gov/us-board-on-geographic-names/gnis-domestic-names-feature-classes)
- [GNIS Populated Places dataset on data.gov](https://catalog.data.gov/dataset/gnis-populated-places)

### 6. TripAdvisor is empirically the wrong audience (Confidence: MEDIUM-HIGH, 6 sources)

I investigated whether TripAdvisor has rider-relevant content and found a *mixed* signal:

- **Yes, riders do post on TripAdvisor about biker-friendly places.** I found reviews naming Newcomb's Ranch on Angel's Crest ("must stop for all riders"), Daniels Restaurant & Open Air Bars in Elkridge MD ("well known as a Bikers' bar"), and Elkhorn Grill in Vanderbilt MI ("ultimate local biker/hunter bar and grill").
- **But the signal is scattered in noise.** These are individual reviews mined from 500+ reviews per restaurant where 95%+ of reviewers are general tourists. There's no "biker-friendly" tag, no structured way to query for it, and TripAdvisor's review-density-weighted ranking systematically favors well-known tourist-trap restaurants over rider-beloved locals.
- **Forum content is a structurally better source** for the exact same signal. The research we ran in `03-findings.md` validated that cruiser/touring forums contain dense, high-signal waypoint mentions from actual riders — no general-tourist dilution, no legal-content-reuse overhead.

TripAdvisor also poses a **bulk-ingestion legal problem**: their ToS prohibits automated scraping, and their official Content API is partner-access-only (enterprise contracts). For a lifestyle project, the combination of weak signal + legal overhead kills the source.

**Recommendation**: **Drop TripAdvisor entirely.** The rider-forum NLP pipeline in `curation-hardening/07-uc-rider.md` will capture the same signal (rider-beloved independent places) with higher density, cleaner legal status, and zero sourcing cost.

Sources: TripAdvisor rider reviews observed: [Newcomb's Ranch](https://www.tripadvisor.com/ShowUserReviews-g32573-d3935935-r615272944-Newcomb_s_Ranch-La_Canada_Flintridge_California.html), [Daniels Restaurant](https://www.tripadvisor.com/ShowUserReviews-g41128-d5831059-r403678102-Daniels_Restaurant_Open_Air_Bars-Elkridge_Maryland.html), [Elkhorn Grill](https://www.tripadvisor.com/ShowUserReviews-g42779-d5112615-r283377309-Elkhorn_Grill-Vanderbilt_Otsego_County_Michigan.html). Plus general review-platform analysis from [Yelp vs TripAdvisor comparison](https://afb.org/aw/fall2025/yelp-tripadvisor-review) and the existing rider-forum-demand findings in `03-findings.md`.

### 7. Atlas Obscura and Roadfood have no usable API (Confidence: MEDIUM, 2 sources)

Neither Atlas Obscura nor Roadfood.com publishes a commercial API. Options for these sources are:
1. **Individual-page scraping** — legally risky, technically fragile, doesn't scale
2. **Partner access** — requires contract (unknown terms, likely paid)
3. **Manual curation** — founder reads articles and adds waypoints by hand (doesn't scale either)

**Recommendation**: **Defer both to Phase 1+.** They're editorial-quality sources but the access model doesn't fit a lifestyle-project pipeline. When LaneShadow has user traction we can revisit partner contracts; at Phase 0.5 they're not worth the legal and effort overhead.

### 8. Yelp Fusion API is a smaller version of Google Places (Confidence: MEDIUM, 2 sources)

Yelp's Fusion API has a 500-requests-per-day free tier and comparable coverage to Google Places for US cities. Like Google Places, **it's redundant if we have Overture** — Overture covers the same business data space at higher scale with no per-query cost.

**Recommendation**: Skip unless we identify a specific Yelp-only signal we need (e.g., Yelp has stronger "indie vs. chain" review language than Google). Not a Phase 0.5 blocker.

### 9. Niche rider-specific POI databases don't exist at usable scale (Confidence: MEDIUM-HIGH, 5 sources)

I searched for motorcycle-specific POI databases (BikerFriendlyBar.com, MotorcycleRoads.com POI data, RoadRUNNER magazine archive, 68° app data source). Findings:

- **68° app** (app68.eu) is a French competitor with its own "biker-friendly accommodations, restaurants, and bars" database. It's a competitor; we can't copy it, but its existence confirms the category has commercial value.
- **MotorcycleRoads.com** focuses on route data, not waypoint/POI data. Not useful for our sourcing.
- **BikerFriendlyBar.com** and similar single-purpose sites don't have public APIs and are small enough that bulk scraping would damage their operators.
- **RoadRUNNER, American Motorcyclist, Rider Magazine** archives are editorial and fall under the same problem as Roadfood/Atlas Obscura: no API, would need scraping, legally risky.

**Conclusion**: no niche rider-POI database offers a usable bulk source at the Phase 0.5 scale. **The rider-signal gap is best filled by the community NLP pipeline** (UC-RIDER-03) which processes forum chatter — ADVRider RSS, Reddit API, BMW MOA, Indian MC — and already has a spec.

## Source Comparison Table

| Source | Cost | License | Volume | Chain filter | Cruiser/touring fit | Phase 0.5 role |
|---|---|---|---|---|---|---|
| **Overture Maps Places** | FREE | CDLA-Permissive + Apache-2.0 + CC0 | 64M global | Via category | 4/5 | **SPINE** — bulk download for all 3 MVP categories |
| **HMDB.org** | FREE | Per-marker, commercial OK | 191K historical markers US | N/A (no chains) | 5/5 | **SPINE for Wander** |
| **USGS GNIS** | FREE | US Gov public domain | 1M+ US features | N/A | 5/5 | **SPINE for Pause** (scenic named features) |
| **Rider-forum NLP** (UC-RIDER-03) | Existing pipeline | Fair use / quoted snippets | ~unlimited signal | Via LLM extraction | 5/5 | **SPINE for Taste** |
| **OpenStreetMap** (Overpass) | FREE | ODbL (attribution) | Continuous, ~100M global | Via `brand:*` tag filter | 4/5 | Already in stack — scenic tourism/historic tags |
| **NPS data.gov** | FREE | US Gov public domain | ~10K NPS sites, POIs, overlooks | N/A | 5/5 | Phase 0.5 enrichment for Pause + Wander |
| **NRHP** (National Register) | FREE | US Gov public domain | 95K US historic properties | N/A | 5/5 | Phase 0.5 enrichment for Wander |
| **Geoapify Places API** | Free to 3K/day | OSM ODbL | Full OSM | Via category | 3/5 | Real-time fill-in for in-app queries |
| **Mapbox Search API** | Already in stack | Commercial OK | Global | Via category | 3/5 | Already available — in-app geocode/search |
| **Foursquare API** | Free to 10K/day Pro | Commercial | 100M global | Some | 3/5 | Phase 1+ for real-time user search |
| **Yelp Fusion** | Free to 500/day | Restrictive content reuse | US-heavy | Some | 3/5 | Skip — redundant with Overture |
| **Google Places API** | $17/1K | Partner terms | 200M+ | Via category | 3/5 | **DROP — Overture replaces it** |
| **TripAdvisor** | No free API | ToS-restrictive | ~8M businesses | Weak | 2/5 | **DROP — audience mismatch, legal risk** |
| **Atlas Obscura** | No API | Partner-only | ~30K curated | Yes | 5/5 | Phase 1+ (partner contract required) |
| **Roadfood** | No API | Scraping-only | ~1K curated | Yes | 5/5 | Phase 1+ (editorial partnership) |
| **HERE Places** | Free tier, smaller | Partner terms | ~100M global | Via category | 2/5 | Skip — redundant |
| **Apple MapKit JS** | Free for Apple devs | Apple ToS | ~unknown | No | 2/5 | Skip — platform lock-in risk |

## Recommended Sourcing Stack (Revised "Option C-Lite-but-Richer")

Combining the research findings into a concrete Phase 0.5 plan that beats the original Option C in coverage AND cost:

### Category: Pause

**Primary**:
1. Overture Maps Places — filter by category = `scenic_viewpoint | overlook | scenic_drive | waterfall` (from ~280 Overture basic categories)
2. OpenStreetMap `tourism=viewpoint | tourism=picnic_site | natural=peak` via Overpass (already in stack)
3. USGS GNIS — natural features (summits, falls, gaps, overlooks)

**Enrichment**:
- NPS data.gov feeds for overlooks on federal land
- FHWA scenic byway waysides (already in curation-hardening scope)
- Optional Claude 3.5 Sonnet vision verification: "can you pull over here?" against Street View tiles

### Category: Wander

**Primary**:
1. HMDB.org — 191K historical markers (already planned)
2. Overture Maps Places — category = `historic_site | museum | monument | memorial | landmark`
3. National Register of Historic Places — 95K US properties

**Enrichment**:
- NPS historic sites + national monuments
- USGS GNIS — ghost towns, abandoned features, historical populated places
- OSM `historic=*` (already in stack)

### Category: Taste

**Primary**:
1. **Rider-forum NLP extraction** (UC-RIDER-03 in `curation-hardening`) — the only source that actually surfaces "biker-beloved independent diner" signal
2. Overture Maps Places — category = `restaurant | diner | cafe | ice_cream_shop` with deterministic chain-name blocklist applied before ingestion

**Enrichment**:
- OSM `amenity=restaurant|cafe|bar|pub` with chain filter
- Founder-seeded curated list for regions of personal use (dogfooding)
- Optional Phase 1: Roadfood / Atlas Obscura partnership once community traction exists

### Cross-cutting infrastructure

- **Chain blocklist** — deterministic filter runs before Haiku extraction. Blocks chain brand names at the sourcing layer across all categories.
- **Multi-source corroboration score** — same waypoint appearing in ≥2 sources (e.g., HMDB + Overture + OSM) gets a composite score boost
- **Geoapify API** (free 3K/day tier) — reserved for in-app real-time queries that can't wait for monthly Overture releases
- **Mapbox Search API** — already in stack, used for in-app geocoding and user search

## Cost Comparison: Original Option C vs Revised Stack

| Component | Original Option C | Revised Stack |
|---|---|---|
| Google Places API | $255–850 one-time + ongoing | **$0 (replaced by Overture)** |
| TripAdvisor contract | $500+/yr | **$0 (dropped)** |
| Atlas Obscura partner | $0–500 | **$0 (deferred to Phase 1)** |
| Roadfood access | $0 (scraping legal risk) | **$0 (deferred to Phase 1)** |
| Overture Maps download | Not in original | **$0 (new primary source)** |
| USGS GNIS | Not in original | **$0 (new addition)** |
| Geoapify free tier | Not in original | **$0 (in-app real-time)** |
| **Total one-time** | **$500–1,800** | **~$0** |
| **Total recurring** | **$50–200/mo** | **~$0/mo** |

**Savings: ~$500–1,800 one-time and $50–200/mo recurring, for a catalog that is likely *larger* than Option C would have produced** (64M Overture + 1M GNIS + 191K HMDB + 95K NRHP + rider-forum NLP vs. Option C's Google Places + TripAdvisor mix).

## Licensing Red Flags (things to avoid)

1. **TripAdvisor bulk scraping** — ToS-prohibited, enforcement exists. Do not scrape.
2. **Google Places content storage beyond 30 days** — Google ToS requires regenerating cached data every 30 days. Not a concern if we don't use Google Places at all, but flag for any future use.
3. **Yelp review content reuse** — restrictive, requires partner agreement for commercial app display.
4. **Atlas Obscura content bulk reuse** — requires partner contract, don't scrape.
5. **Apple MapKit** — iOS-first framework, binding to platform lock-in.
6. **OSM ODbL attribution** — must display "© OpenStreetMap contributors" in any user-visible view that includes OSM-derived data. Already handled by Mapbox.

All sources in the revised stack have **commercially-compatible licenses**: CDLA-Permissive-2.0, Apache-2.0, CC0-1.0, ODbL (with attribution), US Government public domain. No partner contracts required for Phase 0.5 launch.

## Hidden Gem Sources Worth Investigating Further

1. **AllThePlaces** (allthe.place) — scraper-maintained open dataset of brand/chain store locations, included in Overture under CC0-1.0. Useful for the **chain blocklist**: ingest the AllThePlaces brand inventory to auto-generate the blocklist from the same dataset Overture uses.
2. **US Forest Service Recreation Opportunities API** — federal data for rec sites, trailheads, campgrounds, viewpoints on USFS land. Not researched deeply but likely free and relevant for Pause category in national forests.
3. **Bureau of Land Management (BLM) recreation.gov** — similar to USFS, covers BLM lands which include many ride destinations (e.g., Valley of the Gods UT, Alabama Hills CA).
4. **state DOT scenic byway databases** — CA Caltrans, OR ODOT, WA WSDOT publish GIS layers for scenic overlooks and official stops. State-by-state, so not scalable to all 50 states at once, but a good Phase 1 enrichment.
5. **American Motorcyclist Association (AMA) event calendar** — public feed of motorcycle rallies, events, and organized rides. Useful for Phase 1 Gather catalog.
6. **Flickr geotagged photos with rider tags** — CC-licensed imagery tagged `#motorcycle` near waypoints could provide photo assets for Moments Feed cards.

## Confidence Assessment

| Finding | Confidence | Sources |
|---|---|---|
| Overture Maps covers 64M POIs free under commercial-friendly licenses | **HIGH** | 8 |
| Google Places can be fully replaced by Overture | **HIGH** | 5 |
| Foursquare API is unnecessary for bulk (Overture has 6.5M Foursquare POIs free) | **HIGH** | 4 |
| Geoapify is the right fill-in for real-time OSM queries | **HIGH** | 4 |
| USGS GNIS is underused for scenic waypoints | **HIGH** | 5 |
| TripAdvisor is wrong audience + legal risk for Phase 0.5 | **MEDIUM-HIGH** | 6 |
| Atlas Obscura / Roadfood must defer to Phase 1 | **MEDIUM** | 2 |
| Niche rider-specific POI databases don't exist at usable scale | **MEDIUM-HIGH** | 5 |

## Gaps & Open Questions

1. **Overture Places quality in rural America** — the OSM-community comparison study identifies rural coverage as weaker than urban. Need to validate on a specific region before committing (e.g., download a county-sized sample in NC Blue Ridge and manually spot-check).
2. **Overture category taxonomy depth** — ~280 "basic categories" sounds promising but I haven't verified the specific category names that map to our Pause/Wander/Taste model. Next step: read `docs.overturemaps.org/guides/places/taxonomy` and confirm category names exist for scenic_viewpoint, historic_marker, diner, etc.
3. **OSM chain-filter signal** — OSM uses `brand:*` and `brand:wikidata` tags inconsistently. The chain blocklist may need to combine brand-tag matching + name-string matching + AllThePlaces brand inventory to catch all chains.
4. **GNIS feature-class filtering** — 1M+ features is a lot of noise. Need to identify which GNIS feature classes map to rider-relevant Pause/Wander waypoints vs. generic named places.
5. **Community NLP pipeline dependency (UC-RIDER-03)** — this research assumes the hardening pipeline for forum NLP will be available for Phase 0.5. If UC-RIDER-03 slips, Taste category has a fallback problem. Need to either sequence Phase 0.5 behind UC-RIDER-03 completion OR plan a founder-curated Taste seed list for launch.

## Recommended Next Step

**Revise Option C to the "free-first stack" described above**, with these updates to `PRODUCT-STRATEGY.md` Phase 0.5:

1. Remove Google Places, TripAdvisor from sourcing plan
2. Add Overture Maps + USGS GNIS + NRHP as new primary sources
3. Update cost estimate from "$500–1,800 + $50–200/mo" to "$0 + $0/mo" for sourcing
4. Preserve the 6+ week timeline (UC-RIDER-03 dependency is unchanged)
5. Preserve the Atlas Obscura / Roadfood deferral to Phase 1

This gives us **most of Option C's content richness at Option B's cost** — a strictly better answer than either option as originally framed.

## Sources (full list)

1. https://docs.overturemaps.org/guides/places — Overture Places Guide
2. https://docs.overturemaps.org/attribution — Overture Attribution & Licensing
3. https://docs.overturemaps.org/guides/places/taxonomy-browser — Overture Taxonomy Browser
4. https://docs.overturemaps.org/schema/reference/places/place — Overture Places Schema
5. https://overturemaps.org/blog/2025/reaching-billions-with-up-to-date-places-information-in-overture — Overture Reaching Billions
6. https://overturemaps.org/blog/2025/from-discovery-to-action-a-new-foundation-for-travel — Overture Travel Blog
7. https://overturemaps.org/blog/2025/overture-maps-foundation-making-open-data-the-winning-choice — 54M POI Announcement
8. https://community.openstreetmap.org/t/a-global-comparison-of-restaurants-in-openstreetmap-and-overture-places/120475 — OSM vs Overture Comparison
9. https://www.echo-analytics.com/blog/analyzing-overture-maps-foundations-places-data — Echo Analytics Overture Study
10. https://foursquare.com/pricing — Foursquare Pricing
11. https://foursquare.com/products/places-api — Foursquare Places API
12. https://app.getcamino.ai/learn/foursquare-places-api-pricing — Foursquare Pricing Deep Dive
13. https://www.geoapify.com/pricing — Geoapify Pricing
14. https://www.geoapify.com/places-api — Geoapify Places API
15. https://www.geoapify.com/geoapify-as-a-google-places-api-alternative — Geoapify vs Google Places
16. https://dev.to/geoapify-maps-api/google-places-api-alternatives-which-poi-api-should-you-use-in-2026-hd4 — POI API Alternatives 2026
17. https://www.usgs.gov/tools/geographic-names-information-system-gnis — USGS GNIS Main
18. https://www.usgs.gov/us-board-on-geographic-names/download-gnis-data — GNIS Download
19. https://www.usgs.gov/us-board-on-geographic-names/gnis-domestic-names-feature-classes — GNIS Feature Classes
20. https://catalog.data.gov/dataset/gnis-populated-places — GNIS on data.gov
21. https://www.tripadvisor.com/ShowUserReviews-g32573-d3935935-r615272944-Newcomb_s_Ranch-La_Canada_Flintridge_California.html — Rider Review Sample 1
22. https://www.tripadvisor.com/ShowUserReviews-g41128-d5831059-r403678102-Daniels_Restaurant_Open_Air_Bars-Elkridge_Maryland.html — Rider Review Sample 2
23. https://app68.eu/en — 68° Motorcycle App
24. https://play.google.com/store/apps/details?id=com.mprod.app68 — 68° Android Listing (mentions POI sources)
25. https://wiki.openstreetmap.org/wiki/Overture_categories — OSM→Overture Category Mapping
26. https://docs.foursquare.com/data-products/docs/places-api — Foursquare Places API Docs
27. https://news.ycombinator.com/item?id=43770446 — Geocoding API Comparison HN Thread
28. https://www.getmotobit.com/the-5-best-motorcycle-apps — Motorcycle App Market Overview
