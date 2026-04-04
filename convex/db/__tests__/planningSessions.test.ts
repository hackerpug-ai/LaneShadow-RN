/**
 * Tests for planningSessions.ts CRUD operations.
 *
 * These tests exercise behavior via exported handler functions that can be
 * unit-tested without a running Convex backend.
 */

import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { ConvexError } from 'convex/values'

import { ERROR_CODES } from '../../errors'
import type { Id } from '../../_generated/dataModel'
import {
  createSessionHandler,
  listSessionsHandler,
  getSessionByIdHandler,
  archiveSessionHandler,
} from '../planningSessions'

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------

const CLERK_USER_ID = 'user_test_123'
const SESSION_ID = 'session_abc' as Id<'planning_sessions'>

const makeSessionDoc = (overrides: Record<string, unknown> = {}) => ({
  _id: SESSION_ID,
  _creationTime: 1000,
  clerkUserId: CLERK_USER_ID,
  title: 'Test session',
  status: 'active',
  createdAt: Date.now() - 5000,
  updatedAt: Date.now() - 5000,
  ...overrides,
})

// ---------------------------------------------------------------------------
// AC-1: createSession inserts a new record with status='active'
// ---------------------------------------------------------------------------

describe('createSessionHandler', () => {
  it('AC-1: inserts session with status=active and returns sessionId', async () => {
    const ctx = {
      db: {
        insert: vi.fn().mockResolvedValue(SESSION_ID),
      },
    }

    const firstMessage = 'I want to plan a ride from downtown to the airport with multiple stops'

    const result = await createSessionHandler(
      ctx as any,
      { firstMessage },
      CLERK_USER_ID
    )

    expect(ctx.db.insert).toHaveBeenCalledWith(
      'planning_sessions',
      expect.objectContaining({
        clerkUserId: CLERK_USER_ID,
        status: 'active',
        title: firstMessage.slice(0, 50),
      })
    )
    expect(result).toEqual({ sessionId: SESSION_ID })
  })

  it('AC-1: truncates title to first 50 characters', async () => {
    const ctx = {
      db: {
        insert: vi.fn().mockResolvedValue(SESSION_ID),
      },
    }

    const longMessage = 'This is a very long message that exceeds fifty characters and should be truncated'

    await createSessionHandler(ctx as any, { firstMessage: longMessage }, CLERK_USER_ID)

    expect(ctx.db.insert).toHaveBeenCalledWith(
      'planning_sessions',
      expect.objectContaining({
        title: longMessage.slice(0, 50),
      })
    )
  })
})

// ---------------------------------------------------------------------------
// AC-2: listSessions returns sessions ordered by updatedAt desc
// ---------------------------------------------------------------------------

describe('listSessionsHandler', () => {
  it('AC-2: returns sessions in updatedAt descending order', async () => {
    const now = Date.now()
    const sessions = [
      makeSessionDoc({
        _id: 'session1' as Id<'planning_sessions'>,
        updatedAt: now - 2000,
      }),
      makeSessionDoc({
        _id: 'session2' as Id<'planning_sessions'>,
        updatedAt: now - 1000,
      }),
      makeSessionDoc({
        _id: 'session3' as Id<'planning_sessions'>,
        updatedAt: now,
      }),
    ]

    const ctx = {
      db: {
        query: vi.fn().mockReturnValue({
          withIndex: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              collect: vi.fn().mockResolvedValue([
                sessions[2], // session3 (newest)
                sessions[1], // session2
                sessions[0], // session1 (oldest)
              ]),
            }),
          }),
        }),
      },
    }

    const result = await listSessionsHandler(ctx as any, CLERK_USER_ID)

    expect(result).toHaveLength(3)
    expect(result[0]._id).toBe('session3') // Newest (highest updatedAt)
    expect(result[1]._id).toBe('session2')
    expect(result[2]._id).toBe('session1') // Oldest (lowest updatedAt)
  })

  it('AC-2: returns empty array when user has no sessions', async () => {
    const ctx = {
      db: {
        query: vi.fn().mockReturnValue({
          withIndex: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              collect: vi.fn().mockResolvedValue([]),
            }),
          }),
        }),
      },
    }

    const result = await listSessionsHandler(ctx as any, CLERK_USER_ID)

    expect(result).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// AC-3: getSessionById returns session for owner, throws for non-owner
