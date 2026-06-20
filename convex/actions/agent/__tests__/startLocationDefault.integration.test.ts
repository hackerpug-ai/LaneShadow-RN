'use node'

/**
 * Integration tests for start location defaulting behavior (DATA-010).
 *
 * Tests verify that:
 * - AC-1: currentLocation present → prompt contains resolved coords + no-ask instruction
 * - AC-2: lastKnownLocation present (no currentLocation) → prompt surfaces it as stale default + no-ask
 * - AC-4: no location anywhere → prompt asks origin as last resort
 *
 * These tests call the REAL buildOrchestratorPrompt function with mocked session queries,
 * asserting the prompt content per the must_observe contract in the spec.
 */

import { describe, expect, it, vi } from 'vitest'
import { buildOrchestratorPrompt } from '../agents/orchestrator'
import type { AgentContext } from '../ridePlanningAgent'

// Mock the Convex API module
vi.mock('../../../_generated/api', () => ({
  api: {
    db: {
      planningSessions: {
        getSessionById: { __fake: true },
      },
    },
  },
}))

describe('Start Location Defaulting (AC-1, AC-2, AC-4) - Prompt Builder Integration', () => {
  describe('AC-1: Live currentLocation present', () => {
    it('builds prompt with resolved current location + no-ask instruction', async () => {
      const ctx = {
        planningSessionId: 'session_ac1' as any,
        clerkUserId: 'user_test',
        piMessages: [],
        currentLocation: { lat: 37.7749, lng: -122.4194 }, // San Francisco
        runQuery: vi.fn(),
        runMutation: vi.fn(),
        runAction: vi.fn(),
      } as unknown as AgentContext

      const prompt = await buildOrchestratorPrompt(ctx, ['routing_agent', 'search_agent'])

      // must_observe (per spec AC-1):
      // - the resolved lat/lng is named (e.g., "37.77" or "37.7749")
      expect(prompt).toContain('37.7749')
      expect(prompt).toContain('-122.4194')

      // - a default-origin / no-ask instruction is present
      expect(prompt).toContain('Use this as the default origin')
      expect(prompt).toContain('Do NOT ask "where are you starting from?"')

      // must NOT observe:
      // - an ask for origin when location is resolved
      // Note: We check the negative by ensuring the current-location block is used,
      // not the fallback "ask where" block
      expect(prompt.toLowerCase()).not.toMatch(/ask where they are starting from/)
    })
  })

  describe('AC-2: lastKnownLocation present (no live currentLocation)', () => {
    it('surfaces last-known location as possibly-stale default + no-ask instruction', async () => {
      const lastKnownValue = { lat: 34.05, lng: -118.24 } // Los Angeles

      const ctx = {
        planningSessionId: 'session_ac2' as any,
        clerkUserId: 'user_test',
        piMessages: [],
        currentLocation: undefined, // No live location
        runQuery: vi.fn().mockResolvedValue({
          lastKnownLocation: lastKnownValue,
        }),
        runMutation: vi.fn(),
        runAction: vi.fn(),
      } as unknown as AgentContext

      const prompt = await buildOrchestratorPrompt(ctx, ['routing_agent', 'search_agent'])

      // must_observe (per spec AC-2):
      // - the last-known location is surfaced with the resolved coords
      expect(prompt).toContain('last known location')
      expect(prompt).toContain('34.05')
      expect(prompt).toContain('-118.24')

      // - a "may be stale" warning is present
      expect(prompt).toContain('may be stale')

      // - a no-ask instruction is present
      expect(prompt).toContain('Do NOT ask "where are you starting from?"')

      // must NOT observe:
      // - an instruction to ask for origin (that belongs to the no-location state)
      expect(prompt.toLowerCase()).not.toMatch(/ask where they are starting from\?\s*$/)
    })
  })

  describe('AC-4: No location anywhere', () => {
    it('asks origin as last resort when no location anywhere', async () => {
      const ctx = {
        planningSessionId: 'session_ac4' as any,
        clerkUserId: 'user_test',
        piMessages: [],
        currentLocation: undefined, // No live location
        runQuery: vi.fn().mockResolvedValue({
          lastKnownLocation: undefined, // No stored location either
        }),
        runMutation: vi.fn(),
        runAction: vi.fn(),
      } as unknown as AgentContext

      const prompt = await buildOrchestratorPrompt(ctx, ['routing_agent', 'search_agent'])

      // must_observe (per spec AC-4):
      // - the origin-ask instruction is present
      expect(prompt).toContain('ask where they are starting from')

      // must NOT observe:
      // - a fabricated/hardcoded origin (0,0 or a default city)
      expect(prompt).not.toContain('lat=0')
      expect(prompt).not.toContain('lng=0')
      expect(prompt).not.toContain('San Francisco') // No hardcoded defaults
      expect(prompt).not.toContain('Los Angeles')

      // - a "Use this as the default origin" instruction (that belongs to when we have a location)
      expect(prompt).not.toContain('Use this as the default origin')
    })
  })

  describe('Boundary: runQuery failure on AC-2 fallback', () => {
    it('falls through to AC-4 (ask origin) if lastKnownLocation lookup fails', async () => {
      const ctx = {
        planningSessionId: 'session_boundary' as any,
        clerkUserId: 'user_test',
        piMessages: [],
        currentLocation: undefined,
        // Simulate a lookup failure (e.g., network error, session deleted)
        runQuery: vi.fn().mockRejectedValue(new Error('Query failed')),
        runMutation: vi.fn(),
        runAction: vi.fn(),
      } as unknown as AgentContext

      const prompt = await buildOrchestratorPrompt(ctx, ['routing_agent', 'search_agent'])

      // When the lastKnownLocation lookup fails, we silently fall through to State 3
      // and ask for the origin (the safe fallback).
      expect(prompt).toContain('ask where they are starting from')

      // Verify no stale location is accidentally used
      expect(prompt).not.toContain('last known location')
    })
  })
})
