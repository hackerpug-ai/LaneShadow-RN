/**
 * Environment Variable Management
 * All env vars loaded and validated here
 * Provides typed access to configuration
 */

// Convex deployment URL - required
const CONVEX_URL = process.env.EXPO_PUBLIC_CONVEX_URL
if (!CONVEX_URL) {
  throw new Error('EXPO_PUBLIC_CONVEX_URL environment variable is required. Set it in .env.local')
}

const GOOGLE_PLACES_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY

const CLERK_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY
if (!CLERK_PUBLISHABLE_KEY) {
  throw new Error(
    'EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY environment variable is required. Set it in .env.local',
  )
}

export const env = {
  CONVEX_URL,
  CLERK_PUBLISHABLE_KEY,
  GOOGLE_PLACES_API_KEY,
} as const

/**
 * Type-safe environment validator
 * Call this at app startup to ensure all required env vars are present
 */
export const validateEnv = () => {}
