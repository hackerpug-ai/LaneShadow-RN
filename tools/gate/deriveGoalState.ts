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
import {
  type EvidenceManifest,
  loadGatePlanExpectedSteps,
  verifyEvidenceManifest,
} from './verifyEvidenceManifest'

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
  | 'INCOMPLETE_CANONICAL_STEPS'
  | 'INVALID_STEP_IDENTITY'
  | 'INCOMPLETE_EVIDENCE_STEPS'
  | 'OFF_PLAN_SCRIPT'

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
    missing?: number[]
    extra?: number[]
    duplicates?: number[]
    expected?: number[]
    actual?: number[]
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
export {
  type EvidenceManifest,
  loadGatePlanExpectedSteps,
  verifyEvidenceManifest,
} from './verifyEvidenceManifest'
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

/**
 * REDHAT-FIX-18: validate step-results identity against the fixed canonical
 * gate-plan set. Rejects missing, duplicate, extra, or reordered step IDs.
 */
export function validateStepIdentity(
  steps: StepResult[],
  expected: number[],
  head: string,
): GateError | null {
  if (expected.length === 0) {
    return {
      ok: false,
      code: 'INCOMPLETE_CANONICAL_STEPS',
      details: {
        reason: 'gate_plan_expected_steps_unreadable',
        missing: [],
        expected: [],
        actual: steps.map((s) => s.n),
        capturedCommit: '',
        headCommit: head,
      },
    }
  }

  const actual = steps.map((s) => s.n)
  const seen = new Set<number>()
  const duplicates: number[] = []
  for (const n of actual) {
    if (seen.has(n)) {
      if (!duplicates.includes(n)) duplicates.push(n)
    } else {
      seen.add(n)
    }
  }
  if (duplicates.length > 0) {
    return {
      ok: false,
      code: 'INVALID_STEP_IDENTITY',
      details: {
        reason: 'duplicate_step_ids',
        duplicates,
        expected,
        actual,
        capturedCommit: '',
        headCommit: head,
      },
    }
  }

  const expectedSet = new Set(expected)
  const missing = expected.filter((n) => !seen.has(n))
  const extra = actual.filter((n) => !expectedSet.has(n))
  if (missing.length > 0 || extra.length > 0) {
    // Missing canonical steps → INCOMPLETE_CANONICAL_STEPS; pure extras (no
    // missing) still fail identity. Prefer incomplete when any expected is gone.
    if (missing.length > 0) {
      return {
        ok: false,
        code: 'INCOMPLETE_CANONICAL_STEPS',
        details: {
          reason: extra.length > 0 ? 'missing_and_extra_step_ids' : 'missing_step_ids',
          missing,
          extra,
          expected,
          actual,
          capturedCommit: '',
          headCommit: head,
        },
      }
    }
    return {
      ok: false,
      code: 'INVALID_STEP_IDENTITY',
      details: {
        reason: 'extra_step_ids',
        extra,
        expected,
        actual,
        capturedCommit: '',
        headCommit: head,
      },
    }
  }

  // Exact multiset match — still reject reorders (canonical plan order required).
  for (let i = 0; i < expected.length; i++) {
    if (actual[i] !== expected[i]) {
      return {
        ok: false,
        code: 'INVALID_STEP_IDENTITY',
        details: {
          reason: 'reordered_step_ids',
          expected,
          actual,
          capturedCommit: '',
          headCommit: head,
        },
      }
    }
  }
  return null
}

// ---------------------------------------------------------------------------
// REDHAT-FIX-20: plan-binding rejection (scripts/bundles not in HEAD-bound plan)
// ---------------------------------------------------------------------------

const GATE_PLAN_REL = '.spec/prds/route-agent-quality/tasks/sprint-04-trust-pipeline/gate-plan.json'

/** Match `.gate-evidence/<segment>/` fragments in paths or shell commands. */
const GATE_EVIDENCE_RUN_RE = /\.gate-evidence\/([^/]+)/g

/**
 * Timestamp-shaped evidence run IDs only, e.g.:
 *   2026-07-21T152805Z      (compact)
 *   2026-07-19T22:59:46Z    (ISO with colons)
 * Synthetic harness dirs (full-eight, one-step, corroborated-no-step1, …)
 * are NOT timestamp-shaped and must never trigger OFF_PLAN_SCRIPT.
 */
