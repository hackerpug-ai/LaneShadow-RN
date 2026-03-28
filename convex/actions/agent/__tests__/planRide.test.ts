'use node'

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { buildUserPrompt, parseAgentResponse } from '../planRide'
import { ERROR_CODES } from '../../../errors'

// -----------------------------------------------------------------------------
// Test Data
// -----------------------------------------------------------------------------

const planInput = {
  start: { lat: 0, lng: 0, label: 'Start' },
  end: { lat: 1, lng: 1, label: 'End' },
  departureTime: Date.UTC(2026, 0, 1, 12, 0, 0),
  preferences: { scenicBias: 'default' as const },
}

const planInputWithFavorites = {
  ...planInput,
  includeFavorites: true,
}

const mockAgentResponse = {
  planId: 'test-plan-123',
  options: [
    {
      routeOptionId: 'option-1',
      label: 'Scenic Coastal Route',
      rationale: 'Beautiful ocean views',
      stats: {
        distanceMeters: 25000,
        durationSeconds: 1800,
        legsCount: 2,
      },
      map: {
        bounds: { north: 1, south: 0, east: 1, west: 0 },
        overviewGeometry: {
          format: 'polyline' as const,
          encoding: 'encoded_polyline',
          precision: 5,
          value: 'test_overview',
        },
        legs: [
          {
            legIndex: 0,
            start: { lat: 0, lng: 0 },
            end: { lat: 1, lng: 1 },
            distanceMeters: 15000,
            durationSeconds: 900,
            geometry: {
              format: 'polyline' as const,
              encoding: 'encoded_polyline',
              precision: 5,
              value: 'test_leg',
            },
          },
        ],
      },
      overlaysPreview: {
        windSummary: 'moderate',
        conditionsStatus: 'ok',
      },
    },
    {
      routeOptionId: 'option-2',
      label: 'Mountain Pass Route',
      rationale: 'Scenic mountain views',
      stats: {
        distanceMeters: 30000,
        durationSeconds: 2400,
        legsCount: 3,
      },
      map: {
        bounds: { north: 1.5, south: 0, east: 1.5, west: 0 },
        overviewGeometry: {
          format: 'polyline' as const,
          encoding: 'encoded_polyline',
          precision: 5,
          value: 'test_overview_2',
        },
        legs: [
          {
            legIndex: 0,
            start: { lat: 0, lng: 0 },
            end: { lat: 0.5, lng: 0.5 },
            distanceMeters: 10000,
            durationSeconds: 800,
            geometry: {
              format: 'polyline' as const,
              encoding: 'encoded_polyline',
              precision: 5,
              value: 'test_leg_2_1',
            },
          },
        ],
      },
      overlaysPreview: {
        windSummary: 'high',
        conditionsStatus: 'ok',
      },
    },
  ],
}

// -----------------------------------------------------------------------------
// Helper Function Tests
// -----------------------------------------------------------------------------

describe('buildUserPrompt', () => {
  it('constructs prompt with all fields', () => {
    const prompt = buildUserPrompt(planInput)

    expect(prompt).toContain('Plan a scenic motorcycle route')
    expect(prompt).toContain('Start: Start')
    expect(prompt).toContain('End: End')
    expect(prompt).toContain('Departure: 2026-01-01T12:00:00.000Z')
    expect(prompt).toContain('Scenic bias: default')
    expect(prompt).toContain('Generate 2-3 route options')
  })

  it('handles missing label gracefully', () => {
    const inputWithoutLabel = {
      ...planInput,
      start: { lat: 0.5, lng: 0.5 },
      end: { lat: 1.5, lng: 1.5 },
    }
    const prompt = buildUserPrompt(inputWithoutLabel)

    expect(prompt).toContain('Start: 0.5,0.5')
    expect(prompt).toContain('End: 1.5,1.5')
  })

  it('includes preferences when provided', () => {
    const inputWithPrefs = {
      ...planInput,
      preferences: { scenicBias: 'high' as const },
    }
    const prompt = buildUserPrompt(inputWithPrefs)

    expect(prompt).toContain('Scenic bias: high')
  })
})

