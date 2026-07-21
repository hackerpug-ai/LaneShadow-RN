/**
 * REDHAT-FIX-12 (v2): Machine-derived, NON-FORGEABLE Sprint-04 goal-state writer.
 *
 * Per red-hat review 2026-07-20T233411Z, the prior writer was still forgeable: it
 * trusted a caller-supplied `founderVerdict` boolean, a caller `--head-commit`
 * SHA, an optional/skippable bundle, and the caller `steps` JSON verbatim. A
 * temporary all-PASS JSON with `founderVerdict:true` produced `met:true`.
 *
 * This writer derives completion authority ONLY from authenticated durable
 * sources — NEVER from caller input:
 *
 *   (1) Founder attestation (human_test.verdict, and a precondition for met) is
 *       resolved from a REAL `couch_verdicts` row read via `getCouchVerdict`
 *       against the Convex dev deployment. A CLI/JSON `founderVerdict:true`
 *       flag has ZERO effect (the input authority is removed).
 *   (2) HEAD is computed internally via `git rev-parse HEAD`. A caller
 *       `--head-commit` is accepted only as a non-authoritative diagnostic and
 *       is NEVER used in the stale-commit comparison.
 *   (3) A committed evidence manifest is MANDATORY for any write that could
 *       produce met:true: a missing bundle dir fails closed
 *       (MISSING_EVIDENCE_BUNDLE, never {ok:true}); an untracked-on-disk bundle
 *       is rejected (UNTRACKED_EVIDENCE_BUNDLE); a clean bundle whose captured
 *       commit != the internal HEAD is rejected (STALE_EVIDENCE_BUNDLE /
 *       stale_commit); the removed-seam / bare-identity scans are retained.
 *   (4) Every step PASS claim is substantiated against the manifest's enumerated
 *       per-step artifacts (each must be git-tracked at HEAD). A tampered
 *       step-results JSON that flips a BLOCKED step to PASS without manifest
 *       corroboration is rejected (STEP_RESULT_UNSUBSTANTIATED).
 *   (5) `generator.head_commit` is always the actual `git rev-parse HEAD` and
 *       `generator.derived_from` is a repository-relative immutable path (never
 *       an ephemeral /tmp/... path).
 *
 * The human Founder-Operator visual review (S4-T7) is NEVER synthesized: the
 * goal-state stays BLOCKED with `human_test.verdict` pending unless a genuine
 * operator-recorded `couch_verdicts` pass verdict exists. This harness cannot —
 * and must not — manufacture that evidence.
 *
 * CLI usage (run from the repo root):
 *   npx tsx tools/gate/deriveGoalState.ts \
 *     --step-results <repo-relative-step-results.json> \
 *     --out <path-to-sprint-goal-state.json> \
 *     [--bundle <path-to-committed-evidence-bundle>] \
 *     [--sprint <sprint-id>]   # [--head-commit <sha>] accepted but IGNORED
 *
 * step-results.json shape:
 *   { "sprintId"?: string, "steps": [{ "n": number, "result": "PASS"|"PASS-real"|"BLOCKED"|"FAIL", ... }] }
 *   (a "founderVerdict" field, if present, is IGNORED — founder attestation is
 *   resolved from the durable Convex source only)
 */

import { execFileSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync, realpathSync, writeFileSync } from 'node:fs'
import { isAbsolute, relative } from 'node:path'
import * as posix from 'node:path/posix'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type StepResultKind = 'PASS' | 'PASS-real' | 'BLOCKED' | 'FAIL'

export interface StepResult {
  n: number
  claim?: string
  result: StepResultKind
  framework?: string
  run_mode?: string
  measured_evidence?: string
  repro_cmd?: string
}

export type BundleErrorCode =
  | 'MISSING_EVIDENCE_BUNDLE'
  | 'UNTRACKED_EVIDENCE_BUNDLE'
  | 'STALE_EVIDENCE_BUNDLE'
  | 'MISSING_EVIDENCE_MANIFEST'
  | 'STEP_RESULT_UNSUBSTANTIATED'

