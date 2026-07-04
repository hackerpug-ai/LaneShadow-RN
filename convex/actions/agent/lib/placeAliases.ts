'use node'

const EXACT_PLACE_ALIASES: Record<string, string> = {
  dfw: 'Dallas-Fort Worth, TX',
  'dallas fort worth': 'Dallas-Fort Worth, TX',
  la: 'Los Angeles, CA',
  ny: 'New York City, NY',
  nyc: 'New York City, NY',
  sf: 'San Francisco, CA',
}

const COMPACT_PLACE_ALIASES: Record<string, string> = {
  dallasfortworth: 'Dallas-Fort Worth, TX',
  newyork: 'New York City, NY',
  newyorkcity: 'New York City, NY',
  santacruz: 'Santa Cruz, CA',
  santacruze: 'Santa Cruz, CA',
  sanfrancisco: 'San Francisco, CA',
  sf: 'San Francisco, CA',
}

const normalizedExactKey = (query: string): string =>
  query
    .trim()
    .toLowerCase()
    .replace(/[._-]+/g, ' ')
    .replace(/\s+/g, ' ')

const compactKey = (query: string): string =>
  query
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')

export function normalizePlaceQueryForGeocode(query: string): string {
  const exact = normalizedExactKey(query)
  const exactMatch = EXACT_PLACE_ALIASES[exact]
  if (exactMatch) return exactMatch

  const compact = compactKey(query)
  const compactMatch = COMPACT_PLACE_ALIASES[compact]
  if (compactMatch) return compactMatch

  return query.trim()
}
