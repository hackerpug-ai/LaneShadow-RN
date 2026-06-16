/**
 * Tests for sessionMessages.ts lifecycle mutations (task #228).
 *
 * Exercises createPendingAssistantMessage, finalizeAssistantMessage,
 * and appendStreamingChunk via exported handler functions.
 */

import { ConvexError } from 'convex/values'
import { describe, expect, it, vi } from 'vitest'
import type { Id } from '../_generated/dataModel'
import { ERROR_CODES } from '../errors'
import {
  appendReasoningChunkHandler,
  appendStreamingChunkHandler,
  createPendingAssistantMessageHandler,
  finalizeAssistantMessageHandler,
  listWithPiMessagesHandler,
  recordAgentTurnHandler,
  recordReasoningHandler,
  recordToolResultHandler,
} from './sessionMessages'

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------

const SESSION_ID = 'session_abc' as Id<'planning_sessions'>
const MESSAGE_ID = 'msg_123' as Id<'session_messages'>
const ROUTE_PLAN_ID = 'route_456' as Id<'route_plans'>

// ---------------------------------------------------------------------------
// AC-1: create → append × 3 → finalize(complete) flow
// ---------------------------------------------------------------------------

describe('createPendingAssistantMessageHandler', () => {
  it('AC-1: creates text message with status streaming', async () => {
    const ctx = {
      db: {
        insert: vi.fn().mockResolvedValue(MESSAGE_ID),
        patch: vi.fn().mockResolvedValue(undefined),
      },
    }

    const result = await createPendingAssistantMessageHandler(ctx as any, {
      sessionId: SESSION_ID,
      kind: 'text',
    })

    expect(result).toEqual({ messageId: MESSAGE_ID })
    expect(ctx.db.insert).toHaveBeenCalledWith(
      'session_messages',
      expect.objectContaining({
        sessionId: SESSION_ID,
        role: 'system',
        content: '',
        kind: 'text',
        status: 'streaming',
        createdAt: expect.any(Number),
      }),
    )
    expect(ctx.db.patch).toHaveBeenCalledWith(
      SESSION_ID,
      expect.objectContaining({ updatedAt: expect.any(Number) }),
    )
  })

  it('AC-1: creates routing_card message with status running', async () => {
    const ctx = {
      db: {
        insert: vi.fn().mockResolvedValue(MESSAGE_ID),
        patch: vi.fn().mockResolvedValue(undefined),
      },
    }

    const result = await createPendingAssistantMessageHandler(ctx as any, {
      sessionId: SESSION_ID,
      kind: 'routing_card',
    })

    expect(result).toEqual({ messageId: MESSAGE_ID })
    expect(ctx.db.insert).toHaveBeenCalledWith(
      'session_messages',
      expect.objectContaining({
        kind: 'routing_card',
        status: 'running',
      }),
    )
  })

  it('AC-2: creates routing_card with attachment', async () => {
    const ctx = {
      db: {
        insert: vi.fn().mockResolvedValue(MESSAGE_ID),
        patch: vi.fn().mockResolvedValue(undefined),
      },
    }

    const attachments = [{ type: 'route_options' as const, routePlanId: ROUTE_PLAN_ID }]

    const result = await createPendingAssistantMessageHandler(ctx as any, {
      sessionId: SESSION_ID,
      kind: 'routing_card',
      attachments,
    })

    expect(result).toEqual({ messageId: MESSAGE_ID })
    expect(ctx.db.insert).toHaveBeenCalledWith(
      'session_messages',
      expect.objectContaining({
        attachments,
        status: 'running',
      }),
    )
  })
})

