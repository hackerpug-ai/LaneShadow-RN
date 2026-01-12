import { v } from 'convex/values'

import type { Doc, Id } from '../_generated/dataModel'
import { internalMutation, internalQuery } from '../_generated/server'
import { requireIdentity } from '../guards'
import {
  OWNER_TYPE,
  VISIBILITY,
  planInputValidator,
  routeIndexValidator,
  routeSnapshotValidator,
  savedRouteValidator,
  snapshotMetaValidator,
} from '../../models/saved-routes'

type SavedRouteDoc = Doc<'saved_routes'>

const isOwnedByViewer = (doc: SavedRouteDoc, clerkUserId: string): boolean => {
  return doc.ownerType === OWNER_TYPE.USER && doc.ownerId === clerkUserId
}

const stripSystemFields = (doc: SavedRouteDoc) => {
  const { _id, _creationTime, ...savedRoute } = doc
  return savedRoute
}

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
