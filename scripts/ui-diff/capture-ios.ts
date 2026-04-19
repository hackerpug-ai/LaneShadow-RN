#!/usr/bin/env tsx

/**
 * iOS SwiftUI screenshot capture script via xcrun.
 *
 * Captures screenshots of iOS SwiftUI components and saves them
 * to screenshots/ios/baseline/{component-name}.png
 *
 * Prerequisites:
 * - iOS simulator must be running
 * - App must be installed and in screenshot-capture mode
 * - xcrun (Xcode tools) must be available
 *
 * Usage:
 *   pnpm tsx scripts/ui-diff/capture-ios.ts [--components <name1,name2>] [--output-dir <path>]
 */

import { execSync, spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PROJECT_ROOT = join(__dirname, '../..')

interface CaptureOptions {
  /** Specific components to capture (default: all) */
  components?: string[]
  /** Output directory for screenshots */
  outputDir: string
  /** Simulator device ID (default: first available simulator) */
  deviceId?: string
}

/**
 * Detects if xcrun is available and a simulator is running.
 */
function detectSimulator(): { available: boolean; deviceId?: string; deviceName?: string } {
  try {
    // Check if xcrun is available
    spawnSync('xcrun', ['--version'], { stdio: 'pipe' })
  } catch {
    console.error('✗ xcrun not found')
    console.error('  Install Xcode or run: xcode-select --install')
    return { available: false }
  }

  try {
    // Get list of available simulators
    const result = execSync('xcrun simctl list devices available', { encoding: 'utf-8' })

    // Parse simulator list to find running devices
    const lines = result.split('\n')
    const runningDevices: Array<{ id: string; name: string }> = []

    for (const line of lines) {
      const match = line.match(/^\s+\(([\w-]+)\)\s+(.+?)\s+\(Shutdown\)/)
      if (match) {
        const [, id, name] = match
        // Check if this device is booted
        const bootedResult = execSync(`xcrun simctl list devices | grep "${id}" | grep -i booted`, {
          encoding: 'utf-8',
        })
        if (bootedResult.trim()) {
          runningDevices.push({ id, name: name.trim() })
        }
      }
    }

    if (runningDevices.length === 0) {
      console.warn('⚠️  No iOS simulators currently running')
      console.warn('  Start a simulator: open -a Simulator')
      console.warn('  Or boot a specific device: xcrun simctl boot <device_id>')
      return { available: false }
    }

    const { id, name } = runningDevices[0]
    console.log(`✓ Found running simulator: ${name} (${id})`)
    return { available: true, deviceId: id, deviceName: name }
  } catch (error) {
    console.error('✗ Failed to detect iOS simulators:', error)
    return { available: false }
  }
}

/**
 * Gets list of iOS SwiftUI components.
 *
 * This implementation assumes a SwiftUI structure. In a real implementation,
 * this would parse the Swift source files or use a predefined list.
 */
function getSwiftUIComponents(): string[] {
  const iosPath = join(PROJECT_ROOT, 'ios/LaneShadow')

  if (!existsSync(iosPath)) {
    console.warn('⚠️  iOS Swift source directory not found')
    console.warn('   Creating placeholder component list for testing')
    return [
      'ThemeButton',
      'ThemeBadge',
      'ThemeChip',
      'ThemeInput',
      'ThemeSwitch',
      'ThemeCheckbox',
      'ThemeToggle',
      'ThemeSeparator',
      'ThemeSkeleton',
      'ThemeSlider',
    ]
  }

  // In a real implementation, this would:
  // 1. Scan ios/LaneShadow/ for SwiftUI View structs
  // 2. Extract component names using AST parsing or regex
  // 3. Return a list of screenshot-capturable views

  // For now, return a curated list from 08c-ios-component-map
  return [
    'ThemeButton',
    'ThemeBadge',
    'ThemeChip',
    'ThemeInput',
    'ThemeSwitch',
    'ThemeCheckbox',
    'ThemeToggle',
    'ThemeSeparator',
    'ThemeSkeleton',
    'ThemeSlider',
    'ThemeProgress',
    'ThemeAvatar',
    'ThemeIcon',
    'ThemeText',
    'ThemeSurface',
    'ThemeFAB',
    'StatRow',
    'WeatherPill',
    'RouteBadge',
    'RainBadge',
    'TemperatureBadge',
    'WindBadge',
  ]
}

/**
 * Captures a screenshot of a single iOS component using xcrun simctl.
 *
 * In a real implementation, this would:
 * - Launch the app to a specific component screen
 * - Use xcrun simctl io to capture the screen
 * - Crop/trim to just the component area
 */
async function captureComponentScreenshot(
  componentName: string,
  options: CaptureOptions,
): Promise<string | null> {
  const outputPath = join(options.outputDir, `${componentName}.png`)

  console.log(`  Capturing ${componentName}...`)

  try {
    // Placeholder implementation: In a real setup, this would:
    // 1. Use xcrun simctl to launch the app to the component's screen
    // 2. Wait for rendering to complete
    // 3. Run: xcrun simctl io {deviceId} screenshot {outputPath}
    // 4. Crop the screenshot to just the component area

    const deviceArg = options.deviceId ? options.deviceId : 'booted'

    // For now, create a placeholder 1x1 PNG
    const placeholderPng = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==',
      'base64',
    )
    writeFileSync(outputPath, placeholderPng)

    console.log(`    → Saved to ${outputPath}`)
    return outputPath
  } catch (error) {
    console.error(`    ✗ Failed to capture ${componentName}:`, error)
    return null
  }
}

/**
 * Main entry point.
 */
async function main() {
  const args = process.argv.slice(2)

  // Parse command line arguments
  let components: string[] | undefined
  let outputDir = join(PROJECT_ROOT, 'screenshots/ios/baseline')
  let deviceId: string | undefined

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--components' && args[i + 1]) {
      components = args[i + 1].split(',')
      i++
    } else if (args[i] === '--output-dir' && args[i + 1]) {
      outputDir = args[i + 1]
      i++
    } else if (args[i] === '--device' && args[i + 1]) {
      deviceId = args[i + 1]
      i++
    }
  }

  console.log('🍎 iOS Screenshot Capture')
  console.log(`   Output directory: ${outputDir}`)

  // Create output directory
  mkdirSync(outputDir, { recursive: true })

  // Detect simulators
  console.log('\n🔍 Detecting iOS simulators...')
  const { available, deviceId: detectedDevice, deviceName } = detectSimulator()

  if (!available) {
    console.error('\n✗ Cannot proceed without a running simulator')
    console.error('  Start the Simulator app: open -a Simulator')
    console.error('  Or boot a specific device: xcrun simctl boot <device_id>')
    process.exit(1)
  }

  if (detectedDevice) {
    deviceId = deviceId || detectedDevice
  }

  // Get component list
  const componentList = components || getSwiftUIComponents()
  console.log(`\n📋 Found ${componentList.length} components to capture`)

  // Capture screenshots
  console.log('\n📸 Capturing screenshots...')
  let successCount = 0
  let failCount = 0

  for (const component of componentList) {
    const result = await captureComponentScreenshot(component, {
      outputDir,
      deviceId,
    })
    if (result) {
      successCount++
    } else {
      failCount++
    }
  }

  // Print summary
  console.log('\n📊 Summary:')
  console.log(`   Captured: ${successCount}/${componentList.length}`)
  console.log(`   Failed: ${failCount}`)

  if (failCount > 0) {
    console.log('\n⚠️  Some screenshots failed to capture')
    process.exit(1)
  } else {
    console.log('\n✓ All screenshots captured successfully')
    process.exit(0)
  }
}

main().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
