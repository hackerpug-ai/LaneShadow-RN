import { describe, expect, it } from 'vitest'

import {
  derivePlanningPhase,
  derivePlanningPhaseFromToolName,
  PLANNING_PHASE,
  type SessionMessage,
} from '../session-messages'

const baseMessage = (overrides: Partial<SessionMessage> = {}): SessionMessage =>
  ({
    sessionId: 'session_abc' as SessionMessage['sessionId'],
    role: 'system',
    content: '',
    createdAt: 1,
    kind: 'planning',
    status: 'streaming',
    ...overrides,
  }) as SessionMessage

describe('session-messages planning phase contract', () => {
  it('exports lowercase planning phase literals', () => {
    expect(PLANNING_PHASE).toEqual({
      PARSING: 'parsing',
      SEARCHING: 'searching',
      DRAFTING: 'drafting',
      ENRICHING: 'enriching',
      FINALIZING: 'finalizing',
    })
  })

  it('derives finalizing for completed planning messages', () => {
    const phase = derivePlanningPhase(
      baseMessage({
        status: 'complete',
      }),
    )

    expect(phase).toBe('finalizing')
  })

  it('derives enriching phase from getRouteWeather planning events', () => {
    const phase = derivePlanningPhase(
      baseMessage({
        content: JSON.stringify({
          events: [{ type: 'tool_pending', tool: 'getRouteWeather' }],
        }),
      }),
    )

    expect(phase).toBe('enriching')
  })

  it('maps real planRoute pipeline step names to searching, drafting, and enriching', () => {
    expect(derivePlanningPhaseFromToolName('findScenicWaypoints')).toBe('searching')
    expect(derivePlanningPhaseFromToolName('compileSketch')).toBe('drafting')
    expect(derivePlanningPhaseFromToolName('probeConditions')).toBe('enriching')
  })
})
