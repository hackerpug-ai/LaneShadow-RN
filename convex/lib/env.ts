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
 * OpenAI API key for LangChain router agent.
 * Required for Sprint 3 planning pipeline.
 */
export const OPENAI_API_KEY = optionalEnv('OPENAI_API_KEY')

export const isTestEnvironment = process.env.NODE_ENV === 'test'

/**
 * LangSmith observability configuration.
 * Set LANGSMITH_TRACING=true and provide LANGSMITH_API_KEY to enable tracing.
 * Traces are logged to LANGSMITH_PROJECT (defaults to 'default').
 * Automatically disabled during tests (NODE_ENV=test).
 * @see https://docs.langchain.com/oss/javascript/langgraph/observability
 */

export const LANGSMITH_TRACING = !isTestEnvironment && optionalEnv('LANGSMITH_TRACING') === 'true'
export const LANGSMITH_API_KEY = !isTestEnvironment ? optionalEnv('LANGSMITH_API_KEY') : ''
export const LANGSMITH_PROJECT =
  (!isTestEnvironment && optionalEnv('LANGSMITH_PROJECT')) ?? 'LaneShadowDev'
