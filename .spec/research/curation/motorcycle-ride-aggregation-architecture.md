# Motorcycle Ride Aggregation Pipeline — Architecture

**Date**: 2026-04-10  
**Status**: Proposed  
**Related**: `motorcycle-ride-sources-and-scoring.md`

---

## Overview

A one-time (or occasional) local Python script that:
1. Scrapes structured route databases and editorial sources
2. Extracts structured route attributes via LLM (Claude Haiku + Instructor)
3. Enriches with geometric data (OSM curvature, elevation, FHWA designation)
4. Computes a deterministic composite score
5. Classifies into ride archetypes
6. Pushes results into Convex

---

## Platform Decision

**Run locally.** This is a one-time job. No infrastructure needed.

- Rate limiting means it's slow by design (mostly waiting, not CPU-bound)
- Full 17k-route crawl will take several hours — leave it running
- Write results to disk incrementally so it's resumable on crash
- Push to Convex via HTTP action at the end

**If laptop uptime is a concern**: GitHub Actions manual trigger is the simplest "off your machine" option. Free up to 6 hours, no infra to maintain.

---

## LLM Decision

**Use Claude Haiku via API.** Do not use a local model.

| | Cloud (Haiku) | Local (Llama 3.1 8B) |
|--|--|--|
| Cost | ~$34 for full 17k-route job | Free |
| Structured output reliability | Excellent | Noticeably worse |
| Speed | Fast with parallel calls | Slow on CPU |
| Setup | Already have SDK | Install Ollama, pull model |

Cost math: 17k routes × ~1k input + ~300 output tokens = ~$34 with Haiku.
Run with `max_workers=5` concurrent API calls — finishes in under an hour.

**Exception**: M-series Mac with 32GB+ RAM — `ollama pull llama3.3:70b-instruct-q4` is competitive with Haiku on extraction tasks and is free. Still probably not worth it for a one-time run.

---

## Pipeline Architecture

```
Convex cron (optional, for recurring runs)
    │
    ▼
Local Python script (or GitHub Actions)
    ├── Scraper Layer
    │   ├── httpx + BeautifulSoup (static pages — most sources)
    │   └── Playwright (JS-rendered pages only, add if needed)
    │
    ├── LLM Extraction Layer
    │   └── Instructor + Claude Haiku → RouteAttributes (Pydantic)
    │
    ├── Geometric Enrichment Layer
    │   ├── OSM curvature (adamfranco/curvature)
    │   ├── Elevation via SRTM / Mapbox Elevation API
    │   └── FHWA scenic designation lookup (data.gov)
    │
    ├── Deterministic Scoring Engine
    │   └── Weighted formula over extracted + geometric features → 0.0–1.0
    │
    └── Archetype Classifier
        └── Decision tree → enum (Twisties / Mountain / Coastal / etc.)
            │
            ▼
    Convex HTTP action → upsert routes, store scores
```

---

## Scraping Layer

### Static pages (most sources)

```python
import httpx
from bs4 import BeautifulSoup
import time, random

def fetch(url: str, session: httpx.Client) -> str:
    resp = session.get(url, headers={"User-Agent": ROTATING_UA})
    resp.raise_for_status()
    return resp.text

def polite_delay():
    time.sleep(random.uniform(2.0, 4.0))  # 2–4s jitter
```

### Rate limiting rules

- **2–4 seconds** between requests to the same domain (randomized jitter)
- **Max 20 req/min** to any single domain
- **Exponential backoff** on 429/503: 2x delay up to 60s max
- **Reuse httpx session** — persistent cookies, not fresh per request
- **Rotate User-Agent** strings — real browser UA strings, not `python-requests`
- Always check `robots.txt` before scraping a domain

### JS-rendered pages (add Playwright only if httpx returns empty content)

```python
# Detection: if BeautifulSoup finds no route data → switch to Playwright
from playwright.sync_api import sync_playwright

def fetch_js(url: str) -> str:
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto(url, wait_until="networkidle")
        content = page.content()
        browser.close()
        return content
```

Use `playwright-stealth` if you hit Cloudflare/bot detection walls.

**Two-tier strategy**: default to `httpx` (10–50x faster). Only fall back to Playwright for routes that actually need it. Most motorcycle route sites (motorcycleroads.com, bestbikingroads.com, twtex.com) are static.

### Resumable write pattern

Write results to disk after **every route**, not at the end:

```python
import json
from pathlib import Path

RESULTS_FILE = Path("routes_extracted.jsonl")

def save_route(route: dict):
    with RESULTS_FILE.open("a") as f:
        f.write(json.dumps(route) + "\n")

def already_scraped(url: str) -> bool:
    if not RESULTS_FILE.exists():
        return False
    scraped = {json.loads(l)["source_url"] for l in RESULTS_FILE.read_text().splitlines()}
    return url in scraped
```

---

## Crawl Source Priority

