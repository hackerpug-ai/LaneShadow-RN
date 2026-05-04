#!/usr/bin/env -S pnpm tsx
/**
 * merge-report.ts
 *
 * Aggregates per-entry eval results into unified JSON + HTML report
 *
 * Usage: pnpm design:report
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const ROOT_DIR = join(__dirname, '../..')
const MANIFEST_PATH = join(ROOT_DIR, '.design-review/manifest.json')
const EVALS_DIR = join(ROOT_DIR, '.design-review/evals/visual')
const REPORT_JSON_PATH = join(ROOT_DIR, '.design-review/report.json')
const REPORT_HTML_PATH = join(ROOT_DIR, '.design-review/report.html')

export interface VisualIssue {
  component: string
  passed: boolean
  issue_type: 'spacing' | 'color' | 'typography' | 'placement' | 'overflow' | 'missing'
  observed: Record<string, string>
  expected: Record<string, string>
  severity: 'low' | 'med' | 'high'
  confidence: number
  fix_hint?: string
}

export interface EvalResult {
  entry_id: string
  screen: string
  state: string
  theme: string
  evaluated_at: string
  status: 'success' | 'error'
  issues?: VisualIssue[]
  error?: string
  retry_count: number
}

export interface ManifestEntry {
  id: string
  screen: string
  state: string
  theme: string
  captured: string
  captured_metadata: string
  reference: string
  annotations: string
}

export interface Manifest {
  entries: ManifestEntry[]
  generated_at: string
}

export interface ReportEntry {
  id: string
  screen: string
  state: string
  theme: string
  captured: string
  reference: string
  issues: VisualIssue[]
}

export interface ReportSummary {
  total_entries: number
  entries_with_issues: number
  issues_by_severity: Record<string, number>
  issues_by_type: Record<string, number>
}

export interface DesignReport {
  generated_at: string
  summary: ReportSummary
  entries: ReportEntry[]
}

/**
 * Load and parse manifest.json
 */
function loadManifest(manifestPath: string): Manifest {
  if (!existsSync(manifestPath)) {
    throw new Error(`Manifest not found: ${manifestPath}`)
  }

  const content = readFileSync(manifestPath, 'utf-8')
  return JSON.parse(content) as Manifest
}

/**
 * Load all eval results from directory
 */
function loadEvalResults(evalsDir: string): Map<string, EvalResult> {
  const results = new Map<string, EvalResult>()

  if (!existsSync(evalsDir)) {
    return results
  }

  const files = readdirSync(evalsDir).filter((f) => f.endsWith('.json'))

  for (const file of files) {
    try {
      const filePath = join(evalsDir, file)
      const content = readFileSync(filePath, 'utf-8')
      const result = JSON.parse(content) as EvalResult
      results.set(result.entry_id, result)
    } catch (error) {
      console.warn(`⚠️  Failed to load eval result ${file}:`, error)
    }
  }

  return results
}

/**
 * Aggregate issues by severity and type
 */
function aggregateIssues(entries: ReportEntry[]): ReportSummary {
  const summary: ReportSummary = {
    total_entries: entries.length,
    entries_with_issues: 0,
    issues_by_severity: { high: 0, med: 0, low: 0 },
    issues_by_type: {},
  }

  for (const entry of entries) {
    if (entry.issues.length > 0) {
      summary.entries_with_issues++
    }

    for (const issue of entry.issues) {
      summary.issues_by_severity[issue.severity]++
      summary.issues_by_type[issue.issue_type] = (summary.issues_by_type[issue.issue_type] || 0) + 1
    }
  }

  return summary
}

/**
 * Generate HTML report
 */
