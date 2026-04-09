/**
 * Tests for thinking card lifecycle mutations (US-056).
 *
 * Exercises createThinkingCard, appendThinkingText, appendThinkingStep,
 * and finalizeThinkingCard via exported handler functions.
 */

import { vi, describe, it, expect } from 'vitest'
import { ConvexError } from 'convex/values'
import type { Id } from '../../_generated/dataModel'
import {
  createThinkingCardHandler,
  appendThinkingTextHandler,
  appendThinkingStepHandler,
  finalizeThinkingCardHandler,
} from '../sessionMessages'
import { ERROR_CODES } from '../../errors'

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------

const SESSION_ID = 'session_abc' as Id<'planning_sessions'>
const MESSAGE_ID = 'msg_123' as Id<'session_messages'>

// ---------------------------------------------------------------------------
// AC-1: createThinkingCard creates row with correct initial state
// ---------------------------------------------------------------------------

describe('createThinkingCardHandler', () => {
  it('AC-1: creates thinking_card row with status streaming, empty content, empty steps', async () => {
    const ctx = {
      db: {
        insert: vi.fn().mockResolvedValue(MESSAGE_ID),
        patch: vi.fn().mockResolvedValue(undefined),
      },
    }

    const result = await createThinkingCardHandler(ctx as any, {
      sessionId: SESSION_ID,
    })

    expect(result).toEqual({ messageId: MESSAGE_ID })
    expect(ctx.db.insert).toHaveBeenCalledWith(
      'session_messages',
      expect.objectContaining({
        sessionId: SESSION_ID,
        role: 'system',
        content: '',
        kind: 'thinking_card',
        status: 'streaming',
        thinkingSteps: [],
        createdAt: expect.any(Number),
      })
    )
  })

  it('AC-6: returns messageId object', async () => {
    const ctx = {
      db: {
        insert: vi.fn().mockResolvedValue(MESSAGE_ID),
        patch: vi.fn().mockResolvedValue(undefined),
      },
    }

    const result = await createThinkingCardHandler(ctx as any, {
      sessionId: SESSION_ID,
    })

    expect(result).toHaveProperty('messageId')
    expect(result.messageId).toBe(MESSAGE_ID)
  })
})

// ---------------------------------------------------------------------------
// AC-2: appendThinkingText appends delta to content
// ---------------------------------------------------------------------------

describe('appendThinkingTextHandler', () => {
  it('AC-2: appends delta to existing content', async () => {
    const existingMessage = {
      _id: MESSAGE_ID,
      _creationTime: 1000,
      sessionId: SESSION_ID,
      role: 'system' as const,
      content: 'Hello',
      kind: 'thinking_card',
      status: 'streaming',
      thinkingSteps: [],
      createdAt: Date.now() - 1000,
    }

    const ctx = {
      db: {
        get: vi.fn().mockResolvedValue(existingMessage),
        patch: vi.fn().mockResolvedValue(undefined),
      },
    }

    const result = await appendThinkingTextHandler(ctx as any, {
      messageId: MESSAGE_ID,
      delta: ' world',
    })

    expect(result).toBeNull()
    expect(ctx.db.patch).toHaveBeenCalledWith(
      MESSAGE_ID,
      expect.objectContaining({ content: 'Hello world' })
    )
  })

  it('AC-2: appends to empty content', async () => {
    const existingMessage = {
      _id: MESSAGE_ID,
      content: '',
      kind: 'thinking_card',
      status: 'streaming',
      thinkingSteps: [],
    }

    const ctx = {
      db: {
        get: vi.fn().mockResolvedValue(existingMessage),
        patch: vi.fn().mockResolvedValue(undefined),
      },
    }

    await appendThinkingTextHandler(ctx as any, {
      messageId: MESSAGE_ID,
      delta: 'first',
    })

    expect(ctx.db.patch).toHaveBeenCalledWith(
      MESSAGE_ID,
      expect.objectContaining({ content: 'first' })
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
      appendThinkingTextHandler(ctx as any, {
        messageId: MESSAGE_ID,
        delta: 'x',
      })
    ).rejects.toThrow(ConvexError)
    await expect(
      appendThinkingTextHandler(ctx as any, {
        messageId: MESSAGE_ID,
        delta: 'x',
      })
    ).rejects.toThrow(ERROR_CODES.SESSION_NOT_FOUND)
  })
})

// ---------------------------------------------------------------------------
// AC-3 & AC-4: appendThinkingStep adds steps to array
// ---------------------------------------------------------------------------