export interface BundleError {
  ok: false
  code: BundleErrorCode
  details: {
    reason: string
    step?: number
    script?: string
    seam?: string
    artifact?: string
    capturedCommit: string
    headCommit: string
  }
}

export interface ManifestStep {
  result: string
  artifacts: string[]
}

export interface EvidenceManifest {
  version: number
  evidence_steps: Record<string, ManifestStep>
}

export type ValidationResult = { ok: true; manifest: EvidenceManifest } | BundleError

export interface HumanTest {
  verdict: 'pass' | 'pending'
  note: string
  recorded_by?: string | null
}

export interface FounderAttestation {
  /** A genuine operator-recorded pass verdict exists in couch_verdicts. */
  present: boolean
  recordedBy: string | null
  verdict: 'pass' | 'fail' | null
  sampleId: string | null
  /** The durable source was reachable (false ⇒ Convex unavailable ⇒ fail-safe). */
  sourceReachable: boolean
}

export interface GoalState {
  sprint_id: string
  goal: 'GATE-GOAL: ACHIEVED' | 'GATE-GOAL: BLOCKED'
  met: boolean
  gate: {
    overall: 'PASS' | 'BLOCKED'
    blocker: string | null
    steps: StepResult[]
  }
  human_test: HumanTest
  generator: {
    written_by: string
    derived_from: string | null
    head_commit: string
    rule: string
    note: string
  }
  exitCode: number
  error?: BundleError
}

// ---------------------------------------------------------------------------
// Git helpers (all HEAD/tracking resolved internally — never caller-supplied)
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

/** Internal, authoritative current HEAD. Never overridable by the caller. */
export function gitHeadInternal(cwd: string): string {
  return git(['rev-parse', 'HEAD'], cwd)
}

/** Resolve symlinks when present (macOS /var -> /private/var) so relative() is consistent. */
function realpathish(p: string): string {
  try {
    return realpathSync(p)
  } catch {
    return p
  }
}

function toRepoRel(absOrRel: string, cwd: string): string {
  if (!isAbsolute(absOrRel)) return absOrRel.split(/[\\/]/).join('/')
  // Normalize symlinks on both sides — process.cwd() may resolve /var to
  // /private/var while the caller's absolute path does not, which would
  // otherwise yield a broken ../../.. pathspec for git ls-files/log.
  const rel = relative(realpathish(cwd), realpathish(absOrRel))
  return rel.split(/[\\/]/).join('/')
}

/** Tracked paths under `path` (empty ⇒ untracked). */
function gitTracked(path: string, cwd: string): string[] {
  const rel = toRepoRel(path, cwd)
  const out = git(['ls-files', '--', rel], cwd)
  return out ? out.split('\n').filter(Boolean) : []
}

/** Latest commit that touched `path` (its "captured commit"). */
function gitLastCommit(path: string, cwd: string): string {
  const rel = toRepoRel(path, cwd)
  return git(['log', '-1', '--format=%H', '--', rel], cwd)
}

// ---------------------------------------------------------------------------
// Bundle validation (anti-forgery) — MANDATORY, never short-circuits to ok
// ---------------------------------------------------------------------------

const FORBIDDEN_SEAM = 'lever2FixedGeometry'
const FORBIDDEN_IDENTITY = 's4-human-gate'

function readScripts(bundlePath: string): string[] {
  const scriptsDir = existsSync(posix.join(bundlePath, 'scripts'))
    ? posix.join(bundlePath, 'scripts')
    : bundlePath
  if (!existsSync(scriptsDir)) return []
  return readdirSync(scriptsDir)
    .filter((f) => f.endsWith('.sh'))
    .sort()
    .map((f) => posix.join(scriptsDir, f))
}

