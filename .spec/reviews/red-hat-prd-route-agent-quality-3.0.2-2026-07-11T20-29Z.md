# Red-Hat Review Report — Route & Agent Quality PRD v3.0.2

**Report Date**: 2026-07-11T20:29Z
**Target**: `.spec/prds/route-agent-quality/` v3.0.2 (26 UCs / 139 ACs / 89 criteria), reviewed against the live repo (commit `6de14bc0`-era tree) and the sprint goals (`.spec/FOUNDER-BAR.md` + the PRD's `/kb-sprint-plan` Next Steps)
**Reviewed By**: product-manager, convex-planner, mastra-planner, react-native-ui-planner (planning-agent cycle, per founder request)
**Companion action executed this cycle**: `.spec/prds/catalog-geometry-recovery/` refactored to SUPERSEDED (tombstone README + banners; drop directive marked replaced by reversible retirement)

## Executive Summary

The panel's consensus: the PRD is unusually well-instrumented (negative controls, fail-closed gate, couch human-gate, accurate code citations) **and it can still "complete" while the founder's Saturday fails** — because nothing gates on his real region having rideable routes after recovery, the recovery batch has no yield threshold, and three spec'd surfaces are fiction in code (share affordance, the Maestro detail-flow entry, the riderReady gate on the geospatial query modes the agent actually uses). Separately, the v3.0.2 pi-ai removal is **spec-consistent but plan-incomplete**: it is a 13-file atomic migration with a live unlisted consumer (`generateTripPlan`) and it **contradicts the ratified enrichment PRD**, which locked its tier to z.ai GLM-5.2 *via pi-ai*. All findings are spec-side fixes; none invalidate the architecture.

## HIGH Confidence Findings (3+ agents converge)

- [ ] **H1 — The spike gates (§5 geometry, §5b Mastra) are the plan's weakest link: prose-only, qualitative, and now coupled.** They are not rows in `11-e2e-testing-criteria.md` so `/kb-sprint-plan` cannot mechanically draw them (PM); §5b has no numeric pass/fail (cold-start < N ms, bundle < M MB), never exercises the memory adapter it exists to de-risk, and its "one visible trace" doesn't assert redaction or span completeness (mastra-planner); under v3.0.2 the §5 geometry spike now depends on Mastra-in-Convex — the exact unknown §5b proves — unless §5's anchor call is explicitly allowed a direct AI-SDK completion (convex-planner). | Severity: **Critical (blocks sprint 1 planning)**
      Agents: product-manager, mastra-planner, convex-planner
- [ ] **H2 — pi-ai removal is under-planned relative to the ratified decision.** 13 production files import `@mariozechner/pi-ai`; `convex/actions/agent/generateTripPlan.ts:4,239` is a **live public action** calling pi-ai `complete()` that no TR file mentions; `convex.json:12` lists pi-ai in externalPackages; Convex bundles atomically, so one missed import breaks every function. The spec prose is internally consistent (PM verified: every mention says "removed"), but risk #15's mitigation ("tier map returns strings") does not remove pi-ai — live consumers bypass the tier map. Post-removal, `enrichRoute` becomes a **nested Mastra generation inside a tool** whose cost the orchestrator-level budgetTracker won't see unless threaded (mastra-planner). | Severity: **Critical (deploy-blocking in sprint 1)**
      Agents: convex-planner, mastra-planner, product-manager (build-gate extension)
- [ ] **H3 — The stateless-singleton enforcement is weaker than its own proof-text.** `pendingSketches` (`convex/actions/agent/agents/routingAgent.ts:79-100`), cited by the TR as the warm-reuse precedent, is itself **sessionId-keyed per-request state in module scope** — the exact leak vector risk #17 fears — and it survives if `planRoute` is preserved as a tool. The grep-gate scoped to `rideAgent.ts` + 3 identifier names will not catch it (both agents independently). | Severity: High
      Agents: convex-planner, mastra-planner

## MEDIUM Confidence Findings (2 agents converge)

- [ ] **M1 — "PRD green over an empty Wasatch": no founder-region coverage gate.** All honest-absence ACs pass on honest emptiness; T-AGT-011's thin-region test is *seeded*; `09-team-contributions.md:59` records "near Ogden: 3 routes ≤30 mi, zero plottable" and no AC re-checks that number post-recovery. RN-planner adds the sequencing edge: flipping discovery to rider-ready-only *removes* today's centroid pills, so the surface regresses toward empty until the batch lands. (PM F1/#1; RN #8)
      Agents: product-manager, react-native-ui-planner
- [ ] **M2 — One MockLanguageModel seam now owes two fixture shapes.** The §5c loop fixture (`assistantTurns[].toolCalls`, stateful replay) does not describe a single-shot structured generation returning `result.object`; §2's "same pattern as §5c" is only literally true under the forced-tool-call form. Adjacent: in-flight `session_messages` persist **pi-ai-shaped `piMessage` payloads** (`shared/models/session-messages.ts:250-256`) that Mastra's AI-SDK-shaped history must migrate or tolerate — risk #16 frames adapter drift, not payload-shape migration. (mastra Q1/Q3; convex)
      Agents: mastra-planner, convex-planner
- [ ] **M3 — Structural-enforcement gaps the spec's own ruling implies.** "No highways" persistent constraints are assigned to *prompt application* while `planRoute.preferences.avoidHighways` is a real structured arg — a silently-droppable constraint, contradicting the ruling's own duration-translation precedent (mastra Q4). PM's fakeability audit lands the same shape from the other side: duration→distance has no pace anchor, so "3 h → 500 mi" passes T-AGT-017 as written.
      Agents: mastra-planner, product-manager

## LOW Confidence Findings (single agent — but note: most carry deterministic file:line evidence; "LOW" here means uncorroborated, not doubtful)

**Convex/pipeline (convex-planner, all code-verified):**
- [ ] **L1 — Enrichment-PRD contradiction (severity: Critical, cross-PRD).** `.spec/prds/enrichment/09-technical-requirements/06-external-dependencies.md:13,15` (CONSTITUTION, ratified 2026-07-10) **locks** the enrichment tier to z.ai GLM-5.2 via pi-ai forced-tool-call, custom baseUrl + `thinkingFormat:'zai'`. v3.0.2 says enrichment moves to Mastra ModelRouter strings — z.ai-with-custom-baseUrl is not a stock router provider. Two CONSTITUTION docs now disagree; founder must pick: carve enrichment out (pi-ai survives) or port GLM-5.2 to a custom AI-SDK OpenAI-compatible provider and re-ratify the enrichment PRD.
- [ ] **L2 — riderReady gating silently misses the geospatial modes (severity: Critical).** `04-api-design.md:71` ("all modes gated via `by_riderReady_and_composite_score`") is **false** for bbox/nearest: they run through `geospatial.query/nearest` (`convex/curatedRoutes.ts:195-253`) whose filterKeys are `{state, primaryArchetype}` only (`convex/geospatialIndex.ts:21-27`) — and `searchCuratedRoutes`, the agent's discovery tool, wraps **nearest**. Fix requires a `riderReady` geospatial filterKey + re-inserting ~5,654 points (not additive; absent from deploy ordering) or honest over-fetch + in-memory post-filter with a documented sparse-region failure mode.
- [ ] **L3 — `geometryStatus` union lives in 3 code sites** (`shared/models/curated-routes.ts:176`, `convex/curatedRoutes.ts:57`, `convex/curatedGeometry.ts:31` + `patchRouteGeometry:347` arg validator); adding `review`/`retired` must touch all three, and the new mutations need their own extended validators.
- [ ] **L4 — `favorite_roads` cannot satisfy `getUserFavorites`' output schema** (no rating/rideCount/lastRidden/lat/lng — `shared/models/favorite-roads.ts:24-56`; the code itself defers to a "richer schema" that never shipped, `enrichmentAgent.ts:131`). Needs a schema delta or a downgraded tool contract.
- [ ] **L5 — "Delete the tracing stub" is a 13-file refactor**: 13 tool files wrap exports in `traceableToolAsync/Sync`; deleting `lib/tracing.ts` breaks them all. Reframe as wrapper replacement.
- [ ] **L6 — `parseRouteEndpoints` is module-local inside a file marked Retired** (`convex/actions/curatedGeometry.ts:262`) — lever 3's "reuse" requires extraction first. Geocoding provider does radius bias, not the claimed `bounds` viewport bias (`geocodingProvider.ts:42-48`).

**Product/sprint-goals (product-manager):**
- [ ] **L7 — No yield acceptance gate on the batch**: UC-SURF-01 AC-5 "watch it rise" is an observation, not a gate; `coverageReport` has no threshold; UC-REC-04's "every route terminal" is maximized by dumping hard routes into REVIEW. 1,171 → 1,400 completes green.
- [ ] **L8 — Trust T2 ("flawless top-50") has no rank-targeted verification** — the couch sample is provenance-stratified, not rank- or region-stratified; a wrong-road top-10 survivor sails through.
- [ ] **L9 — Catalog target contradiction**: PRD projects 4,300–4,700 rider-ready; FOUNDER-BAR T1 says ≈2.5–3k honest roads. Different theories (rescue-first-keep vs gated-drop); reconcile in one place. Projection's ~83-93% conversion assumption cites no per-lever rates (PoC n=3; superseded doc's priors were 16%/40-55%).
- [ ] **L10 — REC↔VER cannot slice by group** (gate owned by VER, invoked by REC; couch sits between --sample and --all) — kb-sprint-plan must slice by phase, or gates can't close.

**RN surface (react-native-ui-planner, all code-verified):**
- [ ] **L11 — The share affordance is fiction (severity: High).** UC-AGT-06 AC-4 / T-AGT-022 / `10-routing.md:55` claim "existing save/share card affordances"; **no share code exists anywhere** (exhaustive grep), and planned routes have no deep link to share. Build a share leaf (curated deep link `laneshadow:///curated-route/{id}` is real) or descope AC-4 to save-only.
- [ ] **L12 — `.maestro/curated-route-detail.yaml` AC-1 taps a nonexistent testID** (`curated-chat-card-cherohala-skyway`) via a navigation that doesn't exist; T-SURF-016/017 must extend the deep-link or map-pin entries instead. Two stale in-code comments (`index.tsx:478-481,1568-1569`) still assert the dead path.
- [ ] **L13 — `0mi` fix-site mis-attributed**: the fabrication is at `app/(app)/(tabs)/index.tsx:350` (+ second `?? 0` at `:505`), not in chat-input/hook; `fellBackToBest` is computed but **not returned** (`use-curated-discovery.ts:83` vs `:198-202`) and its semantics differ from the spec'd fallback condition.
- [ ] **L14 — Unowned render surfaces**: weather go/no-go verdict and the clarifying-question turn have no stated render owner (prose-in-bubble vs phantom card); "home carousel" in UC-SURF-03 denotes a surface that currently renders planned options, not curated discovery; `CuratedRouteCard` renders `/100` while the extended gate asserts `%`.

**Mastra layer (mastra-planner, KB-verified against @mastra/core 1.x):**
- [ ] **L15 — The named structured-output primitive doesn't exist as written**: no bare `mastra.generate()`; the correct form is a **tool-less Agent per pipeline tier** with `agent.generate(prompt, {structuredOutput:{schema}})` → `result.object`. 06-external-dependencies names none of this and the extractor/classifier Agents are absent from the component table.
- [ ] **L16 — Prompt token budget ignores the 9-tool schema tax** (~900–2,000 tokens/turn serialized every turn → real fixed context ≈2× the stated ≤1,000).
- [ ] **L17 — Change control is model-blind**: a tier-map model-id repin passes the fixtured lane by construction (MockLanguageModel); require the real-API smoke lane as blocking evidence for model-id changes.
- [ ] **L18 — Memory double-load**: deterministic history load in `sendMessage` + `{memory:{thread,resource}}` on the agent both engaged; pick one (recommended: deterministic path, drop `@mastra/memory` → nearly eliminates risk #16).
- [ ] **L19 — Batch telemetry unbudgeted**: ~12k OTLP spans per overnight run if pipeline tiers share the observability-wired instance; scope Observability + memory OFF batch tiers (provenance-as-data is the audit trail).

## Agent Contradictions & Debates

| Topic | Position A | Position B | Assessment |
|---|---|---|---|
| Is v3.0.2's pi-ai removal "clean"? | PM: spec text fully consistent — every mention says removed | convex-planner: risk #15 mitigation **falsified** — live consumers bypass the tier map; enrichment PRD contradicts | Both right, different layers: the **prose** is consistent; the **migration plan** is incomplete and cross-PRD-conflicted. Fix = teardown inventory + enrichment reconciliation, not prose edits. |
| Can §5 (geometry spike) run first? | README Next Steps: two spikes "in the first sprints" (implicitly parallel) | convex-planner: v3.0.2 coupled §5 to §5b; mastra-planner: §5b is the weakest gate | Sequence §5b first **or** explicitly allow §5's anchor call a direct AI-SDK completion decoupled from Mastra. |
| Where does honesty live? | PM: honest-absence ACs are a strength (negative controls real) | PM (same report): honest emptiness is the cardinal fakeability | Not a contradiction — honesty mechanics are sound; the missing piece is a **coverage** gate so honesty never has to carry an empty region. |

## Recommendations by Category (the concrete-improvement synthesis, ranked)

1. **Gaps (sprint-blocking)** — Add to `06-external-dependencies.md` a **pi-ai teardown inventory** (all 13 importing files → delete/port, incl. `generateTripPlan`, `convex.json` externalPackages, `package.json`), and **reconcile the enrichment PRD** (carve-out vs port-GLM-5.2 — founder decision). Fix `04-api-design.md:71` + `03-data-schema.md` with the **geospatial riderReady filterKey re-index** (or honest post-filter). Name the real structured-output primitive + extractor Agents.
2. **Sprint goals (kills the Saturday-fails mode)** — Add a **founder-region coverage [human-gate]** (post-batch, real catalog, no seeding: ≥N rider-ready near SLC/Ogden, browse→tap→plot→save), a **realized-yield acceptance gate** on `coverageReport`, a **top-50-by-rank** verification AC, and **T-SPIKE-01/02 criteria rows** with numeric §5b pass/fail (cold-start, bundle, 2-turn memory, redaction assertion). Add one end-to-end **Saturday-arc Maestro flow**.
3. **Risks (register corrections)** — Widen #17's grep-gate to all preserved module-scope mutables (pendingSketches); reframe #20 as a 13-file wrapper replacement; extend #16 to payload-shape migration (`piMessage` rows); add cross-PRD-consistency and geospatial-re-index rows; resolve the memory double-load.
4. **Assumptions (make explicit or verify)** — Per-lever yield table + label 4,300–4,700 an assumption; reconcile vs FOUNDER-BAR's ≈2.5–3k; pin the duration-translation pace constant and default radius; classifier accuracy criterion vs a labeled set.
5. **Surface truth (RN)** — Correct the `0mi` fix-site, the dead Maestro AC-1 entry, `fellBackToBest` semantics; **decide the share affordance** (build the leaf on the curated deep link, or descope AC-4); state render owners for weather verdict + clarifying question; add the live-region + `%`-format notes.

## Agent Reports (Summary)

- **product-manager**: 10 ranked improvements; 8 fakeability findings; decomposition verdict (sliceable, 2 knots); Founder-Bar trace (Trust strong, top-50 thin, Feel/Proof out of scope — expectation to set)
- **convex-planner**: 19-row claim-verdict table (pipeline citations accurate to the line); 8 improvements; 6 sprint-1 blockers; 4 falsified/incomplete register rows
- **mastra-planner**: 6-question verdict table (all NEEDS-FIX, none WRONG); 9 improvements; 6-item pi-ai blast radius on its own prior design
- **react-native-ui-planner**: 19-row surface-verdict table; human-gate runnability per criteria row; 9 improvements; share-affordance fiction is the headline

## Metadata

- **Agents**: product-manager (Read/Write/Glob/Grep/Task/WebSearch), convex-planner (Read/Grep/Glob), mastra-planner (Read/Write/Bash/Grep + Mastra 1.x KB), react-native-ui-planner (Read/Write/Bash/Glob/Grep)
- **Confidence Framework**: HIGH (3+ agents), MEDIUM (2 agents), LOW (1 agent). Single-agent findings marked with file:line evidence are deterministic despite the LOW tier.
- **Report Generated**: 2026-07-11T20:29Z · **Duration**: ~39m (parallel)
- **Next Steps**: (1) founder decisions — enrichment carve-out vs port; share build vs descope; catalog-target reconciliation; (2) remediation pass folding accepted findings into the PRD via `/kb-prd-plan --update` (likely v3.1.0 — new gates are MINOR, not PATCH); (3) then `/kb-sprint-plan`.
