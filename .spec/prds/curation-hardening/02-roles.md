---
stability: PRODUCT_CONTEXT
last_validated: 2026-04-12
prd_version: 1.0.0
---

# Roles

| Role | Description |
|------|-------------|
| **Administrator** | Developer who runs the curation pipeline locally or via GitHub Actions. Executes ingestion, extraction, scoring, and push stages. Reviews data quality reports and calibration results. Makes go/no-go decisions on pushing pipeline output to Convex production. |
| **Pipeline** | The automated pipeline system executing ingestion, dedup, quality floor, extraction, scoring, classification, calibration, and reporting stages. Operates without human intervention between the administrator's trigger and the quality report output. |
| **System** | The Convex backend and op-sqlite local database that receive pipeline output. Serves routes to the mobile app via lean-projection sync and full-record-on-demand queries. |
