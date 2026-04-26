#!/usr/bin/env node
/**
 * Snapshot parity check script.
 *
 * Verifies that every shared story id in stories.parity.json has both .light and .dark
 * PNG snapshots in ios/LaneShadowTests/__Snapshots__/StorySnapshotTests/, and that no
 * orphan snapshot files exist.
 *
 * Usage: pnpm snapshots:check
 *
 * Exits 0 on success, non-zero on parity violation.
 */

import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '../..')

interface ParityManifest {
  shared: string[]
  ios_only: string[]
  android_only: string[]
  _note?: string
}

interface CheckResult {
  passed: boolean
  errors: string[]
}

function loadParityManifest(): ParityManifest {
  const manifestPath = join(ROOT, 'tokens/sandbox/snapshots.parity.json')
  if (!existsSync(manifestPath)) {
    throw new Error(`snapshots.parity.json not found at ${manifestPath}`)
  }
  const content = readFileSync(manifestPath, 'utf-8')
  return JSON.parse(content)
}

function getSnapshotFiles(): string[] {
  const snapshotDir = join(ROOT, 'ios/LaneShadowTests/__Snapshots__/StorySnapshotTests')
  if (!existsSync(snapshotDir)) {
    throw new Error(`Snapshot directory not found: ${snapshotDir}`)
  }

  const files = readdirSync(snapshotDir)
  return files.filter((f) => f.endsWith('.png'))
}

function extractStoryIdAndThemeFromFileName(fileName: string): {
  storyId: string
  theme: 'light' | 'dark'
} {
  // File format: test_allStories_lightAndDark_snapshots.{storyId}-{theme}.png
  // where storyId can contain hyphens and theme is always 'light' or 'dark'
  const prefix = 'test_allStories_lightAndDark_snapshots.'
  const suffix = '.png'

  if (!fileName.startsWith(prefix) || !fileName.endsWith(suffix)) {
    throw new Error(`Invalid snapshot file name format: ${fileName}`)
  }

  // Remove prefix and suffix
  const middle = fileName.slice(prefix.length, -suffix.length)

  // Extract theme (last hyphen-separated part must be 'light' or 'dark')
  const lastHyphenIndex = middle.lastIndexOf('-')
  if (lastHyphenIndex === -1) {
    throw new Error(`Invalid snapshot file name format (no theme separator): ${fileName}`)
  }

  const storyId = middle.slice(0, lastHyphenIndex)
  const theme = middle.slice(lastHyphenIndex + 1)

  if (theme !== 'light' && theme !== 'dark') {
    throw new Error(
      `Invalid theme in snapshot file name: ${fileName} (got '${theme}', expected 'light' or 'dark')`,
    )
  }

  return { storyId, theme: theme as 'light' | 'dark' }
}

function _extractStoryIdFromFileName(fileName: string): string {
  return extractStoryIdAndThemeFromFileName(fileName).storyId
}

function checkSnapshots(): CheckResult {
  const manifest = loadParityManifest()
  const snapshotFiles = getSnapshotFiles()

  const errors: string[] = []
  const trackedStoryIds = new Set([...manifest.shared, ...manifest.ios_only])

  // Check 1: Every tracked story has both light and dark snapshots
  for (const storyId of trackedStoryIds) {
    const lightFile = snapshotFiles.find((f) => {
      const { storyId: sid, theme } = extractStoryIdAndThemeFromFileName(f)
      return sid === storyId && theme === 'light'
    })
    const darkFile = snapshotFiles.find((f) => {
      const { storyId: sid, theme } = extractStoryIdAndThemeFromFileName(f)
      return sid === storyId && theme === 'dark'
    })

    if (!lightFile) {
      errors.push(`Missing light snapshot for story: ${storyId}`)
    }
    if (!darkFile) {
      errors.push(`Missing dark snapshot for story: ${storyId}`)
    }
  }

  // Check 2: No orphan snapshot files (snapshots without corresponding story ids)
  const snapshottedStoryIds = new Set(
    snapshotFiles.map((f) => extractStoryIdAndThemeFromFileName(f).storyId),
  )

  for (const snapshottedId of snapshottedStoryIds) {
    if (!trackedStoryIds.has(snapshottedId)) {
      errors.push(
        `Orphan snapshot found: ${snapshottedId} (no matching story id in snapshots.parity.json)`,
      )
    }
  }

  return {
    passed: errors.length === 0,
    errors,
  }
}

function main() {
  console.log('🔍 Checking iOS snapshot parity...\n')

  try {
    const result = checkSnapshots()

    if (result.passed) {
      const snapshotDir = join(ROOT, 'ios/LaneShadowTests/__Snapshots__/StorySnapshotTests')
      const fileCount = readdirSync(snapshotDir).filter((f) => f.endsWith('.png')).length

      console.log('✅ Snapshot parity check passed')
      console.log(`   Verified ${fileCount} snapshot PNGs`)
      console.log('   All tracked stories have light + dark snapshots')
      console.log('   No orphan snapshot files found\n')
      process.exit(0)
    } else {
      console.log('❌ Snapshot parity check failed\n')
      console.log('Errors:\n')
      for (const error of result.errors) {
        console.log(`  - ${error}`)
      }
      console.log(`\n${result.errors.length} error(s) found\n`)
      process.exit(1)
    }
  } catch (error) {
    console.error('❌ Fatal error during parity check:\n')
    console.error(error instanceof Error ? error.message : String(error))
    process.exit(1)
  }
}

main()
