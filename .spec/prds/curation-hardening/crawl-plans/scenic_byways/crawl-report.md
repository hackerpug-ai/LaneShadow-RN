# Scenic Byways Crawl Report

**Date:** 2026-04-16
**Source:** America's Byways / FHWA Scenic Byways detail pages (Form B - normalized GIS fixture snapshot)
**Task:** SRC-001 - Ingest Scenic Byways GIS + reconcile FHWA overlaps + preserve provenance contract
**Inventory snapshot:** `urls.jsonl` with 3 committed overlap fixtures used for deterministic ingest coverage
**Fixture set:** `fixtures/scenic_byways/PT-01-feature-json/*.json`

**Verdict:** PASS

## Counters

| Counter | Value |
|---|---|
| Inventory size | 3 |
| Fixture records loaded | 3 |
| Required fields populated | 3 / 3 |
| FHWA overlaps reconciled | 3 / 3 |
| Staging rows written | 3 |

## Required-field yield

| Field | Required? | Yield |
|---|---|---|
| `name` | true | 3 / 3 |
| `state` | true | 3 / 3 |
| `designation` | true | 3 / 3 |
| `description` | true | 3 / 3 |
| `location` | true | 3 / 3 |
| `source_url` | true | 3 / 3 |
| `source_label` | true | 3 / 3 |

## Reconciliation notes

- Overlap matching is deterministic on normalized `name + state`.
- Overlap records reuse the existing FHWA `route_id` so Scenic Byways replaces the baseline instead of inserting a duplicate route.
- Scenic Byways keeps the higher-fidelity `location`, `designation`, `description`, and rider-facing `source_label`.
