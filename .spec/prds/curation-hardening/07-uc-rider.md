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
| UC-RIDER-03 | Extract Route Mentions via LLM PostExtraction | Pipeline extracts structured PostExtraction payloads from community posts via a single Claude call per post |
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

## UC-RIDER-03: Extract Route Mentions via LLM PostExtraction

**Description:** Pipeline runs structured LLM extraction over each community post in the community_mentions staging table. A single Claude Haiku 4.5 call per post returns a `PostExtraction` (scripts/curation/pipeline/extraction/schema.py, Epic 3 INF-005) containing road_name_mentions, highway_refs, state_refs, landmark_refs, sentiment, aspect_scores, attributes, warnings, and extraction_confidence. The PostExtraction is persisted to the `route_posts_raw` Convex table as the raw artifact. A separate matching stage (UC-RIDER-04 or Epic 6 dedup) uses Convex vectorSearch + LLM rerank to decide which route(s) each mention refers to, writing the result to `route_matches`.

**Extraction Strategy:**
- Model: Claude Haiku 4.5 (`claude-haiku-4-5-20251001`) via Anthropic SDK (`anthropic>=0.39.0`). OpenAI is reserved for embeddings only.
- Structured output: Uses Anthropic tool-use with the `PostExtraction` Pydantic schema (Epic 3 INF-005) as the tool input. Pydantic enforces strict `Literal['positive'|'neutral'|'negative']` typing on sentiment and `ge=0.0, le=1.0` range constraints on extraction_confidence.
- Cost: ~$0.002 per post (600 input tokens + 300 output tokens typical). 100k posts ≈ $200 one-time. No keyword pre-filter needed — the single call is cheap enough that per-stage filtering is no longer a cost lever.
- Caching: Keyed by `(post_id, extraction_schema_version)`. Re-extraction only runs on version bumps (see `CACHE_POLICY` in `scripts/curation/pipeline/extraction/schema.py`). 30-day TTL.
- Error handling: Pydantic `ValidationError` on malformed LLM output → log + skip. Rate limit errors → exponential backoff retry (up to 3 attempts).
- Prompt injection defense: `PostExtraction.model_config = {'extra': 'forbid'}` strictly rejects unknown fields in the LLM output.

**Surface Type Extraction (7th Attribute Bucket):**

Two cascading sources for surface_type (revised 2026-04-12 — USFS MVUM dropped):

1. **OSM Tags (Primary)** — Existing enrichment source
   - Field: `osm_surface` from OSM way tags
   - Values: "asphalt" → "paved", "gravel", "dirt", "unpaved" → "dirt"
   - Field: `osm_smoothness` from OSM way tags
   - Values: "excellent" → "paved", "intermediate" → "gravel", "bad" → "dirt"
   - Coverage: All OSM-mapped roads — broad coverage sufficient for V3 lifestyle street-rider focus

2. **LLM PostExtraction (Secondary)** — Extracted from community posts via the `attributes` dict on `PostExtraction` (keys such as `surface_type_paved`, `surface_type_gravel`, `surface_type_dirt`). Used only when OSM is unavailable or ambiguous.

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

**PostExtraction Schema (INF-005 contract):**
```python
class PostExtraction(BaseModel):
    # Identifier mentions
    road_name_mentions: list[str]         # ["Tail of the Dragon", "The Dragon"]
    highway_refs: list[str]               # ["US-129", "SR-28"]
    state_refs: list[str]                 # ["TN", "NC"]
    landmark_refs: list[str]              # ["Fontana Dam", "Great Smoky Mountains"]

    # Sentiment & aspects
    sentiment: Literal["positive", "neutral", "negative"]
    aspect_scores: dict[str, float]       # {"curvature": 0.95, "scenery": 0.9, ...}
    attributes: dict[str, bool]           # {"has_gas": True, "beginner_friendly": False, ...}
    warnings: list[str]                   # ["gravel on switchbacks", "construction Mile 14"]

    # Extraction metadata
    extraction_confidence: float          # 0.0 - 1.0
    extraction_model: str                 # "claude-haiku-4-5-20251001"
    extraction_cost: float                # USD, >= 0
    extracted_at: datetime
    extraction_schema_version: int        # 2
```

**Acceptance Criteria:**
- ☐ Administrator can run extraction via `python -m scripts.curation.pipeline.extraction.extract_posts` (new module, implemented in Epic 9/10)
- ☐ System runs one LLM call per community post, producing a PostExtraction instance
- ☐ System uses Claude Haiku 4.5 with Anthropic tool-use for structured output
- ☐ System validates each extraction against the PostExtraction Pydantic schema
- ☐ System persists each extraction to `route_posts_raw` with postId, source, postUrl, rawText, extractionSchemaVersion, extractionModel, extractionCost, extractedAt, extractionConfidence, and the payload (serialized PostExtraction)
- ☐ System extracts sentiment as `Literal['positive', 'neutral', 'negative']`
- ☐ System extracts aspect_scores as `dict[str, float]` (known aspects: curvature, scenery, traffic, surface_quality, elevation_drama — unknown aspects allowed but ignored by scoring)
- ☐ System extracts attributes as `dict[str, bool]` (known: has_gas, has_food, wet_weather_ok, beginner_friendly, requires_adv_bike, closed_in_winter)
- ☐ System extracts warnings as `list[str]` for construction, closures, and hazards
- ☐ System records `extraction_cost` per call for cost tracking
- ☐ System logs per-run statistics: total posts processed, successful extractions, Pydantic validation failures, total cost USD, avg extraction_confidence
- ☐ System implements retry logic with exponential backoff for rate limit errors (up to 3 retries)
- ☐ System caches extraction results per `(post_id, extraction_schema_version)` tuple to avoid redundant calls

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
- ☐ System runs LLM PostExtraction (UC-RIDER-03) after fresh data is ingested
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
