import { ConvexError, v } from 'convex/values'

import { ERROR_CODES } from '../errors'
import type { Id } from '../_generated/dataModel'
import { internalMutation, internalQuery, mutation, query } from '../_generated/server'
import { requireIdentity } from '../guards'
import {
  sessionMessageKindValidator,
  sessionMessageAttachmentValidator,
  sessionMessageStatusValidator,
  sessionMessageRoleValidator,
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
  piMessage?: unknown
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
    piMessage?: unknown
  }
): Promise<{ messageId: Id<'session_messages'> }> => {
  const status = args.kind === 'text' || args.kind === 'planning' ? 'streaming' : 'running'
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
  if (args.piMessage !== undefined) {
    fields.piMessage = args.piMessage
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
    piMessage?: unknown
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
  if (args.piMessage !== undefined) {
    patch.piMessage = args.piMessage
  }
  await ctx.db.patch(args.messageId, patch)
  await ctx.db.patch(message.sessionId, { updatedAt: now })
  return null
}

// ---------------------------------------------------------------------------
// ReAct loop / pi-ai agent persistence handlers
// ---------------------------------------------------------------------------

type RecordAgentTurnCtx = {
  db: {
    insert: (table: string, fields: object) => Promise<Id<'session_messages'>>
  }
}

type RecordToolResultCtx = {
  db: {
    patch: (id: Id<'session_messages'>, fields: object) => Promise<void>
  }
}

type RecordReasoningCtx = {
  db: {
    insert: (table: string, fields: object) => Promise<Id<'session_messages'>>
  }
}

type ListWithPiMessagesCtx = {
  db: {
    query: (table: string) => any
  }
}

export const recordAgentTurnHandler = async (
  ctx: RecordAgentTurnCtx,
  args: {
    sessionId: Id<'planning_sessions'>
    piMessage: unknown
  }
): Promise<Id<'session_messages'>> => {
  const now = Date.now()
  const messageId = await ctx.db.insert('session_messages', {
    sessionId: args.sessionId,
    role: 'system',
    content: '',
    kind: 'agent_turn',
    piMessage: args.piMessage,
    createdAt: now,
  })
  return messageId
}

export const recordToolResultHandler = async (
  ctx: RecordToolResultCtx,
  args: {
    messageId: Id<'session_messages'>
    piMessage: unknown
  }
): Promise<null> => {
  await ctx.db.patch(args.messageId, { piMessage: args.piMessage })
  return null
}

export const recordReasoningHandler = async (
  ctx: RecordReasoningCtx,
  args: {
    sessionId: Id<'planning_sessions'>
    content: string
    piMessage: unknown
  }
): Promise<Id<'session_messages'>> => {
  const now = Date.now()
  const messageId = await ctx.db.insert('session_messages', {
    sessionId: args.sessionId,
    role: 'system',
    content: args.content,
    kind: 'reasoning',
    status: 'streaming',
    piMessage: args.piMessage,
    createdAt: now,
  })
  return messageId
}

export const appendReasoningChunkHandler = async (
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

export const listWithPiMessagesHandler = async (
  ctx: ListWithPiMessagesCtx,
  args: { sessionId: Id<'planning_sessions'> }
): Promise<SessionMessageDoc[]> => {
  const messages = await ctx.db
    .query('session_messages')
    .withIndex('by_sessionId', (q: any) => q.eq('sessionId', args.sessionId))
    .filter((q: any) => q.eq(true, true))
    .collect()
  return messages.sort(
    (a: SessionMessageDoc, b: SessionMessageDoc) => a.createdAt - b.createdAt
  )
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

type UpdatePlanningContentCtx = {
  db: {
    get: (id: Id<'session_messages'>) => Promise<{ content: string; [key: string]: unknown } | null>
    patch: (id: Id<'session_messages'>, fields: object) => Promise<void>
  }
}

export const updatePlanningContentHandler = async (
  ctx: UpdatePlanningContentCtx,
  args: {
    messageId: Id<'session_messages'>
    content: string
  }
): Promise<null> => {
  const message = await ctx.db.get(args.messageId)
  if (!message) {
    throw new ConvexError(ERROR_CODES.SESSION_NOT_FOUND)
  }
  await ctx.db.patch(args.messageId, { content: args.content })
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
    piMessage: v.optional(v.any()),
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
    piMessage: v.optional(v.any()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    return finalizeAssistantMessageHandler(ctx as any, args)
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

export const updatePlanningContent = internalMutation({
  args: {
    messageId: v.id('session_messages'),
    content: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    return updatePlanningContentHandler(ctx as any, args)
  },
})

// ---------------------------------------------------------------------------
// ReAct loop / pi-ai agent persistence mutations + queries
// ---------------------------------------------------------------------------

const sessionMessageRowValidator = v.object({
  _id: v.id('session_messages'),
  _creationTime: v.number(),
  sessionId: v.id('planning_sessions'),
  role: sessionMessageRoleValidator,
  content: v.string(),
  attachments: v.optional(
    v.array(
      v.object({
        type: v.literal('route_options'),
        routePlanId: v.id('route_plans'),
      })
    )
  ),
  createdAt: v.number(),
  kind: v.optional(sessionMessageKindValidator),
  status: v.optional(sessionMessageStatusValidator),
  piMessage: v.optional(v.any()),
})

export const listWithPiMessages = internalQuery({
  args: {
    sessionId: v.id('planning_sessions'),
  },
  returns: v.array(sessionMessageRowValidator),
  handler: async (ctx, args) => {
    return listWithPiMessagesHandler(ctx as any, args)
  },
})

export const recordAgentTurn = internalMutation({
  args: {
    sessionId: v.id('planning_sessions'),
    piMessage: v.any(),
  },
  returns: v.id('session_messages'),
  handler: async (ctx, args) => {
    return recordAgentTurnHandler(ctx as any, args)
  },
})

export const recordToolResult = internalMutation({
  args: {
    messageId: v.id('session_messages'),
    piMessage: v.any(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    return recordToolResultHandler(ctx as any, args)
  },
})

export const recordReasoning = internalMutation({
  args: {
    sessionId: v.id('planning_sessions'),
    content: v.string(),
    piMessage: v.any(),
  },
  returns: v.id('session_messages'),
  handler: async (ctx, args) => {
    return recordReasoningHandler(ctx as any, args)
  },
})

export const appendReasoningChunk = internalMutation({
  args: {
    messageId: v.id('session_messages'),
    delta: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    return appendReasoningChunkHandler(ctx as any, args)
  },
})
