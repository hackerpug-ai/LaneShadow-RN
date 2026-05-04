#!/usr/bin/env -S pnpm tsx

/**
 * Test: Calibration history tracked in rounds.md (AC-6)
 *
 * GIVEN: Multiple iterations
 * WHEN:  Round completes
 * THEN:  .spec/design/calibration/rounds.md gains an entry summarizing diffs + precision/recall for that round
 */

import { existsSync, readFileSync } from 'node:fs'

function testRoundsTracking(): void {
  const roundsPath = '.spec/design/calibration/rounds.md'

  // Check that calibrate.ts has logic to write to rounds.md
  const calibrateContent = readFileSync('scripts/design-review/calibrate.ts', 'utf-8')

  if (!calibrateContent.includes('rounds.md')) {
    console.error(`❌ rounds.md path not referenced in calibrate.ts`)
    process.exit(1)
  }

  if (!calibrateContent.includes('appendRoundLog') && !calibrateContent.includes('rounds.md')) {
    console.error(`❌ Round logging logic not found in calibrate.ts`)
    process.exit(1)
  }

  // Check that rounds.md exists and has at least one round entry
  if (!existsSync(roundsPath)) {
    console.error(`❌ rounds.md file not found: ${roundsPath}`)
    console.error(`   Run: pnpm design:calibrate`)
    process.exit(1)
  }

  const roundsContent = readFileSync(roundsPath, 'utf-8')

  // Count round headers
  const roundHeaderMatches = roundsContent.match(/^## Round \d+/gm)
  const roundCount = roundHeaderMatches ? roundHeaderMatches.length : 0

  if (roundCount < 1) {
    console.error(`❌ No round entries found in rounds.md`)
    console.error(`   Expected at least 1, got ${roundCount}`)
    process.exit(1)
  }

  // Check that the most recent round has required fields
  const lastRoundHeader = roundHeaderMatches[roundHeaderMatches.length - 1]
  const lastRoundStart = roundsContent.lastIndexOf(lastRoundHeader)

  // Extract the last round section
  let lastRoundSection = roundsContent.slice(lastRoundStart)
  const nextRoundHeader = lastRoundSection.search(/\n## Round \d+/)
  if (nextRoundHeader > 0) {
    lastRoundSection = lastRoundSection.slice(0, nextRoundHeader)
  }

  // Check for required fields
  if (!lastRoundSection.includes('Precision:')) {
    console.error(`❌ Last round missing precision score`)
    process.exit(1)
  }

  if (!lastRoundSection.includes('Recall:')) {
    console.error(`❌ Last round missing recall score`)
    process.exit(1)
  }

  if (!lastRoundSection.includes('F1:')) {
    console.error(`❌ Last round missing F1 score`)
    process.exit(1)
  }

  if (
    !lastRoundSection.includes('TP:') ||
    !lastRoundSection.includes('FP:') ||
    !lastRoundSection.includes('TN:') ||
    !lastRoundSection.includes('FN:')
  ) {
    console.error(`❌ Last round missing confusion matrix`)
    process.exit(1)
  }

  if (!lastRoundSection.includes('Calibration:') || !lastRoundSection.includes('Held-out:')) {
    console.error(`❌ Last round missing split information`)
    process.exit(1)
  }

  console.log('✅ Rounds tracking test passed')
  console.log(`   rounds.md exists and has ${roundCount} round(s)`)
  console.log(`   Last round has all required fields`)
  console.log(`   Round logging logic exists in calibrate.ts`)
}

// Run test
testRoundsTracking()
