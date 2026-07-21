/**
 * REDHAT-FIX-19 [PRIMARY integration]: Strict non-optional
 * manifestHash/catalogVersion binding + catalogVersion on every couchGateStatus shape.
 *
 * Red-hat HIGH-1 (20260721T153804Z): couchGateStatus uses fail-open binding
 *   (!activeManifestHash || !v.manifestHash || equal)
 * and omits catalogVersion on the allowed return path. A PASS with missing
 * manifestHash/catalogVersion can still unlock; evaluateFounderAttestation
 * receives catalogVersion:null and accepts missing row bindings.
 *
 * FIX-19:
 *   - Binding requires non-empty equality of manifestHash AND catalogVersion
 *     on BOTH active-manifest and verdict (empty/undefined/null fail closed).
 *   - Every couchGateStatus shape returns catalogVersion (null when unknown).
 *   - evaluateFounderAttestation fails closed when status or row lacks
 *     non-empty manifestHash/catalogVersion (reason: missing_binding).
 *   - Does NOT change FIX-17 latest-verdict selection (latest pass OR fail).
 *
 * TEST_TIER: integration
 * VERIFICATION_SERVICE: Convex dev deployment
 * FLOW_REF: UC-VER-05
 */

import { execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import {
  evaluateFounderAttestation,
  type GateStatusRow,
  type VerdictRow,
} from '../../tools/gate/resolveFounderVerdict'

const PROJECT_ROOT = resolve(__dirname, '..', '..')
const EVIDENCE_DIR = resolve(PROJECT_ROOT, '.tmp/REDHAT-FIX-19')

const FOUNDER = JSON.stringify({
  subject: 'test:s4t19-founder',
  issuer: 'https://laneshadow.test',
})
const OPERATOR = JSON.stringify({
  subject: 'test:s4t19-operator',
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
      env: {
        ...process.env,
        CONVEX_DEPLOYMENT: process.env.CONVEX_DEPLOYMENT ?? 'dev:quirky-panther-164',
      },
    })
    return { ok: true, combined: stdout }
  } catch (err: any) {
    const combined = `${typeof err.stdout === 'string' ? err.stdout : ''}${typeof err.stderr === 'string' ? err.stderr : ''}`
    return { ok: false, combined }
  }
}

function gateStatus(): {
  allowed: boolean
  overallVerdict: 'pass' | 'fail' | null
  reason: string | null
  sampleId: string | null
  manifestHash: string | null
  catalogVersion?: string | null
} {
  const r = runConvex('couchVerdict:couchGateStatus', {})
  if (!r.ok) throw new Error(`couchGateStatus failed: ${r.combined}`)
  return JSON.parse(r.combined)
}

