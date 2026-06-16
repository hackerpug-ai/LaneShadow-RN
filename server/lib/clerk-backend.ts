import { createClerkClient } from '@clerk/backend'

const isTestOrVitest = process.env.NODE_ENV === 'test' || process.env.VITEST === 'true'
const CLERK_SECRET_KEY = isTestOrVitest
  ? (process.env.CLERK_SECRET_KEY ?? 'sk_test_test_secret')
  : (process.env.CLERK_SECRET_KEY ??
    (() => {
      throw new Error('Missing CLERK_SECRET_KEY')
    })())

export const clerkClient = createClerkClient({ secretKey: CLERK_SECRET_KEY })
