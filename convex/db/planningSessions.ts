import { ConvexError, v } from 'convex/values'

import {
  lastKnownLocationValidator,
  planningSessionStatusValidator,
  PLANNING_SESSION_STATUS,
} from '../../models/planning-sessions'
import type { Doc, Id } from '../_generated/dataModel'
import { internalMutation, mutation, query } from '../_generated/server'
import { requireIdentity } from '../guards'
import { ERROR_CODES } from '../errors'

type PlanningSessionDoc = Doc<'planning_sessions'>

// ---------------------------------------------------------------------------
// Types for testable handler contexts
// ---------------------------------------------------------------------------

type CreateSessionCtx = {
  db: {
    insert: (table: string, fields: object) => Promise<Id<'planning_sessions'>>
  }
}

type ListSessionsCtx = {
  db: {
    query: (table: 'planning_sessions') => {
      withIndex: (
        index: 'by_clerkUserId' | 'by_clerkUserId_and_updatedAt',
        callback: (q: { eq: (field: string, value: string) => void }) => void
      ) => {
        order: (direction: 'asc' | 'desc') => {
          collect: () => Promise<PlanningSessionDoc[]>
        }
        collect: () => Promise<PlanningSessionDoc[]>
      }
    }
  }
}

type GetSessionByIdCtx = {
  db: {
    get: (id: Id<'planning_sessions'>) => Promise<PlanningSessionDoc | null>
  }
}

type ArchiveSessionCtx = {
  db: {
    get: (id: Id<'planning_sessions'>) => Promise<PlanningSessionDoc | null>
    patch: (id: Id<'planning_sessions'>, fields: object) => Promise<void>
  }
}

type UpdateLastKnownLocationCtx = {
  db: {
    patch: (id: Id<'planning_sessions'>, fields: object) => Promise<void>
  }
}

type DeleteSessionCtx = {
  db: {
    get: (id: Id<'planning_sessions'>) => Promise<PlanningSessionDoc | null>
    patch: (id: Id<'planning_sessions'>, fields: object) => Promise<void>
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const isOwnedByUser = (doc: PlanningSessionDoc, clerkUserId: string): boolean =>
  doc.clerkUserId === clerkUserId

// ---------------------------------------------------------------------------
// Exported handler functions (testable without Convex runtime)
// ---------------------------------------------------------------------------

export const createSessionHandler = async (
  ctx: CreateSessionCtx,
  args: { firstMessage: string },
  clerkUserId: string
): Promise<{ sessionId: Id<'planning_sessions'> }> => {
  const now = Date.now()
  const title = args.firstMessage.slice(0, 50)

  const sessionId = await ctx.db.insert('planning_sessions', {
    clerkUserId,
    title,
    status: PLANNING_SESSION_STATUS.ACTIVE,
    createdAt: now,
    updatedAt: now,
  })

  return { sessionId }
}

export const listSessionsHandler = async (
  ctx: ListSessionsCtx,
  clerkUserId: string
): Promise<PlanningSessionDoc[]> => {
  // Use composite index for efficient sorting by updatedAt descending
  const sessions = await ctx.db
    .query('planning_sessions')
    .withIndex('by_clerkUserId_and_updatedAt', (q) =>
      q.eq('clerkUserId', clerkUserId)
    )
    .order('desc')
    .collect()

  // Filter out soft-deleted sessions
  return sessions.filter((session) => !session.deletedAt)
}

export const getSessionByIdHandler = async (
  ctx: GetSessionByIdCtx,
  args: { sessionId: Id<'planning_sessions'> },
  clerkUserId: string
): Promise<PlanningSessionDoc> => {
  const doc = await ctx.db.get(args.sessionId)
  if (!doc || !isOwnedByUser(doc, clerkUserId)) {
    throw new ConvexError(ERROR_CODES.SESSION_NOT_FOUND)
  }
  return doc
}

export const archiveSessionHandler = async (
  ctx: ArchiveSessionCtx,
  args: { sessionId: Id<'planning_sessions'> },
  clerkUserId: string
): Promise<void> => {
  const doc = await ctx.db.get(args.sessionId)
  if (!doc || !isOwnedByUser(doc, clerkUserId)) {
    throw new ConvexError(ERROR_CODES.SESSION_NOT_FOUND)
  }

  await ctx.db.patch(args.sessionId, {
    status: PLANNING_SESSION_STATUS.ARCHIVED,
    updatedAt: Date.now(),
  })
}

export const updateLastKnownLocationHandler = async (
  ctx: UpdateLastKnownLocationCtx,
  args: { sessionId: Id<'planning_sessions'>; lat: number; lng: number }
): Promise<void> => {
  await ctx.db.patch(args.sessionId, {
    lastKnownLocation: {
      lat: args.lat,
      lng: args.lng,
      updatedAt: Date.now(),
    },
  })
}

export const deleteSessionHandler = async (
  ctx: DeleteSessionCtx,
  args: { sessionId: Id<'planning_sessions'> },
  clerkUserId: string
): Promise<void> => {
  const doc = await ctx.db.get(args.sessionId)
  if (!doc || !isOwnedByUser(doc, clerkUserId)) {
    throw new ConvexError(ERROR_CODES.SESSION_NOT_FOUND)
  }

  // Soft delete - mark as deleted with timestamp
  await ctx.db.patch(args.sessionId, {
    deletedAt: Date.now(),
  })
}

// ---------------------------------------------------------------------------
// Convex public mutations and queries
// ---------------------------------------------------------------------------

export const createSession = mutation({
  args: {
    firstMessage: v.string(),
  },
  returns: v.object({ sessionId: v.id('planning_sessions') }),
  handler: async (ctx, args): Promise<{ sessionId: Id<'planning_sessions'> }> => {
    const { clerkUserId } = await requireIdentity(ctx)
    return createSessionHandler(
      ctx as unknown as CreateSessionCtx,
      args,
      clerkUserId
    )
  },
})

export const listSessions = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id('planning_sessions'),
      _creationTime: v.number(),
      clerkUserId: v.string(),
      title: v.string(),
      status: planningSessionStatusValidator,
      createdAt: v.number(),
      updatedAt: v.number(),
      lastKnownLocation: v.optional(lastKnownLocationValidator),
    })
  ),
  handler: async (ctx): Promise<PlanningSessionDoc[]> => {
    const { clerkUserId } = await requireIdentity(ctx)
    return listSessionsHandler(ctx as unknown as ListSessionsCtx, clerkUserId)
  },
})

