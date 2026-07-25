/**
 * AC-3: Retired routes excluded from discovery; detail preserved with reason.
 *
 * TEST_TIER: integration
 * VERIFICATION_SERVICE: Convex dev deployment
 * FLOW_REF: CAP-GEO-04 / T-REC-015
 * start_ref: s5t2-retired-route-surface
 */

import { execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const PROJECT_ROOT = resolve(__dirname, '..', '..')
const EVIDENCE_DIR = resolve(PROJECT_ROOT, '.tmp/S5-T2/evidence')

const TEST_IDENTITY = JSON.stringify({
  subject: 's4t5-s5t2-surface',
  issuer: 'https://laneshadow.test',
})

const SURFACE_ID = 'test:s5t2-retired-surface'

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

describe('AC-3: retired route excluded from suggestions; detail preserved', () => {
  let evidence: any
  let detail: any
  let topList: any
  let nearestList: any
  let bboxList: any

  beforeAll(() => {
    mkdirSync(EVIDENCE_DIR, { recursive: true })

    const setup = runConvexFn(
      'testSupport:devSetupFounderUser',
      { clerkUserId: 's4t5-s5t2-surface', role: 'operator' },
      { identity: true },
    )
    expect(setup.ok, `devSetupFounderUser failed: ${setup.stderr}`).toBe(true)

    const seed = runConvexFn(
      'curatedGeometry:seedS5T2RetirementFixtures',
      {
        scenario: 'retired-route-surface',
        allFailedRouteId: SURFACE_ID,
      },
      { identity: true },
    )
    expect(seed.ok, `seed failed: ${seed.stderr}\n${seed.stdout}`).toBe(true)

    const retire = runConvexFn(
      'curatedGeometry:retireRoute',
      {
        routeId: SURFACE_ID,
        confirmed: true,
        reason: 'all levers failed after founder review',
      },
      { identity: true },
    )
    expect(retire.ok, `retire failed: ${retire.stderr}\n${retire.stdout}`).toBe(true)

    const recompute = runConvexFn(
      'curatedGeometry:recomputeRiderReadyPublic',
      { routeId: SURFACE_ID },
      { identity: true },
    )
    expect(recompute.ok, `recompute failed: ${recompute.stderr}\n${recompute.stdout}`).toBe(true)

    const snap = runConvexFn(
      'curatedGeometry:getRetirementEvidence',
      { routeId: SURFACE_ID },
      { identity: true },
    )
    evidence = parseJson(snap.stdout)

    const det = runConvexFn(
      'curatedRoutes:getCuratedRouteDetail',
      { routeId: SURFACE_ID },
      { identity: true },
    )
    expect(det.ok, `detail failed: ${det.stderr}\n${det.stdout}`).toBe(true)
    detail = parseJson(det.stdout)

    const top = runConvexFn(
      'curatedRoutes:listCuratedRoutes',
      { sort: 'best', limit: 100 },
      { identity: true },
    )
    topList = parseJson(top.stdout) ?? []

    const nearest = runConvexFn(
      'curatedRoutes:listCuratedRoutes',
      {
        sort: 'nearest',
        center: { lat: 34.95, lng: -120.42 },
        limit: 50,
      },
      { identity: true },
    )
    nearestList = parseJson(nearest.stdout) ?? []

    const bbox = runConvexFn(
      'curatedRoutes:listCuratedRoutes',
      {
        bbox: {
          north: 36,
          south: 33,
          east: -119,
          west: -122,
        },
        limit: 50,
      },
      { identity: true },
    )
    bboxList = parseJson(bbox.stdout) ?? []

    writeFileSync(
      resolve(EVIDENCE_DIR, 'AC-3-surface.json'),
      JSON.stringify(
        {
          capturedAt: new Date().toISOString(),
          evidence,
          detail,
          suggestionHitCount: {
            top: Array.isArray(topList)
              ? topList.filter((r: any) => r.routeId === SURFACE_ID).length
              : 0,
            nearest: Array.isArray(nearestList)
              ? nearestList.filter((r: any) => r.routeId === SURFACE_ID).length
              : 0,
            bbox: Array.isArray(bboxList)
              ? bboxList.filter((r: any) => r.routeId === SURFACE_ID).length
              : 0,
          },
        },
        null,
        2,
      ),
    )
  }, 300_000)

  afterAll(() => {
    runConvexFn(
      'curatedGeometry:teardownS5T2Fixtures',
      { prefixes: ['test:s5t2-retired-surface'] },
      { identity: true },
    )
  })

  it('MUST_OBSERVE: geometryStatus=retired, riderReady=false', () => {
    expect(evidence?.geometryStatus).toBe('retired')
    expect(evidence?.riderReady).toBe(false)
  })

  it('MUST_OBSERVE: detail returns preserved identity + retirementReason', () => {
    expect(detail).toBeTruthy()
    expect(detail.routeId).toBe(SURFACE_ID)
    expect(detail.routeId.length).toBeGreaterThanOrEqual(1)
    expect(detail.retirementReason?.length).toBeGreaterThanOrEqual(1)
    expect(detail.geometryStatus).toBe('retired')
  })

  it('MUST_NOT_OBSERVE: retired route in top/bbox/nearest suggestions', () => {
    const topHit = (Array.isArray(topList) ? topList : []).filter(
      (r: any) => r.routeId === SURFACE_ID,
    )
    const nearestHit = (Array.isArray(nearestList) ? nearestList : []).filter(
      (r: any) => r.routeId === SURFACE_ID,
    )
    const bboxHit = (Array.isArray(bboxList) ? bboxList : []).filter(
      (r: any) => r.routeId === SURFACE_ID,
    )
    expect(topHit.length + nearestHit.length + bboxHit.length).toBe(0)
  })

  it('MUST_NOT_OBSERVE: hard deletion or riderReady=true after retirement', () => {
    expect(detail).not.toBeNull()
    expect(evidence?.riderReady).not.toBe(true)
    expect(evidence?.routeDocExists).toBe(true)
  })
})
