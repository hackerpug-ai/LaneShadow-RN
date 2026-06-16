import { ConvexError, v } from 'convex/values'

import { boundsValidator, type FavoriteRoad } from '../../models/favorite-roads'
import type { Doc, Id } from '../_generated/dataModel'
import { mutation, query } from '../_generated/server'
import { requireIdentity } from '../guards'

type FavoriteRoadDoc = Doc<'favorite_roads'>

// ---------------------------------------------------------------------------
// Exported validators (used in tests and Convex function definitions)
// ---------------------------------------------------------------------------

export const insertFavoriteRoadInputValidator = v.object({
  name: v.string(),
  geometry: v.string(),
  bounds: v.optional(boundsValidator),
})

// ---------------------------------------------------------------------------
// Exported pure helpers (testable without Convex runtime)
// ---------------------------------------------------------------------------

type InsertCtx = {
  db: { insert: (table: string, fields: object) => Promise<Id<'favorite_roads'>> }
}

export const insertHandler = async (
  ctx: InsertCtx,
  args: {
    name: string
    geometry: string
    bounds?: FavoriteRoad['bounds']
  },
  clerkUserId: string,
): Promise<{ favoriteRoadId: Id<'favorite_roads'> }> => {
  const now = Date.now()
  const favoriteRoadId = await ctx.db.insert('favorite_roads', {
    clerkUserId,
    name: args.name,
    geometry: args.geometry,
    bounds: args.bounds,
    createdAt: now,
    updatedAt: now,
  })

  return { favoriteRoadId }
}

type ListCtx = {
  db: {
    query: (table: string) => {
      withIndex: (
        indexName: string,
        fn: (q: any) => any,
      ) => {
        order: (direction: 'asc' | 'desc') => {
          collect: () => Promise<FavoriteRoadDoc[]>
        }
      }
    }
  }
}

export const listHandler = async (
  ctx: ListCtx,
  clerkUserId: string,
): Promise<FavoriteRoadDoc[]> => {
  const favorites = await ctx.db
    .query('favorite_roads')
    .withIndex('by_clerkUserId', (q) => q.eq('clerkUserId', clerkUserId))
    .order('desc')
    .collect()

  // Sort by createdAt descending (newest first)
  // The index order might not guarantee createdAt order, so we sort explicitly
  return favorites.sort((a, b) => b.createdAt - a.createdAt)
}

type RemoveCtx = {
  db: {
    get: (id: Id<'favorite_roads'>) => Promise<FavoriteRoadDoc | null>
    delete: (id: Id<'favorite_roads'>) => Promise<void>
  }
}

export const removeHandler = async (
  ctx: RemoveCtx,
  args: { favoriteRoadId: Id<'favorite_roads'> },
  clerkUserId: string,
): Promise<{ success: true }> => {
  // Validate clerkUserId is provided (auth check happens at Convex function level)
  if (!clerkUserId) {
    throw new ConvexError('Authentication required')
  }

  const favorite = await ctx.db.get(args.favoriteRoadId)

  if (!favorite || favorite.clerkUserId !== clerkUserId) {
    throw new ConvexError('Favorite road not found')
  }

  await ctx.db.delete(args.favoriteRoadId)
  return { success: true }
}

// ---------------------------------------------------------------------------
// Exported Convex functions
// ---------------------------------------------------------------------------

export const insert = mutation({
  args: { input: insertFavoriteRoadInputValidator },
  handler: async (ctx, args) => {
    const { clerkUserId } = await requireIdentity(ctx)
    return insertHandler(ctx as any, args.input, clerkUserId)
  },
})

export const list = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      // Return empty array for unauthenticated users
      // This allows the UI to render without errors
      return []
    }
    const clerkUserId = identity.subject
    return listHandler(ctx as any, clerkUserId)
  },
})

export const remove = mutation({
  args: { favoriteRoadId: v.id('favorite_roads') },
  handler: async (ctx, args) => {
    const { clerkUserId } = await requireIdentity(ctx)
    return removeHandler(ctx as any, args, clerkUserId)
  },
})
