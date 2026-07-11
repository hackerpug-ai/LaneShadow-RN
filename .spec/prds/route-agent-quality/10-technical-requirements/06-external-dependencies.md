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

- **Anthropic Messages API via the repo's pi-ai model indirection** — the PoC proved
  Sonnet-class anchor extraction (ratio 1.00 on two real routes). Production does NOT call
  raw `fetch`: a dedicated **`geometry` tier** in `convex/actions/agent/lib/models.ts`
  resolves to Anthropic Sonnet, with a forced tool call (`emit_anchors`, TypeBox schema)
  replacing the PoC's JSON-regex parse. Registry note: verify pi-ai's registry carries the
  intended Sonnet id before the batch; if absent, use a registry-override `Model` literal
  verified with one real completion (enrichment's documented escape). Docs:
  https://docs.anthropic.com/en/api/messages · models:
  https://docs.anthropic.com/en/docs/about-claude/models. Key: `ANTHROPIC_API_KEY`
  (deployment env, present).
- **Ride-worthiness classifier — cross-provider** — runs on a different provider than anchor
  extraction to decorrelate blind spots: reuse the existing `low` tier
  (`openai:gpt-4o-mini`), mirroring enrichment's cross-provider QA. Forced `emit_verdict`
  tool call.

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
- **Anthropic Sonnet-class via the `orchestrator` tier** — conversation model; ~1–3¢/turn;
  same pi-ai/tier-map indirection and registry-verification escape as the geometry tier.
  Docs: https://docs.anthropic.com/en/docs/about-claude/models.
- **LangSmith** — trace backend for per-turn agent observability; env already provisioned
  (`LANGSMITH_API_KEY`/`LANGSMITH_PROJECT` on the deployment). Docs:
  https://docs.smith.langchain.com/. Wire via Mastra telemetry export.
- **Retired with the rebuild:** the orchestrator dispatch prompt machinery and
  `@mariozechner/pi-ai`'s `runAgent.ts` loop for conversation (pi-ai remains in use for the
  pipeline tiers: geometry anchor extraction, classifier, enrichment).

## Cost envelope

Lever 2 ≈ $0.07/route (LLM ~$0.02 ×≤2 attempts + geocode ~8×$0.005 + routes ~$0.01); lever 3
≈ $0.02/route (no LLM); classifier ≈ $0.002/route on the low tier. Full recoverable backfill
≈ **$150**, one overnight serial run. Conversation: ≈1–3¢ per rider turn on the
`orchestrator` tier; the eval smoke lane is operator-triggered and cost-capped.
