'use node'

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
 *
 * Model choices based on benchmark testing in .spec/research/cerebras-vs-haiku/:
 * - high: zai-glm-4.7 (131K ctx, $2.25/$2.75 per 1M) — reasoning-heavy orchestration + generation
 * - low: qwen-3-235b-a22b-instruct-2507 (131K ctx, $0.60/$1.20 per 1M) — 100% tool-match vs llama3.1-8b (38%)
 */
const MODEL_MAP: Record<IntelligenceLevel, { provider: 'openai'; model: string }> = {
  // FIX-001: zai-glm-4.7 (via cerebras provider → Z.ai) is returning HTTP 429
  // "Insufficient balance" — the Z.ai account is out of credits, so the
  // orchestrator can't emit tool-calls and route generation fails. Temporarily
  // route the reasoning-heavy 'high' level to OpenAI gpt-4.1 (has balance,
  // reliable tool-caller) until the Z.ai account is recharged. Revert this to
  // { provider: 'cerebras', model: 'zai-glm-4.7' } once Z.ai balance is restored.
  high: { provider: 'openai', model: 'gpt-4.1' },
  // qwen-3-235b-a22b-instruct-2507: 131K ctx, $0.60/$1.20 per 1M
  // 100% tool-match in benchmark vs llama3.1-8b (38% — disqualified for format errors)
  low: { provider: 'openai', model: 'gpt-4o-mini' },
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
 * Does not instantiate a model — just returns the configuration.
 */
export function getAgentModelInfo(level: IntelligenceLevel) {
  return MODEL_MAP[level]
}

/**
 * Orchestrator tier (Mastra spike, additive) — returns a Mastra ModelRouter
 * string, NOT a pi-ai Model object. Mastra's `Agent` accepts `model` as a
 * plain 'provider/model-id' string and resolves it against the deployment's
 * ANTHROPIC_API_KEY. Kept separate from IntelligenceLevel/getAgentModel:
 * this tier is for the Mastra orchestrator Agent, not the pi-ai conversation
 * loop.
 *
 * Pinned model id reused verbatim from the already-proven
 * createDefaultAnchorExtractionModel() in anchorExtraction.ts (DEFAULT_MODEL_ID).
 */
export function getOrchestratorModel(): string {
  return 'anthropic/claude-sonnet-4-6'
}
