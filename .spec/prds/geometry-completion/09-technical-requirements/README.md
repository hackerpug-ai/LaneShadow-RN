# Technical Requirements

The implementation contract for Geometry Completion — the rescue-first geometry pipeline,
the deterministic verification gate, and the rider-ready read-path gate.

Each section is its own file for AI-agent traversability and parallel review. Downstream
skills should target the specific section they need rather than loading the full set.

## Section Index

| # | File | Topic | Stability |
|---|------|-------|-----------|
| 01 | [01-architecture-posture.md](./01-architecture-posture.md) | Deterministic-vs-probabilistic split (LLM at exactly two seams), runtime placement, trust boundaries, resumability, provenance-as-data, model indirection | CONSTITUTION |
| 02 | [02-system-components.md](./02-system-components.md) | New/modified components: hygiene, pure gate, three levers, classifier, review ops, gated read paths, driver scripts | CONSTITUTION |
| 03 | [03-data-schema.md](./03-data-schema.md) | `curated_routes` + `curated_route_geometry` deltas (status/provenance/riderReady/verification/quarantine), status-field review queue decision, indexes, deploy ordering | CONSTITUTION |
| 04 | [04-api-design.md](./04-api-design.md) | Every internal function + driver script with args→returns contracts; operator-only trust boundary; modified public reads | CONSTITUTION |
| 05 | [05-architecture-diagram.md](./05-architecture-diagram.md) | ASCII: driver scripts → Convex functions → external services → tables → gated read path → RN surfaces | CONSTITUTION |
| 06 | [06-external-dependencies.md](./06-external-dependencies.md) | Google Geocoding/Routes, LLM tiers (geometry + cross-provider classifier), @mapbox/polyline, Mapbox Static; superseded Nominatim/Overpass; cost envelope | CONSTITUTION |
| 07 | [07-ui-infrastructure.md](./07-ui-infrastructure.md) | Reuse-first UI: caption leaf + fallback label chip, copy drafts, accessibility, testIDs; corrected stale navigation claim | CONSTITUTION |
| 08 | [08-technical-risks.md](./08-technical-risks.md) | 10-row risk register (cost, hallucination-passing-gate, dirty claimed lengths, retirement false-negatives, gate calibration) | CONSTITUTION |
| 09 | [09-capability-chains.md](./09-capability-chains.md) | CAP-GEO-01 … CAP-GEO-06: reconstruction, promotion, gating, retirement, couch gate, reroute — with boundary contracts + proof | CONSTITUTION |
| 10 | [10-routing.md](./10-routing.md) | Routing & Views: zero new routes; states-only delta on Route Plan View (HOME) + Curated Route Detail; anti-proliferation check | CONSTITUTION |
| 11 | [11-e2e-testing.md](./11-e2e-testing.md) | Harness constitution: surface matrix (Reality Gate verified), determinism seam (fixture LLM signal + real-API smoke lane), turnkey runners, landmines, spike gate, flake policy, CI lanes | CONSTITUTION |

## Cross-References

- Scope: [`../01-scope.md`](../01-scope.md) · Roles: [`../02-roles.md`](../02-roles.md)
- Functional groups: [`../03-functional-groups.md`](../03-functional-groups.md) · UC files: `../04-uc-hyg.md` … `../07-uc-surf.md`
- Ratified strategy + PoC evidence: `.spec/proposals/geometry-completion/` (STRATEGY.md, poc/)
- Sibling PRD (sequenced after): [`../../enrichment/`](../../enrichment/README.md) · Superseded investigation: [`../../catalog-geometry-recovery/`](../../catalog-geometry-recovery/00-overview.md)

## Version History (this folder)

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-07-10 | Initial technical requirements (11 sections). |

## Parent PRD

This folder is the technical-requirements section of the Geometry Completion PRD. See the
parent [README.md](../README.md) for scope, roles, functional groups, and use cases.
