import { ConvexError } from 'convex/values'
import { describe, expect, it, vi } from 'vitest'

import {
  assertTestSubjectOrThrow,
  ensureSession,
  requireFounder,
  requireIdentity,
  requireOperator,
} from '../guards'

const makeCtx = (
  identity: Record<string, unknown> | null,
  userDoc?: Record<string, unknown> | null,
) => ({
  auth: {
    getUserIdentity: vi.fn().mockResolvedValue(identity),
  },
  runQuery: vi.fn(),
  runMutation: vi.fn(),
  db: {
    query: vi.fn().mockReturnValue({
      withIndex: vi.fn(
        (_indexName: string, cb: (q: { eq: ReturnType<typeof vi.fn> }) => unknown) => {
          cb({ eq: vi.fn() })
          return {
            unique: vi.fn().mockResolvedValue(userDoc ?? null),
          }
        },
      ),
    }),
  },
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
  it('AC-2: throws ConvexError with structured code UNAUTHENTICATED when no identity present', async () => {
    const ctx = makeCtx(null)
    try {
      await requireIdentity(ctx as any)
      expect.fail('Should have thrown ConvexError')
    } catch (err: any) {
      expect(err).toBeInstanceOf(ConvexError)
      expect(err.data.code).toBe('UNAUTHENTICATED')
      expect(err.data.message).toBeDefined()
    }
  })

  it('AC-US034-4: throws ConvexError when no identity present', async () => {
    const ctx = makeCtx(null)
    await expect(requireIdentity(ctx as any)).rejects.toThrow(ConvexError)
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

describe('requireFounder (REDHAT-FIX-06)', () => {
  it('rejects non-founder (rider role) with FORBIDDEN', async () => {
    const ctx = makeCtx(clerkIdentity, {
      clerkUserId: 'user_clerk123',
      email: 'rider@example.com',
      name: 'Test Rider',
      role: 'rider',
      createdAt: 1,
      updatedAt: 1,
      lastLocalUpdateAt: 1,
    })
    try {
      await requireFounder(ctx as any)
      expect.fail('Should have thrown ConvexError')
    } catch (err: any) {
      expect(err).toBeInstanceOf(ConvexError)
      expect(err.data.code).toBe('FORBIDDEN')
    }
  })

  it('rejects non-founder (operator role) with FORBIDDEN', async () => {
    const ctx = makeCtx(clerkIdentity, {
      clerkUserId: 'user_clerk123',
      email: 'rider@example.com',
      name: 'Test Rider',
      role: 'operator',
      createdAt: 1,
      updatedAt: 1,
      lastLocalUpdateAt: 1,
    })
    try {
      await requireFounder(ctx as any)
      expect.fail('Should have thrown ConvexError')
    } catch (err: any) {
      expect(err).toBeInstanceOf(ConvexError)
      expect(err.data.code).toBe('FORBIDDEN')
    }
  })

  it('allows founder role through', async () => {
    const ctx = makeCtx(clerkIdentity, {
      clerkUserId: 'user_clerk123',
      email: 'founder@example.com',
      name: 'Founder',
      role: 'founder',
      createdAt: 1,
      updatedAt: 1,
      lastLocalUpdateAt: 1,
    })
    const result = await requireFounder(ctx as any)
    expect(result.clerkUserId).toBe('user_clerk123')
    expect(result.role).toBe('founder')
  })

  it('rejects unauthenticated caller with UNAUTHENTICATED', async () => {
    const ctx = makeCtx(null)
    try {
      await requireFounder(ctx as any)
      expect.fail('Should have thrown')
    } catch (err: any) {
      expect(err.data.code).toBe('UNAUTHENTICATED')
    }
  })
})

describe('requireOperator (REDHAT-FIX-06)', () => {
  it('rejects non-operator (rider role) with FORBIDDEN', async () => {
    const ctx = makeCtx(clerkIdentity, {
      clerkUserId: 'user_clerk123',
      email: 'rider@example.com',
      name: 'Test Rider',
      role: 'rider',
      createdAt: 1,
      updatedAt: 1,
      lastLocalUpdateAt: 1,
    })
    try {
      await requireOperator(ctx as any)
      expect.fail('Should have thrown ConvexError')
    } catch (err: any) {
      expect(err).toBeInstanceOf(ConvexError)
      expect(err.data.code).toBe('FORBIDDEN')
    }
  })

  it('allows founder role through (founder is also operator)', async () => {
    const ctx = makeCtx(clerkIdentity, {
      clerkUserId: 'user_clerk123',
      email: 'founder@example.com',
      name: 'Founder',
      role: 'founder',
      createdAt: 1,
      updatedAt: 1,
      lastLocalUpdateAt: 1,
    })
    const result = await requireOperator(ctx as any)
    expect(result.clerkUserId).toBe('user_clerk123')
    expect(result.role).toBe('founder')
  })

  it('allows operator role through', async () => {
    const ctx = makeCtx(clerkIdentity, {
      clerkUserId: 'user_clerk123',
      email: 'op@example.com',
      name: 'Operator',
      role: 'operator',
      createdAt: 1,
      updatedAt: 1,
      lastLocalUpdateAt: 1,
    })
    const result = await requireOperator(ctx as any)
    expect(result.clerkUserId).toBe('user_clerk123')
    expect(result.role).toBe('operator')
  })

  it('rejects unauthenticated caller with UNAUTHENTICATED', async () => {
    const ctx = makeCtx(null)
    try {
      await requireOperator(ctx as any)
      expect.fail('Should have thrown')
    } catch (err: any) {
      expect(err.data.code).toBe('UNAUTHENTICATED')
    }
  })
})

describe('assertTestSubjectOrThrow (REDHAT-FIX-01)', () => {
  it('allows s4t5- prefix (test suite identity)', () => {
    expect(() => assertTestSubjectOrThrow('s4t5-waterfall-lever-order')).not.toThrow()
  })
  it('allows test: prefix', () => {
    expect(() => assertTestSubjectOrThrow('test:lever3-fail')).not.toThrow()
  })
  it('allows dev- prefix', () => {
    expect(() => assertTestSubjectOrThrow('dev-something')).not.toThrow()
  })
  it('rejects the production closeout subject s4-human-gate with FORBIDDEN', () => {
    try {
      assertTestSubjectOrThrow('s4-human-gate')
      expect.fail('Should have thrown ConvexError')
    } catch (err: any) {
      expect(err).toBeInstanceOf(ConvexError)
      expect(err.data.code).toBe('FORBIDDEN')
    }
  })
  it('rejects a real Clerk user subject with FORBIDDEN', () => {
    try {
      assertTestSubjectOrThrow('user_clerk123')
      expect.fail('Should have thrown')
    } catch (err: any) {
      expect(err).toBeInstanceOf(ConvexError)
      expect(err.data.code).toBe('FORBIDDEN')
    }
  })
})
