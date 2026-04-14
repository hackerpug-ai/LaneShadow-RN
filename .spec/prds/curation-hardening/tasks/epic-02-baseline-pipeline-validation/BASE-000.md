================================================================================
TASK: BASE-000 - Fetch FHWA Scenic Byways dataset and write static CSV baseline
================================================================================

TASK_TYPE: INFRA / DATA_PREP
STATUS: Done
TDD_PHASE: GREEN
CURRENT_AC: complete
PRIORITY: P0
EFFORT: M
TYPE: PROCESS
ITERATION: 1

--------------------------------------------------------------------------------
CRITICAL CONSTRAINTS
--------------------------------------------------------------------------------

MUST: Write a one-shot data prep script at `scripts/curation/data_prep/fetch_fhwa.py` that queries the DOT ArcGIS FeatureServer at `https://geo.dot.gov/server/rest/services/US_Scenic_Byways/MapServer/107` for all features as GeoJSON, derives the 6-column CSV deterministically, and writes `data/fhwa_byways.csv` at repository root.
MUST: Commit BOTH the prep script AND the resulting CSV in a single commit with the rationale "Epic 2 BASE-000: fetch FHWA scenic byways from DOT ArcGIS". The CSV is static data (~30-80 KB) and MUST be committed to the repository so downstream BASE-* tasks are hermetic and do not depend on network access.
MUST: Verify row count is within **580–710** (±10% around the expected ~645 distinct routes) and assert loudly if not — do NOT widen the range without user approval. If DOT updates the layer and the count drifts outside this window, that is a legitimate spec change requiring a new DECISIONS.md entry.
MUST: Deduplicate rows by `RouteName` BEFORE writing the CSV. The raw layer returns 648 features for 645 distinct names (a few multi-segment routes are split across multiple polyline features). For duplicate names, merge segments by concatenating geometries before computing centroid/length.
MUST: Resolve `State` via point-in-polygon against DOT layer 110 (`US_StateBndrys`) on the same MapServer. For multi-state routes (polylines crossing state boundaries), return the **alphabetically-sorted** joined string (e.g., `"North Carolina / Virginia"`, not `"Virginia / North Carolina"`).
MUST: Compute `CentroidLat`/`CentroidLng` from the polyline geometry centroid in WGS84 (EPSG:4326), NOT from layer 110's state centroid. Use `shapely.geometry.shape().centroid` after projecting to a local equal-area projection if geodesic accuracy matters for long multi-state routes; for Epic 2 baseline the bbox center is acceptable.
MUST: Compute `LengthMiles` from the polyline's geodesic length using `pyproj.Geod.geometry_length()` on the merged geometry. Round to 1 decimal place. If the feature has no geometry (should not happen but possible), write empty string and log a warning.
MUST: Preserve `Admin_Org` verbatim as the `AgencyTags` column value (e.g., `"NSB, USFS, NPS"`, `"STATE"`). Do NOT collapse, normalize, or strip whitespace from this field beyond `.strip()`.
MUST: Write the CSV with `encoding='utf-8-sig'` and `csv.QUOTE_MINIMAL` quoting so `parse_fhwa_csv()`'s `open(path, newline="", encoding="utf-8-sig")` reads it without BOM issues.
NEVER: Hand-type CSV rows or paste CSV content from an LLM. All rows MUST be derived from the live DOT ArcGIS query. Hallucinated data would silently corrupt the Epic 2 baseline every downstream epic diffs against.
NEVER: Filter out the 645 routes to "just federal NSBs" (the `NSB`-tagged subset is 127 routes, not 184, and filtering contradicts the Option 1 decision in DECISIONS.md dated 2026-04-13).
NEVER: Modify `scripts/curation/pipeline/sources/fhwa.py` or `parse_fhwa_csv()` in this task — the existing parser is the contract; BASE-000 produces input that satisfies it.
NEVER: Commit the prep script to `scripts/curation/pipeline/` — it belongs under `scripts/curation/data_prep/` as a one-shot tool, not as production pipeline code.
STRICTLY: The script is re-runnable and deterministic against a fixed DOT snapshot. Running it twice in a row must produce byte-identical CSV output modulo changes upstream at DOT.
STRICTLY: The script prints a summary to stdout on success: row count, count by `AgencyTags` category (NSB / STATE / USFS / NPS / BLM / mixed), min/max `LengthMiles`, and any rows with missing state resolution.

--------------------------------------------------------------------------------
SPECIFICATION
--------------------------------------------------------------------------------

**Objective:** Produce `data/fhwa_byways.csv` — the static, committed, 6-column CSV that `scripts/curation/pipeline/sources/fhwa.py::parse_fhwa_csv()` consumes — by querying the DOT ArcGIS FeatureServer's `US_Scenic_Byways/MapServer/107` layer for all 648 features, deduplicating by route name, resolving state and computing centroid/length from polyline geometry, and writing the result to disk. The CSV is committed to the repo as static data so every downstream BASE-* task is hermetic.

