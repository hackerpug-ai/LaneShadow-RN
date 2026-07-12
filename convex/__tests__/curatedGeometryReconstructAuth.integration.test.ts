/**
 * REDHAT-FIX-005 / H5: reconstruct + verification surfaces require Clerk identity.
 *
 * TEST_TIER: integration
 * VERIFICATION_SERVICE: Convex dev deployment (CONVEX_DEPLOYMENT=dev:quirky-panther-164)
 */

import { execFileSync } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { beforeAll, describe, expect, it } from 'vitest'

const PROJECT_ROOT = resolve(__dirname, '..', '..')
const EVIDENCE_DIR = resolve(PROJECT_ROOT, '.tmp', 'REDHAT-FIX-005')

const TEST_IDENTITY = JSON.stringify({
  subject: 'redhat-fix-005-auth-test',
  issuer: 'https://laneshadow.test',
})

const POC_ROUTE_ID = 'motorcycleroads:twist-of-tepusquet-loop'

interface RunResult {
  ok: boolean
  stdout: string
  stderr: string
  combined: string
}

function execNpx(cmd: string[]): RunResult {
  try {
    const stdout = execFileSync('npx', cmd, {
      cwd: PROJECT_ROOT,
      encoding: 'utf-8',
      timeout: 120_000,
      stdio: ['pipe', 'pipe', 'pipe'],
      env: {
        ...process.env,
        CONVEX_DEPLOYMENT: process.env.CONVEX_DEPLOYMENT ?? 'dev:quirky-panther-164',
      },
    })
    return { ok: true, stdout, stderr: '', combined: stdout }
  } catch (err: any) {
    const stdout = typeof err.stdout === 'string' ? err.stdout : ''
    const stderr = typeof err.stderr === 'string' ? err.stderr : ''
    return { ok: false, stdout, stderr, combined: `${stdout}\n${stderr}` }
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

/** Lightweight public read — proves deployment is reachable (no --inline-query in this CLI). */
const DEV_PROBE = runConvexFn('curatedGeometryReconstruct:getRouteForReading', {
  routeId: '__redhat-fix-005-probe__',
})
const DEV_REACHABLE = DEV_PROBE.ok

function captureEvidence(name: string, res: RunResult) {
  mkdirSync(EVIDENCE_DIR, { recursive: true })
  writeFileSync(resolve(EVIDENCE_DIR, `${name}.log`), res.combined, 'utf-8')
}

describe.skipIf(!DEV_REACHABLE)(
  'REDHAT-FIX-005: curatedGeometryReconstruct auth (live Convex dev)',
  () => {
    beforeAll(() => {
      runConvexFn('curatedGeometryTestSupport:seedDegenerateRows', {}, { identity: true })
    })

    it('unauthenticated reconstruct: reconstructForRoute fails closed (AC-1)', () => {
      const res = runConvexFn(
        'curatedGeometryReconstruct:reconstructForRoute',
        { routeId: POC_ROUTE_ID },
        { identity: false },
      )
      captureEvidence('ac1-unauthenticated-reconstruct', res)

      expect(res.ok, 'unauthenticated reconstruct must not succeed').toBe(false)
      expect(res.combined).toContain('UNAUTHENTICATED')
      expect(res.combined).not.toMatch(/"geometryStatus"\s*:\s*"generated"/)
    })

    it('unauthenticated verification: getVerificationForRoute fails closed (AC-2)', () => {
      const res = runConvexFn(
        'curatedGeometryReconstruct:getVerificationForRoute',
        { routeId: POC_ROUTE_ID },
        { identity: false },
      )
      captureEvidence('ac2-unauthenticated-verification', res)

      expect(res.ok, 'unauthenticated verification must not succeed').toBe(false)
      expect(res.combined).toContain('UNAUTHENTICATED')
      expect(res.combined).not.toMatch(/"verdict"\s*:\s*"(pass|review)"/)
    })

    it('authenticated: reconstructForRouteWithFixedGeometry returns geometryStatus (AC-3)', () => {
      const res = runConvexFn(
        'curatedGeometryReconstruct:reconstructForRouteWithFixedGeometry',
        { routeId: 'test:degenerate-2pt', pointCount: 2, routedMiles: 40 },
        { identity: true },
      )
      captureEvidence('ac3-authenticated-fixed-geometry', res)

      expect(res.ok, `authenticated reconstruct failed: ${res.combined}`).toBe(true)
      const payload = JSON.parse(res.stdout)
      expect(payload.geometryStatus).toBe('review')
      expect(res.combined).not.toContain('UNAUTHENTICATED')
    }, 120_000)
  },
)

describe('REDHAT-FIX-005: requireIdentity on public surfaces (AC-4)', () => {
  const srcPath = resolve(__dirname, '..', 'curatedGeometryReconstruct.ts')
  const src = readFileSync(srcPath, 'utf-8')

  const gatedExports = [
    'reconstructForRoute',
    'reconstructForRouteWithFixedGeometry',
    'reconstructForRouteWithFixedAnchors',
    'reconstructForRouteWithMixedAnchors',
    'getVerificationForRoute',
  ] as const

  it('requireIdentity appears in curatedGeometryReconstruct public wrappers', () => {
    expect(src).toMatch(/requireIdentity/)
    for (const name of gatedExports) {
      const block = src.match(
        new RegExp(
          `export const ${name} = (?:action|query)\\([\\s\\S]*?handler:[\\s\\S]*?\\n\\}\\)`,
        ),
      )
      expect(block, `handler block for ${name}`).not.toBeNull()
      expect(block![0], `${name} must call requireIdentity`).toMatch(
        /await\s+requireIdentity\s*\(\s*ctx\s*\)/,
      )
    }
    captureEvidence('ac4-source-requireIdentity', {
      ok: true,
      stdout: gatedExports.map((n) => `${n}: gated`).join('\n'),
      stderr: '',
      combined: src,
    })
  })
})

describe('REDHAT-FIX-005: environment', () => {
  it('devReachabilityIsReported', () => {
    if (!DEV_REACHABLE) {
      expect(DEV_PROBE.combined).toMatch(/MissingAccessToken|401|Unauthorized|Cannot|error/i)
    } else {
      expect(DEV_REACHABLE).toBe(true)
    }
  })
})
