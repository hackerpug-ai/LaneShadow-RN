import { vi } from 'vitest'

/**
 * Vitest environment setup - runs before tests
 * Sets NODE_ENV=test to disable LangSmith tracing during tests
 */
process.env.NODE_ENV = 'test' as unknown as string

// Mock console methods to suppress test output
global.console = {
  ...console,
  error: vi.fn(),
  warn: vi.fn(),
}
