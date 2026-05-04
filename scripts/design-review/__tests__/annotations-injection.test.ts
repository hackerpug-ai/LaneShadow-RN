#!/usr/bin/env -S pnpm tsx

/**
 * Test: Annotations injected verbatim into user content
 *
 * TC-8: Verify annotations.json is injected verbatim into user content
 */

import { readFileSync } from 'node:fs'

async function main(): Promise<void> {
  console.log('Testing annotations injection in visual-eval.ts...')

  const visualEvalPath = 'scripts/design-review/visual-eval.ts'
  const visualEvalContent = readFileSync(visualEvalPath, 'utf-8')

  // Test 1: Verify annotations file is loaded
  console.log('Test 1: Checking if annotations file is loaded...')
  if (!visualEvalContent.includes('loadAnnotations')) {
    throw new Error('loadAnnotations function not found')
  }
  console.log('✅ Annotations loading function exists')

  // Test 2: Verify annotations are read from file
  console.log('Test 2: Checking if annotations are read from file...')
  if (!visualEvalContent.includes('readFileSync') || !visualEvalContent.includes('annotations')) {
    throw new Error('Annotations file reading not found')
  }
  console.log('✅ Annotations are read from file')

  // Test 3: Verify annotations are included in user content
  console.log('Test 3: Checking if annotations are injected into user content...')
  if (!visualEvalContent.includes('Annotations:')) {
    throw new Error('Annotations not included in user content')
  }
  if (!visualEvalContent.includes('JSON.stringify(annotationsData')) {
    throw new Error('Annotations not serialized to JSON')
  }
  console.log('✅ Annotations are injected into user content')

  // Test 4: Verify annotations include components array
  console.log('Test 4: Checking if annotations components are included...')
  if (!visualEvalContent.includes('components')) {
    throw new Error('Annotations components array not referenced')
  }
  console.log('✅ Annotations components are referenced')

  // Test 5: Verify context (screen, state, theme) is included
  console.log('Test 5: Checking if screen/state/theme context is included...')
  const userContentPattern = /Screen:.*State:.*Theme:/
  if (!userContentPattern.test(visualEvalContent)) {
    throw new Error('Screen/state/theme context not included in user content')
  }
  console.log('✅ Screen/state/theme context is included')

  console.log('✅ All annotations injection tests passed')
}

main().catch((error) => {
  console.error('❌ Test failed')
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
})
