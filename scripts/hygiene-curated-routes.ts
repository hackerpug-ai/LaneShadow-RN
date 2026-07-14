#!/usr/bin/env tsx

/**
 * S3-T1: Curated route hygiene driver.
 *
 * Operator driver for at-rest catalog hygiene passes on curated_routes.
 * Sibling flag conventions follow scripts/backfill-curated-geometry.ts
 * (--flag=value, invoke internalActions via npx convex run module:fn '<argsJson>').
 *
 * REDHAT-FIX-004: The driver now loops in batches via {cursor, batchSize}
 * until isDone, accumulating per-batch counts into totals. This mirrors
 * the runFullBackfill cursor loop in backfill-curated-geometry.ts.
 *
 * Subcommands:
 *   normalize-scores   ÷100 out-of-scale editorial scores at rest (S3-T1)
 *
 * Flags:
 *   --dryRun           Preview the change-set without writing
 *   --batchSize=N      Rows per batch (default 100)
 *   --cursor=X         Resume from a continuation cursor
 *
 * Usage:
 *   pnpm tsx scripts/hygiene-curated-routes.ts normalize-scores
 *   pnpm tsx scripts/hygiene-curated-routes.ts normalize-scores --dryRun
 *   pnpm tsx scripts/hygiene-curated-routes.ts normalize-scores --batchSize=50
 *   pnpm tsx scripts/hygiene-curated-routes.ts normalize-scores --cursor="<opaque>"
 */

import { execSync } from 'node:child_process'

// ---------------------------------------------------------------------------
// CLI arg parsing
// ---------------------------------------------------------------------------

type ParsedArgs = {
  subcommand: string | null
  dryRun: boolean
  batchSize: number | null
  cursor: string | null
}

function parseArgs(argv: string[]): ParsedArgs {
  let subcommand: string | null = null
  let dryRun = false
  let batchSize: number | null = null
  let cursor: string | null = null

  for (const arg of argv.slice(2)) {
    if (arg === '--dryRun' || arg === '--dry-run') {
      dryRun = true
    } else if (arg.startsWith('--batchSize=')) {
      batchSize = Number.parseInt(arg.slice('--batchSize='.length), 10)
    } else if (arg.startsWith('--cursor=')) {
      cursor = arg.slice('--cursor='.length)
    } else if (arg === '--help' || arg === '-h') {
      process.stdout.write(`
Hygiene Curated Routes Driver

Usage:
  pnpm tsx scripts/hygiene-curated-routes.ts normalize-scores
  pnpm tsx scripts/hygiene-curated-routes.ts normalize-scores --dryRun
  pnpm tsx scripts/hygiene-curated-routes.ts normalize-scores --batchSize=50
  pnpm tsx scripts/hygiene-curated-routes.ts normalize-scores --cursor="<opaque>"

Subcommands:
  normalize-scores   ÷100 out-of-scale editorial scores at rest (S3-T1)

Flags:
  --dryRun           Preview the change-set without writing
  --batchSize=N      Rows per batch (default 100)
  --cursor=X         Resume from a continuation cursor
      `)
      process.exit(0)
    } else if (!arg.startsWith('--')) {
      subcommand = arg
    }
  }

  return { subcommand, dryRun, batchSize, cursor }
}

// ---------------------------------------------------------------------------
// Convex CLI helper
// ---------------------------------------------------------------------------

type HygieneResult = {
  scanned: number
  normalized: number
  continueCursor: string
  isDone: boolean
}

function runHygieneFn(fn: string, args: Record<string, unknown>): HygieneResult {
  const argsJson = JSON.stringify(args)
  const cmd = `npx convex run ${fn} '${argsJson.replace(/'/g, "'\"'\"'")}'`
  process.stdout.write(`Running: ${cmd}\n`)

  try {
    const result = execSync(cmd, {
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    return JSON.parse(result.trim()) as HygieneResult
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    throw new Error(`Hygiene action failed: ${msg}`)
  }
}

// ---------------------------------------------------------------------------
// Subcommand: normalize-scores (S3-T1) — paginated cursor loop
// ---------------------------------------------------------------------------

function normalizeScores(
  dryRun: boolean,
  requestedBatchSize: number | null,
  resumeCursor: string | null,
): void {
  const label = dryRun ? '[DRY RUN] ' : ''
  process.stdout.write(`${label}Normalizing editorial scores ÷100 at rest...\n`)

  let cursor: string | null = resumeCursor
  const batchSize = requestedBatchSize ?? 100
  let totalScanned = 0
  let totalNormalized = 0
  let batchCount = 0

  while (true) {
    const result = runHygieneFn('curatedGeometryHygiene:normalizeEditorialScores', {
      ...(dryRun ? { dryRun: true } : {}),
      cursor,
      batchSize,
    })

    totalScanned += result.scanned
    totalNormalized += result.normalized
    batchCount++

    process.stdout.write(
      `${label}Batch ${batchCount}: scanned=${result.scanned} normalized=${result.normalized}` +
        ` isDone=${result.isDone}\n`,
    )

    if (result.isDone) break
    cursor = result.continueCursor
  }

  process.stdout.write(`\n${label}Final totals (${batchCount} batch(es)):\n`)
  process.stdout.write(`  Scanned:    ${totalScanned}\n`)
  process.stdout.write(`  Normalized: ${totalNormalized}\n`)

  if (dryRun) {
    process.stdout.write(`\nPreview only — no rows were modified.\n`)
    process.stdout.write(`To apply: pnpm tsx scripts/hygiene-curated-routes.ts normalize-scores\n`)
  } else if (totalNormalized === 0) {
    process.stdout.write(`\nNo rows needed normalization (catalog already in-scale).\n`)
  } else {
    process.stdout.write(`\n${totalNormalized} rows normalized at rest.\n`)
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main(): void {
  const { subcommand, dryRun, batchSize, cursor } = parseArgs(process.argv)

  if (subcommand === 'normalize-scores') {
    normalizeScores(dryRun, batchSize, cursor)
  } else if (subcommand === null) {
    process.stderr.write('No subcommand specified. Use: normalize-scores. Run --help for usage.\n')
    process.exit(1)
  } else {
    process.stderr.write(`Unknown subcommand: ${subcommand}\n`)
    process.stderr.write('Available: normalize-scores. Run --help for usage.\n')
    process.exit(1)
  }
}

main()
