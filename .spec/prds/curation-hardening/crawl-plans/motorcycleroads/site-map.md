# MotorcycleRoads.com — Phase 0 Site Map

**Recon date:** 2026-04-13
**Recon method:** Manual (jina `read_url` + `WebFetch`) — 13 live page fetches, respectful ~2-3s cadence
**Protocol:** [CRAWL-PLAN-PROTOCOL.md](../../tasks/CRAWL-PLAN-PROTOCOL.md) Phase 0, Form A (HTML scraper)

## 1. Site Overview

**Site name:** MotorcycleRoads.com
**Base URL:** `https://www.motorcycleroads.com` (bare `motorcycleroads.com` 301-redirects to `www`)
**Platform:** Drupal (confirmed via robots.txt `/core/`, `/profiles/` entries; standard Drupal 9/10 fingerprint)
**robots.txt:** `User-agent: *` with `Disallow:` limited to admin / user / search / comment-reply / node-add / oembed / Drupal internals. **`/motorcycle-roads/*` and `/motorcycle-rides-in/*` are fully allowed.** There is **no `Crawl-delay:` directive**.
**Rate-limit policy:** Not declared. No Cloudflare / WAF challenge was observed across ~13 fetches. Server appears to be conventional Drupal-on-LAMP.
**Recommended crawl delay:** **2.5 seconds between requests** (matches the discipline already in `scripts/curation/pipeline/sources/base_scraper.py` for MR). Even though robots.txt does not require it, the existing `BaseScraper` implements this and we should not relax it.
**True universe (US, measured this session):** **2,044 route-detail pages** — derived from the "of 2044 Routes" counter printed on every card in the `/motorcycle-rides-in/united-states` listing, cross-checked against page 102 (the final page) showing routes 2041-2044. This is ~2x–7x the 300-1000 estimate in BASE-009a and BASE-008. **Downstream tasks should plan for ~2,000 route details, not ~300-1000.**

## 2. Page Type Taxonomy

| ID | Name | Role | In Scope? |
|---|---|---|---|
| **PT-01** | US master listing (`/motorcycle-rides-in/united-states`) | **Index** — the single authoritative entry point for US route discovery. 103 pages × ~20 routes = 2,044 US routes. | **YES (primary index)** |
| **PT-02** | State listing (`/motorcycle-rides-in/{state-slug}`) | Index — per-state filtered listing, paginated. Also in scope as a **cross-check / secondary index** (same routes as PT-01, reachable via a state filter). | YES (secondary — coverage audit only) |
| **PT-03** | Route detail (`/motorcycle-roads/{state-slug}/{route-slug}`) | **Leaf** — the actual data. Name, description, state(s), rider rating, miles, followers, shares. | **YES (scrape target)** |
| **PT-04** | Global `/motorcycle-roads` paginator (`/motorcycle-roads?page=N`) | Index — global 12-per-page paginator. **Contains non-US routes (Italy confirmed on page 169).** Inferior to PT-01 because it cannot be filtered to US. | NO (do not use as an index — leaks non-US routes) |
| **PT-05** | Editorial / "Top N" articles (`/motorcycle-roads/{article-slug}` — **one segment only**, no state slug) | Noise — editorial listicles ("Top 10 Motorcycle Rides In USA's Northeast Region"). Share the `/motorcycle-roads/` prefix but have only 1 path segment, not 2. **DOM is similar to a route detail page but with empty fields.** | **NO — must be explicitly rejected by classifier** |
| **PT-06** | Places / clubs / events (`/places/*`, `/clubs/*`, `/events/*`) | Noise — unrelated entities. | NO (out of scope) |
| **PT-07** | Homepage `/motorcycle-roads` (bare, no query string) | Index — first page of PT-04 with homepage hero. Same pagination as PT-04. | NO (covered by PT-04 dismissal) |

## 3. URL Patterns

```
PT-01 US master listing:      https://www.motorcycleroads.com/motorcycle-rides-in/united-states(?page=N)?
                              where 0 <= N <= 102 (inclusive). N=0 is also reachable by omitting the query string.

PT-02 State listing:          https://www.motorcycleroads.com/motorcycle-rides-in/{state-slug}(?page=N)?
                              state-slug = [a-z-]+ (lowercased, hyphenated: "north-carolina", "new-mexico", "rhode-island")
                              N varies by state (e.g., California 0..6 for 138 routes).

PT-03 Route detail:           https://www.motorcycleroads.com/motorcycle-roads/{state-slug}/{route-slug}
                              Regex: ^/motorcycle-roads/[a-z-]+/[a-z0-9-]+/?$
                              EXACTLY 2 path segments after /motorcycle-roads/. {state-slug} is the route's PRIMARY
                              state (see trap T-01). {route-slug} is lowercased, hyphenated, strips punctuation.

PT-04 Global paginator:       https://www.motorcycleroads.com/motorcycle-roads(?page=N)?
                              12 routes per page, global (includes non-US). DO NOT USE.

PT-05 Editorial article:      https://www.motorcycleroads.com/motorcycle-roads/{article-slug}
                              Regex: ^/motorcycle-roads/[a-z0-9-]+/?$
                              EXACTLY 1 path segment after /motorcycle-roads/. Must be rejected by the classifier.
```

