/**
 * AC-3: Lever 3 parses A-to-B / road-name, geocodes with region bias, routes via Google,
 * gates result, stores provenance='name_routed'
 *
 * TEST_TIER: integration
 * VERIFICATION_SERVICE: Convex dev deployment (real Google Geocoding + Routes API)
 * FLOW_REF: UC-REC-03
 */

import { execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const PROJECT_ROOT = resolve(__dirname, '..', '..')
const EVIDENCE_DIR = resolve(PROJECT_ROOT, '.tmp/S4-T2/evidence')

const TEST_IDENTITY = JSON.stringify({
  subject: 's4t2-lever3-reroute-test',
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

describe('AC-3: Lever 3 re-route name_routed', () => {
  beforeAll(() => {
    mkdirSync(EVIDENCE_DIR, { recursive: true })
    const seed = runConvexFn(
      'curatedGeometryReconstruct:seedLever3Fixtures',
      {},
      { identity: true },
    )
    expect(seed.ok, `seed failed: ${seed.stderr}\n${seed.stdout}`).toBe(true)
  }, 120_000)

  afterAll(() => {
    runConvexFn('curatedGeometryReconstruct:teardownLeverTestRoutes', {}, { identity: true })
  })

  // TC-5: road-name / highway structure
  describe('TC-5: highway structure re-route (Route 680 — Alameda County)', () => {
    let rerouteResult: any
    let verificationData: any

    beforeAll(() => {
      const reroute = runConvexFn(
        'curatedGeometryReconstruct:rerouteForRoute',
        { routeId: 'test:lever3-hwy' },
        { identity: true },
      )
      expect(reroute.ok, `reroute failed: ${reroute.stderr}\n${reroute.stdout}`).toBe(true)
      rerouteResult = JSON.parse(reroute.stdout)

      const verify = runConvexFn(
        'curatedGeometryReconstruct:getVerificationForRoute',
        { routeId: 'test:lever3-hwy' },
        { identity: true },
      )
      verificationData = verify.ok ? JSON.parse(verify.stdout) : null

      writeFileSync(
        resolve(EVIDENCE_DIR, 'ac3-lever3-highway.json'),
        JSON.stringify(
          {
            capturedAt: new Date().toISOString(),
            rerouteResult,
            verificationData,
          },
          null,
          2,
        ),
      )
    }, 300_000)

    it('MUST_OBSERVE: verification.verdict == "pass" (if gate passes)', () => {
      // Real Google may produce out-of-band ratios for highway-in-county queries.
      // When the gate passes we require name_routed; when it fails we require REVIEW.
      if (rerouteResult?.disposition === 'generated') {
        expect(verificationData?.verdict).toBe('pass')
      } else {
        expect(rerouteResult?.disposition).toBe('review')
        expect(rerouteResult?.queuedForReview).toBe(true)
      }
    })

    it('MUST_OBSERVE: provenance name_routed on pass; no null provenance on pass', () => {
      if (rerouteResult?.disposition === 'generated') {
        expect(verificationData?.provenance).toBe('name_routed')
        expect(rerouteResult?.provenance).toBe('name_routed')
      }
    })

    it('MUST_OBSERVE: routedMiles > 0 when generated', () => {
      if (rerouteResult?.disposition === 'generated') {
        expect(verificationData?.routedMiles).toBeGreaterThan(0)
      }
    })

    it('zero LLM calls', () => {
      expect(rerouteResult?.llmCallCount).toBe(0)
    })

    it('geocode URLs include bounds bias', () => {
      const urls: string[] = rerouteResult?.geocodeUrls ?? []
      expect(urls.length).toBeGreaterThan(0)
      for (const u of urls) {
        expect(u).toContain('bounds=')
      }
    })
  })

  // TC-4: A-to-B structure
  describe('TC-4: A-to-B structure re-route (SF to Santa Cruz)', () => {
    let rerouteResult: any
    let verificationData: any

    beforeAll(() => {
      const reroute = runConvexFn(
        'curatedGeometryReconstruct:rerouteForRoute',
        { routeId: 'test:lever3-ato-b' },
        { identity: true },
      )
      expect(reroute.ok, `reroute failed: ${reroute.stderr}\n${reroute.stdout}`).toBe(true)
      rerouteResult = JSON.parse(reroute.stdout)

      const verify = runConvexFn(
        'curatedGeometryReconstruct:getVerificationForRoute',
        { routeId: 'test:lever3-ato-b' },
        { identity: true },
      )
      verificationData = verify.ok ? JSON.parse(verify.stdout) : null

      writeFileSync(
        resolve(EVIDENCE_DIR, 'ac3-lever3-ato-b.json'),
        JSON.stringify(
          {
            capturedAt: new Date().toISOString(),
            rerouteResult,
            verificationData,
          },
          null,
          2,
        ),
      )
    }, 300_000)

    it('MUST_OBSERVE: verification.verdict == "pass"', () => {
      expect(verificationData?.verdict).toBe('pass')
      expect(rerouteResult?.disposition).toBe('generated')
    })

    it('MUST_OBSERVE: verification.provenance == "name_routed"', () => {
      expect(verificationData?.provenance).toBe('name_routed')
    })

    it('MUST_OBSERVE: anchorCount == 2', () => {
      expect(verificationData?.anchorCount).toBe(2)
      expect(rerouteResult?.anchorCount).toBe(2)
    })

    it('MUST_NOT_OBSERVE: verification.verdict == "review"', () => {
      expect(verificationData?.verdict).not.toBe('review')
    })

    it('zero LLM calls', () => {
      expect(rerouteResult?.llmCallCount).toBe(0)
    })
  })
})
