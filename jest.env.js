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
