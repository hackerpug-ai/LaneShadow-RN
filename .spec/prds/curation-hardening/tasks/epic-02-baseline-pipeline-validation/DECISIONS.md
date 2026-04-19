# Epic 2 Decisions Log

Single-page narrative of non-obvious decisions made during Epic 2 execution.
Append chronologically. Each entry should capture: *context*, *options considered*,
*decision*, *rationale*, *sign-off*.

---

## 2026-04-13 — FHWA data source resolution

**Context.** `/kb-run-epic` preflight for `epic-02-baseline-pipeline-validation` revealed
that BASE-001's required input — `data/fhwa_byways.csv` — did not exist anywhere in
the repository, and that `scripts/curation/pipeline/sources/fhwa.py::parse_fhwa_csv()`
expected a column schema (`RouteName, State, CentroidLat, CentroidLng, LengthMiles`)
that no publicly-available FHWA dataset ships directly. The predecessor PRD
(`.spec/prds/curation/05-uc-ingest.md:25`) claimed "System downloads FHWA byways CSV
from data.gov URL", but investigation showed that claim was aspirational —
**data.gov does not publish a federal National Scenic Byways CSV** (only Iowa, New
York, and North Dakota state subsets are indexed). FHWA publishes the 184-route
"America's Byways" list only as a **PDF** (`designated_byways.pdf`, 293 KB) and as an
**HTML page** (`designated_byways.cfm`). Neither contains coordinates. The curation
pipeline's baseline input has therefore never existed.

**Options considered.**

| # | Option | Rejected because |
|---|---|---|
| A | Parse `designated_byways.pdf` + geocode to state centers | No per-route coordinates; OSM enrichment would query state capitals instead of actual byways. Validates *that the pipeline runs*, not *that it works*. |
| B | Web-scrape + LLM-extract + Wikipedia enrichment | Introduces scope creep and uncontrolled hallucination risk. The FHWA PDF + Wikipedia path would produce a mix of authoritative and inferred data with no provenance labeling. |
| C | Accept an LLM-generated CSV pasted into chat | **Hard reject.** An LLM generating 184 rows of route names + coordinates + mileages from training is exactly the fabrication mode Epic 2 exists to prevent. Silent errors in the baseline would compound across every downstream epic that diffs against it. See the inline refusal in the planning conversation. |
| D | Pull Epic 4 forward — use Koordinates 799-feature GIS now | Undermines epic boundaries; requires Koordinates account/API key; conflates baseline-validation scope with source-expansion scope. |
| **E** | **Query the DOT ArcGIS FeatureServer at `geo.dot.gov/server/rest/services/US_Scenic_Byways/MapServer/107`** | **Selected.** Public domain (17 USC §101), supports GeoJSON queries, has full route polyline geometry, no account required. |

**Finding during verification** — layer 107 returned **648 features across 645 distinct
route names**, not the 184 expected. Investigation revealed the layer is not the FHWA
America's Byways program in isolation — it's a **DOT-compiled superset of all scenic
byways tracked across agencies**. The `Admin_Org` field holds comma-separated agency
tags drawn from 22 distinct combinations.

**BASE-000 execution (2026-04-13)** — `fetch_fhwa.py` successfully queried layer 107
and wrote `data/fhwa_byways.csv` with **645 rows**. Agency tag breakdown from the live query:
- STATE: 524 routes
- NSB: 124 routes (federal National Scenic Byways)
- USFS: 129 routes (Forest Service)
- BLM: 54 routes (BLM Back Country Byways)
- NPS: 9 routes (National Park Service)
- OTHER: 7 routes

All routes had state resolution via point-in-polygon on layer 110. Known landmarks verified:
- Blue Ridge Parkway: North Carolina / Virginia, AgencyTags "NSB, USFS, NPS", 467.2 miles
- Beartooth Highway: Montana / Wyoming, AgencyTags "NSB, USFS", 68.3 miles

| Tag | Route count | What it represents |
|---|---|---|
| `NSB` | 127 | Federal National Scenic Byway |
| `AAR` | 0 | All-American Road — **not encoded** in this layer |
| `STATE` | 525 | State-designated scenic byway |
| `USFS` | 130 | Forest Service route |
| `NPS` | 9 | National Park Service route |
| `BLM` | 54 | BLM Back Country Byway |
| `OTHER` | small | Catch-all for non-standard designations |

Spot checks:
- `"Tail of the Dragon"` → **NOT PRESENT** (state-designated road, not a federal NSB)
- `"Million Dollar Highway"` → **NOT PRESENT** (same — state-designated)
- `"Blue Ridge Parkway"` → present, `Admin_Org = "NSB, USFS, NPS"`
- `"Beartooth Highway"` → present, `Admin_Org = "NSB, USFS"`
- `"Pacific Coast Highway"` → present as 3 distinct features (Oregon segment, Washington segment, and `"Pacific Coast Highway - California's Route 1"` tagged `STATE`-only)

Note: the NSB-tag count (127) is **smaller** than the FHWA program's 184 because the
DOT layer lags program updates. Filtering layer 107 to `NSB`-only would have produced
127 routes, still not matching the 184 that the PRD referenced. The 184 number was
therefore never achievable from this source.

**Decision.** Accept the **full 645-route superset** from layer 107 as the Epic 2
FHWA baseline, and update the curation-hardening PRD's "184" references accordingly.
This is a larger documentation change than the alternatives but is the only option
where the baseline data and the PRD agree on a single number. Epic 4 (Koordinates
799-feature GIS) remains valuable as a geometry-quality upgrade, though its "4×
expansion" motivation weakens to **~1.24× expansion** (645 → 799) and should be
reframed as an enrichment / ground-truth layer rather than a volume expansion.

**CSV schema.** Six columns:

```csv
RouteName,State,CentroidLat,CentroidLng,LengthMiles,AgencyTags
```

