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

export const isTestEnvironment = process.env.NODE_ENV === 'test'

/**
 * AI model for all LLM interactions (enrichment, agents).
 * Defaults to gpt-4o. Override via AI_MODEL env var.
 */
export const AI_MODEL = optionalEnv('AI_MODEL') ?? 'gpt-4o'

/**
 * Disable rate limits for testing.
 * Set via: npx convex env set DISABLE_RATE_LIMITS true
 * TODO: Remove when Premium tier is implemented
 */
export const DISABLE_RATE_LIMITS = optionalEnv('DISABLE_RATE_LIMITS') === 'true'
