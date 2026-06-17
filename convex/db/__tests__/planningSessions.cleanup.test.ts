import { describe, expect, it } from 'vitest'

import { cleanupOldEmptySessionsHandler } from '../planningSessions'

describe('cleanupOldEmptySessions', () => {
  it('should delete sessions older than 1 hour with no messages', async () => {
    const now = Date.now()
    const oneHourAgo = now - 60 * 60 * 1000
    const twoHoursAgo = now - 2 * 60 * 60 * 1000

    const allSessions = [
      {
        _id: 'session1',
        createdAt: twoHoursAgo,
        deletedAt: undefined,
      },
      {
        _id: 'session2',
        createdAt: oneHourAgo - 1000, // Just over 1 hour
        deletedAt: undefined,
      },
      {
        _id: 'session3',
        createdAt: twoHoursAgo,
        deletedAt: now, // Already soft-deleted
      },
      {
        _id: 'session4',
        createdAt: now - 30 * 60 * 1000, // 30 minutes ago - too recent
        deletedAt: undefined,
      },
    ]

    const cutoffTime = now - 60 * 60 * 1000

    const mockDb = {
      query: (table: string) => ({
        filter: (callback: any) => ({
          collect: async () => {
            if (table === 'planning_sessions') {
              // Filter sessions by cutoff time
              return allSessions.filter((s: any) => s.createdAt < cutoffTime)
            }
            return []
          },
        }),
        withIndex: (indexName: string, callback: any) => ({
          collect: async () => {
            // No messages for any session in this test
            return []
          },
        }),
      }),
      delete: async (id: string) => {},
    }

    const ctx = { db: mockDb } as any
    const deletedSessions: string[] = []

    // Track which sessions get deleted
    mockDb.delete = async (id: string) => {
      deletedSessions.push(id)
    }

    const result = await cleanupOldEmptySessionsHandler(ctx)

    expect(result.deletedCount).toBe(2)
    expect(deletedSessions).toContain('session1')
    expect(deletedSessions).toContain('session2')
    expect(deletedSessions).not.toContain('session3') // Already deleted
    expect(deletedSessions).not.toContain('session4') // Too recent
  })

  it('should not delete sessions that have messages', async () => {
    const now = Date.now()
    const twoHoursAgo = now - 2 * 60 * 60 * 1000

    const sessions = [
      {
        _id: 'session1',
        createdAt: twoHoursAgo,
        deletedAt: undefined,
      },
      {
        _id: 'session2',
        createdAt: twoHoursAgo,
        deletedAt: undefined,
      },
    ]

    const mockDb = {
      query: (table: string) => ({
        filter: (callback: any) => ({
          collect: async () => {
            if (table === 'planning_sessions') {
              return sessions
            }
            return []
          },
        }),
        withIndex: (indexName: string, callback: any) => ({
          collect: async () => {
            // Return empty array for no messages
            return []
          },
        }),
      }),
      delete: async (id: string) => {},
    }

    const ctx = { db: mockDb } as any
    const deletedSessions: string[] = []

    // Track which sessions get deleted
    mockDb.delete = async (id: string) => {
      deletedSessions.push(id)
    }

    // Track current session for withIndex calls
    let currentSessionIndex = 0
    const sessionMessages: any[][] = [[{ _id: 'msg1' }], []] // session1 has messages, session2 doesn't

    ;(mockDb as any).query = (table: string) => ({
      filter: (callback: any) => ({
        collect: async () => {
          if (table === 'planning_sessions') {
            return sessions
          }
          return []
        },
      }),
      withIndex: (indexName: string, callback: any) => ({
        collect: async () => {
          const messages = sessionMessages[currentSessionIndex]
          currentSessionIndex++
          return messages || []
        },
      }),
    })

    const result = await cleanupOldEmptySessionsHandler(ctx)

    expect(result.deletedCount).toBe(1)
    expect(deletedSessions).not.toContain('session1') // Has messages
    expect(deletedSessions).toContain('session2') // No messages
  })

  it('should return zero deleted count when no sessions to clean up', async () => {
    const now = Date.now()
    const recentSession = {
      _id: 'session1',
      createdAt: now - 30 * 60 * 1000, // 30 minutes ago - too recent
      deletedAt: undefined,
    }

    const cutoffTime = now - 60 * 60 * 1000

    const mockDb = {
      query: (table: string) => ({
        filter: (callback: any) => ({
          collect: async () => {
            if (table === 'planning_sessions') {
              // Filter sessions by cutoff time - should return empty since session is too recent
              return recentSession.createdAt < cutoffTime ? [recentSession] : []
            }
            return []
          },
        }),
        withIndex: (indexName: string, callback: any) => ({
          collect: async () => [],
        }),
      }),
      delete: async (id: string) => {},
    }

    const ctx = { db: mockDb } as any

    const result = await cleanupOldEmptySessionsHandler(ctx)

    expect(result.deletedCount).toBe(0)
  })
})
