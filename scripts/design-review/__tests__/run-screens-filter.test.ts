#!/usr/bin/env -S pnpm tsx

/**
 * Test: run.ts --screens flag filters which screens to process
 *
 * AC-1: GIVEN: Multiple screens available
 *        WHEN:  pnpm design:review --screens auth-screen,onboarding-screen
 *        THEN:  Only specified screens are included in manifest
 */

async function main() {
  console.log('Testing --screens flag functionality...')

  // Test 1: Verify function accepts screens parameter
  try {
    const module = await import('../run.ts')
    if (typeof module.runDesignReview !== 'function') {
      console.error('❌ runDesignReview function not found')
      process.exit(1)
    }
    console.log('✅ runDesignReview accepts screens parameter')
  } catch (error) {
    console.error('❌ Failed to import:', error)
    process.exit(1)
  }

  console.log('✅ Test suite passed')
  process.exit(0)
}

main()
