#!/usr/bin/env -S pnpm tsx

/**
 * Test: Precision Formula Verification
 *
 * Verifies that precision = TP / (TP + FP) is computed correctly.
 *
 * Test cases:
 * - TP=5, FP=1 → precision = 5/6 = 0.833
 * - TP=5, FP=0 → precision = 1.0
 * - TP=0, FP=0 → precision = 0 (edge case: no predictions)
 */

import { computeScores } from '../calibrate'

interface TestResult {
  name: string
  passed: boolean
  error?: string
}

const results: TestResult[] = []

function test(name: string, fn: () => void) {
  try {
    fn()
    results.push({ name, passed: true })
    console.log(`✓ ${name}`)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    results.push({ name, passed: false, error: message })
    console.error(`✗ ${name}`)
    console.error(`  ${message}`)
  }
}

function assertClose(actual: number, expected: number, precision: number) {
  const diff = Math.abs(actual - expected)
  if (diff > 10 ** -precision) {
    throw new Error(`Expected ${expected} (±${precision} decimals), got ${actual} (diff: ${diff})`)
  }
}

function assertEquals<T>(actual: T, expected: T, message?: string) {
  if (actual !== expected) {
    throw new Error(message || `Expected ${expected}, got ${actual}`)
  }
}

// Test 1: TP=5, FP=1 → precision = 5/6 = 0.833
test('computes precision = TP/(TP+FP) correctly for mixed predictions', () => {
  const predictions = [
    { entry_id: 'test-001', issues: [{ component: 'Button', issue_type: 'spacing' }] },
    { entry_id: 'test-002', issues: [{ component: 'Button', issue_type: 'color' }] },
    { entry_id: 'test-003', issues: [{ component: 'TextField', issue_type: 'typography' }] },
    { entry_id: 'test-004', issues: [{ component: 'TextField', issue_type: 'placement' }] },
    { entry_id: 'test-005', issues: [{ component: 'Label', issue_type: 'overflow' }] },
    { entry_id: 'test-006', issues: [{ component: 'NonExistent', issue_type: 'spacing' }] }, // FP
  ]

  const groundTruth = [
    {
      id: 'test-001',
      screen: 'Test',
      state: 'default',
      theme: 'light',
      reference_image: '/fake/path.png',
      test_image: '/fake/path.png',
      annotations: '/fake/path.json',
      ground_truth: {
        issues: [{ component: 'Button', issue_type: 'spacing', severity: 'med' }],
        expected_verdict: 'pass' as const,
      },
    },
    {
      id: 'test-002',
      screen: 'Test',
      state: 'default',
      theme: 'light',
      reference_image: '/fake/path.png',
      test_image: '/fake/path.png',
      annotations: '/fake/path.json',
      ground_truth: {
        issues: [{ component: 'Button', issue_type: 'color', severity: 'med' }],
        expected_verdict: 'pass' as const,
      },
    },
    {
      id: 'test-003',
      screen: 'Test',
      state: 'default',
      theme: 'light',
      reference_image: '/fake/path.png',
      test_image: '/fake/path.png',
      annotations: '/fake/path.json',
      ground_truth: {
        issues: [{ component: 'TextField', issue_type: 'typography', severity: 'low' }],
        expected_verdict: 'pass' as const,
      },
    },
    {
      id: 'test-004',
      screen: 'Test',
      state: 'default',
      theme: 'light',
      reference_image: '/fake/path.png',
      test_image: '/fake/path.png',
      annotations: '/fake/path.json',
      ground_truth: {
        issues: [{ component: 'TextField', issue_type: 'placement', severity: 'high' }],
        expected_verdict: 'pass' as const,
      },
    },
    {
      id: 'test-005',
      screen: 'Test',
      state: 'default',
      theme: 'light',
      reference_image: '/fake/path.png',
      test_image: '/fake/path.png',
      annotations: '/fake/path.json',
      ground_truth: {
        issues: [{ component: 'Label', issue_type: 'overflow', severity: 'med' }],
        expected_verdict: 'pass' as const,
      },
    },
    {
      id: 'test-006',
      screen: 'Test',
      state: 'default',
      theme: 'light',
      reference_image: '/fake/path.png',
      test_image: '/fake/path.png',
      annotations: '/fake/path.json',
      ground_truth: {
        issues: [],
        expected_verdict: 'pass' as const,
      },
    },
  ]

  const result = computeScores(predictions, groundTruth)

  // precision = TP / (TP + FP) = 5 / (5 + 1) = 5/6 = 0.833
  assertClose(result.precision, 0.833, 3)
  assertEquals(result.true_positives, 5)
  assertEquals(result.false_positives, 1)
})