- `RouteName` ← `Trail_Name`
- `State` ← point-in-polygon on route centroid against DOT layer 110 (`US_StateBndrys`);
  multi-state routes use alphabetical `" / "` join (`"North Carolina / Virginia"`)
- `CentroidLat`, `CentroidLng` ← centroid of the feature's polyline geometry in WGS84
- `LengthMiles` ← geodesic length of the polyline, rounded to 1 decimal
- `AgencyTags` ← raw `Admin_Org` value passed through verbatim (`"NSB, USFS, NPS"`,
  `"STATE"`, etc.). Downstream scoring derives `fhwa_designation` signal from this
  rather than the retired AAR/NSB binary.

**BASE-001 AC-2 tolerance.** Revised from **165–203** (old, ±10% around 184) to
**580–710** (new, ±10% around 645).

**Edge cases left in-scope.** The 645 includes some non-road routes:
- `"Alaska's Marine Highway"` — ferry system
- `"Alaska Railroad"` — railroad
- A handful of other non-road or water-crossing entries

These are **not filtered in BASE-000**. They will flow through the pipeline and
likely fail OSM enrichment gracefully (returning `None` curvature scores) and will
be filtered out by Sprint 6's quality floor when that epic lands. Filtering them in
BASE-000 would require ad-hoc heuristics that could mask other data-quality issues.

**Execution strategy.** Narrow, sequential (not full-epic parallel dispatch). Rationale:
the CSV gap was the first spec-drift finding within minutes of starting. A second
finding (layer 107 returning 645 not 184) followed five minutes later. Each spec
assumption needs ground-truthing before being executed against live APIs costing
real money. BASE-000 → BASE-001 → evaluate preconditions of remaining tasks before
dispatching further.

**Multi-state convention.** Alphabetical join (`"North Carolina / Virginia"`).

**Designation column renamed.** Proposed `Designation` (NSB / AAR) rejected because
the DOT layer doesn't encode AAR at all (0 matches). Replaced with `AgencyTags` which
preserves the full `Admin_Org` string for downstream granular use.

**Signed off.** @justin (2026-04-13) — approved via chat after two rounds of data-source
investigation and one direct refusal of LLM-generated CSV.

---

## 2026-04-13 (evening) — Crawl Plan Protocol adoption

**Context.** Shortly after BASE-000/BASE-001 landed the FHWA baseline, the Epic 2 Curation
Review Protocol execution (BASE-008) produced a "PASS WITH ISSUES" verdict for the community
scrapers. MotorcycleRoads (BASE-002) yielded 30 routes against an expected >50 baseline, with
Alabama-stamped entries for Blue Ridge Parkway and Beartooth Pass (sidebar cross-state links
being treated as inbound from the current state listing). BestBikingRoads yielded ~413 routes
against a true US universe of ~4,100 and was declared "slow but functional" after ~21 minutes
of scraping. Commits `facb67b`, `12dfdfb`, and `b60629b` applied reactive patches to both
scrapers after the bugs had shipped at scale.

Investigation of the two scrapers revealed a recurring pattern in `motorcycleroads.py` and
`bestbikingroads.py`:

1. **Discovery + fetch + extraction interleaved in a single pass** with no intermediate
   artifacts. `_scrape_state()` fetches a state listing page and immediately drills into each
   linked route detail page in the same loop. A wrong selector is not discovered until the
   full crawl has run.
2. **Blind CSS selectors** (`.field-field-rating`, `[class*='rating']`, `article.route .content`,
   `.field-field-scenery`) that were guesses never validated against a real route page.
3. **Swallowed exceptions** (`except Exception: continue`) at every layer with no accountability
   counters — a 10% yield was indistinguishable from a working scraper hitting a small universe.
4. **No committed URL inventory**, so dedup happened at extraction time and sidebar contamination
   was undetectable until the output was inspected by hand.
5. **No fixture-based parser tests**, so the "state from listing page" bug was only discovered
   after running at scale (and only then patched in commit `facb67b`).

This is a systemic failure mode, not an Epic 2 bug. Epic 4 (3 new sources — Scenic Byways GIS,
Rider Magazine 50 Best, curvature discovery) and Sprint 9 (3 new community sources — ADVRider RSS,
Reddit API, Pushshift) would reproduce the pattern six more times without intervention. At least
one of those failures (Rider Magazine 50 Best → Sprint 8 SCO-002 calibration ground truth) cascades
directly into downstream epics and compromises the entire scoring-realignment work.

**Options considered.**

| # | Option | Rejected because |
|---|---|---|
| A | Accept the PASS WITH ISSUES verdict and move forward | The Epic 2 baseline is load-bearing for every downstream epic's diff. Sprint 6 dedup measures merge rates against this baseline; Sprint 8 calibration diffs against it; Sprint 12 orchestrator uses it as the ground reference. A junk baseline poisons all of them. The 98% BBR-miss and MR sidebar contamination would compound silently through every later epic. |
| B | Reactively patch the two scrapers again and call it done | This is what commits `facb67b`/`12dfdfb`/`b60629b` already did. Did not produce a clean baseline. Does not generalize to the six future scrapers in Epics 4 and 9. Kicks the same problem down the road. |
| C | Wait for Sprint 6 dedup to "fix" the duplicates at a later stage | Dedup cannot recover data that was never scraped. BBR's 90% miss rate is a discovery failure, not a duplication problem. Dedup cannot correct sidebar contamination that stamped Alabama onto Blue Ridge Parkway — the state field is already wrong at the row level. |
| D | Rewrite only the two existing scrapers (no protocol, no framework) | Addresses Epic 2 but does not prevent Epic 4/9 from reproducing the pattern. The cost of writing two scrapers carefully is comparable to the cost of writing a reusable framework plus two scrapers that consume it. |
| **E** | **Institutionalize a seven-phase Crawl Plan Protocol as a pre-extraction gate, build a shared `crawl_plan/` framework module, retroactively remediate MR + BBR under the protocol, then enforce the protocol on all future source tasks via acceptance criteria and at Curation Review Protocol Step 1** | **Selected.** Addresses the systemic failure mode, produces a clean Epic 2 baseline, prevents Epic 4 and Sprint 9 from reproducing the pattern, and creates a reusable framework that all six future source tasks consume. Cost: ~1-2 days for remediation + framework build; much cheaper than debugging cascading failures across Epics 4/6/8/9/12. |

