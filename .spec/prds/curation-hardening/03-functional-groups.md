---
stability: FEATURE_SPEC
last_validated: 2026-04-12
prd_version: 1.0.0
---

# Functional Groups

## Groups

| Group | Prefix | Description |
|-------|--------|-------------|
| Source Diversification | SRC | Add government, editorial, and geometric data sources to reduce single-source dependency (currently 98.8% BestBikingRoads). Note: revised 2026-04-12 — BDR (UC-SRC-02), twtex (UC-SRC-03), and USFS MVUM (UC-SRC-05) dropped due to V3 lifestyle mismatch and invalidated PRD assumptions. |
| Quality Infrastructure | QUAL | Deduplication, quality floor filtering, coverage validation, and data quality reporting |
| Scoring & Calibration | SCORE | Scoring weight realignment, calibration gate enforcement, ground truth validation |
| Community Sources & NLP | RIDER | ADVRider RSS, Reddit API, forum NLP extraction pipeline for rider-generated route signals |

## Use Case Summary

| Group | Prefix | Use Cases | IDs |
|-------|--------|-----------|-----|
| Source Diversification | SRC | 3 | UC-SRC-01, UC-SRC-04, UC-SRC-06 (UC-SRC-02, UC-SRC-03, UC-SRC-05 dropped 2026-04-12) |
| Quality Infrastructure | QUAL | 4 | UC-QUAL-01 through UC-QUAL-04 |
| Scoring & Calibration | SCORE | 4 | UC-SCORE-01 through UC-SCORE-04 |
| Community Sources & NLP | RIDER | 5 | UC-RIDER-01 through UC-RIDER-05 |
| **Total** | | **16** | |
