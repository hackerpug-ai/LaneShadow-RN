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
  GATE_PLAN_REL,
  loadHeadBoundGatePlan,
  type PlanLoadErrorCode,
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
  | 'PLAN_NOT_HEAD_BOUND'
  | 'PLAN_DIRTY'
  | 'PLAN_STALE'
  | 'PLAN_NOT_IN_HEAD'
  | 'PLAN_UNPARSEABLE'

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
  GATE_PLAN_REL,
  type HeadBoundGatePlan,
  loadGatePlanExpectedSteps,
  loadHeadBoundGatePlan,
  type PlanLoadErrorCode,
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
// REDHAT-FIX-20 + REDHAT-FIX-21: plan-binding rejection (scripts/bundles not in
// HEAD-bound plan). Binding authority is loadHeadBoundGatePlan only.
// ---------------------------------------------------------------------------

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
 * Load allowed evidence-run IDs from the HEAD-bound gate-plan literal_cmds.
 * REDHAT-FIX-21: uses loadHeadBoundGatePlan — never working-tree readFileSync.
 * On dirty/stale/missing plan returns empty sets (no WT authority).
 */
export function loadGatePlanBinding(cwd: string): GatePlanBinding {
  const loaded = loadHeadBoundGatePlan(cwd)
  if (!loaded.ok) {
    return { runIds: new Set(), literalCmds: [] }
  }
  return { runIds: loaded.runIds, literalCmds: loaded.literalCmds }
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
 * REDHAT-FIX-25: shell metacharacters / control chars / quote-IFS evasion that
 * MUST NOT appear in a plan-equality command. Fail closed — never strip these
 * to recover a clean plan key.
 *
 * Forbidden: `; & | $ \` ( ) < >` newline tab, and quotes / backslash used for
 * IFS/escape evasion of the same vectors.
 */
const SHELL_UNSAFE_RE = /[;&|$\x60()<>\n\t'"\\]/

/** True when text embeds shell grammar / control / quote-escape characters. */
export function containsShellUnsafeChars(text: string): boolean {
  return SHELL_UNSAFE_RE.test(text)
}

/**
 * REDHAT-FIX-26: accepted plan-command language is STRICTLY ASCII (code points
 * 0x00–0x7F). Any non-ASCII character (Unicode whitespace, zero-width,
 * homoglyphs, full-width forms, emoji, accented Latin, …) is non-normalizable
 * — never strip / NFKC / case-fold to recover a plan key.
 */
export function isStrictAscii(text: string): boolean {
  for (let i = 0; i < text.length; i++) {
    if (text.charCodeAt(i) > 0x7f) return false
  }
  return true
}

/**
 * REDHAT-FIX-26: tokenize ONLY on ASCII whitespace (space/tab/LF/CR).
 * NEVER use JS `\s+` for plan-command equality — `\s` matches Unicode
 * whitespace (NBSP U+00A0, U+2007, U+202F, U+2028, …) and would forge a
 * stable key equal to the plan ASCII command.
 */
const ASCII_WHITESPACE_RE = /[ \t\n\r]+/

/**
 * True when text names a timestamp-shaped `.gate-evidence/.../*.sh` path even
 * if shell metacharacters are glued to the path token. Used only to detect
 * the enforcement surface — never as an equality key.
 */
function mentionsTimestampShapedScript(text: string): boolean {
  return /\.gate-evidence\/\d{4}-\d{2}-\d{2}T(?:\d{6}Z|\d{2}:\d{2}:\d{2}Z)\/(?:scripts\/)?[^\s/]*\.sh/.test(
    text,
  )
}

/**
 * Clean path characters only (no shell metachar / control / quote / escape).
 * Used so a token like `step1.sh;:` is NEVER accepted as a script path.
 */
const CLEAN_PATH_TOKEN = /^(?:\/|\.\/)?[A-Za-z0-9_./@%+=:,-]+\.sh$/

/**
 * REDHAT-FIX-22 + REDHAT-FIX-25: canonicalize a plan literal_cmd / repro_cmd /
 * path to a stable script key for exact equality. Prefer the
 * `.gate-evidence/<timestamp-run>/scripts/<file>.sh` suffix so absolute vs
 * relative prefixes compare equal. Returns null when no `.sh` path is present
 * (e.g. bare bundle dirs) — those stay under run-ID checks only.
 *
 * REDHAT-FIX-25: do NOT use `\S+\.sh` extract that trims trailing `;:` /
 * `$(…)` / operators from a larger shell token to recover a plan key. The
 * matched path token itself must be a clean `.sh` path with no suffix junk.
 */
export function canonicalizeScriptPath(text: string): string | null {
  if (!text) return null
  // REDHAT-FIX-26: non-ASCII is non-normalizable — never recover a path key.
  if (!isStrictAscii(text)) return null
  const trimmed = text.trim()
  // Prefer whole-string clean path, then final whitespace-delimited clean token.
  // Never match a prefix of a dirty token (e.g. `step1.sh;:` / `step1.sh$(true)`).
  // REDHAT-FIX-26: ASCII-only whitespace split (never JS `\s+`).
  let candidate: string | null = null
  if (CLEAN_PATH_TOKEN.test(trimmed)) {
    candidate = trimmed
  } else {
    const parts = trimmed.split(ASCII_WHITESPACE_RE).filter(Boolean)
    const last = parts[parts.length - 1]
    if (last && CLEAN_PATH_TOKEN.test(last)) {
      candidate = last
    } else {
      // Scan tokens for a clean .sh path (interpreter + path + args form).
      for (const t of parts) {
        if (CLEAN_PATH_TOKEN.test(t)) {
          candidate = t
          break
        }
      }
    }
  }
  if (!candidate) return null
  const raw = candidate.replace(/\\/g, '/')
  // Stable key: .gate-evidence/<runId>/scripts/<file>.sh (timestamp runs only)
  const ge = raw.match(/\.gate-evidence\/([^/]+)\/(?:scripts\/)?([^/]+\.sh)$/)
  if (ge?.[1] && ge[2] && isTimestampShapedRunId(ge[1])) {
    // Filename itself must be clean (no metachar smuggled into the capture).
    if (containsShellUnsafeChars(ge[2])) return null
    return `.gate-evidence/${ge[1]}/scripts/${ge[2]}`
  }
  if (containsShellUnsafeChars(raw)) return null
  return raw
}

/** True when the text names a timestamp-shaped `.gate-evidence/.../*.sh` path. */
function isTimestampShapedScriptPath(text: string): boolean {
  const key = canonicalizeScriptPath(text)
  if (!key) return false
  return /\.gate-evidence\/\d{4}-\d{2}-\d{2}T(?:\d{6}Z|\d{2}:\d{2}:\d{2}Z)\/scripts\//.test(key)
}

/** Shell KEY=val assignment token (not a bare word). */
function isEnvAssignmentToken(token: string): boolean {
  return /^[A-Za-z_][A-Za-z0-9_]*=/.test(token)
}

/**
 * REDHAT-FIX-24: normalized full command for equality against plan literal_cmds.
 * Interpreter + canonical script path + arg vector; env prefixes are preserved
 * so they never silently strip to a path-only match.
 */
export type NormalizedFullCommand = {
  /** Leading `env` / KEY=val tokens (must be empty to match bare plan cmds). */
  prefix: string[]
  /** Interpreter token (e.g. bash, sh, python); empty when bare path. */
  interpreter: string
  /** Canonical script key (same as canonicalizeScriptPath). */
  scriptKey: string
  /** Remaining argv after interpreter + script (flags, extra args). */
  args: string[]
}

/**
 * Tokenize and normalize a full shell command for exact equality.
 * Leading env KEY=val / `env VAR=…` prefixes are kept in `prefix` so they
 * cannot equal a bare plan `bash <script>` literal_cmd.
 *
 * REDHAT-FIX-25: shell-SAFE — commands containing shell metacharacters /
 * control chars / quote-escape chars return null (fail closed). Equality
 * requires a strict whitespace-delimited argv of clean path/interpreter/arg
 * words; glued metachar suffixes never recover a plan key.
 *
 * REDHAT-FIX-26: STRICTLY ASCII + BYTE-EXACT — any non-ASCII code unit returns
 * null (fail closed; never strip/NFKC). Tokenize ONLY on ASCII whitespace
 * (`/[ \t\n\r]+/`), never JS `\s+` (Unicode whitespace would forge plan keys).
 */
export function normalizeFullCommand(text: string): NormalizedFullCommand | null {
  if (!text) return null
  // REDHAT-FIX-26: reject ANY non-ASCII before equality / tokenization.
  if (!isStrictAscii(text)) return null
  // Fail closed on shell grammar before any path-prefix recovery.
  if (containsShellUnsafeChars(text)) return null
  // REDHAT-FIX-26: ASCII-only whitespace split (never JS `\s+`).
  const tokens = text.trim().split(ASCII_WHITESPACE_RE).filter(Boolean)
  if (tokens.length === 0) return null

  let i = 0
  const prefix: string[] = []

  // `env [KEY=val …] cmd …` or bare `KEY=val … cmd …`
  if (tokens[0] === 'env') {
    prefix.push('env')
    i = 1
    while (i < tokens.length && isEnvAssignmentToken(tokens[i]!)) {
      prefix.push(tokens[i]!)
      i++
    }
  } else {
    while (i < tokens.length && isEnvAssignmentToken(tokens[i]!)) {
      prefix.push(tokens[i]!)
      i++
    }
  }

  if (i >= tokens.length) return null

  // Locate the .sh script token among remaining tokens (clean token only).
  let scriptIdx = -1
  for (let j = i; j < tokens.length; j++) {
    const t = tokens[j]!
    if (!t.includes('.sh')) continue
    // Token itself must be a clean path — never extract `.sh` prefix from junk.
    if (!CLEAN_PATH_TOKEN.test(t)) continue
    const key = canonicalizeScriptPath(t)
    if (key) {
      scriptIdx = j
      break
    }
  }
  if (scriptIdx < 0) {
    // Fallback: whole remaining text may be a bare clean path.
    const rest = tokens.slice(i).join(' ')
    if (containsShellUnsafeChars(rest)) return null
    const key = canonicalizeScriptPath(rest)
    if (!key) return null
    // Treat as bare path when only one token, else first token = interpreter.
    if (tokens.length - i === 1) {
      return { prefix, interpreter: '', scriptKey: key, args: [] }
    }
    return {
      prefix,
      interpreter: tokens[i]!,
      scriptKey: key,
      args: tokens.slice(i + 1).filter((t) => canonicalizeScriptPath(t) !== key),
    }
  }

  const scriptKey = canonicalizeScriptPath(tokens[scriptIdx]!)
  if (!scriptKey) return null

  const between = tokens.slice(i, scriptIdx)
  const interpreter = between[0] ?? ''
  const midArgs = between.slice(1) // e.g. bash -x script.sh → midArgs = ['-x']
  const trailingArgs = tokens.slice(scriptIdx + 1)
  return {
    prefix,
    interpreter,
    scriptKey,
    args: [...midArgs, ...trailingArgs],
  }
}

/** Stable equality key for a normalized full command. */
export function stableFullCommandKey(n: NormalizedFullCommand): string {
  return JSON.stringify({
    p: n.prefix,
    i: n.interpreter,
    s: n.scriptKey,
    a: n.args,
  })
}

/**
 * REDHAT-FIX-20 + REDHAT-FIX-21 + REDHAT-FIX-22 + REDHAT-FIX-24 + REDHAT-FIX-25
 * + REDHAT-FIX-26:
 * reject step repro_cmd / bundle paths that are off-plan relative to
 * HEAD-bound gate-plan literal_cmds.
 *
 * Binding rules (fail closed):
 *   1. Dirty/stale plans → PLAN_* (never WT plan authority).
 *   2. Empty/malformed literal_cmds after successful load → OFF_PLAN_SCRIPT
 *      (no null skip / allow-all).
 *   3. Timestamp-shaped run IDs not in plan allow-list → OFF_PLAN_SCRIPT.
 *   4. REDHAT-FIX-22: substitute scripts under an allowed run are rejected.
 *   5. REDHAT-FIX-24: timestamp-shaped script commands must match an exact
 *      NORMALIZED FULL-COMMAND (interpreter + canonical script path + arg
 *      vector). Path-only .sh match is insufficient — extra flags, env-prefix
 *      wrappers, and interpreter swaps are OFF_PLAN_SCRIPT.
 *   6. REDHAT-FIX-25: shell-SAFE — any command naming a timestamp-shaped
 *      `.gate-evidence` script that contains shell metacharacters / control
 *      chars / quote-escape chars is OFF_PLAN_SCRIPT. Glued suffixes
 *      (`;:`, `$(…)`, backticks, `&&`/`||`/`|`, redirects) must never
 *      normalize to the plan key via `\S+\.sh` prefix extract.
 *   7. REDHAT-FIX-26: STRICTLY ASCII + BYTE-EXACT — any non-ASCII code unit
 *      in a command that names a gate-evidence script is OFF_PLAN_SCRIPT
 *      (Unicode whitespace / zero-width / homoglyph / full-width / emoji).
 *      Tokenization uses ASCII whitespace only; never JS `\s+`.
 *
 * Synthetic harness dirs (one-step, full-eight, …) are left alone so
 * FIX-12/FIX-18 completeness paths still apply — they are not timestamp-shaped.
 */
export function rejectOffPlanScripts(
  steps: StepResult[],
  bundlePath: string | undefined,
  cwd: string,
  head: string,
): GateError | null {
  const planLoad = loadHeadBoundGatePlan(cwd, head)
  if (!planLoad.ok) {
    return {
      ok: false,
      code: planLoad.code as PlanLoadErrorCode,
      details: {
        reason: planLoad.details.reason,
        file: planLoad.details.file ?? GATE_PLAN_REL,
        capturedCommit: planLoad.details.capturedCommit,
        headCommit: planLoad.details.headCommit,
      },
    }
  }

  // REDHAT-FIX-22 + REDHAT-FIX-24: build allowed full-command keys from plan
  // literal_cmds. Fail closed when none are usable (empty/malformed).
  const allowedFullCmds = new Set<string>()
  for (const cmd of planLoad.literalCmds) {
    const normalized = normalizeFullCommand(cmd)
    if (normalized) allowedFullCmds.add(stableFullCommandKey(normalized))
  }
  if (planLoad.literalCmds.length === 0 || allowedFullCmds.size === 0) {
    return {
      ok: false,
      code: 'OFF_PLAN_SCRIPT',
      details: {
        reason:
          'no plan literal_cmds / empty binding — fail closed (HEAD-bound plan has no usable literal_cmd paths)',
        file: GATE_PLAN_REL,
        capturedCommit: '',
        headCommit: head,
      },
    }
  }

  const checkText = (text: string, step?: number): GateError | null => {
    // 1) Run-ID allow-list: reject withdrawn / non-plan timestamp runs.
    const runs = extractTimestampEvidenceRunIds(text)
    for (const runId of runs) {
      if (!planLoad.runIds.has(runId)) {
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

    // 2) REDHAT-FIX-25: shell-SAFE fail-closed. Any command that names a
    // timestamp-shaped `.gate-evidence` script AND embeds shell metachar /
    // control / quote-escape characters is OFF_PLAN — do not attempt to
    // recover a clean path key from glued suffixes.
    if (mentionsTimestampShapedScript(text) && containsShellUnsafeChars(text)) {
      return {
        ok: false,
        code: 'OFF_PLAN_SCRIPT',
        details: {
          reason: `off-plan shell-unsafe command (metachar/control/quote) not an exact HEAD-bound plan literal_cmd match (${text})`,
          step,
          script: text,
          capturedCommit: '',
          headCommit: head,
        },
      }
    }

    // 3) REDHAT-FIX-26 + REDHAT-FIX-27: STRICTLY ASCII fail-closed UNCONDITIONALLY.
    // Any non-ASCII code unit in command-bearing text is OFF_PLAN — independent of
    // namesGateEvidenceScript / marker heuristics. Marker-obfuscated vectors
    // (Cyrillic е/һ, ZWSP, full-width ．/／) must not blind the gate. Leave
    // script text intact; never strip/NFKC to recover a plan key.
    if (!isStrictAscii(text)) {
      return {
        ok: false,
        code: 'OFF_PLAN_SCRIPT',
        details: {
          reason: `off-plan non-ASCII command not an exact HEAD-bound plan literal_cmd match (${text})`,
          step,
          script: text,
          capturedCommit: '',
          headCommit: head,
        },
      }
    }

    // 4) REDHAT-FIX-24: exact NORMALIZED FULL-COMMAND equality against plan
    // literal_cmds (interpreter + canonical script path + args). Only
    // timestamp-shaped script paths are enforced (synthetic harness dirs
    // remain outside this axis). Path-only .sh match is intentionally not used.
    if (isTimestampShapedScriptPath(text) || mentionsTimestampShapedScript(text)) {
      const normalized = normalizeFullCommand(text)
      if (!normalized || !allowedFullCmds.has(stableFullCommandKey(normalized))) {
        const scriptKey = normalized?.scriptKey ?? canonicalizeScriptPath(text) ?? text
        return {
          ok: false,
          code: 'OFF_PLAN_SCRIPT',
          details: {
            reason: `off-plan full command not an exact HEAD-bound plan literal_cmd match (${scriptKey})`,
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
    // REDHAT-FIX-21: name the dirty/stale plan authority seam explicitly.
    if (
      error.code === 'PLAN_NOT_HEAD_BOUND' ||
      error.code === 'PLAN_DIRTY' ||
      error.code === 'PLAN_STALE' ||
      error.code === 'PLAN_NOT_IN_HEAD' ||
      error.code === 'PLAN_UNPARSEABLE'
    ) {
      return `REDHAT-FIX-21: gate-plan is not an immutable HEAD-bound authority (${error.code}: ${d.reason}${where}). Expected steps and plan binding resolve only from git show HEAD:${GATE_PLAN_REL}.`
    }
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

  // REDHAT-FIX-21/23: single immutable HEAD-bound plan is authority for expected
  // steps and plan-binding. Dirty/missing plans fail closed; clean last-touch
  // behind HEAD is usable (FIX-23 — no PLAN_STALE on last-touch inequality).
  const planLoad = loadHeadBoundGatePlan(cwd, head)
  const expectedSteps = planLoad.ok ? planLoad.expectedSteps : []

  let error: GateError | null = null
  let manifest: EvidenceManifest | null = null
  let hasValidManifest = false

  if (!planLoad.ok) {
    error = {
      ok: false,
      code: planLoad.code,
      details: {
        reason: planLoad.details.reason,
        file: planLoad.details.file ?? GATE_PLAN_REL,
        capturedCommit: planLoad.details.capturedCommit,
        headCommit: planLoad.details.headCommit,
      },
    }
  }

  // Identity/order check first so invalid step-results cannot claim completeness.
  if (!error) {
    const identityErr = validateStepIdentity(opts.steps, expectedSteps, head)
    if (identityErr) {
      error = identityErr
    }
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
      note: 'REDHAT-FIX-12 v3 + REDHAT-FIX-18 + REDHAT-FIX-20 + REDHAT-FIX-21: this file is machine-derived; do not hand-edit.',
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
