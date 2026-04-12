---
stability: FEATURE_SPEC
last_validated: 2026-04-12
prd_version: 1.0.0
functional_group: RIDER
---

# Use Cases: Community Sources & NLP (RIDER)

| UC ID | Title | Description |
|-------|-------|-------------|
| UC-RIDER-01 | Ingest ADVRider Regional Forum RSS Feeds | Pipeline ingests RSS from 17 ADVRider regional forums |
| UC-RIDER-02 | Ingest Reddit Motorcycle Subreddit Posts | Pipeline ingests posts from 3 motorcycle subreddits via public API |
| UC-RIDER-03 | Extract Route Mentions via GLM-Based NLP | Pipeline extracts structured route mentions from community text |
| UC-RIDER-04 | Merge Community Signals Into Route Scoring | Pipeline merges mention_frequency and sentiment into composite scores |
| UC-RIDER-05 | Schedule Incremental Community Ingestion | Administrator configures recurring community source ingestion |
| UC-RIDER-06 | Historical Backfill from Pushshift | Pipeline backfills Reddit data from 2020-2025 via Pushshift.io |

---

## UC-RIDER-01: Ingest ADVRider Regional Forum RSS Feeds

**Description:** Pipeline ingests RSS feeds from ADVRider's 17 regional forums. RSS bypasses the XenForo login wall and provides structured post metadata (title, author, date, preview text). This is the highest-signal community source for adventure and touring riders.

**Acceptance Criteria:**
- ☐ Administrator can run ADVRider ingestion via `python -m pipeline.sources.advrider`
- ☐ System fetches RSS feeds from all 17 ADVRider regional forums
- ☐ System parses post title, author, publication date, and preview text from RSS XML
- ☐ System filters posts to those mentioning route names, road names, or geographic locations
- ☐ System stores raw post data in a community_mentions staging table (not in curated_routes directly)
- ☐ System respects rate limits: maximum 1 request per 5 seconds to ADVRider
- ☐ System tracks last-fetched timestamp per forum for incremental ingestion
- ☐ System logs post count per forum, filtered post count, and any feed errors

---

## UC-RIDER-02: Ingest Reddit Motorcycle Subreddit Posts

**Description:** Pipeline ingests posts from r/motorcycles (2.3M subscribers), r/advrider, and r/motorcyclesroadtrip via the public Reddit API. Reddit provides broad community sentiment signals across all riding styles.

**Reddit Restriction Mitigation:**
Reddit's API restrictions (2024+) require conservative rate limiting and bot detection avoidance:

- **Async rate limiting:** 50 requests per minute with 1.3 second base delay between requests
- **Random jitter:** 0.1-0.5 second random jitter added to base delay to avoid detection patterns
- **User agent:** `linux:laneshadow-research:v1.0 (by /u/LaneShadowResearch)`
- **Request rotation:** Rotate through subreddits in round-robin fashion to distribute load
- **Fallback parsing:** old.reddit.com HTML parsing as fallback when API rate limits are hit

**Acceptance Criteria:**
- ☐ Administrator can run Reddit ingestion via `python -m pipeline.sources.reddit`
- ☐ System uses Reddit public API (OAuth2 application-only) to fetch posts from target subreddits
- ☐ System fetches posts from: r/motorcycles, r/advrider, r/motorcyclesroadtrip
- ☐ System retrieves post title, body, score (upvotes), comment count, and author
- ☐ System filters posts to those mentioning route names, road names, or geographic locations
- ☐ System stores raw post data in community_mentions staging table
- ☐ System implements async rate limiting: 50 requests per minute maximum
- ☐ System applies 1.3 second base delay between requests with 0.1-0.5 second random jitter
- ☐ System uses conservative user agent string to avoid bot detection
- ☐ System rotates subreddit requests in round-robin fashion
- ☐ System falls back to old.reddit.com HTML parsing when API rate limits are exceeded
- ☐ System tracks last-fetched post ID per subreddit for incremental ingestion
- ☐ System logs post count per subreddit, filtered post count, and any API errors
- ☐ System implements exponential backoff on HTTP 429 (Too Many Requests) responses

---

## UC-RIDER-03: Extract Route Mentions via GLM-Based NLP

**Description:** Pipeline runs GLM-based NLP extraction over the community_mentions staging table to identify specific routes being discussed, extract sentiment, and compute mention frequency. This turns unstructured forum chatter into structured route-level signals using Claude 3 Haiku (or GLM-4) for high-accuracy extraction.

