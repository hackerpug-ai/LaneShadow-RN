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
// Reference PNGs and annotations live under
// `.spec/design/system/views/<folder>/<state>/` where <folder> resolves
// through SCREEN_TO_FOLDER below, per the 2026-05-15 VIEW-MAP-aligned
// reorganization (auth/ as a sibling of mapapp/; six MapApp states nested
// under mapapp/<view>/). The legacy flat `refs/<screen>/<state>.<theme>.png`
// path is deprecated. See `.spec/prds/v3-integration/VIEW-MAP.md`.
const VIEWS_DIR = join(ROOT_DIR, '.spec/design/system/views')
const MANIFEST_PATH = join(ROOT_DIR, '.design-review/manifest.json')

// Bridge `data-screen` capture identifiers (legacy `-screen` slugs, kept
// stable for sandbox story id compatibility) to the new IA-aligned folder
// path under views/. Must be kept in sync with render-references.ts.
const SCREEN_TO_FOLDER: Record<string, string> = {
  'auth-screen': 'auth',
  'idle-screen': 'mapapp/idle',
  'planning-screen': 'mapapp/planning',
  'route-results-screen': 'mapapp/route-results',
  'route-details-screen': 'mapapp/route-details',
  'sessions-screen': 'mapapp/sessions-drawer',
  'error-screen': 'mapapp/error',
}

function resolveViewFolder(screen: string): string {
  return SCREEN_TO_FOLDER[screen] ?? screen
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

function requestedScreensFromEnv(): Set<string> | null {
  const raw = process.env.DESIGN_REVIEW_SCREENS?.trim()
  if (!raw) {
    return null
  }

  const screens = raw
    .split(',')
    .map((screen) => screen.trim())
    .filter(Boolean)

  return screens.length > 0 ? new Set(screens) : null
}

// Build manifest by joining captures + references + annotations
// `refsDir` parameter name is preserved for backward compatibility with tests, but it now
// expects the views/ root (`.spec/design/system/views/`) and uses the per-state subfolder
// layout `<refsDir>/<screen>/<state>/<state>.<theme>.png` per the 2026-05-15 reorganization.
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
  const requestedScreens = requestedScreensFromEnv()

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

      if (requestedScreens && !requestedScreens.has(screen)) {
        continue
      }

      // Build reference path per the 2026-05-15 VIEW-MAP-aligned layout:
      //   .spec/design/system/views/<folder>/<state>/<state>.<theme>.png
      //   .spec/design/system/views/<folder>/<state>/<state>.annotations.json
      // where <folder> resolves to either `auth/` or `mapapp/<view>/`.
      const viewFolder = resolveViewFolder(screen)
      const referencePath = join(refsDir, viewFolder, state, `${state}.${theme}.png`)
      const annotationsPath = join(refsDir, viewFolder, state, `${state}.annotations.json`)

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

  // Warn about missing pairs but don't crash — allow partial manifests
  if (missingPairs.length > 0) {
    console.warn(
      `⚠️  Skipped ${missingPairs.length} capture(s) with missing references:\n${missingPairs.map((p) => `  - ${p}`).join('\n')}`,
    )
  }

  if (entries.length === 0 && captureFiles.length === 0) {
    console.warn('⚠️  No captures found — manifest will be empty')
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
      refsDir: VIEWS_DIR,
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
