/**
 * Vitest environment setup - runs before tests
 * Sets NODE_ENV=test to disable LangSmith tracing during tests
 */
process.env.NODE_ENV = 'test'

import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'
import fs from 'node:fs'
import path from 'node:path'
import { vi } from 'vitest'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const loadFirstEnvFile = () => {
  const rootDir = path.resolve(__dirname)
  const candidates = ['.env.test.local', '.env.test', '.env.local', '.env'].map(
    (p) => path.join(rootDir, p)
  )

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      dotenv.config({ path: candidate, override: false })
      return
    }
  }
}

loadFirstEnvFile()

// Set required environment variables for tests if not already set
if (!process.env.EXPO_PUBLIC_CONVEX_URL) {
  process.env.EXPO_PUBLIC_CONVEX_URL = 'https://test.convex.url'
}
if (!process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY) {
  process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY = 'pk_test_test_key'
}
if (!process.env.CONVEX_URL) {
  process.env.CONVEX_URL = 'https://test.convex.url'
}
if (!process.env.CLERK_SECRET_KEY) {
  process.env.CLERK_SECRET_KEY = 'sk_test_test_secret'
}
if (!process.env.CLERK_WEBHOOK_SECRET) {
  process.env.CLERK_WEBHOOK_SECRET = 'test-webhook-secret'
}
if (!process.env.CLERK_JWT_ISSUER_DOMAIN) {
  process.env.CLERK_JWT_ISSUER_DOMAIN = 'test.issuer.domain'
}
if (!process.env.GOOGLE_MAPS_API_KEY) {
  process.env.GOOGLE_MAPS_API_KEY = 'test-google-key'
}

// Global test utilities
global.console = {
  ...console,
  error: vi.fn(), // Suppress error logs in tests
  warn: vi.fn(),
}

// Provide jest compatibility layer for existing tests
global.jest = {
  fn: vi.fn,
  mock: vi.fn,
  spyOn: vi.spyOn,
  clearAllMocks: vi.clearAllMocks,
  resetAllMocks: vi.resetAllMocks,
  restoreAllMocks: vi.restoreAllMocks,
  useFakeTimers: vi.useFakeTimers,
  useRealTimers: vi.useRealTimers,
  advanceTimersByTime: vi.advanceTimersByTime,
  runAllTimers: vi.runAllTimers,
  runOnlyPendingTimers: vi.runOnlyPendingTimers,
  resetModules: () => {
    // Vitest doesn't have module reset, so we warn and skip
    console.warn('jest.resetModules() is not supported in Vitest - modules are automatically reloaded between tests')
  },
}
