# Founder-Curated Regional Seed Lists (R6)

Manually-curated Taste waypoints for regions the founder rides. Ingested by UC-WSRC-08 as Tier 1 trusted entries that bypass quality gates L1–L4 (founder has already evaluated them).

## Format

One CSV per region. Filename matches the region slug: `{region-slug}.csv`

### Columns

| Column | Required | Notes |
|---|---|---|
| `name` | yes | Waypoint name |
| `lat` | yes | Decimal latitude |
| `lng` | yes | Decimal longitude |
| `category` | yes | `taste` (founder seed is Taste-only for Phase 0.5) |
| `effort` | yes | `pullover`, `park`, or `side_trip` |
| `trigger_score` | yes | 0.0–1.0 (how much could this alone justify a ride?) |
| `description` | yes | 2–3 sentence description in rider voice |
| `photo_url` | optional | If founder has a personal photo |
| `source_notes` | yes | Brief note on why this is a trusted entry ("ate here 2024-06, great BBQ, biker-friendly parking") |

## Regions in scope (Phase 0.5)

Default proposal (TBD with founder):

- `utah-sw-colorado.csv` — Utah 12, Moab, La Sal Loop, Cedar Breaks, Grand Staircase
- `blue-ridge-smokies.csv` — Blue Ridge Parkway, Tail of the Dragon, Deals Gap, Cherohala Skyway
- `sierra-eastern-sierra.csv` — US 395, Tioga Pass, June Lake Loop, Bishop, Mammoth

Target: 30–50 entries per region, 90–150 total at Phase 0.5 launch.

## Contribution workflow

1. Founder rides the region
2. Founder captures names, rough coordinates (from memory or phone), and trigger score
3. Founder commits updated CSV to this folder
4. Pipeline ingestion picks up the changes on next run
5. Founder regional seed re-runs on demand or on monthly schedule
