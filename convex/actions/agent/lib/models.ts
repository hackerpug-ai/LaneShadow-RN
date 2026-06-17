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
const MODEL_MAP: Record<IntelligenceLevel, { provider: 'cerebras'; model: string }> = {
  // zai-glm-4.7: 131K ctx, $2.25/$2.75 per 1M — reasoning-heavy orchestration + generation
  high: { provider: 'cerebras', model: 'zai-glm-4.7' },
  // qwen-3-235b-a22b-instruct-2507: 131K ctx, $0.60/$1.20 per 1M
  // 100% tool-match in benchmark vs llama3.1-8b (38% — disqualified for format errors)
  low: { provider: 'cerebras', model: 'qwen-3-235b-a22b-instruct-2507' },
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
