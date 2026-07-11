---
stability: CONSTITUTION
last_validated: 2026-07-10
prd_version: 1.0.0
---

# External Dependencies

## Lever-2 reconstructor + lever-3 re-router (`'use node'` actions)

- **Google Geocoding API** — anchor/endpoint → lat/lng, region-biased via `bounds` (PoC
  pattern). Docs: https://developers.google.com/maps/documentation/geocoding/overview ·
  viewport biasing:
  https://developers.google.com/maps/documentation/geocoding/requests-geocoding#viewport-biasing
  · pricing ~$5 / 1k. Key: `GOOGLE_MAPS_API_KEY` (`convex/lib/env.ts`) — must be set on the
  **deployment** (`npx convex env set`), not only `.env.local`.
- **Google Routes API `computeRoutes`** — route through anchors as `intermediates` with
  `via: true` + `polylineQuality: HIGH_QUALITY`, field-masked to
  `routes.polyline.encodedPolyline,routes.distanceMeters` (billing driver; existing
  `routingProvider.ts` precedent). Docs:
  https://developers.google.com/maps/documentation/routes/compute_route_directions ·
  intermediates: https://developers.google.com/maps/documentation/routes/specify_intermediates
  · field masks: https://developers.google.com/maps/documentation/routes/choose_fields ·
  pricing Advanced ~$10 / 1k.

## LLM seams (anchor extraction + classifier)

- **Anthropic Sonnet via the Mastra model layer (v3.0.2 — pi-ai removed)** — the PoC proved
  Sonnet-class anchor extraction (ratio 1.00 on two real routes). Production does NOT call
  raw `fetch`: a dedicated **`geometry` tier** in `convex/actions/agent/lib/models.ts`
  resolves to a ModelRouter string (`'anthropic/claude-sonnet-…'`); a single-shot Mastra
  generation with structured output (`emit_anchors`, Zod schema) replaces the PoC's
  JSON-regex parse. Pin note: verify the router resolves the pinned Sonnet id with one real
  completion before the batch; if absent, use an explicit AI-SDK model instance (the same
  escape as the orchestrator tier). Docs:
  https://docs.anthropic.com/en/api/messages · models:
  https://docs.anthropic.com/en/docs/about-claude/models. Key: `ANTHROPIC_API_KEY`
  (deployment env, present).
- **Ride-worthiness classifier — cross-provider** — runs on a different provider than anchor
  extraction to decorrelate blind spots: the `low` tier as a ModelRouter string
  (`'openai/gpt-4o-mini'`), mirroring enrichment's cross-provider QA. Structured
  `emit_verdict` output (Zod).

## Deterministic gate + rendering

- **`@mapbox/polyline`** — decode/encode precision-5 lines for the gate and couch render
  (existing dep; used in `curatedGeometryQa.ts`, `routingProvider.ts`). Docs:
  https://github.com/mapbox/polyline.
- **Mapbox Static Images API** — couch-sample PNG renders in the **local** driver script
  only (no image bytes through Convex). Docs: https://docs.mapbox.com/api/maps/static-images/.
  Token: `MAPBOX_PUBLIC_TOKEN` / `MAPBOX_ACCESS_TOKEN` (present).

## Superseded

- **Nominatim / Overpass** — the name-only geocode with no output validation is the
  documented root cause of the wrong-length geometry (18.4% of the catalog). **Retired from
  the recovery path**; Google Geocoding (region-biased) replaces it in levers 2/3. The
  existing action stays in-tree only until the levers land, then is removed. Reference during
  removal: https://nominatim.org/release-docs/latest/api/Search/.

## Agent layer (AGT, v2.0.0)

- **`@mastra/core`** — the agent framework: Agent loop, tool registry, memory abstraction,
  telemetry hooks; embedded in the existing Convex `'use node'` actions (no standalone
  server). Docs: https://mastra.ai/docs · repo: https://github.com/mastra-ai/mastra.
  Constraint to verify in the spike: clean operation inside the Convex Node runtime
  (bundling, no server-only assumptions) — this is the Mastra reference-conversation spike
  gate (11-e2e-testing §5b). Local KB: the `mastra-patterns` skill + mastra
  planner/implementer/reviewer specialists.
- **Anthropic Sonnet-class via the `orchestrator` tier** — conversation model; ~1–3¢/turn.
  **Correction (v3.0.1):** this tier lives in the same tier-map FILE (`lib/models.ts`) but
  returns a **Mastra ModelRouter string** (`'anthropic/claude-sonnet-…'`, resolved against
  the deployment `ANTHROPIC_API_KEY`) — NOT a pi-ai `Model` object, which Mastra cannot
  consume. The router-string form avoids adding an `@ai-sdk/anthropic` dependency; the
  escape if the router can't resolve the pinned id is an explicit AI-SDK model instance,
  verified with one real completion in the §5b spike. **v3.0.2:** the pipeline tiers
  (geometry / classifier / enrichment) move onto the same router-string tier map — pi-ai is
  removed entirely.
  Docs: https://docs.anthropic.com/en/docs/about-claude/models.
