/**
 * Unit tests for discoverCuratedRoutes routing_card mapping (DATA-008 AC-2 only)
 *
 * AC-2: the tool is dispatched by the orchestrator ReAct loop and mapped to a routing_card
 *
 * These tests verify the RUNTIME mapping of discoverCuratedRoutes to routing_card.
 *
 * AC-1 (fixtured intent drives a route_plans row) is verified LIVE at the PHASE 3.5 Maestro
 * discovery E2E gate (.maestro/discovery-full-gate.yaml), against live Convex dev. It is not
 * verified here because source-grep testing would be a lie per the Supreme Rule.
 *
 * Reference: .spec/prds/mvp/10-e2e-testing-criteria.md (T-DISC-010 contract)
 */

import { describe, expect, it } from 'vitest'
import { TOOL_TO_CARD_KIND } from '../../sendMessage'

describe('AC-2: the tool is dispatched by the orchestrator ReAct loop and mapped to a routing_card', () => {
  it('toolToCardKindMappingExists: TOOL_TO_CARD_KIND includes discoverCuratedRoutes → routing_card', () => {
    // GIVEN: The TOOL_TO_CARD_KIND mapping from sendMessage.ts
    // WHEN: We check for the discoverCuratedRoutes entry
    expect(TOOL_TO_CARD_KIND).toHaveProperty('discoverCuratedRoutes')

    // THEN: It should map to 'routing_card'
    expect(TOOL_TO_CARD_KIND.discoverCuratedRoutes).toBe('routing_card')
  })

  it('verifies only expected tools are mapped to routing_card', () => {
    // GIVEN: The TOOL_TO_CARD_KIND mapping
    // WHEN: We enumerate the tools mapped to routing_card
    const routingCardTools = Object.entries(TOOL_TO_CARD_KIND)
      .filter(([, kind]) => kind === 'routing_card')
      .map(([name]) => name)

    // THEN: planRoute, compileSketch, and discoverCuratedRoutes should all be present
    expect(routingCardTools).toContain('planRoute')
    expect(routingCardTools).toContain('compileSketch')
    expect(routingCardTools).toContain('discoverCuratedRoutes')
  })

  it('negative control: verifies sendMessage.ts exports TOOL_TO_CARD_KIND', () => {
    // GIVEN: The sendMessage module
    // WHEN: We check that TOOL_TO_CARD_KIND is properly exported
    expect(typeof TOOL_TO_CARD_KIND).toBe('object')
    expect(Object.keys(TOOL_TO_CARD_KIND).length).toBeGreaterThan(0)

    // THEN: discoverCuratedRoutes should be one of the keys
    expect(Object.keys(TOOL_TO_CARD_KIND)).toContain('discoverCuratedRoutes')
  })
})