**Success looks like:** `scripts/curation/data_prep/fetch_fhwa.py` exists and is re-runnable; `data/fhwa_byways.csv` exists with **580–710 rows** (expected ~645), six columns (`RouteName, State, CentroidLat, CentroidLng, LengthMiles, AgencyTags`), every row has non-empty `RouteName`/`State` and numeric `CentroidLat`/`CentroidLng`; the five in-scope landmarks (Blue Ridge Parkway, Beartooth Highway, Pacific Coast Scenic Byway - Oregon, Pacific Coast Scenic Byway - Washington, Historic Columbia River Highway) appear in the CSV; both the script and the CSV are committed to git.

**Non-goals for this task:**
- No filtering of "non-road" routes (Alaska Marine Highway, Alaska Railroad remain in the CSV — Epic 6 quality floor handles them).
- No AAR / NSB binary distinction (the DOT layer does not encode AAR; `AgencyTags` preserves the raw string for downstream use).
- No modification to `parse_fhwa_csv()` or any pipeline code.
- No network fetch at runtime — the CSV is committed.

--------------------------------------------------------------------------------
BACKGROUND
--------------------------------------------------------------------------------

**Problem.** Epic 2 BASE-001 requires `data/fhwa_byways.csv` as input. This file did not exist anywhere in the repository at Epic 2 kickoff, and no publicly-available FHWA dataset ships the schema that `parse_fhwa_csv()` expects (`RouteName, State, CentroidLat, CentroidLng, LengthMiles`). The predecessor PRD (`.spec/prds/curation/05-uc-ingest.md:25`) claimed "System downloads FHWA byways CSV from data.gov URL", but that statement was aspirational — **data.gov does not publish a federal National Scenic Byways CSV** (only Iowa, New York, and North Dakota state subsets are indexed there). FHWA publishes the 184-route "America's Byways" program only as a PDF and HTML page, neither of which contains coordinates.

**Investigation findings** (see `DECISIONS.md` for the full record):
1. The canonical authoritative federal data lives at `geo.dot.gov/server/rest/services/US_Scenic_Byways/MapServer/107` — an ArcGIS FeatureServer supporting JSON, geoJSON, and PBF query formats, public domain per 17 USC §101.
2. Layer 107 returns **648 features / 645 distinct route names**, not the 184 the PRD assumed.
3. The layer is a **DOT-compiled superset** of scenic byways across agencies: 127 federal NSBs, 525 state-designated, 130 USFS, 54 BLM, 9 NPS. The `Admin_Org` field carries comma-separated agency tags drawn from 22 distinct combinations. The `Type` field is always `"National Scenic Byway"` — AAR is not encoded.
4. Two well-known motorcycle landmarks — Tail of the Dragon (TN) and Million Dollar Highway (CO) — are NOT in the DOT layer because they are state-designated, not federal. They will enter the catalog via BBR/MR community scrapers (BASE-002), not BASE-001/BASE-000.

**Why not just filter to NSB-only?** That subset is 127 routes, still not matching the PRD's aspirational 184 and still requiring every "184" reference in the curation-hardening PRD to change anyway. The decision in DECISIONS.md (Option 1) is: **accept the full 645 superset as the FHWA baseline**, and update the PRD's references. This is the only option where the data and the documentation agree on a single number.

**Current state.** `scripts/curation/pipeline/sources/fhwa.py::parse_fhwa_csv(path: str) -> list[Route]` is implemented and expects the 5-column schema described above. The `Route` dataclass lives in `scripts/curation/pipeline/models.py`. A 3-row test fixture exists at `scripts/curation/tests/fixtures/fhwa_sample.csv` — unit tests will use it, BASE-001 will use the real CSV produced here.

**Desired state.** A one-shot script at `scripts/curation/data_prep/fetch_fhwa.py` that fetches layer 107 as GeoJSON, resolves state via point-in-polygon on layer 110, deduplicates by route name, computes centroid and geodesic length, preserves `Admin_Org` as `AgencyTags`, and writes `data/fhwa_byways.csv`. The CSV is committed. Future re-runs are reproducible: the same DOT snapshot produces the same CSV. When DOT updates the layer, the script is re-run and a new CSV commit captures the change.

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA (TDD Beads)
--------------------------------------------------------------------------------

