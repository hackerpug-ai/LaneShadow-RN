/**
 * AC-4: Un-retire is reversible and preserves history; no auto riderReady.
 *
 * TEST_TIER: integration
 * VERIFICATION_SERVICE: Convex dev deployment
 * FLOW_REF: UC-REC-05 / T-REC-015
 * start_ref: s5t2-retire-unretire-preserves-record
 */

import { execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const PROJECT_ROOT = resolve(__dirname, '..', '..')
const EVIDENCE_DIR = resolve(PROJECT_ROOT, '.tmp/S5-T2/evidence')

const TEST_IDENTITY = JSON.stringify({
  subject: 's4t5-s5t2-unretire',
  issuer: 'https://laneshadow.test',
})

const UNRETIRE_ID = 'test:s5t2-unretire'

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

describe('AC-4: un-retire preserves record and recomputes riderReady from evidence', () => {
  let beforeRetire: any
  let afterRetire: any
  let afterUnretire: any
  let discovery: any

  beforeAll(() => {
    mkdirSync(EVIDENCE_DIR, { recursive: true })

    const setup = runConvexFn(
      'testSupport:devSetupFounderUser',
      { clerkUserId: 's4t5-s5t2-unretire', role: 'operator' },
      { identity: true },
    )
    expect(setup.ok, `devSetupFounderUser failed: ${setup.stderr}`).toBe(true)

    const seed = runConvexFn(
      'curatedGeometry:seedS5T2RetirementFixtures',
      {
        scenario: 'retire-unretire-preserves-record',
        allFailedRouteId: UNRETIRE_ID,
      },
      { identity: true },
    )
    expect(seed.ok, `seed failed: ${seed.stderr}\n${seed.stdout}`).toBe(true)

    const pre = runConvexFn(
      'curatedGeometry:getRetirementEvidence',
      { routeId: UNRETIRE_ID },
      { identity: true },
    )
    beforeRetire = parseJson(pre.stdout)

    const retire = runConvexFn(
      'curatedGeometry:retireRoute',
      {
        routeId: UNRETIRE_ID,
        confirmed: true,
        reason: 'founder confirmed all-lever failure',
      },
      { identity: true },
    )
    expect(retire.ok, `retire failed: ${retire.stderr}\n${retire.stdout}`).toBe(true)

    const mid = runConvexFn(
      'curatedGeometry:getRetirementEvidence',
      { routeId: UNRETIRE_ID },
      { identity: true },
    )
    afterRetire = parseJson(mid.stdout)
    const expectedRetiredAt = afterRetire?.retiredAtMs
    expect(expectedRetiredAt, 'OCC token required for unretire').toBeTypeOf('number')

    const unretire = runConvexFn(
      'curatedGeometry:unretireRoute',
      { routeId: UNRETIRE_ID, expectedRetiredAt },
      { identity: true },
    )
    expect(unretire.ok, `unretire failed: ${unretire.stderr}\n${unretire.stdout}`).toBe(true)

    const post = runConvexFn(
      'curatedGeometry:getRetirementEvidence',
      { routeId: UNRETIRE_ID },
      { identity: true },
    )
    afterUnretire = parseJson(post.stdout)

    const list = runConvexFn(
      'curatedRoutes:listCuratedRoutes',
      { sort: 'best', limit: 100 },
      { identity: true },
    )
    discovery = parseJson(list.stdout) ?? []

    writeFileSync(
      resolve(EVIDENCE_DIR, 'AC-4-unretire.json'),
      JSON.stringify(
        {
          capturedAt: new Date().toISOString(),
          beforeRetire,
          afterRetire,
          afterUnretire,
          discoveryHitCount: (Array.isArray(discovery) ? discovery : []).filter(
            (r: any) => r.routeId === UNRETIRE_ID,
          ).length,
        },
        null,
        2,
      ),
    )
  }, 300_000)

  afterAll(() => {
    runConvexFn(
      'curatedGeometry:teardownS5T2Fixtures',
      { prefixes: ['test:s5t2-unretire'] },
      { identity: true },
    )
  })

  it('MUST_OBSERVE: same route _id after un-retire; geometry candidate retained', () => {
    expect(afterUnretire?.routeDocId).toBe(beforeRetire?.routeDocId)
    expect(afterUnretire?.sameId).toBe(true)
    expect(afterUnretire?.geometryCandidateRetained).toBe(true)
  })

  it('MUST_OBSERVE: retiredAt cleared and geometryStatus != retired; disposition history appended', () => {
    expect(afterUnretire?.retiredAt).toBeNull()
    expect(afterUnretire?.geometryStatus).not.toBe('retired')
    // retire + unretire dispositions
    expect(afterUnretire?.dispositionCount).toBeGreaterThanOrEqual(2)
  })

  it('MUST_OBSERVE: recompute returns riderReady=false without gate-PASS geometry', () => {
    expect(afterUnretire?.verification?.verdict).not.toBe('pass')
    expect(afterUnretire?.riderReady).toBe(false)
  })

  it('MUST_NOT_OBSERVE: deleted evidence, new _id, or discovery surface without pass', () => {
    expect(afterUnretire?.retirementReasonHistoryRetained).toBe(true)
    expect(afterUnretire?.leverFailureEvidenceCount).toBeGreaterThanOrEqual(3)
    expect(afterUnretire?.sameId).not.toBe(false)
    const hits = (Array.isArray(discovery) ? discovery : []).filter(
      (r: any) => r.routeId === UNRETIRE_ID,
    )
    expect(hits.length).toBe(0)
  })
})
