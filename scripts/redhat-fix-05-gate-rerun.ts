#!/usr/bin/env tsx

/**
 * REDHAT-FIX-05 — Operator harness for an honest Human Testing Gate re-run.
 *
 * Produces non-identical step-3 / step-4 evidence and row-level top-50 packet.
 * Does NOT auto-mark the sprint complete — goal semantics stay fail-closed.
 *
 * Usage (from repo root, after FIX-01..04 land on a live catalog):
 *
 *   # 1) Full --all batch (expensive; real cost circuit-breaker)
 *   pnpm tsx scripts/backfill-curated-geometry.ts --all
 *
 *   # 2) Coverage report for the real runId
 *   pnpm tsx scripts/geometry-coverage-report.ts --run-id=<realRunId>
 *
 *   # 3+4) This harness: step-3 comparison + step-4 negative control + goal re-derive
 *   pnpm tsx scripts/redhat-fix-05-gate-rerun.ts \
 *     --run-id=<realRunId> \
 *     --identity='{"subject":"<founderClerkId>","issuer":"https://laneshadow.test"}' \
 *     --out=.spec/prds/route-agent-quality/tasks/sprint-05-batch-acceptance-retirement/gate-logs
 *
 *   # 5+6) Row-level top-50 (reconciles riderReadyCount from coverage report)
 *   pnpm tsx scripts/top-50-curated-review.ts --run-id=<realRunId> --render \
 *     --out=.tmp/sprint-05/top-50-gate
 *
 * Optional: attempt accept on the live run (will escalate/reject if low yield):
 *   add --attempt-accept
 *
 * Optional: write honest sprint-goal-state from the resulting decision:
 *   add --write-goal-state
 */

import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import {
  type BatchAcceptanceDecision,
  buildStep3ComparisonArtifact,
  buildStep4NegativeControlEvidence,
  deriveSprint05GoalState,
  writeHonestSprintGoalState,
} from '../tools/gate/deriveSprint05GoalState'

type Args = {
  runId: string
  identity: string | null
  out: string
  attemptAccept: boolean
  writeGoalState: boolean
  decision: 'accept' | 'reject'
}

function parseArgs(argv: string[]): Args {
  let runId = ''
  let identity: string | null = null
  let out = path.resolve(
    process.cwd(),
    '.spec/prds/route-agent-quality/tasks/sprint-05-batch-acceptance-retirement/gate-logs',
  )
  let attemptAccept = false
  let writeGoalState = false
  let decision: 'accept' | 'reject' = 'accept'

  for (const arg of argv.slice(2)) {
    if (arg.startsWith('--run-id=')) runId = arg.slice('--run-id='.length)
    else if (arg.startsWith('--identity=')) identity = arg.slice('--identity='.length)
    else if (arg.startsWith('--out=')) out = path.resolve(process.cwd(), arg.slice('--out='.length))
    else if (arg === '--attempt-accept') attemptAccept = true
    else if (arg === '--write-goal-state') writeGoalState = true
    else if (arg.startsWith('--decision=')) {
      const d = arg.slice('--decision='.length)
      if (d === 'reject' || d === 'accept') decision = d
    } else if (arg === '--help' || arg === '-h') {
      process.stdout.write(`
REDHAT-FIX-05 honest gate re-run harness

Required:
  --run-id=<liveCoverageRunId>

Optional:
  --identity=<clerk JSON>
  --out=<gate-logs dir>
  --attempt-accept          call requestBatchAcceptance (real step-4 mutation)
  --decision=accept|reject  decision for attempt-accept (default accept → often escalates)
  --write-goal-state        re-derive sprint-goal-state.json from resulting decision
`)
      process.exit(0)
    }
  }

  if (!runId) {
    process.stderr.write('error: --run-id is required\n')
    process.exit(2)
  }
  return { runId, identity, out, attemptAccept, writeGoalState, decision }
}

function runConvex(fn: string, args: Record<string, unknown>, identity: string | null): string {
  const cmd = ['convex', 'run', fn, JSON.stringify(args)]
  if (identity) cmd.push('--identity', identity)
  return execFileSync('npx', cmd, {
    cwd: process.cwd(),
    encoding: 'utf-8',
    timeout: 180000,
    stdio: ['ignore', 'pipe', 'pipe'],
  })
}