AC-1: fetch_fhwa.py exists and queries layer 107 successfully
  GIVEN: `scripts/curation/data_prep/fetch_fhwa.py` has been created and the DOT ArcGIS endpoint at `geo.dot.gov/server/rest/services/US_Scenic_Byways/MapServer/107` is reachable
  WHEN: `python -m scripts.curation.data_prep.fetch_fhwa` is executed
  THEN: the module exits 0, makes an HTTP GET to the layer's `/query` endpoint with `f=geojson&where=1=1&outFields=*&returnGeometry=true`, receives a FeatureCollection with ≥600 features, and does NOT raise on JSON parsing

  TDD_STATE: [ ] RED  [ ] VERIFY_RED  [ ] GREEN  [ ] VERIFY_GREEN  [ ] REFACTOR
  TEST_FILE: (validation via direct script run; no unit test file)
  TEST_FUNCTION: verify_fetch_fhwa_runs
  VERIFY: `python -m scripts.curation.data_prep.fetch_fhwa && test -f data/fhwa_byways.csv && echo 'fetch_fhwa module PASS'`

AC-2: CSV has 580-710 rows with correct schema
  GIVEN: `data/fhwa_byways.csv` exists from AC-1
  WHEN: the file is parsed with `csv.DictReader`
  THEN: the header row is exactly `RouteName,State,CentroidLat,CentroidLng,LengthMiles,AgencyTags`; row count is between 580 and 710 inclusive; every row has non-empty `RouteName` and `State`, numeric `CentroidLat`/`CentroidLng` parseable as floats

  TDD_STATE: [ ] RED  [ ] VERIFY_RED  [ ] GREEN  [ ] VERIFY_GREEN  [ ] REFACTOR
  TEST_FILE: (validation via script's own self-check + post-run grep)
  TEST_FUNCTION: verify_csv_schema_and_count
  VERIFY: `python -c "import csv; rows=list(csv.DictReader(open('data/fhwa_byways.csv',encoding='utf-8-sig'))); assert 580<=len(rows)<=710, f'count {len(rows)} out of 580-710'; required=['RouteName','State','CentroidLat','CentroidLng','LengthMiles','AgencyTags']; assert set(required).issubset(rows[0].keys()), f'missing cols: {set(required)-set(rows[0].keys())}'; bad=[i for i,r in enumerate(rows) if not r['RouteName'] or not r['State'] or not r['CentroidLat'] or not r['CentroidLng']]; assert not bad, f'bad rows: {bad[:5]}'; print(f'schema PASS, {len(rows)} rows')"`

AC-3: parse_fhwa_csv() accepts the generated CSV
  GIVEN: `data/fhwa_byways.csv` exists from AC-2 and `scripts/curation/pipeline/sources/fhwa.py::parse_fhwa_csv()` is unchanged
  WHEN: `parse_fhwa_csv("data/fhwa_byways.csv")` is called
  THEN: the function returns a list of Route objects with `source="fhwa"`, the list length equals the CSV row count (±5 for rows skipped due to parse warnings), and the first Route has non-None name/state/centroid_lat/centroid_lng

  TDD_STATE: [ ] RED  [ ] VERIFY_RED  [ ] GREEN  [ ] VERIFY_GREEN  [ ] REFACTOR
  TEST_FILE: (integration check; no unit test file)
  TEST_FUNCTION: verify_parse_fhwa_csv_accepts_generated_csv
  VERIFY: `python -c "from scripts.curation.pipeline.sources.fhwa import parse_fhwa_csv; routes=parse_fhwa_csv('data/fhwa_byways.csv'); assert len(routes)>=575, f'parser got only {len(routes)} routes'; r=routes[0]; assert r.name and r.state and r.centroid_lat and r.centroid_lng, f'first route incomplete: {r}'; print(f'parse_fhwa_csv PASS, {len(routes)} Route objects')"`

AC-4: Known-federal landmarks present with correct AgencyTags
  GIVEN: `data/fhwa_byways.csv` exists from AC-1
  WHEN: the CSV is searched for known federal NSB landmarks
  THEN: Blue Ridge Parkway, Beartooth Highway, and at least one Pacific Coast Scenic Byway row exist; each has `AgencyTags` containing the substring `"NSB"`

  TDD_STATE: [ ] RED  [ ] VERIFY_RED  [ ] GREEN  [ ] VERIFY_GREEN  [ ] REFACTOR
  TEST_FILE: (integration check)
  TEST_FUNCTION: verify_landmarks_present
  VERIFY: `python -c "import csv; rows=list(csv.DictReader(open('data/fhwa_byways.csv',encoding='utf-8-sig'))); names={r['RouteName']:r for r in rows}; assert 'Blue Ridge Parkway' in names, 'Blue Ridge Parkway missing'; assert 'Beartooth Highway' in names, 'Beartooth Highway missing'; assert any('Pacific Coast' in n for n in names), 'no Pacific Coast route'; assert 'NSB' in names['Blue Ridge Parkway']['AgencyTags'], f'BRP AgencyTags missing NSB: {names[\"Blue Ridge Parkway\"][\"AgencyTags\"]}'; print('landmarks PASS')"`

AC-5: Prep script and CSV both committed to git
  GIVEN: ACs 1-4 pass
  WHEN: `git ls-files` is checked for both paths
  THEN: `scripts/curation/data_prep/fetch_fhwa.py` is tracked AND `data/fhwa_byways.csv` is tracked AND both were added in a single commit

  TDD_STATE: [ ] RED  [ ] VERIFY_RED  [ ] GREEN  [ ] VERIFY_GREEN  [ ] REFACTOR
  TEST_FILE: (git integration check)
  TEST_FUNCTION: verify_both_files_committed
  VERIFY: `git ls-files --error-unmatch scripts/curation/data_prep/fetch_fhwa.py data/fhwa_byways.csv && echo 'both files committed PASS'`

Quality Criteria:
- [ ] All 5 ACs verified via VERIFY commands
- [ ] Row count recorded in DECISIONS.md (update the 2026-04-13 entry with the actual number)
- [ ] Landmarks present with NSB-containing AgencyTags
- [ ] Re-running the script produces byte-identical CSV (deterministic)

--------------------------------------------------------------------------------
TEST CRITERIA (Boolean Verification)
--------------------------------------------------------------------------------

| # | Boolean Statement | Maps To AC | Verify | Status |
|---|-------------------|------------|--------|--------|
| 1 | `python -m scripts.curation.data_prep.fetch_fhwa` exits 0 and writes `data/fhwa_byways.csv` | AC-1 | `python -m scripts.curation.data_prep.fetch_fhwa && test -f data/fhwa_byways.csv` | [ ] TRUE [ ] FALSE |
| 2 | `data/fhwa_byways.csv` has 580-710 rows and the 6-column schema | AC-2 | `python -c "import csv; rows=list(csv.DictReader(open('data/fhwa_byways.csv',encoding='utf-8-sig'))); assert 580<=len(rows)<=710; assert set(['RouteName','State','CentroidLat','CentroidLng','LengthMiles','AgencyTags']).issubset(rows[0].keys())"` | [ ] TRUE [ ] FALSE |
| 3 | `parse_fhwa_csv('data/fhwa_byways.csv')` returns ≥575 Route objects | AC-3 | `python -c "from scripts.curation.pipeline.sources.fhwa import parse_fhwa_csv; assert len(parse_fhwa_csv('data/fhwa_byways.csv'))>=575"` | [ ] TRUE [ ] FALSE |
| 4 | Blue Ridge Parkway and Beartooth Highway are present with `NSB` in AgencyTags | AC-4 | `python -c "import csv; rows={r['RouteName']:r for r in csv.DictReader(open('data/fhwa_byways.csv',encoding='utf-8-sig'))}; assert 'NSB' in rows['Blue Ridge Parkway']['AgencyTags'] and 'NSB' in rows['Beartooth Highway']['AgencyTags']"` | [ ] TRUE [ ] FALSE |
| 5 | Both `scripts/curation/data_prep/fetch_fhwa.py` and `data/fhwa_byways.csv` are tracked in git | AC-5 | `git ls-files --error-unmatch scripts/curation/data_prep/fetch_fhwa.py data/fhwa_byways.csv` | [ ] TRUE [ ] FALSE |

--------------------------------------------------------------------------------
READING LIST
--------------------------------------------------------------------------------

1. scripts/curation/pipeline/sources/fhwa.py
   - Lines: ALL (63 lines)
   - Focus: `parse_fhwa_csv()` column requirements — the exact contract BASE-000 must satisfy. Note `utf-8-sig` encoding, `csv.DictReader` header lookup, `_safe_float` fallback on LengthMiles.

2. scripts/curation/pipeline/models.py
   - Lines: 1-30
   - Focus: `Route` dataclass fields — to understand what `parse_fhwa_csv` returns and what downstream BASE-* tasks expect.

3. .spec/prds/curation-hardening/tasks/epic-02-baseline-pipeline-validation/DECISIONS.md
   - Lines: ALL
   - Focus: The 2026-04-13 decision log entry — Option 1, 6-column schema, 580-710 tolerance, why 184 was aspirational.

4. scripts/curation/tests/fixtures/fhwa_sample.csv
   - Lines: ALL (4 lines)
   - Focus: Reference format — header row exactly matches what BASE-000 must write (minus the new `AgencyTags` column, which the fixture does not have).

5. ArcGIS REST API — Query (FeatureService/Layer)
   - URL: https://developers.arcgis.com/rest/services-reference/enterprise/query-feature-service-layer.htm
   - Focus: `f=geojson` output format, `outFields`, `returnGeometry`, result pagination limits (not relevant — 648 features < maxRecordCount=2000).

--------------------------------------------------------------------------------
GUARDRAILS
--------------------------------------------------------------------------------

WRITE-ALLOWED (explicit file list):
- scripts/curation/data_prep/__init__.py (NEW — empty, just for Python package)
- scripts/curation/data_prep/fetch_fhwa.py (NEW — the one-shot prep script)
- data/fhwa_byways.csv (NEW — the committed static CSV; ~30-80 KB)

WRITE-PROHIBITED:
- scripts/curation/pipeline/** — do NOT modify any production pipeline code in this task. `parse_fhwa_csv()` is the contract; this task satisfies it, does not change it.
- .spec/prds/curation-hardening/** — documentation updates are separate edits in the same commit batch, not part of the fetch script itself.
- convex/** — no Convex work in BASE-000.

MUST:
- [ ] Use `httpx` or `requests` for the HTTP GET (project already depends on one of these — prefer `httpx` if available in `scripts/curation/pipeline/` imports).
- [ ] Use `shapely` for polyline centroid computation (already in project dependencies per `09-technical-requirements.md:480`).
- [ ] Use `pyproj.Geod` for geodesic length computation in miles (add dependency if not present — note in commit message).
- [ ] Log row count and AgencyTag breakdown to stdout on success.

MUST NOT:
- [ ] Fetch data at BASE-001 runtime — the CSV is static, committed input.
- [ ] Generate CSV rows from an LLM or hand-type values.
- [ ] Filter out the 645 routes (including edge cases like Alaska Marine Highway).
- [ ] Modify `parse_fhwa_csv()`.

--------------------------------------------------------------------------------
CODE PATTERN (Reference)
--------------------------------------------------------------------------------

Pattern: one-shot ArcGIS-to-CSV prep script. Queries a FeatureServer layer, merges multi-segment features by name, resolves state via point-in-polygon on a sibling layer, computes centroid and geodesic length, writes deterministic CSV output.

```python
"""
scripts/curation/data_prep/fetch_fhwa.py

One-shot script to fetch the DOT US Scenic Byways layer and write
data/fhwa_byways.csv for Epic 2 BASE-001 baseline validation.

Run from project root:
    python -m scripts.curation.data_prep.fetch_fhwa

See .spec/prds/curation-hardening/tasks/epic-02-baseline-pipeline-validation/DECISIONS.md
for the rationale behind Option 1 (accept 645-route superset).
"""
from __future__ import annotations

import csv
import json
import logging
import sys
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any

import httpx
from pyproj import Geod
from shapely.geometry import MultiLineString, shape
from shapely.ops import unary_union

LAYER_URL = (
    "https://geo.dot.gov/server/rest/services/"
    "US_Scenic_Byways/MapServer/107/query"
)
STATE_LAYER_URL = (
    "https://geo.dot.gov/server/rest/services/"
    "US_Scenic_Byways/MapServer/110/query"
)
OUTPUT_PATH = Path("data/fhwa_byways.csv")
EXPECTED_MIN = 580
EXPECTED_MAX = 710

_GEOD = Geod(ellps="WGS84")
_log = logging.getLogger("fetch_fhwa")


def fetch_layer_geojson(url: str) -> dict[str, Any]:
    """GET the ArcGIS layer as GeoJSON. Returns the parsed FeatureCollection."""
    params = {
        "where": "1=1",
        "outFields": "*",
        "returnGeometry": "true",
        "f": "geojson",
    }
    _log.info(f"fetching {url}")
    r = httpx.get(url, params=params, timeout=60.0)
    r.raise_for_status()
    return r.json()


def merge_segments_by_name(fc: dict) -> dict[str, dict]:
    """
    Merge multi-segment features by Trail_Name. Returns
    {name: {geom: shapely.MultiLineString, admin_org: str}}.
    """
    groups: dict[str, list] = defaultdict(list)
    admin: dict[str, str] = {}
    for feat in fc.get("features", []):
        props = feat.get("properties", {})
        name = (props.get("Trail_Name") or "").strip()
        if not name:
            continue
        geom = shape(feat["geometry"]) if feat.get("geometry") else None
        if geom is None or geom.is_empty:
            continue
        groups[name].append(geom)
        admin.setdefault(name, (props.get("Admin_Org") or "").strip())
    merged: dict[str, dict] = {}
    for name, geoms in groups.items():
        if len(geoms) == 1:
            g = geoms[0]
        else:
            g = unary_union(geoms)
        merged[name] = {"geom": g, "admin_org": admin[name]}
    return merged


def build_state_index(fc: dict) -> list[tuple[Any, str]]:
    """Return [(prepared_geometry, state_name), ...] from layer 110."""
    # The state boundary layer may have fields like STATE_NAME; inspect at runtime.
    out = []
    for feat in fc.get("features", []):
        props = feat.get("properties", {})
        name = props.get("STATE_NAME") or props.get("NAME") or props.get("State") or ""
        if not name:
            continue
        geom = shape(feat["geometry"]) if feat.get("geometry") else None
        if geom is None or geom.is_empty:
            continue
        out.append((geom, name.strip()))
    return out


def resolve_states(geom, state_index) -> str:
    """Return alphabetically-sorted joined state names for any state polygons that intersect."""
    hits = sorted({name for poly, name in state_index if geom.intersects(poly)})
    return " / ".join(hits) if hits else ""


def geodesic_length_miles(geom) -> float:
    """Geodesic length of a (Multi)LineString in miles, rounded to 1 dp."""
    if geom is None or geom.is_empty:
        return 0.0
    total_m = 0.0
    lines = [geom] if geom.geom_type == "LineString" else list(geom.geoms)
    for line in lines:
        coords = list(line.coords)
        for (lng1, lat1), (lng2, lat2) in zip(coords, coords[1:]):
            _, _, d = _GEOD.inv(lng1, lat1, lng2, lat2)
            total_m += d
    return round(total_m / 1609.344, 1)


def main() -> int:
    logging.basicConfig(level=logging.INFO, format="%(message)s")

    _log.info("step 1/4: fetch layer 107 (scenic byways)")
    fc = fetch_layer_geojson(LAYER_URL)
    _log.info(f"  received {len(fc.get('features', []))} features")

    _log.info("step 2/4: fetch layer 110 (state boundaries)")
    states_fc = fetch_layer_geojson(STATE_LAYER_URL)
    state_index = build_state_index(states_fc)
    _log.info(f"  built state index with {len(state_index)} polygons")

    _log.info("step 3/4: merge multi-segment features by Trail_Name")
    merged = merge_segments_by_name(fc)
    _log.info(f"  merged into {len(merged)} distinct routes")

    if not (EXPECTED_MIN <= len(merged) <= EXPECTED_MAX):
        _log.error(
            f"route count {len(merged)} outside tolerance {EXPECTED_MIN}-{EXPECTED_MAX}"
        )
        _log.error("DOT may have updated the layer; update DECISIONS.md before widening.")
        return 2

    _log.info("step 4/4: derive CSV rows")
    rows = []
    missing_state = 0
    for name in sorted(merged.keys()):
        item = merged[name]
        geom = item["geom"]
        state = resolve_states(geom, state_index)
        if not state:
            missing_state += 1
        c = geom.centroid
        rows.append(
            {
                "RouteName": name,
                "State": state,
                "CentroidLat": f"{c.y:.6f}",
                "CentroidLng": f"{c.x:.6f}",
                "LengthMiles": geodesic_length_miles(geom),
                "AgencyTags": item["admin_org"],
            }
        )

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_PATH, "w", encoding="utf-8-sig", newline="") as f:
        writer = csv.DictWriter(
            f,
            fieldnames=["RouteName", "State", "CentroidLat", "CentroidLng",
                        "LengthMiles", "AgencyTags"],
            quoting=csv.QUOTE_MINIMAL,
        )
        writer.writeheader()
        writer.writerows(rows)

    # Summary
    tag_counts: Counter[str] = Counter()
    for r in rows:
        tags = {t.strip() for t in r["AgencyTags"].split(",") if t.strip()}
        for t in tags:
            tag_counts[t] += 1
    _log.info("")
    _log.info(f"wrote {len(rows)} rows to {OUTPUT_PATH}")
    _log.info(f"agency tag breakdown: {dict(tag_counts)}")
    lengths = [r["LengthMiles"] for r in rows if r["LengthMiles"]]
    if lengths:
        _log.info(f"length range: {min(lengths)} - {max(lengths)} miles")
    if missing_state:
        _log.warning(f"{missing_state} rows missing state resolution (left blank)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
```

**Pattern source:** ArcGIS REST API GeoJSON query + shapely polyline handling (`unary_union`, `centroid`) + pyproj geodesic length. Standard idiom for one-shot GIS data prep.

**Anti-pattern:** Do NOT fetch data at runtime inside `parse_fhwa_csv()` — that function is a pure parser and must remain so. Do NOT commit code to `scripts/curation/pipeline/` — this is a data-prep tool, not pipeline code. Do NOT hand-tune the deduplication logic to hit a specific row count target — if the 580-710 assertion fails, surface the count as a legitimate spec change needing user review, don't quietly adjust the filter.

--------------------------------------------------------------------------------
AGENT INSTRUCTIONS (TDD Flow)
--------------------------------------------------------------------------------

AGENT: python-implement (but this task is expected to be executed directly by the orchestrator since it's a one-shot data prep step with no downstream agents)

## EXECUTION

### Step 1: Write the script
  READ: `scripts/curation/pipeline/sources/fhwa.py` (for the CSV contract) and `scripts/curation/pipeline/models.py` (for the Route dataclass).
  WRITE: `scripts/curation/data_prep/__init__.py` (empty) and `scripts/curation/data_prep/fetch_fhwa.py` per the CODE PATTERN above.
  DEPEND: Ensure `httpx`, `shapely`, `pyproj` are in `requirements.txt` or pipeline module imports. Add `pyproj` if missing and note in commit message.

### Step 2: Dry-run the script
  DO: `python -m scripts.curation.data_prep.fetch_fhwa`
  CAPTURE: stdout — row count, agency tag breakdown, length range, any missing-state warnings.
  VERIFY: Script exits 0 and `data/fhwa_byways.csv` exists.

### Step 3: Verify schema and row count (AC-2)
  DO: Run the AC-2 VERIFY command.
  EXPECT: `schema PASS, N rows` with N in 580-710.

### Step 4: Verify parse_fhwa_csv() accepts it (AC-3)
  DO: Run the AC-3 VERIFY command.
  EXPECT: `parse_fhwa_csv PASS, N Route objects`.

### Step 5: Verify landmarks present (AC-4)
  DO: Run the AC-4 VERIFY command.
  EXPECT: `landmarks PASS`.

### Step 6: Commit both files
  DO: `git add scripts/curation/data_prep/ data/fhwa_byways.csv && git commit -m "Epic 2 BASE-000: fetch FHWA scenic byways from DOT ArcGIS"`
  VERIFY: `git log --oneline -1` shows the commit; `git ls-files` shows both paths.

### Step 7: Update DECISIONS.md
  DO: Append the actual row count to the 2026-04-13 entry under "Finding during verification". Commit that doc update separately with message `"Epic 2 BASE-000: record actual row count in DECISIONS.md"`.

## AFTER ALL ACs COMPLETE:
  Orchestrator confirms all 5 boolean statements TRUE and proceeds to dispatch BASE-001.

--------------------------------------------------------------------------------
ORCHESTRATOR VERIFICATION PROTOCOL
--------------------------------------------------------------------------------

AFTER AC-1 (script runs):
  RUN: `python -m scripts.curation.data_prep.fetch_fhwa && test -f data/fhwa_byways.csv && echo PASS`
  EXPECT: PASS
  IF FAIL (HTTP error): DOT may be rate-limiting or down. Retry after 60s. Do NOT increase request rate — this script makes exactly 2 HTTP calls.

AFTER AC-2 (schema + count):
  RUN: the AC-2 VERIFY command.
  EXPECT: `schema PASS, {580..710} rows`
  IF FAIL (count out of range): The DOT layer has changed. STOP and escalate. Do NOT widen the range without appending a new DECISIONS.md entry.

AFTER AC-3 (parser integration):
  RUN: the AC-3 VERIFY command.
  EXPECT: `parse_fhwa_csv PASS, ≥575 Route objects`
  IF FAIL: The CSV has rows `parse_fhwa_csv()` is silently dropping (missing state, unparseable lat/lng). Check the script's row writing for schema compliance.

AFTER AC-4 (landmarks):
  RUN: the AC-4 VERIFY command.
  EXPECT: `landmarks PASS`
  IF FAIL: Either the DOT layer no longer contains Blue Ridge Parkway (extremely unlikely) OR the merge-by-name step is dropping rows. Investigate.

AFTER AC-5 (commit):
  RUN: the AC-5 VERIFY command.
  EXPECT: both paths tracked.

--------------------------------------------------------------------------------
AGENT ASSIGNMENT
--------------------------------------------------------------------------------

**Implementation Agent:** python-implement (or orchestrator direct — this task is simple and one-shot, not benefiting from subagent dispatch overhead)
**Rationale:** Python data prep script; no pipeline modification. The orchestrator can execute this directly as part of narrow-execution strategy without the overhead of a dispatched subagent.

**Review Agent:** python-review
**Rationale:** Validates the script uses `httpx`/`shapely`/`pyproj` idiomatically, no hardcoded row counts, deterministic output, and the committed CSV matches what the script produces.

**Assignment Date:** 2026-04-13

--------------------------------------------------------------------------------
EVIDENCE GATES
--------------------------------------------------------------------------------

Gate 1: Script exits 0 and writes CSV
  Command: `python -m scripts.curation.data_prep.fetch_fhwa && test -f data/fhwa_byways.csv && echo PASS`
  Expected: PASS

Gate 2: Row count in tolerance
  Command: `python -c "import csv; n=len(list(csv.DictReader(open('data/fhwa_byways.csv',encoding='utf-8-sig')))); assert 580<=n<=710, f'count {n} out of 580-710'; print(f'PASS: {n} rows')"`
  Expected: `PASS: N rows` with N in 580-710

Gate 3: Schema matches parse_fhwa_csv contract
  Command: `python -c "import csv; h=next(csv.reader(open('data/fhwa_byways.csv',encoding='utf-8-sig'))); assert h==['RouteName','State','CentroidLat','CentroidLng','LengthMiles','AgencyTags'], h; print('PASS')"`
  Expected: PASS

Gate 4: parse_fhwa_csv accepts the output
  Command: `python -c "from scripts.curation.pipeline.sources.fhwa import parse_fhwa_csv; assert len(parse_fhwa_csv('data/fhwa_byways.csv'))>=575; print('PASS')"`
  Expected: PASS

Gate 5: Federal NSB landmarks present
  Command: `python -c "import csv; rows={r['RouteName']:r for r in csv.DictReader(open('data/fhwa_byways.csv',encoding='utf-8-sig'))}; assert 'NSB' in rows['Blue Ridge Parkway']['AgencyTags']; assert 'NSB' in rows['Beartooth Highway']['AgencyTags']; print('PASS')"`
  Expected: PASS

Gate 6: Both artifacts committed to git
  Command: `git ls-files --error-unmatch scripts/curation/data_prep/fetch_fhwa.py data/fhwa_byways.csv && echo PASS`
  Expected: PASS

Gate 7: Scope compliance (no pipeline modifications)
  Command: `git diff --name-only HEAD~1..HEAD -- scripts/curation/pipeline/`
  Expected: (empty — no pipeline code changes)

--------------------------------------------------------------------------------
REVIEW CRITERIA (for python-review)
--------------------------------------------------------------------------------

TDD Quality (INFRA/DATA_PREP adaptation):
- [ ] All 5 ACs verified via VERIFY commands
- [ ] Script is re-runnable and deterministic (re-run produces byte-identical CSV)
- [ ] Row count captured in DECISIONS.md post-run

Code Quality:
- [ ] Uses `httpx` or `requests` idiomatically for HTTP; no raw urllib
- [ ] Uses `shapely` `unary_union` + `centroid` for polyline merging, not manual coord math
- [ ] Uses `pyproj.Geod` for geodesic length, not Euclidean distance
- [ ] CSV written with `utf-8-sig` encoding and `csv.QUOTE_MINIMAL` quoting
- [ ] No hardcoded row counts; the 580-710 tolerance is a constant at the top of the script
- [ ] Logging uses module-level `logger`, not raw `print` except for the final stdout summary

Domain-Specific:
- [ ] `AgencyTags` preserved verbatim from `Admin_Org` (not stripped, not normalized beyond `.strip()`)
- [ ] Multi-state routes joined alphabetically (sorted set, `" / "` separator)
- [ ] All 645 routes included — no filtering of non-road edge cases
- [ ] The CSV matches `parse_fhwa_csv()`'s exact column contract

Security:
- [ ] No API keys or auth headers (DOT endpoint is public)
- [ ] No shell injection (all HTTP params via `httpx` `params=` dict, not string concat)

Review Verdict: [ ] APPROVED   [ ] NEEDS_FIXES

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends On:
- (none — BASE-000 has no prior task dependencies; it's the Epic 2 entry point)
- External: DOT ArcGIS endpoint at `geo.dot.gov` must be reachable

Blocks:
- BASE-001 (FHWA validation Boy Scout fix — needs `data/fhwa_byways.csv` as input)
- BASE-003, BASE-006 (indirectly, via BASE-001's `staging/fhwa.jsonl` output)
- BASE-008 (Curation Review Protocol step 1 — needs `source_counts.json[fhwa]`)

--------------------------------------------------------------------------------
TASK READINESS
--------------------------------------------------------------------------------

Prerequisites:
- [ ] Network access to `geo.dot.gov`
- [ ] `httpx`, `shapely`, `pyproj` available in the Python environment (add `pyproj` to requirements if missing)
- [ ] Repository working tree clean (single commit for both prep script + CSV)

Can Execute In Parallel With: (none — BASE-000 is the Wave 0 entry point)

--------------------------------------------------------------------------------
NOTES
--------------------------------------------------------------------------------

- This task was inserted into Epic 2 on **2026-04-13** after `/kb-run-epic` preflight revealed the original BASE-001 input file (`data/fhwa_byways.csv`) did not exist and no publicly-available FHWA CSV ships the expected schema. See `DECISIONS.md` for the full investigation.
- The 645-route count is the "DOT superset" reality, not the 184-route "America's Byways" federal program the predecessor PRD referenced. The decision (Option 1) is to accept this superset and update the curation-hardening PRD's 184 references accordingly — see the 2026-04-13 diff batch.
- Edge-case routes like `"Alaska's Marine Highway"` (ferry) and `"Alaska Railroad"` (railroad) are included in the CSV. They will likely produce `None` curvature scores in BASE-006 (OSM enrichment) and will be filtered out by Epic 6's quality floor.
- Runtime: ~5-10 seconds (two HTTP calls + shapely geometry processing on 648 features).
- Cost: $0 (DOT endpoint is public, no account or API key).
- The script is committed under `scripts/curation/data_prep/` rather than `scripts/curation/pipeline/` because it is a one-shot tool, not production pipeline code. Future data prep scripts (e.g., `fetch_rider_mag.py` in Epic 4) should live in the same directory.

--------------------------------------------------------------------------------
APPROVAL
--------------------------------------------------------------------------------

Approved By: [pending — @justin]
Date: [pending]

================================================================================