const TIMESTAMP_RUN_ID_RE = /^\d{4}-\d{2}-\d{2}T(?:\d{6}Z|\d{2}:\d{2}:\d{2}Z)$/

export function isTimestampShapedRunId(runId: string): boolean {
  return TIMESTAMP_RUN_ID_RE.test(runId)
}

type GatePlanBinding = {
  runIds: Set<string>
  literalCmds: string[]
}

/**
 * Load allowed evidence-run IDs from committed gate-plan.json literal_cmds.
 * Prefers cwd-relative plan (temp test repos); falls back to package project root.
 * Only timestamp-shaped segments are added to the allow-list.
 */
export function loadGatePlanBinding(cwd: string): GatePlanBinding {
  const candidates = [
    join(cwd, GATE_PLAN_REL),
    // tools/gate → repo root
    join(__dirname, '..', '..', GATE_PLAN_REL),
  ]
  const runIds = new Set<string>()
  const literalCmds: string[] = []
  for (const p of candidates) {
    if (!existsSync(p)) continue
    try {
      const raw = JSON.parse(readFileSync(p, 'utf-8')) as {
        steps?: Array<{ literal_cmd?: string }>
      }
      if (!raw?.steps || !Array.isArray(raw.steps)) continue
      for (const step of raw.steps) {
        const cmd = typeof step?.literal_cmd === 'string' ? step.literal_cmd : ''
        if (!cmd) continue
        literalCmds.push(cmd)
        for (const m of cmd.matchAll(GATE_EVIDENCE_RUN_RE)) {
          if (m[1] && isTimestampShapedRunId(m[1])) runIds.add(m[1])
        }
      }
      if (literalCmds.length > 0) return { runIds, literalCmds }
    } catch {
      // try next candidate
    }
  }
  return { runIds, literalCmds }
}

/**
 * Extract timestamp-shaped `.gate-evidence/<runId>/` segments only.
 * Synthetic harness names (no ISO-like timestamp) are ignored.
 */
function extractTimestampEvidenceRunIds(text: string): string[] {
  const ids: string[] = []
  for (const m of text.matchAll(GATE_EVIDENCE_RUN_RE)) {
    const seg = m[1]
    if (seg && isTimestampShapedRunId(seg) && !ids.includes(seg)) ids.push(seg)
  }
  return ids
}

/**
 * REDHAT-FIX-20: reject step repro_cmd / bundle paths that reference a
 * timestamp-shaped `.gate-evidence/<runId>/` not listed by the HEAD-bound
 * gate-plan literal_cmds. Synthetic harness dirs (one-step, full-eight, …)
 * are left alone so FIX-12/FIX-18 completeness paths still apply.
 * Does NOT implement FIX-18 completeness (missing 1..8).
 */
