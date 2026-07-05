import { ConvexError, v } from 'convex/values'
import {
  OWNER_TYPE,
  planInputValidator,
  routeIndexValidator,
  routePreviewValidator,
  routeProvenanceValidator,
  routeSnapshotValidator,
  type SavedRoute,
  savedRouteCapabilitiesValidator,
  savedRouteValidator,
  snapshotMetaValidator,
  VISIBILITY,
} from '../../shared/models/saved-routes'
import type { SavedRouteDetailView, SavedRoutesListView } from '../../shared/types/routes'
import { internal } from '../_generated/api'
import type { Doc, Id } from '../_generated/dataModel'
import { internalMutation, internalQuery, mutation, query } from '../_generated/server'
import { ERROR_CODES } from '../errors'
import { requireIdentity } from '../guards'
import { applyDateFilter, applySearchFilter } from './savedRoutes.utils'

type SavedRouteDoc = Doc<'saved_routes'>

const isOwnedByViewer = (doc: SavedRouteDoc, clerkUserId: string): boolean => {
  return doc.ownerType === OWNER_TYPE.USER && doc.ownerId === clerkUserId
}

/**
 * DATA-003: type guard narrowing a SavedRoute to one that carries the full
 * planned payload (planInput + routeSnapshot + routeIndex). Curated bookmarks
 * (curatedRouteRef-only) are a separate shape rendered by a different surface
 * (SAVE-001), so the planned-route list/detail views operate only on planned rows.
 *
 * The guard takes the listByOwner element shape so narrowing propagates through
 * `.filter()` into the subsequent `.map()` callback.
 */
type SavedRouteWithId = { savedRouteId: Id<'saved_routes'>; savedRoute: SavedRoute }

const isPlannedSavedRoute = (
  item: SavedRouteWithId,
): item is SavedRouteWithId & {
  savedRoute: SavedRoute & {
    planInput: NonNullable<SavedRoute['planInput']>
    routeSnapshot: NonNullable<SavedRoute['routeSnapshot']>
    routeIndex: NonNullable<SavedRoute['routeIndex']>
  }
} =>
  Boolean(item.savedRoute.planInput && item.savedRoute.routeSnapshot && item.savedRoute.routeIndex)

// ---------------------------------------------------------------------------
// Exported pure helpers (also used in tests)
// ---------------------------------------------------------------------------

