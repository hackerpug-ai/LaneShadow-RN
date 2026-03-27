/**
 * Tests for soft-delete mutation behavior in savedRoutes.ts
 *
 * These tests exercise the logic via extracted helper functions that can be
 * unit-tested without a running Convex backend.
 */

import {
  buildSoftDeletePatch,
  buildUndoPatch,
  shouldExcludeFromList,
} from '../savedRoutes'

describe('buildSoftDeletePatch', () => {
  it('AC-1: returns deletedAt and scheduledDeletionId patch', () => {
    const now = 1000000
    const scheduledId = 'sched_123'
    const patch = buildSoftDeletePatch(now, scheduledId)
    expect(patch.deletedAt).toBe(now)
    expect(patch.scheduledDeletionId).toBe(scheduledId)
  })
})

describe('buildUndoPatch', () => {
  it('AC-2: returns patch that clears deletedAt and scheduledDeletionId', () => {
    const patch = buildUndoPatch()
    expect(patch.deletedAt).toBeUndefined()
    expect(patch.scheduledDeletionId).toBeUndefined()
  })
})

describe('shouldExcludeFromList', () => {
  it('AC-5: excludes docs where deletedAt is set', () => {
    const deletedDoc = {
      _id: 'route_1',
      _creationTime: 1000,
      deletedAt: 999999,
    }
    expect(shouldExcludeFromList(deletedDoc)).toBe(true)
  })

  it('AC-5: includes docs where deletedAt is not set', () => {
    const activeDoc: { deletedAt?: number } = {
      _id: 'route_2',
      _creationTime: 1000,
    } as unknown as { deletedAt?: number }
    expect(shouldExcludeFromList(activeDoc)).toBe(false)
  })

  it('AC-5: includes docs where deletedAt is explicitly undefined', () => {
    const activeDoc: { deletedAt?: number } = {
      _id: 'route_3',
      _creationTime: 1000,
      deletedAt: undefined,
    } as unknown as { deletedAt?: number }
    expect(shouldExcludeFromList(activeDoc)).toBe(false)
  })
})

describe('soft-delete handler logic', () => {
  const makeDoc = (overrides: Record<string, unknown> = {}) => ({
    _id: 'route_abc',
    _creationTime: 1000,
    ownerType: 'user',
    ownerId: 'user_1',
    ...overrides,
  })

  it('AC-4: undoDeleteRoute throws NOT_FOUND when route does not exist', async () => {
    const ctx = {
      db: {
        get: jest.fn().mockResolvedValue(null),
        patch: jest.fn(),
      },
      scheduler: {
        cancel: jest.fn(),
      },
    }

    const { undoDeleteRouteHandler } = await import('../savedRoutes')
    await expect(
      undoDeleteRouteHandler(ctx as any, { savedRouteId: 'route_abc' as any }, 'user_1')
    ).rejects.toThrow('NOT_FOUND')
  })

  it('AC-2: undoDeleteRoute cancels scheduled deletion and clears deletedAt', async () => {
    const doc = makeDoc({
      deletedAt: Date.now() - 1000,
      scheduledDeletionId: 'sched_xyz',
    })
    const ctx = {
      db: {
        get: jest.fn().mockResolvedValue(doc),
        patch: jest.fn().mockResolvedValue(undefined),
      },
      scheduler: {
        cancel: jest.fn().mockResolvedValue(undefined),
      },
    }

    const { undoDeleteRouteHandler } = await import('../savedRoutes')
    await undoDeleteRouteHandler(ctx as any, { savedRouteId: 'route_abc' as any }, 'user_1')

    expect(ctx.scheduler.cancel).toHaveBeenCalledWith('sched_xyz')
    expect(ctx.db.patch).toHaveBeenCalledWith(
      'route_abc',
      expect.objectContaining({ deletedAt: undefined, scheduledDeletionId: undefined })
    )
  })

  it('AC-1: softDeleteRoute sets deletedAt and stores scheduledDeletionId', async () => {
    const doc = makeDoc()
    const scheduledId = 'sched_new'
    const ctx = {
      db: {
        get: jest.fn().mockResolvedValue(doc),
        patch: jest.fn().mockResolvedValue(undefined),
      },
      scheduler: {
        runAfter: jest.fn().mockResolvedValue(scheduledId),
      },
    }

    const { softDeleteRouteHandler } = await import('../savedRoutes')
    const result = await softDeleteRouteHandler(ctx as any, { savedRouteId: 'route_abc' as any }, 'user_1')

    expect(ctx.scheduler.runAfter).toHaveBeenCalledWith(
      5000,
      expect.anything(),
      { savedRouteId: 'route_abc' }
    )
    expect(ctx.db.patch).toHaveBeenCalledWith(
      'route_abc',
      expect.objectContaining({ scheduledDeletionId: scheduledId })
    )
    expect(result).toEqual({ scheduledDeletionId: scheduledId })
  })

  it('AC-3: permanentlyDeleteRoute deletes the document', async () => {
    const doc = makeDoc({ deletedAt: Date.now() - 6000 })
    const ctx = {
      db: {
        get: jest.fn().mockResolvedValue(doc),
        delete: jest.fn().mockResolvedValue(undefined),
      },
    }

    const { permanentlyDeleteRouteHandler } = await import('../savedRoutes')
    await permanentlyDeleteRouteHandler(ctx as any, { savedRouteId: 'route_abc' as any })

    expect(ctx.db.delete).toHaveBeenCalledWith('route_abc')
  })

  it('AC-3: permanentlyDeleteRoute is a no-op when route already deleted', async () => {
    const ctx = {
      db: {
        get: jest.fn().mockResolvedValue(null),
        delete: jest.fn(),
      },
    }

    const { permanentlyDeleteRouteHandler } = await import('../savedRoutes')
    await permanentlyDeleteRouteHandler(ctx as any, { savedRouteId: 'route_abc' as any })

    expect(ctx.db.delete).not.toHaveBeenCalled()
  })
})
