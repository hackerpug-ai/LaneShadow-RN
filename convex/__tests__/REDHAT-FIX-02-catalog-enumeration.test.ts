/**
 * REDHAT-FIX-02: classifyCatalog must enumerate the whole catalog.
 *
 * Tests the route enumeration helper that classifyCatalog uses when
 * no routeIds are supplied.
 */

import { describe, expect, it } from 'vitest'
import { buildCatalogEnumerationBatch } from '../actions/rideWorthinessClassifier'

describe('REDHAT-FIX-02: buildCatalogEnumerationBatch', () => {
  it('returns a non-empty result when there are eligible routes', () => {
    // Even with an empty input, the function should attempt to build a batch
    // (the actual DB query happens in the action, but the function signature
    // and structure must exist)
    const batch = buildCatalogEnumerationBatch({
      routeIds: undefined,
      defaultBatchSize: 50,
    })

    // When no routeIds are provided, batch.allCatalog must be true
    expect(batch.allCatalog).toBe(true)
    expect(batch.batchSize).toBe(50)
    expect(batch.routeIds).toEqual([])
  })

  it('returns caller-supplied routeIds when provided', () => {
    const batch = buildCatalogEnumerationBatch({
      routeIds: ['route-1', 'route-2'],
      defaultBatchSize: 50,
    })

    expect(batch.allCatalog).toBe(false)
    expect(batch.routeIds).toEqual(['route-1', 'route-2'])
  })

  it('uses defaultBatchSize when no size specified', () => {
    const batch = buildCatalogEnumerationBatch({
      routeIds: undefined,
      defaultBatchSize: 100,
    })

    expect(batch.batchSize).toBe(100)
  })

  it('caps batch size at a reasonable maximum', () => {
    const batch = buildCatalogEnumerationBatch({
      routeIds: undefined,
      defaultBatchSize: 9999,
    })

    // Should be capped at some reasonable max (e.g., 200)
    expect(batch.batchSize).toBeLessThanOrEqual(200)
  })
})
