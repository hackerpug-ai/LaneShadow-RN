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
tags drawn from 22 distinct combinations:

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
be filtered out by Epic 6's quality floor when that epic lands. Filtering them in
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