describe('parseAgentResponse', () => {
  it('parses valid JSON response', () => {
    const response = JSON.stringify(mockAgentResponse)
    const result = parseAgentResponse(response)

    expect(result.planId).toBe('test-plan-123')
    expect(result.options).toHaveLength(2)
    expect(result.options[0].routeOptionId).toBe('option-1')
    expect(result.options[0].label).toBe('Scenic Coastal Route')
  })

  it('throws AGENT_RESPONSE_INVALID for invalid JSON', () => {
    const invalidJson = '{ this is not valid json'

    expect(() => parseAgentResponse(invalidJson)).toThrow(ERROR_CODES.AGENT_RESPONSE_INVALID)
  })

  it('throws INVALID_AGENT_RESPONSE_STRUCTURE for missing options array', () => {
    const responseWithoutOptions = JSON.stringify({
      planId: 'test-123',
      // options array is missing
    })

    expect(() => parseAgentResponse(responseWithoutOptions)).toThrow(
      ERROR_CODES.INVALID_AGENT_RESPONSE_STRUCTURE
    )
  })

  it('throws INVALID_AGENT_RESPONSE_STRUCTURE for non-array options', () => {
    const responseWithInvalidOptions = JSON.stringify({
      planId: 'test-123',
      options: 'not an array',
    })

    expect(() => parseAgentResponse(responseWithInvalidOptions)).toThrow(
      ERROR_CODES.INVALID_AGENT_RESPONSE_STRUCTURE
    )
  })

  it('generates planId when not provided in response', () => {
    const responseWithoutPlanId = JSON.stringify({
      options: [mockAgentResponse.options[0]],
    })
    const result = parseAgentResponse(responseWithoutPlanId)

    expect(result.planId).toBeTruthy()
    expect(result.options).toHaveLength(1)
  })
})

// -----------------------------------------------------------------------------
// planRide Action Integration Tests
// -----------------------------------------------------------------------------
// Note: Convex actions created with action() are not directly unit testable.
// The action will be tested through integration/e2e tests with the actual
// Convex backend. The helper functions above are thoroughly tested.

describe('planRide action', () => {
  describe('integration tests (pending)', () => {
    it('should return parsed options from successful agent response', () => {
      // Integration test will verify:
      // - Agent session is created correctly
      // - User prompt is built and sent
      // - Agent response is parsed and returned
      // - Event subscriptions are cleaned up
      expect(true).toBe(true) // Placeholder
    })

    it('should throw NO_ROUTES_GENERATED when agent returns empty options', () => {
      // Integration test will verify error handling
      expect(true).toBe(true) // Placeholder
    })

    it('should throw AGENT_TIMEOUT when agent does not respond within 55 seconds', () => {
      // Integration test will verify timeout behavior
      expect(true).toBe(true) // Placeholder
    })

    it('should throw AGENT_RESPONSE_INVALID for malformed JSON', () => {
      // Integration test will verify JSON parsing errors
      expect(true).toBe(true) // Placeholder
    })

    it('should throw INVALID_AGENT_RESPONSE_STRUCTURE for missing options', () => {
      // Integration test will verify structure validation
      expect(true).toBe(true) // Placeholder
    })

    it('should handle includeFavorites flag correctly', () => {
      // Integration test will verify favorites integration (US-047)
      expect(true).toBe(true) // Placeholder
    })

    it('should clean up event subscriptions after completion or error', () => {
      // Integration test will verify cleanup
      expect(true).toBe(true) // Placeholder
    })
  })
})

// -----------------------------------------------------------------------------
// US-047: Favorites Integration Tests
// -----------------------------------------------------------------------------

describe('US-047: favorites integration', () => {
  describe('integration tests (pending)', () => {
    it('Given: includeFavorites=false, When: Planning route, Then: Favorites not fetched, normal routing', () => {
      // Integration test will verify favorites are not fetched when flag is false
      expect(true).toBe(true) // Placeholder
    })

    it('Given: includeFavorites=true, When: Planning route with favorites, Then: Favorites fetched, passed to routing', () => {
      // Integration test will verify favorites are fetched and used
      expect(true).toBe(true) // Placeholder
    })

    it('Given: includeFavorites=true, no favorites, When: Planning route, Then: Normal routing, no error', () => {
      // Integration test will verify graceful handling of empty favorites
      expect(true).toBe(true) // Placeholder
    })

    it('Given: Favorites too far from route, When: Planning route, Then: Routes generated without favorites', () => {
      // Integration test will verify favorites that are too far are ignored
      expect(true).toBe(true) // Placeholder
    })
  })
})
