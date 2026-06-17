'use node'

// ---------------------------------------------------------------------------
// Surface classification constants
// ---------------------------------------------------------------------------

const PAVED_SURFACES = new Set([
  'asphalt',
  'concrete',
  'paved',
  'concrete:plates',
  'concrete:lanes',
  'paving_stones',
  'sett',
])

const UNPAVED_SURFACES = new Set([
  'gravel',
  'dirt',
  'ground',
  'sand',
  'mud',
  'grass',
  'unpaved',
  'compacted',
  'fine_gravel',
  'earth',
])

const LIKELY_PAVED_HIGHWAYS = new Set([
  'motorway',
  'trunk',
  'primary',
  'secondary',
  'tertiary',
  'motorway_link',
  'trunk_link',
  'primary_link',
  'secondary_link',
  'tertiary_link',
])

const LIKELY_UNPAVED_HIGHWAYS = new Set(['track', 'path', 'bridleway'])

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SurfaceType = 'paved' | 'unpaved' | 'unknown'
export type SurfaceConfidence = 'confirmed' | 'inferred' | 'unknown'

export type SurfaceResult = {
  surface: SurfaceType
  material: string | null
  confidence: SurfaceConfidence
}

export type CheckSurfaceInput = {
  surface: string | null
  highway: string | null
}

// ---------------------------------------------------------------------------
// Core classifier (pure function — no I/O)
// ---------------------------------------------------------------------------

export const classifySurface = (input: CheckSurfaceInput): SurfaceResult => {
  const { surface, highway } = input

  // Step 1: explicit surface tag — confirmed classification
  if (surface !== null && surface !== '') {
    const tag = surface.toLowerCase()

    if (PAVED_SURFACES.has(tag)) {
      return { surface: 'paved', material: tag, confidence: 'confirmed' }
    }

    if (UNPAVED_SURFACES.has(tag)) {
      return { surface: 'unpaved', material: tag, confidence: 'confirmed' }
    }

    // Explicit tag present but unrecognized — still flag as unknown
    return { surface: 'unknown', material: tag, confidence: 'unknown' }
  }

  // Step 2: infer from highway class
  if (highway !== null && highway !== '') {
    const hw = highway.toLowerCase()

    if (LIKELY_PAVED_HIGHWAYS.has(hw)) {
      return { surface: 'paved', material: null, confidence: 'inferred' }
    }

    if (LIKELY_UNPAVED_HIGHWAYS.has(hw)) {
      return { surface: 'unpaved', material: null, confidence: 'inferred' }
    }
  }

  // Step 3: no data — flag uncertainty, never default to paved
  return { surface: 'unknown', material: null, confidence: 'unknown' }
}
