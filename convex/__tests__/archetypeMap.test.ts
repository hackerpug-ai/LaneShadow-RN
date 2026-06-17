import { assertType, describe, expect, it } from 'vitest'
import {
  type DbArchetype,
  dbArchetypeToUi,
  type UiArchetype,
  uiArchetypeToDbSet,
} from '../util/archetypeMap'

describe('uiArchetypeToDbSet', () => {
  it('maps scenic UI archetype to correct DB archetypes', () => {
    const result = uiArchetypeToDbSet('scenic')
    expect(result).toEqual(['scenic_byway', 'coastal'])
  })

  it('maps technical UI archetype to correct DB archetypes', () => {
    const result = uiArchetypeToDbSet('technical')
    expect(result).toEqual(['mountain'])
  })

  it('maps cruising UI archetype to correct DB archetypes', () => {
    const result = uiArchetypeToDbSet('cruising')
    expect(result).toEqual(['scenic_byway'])
  })

  it('maps sport UI archetype to correct DB archetypes', () => {
    const result = uiArchetypeToDbSet('sport')
    expect(result).toEqual(['twisties'])
  })

  it('maps adventure UI archetype to correct DB archetypes', () => {
    const result = uiArchetypeToDbSet('adventure')
    expect(result).toEqual(['adventure', 'desert'])
  })

  it('maps twisties UI archetype to correct DB archetypes', () => {
    const result = uiArchetypeToDbSet('twisties')
    expect(result).toEqual(['twisties'])
  })
})

describe('dbArchetypeToUi', () => {
  it('maps scenic_byway DB archetype to correct UI archetype', () => {
    const result = dbArchetypeToUi('scenic_byway')
    expect(result).toBe('scenic')
  })

  it('maps coastal DB archetype to correct UI archetype', () => {
    const result = dbArchetypeToUi('coastal')
    expect(result).toBe('scenic')
  })

  it('maps mountain DB archetype to correct UI archetype', () => {
    const result = dbArchetypeToUi('mountain')
    expect(result).toBe('technical')
  })

  it('maps desert DB archetype to correct UI archetype', () => {
    const result = dbArchetypeToUi('desert')
    expect(result).toBe('adventure')
  })

  it('maps twisties DB archetype to correct UI archetype', () => {
    const result = dbArchetypeToUi('twisties')
    expect(result).toBe('twisties')
  })

  it('maps adventure DB archetype to correct UI archetype', () => {
    const result = dbArchetypeToUi('adventure')
    expect(result).toBe('adventure')
  })
})

describe('deterministic behavior', () => {
  it('uiArchetypeToDbSet returns consistent results for same input', () => {
    const input: UiArchetype = 'scenic'
    const result1 = uiArchetypeToDbSet(input)
    const result2 = uiArchetypeToDbSet(input)
    expect(result1).toEqual(result2)
  })

  it('dbArchetypeToUi returns consistent results for same input', () => {
    const input: DbArchetype = 'mountain'
    const result1 = dbArchetypeToUi(input)
    const result2 = dbArchetypeToUi(input)
    expect(result1).toBe(result2)
  })

  it('functions are pure (no side effects)', () => {
    const input: UiArchetype = 'adventure'
    uiArchetypeToDbSet(input)
    uiArchetypeToDbSet(input)
    // Should not throw or modify any state
    expect(() => uiArchetypeToDbSet(input)).not.toThrow()
  })
})
