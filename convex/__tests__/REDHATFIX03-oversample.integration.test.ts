/**
 * REDHAT-FIX-03 AC-4 / TC-4: Oversample fills limit after scrub
 *
 * Dense test: fixtures outrank real candidates in the status scan; unscoped
 * listRetirementCandidates(limit=N) must oversample-then-filter so reals fill.
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
  subject: 's4t5-redhat-fix-03-oversample',
  issuer: 'https://laneshadow.test',
})

/** More fixtures than limit so take(N)-before-filter would empty the export. */
const TEST_ROUTE_IDS = Array.from(
  { length: 25 },
  (_, i) => `test:s4t5-passed-os-${String(i + 1).padStart(3, '0')}-redhatfix03`,
)
const REAL_A = 'motorcycleroads:real-os-a-redhatfix03'
const REAL_B = 'motorcycleroads:real-os-b-redhatfix03'
const LIMIT = 10

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

describe('TC-4: unscoped export surfaces real candidates after oversample-and-filter', () => {
  let result: any
  let testPrefixCount = 0
  let nonFixtureCandidateCount = 0

  beforeAll(() => {
    mkdirSync(EVIDENCE_DIR, { recursive: true })

    const setup = runConvexFn(
      'testSupport:devSetupFounderUser',
      { clerkUserId: 's4t5-redhat-fix-03-oversample', role: 'operator' },
      { identity: true },
    )
    expect(setup.ok, `devSetupFounderUser failed: ${setup.stderr}`).toBe(true)

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

    for (const routeId of [REAL_A, REAL_B]) {
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
      { limit: LIMIT },
      { identity: true },
    )
    expect(list.ok, `listRetirementCandidates failed: ${list.stderr}\n${list.stdout}`).toBe(true)
    result = parseJson(list.stdout)

    const rows: any[] = result?.candidates ?? []
    testPrefixCount = rows.filter((c) => String(c.routeId).startsWith('test:')).length
    nonFixtureCandidateCount = rows.filter(
      (c) => !String(c.routeId).startsWith('test:') && !String(c.routeId).startsWith('seed:'),
    ).length

    writeFileSync(
      resolve(EVIDENCE_DIR, 'AC-4-oversample.json'),
      JSON.stringify(
        {
          capturedAt: new Date().toISOString(),
          limit: LIMIT,
          candidatesLength: rows.length,
          testPrefixCount,
          nonFixtureCandidateCount,
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
        routeIds: [...TEST_ROUTE_IDS, REAL_A, REAL_B],
        prefixes: [
          'test:s4t5-passed-os-',
          'motorcycleroads:real-os-a-redhatfix03',
          'motorcycleroads:real-os-b-redhatfix03',
        ],
      },
      { identity: true },
    )
  })

  it('MUST_OBSERVE: nonFixtureCandidateCount >= 1', () => {
    expect(nonFixtureCandidateCount).toBeGreaterThanOrEqual(1)
    const ids = (result?.candidates ?? []).map((c: any) => c.routeId as string)
    expect(ids.some((id: string) => id === REAL_A || id === REAL_B)).toBe(true)
  })

  it("MUST_OBSERVE: candidates with prefix 'test:' count == 0", () => {
    expect(testPrefixCount).toBe(0)
  })

  it('MUST_OBSERVE: candidates.length >= 1 and <= limit', () => {
    const rows = result?.candidates ?? []
    expect(rows.length).toBeGreaterThanOrEqual(1)
    expect(rows.length).toBeLessThanOrEqual(LIMIT)
  })
})
