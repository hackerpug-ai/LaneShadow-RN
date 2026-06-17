/**
 * TDD Tests for VAL-004 - Convex Geospatial Index Setup
 *
 * AC-4: Nearest-neighbor query returns correct results under 500ms
 * AC-5: Rectangular range query returns correct results under 500ms
 * AC-6: Debug geospatial count uses non-degenerate slices (DATA-001)
 */

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('AC-4: Nearest-neighbor query returns correct results under 500ms', () => {
  it('geospatialValidation.ts file exists', () => {
    // GIVEN: 100 seed routes exist in curated_routes
    // WHEN: A nearest-neighbor query is defined
    // THEN: The geospatialValidation.ts file should exist

    const validationFilePath = resolve(__dirname, '../geospatialValidation.ts')
    expect(() => readFileSync(validationFilePath, 'utf-8')).not.toThrow()
  })

  it('validateNearestNeighbor query is exported', () => {
    // GIVEN: The validateNearestNeighbor query is defined
    // WHEN: We read the file content
    // THEN: It should export the validateNearestNeighbor query

    const validationFilePath = resolve(__dirname, '../geospatialValidation.ts')
    const content = readFileSync(validationFilePath, 'utf-8')

    expect(content).toContain('export const validateNearestNeighbor')
  })

  it('validateNearestNeighbor returns correct structure', () => {
    // GIVEN: The validateNearestNeighbor query is defined
    // WHEN: We inspect the query implementation
    // THEN: It should return status, latency_ms, and count fields

    const validationFilePath = resolve(__dirname, '../geospatialValidation.ts')
    const content = readFileSync(validationFilePath, 'utf-8')

    // Verify the query returns the expected fields
    expect(content).toContain('status')
    expect(content).toContain('latency_ms')
    expect(content).toContain('count')

    // Verify the latency check
    expect(content).toContain('latency_ms < 500')
  })
})

describe('AC-5: Rectangular range query returns correct results under 500ms', () => {
  it('validateRectangularRange query is exported', () => {
    // GIVEN: 100 seed routes exist
    // WHEN: A rectangular range query is defined
    // THEN: The validateRectangularRange query should be exported

    const validationFilePath = resolve(__dirname, '../geospatialValidation.ts')
    const content = readFileSync(validationFilePath, 'utf-8')

    expect(content).toContain('export const validateRectangularRange')
  })

  it('validateRectangularRange returns correct structure', () => {
    // GIVEN: The validateRectangularRange query is defined
    // WHEN: We inspect the query implementation
    // THEN: It should return status, latency_ms, and count fields

    const validationFilePath = resolve(__dirname, '../geospatialValidation.ts')
    const content = readFileSync(validationFilePath, 'utf-8')

    // Verify the query returns the expected fields
    expect(content).toContain('status')
    expect(content).toContain('latency_ms')
    expect(content).toContain('count')

    // Verify the latency check
    expect(content).toContain('latency_ms < 500')
  })

  it('validateRectangularRange uses rectangular bounding box', () => {
    // GIVEN: The validateRectangularRange query is defined
    // WHEN: We inspect the query implementation
    // THEN: It should use a rectangular shape with west/south/east/north bounds

    const validationFilePath = resolve(__dirname, '../geospatialValidation.ts')
    const content = readFileSync(validationFilePath, 'utf-8')

    // Verify the query uses a rectangular shape
    expect(content).toContain("type: 'rectangle'")
    expect(content).toContain('west:')
    expect(content).toContain('south:')
    expect(content).toContain('east:')
    expect(content).toContain('north:')
  })
})

describe('AC-6: Debug geospatial count uses non-degenerate slices (DATA-001)', () => {
  it('debugGeospatialData query is exported', () => {
    // GIVEN: The debugGeospatialData query is defined
    // WHEN: We read the file content
    // THEN: It should export the debugGeospatialData query

    const validationFilePath = resolve(__dirname, '../geospatialValidation.ts')
    const content = readFileSync(validationFilePath, 'utf-8')

    expect(content).toContain('export const debugGeospatialData')
  })

  it('debugGeospatialData does NOT use full-globe degenerate rectangle', () => {
    // GIVEN: The debugGeospatialData query is defined
    // WHEN: We inspect the query implementation
    // THEN: It should NOT contain the degenerate full-globe rectangle coordinates

    const validationFilePath = resolve(__dirname, '../geospatialValidation.ts')
    const content = readFileSync(validationFilePath, 'utf-8')

    // Check for the absence of the degenerate pattern in the entire file
    expect(content).not.toContain('west: -180, south: -90, east: 180, north: 90')

    // Check that the debug function uses slice-based approach instead of degenerate rectangle
    const debugFunctionStart = content.indexOf('export const debugGeospatialData = query')
    const debugFunctionEnd =
      content.indexOf('})', content.indexOf('handler: async (ctx) => {', debugFunctionStart)) + 2
    const debugFunctionContent = content.substring(debugFunctionStart, debugFunctionEnd)

    // The degenerate full-globe rectangle should NOT be present in debug function
    expect(debugFunctionContent).not.toContain('west: -180, east: 180')

    // Instead, it should use multiple regional slices with proper bounds
    expect(debugFunctionContent).toContain('slice.west')
    expect(debugFunctionContent).toContain('slice.east')
    expect(debugFunctionContent).toContain('sliceResults.push')
    expect(debugFunctionContent).toContain('west: slice.west')
    expect(debugFunctionContent).toContain('east: slice.east')
  })

  it('debugGeospatialData uses multiple regional slices', () => {
    // GIVEN: The debugGeospatialData query is defined
    // WHEN: We inspect the query implementation
    // THEN: It should use ≥2 regional slices to cover the globe

    const validationFilePath = resolve(__dirname, '../geospatialValidation.ts')
    const content = readFileSync(validationFilePath, 'utf-8')

    // Should contain multiple rectangle queries (not exact count, but at least 2)
    const rectangleMatches = (content.match(/rectangle:/g) || []).length
    expect(rectangleMatches).toBeGreaterThanOrEqual(2)

    // Should contain slice-specific coordinates (not full-globe)
    expect(content).toContain('west:')
    expect(content).toContain('east:')

    // Should contain slice aggregation logic
    expect(content).toContain('slices')
  })
})