export function loadManifest(bundlePath: string): EvidenceManifest | null {
  const manifestPath = posix.join(bundlePath, 'manifest.json')
  if (!existsSync(manifestPath)) return null
  try {
    const raw = JSON.parse(readFileSync(manifestPath, 'utf-8')) as Partial<EvidenceManifest>
    if (raw && typeof raw === 'object' && raw.evidence_steps) {
      return { version: raw.version ?? 1, evidence_steps: raw.evidence_steps }
    }
    return null
  } catch {
    return null
  }
}

/**
 * Validate a MANDATORY committed evidence bundle against the internal HEAD.
 * Order: missing → untracked → seam → bare-identity → stale-commit → manifest.
 * Never returns {ok:true} for a missing/untracked/stale bundle.
 */
export function validateBundle(bundlePath: string, head: string, cwd: string): ValidationResult {
  // 1. Missing bundle dir ⇒ fail closed (NEVER {ok:true}).
  if (!existsSync(bundlePath)) {
    return {
      ok: false,
      code: 'MISSING_EVIDENCE_BUNDLE',
      details: { reason: 'missing_dir', capturedCommit: '', headCommit: head },
    }
  }
  // 2. Untracked on disk ⇒ reject (must be a committed manifest).
  if (gitTracked(bundlePath, cwd).length === 0) {
    return {
      ok: false,
      code: 'UNTRACKED_EVIDENCE_BUNDLE',
      details: { reason: 'untracked', capturedCommit: '', headCommit: head },
    }
  }
  // 3/4. Reject any repro script carrying the removed seam or a bare identity.
  const scripts = readScripts(bundlePath)
  for (const script of scripts) {
    const text = readFileSync(script, 'utf-8')
    if (text.includes(FORBIDDEN_SEAM)) {
      return {
        ok: false,
        code: 'STALE_EVIDENCE_BUNDLE',
        details: {
          reason: 'seam_detected',
          script: toRepoRel(script, cwd),
          seam: FORBIDDEN_SEAM,
          capturedCommit: gitLastCommit(script, cwd),
          headCommit: head,
        },
      }
    }
    if (text.includes(FORBIDDEN_IDENTITY)) {
      return {
        ok: false,
        code: 'STALE_EVIDENCE_BUNDLE',
        details: {
          reason: 'bare_closeout_identity',
          script: toRepoRel(script, cwd),
          seam: FORBIDDEN_IDENTITY,
          capturedCommit: gitLastCommit(script, cwd),
          headCommit: head,
        },
      }
    }
  }
  // 5. Clean bundle whose captured commit != internal HEAD ⇒ stale.
  const capturedCommit = gitLastCommit(bundlePath, cwd)
  if (capturedCommit && capturedCommit !== head) {
    return {
      ok: false,
      code: 'STALE_EVIDENCE_BUNDLE',
      details: { reason: 'stale_commit', capturedCommit, headCommit: head },
    }
  }
  // 6. A manifest enumerating per-step artifacts is mandatory.
  const manifest = loadManifest(bundlePath)
  if (!manifest) {
    return {
      ok: false,
      code: 'MISSING_EVIDENCE_MANIFEST',
      details: { reason: 'manifest_absent', capturedCommit, headCommit: head },
    }
  }
  return { ok: true, manifest }
}

// ---------------------------------------------------------------------------
// Step substantiation — PASS claims must be corroborated by the manifest
// ---------------------------------------------------------------------------

function isPassing(result: StepResultKind): boolean {
  return result === 'PASS' || result === 'PASS-real'
}

/**
 * Every step claiming PASS/PASS-real must be corroborated by the manifest: the
 * manifest must list that step as PASS with at least one artifact git-tracked at
 * HEAD. A tampered JSON flipping BLOCKED→PASS (uncorroborated) is rejected.
 */
