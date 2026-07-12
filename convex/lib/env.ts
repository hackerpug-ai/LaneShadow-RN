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

// In test environment, allow missing required env vars since vitest.env.js sets them
const isTestOrVitest = process.env.NODE_ENV === 'test' || process.env.VITEST === 'true'

export const CLERK_WEBHOOK_SECRET = isTestOrVitest
  ? (process.env.CLERK_WEBHOOK_SECRET ?? 'test-webhook-secret')
  : requireEnv('CLERK_WEBHOOK_SECRET')

export const CLERK_JWT_ISSUER_DOMAIN = isTestOrVitest
  ? (process.env.CLERK_JWT_ISSUER_DOMAIN ?? 'test.issuer.domain')
  : requireEnv('CLERK_JWT_ISSUER_DOMAIN')

export const CLERK_SECRET_KEY = isTestOrVitest
  ? (process.env.CLERK_SECRET_KEY ?? 'sk_test_test_secret')
  : requireEnv('CLERK_SECRET_KEY')

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

/**
 * Anthropic API key for Claude models.
 * pi-ai reads ANTHROPIC_API_KEY from process.env automatically.
 */
export const ANTHROPIC_API_KEY = optionalEnv('ANTHROPIC_API_KEY')

/**
 * Mapbox access token for reverse-geocoding.
 * Required for Sprint 6 IdleScreen location display.
 */
export const MAPBOX_ACCESS_TOKEN = optionalEnv('MAPBOX_ACCESS_TOKEN')

/**
 * z.ai API key for the GLM-5.2 custom AI-SDK v7 provider
 * (convex/actions/agent/lib/zaiProvider.ts, S2-T6/T-AGT-024).
 *
 * NOT yet set on the Convex deployment as of 2026-07-12 (`npx convex env
 * list` shows only ANTHROPIC_API_KEY) — this is a vitest-level spike proof;
 * setting it on the deployment is a follow-up when this tier moves into a
 * deployed Convex action.
 */
export const Z_AI_API_KEY = optionalEnv('Z_AI_API_KEY')

export const isTestEnvironment = process.env.NODE_ENV === 'test'

/**
 * AI provider and model configuration.
 *
 * Agent model selection is now centralized in convex/actions/agent/lib/models.ts.
 * Use getAgentModel(level) to get the appropriate model for 'high' or 'low' intelligence.
 *
 * Provider-specific API keys:
 * - CEREBRAS_API_KEY: Required for Cerebras models (zai-glm-4.7, qwen-3-235b)
 * - ANTHROPIC_API_KEY: Required for Claude models (legacy, unused in current config)
 * - OPENAI_API_KEY: Required for OpenAI models (legacy, unused in current config)
 */

/**
 * Protomaps US URL for tile data.
 * Optional environment variable for custom tile source.
 */
const protomapsUrl = optionalEnv('PROTOMAPS_US_URL')

if (protomapsUrl) {
  try {
    new URL(protomapsUrl)

    // Warn if not a .pmtiles URL
    if (!protomapsUrl.endsWith('.pmtiles') && !protomapsUrl.includes('.pmtiles?')) {
    }
  } catch (_e) {
    throw new Error(`Invalid PROTOMAPS_US_URL: ${protomapsUrl} is not a valid URL`)
  }
}

export const PROTOMAPS_US_URL = protomapsUrl

/**
 * Override the monthly route plan limit. 0 = unlimited.
 * When unset, falls back to FREE_TIER_MONTHLY_LIMIT (5).
 * Set via: npx convex env set RATE_LIMIT_OVERRIDE 0
 */
const rateLimitRaw = optionalEnv('RATE_LIMIT_OVERRIDE')
export const RATE_LIMIT_OVERRIDE: number | undefined =
  rateLimitRaw !== undefined ? parseInt(rateLimitRaw, 10) : undefined
