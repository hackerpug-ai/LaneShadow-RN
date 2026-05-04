#!/usr/bin/env -S pnpm tsx
/**
 * merge-report.ts
 *
 * Aggregates per-entry eval results into unified JSON + HTML report
 *
 * Usage: pnpm design:report
 * Env: DESIGN_REVIEW_SEVERITY=med|low|high (default: med)
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
const COMPONENT_CODE_MAP_PATH = join(__dirname, 'component-code-map.json')

// Severity levels for filtering
type SeverityLevel = 'low' | 'med' | 'high'
const SEVERITY_ORDER: Record<SeverityLevel, number> = { low: 1, med: 2, high: 3 }

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

export interface BoundingBox {
  x: number
  y: number
  width: number
  height: number
}

export interface IssueLocation {
  bounding_box: BoundingBox
}

export interface ReportIssue {
  issue_id: string
  screen: string
  state: string
  theme: string
  component: string
  issue_type: string
  severity: string
  confidence: number
  observed: string
  expected: string
  location: IssueLocation
  fix_hint: string
  design_token: string
  code_search_hint: string
}

export interface ReportSummary {
  total: number
  high: number
  med: number
  low: number
  screens_passed: number
  screens_failed: number
}

export interface DesignReport {
  issues: ReportIssue[]
  summary: ReportSummary
}

export interface ComponentCodeMap {
  [selector: string]: string
}

/**
 * Load component to code symbol mapping
 */
function loadComponentCodeMap(): ComponentCodeMap {
  try {
    if (existsSync(COMPONENT_CODE_MAP_PATH)) {
      const content = readFileSync(COMPONENT_CODE_MAP_PATH, 'utf-8')
      return JSON.parse(content) as ComponentCodeMap
    }
  } catch (error) {
    console.warn(`⚠️  Failed to load component code map: ${error}`)
  }

  // Default fallback mappings for auth-screen
  return {
    '.mol-form-field': 'LSFormField',
    '.mol-brand-badge': 'LSBrandBadge',
    '.mol-submit-button': 'LSSubmitButton',
    '.org-auth-screen': 'AuthScreen',
    '.atom-phase-dot': 'LSPhaseDot',
    '.atom-pill': 'LSPill',
  }
}

/**
 * Resolve code search hint from component selector
 */
function resolveCodeSearchHint(component: string, codeMap: ComponentCodeMap): string {
  const hint = codeMap[component]
  if (hint) {
    return hint
  }

  // Log warning for unmapped components
  console.warn(`⚠️  No code mapping for component "${component}", using selector as fallback`)
  return component
}

/**
 * Extract design token from expected value
 */
function extractDesignToken(expected: Record<string, string>): string {
  const values = Object.values(expected)
  for (const value of values) {
    // Match CSS variable pattern: --token-name or --token-name with fallback
    const match = value.match(/--[a-z0-9-]+/i)
    if (match) {
      return match[0]
    }
  }
  return ''
}

/**
 * Load and parse annotation file for bounding box data
 */