export function substantiateSteps(
  steps: StepResult[],
  manifest: EvidenceManifest,
  bundlePath: string,
  cwd: string,
): BundleError | null {
  const bundleRel = toRepoRel(bundlePath, cwd)
  for (const step of steps) {
    if (!isPassing(step.result)) continue // BLOCKED/FAIL need no corroboration
    const entry = manifest.evidence_steps[String(step.n)]
    if (
      !entry ||
      !isPassing(entry.result as StepResultKind) ||
      !Array.isArray(entry.artifacts) ||
      entry.artifacts.length === 0
    ) {
      return {
        ok: false,
        code: 'STEP_RESULT_UNSUBSTANTIATED',
        details: {
          reason: 'no_manifest_corroboration',
          step: step.n,
          capturedCommit: gitLastCommit(bundlePath, cwd),
          headCommit: gitHeadInternal(cwd),
        },
      }
    }
    for (const art of entry.artifacts) {
      const artRepoRel = posix.join(bundleRel, art)
      if (gitTracked(artRepoRel, cwd).length === 0) {
        return {
          ok: false,
          code: 'STEP_RESULT_UNSUBSTANTIATED',
          details: {
            reason: 'artifact_not_tracked',
            step: step.n,
            artifact: artRepoRel,
            capturedCommit: gitLastCommit(bundlePath, cwd),
            headCommit: gitHeadInternal(cwd),
          },
        }
      }
    }
  }
  return null
}

// ---------------------------------------------------------------------------
// Founder attestation — resolved ONLY from the durable Convex source
// ---------------------------------------------------------------------------

const READER_IDENTITY = JSON.stringify({
  subject: 'gate-evidence-reader',
  issuer: 'https://laneshadow.test',
})

/** Parse npx convex run stdout (may be empty for null, or pure JSON). */
function parseConvexRow(stdout: string): Record<string, unknown> | null {
  const trimmed = stdout.trim()
  if (!trimmed) return null
  try {
    const v = JSON.parse(trimmed)
    return v === null ? null : (v as Record<string, unknown>)
  } catch {
    // Fall back: extract the outermost JSON object (skip any stray non-JSON lines).
    const start = trimmed.indexOf('{')
    const end = trimmed.lastIndexOf('}')
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(trimmed.slice(start, end + 1)) as Record<string, unknown>
      } catch {
        return null
      }
    }
    return null
  }
}

/**
 * Resolve the S4-T7/founder attestation from a REAL `couch_verdicts` row read via
 * getCouchVerdict on the Convex dev deployment. NEVER from a caller flag.
 * Fails safe (present=false) when the source is unreachable.
 */
export function resolveFounderVerdict(convexRepoCwd: string): FounderAttestation {
  const fail = (): FounderAttestation => ({
    present: false,
    recordedBy: null,
    verdict: null,
    sampleId: null,
    sourceReachable: false,
  })
  let stdout = ''
  try {
    stdout = execFileSync(
      'npx',
      ['convex', 'run', 'couchVerdict:getCouchVerdict', '{}', '--identity', READER_IDENTITY],
      { cwd: convexRepoCwd, encoding: 'utf-8', timeout: 60000, stdio: ['pipe', 'pipe', 'pipe'] },
    )
  } catch {
    return fail()
  }
  const row = parseConvexRow(stdout)
  if (!row) {
    return {
      present: false,
      recordedBy: null,
      verdict: null,
      sampleId: null,
      sourceReachable: true,
    }
  }
  const verdict = (
    row.overallVerdict === 'pass' || row.overallVerdict === 'fail' ? row.overallVerdict : null
  ) as 'pass' | 'fail' | null
  const recordedBy = typeof row.recordedBy === 'string' ? row.recordedBy : null
  // A genuine S4-T7 attestation requires a pass verdict recorded by a real
  // operator identity (never the bare s4-human-gate control).
  const present =
    verdict === 'pass' && !!recordedBy && recordedBy !== FORBIDDEN_IDENTITY && recordedBy.length > 0
  return {
    present,
    recordedBy,
    verdict,
    sampleId: typeof row.sampleId === 'string' ? row.sampleId : null,
    sourceReachable: true,
  }
}

// ---------------------------------------------------------------------------
// Fail-closed derivation
// ---------------------------------------------------------------------------

