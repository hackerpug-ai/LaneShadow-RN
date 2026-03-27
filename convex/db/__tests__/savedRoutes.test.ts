import { ConvexError } from 'convex/values'

import { insert } from '../savedRoutes'

const makeCtx = () => ({
  db: {
    get: jest.fn(),
    insert: jest.fn().mockResolvedValue('saved_routes_id_new123'),
    patch: jest.fn().mockResolvedValue(undefined),
  },
  auth: {
    getUserIdentity: jest.fn().mockResolvedValue({ subject: 'user_123' }),
  },
  runQuery: jest.fn(),
  runMutation: jest.fn(),
})

const baseArgs = {
  name: 'My Route',
  planInput: {
    start: { label: 'A', coordinates: { lat: 0, lng: 0 } },
    end: { label: 'B', coordinates: { lat: 1, lng: 1 } },
    waypoints: [],
    travelMode: 'DRIVE' as const,
  },
  routeSnapshot: {
    legs: [],
    bounds: { northeast: { lat: 1, lng: 1 }, southwest: { lat: 0, lng: 0 } },
  },
  routeIndex: { polyline: '' },
  snapshotMeta: { fetchedAt: 1000 },
}

describe('insert name validation', () => {
  it('AC-1: throws ConvexError for whitespace-only name', async () => {
    const ctx = makeCtx()
    await expect(
      (insert as any).handler(ctx, { ...baseArgs, name: '   ' })
    ).rejects.toThrow(ConvexError)
    await expect(
      (insert as any).handler(ctx, { ...baseArgs, name: '   ' })
    ).rejects.toThrow('Route name cannot be empty')
  })

  it('AC-2: throws ConvexError for name over 100 characters', async () => {
    const ctx = makeCtx()
    const longName = 'a'.repeat(101)
    await expect(
      (insert as any).handler(ctx, { ...baseArgs, name: longName })
    ).rejects.toThrow(ConvexError)
    await expect(
      (insert as any).handler(ctx, { ...baseArgs, name: longName })
    ).rejects.toThrow('Route name must be 100 characters or less')
  })

  it('AC-3: trims name before inserting', async () => {
    const ctx = makeCtx()
    await (insert as any).handler(ctx, { ...baseArgs, name: '  My Route  ' })
    expect(ctx.db.insert).toHaveBeenCalledWith(
      'saved_routes',
      expect.objectContaining({ name: 'My Route' })
    )
  })

  it('AC-4: accepts valid 100-character name', async () => {
    const ctx = makeCtx()
    const validName = 'a'.repeat(100)
    await expect(
      (insert as any).handler(ctx, { ...baseArgs, name: validName })
    ).resolves.toEqual({ savedRouteId: 'saved_routes_id_new123' })
  })
})
