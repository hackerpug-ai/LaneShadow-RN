/**
 * REDHAT-FIX-05: Honest Sprint 05 goal semantics + gate evidence contracts.
 *
 * Fail-closed rules:
 *   - goal:complete / met:true ONLY when decision === 'accepted' AND gate oracles pass
 *   - rejected / escalation_required unresolved / null decision ⇒ met:false, goal not complete
 *   - Sprint 10 blocked while no accepted catalog exists
 *   - Step-4 negative control must be byte-distinct from step-3 and show a real mutation
 *   - Top-50 gate evidence is row-level (routeId, name, measuredMiles, claimedMiles)
 *     with rowCount reconciled to riderReadyCount
 *
 * CLI:
 *   npx tsx tools/gate/deriveSprint05GoalState.ts \
 *     --decision rejected|accepted|escalation_required|null \
 *     [--run-id <id>] \
 *     [--out path/to/sprint-goal-state.json]
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type BatchAcceptanceDecision = 'accepted' | 'rejected' | 'escalation_required' | null

export type AcceptanceArtifact = {
  decision: BatchAcceptanceDecision
  retirementUnlockedAt?: number | null
  runId?: string | null
  reason?: string | null
}

export type GateOracles = {
  /** Step-4 artifact is byte-distinct from step-3 and shows real mutation */
  step4NegativeControlDistinct?: boolean
  /** Row-level top-50 evidence present and coherent with riderReadyCount */
  top50RowEvidenceOk?: boolean
  /** Zero test:/seed: contamination in retirement / top-50 export */
  zeroTestContamination?: boolean
}

export type Sprint10Block = {
  blocked: boolean
  reason: string
}

export type Sprint05GoalState = {
  goal: 'complete' | 'blocked' | 'in_progress'
  met: boolean
  decision: BatchAcceptanceDecision
  status: string
  reason: string
  sprint10: Sprint10Block
  retirementUnlockedAt: number | null
  runId: string | null
  written_by: string
  written_at: string
}

export type Top50RowInput = {
  routeId?: string | null
  name?: string | null
  measuredMiles?: number | null
  claimedMiles?: number | null
  [key: string]: unknown
}

export type Top50GateRow = {
  routeId: string
  name: string
  measuredMiles: number
  claimedMiles: number | null
}

export type Top50GateEvidence = {
  rows: Top50GateRow[]
  rowCount: number
  riderReadyCount: number
  coherenceNote: string
  testRowsCount: number
  coherent: boolean
}

export type Step3ComparisonInput = {
  runId: string
  report: Record<string, unknown> | null
  phase?: string
}

export type Step3ComparisonArtifact = {
  phase: string
  runId: string
  decision: null
  levers: unknown
  riderReadyCount: number | null
  isDone: boolean | null
  comparison: {
    note: string
    yieldsVsAssumptions: unknown
  }
  capturedAt: string
}

export type Step4NegativeControlEvidence = {
  step3_bytes: string
  step4_bytes: string
  decision: BatchAcceptanceDecision
  retirementUnlockedAt: null | number
  mutated: boolean
  runId: string | null
  phase: 'step-4-negative-control'
}

// ---------------------------------------------------------------------------
// Sprint 10 dependency
// ---------------------------------------------------------------------------

/**
 * Sprint 10 consumes the accepted post-batch catalog. Fail-closed: any
 * non-accepted decision (including null / unresolved escalation) blocks.
 */
export function deriveSprint10Blocked(acceptance: AcceptanceArtifact): Sprint10Block {
  const decision = normalizeDecision(acceptance.decision)

  if (decision === 'accepted') {
    return {
      blocked: false,
      reason: 'accepted catalog present — Sprint 10 unblocked',
    }
  }

  if (decision === 'rejected') {
    return {
      blocked: true,
      reason: 'no accepted catalog: batch decision is rejected',
    }
  }

  if (decision === 'escalation_required') {
    return {
      blocked: true,
      reason: 'no accepted catalog: escalation_required unresolved',
    }
  }

  return {
    blocked: true,
    reason: 'no accepted catalog: missing or empty acceptance decision',
  }
}

// ---------------------------------------------------------------------------
// Goal derivation (fail-closed)
// ---------------------------------------------------------------------------

function normalizeDecision(raw: unknown): BatchAcceptanceDecision {
  if (raw === 'accepted' || raw === 'rejected' || raw === 'escalation_required') {
    return raw
  }
  return null
}

