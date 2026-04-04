import { ConvexError, v } from 'convex/values'

import { ERROR_CODES } from '../errors'
import type { Id } from '../_generated/dataModel'
import { internalMutation, mutation, query } from '../_generated/server'
import { requireIdentity } from '../guards'

type SessionMessageDoc = {
  _id: Id<'session_messages'>
  _creationTime: number
  sessionId: Id<'planning_sessions'>
  role: 'rider' | 'system'
  content: string
  attachments?: Array<{ type: 'route_options'; routePlanId: Id<'route_plans'> }>
  createdAt: number
}

type PlanningSessionDoc = {
  _id: Id<'planning_sessions'>
  _creationTime: number
  clerkUserId: string
  title: string
  status: 'active' | 'archived'
  createdAt: number
  updatedAt: number
}

// ---------------------------------------------------------------------------
// Types for testable handler contexts
// ---------------------------------------------------------------------------

type SendMessageCtx = {
  db: {
    get: (id: Id<'planning_sessions'>) => Promise<PlanningSessionDoc | null>
    insert: (table: string, fields: object) => Promise<Id<'session_messages'>>
    patch: (id: Id<'planning_sessions'>, fields: object) => Promise<void>
  }
}

type ListMessagesCtx = {
  db: {
    query: (table: string) => any
  }
}

type AddSystemMessageCtx = {
  db: {
    insert: (table: string, fields: object) => Promise<Id<'session_messages'>>
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

export const sendHandler = async (
  ctx: SendMessageCtx,
  args: { sessionId: Id<'planning_sessions'>; content: string },
  clerkUserId: string
): Promise<{ messageId: Id<'session_messages'> }> => {
  const session = await ctx.db.get(args.sessionId)
  if (!session || !isOwnedByUser(session, clerkUserId)) {
    throw new ConvexError(ERROR_CODES.SESSION_NOT_FOUND)
  }

  const now = Date.now()
  const messageId = await ctx.db.insert('session_messages', {
    sessionId: args.sessionId,
    role: 'rider',
    content: args.content,
    createdAt: now,
  })

  await ctx.db.patch(args.sessionId, { updatedAt: now })

  return { messageId }
}

export const listHandler = async (
  ctx: ListMessagesCtx,
  args: { sessionId: Id<'planning_sessions'> }
): Promise<SessionMessageDoc[]> => {
  const messages = await ctx.db
    .query('session_messages')
    .withIndex('by_sessionId', (q: any) => q.eq('sessionId', args.sessionId))
    .filter((q: any) => q.eq(true, true))
    .collect()

  // Sort by createdAt ascending (oldest first)
  return messages.sort((a: SessionMessageDoc, b: SessionMessageDoc) => a.createdAt - b.createdAt)
}

export const addSystemMessageHandler = async (
  ctx: AddSystemMessageCtx,
  args: {
    sessionId: Id<'planning_sessions'>
    content: string
    attachments?: Array<{ type: 'route_options'; routePlanId: Id<'route_plans'> }>
  }
): Promise<{ messageId: Id<'session_messages'> }> => {
  const now = Date.now()
  const messageId = await ctx.db.insert('session_messages', {
    sessionId: args.sessionId,
    role: 'system',
    content: args.content,
    attachments: args.attachments,
    createdAt: now,
  })

  await ctx.db.patch(args.sessionId, { updatedAt: now })

  return { messageId }
}

// ---------------------------------------------------------------------------
// Convex public mutations and queries
// ---------------------------------------------------------------------------

export const send = mutation({
  args: {
    sessionId: v.id('planning_sessions'),
    content: v.string(),
  },
  returns: v.object({ messageId: v.id('session_messages') }),
  handler: async (ctx, args) => {
    const { clerkUserId } = await requireIdentity(ctx)
    return sendHandler(ctx as any, args, clerkUserId)
  },
})

export const list = query({
  args: {
    sessionId: v.id('planning_sessions'),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const { clerkUserId } = await requireIdentity(ctx)
    const messages = await listHandler(ctx as any, args)
    return messages
  },
})

export const addSystemMessage = internalMutation({
  args: {
    sessionId: v.id('planning_sessions'),
    content: v.string(),
    attachments: v.optional(
      v.array(
        v.object({
          type: v.literal('route_options'),
          routePlanId: v.id('route_plans'),
        })
      )
    ),
  },
  returns: v.object({ messageId: v.id('session_messages') }),
  handler: async (ctx, args) => {
    return addSystemMessageHandler(ctx as any, args)
  },
})
