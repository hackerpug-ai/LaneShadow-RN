#!/usr/bin/env node
/**
 * Generate HTML parity report comparing iOS and Android snapshots.
 *
 * Reads snapshots.parity.json and generates an HTML side-by-side diff report
 * at tokens/sandbox/.reports/snapshots-parity.html showing iOS and Android
 * snapshots for every shared story id.
 *
 * Usage: pnpm snapshots:parity-report
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '../..')

interface ParityManifest {
  shared: string[]
  ios_only: string[]
  android_only: string[]
  _note?: string
}

function loadParityManifest(): ParityManifest {
  const manifestPath = join(ROOT, 'tokens/sandbox/snapshots.parity.json')
  if (!existsSync(manifestPath)) {
    throw new Error(`snapshots.parity.json not found at ${manifestPath}`)
  }
  const content = readFileSync(manifestPath, 'utf-8')
  return JSON.parse(content)
}

function iosSnapshotPath(storyId: string, theme: 'light' | 'dark'): string {
  // iOS snapshots are at: ios/LaneShadowTests/__Snapshots__/StorySnapshotTests/test_allStories_lightAndDark_snapshots.{storyId}.{theme}.png
  const snapshotDir = join(ROOT, 'ios/LaneShadowTests/__Snapshots__/StorySnapshotTests')
  const fileName = `test_allStories_lightAndDark_snapshots.${storyId}.${theme}.png`
  return join(snapshotDir, fileName)
}

function androidSnapshotPath(storyId: string, theme: 'light' | 'dark'): string {
  // Android snapshots are at: android/app/src/androidTest/snapshots/{storyId}_{theme}.png
  const snapshotDir = join(ROOT, 'android/app/src/androidTest/snapshots')
  const fileName = `${storyId}_${theme}.png`
  return join(snapshotDir, fileName)
}

function snapshotExists(path: string): boolean {
  return existsSync(path)
}

function relativePathFromRoot(absPath: string): string {
  return absPath.replace(`${ROOT}/`, '')
}

function generateHTML(): string {
  const manifest = loadParityManifest()

  const rows: string[] = []

  for (const storyId of manifest.shared) {
    for (const theme of ['light', 'dark'] as const) {
      const iosPath = iosSnapshotPath(storyId, theme)
      const androidPath = androidSnapshotPath(storyId, theme)

      const iosExists = snapshotExists(iosPath)
      const androidExists = snapshotExists(androidPath)

      const iosImg = iosExists
        ? `<img src="../../../${relativePathFromRoot(iosPath)}" alt="iOS ${storyId} ${theme}" />`
        : '<span class="missing">iOS snapshot missing</span>'

      const androidImg = androidExists
        ? `<img src="../../../${relativePathFromRoot(androidPath)}" alt="Android ${storyId} ${theme}" />`
        : '<span class="missing">Android snapshot missing</span>'

      rows.push(`
        <tr>
          <td class="story-id">${storyId}</td>
          <td class="theme">${theme}</td>
          <td class="snapshot ${iosExists ? '' : 'missing'}">${iosImg}</td>
          <td class="snapshot ${androidExists ? '' : 'missing'}">${androidImg}</td>
        </tr>
      `)
    }
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>iOS / Android Snapshot Parity Report</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      margin: 0;
      padding: 20px;
      background: #f5f5f5;
    }
    h1 { margin: 0 0 20px 0; }
    .meta { color: #666; margin-bottom: 20px; }
    table {
      width: 100%;
      border-collapse: collapse;
      background: white;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    th, td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #ddd;
      vertical-align: top;
    }
    th { background: #f9f9f9; font-weight: 600; }
    .story-id { font-family: monospace; font-size: 14px; }
    .theme { text-transform: capitalize; }
    .snapshot img {
      max-width: 200px;
      border: 1px solid #ddd;
      border-radius: 4px;
    }
    .missing {
      color: #c00;
      font-style: italic;
      font-size: 14px;
    }
    .stats {
      margin-top: 20px;
      padding: 15px;
      background: white;
      border-radius: 4px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
  </style>
</head>
<body>
  <h1>iOS / Android Snapshot Parity Report</h1>
  <div class="meta">
    Generated: ${new Date().toISOString()}<br />
    Shared stories: ${manifest.shared.length}
  </div>

  <table>
    <thead>
      <tr>
        <th>Story ID</th>
        <th>Theme</th>
        <th>iOS Snapshot</th>
        <th>Android Snapshot</th>
      </tr>
    </thead>
    <tbody>
      ${rows.join('')}
    </tbody>
  </table>

  <div class="stats">
    <strong>Statistics:</strong><br />
    Total shared stories: ${manifest.shared.length}<br />
    Total snapshot pairs: ${manifest.shared.length * 2}
  </div>
</body>
</html>`
}

function main() {
  console.log('📊 Generating snapshot parity report...\n')

  try {
    const html = generateHTML()

    // Write report
    const reportDir = join(ROOT, 'tokens/sandbox/.reports')
    if (!existsSync(reportDir)) {
      mkdirSync(reportDir, { recursive: true })
    }

    const reportPath = join(reportDir, 'snapshots-parity.html')
    writeFileSync(reportPath, html, 'utf-8')

    console.log('✅ Parity report generated')
    console.log(`   Output: ${reportPath}\n`)
    console.log('Open the file in a browser to view side-by-side iOS / Android snapshots.\n')
  } catch (error) {
    console.error('❌ Fatal error generating parity report:\n')
    console.error(error instanceof Error ? error.message : String(error))
    process.exit(1)
  }
}

main()