**Decision.** Adopt [`tasks/CRAWL-PLAN-PROTOCOL.md`](../CRAWL-PLAN-PROTOCOL.md) as the mandatory
methodology for any task that extracts data from a remote source at scale:

- **Form A** — web scraper (HTML pages): MR, BBR, Rider Magazine
- **Form B** — structured API (GIS, JSON, OpenAPI): Scenic Byways GIS from Koordinates
- **Form C** — RSS / syndication feed: ADVRider 17-forum RSS
- **Form D** — paginated authenticated API: Reddit OAuth2, Pushshift historical backfill
- **Form E** — pre-computed file consumer: **exempt** (FHWA CSV via BASE-000, curvature pre-computed output via SRC-004)

The protocol is enforced through three binding mechanisms:

1. **New pipeline principle P6** added to `00-overview.md`: "Committed crawl plan before
   extraction at scale." Lives alongside the existing P0-P5 invariants inherited from the
   predecessor curation PRD.
2. **Pre-verification gate at Step 1 of `tasks/CURATION-REVIEW-PROTOCOL.md`**: every epic's
   curation review is now blocked on each in-scope source having a committed, verdict-PASS
   `crawl-report.md`. No fallback to PASS WITH ISSUES at the Step 1 level; if the crawl plan
   is incomplete, the review cannot proceed.
3. **Mandatory acceptance criteria block** in every source task file — Epic 4 SRC-001/SRC-006,
   Sprint 9 RID-001/RID-002/RID-006, and retroactively Epic 2 BASE-009. The AC block lists each
   of the seven protocol phases with binary gates; a source task cannot be marked Done without
   all gates green.

**Remediation task inserted.** A new task `BASE-009` is appended to Epic 2 as Wave 6 and becomes
the first application of the protocol. Scope:

1. Build the shared `scripts/curation/pipeline/sources/crawl_plan/` framework module
   (inventory.py, selectors.py, parser.py, executor.py) with unit tests
2. Apply all seven protocol phases to motorcycleroads.com and bestbikingroads.com (both Form A)
3. Commit the protocol artifacts at `.spec/prds/curation-hardening/crawl-plans/{source}/`
4. Commit the fixtures at `fixtures/{source}/`
5. Rewrite the existing `motorcycleroads.py` and `bestbikingroads.py` as thin glue layers over
   the new framework
6. Replace the junk staging and baseline files in place
7. Regenerate `review.md` with verdict PASS

Estimated effort: ~8-10 hours (framework build + recon + inventory + fixtures + selector spec
+ parse tests + rate-limited execution + accounting). BASE-009 blocks Epic 3 (INF-001) — Epic 3
extends models against the baseline, and extending against junk is the cascade failure this task
prevents. BASE-008 is updated to block BASE-009 rather than INF-001.

**Shared framework ownership.** The `crawl_plan/` module built in BASE-009 becomes the substrate
for all six future source tasks:
- Epic 4 SRC-001 (Scenic Byways GIS) — Form B extension with a JSONPath adapter over the framework
- Epic 4 SRC-006 (Rider Magazine 50 Best) — Form A, uses the framework as-is
- Sprint 9 RID-001 (ADVRider 17-forum RSS) — Form C extension with an XML/feedparser adapter
- Sprint 9 RID-002 (Reddit OAuth2 API) — Form D extension with a cursor-pagination adapter
- Sprint 9 RID-006 (Pushshift historical backfill) — Form D variant with date-range windowing

All five tasks share the same seven-phase shape and same gate structure. BASE-009 is the
battle-test for Form A on a known-hard case before the framework is applied to unknown
Form B/C/D sources.

**AC range revisions.** Epic 2's epic-level acceptance criteria are updated with realistic
expected counts based on ground-truth site recon:

- **MR:** ">50 routes" → "300-1000 routes". The PRD's ">50" was an aspirational floor that
  bore no relationship to MR's actual US universe. The 300-1000 range will be narrowed by
  BASE-009 Phase 0 recon.
- **BBR:** "10k-20k routes" → "3,500-5,500 routes". The PRD's "10k-20k" was a claim about the
  global BBR catalog. The US-only route count is ~4,100 per the site's own state-by-state nav
  menu (CA 427, TX 394, TN/OH 171 each, NY 160, FL/NC 147 each, KY 141, WA 138, PA 137, down
  to HI/NE 2 each). The 3,500-5,500 range gives room for cluster pages the Phase 0 recon may
  reveal.

These revised numbers are how the new baseline will be measured.

**Open items (non-blocking, tracked separately).**
- **INF-011 (proposed, not yet created):** Move the `crawl_plan/` framework build OUT of
  BASE-009 and into Epic 3 as a standalone infrastructure task, so BASE-009 scope is strictly
  re-crawl rather than build+re-crawl. Deferred for now — keeping both concerns in BASE-009
  avoids splitting the blocking relationship (BASE-009 → INF-001) and keeps Epic 3 focused on
  model/schema work. Revisit after BASE-009 lands if the framework build proves too large for
  a single task.
- **CI wiring:** `pytest scripts/curation/tests/sources/` on every PR touching sources or
  fixtures. Deferred pending framework build.
- **Firecrawl API budget** (~$1-3 total across the initiative for Phase 3 selector spec):
  to be approved in `09-technical-requirements.md` before Epic 4 begins.

