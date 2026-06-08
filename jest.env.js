/**
 * Jest environment setup - runs before tests
 * Sets NODE_ENV=test to disable LangSmith tracing during tests
 */
process.env.NODE_ENV = 'test'

// Stub required Convex server-side env vars for test environments.
// These are not used in test logic — only to satisfy module-load validators.
if (!process.env.CLERK_WEBHOOK_SECRET) {
  process.env.CLERK_WEBHOOK_SECRET = 'test-clerk-webhook-secret'
}
if (!process.env.CLERK_JWT_ISSUER_DOMAIN) {
  process.env.CLERK_JWT_ISSUER_DOMAIN = 'test-clerk-jwt-issuer'
}
if (!process.env.CLERK_SECRET_KEY) {
  process.env.CLERK_SECRET_KEY = 'test-clerk-secret-key'
}

// Stub required Expo public env vars for test environments
if (!process.env.EXPO_PUBLIC_CONVEX_URL) {
  process.env.EXPO_PUBLIC_CONVEX_URL = 'https://test.convex.cloud'
}
if (!process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY) {
  process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY = 'test-clerk-publishable-key'
}
if (!process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY) {
  process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY = 'test-google-places-key'
}
