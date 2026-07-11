# Red-Hat Re-Review Report — Route & Agent Quality PRD v3.1.0

**Report Date**: 2026-07-11T22:19Z
**Target**: `.spec/prds/route-agent-quality/` v3.1.0 (26 UCs / 142 ACs / 94 criteria)
**Framing**: Post-remediation execution-strength re-review — *"what's still missing that would make execution stronger?"* NOT a re-litigation of the v3.0.2 cycle (`.spec/reviews/red-hat-prd-route-agent-quality-3.0.2-2026-07-11T20-29Z.md`), whose H1–H3/M1–M3/L1–L19 were largely folded into v3.1.0.
**Reviewed By**: product-manager, convex-planner, mastra-planner, react-native-ui-planner, **aisdk-planner** (new this cycle — the v3.1.0 custom GLM-5.2 AI-SDK provider is the fresh technical unknown)
**Orchestrator independent verification**: README, 00/01/03, 06-uc-ver, 08-uc-agt, 09, 11-criteria, TR README + 04-api-design + 07-ui-infrastructure + 08-risks read directly; code claims cross-checked (`package.json`, `convex/actions/agent/tools/discoverCuratedRoutes.ts`, `hooks/use-curated-discovery.ts`, `convex/actions/weather.ts`); the one agent contradiction resolved against `brain/docs/mastra/fact-graph.json` + `brain/docs/ai-sdk/fact-graph.json`.

---

## Executive Summary

The PRD is **unusually strong and the v3.0.2 remediation held** — the panel confirmed ~25 prior findings genuinely resolved (memory double-load, structured-output primitive naming, geospatial gating acknowledgment, pi-ai teardown inventory, §5b numeric gate, surface fix-sites, share descope, etc.). The remaining execution-strength gaps are a **tight set, not a broad quality problem**.

**Two things this cycle corrected that matter more than the new findings:**

1. **The panel over-claimed ~8 "CRITICALs" that are actually correctly-scoped pre-implementation work.** The convex and RN agents repeatedly flagged "code doesn't have X" as a spec defect — but `07-ui-infrastructure.md` *already scopes that work explicitly* (it states verbatim that `fellBackToBest` is computed-but-not-returned and must be fixed; it names `curated-detail-provenance`, `discovery-suggestion-empty`, etc. as new testIDs to build; it scopes the fallback chip and the `accessibilityLiveRegion` work). Likewise the centroid-fallback removal (`02-system-components.md:22`) and the driver scripts (`04-api-design.md:76-82`) are scoped in the spec. **Code not having these yet is the definition of pre-implementation, not a spec gap.** These are listed in §"Verified RESOLVED / not-a-gap" below so nobody chases them.

2. **One agent's headline CRITICAL was factually wrong, caught by independent KB verification.** aisdk-planner asserted the structured-output primitive `agent.generate({structuredOutput:{schema}}) → result.object` is "wrong" and v7 wants `generateText({output:Output.object}) → result.output`. The brain Mastra KB (`fact-graph.json:62,92,120`, `ROSETTA.md:38`, probe MA-06) confirms the spec is **correct at the @mastra/core 1.x Agent layer**; the aisdk-planner conflated the raw-AI-SDK layer (correct *for `generateText`*) with the Mastra Agent layer that wraps it. Relaying that uncritically would have sent implementation to break a correct API.

