#!/usr/bin/env tsx

/**
 * S3-T1: Curated route hygiene driver.
 *
 * Operator driver for at-rest catalog hygiene passes on curated_routes.
 * Sibling flag conventions follow scripts/backfill-curated-geometry.ts
 * (--flag=value, invoke internalActions via npx convex run module:fn '<argsJson>').
 *
 * Subcommands:
 *   normalize-scores   ÷100 out-of-scale editorial scores at rest (S3-T1)
 *
 * Flags:
 *   --dryRun           Preview the change-set without writing
 *
 * Usage:
 *   pnpm tsx scripts/hygiene-curated-routes.ts normalize-scores
 *   pnpm tsx scripts/hygiene-curated-routes.ts normalize-scores --dryRun
 */

import { execSync } from 'node:child_process'

// ---------------------------------------------------------------------------
// CLI arg parsing
// ---------------------------------------------------------------------------

type ParsedArgs = {
  subcommand: string | null
  dryRun: boolean
}

function parseArgs(argv: string[]): ParsedArgs {
  let subcommand: string | null = null
  let dryRun = false

  for (const arg of argv.slice(2)) {
    if (arg === '--dryRun' || arg === '--dry-run') {
      dryRun = true
    } else if (arg === '--help' || arg === '-h') {
      process.stdout.write(`
Hygiene Curated Routes Driver

Usage:
  pnpm tsx scripts/hygiene-curated-routes.ts normalize-scores
  pnpm tsx scripts/hygiene-curated-routes.ts normalize-scores --dryRun

Subcommands:
  normalize-scores   ÷100 out-of-scale editorial scores at rest (S3-T1)

Flags:
  --dryRun           Preview the change-set without writing
      `)
      process.exit(0)
    } else if (!arg.startsWith('--')) {
      subcommand = arg
    }
  }

  return { subcommand, dryRun }
}

// ---------------------------------------------------------------------------
// Convex CLI helper
// ---------------------------------------------------------------------------

type HygieneResult = {
  scanned: number
  normalized: number
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
// Subcommand: normalize-scores (S3-T1)
// ---------------------------------------------------------------------------

function normalizeScores(dryRun: boolean): void {
  const label = dryRun ? '[DRY RUN] ' : ''
  process.stdout.write(`${label}Normalizing editorial scores ÷100 at rest...\n`)

  const result = runHygieneFn('curatedGeometryHygiene:normalizeEditorialScores', {
    ...(dryRun ? { dryRun: true } : {}),
  })

  process.stdout.write(`\n${label}Results:\n`)
  process.stdout.write(`  Scanned:    ${result.scanned}\n`)
  process.stdout.write(`  Normalized: ${result.normalized}\n`)

  if (dryRun) {
    process.stdout.write(`\nPreview only — no rows were modified.\n`)
    process.stdout.write(`To apply: pnpm tsx scripts/hygiene-curated-routes.ts normalize-scores\n`)
  } else if (result.normalized === 0) {
    process.stdout.write(`\nNo rows needed normalization (catalog already in-scale).\n`)
  } else {
    process.stdout.write(`\n${result.normalized} rows normalized at rest.\n`)
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main(): void {
  const { subcommand, dryRun } = parseArgs(process.argv)

  if (subcommand === 'normalize-scores') {
    normalizeScores(dryRun)
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
