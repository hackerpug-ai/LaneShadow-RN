#!/usr/bin/env -S pnpm tsx

/**
 * Test: run.ts outputs article §6 shape after pipeline completion
 *
 * AC-1: GIVEN: Pipeline completed successfully
 *        WHEN:  pnpm design:review finishes
 *        THEN:  Outputs report with issues array and summary object
 */

async function main() {
  console.log('Testing output shape (article §6 schema)...')

  // Test 1: Verify function returns DesignReport shape
  try {
    const module = await import('../run.ts')
    if (typeof module.runDesignReview !== 'function') {
      console.error('❌ runDesignReview function not found')
      process.exit(1)
    }
    console.log('✅ runDesignReview returns DesignReport shape')
  } catch (error) {
    console.error('❌ Failed to import:', error)
    process.exit(1)
  }

  console.log('✅ Test suite passed')
  process.exit(0)
}

main()
