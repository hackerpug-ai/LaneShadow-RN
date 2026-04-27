#!/usr/bin/env node
/**
 * Compute snapshot parity coverage from `tokens/sandbox/snapshots.parity.json`.
 *
 * Two modes:
 *
 * 1) **Per-tier mode (default).** Reads tier thresholds from a config file
 *    (default `tokens/sandbox/parity-thresholds.json`). For each tier
 *    derived from the story id (`tier = id.split('.')[0]`), computes
 *    `coverage = shared / (shared + ios_only + android_only)` and
 *    compares against the tier's threshold.
 *
 *    Exit codes:
 *      0 — every `enforce: true` tier meets its threshold
 *      1 — any  `enforce: true` tier is below its threshold
 *      2 — config explicitly requested but missing or invalid
 *
 *    Tiers marked `exempt: true` show as EXEMPT and never affect the exit code.
 *    Tiers marked `enforce: false` (advisory) show with computed status but
 *    never affect the exit code.
 *
 * 2) **Legacy single-threshold mode.** When `--threshold N` is passed, the
 *    config is ignored and the script computes a single global coverage
 *    across all tiers. Preserves the original UC-SBX-08 contract for
 *    ad-hoc checks.
 *
 * Usage:
 *   pnpm snapshots:parity-coverage                         # per-tier (default config)
 *   pnpm snapshots:parity-coverage --config path.json      # per-tier (custom config)
 *   pnpm snapshots:parity-coverage --threshold 30          # legacy single global threshold
 */

import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '../..')
const MANIFEST_PATH = join(ROOT, 'tokens/sandbox/snapshots.parity.json')
const DEFAULT_CONFIG_PATH = join(ROOT, 'tokens/sandbox/parity-thresholds.json')

// ─── Types ────────────────────────────────────────────────────────────────

interface ParityManifest {
  shared: string[]
  ios_only: string[]
  android_only: string[]
  version?: string
  generated?: string
  _note?: string
}

interface TierConfig {
  threshold?: number
  enforce?: boolean
  exempt?: boolean
}

interface ThresholdConfig {
  _note?: string
  tiers: Record<string, TierConfig>
}

interface TierBucket {
  shared: number
  ios_only: number
  android_only: number
}

interface TierRow {
  tier: string
  shared: number
  ios_only: number
  android_only: number
  total: number
  coveragePct: number
  config: TierConfig | undefined
  status: 'PASS' | 'FAIL' | 'EXEMPT' | 'ADVISORY-PASS' | 'ADVISORY-FAIL' | 'UNCONFIGURED'
  enforced: boolean
}

// ─── Argument parsing ─────────────────────────────────────────────────────

interface ParsedArgs {
  legacyThreshold: number | null
  configPath: string
  configExplicit: boolean
}

function parseArgs(argv: string[]): ParsedArgs {
  let legacyThreshold: number | null = null
  let configPath = DEFAULT_CONFIG_PATH
  let configExplicit = false

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--threshold') {
      const valueRaw = argv[i + 1]
      if (valueRaw === undefined) {
        throw new Error('--threshold flag requires a numeric value (e.g. --threshold 95)')
      }
      const value = Number(valueRaw)
      if (!Number.isFinite(value) || value < 0 || value > 100) {
        throw new Error(`--threshold must be a number between 0 and 100 (got '${valueRaw}')`)
      }
      legacyThreshold = value
      i++
    } else if (arg === '--config') {
      const valueRaw = argv[i + 1]
      if (valueRaw === undefined) {
        throw new Error('--config flag requires a path argument')
      }
      configPath = valueRaw.startsWith('/') ? valueRaw : join(process.cwd(), valueRaw)
      configExplicit = true
      i++
    }
  }

  return { legacyThreshold, configPath, configExplicit }
}

// ─── Loaders ──────────────────────────────────────────────────────────────

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

class ConfigError extends Error {}

