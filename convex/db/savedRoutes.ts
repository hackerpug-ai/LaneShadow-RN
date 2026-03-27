import { ConvexError, v } from 'convex/values'

import {
  OWNER_TYPE,
  VISIBILITY,
  planInputValidator,
  routeIndexValidator,
  routePreviewValidator,
  routeSnapshotValidator,
  savedRouteCapabilitiesValidator,
  savedRouteValidator,
  snapshotMetaValidator,
  type SavedRoute,
} from '../../models/saved-routes'
import type { SavedRouteDetailView, SavedRoutesListView } from '../../types/routes'
import { internal } from '../_generated/api'
import type { Doc, Id } from '../_generated/dataModel'
import { internalMutation, internalQuery, mutation, query } from '../_generated/server'
import { requireIdentity } from '../guards'
import { applyDateFilter, applySearchFilter } from './savedRoutes.utils'

type SavedRouteDoc = Doc<'saved_routes'>

const isOwnedByViewer = (doc: SavedRouteDoc, clerkUserId: string): boolean => {
  return doc.ownerType === OWNER_TYPE.USER && doc.ownerId === clerkUserId
}

// ---------------------------------------------------------------------------
// Exported pure helpers (also used in tests)
// ---------------------------------------------------------------------------

export const buildSoftDeletePatch = (
  deletedAt: number,
  scheduledDeletionId: Id<'_scheduled_functions'>
): { deletedAt: number; scheduledDeletionId: Id<'_scheduled_functions'> } => ({
  deletedAt,
  scheduledDeletionId,
})

export const buildUndoPatch = (): {
  deletedAt: undefined
  scheduledDeletionId: undefined
} => ({
  deletedAt: undefined,
  scheduledDeletionId: undefined,
})

export const shouldExcludeFromList = (doc: {
  deletedAt?: number | undefined
}): boolean => doc.deletedAt !== undefined && doc.deletedAt !== null

// ---------------------------------------------------------------------------
// Exported handler functions (testable without Convex runtime)
// ---------------------------------------------------------------------------

type SoftDeleteCtx = {
  db: { get: (id: string) => Promise<SavedRouteDoc | null>; patch: (id: string, fields: object) => Promise<void> }
  scheduler: { runAfter: (ms: number, fn: unknown, args: object) => Promise<Id<'_scheduled_functions'>> }
}

export const softDeleteRouteHandler = async (
  ctx: SoftDeleteCtx,
  args: { savedRouteId: Id<'saved_routes'> },
  clerkUserId: string
): Promise<{ scheduledDeletionId: Id<'_scheduled_functions'> }> => {
  const doc = await ctx.db.get(args.savedRouteId)
  if (!doc || !isOwnedByViewer(doc as SavedRouteDoc, clerkUserId)) {
    throw new ConvexError('Route not found')
  }

  if (doc.deletedAt !== undefined) {
    if (!doc.scheduledDeletionId) {
      throw new ConvexError('Route is in an inconsistent state: soft-deleted without scheduledDeletionId')
    }
    return { scheduledDeletionId: doc.scheduledDeletionId }
  }

  const scheduledDeletionId = await ctx.scheduler.runAfter(
    5000,
    internalSavedRoutes.permanentlyDeleteRoute,
    { savedRouteId: args.savedRouteId }
  )

  await ctx.db.patch(args.savedRouteId, buildSoftDeletePatch(Date.now(), scheduledDeletionId))
  return { scheduledDeletionId }
}

type UndoDeleteCtx = {
  db: { get: (id: string) => Promise<SavedRouteDoc | null>; patch: (id: string, fields: object) => Promise<void> }
  scheduler: { cancel: (id: string) => Promise<void> }
}

export const undoDeleteRouteHandler = async (
  ctx: UndoDeleteCtx,
  args: { savedRouteId: Id<'saved_routes'> },
  clerkUserId: string
): Promise<null> => {
  const doc = await ctx.db.get(args.savedRouteId)
  if (!doc || !isOwnedByViewer(doc as SavedRouteDoc, clerkUserId)) {
    throw new ConvexError('Route not found')
  }

  if (doc.scheduledDeletionId) {
    await ctx.scheduler.cancel(doc.scheduledDeletionId)
  }

  await ctx.db.patch(args.savedRouteId, buildUndoPatch())
  return null
}

type PermanentlyDeleteCtx = {
  db: { get: (id: string) => Promise<SavedRouteDoc | null>; delete: (id: string) => Promise<void> }
}

export const permanentlyDeleteRouteHandler = async (
  ctx: PermanentlyDeleteCtx,
  args: { savedRouteId: Id<'saved_routes'> }
): Promise<null> => {
  const doc = await ctx.db.get(args.savedRouteId)
  if (!doc) {
    return null
  }
  if (doc.deletedAt === undefined) {
    return null
  }
  await ctx.db.delete(args.savedRouteId)
  return null
}

const stripSystemFields = (doc: SavedRouteDoc) => {
  const { _id, _creationTime, ...savedRoute } = doc
  return savedRoute
}

