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

describe('getCurrentUserHandler', () => {
  it('AC-1: returns authenticated user document', async () => {
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

    const ctx = {
      db: {
        query: vi.fn().mockReturnValue({
          withIndex: vi.fn().mockReturnValue({
            unique: vi.fn().mockResolvedValue(userDoc),
          }),
        }),
      },
    }

    const usersModule = await import('./users.js')
    const result = await usersModule.getCurrentUserHandler(ctx as any, clerkUserId)

    expect(result).toEqual(userDoc)
  })

  it('AC-2: returns null when unauthenticated', async () => {
    const ctx = {
      db: {
        query: vi.fn(),
      },
    }

    const usersModule = await import('./users.js')
    const result = await usersModule.getCurrentUserFromIdentityHandler(ctx as any, null)

    expect(result).toBeNull()
    expect(ctx.db.query).not.toHaveBeenCalled()
  })
})
