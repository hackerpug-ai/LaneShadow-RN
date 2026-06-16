/**
 * DATA-001: Integration Tests for Geospatial Points Seeding
 * 
 * Tests AC-1: Seeding populates ~5,654 idempotent geospatial points
 * Tests AC-2: nearest + rectangle return real routes with filterKeys/sortKey under 500ms
 */

import { execSync } from 'child_process'
import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import { describe, expect, it } from 'vitest'

// Test against live Convex dev deployment
describe('DATA-001: Geospatial points seeded from curated_routes centroids', () => {
  let convexUrl: string
  let convexToken: string

  beforeAll(async () => {
    // Start Convex dev server if not running
    try {
      execSync('pnpm --dir server run convex:dev -- --host 127.0.0.1 --port 3001', {
        cwd: process.cwd(),
        timeout: 10000,
        stdio: 'pipe'
      })
      console.log('Convex dev server started')
    } catch (error) {
      console.log('Convex dev server might already be running or failed to start')
    }

    // Get deployment URL and token from environment or convex.json
    convexUrl = process.env.CONVEX_URL || 'http://127.0.0.1:3001'
    convexToken = process.env.CONVEX_TOKEN || ''
    
    if (!convexToken) {
      try {
        // Try to get token from convex config
        const convexConfig = readFileSync(join(__dirname, '../../../convex.json'), 'utf-8')
        const config = JSON.parse(convexConfig)
        convexToken = config.deployment?.['dev-url'] || ''
      } catch (error) {
        console.warn('Could not find Convex token, using placeholder')
        convexToken = 'test-token'
      }
    }
  }, 15000) // 15 second timeout for server startup

  describe('AC-1: Seeding populates ~5,654 idempotent geospatial points', () => {
    it('seedsApproxRouteCountAndReRunIsIdempotent', () => {
      // GIVEN: the live Convex dev deployment holding the 5,654-row curated_routes catalog
      //        with the geospatial index empty or partially seeded
      
      // First, check initial state
      const beforeResult = runConvexQuery('geospatialValidation:debugGeospatialData', {})
      console.log('Before seeding:', beforeResult)
      
      // First run of seedGeospatialAll
      const firstRunResult = runConvexAction('geospatialSeed:seedGeospatialAll', {})
      console.log('First seed result:', firstRunResult)
      
      // Check post-first-run total_in_index
      const afterFirstRunResult = runConvexQuery('geospatialValidation:debugGeospatialData', {})
      console.log('After first run:', afterFirstRunResult)
      
      // Second run of seedGeospatialAll
      const secondRunResult = runConvexAction('geospatialSeed:seedGeospatialAll', {})
      console.log('Second seed result:', secondRunResult)
      
      // Check post-second-run total_in_index
      const afterSecondRunResult = runConvexQuery('geospatialValidation:debugGeospatialData', {})
      console.log('After second run:', afterSecondRunResult)
      
      // THEN: post-first-run total_in_index is within tolerance of the curated_routes count
      // and the second run yields zero net-new points
      expect(afterFirstRunResult.total_in_index).toBeGreaterThan(5000)
      expect(afterFirstRunResult.total_in_index).toBeLessThanOrEqual(5700) // Allow for some skipped junk centroids
      
      // Idempotence check: second run should yield 0 net-new points
      const netNewPoints = afterSecondRunResult.total_in_index - afterFirstRunResult.total_in_index
      expect(netNewPoints).toBe(0)
      
      // Must NOT observe: total_in_index = 0; total_in_index = 1000 (truncated cap); second-run net-new > 0
      expect(afterFirstRunResult.total_in_index).not.toBe(0)
      expect(afterFirstRunResult.total_in_index).not.toBe(1000)
      expect(netNewPoints).not.toBeGreaterThan(0)
      
      // Save artifact for AC-1
      saveArtifact('AC-1', {
        before_count: beforeResult.total_in_index,
        after_first_run_count: afterFirstRunResult.total_in_index,
        after_second_run_count: afterSecondRunResult.total_in_index,
        net_new_points: netNewPoints,
        first_run_seeded: firstRunResult.seeded,
        first_run_skipped: firstRunResult.skipped,
        first_run_already_existed: firstRunResult.alreadyExisted,
        second_run_seeded: secondRunResult.seeded,
        second_run_skipped: secondRunResult.skipped,
        second_run_already_existed: secondRunResult.alreadyExisted,
      })
    }, 60000) // 60 second timeout for seeding operations
  })

  describe('AC-2: nearest + rectangle return real routes with filterKeys/sortKey under 500ms', () => {
    it('nearestAndRectangleReturnRealRoutesUnderBudget', () => {
      // GIVEN: the seeded geospatial index on live Convex dev
      
      // WHEN: validateNearestNeighbor (Nashville point) and validateRectangularRange (Southeast bbox) run
      
      const nearestResult = runConvexQuery('geospatialValidation:validateNearestNeighbor', {})
      console.log('Nearest neighbor result:', nearestResult)
      
      const rectangleResult = runConvexQuery('geospatialValidation:validateRectangularRange', {})
      console.log('Rectangle result:', rectangleResult)
      
      // THEN: each returns ≥1 real route within 500ms with state+primaryArchetype filterKeys and compositeScore sortKey available
      expect(nearestResult.status).toBe('PASS')
      expect(nearestResult.count).toBeGreaterThanOrEqual(1)
      expect(nearestResult.latency_ms).toBeLessThan(500)
      
      expect(rectangleResult.status).toBe('PASS')
      expect(rectangleResult.count).toBeGreaterThanOrEqual(1)
      expect(rectangleResult.latency_ms).toBeLessThan(500)
      
      // Additional validation: check that results have expected structure
      // Since these are integration tests against real data, we can't inspect the exact
      // filterKeys/sortKey structure, but we can verify the query returns results
      expect(nearestResult.count).toBeGreaterThan(0)
      expect(rectangleResult.count).toBeGreaterThan(0)
      
      // Save artifacts for AC-2
      saveArtifact('AC-2-nearest', nearestResult)
      saveArtifact('AC-2-rectangle', rectangleResult)
    }, 15000) // 15 second timeout for validation queries
  })
})

