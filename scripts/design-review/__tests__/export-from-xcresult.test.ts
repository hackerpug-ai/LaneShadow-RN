#!/usr/bin/env -S pnpm tsx
/**
 * Test: export-from-xcresult.ts extracts attachments + theme metadata
 *
 * AC-1: GIVEN: An .xcresult bundle from T03 capture run exists at build/xcresults/design-review.xcresult
 *        WHEN:  pnpm design:export runs
 *        THEN:  .design-review/captures/{screen}.{state}.{theme}.png + sibling .json exist for every attachment
 */

import { getThemeFromMetadata, parseAttachmentName } from '../export-from-xcresult.ts'

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

  console.log('✅ Test suite passed')
  process.exit(0)
}

main()
