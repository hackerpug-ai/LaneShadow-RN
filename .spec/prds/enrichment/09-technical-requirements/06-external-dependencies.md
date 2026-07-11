---
stability: CONSTITUTION
last_validated: 2026-07-10
prd_version: 1.0.0
---

# External Dependencies

> **⚠ PENDING RE-RATIFICATION (cross-PRD, 2026-07-11).** `route-agent-quality` v3.1.0 decision
> **D1** (founder-ratified) removes `@mariozechner/pi-ai` from the codebase entirely. The
> `enrichment` tier below therefore ports **z.ai GLM-5.2 off pi-ai** onto a **custom AI-SDK
> OpenAI-compatible provider instance** (`createOpenAICompatible` with the z.ai `baseURL` +
> `apiKey` + explicit `thinkingFormat:'zai'` handling), resolved through the shared Mastra model
> layer. The GLM-5.2 model, provider, cross-provider QA posture, and cost are UNCHANGED — only
> the client library changes. **This section must be re-ratified** (its own `/kb-prd-plan
> --update` + review) before enrichment's sprints; the pi-ai rows below are marked accordingly.
> Spike-gate the thinking-format mapping with one real completion. **The re-ratification is
> gated on that proof** — route-agent-quality criterion **T-AGT-024** (a non-empty parsed
> `result.object` through the custom provider, with a text-mode JSON-parse fallback if
> `thinkingFormat:'zai'` breaks structured output). Do not re-ratify until it is green.

## Active in v1

| Dependency | Component | Use | Status | Docs |
|---|---|---|---|---|
| **z.ai API — GLM-5.2** | generation action | The `enrichment` tier model (LOCKED 2026-07-10). baseUrl `https://api.z.ai/api/coding/paas/v4`, OpenAI-completions compatible, `thinkingFormat: 'zai'`. Key: `Z_AI_API_KEY` (verified in `.env.local`; must also be set on the Convex deployment; passed as explicit `apiKey` — pi-ai's auto lookup expects `ZAI_API_KEY`) **— v3.1.0 D1: the client becomes a custom AI-SDK OpenAI-compatible provider (pi-ai removed); model + baseUrl + thinkingFormat unchanged; pending re-ratification** | **New wiring** (provider history: FIX-001 429) | https://docs.z.ai/ |
| **OpenAI API** (`gpt-4o-mini` via `low` tier) | QA verifier | Cross-provider grounding verification | **In use** (`OPENAI_API_KEY` wired) | https://platform.openai.com/docs |
| ~~`@mariozechner/pi-ai` ^0.73.1~~ | ~~both actions~~ | **REMOVED per `route-agent-quality` v3.1.0 D1** — replaced by a custom AI-SDK OpenAI-compatible provider on the Mastra model layer; forced-tool-call structured output → Zod structured output (`agent.generate(...,{structuredOutput})`). | **Removed (pending re-ratification)** | internal package |
| `@mapbox/polyline` ^1.2.1 | fact extraction | Decode stored polyline for curvature/span facts | **In use** | https://github.com/mapbox/polyline |
| Convex (dev: `quirky-panther-164`) | everything | Tables, actions, driver runs | **In use** | https://docs.convex.dev |

## Deferred (named seams, no v1 build)

| Dependency | Would serve | Cost note | Status |
|---|---|---|---|
| `osm_nodes` table spatial join | POI facts (scenic viewpoints/peaks) — cheapest honest POI source, in-Convex | free; needs join query | **Deferred (b)** |
| Overpass API | live POI alternative | free, rate-limited | **Deferred (b)** |
| Google Places (`searchAlongRoute`) | POI facts (paid alt) | ~$17/1k calls ≈ $51/3k routes | **Deferred (b)** |
| Elevation API (`getElevation` tool) | elevation-drama facts | per-route cost | **Deferred (b)** |
| **Google Street View Static API** | the vision block in `groundingFacts.visual` | ~$50–80/catalog | **DEFERRED — seam only (locked)** |

## Environment wiring checklist (implementation gate)

1. `convex/lib/env.ts`: add `export const Z_AI_API_KEY = optionalEnv('Z_AI_API_KEY')` and
   fix the stale provider comment block (currently claims Cerebras serves zai-glm).
2. Convex deployment: `npx convex env set Z_AI_API_KEY <value>` (actions read deployment
   env, not `.env.local`).
3. One real completion against api.z.ai from a Convex action before any batch run.
4. `npx convex ai-files install` — the project CLAUDE.md references
   `convex/_generated/ai/guidelines.md`, which is absent in-tree (hygiene, found during
   planning).
