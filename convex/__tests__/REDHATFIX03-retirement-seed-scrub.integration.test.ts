/**
 * REDHAT-FIX-03 AC-1 / TC-1: Unscoped listRetirementCandidates purges test: and seed:
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

const PROJECT_ROOT = resolve(__dirname, '..', '..')
const EVIDENCE_DIR = resolve(PROJECT_ROOT, '.tmp/REDHAT-FIX-03/evidence')

const TEST_IDENTITY = JSON.stringify({
  subject: 's4t5-redhat-fix-03-scrub',
  issuer: 'https://laneshadow.test',
})

/** Dense fixture contamination mixed with real eligible candidates. */
const TEST_ROUTE_IDS = Array.from(
  { length: 20 },
  (_, i) => `test:s4t5-passed-${String(i + 1).padStart(3, '0')}-redhatfix03`,
)
const SEED_ROUTE = 'seed:fake-retire-01-redhatfix03'
const REAL_A = 'motorcycleroads:real-retire-a-redhatfix03'
const REAL_B = 'motorcycleroads:real-retire-b-redhatfix03'
const CANONICAL_TEST_ID = 'test:s4t5-passed-001-redhatfix03'

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

describe('TC-1: unscoped listRetirementCandidates purges test: and seed: routeIds', () => {
  let result: any
  let contaminationCount = 0
  let realEligibleCount = 0
  let testPrefixCount = 0
  let seedPrefixCount = 0

  beforeAll(() => {
    mkdirSync(EVIDENCE_DIR, { recursive: true })

    const setup = runConvexFn(
      'testSupport:devSetupFounderUser',
      { clerkUserId: 's4t5-redhat-fix-03-scrub', role: 'operator' },
      { identity: true },
    )
    expect(setup.ok, `devSetupFounderUser failed: ${setup.stderr}`).toBe(true)

    // Seed dense test: fixtures first so they dominate index scan order when present.
    for (const routeId of TEST_ROUTE_IDS) {
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

    for (const routeId of [SEED_ROUTE, REAL_A, REAL_B]) {
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
    result = parseJson(list.stdout)

    const rows: any[] = result?.candidates ?? []
    testPrefixCount = rows.filter((c) => String(c.routeId).startsWith('test:')).length
    seedPrefixCount = rows.filter((c) => String(c.routeId).startsWith('seed:')).length
    contaminationCount = testPrefixCount + seedPrefixCount
    realEligibleCount = rows.filter(
      (c) =>
        c.eligible === true &&
        !String(c.routeId).startsWith('test:') &&
        !String(c.routeId).startsWith('seed:'),
    ).length

    writeFileSync(
      resolve(EVIDENCE_DIR, 'AC-1-retirement-seed-scrub.json'),
      JSON.stringify(
        {
          capturedAt: new Date().toISOString(),
          limit: 50,
          candidatesLength: rows.length,
          testPrefixCount,
          seedPrefixCount,
          contaminationCount,
          realEligibleCount,
          routeIds: rows.map((c) => c.routeId),
        },
        null,
        2,
      ),
    )
  }, 600_000)

  afterAll(() => {
    runConvexFn(
      'curatedGeometry:teardownS5T2Fixtures',
      {
        routeIds: [...TEST_ROUTE_IDS, SEED_ROUTE, REAL_A, REAL_B],
        prefixes: [
          'test:s4t5-passed-',
          'seed:fake-retire-01-redhatfix03',
          'motorcycleroads:real-retire-a-redhatfix03',
          'motorcycleroads:real-retire-b-redhatfix03',
        ],
      },
      { identity: true },
    )
  })

  it("MUST_OBSERVE: candidates with prefix 'test:' count == 0", () => {
    expect(testPrefixCount).toBe(0)
  })

  it("MUST_OBSERVE: candidates with prefix 'seed:' count == 0", () => {
    expect(seedPrefixCount).toBe(0)
  })

  it('MUST_OBSERVE: contaminationCount == 0', () => {
    expect(contaminationCount).toBe(0)
  })

  it('MUST_OBSERVE: realEligibleCount >= 1 and candidates.length >= 1', () => {
    const rows = result?.candidates ?? []
    expect(rows.length).toBeGreaterThanOrEqual(1)
    expect(realEligibleCount).toBeGreaterThanOrEqual(1)
    const ids = rows.map((c: any) => c.routeId)
    expect(ids.some((id: string) => id === REAL_A || id === REAL_B)).toBe(true)
  })

  it('MUST_NOT_OBSERVE: routeId == test:s4t5-passed-001 (or our seeded equivalent)', () => {
    const ids = (result?.candidates ?? []).map((c: any) => c.routeId as string)
    expect(ids).not.toContain(CANONICAL_TEST_ID)
    expect(ids).not.toContain(TEST_ROUTE_IDS[0])
    expect(ids).not.toContain(SEED_ROUTE)
  })
})
