#!/usr/bin/env tsx
/**
 * UC-TOK-05 Icons Check
 *
 * Validates that the SVG icon catalog is in sync with the icon manifest.
 * Checks that all icons listed in icons.json have corresponding SVG files.
 *
 * Exits 0 if all icons are present.
 * Exits 1 if any icons are missing.
 */

import * as fs from 'node:fs'
import * as path from 'node:path'

// Paths
const ROOT = path.resolve(__dirname, '..')
const SEMANTIC_DIR = path.join(ROOT, 'semantic')
const ICONS_DIR = path.join(ROOT, 'icons')
const ICONS_JSON = path.join(SEMANTIC_DIR, 'icons.json')

interface IconManifest {
  icons: string[]
}

function loadIconManifest(): string[] {
  if (!fs.existsSync(ICONS_JSON)) {
    console.error(`❌ Icon manifest not found: ${ICONS_JSON}`)
    process.exit(1)
  }

  const content = fs.readFileSync(ICONS_JSON, 'utf-8')
  const manifest = JSON.parse(content) as IconManifest
  return manifest.icons || []
}

function checkIconsExist(icons: string[]): { missing: string[]; present: string[] } {
  const missing: string[] = []
  const present: string[] = []

  for (const icon of icons) {
    const svgPath = path.join(ICONS_DIR, `${icon}.svg`)
    if (fs.existsSync(svgPath)) {
      present.push(icon)
    } else {
      missing.push(icon)
    }
  }

  return { missing, present }
}

function checkExtraFiles(icons: string[]): string[] {
  if (!fs.existsSync(ICONS_DIR)) {
    return []
  }

  const files = fs.readdirSync(ICONS_DIR)
  const extraFiles: string[] = []

  for (const file of files) {
    if (file.endsWith('.svg')) {
      const iconName = file.replace('.svg', '')
      if (!icons.includes(iconName)) {
        extraFiles.push(iconName)
      }
    }
  }

  return extraFiles
}

function main(): void {
  console.log('🔍 Checking icon catalog...')

  const args = process.argv.slice(2)
  const fixturePath = args.find((arg) => arg.startsWith('--fixture='))?.split('=')[1]

  let icons: string[]

  if (fixturePath) {
    // Use fixture file for testing
    console.log(`  Using fixture: ${fixturePath}`)
    const content = fs.readFileSync(fixturePath, 'utf-8')
    const manifest = JSON.parse(content) as IconManifest
    icons = manifest.icons || []
  } else {
    // Load from actual manifest
    icons = loadIconManifest()
  }

  console.log(`  Checking ${icons.length} icons...`)

  // Check for missing icons
  const { missing, present } = checkIconsExist(icons)

  // Check for extra SVG files not in manifest
  const extraFiles = checkExtraFiles(icons)

  // Report results
  if (missing.length > 0) {
    console.log('')
    console.log('❌ Missing SVG files:')
    console.log('')
    for (const icon of missing) {
      console.log(`  - ${icon}.svg`)
    }
    console.log('')
    console.log(`Expected: ${ICONS_DIR}/{icon}.svg`)
  }

  if (extraFiles.length > 0) {
    console.log('')
    console.log('⚠️  Extra SVG files (not in manifest):')
    console.log('')
    for (const icon of extraFiles) {
      console.log(`  - ${icon}.svg`)
    }
    console.log('')
    console.log('Add these to tokens/semantic/icons.json or remove them.')
  }

  if (missing.length === 0 && extraFiles.length === 0) {
    console.log(`✅ All ${present.length} icons present and accounted for`)
    console.log('')
    console.log('Icon catalog is valid.')
    process.exit(0)
  }

  if (missing.length > 0) {
    console.log('')
    console.log('Add missing SVG files to tokens/icons/')
    console.log('or remove the entries from tokens/semantic/icons.json')
    process.exit(1)
  }

  // Only extra files (warning, not error)
  process.exit(0)
}

main()
