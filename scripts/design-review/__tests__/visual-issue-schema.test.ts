#!/usr/bin/env -S pnpm tsx

/**
 * Test: VisualIssueSchema enforces issue array shape
 *
 * AC-2: GIVEN: schemas/visual-issue.zod.ts is implemented
 *        WHEN:  Schema validates output
 *        THEN:  z.array(z.object({component, passed, issue_type ∈ {spacing,color,typography,placement,overflow,missing}, observed, expected, severity ∈ {low,med,high}, confidence ∈ [0,1]})) parses successfully on golden fixture and rejects out-of-range / unknown-enum payloads
 *
 * TC-3: Schema accepts valid fixture
 * TC-4: Schema rejects out-of-range confidence
 * TC-5: Schema rejects unknown issue_type enum value
 */

import { VisualIssueSchema } from '../schemas/visual-issue.zod'

function testCase(name: string, fn: () => void): void {
  try {
    fn()
    console.log(`✅ ${name}`)
  } catch (error) {
    console.error(`❌ ${name}`)
    console.error(error instanceof Error ? error.message : String(error))
    process.exit(1)
  }
}

function assertThrows(fn: () => void, message: string): void {
  try {
    fn()
    throw new Error(`Expected function to throw, but it didn't: ${message}`)
  } catch (error) {
    if (error instanceof Error && error.message.includes('Expected function to throw')) {
      throw error
    }
    // Expected - function threw
  }
}

console.log('Testing VisualIssueSchema...')

// Test: Valid payload with all required fields
testCase('accepts valid payload with all required fields', () => {
  const validPayload = [
    {
      component: 'EmailField',
      passed: false,
      issue_type: 'spacing',
      observed: { padding: '16px', margin: '8px' },
      expected: { padding: '24px', margin: '12px' },
      severity: 'med',
      confidence: 0.85,
    },
    {
      component: 'SubmitButton',
      passed: true,
      issue_type: 'color',
      observed: { background: 'var(--primary-default)' },
      expected: { background: 'var(--primary-default)' },
      severity: 'low',
      confidence: 0.95,
    },
  ]

  const result = VisualIssueSchema.parse(validPayload)
  if (result.length !== 2) {
    throw new Error('Expected array length of 2')
  }
  if (result[0].component !== 'EmailField') {
    throw new Error('Expected first component to be EmailField')
  }
})

// Test: All issue_type enum values
testCase('accepts all issue_type enum values', () => {
  const allIssueTypes = [
    'spacing',
    'color',
    'typography',
    'placement',
    'overflow',
    'missing',
  ] as const

  const payload = allIssueTypes.map((issue_type) => ({
    component: 'TestComponent',
    passed: false,
    issue_type,
    observed: { test: 'value' },
    expected: { test: 'expected' },
    severity: 'low' as const,
    confidence: 0.5,
  }))

  const result = VisualIssueSchema.parse(payload)
  if (result.length !== 6) {
    throw new Error('Expected 6 results')
  }
  const resultTypes = result.map((r) => r.issue_type)
  if (JSON.stringify(resultTypes) !== JSON.stringify(allIssueTypes)) {
    throw new Error('Issue types mismatch')
  }
})

// Test: All severity enum values
testCase('accepts all severity enum values', () => {
  const allSeverities = ['low', 'med', 'high'] as const

  const payload = allSeverities.map((severity) => ({
    component: 'TestComponent',
    passed: false,
    issue_type: 'spacing' as const,
    observed: { test: 'value' },
    expected: { test: 'expected' },
    severity,
    confidence: 0.5,
  }))

  const result = VisualIssueSchema.parse(payload)
  if (result.length !== 3) {
    throw new Error('Expected 3 results')
  }
  const resultSeverities = result.map((r) => r.severity)
  if (JSON.stringify(resultSeverities) !== JSON.stringify(allSeverities)) {
    throw new Error('Severities mismatch')
  }
})

// Test: Confidence at boundaries
testCase('accepts confidence values at boundaries (0 and 1)', () => {
  const payload = [
    {
      component: 'TestComponent',
      passed: true,
      issue_type: 'spacing' as const,
      observed: { test: 'value' },
      expected: { test: 'expected' },
      severity: 'low' as const,
      confidence: 0,
    },
    {
      component: 'TestComponent2',
      passed: true,
      issue_type: 'color' as const,
      observed: { test: 'value' },
      expected: { test: 'expected' },
      severity: 'low' as const,
      confidence: 1,
    },
  ]

  const result = VisualIssueSchema.parse(payload)
  if (result.length !== 2) {
    throw new Error('Expected 2 results')
  }
  if (result[0].confidence !== 0) {
    throw new Error('Expected first confidence to be 0')
  }
  if (result[1].confidence !== 1) {
    throw new Error('Expected second confidence to be 1')
  }
})

// Test: Reject negative confidence
testCase('rejects out-of-range confidence (negative)', () => {
  const invalidPayload = [
    {
      component: 'TestComponent',
      passed: false,
      issue_type: 'spacing',
      observed: { test: 'value' },
      expected: { test: 'expected' },
      severity: 'med',
      confidence: -0.1,
    },
  ]

  assertThrows(() => VisualIssueSchema.parse(invalidPayload), 'negative confidence')
})

// Test: Reject confidence > 1
testCase('rejects out-of-range confidence (> 1)', () => {
  const invalidPayload = [
    {
      component: 'TestComponent',
      passed: false,
      issue_type: 'spacing',
      observed: { test: 'value' },
      expected: { test: 'expected' },
      severity: 'med',
      confidence: 1.1,
    },
  ]

  assertThrows(() => VisualIssueSchema.parse(invalidPayload), 'confidence > 1')
})

// Test: Reject unknown issue_type
testCase('rejects unknown issue_type enum value', () => {
  const invalidPayload = [
    {
      component: 'TestComponent',
      passed: false,
      issue_type: 'unknown_type',
      observed: { test: 'value' },
      expected: { test: 'expected' },
      severity: 'med',
      confidence: 0.5,
    },
  ]

  assertThrows(() => VisualIssueSchema.parse(invalidPayload), 'unknown issue_type')
})

// Test: Reject unknown severity
testCase('rejects unknown severity enum value', () => {
  const invalidPayload = [
    {
      component: 'TestComponent',
      passed: false,
      issue_type: 'spacing',
      observed: { test: 'value' },
      expected: { test: 'expected' },
      severity: 'critical',
      confidence: 0.5,
    },
  ]

  assertThrows(() => VisualIssueSchema.parse(invalidPayload), 'unknown severity')
})

// Test: Reject missing required fields
testCase('rejects missing required fields', () => {
  const invalidPayload = [
    {
      component: 'TestComponent',
      passed: false,
      // Missing: issue_type, observed, expected, severity, confidence
    },
  ]

  assertThrows(() => VisualIssueSchema.parse(invalidPayload), 'missing fields')
})

// Test: Reject non-array input
testCase('rejects non-array input', () => {
  const invalidPayload = {
    component: 'TestComponent',
    passed: false,
    issue_type: 'spacing',
    observed: { test: 'value' },
    expected: { test: 'expected' },
    severity: 'med',
    confidence: 0.5,
  }

  assertThrows(() => VisualIssueSchema.parse(invalidPayload), 'non-array input')
})

console.log('✅ All schema tests passed')