function describeBlocker(
  error: BundleError | null,
  anyBlocked: boolean,
  hasValidManifest: boolean,
  founder: FounderAttestation,
): string | null {
  if (error) {
    const d = error.details
    const where = d.script ? ` in ${d.script}` : d.step ? ` for step ${d.step}` : ''
    const art = d.artifact ? ` (artifact ${d.artifact} not tracked)` : ''
    return `REDHAT-FIX-12: ${error.code} (${d.reason}${where}${art}; captured ${
      d.capturedCommit ? d.capturedCommit.slice(0, 12) : '∅'
    } vs HEAD ${d.headCommit.slice(0, 12)}). The evidence cannot attest the current code.`
  }
  if (anyBlocked) {
    return 'REDHAT-FIX-12: at least one gate step is BLOCKED/FAIL — the goal-state cannot report met:true while any step is unresolved.'
  }
  if (!founder.present) {
    return founder.sourceReachable
      ? 'REDHAT-FIX-12: the Founder-Operator/live-provider human gate (S4-T7) is an external, unresolved, human-owned blocker; no genuine operator-recorded couch_verdicts pass verdict exists. The harness never synthesizes it.'
      : 'REDHAT-FIX-12: the durable founder-attestation source (getCouchVerdict) was unreachable; failing safe (met:false) rather than trusting a caller flag.'
  }
  if (!hasValidManifest) {
    return 'REDHAT-FIX-12: no committed evidence manifest substantiates a PASS — met:true requires a mandatory manifest bound to HEAD.'
  }
  return null
}

export interface DeriveOptions {
  sprintId?: string
  steps: StepResult[]
  /** A committed evidence bundle (mandatory for met:true). Optional input. */
  bundlePath?: string
  /** Repo cwd for git operations (default process.cwd()). */
  repoCwd?: string
  /** Repo cwd holding the Convex project for founder resolution (default repoCwd). */
  convexRepoCwd?: string
  /** The step-results input path (stored repo-relative in derived_from). */
  stepResultsPath?: string
}

export function deriveGoalState(opts: DeriveOptions): GoalState {
  const sprintId = opts.sprintId ?? 'sprint-04-trust-pipeline'
  const cwd = opts.repoCwd ?? process.cwd()
  const convexCwd = opts.convexRepoCwd ?? cwd
  // (2) HEAD is computed internally — never caller-supplied.
  const head = gitHeadInternal(cwd)

  let error: BundleError | null = null
  let manifest: EvidenceManifest | null = null
  let hasValidManifest = false
  if (opts.bundlePath) {
    const v = validateBundle(opts.bundlePath, head, cwd)
    if (!v.ok) {
      error = v
    } else {
      manifest = v.manifest
      // (4) Substantiate step PASS claims against the manifest.
      const sub = substantiateSteps(opts.steps, manifest, opts.bundlePath, cwd)
      if (sub) error = sub
      else hasValidManifest = true
    }
  }

  // If the bundle/substantiation is forged/stale, derive a blocked state but do
  // NOT resolve the founder attestation (the evidence already fails). The CLI
  // writes NO goal-state in this case.
  const anyBlocked = opts.steps.some((s) => !isPassing(s.result))

  let founder: FounderAttestation = {
    present: false,
    recordedBy: null,
    verdict: null,
    sampleId: null,
    sourceReachable: true,
  }
  if (!error) {
    // (1) Founder attestation from the durable source only — never a caller flag.
    founder = resolveFounderVerdict(convexCwd)
  }

  const allStepsPass = opts.steps.length > 0 && !anyBlocked
  // met:true requires ALL of: substantiated steps, valid manifest, durable founder.
  const met = !error && allStepsPass && hasValidManifest && founder.present
  const goal = met ? 'GATE-GOAL: ACHIEVED' : 'GATE-GOAL: BLOCKED'
  const overall = met ? 'PASS' : 'BLOCKED'
  const exitCode = met ? 0 : 1

  const human_test: HumanTest = {
    verdict: founder.present ? 'pass' : 'pending',
    note: founder.present
      ? `S4-T7 Founder-Operator verdict recorded by ${founder.recordedBy}`
      : 'S4-T7 Founder-Operator review required (human-owned, unresolved)',
    ...(founder.recordedBy ? { recorded_by: founder.recordedBy } : {}),
  }

  const derivedFrom = opts.bundlePath
    ? toRepoRel(opts.bundlePath, cwd)
    : opts.stepResultsPath
      ? toRepoRel(opts.stepResultsPath, cwd)
      : null

  return {
    sprint_id: sprintId,
    goal,
    met,
    gate: {
      overall,
      blocker: describeBlocker(error, anyBlocked, hasValidManifest, founder),
      steps: opts.steps,
    },
    human_test,
    generator: {
      written_by: 'tools/gate/deriveGoalState.ts',
      derived_from: derivedFrom,
      head_commit: head,
      rule: 'met := every step substantiated-PASS AND valid committed manifest AND genuine durable S4-T7 founder verdict; HEAD computed internally; never hand-supplied',
      note: 'REDHAT-FIX-12: this file is machine-derived; do not hand-edit.',
    },
    exitCode,
    ...(error ? { error } : {}),
  }
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

interface StepResultsFile {
  sprintId?: string
  founderVerdict?: unknown // IGNORED — kept only so old inputs don't crash.
  steps: StepResult[]
}

function parseArgs(argv: string[]): Record<string, string> {
  const out: Record<string, string> = {}
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a.startsWith('--')) {
      out[a.slice(2)] = argv[i + 1]
      i++
    }
  }
  return out
}

