/**
 * REDHAT-FIX-03 AC-3 / TC-3: isTestSeedRoute treats seed: as fixture contamination
 * and unscoped listRetirementCandidates uses that shared predicate.
 *
 * TEST_TIER: integration
 * VERIFICATION_SERVICE: Convex dev deployment
 * FLOW_REF: UC-REC-05
 * start_ref: redhatfix03-mixed-retirement-pool
 */

import { execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { isTestSeedRoute } from '../lib/top50Eligibility'

const PROJECT_ROOT = resolve(__dirname, '..', '..')
const EVIDENCE_DIR = resolve(PROJECT_ROOT, '.tmp/REDHAT-FIX-03/evidence')

const TEST_IDENTITY = JSON.stringify({
  subject: 's4t5-redhat-fix-03-predicate',
  issuer: 'https://laneshadow.test',
})

const SEED_ROUTE = 'seed:redhatfix03-fake'
const REAL_ROUTE = 'motorcycleroads:redhatfix03-pred-real'
const TEST_ROUTE = 'test:s4t5-passed-redhatfix03-pred'

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
    const stdout = typeof err.stdout === 'string' ? err.stdout : ''
    const stderr = typeof err.stderr === 'string' ? err.stderr : ''
    return { ok: false, stdout, stderr }
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

describe('TC-3: isTestSeedRoute extended for seed: and used by unscoped export', () => {
  let unscoped: any

  beforeAll(() => {
    mkdirSync(EVIDENCE_DIR, { recursive: true })

    const setup = runConvexFn(
      'testSupport:devSetupFounderUser',
      { clerkUserId: 's4t5-redhat-fix-03-predicate', role: 'operator' },
      { identity: true },
    )
    expect(setup.ok, `devSetupFounderUser failed: ${setup.stderr}`).toBe(true)

    for (const routeId of [TEST_ROUTE, SEED_ROUTE, REAL_ROUTE]) {
      const seed = runConvexFn(
        'curatedGeometry:seedS5T2RetirementFixtures',
        {
          scenario: 'all-levers-failed-vs-pass',
          allFailedRouteId: routeId,
        },
        { identity: true },
      )
      expect(seed.ok, `seed ${routeId} failed: ${seed.stderr}\n${seed.stdout}`).toBe(true)
    }

    const list = runConvexFn(
      'curatedGeometry:listRetirementCandidates',
      { limit: 50 },
      { identity: true },
    )
    expect(list.ok, `listRetirementCandidates failed: ${list.stderr}\n${list.stdout}`).toBe(true)
    unscoped = parseJson(list.stdout)

    writeFileSync(
      resolve(EVIDENCE_DIR, 'AC-3-shared-predicate.json'),
      JSON.stringify(
        {
          capturedAt: new Date().toISOString(),
          predicate: {
            test: isTestSeedRoute('test:s4t5-passed-001'),
            seed: isTestSeedRoute('seed:fake'),
            real: isTestSeedRoute('motorcycleroads:cherohala'),
          },
          unscoped,
        },
        null,
        2,
      ),
    )
  }, 300_000)

  afterAll(() => {
    runConvexFn(
      'curatedGeometry:teardownS5T2Fixtures',
      {
        routeIds: [TEST_ROUTE, SEED_ROUTE, REAL_ROUTE],
        prefixes: [
          'test:s4t5-passed-redhatfix03-pred',
          'seed:redhatfix03-fake',
          'motorcycleroads:redhatfix03-pred-real',
        ],
      },
      { identity: true },
    )
  })

  it("MUST_OBSERVE: isTestSeedRoute('test:s4t5-passed-001') == true", () => {
    expect(isTestSeedRoute('test:s4t5-passed-001')).toBe(true)
  })

  it("MUST_OBSERVE: isTestSeedRoute('seed:fake') == true", () => {
    expect(isTestSeedRoute('seed:fake')).toBe(true)
  })

  it("MUST_OBSERVE: isTestSeedRoute('motorcycleroads:cherohala') == false", () => {
    expect(isTestSeedRoute('motorcycleroads:cherohala')).toBe(false)
  })

  it('MUST_OBSERVE: unscoped export excludes seed: and test: using that predicate', () => {
    const rows = unscoped?.candidates ?? []
    const ids = rows.map((c: any) => c.routeId as string)
    expect(ids).not.toContain(SEED_ROUTE)
    expect(ids).not.toContain(TEST_ROUTE)
    expect(ids.some((id: string) => isTestSeedRoute(id))).toBe(false)
    expect(ids).toContain(REAL_ROUTE)
  })
})
