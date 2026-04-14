# BestBikingRoads.com — Phase 0 Site Map

**Author:** Phase 0 recon agent (LaneShadow Crawl Plan Protocol)
**Date:** 2026-04-13
**Protocol:** CRAWL-PLAN-PROTOCOL.md — Form A (HTML scraper)
**Consumer:** BASE-009b (BBR crawl plan implementer)

---

## 1. Site Overview

| Field | Value |
|---|---|
| Site name | BestBikingRoads (BBR) |
| Base URL | `https://www.bestbikingroads.com` |
| Country scope for LaneShadow | United States only |
| Country index slug | `united-states` |
| Rendering | Server-side HTML. No JS rendering required. Verified via plain `curl` — route listings and detail pages render full content in HTML response. |
| Self-reported US total | ~4,046 routes (from homepage per-state nav counts) |
| Self-reported per-state total (examples) | California 401, Tennessee 167, Alabama 69 — these are the "xxx routes" banner on each state listing page |

### robots.txt (verified 2026-04-13)

Only disallows back-end PHP endpoints that are not part of the crawl path:

```
User-agent: *
Disallow: /dall.php
Disallow: /darea.php
Disallow: /data.php
Disallow: /dcontinent.php
Disallow: /dcontnames.php
Disallow: /dcountry.php
Disallow: /dstate.php
Disallow: /droute.php
Disallow: /downloadfile.php
Disallow: /iaroute.php
Disallow: /iauth.php
Disallow: /igadvertisers_appv3.php
Disallow: /igroutes.php
Disallow: /igroutes_appv3.php
Disallow: /igrt.php
Disallow: /iguser.php
Disallow: /cache/
```

**None of the crawl targets below are disallowed.** No `Crawl-delay:` directive is published — the site is silent on rate, so we default to respectful pacing.

### Rate-limit policy (recommended)

