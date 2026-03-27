import { ConvexError } from 'convex/values'

import { requireIdentity } from '../guards'

const makeCtx = (identity: Record<string, unknown> | null) => ({
  auth: {
    getUserIdentity: jest.fn().mockResolvedValue(identity),
  },
  runQuery: jest.fn(),
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