**Classifier discriminator:** The single deterministic signal separating PT-03 (valid route) from PT-05 (editorial trap) is **path-segment count after `/motorcycle-roads/`** — PT-03 has 2, PT-05 has 1. Use this in `inventory.classify()`, not DOM heuristics.

**State-slug enumeration:** 50 US states plus the special `united-states` aggregate. Spaces → hyphens, lowercase. Example slugs: `alabama`, `alaska`, `california`, `north-carolina`, `new-hampshire`, `new-jersey`, `new-mexico`, `new-york`, `north-dakota`, `rhode-island`, `south-carolina`, `south-dakota`, `west-virginia`. (DC / territories not verified — recommend omitting.)

## 4. Transition Graph

```
                        +----------------------------------+
                        |  PT-01 US master listing         |
                        |  /motorcycle-rides-in/united-    |
                        |  states?page=0..102              |
                        |  (103 pages × 20 = 2044 routes)  |
                        +---------------+------------------+
                                        |
                         ~20 route links per page, each:
                         /motorcycle-roads/{state}/{slug}
                                        v
                        +----------------------------------+
                        |  PT-03 Route detail              |
                        |  (leaf — scrape here)            |
                        +----------------------------------+
                                        ^
                                        | ~20 per page, paginated
                                        |
                        +----------------------------------+
                        |  PT-02 State listing (secondary) |
                        |  /motorcycle-rides-in/{state}    |
                        |  Used ONLY for coverage cross-   |
                        |  check against PT-01.            |
                        +----------------------------------+

NOT traversed:
  PT-04 global paginator  -> would leak Italy routes; skip.
  PT-05 editorial         -> 1 path segment; classifier rejects.
  PT-06 places/clubs      -> different URL prefix; classifier rejects.
```

**Canonical rule:** The **inventory is built exclusively from PT-01** (103 page-fetches). Every route-detail URL is extracted, canonicalized (strip query string, lowercase host, strip trailing `/`), and deduped by `canonical_url`. PT-02 is only used at the end of Phase 1 as a sanity check: the sum of per-state route counts declared on the state listing pages should equal ~2044 within ±50.

**Sidebar / cross-state links:** The state listing pages (PT-02) **contain route links whose URL state-slug differs from the page's state** because the route is multi-state (e.g., `/motorcycle-roads/alabama/natchez-trace-parkway` appears in Tennessee's listing because Natchez Trace crosses TN). This is NOT a sidebar trap — it is a legitimate multi-state routing. But the prior scraper treated it as a sidebar link and stamped the page's state onto the route, creating the "Alabama Blue Ridge Parkway" bug. **The fix is to derive `state` from the URL path, not from the listing page — and to allow multi-state routes as a first-class concept (see trap T-01).**

## 5. Sample URLs

### PT-01 — US master listing (5 samples verified live)
- `https://www.motorcycleroads.com/motorcycle-rides-in/united-states` (page 0)
- `https://www.motorcycleroads.com/motorcycle-rides-in/united-states?page=1`
- `https://www.motorcycleroads.com/motorcycle-rides-in/united-states?page=50`
- `https://www.motorcycleroads.com/motorcycle-rides-in/united-states?page=102` (final page; shows routes 2041-2044)
- `https://www.motorcycleroads.com/motorcycle-rides-in/united-states?page=103` → empty "No Results Found" (gate for pagination termination)

### PT-02 — State listing (3 samples verified live)
- `https://www.motorcycleroads.com/motorcycle-rides-in/tennessee` (73 routes, 4 pages)
- `https://www.motorcycleroads.com/motorcycle-rides-in/california` (138 routes, 7 pages)
- `https://www.motorcycleroads.com/motorcycle-rides-in/united-states` (also fits PT-02 as the special `united-states` slug; redundant with PT-01)

