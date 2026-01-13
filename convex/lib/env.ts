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
 * Routing provider optional configuration.
 * Keep add-only; real provider wiring can consume these in the future.
 */
export const ROUTING_PROVIDER_API_KEY = optionalEnv('ROUTING_PROVIDER_API_KEY')
export const ROUTING_PROVIDER_NAME = optionalEnv('ROUTING_PROVIDER_NAME')

/**
 * Google Routes API (Directions v2) key.
 * Required only if routing provider is set to `google`.
 */
export const GOOGLE_MAPS_API_KEY = optionalEnv('GOOGLE_MAPS_API_KEY')
