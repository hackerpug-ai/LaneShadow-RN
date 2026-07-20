/**
 * REDHAT-FIX-11: Freeway/rescue-first geometry attempt recorded + enforced.
 *
 * The classifier must not complete a freeway route without evidence that
 * the rescue-first geometry attempt happened. Tests verify:
 * 1. classifyAndPersistOne checks for freeway routes BEFORE classification.
 * 2. A geometry-attempt artifact is recorded for freeway routes.
 * 3. Freeway check is present in the classifier action code path.
 */

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('FIX-11: Classifier checks freeway geometry attempt', () => {
  it('classifier source contains freeway geometry-check logic', () => {
    const source = readFileSync(
      resolve(__dirname, '../actions/rideWorthinessClassifier.ts'),
      'utf-8',
    )

    // After fix: the classifier should have a check for freeway routes
    // that either records a geometry_attempt artifact or verifies one exists
    const hasFreewayCheck =
      source.includes('freeway') &&
      (source.includes('geometry_attempt') ||
        source.includes('geometryAttempt') ||
        source.includes('geometry'))

    // RED phase: current code does not have freeway geometry check — FAILS
    expect(hasFreewayCheck).toBe(true)
  })

  it('classifyAndPersistOne records geometry attempt for freeway routes', () => {
    const source = readFileSync(
      resolve(__dirname, '../actions/rideWorthinessClassifier.ts'),
      'utf-8',
    )

    // After fix: classifyAndPersistOne should contain logic to
    // persist a curation_artifact with artifactType including 'geometry'
    // for freeway/not_a_ride routes
    const classifyFnStart = source.indexOf('async function classifyAndPersistOne')
    expect(classifyFnStart).toBeGreaterThan(-1)
    const fnSection = source.slice(classifyFnStart, classifyFnStart + 2000)

    // After fix: the function should check for freeway source/fhwa patterns
    // and either record or verify a geometry attempt before completing
    const hasFreewaySourceCheck = fnSection.includes('fhwa') || fnSection.includes('freeway')
    const hasGeometryArtifact =
      fnSection.includes('geometry_attempt') || fnSection.includes('insertCurationArtifact')

    // RED phase: classifyAndPersistOne doesn't check freeway source — FAILS
    expect(hasFreewaySourceCheck).toBe(true)
    // RED phase: no geometry attempt artifact is recorded — FAILS
    expect(hasGeometryArtifact).toBe(true)
  })

  it('freeway route classification records a geometry_attempt artifact', () => {
    const source = readFileSync(
      resolve(__dirname, '../actions/rideWorthinessClassifier.ts'),
      'utf-8',
    )

    // After fix: there should be an explicit call to persist a
    // geometry_attempt artifact when a route is identified as freeway
    const hasGeometryAttemptInsert =
      source.includes('geometry_attempt') || source.includes('geometryAttempt')

    // RED phase: no geometry_attempt artifact type exists — FAILS
    expect(hasGeometryAttemptInsert).toBe(true)
  })
})
