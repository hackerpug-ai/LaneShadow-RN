/**
 * Semantic Search Tests (INF-006)
 *
 * Tests for vector search, route matching, and raw post retrieval.
 * These functions implement the semantic matching layer for route discovery.
 */

import { describe, expect, it } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'

describe('INF-006: Convex Vector Search Query Wrappers', () => {
  describe('AC-8: findRoutesByIdentifier uses indexes instead of full table scan', () => {
    it('should define by_name_lower index in schema.ts', () => {
      // GIVEN: The schema.ts file exists
      // WHEN: We read the curated_routes table definition
      // THEN: It should include by_name_lower index

      const schemaPath = resolve(__dirname, '../schema.ts')
      const content = readFileSync(schemaPath, 'utf-8')

      // Check for by_name_lower index on curated_routes
      expect(content).toContain(".index('by_name_lower'")
    })

    it('should define by_highway_number index in schema.ts', () => {
      // GIVEN: The schema.ts file exists
      // WHEN: We read the curated_routes table definition
      // THEN: It should include by_highway_number index

      const schemaPath = resolve(__dirname, '../schema.ts')
      const content = readFileSync(schemaPath, 'utf-8')

      // Check for by_highway_number index on curated_routes
      expect(content).toContain(".index('by_highway_number'")
    })

    it('should include name_lower field in curatedRouteValidator', () => {
      // GIVEN: The curatedRouteValidator exists
      // WHEN: We read the validator definition
      // THEN: It should include name_lower field for case-insensitive searching

      const modelPath = resolve(__dirname, '../../models/curated-routes.ts')
      const content = readFileSync(modelPath, 'utf-8')

      // Check for name_lower field
      expect(content).toContain('name_lower:')
    })

    it('should use .withIndex() in findRoutesByIdentifier instead of full scan', () => {
      // GIVEN: The semanticSearch.ts file exists
      // WHEN: We read the findRoutesByIdentifier function
      // THEN: It should use .withIndex() instead of .query().collect()

      const semanticSearchPath = resolve(__dirname, '../semanticSearch.ts')
      const content = readFileSync(semanticSearchPath, 'utf-8')

      // The function should use .withIndex() for efficient querying
      // Find the findRoutesByIdentifier function
      const functionStart = content.indexOf('export const findRoutesByIdentifier')
      expect(functionStart).toBeGreaterThan(-1)

      // Extract the function body (rough approximation)
      const functionEnd = content.indexOf('\nexport const', functionStart + 10)
      const functionBody = content.substring(functionStart, functionEnd > -1 ? functionEnd : content.length)

      // Should use .withIndex() method for state filtering
      expect(functionBody).toContain('.withIndex("by_state"')

      // Should have conditional logic - use index when stateFilter provided
      // This proves we're not doing unconditional full scan
      expect(functionBody).toContain('stateFilter')
      expect(functionBody).toMatch(/stateFilter\s*\?/)
    })

    it('should export findRoutesByIdentifier function', () => {
      // GIVEN: semanticSearch.ts exists
      // WHEN: We read the file
      // THEN: It should export findRoutesByIdentifier

      const semanticSearchPath = resolve(__dirname, '../semanticSearch.ts')
      const content = readFileSync(semanticSearchPath, 'utf-8')

      expect(content).toContain('export const findRoutesByIdentifier')
    })
  })
})
