/**
 * Tests for sessionMessages.ts CRUD operations.
 *
 * These tests exercise behavior via exported handler functions that can be
 * unit-tested without a running Convex backend.
 */

import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { ConvexError } from 'convex/values'

import { ERROR_CODES } from '../../../errors'
import type { Id } from '../../../_generated/dataModel'
import {
  sendHandler,
  listHandler,
  addSystemMessageHandler,
} from '../../sessionMessages'

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------

const CLERK_USER_ID = 'user_test_123'
const SESSION_ID = 'session_abc' as Id<'planning_sessions'>
const OTHER_SESSION_ID = 'session_xyz' as Id<'planning_sessions'>
const MESSAGE_ID = 'msg_123' as Id<'session_messages'>
const ROUTE_PLAN_ID = 'route_456' as Id<'route_plans'>

const makeSessionDoc = (overrides: Record<string, unknown> = {}) => ({
  _id: SESSION_ID,
  _creationTime: 1000,
  clerkUserId: CLERK_USER_ID,
  title: 'Test session',
  status: 'active' as const,
  createdAt: Date.now() - 5000,
  updatedAt: Date.now() - 5000,
  ...overrides,
})

const makeMessageDoc = (overrides: Record<string, unknown> = {}) => ({
  _id: MESSAGE_ID,
  _creationTime: 1000,
  sessionId: SESSION_ID,
  role: 'rider' as const,
  content: 'Test message',
  createdAt: Date.now() - 3000,
  ...overrides,
})

// ---------------------------------------------------------------------------
// AC-1: send creates rider message and bumps session updatedAt
// ---------------------------------------------------------------------------

describe('sendHandler', () => {
  it('AC-2: throws SESSION_NOT_FOUND when sending to another user session', async () => {
    const otherUserId = 'other_user_789'
    const session = makeSessionDoc({ clerkUserId: otherUserId })
    const ctx = {
      db: {
        get: vi.fn().mockResolvedValue(session),
        insert: vi.fn(),
        patch: vi.fn(),
      },
    }

    await expect(
      sendHandler(
        ctx as any,
        { sessionId: SESSION_ID, content: 'Test message' },
        CLERK_USER_ID
      )
    ).rejects.toThrow(ConvexError)

    await expect(
      sendHandler(
        ctx as any,
        { sessionId: SESSION_ID, content: 'Test message' },
        CLERK_USER_ID
      )
    ).rejects.toThrow(ERROR_CODES.SESSION_NOT_FOUND)

    // Verify message was NOT inserted
    expect(ctx.db.insert).not.toHaveBeenCalled()
  })

  it('AC-1: creates rider message and bumps session updatedAt', async () => {
    const session = makeSessionDoc()
    const ctx = {
      db: {
        get: vi.fn().mockResolvedValue(session),
        insert: vi.fn().mockResolvedValue(MESSAGE_ID),
        patch: vi.fn().mockResolvedValue(undefined),
      },
    }

    const content = 'I want to plan a scenic route'

    const result = await sendHandler(
      ctx as any,
      { sessionId: SESSION_ID, content },
      CLERK_USER_ID
    )

    // Verify message was inserted with rider role
    expect(ctx.db.insert).toHaveBeenCalledWith(
      'session_messages',
      expect.objectContaining({
        sessionId: SESSION_ID,
        role: 'rider',
        content,
      })
    )

    // Verify session updatedAt was bumped
    expect(ctx.db.patch).toHaveBeenCalledWith(
      SESSION_ID,
      expect.objectContaining({
        updatedAt: expect.any(Number),
      })
    )

    expect(result).toEqual({ messageId: MESSAGE_ID })
  })

  it('AC-1: throws SESSION_NOT_FOUND when session does not exist', async () => {
    const ctx = {
      db: {
        get: vi.fn().mockResolvedValue(null),
        insert: vi.fn(),
        patch: vi.fn(),
      },
    }

    await expect(
      sendHandler(
        ctx as any,
        { sessionId: SESSION_ID, content: 'Test' },
        CLERK_USER_ID
      )
    ).rejects.toThrow(ConvexError)

    await expect(
      sendHandler(
        ctx as any,
        { sessionId: SESSION_ID, content: 'Test' },
        CLERK_USER_ID
      )
    ).rejects.toThrow(ERROR_CODES.SESSION_NOT_FOUND)
  })

  it('AC-1: throws SESSION_NOT_FOUND when session belongs to another user', async () => {
    const session = makeSessionDoc({ clerkUserId: 'other_user_789' })
    const ctx = {
      db: {
        get: vi.fn().mockResolvedValue(session),
        insert: vi.fn(),
        patch: vi.fn(),
      },
    }

    await expect(
      sendHandler(
        ctx as any,
        { sessionId: SESSION_ID, content: 'Test' },
        CLERK_USER_ID
      )
    ).rejects.toThrow(ERROR_CODES.SESSION_NOT_FOUND)
  })

  it('AC-1: sets createdAt timestamp on message', async () => {
    const session = makeSessionDoc()
    const ctx = {
      db: {
        get: vi.fn().mockResolvedValue(session),
        insert: vi.fn().mockResolvedValue(MESSAGE_ID),
        patch: vi.fn().mockResolvedValue(undefined),
      },
    }

    const beforeTime = Date.now()
    await sendHandler(
      ctx as any,
      { sessionId: SESSION_ID, content: 'Test' },
      CLERK_USER_ID
    )
    const afterTime = Date.now()

    const insertCall = (ctx.db.insert as vi.Mock).mock.calls[0]
    const createdAt = insertCall[1].createdAt

    expect(createdAt).toBeGreaterThanOrEqual(beforeTime)
    expect(createdAt).toBeLessThanOrEqual(afterTime)
  })
})

