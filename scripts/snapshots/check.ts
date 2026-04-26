#!/usr/bin/env node
/**
 * Snapshot parity check script.
 *
 * Verifies that every story ID in the parity manifest has both .light and .dark
 * PNG snapshots in the correct platform directories:
 * - iOS: ios/LaneShadowTests/__Snapshots__/StorySnapshotTests/ (hyphen-separated IDs)
 * - Android: android/app/src/androidTest/screenshots/AllStoriesSnapshotTest/ (dot-separated IDs)
 *
 * Also verifies no orphan snapshot files exist.
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

interface PlatformSnapshots {
  ios: Map<string, Set<'light' | 'dark'>>
  android: Map<string, Set<'light' | 'dark'>>
}

function getSnapshotFiles(): PlatformSnapshots {
  const ios = new Map<string, Set<'light' | 'dark'>>()
  const android = new Map<string, Set<'light' | 'dark'>>()

  // iOS snapshots: ios/LaneShadowTests/__Snapshots__/StorySnapshotTests/
  const iosSnapshotDir = join(ROOT, 'ios/LaneShadowTests/__Snapshots__/StorySnapshotTests')
  if (existsSync(iosSnapshotDir)) {
    const files = readdirSync(iosSnapshotDir).filter((f) => f.endsWith('.png'))
    for (const file of files) {
      const { storyId, theme } = extractStoryIdAndThemeFromFileName(file)
      if (!ios.has(storyId)) {
        ios.set(storyId, new Set())
      }
      ios.get(storyId)!.add(theme)
    }
  }

  // Android snapshots: android/app/src/androidTest/screenshots/AllStoriesSnapshotTest/
  const androidSnapshotDir = join(
    ROOT,
    'android/app/src/androidTest/screenshots/AllStoriesSnapshotTest',
  )
  if (existsSync(androidSnapshotDir)) {
    const files = readdirSync(androidSnapshotDir).filter((f) => f.endsWith('.png'))
    for (const file of files) {
      // Android uses dot-separated story IDs with theme suffix
      // Format: {storyId}.{theme}.png (e.g., atoms.button.primary.light.png)
      const match = file.match(/^(.+)\.(light|dark)\.png$/)
      if (!match) {
        throw new Error(`Invalid Android snapshot file name format: ${file}`)
      }
      const [, storyId, theme] = match
      if (!android.has(storyId)) {
        android.set(storyId, new Set())
      }
      android.get(storyId)!.add(theme as 'light' | 'dark')
    }
  }

  return { ios, android }
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
  const { ios: iosSnapshots, android: androidSnapshots } = getSnapshotFiles()

  const errors: string[] = []

  // iOS stories: shared + ios_only
  const iosTrackedIds = new Set([...manifest.shared, ...manifest.ios_only])

  // Android stories: shared (as dot-separated IDs)
  const androidTrackedIds = new Set(manifest.shared)

  // Check iOS: every tracked story has both light and dark snapshots
  for (const storyId of iosTrackedIds) {
    const isoId = storyId // iOS uses hyphens
    const themes = iosSnapshots.get(isoId)

    if (!themes?.has('light')) {
      errors.push(`iOS: Missing light snapshot for story: ${storyId}`)
    }
    if (!themes?.has('dark')) {
      errors.push(`iOS: Missing dark snapshot for story: ${storyId}`)
    }
  }

  // Check Android: every tracked story has both light and dark snapshots
  for (const storyId of androidTrackedIds) {
    const themes = androidSnapshots.get(storyId)

    if (!themes?.has('light')) {
      errors.push(`Android: Missing light snapshot for story: ${storyId}`)
    }
    if (!themes?.has('dark')) {
      errors.push(`Android: Missing dark snapshot for story: ${storyId}`)
    }
  }

  // Check for orphan snapshots on iOS
  for (const snapshottedId of iosSnapshots.keys()) {
    if (!iosTrackedIds.has(snapshottedId)) {
      errors.push(
        `iOS: Orphan snapshot found: ${snapshottedId} (no matching story id in snapshots.parity.json)`,
      )
    }
  }

  // Check for orphan snapshots on Android
  for (const snapshottedId of androidSnapshots.keys()) {
    if (!androidTrackedIds.has(snapshottedId)) {
      errors.push(
        `Android: Orphan snapshot found: ${snapshottedId} (no matching story id in snapshots.parity.json)`,
      )
    }
  }

  return {
    passed: errors.length === 0,
    errors,
  }
}

function main() {
  console.log('🔍 Checking snapshot parity (iOS + Android)...\n')

  try {
    const { ios: iosSnapshots, android: androidSnapshots } = getSnapshotFiles()
    const result = checkSnapshots()

    if (result.passed) {
      const iosFileCount = Array.from(iosSnapshots.values()).reduce(
        (sum, themes) => sum + themes.size,
        0,
      )
      const androidFileCount = Array.from(androidSnapshots.values()).reduce(
        (sum, themes) => sum + themes.size,
        0,
      )

      console.log('✅ Snapshot parity check passed')
      console.log(`   iOS: ${iosFileCount} snapshot PNGs`)
      console.log(`   Android: ${androidFileCount} snapshot PNGs`)
      console.log(`   Total: ${iosFileCount + androidFileCount} snapshots`)
      console.log('   All tracked stories have light + dark snapshots on their platforms')
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