function generateHtmlReport(report: DesignReport): string {
  const { summary, entries } = report

  // Helper function for severity color classes
  const severityClass = (severity: string): string => {
    switch (severity) {
      case 'high':
        return 'severity-high'
      case 'med':
        return 'severity-med'
      case 'low':
        return 'severity-low'
      default:
        return ''
    }
  }

  // Generate HTML for each entry
  const entriesHtml = entries
    .map(
      (entry) => `
    <div class="entry" data-entry-id="${entry.id}">
      <div class="entry-header" onclick="toggleEntry('${entry.id}')">
        <h3>${entry.screen} — ${entry.state} (${entry.theme})</h3>
        <span class="issue-count">${entry.issues.length} issue(s)</span>
      </div>
      <div class="entry-content" id="entry-${entry.id}">
        <div class="images">
          <div class="image-group">
            <h4>Reference</h4>
            <img src="${entry.reference}" alt="Reference" />
          </div>
          <div class="image-group">
            <h4>Captured</h4>
            <img src="${entry.captured}" alt="Captured" />
          </div>
        </div>
        ${
          entry.issues.length > 0
            ? `
          <div class="issues">
            <h4>Issues</h4>
            <ul class="issue-list">
              ${entry.issues
                .map(
                  (issue) => `
                <li class="issue ${severityClass(issue.severity)}">
                  <div class="issue-header">
                    <span class="issue-component">${issue.component}</span>
                    <span class="issue-severity">${issue.severity.toUpperCase()}</span>
                  </div>
                  <div class="issue-details">
                    <div class="issue-type">${issue.issue_type}</div>
                    <div class="issue-comparison">
                      <strong>Observed:</strong> ${JSON.stringify(issue.observed)}<br/>
                      <strong>Expected:</strong> ${JSON.stringify(issue.expected)}
                    </div>
                    ${issue.fix_hint ? `<div class="issue-hint"><strong>Fix:</strong> ${issue.fix_hint}</div>` : ''}
                    <div class="issue-confidence">Confidence: ${(issue.confidence * 100).toFixed(0)}%</div>
                  </div>
                </li>
              `,
                )
                .join('')}
            </ul>
          </div>
        `
            : '<p class="no-issues">✅ No issues found</p>'
        }
      </div>
    </div>
  `,
    )
    .join('')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Design Review Report</title>
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      line-height: 1.6;
      color: #333;
      background: #f5f5f5;
      padding: 20px;
    }

    header {
      background: white;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 20px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    h1 {
      font-size: 24px;
      margin-bottom: 15px;
    }

    .summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
      margin-top: 15px;
    }

    .summary-card {
      background: #f9f9f9;
      padding: 15px;
      border-radius: 6px;
      border-left: 4px solid #ddd;
    }

    .summary-card.high {
      border-left-color: #dc3545;
    }

    .summary-card.med {
      border-left-color: #ffc107;
    }

    .summary-card.low {
      border-left-color: #6c757d;
    }

    .summary-card h3 {
      font-size: 14px;
      color: #666;
      margin-bottom: 5px;
    }

    .summary-card .value {
      font-size: 28px;
      font-weight: bold;
    }

    .entry {
      background: white;
      border-radius: 8px;
      margin-bottom: 15px;
      overflow: hidden;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .entry-header {
      padding: 15px 20px;
      background: #f9f9f9;
      cursor: pointer;
      display: flex;
      justify-content: space-between;
      align-items: center;
      user-select: none;
    }

    .entry-header:hover {
      background: #f0f0f0;
    }

    .entry-header h3 {
      font-size: 16px;
      margin: 0;
    }

    .issue-count {
      background: #dc3545;
      color: white;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: bold;
    }

    .entry-content {
      display: none;
      padding: 20px;
    }

    .entry-content.expanded {
      display: block;
    }

    .images {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 20px;
    }

    .image-group h4 {
      font-size: 14px;
      margin-bottom: 10px;
      color: #666;
    }

    .image-group img {
      width: 100%;
      height: auto;
      border: 1px solid #ddd;
      border-radius: 4px;
    }

    .issues {
      margin-top: 20px;
    }

    .issues h4 {
      font-size: 16px;
      margin-bottom: 15px;
    }

    .issue-list {
      list-style: none;
    }

    .issue {
      padding: 15px;
      margin-bottom: 10px;
      border-radius: 6px;
      border-left: 4px solid #ddd;
    }

    .issue.severity-high {
      background: #fee;
      border-left-color: #dc3545;
    }

    .issue.severity-med {
      background: #ffc;
      border-left-color: #ffc107;
    }

    .issue.severity-low {
      background: #f5f5f5;
      border-left-color: #6c757d;
    }

    .issue-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 10px;
    }

    .issue-component {
      font-weight: bold;
      font-size: 16px;
    }

    .issue-severity {
      font-size: 12px;
      font-weight: bold;
      padding: 2px 8px;
      border-radius: 4px;
    }

    .severity-high .issue-severity {
      background: #dc3545;
      color: white;
    }

    .severity-med .issue-severity {
      background: #ffc107;
      color: #333;
    }

    .severity-low .issue-severity {
      background: #6c757d;
      color: white;
    }

    .issue-details {
      font-size: 14px;
    }

    .issue-type {
      font-style: italic;
      color: #666;
      margin-bottom: 5px;
    }

    .issue-comparison {
      margin: 10px 0;
      padding: 10px;
      background: white;
      border-radius: 4px;
    }

    .issue-hint {
      margin-top: 10px;
      padding: 10px;
      background: #e7f3ff;
      border-radius: 4px;
      border-left: 3px solid #007bff;
    }

    .issue-confidence {
      margin-top: 8px;
      font-size: 12px;
      color: #666;
    }

    .no-issues {
      text-align: center;
      padding: 20px;
      color: #28a745;
      font-size: 16px;
    }

    @media (max-width: 768px) {
      .images {
        grid-template-columns: 1fr;
      }
    }
  </style>
