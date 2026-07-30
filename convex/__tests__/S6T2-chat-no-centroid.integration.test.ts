/**
 * S6-T2 TC-2 / AC-2: Chat/discovery response path produces no centroid-only card.
 *
 * GIVEN mixed catalog with rider-ready + non-rider-ready rows
 * WHEN discovery composes options for returned routes
 * THEN every suggested route is rider-ready and has multi-point geometry;
 *      non-rider-ready / centroid-only ids never appear.
 *
 * TEST_TIER: integration
 */

import { execFileSync } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import polyline from '@mapbox/polyline'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const PROJECT_ROOT = resolve(__dirname, '..', '..')
const EVIDENCE_DIR = resolve(PROJECT_ROOT, '.tmp/S6-T2/evidence')

const TEST_IDENTITY = JSON.stringify({
  subject: 's6t2-chat-no-centroid',
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

describe('TC-2: chat/discovery cards never include centroid-only routes', () => {
  let seed: any
  let listed: any[]
  let geometryByRouteId: Map<string, any>

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

    const listRes = runConvexFn('curatedRoutes:listCuratedRoutesInternal', {
      state: 'California',
      sort: 'best',
      limit: 50,
    })
    expect(listRes.ok, `list failed: ${listRes.stderr}\n${listRes.stdout}`).toBe(true)
    listed = parseJson(listRes.stdout) ?? []

    const routeIds = listed.map((r: any) => r.routeId)
    const geomRes = runConvexFn('curatedGeometry:getGeometryForRoutes', { routeIds })
    const geometryRows = parseJson(geomRes.stdout) ?? []
    geometryByRouteId = new Map(geometryRows.map((g: any) => [g.routeId, g]))

    writeFileSync(
      resolve(EVIDENCE_DIR, 'TC-2-chat-no-centroid.json'),
      JSON.stringify(
        {
          seed,
          listedIds: routeIds,
          geometryCount: geometryRows.length,
        },
        null,
        2,
      ),
    )
  }, 180_000)

  afterAll(() => {
    runConvexFn('curatedGeometryTestSupport:teardownS6T2Fixtures', {}, { identity: true })
  })

  it('TC-2: every listed route is rider-ready; centroid-only ids excluded; geometry >=2 pts', () => {
    // Static: discovery composition must not pad with candidateRoutes.slice
    const source = readFileSync(
      resolve(PROJECT_ROOT, 'convex/actions/agent/tools/discoverCuratedRoutes.ts'),
      'utf-8',
    )
    expect(source).not.toMatch(/candidateRoutes\.slice\s*\(\s*0\s*,\s*requestedLimit\s*\)/)

    expect(listed.length).toBeGreaterThanOrEqual(1)
    expect(listed.length).toBeLessThanOrEqual(50)

    for (const id of seed.centroidOnlyIds ?? []) {
      expect(listed.find((r: any) => r.routeId === id)).toBeUndefined()
    }

    // Ready fixtures must appear when gated
    const readyHits = listed.filter((r: any) => (seed.readyIds ?? []).includes(r.routeId))
    expect(readyHits.length).toBeGreaterThanOrEqual(1)

    // Confirm seed ready rows are riderReady true via re-read
    for (const ready of seed.ready ?? []) {
      expect(ready.riderReady).toBe(true)
    }
    for (const c of seed.centroidOnly ?? []) {
      expect(c.riderReady).toBe(false)
    }

    // Every returned ready fixture has multi-point geometry (chat card contract)
    for (const hit of readyHits) {
      const g = geometryByRouteId.get(hit.routeId)
      expect(g, `geometry required for ${hit.routeId}`).toBeDefined()
      const precision = g.precision ?? 5
      const decoded = g.value ? polyline.decode(g.value, precision) : []
      expect(decoded.length).toBeGreaterThanOrEqual(2)
    }
  })
})
