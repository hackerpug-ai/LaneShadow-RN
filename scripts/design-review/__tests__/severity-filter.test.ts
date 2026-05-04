#!/usr/bin/env -S pnpm tsx
/**
 * severity-filter.test.ts
 *
 * Test default (med), env override (low, high) severity filtering
 *
 * Run: pnpm tsx scripts/design-review/__tests__/severity-filter.test.ts
 */

import { readFileSync } from 'node:fs'
import { mergeReport } from '../merge-report'
import {
  createTestFixture,
  cleanupTestFixture,
  createTestManifest,
  createTestIssues,
  writeManifest,
  writeEvalResult,
  writeAnnotationFile,
  writeCodeMap,
} from './test-helper'

async function runTest() {
  console.log('🧪 Testing severity filtering...\n')

  const fixture = createTestFixture()

  try {
    // Setup test data with all severity levels
    const manifest = createTestManifest()
    writeManifest(fixture, manifest)

    writeAnnotationFile(fixture, 'auth-screen', 'email-entry', 'light', {
      bounding_box: { x: 0, y: 200, width: 375, height: 44 },
    })

    // Create issues: 1 high, 2 med, 1 low
    const issues = [
      { ...createTestIssues()[0], severity: 'high' as const },
      { ...createTestIssues()[1], severity: 'med' as const },
      { ...createTestIssues()[2], severity: 'med' as const },
      { ...createTestIssues()[0], severity: 'low' as const },
    ]
    writeEvalResult(fixture, {
      entry_id: 'test-screen-1',
      screen: 'auth-screen',
      state: 'email-entry',
      theme: 'light',
      evaluated_at: new Date().toISOString(),
      status: 'success',
      issues,
      retry_count: 0,
    })

    writeCodeMap(fixture, { '.mol-form-field': 'LSFormField' })

    // Test 1: Default (med) - should include med + high, exclude low
    console.log('Test 1: Default severity (med) - include med and high')
    await mergeReport({
      manifestPath: fixture.manifestPath,
      evalsDir: fixture.evalsDir,
      reportJsonPath: fixture.reportJsonPath,
      reportHtmlPath: fixture.reportHtmlPath,
      minSeverity: 'med',
    })

    let reportContent = readFileSync(fixture.reportJsonPath, 'utf-8')
    let report = JSON.parse(reportContent)

    const hasHigh = report.issues.some((i: any) => i.severity === 'high')
    const hasMed = report.issues.some((i: any) => i.severity === 'med')
    const hasLow = report.issues.some((i: any) => i.severity === 'low')

    console.log(`  Issues count: ${report.issues.length} (expected: 3)`)
    console.log(`  Has high: ${hasHigh} (expected: true)`)
    console.log(`  Has med: ${hasMed} (expected: true)`)
    console.log(`  Has low: ${hasLow} (expected: false)`)

    if (report.issues.length === 3 && hasHigh && hasMed && !hasLow) {
      console.log('  ✅ PASS\n')
    } else {
      console.log('  ❌ FAIL\n')
      process.exit(1)
    }

    // Test 2: Low - should include all
    console.log('Test 2: Low severity - include all')
    await mergeReport({
      manifestPath: fixture.manifestPath,
      evalsDir: fixture.evalsDir,
      reportJsonPath: fixture.reportJsonPath,
      reportHtmlPath: fixture.reportHtmlPath,
      minSeverity: 'low',
    })

    reportContent = readFileSync(fixture.reportJsonPath, 'utf-8')
    report = JSON.parse(reportContent)

    console.log(`  Issues count: ${report.issues.length} (expected: 4)`)

    if (report.issues.length === 4) {
      console.log('  ✅ PASS\n')
    } else {
      console.log('  ❌ FAIL\n')
      process.exit(1)
    }

    // Test 3: High - should include only high
    console.log('Test 3: High severity - include only high')
    await mergeReport({
      manifestPath: fixture.manifestPath,
      evalsDir: fixture.evalsDir,
      reportJsonPath: fixture.reportJsonPath,
      reportHtmlPath: fixture.reportHtmlPath,
      minSeverity: 'high',
    })

    reportContent = readFileSync(fixture.reportJsonPath, 'utf-8')
    report = JSON.parse(reportContent)

    const onlyHigh = report.issues.every((i: any) => i.severity === 'high')

    console.log(`  Issues count: ${report.issues.length} (expected: 1)`)
    console.log(`  Only high: ${onlyHigh} (expected: true)`)

    if (report.issues.length === 1 && onlyHigh) {
      console.log('  ✅ PASS\n')
    } else {
      console.log('  ❌ FAIL\n')
      process.exit(1)
    }

    console.log('✅ ALL TESTS PASSED: Severity filtering works correctly')
  } catch (error) {
    console.error('❌ TEST ERROR:', error)
    process.exit(1)
  } finally {
    cleanupTestFixture(fixture)
  }
}

runTest()
