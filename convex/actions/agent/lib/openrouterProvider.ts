'use node'

import { createOpenAICompatible, type OpenAICompatibleProvider } from '@ai-sdk/openai-compatible'
import { generateText, type LanguageModel, NoObjectGeneratedError, Output } from 'ai'
import { z } from 'zod'
import { OPENROUTER_API_KEY } from '../../../lib/env'

/**
 * Sprint-02-SPIKE-ONLY proof schema (T-AGT-024). This is explicitly NOT the
 * production enrichment `whyText` schema — that is later enrichment-pipeline
 * scope. Exported names are deliberately distinct from the real contract so
 * they cannot be mistaken for it.
 */
export const openrouterStructuredProofSchema = z.object({
  summary: z.string().min(1),
  confidence: z.enum(['high', 'medium', 'low']),
})

export type OpenRouterStructuredProof = z.infer<typeof openrouterStructuredProofSchema>

export const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1'
/** OpenRouter model used by all project AI calls. Keep this provider-qualified
 * model free of legacy provider dependencies so rate limiting elsewhere cannot affect us. */
export const OPENROUTER_MODEL_ID = 'deepseek/deepseek-v4-pro'

export type OpenRouterProvider = {
  provider: OpenAICompatibleProvider
  baseURL: string
  apiKey: string
}

/**
 * Constructs the OpenRouter OpenAI-compatible provider instance. Reads the
 * API key ONLY through `OPENROUTER_API_KEY` (convex/lib/env.ts) — never a
 * hardcoded literal, never `process.env.OPENROUTER_API_KEY` directly.
 *
 * Throws (does not silently no-op) if OPENROUTER_API_KEY is unset, so a missing
 * dependency is a surfaced, clear error rather than a swallowed one.
 */
export const createOpenRouterProvider = (): OpenRouterProvider => {
  if (!OPENROUTER_API_KEY) {
    throw new Error('Missing required environment variable: OPENROUTER_API_KEY')
  }

  const baseURL = OPENROUTER_BASE_URL
  const apiKey = OPENROUTER_API_KEY
  const provider = createOpenAICompatible({ name: 'openrouter', baseURL, apiKey })

  return { provider, baseURL, apiKey }
}

/**
 * Extracts the first balanced `{...}` JSON object from raw completion text,
 * tracking string/escape state so braces inside quoted strings don't
 * prematurely close the match. Returns undefined if no balanced object is
 * found (e.g. no `{` at all, or the object never closes).
 */
const extractFirstBalancedJsonObject = (text: string): string | undefined => {
  const start = text.indexOf('{')
  if (start === -1) {
    return undefined
  }

  let depth = 0
  let inString = false
  let escaped = false

  for (let i = start; i < text.length; i += 1) {
    const char = text[i]

    if (inString) {
      if (escaped) {
        escaped = false
      } else if (char === '\\') {
        escaped = true
      } else if (char === '"') {
        inString = false
      }
      continue
    }

    if (char === '"') {
      inString = true
      continue
    }

    if (char === '{') {
      depth += 1
    } else if (char === '}') {
      depth -= 1
      if (depth === 0) {
        return text.slice(start, i + 1)
      }
    }
  }

  return undefined
}

export type ParseOpenRouterFallbackResult<T> =
  | { ok: true; object: T }
  | { ok: false; reason: 'structured_and_fallback_both_failed' }

/**
 * Typed text-mode JSON-parse fallback. Extracts the first balanced JSON
 * object from raw completion text, parses it, and re-validates against the
 * given Zod schema. Never coerces/defaults malformed or empty input into a
 * passing shape — returns a typed error instead.
 *
 * Pure function, zero network I/O — safe to unit test directly against
 * captured/malformed/empty text.
 */
export const parseOpenRouterFallback = <T>(
  rawText: string,
  schema: z.ZodType<T>,
): ParseOpenRouterFallbackResult<T> => {
  const extracted = extractFirstBalancedJsonObject(rawText)
  if (extracted === undefined) {
    return { ok: false, reason: 'structured_and_fallback_both_failed' }
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(extracted)
  } catch {
    return { ok: false, reason: 'structured_and_fallback_both_failed' }
  }

  const validated = schema.safeParse(parsed)
  if (!validated.success) {
    return { ok: false, reason: 'structured_and_fallback_both_failed' }
  }

  return { ok: true, object: validated.data }
}

export const buildOpenRouterProofPrompt = (description: string): string => {
  return `Summarize this motorcycle route description in one or two sentences, and rate how confident you are that the summary captures the route's key character.

ROUTE DESCRIPTION:
${description}

Respond with a JSON object matching this exact shape (no other text):
{"summary": "<your one or two sentence summary>", "confidence": "high" | "medium" | "low"}`
}

export type OpenRouterPath = 'structured' | 'text-fallback'

export type OpenRouterStructuredCompleteResult =
  | { ok: true; object: OpenRouterStructuredProof; path: OpenRouterPath }
  | { ok: false; reason: 'structured_and_fallback_both_failed'; raw?: string }

export type OpenRouterStructuredCompleteOptions = {
  model?: LanguageModel
}

/**
 * Direct AI-SDK v7 completion against the OpenRouter DeepSeek V4 Pro custom
 * createOpenAICompatible provider, decoupled from Mastra. Uses the same
 * generateText + Output.object structured-output shape proven in
 * anchorExtraction.ts (reads result.output, NOT result.object).
 *
 * Ladder: structured output -> (on throw or re-validation failure) text-mode
 * JSON-extraction fallback -> typed error. Never silently defaults/coerces a
 * validation failure into a passing shape.
 */
export const openrouterStructuredComplete = async (
  description: string,
  options?: OpenRouterStructuredCompleteOptions,
): Promise<OpenRouterStructuredCompleteResult> => {
  const model = options?.model ?? createOpenRouterProvider().provider(OPENROUTER_MODEL_ID)
  const prompt = buildOpenRouterProofPrompt(description)

  let rawText: string | undefined

  try {
    const result = await generateText({
      model,
      output: Output.object({ schema: openrouterStructuredProofSchema }),
      prompt,
    })

    const validated = openrouterStructuredProofSchema.safeParse(result.output)
    if (validated.success) {
      return { ok: true, object: validated.data, path: 'structured' }
    }

    // The AI SDK's own structured-output validation passed but our
    // defensive re-validation against the same schema disagreed — fall
    // through to the same text-mode fallback ladder as a thrown
    // NoObjectGeneratedError, using the raw assembled text.
    rawText = result.text
  } catch (error) {
    if (NoObjectGeneratedError.isInstance(error)) {
      rawText = error.text
    } else {
      throw error
    }
  }

  const fallback = parseOpenRouterFallback(rawText ?? '', openrouterStructuredProofSchema)
  if (fallback.ok) {
    return { ok: true, object: fallback.object, path: 'text-fallback' }
  }

  return { ok: false, reason: fallback.reason, raw: rawText }
}