function loadConfig(configPath: string, explicit: boolean): ThresholdConfig | null {
  if (!existsSync(configPath)) {
    if (explicit) {
      throw new ConfigError(`parity-thresholds config not found at ${configPath}`)
    }
    return null
  }
  let raw: string
  try {
    raw = readFileSync(configPath, 'utf-8')
  } catch (err) {
    throw new ConfigError(
      `unable to read parity-thresholds config at ${configPath}: ${
        err instanceof Error ? err.message : String(err)
      }`,
    )
  }
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch (err) {
    throw new ConfigError(
      `parity-thresholds config at ${configPath} is not valid JSON: ${
        err instanceof Error ? err.message : String(err)
      }`,
    )
  }
  if (!parsed || typeof parsed !== 'object') {
    throw new ConfigError(`parity-thresholds config at ${configPath} must be a JSON object`)
  }
  const tiers = (parsed as { tiers?: unknown }).tiers
  if (!tiers || typeof tiers !== 'object' || Array.isArray(tiers)) {
    throw new ConfigError(
      `parity-thresholds config at ${configPath} must have a "tiers" object property`,
    )
  }
  for (const [tierName, value] of Object.entries(tiers as Record<string, unknown>)) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      throw new ConfigError(
        `tier "${tierName}" in ${configPath} must be an object (got ${typeof value})`,
      )
    }
    const cfg = value as TierConfig
    if (cfg.exempt === true) continue
    if (cfg.threshold === undefined) {
      throw new ConfigError(
        `tier "${tierName}" in ${configPath} must define either "threshold" or "exempt: true"`,
      )
    }
    if (typeof cfg.threshold !== 'number' || cfg.threshold < 0 || cfg.threshold > 100) {
      throw new ConfigError(
        `tier "${tierName}" threshold in ${configPath} must be a number between 0 and 100 (got ${JSON.stringify(
          cfg.threshold,
        )})`,
      )
    }
    if (cfg.enforce !== undefined && typeof cfg.enforce !== 'boolean') {
      throw new ConfigError(
        `tier "${tierName}" enforce flag in ${configPath} must be boolean (got ${typeof cfg.enforce})`,
      )
    }
  }
  return parsed as ThresholdConfig
}

// ─── Tier extraction ──────────────────────────────────────────────────────

function bucketByTier(manifest: ParityManifest): Map<string, TierBucket> {
  const tiers = new Map<string, TierBucket>()
  const ensure = (tier: string): TierBucket => {
    let bucket = tiers.get(tier)
    if (!bucket) {
      bucket = { shared: 0, ios_only: 0, android_only: 0 }
      tiers.set(tier, bucket)
    }
    return bucket
  }
  for (const id of manifest.shared) ensure(id.split('.')[0]).shared++
  for (const id of manifest.ios_only) ensure(id.split('.')[0]).ios_only++
  for (const id of manifest.android_only) ensure(id.split('.')[0]).android_only++
  return tiers
}

function classify(bucket: TierBucket, cfg: TierConfig | undefined): TierRow['status'] {
  if (!cfg) return 'UNCONFIGURED'
  if (cfg.exempt === true) return 'EXEMPT'
  const total = bucket.shared + bucket.ios_only + bucket.android_only
  const coverage = total === 0 ? 0 : (bucket.shared / total) * 100
  const passes = cfg.threshold !== undefined && coverage >= cfg.threshold
  const advisory = cfg.enforce === false
  if (advisory) return passes ? 'ADVISORY-PASS' : 'ADVISORY-FAIL'
  return passes ? 'PASS' : 'FAIL'
}

function buildRows(
  manifest: ParityManifest,
  config: ThresholdConfig,
): { rows: TierRow[]; totals: TierBucket } {
  const buckets = bucketByTier(manifest)
  const rows: TierRow[] = []
  const totals: TierBucket = { shared: 0, ios_only: 0, android_only: 0 }

  // Stable ordering: configured tiers first (in config order), then any
  // unconfigured tiers found in the manifest (alphabetically).
  const configuredTiers = Object.keys(config.tiers)
  const unconfiguredTiers = [...buckets.keys()].filter((t) => !configuredTiers.includes(t)).sort()
  const orderedTiers = [...configuredTiers, ...unconfiguredTiers]

  for (const tier of orderedTiers) {
    const bucket = buckets.get(tier) ?? { shared: 0, ios_only: 0, android_only: 0 }
    const total = bucket.shared + bucket.ios_only + bucket.android_only
    const coveragePct = total === 0 ? 0 : (bucket.shared / total) * 100
    const cfg = config.tiers[tier]
    const status = classify(bucket, cfg)
    const enforced = cfg?.exempt !== true && cfg?.enforce !== false && cfg?.threshold !== undefined
    rows.push({
      tier,
      shared: bucket.shared,
      ios_only: bucket.ios_only,
      android_only: bucket.android_only,
      total,
      coveragePct,
      config: cfg,
      status,
      enforced,
    })
    totals.shared += bucket.shared
    totals.ios_only += bucket.ios_only
    totals.android_only += bucket.android_only
  }

  return { rows, totals }
}

// ─── Rendering ────────────────────────────────────────────────────────────

const COLS = [
  'Tier',
  'Shared',
  'iOS only',
  'Android only',
  'Total',
  'Coverage',
  'Threshold',
  'Status',
] as const

