import { ConvexError } from 'convex/values'
import { describe, expect, it, vi } from 'vitest'

import { deleteById } from '../savedRoutes'

const makeCtx = (doc: Record<string, unknown> | null = null) => ({
  db: {
    get: vi.fn().mockResolvedValue(doc),
    delete: vi.fn().mockResolvedValue(undefined),
  },
  auth: {
    getUserIdentity: vi.fn().mockResolvedValue({ subject: 'user_123' }),
  },
  runQuery: vi.fn(),
  runMutation: vi.fn(),
})

const SAVED_ROUTE_ID = 'saved_routes_id_abc123' as any

const makeDoc = () => ({
  _id: SAVED_ROUTE_ID,
  _creationTime: 1000,
  ownerType: 'user',
  ownerId: 'user_123',
  name: 'My Route',
  createdAt: 1000,
  updatedAt: 1000,
})

describe('deleteById not-found', () => {
  it('AC-US034-2: throws ConvexError("Route not found") when doc does not exist', async () => {
    const ctx = makeCtx(null)
    await expect(
      (deleteById as any).handler(ctx, { savedRouteId: SAVED_ROUTE_ID }),
    ).rejects.toThrow(ConvexError)
    await expect(
      (deleteById as any).handler(ctx, { savedRouteId: SAVED_ROUTE_ID }),
    ).rejects.toThrow('Route not found')
  })

  it('AC-US034-2: throws ConvexError("Route not found") when doc is owned by different user', async () => {
    const ctx = makeCtx({ ...makeDoc(), ownerId: 'other_user' })
    await expect(
      (deleteById as any).handler(ctx, { savedRouteId: SAVED_ROUTE_ID }),
    ).rejects.toThrow(ConvexError)
    await expect(
      (deleteById as any).handler(ctx, { savedRouteId: SAVED_ROUTE_ID }),
    ).rejects.toThrow('Route not found')
  })
})

describe('deleteById happy path', () => {
  it('deletes the document when owned by the viewer', async () => {
    const ctx = makeCtx(makeDoc())
    await (deleteById as any).handler(ctx, { savedRouteId: SAVED_ROUTE_ID })
    expect(ctx.db.delete).toHaveBeenCalledWith(SAVED_ROUTE_ID)
  })
})
