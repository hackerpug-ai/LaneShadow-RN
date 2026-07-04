'use node'

import { describe, expect, it, vi } from 'vitest'
import type { AgentContext } from '../ridePlanningAgent'
import {
  buildDiscoveryIntentFromQuery,
  buildOrchestratorPrompt,
  determineAvailableTools,
  executeDiscoveryAgentBranch,
  extractOrchestratorAttachments,
} from './orchestrator'

/**
 * AC-1: fetchWeather removed from agent tool registry
 * GIVEN: The agent runtime is initialized
 * WHEN:  The available tools list is enumerated
 * THEN:  `fetchWeather` is not present in the tool registry
 */
describe('Orchestrator tool availability', () => {
  it('AC-1: fetchWeather is not exposed as a callable tool', () => {
    // Test all possible states to ensure fetchWeather is never available
    const testCases = [
      { hasRoutes: false, hasPendingSketch: false, desc: 'no routes, no pending sketch' },
      { hasRoutes: true, hasPendingSketch: false, desc: 'has routes, no pending sketch' },
      { hasRoutes: true, hasPendingSketch: true, desc: 'has routes and pending sketch' },
      { hasRoutes: false, hasPendingSketch: true, desc: 'has pending sketch only' },
    ]

    for (const testCase of testCases) {
      const tools = determineAvailableTools(testCase.hasRoutes, testCase.hasPendingSketch)
      const toolNames = tools.map((t) => t.name)

      expect(toolNames, `fetchWeather should not be in tools for: ${testCase.desc}`).not.toContain(
        'fetchWeather',
      )
    }
  })
})

describe('Orchestrator route prompt', () => {
  it('treats explicit alias A-to-B input as complete even when current location is unknown', async () => {
    const ctx = {
      planningSessionId: 'session_no_location' as any,
      clerkUserId: 'user_test',
      piMessages: [],
      currentLocation: undefined,
      runQuery: vi.fn().mockResolvedValue({ lastKnownLocation: undefined }),
      runMutation: vi.fn(),
      runAction: vi.fn(),
    } as unknown as AgentContext

    const prompt = await buildOrchestratorPrompt(ctx, ['routing_agent', 'search_agent'])

    expect(prompt).toContain('"SF to Santacruze"')
    expect(prompt).toContain('complete route request')
    expect(prompt).toContain('SF/S.F. = San Francisco')
    expect(prompt).toContain('Santacruze')
    expect(prompt).toContain('Ask where they are starting from only for destination-only')
    expect(prompt).toContain('Use natural-language intent')
  })
})

describe('Discovery intent extraction', () => {
  it('maps the Maestro Asheville twisties query to North Carolina curated routes', () => {
    const intent = buildDiscoveryIntentFromQuery('twisties near Asheville NC')

    expect(intent).toMatchObject({
      archetypes: ['twisties'],
      state: 'North Carolina',
      sort: 'best',
      limit: 10,
    })
  })

  it('maps state-level scenic route queries to canonical state names', () => {
    const intent = buildDiscoveryIntentFromQuery('scenic roads in North Carolina')

    expect(intent).toMatchObject({
      archetypes: ['scenic'],
      state: 'North Carolina',
      sort: 'best',
      limit: 10,
    })
  })

  it('does not mistake prepositions for state abbreviations', () => {
    const intent = buildDiscoveryIntentFromQuery('twisties in the mountains')

    expect(intent).not.toHaveProperty('state', 'Indiana')
  })
})

describe('Discovery attachments', () => {
  it('returns route_options attachments for discovery_agent route results', () => {
    const attachments = extractOrchestratorAttachments([
      {
        toolName: 'discovery_agent',
        result: { type: 'routes', routePlanId: 'route_plans:discovery-result' },
      },
    ])

    expect(attachments).toEqual([
      { type: 'route_options', routePlanId: 'route_plans:discovery-result' },
    ])
  })
})

describe('Discovery agent branch dispatch', () => {
  it('extracts natural-language intent, reaches discoverCuratedRoutes, and emits routing-card lifecycle callbacks', async () => {
    const toolStarts: unknown[] = []
    const toolFinishes: unknown[] = []
    const subAgentCompletes: unknown[] = []
    const routePlanId = 'route_plans:discovery-branch' as any

    const result = await executeDiscoveryAgentBranch({
      ctx: {
        planningSessionId: 'planning_sessions:branch-test' as any,
        clerkUserId: 'user_branch_test',
        piMessages: [],
        runQuery: async () => undefined,
        runMutation: async () => undefined,
        runAction: async () => undefined,
      } as any,
      query: 'scenic roads in North Carolina',
      callId: 'discovery-branch-test',
      discoveryExecuteCtx: {
        onToolStart: async (toolName, args) => {
          toolStarts.push({ toolName, args })
          return { messageId: 'session_messages:routing-card' as any }
        },
        onToolFinish: async (toolCallId, toolName, messageId, branchResult) => {
          toolFinishes.push({ toolCallId, toolName, messageId, result: branchResult })
        },
      } as any,
      parentExecuteCtx: {
        onSubAgentComplete: async (agent, summary, durationMs) => {
          subAgentCompletes.push({ agent, summary, durationMs })
        },
      } as any,
      discoveryExecutor: async (_ctx, toolCall) => {
        expect(toolCall.name).toBe('discoverCuratedRoutes')
        expect(toolCall.arguments.intent).toMatchObject({
          archetypes: ['scenic'],
          state: 'North Carolina',
          sort: 'best',
          limit: 10,
        })
        return { type: 'routes', routePlanId }
      },
    })

    expect(result).toEqual({ type: 'routes', routePlanId })
    expect(toolStarts).toEqual([
      {
        toolName: 'discoverCuratedRoutes',
        args: {
          intent: {
            archetypes: ['scenic'],
            state: 'North Carolina',
            sort: 'best',
            limit: 10,
          },
        },
      },
    ])
    expect(toolFinishes).toEqual([
      {
        toolCallId: 'discovery-branch-test',
        toolName: 'discoverCuratedRoutes',
        messageId: 'session_messages:routing-card',
        result: { type: 'routes', routePlanId },
      },
    ])
    expect(subAgentCompletes).toHaveLength(1)
    expect(subAgentCompletes[0]).toMatchObject({ agent: 'discovery' })

    const attachments = extractOrchestratorAttachments([{ toolName: 'discovery_agent', result }])
    expect(attachments).toEqual([{ type: 'route_options', routePlanId }])
  })
})