**Signed off.** @justin (2026-04-13 evening) — approved via chat after reviewing
`CRAWL-PLAN-PROTOCOL.md` and the Epic 2 cascade-failure analysis mapping the protocol's impact
across Epics 2, 4, 6, 7, 8, 9, 12.

### Split sub-decision — BASE-009 → BASE-009a + BASE-009b (same day, after initial sign-off)

**Context.** The original BASE-009 task file bundled framework build + MotorcycleRoads
re-crawl + BestBikingRoads re-crawl + Epic 2 baseline regeneration + review.md verdict upgrade
into one ~8-10 hour task estimated at 480 minutes. On closer review of the task's execution
shape, a better structure emerged: split by source, not by phase.

**Why not per-phase.** The seven protocol phases are tightly coupled within a single source:
Phase 1 inventory feeds Phase 2 fixtures, which feeds Phase 3 selectors, which feeds Phase 4
tests, which feeds Phase 5 execution. Splitting them creates 14 task files (7 phases × 2 sources)
where most have no parallelism and each handoff loses context. Per-phase decomposition trades a
manageable single task for excessive task-management overhead with no risk-isolation benefit.

**Why per-source.** The two community sources are independent in every meaningful way — different
DOMs, different selectors, different fixture sets, different Phase 5 wall-clock budgets. The
framework they share is built once and consumed twice. A per-source split gives the one benefit
that matters: **risk isolation on BBR's 3.75-hour Phase 5 execution**. Framework bugs surfaced on
MR's ~30-minute Phase 5 cost one MR re-run to diagnose and fix. The same bugs surfaced on BBR's
~3.75-hour Phase 5 cost 3.75 hours per re-run. The split is worth ~5 file edits.

**Decision.** Replace BASE-009 with two sequential tasks:

| Task | Scope | Effort | Gate |
|---|---|---|---|
| **BASE-009a** | Build `crawl_plan/` framework module (generic, reusable, unit-tested) + apply all 7 protocol phases to motorcycleroads.com (Form A) + rewrite `motorcycleroads.py` as a ≤100-line glue file over the framework | ~270 min | MR `crawl-report.md` verdict PASS + framework unit tests green |
| **BASE-009b** | Apply all 7 protocol phases to bestbikingroads.com using the BASE-009a framework **unchanged** + rewrite `bestbikingroads.py` as framework glue + regenerate Epic 2 baseline artifacts from combined clean staging + upgrade `review.md` verdict from "PASS WITH ISSUES" to "PASS" | ~300 min | BBR `crawl-report.md` verdict PASS + baseline regenerated + `review.md` verdict PASS + all 5 landmarks present |

BASE-009a blocks BASE-009b. BASE-009b blocks INF-001 (Epic 3 start). Total effort: 570 min
(up from 480 min to account for the split's fixed overhead in two crawl-reports, two commits,
two rounds of preflight checks — a fair trade for the risk isolation).

**Human checkpoint between 009a and 009b.** After BASE-009a completes, the user reviews the MR
`crawl-report.md` and spot-checks 5 random records in `staging/motorcycleroads.jsonl` for:
- No Alabama-stamped Blue Ridge Parkway or Beartooth Pass entries
- Rating field populated for routes that visibly have ratings on the live page
- Route count in the 300-1000 range the user wrote in the committed site-map.md
- Framework code reads as generic (not MR-specific)

Only after this checkpoint passes does BASE-009b dispatch. If framework bugs surface, they're
fixed on MR's cheap re-run cycle and BASE-009a is re-run before BBR is touched.

**User-provided Phase 0 recon.** Both `site-map.md` files (MR and BBR) are committed by the user
BEFORE either BASE-009 task is dispatched. The user is the right agent for Phase 0: they've
already done most of the BBR recon in their head (50 state pages, ~4,046 route detail pages,
top-10 curated pages, `/rides/{cluster}` multi-area index pages — all enumerated in the planning
conversation), and they have firsthand knowledge of the MR sidebar contamination bug from the
prior commits `facb67b` / `12dfdfb`. Agent-driven Phase 0 would be slow and error-prone.

**Total effort impact on Epic 2.** Epic 2 total grows from 885 min → 975 min (+90 min from the
split overhead). Epic 2 task count grows from 10 → 11 (original BASE-009 replaced by BASE-009a
and BASE-009b). INDEX.md metrics updated accordingly: total tasks 44 → 45, total effort 6205 min
→ 6295 min.

**Dependency chain update.** Previously: BASE-008 → BASE-009 → INF-001. Now: BASE-008 →
BASE-009a → BASE-009b → INF-001. The additional human checkpoint between 009a and 009b is an
advisory gate, not a blocking dependency — the agent dispatches 009b automatically after 009a
completes, but the user can halt dispatch at the checkpoint if the MR result looks wrong.

**Signed off.** @justin (2026-04-13 evening, ~30 min after initial protocol adoption sign-off)
— approved split to trade ~5 file edits for risk isolation on the expensive BBR execution.

### Phase 0 recon findings — BASE-009a/b spec corrections (same evening, post-recon)

**Context.** Two parallel Phase 0 recon subagents (`general-purpose` agents, one per site)
produced committed site-map.md files at `.spec/prds/curation-hardening/crawl-plans/{motorcycleroads,bestbikingroads}/site-map.md`
in commit `e7f6368` on 2026-04-13 evening. Their findings surfaced five issues that required
spec corrections before BASE-009a/b could be dispatched.

**Finding 1 — MR true universe is ~2,044 routes, not 300-1000.** The MR recon agent traced the
Epic 2 scraper's 30-route yield to its exact root cause: the URL `/motorcycle-roads/{state-slug}`
returns the site **homepage with a 30-route global "Best" sidebar**, NOT a state-filtered listing.
The prior scraper fetched this URL 50 times and scraped the same 30 sidebar routes each time.
The correct master index is `/motorcycle-rides-in/united-states` (103 paginated pages × ~20
routes each = ~2,044 total). The prior `facb67b` "fix state from URL, not listing page" patch
addressed the contamination symptom but not the underlying wrong-URL-prefix disease.

