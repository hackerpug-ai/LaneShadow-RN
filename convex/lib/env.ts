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
