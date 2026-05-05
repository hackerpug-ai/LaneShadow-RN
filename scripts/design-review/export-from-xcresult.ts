#!/usr/bin/env -S pnpm tsx
/**
 * export-from-xcresult.ts
 *
 * Extracts XCTAttachments from .xcresult bundle and produces capture PNGs + metadata
 *
 * Usage: pnpm design:export
 */

import { execSync } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, parse } from 'node:path'
import { homedir } from 'node:os'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const ROOT_DIR = join(__dirname, '../..')
const XCRESULT_PATH = join(ROOT_DIR, 'build/xcresults/design-review.xcresult')
const OUTPUT_DIR = join(ROOT_DIR, '.design-review/captures')

type ExportedAttachmentManifestEntry = {
  attachments: Array<{
    deviceName?: string
    exportedFileName: string
    suggestedHumanReadableName: string
  }>
}

function resolveXcresultPath(preferredPath: string): string | null {
  if (existsSync(preferredPath)) {
    return preferredPath
  }

  const testLogsRoot = join(homedir(), 'Library/Developer/Xcode/DerivedData')
  if (!existsSync(testLogsRoot)) {
    return null
  }

  const laneShadowBundles: string[] = []
  for (const derivedDataEntry of readdirSync(testLogsRoot)) {
    if (!derivedDataEntry.startsWith('LaneShadow-')) {
      continue
    }

    const logsDir = join(testLogsRoot, derivedDataEntry, 'Logs/Test')
    if (!existsSync(logsDir)) {
      continue
    }

    for (const entry of readdirSync(logsDir)) {
      if (entry.endsWith('.xcresult')) {
        laneShadowBundles.push(join(logsDir, entry))
      }
    }
  }

  if (laneShadowBundles.length === 0) {
    return null
  }

  return laneShadowBundles
    .sort((left, right) => statSync(right).mtimeMs - statSync(left).mtimeMs)[0]
}

// Parse attachment name: {screen}.{state}.{action}
export function parseAttachmentName(name: string): {
  screen: string
  state: string
  action: string
} {
  const parts = name.split('.')
  if (parts.length !== 3) {
    throw new Error(`Invalid attachment name format: ${name}`)
  }
  return {
    screen: parts[0],
    state: parts[1],
    action: parts[2],
  }
}

function resolveThemeFromAttachmentName(parsed: {
  state: string
  action: string
}): string | null {
  if (parsed.action === 'light' || parsed.action === 'dark') {
    return parsed.action
  }
  if (parsed.state === 'light' || parsed.state === 'dark') {
    return parsed.state
  }
  return null
}

// Resolve theme from UIUserInterfaceStyle metadata
export function getThemeFromMetadata(metadata: {
  deviceInfo?: { UIUserInterfaceStyle?: string }
}): string {
  const style = metadata.deviceInfo?.UIUserInterfaceStyle
  if (style === 'Dark') {
    return 'dark'
  }
  return 'light'
}

// Main export function
export async function exportFromXcresult(options: {
  xcresultPath: string
  outputDir: string
}): Promise<{
  capturesCount: number
  outputDir: string
}> {
  const { xcresultPath, outputDir } = options
  const resolvedXcresultPath = resolveXcresultPath(xcresultPath)

  // Ensure output directory exists
  mkdirSync(outputDir, { recursive: true })

  // Check if xcresult exists
  if (!resolvedXcresultPath) {
    console.warn(`⚠️  No xcresult found at ${xcresultPath}`)
    console.warn("   Run 'pnpm design:capture' first to generate captures")
    return { capturesCount: 0, outputDir }
  }

  // Export attachments from xcresult using xcresulttool
  const tempExportDir = join(outputDir, 'raw')
  try {
    rmSync(tempExportDir, { recursive: true, force: true })
    mkdirSync(tempExportDir, { recursive: true })

    console.log(`Exporting attachments from ${resolvedXcresultPath}...`)
    execSync(
      `xcrun xcresulttool export attachments --path "${resolvedXcresultPath}" --output-path "${tempExportDir}"`,
      { stdio: 'inherit' },
    )
  } catch (error) {
    console.error('❌ Failed to export from xcresult:', error)
    throw error
  }

  // Find all PNG files in the exported xcresult structure
  console.log('Scanning exported directory for attachments...')
  const capturesCount = await processExportedAttachments({
    exportDir: tempExportDir,
    outputDir,
  })

  console.log('✅ Export complete')
  return { capturesCount, outputDir }
}

