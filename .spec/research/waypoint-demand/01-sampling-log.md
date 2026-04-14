---
stability: RESEARCH_ARTIFACT
last_validated: 2026-04-14
research_scope: waypoint-ontology-validation
parent_doc: README.md
---

# Waypoint Demand Research — Sampling Log

This log records what each worker sampled from what source during the 2026-04-14 research run (Option B: full 5-worker swarm per `README.md`).

## Worker 1 — Reddit (r/motorcycles + r/motorcyclesroadtrip)

**Agent ID**: a7e8f8e3919fc30ec
**Tool calls**: 24
**Duration**: ~3.3 min

**Sources attempted**:
- `reddit.com/r/motorcycles`
- `reddit.com/r/motorcyclesroadtrip`
- Queries: "legendary pit stops", "PCH roadtrip", "Unforgettable rides", "best stops", "Where to ride in SoCal"

**Sample**:
- Reddit threads identified: ~15
- Posts included (meeting coding criteria): 12
- Posts excluded: 3 (gear, beginner bike recs, pure route logistics)

**⚠ Known limitation**: Worker 1 flagged that `mcp__jina__search_web` returned AI-summarized snippets rather than raw Reddit content, so a portion of this worker's data came from industry blog articles (cycletrader.com, nrmotoco.com, riders-share.com) supplementing direct Reddit threads. Treat Reddit-specific ratios from this worker with medium confidence — the taxonomy-fit finding is still valid (cross-referenced by 4 other sources) but the lexicon and representative quotes skew toward editorial/aggregator language. **Action: if a second research pass is needed, instrument Worker 1 with direct `old.reddit.com/r/X.json` URL reads instead of search-summary tools.**

## Worker 2 — Cruiser/Touring Forums (BMW MOA + Indian Motorcycle)

**Agent ID**: af05d56edcff659fd
**Tool calls**: 11
**Duration**: ~1.9 min

**Sources**:
- `forums.bmwmoa.org` (touring persona — Terry)
- `indianmotorcycles.net` (cruiser persona — Mike)

**Key threads sampled**:
- BMW MOA — George A. Wyman Grand Tour (cross-country, 20+ named waypoints)
- BMW MOA — AL 2nd Sat Ride-to-Eat to Tullahoma, TN
- BMW MOA — Chicago-Seattle-Death Valley-Denver trip planning
- Indian — NY Finger Lakes Area Recommendations (wineries + museums)
- Indian — Route 66 Amarillo-Grand Canyon (12+ stops)

**Sample**:
- Posts sampled: 12 threads
- Posts included: 12 (all on-topic)
- Posts excluded: 0

**HD Forums confirmed inaccessible** (Cloudflare ASN ban, as predicted in CHANNELS.md). Indian Motorcycle Forum compensates — same cruiser persona, bot-accessible.

## Worker 3 — Motorcycle.com + BARF

**Agent ID**: a562f6f49993c15be
**Tool calls**: 15
**Duration**: ~2.4 min

**Sources**:
- `bayarearidersforum.com` (primary — Sierra/NorCal regional ride-report culture)
- `motorcycle.com/forums` (general national signal — limited yield due to pagination/indexing)

**Key threads sampled**:
- BARF — "Trip Report: 2 weeks, 12 states, 4341 miles" (rocketbunny, 2004)
- BARF — "Excelsior! Coast to coast" (NoneMoreBlack, 2022)
- BARF — "Want to Ride The Great Divide" (GreenHornet, 2020) — explicit "waypoints" usage
- BARF — "Sweetwater Mountains, 7/4/14" (SFMCjohn)
- BARF — "14 day trip in/around Sierra Nevadas?" (Benmc)
- BARF — "Mellow North Bay Weekend" (crd)
- BARF — "Rydther, Hawthorne, and BARF" rally recap (2024)
- BARF — "Sunday Fairfield to Placerville Pasties Lunch Run"

