#!/usr/bin/env -S pnpm tsx

/**
 * run.ts
 *
 * Umbrella orchestrator for design review pipeline
 *
 * Usage: pnpm design:review [--screens=<screens>] [--severity-threshold=<level>] [--dry-run]
 *
 * Pipeline steps:
 * 1. design:references - Render reference PNGs
 * 2. xcodebuild test - Capture screenshots (manual step)
 * 3. design:export - Export from xcresult
 * 4. design:manifest - Build manifest
 * 5. design:eval - Run visual eval
 * 6. design:report - Merge reports
 */

import { spawn } from 'node:child_process'
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const ROOT_DIR = join(__dirname, '../..')
const DESIGN_REVIEW_DIR = join(ROOT_DIR, '.design-review')
const REPORT_JSON_PATH = join(ROOT_DIR, '.design-review/report.json')
const LEGACY_REPORT_DIR = join(ROOT_DIR, '.spec/design/reports/latest')

export interface DesignReviewIssue {
  issue_id: string
  screen: string
  state: string
  theme: string
  component: string
  issue_type: string
  severity: string
  confidence: number
  observed: string
  expected: string
  location: { bounding_box: { x: number; y: number; width: number; height: number } }
  fix_hint: string
  design_token: string
  code_search_hint: string
}

export interface DesignReviewSummary {
  total: number
  high: number
  med: number
  low: number
  screens_passed: number
  screens_failed: number
}

export interface DesignReport {
  issues: DesignReviewIssue[]
  summary: DesignReviewSummary
}

interface LegacyDesignReport {
  issues: DesignReviewIssue[]
  results: DesignReviewIssue[]
  summary: DesignReviewSummary
}

interface ManifestEntry {
  id: string
  screen: string
  state: string
  theme: string
}

interface Manifest {
  entries: ManifestEntry[]
  generated_at: string
}

export interface RunOptions {
  screens: string[]
  severityThreshold: 'low' | 'med' | 'high'
  dryRun: boolean
}

/**
 * Run a pnpm script and wait for completion
 */
function runScript(scriptName: string, env: Record<string, string> = {}): Promise<void> {
  return new Promise((resolve, reject) => {
    console.log(`\n🔧 Running: pnpm ${scriptName}`)

    const proc = spawn('pnpm', [scriptName], {
      stdio: 'inherit',
      env: { ...process.env, ...env },
    })

    proc.on('close', (code) => {
      if (code === 0) {
        resolve()
      } else {
        reject(new Error(`Script ${scriptName} exited with code ${code}`))
      }
    })

    proc.on('error', (error) => {
      reject(error)
    })
  })
}

function loadManifest(manifestPath: string): Manifest {
  if (!existsSync(manifestPath)) {
    throw new Error(`Manifest not found: ${manifestPath}`)
  }

  const content = readFileSync(manifestPath, 'utf-8')
  return JSON.parse(content) as Manifest
}

export async function writeAutomationFallbackEvals(options: {
  manifestPath: string
  outputDir: string
  reason: string
}): Promise<void> {
  const { manifestPath, outputDir, reason } = options
  const manifest = loadManifest(manifestPath)

  mkdirSync(outputDir, { recursive: true })

  for (const entry of manifest.entries) {
    const evalResult = {
      entry_id: entry.id,
      screen: entry.screen,
      state: entry.state,
      theme: entry.theme,
      evaluated_at: new Date().toISOString(),
      status: 'success' as const,
      issues: [
        {
          component: '.design-review-automation',
          passed: false,
          issue_type: 'missing' as const,
          observed: {
            note: reason,
          },
          expected: {
            note: 'Anthropic visual evaluation available in automation',
          },
          severity: 'med' as const,
          confidence: 1,
          fix_hint: 'Set ANTHROPIC_API_KEY to enable multimodal design evaluation.',
        },
      ],
      retry_count: 0,
    }

    writeFileSync(join(outputDir, `${entry.id}.json`), JSON.stringify(evalResult, null, 2))
  }
}

export async function clearDesignReviewOutputs(rootDir: string = ROOT_DIR): Promise<void> {
  const designReviewDir = join(rootDir, '.design-review')
  const legacyReportDir = join(rootDir, '.spec/design/reports/latest')
  const pathsToRemove = [
    join(designReviewDir, 'captures'),
    join(designReviewDir, 'evals'),
    join(designReviewDir, 'manifest.json'),
    join(designReviewDir, 'report.json'),
    join(designReviewDir, 'report.html'),
    legacyReportDir,
  ]

  for (const path of pathsToRemove) {
    rmSync(path, { recursive: true, force: true })
  }
}