// Recursively find all PNG files in a directory
function findPngFiles(dir: string, baseDir: string = dir): string[] {
  const pngFiles: string[] = []

  try {
    const entries = readdirSync(dir)

    for (const entry of entries) {
      const fullPath = join(dir, entry)
      const stat = statSync(fullPath)

      if (stat.isDirectory()) {
        pngFiles.push(...findPngFiles(fullPath, baseDir))
      } else if (entry.toLowerCase().endsWith('.png')) {
        pngFiles.push(fullPath)
      }
    }
  } catch (error) {
    // Directory might not exist or be readable - skip
    console.warn(`Warning: Could not read directory ${dir}: ${error}`)
  }

  return pngFiles
}

// Extract test ID from attachment filename
function extractTestId(attachmentPath: string): string {
  const filename = parse(attachmentPath).name
  // Convert to test_id format: auth-screen.email-entry.load -> test_authScreen_emailEntry_load
  return `test_${filename.replace(/-/g, '').replace(/\./g, '_')}`
}

// Extract device info from xcresult bundle
// Returns default device specs for the simulator used in capture
function extractDeviceInfo(): { device: string; scale_factor: string } {
  return {
    device: 'iPhone 15 Pro',
    scale_factor: '3x',
  }
}

function normalizeSuggestedAttachmentName(name: string): string {
  return name.replace(/_\d+_[A-F0-9-]+(?=\.)/gi, '')
}

function loadExportedAttachmentManifest(exportDir: string): Map<string, string> {
  const manifestPath = join(exportDir, 'manifest.json')
  if (!existsSync(manifestPath)) {
    return new Map()
  }

  const content = readFileSync(manifestPath, 'utf-8')
  const manifest = JSON.parse(content) as ExportedAttachmentManifestEntry[]
  const namesByExportedFile = new Map<string, string>()

  for (const entry of manifest) {
    for (const attachment of entry.attachments) {
      namesByExportedFile.set(
        attachment.exportedFileName,
        normalizeSuggestedAttachmentName(attachment.suggestedHumanReadableName),
      )
    }
  }

  return namesByExportedFile
}

// Process exported attachments and rename them according to {screen}.{state}.{theme}.png
async function processExportedAttachments(options: {
  exportDir: string
  outputDir: string
}): Promise<number> {
  const { exportDir, outputDir } = options
  const exportedNames = loadExportedAttachmentManifest(exportDir)

  // Find all PNG files
  const pngFiles = findPngFiles(exportDir)
  console.log(`Found ${pngFiles.length} PNG files in exported directory`)

  if (pngFiles.length === 0) {
    console.warn('⚠️  No PNG files found in exported xcresult')
    return 0
  }

  let processedCount = 0

  for (const pngFile of pngFiles) {
    try {
      // Extract attachment name from filename
      const exportedFileName = parse(pngFile).base
      const filename = exportedNames.get(exportedFileName) ?? parse(pngFile).name

      // Parse attachment name (screen.state.action format from T03)
      const parsedName = parseAttachmentName(filename)
      const { screen, state } = parsedName

      // Determine theme from device metadata
      const deviceInfo = extractDeviceInfo()
      const metadata = {
        deviceInfo: {
          UIUserInterfaceStyle: 'Light',
        },
      }
      const theme = resolveThemeFromAttachmentName(parsedName) ?? getThemeFromMetadata(metadata)

      // Build output filename: {screen}.{state}.{theme}.png
      const outputFilename = `${screen}.${state}.${theme}.png`
      const outputPath = join(outputDir, outputFilename)

      // Copy/rename PNG file
      renameSync(pngFile, outputPath)

      // Write sidecar JSON metadata file
      const metadataPath = join(outputDir, `${screen}.${state}.${theme}.json`)
      const captureMetadata = {
        test_id: extractTestId(filename),
        screen,
        state,
        theme,
        device: deviceInfo.device,
        scale_factor: deviceInfo.scale_factor,
        dark_mode: theme === 'dark',
        captured_at: new Date().toISOString(),
      }

      writeFileSync(metadataPath, JSON.stringify(captureMetadata, null, 2))

      console.log(`✅ Processed: ${outputFilename}`)
      processedCount++
    } catch (error) {
      console.warn(`⚠️  Skipping ${pngFile}: ${error}`)
    }
  }

  return processedCount
}

// CLI entry point
async function main() {
  console.log('📸 Exporting design review captures from xcresult...')

  const result = await exportFromXcresult({
    xcresultPath: XCRESULT_PATH,
    outputDir: OUTPUT_DIR,
  })

  console.log(`✅ Exported ${result.capturesCount} captures to ${result.outputDir}`)
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('❌ Export failed:', error)
    process.exit(1)
  })
}
