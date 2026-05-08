import { describe, expect, it } from 'vitest'

import type { SessionMessage } from '../../../models/session-messages'
import { derivePlanningPhase, PLANNING_PHASE } from '../../../models/session-messages'

const baseMessage = (overrides: Partial<SessionMessage> = {}): SessionMessage =>
  ({
    sessionId: 'session_abc' as SessionMessage['sessionId'],
    role: 'system',
    content: '',
    createdAt: Date.now(),
    kind: 'planning',
    status: 'streaming',
    ...overrides,
  }) as SessionMessage

describe('derivePlanningPhase', () => {
  it('AC-2: derives parsing from empty active planning message', () => {
    expect(derivePlanningPhase(baseMessage())).toBe('parsing')
  })

  it('AC-2: derives searching from geocode activity', () => {
    const phase = derivePlanningPhase(
      baseMessage({
        thinkingSteps: [
          {
            type: 'tool_start',
            toolName: 'geocode',
            summary: 'Resolving start and end points',
            timestamp: 1,
          },
        ],
      }),
    )

    expect(phase).toBe('searching')
  })

  it('AC-2: derives drafting from route sketch tools', () => {
    const phase = derivePlanningPhase(
      baseMessage({
        thinkingSteps: [
          {
            type: 'tool_finish',
            toolName: 'compileSketch',
            summary: 'Found a promising road set',
            timestamp: 2,
          },
        ],
      }),
    )

    expect(phase).toBe('drafting')
  })

  it('AC-2: derives enriching from enrichment tools', () => {
    const phase = derivePlanningPhase(
      baseMessage({
        thinkingSteps: [
          {
            type: 'tool_finish',
            toolName: 'searchNearby',
            summary: 'Pulled nearby stops',
            timestamp: 3,
          },
        ],
      }),
    )

    expect(phase).toBe('enriching')
  })

  it('AC-2: derives finalizing from agent completion', () => {
    const phase = derivePlanningPhase(
      baseMessage({
        thinkingSteps: [
          {
            type: 'tool_finish',
            toolName: 'routing_agent',
            summary: 'Wrapped up route plan',
            timestamp: 4,
          },
        ],
        status: 'running',
      }),
    )

    expect(phase).toBe('finalizing')
  })

  it('AC-3: returns finalizing for complete status even without steps', () => {
    expect(
      derivePlanningPhase(
        baseMessage({
          status: 'complete',
          thinkingSteps: undefined,
        }),
      ),
    ).toBe('finalizing')
  })

  it('AC-3: returns null for non-planning messages', () => {
    expect(
      derivePlanningPhase(
        baseMessage({
          kind: 'text',
        }),
      ),
    ).toBeNull()
  })

  it('AC-3: phase edge unknown tool falls back to prior known phase', () => {
    const phase = derivePlanningPhase(
      baseMessage({
        thinkingSteps: [
          {
            type: 'tool_start',
            toolName: 'geocode',
            summary: 'Resolve places',
            timestamp: 1,
          },
          {
            type: 'tool_finish',
            toolName: 'unknown_tool',
            summary: 'Unexpected step',
            timestamp: 2,
          },
        ],
      }),
    )

    expect(phase).toBe('searching')
  })

  it('AC-3: phase edge unknown tool returns null when no known phase was seen', () => {
    const phase = derivePlanningPhase(
      baseMessage({
        thinkingSteps: [
          {
            type: 'tool_start',
            toolName: 'unknown_tool',
            summary: 'Unexpected step',
            timestamp: 1,
          },
        ],
        status: 'failed',
      }),
    )

    expect(phase).toBeNull()
  })

  it('AC-7: phase enum literals match the mobile contract exactly', () => {
    expect(Object.values(PLANNING_PHASE)).toEqual([
      'parsing',
      'searching',
      'drafting',
      'enriching',
      'finalizing',
    ])
  })
})
