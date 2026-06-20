/**
 * AC-4: deduplicateRouteOptions Unit Tests
 *
 * Tests the pure reducer that collapses efficiency-variant duplicates.
 *
 * Test tier: unit
 * Service: pure function (no I/O)
 * Justification: Pure array->array reducer with zero I/O;
 *                screen behavior covered by AC-1..AC-3 integration tests
 */

import { describe, it, expect } from 'vitest'
import { deduplicateRouteOptions } from './dedupe-route-options'
import type { PlannedRouteOptionView } from '../../shared/types/routes'

describe('deduplicateRouteOptions', () => {
  /**
   * AC-4: collapsesIdenticalVariants
   *
   * GIVEN an options array where two entries share label+distance+overviewGeometry
   *       (a backend efficiency-variant duplicate) and a third differs,
   *       plus one with undefined geometry
   * WHEN the pure deduplicateRouteOptions reducer runs
   * THEN it returns a list with the duplicate collapsed to a single distinct route
   *      ([A, A_dup, B] → [A, B]), preserving order, never throwing on
   *      empty/undefined geometry
   *
   * Verifies:
   * - result.length === 2 (duplicates removed)
   * - result[0].routeOptionId === A.routeOptionId (first occurrence wins)
   * - result[1].routeOptionId === B.routeOptionId (distinct route preserved)
   * - No throw on undefined overviewGeometry
   * - Order preserved (A before B)
   */
  it('collapsesIdenticalVariants', () => {
    // Arrange: Create three route options where A and A_dup are byte-identical
    // (same label, distance, overviewGeometry) and B is genuinely different

    const optionA: PlannedRouteOptionView = {
      routeOptionId: 'route-1-efficient',
      label: 'Efficient',
      rationale: 'Fastest route',
      stats: {
        distanceMeters: 103_000, // ~64 miles
        durationSeconds: 5400, // ~90 min
        legsCount: 3,
      },
      map: {
        bounds: { minX: -122.5, maxX: -122.0, minY: 37.7, maxY: 37.8 },
        overviewGeometry: 'encoded_poly_G1',
        legs: [],
      },
      overlaysPreview: {
        windSummary: { average: 5, max: 10 },
        rainSummary: { probability: 0.1 },
        temperatureSummary: { average: 68 },
        conditionsStatus: 'ok',
      },
    }

    const optionA_dup: PlannedRouteOptionView = {
      // Efficiency variant: identical to A
      routeOptionId: 'route-1-efficient-variant',
      label: 'Efficient', // SAME label
      rationale: 'Fastest route (variant)',
      stats: {
        distanceMeters: 103_000, // SAME distance
        durationSeconds: 5400,
        legsCount: 3,
      },
      map: {
        bounds: { minX: -122.5, maxX: -122.0, minY: 37.7, maxY: 37.8 },
        overviewGeometry: 'encoded_poly_G1', // SAME geometry
        legs: [],
      },
      overlaysPreview: {
        windSummary: { average: 5, max: 10 },
        rainSummary: { probability: 0.1 },
        temperatureSummary: { average: 68 },
        conditionsStatus: 'ok',
      },
    }

    const optionB: PlannedRouteOptionView = {
      routeOptionId: 'route-2-scenic',
      label: 'Scenic Coastal',
      rationale: 'Most scenic route',
      stats: {
        distanceMeters: 125_000, // ~78 miles (different)
        durationSeconds: 7200, // ~2 hours
        legsCount: 5,
      },
      map: {
        bounds: { minX: -122.8, maxX: -122.0, minY: 37.0, maxY: 37.9 },
        overviewGeometry: 'encoded_poly_G2', // DIFFERENT geometry
        legs: [],
      },
      overlaysPreview: {
        windSummary: { average: 8, max: 15 },
        rainSummary: { probability: 0.2 },
        temperatureSummary: { average: 65 },
        conditionsStatus: 'ok',
      },
    }

    const optionC: PlannedRouteOptionView = {
      // Variant with undefined overviewGeometry — should not throw
      routeOptionId: 'route-3-undefined-geo',
      label: 'Unknown',
      rationale: 'Route with missing geometry',
      stats: {
        distanceMeters: 0,
        durationSeconds: 0,
        legsCount: 0,
      },
      map: {
        bounds: { minX: 0, maxX: 0, minY: 0, maxY: 0 },
        overviewGeometry: undefined, // UNDEFINED geometry
        legs: [],
      },
      overlaysPreview: {
        windSummary: { average: 0, max: 0 },
        rainSummary: { probability: 0 },
        temperatureSummary: { average: 0 },
        conditionsStatus: 'unavailable',
      },
    }

    const input = [optionA, optionA_dup, optionB, optionC]

    // Act: Run the deduplication reducer
    const result = deduplicateRouteOptions(input)

    // Assert: Result has 3 distinct routes (A, B, C; A_dup removed)
    expect(result).toHaveLength(3)

    // Assert: First occurrence of A wins
    expect(result[0]?.routeOptionId).toBe('route-1-efficient')
    expect(result[0]?.label).toBe('Efficient')

    // Assert: B is preserved as-is
    expect(result[1]?.routeOptionId).toBe('route-2-scenic')
    expect(result[1]?.label).toBe('Scenic Coastal')

    // Assert: C is preserved even with undefined geometry
    expect(result[2]?.routeOptionId).toBe('route-3-undefined-geo')

    // Assert: Order preserved (input order maintained)
    expect(result.map((r) => r.routeOptionId)).toEqual([
      'route-1-efficient',
      'route-2-scenic',
      'route-3-undefined-geo',
    ])
  })

  /**
   * Edge case: Empty array
   */
  it('handles empty array', () => {
    const result = deduplicateRouteOptions([])
    expect(result).toEqual([])
  })

  /**
   * Edge case: Single route (no duplicates)
   */
  it('handles single route', () => {
    const singleRoute: PlannedRouteOptionView = {
      routeOptionId: 'route-1',
      label: 'Route 1',
      rationale: 'Only route',
      stats: {
        distanceMeters: 100_000,
        durationSeconds: 5400,
        legsCount: 1,
      },
      map: {
        bounds: { minX: 0, maxX: 1, minY: 0, maxY: 1 },
        overviewGeometry: 'poly_1',
        legs: [],
      },
      overlaysPreview: {
        windSummary: { average: 5, max: 10 },
        rainSummary: { probability: 0.1 },
        temperatureSummary: { average: 68 },
        conditionsStatus: 'ok',
      },
    }

    const result = deduplicateRouteOptions([singleRoute])
    expect(result).toHaveLength(1)
    expect(result[0]).toEqual(singleRoute)
  })

  /**
   * Edge case: All routes are identical (full dedup)
   */
  it('dedupes when all routes are identical', () => {
    const route: PlannedRouteOptionView = {
      routeOptionId: 'route-1',
      label: 'Route 1',
      rationale: 'Route',
      stats: {
        distanceMeters: 100_000,
        durationSeconds: 5400,
        legsCount: 1,
      },
      map: {
        bounds: { minX: 0, maxX: 1, minY: 0, maxY: 1 },
        overviewGeometry: 'poly_1',
        legs: [],
      },
      overlaysPreview: {
        windSummary: { average: 5, max: 10 },
        rainSummary: { probability: 0.1 },
        temperatureSummary: { average: 68 },
        conditionsStatus: 'ok',
      },
    }

    const identicalRoute: PlannedRouteOptionView = { ...route, routeOptionId: 'route-1-dup' }

    const result = deduplicateRouteOptions([route, identicalRoute])
    expect(result).toHaveLength(1)
    expect(result[0]?.routeOptionId).toBe('route-1') // First occurrence wins
  })

  /**
   * Negative control: Does NOT collapse genuinely different routes
   * (e.g., different distance or geometry)
   */
  it('preserves genuinely different routes', () => {
    const routeA: PlannedRouteOptionView = {
      routeOptionId: 'route-a',
      label: 'Route A',
      rationale: 'A',
      stats: {
        distanceMeters: 100_000,
        durationSeconds: 5400,
        legsCount: 1,
      },
      map: {
        bounds: { minX: 0, maxX: 1, minY: 0, maxY: 1 },
        overviewGeometry: 'poly_a',
        legs: [],
      },
      overlaysPreview: {
        windSummary: { average: 5, max: 10 },
        rainSummary: { probability: 0.1 },
        temperatureSummary: { average: 68 },
        conditionsStatus: 'ok',
      },
    }

    const routeB: PlannedRouteOptionView = {
      routeOptionId: 'route-b',
      label: 'Route B', // DIFFERENT label
      rationale: 'B',
      stats: {
        distanceMeters: 120_000, // DIFFERENT distance
        durationSeconds: 6000,
        legsCount: 1,
      },
      map: {
        bounds: { minX: 0, maxX: 1, minY: 0, maxY: 1 },
        overviewGeometry: 'poly_b', // DIFFERENT geometry
        legs: [],
      },
      overlaysPreview: {
        windSummary: { average: 5, max: 10 },
        rainSummary: { probability: 0.1 },
        temperatureSummary: { average: 68 },
        conditionsStatus: 'ok',
      },
    }

    const result = deduplicateRouteOptions([routeA, routeB])
    expect(result).toHaveLength(2) // Both preserved
    expect(result[0]?.routeOptionId).toBe('route-a')
    expect(result[1]?.routeOptionId).toBe('route-b')
  })
})
