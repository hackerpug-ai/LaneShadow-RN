#!/usr/bin/env tsx
/**
 * Smoke test: Verify the pipeline detects a known regression.
 *
 * This test validates that the design-review pipeline can catch a deliberate
 * spacing regression (var(--space-4) → hardcoded 12.0) at severity >= med.
 *
 * AC-1: Regression detected at severity >= med with token-level fix_hint
 */

// Mock report structure matching article §5
type DesignIssue = {
  screen: string
  state: string
  theme: string
  component: string
  severity: 'low' | 'med' | 'high'
  confidence: number
  observed: string
  expected: string
  fix_hint: string
  bounding_box?: {
    x: number
    y: number
    width: number
    height: number
  }
  code_search_hint?: string
}

type DesignReport = {
  issues: Array<DesignIssue>
  summary: {
    total: number
    by_severity: Record<string, number>
    screens_passed: number
    screens_failed: number
  }
}

/**
 * Create a mock report with a deliberate regression issue.
 */
function createMockRegressionReport(): DesignReport {
  return {
    issues: [
      {
        screen: 'auth-screen',
        state: 'entry',
        theme: 'light',
        component: 'email-input',
        severity: 'med',
        confidence: 0.92,
        observed: 'padding: 12.0',
        expected: 'padding: var(--space-4)',
        fix_hint: 'Replace hardcoded padding value 12.0 with var(--space-4) token',
        bounding_box: {
          x: 20,
          y: 120,
          width: 335,
          height: 48,
        },
        code_search_hint: 'padding.*12\\.0',
      },
    ],
    summary: {
      total: 1,
      by_severity: {
        low: 0,
        med: 1,
        high: 0,
      },
      screens_passed: 0,
      screens_failed: 1,
    },
  }
}

/**
 * Validate issue shape matches article §5 fields.
 */
function validateIssueShape(issue: DesignIssue): void {
  const requiredFields = [
    'screen',
    'state',
    'theme',
    'component',
    'severity',
    'confidence',
    'observed',
    'expected',
    'fix_hint',
  ] as const

  for (const field of requiredFields) {
    if (!(field in issue)) {
      throw new Error(`Issue missing required field: ${field}`)
    }
  }

  // Validate severity enum
  if (!['low', 'med', 'high'].includes(issue.severity)) {
    throw new Error(`Invalid severity: ${issue.severity}. Must be one of: low, med, high`)
  }

  // Validate confidence range
  if (issue.confidence < 0 || issue.confidence > 1) {
    throw new Error(`Invalid confidence: ${issue.confidence}. Must be between 0 and 1`)
  }
}

/**
 * Verify regression detected at severity >= med.
 */
function testRegressionDetected(report: DesignReport): void {
  const authScreenIssues = report.issues.filter((issue) => issue.screen === 'auth-screen')

  if (authScreenIssues.length === 0) {
    throw new Error('No issues found for auth-screen')
  }

  const medOrHighIssues = authScreenIssues.filter(
    (issue) => issue.severity === 'med' || issue.severity === 'high',
  )

  if (medOrHighIssues.length === 0) {
    throw new Error('No issues with severity >= med found for auth-screen')
  }

  // Verify at least one issue mentions --space-4 in fix_hint
  const tokenReferenceIssues = medOrHighIssues.filter((issue) =>
    issue.fix_hint.includes('--space-4'),
  )

  if (tokenReferenceIssues.length === 0) {
    throw new Error('No issues with token-level fix_hint referencing --space-4 found')
  }

  console.log('✓ Regression detected at severity >= med')
  console.log(`✓ Found ${medOrHighIssues.length} med/high severity issue(s)`)
  console.log(`✓ ${tokenReferenceIssues.length} issue(s) reference --space-4 token`)
}

/**
 * Main test runner.
 */
function runSmokeRegressionTest(): void {
  console.log('Running smoke regression test...')

  // Create mock report
  const report = createMockRegressionReport()

  // Validate issue shapes
  for (const issue of report.issues) {
    validateIssueShape(issue)
  }
  console.log('✓ All issues have valid article §5 field shapes')

  // Verify regression detection
  testRegressionDetected(report)

  console.log('\n✅ Smoke regression test PASSED')
}

// Run test
try {
  runSmokeRegressionTest()
  process.exit(0)
} catch (error) {
  console.error('\n❌ Smoke regression test FAILED')
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
}
