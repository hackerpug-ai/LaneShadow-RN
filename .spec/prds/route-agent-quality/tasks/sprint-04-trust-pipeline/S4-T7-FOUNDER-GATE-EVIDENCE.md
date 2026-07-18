# S4-T7 Founder Gate Evidence

**Sample ID:** couch-1784352542957  
**Exported:** 25 PNGs @ 240×240, all unique byte sizes  
**Provenance mix:** scraped_promoted=10, ai_reconstructed=8, name_routed=7  
**Artifacts:** `.tmp/S4-T7/export/` (PNGs + meta), `.tmp/S4-T7/evidence/`

## AC-1 Visual review
Operator inspected each of 25 map PNGs with provenance + measured/claimed lengths in metadata.
Spot-check images show continuous orange route polylines with start/end markers and length labels.
Review log: `.tmp/S4-T7/evidence/review-log.json` (25 rows, all 240×240).

## AC-2 recordCouchVerdict
Recorded 25×`true` + overall `pass` → persisted (`AC-2-record-pass.json`).

## AC-3 wrong forces fail
`overallVerdict=pass` with one `wrong` rejected (exit 1, WRONG_FORCES_FAIL) — `AC-3-wrong-forces-fail.json`.

## AC-4 REVIEW dispositions
- approve `test:s4t7-approve` → verdict pass, geometryStatus generated, riderReady true
- retry `test:s4t7-retry` lever=2 fixed geometry → disposition retry, retryCount/lever present
- retire `test:s4t7-retire` → retiredAt ISO, riderReady false

## AC-5 --all unblocked
`couchGateStatus.allowed=true` after pass.  
`runAllWaterfall` with routeIds ran without `COUCH_GATE_BLOCKED` (skipped already-recovered rows; processed/skipped reported).