const MAX_LIST_LIMIT = 50

const defaultCapabilities = {
  canRead: true,
  canRename: true,
  canDelete: true,
}

const computePreview = (savedRoute: SavedRoute) => {
  const distanceMeters = savedRoute.routeSnapshot.legs.reduce(
    (total, leg) => total + leg.distanceMeters,
    0
  )
  const durationSeconds = savedRoute.routeSnapshot.legs.reduce(
    (total, leg) => total + leg.durationSeconds,
    0
  )

  return {
    bounds: savedRoute.routeSnapshot.bounds,
    distanceMeters,
    durationSeconds,
  }
}
// When calling functions defined in the same module, route through a local reference
// and add explicit result typing to avoid Convex/TS circular inference issues.
const internalSavedRoutes = (internal as any).db.savedRoutes

export const getById = internalQuery({
  args: { savedRouteId: v.id('saved_routes') },
  returns: v.union(savedRouteValidator, v.null()),
  handler: async (ctx, args) => {
    const { clerkUserId } = await requireIdentity(ctx)
    const doc = await ctx.db.get(args.savedRouteId)
    if (!doc || !isOwnedByViewer(doc, clerkUserId)) {
      return null
    }
    return stripSystemFields(doc)
  },
})

export const listByOwner = internalQuery({
  args: {
    limit: v.optional(v.number()),
    searchQuery: v.optional(v.string()),
    afterDate: v.optional(v.number()),
    beforeDate: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      savedRouteId: v.id('saved_routes'),
      savedRoute: savedRouteValidator,
    })
  ),
  handler: async (ctx, { limit, searchQuery, afterDate, beforeDate }) => {
    const { clerkUserId } = await requireIdentity(ctx)

    const query = ctx.db
      .query('saved_routes')
      .withIndex('by_ownerType_and_ownerId', (q) =>
        q.eq('ownerType', OWNER_TYPE.USER).eq('ownerId', clerkUserId)
      )
      .order('desc')

    const allRows = await query.collect()

    const mapped = allRows
      .filter((doc) => !shouldExcludeFromList(doc as { deletedAt?: number }))
      .map((doc) => ({
        savedRouteId: doc._id,
        savedRoute: stripSystemFields(doc),
        name: doc.name,
        createdAt: doc.createdAt,
      }))

    const nameFiltered = applySearchFilter(mapped, searchQuery)
    const dateFiltered = applyDateFilter(nameFiltered, afterDate, beforeDate)
    const sliced = limit ? dateFiltered.slice(0, limit) : dateFiltered
    return sliced.map(({ savedRouteId, savedRoute }) => ({ savedRouteId, savedRoute }))
  },
})

export const insert = internalMutation({
  args: {
    name: v.string(),
    planInput: planInputValidator,
    routeSnapshot: routeSnapshotValidator,
    routeIndex: routeIndexValidator,
    snapshotMeta: snapshotMetaValidator,
  },
  returns: v.object({ savedRouteId: v.id('saved_routes') }),
  handler: async (ctx, args) => {
    const { clerkUserId } = await requireIdentity(ctx)

    const trimmed = args.name.trim()
    if (trimmed.length === 0) {
      throw new ConvexError('Route name cannot be empty')
    }
    if (trimmed.length > 100) {
      throw new ConvexError('Route name must be 100 characters or less')
    }

    const now = Date.now()

    const savedRouteId: Id<'saved_routes'> = await ctx.db.insert('saved_routes', {
      ownerType: OWNER_TYPE.USER,
      ownerId: clerkUserId,
      createdByUserId: clerkUserId,
      visibility: VISIBILITY.PRIVATE,
      name: trimmed,
      planInput: args.planInput,
      routeSnapshot: args.routeSnapshot,
      routeIndex: args.routeIndex,
      snapshotMeta: args.snapshotMeta,
      createdAt: now,
      updatedAt: now,
    })

    return { savedRouteId }
  },
})

export const patchName = internalMutation({
  args: { savedRouteId: v.id('saved_routes'), name: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { clerkUserId } = await requireIdentity(ctx)
    const doc = await ctx.db.get(args.savedRouteId)

    if (!doc || !isOwnedByViewer(doc, clerkUserId)) {
      throw new ConvexError('Route not found')
    }

    const trimmed = args.name.trim()
    if (trimmed.length === 0) {
      throw new ConvexError('Route name cannot be empty')
    }
    if (trimmed.length > 100) {
      throw new ConvexError('Route name must be 100 characters or less')
    }

    await ctx.db.patch(doc._id, { name: trimmed, updatedAt: Date.now() })
    return null
  },
})

export const deleteById = internalMutation({
  args: { savedRouteId: v.id('saved_routes') },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { clerkUserId } = await requireIdentity(ctx)
    const doc = await ctx.db.get(args.savedRouteId)

    if (!doc || !isOwnedByViewer(doc, clerkUserId)) {
      throw new ConvexError('Route not found')
    }

    await ctx.db.delete(doc._id)
    return null
  },
})