export function rejectOffPlanScripts(
  steps: StepResult[],
  bundlePath: string | undefined,
  cwd: string,
  head: string,
): GateError | null {
  const binding = loadGatePlanBinding(cwd)
  // No plan literal_cmds → nothing to bind against on this axis.
  if (binding.literalCmds.length === 0) return null

  const checkText = (text: string, step?: number): GateError | null => {
    const runs = extractTimestampEvidenceRunIds(text)
    for (const runId of runs) {
      if (!binding.runIds.has(runId)) {
        return {
          ok: false,
          code: 'OFF_PLAN_SCRIPT',
          details: {
            reason: `off-plan/stale script not referenced by HEAD-bound gate-plan (.gate-evidence/${runId}/)`,
            step,
            script: text,
            capturedCommit: '',
            headCommit: head,
          },
        }
      }
    }
    return null
  }

  for (const step of steps) {
    if (step.repro_cmd) {
      const err = checkText(step.repro_cmd, step.n)
      if (err) return err
    }
  }
  if (bundlePath) {
    const err = checkText(bundlePath)
    if (err) return err
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
  allStepsPass: boolean,
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
    const identityBits =
      d.missing?.length || d.extra?.length || d.duplicates?.length
        ? ` missing=[${(d.missing ?? []).join(',')}] extra=[${(d.extra ?? []).join(',')}] duplicates=[${(d.duplicates ?? []).join(',')}]`
        : ''
    // REDHAT-FIX-20: name the off-plan / stale script seam explicitly.
    if (error.code === 'OFF_PLAN_SCRIPT') {
      return `REDHAT-FIX-20: off-plan/stale script not referenced by HEAD-bound gate-plan (${d.reason}${where}). Bundles and repro_cmd paths must match the plan control surface.`
    }
    // REDHAT-FIX-18 completeness/identity errors: name the incomplete/identity seam.
    if (error.code === 'INCOMPLETE_CANONICAL_STEPS' || error.code === 'INCOMPLETE_EVIDENCE_STEPS') {
      return `REDHAT-FIX-18: incomplete canonical gate steps (${error.code}: ${d.reason}${where}${identityBits}). A non-empty subset of non-blocked steps is never gate-complete; expected the full committed gate-plan set.`
    }
    if (error.code === 'INVALID_STEP_IDENTITY') {
      return `REDHAT-FIX-18: invalid step identity/order (${d.reason}${identityBits}; expected=[${(d.expected ?? []).join(',')}] actual=[${(d.actual ?? []).join(',')}]). Duplicate, missing, extra, or reordered step IDs are rejected.`
    }
    return `REDHAT-FIX-12: ${error.code} (${d.reason}${where}${art}; captured ${
      d.capturedCommit ? d.capturedCommit.slice(0, 12) : '∅'
    } vs HEAD ${d.headCommit.slice(0, 12)}). The evidence cannot attest the current code.`
  }
  if (anyBlocked || !allStepsPass) {
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

  // REDHAT-FIX-18: fixed expected set from committed gate-plan.json (not the
  // caller-selected subset). Completeness requires every expected step.
  const expectedSteps = loadGatePlanExpectedSteps(cwd)

  let error: GateError | null = null
  let manifest: EvidenceManifest | null = null
  let hasValidManifest = false

  // Identity/order check first so invalid step-results cannot claim completeness.
  const identityErr = validateStepIdentity(opts.steps, expectedSteps, head)
  if (identityErr) {
    error = identityErr
  }

  // REDHAT-FIX-20: reject repro_cmd / bundle paths not in the HEAD-bound plan
  // before structural bundle validation (so OFF_PLAN_SCRIPT wins over untracked).
  if (!error) {
    const offPlan = rejectOffPlanScripts(opts.steps, opts.bundlePath, cwd, head)
    if (offPlan) error = offPlan
  }

  if (!error && opts.bundlePath) {
    const structural = validateBundle(opts.bundlePath, head, cwd)
    if (!structural.ok) {
      error = structural
    } else {
      const mv = verifyEvidenceManifest(opts.bundlePath, head, cwd)
      if (!mv.ok) {
        // Map ManifestError into GateError (compatible codes + details).
        error = {
          ok: false,
          code: mv.code,
          details: {
            reason: mv.details.reason,
            step: mv.details.step,
            file: mv.details.file,
            artifact: mv.details.artifact,
            missing: mv.details.missing,
            extra: mv.details.extra,
            capturedCommit: mv.details.capturedCommit,
            headCommit: mv.details.headCommit,
          },
        }
      } else {
        manifest = mv.manifest
        const sub = substantiateSteps(opts.steps, manifest, opts.bundlePath, cwd)
        if (sub) error = sub
        else hasValidManifest = true
      }
    }
  }

  // When there is no bundle, still require the full expected set to be present
  // and PASS for the mechanical step predicate (identity already enforced).
  const stepByN = new Map(opts.steps.map((s) => [s.n, s]))
  const anyBlocked = opts.steps.some((s) => !isPassing(s.result))
  // CRITICAL-2 fix: length>0 && !anyBlocked is NOT sufficient — every canonical
  // expected step must be present and substantiated-PASS.
  const allStepsPass =
    expectedSteps.length > 0 &&
    !error &&
    expectedSteps.every((n) => {
      const s = stepByN.get(n)
      return !!s && isPassing(s.result)
    })

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
      blocker: describeBlocker(error, anyBlocked, hasValidManifest, founder, allStepsPass),
      steps: opts.steps,
    },
    human_test,
    generator: {
      written_by: 'tools/gate/deriveGoalState.ts',
      derived_from: derivedFrom,
      attested_source_commit: head,
      head_commit: head,
      rule: 'met := every canonical gate-plan step (1..8) substantiated-PASS AND HEAD-bound complete evidence_steps AND couchGateStatus.allowed manifest-bound durable founder verdict; HEAD computed internally; never hand-supplied',
      note: 'REDHAT-FIX-12 v3 + REDHAT-FIX-18 + REDHAT-FIX-20: this file is machine-derived; do not hand-edit.',
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