function out(msg: string): void {
  process.stdout.write(`${msg}\n`)
}

function err(msg: string): void {
  process.stderr.write(`${msg}\n`)
}

function main(): void {
  const args = parseArgs(process.argv.slice(2))
  const stepResultsPath = args['step-results']
  const outPath = args['out']
  if (!stepResultsPath || !outPath) {
    err(
      'usage: deriveGoalState.ts --step-results <path> --out <path> [--bundle <path>] [--sprint <id>]',
    )
    process.exit(2)
  }
  // --head-commit is accepted but NEVER authoritative (diagnostic only).
  if (args['head-commit']) {
    err(
      `warning: --head-commit is non-authoritative and ignored; using internal git rev-parse HEAD.`,
    )
  }

  const file = JSON.parse(readFileSync(stepResultsPath, 'utf-8')) as StepResultsFile
  const state = deriveGoalState({
    sprintId: args.sprint ?? file.sprintId,
    steps: file.steps,
    bundlePath: args.bundle,
    stepResultsPath,
    // founderVerdict in the file is deliberately IGNORED.
  })

  // Anti-forgery: a stale/forged/unsubstantiated bundle writes NO goal-state.
  if (state.error) {
    err(JSON.stringify(state.error))
    process.exit(state.exitCode)
  }

  // Preserve non-derived sections (build, integration, status_files, e2e) from
  // the existing file; the derived fields + generator are authoritative.
  let preserved: Record<string, unknown> = {}
  try {
    if (existsSync(outPath)) {
      preserved = JSON.parse(readFileSync(outPath, 'utf-8')) as Record<string, unknown>
    }
  } catch {
    preserved = {}
  }
  const written = {
    ...preserved,
    sprint_id: state.sprint_id,
    goal: state.goal,
    met: state.met,
    gate: state.gate,
    human_test: state.human_test,
    generator: state.generator,
    updated_at: new Date().toISOString(),
    phase: state.met ? 'complete' : 'blocked',
  }
  writeFileSync(outPath, `${JSON.stringify(written, null, 2)}\n`, 'utf-8')
  out(JSON.stringify({ met: state.met, goal: state.goal, overall: state.gate.overall }))
  process.exit(state.exitCode)
}

// Run the CLI only when executed directly via npx tsx tools/gate/deriveGoalState.ts.
const invokedDirectly = /deriveGoalState\.ts$/.test(process.argv[1] ?? '')
if (invokedDirectly) {
  main()
}