describe('appendStreamingChunkHandler', () => {
  it('AC-1: concatenates delta to existing content', async () => {
    const existingMessage = {
      _id: MESSAGE_ID,
      _creationTime: 1000,
      sessionId: SESSION_ID,
      role: 'system' as const,
      content: 'Hello',
      kind: 'text',
      status: 'streaming',
      createdAt: Date.now() - 1000,
    }

    const ctx = {
      db: {
        get: vi.fn().mockResolvedValue(existingMessage),
        patch: vi.fn().mockResolvedValue(undefined),
      },
    }

    const result = await appendStreamingChunkHandler(ctx as any, {
      messageId: MESSAGE_ID,
      delta: ' world',
    })

    expect(result).toBeNull()
    expect(ctx.db.patch).toHaveBeenCalledWith(
      MESSAGE_ID,
      expect.objectContaining({ content: 'Hello world' }),
    )
  })

  it('AC-3: appending three chunks concatenates correctly', async () => {
    let currentContent = ''
    const ctx = {
      db: {
        get: vi.fn().mockImplementation(async () => ({
          _id: MESSAGE_ID,
          content: currentContent,
        })),
        patch: vi.fn().mockImplementation(async (_id: any, fields: any) => {
          if (fields.content !== undefined) {
            currentContent = fields.content
          }
        }),
      },
    }

    await appendStreamingChunkHandler(ctx as any, { messageId: MESSAGE_ID, delta: 'foo' })
    await appendStreamingChunkHandler(ctx as any, { messageId: MESSAGE_ID, delta: ' bar' })
    await appendStreamingChunkHandler(ctx as any, { messageId: MESSAGE_ID, delta: ' baz' })

    expect(currentContent).toBe('foo bar baz')
  })

  it('AC-3: does NOT change status', async () => {
    const existingMessage = {
      _id: MESSAGE_ID,
      content: 'partial',
      status: 'streaming',
    }

    const ctx = {
      db: {
        get: vi.fn().mockResolvedValue(existingMessage),
        patch: vi.fn().mockResolvedValue(undefined),
      },
    }

    await appendStreamingChunkHandler(ctx as any, {
      messageId: MESSAGE_ID,
      delta: ' more',
    })

    const patchCall = (ctx.db.patch as any).mock.calls[0]
    expect(patchCall[1]).not.toHaveProperty('status')
  })
})

describe('finalizeAssistantMessageHandler', () => {
  it('AC-1: finalizes with complete status and content', async () => {
    const existingMessage = {
      _id: MESSAGE_ID,
      _creationTime: 1000,
      sessionId: SESSION_ID,
      role: 'system' as const,
      content: 'Partial content',
      kind: 'text',
      status: 'streaming',
      createdAt: Date.now() - 1000,
    }

    const ctx = {
      db: {
        get: vi.fn().mockResolvedValue(existingMessage),
        patch: vi.fn().mockResolvedValue(undefined),
      },
    }

    const result = await finalizeAssistantMessageHandler(ctx as any, {
      messageId: MESSAGE_ID,
      content: 'Final content',
      status: 'complete',
    })

    expect(result).toBeNull()
    expect(ctx.db.patch).toHaveBeenCalledWith(
      MESSAGE_ID,
      expect.objectContaining({
        status: 'complete',
        content: 'Final content',
      }),
    )
  })

  it('AC-2: finalizes routing_card with failed status', async () => {
    const existingMessage = {
      _id: MESSAGE_ID,
      sessionId: SESSION_ID,
      role: 'system' as const,
      content: '',
      kind: 'routing_card',
      status: 'running',
      createdAt: Date.now() - 1000,
    }

    const ctx = {
      db: {
        get: vi.fn().mockResolvedValue(existingMessage),
        patch: vi.fn().mockResolvedValue(undefined),
      },
    }

    const result = await finalizeAssistantMessageHandler(ctx as any, {
      messageId: MESSAGE_ID,
      status: 'failed',
    })

    expect(result).toBeNull()
    expect(ctx.db.patch).toHaveBeenCalledWith(
      MESSAGE_ID,
      expect.objectContaining({ status: 'failed' }),
    )
  })

  it('AC-1: updates parent session updatedAt', async () => {
    const existingMessage = {
      _id: MESSAGE_ID,
      sessionId: SESSION_ID,
      content: '',
      status: 'streaming',
    }

    const ctx = {
      db: {
        get: vi.fn().mockResolvedValue(existingMessage),
        patch: vi.fn().mockResolvedValue(undefined),
      },
    }

    await finalizeAssistantMessageHandler(ctx as any, {
      messageId: MESSAGE_ID,
      status: 'complete',
    })

    // Should be called twice: once for message, once for session
    expect(ctx.db.patch).toHaveBeenCalledTimes(2)
    expect(ctx.db.patch).toHaveBeenCalledWith(
      SESSION_ID,
      expect.objectContaining({ updatedAt: expect.any(Number) }),
    )
  })

  it('AC-1: finalizes without content (no content override)', async () => {
    const existingMessage = {
      _id: MESSAGE_ID,
      sessionId: SESSION_ID,
      content: 'existing',
      status: 'streaming',
    }

    const ctx = {
      db: {
        get: vi.fn().mockResolvedValue(existingMessage),
        patch: vi.fn().mockResolvedValue(undefined),
      },
    }

    await finalizeAssistantMessageHandler(ctx as any, {
      messageId: MESSAGE_ID,
      status: 'complete',
    })

    const messagePatchCall = (ctx.db.patch as any).mock.calls[0]
    expect(messagePatchCall[1]).not.toHaveProperty('content')
  })
})

