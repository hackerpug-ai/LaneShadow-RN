/**
 * REDHAT-FIX-01 [PRIMARY integration]: The deterministic Lever-2 test seam
 * (`lever2FixedGeometry`) and the other test-only seams (`simulateRateLimitFailures`,
 * `skipSleep`) MUST be unreachable from a production closeout identity.
 *
 * The forged 2026-07-19 gate closeout (`.gate-evidence/.../scripts/step1.sh`)
 * injected `lever2FixedGeometry` straight into `runSampleWaterfall` under the
 * subject `s4-human-gate`, bypassing real Lever-2 LLM reconstruction. FIX-01 now
 * REMOVES the seam from every public production entry — `runSampleWaterfall` and
 * `reviewQueue:retryDisposition` no longer declare these args at all, so a
 * production caller is rejected at the Convex validator before the handler runs.
 * The seams survive ONLY on dedicated test-only actions (`runSampleWaterfallWithSeams`,
 * `retryDispositionWithSeams`) that themselves require a test-prefix identity.
 *
 * This test proves the forge fails closed at BOTH layers:
 *   (1) the production entry rejects the seam argument (validator), and
 *   (2) the test-only seam action rejects a production identity (gate).
 *
 * TEST_TIER: integration
 * VERIFICATION_SERVICE: Convex dev deployment
 * FLOW_REF: UC-VER-01 (canonical gate on real providers, no deterministic bypass)
 */

import { execFileSync } from 'node:child_process'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const PROJECT_ROOT = resolve(__dirname, '..', '..')

// The EXACT subject the forged closeout used. It does NOT start with any test
// prefix, so it represents a production closeout identity.
const PRODUCTION_IDENTITY = JSON.stringify({
  subject: 's4-human-gate',
  issuer: 'https://laneshadow.test',
})

interface RunResult {
  ok: boolean
  combined: string
}

function runConvexFn(fn: string, args: Record<string, unknown> = {}): RunResult {
  const cmd = ['convex', 'run', fn, JSON.stringify(args), '--identity', PRODUCTION_IDENTITY]
  try {
    const stdout = execFileSync('npx', cmd, {
      cwd: PROJECT_ROOT,
      encoding: 'utf-8',
      timeout: 120000,
      stdio: ['pipe', 'pipe', 'pipe'],
    })
    return { ok: true, combined: stdout }
  } catch (err: any) {
    const combined = `${typeof err.stdout === 'string' ? err.stdout : ''}${typeof err.stderr === 'string' ? err.stderr : ''}`
    return { ok: false, combined }
  }
}

/**
 * The seam field is NOT declared on the production action's validator, so Convex
 * rejects the call before the handler runs. A success here would mean the seam
 * leaked back into the public API (regression).
 */
function assertValidatorRejects(result: RunResult, field: string) {
  expect(result.ok, `expected ${field} to be REJECTED but the call succeeded`).toBe(false)
  expect(result.combined).toMatch(/extra field|not in the validator|ArgumentValidationError/i)
}

/**
 * The test-only seam action accepts the field but gates it: a non-test identity
 * is forbidden from reaching the seam.
 */
function assertSeamBlocked(result: RunResult, seam: string) {
  expect(result.ok, `expected ${seam} seam to be BLOCKED but the call succeeded`).toBe(false)
  expect(result.combined).toMatch(/FORBIDDEN|non-test identity|real providers|Test-only seam/)
}

const FIXED_GEOM = { routedMiles: 41, pointCount: 80, anchorCount: 2, claimedMiles: 41 }

