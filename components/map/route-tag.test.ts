/**
 * Pure-function tests for RouteTag text derivation.
 * Tests the tag-text builder that maps a route option → "Archetype · Distance" label.
 * This is a UNIT test (pure logic, no I/O).
 */

import { describe, it, expect } from 'vitest'
import { buildRouteTagText } from './route-tag'

describe('buildRouteTagText', () => {
  it('should produce archetype + distance text from a route option', () => {
    const option = {
      archetype: 'scenic',
      distanceMeters: 125531,
    }

    const result = buildRouteTagText(option)

    // Expect: "Scenic · 78mi" (125531m ≈ 78 miles)
    expect(result).toBe('Scenic · 78mi')
  })

  it('should capitalize archetype label', () => {
    const option = {
      archetype: 'twisties',
      distanceMeters: 228244, // ~142mi
    }

    const result = buildRouteTagText(option)

    expect(result).toBe('Twisties · 142mi')
  })

  it('should round distance to nearest mile', () => {
    const option = {
      archetype: 'adventure',
      distanceMeters: 54717, // ~34mi
    }

    const result = buildRouteTagText(option)

    expect(result).toBe('Adventure · 34mi')
  })

  it('should NOT produce generic label or empty string', () => {
    const option = {
      archetype: 'scenic',
      distanceMeters: 125531,
    }

    const result = buildRouteTagText(option)

    // DISCRIMINATING: would FAIL if the function returned a hardcoded/generic string
    expect(result).not.toBe('Route')
    expect(result).not.toBe('Route · --mi')
    expect(result).not.toBe('')
    expect(result).not.toContain('--mi')
  })

  it('should handle short distances (< 1 mile)', () => {
    const option = {
      archetype: 'technical',
      distanceMeters: 805, // ~0.5mi, rounds to 1mi via Math.round
    }

    const result = buildRouteTagText(option)

    // 805m ≈ 0.5mi, rounds to 1mi via Math.round
    expect(result).toBe('Technical · 1mi')
  })

  it('should handle very long distances', () => {
    const option = {
      archetype: 'cruising',
      distanceMeters: 1609340, // 1000 miles
    }

    const result = buildRouteTagText(option)

    expect(result).toBe('Cruising · 1000mi')
  })

  it('should work with all archetype enum values', () => {
    const archetypes = ['scenic', 'twisties', 'technical', 'cruising', 'sport', 'adventure']
    const distanceMeters = 125531 // constant

    archetypes.forEach((archetype) => {
      const option = { archetype, distanceMeters }
      const result = buildRouteTagText(option)

      // Each should produce capitalized archetype + distance
      expect(result).toMatch(/^[A-Z][a-z]+ · \d+mi$/)
      expect(result).toContain('78mi')
    })
  })
})
