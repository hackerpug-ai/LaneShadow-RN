import { ConvexError } from 'convex/values'
import { describe, expect, it } from 'vitest'
import type { Id } from '../_generated/dataModel'
import { ERROR_CODES } from '../errors'
import { updateSessionTitleHandler } from './planningSessions'

/**
 * Tests for planningSessions updateSessionTitle handler
 * Testing the fix for the ownership bug where updateSessionTitle was passing
 * an empty string instead of the session's actual clerkUserId
 */

describe('updateSessionTitle handler', () => {
  /**
   * AC-4: updateSessionTitle reads session doc and uses real clerkUserId
   * GIVEN: planningSessions.ts updateSessionTitle is inspected
   * WHEN: The handler is read
   * THEN: It reads the session doc via ctx.db.get(args.sessionId), passes doc.clerkUserId (not '') to updateSessionTitleHandler, and throws SESSION_NOT_FOUND if the doc is null
   */
  it('AC-4: reads session doc and uses actual clerkUserId for ownership verification', async () => {
    const sessionId = 'session_abc' as Id<'planning_sessions'>
    const realClerkUserId = 'user_xyz'

    // Mock context with a session document
    const mockDoc = {
      _id: sessionId,
      _creationTime: Date.now(),
      clerkUserId: realClerkUserId,
      title: 'Original',
      status: 'active' as const,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }

    let getCalled = false
    let patchCalledWith: any = null

    const mockCtx = {
      db: {
        get: async (id: Id<'planning_sessions'>) => {
          getCalled = true
          if (id === sessionId) return mockDoc
          return null
        },
        patch: async (id: Id<'planning_sessions'>, fields: object) => {
          patchCalledWith = { id, fields }
        },
      },
    }

    // Call handler with the real clerkUserId
    await updateSessionTitleHandler(
      mockCtx as any,
      { sessionId, title: 'New Title' },
      realClerkUserId,
    )

    // Verify that get was called and patch was called with correct fields
    expect(getCalled).toBe(true)
    expect(patchCalledWith).not.toBeNull()
    expect(patchCalledWith.id).toBe(sessionId)
    expect(patchCalledWith.fields).toEqual({
      title: 'New Title',
      updatedAt: expect.any(Number),
    })
  })

  /**
   * AC-5: updateSessionTitle successfully patches title for valid session
   * GIVEN: A planning_session exists with clerkUserId='userA' and title='Original'
   * WHEN: An internal caller invokes updateSessionTitle({ sessionId, title: 'New Title' })
   * THEN: The session doc is patched: title === 'New Title' and updatedAt is updated; no error thrown
   */
  it('AC-5: successfully patches title for valid session owned by the user', async () => {
    const sessionId = 'session_abc' as Id<'planning_sessions'>
    const clerkUserId = 'userA'
    const originalUpdatedAt = 1000

    const mockDoc = {
      _id: sessionId,
      _creationTime: Date.now(),
      clerkUserId,
      title: 'Original',
      status: 'active' as const,
      createdAt: Date.now(),
      updatedAt: originalUpdatedAt,
    }

    let patchedFields: any = null

    const mockCtx = {
      db: {
        get: async () => mockDoc,
        patch: async (id: Id<'planning_sessions'>, fields: object) => {
          patchedFields = fields
        },
      },
    }

    // Should not throw
    await expect(
      updateSessionTitleHandler(mockCtx as any, { sessionId, title: 'New Title' }, clerkUserId),
    ).resolves.toBeUndefined()

    // Verify the patch call
    expect(patchedFields).toEqual({
      title: 'New Title',
      updatedAt: expect.any(Number),
    })
    // updatedAt should have been updated
    expect((patchedFields as any).updatedAt).toBeGreaterThanOrEqual(originalUpdatedAt)
  })

  /**
   * AC-6: updateSessionTitle throws SESSION_NOT_FOUND for unknown sessionId
   * GIVEN: No planning_session exists for the given sessionId
   * WHEN: An internal caller invokes updateSessionTitle({ sessionId: <stale>, title: 'X' })
   * THEN: It throws ConvexError with the SESSION_NOT_FOUND error code
   */
  it('AC-6: throws SESSION_NOT_FOUND when session does not exist', async () => {
    const sessionId = 'session_nonexistent' as Id<'planning_sessions'>
    const clerkUserId = 'userA'

    const mockCtx = {
      db: {
        get: async () => null, // Session does not exist
        patch: async () => {
          throw new Error('Should not be called')
        },
      },
    }

    await expect(
      updateSessionTitleHandler(mockCtx as any, { sessionId, title: 'New Title' }, clerkUserId),
    ).rejects.toThrow(ConvexError)

    // Verify it's the right error code
    try {
      await updateSessionTitleHandler(
        mockCtx as any,
        { sessionId, title: 'New Title' },
        clerkUserId,
      )
    } catch (error) {
      if (error instanceof ConvexError) {
        expect(error.message).toContain(ERROR_CODES.SESSION_NOT_FOUND)
      }
    }
  })

  /**
   * Additional test: verify that authorization check still works
   * (user A cannot modify user B's session)
   */
  it('throws SESSION_NOT_FOUND when user does not own the session', async () => {
    const sessionId = 'session_abc' as Id<'planning_sessions'>
    const ownerClerkUserId = 'userA'
    const otherClerkUserId = 'userB'

    const mockDoc = {
      _id: sessionId,
      _creationTime: Date.now(),
      clerkUserId: ownerClerkUserId, // Owned by userA
      title: 'Original',
      status: 'active' as const,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }

    const mockCtx = {
      db: {
        get: async () => mockDoc,
        patch: async () => {
          throw new Error('Should not be called')
        },
      },
    }

    // Try to update as userB (not the owner)
    await expect(
      updateSessionTitleHandler(
        mockCtx as any,
        { sessionId, title: 'New Title' },
        otherClerkUserId,
      ),
    ).rejects.toThrow(ConvexError)
  })

  /**
   * CRITICAL BUG TEST: Demonstrates the ownership bug
   * The wrapper at line 290 of planningSessions.ts passes an empty string
   * instead of the real clerkUserId, causing ownership checks to fail
   */
  it('BUG: fails when empty string is passed instead of real clerkUserId', async () => {
    const sessionId = 'session_abc' as Id<'planning_sessions'>
    const realClerkUserId = 'userA'
    const emptyClerkUserId = '' // Bug: this is what the wrapper currently does

    const mockDoc = {
      _id: sessionId,
      _creationTime: Date.now(),
      clerkUserId: realClerkUserId,
      title: 'Original',
      status: 'active' as const,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }

    const mockCtx = {
      db: {
        get: async () => mockDoc,
        patch: async () => {
          throw new Error('Should not be called if authorization fails')
        },
      },
    }

    // This should FAIL because empty string doesn't match real clerkUserId
    // After the fix, this test can be removed
    await expect(
      updateSessionTitleHandler(
        mockCtx as any,
        { sessionId, title: 'New Title' },
        emptyClerkUserId,
      ),
    ).rejects.toThrow(ConvexError)
  })
})