Spec changes required:
- BASE-009a AC-3 route-detail count range: `[300, 1000]` → `[1800, 2200]`
- BASE-009a ESTIMATED_EFFORT_MINUTES: 270 → 330 (Phase 5 ~30 min → ~85 min for the larger inventory)
- BASE-009a AC-3 VERIFY python assertion updated to match
- BASE-009a boolean test criteria table row 3 updated
- BASE-009a SPECIFICATION "Why split" block updated with new route count
- BASE-009a NOTES effort breakdown updated
- Epic 2 epic-level AC range for MR: "300-1000" → "1,800-2,200"
- Epic 2 EPIC.md estimated effort header: 975 min → 1,035 min
- Epic 2 EPIC.md task table BASE-009a row: 270 → 330 min
- Epic 2 EPIC.md total effort summary: 975 → 1,035 min
- INDEX.md metrics "Estimated Effort": 6,295 min → 6,355 min
- INDEX.md Epic 2 full task table BASE-009a row: 270 → 330 min
- INDEX.md Epic 2 effort summary line: 975 → 1,035 min

**Finding 2 — Multi-state routes are first-class on MR and BBR.** Natchez Trace Parkway
legitimately crosses AL/MS/TN; Blue Ridge Parkway crosses NC/VA; Pacific Coast Highway crosses
CA/OR/WA. The single-string `state` field assumption in the original framework design would
force the parser to pick one state (likely the URL-derived one) and discard the others, breaking
Phase 4 contract assertions for these routes. Framework schema decision:

- Records have two state fields: `state_primary` (URL-slug-derived, always populated) and
  `states_all` (DOM-parsed list of all states the route crosses, at least 1 entry matching
  `state_primary`)
- Phase 4 fixture tests use `expected.state in record.states_all` (list membership), NOT
  `record.state == expected.state` (string equality)
- BASE-009a CRITICAL CONSTRAINTS section updated with a "CROSS-CUTTING RULES" sub-block
  mandating this schema
- BASE-009b CRITICAL CONSTRAINTS updated to inherit the rule
- CRAWL-PLAN-PROTOCOL.md Revision History entry added codifying this as a framework-wide rule
  that Epic 4 SRC-001/006 and Sprint 9 RID-001/002/006 also inherit
- Epic 3 INF-002 Route model extension task (currently stub-level) should be flagged to include
  both fields when that task file is generated — add to the stub's description before Epic 3
  dispatch

**Finding 3 — canonicalize() must preserve path, query, and fragment case.** The framework
skeleton originally proposed `urlparse(url.lower())` to normalize URLs for deduplication. BBR
recon established that route slugs include mixed-case identifiers like `Columbia-2`, where
lowercasing would collapse `/alabama/Columbia-2` and `/alabama/columbia-2` into the same
canonical URL — distinct routes erased. Fix: lowercase scheme + host only; preserve
path/query/fragment case. Affects both BASE-009a (framework implementation) and BASE-009b
(inherits framework behavior).

Changes:
- BASE-009a CRITICAL CONSTRAINTS "CROSS-CUTTING RULES" sub-block mandates path-case
  preservation with an explicit canonicalize() signature spec
- BASE-009b CRITICAL CONSTRAINTS inherits and enforces the rule, with a specific callout that
  BBR must NOT override framework canonicalization with BBR-specific normalization
- CRAWL-PLAN-PROTOCOL.md Revision History documents this as framework-wide

**Finding 4 (BBR only) — rating is in inline JavaScript, not DOM.** BBR stores ratings in
`responseA[i].comments_ave_rating` inline JS, not in a CSS-addressable element. The prior
scraper's `.rating` / `[class*='rating']` selectors never matched because they were looking in
the wrong place. BASE-009b selectors.yaml MUST declare `rating: required: false` (Phase 3
decision surfaced now — declaring `required: true` would fail Phase 3 fixture_yield validation
with a 0/5 score). The inline JS CAN be extracted via regex or a small JS-string parser, but
that is optional enrichment, not a required field.

Change: BASE-009b CRITICAL CONSTRAINTS "BBR-SPECIFIC RULES" sub-block adds a `rating:
required: false` mandate.

**Finding 5 (BBR only) — `/rides/{cluster}` pages are IN-SCOPE and ADDITIVE.** The BBR recon
agent measured cluster overlap vs state listings on Tennessee: state listing has 68 rides,
cluster `lake-obion-weakley` has 46 rides, only 17% URL overlap (83% additive). Cumulative
state + 2 clusters = 132 unique rides vs banner "167 routes". **Skipping clusters reproduces
Epic 2's exact ~10% yield failure.** The existing BASE-009b AC-3 range `[3500, 5500]` already
accommodates this (and was pinned to ~4,100 by the user's prior recon before Phase 0, so no AC
change needed), but the site-map.md scope decision is now backed by measured evidence.

Change: BASE-009b CRITICAL CONSTRAINTS "BBR-SPECIFIC RULES" sub-block adds a cluster-inclusion
mandate — if inventory row count comes in below 3,500 it almost certainly means cluster pages
were skipped and Phase 1 must return to the start.

**Cross-cutting rules for the protocol.** Findings 2 and 3 are not MR/BBR-specific — they apply
to every future source task (Epic 4 SRC-001/006, Sprint 9 RID-001/002/006). They're elevated to
framework-general constraints in BASE-009a's CRITICAL CONSTRAINTS section and documented in
CRAWL-PLAN-PROTOCOL.md's Revision History. The framework's design-review gate (BASE-009a AC-1
review by python-review + code-reviewer) specifically checks both.

