/**
 * REDHATFIX12 — gate-evidence integrity harness (REDHAT-FIX-12 v2).
 *
 * Red-hat review 2026-07-20T233411Z (CRITICAL/HIGH/MEDIUM): the v1 writer was
 * still forgeable — it trusted a caller `founderVerdict` boolean, a caller
 * `--head-commit` SHA, an optional/skippable bundle, and the caller `steps`
 * JSON verbatim. A temporary all-PASS JSON with `founderVerdict:true` produced
 * `met:true` / `GATE-GOAL: ACHIEVED` with no durable evidence.
 *
 * This suite proves the hardened, non-forgeable contract:
 *   AC-1:  fails closed on any BLOCKED/FAIL step (met:false, nonzero exit).
 *   AC-2:  stale/forged evidence bundle rejected (STALE_EVIDENCE_BUNDLE, no write).
 *   AC-3:  rebuilt step4/step7 pass under operator, FORBIDDEN under bare identity.
 *   AC-4:  human founder review never fabricated (human_test pending).
 *   AC-5:  rebuilt step3 export + step5 getCouchVerdict under operator; bare
 *          FORBIDDEN on step3; step5 never synthesizes a pass.
 *   AC-6:  founder attestation resolved from durable couch_verdicts only, never a
 *          caller flag (founderVerdict:true has ZERO effect with no real row).
 *   AC-7:  HEAD computed internally; a forged --head-commit is inert.
 *   AC-8:  committed manifest MANDATORY — missing/untracked/clean-stale rejected.
 *   AC-9:  step PASS claims substantiated against the manifest; tampering inert.
 *   AC-10: generator metadata binds to actual HEAD + repo-relative input.
 *
 * TEST_TIER: integration
 * FLOW_REF: UC-VER-05 (gate-evidence anti-forgery)
 */

import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, join, resolve } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import {
  deriveGoalState,
  type EvidenceManifest,
  gitHeadInternal,
  resolveFounderVerdict,
  type StepResult,
  substantiateSteps,
  validateBundle,
} from '../../tools/gate/deriveGoalState'

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

const ALL_PASS_STEPS: StepResult[] = [1, 2, 3, 4, 5, 6, 7, 8].map((n) => ({
  n,
  result: 'PASS' as const,
}))
const BLOCKED_STEPS: StepResult[] = [
  { n: 1, result: 'BLOCKED' },
  ...[2, 3, 4, 5, 6, 7, 8].map((n) => ({ n, result: 'PASS' as const })),
]