**The real execution-strength gaps that survive honest filtering** (most-severe first): the **custom z.ai provider's structured-output/tool-calling contract is unverified** and the §5b spike doesn't exercise it (only the Anthropic orchestrator tier); the **eval-gold transcript payload migration** (the founder's real SLC/Ogden session is stored in pi-ai `piMessage` shape, the new agent expects AI-SDK shape — no migration specced); **§5b spike ceilings are undefined** (a numeric gate with no target values); the **batch lacks rate-limit/backoff + a hard cost circuit-breaker**; and a short tail of spec-completeness items (geospatial re-index deploy gate, Mastra-memory internal contradiction, eval-grader determinism, streaming transport, prompt-change-control teeth, hygiene dry-run coverage, cross-PRD enrichment re-rat as a sequenced prerequisite).

**Verdict**: executable after a focused MINOR-spec pass (call it v3.1.1) — **none of the survivors is architecture-invalidating; most are 1–3 line spec additions pinning a contract, a threshold, or a migration**. Full sprint planning should not proceed until the z.ai-provider verification, the eval-gold migration, and the §5b ceiling values are pinned, because all three sit under the first sprint's spike gates.

---

## Orchestrator correction log (findings I downgraded or killed after independent verification)

These were reported as gaps by subagents and are **NOT spec gaps**. Listed so they aren't re-litigated and so the pattern (subagents over-claiming pre-impl work as defects) is visible.

| Claimed gap (agent) | Verdict | Evidence |
|---|---|---|
| `fellBackToBest` not returned → "CRITICAL, T-SURF-012 un-runnable" (RN) | **Spec scopes the fix.** Pre-impl work, correctly described. | `07-ui-infrastructure.md:43-48`: *"the flag is computed at `:83` but is **not in the return object** (`:198-202`), and its current meaning … is NOT 'zero rider-ready nearby → national' — both the exposure and the semantics must be fixed."* Verified in code: computed at `hooks/use-curated-discovery.ts:83`, absent from return at `:198-202`. |
| `curated-detail-provenance` testID missing → "CRITICAL" (RN) | **Spec scopes the build.** New leaf named. | `07:35-42` (caption leaf + `getCuratedRouteDetail` projection dependency) + `07:72` (testID). |
| Fallback-to-national label chip component missing → "CRITICAL" (RN) | **Spec scopes the build + copy.** | `07:43-52` + copy at `07:59`. |
| Absence testIDs / `accessibilityLiveRegion` missing (RN) | **Spec scopes both as additive work.** | `07:66-75`. |
| Saturday-arc Maestro flow missing → "CRITICAL, T-REC-018 un-runnable" (RN) | **Not a gap.** T-REC-018 is `[human-gate]` (founder-run on real device); Maestro flows are bound JIT only for `[e2e-automated]` rows. | `11-e2e-testing-criteria.md:84` type tag `[human-gate]`; `11:271` "kb-run-sprint binds [e2e-automated] rows to Maestro flows JIT." |
| Weather/clarifying-question render "unowned" → HIGH (RN) | **Mostly resolved.** Render owner stated. Residual: no testID, but prose assertions don't require one. | `10-routing.md:54-55`: "render as prose in the existing session_messages text bubble." |
| Centroid fallback "still in code = spec-code mismatch" → HIGH (convex) | **Spec scopes the removal.** Pre-impl. | `02-system-components.md:22` "Remove the centroid fallback (`:183-186`)". Verified present in `discoverCuratedRoutes.ts:183-186` + `encodeCentroidToPolyline:294` + `buildCuratedMapGeometry` centroid branch `:396-409` — i.e. the exact scoped work. |
| Driver scripts "don't exist" → CRITICAL (convex) | **Spec specs them.** Pre-impl. (Residual real gap = their rate-limit/budget engineering — kept as E5 below.) | `04-api-design.md:76-82` (CLI flags + `--all` refusal while couch gate ≠ pass). |
| **Wrong structured-output primitive** → CRITICAL (aisdk) | **FALSE.** Spec is correct at the Mastra layer. | `brain/docs/mastra/fact-graph.json:62,92,120`, `ROSETTA.md:38`, probe MA-06: `{structuredOutput:{schema}}` → `result.object` IS the @mastra/core 1.x form. aisdk-planner cited the raw-AI-SDK `generateText({output})` form (`brain/docs/ai-sdk/fact-graph.json:77,110`) — correct for `generateText`, wrong layer for `Agent.generate`. |
| Weather "no forecast capability" → HIGH (PM) | **Narrowed.** Endpoint supports forecast; handler fetches current-only; spec scopes "real forecast data." | `convex/actions/weather.ts:9` endpoint is `api.open-meteo.com/v1/forecast` (supports `daily=`/`hourly=`); handler requests only `current=` (`:79`). Spec: `01-scope.md:112`, `08-uc-agt.md:103`, `01-architecture-posture.md:175`. Real gap = extend the handler (E11, MED-LOW), not "no capability." |

---

## HIGH Confidence Findings

> Confidence framework: **HIGH** = 3+ agents converge · **MEDIUM** = 2 agents · **LOW** = 1 agent (deterministic file:line evidence noted where present).

None this cycle. (The candidate — the multi-provider/z.ai concern — converges across **two** agents, mastra-planner + aisdk-planner, so it is MEDIUM confidence by the framework despite HIGH severity. It is the severity-leading finding; see M1.)

---

## MEDIUM Confidence Findings (2 agents converge)

### M1 — The custom z.ai GLM-5.2 provider is the largest unverified integration, and the §5b spike doesn't reach it | Severity: **High** | Confidence: MEDIUM (mastra-planner + aisdk-planner)
- **GAP**: v3.1.0 collapsed every LLM tier onto "one model layer" of Mastra `ModelRouter` strings — but the tiers now span **three providers**: Anthropic (orchestrator + geometry), z.ai GLM-5.2 via a **custom** `createOpenAICompatible` provider with custom `baseURL`/`apiKey`/`thinkingFormat:'zai'` (enrichment), and a distinct low-tier provider (classifier). ModelRouter strings assume stock providers. Two things are unverified: (a) does the custom z.ai provider round-trip through the Mastra model layer at all; (b) does `agent.generate({structuredOutput})` / tool-calling actually work through z.ai's `thinkingFormat:'zai'` reasoning wrapper (reasoning models routinely emit non-JSON tokens that break structured-output parsing). The §5b spike (T-AGT-023) exercises only the **orchestrator (Anthropic)** tier — the z.ai path is never spike-gated. The fixture lane (MockLanguageModel) replays canned Anthropic-shaped turns, so it cannot reproduce a z.ai contract failure either.
- **EVIDENCE**: `10-technical-requirements/06-external-dependencies.md:112-120` (custom provider); risk #21 `08-technical-risks.md:31`; §5b scope `11-e2e-testing-criteria.md:206` (orchestrator tier only); `11-e2e-testing.md:103-107` (MockLanguageModel = Anthropic shape). Verified primitive correctness: `brain/docs/mastra/fact-graph.json:62,92`.
- **WHY IT BITES EXECUTION**: Enrichment + geometry extraction + classification all assume structured output cleanly returns typed data through this provider. A silent degradation (call "succeeds", returns empty/malformed object) corrupts enrichment labels, geometry anchors, and ride-worthiness verdicts — and only surfaces at the couch sample, too late. The whole "one model layer, one fixture seam" claim is untested for the one provider that isn't stock.
- **FIX**: Extend a spike gate (§5b or a new §5c) to require **one real z.ai GLM-5.2 completion through the custom provider that returns a non-empty parsed `result.object`** (an `emit_anchors`- or `emit_verdict`-shaped schema) before any pipeline-tier task is authored. Add to `06-external-dependencies.md` the explicit failure-handling path ("if `thinkingFormat:'zai'` breaks structured output → text-mode JSON parse with typed error, or fallback tier"). Gate the enrichment-PRD re-ratification (see M4) on the same proof.

### M2 — §5b spike gate has numeric pass/fail… but no numeric *target values* | Severity: **High** | Confidence: MEDIUM (product-manager + mastra-planner)
- **GAP**: v3.1.0 promoted the Mastra-in-Convex spike to a numeric gate ("cold-start under the recorded ceiling and bundle delta under the agreed MB ceiling — numbers recorded, not vibes") — but the **ceiling values themselves are nowhere pinned**. What cold-start (ms) fails the gate? What bundle delta (MB)? The spec says the numbers will be "recorded"/"agreed" but never says what they are or who agrees them. A numeric gate with an undefined threshold is still a vibes gate.
- **EVIDENCE**: `11-e2e-testing-criteria.md:206`; `11-e2e-testing.md:90-91`. Grep for `ceiling|MB` across the spec returns only the criterion row, no value.
- **WHY IT BITES EXECUTION**: The spike is the hard gate before the entire AGT deep build. Without pinned ceilings, any observed number can be claimed "under ceiling" — the gate can't block, so risk #11/#18 (Mastra bundle/cold-start in Convex) is not actually de-risked. Related (mastra-planner, same finding): the spike must run on a **staged cloud Convex deployment** (cold-start is real there), not `npx convex dev` (warm local sandbox) — T-AGT-023 says "real dev deployment" which *may* mean cloud-dev, but it's ambiguous.
- **FIX**: In `11-e2e-testing.md` §5b, pin two numbers and a measurement method before the spike runs — e.g. "cold-start ≤ X ms measured as first-token latency on first invocation after `convex deploy` to the dev cloud deployment (not `convex dev`); bundle delta ≤ Y MB measured from `convex/_deployment/` artifacts." Record the measured baseline + the agreed ceiling in the gate evidence.

### M3 — No batch cost circuit-breaker | Severity: **Medium-High** | Confidence: MEDIUM (product-manager + convex-planner)
- **GAP**: The spec has per-unit cost telemetry (T-REC-012 "running call/cost counters"; ~$0.07/reconstruct, ~$0.02/reroute, ~$0.002/classifier) and a ~$150 envelope, but **no hard total ceiling that aborts a runaway batch**. With repair rounds (≤2), classifier over all 5,757, and cross-provider calls, a prompt bug or a stuck retry loop can spend multiples of $150 before a human notices.
- **EVIDENCE**: `11-e2e-testing-criteria.md:82-83` (telemetry only); `06-external-dependencies.md:124-127` (envelope, no abort); `04-api-design.md:54-56` (backfill report has per-route cost, no `--max-cost`).
- **WHY IT BITES EXECUTION**: Cost observability ≠ cost governance. The rescue batch is an overnight, operator-unattended run (by design — resumable). A silent cost blow-up lands on the founder's bill before the realized-yield gate (T-REC-017) fires.
- **FIX**: Add to `04-api-design.md` driver contracts: a `--max-cost=N` flag (default ≤ ~1.5× projected) that halts with `continueCursor` preserved; backfill report returns `totalCostUSD`. One AC/criterion asserting the breaker trips on a seeded overrun.

### M4 — Cross-PRD enrichment re-ratification is a real sequenced prerequisite, only loosely referenced | Severity: **Medium** | Confidence: MEDIUM (aisdk-planner + product-manager verified)
- **GAP**: v3.1.0 decision D1 removes pi-ai entirely and ports enrichment's z.ai GLM-5.2 to a custom AI-SDK provider. The enrichment PRD (a ratified CONSTITUTION) still locks z.ai to pi-ai. The enrichment PRD *does* flag "⚠ PENDING RE-RATIFICATION" — so it's known, not silent — but **this PRD does not list that re-ratification as a prerequisite in its own Next Steps**, and the two CONSTITUTION docs currently disagree on the dependency graph. You cannot implement both PRDs as written.
- **EVIDENCE**: `06-external-dependencies.md:112-120` (conflict acknowledged); `.spec/prds/enrichment/09-technical-dependencies/06-external-dependencies.md:9-17` ("PENDING RE-RATIFICATION … before enrichment's sprints").
- **WHY IT BITES EXECUTION**: If route-agent-quality ships its atomic pi-ai teardown first, enrichment sprints block on a stale CONSTITUTION. If enrichment ships first, route-agent-quality's 13-file teardown breaks it. The ordering must be decided and recorded in *this* PRD, not just the enrichment one.
- **FIX**: Add a **Prerequisites** line to `README.md` Next Steps: "PREREQUISITE — enrichment PRD `06-external-dependencies.md` re-ratification (D1 z.ai-via-custom-AI-SDK-provider) must land before either PRD's sprints." Optionally gate M1's z.ai spike as the evidence that unblocks the re-ratification.

---

## LOW Confidence Findings (single agent — but most carry deterministic file:line evidence; "LOW" = uncorroborated, not doubtful)

### L1 — `session_messages` eval-gold transcript payload migration is unspecified | Severity: **High** | Confidence: LOW (convex-planner, sharp) · cross-noted by mastra-planner (fixture replay shape)
- **GAP**: The regression eval (T-AGT-013) replays the founder's **real** captured 2026-07-10 SLC/Ogden failure session. Those rows carry pi-ai-shaped `piMessage` payloads (`shared/models/session-messages.ts:256` `piMessage: v.optional(v.any())`); the rebuilt agent emits/consumes AI-SDK-shaped messages. The spec acknowledges the mismatch (`06-external-dependencies.md` teardown: "PORT: pi-ai Message types → AI-SDK message shape (risk #16 payload migration)") but **specifies no migration** — neither for live rows nor for the eval fixture transcripts. If the gold transcripts can't be loaded by the new agent, the eval fails on parse errors, not behavior — and the founder's real regression evidence becomes unreadable.
- **EVIDENCE**: `shared/models/session-messages.ts:250-256`; `11-e2e-testing-criteria.md:237` (T-AGT-013 replays recorded transcript, no migration mentioned); no `migrate-session-messages*` script exists.
- **FIX**: Add to the pi-ai teardown inventory a `scripts/migrate-session-messages-payloads.ts` (pi-ai `Message[]` → AI-SDK `CoreMessage[]`, dual-write then cleanup) **and** the same transform applied to `scripts/agent-evals/fixtures/*.transcript.json`, with one criterion asserting the SLC/Ogden fixture loads + replays under the new shape.

### L2 — Batch rate-limiting / backoff contract is unspecified | Severity: **High** | Confidence: LOW (convex-planner) · deterministic
- **GAP**: Risk #1 acknowledges Google Routes/Geocoding rate limits at batch scale, mitigated only by "serial driver" + "cursor resume tolerates a mid-run 429." There is **no retry/backoff/jitter contract** for the ~4,050-route batch, and "cursor resume" is **manual** (`--cursor=X`), not automatic. Google Routes is ~10 QPS/project; an overnight batch that hits 429 at 2am stops and waits for a human.
- **EVIDENCE**: `08-technical-risks.md:11`; `04-api-design.md:54-56` (no rate-limit args); existing `backfill-curated-geometry.ts` retry is 429/503-only, no exponential backoff.
- **FIX**: Add to `02-system-components.md` driver spec a rate-limit contract (per-provider QPS + jitter, exponential backoff w/ `Retry-After`, `--max-parallel` default 1, halt-after-N-consecutive-failures with `continueCursor`). One criterion asserting a seeded 429 is backed-off-and-retried, not dropped.

### L3 — Geospatial `riderReady` re-index deploy ordering has no migration gate | Severity: **Medium-High** | Confidence: LOW (convex-planner) · deterministic
- **GAP**: Risk #22 + `03-data-schema.md:96-104` correctly flag that adding `riderReady` as a geospatial filterKey is **non-additive** (re-insert ~5,654 points) and must sequence after `recomputeRiderReadyBatch` — but there is **no migration gate** guaranteeing no read surface queries a half-reindexed geospatial table. A deploy mid-sweep could serve half-gated nearest-mode results to riders.
- **EVIDENCE**: `convex/geospatialIndex.ts:21-27` (filterKeys `{state, primaryArchetype}` only); `03-data-schema.md:108-116` (ordering stated, no gate/lock); `04-api-design.md:71` (`searchCuratedRoutes` wraps nearest — load-bearing).
- **FIX**: Add an explicit migration-gate step to `03-data-schema.md` deploy ordering (single bounded re-insert pass; assert geospatial point count == rider-ready count before SURF gate changes deploy).

### L4 — Mastra-memory decision has an internal contradiction | Severity: **Medium** | Confidence: LOW (convex-planner)
- **GAP**: v3.1.0 resolves risk #16 by dropping `@mastra/memory` ("history loads deterministically in `sendMessage`; working memory rides `planning_sessions.agentMemory`"). But `03-data-schema.md:159-161` simultaneously keeps the `agent_memory` table as "an install-time escape if Mastra's storage interface demands per-key KV semantics." Either the adapter is dropped or it's an escape hatch — the escape hatch implies the §5b spike might *fail* to instantiate the Agent without a memory adapter, which is exactly the risk the drop was meant to eliminate.
- **EVIDENCE**: `08-technical-risks.md:26` (drop) vs `03-data-schema.md:159-161` (escape hatch).
- **FIX**: Pick one in `02-system-components.md`: either the Agent is instantiated with `memory: undefined` (and the fallback on constructor failure is the risk-#11 bespoke AI-SDK loop, **not** an adapter) — in which case delete the `agent_memory` escape-hatch language — or the spike must prove the no-adapter instantiation before the deep build.

### L5 — Eval-grader determinism: prose policies graded by an LLM judge? | Severity: **Medium-High** | Confidence: LOW (mastra-planner)
- **GAP**: The harness constitution says "assert engine outcomes — never LLM prose" (`11-e2e-testing.md:10`), but several AGT criteria grade **prose**: T-AGT-012 ("zero replies describe a beyond-radius route as 'near'"), T-AGT-021 ("no high-technical route labeled easy"), T-AGT-019 (weather verdict present). Grading free-text needs an LLM judge (non-deterministic — the eval itself becomes probabilistic) or a brittle regex. A non-deterministic gate can't reliably block merges.
- **EVIDENCE**: `11-e2e-testing-criteria.md:230,246`; `11-e2e-testing.md:10,119` (Haiku-class judge implied).
- **FIX**: In §5c, label each prose-graded criterion's grader type (deterministic regex/AST vs LLM-judge). If LLM-judge, demote to informational signal (not blocking) OR — preferably — migrate the policy to structural enforcement where possible (e.g. "near" is already structurally impossible via server-computed `distanceMi` + max-distance filter per `04-api-design.md:96`; make the grader assert on tool args, not prose).

### L6 — Streaming transport (Mastra → Convex `'use node'` action → RN) is not wired end-to-end | Severity: **Medium** | Confidence: LOW (aisdk-planner)
- **GAP**: F1 ("shows life within ~1s") depends on tool-result streaming, but the spec only mentions streaming in posture (`01-architecture-posture.md:122`), never the Convex transport. Convex `'use node'` actions don't stream a `ReadableStream` by default; wiring Mastra `agent.stream` → client needs an explicit primitive. Without it, the chat surface appears frozen until a multi-tool turn completes.
- **FIX**: Add an AC to UC-AGT-01 naming the transport (Convex `streamHttpResponse` / `useChat` wire-up) + a criterion asserting first visible update ≤ ~1s. (If streaming-in-Convex proves hard, add it to risk #11/#18 as a spike-known-unknown.)

### L7 — PROMPT_VERSION change-control lacks teeth for prompt edits | Severity: **Medium** | Confidence: LOW (mastra-planner)
- **GAP**: v3.1.0 added a model-id smoke gate (good) — but a `PROMPT_VERSION` bump still only requires the **fixtured** lane, which is model-blind by construction (MockLanguageModel replays canned turns). A prompt regression that manifests only on the real Sonnet model ships green.
- **EVIDENCE**: `12-agent-prompting.md:28-34`; `11-e2e-testing.md:103-107`.
- **FIX**: In `12-agent-prompting.md`, require BOTH the fixtured lane AND a cost-capped real-API `--smoke` pass for any `PROMPT_VERSION` bump.

### L8 — LangSmith redaction asserted, not verified on a real exported span | Severity: **Medium** | Confidence: LOW (mastra-planner) · security-adjacent
- **GAP**: T-AGT-023 requires "ONE visible LangSmith trace whose exported span JSON contains NO api-key substring" — but `SensitiveDataFilter` is configured, not proven. If keys leak into exported spans, that's a security incident visible to anyone with LangSmith project access.
- **FIX**: Make the §5b gate explicitly export the span JSON and grep for key patterns (`sk-ant-`, `sk-`, `…_API_KEY` env names); any match fails the gate.

### L9 — Hygiene mutations: dry-run→commit gate only exists for dedup | Severity: **Medium** | Confidence: LOW (convex-planner)
- **GAP**: Only `dedupeGroups` has `--dryRun` (`04-api-design.md:19`, T-HYG-005). The other at-rest hygiene writes (÷100 normalization, length null/quarantine, test-row quarantine, state canonicalization) are destructive over production rows with no preview. A divisor bug corrupts 103 editorial rows with no undo.
- **FIX**: Give every hygiene mutation a `{dryRun?}` → preview shape; one criterion asserting dry-run preview ≠ commit.

### L10 — Intermediate yield validation between the n=2 PoC and the 948-run | Severity: **Medium** | Confidence: LOW (product-manager)
- **GAP**: The PoC validated reconstruction on **n=2** routes (ratio 1.00). The next yield signal is the realized-yield gate (T-REC-017), which runs *after* a full/full-sample `--all`. The ~25-route couch sample gates `--all`, but 25 → 948 is a large generalization leap; a far-below-expected yield (e.g. 20% vs assumed ~67%) is discovered only after the spendy run.
- **FIX**: Either size the `--sample` deliberately as the yield-validation gate (record its per-lever PASS rate against the expected-yield table before `--all` unlocks), or add an explicit n≈100 yield checkpoint. (The realized-yield gate + couch sample do provide *some* signal — this is hardening, not a hole.)

### L11 — Weather handler is current-only; spec scopes forecast | Severity: **Medium-Low** | Confidence: LOW (product-manager, narrowed by orchestrator)
- **GAP**: The spec scopes "real forecast data" for dated suggestions (`01-scope.md:112`, `08-uc-agt.md:103`) and the `getRouteWeather` tool takes `departureTimeMs` (`04-api-design.md:99`) — but the existing handler (`convex/actions/weather.ts:79`) requests only `current=`. The Open-Meteo `/forecast` endpoint (`:9`) supports `daily=`/`hourly=`; the handler just doesn't ask for them. `04-api-design.md:99` saying "wraps existing tool" slightly overstates — the tool needs a forecast extension for future `departureTimeMs`.
- **FIX**: Note in `06-external-dependencies.md`/`04-api-design.md` that `getRouteWeather` extends the existing handler to fetch the `daily`/`hourly` window for `departureTimeMs`; one criterion asserting a future-dated request returns a forecast-grounded verdict.

### L12 — Smaller spec-completeness items | Severity: **Low-Med** | Confidence: LOW (various)
- **`favorite_roads` → `getUserFavorites` schema delta not concretely picked** (convex): `03-data-schema.md:147-151` notes the gap but doesn't choose Option A (denormalized fields) vs B (join-at-read). The tool degrades safely ("absent → omitted, never fabricated" `04-api-design.md:100`), but T-AGT-016's "grounded in `getUserFavorites` output" needs at least `routeId`, which `favorite_roads` lacks today (`shared/models/favorite-roads.ts:24-56`). Pick one + show the delta/migration.
- **`geometryStatus` extended validators not shown** (convex): `03-data-schema.md:55-61` says the `review`/`retired` union touches 3 sites + needs extended mutation validators, but doesn't show them. Live union is `generated|unresolved|failed` only (`convex/curatedGeometry.ts:31`). Show the `retireRoute`/`setReviewVerdict` arg validators.
- **Cross-provider classifier decorrelation is nominal, not structural** (aisdk): T-VER-012 enforces "classifier provider ≠ geometry provider" only via a `[build-gate]` grep. A runtime assert in the tier resolver would make the decorrelation (the classifier's primary value) code-enforced, not config-enforced.
- **Model-id smoke gate scope unclear** (aisdk): `12-agent-prompting.md:32-34` doesn't say whether the gate covers all tiers or just orchestrator. Clarify "any tier's model-id change → real-API smoke against that tier's provider."
- **Green-PRD ≠ green-FOUNDER-BAR expectation** (product-manager): this PRD delivers Trust T1/T2/T3 + agent feel, not the full Saturday Bar (Richness R1/R2, Feel F1–F3, Proof P1–P3 are separate). The "Saturday test" naming on T-REC-018 could imply the bar is met. A one-line note in `00-overview.md`'s FOUNDER-BAR anchoring ("this PRD does not, alone, green the Saturday Bar — R/F/P legs are separate") prevents the expectation drift.
- **Token budget still headline-only** (mastra): the 9-tool schema tax (~900–2000 tokens/turn) is *noted* (`12-agent-prompting.md:48-51`) but the cost math still leans on the ≤1000 headline. Update cost calcs to the real ~2–3.5k/turn figure.

---

## Agent Contradictions & Debates

| Topic | Position A | Position B | Resolution |
|---|---|---|---|
| Is the structured-output primitive `agent.generate({structuredOutput}) → result.object` correct? | aisdk-planner: **WRONG** — v7 wants `generateText({output: Output.object}) → result.output`; "NOT 0.x `{output}`" comment is "dangerously wrong" | mastra-planner: **CORRECT** — the v3.1.0-resolved @mastra/core 1.x primitive | **Spec is CORRECT.** Orchestrator verified against `brain/docs/mastra/fact-graph.json:62,92,120` + `ROSETTA.md:38` + probe MA-06 — `{structuredOutput:{schema}}`→`result.object` IS the 1.x Agent form. aisdk-planner cited the raw-AI-SDK `generateText` form (`brain/docs/ai-sdk/fact-graph.json:77,110`), which is correct *at the AI-SDK layer* but the wrong layer for `Agent.generate`. **The deeper, shared point survives** as M1: whether that primitive works through the custom z.ai provider is unverified. |
| Is `fellBackToBest`/provenance-testID/fallback-chip "missing" a spec gap? | RN-planner: CRITICAL — code lacks them, criteria un-runnable | (no dissent) | **Not a gap.** `07-ui-infrastructure.md` scopes all of it explicitly as build work. Orchestrator downgraded 5 RN "CRITICALs" to resolved-at-spec (pre-implementation). The valuable residual: criteria assert on testIDs the build work must create — the chain (AC → TR §07 → testID → criterion) is complete. |
| Does §5b run on a real (cold-start) Convex deployment? | mastra-planner: must be cloud-deployed or it doesn't measure the real risk | (implicit in spec: "real dev deployment") | **Partially addressed, ambiguous.** "Real dev deployment" in Convex parlance *is* a cloud deployment (≠ local `convex dev`), but the spec doesn't disambiguate. Folded into M2's fix (pin the measurement method). |

---

## Recommendations by Category (the concrete-improvement synthesis, ranked)

1. **Pin the z.ai provider (severity-leading).** Add a spike criterion (§5b/§5c): one real z.ai GLM-5.2 completion through the custom provider returning a non-empty parsed `result.object`. Without this, "one model layer" is an assertion, not a fact. (M1)
2. **Pin the §5b numbers.** Define cold-start (ms) + bundle (MB) ceilings and the cloud-deployment measurement method before the spike runs. (M2)
3. **Spec the eval-gold migration.** `scripts/migrate-session-messages-payloads.ts` + fixture transform; criterion that the SLC/Ogden transcript loads under the new shape. (L1)
4. **Add batch governance.** Rate-limit/backoff contract (L2) + `--max-cost` circuit-breaker (M3) to the driver spec; one criterion each.
5. **Sequence the enrichment re-ratification** as an explicit prerequisite in this PRD's Next Steps; gate it on the M1 spike. (M4)
6. **Spec-completeness sweep (v3.1.1, MINOR):** geospatial re-index migration gate (L3); resolve the Mastra-memory escape-hatch contradiction (L4); label eval-grader types / prefer structural enforcement (L5); name the streaming transport or flag it as a spike-known-unknown (L6); require real-API smoke for PROMPT_VERSION bumps (L7); verify LangSmith redaction on an exported span (L8); dry-run for all hygiene mutations (L9); pick the `favorite_roads` option (L12); show the `geometryStatus` validators (L12); add the green-PRD-≠-green-Bar note (L12).

**What is NOT needed**: no architecture change, no new UCs, no re-opened v3.0.2 findings. The survivors are almost all 1–3 line spec additions pinning a contract, a threshold, or a migration. With M1/M2/L1 pinned, sprint planning can proceed safely.

---

## Agent Reports (Summary)

- **product-manager** (6 findings): T-AGT-023 undefined ceilings (→M2), weather forecast gap (→L11, narrowed), intermediate-yield gate (→L10), total budget breaker (→M3), geocoding cost (folded into M3), green-PRD≠green-Bar (→L12). Verified enrichment re-rat IS flagged (→M4) and 4/5 human-gates are numeric. Verdict: yes-with-1-critical-fix.
- **convex-planner** (11 findings): batch-execution-vehicle & driver-scripts "missing" (→ downgraded: scoped at `04:76-82`; residual = rate-limit/budget, L2/M3); no batch rate-limiting (→L2); no cost breaker (→M3); geospatial re-index ordering (→L3); Mastra-memory contradiction (→L4); session_messages migration (→L1); centroid-fallback "mismatch" (→ downgraded: scoped at `02:22`); favorite_roads delta (→L12); geometryStatus validators (→L12); hygiene dry-run (→L9); Convex-timeout/batchSize math (→L2 sub). Verdict: no-with-10-fixes (orchestrator: several are pre-impl, not gaps).
- **mastra-planner** (11 findings): multi-provider z.ai unverified (→M1); §5b undefined ceilings (→M2); §5b real-deployment (→M2); eval-grader determinism (→L5); MockLanguageModel seam wrong layer (→M1); structuredOutput on z.ai unverified (→M1); LangSmith redaction (→L8); PROMPT_VERSION teeth (→L7); singleton grep-gate scope (noted, risk #17 already widened); token budget (→L12). Confirmed 8 prior findings resolved. Verdict: yes-with-6-fixes.
- **react-native-ui-planner** (12 findings): 5 "CRITICAL missing" (fellBackToBest return, provenance testID, Saturday flow, fallback chip, absence testIDs) — **all downgraded by orchestrator: scoped at `07-ui-infrastructure.md`**; weather/clarifying render (→ downgraded: `10-routing:54` states prose-in-bubble); score `/100` vs `%` inconsistency (→L12, verify intentional per-surface); liveRegion (scoped `07:66`); save affordance (verify); 0mi line citation rotted by WIP (→ re-verify at task time). Confirmed share-descope + approximate-badge + save-reachability resolved. Verdict: no (orchestrator: over-stated; spec scopes the work).
- **aisdk-planner** (10 findings): **"wrong structured-output primitive" → FALSE (orchestrator-verified)**; z.ai structured-output unverified (→M1); provider-abstraction uniformity (→M1); streaming transport (→L6); MockLanguageModel can't model z.ai (→M1); cross-PRD enrichment conflict (→M4); classifier decorrelation nominal (→L12); model-id smoke scope (→L12); classifier cost/throughput (→M3). Verdict: no (orchestrator: headline finding was wrong at the cited layer; the rest survives).

---

## Metadata

- **Agents**: product-manager, convex-planner, mastra-planner, react-native-ui-planner, aisdk-planner (5 — 4 prior-cycle + aisdk-planner new for the v3.1.0 GLM-provider concern)
- **Orchestrator independent verification**: README/00/01/03/06/08/09/11 + TR 04/07/08 read directly; code cross-checks (`package.json`, `discoverCuratedRoutes.ts`, `use-curated-discovery.ts`, `weather.ts`, `session-messages.ts`, `geospatialIndex.ts`); contradiction resolved via `brain/docs/mastra/fact-graph.json` + `brain/docs/ai-sdk/fact-graph.json`.
- **Confidence framework**: HIGH (3+ agents), MEDIUM (2 agents), LOW (1 agent; deterministic evidence noted). No HIGH this cycle — the severity-leading finding (M1) converges across exactly 2 agents.
- **Report Generated**: 2026-07-11T22:19Z · **Duration**: ~25m (5 agents parallel) + orchestrator verification
- **Next Steps**: (1) fold M1/M2/M4 + L1/L2/L3/L5 into a `/kb-prd-plan --update` → **v3.1.1** (MINOR — no new UCs; contract/threshold/migration pins only); (2) **do NOT** act on the aisdk "wrong primitive" finding (verified false); (3) treat the 5 RN + 2 convex "missing" CRITICALs as correctly-scoped build work, not spec defects; (4) then `/kb-sprint-plan`.
