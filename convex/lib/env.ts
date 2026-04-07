/**
 * Convex server-side environment validation.
 * Keep all Convex-only secrets here (never import client env).
 */

const requireEnv = (key: string): string => {
  // eslint-disable-next-line expo/no-dynamic-env-var -- server-side Convex env utility; key is a parameter
  const value = process.env[key]
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`)
  }
  return value
}

export const CLERK_WEBHOOK_SECRET = requireEnv('CLERK_WEBHOOK_SECRET')
export const CLERK_JWT_ISSUER_DOMAIN = requireEnv('CLERK_JWT_ISSUER_DOMAIN')
export const CLERK_SECRET_KEY = requireEnv('CLERK_SECRET_KEY')

const optionalEnv = (key: string): string | undefined => {
  // eslint-disable-next-line expo/no-dynamic-env-var -- server-side Convex env utility; key is a parameter
  const value = process.env[key]
  return value && value.length > 0 ? value : undefined
}

/**
 * Google Routes API (Directions v2) key.
 * Required for Epic 1 Sprint 3 routing (Google-only).
 */
export const GOOGLE_MAPS_API_KEY = optionalEnv('GOOGLE_MAPS_API_KEY')

/**
 * OpenAI API key for all AI calls (aisdk, pi agent).
 */
export const OPENAI_API_KEY = optionalEnv('OPENAI_API_KEY')

/**
 * Google Generative AI (Gemini) API key.
 */
export const GOOGLE_GENERATIVE_AI_API_KEY = optionalEnv('GOOGLE_GENERATIVE_AI_API_KEY')

export const isTestEnvironment = process.env.NODE_ENV === 'test'

/**
 * AI provider: 'openai' or 'google'. Defaults to 'google' (Gemini).
 * Override via AI_PROVIDER env var.
 */
export const AI_PROVIDER = (optionalEnv('AI_PROVIDER') ?? 'google') as 'openai' | 'google'

/**
 * AI model for all LLM interactions (enrichment, agents).
 * Defaults to gemini-2.5-flash for google, gpt-4.1 for openai.
 * Override via AI_MODEL env var.
 */
export const AI_MODEL = optionalEnv('AI_MODEL') ?? (AI_PROVIDER === 'google' ? 'gemini-2.5-flash' : 'gpt-4.1')

/**
 * Override the monthly route plan limit. 0 = unlimited.
 * When unset, falls back to FREE_TIER_MONTHLY_LIMIT (5).
 * Set via: npx convex env set RATE_LIMIT_OVERRIDE 0
 */
const rateLimitRaw = optionalEnv('RATE_LIMIT_OVERRIDE')
export const RATE_LIMIT_OVERRIDE: number | undefined =
  rateLimitRaw !== undefined ? parseInt(rateLimitRaw, 10) : undefined
