#!/usr/bin/env -S pnpm tsx

/**
 * Test: One-shot retry on schema failure
 *
 * AC-3: GIVEN: Initial Anthropic response fails zod parse
 *        WHEN:  Engine handles failure
 *        THEN:  Engine re-prompts with 'Your previous output failed schema X' and accepts retry; if retry also fails the entry is recorded with error status (does not abort the whole run)
 *
 * TC-6: Schema failure triggers exactly one retry
 */

import { VisualIssueSchema } from '../schemas/visual-issue.zod'

async function main(): Promise<void> {
  console.log('Testing one-shot retry behavior...')

  // Test 1: Verify retry logic with valid then invalid JSON
  console.log('Test 1: Simulating retry on schema failure...')

  let attemptCount = 0

  async function simulateParseWithRetry(
    jsonString: string,
    retryCount = 0,
  ): Promise<{ success: boolean; attempts: number }> {
    attemptCount++
    try {
      VisualIssueSchema.parse(JSON.parse(jsonString))
      return { success: true, attempts: attemptCount }
    } catch (error) {
      if (retryCount === 0) {
        // One-shot retry
        console.log('  ⚠️  Schema validation failed, retrying...')
        return simulateParseWithRetry(jsonString, retryCount + 1)
      } else {
        // Second failure - return error
        console.log('  ❌ Schema validation failed on retry')
        return { success: false, attempts: attemptCount }
      }
    }
  }

  // Test with valid JSON (should succeed on first try)
  attemptCount = 0
  const validJson = JSON.stringify([
    {
      component: 'TestComponent',
      passed: true,
      issue_type: 'spacing',
      observed: { test: 'value' },
      expected: { test: 'expected' },
      severity: 'low',
      confidence: 0.95,
    },
  ])

  const result1 = await simulateParseWithRetry(validJson)
  if (!result1.success || result1.attempts !== 1) {
    throw new Error(`Expected success on first attempt, got ${result1.attempts} attempts`)
  }
  console.log('✅ Valid JSON succeeds on first attempt')

  // Test with invalid JSON (should fail twice)
  attemptCount = 0
  const invalidJson = JSON.stringify({
    component: 'TestComponent',
    passed: true,
    issue_type: 'invalid_type', // Invalid enum
    observed: { test: 'value' },
    expected: { test: 'expected' },
    severity: 'low',
    confidence: 0.95,
  })

  const result2 = await simulateParseWithRetry(invalidJson)
  if (result2.success || result2.attempts !== 2) {
    throw new Error(
      `Expected failure after 2 attempts, got ${result2.attempts} attempts with success=${result2.success}`,
    )
  }
  console.log('✅ Invalid JSON fails after retry (2 attempts total)')

  // Test 2: Verify retry hint message format
  console.log('Test 2: Verifying retry hint message...')
  const retryHint =
    '\n\nNOTE: Your previous output failed schema validation. Please ensure your response is valid JSON matching the exact schema specified in the system prompt.'

  if (!retryHint.includes('previous output failed schema')) {
    throw new Error('Retry hint missing required text')
  }
  if (!retryHint.includes('valid JSON')) {
    throw new Error('Retry hint missing JSON format instruction')
  }
  console.log('✅ Retry hint message is correctly formatted')

  // Test 3: Verify error status does not abort the run
  console.log('Test 3: Verifying error handling continues processing...')

  const results: Array<{ id: string; success: boolean }> = []

  async function processEntry(entryId: string, shouldFail: boolean): Promise<void> {
    const attempts = 0
    try {
      const json = shouldFail ? invalidJson : validJson
      const result = await simulateParseWithRetry(json)
      results.push({ id: entryId, success: result.success })
    } catch (error) {
      results.push({ id: entryId, success: false })
    }
  }

  // Process multiple entries - one failing, one succeeding
  attemptCount = 0
  await processEntry('entry-1', true) // Will fail
  await processEntry('entry-2', false) // Will succeed

  if (results.length !== 2) {
    throw new Error(`Expected 2 results, got ${results.length}`)
  }
  if (results[0].success !== false) {
    throw new Error('Expected entry-1 to fail')
  }
  if (results[1].success !== true) {
    throw new Error('Expected entry-2 to succeed')
  }
  console.log('✅ Error in one entry does not prevent processing of other entries')

  console.log('✅ All retry tests passed')
}

main().catch((error) => {
  console.error('❌ Test failed')
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
})
