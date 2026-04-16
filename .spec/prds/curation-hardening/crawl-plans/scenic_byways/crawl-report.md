# Scenic Byways Crawl Report

**Date:** 2026-04-16
**Source:** America's Byways / FHWA Scenic Byways detail pages (Form B - structured API / normalized JSON snapshot)
**Task:** SRC-001 - Ingest Scenic Byways GIS + reconcile FHWA overlaps + preserve provenance contract
**Inventory snapshot:** `urls.jsonl` with 3 committed overlap records and explicit `fixture_file` bindings
**Phase 0 artifact:** `site-map.md`
**Fixture set:** `fixtures/scenic_byways/PT-01-feature-json/*.json`
**Execution audit:** `audit.json` and `staging/scenic_byways.jsonl.audit.json`

**Verdict:** PASS

## Counters

| Counter | Value |
|---|---|
| Inventory size | 3 |
| Fixture records loaded from inventory | 3 |
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

## Execution notes

- The executor consumes the committed `urls.jsonl` inventory and `selectors.yaml` selector map.
- Each inventory row resolves to a committed JSON fixture through `fixture_file`, keeping the run deterministic and resumable offline.
- Execution writes `staging/scenic_byways.jsonl`, `staging/scenic_byways.jsonl.progress`, and audit summaries at both `staging/scenic_byways.jsonl.audit.json` and `crawl-plans/scenic_byways/audit.json`.