| Priority | Source | Type | Data |
|----------|--------|------|------|
| 1 | **motorcycleroads.com** | Static, state-paginated | Name, state, length, rating, ride reports |
| 2 | **bestbikingroads.com** | Static | 17,976 rides, GPS, star ratings, vote counts |
| 3 | **twtex.com Top 100** | Static | Crowd-sourced numeric ranking, good calibration seed |
| 4 | **FHWA byways (data.gov)** | Download, no crawl | 184 designated roads, 6 intrinsic quality flags |
| 5 | **ridermagazine.com 50 Best** | Static | Editorial ground truth for scoring calibration |
| 6 | **OSM via adamfranco/curvature** | Compute, no crawl | Geometric curvature baseline for all US named roads |
| 7 | **Reddit** (r/motorcycles, r/advrider, r/motorcyclesroadtrip) | Reddit API | Community mentions, regional gems |
| 8 | **ADVRider trip planning forum** | Scrape, sort by view_count | High-signal threads |
| 9 | **ridebdr.com** | Static + GPX download | Adventure classification, difficulty |
| 10 | **RevZilla Common Tread** | Static | Rich qualitative descriptions for NLP training |

---

## LLM Extraction Layer

### Pydantic schema (Instructor)

```python
from pydantic import BaseModel, Field
from typing import Literal
import instructor
from anthropic import Anthropic

client = instructor.from_anthropic(Anthropic())

class RouteAttributes(BaseModel):
    # reasoning MUST come first — chain-of-thought before decisions
    reasoning: str = Field(description="Brief reasoning about the route's character")

    road_name: str
    state: str
    region: Literal["northeast", "southeast", "midwest", "southwest", "west", "pacific", "mountain"]

    # Categorical only — code computes numeric scores from these
    curviness: Literal["straight", "mild", "moderate", "twisty", "very_twisty"]
    scenery_type: list[Literal["mountain", "coastal", "forest", "desert", "canyon", "valley", "plains", "urban"]]
    scenery_quality: Literal["unremarkable", "pleasant", "beautiful", "spectacular"]
    traffic_level: Literal["low", "moderate", "high"]
    road_condition: Literal["poor", "fair", "good", "excellent"]
    challenge_level: Literal["beginner", "intermediate", "advanced", "expert"]
    surface: Literal["paved", "gravel", "dirt", "mixed"]

    approx_length_miles: float | None = None
    key_highlights: list[str] = Field(max_length=3, description="Up to 3 short phrases describing what makes this road notable")
```

### Extraction call

```python
from concurrent.futures import ThreadPoolExecutor

def extract_route(text: str) -> RouteAttributes:
    return client.chat.completions.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=600,
        temperature=0,   # no creativity for extraction
        messages=[
            {
                "role": "user",
                "content": f"""Extract structured attributes from this motorcycle route description.

Calibration examples:
- "twisty" = multiple direction changes per mile, like Tail of the Dragon (129 curves/11 miles)
- "very_twisty" = so technical it's considered dangerous or requires expert skill
- "spectacular" scenery = actively promoted as a destination for the views alone (Blue Ridge Parkway, PCH)

Route text:
{text}"""
            }
        ],
        response_model=RouteAttributes,
    )

# Run 5 concurrent extractions
with ThreadPoolExecutor(max_workers=5) as pool:
    results = list(pool.map(extract_route, route_texts))
```

### Schema design rules (from Instructor benchmarks)

- **Field names are semantic** — `reasoning` vs. `chain_of_thought` produces different output quality. Use the most natural English label.
- **`reasoning` field first** — forces chain-of-thought before the model fills in decisions. Improves accuracy ~60%.
- **Use `Literal` types**, not `str` — constrained output space reduces hallucination.
- **Flat or one-level nesting only** — deeply nested schemas degrade reliability.
- **Prefer Tool Calling over JSON mode** — JSON mode has 50% more performance variance.
- **`temperature=0`** for all extraction — no creativity needed.

---

## Deterministic Scoring Engine

The LLM classifies. Your code scores. Never ask the LLM for a number.

```python
CURVINESS_SCORE    = {"straight": 0, "mild": 2, "moderate": 5, "twisty": 8, "very_twisty": 10}
SCENERY_SCORE      = {"unremarkable": 0, "pleasant": 3, "beautiful": 7, "spectacular": 10}
CONDITION_SCORE    = {"poor": 0, "fair": 4, "good": 7, "excellent": 10}
TRAFFIC_SCORE      = {"low": 10, "moderate": 5, "high": 1}   # inverted: less traffic = better
CHALLENGE_SCORE    = {"beginner": 2, "intermediate": 5, "advanced": 8, "expert": 10}

def compute_score(attrs: RouteAttributes, geo: GeoFeatures) -> float:
    llm_score = (
        0.25 * CURVINESS_SCORE[attrs.curviness] +
        0.15 * SCENERY_SCORE[attrs.scenery_quality] +
        0.15 * TRAFFIC_SCORE[attrs.traffic_level] +
        0.10 * CONDITION_SCORE[attrs.road_condition]
    )

    geo_score = (
        0.15 * normalize(geo.osm_curvature, max=2000) +    # adamfranco/curvature output
        0.10 * normalize(geo.elevation_drama, max=1500) +  # meters over 10-mile window
        0.05 * geo.fhwa_designation_score +                # 0, 0.5, or 1.0
        0.05 * normalize(10 - geo.aadt_thousands, max=10)  # low traffic bonus
    )

    return round((llm_score + geo_score) * 10, 2)  # 0–10 scale
```

