# Plan: Abstract AI Provider + Switch to Cerebras

## Context

LaneShadow's agent layer hardcodes Anthropic as the provider and specific model IDs (claude-sonnet-4-6, claude-haiku-4-5) throughout 6 files. We want to:

1. **Abstract provider/model selection** behind intelligence-level keys (`low`, `high`) so agents never reference specific providers or models
2. **Switch the default provider to Cerebras** (user has `CEREBRAS_API_KEY` set)
3. **Keep the abstraction thin** — a simple mapping function, not a framework

## Key Finding: pi-ai Already Supports Cerebras

`@mariozechner/pi-ai@0.63.1` (our current version) has built-in Cerebras support. Available models:

| Model | Context | Reasoning | Cost (in/out per 1M tokens) |
|-------|---------|-----------|-----------------------------|
| `zai-glm-4.7` | 131K | no | $2.25 / $2.75 |
| `gpt-oss-120b` | 131K | yes | $0.25 / $0.69 |
| `qwen-3-235b-a22b-instruct-2507` | 131K | no | $0.60 / $1.20 |
| `llama3.1-8b` | 32K | no | $0.10 / $0.10 |

Usage: `getModel('cerebras', 'zai-glm-4.7')` — reads `CEREBRAS_API_KEY` from env automatically.

## Current State: Hardcoded Providers (6 call sites)

| File | Current Call | Role |
|------|-------------|------|
| `convex/lib/env.ts` | `AI_PROVIDER = 'anthropic'`, `AI_MODEL = 'claude-sonnet-4-6'` | Config |
| `convex/actions/agent/agents/orchestrator.ts:378` | `getModel('anthropic', 'claude-sonnet-4-6')` | High reasoning |
| `convex/actions/agent/agents/routingAgent.ts:1128` | `getModel('anthropic', 'claude-haiku-4-5')` | Sub-agent |
| `convex/actions/agent/agents/searchAgent.ts:136` | `getModel('anthropic', 'claude-haiku-4-5')` | Sub-agent |
| `convex/actions/agent/agents/enrichmentAgent.ts:220` | `getModel('anthropic', 'claude-haiku-4-5')` | Sub-agent |
| `convex/actions/agent/generateTripPlan.ts:209` | `getModel('anthropic', 'claude-sonnet-4-6')` | One-shot generation |
| `convex/actions/agent/tools/enrichRoute.ts:96` | `getModel('openai', AI_MODEL)` | Route label generation |
| `convex/actions/agent/sendMessage.ts:75` | `model: AI_MODEL` | Metadata only |

## Implementation

### Step 1: Create the model registry — `convex/actions/agent/lib/models.ts`

Single file that owns ALL provider/model mapping logic.

```typescript
import { getModel } from '@mariozechner/pi-ai'

/**
 * Intelligence levels for agent model selection.
 * Agents request a level; the registry maps it to a concrete provider+model.
 * This is the ONLY place provider/model names appear in the codebase.
 */
export type IntelligenceLevel = 'low' | 'high'

/**
 * Model configuration for the current provider.
 * Change this block to swap providers — nothing else in the codebase changes.
 */
const MODEL_MAP: Record<IntelligenceLevel, { provider: string; model: string }> = {
  low:  { provider: 'cerebras', model: 'zai-glm-4.7' },
  high: { provider: 'cerebras', model: 'zai-glm-4.7' },
}

/**
 * Get a pi-ai model for the given intelligence level.
 * Wraps getModel() so agents never import from pi-ai directly.
 */
export function getAgentModel(level: IntelligenceLevel) {
  const { provider, model } = MODEL_MAP[level]
  return getModel(provider, model as any)
}

/**
 * Get the provider+model tuple for metadata/logging.
 */
export function getAgentModelInfo(level: IntelligenceLevel) {
  return MODEL_MAP[level]
}
```

### Step 2: Update `convex/lib/env.ts`

- Remove `AI_PROVIDER` and `AI_MODEL` exports (replaced by the registry)
- Add `CEREBRAS_API_KEY` as optional env var (for validation in agents that check key presence)
- Keep `OPENAI_API_KEY` for the enrichRoute tool (can be migrated later)

