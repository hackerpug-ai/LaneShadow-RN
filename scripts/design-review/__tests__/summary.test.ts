#!/usr/bin/env -S pnpm tsx
/**
 * summary.test.ts
 *
 * Verify summary block aggregates correctly
 *
 * Run: pnpm tsx scripts/design-review/__tests__/summary.test.ts
 */

import { readFileSync } from 'node:fs'
import { mergeReport } from '../merge-report'
import {
  cleanupTestFixture,
  createTestFixture,
  createTestIssues,
  createTestManifest,
  writeAnnotationFile,
  writeCodeMap,
  writeEvalResult,
  writeManifest,
} from './test-helper'

interface ReportSummary {
  total: number
  high: number
  med: number
  low: number
  screens_passed: number
  screens_failed: number
}

function verifySummary(
  issues: any[],
  summary: ReportSummary,
): { passed: boolean; errors: string[] } {
  const errors: string[] = []

  // Verify total count
  if (summary.total !== issues.length) {
    errors.push(`Expected total ${issues.length}, got ${summary.total}`)
  }

  // Count by severity
  const highCount = issues.filter((i) => i.severity === 'high').length
  const medCount = issues.filter((i) => i.severity === 'med').length
  const lowCount = issues.filter((i) => i.severity === 'low').length

  if (summary.high !== highCount) {
    errors.push(`Expected high=${highCount}, got ${summary.high}`)
  }
  if (summary.med !== medCount) {
    errors.push(`Expected med=${medCount}, got ${summary.med}`)
  }
  if (summary.low !== lowCount) {
    errors.push(`Expected low=${lowCount}, got ${summary.low}`)
  }

  // Note: screens_passed and screens_failed depend on manifest entries
  // We'll verify these are non-negative numbers
  if (typeof summary.screens_passed !== 'number' || summary.screens_passed < 0) {
    errors.push(`screens_passed must be non-negative number, got ${summary.screens_passed}`)
  }
  if (typeof summary.screens_failed !== 'number' || summary.screens_failed < 0) {
    errors.push(`screens_failed must be non-negative number, got ${summary.screens_failed}`)
  }

  return { passed: errors.length === 0, errors }
}

async function runTest() {
  console.log('🧪 Testing summary aggregation...\n')

  const fixture = createTestFixture()

  try {
    // Setup test data with known issue counts
    const manifest = createTestManifest()
    writeManifest(fixture, manifest)

    // Write annotation files
    writeAnnotationFile(fixture, 'auth-screen', 'email-entry', 'light', {
      bounding_box: { x: 0, y: 200, width: 375, height: 44 },
    })
    writeAnnotationFile(fixture, 'auth-screen', 'password-entry', 'light', {
      bounding_box: { x: 0, y: 250, width: 375, height: 44 },
    })

    // Create issues with specific severity distribution: 2 high, 3 med, 1 low
    const issues1 = [
      createTestIssues()[0], // med
      { ...createTestIssues()[1], severity: 'high' as const }, // high
      { ...createTestIssues()[2], severity: 'low' as const }, // low
    ]
    writeEvalResult(fixture, {
      entry_id: 'test-screen-1',
      screen: 'auth-screen',
      state: 'email-entry',
      theme: 'light',
      evaluated_at: new Date().toISOString(),
      status: 'success',
      issues: issues1,
      retry_count: 0,
    })

    const issues2 = [
      { ...createTestIssues()[0], severity: 'med' as const }, // med
      { ...createTestIssues()[1], severity: 'high' as const }, // high
      { ...createTestIssues()[0], severity: 'med' as const }, // med
    ]
    writeEvalResult(fixture, {
      entry_id: 'test-screen-2',
      screen: 'auth-screen',
      state: 'password-entry',
      theme: 'light',
      evaluated_at: new Date().toISOString(),
      status: 'success',
      issues: issues2,
      retry_count: 0,
    })

    writeCodeMap(fixture, {
      '.mol-form-field': 'LSFormField',
      '.mol-brand-badge': 'LSBrandBadge',
      '.atom-phase-dot': 'LSPhaseDot',
    })

    // Generate report
    await mergeReport({
      manifestPath: fixture.manifestPath,
      evalsDir: fixture.evalsDir,
      reportJsonPath: fixture.reportJsonPath,
      reportHtmlPath: fixture.reportHtmlPath,
      minSeverity: 'low',
    })

    // Read and verify
    const reportContent = readFileSync(fixture.reportJsonPath, 'utf-8')
    const report = JSON.parse(reportContent)

    console.log('📊 Summary data:')
    console.log(`  Total issues: ${report.summary.total}`)
    console.log(`  High: ${report.summary.high}`)
    console.log(`  Medium: ${report.summary.med}`)
    console.log(`  Low: ${report.summary.low}`)
    console.log(`  Screens passed: ${report.summary.screens_passed}`)
    console.log(`  Screens failed: ${report.summary.screens_failed}`)
    console.log()

    const { passed, errors } = verifySummary(report.issues, report.summary)

    if (passed) {
      console.log('✅ TEST PASSED: Summary aggregates correctly')
    } else {
      console.log('❌ TEST FAILED: Summary aggregation errors')
      console.log('Errors:')
      errors.forEach((err) => console.log(`  - ${err}`))
      process.exit(1)
    }
  } catch (error) {
    console.error('❌ TEST ERROR:', error)
    process.exit(1)
  } finally {
    cleanupTestFixture(fixture)
  }
}

runTest()