function renderTable(rows: TierRow[], totals: TierBucket): string {
  const headerCells: string[] = [...COLS]
  const dataRows: string[][] = rows.map((r) => [
    r.tier,
    String(r.shared),
    String(r.ios_only),
    String(r.android_only),
    String(r.total),
    `${r.coveragePct.toFixed(1)}%`,
    formatThreshold(r),
    formatStatus(r),
  ])

  const totalCount = totals.shared + totals.ios_only + totals.android_only
  const totalCoverage = totalCount === 0 ? 0 : (totals.shared / totalCount) * 100
  const totalRow = [
    'TOTAL',
    String(totals.shared),
    String(totals.ios_only),
    String(totals.android_only),
    String(totalCount),
    `${totalCoverage.toFixed(1)}%`,
    '—',
    '—',
  ]

  // Compute per-column widths.
  const widths = headerCells.map((h, i) =>
    Math.max(h.length, ...dataRows.map((r) => r[i].length), totalRow[i].length),
  )

  const formatRow = (cells: string[]) =>
    `| ${cells.map((c, i) => c.padEnd(widths[i], ' ')).join(' | ')} |`
  const sep = `|${widths.map((w) => '-'.repeat(w + 2)).join('|')}|`

  const lines: string[] = []
  lines.push(formatRow(headerCells))
  lines.push(sep)
  for (const row of dataRows) {
    lines.push(formatRow(row))
  }
  lines.push(sep)
  lines.push(formatRow(totalRow))
  return lines.join('\n')
}

function formatThreshold(row: TierRow): string {
  if (!row.config || row.config.exempt === true || row.config.threshold === undefined) return '—'
  return `${row.config.threshold}%`
}

function formatStatus(row: TierRow): string {
  switch (row.status) {
    case 'EXEMPT':
      return 'EXEMPT'
    case 'PASS':
      return 'PASS'
    case 'FAIL':
      return 'FAIL'
    case 'ADVISORY-PASS':
      return '(advisory) PASS'
    case 'ADVISORY-FAIL':
      return '(advisory)'
    case 'UNCONFIGURED':
      return '(unconfigured)'
  }
}

function summarize(rows: TierRow[]): { violations: TierRow[]; passed: boolean } {
  const violations = rows.filter((r) => r.enforced && r.status === 'FAIL')
  return { violations, passed: violations.length === 0 }
}

// ─── Legacy mode rendering ────────────────────────────────────────────────

function pad(label: string, value: string, width = 14): string {
  return label.padEnd(width, ' ') + value
}

function runLegacyMode(threshold: number, manifest: ParityManifest): never {
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

// ─── Per-tier mode ────────────────────────────────────────────────────────

function runPerTierMode(config: ThresholdConfig, manifest: ParityManifest): never {
  const { rows, totals } = buildRows(manifest, config)
  const { violations, passed } = summarize(rows)

  console.log('Snapshot Parity Coverage (per-tier)')
  console.log('───────────────────────────────────')
  console.log(renderTable(rows, totals))
  console.log('')
  if (passed) {
    if (violations.length === 0) {
      const enforcedCount = rows.filter((r) => r.enforced).length
      console.log(`Status: PASS — all ${enforcedCount} enforced tier(s) meet their thresholds`)
    }
  } else {
    const summary = violations
      .map((v) => {
        const threshold = v.config?.threshold ?? 0
        return `${v.tier} (${v.coveragePct.toFixed(1)}% < ${threshold}%)`
      })
      .join(', ')
    console.log(`Status: FAIL — ${summary} below threshold`)
  }
  process.exit(passed ? 0 : 1)
}

// ─── Entry point ──────────────────────────────────────────────────────────

function main(): void {
  const args = parseArgs(process.argv.slice(2))
  const manifest = loadManifest()

  if (args.legacyThreshold !== null) {
    runLegacyMode(args.legacyThreshold, manifest)
    return // unreachable; satisfies tsc
  }

  let config: ThresholdConfig | null
  try {
    config = loadConfig(args.configPath, args.configExplicit)
  } catch (err) {
    if (err instanceof ConfigError) {
      console.error('❌ parity-coverage config error:')
      console.error(err.message)
      process.exit(2)
    }
    throw err
  }

  if (!config) {
    // Default config not found and not explicitly requested: this is a fatal
    // setup error — agents should commit a default config alongside this script.
    console.error('❌ parity-coverage config error:')
    console.error(
      `default config not found at ${DEFAULT_CONFIG_PATH}. ` +
        'Either commit the default `tokens/sandbox/parity-thresholds.json` or pass ' +
        '`--threshold N` for legacy single-threshold mode.',
    )
    process.exit(2)
  }

  runPerTierMode(config, manifest)
}

try {
  main()
} catch (err) {
  console.error('❌ parity-coverage failed:')
  console.error(err instanceof Error ? err.message : String(err))
  process.exit(2)
}
