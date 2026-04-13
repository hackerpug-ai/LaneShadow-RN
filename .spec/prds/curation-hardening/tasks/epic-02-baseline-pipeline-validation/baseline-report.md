# Epic 2 Baseline Validation Report

This document records the baseline validation results for the curation pipeline sources.

## FHWA (Federal Highway Administration National Scenic Byways)

**Status:** PASS (2026-04-13)

**Source Module:** `scripts/curation.pipeline.sources.fhwa`

**Input File:** `data/fhwa_byways.csv` (committed by BASE-000)

**Output File:** `staging/fhwa.jsonl`

**Route Count:** 645 routes (within expected range 580-710, ±10% of 645)

**Validation Results:**
- AC-1 (module runnable): PASS - `python -m scripts.curation.pipeline.sources.fhwa` exits 0
- AC-2 (count range): PASS - 645 routes is within 580-710 tolerance
- AC-3 (field completeness): PASS - all records have non-null name, state, centroid_lat, centroid_lng, route_id
- AC-4 (baseline report): PASS - this section documents the results

**Sample Record (first route):**
```json
{
  "route_id": "fhwa-a1a-ocean-shore-scenic-highway-florida",
  "name": "A1A Ocean Shore Scenic Highway",
  "state": "Florida",
  "source": "fhwa",
  "centroid_lat": 29.472546,
  "centroid_lng": -81.123682,
  "length_miles": 6.8,
  "bounds_ne_lat": null,
  "bounds_ne_lng": null,
  "bounds_sw_lat": null,
  "bounds_sw_lng": null
}
```

**Notes:**
- FHWA source validated as baseline ingestion stage
- Boy Scout `__main__` fix committed separately (see commit f3472b2)
- No data quality issues detected in parse_fhwa_csv() - all 645 CSV rows parsed successfully
- staging/fhwa.jsonl is runtime output, not committed to git

---

*Last updated: 2026-04-13*
