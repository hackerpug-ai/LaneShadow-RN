import { assertType, describe, expect, it } from 'vitest'
import { clampLength, normalizeState, stateVariants } from '../util/dataNormalization'

describe('normalizeState', () => {
  it("should normalize 'North-Carolina' to 'North Carolina'", () => {
    expect(normalizeState('North-Carolina')).toBe('North Carolina')
  })

  it("should normalize 'north carolina' to 'North Carolina'", () => {
    expect(normalizeState('north carolina')).toBe('North Carolina')
  })

  it("should normalize 'North Carolina' to 'North Carolina'", () => {
    expect(normalizeState('North Carolina')).toBe('North Carolina')
  })

  it('should handle extra spaces and trim', () => {
    expect(normalizeState('  north   carolina  ')).toBe('North Carolina')
  })

  it('should handle underscores', () => {
    expect(normalizeState('North_Carolina')).toBe('North Carolina')
  })

  it('should handle mixed delimiters', () => {
    expect(normalizeState('North-Carolina_Texas')).toBe('North Carolina Texas')
  })
})

describe('clampLength', () => {
  it('should return 45 for valid length', () => {
    expect(clampLength(45)).toBe(45)
  })

  it('should return 500 for valid length', () => {
    expect(clampLength(500)).toBe(500)
  })

  it('should return undefined for 710430 (above ceiling)', () => {
    expect(clampLength(710430)).toBeUndefined()
  })

  it('should return undefined for 0', () => {
    expect(clampLength(0)).toBeUndefined()
  })

  it('should return undefined for negative number', () => {
    expect(clampLength(-5)).toBeUndefined()
  })

  it('should return undefined for undefined input', () => {
    expect(clampLength(undefined)).toBeUndefined()
  })

  it('should return undefined for null input', () => {
    expect(clampLength(null)).toBeUndefined()
  })

  it('should return undefined for NaN input', () => {
    expect(clampLength(NaN)).toBeUndefined()
  })

  it('should return undefined for non-numeric string', () => {
    expect(clampLength('invalid' as any)).toBeUndefined()
  })

  it('should respect custom ceiling', () => {
    expect(clampLength(600, 500)).toBeUndefined()
    expect(clampLength(400, 500)).toBe(400)
  })
})

describe('stateVariants', () => {
  it("should return ['North Carolina', 'North-Carolina'] for 'North Carolina'", () => {
    expect(stateVariants('North Carolina')).toEqual(['North Carolina', 'North-Carolina'])
  })

  it("should return ['North Carolina', 'North-Carolina'] for 'North-Carolina'", () => {
    expect(stateVariants('North-Carolina')).toEqual(['North Carolina', 'North-Carolina'])
  })

  it("should return ['California'] for single word state", () => {
    expect(stateVariants('California')).toEqual(['California'])
  })

  it("should return ['New York', 'New-York'] for 'New York'", () => {
    expect(stateVariants('New York')).toEqual(['New York', 'New-York'])
  })

  it("should return ['New York', 'New-York'] for 'New-York'", () => {
    expect(stateVariants('New-York')).toEqual(['New York', 'New-York'])
  })
})

describe('purity and determinism', () => {
  it('normalizeState should be pure - same input always returns same output', () => {
    const input = 'north-carolina'
    const result1 = normalizeState(input)
    const result2 = normalizeState(input)
    expect(result1).toBe(result2)
    expect(result1).toBe('North Carolina')
  })

  it('clampLength should be pure - same input always returns same output', () => {
    const input = 123
    const result1 = clampLength(input)
    const result2 = clampLength(input)
    expect(result1).toBe(result2)
    expect(result1).toBe(123)
  })

  it('stateVariants should be pure - same input always returns same output', () => {
    const input = 'texas'
    const result1 = stateVariants(input)
    const result2 = stateVariants(input)
    expect(result1).toEqual(result2)
    expect(result1).toEqual(['Texas'])
  })
})