### Step 3: Replace all 6 `getModel()` call sites

Each agent file gets a mechanical change:

**Before:**
```typescript
import { getModel } from '@mariozechner/pi-ai'
// ...
const model = getModel('anthropic', 'claude-sonnet-4-6' as any)
```

**After:**
```typescript
import { getAgentModel } from '../lib/models'
// ...
const model = getAgentModel('high')  // or 'low' for sub-agents
```

| File | Intelligence Level | Why |
|------|-------------------|-----|
| `orchestrator.ts` | `high` | Intent classification needs strong reasoning |
| `routingAgent.ts` | `low` | Focused tool-calling task |
| `searchAgent.ts` | `low` | Focused tool-calling task |
| `enrichmentAgent.ts` | `low` | Focused tool-calling task |
| `generateTripPlan.ts` | `high` | Multi-step generation |
| `enrichRoute.ts` | `low` | Structured label generation |
| `sendMessage.ts` | metadata only — use `getAgentModelInfo('high')` |

### Step 4: Update key validation in `routingAgent.ts`

**Before:** `if (!ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY not configured')`
**After:** `if (!CEREBRAS_API_KEY) throw new Error('CEREBRAS_API_KEY not configured')`

Or better — validate in `models.ts` at import time so we don't scatter key checks:

```typescript
// In models.ts — fail fast at module load
const requiredKey = MODEL_MAP.low.provider === 'cerebras' ? 'CEREBRAS_API_KEY' : ''
if (requiredKey && !process.env[requiredKey]) {
  console.warn(`[models] Warning: ${requiredKey} not set — agent calls will fail`)
}
```

### Step 5: Update tests

- `ridePlanningAgent.test.ts`: Change env mock to use `CEREBRAS_API_KEY`
- `enrichRoute.test.ts`: Keep `OPENAI_API_KEY` for now (enrichRoute still uses OpenAI)
- Update any assertions on `AI_MODEL` / `AI_PROVIDER`

### Step 6: Set Convex environment variable

```bash
npx convex env set CEREBRAS_API_KEY <value>
```

## Files Modified

| File | Change |
|------|--------|
| `convex/actions/agent/lib/models.ts` | **NEW** — model registry |
| `convex/lib/env.ts` | Remove `AI_PROVIDER`/`AI_MODEL`, add `CEREBRAS_API_KEY` |
| `convex/actions/agent/agents/orchestrator.ts` | `getModel()` → `getAgentModel('high')` |
| `convex/actions/agent/agents/routingAgent.ts` | `getModel()` → `getAgentModel('low')`, key check update |
| `convex/actions/agent/agents/searchAgent.ts` | `getModel()` → `getAgentModel('low')` |
| `convex/actions/agent/agents/enrichmentAgent.ts` | `getModel()` → `getAgentModel('low')` |
| `convex/actions/agent/generateTripPlan.ts` | `getModel()` → `getAgentModel('high')` |
| `convex/actions/agent/tools/enrichRoute.ts` | `getModel('openai', ...)` → `getAgentModel('low')` |
| `convex/actions/agent/sendMessage.ts` | `AI_MODEL` → `getAgentModelInfo('high').model` |
| `convex/actions/agent/__tests__/ridePlanningAgent.test.ts` | Update env mocks |
| `.env.example` | Add `CEREBRAS_API_KEY` |

## Verification

1. **Type check**: `npx tsc --noEmit` — should pass
2. **Existing tests**: `npx vitest run convex/` — all pass
3. **Smoke test**: Send a message via the app and verify agent responds using Cerebras
4. **Model swap test**: Temporarily change `MODEL_MAP.low.model` to a different Cerebras model, confirm no code changes needed elsewhere
5. **Check Convex env**: `npx convex env list` shows `CEREBRAS_API_KEY` set

## Future Considerations

- The `MODEL_MAP` could be driven by Convex env vars for runtime switching without redeployment
- `enrichRoute.ts` currently uses OpenAI separately — can migrate to the same registry later
- Adding a `reasoning` level (between low and high) could map to `gpt-oss-120b` which supports reasoning mode
