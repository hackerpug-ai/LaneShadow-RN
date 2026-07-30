/**
 * S6-T2 TC-3 / AC-3: All listCuratedRoutes modes read via by_riderReady_and_composite_score.
 * State-only gap closed — non-rider-ready rows never surface in any mode.
 *
 * TEST_TIER: integration
 */

import { execFileSync } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const PROJECT_ROOT = resolve(__dirname, '..', '..')
const EVIDENCE_DIR = resolve(PROJECT_ROOT, '.tmp/S6-T2/evidence')

const TEST_IDENTITY = JSON.stringify({
  subject: 's6t2-list-modes-gated',
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

describe('TC-3: all listCuratedRoutes modes gated by by_riderReady_and_composite_score', () => {
  let seed: any
  let modeResults: Record<string, any[]>

  beforeAll(() => {
    mkdirSync(EVIDENCE_DIR, { recursive: true })
    runConvexFn('curatedGeometryTestSupport:teardownS6T2Fixtures', {}, { identity: true })
    const seedRes = runConvexFn(
      'curatedGeometryTestSupport:seedS6T2StateWithShadows',
      {},
      { identity: true },
    )
    expect(seedRes.ok, `seed failed: ${seedRes.stderr}\n${seedRes.stdout}`).toBe(true)
    seed = parseJson(seedRes.stdout)

    const modes: Record<string, Record<string, unknown>> = {
      'state-only': { state: 'California', sort: 'best', limit: 50 },
      'national-best': { sort: 'best', limit: 50 },
      nearest: {
        sort: 'nearest',
        center: { lat: 35.0, lng: -120.5 },
        limit: 50,
      },
      bbox: {
        bbox: { north: 36, south: 34, east: -119, west: -122 },
        sort: 'best',
        limit: 50,
      },
    }

    modeResults = {}
    for (const [name, args] of Object.entries(modes)) {
      const res = runConvexFn('curatedRoutes:listCuratedRoutesInternal', args)
      expect(res.ok, `${name} failed: ${res.stderr}\n${res.stdout}`).toBe(true)
      modeResults[name] = parseJson(res.stdout) ?? []
    }

    writeFileSync(
      resolve(EVIDENCE_DIR, 'TC-3-list-modes-gated.json'),
      JSON.stringify(
        {
          seed,
          modeCounts: Object.fromEntries(
            Object.entries(modeResults).map(([k, v]) => [k, v.length]),
          ),
          modeIds: Object.fromEntries(
            Object.entries(modeResults).map(([k, v]) => [k, v.map((r: any) => r.routeId)]),
          ),
        },
        null,
        2,
      ),
    )
  }, 180_000)

  afterAll(() => {
    runConvexFn('curatedGeometryTestSupport:teardownS6T2Fixtures', {}, { identity: true })
  })

  it('TC-3: every mode uses riderReady index; non-ready CA fixtures never returned', () => {
    const source = readFileSync(resolve(PROJECT_ROOT, 'convex/curatedRoutes.ts'), 'utf-8')

    // Handler must route through by_riderReady_and_composite_score (not by_state primary)
    expect(source).toMatch(/by_riderReady_and_composite_score/)
    // State-only gap: must NOT query by_state as the primary read for state mode
    // (allow stateVariants helper / comments, but not withIndex('by_state' in handler body)
    const handlerMatch = source.match(
      /async function listCuratedRoutesHandler[\s\S]*?^export const listCuratedRoutes/m,
    )
    expect(handlerMatch, 'listCuratedRoutesHandler must exist').toBeTruthy()
    const handlerBody = handlerMatch![0]
    expect(handlerBody).not.toMatch(/withIndex\(\s*['"]by_state['"]/)
    // Count index references — all modes converge on riderReady index
    const indexHits = handlerBody.match(/by_riderReady_and_composite_score/g) ?? []
    expect(indexHits.length).toBeGreaterThanOrEqual(1)

    const nonReadyIds: string[] = seed.nonReadyIds ?? []
    const readyIds: string[] = seed.readyIds ?? []

    for (const [mode, rows] of Object.entries(modeResults)) {
      for (const id of nonReadyIds) {
        expect(
          rows.find((r: any) => r.routeId === id),
          `${mode} must not return non-ready ${id}`,
        ).toBeUndefined()
      }
    }

    // State-only must return the ready CA fixtures
    const stateRows = modeResults['state-only']
    for (const id of readyIds) {
      expect(
        stateRows.find((r: any) => r.routeId === id),
        `state-only must return ready ${id}`,
      ).toBeDefined()
    }

    // Seed non-ready rows are riderReady false
    for (const row of seed.nonReady ?? []) {
      expect(row.riderReady).toBe(false)
    }
  })
})
