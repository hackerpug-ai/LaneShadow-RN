#!/usr/bin/env -S pnpm tsx
/**
 * Test: getThemeFromMetadata() resolves theme from UIUserInterfaceStyle
 *
 * TC-2: Verify theme resolution from device metadata
 */

import { getThemeFromMetadata } from '../export-from-xcresult.ts'

function main() {
  console.log('Testing getThemeFromMetadata...')

  // Test 1: Light theme
  try {
    const lightMetadata = {
      deviceInfo: { UIUserInterfaceStyle: 'Light' },
    }
    const result = getThemeFromMetadata(lightMetadata)

    if (result !== 'light') {
      console.error('❌ Test 1 failed: Expected light theme')
      console.error('Expected: "light"')
      console.error('Got:', result)
      process.exit(1)
    }

    console.log('✅ Test 1 passed: Light theme resolved correctly')
  } catch (error) {
    console.error('❌ Test 1 failed:', error)
    process.exit(1)
  }

  // Test 2: Dark theme
  try {
    const darkMetadata = {
      deviceInfo: { UIUserInterfaceStyle: 'Dark' },
    }
    const result = getThemeFromMetadata(darkMetadata)

    if (result !== 'dark') {
      console.error('❌ Test 2 failed: Expected dark theme')
      console.error('Expected: "dark"')
      console.error('Got:', result)
      process.exit(1)
    }

    console.log('✅ Test 2 passed: Dark theme resolved correctly')
  } catch (error) {
    console.error('❌ Test 2 failed:', error)
    process.exit(1)
  }

  // Test 3: Missing deviceInfo (should default to light)
  try {
    const emptyMetadata = {}
    const result = getThemeFromMetadata(emptyMetadata)

    if (result !== 'light') {
      console.error('❌ Test 3 failed: Expected default light theme')
      console.error('Expected: "light"')
      console.error('Got:', result)
      process.exit(1)
    }

    console.log('✅ Test 3 passed: Missing deviceInfo defaults to light')
  } catch (error) {
    console.error('❌ Test 3 failed:', error)
    process.exit(1)
  }

  // Test 4: Missing UIUserInterfaceStyle (should default to light)
  try {
    const metadataWithoutStyle = {
      deviceInfo: {},
    }
    const result = getThemeFromMetadata(metadataWithoutStyle)

    if (result !== 'light') {
      console.error('❌ Test 4 failed: Expected default light theme')
      console.error('Expected: "light"')
      console.error('Got:', result)
      process.exit(1)
    }

    console.log('✅ Test 4 passed: Missing UIUserInterfaceStyle defaults to light')
  } catch (error) {
    console.error('❌ Test 4 failed:', error)
    process.exit(1)
  }

  console.log('\n✅ All getThemeFromMetadata tests passed')
  process.exit(0)
}

main()