### Calibration process

Before running the full batch:
1. Extract the Rider Magazine Top 50 roads first (known ground truth)
2. Review the LLM outputs — do `"twisty"` and `"very_twisty"` map to what you expect?
3. Adjust category definitions in the prompt if needed
4. Run full batch only after calibration passes

### Cross-validation

For routes mentioned on multiple sources (e.g., Tail of the Dragon appears everywhere):
- Run extraction independently on each source's text
- Compare outputs — disagreement flags ambiguous text or bad scraping
- Merge by majority vote on each field

---

## Archetype Classifier

```python
from enum import Enum

class RideArchetype(str, Enum):
    TWISTIES      = "twisties"       # high curvature, paved, moderate elevation
    MOUNTAIN_EPIC = "mountain_epic"  # high elevation, curvature > median, scenic
    COASTAL       = "coastal"        # within 15mi coastline, scenic designation
    ADVENTURE     = "adventure"      # unpaved/gravel, BDR-tagged, remote
    SCENIC_BYWAY  = "scenic_byway"   # FHWA designation, editorial mentions
    DESERT        = "desert"         # low curvature, high remoteness, arid

def classify(attrs: RouteAttributes, geo: GeoFeatures) -> RideArchetype:
    if attrs.surface in ("gravel", "dirt", "mixed") or geo.bdr_tagged:
        return RideArchetype.ADVENTURE
    if geo.coastal_miles < 15 and geo.fhwa_designation:
        return RideArchetype.COASTAL
    if geo.elevation_gain_m > 1200:
        return RideArchetype.MOUNTAIN_EPIC
    if attrs.curviness in ("twisty", "very_twisty"):
        return RideArchetype.TWISTIES
    if geo.fhwa_designation:
        return RideArchetype.SCENIC_BYWAY
    return RideArchetype.DESERT
```

For a data-driven version: run **k-means (k=6)** on normalized feature vectors. The clusters will naturally match these archetypes without hand-tuned thresholds.

---

## Geometric Enrichment

### OSM Curvature

```bash
# Clone and run adamfranco/curvature on US OSM data
git clone https://github.com/adamfranco/curvature
# Download US OSM extract from Geofabrik, then:
python curvature.py --min_curvature 300 --output_formats csv us.osm.pbf
```

Outputs a CSV with `road_name`, `state`, `curvature` (weighted meters in turns) for every named US road. Join to your route database on road name + state.

### Elevation

```python
# Mapbox Terrain RGB (free tier sufficient for one-time run)
import httpx

def get_elevation_profile(coords: list[tuple]) -> list[float]:
    # Use Mapbox Tilequery API or SRTM via elevation.racemap.com
    ...
```

### FHWA Scenic Byways

Download directly from data.gov — no scraping needed:
```python
# https://catalog.data.gov/dataset?tags=scenic-byways
# Download as GeoJSON or CSV, join on road name + state
import pandas as pd
byways = pd.read_csv("scenic_byways.csv")
```

---

## Convex Integration

Push results via HTTP action after the local pipeline completes:

```python
import httpx

CONVEX_HTTP_URL = "https://your-deployment.convex.site/ingest-routes"

def push_to_convex(routes: list[dict]):
    with httpx.Client() as client:
        for batch in chunks(routes, 50):  # batch in groups of 50
            client.post(
                CONVEX_HTTP_URL,
                json={"routes": batch},
                headers={"Authorization": f"Bearer {CONVEX_DEPLOY_KEY}"},
                timeout=30,
            )
```

Convex HTTP action receives the batch → runs `ctx.runMutation` to upsert each route → stores `RouteAttributes`, `composite_score`, and `archetype`.

---

## Known Gaps

- motorcycleroads.com and bestbikingroads.com have no public API — verify ToS before scraping
- AADT traffic data varies by state format; may need per-state collection scripts
- **Seasonal access** (mountain pass closures) not captured anywhere — would need supplemental data
- GPX trace ↔ OSM road name matching requires a map-matching step if you want to merge app data (Rever, BDR) with OSM curvature scores (use Mapbox Map Matching API or Valhalla)
- Community ratings don't reflect road condition recency (repaving, construction damage)
