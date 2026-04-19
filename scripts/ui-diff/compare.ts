#!/usr/bin/env tsx

/**
 * Screenshot comparison script with configurable pixel tolerance.
 *
 * Compares baseline screenshots against current screenshots and generates:
 * - Diff images highlighting pixel differences
 * - Variance JSON report for CI/CD consumption
 *
 * Per 08d-component-parity-spec, uses ±1px tolerance for anti-aliasing.
 *
 * Usage:
 *   pnpm tsx scripts/ui-diff/compare.ts [--tolerance <number>] [--platform <rn|android|ios>]
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { basename, dirname, extname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { PNG } from 'pngjs'
import type {
  ComponentVariance,
  PixelVariance,
  PlatformReport,
  VarianceReport,
} from './variance-schema.js'
import { addPlatformReport, createEmptyReport, validateVarianceReport } from './variance-schema.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PROJECT_ROOT = join(__dirname, '../..')

interface CompareOptions {
  /** Pixel tolerance threshold (0-255) */
  tolerance: number
  /** Specific platform to compare (default: all) */
  platform?: 'rn' | 'android' | 'ios'
  /** Git commit SHA for report metadata */
  commitSha: string
  /** Git branch for report metadata */
  branch: string
}

/**
 * Loads a PNG image from disk.
 */
function loadPng(path: string): Promise<PNG> {
  return new Promise((resolve, reject) => {
    const buffer = readFileSync(path)
    const png = new PNG()
    png.parse(buffer, (err, data) => {
      if (err) {
        reject(err)
      } else {
        resolve(data)
      }
    })
  })
}

/**
 * Compares two PNG images pixel-by-pixel and returns variance metrics.
 */
function compareImages(
  baseline: PNG,
  current: PNG,
  tolerance: number,
): {
  variance: PixelVariance
  diffPng: PNG
} {
  const width = Math.max(baseline.width, current.width)
  const height = Math.max(baseline.height, current.height)

  const diffPng = new PNG({ width, height })
  let differentPixels = 0
  let maxChannelDiff = 0

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) << 2

      // Get baseline pixel (use black if out of bounds)
      const br = baseline.data[idx] ?? 0
      const bg = baseline.data[idx + 1] ?? 0
      const bb = baseline.data[idx + 2] ?? 0
      const ba = baseline.data[idx + 3] ?? 255

      // Get current pixel (use black if out of bounds)
      const cr = current.data[idx] ?? 0
      const cg = current.data[idx + 1] ?? 0
      const cb = current.data[idx + 2] ?? 0
      const ca = current.data[idx + 3] ?? 255

      // Calculate per-channel differences
      const rDiff = Math.abs(br - cr)
      const gDiff = Math.abs(bg - cg)
      const bDiff = Math.abs(bb - cb)
      const aDiff = Math.abs(ba - ca)

      // Track maximum channel difference
      maxChannelDiff = Math.max(maxChannelDiff, rDiff, gDiff, bDiff, aDiff)

      // Check if difference exceeds tolerance
      const isDifferent =
        rDiff > tolerance || gDiff > tolerance || bDiff > tolerance || aDiff > tolerance

      if (isDifferent) {
        differentPixels++
        // Highlight diff pixels in bright red
        diffPng.data[idx] = 255
        diffPng.data[idx + 1] = 0
        diffPng.data[idx + 2] = 0
        diffPng.data[idx + 3] = 255
      } else {
        // Use current pixel for unchanged areas
        diffPng.data[idx] = cr
        diffPng.data[idx + 1] = cg
        diffPng.data[idx + 2] = cb
        diffPng.data[idx + 3] = ca
      }
    }
  }

  const totalPixels = width * height
  const percentageDiff = (differentPixels / totalPixels) * 100

  return {
    variance: {
      totalPixels,
      differentPixels,
      percentageDiff,
      maxChannelDiff,
    },
    diffPng,
  }
}

/**
 * Saves a PNG image to disk.
 */
function savePng(png: PNG, path: string): void {
  const buffer = PNG.sync.write(png)
  const dir = dirname(path)
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }
  writeFileSync(path, buffer)
}

/**
 * Compares a single component's screenshots across all platforms.
 */
async function compareComponent(
  componentName: string,
  platform: 'rn' | 'android' | 'ios',
  tolerance: number,
): Promise<ComponentVariance | null> {
  const baselineDir = join(PROJECT_ROOT, 'screenshots', platform, 'baseline')
  const currentDir = join(PROJECT_ROOT, 'screenshots', platform, 'current')
  const diffDir = join(PROJECT_ROOT, 'screenshots', 'diff')

  const baselinePath = join(baselineDir, `${componentName}.png`)
  const currentPath = join(currentDir, `${componentName}.png`)
  const diffPath = join(diffDir, platform, `${componentName}.png`)

  // Check if both baseline and current exist
  if (!existsSync(baselinePath)) {
    console.warn(`⚠️  Baseline not found: ${baselinePath}`)
    return null
  }

  if (!existsSync(currentPath)) {
    console.warn(`⚠️  Current screenshot not found: ${currentPath}`)
    return null
  }

  try {
    const baseline = await loadPng(baselinePath)
    const current = await loadPng(currentPath)

    const { variance, diffPng } = compareImages(baseline, current, tolerance)
    savePng(diffPng, diffPath)

    // Determine status based on variance
    let status: 'pass' | 'fail' | 'warn'
    let message: string

    if (variance.differentPixels === 0) {
      status = 'pass'
      message = 'Perfect match'
    } else if (variance.percentageDiff > 5) {
      // More than 5% different is a failure
      status = 'fail'
      message = `${variance.percentageDiff.toFixed(2)}% pixels differ (${variance.differentPixels}/${variance.totalPixels})`
    } else if (variance.maxChannelDiff > tolerance * 2) {
      // Large channel differences indicate real visual changes
      status = 'fail'
      message = `Significant color variance (max diff: ${variance.maxChannelDiff})`
    } else {
      // Small differences are warnings (anti-aliasing, minor rendering differences)
      status = 'warn'
      message = `Minor variance (max diff: ${variance.maxChannelDiff}, ${variance.percentageDiff.toFixed(2)}% pixels)`
    }

    return {
      component: componentName,
      platform,
      baselinePath,
      currentPath,
      diffPath,
      variance,
      status,
      message,
    }
  } catch (error) {
    console.error(`✗ Error comparing ${componentName} (${platform}):`, error)
    return null
  }
}

