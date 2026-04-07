import { describe, it, expect } from 'vitest'
import { classifySurface } from '../checkSurface'

// ---------------------------------------------------------------------------
// Tests for classifySurface (pure classification logic)
// ---------------------------------------------------------------------------

describe('checkSurface', () => {
  // AC-1: paved road — explicit surface=asphalt
  it('AC-1: returns paved with confirmed confidence for paved road when OSM surface tag is asphalt', () => {
    const result = classifySurface({ surface: 'asphalt', highway: 'primary' })
    expect(result.surface).toBe('paved')
    expect(result.material).toBe('asphalt')
    expect(result.confidence).toBe('confirmed')
  })

  // AC-2: unpaved road — explicit surface=gravel
  it('AC-2: returns unpaved with confirmed confidence for unpaved road when OSM surface tag is gravel', () => {
    const result = classifySurface({ surface: 'gravel', highway: 'track' })
    expect(result.surface).toBe('unpaved')
    expect(result.material).toBe('gravel')
    expect(result.confidence).toBe('confirmed')
  })

  // AC-3: inferred paved — primary highway, no surface tag
  it('AC-3: infers paved for primary/secondary/trunk highways without surface tag (inferred paved)', () => {
    const primary = classifySurface({ surface: null, highway: 'primary' })
    expect(primary.surface).toBe('paved')
    expect(primary.material).toBeNull()
    expect(primary.confidence).toBe('inferred')

    const secondary = classifySurface({ surface: null, highway: 'secondary' })
    expect(secondary.surface).toBe('paved')
    expect(secondary.confidence).toBe('inferred')

    const trunk = classifySurface({ surface: null, highway: 'trunk' })
    expect(trunk.surface).toBe('paved')
    expect(trunk.confidence).toBe('inferred')
  })

  // AC-4: inferred unpaved — track/path highway, no surface tag
  it('AC-4: infers unpaved for track/path highways without surface tag (inferred unpaved)', () => {
    const track = classifySurface({ surface: null, highway: 'track' })
    expect(track.surface).toBe('unpaved')
    expect(track.material).toBeNull()
    expect(track.confidence).toBe('inferred')

    const path = classifySurface({ surface: null, highway: 'path' })
    expect(path.surface).toBe('unpaved')
    expect(path.confidence).toBe('inferred')
  })
})