function publishLegacyReportArtifacts(report: DesignReport): void {
  mkdirSync(LEGACY_REPORT_DIR, { recursive: true })

  const legacyReport: LegacyDesignReport = {
    issues: report.issues,
    results: report.issues,
    summary: report.summary,
  }

  writeFileSync(join(LEGACY_REPORT_DIR, 'report.json'), JSON.stringify(legacyReport, null, 2))

  const reportHtmlPath = join(DESIGN_REVIEW_DIR, 'report.html')
  if (existsSync(reportHtmlPath)) {
    cpSync(reportHtmlPath, join(LEGACY_REPORT_DIR, 'report.html'))
  }

  const capturesDir = join(DESIGN_REVIEW_DIR, 'captures')
  if (existsSync(capturesDir)) {
    cpSync(capturesDir, join(LEGACY_REPORT_DIR, 'captures'), { recursive: true })
  }
}

/**
 * Main orchestrator function
 */
export async function runDesignReview(options: RunOptions): Promise<DesignReport> {
  const { screens, severityThreshold, dryRun } = options

  // Default to auth-screen if no screens specified
  const screensToProcess = screens.length > 0 ? screens : ['auth-screen']

  console.log('🎨 Design Review Pipeline')
  console.log(`   Screens: ${screensToProcess.join(', ')}`)
  console.log(`   Severity: ${severityThreshold}`)
  console.log(`   Dry Run: ${dryRun}`)

  // Build environment with severity threshold
  const env = {
    DESIGN_REVIEW_SEVERITY: severityThreshold,
    DESIGN_REVIEW_SCREENS: screensToProcess.join(','),
  }
  const manifestPath = join(DESIGN_REVIEW_DIR, 'manifest.json')
  const visualEvalsDir = join(DESIGN_REVIEW_DIR, 'evals/visual')

  try {
    await clearDesignReviewOutputs()

    // Step 1: Render references
    await runScript('design:references', env)

    // Step 2: Export from xcresult (skip if dry-run)
    if (!dryRun) {
      await runScript('design:export', env)
    }

    // Step 3: Build manifest
    await runScript('design:manifest', env)

    // Stop here if dry-run
    if (dryRun) {
      console.log('\n✅ Dry run complete (stopped after manifest)')
      return {
        issues: [],
        summary: { total: 0, high: 0, med: 0, low: 0, screens_passed: 0, screens_failed: 0 },
      }
    }

    // Step 4: Run visual eval
    if (process.env.ANTHROPIC_API_KEY) {
      await runScript('design:eval', env)
    } else {
      console.log('\n⚠️  ANTHROPIC_API_KEY missing; writing automation-safe fallback evals')
      await writeAutomationFallbackEvals({
        manifestPath,
        outputDir: visualEvalsDir,
        reason: 'ANTHROPIC_API_KEY environment variable is required',
      })
    }

    // Step 5: Merge reports
    await runScript('design:report', env)

    // Load and parse report.json
    if (!existsSync(REPORT_JSON_PATH)) {
      throw new Error(`Report not found: ${REPORT_JSON_PATH}`)
    }

    const reportContent = readFileSync(REPORT_JSON_PATH, 'utf-8')
    const report = JSON.parse(reportContent) as DesignReport
    publishLegacyReportArtifacts(report)

    console.log('\n✅ Design review complete')
    console.log(`   Total issues: ${report.summary.total}`)
    console.log(
      `   High: ${report.summary.high}, Med: ${report.summary.med}, Low: ${report.summary.low}`,
    )

    return report
  } catch (error) {
    console.error('\n❌ Pipeline failed:', error)
    throw error
  }
}

/**
 * CLI entry point
 */
async function main() {
  const args = process.argv.slice(2)

  // Parse CLI flags
  const options: RunOptions = {
    screens: [],
    severityThreshold: 'med',
    dryRun: false,
  }

  for (const arg of args) {
    if (arg.startsWith('--screens=')) {
      options.screens = arg.split('=')[1].split(',')
    } else if (arg === '--screens') {
      const nextArg = args[args.indexOf(arg) + 1]
      if (nextArg) {
        options.screens = nextArg.split(',')
      }
    } else if (arg.startsWith('--severity-threshold=')) {
      const severity = arg.split('=')[1] as 'low' | 'med' | 'high'
      if (severity === 'low' || severity === 'med' || severity === 'high') {
        options.severityThreshold = severity
      }
    } else if (arg === '--severity-threshold') {
      const nextArg = args[args.indexOf(arg) + 1] as 'low' | 'med' | 'high' | undefined
      if (nextArg === 'low' || nextArg === 'med' || nextArg === 'high') {
        options.severityThreshold = nextArg
      }
    } else if (arg === '--dry-run') {
      options.dryRun = true
    }
  }

  try {
    await runDesignReview(options)
    process.exit(0)
  } catch (error) {
    console.error('Fatal error:', error)
    process.exit(1)
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('❌ Design review failed:', error)
    process.exit(1)
  })
}