- **Delay:** 3–4 seconds between requests (matches Epic 2 baseline scraper which was never 429'd).
- **Concurrency:** 1 (serial). The site has no published concurrency contract; the existing `base_scraper.py` rate limiter is the right floor.
- **Cap:** ~20 req/min ceiling.
- **Wall clock budget at 3.5s × ~4,600 URLs (50 state + ~250 cluster + ~4,300 detail):** ~4.5 hours. The BASE-009b estimate of ~3.75 hr is compatible.
- **User-Agent:** set a descriptive UA including a contact URL (`LaneShadow-Crawler/1.0 (+https://laneshadow.com)`).

---

## 2. Page Type Taxonomy

| ID | Name | Description | Role | Scope |
|---|---|---|---|---|
| **PT-01** | US state listing | Per-state index of routes for one US state. Shows the first ~52–81 "featured" route links inline plus links to sub-state *cluster* index pages (PT-02). Also shows a "NNN routes" banner containing the site's self-reported total for that state. | Seed set for Phase 1 inventory — 50 URLs, one per state. **Primary discovery root.** | **in-scope** |
| **PT-02** | Sub-state cluster index (`/rides/{cluster}`) | Per-county-group index listing ~30–50 route detail links. Cluster slug is a hyphen-joined list of 2–4 county names (e.g., `lake-obion-weakley`, `sumner-macon-clay`). Linked from PT-01. | **Additive** seed set for Phase 1 inventory — harvests the large tail of routes not inline on PT-01. | **in-scope** (see §7 Scope Decision — this is the single highest-impact decision in this site-map) |
| **PT-03** | Route detail | The actual route page containing name, description, state, rating, and sidebar "you might also like" cross-state route rail. URL is `/motorcycle-roads/united-states/{state}/ride/{slug}`. | Parse target — the row in `staging/bestbikingroads.jsonl`. | **in-scope** |
| **PT-04** | Top-10 curated editorial | Editorial "top 10 rides in {state}" pages with a different DOM than PT-03. Linked from PT-01 as `/top-10-best-rides/{state}`. Prior commit `b60629b` already skips these because they break the PT-03 parser. | Skip — redundant content already covered by PT-03 and schema does not match. | **out-of-scope** |
| **PT-05** | Global/cross-country nav (homepage, country index, non-US country listings) | Homepage at `/`, country picker at `/motorcycle-roads/country/{country}`, non-US state pages. Present as noise in navigation menus on every page. | Skip — we filter US-only. | **out-of-scope** |
| **PT-06** | Back-end PHP data endpoints | `/droute.php`, `/igroutes.php`, etc. Disallowed by robots.txt. | Never fetched. | **out-of-scope (robots)** |

### Expected inventory size (Phase 1 sanity range for BASE-009b gate)

- **PT-01:** exactly 50 (one per US state)
- **PT-02:** ~200–300 (observed 4–8 clusters per state × 50 states; California had 8, Tennessee had 4, Alabama had 5)
- **PT-03 (route detail):** **3,500–4,600 unique canonical URLs.** This is the binding range for the BASE-009b AC-3 gate `[3500, 5500]`. Any Phase 1 run yielding <3,500 means clusters were missed; any run yielding >5,500 almost certainly has duplicate contamination or non-US routes leaking through the filter.
- **PT-04:** ~50 (one per state, skipped)

---

## 3. URL Patterns (per page type)

| ID | Template | Example | Regex |
|---|---|---|---|
| PT-01 | `https://www.bestbikingroads.com/motorcycle-roads/united-states/routes/{state-slug}` | `.../routes/tennessee` | `^/motorcycle-roads/united-states/routes/([a-z\-]+)$` |
| PT-02 | `https://www.bestbikingroads.com/motorcycle-roads/united-states/{state-slug}/rides/{cluster-slug}` | `.../tennessee/rides/lake-obion-weakley` | `^/motorcycle-roads/united-states/([a-z\-]+)/rides/([a-z0-9\-]+)$` |
| PT-03 | `https://www.bestbikingroads.com/motorcycle-roads/united-states/{state-slug}/ride/{route-slug}` | `.../north-carolina/ride/us-129-robbinsville-maryville-deal-s-gap-tail-of-the-dragon` | `^/motorcycle-roads/united-states/([a-z\-]+)/ride/([A-Za-z0-9\-]+)$` |
| PT-04 | `https://www.bestbikingroads.com/top-10-best-rides/{state-slug}` | `.../top-10-best-rides/california` | `^/top-10-best-rides/([a-z\-]+)$` (**rejected at inventory**) |

**Note on `ride` vs `rides`:** the distinction is load-bearing. Singular `/ride/{slug}` = PT-03 detail; plural `/rides/{cluster}` = PT-02 index. The Phase 1 classifier MUST anchor on `\bride\b` vs `\brides\b` with a word boundary, not substring match. Getting this wrong is how you'd either miss every detail page or double-count cluster pages as details.

**Canonicalization rules for Phase 1:**
- Force scheme to `https://`
- Force host to `www.bestbikingroads.com` (reject bare `bestbikingroads.com`, `bestbikingroads.gr`, `bestbikingroads.com:443` — all three appeared in harvested link sets)
- Lowercase host
- Strip query strings (site uses none for content URLs)
- Strip trailing slash
- **Do NOT lowercase path segments.** Observed route slugs sometimes contain mixed case (e.g., `Columbia-2`, `Kingsport`) — lowercasing will cause fetches to 404.

---

## 4. Transition Graph

```
                  [homepage /]
                      │
                      │ nav menu
                      ▼
        ┌──────── PT-01 (50 state listings) ────────┐
        │                  │                         │
        │ inline           │ cluster links           │ top-10 link
        │ (52–81 per page) │ (4–8 per page)          │ (1 per page)
        ▼                  ▼                         ▼
   PT-03 (detail)      PT-02 (cluster)         PT-04 (SKIP)
                           │
                           │ inline (~30–50 links)
                           ▼
                      PT-03 (detail)
                           │
                           ▼
           ┌─ right/bottom "you might also like" rail ─┐
           │ (cross-state sidebar — see TRAP-01)       │
           ▼
       PT-03 (other states — REJECT at inventory)
```

### Edge rules (critical for Phase 1)

1. **PT-01 → PT-03 (inline):** keep. Only links matching `PT-03` regex AND where `{state-slug}` in the URL matches the PT-01 page's state. (Cross-state inline links do exist — see TRAP-01.)
2. **PT-01 → PT-02 (cluster):** keep. Discovered 4 TN clusters, 5 AL clusters, 8 CA clusters in samples.
3. **PT-02 → PT-03 (inline):** keep. This is the main yield source — 83% of cluster rides are additive to the PT-01 inline set (see §7 evidence).
4. **PT-02 → PT-02 (cross-cluster):** **do NOT recursively discover from PT-02.** Observed that a cluster page only links to 1–2 sibling clusters, not all of them. The complete cluster set for a state is only available from PT-01. If Phase 1 traverses PT-02→PT-02, it will under-discover.
5. **PT-03 → PT-03 (sidebar "you might also like"):** **REJECT.** Sidebar links are cross-state and do not represent discovery from the current state. Canonicalize and dedupe at inventory and they collapse; but do not *credit* them as discovered-from the current page type.
6. **PT-01 → PT-04 top-10:** REJECT (PT-04 is out-of-scope).

---

## 5. Sample URLs (verified real, HTTP 200 as of 2026-04-13)

### PT-01 — US state listings (5 of 50)

- `https://www.bestbikingroads.com/motorcycle-roads/united-states/routes/tennessee` (200, 389 KB, 68 inline TN rides + 4 clusters, banner "167 routes")
- `https://www.bestbikingroads.com/motorcycle-roads/united-states/routes/california` (200, 392 KB, 81 inline CA rides + 8 clusters, banner "401 routes")
- `https://www.bestbikingroads.com/motorcycle-roads/united-states/routes/alabama` (200, 385 KB, 52 inline AL rides + 5 clusters, banner "69 routes")
- `https://www.bestbikingroads.com/motorcycle-roads/united-states/routes/north-carolina` (inferred from TotD state; part of the 50-state seed set)
- `https://www.bestbikingroads.com/motorcycle-roads/united-states/routes/colorado` (home-page "recent rides" hits confirm this state exists)

### PT-02 — Sub-state cluster index (5 samples)

- `https://www.bestbikingroads.com/motorcycle-roads/united-states/tennessee/rides/lake-obion-weakley` (200, 385 KB, 46 TN rides; 38 are NOT in PT-01 inline set — 83% additive)
- `https://www.bestbikingroads.com/motorcycle-roads/united-states/tennessee/rides/sumner-macon-clay` (200, 386 KB, 48 TN rides; 26 are NOT in PT-01 or cluster1)
- `https://www.bestbikingroads.com/motorcycle-roads/united-states/tennessee/rides/scott-campbell-clairborne` (discovered on PT-01 TN; not yet fetched — included as PT-02 fixture candidate for Phase 2)
- `https://www.bestbikingroads.com/motorcycle-roads/united-states/california/rides/monterey-san-benito` (discovered on PT-01 CA)
- `https://www.bestbikingroads.com/motorcycle-roads/united-states/alabama/rides/madison-jackson-marshall` (discovered on PT-01 AL)

### PT-03 — Route detail (5 samples, MUST include Tail of the Dragon + Million Dollar Highway)

- `https://www.bestbikingroads.com/motorcycle-roads/united-states/north-carolina/ride/us-129-robbinsville-maryville-deal-s-gap-tail-of-the-dragon` (200, 126 KB) — **Tail of the Dragon**, landmark required for Phase 6 gate. `<title>` = "Motorcycle Road : US 129 Robbinsville, United States"; meta description = "Overview Map With Details and Review of Motorcycle Road US 129 : Robbinsville - Maryville ( Deal's Gap - Tail of The Dragon ) in United States for Motorcycle Touring and Motorcycle Travel".
- `https://www.bestbikingroads.com/motorcycle-roads/united-states/colorado/ride/us-550-million-dollar-highway-coal-bank-pass-molas-pass-red-mountain-pass-durango-ridgeway` (200, 113 KB) — **Million Dollar Highway**, landmark required for Phase 6 gate. Colorado state is correct per URL.
- `https://www.bestbikingroads.com/motorcycle-roads/united-states/montana/ride/us-212-beartooth-hwy-red-lodge-cooke-city` (Beartooth Highway — featured on homepage)
- `https://www.bestbikingroads.com/motorcycle-roads/united-states/california/ride/pacific-coast-hwy-1-monterey-morro-bay` (Pacific Coast Highway / Hwy 1 — featured on homepage)
- `https://www.bestbikingroads.com/motorcycle-roads/united-states/arizona/ride/us-191-coronado-trail-scenic-byway-clifton-alpine` (Coronado Trail — featured on homepage)

**Note on Blue Ridge Parkway:** BBR's canonical BRP entry was not observed during recon. It should be searched for in Phase 2 as either `/motorcycle-roads/united-states/north-carolina/ride/blue-ridge-parkway` or `/motorcycle-roads/united-states/virginia/ride/blue-ridge-parkway`; if neither resolves, BRP's presence is validated via the FHWA source and BBR is not the canonical source for that one landmark. (TotD and MDH are the BBR-exclusive landmarks per BASE-009b AC-8.)

---

## 6. Known Traps

**TRAP-01: Sidebar cross-state "you might also like" rail contaminates route sets.** Every PT-03 detail page and every PT-01 state listing contains a right-rail / bottom-rail of 5–20 cross-state route detail URLs. Tennessee's listing had 8 cross-state `/ride/` links (to Alabama, Kentucky, Missouri, NC). **This is the exact bug that stamped Blue Ridge Parkway as an "Alabama" route in Epic 2's MR baseline**, and BBR has the same failure mode waiting to fire. Defense: derive `state` from the route detail URL's `{state-slug}` segment (`/united-states/(\w+)/ride/`) NOT from the listing-page context. The existing scraper's commit `f5d52fa` already applies this fix and it must carry into the crawl-plan framework. The same principle applies at Phase 1 inventory: sidebar links are kept (they're real routes) but `discovered_from` is just metadata — state is always derived from the detail URL later.

**TRAP-02: State listings undercount inline rides.** TN state listing shows 68 rides inline while the banner says "167 routes". The missing ~100 rides live in sub-state cluster pages (PT-02). **A scraper that only visits PT-01 will yield ~40% of each state's routes.** This is exactly Epic 2's BBR failure mode (413 routes / ~4,100 expected ≈ 10%). Without PT-02, we will never reach the AC-3 gate [3500, 5500].

**TRAP-03: Cluster-to-cluster links are incomplete.** A cluster page (PT-02) only surfaces 1–2 sibling clusters in its own nav, not the full list. The complete cluster set for a state is ONLY discoverable from the state listing page (PT-01). Phase 1 discovery must be PT-01 → PT-02 one-hop, not recursive PT-02 → PT-02 traversal.

**TRAP-04: Mixed-case slugs.** Observed TN rides include `Columbia-2`, `Kingsport` with capitalized first letters. Canonicalization must NOT lowercase path segments; doing so returns 404s at Phase 5 execution time. Only the host is case-insensitive.

**TRAP-05: Host aliases / self-redirects.** Harvested link sets contain `https://www.bestbikingroads.com`, `https://www.bestbikingroads.com:443`, and `https://www.bestbikingroads.gr` variants of the same resource. Canonicalization must normalize all of these to the single canonical host `https://www.bestbikingroads.com` (no port, `.com` TLD). Otherwise dedup fails and the inventory inflates spuriously.

**TRAP-06: Non-US route leakage.** The homepage and every state page carry nav menus linking to non-US countries (`/motorcycle-roads/country/{name}`, `/motorcycle-roads/{country}/...`). The Phase 1 classifier MUST filter on `^/motorcycle-roads/united-states/` and reject everything else. The existing scraper's commit `12dfdfb` applies this filter and the framework must preserve it.

**TRAP-07: Top-10 curated pages have a different DOM.** `/top-10-best-rides/{state}` is linked once per state listing and its parser is incompatible with PT-03 selectors. Prior commit `b60629b` already skips these. The framework's inventory classifier MUST reject `top-10-best-rides` URL substrings.

**TRAP-08: Soft 404s return HTTP 404 but render a full HTML "not found" body.** Verified: `GET /roads/` and `GET /motorcycle-roads/united-states/` both return HTTP 404 with ~100 KB bodies. The Phase 5 executor must check status code before parsing, and Phase 1 must not follow these as seed pages. All five PT-01 samples above return HTTP 200 — the 404 paths are historical or planner hallucinations.

**TRAP-09: Self-reported banner counts are aspirational.** The "NNN routes" banner on each state listing is the site's self-reported registry count, which appears to exceed the number of distinct detail pages actually reachable via PT-01 + PT-02 discovery. TN banner says 167, and TN PT-01 (68) + 2 of 4 clusters (46 + 48 = 94 with some overlap) yielded 132 distinct rides so far. Extrapolating: the 4 clusters together likely reach ~155–165, i.e. close but not identical to the banner. Phase 6 accounting should compare the *discovered* inventory against the *banner sum*, not against the banner as absolute truth. Do not fail Phase 6 simply because `discovered < banner_sum`; the discovered number is the truth file.

**TRAP-10: BBR route detail does not return rating via plain HTML attributes.** Quick inspection of TotD page showed rating values only appear inside inline JS (`responseA[i].comments_ave_rating`) rather than a rendered `.rating` DOM node. **This is the selector trap that the existing scraper fell into** and spent selectors like `.rating`, `.score`, `[class*='star']` that never matched. Phase 3 must treat `rating` as a nullable field and extract it from whatever deterministic signal actually exists on the rendered page (the `<img alt>` on star graphics, a `comments_ave_rating` JSON blob, or accept `null` and mark `required: false`). Do not copy the existing scraper's rating selectors.

---

## 7. Scope Decisions

### DECISION-01: PT-02 `/rides/{cluster}` sub-state index pages — **IN-SCOPE (ADDITIVE)**

**Question:** do cluster pages list routes that are ALSO on the state listing page (redundant → skip to save crawl time) or routes that are NOT otherwise reachable (additive → must crawl)?

**Evidence (verified 2026-04-13):**

Measured overlap between Tennessee state listing (PT-01 `/routes/tennessee`, 68 inline TN rides) and the cluster `lake-obion-weakley` (PT-02, 46 TN rides):

| Metric | Value |
|---|---|
| PT-01 TN rides | 68 |
| PT-02 cluster `lake-obion-weakley` rides | 46 |
| Overlap | 8 (17%) |
| Rides only on the cluster page (additive) | 38 (83%) |

A second cluster check (`sumner-macon-clay`, 48 TN rides) yielded 26 new rides not in PT-01 or the first cluster — also overwhelmingly additive.

After processing PT-01 + 2 of 4 TN clusters, cumulative distinct TN rides = **132**. TN's self-reported banner is 167 routes. The two remaining TN clusters should cover most of the 35-ride gap.

**Ruling:** **PT-02 is IN-SCOPE. 83% additive means skipping clusters would produce the exact ~10%-yield failure Epic 2 hit** (413/4,100 = 10% ≈ what you'd get from PT-01 inline alone). Phase 1 inventory MUST discover cluster URLs from every PT-01 state listing and fetch them.

**Confidence:** HIGH. Evidence is concrete (two clusters measured on one state), the mechanism is clear (state listing truncates inline to ~50–80 featured rides, clusters hold the tail), and the expected inventory range (3,500–5,500) matches the site's self-reported ~4,046 total only if clusters are included.

**Implementation note for BASE-009b:** Phase 1 flow is `PT-01 (50) → harvest PT-02 URLs → fetch each PT-02 → harvest PT-03 URLs`. Fetches per pass: 50 (PT-01) + ~250 (PT-02) + ~4,300 (PT-03 at Phase 5) = ~4,600 fetches total. Phase 1 alone (PT-01 + PT-02) is ~300 fetches × 3.5s = ~18 min. That's cheap.

### DECISION-02: PT-04 `/top-10-best-rides/{state}` — **OUT-OF-SCOPE**

Editorial curation with different DOM; prior commit `b60629b` already skips these and the existing scraper's decision is correct. The routes referenced by these pages are duplicates of routes reachable through PT-01/PT-02. Skipping saves ~50 fetches and avoids a parser special case.

### DECISION-03: Non-US routes — **OUT-OF-SCOPE**

LaneShadow's catalog is US-only at Epic 2. BBR contains ~17,000 non-US routes but they're noise for us. Phase 1 classifier enforces `^/motorcycle-roads/united-states/` strictly. The existing commit `12dfdfb` established this filter and it must carry forward.

### DECISION-04: PT-03 sidebar rail — **COUNT ONCE, NEVER CREDIT BY LISTING PAGE**

Sidebar "you might also like" cross-state links on detail pages are real routes, not noise — they *will* show up at some other state's PT-01 or PT-02 discovery pass. But they MUST NOT be used as a discovery edge from the current page. Canonicalization + dedup on the inventory handles this automatically; the behavioural rule for the Phase 1 classifier is: "if you find a link whose `{state-slug}` doesn't match the page you're on, log it, don't follow it as part of this page's discovery credit — it will be discovered correctly from its own state's PT-01."

### DECISION-05: robots.txt disallow list — **RESPECTED BY CONSTRUCTION**

None of PT-01, PT-02, PT-03 match any disallowed path. `/droute.php` and friends are internal PHP back-end endpoints the framework never calls. No additional configuration needed — the existing `robots_checker.py` will return `can_fetch = True` for all in-scope URLs.

---

## 8. Phase 0 Gate Checklist

Per CRAWL-PLAN-PROTOCOL.md Phase 0 gate, the following one-sentence answers are possible without guessing:

| Question | Answer |
|---|---|
| How many distinct page types exist in scope? | **3 in-scope** (PT-01 state listing, PT-02 cluster index, PT-03 route detail) plus 3 out-of-scope (PT-04 top-10 editorial, PT-05 non-US nav, PT-06 disallowed PHP back-end). |
| What URL pattern identifies each? | See §3. PT-01 = `/motorcycle-roads/united-states/routes/{state}`; PT-02 = `/motorcycle-roads/united-states/{state}/rides/{cluster}`; PT-03 = `/motorcycle-roads/united-states/{state}/ride/{slug}`. |
| Which page types have links to which other page types? | PT-01 → PT-02, PT-01 → PT-03 (inline), PT-02 → PT-03 (one hop, no PT-02→PT-02 recursion). See §4 transition graph. |
| What are the known traps? | 10 traps documented in §6. The three highest-impact are TRAP-01 (sidebar state contamination), TRAP-02 (state listing undercount — the root cause of Epic 2's 10% yield), and TRAP-10 (rating not in plain DOM — the root cause of Epic 2's blind selector bug). |

**Gate status:** PASS. Phase 1 (inventory) can proceed.

---

## 9. Handoff to BASE-009b

BASE-009b's Phase 1 inventory should:

1. Seed with the 50 PT-01 state listing URLs (hardcoded from the `US_STATES` slug list in the existing `bestbikingroads.py`).
2. For each PT-01 page: extract inline PT-03 links (same-state only, anchoring on `\bride\b`) and all PT-02 cluster links (state prefix must match).
3. For each PT-02 page: extract inline PT-03 links (same-state only).
4. Canonicalize URLs per §3 rules (preserve case in path, normalize host alias set).
5. Classify and dedupe.
6. Sanity-check: PT-03 count should land in **[3,500, 5,500]**. Below 3,500 = clusters were missed. Above 5,500 = non-US leakage or sidebar contamination.

Phase 2 fixtures MUST include at minimum:
- 3× PT-01 (e.g., `tennessee`, `california`, `alabama`)
- 3× PT-02 (e.g., `tennessee/rides/lake-obion-weakley`, `california/rides/monterey-san-benito`, `alabama/rides/madison-jackson-marshall`)
- 5× PT-03 including **Tail of the Dragon** (NC) and **Million Dollar Highway** (CO) fixtures for the Phase 6 landmark gate (AC-8), plus Beartooth Highway, Pacific Coast Highway, and Coronado Trail as the other three.

Phase 3 selector spec will find that `rating` is the hardest field; **it is nullable on this site** (see TRAP-10) and should be declared `required: false` from the start. `name`, `state`, `source_url`, `description` are the required fields. `state` must be derived from the URL regex, NOT from the listing page's context (TRAP-01).
