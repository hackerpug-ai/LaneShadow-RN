'use node'

import { describe, expect, it } from 'vitest'
import { determineAvailableTools } from './orchestrator'

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
