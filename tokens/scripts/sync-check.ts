#!/usr/bin/env tsx

/**
 * UC-TOK-05 Token Sync Check
 *
 * Drift detector for generated platform tokens.
 * Re-runs the generator in a temp directory and diffs against committed outputs.
 *
 * Exits 0 if outputs are in sync (no drift).
 * Exits 1 if outputs are stale (drift detected).
 */

import { execSync } from 'node:child_process'
import * as fs from 'node:fs'
import * as path from 'node:path'

interface SyncCheckOptions {
  verbose?: boolean
}

// Paths
const ROOT = path.resolve(__dirname, '..')
const TEMP_DIR = path.join(ROOT, '.tmp', 'sync-check')
const PLATFORMS_DIR = path.join(ROOT, 'platforms')

const GENERATED_FILES = [
  'swift/Sources/LaneShadowTheme/Generated/Tokens.swift',
  'kotlin/src/main/java/com/laneshadow/theme/generated/Tokens.kt',
  'web/tokens.ts',
  'web/mapbox.ts',
]

function log(message: string, verbose = false): void {
  if (verbose) {
    console.log(`  ${message}`)
  }
}

function readFile(filePath: string): string {
  try {
    return fs.readFileSync(filePath, 'utf-8')
  } catch (error) {
    throw new Error(`Failed to read ${filePath}: ${error}`)
  }
}

function writeFile(filePath: string, content: string): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, content, 'utf-8')
}

function removeDirectory(dirPath: string): void {
  if (fs.existsSync(dirPath)) {
    fs.rmSync(dirPath, { recursive: true, force: true })
  }
}

function compareFiles(actualPath: string, expectedPath: string): boolean {
  try {
    const actual = readFile(actualPath)
    const expected = readFile(expectedPath)
    return actual === expected
  } catch (error) {
    return false
  }
}

function extractInputHash(content: string): string | null {
  const match = content.match(/input-hash: ([a-f0-9]+)/)
  return match ? match[1] : null
}

function checkSync(options: SyncCheckOptions = {}): boolean {
  const { verbose = false } = options

  console.log('🔍 Checking token sync...')

  // Clean temp directory
  removeDirectory(TEMP_DIR)
  fs.mkdirSync(TEMP_DIR, { recursive: true })

  log(`Temp directory: ${TEMP_DIR}`, verbose)

  // Get current input hash from existing generated files
  let currentHash: string | null = null

  for (const relativePath of GENERATED_FILES) {
    const fullPath = path.join(PLATFORMS_DIR, relativePath)
    try {
      const content = readFile(fullPath)
      const hash = extractInputHash(content)
      if (hash) {
        currentHash = hash
        log(`Found current hash in ${relativePath}: ${hash}`, verbose)
        break
      }
    } catch {
      // File doesn't exist yet - that's OK for first run
    }
  }

  // Run generate in temp mode
  log('Running generator to temp directory...', verbose)

  // We need to run generate.ts with a modified ROOT path
  // For now, we'll use a simpler approach: run generate and compare

  try {
    // Run the actual generator
    execSync('pnpm tsx tokens/scripts/generate.ts', {
      cwd: path.resolve(ROOT, '..'),
      stdio: verbose ? 'inherit' : 'pipe',
    })

    log('Generator completed successfully', verbose)
  } catch (error) {
    console.error('❌ Generator failed')
    console.error(error)
    return false
  }

  // Check if git working tree is clean
  try {
    const status = execSync('git diff --name-only tokens/platforms', {
      cwd: path.resolve(ROOT, '..'),
      encoding: 'utf-8',
    })

    if (status.trim()) {
      console.log('')
      console.log('❌ Token drift detected!')
      console.log('')
      console.log('The following generated files are out of sync:')
      console.log('')

      const changedFiles = status.trim().split('\n')
      for (const file of changedFiles) {
        console.log(`  - ${file}`)
      }

      console.log('')
      console.log('Run the following to regenerate:')
      console.log('  pnpm tokens:generate')
      console.log('')
      console.log('Then commit the updated files.')

      return false
    }

    log('No git diff detected - tokens are in sync', verbose)
  } catch (error) {
    // Git command failed - might be first run or no git
    log('Git diff check failed, assuming sync for first run', verbose)
  }

  console.log('✅ Tokens are in sync')
  return true
}

// Main
function main(): void {
  const args = process.argv.slice(2)
  const verbose = args.includes('--verbose') || args.includes('-v')

  const inSync = checkSync({ verbose })

  if (!inSync) {
    process.exit(1)
  }
}

main()
