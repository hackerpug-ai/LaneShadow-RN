/**
 * REDHAT-FIX-16 [PRIMARY integration]: Legacy couch manifests missing a
 * complete routeHashes baseline fail closed, and an operator migration/re-freeze
 * does NOT inherit the old PASS.
 *
 * Red-hat review 2026-07-20T221805Z (HIGH): couchGateStatus substituted an
 * empty array for a missing routeHashes baseline (couchVerdict.ts drift loop
 * `routeHashes ?? []`), so a pre-FIX-15 frozen manifest with a bound PASS ran
 * zero drift comparisons and could unlock `--all` without live revalidation.
 *
 * FIX-16:
 *   - couchGateStatus now FAILS CLOSED when the active manifest's routeHashes
 *     baseline is absent/empty/incomplete/duplicate (re-freeze required).
 *   - runAllWaterfall throws COUCH_GATE_BLOCKED for such a legacy manifest.
 *   - An operator refreezeCouchManifest recomputes a complete baseline under a
 *     fresh manifestHash, but the old PASS is NOT inherited — the gate stays
 *     blocked until a fresh operator activation + recordCouchVerdict(pass).
 *   - A non-legacy complete-baseline no-drift manifest is unaffected (allowed).
 *
 * TEST_TIER: integration
 * VERIFICATION_SERVICE: Convex dev deployment
 * FLOW_REF: UC-VER-05 (legacy manifest fail-closed + migration)
 */

import { execFileSync } from 'node:child_process'
import { resolve } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const PROJECT_ROOT = resolve(__dirname, '..', '..')

const FOUNDER = JSON.stringify({ subject: 'test:s4t16-founder', issuer: 'https://laneshadow.test' })
const OPERATOR = JSON.stringify({
  subject: 'test:s4t16-operator',
  issuer: 'https://laneshadow.test',
})

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

function gateStatus(): {
  allowed: boolean
  reason: string | null
  sampleId: string | null
  manifestHash: string | null
} {
  const r = runConvex('couchVerdict:couchGateStatus', {})
  if (!r.ok) throw new Error(`couchGateStatus failed: ${r.combined}`)
  return JSON.parse(r.combined)
}