// ---------------------------------------------------------------------------
// piMessage extensions on existing mutations
// ---------------------------------------------------------------------------

describe('createPendingAssistantMessageHandler with piMessage', () => {
  it('persists piMessage when provided', async () => {
    const ctx = {
      db: {
        insert: vi.fn().mockResolvedValue(MESSAGE_ID),
        patch: vi.fn().mockResolvedValue(undefined),
      },
    }

    const piMessage = { role: 'assistant', content: 'hello' }
    await createPendingAssistantMessageHandler(ctx as any, {
      sessionId: SESSION_ID,
      kind: 'text',
      piMessage,
    })

    expect(ctx.db.insert).toHaveBeenCalledWith(
      'session_messages',
      expect.objectContaining({ piMessage }),
    )
  })

  it('omits piMessage from insert when not provided (back-compat)', async () => {
    const ctx = {
      db: {
        insert: vi.fn().mockResolvedValue(MESSAGE_ID),
        patch: vi.fn().mockResolvedValue(undefined),
      },
    }

    await createPendingAssistantMessageHandler(ctx as any, {
      sessionId: SESSION_ID,
      kind: 'text',
    })

    const insertCall = (ctx.db.insert as any).mock.calls[0]
    expect(insertCall[1]).not.toHaveProperty('piMessage')
  })
})

describe('finalizeAssistantMessageHandler with piMessage', () => {
  it('patches piMessage when provided', async () => {
    const ctx = {
      db: {
        get: vi.fn().mockResolvedValue({
          _id: MESSAGE_ID,
          sessionId: SESSION_ID,
          content: '',
          status: 'streaming',
        }),
        patch: vi.fn().mockResolvedValue(undefined),
      },
    }

    const piMessage = { role: 'assistant', content: 'done' }
    await finalizeAssistantMessageHandler(ctx as any, {
      messageId: MESSAGE_ID,
      status: 'complete',
      piMessage,
    })

    expect(ctx.db.patch).toHaveBeenCalledWith(
      MESSAGE_ID,
      expect.objectContaining({ piMessage, status: 'complete' }),
    )
  })

  it('does not patch piMessage when not provided', async () => {
    const ctx = {
      db: {
        get: vi.fn().mockResolvedValue({
          _id: MESSAGE_ID,
          sessionId: SESSION_ID,
          content: '',
          status: 'streaming',
        }),
        patch: vi.fn().mockResolvedValue(undefined),
      },
    }

    await finalizeAssistantMessageHandler(ctx as any, {
      messageId: MESSAGE_ID,
      status: 'complete',
    })

    const messagePatchCall = (ctx.db.patch as any).mock.calls[0]
    expect(messagePatchCall[1]).not.toHaveProperty('piMessage')
  })
})

