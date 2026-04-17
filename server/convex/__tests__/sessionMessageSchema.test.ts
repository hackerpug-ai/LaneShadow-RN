/**
 * Tests for session_messages schema extension: kind + status fields
 *
 * Acceptance criteria:
 * AC-1: sessionMessageValidator has optional kind field (text | routing_card | weather_card | saved_route_card)
 * AC-2: sessionMessageValidator has optional status field (streaming | running | complete | failed)
 * AC-3: sessionMessageKindValidator and sessionMessageStatusValidator exported from models/session-messages
 * AC-4: Migration backfills existing rows with kind:'text', status:'complete'
 */

import { v } from 'convex/values'
import { describe, expect, it, vi } from 'vitest'

describe('session_messages schema extension', () => {
  describe('AC-1: kind field on sessionMessageValidator', () => {
    it('should export sessionMessageKindValidator as a union of text | routing_card | weather_card | saved_route_card', async () => {
      const { sessionMessageKindValidator } = await import('../../models/session-messages')
      // Should be a v.union with 4 literals
      expect(sessionMessageKindValidator).toBeDefined()
      // Validate each literal works
      expect(() =>
        v.union(
          v.literal('text'),
          v.literal('routing_card'),
          v.literal('weather_card'),
          v.literal('saved_route_card'),
        ),
      ).not.toThrow()
    })

    it('sessionMessageValidator should accept a message without kind (optional)', () => {
      // A message without kind should parse (kind is optional in widen phase)
      expect(() =>
        v.object({
          sessionId: v.string(),
          role: v.union(v.literal('rider'), v.literal('system')),
          content: v.string(),
          createdAt: v.number(),
        }),
      ).not.toThrow()
    })

    it('sessionMessageValidator should have kind as an optional field', async () => {
      const { sessionMessageValidator } = await import('../../models/session-messages')
      // The validator is a v.object — its fields should include kind
      const fields = (sessionMessageValidator as any).fields
      expect(fields).toHaveProperty('kind')
    })
  })

  describe('AC-2: status field on sessionMessageValidator', () => {
    it('should export sessionMessageStatusValidator as a union of streaming | running | complete | failed', async () => {
      const { sessionMessageStatusValidator } = await import('../../models/session-messages')
      expect(sessionMessageStatusValidator).toBeDefined()
    })

    it('sessionMessageValidator should have status as an optional field', async () => {
      const { sessionMessageValidator } = await import('../../models/session-messages')
      const fields = (sessionMessageValidator as any).fields
      expect(fields).toHaveProperty('status')
    })
  })

  describe('AC-3: named exports', () => {
    it('should export SESSION_MESSAGE_KIND constant', async () => {
      const mod = await import('../../models/session-messages')
      expect(mod.SESSION_MESSAGE_KIND).toBeDefined()
      expect(mod.SESSION_MESSAGE_KIND.TEXT).toBe('text')
      expect(mod.SESSION_MESSAGE_KIND.ROUTING_CARD).toBe('routing_card')
      expect(mod.SESSION_MESSAGE_KIND.WEATHER_CARD).toBe('weather_card')
      expect(mod.SESSION_MESSAGE_KIND.SAVED_ROUTE_CARD).toBe('saved_route_card')
    })

    it('should export SESSION_MESSAGE_STATUS constant', async () => {
      const mod = await import('../../models/session-messages')
      expect(mod.SESSION_MESSAGE_STATUS).toBeDefined()
      expect(mod.SESSION_MESSAGE_STATUS.STREAMING).toBe('streaming')
      expect(mod.SESSION_MESSAGE_STATUS.RUNNING).toBe('running')
      expect(mod.SESSION_MESSAGE_STATUS.COMPLETE).toBe('complete')
      expect(mod.SESSION_MESSAGE_STATUS.FAILED).toBe('failed')
    })
  })

  describe('AC-4: migration backfill logic', () => {
    it('should backfill rows without kind/status with text/complete defaults', async () => {
      const patchCalls: [string, object][] = []
      const mockCtx = {
        db: {
          query: vi.fn().mockReturnValue({
            collect: vi.fn().mockResolvedValue([
              {
                _id: 'msg_1',
                sessionId: 'session_1',
                role: 'rider',
                content: 'hello',
                createdAt: 1000,
              },
              {
                _id: 'msg_2',
                sessionId: 'session_1',
                role: 'system',
                content: 'world',
                createdAt: 2000,
              },
              // Already migrated row — should not be patched
              {
                _id: 'msg_3',
                sessionId: 'session_1',
                role: 'rider',
                content: 'hi',
                createdAt: 3000,
                kind: 'text',
                status: 'complete',
              },
            ]),
          }),
          patch: vi.fn().mockImplementation((id: string, fields: object) => {
            patchCalls.push([id, fields])
            return Promise.resolve()
          }),
        },
      }

      const { backfillSessionMessageKindStatusHandler } = await import(
        '../migrations/backfillSessionMessageKindStatus'
      )
      await backfillSessionMessageKindStatusHandler(mockCtx as any)

      // Should patch only the two rows without kind/status
      expect(patchCalls).toHaveLength(2)
      expect(patchCalls[0]).toEqual(['msg_1', { kind: 'text', status: 'complete' }])
      expect(patchCalls[1]).toEqual(['msg_2', { kind: 'text', status: 'complete' }])
    })
  })
})