function oraclesPass(oracles?: GateOracles): boolean {
  if (!oracles) return false
  return (
    oracles.step4NegativeControlDistinct === true &&
    oracles.top50RowEvidenceOk === true &&
    oracles.zeroTestContamination === true
  )
}

/**
 * Derive Sprint 05 goal state from a batch acceptance artifact.
 *
 * NEVER marks goal complete / met true on rejected or unresolved escalation.
 * Process-green CI alone is insufficient — acceptance decision is authoritative.
 */
export function deriveSprint05GoalState(
  acceptance: AcceptanceArtifact,
  oracles?: GateOracles,
): Sprint05GoalState {
  const decision = normalizeDecision(acceptance.decision)
  const retirementUnlockedAt =
    acceptance.retirementUnlockedAt === undefined ? null : acceptance.retirementUnlockedAt
  const runId = acceptance.runId ?? null
  const sprint10 = deriveSprint10Blocked({ decision, retirementUnlockedAt, runId })
  const written_at = new Date().toISOString()
  const written_by = 'tools/gate/deriveSprint05GoalState.ts'

  // Fail-closed: only accepted + all oracles ⇒ complete
  if (decision === 'accepted' && oraclesPass(oracles)) {
    return {
      goal: 'complete',
      met: true,
      decision,
      status: 'Completed',
      reason: 'accepted batch with gate oracles pass',
      sprint10,
      retirementUnlockedAt: retirementUnlockedAt ?? null,
      runId,
      written_by,
      written_at,
    }
  }

  if (decision === 'accepted' && !oraclesPass(oracles)) {
    return {
      goal: 'in_progress',
      met: false,
      decision,
      status: 'Accepted pending gate oracles',
      reason:
        'decision is accepted but gate oracles are incomplete (step-4 / top-50 / contamination)',
      sprint10,
      retirementUnlockedAt: retirementUnlockedAt ?? null,
      runId,
      written_by,
      written_at,
    }
  }

  if (decision === 'rejected') {
    return {
      goal: 'blocked',
      met: false,
      decision,
      status: 'Rejected — goal not complete',
      reason: 'batch acceptance decision is rejected; never mark complete-on-reject',
      sprint10,
      retirementUnlockedAt: null,
      runId,
      written_by,
      written_at,
    }
  }

  if (decision === 'escalation_required') {
    return {
      goal: 'blocked',
      met: false,
      decision,
      status: 'Escalation required unresolved',
      reason: 'escalation_required unresolved; goal not complete until resolved accept',
      sprint10,
      retirementUnlockedAt: null,
      runId,
      written_by,
      written_at,
    }
  }

  // Empty / null decision
  return {
    goal: 'blocked',
    met: false,
    decision: null,
    status: 'No acceptance decision',
    reason: 'empty decision — never mark met:true without acceptance artifact',
    sprint10,
    retirementUnlockedAt: null,
    runId,
    written_by,
    written_at,
  }
}

// ---------------------------------------------------------------------------
// Step-3 / Step-4 gate evidence
// ---------------------------------------------------------------------------

/**
 * Capture step-3 comparison artifact (yields vs assumptions) BEFORE accept mutation.
 * This is intentionally decision:null — the founder has not yet attempted accept.
 */
export function buildStep3ComparisonArtifact(input: Step3ComparisonInput): Step3ComparisonArtifact {
  const report = input.report ?? {}
  const levers = (report as { levers?: unknown }).levers ?? null
  const riderReadyCount =
    typeof (report as { riderReadyCount?: unknown }).riderReadyCount === 'number'
      ? ((report as { riderReadyCount: number }).riderReadyCount as number)
      : null
  const isDone =
    typeof (report as { isDone?: unknown }).isDone === 'boolean'
      ? ((report as { isDone: boolean }).isDone as boolean)
      : null

  return {
    phase: input.phase ?? 'step-3-yield-comparison',
    runId: input.runId,
    decision: null,
    levers,
    riderReadyCount,
    isDone,
    comparison: {
      note: 'realized yields vs PRD expected-yield assumptions (pre-accept)',
      yieldsVsAssumptions: levers,
    },
    capturedAt: new Date().toISOString(),
  }
}