// ---------------------------------------------------------------------------
// recordAgentTurnHandler
// ---------------------------------------------------------------------------

describe('recordAgentTurnHandler', () => {
  it('inserts agent_turn row with piMessage', async () => {
    const ctx = {
      db: {
        insert: vi.fn().mockResolvedValue(MESSAGE_ID),
      },
    }

    const piMessage = { role: 'assistant', toolCalls: [{ id: 't1' }] }
    const result = await recordAgentTurnHandler(ctx as any, {
      sessionId: SESSION_ID,
      piMessage,
    })

    expect(result).toBe(MESSAGE_ID)
    expect(ctx.db.insert).toHaveBeenCalledWith(
      'session_messages',
      expect.objectContaining({
        sessionId: SESSION_ID,
        role: 'system',
        kind: 'agent_turn',
        content: '',
        piMessage,
        createdAt: expect.any(Number),
      }),
    )
  })

  it('sets createdAt to now', async () => {
    const ctx = {
      db: {
        insert: vi.fn().mockResolvedValue(MESSAGE_ID),
      },
    }

    const before = Date.now()
    await recordAgentTurnHandler(ctx as any, {
      sessionId: SESSION_ID,
      piMessage: {},
    })
    const after = Date.now()

    const insertCall = (ctx.db.insert as any).mock.calls[0]
    expect(insertCall[1].createdAt).toBeGreaterThanOrEqual(before)
    expect(insertCall[1].createdAt).toBeLessThanOrEqual(after)
  })
})

// ---------------------------------------------------------------------------
// recordToolResultHandler
// ---------------------------------------------------------------------------

describe('recordToolResultHandler', () => {
  it('patches row with piMessage only (no kind/status/content change)', async () => {
    const ctx = {
      db: {
        patch: vi.fn().mockResolvedValue(undefined),
      },
    }

    const piMessage = { role: 'tool', content: 'result' }
    const result = await recordToolResultHandler(ctx as any, {
      messageId: MESSAGE_ID,
      piMessage,
    })

    expect(result).toBeNull()
    expect(ctx.db.patch).toHaveBeenCalledWith(MESSAGE_ID, { piMessage })

    const patchArgs = (ctx.db.patch as any).mock.calls[0][1]
    expect(patchArgs).not.toHaveProperty('kind')
    expect(patchArgs).not.toHaveProperty('status')
    expect(patchArgs).not.toHaveProperty('content')
  })
})

// ---------------------------------------------------------------------------
// recordReasoningHandler
// ---------------------------------------------------------------------------

describe('recordReasoningHandler', () => {
  it('inserts reasoning row with status=streaming', async () => {
    const ctx = {
      db: {
        insert: vi.fn().mockResolvedValue(MESSAGE_ID),
      },
    }

    const piMessage = { role: 'assistant', thought: 'reasoning...' }
    const result = await recordReasoningHandler(ctx as any, {
      sessionId: SESSION_ID,
      content: 'Thinking...',
      piMessage,
    })

    expect(result).toBe(MESSAGE_ID)
    expect(ctx.db.insert).toHaveBeenCalledWith(
      'session_messages',
      expect.objectContaining({
        sessionId: SESSION_ID,
        role: 'system',
        kind: 'reasoning',
        content: 'Thinking...',
        status: 'streaming',
        piMessage,
        createdAt: expect.any(Number),
      }),
    )
  })
})

// ---------------------------------------------------------------------------
// appendReasoningChunkHandler
// ---------------------------------------------------------------------------

