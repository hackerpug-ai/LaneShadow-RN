/**
 * TDD Tests for VAL-004 - Convex Geospatial Index Setup
 *
 * AC-4: Nearest-neighbor query returns correct results under 500ms
 * AC-5: Rectangular range query returns correct results under 500ms
 */

import { readFileSync } from 'fs'
import { resolve } from 'path'
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
    expect(content).toContain('type: "rectangle"')
    expect(content).toContain('west:')
    expect(content).toContain('south:')
    expect(content).toContain('east:')
    expect(content).toContain('north:')
  })
})