/**
 * Build step-4 negative control evidence from the accept mutation response.
 * Guarantees byte-distinct artifacts when a real decision mutation occurred.
 */
export function buildStep4NegativeControlEvidence(input: {
  step3: Step3ComparisonArtifact
  acceptResult: Record<string, unknown> | null
  acceptance?: Record<string, unknown> | null
}): Step4NegativeControlEvidence {
  const step3_bytes = JSON.stringify(input.step3)
  const accept = input.acceptResult ?? {}
  const stored = input.acceptance ?? {}

  const decision = normalizeDecision(accept.decision ?? stored.decision ?? null)
  const retirementRaw = accept.retirementUnlockedAt ?? stored.retirementUnlockedAt ?? null
  const retirementUnlockedAt =
    retirementRaw === undefined || retirementRaw === null ? null : Number(retirementRaw)

  const step4Payload = {
    phase: 'step-4-negative-control' as const,
    runId: (accept.runId as string | undefined) ?? (stored.runId as string | undefined) ?? null,
    decision,
    retirementUnlockedAt,
    acceptedAt: accept.acceptedAt ?? stored.acceptedAt ?? null,
    escalations: accept.escalations ?? stored.escalations ?? [],
    reason: accept.reason ?? stored.reason ?? null,
    operatorIdentity: accept.operatorIdentity ?? stored.operatorIdentity ?? null,
    decisionTimestamp: accept.decisionTimestamp ?? stored.decisionTimestamp ?? null,
    mutatedFrom: {
      phase: input.step3.phase,
      priorDecision: input.step3.decision,
    },
    capturedAt: new Date().toISOString(),
  }

  const step4_bytes = JSON.stringify(step4Payload)
  const mutated =
    step4_bytes !== step3_bytes &&
    decision !== null &&
    (decision === 'escalation_required' || decision === 'rejected' || decision === 'accepted')

  return {
    step3_bytes,
    step4_bytes,
    decision,
    retirementUnlockedAt,
    mutated,
    runId: step4Payload.runId,
    phase: 'step-4-negative-control',
  }
}

// ---------------------------------------------------------------------------
// Top-50 row-level gate evidence + coherence
// ---------------------------------------------------------------------------

function isTestOrSeedRoute(routeId: string): boolean {
  return (
    routeId.startsWith('test:') ||
    routeId.startsWith('seed:') ||
    routeId.includes(':test:') ||
    routeId.includes('/test/')
  )
}

/**
 * Build row-level top-50 gate evidence and reconcile rowCount vs riderReadyCount.
 *
 * Scrubs test:/seed: rows. When rowCount > riderReadyCount, requires an explicit
 * coherenceNote (shortfall explanation) or marks incoherent.
 */
export function buildTop50GateEvidence(input: {
  rows: Top50RowInput[]
  riderReadyCount: number
  coherenceNote?: string
}): Top50GateEvidence {
  const raw = Array.isArray(input.rows) ? input.rows : []
  let testRowsCount = 0
  const rows: Top50GateRow[] = []

  for (const r of raw) {
    const routeId = String(r.routeId ?? '').trim()
    const name = String(r.name ?? '').trim()
    if (routeId.length < 1) continue
    if (isTestOrSeedRoute(routeId)) {
      testRowsCount += 1
      continue
    }
    if (name.length < 1) continue
    const measuredMiles =
      typeof r.measuredMiles === 'number' && Number.isFinite(r.measuredMiles) ? r.measuredMiles : 0
    const claimedMiles =
      r.claimedMiles === null || r.claimedMiles === undefined
        ? null
        : typeof r.claimedMiles === 'number' && Number.isFinite(r.claimedMiles)
          ? r.claimedMiles
          : null
    rows.push({ routeId, name, measuredMiles, claimedMiles })
  }

  const rowCount = rows.length
  const riderReadyCount =
    typeof input.riderReadyCount === 'number' && Number.isFinite(input.riderReadyCount)
      ? input.riderReadyCount
      : 0

  let coherenceNote = input.coherenceNote?.trim() ?? ''
  let coherent = true

  if (rowCount > riderReadyCount) {
    if (coherenceNote.length < 1) {
      coherenceNote = `coherence_failure: rowCount=${rowCount} > riderReadyCount=${riderReadyCount}`
      coherent = false
    } else {
      // Explicit note supplied — accepted as explained shortfall
      coherent = true
    }
  } else if (coherenceNote.length < 1) {
    coherenceNote =
      rowCount === riderReadyCount
        ? `rowCount=${rowCount} equals riderReadyCount=${riderReadyCount}`
        : `rowCount=${rowCount} <= riderReadyCount=${riderReadyCount} (top-N sample of rider-ready surface)`
  }

  return {
    rows,
    rowCount,
    riderReadyCount,
    coherenceNote,
    testRowsCount,
    coherent,
  }
}

