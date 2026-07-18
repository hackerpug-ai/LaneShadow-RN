/**
 * AC-6: Lever 3 geocoding uses region bias (centroid ±1.2° bounds)
 *
 * TEST_TIER: integration
 * VERIFICATION_SERVICE: Convex dev deployment (real Google Geocoding API with bounds)
 * FLOW_REF: UC-REC-03
 */

import { execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { beforeAll, describe, expect, it } from 'vitest'
import { geocodeBoundsForCentroid } from '../lib/endpointParser'

const PROJECT_ROOT = resolve(__dirname, '..', '..')
const EVIDENCE_DIR = resolve(PROJECT_ROOT, '.tmp/S4-T2/evidence')

const TEST_IDENTITY = JSON.stringify({
  subject: 's4t2-geocode-bias-test',
  issuer: 'https://laneshadow.test',
})

interface RunResult {
  ok: boolean
  stdout: string
  stderr: string
}

function execNpx(cmd: string[]): RunResult {
  try {
    const stdout = execFileSync('npx', cmd, {
      cwd: PROJECT_ROOT,
      encoding: 'utf-8',
      timeout: 180000,
      stdio: ['pipe', 'pipe', 'pipe'],
    })
    return { ok: true, stdout, stderr: '' }
  } catch (err: any) {
    const stdout = typeof err.stdout === 'string' ? err.stdout : ''
    const stderr = typeof err.stderr === 'string' ? err.stderr : ''
    return { ok: false, stdout, stderr }
  }
}

function runConvexFn(
  fn: string,
  args: Record<string, unknown> = {},
  opts: { identity?: boolean } = {},
): RunResult {
  const cmd = ['convex', 'run', fn, JSON.stringify(args)]
  if (opts.identity) cmd.push('--identity', TEST_IDENTITY)
  return execNpx(cmd)
}

describe('AC-6: Lever 3 geocode region bias', () => {
  let geocodeResult: any

  beforeAll(() => {
    mkdirSync(EVIDENCE_DIR, { recursive: true })
    // CASE: Geocode 'Santa Maria' with centroid (34.95, -120.42)
    const result = runConvexFn(
      'curatedGeometryReconstruct:geocodeWithRegionBias',
      {
        address: 'Santa Maria',
        centroidLat: 34.95,
        centroidLng: -120.42,
        state: 'California',
      },
      { identity: true },
    )
    expect(result.ok, `geocode failed: ${result.stderr}\n${result.stdout}`).toBe(true)
    geocodeResult = JSON.parse(result.stdout)

    writeFileSync(
      resolve(EVIDENCE_DIR, 'ac6-geocode-bias.json'),
      JSON.stringify(
        {
          capturedAt: new Date().toISOString(),
          geocodeResult,
          expectedBounds: geocodeBoundsForCentroid({ lat: 34.95, lng: -120.42 }),
        },
        null,
        2,
      ),
    )
  }, 180_000)

  // TC-8
  it('TC-8 MUST_OBSERVE: geocodeUrl contains bounds=', () => {
    expect(geocodeResult?.geocodeUrl).toBeTruthy()
    expect(geocodeResult?.containsBoundsParam).toBe(true)
    expect(geocodeResult?.geocodeUrl).toContain('bounds=')
  })

  it('MUST_OBSERVE: bounds centered on (34.95, -120.42) ±1.2°', () => {
    expect(geocodeResult?.boundsCenteredOn).toEqual({ lat: 34.95, lng: -120.42 })
    expect(geocodeResult?.deltaDegrees).toBe(1.2)
    expect(geocodeResult?.bounds).toBe(geocodeBoundsForCentroid({ lat: 34.95, lng: -120.42 }))
    // Explicit SW/NE corners
    expect(geocodeResult?.bounds).toBe('33.75,-121.62|36.15,-119.22')
  })

  it('MUST_NOT_OBSERVE: missing bounds parameter', () => {
    expect(geocodeResult?.geocodeUrl.includes('bounds=')).toBe(true)
  })

  it('real geocode returns a result near the centroid region', () => {
    // Santa Maria CA should resolve near the bias centroid.
    expect(geocodeResult?.result).toBeTruthy()
    expect(geocodeResult?.result?.distanceFromCentroid).toBeLessThan(150)
  })
})
