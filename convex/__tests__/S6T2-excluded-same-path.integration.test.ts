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

// Serialize: shared S6-T2 fixtures race with sibling test files if parallel.
describe.sequential('TC-4: quarantined/shadow/retired excluded by same riderReady index path', () => {
  let mixedSeed: any
  let excludedSeed: any
  /** Independent query A: national-best browse (carousel source / listCuratedRoutes) */
  let nationalBest: any[]
  /** Independent query B: by_riderReady index (same gate, different entrypoint) */
  let indexRows: any[]
  /** Independent query C: state-scoped browse (carousel can also filter by state) */
  let californiaBest: any[]

  beforeAll(() => {
    mkdirSync(EVIDENCE_DIR, { recursive: true })
    runConvexFn('curatedGeometryTestSupport:teardownS6T2Fixtures', {}, { identity: true })

    // Seed ready fixtures + excluded trio (high compositeScore but non-ready)
    const mixedRes = runConvexFn(
      'curatedGeometryTestSupport:seedS6T2MixedCatalog',
      {},
      { identity: true },
    )
    expect(mixedRes.ok, `mixed seed failed: ${mixedRes.stderr}\n${mixedRes.stdout}`).toBe(true)
    mixedSeed = parseJson(mixedRes.stdout)

    const seedRes = runConvexFn(
      'curatedGeometryTestSupport:seedS6T2ExcludedTrio',
      {},
      { identity: true },
    )
    expect(seedRes.ok, `excluded seed failed: ${seedRes.stderr}\n${seedRes.stdout}`).toBe(true)
    excludedSeed = parseJson(seedRes.stdout)

    // Re-affirm seeds immediately before independent queries (guards parallel teardown races)
    runConvexFn('curatedGeometryTestSupport:seedS6T2MixedCatalog', {}, { identity: true })
    runConvexFn('curatedGeometryTestSupport:seedS6T2ExcludedTrio', {}, { identity: true })

    // Query A — carousel national-best surface (limit=200 matches client over-fetch cap)
    const listRes = runConvexFn('curatedRoutes:listCuratedRoutesInternal', {
      sort: 'best',
      limit: 200,
    })
    expect(listRes.ok, `national-best list failed: ${listRes.stderr}\n${listRes.stdout}`).toBe(true)
    nationalBest = parseJson(listRes.stdout) ?? []

    // Query B — riderReady index (independent entrypoint, same gate)
    const idxRes = runConvexFn(
      'curatedGeometry:listRiderReadyFromIndex',
      { limit: 200, routeIdPrefix: 'test:s6t2-' },
      { identity: true },
    )
    expect(idxRes.ok, `index list failed: ${idxRes.stderr}\n${idxRes.stdout}`).toBe(true)
    indexRows = parseJson(idxRes.stdout) ?? []

    // Query C — state-scoped gated browse (independent surface; larger candidate window)
    const caRes = runConvexFn('curatedRoutes:listCuratedRoutesInternal', {
      state: 'California',
      sort: 'best',
      limit: 200,
    })
    expect(caRes.ok, `CA list failed: ${caRes.stderr}\n${caRes.stdout}`).toBe(true)
    californiaBest = parseJson(caRes.stdout) ?? []

    writeFileSync(
      resolve(EVIDENCE_DIR, 'TC-4-excluded-same-path.json'),
      JSON.stringify(
        {
          mixedSeed,
          excludedSeed,
          nationalBestIds: nationalBest.map((r: any) => r.routeId),
          californiaBestIds: californiaBest.map((r: any) => r.routeId),
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

  it('TC-4: excluded trio absent from independent browse + index; ready fixtures agree across surfaces', () => {
    const excludedIds: string[] = excludedSeed.excludedIds ?? []
    expect(excludedIds.length).toBe(3)

    // Seed rows themselves must be riderReady false (injected non-ready with high score)
    for (const row of excludedSeed.rows ?? []) {
      expect(row.riderReady, `${row.routeId} must be riderReady false`).toBe(false)
    }

    // Injected non-ready must be excluded from ALL independent gated surfaces
    for (const id of excludedIds) {
      expect(
        nationalBest.find((r: any) => r.routeId === id),
        `national-best browse must not include ${id}`,
      ).toBeUndefined()
      expect(
        californiaBest.find((r: any) => r.routeId === id),
        `CA browse must not include ${id}`,
      ).toBeUndefined()
      expect(
        indexRows.find((r: any) => r.routeId === id),
        `by_riderReady index must not include ${id}`,
      ).toBeUndefined()
    }

    // Ready fixtures from mixed catalog must appear on state-scoped browse + index.
    // National-best (Mode 4) only reads top-N by compositeScore and may omit mid-score
    // fixtures when the catalog is large — so carousel equality is proven via CA browse
    // (same listCuratedRoutes path home carousel uses when scoped) vs the riderReady index.
    const readyIds: string[] = mixedSeed.readyIds ?? []
    expect(readyIds.length).toBeGreaterThanOrEqual(1)

    const readyOnCa = readyIds
      .filter((id: string) => californiaBest.some((r: any) => r.routeId === id))
      .sort()
    const readyOnIndex = readyIds
      .filter((id: string) => indexRows.some((r: any) => r.routeId === id))
      .sort()
    const readyOnNational = readyIds
      .filter((id: string) => nationalBest.some((r: any) => r.routeId === id))
      .sort()

    expect(
      readyOnCa.length,
      `ready fixtures missing from CA browse: ${JSON.stringify({ readyIds, ca: californiaBest.map((r: any) => r.routeId).filter((id: string) => id.startsWith('test:s6t2-')) })}`,
    ).toBeGreaterThanOrEqual(1)
    expect(
      readyOnIndex.length,
      `ready fixtures missing from riderReady index: ${JSON.stringify({ readyIds, index: indexRows.map((r: any) => r.routeId) })}`,
    ).toBeGreaterThanOrEqual(1)

    // Independent queries must agree on which S6-T2 ready fixtures surface
    // (carousel gated browse === index membership for fixture set)
    expect(readyOnCa).toEqual(readyOnIndex)

    // Any ready fixture that DOES make the national top-N must also be on the index
    // (carousel national-best is a subset of the same riderReady gate — no non-ready leak)
    for (const id of readyOnNational) {
      expect(readyOnIndex).toContain(id)
    }

    // National carousel source is non-empty and free of injected non-ready
    expect(nationalBest.length).toBeGreaterThanOrEqual(1)
    for (const card of nationalBest) {
      expect(excludedIds).not.toContain(card.routeId)
    }

    // Prove exclusion is real: high-score non-ready seed rows are not in CA browse
    // even though their compositeScore (0.90–0.92) exceeds ready fixtures (0.86–0.88)
    for (const row of excludedSeed.rows ?? []) {
      expect(californiaBest.find((r: any) => r.routeId === row.routeId)).toBeUndefined()
      expect(indexRows.find((r: any) => r.routeId === row.routeId)).toBeUndefined()
    }
  })
})
