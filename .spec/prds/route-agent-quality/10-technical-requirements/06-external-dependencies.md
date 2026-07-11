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

## Cost envelope

Lever 2 ≈ $0.07/route (LLM ~$0.02 ×≤2 attempts + geocode ~8×$0.005 + routes ~$0.01); lever 3
≈ $0.02/route (no LLM); classifier ≈ $0.002/route on the low tier. Full recoverable backfill
≈ **$150**, one overnight serial run. Conversation: ≈1–3¢ per rider turn on the
`orchestrator` tier; the eval smoke lane is operator-triggered and cost-capped.
