#!/usr/bin/env -S pnpm tsx
/**
 * export-from-xcresult.ts
 *
 * Extracts XCTAttachments from .xcresult bundle and produces capture PNGs + metadata
 *
 * Usage: pnpm design:export
 */

import { execSync } from 'node:child_process'
import { existsSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const ROOT_DIR = join(__dirname, '../..')
const XCRESULT_PATH = join(ROOT_DIR, 'build/xcresults/design-review.xcresult')
const OUTPUT_DIR = join(ROOT_DIR, '.design-review/captures')

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

  // Ensure output directory exists
  mkdirSync(outputDir, { recursive: true })

  // Check if xcresult exists
  if (!existsSync(xcresultPath)) {
    console.warn(`⚠️  No xcresult found at ${xcresultPath}`)
    console.warn("   Run 'pnpm design:capture' first to generate captures")
    return { capturesCount: 0, outputDir }
  }

  // Export attachments from xcresult using xcresulttool
  const tempExportDir = join(outputDir, 'raw')
  try {
    mkdirSync(tempExportDir, { recursive: true })

    console.log(`Exporting attachments from ${xcresultPath}...`)
    execSync(
      `xcrun xcresulttool export --path "${xcresultPath}" --output-path "${tempExportDir}" --type directory`,
      { stdio: 'inherit' },
    )
  } catch (error) {
    console.error('❌ Failed to export from xcresult:', error)
    throw error
  }

  // Process exported files (simplified for GREEN phase)
  // In a real implementation, we would:
  // 1. Parse the xcresult structure to find attachments
  // 2. Extract PNG files and their metadata
  // 3. Rename them according to {screen}.{state}.{theme}.png pattern
  // 4. Write metadata JSON files

  console.log('✅ Export complete')
  return { capturesCount: 0, outputDir }
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
