/**
 * Curation Schema Tests
 *
 * TDD tests for CONVEX-002: Verify curation tables are registered with correct indexes
 * These tests inspect the schema export to ensure tables and indexes are properly defined.
 */

import { describe, it, expect } from 'vitest'

describe('curation schema registration', () => {
  describe('AC-1: curated_routes table', () => {
    it('curated_routes table is registered with required indexes', async () => {
      const schema = await import('../schema')
      const tables = (schema.default as any).tables
      const table = tables.curated_routes

      // Verify table exists
      expect(table).toBeDefined()
      expect(table.tableName).toBe('curated_routes')

      // Verify all required indexes exist
      const indexNames = table.indexes.map((i: any) => i.indexDescriptor)
      expect(indexNames).toContain('by_source')
      expect(indexNames).toContain('by_archetype')
      expect(indexNames).toContain('by_state')
      expect(indexNames).toContain('by_composite_score')

      // Verify index field configurations
      const bySourceIndex = table.indexes.find((i: any) => i.indexDescriptor === 'by_source')
      expect(bySourceIndex?.fields).toEqual(['source'])

      const byArchetypeIndex = table.indexes.find((i: any) => i.indexDescriptor === 'by_archetype')
      expect(byArchetypeIndex?.fields).toEqual(['primaryArchetype'])

      const byStateIndex = table.indexes.find((i: any) => i.indexDescriptor === 'by_state')
      expect(byStateIndex?.fields).toEqual(['state'])

      const byCompositeScoreIndex = table.indexes.find((i: any) => i.indexDescriptor === 'by_composite_score')
      expect(byCompositeScoreIndex?.fields).toEqual(['compositeScore'])
    })
  })

  describe('AC-2: curated_route_enrichments table', () => {
    it('curated_route_enrichments table is registered with by_routeId index', async () => {
      const schema = await import('../schema')
      const tables = (schema.default as any).tables
      const table = tables.curated_route_enrichments

      // Verify table exists
      expect(table).toBeDefined()
      expect(table.tableName).toBe('curated_route_enrichments')

      // Verify by_routeId index exists
      const indexNames = table.indexes.map((i: any) => i.indexDescriptor)
      expect(indexNames).toContain('by_routeId')

      // Verify index field configuration
      const byRouteIdIndex = table.indexes.find((i: any) => i.indexDescriptor === 'by_routeId')
      expect(byRouteIdIndex?.fields).toEqual(['routeId'])
    })
  })

  describe('AC-3: route_feedback table', () => {
    it('route_feedback table is registered with required indexes', async () => {
      const schema = await import('../schema')
      const tables = (schema.default as any).tables
      const table = tables.route_feedback

      // Verify table exists
      expect(table).toBeDefined()
      expect(table.tableName).toBe('route_feedback')

      // Verify all required indexes exist
      const indexNames = table.indexes.map((i: any) => i.indexDescriptor)
      expect(indexNames).toContain('by_user')
      expect(indexNames).toContain('by_route')
      expect(indexNames).toContain('by_action')

      // Verify index field configurations
      const byUserIndex = table.indexes.find((i: any) => i.indexDescriptor === 'by_user')
      expect(byUserIndex?.fields).toEqual(['userId'])

      const byRouteIndex = table.indexes.find((i: any) => i.indexDescriptor === 'by_route')
      expect(byRouteIndex?.fields).toEqual(['routeId'])

      const byActionIndex = table.indexes.find((i: any) => i.indexDescriptor === 'by_action')
      expect(byActionIndex?.fields).toEqual(['action'])
    })
  })
})
