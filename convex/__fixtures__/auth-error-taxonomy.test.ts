import { describe, expect, it } from 'vitest'
import { ERROR_CODES } from '../errors'
import taxonomy from './auth-error-taxonomy.json'

describe('auth-error-taxonomy fixture', () => {
  it('AC-7: fixture JSON is valid and covers every ERROR_CODES entry with mobile_mapping_target', () => {
    // Verify fixture is an array
    expect(Array.isArray(taxonomy)).toBe(true)

    // Verify every ERROR_CODES value has an entry in the fixture
    const codes = Object.values(ERROR_CODES)
    const fixtureCodesSet = new Set(taxonomy.map((entry: any) => entry.code))

    for (const code of codes) {
      expect(fixtureCodesSet.has(code), `Code ${code} missing from fixture`).toBe(true)
    }

    // Verify each entry has required fields
    for (const entry of taxonomy) {
      expect(entry.code).toBeDefined()
      expect(entry.description).toBeDefined()
      expect(typeof entry.description).toBe('string')
      expect(entry.description.length).toBeGreaterThan(0)
      expect(entry.mobile_mapping_target).toBeDefined()
      expect(typeof entry.mobile_mapping_target).toBe('string')
      expect(entry.mobile_mapping_target.length).toBeGreaterThan(0)
    }

    // Verify specific mappings for auth codes
    const unauthEntry = taxonomy.find((e: any) => e.code === ERROR_CODES.UNAUTHENTICATED)
    expect(unauthEntry?.mobile_mapping_target).toBe('Unauthenticated')

    const forbiddenEntry = taxonomy.find((e: any) => e.code === ERROR_CODES.FORBIDDEN)
    expect(forbiddenEntry?.mobile_mapping_target).toBe('Forbidden')
  })
})
