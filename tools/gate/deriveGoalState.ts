/**
 * REDHAT-FIX-12 (v3): Machine-derived, NON-FORGEABLE Sprint-04 goal-state writer.
 *
 * Per red-hat review 2026-07-21T005254Z, the v2 writer still permitted
 * completion authority to be manufactured from a caller-controlled evidence
 * tree (working-tree manifest bytes, directory-level freshness, `../` traversal)
 * and accepted any latest pass row. v3 closes those seams:
 *
 *   - the manifest AND every enumerated artifact are resolved from immutable
 *     HEAD-bound content with PER-FILE freshness and dirty-tree rejection
 *     (verifyEvidenceManifest);
 *   - artifact paths are contained within the bundle via realpath BEFORE any
 *     tracking check (ARTIFACT_PATH_ESCAPE);
 *   - founder attestation is bound to couchGateStatus.allowed===true and the
 *     active manifest's exact sampleId/manifestHash/catalogVersion via a
 *     matching getCouchVerdict({sampleId}) row recorded by a non-test operator
 *     (resolveFounderVerdict);
 *   - generator provenance is a two-object attested_source_commit /
 *     attestation_commit contract verified by strict-descendant relation
 *     (verifyProvenance), replacing the impossible self-HEAD-equality claim.
 *
 * HEAD is computed internally (git rev-parse HEAD); a caller --head-commit is
 * non-authoritative. A committed evidence manifest is MANDATORY for met:true.
 * The human Founder-Operator visual review (S4-T7) is NEVER synthesized.
 *
 * CLI usage (run from the repo root):
 *   npx tsx tools/gate/deriveGoalState.ts \
 *     --step-results <repo-relative-step-results.json> \
 *     --out <path-to-sprint-goal-state.json> \
 *     [--bundle <path-to-committed-evidence-bundle>] \
 *     [--sprint <sprint-id>]   # [--head-commit <sha>] accepted but IGNORED
 */

import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { gitHeadInternal, gitLastCommit, gitTracked, toRepoRel } from './gitUtils'
import { type FounderAttestation, resolveFounderVerdict } from './resolveFounderVerdict'
import { type EvidenceManifest, verifyEvidenceManifest } from './verifyEvidenceManifest'

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

export type GateErrorCode =
  | 'MISSING_EVIDENCE_BUNDLE'
  | 'UNTRACKED_EVIDENCE_BUNDLE'
  | 'STALE_EVIDENCE_BUNDLE'
  | 'MISSING_EVIDENCE_MANIFEST'
  | 'MANIFEST_NOT_HEAD_BOUND'
  | 'EVIDENCE_FILE_STALE'
  | 'ARTIFACT_PATH_ESCAPE'
  | 'STEP_RESULT_UNSUBSTANTIATED'

export interface GateError {
  ok: false
  code: GateErrorCode
  details: {
    reason: string
    step?: number
    script?: string
    seam?: string
    file?: string
    artifact?: string
    capturedCommit: string
    headCommit: string
  }
}

export type BundleValidation = { ok: true } | GateError

export interface HumanTest {
  verdict: 'pass' | 'pending'
  note: string
  recorded_by?: string | null
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
    attested_source_commit: string
    head_commit: string
    rule: string
    note: string
  }
  exitCode: number
  error?: GateError
}

export { gitHeadInternal } from './gitUtils'
export { type FounderAttestation, resolveFounderVerdict } from './resolveFounderVerdict'
// Re-exports for tests / external use.
export { type EvidenceManifest, verifyEvidenceManifest } from './verifyEvidenceManifest'
export { type ProvenanceResult, verifyProvenance } from './verifyProvenance'

// ---------------------------------------------------------------------------
// Bundle structural validation (anti-forgery) — missing/untracked/seam/identity/stale
// ---------------------------------------------------------------------------

const FORBIDDEN_SEAM = 'lever2FixedGeometry'
const FORBIDDEN_IDENTITY = 's4-human-gate'

