/**
 * Unit tests for card-registry
 *
 * Acceptance Criteria:
 * - AC1: CARD_REGISTRY has entries for all three non-text kinds
 * - AC2: routing_card maps to the real RoutingCard component
 * - AC3: weather_card and saved_route_card map to placeholder stubs
 */

import { describe, it, expect, vi } from 'vitest'

// Avoid pulling in the full RoutingCard → convex/react → RN deps by stubbing
// the module down to just an identifiable named export.
vi.mock('./routing-card', () => ({
  RoutingCard: function RoutingCardStub() {
    return null
  },
}))

import { CARD_REGISTRY } from './card-registry'
import { RoutingCard } from './routing-card'

describe('CARD_REGISTRY', () => {
  it('AC1: has entries for routing_card, weather_card, saved_route_card', () => {
    expect(CARD_REGISTRY.routing_card).toBeDefined()
    expect(CARD_REGISTRY.weather_card).toBeDefined()
    expect(CARD_REGISTRY.saved_route_card).toBeDefined()
  })

  it('AC2: routing_card maps to RoutingCard component', () => {
    expect(CARD_REGISTRY.routing_card).toBe(RoutingCard)
  })

  it('AC3: weather_card and saved_route_card are placeholder stubs (distinct from RoutingCard)', () => {
    expect(CARD_REGISTRY.weather_card).not.toBe(RoutingCard)
    expect(CARD_REGISTRY.saved_route_card).not.toBe(RoutingCard)
    // Both placeholders are the same function reference (both = PlaceholderCard)
    expect(CARD_REGISTRY.weather_card).toBe(CARD_REGISTRY.saved_route_card)
  })

  it('each registry entry is a function (React component)', () => {
    expect(typeof CARD_REGISTRY.routing_card).toBe('function')
    expect(typeof CARD_REGISTRY.weather_card).toBe('function')
    expect(typeof CARD_REGISTRY.saved_route_card).toBe('function')
  })
})
