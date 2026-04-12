# Motorcycle Rider Publications — Jina-Accessible Content Sources

**Research Date:** 2026-04-12
**Method:** Direct testing via Jina MCP `read_url` / `parallel_read_url`
**Holocron ID:** `js76y3kd6gjz0w4mjfbbfwk8zh84pb5b`

---

## Tier 1 — Major Publications (full articles)

| Publication | URL | Focus | Content Depth |
|---|---|---|---|
| **Cycle World** | cycleworld.com | Reviews, dyno tests, comparisons | Full articles, detailed specs |
| **Motorcyclist** | motorcyclistonline.com | Reviews, MC Commute, buyers guides | Full articles, video transcripts |
| **Rider Magazine** | ridermagazine.com | Touring, travel, adventure | Full articles, buyers guides |
| **RideApart** | rideapart.com | News, reviews, how-tos, history | Full articles with deep archives |
| **RevZilla Common Tread** | revzilla.com/common-tread | Rides, opinions, Daily Rider | Full articles, strong editorial voice |
| **Ultimate Motorcycling** | ultimatemotorcycling.com | Reviews, news, racing | Full articles |

## Tier 2 — Niche/Specialty (full articles)

| Publication | URL | Focus | Content Depth |
|---|---|---|---|
| **ADV Pulse** | advpulse.com | Adventure bikes, dual sport, ride reports | Full articles, events calendar |
| **ADVMoto** | adventuremotorcycle.com | Adventure/dual-sport bikes, tests | Full articles + video content |
| **webBikeWorld** | webbikeworld.com | Gear reviews (helmets, jackets, boots) | 1700+ hands-on reviews since 2000 |
| **Bike EXIF** | bikeexif.com | Custom motorcycles, cafe racers, builds | Full articles with high-quality photos |
| **MCN (Motorcycle News UK)** | motorcyclenews.com | UK-based news, reviews, used bike guides | Full articles (ad-heavy but readable) |
| **Motorcycle.com** | motorcycle.com | Reviews, editorials, comparisons | Full articles |

## Tier 3 — Specialized/Regional (full or partial)

| Publication | URL | Focus | Content Depth |
|---|---|---|---|
| **MotorcycleDaily** | motorcycledaily.com | MotoGP results, industry news | Full articles, race coverage |
| **Bikernet** | bikernet.com | Harley/cruiser culture, tech, events | Full articles, extensive archives |
| **Motorcycle Cruiser** | motorcyclecruiser.com | Cruiser-focused reviews, customs | Full articles |
| **Motorcycle Mojo** | motorcyclemojo.com | Canadian publication, travel, reviews | Article excerpts + some full content |

## NOT Accessible via Jina

| Publication | URL | Reason |
|---|---|---|
| **Inside Motorcycles** | insidemotorcycles.com | Bot detection / robot challenge blocks Jina |
| **Iron Butt Magazine** | ironbutt.com/ibmagazine | Subscription-gated; only landing page accessible |

## Defunct / Merged

| Publication | Status |
|---|---|
| **Thunder Press** | Merged into Rider Magazine ecosystem |
| **American Rider** | Merged with Thunder Press / Rider Magazine |
| **Sport Rider** | Folded into Cycle World |
| **Dirt Rider** | Folded into Cycle World |
| **Motorcycle Consumer News (US)** | Ceased publication; archive accessibility unknown |

---

## Content Categories by Publication

### News & Industry
Cycle World, Motorcyclist, RideApart, MCN, MotorcycleDaily, Motorcycle.com

### Bike Reviews & Tests
Cycle World (dyno tests), Motorcyclist (MC Commute), Rider Magazine, Ultimate Motorcycling, Motorcycle.com

### Gear & Product Reviews
webBikeWorld (deepest gear coverage), RevZilla Common Tread, Ultimate Motorcycling

### Adventure / Dual-Sport
ADV Pulse, ADVMoto, Rider Magazine

### Custom / Culture
Bike EXIF (custom builds), Bikernet (Harley culture), Motorcycle Cruiser

### Touring / Travel
Rider Magazine, Motorcycle Mojo, RevZilla Common Tread

### Racing
MotorcycleDaily (MotoGP focus), Cycle World, Ultimate Motorcycling

---

## Usage Notes

All Tier 1-3 publications return **clean markdown** via Jina `read_url`. For batch reading, use `parallel_read_url` with max 5 URLs per call and 30-45s timeout. Some sites (webBikeWorld, Cycle World) return very large pages — use `maxCharacters` parameter or read specific article URLs rather than homepage/category pages to manage output size.
