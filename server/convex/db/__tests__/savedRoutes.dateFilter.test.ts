import { describe, it, expect } from 'vitest'
import { applyDateFilter, applySearchFilter } from '../savedRoutes.utils'

type RouteItem = { savedRouteId: string; name: string; createdAt: number }

const now = 1000000000000 // fixed epoch ms for determinism
const oneWeekMs = 7 * 24 * 60 * 60 * 1000
const oneMonthMs = 30 * 24 * 60 * 60 * 1000

const makeRoutes = (offsets: number[]): RouteItem[] =>
  offsets.map((offset, idx) => ({
    savedRouteId: `id-${idx}`,
    name: `Route ${idx}`,
    createdAt: now + offset,
  }))

describe('applyDateFilter', () => {
  // Routes: one created 2 weeks ago, one 2 days ago, one at now
  const routes = makeRoutes([-2 * oneWeekMs, -2 * 24 * 60 * 60 * 1000, 0])

  it('AC-1: afterDate filters to routes created within the last 7 days', () => {
    const afterDate = now - oneWeekMs
    const result = applyDateFilter(routes, afterDate, undefined)
    // Only routes created >= afterDate (2 days ago and now, but NOT 2 weeks ago)
    expect(result).toHaveLength(2)
    expect(result.map((r) => r.savedRouteId)).toEqual(['id-1', 'id-2'])
  })

  it('AC-2: beforeDate filters to routes created before one month ago', () => {
    const twoWeeksAgo = now - 2 * oneWeekMs
    const result = applyDateFilter(routes, undefined, twoWeeksAgo)
    // Only routes created <= 2 weeks ago (exactly the first route)
    expect(result).toHaveLength(1)
    expect(result[0].savedRouteId).toBe('id-0')
  })

  it('AC-3: both searchQuery and date compose — only returns routes matching BOTH', () => {
    const namedRoutes = [
      { savedRouteId: 'id-0', name: 'park trail', createdAt: now - 2 * oneWeekMs },
      { savedRouteId: 'id-1', name: 'park loop', createdAt: now - 2 * 24 * 60 * 60 * 1000 },
      { savedRouteId: 'id-2', name: 'river run', createdAt: now - 2 * 24 * 60 * 60 * 1000 },
    ]
    const afterDate = now - oneWeekMs
    const afterFilter = applyDateFilter(namedRoutes, afterDate, undefined)
    const bothFilters = applySearchFilter(afterFilter, 'park')
    // Only id-1 matches both: name has "park" AND createdAt >= afterDate
    expect(bothFilters).toHaveLength(1)
    expect(bothFilters[0].savedRouteId).toBe('id-1')
  })

  it('AC-4: no date args returns all routes (backward compatible)', () => {
    const result = applyDateFilter(routes, undefined, undefined)
    expect(result).toHaveLength(3)
  })
})