function readScripts(bundlePath: string): string[] {
  // List the working-tree scripts dir (the bundle must exist + be tracked,
  // checked before this). Seam/identity scans read these bytes.
  const scriptsDir = existsSync(join(bundlePath, 'scripts'))
    ? join(bundlePath, 'scripts')
    : bundlePath
  if (!existsSync(scriptsDir)) return []
  return readdirSync(scriptsDir)
    .filter((f) => f.endsWith('.sh'))
    .sort()
    .map((f) => join(scriptsDir, f))
}

/**
 * Structural bundle validation: missing → untracked → seam → bare-identity →
 * directory-level stale-commit. (Per-file freshness + manifest content binding
 * is handled by verifyEvidenceManifest; this never short-circuits a missing/
 * untracked/stale bundle to ok.)
 */
export function validateBundle(bundlePath: string, head: string, cwd: string): BundleValidation {
  if (!existsSync(bundlePath)) {
    return {
      ok: false,
      code: 'MISSING_EVIDENCE_BUNDLE',
      details: { reason: 'missing_dir', capturedCommit: '', headCommit: head },
    }
  }
  if (gitTracked(bundlePath, cwd).length === 0) {
    return {
      ok: false,
      code: 'UNTRACKED_EVIDENCE_BUNDLE',
      details: { reason: 'untracked', capturedCommit: '', headCommit: head },
    }
  }
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
  const capturedCommit = gitLastCommit(bundlePath, cwd)
  if (capturedCommit && capturedCommit !== head) {
    return {
      ok: false,
      code: 'STALE_EVIDENCE_BUNDLE',
      details: { reason: 'stale_commit', capturedCommit, headCommit: head },
    }
  }
  return { ok: true }
}

// ---------------------------------------------------------------------------
// Step substantiation — PASS claims corroborated by the HEAD-bound manifest
// ---------------------------------------------------------------------------

function isPassing(result: StepResultKind): boolean {
  return result === 'PASS' || result === 'PASS-real'
}

/**
 * Every step claiming PASS must be corroborated by the manifest (entry exists,
 * result PASS, ≥1 artifact). Containment/freshness of artifacts is already
 * enforced by verifyEvidenceManifest; this checks the step→entry mapping so a
 * tampered step-results JSON cannot flip an uncorroborated step to PASS.
 */
