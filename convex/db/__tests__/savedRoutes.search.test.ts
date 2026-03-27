import { applySearchFilter } from '../savedRoutes.utils'

type RouteItem = { savedRouteId: string; name: string }

const makeRoutes = (names: string[]): RouteItem[] =>
  names.map((name, idx) => ({ savedRouteId: `id-${idx}`, name }))

describe('applySearchFilter', () => {
  const routes = makeRoutes([
    'Morning Park Run',
    'Evening Commute',
    'Central Park Loop',
    'River Trail',
    'Hill Climb',
  ])

  it('AC-1: filters routes by name containing searchQuery case-insensitively', () => {
    const result = applySearchFilter(routes, 'park')
    expect(result).toHaveLength(2)
    expect(result.map((r) => r.name)).toEqual(['Morning Park Run', 'Central Park Loop'])
  })

  it('AC-2: returns all routes when searchQuery is undefined', () => {
    const result = applySearchFilter(routes, undefined)
    expect(result).toHaveLength(5)
  })

  it('AC-3: returns all routes when searchQuery is empty string', () => {
    const result = applySearchFilter(routes, '')
    expect(result).toHaveLength(5)
  })

  it('AC-4: returns empty array when no routes match searchQuery', () => {
    const result = applySearchFilter(routes, 'zzz-no-match')
    expect(result).toHaveLength(0)
  })
})
