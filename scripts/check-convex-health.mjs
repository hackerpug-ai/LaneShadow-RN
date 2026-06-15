#!/usr/bin/env node

import { execSync } from 'child_process'
import { writeFileSync, readFileSync } from 'fs'
import { join } from 'path'

const SERVER_DIR = 'server'
const TEMP_OUTPUT_FILE = join(SERVER_DIR, 'function-spec-temp.json')

function checkConvexHealth() {
  try {
    // Save function-spec output to temp file
    execSync('npx convex function-spec > function-spec-temp.json', {
      cwd: SERVER_DIR,
      encoding: 'utf8',
      timeout: 30000
    })

    // Read and parse the JSON file
    const stdout = readFileSync(TEMP_OUTPUT_FILE, 'utf8')
    const spec = JSON.parse(stdout)
    
    if (!spec.functions || !Array.isArray(spec.functions)) {
      console.error('❌ Expected spec.functions to be an array')
      process.exit(1)
    }

    const functions = spec.functions

    if (functions.length === 0) {
      console.error('❌ Convex deployment is empty - is `convex dev` running from server/?')
      console.error('   Expected functions but got empty list')
      process.exit(1)
    }

    const hasListCuratedRoutes = functions.some(
      (fn) => fn.identifier === 'curatedRoutes.js:listCuratedRoutes'
    )

    if (!hasListCuratedRoutes) {
      console.error('❌ Convex deployment missing required function: curatedRoutes.js:listCuratedRoutes')
      console.error('   Available functions:')
      functions.slice(0, 5).forEach((fn) => {
        console.error(`   - ${fn.identifier}`)
      })
      if (functions.length > 5) {
        console.error(`   ... and ${functions.length - 5} more`)
      }
      console.error('')
      console.error('   Is `convex dev` running from server/?')
      process.exit(1)
    }

    console.log(`✅ Convex deployment healthy with ${functions.length} functions including curatedRoutes.js:listCuratedRoutes`)
    return functions.length
  } catch (error) {
    console.error('❌ Health check failed:', error.message)
    process.exit(1)
  }
}

checkConvexHealth()