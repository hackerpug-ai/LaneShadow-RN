/**
 * AC-3: Independent top-50 review fails on wrong/duplicate/test row.
 *
 * TEST_TIER: integration + human-gate
 * VERIFICATION_SERVICE: Convex dev deployment (independent of couch gate)
 * FLOW_REF: UC-VER-05 / T-VER-020
 *
 * Anti-stub: one wrong forces fail; partial review is not pass; couch gate unchanged.
 */

import { execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const PROJECT_ROOT = resolve(__dirname, '..', '..')
const EVIDENCE_DIR = resolve(PROJECT_ROOT, '.tmp/S5-T3/evidence')
const PREFIX = 'test:s5t3-review-'

const TEST_IDENTITY = JSON.stringify({
  subject: 'test:s5t3-review',
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

describe('AC-3: Top-50 review independent fail-closed', () => {
  let manifest: any
  let failStatus: any
  let passStatus: any
  let couchBefore: any
  let couchAfter: any
  let reviewId: string

  beforeAll(() => {
    mkdirSync(EVIDENCE_DIR, { recursive: true })
    reviewId = `top50-review-${Date.now()}`

    const setup = runConvexFn(
      'testSupport:devSetupFounderUser',
      { clerkUserId: 'test:s5t3-review', role: 'founder' },
      { identity: true },
    )
    expect(setup.ok, `devSetupFounderUser failed: ${setup.stderr}`).toBe(true)

    runConvexFn('top50Review:teardownTop50FixturesPublic', { prefix: PREFIX }, { identity: true })
    runConvexFn('top50Review:clearTop50ReviewsPublic', { prefix: PREFIX }, { identity: true })

    const seed = runConvexFn(
      'top50Review:seedTop50FixturesPublic',
      { prefix: PREFIX, readyCount: 10, nonReadyCount: 1 },
      { identity: true },
    )
    expect(seed.ok, `seed failed: ${seed.stderr}\n${seed.stdout}`).toBe(true)

    const exp = runConvexFn(
      'top50Review:exportTop50Manifest',
      { limit: 50, routeIdPrefix: PREFIX },
      { identity: true },
    )
    expect(exp.ok, `export failed: ${exp.stderr}\n${exp.stdout}`).toBe(true)
    manifest = parseJson(exp.stdout)
    expect(manifest?.rowCount).toBeGreaterThanOrEqual(1)

    const couchGate = runConvexFn('couchVerdict:couchGateStatus', {}, { identity: true })
    couchBefore = parseJson(couchGate.stdout)

    const rows = manifest.rows as Array<{ routeId: string }>
    const topId = rows[0].routeId

    // --- Negative control: one wrong + one test/seed marker → fail ---
    const failVerdicts = rows.map((r, i) => ({
      routeId: r.routeId,
      verdict: i === 0 ? ('wrong' as const) : ('correct' as const),
      isDuplicate: false,
      isTestSeed: i === 1,
      reason: i === 0 ? 'wrong road identity' : i === 1 ? 'test/seed contamination' : undefined,
    }))

    const recordFail = runConvexFn(
      'top50Review:recordTop50Review',
      {
        reviewId: `${reviewId}-fail`,
        routeVerdicts: failVerdicts,
        expectedRouteIds: rows.map((r) => r.routeId),
      },
      { identity: true },
    )
    expect(
      recordFail.ok,
      `record fail review failed: ${recordFail.stderr}\n${recordFail.stdout}`,
    ).toBe(true)

    const qFail = runConvexFn(
      'top50Review:getTop50ReviewStatus',
      { reviewId: `${reviewId}-fail` },
      { identity: true },
    )
    expect(qFail.ok, `get fail status failed: ${qFail.stderr}`).toBe(true)
    failStatus = parseJson(qFail.stdout)

    // --- Clear negative control: all correct/plausible, no contamination → pass ---
    const passVerdicts = rows.map((r) => ({
      routeId: r.routeId,
      verdict: 'correct' as const,
      isDuplicate: false,
      isTestSeed: false,
    }))

    const recordPass = runConvexFn(
      'top50Review:recordTop50Review',
      {
        reviewId: `${reviewId}-pass`,
        routeVerdicts: passVerdicts,
        expectedRouteIds: rows.map((r) => r.routeId),
      },
      { identity: true },
    )
    expect(
      recordPass.ok,
      `record pass review failed: ${recordPass.stderr}\n${recordPass.stdout}`,
    ).toBe(true)

    const qPass = runConvexFn(
      'top50Review:getTop50ReviewStatus',
      { reviewId: `${reviewId}-pass` },
      { identity: true },
    )
    expect(qPass.ok).toBe(true)
    passStatus = parseJson(qPass.stdout)

    const couchGate2 = runConvexFn('couchVerdict:couchGateStatus', {}, { identity: true })
    couchAfter = parseJson(couchGate2.stdout)

    writeFileSync(
      resolve(EVIDENCE_DIR, 'AC-3-top-50-review.json'),
      JSON.stringify(
        {
          capturedAt: new Date().toISOString(),
          topId,
          failStatus,
          passStatus,
          couchBefore,
          couchAfter,
          rowCount: rows.length,
        },
        null,
        2,
      ),
    )
  }, 300_000)

  afterAll(() => {
    runConvexFn('top50Review:clearTop50ReviewsPublic', { prefix: PREFIX }, { identity: true })
    runConvexFn('top50Review:teardownTop50FixturesPublic', { prefix: PREFIX }, { identity: true })
  })

  it("MUST_OBSERVE: first result status=='fail' with offending routeId and reason", () => {
    expect(failStatus?.status).toBe('fail')
    expect(failStatus?.offendingRouteIds?.length).toBeGreaterThanOrEqual(1)
    expect(failStatus?.offendingReasons?.length).toBeGreaterThanOrEqual(1)
    expect(String(failStatus.offendingRouteIds[0]).length).toBeGreaterThanOrEqual(1)
    expect(String(failStatus.offendingReasons[0]).length).toBeGreaterThanOrEqual(1)
  })

  it("MUST_OBSERVE: second result status=='pass' after all clean + contaminationCount==0", () => {
    expect(passStatus?.status).toBe('pass')
    expect(passStatus?.contaminationCount).toBe(0)
    expect(passStatus?.reviewedRowCount).toBe(manifest.rowCount)
  })

  it('MUST_OBSERVE: reviewedRowCount matches catalog size and couch gate unchanged', () => {
    expect(failStatus?.reviewedRowCount).toBe(manifest.rowCount)
    expect(passStatus?.reviewedRowCount).toBe(manifest.rowCount)
    // Couch gate fields must be unchanged
    expect(couchAfter?.allowed).toBe(couchBefore?.allowed)
    expect(couchAfter?.overallVerdict ?? null).toBe(couchBefore?.overallVerdict ?? null)
  })

  it("MUST_NOT_OBSERVE: status=='pass' with one wrong (even if 49 correct)", () => {
    expect(failStatus?.status).not.toBe('pass')
    expect(failStatus?.status).toBe('fail')
  })

  it('MUST_NOT_OBSERVE: partial review treated as pass', () => {
    const rows = manifest.rows as Array<{ routeId: string }>
    const partial = rows.slice(0, Math.max(1, rows.length - 2)).map((r) => ({
      routeId: r.routeId,
      verdict: 'correct' as const,
      isDuplicate: false,
      isTestSeed: false,
    }))
    const partialId = `${reviewId}-partial`
    const rec = runConvexFn(
      'top50Review:recordTop50Review',
      {
        reviewId: partialId,
        routeVerdicts: partial,
        expectedRouteIds: rows.map((r) => r.routeId),
      },
      { identity: true },
    )
    // Either rejected or status fail — never pass
    if (rec.ok) {
      const q = runConvexFn(
        'top50Review:getTop50ReviewStatus',
        { reviewId: partialId },
        { identity: true },
      )
      const st = parseJson(q.stdout)
      expect(st?.status).not.toBe('pass')
    } else {
      expect(rec.ok).toBe(false)
    }
  })

  it('MUST_NOT_OBSERVE: top-50 review mutates retirementUnlockedAt or couchGateStatus', () => {
    expect(couchAfter?.allowed).toBe(couchBefore?.allowed)
    // No retirement unlock side-effect from top-50 review
    const retirementProbe = runConvexFn(
      'top50Review:getTop50ReviewStatus',
      { reviewId: `${reviewId}-pass` },
      { identity: true },
    )
    const st = parseJson(retirementProbe.stdout)
    expect(st?.retirementUnlockedAt).toBeUndefined()
    expect(st?.couchGateMutated).not.toBe(true)
  })
})