function main(): void {
  const args = parseArgs(process.argv)
  fs.mkdirSync(args.out, { recursive: true })

  // Step 2/3: load coverage report and capture comparison artifact
  const reportRaw = runConvex(
    'curatedGeometry:coverageReport',
    { runId: args.runId },
    args.identity,
  )
  const report = JSON.parse(reportRaw) as Record<string, unknown>
  const step3 = buildStep3ComparisonArtifact({
    runId: args.runId,
    report,
    phase: 'step-3-yield-comparison',
  })
  const step3Path = path.join(args.out, 'step-3.log')
  fs.writeFileSync(step3Path, `${JSON.stringify(step3, null, 2)}\n`)
  process.stdout.write(`Wrote step-3 comparison → ${step3Path}\n`)

  let acceptResult: Record<string, unknown> | null = null
  let acceptance: Record<string, unknown> | null = null

  if (args.attemptAccept) {
    const acceptRaw = runConvex(
      'curatedGeometry:requestBatchAcceptance',
      { runId: args.runId, decision: args.decision },
      args.identity,
    )
    acceptResult = JSON.parse(acceptRaw) as Record<string, unknown>

    const qRaw = runConvex(
      'curatedGeometry:getBatchAcceptance',
      { runId: args.runId },
      args.identity,
    )
    acceptance = JSON.parse(qRaw) as Record<string, unknown>
  } else {
    // Read existing acceptance if present (no mutation)
    try {
      const qRaw = runConvex(
        'curatedGeometry:getBatchAcceptance',
        { runId: args.runId },
        args.identity,
      )
      acceptance = JSON.parse(qRaw) as Record<string, unknown>
      acceptResult = acceptance
    } catch {
      acceptResult = { runId: args.runId, decision: null, retirementUnlockedAt: null }
    }
  }

  const step4 = buildStep4NegativeControlEvidence({
    step3,
    acceptResult,
    acceptance,
  })
  const step4Path = path.join(args.out, 'step-4.log')
  // Write the step-4 payload (not step-3 copy) — operator-visible mutation
  fs.writeFileSync(step4Path, `${step4.step4_bytes}\n`)
  process.stdout.write(`Wrote step-4 negative control → ${step4Path}\n`)
  process.stdout.write(
    `step4_distinct=${step4.step3_bytes !== step4.step4_bytes} decision=${step4.decision} mutated=${step4.mutated}\n`,
  )

  if (step4.step3_bytes === step4.step4_bytes) {
    process.stderr.write(
      'WARN: step-3 and step-4 are byte-identical — re-run with --attempt-accept on a low-yield report for a real negative control\n',
    )
  }

  const decision = (step4.decision ?? null) as BatchAcceptanceDecision
  const goal = deriveSprint05GoalState({
    decision,
    retirementUnlockedAt: step4.retirementUnlockedAt,
    runId: args.runId,
  })

  const summaryPath = path.join(args.out, 'redhat-fix-05-gate-summary.json')
  const summary = {
    runId: args.runId,
    step3Path,
    step4Path,
    step4_distinct: step4.step3_bytes !== step4.step4_bytes,
    decision: step4.decision,
    retirementUnlockedAt: step4.retirementUnlockedAt,
    mutated: step4.mutated,
    goal,
    sprint10: goal.sprint10,
  }
  fs.writeFileSync(summaryPath, `${JSON.stringify(summary, null, 2)}\n`)
  process.stdout.write(`Wrote summary → ${summaryPath}\n`)
  process.stdout.write(
    `goal=${goal.goal} met=${goal.met} sprint10.blocked=${goal.sprint10.blocked}\n`,
  )

  if (args.writeGoalState) {
    const outGoal = path.resolve(
      process.cwd(),
      '.spec/prds/route-agent-quality/tasks/sprint-05-batch-acceptance-retirement/sprint-goal-state.json',
    )
    writeHonestSprintGoalState({
      outPath: outGoal,
      acceptance: {
        decision,
        retirementUnlockedAt: step4.retirementUnlockedAt,
        runId: args.runId,
      },
    })
    process.stdout.write(`Wrote honest sprint-goal-state → ${outGoal}\n`)
  }

  process.stdout.write(`${JSON.stringify({ ok: true, ...summary }, null, 2)}\n`)
}

main()