function loadAnnotations(annotationsPath: string): { bounding_box?: BoundingBox } | null {
  try {
    if (existsSync(annotationsPath)) {
      const content = readFileSync(annotationsPath, 'utf-8')
      return JSON.parse(content)
    }
  } catch (error) {
    console.warn(`⚠️  Failed to load annotations from ${annotationsPath}: ${error}`)
  }
  return null
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
 * Get minimum severity level from environment
 */
function getMinSeverity(): SeverityLevel {
  const envSeverity = process.env.DESIGN_REVIEW_SEVERITY?.toLowerCase()
  if (envSeverity === 'low' || envSeverity === 'med' || envSeverity === 'high') {
    return envSeverity
  }
  return 'med' // Default
}

/**
 * Check if issue meets minimum severity threshold
 */
function meetsSeverityThreshold(issueSeverity: string, minSeverity: SeverityLevel): boolean {
  const issueLevel = SEVERITY_ORDER[issueSeverity as SeverityLevel]
  const minLevel = SEVERITY_ORDER[minSeverity]
  return issueLevel >= minLevel
}

/**
 * Convert VisualIssue to ReportIssue with all article §5 fields
 */
function toReportIssue(
  issue: VisualIssue,
  entry: ManifestEntry,
  index: number,
  codeMap: ComponentCodeMap,
): ReportIssue {
  const annotationsPath = join(ROOT_DIR, entry.annotations)
  const annotations = loadAnnotations(annotationsPath)
  const boundingBox = annotations?.bounding_box || { x: 0, y: 0, width: 0, height: 0 }

  const designToken = extractDesignToken(issue.expected)
  const observedStr = JSON.stringify(issue.observed)
  const expectedStr = JSON.stringify(issue.expected)

  // Generate issue_id: screen.state.component.issueType-index
  const issueId = `${entry.screen}.${entry.state}.${issue.component}.${issue.issue_type}-${index}`

  return {
    issue_id: issueId,
    screen: entry.screen,
    state: entry.state,
    theme: entry.theme,
    component: issue.component,
    issue_type: issue.issue_type,
    severity: issue.severity,
    confidence: issue.confidence,
    observed: observedStr,
    expected: expectedStr,
    location: {
      bounding_box: boundingBox,
    },
    fix_hint: issue.fix_hint || '',
    design_token: designToken,
    code_search_hint: resolveCodeSearchHint(issue.component, codeMap),
  }
}

/**
 * Aggregate issues from all entries
 */
function aggregateIssues(
  manifest: Manifest,
  evalResults: Map<string, EvalResult>,
  codeMap: ComponentCodeMap,
  minSeverity: SeverityLevel,
): { issues: ReportIssue[]; summary: ReportSummary } {
  const issues: ReportIssue[] = []
  let screensPassed = 0
  let screensFailed = 0
  const severityCounts = { high: 0, med: 0, low: 0 }

  for (const entry of manifest.entries) {
    const evalResult = evalResults.get(entry.id)
    const entryIssues =
      evalResult?.status === 'success' && evalResult.issues ? evalResult.issues : []

    if (entryIssues.length === 0) {
      screensPassed++
    } else {
      screensFailed++
    }

    for (let i = 0; i < entryIssues.length; i++) {
      const issue = entryIssues[i]

      // Filter by severity
      if (!meetsSeverityThreshold(issue.severity, minSeverity)) {
        continue
      }

      severityCounts[issue.severity]++
      const reportIssue = toReportIssue(issue, entry, i, codeMap)
      issues.push(reportIssue)
    }
  }

  const summary: ReportSummary = {
    total: issues.length,
    high: severityCounts.high,
    med: severityCounts.med,
    low: severityCounts.low,
    screens_passed: screensPassed,
    screens_failed: screensFailed,
  }

  return { issues, summary }
}

/**
 * Generate HTML report
 */
function generateHtmlReport(report: DesignReport): string {
  const { issues, summary } = report

  // Group issues by screen/state for better organization
  const issuesByScreen = new Map<string, ReportIssue[]>()
  for (const issue of issues) {
    const key = `${issue.screen} — ${issue.state} (${issue.theme})`
    if (!issuesByScreen.has(key)) {
      issuesByScreen.set(key, [])
    }
    issuesByScreen.get(key)!.push(issue)
  }

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

  // Generate HTML for each screen group
  const entriesHtml = Array.from(issuesByScreen.entries())
    .map(
      ([screenKey, screenIssues]) => `
    <div class="entry">
      <div class="entry-header" onclick="toggleEntry('${screenKey.replace(/[^a-zA-Z0-9]/g, '_')}')">
        <h3>${screenKey}</h3>
        <span class="issue-count">${screenIssues.length} issue(s)</span>
      </div>
      <div class="entry-content" id="entry-${screenKey.replace(/[^a-zA-Z0-9]/g, '_')}">
        ${
          screenIssues.length > 0
            ? `
          <div class="issues">
            <ul class="issue-list">
              ${screenIssues
                .map(
                  (issue) => `
                <li class="issue ${severityClass(issue.severity)}">
                  <div class="issue-header">
                    <span class="issue-component">${issue.component}</span>
                    <span class="issue-severity">${issue.severity.toUpperCase()}</span>
                  </div>
                  <div class="issue-details">
                    <div class="issue-id">${issue.issue_id}</div>
                    <div class="issue-type">${issue.issue_type}</div>
                    <div class="issue-comparison">
                      <strong>Observed:</strong> ${issue.observed}<br/>
                      <strong>Expected:</strong> ${issue.expected}
                    </div>
                    ${issue.fix_hint ? `<div class="issue-hint"><strong>Fix:</strong> ${issue.fix_hint}</div>` : ''}
                    ${issue.design_token ? `<div class="issue-token"><strong>Token:</strong> ${issue.design_token}</div>` : ''}
                    <div class="issue-code-search"><strong>Code:</strong> ${issue.code_search_hint}</div>
                    <div class="issue-location">
                      <strong>Location:</strong> x=${issue.location.bounding_box.x},
                      y=${issue.location.bounding_box.y},
                      w=${issue.location.bounding_box.width},
                      h=${issue.location.bounding_box.height}
                    </div>
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
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
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

    .summary-card.pass {
      border-left-color: #28a745;
    }

    .summary-card h3 {
      font-size: 12px;
      color: #666;
      margin-bottom: 5px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
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

    .issues {
      margin-top: 0;
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

    .issue-id {
      font-size: 11px;
      color: #666;
      margin-bottom: 5px;
      font-family: monospace;
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

    .issue-token {
      margin-top: 8px;
      padding: 8px;
      background: #f0f9ff;
      border-radius: 4px;
      border-left: 3px solid #0ea5e9;
      font-family: monospace;
      font-size: 13px;
    }

    .issue-code-search {
      margin-top: 8px;
      padding: 8px;
      background: #f0fdf4;
      border-radius: 4px;
      border-left: 3px solid #22c55e;
      font-family: monospace;
      font-size: 13px;
    }

    .issue-location {
      margin-top: 8px;
      font-size: 12px;
      color: #666;
      font-family: monospace;
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
      .summary {
        grid-template-columns: 1fr 1fr;
      }
    }
  </style>
</head>
<body>
  <header>
    <h1>Design Review Report</h1>
    <div class="summary">
      <div class="summary-card">
        <h3>Total Issues</h3>
        <div class="value">${summary.total}</div>
      </div>
      <div class="summary-card high">
        <h3>High Severity</h3>
        <div class="value">${summary.high}</div>
      </div>
      <div class="summary-card med">
        <h3>Medium Severity</h3>
        <div class="value">${summary.med}</div>
      </div>
      <div class="summary-card low">
        <h3>Low Severity</h3>
        <div class="value">${summary.low}</div>
      </div>
      <div class="summary-card pass">
        <h3>Screens Passed</h3>
        <div class="value">${summary.screens_passed}</div>
      </div>
      <div class="summary-card">
        <h3>Screens Failed</h3>
        <div class="value">${summary.screens_failed}</div>
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
  minSeverity?: SeverityLevel
}): Promise<DesignReport> {
  const { manifestPath, evalsDir, reportJsonPath, reportHtmlPath, minSeverity } = options

  // Load component code map
  const codeMap = loadComponentCodeMap()

  // Load manifest
  const manifest = loadManifest(manifestPath)

  // Load eval results
  const evalResults = loadEvalResults(evalsDir)

  // Determine severity threshold
  const severityThreshold = minSeverity || getMinSeverity()
  console.log(`🔍 Severity threshold: ${severityThreshold} (include ${severityThreshold} and above)`)

  // Aggregate issues with filtering
  const { issues, summary } = aggregateIssues(manifest, evalResults, codeMap, severityThreshold)

  // Build report with flat issues array
  const report: DesignReport = {
    issues,
    summary,
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

    console.log(`✅ Report generated with ${report.summary.total} issues`)
    console.log(`   - High severity: ${report.summary.high}`)
    console.log(`   - Medium severity: ${report.summary.med}`)
    console.log(`   - Low severity: ${report.summary.low}`)
    console.log(`   - Screens passed: ${report.summary.screens_passed}`)
    console.log(`   - Screens failed: ${report.summary.screens_failed}`)
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