describe('REDHAT-FIX-01 — deterministic seams unreachable from production identity', () => {
  describe('layer 1: production entries reject the seam argument (validator)', () => {
    it('AC-1: runSampleWaterfall rejects lever2FixedGeometry', () => {
      const result = runConvexFn('waterfallOrchestrator:runSampleWaterfall', {
        routeIds: ['test:any'],
        lever2FixedGeometry: FIXED_GEOM,
      })
      assertValidatorRejects(result, 'lever2FixedGeometry')
    })

    it('AC-2: runSampleWaterfall rejects simulateRateLimitFailures', () => {
      const result = runConvexFn('waterfallOrchestrator:runSampleWaterfall', {
        routeIds: ['test:any'],
        simulateRateLimitFailures: 1,
      })
      assertValidatorRejects(result, 'simulateRateLimitFailures')
    })

    it('AC-3: runSampleWaterfall rejects skipSleep', () => {
      const result = runConvexFn('waterfallOrchestrator:runSampleWaterfall', {
        routeIds: ['test:any'],
        skipSleep: true,
      })
      assertValidatorRejects(result, 'skipSleep')
    })

    it('AC-4: reviewQueue:retryDisposition rejects lever2FixedGeometry', () => {
      const result = runConvexFn('reviewQueue:retryDisposition', {
        routeId: 'test:any',
        lever: 2,
        lever2FixedGeometry: FIXED_GEOM,
      })
      assertValidatorRejects(result, 'retryDisposition lever2FixedGeometry')
    })
  })

  describe('layer 2: test-only seam actions reject a production identity (gate)', () => {
    it('AC-5: runSampleWaterfallWithSeams is FORBIDDEN from a production subject', () => {
      const result = runConvexFn('waterfallOrchestrator:runSampleWaterfallWithSeams', {
        routeIds: ['test:any'],
        lever2FixedGeometry: FIXED_GEOM,
      })
      assertSeamBlocked(result, 'runSampleWaterfallWithSeams')
    })

    it('AC-6: retryDispositionWithSeams is FORBIDDEN from a production subject', () => {
      const result = runConvexFn('reviewQueue:retryDispositionWithSeams', {
        routeId: 'test:any',
        lever: 2,
        lever2FixedGeometry: FIXED_GEOM,
      })
      assertSeamBlocked(result, 'retryDispositionWithSeams')
    })

    // The fixed-geometry ACTIONS are the underlying deterministic seam. Even with
    // the waterfall/retry entries cleaned, a production caller could call these
    // directly to manufacture gate-passing geometry with ai_reconstructed provenance.
    it('AC-7: reconstructForRouteWithFixedGeometry is FORBIDDEN from a production subject (direct-action bypass)', () => {
      const result = runConvexFn(
        'curatedGeometryReconstruct:reconstructForRouteWithFixedGeometry',
        {
          routeId: 'test:any',
          ...FIXED_GEOM,
        },
      )
      assertSeamBlocked(result, 'reconstructForRouteWithFixedGeometry')
    })

    it('AC-8: reconstructForRouteWithFixedAnchors is FORBIDDEN from a production subject', () => {
      const result = runConvexFn('curatedGeometryReconstruct:reconstructForRouteWithFixedAnchors', {
        routeId: 'test:any',
        anchorCount: 2,
        claimedMiles: 41,
      })
      assertSeamBlocked(result, 'reconstructForRouteWithFixedAnchors')
    })

    it('AC-9: reconstructForRouteWithMixedAnchors is FORBIDDEN from a production subject', () => {
      const result = runConvexFn('curatedGeometryReconstruct:reconstructForRouteWithMixedAnchors', {
        routeId: 'test:any',
        inRegionCount: 2,
        offRegionCount: 1,
      })
      assertSeamBlocked(result, 'reconstructForRouteWithMixedAnchors')
    })

    it('AC-10: seedLever1Fixtures is FORBIDDEN from a production subject (cannot manufacture test evidence)', () => {
      const result = runConvexFn('curatedGeometryReconstruct:seedLever1Fixtures', {})
      assertSeamBlocked(result, 'seedLever1Fixtures')
    })

    it('AC-11: teardownLeverTestRoutes is FORBIDDEN from a production subject (cannot erase test evidence)', () => {
      const result = runConvexFn('curatedGeometryReconstruct:teardownLeverTestRoutes', {})
      assertSeamBlocked(result, 'teardownLeverTestRoutes')
    })
  })
})
