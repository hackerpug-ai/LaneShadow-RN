#!/usr/bin/env tsx

/**
 * DATA-011: Backfill curated route geometry (driver script).
 *
 * Generates per-route line geometry for curated discovery routes by calling
 * the Convex internal action `actions/curatedGeometry:backfill` via `npx convex run`.
 *
 * Architecture: geocode "{name}, {state}" via Nominatim → derive start/end endpoints
 * → route via Google Routes provider → persist encoded polyline to side table.
 *
 * Two modes:
 *   --sample=25   Generate geometry for 25 routes and write a fidelity report
 *                 for human review (the sample-validate gate).
 *   --all         Full backfill of all unprocessed routes (only after sample approval).
 *   --cursor=X    Resume a prior run from the given continueCursor.
 *
 * Resumable: skips rows already generated (geometryStatus='generated').
 * Rate-limited: the backfill action handles Nominatim rate-limiting internally (≤1 req/s).
 *
 * Usage:
 *   pnpm tsx scripts/backfill-curated-geometry.ts --sample=25
 *   pnpm tsx scripts/backfill-curated-geometry.ts --all
 *   pnpm tsx scripts/backfill-curated-geometry.ts --cursor="<continueCursor>"
 */

import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

// ---------------------------------------------------------------------------
// CLI arg parsing
// ---------------------------------------------------------------------------

function parseArgs(argv: string[]): {
  sample: number | null
  all: boolean
  cursor: string | null
} {
  let sample: number | null = null
  let all = false
  let cursor: string | null = null

  for (const arg of argv.slice(2)) {
    if (arg === '--all') {
      all = true
    } else if (arg.startsWith('--sample=')) {
      sample = parseInt(arg.split('=')[1], 10)
      if (Number.isNaN(sample) || sample < 1) {
        process.stderr.write(`Invalid --sample value: ${arg}\n`)
        process.exit(1)
      }
    } else if (arg.startsWith('--cursor=')) {
      cursor = arg.split('=').slice(1).join('=')
    } else if (arg === '--help' || arg === '-h') {
      process.stdout.write(`
DATA-011: Backfill curated route geometry

Usage:
  pnpm tsx scripts/backfill-curated-geometry.ts --sample=25
  pnpm tsx scripts/backfill-curated-geometry.ts --all
  pnpm tsx scripts/backfill-curated-geometry.ts --cursor="<continueCursor>"

Modes:
  --sample=N   Process N routes, write a fidelity report to .tmp/DATA-011/sample-report.json
  --all         Full backfill of all unprocessed routes
  --cursor=X    Resume from a prior run's continueCursor

The sample report must be reviewed by a human before running --all.
      `)
      process.exit(0)
    }
  }

  return { sample, all, cursor }
}

// ---------------------------------------------------------------------------
// Convex CLI helpers
// ---------------------------------------------------------------------------

type BackfillReport = {
  processed: number
  generated: number
  unresolved: number
  failed: number
  throttled: boolean
  resolveRate: number
  continueCursor: string | null
  isDone: boolean
  perRoute: Array<{
    routeId: string
    name: string
    state: string
    status: 'generated' | 'unresolved' | 'failed'
    coordCount?: number
    error?: string
  }>
}

type SampleReportEntry = {
  routeId: string
  name: string
  state: string
  geometryStatus: string
  decodedCoordCount: number
}

type SampleReport = {
  routes: SampleReportEntry[]
  resolved: number
  unresolved: number
  failed: number
}

/** The Convex function path for the backfill action. */
const BACKFILL_FUNCTION = 'actions/curatedGeometry:backfill'

/** The Convex function path for the sample-reset helper. */
const RESET_SAMPLE_FUNCTION = 'actions/curatedGeometry:clearGeometryStatusForSample'

/**
 * DATA-011 test-setup: reset `count` routes to unprocessed state so the sample
 * backfill has exactly `count` rows to process. Clears geometryStatus + deletes
 * side-table geometry. This is called BEFORE --sample so the backfill has a
 * deterministic pool of unprocessed routes.
 */
function resetSampleRoutes(count: number): number {
  const argsJson = JSON.stringify({ count })
  const cmd = `npx convex run ${RESET_SAMPLE_FUNCTION} '${argsJson.replace(/'/g, "'\"'\"'")}'`
  process.stdout.write(`Resetting ${count} routes to unprocessed state...\n`)

  try {
    const result = execSync(cmd, { encoding: 'utf-8', stdio: ['ignore', 'pipe', 'pipe'] })
    const parsed = JSON.parse(result) as { cleared: number }
    process.stdout.write(`  Cleared ${parsed.cleared} routes.\n`)
    return parsed.cleared
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    throw new Error(`Sample reset failed: ${msg}`)
  }
}

/**
 * Run the backfill action via `npx convex run`.
 * The action handles pagination internally when given a sample count.
 */
function runBackfill(sample: number | null, cursor: string | null): BackfillReport {
  const args: Record<string, unknown> = {}
  if (sample !== null) args.sample = sample
  if (cursor !== null) args.cursor = cursor
  const argsJson = JSON.stringify(args)

  const cmd = `npx convex run ${BACKFILL_FUNCTION} '${argsJson.replace(/'/g, "'\"'\"'")}'`
  process.stdout.write(`Running: ${cmd}\n`)

  try {
    const result = execSync(cmd, { encoding: 'utf-8', stdio: ['ignore', 'pipe', 'pipe'] })
    return JSON.parse(result) as BackfillReport
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    throw new Error(`Backfill action failed: ${msg}`)
  }
}

