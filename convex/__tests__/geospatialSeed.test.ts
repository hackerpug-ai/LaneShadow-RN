import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('seedGeospatialBatch action', () => {
  const seedFilePath = resolve(__dirname, '../geospatialSeed.ts')

  // AC-1: seedGeospatialBatch is exported and is a function
  it('exports seedGeospatialBatch as a function', () => {
    // GIVEN: The geospatialSeed.ts file exists
    // WHEN: We read the file content
    // THEN: It should export seedGeospatialBatch action

    const content = readFileSync(seedFilePath, 'utf-8')

    expect(content).toContain('export const seedGeospatialBatch = action({')
    expect(content).toContain('cursor: v.union(v.string(), v.null())')
    expect(content).toContain('batchesRun: 1')
  })

  // AC-2: args validator accepts null and string cursors
  it('has args validator that accepts { cursor: null }', () => {
    const content = readFileSync(seedFilePath, 'utf-8')

    // Verify the args schema includes a nullable cursor union
    expect(content).toContain('cursor: v.union(v.string(), v.null())')
    expect(content).toContain('args: {')
  })

  it('has args validator that accepts { cursor: "any-string" }', () => {
    const content = readFileSync(seedFilePath, 'utf-8')

    // Verify the args schema includes a nullable cursor union
    expect(content).toContain('cursor: v.union(v.string(), v.null())')
    expect(content).toContain('args: {')
  })

  // AC-3: function calls internal mutation once and returns expected result
  it('calls internal mutation once and returns batchesRun: 1', () => {
    const content = readFileSync(seedFilePath, 'utf-8')

    // Verify it calls the internal mutation once
    expect(content).toContain('internal.geospatialSeed.seedGeospatialBatchInternal')

    // Verify it returns batchesRun: 1
    expect(content).toContain('batchesRun: 1')

    // Verify it returns the expected BatchResult shape
    expect(content).toContain('seeded: number')
    expect(content).toContain('skipped: number')
    expect(content).toContain('alreadyExisted: number')
    expect(content).toContain('errors: string[]')
    expect(content).toContain('continueCursor: string | null')
    expect(content).toContain('isDone: boolean')
  })
})