</head>
<body>
  <header>
    <h1>Design Review Report</h1>
    <div class="summary">
      <div class="summary-card">
        <h3>Total Entries</h3>
        <div class="value">${summary.total_entries}</div>
      </div>
      <div class="summary-card high">
        <h3>Entries with Issues</h3>
        <div class="value">${summary.entries_with_issues}</div>
      </div>
      <div class="summary-card high">
        <h3>High Severity</h3>
        <div class="value">${summary.issues_by_severity.high || 0}</div>
      </div>
      <div class="summary-card med">
        <h3>Medium Severity</h3>
        <div class="value">${summary.issues_by_severity.med || 0}</div>
      </div>
      <div class="summary-card low">
        <h3>Low Severity</h3>
        <div class="value">${summary.issues_by_severity.low || 0}</div>
      </div>
    </div>
  </header>

  <main>
    ${entriesHtml}
  </main>

  <script>
    function toggleEntry(entryId) {
      const content = document.getElementById('entry-' + entryId);
      if (content) {
        content.classList.toggle('expanded');
      }
    }

    // Auto-expand first entry
    document.addEventListener('DOMContentLoaded', function() {
      const firstEntry = document.querySelector('.entry-content');
      if (firstEntry) {
        firstEntry.classList.add('expanded');
      }
    });
  </script>
</body>
</html>`
}

/**
 * Main merge function
 */
export async function mergeReport(options: {
  manifestPath: string
  evalsDir: string
  reportJsonPath: string
  reportHtmlPath: string
}): Promise<DesignReport> {
  const { manifestPath, evalsDir, reportJsonPath, reportHtmlPath } = options

  // Load manifest
  const manifest = loadManifest(manifestPath)

  // Load eval results
  const evalResults = loadEvalResults(evalsDir)

  // Build report entries
  const entries: ReportEntry[] = manifest.entries.map((entry) => {
    const evalResult = evalResults.get(entry.id)
    const issues = evalResult?.status === 'success' && evalResult.issues ? evalResult.issues : []

    return {
      id: entry.id,
      screen: entry.screen,
      state: entry.state,
      theme: entry.theme,
      captured: entry.captured,
      reference: entry.reference,
      issues,
    }
  })

  // Aggregate summary
  const summary = aggregateIssues(entries)

  // Build report
  const report: DesignReport = {
    generated_at: new Date().toISOString(),
    summary,
    entries,
  }

  // Ensure output directory exists
  mkdirSync(dirname(reportJsonPath), { recursive: true })
  mkdirSync(dirname(reportHtmlPath), { recursive: true })

  // Write JSON report
  writeFileSync(reportJsonPath, JSON.stringify(report, null, 2))
  console.log(`✅ JSON report written to ${reportJsonPath}`)

  // Write HTML report
  const htmlContent = generateHtmlReport(report)
  writeFileSync(reportHtmlPath, htmlContent)
  console.log(`✅ HTML report written to ${reportHtmlPath}`)

  return report
}

/**
 * CLI entry point
 */
async function main() {
  console.log('📊 Merging design review reports...')

  try {
    const report = await mergeReport({
      manifestPath: MANIFEST_PATH,
      evalsDir: EVALS_DIR,
      reportJsonPath: REPORT_JSON_PATH,
      reportHtmlPath: REPORT_HTML_PATH,
    })

    console.log(`✅ Report generated with ${report.summary.total_entries} entries`)
    console.log(`   - Entries with issues: ${report.summary.entries_with_issues}`)
    console.log(`   - High severity: ${report.summary.issues_by_severity.high}`)
    console.log(`   - Medium severity: ${report.summary.issues_by_severity.med}`)
    console.log(`   - Low severity: ${report.summary.issues_by_severity.low}`)
  } catch (error) {
    console.error('❌ Report generation failed:', error)
    process.exit(1)
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('❌ Report generation failed:', error)
    process.exit(1)
  })
}
