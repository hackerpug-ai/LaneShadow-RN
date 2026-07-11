---
stability: CONSTITUTION
last_validated: 2026-07-10
prd_version: 1.0.0
---

# Architecture Posture

## Batch content-generation pipeline — a structural clone of the geometry backfill

One-route-at-a-time, resumable, idempotent, gated behind QA. Four moving parts mirror the
proven DATA-011 pattern exactly:

| DATA-011 (geometry) | This PRD (enrichment) |
|---|---|
| `convex/curatedGeometry.ts` — data-access (internalQuery/internalMutation), default runtime | `convex/curatedEnrichment.ts` |
| `convex/actions/curatedGeometry.ts` — `'use node'` action, external calls, `generateForRoute` + `backfill` | `convex/actions/curatedEnrichment.ts` |
| `convex/curatedGeometryQa.ts` — QA classify | `convex/curatedEnrichmentQa.ts` |
| `scripts/backfill-curated-geometry.ts` — resumable driver | `scripts/backfill-curated-enrichment.ts` |

## LLM layer — dedicated `enrichment` tier → z.ai GLM-5.2 (LOCKED 2026-07-10)

- Generation runs in a Convex **`'use node'` internal action** (external network only from
  actions) through the repo's existing client **`@mariozechner/pi-ai`** and its single-source
  model indirection (`convex/actions/agent/lib/models.ts`). **No new LLM dependency.**
- Extend `IntelligenceLevel` with a dedicated **`enrichment`** tier:
  `{ provider: 'zai', model: 'glm-5.2' }`. Providers/models stay in `models.ts` only —
  the pipeline never hardcodes either.
- **Registry note (verified against installed pi-ai):** this pi-ai version's `zai` registry
  carries `glm-4.5-air`, `glm-4.7`, `glm-5-turbo`, `glm-5.1`, `glm-5v-turbo` — **no
  `glm-5.2`**. Implementation resolves this by (preferred) bumping `@mariozechner/pi-ai` to
  a registry that includes `glm-5.2`, or by a **registry-override Model literal** (spread
  the `zai.glm-5.1` entry, override `id: 'glm-5.2'` — baseUrl
  `https://api.z.ai/api/coding/paas/v4`, api `openai-completions`, `thinkingFormat: 'zai'`).
  Either path is **verified with one real completion against api.z.ai before the batch runs**.
- **API key wiring (verified):** pi-ai's auto env lookup expects `ZAI_API_KEY`; the repo key
  is **`Z_AI_API_KEY`** (present in `.env.local`). Therefore: export `Z_AI_API_KEY` from
  `convex/lib/env.ts` (optionalEnv) and **pass `apiKey` explicitly** in the pi-ai call
  options — no hidden env-name coupling. The key must also be set on the Convex deployment
  (`npx convex env set Z_AI_API_KEY …`) — actions read deployment env, not `.env.local`.
- Structured output uses the repo's proven **forced-tool-call** mechanism
  (`complete(model, context)` + an `emit_enrichment` tool with a TypeBox schema), exactly as
  `convex/actions/agent/tools/enrichRoute.ts` does today. No free-form JSON parsing.
- **Cross-provider QA:** the grounding verifier runs on `getAgentModel('low')`
  (currently `openai:gpt-4o-mini`) — a different provider than generation, reducing
  correlated blind spots.
- **Failure posture (FIX-001 lesson):** z.ai returned HTTP 429 "Insufficient balance" in
  this repo's history. On provider errors: fail-closed per route (no row written), resume
  via cursor, and **halt the batch after N consecutive provider errors** — never silently
  substitute another model (that would betray the locked model choice).

## Prompt strategy

Large static system prompt (rules, banned-claims, output schema, few-shot) as the stable
prefix — prompt-cache-friendly; only the ~350-token per-route facts block varies. Modest
concurrency (3–5 in-flight) governed by the existing `budgetTracker` + `withTimeout`
(`convex/actions/agent/lib/reliability.ts`).

## Sequencing vs the Trust wave

Generation runs **after** the catalog-geometry-recovery drop. Eligibility filter:
`geometryStatus === 'generated'` AND the route survived the drop. Enriching earlier wastes
spend on doomed rows and grounds "why" on centroid dots. Enrichment is FOUNDER-BAR Wave 2
(Richness), explicitly behind Wave 1 (Trust).

## Deterministic vs probabilistic split

Everything that must always happen is deterministic code: status transitions, hash
computation, lint, read-path gating (`qa_passed`-only), coverage counting, batch
resumability. The LLM is probabilistic and appears at exactly two seams — generation and
the grounding verifier — both behind forced-tool-call schemas with deterministic validation
and fail-closed handling.
