---
stability: CONSTITUTION
last_validated: 2026-07-10
prd_version: 1.0.0
---

# Technical Requirements — Route Enrichment

Section index for the enrichment technical constitution. Every file carries
`stability: CONSTITUTION` frontmatter.

## Section Index

| # | File | Topic | Stability |
|---|------|-------|-----------|
| 01 | [01-architecture-posture.md](./01-architecture-posture.md) | Batch pipeline stance, LLM tier (z.ai GLM-5.2), sequencing vs Trust wave | CONSTITUTION |
| 02 | [02-system-components.md](./02-system-components.md) | Components table (new vs modified) | CONSTITUTION |
| 03 | [03-data-schema.md](./03-data-schema.md) | `curated_route_enrichments` repurpose + route-doc status field + migration blast radius | CONSTITUTION |
| 04 | [04-api-design.md](./04-api-design.md) | Public query delta + internal functions + actions + driver CLI | CONSTITUTION |
| 05 | [05-architecture-diagram.md](./05-architecture-diagram.md) | ASCII flow | CONSTITUTION |
| 06 | [06-external-dependencies.md](./06-external-dependencies.md) | z.ai GLM-5.2, OpenAI QA tier, pi-ai; deferred POI/elevation/vision | CONSTITUTION |
| 07 | [07-ui-infrastructure.md](./07-ui-infrastructure.md) | EnrichmentSection, tokens, states, testIDs, a11y, length budgets | CONSTITUTION |
| 08 | [08-technical-risks.md](./08-technical-risks.md) | Risk register (hallucination, 429s, staleness, thin grounding…) | CONSTITUTION |
| 09 | [09-capability-chains.md](./09-capability-chains.md) | CAP-ENR-01…04 | CONSTITUTION |
| 10 | [10-routing.md](./10-routing.md) | Route/state delta: 1 CHANGED route, 0 new | CONSTITUTION |
| 11 | [11-e2e-testing.md](./11-e2e-testing.md) | Harness constitution: Maestro + live Convex + real-LLM sample; determinism seam | CONSTITUTION |

## Cross-references

- Scope: [../01-scope.md](../01-scope.md) · Roles: [../02-roles.md](../02-roles.md) ·
  Groups: [../03-functional-groups.md](../03-functional-groups.md) ·
  UCs: [../04-uc-gen.md](../04-uc-gen.md) [../05-uc-qual.md](../05-uc-qual.md)
  [../06-uc-why.md](../06-uc-why.md) [../07-uc-life.md](../07-uc-life.md)
- Direction: [`.spec/FOUNDER-BAR.md`](../../../FOUNDER-BAR.md) (R-leg) ·
  Sequencing dependency: [`.spec/prds/catalog-geometry-recovery/`](../../catalog-geometry-recovery/00-overview.md)
- Pattern precedent: `convex/curatedGeometry.ts` + `convex/actions/curatedGeometry.ts` +
  `convex/curatedGeometryQa.ts` + `scripts/backfill-curated-geometry.ts`

## Version History (this folder)

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-07-10 | Initial technical constitution |
