/**
 * AC-1 [PRIMARY]: Waterfall processes routes in lever order (1→2→3)
 * until one produces gate-passing geometry; provenance is recorded.
 *
 * TEST_TIER: integration
 * VERIFICATION_SERVICE: Convex dev deployment (real waterfall orchestration)
 * FLOW_REF: UC-REC-04
 */

import { execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const PROJECT_ROOT = resolve(__dirname, '..', '..')
const EVIDENCE_DIR = resolve(PROJECT_ROOT, '.tmp/S4-T5/evidence')

const TEST_IDENTITY = JSON.stringify({
  subject: 's4t5-waterfall-lever-order',
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

describe('AC-1: Waterfall lever order 1→2→3 until gate-pass', () => {
  beforeAll(() => {
    mkdirSync(EVIDENCE_DIR, { recursive: true })
    const seed = runConvexFn('waterfallOrchestrator:seedWaterfallFixtures', {}, { identity: true })
    expect(seed.ok, `seedWaterfallFixtures failed: ${seed.stderr}\n${seed.stdout}`).toBe(true)
  }, 120_000)

  afterAll(() => {
    runConvexFn('waterfallOrchestrator:teardownWaterfallFixtures', {}, { identity: true })
  })

  // TC-1 CASE 1 — lever1-pass: L1 wins, L2/L3 not called, provenance scraped_promoted
  describe('TC-1 CASE 1: lever1-pass stops cascade at Lever 1', () => {
    let waterfallResult: any
    let verificationData: any

    beforeAll(() => {
      const run = runConvexFn(
        'waterfallOrchestrator:runSampleWaterfall',
        {
          routeIds: ['test:lever1-pass'],
          maxCost: 10,
        },
        { identity: true },
      )
      expect(run.ok, `runSampleWaterfall failed: ${run.stderr}\n${run.stdout}`).toBe(true)
      waterfallResult = JSON.parse(run.stdout)

      const verify = runConvexFn(
        'curatedGeometryReconstruct:getVerificationForRoute',
        { routeId: 'test:lever1-pass' },
        { identity: true },
      )
      verificationData = verify.ok ? JSON.parse(verify.stdout) : null

      writeFileSync(
        resolve(EVIDENCE_DIR, 'AC-1-case1-lever1-pass.json'),
        JSON.stringify(
          {
            capturedAt: new Date().toISOString(),
            waterfallResult,
            verificationData,
          },
          null,
          2,
        ),
      )
    }, 180_000)

    it('MUST_OBSERVE: verification.provenance == "scraped_promoted"', () => {
      expect(verificationData?.provenance).toBe('scraped_promoted')
    })

    it('MUST_OBSERVE: Lever 1 ran; Lever 2/3 not called', () => {
      const route = waterfallResult?.routes?.find((r: any) => r.routeId === 'test:lever1-pass')
      expect(route).toBeTruthy()
      expect(route.leversRun).toEqual([1])
      expect(route.terminalState).toBe('recovered')
      expect(route.provenance).toBe('scraped_promoted')
    })

    it('MUST_NOT_OBSERVE: Lever 2/3 called or provenance null', () => {
      const route = waterfallResult?.routes?.find((r: any) => r.routeId === 'test:lever1-pass')
      expect(route.leversRun).not.toContain(2)
      expect(route.leversRun).not.toContain(3)
      expect(verificationData?.provenance).not.toBeNull()
    })
  })

  // TC-1 CASE 2 — lever2-pass: L1 fail, L2 pass, L3 not called
  describe('TC-1 CASE 2: lever2-pass stops cascade at Lever 2', () => {
    let waterfallResult: any
    let verificationData: any

    beforeAll(() => {
      // Reset lever2 route to unresolved (case1 may have left catalog state)
      const reseed = runConvexFn(
        'waterfallOrchestrator:seedWaterfallFixtures',
        {},
        { identity: true },
      )
      expect(reseed.ok, `reseed failed: ${reseed.stderr}`).toBe(true)

      const run = runConvexFn(
        'waterfallOrchestrator:runSampleWaterfall',
        {
          routeIds: ['test:lever2-pass'],
          maxCost: 10,
          // Deterministic production gate+persist path (same module as live L2)
          // so lever-order is exercised without burning a live LLM call.
          lever2FixedGeometry: {
            routedMiles: 41,
            pointCount: 80,
            anchorCount: 2,
            claimedMiles: 41,
          },
        },
        { identity: true },
      )
      expect(run.ok, `runSampleWaterfall L2 failed: ${run.stderr}\n${run.stdout}`).toBe(true)
      waterfallResult = JSON.parse(run.stdout)

      const verify = runConvexFn(
        'curatedGeometryReconstruct:getVerificationForRoute',
        { routeId: 'test:lever2-pass' },
        { identity: true },
      )
      verificationData = verify.ok ? JSON.parse(verify.stdout) : null

      writeFileSync(
        resolve(EVIDENCE_DIR, 'AC-1-case2-lever2-pass.json'),
        JSON.stringify(
          {
            capturedAt: new Date().toISOString(),
            waterfallResult,
            verificationData,
          },
          null,
          2,
        ),
      )
    }, 180_000)

    it('MUST_OBSERVE: verification.provenance == "ai_reconstructed"', () => {
      expect(verificationData?.provenance).toBe('ai_reconstructed')
    })

    it('MUST_OBSERVE: Lever 1 failed, Lever 2 passed, Lever 3 not called', () => {
      const route = waterfallResult?.routes?.find((r: any) => r.routeId === 'test:lever2-pass')
      expect(route).toBeTruthy()
      expect(route.leversRun).toEqual([1, 2])
      expect(route.terminalState).toBe('recovered')
      expect(route.provenance).toBe('ai_reconstructed')
      expect(route.lever1Failed).toBe(true)
    })

    it('MUST_NOT_OBSERVE: Lever 3 called', () => {
      const route = waterfallResult?.routes?.find((r: any) => r.routeId === 'test:lever2-pass')
      expect(route.leversRun).not.toContain(3)
    })
  })
})
