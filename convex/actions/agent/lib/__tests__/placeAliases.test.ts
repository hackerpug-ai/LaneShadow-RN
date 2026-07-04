'use node'

import { describe, expect, it } from 'vitest'

import { normalizePlaceQueryForGeocode } from '../placeAliases'

describe('normalizePlaceQueryForGeocode', () => {
  it('expands common city shorthand that riders type in route searches', () => {
    expect(normalizePlaceQueryForGeocode('SF')).toBe('San Francisco, CA')
    expect(normalizePlaceQueryForGeocode('S.F.')).toBe('San Francisco, CA')
    expect(normalizePlaceQueryForGeocode('DFW')).toBe('Dallas-Fort Worth, TX')
    expect(normalizePlaceQueryForGeocode('NY')).toBe('New York City, NY')
    expect(normalizePlaceQueryForGeocode('NYC')).toBe('New York City, NY')
  })

  it('repairs compact Santa Cruz variants from natural-language route input', () => {
    expect(normalizePlaceQueryForGeocode('Santacruze')).toBe('Santa Cruz, CA')
    expect(normalizePlaceQueryForGeocode('SantaCruz')).toBe('Santa Cruz, CA')
  })

  it('leaves non-alias place queries untouched', () => {
    expect(normalizePlaceQueryForGeocode('Half Moon Bay')).toBe('Half Moon Bay')
  })
})
