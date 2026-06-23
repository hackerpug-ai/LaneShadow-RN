#!/usr/bin/env tsx

/**
 * DATA-011: Backfill curated route geometry (driver script).
 *
 * Generates per-route line geometry for curated discovery routes by calling
 * the Convex internal action `curatedGeometry:backfill` via `npx convex run`.
 *
 * Two modes:
 *   --sample=25   Generate geometry for 25 routes and write a fidelity report
 *                 for human review (the sample-validate gate).
 *   --all         Full backfill of all unprocessed routes (only after sample approval).
 *   --cursor=X    Resume a prior run from the given continueCursor.
 *
 * Resumable: skips rows already generated (geometryStatus='generated').
 * Rate-limited: the backfill action handles Overpass rate-limiting internally.
 *
 * Usage:
 *   pnpm tsx scripts/backfill-curated-geometry.ts --sample=25
 *   pnpm tsx scripts/backfill-curated-geometry.ts --all
 *   pnpm tsx scripts/backfill-curated-geometry.ts --cursor="<continueCursor>"
 */

import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import polyline from '@mapbox/polyline'

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
        console.error(`Invalid --sample value: ${arg}`)
        process.exit(1)
      }
    } else if (arg.startsWith('--cursor=')) {
      cursor = arg.split('=').slice(1).join('=')
    } else if (arg === '--help' || arg === '-h') {
      console.log(`
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

/**
 * Run the backfill action via `npx convex run`.
 * The action handles pagination internally when given a sample count.
 */
function runBackfill(sample: number | null, cursor: string | null): BackfillReport {
  const args: Record<string, unknown> = {}
  if (sample !== null) args.sample = sample
  if (cursor !== null) args.cursor = cursor
  const argsJson = JSON.stringify(args)

  const cmd = `npx convex run curatedGeometry:backfill '${argsJson.replace(/'/g, "'\"'\"'")}'`
  console.log(`Running: ${cmd}`)

  try {
    const result = execSync(cmd, { encoding: 'utf-8', stdio: ['ignore', 'pipe', 'pipe'] })
    return JSON.parse(result) as BackfillReport
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    throw new Error(`Backfill action failed: ${msg}`)
  }
}

/**
 * Decode a polyline string and return the coordinate count.
 * Returns 0 for empty/invalid strings.
 */
function _decodedCoordCount(encoded: string, precision = 5): number {
  try {
    const decoded = polyline.decode(encoded, precision) as [number, number][]
    return decoded.length
  } catch {
    return 0
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
  console.log('Starting full backfill...')
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

    console.log(
      `Batch: processed=${report.processed} generated=${report.generated} ` +
        `unresolved=${report.unresolved} failed=${report.failed} ` +
        `throttled=${report.throttled}`,
    )

    if (report.isDone) {
      console.log('Backfill complete (all routes processed).')
      break
    }

    if (report.throttled) {
      console.log(`Throttled. Resume with --cursor="${report.continueCursor}"`)
      break
    }

    cursor = report.continueCursor

    // Safety: if no routes were processed, we're stuck
    if (report.processed === 0) {
      console.log('No routes processed in this batch. Stopping.')
      break
    }
  }

  console.log('\nFinal totals:')
  console.log(`  Processed:  ${totalProcessed}`)
  console.log(`  Generated:  ${totalGenerated}`)
  console.log(`  Unresolved: ${totalUnresolved}`)
  console.log(`  Failed:     ${totalFailed}`)
  if (totalProcessed > 0) {
    console.log(`  Resolve rate: ${((totalGenerated / totalProcessed) * 100).toFixed(1)}%`)
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const { sample, all, cursor } = parseArgs(process.argv)

  if (sample !== null) {
    console.log(`Running sample backfill: ${sample} routes`)
    const report = runBackfill(sample, cursor)

    console.log(`\nSample results:`)
    console.log(`  Processed:  ${report.processed}`)
    console.log(`  Generated:  ${report.generated}`)
    console.log(`  Unresolved: ${report.unresolved}`)
    console.log(`  Failed:     ${report.failed}`)
    console.log(`  Resolve rate: ${(report.resolveRate * 100).toFixed(1)}%`)

    const sampleReport = buildSampleReport(report)
    const outDir = path.resolve(process.cwd(), '.tmp', 'DATA-011')
    const outPath = writeSampleReport(sampleReport, outDir)

    console.log(`\nSample report written to: ${outPath}`)
    console.log(
      `  Routes: ${sampleReport.routes.length}, ` +
        `Resolved: ${sampleReport.resolved}, ` +
        `Unresolved: ${sampleReport.unresolved}, ` +
        `Failed: ${sampleReport.failed}`,
    )

    // Validation: the report must have the requested number of routes
    // and at least 1 resolved route
    if (sampleReport.routes.length !== sample) {
      console.warn(
        `WARNING: Expected ${sample} routes in report but got ${sampleReport.routes.length}. ` +
          `This may indicate the catalog is smaller than the sample size.`,
      )
    }
    if (sampleReport.resolved < 1 && report.processed > 0) {
      console.warn('WARNING: No routes resolved in this sample. Check that Overpass is accessible.')
    }

    if (report.continueCursor && !report.isDone) {
      console.log(`\nTo continue: --cursor="${report.continueCursor}"`)
    }
  } else if (all) {
    await runFullBackfill()
  } else if (cursor) {
    // Resume from cursor — run one batch
    console.log('Resuming from cursor...')
    const report = runBackfill(null, cursor)
    console.log(`Processed: ${report.processed}, Generated: ${report.generated}`)
    if (!report.isDone && report.continueCursor) {
      console.log(`Continue with: --cursor="${report.continueCursor}"`)
    }
  } else {
    console.error('No mode specified. Use --sample=25 or --all. Run --help for usage.')
    process.exit(1)
  }
}

main().catch((error: unknown) => {
  console.error('Fatal error:', error instanceof Error ? error.message : String(error))
  process.exit(1)
})
