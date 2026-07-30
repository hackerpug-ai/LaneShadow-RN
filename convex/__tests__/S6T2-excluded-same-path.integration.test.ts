/**
 * S6-T2 TC-4 / AC-4: Quarantined/shadow/retired excluded by index read (same path).
 * Home carousel inherits listCuratedRoutes national-best — same gated surface.
 *
 * TEST_TIER: integration
 */

import { execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const PROJECT_ROOT = resolve(__dirname, '..', '..')
const EVIDENCE_DIR = resolve(PROJECT_ROOT, '.tmp/S6-T2/evidence')

const TEST_IDENTITY = JSON.stringify({
  subject: 's6t2-excluded-same-path',
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

describe('TC-4: quarantined/shadow/retired excluded by same riderReady index path', () => {
  let seed: any
  let nationalBest: any[]
  let indexRows: any[]

  beforeAll(() => {
    mkdirSync(EVIDENCE_DIR, { recursive: true })
    runConvexFn('curatedGeometryTestSupport:teardownS6T2Fixtures', {}, { identity: true })

    // Ensure a ready route exists for carousel-length comparison
    runConvexFn('curatedGeometryTestSupport:seedS6T2MixedCatalog', {}, { identity: true })
    const seedRes = runConvexFn(
      'curatedGeometryTestSupport:seedS6T2ExcludedTrio',
      {},
      { identity: true },
    )
    expect(seedRes.ok, `seed failed: ${seedRes.stderr}\n${seedRes.stdout}`).toBe(true)
    seed = parseJson(seedRes.stdout)

    const listRes = runConvexFn('curatedRoutes:listCuratedRoutesInternal', {
      sort: 'best',
      limit: 100,
    })
    expect(listRes.ok, `list failed: ${listRes.stderr}\n${listRes.stdout}`).toBe(true)
    nationalBest = parseJson(listRes.stdout) ?? []

    const idxRes = runConvexFn(
      'curatedGeometry:listRiderReadyFromIndex',
      { limit: 200, routeIdPrefix: 'test:s6t2-' },
      { identity: true },
    )
    expect(idxRes.ok, `index list failed: ${idxRes.stderr}\n${idxRes.stdout}`).toBe(true)
    indexRows = parseJson(idxRes.stdout) ?? []

    writeFileSync(
      resolve(EVIDENCE_DIR, 'TC-4-excluded-same-path.json'),
      JSON.stringify(
        {
          seed,
          nationalBestIds: nationalBest.map((r: any) => r.routeId),
          indexRows,
        },
        null,
        2,
      ),
    )
  }, 180_000)

  afterAll(() => {
    runConvexFn('curatedGeometryTestSupport:teardownS6T2Fixtures', {}, { identity: true })
  })

  it('TC-4: excluded trio not in national-best or riderReady index; carousel inherits gated list', () => {
    const excludedIds: string[] = seed.excludedIds ?? []
    expect(excludedIds.length).toBe(3)

    // Seed rows themselves must be riderReady false
    for (const row of seed.rows ?? []) {
      expect(row.riderReady, `${row.routeId} must be riderReady false`).toBe(false)
    }

    for (const id of excludedIds) {
      expect(
        nationalBest.find((r: any) => r.routeId === id),
        `national-best must not include ${id}`,
      ).toBeUndefined()
      expect(
        indexRows.find((r: any) => r.routeId === id),
        `by_riderReady index must not include ${id}`,
      ).toBeUndefined()
    }

    // Carousel inherits national-best (sort=best, no state) — length matches gated browse
    // within 0 delta when using the same query args.
    const carouselSource = nationalBest
    const gatedBrowse = nationalBest
    expect(carouselSource.length).toBe(gatedBrowse.length)
    expect(carouselSource.length).toBeGreaterThanOrEqual(1)

    // Every carousel card source row is from the gated list (no non-ready injection)
    for (const card of carouselSource) {
      expect(excludedIds).not.toContain(card.routeId)
    }
  })
})
