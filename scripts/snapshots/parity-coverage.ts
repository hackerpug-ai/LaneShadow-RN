#!/usr/bin/env node
/**
 * Compute snapshot parity coverage from `tokens/sandbox/snapshots.parity.json`.
 *
 * Coverage formula:
 *   coverage = shared / (shared + ios_only + android_only)
 *
 * Prints a summary table and exits 0 if coverage ≥ threshold, else exits 1.
 *
 * Usage:
 *   pnpm snapshots:parity-coverage                    # default threshold 95%
 *   pnpm snapshots:parity-coverage --threshold 30     # warn-only floor
 *   pnpm snapshots:parity-coverage --threshold 95     # production target
 */

import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '../..')
const MANIFEST_PATH = join(ROOT, 'tokens/sandbox/snapshots.parity.json')

const DEFAULT_THRESHOLD = 95

interface ParityManifest {
  shared: string[]
  ios_only: string[]
  android_only: string[]
  version?: string
  generated?: string
  _note?: string
}

function parseThreshold(argv: string[]): number {
  const flagIndex = argv.indexOf('--threshold')
  if (flagIndex === -1) return DEFAULT_THRESHOLD

  const valueRaw = argv[flagIndex + 1]
  if (valueRaw === undefined) {
    throw new Error('--threshold flag requires a numeric value (e.g. --threshold 95)')
  }
  const value = Number(valueRaw)
  if (!Number.isFinite(value) || value < 0 || value > 100) {
    throw new Error(`--threshold must be a number between 0 and 100 (got '${valueRaw}')`)
  }
  return value
}

function loadManifest(): ParityManifest {
  if (!existsSync(MANIFEST_PATH)) {
    throw new Error(
      `snapshots.parity.json not found at ${MANIFEST_PATH}. ` +
        'Run `pnpm snapshots:sync-manifest` first.',
    )
  }
  const raw = readFileSync(MANIFEST_PATH, 'utf-8')
  return JSON.parse(raw) as ParityManifest
}

function pad(label: string, value: string, width = 14): string {
  return label.padEnd(width, ' ') + value
}

function main(): void {
  const threshold = parseThreshold(process.argv.slice(2))
  const manifest = loadManifest()

  const sharedCount = manifest.shared.length
  const iosOnlyCount = manifest.ios_only.length
  const androidOnlyCount = manifest.android_only.length
  const total = sharedCount + iosOnlyCount + androidOnlyCount

  const coverage = total === 0 ? 0 : (sharedCount / total) * 100
  const passed = coverage >= threshold

  console.log('Snapshot Parity Coverage')
  console.log('────────────────────────')
  console.log(pad('Shared:', String(sharedCount)))
  console.log(pad('iOS only:', String(iosOnlyCount)))
  console.log(pad('Android only:', String(androidOnlyCount)))
  console.log(pad('Total:', String(total)))
  console.log(pad('Coverage:', `${coverage.toFixed(1)}%`))
  console.log(pad('Threshold:', `${threshold}%`))
  console.log(pad('Status:', passed ? 'PASS' : 'FAIL'))

  process.exit(passed ? 0 : 1)
}

try {
  main()
} catch (err) {
  console.error('❌ parity-coverage failed:')
  console.error(err instanceof Error ? err.message : String(err))
  process.exit(2)
}