export const buildSoftDeletePatch = (
  deletedAt: number,
  scheduledDeletionId: Id<'_scheduled_functions'>,
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

export const shouldExcludeFromList = (doc: { deletedAt?: number | undefined }): boolean =>
  doc.deletedAt !== undefined && doc.deletedAt !== null

// ---------------------------------------------------------------------------
// Exported handler functions (testable without Convex runtime)
// ---------------------------------------------------------------------------

type SoftDeleteCtx = {
  db: {
    get: (id: string) => Promise<SavedRouteDoc | null>
    patch: (id: string, fields: object) => Promise<void>
  }
  scheduler: {
    runAfter: (ms: number, fn: unknown, args: object) => Promise<Id<'_scheduled_functions'>>
  }
}

export const softDeleteRouteHandler = async (
  ctx: SoftDeleteCtx,
  args: { savedRouteId: Id<'saved_routes'> },
  clerkUserId: string,
): Promise<{ scheduledDeletionId: Id<'_scheduled_functions'> }> => {
  const doc = await ctx.db.get(args.savedRouteId)
  if (!doc || !isOwnedByViewer(doc as SavedRouteDoc, clerkUserId)) {
    throw new ConvexError('Route not found')
  }

  if (doc.deletedAt !== undefined) {
    if (!doc.scheduledDeletionId) {
      throw new ConvexError(
        'Route is in an inconsistent state: soft-deleted without scheduledDeletionId',
      )
    }
    return { scheduledDeletionId: doc.scheduledDeletionId }
  }

  const scheduledDeletionId = await ctx.scheduler.runAfter(
    5000,
    internalSavedRoutes.permanentlyDeleteRoute,
    { savedRouteId: args.savedRouteId },
  )

  await ctx.db.patch(args.savedRouteId, buildSoftDeletePatch(Date.now(), scheduledDeletionId))
  return { scheduledDeletionId }
}

type UndoDeleteCtx = {
  db: {
    get: (id: string) => Promise<SavedRouteDoc | null>
    patch: (id: string, fields: object) => Promise<void>
  }
  scheduler: { cancel: (id: string) => Promise<void> }
}

export const undoDeleteRouteHandler = async (
  ctx: UndoDeleteCtx,
  args: { savedRouteId: Id<'saved_routes'> },
  clerkUserId: string,
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
  args: { savedRouteId: Id<'saved_routes'> },
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

type InsertCtx = {
  db: { insert: (table: string, fields: object) => Promise<Id<'saved_routes'>> }
  auth: { getUserIdentity: () => Promise<{ subject: string } | null> }
}

export const insertHandler = async (
  ctx: InsertCtx,
  args: {
    name: string
    planInput?: SavedRoute['planInput']
    routeSnapshot?: SavedRoute['routeSnapshot']
    routeIndex?: SavedRoute['routeIndex']
    snapshotMeta?: SavedRoute['snapshotMeta']
    routeProvenance?: SavedRoute['routeProvenance']
    curatedRouteRef?: SavedRoute['curatedRouteRef']
  },
  clerkUserId: string,
): Promise<{ savedRouteId: Id<'saved_routes'> }> => {
  // DATA-003: XOR validation — a saved_routes row must hold exactly one of:
  //   (a) a curated-route bookmark (curatedRouteRef), OR
  //   (b) a planned-route payload (planInput + routeSnapshot + routeIndex).
  // `hasCurated === hasPlanned` is true when BOTH are set or NEITHER is set;
  // both are illegal states and must be rejected before any write.
  const hasCurated = !!args.curatedRouteRef
  const hasPlanned = !!(args.planInput && args.routeSnapshot && args.routeIndex)
  if (hasCurated === hasPlanned) {
    throw new ConvexError({
      code: ERROR_CODES.VALIDATION_ERROR,
      message:
        'saved_routes requires exactly one of curatedRouteRef OR (planInput + routeSnapshot + routeIndex)',
    })
  }

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
    curatedRouteRef: args.curatedRouteRef,
    // routeFingerprint is only meaningful for planned saves (derived from routeIndex).
    routeFingerprint: args.routeIndex?.routeFingerprint,
    snapshotMeta: args.snapshotMeta,
    routeProvenance: args.routeProvenance,
    createdAt: now,
    updatedAt: now,
  })

  return { savedRouteId }
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

const computePreview = (routeSnapshot: SavedRoute['routeSnapshot']) => {
  if (!routeSnapshot) {
    return {
      bounds: { north: 0, south: 0, east: 0, west: 0 },
      distanceMeters: 0,
      durationSeconds: 0,
    }
  }
  const distanceMeters = routeSnapshot.legs.reduce((total, leg) => total + leg.distanceMeters, 0)
  const durationSeconds = routeSnapshot.legs.reduce((total, leg) => total + leg.durationSeconds, 0)

  return {
    bounds: routeSnapshot.bounds,
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
    }),
  ),
  handler: async (ctx, { limit, searchQuery, afterDate, beforeDate }) => {
    const { clerkUserId } = await requireIdentity(ctx)

    const query = ctx.db
      .query('saved_routes')
      .withIndex('by_ownerType_and_ownerId', (q) =>
        q.eq('ownerType', OWNER_TYPE.USER).eq('ownerId', clerkUserId),
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
    planInput: v.optional(planInputValidator),
    routeSnapshot: v.optional(routeSnapshotValidator),
    routeIndex: v.optional(routeIndexValidator),
    snapshotMeta: v.optional(snapshotMetaValidator),
    routeProvenance: v.optional(routeProvenanceValidator),
    curatedRouteRef: v.optional(v.id('curated_routes')),
  },
  returns: v.object({ savedRouteId: v.id('saved_routes') }),
  handler: async (ctx, args) => {
    const { clerkUserId } = await requireIdentity(ctx)
    return insertHandler(ctx as any, args, clerkUserId)
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
        routeIndex: routeIndexValidator,
      }),
    ),
  }),
  handler: async (
    ctx,
    { limit, searchQuery, afterDate, beforeDate },
  ): Promise<SavedRoutesListView> => {
    await requireIdentity(ctx)
    const boundedLimit =
      limit && Number.isFinite(limit)
        ? Math.min(Math.max(limit, 1), MAX_LIST_LIMIT)
        : MAX_LIST_LIMIT

    const results: {
      savedRouteId: Id<'saved_routes'>
      savedRoute: SavedRoute
    }[] = await ctx.runQuery(internalSavedRoutes.listByOwner, {
      limit: boundedLimit,
      searchQuery,
      afterDate,
      beforeDate,
    })

    return {
      routes: results
        .filter((item) => isPlannedSavedRoute(item))
        .map(({ savedRouteId, savedRoute }) => ({
          savedRouteId: `${savedRouteId}`,
          name: savedRoute.name,
          startLabel: savedRoute.planInput.start?.label ?? '',
          endLabel: savedRoute.planInput.end?.label ?? '',
          createdAt: savedRoute.createdAt,
          updatedAt: savedRoute.updatedAt,
          preview: computePreview(savedRoute.routeSnapshot),
          capabilities: defaultCapabilities,
          routeIndex: savedRoute.routeIndex,
        })),
    }
  },
})