**Split-commit weirdness (not fixed — noted for audit).** Both site-maps landed in a single
commit `e7f6368` because a pre-commit hook auto-staged the untracked MR file when the BBR recon
agent committed. The content is intact and correct; only the commit attribution is slightly
muddled (commit message says "BASE-009b Phase 0: bestbikingroads.com site-map" but the commit
also contains the MR site-map). Not a blocker — the files are correct and a `git show e7f6368`
reveals both. Noted here so git-blame does not confuse a future reader.

**Agent recon process validation.** The user overrode the protocol's "do not automate recon"
recommendation and dispatched two parallel `general-purpose` subagents with explicit briefs
(protocol doc + task files + known facts + required output structure + budget + traps to look
for). Both returned with high-confidence site-maps in ~25-30 minutes each. The MR agent in
particular traced the Epic 2 30-route-yield failure to its exact root cause
(`/motorcycle-roads/{state}` = homepage with sidebar, not state filter) within 30 minutes of
investigation — a root-cause diagnosis the user had not reached in their own prior analysis.
This is evidence that **agent-driven Phase 0 is viable for Forms A/C/D if the user provides
explicit briefs and reviews the output**. The protocol doc's "do not automate recon" guidance
is now softened in its Revision History entry to "automate only with explicit traps and a human
review gate" — a future protocol revision should fold this back into the main "Phase 0 — RECON"
section.

**Signed off.** @justin (2026-04-13 evening) — "do 1" approval covered (A) MR range + effort
correction, (B) multi-state schema adoption, (C) canonicalize path-case preservation, and (D)
leaving the muddled commit as-is. Framework design review at BASE-009a AC-1 gate will verify
rules (B) and (C) are honored at implementation time.

---

## 2026-04-14 (morning) — BASE-009b Phase 5 findings and spec recalibration

**Context.** Overnight autonomous execution of BASE-009a (MotorcycleRoads) and BASE-009b
(BestBikingRoads) produced measurable results against the specs written on 2026-04-13 PM.
BASE-009a landed cleanly at commit `cf947d7` (MR crawl-report.md verdict PASS, 1,899/1,908
routes, 99.5% yield). BASE-009b Phase 1+5 committed at `7d22b42` with inventory 3,226 + 170
cluster-indices, and Phase 5 execution ran for several hours producing a clean staging file.
In the course of that execution, four issues surfaced that require spec corrections and
protocol-level rule additions before Phase 6 + baseline regeneration + review.md verdict
upgrade can honestly commit.

### 3a — BASE-009b AC-3 gate recalibration from [3500, 5500] to [3100, 3400]

**Context.** AC-3 required BBR Phase 1 route-detail count in `[3500, 5500]`. Measured reality:
3,226 (below the lower bound by 274 records). Investigation confirmed this is the actual
measurable BBR universe, not a discovery gap.

**Investigation.**

1. **Clusters ARE recursively crawled.** The framework's `discover()` function walks PT-01
   state listings AND PT-02 sub-state cluster index pages, harvesting route links from both.
   Measured distribution in the committed `urls.jsonl`: 2,176 PT-03 route-details discovered
   from PT-01 state listings + 1,050 PT-03 route-details discovered from PT-02 cluster pages
   (170 clusters crawled) = 3,226 unique after canonicalize + dedupe. Cluster pages are NOT
   missed — the 83% additive finding from Phase 0 (measured on Tennessee) replicates at scale.
2. **Per-state audit confirms banner inflation, not discovery gaps.** Sampled California and
   Tennessee against the live BBR "NNN Motorcycle Roads" banner:
   - California: banner "401 Motorcycle Roads", inventory 329 routes, gap 72 (18%)
   - Tennessee: banner "167 Motorcycle Roads", inventory 154 routes, gap 13 (8%)
   - 8 California cluster pages are all present in inventory; PT-01 California has 81 inline
     `/ride/` + 8 `/rides/` cluster links; no pagination on PT-01
   - The 72-route CA gap is consistent with some legitimately unreachable routes (BBR's banner
     may include routes that are indexed internally but not linked from state/cluster pages,
     or routes that exist only on editorial top-10 pages which we deliberately skip per Phase
     0 scope decision)
3. **Site-map expected range was a pre-flight estimate, not a measurement.** The
   `[3500, 5500]` gate in BASE-009b.md AC-3 was derived by summing BBR nav-menu banner numbers
   for all 50 states (CA 427, TX 394, TN 171, OH 171, NY 160, FL 147, NC 147, KY 141, WA 138,
   PA 137, ... down to HI/NE 2) ≈ ~4,046 total with ~15% headroom each side. The banner totals
   are inflated vs what's navigable from state + cluster pages as shown by the CA/TN audits.
   The site-map's own line 74 explicitly framed this as "expected range" pinned to the user's
   prior recon — not a measurement.

**Options considered.**

| # | Option | Rejected because |
|---|---|---|
| A | Keep `[3500, 5500]` gate and call Phase 5 verdict FAIL | The gate was an estimate, not a measurement. Failing a task on an honest measurement of reality because a pre-flight estimate was wrong is the wrong lesson — it punishes measurement, not guesswork. |
| B | Loosen gate to `[2800, 5500]` or `[3000, 5500]` | Too wide. Defeats the purpose of the gate (catching discovery regressions on future re-runs). A future re-run that finds only 3,100 routes should be a loud warning, not absorbed noise. |
| C | Moderate `[3000, 3600]` | Also too wide. ±12% around measured reality is more tolerance than needed for a one-shot remediation. |
| **D** | **Narrow `[3100, 3400]`** | **Selected.** ~4% below measured 3,226 (catches a ~125-route drop from cluster-recursion regression or one state seed dropping) and ~5% above (headroom for BBR adding new routes or a minor classifier relaxation). Gates should reflect measured truth with a small variance window, not aspiration. |

