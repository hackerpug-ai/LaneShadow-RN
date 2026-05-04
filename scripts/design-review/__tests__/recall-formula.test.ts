#!/usr/bin/env -S pnpm tsx

/**
 * Test: Recall Formula Verification
 *
 * Verifies that recall = TP / (TP + FN) is computed correctly.
 *
 * Test cases:
 * - TP=5, FN=1 → recall = 5/6 = 0.833
 * - TP=5, FN=0 → recall = 1.0
 * - TP=0, FN=5 → recall = 0
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

// Test 1: TP=5, FN=1 → recall = 5/6 = 0.833
test('computes recall = TP/(TP+FN) correctly for mixed predictions', () => {
  const predictions = [
    { entry_id: 'test-001', issues: [{ component: 'Button', issue_type: 'spacing' }] },
    { entry_id: 'test-002', issues: [{ component: 'Button', issue_type: 'color' }] },
    { entry_id: 'test-003', issues: [{ component: 'TextField', issue_type: 'typography' }] },
    { entry_id: 'test-004', issues: [{ component: 'TextField', issue_type: 'placement' }] },
    { entry_id: 'test-005', issues: [{ component: 'Label', issue_type: 'overflow' }] },
    { entry_id: 'test-006', issues: [] }, // Empty prediction but GT has issue (FN)
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
        issues: [{ component: 'Missing', issue_type: 'spacing', severity: 'med' }],
        expected_verdict: 'pass' as const,
      },
    },
  ]

  const result = computeScores(predictions, groundTruth)

  // recall = TP / (TP + FN) = 5 / (5 + 1) = 5/6 = 0.833
  assertClose(result.recall, 0.833, 3)
  assertEquals(result.true_positives, 5)
  assertEquals(result.false_negatives, 1)
})

// Test 2: TP=5, FN=0 → recall = 1.0
test('computes recall = 1.0 when FN=0 (perfect recall)', () => {
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

  // recall = TP / (TP + FN) = 5 / (5 + 0) = 1.0
  assertEquals(result.recall, 1.0)
  assertEquals(result.true_positives, 5)
  assertEquals(result.false_negatives, 0)
})

// Test 3: TP=0, FN=5 → recall = 0
test('computes recall = 0 when TP=0 (no correct predictions)', () => {
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

  // recall = TP / (TP + FN) = 0 / (0 + 5) = 0
  assertEquals(result.recall, 0)
  assertEquals(result.true_positives, 0)
  assertEquals(result.false_negatives, 5)
})

// Test 4: TP=0, FN=0 → recall = 1.0 (edge case)
test('computes recall = 1.0 when TP=0, FN=0 (no ground truth issues)', () => {
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

  // When TP=0 and FN=0, recall is defined as 1.0 in calibrate.ts
  assertEquals(result.recall, 1.0)
  assertEquals(result.true_positives, 0)
  assertEquals(result.false_negatives, 0)
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
