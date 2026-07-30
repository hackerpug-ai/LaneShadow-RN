/**
 * S6-T2 TC-1 / AC-1: discoverCuratedRoutes never invokes centroid slice fallback.
 *
 * GIVEN a mixed catalog (rider-ready with geometry + centroid-only rows)
 * WHEN executeDiscoverCuratedRoutes (via runLiveDiscoverySmoke) composes a response
 * THEN every option geometry decodes to >=2 points; centroid-only routeIds absent;
 *      source has no encodeCentroidToPolyline in the response path.
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
  let discovery: any

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

    // Execute the real discovery path (executeDiscoverCuratedRoutes) against the mixed catalog.
    const discRes = runConvexFn(
      'actions/agent/tools/discoverCuratedRoutesLiveTest:runLiveDiscoverySmoke',
      {
        clerkUserId: `s6t2-tc1-${Date.now()}`,
        archetypes: ['twisties'],
        state: 'California',
        sort: 'best',
        limit: 20,
      },
    )
    expect(discRes.ok, `discovery failed: ${discRes.stderr}\n${discRes.stdout}`).toBe(true)
    discovery = parseJson(discRes.stdout)

    writeFileSync(
      resolve(EVIDENCE_DIR, 'TC-1-discovery-no-centroid.json'),
      JSON.stringify({ seed, discovery }, null, 2),
    )
  }, 180_000)

  afterAll(() => {
    runConvexFn('curatedGeometryTestSupport:teardownS6T2Fixtures', {}, { identity: true })
  })

  it('TC-1: executeDiscoverCuratedRoutes returns multi-point geometries only; no centroid-only routeIds', () => {
    const source = readFileSync(
      resolve(PROJECT_ROOT, 'convex/actions/agent/tools/discoverCuratedRoutes.ts'),
      'utf-8',
    )

    // Slice fallback and centroid encode must be gone from discovery composition
    expect(source).not.toMatch(/candidateRoutes\.slice\s*\(\s*0\s*,\s*requestedLimit\s*\)/)
    expect(source).not.toMatch(/encodeCentroidToPolyline/)

    expect(discovery).toBeTruthy()
    expect(discovery.type).toBe('routes')
    expect(discovery.status).toBe('completed')
    expect(discovery.optionsCount).toBeGreaterThanOrEqual(1)
    expect(Array.isArray(discovery.optionGeometries)).toBe(true)
    expect(discovery.optionGeometries.length).toBe(discovery.optionsCount)

    const centroidOnlyIds: string[] = seed.centroidOnlyIds ?? []
    const readyIds: string[] = seed.readyIds ?? []
    const optionRouteIds: string[] = discovery.optionGeometries.map((g: any) => g.routeId)

    // Centroid-only fixture routeIds must NOT appear in discovery options
    for (const id of centroidOnlyIds) {
      expect(
        optionRouteIds.includes(id),
        `centroid-only ${id} must not appear in discovery options`,
      ).toBe(false)
      expect(
        discovery.optionIds?.includes(`curated-${id}`),
        `centroid-only optionId curated-${id} must not appear`,
      ).toBe(false)
    }

    // At least one rider-ready fixture must surface (high compositeScore fixtures)
    const readyHits = optionRouteIds.filter((id: string) => readyIds.includes(id))
    expect(
      readyHits.length,
      `expected >=1 ready fixture in discovery options; got ${optionRouteIds.join(',')}`,
    ).toBeGreaterThanOrEqual(1)

    // Every option geometry must decode to >= 2 points (no 1-point centroid)
    for (const g of discovery.optionGeometries) {
      expect(
        g.pointCount,
        `option ${g.routeId} must decode to >=2 points (got ${g.pointCount})`,
      ).toBeGreaterThanOrEqual(2)

      // Independent re-decode of the stored polyline value
      const decoded = polyline.decode(g.geometryValue, g.precision ?? 5)
      expect(decoded.length, `re-decode ${g.routeId} must be >=2 points`).toBeGreaterThanOrEqual(2)
    }
  })
})
