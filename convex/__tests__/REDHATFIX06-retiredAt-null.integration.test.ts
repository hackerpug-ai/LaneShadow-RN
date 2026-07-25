/**
 * REDHAT-FIX-06 AC-1 / TC-1: unretire clears retiredAt with null (never undefined).
 *
 * TEST_TIER: integration
 * VERIFICATION_SERVICE: Convex dev deployment
 * FLOW_REF: UC-REC-05
 * start_ref: redhatfix06-retired-route
 */

import { execFileSync } from 'node:child_process'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const PROJECT_ROOT = resolve(__dirname, '..', '..')
const TEST_IDENTITY = JSON.stringify({
  subject: 's4t5-redhatfix06-null',
  issuer: 'https://laneshadow.test',
})
const ROUTE_ID = 'test:redhatfix06-retired'

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
      timeout: 300000,
      stdio: ['pipe', 'pipe', 'pipe'],
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

/** Count production `retiredAt: undefined` patch sites under convex/ (exclude tests). */
function countRetiredAtUndefinedSites(): number {
  const convexRoot = resolve(PROJECT_ROOT, 'convex')
  let count = 0
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      if (name === '__tests__' || name === '_generated' || name === 'node_modules') continue
      const p = join(dir, name)
      const st = statSync(p)
      if (st.isDirectory()) {
        walk(p)
        continue
      }
      if (!name.endsWith('.ts')) continue
      const src = readFileSync(p, 'utf-8')
      const matches = src.match(/retiredAt:\s*undefined/g)
      if (matches) count += matches.length
    }
  }
  walk(convexRoot)
  return count
}

describe('REDHAT-FIX-06 AC-1: retiredAt cleared with null not undefined', () => {
  let unretireResult: any
  let afterUnretire: any
  let preRetiredAt: number | string | null

  beforeAll(() => {
    const setup = runConvexFn(
      'testSupport:devSetupFounderUser',
      { clerkUserId: 's4t5-redhatfix06-null', role: 'operator' },
      { identity: true },
    )
    expect(setup.ok, `devSetupFounderUser failed: ${setup.stderr}`).toBe(true)

    const seed = runConvexFn(
      'curatedGeometry:seedS5T2RetirementFixtures',
      {
        scenario: 'retire-unretire-preserves-record',
        allFailedRouteId: ROUTE_ID,
      },
      { identity: true },
    )
    expect(seed.ok, `seed failed: ${seed.stderr}\n${seed.stdout}`).toBe(true)

    const retire = runConvexFn(
      'curatedGeometry:retireRoute',
      {
        routeId: ROUTE_ID,
        confirmed: true,
        reason: 'all_levers_failed',
      },
      { identity: true },
    )
    expect(retire.ok, `retire failed: ${retire.stderr}\n${retire.stdout}`).toBe(true)
    const retireBody = parseJson(retire.stdout)
    preRetiredAt = retireBody?.retiredAt ?? null

    const evidence = runConvexFn(
      'curatedGeometry:getRetirementEvidence',
      { routeId: ROUTE_ID },
      { identity: true },
    )
    const ev = parseJson(evidence.stdout)
    const expectedRetiredAt = ev?.retiredAtMs ?? retireBody?.retiredAtMs
    expect(expectedRetiredAt, 'OCC token (retiredAtMs) required for unretire').toBeTypeOf('number')

    const unretire = runConvexFn(
      'curatedGeometry:unretireRoute',
      { routeId: ROUTE_ID, expectedRetiredAt },
      { identity: true },
    )
    expect(unretire.ok, `unretire failed: ${unretire.stderr}\n${unretire.stdout}`).toBe(true)
    unretireResult = parseJson(unretire.stdout)

    const post = runConvexFn(
      'curatedGeometry:getRetirementEvidence',
      { routeId: ROUTE_ID },
      { identity: true },
    )
    afterUnretire = parseJson(post.stdout)
  }, 300_000)

  afterAll(() => {
    runConvexFn(
      'curatedGeometry:teardownS5T2Fixtures',
      { prefixes: ['test:redhatfix06-retired'] },
      { identity: true },
    )
  })

  it('TC-1: stored.retiredAt == null and api.retiredAt == null; no retiredAt:undefined patch sites', () => {
    expect(afterUnretire?.retiredAt).toBeNull()
    expect(unretireResult?.retiredAt).toBeNull()
    expect(preRetiredAt).not.toBeNull()
    // MUST_NOT_OBSERVE: retiredAt still equals pre-unretire timestamp
    expect(afterUnretire?.retiredAt).not.toEqual(preRetiredAt)

    const undefinedSites = countRetiredAtUndefinedSites()
    expect(undefinedSites).toBe(0)
  })
})
