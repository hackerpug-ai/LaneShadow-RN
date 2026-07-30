/**
 * S6-T2 TC-2 / AC-2: Chat/discovery response path produces no centroid-only card.
 *
 * GIVEN mixed catalog with rider-ready + non-rider-ready rows
 * WHEN executeDiscoverCuratedRoutes (via runLiveDiscoverySmoke) composes options
 * THEN every option is multi-point geometry; centroid-only / non-ready ids never appear.
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
  let discovery: any
  let listed: any[]

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

    // Independent gated list (chat cards inherit the same riderReady surface)
    const listRes = runConvexFn('curatedRoutes:listCuratedRoutesInternal', {
      state: 'California',
      sort: 'best',
      limit: 50,
    })
    expect(listRes.ok, `list failed: ${listRes.stderr}\n${listRes.stdout}`).toBe(true)
    listed = parseJson(listRes.stdout) ?? []

    // Execute real discovery path against mixed catalog
    const discRes = runConvexFn(
      'actions/agent/tools/discoverCuratedRoutesLiveTest:runLiveDiscoverySmoke',
      {
        clerkUserId: `s6t2-tc2-${Date.now()}`,
        archetypes: ['twisties'],
        state: 'California',
        sort: 'best',
        limit: 20,
      },
    )
    expect(discRes.ok, `discovery failed: ${discRes.stderr}\n${discRes.stdout}`).toBe(true)
    discovery = parseJson(discRes.stdout)

    writeFileSync(
      resolve(EVIDENCE_DIR, 'TC-2-chat-no-centroid.json'),
      JSON.stringify(
        {
          seed,
          listedIds: listed.map((r: any) => r.routeId),
          discovery,
        },
        null,
        2,
      ),
    )
  }, 180_000)

  afterAll(() => {
    runConvexFn('curatedGeometryTestSupport:teardownS6T2Fixtures', {}, { identity: true })
  })

  it('TC-2: discovery options are multi-point; centroid-only ids excluded from chat cards', () => {
    const source = readFileSync(
      resolve(PROJECT_ROOT, 'convex/actions/agent/tools/discoverCuratedRoutes.ts'),
      'utf-8',
    )
    expect(source).not.toMatch(/candidateRoutes\.slice\s*\(\s*0\s*,\s*requestedLimit\s*\)/)
    expect(source).not.toMatch(/encodeCentroidToPolyline/)

    expect(discovery).toBeTruthy()
    expect(discovery.type).toBe('routes')
    expect(discovery.optionsCount).toBeGreaterThanOrEqual(1)
    expect(discovery.optionGeometries?.length).toBe(discovery.optionsCount)

    const centroidOnlyIds: string[] = seed.centroidOnlyIds ?? []
    const readyIds: string[] = seed.readyIds ?? []
    const optionRouteIds: string[] = (discovery.optionGeometries ?? []).map((g: any) => g.routeId)

    // Seed honesty
    for (const ready of seed.ready ?? []) {
      expect(ready.riderReady).toBe(true)
    }
    for (const c of seed.centroidOnly ?? []) {
      expect(c.riderReady).toBe(false)
    }

    // Centroid-only never in gated list or discovery options
    for (const id of centroidOnlyIds) {
      expect(listed.find((r: any) => r.routeId === id)).toBeUndefined()
      expect(optionRouteIds.includes(id)).toBe(false)
    }

    // Ready fixtures appear in gated list and discovery
    const listReadyHits = listed.filter((r: any) => readyIds.includes(r.routeId))
    expect(listReadyHits.length).toBeGreaterThanOrEqual(1)

    const discReadyHits = optionRouteIds.filter((id: string) => readyIds.includes(id))
    expect(
      discReadyHits.length,
      `expected ready fixtures in discovery; got ${optionRouteIds.join(',')}`,
    ).toBeGreaterThanOrEqual(1)

    // Every discovery option geometry is multi-point (chat card contract)
    for (const g of discovery.optionGeometries ?? []) {
      expect(g.pointCount).toBeGreaterThanOrEqual(2)
      const decoded = polyline.decode(g.geometryValue, g.precision ?? 5)
      expect(decoded.length).toBeGreaterThanOrEqual(2)
    }
  })
})