describe('appendReasoningChunkHandler', () => {
  it('concatenates delta to existing content', async () => {
    const ctx = {
      db: {
        get: vi.fn().mockResolvedValue({
          _id: MESSAGE_ID,
          content: 'Hello',
        }),
        patch: vi.fn().mockResolvedValue(undefined),
      },
    }

    const result = await appendReasoningChunkHandler(ctx as any, {
      messageId: MESSAGE_ID,
      delta: ' world',
    })

    expect(result).toBeNull()
    expect(ctx.db.patch).toHaveBeenCalledWith(
      MESSAGE_ID,
      expect.objectContaining({ content: 'Hello world' }),
    )
  })

  it('throws SESSION_NOT_FOUND when message missing', async () => {
    const ctx = {
      db: {
        get: vi.fn().mockResolvedValue(null),
        patch: vi.fn(),
      },
    }

    await expect(
      appendReasoningChunkHandler(ctx as any, {
        messageId: MESSAGE_ID,
        delta: ' x',
      }),
    ).rejects.toThrow(ConvexError)
    await expect(
      appendReasoningChunkHandler(ctx as any, {
        messageId: MESSAGE_ID,
        delta: ' x',
      }),
    ).rejects.toThrow(ERROR_CODES.SESSION_NOT_FOUND)
  })

  it('does NOT change status', async () => {
    const ctx = {
      db: {
        get: vi.fn().mockResolvedValue({
          _id: MESSAGE_ID,
          content: 'x',
          status: 'streaming',
        }),
        patch: vi.fn().mockResolvedValue(undefined),
      },
    }

    await appendReasoningChunkHandler(ctx as any, {
      messageId: MESSAGE_ID,
      delta: 'y',
    })

    const patchCall = (ctx.db.patch as any).mock.calls[0]
    expect(patchCall[1]).not.toHaveProperty('status')
  })
})

// ---------------------------------------------------------------------------
// listWithPiMessagesHandler
// ---------------------------------------------------------------------------

describe('listWithPiMessagesHandler', () => {
  it('returns messages ordered by createdAt ascending', async () => {
    const now = Date.now()
    const messages = [
      {
        _id: 'msg3' as Id<'session_messages'>,
        _creationTime: 3000,
        sessionId: SESSION_ID,
        role: 'system',
        content: 'third',
        createdAt: now,
      },
      {
        _id: 'msg1' as Id<'session_messages'>,
        _creationTime: 1000,
        sessionId: SESSION_ID,
        role: 'rider',
        content: 'first',
        createdAt: now - 2000,
      },
      {
        _id: 'msg2' as Id<'session_messages'>,
        _creationTime: 2000,
        sessionId: SESSION_ID,
        role: 'system',
        content: 'second',
        kind: 'agent_turn',
        piMessage: { role: 'assistant' },
        createdAt: now - 1000,
      },
    ]

    const ctx = {
      db: {
        query: vi.fn().mockReturnValue({
          withIndex: vi.fn().mockReturnValue({
            filter: vi.fn().mockReturnValue({
              collect: vi.fn().mockResolvedValue(messages),
            }),
          }),
        }),
      },
    }

    const result = await listWithPiMessagesHandler(ctx as any, {
      sessionId: SESSION_ID,
    })

    expect(result).toHaveLength(3)
    expect(result[0]._id).toBe('msg1')
    expect(result[1]._id).toBe('msg2')
    expect(result[1].piMessage).toEqual({ role: 'assistant' })
    expect(result[2]._id).toBe('msg3')
  })

  it('returns empty array when no messages', async () => {
    const ctx = {
      db: {
        query: vi.fn().mockReturnValue({
          withIndex: vi.fn().mockReturnValue({
            filter: vi.fn().mockReturnValue({
              collect: vi.fn().mockResolvedValue([]),
            }),
          }),
        }),
      },
    }

    const result = await listWithPiMessagesHandler(ctx as any, {
      sessionId: SESSION_ID,
    })

    expect(result).toEqual([])
  })
})
