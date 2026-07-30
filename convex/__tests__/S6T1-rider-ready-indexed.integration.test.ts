/**
 * S6-T1 AC-2 / TC-2: riderReady stored + served via index (no recompute at read)
 *
 * GIVEN a rider-ready route persisted in curated_routes
 * WHEN a gated query reads via by_riderReady_and_composite_score
 * THEN the route is returned from the index WITHOUT recompute at read time
 *
 * TEST_TIER: integration
 * VERIFICATION_SERVICE: convex-test-deployment
 * FLOW_REF: UC-SURF-01
 */

import { execFileSync } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const PROJECT_ROOT = resolve(__dirname, '..', '..')
const EVIDENCE_DIR = resolve(PROJECT_ROOT, '.tmp/S6-T1/evidence')
const ROUTE_ID = 'motorcycleroads:twist-of-tepusquet-loop'

const TEST_IDENTITY = JSON.stringify({
  subject: 's6t1-indexed-test',
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

describe('AC-2: stored riderReady served via by_riderReady_and_composite_score', () => {
  let returned: any[]

  beforeAll(() => {
    mkdirSync(EVIDENCE_DIR, { recursive: true })

    const seed = runConvexFn(
      'curatedGeometryTestSupport:seedS6T1AllSevenInputs',
      {},
      { identity: true },
    )
    expect(seed.ok, `seed failed: ${seed.stderr}\n${seed.stdout}`).toBe(true)

    const list = runConvexFn(
      'curatedGeometry:listRiderReadyFromIndex',
      { limit: 50, routeIdPrefix: 'motorcycleroads:twist' },
      { identity: true },
    )
    expect(list.ok, `listRiderReadyFromIndex failed: ${list.stderr}\n${list.stdout}`).toBe(true)
    const parsed = parseJson(list.stdout)
    returned = Array.isArray(parsed) ? parsed : (parsed?.routes ?? [])

    writeFileSync(
      resolve(EVIDENCE_DIR, 'AC-2-indexed.json'),
      JSON.stringify({ ac: 'AC-2', returned }, null, 2),
    )
  }, 180_000)

  afterAll(() => {
    // Leave PoC seeded; shared fixture for AC-1/AC-2 under file-parallelism.
  })

  it('AC-2 MUST_OBSERVE: index returns riderReady route without recompute at read', () => {
    expect(returned.length).toBeGreaterThanOrEqual(1)
    expect(returned[0].riderReady).toBe(true)
    expect(returned[0].routeId).toBe(ROUTE_ID)

    // Static negative control: the query path must not call computeRiderReadyFromDoc
    const source = readFileSync(resolve(PROJECT_ROOT, 'convex/curatedGeometry.ts'), 'utf-8')
    const queryBlockMatch = source.match(/export const listRiderReadyFromIndex[\s\S]*?^}\)/m)
    expect(queryBlockMatch, 'listRiderReadyFromIndex export must exist').toBeTruthy()
    expect(queryBlockMatch![0]).not.toMatch(/computeRiderReadyFromDoc/)
    expect(queryBlockMatch![0]).toMatch(/by_riderReady_and_composite_score/)
  })

  it('TC-2: gated queries return the route from by_riderReady_and_composite_score without recompute', () => {
    expect(returned.length).toBeGreaterThanOrEqual(1)
    const hit = returned.find((r) => r.routeId === ROUTE_ID)
    expect(hit).toBeDefined()
    expect(hit.riderReady).toBe(true)
  })
})
