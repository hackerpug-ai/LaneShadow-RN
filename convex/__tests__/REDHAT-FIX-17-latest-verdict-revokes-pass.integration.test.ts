/**
 * REDHAT-FIX-17 [PRIMARY integration]: Select LATEST bound couch verdict
 * (pass OR fail) so a later fail revokes an earlier pass.
 *
 * Red-hat CRITICAL-1 (20260721T153804Z): couchGateStatus filters history to
 * overallVerdict==='pass' only, then picks latest. A later founder/operator
 * fail cannot revoke an earlier pass — contradicting getCouchVerdict's
 * latest-by-recordedAt contract and append-only fail recording.
 *
 * FIX-17:
 *   - couchGateStatus selects the LATEST bound verdict (pass OR fail) for
 *     the active manifest sampleId, then allows only if that row is 'pass'.
 *   - pass@t1 → fail@t2 → allowed===false and runAllWaterfall throws
 *     COUCH_GATE_BLOCKED.
 *   - Sole latest pass still unlocks; sole latest fail still blocks.
 *   - getCouchVerdict latest matches gate authority.
 *
 * TEST_TIER: integration
 * VERIFICATION_SERVICE: Convex dev deployment
 * FLOW_REF: UC-VER-05 (latest-verdict revoke)
 */

import { execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const PROJECT_ROOT = resolve(__dirname, '..', '..')
const EVIDENCE_DIR = resolve(PROJECT_ROOT, '.tmp/REDHAT-FIX-17')

const FOUNDER = JSON.stringify({
  subject: 'test:s4t17-founder',
  issuer: 'https://laneshadow.test',
})
const OPERATOR = JSON.stringify({
  subject: 'test:s4t17-operator',
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
} {
  const r = runConvex('couchVerdict:couchGateStatus', {})
  if (!r.ok) throw new Error(`couchGateStatus failed: ${r.combined}`)
  return JSON.parse(r.combined)
}

function uniqueSampleId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1e6)}`
}

function sleepMs(ms: number): void {
  execFileSync(
    'node',
    ['-e', `Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ${ms})`],
    {
      stdio: 'ignore',
    },
  )
}

describe('REDHAT-FIX-17: latest bound verdict (pass OR fail) revokes prior pass', () => {
  let passThenFailSampleId = ''
  let solePassSampleId = ''
  let soleFailSampleId = ''

  beforeAll(() => {
    mkdirSync(EVIDENCE_DIR, { recursive: true })

    const founderSetup = runConvex(
      'testSupport:devSetupFounderUser',
      { clerkUserId: 'test:s4t17-founder', role: 'founder' },
      FOUNDER,
    )
    expect(founderSetup.ok, `founder setup failed: ${founderSetup.combined}`).toBe(true)

    const operatorSetup = runConvex(
      'testSupport:devSetupFounderUser',
      { clerkUserId: 'test:s4t17-operator', role: 'operator' },
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
  function freezeAndActivate(sampleId: string): { routes: { routeId: string }[] } {
    const assemble = runConvex(
      'couchSampleAssembler:assembleCouchSample',
      { targetSize: 25, sampleId },
      OPERATOR,
    )
    expect(assemble.ok, `assemble ${sampleId} failed: ${assemble.combined}`).toBe(true)
    const sample = JSON.parse(assemble.combined)

    const activate = runConvex(
      'couchVerdict:activateCouchManifest',
      { sampleId, reason: `s4t17 activate ${sampleId}` },
      OPERATOR,
    )
    expect(activate.ok, `activate ${sampleId} failed: ${activate.combined}`).toBe(true)
    return sample
  }

  function allTrueRouteVerdicts(routes: { routeId: string }[]) {
    return routes.map((r) => ({ routeId: r.routeId, verdict: 'true' as const }))
  }

  function failRouteVerdicts(routes: { routeId: string }[]) {
    // Explicit fail: first route 'wrong', rest 'true' — accepted by resolveOverallVerdict.
    return routes.map((r, i) => ({
      routeId: r.routeId,
      verdict: (i === 0 ? 'wrong' : 'true') as 'true' | 'wrong',
    }))
  }

  function recordVerdict(
    sampleId: string,
    overall: 'pass' | 'fail',
    routes: { routeId: string }[],
  ) {
    const routeVerdicts =
      overall === 'pass' ? allTrueRouteVerdicts(routes) : failRouteVerdicts(routes)
    const record = runConvex(
      'couchVerdict:recordCouchVerdict',
      { sampleId, overallVerdict: overall, routeVerdicts },
      OPERATOR,
    )
    expect(record.ok, `record ${overall} ${sampleId} failed: ${record.combined}`).toBe(true)
    return JSON.parse(record.combined)
  }

  it('AC-1: pass@t1 → fail@t2 → allowed===false and runAllWaterfall throws COUCH_GATE_BLOCKED', () => {
    passThenFailSampleId = uniqueSampleId('redhatfix17-revoke')
    const sample = freezeAndActivate(passThenFailSampleId)

    // t1: operator records PASS
    const passRow = recordVerdict(passThenFailSampleId, 'pass', sample.routes)
    expect(passRow.overallVerdict).toBe('pass')

    // Ensure fail has a strictly later recordedAt than pass.
    sleepMs(25)

    // t2: operator records FAIL (append-only) — must revoke the earlier pass
    const failRow = recordVerdict(passThenFailSampleId, 'fail', sample.routes)
    expect(failRow.overallVerdict).toBe('fail')
    expect(failRow.recordedAt).toBeGreaterThan(passRow.recordedAt)

    const gate = gateStatus()
    writeFileSync(
      resolve(EVIDENCE_DIR, 'AC-1-gate-status.json'),
      JSON.stringify(
        {
          capturedAt: new Date().toISOString(),
          sampleId: passThenFailSampleId,
          gate,
          passRow,
          failRow,
        },
        null,
        2,
      ),
    )

    expect(
      gate.allowed,
      `pass@t1 then fail@t2 must BLOCK (latest is fail), but was allowed (reason: ${gate.reason}, overallVerdict: ${gate.overallVerdict})`,
    ).toBe(false)
    expect(gate.sampleId).toBe(passThenFailSampleId)

    // End-to-end sink: runAllWaterfall must throw COUCH_GATE_BLOCKED.
    const all = runConvex(
      'couchVerdict:runAllWaterfall',
      { routeIds: ['test:s4t17-r1'], maxCost: 1 },
      OPERATOR,
    )
    writeFileSync(
      resolve(EVIDENCE_DIR, 'AC-1-runAllWaterfall.json'),
      JSON.stringify({ ok: all.ok, combined: all.combined.slice(0, 2000) }, null, 2),
    )
    expect(all.ok, `runAllWaterfall should have thrown COUCH_GATE_BLOCKED`).toBe(false)
    expect(all.combined).toMatch(/COUCH_GATE_BLOCKED/)
  }, 180000)

  it('AC-2: sole latest bound PASS still unlocks (allowed===true, overallVerdict===pass)', () => {
    solePassSampleId = uniqueSampleId('redhatfix17-sole-pass')
    const sample = freezeAndActivate(solePassSampleId)
    recordVerdict(solePassSampleId, 'pass', sample.routes)

    const gate = gateStatus()
    writeFileSync(
      resolve(EVIDENCE_DIR, 'AC-2-gate-status.json'),
      JSON.stringify(
        { capturedAt: new Date().toISOString(), sampleId: solePassSampleId, gate },
        null,
        2,
      ),
    )

    expect(gate.allowed, `sole latest pass must ALLOW, but blocked (reason: ${gate.reason})`).toBe(
      true,
    )
    expect(gate.overallVerdict).toBe('pass')
    expect(gate.sampleId).toBe(solePassSampleId)
  }, 180000)

  it('AC-3: sole latest FAIL blocks --all (allowed===false, COUCH_GATE_BLOCKED)', () => {
    soleFailSampleId = uniqueSampleId('redhatfix17-sole-fail')
    const sample = freezeAndActivate(soleFailSampleId)
    recordVerdict(soleFailSampleId, 'fail', sample.routes)

    const gate = gateStatus()
    writeFileSync(
      resolve(EVIDENCE_DIR, 'AC-3-gate-status.json'),
      JSON.stringify(
        { capturedAt: new Date().toISOString(), sampleId: soleFailSampleId, gate },
        null,
        2,
      ),
    )

    expect(
      gate.allowed,
      `sole latest fail must BLOCK, but was allowed (reason: ${gate.reason})`,
    ).toBe(false)
    expect(gate.sampleId).toBe(soleFailSampleId)

    const all = runConvex(
      'couchVerdict:runAllWaterfall',
      { routeIds: ['test:s4t17-r1'], maxCost: 1 },
      OPERATOR,
    )
    expect(all.ok, `runAllWaterfall should have thrown COUCH_GATE_BLOCKED`).toBe(false)
    expect(all.combined).toMatch(/COUCH_GATE_BLOCKED/)
  }, 180000)

  it('AC-4: getCouchVerdict latest is fail and matches gate authority (allowed===false)', () => {
    // Reuse AC-1 fixture if present; otherwise seed a fresh pass-then-fail.
    let sampleId = passThenFailSampleId
    if (!sampleId) {
      sampleId = uniqueSampleId('redhatfix17-ac4')
      const sample = freezeAndActivate(sampleId)
      recordVerdict(sampleId, 'pass', sample.routes)
      sleepMs(25)
      recordVerdict(sampleId, 'fail', sample.routes)
    } else {
      // Ensure this sample is the active activation again (AC-2/3 may have rotated).
      const activate = runConvex(
        'couchVerdict:activateCouchManifest',
        { sampleId, reason: 's4t17 re-activate pass-then-fail for AC-4' },
        OPERATOR,
      )
      expect(activate.ok, `re-activate for AC-4 failed: ${activate.combined}`).toBe(true)
    }

    const verdictResult = runConvex('couchVerdict:getCouchVerdict', { sampleId }, OPERATOR)
    expect(verdictResult.ok, `getCouchVerdict failed: ${verdictResult.combined}`).toBe(true)
    const latest = JSON.parse(verdictResult.combined)

    const gate = gateStatus()
    writeFileSync(
      resolve(EVIDENCE_DIR, 'AC-4-getCouchVerdict-vs-gate.json'),
      JSON.stringify(
        {
          capturedAt: new Date().toISOString(),
          sampleId,
          getCouchVerdict: {
            overallVerdict: latest?.overallVerdict,
            recordedAt: latest?.recordedAt,
            sampleId: latest?.sampleId,
          },
          gate,
        },
        null,
        2,
      ),
    )

    expect(latest?.overallVerdict, 'getCouchVerdict must return LATEST overallVerdict=fail').toBe(
      'fail',
    )
    expect(
      gate.allowed,
      `gate must BLOCK when latest verdict is fail (got allowed=${gate.allowed}, overallVerdict=${gate.overallVerdict})`,
    ).toBe(false)
    expect(gate.sampleId).toBe(sampleId)
  }, 180000)
})
