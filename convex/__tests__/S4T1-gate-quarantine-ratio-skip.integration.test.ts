/**
 * AC-4: Quarantine flag skips ratio check but applies degenerate + region checks
 *
 * GIVEN two routes with IDENTICAL routed geometry (routedMiles=22, pointCount=50,
 * anchorCount=2 in-region) and IDENTICAL claimed length (claimedMiles=100 → REAL
 * ratio 0.22, far outside the 0.6–1.6 band) — one carrying quarantine.reason=
 * 'length_outlier', one with NO quarantine flag
 * WHEN the gate evaluates both with the SAME real ratio 0.22 (never null)
 * THEN the quarantined route returns verdict='pass' with the out-of-band ratio=0.22
 * STILL recorded and ratioSkipped=true, while the unquarantined twin returns
 * verdict='review' with failedCondition='ratio'.
 *
 * The load-bearing property: `verdict=='pass'` co-occurring with an out-of-band
 * `ratio==0.22` is reachable ONLY through the quarantine branch. Deleting that
 * branch collapses CASE A onto CASE B and turns this file RED.
 *
 * The twins are seeded identically and driven through the SAME action with the
 * SAME arguments — the ONLY variable is the quarantine flag on the DB row.
 *
 * TEST_TIER: integration
 * VERIFICATION_SERVICE: Convex dev deployment (real curatedGeometryGate.ts + quarantine flag)
 * FLOW_REF: UC-VER-01
 */

import { execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const PROJECT_ROOT = resolve(__dirname, '..', '..')
const EVIDENCE_DIR = resolve(PROJECT_ROOT, '.tmp/S4-T1/evidence')

const TEST_IDENTITY = JSON.stringify({
  subject: 's4t1-quarantine-test',
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
      timeout: 120000,
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

/**
 * Drive the real gate for a seeded route. Identical arguments for both twins:
 * routedMiles=22 against the row's own claimed 100mi → real ratio 0.22.
 * `claimedMiles` is deliberately NOT passed so the action reads the row's real
 * lengthMiles — a null claimed length would route the pass verdict through
 * evaluateRatioBoundary's null early-return instead of the quarantine branch.
 */
function driveGate(routeId: string, pointCount: number) {
  const action = runConvexFn(
    'curatedGeometryReconstruct:reconstructForRouteWithFixedGeometry',
    { routeId, routedMiles: 22, pointCount, anchorCount: 2 },
    { identity: true },
  )
  if (!action.ok) {
    throw new Error(`reconstructForRouteWithFixedGeometry failed for ${routeId}: ${action.stderr}`)
  }
  const actionResult = JSON.parse(action.stdout)

  // db_query evidence: read the persisted verification straight from the row.
  const verify = runConvexFn(
    'curatedGeometryTestSupport:getGeometryVerification',
    { routeId },
    { identity: true },
  )
  if (!verify.ok) throw new Error(`getGeometryVerification failed for ${routeId}: ${verify.stderr}`)

  return { actionResult, stored: JSON.parse(verify.stdout) }
}

describe('AC-4: Quarantine flag skips ratio check but applies degenerate + region checks', () => {
  let caseA: ReturnType<typeof driveGate>
  let caseB: ReturnType<typeof driveGate>
  let caseC: ReturnType<typeof driveGate>

  beforeAll(() => {
    console.log('🌱 Seeding quarantined/unquarantined twins + degenerate quarantined row...')
    const seedA = runConvexFn(
      'curatedGeometryTestSupport:seedQuarantinedOutOfBandRatioRow',
      {},
      { identity: true },
    )
    const seedB = runConvexFn(
      'curatedGeometryTestSupport:seedUnquarantinedOutOfBandRatioRow',
      {},
      { identity: true },
    )
    const seedC = runConvexFn(
      'curatedGeometryTestSupport:seedQuarantinedDegenerateRow',
      {},
      { identity: true },
    )
    // A failed seed must not masquerade as a gate failure.
    expect(seedA.ok, `seedQuarantinedOutOfBandRatioRow failed: ${seedA.stderr}`).toBe(true)
    expect(seedB.ok, `seedUnquarantinedOutOfBandRatioRow failed: ${seedB.stderr}`).toBe(true)
    expect(seedC.ok, `seedQuarantinedDegenerateRow failed: ${seedC.stderr}`).toBe(true)

    caseA = driveGate('test:quarantined-ratio-022', 50)
    caseB = driveGate('test:unquarantined-ratio-022', 50)
    caseC = driveGate('test:quarantined-degenerate-3pt', 3)
  }, 180_000)

  afterAll(() => {
    console.log('🧹 Cleaning up...')
    runConvexFn('curatedGeometryTestSupport:teardownAllTestRoutes', {}, { identity: true })
  })

  // ───────────────────────────────────────────────────────────────────────────
  // CASE A / TC-8 — quarantined: ratio skipped, but the REAL ratio is recorded
  // ───────────────────────────────────────────────────────────────────────────
  describe('TC-8: CASE A — quarantined route, real out-of-band ratio 0.22', () => {
    it('MUST_OBSERVE: verdict == "pass"', () => {
      expect(caseA.stored.verdict).toBe('pass')
    })

    it('MUST_OBSERVE: ratio == 0.22 (the REAL computed ratio, still recorded)', () => {
      expect(caseA.stored.ratio).toBeCloseTo(0.22, 2)
    })

    it('MUST_OBSERVE: ratioSkipped == true', () => {
      expect(caseA.actionResult.ratioSkipped).toBe(true)
    })

    it('MUST_OBSERVE: claimedMiles == 100 (real claimed length, never nulled by quarantine)', () => {
      expect(caseA.stored.claimedMiles).toBe(100)
    })

    it('MUST_NOT_OBSERVE: ratio == null — proves the null early-return fired, not the quarantine branch', () => {
      expect(caseA.stored.ratio).not.toBeNull()
    })

    it('MUST_NOT_OBSERVE: verdict == "review"', () => {
      expect(caseA.stored.verdict).not.toBe('review')
    })

    it('MUST_NOT_OBSERVE: failedCondition == "ratio"', () => {
      expect(caseA.stored.failedCondition).not.toBe('ratio')
    })

    it('MUST_NOT_OBSERVE: ratioSkipped == false', () => {
      expect(caseA.actionResult.ratioSkipped).not.toBe(false)
    })
  })

  // ───────────────────────────────────────────────────────────────────────────
  // CASE B / TC-11 — the discriminating twin: same real ratio, no quarantine
  // ───────────────────────────────────────────────────────────────────────────
  describe('TC-11: CASE B — unquarantined twin, IDENTICAL real ratio 0.22', () => {
    it('MUST_OBSERVE: verdict == "review"', () => {
      expect(caseB.stored.verdict).toBe('review')
    })

    it('MUST_OBSERVE: failedCondition == "ratio"', () => {
      expect(caseB.stored.failedCondition).toBe('ratio')
    })

    it('MUST_OBSERVE: ratio == 0.22 (same real computed ratio as CASE A)', () => {
      expect(caseB.stored.ratio).toBeCloseTo(0.22, 2)
    })

    it('MUST_OBSERVE: ratioSkipped == false', () => {
      expect(caseB.actionResult.ratioSkipped).toBe(false)
    })

    it('MUST_NOT_OBSERVE: verdict == "pass"', () => {
      expect(caseB.stored.verdict).not.toBe('pass')
    })

    it('MUST_NOT_OBSERVE: ratioSkipped == true', () => {
      expect(caseB.actionResult.ratioSkipped).not.toBe(true)
    })

    it('MUST_NOT_OBSERVE: ratio == null — the twin must carry the same real 0.22 as CASE A', () => {
      expect(caseB.stored.ratio).not.toBeNull()
    })

    // The discriminator itself: the twins are identical inputs and must diverge
    // ONLY because of the quarantine flag. Deleting the quarantine branch makes
    // these two verdicts equal and this assertion fails.
    it('DISCRIMINATOR: twins share the identical real ratio but diverge on verdict', () => {
      expect(caseA.stored.ratio).toBeCloseTo(caseB.stored.ratio, 5)
      expect(caseA.stored.claimedMiles).toBe(caseB.stored.claimedMiles)
      expect(caseA.stored.routedMiles).toBe(caseB.stored.routedMiles)
      expect(caseA.stored.verdict).not.toBe(caseB.stored.verdict)
    })
  })

  // ───────────────────────────────────────────────────────────────────────────
  // CASE C / TC-12 — quarantine does NOT bypass the degenerate check
  // ───────────────────────────────────────────────────────────────────────────
  describe('TC-12: CASE C — quarantined 3-point route still fails degenerate', () => {
    it('MUST_OBSERVE: verdict == "review"', () => {
      expect(caseC.stored.verdict).toBe('review')
    })

    it('MUST_OBSERVE: failedCondition == "degenerate"', () => {
      expect(caseC.stored.failedCondition).toBe('degenerate')
    })

    it('MUST_NOT_OBSERVE: verdict == "pass"', () => {
      expect(caseC.stored.verdict).not.toBe('pass')
    })

    it('MUST_NOT_OBSERVE: failedCondition == "ratio"', () => {
      expect(caseC.stored.failedCondition).not.toBe('ratio')
    })

    it('MUST_NOT_OBSERVE: failedCondition is empty or absent', () => {
      expect(caseC.stored.failedCondition).toBeTruthy()
    })
  })

  // EVIDENCE capture — the seeded MUST_OBSERVE values as they landed in the DB
  it('EVIDENCE: capture quarantine twin verdicts (db_query)', () => {
    mkdirSync(EVIDENCE_DIR, { recursive: true })
    writeFileSync(
      resolve(EVIDENCE_DIR, 'AC-4-quarantine-ratio-skip.json'),
      JSON.stringify(
        {
          capturedAt: new Date().toISOString(),
          note: 'Twins seeded identically; the ONLY variable is the quarantine flag on the DB row.',
          caseA_quarantined: {
            stored: caseA.stored,
            ratioSkipped: caseA.actionResult.ratioSkipped,
          },
          caseB_unquarantined_twin: {
            stored: caseB.stored,
            ratioSkipped: caseB.actionResult.ratioSkipped,
          },
          caseC_quarantined_degenerate: {
            stored: caseC.stored,
            ratioSkipped: caseC.actionResult.ratioSkipped,
          },
        },
        null,
        2,
      ),
    )
    expect(caseA.stored.ratio).toBeCloseTo(0.22, 2)
  })
})