**Decision.** Recalibrate BASE-009b AC-3 from `[3500, 5500]` to `[3100, 3400]` for Phase 1
inventory, and AC-9 bestbikingroads staging count from `[3500, 5500]` to `[2900, 3400]` for
Phase 5 staging (staging = ≥90% of inventory per AC-7, so ≥90% × 3,226 = ~2,903 minimum floor,
rounded down to 2,900). The two ranges are deliberately distinct — AC-3 is inventory, AC-9 is
staging, and the 200-record gap reflects expected HTTP error / dead-link attrition.

**Spec files updated in this commit.**

- `BASE-009b.md` AC-3 THEN clause (line 130) — range text updated with DECISIONS.md pointer
- `BASE-009b.md` AC-3 VERIFY command (line 132) — `assert` updated to `3100 <= ... <= 3400`
- `BASE-009b.md` AC-9 source_counts assertion (line 215) — `assert sc['bestbikingroads']` range updated to `2900 <= ... <= 3400` with inline comment explaining the inventory-vs-staging distinction
- `BASE-009b.md` Success-looks-like #1 (line 101) — staging range note updated
- `BASE-009b.md` Success-looks-like #4 (line 74) — staging count note updated
- `BASE-009b.md` Boolean test row #3 (line 254) — updated with recalibration pointer
- `EPIC.md` epic-level AC list (line 49) — BBR range note updated
- `HANDOFF.md` Current State and Immediate Next Step sections — refreshed for morning-of state
- `CRAWL-PLAN-PROTOCOL.md` Revision History — new row (2026-04-14 morning) points here

**Files deliberately NOT updated (audit integrity).**

- `crawl-plans/bestbikingroads/site-map.md` — Phase 0 recon artifact committed in `e7f6368`.
  It represents the hypothesis at the time of recon. Rewriting it to match measured reality
  would erase the learning loop. The site-map's `[3500, 5500]` is explicitly cited above as
  the superseded pre-flight estimate.
- DECISIONS.md earlier entries (lines 231, 234, 396) — historical 2026-04-13 evening records
  that say "the then-current `[3500, 5500]` was the gate". They are audit entries. This new
  sub-section 3a supersedes them via chronological layering, not rewriting.

### 3b — BBR single-state schema exemption (states_all design decision)

**Context.** The 2026-04-13 evening cross-cutting rule from BASE-009a states:

> Source records that can span multiple states MUST use `state_primary` (URL-derived) +
> `states_all` (DOM-parsed list, at least 1 entry matching `state_primary`). Phase 4 fixture
> tests assert `expected.state in record.states_all` (list membership).

On BBR, there is no authoritative source of multi-state information:

1. **URL is single-state.** BBR route URLs have shape
   `/motorcycle-roads/united-states/{state-slug}/ride/{route-slug}` — one state in the path.
2. **DOM does not carry multi-state.** BBR route detail pages do not have a meta description
   that enumerates states (unlike MR, which has `Route Name | Route Ref. #NNNNN | State1,United
   States,State2,...` that the parser successfully mines for Natchez Trace Parkway's
   AL+MS+TN extraction).
3. **Sidebar is TRAP-01.** The "you might also like" rail on BBR PT-03 pages shows cross-state
   routes, but those are OTHER routes' states, not the current route's. Using sidebar data
   for `states_all` would reintroduce the exact sidebar contamination that caused the Epic 2
   MR Alabama-stamped Blue Ridge Parkway bug.