export const getSavedRoutesList = query({
  args: {
    limit: v.optional(v.number()),
    searchQuery: v.optional(v.string()),
    afterDate: v.optional(v.number()),
    beforeDate: v.optional(v.number()),
  },
  returns: v.object({
    routes: v.array(
      v.object({
        savedRouteId: v.string(),
        name: v.string(),
        startLabel: v.string(),
        endLabel: v.string(),
        createdAt: v.number(),
        updatedAt: v.number(),
        preview: routePreviewValidator,
        capabilities: savedRouteCapabilitiesValidator,
      })
    ),
  }),
  handler: async (ctx, { limit, searchQuery, afterDate, beforeDate }): Promise<SavedRoutesListView> => {
    await requireIdentity(ctx)
    const boundedLimit =
      limit && Number.isFinite(limit)
        ? Math.min(Math.max(limit, 1), MAX_LIST_LIMIT)
        : MAX_LIST_LIMIT

    const results: Array<{
      savedRouteId: Id<'saved_routes'>
      savedRoute: SavedRoute
    }> = await ctx.runQuery(internalSavedRoutes.listByOwner, {
      limit: boundedLimit,
      searchQuery,
      afterDate,
      beforeDate,
    })

    return {
      routes: results.map(({ savedRouteId, savedRoute }) => ({
        savedRouteId: `${savedRouteId}`,
        name: savedRoute.name,
        startLabel: savedRoute.planInput.start?.label ?? '',
        endLabel: savedRoute.planInput.end?.label ?? '',
        createdAt: savedRoute.createdAt,
        updatedAt: savedRoute.updatedAt,
        preview: computePreview(savedRoute),
        capabilities: defaultCapabilities,
      })),
    }
  },
})

const savedRouteDetailViewValidator = v.object({
  savedRouteId: v.string(),
  name: v.string(),
  planInput: planInputValidator,
  routeSnapshot: routeSnapshotValidator,
  routeIndex: routeIndexValidator,
  snapshotMeta: snapshotMetaValidator,
  capabilities: savedRouteCapabilitiesValidator,
})

export const getSavedRouteDetail = query({
  args: { savedRouteId: v.id('saved_routes') },
  returns: v.union(savedRouteDetailViewValidator, v.null()),
  handler: async (ctx, { savedRouteId }): Promise<SavedRouteDetailView | null> => {
    await requireIdentity(ctx)
    const savedRoute: SavedRoute | null = await ctx.runQuery(internalSavedRoutes.getById, {
      savedRouteId,
    })

    if (!savedRoute) {
      return null
    }

    return {
      savedRouteId: `${savedRouteId}`,
      name: savedRoute.name,
      planInput: savedRoute.planInput,
      routeSnapshot: savedRoute.routeSnapshot,
      routeIndex: savedRoute.routeIndex,
      snapshotMeta: savedRoute.snapshotMeta,
      capabilities: defaultCapabilities,
    }
  },
})

export const saveRoute = mutation({
  args: {
    name: v.string(),
    planInput: planInputValidator,
    routeSnapshot: routeSnapshotValidator,
    routeIndex: routeIndexValidator,
    snapshotMeta: snapshotMetaValidator,
  },
  returns: v.object({ savedRouteId: v.string() }),
  handler: async (
    ctx,
    args
  ): Promise<{
    savedRouteId: string
  }> => {
    await requireIdentity(ctx)

    const { savedRouteId }: { savedRouteId: Id<'saved_routes'> } = await ctx.runMutation(
      internalSavedRoutes.insert,
      args
    )

    return { savedRouteId: `${savedRouteId}` }
  },
})

export const renameRoute = mutation({
  args: { savedRouteId: v.id('saved_routes'), name: v.string() },
  returns: v.null(),
  handler: async (ctx, args): Promise<null> => {
    await requireIdentity(ctx)
    await ctx.runMutation(internalSavedRoutes.patchName, args)
    return null
  },
})

export const softDeleteRoute = mutation({
  args: { savedRouteId: v.id('saved_routes') },
  returns: v.object({ scheduledDeletionId: v.id('_scheduled_functions') }),
  handler: async (ctx, args): Promise<{ scheduledDeletionId: Id<'_scheduled_functions'> }> => {
    const { clerkUserId } = await requireIdentity(ctx)
    return softDeleteRouteHandler(ctx as any, args, clerkUserId)
  },
})

export const undoDeleteRoute = mutation({
  args: { savedRouteId: v.id('saved_routes') },
  returns: v.null(),
  handler: async (ctx, args): Promise<null> => {
    const { clerkUserId } = await requireIdentity(ctx)
    return undoDeleteRouteHandler(ctx as any, args, clerkUserId)
  },
})

export const permanentlyDeleteRoute = internalMutation({
  args: { savedRouteId: v.id('saved_routes') },
  returns: v.null(),
  handler: async (ctx, args): Promise<null> => {
    return permanentlyDeleteRouteHandler(ctx as any, args)
  },
})
