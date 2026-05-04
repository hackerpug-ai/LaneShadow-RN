#!/usr/bin/env -S pnpm tsx

/**
 * Test: Golden set validation (AC-1)
 *
 * GIVEN: design system + injection branches
 * WHEN:  .spec/design/calibration/golden-set.json is committed
 * THEN:  File contains 15 entries (8 passing + 5 single-issue regressions covering spacing/color/typography weight/overflow/missing + 2 multi-issue) with expected_issues
 */

import { existsSync, readFileSync } from 'node:fs'

interface ExpectedIssue {
  component: string
  issue_type: 'spacing' | 'color' | 'typography' | 'placement' | 'overflow' | 'missing'
  severity: 'low' | 'med' | 'high'
}

interface GoldenEntry {
  id: string
  screen: string
  state: string
  theme: string
  reference_image: string
  test_image: string
  annotations: string
  ground_truth: {
    issues: ExpectedIssue[]
    expected_verdict: 'pass' | 'fail'
  }
}

interface GoldenSet {
  entries: GoldenEntry[]
  metadata: {
    total_entries: number
    passing_count: number
    single_issue_count: number
    multi_issue_count: number
    issue_types: string[]
  }
}

function validateGoldenSet(): void {
  const goldenSetPath = '.spec/design/calibration/golden-set.json'

  // Check file exists
  if (!existsSync(goldenSetPath)) {
    console.error(`❌ Golden set file not found: ${goldenSetPath}`)
    process.exit(1)
  }

  // Load and parse
  const content = readFileSync(goldenSetPath, 'utf-8')
  let goldenSet: GoldenSet
  try {
    goldenSet = JSON.parse(content) as GoldenSet
  } catch (error) {
    console.error(`❌ Invalid JSON in golden set: ${error}`)
    process.exit(1)
  }

  // Validate total count = 15
  if (goldenSet.entries.length !== 15) {
    console.error(`❌ Expected 15 entries, got ${goldenSet.entries.length}`)
    process.exit(1)
  }

  // Count passing vs failing
  const passingEntries = goldenSet.entries.filter((e) => e.ground_truth.expected_verdict === 'pass')
  const failingEntries = goldenSet.entries.filter((e) => e.ground_truth.expected_verdict === 'fail')

  if (passingEntries.length !== 8) {
    console.error(`❌ Expected 8 passing entries, got ${passingEntries.length}`)
    process.exit(1)
  }

  if (failingEntries.length !== 7) {
    console.error(
      `❌ Expected 7 failing entries (5 single-issue + 2 multi-issue), got ${failingEntries.length}`,
    )
    process.exit(1)
  }

  // Validate single-issue entries cover all required issue types
  const singleIssueEntries = failingEntries.filter((e) => e.ground_truth.issues.length === 1)
  if (singleIssueEntries.length !== 5) {
    console.error(`❌ Expected 5 single-issue entries, got ${singleIssueEntries.length}`)
    process.exit(1)
  }

  const coveredTypes = new Set(singleIssueEntries.map((e) => e.ground_truth.issues[0].issue_type))
  const requiredTypes = ['spacing', 'color', 'typography', 'overflow', 'missing']

  for (const type of requiredTypes) {
    if (!coveredTypes.has(type)) {
      console.error(`❌ Missing required issue type: ${type}`)
      console.error(`   Covered types: ${Array.from(coveredTypes).join(', ')}`)
      process.exit(1)
    }
  }

  // Validate multi-issue entries
  const multiIssueEntries = failingEntries.filter((e) => e.ground_truth.issues.length >= 2)
  if (multiIssueEntries.length !== 2) {
    console.error(`❌ Expected 2 multi-issue entries, got ${multiIssueEntries.length}`)
    process.exit(1)
  }

  // Validate each entry has required fields
  for (const entry of goldenSet.entries) {
    if (!entry.id || !entry.screen || !entry.state || !entry.theme) {
      console.error(`❌ Entry missing required fields: ${JSON.stringify(entry)}`)
      process.exit(1)
    }

    if (!existsSync(entry.reference_image)) {
      console.error(`❌ Reference image not found: ${entry.reference_image}`)
      process.exit(1)
    }

    if (!existsSync(entry.test_image)) {
      console.error(`❌ Test image not found: ${entry.test_image}`)
      process.exit(1)
    }

    if (!existsSync(entry.annotations)) {
      console.error(`❌ Annotations file not found: ${entry.annotations}`)
      process.exit(1)
    }
  }

  console.log('✅ Golden set validation passed')
  console.log(`   Total entries: ${goldenSet.entries.length}`)
  console.log(`   Passing: ${passingEntries.length}`)
  console.log(`   Single-issue: ${singleIssueEntries.length}`)
  console.log(`   Multi-issue: ${multiIssueEntries.length}`)
  console.log(`   Covered types: ${Array.from(coveredTypes).join(', ')}`)
}

// Run validation
validateGoldenSet()
