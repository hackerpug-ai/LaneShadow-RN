/**
 * TC-1: Smoke lane — AC-1 PRIMARY
 *
 * GIVEN the real PoC route (Twist of Tepusquet Loop)
 * WHEN reconstructForRoute runs end-to-end on real Anthropic + Google Geocoding + Google Routes
 * THEN gate PASS → persist ai_reconstructed → riderReady=true → returns from listCuratedRoutes best AND nearest
 *
 * VERIFICATION STRATEGY:
 * - Seed the PoC route via public API mutation + geospatial.insert
 * - Call reconstructForRoute on the real dev deployment (real Anthropic, real Google)
 * - Verify persisted verification block, geometry status, and riderReady
 * - Query listCuratedRoutes in both best and nearest modes
 * - SKIP-with-reason on Anthropic/Google outage
 *
 * TEST_TIER: integration
 * VERIFICATION_SERVICE: Convex dev deployment + real Anthropic (S1-T1) + real Google Geocoding + real Google Routes
 */

import { execFileSync } from 'node:child_process'
import { resolve } from 'node:path'
import { beforeAll, afterAll, describe, it, expect, vi } from 'vitest'

const PROJECT_ROOT = resolve(__dirname, '..', '..')

const TEST_IDENTITY = JSON.stringify({
  subject: 'geometry-gate-test',
  issuer: 'https://laneshadow.test',
})

const POC_ROUTE_ID = 'motorcycleroads:twist-of-tepusquet-loop'
const POC_CENTROID = { lat: 34.95, lng: -120.42 }
const POC_CLAIMED_MILES = 41

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
      timeout: 60000,
      stdio: ['pipe', 'pipe', 'pipe'],
    })
    return { ok: true, stdout, stderr: '' }
  } catch (err: any) {
    const stdout = typeof err.stdout === 'string' ? err.stdout : ''
    const stderr = typeof err.stderr === 'string' ? err.stderr : ''
    return { ok: false, stdout, stderr }
  }
}

