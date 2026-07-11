---
stability: CONSTITUTION
last_validated: 2026-07-10
prd_version: 1.0.0
---

# Technical Risks

| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| 1 | Google Geocoding/Routes cost + rate limits at batch scale (~4k routes × ≤2 attempts × (N geocodes + 1 route)) | Med | Med (~$150 + throttling) | Serial driver (one bounded batch per `npx convex run`); `--sample` + couch gate before `--all`; per-route cost cap ~$0.07 asserted; field-masked Routes calls; cursor resume tolerates a mid-run 429. |
| 2 | LLM anchor hallucination that *passes* the length gate (wrong roads, right total length) | Med | High (plausible-but-wrong geometry looks authoritative) | Region check (every anchor ≤150 mi of centroid) + repair round; cross-provider classifier as an independent signal; couch-sample gate is the human backstop — one `wrong` verdict forces red; anchors persisted for audit; provenance caption keeps the rider informed. |
| 3 | Claimed `lengthMiles` itself wrong — the gate calibrated against dirty truth (64 zero-length, 41 >1,000 mi, max 710k) | High (known) | High (PASS/REVIEW meaningless on those rows) | HYG runs FIRST: zero/outlier lengths nulled/quarantined; for nulled-length rows the routed length becomes truth and the ratio check yields to degenerate + region checks; outliers go to review, never auto-PASS. |
| 4 | Convex action wall-clock timeout on long batches | Low (pattern-solved) | Med | Driver loops short bounded action calls (existing `backfill-curated-geometry.ts` precedent); cursor persists progress. |
| 5 | Classifier false-negative retires a good ride | Med | High (catalog loss) | Rescue-first ordering (retire only after all levers fail); `marginal` never auto-retires; reversible `retiredAt` + mandatory founder confirmation; `retirementReason` recorded for undo. |
| 6 | Schema/index deploy ordering on the 5,757-row table | Low | Low→Med | Additive-optional fields are data-safe; push schema + indexes before first `riderReady` write; composite index backfilled by the recompute sweep. |
| 7 | Concurrent backfills clobbering each other | Low (serial today) | Med | Serial by construction; `persistGeometryVerified` is one atomic mutation; if parallelism is ever added, a `claimedAt` lease is the flagged design — not built in v1. |
| 8 | Google Geocoding returns the wrong same-name place | Med | Med | Region-bias bounds + nearest-to-centroid selection + 150 mi region check; ratio gate catches survivors. |
| 9 | Dedup picks the wrong canonical row | Low | Med | Canonical = best geometry ∧ highest score; `dryRun` plan reviewed by founder before commit; `duplicateOf` reversible; shadows retained, never deleted. |
| 10 | Gate too strict/lenient at the margins (systematic `off` verdicts in couch sample) | Med | Med | The couch sample doubles as gate calibration: repeated `off` verdicts adjust the ratio band before `--all`; band is a single constant in the pure gate module. |
