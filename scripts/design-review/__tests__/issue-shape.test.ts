#!/usr/bin/env -S pnpm tsx
/**
 * issue-shape.test.ts
 *
 * Verify every issue in output has all article §5 required fields
 *
 * Run: pnpm tsx scripts/design-review/__tests__/issue-shape.test.ts
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

// Article §5 required fields
const REQUIRED_FIELDS = [
  'issue_id',
  'screen',
  'state',
  'theme',
  'component',
  'issue_type',
  'severity',
  'confidence',
  'observed',
  'expected',
  'location',
  'location.bounding_box',
  'location.bounding_box.x',
  'location.bounding_box.y',
  'location.bounding_box.width',
  'location.bounding_box.height',
  'fix_hint',
  'design_token',
  'code_search_hint',
]

function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj)
}

function verifyRequiredFields(issue: any): { passed: boolean; missing: string[] } {
  const missing: string[] = []

  for (const field of REQUIRED_FIELDS) {
    const value = getNestedValue(issue, field)
    if (value === undefined || value === null || value === '') {
      missing.push(field)
    }
  }

  return { passed: missing.length === 0, missing }
}

async function runTest() {
  console.log('🧪 Testing issue shape with all article §5 fields...\n')

  const fixture = createTestFixture()

  try {
    // Setup test data
    const manifest = createTestManifest()
    writeManifest(fixture, manifest)

    // Write annotation files with bounding box data
    writeAnnotationFile(fixture, 'auth-screen', 'email-entry', 'light', {
      bounding_box: { x: 0, y: 200, width: 375, height: 44 },
    })
    writeAnnotationFile(fixture, 'auth-screen', 'password-entry', 'light', {
      bounding_box: { x: 0, y: 250, width: 375, height: 44 },
    })

    // Write eval results
    const issues1 = createTestIssues()
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

    const issues2 = createTestIssues([
      { component: '.mol-submit-button', issue_type: 'color', severity: 'high' },
    ])
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

    // Write component code map
    writeCodeMap(fixture, {
      '.mol-form-field': 'LSFormField',
      '.mol-brand-badge': 'LSBrandBadge',
      '.mol-submit-button': 'LSSubmitButton',
      '.atom-phase-dot': 'LSPhaseDot',
      '.atom-pill': 'LSPill',
    })

    // Generate report
    await mergeReport({
      manifestPath: fixture.manifestPath,
      evalsDir: fixture.evalsDir,
      reportJsonPath: fixture.reportJsonPath,
      reportHtmlPath: fixture.reportHtmlPath,
      minSeverity: 'low',
    })

    // Read and verify report
    const reportContent = readFileSync(fixture.reportJsonPath, 'utf-8')
    const report = JSON.parse(reportContent)

    console.log(`📊 Report contains ${report.issues.length} issues\n`)

    let allPassed = true
    const failures: Array<{ issue: any; missing: string[] }> = []

    for (const issue of report.issues) {
      const { passed, missing } = verifyRequiredFields(issue)

      if (passed) {
        console.log(`✅ ${issue.issue_id} — all fields present`)
      } else {
        console.log(`❌ ${issue.issue_id || '<unknown>'} — missing fields: ${missing.join(', ')}`)
        failures.push({ issue, missing })
        allPassed = false
      }
    }

    console.log()

    if (allPassed) {
      console.log('✅ TEST PASSED: All issues have required article §5 fields\n')
      console.log('Required fields verified:')
      REQUIRED_FIELDS.forEach((field) => console.log(`  ✓ ${field}`))
    } else {
      console.log('❌ TEST FAILED: Some issues are missing required fields\n')
      console.log('Failures:')
      for (const { issue, missing } of failures) {
        console.log(`  ${issue.issue_id || '<unknown>'}: ${missing.join(', ')}`)
      }
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
