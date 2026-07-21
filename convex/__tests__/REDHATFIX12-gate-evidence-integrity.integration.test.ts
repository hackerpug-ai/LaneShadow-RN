/**
 * REDHATFIX12 — non-forgeable gate-evidence harness (REDHAT-FIX-12 v3).
 *
 * Red-hat review 2026-07-21T005254Z (2 CRITICAL, 1 HIGH, 1 MEDIUM, 1 LOW): the
 * v2 writer still permitted completion authority from a caller-controlled
 * evidence tree (working-tree manifest, directory-level freshness, `../`
 * traversal) and accepted any latest pass row.
 *
 * This suite proves the v3 hardened contract:
 *   AC-1..AC-9 preserved (fail-closed steps, stale/forged bundle, operator-gated
 *     scripts, never-fabricated human review, export/read scripts, founder-from-
 *     durable-source, internal HEAD, mandatory manifest, step substantiation).
 *   AC-10: two-object attested_source_commit/attestation_commit strict-descendant
 *     provenance (replaces the impossible self-HEAD-equality claim).
 *   AC-11: manifest + artifacts resolved from immutable HEAD-bound content with
 *     PER-FILE freshness (dirty-tree → MANIFEST_NOT_HEAD_BOUND; directory-
 *     laundering → EVIDENCE_FILE_STALE).
 *   AC-12: realpath artifact containment BEFORE tracking (../traversal →
 *     ARTIFACT_PATH_ESCAPE).
 *   AC-13: founder attestation bound to couchGateStatus.allowed===true + exact
 *     sampleId/manifestHash/catalogVersion + non-test operator identity.
 *
 * AC-13 POSITIVE binding logic is proven via the PURE evaluateFounderAttestation
 * helper with labeled synthetic inputs (never fabricated live evidence; cannot
 * affect deriveGoalState authority, which uses the live fail-closed resolver).
 * The LIVE AC-13 cases are honest NEGATIVES (historic-inactive pass; test-
 * operator pass rejected even when the gate is allowed). The real Founder-Operator
 * S4-T7 gate stays pending.
 */

import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import {
  deriveGoalState,
  type EvidenceManifest,
  gitHeadInternal,
  type StepResult,
  substantiateSteps,
  validateBundle,
} from '../../tools/gate/deriveGoalState'
import {
  evaluateFounderAttestation,
  type GateStatusRow,
  resolveFounderVerdict,
  type VerdictRow,
} from '../../tools/gate/resolveFounderVerdict'
import { verifyEvidenceManifest } from '../../tools/gate/verifyEvidenceManifest'
import { verifyProvenance } from '../../tools/gate/verifyProvenance'

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