function uniqueSampleId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1e6)}`
}

describe('REDHAT-FIX-19: strict non-optional manifestHash/catalogVersion binding', () => {
  let missingHashSampleId = ''
  let missingCatalogSampleId = ''
  let healthySampleId = ''
  let healthyCatalogVersion = ''
  let healthyManifestHash = ''

  beforeAll(() => {
    mkdirSync(EVIDENCE_DIR, { recursive: true })

    const founderSetup = runConvex(
      'testSupport:devSetupFounderUser',
      { clerkUserId: 'test:s4t19-founder', role: 'founder' },
      FOUNDER,
    )
    expect(founderSetup.ok, `founder setup failed: ${founderSetup.combined}`).toBe(true)

    const operatorSetup = runConvex(
      'testSupport:devSetupFounderUser',
      { clerkUserId: 'test:s4t19-operator', role: 'operator' },
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

  /** Freeze + activate a sample under the operator identity; return routes. */
  function freezeAndActivate(sampleId: string): {
    routes: { routeId: string }[]
    manifestHash?: string
    catalogVersion?: string
  } {
    const assemble = runConvex(
      'couchSampleAssembler:assembleCouchSample',
      { targetSize: 25, sampleId },
      OPERATOR,
    )
    expect(assemble.ok, `assemble ${sampleId} failed: ${assemble.combined}`).toBe(true)
    const sample = JSON.parse(assemble.combined)

    const activate = runConvex(
      'couchVerdict:activateCouchManifest',
      { sampleId, reason: `s4t19 activate ${sampleId}` },
      OPERATOR,
    )
    expect(activate.ok, `activate ${sampleId} failed: ${activate.combined}`).toBe(true)
    return sample
  }

  function recordPass(sampleId: string, routes: { routeId: string }[]) {
    const routeVerdicts = routes.map((r) => ({ routeId: r.routeId, verdict: 'true' as const }))
    const record = runConvex(
      'couchVerdict:recordCouchVerdict',
      { sampleId, overallVerdict: 'pass', routeVerdicts },
      OPERATOR,
    )
    expect(record.ok, `record pass ${sampleId} failed: ${record.combined}`).toBe(true)
    return JSON.parse(record.combined)
  }

  /**
   * Reduce a stored pass verdict to a legacy unbound shape by clearing
   * manifestHash and/or catalogVersion (empty string). Operator + test-subject
   * gated — mirrors FIX-16 setManifestRouteHashesForTest.
   */
  function clearVerdictBindings(
    sampleId: string,
    opts: { clearManifestHash?: boolean; clearCatalogVersion?: boolean },
  ) {
    const patch = runConvex(
      'couchVerdict:setVerdictBindingsForTest',
      {
        sampleId,
        ...(opts.clearManifestHash ? { manifestHash: '' } : {}),
        ...(opts.clearCatalogVersion ? { catalogVersion: '' } : {}),
      },
      OPERATOR,
    )
    expect(patch.ok, `setVerdictBindingsForTest failed: ${patch.combined}`).toBe(true)
    return JSON.parse(patch.combined)
  }

  it('AC-1: Missing verdict manifestHash → allowed===false even if overallVerdict was pass', () => {
    missingHashSampleId = uniqueSampleId('redhatfix19-miss-hash')
    const sample = freezeAndActivate(missingHashSampleId)
    const passRow = recordPass(missingHashSampleId, sample.routes)
    expect(passRow.overallVerdict).toBe('pass')
    expect(typeof passRow.manifestHash).toBe('string')
    expect(passRow.manifestHash.length).toBeGreaterThan(0)

    // Legacy unbound shape: clear verdict.manifestHash while overallVerdict stays pass.
    const reduced = clearVerdictBindings(missingHashSampleId, { clearManifestHash: true })
    expect(reduced.overallVerdict).toBe('pass')
    expect(!reduced.manifestHash || reduced.manifestHash === '').toBe(true)

    const gate = gateStatus()
    writeFileSync(
      resolve(EVIDENCE_DIR, 'AC-1-gate-status.json'),
      JSON.stringify(
        {
          capturedAt: new Date().toISOString(),
          sampleId: missingHashSampleId,
          gate,
          passRowBefore: passRow,
          reduced,
        },
        null,
        2,
      ),
    )

    expect(
      gate.allowed,
      `PASS missing manifestHash must BLOCK (fail closed), but was allowed (reason: ${gate.reason})`,
    ).toBe(false)
    expect(typeof gate.catalogVersion !== 'undefined').toBe(true)
    expect(gate.sampleId).toBe(missingHashSampleId)
  }, 180000)

  it('AC-2: Missing verdict catalogVersion → allowed===false', () => {
    missingCatalogSampleId = uniqueSampleId('redhatfix19-miss-cat')
    const sample = freezeAndActivate(missingCatalogSampleId)
    const passRow = recordPass(missingCatalogSampleId, sample.routes)
    expect(passRow.overallVerdict).toBe('pass')

    const reduced = clearVerdictBindings(missingCatalogSampleId, { clearCatalogVersion: true })
    expect(reduced.overallVerdict).toBe('pass')
    expect(!reduced.catalogVersion || reduced.catalogVersion === '').toBe(true)

    const gate = gateStatus()
    writeFileSync(
      resolve(EVIDENCE_DIR, 'AC-2-gate-status.json'),
      JSON.stringify(
        {
          capturedAt: new Date().toISOString(),
          sampleId: missingCatalogSampleId,
          gate,
          passRowBefore: passRow,
          reduced,
        },
        null,
        2,
      ),
    )

    expect(
      gate.allowed,
      `PASS missing catalogVersion must BLOCK, but was allowed (reason: ${gate.reason})`,
    ).toBe(false)
    expect('catalogVersion' in gate).toBe(true)
    expect(gate.sampleId).toBe(missingCatalogSampleId)
  }, 180000)

  it('AC-3: Allowed path returns non-null catalogVersion equal to active manifest', () => {
    healthySampleId = uniqueSampleId('redhatfix19-healthy')
    const sample = freezeAndActivate(healthySampleId)
    const passRow = recordPass(healthySampleId, sample.routes)
    expect(passRow.overallVerdict).toBe('pass')
    expect(typeof passRow.catalogVersion).toBe('string')
    expect(passRow.catalogVersion.length).toBeGreaterThan(0)
    healthyCatalogVersion = passRow.catalogVersion
    healthyManifestHash = passRow.manifestHash

    const gate = gateStatus()
    writeFileSync(
      resolve(EVIDENCE_DIR, 'AC-3-gate-status.json'),
      JSON.stringify(
        {
          capturedAt: new Date().toISOString(),
          sampleId: healthySampleId,
          gate,
          passRow,
          activeCatalogVersion: healthyCatalogVersion,
          activeManifestHash: healthyManifestHash,
        },
        null,
        2,
      ),
    )

    expect(
      gate.allowed,
      `healthy fully-bound pass must ALLOW, but blocked (reason: ${gate.reason})`,
    ).toBe(true)
    expect(typeof gate.catalogVersion).toBe('string')
    expect((gate.catalogVersion as string).length).toBeGreaterThan(0)
    expect(gate.catalogVersion).toBe(healthyCatalogVersion)
    expect(typeof gate.manifestHash).toBe('string')
    expect((gate.manifestHash as string).length).toBeGreaterThan(0)
    expect(gate.manifestHash).toBe(healthyManifestHash)
    expect(gate.sampleId).toBe(healthySampleId)
  }, 180000)

  it('AC-4: evaluateFounderAttestation fails closed on missing bindings', () => {
    // Construct status allowed:true with catalogVersion:null (the pre-FIX-19
    // allowed shape) and a pass row with empty catalogVersion — must fail closed.
    const status: GateStatusRow = {
      allowed: true,
      sampleId: healthySampleId || 's4t19-synthetic-sample',
      manifestHash: healthyManifestHash || 'mh-healthy',
      catalogVersion: null,
      reason: null,
    }
    const row: VerdictRow = {
      overallVerdict: 'pass',
      recordedBy: 'founder-justin',
      manifestHash: healthyManifestHash || 'mh-healthy',
      catalogVersion: '',
      sampleId: healthySampleId || 's4t19-synthetic-sample',
    }

    const attestation = evaluateFounderAttestation(status, row)
    writeFileSync(
      resolve(EVIDENCE_DIR, 'AC-4-attestation.json'),
      JSON.stringify(
        {
          capturedAt: new Date().toISOString(),
          status,
          row,
          attestation,
        },
        null,
        2,
      ),
    )

    expect(attestation.present).toBe(false)
    expect(typeof attestation.reason).toBe('string')
    expect((attestation.reason as string).length).toBeGreaterThan(0)
    expect(attestation.reason).toBe('missing_binding')
  }, 60000)
})