export const savedRouteDetailViewValidator = v.object({
  savedRouteId: v.string(),
  name: v.string(),
  planInput: planInputValidator,
  routeSnapshot: routeSnapshotValidator,
  routeIndex: routeIndexValidator,
  snapshotMeta: snapshotMetaValidator,
  routeProvenance: v.optional(routeProvenanceValidator),
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

    // DATA-003: this planned-route detail view requires the full planned payload.
    // Curated bookmarks (curatedRouteRef-only) are rendered by a separate surface
    // (SAVE-001); until then they resolve to null here.
    if (
      !savedRoute.planInput ||
      !savedRoute.routeSnapshot ||
      !savedRoute.routeIndex ||
      !savedRoute.snapshotMeta
    ) {
      return null
    }

    return {
      savedRouteId: `${savedRouteId}`,
      name: savedRoute.name,
      planInput: savedRoute.planInput,
      routeSnapshot: savedRoute.routeSnapshot,
      routeIndex: savedRoute.routeIndex,
      snapshotMeta: savedRoute.snapshotMeta,
      routeProvenance: savedRoute.routeProvenance,
      capabilities: defaultCapabilities,
    }
  },
})

export const saveRoute = mutation({
  args: {
    name: v.string(),
    planInput: v.optional(planInputValidator),
    routeSnapshot: v.optional(routeSnapshotValidator),
    routeIndex: v.optional(routeIndexValidator),
    snapshotMeta: v.optional(snapshotMetaValidator),
    routeProvenance: v.optional(routeProvenanceValidator),
    // DATA-003: curated-route bookmark target. XOR-validated against the planned
    // payload inside insertHandler (exactly one of the two shapes must be present).
    curatedRouteRef: v.optional(v.id('curated_routes')),
  },
  returns: v.object({ savedRouteId: v.string() }),
  handler: async (
    ctx,
    args,
  ): Promise<{
    savedRouteId: string
  }> => {
    await requireIdentity(ctx)

    const { savedRouteId }: { savedRouteId: Id<'saved_routes'> } = await ctx.runMutation(
      internalSavedRoutes.insert,
      args,
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

export const getRouteIndexFingerprint = query({
  args: {
    routeIndex: v.string(),
  },
  returns: v.object({
    isSaved: v.boolean(),
    savedRouteId: v.optional(v.id('saved_routes')),
  }),
  handler: async (ctx, args): Promise<{ isSaved: boolean; savedRouteId?: Id<'saved_routes'> }> => {
    const { clerkUserId } = await requireIdentity(ctx)

    // Use composite index for efficient lookup: ownerType + ownerId + routeFingerprint
    const match = await ctx.db
      .query('saved_routes')
      .withIndex('by_ownerType_ownerId_routeFingerprint', (q) =>
        q
          .eq('ownerType', OWNER_TYPE.USER)
          .eq('ownerId', clerkUserId)
          .eq('routeFingerprint', args.routeIndex),
      )
      .first()

    if (!match || shouldExcludeFromList(match)) {
      return { isSaved: false }
    }

    return {
      isSaved: true,
      savedRouteId: match._id,
    }
  },
})