// ---------------------------------------------------------------------------
// Sample report generation
// ---------------------------------------------------------------------------

function buildSampleReport(backfillReport: BackfillReport): SampleReport {
  const routes: SampleReportEntry[] = backfillReport.perRoute.map((entry) => ({
    routeId: entry.routeId,
    name: entry.name,
    state: entry.state,
    geometryStatus: entry.status,
    decodedCoordCount: entry.coordCount ?? 0,
  }))

  return {
    routes,
    resolved: backfillReport.generated,
    unresolved: backfillReport.unresolved,
    failed: backfillReport.failed,
  }
}

function writeSampleReport(report: SampleReport, outDir: string): string {
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true })
  }
  const outPath = path.join(outDir, 'sample-report.json')
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2))
  return outPath
}

// ---------------------------------------------------------------------------
// Full backfill (paginated, resumable)
// ---------------------------------------------------------------------------

async function runFullBackfill(): Promise<void> {
  process.stdout.write('Starting full backfill...\n')
  let cursor: string | null = null
  let totalProcessed = 0
  let totalGenerated = 0
  let totalUnresolved = 0
  let totalFailed = 0

  while (true) {
    const report = runBackfill(null, cursor)
    totalProcessed += report.processed
    totalGenerated += report.generated
    totalUnresolved += report.unresolved
    totalFailed += report.failed

    process.stdout.write(
      `Batch: processed=${report.processed} generated=${report.generated} ` +
        `unresolved=${report.unresolved} failed=${report.failed} ` +
        `throttled=${report.throttled}\n`,
    )

    if (report.isDone) {
      process.stdout.write('Backfill complete (all routes processed).\n')
      break
    }

    if (report.throttled) {
      process.stdout.write(`Throttled. Resume with --cursor="${report.continueCursor}"\n`)
      break
    }

    cursor = report.continueCursor

    // Safety: if no routes were processed, we're stuck
    if (report.processed === 0) {
      process.stdout.write('No routes processed in this batch. Stopping.\n')
      break
    }
  }

  process.stdout.write('\nFinal totals:\n')
  process.stdout.write(`  Processed:  ${totalProcessed}\n`)
  process.stdout.write(`  Generated:  ${totalGenerated}\n`)
  process.stdout.write(`  Unresolved: ${totalUnresolved}\n`)
  process.stdout.write(`  Failed:     ${totalFailed}\n`)
  if (totalProcessed > 0) {
    process.stdout.write(
      `  Resolve rate: ${((totalGenerated / totalProcessed) * 100).toFixed(1)}%\n`,
    )
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const { sample, all, cursor } = parseArgs(process.argv)

  if (sample !== null) {
    // DATA-011 sample-gate: reclaim already-processed routes so the sample
    // has exactly `sample` rows to process. The reset helper only touches rows
    // with a geometryStatus set (generated/unresolved/failed); unprocessed
    // rows are left untouched. This makes repeated --sample runs idempotent
    // against the unprocessed pool while still producing a deterministic 25-route
    // fidelity report for human review.
    resetSampleRoutes(sample)

    process.stdout.write(`Running sample backfill: ${sample} routes\n`)
    const report = runBackfill(sample, cursor)

    process.stdout.write(`\nSample results:\n`)
    process.stdout.write(`  Processed:  ${report.processed}\n`)
    process.stdout.write(`  Generated:  ${report.generated}\n`)
    process.stdout.write(`  Unresolved: ${report.unresolved}\n`)
    process.stdout.write(`  Failed:     ${report.failed}\n`)
    process.stdout.write(`  Resolve rate: ${(report.resolveRate * 100).toFixed(1)}%\n`)

    const sampleReport = buildSampleReport(report)
    const outDir = path.resolve(process.cwd(), '.tmp', 'DATA-011')
    const outPath = writeSampleReport(sampleReport, outDir)

    process.stdout.write(`\nSample report written to: ${outPath}\n`)
    process.stdout.write(
      `  Routes: ${sampleReport.routes.length}, ` +
        `Resolved: ${sampleReport.resolved}, ` +
        `Unresolved: ${sampleReport.unresolved}, ` +
        `Failed: ${sampleReport.failed}\n`,
    )

    // Validation: the report must have the requested number of routes
    // and at least 1 resolved route
    if (sampleReport.routes.length !== sample) {
      process.stderr.write(
        `WARNING: Expected ${sample} routes in report but got ${sampleReport.routes.length}. ` +
          `This may indicate the catalog is smaller than the sample size.\n`,
      )
    }
    if (sampleReport.resolved < 1 && report.processed > 0) {
      process.stderr.write(
        'WARNING: No routes resolved in this sample. Check that Nominatim and Google Routes are accessible.\n',
      )
    }

    if (report.continueCursor && !report.isDone) {
      process.stdout.write(`\nTo continue: --cursor="${report.continueCursor}"\n`)
    }
  } else if (all) {
    await runFullBackfill()
  } else if (cursor) {
    // Resume from cursor — run one batch
    process.stdout.write('Resuming from cursor...\n')
    const report = runBackfill(null, cursor)
    process.stdout.write(`Processed: ${report.processed}, Generated: ${report.generated}\n`)
    if (!report.isDone && report.continueCursor) {
      process.stdout.write(`Continue with: --cursor="${report.continueCursor}"\n`)
    }
  } else {
    process.stderr.write('No mode specified. Use --sample=25 or --all. Run --help for usage.\n')
    process.exit(1)
  }
}

main().catch((error: unknown) => {
  process.stderr.write(`Fatal error: ${error instanceof Error ? error.message : String(error)}\n`)
  process.exit(1)
})
