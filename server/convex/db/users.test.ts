import { describe, expect, it, vi } from 'vitest'
import type { Id } from '../_generated/dataModel'

vi.mock('../_generated/server', () => ({
  query: (_def: unknown) => _def,
  internalMutation: (_def: unknown) => _def,
  internalQuery: (_def: unknown) => _def,
}))

vi.mock('../guards', () => ({
  requireIdentity: vi.fn(),
}))

describe('getCurrentUser query', () => {
  it('AC-1/TC-1: returns authenticated user document via public query handler', async () => {
    const USER_ID = 'user_123' as Id<'users'>
    const clerkUserId = 'clerk_abc'
    const userDoc = {
      _id: USER_ID,
      _creationTime: 123,
      clerkUserId,
      email: 'test@example.com',
      name: 'Test User',
      createdAt: 1,
      updatedAt: 2,
      lastLocalUpdateAt: 3,
    }

    const unique = vi.fn().mockResolvedValue(userDoc)
    const withIndex = vi.fn().mockReturnValue({ unique })
    const query = vi.fn().mockReturnValue({ withIndex })
    const getUserIdentity = vi.fn().mockResolvedValue({ subject: clerkUserId })

    const ctx = {
      auth: {
        getUserIdentity,
      },
      db: {
        query,
      },
    }

    const usersModule = await import('./users.js')
    const getCurrentUserQuery = usersModule.getCurrentUser as unknown as {
      handler: (ctx: unknown, args: Record<string, never>) => Promise<unknown>
    }
    const result = await getCurrentUserQuery.handler(ctx as any, {})

    expect(result).toEqual(userDoc)
    expect(getUserIdentity).toHaveBeenCalledTimes(1)
    expect(query).toHaveBeenCalledWith('users')
    expect(withIndex).toHaveBeenCalledTimes(1)
    expect(unique).toHaveBeenCalledTimes(1)
  })

  it('AC-2/TC-2: returns null via public query handler when unauthenticated', async () => {
    const getUserIdentity = vi.fn().mockResolvedValue(null)
    const ctx = {
      auth: {
        getUserIdentity,
      },
      db: {
        query: vi.fn(),
      },
    }

    const usersModule = await import('./users.js')
    const getCurrentUserQuery = usersModule.getCurrentUser as unknown as {
      handler: (ctx: unknown, args: Record<string, never>) => Promise<unknown>
    }
    const result = await getCurrentUserQuery.handler(ctx as any, {})

    expect(result).toBeNull()
    expect(getUserIdentity).toHaveBeenCalledTimes(1)
    expect(ctx.db.query).not.toHaveBeenCalled()
  })
})