// ---------------------------------------------------------------------------
// AC-2: list returns messages ordered by createdAt ascending
// ---------------------------------------------------------------------------

describe('listHandler', () => {
  it('AC-3: returns messages when user owns the session', async () => {
    const now = Date.now()
    const messages = [
      makeMessageDoc({
        _id: 'msg1' as Id<'session_messages'>,
        createdAt: now - 1000,
        content: 'User message',
      }),
    ]

    const ctx = {
      db: {
        get: vi.fn().mockResolvedValue(makeSessionDoc({ clerkUserId: CLERK_USER_ID })),
        query: vi.fn().mockReturnValue({
          withIndex: vi.fn().mockReturnValue({
            filter: vi.fn().mockReturnValue({
              collect: vi.fn().mockResolvedValue(messages),
            }),
          }),
        }),
      },
    }

    const result = await listHandler(ctx as any, { sessionId: SESSION_ID }, CLERK_USER_ID)

    expect(result).toHaveLength(1)
    expect(result[0]._id).toBe('msg1')
    expect(result[0].content).toBe('User message')
    // Verify session ownership was checked
    expect(ctx.db.get).toHaveBeenCalledWith(SESSION_ID)
  })

  it('AC-1: throws SESSION_NOT_FOUND when session belongs to another user', async () => {
    const otherUserId = 'other_user_789'
    const session = makeSessionDoc({ clerkUserId: otherUserId })
    const messages = [
      makeMessageDoc({
        content: 'Private message',
      }),
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
        get: vi.fn().mockResolvedValue(session),
      },
    }

    await expect(
      listHandler(ctx as any, { sessionId: SESSION_ID }, CLERK_USER_ID)
    ).rejects.toThrow(ConvexError)

    await expect(
      listHandler(ctx as any, { sessionId: SESSION_ID }, CLERK_USER_ID)
    ).rejects.toThrow(ERROR_CODES.SESSION_NOT_FOUND)
  })

  it('AC-2: returns messages in createdAt ascending order', async () => {
    const now = Date.now()
    const messages = [
      makeMessageDoc({
        _id: 'msg1' as Id<'session_messages'>,
        createdAt: now - 2000,
        content: 'First message',
      }),
      makeMessageDoc({
        _id: 'msg2' as Id<'session_messages'>,
        createdAt: now - 1000,
        content: 'Second message',
      }),
      makeMessageDoc({
        _id: 'msg3' as Id<'session_messages'>,
        createdAt: now,
        content: 'Third message',
      }),
    ]

    const ctx = {
      db: {
        get: vi.fn().mockResolvedValue(makeSessionDoc()),
        query: vi.fn().mockReturnValue({
          withIndex: vi.fn().mockReturnValue({
            filter: vi.fn().mockReturnValue({
              collect: vi.fn().mockResolvedValue(messages),
            }),
          }),
        }),
      },
    }

    const result = await listHandler(ctx as any, { sessionId: SESSION_ID }, CLERK_USER_ID)

    expect(result).toHaveLength(3)
    expect(result[0]._id).toBe('msg1') // Oldest (lowest createdAt)
    expect(result[0].content).toBe('First message')
    expect(result[1]._id).toBe('msg2')
    expect(result[1].content).toBe('Second message')
    expect(result[2]._id).toBe('msg3') // Newest (highest createdAt)
    expect(result[2].content).toBe('Third message')
  })

  it('AC-2: returns empty array when session has no messages', async () => {
    const ctx = {
      db: {
        get: vi.fn().mockResolvedValue(makeSessionDoc()),
        query: vi.fn().mockReturnValue({
          withIndex: vi.fn().mockReturnValue({
            filter: vi.fn().mockReturnValue({
              collect: vi.fn().mockResolvedValue([]),
            }),
          }),
        }),
      },
    }

    const result = await listHandler(ctx as any, { sessionId: SESSION_ID }, CLERK_USER_ID)

    expect(result).toEqual([])
  })

  it('AC-2: returns messages for specific sessionId only', async () => {
    const messages = [
      makeMessageDoc({
        _id: 'msg1' as Id<'session_messages'>,
        sessionId: SESSION_ID,
        content: 'Session 1 message',
      }),
    ]

    const ctx = {
      db: {
        get: vi.fn().mockResolvedValue(makeSessionDoc()),
        query: vi.fn().mockReturnValue({
          withIndex: vi.fn().mockReturnValue({
            filter: vi.fn().mockReturnValue({
              collect: vi.fn().mockResolvedValue(messages),
            }),
          }),
        }),
      },
    }

    const result = await listHandler(ctx as any, { sessionId: SESSION_ID }, CLERK_USER_ID)

    expect(result).toHaveLength(1)
    expect(result[0]._id).toBe('msg1')
    expect(result[0].sessionId).toBe(SESSION_ID)
  })
})

