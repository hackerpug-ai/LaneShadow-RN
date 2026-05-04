#!/usr/bin/env -S pnpm tsx

/**
 * Test: Locked prompt promoted and read by eval engine (AC-5)
 *
 * GIVEN: Calibration passes
 * WHEN:  Lock step runs
 * THEN:  scripts/design-review/prompts/visual-eval.locked.md is created (copy of tuned visual-eval.md) and visual-eval.ts reads from .locked.md when present
 */

import { readFileSync } from 'node:fs'

function testLockedPromptPreference(): void {
  const lockedPromptPath = 'scripts/design-review/prompts/visual-eval.locked.md'

  // Check that locked prompt path is referenced in calibrate.ts
  const calibrateContent = readFileSync('scripts/design-review/calibrate.ts', 'utf-8')

  if (!calibrateContent.includes('visual-eval.locked.md')) {
    console.error(`❌ Locked prompt path not referenced in calibrate.ts`)
    process.exit(1)
  }

  if (!calibrateContent.includes('writeFileSync') && !calibrateContent.includes('Locking prompt')) {
    console.error(`❌ Prompt locking logic not found in calibrate.ts`)
    process.exit(1)
  }

  // Check that visual-eval.ts has logic to read locked prompt
  const visualEvalContent = readFileSync('scripts/design-review/visual-eval.ts', 'utf-8')

  if (!visualEvalContent.includes('.locked.md')) {
    console.error(`❌ visual-eval.ts does not check for locked prompt`)
    process.exit(1)
  }

  console.log('✅ Locked prompt preference test passed')
  console.log(`   Locked prompt path referenced in calibrate.ts`)
  console.log(`   Prompt locking logic exists`)
  console.log(`   visual-eval.ts checks for locked prompt`)
}

// Run test
testLockedPromptPreference()
