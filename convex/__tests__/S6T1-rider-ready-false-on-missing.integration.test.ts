/**
 * S6-T1 AC-3 / TC-3: false-on-missing-any-input (strict)
 *
 * GIVEN a route missing exactly ONE of the 7 inputs
 * WHEN recomputeRiderReadyForRoute runs
 * THEN stored riderReady === false
 *
 * One-discriminator cases prove false-on-missing is strict (not short-circuit only).
 * Covers: classifier, retiredAt, duplicateOf, empty name, invalid score,
 * lengthMiles<=0, missing geometry.
 *
 * TEST_TIER: integration
 * VERIFICATION_SERVICE: convex-test-deployment
 * FLOW_REF: UC-SURF-01
 */

import { execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const PROJECT_ROOT = resolve(__dirname, '..', '..')
const EVIDENCE_DIR = resolve(PROJECT_ROOT, '.tmp/S6-T1/evidence')

const TEST_IDENTITY = JSON.stringify({
  subject: 's6t1-false-missing-test',
  issuer: 'https://laneshadow.test',
})

const FIXTURE_ROUTE_IDS = [
  'test:retired-twin',
  'test:shadow-twin',
  'test:missing-classifier-twin',
  'test:empty-name-twin',
  'test:invalid-score-twin',
  'test:zero-length-twin',
  'test:missing-geom-twin',
]

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
      timeout: 180_000,
      stdio: ['pipe', 'pipe', 'pipe'],
      env: {
        ...process.env,
        CONVEX_DEPLOYMENT: process.env.CONVEX_DEPLOYMENT ?? 'dev:quirky-panther-164',
      },
    })
    return { ok: true, stdout, stderr: '' }
  } catch (err: any) {
    return {
      ok: false,
      stdout: typeof err.stdout === 'string' ? err.stdout : '',
      stderr: typeof err.stderr === 'string' ? err.stderr : '',
    }
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

function parseJson(stdout: string): any {
  try {
    return JSON.parse(stdout)
  } catch {
    return null
  }
}

function seedOrThrow(fn: string): any {
  const result = runConvexFn(fn, {}, { identity: true })
  expect(result.ok, `${fn} failed: ${result.stderr}\n${result.stdout}`).toBe(true)
  const body = parseJson(result.stdout)
  expect(body, `${fn} returned non-JSON`).toBeTruthy()
  return body
}

describe('AC-3: false-on-missing-any-input is strict', () => {
  let retired: any
  let shadow: any
  let missingClassifier: any
  let emptyName: any
  let invalidScore: any
  let zeroLength: any
  let missingGeom: any

  beforeAll(() => {
    mkdirSync(EVIDENCE_DIR, { recursive: true })

    retired = seedOrThrow('curatedGeometryTestSupport:seedRetiredTwinRow')
    shadow = seedOrThrow('curatedGeometryTestSupport:seedShadowTwinRow')
    missingClassifier = seedOrThrow('curatedGeometryTestSupport:seedMissingClassifierTwinRow')
    emptyName = seedOrThrow('curatedGeometryTestSupport:seedEmptyNameTwinRow')
    invalidScore = seedOrThrow('curatedGeometryTestSupport:seedInvalidCompositeScoreTwinRow')
    zeroLength = seedOrThrow('curatedGeometryTestSupport:seedZeroLengthTwinRow')
    missingGeom = seedOrThrow('curatedGeometryTestSupport:seedMissingGeometryTwinRow')

    writeFileSync(
      resolve(EVIDENCE_DIR, 'AC-3-false-on-missing.json'),
      JSON.stringify(
        {
          ac: 'AC-3',
          retired,
          shadow,
          missingClassifier,
          emptyName,
          invalidScore,
          zeroLength,
          missingGeom,
        },
        null,
        2,
      ),
    )
  }, 300_000)

  afterAll(() => {
    runConvexFn(
      'curatedGeometryTestSupport:teardownS6T1Fixtures',
      { routeIds: FIXTURE_ROUTE_IDS },
      { identity: true },
    )
  })

  it('AC-3 CASE retired-route: riderReady == false when retiredAt set', () => {
    expect(retired).toBeTruthy()
    expect(retired.riderReady).toBe(false)
    expect(retired.retiredAt).toBeTruthy()
    expect(retired.routeId).toBe('test:retired-twin')
  })

  it('AC-3 CASE duplicate-shadow: riderReady == false when duplicateOf set', () => {
    expect(shadow).toBeTruthy()
    expect(shadow.riderReady).toBe(false)
    expect(shadow.duplicateOf).toBeTruthy()
    expect(shadow.routeId).toBe('test:shadow-twin')
  })

  it('TC-3 discriminator classifier absent: stored riderReady=false', () => {
    expect(missingClassifier).toBeTruthy()
    expect(missingClassifier.riderReady).toBe(false)
    expect(missingClassifier.rideWorthiness == null).toBe(true)
  })

  it('TC-3 discriminator empty name: stored riderReady=false', () => {
    expect(emptyName).toBeTruthy()
    expect(emptyName.riderReady).toBe(false)
    expect(typeof emptyName.name === 'string' ? emptyName.name.trim().length === 0 : true).toBe(
      true,
    )
    expect(emptyName.routeId).toBe('test:empty-name-twin')
  })

  it('TC-3 discriminator invalid compositeScore: stored riderReady=false', () => {
    expect(invalidScore).toBeTruthy()
    expect(invalidScore.riderReady).toBe(false)
    expect(invalidScore.compositeScore).toBe(0.1)
    expect(invalidScore.routeId).toBe('test:invalid-score-twin')
  })

  it('TC-3 discriminator lengthMiles<=0: stored riderReady=false', () => {
    expect(zeroLength).toBeTruthy()
    expect(zeroLength.riderReady).toBe(false)
    expect(zeroLength.lengthMiles).toBe(0)
    expect(zeroLength.routeId).toBe('test:zero-length-twin')
  })

  it('TC-3 discriminator missing/failing geometry: stored riderReady=false', () => {
    expect(missingGeom).toBeTruthy()
    expect(missingGeom.riderReady).toBe(false)
    expect(missingGeom.hasGeometry).toBe(false)
    expect(missingGeom.geometryVerification).toBeNull()
    expect(missingGeom.routeId).toBe('test:missing-geom-twin')
  })

  it('TC-3: any one missing input forces riderReady=false (all 7 discriminators)', () => {
    const cases = [
      { name: 'retiredAt', body: retired },
      { name: 'duplicateOf', body: shadow },
      { name: 'classifier', body: missingClassifier },
      { name: 'emptyName', body: emptyName },
      { name: 'invalidScore', body: invalidScore },
      { name: 'zeroLength', body: zeroLength },
      { name: 'missingGeometry', body: missingGeom },
    ]

    for (const c of cases) {
      expect(c.body?.riderReady, `${c.name} must store riderReady=false`).toBe(false)
      expect(c.body?.riderReady, `${c.name} must not be null/undefined`).not.toBeNull()
      expect(c.body?.riderReady, `${c.name} must not be true`).not.toBe(true)
    }

    writeFileSync(
      resolve(EVIDENCE_DIR, 'TC-3-seven-discriminators.json'),
      JSON.stringify(
        {
          tc: 'TC-3',
          cases: cases.map((c) => ({
            discriminator: c.name,
            routeId: c.body?.routeId,
            riderReady: c.body?.riderReady,
          })),
        },
        null,
        2,
      ),
    )
  })
})
