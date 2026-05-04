#!/usr/bin/env -S pnpm tsx

/**
 * Test: Engine sends image 1 = reference, image 2 = captured (order locked)
 *
 * TC-1: Verify image order is semantically load-bearing (reference first, captured second)
 */

import { readFileSync } from 'node:fs'

async function main(): Promise<void> {
  console.log('Testing image order in visual-eval.ts...')

  const visualEvalPath = 'scripts/design-review/visual-eval.ts'
  const visualEvalContent = readFileSync(visualEvalPath, 'utf-8')

  // Test 1: Verify reference image comes before captured image in the code
  console.log('Test 1: Checking image order in code...')

  // Look for the pattern where reference image variable is assigned before captured
  const lines = visualEvalContent.split('\n')
  let referenceVarIndex = -1
  let capturedVarIndex = -1

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    // Look for variable assignments
    if (line.includes('reference') && line.includes('=') && line.includes('pngToBase64')) {
      if (referenceVarIndex === -1) referenceVarIndex = i
    }
    if (line.includes('captured') && line.includes('=') && line.includes('pngToBase64')) {
      if (capturedVarIndex === -1) capturedVarIndex = i
    }
  }

  if (referenceVarIndex === -1 || capturedVarIndex === -1) {
    throw new Error('Could not find image variable assignments in visual-eval.ts')
  }

  if (referenceVarIndex > capturedVarIndex) {
    throw new Error(
      `Image order violation: reference image (line ${referenceVarIndex}) must be assigned before captured image (line ${capturedVarIndex})`,
    )
  }

  console.log(
    `✅ Reference image variable assigned before captured image (ref at line ${referenceVarIndex}, capt at line ${capturedVarIndex})`,
  )

  // Test 2: Verify comment about image order
  console.log('Test 2: Checking for image order documentation...')
  if (
    !visualEvalContent.includes('Image 1 = reference') &&
    !visualEvalContent.includes('reference, captured')
  ) {
    throw new Error('Missing documentation about image order importance')
  }
  console.log('✅ Image order is documented in code')

  // Test 3: Verify the actual API call uses the correct order
  console.log('Test 3: Verifying API call structure...')

  // Look for the messages.create call
  const messagesCreateMatch = visualEvalContent.match(/messages\.create\(([\s\S]*?)\)/)
  if (!messagesCreateMatch) {
    throw new Error('Could not find messages.create() call')
  }

  const messagesCreateContent = messagesCreateMatch[0]

  // Verify reference comes before captured in the content array
  const referenceIndex = messagesCreateContent.indexOf('referenceBase64')
  const capturedIndex = messagesCreateContent.indexOf('capturedBase64')

  if (referenceIndex === -1 || capturedIndex === -1) {
    throw new Error('Could not find referenceBase64 or capturedBase64 in messages.create() call')
  }

  if (referenceIndex > capturedIndex) {
    throw new Error('Image order violation in API call: reference must come before captured')
  }

  console.log('✅ API call uses correct image order (reference before captured)')

  console.log('✅ All image order tests passed')
}

main().catch((error) => {
  console.error('❌ Test failed')
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
})
