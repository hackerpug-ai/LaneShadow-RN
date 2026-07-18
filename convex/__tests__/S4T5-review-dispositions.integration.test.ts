/**
 * AC-6: REVIEW queue supports dispositions: approve, retry, retire.
 *
 * TEST_TIER: integration
 * VERIFICATION_SERVICE: Convex dev deployment (real REVIEW disposition mutations)
 * FLOW_REF: UC-VER-04
 */

import { execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const PROJECT_ROOT = resolve(__dirname, '..', '..')
const EVIDENCE_DIR = resolve(PROJECT_ROOT, '.tmp/S4-T5/evidence')

const TEST_IDENTITY = JSON.stringify({
  subject: 's4t5-review-dispositions',
  issuer: 'https://laneshadow.test',
})

const POLY =
  'oditE~o~}Uk~@uq@i~@uq@k~@uq@k~@uq@i~@uq@k~@sq@i~@uq@k~@uq@k~@uq@i~@uq@k~@uq@k~@uq@i~@uq@k~@uq@i~@uq@k~@sq@k~@uq@'

const APPROVE_ID = 'test:s4t5-disp-approve'
const RETRY_ID = 'test:s4t5-disp-retry'
const RETIRE_ID = 'test:s4t5-disp-retire'

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

describe('AC-6: REVIEW dispositions approve / retry / retire', () => {
  let approveResult: any
  let approveState: any
  let approveQueue: any

  let retryResult: any
  let retryQueue: any

  let retireResult: any
  let retireState: any

  beforeAll(() => {
    mkdirSync(EVIDENCE_DIR, { recursive: true })

    // Seed three REVIEW entries
    for (const routeId of [APPROVE_ID, RETRY_ID, RETIRE_ID]) {
      const seed = runConvexFn(
        'reviewQueue:seedReviewQueueEntry',
        {
          routeId,
          name: `Disposition ${routeId}`,
          bestCandidateGeometry: POLY,
          failedCondition: 'ratio',
          lengthMiles: 41,
        },
        { identity: true },
      )
      expect(seed.ok, `seed ${routeId} failed: ${seed.stderr}`).toBe(true)
    }

    // --- approve ---
    const approve = runConvexFn(
      'reviewQueue:approveDisposition',
      { routeId: APPROVE_ID },
      { identity: true },
    )
    expect(approve.ok, `approve failed: ${approve.stderr}\n${approve.stdout}`).toBe(true)
    approveResult = JSON.parse(approve.stdout)

    const aState = runConvexFn(
      'reviewQueue:getRouteDispositionState',
      { routeId: APPROVE_ID },
      { identity: true },
    )
    approveState = aState.ok ? JSON.parse(aState.stdout) : null

    const aQueue = runConvexFn(
      'reviewQueue:listGeometryReviewQueue',
      { routeIdPrefix: APPROVE_ID, limit: 10 },
      { identity: true },
    )
    approveQueue = aQueue.ok ? JSON.parse(aQueue.stdout) : null

    // --- retry lever 2 ---
    const retry = runConvexFn(
      'reviewQueue:retryDisposition',
      {
        routeId: RETRY_ID,
        lever: 2,
        lever2FixedGeometry: {
          routedMiles: 41,
          pointCount: 80,
          anchorCount: 2,
          claimedMiles: 41,
        },
      },
      { identity: true },
    )
    expect(retry.ok, `retry failed: ${retry.stderr}\n${retry.stdout}`).toBe(true)
    retryResult = JSON.parse(retry.stdout)

    const rQueue = runConvexFn(
      'reviewQueue:listGeometryReviewQueue',
      { routeIdPrefix: RETRY_ID, limit: 10 },
      { identity: true },
    )
    retryQueue = rQueue.ok ? JSON.parse(rQueue.stdout) : null

    // --- retire ---
    const retire = runConvexFn(
      'reviewQueue:retireDisposition',
      { routeId: RETIRE_ID },
      { identity: true },
    )
    expect(retire.ok, `retire failed: ${retire.stderr}\n${retire.stdout}`).toBe(true)
    retireResult = JSON.parse(retire.stdout)

    const tState = runConvexFn(
      'reviewQueue:getRouteDispositionState',
      { routeId: RETIRE_ID },
      { identity: true },
    )
    retireState = tState.ok ? JSON.parse(tState.stdout) : null

    writeFileSync(
      resolve(EVIDENCE_DIR, 'AC-6-review-dispositions.json'),
      JSON.stringify(
        {
          capturedAt: new Date().toISOString(),
          approveResult,
          approveState,
          approveQueue,
          retryResult,
          retryQueue,
          retireResult,
          retireState,
        },
        null,
        2,
      ),
    )
  }, 300_000)

  afterAll(() => {
    runConvexFn(
      'waterfallOrchestrator:teardownWaterfallFixtures',
      { prefixes: ['test:s4t5-disp'] },
      { identity: true },
    )
  })

  describe('CASE 1 — approve', () => {
    it('MUST_OBSERVE: curated_route_geometry.verdict == pass, REVIEW removed', () => {
      expect(approveState?.verdict).toBe('pass')
      expect(approveState?.geometryStatus).toBe('generated')
      expect(approveResult.disposition).toBe('approve')
      expect(approveQueue?.length ?? 0).toBe(0)
    })

    it('MUST_NOT_OBSERVE: REVIEW entry remains / geometry not persisted', () => {
      const stillQueued = (approveQueue?.reviewQueue ?? []).some(
        (e: any) => e.routeId === APPROVE_ID,
      )
      expect(stillQueued).toBe(false)
      expect(approveState?.geometryStatus).not.toBe('review')
    })
  })

  describe('CASE 2 — retry', () => {
    it('MUST_OBSERVE: retryCount == 1, attemptedAt set', () => {
      expect(retryResult.retryCount).toBe(1)
      expect(retryResult.attemptedAt).toBeTruthy()
      expect(retryResult.leverResult).toBeTruthy()
      // Lever 2 re-ran with fixed pass → generated
      expect(retryResult.leverResult?.verdict).toBe('pass')
    })

    it('MUST_NOT_OBSERVE: no retry occurred', () => {
      expect(retryResult.retryCount).toBeGreaterThan(0)
      expect(retryResult.disposition).toBe('retry')
    })
  })

  describe('CASE 3 — retire', () => {
    it('MUST_OBSERVE: retiredAt is ISO with 2026-, riderReady == false', () => {
      expect(retireResult.retiredAt).toMatch(/2026-/)
      expect(retireResult.riderReady).toBe(false)
      expect(retireState?.retiredAt).toMatch(/2026-/)
      expect(retireState?.riderReady).toBe(false)
    })

    it('MUST_NOT_OBSERVE: retiredAt == null', () => {
      expect(retireResult.retiredAt).not.toBeNull()
      expect(retireState?.retiredAt).not.toBeNull()
    })
  })
})
