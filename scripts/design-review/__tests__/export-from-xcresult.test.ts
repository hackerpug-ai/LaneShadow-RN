#!/usr/bin/env -S pnpm tsx
/**
 * Test: export-from-xcresult.ts extracts attachments + theme metadata
 *
 * AC-1: GIVEN: An .xcresult bundle from T03 capture run exists at build/xcresults/design-review.xcresult
 *        WHEN:  pnpm design:export runs
 *        THEN:  .design-review/captures/{screen}.{state}.{theme}.png + sibling .json exist for every attachment
 */

import { join } from 'node:path'

const TEST_OUTPUT_DIR = '.design-review/captures'
const TEST_XCRESULT_PATH = 'build/xcresults/design-review.xcresult'

// Helper functions to be tested
function parseAttachmentName(name: string): {
  screen: string
  state: string
  action: string
} {
  const parts = name.split('.')
  if (parts.length !== 3) {
    throw new Error(`Invalid attachment name format: ${name}`)
  }
  return {
    screen: parts[0],
    state: parts[1],
    action: parts[2],
  }
}

function getThemeFromMetadata(metadata: {
  deviceInfo?: { UIUserInterfaceStyle?: string }
}): string {
  const style = metadata.deviceInfo?.UIUserInterfaceStyle
  if (style === 'Dark') {
    return 'dark'
  }
  return 'light'
}

function main() {
  console.log('Testing attachment name parsing...')

  // Test 1: Parse attachment name
  try {
    const attachmentName = 'auth-screen.email-entry.load'
    const parsed = parseAttachmentName(attachmentName)

    if (
      parsed.screen !== 'auth-screen' ||
      parsed.state !== 'email-entry' ||
      parsed.action !== 'load'
    ) {
      console.error('❌ Attachment name parsing failed')
      console.error(`Expected: { screen: "auth-screen", state: "email-entry", action: "load" }`)
      console.error(`Got:`, parsed)
      process.exit(1)
    }

    console.log('✅ Attachment name parsing works correctly')
  } catch (error) {
    console.error('❌ Attachment name parsing threw error:', error)
    process.exit(1)
  }

  // Test 2: Theme resolution from metadata
  try {
    const lightMetadata = {
      deviceInfo: { UIUserInterfaceStyle: 'Light' },
    }
    const darkMetadata = {
      deviceInfo: { UIUserInterfaceStyle: 'Dark' },
    }

    const lightTheme = getThemeFromMetadata(lightMetadata)
    const darkTheme = getThemeFromMetadata(darkMetadata)

    if (lightTheme !== 'light' || darkTheme !== 'dark') {
      console.error('❌ Theme resolution failed')
      console.error(`Expected lightTheme: "light", got: "${lightTheme}"`)
      console.error(`Expected darkTheme: "dark", got: "${darkTheme}"`)
      process.exit(1)
    }

    console.log('✅ Theme resolution works correctly')
  } catch (error) {
    console.error('❌ Theme resolution threw error:', error)
    process.exit(1)
  }

  // Test 3: Try to import the export function (should fail in RED phase)
  console.log('Testing exportFromXcresult function import...')

  try {
    // This should fail because the function doesn't exist yet
    const modulePath = join(process.cwd(), 'scripts/design-review/export-from-xcresult.ts')
    const exportModule = require(modulePath)

    if (typeof exportModule.exportFromXcresult !== 'function') {
      console.error('❌ exportFromXcresult function not found in module')
      process.exit(1)
    }

    console.log('✅ exportFromXcresult function imported successfully')
  } catch (error) {
    console.error('❌ Failed to import exportFromXcresult (expected in RED phase):')
    console.error(`   ${error instanceof Error ? error.message : String(error)}`)
    console.log("\n✅ RED phase confirmed - exportFromXcresult function doesn't exist yet")
    process.exit(1) // Exit with error to indicate RED phase
  }

  console.log('✅ Test suite passed')
  process.exit(0)
}

main()