**GLM Extraction Strategy:**

**Hybrid Approach for Cost Optimization:**
- **Stage 1 (Quick Filter):** Keyword-based filter for road-related posts
  - Keywords: "road", "route", "hwy", "highway", "ride", "twisty", "pass", "canyon"
  - Filters out ~90% of non-road-related posts
  - Zero cost, fast execution

- **Stage 2 (GLM Extraction):** LLM-based extraction for filtered candidates only
  - Model: Claude 3 Haiku (or GLM-4)
  - Cost: ~$0.0005 per post
  - Speed: ~200-500ms per post
  - Expected accuracy: 85-95% (vs 60-75% for regex)

**Cost Analysis:**
- Full backfill (7.4M ADVRider posts without filtering): $3,700
- Hybrid approach (10% candidate rate): $370
- Incremental daily updates: ~$0.50-1.00 per day

**Surface Type Extraction (7th Attribute Bucket):**

Three cascading sources for surface_type field:

1. **USFS MVUM (Primary)** — Already ingested in pipeline
   - Field: `surface_type` from MVUM dataset
   - Values: "paved", "gravel", "dirt", "improved", "native"
   - Mapping to canonical: "improved" → "gravel", "native" → "dirt"
   - Coverage: Forest Service roads only (~400k miles)

2. **OSM Tags (Secondary)** — Existing enrichment source
   - Field: `osm_surface` from OSM way tags
   - Values: "asphalt" → "paved", "gravel", "dirt", "unpaved" → "dirt"
   - Field: `osm_smoothness` from OSM way tags
   - Values: "excellent" → "paved", "intermediate" → "gravel", "bad" → "dirt"
   - Coverage: All OSM-mapped roads

3. **GLM NLP (Tertiary)** — New extraction from community posts
   - Prompt: "Extract road surface type from this forum post: paved, gravel, dirt, mixed, or unknown?"
   - Values: "paved", "gravel", "dirt", "mixed", "unknown"
   - Used only when MVUM and OSM are unavailable

**NLP Attribute Buckets (7 total):**
1. Twisty level (low/medium/high)
2. Scenery quality (poor/fair/good/excellent)
3. Traffic level (low/medium/high)
4. Road condition (poor/fair/good/excellent)
5. Elevation drama (flat/rolling/mountainous)
6. Technical difficulty (easy/intermediate/hard)
7. **Surface type (paved/gravel/dirt/mixed)** ← NEW

**Adventure Archetype Integration:**
- Adventure riders can filter routes by surface type
- Surface type displayed in route details
- Gravel/dirt routes prioritized for adventure archetype classification

**Extraction Schema:**
```json
{
  "route_mentions": [
    {
      "road_name": "Tail of the Dragon",
      "highway_number": "US-129",
      "state": "NC/TN",
      "confidence": 0.92,
      "context_snippet": "Best ride ever on the Dragon..."
    }
  ],
  "sentiment": {
    "score": 0.8,
    "label": "positive",
    "aspects": {
      "scenery": 0.9,
      "twistiness": 0.95,
      "traffic": 0.3,
      "road_quality": 0.85,
      "surface_type": "gravel"
    }
  },
  "route_attributes": {
    "twisty": true,
    "scenic": true,
    "low_traffic": true,
    "technical": false,
    "surface_type": "gravel"
  }
}
```

**Acceptance Criteria:**
- ☐ Administrator can run NLP extraction via `python -m pipeline.rider.extract_mentions`
- ☐ System implements Stage 1 quick filter using keyword matching (zero-cost pre-filter)
- ☐ System runs GLM extraction (Stage 2) only on posts passing Stage 1 filter
- ☐ System uses Claude 3 Haiku or GLM-4 for structured extraction with JSON schema validation
- ☐ System identifies route/road name mentions with 85%+ accuracy (measured against ground truth)
- ☐ System resolves ambiguous mentions (e.g., "the Dragon" → "Tail of the Dragon, NC/TN") using geographic context
- ☐ System extracts per-mention sentiment (positive/neutral/negative) using GLM's native understanding
- ☐ System extracts aspect-based sentiment (scenery, twistiness, traffic, road quality, surface_type) for richer signals
- ☐ System extracts surface_type from community posts when MVUM/OSM data unavailable (paved/gravel/dirt/mixed/unknown)
- ☐ System computes mention_frequency per route: total mentions across all community sources within configurable time window (default: 12 months)
- ☐ System computes weighted_mentions using source authority weights: ADVRider post = 1.0, Reddit post = 0.7, Reddit comment = 0.3
- ☐ System writes extracted signals (route_id, mention_frequency, weighted_mentions, avg_sentiment, aspect_scores) to route_community_signals table
- ☐ System implements token tracking and cost logging per extraction batch
- ☐ System logs extraction statistics: total posts processed, Stage 1 filter rate, GLM extractions, routes matched, avg confidence, total cost
- ☐ System implements retry logic with exponential backoff for GLM API rate limits
- ☐ System caches extraction results per post_id to avoid redundant GLM calls