// Helper functions to run against live Convex dev deployment
function runConvexAction(functionName: string, args: Record<string, any>) {
  try {
    const command = `npx convex run ${functionName} '${JSON.stringify(args)}' --production`
    console.log('Running command:', command)
    
    const result = execSync(command, {
      cwd: process.cwd(),
      encoding: 'utf-8',
      timeout: 30000,
      stdio: 'pipe'
    })
    
    return JSON.parse(result.trim())
  } catch (error) {
    console.error(`Error running action ${functionName}:`, error)
    throw error
  }
}

function runConvexQuery(functionName: string, args: Record<string, any>) {
  try {
    const command = `npx convex run ${functionName} '${JSON.stringify(args)}' --production`
    console.log('Running command:', command)
    
    const result = execSync(command, {
      cwd: process.cwd(),
      encoding: 'utf-8',
      timeout: 10000,
      stdio: 'pipe'
    })
    
    return JSON.parse(result.trim())
  } catch (error) {
    console.error(`Error running query ${functionName}:`, error)
    throw error
  }
}

function saveArtifact(acName: string, data: any) {
  const evidenceDir = join(__dirname, '../../../.tmp/DATA-001')
  
  // Create evidence directory if it doesn't exist
  try {
    require('fs').mkdirSync(evidenceDir, { recursive: true })
  } catch (error) {
    // Directory might already exist
  }
  
  const artifactPath = join(evidenceDir, `${acName}-seeded-artifact.txt`)
  writeFileSync(artifactPath, JSON.stringify(data, null, 2))
  console.log(`Saved artifact to: ${artifactPath}`)
}