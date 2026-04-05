import { ConvexError, v } from 'convex/values'

import { ERROR_CODES } from '../errors'
import type { Id } from '../_generated/dataModel'
import { internalMutation, mutation, query } from '../_generated/server'
import { requireIdentity } from '../guards'
import {
  sessionMessageKindValidator,
  sessionMessageAttachmentValidator,
  type SessionMessageKind,
  type SessionMessageAttachment,
} from '../../models/session-messages'

type SessionMessageDoc = {
  _id: Id<'session_messages'>
  _creationTime: number
  sessionId: Id<'planning_sessions'>
  role: 'rider' | 'system'
  content: string
  attachments?: { type: 'route_options'; routePlanId: Id<'route_plans'> }[]
  createdAt: number
  // Per task #227 (widen phase): both fields are optional until migration
  // backfills pre-existing rows. Callers should default accordingly.
  kind?: SessionMessageKind
  status?: 'streaming' | 'running' | 'complete' | 'failed'
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
    get: (id: Id<'planning_sessions'>) => Promise<PlanningSessionDoc | null>
    query: (table: string) => any
  }
}

type AddSystemMessageCtx = {
  db: {
    insert: (table: string, fields: object) => Promise<Id<'session_messages'>>
    patch: (id: Id<'planning_sessions'>, fields: object) => Promise<void>
  }
}

type CreatePendingAssistantMessageCtx = {
  db: {
    insert: (table: string, fields: object) => Promise<Id<'session_messages'>>
    patch: (id: Id<'planning_sessions'>, fields: object) => Promise<void>
  }
}

type FinalizeAssistantMessageCtx = {
  db: {
    get: (id: Id<'session_messages'>) => Promise<{ sessionId: Id<'planning_sessions'>; content: string; [key: string]: unknown } | null>
    patch: (id: Id<'session_messages'> | Id<'planning_sessions'>, fields: object) => Promise<void>
  }
}

type AppendStreamingChunkCtx = {
  db: {
    get: (id: Id<'session_messages'>) => Promise<{ content: string; [key: string]: unknown } | null>
    patch: (id: Id<'session_messages'>, fields: object) => Promise<void>
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

  // AC-1 & AC-2: Validate content is not empty or whitespace-only
  const trimmedContent = args.content.trim()
  if (trimmedContent.length === 0) {
    throw new ConvexError(ERROR_CODES.INVALID_CONTENT)
  }

  const now = Date.now()
  const messageId = await ctx.db.insert('session_messages', {
    sessionId: args.sessionId,
    role: 'rider',
    content: trimmedContent,
    createdAt: now,
  })

  await ctx.db.patch(args.sessionId, { updatedAt: now })

  return { messageId }
}

export const listHandler = async (
  ctx: ListMessagesCtx,
  args: { sessionId: Id<'planning_sessions'> },
  clerkUserId: string
): Promise<SessionMessageDoc[]> => {
  // CRITICAL: Validate session ownership first
  const session = await ctx.db.get(args.sessionId)
  if (!session || !isOwnedByUser(session, clerkUserId)) {
    throw new ConvexError(ERROR_CODES.SESSION_NOT_FOUND)
  }

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
    attachments?: { type: 'route_options'; routePlanId: Id<'route_plans'> }[]
  }
): Promise<{ messageId: Id<'session_messages'> }> => {
  // AC-1 & AC-2: Validate content is not empty or whitespace-only
  const trimmedContent = args.content.trim()
  if (trimmedContent.length === 0) {
    throw new ConvexError(ERROR_CODES.INVALID_CONTENT)
  }

  const now = Date.now()
  const messageId = await ctx.db.insert('session_messages', {
    sessionId: args.sessionId,
    role: 'system',
    content: trimmedContent,
    attachments: args.attachments,
    createdAt: now,
  })

  await ctx.db.patch(args.sessionId, { updatedAt: now })

  return { messageId }
}

export const createPendingAssistantMessageHandler = async (
  ctx: CreatePendingAssistantMessageCtx,
  args: {
    sessionId: Id<'planning_sessions'>
    kind: SessionMessageKind
    attachments?: SessionMessageAttachment[]
  }
): Promise<{ messageId: Id<'session_messages'> }> => {
  const status = args.kind !== 'text' ? 'running' : 'streaming'
  const now = Date.now()
  const fields: Record<string, unknown> = {
    sessionId: args.sessionId,
    role: 'system',
    content: '',
    kind: args.kind,
    status,
    createdAt: now,
  }
  if (args.attachments !== undefined) {
    fields.attachments = args.attachments
  }
  const messageId = await ctx.db.insert('session_messages', fields)
  await ctx.db.patch(args.sessionId, { updatedAt: now })
  return { messageId }
}

export const finalizeAssistantMessageHandler = async (
  ctx: FinalizeAssistantMessageCtx,
  args: {
    messageId: Id<'session_messages'>
    content?: string
    status: 'complete' | 'failed'
  }
): Promise<null> => {
  const message = await ctx.db.get(args.messageId)
  if (!message) {
    throw new ConvexError(ERROR_CODES.SESSION_NOT_FOUND)
  }
  const now = Date.now()
  const patch: Record<string, unknown> = { status: args.status }
  if (args.content !== undefined) {
    patch.content = args.content
  }
  await ctx.db.patch(args.messageId, patch)
  await ctx.db.patch(message.sessionId, { updatedAt: now })
  return null
}

export const appendStreamingChunkHandler = async (
  ctx: AppendStreamingChunkCtx,
  args: {
    messageId: Id<'session_messages'>
    delta: string
  }
): Promise<null> => {
  const message = await ctx.db.get(args.messageId)
  if (!message) {
    throw new ConvexError(ERROR_CODES.SESSION_NOT_FOUND)
  }
  await ctx.db.patch(args.messageId, { content: message.content + args.delta })
  return null
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
    const messages = await listHandler(ctx as any, args, clerkUserId)
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

export const createPendingAssistantMessage = internalMutation({
  args: {
    sessionId: v.id('planning_sessions'),
    kind: sessionMessageKindValidator,
    attachments: v.optional(v.array(sessionMessageAttachmentValidator)),
  },
  returns: v.object({ messageId: v.id('session_messages') }),
  handler: async (ctx, args) => {
    return createPendingAssistantMessageHandler(ctx as any, args)
  },
})

export const finalizeAssistantMessage = internalMutation({
  args: {
    messageId: v.id('session_messages'),
    content: v.optional(v.string()),
    status: v.union(v.literal('complete'), v.literal('failed')),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    return finalizeAssistantMessageHandler(ctx as any, args)
  },
})

export const attachRoutePlanToMessage = internalMutation({
  args: {
    messageId: v.id('session_messages'),
    routePlanId: v.id('route_plans'),
  },
  returns: v.null(),
  handler: async (ctx, args): Promise<null> => {
    const message = await ctx.db.get(args.messageId)
    if (!message) {
      throw new ConvexError(ERROR_CODES.SESSION_NOT_FOUND)
    }
    await ctx.db.patch(args.messageId, {
      attachments: [{ type: 'route_options', routePlanId: args.routePlanId }],
    })
    return null
  },
})

export const appendStreamingChunk = internalMutation({
  args: {
    messageId: v.id('session_messages'),
    delta: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    return appendStreamingChunkHandler(ctx as any, args)
  },
})
