'use node'

import { anthropic } from '@ai-sdk/anthropic'
import { createOpenAICompatible } from '@ai-sdk/openai-compatible'
import { getModel } from '@mariozechner/pi-ai'
import type { LanguageModel } from 'ai'
import { ANTHROPIC_API_KEY, OPENAI_API_KEY } from '../../../lib/env'

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
 * Structured-output model map for AI SDK generateText + Output.object.
 *
 * Separate from the pi-ai MODEL_MAP: tool-calling (trip planning) and
 * structured JSON extraction (anchor reconstruction) have different reliability
 * profiles. Anchor extraction is proven on Anthropic Claude Sonnet (S1-T1) and
 * S4-T1 cassettes record Anthropic exchanges — keep that production path.
 *
 * Intelligence level still flows through the model layer so callers request
 * capability tier, never a hard-coded provider string.
 */
const STRUCTURED_OUTPUT_MODEL_MAP: Record<
  IntelligenceLevel,
  { provider: 'anthropic' | 'openai'; model: string }
> = {
  high: { provider: 'anthropic', model: 'claude-sonnet-4-6' },
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
 * AI SDK LanguageModel for structured-output completions (REC-02 Lever 2
 * anchor extraction). Resolves intelligence level through the model layer —
 * callers request 'high' / 'low', never a provider string.
 *
 * Uses STRUCTURED_OUTPUT_MODEL_MAP (Anthropic for high) so production
 * reconstructForRoute stays cassette-compatible with S4-T1 Anthropic recordings.
 */
export function getAgentLanguageModel(level: IntelligenceLevel): LanguageModel {
  const { provider, model } = STRUCTURED_OUTPUT_MODEL_MAP[level]

  if (provider === 'anthropic') {
    if (!ANTHROPIC_API_KEY) {
      throw new Error('Missing required environment variable: ANTHROPIC_API_KEY')
    }
    return anthropic(model)
  }

  if (!OPENAI_API_KEY) {
    throw new Error('Missing required environment variable: OPENAI_API_KEY')
  }
  const openai = createOpenAICompatible({
    name: 'openai',
    baseURL: 'https://api.openai.com/v1',
    apiKey: OPENAI_API_KEY,
  })
  return openai(model)
}

/**
 * Metadata for the structured-output model tier (anchor extraction).
 */
export function getAgentLanguageModelInfo(level: IntelligenceLevel) {
  return STRUCTURED_OUTPUT_MODEL_MAP[level]
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