function uniqueSampleId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1e6)}`
}

describe('REDHAT-FIX-16: legacy manifest fail-closed + migration/re-freeze', () => {
  // Shared state across the ordered ACs.
  let legacyNoHashes = ''
  let legacyDuplicate = ''
  let refreezeTarget = ''
  let healthy = ''

  beforeAll(() => {
    const founderSetup = runConvex(
      'testSupport:devSetupFounderUser',
      { clerkUserId: 'test:s4t16-founder', role: 'founder' },
      FOUNDER,
    )
    expect(founderSetup.ok, `founder setup failed: ${founderSetup.combined}`).toBe(true)
    const operatorSetup = runConvex(
      'testSupport:devSetupFounderUser',
      { clerkUserId: 'test:s4t16-operator', role: 'operator' },
      OPERATOR,
    )
    expect(operatorSetup.ok, `operator setup failed: ${operatorSetup.combined}`).toBe(true)

    runConvex('couchVerdict:clearCouchVerdictsPublic', {}, FOUNDER)
    runConvex('couchVerdict:clearCouchManifestActivations', {}, FOUNDER)
    const seed = runConvex('couchSampleAssembler:seedCouchFixturesPublic', {}, FOUNDER)
    expect(seed.ok, `seed failed: ${seed.combined}`).toBe(true)
  }, 120000)

  afterAll(() => {
    runConvex('couchVerdict:clearCouchVerdictsPublic', {}, FOUNDER)
    runConvex('couchVerdict:clearCouchManifestActivations', {}, FOUNDER)
    runConvex('couchSampleAssembler:teardownCouchFixturesPublic', {}, FOUNDER)
  })

  // Helper: freeze + activate + record pass under the operator identity.
  function freezeActivateRecordPass(sampleId: string): { routes: { routeId: string }[] } {
    const assemble = runConvex(
      'couchSampleAssembler:assembleCouchSample',
      { targetSize: 25, sampleId },
      OPERATOR,
    )
    expect(assemble.ok, `assemble ${sampleId} failed: ${assemble.combined}`).toBe(true)
    const sample = JSON.parse(assemble.combined)

    const activate = runConvex(
      'couchVerdict:activateCouchManifest',
      { sampleId, reason: `s4t16 activate ${sampleId}` },
      OPERATOR,
    )
    expect(activate.ok, `activate ${sampleId} failed: ${activate.combined}`).toBe(true)

    const routeVerdicts = sample.routes.map((r: { routeId: string }) => ({
      routeId: r.routeId,
      verdict: 'true' as const,
    }))
    const record = runConvex(
      'couchVerdict:recordCouchVerdict',
      { sampleId, overallVerdict: 'pass', routeVerdicts },
      OPERATOR,
    )
    expect(record.ok, `record pass ${sampleId} failed: ${record.combined}`).toBe(true)
    return sample
  }

  it('AC-1 case 1: legacy manifest with missing/empty routeHashes fails closed; runAllWaterfall throws COUCH_GATE_BLOCKED', () => {
    legacyNoHashes = uniqueSampleId('s4t16-legacy-empty')
    freezeActivateRecordPass(legacyNoHashes)

    // Reduce the frozen manifest to its pre-FIX-15 shape: clear routeHashes.
    const clear = runConvex(
      'couchSampleAssembler:setManifestRouteHashesForTest',
      { sampleId: legacyNoHashes, routeHashes: [] },
      OPERATOR,
    )
    expect(clear.ok, `clear routeHashes failed: ${clear.combined}`).toBe(true)

    const gate = gateStatus()
    expect(
      gate.allowed,
      `legacy empty-baseline manifest must BLOCK, but was allowed (reason: ${gate.reason})`,
    ).toBe(false)
    expect(gate.sampleId).toBe(legacyNoHashes)
    expect(gate.reason).toMatch(/incomplete|missing|baseline|re-freeze/i)

    // runAllWaterfall must throw COUCH_GATE_BLOCKED (before any provider work).
    const all = runConvex('couchVerdict:runAllWaterfall', { routeIds: [] }, OPERATOR)
    expect(all.ok, `runAllWaterfall should have thrown COUCH_GATE_BLOCKED`).toBe(false)
    expect(all.combined).toMatch(/COUCH_GATE_BLOCKED/)
  }, 180000)

  it('AC-1 case 2: legacy manifest with an incomplete/duplicate routeHashes baseline fails closed', () => {
    legacyDuplicate = uniqueSampleId('s4t16-legacy-dup')
    const sample = freezeActivateRecordPass(legacyDuplicate)

    // Read the complete baseline, then duplicate one entry (incomplete baseline).
    const get = runConvex(
      'couchSampleAssembler:getCouchSample',
      { sampleId: legacyDuplicate },
      OPERATOR,
    )
    expect(get.ok, `getCouchSample failed: ${get.combined}`).toBe(true)
    const manifest = JSON.parse(get.combined)
    const complete: { routeId: string; hash: string }[] = manifest.routeHashes
    expect(complete.length, `baseline must start complete`).toBe(sample.routes.length)

    const duplicated = [...complete, { ...complete[0] }] // duplicate routeId entry
    const set = runConvex(
      'couchSampleAssembler:setManifestRouteHashesForTest',
      { sampleId: legacyDuplicate, routeHashes: duplicated },
      OPERATOR,
    )
    expect(set.ok, `set duplicate routeHashes failed: ${set.combined}`).toBe(true)

    const gate = gateStatus()
    expect(
      gate.allowed,
      `duplicate-baseline manifest must BLOCK, but was allowed (reason: ${gate.reason})`,
    ).toBe(false)
    expect(gate.sampleId).toBe(legacyDuplicate)
    expect(gate.reason).toMatch(/incomplete|missing|baseline|re-freeze/i)
  }, 180000)

  it('AC-2: operator re-freeze recomputes a complete baseline but does NOT inherit the old PASS', () => {
    // Re-freeze the blocked legacy manifest (legacyNoHashes) into a fresh target.
    refreezeTarget = uniqueSampleId('s4t16-refreeze')
    const refreeze = runConvex(
      'couchSampleAssembler:refreezeCouchManifest',
      { sourceSampleId: legacyNoHashes, targetSampleId: refreezeTarget },
      OPERATOR,
    )
    expect(refreeze.ok, `refreeze failed: ${refreeze.combined}`).toBe(true)
    const refrozen = JSON.parse(refreeze.combined)
    expect(refrozen.status).toBe('frozen')
    expect(refrozen.manifestHash).toBeTruthy()

    // The re-frozen manifest must carry a COMPLETE baseline (one hash per route).
    const get = runConvex(
      'couchSampleAssembler:getCouchSample',
      { sampleId: refreezeTarget },
      OPERATOR,
    )
    expect(get.ok, `getCouchSample refreeze failed: ${get.combined}`).toBe(true)
    const manifest = JSON.parse(get.combined)
    const baselineIds = new Set(manifest.routeHashes.map((h: { routeId: string }) => h.routeId))
    expect(manifest.routeHashes.length, `complete baseline length`).toBe(manifest.routes.length)
    expect(baselineIds.size, `no duplicate routeIds in baseline`).toBe(manifest.routes.length)

    // Activate the re-frozen manifest (explicit operator transition, FIX-14).
    const activate = runConvex(
      'couchVerdict:activateCouchManifest',
      { sampleId: refreezeTarget, reason: 's4t16 activate refreeze' },
      OPERATOR,
    )
    expect(activate.ok, `activate refreeze failed: ${activate.combined}`).toBe(true)

    // BEFORE a fresh pass verdict: the old PASS (bound to legacyNoHashes) is NOT
    // inherited — the gate must still block (bound to refreezeTarget, no pass).
    const gateBefore = gateStatus()
    expect(
      gateBefore.allowed,
      `old PASS must NOT be inherited after re-freeze; gate should block (reason: ${gateBefore.reason})`,
    ).toBe(false)
    expect(gateBefore.sampleId).toBe(refreezeTarget)

    // Only after a fresh operator recordCouchVerdict(pass) does the gate unlock.
    const routeVerdicts = manifest.routes.map((r: { routeId: string }) => ({
      routeId: r.routeId,
      verdict: 'true' as const,
    }))
    const record = runConvex(
      'couchVerdict:recordCouchVerdict',
      { sampleId: refreezeTarget, overallVerdict: 'pass', routeVerdicts },
      OPERATOR,
    )
    expect(record.ok, `fresh pass on refreeze failed: ${record.combined}`).toBe(true)

    const gateAfter = gateStatus()
    expect(
      gateAfter.allowed,
      `gate should ALLOW after a fresh pass on the re-frozen manifest (reason: ${gateAfter.reason})`,
    ).toBe(true)
    expect(gateAfter.sampleId).toBe(refreezeTarget)
  }, 180000)

  it('AC-3: a non-legacy complete-baseline no-drift manifest is unaffected (allowed)', () => {
    healthy = uniqueSampleId('s4t16-healthy')
    freezeActivateRecordPass(healthy)

    const gate = gateStatus()
    expect(
      gate.allowed,
      `complete-baseline no-drift manifest must be ALLOWED (FIX-15 happy path), but blocked (reason: ${gate.reason})`,
    ).toBe(true)
    expect(gate.sampleId).toBe(healthy)
  }, 180000)
})
