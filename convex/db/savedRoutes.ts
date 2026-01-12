import { v } from 'convex/values'

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

type SavedRouteDoc = Doc<'saved_routes'>

const isOwnedByViewer = (doc: SavedRouteDoc, clerkUserId: string): boolean => {
  return doc.ownerType === OWNER_TYPE.USER && doc.ownerId === clerkUserId
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
  args: { limit: v.optional(v.number()) },
  returns: v.array(
    v.object({
      savedRouteId: v.id('saved_routes'),
      savedRoute: savedRouteValidator,
    })
  ),
  handler: async (ctx, { limit }) => {
    const { clerkUserId } = await requireIdentity(ctx)

    const query = ctx.db
      .query('saved_routes')
      .withIndex('by_ownerType_and_ownerId', (q) =>
        q.eq('ownerType', OWNER_TYPE.USER).eq('ownerId', clerkUserId)
      )
      .order('desc')

    const rows = limit ? await query.take(limit) : await query.collect()

    return rows.map((doc) => ({
      savedRouteId: doc._id,
      savedRoute: stripSystemFields(doc),
    }))
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
    const now = Date.now()

    const savedRouteId: Id<'saved_routes'> = await ctx.db.insert('saved_routes', {
      ownerType: OWNER_TYPE.USER,
      ownerId: clerkUserId,
      createdByUserId: clerkUserId,
      visibility: VISIBILITY.PRIVATE,
      name: args.name,
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
      throw new Error('NOT_FOUND')
    }

    await ctx.db.patch(doc._id, { name: args.name, updatedAt: Date.now() })
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
      throw new Error('NOT_FOUND')
    }

    await ctx.db.delete(doc._id)
    return null
  },
})

export const getSavedRoutesList = query({
  args: { limit: v.optional(v.number()) },
  returns: v.object({
    routes: v.array(
      v.object({
        savedRouteId: v.string(),
        name: v.string(),
        createdAt: v.number(),
        updatedAt: v.number(),
        preview: routePreviewValidator,
        capabilities: savedRouteCapabilitiesValidator,
      })
    ),
  }),
  handler: async (ctx, { limit }): Promise<SavedRoutesListView> => {
    await requireIdentity(ctx)
    const boundedLimit =
      limit && Number.isFinite(limit)
        ? Math.min(Math.max(limit, 1), MAX_LIST_LIMIT)
        : MAX_LIST_LIMIT

    const results = (await ctx.runQuery(internalSavedRoutes.listByOwner, {
      limit: boundedLimit,
    })) as Array<{ savedRouteId: Id<'saved_routes'>; savedRoute: SavedRoute }>

    return {
      routes: results.map(({ savedRouteId, savedRoute }) => ({
        savedRouteId: `${savedRouteId}`,
        name: savedRoute.name,
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
    const savedRoute = await ctx.runQuery(internalSavedRoutes.getById, {
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

    const { savedRouteId } = await ctx.runMutation(internalSavedRoutes.insert, args)

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

export const deleteRoute = mutation({
  args: { savedRouteId: v.id('saved_routes') },
  returns: v.null(),
  handler: async (ctx, args): Promise<null> => {
    await requireIdentity(ctx)
    await ctx.runMutation(internalSavedRoutes.deleteById, args)
    return null
  },
})
