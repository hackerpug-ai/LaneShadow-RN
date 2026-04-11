# PIPE-006: OSM Curvature Scoring

**Task ID:** PIPE-006
**Epic:** Epic 2 - Web Scraping, LLM Extraction & Public APIs
**Assigned To:** general-purpose
**Priority:** P1
**Effort:** L
**Estimate:** 300 min
**Type:** [FEATURE]
**Status:** Backlog

---

## DEPENDENCIES

- **Depends on:** PIPE-001 (Python pipeline scaffold), PIPE-004 (LLM extraction)
- **Blocks:** PIPE-007 (composite scoring engine needs curvature scores)

---

## BACKGROUND

The geometric enrichment layer fetches route geometry from OpenStreetMap via the Overpass API and computes a deterministic curvature score based on bearing changes between consecutive points. This provides an objective, reproducible measure of how twisty a road is — complementing the LLM-extracted scenic/technical scores with actual geometric data. The curvature score is a key input to the composite scoring engine (PIPE-007) and the archetype classifier (PIPE-008).

**PRD References:**
- S9-TRD-3 (Geometric Enrichment)
- S10-TRD Section 4 (Geometric Enricher)
- S10-TRD AD-3 (Curvature from existing geometry)
- S10-TRD AD-6 (Scoring is deterministic code, never LLM output)

**Key Constraints:**
- P1: No LLM for curvature — this is pure geometry computation
- P5: Curvature score is deterministic given same OSM data — same input always produces same output
- The geometric enricher also surfaces candidate routes not covered by any listicle (primary mechanism for catalog originality)

---

## ACCEPTANCE CRITERIA

### AC-001: OSM Geometry Fetched via Overpass API
**GIVEN** a route with a known location (centroid lat/lng) and approximate length
**WHEN** the geometric enricher queries OSM
**THEN** it constructs an Overpass API query to fetch nearby highway ways
**AND** it retrieves the geometry (sequence of [lat, lng] coordinates) for matching ways
**AND** it selects the way(s) most likely matching the route based on name/proximity

**Verify:** Query Overpass API for a known route (e.g., Tail of the Dragon near Deals Gap, NC), verify geometry is retrieved.

### AC-002: Curvature Score Computed (0-100)
**GIVEN** a route geometry as a sequence of coordinate points
**WHEN** the curvature scoring algorithm runs
**THEN** it computes bearing changes between consecutive segments
**AND** it aggregates bearing changes into a normalized curvature score (0-100)
**AND** score 0 = perfectly straight road, score 100 = maximum twistiness
**AND** the score is deterministic — same geometry always produces same score

**Verify:** Compute curvature for known routes: Tail of the Dragon should score high (>80), a straight interstate should score low (<10).

### AC-003: Deterministic Scoring
**GIVEN** the same OSM geometry data is processed twice
**WHEN** the curvature scoring runs both times
**THEN** the output score is identical both times
**AND** no random or non-deterministic operations are used in the computation

**Verify:** Run curvature scoring on the same geometry 100 times, verify identical output each time.

### AC-004: OSM Responses Cached
**GIVEN** the Overpass API returns geometry for a route
**WHEN** the response is received
**THEN** the raw Overpass response is cached locally (file-based cache)
**AND** subsequent requests for the same route use the cached response
**AND** cache entries include a timestamp for cache invalidation
**AND** cache is keyed by route_id + query parameters

**Verify:** Request same route twice, verify second request uses cache (check logs for "cache hit").

### AC-005: Graceful Missing Data Handling
**GIVEN** the Overpass API returns no matching geometry for a route
**WHEN** the geometric enricher processes the result
**THEN** it logs a warning with the route_id and query parameters
**AND** it sets curvature_score to null (not 0, to distinguish from "straight road")
**AND** it continues processing remaining routes without crashing

**Verify:** Query Overpass for a nonexistent area, verify graceful handling with null curvature and warning log.

---

## TEST CRITERIA

