#!/usr/bin/env -S pnpm tsx
/**
 * build-manifest.ts
 *
 * Joins captures + references + annotations into a unified manifest
 *
 * Usage: pnpm design:manifest
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const ROOT_DIR = join(__dirname, '../..')
const CAPTURES_DIR = join(ROOT_DIR, '.design-review/captures')
const REFS_DIR = join(ROOT_DIR, '.spec/design/system/refs')
const MANIFEST_PATH = join(ROOT_DIR, '.design-review/manifest.json')

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

// Build manifest by joining captures + references + annotations
export async function buildManifest(options: {
  capturesDir: string
  refsDir: string
  outputPath: string
}): Promise<Manifest> {
  const { capturesDir, refsDir, outputPath } = options

  // Ensure output directory exists
  mkdirSync(dirname(outputPath), { recursive: true })

  const entries: ManifestEntry[] = []
  const missingPairs: string[] = []

  // Check if directories exist
  if (!existsSync(capturesDir)) {
    throw new Error(`Captures directory not found: ${capturesDir}`)
  }

  if (!existsSync(refsDir)) {
    throw new Error(`References directory not found: ${refsDir}`)
  }

  // Read all capture metadata files
  const captureFiles = readdirSync(capturesDir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => join(capturesDir, f))

  // For each capture, check if corresponding reference exists
  for (const captureFile of captureFiles) {
    try {
      const captureMetadata = JSON.parse(readFileSync(captureFile, 'utf-8'))
      const { screen, state, theme } = captureMetadata

      // Build reference path
      const referencePath = join(refsDir, screen, `${state}.${theme}.png`)
      const annotationsPath = join(refsDir, screen, `${state}.annotations.json`)

      // Check if reference exists
      if (!existsSync(referencePath)) {
        missingPairs.push(`Missing reference for (${screen}, ${state}, ${theme})`)
        continue
      }

      // Check if annotations exist
      if (!existsSync(annotationsPath)) {
        missingPairs.push(`Missing annotations for (${screen}, ${state})`)
        continue
      }

      // Add entry to manifest
      entries.push({
        id: `${screen}.${state}.${theme}`,
        screen,
        state,
        theme,
        captured: join(capturesDir, `${screen}.${state}.${theme}.png`),
        captured_metadata: captureFile,
        reference: referencePath,
        annotations: annotationsPath,
      })
    } catch (error) {
      console.error(`Error processing capture ${captureFile}:`, error)
      throw error
    }
  }

  // Check for missing pairs and fail if any found
  if (missingPairs.length > 0) {
    const errorMessage = `Missing pairings detected:\n${missingPairs.map((p) => `  - ${p}`).join('\n')}`
    console.error(`❌ ${errorMessage}`)
    throw new Error(errorMessage)
  }

  const manifest: Manifest = {
    entries,
    generated_at: new Date().toISOString(),
  }

  // Write manifest to file
  writeFileSync(outputPath, JSON.stringify(manifest, null, 2))
  console.log(`✅ Manifest written to ${outputPath}`)

  return manifest
}

// CLI entry point
async function main() {
  console.log('🔨 Building design review manifest...')

  try {
    const manifest = await buildManifest({
      capturesDir: CAPTURES_DIR,
      refsDir: REFS_DIR,
      outputPath: MANIFEST_PATH,
    })

    console.log(`✅ Built manifest with ${manifest.entries.length} entries`)
  } catch (error) {
    console.error('❌ Manifest build failed:', error)
    process.exit(1)
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('❌ Manifest build failed:', error)
    process.exit(1)
  })
}
