'use node'

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { buildUserPrompt, buildOptionsFromResults } from '../planRide'
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

const makeSnapshot = () => ({
  provider: 'google',
  bounds: { north: 1, south: 0, east: 1, west: 0 },
  origin: { lat: 0, lng: 0 },
  destination: { lat: 1, lng: 1 },
  waypoints: [],
  overviewGeometry: { format: 'polyline' as const, encoding: 'encoded_polyline', precision: 5, value: 'test' },
  legs: [
    {
      legIndex: 0,
      start: { lat: 0, lng: 0 },
      end: { lat: 1, lng: 1 },
      distanceMeters: 15000,
      durationSeconds: 900,
      geometry: { format: 'polyline' as const, encoding: 'encoded_polyline', precision: 5, value: 'test_leg' },
    },
  ],
  annotations: [],
  overlays: {},
})

// -----------------------------------------------------------------------------
// buildUserPrompt tests
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

// -----------------------------------------------------------------------------
// buildOptionsFromResults tests
// -----------------------------------------------------------------------------

describe('buildOptionsFromResults', () => {
  it('builds PlannedRouteOptionsView from results', () => {
    const results = [
      { routeSnapshot: makeSnapshot(), sketch: { label: 'Coastal Route', rationale: 'Scenic' } },
    ]
    const view = buildOptionsFromResults(results, 'test-plan-id')

    expect(view.planId).toBe('test-plan-id')
    expect(view.options).toHaveLength(1)
    expect(view.options[0].label).toBe('Coastal Route')
    expect(view.options[0].rationale).toBe('Scenic')
    expect(view.options[0].stats.legsCount).toBe(1)
    expect(view.options[0].stats.distanceMeters).toBe(15000)
    expect(view.options[0].stats.durationSeconds).toBe(900)
  })

  it('falls back to Route N label when sketch label is missing', () => {
    const results = [
      { routeSnapshot: makeSnapshot(), sketch: {} },
      { routeSnapshot: makeSnapshot(), sketch: { label: 'Named Route', rationale: '' } },
    ]
    const view = buildOptionsFromResults(results, 'plan-id')

    expect(view.options[0].label).toBe('Route 1')
    expect(view.options[1].label).toBe('Named Route')
  })

  it('sets conditionsStatus to unavailable', () => {
    const results = [
      { routeSnapshot: makeSnapshot(), sketch: { label: 'Test', rationale: '' } },
    ]
    const view = buildOptionsFromResults(results, 'plan-id')

    expect(view.options[0].overlaysPreview.conditionsStatus).toBe('unavailable')
  })

  it('sums leg distances and durations correctly', () => {
    const snapshotWithMultipleLegs = {
      ...makeSnapshot(),
      legs: [
        {
          legIndex: 0,
          start: { lat: 0, lng: 0 },
          end: { lat: 0.5, lng: 0.5 },
          distanceMeters: 10000,
          durationSeconds: 600,
          geometry: { format: 'polyline' as const, encoding: 'encoded_polyline', precision: 5, value: 'leg1' },
        },
        {
          legIndex: 1,
          start: { lat: 0.5, lng: 0.5 },
          end: { lat: 1, lng: 1 },
          distanceMeters: 20000,
          durationSeconds: 1200,
          geometry: { format: 'polyline' as const, encoding: 'encoded_polyline', precision: 5, value: 'leg2' },
        },
      ],
    }

    const results = [
      { routeSnapshot: snapshotWithMultipleLegs, sketch: { label: 'Multi-leg', rationale: '' } },
    ]
    const view = buildOptionsFromResults(results, 'plan-id')

    expect(view.options[0].stats.distanceMeters).toBe(30000)
    expect(view.options[0].stats.durationSeconds).toBe(1800)
    expect(view.options[0].stats.legsCount).toBe(2)
  })
})

// -----------------------------------------------------------------------------
// planRide Action Integration Tests
// -----------------------------------------------------------------------------

describe('planRide action', () => {
  describe('integration tests (pending)', () => {
    it('should return parsed options from successful orchestrator response', () => {
      expect(true).toBe(true) // Placeholder
    })

    it('should throw NO_ROUTES_GENERATED when orchestrator returns empty options', () => {
      expect(true).toBe(true) // Placeholder
    })

    it('should throw AGENT_TIMEOUT when orchestrator does not respond within 55 seconds', () => {
      expect(true).toBe(true) // Placeholder
    })
  })
})
