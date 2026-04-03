/**
 * Convex server-side environment validation.
 * Keep all Convex-only secrets here (never import client env).
 */

const requireEnv = (key: string): string => {
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
  const value = process.env[key]
  return value && value.length > 0 ? value : undefined
}

/**
 * Google Routes API (Directions v2) key.
 * Required for Epic 1 Sprint 3 routing (Google-only).
 */
export const GOOGLE_MAPS_API_KEY = optionalEnv('GOOGLE_MAPS_API_KEY')

/**
 * OpenAI API key for pi AgentSession (model: gpt-4o).
 * Required for Sprint 3 planning pipeline.
 */
export const OPENAI_API_KEY = optionalEnv('OPENAI_API_KEY')

export const isTestEnvironment = process.env.NODE_ENV === 'test'

/**
 * Pi Agent configuration.
 * Set PI_OBSERVABILITY_ENABLED=true to enable event logging.
 * Automatically disabled during tests (NODE_ENV=test).
 */
export const PI_OBSERVABILITY_ENABLED = !isTestEnvironment && optionalEnv('PI_OBSERVABILITY_ENABLED') === 'true'

/**
 * Pi Agent model configuration.
 * Defaults to gpt-4o for route planning (can override via env).
 */
export const PI_MODEL = optionalEnv('PI_MODEL') ?? 'gpt-4o'

/**
 * Pi Agent temperature for route sketching.
 * Lower temperature = more deterministic route generation.
 */
export const PI_TEMPERATURE = Number(optionalEnv('PI_TEMPERATURE') ?? '0')

/**
 * Route enrichment model for human-readable labels and descriptions.
 * Defaults to gpt-4o-mini for cost-effective batch enrichment.
 */
export const ENRICH_MODEL = optionalEnv('ENRICH_MODEL') ?? 'gpt-4o-mini'
