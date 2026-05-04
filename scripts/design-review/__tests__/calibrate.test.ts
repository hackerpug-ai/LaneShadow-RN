#!/usr/bin/env -S pnpm tsx

/**
 * Test: Calibration precision/recall computation (AC-2)
 *
 * GIVEN: Visual-eval engine + golden set
 * WHEN:  pnpm design:calibrate runs
 * THEN:  Calibration runner evaluates 10 calibration entries (5 held out), computes per-round precision/recall, and writes .design-review/calibration/round-{n}.json
 */

import { existsSync, readFileSync } from 'node:fs'

interface CalibrationRound {
  round_number: number
  timestamp: string
  scores: {
    precision: number
    recall: number
    f1: number
    true_positives: number
    false_positives: number
    true_negatives: number
    false_negatives: number
  }
  split: {
    calibration: string[]
    held_out: string[]
  }
}

function testPrecisionRecallComputed(): void {
  // Check if calibrate.ts exists
  const calibratePath = 'scripts/design-review/calibrate.ts'
  if (!existsSync(calibratePath)) {
    console.error(`❌ calibrate.ts not found: ${calibratePath}`)
    process.exit(1)
  }

  // Check if a round file was created (we'll create a mock one for testing)
  const roundPath = '.design-review/calibration/round-1.json'

  if (!existsSync(roundPath)) {
    console.error(`❌ Round file not found: ${roundPath}`)
    console.error(`   Run: pnpm design:calibrate`)
    process.exit(1)
  }

  // Load and validate round file
  const content = readFileSync(roundPath, 'utf-8')
  let round: CalibrationRound
  try {
    round = JSON.parse(content) as CalibrationRound
  } catch (error) {
    console.error(`❌ Invalid JSON in round file: ${error}`)
    process.exit(1)
  }

  // Validate structure
  if (typeof round.scores.precision !== 'number') {
    console.error(`❌ Missing or invalid precision score`)
    process.exit(1)
  }

  if (typeof round.scores.recall !== 'number') {
    console.error(`❌ Missing or invalid recall score`)
    process.exit(1)
  }

  if (typeof round.scores.f1 !== 'number') {
    console.error(`❌ Missing or invalid f1 score`)
    process.exit(1)
  }

  // Validate counts
  if (
    typeof round.scores.true_positives !== 'number' ||
    typeof round.scores.false_positives !== 'number' ||
    typeof round.scores.true_negatives !== 'number' ||
    typeof round.scores.false_negatives !== 'number'
  ) {
    console.error(`❌ Missing or invalid TP/FP/TN/FN counts`)
    process.exit(1)
  }

  // Validate split
  if (!Array.isArray(round.split.calibration) || !Array.isArray(round.split.held_out)) {
    console.error(`❌ Missing or invalid calibration/held-out split`)
    process.exit(1)
  }

  if (round.split.calibration.length !== 10) {
    console.error(`❌ Expected 10 calibration entries, got ${round.split.calibration.length}`)
    process.exit(1)
  }

  if (round.split.held_out.length !== 5) {
    console.error(`❌ Expected 5 held-out entries, got ${round.split.held_out.length}`)
    process.exit(1)
  }

  // Validate precision/recall formulas
  const { precision, recall, true_positives, false_positives, false_negatives } = round.scores
  const expectedPrecision = true_positives / (true_positives + false_positives)
  const expectedRecall = true_positives / (true_positives + false_negatives)

  if (Math.abs(precision - expectedPrecision) > 0.001) {
    console.error(`❌ Precision formula incorrect: expected ${expectedPrecision}, got ${precision}`)
    process.exit(1)
  }

  if (Math.abs(recall - expectedRecall) > 0.001) {
    console.error(`❌ Recall formula incorrect: expected ${expectedRecall}, got ${recall}`)
    process.exit(1)
  }

  console.log('✅ Precision/recall computation test passed')
  console.log(`   Precision: ${(precision * 100).toFixed(1)}%`)
  console.log(`   Recall: ${(recall * 100).toFixed(1)}%`)
  console.log(`   F1: ${(round.scores.f1 * 100).toFixed(1)}%`)
  console.log(`   Calibration: ${round.split.calibration.length} entries`)
  console.log(`   Held-out: ${round.split.held_out.length} entries`)
}

// Run test
testPrecisionRecallComputed()
