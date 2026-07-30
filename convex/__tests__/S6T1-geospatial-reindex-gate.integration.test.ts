/**
 * S6-T1 AC-5 / TC-5: geospatial re-index migration gate (risk #22)
 *
 * GIVEN a geospatial re-index that writes geometry/point rows for rider-ready routes
 * WHEN the migration gate evaluates pointCount vs riderReadyCount
 * THEN gateDeployable === true iff counts match and both are non-zero
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
  subject: 's6t1-geospatial-gate-test',
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

describe('AC-5: geospatial re-index migration gate', () => {
  let parityGate: any
  let divergeGate: any

  beforeAll(() => {
    mkdirSync(EVIDENCE_DIR, { recursive: true })

    // Seed N rider-ready routes + matching geometry rows under S6-T1 prefix
    const seed = runConvexFn(
      'curatedGeometryTestSupport:seedS6T1GeospatialReindexFixtures',
      { count: 3 },
      { identity: true },
    )
    expect(
      seed.ok,
      `seedS6T1GeospatialReindexFixtures failed: ${seed.stderr}\n${seed.stdout}`,
    ).toBe(true)

    // Run re-index (writes point rows for rider-ready routes)
    const reindex = runConvexFn(
      'curatedGeometry:runGeospatialReindexForRiderReady',
      { routeIdPrefix: 'test:s6t1-geo-' },
      { identity: true },
    )
    expect(reindex.ok, `reindex failed: ${reindex.stderr}\n${reindex.stdout}`).toBe(true)

    // Gate with parity
    const gate = runConvexFn(
      'curatedGeometry:evaluateGeospatialReindexGate',
      { routeIdPrefix: 'test:s6t1-geo-' },
      { identity: true },
    )
    expect(gate.ok, `evaluateGeospatialReindexGate failed: ${gate.stderr}\n${gate.stdout}`).toBe(
      true,
    )
    parityGate = parseJson(gate.stdout)

    // Negative control: force divergence by removing one geometry row without clearing riderReady
    const diverge = runConvexFn(
      'curatedGeometryTestSupport:forceS6T1GeospatialDivergence',
      { routeIdPrefix: 'test:s6t1-geo-' },
      { identity: true },
    )
    expect(diverge.ok, `force divergence failed: ${diverge.stderr}\n${diverge.stdout}`).toBe(true)

    const gate2 = runConvexFn(
      'curatedGeometry:evaluateGeospatialReindexGate',
      { routeIdPrefix: 'test:s6t1-geo-' },
      { identity: true },
    )
    expect(gate2.ok).toBe(true)
    divergeGate = parseJson(gate2.stdout)

    writeFileSync(
      resolve(EVIDENCE_DIR, 'AC-5-geospatial-gate.json'),
      JSON.stringify({ ac: 'AC-5', parityGate, divergeGate }, null, 2),
    )
  }, 300_000)

  afterAll(() => {
    runConvexFn(
      'curatedGeometryTestSupport:teardownS6T1Fixtures',
      {
        routeIds: ['test:s6t1-geo-0', 'test:s6t1-geo-1', 'test:s6t1-geo-2'],
      },
      { identity: true },
    )
  })

  it('AC-5 MUST_OBSERVE: pointCount === riderReadyCount and gateDeployable === true on parity', () => {
    expect(parityGate).toBeTruthy()
    expect(parityGate.pointCount).toBe(parityGate.riderReadyCount)
    expect(parityGate.gateDeployable).toBe(true)
    expect(parityGate.pointCount).toBeGreaterThan(0)
    expect(parityGate.riderReadyCount).toBeGreaterThan(0)
  })

  it('AC-5 MUST_NOT_OBSERVE: gateDeployable true when counts diverge', () => {
    expect(divergeGate).toBeTruthy()
    expect(divergeGate.pointCount).not.toBe(divergeGate.riderReadyCount)
    expect(divergeGate.gateDeployable).toBe(false)
  })

  it('TC-5: Geospatial re-index gate returns gateDeployable=true iff pointCount === riderReadyCount', () => {
    expect(parityGate.gateDeployable).toBe(
      parityGate.pointCount === parityGate.riderReadyCount && parityGate.pointCount > 0,
    )
    expect(divergeGate.gateDeployable).toBe(false)
  })
})