describe('appendThinkingStepHandler', () => {
  it('AC-3: appends first step to empty array', async () => {
    const existingMessage = {
      _id: MESSAGE_ID,
      _creationTime: 1000,
      sessionId: SESSION_ID,
      role: 'system' as const,
      content: '',
      kind: 'thinking_card',
      status: 'streaming',
      thinkingSteps: [],
      createdAt: Date.now() - 1000,
    }

    const ctx = {
      db: {
        get: vi.fn().mockResolvedValue(existingMessage),
        patch: vi.fn().mockResolvedValue(undefined),
      },
    }

    const step = {
      type: 'thinking' as const,
      summary: 'Analyzing route',
      timestamp: Date.now(),
    }

    const result = await appendThinkingStepHandler(ctx as any, {
      messageId: MESSAGE_ID,
      step,
    })

    expect(result).toBeNull()
    expect(ctx.db.patch).toHaveBeenCalledWith(
      MESSAGE_ID,
      expect.objectContaining({
        thinkingSteps: [step],
      })
    )
  })

  it('AC-4: appends step to existing array (3 steps → 4 steps)', async () => {
    const existingSteps = [
      { type: 'thinking' as const, summary: 'Step 1', timestamp: 1000 },
      { type: 'tool_start' as const, toolName: 'search', summary: 'Step 2', timestamp: 2000 },
      { type: 'tool_finish' as const, toolName: 'search', summary: 'Step 3', timestamp: 3000 },
    ]

    const existingMessage = {
      _id: MESSAGE_ID,
      thinkingSteps: existingSteps,
    }

    const ctx = {
      db: {
        get: vi.fn().mockResolvedValue(existingMessage),
        patch: vi.fn().mockResolvedValue(undefined),
      },
    }

    const newStep = {
      type: 'thinking' as const,
      summary: 'Step 4',
      timestamp: 4000,
    }

    await appendThinkingStepHandler(ctx as any, {
      messageId: MESSAGE_ID,
      step: newStep,
    })

    expect(ctx.db.patch).toHaveBeenCalledWith(
      MESSAGE_ID,
      expect.objectContaining({
        thinkingSteps: [...existingSteps, newStep],
      })
    )
  })

  it('AC-4: preserves order of steps', async () => {
    let currentSteps: any[] = []

    const ctx = {
      db: {
        get: vi.fn().mockImplementation(async () => ({
          _id: MESSAGE_ID,
          thinkingSteps: currentSteps,
        })),
        patch: vi.fn().mockImplementation(async (_id: any, fields: any) => {
          if (fields.thinkingSteps !== undefined) {
            currentSteps = fields.thinkingSteps
          }
        }),
      },
    }

    const step1 = { type: 'thinking' as const, summary: 'First', timestamp: 1000 }
    const step2 = { type: 'thinking' as const, summary: 'Second', timestamp: 2000 }
    const step3 = { type: 'thinking' as const, summary: 'Third', timestamp: 3000 }

    await appendThinkingStepHandler(ctx as any, { messageId: MESSAGE_ID, step: step1 })
    await appendThinkingStepHandler(ctx as any, { messageId: MESSAGE_ID, step: step2 })
    await appendThinkingStepHandler(ctx as any, { messageId: MESSAGE_ID, step: step3 })

    expect(currentSteps).toHaveLength(3)
    expect(currentSteps[0].summary).toBe('First')
    expect(currentSteps[1].summary).toBe('Second')
    expect(currentSteps[2].summary).toBe('Third')
  })

  it('throws SESSION_NOT_FOUND when message missing', async () => {
    const ctx = {
      db: {
        get: vi.fn().mockResolvedValue(null),
        patch: vi.fn(),
      },
    }

    await expect(
      appendThinkingStepHandler(ctx as any, {
        messageId: MESSAGE_ID,
        step: { type: 'thinking' as const, summary: 'test', timestamp: Date.now() },
      })
    ).rejects.toThrow(ConvexError)
    await expect(
      appendThinkingStepHandler(ctx as any, {
        messageId: MESSAGE_ID,
        step: { type: 'thinking' as const, summary: 'test', timestamp: Date.now() },
      })
    ).rejects.toThrow(ERROR_CODES.SESSION_NOT_FOUND)
  })
})

// ---------------------------------------------------------------------------
// AC-5: finalizeThinkingCard sets status to complete
// ---------------------------------------------------------------------------

describe('finalizeThinkingCardHandler', () => {
  it('AC-5: sets status to complete', async () => {
    const existingMessage = {
      _id: MESSAGE_ID,
      _creationTime: 1000,
      sessionId: SESSION_ID,
      role: 'system' as const,
      content: 'Thinking complete',
      kind: 'thinking_card',
      status: 'streaming',
      thinkingSteps: [],
      createdAt: Date.now() - 1000,
    }

    const ctx = {
      db: {
        get: vi.fn().mockResolvedValue(existingMessage),
        patch: vi.fn().mockResolvedValue(undefined),
      },
    }

    const result = await finalizeThinkingCardHandler(ctx as any, {
      messageId: MESSAGE_ID,
    })

    expect(result).toBeNull()
    expect(ctx.db.patch).toHaveBeenCalledWith(
      MESSAGE_ID,
      expect.objectContaining({ status: 'complete' })
    )
  })

  it('updates parent session updatedAt', async () => {
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

    await finalizeThinkingCardHandler(ctx as any, {
      messageId: MESSAGE_ID,
    })

    // Should be called twice: once for message, once for session
    expect(ctx.db.patch).toHaveBeenCalledTimes(2)
    expect(ctx.db.patch).toHaveBeenCalledWith(
      SESSION_ID,
      expect.objectContaining({ updatedAt: expect.any(Number) })
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
      finalizeThinkingCardHandler(ctx as any, {
        messageId: MESSAGE_ID,
      })
    ).rejects.toThrow(ConvexError)
    await expect(
      finalizeThinkingCardHandler(ctx as any, {
        messageId: MESSAGE_ID,
      })
    ).rejects.toThrow(ERROR_CODES.SESSION_NOT_FOUND)
  })
})