// Test 2: TP=5, FP=0 → precision = 1.0
test('computes precision = 1.0 when FP=0 (perfect predictions)', () => {
  const predictions = [
    { entry_id: 'test-001', issues: [{ component: 'Button', issue_type: 'spacing' }] },
    { entry_id: 'test-002', issues: [{ component: 'Button', issue_type: 'color' }] },
    { entry_id: 'test-003', issues: [{ component: 'TextField', issue_type: 'typography' }] },
    { entry_id: 'test-004', issues: [{ component: 'TextField', issue_type: 'placement' }] },
    { entry_id: 'test-005', issues: [{ component: 'Label', issue_type: 'overflow' }] },
  ]

  const groundTruth = [
    {
      id: 'test-001',
      screen: 'Test',
      state: 'default',
      theme: 'light',
      reference_image: '/fake/path.png',
      test_image: '/fake/path.png',
      annotations: '/fake/path.json',
      ground_truth: {
        issues: [{ component: 'Button', issue_type: 'spacing', severity: 'med' }],
        expected_verdict: 'pass' as const,
      },
    },
    {
      id: 'test-002',
      screen: 'Test',
      state: 'default',
      theme: 'light',
      reference_image: '/fake/path.png',
      test_image: '/fake/path.png',
      annotations: '/fake/path.json',
      ground_truth: {
        issues: [{ component: 'Button', issue_type: 'color', severity: 'med' }],
        expected_verdict: 'pass' as const,
      },
    },
    {
      id: 'test-003',
      screen: 'Test',
      state: 'default',
      theme: 'light',
      reference_image: '/fake/path.png',
      test_image: '/fake/path.png',
      annotations: '/fake/path.json',
      ground_truth: {
        issues: [{ component: 'TextField', issue_type: 'typography', severity: 'low' }],
        expected_verdict: 'pass' as const,
      },
    },
    {
      id: 'test-004',
      screen: 'Test',
      state: 'default',
      theme: 'light',
      reference_image: '/fake/path.png',
      test_image: '/fake/path.png',
      annotations: '/fake/path.json',
      ground_truth: {
        issues: [{ component: 'TextField', issue_type: 'placement', severity: 'high' }],
        expected_verdict: 'pass' as const,
      },
    },
    {
      id: 'test-005',
      screen: 'Test',
      state: 'default',
      theme: 'light',
      reference_image: '/fake/path.png',
      test_image: '/fake/path.png',
      annotations: '/fake/path.json',
      ground_truth: {
        issues: [{ component: 'Label', issue_type: 'overflow', severity: 'med' }],
        expected_verdict: 'pass' as const,
      },
    },
  ]

  const result = computeScores(predictions, groundTruth)

  // precision = TP / (TP + FP) = 5 / (5 + 0) = 1.0
  assertEquals(result.precision, 1.0)
  assertEquals(result.true_positives, 5)
  assertEquals(result.false_positives, 0)
})

