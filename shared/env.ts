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

// E2E test harness — only present in dev builds bundled for e2e (set
// EXPO_PUBLIC_E2E=1 + the test creds in .env.local). Drives a hidden
// programmatic login button so Maestro can sign in without the multi-step UI.
const E2E = process.env.EXPO_PUBLIC_E2E === '1'
const E2E_TEST_EMAIL = process.env.EXPO_PUBLIC_E2E_TEST_EMAIL
const E2E_TEST_PASSWORD = process.env.EXPO_PUBLIC_E2E_TEST_PASSWORD

export const env = {
  CONVEX_URL,
  CLERK_PUBLISHABLE_KEY,
  GOOGLE_PLACES_API_KEY,
  E2E,
  E2E_TEST_EMAIL,
  E2E_TEST_PASSWORD,
} as const

/**
 * Type-safe environment validator
 * Call this at app startup to ensure all required env vars are present
 */
export const validateEnv = () => {}
