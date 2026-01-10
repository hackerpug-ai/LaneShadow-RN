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

export const env = {
  CONVEX_URL,
} as const

/**
 * Type-safe environment validator
 * Call this at app startup to ensure all required env vars are present
 */
export const validateEnv = () => {
  // Validation happens at module load time above
  console.log('✅ Environment variables validated')
}
