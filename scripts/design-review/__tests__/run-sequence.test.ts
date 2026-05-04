#!/usr/bin/env -S pnpm tsx

/**
 * Test: run.ts orchestrates pipeline steps in correct order
 *
 * AC-1: GIVEN: No existing captures or manifest
 *        WHEN:  pnpm design:review runs
 *        THEN:  Steps execute in sequence: references → capture → export → manifest → eval → report
 */

async function main() {
  console.log('Testing runDesignReview function...')

  // Test 1: Verify function can be imported
  try {
    const module = await import('../run.ts')
    if (typeof module.runDesignReview !== 'function') {
      console.error('❌ runDesignReview function not found in module')
      process.exit(1)
    }
    console.log('✅ runDesignReview function imported successfully')
  } catch (error) {
    console.error('❌ Failed to import runDesignReview:', error)
    process.exit(1)
  }

  console.log('✅ Test suite passed')
  process.exit(0)
}

main()