export const getSessionById = query({
  args: { sessionId: v.id('planning_sessions') },
  returns: v.object({
    _id: v.id('planning_sessions'),
    _creationTime: v.number(),
    clerkUserId: v.string(),
    title: v.string(),
    status: planningSessionStatusValidator,
    createdAt: v.number(),
    updatedAt: v.number(),
    lastKnownLocation: v.optional(lastKnownLocationValidator),
  }),
  handler: async (ctx, args): Promise<PlanningSessionDoc> => {
    const { clerkUserId } = await requireIdentity(ctx)
    return getSessionByIdHandler(
      ctx as unknown as GetSessionByIdCtx,
      args,
      clerkUserId
    )
  },
})

export const updateLastKnownLocation = internalMutation({
  args: {
    sessionId: v.id('planning_sessions'),
    lat: v.number(),
    lng: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args): Promise<null> => {
    await updateLastKnownLocationHandler(
      ctx as unknown as UpdateLastKnownLocationCtx,
      args
    )
    return null
  },
})

export const deleteSession = mutation({
  args: { sessionId: v.id('planning_sessions') },
  returns: v.null(),
  handler: async (ctx, args): Promise<null> => {
    const { clerkUserId } = await requireIdentity(ctx)
    await deleteSessionHandler(
      ctx as unknown as DeleteSessionCtx,
      args,
      clerkUserId
    )
    return null
  },
})

export const archiveSession = mutation({
  args: { sessionId: v.id('planning_sessions') },
  returns: v.null(),
  handler: async (ctx, args): Promise<null> => {
    const { clerkUserId } = await requireIdentity(ctx)
    await archiveSessionHandler(
      ctx as unknown as ArchiveSessionCtx,
      args,
      clerkUserId
    )
    return null
  },
})

// ---------------------------------------------------------------------------
// Cron job: Cleanup old empty sessions
// ---------------------------------------------------------------------------

type CleanupOldEmptySessionsCtx = {
  db: {
    query: (table: 'planning_sessions' | 'session_messages') => any
    delete: (id: any) => Promise<void>
  }
}

const ONE_HOUR_MS = 60 * 60 * 1000

export const cleanupOldEmptySessionsHandler = async (
  ctx: CleanupOldEmptySessionsCtx
): Promise<{ deletedCount: number }> => {
  const now = Date.now()
  const cutoffTime = now - ONE_HOUR_MS
  let deletedCount = 0

  // Fetch all sessions that were created more than an hour ago
  const oldSessions = await ctx.db
    .query('planning_sessions')
    .filter((q: any) => q.lt(q.field('createdAt'), cutoffTime))
    .collect()

  for (const session of oldSessions) {
    // Skip soft-deleted sessions
    if (session.deletedAt) {
      continue
    }

    // Check if session has any messages
    const messages = await ctx.db
      .query('session_messages')
      .withIndex('by_sessionId', (q: any) => q.eq('sessionId', session._id))
      .collect()

    // If no messages, delete the session
    if (messages.length === 0) {
      await ctx.db.delete(session._id)
      deletedCount++
    }
  }

  if (deletedCount > 0) {
    console.log(`[cleanup] Cleaned up ${deletedCount} empty planning session(s) older than 1 hour`)
  }

  return { deletedCount }
}

export const cleanupOldEmptySessions = internalMutation({
  args: {},
  returns: v.object({ deletedCount: v.number() }),
  handler: async (ctx): Promise<{ deletedCount: number }> => {
    return cleanupOldEmptySessionsHandler(ctx as any)
  },
})
