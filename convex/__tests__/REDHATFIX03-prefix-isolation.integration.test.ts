/**
 * REDHAT-FIX-03 AC-2 / TC-2: Prefix-scoped harness retains test: rows for isolation
 *
 * TEST_TIER: integration
 * VERIFICATION_SERVICE: Convex dev deployment
 * FLOW_REF: UC-REC-05
 * start_ref: redhatfix03-prefix-harness
 */

import { execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const PROJECT_ROOT = resolve(__dirname, '..', '..')
const EVIDENCE_DIR = resolve(PROJECT_ROOT, '.tmp/REDHAT-FIX-03/evidence')

const TEST_IDENTITY = JSON.stringify({
  subject: 's4t5-redhat-fix-03-prefix',
  issuer: 'https://laneshadow.test',
})

const HARNESS_ID = 'test:redhatfix03-all-failed'
const PREFIX = 'test:redhatfix03-'

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

describe('TC-2: prefix-scoped listRetirementCandidates retains test: harness rows', () => {
  let scoped: any

  beforeAll(() => {
    mkdirSync(EVIDENCE_DIR, { recursive: true })

    const setup = runConvexFn(
      'testSupport:devSetupFounderUser',
      { clerkUserId: 's4t5-redhat-fix-03-prefix', role: 'operator' },
      { identity: true },
    )
    expect(setup.ok, `devSetupFounderUser failed: ${setup.stderr}`).toBe(true)

    const seed = runConvexFn(
      'curatedGeometry:seedS5T2RetirementFixtures',
      {
        scenario: 'all-levers-failed-vs-pass',
        allFailedRouteId: HARNESS_ID,
      },
      { identity: true },
    )
    expect(seed.ok, `seed failed: ${seed.stderr}\n${seed.stdout}`).toBe(true)

    const list = runConvexFn(
      'curatedGeometry:listRetirementCandidates',
      { routeIdPrefix: PREFIX, limit: 50 },
      { identity: true },
    )
    expect(list.ok, `listRetirementCandidates failed: ${list.stderr}\n${list.stdout}`).toBe(true)
    scoped = parseJson(list.stdout)

    writeFileSync(
      resolve(EVIDENCE_DIR, 'AC-2-prefix-isolation.json'),
      JSON.stringify(
        {
          capturedAt: new Date().toISOString(),
          prefix: PREFIX,
          harnessId: HARNESS_ID,
          scoped,
        },
        null,
        2,
      ),
    )
  }, 300_000)

  afterAll(() => {
    runConvexFn(
      'curatedGeometry:teardownS5T2Fixtures',
      { prefixes: [PREFIX], routeIds: [HARNESS_ID] },
      { identity: true },
    )
  })

  it("MUST_OBSERVE: candidates includes routeId == 'test:redhatfix03-all-failed'", () => {
    const rows = scoped?.candidates ?? []
    const hit = rows.find((c: any) => c.routeId === HARNESS_ID)
    expect(hit, 'harness row missing from prefix-scoped export').toBeTruthy()
    expect(hit.eligible).toBe(true)
  })

  it('MUST_OBSERVE: candidates.length >= 1', () => {
    const rows = scoped?.candidates ?? []
    expect(rows.length).toBeGreaterThanOrEqual(1)
  })
})