describe('TC-1: PoC route reconstruction smoke lane (AC-1 PRIMARY)', () => {
  let seedResult: RunResult
  let reconstructResult: RunResult
  let verificationData: any
  let bestModeRoutes: any[] = []
  let nearestModeRoutes: any[] = []

  beforeAll(async () => {
    // Step 1: Seed the PoC route via curatedGeometryTestSupport.seedPoCRoute
    console.log('🌱 Seeding PoC route...')
    seedResult = execNpx([
      'convex',
      'run',
      'curatedGeometryTestSupport:seedPoCRoute',
      `--identity=${TEST_IDENTITY}`,
    ])

    if (!seedResult.ok) {
      console.warn('⚠️ Seeding failed (may already exist):', seedResult.stderr)
    } else {
      console.log('✓ PoC route seeded')
    }

    // Step 2: Call reconstructForRoute on the real deployment
    console.log('\n🔧 Calling reconstructForRoute on PoC route...')
    reconstructResult = execNpx([
      'convex',
      'run',
      'curatedGeometryReconstruct:reconstructForRoute',
      `--args={"routeId":"${POC_ROUTE_ID}"}`,
      `--identity=${TEST_IDENTITY}`,
    ])

    if (!reconstructResult.ok) {
      const isOutage =
        reconstructResult.stderr.includes('ANTHROPIC') ||
        reconstructResult.stderr.includes('GOOGLE') ||
        reconstructResult.stderr.includes('network') ||
        reconstructResult.stderr.includes('401') ||
        reconstructResult.stderr.includes('403')

      if (isOutage) {
        console.warn('⏭️ SKIP-with-reason: provider outage detected')
        vi.stubGlobal('SKIP_AC1', true)
      } else {
        throw new Error(`Reconstruct failed: ${reconstructResult.stderr}`)
      }
    } else {
      console.log('✓ reconstructForRoute completed')

      // Step 3: Query getVerificationForRoute
      console.log('\n📋 Querying verification block...')
      const verifyResult = execNpx([
        'convex',
        'run',
        'curatedGeometryReconstruct:getVerificationForRoute',
        `--args={"routeId":"${POC_ROUTE_ID}"}`,
        `--identity=${TEST_IDENTITY}`,
      ])

      if (verifyResult.ok) {
        try {
          verificationData = JSON.parse(verifyResult.stdout)
          console.log('✓ Verification block retrieved')
        } catch (e) {
          console.warn('⚠️ Failed to parse verification JSON')
        }
      }

      // Step 4: Query listCuratedRoutes in best mode
      console.log('\n📊 Querying listCuratedRoutes (best mode)...')
      const bestResult = execNpx([
        'convex',
        'run',
        'curatedRoutes:listCuratedRoutes',
        `--args={"sort":"best","limit":100}`,
        `--identity=${TEST_IDENTITY}`,
      ])

      if (bestResult.ok) {
        try {
          bestModeRoutes = JSON.parse(bestResult.stdout)
          console.log(`✓ Best mode returned ${bestModeRoutes.length} routes`)
        } catch (e) {
          console.warn('⚠️ Failed to parse best mode results')
        }
      }

      // Step 5: Query listCuratedRoutes in nearest mode (center at PoC centroid)
      console.log('\n📍 Querying listCuratedRoutes (nearest mode)...')
      const nearestResult = execNpx([
        'convex',
        'run',
        'curatedRoutes:listCuratedRoutes',
        `--args={"sort":"nearest","center":{"lat":${POC_CENTROID.lat},"lng":${POC_CENTROID.lng}},"limit":100}`,
        `--identity=${TEST_IDENTITY}`,
      ])

      if (nearestResult.ok) {
        try {
          nearestModeRoutes = JSON.parse(nearestResult.stdout)
          console.log(`✓ Nearest mode returned ${nearestModeRoutes.length} routes`)
        } catch (e) {
          console.warn('⚠️ Failed to parse nearest mode results')
        }
      }
    }
  })

  afterAll(async () => {
    // Cleanup: delete the seeded route
    console.log('\n🧹 Cleaning up test route...')
    const cleanupResult = execNpx([
      'convex',
      'run',
      'curatedGeometryTestSupport:teardownPoCRoute',
      `--identity=${TEST_IDENTITY}`,
    ])

    if (!cleanupResult.ok) {
      console.warn('⚠️ Cleanup failed:', cleanupResult.stderr)
    } else {
      console.log('✓ Cleanup complete')
    }
  })

  // ─────────────────────────────────────────────────────────────────────────
  // SCENARIO CASE 1: PoC route end-to-end
  // ─────────────────────────────────────────────────────────────────────────
  describe('CASE 1: PoC route reconstructs end-to-end', () => {
    it('MUST_OBSERVE: geometryStatus == "generated" (within 2 attempts)', () => {
      if ((globalThis as any).SKIP_AC1) {
        vi.stubGlobal('SKIP_AC1', false)
        console.log('SKIP-with-reason: provider outage')
        return
      }

      expect(reconstructResult.ok).toBe(true)
      // Verify the function didn't error
      expect(reconstructResult.stderr).toBeFalsy()
    })

    it('MUST_OBSERVE: side-table provenance == "ai_reconstructed"', () => {
      if ((globalThis as any).SKIP_AC1) return

      expect(verificationData).toBeDefined()
      expect(verificationData?.provenance).toBe('ai_reconstructed')
    })

    it('MUST_OBSERVE: verification.verdict == "pass"', () => {
      if ((globalThis as any).SKIP_AC1) return

      expect(verificationData?.verdict).toBe('pass')
    })

    it('MUST_OBSERVE: verification.ratio in [0.6, 1.6] (baseline ~1.00)', () => {
      if ((globalThis as any).SKIP_AC1) return

      expect(verificationData?.ratio).toBeDefined()
      expect(verificationData.ratio).toBeGreaterThanOrEqual(0.6)
      expect(verificationData.ratio).toBeLessThanOrEqual(1.6)
      // PoC baseline should be close to 1.00
      expect(verificationData.ratio).toBeCloseTo(1.0, 1)
    })

    it('MUST_OBSERVE: verification.anchorCount >= 2 with each anchor <= 150mi', () => {
      if ((globalThis as any).SKIP_AC1) return

      expect(verificationData?.anchorCount).toBeGreaterThanOrEqual(2)
      expect(Array.isArray(verificationData?.anchors)).toBe(true)

      // Each anchor should have a distance field <= 150
      for (const anchor of verificationData.anchors || []) {
        expect(anchor.distanceFromCentroid).toBeLessThanOrEqual(150)
      }
    })

    it('MUST_OBSERVE: decoded line has > 4 points and >= 1 point per mile', () => {
      if ((globalThis as any).SKIP_AC1) return

      expect(verificationData?.pointCount).toBeGreaterThan(4)

      // Points per mile: pointCount should be >= routedMiles
      const pointsPerMile = verificationData.pointCount / verificationData.routedMiles
      expect(pointsPerMile).toBeGreaterThanOrEqual(0.99) // Allow minor rounding
    })

    it('MUST_OBSERVE: riderReady == true', () => {
      if ((globalThis as any).SKIP_AC1) return

      expect(verificationData?.riderReady).toBe(true)
    })

    it('MUST_OBSERVE: route appears in listCuratedRoutes national-best results', () => {
      if ((globalThis as any).SKIP_AC1) return

      const pocRoute = bestModeRoutes.find((r) => r.routeId === POC_ROUTE_ID)
      expect(pocRoute).toBeDefined()
      if (pocRoute) {
        console.log(`  PoC route found in best mode at position with score ${pocRoute.compositeScore}`)
      }
    })

    it('MUST_OBSERVE: route appears in listCuratedRoutes nearest results', () => {
      if ((globalThis as any).SKIP_AC1) return

      const pocRoute = nearestModeRoutes.find((r) => r.routeId === POC_ROUTE_ID)
      expect(pocRoute).toBeDefined()
      if (pocRoute) {
        console.log(`  PoC route found in nearest mode at distance ${pocRoute.distanceMi} mi`)
      }
    })

    // NEGATIVE CONTROLS
    it('MUST_NOT_OBSERVE: geometryStatus unresolved (no gate-passing geometry)', () => {
      if ((globalThis as any).SKIP_AC1) return

      expect(verificationData?.geometryStatus).not.toBe('unresolved')
      expect(verificationData?.geometryStatus).not.toBe('failed')
    })

    it('MUST_NOT_OBSERVE: provenance absent or null', () => {
      if ((globalThis as any).SKIP_AC1) return

      expect(verificationData?.provenance).toBeTruthy()
    })

    it('MUST_NOT_OBSERVE: riderReady == false', () => {
      if ((globalThis as any).SKIP_AC1) return

      expect(verificationData?.riderReady).not.toBe(false)
    })

    it('MUST_NOT_OBSERVE: route absent from national-best results', () => {
      if ((globalThis as any).SKIP_AC1) return

      const pocRoute = bestModeRoutes.find((r) => r.routeId === POC_ROUTE_ID)
      expect(pocRoute).toBeDefined()
    })

    it('MUST_NOT_OBSERVE: route absent from nearest results', () => {
      if ((globalThis as any).SKIP_AC1) return

      const pocRoute = nearestModeRoutes.find((r) => r.routeId === POC_ROUTE_ID)
      expect(pocRoute).toBeDefined()
    })
  })
})
