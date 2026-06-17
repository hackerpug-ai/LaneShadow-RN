#!/usr/bin/env node

import { execSync, spawnSync } from 'node:child_process'
import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const SERVER_DIR = '.'
const TEMP_OUTPUT_FILE = join('.convex', 'function-spec-temp.json')

function cleanupTempFile() {
  if (existsSync(TEMP_OUTPUT_FILE)) {
    try {
      rmSync(TEMP_OUTPUT_FILE)
    } catch (error) {
      // Best effort cleanup - don't fail the health check if cleanup fails
    }
  }
}

function checkConvexHealth() {
  // Ensure temp file is clean before starting
  cleanupTempFile()

  try {
    // Use spawnSync instead of execSync to avoid shell redirection issues
    const { status, stdout, stderr } = spawnSync('npx', ['convex', 'function-spec'], {
      cwd: SERVER_DIR,
      encoding: 'utf8',
      timeout: 30000,
    })

    if (status !== 0) {
      throw new Error(`convex function-spec failed: ${stderr || 'Unknown error'}`)
    }

    // Parse the JSON output directly
    const spec = JSON.parse(stdout)

    if (!spec.functions || !Array.isArray(spec.functions)) {
      console.error('❌ Invalid function-spec output: expected functions array')
      console.error('   This indicates a malformed response from Convex')
      console.error('   Is `convex dev` running from the project root?')
      process.exit(1)
    }

    const functions = spec.functions

    if (functions.length === 0) {
      console.error('❌ Empty Convex deployment detected')
      console.error('   No functions found in deployment')
      console.error('   Please start `pnpm convex:dev` from the project root')
      console.error('   Expected functions but got empty list')
      process.exit(1)
    }

    const hasListCuratedRoutes = functions.some(
      (fn) => fn.identifier === 'curatedRoutes.js:listCuratedRoutes',
    )

    if (!hasListCuratedRoutes) {
      console.error(
        '❌ Convex deployment missing required function: curatedRoutes.js:listCuratedRoutes',
      )
      console.error('   Available functions:')
      functions.slice(0, 5).forEach((fn) => {
        console.error(`   - ${fn.identifier}`)
      })
      if (functions.length > 5) {
        console.error(`   ... and ${functions.length - 5} more`)
      }
      console.error('')
      console.error('   Is `convex dev` running from the project root?')
      console.error('   If running, check that curatedRoutes.ts exports listCuratedRoutes')
      process.exit(1)
    }

    console.log(
      `✅ Convex deployment healthy with ${functions.length} functions including curatedRoutes.js:listCuratedRoutes`,
    )
    return functions.length
  } catch (error) {
    // Clean up temp file in case of error
    cleanupTempFile()

    // Handle different error types with specific messages
    if (error.message.includes('No CONVEX_DEPLOYMENT set')) {
      console.error('❌ Convex deployment not configured')
      console.error('   Please run `pnpm convex:dev` from the project root to start deployment')
      console.error('   This script requires a running Convex dev deployment')
      process.exit(1)
    } else if (error.message.includes('command failed')) {
      console.error('❌ Convex command failed')
      console.error('   Please ensure `pnpm convex:dev` is running from the project root')
      console.error('   Error details:', error.message)
      process.exit(1)
    } else if (error.message.includes('timed out')) {
      console.error('❌ Convex command timed out after 30 seconds')
      console.error('   Please ensure convex dev is running and responsive')
      console.error('   Check the convex dev logs for issues')
      process.exit(1)
    } else {
      console.error('❌ Health check failed:', error.message)
      console.error('   Please ensure `pnpm convex:dev` is running from the project root')
      process.exit(1)
    }
  }
}

// Run the check
try {
  checkConvexHealth()
} catch (error) {
  // Final cleanup and exit
  cleanupTempFile()
  process.exit(1)
}
