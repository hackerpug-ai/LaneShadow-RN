/**
 * Vitest global type definitions
 *
 * Enables TypeScript to recognize vitest globals (describe, it, expect, etc.)
 * when using `globals: true` in vitest.config.ts
 */

import { expect, describe, it, jest, beforeAll, afterAll, beforeEach, afterEach } from 'vitest'

declare global {
  const describe: typeof describe
  const it: typeof it
  const test: typeof it
  const expect: typeof expect
  const jest: typeof jest
  const beforeAll: typeof beforeAll
  const afterAll: typeof afterAll
  const beforeEach: typeof beforeEach
  const afterEach: typeof afterEach
}
