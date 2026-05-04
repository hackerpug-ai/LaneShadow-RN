#!/usr/bin/env -S pnpm tsx

/**
 * Test: merge-report.ts aggregates eval results into unified report
 *
 * AC-1: GIVEN: manifest.json and eval outputs exist
 *       WHEN:  mergeReport function runs
 *       THEN:  report.json contains unified results from all evals
 * AC-2: report.json contains summary with severity breakdown
 * AC-3: HTML report is self-contained
 * AC-4: HTML has severity-coded colors
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { mergeReport } from '../merge-report.ts'

const TEST_OUTPUT_DIR = '.design-review'
const TEST_REPORT_PATH = join(TEST_OUTPUT_DIR, 'report.json')
const TEST_HTML_PATH = join(TEST_OUTPUT_DIR, 'report.html')
const TEST_MANIFEST_PATH = join(TEST_OUTPUT_DIR, 'manifest.json')
const TEST_EVALS_DIR = join(TEST_OUTPUT_DIR, 'evals/visual')

function setupTestData() {
  // Create test directories
  mkdirSync(TEST_EVALS_DIR, { recursive: true })

  // Create test manifest
  const testManifest = {
    entries: [
      {
        id: 'test-screen.entry.light',
        screen: 'test-screen',
        state: 'entry',
        theme: 'light',
        captured: '.design-review/captures/test-screen.entry.light.png',
        captured_metadata: '.design-review/captures/test-screen.entry.light.json',
        reference: '.spec/design/system/refs/test-screen/entry.light.png',
        annotations: '.spec/design/system/refs/test-screen/entry.annotations.json',
      },
      {
        id: 'test-screen.entry.dark',
        screen: 'test-screen',
        state: 'entry',
        theme: 'dark',
        captured: '.design-review/captures/test-screen.entry.dark.png',
        captured_metadata: '.design-review/captures/test-screen.entry.dark.json',
        reference: '.spec/design/system/refs/test-screen/entry.dark.png',
        annotations: '.spec/design/system/refs/test-screen/entry.annotations.json',
      },
    ],
    generated_at: new Date().toISOString(),
  }
  writeFileSync(TEST_MANIFEST_PATH, JSON.stringify(testManifest, null, 2))

  // Create test eval results
  const evalResult1 = {
    entry_id: 'test-screen.entry.light',
    screen: 'test-screen',
    state: 'entry',
    theme: 'light',
    evaluated_at: new Date().toISOString(),
    status: 'success' as const,
    issues: [
      {
        component: 'LSButton',
        passed: false,
        issue_type: 'spacing' as const,
        observed: { padding: '8px' },
        expected: { padding: '16px' },
        severity: 'med' as const,
        confidence: 0.85,
      },
    ],
    retry_count: 0,
  }

  const evalResult2 = {
    entry_id: 'test-screen.entry.dark',
    screen: 'test-screen',
    state: 'entry',
    theme: 'dark',
    evaluated_at: new Date().toISOString(),
    status: 'success' as const,
    issues: [
      {
        component: 'LSText',
        passed: false,
        issue_type: 'color' as const,
        observed: { color: '#000000' },
        expected: { color: '#FFFFFF' },
        severity: 'high' as const,
        confidence: 0.92,
      },
      {
        component: 'LSButton',
        passed: false,
        issue_type: 'typography' as const,
        observed: { fontSize: '14px' },
        expected: { fontSize: '16px' },
        severity: 'low' as const,
        confidence: 0.75,
      },
    ],
    retry_count: 0,
  }

  writeFileSync(
    join(TEST_EVALS_DIR, 'test-screen.entry.light.json'),
    JSON.stringify(evalResult1, null, 2),
  )
  writeFileSync(
    join(TEST_EVALS_DIR, 'test-screen.entry.dark.json'),
    JSON.stringify(evalResult2, null, 2),
  )
}

function cleanupTestData() {
  // Clean up test files
  try {
    if (existsSync(TEST_REPORT_PATH)) {
      // Keep for inspection
    }
    if (existsSync(TEST_HTML_PATH)) {
      // Keep for inspection
    }
  } catch (error) {
    // Ignore cleanup errors
  }
}

async function main() {
  console.log('Testing mergeReport function...')

  // Test 1: Verify function is exported
  if (typeof mergeReport !== 'function') {
    console.error('❌ mergeReport function not found in module')
    process.exit(1)
  }
  console.log('✅ mergeReport function imported successfully')

  // Test 2: Verify function produces report.json (TC-1)
  console.log('\n📋 Test: report.json contains summary block')

  try {
    setupTestData()

    await mergeReport({
      manifestPath: TEST_MANIFEST_PATH,
      evalsDir: TEST_EVALS_DIR,
      reportJsonPath: TEST_REPORT_PATH,
      reportHtmlPath: TEST_HTML_PATH,
    })

    if (!existsSync(TEST_REPORT_PATH)) {
      console.error('❌ report.json was not created')
      process.exit(1)
    }

    const reportContent = readFileSync(TEST_REPORT_PATH, 'utf-8')
    const report = JSON.parse(reportContent)

    // TC-1: Verify summary block exists
    if (!report.summary) {
      console.error('❌ report.json missing summary block')
      process.exit(1)
    }

    console.log('✅ report.json contains summary block')

    // TC-2: Verify issues aggregated correctly
    if (report.summary.total_entries !== 2) {
      console.error(`❌ Expected total_entries=2, got ${report.summary.total_entries}`)
      process.exit(1)
    }

    if (report.summary.entries_with_issues !== 2) {
      console.error(`❌ Expected entries_with_issues=2, got ${report.summary.entries_with_issues}`)
      process.exit(1)
    }

    if (report.summary.issues_by_severity.high !== 1) {
      console.error(
        `❌ Expected high severity count=1, got ${report.summary.issues_by_severity.high}`,
      )
      process.exit(1)
    }

    if (report.summary.issues_by_severity.med !== 1) {
      console.error(
        `❌ Expected med severity count=1, got ${report.summary.issues_by_severity.med}`,
      )
      process.exit(1)
    }

    if (report.summary.issues_by_severity.low !== 1) {
      console.error(
        `❌ Expected low severity count=1, got ${report.summary.issues_by_severity.low}`,
      )
      process.exit(1)
    }

    console.log('✅ Issues aggregated correctly by severity')

    if (report.summary.issues_by_type.spacing !== 1) {
      console.error(
        `❌ Expected spacing type count=1, got ${report.summary.issues_by_type.spacing}`,
      )
      process.exit(1)
    }

    if (report.summary.issues_by_type.color !== 1) {
      console.error(`❌ Expected color type count=1, got ${report.summary.issues_by_type.color}`)
      process.exit(1)
    }

    if (report.summary.issues_by_type.typography !== 1) {
      console.error(
        `❌ Expected typography type count=1, got ${report.summary.issues_by_type.typography}`,
      )
      process.exit(1)
    }

    console.log('✅ Issues aggregated correctly by type')

    // TC-8: Verify entries match manifest count
    if (!report.entries || report.entries.length !== 2) {
      console.error(`❌ Expected 2 entries in report, got ${report.entries?.length || 0}`)
      process.exit(1)
    }

    console.log('✅ Entry count matches manifest')

    // TC-3: Verify HTML output is valid and self-contained
    console.log('\n🌐 Test: HTML output is valid and self-contained')

    if (!existsSync(TEST_HTML_PATH)) {
      console.error('❌ report.html was not created')
      process.exit(1)
    }

    const htmlContent = readFileSync(TEST_HTML_PATH, 'utf-8')

    // Check for self-contained HTML (no external CSS/JS links)
    if (
      htmlContent.includes('<link rel="stylesheet"') ||
      htmlContent.includes('<script src="http')
    ) {
      console.error('❌ HTML contains external asset links (not self-contained)')
      process.exit(1)
    }

    // Check for inline styles
    if (!htmlContent.includes('<style>')) {
      console.error('❌ HTML missing inline <style> tag')
      process.exit(1)
    }

    // Check for inline scripts
    if (!htmlContent.includes('<script>')) {
      console.error('❌ HTML missing inline <script> tag')
      process.exit(1)
    }

    console.log('✅ HTML is self-contained with inline CSS/JS')

    // TC-4: Verify side-by-side layout
    if (
      !htmlContent.toLowerCase().includes('reference') ||
      !htmlContent.toLowerCase().includes('captured')
    ) {
      console.error('❌ HTML missing side-by-side image containers')
      process.exit(1)
    }

    console.log('✅ HTML contains side-by-side layout')

    // TC-5: Verify severity colors
    if (
      !htmlContent.includes('high') ||
      !htmlContent.includes('med') ||
      !htmlContent.includes('low')
    ) {
      console.error('❌ HTML missing severity color coding')
      process.exit(1)
    }

    console.log('✅ HTML includes severity color coding')

    cleanupTestData()

    console.log('\n✅ All tests passed')
    process.exit(0)
  } catch (error) {
    console.error('❌ Test failed:', error)
    cleanupTestData()
    process.exit(1)
  }
}

main()