- [ ] Overpass API query constructed correctly for given lat/lng/radius
- [ ] Geometry coordinates extracted from Overpass response
- [ ] Curvature score computed as 0-100 range from bearing changes
- [ ] Deterministic: same input always produces same output (tested with 100 runs)
- [ ] Overpass responses cached to local file system
- [ ] Cache hit skips API call
- [ ] Missing geometry results in null curvature_score (not 0)
- [ ] Missing geometry logs a warning, does not crash
- [ ] Rate limiting on Overpass API requests (max 1 req/sec per Overpass policy)
- [ ] Unit tests pass: `cd scripts/curation && python -m pytest tests/test_curvature.py -v`

---

## READING LIST

- `.spec/prds/curation/09-technical-requirements.md` — Geometric Enricher component, External Dependencies
- `.spec/prds/curation/10-trd-detail.md` — Section 4 (Geometric Enricher), AD-3 (Curvature from existing geometry)
- Overpass API documentation: https://wiki.openstreetmap.org/wiki/Overpass_API
- Overpass QL guide: https://wiki.openstreetmap.org/wiki/Overpass_API/Overpass_QL
- Bearing calculation: https://www.movable-type.co.uk/scripts/latlong.html

---

## GUARDRAILS

**WRITE-ALLOWED FILES:**
- `scripts/curation/pipeline/enrichment/__init__.py` (NEW)
- `scripts/curation/pipeline/enrichment/curvature.py` (NEW)
- `scripts/curation/pipeline/enrichment/osm_client.py` (NEW)
- `scripts/curation/pipeline/enrichment/cache.py` (NEW)
- `scripts/curation/tests/test_curvature.py` (NEW)
- `scripts/curation/requirements.txt` (MODIFY — add overpy or httpx for Overpass)

**NEVER MODIFY:**
- `convex/` — this is a Python pipeline task
- Any file outside `scripts/curation/`
- Existing extraction files (PIPE-004 artifacts)

---

## CODE PATTERN

**Bearing Computation:**
```python
import math

def compute_bearing(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Compute bearing from point 1 to point 2 in degrees [0, 360)."""
    d_lng = math.radians(lng2 - lng1)
    lat1_r, lat2_r = math.radians(lat1), math.radians(lat2)
    x = math.sin(d_lng) * math.cos(lat2_r)
    y = math.cos(lat1_r) * math.sin(lat2_r) - math.sin(lat1_r) * math.cos(lat2_r) * math.cos(d_lng)
    bearing = math.degrees(math.atan2(x, y))
    return (bearing + 360) % 360

def compute_curvature_score(geometry: list[tuple[float, float]]) -> float:
    """
    Compute curvature score (0-100) from bearing changes.
    0 = perfectly straight, 100 = maximum twistiness.
    Deterministic: same geometry always produces same score.
    """
    if len(geometry) < 3:
        return 0.0

    total_bearing_change = 0.0
    for i in range(len(geometry) - 2):
        b1 = compute_bearing(geometry[i][0], geometry[i][1],
                             geometry[i+1][0], geometry[i+1][1])
        b2 = compute_bearing(geometry[i+1][0], geometry[i+1][1],
                             geometry[i+2][0], geometry[i+2][1])
        change = abs(b2 - b1)
        if change > 180:
            change = 360 - change  # normalize to [0, 180]
        total_bearing_change += change

    # Normalize: average bearing change per segment
    avg_change = total_bearing_change / (len(geometry) - 2)

    # Scale to 0-100: 0 deg avg = 0, 45+ deg avg = 100
    score = min(100.0, (avg_change / 45.0) * 100.0)
    return round(score, 1)
```

**Overpass API Client:**
```python
class OSMClient:
    OVERPASS_URL = "https://overpass-api.de/api/interpreter"
    RATE_LIMIT_SECONDS = 1.0  # Overpass policy: max 1 req/sec

    def __init__(self, cache_dir: Path):
        self.cache_dir = cache_dir
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        self.last_request_time = 0.0

    async def fetch_highway_geometry(
        self, lat: float, lng: float, radius_m: int = 2000
    ) -> list[dict]:
        """Fetch highway ways near a point from Overpass API."""
        cache_key = f"osm_{lat:.4f}_{lng:.4f}_{radius_m}"
        cached = self._read_cache(cache_key)
        if cached is not None:
            return cached

        # Rate limit
        elapsed = time.monotonic() - self.last_request_time
        if elapsed < self.RATE_LIMIT_SECONDS:
            await asyncio.sleep(self.RATE_LIMIT_SECONDS - elapsed)

        query = f"""
        [out:json][timeout:25];
        way["highway"](around:{radius_m},{lat},{lng});
        out geom;
        """
        response = await httpx.AsyncClient().post(
            self.OVERPASS_URL,
            data={"data": query},
            timeout=30,
        )
        self.last_request_time = time.monotonic()
        result = response.json().get("elements", [])
        self._write_cache(cache_key, result)
        return result
```