// ---------------------------------------------------------------------------
// AC-3: addSystemMessage stores attachments correctly
// ---------------------------------------------------------------------------

describe('addSystemMessageHandler', () => {
  it('AC-3: creates system message with route attachment', async () => {
    const ctx = {
      db: {
        insert: vi.fn().mockResolvedValue(MESSAGE_ID),
        patch: vi.fn().mockResolvedValue(undefined),
      },
    }

    const attachments = [
      {
        type: 'route_options' as const,
        routePlanId: ROUTE_PLAN_ID,
      },
    ]

    await addSystemMessageHandler(ctx as any, {
      sessionId: SESSION_ID,
      content: 'Here are your route options',
      attachments,
    })

    expect(ctx.db.insert).toHaveBeenCalledWith(
      'session_messages',
      expect.objectContaining({
        sessionId: SESSION_ID,
        role: 'system',
        content: 'Here are your route options',
        attachments,
      })
    )

    // Verify session updatedAt was bumped
    expect(ctx.db.patch).toHaveBeenCalledWith(
      SESSION_ID,
      expect.objectContaining({
        updatedAt: expect.any(Number),
      })
    )
  })

  it('AC-3: creates system message without attachments', async () => {
    const ctx = {
      db: {
        insert: vi.fn().mockResolvedValue(MESSAGE_ID),
        patch: vi.fn().mockResolvedValue(undefined),
      },
    }

    await addSystemMessageHandler(ctx as any, {
      sessionId: SESSION_ID,
      content: 'Processing your request...',
      attachments: undefined,
    })

    expect(ctx.db.insert).toHaveBeenCalledWith(
      'session_messages',
      expect.objectContaining({
        sessionId: SESSION_ID,
        role: 'system',
        content: 'Processing your request...',
        attachments: undefined,
      })
    )
  })

  it('AC-3: creates system message with multiple attachments', async () => {
    const ctx = {
      db: {
        insert: vi.fn().mockResolvedValue(MESSAGE_ID),
        patch: vi.fn().mockResolvedValue(undefined),
      },
    }

    const attachments = [
      {
        type: 'route_options' as const,
        routePlanId: 'route1' as Id<'route_plans'>,
      },
      {
        type: 'route_options' as const,
        routePlanId: 'route2' as Id<'route_plans'>,
      },
    ]

    await addSystemMessageHandler(ctx as any, {
      sessionId: SESSION_ID,
      content: 'Multiple route options',
      attachments,
    })

    expect(ctx.db.insert).toHaveBeenCalledWith(
      'session_messages',
      expect.objectContaining({
        attachments: expect.arrayContaining([
          expect.objectContaining({
            type: 'route_options',
            routePlanId: 'route1' as Id<'route_plans'>,
          }),
          expect.objectContaining({
            type: 'route_options',
            routePlanId: 'route2' as Id<'route_plans'>,
          }),
        ]),
      })
    )
  })

  it('AC-3: sets createdAt timestamp on system message', async () => {
    const ctx = {
      db: {
        insert: vi.fn().mockResolvedValue(MESSAGE_ID),
        patch: vi.fn().mockResolvedValue(undefined),
      },
    }

    const beforeTime = Date.now()
    await addSystemMessageHandler(ctx as any, {
      sessionId: SESSION_ID,
      content: 'System message',
      attachments: undefined,
    })
    const afterTime = Date.now()

    const insertCall = (ctx.db.insert as vi.Mock).mock.calls[0]
    const createdAt = insertCall[1].createdAt

    expect(createdAt).toBeGreaterThanOrEqual(beforeTime)
    expect(createdAt).toBeLessThanOrEqual(afterTime)
  })
})
