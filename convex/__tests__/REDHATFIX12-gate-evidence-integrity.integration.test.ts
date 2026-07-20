/**
 * REDHATFIX12 — gate-evidence integrity harness (REDHAT-FIX-12).
 *
 * Red-hat review 2026-07-20T221805Z (CRITICAL): the blocked sentinel was
 * hand-authored and could again be made internally inconsistent; no
 * machine-derived writer, stale-bundle validator, or FIX-12 integration test
 * existed, and the retained forged scripts still carried the removed seam and a
 * bare non-operator closeout identity.
 *
 * This test proves the harness:
 *   AC-1: deriveGoalState FAILS CLOSED on any BLOCKED/FAIL step (met:false,
 *         'GATE-GOAL: BLOCKED', nonzero exit) and a hand-supplied met:true
 *         cannot survive.
 *   AC-2: the retained forged bundle is rejected (STALE_EVIDENCE_BUNDLE) with
 *         capturedCommit != HEAD, and no met:true goal-state is written.
 *   AC-3: rebuilt step4 (recordCouchVerdict) + step7 (disposition) scripts pass
 *         under a seeded operator and are FORBIDDEN under a bare identity.
 *   AC-4: the human Founder-Operator review is never synthesized (pending).
 *   AC-5: rebuilt step3 (operator-gated export) + step5 (getCouchVerdict) pass
 *         under the operator; step3 is FORBIDDEN under bare; step5 never
 *         returns a synthesized/forged pass.
 *
 * TEST_TIER: integration
 * VERIFICATION_SERVICE: deriveGoalState writer + Convex dev deployment
 * FLOW_REF: UC-VER-05 (gate-evidence anti-forgery)
 */

import { execFileSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { deriveGoalState, validateBundle } from '../../tools/gate/deriveGoalState'

const PROJECT_ROOT = resolve(__dirname, '..', '..')
const DERIVE_PATH = resolve(PROJECT_ROOT, 'tools/gate/deriveGoalState.ts')
const SCRIPTS = resolve(
  PROJECT_ROOT,
  '.spec/prds/route-agent-quality/tasks/sprint-04-trust-pipeline/.gate-evidence/2026-07-19T22:59:46Z/scripts',
)
const FORGED = resolve(
  PROJECT_ROOT,
  '.spec/prds/route-agent-quality/tasks/sprint-04-trust-pipeline/.gate-evidence/2026-07-19T22:59:46Z',
)

const FOUNDER = JSON.stringify({ subject: 'test:s4t12-founder', issuer: 'https://laneshadow.test' })
const OPERATOR = JSON.stringify({
  subject: 'test:s4t12-operator',
  issuer: 'https://laneshadow.test',
})
const BARE = JSON.stringify({ subject: 's4-human-gate', issuer: 'https://laneshadow.test' })

let tmpDir: string

interface RunResult {
  ok: boolean
  combined: string
}

function runConvex(fn: string, args: Record<string, unknown>, identity: string): RunResult {
  try {
    const stdout = execFileSync(
      'npx',
      ['convex', 'run', fn, JSON.stringify(args), '--identity', identity],
      { cwd: PROJECT_ROOT, encoding: 'utf-8', timeout: 120000, stdio: ['pipe', 'pipe', 'pipe'] },
    )
    return { ok: true, combined: stdout }
  } catch (err: any) {
    return {
      ok: false,
      combined: `${typeof err.stdout === 'string' ? err.stdout : ''}${typeof err.stderr === 'string' ? err.stderr : ''}`,
    }
  }
}

interface CliResult {
  code: number
  stdout: string
  stderr: string
}

function runDeriveCli(args: string[]): CliResult {
  try {
    const stdout = execFileSync('npx', ['tsx', DERIVE_PATH, ...args], {
      cwd: PROJECT_ROOT,
      encoding: 'utf-8',
      timeout: 60000,
      stdio: ['pipe', 'pipe', 'pipe'],
    })
    return { code: 0, stdout, stderr: '' }
  } catch (err: any) {
    return {
      code: typeof err.status === 'number' ? err.status : 1,
      stdout: typeof err.stdout === 'string' ? err.stdout : '',
      stderr: typeof err.stderr === 'string' ? err.stderr : '',
    }
  }
}

function runScript(name: string, identity: string): RunResult {
  const env = { ...process.env, GATE_IDENTITY: identity }
  try {
    const stdout = execFileSync('bash', [join(SCRIPTS, name)], {
      cwd: PROJECT_ROOT,
      encoding: 'utf-8',
      timeout: 180000,
      stdio: ['pipe', 'pipe', 'pipe'],
      env,
    })
    return { ok: true, combined: stdout }
  } catch (err: any) {
    return {
      ok: false,
      combined: `${typeof err.stdout === 'string' ? err.stdout : ''}${typeof err.stderr === 'string' ? err.stderr : ''}`,
    }
  }
}

function writeStepResults(file: string, steps: any[], founderVerdict = false): void {
  writeFileSync(
    file,
    JSON.stringify({ sprintId: 'sprint-04-trust-pipeline', founderVerdict, steps }),
  )
}

describe('REDHATFIX12: gate-evidence integrity harness (REDHAT-FIX-12)', () => {
  beforeAll(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 's4t12-'))
    // Bootstrap a founder (for cleanup) + ensure the operator identity exists.
    const founder = runConvex(
      'testSupport:devSetupFounderUser',
      { clerkUserId: 'test:s4t12-founder', role: 'founder' },
      FOUNDER,
    )
    expect(founder.ok, `founder setup failed: ${founder.combined}`).toBe(true)
    const operator = runConvex(
      'testSupport:devSetupFounderUser',
      { clerkUserId: 'test:s4t12-operator', role: 'founder' },
      OPERATOR,
    )
    expect(operator.ok, `operator setup failed: ${operator.combined}`).toBe(true)
  })

  afterAll(() => {
    runConvex('couchVerdict:clearCouchVerdictsPublic', {}, FOUNDER)
    runConvex('couchVerdict:clearCouchManifestActivations', {}, FOUNDER)
    runConvex('couchSampleAssembler:teardownCouchFixturesPublic', {}, FOUNDER)
  })

  it('AC-1: goal-state writer fails closed on any BLOCKED/FAIL step; no hand-supplied met:true survives', () => {
    const steps = [
      { n: 1, result: 'BLOCKED' },
      ...[2, 3, 4, 5, 6, 7, 8].map((n) => ({ n, result: 'PASS' })),
    ]
    // Function-level: met is DERIVED from step results, never accepted from caller.
    const state = deriveGoalState({ steps, headCommit: 'deadbeef'.repeat(5) })
    expect(state.met).toBe(false)
    expect(state.goal).toBe('GATE-GOAL: BLOCKED')
    expect(state.gate.overall).toBe('BLOCKED')
    expect(state.exitCode).not.toBe(0)

    // CLI writer: emits met:false + nonzero exit + 'GATE-GOAL: BLOCKED' file.
    const stepsFile = join(tmpDir, 'blocked.json')
    const outFile = join(tmpDir, 'goalstate-ac1.json')
    writeStepResults(stepsFile, steps)
    const cli = runDeriveCli([
      '--step-results',
      stepsFile,
      '--out',
      outFile,
      '--head-commit',
      'abcdef0123456789',
    ])
    expect(cli.code, `writer must exit nonzero on a BLOCKED step`).not.toBe(0)
    expect(existsSync(outFile), `writer must still emit a goal-state file`).toBe(true)
    const written = JSON.parse(readFileSync(outFile, 'utf-8'))
    expect(written.met).toBe(false)
    expect(written.goal).toBe('GATE-GOAL: BLOCKED')
    expect(written.gate.overall).toBe('BLOCKED')
    expect(written.generator.written_by).toBe('tools/gate/deriveGoalState.ts')
    // A hand-supplied met:true cannot survive: even all-PASS steps stay false
    // absent a genuine founder verdict.
    const allPass = [1, 2, 3, 4, 5, 6, 7, 8].map((n) => ({ n, result: 'PASS' }))
    const noFounder = deriveGoalState({ steps: allPass, headCommit: 'cafef00d'.repeat(5) })
    expect(noFounder.met).toBe(false)
  })

  it('AC-2: stale/forged evidence bundle is rejected (STALE_EVIDENCE_BUNDLE); no met:true written', () => {
    const head = execFileSync('git', ['rev-parse', 'HEAD'], {
      cwd: PROJECT_ROOT,
      encoding: 'utf-8',
    }).trim()

    // Function-level: the retained forged bundle is invalid.
    const v = validateBundle(FORGED, head)
    expect(v.ok).toBe(false)
    if (!v.ok) {
      expect(v.code).toBe('STALE_EVIDENCE_BUNDLE')
      expect(v.details.capturedCommit).not.toBe(v.details.headCommit)
      expect(v.details.capturedCommit.length).toBe(40)
    }

    // CLI writer: rejects the forged bundle, exits nonzero, writes NO goal-state.
    const stepsFile = join(tmpDir, 'allpass.json')
    const outFile = join(tmpDir, 'goalstate-ac2.json')
    writeStepResults(
      stepsFile,
      [1, 2, 3, 4, 5, 6, 7, 8].map((n) => ({ n, result: 'PASS' })),
      true,
    )
    const cli = runDeriveCli([
      '--step-results',
      stepsFile,
      '--out',
      outFile,
      '--bundle',
      FORGED,
      '--head-commit',
      head,
    ])
    expect(cli.code, `forged bundle must be rejected`).not.toBe(0)
    expect(cli.stderr).toMatch(/STALE_EVIDENCE_BUNDLE/)
    expect(cli.stderr).toMatch(/seam_detected|bare_closeout_identity/)
    expect(existsSync(outFile), `no goal-state written for a stale bundle`).toBe(false)
  })

  it('AC-3: rebuilt step4/step7 pass under a seeded operator and are FORBIDDEN under a bare identity', () => {
    runConvex('couchVerdict:clearCouchVerdictsPublic', {}, FOUNDER)
    runConvex('couchVerdict:clearCouchManifestActivations', {}, FOUNDER)

    // step3 sets up the frozen sample consumed by step4 (operator identity).
    const s3 = runScript('step3.sh', OPERATOR)
    expect(s3.ok, `step3 operator failed: ${s3.combined}`).toBe(true)

    // step4 (recordCouchVerdict) under the operator — rows written by operator.
    const s4 = runScript('step4.sh', OPERATOR)
    expect(s4.ok, `step4 operator failed: ${s4.combined}`).toBe(true)
    const verdict = JSON.parse(readFileSync('/tmp/s4t12-verdict-pass.json', 'utf-8'))
    expect(verdict.recordedBy).toBe('test:s4t12-operator')
    expect(verdict.overallVerdict).toBe('pass')

    // step7 (disposition) under the operator — dispositions complete.
    const s7 = runScript('step7.sh', OPERATOR)
    expect(s7.ok, `step7 operator failed: ${s7.combined}`).toBe(true)

    // Negative control: bare identity is FORBIDDEN from the operator-gated writes.
    const s4Bare = runScript('step4.sh', BARE)
    expect(s4Bare.ok, `bare must be FORBIDDEN from recordCouchVerdict`).toBe(false)
    expect(s4Bare.combined).toMatch(/FORBIDDEN/)

    const s7Bare = runScript('step7.sh', BARE)
    expect(s7Bare.ok, `bare must be FORBIDDEN from disposition`).toBe(false)
    expect(s7Bare.combined).toMatch(/FORBIDDEN/)
  }, 300000)

  it('AC-4: harness never fabricates the human founder review (stays pending)', () => {
    const steps = [
      { n: 1, result: 'BLOCKED' },
      ...[2, 3, 4, 5, 6, 7, 8].map((n) => ({ n, result: 'PASS' })),
    ]
    const state = deriveGoalState({ steps, headCommit: 'feedface'.repeat(5) })
    expect(state.human_test.verdict).toBe('pending')
    expect(state.human_test.note).toMatch(/S4-T7|review required|human/i)

    // Even all-PASS steps keep human_test pending absent a genuine verdict.
    const allPass = [1, 2, 3, 4, 5, 6, 7, 8].map((n) => ({ n, result: 'PASS' }))
    const noFounder = deriveGoalState({ steps: allPass, headCommit: 'feedface'.repeat(5) })
    expect(noFounder.human_test.verdict).toBe('pending')
  })

  it('AC-5: rebuilt step3 export + step5 getCouchVerdict pass under operator; step3 FORBIDDEN under bare; step5 never synthesizes a pass', () => {
    // step5 getCouchVerdict returns the operator-recorded verdict (from AC-3).
    const s5 = runScript('step5.sh', OPERATOR)
    expect(s5.ok, `step5 operator failed: ${s5.combined}`).toBe(true)
    const out = JSON.parse(
      s5.combined
        .split('\n')
        .filter((l) => l.startsWith('{'))
        .pop() ?? '{}',
    )
    expect(out.recordedBy).toBe('test:s4t12-operator')
    expect(out.synthesized).toBe(false)
    expect(out.overallVerdict).toBe('pass')

    // Negative control: bare identity is FORBIDDEN from the operator-gated export
    // (assembleCouchSample = requireOperatorAction).
    const s3Bare = runScript('step3.sh', BARE)
    expect(s3Bare.ok, `bare must be FORBIDDEN from the operator-gated export`).toBe(false)
    expect(s3Bare.combined).toMatch(/FORBIDDEN/)
  }, 300000)
})
