/**
 * S6-T2 TC-1 / AC-1: discoverCuratedRoutes never invokes centroid slice fallback.
 *
 * GIVEN a mixed catalog (rider-ready with geometry + centroid-only rows)
 * WHEN list + discovery geometry path composes a response
 * THEN no single-point centroid polyline is returned; slice fallback is deleted.
 *
 * TEST_TIER: integration
 * VERIFICATION_SERVICE: convex-test-deployment
 */

import { execFileSync } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import polyline from '@mapbox/polyline'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const PROJECT_ROOT = resolve(__dirname, '..', '..')
const EVIDENCE_DIR = resolve(PROJECT_ROOT, '.tmp/S6-T2/evidence')

const TEST_IDENTITY = JSON.stringify({
  subject: 's6t2-discovery-no-centroid',
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

describe('TC-1: discoverCuratedRoutes never uses centroid slice fallback', () => {
  let seed: any
  let listed: any[]
  let geometryRows: any[]

  beforeAll(() => {
    mkdirSync(EVIDENCE_DIR, { recursive: true })

    runConvexFn('curatedGeometryTestSupport:teardownS6T2Fixtures', {}, { identity: true })
    const seedRes = runConvexFn(
      'curatedGeometryTestSupport:seedS6T2MixedCatalog',
      {},
      { identity: true },
    )
    expect(seedRes.ok, `seed failed: ${seedRes.stderr}\n${seedRes.stdout}`).toBe(true)
    seed = parseJson(seedRes.stdout)

    const listRes = runConvexFn(
      'curatedRoutes:listCuratedRoutesInternal',
      { state: 'California', sort: 'best', limit: 50 },
      {},
    )
    expect(listRes.ok, `list failed: ${listRes.stderr}\n${listRes.stdout}`).toBe(true)
    listed = parseJson(listRes.stdout) ?? []

    const readyIds = (seed?.readyIds ?? []).filter((id: string) =>
      listed.some((r: any) => r.routeId === id),
    )
    const geomRes = runConvexFn(
      'curatedGeometry:getGeometryForRoutes',
      { routeIds: readyIds.length > 0 ? readyIds : (seed?.readyIds ?? []) },
      {},
    )
    geometryRows = parseJson(geomRes.stdout) ?? []

    writeFileSync(
      resolve(EVIDENCE_DIR, 'TC-1-discovery-no-centroid.json'),
      JSON.stringify({ seed, listedCount: listed.length, geometryRows }, null, 2),
    )
  }, 180_000)

  afterAll(() => {
    runConvexFn('curatedGeometryTestSupport:teardownS6T2Fixtures', {}, { identity: true })
  })

  it('TC-1: no candidateRoutes.slice centroid fallback; returned geometries decode to >=2 points', () => {
    const source = readFileSync(
      resolve(PROJECT_ROOT, 'convex/actions/agent/tools/discoverCuratedRoutes.ts'),
      'utf-8',
    )

    // Slice fallback must be gone (the exact pad-to-limit path)
    expect(source).not.toMatch(/candidateRoutes\.slice\s*\(\s*0\s*,\s*requestedLimit\s*\)/)

    // Centroid-only fixture routeIds must NOT appear in browse/list results
    for (const id of seed.centroidOnlyIds ?? []) {
      expect(
        listed.find((r: any) => r.routeId === id),
        `centroid-only ${id} must not appear in gated list`,
      ).toBeUndefined()
    }

    // At least one rider-ready fixture is returned
    const readyHits = listed.filter((r: any) => (seed.readyIds ?? []).includes(r.routeId))
    expect(readyHits.length).toBeGreaterThanOrEqual(1)

    // Geometry for ready routes decodes to >= 2 points
    expect(geometryRows.length).toBeGreaterThanOrEqual(1)
    for (const g of geometryRows) {
      const precision = g.precision ?? 5
      if (g.format === 'multipolyline' && Array.isArray(g.segments)) {
        const hasLine = g.segments.some(
          (seg: string) => polyline.decode(seg, precision).length >= 2,
        )
        expect(hasLine, `multipolyline ${g.routeId} must have a segment with >=2 points`).toBe(true)
      } else if (g.value) {
        const decoded = polyline.decode(g.value, precision)
        expect(
          decoded.length,
          `polyline ${g.routeId} must decode to >=2 points`,
        ).toBeGreaterThanOrEqual(2)
      } else {
        throw new Error(`geometry for ${g.routeId} has neither value nor segments`)
      }
    }
  })
})