4. **Route names sometimes hint multi-state** (e.g., "Hammondville (AL) - Summerville (GA)"
   on BBR's `/alabama/ride/...`) but parsing these with regex is brittle and NLP is outside
   scope.

**Decision.** BBR's `states_all` is `[state_primary]` — a single-element list always
containing only the URL-derived state. This is protocol-compliant:

1. The schema rule is "records MUST use `state_primary` + `states_all` where `states_all` is a
   list with ≥1 entry containing `state_primary`". BBR satisfies this with length 1.
2. The rule's INTENT is "don't silently drop state data when a source has multi-state
   evidence". BBR has no such evidence for route detail pages. The rule is not a mandate to
   invent multi-state data from unreliable heuristics.
3. Phase 4 fixture tests for BBR assert `expected.state in record.states_all` correctly —
   with length-1 lists, the membership check still works, it just reduces to equality.

**Rationale for explicit exemption entry.** Without this decision record, a future reader
auditing BBR records against the cross-cutting rule might flag all BBR records as rule
violations. The entry makes the design choice explicit and traceable.

**Future reopening.** If BBR adds a meta-description-style authoritative state list later
(schema change on BBR's side), or if NLP-over-route-names becomes in-scope for mention
extraction, revisit this decision and widen BBR's `states_all` to carry true multi-state info.
Track as non-urgent future work; not blocking for Epic 2, Epic 4, or Sprint 9.

### 3c — Anti-pattern: Python module cache during mid-run parser edits

**Context.** During BASE-009a Phase 5 run #1 (MR), the implementing agent noticed that the
parser's description extraction was targeting the wrong DOM element (`<p>` siblings instead of
`<span>` siblings under the "Written Directions" h3). It committed the fix as `585852f Fix
parser.py: description extraction uses span (not p) siblings` WHILE the MR crawler was still
running in the background. The expectation was that the fix would apply to subsequent fetches.

**What actually happened.** Python imports modules at process start time. When
`scripts/curation/pipeline/sources/crawl_plan/parser.py` was first imported by the running
crawler (before the fix commit), the interpreter loaded the file, compiled the AST to
bytecode, and cached the result in `sys.modules`. Subsequent file changes on disk do NOT
hot-reload — the running process continues to execute the cached bytecode. Result: the first
~590 MR records were silently parsed with the pre-fix (buggy) parser, producing 0% description
yield. The audit counters showed `parse_success=590` because the parser didn't crash — it
just returned `description=None` for every record.

**How it was detected.** A spot-check on 3 random staged records showed all three had empty
descriptions. Running the freshly-committed parser against a live fetch of the same URL
produced a 140-character description — confirming the on-disk code was correct but the running
process was using a stale copy.

**Recovery.**

1. Killed the running crawler via `kill 64460` (clean SIGTERM, exited cleanly)
2. Wiped staging files: `rm staging/motorcycleroads.jsonl staging/motorcycleroads.jsonl.progress staging/motorcycleroads.jsonl.audit.json`
3. Restarted the crawler fresh via `nohup ... & disown` (see sub-section 3d for the nohup part)
4. Second run imported the committed parser.py at its own process-start and produced 99.6%
   description yield over 1,899 records. Clean.

**Lesson.** Python module bytecode is snapshotted at import. Editing source files during a
long-running crawler does not change the crawler's behavior. The only safe way to apply a
fix to code the crawler depends on is:

1. **Kill the crawler** (preserves .progress file if resume is wanted)
2. **Fix and commit** the source file
3. **Restart the crawler** (imports the new bytecode fresh; resume from .progress or wipe and
   restart fresh depending on whether the bug produced corrupt intermediate output)

**Decision.** Elevate to protocol-level rule in CRAWL-PLAN-PROTOCOL.md Revision History:

> Never edit framework/parser source while a crawler process is live — kill → fix → restart.

This rule is added to BASE-009a CROSS-CUTTING RULES (retroactively) and to every future
Phase 5 execution brief in the protocol doc's phase descriptions.

**Framework defense considered and deferred.** A hash-at-load-time check
(`hashlib.sha256(open(__file__,'rb').read())` stored as a module global, re-checked on each
call, raising if the on-disk file changed) would catch this automatically. Rejected for now
because (a) the discipline "don't edit during run" is simpler and catches more failure modes
(including dependency edits, not just parser.py), (b) adding the check to every framework
module is code bloat for a narrow protection, and (c) this kind of supervisor concern belongs
to Sprint 12 orchestrator, not BASE-009b. Documented for future reference.

### 3d — Anti-pattern: subagent session death orphaning background crawlers

**Context.** BASE-009b Phase 5 was dispatched to a `python-implement` agent with instructions
to run the crawler in background and poll audit.json periodically. The agent started the
crawler via a Bash `run_in_background=true` call, reported progress, and then its session
ended (agents have context budgets; after a certain number of tool uses or token count, they
return their result and the session terminates). The BBR crawler process was a child of the
agent's bash subprocess. When the agent session ended, its bash subprocess exited, and the
bash subprocess's children (including the crawler Python process) were killed.

**What happened at the session boundary.** The crawler had fetched 50 routes cleanly
(`fetched=50, parse_success=50, schema_validation_fail=0, http_error=0`) and was still rate-
limited-paced through Alabama routes when the agent session terminated. No crash, no log
entry, no error — the process simply disappeared from `ps`.

**How it was detected.** The orchestrator (me, root session) checked crawler process status
several minutes after the agent reported progress, saw `no crawler processes` from
`ps aux | grep bestbikingroads`, and investigated.

**Recovery.**

1. Verified the crawler was not running (ps clean)
2. Wiped staging files (50 records is a small loss; fresh restart is simpler than resume)
3. Restarted the crawler via `nohup bash -c 'PYTHONPATH=... .venv/bin/python -m scripts.curation.pipeline.sources.bestbikingroads > /tmp/bbr_crawl_v2.log 2>&1' & disown`
   - `nohup` makes the process ignore SIGHUP (the signal bash sends to children when exiting)
   - `&` detaches from the foreground
   - `disown` removes the process from the shell's job table so it is not sent SIGHUP even if
     the disown pre-dates nohup propagation
4. The crawler then survived all subsequent session changes and ran to ~3 hr 15 min elapsed at
   measurement time, well past any agent session boundary
5. Started a separate polling background task that exits when the crawler PID disappears, to
   get a clean notification when Phase 5 completes

**Lesson.** Long-running crawlers dispatched by subagents die with the subagent if started as
naive child processes. The fix is process-lifetime independence:

- **Option A (shell-level):** `nohup <cmd> > logfile 2>&1 & disown` from inside a bash call —
  makes the crawler survive the dispatching session's death
- **Option B (orchestrator-level):** the orchestrator (root session) dispatches the crawler
  directly via `run_in_background=true`, not via a subagent — the crawler is a child of the
  orchestrator's shell, not of a transient subagent
- **Option C (platform-level):** use systemd/launchd/tmux/screen for true process supervision —
  overkill for Phase 5 runs but the right long-term answer for Sprint 12 orchestrator

**Decision.** Elevate to protocol-level rule in CRAWL-PLAN-PROTOCOL.md Revision History:

> Long-running crawlers MUST be dispatched with process lifetime independent of the dispatching
> session — either `nohup ... & disown` from inside a shell, or the orchestrator launching with
> `run_in_background=true` directly, or a systemd/launchd supervisor. Subagent-dispatched child
> processes die with the subagent.

This rule is added to CRAWL-PLAN-PROTOCOL.md Phase 5 description (via the morning revision
row) and to BASE-009a/b Phase 5 execution briefs (retroactively via DECISIONS.md cross-ref).

**Framework defense considered and deferred.** A PID file + heartbeat supervisor would catch
this automatically — the crawler writes its PID + last-progress timestamp periodically, and a
supervisor process checks heartbeat staleness and alerts or restarts. Rejected for now as
Sprint 12 orchestrator concern, not BASE-009b scope. Documented for future reference.

---

**Signed off.** @justin (2026-04-14 morning) — plan approved in plan mode; remediation
executed in a single atomic "spec: BBR gate recalibration + operational lessons" commit +
separate Epic 3 INF-011 stub commit. Plan file at `~/.claude/plans/eventual-cuddling-wombat.md`.

---
