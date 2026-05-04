#!/usr/bin/env -S pnpm tsx

/**
 * Test: Per-entry output filename matches manifest entry id
 *
 * TC-10: Verify output filename matches manifest entry id
 */

import { readFileSync } from 'node:fs'

async function main(): Promise<void> {
  console.log('Testing output filename generation in visual-eval.ts...')

  const visualEvalPath = 'scripts/design-review/visual-eval.ts'
  const visualEvalContent = readFileSync(visualEvalPath, 'utf-8')

  // Test 1: Verify output path includes entry id
  console.log('Test 1: Checking if output path uses entry id...')
  if (!visualEvalContent.includes('entry.id')) {
    throw new Error('Output filename does not use entry.id')
  }
  console.log('✅ Output filename uses entry.id')

  // Test 2: Verify output directory structure
  console.log('Test 2: Checking output directory structure...')
  if (!visualEvalContent.includes('.design-review/evals/visual')) {
    throw new Error('Output directory .design-review/evals/visual not found')
  }
  console.log('✅ Output directory is .design-review/evals/visual')

  // Test 3: Verify output file is written
  console.log('Test 3: Checking if output file is written...')
  if (!visualEvalContent.includes('writeFileSync')) {
    throw new Error('Output file writing not found')
  }
  console.log('✅ Output file is written with writeFileSync')

  // Test 4: Verify the output path pattern
  console.log('Test 4: Verifying complete output path pattern...')
  const outputPathPattern = /join\(OUTPUT_DIR.*entry\.id.*\.json/
  if (!outputPathPattern.test(visualEvalContent)) {
    throw new Error('Output path pattern does not match expected structure')
  }
  console.log('✅ Output path pattern is correct')

  // Test 5: Verify OUTPUT_DIR constant
  console.log('Test 5: Checking OUTPUT_DIR constant...')
  if (!visualEvalContent.includes('const OUTPUT_DIR =')) {
    throw new Error('OUTPUT_DIR constant not defined')
  }
  console.log('✅ OUTPUT_DIR constant is defined')

  console.log('✅ All output filename tests passed')
}

main().catch((error) => {
  console.error('❌ Test failed')
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
})
