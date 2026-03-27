import { ConvexError } from 'convex/values'

import { insertHandler } from '../savedRoutes'

const CLERK_USER_ID = 'user_123'

const makeCtx = () => ({
  db: {
    get: jest.fn(),
    insert: jest.fn().mockResolvedValue('saved_routes_id_new123'),
    patch: jest.fn().mockResolvedValue(undefined),
  },
  auth: {
    getUserIdentity: jest.fn().mockResolvedValue({ subject: CLERK_USER_ID }),
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
      insertHandler(ctx as any, { ...baseArgs, name: '   ' }, CLERK_USER_ID)
    ).rejects.toThrow(ConvexError)
    await expect(
      insertHandler(ctx as any, { ...baseArgs, name: '   ' }, CLERK_USER_ID)
    ).rejects.toThrow('Route name cannot be empty')
  })

  it('AC-2: throws ConvexError for name over 100 characters', async () => {
    const ctx = makeCtx()
    const longName = 'a'.repeat(101)
    await expect(
      insertHandler(ctx as any, { ...baseArgs, name: longName }, CLERK_USER_ID)
    ).rejects.toThrow(ConvexError)
    await expect(
      insertHandler(ctx as any, { ...baseArgs, name: longName }, CLERK_USER_ID)
    ).rejects.toThrow('Route name must be 100 characters or less')
  })

  it('AC-3: trims name before inserting', async () => {
    const ctx = makeCtx()
    await insertHandler(ctx as any, { ...baseArgs, name: '  My Route  ' }, CLERK_USER_ID)
    expect(ctx.db.insert).toHaveBeenCalledWith(
      'saved_routes',
      expect.objectContaining({ name: 'My Route' })
    )
  })

  it('AC-4: accepts valid 100-character name', async () => {
    const ctx = makeCtx()
    const validName = 'a'.repeat(100)
    await expect(
      insertHandler(ctx as any, { ...baseArgs, name: validName }, CLERK_USER_ID)
    ).resolves.toEqual({ savedRouteId: 'saved_routes_id_new123' })
  })
})
