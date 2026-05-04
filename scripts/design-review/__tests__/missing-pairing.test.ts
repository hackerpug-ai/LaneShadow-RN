#!/usr/bin/env -S pnpm tsx
/**
 * Test: AC-3 Missing-pairing case exits non-zero
 *
 * AC-3: GIVEN: A reference PNG exists but no matching capture (or vice-versa)
 *        WHEN:  build-manifest runs
 *        THEN:  Process exits non-zero with a message identifying the unpaired (screen,state,theme)
 */

import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const TEST_OUTPUT_DIR = '.design-review'
const TEST_CAPTURES_DIR = join(TEST_OUTPUT_DIR, 'captures')
const TEST_REFS_DIR = '.spec/design/system/refs'

async function setupMissingPairScenario() {
  // Create a capture without a matching reference
  mkdirSync(TEST_CAPTURES_DIR, { recursive: true })

  // Write a capture metadata file for a screen/state/theme that doesn't have a reference
  const captureMetadata = {
    test_id: 'test_authScreen_nonExistentState',
    screen: 'auth-screen',
    state: 'non-existent-state', // This state doesn't have a reference
    theme: 'light',
    device: 'iPhone 15 Pro',
    scale_factor: '3x',
    dark_mode: false,
    captured_at: new Date().toISOString(),
  }

  writeFileSync(
    join(TEST_CAPTURES_DIR, 'auth-screen.non-existent-state.light.json'),
    JSON.stringify(captureMetadata, null, 2),
  )

  // Note: We're NOT creating the corresponding reference PNG
  // This simulates a missing pairing scenario
}

function cleanup() {
  // Clean up test files
  const { rmSync } = require('node:fs')
  try {
    rmSync(TEST_CAPTURES_DIR, { recursive: true, force: true })
  } catch (error) {
    // Ignore cleanup errors
  }
}

async function main() {
  console.log('Testing missing-pairing error handling...')

  try {
    // Setup test scenario
    await setupMissingPairScenario()

    // Try to build manifest - should detect missing pairing
    const { buildManifest } = require('../build-manifest.ts')

    console.log('Calling buildManifest with missing pair...')

    // This should throw an error or exit non-zero
    await buildManifest({
      capturesDir: TEST_CAPTURES_DIR,
      refsDir: TEST_REFS_DIR,
      outputPath: join(TEST_OUTPUT_DIR, 'manifest.json'),
    })

    // If we get here, the test failed (should have thrown)
    console.error('❌ buildManifest did not throw error for missing pairing')
    cleanup()
    process.exit(1)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)

    // Check if error message mentions missing pairing
    if (
      errorMessage.includes('Missing') ||
      errorMessage.includes('reference') ||
      errorMessage.includes('not found')
    ) {
      console.log('✅ buildManifest correctly detected missing pairing')
      console.log(`   Error: ${errorMessage}`)
      cleanup()
      process.exit(0)
    } else {
      console.error('❌ buildManifest threw wrong error:', errorMessage)
      cleanup()
      process.exit(1)
    }
  }
}

main().catch((error) => {
  console.error('❌ Test failed:', error)
  cleanup()
  process.exit(1)
})
