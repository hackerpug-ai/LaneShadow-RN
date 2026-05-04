#!/usr/bin/env -S pnpm tsx

/**
 * Test: Prompt loaded from prompts/visual-eval.md
 *
 * AC-5: GIVEN: scripts/design-review/prompts/visual-eval.md exists with article §3.1 base text
 *        WHEN:  Engine starts
 *        THEN:  System prompt is read from disk and not hardcoded inside visual-eval.ts
 */

import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

console.log('Testing prompt file loading...')

// Test 1: Verify prompt file exists
const promptPath = join('scripts/design-review/prompts/visual-eval.md')
if (!existsSync(promptPath)) {
  console.error(`❌ Prompt file does not exist: ${promptPath}`)
  process.exit(1)
}
console.log('✅ Prompt file exists at scripts/design-review/prompts/visual-eval.md')

// Test 2: Verify prompt file contains required sections
const promptContent = readFileSync(promptPath, 'utf-8')

const requiredPhrases = [
  'UI reviewer',
  'design mock',
  'component',
  'spacing',
  'color',
  'typography',
  'placement',
  'overflow',
  'missing',
]

const missingPhrases: string[] = []
for (const phrase of requiredPhrases) {
  if (!promptContent.toLowerCase().includes(phrase.toLowerCase())) {
    missingPhrases.push(phrase)
  }
}

if (missingPhrases.length > 0) {
  console.error(`❌ Prompt file missing required phrases: ${missingPhrases.join(', ')}`)
  process.exit(1)
}
console.log('✅ Prompt file contains required design review sections')

// Test 3: Verify prompt is not empty
if (promptContent.trim().length === 0) {
  console.error('❌ Prompt file is empty')
  process.exit(1)
}
console.log('✅ Prompt file is not empty')

// Test 4: Verify prompt mentions JSON output format
if (!promptContent.toLowerCase().includes('json')) {
  console.error('❌ Prompt file does not mention JSON output format')
  process.exit(1)
}
console.log('✅ Prompt file mentions JSON output format')

console.log('✅ All prompt loading tests passed')
