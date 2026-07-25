#!/usr/bin/env tsx

/**
 * S5-T1: Operator coverage report driver.
 *
 * Reads the live (or persisted runId) coverageReport from Convex and prints
 * per-lever realized yields vs PRD assumptions, terminal states, provenance,
 * rider-ready count, cost, and cursor.
 *
 * Usage:
 *   pnpm tsx scripts/geometry-coverage-report.ts
 *   pnpm tsx scripts/geometry-coverage-report.ts --run-id=full-batch-xyz
 *   pnpm tsx scripts/geometry-coverage-report.ts --prefix=test:s5t1-
 */

import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

function parseArgs(argv: string[]): { runId: string | null; prefix: string | null } {
  let runId: string | null = null
  let prefix: string | null = null
  for (const arg of argv.slice(2)) {
    if (arg.startsWith('--run-id=')) runId = arg.slice('--run-id='.length)
    else if (arg.startsWith('--prefix=')) prefix = arg.slice('--prefix='.length)
    else if (arg === '--help' || arg === '-h') {
      process.stdout.write(`
S5-T1 geometry coverage report

Usage:
  pnpm tsx scripts/geometry-coverage-report.ts
  pnpm tsx scripts/geometry-coverage-report.ts --run-id=<runId>
  pnpm tsx scripts/geometry-coverage-report.ts --prefix=test:s5t1-
`)
      process.exit(0)
    }
  }
  return { runId, prefix }
}

function runCoverageReport(args: {
  runId: string | null
  prefix: string | null
}): Record<string, unknown> {
  const payload: Record<string, unknown> = {}
  if (args.runId) payload.runId = args.runId
  if (args.prefix) payload.routeIdPrefix = args.prefix
  const argsJson = JSON.stringify(payload)
  const cmd = `npx convex run curatedGeometry:coverageReport '${argsJson.replace(/'/g, "'\"'\"'")}'`
  const result = execSync(cmd, { encoding: 'utf-8', stdio: ['ignore', 'pipe', 'pipe'] })
  return JSON.parse(result) as Record<string, unknown>
}

function main(): void {
  const { runId, prefix } = parseArgs(process.argv)
  const report = runCoverageReport({ runId, prefix })

  process.stdout.write('\n=== Geometry Coverage Report (S5-T1) ===\n')
  process.stdout.write(`Source: ${String(report.source ?? 'unknown')}\n`)
  process.stdout.write(`Run ID: ${String(report.runId ?? '(live)')}\n`)
  process.stdout.write(`isDone: ${String(report.isDone)}\n`)
  process.stdout.write(`continueCursor: ${String(report.continueCursor ?? '(none)')}\n`)
  process.stdout.write(`totalCostUSD: ${String(report.totalCostUSD ?? 0)}\n`)
  process.stdout.write(`riderReadyCount: ${String(report.riderReadyCount ?? 0)}\n`)
  if (report.assumptionNote) {
    process.stdout.write(`\nNote: ${String(report.assumptionNote)}\n`)
  }

  const levers = (report.levers as Array<Record<string, unknown>>) ?? []
  process.stdout.write('\nPer-lever realized yields (assumptions are NOT targets):\n')
  for (const lever of levers) {
    process.stdout.write(
      `  L${lever.leverNumber} ${lever.lever} (${lever.provenance}): ` +
        `candidates=${lever.candidateCount} pass=${lever.passCount} ` +
        `rate=${((Number(lever.realizedRate) || 0) * 100).toFixed(1)}% ` +
        `assumption=${lever.assumptionLabel}\n`,
    )
  }

  process.stdout.write('\nTerminal states:\n')
  process.stdout.write(`  ${JSON.stringify(report.terminalStates ?? {}, null, 2)}\n`)
  process.stdout.write('\nProvenance counts:\n')
  process.stdout.write(`  ${JSON.stringify(report.provenanceCounts ?? {}, null, 2)}\n`)

  const outDir = path.resolve(process.cwd(), '.tmp', 'S5-T1')
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true })
  const outPath = path.join(outDir, 'coverage-report.json')
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2))
  process.stdout.write(`\nWrote ${outPath}\n`)
}

main()