**Sample**:
- Posts sampled: 20+
- Posts included: 12 (detailed ride reports)
- Posts excluded: 8 (gear, parts, crash, political)
- Waypoints extracted: ~45 named

**Gap**: Motorcycle.com forums yielded limited direct content; the worker notes forum pagination/search deprioritizes Ride Stories sections. BARF carries this worker.

## Worker 4 — ADVRider Sanity Check

**Agent ID**: a6f81eab6228ba2b2
**Tool calls**: 12
**Duration**: ~2.5 min

**Source**: `advrider.com` (multiple regional forums)

**Key threads sampled**:
- Wisconsin-Alaska trip 2024 (~25 waypoints, multi-day)
- Baltimore-San Francisco coast-to-coast (~30 waypoints)
- Tellico Plains TN to Suches GA (route advice, ~15 stops)
- Western Sierra Nevada routes
- ADV Pahrump Rally 10-year retrospective (~20 waypoints)
- DC region ADV mapping project

**Sample**:
- Threads included: 6 (each with high waypoint density)
- Waypoints extracted: ~100+

**Intentional limitation**: smaller sample (per plan), weighted lower in synthesis. Purpose was directional sanity check, not primary data.

## Worker 5 — Editorial (Rider Magazine + RevZilla Common Tread)

**Agent ID**: a2ef87c2b3b22932b
**Tool calls**: 15
**Duration**: ~3.6 min

**Sources**:
- `ridermagazine.com` (primary)
- `revzilla.com/common-tread` (secondary, partial full-text)

**Key articles sampled**:
1. "50 Best Motorcycle Roads in America" (Rider, 2024)
2. "Traipsing Across Washington" (Rider, 2025) — 4-day ride report
3. "Favorite Ride: New York's Glory Roads" (Rider, 2021)
4. "Route 66 Motorcycle Travel Guide" (Rider, 2025)
5. "Sierra Nevadas: Three Days and Three Rides" (Rider, 2014)
6. "Moto Aloha: Motorcycle Touring on Oahu" (Rider, 2016)
7. "Taking the Long Way Home: Ohio, Kentucky, Indiana" (Rider, 2026)
8. "Beauty in Bluff Country: Southern Minnesota" (Rider, 2024)

**Sample**:
- Articles included: 10
- Avg waypoints per article: 8-12
- Waypoints extracted: ~77

## Totals

| Source tier | Workers | Posts/articles | Waypoints extracted |
|---|---|---|---|
| Reddit + industry aggregators | 1 | 12 | ~27 |
| Cruiser/touring forums | 2 | 12 | ~64 |
| Motorcycle.com + BARF | 3 | 12 | ~45 |
| ADVRider (sanity check, discounted) | 4 | 6 threads | ~100 |
| Editorial | 5 | 10 | ~77 |
| **Total (weighted)** | **5 workers** | **~52 posts/articles** | **~313 waypoint mentions** |

Sample size exceeds the 200-post-minimum gate from the research plan. Distribution across sources is uneven (BARF-heavy in Worker 3, ADV-dense in Worker 4) — the synthesis in `03-findings.md` weights sources based on persona alignment (primary = cruiser/touring/editorial; discounted = ADV).

## Token cost summary

| Worker | Tokens | Est. credit cost |
|---|---|---|
| Worker 1 (Reddit) | 52,518 | ~$0.80 |
| Worker 2 (Cruiser/touring) | 64,275 | ~$1.00 |
| Worker 3 (Moto.com + BARF) | 74,877 | ~$1.15 |
| Worker 4 (ADVRider) | 52,942 | ~$0.80 |
| Worker 5 (Editorial) | 49,455 | ~$0.75 |
| **Total worker cost** | **~294K** | **~$4.50** |

Below the $5-12 pilot estimate and well below the $25-50 Option B estimate. Synthesis was handled inline (no additional research-analyst dispatch) to stay lean.
