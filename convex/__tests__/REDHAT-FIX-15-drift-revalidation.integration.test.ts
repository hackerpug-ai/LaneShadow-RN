/**
 * REDHAT-FIX-15 [PRIMARY integration]: A couch PASS is revalidated against live
 * route/geometry state; drift after the frozen snapshot revokes the unlock.
 *
 * Red-hat review 2026-07-20T205905Z (HIGH): the manifest's catalogVersion was
 * the constant 's4-trust-pipeline-v1', and couchGateStatus compared a verdict
 * only to the frozen manifest's stored hash/version — it never rechecked the
 * frozen routes' current geometry hashes. So a PASS could remain an unlock after
 * a sampled route's geometry/catalog state changed.
 *
 * FIX-15:
 *   - catalogVersion is now a real per-freeze fingerprint ('rev-' + manifest
 *     hash prefix), not a constant.
 *   - The frozen manifest stores per-route geometry hashes (routeHashes).
 *   - couchGateStatus recomputes each frozen route's current hash and BLOCKS on
 *     drift.
 *
 * This test proves:
 *   (1) a couch PASS is allowed before drift,
 *   (2) the frozen manifest carries a non-constant catalogVersion + routeHashes,
 *   (3) mutating a sampled route's geometry REVOKES the unlock (gate blocks on
 *       drift), and
 *   (4) the block reason names the drifted route.
 *
 * TEST_TIER: integration
 * VERIFICATION_SERVICE: Convex dev deployment
 * FLOW_REF: UC-VER-05 (current-manifest/current-catalog gate contract)
 */

import { execFileSync } from 'node:child_process'
import { resolve } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const PROJECT_ROOT = resolve(__dirname, '..', '..')

const FOUNDER = JSON.stringify({ subject: 'test:s4t15-founder', issuer: 'https://laneshadow.test' })

interface RunResult {
  ok: boolean
  combined: string
}

function runConvex(fn: string, args: Record<string, unknown>, identity = FOUNDER): RunResult {
  const cmd = ['convex', 'run', fn, JSON.stringify(args), '--identity', identity]
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

function gateStatus(): { allowed: boolean; reason: string | null; sampleId: string | null } {
  const r = runConvex('couchVerdict:couchGateStatus', {})
  if (!r.ok) throw new Error(`couchGateStatus failed: ${r.combined}`)
  return JSON.parse(r.combined)
}

describe('REDHAT-FIX-15: couch PASS is revalidated against live geometry (drift blocks)', () => {
  let sampleA: { sampleId: string; routes: { routeId: string }[] }
  let manifest: { catalogVersion: string | null; routeHashes?: { routeId: string; hash: string }[] }
  let driftedRouteId: string

  beforeAll(() => {
    const setup = runConvex(
      'testSupport:devSetupFounderUser',
      { clerkUserId: 'test:s4t15-founder', role: 'founder' },
      FOUNDER,
    )
    expect(setup.ok, `setup failed: ${setup.combined}`).toBe(true)
    runConvex('couchVerdict:clearCouchVerdictsPublic', {})
    runConvex('couchVerdict:clearCouchManifestActivations', {})
    const seed = runConvex('couchSampleAssembler:seedCouchFixturesPublic', {})
    expect(seed.ok, `seed failed: ${seed.combined}`).toBe(true)
  }, 120000)

  afterAll(() => {
    runConvex('couchVerdict:clearCouchVerdictsPublic', {})
    runConvex('couchVerdict:clearCouchManifestActivations', {})
    runConvex('couchSampleAssembler:teardownCouchFixturesPublic', {})
  })

  it('AC-1: couch PASS is allowed before any drift', () => {
    const assemble = runConvex('couchSampleAssembler:assembleCouchSample', { targetSize: 25 })
    expect(assemble.ok, `assemble A failed: ${assemble.combined}`).toBe(true)
    sampleA = JSON.parse(assemble.combined)

    const activate = runConvex('couchVerdict:activateCouchManifest', {
      sampleId: sampleA.sampleId,
      reason: 's4t15 activate A',
    })
    expect(activate.ok, `activate A failed: ${activate.combined}`).toBe(true)

    const routeVerdicts = sampleA.routes.map((r) => ({
      routeId: r.routeId,
      verdict: 'true' as const,
    }))
    const record = runConvex('couchVerdict:recordCouchVerdict', {
      sampleId: sampleA.sampleId,
      overallVerdict: 'pass',
      routeVerdicts,
    })
    expect(record.ok, `record pass A failed: ${record.combined}`).toBe(true)

    const gate = gateStatus()
    expect(gate.allowed, `gate should ALLOW before drift: ${gate.reason}`).toBe(true)
  }, 120000)

  it('AC-2: frozen manifest carries a non-constant catalogVersion + routeHashes', () => {
    const r = runConvex('couchSampleAssembler:getCouchSample', { sampleId: sampleA.sampleId })
    expect(r.ok, `getCouchSample failed: ${r.combined}`).toBe(true)
    manifest = JSON.parse(r.combined)
    // REDHAT-FIX-15: catalogVersion is no longer the constant 's4-trust-pipeline-v1'.
    expect(manifest.catalogVersion, `catalogVersion must be non-constant`).toBeTruthy()
    expect(manifest.catalogVersion).not.toBe('s4-trust-pipeline-v1')
    expect(manifest.catalogVersion).toMatch(/^rev-/)
    // Per-route hashes are captured for drift detection.
    expect(manifest.routeHashes, `routeHashes must be stored`).toBeTruthy()
    expect(manifest.routeHashes!.length).toBe(sampleA.routes.length)
  }, 60000)

  it('AC-3: mutating a sampled route geometry REVOKES the unlock (gate blocks on drift)', () => {
    driftedRouteId = sampleA.routes[0].routeId
    const drift = runConvex('curatedGeometryTestSupport:simulateGeometryDrift', {
      routeId: driftedRouteId,
    })
    expect(drift.ok, `simulateGeometryDrift failed: ${drift.combined}`).toBe(true)

    const gate = gateStatus()
    expect(
      gate.allowed,
      `gate must BLOCK after geometry drift, but was allowed (reason: ${gate.reason})`,
    ).toBe(false)
  }, 60000)

  it('AC-4: the block reason names the drifted route', () => {
    const gate = gateStatus()
    expect(gate.reason).toBeTruthy()
    expect(gate.reason).toMatch(/drift/i)
    expect(gate.reason).toContain(driftedRouteId)
  }, 60000)
})
