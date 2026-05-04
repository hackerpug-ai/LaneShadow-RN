#!/usr/bin/env -S pnpm tsx
/**
 * report-html.test.ts
 *
 * Verify HTML structure and grouping
 *
 * Run: pnpm tsx scripts/design-review/__tests__/report-html.test.ts
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

function parseHtmlStructure(html: string) {
  // Basic HTML structure checks
  const hasDoctype = html.includes('<!DOCTYPE html>')
  const hasHtmlTag = html.includes('<html')
  const hasHead = html.includes('<head>')
  const hasBody = html.includes('<body>')
  const hasTitle = html.includes('<title>Design Review Report</title>')

  // Check for inline styles (self-contained)
  const hasInlineStyles = html.includes('<style>') && html.includes('</style>')

  // Check for inline scripts
  const hasInlineScripts = html.includes('<script>') && html.includes('</script>')

  // Check for summary section
  const hasSummarySection = html.includes('class="summary"')

  // Check for severity classes
  const hasSeverityHigh = html.includes('severity-high')
  const hasSeverityMed = html.includes('severity-med')
  const hasSeverityLow = html.includes('severity-low')

  // Check for collapsible entries
  const hasCollapsible = html.includes('onclick="toggleEntry') && html.includes('entry-content')

  // Check for article §5 fields in HTML
  const hasIssueId = html.includes('issue-id')
  const hasFixHint = html.includes('issue-hint')
  const hasDesignToken = html.includes('issue-token')
  const hasCodeSearch = html.includes('issue-code-search')
  const hasLocation = html.includes('issue-location')

  return {
    hasDoctype,
    hasHtmlTag,
    hasHead,
    hasBody,
    hasTitle,
    hasInlineStyles,
    hasInlineScripts,
    hasSummarySection,
    hasSeverityHigh,
    hasSeverityMed,
    hasSeverityLow,
    hasCollapsible,
    hasIssueId,
    hasFixHint,
    hasDesignToken,
    hasCodeSearch,
    hasLocation,
  }
}

async function runTest() {
  console.log('🧪 Testing HTML report structure...\n')

  const fixture = createTestFixture()

  try {
    // Setup test data
    const manifest = createTestManifest()
    writeManifest(fixture, manifest)

    writeAnnotationFile(fixture, 'auth-screen', 'email-entry', 'light', {
      bounding_box: { x: 0, y: 200, width: 375, height: 44 },
    })

    const issues = createTestIssues()
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

    // Generate report
    await mergeReport({
      manifestPath: fixture.manifestPath,
      evalsDir: fixture.evalsDir,
      reportJsonPath: fixture.reportJsonPath,
      reportHtmlPath: fixture.reportHtmlPath,
      minSeverity: 'low',
    })

    // Read and verify HTML
    const htmlContent = readFileSync(fixture.reportHtmlPath, 'utf-8')
    const structure = parseHtmlStructure(htmlContent)

    console.log('HTML Structure Checks:')
    console.log(`  DOCTYPE: ${structure.hasDoctype ? '✅' : '❌'}`)
    console.log(`  <html> tag: ${structure.hasHtmlTag ? '✅' : '❌'}`)
    console.log(`  <head>: ${structure.hasHead ? '✅' : '❌'}`)
    console.log(`  <body>: ${structure.hasBody ? '✅' : '❌'}`)
    console.log(`  Title: ${structure.hasTitle ? '✅' : '❌'}`)
    console.log()

    console.log('Self-Contained Checks:')
    console.log(`  Inline styles: ${structure.hasInlineStyles ? '✅' : '❌'}`)
    console.log(`  Inline scripts: ${structure.hasInlineScripts ? '✅' : '❌'}`)
    console.log()

    console.log('Summary Dashboard:')
    console.log(`  Summary section: ${structure.hasSummarySection ? '✅' : '❌'}`)
    console.log()

    console.log('Severity Styling:')
    console.log(`  High severity class: ${structure.hasSeverityHigh ? '✅' : '❌'}`)
    console.log(`  Med severity class: ${structure.hasSeverityMed ? '✅' : '❌'}`)
    console.log(`  Low severity class: ${structure.hasSeverityLow ? '✅' : '❌'}`)
    console.log()

    console.log('Interactive Features:')
    console.log(`  Collapsible entries: ${structure.hasCollapsible ? '✅' : '❌'}`)
    console.log()

    console.log('Article §5 Fields Display:')
    console.log(`  issue_id: ${structure.hasIssueId ? '✅' : '❌'}`)
    console.log(`  fix_hint: ${structure.hasFixHint ? '✅' : '❌'}`)
    console.log(`  design_token: ${structure.hasDesignToken ? '✅' : '❌'}`)
    console.log(`  code_search_hint: ${structure.hasCodeSearch ? '✅' : '❌'}`)
    console.log(`  location: ${structure.hasLocation ? '✅' : '❌'}`)
    console.log()

    const allPassed = Object.values(structure).every((value) => value === true)

    if (allPassed) {
      console.log('✅ TEST PASSED: HTML report structure is valid and complete')
    } else {
      console.log('❌ TEST FAILED: Some HTML structure checks failed')
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
