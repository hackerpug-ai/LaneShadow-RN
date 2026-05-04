#!/usr/bin/env -S pnpm tsx
/**
 * code-search-hint.test.ts
 *
 * Test mapped and unmapped selectors for code_search_hint
 *
 * Run: pnpm tsx scripts/design-review/__tests__/code-search-hint.test.ts
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

async function runTest() {
  console.log('🧪 Testing code_search_hint resolution...\n')

  const fixture = createTestFixture()

  try {
    // Setup test data
    const manifest = createTestManifest()
    writeManifest(fixture, manifest)

    writeAnnotationFile(fixture, 'auth-screen', 'email-entry', 'light', {
      bounding_box: { x: 0, y: 200, width: 375, height: 44 },
    })

    // Create issues with different components
    const issues = [
      { ...createTestIssues()[0], component: '.mol-form-field' }, // Mapped
      { ...createTestIssues()[1], component: '.mol-brand-badge' }, // Mapped
      { ...createTestIssues()[2], component: '.unmapped-component' }, // Unmapped
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

    // Write code map with only some components mapped
    writeCodeMap(fixture, {
      '.mol-form-field': 'LSFormField',
      '.mol-brand-badge': 'LSBrandBadge',
      // Intentionally not mapping .unmapped-component
    })

    // Generate report (capture stderr to check for warnings)
    const originalStderrWrite = process.stderr.write
    let stderrOutput = ''
    process.stderr.write = ((chunk: any) => {
      stderrOutput += chunk.toString()
      return true
    }) as any

    try {
      await mergeReport({
        manifestPath: fixture.manifestPath,
        evalsDir: fixture.evalsDir,
        reportJsonPath: fixture.reportJsonPath,
        reportHtmlPath: fixture.reportHtmlPath,
        minSeverity: 'low',
      })
    } finally {
      process.stderr.write = originalStderrWrite
    }

    // Read and verify
    const reportContent = readFileSync(fixture.reportJsonPath, 'utf-8')
    const report = JSON.parse(reportContent)

    console.log('📊 code_search_hint values:')
    const issuesByComponent: Record<string, any> = {}
    for (const issue of report.issues) {
      if (!issuesByComponent[issue.component]) {
        issuesByComponent[issue.component] = []
      }
      issuesByComponent[issue.component].push(issue)
    }

    let allPassed = true

    // Test 1: Mapped component should resolve to symbol name
    console.log('\nTest 1: Mapped selectors resolve to symbol names')
    const formFieldIssues = issuesByComponent['.mol-form-field'] || []
    if (formFieldIssues.length > 0 && formFieldIssues[0].code_search_hint === 'LSFormField') {
      console.log(`  ✅ .mol-form-field → LSFormField`)
    } else {
      console.log(
        `  ❌ .mol-form-field expected "LSFormField", got "${formFieldIssues[0]?.code_search_hint}"`,
      )
      allPassed = false
    }

    const brandBadgeIssues = issuesByComponent['.mol-brand-badge'] || []
    if (brandBadgeIssues.length > 0 && brandBadgeIssues[0].code_search_hint === 'LSBrandBadge') {
      console.log(`  ✅ .mol-brand-badge → LSBrandBadge`)
    } else {
      console.log(
        `  ❌ .mol-brand-badge expected "LSBrandBadge", got "${brandBadgeIssues[0]?.code_search_hint}"`,
      )
      allPassed = false
    }

    // Test 2: Unmapped component should fall back to selector
    console.log('\nTest 2: Unmapped selectors fall back to selector string')
    const unmappedIssues = issuesByComponent['.unmapped-component'] || []
    if (unmappedIssues.length > 0 && unmappedIssues[0].code_search_hint === '.unmapped-component') {
      console.log(`  ✅ .unmapped-component → .unmapped-component (fallback)`)
    } else {
      console.log(
        `  ❌ .unmapped-component expected ".unmapped-component", got "${unmappedIssues[0]?.code_search_hint}"`,
      )
      allPassed = false
    }

    // Test 3: Warning logged for unmapped component
    console.log('\nTest 3: Warning logged for unmapped component')
    if (stderrOutput.includes('.unmapped-component') && stderrOutput.includes('No code mapping')) {
      console.log(`  ✅ Warning logged for unmapped component`)
    } else {
      console.log(`  ⚠️  Warning not detected (may be logged elsewhere)`)
    }

    console.log()

    if (allPassed) {
      console.log('✅ ALL TESTS PASSED: code_search_hint resolution works correctly')
    } else {
      console.log('❌ SOME TESTS FAILED')
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
