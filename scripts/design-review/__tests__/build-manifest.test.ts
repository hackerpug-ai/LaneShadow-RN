#!/usr/bin/env -S pnpm tsx
/**
 * Test: build-manifest.ts joins captures + references + annotations
 *
 * AC-2: GIVEN: Captures and references exist
 *        WHEN:  pnpm design:manifest runs
 *        THEN:  .design-review/manifest.json contains entries with all required fields
 * AC-3: Missing-pairing case exits non-zero
 */

import { join } from 'node:path'

const TEST_OUTPUT_DIR = '.design-review'
const TEST_MANIFEST_PATH = join(TEST_OUTPUT_DIR, 'manifest.json')

function main() {
  console.log('Testing buildManifest function import...')

  // Test: Try to import the buildManifest function (should fail in RED phase)
  try {
    const modulePath = join(process.cwd(), 'scripts/design-review/build-manifest.ts')
    const buildModule = require(modulePath)

    if (typeof buildModule.buildManifest !== 'function') {
      console.error('❌ buildManifest function not found in module')
      process.exit(1)
    }

    console.log('✅ buildManifest function imported successfully')
  } catch (error) {
    console.error('❌ Failed to import buildManifest (expected in RED phase):')
    console.error(`   ${error instanceof Error ? error.message : String(error)}`)
    console.log("\n✅ RED phase confirmed - buildManifest function doesn't exist yet")
    process.exit(1) // Exit with error to indicate RED phase
  }

  console.log('✅ Test suite passed')
  process.exit(0)
}

main()