const ALL_PASS: StepResult[] = [1, 2, 3, 4, 5, 6, 7, 8].map((n) => ({ n, result: 'PASS' as const }))
const BLOCKED: StepResult[] = [
  { n: 1, result: 'BLOCKED' },
  ...[2, 3, 4, 5, 6, 7, 8].map((n) => ({ n, result: 'PASS' as const })),
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function git(args: string[], cwd: string): string {
  try {
    return execFileSync('git', args, {
      cwd,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim()
  } catch {
    return ''
  }
}

interface RunResult {
  ok: boolean
  combined: string
}

function runConvex(fn: string, args: Record<string, unknown>, identity: string): RunResult {
  try {
    const stdout = execFileSync(
      'npx',
      ['convex', 'run', fn, JSON.stringify(args), '--identity', identity],
      {
        cwd: PROJECT_ROOT,
        encoding: 'utf-8',
        timeout: 120000,
        stdio: ['pipe', 'pipe', 'pipe'],
      },
    )
    return { ok: true, combined: stdout }
  } catch (e: any) {
    return {
      ok: false,
      combined: `${typeof e.stdout === 'string' ? e.stdout : ''}${typeof e.stderr === 'string' ? e.stderr : ''}`,
    }
  }
}

function convexJSON(r: RunResult): Record<string, unknown> | null {
  const trimmed = r.combined
    .split('\n')
    .filter((l) => !l.includes('node-linker'))
    .join('')
    .trim()
  if (!trimmed) return null
  try {
    const v = JSON.parse(trimmed)
    return v === null ? null : (v as Record<string, unknown>)
  } catch {
    const s = trimmed.indexOf('{')
    const e = trimmed.lastIndexOf('}')
    if (s >= 0 && e > s) {
      try {
        return JSON.parse(trimmed.slice(s, e + 1)) as Record<string, unknown>
      } catch {
        return null
      }
    }
    return null
  }
}

interface CliResult {
  code: number
  stdout: string
  stderr: string
}

function runDeriveCli(args: string[], cwd = PROJECT_ROOT): CliResult {
  try {
    const stdout = execFileSync('npx', ['tsx', DERIVE_PATH, ...args], {
      cwd,
      encoding: 'utf-8',
      timeout: 90000,
      stdio: ['pipe', 'pipe', 'pipe'],
    })
    return { code: 0, stdout, stderr: '' }
  } catch (e: any) {
    return {
      code: typeof e.status === 'number' ? e.status : 1,
      stdout: typeof e.stdout === 'string' ? e.stdout : '',
      stderr: typeof e.stderr === 'string' ? e.stderr : '',
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
  } catch (e: any) {
    return {
      ok: false,
      combined: `${typeof e.stdout === 'string' ? e.stdout : ''}${typeof e.stderr === 'string' ? e.stderr : ''}`,
    }
  }
}

function makeTempRepo(): string {
  const root = mkdtempSync(join(tmpdir(), 's4t12-repo-'))
  git(['init', '-q'], root)
  git(['config', 'user.email', 'gate-test@laneshadow.test'], root)
  git(['config', 'user.name', 'Gate Test'], root)
  writeFileSync(join(root, 'README.md'), '# temp gate repo\n')
  git(['add', '-A'], root)
  git(['commit', '-q', '-m', 'init'], root)
  return root
}

function commitAll(root: string, msg: string): void {
  git(['add', '-A'], root)
  git(['commit', '-q', '-m', msg], root)
}

function cleanState(): void {
  runConvex('couchVerdict:clearCouchVerdictsPublic', {}, FOUNDER)
  runConvex('couchVerdict:clearCouchManifestActivations', {}, FOUNDER)
}

function manifestForSteps(steps: number[], artifactFile: string): EvidenceManifest {
  const evidence_steps: Record<string, { result: string; artifacts: string[] }> = {}
  for (const n of steps) evidence_steps[String(n)] = { result: 'PASS', artifacts: [artifactFile] }
  return { version: 1, evidence_steps }
}

/** REDHAT-FIX-18: full canonical 1..8 evidence_steps (each with its own artifact). */
function fullCanonicalManifest(root: string, bundleRel: string): EvidenceManifest {
  const evidence_steps: Record<string, { result: string; artifacts: string[] }> = {}
  mkdirSync(join(root, bundleRel, 'evidence'), { recursive: true })
  for (const n of [1, 2, 3, 4, 5, 6, 7, 8]) {
    const art = `evidence/step${n}.json`
    writeFileSync(join(root, bundleRel, art), JSON.stringify({ step: n, ok: true }))
    evidence_steps[String(n)] = { result: 'PASS', artifacts: [art] }
  }
  return { version: 1, evidence_steps }
}

/** Full allowed-gate recipe with the TEST operator (test:s4t12-operator). */
function seedAllowedGateTestOp(): {
  sampleId: string
  manifestHash: string
  catalogVersion: string
} {
  runConvex('couchSampleAssembler:seedCouchFixturesPublic', {}, OPERATOR)
  const assemble = runConvex(
    'couchSampleAssembler:assembleCouchSample',
    { targetSize: 25 },
    OPERATOR,
  )
  const sample = convexJSON(assemble)!
  const sampleId = sample.sampleId as string
  const routes = (sample.routes as { routeId: string }[]) ?? []
  const fm = convexJSON(runConvex('couchSampleAssembler:getCouchSample', { sampleId }, OPERATOR))!
  runConvex('couchVerdict:activateCouchManifest', { sampleId, reason: 's4t12-ac13' }, OPERATOR)
  const routeVerdicts = routes.map((r) => ({ routeId: r.routeId, verdict: 'true' }))
  runConvex(
    'couchVerdict:recordCouchVerdict',
    { sampleId, overallVerdict: 'pass', routeVerdicts },
    OPERATOR,
  )
  return {
    sampleId,
    manifestHash: fm.manifestHash as string,
    catalogVersion: (fm.catalogVersion as string) ?? '',
  }
}

/** Historic pass for a NON-activated (inactive) sample — couchGateStatus.allowed stays false. */
function seedHistoricInactivePass(): { sampleId: string } {
  runConvex('couchSampleAssembler:seedCouchFixturesPublic', {}, OPERATOR)
  const assemble = runConvex(
    'couchSampleAssembler:assembleCouchSample',
    { targetSize: 25 },
    OPERATOR,
  )
  const sample = convexJSON(assemble)!
  const sampleId = sample.sampleId as string
  const routes = (sample.routes as { routeId: string }[]) ?? []
  const routeVerdicts = routes.map((r) => ({ routeId: r.routeId, verdict: 'true' }))
  // Deliberately NO activateCouchManifest → no active manifest → couchGateStatus.allowed === false.
  runConvex(
    'couchVerdict:recordCouchVerdict',
    { sampleId, overallVerdict: 'pass', routeVerdicts },
    OPERATOR,
  )
  return { sampleId }
}

const CLI_TMP = mkdtempSync(join(tmpdir(), 's4t12-cli-'))

describe('REDHATFIX12: non-forgeable gate-evidence harness (REDHAT-FIX-12 v3)', () => {
  beforeAll(() => {
    const f = runConvex(
      'testSupport:devSetupFounderUser',
      { clerkUserId: 'test:s4t12-founder', role: 'founder' },
      FOUNDER,
    )
    expect(f.ok, `founder setup: ${f.combined}`).toBe(true)
    const o = runConvex(
      'testSupport:devSetupFounderUser',
      { clerkUserId: 'test:s4t12-operator', role: 'founder' },
      OPERATOR,
    )
    expect(o.ok, `operator setup: ${o.combined}`).toBe(true)
    cleanState()
  })

  afterAll(() => {
    cleanState()
    runConvex('couchSampleAssembler:teardownCouchFixturesPublic', {}, FOUNDER)
    rmSync(CLI_TMP, { recursive: true, force: true })
  })

  // -------------------------------------------------- AC-1
  it('AC-1: fails closed on any BLOCKED/FAIL step; met derived, never caller-supplied', () => {
    cleanState()
    const state = deriveGoalState({
      steps: BLOCKED,
      repoCwd: PROJECT_ROOT,
      convexRepoCwd: PROJECT_ROOT,
    })
    expect(state.met).toBe(false)
    expect(state.goal).toBe('GATE-GOAL: BLOCKED')
    expect(state.gate.overall).toBe('BLOCKED')
    expect(state.exitCode).not.toBe(0)
    expect(
      deriveGoalState({ steps: ALL_PASS, repoCwd: PROJECT_ROOT, convexRepoCwd: PROJECT_ROOT }).met,
    ).toBe(false)
    const stepsFile = join(CLI_TMP, 'ac1.json')
    writeFileSync(
      stepsFile,
      JSON.stringify({ sprintId: 'sprint-04-trust-pipeline', steps: BLOCKED }),
    )
    const outFile = join(CLI_TMP, 'ac1-out.json')
    const cli = runDeriveCli(['--step-results', stepsFile, '--out', outFile])
    expect(cli.code).not.toBe(0)
    expect(existsSync(outFile)).toBe(true)
    expect(JSON.parse(readFileSync(outFile, 'utf-8')).met).toBe(false)
  }, 120000)

  // -------------------------------------------------- AC-2
  it('AC-2: stale/forged evidence bundle rejected (STALE_EVIDENCE_BUNDLE); no met:true write', () => {
    const head = gitHeadInternal(PROJECT_ROOT)
    const v = validateBundle(FORGED, head, PROJECT_ROOT)
    expect(v.ok).toBe(false)
    if (!v.ok) {
      expect(v.code).toBe('STALE_EVIDENCE_BUNDLE')
      expect(v.details.capturedCommit).not.toBe(v.details.headCommit)
    }
    const stepsFile = join(CLI_TMP, 'ac2.json')
    const outFile = join(CLI_TMP, 'ac2-out.json')
    writeFileSync(stepsFile, JSON.stringify({ steps: ALL_PASS, founderVerdict: true }))
    const cli = runDeriveCli(['--step-results', stepsFile, '--out', outFile, '--bundle', FORGED])
    expect(cli.code).not.toBe(0)
    expect(cli.stderr).toMatch(/STALE_EVIDENCE_BUNDLE/)
    expect(existsSync(outFile)).toBe(false)
  })

  // -------------------------------------------------- AC-3
  it('AC-3: rebuilt step4/step7 pass under operator; FORBIDDEN under bare identity', () => {
    cleanState()
    expect(runScript('step3.sh', OPERATOR).ok).toBe(true)
    expect(runScript('step4.sh', OPERATOR).ok).toBe(true)
    expect(JSON.parse(readFileSync('/tmp/s4t12-verdict-pass.json', 'utf-8')).recordedBy).toBe(
      'test:s4t12-operator',
    )
    expect(runScript('step7.sh', OPERATOR).ok).toBe(true)
    expect(runScript('step4.sh', BARE).combined).toMatch(/FORBIDDEN/)
    expect(runScript('step7.sh', BARE).combined).toMatch(/FORBIDDEN/)
  }, 300000)

  // -------------------------------------------------- AC-4
  it('AC-4: never fabricates the human founder review (stays pending)', () => {
    cleanState()
    const state = deriveGoalState({
      steps: BLOCKED,
      repoCwd: PROJECT_ROOT,
      convexRepoCwd: PROJECT_ROOT,
    })
    expect(state.human_test.verdict).toBe('pending')
    expect(
      deriveGoalState({ steps: ALL_PASS, repoCwd: PROJECT_ROOT, convexRepoCwd: PROJECT_ROOT })
        .human_test.verdict,
    ).toBe('pending')
  }, 120000)

  // -------------------------------------------------- AC-5
  it('AC-5: rebuilt step3 export + step5 getCouchVerdict under operator; bare FORBIDDEN on step3', () => {
    cleanState()
    expect(runScript('step3.sh', OPERATOR).ok).toBe(true)
    expect(runScript('step4.sh', OPERATOR).ok).toBe(true)
    const s5 = runScript('step5.sh', OPERATOR)
    expect(s5.ok).toBe(true)
    const line =
      s5.combined
        .split('\n')
        .filter((l) => l.startsWith('{'))
        .pop() ?? '{}'
    const o = JSON.parse(line)
    expect(o.recordedBy).toBe('test:s4t12-operator')
    expect(o.synthesized).toBe(false)
    expect(runScript('step3.sh', BARE).combined).toMatch(/FORBIDDEN/)
  }, 300000)

  // -------------------------------------------------- AC-6
  it('AC-6: founder attestation from durable source (binding logic via pure helper); caller flag ignored live', () => {
    // CASE 1 (pure binding helper, isolated): a couchGateStatus-allowed, manifest-
    // bound pass recorded by a NON-test operator yields present=true. Synthetic
    // inputs — NOT live evidence, cannot affect deriveGoalState authority.
    const status: GateStatusRow = {
      allowed: true,
      sampleId: 'couch-real-1',
      manifestHash: 'mh-abc',
      catalogVersion: 'rev-abc',
    }
    const row: VerdictRow = {
      overallVerdict: 'pass',
      recordedBy: 'founder-justin',
      manifestHash: 'mh-abc',
      catalogVersion: 'rev-abc',
      sampleId: 'couch-real-1',
    }
    const att = evaluateFounderAttestation(status, row)
    expect(att.present).toBe(true)
    expect(att.recordedBy).toBe('founder-justin')
    expect(att.gateAllowed).toBe(true)
    // A test-prefixed recordedBy is rejected even with an allowed, bound row.
    expect(
      evaluateFounderAttestation(status, { ...row, recordedBy: 'test:s4t12-operator' }).present,
    ).toBe(false)
    // A manifestHash mismatch is rejected.
    expect(evaluateFounderAttestation(status, { ...row, manifestHash: 'mh-other' }).present).toBe(
      false,
    )

    // CASE 2 (live, honest negative): a JSON founderVerdict:true flag has ZERO
    // effect — the live resolver is fail-closed in dev (no non-test founder) so
    // met stays false and human_test stays pending.
    cleanState()
    const exploitFile = join(CLI_TMP, 'ac6.json')
    writeFileSync(exploitFile, JSON.stringify({ steps: ALL_PASS, founderVerdict: true }))
    const state = deriveGoalState({
      steps: ALL_PASS,
      repoCwd: PROJECT_ROOT,
      convexRepoCwd: PROJECT_ROOT,
    })
    expect(state.met).toBe(false)
    expect(state.human_test.verdict).toBe('pending')
    expect(state.gate.blocker).toMatch(/S4-T7|founder|human/i)
  }, 120000)

  // -------------------------------------------------- AC-7
  it('AC-7: HEAD computed internally; a forged --head-commit is inert', () => {
    const root = makeTempRepo()
    try {
      mkdirSync(join(root, '.gate-evidence/clean-stale/scripts'), { recursive: true })
      writeFileSync(
        join(root, '.gate-evidence/clean-stale/scripts/step1.sh'),
        '#!/bin/sh\necho harmless\n',
      )
      writeFileSync(
        join(root, '.gate-evidence/clean-stale/manifest.json'),
        JSON.stringify(manifestForSteps([1], 'evidence/step1.json')),
      )
      commitAll(root, 'add clean bundle')
      git(['commit', '-q', '--allow-empty', '-m', 'advance head'], root)
      const head = gitHeadInternal(root)
      const captured = git(['log', '-1', '--format=%H', '--', '.gate-evidence/clean-stale'], root)
      expect(captured).not.toBe(head)
      const bundle = join(root, '.gate-evidence/clean-stale')
      const v = validateBundle(bundle, head, root)
      expect(v.ok).toBe(false)
      if (!v.ok) {
        expect(v.code).toBe('STALE_EVIDENCE_BUNDLE')
        expect(v.details.headCommit).toBe(head)
      }
      const stepsFile = join(root, 'steps.json')
      writeFileSync(stepsFile, JSON.stringify({ steps: ALL_PASS }))
      const cli = runDeriveCli(
        [
          '--step-results',
          stepsFile,
          '--out',
          join(root, 'gs.json'),
          '--bundle',
          bundle,
          '--head-commit',
          captured,
        ],
        root,
      )
      expect(cli.code).not.toBe(0)
      expect(cli.stderr).toMatch(/STALE_EVIDENCE_BUNDLE/)
      const reported = JSON.parse(cli.stderr.split('\n').find((l) => l.includes('"code"')) ?? '{}')
      expect(reported.details?.headCommit).toBe(head)
      expect(reported.details?.headCommit).not.toBe(captured)
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  // -------------------------------------------------- AC-8
  it('AC-8: committed manifest mandatory — missing/untracked/clean-stale rejected', () => {
    const root = makeTempRepo()
    try {
      const head = gitHeadInternal(root)
      const v1 = validateBundle(join(root, '.gate-evidence/absent'), head, root)
      expect(v1.ok).toBe(false)
      if (!v1.ok) expect(v1.code).toBe('MISSING_EVIDENCE_BUNDLE')

      mkdirSync(join(root, '.gate-evidence/untracked/scripts'), { recursive: true })
      writeFileSync(join(root, '.gate-evidence/untracked/scripts/step1.sh'), '#!/bin/sh\necho x\n')
      writeFileSync(
        join(root, '.gate-evidence/untracked/manifest.json'),
        JSON.stringify(manifestForSteps([1], 'evidence/step1.json')),
      )
      expect(git(['ls-files', '--', '.gate-evidence/untracked'], root)).toBe('')
      const v2 = validateBundle(join(root, '.gate-evidence/untracked'), head, root)
      expect(v2.ok).toBe(false)
      if (!v2.ok) expect(v2.code).toBe('UNTRACKED_EVIDENCE_BUNDLE')

      mkdirSync(join(root, '.gate-evidence/clean-stale/scripts'), { recursive: true })
      writeFileSync(
        join(root, '.gate-evidence/clean-stale/scripts/step1.sh'),
        '#!/bin/sh\necho ok\n',
      )
      writeFileSync(
        join(root, '.gate-evidence/clean-stale/manifest.json'),
        JSON.stringify(manifestForSteps([1], 'evidence/step1.json')),
      )
      commitAll(root, 'clean stale bundle')
      git(['commit', '-q', '--allow-empty', '-m', 'advance'], root)
      const v3 = validateBundle(
        join(root, '.gate-evidence/clean-stale'),
        gitHeadInternal(root),
        root,
      )
      expect(v3.ok).toBe(false)
      if (!v3.ok) {
        expect(v3.code).toBe('STALE_EVIDENCE_BUNDLE')
        expect(v3.details.reason).toBe('stale_commit')
      }
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  // -------------------------------------------------- AC-9
  it('AC-9: step PASS claims substantiated against the manifest; tampering inert', () => {
    const root = makeTempRepo()
    try {
      const bundleRel = '.gate-evidence/corroborated'
      mkdirSync(join(root, bundleRel, 'evidence'), { recursive: true })
      for (const n of [1, 2, 3, 4, 5, 6, 7, 8])
        writeFileSync(join(root, bundleRel, `evidence/step${n}.json`), '{}')
      const manifest: EvidenceManifest = { version: 1, evidence_steps: {} }
      for (const n of [1, 2, 3, 4, 5, 6, 7, 8])
        manifest.evidence_steps[String(n)] = {
          result: 'PASS',
          artifacts: [`evidence/step${n}.json`],
        }
      writeFileSync(join(root, bundleRel, 'manifest.json'), JSON.stringify(manifest))
      commitAll(root, 'corroborated')
      const corroborated = join(root, bundleRel)
      expect(substantiateSteps(ALL_PASS, manifest, corroborated, root)).toBeNull()

      // Tampered: a SEPARATE bundle whose committed manifest LACKS step 1; a
      // step-results JSON flipping step 1 to PASS is uncorroborated end-to-end.
      const noStep1Rel = '.gate-evidence/corroborated-no-step1'
      mkdirSync(join(root, noStep1Rel, 'evidence'), { recursive: true })
      const noStep1: EvidenceManifest = { version: 1, evidence_steps: {} }
      for (const n of [2, 3, 4, 5, 6, 7, 8]) {
        noStep1.evidence_steps[String(n)] = {
          result: 'PASS',
          artifacts: [`evidence/step${n}.json`],
        }
        writeFileSync(join(root, noStep1Rel, `evidence/step${n}.json`), '{}')
      }
      writeFileSync(join(root, noStep1Rel, 'manifest.json'), JSON.stringify(noStep1))
      commitAll(root, 'corroborated without step 1')
      const noStep1Bundle = join(root, noStep1Rel)
      const tampered: StepResult[] = [
        { n: 1, result: 'PASS' },
        ...[2, 3, 4, 5, 6, 7, 8].map((n) => ({ n, result: 'PASS' as const })),
      ]
      const sub = substantiateSteps(tampered, noStep1, noStep1Bundle, root)
      expect(sub?.code).toBe('STEP_RESULT_UNSUBSTANTIATED')
      expect(sub?.details.step).toBe(1)
      const state = deriveGoalState({
        steps: tampered,
        bundlePath: noStep1Bundle,
        repoCwd: root,
        convexRepoCwd: root,
      })
      expect(state.met).toBe(false)
      // REDHAT-FIX-18: incomplete evidence_steps (missing step 1) fails closed at
      // verifyEvidenceManifest before per-claim substantiation; both codes prove
      // a supplied PASS cannot exceed the chosen/canonical manifest.
      expect(
        state.error?.code === 'STEP_RESULT_UNSUBSTANTIATED' ||
          state.error?.code === 'INCOMPLETE_EVIDENCE_STEPS' ||
          state.error?.code === 'INCOMPLETE_CANONICAL_STEPS',
      ).toBe(true)
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  // -------------------------------------------------- AC-10
  it('AC-10: two-object provenance — attestation_commit is a STRICT descendant of attested_source_commit', () => {
    const root = makeTempRepo()
    try {
      // Generate a sentinel at source commit S (records attested_source_commit=S).
      const stepsFile = join(root, '.gate-evidence', 'steps.json')
      mkdirSync(join(root, '.gate-evidence'), { recursive: true })
      writeFileSync(stepsFile, JSON.stringify({ steps: BLOCKED }))
      const sentinelPath = join(root, '.gate-evidence', 'sprint-goal-state.json')
      const state = deriveGoalState({
        steps: BLOCKED,
        repoCwd: root,
        convexRepoCwd: root,
        stepResultsPath: stepsFile,
      })
      expect(state.generator.attested_source_commit).toBe(gitHeadInternal(root))
      writeFileSync(sentinelPath, `${JSON.stringify(state, null, 2)}\n`)
      const sourceCommit = gitHeadInternal(root) // S
      commitAll(root, 'carry sentinel') // → attestation commit A (strict descendant of S)
      const attestationCommit = git(
        ['log', '-1', '--format=%H', '--', '.gate-evidence/sprint-goal-state.json'],
        root,
      )
      expect(attestationCommit).not.toBe(sourceCommit)

      // CASE 1: strict-descendant relation holds.
      const ok = verifyProvenance(sentinelPath, root)
      expect(ok.ok).toBe(true)
      if (ok.ok) {
        expect(ok.attested_source_commit).toBe(sourceCommit)
        expect(ok.attestation_commit).toBe(attestationCommit)
        expect(ok.relation).toBe('strict_descendant')
      }
      expect(state.generator.derived_from).toMatch(/^\.gate-evidence\//)

      // CASE 2 (negative): a sentinel whose attested_source_commit is UNRELATED
      // to its carrying commit (a distinct foreign commit, not an ancestor).
      const foreign = makeTempRepo()
      try {
        writeFileSync(join(foreign, 'FOREIGN-marker.md'), 'foreign-origin\n')
        commitAll(foreign, 'foreign distinct commit')
        const unrelated = gitHeadInternal(foreign)
        const forged = {
          ...state,
          generator: { ...state.generator, attested_source_commit: unrelated },
        }
        const forgedPath = join(root, '.gate-evidence', 'forged-sentinel.json')
        writeFileSync(forgedPath, `${JSON.stringify(forged, null, 2)}\n`)
        commitAll(root, 'carry forged sentinel')
        const bad = verifyProvenance(forgedPath, root)
        expect(bad.ok).toBe(false)
        if (!bad.ok) expect(bad.code).toBe('PROVENANCE_RELATION_INVALID')
      } finally {
        rmSync(foreign, { recursive: true, force: true })
      }
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  // -------------------------------------------------- AC-11
  it('AC-11: HEAD-bound manifest + PER-FILE freshness — dirty-tree and directory-laundering rejected', () => {
    const root = makeTempRepo()
    try {
      // CASE 1: dirty working-tree manifest → MANIFEST_NOT_HEAD_BOUND.
      // REDHAT-FIX-18: clean happy-path needs full canonical 1..8 evidence_steps.
      const bundleRel = '.gate-evidence/b'
      const cleanManifest = fullCanonicalManifest(root, bundleRel)
      writeFileSync(join(root, bundleRel, 'manifest.json'), JSON.stringify(cleanManifest))
      commitAll(root, 'clean bundle') // manifest + artifacts at HEAD
      const head = gitHeadInternal(root)
      const cleanBundle = join(root, bundleRel)
      expect(verifyEvidenceManifest(cleanBundle, head, root).ok).toBe(true)
      // Dirty: modify ONLY the working-tree manifest (repoint step1 to a different
      // artifact path) WITHOUT git add/commit — wt blob hash != HEAD blob hash.
      const dirtyManifest: EvidenceManifest = {
        version: 1,
        evidence_steps: {
          ...cleanManifest.evidence_steps,
          '1': { result: 'PASS', artifacts: ['evidence/step-other.json'] },
        },
      }
      writeFileSync(join(root, bundleRel, 'manifest.json'), JSON.stringify(dirtyManifest))
      const dirty = verifyEvidenceManifest(cleanBundle, head, root)
      expect(dirty.ok).toBe(false)
      if (!dirty.ok) expect(dirty.code).toBe('MANIFEST_NOT_HEAD_BOUND')

      // CASE 2: directory-laundered — manifest+artifact at parent P, unrelated
      // README under the same bundle at HEAD → EVIDENCE_FILE_STALE (per-file).
      // Freshness fails before completeness, so a partial set still proves the seam.
      const root2 = makeTempRepo()
      try {
        const b2 = '.gate-evidence/laundered'
        mkdirSync(join(root2, b2, 'evidence'), { recursive: true })
        writeFileSync(join(root2, b2, 'evidence/step1.json'), '{"ok":true}')
        writeFileSync(
          join(root2, b2, 'manifest.json'),
          JSON.stringify(manifestForSteps([1], 'evidence/step1.json')),
        )
        commitAll(root2, 'manifest+artifact at P') // P
        writeFileSync(join(root2, b2, 'README.md'), 'unrelated\n') // new file under SAME bundle dir
        commitAll(root2, 'unrelated README at HEAD') // HEAD
        const head2 = gitHeadInternal(root2)
        // Directory-level last-touch == HEAD, but per-file manifest last-touch == P.
        expect(git(['log', '-1', '--format=%H', '--', b2], root2)).toBe(head2)
        expect(git(['log', '-1', '--format=%H', '--', `${b2}/manifest.json`], root2)).not.toBe(
          head2,
        )
        const laundered = verifyEvidenceManifest(join(root2, b2), head2, root2)
        expect(laundered.ok).toBe(false)
        if (!laundered.ok) expect(laundered.code).toBe('EVIDENCE_FILE_STALE')
      } finally {
        rmSync(root2, { recursive: true, force: true })
      }
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  // -------------------------------------------------- AC-12
  it('AC-12: realpath containment BEFORE tracking — ../traversal rejected (ARTIFACT_PATH_ESCAPE)', () => {
    const root = makeTempRepo()
    try {
      // A tracked repo-root package.json (unrelated source, not gate evidence).
      writeFileSync(join(root, 'package.json'), '{"name":"unrelated"}')
      const bundleRel = '.gate-evidence/b'
      mkdirSync(join(root, bundleRel), { recursive: true })
      const manifest: EvidenceManifest = {
        version: 1,
        evidence_steps: { '1': { result: 'PASS', artifacts: ['../../package.json'] } },
      }
      writeFileSync(join(root, bundleRel, 'manifest.json'), JSON.stringify(manifest))
      commitAll(root, 'traversal manifest') // manifest + ../../package.json both tracked at HEAD
      const head = gitHeadInternal(root)
      const v = verifyEvidenceManifest(join(root, bundleRel), head, root)
      expect(v.ok).toBe(false)
      if (!v.ok) {
        expect(v.code).toBe('ARTIFACT_PATH_ESCAPE')
        expect(v.details.artifact).toBe('../../package.json')
      }
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  // -------------------------------------------------- AC-13
  it('AC-13: founder attestation bound to couchGateStatus.allowed + active manifest + non-test operator', () => {
    // CASE 1 (pure binding helper, isolated): allowed + manifest-bound + non-test
    // operator → present=true. Synthetic — not live evidence.
    const status: GateStatusRow = {
      allowed: true,
      sampleId: 'couch-real-1',
      manifestHash: 'mh-abc',
      catalogVersion: 'rev-abc',
    }
    const row: VerdictRow = {
      overallVerdict: 'pass',
      recordedBy: 'founder-justin',
      manifestHash: 'mh-abc',
      catalogVersion: 'rev-abc',
      sampleId: 'couch-real-1',
    }
    expect(evaluateFounderAttestation(status, row).present).toBe(true)
    // A non-allowed gate is rejected even with a valid row.
    expect(evaluateFounderAttestation({ ...status, allowed: false }, row).present).toBe(false)
    // A bare identity is rejected.
    expect(
      evaluateFounderAttestation(status, { ...row, recordedBy: 's4-human-gate' }).present,
    ).toBe(false)

    // CASE 2 (live honest negative): a historic/inactive pass (couchGateStatus
    // NOT allowed) yields present=false — the OLD getCouchVerdict({}) vector is closed.
    cleanState()
    const historic = seedHistoricInactivePass()
    const gateStatus = convexJSON(runConvex('couchVerdict:couchGateStatus', {}, OPERATOR))!
    expect(gateStatus.allowed).toBe(false)
    // The historic pass row exists (latest-across-all would return it)…
    const latestRow = convexJSON(
      runConvex('couchVerdict:getCouchVerdict', { sampleId: historic.sampleId }, OPERATOR),
    )
    expect(latestRow?.overallVerdict).toBe('pass')
    // …but the live resolver binds to couchGateStatus.allowed → present=false.
    const resolved = resolveFounderVerdict(PROJECT_ROOT)
    expect(resolved.present).toBe(false)
    const state = deriveGoalState({
      steps: ALL_PASS,
      repoCwd: PROJECT_ROOT,
      convexRepoCwd: PROJECT_ROOT,
    })
    expect(state.met).toBe(false)
    expect(state.human_test.verdict).toBe('pending')

    // CASE 3 (live honest negative): an ALLOWED gate recorded by a TEST operator
    // is still rejected (production closeout requires a non-test Founder-Operator).
    cleanState()
    seedAllowedGateTestOp()
    const allowedStatus = convexJSON(runConvex('couchVerdict:couchGateStatus', {}, OPERATOR))!
    expect(allowedStatus.allowed).toBe(true) // gate IS allowed…
    const boundRow = convexJSON(
      runConvex(
        'couchVerdict:getCouchVerdict',
        { sampleId: allowedStatus.sampleId as string },
        OPERATOR,
      ),
    )!
    expect(boundRow.recordedBy).toBe('test:s4t12-operator') // …but recorded by a TEST operator.
    const resolved2 = resolveFounderVerdict(PROJECT_ROOT)
    expect(resolved2.present).toBe(false)
    expect(resolved2.reason).toMatch(/test_subject/)
  }, 300000)
})