/**
 * Gets list of components to compare from baseline directory.
 */
function getComponentList(platform: 'rn' | 'android' | 'ios'): string[] {
  const baselineDir = join(PROJECT_ROOT, 'screenshots', platform, 'baseline')

  if (!existsSync(baselineDir)) {
    console.warn(`⚠️  Baseline directory not found: ${baselineDir}`)
    return []
  }

  const files = readdirSync(baselineDir)
  return files.filter((f) => extname(f) === '.png').map((f) => basename(f, '.png'))
}

/**
 * Compares all components for a given platform.
 */
async function comparePlatform(
  platform: 'rn' | 'android' | 'ios',
  tolerance: number,
  options: Pick<CompareOptions, 'commitSha' | 'branch'>,
): Promise<PlatformReport> {
  console.log(`\n🔍 Comparing ${platform.toUpperCase()} screenshots...`)

  const components = getComponentList(platform)
  console.log(`  Found ${components.length} components`)

  if (components.length === 0) {
    console.warn(`  ⚠️  No baseline screenshots found for ${platform}`)
    return {
      platform,
      totalComponents: 0,
      passed: 0,
      failed: 0,
      warned: 0,
      components: [],
    }
  }

  const componentVariances: ComponentVariance[] = []

  for (const component of components) {
    const result = await compareComponent(component, platform, tolerance)
    if (result) {
      componentVariances.push(result)

      const icon = result.status === 'pass' ? '✓' : result.status === 'warn' ? '⚠' : '✗'
      console.log(`  ${icon} ${component}: ${result.message}`)
    }
  }

  const passed = componentVariances.filter((c) => c.status === 'pass').length
  const failed = componentVariances.filter((c) => c.status === 'fail').length
  const warned = componentVariances.filter((c) => c.status === 'warn').length

  console.log(`  Results: ${passed} passed, ${warned} warned, ${failed} failed`)

  return {
    platform,
    totalComponents: componentVariances.length,
    passed,
    failed,
    warned,
    components: componentVariances,
  }
}

/**
 * Gets current git commit SHA.
 */
function getGitCommitSha(): string {
  try {
    const { execSync } = require('node:child_process')
    return execSync('git rev-parse HEAD', { encoding: 'utf-8' }).trim()
  } catch {
    return 'unknown'
  }
}

/**
 * Gets current git branch name.
 */
function getGitBranch(): string {
  try {
    const { execSync } = require('node:child_process')
    return execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf-8' }).trim()
  } catch {
    return 'unknown'
  }
}

/**
 * Main entry point.
 */
async function main() {
  const args = process.argv.slice(2)

  // Parse command line arguments
  let tolerance = 1 // Default per 08d spec
  let platform: CompareOptions['platform'] | undefined

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--tolerance' && args[i + 1]) {
      tolerance = parseInt(args[i + 1], 10)
      i++
    } else if (args[i] === '--platform' && args[i + 1]) {
      const p = args[i + 1]
      if (p === 'rn' || p === 'android' || p === 'ios') {
        platform = p
      } else {
        console.error(`Invalid platform: ${p}`)
        process.exit(1)
      }
      i++
    }
  }

  console.log('🎨 UI Screenshot Comparison')
  console.log(`   Tolerance: ±${tolerance}px`)
  console.log(`   Platform: ${platform || 'all'}`)

  const commitSha = getGitCommitSha()
  const branch = getGitBranch()

  let report = createEmptyReport(commitSha, branch, tolerance)

  const platforms = platform ? [platform] : ['rn', 'android', 'ios']

  for (const p of platforms) {
    const platformReport = await comparePlatform(p, tolerance, { commitSha, branch })
    report = addPlatformReport(report, platformReport)
  }

  // Save variance report
  const reportPath = join(PROJECT_ROOT, 'screenshots', 'diff', 'variance.json')
  mkdirSync(dirname(reportPath), { recursive: true })
  writeFileSync(reportPath, JSON.stringify(report, null, 2))
  console.log(`\n📄 Variance report saved to: ${reportPath}`)

  // Print summary
  console.log('\n📊 Summary:')
  console.log(`   Total components: ${report.summary.totalComponents}`)
  console.log(`   Passed: ${report.summary.totalPassed}`)
  console.log(`   Warned: ${report.summary.totalWarned}`)
  console.log(`   Failed: ${report.summary.totalFailed}`)

  // Exit with appropriate code
  if (report.summary.totalFailed > 0) {
    console.log('\n✗ Comparison failed')
    process.exit(1)
  } else {
    console.log('\n✓ Comparison passed')
    process.exit(0)
  }
}

main().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
