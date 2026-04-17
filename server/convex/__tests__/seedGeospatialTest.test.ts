/**
 * TDD Tests for VAL-004 - Convex Geospatial Index Setup
 *
 * AC-3: 100 seed routes inserted with valid coordinates
 * AC-7: Seeded routes span at least 5 distinct US states
 */

import { readFileSync } from 'fs'
import { resolve } from 'path'
import { describe, expect, it } from 'vitest'

describe('AC-3: 100 seed routes inserted with valid coordinates', () => {
  it('seedGeospatialTest.ts file exists', () => {
    // GIVEN: A seed mutation is defined in convex/seedGeospatialTest.ts

    // WHEN: We check for the file
    // THEN: It should exist
    const seedFilePath = resolve(__dirname, '../seedGeospatialTest.ts')
    expect(() => readFileSync(seedFilePath, 'utf-8')).not.toThrow()
  })

  it('seedRoutes mutation is exported', () => {
    // GIVEN: seedGeospatialTest.ts exists
    // WHEN: We read the file content
    // THEN: It should export the seedRoutes mutation

    const seedFilePath = resolve(__dirname, '../seedGeospatialTest.ts')
    const content = readFileSync(seedFilePath, 'utf-8')

    expect(content).toContain('export const seedRoutes')
  })

  it('countSeeded query is exported', () => {
    // GIVEN: A count query is defined in convex/seedGeospatialTest.ts

    // WHEN: We read the file content
    // THEN: It should export the countSeeded query

    const seedFilePath = resolve(__dirname, '../seedGeospatialTest.ts')
    const content = readFileSync(seedFilePath, 'utf-8')

    expect(content).toContain('export const countSeeded')
  })

  it('TEST_ROUTES array contains exactly 100 routes', () => {
    // GIVEN: The seedGeospatialTest.ts file is implemented
    // WHEN: We read the file to check TEST_ROUTES
    // THEN: It should contain exactly 100 test routes

    const seedFilePath = resolve(__dirname, '../seedGeospatialTest.ts')
    const content = readFileSync(seedFilePath, 'utf-8')

    // Count the number of route entries in TEST_ROUTES array
    const routeCount = (content.match(/\{ name: "Test Route/g) || []).length
    expect(routeCount).toBe(100)
  })
})

describe('AC-7: Seeded routes span at least 5 distinct US states', () => {
  it('countStates query is exported', () => {
    // GIVEN: A countStates query is defined in convex/seedGeospatialTest.ts

    // WHEN: We read the file content
    // THEN: It should export the countStates query

    const seedFilePath = resolve(__dirname, '../seedGeospatialTest.ts')
    const content = readFileSync(seedFilePath, 'utf-8')

    expect(content).toContain('export const countStates')
  })

  it('TEST_ROUTES spans at least 5 distinct US states', () => {
    // GIVEN: The seedGeospatialTest.ts file is implemented
    // WHEN: We read the file to check TEST_ROUTES
    // THEN: It should contain routes from at least 5 distinct states

    const seedFilePath = resolve(__dirname, '../seedGeospatialTest.ts')
    const content = readFileSync(seedFilePath, 'utf-8')

    // Extract unique state codes from TEST_ROUTES
    const stateMatches = content.match(/state: "([A-Z]{2})"/g) || []
    const uniqueStates = new Set(stateMatches.map((match) => match.split('"')[1]))

    expect(uniqueStates.size).toBeGreaterThanOrEqual(5)
  })
})
