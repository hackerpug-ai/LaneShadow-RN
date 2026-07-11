---
title: Geometry Completion — Every Suggested Road Is a Real Road
version: 1.0.0
scope_posture: full
pr_sequencing: false
---

# Geometry Completion — PRD

Rescue-first geometry recovery over the full 5,757-route curated catalog (promote ignored
scraped polylines · AI-reconstruct from turn-by-turn descriptions · re-route from endpoints),
one deterministic verification gate with a bounded LLM repair round, an LLM ride-worthiness
classifier, and a hard rider-ready gate on every suggestion surface with honest absence.
Delivers FOUNDER-BAR Trust T1 + T2. Ships **before** the enrichment R-leg.

> **Grounding:** built from the founder-ratified strategy + real-service PoC of 2026-07-10
> (`.spec/proposals/geometry-completion/` — full prod-export audit, reconstruction PASS at
> ratio 1.00 on two real routes, fail-closed hold on a third). Authored by a planner team
> (product-manager lead, convex-planner, frontend-designer) against the live repo.
> Supersedes/extends `.spec/prds/catalog-geometry-recovery/`.

## PRD Metadata

| Field | Value |
|-------|-------|
| Version | 1.0.0 |
| Scope Posture | Full feature (default) |
| PR Sequencing | Disabled |
| Created | 2026-07-10 |
| Last Updated | 2026-07-10 |
| Predecessors | `.spec/prds/catalog-geometry-recovery/` (superseded), `.spec/prds/curation-hardening/` (score/dedup context) |
| Sequenced before | `.spec/prds/enrichment/` (R-leg generates only over plottable routes) |

## Document Index

| File | Section | Stability |
|------|---------|-----------|
| [00-overview.md](./00-overview.md) | Product description, problem statement, solution summary, FOUNDER-BAR anchoring | PRODUCT_CONTEXT |
| [01-scope.md](./01-scope.md) | In scope / out of scope | FEATURE_SPEC |
| [02-roles.md](./02-roles.md) | Rider, Founder-Operator, System | PRODUCT_CONTEXT |
| [03-functional-groups.md](./03-functional-groups.md) | Group overview + UC summary | FEATURE_SPEC |
| [04-uc-hyg.md](./04-uc-hyg.md) | UC-HYG-01 … UC-HYG-04 (Catalog Hygiene) | FEATURE_SPEC |
| [05-uc-rec.md](./05-uc-rec.md) | UC-REC-01 … UC-REC-05 (Geometry Recovery) | FEATURE_SPEC |
| [06-uc-ver.md](./06-uc-ver.md) | UC-VER-01 … UC-VER-05 (Verification & Review) | FEATURE_SPEC |
| [07-uc-surf.md](./07-uc-surf.md) | UC-SURF-01 … UC-SURF-06 (Rider-Ready Surface) | FEATURE_SPEC |
| [08-team-contributions.md](./08-team-contributions.md) | Phase contributions | - |
| [09-technical-requirements/](./09-technical-requirements/README.md) | Technical specifications — folder; see its README Section Index (incl. 10-routing.md: route map + Route Delta; 11-e2e-testing.md: harness constitution) | CONSTITUTION |
| [10-e2e-testing-criteria.md](./10-e2e-testing-criteria.md) | Per-UC test criteria with type tags, AC refs, setup, pass/fail — sprint gates draw [human-gate] criteria from here | TEST_SPEC |

## Quick Stats

| Metric | Value |
|--------|-------|
| Functional Groups | 4 (HYG, REC, VER, SURF) |
| Use Cases | 20 |
| Acceptance Criteria | 106 |
| Test Criteria | 67 (49 integration, 10 e2e, 5 human-gate, 5 api-contract, 1 build-gate; 3 dual-typed) |
| System Components | 18 (5 new modules, 6 modified, driver scripts, 1 retired) |
| Data Entities | 2 modified tables (curated_routes, curated_route_geometry) + 2 new indexes |
| Capability Chains | 6 (CAP-GEO-01 … 06) |
| External Dependencies | Google Geocoding, Google Routes, LLM geometry tier + cross-provider classifier, @mapbox/polyline, Mapbox Static |
| Routes / States | 0 new routes / 4 new states across 2 existing views |
| Catalog projection | rider-ready 1,171 → ~4,300–4,700 at PoC pass rates; ≈$150 total API spend |

## Version History

| Version | Date | Changes | Trigger |
|---------|------|---------|---------|
| 1.0.0 | 2026-07-10 | Initial PRD | Ratified geometry-completion strategy (post-audit brainstorm + real-service PoC) |

## Next Steps

- `/kb-sprint-plan` — build the implementation roadmap. **Every sprint's human testing gate
  draws [human-gate] criteria from [`10-e2e-testing-criteria.md`](./10-e2e-testing-criteria.md).**
  The spike gate (TR 11-e2e-testing §5: one reconstructed route green end-to-end through the
  turnkey runners) belongs in the first sprint.
- `/kb-sprint-tasks-plan` — expand sprints into task files.
- Out-of-band review: `/review-red-hat` on this folder, then `/kb-prd-plan --update` to fold
  in findings.
