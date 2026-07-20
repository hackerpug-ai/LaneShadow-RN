/**
 * REDHAT-FIX-14 [PRIMARY integration]: The active couch manifest is an explicit
 * operator transition, NOT the latest frozen sample.
 *
 * Red-hat review 2026-07-20T205905Z (HIGH): storeCouchSample used only
 * requireIdentity and couchGateStatus derived the active manifest from the
 * latest frozen sample. So any authenticated user could freeze a NEW manifest
 * and invalidate a prior approved unlock (a trust-gate DoS / unauthorized
 * control-plane change).
 *
 * FIX-14: storeCouchSample/assembleCouchSample are now operator-only; the active
 * manifest is the LATEST entry in an append-only couch_manifest_activations log
 * written by an operator-only activateCouchManifest (with audit actor/reason).
 *
 * This test proves:
 *   (1) a non-operator rider is FORBIDDEN from freeze/assemble/activate,
 *   (2) freezing a NEW manifest does NOT rotate the active manifest (DoS
 *       prevention) — a prior approved unlock survives, and
 *   (3) only an explicit operator activation changes the active manifest.
 *
 * TEST_TIER: integration
 * VERIFICATION_SERVICE: Convex dev deployment
 * FLOW_REF: UC-VER-05 (couch manifest control plane)
 */

import { execFileSync } from 'node:child_process'
import { resolve } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const PROJECT_ROOT = resolve(__dirname, '..', '..')

const FOUNDER = JSON.stringify({ subject: 'test:s4t14-founder', issuer: 'https://laneshadow.test' })
const RIDER = JSON.stringify({ subject: 's4t14-rider', issuer: 'https://laneshadow.test' })

interface RunResult {
  ok: boolean
  combined: string
}

function runConvex(fn: string, args: Record<string, unknown>, identity: string): RunResult {
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

function gateStatus(): { allowed: boolean; sampleId: string | null; reason: string | null } {
  const r = runConvex('couchVerdict:couchGateStatus', {}, FOUNDER)
  if (!r.ok) throw new Error(`couchGateStatus failed: ${r.combined}`)
  return JSON.parse(r.combined)
}

describe('REDHAT-FIX-14: active manifest is an explicit operator transition', () => {
  let sampleA: { sampleId: string; routes: { routeId: string }[] }

  beforeAll(() => {
    // Bootstrap founder (operator-capable) + clean gate state.
    const setup = runConvex(
      'testSupport:devSetupFounderUser',
      { clerkUserId: 'test:s4t14-founder', role: 'founder' },
      FOUNDER,
    )
    expect(setup.ok, `setup failed: ${setup.combined}`).toBe(true)
    runConvex('couchVerdict:clearCouchVerdictsPublic', {}, FOUNDER)
    runConvex('couchVerdict:clearCouchManifestActivations', {}, FOUNDER)
    const seed = runConvex('couchSampleAssembler:seedCouchFixturesPublic', {}, FOUNDER)
    expect(seed.ok, `seed failed: ${seed.combined}`).toBe(true)
  })

  afterAll(() => {
    runConvex('couchVerdict:clearCouchVerdictsPublic', {}, FOUNDER)
    runConvex('couchVerdict:clearCouchManifestActivations', {}, FOUNDER)
    runConvex('couchSampleAssembler:teardownCouchFixturesPublic', {}, FOUNDER)
  })

  it('AC-1: non-operator rider is FORBIDDEN from assembleCouchSample (freeze)', () => {
    const r = runConvex('couchSampleAssembler:assembleCouchSample', { targetSize: 25 }, RIDER)
    expect(r.ok, `rider should be FORBIDDEN from freeze`).toBe(false)
    expect(r.combined).toMatch(/FORBIDDEN|Operator or founder role required/i)
  }, 60000)

  it('AC-2: non-operator rider is FORBIDDEN from activateCouchManifest', () => {
    const r = runConvex('couchVerdict:activateCouchManifest', { sampleId: 's4t14-x' }, RIDER)
    expect(r.ok, `rider should be FORBIDDEN from activate`).toBe(false)
    expect(r.combined).toMatch(/FORBIDDEN|Operator or founder role required/i)
  })

  it('AC-3: founder freezes + activates manifest A, records pass → gate allows A', () => {
    const assemble = runConvex(
      'couchSampleAssembler:assembleCouchSample',
      { targetSize: 25 },
      FOUNDER,
    )
    expect(assemble.ok, `assemble A failed: ${assemble.combined}`).toBe(true)
    sampleA = JSON.parse(assemble.combined)

    const activate = runConvex(
      'couchVerdict:activateCouchManifest',
      { sampleId: sampleA.sampleId, reason: 's4t14 activate A' },
      FOUNDER,
    )
    expect(activate.ok, `activate A failed: ${activate.combined}`).toBe(true)

    const routeVerdicts = sampleA.routes.map((r) => ({
      routeId: r.routeId,
      verdict: 'true' as const,
    }))
    const record = runConvex(
      'couchVerdict:recordCouchVerdict',
      { sampleId: sampleA.sampleId, overallVerdict: 'pass', routeVerdicts },
      FOUNDER,
    )
    expect(record.ok, `record pass A failed: ${record.combined}`).toBe(true)

    const gate = gateStatus()
    expect(gate.allowed, `gate should ALLOW after A pass: ${gate.reason}`).toBe(true)
    expect(gate.sampleId).toBe(sampleA.sampleId)
  }, 120000)

  it('AC-4: freezing a NEW manifest B does NOT rotate the active manifest (DoS prevention)', () => {
    // The prior approved unlock on A must survive an operator freezing B.
    const before = gateStatus()
    expect(before.sampleId).toBe(sampleA.sampleId)

    const assembleB = runConvex(
      'couchSampleAssembler:assembleCouchSample',
      { targetSize: 25, sampleId: `couch-s4t14-B-${Date.now()}` },
      FOUNDER,
    )
    expect(assembleB.ok, `assemble B failed: ${assembleB.combined}`).toBe(true)
    const sampleB = JSON.parse(assembleB.combined)
    expect(sampleB.sampleId).not.toBe(sampleA.sampleId)

    // Freezing B must NOT change the active manifest: gate still bound to A.
    const after = gateStatus()
    expect(after.allowed, `freezing B must not invalidate the A unlock: ${after.reason}`).toBe(true)
    expect(after.sampleId, `freezing B must not rotate the active manifest`).toBe(sampleA.sampleId)
  }, 120000)

  it('AC-5: only an EXPLICIT operator activation changes the active manifest', () => {
    // Freeze+activate B explicitly; gate now binds to B which has NO pass → blocked.
    const sampleBId = `couch-s4t14-B2-${Date.now()}`
    const assembleB = runConvex(
      'couchSampleAssembler:assembleCouchSample',
      { targetSize: 25, sampleId: sampleBId },
      FOUNDER,
    )
    expect(assembleB.ok, `assemble B2 failed: ${assembleB.combined}`).toBe(true)

    const activateB = runConvex(
      'couchVerdict:activateCouchManifest',
      { sampleId: sampleBId, reason: 's4t14 rotate to B2' },
      FOUNDER,
    )
    expect(activateB.ok, `activate B2 failed: ${activateB.combined}`).toBe(true)

    const gate = gateStatus()
    // B2 is active but has no recorded pass → gate must be blocked, bound to B2.
    expect(gate.allowed, `B2 has no pass; gate must block`).toBe(false)
    expect(gate.sampleId).toBe(sampleBId)
  }, 120000)
})