export function substantiateSteps(
  steps: StepResult[],
  manifest: EvidenceManifest,
  bundlePath: string,
  cwd: string,
): GateError | null {
  for (const step of steps) {
    if (!isPassing(step.result)) continue
    const entry = manifest.evidence_steps[String(step.n)]
    const corroborated =
      !!entry &&
      isPassing(entry.result as StepResultKind) &&
      Array.isArray(entry.artifacts) &&
      entry.artifacts.length > 0
    if (!corroborated) {
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
  }
  return null
}

// ---------------------------------------------------------------------------
// Fail-closed derivation
// ---------------------------------------------------------------------------

function describeBlocker(
  error: GateError | null,
  anyBlocked: boolean,
  hasValidManifest: boolean,
  founder: FounderAttestation,
): string | null {
  if (error) {
    const d = error.details
    const where = d.script
      ? ` in ${d.script}`
      : d.step
        ? ` for step ${d.step}`
        : d.file
          ? ` (${d.file})`
          : ''
    const art = d.artifact ? ` artifact ${d.artifact}` : ''
    return `REDHAT-FIX-12: ${error.code} (${d.reason}${where}${art}; captured ${
      d.capturedCommit ? d.capturedCommit.slice(0, 12) : '∅'
    } vs HEAD ${d.headCommit.slice(0, 12)}). The evidence cannot attest the current code.`
  }
  if (anyBlocked) {
    return 'REDHAT-FIX-12: at least one gate step is BLOCKED/FAIL — the goal-state cannot report met:true while any step is unresolved.'
  }
  if (!founder.present) {
    return founder.sourceReachable
      ? `REDHAT-FIX-12: the Founder-Operator/live-provider human gate (S4-T7) is an external, unresolved, human-owned blocker; couchGateStatus.allowed is false or no manifest-bound operator pass exists (${founder.reason ?? 'unbound'}). The harness never synthesizes it.`
      : 'REDHAT-FIX-12: the durable founder-attestation source (couchGateStatus) was unreachable; failing safe (met:false) rather than trusting a caller flag.'
  }
  if (!hasValidManifest) {
    return 'REDHAT-FIX-12: no committed evidence manifest substantiates a PASS — met:true requires a mandatory manifest bound to HEAD.'
  }
  return null
}

export interface DeriveOptions {
  sprintId?: string
  steps: StepResult[]
  bundlePath?: string
  repoCwd?: string
  convexRepoCwd?: string
  stepResultsPath?: string
}

export function deriveGoalState(opts: DeriveOptions): GoalState {
  const sprintId = opts.sprintId ?? 'sprint-04-trust-pipeline'
  const cwd = opts.repoCwd ?? process.cwd()
  const convexCwd = opts.convexRepoCwd ?? cwd
  const head = gitHeadInternal(cwd)

  let error: GateError | null = null
  let manifest: EvidenceManifest | null = null
  let hasValidManifest = false
  if (opts.bundlePath) {
    const structural = validateBundle(opts.bundlePath, head, cwd)
    if (!structural.ok) {
      error = structural
    } else {
      const mv = verifyEvidenceManifest(opts.bundlePath, head, cwd)
      if (!mv.ok) {
        error = mv
      } else {
        manifest = mv.manifest
        const sub = substantiateSteps(opts.steps, manifest, opts.bundlePath, cwd)
        if (sub) error = sub
        else hasValidManifest = true
      }
    }
  }

  const anyBlocked = opts.steps.some((s) => !isPassing(s.result))

  let founder: FounderAttestation = {
    present: false,
    recordedBy: null,
    verdict: null,
    sampleId: null,
    manifestHash: null,
    catalogVersion: null,
    gateAllowed: false,
    sourceReachable: true,
    reason: null,
  }
  if (!error) {
    founder = resolveFounderVerdict(convexCwd)
  }

  const allStepsPass = opts.steps.length > 0 && !anyBlocked
  const met = !error && allStepsPass && hasValidManifest && founder.present
  const goal = met ? 'GATE-GOAL: ACHIEVED' : 'GATE-GOAL: BLOCKED'
  const overall = met ? 'PASS' : 'BLOCKED'
  const exitCode = met ? 0 : 1

  const human_test: HumanTest = {
    verdict: founder.present ? 'pass' : 'pending',
    note: founder.present
      ? `S4-T7 Founder-Operator verdict recorded by ${founder.recordedBy} (couchGateStatus.allowed, manifest-bound)`
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
      attested_source_commit: head,
      head_commit: head,
      rule: 'met := every step substantiated-PASS AND HEAD-bound manifest AND couchGateStatus.allowed manifest-bound durable founder verdict; HEAD computed internally; provenance = attested_source_commit(strict-descendant-of attestation_commit); never hand-supplied',
      note: 'REDHAT-FIX-12 v3: this file is machine-derived; do not hand-edit.',
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
  const outPath = args.out
  if (!stepResultsPath || !outPath) {
    err(
      'usage: deriveGoalState.ts --step-results <path> --out <path> [--bundle <path>] [--sprint <id>]',
    )
    process.exit(2)
  }
  if (args['head-commit']) {
    err(
      'warning: --head-commit is non-authoritative and ignored; using internal git rev-parse HEAD.',
    )
  }

  const file = JSON.parse(readFileSync(stepResultsPath, 'utf-8')) as StepResultsFile
  const state = deriveGoalState({
    sprintId: args.sprint ?? file.sprintId,
    steps: file.steps,
    bundlePath: args.bundle,
    stepResultsPath,
  })

  if (state.error) {
    err(JSON.stringify(state.error))
    process.exit(state.exitCode)
  }

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

const invokedDirectly = /deriveGoalState\.ts$/.test(process.argv[1] ?? '')
if (invokedDirectly) {
  main()
}
