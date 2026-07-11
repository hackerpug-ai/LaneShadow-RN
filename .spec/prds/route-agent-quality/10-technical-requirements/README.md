# Technical Requirements

The implementation contract for Route & Agent Quality — the rescue-first geometry pipeline,
the deterministic verification gate, the rider-ready read-path gate, and the Mastra rebuild
of the conversation layer.

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
| 11 | [11-e2e-testing.md](./11-e2e-testing.md) | Harness constitution: surface matrix (Reality Gate verified), determinism seam (fixture LLM signal + real-API smoke lane), turnkey runners, landmines, spike gates (§5/§5b), agent eval lane (§5c: fixtures, graders, report), telemetry spans (§5d), flake policy, CI lanes | CONSTITUTION |
| 12 | [12-agent-prompting.md](./12-agent-prompting.md) | The versioned prompt artifact: `PROMPT_VERSION` change control (eval-gated), static policy vs dynamic context, token budget, section skeleton | CONSTITUTION |

## Cross-References

- Scope: [`../01-scope.md`](../01-scope.md) · Roles: [`../02-roles.md`](../02-roles.md)
- Functional groups: [`../03-functional-groups.md`](../03-functional-groups.md) · UC files: `../04-uc-hyg.md` … `../07-uc-surf.md`
- Ratified strategy + PoC evidence: `.spec/proposals/geometry-completion/` (STRATEGY.md, poc/)
- Sibling PRD (sequenced after): [`../../enrichment/`](../../enrichment/README.md) · Superseded investigation: [`../../catalog-geometry-recovery/`](../../catalog-geometry-recovery/00-overview.md)

## Version History (this folder)

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-07-10 | Initial technical requirements (11 sections) as "Geometry Completion". |
| 2.0.0 | 2026-07-10 | AGT deltas: agent-layer posture (Mastra smart loop, `orchestrator` tier), agent components + tool contracts (`searchCuratedRoutes` center-required, `geocodePlace`), no-new-tables memory note, Mastra/LangSmith dependencies, risks 11–14, CAP-AGT-01/02, chat-content states delta, Mastra spike gate (§5b) + agent eval lane (§5c). |
| 3.0.0 | 2026-07-11 | Persona pass: routing gains the v3 `grounded-results` content-shaping delta (weather verdicts, ≤3-option default, comfort labels, waypoint answers, share-close) + UC-AGT-06 coverage. Tool surface unchanged — duration/waypoint/library/weather behaviors ride the already-specced tools (`searchCuratedRoutes`, `searchAlongRoute`/`searchNearby`, `getUserFavorites`, `getRouteWeather`). |
| 3.0.1 | 2026-07-11 | Agent-shape deepening (mastra-planner): stateless module-singleton posture + tools-vs-prompting enforcement ruling (01); concrete agent components — `rideAgent.ts`, `prompts/orchestrator.v1.ts`, `mastraConvexStore.ts`, tracing-stub replacement (02); `session_messages`/`planning_sessions.agentMemory` field deltas (03); full 9-tool contract table with Zod schemas + error taxonomies (04); conversation-path diagram (05); ModelRouter-string correction — Mastra cannot consume pi-ai `Model` objects (06); risks 15–20 + eval-seam/tier coupling note (08); eval lane deepened — fixture format, `MockLanguageModel` seam, grader taxonomy, report schema, prompt-edit CI gate — + §5d telemetry spans (11); NEW 12-agent-prompting.md. |
| 3.0.2 | 2026-07-11 | **pi-ai fully removed (founder-ratified):** every LLM tier — `orchestrator`, `geometry`, `low` classifier, enrichment — resolves through the Mastra model layer as ModelRouter strings; the `@mariozechner/pi-ai` dependency is dropped from `package.json`; pipeline extractions become single-shot Mastra generations with Zod structured outputs (`emit_anchors`/`emit_verdict`); fixture seam + router-pin landmine + risk 11/15 mitigations updated (01/02/05/06/08/11). One model layer, one fixture seam. |
| 3.1.0 | 2026-07-11 | **Red-hat remediation (4-agent cycle).** 06: pi-ai 13-file teardown inventory (`generateTripPlan` unlisted live consumer) + enrichment GLM-5.2 ported to a custom AI-SDK provider (D1) + batch tiers run without Observability/memory. 08: risks 15/16/17/20 corrected + new #21 (GLM port) / #22 (geospatial gating). 01: memory double-load resolved (`@mastra/memory` dropped) + constraint-application made structural. 02: structured-output primitive named (tool-less `getGeometryExtractor`/`getRideClassifier`) + mastraConvexStore repurposed + tracing 13-file + `parseRouteEndpoints` extraction. 03: geospatial `riderReady` re-index (non-additive) + `geometryStatus` 3-sites + `favorite_roads` gap. 04: "all modes gated" corrected (bbox/nearest miss the index) + favorites schema note. 07: `0mi` fix-site (`index.tsx:350`), `fellBackToBest` not-returned, dead Maestro AC-1, share descoped. 10-routing: save-close + render surfaces pinned. 11: §5b numeric pass/fail + §5 decoupled. 12: tool-schema token tax + model-id smoke gate. |

## Parent PRD

This folder is the technical-requirements section of the Geometry Completion PRD. See the
parent [README.md](../README.md) for scope, roles, functional groups, and use cases.
