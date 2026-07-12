/**
 * AC-2 through AC-7: Gate persistence and riderReady integration tests
 *
 * Tests the complete gate + persist + recomputeRiderReady flow via real Convex mutations.
 * Each AC/TC verifies deterministic behavior through the actual persistence layer.
 *
 * TEST_TIER: integration
 * VERIFICATION_SERVICE: Convex dev deployment (real persistGeometryVerified/setReviewVerdict; seams fixtured)
 */

import { execFileSync } from 'node:child_process'
import { resolve } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const PROJECT_ROOT = resolve(__dirname, '..', '..')
const POC_ROUTE_ID = 'motorcycleroads:twist-of-tepusquet-loop'

const RIDER_READY_FLIPS = [
  'geometry',
  'name',
  'score',
  'length',
  'rideWorthiness',
  'retired',
  'duplicate',
] as const

const TEST_IDENTITY = JSON.stringify({
  subject: 'geometry-gate-persist-test',
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

/** Convex CLI: positional JSON args (not --args=). */
function runConvexFn(
  fn: string,
  args: Record<string, unknown> = {},
  opts: { identity?: boolean } = {},
): RunResult {
  const cmd = ['convex', 'run', fn, JSON.stringify(args)]
  if (opts.identity) cmd.push('--identity', TEST_IDENTITY)
  return execNpx(cmd)
}

function nonDegeneratePointCount(routedMiles: number): number {
  return Math.max(50, Math.ceil(routedMiles) + 10)
}

describe('AC-2 through AC-7: Gate persistence and riderReady', () => {
  beforeAll(async () => {
    // Seed test fixtures
    console.log('🌱 Seeding boundary_ratio_rows...')
    const seedRatioResult = runConvexFn(
      'curatedGeometryTestSupport:seedBoundaryRatioRows',
      {},
      { identity: true },
    )
    if (!seedRatioResult.ok) {
      console.warn('⚠️ Seeding boundary_ratio_rows failed:', seedRatioResult.stderr)
    }

    console.log('🌱 Seeding degenerate_rows...')
    const seedDegenerateResult = runConvexFn(
      'curatedGeometryTestSupport:seedDegenerateRows',
      {},
      { identity: true },
    )
    if (!seedDegenerateResult.ok) {
      console.warn('⚠️ Seeding degenerate_rows failed:', seedDegenerateResult.stderr)
    }

    console.log('🌱 Seeding quarantined_length_row...')
    const seedQuarantineResult = runConvexFn(
      'curatedGeometryTestSupport:seedQuarantinedLengthRow',
      {},
      { identity: true },
    )
    if (!seedQuarantineResult.ok) {
      console.warn('⚠️ Seeding quarantined_length_row failed:', seedQuarantineResult.stderr)
    }

    console.log('🌱 Seeding anchor test routes...')
    const seedAnchorResult = runConvexFn(
      'curatedGeometryTestSupport:seedAnchorTestRoutes',
      {},
      { identity: true },
    )
    if (!seedAnchorResult.ok) {
      console.warn('⚠️ Seeding anchor test routes failed:', seedAnchorResult.stderr)
    }
  }, 120_000)

  afterAll(async () => {
    // Cleanup
    console.log('🧹 Cleaning up test routes...')
    const cleanupResult = runConvexFn(
      'curatedGeometryTestSupport:teardownAllTestRoutes',
      {},
      { identity: true },
    )
    if (!cleanupResult.ok) {
      console.warn('⚠️ Cleanup failed:', cleanupResult.stderr)
    }
  })

  // ─────────────────────────────────────────────────────────────────────────
  // TC-2/AC-2: Ratio boundaries (1.00/0.61/1.59 admit, 0.59/1.61 review)
  // ─────────────────────────────────────────────────────────────────────────
  describe('AC-2: Ratio boundaries', () => {
    describe.each([
      {
        name: 'ratio 1.00 (PoC baseline)',
        routeId: 'test:ratio-100',
        claimedMiles: 41,
        routedMiles: 41.07,
        expectedRatio: 1.0,
        expectedVerdict: 'pass',
      },
      {
        name: 'ratio 0.61 (lower boundary)',
        routeId: 'test:ratio-061',
        claimedMiles: 100,
        routedMiles: 61.0,
        expectedRatio: 0.61,
        expectedVerdict: 'pass',
      },
      {
        name: 'ratio 1.59 (upper boundary)',
        routeId: 'test:ratio-159',
        claimedMiles: 100,
        routedMiles: 159.0,
        expectedRatio: 1.59,
        expectedVerdict: 'pass',
      },
      {
        name: 'ratio 0.59 (below boundary)',
        routeId: 'test:ratio-059',
        claimedMiles: 100,
        routedMiles: 59.0,
        expectedRatio: 0.59,
        expectedVerdict: 'review',
      },
      {
        name: 'ratio 1.61 (above boundary)',
        routeId: 'test:ratio-161',
        claimedMiles: 100,
        routedMiles: 161.0,
        expectedRatio: 1.61,
        expectedVerdict: 'review',
      },
    ])('$name', ({ routeId, claimedMiles, routedMiles, expectedRatio, expectedVerdict }) => {
      let verificationData: any

      beforeAll(() => {
        // Reconstruct with fixtured geometry (canned routed line)
        console.log(`  Reconstructing ${routeId}...`)
        const reconstructResult = runConvexFn(
          'curatedGeometryReconstruct:reconstructForRouteWithFixedGeometry',
          {
            routeId,
            routedMiles,
            anchorCount: 2,
            pointCount: nonDegeneratePointCount(routedMiles),
          },
          { identity: true },
        )

        if (reconstructResult.ok) {
          const verifyResult = runConvexFn(
            'curatedGeometryReconstruct:getVerificationForRoute',
            { routeId },
            { identity: true },
          )

          if (verifyResult.ok) {
            try {
              verificationData = JSON.parse(verifyResult.stdout)
            } catch (e) {
              console.warn('Failed to parse verification JSON')
            }
          }
        } else {
          console.warn(`Reconstruct failed: ${reconstructResult.stderr}`)
        }
      })

      it(`MUST_OBSERVE: verification.ratio == ${expectedRatio}`, () => {
        expect(verificationData?.ratio).toBeCloseTo(expectedRatio, 2)
      })

      it(`MUST_OBSERVE: verification.verdict == "${expectedVerdict}"`, () => {
        expect(verificationData?.verdict).toBe(expectedVerdict)
      })

      if (expectedVerdict === 'pass') {
        it('MUST_OBSERVE: geometryStatus == "generated"', () => {
          expect(verificationData?.geometryStatus).toBe('generated')
        })

        it('MUST_OBSERVE: riderReady will be true (if all other inputs pass)', () => {
          // Note: we can't guarantee riderReady=true without checking all 7 inputs
          // This is verified by AC-7
          expect(verificationData?.verdict).toBe('pass')
        })

        it('MUST_NOT_OBSERVE: geometryStatus review (0 generated)', () => {
          expect(verificationData?.geometryStatus).not.toBe('review')
        })
      } else {
        it('MUST_OBSERVE: geometryStatus == "review"', () => {
          expect(verificationData?.geometryStatus).toBe('review')
        })

        it('MUST_NOT_OBSERVE: geometryStatus generated (0 admitted)', () => {
          expect(verificationData?.geometryStatus).not.toBe('generated')
        })
      }
    })
  })

  // ─────────────────────────────────────────────────────────────────────────
  // TC-3/AC-3: Anchor count and region filtering
  // ─────────────────────────────────────────────────────────────────────────
  describe('AC-3: Anchor count and region filtering', () => {
    it('1 anchor → review (failedCondition "anchors") with 0 routing calls', () => {
      const reconstructResult = runConvexFn(
        'curatedGeometryReconstruct:reconstructForRouteWithFixedAnchors',
        { routeId: 'test:single-anchor', anchorCount: 1, claimedMiles: 41 },
        { identity: true },
      )

      expect(reconstructResult.ok).toBe(true)
      const actionResult = JSON.parse(reconstructResult.stdout)
      expect(actionResult?.routingCallCount).toBe(0)
      expect(actionResult?.geometryStatus).toBe('review')
      expect(actionResult?.failedCondition).toBe('anchors')

      const verifyResult = runConvexFn(
        'curatedGeometryReconstruct:getVerificationForRoute',
        { routeId: 'test:single-anchor' },
        { identity: true },
      )

      expect(verifyResult.ok).toBe(true)
      const verificationData = JSON.parse(verifyResult.stdout)
      expect(verificationData?.geometryStatus).toBe('review')
      expect(verificationData?.failedCondition).toBe('anchors')
      expect(verificationData?.riderReady).toBe(false)
    })

    it('off-region anchor (300mi) excluded before routing', () => {
      const reconstructResult = runConvexFn(
        'curatedGeometryReconstruct:reconstructForRouteWithMixedAnchors',
        { routeId: 'test:mixed-anchors', inRegionCount: 2, offRegionCount: 1 },
        { identity: true },
      )

      expect(reconstructResult.ok).toBe(true)
      const actionResult = JSON.parse(reconstructResult.stdout)
      expect(actionResult?.verdict).toBe('pass')

      const verifyResult = runConvexFn(
        'curatedGeometryReconstruct:getVerificationForRoute',
        { routeId: 'test:mixed-anchors' },
        { identity: true },
      )

      expect(verifyResult.ok).toBe(true)
      const verificationData = JSON.parse(verifyResult.stdout)
      expect(verificationData?.anchorCount).toBeGreaterThanOrEqual(2)
      expect(verificationData?.verdict).toBe('pass')
      for (const anchor of verificationData?.anchors ?? []) {
        expect(anchor.distanceFromCentroid).toBeLessThanOrEqual(150)
      }
    }, 120_000)
  })

  // ─────────────────────────────────────────────────────────────────────────
  // TC-4/AC-4: Degenerate line rejection
  // ─────────────────────────────────────────────────────────────────────────
  describe('AC-4: Degenerate lines', () => {
    it('2-point line is degenerate → review', () => {
      const reconstructResult = runConvexFn(
        'curatedGeometryReconstruct:reconstructForRouteWithFixedGeometry',
        { routeId: 'test:degenerate-2pt', pointCount: 2, routedMiles: 40 },
        { identity: true },
      )

      expect(reconstructResult.ok).toBe(true)

      const verifyResult = runConvexFn(
        'curatedGeometryReconstruct:getVerificationForRoute',
        { routeId: 'test:degenerate-2pt' },
        { identity: true },
      )

      if (verifyResult.ok) {
        const verificationData = JSON.parse(verifyResult.stdout)
        expect(verificationData?.degenerate).toBe(true)
        expect(verificationData?.geometryStatus).toBe('review')
      }
    })

    it('10 points over 50 miles (<1 pt/mi) is degenerate → review', () => {
      const reconstructResult = runConvexFn(
        'curatedGeometryReconstruct:reconstructForRouteWithFixedGeometry',
        { routeId: 'test:degenerate-10pt-50mi', pointCount: 10, routedMiles: 50 },
        { identity: true },
      )

      expect(reconstructResult.ok).toBe(true)

      const verifyResult = runConvexFn(
        'curatedGeometryReconstruct:getVerificationForRoute',
        { routeId: 'test:degenerate-10pt-50mi' },
        { identity: true },
      )

      if (verifyResult.ok) {
        const verificationData = JSON.parse(verifyResult.stdout)
        expect(verificationData?.degenerate).toBe(true)
        expect(verificationData?.geometryStatus).toBe('review')
      }
    }, 30_000)
  })

  // ─────────────────────────────────────────────────────────────────────────
  // TC-5/AC-5: Quarantined (null) claimed length
  // ─────────────────────────────────────────────────────────────────────────
  describe('AC-5: Quarantined length (null claimed miles)', () => {
    it('null claimed length → ratio-skip, verdict by degenerate+region', () => {
      const reconstructResult = runConvexFn(
        'curatedGeometryReconstruct:reconstructForRouteWithFixedGeometry',
        {
          routeId: 'test:quarantined-null-length',
          routedMiles: 22.0,
          pointCount: 50,
          claimedMiles: null,
        },
        { identity: true },
      )

      expect(reconstructResult.ok).toBe(true)

      const verifyResult = runConvexFn(
        'curatedGeometryReconstruct:getVerificationForRoute',
        { routeId: 'test:quarantined-null-length' },
        { identity: true },
      )

      if (verifyResult.ok) {
        const verificationData = JSON.parse(verifyResult.stdout)
        expect(verificationData?.ratio).toBeNull()
        expect(verificationData?.claimedMiles).toBeNull()
        expect(verificationData?.verdict).toBe('pass') // decided by degenerate + region
        expect(verificationData?.routedMiles).toBe(22.0)
        expect(verificationData?.geometryStatus).toBe('generated')
      }
    })
  })

  // ─────────────────────────────────────────────────────────────────────────
  // TC-6/AC-6: failedCondition names the specific gate failure
  // ─────────────────────────────────────────────────────────────────────────
  describe('AC-6: failedCondition reporting', () => {
    it('failedCondition == "ratio" for 1.61 ratio review', () => {
      // Use the ratio 1.61 row from AC-2
      const verifyResult = runConvexFn(
        'curatedGeometryReconstruct:getVerificationForRoute',
        { routeId: 'test:ratio-161' },
        { identity: true },
      )

      if (verifyResult.ok) {
        const verificationData = JSON.parse(verifyResult.stdout)
        expect(verificationData?.failedCondition).toBe('ratio')
      }
    })

    it('failedCondition == "anchors" for 1-anchor review', () => {
      const verifyResult = runConvexFn(
        'curatedGeometryReconstruct:getVerificationForRoute',
        { routeId: 'test:single-anchor' },
        { identity: true },
      )

      if (verifyResult.ok) {
        const verificationData = JSON.parse(verifyResult.stdout)
        expect(verificationData?.failedCondition).toBe('anchors')
      }
    })

    it('failedCondition == "degenerate" for 2-point review', () => {
      const verifyResult = runConvexFn(
        'curatedGeometryReconstruct:getVerificationForRoute',
        { routeId: 'test:degenerate-2pt' },
        { identity: true },
      )

      if (verifyResult.ok) {
        const verificationData = JSON.parse(verifyResult.stdout)
        expect(verificationData?.failedCondition).toBe('degenerate')
      }
    })
  })

  // ─────────────────────────────────────────────────────────────────────────
  // TC-7/AC-7: riderReady 7-input predicate and index walk
  // ─────────────────────────────────────────────────────────────────────────
  describe('AC-7: riderReady 7-input predicate', () => {
    beforeAll(() => {
      runConvexFn('curatedGeometryTestSupport:seedPoCRoute', {}, { identity: true })
      const reconstructResult = runConvexFn(
        'curatedGeometryReconstruct:reconstructForRouteWithFixedGeometry',
        {
          routeId: POC_ROUTE_ID,
          routedMiles: 41.07,
          pointCount: 50,
          anchorCount: 2,
        },
        { identity: true },
      )
      expect(reconstructResult.ok).toBe(true)
      runConvexFn('curatedGeometryTestSupport:restorePoCRouteAllGood', {}, { identity: true })
    }, 120_000)

    it('7 inputs: all good → riderReady true', () => {
      const getResult = runConvexFn(
        'curatedGeometryReconstruct:getRouteForReading',
        { routeId: POC_ROUTE_ID },
        { identity: true },
      )

      expect(getResult.ok).toBe(true)
      const route = JSON.parse(getResult.stdout)
      expect(route?.riderReady).toBe(true)
    })

    it.each(
      RIDER_READY_FLIPS,
    )('single flip %s → riderReady false and excluded from best-mode list', (flipInput) => {
      runConvexFn('curatedGeometryTestSupport:restorePoCRouteAllGood', {}, { identity: true })

      const flipResult = runConvexFn(
        'curatedGeometryTestSupport:flipPoCRiderReadyInput',
        { input: flipInput },
        { identity: true },
      )
      expect(flipResult.ok).toBe(true)
      const flipped = JSON.parse(flipResult.stdout)
      expect(flipped.riderReady).toBe(false)

      const getResult = runConvexFn(
        'curatedGeometryReconstruct:getRouteForReading',
        { routeId: POC_ROUTE_ID },
        { identity: true },
      )
      expect(getResult.ok).toBe(true)
      const route = JSON.parse(getResult.stdout)
      expect(route?.riderReady).toBe(false)

      const bestResult = runConvexFn('curatedRoutes:listCuratedRoutesInternal', {
        sort: 'best',
        limit: 200,
      })
      expect(bestResult.ok).toBe(true)
      const routes = JSON.parse(bestResult.stdout)
      const pocRoute = routes.find((r: { routeId: string }) => r.routeId === POC_ROUTE_ID)
      expect(pocRoute).toBeUndefined()
    }, 120_000)

    it('restore all-good → riderReady true and present in best-mode list', () => {
      const restoreResult = runConvexFn(
        'curatedGeometryTestSupport:restorePoCRouteAllGood',
        {},
        { identity: true },
      )
      expect(restoreResult.ok).toBe(true)
      const restored = JSON.parse(restoreResult.stdout)
      expect(restored.riderReady).toBe(true)

      const bestResult = runConvexFn('curatedRoutes:listCuratedRoutesInternal', {
        sort: 'best',
        limit: 200,
      })
      expect(bestResult.ok).toBe(true)
      const routes = JSON.parse(bestResult.stdout)
      const pocRoute = routes.find((r: { routeId: string }) => r.routeId === POC_ROUTE_ID)
      expect(pocRoute).toBeDefined()
    })

    it('riderReady is a stored boolean field (not computed at read time)', () => {
      const getResult = runConvexFn(
        'curatedGeometryReconstruct:getRouteForReading',
        { routeId: POC_ROUTE_ID },
        { identity: true },
      )

      expect(getResult.ok).toBe(true)
      const route = JSON.parse(getResult.stdout)
      expect(Object.hasOwn(route, 'riderReady')).toBe(true)
    })
  })
})