- **LangSmith** — trace backend for per-turn agent observability; env already provisioned
  (`LANGSMITH_API_KEY`/`LANGSMITH_PROJECT` on the deployment). Docs:
  https://docs.smith.langchain.com/. Wire via Mastra telemetry export.
- **Retired with the rebuild:** the orchestrator dispatch prompt machinery, pi-ai's
  `runAgent.ts` conversation loop, and — **v3.0.2, founder-ratified — the
  `@mariozechner/pi-ai` dependency itself**: every LLM seam (orchestrator, geometry anchors,
  classifier, enrichment) resolves through the Mastra model layer; pi-ai is dropped from
  `package.json`.

## pi-ai teardown inventory (v3.1.0 — an ATOMIC migration, not a package bump)

Convex bundles the whole deployment: a single missing `@mariozechner/pi-ai` import fails
**every** function, not one. The removal must land as one atomic task covering all live
importers. Verified `grep "@mariozechner/pi-ai" convex/**` → **13 production files**; each is
DELETE (goes away with the rebuild) or PORT (kept, internals move to the Mastra model layer /
AI-SDK types):

| File | Disposition | Note |
|---|---|---|
| `convex/actions/agent/generateTripPlan.ts` | **PORT (was unlisted)** | a **live public `action`** calling pi-ai `complete()` + `getAgentModel('high')` — must move to a Mastra generation or it blocks deploy |
| `orchestrator.ts` + sub-agents + `runAgent.ts` + `ridePlanningAgent.ts` | DELETE | the dispatch/ReAct loop the Mastra agent replaces |
| `sendMessage.ts` | PORT | pi-ai `Message` types → AI-SDK message shape (risk #16 payload migration) |
| `budgetTracker.ts` | PORT | pi-ai `Usage` type → AI-SDK usage; budget guard stays code |
| `tools/enrichRoute.ts` | PORT | pi-ai `complete/getModel` + `getAgentModel('low')` → low-tier Mastra generation **inside the tool** (see below) |
| `tools/manageWaypoints.ts` + `lib/piTools.ts` | PORT | pi-ai `Type` schema builder → Zod tool schemas |
| `tools/discoverCuratedRoutes.ts` | DELETE/PORT | pi-ai `validateToolCall`; logic absorbed into `searchCuratedRoutes` |
| `convex.json` `externalPackages` + `package.json` deps | EDIT | remove `@mariozechner/pi-ai` from both |

- **`enrichRoute` becomes a nested Mastra generation inside a tool (D1 consequence):** a
  low-tier generation runs *inside* `createTool.execute`, *inside* the orchestrator loop — the
  per-turn `budgetTracker` must be **threaded into** that nested call or its cost is invisible;
  the span tree gains a model span under a tool span.
- **Enrichment tier — GLM-5.2 ported off pi-ai (D1, founder-ratified 2026-07-11):** enrichment
  keeps **z.ai GLM-5.2** but resolves through a **custom AI-SDK OpenAI-compatible provider
  instance** (`createOpenAICompatible` with the z.ai `baseURL` + `apiKey`, plus explicit
  handling of the `thinkingFormat:'zai'` reasoning wrapper) instead of pi-ai's OpenAI-compat
  path — so "pi-ai removed entirely" stays literally true. This **conflicts with the enrichment
  PRD's ratified z.ai-via-pi-ai lock**
  (`.spec/prds/enrichment/09-technical-requirements/06-external-dependencies.md`) and requires a
  **re-ratification of that PRD's dependency section** (risk #21). Spike-gate the thinking-format
  mapping with one real completion before the enrichment batch. **Structured-output failure path
  (v3.1.1):** `thinkingFormat:'zai'` reasoning tokens can break `structuredOutput` parsing — the
  documented fallback is a text-mode JSON parse with a typed error (or the low tier). Criterion
  **T-AGT-024** requires one real GLM-5.2 completion returning a non-empty parsed `result.object`
  through this provider before any pipeline-tier task, and it gates the enrichment re-ratification
  (README Next Steps prerequisite) — "one model layer" is otherwise untested for the single
  non-stock provider.

## Cost envelope

Lever 2 ≈ $0.07/route (LLM ~$0.02 ×≤2 attempts + geocode ~8×$0.005 + routes ~$0.01); lever 3
≈ $0.02/route (no LLM); classifier ≈ $0.002/route on the low tier. Full recoverable backfill
≈ **$150**, one overnight serial run. Conversation: ≈1–3¢ per rider turn on the
`orchestrator` tier; the eval smoke lane is operator-triggered and cost-capped.

**Batch telemetry (v3.1.0):** the pipeline-seam generations (geometry / classifier /
enrichment) run **without Mastra Observability spans and without `@mastra/memory`** — a ~4k-route
`--all` run would otherwise emit ~12k model + tool spans over OTLP to LangSmith for no debugging
value; provenance-as-data (`verification` + `anchors[]`) is the batch audit trail. Wire
Observability on the conversation instance only (or sample the batch tiers at 0).
