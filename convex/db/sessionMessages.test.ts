/**
 * Tests for sessionMessages.ts lifecycle mutations (task #228).
 *
 * Exercises createPendingAssistantMessage, finalizeAssistantMessage,
 * and appendStreamingChunk via exported handler functions.
 */

import { vi, describe, it, expect } from 'vitest'
import type { Id } from '../_generated/dataModel'
import {
  createPendingAssistantMessageHandler,
  finalizeAssistantMessageHandler,
  appendStreamingChunkHandler,
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
      })
    )
    expect(ctx.db.patch).toHaveBeenCalledWith(
      SESSION_ID,
      expect.objectContaining({ updatedAt: expect.any(Number) })
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
      })
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
      })
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
      expect.objectContaining({ content: 'Hello world' })
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
      })
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
      expect.objectContaining({ status: 'failed' })
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
      expect.objectContaining({ updatedAt: expect.any(Number) })
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
