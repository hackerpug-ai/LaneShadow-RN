import { ConvexError } from 'convex/values'

import { patchName } from '../savedRoutes'

const makeCtx = (doc: Record<string, unknown> | null = null) => ({
  db: {
    get: jest.fn().mockResolvedValue(doc),
    patch: jest.fn().mockResolvedValue(undefined),
  },
  auth: {
    getUserIdentity: jest.fn().mockResolvedValue({ subject: 'user_123' }),
  },
  runQuery: jest.fn(),
  runMutation: jest.fn(),
})

const SAVED_ROUTE_ID = 'saved_routes_id_abc123' as any

const makeDoc = () => ({
  _id: SAVED_ROUTE_ID,
  _creationTime: 1000,
  ownerType: 'user',
  ownerId: 'user_123',
  name: 'Old Name',
  createdAt: 1000,
  updatedAt: 1000,
})

describe('patchName validation', () => {
  it('AC-1: trims whitespace from name before saving', async () => {
    const ctx = makeCtx(makeDoc())
    await (patchName as any).handler(ctx, {
      savedRouteId: SAVED_ROUTE_ID,
      name: '  Morning Ride  ',
    })
    expect(ctx.db.patch).toHaveBeenCalledWith(
      SAVED_ROUTE_ID,
      expect.objectContaining({ name: 'Morning Ride' })
    )
  })

  it('AC-2: throws ConvexError for empty string name', async () => {
    const ctx = makeCtx(makeDoc())
    await expect(
      (patchName as any).handler(ctx, {
        savedRouteId: SAVED_ROUTE_ID,
        name: '',
      })
    ).rejects.toThrow(ConvexError)
    await expect(
      (patchName as any).handler(ctx, {
        savedRouteId: SAVED_ROUTE_ID,
        name: '',
      })
    ).rejects.toThrow('Route name cannot be empty')
  })

  it('AC-3: throws ConvexError for whitespace-only name', async () => {
    const ctx = makeCtx(makeDoc())
    await expect(
      (patchName as any).handler(ctx, {
        savedRouteId: SAVED_ROUTE_ID,
        name: '   ',
      })
    ).rejects.toThrow(ConvexError)
    await expect(
      (patchName as any).handler(ctx, {
        savedRouteId: SAVED_ROUTE_ID,
        name: '   ',
      })
    ).rejects.toThrow('Route name cannot be empty')
  })

  it('AC-4: throws ConvexError for name exceeding 100 characters', async () => {
    const ctx = makeCtx(makeDoc())
    const longName = 'a'.repeat(101)
    await expect(
      (patchName as any).handler(ctx, {
        savedRouteId: SAVED_ROUTE_ID,
        name: longName,
      })
    ).rejects.toThrow(ConvexError)
    await expect(
      (patchName as any).handler(ctx, {
        savedRouteId: SAVED_ROUTE_ID,
        name: longName,
      })
    ).rejects.toThrow('Route name must be 100 characters or less')
  })
})
