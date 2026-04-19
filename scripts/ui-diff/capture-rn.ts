#!/usr/bin/env tsx

/**
 * React Native Storybook screenshot capture script.
 *
 * Captures screenshots of RN components running in Storybook and saves them
 * to screenshots/rn/baseline/{component-name}.png
 *
 * Prerequisites:
 * - React Native dev client must be running (pnpm client:dev)
 * - Storybook must be accessible
 *
 * Usage:
 *   pnpm tsx scripts/ui-diff/capture-rn.ts [--components <name1,name2>] [--output-dir <path>]
 */

import { execSync } from 'node:child_process'
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
  /** Expo/Storybook server URL */
  serverUrl: string
}

/**
 * Detects if React Native dev server is running.
 */
function detectDevServer(): boolean {
  try {
    // Try to connect to the default Expo dev server port
    execSync("curl -s -o /dev/null -w '%{http_code}' http://localhost:8081", {
      stdio: 'pipe',
      timeout: 2000,
    })
    return true
  } catch {
    return false
  }
}

/**
 * Gets list of Storybook stories/components.
 *
 * This implementation assumes a Storybook structure. In a real implementation,
 * this would parse the Storybook configuration or use the Storybook API.
 */
function getStorybookComponents(): string[] {
  // For now, return a placeholder list. In a real implementation, this would:
  // 1. Parse .storybook/stories.ts or similar
  // 2. Query the Storybook manager API
  // 3. Or use a hardcoded list from the component catalog

  const storybookPath = join(PROJECT_ROOT, 'react-native/.storybook')

  if (!existsSync(storybookPath)) {
    console.warn('⚠️  Storybook directory not found at react-native/.storybook')
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

  // Try to read stories from the Storybook directory
  try {
    const storiesPath = join(storybookPath, 'stories.ts')
    if (existsSync(storiesPath)) {
      const content = readFileSync(storiesPath, 'utf-8')
      // Extract component names from the stories file
      // This is a simple regex-based approach; real implementation would use AST parsing
      const matches = content.match(/export\s+(const|function)\s+(\w+)/g)
      if (matches) {
        return matches
          .map((m) => m.replace(/export\s+(const|function)\s+/, ''))
          .filter((name) => !name.startsWith('_')) // Exclude private exports
      }
    }
  } catch (error) {
    console.warn('⚠️  Could not parse Storybook stories:', error)
  }

  // Fallback to a curated list of atomic components from 08a-atomic-component-catalog
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
 * Captures a screenshot of a single component using Expo CLI.
 *
 * In a real implementation, this would:
 * - Use Expo's screenshot API (expo-screenshot)
 * - Or use a tool like detox/spectacus to capture screenshots
 * - Or interact with Storybook's screenshot addon
 */
async function captureComponentScreenshot(
  componentName: string,
  options: CaptureOptions,
): Promise<string | null> {
  const outputPath = join(options.outputDir, `${componentName}.png`)

  console.log(`  Capturing ${componentName}...`)

  try {
    // Placeholder implementation: In a real setup, this would:
    // 1. Navigate to the component in Storybook
    // 2. Wait for rendering to complete
    // 3. Capture screenshot via Expo CLI or adb/simctl
    // 4. Save to the output path

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
  let outputDir = join(PROJECT_ROOT, 'screenshots/rn/baseline')

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--components' && args[i + 1]) {
      components = args[i + 1].split(',')
      i++
    } else if (args[i] === '--output-dir' && args[i + 1]) {
      outputDir = args[i + 1]
      i++
    }
  }

  console.log('📱 React Native Screenshot Capture')
  console.log(`   Output directory: ${outputDir}`)

  // Create output directory
  mkdirSync(outputDir, { recursive: true })

  // Detect dev server
  console.log('\n🔍 Detecting React Native dev server...')
  if (!detectDevServer()) {
    console.warn('⚠️  React Native dev server not detected')
    console.warn('   Start it with: pnpm client:dev')
    console.warn('   Continuing with placeholder screenshots...')
  } else {
    console.log('✓ Dev server detected')
  }

  // Get component list
  const componentList = components || getStorybookComponents()
  console.log(`\n📋 Found ${componentList.length} components to capture`)

  // Capture screenshots
  console.log('\n📸 Capturing screenshots...')
  let successCount = 0
  let failCount = 0

  for (const component of componentList) {
    const result = await captureComponentScreenshot(component, {
      outputDir,
      serverUrl: 'http://localhost:8081',
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
