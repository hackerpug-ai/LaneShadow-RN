/**
 * AC-2: Lever 1 sends failing routes to next lever (not REVIEW queue)
 *
 * TEST_TIER: integration
 * VERIFICATION_SERVICE: Convex dev deployment (real Lever 1 failure routing)
 * FLOW_REF: UC-REC-01
 */

import { execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const PROJECT_ROOT = resolve(__dirname, '..', '..')
const EVIDENCE_DIR = resolve(PROJECT_ROOT, '.tmp/S4-T2/evidence')

const TEST_IDENTITY = JSON.stringify({
  subject: 's4t2-lever1-fail-routing-test',
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
      timeout: 180000,
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

describe('AC-2: Lever 1 failure routes to next lever (not REVIEW)', () => {
  let promoteResult: any
  let routeReading: any
  let reviewQueue: any

  beforeAll(() => {
    mkdirSync(EVIDENCE_DIR, { recursive: true })
    const seed = runConvexFn(
      'curatedGeometryReconstruct:seedLever1Fixtures',
      {},
      { identity: true },
    )
    expect(seed.ok, `seed failed: ${seed.stderr}`).toBe(true)

    const promote = runConvexFn(
      'curatedGeometryReconstruct:promoteForRoute',
      { routeId: 'test:lever1-fail' },
      { identity: true },
    )
    expect(promote.ok, `promote failed: ${promote.stderr}\n${promote.stdout}`).toBe(true)
    promoteResult = JSON.parse(promote.stdout)

    const reading = runConvexFn(
      'curatedGeometryReconstruct:getRouteForReading',
      { routeId: 'test:lever1-fail' },
      {},
    )
    routeReading = reading.ok ? JSON.parse(reading.stdout) : null

    const queue = runConvexFn(
      'curatedGeometryReconstruct:listGeometryReviewQueue',
      { routeIdPrefix: 'test:lever1-fail', limit: 20 },
      { identity: true },
    )
    reviewQueue = queue.ok ? JSON.parse(queue.stdout) : null

    writeFileSync(
      resolve(EVIDENCE_DIR, 'ac2-lever1-failure-routing.json'),
      JSON.stringify(
        {
          capturedAt: new Date().toISOString(),
          promoteResult,
          routeReading,
          reviewQueue,
        },
        null,
        2,
      ),
    )
  }, 120_000)

  afterAll(() => {
    runConvexFn('curatedGeometryReconstruct:teardownLeverTestRoutes', {}, { identity: true })
  })

  // TC-3
  it('TC-3 MUST_OBSERVE: route queued for Lever 2 processing', () => {
    expect(promoteResult?.queuedForLever2).toBe(true)
    expect(promoteResult?.disposition).toBe('next_lever')
    expect(promoteResult?.nextLever).toBe(2)
  })

  it('MUST_OBSERVE: geometryStatus remains unresolved (eligible for Lever 2)', () => {
    expect(routeReading?.geometryStatus).toBe('unresolved')
  })

  it('MUST_NOT_OBSERVE: route queued for REVIEW', () => {
    expect(promoteResult?.queuedForReview).toBe(false)
    const inReview = (reviewQueue?.reviewQueue ?? []).some(
      (r: any) => r.routeId === 'test:lever1-fail',
    )
    expect(inReview).toBe(false)
  })

  it('MUST_NOT_OBSERVE: geometry stored with verdict=pass', () => {
    expect(promoteResult?.verdict).not.toBe('pass')
    expect(promoteResult?.disposition).not.toBe('generated')
  })
})
