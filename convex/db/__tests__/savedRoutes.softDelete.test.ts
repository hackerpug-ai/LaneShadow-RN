/**
 * Tests for soft-delete mutation behavior in savedRoutes.ts
 *
 * These tests exercise the logic via extracted helper functions that can be
 * unit-tested without a running Convex backend.
 */

import { ConvexError } from 'convex/values'

import type { Id } from '../../_generated/dataModel'
import {
  buildSoftDeletePatch,
  buildUndoPatch,
  shouldExcludeFromList,
} from '../savedRoutes'

describe('buildSoftDeletePatch', () => {
  it('AC-1: returns deletedAt and scheduledDeletionId patch', () => {
    const now = 1000000
    const scheduledId = 'sched_123' as Id<'_scheduled_functions'>
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

  it('AC-4: undoDeleteRoute throws ConvexError when route does not exist', async () => {
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
    ).rejects.toThrow(ConvexError)
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

describe('soft-delete race condition guards', () => {
  const makeDoc = (overrides: Record<string, unknown> = {}) => ({
    _id: 'route_abc',
    _creationTime: 1000,
    ownerType: 'user',
    ownerId: 'user_1',
    ...overrides,
  })

  it('RC-1: softDeleteRoute called on already soft-deleted route returns existing scheduledDeletionId without scheduling again', async () => {
    const existingScheduledId = 'sched_existing' as Id<'_scheduled_functions'>
    const doc = makeDoc({
      deletedAt: Date.now() - 1000,
      scheduledDeletionId: existingScheduledId,
    })
    const ctx = {
      db: {
        get: jest.fn().mockResolvedValue(doc),
        patch: jest.fn(),
      },
      scheduler: {
        runAfter: jest.fn(),
      },
    }

    const { softDeleteRouteHandler } = await import('../savedRoutes')
    const result = await softDeleteRouteHandler(ctx as any, { savedRouteId: 'route_abc' as any }, 'user_1')

    expect(ctx.scheduler.runAfter).not.toHaveBeenCalled()
    expect(ctx.db.patch).not.toHaveBeenCalled()
    expect(result).toEqual({ scheduledDeletionId: existingScheduledId })
  })

  it('RC-2: permanentlyDeleteRoute after undo (deletedAt cleared) does NOT delete route', async () => {
    const doc = makeDoc()
    const ctx = {
      db: {
        get: jest.fn().mockResolvedValue(doc),
        delete: jest.fn(),
      },
    }

    const { permanentlyDeleteRouteHandler } = await import('../savedRoutes')
    const result = await permanentlyDeleteRouteHandler(ctx as any, { savedRouteId: 'route_abc' as any })

    expect(ctx.db.delete).not.toHaveBeenCalled()
    expect(result).toBeNull()
  })

  it('RC-3: permanentlyDeleteRoute with deletedAt still set permanently deletes the route', async () => {
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

  it('RC-4: softDeleteRoute normal flow sets deletedAt schedules deletion and returns ID', async () => {
    const doc = makeDoc()
    const scheduledId = 'sched_new' as Id<'_scheduled_functions'>
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

    expect(ctx.scheduler.runAfter).toHaveBeenCalledWith(5000, expect.anything(), { savedRouteId: 'route_abc' })
    expect(ctx.db.patch).toHaveBeenCalledWith('route_abc', expect.objectContaining({ scheduledDeletionId: scheduledId }))
    expect(result).toEqual({ scheduledDeletionId: scheduledId })
  })
})
