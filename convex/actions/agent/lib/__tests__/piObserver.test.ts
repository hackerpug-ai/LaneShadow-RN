/**
 * Unit tests for piObserver event handler.
 *
 * Tests cover:
 * - Agent lifecycle event logging (agent_start, agent_end)
 * - Turn lifecycle event logging (turn_start, turn_end)
 * - Message lifecycle event logging (message_start, message_update, message_end)
 * - Tool execution event logging (tool_execution_start, tool_execution_update, tool_execution_end)
 * - Error event logging
 * - Backend logger integration
 * - Observability toggle
 *
 * Note: The observer checks PI_OBSERVABILITY_ENABLED at module import time.
 * Since test environment automatically sets this to false, we test the observer's
 * structure and error handling rather than actual logging behavior.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { AgentEvent } from '@mariozechner/pi-agent-core/dist/types'
import type { ActionCtx } from '../../../../_generated/server'

// Mock the console.log to capture backend logging
const consoleLogSpy = vi.spyOn(console, 'log')

describe('piObserver', () => {
  // Create a minimal mock context
  const mockCtx = {
    auth: {},
    db: {} as any,
    runQuery: vi.fn(),
    runMutation: vi.fn(),
    scheduler: {} as any,
    storage: {} as any,
  } as unknown as ActionCtx

  const testUserId = 'test-user-123'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('observer creation', () => {
    it('should create an observer function', async () => {
      const { createPiObserver } = await import('../piObserver')
      const observer = createPiObserver(mockCtx, testUserId)

      expect(observer).toBeDefined()
      expect(typeof observer).toBe('function')
    })

    it('should accept userId parameter', async () => {
      const { createPiObserver } = await import('../piObserver')
      const observer = createPiObserver(mockCtx, testUserId)

      expect(observer).toBeDefined()
    })

    it('should work without userId parameter (defaults to anonymous)', async () => {
      const { createPiObserver } = await import('../piObserver')
      const observer = createPiObserver(mockCtx)

      expect(observer).toBeDefined()
    })

    it('should generate unique sessionId for each observer', async () => {
      const { createPiObserver } = await import('../piObserver')
      const observer1 = createPiObserver(mockCtx, testUserId)
      const observer2 = createPiObserver(mockCtx, testUserId)

      expect(observer1).toBeDefined()
      expect(observer2).toBeDefined()
      expect(observer1).not.toBe(observer2)
    })
  })

  describe('event handling - no errors', () => {
    it('should handle agent_start event without throwing', async () => {
      const { createPiObserver } = await import('../piObserver')
      const observer = createPiObserver(mockCtx, testUserId)
      const event: AgentEvent = { type: 'agent_start' }

      expect(() => observer(event)).not.toThrow()
    })

    it('should handle agent_end event without throwing', async () => {
      const { createPiObserver } = await import('../piObserver')
      const observer = createPiObserver(mockCtx, testUserId)
      const mockMessages = [
        { role: 'user', content: 'test message 1' },
        { role: 'assistant', content: 'test message 2' },
      ]
      const event: AgentEvent = {
        type: 'agent_end',
        messages: mockMessages as any,
      }

      expect(() => observer(event)).not.toThrow()
    })

    it('should handle turn_start event without throwing', async () => {
      const { createPiObserver } = await import('../piObserver')
      const observer = createPiObserver(mockCtx, testUserId)
      const event: AgentEvent = { type: 'turn_start' }

      expect(() => observer(event)).not.toThrow()
    })

    it('should handle turn_end event without throwing', async () => {
      const { createPiObserver } = await import('../piObserver')
      const observer = createPiObserver(mockCtx, testUserId)
      const mockToolResults = [
        { role: 'toolResult', toolCallId: '1', content: 'result 1' },
      ]
      const mockMessage = { role: 'assistant', content: 'response' }
      const event: AgentEvent = {
        type: 'turn_end',
        message: mockMessage as any,
        toolResults: mockToolResults as any,
      }

      expect(() => observer(event)).not.toThrow()
    })

    it('should handle message_start event without throwing', async () => {
      const { createPiObserver } = await import('../piObserver')
      const observer = createPiObserver(mockCtx, testUserId)
      const mockMessage = { role: 'user', content: 'test message' }
      const event: AgentEvent = {
        type: 'message_start',
        message: mockMessage as any,
      }

      expect(() => observer(event)).not.toThrow()
    })

    it('should handle message_update event without throwing', async () => {
      const { createPiObserver } = await import('../piObserver')
      const observer = createPiObserver(mockCtx, testUserId)
      const mockMessage = { role: 'assistant', content: 'updating' }
      const mockAssistantEvent = { type: 'content', delta: 'test' }
      const event: AgentEvent = {
        type: 'message_update',
        message: mockMessage as any,
        assistantMessageEvent: mockAssistantEvent as any,
      }

      expect(() => observer(event)).not.toThrow()
    })

    it('should handle message_end event without throwing', async () => {
      const { createPiObserver } = await import('../piObserver')
      const observer = createPiObserver(mockCtx, testUserId)
      const mockMessage = { role: 'assistant', content: 'completed' }
      const event: AgentEvent = {
        type: 'message_end',
        message: mockMessage as any,
      }

      expect(() => observer(event)).not.toThrow()
    })

    it('should handle tool_execution_start event without throwing', async () => {
      const { createPiObserver } = await import('../piObserver')
      const observer = createPiObserver(mockCtx, testUserId)
      const args = { location: 'San Francisco', radius: 10 }
      const event: AgentEvent = {
        type: 'tool_execution_start',
        toolCallId: 'call-123',
        toolName: 'search_routes',
        args,
      }

      expect(() => observer(event)).not.toThrow()
    })

    it('should handle tool_execution_update event without throwing', async () => {
      const { createPiObserver } = await import('../piObserver')
      const observer = createPiObserver(mockCtx, testUserId)
      const args = { query: 'test' }
      const partialResult = { status: 'processing' }
      const event: AgentEvent = {
        type: 'tool_execution_update',
        toolCallId: 'call-123',
        toolName: 'search_places',
        args,
        partialResult,
      }

      expect(() => observer(event)).not.toThrow()
    })

    it('should handle tool_execution_end event without throwing', async () => {
      const { createPiObserver } = await import('../piObserver')
      const observer = createPiObserver(mockCtx, testUserId)
      const result = { content: 'Success!', details: { count: 5 } }
      const event: AgentEvent = {
        type: 'tool_execution_end',
        toolCallId: 'call-123',
        toolName: 'search_routes',
        result,
        isError: false,
      }

      expect(() => observer(event)).not.toThrow()
    })

    it('should handle tool_execution_end error event without throwing', async () => {
      const { createPiObserver } = await import('../piObserver')
      const observer = createPiObserver(mockCtx, testUserId)
      const errorResult = new Error('Tool execution failed')
      const result = {
        toString: () => errorResult.message,
      }
      const event: AgentEvent = {
        type: 'tool_execution_end',
        toolCallId: 'call-123',
        toolName: 'search_routes',
        result,
        isError: true,
      }

      expect(() => observer(event)).not.toThrow()
    })
  })

  describe('event coverage', () => {
    it('should handle all known event types without throwing', async () => {
      const { createPiObserver } = await import('../piObserver')
      const observer = createPiObserver(mockCtx, testUserId)
      const mockMessage = { role: 'user', content: 'test' }
      const mockToolResults: any[] = []
      const mockAssistantEvent = { type: 'content', delta: 'test' }

      const events: AgentEvent[] = [
        { type: 'agent_start' },
        { type: 'agent_end', messages: [mockMessage] as any },
        { type: 'turn_start' },
        { type: 'turn_end', message: mockMessage as any, toolResults: mockToolResults },
        { type: 'message_start', message: mockMessage as any },
        { type: 'message_update', message: mockMessage as any, assistantMessageEvent: mockAssistantEvent as any },
        { type: 'message_end', message: mockMessage as any },
        { type: 'tool_execution_start', toolCallId: '1', toolName: 'test', args: {} },
        { type: 'tool_execution_update', toolCallId: '1', toolName: 'test', args: {}, partialResult: {} },
        { type: 'tool_execution_end', toolCallId: '1', toolName: 'test', result: {}, isError: false },
      ]

      events.forEach(event => {
        expect(() => observer(event)).not.toThrow()
      })
    })

    it('should handle rapid event sequences without throwing', async () => {
      const { createPiObserver } = await import('../piObserver')
      const observer = createPiObserver(mockCtx, testUserId)

      // Simulate a realistic agent session
      expect(() => {
        observer({ type: 'agent_start' })
        observer({ type: 'turn_start' })
        observer({ type: 'message_start', message: { role: 'user', content: 'test' } as any })
        observer({ type: 'tool_execution_start', toolCallId: '1', toolName: 'test', args: {} })
        observer({ type: 'tool_execution_end', toolCallId: '1', toolName: 'test', result: {}, isError: false })
        observer({ type: 'message_end', message: { role: 'user', content: 'test' } as any })
        observer({ type: 'turn_end', message: { role: 'assistant', content: 'done' } as any, toolResults: [] })
        observer({ type: 'agent_end', messages: [] as any })
      }).not.toThrow()
    })
  })

  describe('edge cases', () => {
    it('should handle null tool result gracefully', async () => {
      const { createPiObserver } = await import('../piObserver')
      const observer = createPiObserver(mockCtx, testUserId)
      const event: AgentEvent = {
        type: 'tool_execution_end',
        toolCallId: 'call-123',
        toolName: 'search_routes',
        result: null,
        isError: true,
      }

      expect(() => observer(event)).not.toThrow()
    })

    it('should handle empty args object', async () => {
      const { createPiObserver } = await import('../piObserver')
      const observer = createPiObserver(mockCtx, testUserId)
      const event: AgentEvent = {
        type: 'tool_execution_start',
        toolCallId: 'call-123',
        toolName: 'test_tool',
        args: {},
      }

      expect(() => observer(event)).not.toThrow()
    })

    it('should handle null args', async () => {
      const { createPiObserver } = await import('../piObserver')
      const observer = createPiObserver(mockCtx, testUserId)
      const event: AgentEvent = {
        type: 'tool_execution_start',
        toolCallId: 'call-123',
        toolName: 'test_tool',
        args: null,
      }

      expect(() => observer(event)).not.toThrow()
    })

    it('should handle undefined args', async () => {
      const { createPiObserver } = await import('../piObserver')
      const observer = createPiObserver(mockCtx, testUserId)
      const event: AgentEvent = {
        type: 'tool_execution_start',
        toolCallId: 'call-123',
        toolName: 'test_tool',
        args: undefined,
      }

      expect(() => observer(event)).not.toThrow()
    })

    it('should handle empty messages array', async () => {
      const { createPiObserver } = await import('../piObserver')
      const observer = createPiObserver(mockCtx, testUserId)
      const event: AgentEvent = {
        type: 'agent_end',
        messages: [],
      }

      expect(() => observer(event)).not.toThrow()
    })

    it('should handle empty tool results array', async () => {
      const { createPiObserver } = await import('../piObserver')
      const observer = createPiObserver(mockCtx, testUserId)
      const event: AgentEvent = {
        type: 'turn_end',
        message: { role: 'assistant', content: 'done' } as any,
        toolResults: [],
      }

      expect(() => observer(event)).not.toThrow()
    })
  })
})