### PT-03 — Route detail (5 samples, landmarks where possible — all verified live this session)
- `https://www.motorcycleroads.com/motorcycle-roads/tennessee/deals-gap-aka-the-dragon-or-tail-of-the-dragon` — **Tail of the Dragon** (name="Deal's Gap (AKA 'The Dragon' or 'Tail of the Dragon')", state=Tennessee/North Carolina, rating=4.55, miles=11, 327 reviews)
- `https://www.motorcycleroads.com/motorcycle-roads/california/pacific-coast-cruise-hwy-1` — **Pacific Coast Highway** (state=California, rating=4.78)
- `https://www.motorcycleroads.com/motorcycle-roads/virginia/blue-ridge-parkway` — **Blue Ridge Parkway** (URL says Virginia; card declares "Virginia, North Carolina" multi-state; rating=4.71)
- `https://www.motorcycleroads.com/motorcycle-roads/montana/beartooth-pass` — **Beartooth Pass** (URL says Montana; card declares "Montana, Wyoming"; rating=4.91)
- `https://www.motorcycleroads.com/motorcycle-roads/alabama/natchez-trace-parkway` — **Natchez Trace Parkway** (URL says Alabama; card declares "Alabama, Mississippi, Tennessee"; rating=4.23)
- `https://www.motorcycleroads.com/motorcycle-roads/virginia/skyline-drive` — **Skyline Drive** (state=Virginia, rating=4.65)

### PT-05 — Editorial article (trap sample, verified)
- `https://www.motorcycleroads.com/motorcycle-roads/top-10-motorcycle-rides-in-usas-northeast-region-new-year-2024-edition` — 1 path segment; classifier MUST reject. DOM renders as an empty route-card template.

## 6. Known Traps

