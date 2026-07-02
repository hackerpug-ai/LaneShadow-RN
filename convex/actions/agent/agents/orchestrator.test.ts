'use node'

import { describe, expect, it } from 'vitest'
import {
  buildDiscoveryIntentFromQuery,
  determineAvailableTools,
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
