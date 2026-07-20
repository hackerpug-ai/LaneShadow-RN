/**
 * REDHAT-FIX-01 [PRIMARY integration]: The deterministic Lever-2 test seam
 * (`lever2FixedGeometry`) and the other test-only seams (`simulateRateLimitFailures`,
 * `skipSleep`) MUST be unreachable from a production closeout identity.
 *
 * The forged 2026-07-19 gate closeout (`.gate-evidence/.../scripts/step1.sh`)
 * injected `lever2FixedGeometry` straight into `runSampleWaterfall` under the
 * subject `s4-human-gate`, bypassing real Lever-2 LLM reconstruction. This test
 * proves that exact forge now fails closed: a production subject cannot reach any
 * deterministic seam — the gate must exercise real providers.
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

/** Asserts the call was rejected by the test-seam gate (FORBIDDEN), not some other failure. */
function assertSeamBlocked(result: RunResult, seam: string) {
  expect(result.ok, `expected ${seam} seam to be BLOCKED but the call succeeded`).toBe(false)
  // The ConvexError carries code FORBIDDEN + a message naming the seam gate.
  expect(result.combined).toMatch(/FORBIDDEN|non-test identity|real providers|Test-only seam/)
}

describe('REDHAT-FIX-01 — deterministic seams unreachable from production identity', () => {
  it('AC-1: runSampleWaterfall rejects lever2FixedGeometry from a production subject', () => {
    const result = runConvexFn('waterfallOrchestrator:runSampleWaterfall', {
      routeIds: ['test:any'],
      lever2FixedGeometry: { routedMiles: 41, pointCount: 80, anchorCount: 2, claimedMiles: 41 },
    })
    assertSeamBlocked(result, 'lever2FixedGeometry')
  })

  it('AC-2: runSampleWaterfall rejects simulateRateLimitFailures from a production subject', () => {
    const result = runConvexFn('waterfallOrchestrator:runSampleWaterfall', {
      routeIds: ['test:any'],
      simulateRateLimitFailures: 1,
    })
    assertSeamBlocked(result, 'simulateRateLimitFailures')
  })

  it('AC-3: runSampleWaterfall rejects skipSleep from a production subject', () => {
    const result = runConvexFn('waterfallOrchestrator:runSampleWaterfall', {
      routeIds: ['test:any'],
      skipSleep: true,
    })
    assertSeamBlocked(result, 'skipSleep')
  })

  it('AC-4: reviewQueue:retryDisposition rejects lever2FixedGeometry from a production subject', () => {
    const result = runConvexFn('reviewQueue:retryDisposition', {
      routeId: 'test:any',
      lever: 2,
      lever2FixedGeometry: { routedMiles: 41, pointCount: 80, anchorCount: 2, claimedMiles: 41 },
    })
    assertSeamBlocked(result, 'retryDisposition lever2FixedGeometry')
  })

  // The fixed-geometry ACTIONS are the underlying deterministic seam. Even with
  // runSampleWaterfall gated, a production caller could call these directly to
  // manufacture gate-passing geometry with ai_reconstructed provenance.
  it('AC-5: reconstructForRouteWithFixedGeometry is FORBIDDEN from a production subject (direct-action bypass)', () => {
    const result = runConvexFn('curatedGeometryReconstruct:reconstructForRouteWithFixedGeometry', {
      routeId: 'test:any',
      routedMiles: 41,
      pointCount: 80,
      anchorCount: 2,
      claimedMiles: 41,
    })
    assertSeamBlocked(result, 'reconstructForRouteWithFixedGeometry')
  })

  it('AC-6: reconstructForRouteWithFixedAnchors is FORBIDDEN from a production subject', () => {
    const result = runConvexFn('curatedGeometryReconstruct:reconstructForRouteWithFixedAnchors', {
      routeId: 'test:any',
      anchorCount: 2,
      claimedMiles: 41,
    })
    assertSeamBlocked(result, 'reconstructForRouteWithFixedAnchors')
  })

  it('AC-7: reconstructForRouteWithMixedAnchors is FORBIDDEN from a production subject', () => {
    const result = runConvexFn('curatedGeometryReconstruct:reconstructForRouteWithMixedAnchors', {
      routeId: 'test:any',
      inRegionCount: 2,
      offRegionCount: 1,
    })
    assertSeamBlocked(result, 'reconstructForRouteWithMixedAnchors')
  })

  it('AC-8: seedLever1Fixtures is FORBIDDEN from a production subject (cannot manufacture test evidence)', () => {
    const result = runConvexFn('curatedGeometryReconstruct:seedLever1Fixtures', {})
    assertSeamBlocked(result, 'seedLever1Fixtures')
  })

  it('AC-9: teardownLeverTestRoutes is FORBIDDEN from a production subject (cannot erase test evidence)', () => {
    const result = runConvexFn('curatedGeometryReconstruct:teardownLeverTestRoutes', {})
    assertSeamBlocked(result, 'teardownLeverTestRoutes')
  })
})