// ---------------------------------------------------------------------------
// Sprint goal-state JSON writer (honest re-derive)
// ---------------------------------------------------------------------------

export type SprintGoalStateFile = {
  goal: string
  met: boolean
  decision: BatchAcceptanceDecision
  status: string
  reason: string
  sprint10: Sprint10Block
  retirementUnlockedAt: number | null
  runId: string | null
  written_by: string
  written_at: string
  [key: string]: unknown
}

/**
 * Merge honest goal fields into an existing sprint-goal-state.json (or create new).
 * Never elevates met/goal when decision is not accepted.
 */
export function writeHonestSprintGoalState(opts: {
  outPath: string
  acceptance: AcceptanceArtifact
  oracles?: GateOracles
  base?: Record<string, unknown>
}): SprintGoalStateFile {
  const derived = deriveSprint05GoalState(opts.acceptance, opts.oracles)
  const base =
    opts.base ??
    (existsSync(opts.outPath)
      ? (JSON.parse(readFileSync(opts.outPath, 'utf-8')) as Record<string, unknown>)
      : {})

  const next: SprintGoalStateFile = {
    ...base,
    goal: derived.goal,
    met: derived.met,
    decision: derived.decision,
    status: derived.status,
    reason: derived.reason,
    sprint10: derived.sprint10,
    retirementUnlockedAt: derived.retirementUnlockedAt,
    runId: derived.runId,
    written_by: derived.written_by,
    written_at: derived.written_at,
  }

  // Safety: never allow leftover complete/true from prior dishonest write
  if (next.decision !== 'accepted' || next.met !== true) {
    if (next.goal === 'complete' && next.decision !== 'accepted') {
      next.goal = 'blocked'
      next.met = false
    }
  }

  writeFileSync(opts.outPath, `${JSON.stringify(next, null, 2)}\n`)
  return next
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function parseCli(argv: string[]): {
  decision: BatchAcceptanceDecision
  runId: string | null
  out: string | null
  retirementUnlockedAt: number | null
  oracles: GateOracles
} {
  let decision: BatchAcceptanceDecision = null
  let runId: string | null = null
  let out: string | null = null
  let retirementUnlockedAt: number | null = null
  const oracles: GateOracles = {}

  for (const arg of argv.slice(2)) {
    if (arg.startsWith('--decision=')) {
      const v = arg.slice('--decision='.length)
      decision = normalizeDecision(v === 'null' ? null : v)
    } else if (arg.startsWith('--run-id=')) {
      runId = arg.slice('--run-id='.length)
    } else if (arg.startsWith('--out=')) {
      out = resolve(process.cwd(), arg.slice('--out='.length))
    } else if (arg.startsWith('--retirement-unlocked-at=')) {
      const n = Number(arg.slice('--retirement-unlocked-at='.length))
      retirementUnlockedAt = Number.isFinite(n) ? n : null
    } else if (arg === '--oracles-pass') {
      oracles.step4NegativeControlDistinct = true
      oracles.top50RowEvidenceOk = true
      oracles.zeroTestContamination = true
    }
  }

  return { decision, runId, out, retirementUnlockedAt, oracles }
}

function main(): void {
  const { decision, runId, out, retirementUnlockedAt, oracles } = parseCli(process.argv)
  const state = deriveSprint05GoalState(
    { decision, runId, retirementUnlockedAt },
    Object.keys(oracles).length > 0 ? oracles : undefined,
  )
  if (out) {
    writeHonestSprintGoalState({
      outPath: out,
      acceptance: { decision, runId, retirementUnlockedAt },
      oracles: Object.keys(oracles).length > 0 ? oracles : undefined,
    })
  }
  process.stdout.write(`${JSON.stringify(state, null, 2)}\n`)
}

const invokedDirectly = /deriveSprint05GoalState\.ts$/.test(process.argv[1] ?? '')
if (invokedDirectly) {
  main()
}
