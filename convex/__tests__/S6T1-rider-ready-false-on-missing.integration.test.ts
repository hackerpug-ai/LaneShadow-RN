/**
 * S6-T1 AC-3 / TC-3: false-on-missing-any-input (strict)
 *
 * GIVEN a route missing exactly ONE of the 7 inputs
 * WHEN recomputeRiderReadyForRoute runs
 * THEN stored riderReady === false
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

describe('AC-3: false-on-missing-any-input is strict', () => {
  let retired: any
  let shadow: any
  let missingClassifier: any

  beforeAll(() => {
    mkdirSync(EVIDENCE_DIR, { recursive: true })

    const retiredSeed = runConvexFn(
      'curatedGeometryTestSupport:seedRetiredTwinRow',
      {},
      { identity: true },
    )
    expect(
      retiredSeed.ok,
      `seedRetiredTwinRow failed: ${retiredSeed.stderr}\n${retiredSeed.stdout}`,
    ).toBe(true)
    retired = parseJson(retiredSeed.stdout)

    const shadowSeed = runConvexFn(
      'curatedGeometryTestSupport:seedShadowTwinRow',
      {},
      { identity: true },
    )
    expect(
      shadowSeed.ok,
      `seedShadowTwinRow failed: ${shadowSeed.stderr}\n${shadowSeed.stdout}`,
    ).toBe(true)
    shadow = parseJson(shadowSeed.stdout)

    const missingSeed = runConvexFn(
      'curatedGeometryTestSupport:seedMissingClassifierTwinRow',
      {},
      { identity: true },
    )
    expect(
      missingSeed.ok,
      `seedMissingClassifierTwinRow failed: ${missingSeed.stderr}\n${missingSeed.stdout}`,
    ).toBe(true)
    missingClassifier = parseJson(missingSeed.stdout)

    writeFileSync(
      resolve(EVIDENCE_DIR, 'AC-3-false-on-missing.json'),
      JSON.stringify({ ac: 'AC-3', retired, shadow, missingClassifier }, null, 2),
    )
  }, 180_000)

  afterAll(() => {
    runConvexFn('curatedGeometryTestSupport:teardownS6T1Fixtures', {}, { identity: true })
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

  it('TC-3: any one missing input forces riderReady=false (classifier absent)', () => {
    expect(missingClassifier).toBeTruthy()
    expect(missingClassifier.riderReady).toBe(false)
    expect(missingClassifier.rideWorthiness == null).toBe(true)
  })
})
