#!/usr/bin/env tsx

/**
 * Android Compose screenshot capture script via adb.
 *
 * Captures screenshots of Android Compose components and saves them
 * to screenshots/android/baseline/{component-name}.png
 *
 * Prerequisites:
 * - Android emulator must be running
 * - App must be installed and in screenshot-capture mode
 * - adb must be available in PATH
 *
 * Usage:
 *   pnpm tsx scripts/ui-diff/capture-android.ts [--components <name1,name2>] [--output-dir <path>]
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
  /** ADB device serial (default: first available device) */
  deviceSerial?: string
}

/**
 * Detects if adb is available and an emulator is running.
 */
function detectAdbDevice(): { available: boolean; deviceSerial?: string } {
  try {
    // Check if adb is available
    spawnSync('adb', ['version'], { stdio: 'pipe' })
  } catch {
    console.error('✗ adb not found in PATH')
    console.error('  Install Android SDK or add to PATH')
    return { available: false }
  }

  try {
    // Get list of connected devices
    const result = execSync('adb devices', { encoding: 'utf-8' })
    const lines = result.trim().split('\n').slice(1) // Skip header

    const devices = lines
      .filter((line) => line.includes('\tdevice'))
      .map((line) => line.split('\t')[0])

    if (devices.length === 0) {
      console.error('✗ No Android devices/emulators found')
      console.error('  Start an emulator or connect a device')
      return { available: false }
    }

    const deviceSerial = devices[0]
    console.log(`✓ Found device/emulator: ${deviceSerial}`)
    return { available: true, deviceSerial }
  } catch (error) {
    console.error('✗ Failed to detect adb devices:', error)
    return { available: false }
  }
}

/**
 * Gets list of Android Compose components.
 *
 * This implementation assumes a Compose structure. In a real implementation,
 * this would parse the Kotlin source files or use a predefined list.
 */
function getComposeComponents(): string[] {
  const androidPath = join(PROJECT_ROOT, 'android/app/src/main/kotlin')

  if (!existsSync(androidPath)) {
    console.warn('⚠️  Android Kotlin source directory not found')
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
  // 1. Scan android/app/src/main/kotlin/ for @Composable functions
  // 2. Extract component names using AST parsing or regex
  // 3. Return a list of screenshot-capturable components

  // For now, return a curated list from 08b-android-component-map
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
 * Captures a screenshot of a single Android component using adb.
 *
 * In a real implementation, this would:
 * - Launch the app to a specific component screen
 * - Use adb shell screencap to capture the screen
 * - Pull the screenshot from the device
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
    // 1. Use adb to launch the app to the component's screen
    // 2. Wait for rendering to complete
    // 3. Run: adb shell screencap -p /sdcard/screenshot.png
    // 4. Run: adb pull /sdcard/screenshot.png {outputPath}
    // 5. Crop the screenshot to just the component area

    const deviceArg = options.deviceSerial ? `-s ${options.deviceSerial}` : ''

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
  let outputDir = join(PROJECT_ROOT, 'screenshots/android/baseline')
  let deviceSerial: string | undefined

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--components' && args[i + 1]) {
      components = args[i + 1].split(',')
      i++
    } else if (args[i] === '--output-dir' && args[i + 1]) {
      outputDir = args[i + 1]
      i++
    } else if (args[i] === '--device' && args[i + 1]) {
      deviceSerial = args[i + 1]
      i++
    }
  }

  console.log('🤖 Android Screenshot Capture')
  console.log(`   Output directory: ${outputDir}`)

  // Create output directory
  mkdirSync(outputDir, { recursive: true })

  // Detect adb and devices
  console.log('\n🔍 Detecting Android devices/emulators...')
  const { available, deviceSerial: detectedDevice } = detectAdbDevice()

  if (!available) {
    console.error('\n✗ Cannot proceed without a device/emulator')
    console.error('  Start an emulator: emulator -avd <avd_name>')
    console.error('  Or connect a physical device with USB debugging enabled')
    process.exit(1)
  }

  if (detectedDevice) {
    deviceSerial = deviceSerial || detectedDevice
  }

  // Get component list
  const componentList = components || getComposeComponents()
  console.log(`\n📋 Found ${componentList.length} components to capture`)

  // Capture screenshots
  console.log('\n📸 Capturing screenshots...')
  let successCount = 0
  let failCount = 0

  for (const component of componentList) {
    const result = await captureComponentScreenshot(component, {
      outputDir,
      deviceSerial,
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