---

## AGENT INSTRUCTIONS

1. Read existing pipeline structure from PIPE-001 and extraction module from PIPE-004
2. Create `scripts/curation/pipeline/enrichment/osm_client.py` with Overpass API client — rate limited to 1 req/sec, file-based caching, query construction for highway ways
3. Create `scripts/curation/pipeline/enrichment/curvature.py` with deterministic curvature scoring — bearing changes between consecutive points, normalized to 0-100 range
4. Create `scripts/curation/pipeline/enrichment/cache.py` with file-based cache for OSM responses — keyed by route_id + query params, includes timestamp
5. Write tests in `tests/test_curvature.py` — test bearing computation with known coordinates, test curvature scoring (high twist = high score, straight = low score), test determinism (100 runs same input), test cache hit/miss, test graceful missing data
6. NEVER use LLM for curvature computation — this is pure geometry (P1, AD-6)
7. NEVER fabricate geometry data — if Overpass returns nothing, set curvature to null
8. Verify all tests pass: `cd scripts/curation && python -m pytest tests/test_curvature.py -v`

---

## ORCHESTRATOR VERIFICATION PROTOCOL

1. **Pre-dispatch:** Verify PIPE-001 and PIPE-004 are complete
2. **Post-completion verification:**
   ```bash
   # Verify files exist
   ls scripts/curation/pipeline/enrichment/curvature.py
   ls scripts/curation/pipeline/enrichment/osm_client.py
   ls scripts/curation/pipeline/enrichment/cache.py

   # Run tests
   cd scripts/curation && python -m pytest tests/test_curvature.py -v

   # Verify determinism (no random in curvature computation)
   grep -n "random\|randint\|randrange" scripts/curation/pipeline/enrichment/curvature.py
   # Should return nothing (no non-deterministic operations)
   ```
3. **Evidence gate:** All tests pass, curvature is deterministic (no random operations), caching works

---

## AGENT ASSIGNMENT

**Primary:** general-purpose
**Rationale:** Python pipeline task with geometry computation and Overpass API integration. Not Convex or React Native.

---

## EVIDENCE GATES

- [ ] Enrichment module files exist and import without error
- [ ] Unit tests pass with known geometry fixtures
- [ ] Curvature score is deterministic (100 runs produce identical output)
- [ ] Overpass API responses are cached to disk
- [ ] Cache hit skips API call (verified via logs)
- [ ] Missing geometry produces null score with warning log
- [ ] Rate limiting on Overpass API (1 req/sec)

---

## REVIEW CRITERIA

- Curvature algorithm uses bearing changes (not LLM) — pure geometry
- Score range is 0-100 with documented interpretation
- Deterministic: no random operations, no floating-point ambiguity
- Overpass API rate limited per their usage policy
- Cache keyed by route_id + query params for reproducibility
- Missing data is null (distinguishable from "straight road" = 0)
- Code follows existing `scripts/curation/pipeline/` patterns

---

## NOTES

- **Curvature is the single most important feature** for motorcycle route quality — riders specifically seek twisty roads. This score gets ~25% weight in the composite formula.
- **Overpass API rate limiting** is strict: max 1 request per second for anonymous users. The client must enforce this.
- **File-based caching** is sufficient because the pipeline is a batch job, not a service. Each route's Overpass response is cached locally and reused on re-runs.
- **Tail of the Dragon** (318 curves in 11 miles) should score very high (>80). A straight section of I-40 should score very low (<10).
- **The curvature score feeds the composite scoring engine** (PIPE-007) and archetype classifier (PIPE-008). Both depend on this score being deterministic and well-calibrated.
- **AD-3 decision:** The original TRD considered adamfranco/curvature (OSM PBF pipeline) but the codebase already has geometry in Convex. This implementation uses bearing changes as the MVP approach, with adamfranco as a Phase 2 enhancement.