// Test 3: TP=0, FP=5 → precision = 0
test('computes precision = 0 when TP=0 (no correct predictions)', () => {
  const predictions = [
    { entry_id: 'test-001', issues: [{ component: 'WrongComponent', issue_type: 'spacing' }] },
    { entry_id: 'test-002', issues: [{ component: 'WrongComponent', issue_type: 'color' }] },
    { entry_id: 'test-003', issues: [{ component: 'WrongComponent', issue_type: 'typography' }] },
    { entry_id: 'test-004', issues: [{ component: 'WrongComponent', issue_type: 'placement' }] },
    { entry_id: 'test-005', issues: [{ component: 'WrongComponent', issue_type: 'overflow' }] },
  ]

  const groundTruth = [
    {
      id: 'test-001',
      screen: 'Test',
      state: 'default',
      theme: 'light',
      reference_image: '/fake/path.png',
      test_image: '/fake/path.png',
      annotations: '/fake/path.json',
      ground_truth: {
        issues: [{ component: 'Button', issue_type: 'spacing', severity: 'med' }],
        expected_verdict: 'pass' as const,
      },
    },
    {
      id: 'test-002',
      screen: 'Test',
      state: 'default',
      theme: 'light',
      reference_image: '/fake/path.png',
      test_image: '/fake/path.png',
      annotations: '/fake/path.json',
      ground_truth: {
        issues: [{ component: 'Button', issue_type: 'color', severity: 'med' }],
        expected_verdict: 'pass' as const,
      },
    },
    {
      id: 'test-003',
      screen: 'Test',
      state: 'default',
      theme: 'light',
      reference_image: '/fake/path.png',
      test_image: '/fake/path.png',
      annotations: '/fake/path.json',
      ground_truth: {
        issues: [{ component: 'TextField', issue_type: 'typography', severity: 'low' }],
        expected_verdict: 'pass' as const,
      },
    },
    {
      id: 'test-004',
      screen: 'Test',
      state: 'default',
      theme: 'light',
      reference_image: '/fake/path.png',
      test_image: '/fake/path.png',
      annotations: '/fake/path.json',
      ground_truth: {
        issues: [{ component: 'TextField', issue_type: 'placement', severity: 'high' }],
        expected_verdict: 'pass' as const,
      },
    },
    {
      id: 'test-005',
      screen: 'Test',
      state: 'default',
      theme: 'light',
      reference_image: '/fake/path.png',
      test_image: '/fake/path.png',
      annotations: '/fake/path.json',
      ground_truth: {
        issues: [{ component: 'Label', issue_type: 'overflow', severity: 'med' }],
        expected_verdict: 'pass' as const,
      },
    },
  ]

  const result = computeScores(predictions, groundTruth)

  // precision = TP / (TP + FP) = 0 / (0 + 5) = 0
  assertEquals(result.precision, 0)
  assertEquals(result.true_positives, 0)
  assertEquals(result.false_positives, 5)
})

// Test 4: TP=0, FP=0 → precision = 1.0 (edge case)
test('computes precision = 1.0 when TP=0, FP=0 (no predictions at all)', () => {
  const predictions = [
    { entry_id: 'test-001', issues: [] },
    { entry_id: 'test-002', issues: [] },
  ]

  const groundTruth = [
    {
      id: 'test-001',
      screen: 'Test',
      state: 'default',
      theme: 'light',
      reference_image: '/fake/path.png',
      test_image: '/fake/path.png',
      annotations: '/fake/path.json',
      ground_truth: {
        issues: [],
        expected_verdict: 'pass' as const,
      },
    },
    {
      id: 'test-002',
      screen: 'Test',
      state: 'default',
      theme: 'light',
      reference_image: '/fake/path.png',
      test_image: '/fake/path.png',
      annotations: '/fake/path.json',
      ground_truth: {
        issues: [],
        expected_verdict: 'pass' as const,
      },
    },
  ]

  const result = computeScores(predictions, groundTruth)

  // When TP=0 and FP=0, precision is defined as 1.0 in calibrate.ts
  assertEquals(result.precision, 1.0)
  assertEquals(result.true_positives, 0)
  assertEquals(result.false_positives, 0)
})

// Summary
console.log('\n=== Test Summary ===')
const passed = results.filter((r) => r.passed).length
const failed = results.filter((r) => !r.passed).length
console.log(`Passed: ${passed}/${results.length}`)
console.log(`Failed: ${failed}/${results.length}`)

if (failed > 0) {
  console.log('\nFailed tests:')
  for (const result of results) {
    if (!result.passed) {
      console.log(`  - ${result.name}: ${result.error}`)
    }
  }
  process.exit(1)
}