// ---------------------------------------------------------------------------

describe('getSessionByIdHandler', () => {
  it('AC-3: returns session when owned by requesting user', async () => {
    const session = makeSessionDoc()
    const ctx = {
      db: {
        get: vi.fn().mockResolvedValue(session),
      },
    }

    const result = await getSessionByIdHandler(
      ctx as any,
      { sessionId: SESSION_ID },
      CLERK_USER_ID
    )

    expect(result).toEqual(session)
  })

  it('AC-3: throws SESSION_NOT_FOUND when session does not exist', async () => {
    const ctx = {
      db: {
        get: vi.fn().mockResolvedValue(null),
      },
    }

    await expect(
      getSessionByIdHandler(ctx as any, { sessionId: SESSION_ID }, CLERK_USER_ID)
    ).rejects.toThrow(ConvexError)

    await expect(
      getSessionByIdHandler(ctx as any, { sessionId: SESSION_ID }, CLERK_USER_ID)
    ).rejects.toThrow(ERROR_CODES.SESSION_NOT_FOUND)
  })

  it('AC-3: throws SESSION_NOT_FOUND when session is owned by a different user', async () => {
    const session = makeSessionDoc({ clerkUserId: 'other_user_456' })
    const ctx = {
      db: {
        get: vi.fn().mockResolvedValue(session),
      },
    }

    await expect(
      getSessionByIdHandler(ctx as any, { sessionId: SESSION_ID }, CLERK_USER_ID)
    ).rejects.toThrow(ERROR_CODES.SESSION_NOT_FOUND)
  })
})

// ---------------------------------------------------------------------------
// AC-4: archiveSession changes status to archived
// ---------------------------------------------------------------------------

describe('archiveSessionHandler', () => {
  it('AC-4: changes status to archived and updates updatedAt', async () => {
    const session = makeSessionDoc({ status: 'active' })
    const ctx = {
      db: {
        get: vi.fn().mockResolvedValue(session),
        patch: vi.fn().mockResolvedValue(undefined),
      },
    }

    await archiveSessionHandler(ctx as any, { sessionId: SESSION_ID }, CLERK_USER_ID)

    expect(ctx.db.patch).toHaveBeenCalledWith(
      SESSION_ID,
      expect.objectContaining({
        status: 'archived',
        updatedAt: expect.any(Number),
      })
    )
  })

  it('AC-4: throws SESSION_NOT_FOUND when session does not exist', async () => {
    const ctx = {
      db: {
        get: vi.fn().mockResolvedValue(null),
        patch: vi.fn(),
      },
    }

    await expect(
      archiveSessionHandler(ctx as any, { sessionId: SESSION_ID }, CLERK_USER_ID)
    ).rejects.toThrow(ERROR_CODES.SESSION_NOT_FOUND)
  })

  it('AC-4: throws SESSION_NOT_FOUND when session belongs to another user', async () => {
    const session = makeSessionDoc({ clerkUserId: 'other_user_789' })
    const ctx = {
      db: {
        get: vi.fn().mockResolvedValue(session),
        patch: vi.fn(),
      },
    }

    await expect(
      archiveSessionHandler(ctx as any, { sessionId: SESSION_ID }, CLERK_USER_ID)
    ).rejects.toThrow(ERROR_CODES.SESSION_NOT_FOUND)
  })

  it('AC-4: updates updatedAt timestamp when archiving', async () => {
    const oldTimestamp = Date.now() - 10000
    const session = makeSessionDoc({
      status: 'active',
      updatedAt: oldTimestamp,
    })
    const ctx = {
      db: {
        get: vi.fn().mockResolvedValue(session),
        patch: vi.fn().mockResolvedValue(undefined),
      },
    }

    await archiveSessionHandler(ctx as any, { sessionId: SESSION_ID }, CLERK_USER_ID)

    const patchCall = (ctx.db.patch as any).mock.calls[0]
    const newUpdatedAt = patchCall[1].updatedAt

    expect(newUpdatedAt).toBeGreaterThan(oldTimestamp)
  })
})