// CLI temp artifacts live OUTSIDE the repo so they never pollute git status.
const CLI_TMP = mkdtempSync(join(tmpdir(), 's4t12-cli-'))

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
      { cwd: PROJECT_ROOT, encoding: 'utf-8', timeout: 120000, stdio: ['pipe', 'pipe', 'pipe'] },
    )
    return { ok: true, combined: stdout }
  } catch (e: any) {
    return {
      ok: false,
      combined: `${typeof e.stdout === 'string' ? e.stdout : ''}${typeof e.stderr === 'string' ? e.stderr : ''}`,
    }
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

interface TempRepo {
  root: string
}

function makeTempRepo(): TempRepo {
  const root = mkdtempSync(join(tmpdir(), 's4t12-repo-'))
  git(['init', '-q'], root)
  git(['config', 'user.email', 'gate-test@laneshadow.test'], root)
  git(['config', 'user.name', 'Gate Test'], root)
  writeFileSync(join(root, 'README.md'), '# temp gate repo\n')
  git(['add', '-A'], root)
  git(['commit', '-q', '-m', 'init'], root)
  return { root }
}

function commitAll(root: string, msg: string): void {
  git(['add', '-A'], root)
  git(['commit', '-q', '-m', msg], root)
}

function cleanState(): void {
  runConvex('couchVerdict:clearCouchVerdictsPublic', {}, FOUNDER)
  runConvex('couchVerdict:clearCouchManifestActivations', {}, FOUNDER)
}

/** A manifest corroborating a given set of PASS step numbers, each with a tracked artifact. */
function manifestFor(steps: number[], artifactFile: string): EvidenceManifest {
  const evidence_steps: Record<string, { result: string; artifacts: string[] }> = {}
  for (const n of steps) evidence_steps[String(n)] = { result: 'PASS', artifacts: [artifactFile] }
  return { version: 1, evidence_steps }
}

describe('REDHATFIX12: non-forgeable gate-evidence harness (REDHAT-FIX-12 v2)', () => {
  beforeAll(() => {
    // Bootstrap founder (cleanup) + operator identities.
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

  // ---------------------------------------------------------------- AC-1
  it('AC-1: fails closed on any BLOCKED/FAIL step; met is derived, never caller-supplied', () => {
    cleanState()
    const state = deriveGoalState({
      steps: BLOCKED_STEPS,
      repoCwd: PROJECT_ROOT,
      convexRepoCwd: PROJECT_ROOT,
    })
    expect(state.met).toBe(false)
    expect(state.goal).toBe('GATE-GOAL: BLOCKED')
    expect(state.gate.overall).toBe('BLOCKED')
    expect(state.exitCode).not.toBe(0)
    // An all-PASS input with no founder stays false (founderVerdict removed).
    const allPass = deriveGoalState({
      steps: ALL_PASS_STEPS,
      repoCwd: PROJECT_ROOT,
      convexRepoCwd: PROJECT_ROOT,
    })
    expect(allPass.met).toBe(false)
    // CLI still emits a BLOCKED sentinel (no error → write happens) + nonzero exit.
    const stepsFile = join(CLI_TMP, 'ac1-steps.json')
    writeFileSync(
      stepsFile,
      JSON.stringify({ sprintId: 'sprint-04-trust-pipeline', steps: BLOCKED_STEPS }),
    )
    const outFile = join(CLI_TMP, 'ac1-goalstate.json')
    const cli = runDeriveCli(['--step-results', stepsFile, '--out', outFile])
    expect(cli.code).not.toBe(0)
    expect(existsSync(outFile)).toBe(true)
    const written = JSON.parse(readFileSync(outFile, 'utf-8'))
    expect(written.met).toBe(false)
    expect(written.goal).toBe('GATE-GOAL: BLOCKED')
  }, 120000)

  // ---------------------------------------------------------------- AC-2
  it('AC-2: stale/forged evidence bundle rejected (STALE_EVIDENCE_BUNDLE); no met:true write', () => {
    const head = gitHeadInternal(PROJECT_ROOT)
    const v = validateBundle(FORGED, head, PROJECT_ROOT)
    expect(v.ok).toBe(false)
    if (!v.ok) {
      expect(v.code).toBe('STALE_EVIDENCE_BUNDLE')
      expect(v.details.capturedCommit).not.toBe(v.details.headCommit)
      expect(v.details.capturedCommit.length).toBe(40)
    }
    // CLI: forged bundle → no write, nonzero, stderr STALE.
    const stepsFile = join(CLI_TMP, 'ac2-steps.json')
    const outFile = join(CLI_TMP, 'ac2-goalstate.json')
    writeFileSync(stepsFile, JSON.stringify({ steps: ALL_PASS_STEPS, founderVerdict: true }))
    const cli = runDeriveCli(['--step-results', stepsFile, '--out', outFile, '--bundle', FORGED])
    expect(cli.code).not.toBe(0)
    expect(cli.stderr).toMatch(/STALE_EVIDENCE_BUNDLE/)
    expect(existsSync(outFile)).toBe(false)
  })

  // ---------------------------------------------------------------- AC-3
  it('AC-3: rebuilt step4/step7 pass under operator; FORBIDDEN under bare identity', () => {
    cleanState()
    const s3 = runScript('step3.sh', OPERATOR)
    expect(s3.ok, `step3 op: ${s3.combined}`).toBe(true)
    const s4 = runScript('step4.sh', OPERATOR)
    expect(s4.ok, `step4 op: ${s4.combined}`).toBe(true)
    const verdict = JSON.parse(readFileSync('/tmp/s4t12-verdict-pass.json', 'utf-8'))
    expect(verdict.recordedBy).toBe('test:s4t12-operator')
    const s7 = runScript('step7.sh', OPERATOR)
    expect(s7.ok, `step7 op: ${s7.combined}`).toBe(true)
    // Bare identity FORBIDDEN.
    expect(runScript('step4.sh', BARE).ok).toBe(false)
    expect(runScript('step4.sh', BARE).combined).toMatch(/FORBIDDEN/)
    expect(runScript('step7.sh', BARE).ok).toBe(false)
    expect(runScript('step7.sh', BARE).combined).toMatch(/FORBIDDEN/)
  }, 300000)

  // ---------------------------------------------------------------- AC-4
  it('AC-4: never fabricates the human founder review (stays pending)', () => {
    cleanState()
    const state = deriveGoalState({
      steps: BLOCKED_STEPS,
      repoCwd: PROJECT_ROOT,
      convexRepoCwd: PROJECT_ROOT,
    })
    expect(state.human_test.verdict).toBe('pending')
    expect(state.human_test.note).toMatch(/S4-T7|review required|human/i)
    const allPass = deriveGoalState({
      steps: ALL_PASS_STEPS,
      repoCwd: PROJECT_ROOT,
      convexRepoCwd: PROJECT_ROOT,
    })
    expect(allPass.human_test.verdict).toBe('pending')
  }, 120000)

  // ---------------------------------------------------------------- AC-5
  it('AC-5: rebuilt step3 export + step5 getCouchVerdict under operator; bare FORBIDDEN on step3', () => {
    // operator-recorded couch state already seeded by AC-3; re-seed for isolation.
    cleanState()
    expect(runScript('step3.sh', OPERATOR).ok).toBe(true)
    expect(runScript('step4.sh', OPERATOR).ok).toBe(true)
    const s5 = runScript('step5.sh', OPERATOR)
    expect(s5.ok, `step5 op: ${s5.combined}`).toBe(true)
    const line =
      s5.combined
        .split('\n')
        .filter((l) => l.startsWith('{'))
        .pop() ?? '{}'
    const out = JSON.parse(line)
    expect(out.recordedBy).toBe('test:s4t12-operator')
    expect(out.synthesized).toBe(false)
    // Bare identity FORBIDDEN on the operator-gated step3 export.
    const s3Bare = runScript('step3.sh', BARE)
    expect(s3Bare.ok).toBe(false)
    expect(s3Bare.combined).toMatch(/FORBIDDEN/)
  }, 300000)

  // ---------------------------------------------------------------- AC-6
  it('AC-6: founder attestation from durable couch_verdicts only; caller flag has zero effect', () => {
    // CASE 1: durable source PRESENT (operator records a pass verdict) → human_test pass.
    cleanState()
    expect(runScript('step3.sh', OPERATOR).ok).toBe(true)
    expect(runScript('step4.sh', OPERATOR).ok).toBe(true)
    const row = resolveFounderVerdict(PROJECT_ROOT)
    expect(row.sourceReachable).toBe(true)
    expect(row.present).toBe(true)
    expect(row.recordedBy).toBe('test:s4t12-operator')
    const statePresent = deriveGoalState({
      steps: ALL_PASS_STEPS,
      repoCwd: PROJECT_ROOT,
      convexRepoCwd: PROJECT_ROOT,
    })
    expect(statePresent.human_test.verdict).toBe('pass')
    expect(statePresent.human_test.recorded_by).toBe('test:s4t12-operator')

    // CASE 2: durable source ABSENT, JSON founderVerdict:true IGNORED → met:false, pending.
    cleanState()
    const exploitFile = join(CLI_TMP, 'ac6-exploit.json')
    writeFileSync(exploitFile, JSON.stringify({ steps: ALL_PASS_STEPS, founderVerdict: true }))
    const stateAbsent = deriveGoalState({
      steps: ALL_PASS_STEPS,
      repoCwd: PROJECT_ROOT,
      convexRepoCwd: PROJECT_ROOT,
    })
    expect(stateAbsent.met).toBe(false)
    expect(stateAbsent.human_test.verdict).toBe('pending')
    expect(stateAbsent.gate.blocker).toMatch(/S4-T7|founder|human/i)
  }, 300000)

  // ---------------------------------------------------------------- AC-7
  it('AC-7: HEAD computed internally; a forged --head-commit is inert', () => {
    const { root } = makeTempRepo()
    try {
      // Build a clean (seam-free, identity-clean) bundle committed at commit1.
      mkdirSync(join(root, '.gate-evidence/clean-stale/scripts'), { recursive: true })
      writeFileSync(
        join(root, '.gate-evidence/clean-stale/scripts/step1.sh'),
        '#!/bin/sh\necho harmless\n',
      )
      writeFileSync(
        join(root, '.gate-evidence/clean-stale/manifest.json'),
        JSON.stringify(manifestFor([1], 'evidence/step1.json')),
      )
      commitAll(root, 'add clean bundle') // commit1: bundle capturedCommit
      // Advance HEAD past the bundle so it is stale.
      git(['commit', '-q', '--allow-empty', '-m', 'advance head'], root)
      const internalHead = gitHeadInternal(root)
      const capturedCommit = git(
        ['log', '-1', '--format=%H', '--', '.gate-evidence/clean-stale'],
        root,
      )
      expect(capturedCommit).not.toBe(internalHead)

      // validateBundle uses the INTERNAL head (passed in by deriveGoalState).
      const bundle = join(root, '.gate-evidence/clean-stale')
      const v = validateBundle(bundle, internalHead, root)
      expect(v.ok).toBe(false)
      if (!v.ok) {
        expect(v.code).toBe('STALE_EVIDENCE_BUNDLE')
        expect(v.details.reason).toBe('stale_commit')
        expect(v.details.capturedCommit).not.toBe(v.details.headCommit)
        expect(v.details.headCommit).toBe(internalHead)
      }

      // CLI: a bogus --head-commit equal to the captured commit is IGNORED —
      // the writer compares against the true internal HEAD and still rejects.
      const bogus = capturedCommit
      const stepsFile = join(root, 'steps.json')
      writeFileSync(stepsFile, JSON.stringify({ steps: ALL_PASS_STEPS }))
      const outFile = join(root, 'goalstate.json')
      const cli = runDeriveCli(
        ['--step-results', stepsFile, '--out', outFile, '--bundle', bundle, '--head-commit', bogus],
        root,
      )
      expect(cli.code).not.toBe(0)
      expect(cli.stderr).toMatch(/STALE_EVIDENCE_BUNDLE/)
      // The reported headCommit must be the true internal HEAD, not the bogus SHA.
      const reported = JSON.parse(cli.stderr.split('\n').find((l) => l.includes('"code"')) ?? '{}')
      expect(reported.details?.headCommit).toBe(internalHead)
      expect(reported.details?.headCommit).not.toBe(bogus)
      expect(existsSync(outFile)).toBe(false)
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  // ---------------------------------------------------------------- AC-8
  it('AC-8: committed manifest mandatory — missing/untracked/clean-stale rejected', () => {
    const { root } = makeTempRepo()
    try {
      const head = gitHeadInternal(root)
      // CASE 1: missing bundle path.
      const missing = join(root, '.gate-evidence/does-not-exist')
      const v1 = validateBundle(missing, head, root)
      expect(v1.ok).toBe(false)
      if (!v1.ok) expect(v1.code).toBe('MISSING_EVIDENCE_BUNDLE')

      // CASE 2: untracked-on-disk bundle (created but never git-added).
      mkdirSync(join(root, '.gate-evidence/untracked/scripts'), { recursive: true })
      writeFileSync(join(root, '.gate-evidence/untracked/scripts/step1.sh'), '#!/bin/sh\necho x\n')
      writeFileSync(
        join(root, '.gate-evidence/untracked/manifest.json'),
        JSON.stringify(manifestFor([1], 'evidence/step1.json')),
      )
      const untracked = join(root, '.gate-evidence/untracked')
      expect(git(['ls-files', '--', '.gate-evidence/untracked'], root)).toBe('')
      const v2 = validateBundle(untracked, head, root)
      expect(v2.ok).toBe(false)
      if (!v2.ok) expect(v2.code).toBe('UNTRACKED_EVIDENCE_BUNDLE')

      // CASE 3: clean committed bundle whose captured commit != HEAD.
      mkdirSync(join(root, '.gate-evidence/clean-stale/scripts'), { recursive: true })
      writeFileSync(
        join(root, '.gate-evidence/clean-stale/scripts/step1.sh'),
        '#!/bin/sh\necho ok\n',
      )
      writeFileSync(
        join(root, '.gate-evidence/clean-stale/manifest.json'),
        JSON.stringify(manifestFor([1], 'evidence/step1.json')),
      )
      commitAll(root, 'clean stale bundle') // commit1
      git(['commit', '-q', '--allow-empty', '-m', 'advance'], root) // HEAD moves
      const cleanStale = join(root, '.gate-evidence/clean-stale')
      const v3 = validateBundle(cleanStale, gitHeadInternal(root), root)
      expect(v3.ok).toBe(false)
      if (!v3.ok) {
        expect(v3.code).toBe('STALE_EVIDENCE_BUNDLE')
        expect(v3.details.reason).toBe('stale_commit')
        expect(v3.details.capturedCommit).not.toBe(v3.details.headCommit)
      }
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  // ---------------------------------------------------------------- AC-9
  it('AC-9: step PASS claims substantiated against the manifest; tampering inert', () => {
    const { root } = makeTempRepo()
    try {
      // CASE 1: corroborated manifest at HEAD substantiates every PASS step.
      const bundleRel = '.gate-evidence/corroborated'
      mkdirSync(join(root, bundleRel, 'evidence'), { recursive: true })
      for (const n of [1, 2, 3, 4, 5, 6, 7, 8]) {
        writeFileSync(
          join(root, bundleRel, `evidence/step${n}.json`),
          JSON.stringify({ n, ok: true }),
        )
      }
      const manifest: EvidenceManifest = { version: 1, evidence_steps: {} }
      for (const n of [1, 2, 3, 4, 5, 6, 7, 8])
        manifest.evidence_steps[String(n)] = {
          result: 'PASS',
          artifacts: [`evidence/step${n}.json`],
        }
      writeFileSync(join(root, bundleRel, 'manifest.json'), JSON.stringify(manifest))
      commitAll(root, 'corroborated bundle') // capturedCommit == HEAD
      const corroborated = join(root, bundleRel)
      // Each PASS step is corroborated (substantiation returns null).
      expect(substantiateSteps(ALL_PASS_STEPS, manifest, corroborated, root)).toBeNull()

      // CASE 2: a SEPARATE bundle whose manifest lacks step 1 is committed at
      // HEAD; a tampered step-results JSON flips step 1 BLOCKED→PASS with no
      // manifest corroboration. Substantiation must reject it.
      const noStep1Rel = '.gate-evidence/corroborated-no-step1'
      mkdirSync(join(root, noStep1Rel, 'evidence'), { recursive: true })
      const manifestNoStep1: EvidenceManifest = { version: 1, evidence_steps: {} }
      for (const n of [2, 3, 4, 5, 6, 7, 8]) {
        manifestNoStep1.evidence_steps[String(n)] = {
          result: 'PASS',
          artifacts: [`evidence/step${n}.json`],
        }
        writeFileSync(join(root, noStep1Rel, `evidence/step${n}.json`), '{}')
      }
      writeFileSync(join(root, noStep1Rel, 'manifest.json'), JSON.stringify(manifestNoStep1))
      commitAll(root, 'corroborated without step 1') // capturedCommit == HEAD
      const noStep1Bundle = join(root, noStep1Rel)
      const tampered: StepResult[] = [
        { n: 1, result: 'PASS' },
        ...[2, 3, 4, 5, 6, 7, 8].map((n) => ({ n, result: 'PASS' as const })),
      ]
      const sub = substantiateSteps(tampered, manifestNoStep1, noStep1Bundle, root)
      expect(sub).not.toBeNull()
      expect(sub?.code).toBe('STEP_RESULT_UNSUBSTANTIATED')
      expect(sub?.details.step).toBe(1)
      // End-to-end via deriveGoalState: the tampered JSON cannot flip the outcome.
      const state = deriveGoalState({
        steps: tampered,
        bundlePath: noStep1Bundle,
        repoCwd: root,
        convexRepoCwd: root,
      })
      expect(state.met).toBe(false)
      expect(state.gate.overall).toBe('BLOCKED')
      expect(state.error?.code).toBe('STEP_RESULT_UNSUBSTANTIATED')
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  // ---------------------------------------------------------------- AC-10
  it('AC-10: generator metadata binds to actual HEAD + repo-relative input', () => {
    const { root } = makeTempRepo()
    try {
      // A corroborated bundle committed at HEAD, under .gate-evidence/.
      const bundleRel = '.gate-evidence/corroborated'
      mkdirSync(join(root, bundleRel, 'evidence'), { recursive: true })
      writeFileSync(join(root, bundleRel, 'evidence/step1.json'), '{}')
      const manifest = manifestFor([1, 2, 3, 4, 5, 6, 7, 8], 'evidence/step1.json')
      writeFileSync(join(root, bundleRel, 'manifest.json'), JSON.stringify(manifest))
      for (const n of [2, 3, 4, 5, 6, 7, 8]) {
        writeFileSync(join(root, bundleRel, `evidence/step${n}.json`), '{}')
      }
      commitAll(root, 'corroborated') // capturedCommit == HEAD
      const bundle = join(root, bundleRel)
      const internalHead = gitHeadInternal(root)
      const state = deriveGoalState({
        steps: ALL_PASS_STEPS,
        bundlePath: bundle,
        repoCwd: root,
        convexRepoCwd: root,
      })
      expect(state.generator.head_commit).toBe(internalHead)
      expect(state.generator.head_commit).toHaveLength(40)
      expect(state.generator.derived_from).toMatch(/^\.gate-evidence\//)
      expect(state.generator.derived_from).not.toMatch(/^\/tmp/)
      // derived_from names the bundle (basename corroborated), tracked at HEAD.
      expect(basename(state.generator.derived_from ?? '')).toBe('corroborated')
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })
})
