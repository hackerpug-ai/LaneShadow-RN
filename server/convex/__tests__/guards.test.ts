import { ConvexError } from 'convex/values'
import { describe, expect, it, vi } from 'vitest'

import { ensureSession, requireIdentity } from '../guards'

const makeCtx = (identity: Record<string, unknown> | null) => ({
  auth: {
    getUserIdentity: vi.fn().mockResolvedValue(identity),
  },
  runQuery: vi.fn(),
  runMutation: vi.fn(),
})

const clerkIdentity = {
  subject: 'user_clerk123',
  tokenIdentifier: 'tok_xyz',
  email: 'rider@example.com',
  name: 'Test Rider',
  given_name: 'Test',
  family_name: 'Rider',
}

const fakeSession = {
  user: {
    _id: 'users:abc' as any,
    clerkUserId: 'user_clerk123',
    email: 'rider@example.com',
    name: 'Test Rider',
    createdAt: 1,
    updatedAt: 1,
    lastLocalUpdateAt: 1,
  },
}

describe('ensureSession', () => {
  it('AC-1: returns session immediately when user already exists in DB', async () => {
    const ctx = makeCtx(clerkIdentity)
    ctx.runQuery.mockResolvedValue(fakeSession)

    const result = await ensureSession(ctx as any)

    expect(result).toEqual(fakeSession)
    expect(ctx.runMutation).not.toHaveBeenCalled()
  })

  it('AC-2: calls upsertCurrent and re-queries when DB returns null on first query', async () => {
    const ctx = makeCtx(clerkIdentity)
    ctx.runQuery.mockResolvedValueOnce(null).mockResolvedValueOnce(fakeSession)
    ctx.runMutation.mockResolvedValue({ userId: 'users:abc' })

    const result = await ensureSession(ctx as any)

    expect(ctx.runMutation).toHaveBeenCalledTimes(1)
    expect(ctx.runMutation).toHaveBeenCalledWith(expect.anything(), {
      clerkUserId: 'user_clerk123',
      email: 'rider@example.com',
      name: 'Test Rider',
    })
    expect(result).toEqual(fakeSession)
  })

  it('AC-3: throws a proper error when session is still null after upsert', async () => {
    const ctx = makeCtx(clerkIdentity)
    ctx.runQuery.mockResolvedValue(null)
    ctx.runMutation.mockResolvedValue({ userId: 'users:abc' })

    await expect(ensureSession(ctx as any)).rejects.toThrow('SESSION_REQUIRED')
  })
})

describe('requireIdentity', () => {
  it('AC-US034-4: throws ConvexError when no identity present', async () => {
    const ctx = makeCtx(null)
    await expect(requireIdentity(ctx as any)).rejects.toThrow(ConvexError)
    await expect(requireIdentity(ctx as any)).rejects.toThrow('Authentication required')
  })

  it('returns clerkUserId and tokenIdentifier when identity is present', async () => {
    const ctx = makeCtx({ subject: 'user_abc', tokenIdentifier: 'tok_xyz' })
    const result = await requireIdentity(ctx as any)
    expect(result.clerkUserId).toBe('user_abc')
    expect(result.tokenIdentifier).toBe('tok_xyz')
  })

  it('returns null tokenIdentifier when not set', async () => {
    const ctx = makeCtx({ subject: 'user_abc' })
    const result = await requireIdentity(ctx as any)
    expect(result.clerkUserId).toBe('user_abc')
    expect(result.tokenIdentifier).toBeNull()
  })
})
