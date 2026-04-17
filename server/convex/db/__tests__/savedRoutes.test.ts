import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { ConvexError } from 'convex/values'

import { insertHandler } from '../savedRoutes'

const CLERK_USER_ID = 'user_123'

const makeCtx = () => ({
  db: {
    get: vi.fn(),
    insert: vi.fn().mockResolvedValue('saved_routes_id_new123'),
    patch: vi.fn().mockResolvedValue(undefined),
  },
  auth: {
    getUserIdentity: vi.fn().mockResolvedValue({ subject: CLERK_USER_ID }),
  },
  runQuery: vi.fn(),
  runMutation: vi.fn(),
})

const baseArgs = {
  name: 'My Route',
  planInput: {
    start: { lat: 0, lng: 0, label: 'A' },
    end: { lat: 1, lng: 1, label: 'B' },
    departureTime: Date.now(),
    preferences: { scenicBias: 'default' as const },
  },
  routeSnapshot: {
    provider: 'test',
    bounds: { north: 1, south: 0, east: 1, west: 0 },
    origin: { lat: 0, lng: 0, label: 'A' },
    destination: { lat: 1, lng: 1, label: 'B' },
    waypoints: [],
    overviewGeometry: {
      format: 'polyline' as const,
      encoding: 'utf8',
      precision: 5,
      value: 'test',
    },
    legs: [],
    annotations: [],
    overlays: {},
  },
  routeIndex: {
    routeFingerprint: 'test-fingerprint',
    sampledPoints: [],
  },
  snapshotMeta: {
    savedAt: 1000,
    routingProvider: 'test',
    conditionsStatus: 'ok',
    metaVersion: 1,
    overlays: {},
  },
}

describe('insert name validation', () => {
  it('AC-1: throws ConvexError for whitespace-only name', async () => {
    const ctx = makeCtx()
    await expect(
      insertHandler(ctx as any, { ...baseArgs, name: '   ' } as any, CLERK_USER_ID)
    ).rejects.toThrow(ConvexError)
    await expect(
      insertHandler(ctx as any, { ...baseArgs, name: '   ' } as any, CLERK_USER_ID)
    ).rejects.toThrow('Route name cannot be empty')
  })

  it('AC-2: throws ConvexError for name over 100 characters', async () => {
    const ctx = makeCtx()
    const longName = 'a'.repeat(101)
    await expect(
      insertHandler(ctx as any, { ...baseArgs, name: longName } as any, CLERK_USER_ID)
    ).rejects.toThrow(ConvexError)
    await expect(
      insertHandler(ctx as any, { ...baseArgs, name: longName } as any, CLERK_USER_ID)
    ).rejects.toThrow('Route name must be 100 characters or less')
  })

  it('AC-3: trims name before inserting', async () => {
    const ctx = makeCtx()
    await insertHandler(ctx as any, { ...baseArgs, name: '  My Route  ' } as any, CLERK_USER_ID)
    expect(ctx.db.insert).toHaveBeenCalledWith(
      'saved_routes',
      expect.objectContaining({ name: 'My Route' })
    )
  })

  it('AC-4: accepts valid 100-character name', async () => {
    const ctx = makeCtx()
    const validName = 'a'.repeat(100)
    await expect(
      insertHandler(ctx as any, { ...baseArgs, name: validName } as any, CLERK_USER_ID)
    ).resolves.toEqual({ savedRouteId: 'saved_routes_id_new123' })
  })
})