**T-01 — Multi-state routes with a single URL state slug.** The site models a route as living at **one canonical URL** under a **primary state**, but the route card exposes a comma-delimited list of all states the route traverses (e.g., `"Virginia,United States,North Carolina,"`). The prior scraper extracted `state` from the listing-page heading (which varied per-page visit) and pinned the wrong state onto routes. The Epic 2 patch (commit `facb67b`) fixed this halfway by deriving `state` from the URL slug instead — but that silently loses the other states. The correct fix: **the schema must carry `state_primary` (from URL slug) AND `states_all` (a list parsed from the detail page's state-list element).** See Phase 3 selector spec — `state_primary` is a `url_regex`-derived required field; `states_all` is a DOM-selected optional list field.

**T-02 — Global paginator `/motorcycle-roads?page=N` leaks non-US routes.** Page 169 of the global paginator contained `/motorcycle-roads/italy/panoramica-delle-vette` and `/motorcycle-roads/italy/passo-tre-croci-three-crosses-pass`. **Do not use PT-04 as an index.** Use PT-01 (`/motorcycle-rides-in/united-states`) which is cleanly filtered to US-only. If the framework's `discover()` ever falls back to PT-04, it MUST post-filter by a US-state-slug allow-list.

**T-03 — Editorial "Top N" articles living under `/motorcycle-roads/`.** URLs like `/motorcycle-roads/top-10-motorcycle-rides-in-usas-northeast-region-new-year-2024-edition` share the `/motorcycle-roads/` prefix but have only one path segment. Their DOM is a route-detail template with empty data fields (no rating, no miles, no description), so a blind "look for route-card divs" approach would happily ingest them as zero-rated routes. **Classifier MUST reject `^/motorcycle-roads/[a-z0-9-]+/?$` (one segment).** Only accept `^/motorcycle-roads/[a-z-]+/[a-z0-9-]+/?$` (two segments, first is a known US state slug from the enumeration).

**T-04 — The `/motorcycle-roads/{state}` path does NOT exist.** `/motorcycle-roads/tennessee` returns a working page, but **it is the homepage with the state-listing sidebar** — no state-specific results, no "filtered" routes. It renders "No Results Found" in the main content area while still showing the global "Best Motorcycle Roads & Rides" rail. The prior scraper fetched this URL for all 50 states and scraped the global rail each time, yielding only ~30 total routes across all states (the global rail is ~30 items long). **This is exactly the Epic 2 failure mode.** The correct state listing is `/motorcycle-rides-in/{state}` (different path prefix: `motorcycle-rides-in` not `motorcycle-roads`).

**T-05 — Global "Best Motorcycle Roads & Rides" and "Newest Motorcycle Roads & Rides" rails on every page.** Every single page on the site renders ~30 "Best" routes and ~20 "Newest" routes in the footer. A blind `a[href*='/motorcycle-roads/']` selector pulls these in on every page fetch. The inventory classifier's `discovered_from` field should record the source page, and during Phase 1 dedupe by `canonical_url` so these rails collapse to ~50 unique routes across the entire crawl (not 50 × 103 = 5,150 phantom discoveries). Canonicalization handles this automatically; the trap is that Phase 0 reject-rate analysis must not count them as "rejects."

**T-06 — Drupal "Read Road Guide" and "More" anchor text.** Each route card has a "Read Road Guide" anchor plus a separate title anchor — both pointing to the same route detail URL. A naive `link.get_text()` name extraction yields `"Read Road Guide"` for half the routes. The prior scraper has an explicit guard (`"read road guide"` lowercase match) but this is fragile. **Selector spec should extract `route_name` from the DOM heading element on the detail page, not from anchor text on the listing page.**

**T-07 — Pagination termination is silent.** Requesting `?page=103` or higher returns a 200 OK page with "No Results Found" text — NOT a 404 and NOT an empty body. The inventory executor must detect the "No Results Found" sentinel (or count extracted route links per page — 0 means stop) to know when to stop paginating. Do not rely on HTTP status.

**T-08 — `motorcycleroads.com` vs `www.motorcycleroads.com`.** Bare domain 301-redirects to www. Canonicalization must normalize host to `www.motorcycleroads.com` so sitemap/breadcrumb URLs that drop the `www` don't create duplicate inventory rows.

**T-09 — Site has non-US routes globally, including Italy, UK, etc.** The number **"2044 Routes"** on cards refers to US routes specifically (the counter is scoped to the listing you're viewing). The true global universe is larger. Stay on PT-01 (`/united-states`) and you're safe; wander into PT-04 and you're not.

**T-10 — No robots crawl-delay, no WAF observed — but Drupal can become brittle under burst load.** The existing `base_scraper.py` 2-3s cadence is appropriate. Do not race to saturate the server; a 2,044-page crawl at 2.5s is ~85 minutes, well within the BASE-009a budget.

## 7. Scope Decisions

| Page Type | Decision | Rationale |
|---|---|---|
| **PT-01 US master listing** | **IN SCOPE — primary index** | 103 pages fully covers the 2,044 US route universe with no non-US leakage. Fetched at 2.5s cadence = ~4.3 minutes of index crawl before Phase 2 detail fetching begins. |
| **PT-02 State listing** | IN SCOPE — coverage audit only | Use to cross-check: sum of per-state counts should equal ~2,044 ± 50. Do not use as a parallel inventory source — it would double-count multi-state routes and the extra fetches are not worth the ~85 minutes added. |
| **PT-03 Route detail** | **IN SCOPE — scrape target** | The actual data. Expect ~2,044 fetches = ~85 minutes at 2.5s cadence. |
| **PT-04 Global paginator** | OUT OF SCOPE | Leaks non-US routes (Italy confirmed). No reason to touch it when PT-01 is strictly better. |
| **PT-05 Editorial articles** | OUT OF SCOPE | Not route data. Classifier rejects the one-path-segment pattern. |
| **PT-06 Places/clubs/events** | OUT OF SCOPE | Different URL prefix, different entity type. |
| **PT-07 Homepage `/motorcycle-roads`** | OUT OF SCOPE | Covered by PT-04 dismissal. |

**Flagged for implementer review (not blockers):**

1. **Schema question — `state` field cardinality.** The prior scraper's `record.state` is a single string. But a significant fraction of MR's best-known routes are multi-state (Natchez Trace = AL/MS/TN; Blue Ridge = VA/NC; Beartooth = MT/WY; Cherohala = TN/NC). The Phase 4 fixture assertion `record.state == fixture.expected.state` will need to accommodate this. **Recommendation:** schema carries `state_primary: str` (from URL slug, always) + `states_all: list[str]` (from detail-page state list, optional). Phase 4 assertion becomes `fixture.expected.state_primary in record.states_all`. If the downstream convex schema only has a single `state` field, use `state_primary` there.

2. **Inventory expected range.** BASE-009a currently asserts `300 <= PT-02-route-detail count <= 1000`. The true measured universe is **2,044**. **Recommendation:** BASE-009a's AC-3 range should be relaxed to `[1800, 2200]` (2,044 ± 10%) before the inventory phase runs — otherwise the gate will fail and the implementer will waste cycles debugging a correct inventory against a wrong ceiling.

3. **Execution budget.** 2,044 fetches × 2.5s = 85 minutes (not the 30 minutes stated in BASE-009a). The protocol framework bug-test cost on MR is ~85 minutes per re-run, not ~30. Still 2.6× cheaper than BBR's estimated 3.75 hours, so the split rationale holds — but the scheduling assumption in BASE-009a needs updating.

4. **Possible uncertainty — Puerto Rico / DC / territories.** Not verified. The US master listing may or may not include them. Recommendation: enumerate state slugs from the URL-classifier side (only accept the 50 US states + DC), and log any other slug as a Phase 1 reject for user review.

5. **Possible uncertainty — pagination count `103` is current as of 2026-04-13.** New routes are added (the "Newest" rail showed routes added as recently as 2026-02-11). The executor should detect end-of-pagination dynamically via "No Results Found" (trap T-07), not hardcode page count 103.

---

**Phase 0 verdict:** High confidence in the PT-01-based inventory strategy. All four Phase 0 gate questions (how many page types in scope, URL pattern per type, transitions, known traps) are answered above with concrete live-verified evidence. Ready to hand off to BASE-009a Phase 1 (Inventory).