---

## UC-RIDER-04: Merge Community Signals Into Route Scoring

**Description:** Pipeline merges the extracted community signals (mention_frequency, sentiment) from UC-RIDER-03 into the composite scoring pipeline. This connects the new mention_frequency weight added in UC-SCORE-01 to actual data.

**Acceptance Criteria:**
- ☐ Administrator can run signal merge via `python -m pipeline.rider.merge_signals`
- ☐ System joins route_community_signals to curated_routes by route_id
- ☐ System normalizes mention_frequency to 0-1 scale using percentile ranking across all routes
- ☐ System applies mention_frequency as the 10% weight defined in UC-SCORE-01
- ☐ System applies sentiment as a modifier: positive sentiment > 0.6 gives +0.05 bonus to community_rating component; negative sentiment < 0.3 gives -0.05 penalty
- ☐ System handles routes with no community signals gracefully (mention_frequency = 0, no sentiment modifier)
- ☐ System re-computes composite scores for all routes after signal merge
- ☐ System logs signal merge statistics: routes with community signals, routes without, score distribution shift

---

## UC-RIDER-05: Schedule Incremental Community Ingestion

**Description:** Administrator configures a recurring schedule for community source ingestion (ADVRider RSS + Reddit API) to keep community signals fresh without manual intervention. This is the "flywheel" mechanism that makes community data a living signal rather than a one-time snapshot.

**Acceptance Criteria:**
- ☐ Administrator can configure ingestion schedule via environment variable or config file (default: weekly)
- ☐ System runs ADVRider RSS fetch (UC-RIDER-01) and Reddit API fetch (UC-RIDER-02) on schedule
- ☐ System runs NLP extraction (UC-RIDER-03) after fresh data is ingested
- ☐ System runs signal merge (UC-RIDER-04) after extraction completes
- ☐ System supports GitHub Actions cron trigger for scheduled runs
- ☐ System sends summary notification (log or webhook) after each scheduled run with post count, new mentions, and any errors
- ☐ System skips re-processing posts already in community_mentions staging table (idempotent)

---

## UC-RIDER-06: Historical Backfill from Pushshift

**Description:** Pipeline backfills Reddit data from 2020-2025 via Pushshift.io, a third-party service that archives Reddit posts. This provides historical community signal for routes that were discussed before the pipeline's initial ingestion window.

**Method:**
- **Source:** Pushshift.io API (archives Reddit posts/comments)
- **Time range:** 2020-01-01 to 2025-01-01 (pre-pipeline-launch)
- **Volume target:** ~10,000 posts per subreddit (30,000 total across 3 subreddits)
- **Rate limiting:** Pushshift allows 200 requests per minute; use conservative 100 req/min
- **Deduplication:** Cross-reference with existing community_mentions to avoid duplicates

**Acceptance Criteria:**
- ☐ Administrator can run historical backfill via `python -m pipeline.sources.pushshift`
- ☐ System queries Pushshift.io API for posts from target subreddits within date range
- ☐ System fetches post title, body, score, comment count, author, and created timestamp
- ☐ System filters posts to those mentioning route names, road names, or geographic locations
- ☐ System stores raw post data in community_mentions staging table
- ☐ System deduplicates against existing Reddit posts by Reddit post ID
- ☐ System respects Pushshift rate limits: 100 requests per minute maximum
- ☐ System implements exponential backoff on HTTP 429 responses
- ☐ System logs backfill statistics: posts fetched, posts filtered, duplicates removed, posts stored
- ☐ System handles Pushshift API errors gracefully and retries failed requests
